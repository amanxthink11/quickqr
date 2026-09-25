# QuickQR India — Project Context & Architectural Documentation

## 1. Product Vision

**QuickQR India** is a production-grade QR code generation and infrastructure platform built specifically for Indian commerce. The platform bridges the physical-digital divide for offline retail counters, kirana stores, dining cafes, healthcare clinics, freelancers, and enterprise brands.

While the market is flooded with deceptive generator websites that hold printed QR codes hostage after 14 days behind paywalls, QuickQR establishes an ethical, privacy-respecting, high-reliability utility where static QR codes never expire and customer data is calculated directly in the browser.

In future phases, QuickQR will expand into a full QR infrastructure/SaaS suite offering dynamic redirect management, real-time scan analytics by Indian cities and devices, digital restaurant CMS menus, and developer REST APIs.

---

## 2. Phase 1 Scope & Boundary

### Delivered in Phase 1:
* **100% Client-Side Static Generation**: Zero server storage of sensitive customer data (Wi-Fi passwords, UPI VPAs, private URLs).
* **Permanent, Never-Expiring Codes**: Payloads are encoded directly into the two-dimensional matrix.
* **12 Dedicated Business Tools**:
  1. UPI Payment QR (NPCI compliant `upi://pay` URI)
  2. WhatsApp Click-to-Chat QR (`https://wa.me`)
  3. Website URL QR (`https://...`)
  4. Guest Wi-Fi QR (ZXing standard `WIFI:S:...`)
  5. vCard 3.0 Digital Business Card QR (`BEGIN:VCARD`)
  6. Direct Phone Call QR (`tel:...`)
  7. Pre-filled Email QR (`mailto:...`)
  8. Plain Text QR (offline alphanumeric decoding)
  9. Google Maps Location Navigation QR
  10. Google Review 5-Star Stand QR
  11. Public PDF Document QR
  12. Restaurant Digital Menu QR
* **Customization Studio**:
  * Color pickers for foreground, background, and corner finder eyes
  * Pattern body styles (square, dots, rounded, classy, extra-rounded)
  * Eye finder shapes (square, rounded, circle)
  * Center brand logos (built-in UPI, RuPay, WhatsApp, Google Star, Wi-Fi, Phone, or custom file upload)
  * Frame styles (bottom banner, store card, badge, none) with custom callout text
  * Margin (quiet zone) and error correction levels (L, M, Q, H)
* **Real-Time Optical Scan Safety Engine**:
  * Automated contrast ratio calculation (WCAG luminance)
  * Direct canvas pixel decode verification using `jsQR` ensuring high scan reliability before download
* **High-Resolution Exports**:
  * Vector SVG (infinitely scalable for print shops)
  * High-DPI PNG (1000px Web, 2000px HD, 3000px 300 DPI Print)
  * One-click A4 print-ready table tent dialog
* **SEO-First Architecture**: 15 public routes with unique metadata, canonical links, OpenGraph tags, semantic headings, and JSON-LD schema.

### Excluded from Phase 1 (Phase 2 Roadmap):
* User authentication and account creation
* Subscription billing and payment gateway integration
* Dynamic QR database with redirect middleware
* Cloud scan tracking and analytics (city, device, time)
* Interactive restaurant CMS menu builder
* Multi-user team workspaces
* Developer REST APIs

---

## 3. Technology Stack & Technical Direction

* **Framework**: Next.js 16 (App Router, Turbopack, standalone output)
* **Language**: TypeScript 5 (Strict Mode)
* **Styling**: Tailwind CSS v4 with custom color system and Google Fonts (`Plus Jakarta Sans`)
* **QR Engine**: `qr-code-styling` (client dynamic import) + `qrcode` (for mathematical matrix generation)
* **Optical Validator**: `jsqr` (client & automated test verification)
* **Icons**: `lucide-react`
* **Test Runner**: Vitest 5 (37 unit & optical decoding test cases)

---

## 4. Route Architecture

| Route | Purpose | Key Payload |
|---|---|---|
| `/` | Homepage & Live Generator Studio | All-in-one interactive generator & feature highlights |
| `/qr-code-generator` | Universal All-in-One Generator | 12 tabbed generators with custom branding |
| `/upi-qr-code-generator` | Dedicated UPI Payment QR | `upi://pay?pa=...&pn=...&am=...&cu=INR` |
| `/whatsapp-qr-code-generator` | WhatsApp Click-to-Chat QR | `https://wa.me/91XXXXXXXXXX?text=...` |
| `/url-qr-code-generator` | Direct Website URL QR | `https://...` with protocol sanitization |
| `/wifi-qr-code-generator` | Guest Wi-Fi QR | `WIFI:S:...;T:WPA;P:...;;` |
| `/vcard-qr-code-generator` | vCard Digital Contact Card | RFC 6350 / vCard 3.0 format |
| `/phone-qr-code-generator` | Direct Speed Dial QR | `tel:+91XXXXXXXXXX` |
| `/email-qr-code-generator` | Draft Email QR | `mailto:...` with pre-filled subject/body |
| `/text-qr-code-generator` | Plain Text QR | Raw UTF-8 alphanumeric text |
| `/google-maps-qr-code-generator` | Store Location Pin QR | Google Maps navigation URL |
| `/google-review-qr-code-generator` | 5-Star Google Review Stand | Direct Google Place Review URL |
| `/pdf-qr-code-generator` | Public Document PDF QR | Publicly accessible PDF URL |
| `/menu-qr-code-generator` | Touchless Restaurant Menu | Online digital menu URL |
| `/pricing` | Transparent Pricing Matrix | Free Static vs Phase 2 Pro Dynamic comparison |

---

## 5. Security & Privacy Decisions

1. **Protocol Sanitization**:
   All user-provided URLs undergo strict protocol inspection via `isSafeURL`. Unsafe schemes (`javascript:`, `vbscript:`, `data:text/html`, `<script>`, `onload=`, `onerror=`) are strictly rejected.
2. **Client-Side Generation**:
   No user inputs are posted to external backend databases. All payloads are rendered locally in browser memory using HTML5 Canvas and SVG.
3. **Safe File Handling**:
   Custom logo uploads are restricted to image MIME types (PNG, JPG, SVG, WebP) and capped at 2MB to prevent browser thread saturation.
4. **NPCI UPI Clarification**:
   Every payment screen prominently states that QuickQR generates standard payment intent strings, but is not a payment aggregator, processor, or payment confirmation provider. Merchants must verify payments via their banking apps.

---

## 6. Testing & Quality Assurance

### Vitest Test Suite
Execute all unit and optical decoding tests:
```bash
npm run test
```

### Test Coverage Highlights:
* **`tests/qr-payloads.test.ts`**: Verifies exact standard formatting for UPI (open amount, decimal INR, notes, merchant codes), WhatsApp (`wa.me` phone cleaning), Wi-Fi (character escaping for `;` and `:`), vCard 3.0, email `mailto:`, phone `tel:`, and Google Maps.
* **`tests/qr-validation.test.ts`**: Verifies URL safety guardrails against XSS, UPI VPA syntax validation, email regex, contrast calculation (relative luminance), and scan readability penalty scoring.
* **`tests/qr-decoding.test.ts`**: Synthesizes RGBA pixel buffers from generated QR code matrices and decodes them with `jsQR` to mathematically prove that smartphone cameras will read every generated payload cleanly.

---

## 7. Deployment Instructions (Hostinger Cloud Hosting)

QuickQR is pre-configured with `output: "standalone"` in `next.config.ts`, making it ideal for Hostinger Cloud Hosting, Node.js applications, Docker, or VPS.

### Production Build:
```bash
npm run build
```

### Running on Hostinger Node Server:
1. Upload the codebase or connect via Git.
2. Run `npm install --omit=dev`.
3. Build the application: `npm run build`.
4. In Hostinger Cloud / hPanel Node.js selector:
   * **Node version**: Node 20.x, 22.x, or 24.x
   * **Startup File / Script**: `.next/standalone/server.js` or `node .next/standalone/server.js`
   * **Port**: Environment variable `PORT` (defaults to 3000)
5. Alternatively, if deploying with PM2:
   ```bash
   pm2 start .next/standalone/server.js --name "quickqr-india"
   ```

---

## 8. Future Phase 2 Architecture

* **Database & ORM**: PostgreSQL with Prisma ORM for storing user accounts, dynamic short codes, and campaign groups.
* **Redirection Middleware**: Ultra-low-latency edge redirection using Next.js Middleware or Cloudflare Workers.
* **Analytics Engine**: Capturing timestamp, city (GeoIP), device OS, and browser referrer without storing personal identifying information.
* **Customer Dashboard**: Overview of total scans, unique visitors, top performing QR stands, and download archives.
* **Interactive Digital Menu CMS**: Multi-category menu builder with image uploads, dietary tags (Veg/Non-Veg), price updates, and "Sold Out" toggles.
* **Enterprise API**: API key management, rate limits, and batch QR generation endpoints for billing software integrations.
