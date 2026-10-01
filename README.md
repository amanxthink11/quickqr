# QuickQR

> **Open-source QR code infrastructure for businesses — dynamic QR codes, privacy-friendly analytics, UPI & payment QR tools, embeddable website widgets, and developer REST APIs.**

[![CI](https://github.com/amanxthink11/quickqr/actions/workflows/ci.yml/badge.svg)](https://github.com/amanxthink11/quickqr/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-22_LTS-green.svg)](https://nodejs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16_App_Router-black.svg)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6.svg)](https://www.typescriptlang.org/)

---

## Live Demo & Maintainer

- **Live Demo**: [https://quickqr.amanxthink11.com](https://quickqr.amanxthink11.com)
- **Created & Maintained by**: **[Aman Singh](https://amanxthink11.com)**
- **GitHub Repository**: [https://github.com/amanxthink11/quickqr](https://github.com/amanxthink11/quickqr)

---

## Overview

**QuickQR** is a self-hostable, modern QR code generation and management platform engineered for businesses, retail stores, cafes, clinics, freelancers, and software developers. 

It provides both client-side static QR generators (where business data never leaves the browser) and multi-tenant dynamic QR infrastructure featuring persistent short URLs, high-performance redirect resolving, privacy-first scan analytics, embeddable remote website widgets, and developer REST APIs.

---

## Key Capabilities

### 1. Static & Specialized QR Generation
- **Client-Side Privacy**: Static QR codes are rendered entirely within the browser canvas. No confidential payment identifiers, Wi-Fi credentials, or vCards are sent to any server.
- **12+ Production Generator Types**:
  - **UPI & Payment QR**: Standard `upi://pay` payment intent strings tested across PhonePe, Google Pay, Paytm, BHIM, and CRED.
  - **WhatsApp**: Click-to-chat QR codes with pre-filled support or inquiry messages.
  - **Google Reviews**: Direct customer review prompt signs with preset five-star intents.
  - **Digital Menus & PDFs**: Instant restaurant and catalogue QR stands.
  - **Wi-Fi**: Automatic WPA/WPA2/WPA3 network connection codes.
  - **vCard / Contact Cards**: Standard vCard 3.0 virtual business cards.
  - **Google Maps**: Direct store location pins and directions.
  - **URL, Phone, SMS, Email, and Plain Text**.
- **Visual Customization Engine**: Custom foreground and background colors, gradients, rounded dots, corner eye styles, center brand logos, and printable acrylic stand frames.
- **Client-Side Readability Validation**: Automated heuristic decode verification (`jsQR`) checks contrast ratio and error-correction density before download to prevent unreadable prints.
- **High-Resolution Vector Export**: Instant download in SVG (infinite vector scaling) and PNG (300 DPI print-ready for acrylic counter stands and signage).

### 2. Dynamic QR Lifecycle & Redirection Engine
- **Persistent Short Codes**: Physical QR codes encode short URLs (e.g. `/q/{shortCode}`) that never need to be reprinted when destinations change.
- **Instant Destination Updates**: Edit target URLs at any time from the dashboard or REST API.
- **High-Speed In-Memory Caching**: Resolution engine caches active redirects with LRU invalidation upon updates.
- **Lifecycle States**: Toggle QR codes between **Active**, **Paused** (displays a branded friendly pause screen), and **Archived**.

### 3. Privacy-First Scan Analytics
- **Zero Raw IP Persistence**: IP addresses are never saved to the database. Scan telemetry derives coarse country/city geographical signals and user-agent classifications anonymously.
- **Granular Insights**: Real-time breakdown by total scans, unique daily scans, device family (Mobile, Desktop, Tablet), operating system, browser engine, referrer domain, and UTM attribution (`utm_source`, `utm_medium`, `utm_campaign`).
- **Date Range Filtering**: Analyze performance across 24 hours, 7 days, 30 days, or custom windows.

### 4. Remote Website QR Widget
- **Embeddable JavaScript Bundle**: Lightweight (`< 20 KB`), zero-dependency floating QR widget for merchant websites (`widget.js`).
- **Two Operating Modes**:
  - **Remote Managed Mode**: Embed with a permanent `publicId`. Update colors, titles, logos, and target URLs remotely from the QuickQR dashboard without altering merchant website code.
  - **Static Embedded Mode**: Self-contained client configuration via HTML `data-*` attributes.
- **Lifecycle Controls**: Instantly pause, resume, or archive widgets across all live client websites from the dashboard.

### 5. Multi-Tenant SaaS Foundation
- **Tenant Isolation**: Strict organization-based data boundary. Users belong to organizations with Role-Based Access Control (**Owner**, **Admin**, **Member**).
- **Secure Authentication**: Passwords hashed with state-of-the-art **Argon2id** (`@node-rs/argon2`). Signed HTTP-only session cookies with HMAC verification.

### 6. Developer REST API & API Key Management
- **API Key Infrastructure**: Generate production API keys (`qk_live_<hex>`) with 256 bits of CSPRNG entropy. Plaintext keys are displayed once and hashed with SHA-256 before storage.
- **Programmatic Control**: Full REST API (`/api/v1/...`) for creating, updating, pausing, resuming, and deleting dynamic QR codes and widgets, as well as fetching aggregate analytics.
- **Sliding-Window Rate Limiting**: Built-in rate limiting per API key protects server resources.
- Complete documentation available in [docs/API.md](docs/API.md).

---

## Architecture Overview

```
                      [ Client Browsers / Mobile Scanners ]
                                       │
                                       ▼
                     ┌───────────────────────────────────┐
                     │    Next.js 16 App Router (Node 22) │
                     └─────────────────┬─────────────────┘
                                       │
           ┌───────────────────────────┼───────────────────────────┐
           ▼                           ▼                           ▼
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│  Public QR Resolver │     │ Dashboard & SaaS UI │     │ Developer REST API  │
│   (/q/{shortCode})  │     │   (App Router SSR)  │     │    (/api/v1/*)      │
└──────────┬──────────┘     └──────────┬──────────┘     └──────────┬──────────┘
           │                           │                           │
           │ In-Memory LRU Cache       │ Session Auth (Argon2id)   │ Bearer Key Auth
           ▼                           ▼                           ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       Domain Services & Tenant Isolation                    │
│   (QR Service, Redirect Engine, Analytics Ingestion, Widget Manager)        │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        Prisma ORM 6 (Data Access Layer)                     │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           PostgreSQL Database (15+)                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Public Dynamic QR Resolution Flow
```
Physical / Digital QR Code
           ↓
Scanner opens https://quickqr.amanxthink11.com/q/{shortCode}
           ↓
In-Memory Cache Check ──(Hit)──→ Returns Destination URL
           │ (Miss)
           ▼
Prisma queries PostgreSQL
           ↓
Check Lifecycle (Active / Paused / Archived)
           ↓
Asynchronously log scan analytics (device, OS, country, UTM) without blocking user
           ↓
HTTP 302 Redirect to Destination URL
```

### Remote Website Widget Flow
```
External Merchant Website
           ↓
<script src=".../widget.js" data-widget-id="wid_..."></script>
           ↓
widget.js requests /api/widget/{publicId}
           ↓
Server returns latest widget configuration (colors, target URL, QR type)
           ↓
Floating QR modal rendered in Shadow DOM on merchant site
```

---

## Important Product Disclaimers

To maintain transparency and ethical engineering standards:

1. **Not a Payment Gateway**: QuickQR does **not** process, clear, mediate, or settle financial transactions. QuickQR formats standard URI strings (`upi://pay?...`) according to public specifications. Payments occur directly peer-to-peer between customer and merchant banking apps.
2. **No Transaction Verification**: QuickQR does not receive webhooks or bank confirmations verifying whether a customer completed a payment after scanning.
3. **Privacy-Minimized Analytics**: Analytics collection strictly complies with modern privacy principles. Raw IP addresses are **never** stored in the database.
4. **Readability Heuristics**: The built-in QR readability validation uses automated computer vision decoding heuristics to catch common contrast mistakes. However, camera hardware, ambient glare, physical print substrates, and scanning distances vary; physical test scans are always recommended prior to bulk printing.
5. **Review Integrity**: Google Review QR tools format direct deep links to public Google Maps review dialogs. QuickQR does not manipulate, filter, or guarantee review sentiment.
6. **Third-Party Trademarks**: UPI, PhonePe, Google Pay, Paytm, BHIM, WhatsApp, and Google are trademarks of their respective owners. QuickQR is an independent open-source project with no official affiliation or certification from these entities.

---

## Technology Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Framework** | Next.js 16 (App Router) | Server Components, Route Handlers, Standalone output |
| **Runtime** | Node.js 22 LTS | Fast, modern LTS JavaScript runtime |
| **Language** | TypeScript 5 | Strict type-safety across all modules |
| **Styling** | Tailwind CSS 4 | Utility-first styling with custom UI components |
| **Database** | PostgreSQL 15+ | Relational persistence with foreign keys & indexes |
| **ORM** | Prisma 6.19.3 | Type-safe database queries and automated migrations |
| **Authentication** | @node-rs/argon2 | Hardware-resistant password hashing |
| **Validation** | Zod 4 | Runtime schema parsing and input sanitization |
| **QR Generation** | `qrcode` & `qr-code-styling` | Multi-format matrix rendering |
| **QR Decoding** | `jsQR` | Client-side contrast and scanability validation |
| **Icons** | Lucide React | Modern, accessible SVG icon set |
| **Testing** | Vitest 5 | Fast unit and integration test runner (264 tests) |

---

## Self-Hosting Guide

### Prerequisites

- **Node.js**: v22 LTS or higher
- **PostgreSQL**: v15 or higher
- **Process Manager**: PM2 (optional, recommended for Linux production servers)
- **Reverse Proxy**: Nginx or Caddy with SSL (Let's Encrypt)

### 1. Clone & Install

```bash
git clone https://github.com/amanxthink11/quickqr.git
cd quickqr
npm ci
```

### 2. Configure Environment

Copy the `.env.example` file:

```bash
cp .env.example .env
```

Edit `.env` with your production settings:

```env
# PostgreSQL connection string
DATABASE_URL="postgresql://quickqr_user:your_secure_password@localhost:5432/quickqr_prod?schema=public"

# Cryptographic secret (minimum 32 characters, recommended 64-char hex)
APP_SECRET="generate-using-crypto-randomBytes-32"

# Public application URL
NEXT_PUBLIC_APP_URL="https://quickqr.amanxthink11.com"

# Public short-code redirect domain
NEXT_PUBLIC_QR_BASE_URL="https://quickqr.amanxthink11.com"

# Node environment
NODE_ENV="production"
```

### 3. Run Database Migrations

Apply production migrations using Prisma:

```bash
npx prisma migrate deploy
npx prisma generate
```

### 4. Build Application

Build the client widget bundle and the Next.js production build:

```bash
npm run build
```

This executes:
1. `scripts/build-widget.js`: Compiles `src/widget/index.ts` to `public/widget.js` via esbuild.
2. `next build`: Builds optimized server and client bundles with Next.js Standalone output.
3. `scripts/copy-standalone-assets.js`: Copies static files to `.next/standalone` for lightweight deployments.

### 5. Start Production Server

Using Node directly:

```bash
npm run start
```

Or using the standalone output:

```bash
node .next/standalone/server.js
```

Or with **PM2** for process resilience and auto-restart:

```bash
pm2 start .next/standalone/server.js --name "quickqr" -i max
pm2 save
pm2 startup
```

### 6. Nginx Reverse Proxy Sample

```nginx
server {
    listen 80;
    server_name quickqr.amanxthink11.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name quickqr.amanxthink11.com;

    ssl_certificate /etc/letsencrypt/live/quickqr.amanxthink11.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/quickqr.amanxthink11.com/privkey.pem;

    # Gzip Compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml image/svg+xml;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## Local Development & Testing

### Development Server

```bash
npm run dev
```

### Running Test Suite

QuickQR includes a comprehensive test suite covering QR payloads, decoding, download formats, redirect resolution, analytics logging, dashboard operations, widget bundling, and developer REST APIs:

```bash
npm test
```

### Static Analysis & Linting

```bash
npm run lint
```

### Prisma Schema Validation

```bash
npx prisma validate
```

---

## Project Structure

```
quickqr/
├── .github/
│   ├── ISSUE_TEMPLATE/        # Bug report & feature request templates
│   ├── workflows/ci.yml       # GitHub Actions CI pipeline
│   └── pull_request_template.md
├── docs/
│   ├── API.md                 # Complete Developer REST API specification
│   └── PAYMENT_BRAND_ASSETS.md # Payment brand compliance & asset guide
├── prisma/
│   ├── migrations/            # Version-controlled database migrations
│   └── schema.prisma          # Database models (User, Org, QR, Scan, Widget, ApiKey)
├── public/
│   ├── widget.js              # Compiled website widget script
│   └── payment-logos/         # Vector payment app badges
├── scripts/
│   ├── build-widget.js        # Widget bundling script
│   └── copy-standalone-assets.js
├── src/
│   ├── app/
│   │   ├── (auth)/            # Login & registration routes
│   │   ├── (generators)/      # 12+ Specialized static generator pages
│   │   ├── api/v1/            # Developer REST API route handlers
│   │   ├── dashboard/         # Tenant dashboard (QRs, Analytics, Widgets, API keys)
│   │   ├── q/                 # Public dynamic short-code redirect resolver
│   │   ├── layout.tsx         # Global layout & Open Graph metadata
│   │   └── page.tsx           # Product homepage
│   ├── components/
│   │   ├── auth/              # Authentication forms
│   │   ├── dashboard/         # Management tables & analytics charts
│   │   ├── marketing/         # Landing page feature showcases
│   │   └── qr/                # QR engine, customizer, preview, inputs & table stands
│   ├── lib/
│   │   ├── analytics/         # Privacy-first telemetry aggregation
│   │   ├── api/               # API security, rate limiting, and responses
│   │   ├── api-keys/          # 256-bit CSPRNG key generation & SHA-256 verification
│   │   ├── auth/              # Argon2id password hashing & HMAC session tokens
│   │   ├── db/                # Prisma client singleton
│   │   ├── qr/                # Generators, payloads, presets, resolver, and validation
│   │   └── widget/            # Remote widget configuration service
│   └── widget/
│       └── index.ts           # Client-side embeddable widget source
├── tests/                     # 14 test suites (264 unit & integration tests)
├── .env.example               # Safe environment configuration template
├── CONTRIBUTING.md            # Guidelines for open-source contributors
├── LICENSE                    # MIT License
├── README.md                  # Project documentation
├── SECURITY.md                # Vulnerability disclosure policy
└── THIRD-PARTY-NOTICES.md     # Third-party notices and trademark attributions
```

---

## Contributing

Contributions from the developer community are warmly welcomed! Please read our [CONTRIBUTING.md](CONTRIBUTING.md) guide for details on our code style, test expectations, and pull request workflow.

---

## Security

If you discover a security vulnerability, please do not open a public issue. Follow our [SECURITY.md](SECURITY.md) policy to report vulnerabilities privately via GitHub Security Advisories or maintainer contact.

---

## License

QuickQR is open-source software licensed under the **[MIT License](LICENSE)**.

Copyright &copy; 2026 **Aman Singh**.

---

## Author & Maintainer

**Aman Singh**  
- Website: [https://amanxthink11.com](https://amanxthink11.com)  
- GitHub: [@amanxthink11](https://github.com/amanxthink11)  
- Project: [QuickQR](https://quickqr.amanxthink11.com)
