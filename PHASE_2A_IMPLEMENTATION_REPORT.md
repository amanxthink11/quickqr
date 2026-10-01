# QuickQR India — Phase 2A Implementation Report
**Database, Authentication, Organizations & RBAC**
**Date:** September 2026  
**Status:** **COMPLETE**

---

## 1. Executive Summary

Phase 2A delivers the production PostgreSQL + Prisma data persistence foundation, cryptographic password security using Argon2id, database-backed sessions with SHA-256 token hashing, multi-organization tenant boundaries, server-side RBAC authorization, and foundational `QRCode` and `QRCodeDestination` persistence.

All implementation strictly conforms to [PHASE_2A_ARCHITECTURE_REVIEW.md](file:///F:/QR-Web/PHASE_2A_ARCHITECTURE_REVIEW.md), [PHASE_2_ARCHITECTURE.md](file:///F:/QR-Web/PHASE_2_ARCHITECTURE.md), and [PROJECT_CONTEXT.md](file:///F:/QR-Web/PROJECT_CONTEXT.md).

No Phase 2B+ functionality was implemented (no `/q/{shortCode}` dynamic redirect handler, no scan tracking/analytics, no GeoIP, no campaigns, no billing, no Redis). Phase 1 static generator functionality remains 100% operational with all 81 regression tests passing alongside 40 new Phase 2A tests (121 tests total).

---

## 2. Files Created & Modified

### Created Files
- [`prisma/schema.prisma`](file:///F:/QR-Web/prisma/schema.prisma): Six foundational models (`User`, `Organization`, `Membership`, `Session`, `QRCode`, `QRCodeDestination`) and two enums (`UserRole`, `QRType`, `QRStatus`).
- [`prisma/migrations/20260925144500_init_phase_2a/migration.sql`](file:///F:/QR-Web/prisma/migrations/20260925144500_init_phase_2a/migration.sql): Non-destructive initial SQL migration script.
- [`prisma/migrations/migration_lock.toml`](file:///F:/QR-Web/prisma/migrations/migration_lock.toml): Prisma migration engine lock.
- [`src/lib/db/prisma.ts`](file:///F:/QR-Web/src/lib/db/prisma.ts): Singleton Prisma client with Next.js development hot-reload protection.
- [`src/lib/auth/password.ts`](file:///F:/QR-Web/src/lib/auth/password.ts): Argon2id password hashing and constant-time verification.
- [`src/lib/auth/session.ts`](file:///F:/QR-Web/src/lib/auth/session.ts): 32-byte CSPRNG token generation, SHA-256 database token hashing, session lifecycle, and secure cookie options.
- [`src/lib/auth/rbac.ts`](file:///F:/QR-Web/src/lib/auth/rbac.ts): Server-side role hierarchy and authorization guards (`OWNER`, `ADMIN`, `MEMBER`, `VIEWER`).
- [`src/lib/auth/tenancy.ts`](file:///F:/QR-Web/src/lib/auth/tenancy.ts): Strict tenant-scoped QR query operations, Base62 shortcode generation, and IDOR protection.
- [`src/lib/auth/rate-limiter.ts`](file:///F:/QR-Web/src/lib/auth/rate-limiter.ts): In-memory sliding-window rate limiter (5 attempts / 15 min with lockout backoff) for Hostinger PM2 deployment without Redis.
- [`src/lib/auth/service.ts`](file:///F:/QR-Web/src/lib/auth/service.ts): High-level authentication flows (`registerUser`, `loginUser`, `logoutUser`).
- [`src/lib/auth/actions.ts`](file:///F:/QR-Web/src/lib/auth/actions.ts): Next.js Server Actions for authentication forms (`registerAction`, `loginAction`, `logoutAction`, `getAuthStatusAction`).
- [`src/lib/validation/url-safety.ts`](file:///F:/QR-Web/src/lib/validation/url-safety.ts): Anti-SSRF URL validator blocking loopback, private IPv4 (RFC 1918), cloud metadata endpoints, internal TLDs, and unsafe URI protocols.
- [`src/lib/validation/auth-schemas.ts`](file:///F:/QR-Web/src/lib/validation/auth-schemas.ts): Zod schemas for registration, login, organization creation, and QR persistence.
- [`src/components/auth/LogoutButton.tsx`](file:///F:/QR-Web/src/components/auth/LogoutButton.tsx): Client Component for session termination and redirect.
- [`src/app/login/page.tsx`](file:///F:/QR-Web/src/app/login/page.tsx): Production-ready login interface with error handling and link to registration.
- [`src/app/register/page.tsx`](file:///F:/QR-Web/src/app/register/page.tsx): Registration interface creating user and organization atomically.
- [`src/app/dashboard/page.tsx`](file:///F:/QR-Web/src/app/dashboard/page.tsx): Authenticated Phase 2A test dashboard verifying user info, active tenant organization, role badge, multi-tenant memberships, and tenant-scoped QR persistence.
- [`vitest.config.ts`](file:///F:/QR-Web/vitest.config.ts): Vitest configuration with `@/*` path alias resolution.
- [`tests/phase2a.test.ts`](file:///F:/QR-Web/tests/phase2a.test.ts): 32 automated unit tests covering passwords, tokens, RBAC, anti-SSRF, Zod schemas, rate limiting, and IDOR simulation.
- [`tests/phase2a-flows.test.ts`](file:///F:/QR-Web/tests/phase2a-flows.test.ts): 8 end-to-end flow tests covering atomic registration, login lockout, session revocation, multi-org membership, and destination updating.
- [`.env.example`](file:///F:/QR-Web/.env.example): Complete template for database URL, app secret, and public app URL.

### Modified Files
- [`src/components/layout/Header.tsx`](file:///F:/QR-Web/src/components/layout/Header.tsx): Added "Sign In" link to desktop navbar and mobile drawer.
- [`package.json`](file:///F:/QR-Web/package.json): Added `@node-rs/argon2`, `@prisma/client`, `prisma`, and `zod` dependencies.

---

## 3. Database Models & Schema Specification

The database uses PostgreSQL with Prisma ORM. Exactly six models were implemented according to the Phase 2A specification:

| Model | Primary Key | Key Relations | Indexes & Constraints |
| :--- | :--- | :--- | :--- |
| `User` | `cuid` | 1:N `Membership`, 1:N `Session` | `unique(email)`, index on `deletedAt` |
| `Organization` | `cuid` | 1:N `Membership`, 1:N `QRCode` | `unique(slug)`, index on `deletedAt` |
| `Membership` | `cuid` | N:1 `User`, N:1 `Organization` | `unique([userId, organizationId])`, index on `[organizationId, role]` |
| `Session` | `cuid` | N:1 `User` | `unique(tokenHash)`, indexes on `userId`, `expiresAt` |
| `QRCode` | `cuid` | N:1 `Organization`, 1:N `QRCodeDestination` | `unique(shortCode)`, indexes on `[organizationId, deletedAt]`, `[organizationId, status]` |
| `QRCodeDestination` | `cuid` | N:1 `QRCode` | Indexes on `[qrCodeId, isActive]`, `destinationUrl` |

### Enums
- `UserRole`: `OWNER`, `ADMIN`, `MEMBER`, `VIEWER`
- `QRType`: `DYNAMIC_URL`, `STATIC_URL`, `UPI`, `WHATSAPP`, `VCARD`, `WIFI`, `EMAIL`, `TEXT`
- `QRStatus`: `ACTIVE`, `PAUSED`, `ARCHIVED`

### Migration Name
- `20260925144500_init_phase_2a` (defined in `prisma/migrations/20260925144500_init_phase_2a/migration.sql`).

---

## 4. Authentication Architecture

- **Password Hashing:**
  - Implemented via `@node-rs/argon2` with native N-API execution.
  - Parameters: Memory Cost = 65,536 KB (64 MB), Time Cost = 3 iterations, Parallelism = 1.
  - Passwords validated for length (8–128 characters), complexity (letters + number/symbol), and null-byte injection prevention.
  - Plaintext passwords and password hashes are never logged.
- **Account Creation Flow:**
  - User registration executes atomically via `prisma.$transaction`.
  - Normalizes email (`toLowerCase().trim()`).
  - Creates the `User` record with hashed password.
  - Creates the primary tenant `Organization` (with URL-safe slug generated from organization name or UUID fallback).
  - Creates the `Membership` linking user and organization with role `OWNER`.
  - Creates the initial database-backed `Session`.
  - Sets the session cookie on the response.

---

## 5. Session Architecture

- **Token Generation:** 32 cryptographically secure random bytes generated via `crypto.randomBytes(32)` (64-character hexadecimal representation).
- **Storage:** Only the deterministic `SHA-256` hash of the raw token (`tokenHash`) is stored in PostgreSQL.
- **Raw Token:** Exists exclusively in the client's HTTP cookie.
- **Cookie Security:**
  - `name`: `quickqr_session`
  - `httpOnly`: `true` (inaccessible to JavaScript, defending against XSS)
  - `secure`: `true` in production (`process.env.NODE_ENV === 'production'`)
  - `sameSite`: `'lax'` (mitigates CSRF on cross-origin requests)
  - `path`: `'/'`
  - `expires`: 30 days from issuance (`SESSION_TTL_DAYS = 30`)
- **Revocation & Expiration:**
  - `logoutUser`: Deletes the session row matching `hashSessionToken(rawToken)` and clears the cookie.
  - Expired sessions (`expiresAt < now`) and sessions belonging to soft-deleted users (`deletedAt !== null`) are rejected and purged.
  - `destroyAllUserSessions`: Revokes all active sessions for a user upon security events.

---

## 6. Organization & RBAC Implementation

### Role Hierarchy
```
OWNER (4) > ADMIN (3) > MEMBER (2) > VIEWER (1)
```

### Authorization Helpers ([`src/lib/auth/rbac.ts`](file:///F:/QR-Web/src/lib/auth/rbac.ts))
- `requireOrganizationMember(userId, organizationId)`: Verifies membership exists; throws `FORBIDDEN` if not a member.
- `requireOrganizationRole(userId, organizationId, minRole)`: Evaluates whether user's role satisfies `ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[minRole]`.
- `requireOrganizationAdmin(userId, organizationId)`: Guard requiring `ADMIN` or `OWNER`.
- `requireOrganizationOwner(userId, organizationId)`: Guard requiring `OWNER` exclusively (for org deletion, ownership transfer, billing).

---

## 7. Tenant Isolation (IDOR Defense)

Tenant boundary is strictly enforced at the database query layer:
- **Direct Ownership:** Every `QRCode` belongs directly to `organizationId`.
- **Query Scoping:** Never query `prisma.qRCode.findUnique({ where: { id } })` without an organization filter.
- **Enforced Pattern:**
  ```ts
  prisma.qRCode.findFirst({
    where: {
      id: qrCodeId,
      organizationId,
      deletedAt: null
    }
  })
  ```
- **Nested Resource Verification:** `QRCodeDestination` is retrieved only via its parent `QRCode`, verifying that the parent QR belongs to the tenant.
- **IDOR Resistance:** If Tenant A attempts to read or mutate Tenant B's QR code by guessing or tampering with `qrCodeId`, the query returns `null` and prevents unauthorized access.

---

## 8. Anti-SSRF & URL Security

[`src/lib/validation/url-safety.ts`](file:///F:/QR-Web/src/lib/validation/url-safety.ts) guards all stored destination URLs:
- Permitted protocols: strictly `https:` and `http:`.
- Rejects: `javascript:`, `data:`, `file:`, `blob:`, `vbscript:`.
- Rejects loopback: `localhost`, `127.0.0.1`, `[::1]`, `0.0.0.0`.
- Rejects RFC 1918 private subnets: `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`.
- Rejects Cloud Metadata IP: `169.254.169.254` (prevents AWS/GCP/Azure credential theft).
- Rejects internal TLDs: `.local`, `.internal`, `.lan`, `.corp`, `.home`.

---

## 9. Rate Limiting (Hostinger Cloud Compatible)

Implemented via [`src/lib/auth/rate-limiter.ts`](file:///F:/QR-Web/src/lib/auth/rate-limiter.ts):
- Sliding-window algorithm tracking attempt timestamps per identifier (`email:ip`).
- Limits: 5 failed attempts per 15-minute window.
- Lockout: Account locked for 15 minutes upon exceeding threshold.
- Memory safety: Automatic background cleanup prunes stale entries every 5 minutes with unreferenced timer.
- Zero Redis dependency: Operates in-memory on Node.js/Hostinger Cloud.

---

## 10. Automated Testing & Verification Suite

All 121 tests pass across 9 test files:

```bash
✓ tests/widget.test.ts (10 tests)
✓ tests/qr-payloads.test.ts (17 tests)
✓ tests/table-stand.test.ts (8 tests)
✓ tests/qr-download.test.ts (8 tests)
✓ tests/qr-validation.test.ts (22 tests)
✓ tests/upi-stand.test.ts (10 tests)
✓ tests/qr-decoding.test.ts (6 tests)
✓ tests/phase2a-flows.test.ts (8 tests)
✓ tests/phase2a.test.ts (32 tests)

Test Files: 9 passed (9)
Tests:      121 passed (121)
```

### Key Test Categories
1. **Password Security:** Argon2id hash parameters (`m=65536, t=3, p=1`), constant-time verification, length limits (8–128), null-byte rejection.
2. **Session Security:** 32-byte CSPRNG token length and hex format, SHA-256 deterministic token hashing, cookie security options.
3. **RBAC:** Full role hierarchy matrix and permission boundaries for all 4 roles.
4. **URL Safety & SSRF:** Whitelisting public URLs, blocking loopback, RFC 1918 subnets, cloud metadata, and dangerous protocols.
5. **Rate Limiting:** Sliding-window tracking, 5-attempt limit, lockout backoff, and success reset.
6. **Shortcode Generation:** 7-character Base62 alphabet entropy and collision resistance.
7. **Tenant Isolation:** Cross-tenant IDOR defense, soft-delete exclusion, destination versioning.
8. **End-to-End Flows:** Atomic registration, login lockout, session revocation, multi-org membership, and destination updating.

---

## 11. Production Build & Deployment Check

- `npm run lint`: **0 errors, 0 warnings**
- `npm run test`: **121 passed, 0 failed**
- `npm run build`: **Succeeded in standalone mode**
  - Standalone assets copied to `.next/standalone/.next/static` and `.next/standalone/public`.
  - Compatible with Node.js 22 LTS, Hostinger Cloud, and PM2.
  - Zero Redis requirement.

---

## 12. Known Limitations & Deferred Phase 2B+ Scope

| Feature | Status in Phase 2A | Target Phase |
| :--- | :--- | :--- |
| Dynamic QR Redirect (`/q/{shortCode}`) | Deferred | Phase 2B |
| Scan Analytics & Counter | Deferred | Phase 2B |
| GeoIP / Device / OS Detection | Deferred | Phase 2B |
| Merchant Dashboard Analytics & Charts | Deferred | Phase 2C |
| API Keys & Developer REST API | Deferred | Phase 2D |
| Subscriptions, Billing, Webhooks | Deferred | Phase 2D |
| Distributed Redis Rate Limiting | Deferred | Phase 2D |

---

## 13. Final Acceptance Checklist

| Criteria | Status |
| :--- | :---: |
| Prisma PostgreSQL foundation works | ✅ |
| Migration succeeds safely | ✅ |
| Registration works | ✅ |
| Login works | ✅ |
| Logout works | ✅ |
| Session revocation works | ✅ |
| Passwords use Argon2id | ✅ |
| Session tokens are hashed in DB | ✅ |
| HttpOnly/Secure/SameSite cookie configuration is correct | ✅ |
| Organizations work | ✅ |
| Multiple memberships work | ✅ |
| RBAC works server-side | ✅ |
| Tenant isolation is enforced server-side | ✅ |
| QRCode persistence works | ✅ |
| QRCodeDestination persistence works | ✅ |
| IDOR tests pass | ✅ |
| Existing Phase 1 tests still pass | ✅ |
| `npm run test` passes | ✅ |
| `npm run lint` passes | ✅ |
| `npm run build` passes | ✅ |
| Hostinger deployment compatibility remains intact | ✅ |
| No Redis dependency introduced | ✅ |
| No Phase 2B+ functionality was implemented | ✅ |

**Phase 2A Status:** **COMPLETE**
