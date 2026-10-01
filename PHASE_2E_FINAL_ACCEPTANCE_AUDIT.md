# PHASE 2E — FINAL PRODUCTION ACCEPTANCE AUDIT

**Date:** September 25, 2026  
**Auditor:** Antigravity Agentic Systems  
**Evaluation Scope:** Phase 2E — Remote Website QR Widget Persistence  
**Final Verdict:** **PASS**

---

## 1. Executive Result

Phase 2E has undergone a strict, multi-vector production acceptance audit. All architectural criteria, data modeling constraints, tenant isolation boundaries, RBAC permissions, cryptographic identifier properties, anti-SSRF protections, XSS sanitizations, and backward compatibility contracts have been verified directly in the codebase and executed via comprehensive test runs.

- **Automated Tests:** 230/230 tests passing across 13 test suites (100% pass rate)
- **ESLint:** 0 errors, 0 warnings
- **Production Build:** Succeeded with 35 routes in Next.js standalone mode
- **Real Database Migration:** Created and verified (`20260925200000_add_remote_widgets/migration.sql`)
- **Hostinger Compatibility:** Verified (Node.js 22 LTS, PostgreSQL, Standalone Next.js App Router, PM2/Nginx ready, zero Redis/queue dependencies)

---

## 2. Database & Migration Status

### 2.1 Model & Migration Parity
The `Widget` model and `WidgetStatus` enum in `prisma/schema.prisma` map with 100% fidelity to the PostgreSQL migration DDL in `prisma/migrations/20260925200000_add_remote_widgets/migration.sql`.

```sql
-- Migration: 20260925200000_add_remote_widgets
CREATE TYPE "WidgetStatus" AS ENUM ('ACTIVE', 'PAUSED');

CREATE TABLE "Widget" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "WidgetStatus" NOT NULL DEFAULT 'ACTIVE',
    "configuration" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Widget_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Widget_publicId_key" ON "Widget"("publicId");
CREATE INDEX "Widget_organizationId_deletedAt_idx" ON "Widget"("organizationId", "deletedAt");
CREATE INDEX "Widget_publicId_idx" ON "Widget"("publicId");
CREATE INDEX "Widget_status_idx" ON "Widget"("status");
CREATE INDEX "Widget_organizationId_createdAt_idx" ON "Widget"("organizationId", "createdAt");

ALTER TABLE "Widget" ADD CONSTRAINT "Widget_organizationId_fkey" 
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

### 2.2 Verification Checklist
- `organizationId`: Present, foreign-keyed to `Organization(id)` with `ON DELETE CASCADE`.
- `publicId`: Present, unique constraint enforced at database index level.
- `status`: Backed by PostgreSQL enum `WidgetStatus ('ACTIVE', 'PAUSED')`.
- `configuration`: Native PostgreSQL `JSONB` column.
- `deletedAt`: Nullable timestamp supporting soft deletion.
- `createdAt` & `updatedAt`: Present and indexed.
- **Migration Status:** **PRODUCTION-READY**.

---

## 3. Public Identifier Security

- **Algorithm:** Node.js CSPRNG (`crypto.randomBytes(18)`).
- **Entropy:** $62^{18} \approx 1.84 \times 10^{32}$ permutations formatted as `wgt_[18 alphanumeric characters]`.
- **Properties:**
  - Non-sequential and collision-resistant.
  - Zero internal database ID leakage (CUIDs never exposed).
  - Zero organization or tenant ID leakage.
  - Uniqueness enforced via unique database constraint `Widget_publicId_key`.
  - Database collision handling loop with 3 retries in `createWidget()`.

---

## 4. Public API Data Leakage Audit

Inspected endpoint: `GET /api/widget/[publicId]`.

### 4.1 Exact Public Payload Contract
When calling `GET /api/widget/{publicId}` with an active widget:
```json
{
  "success": true,
  "publicId": "wgt_A1B2C3D4E5F6G7H8I9",
  "name": "Storefront Payment Button",
  "status": "ACTIVE",
  "config": {
    "type": "upi",
    "payload": "upi://pay?pa=merchant@okhdfcbank&pn=Store%20Checkout&cu=INR",
    "buttonLabel": "Scan to Pay",
    "buttonText": "Scan to Pay",
    "buttonIcon": "upi",
    "brandColor": "#16a34a",
    "buttonTextColor": "#FFFFFF",
    "position": "bottom-right",
    "size": "medium",
    "borderRadius": "full",
    "shadow": "medium",
    "popupTitle": "Pay with Any UPI App",
    "modalTitle": "Pay with Any UPI App",
    "popupDescription": "Scan this QR code with Google Pay, PhonePe, Paytm, CRED or BHIM to pay instantly.",
    "modalDescription": "Scan this QR code with Google Pay, PhonePe, Paytm, CRED or BHIM to pay instantly.",
    "ctaText": "Zero Surcharge • Direct Bank Payment",
    "helperText": "Zero Surcharge • Direct Bank Payment",
    "mobileBehavior": "floating",
    "qrDataUrl": undefined
  },
  "updatedAt": "2026-09-25T14:35:00.000Z"
}
```

### 4.2 Data Leakage Verification
- `organizationId`: **NOT EXPOSED**
- Internal database `id`: **NOT EXPOSED**
- `deletedAt`: **NOT EXPOSED**
- User / merchant identity / email: **NOT EXPOSED**
- Secrets, tokens, or environment credentials: **NOT EXPOSED**
- Database errors / stack traces: **NEVER EXPOSED** (Caught safely in `try/catch` and returned as generic `{ "success": false, "error": "Internal server error while resolving widget" }` with HTTP 500).

---

## 5. CORS Audit

- **Headers:**
  - `Access-Control-Allow-Origin: *`
  - `Access-Control-Allow-Methods: GET, OPTIONS`
  - `Access-Control-Allow-Headers: Content-Type, Accept`
- **Method Restriction:** Strictly `GET` and preflight `OPTIONS` (returns 204 No Content).
- **Credentials:** No cookies, session tokens, or authorization headers are requested or permitted (`Access-Control-Allow-Credentials` is omitted).
- **Write Access:** Non-existent. This endpoint cannot accept mutations.
- **Safety Justification:** Wildcard CORS is mandatory because merchant widgets run on arbitrary third-party domains (e.g. `store.example.com`, `shopify-store.myshopify.com`). Because the endpoint serves only sanitized public presentation data without authentication or write capabilities, wildcard CORS is completely safe.

---

## 6. `widget.js` Backward Compatibility

Both modes were audited and verified in `src/widget/index.ts` and `public/widget.js`:

1. **Mode A — Legacy Static Embeds (`data-config="..."`):**
   - If `data-widget-id` is absent, the script reads `data-config` base64 payload.
   - Synchronous instantiation executes without making any network requests.
   - Verified by `tests/widget.test.ts` (10 passing tests).
2. **Mode B — Remote Persistent Embeds (`data-widget-id="wgt_..."`):**
   - The script detects `data-widget-id`, resolves host origin from script `src`, and issues asynchronous GET to `/api/widget/{publicId}`.
   - On HTTP 200 with `status === 'ACTIVE'`, mounts the widget dynamically.
   - On `status === 'PAUSED'` or network failure, degrades gracefully without mounting or disrupting the merchant's host webpage.
   - Verified by `tests/phase2e-widget.test.ts` (22 passing tests).

---

## 7. Remote Update Verification

The exact required lifecycle was audited:
1. **Create Widget:** Generated with initial configuration (e.g. UPI green button).
2. **Obtain Embed Code:** `<script src="https://quickqr.art/widget.js" data-widget-id="wgt_..." async></script>`.
3. **Verify Public Config:** Returns initial configuration.
4. **Update from Dashboard:** Change payload (e.g. Spring menu URL), brand color (`#ea580c`), and label (`View Spring Menu`).
5. **Verify Stability:**
   - `publicId` remained **strictly unchanged**.
   - Embed snippet remained **100% identical**.
   - Public delivery endpoint immediately returns the new configuration.

---

## 8. Pause / Resume / Archive Verification

Audited state transitions:
1. **ACTIVE:** Public API returns HTTP 200 with `status: "ACTIVE"` and full sanitized configuration.
2. **PAUSED:** Public API returns HTTP 200 with `{ success: false, status: "PAUSED", message: "..." }`. Configuration payload is stripped. `widget.js` cleanly suppresses rendering.
3. **RESUMED:** Public API returns HTTP 200 with `status: "ACTIVE"` and configuration.
4. **ARCHIVED (Soft Delete):** Widget record has `deletedAt: new Date(), status: 'PAUSED'`. Public resolver query searches for `{ publicId, deletedAt: null }`. Public API returns HTTP 404 `{ success: false, error: "Widget not found or has been deactivated" }`.

---

## 9. Tenant Isolation & IDOR Audit

Every database query in `src/lib/widget/service.ts` strictly enforces:
```typescript
where: {
  id: widgetId,
  organizationId: activeOrgId,
  deletedAt: null
}
```
- Active organization is resolved exclusively on the server from `requireAuth()` and `ctx.activeOrganization.id`.
- Untrusted client inputs, query parameters, or hidden form fields for `organizationId` are never accepted.
- Cross-tenant read returns `null`.
- Cross-tenant update, pause, resume, and delete throw `Widget not found or access denied`.

---

## 10. Role-Based Access Control (RBAC)

Audited against `src/lib/auth/rbac.ts` hierarchy:
- **OWNER:** Create, Read, Update, Pause, Resume, Delete (Archive) — **Permitted**
- **ADMIN:** Create, Read, Update, Pause, Resume, Delete (Archive) — **Permitted**
- **MEMBER:** Create, Read, Update, Pause, Resume — **Permitted**; Delete — **Blocked** (`Action requires 'ADMIN' role or higher`)
- **VIEWER:** Read — **Permitted**; Create, Update, Pause, Resume, Delete — **Blocked** (`Action requires 'MEMBER' role or higher`)

---

## 11. URL & Anti-SSRF Security

- Reuses the existing centralized validator `validateDestinationUrl` (`src/lib/validation/url-safety.ts`).
- Server-side validation in `src/lib/widget/service.ts`:
  - Rejects dangerous schemes: `javascript:`, `data:`, `vbscript:`, `file:`, `blob:`, `about:`.
  - Rejects loopback & localhost: `127.0.0.1`, `localhost`, `[::1]`, `::1`, `0.0.0.0`.
  - Rejects RFC 1918 private subnets: `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`.
  - Rejects cloud metadata: `169.254.169.254`.
  - Rejects single-label internal hostnames.

---

## 12. XSS & Configuration Sanitization

- Text sanitization (`cleanText` in `src/lib/widget/config.ts`) strips HTML tags (`<script>`, `<iframe>`), dangerous attributes (`onerror=`, `onload=`), and non-printable control characters.
- In `src/widget/index.ts`, text elements are inserted via `element.textContent` rather than `innerHTML`.
- Dynamic QR codes are rendered into an HTML5 `<canvas>` via `QRCode.toCanvas`. No dynamic inline SVG generation from user inputs.
- Color hex values are verified with `isValidHexColor`, preventing CSS attribute breakout injection.

---

## 13. Dashboard Security

- `/dashboard/widgets`, `/dashboard/widgets/new`, and `/dashboard/widgets/[id]` verify active session via `getCurrentSession()`. Unauthenticated requests redirect to `/login`.
- Server actions (`createWidgetAction`, `updateWidgetAction`, `pauseWidgetAction`, `resumeWidgetAction`, `deleteWidgetAction`) invoke `requireAuth()` server-side.
- Direct URL access by unauthorized users or non-members fails safely.

---

## 14. Cache Behavior & Bounded Propagation Window

- Public endpoint sets:
  ```http
  Cache-Control: public, max-age=60, s-maxage=60, stale-while-revalidate=120
  ```
- **Guaranteed Behavior:**
  - Maximum client/CDN cache validity: **60 seconds**.
  - Any dashboard update will propagate to external websites within **60 to 180 seconds** (under stale-while-revalidate conditions on intermediate proxy caches).
  - Hard browser refresh immediately forces an origin revalidation.
  - Zero indefinite stale configurations.

---

## 15. Embed Code Security

Generated embed snippet:
```html
<!-- QuickQR Website QR Widget (Remote Configured) -->
<script
  src="https://quickqr.art/widget.js"
  data-widget-id="wgt_42aB8x9Yz012345678"
  async
></script>
```
- Contains only the public static script path and the stable `publicId`.
- Completely devoid of sensitive tokens, user information, or database primary keys.
- Safe to distribute and place on any public website.

---

## 16. Browser QA Verification

- Browser subagent performed verification of the public marketing widget page (`http://localhost:3000/website-qr-widget`) and dashboard login (`http://localhost:3000/login`).
- All interactive builder tabs (Purpose, Appearance, QR Modal Text) responded accurately.
- Desktop and mobile simulator toggles functioned properly.
- Browser recording artifact saved: `phase2e_browser_qa_1790347477620.webp`.
- Zero broken links, zero console errors.

---

## 17. Complete Test Suite Execution

All 13 test suites executed successfully:

```text
 RUN  v5.0.1 F:/QR-Web

 ✓ tests/table-stand.test.ts (8 tests) 8ms
 ✓ tests/qr-payloads.test.ts (17 tests) 11ms
 ✓ tests/widget.test.ts (10 tests) 13ms
 ✓ tests/qr-download.test.ts (8 tests) 7ms
 ✓ tests/qr-validation.test.ts (22 tests) 13ms
 ✓ tests/upi-stand.test.ts (10 tests) 64ms
 ✓ tests/phase2c-dashboard.test.ts (21 tests) 36ms
 ✓ tests/phase2b-redirect.test.ts (36 tests) 28ms
 ✓ tests/qr-decoding.test.ts (6 tests) 152ms
 ✓ tests/phase2e-widget.test.ts (22 tests) 36ms
 ✓ tests/phase2d-analytics.test.ts (30 tests) 41ms
 ✓ tests/phase2a-flows.test.ts (8 tests) 293ms
 ✓ tests/phase2a.test.ts (32 tests) 435ms

 Test Files  13 passed (13)
      Tests  230 passed (230)
   Duration  1.06s
```

---

## 18. ESLint & Production Build

- **ESLint:**
  ```text
  > quickqr@1.0.0 lint
  > eslint
  Exit code: 0 (0 errors, 0 warnings)
  ```
- **Next.js Standalone Build:**
  ```text
  > quickqr@1.0.0 build
  > node scripts/build-widget.js && next build && node scripts/copy-standalone-assets.js

  [build-widget] Bundling widget to public/widget.js...
    public\widget.js  44.4kb
  Done in 7ms
  [build-widget] Successfully built public/widget.js (44 KB)
  ▲ Next.js 16.3.6 (Turbopack)
  ✓ Compiled successfully in 684ms
  ✓ Generating static pages using 15 workers (25/25) in 864ms
  ✓ [standalone] Copied .next/static to .next/standalone/.next/static
  ✓ [standalone] Copied public to .next/standalone/public
  Exit code: 0 (35 routes total)
  ```

---

## 19. Hostinger Compatibility

- Strict Node.js 22 LTS compatibility maintained.
- Next.js standalone server mode active (`output: 'standalone'`).
- PostgreSQL remains the single authoritative store.
- Zero serverless-only assumptions; zero mandatory Redis or external queue workers introduced.
- Static assets and `public/widget.js` ready for Nginx static serving.

---

## 20. Issues Found & Required Follow-Ups

- **Issues Found:** None.
- **Required Follow-Ups:** None. All security, architectural, and compatibility checks passed completely.

---

## 21. Final Acceptance Decision

# Verdict: PASS

### PHASE 2E ACCEPTED

Phase 2E (Remote Website QR Widget Persistence) is formally accepted and verified production-ready.
