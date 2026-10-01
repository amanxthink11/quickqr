# QuickQR Phase 1 UI & Website QR Widget Update Report

**Date:** September 25, 2026  
**Platform Version:** v1.0.0 (Phase 1 Production Release)  
**Status:** Complete & Verified  

---

## 1. Executive Summary

This update completes two major production enhancements requested for the QuickQR platform before proceeding to Phase 2:
1. **Redesigned Physical Table Stand / Table Tent Preview & Export System:** Replaced the generic card mockup with a realistic physical tabletop display component supporting Table Tent (folded tent with front panel, fold line, and realistic base shadow), Acrylic Counter Stand (L-frame stand with depth), and ISO print formats (A4, A5, A6, Square). The preview and high-resolution export (300 DPI PNG & Paper-Formatted Browser Print / PDF) share the exact same rendering and layout calculations.
2. **Embeddable Website QR Widget:** Created an embeddable floating QR widget architecture that allows businesses to embed direct UPI payments, WhatsApp chat desks, Google review collectors, digital menus, or custom QR actions on any website (Shopify, WordPress, Webflow, Next.js, plain HTML) using a single, self-contained `<script>` tag. The widget uses Shadow DOM style isolation to ensure zero global CSS pollution or styling interference with merchant websites.

---

## 2. Part 1: Physical Table Stand & Dedicated UPI Counter Stand

### 2.1 Dedicated UPI Counter Stand Component (`UPIStandPreview`)
- **Component:** `src/components/qr/UPIStandPreview.tsx`
- **Domain Engine:** `src/lib/qr/upi-stand.ts`
- **Design Inspiration:** Faithful to real Indian billing counter displays:
  - **Portrait 3:4 Aspect Ratio:** Natural 3:4 proportions (`450 × 600` logical, `1800 × 2400` at 300 DPI) rather than squashed square cards.
  - **Clean White Physical Card:** Pure white background, subtle 1px border (`#e2e8f0`), rounded corners, minimal shadow (`shadow-md shadow-neutral-900/5`), and zero SaaS/3D artificial artifacts.
  - **Visual Hierarchy:**
    1. **Merchant Name:** Center-aligned, strong bold typography, dark neutral text, with word wrapping and responsive font scaling for long names.
    2. **Subtle Divider:** Thin separator line underneath merchant name.
    3. **Dominant Center QR:** Large centered QR canvas with generous quiet zone (~62% width of stand).
    4. **UPI ID:** Monospace/sans font directly below QR code with safe wrapping (`word-break: break-all`).
    5. **Instruction:** Editable `"Scan and pay with any BHIM UPI app"`.
    6. **Payment Ecosystem Badges:** Clean supported payment app badges (`BHIM`, `UPI`, `GPay`, `PhonePe`, `Paytm`). Toggleable ON/OFF.
    7. **Neutral Footer:** Product-neutral footer (e.g., `"BHIM UPI"`). Strictly zero Labnol attribution text.
  - **4 Stand Templates:**
    1. **Classic UPI:** Reference style (white background, minimal typography, thin divider, payment badges).
    2. **Business UPI:** Clean brand accent bar at the top with professional styling.
    3. **Scan & Pay:** Prominent `"SCAN & PAY"` bold header badge.
    4. **Minimal:** Maximum whitespace, merchant name, large QR, UPI ID, and minimal supporting copy.
- **Export & Print Parity:** `renderUPIStandToCanvas` renders the exact same layout onto an 1800 × 2400 canvas (300 DPI equivalent) for PNG download, and `openUPIStandPrintDialog` formats a true paper print/PDF dialog with strict `escapeXml` sanitization.

### 2.2 Generic Table Stand Component (`TableStandPreview`)
- **Component:** `src/components/qr/TableStandPreview.tsx`
- **Domain Engine:** `src/lib/qr/table-stand.ts`
- **Use Cases:** Specifically handles non-UPI QR types (WhatsApp, Google Review, Digital Menu, Wi-Fi, vCard, Google Maps) with Table Tent folded view, Acrylic L-Stand, and ISO paper sizes (A4, A5, A6, Square).

---

## 3. Part 2: Website QR Widget

### 3.1 User Flow & Public Route
- **Route:** `/website-qr-widget` (`src/app/website-qr-widget/page.tsx`)
- **Navigation:** Added to desktop & mobile Header navigation (`Header.tsx`), Footer navigation (`Footer.tsx`), and XML sitemap (`src/app/sitemap.ts`).
- **Interactive Builder:** `src/components/widget/WebsiteWidgetBuilder.tsx` allows merchants to:
  1. Select from 6 purposes: UPI Payment, WhatsApp, Google Review, Digital Menu, Website Link, Custom QR.
  2. Input data (UPI VPA, Payee name, WhatsApp phone number, message, URL).
  3. Customize button text, icon, colors, position (`bottom-right` or `bottom-left`), size (`small`, `medium`, `large`), border radius (`pill`, `rounded`, `square`), and shadow intensity.
  4. Test the live widget inside an interactive fake browser window (Desktop 100% or Mobile 375px viewport).
  5. Click the button inside the simulator to test the accessible popup dialog with live QR canvas.
  6. Copy the single-line embed code with installation guides for HTML, WordPress, Shopify, and Next.js.

### 3.2 Standalone Widget Script Architecture (`public/widget.js`)
- **Source:** `src/widget/index.ts`
- **Compiler:** `scripts/build-widget.js` compiles the TypeScript source with `esbuild` into an optimized, self-contained IIFE bundle (`public/widget.js`, ~44 KB minified).
- **Standalone & Independent:** Includes the complete QR rendering engine natively with zero external runtime network requests or third-party dependencies.
- **Shadow DOM Encapsulation:**
  - Creates `<div id="quickqr-website-widget-host"></div>` and attaches Shadow DOM (`attachShadow({ mode: 'open' })`).
  - Injects scoped `:host` CSS styles.
  - Merchant stylesheets, CSS resets, or theme stylesheets cannot break widget layout or typography.
  - Widget styles cannot leak out into the merchant's host website.
- **Accessibility & Focus Management:**
  - Floating launcher has `aria-haspopup="dialog"`, `aria-expanded="false"`, and descriptive `aria-label`.
  - Popup modal has `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, and `aria-describedby`.
  - Traps `Escape` key to close the modal and returns focus to the trigger button.
  - Backdrop click closes the modal.
  - Close button has clear focus ring and `aria-label="Close dialog"`.

### 3.3 Security Decisions
- **Strict Input Sanitization:** `sanitizeWidgetConfig` strips HTML tags, control characters, and script blocks from all merchant-supplied labels and descriptions.
- **URL & Protocol Neutralization:** Explicitly detects and neutralizes `javascript:`, `vbscript:`, `data:text/html`, `<script>`, `onerror=`, and `onload=` vectors in the payload field, safely defaulting to a verified HTTPS fallback.
- **Safe DOM Construction:** Render code in `widget.js` and `WebsiteWidgetBuilder.tsx` strictly uses `document.createElement`, `element.textContent`, and canvas drawing APIs. No `innerHTML` string interpolation is used for dynamic user inputs.
- **No Hardcoded Credentials:** Embed snippets use public, URL-safe base64 encoded configuration strings (`data-config="..."`) and explicit attributes without exposing merchant secrets.

### 3.4 Homepage Feature Section
- Added `WebsiteWidgetHighlightSection.tsx` to `src/app/page.tsx` right after the primary generator studio.
- Explains: *"Add QR-powered actions directly to your website."*
- Features visual step progression:
  $$\text{Your Website} \longrightarrow \text{Floating QR Widget} \longrightarrow \text{Customer Scans} \longrightarrow \text{Instant Action Triggered (UPI / WhatsApp / Review / Menu)}$$
- Clearly states that the widget is 100% free with unlimited scans during Phase 1.

---

## 4. Final UPI Counter Stand Visual QA & Refinement Pass

A comprehensive browser-driven visual quality inspection of the dedicated UPI Counter Stand was executed across 7 responsive viewport widths (320px, 375px, 390px, 412px, 768px, 1024px, 1440px), testing extreme user inputs, all 4 visual templates, and export mechanisms.

### 4.1 Visual Issues Identified & Fixed
1. **QR Size & Hierarchy:** The QR code occupied ~56% width in preview, feeling slightly small relative to real Indian merchant acrylic stands. Upgraded QR size to **~62% of card width** (`w-52 / 236px` in preview, `1116px` on 1800px HD canvas, `276px` in print), firmly establishing the QR code as the dominant visual anchor.
2. **Card Padding & Footer Spacing:** On compact mobile widths (320px - 375px), bottom elements (UPI ID, instruction, badges, footer) were pushed tightly against the bottom border, causing subtle footer text clipping. Refined padding to `p-4 sm:p-5 pb-3 sm:pb-3.5` and added explicit vertical breathing room.
3. **Subtle Divider Line Visibility:** The hairline separator below the merchant name lacked explicit height on some browsers. Standardized to `w-2/3 mx-auto h-[1px] bg-neutral-200/90 my-2`, rendering crisp and subtle across all displays.
4. **Canvas Export Vertical Balance:** In `renderUPIStandToCanvas`, elements were previously stacked sequentially from the top, leaving an oversized blank void at the bottom. Re-engineered canvas rendering to vertically center the QR code between the top section and anchored bottom section, achieving exact parity with the browser preview.
5. **Print Dialog Security (DOM XSS):** Added `escapeXml` sanitization for all merchant-supplied text strings (`displayName`, `upiId`, `instruction`, `cleanFooter`, `amountText`) before injecting into the print dialog HTML.
6. **Terminology & Copy Accuracy:**
   - Removed all references to "legally safe" or "legally compliant" logos. Standardized to neutral terminology: *"Supported payment app badges"* and *"Payment ecosystem badges"*.
   - Replaced strong scannability claims with factual language: *"QR readability validated before export."*
   - Avoided unsupported claims regarding payment processing, verification, or settlement.
7. **Long Merchant Name & VPA Wrapping:** Verified that extreme store names (70+ characters) and long VPAs (40+ characters) wrap cleanly across centered lines using `overflow-wrap: anywhere; word-break: break-word;` with responsive font scaling, with zero clipping or card overflow.

### 4.2 Multi-Viewport Browser Verification Matrix
| Viewport | Card Aspect Ratio | QR Dominance | Text Wrapping | Horizontal Overflow | Result |
|:---|:---:|:---:|:---:|:---:|:---:|
| **1440 × 900** (Desktop) | 3:4 Portrait | Dominant (62%) | Clean & Centered | Zero overflow | **Pass** |
| **1024 × 768** (Tablet Landscape) | 3:4 Portrait | Dominant (62%) | Clean & Centered | Zero overflow | **Pass** |
| **768 × 1024** (Tablet Portrait) | 3:4 Portrait | Dominant (62%) | Clean & Centered | Zero overflow | **Pass** |
| **412 × 915** (Android Flagship) | 3:4 Portrait | Dominant (62%) | Clean & Centered | Zero overflow | **Pass** |
| **390 × 844** (iPhone 14/15) | 3:4 Portrait | Dominant (62%) | Clean & Centered | Zero overflow | **Pass** |
| **375 × 667** (iPhone SE) | 3:4 Portrait | Dominant (62%) | Clean & Centered | Zero overflow | **Pass** |
| **320 × 568** (Compact Mobile) | 3:4 Portrait | Dominant (62%) | Clean & Centered | Zero overflow | **Pass** |

### 4.3 Template & Toggle Verification
- **Classic UPI:** Pure white card with subtle divider and clean supported payment app badges (`BHIM`, `UPI`, `GPay`, `PhonePe`, `Paytm`). Matches real Indian merchant counter references.
- **Business UPI:** Clean brand accent bar at the top edge with professional hierarchy.
- **Scan & Pay:** Prominent `"SCAN & PAY"` pill header badge.
- **Minimal:** Maximum whitespace, merchant name, dominant QR code, and essential UPI ID.
- **Badges Toggle (OFF/ON):** Stand maintains natural, balanced whitespace with badges disabled.

### 4.4 High-Resolution PNG & Print Flow Results
- **PNG Export Resolution:** 1800 × 2400 pixels (exact 3:4 aspect ratio, 300 DPI equivalent).
- **Print Flow:** Opens browser print dialog with portrait A4/A5 single-page card layout, `page-break-inside: avoid;`, and zero UI chrome or preview artifacts.
- **Automated QR Decoding:** Exported 1800 × 2400 canvas decoded with `jsQR` under test conditions with 100% exact payload match (`upi://pay?pa=...`).

---

## 5. Verification & Automated Test Results

### 5.1 Test Suite (`npm run test`)
```
✓ tests/qr-download.test.ts (8 tests)
✓ tests/table-stand.test.ts (8 tests)
✓ tests/widget.test.ts (10 tests)
✓ tests/qr-payloads.test.ts (17 tests)
✓ tests/qr-validation.test.ts (22 tests)
✓ tests/upi-stand.test.ts (10 tests)
✓ tests/qr-decoding.test.ts (6 tests)

Test Files  7 passed (7)
Tests       81 passed (81)
Duration    448ms
```

### 5.2 Linter (`npm run lint`)
```
> quickqr@1.0.0 lint
> eslint

✓ 0 errors, 0 warnings.
```

### 5.3 Production Build (`npm run build`)
```
[build-widget] Bundling widget to public/widget.js...
  public\widget.js  43.7kb
Done in 9ms
[build-widget] Successfully built public/widget.js (44 KB)

▲ Next.js 16.3.6 (Turbopack)
✓ Compiled successfully in 889ms
✓ Finished TypeScript in 2.2s
✓ Generating static pages using 15 workers (20/20) in 880ms

Route (app)
├ ○ /
├ ○ /_not-found
├ ○ /email-qr-code-generator
├ ○ /google-maps-qr-code-generator
├ ○ /google-review-qr-code-generator
├ ○ /menu-qr-code-generator
├ ○ /pdf-qr-code-generator
├ ○ /phone-qr-code-generator
├ ○ /pricing
├ ○ /qr-code-generator
├ ○ /robots.txt
├ ○ /sitemap.xml
├ ○ /text-qr-code-generator
├ ○ /upi-qr-code-generator
├ ○ /url-qr-code-generator
├ ○ /vcard-qr-code-generator
├ ○ /website-qr-widget
├ ○ /whatsapp-qr-code-generator
└ ○ /wifi-qr-code-generator

✓ [standalone] Copied .next/static to .next/standalone/.next/static
✓ [standalone] Copied public to .next/standalone/public
```

---

## 6. Known Limitations & Phase 2 Boundaries

In accordance with project constraints, the following features remain strictly reserved for Phase 2:
- **No Dynamic Redirect Server:** Generates static, client-side QR codes. Changing destination URLs remotely without re-embedding requires Phase 2 dynamic short URL infrastructure.
- **No Database Persistence:** Widget configurations in Phase 1 are stored in the URL-safe base64 `data-config` attribute rather than a database table.
- **No Merchant Accounts / Auth:** Merchants do not need to register or log in to create or embed widgets.
- **No Scan Analytics:** Real-time tracking of visitor scans and conversions is a Phase 2 capability.
- **No Payment Gateway Processing:** UPI payments execute directly between customer banking apps and merchant VPAs with zero platform intermediary handling.

---

## 7. Final Phase 1 Production Sign-Off
With the visual QA and refinement pass complete, the physical UPI Counter Stand strictly mirrors real Indian merchant counter displays in proportions, dominant QR hierarchy, print usability, and neutral compliance. All 81 automated tests, linter, and static production build pass with zero errors. Phase 1 is officially complete and production ready.

