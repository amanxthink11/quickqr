# QuickQR India — Phase 2B Implementation Report
**Dynamic QR Redirect Engine**  
**Date:** September 2026  
**Status:** **PHASE 2B COMPLETE**

---

## 1. Executive Summary

Phase 2B implements the production dynamic QR code redirection engine for QuickQR India. It provides a lightweight, sub-millisecond, cache-ready HTTP 302 resolution pipeline connecting public scan requests at `/q/{shortCode}` to merchant-managed destination URLs.

All implementation strictly conforms to [PHASE_2_ARCHITECTURE.md](file:///F:/QR-Web/PHASE_2_ARCHITECTURE.md), [PHASE_2A_ARCHITECTURE_REVIEW.md](file:///F:/QR-Web/PHASE_2A_ARCHITECTURE_REVIEW.md), and [PHASE_2A_IMPLEMENTATION_REPORT.md](file:///F:/QR-Web/PHASE_2A_IMPLEMENTATION_REPORT.md).

No Phase 2C+ functionality was implemented (no scan analytics, no GeoIP, no ScanEvent tracking, no merchant dashboard analytics, no campaigns, no billing, no Redis). Phase 1 static QR functionality and Phase 2A authentication/RBAC remain 100% operational with **157 / 157 tests passing** (81 Phase 1 + 40 Phase 2A + 36 Phase 2B).

---

## 2. Dynamic Redirect Architecture

```
Client Scan (e.g. https://qr.quickqr.in/q/abc1234)
                     │
                     ▼
         Next.js Route Handler
      (GET /q/[shortCode]/route.ts)
                     │
         [Syntactic Regex Guard] ──── Invalid ───► 302 /q-status/not-found
                     │ Valid (7-char Base62)
                     ▼
            Resolver Service
      (src/lib/qr/resolver.ts)
                     │
          [Bounded In-Memory Cache] ── Hit ──────► 302 Destination URL
                     │ Miss
                     ▼
          Lean PostgreSQL Query
        (Indexed lookup by shortCode)
                     │
          [Status & Expiry Guard] ─── Inactive ──► 302 /q-status/paused | expired | not-found
                     │ Active
                     ▼
      [Anti-SSRF RFC 3986 Validation] ─ Malicious ─► 302 /q-status/not-found
                     │ Clean HTTP(S)
                     ▼
        HTTP 302 Location Redirect
         (Preserves exact query)
```

---

## 3. Route Handler (`/q/[shortCode]`)

- **File:** [`src/app/q/[shortCode]/route.ts`](file:///F:/QR-Web/src/app/q/%5BshortCode%5D/route.ts)
- **Method:** `GET`
- **Dynamic Configuration:** `export const dynamic = 'force-dynamic'`
- **Parameters:** Asynchronously resolves `context.params` adhering to Next.js 16 requirements (`await context.params`).
- **Response Format:**
  - **Success:** Direct `HTTP 302 Found` with `Location` header set to the authentic merchant destination URL.
  - **Headers:**
    - `Cache-Control: private, no-cache, no-store, max-age=0, must-revalidate` (prevents permanent browser caching of dynamic QR endpoints).
    - `X-Robots-Tag: noindex, nofollow` (prevents crawler indexing of short redirect URLs).
  - **Redirect Responses for Inactive / Invalid States:**
    - Paused: `HTTP 302` to `/q-status/paused`
    - Expired: `HTTP 302` to `/q-status/expired`
    - Invalid Code / Nonexistent / Missing Destination / Malicious: `HTTP 302` to `/q-status/not-found`

---

## 4. Resolver Service & Syntactic Validation

- **File:** [`src/lib/qr/resolver.ts`](file:///F:/QR-Web/src/lib/qr/resolver.ts)
- **ShortCode Syntax Rule:**
  - Strictly 7 alphanumeric characters from Base62 set (`[0-9a-zA-Z]`).
  - Regex: `/^[0-9a-zA-Z]{7}$/`.
  - Rejects empty, too short, too long, spaces, symbols, and Unicode before any database or cache operation.
- **Resolver Function:** `resolveDynamicQRCode(shortCode, options?)` returning `ResolveQRResult`.
- **Information Hiding:**
  - Database IDs, `organizationId`, user identities, pricing tiers, and internal stack traces are never exposed to public callers.

---

## 5. Database Query Strategy

- **Indexed Lookup:** Leverages PostgreSQL unique B-tree index on `QRCode.shortCode`.
- **Lean Column Selection:** Minimizes network payload and memory overhead by selecting only required routing fields:
  ```ts
  const qrCode = await prisma.qRCode.findUnique({
    where: { shortCode },
    select: {
      id: true,
      status: true,
      expiresAt: true,
      deletedAt: true,
      destinations: {
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: {
          id: true,
          qrCodeId: true,
          destinationUrl: true,
          isActive: true,
        },
      },
    },
  });
  ```
- **Zero Information Leakage:** Does **not** select `title`, `styling`, `scanLimit`, `organizationId`, or any `User` or `Membership` relations.

---

## 6. Status Handling & Branded Status Pages

Only `ACTIVE` QR codes with valid future expiration dates and active destinations are permitted to redirect.

| Condition | Resolver Status | HTTP Response |
| :--- | :--- | :--- |
| `status === 'ACTIVE'` and not expired | `SUCCESS` | `302 -> Destination URL` |
| `status === 'PAUSED'` | `PAUSED` | `302 -> /q-status/paused` |
| `status === 'EXPIRED'` or `expiresAt <= now` | `EXPIRED` | `302 -> /q-status/expired` |
| `deletedAt !== null` | `NOT_FOUND` | `302 -> /q-status/not-found` |
| QR not in database | `NOT_FOUND` | `302 -> /q-status/not-found` |
| Malformed shortCode | `INVALID_CODE` | `302 -> /q-status/not-found` |
| No active destinations | `MISSING_DESTINATION` | `302 -> /q-status/not-found` |
| Unsafe / SSRF target | `INVALID_DESTINATION` | `302 -> /q-status/not-found` |

### Branded Status Pages
- [`src/app/q-status/paused/page.tsx`](file:///F:/QR-Web/src/app/q-status/paused/page.tsx): Mobile-responsive card explaining that the owner temporarily paused the code.
- [`src/app/q-status/expired/page.tsx`](file:///F:/QR-Web/src/app/q-status/expired/page.tsx): Explaining that the promotion/link has expired.
- [`src/app/q-status/not-found/page.tsx`](file:///F:/QR-Web/src/app/q-status/not-found/page.tsx): Explaining that the QR code could not be located.
- **Crawler Protection:** All status pages enforce `robots: { index: false, follow: false }`.

---

## 7. URL Security & Open Redirect Defense

### Re-used Anti-SSRF Safety Engine ([`src/lib/validation/url-safety.ts`](file:///F:/QR-Web/src/lib/validation/url-safety.ts))
At resolution time, the destination is re-validated through `validateDestinationUrl()` before redirecting:
- **Allowed Protocols:** Strictly `https:` and `http:`.
- **Blocked Protocols:** `javascript:`, `data:`, `file:`, `blob:`, `vbscript:`, `about:`, `chrome:`.
- **Blocked Loopback:** `localhost`, `127.0.0.1`, `[::1]`, `0.0.0.0`.
- **Blocked Private Subnets (RFC 1918):** `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`.
- **Blocked Cloud Metadata:** `169.254.169.254` (prevents cloud IAM token exfiltration).
- **Blocked Internal TLDs:** `.local`, `.internal`, `.lan`, `.corp`, `.home`.

### Open Redirect Defense
- The public redirect route accepts **no destination parameters** (`?url=...`, `?destination=...`, `?redirect=...`).
- Any query parameter passed to `/q/{shortCode}` is completely ignored; destination resolution is bound 100% to the authenticated database record.
- Destination management remains strictly authenticated and tenant-isolated via Phase 2A server actions and RBAC guards.

### Threat Limitation Disclosure
- URL syntactic validation prevents protocol execution and internal network probing. It cannot determine if a third-party public web domain hosts social engineering or malware content. Periodic threat intelligence feeds or merchant KYC can be layered in future phases.

---

## 8. Cache-Ready Design (No Redis)

A minimal, bounded in-memory cache ([`BoundedResolverCache`](file:///F:/QR-Web/src/lib/qr/resolver.ts)) is integrated:
- **Capacity:** Strictly bounded at 1,000 entries with FIFO eviction when capacity is reached.
- **TTL:** 30 seconds (`CACHE_TTL_MS = 30000`).
- **Scope:** Caches only successful resolutions of active QR codes.
- **Bypass / Disable Support:** Can be disabled via `DISABLE_QR_RESOLVER_CACHE=true` or cleared via `resolverCache.clear()`.
- **Redis Compatibility:** Structured cleanly so that in Phase 2D a distributed Redis adapter can replace `BoundedResolverCache` without altering route handlers or query patterns.

---

## 9. Environment Variables Configuration

Updated [`.env.example`](file:///F:/QR-Web/.env.example):
```env
# Public Dynamic QR Redirect Base URL (Phase 2B)
# Development: http://localhost:3000
# Staging:     https://staging-qr.quickqr.in
# Production:  https://qr.quickqr.in
NEXT_PUBLIC_QR_BASE_URL="http://localhost:3000"
```

The helper [`getQRBaseUrl()`](file:///F:/QR-Web/src/lib/qr/resolver.ts) cleanly resolves `process.env.NEXT_PUBLIC_QR_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'` with trailing slash trimming.

---

## 10. Automated Testing Suite

All **157 automated tests** pass across 10 test suites:

```bash
✓ tests/widget.test.ts (10 tests)
✓ tests/qr-payloads.test.ts (17 tests)
✓ tests/table-stand.test.ts (8 tests)
✓ tests/qr-download.test.ts (8 tests)
✓ tests/qr-validation.test.ts (22 tests)
✓ tests/upi-stand.test.ts (10 tests)
✓ tests/phase2b-redirect.test.ts (36 tests)
✓ tests/qr-decoding.test.ts (6 tests)
✓ tests/phase2a-flows.test.ts (8 tests)
✓ tests/phase2a.test.ts (32 tests)

Test Files: 10 passed (10)
Tests:      157 passed (157)
Lint:       0 errors, 0 warnings
Build:      Successful (Next.js Standalone Mode with 25 routes)
```

### Coverage Highlights in [`tests/phase2b-redirect.test.ts`](file:///F:/QR-Web/tests/phase2b-redirect.test.ts):
- **Syntactic Validation:** 7-character Base62 boundary checks (empty, 6 chars, 8 chars, symbols, spaces).
- **Resolution & Parameter Preservation:** Verified that complex query parameters (`?ref=...&utm_source=...#payment`) are preserved verbatim without silent stripping.
- **Status Checks:** Verifying `PAUSED`, `EXPIRED`, expired timestamp, and soft-deleted states.
- **Tenancy Integrity:** Rejection when destination's `qrCodeId` does not match the parent QR code.
- **Anti-SSRF:** 15 distinct attacks tested (localhost, private subnets, cloud metadata, internal TLDs, javascript, data URLs).
- **Bounded In-Memory Cache:** Cache hits, TTL expiry, and FIFO eviction at capacity.
- **Error Safety:** Database connection failures caught safely without leaking stack traces or credentials.
- **Route Handler Tests:** Direct execution of `GET /q/{shortCode}` verifying HTTP 302, `Location` header, `Cache-Control`, `X-Robots-Tag`, status page redirects, and query-parameter override resistance.

---

## 11. Security Audit Findings

| Audit Check | Finding | Status |
| :--- | :--- | :---: |
| **Open Redirect Risk** | No public query parameters can override destination | PASSED |
| **SSRF Risk** | Zero server-side HTTP fetch; loopback/private subnets blocked | PASSED |
| **Information Disclosure** | No IDs, slugs, or tenant details in redirect or status pages | PASSED |
| **Tenant Leakage** | Resolver does not leak which organization owns a QR code | PASSED |
| **Malformed Route Parameters** | Regex validation rejects invalid codes prior to database query | PASSED |
| **Query Parameter Tampering** | Attackers cannot supply destination URLs in GET query string | PASSED |
| **Database Error Leakage** | Errors logged internally via safe log; generic message returned | PASSED |
| **Unbounded Caching** | Fixed at 1,000 entries with FIFO eviction | PASSED |
| **Sensitive URL Logging** | Full customer URLs are not emitted in application logs | PASSED |

---

## 12. Explicit List of Phase 2C+ Deferred Features

The following features were **intentionally not implemented** in Phase 2B:
- Scan Analytics & Scan Counters (`ScanEvent` model)
- GeoIP, Country, City, or ISP lookup
- User-Agent, Device, Browser, or OS parsing
- Merchant Dashboard Charts & Analytics views
- Campaigns and Batch QR grouping
- Developer API, REST endpoints, and API Keys
- Subscriptions, Stripe/Razorpay billing, and Webhooks
- Distributed Redis caching and distributed rate limiting
- UPI payment transaction verification

---

## 13. Acceptance Statement

Phase 2B is **COMPLETE**.

All acceptance criteria are satisfied, all tests are passing, no regressions exist, and deployment compatibility with Node.js 22 LTS, PM2, and Hostinger Cloud remains intact.

**Result:** **PHASE 2B COMPLETE**
