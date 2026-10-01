# Phase 2 Technical Architecture: QuickQR SaaS Platform

## Executive Summary

Phase 1 established QuickQR India as an ultra-fast, client-side, zero-latency static QR generator with dedicated Indian business features (UPI Counter Stands, Table QR Stands, WhatsApp Lead Generation, and Website QR Floating Widgets).

**Phase 2 transforms QuickQR from a standalone utility into a commercial multi-tenant QR SaaS platform** with:
1. **Dynamic QR Codes & Instant Redirection Engine** (`qr.quickqr.in/q/{shortCode}`)
2. **Asynchronous, High-Performance Scan Analytics**
3. **Multi-Tenant Account & Organization Hierarchy** (Users, Teams, Role-Based Access)
4. **Remotely Persisted Website Widgets** (Modifiable CTAs, colors, and destinations without re-embedding code)
5. **Campaigns & Bulk Management**
6. **Developer REST API** (Token-authenticated with rate limiting)
7. **Tiered Subscription Engine** (Configurable quota matrices without hardcoded business rules)
8. **Production-Ready Hostinger Cloud Hosting Architecture** (Node.js, PostgreSQL, Prisma, Redis/in-process caching)

> **Architectural Guardrail**:  
> All existing Phase 1 static generator tools (`/upi-qr-code-generator`, `/whatsapp-qr-code-generator`, etc.) will remain 100% functional and free forever without requiring login. Dynamic QR capabilities, analytics, and managed widgets layer on top as the SaaS value proposition.

---

## 1. System Architecture Overview

```
                                      [ Internet Traffic ]
                                               │
                       ┌───────────────────────┴──────────────────────┐
                       ▼                                              ▼
          [ qr.quickqr.in/q/{shortCode} ]               [ app.quickqr.in / www ]
             (Ultra-Fast Edge Redirect)                  (SaaS Dashboard & Marketing)
                       │                                              │
         ┌─────────────┴─────────────┐                                │
         ▼                           ▼                                ▼
   [ In-Memory LRU /            [ Fallback DB ]             [ Next.js App Router ]
   Redis Cache Layer ]          (Indexed Lookup)             (Auth, Org, CRUD, UI)
         │                           │                                │
         │ (Cache Hit: <10ms)        │ (Cache Miss: <30ms)            │
         └─────────────┬─────────────┘                                │
                       │                                              │
         ┌─────────────▼─────────────┐                                │
         │  Validate Destination &   │                                │
         │  Send HTTP 302 Redirect   │                                │
         └─────────────┬─────────────┘                                │
                       │                                              │
                       ▼ (Fire & Forget Async)                        ▼
         ┌───────────────────────────┐                  ┌──────────────────────────┐
         │  Scan Analytics Ingestion │                  │   Prisma ORM Client      │
         │  (Buffer / Worker Queue)  │                  │  (Tenant-Scoped Queries) │
         └─────────────┬─────────────┘                  └─────────────┬────────────┘
                       ▼                                              ▼
        ┌────────────────────────────────────────────────────────────────────────┐
        │                 PostgreSQL Database (Hostinger Cloud)                  │
        │      Users • Orgs • QRCodes • Destinations • ScanEvents • Widgets      │
        └────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Multi-Tenancy & Ownership Model

The system utilizes **Shared Database with Column-Level Tenant Isolation** (`organizationId`), providing high cost-efficiency, seamless connection pooling on Hostinger Cloud, and frictionless onboarding.

### Ownership Hierarchy
```
User
  └── Membership (Role: OWNER, ADMIN, MEMBER, VIEWER)
        └── Organization (Tenant Boundary)
              ├── QRCode (Dynamic & Static Records)
              │     ├── QRCodeDestination (Target history & active URL)
              │     └── ScanEvent (Time-series scan data)
              ├── Campaign (Grouping & Tagging)
              ├── Widget (Website QR Floating Widgets)
              │     └── WidgetConfiguration (Remote styling & behavior)
              ├── ApiKey (Programmatic Access)
              └── Subscription (Plan, Quotas, Billing Status)
```

### Multi-Tenancy Principles
1. **Users belong to multiple Organizations**: A marketing agency user can switch between client businesses from a single login.
2. **Every resource is bounded by an `organizationId`**: All Prisma queries for QR codes, analytics, and widgets unconditionally filter by `where: { organizationId }`.
3. **Role-Based Access Control (RBAC)**:
   - `OWNER`: Full billing, member management, org deletion, API keys, and QR CRUD.
   - `ADMIN`: Member management (non-owners), API keys, QR CRUD, Widget editing.
   - `MEMBER`: QR CRUD, view analytics, manage campaigns.
   - `VIEWER`: Read-only access to QR codes and analytics reports.

---

## 3. Database Schema Design (PostgreSQL + Prisma)

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// -------------------------------------------------------------
// ENUMS
// -------------------------------------------------------------

enum UserRole {
  OWNER
  ADMIN
  MEMBER
  VIEWER
}

enum QRType {
  DYNAMIC_URL
  STATIC_URL
  UPI
  WHATSAPP
  VCARD
  WIFI
  EMAIL
  TEXT
}

enum QRStatus {
  ACTIVE
  PAUSED
  ARCHIVED
  EXPIRED
}

enum SubscriptionTier {
  FREE
  STARTER
  PRO
  ENTERPRISE
}

enum SubscriptionStatus {
  ACTIVE
  TRIALING
  PAST_DUE
  CANCELED
  UNPAID
}

enum DeviceCategory {
  MOBILE
  TABLET
  DESKTOP
  UNKNOWN
}

// -------------------------------------------------------------
// USER & AUTHENTICATION
// -------------------------------------------------------------

model User {
  id                    String        @id @default(cuid())
  email                 String        @unique
  passwordHash          String?       // Nullable for OAuth accounts
  fullName              String
  avatarUrl             String?
  emailVerifiedAt       DateTime?
  lastLoginAt           DateTime?
  createdAt             DateTime      @default(now())
  updatedAt             DateTime      @updatedAt

  memberships           Membership[]
  sessions              Session[]
  passwordResetTokens   PasswordResetToken[]
  auditLogs             AuditLog[]

  @@index([email])
}

model Session {
  id           String   @id @default(cuid())
  userId       String
  tokenHash    String   @unique
  ipAddress    String?
  userAgent    String?
  expiresAt    DateTime
  createdAt    DateTime @default(now())

  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([tokenHash])
  @@index([userId])
}

model PasswordResetToken {
  id        String   @id @default(cuid())
  userId    String
  tokenHash String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([tokenHash])
}

// -------------------------------------------------------------
// ORGANIZATION & TENANCY
// -------------------------------------------------------------

model Organization {
  id            String        @id @default(cuid())
  name          String
  slug          String        @unique
  logoUrl       String?
  customDomain  String?       @unique // e.g. qr.clientstore.in
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
  deletedAt     DateTime?     // Soft delete

  memberships   Membership[]
  qrCodes       QRCode[]
  campaigns     Campaign[]
  widgets       Widget[]
  apiKeys       ApiKey[]
  subscription  Subscription?
  auditLogs     AuditLog[]

  @@index([slug])
  @@index([deletedAt])
}

model Membership {
  id             String       @id @default(cuid())
  userId         String
  organizationId String
  role           UserRole     @default(MEMBER)
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt

  user           User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  @@unique([userId, organizationId])
  @@index([organizationId])
  @@index([userId])
}

// -------------------------------------------------------------
// QR ENGINE & REDIRECTION
// -------------------------------------------------------------

model QRCode {
  id               String              @id @default(cuid())
  organizationId   String
  campaignId       String?
  shortCode        String              @unique // e.g. "x8k2nP9" (Base62)
  title            String
  type             QRType              @default(DYNAMIC_URL)
  status           QRStatus            @default(ACTIVE)
  
  // Customization styling (JSON payload matching QRCustomization)
  styling          Json
  
  // Dynamic controls
  expiresAt        DateTime?
  scanLimit        Int?                // Maximum allowable scans before pause
  totalScans       Int                 @default(0)

  createdAt        DateTime            @default(now())
  updatedAt        DateTime            @updatedAt
  deletedAt        DateTime?           // Soft delete

  organization     Organization        @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  campaign         Campaign?           @relation(fields: [campaignId], references: [id], onDelete: SetNull)
  destinations     QRCodeDestination[]
  scanEvents       ScanEvent[]
  widgets          Widget[]

  @@index([organizationId, deletedAt])
  @@index([shortCode])
  @@index([campaignId])
}

model QRCodeDestination {
  id             String    @id @default(cuid())
  qrCodeId       String
  destinationUrl String    // Validated HTTPS target URL
  isActive       Boolean   @default(true)
  
  // UTM & attribution presets
  utmSource      String?
  utmMedium      String?
  utmCampaign    String?
  
  createdAt      DateTime  @default(now())
  deactivatedAt  DateTime?

  qrCode         QRCode    @relation(fields: [qrCodeId], references: [id], onDelete: Cascade)

  @@index([qrCodeId, isActive])
}

// -------------------------------------------------------------
// ANALYTICS (ANONYMIZED TIME-SERIES)
// -------------------------------------------------------------

model ScanEvent {
  id             String          @id @default(cuid())
  qrCodeId       String
  organizationId String
  campaignId     String?
  
  timestamp      DateTime        @default(now())
  
  // Client Environment
  deviceCategory DeviceCategory  @default(UNKNOWN)
  os             String?         // iOS, Android, Windows, macOS, Linux
  browser        String?         // Chrome, Safari, Firefox, Edge, etc.
  
  // Location (Resolved via GeoIP at scan time, raw IP discarded)
  countryCode    String?         // ISO 3166-1 alpha-2 (e.g. "IN", "US")
  region         String?         // State/Province (e.g. "Maharashtra", "Karnataka")
  city           String?         // City (e.g. "Mumbai", "Bengaluru")
  
  // Traffic Origin
  referrer       String?         // Referrer header if available
  
  // Daily Visitor Hash: sha256(ip + userAgent + salt + date) for unique count without storing IP
  visitorHash    String?

  qrCode         QRCode          @relation(fields: [qrCodeId], references: [id], onDelete: Cascade)

  // Indexes designed for high-performance aggregation queries
  @@index([qrCodeId, timestamp])
  @@index([organizationId, timestamp])
  @@index([campaignId, timestamp])
  @@index([timestamp])
}

// -------------------------------------------------------------
// CAMPAIGNS
// -------------------------------------------------------------

model Campaign {
  id             String       @id @default(cuid())
  organizationId String
  name           String
  description    String?
  colorTag       String?      // Hex color for UI categorization
  targetScans    Int?
  startDate      DateTime?
  endDate        DateTime?
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt
  deletedAt      DateTime?

  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  qrCodes        QRCode[]

  @@index([organizationId, deletedAt])
}

// -------------------------------------------------------------
// WEBSITE WIDGETS
// -------------------------------------------------------------

model Widget {
  id                  String               @id @default(cuid())
  organizationId      String
  qrCodeId            String
  name                String
  domainWhitelist     String[]             // Allowed origins for embed execution
  isActive            Boolean              @default(true)
  createdAt           DateTime             @default(now())
  updatedAt           DateTime             @updatedAt
  deletedAt           DateTime?

  organization        Organization         @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  qrCode              QRCode               @relation(fields: [qrCodeId], references: [id], onDelete: Restrict)
  configuration       WidgetConfiguration?

  @@index([organizationId, deletedAt])
}

model WidgetConfiguration {
  id             String   @id @default(cuid())
  widgetId       String   @unique
  
  position       String   @default("bottom-right") // bottom-right, bottom-left
  buttonText     String   @default("Scan & Pay")
  buttonColor    String   @default("#0f172a")
  textColor      String   @default("#ffffff")
  popupTitle     String   @default("Scan to Pay with UPI")
  popupSubtitle  String   @default("Use Google Pay, PhonePe, Paytm, or BHIM")
  badgeText      String?  @default("Instant Payment")
  logoUrl        String?
  showAnimation  Boolean  @default(true)
  autoOpenDelay  Int?     // Milliseconds (null if manual click only)
  
  updatedAt      DateTime @updatedAt

  widget         Widget   @relation(fields: [widgetId], references: [id], onDelete: Cascade)
}

// -------------------------------------------------------------
// DEVELOPER API KEYS
// -------------------------------------------------------------

model ApiKey {
  id             String       @id @default(cuid())
  organizationId String
  name           String       // Friendly label (e.g. "Staging Backend")
  keyPrefix      String       // First 8 characters (e.g. "qrapi_live_")
  keyHash        String       @unique // SHA-256 hash of secret key
  scopes         String[]     @default(["qr:read", "qr:write"])
  expiresAt      DateTime?
  lastUsedAt     DateTime?
  createdAt      DateTime     @default(now())
  revokedAt      DateTime?

  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  @@index([keyHash])
  @@index([organizationId])
}

// -------------------------------------------------------------
// SUBSCRIPTIONS & QUOTAS
// -------------------------------------------------------------

model Subscription {
  id                   String             @id @default(cuid())
  organizationId       String             @unique
  tier                 SubscriptionTier   @default(FREE)
  status               SubscriptionStatus @default(ACTIVE)
  
  // Payment Gateway Reference (e.g. Razorpay / Stripe)
  paymentProvider      String?            // "razorpay" | "stripe"
  externalCustomerId   String?
  externalSubscriptionId String?
  
  currentPeriodStart   DateTime           @default(now())
  currentPeriodEnd     DateTime
  cancelAtPeriodEnd    Boolean            @default(false)
  
  // Custom Overrides (null means follow tier defaults)
  maxDynamicQRs        Int?
  maxMonthlyScans      Int?
  maxTeamMembers       Int?
  analyticsRetentionDays Int?
  allowCustomDomain    Boolean?
  allowApiAccess       Boolean?

  createdAt            DateTime           @default(now())
  updatedAt            DateTime           @updatedAt

  organization         Organization       @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  @@index([externalSubscriptionId])
}

// -------------------------------------------------------------
// SECURITY & AUDIT TRAIL
// -------------------------------------------------------------

model AuditLog {
  id             String       @id @default(cuid())
  organizationId String
  userId         String?
  action         String       // e.g. "QR_DESTINATION_UPDATED", "MEMBER_INVITED"
  resourceType   String       // "QRCode", "Widget", "Membership"
  resourceId     String
  metadata       Json?
  ipAddress      String?
  createdAt      DateTime     @default(now())

  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  user           User?        @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@index([organizationId, createdAt])
}
```

---

## 4. Dynamic QR Redirection Engine

### Short Code Architecture (`qr.quickqr.in/q/{shortCode}`)
- **Format**: URL-safe Base62 (`[0-9a-zA-Z]`) using cryptographically secure random generation (e.g., `nanoid` alphabet `0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ`).
- **Length**: 7 characters.
- **Entropy**: $62^7 \approx 3.52 \times 10^{12}$ (3.5 trillion unique combinations).
- **Collision Handling**: Database unique constraint on `shortCode` + auto-retry loop (up to 3 attempts upon rare collision during creation).
- **Anti-Enumeration**: High entropy prevents sequential crawling or enumeration of merchant destinations.

### Fast Redirection Flow
```
User scans QR
  ↓
GET /q/{shortCode}
  ↓
Check In-Memory LRU / Local Redis Cache (Lookup key: `qr:code:{shortCode}`)
  ├── CACHE HIT (< 5ms):
  │     Extract { status, activeDestinationUrl, expiresAt, scanLimit, totalScans, qrId, orgId, campaignId }
  │
  └── CACHE MISS (15-25ms):
        Query DB via Prisma:
        SELECT qr.*, dest.destinationUrl 
        FROM "QRCode" qr 
        JOIN "QRCodeDestination" dest ON dest."qrCodeId" = qr.id AND dest."isActive" = true
        WHERE qr."shortCode" = $1 AND qr."deletedAt" IS NULL;
        Populate Cache with TTL (e.g. 5 minutes or invalidation on update).
  ↓
Evaluate Availability:
  - If status != ACTIVE → Redirect to branded fallback status page (`/q-status/paused`)
  - If expiresAt < now() → Redirect to branded fallback status page (`/q-status/expired`)
  - If scanLimit && totalScans >= scanLimit → Redirect to (`/q-status/limit-reached`)
  ↓
Validate Destination URL:
  - Must parse via strict WHATWG URL API
  - Protocol must strictly equal `https:` or `http:` (NEVER `javascript:`, `data:`, `file:`, `vbscript:`)
  - Destination hostname cannot resolve to localhost, 127.0.0.1, 10.0.0.0/8, 192.168.0.0/16, or 169.254.169.254 (SSRF & loopback protection)
  ↓
Fire & Forget: Dispatch ScanEvent to Async Processing Buffer
  ↓
Return HTTP 302 Found (or 307 Temporary Redirect) with Location: destinationUrl
(Total redirection latency: < 20ms on cache hit, < 40ms on cache miss)
```

### Destination Update Guarantee
When a merchant modifies their destination URL in the dashboard:
1. `QRCodeDestination` row is created/updated.
2. Invalidation message is broadcast (`cache.del('qr:code:' + shortCode)`).
3. The printed QR code remains 100% identical and immediately routes future scans to the new URL without reprinting.

---

## 5. Analytics & Aggregation Engine

### Privacy-Preserving Scan Collection
QuickQR strictly follows privacy-first analytics:
1. **Zero Raw IP Storage**: The client IP is used in-memory solely for:
   - MaxMind GeoLite2 lookup (Country, State/Region, City).
   - Computing a 24-hour salted visitor hash: `sha256(ip + userAgent + orgSalt + date)`.
   - Raw IP is discarded immediately and never persisted.
2. **Aggregated Dimensions**:
   - `DeviceCategory`: Mobile, Desktop, Tablet (parsed via lightweight user-agent parser).
   - `OperatingSystem`: Android, iOS, Windows, macOS, Linux.
   - `Browser`: Chrome, Safari, Firefox, Edge, In-App (Instagram/WhatsApp browser).
   - `Referrer`: Factual source if provided by scanner.

### Asynchronous Ingestion Architecture
To prevent analytics writes from degrading redirect response times:
1. **Low Volume (Free / Starter)**: In-process buffered batcher flushes scan events every 3 seconds or when the buffer hits 50 records via `prisma.scanEvent.createMany()`.
2. **High Volume (Pro / Enterprise)**: Node.js worker with Redis stream or `pg-boss` background job processor on Hostinger Cloud.
3. **Database Indexing**:
   - Compounded index on `(qrCodeId, timestamp DESC)` for fast dashboard graph queries.
   - Compounded index on `(organizationId, timestamp DESC)` for org-wide rollups.

---

## 6. Website QR Widget Remote Persistence Architecture

The existing Phase 1 `/website-qr-widget` generator and `/widget.js` bundle are preserved and enhanced with remote persistence.

### Architecture Workflow
```
Merchant Dashboard (/dashboard/widgets)
  ↓
Save Widget Configurations in Database
(CTA text, button colors, position, popup subtitle, UPI payload, logo, auto-open)
  ↓
Embed Snippet Generated:
<script 
  src="https://quickqr.in/widget.js" 
  data-widget-id="wgt_cm123xyz" 
  async>
</script>
  ↓
Visitor loads Merchant Website
  ↓
widget.js detects `data-widget-id`
  ↓
Fast HTTP GET: https://quickqr.in/api/v1/widgets/wgt_cm123xyz/config
(Cached on CDN / Edge with 60s TTL; headers include Cache-Control: public, max-age=60)
  ↓
widget.js initializes floating button with merchant's remote styling!
```

### Merchant Value
The merchant pastes the `<script>` tag once. From then on, they can change the QR type from UPI to WhatsApp, update their UPI ID, change holiday festival greetings, or adjust colors directly from the QuickQR dashboard **without asking a web developer to touch the website code again**.

---

## 7. Authentication, Sessions & Security on Hostinger Cloud

Hostinger Cloud Hosting runs standard Linux environments with Node.js and PostgreSQL. Complex, vendor-locked authentication services (like Supabase Auth or AWS Cognito) are avoided in favor of a robust, self-hosted Next.js authentication architecture.

### Auth Implementation
- **Session Strategy**: Database-backed sessions with cryptographically random tokens (SHA-256 hashed in database).
- **Password Hashing**: **Argon2id** (memory cost: 65536 KB, iterations: 3) or **bcrypt** with salt rounds 12.
- **Cookie Security**:
  ```ts
  cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  };
  ```
- **Login Abuse Protection**:
  - Sliding-window rate limiter on `/api/auth/login`: max 5 attempts per 15 minutes per IP + email combination.
  - Progressive backoff delay after 3 failed attempts.
  - Timing attack prevention (constant-time password comparisons).
- **CSRF Protection**: Native Next.js Server Actions enforce Origin and Referer checks. REST API routes verify custom headers (`Content-Type: application/json` or `X-QuickQR-Request: 1`) preventing simple cross-origin form submissions.

---

## 8. REST API Architecture

### Endpoints Specification

| Method | Endpoint | Description | Scope Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/qr` | Create a dynamic or static QR code | `qr:write` |
| `GET` | `/api/v1/qr` | List QR codes for the organization (paginated) | `qr:read` |
| `GET` | `/api/v1/qr/:id` | Retrieve specific QR code and active destination | `qr:read` |
| `PATCH` | `/api/v1/qr/:id` | Update title, styling, or active destination URL | `qr:write` |
| `DELETE` | `/api/v1/qr/:id` | Soft delete a QR code (returns HTTP 204) | `qr:write` |
| `GET` | `/api/v1/analytics` | Fetch aggregated scan metrics across dates | `analytics:read`|
| `GET` | `/api/v1/widgets` | List organization widgets | `widget:read` |

### API Key Security & Rate Limiting
- **Key Generation**: `qrapi_live_` + 32 cryptographically random bytes.
- **Storage**: Key prefix (`qrapi_live_abc12345`) stored in clear text for display; secret key is hashed with SHA-256 before storage in `ApiKey.keyHash`.
- **Rate Limiting**:
  - `Free`: 60 requests / minute
  - `Pro`: 600 requests / minute
  - `Enterprise`: 3000 requests / minute
  - Standard headers returned: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`.

---

## 9. Subscription & Quota Management

Instead of hardcoding plan conditions into business logic, Phase 2 implements a **Declarative Plan Matrix**:

```ts
export interface PlanDefinition {
  tier: SubscriptionTier;
  name: string;
  priceMonthlyINR: number;
  features: {
    maxDynamicQRs: number;
    maxMonthlyScans: number;
    maxTeamMembers: number;
    analyticsRetentionDays: number;
    allowCustomDomain: boolean;
    allowApiAccess: boolean;
    allowWhiteLabelWidgets: boolean;
    allowVectorExport300DPI: boolean;
  };
}

export const PLAN_MATRIX: Record<SubscriptionTier, PlanDefinition> = {
  FREE: {
    tier: 'FREE',
    name: 'Starter Free',
    priceMonthlyINR: 0,
    features: {
      maxDynamicQRs: 3,
      maxMonthlyScans: 500,
      maxTeamMembers: 1,
      analyticsRetentionDays: 7,
      allowCustomDomain: false,
      allowApiAccess: false,
      allowWhiteLabelWidgets: false,
      allowVectorExport300DPI: true,
    },
  },
  STARTER: {
    tier: 'STARTER',
    name: 'Business Pro',
    priceMonthlyINR: 499,
    features: {
      maxDynamicQRs: 25,
      maxMonthlyScans: 10000,
      maxTeamMembers: 3,
      analyticsRetentionDays: 90,
      allowCustomDomain: false,
      allowApiAccess: true,
      allowWhiteLabelWidgets: true,
      allowVectorExport300DPI: true,
    },
  },
  PRO: {
    tier: 'PRO',
    name: 'Agency & Scale',
    priceMonthlyINR: 1499,
    features: {
      maxDynamicQRs: 150,
      maxMonthlyScans: 100000,
      maxTeamMembers: 10,
      analyticsRetentionDays: 365,
      allowCustomDomain: true,
      allowApiAccess: true,
      allowWhiteLabelWidgets: true,
      allowVectorExport300DPI: true,
    },
  },
  ENTERPRISE: {
    tier: 'ENTERPRISE',
    name: 'Custom Enterprise',
    priceMonthlyINR: 4999,
    features: {
      maxDynamicQRs: 10000,
      maxMonthlyScans: 5000000,
      maxTeamMembers: 100,
      analyticsRetentionDays: 730,
      allowCustomDomain: true,
      allowApiAccess: true,
      allowWhiteLabelWidgets: true,
      allowVectorExport300DPI: true,
    },
  },
};
```

Quota checks are unified through an authorization guard:
```ts
await verifyQuota(organizationId, 'maxDynamicQRs');
```

---

## 10. Hostinger Cloud Production Operations & Deployment

QuickQR is designed to run seamlessly on **Hostinger Cloud Hosting** (Ubuntu LTS with KVM virtualization, Node.js runtime, and managed/local PostgreSQL).

### Production Infrastructure Stack
1. **Web / Application Server**: Node.js 22 LTS running the Next.js Standalone server (`node .next/standalone/server.js`) supervised by **PM2**.
2. **Reverse Proxy & SSL**: Nginx with automated Let's Encrypt SSL certificates (HTTP/2 enabled, Brotli compression, static file caching for `/_next/static/` and `/payment-apps/`).
3. **Database**: PostgreSQL 16 with standard connection pooling (`connection_limit=20`, statement timeout=10000ms).
4. **Caching & Queue**: Local Redis instance or PostgreSQL-backed queue (`pg-boss`) for zero additional infrastructure dependencies.
5. **Backups**:
   - Nightly `pg_dump` compressed backups sent to offsite encrypted storage.
   - 7-day point-in-time recovery on transactional logs.

### Database Migration Strategy
- Migrations are managed via `npx prisma migrate dev` in local development.
- Production deployment runs `npx prisma migrate deploy` in the CI/CD pipeline prior to restarting PM2 workers.
- Zero-downtime schema migrations: Columns are added as nullable or with defaults before application code references them.

### PM2 Configuration (`ecosystem.config.js`)
```javascript
module.exports = {
  apps: [
    {
      name: 'quickqr-web',
      script: '.next/standalone/server.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        PORT: 3000,
        NODE_ENV: 'production',
      },
    },
  ],
};
```

---

## 11. Security Hardening Checklist

| Threat Vector | Mitigation Strategy | Implemented In |
| :--- | :--- | :--- |
| **Open Redirect Abuse** | Destination URLs are strictly validated against RFC 3986. Only `https:` and `http:` protocols are permitted. Phishing blocklists and domain blacklisting are checked prior to activation. | Redirect Handler |
| **SSRF & Loopback Attacks** | Hostnames resolving to private IP ranges (`127.0.0.1`, `10.*`, `192.168.*`, `169.254.*`) are strictly rejected. | URL Validator |
| **Tenant Data Leakage** | All Prisma queries enforce `{ where: { organizationId } }` using context middleware. Composite unique indexes enforce tenant boundaries. | Service Layer / ORM |
| **Short-Code Enumeration** | 7-character Base62 random generation provides 3.5 trillion permutations. Automated crawlers receive IP rate limits. | Redirect Handler |
| **Bot Scanning Ingestion Spikes** | Known crawler User-Agents (Googlebot, Bingbot, Twitterbot, WhatsApp previewer) do not increment scan counts or generate analytics events. | Async Analytics Buffer |
| **SQL Injection** | 100% parameterization via Prisma ORM. No raw string concatenation permitted in SQL queries. | Global Data Access |
| **Cross-Site Scripting (XSS)** | Print layouts and canvas renderers rigorously escape all merchant text using `escapeXml()` and sanitize HTML. | `upi-stand.ts` |
| **Secret Management** | API keys and session tokens are never stored in cleartext; SHA-256 hashes are used for lookups. Passwords hashed with Argon2id. | Auth Module |

---

## 12. Recommended Phase 2 Implementation Order

```
[ Phase 2A: Core DB & Auth ]
  • Initialize Prisma with PostgreSQL
  • User signup, login, email verification, sessions
  • Organization creation & RBAC membership
  • Tenant isolation middleware

[ Phase 2B: Dynamic QR Redirect Engine ]
  • Short code generator (Base62 nanoid)
  • /q/{shortCode} ultra-fast redirect route
  • In-memory LRU / Redis cache
  • Strict URL security & anti-SSRF validation

[ Phase 2C: Merchant Dashboard ]
  • Organization switcher
  • Dynamic QR creation & editing UI
  • Real-time destination updates without reprinting
  • UPI Counter Stand & Table Stand saved presets

[ Phase 2D: Analytics Engine ]
  • Asynchronous scan logger (GeoIP + Device + OS)
  • Daily aggregation pipelines
  • Charts & reports in merchant dashboard (scans over time, device split, cities)

[ Phase 2E: Website Widget Remote Backend ]
  • Widget persistence in PostgreSQL
  • Dynamic config API (/api/v1/widgets/:id/config)
  • Embed script remote sync without site code changes

[ Phase 2F: Developer API & Subscriptions ]
  • API Key management (SHA-256 hashed)
  • REST API routes with sliding-window rate limiting
  • Razorpay / Stripe billing integration & quota enforcement
```
