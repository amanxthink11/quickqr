# QuickQR India — Phase 2C Implementation Report
**Merchant Dashboard & Dynamic QR Management**  
**Date:** September 2026  
**Status:** **PHASE 2C COMPLETE**

---

## 1. Executive Summary

Phase 2C delivers the merchant dashboard and dynamic QR management console for QuickQR India. It provides authenticated merchants with an intuitive, production-grade SaaS interface to create, monitor, customize, pause, resume, soft-delete, and dynamically re-route QR codes without reprinting physical assets.

All implementation strictly conforms to [PHASE_2_ARCHITECTURE.md](file:///F:/QR-Web/PHASE_2_ARCHITECTURE.md), [PHASE_2A_IMPLEMENTATION_REPORT.md](file:///F:/QR-Web/PHASE_2A_IMPLEMENTATION_REPORT.md), [PHASE_2B_IMPLEMENTATION_REPORT.md](file:///F:/QR-Web/PHASE_2B_IMPLEMENTATION_REPORT.md), and [PROJECT_CONTEXT.md](file:///F:/QR-Web/PROJECT_CONTEXT.md).

No Phase 2D+ scope was implemented (no scan analytics, no GeoIP/device tracking, no ScanEvent time-series tables, no campaigns, no billing/Razorpay, no API keys, no Redis).

All **178 automated tests** are passing (157 baseline + 21 Phase 2C tests), ESLint is clean with **0 errors and 0 warnings**, and the Next.js production standalone build succeeded.

---

## 2. Core Value Proposition

> **"A merchant can change the destination of an existing dynamic QR code without reprinting the physical QR."**

1. When a dynamic QR code is created, a globally unique 7-character Base62 short code is minted (e.g. `x8k2nP9`).
2. The generated physical QR image (PNG, print tent, counter stand) encodes strictly:
   ```
   {NEXT_PUBLIC_QR_BASE_URL}/q/{shortCode}
   ```
   *(e.g. `https://qr.quickqr.in/q/x8k2nP9`)*.
3. The merchant prints and deploys the physical standee, table tent, or flyer once.
4. When menus, promotions, or seasons change, the merchant updates the destination URL via the dashboard.
5. The physical printed QR code remains 100% valid; the database target updates and all subsequent scans resolve to the new destination.

---

## 3. Routes & Navigation Architecture

| Route | Description | Rendering Strategy | RBAC Access |
| :--- | :--- | :--- | :--- |
| `/dashboard` | High-level metrics (Total, Active, Paused), value proposition banner, recent QRs | Dynamic (Server Component) | `VIEWER`+ |
| `/dashboard/qr-codes` | Full QR list, search, status filtering, table actions (View, Edit, Pause, Delete) | Dynamic (Server Component) | `VIEWER`+ |
| `/dashboard/qr-codes/new` | Create dynamic QR form with real-time SSRF URL validation and short-code minting | Dynamic (Server Component + Form) | `MEMBER`+ |
| `/dashboard/qr-codes/[id]` | QR details, Phase 1 preview, dynamic URL copy, PNG download, print, edit destination, status toggle | Dynamic (Server Component + Client Cards) | `VIEWER`+ (mutations require `MEMBER`+) |
| `/dashboard/settings` | Active tenant details, current user role, organization switcher, multi-tenant list | Dynamic (Server Component) | `VIEWER`+ |

### Navigation Shell
The dashboard shell (`src/app/dashboard/layout.tsx`) features:
- **Top Context Bar**: Server-validated organization switcher dropdown, active role badge, user profile, static generator link, and logout button.
- **Navigation Tabs**: Overview (`/dashboard`), QR Codes (`/dashboard/qr-codes`), Settings (`/dashboard/settings`), and "+ New Dynamic QR" quick CTA.
- **Responsive Layout**: Designed for desktop, tablet, and mobile with Tailwind CSS.

---

## 4. Multi-Tenant Context & Organization Switcher

The authenticated user may belong to multiple organizations (e.g. store chains, client businesses).

### Secure Organization Persistence (`quickqr_active_org`)
- **Mechanism**: Dedicated HTTP-only cookie (`quickqr_active_org`) storing the selected `organizationId`.
- **Server Validation**: The server **never** trusts client-supplied `organizationId` blindly. During session hydration in `getCurrentSession()`:
  1. Reads `quickqr_active_org` from cookie.
  2. Verifies whether the authenticated user has an active, non-deleted membership in that organization in PostgreSQL:
     ```ts
     activeMembership = memberships.find(
       (m) => m.organizationId === cookieOrgId && m.organization.deletedAt === null
     );
     ```
  3. If invalid, tampered, or stale, falls back to the user's primary valid organization.
- **Server Action**: `switchOrganizationAction(targetOrganizationId)` explicitly calls `requireOrganizationMember(userId, targetOrganizationId)` before setting the cookie. Any cross-tenant tampering attempt throws `FORBIDDEN`.

---

## 5. Service Methods (`src/lib/qr/service.ts`)

Clean, reusable service methods encapsulating database queries, server-side RBAC guards, SSRF validation, and cache invalidation:

### 1. `createQRCode(userId, organizationId, input)`
- **RBAC**: Requires `MEMBER` or higher.
- **Validation**: Enforces title (1–120 chars) and validates destination URL via `validateDestinationUrl` (blocking SSRF, loopback, RFC 1918 private subnets, cloud metadata, and non-http(s) schemes).
- **ShortCode**: Mints unique 7-char Base62 code via CSPRNG `generateUniqueShortCode()`.
- **Database**: Atomically creates `QRCode` and initial active `QRCodeDestination` scoped to `organizationId`.

### 2. `getQRCode(userId, organizationId, qrCodeId)`
- **RBAC**: Requires `VIEWER` or higher.
- **Tenant Boundary**: Queries `where: { id: qrCodeId, organizationId, deletedAt: null }`. IDOR attempts return `null`.
- **Includes**: Active destination and full destination history ordered by `createdAt desc`.

### 3. `listQRCodes(userId, organizationId, options)`
- **RBAC**: Requires `VIEWER` or higher.
- **Features**: Bounded pagination (default 25, max 100), status filtering (`ACTIVE`, `PAUSED`), case-insensitive search by title or shortCode.
- **Exclusion**: Unconditionally filters `deletedAt: null`.

### 4. `updateQRCode(userId, organizationId, qrCodeId, input)`
- **RBAC**: Requires `MEMBER` or higher.
- **Updates**: QR title and custom styling payload.

### 5. `updateQRCodeDestination(userId, organizationId, qrCodeId, newDestinationUrl)`
- **RBAC**: Requires `MEMBER` or higher.
- **Validation**: Re-validates URL safety.
- **Transaction**: Marks previous active destinations as `isActive: false, deactivatedAt: now`, creates new `QRCodeDestination` with `isActive: true`, and updates parent QR `updatedAt`.
- **Cache Invalidation**: Calls `resolverCache.invalidate(existing.shortCode)`.

### 6. `pauseQRCode(userId, organizationId, qrCodeId)`
- **RBAC**: Requires `MEMBER` or higher.
- **Updates**: Sets `status: 'PAUSED'`.
- **Cache Invalidation**: Calls `resolverCache.invalidate(existing.shortCode)`. Scans immediately redirect to `/q-status/paused`.

### 7. `resumeQRCode(userId, organizationId, qrCodeId)`
- **RBAC**: Requires `MEMBER` or higher.
- **Updates**: Sets `status: 'ACTIVE'`.
- **Cache Invalidation**: Calls `resolverCache.invalidate(existing.shortCode)`. Scans resume normal redirection.

### 8. `deleteQRCode(userId, organizationId, qrCodeId)`
- **RBAC**: Requires `ADMIN` or `OWNER` (destructive action guard).
- **Soft Delete**: Sets `deletedAt: now, status: 'ARCHIVED'`. Never deletes physical row in normal operations.
- **Cache Invalidation**: Calls `resolverCache.invalidate(existing.shortCode)`. Scans immediately return `NOT_FOUND` (`/q-status/not-found`).

### 9. `getDashboardStats(userId, organizationId)`
- **RBAC**: Requires `VIEWER` or higher.
- **Metrics**: Computes `totalQRs`, `activeQRs`, `pausedQRs`, and retrieves 5 most recent QR codes.
- **Strict Guardrail**: Zero scan counters or ScanEvent queries (deferred to Phase 2D).

---

## 6. Server Actions (`src/lib/qr/actions.ts`)

Next.js Server Actions connecting the UI components to the service methods:
- `createQRCodeAction`: Creates dynamic QR and revalidates dashboard paths.
- `updateDestinationAction`: Updates destination URL and revalidates `/dashboard/qr-codes/[id]`.
- `updateQRCodeAction`: Renames QR code title.
- `pauseQRCodeAction`: Pauses QR code redirection.
- `resumeQRCodeAction`: Resumes QR code redirection.
- `deleteQRCodeAction`: Performs soft deletion.
- In every server action:
  - User session is authenticated via `requireAuth()`.
  - Membership is verified against PostgreSQL.
  - Server errors are safely normalized into `{ success: boolean; data?: T; error?: string }`.

---

## 7. Role-Based Access Control (RBAC) Matrix

| Action | OWNER | ADMIN | MEMBER | VIEWER |
| :--- | :---: | :---: | :---: | :---: |
| View QR codes & metrics | ✅ | ✅ | ✅ | ✅ |
| View QR details & download/print | ✅ | ✅ | ✅ | ✅ |
| Create dynamic QR code | ✅ | ✅ | ✅ | ❌ *(Forbidden)* |
| Update destination URL | ✅ | ✅ | ✅ | ❌ *(Forbidden)* |
| Rename QR title / styling | ✅ | ✅ | ✅ | ❌ *(Forbidden)* |
| Pause / Resume redirection | ✅ | ✅ | ✅ | ❌ *(Forbidden)* |
| Soft-delete QR code | ✅ | ✅ | ❌ *(Requires Admin+)* | ❌ *(Forbidden)* |
| Switch active organization | ✅ | ✅ | ✅ | ✅ |

All checks are enforced server-side via `requireOrganizationRole()` in `src/lib/auth/rbac.ts`.

---

## 8. Reuse of Phase 1 QR Engine

**Zero duplicate QR rendering logic was introduced.**

The dashboard preview and download tools reuse the existing Phase 1 infrastructure:
- **Rendering Engine**: [`src/lib/qr/renderer.ts`](file:///F:/QR-Web/src/lib/qr/renderer.ts) (`createQRCodeInstance`) generates the canvas using client-side `qr-code-styling`.
- **Payload**: Automatically set to `{NEXT_PUBLIC_QR_BASE_URL}/q/{shortCode}`.
- **Download**: [`src/lib/qr/download.ts`](file:///F:/QR-Web/src/lib/qr/download.ts) (`renderFramedQRToCanvas`) produces 300 DPI 2000px high-resolution PNGs.
- **Print**: [`openPrintDialog`](file:///F:/QR-Web/src/lib/qr/download.ts) formats print-ready physical counter stands with sanitized titles.

---

## 9. Cache Invalidation & Multi-Process Architecture

### Local Process Invalidation
When an active QR code's destination, status, or deletion state is modified:
```ts
resolverCache.invalidate(shortCode);
```
The local in-memory FIFO bounded cache (`BoundedResolverCache`) immediately deletes the entry. Any subsequent resolution within the same Node.js worker queries PostgreSQL and reflects the new state instantly.

### Multi-Process Limitation Disclosure (PM2 / Hostinger Cloud)
- **Constraint**: Phase 2B/2C explicitly operates without Redis.
- **Behavior**: If multiple PM2 cluster workers are running, an update in Worker A immediately invalidates Worker A's cache. Workers B, C, and D will continue serving their cached destination until their 30-second TTL expires (`CACHE_TTL_MS = 30000`).
- **Maximum Stale Period**: At most **30 seconds** on peer workers before automatic eviction.
- **Source of Truth**: PostgreSQL remains the 100% authoritative source of truth.
- **Redis Upgrade Path**: In Phase 2D, a distributed Redis `DEL qr:shortCode` or Pub/Sub event can replace the local cache invalidator without changing service interfaces.

---

## 10. Automated Test Suite (178 Tests Passing)

All **178 automated tests** pass across 11 test suites:

```bash
✓ tests/widget.test.ts (10 tests)
✓ tests/table-stand.test.ts (8 tests)
✓ tests/qr-payloads.test.ts (17 tests)
✓ tests/qr-download.test.ts (8 tests)
✓ tests/qr-validation.test.ts (22 tests)
✓ tests/upi-stand.test.ts (10 tests)
✓ tests/phase2b-redirect.test.ts (36 tests)
✓ tests/phase2c-dashboard.test.ts (21 tests)
✓ tests/qr-decoding.test.ts (6 tests)
✓ tests/phase2a-flows.test.ts (8 tests)
✓ tests/phase2a.test.ts (32 tests)

Test Files: 11 passed (11)
Tests:      178 passed (178)
Lint:       0 errors, 0 warnings
Build:      Successful (Next.js Standalone Mode with 30 routes)
```

### New Phase 2C Test Coverage (`tests/phase2c-dashboard.test.ts`)
1. **Dynamic QR Code Creation**: Base62 minting, default styling, destination assignment, title validation, SSRF rejection.
2. **Tenant Isolation & IDOR**: Prevents cross-tenant retrieval, cross-tenant destination updates, and cross-tenant deletion.
3. **Dynamic Destination Update**: Preserves physical shortCode, updates active destination, deactivates old destination, and verifies immediate resolver update.
4. **Local Cache Invalidation**: Confirms cache eviction upon destination update, pause, resume, and deletion.
5. **Pause & Resume**: Confirms resolver returns `PAUSED` when paused, and restores redirection when resumed.
6. **Soft Delete**: Confirms `deletedAt` assignment, `ARCHIVED` status, removal from listings, and resolver `NOT_FOUND` return.
7. **RBAC Boundaries**: Tests full hierarchy (`OWNER`, `ADMIN`, `MEMBER`, `VIEWER`, outsider) across all mutations.
8. **Organization Switching**: Confirms server-side membership check prevents switching to unauthorized organizations.
9. **Dashboard Stats**: Computes accurate counts without scan counters.

---

## 11. Security Audit Findings

| Audit Check | Finding | Status |
| :--- | :--- | :---: |
| **IDOR Defense** | Every QR query is scoped to `where: { id, organizationId, deletedAt: null }` | PASSED |
| **Org Switcher Bypassing** | `switchOrganizationAction` enforces server-side membership check | PASSED |
| **Client Parameter Tampering** | Server never trusts browser `organizationId`; derives permissions from DB session | PASSED |
| **Destructive Mutation RBAC** | Soft-deletion restricted strictly to `ADMIN` and `OWNER` | PASSED |
| **Anti-SSRF Protection** | All destination updates pass `validateDestinationUrl` (blocking RFC 1918, metadata, loopback) | PASSED |
| **XSS Defense** | QR names, short codes, and URLs are escaped in print dialogs and rendered safely | PASSED |
| **Soft Delete Enforcement** | Deleted QRs stop redirecting and are filtered from dashboard listings | PASSED |
| **Unbounded List DOS** | QR listing is strictly paginated with maximum limit of 100 per query | PASSED |

---

## 12. Explicit List of Phase 2D+ Deferred Features

The following features were **strictly NOT implemented** in Phase 2C:
- Scan Analytics, Device Detection, and Scan Counters (`ScanEvent` model)
- GeoIP, Country, City, or ISP lookup
- Analytics Charts, Graphs, and Time-series reporting
- Campaigns and Batch QR grouping
- Remote Persisted Website Widgets (`WidgetConfiguration` model)
- Public Developer REST API and API Keys
- Tiered Subscriptions, Stripe/Razorpay billing, and Webhooks
- Distributed Redis caching and distributed locks
- Advanced team management UI (invitations, role reassignment)

---

## 13. Acceptance Statement

Phase 2C is **COMPLETE**.

All acceptance criteria are satisfied, all tests are passing, no regressions exist, and deployment compatibility with Node.js 22 LTS, PM2, and Hostinger Cloud remains intact.

**Result:** **PHASE 2C COMPLETE**
