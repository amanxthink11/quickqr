# PHASE 2E IMPLEMENTATION REPORT: REMOTE WEBSITE QR WIDGET PERSISTENCE

**Date:** September 25, 2026  
**Status:** COMPLETE & VERIFIED  
**Verified Baseline:**
- **Test Suite:** 230/230 tests passing across 13 test files (100% pass rate)
- **ESLint:** 0 errors, 0 warnings
- **Production Build:** Successful (standalone mode, 35 routes)
- **Hostinger Cloud Hosting Compatibility:** Verified (Node.js 22 LTS, PostgreSQL, Standalone Next.js App Router, zero external background queues/Redis dependencies)

---

## 1. Executive Summary

Phase 2E introduces **Remote Website QR Widget Persistence**. Previously in Phase 1, merchants generated static website QR widgets where the entire widget configuration was serialized and base64-encoded directly into the `<script>` tag (`data-config="..."`). If a merchant wanted to update their UPI ID, WhatsApp number, brand colors, or CTA copy, they were forced to manually edit their website's HTML/theme to replace the embed snippet.

With Phase 2E:
1. A merchant creates and configures a Website QR Widget once in the authenticated QuickQR dashboard (`/dashboard/widgets`).
2. The merchant receives a **permanent, stable embed snippet** referencing a cryptographically secure public identifier:
   ```html
   <!-- QuickQR Website QR Widget (Remote Configured) -->
   <script
     src="https://quickqr.art/widget.js"
     data-widget-id="wgt_cm123abc456def789xyz"
     async
   ></script>
   ```
3. When loaded on a customer's website, `widget.js` resolves the public configuration remotely from `/api/widget/{publicId}`.
4. The merchant can subsequently modify destinations, styling, colors, modal copy, or pause/resume the widget from the dashboard. **The customer's website embed code never needs to be changed.**
5. **100% Backward Compatibility:** Legacy Phase 1 embeds utilizing `data-config` or individual `data-*` attributes continue to render synchronously without interruption.

---

## 2. Multi-Tenant Data Model & Real Prisma Migration

### 2.1 Prisma Schema Additions (`prisma/schema.prisma`)

```prisma
enum WidgetStatus {
  ACTIVE
  PAUSED
}

model Widget {
  id             String       @id @default(cuid())
  organizationId String
  publicId       String       @unique // Stable CSPRNG public identifier (e.g. wgt_...)
  name           String       // Merchant friendly label / title
  status         WidgetStatus @default(ACTIVE)
  configuration  Json         // Full widget configuration payload (WidgetConfig)
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt
  deletedAt      DateTime?    // Soft delete timestamp

  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  @@index([organizationId, deletedAt])
  @@index([publicId])
  @@index([status])
  @@index([organizationId, createdAt])
}
```

### 2.2 Real Migration Artifact (`prisma/migrations/20260925200000_add_remote_widgets/migration.sql`)

A real, verifiable SQL migration file was generated using the Prisma engine DDL:

```sql
-- Phase 2E Migration: Remote Website QR Widget Persistence
-- CreateEnum
CREATE TYPE "WidgetStatus" AS ENUM ('ACTIVE', 'PAUSED');

-- CreateTable
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

-- CreateIndex
CREATE UNIQUE INDEX "Widget_publicId_key" ON "Widget"("publicId");

-- CreateIndex
CREATE INDEX "Widget_organizationId_deletedAt_idx" ON "Widget"("organizationId", "deletedAt");

-- CreateIndex
CREATE INDEX "Widget_publicId_idx" ON "Widget"("publicId");

-- CreateIndex
CREATE INDEX "Widget_status_idx" ON "Widget"("status");

-- CreateIndex
CREATE INDEX "Widget_organizationId_createdAt_idx" ON "Widget"("organizationId", "createdAt");

-- AddForeignKey
ALTER TABLE "Widget" ADD CONSTRAINT "Widget_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

---

## 3. Architecture & Public Widget Delivery

### 3.1 Stable Public Identifier
- Generated using `crypto.randomBytes(18)` encoded via Base62: `wgt_[18 alphanumeric chars]`.
- Entropy: $62^{18} \approx 1.84 \times 10^{32}$ combinations. Collision-resistant with 3-attempt database collision retry.
- **Zero internal ID leakage:** Internal Prisma CUIDs, organization IDs, and user IDs are never exposed in public endpoints or embed codes.

### 3.2 Public Delivery Route (`/api/widget/[publicId]/route.ts`)
- **Route:** `GET /api/widget/[publicId]` and `OPTIONS /api/widget/[publicId]`.
- **Identifier Validation:** Strictly matches `/^[a-zA-Z0-9_-]{8,64}$/`. Malformed requests return `400 Bad Request`.
- **Database Lookup:** Looks up active widget where `deletedAt: null`. If not found or soft-deleted, returns `404 Not Found`.
- **Status Check:**
  - If `status === 'ACTIVE'`: Returns HTTP 200 with sanitized configuration:
    ```json
    {
      "success": true,
      "publicId": "wgt_...",
      "name": "Widget Name",
      "status": "ACTIVE",
      "config": { ... },
      "updatedAt": "2026-09-25T14:35:00.000Z"
    }
    ```
  - If `status === 'PAUSED'`: Returns HTTP 200 with `{ success: false, status: "PAUSED", message: "This widget is currently paused by the merchant." }`. `widget.js` receives this and cleanly suppresses rendering without throwing red network errors on the merchant's website.
- **CORS Headers:**
  - `Access-Control-Allow-Origin: *`
  - `Access-Control-Allow-Methods: GET, OPTIONS`
  - `Access-Control-Allow-Headers: Content-Type, Accept`
- **Bounded Cache Control:**
  - `Cache-Control: public, max-age=60, s-maxage=60, stale-while-revalidate=120`
  - Edge and browser caching bounded to 60 seconds with background revalidation. Merchants updating their widget in the dashboard will see updates reflect on live websites within 60 seconds.

---

## 4. `widget.js` Integration & Backward Compatibility

### 4.1 Script Execution Flow (`src/widget/index.ts`)
1. On script load, `autoInit()` scans for:
   - `<script data-widget-id="...">` or `<script data-widget="...">`
2. **If `data-widget-id` is present:**
   - Extracts origin host from script `src` URL.
   - Makes an asynchronous JSON request to `${host}/api/widget/${widgetId}`.
   - If HTTP 200 and `status === 'ACTIVE'`, mounts the widget using `window.QuickQRWidget.init(undefined, data.config)`.
   - If `status === 'PAUSED'` or request fails, gracefully degrades without throwing unhandled exceptions or breaking the merchant's host webpage.
3. **If `data-widget-id` is absent (Phase 1 Embeds):**
   - Falls back immediately to synchronous `extractConfigFromDOM()` using `data-config` base64 payload or `data-*` attributes.
   - 100% backward compatibility preserved.
4. **Bundle Performance:**
   - Built via esbuild (`scripts/build-widget.js`) to `public/widget.js`.
   - Total bundle size: **44.4 KB** minified IIFE.
   - Includes standalone QR code vector generator, complete Shadow DOM encapsulation, and zero external runtime dependencies.

---

## 5. Merchant Dashboard UI (`/dashboard/widgets`)

Integrated directly into the existing `DashboardNav` architecture:
1. **Navigation:** Added `Widgets` tab with `Globe` icon (`/dashboard/widgets`).
2. **Widget List (`/dashboard/widgets/page.tsx`):**
   - Displays all widgets belonging to the active organization.
   - Shows: Name, Type, Destination summary, Status badge (`ACTIVE` green / `PAUSED` amber), Public Identifier, and Created Date.
   - Actions: One-click "Embed Code" modal, "Edit" button, "Pause/Resume" toggle, and "Delete" modal.
   - Zero-state screen guiding merchants to create their first widget.
3. **Create Widget (`/dashboard/widgets/new/page.tsx`):**
   - Full configuration form with presets: UPI, WhatsApp, Google Review, Menu, Website, Custom.
   - Live interactive simulator (`WidgetSimulator.tsx`) rendered side-by-side with desktop/mobile view toggle.
   - Real-time QR preview canvas.
   - Saves atomically and redirects to widget details.
4. **Widget Details & Remote Edit (`/dashboard/widgets/[id]/page.tsx`):**
   - Embed Code card featuring the stable embed snippet and copy button.
   - Educational banner reassuring merchants of the remote sync guarantee.
   - Edit form allowing live modifications to titles, destination URLs, colors, positions, sizing, and modal copy.
   - Status toggles (`Pause` / `Resume`) and soft-delete (`Delete`).

---

## 6. Multi-Tenant Isolation & RBAC Security

### 6.1 Tenant Boundary Guarantees
- Every database query in `src/lib/widget/service.ts` is explicitly scoped by `organizationId`:
  `where: { id: widgetId, organizationId: activeOrgId, deletedAt: null }`.
- `organizationId` is resolved server-side from `requireAuth()` and `ctx.activeOrganization.id`. Never trusted from client inputs, URL query params, or hidden form fields.
- Cross-tenant lookups return `null` (IDOR defense).
- Cross-tenant mutations throw `Widget not found or access denied`.

### 6.2 RBAC Matrix
| Role | View Widgets | Create Widget | Edit / Update Widget | Pause / Resume | Soft Delete / Archive |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **OWNER** | Allowed | Allowed | Allowed | Allowed | Allowed |
| **ADMIN** | Allowed | Allowed | Allowed | Allowed | Allowed |
| **MEMBER** | Allowed | Allowed | Allowed | Allowed | **Blocked** (ADMIN required) |
| **VIEWER** | Allowed | **Blocked** | **Blocked** | **Blocked** | **Blocked** |

### 6.3 Security & Anti-SSRF Protection
- Payloads are validated against `validateDestinationUrl` (`src/lib/validation/url-safety.ts`).
- Blocks dangerous protocols: `javascript:`, `data:`, `vbscript:`, `file:`, `blob:`, `about:`.
- Enforces anti-SSRF filtering: rejects loopback (`127.0.0.1`, `localhost`), cloud metadata (`169.254.169.254`), RFC 1918 private subnets (`10.0.0.0/8`, `192.168.0.0/16`, `172.16.0.0/12`), and single-label internal domains.
- HTML sanitization: Strips `<script>`, `<iframe>`, `onload=`, `onerror=` from all text inputs (`buttonLabel`, `popupTitle`, `popupDescription`, `ctaText`).
- Maximum string length bounds enforced on all user-controlled text inputs.

---

## 7. Analytics Integration

As required by Section 16 of the prompt:
- No second analytics system was built.
- Merchants can use their dynamic QR short URLs (`/r/{shortCode}`) as the widget's destination payload. When visitors scan the QR code displayed in the widget modal, it automatically routes through the dynamic resolver engine and records a privacy-minimizing `ScanEvent` in PostgreSQL with device, OS, browser, and coarse geographic attribution.

---

## 8. Verification & Test Results

### 8.1 Automated Test Execution (`npm test`)

```text
 RUN  v5.0.1 F:/QR-Web

 ✓ tests/qr-payloads.test.ts (17 tests) 10ms
 ✓ tests/table-stand.test.ts (8 tests) 7ms
 ✓ tests/widget.test.ts (10 tests) 12ms
 ✓ tests/qr-download.test.ts (8 tests) 7ms
 ✓ tests/qr-validation.test.ts (22 tests) 13ms
 ✓ tests/upi-stand.test.ts (10 tests) 65ms
 ✓ tests/phase2c-dashboard.test.ts (21 tests) 35ms
 ✓ tests/phase2b-redirect.test.ts (36 tests) 30ms
 ✓ tests/qr-decoding.test.ts (6 tests) 140ms
 ✓ tests/phase2e-widget.test.ts (22 tests) 31ms
 ✓ tests/phase2d-analytics.test.ts (30 tests) 32ms
 ✓ tests/phase2a-flows.test.ts (8 tests) 281ms
 ✓ tests/phase2a.test.ts (32 tests) 402ms

 Test Files  13 passed (13)
      Tests  230 passed (230)
   Duration  991ms
```

### 8.2 ESLint Execution (`npm run lint`)

```text
> quickqr@1.0.0 lint
> eslint

Exit code: 0 (0 errors, 0 warnings)
```

### 8.3 Production Build Execution (`npm run build`)

```text
> quickqr@1.0.0 build
> node scripts/build-widget.js && next build && node scripts/copy-standalone-assets.js

[build-widget] Bundling widget to public/widget.js...
  public\widget.js  44.4kb
Done in 8ms
[build-widget] Successfully built public/widget.js (44 KB)
▲ Next.js 16.3.6 (Turbopack)
- Environments: .env
✓ Running next.config.ts took 25ms
  Creating an optimized production build ...
✓ Compiled successfully in 1219ms
  Running TypeScript ...
  Finished TypeScript in 1893ms ...
✓ Generating static pages using 15 workers (25/25) in 699ms

Route (app)
┌ ○ /
├ ○ /_not-found
├ ƒ /api/widget/[publicId]
├ ƒ /dashboard
├ ƒ /dashboard/analytics
├ ƒ /dashboard/qr-codes
├ ƒ /dashboard/qr-codes/[id]
├ ƒ /dashboard/qr-codes/new
├ ƒ /dashboard/settings
├ ƒ /dashboard/widgets
├ ƒ /dashboard/widgets/[id]
├ ƒ /dashboard/widgets/new
...
└ ○ /wifi-qr-code-generator

✓ [standalone] Copied .next/static to .next/standalone/.next/static
✓ [standalone] Copied public to .next/standalone/public
Exit code: 0
```

---

## 9. Known Limitations

1. **Remote Propagation Window:** Updates take up to 60 seconds to propagate to existing browser sessions due to the intentional `max-age=60` cache headers designed to protect merchant servers from high-frequency embed traffic.
2. **Offline Webpages:** If a merchant website visitor is completely offline, remote widget configuration fetching cannot succeed until network connectivity is restored.
3. **No Domain Whitelisting Enforcement (Deferred to Phase 2F):** The `Widget` model supports basic multi-tenancy. Strict HTTP `Origin` header whitelisting / CSP restriction per embed host is prepared but not enforced in Phase 2E to avoid breaking merchants testing on preview URLs (Vercel/Netlify preview domains, staging sites).

---

## 10. Conclusion & Acceptance Readiness

Phase 2E has satisfied all prompt requirements with:
- Real Prisma migration file `prisma/migrations/20260925200000_add_remote_widgets/migration.sql`
- Tenant-isolated database model and service layer
- Stable CSPRNG public identifier (`wgt_...`)
- Public widget delivery endpoint with CORS and bounded caching
- `widget.js` remote auto-init with 100% Phase 1 backward compatibility
- Full merchant dashboard at `/dashboard/widgets`, `/dashboard/widgets/new`, and `/dashboard/widgets/[id]`
- Comprehensive automated test suite (`tests/phase2e-widget.test.ts`)
- 230/230 tests passing, 0 ESLint errors/warnings, and successful standalone production build.

Phase 2E is **COMPLETE**. Ready for formal review.
