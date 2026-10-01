# Phase 2A Architecture Hardening Review & Technical Specification

**Document Version:** 1.0.0  
**Target Milestone:** Phase 2A (Database, Authentication, Multi-Tenant Organizations, and RBAC)  
**Status:** **APPROVED WITH CHANGES**  
**Author:** Antigravity Engineering Team  
**Review Date:** 2026-09-25  

---

## Executive Summary

Phase 1 successfully delivered a production-ready, client-side, zero-latency static QR generator with dedicated Indian commerce tools (UPI Counter Stands, Table Stands, WhatsApp Click-to-Chat, and Website QR Floating Widgets).

This document performs an exhaustive **architecture hardening review** before any Phase 2 implementation begins. It rectifies terminology, refines multi-tenant boundaries, slims the initial data model strictly to Phase 2A essentials, tightens URL security, replaces flawed analytics assumptions with privacy-minimizing designs, documents third-party payment asset rights accurately, verifies Hostinger Cloud deployability, and establishes strict phase boundaries.

> **Phase 2A Implementation Guardrail:**  
> No application code, database schema migrations, authentication logic, or dynamic redirection endpoints are to be created until this review is formally approved and accepted. Phase 1 static generator tools remain completely intact and unauthenticated.

---

## 1. Multi-Tenancy Architecture (Correction & Hardening)

### 1.1 Correction: Application-Level Tenant Isolation
In preliminary architecture notes, the isolation model was loosely described as "column-level tenant isolation." **This terminology is corrected to Application-Level Tenant Isolation.**

- **Rationale**: True "column-level isolation" implies PostgreSQL Row Level Security (RLS) with session-bound database roles (`current_setting('app.current_org_id')`). Because QuickQR uses standard Node.js connection pooling via Prisma ORM on Hostinger Cloud, tenant isolation is enforced at the **Application / Data Access Layer**, not via database RLS.
- **Tenant Boundary**: `Organization` is the primary and non-negotiable tenant boundary.
- **Direct Ownership**: Every organization-owned entity (`QRCode`, `Membership`, `Session`, and future `Widget`/`Campaign`) must either maintain a direct `organizationId` foreign key or a strict, non-nullable relational path verified at the application query level.
- **Server-Side Enforcement**: UI hiding or client-side checks are purely cosmetic. Every single API route, Next.js Server Action, and database query must enforce tenant ownership server-side.

### 1.2 IDOR (Insecure Direct Object Reference) Prevention
To ensure cross-tenant object access is mathematically impossible through predictable or guessed IDs:
1. **Scoped Lookups**: Every update, retrieval, or deletion of a resource must include both the resource ID and the authenticated user's active tenant ID:
   ```ts
   // MANDATORY PATTERN for all Phase 2 queries:
   const qr = await prisma.qRCode.findFirst({
     where: {
       id: resourceId,
       organizationId: currentOrgId, // Tenant guard
       deletedAt: null,
     },
   });
   if (!qr) throw new NotFoundError(); // Never leak existence across tenants
   ```
2. **CUIDs / UUIDs**: All primary keys use collision-resistant, non-sequential CUIDs (`cuid()`), eliminating integer ID enumeration attacks.

### 1.3 Multi-Membership & Organization Hierarchy
A single `User` account may belong to multiple `Organizations` (e.g., a digital marketing consultant managing three independent retail businesses):
```
User (Global Account Identity)
  │
  ├── Membership A (Role: OWNER)  ───► Organization 1 ("Gupta Supermart")
  └── Membership B (Role: VIEWER) ───► Organization 2 ("Royal Cafe")
```

### 1.4 Role-Based Access Control (RBAC) Matrix
Phase 2A defines four distinct roles managed within the `Membership` record:

| Permission | OWNER | ADMIN | MEMBER | VIEWER |
| :--- | :---: | :---: | :---: | :---: |
| Delete Organization | ✅ | ❌ | ❌ | ❌ |
| Transfer Ownership | ✅ | ❌ | ❌ | ❌ |
| Manage Billing / Subscriptions (Future) | ✅ | ❌ | ❌ | ❌ |
| Invite / Remove Members | ✅ | ✅ (non-owners) | ❌ | ❌ |
| Change Member Roles | ✅ | ✅ (lower roles) | ❌ | ❌ |
| Create / Edit / Delete QR Codes | ✅ | ✅ | ✅ | ❌ |
| Update QR Destination URL | ✅ | ✅ | ✅ | ❌ |
| View QR Codes & Analytics | ✅ | ✅ | ✅ | ✅ |

---

## 2. Phase 2A Data Model Specification (Prisma + PostgreSQL)

To avoid premature complexity, Phase 2A is strictly pruned to the **six foundational models** required for authentication, tenancy, and dynamic QR persistence. Advanced entities (`Campaign`, `Widget`, `WidgetConfiguration`, `ApiKey`, `Subscription`, `ScanEvent`, and `AuditLog`) are deferred to their respective future phases.

### 2.1 Model Specifications

#### 1. `User`
Represents an individual human identity across the platform.
- **Fields**:
  - `id`: `String` (CUID, PK)
  - `email`: `String` (Normalized lowercase, unique, indexed)
  - `passwordHash`: `String?` (Argon2id hash; nullable to allow future OAuth)
  - `fullName`: `String`
  - `avatarUrl`: `String?`
  - `emailVerifiedAt`: `DateTime?`
  - `lastLoginAt`: `DateTime?`
  - `createdAt`: `DateTime` (Default `now()`)
  - `updatedAt`: `DateTime` (Updated automatically)
  - `deletedAt`: `DateTime?` (Soft delete)
- **Indexes / Constraints**: `@@unique([email])`, `@@index([deletedAt])`
- **Relations**:
  - `memberships`: `Membership[]` (1-to-many, `onDelete: Cascade`)
  - `sessions`: `Session[]` (1-to-many, `onDelete: Cascade`)
- **Tenant Ownership**: Global entity; owns memberships, not organizations directly.

#### 2. `Organization`
Represents the business tenant boundary.
- **Fields**:
  - `id`: `String` (CUID, PK)
  - `name`: `String` (Business / Store Name)
  - `slug`: `String` (URL-friendly unique handle, e.g. `gupta-supermart`, indexed)
  - `logoUrl`: `String?`
  - `createdAt`: `DateTime` (Default `now()`)
  - `updatedAt`: `DateTime` (Updated automatically)
  - `deletedAt`: `DateTime?` (Soft delete)
- **Indexes / Constraints**: `@@unique([slug])`, `@@index([deletedAt])`
- **Relations**:
  - `memberships`: `Membership[]` (1-to-many, `onDelete: Cascade`)
  - `qrCodes`: `QRCode[]` (1-to-many, `onDelete: Cascade`)
- **Tenant Ownership**: The root tenant object.

#### 3. `Membership`
The relational bridge linking a `User` to an `Organization` with a specific authorization role.
- **Fields**:
  - `id`: `String` (CUID, PK)
  - `userId`: `String` (FK -> User)
  - `organizationId`: `String` (FK -> Organization)
  - `role`: `UserRole` Enum (`OWNER`, `ADMIN`, `MEMBER`, `VIEWER`, Default: `MEMBER`)
  - `createdAt`: `DateTime` (Default `now()`)
  - `updatedAt`: `DateTime`
- **Indexes / Constraints**: `@@unique([userId, organizationId])`, `@@index([organizationId])`, `@@index([userId])`
- **Cascade Behavior**: If user or org is deleted, membership cascades.
- **Tenant Ownership**: Bound directly to `organizationId`.

#### 4. `Session`
Stores active authenticated sessions in PostgreSQL (stateless JWTs are deliberately avoided to allow instantaneous session revocation).
- **Fields**:
  - `id`: `String` (CUID, PK)
  - `userId`: `String` (FK -> User)
  - `tokenHash`: `String` (SHA-256 hash of the secure cookie token, unique, indexed)
  - `ipAddress`: `String?` (Optional audit logging string)
  - `userAgent`: `String?`
  - `expiresAt`: `DateTime` (Indexed for cleanup)
  - `createdAt`: `DateTime` (Default `now()`)
- **Indexes / Constraints**: `@@unique([tokenHash])`, `@@index([userId])`, `@@index([expiresAt])`
- **Cascade Behavior**: Cascades when `User` is deleted.

#### 5. `QRCode`
Represents a generated QR record owned by an Organization.
- **Fields**:
  - `id`: `String` (CUID, PK)
  - `organizationId`: `String` (FK -> Organization, indexed)
  - `shortCode`: `String` (Base62 unique identifier, e.g. `x7K2nP9`, unique, indexed)
  - `title`: `String` (e.g. "Main Billing Counter Stand")
  - `type`: `QRType` Enum (`DYNAMIC_URL`, `STATIC_URL`, `UPI`, `WHATSAPP`, `VCARD`, `WIFI`, etc.)
  - `status`: `QRStatus` Enum (`ACTIVE`, `PAUSED`, `ARCHIVED`, `EXPIRED`, Default: `ACTIVE`)
  - `styling`: `Json` (Full visual configuration matching `QRCustomization`)
  - `expiresAt`: `DateTime?` (Optional dynamic QR expiry)
  - `scanLimit`: `Int?` (Optional scan threshold before auto-pause)
  - `createdAt`: `DateTime` (Default `now()`)
  - `updatedAt`: `DateTime`
  - `deletedAt`: `DateTime?` (Soft delete)
- **Indexes / Constraints**: `@@unique([shortCode])`, `@@index([organizationId, deletedAt])`, `@@index([status])`
- **Tenant Ownership**: Direct `organizationId`.
- **Cascade Behavior**: Cascades on `Organization` deletion.

#### 6. `QRCodeDestination`
Stores the active destination URL and previous routing history for a dynamic QR code.
- **Fields**:
  - `id`: `String` (CUID, PK)
  - `qrCodeId`: `String` (FK -> QRCode, indexed)
  - `organizationId`: `String` (FK -> Organization, direct denormalization to prevent IDOR)
  - `destinationUrl`: `String` (Validated HTTP/HTTPS URL, max 2048 chars)
  - `isActive`: `Boolean` (Default `true`)
  - `utmSource`: `String?`
  - `utmMedium`: `String?`
  - `utmCampaign`: `String?`
  - `createdAt`: `DateTime` (Default `now()`)
  - `deactivatedAt`: `DateTime?`
- **Indexes / Constraints**: `@@index([qrCodeId, isActive])`, `@@index([organizationId])`
- **Cascade Behavior**: Cascades on `QRCode` deletion.

---

## 3. Dynamic QR Foundation Review (`/q/{shortCode}`)

Although the dynamic redirection engine is implemented in Phase 2B, Phase 2A establishes its architectural foundation:

### 3.1 Short Code Uniqueness & Entropy
- **Alphabet**: Case-sensitive Base62 (`0-9`, `a-z`, `A-Z`).
- **Length**: 7 characters (standard) to 8 characters (high volume).
- **Entropy**: $62^7 = 3,521,614,606,208$ (~3.52 trillion distinct combinations).
- **Randomness**: Generated via cryptographically secure pseudo-random number generator (`crypto.getRandomValues`).
- **Collision Strategy**:
  1. Generate 7-character string.
  2. Attempt database insert within a retry loop (max 3 attempts).
  3. Collision probability at 10 million active codes is $< 0.000014\%$.

### 3.2 Public Redirection Isolation (Zero Tenant Leakage)
- The public redirect route `/q/{shortCode}` must execute **without revealing any tenant data**.
- HTTP response headers must strictly omit `X-Organization-Id`, internal database CUIDs, merchant user emails, or subscription tier names.
- Public consumers scanning a physical QR stand see only the destination redirect (HTTP 302/307).

### 3.3 Status & Expiration State Machine
When `/q/{shortCode}` is requested:
1. `deletedAt !== null` -> HTTP 404 (Not Found) or clean branded inactive view.
2. `status === 'PAUSED'` -> Redirect to `/q-status/paused` (explaining code is temporarily paused by merchant).
3. `expiresAt < now()` -> Redirect to `/q-status/expired`.
4. `status === 'ACTIVE'` -> Perform instant 302 redirect to active `destinationUrl`.

---

## 4. Destination URL Security & Abuse Prevention

### 4.1 Strict Whitelist & Blacklist Protocol
All dynamic destinations submitted by users must undergo strict structural and protocol validation:

- **Strictly Allowed Protocols**: `https:`, `http:`
- **Explicitly Rejected Schemes**:
  - `javascript:` (Arbitrary script execution)
  - `data:` (MIME-encoded payload injection)
  - `file:` (Local file access)
  - `blob:` (Memory object execution)
  - `vbscript:` (Legacy script execution)
  - `about:`, `chrome:` (Browser internal schemes)

### 4.2 SSRF & Internal Network Boundary Defense
To prevent merchants or attackers from using QuickQR as a proxy or internal port scanner (Server-Side Request Forgery):
- **Localhost & Loopback**: `localhost`, `127.0.0.1`, `[::1]`, `0.0.0.0` rejected.
- **Private Subnets (RFC 1918)**:
  - `10.0.0.0/8`
  - `172.16.0.0/12`
  - `192.168.0.0/16`
- **Cloud Metadata Services**: `169.254.169.254`, `169.254.0.0/16` (Link-local cloud metadata endpoints).
- **Internal Hostnames**: Domains ending in `.local`, `.internal`, `.lan`, or single-label hostnames without TLDs.

### 4.3 Crucial Nuance: URL Validation Alone Does NOT Prevent Abuse
> **Engineering Reality**: Syntax and hostname validation alone cannot detect a syntactically valid public HTTPS URL (`https://attacker-domain.com/login`) that hosts phishing, malware, or dynamic fraud content.
> 
> Therefore, full abuse prevention requires **defense-in-depth**:
> 1. **Destination Modification Rate Limiting**: Prevent rapid automated switching of URLs to evade scans.
> 2. **Phishing & Malware Domain Blacklisting**: Check against known malicious domain databases (Google Safe Browsing / open-source blocklists) prior to activation.
> 3. **Merchant Abuse Flagging & Takedowns**: Ability for platform admins to instantly disable a malicious `shortCode` across all edge nodes.
> 4. **Audit Logging**: Store every destination URL change with the modifying `userId` and timestamp.

---

## 5. Privacy-Minimizing Analytics Design

### 5.1 Critique of Previous Hashing Proposal
The preliminary architecture proposed storing:
$$\text{visitorHash} = \text{sha256}(\text{ip} + \text{userAgent} + \text{salt} + \text{date})$$
**Review Finding**: It is technically inaccurate and legally questionable under GDPR / India DPDP Act 2023 to describe this as "fully protecting privacy" or "fully anonymous":
- The IPv4 address space is small ($2^{32} \approx 4.29 \times 10^9$ addresses). An adversary with knowledge of user-agent strings and target subnets can reverse salted hashes via rainbow tables or dictionary attacks.
- Consequently, hashed IPs are legally classified as **pseudonymous personal data**, not anonymous data.

### 5.2 Hardened Privacy-Minimizing Protocol (Phase 2D Preview)
1. **Zero Raw IP Persistence**: The incoming client IP address is processed strictly in volatile memory. It is **never** written to database storage or persistent application logs.
2. **Coarse In-Memory GeoIP Resolution**:
   - The IP is looked up in-memory via local GeoIP database (MaxMind GeoLite2) to extract coarse geographic metadata: `countryCode` (e.g. `IN`), `region` (State, e.g. `Maharashtra`), and `city` (e.g. `Pune`).
   - The IP is immediately discarded from memory following resolution.
3. **No Unnecessary PII**: No phone numbers, consumer names, email addresses, device serials, or high-precision GPS coordinates are ever captured during a scan.
4. **Data Minimization Storage**:
   - `deviceCategory`: `MOBILE`, `TABLET`, `DESKTOP`, `UNKNOWN`
   - `os`: High-level operating system (`Android`, `iOS`, `Windows`, `macOS`)
   - `browser`: High-level browser engine (`Chrome`, `Safari`, `Firefox`, `Edge`)
   - `referrer`: Raw domain only, stripped of query parameters that might carry PII
5. **Data Retention & Deletion Lifecycle**:
   - Granular time-series scan events: Retained for a maximum of 90 days.
   - Aggregate Rollups: Daily counters (`totalScans`, `deviceCounts`, `cityCounts`) are calculated and retained permanently.
   - Hard Delete: Deleting a `QRCode` permanently cascades to delete all associated scan records.

---

## 6. Payment Brand Asset Documentation & Trademark Rights

The document [`docs/PAYMENT_BRAND_ASSETS.md`](file:///f:/QR-Web/docs/PAYMENT_BRAND_ASSETS.md) has been audited and updated to reflect exact legal attribution:

1. **Elimination of Blanket "Approved" Classification**: No asset is classified as "officially approved by the trademark owner for QuickQR" unless an actual bilateral agreement exists.
2. **Nominative Fair Use Basis**: Assets (Google Pay, PhonePe, Paytm, BHIM, UPI) are cataloged strictly under **nominative fair use** and retail merchant acceptance identification standards in India.
3. **Legal Disclaimer**: Explicitly states that QuickQR India is not affiliated with, endorsed by, or a payment processor for Google LLC, PhonePe Private Limited, One97 Communications Limited, or NPCI.
4. **Guideline Alignment**:
   - **Google Pay**: Tied directly to the published [Google Pay India Web Brand Guidelines](https://developers.google.com/pay/india/api/web/brand-guidelines).
   - **BHIM & UPI**: Tied directly to NPCI brand identity and merchant acceptance standards.
   - **PhonePe & Paytm**: Tied directly to published retail counter acceptance guidelines.

---

## 7. Hostinger Cloud Production Architecture & Feasibility

The Phase 2 architecture is verified to run smoothly on **Hostinger Cloud Hosting / VPS** (Ubuntu LTS, Node.js runtime, PostgreSQL).

```
                      [ Hostinger Cloud Server (Ubuntu LTS) ]
                                         │
                                [ Nginx Reverse Proxy ]
                            (Port 80/443, Let's Encrypt SSL)
                                         │
                   ┌─────────────────────┴─────────────────────┐
                   ▼                                           ▼
         [ Static / Asset Cache ]                     [ Node.js Standalone ]
      (/_next/static, /payment-apps)               (PM2 Cluster: localhost:3000)
                                                               │
                                                               ▼
                                                     [ PostgreSQL 16 DB ]
                                                    (Prisma Client / Pooling)
```

### 7.1 Production Process Management
- **Runtime**: Node.js 22 LTS running the standalone output (`node .next/standalone/server.js`).
- **Process Supervisor**: **PM2** in cluster mode with automatic restart on crash and memory threshold limits:
  ```bash
  pm2 start .next/standalone/server.js -i max --name "quickqr"
  ```
- **Reverse Proxy**: Nginx forwards requests, terminates SSL, and serves static files directly from `.next/static` with long-term cache headers (`Cache-Control: public, max-age=31536000, immutable`).

### 7.2 Database & Migration Strategy
- **Engine**: PostgreSQL 16 (Local VPS instance or Hostinger managed database).
- **Connection Management**: Standard connection pooling configured in `DATABASE_URL` (`connection_limit=20&pool_timeout=10`).
- **Migration Pipeline**: Production deployments run `npx prisma migrate deploy` in the deployment script prior to reloading PM2 workers.

### 7.3 Redis Feasibility: Clarification for Phase 2A
- **Redis is strictly OPTIONAL for Phase 2A.**
- Phase 2A focuses solely on database authentication, organization creation, and RBAC. These operations do not require Redis; PostgreSQL connection pooling and in-memory session lookups are fully sufficient.
- Redis will only be evaluated in Phase 2B (high-throughput short code redirect caching) and Phase 2D (scan event buffering). Eliminating Redis from Phase 2A minimizes operational complexity on Hostinger Cloud.

### 7.4 Backup & Disaster Recovery
- Nightly automated `pg_dump` cron jobs creating compressed SQL dumps:
  ```bash
  pg_dump -Fc -U quickqr_user quickqr_prod > /backups/quickqr_$(date +%Y%m%d).dump
  ```
- Automated rotation keeping 14 daily backups, with offsite sync to cloud object storage.

---

## 8. Security Model & Defensive Controls

```
 Incoming Request
        │
        ▼
 [ Rate Limiter ] ────────► 429 Too Many Requests (Brute-force / Scraping defense)
        │
        ▼
 [ CSRF / Origin Check ] ──► 403 Forbidden (Non-matching origin on state mutations)
        │
        ▼
 [ Session Authenticator ] ─► 401 Unauthorized (Validates hashed session token)
        │
        ▼
 [ Tenant Guard (RBAC) ] ──► 403 Forbidden (Checks Membership: User + Org + Role)
        │
        ▼
 [ Input Validator (Zod) ] ─► 400 Bad Request (Type, length, schema validation)
        │
        ▼
 [ Tenant-Scoped Prisma Query ] ──► Safe Execution (where: { organizationId })
```

### 8.1 Password Hashing
- **Algorithm**: **Argon2id** (memory cost: 65,536 KB, iterations: 3, parallelism: 1).
- **Fallback**: **bcrypt** with work factor (salt rounds) 12.
- **Timing Defense**: Constant-time comparison functions to eliminate timing side-channel attacks during password verification.

### 8.2 Session Security & Cookie Hardening
- **Token Entropy**: 32 cryptographically random bytes (`crypto.randomBytes(32)`).
- **Storage**: Only the SHA-256 hash of the session token (`tokenHash`) is stored in the database. A database leak cannot expose active session tokens.
- **Cookie Flags**:
  - `HttpOnly: true` (Inaccessible to client-side JavaScript / XSS)
  - `Secure: true` (Transmitted only over HTTPS in production)
  - `SameSite: 'Lax'` (Protects against CSRF while permitting top-level navigation)
  - `Path: '/'`
  - `Max-Age: 2592000` (30 days)

### 8.3 Rate Limiting & Brute-Force Defense
- **Authentication Routes**:
  - `/api/auth/login`: Maximum 5 failed attempts per 15 minutes per IP + email combination.
  - `/api/auth/register`: Maximum 3 accounts created per hour per IP.
  - Progressive delay: Backoff delay introduced after 3 consecutive failures.
- **Account Lockout**: 10 consecutive failed attempts locks the account for 30 minutes (or until password reset via email).

### 8.4 Session Revocation
- **Single Session Logout**: Deletes the specific `Session` record from the database.
- **Global Session Revocation**: Triggered upon password change or user security request: deletes all `Session` records where `userId = user.id`.

### 8.5 Input Validation
- All API and Server Action payloads are validated against strict **Zod schemas** before reaching business logic or database queries.

---

## 9. Clear Phase Boundaries & Scope Discipline

To guarantee rapid execution and prevent architectural bloat, the six phases are decoupled with strict non-negotiable boundaries:

```
┌────────────────────────────────────────────────────────────────────────┐
│ PHASE 2A: Database, Authentication, Multi-Tenant Orgs & RBAC           │
│ • Prisma setup with PostgreSQL                                         │
│ • Models: User, Organization, Membership, Session, QRCode, Destination │
│ • Signup, Login, Password Reset, Session Revocation                    │
│ • Organization Switcher & RBAC Authorization Middleware                │
│ • Zero dynamic redirects, zero analytics, zero billing                 │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│ PHASE 2B: Dynamic QR Redirect Engine                                   │
│ • Short code generation (Base62 nanoid)                                │
│ • /q/{shortCode} lightweight edge route                                │
│ • Safe URL validation & anti-SSRF filtering                            │
│ • Real-time destination updates without reprinting                     │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│ PHASE 2C: Merchant Dashboard                                           │
│ • QR management UI (CRUD, download stand PNGs, edit destinations)     │
│ • Team invitation & member management UI                               │
│ • UPI Stand & Table Stand saved merchant presets                       │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│ PHASE 2D: Privacy-Minimizing Analytics                                 │
│ • Async scan event logger (In-memory GeoIP resolution, zero raw IP)    │
│ • Scan counts by city, device, OS, time of day                         │
│ • Analytics graphs & reporting dashboard                               │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│ PHASE 2E: Remote Website Widget Persistence                            │
│ • Widget & WidgetConfiguration database records                        │
│ • Dynamic endpoint: /api/v1/widgets/:id/config                         │
│ • Remote styling sync without updating site embed snippet              │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│ PHASE 2F: Developer API & Subscriptions                                │
│ • Token-authenticated REST API (/api/v1/qr) with rate limits           │
│ • Razorpay / Stripe billing integration                                │
│ • Plan quota enforcement (Dynamic QR count, team seats, retention)     │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 10. Architectural Verdict & Action Items

### Formal Recommendation: **APPROVED WITH CHANGES**

The Phase 2A technical architecture is **Approved with Changes**. The following mandatory modifications are codified by this review and must govern Phase 2A implementation:

### Summary of Required Changes
1. **Terminology Shift**: Corrected "column-level tenant isolation" to **Application-Level Tenant Isolation** via tenant-scoped queries (`where: { organizationId }`).
2. **Model Pruning**: Pruned premature entities (`Campaign`, `Widget`, `WidgetConfiguration`, `ApiKey`, `Subscription`, `ScanEvent`, `AuditLog`) from Phase 2A. Focused Phase 2A exclusively on `User`, `Organization`, `Membership`, `Session`, `QRCode`, and `QRCodeDestination`.
3. **URL Security Defense-in-Depth**: Formally acknowledged that URL validation alone cannot prevent abuse; established requirements for rate limiting, phishing blocklists, and administrative takedown tools.
4. **Analytics Privacy Correction**: Eliminated claims that hashed IPs "fully protect privacy." Defined an authentic privacy-minimizing architecture (zero raw IP persistence, coarse in-memory GeoIP, 90-day retention).
5. **Brand Asset Legal Honesty**: Clarified all third-party payment brand assets in `docs/PAYMENT_BRAND_ASSETS.md` as nominative merchant acceptance references, explicitly disclaiming bilateral trademark licenses or "legally safe" status.
6. **Infrastructure Simplification**: Declared Redis as **OPTIONAL** for Phase 2A, eliminating unnecessary infrastructure overhead on Hostinger Cloud.
7. **Strict Phase Boundaries**: Established a rigid non-leakage boundary between Phase 2A (Foundation/Auth/Tenancy) and future phases (Redirects, Dashboard, Analytics, Widgets, API/Billing).

---
*Ready for Phase 2A implementation upon stakeholder review.*
