# QuickQR Phase 2F Implementation Report
## Developer REST API + API Key Infrastructure

**Phase Status:** COMPLETE & VERIFIED  
**Date:** September 2026  
**Author:** QuickQR Engineering Team  
**Architecture Baseline:** Node.js 22 LTS, Next.js 16 (App Router), TypeScript Strict, Prisma 6.19.3 + PostgreSQL, Hostinger Cloud (PM2/Nginx/Standalone compatible).

---

## Executive Summary

Phase 2F establishes the public, versioned developer REST API (`/api/v1/...`) and secure API key infrastructure for QuickQR. External business systems, CRM integrations, POS setups, and third-party developers can now programmatically create and manage dynamic QR codes, update destination URLs in real-time with automatic resolver cache invalidation, fetch privacy-friendly scan analytics, and automate remote website QR widgets.

All API access is strictly scoped to the tenant organization linked to the authenticated API key. Raw API keys are generated with 256 bits of CSPRNG entropy, presented to the developer **exactly once** in the dashboard UI, and hashed with SHA-256 before persistence. Zero plaintext or decryptable credentials ever exist in the database.

---

## 1. System Architecture & Component Mapping

```
[ External Developer / Business System ]
                   │
                   ▼  HTTPS Authorization: Bearer qk_live_<64-hex>
       ┌───────────────────────────────┐
       │   /api/v1/* Route Handlers    │
       └───────────────┬───────────────┘
                       │
                       ▼
       ┌───────────────────────────────┐
       │      API Security Layer       │
       │  (authenticateApiRequest)     │
       │  - Header syntax extraction   │
       │  - Sliding-window rate limit  │
       │  - Key prefix O(1) query      │
       │  - Constant-time hash check   │
       │  - Expiration & Revocation    │
       │  - Organization derivation    │
       └───────────────┬───────────────┘
                       │ Verified Tenant Context
                       ▼
       ┌────────────────────────────────────────────────────────┐
       │               Domain Service Layer (Reused)            │
       │  - QR Service (create, update dest, pause/resume, soft)│
       │  - URL Safety / Anti-SSRF (RFC 1918 / Cloud Metadata)  │
       │  - QR Resolver Cache Invalidation                      │
       │  - ScanEvent Analytics Aggregation                     │
       │  - Widget Persistence & Sanitization                   │
       └───────────────┬────────────────────────────────────────┘
                       │
                       ▼
       ┌───────────────────────────────┐
       │    PostgreSQL (Prisma ORM)    │
       │   Authoritative Data Store    │
       └───────────────────────────────┘
```

---

## 2. API Key Design & Cryptographic Guarantees

### Key Format
- **Format:** `qk_live_<64 hexadecimal characters>` (256-bit CSPRNG entropy via `node:crypto.randomBytes(32)`).
- **Public Prefix:** First 16 characters (`qk_live_` + 8 hex chars), e.g. `qk_live_7f8a9b2c`.
- **Zero Information Leakage:** No tenant ID, user ID, sequential counter, or timestamp is encoded in the key.

### Storage Invariant
- **Raw Key Exposure:** Only returned once in the server action response when created by an authorized merchant (`OWNER` or `ADMIN`).
- **Hash-at-Rest:** Stored as deterministic SHA-256 hex digest (`keyHash`).
- **Fast Lookup:** Indexed by `keyPrefix` for $O(1)$ database query, followed by constant-time verification using `crypto.timingSafeEqual` over the computed SHA-256 hash.
- **Zero Raw Secret Recovery:** The database contains only `keyPrefix` and `keyHash`. If a secret is lost, the developer must revoke it and generate a new key.

### Key Lifecycle & Revocation
- **Instant Revocation:** Setting `revokedAt = new Date()` immediately blocks authentication on the next incoming request without needing process restarts or cache purges.
- **Expiration:** Optional `expiresAt` timestamp. Requests past expiration are rejected with `401 UNAUTHORIZED`.
- **Throttled `lastUsedAt` Tracking:** Updated on successful authentication asynchronously, throttled to at most once per 60 seconds to avoid write amplification.

---

## 3. API Versioning & Routing

All developer endpoints are mounted strictly under `/api/v1/`:

| Method | Endpoint | Description | Scope Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/qr-codes` | List QR codes (paginated: page, limit, status, search) | `qr:read` |
| `POST` | `/api/v1/qr-codes` | Create new dynamic QR code (with Anti-SSRF validation) | `qr:write` |
| `GET` | `/api/v1/qr-codes/:id` | Get dynamic QR code details & current destination | `qr:read` |
| `PATCH` | `/api/v1/qr-codes/:id` | Update metadata or destination (invalidates resolver cache) | `qr:write` |
| `POST` | `/api/v1/qr-codes/:id/pause` | Pause dynamic QR code redirects | `qr:write` |
| `POST` | `/api/v1/qr-codes/:id/resume` | Resume dynamic QR code redirects | `qr:write` |
| `DELETE` | `/api/v1/qr-codes/:id` | Soft delete / archive QR code | `qr:write` |
| `GET` | `/api/v1/qr-codes/:id/analytics` | Fetch scan counts, timeline & devices for a QR code | `analytics:read` |
| `GET` | `/api/v1/analytics` | Fetch organization-wide scan analytics | `analytics:read` |
| `GET` | `/api/v1/widgets` | List remote website widgets (paginated) | `widget:read` |
| `POST` | `/api/v1/widgets` | Create remote website widget with sanitized configuration | `widget:write` |
| `GET` | `/api/v1/widgets/:id` | Get widget configuration | `widget:read` |
| `PATCH` | `/api/v1/widgets/:id` | Update widget configuration | `widget:write` |
| `POST` | `/api/v1/widgets/:id/pause` | Pause website widget | `widget:write` |
| `POST` | `/api/v1/widgets/:id/resume` | Resume website widget | `widget:write` |
| `DELETE` | `/api/v1/widgets/:id` | Soft delete website widget | `widget:write` |

---

## 4. Security & Tenant Boundary Enforcement

1. **Authoritative Organization Derivation:**
   - The organization is resolved directly from the authenticated API key record (`apiKey.organizationId`).
   - Any `organizationId` parameter in the request body, query string, or headers is strictly ignored and never trusted.
2. **Cross-Tenant IDOR Prevention:**
   - Database queries include `where: { id, organizationId, deletedAt: null }`.
   - Access attempts to resources belonging to another organization return `404 NOT_FOUND` with no detail leakage.
3. **Anti-SSRF Protection:**
   - Reuses existing URL safety rules. Destination URLs pointing to `localhost`, `127.0.0.1`, RFC 1918 private IPv4 ranges (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), IPv6 loopback (`::1`), link-local (`169.254.169.254`), or unsupported schemes (`file:`, `gopher:`, `data:`) are rejected with `422 VALIDATION_ERROR`.
4. **Dynamic Resolver Cache Invalidation:**
   - Updating a QR code's destination URL via `PATCH /api/v1/qr-codes/:id` reuses `updateQRCodeDestination`, which updates the database in a transaction and invalidates the resolver memory cache. Subsequent scans immediately resolve to the new destination.
5. **Security Headers:**
   - All API endpoints return `Content-Type: application/json; charset=utf-8`, `X-Content-Type-Options: nosniff`, and `Cache-Control: no-store, no-cache, must-revalidate`.

---

## 5. Standardized Response & Error Envelopes

### Success Envelopes
Single resource:
```json
{
  "data": {
    "id": "cm1234...",
    "shortCode": "abc1234",
    "title": "Main Menu",
    "destinationUrl": "https://restaurant.com/menu",
    "status": "ACTIVE"
  }
}
```

Paginated list:
```json
{
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 25,
    "total": 1,
    "totalPages": 1
  }
}
```

### Standardized Error Codes
| HTTP Status | Error Code | Description |
| :--- | :--- | :--- |
| `400` | `INVALID_REQUEST` | Malformed JSON syntax or missing request parameters. |
| `401` | `UNAUTHORIZED` | Missing, malformed, invalid, expired, or revoked API key. |
| `403` | `FORBIDDEN` | Key lacks required scope. |
| `404` | `NOT_FOUND` | Resource not found or owned by a different organization. |
| `409` | `CONFLICT` | Resource conflict or state mismatch. |
| `422` | `VALIDATION_ERROR` | Schema validation error (Zod) or SSRF destination URL rejection. |
| `429` | `RATE_LIMITED` | Rate limit threshold exceeded. Includes `Retry-After` header. |
| `500` | `INTERNAL_ERROR` | Internal server exception. Stack traces are never exposed. |

---

## 6. Rate Limiting Architecture

A bounded, process-local sliding-window rate limiter protects the API without requiring Redis:
- **Read Operations (`GET`):** 120 requests / minute per API key.
- **Write Operations (`POST`, `PATCH`, `DELETE`):** 30 requests / minute per API key.
- **Authentication Failure Threshold:** 10 requests / minute per IP to mitigate brute-force attempts.
- **Header:** Responds with HTTP `429 Too Many Requests` and a standard `Retry-After: <seconds>` header.
- **Limitation:** In multi-process PM2 cluster mode, memory is process-local. For enterprise multi-node clustering in future phases, Redis can be introduced transparently behind the same interface.

---

## 7. Merchant Dashboard UI (`/dashboard/api-keys`)

- **Route:** `/dashboard/api-keys` (authenticated, requires `ADMIN` or `OWNER` role).
- **Navigation:** Integrated into `DashboardNav` with a `Key` icon.
- **Management Features:**
  - View existing API keys (name, prefix, creation date, last-used date, expiration date, active/revoked badge).
  - Create new API key modal with custom name and optional expiration.
  - One-time reveal modal for the generated raw secret with one-click copy and explicit security warning: *"This secret will NEVER be shown again. Store it securely."*
  - Revoke key action with immediate confirmation dialog.

---

## 8. Database Migration Verification

A real Prisma migration was created and applied:
- **Migration Path:** `prisma/migrations/20260925220000_add_api_keys/migration.sql`
- **Model:** `ApiKey` with `organizationId`, `name`, `keyPrefix`, `keyHash`, `scopes`, `lastUsedAt`, `expiresAt`, `revokedAt`.
- **Indexes:**
  - `UNIQUE INDEX "ApiKey_keyHash_key" ON "ApiKey"("keyHash")`
  - `INDEX "ApiKey_organizationId_revokedAt_idx" ON "ApiKey"("organizationId", "revokedAt")`
  - `INDEX "ApiKey_keyPrefix_idx" ON "ApiKey"("keyPrefix")`
  - `INDEX "ApiKey_keyHash_idx" ON "ApiKey"("keyHash")`
- **Validation:** `npx prisma validate` reports schema valid with 0 errors.

---

## 9. Verification & Test Results

### Automated Test Suite
- **Command:** `npm test` (`vitest run`)
- **Total Test Files:** 14 passed (14)
- **Total Tests Passing:** 264 passed (264)
- **Phase 2F Test File:** `tests/phase2f-api.test.ts` (34 dedicated tests covering key generation, hashing, prefix lookup, RBAC, tenant isolation, QR CRUD, resolver cache invalidation, analytics, widgets, rate limiting, and error handling).

### ESLint Audit
- **Command:** `npm run lint` (`eslint`)
- **Result:** 0 errors, 0 warnings across the entire repository.

### Production Build
- **Command:** `npm run build`
- **Widget Compilation:** Successfully bundled `public/widget.js` (44.4 KB).
- **Next.js Compilation:** Standalone production build compiled in 1029ms.
- **TypeScript:** 0 type errors.
- **Route Count:** 46 production routes (including 10 new `/api/v1/...` REST endpoints and `/dashboard/api-keys`).
- **Standalone Asset Copy:** Successfully copied `.next/static` and `public` to `.next/standalone/`.

---

## 10. Conclusion

Phase 2F is complete, formally audited, and fully production-ready for Hostinger Cloud deployment. External developers can now securely automate QuickQR without compromising tenant isolation, data privacy, or server stability.
