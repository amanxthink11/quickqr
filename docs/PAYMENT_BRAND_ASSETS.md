# Payment Brand Assets & Guidelines Registry

> **Legal Disclaimer & Trademark Status Notice:**  
> All trademarks, logos, service marks, and trade names referenced herein (Google Pay, PhonePe, Paytm, BHIM, and UPI) are the registered property of their respective trademark owners (Google LLC, PhonePe Private Limited, One97 Communications Limited, and the National Payments Corporation of India).  
> **No bilateral commercial trademark license or formal co-marketing endorsement exists between QuickQR India and any of these entities.**  
> These assets are cataloged and displayed solely under **nominative fair use** principles and published merchant acceptance guidelines to factually indicate supported consumer payment apps on merchant counter payment stands. They are **NOT** described as "legally safe" or indemnified.

---

## 1. Brand Asset Inventory & Legal Attribution

### 1. Google Pay
- **Brand Owner**: Google LLC.
- **Official Published Guidelines**: [Google Pay Brand Guidelines for India](https://developers.google.com/pay/india/api/web/brand-guidelines).
- **Exact Asset Source**: Verified authentic vector asset (`public/payment-apps/google-pay/google-pay.svg`, sourced via Wikimedia Commons `File:Google_Pay_Logo.svg`).
- **Source URL**: `https://upload.wikimedia.org/wikipedia/commons/f/f2/Google_Pay_Logo.svg`
- **Asset Format**: SVG Vector (viewBox: `0 0 64 24`).
- **Date Verified**: 2026-09-25.
- **Published Usage Restrictions**:
  - Never alter the official color gradient or typography.
  - Maintain a minimum clear space equal to 50% of the height of the 'G' around all sides.
  - Minimum display height on web is 20px (enforced via responsive styling).
  - Must not imply endorsement, co-branding, or partnership with Google.
  - Must be displayed alongside other payment options in a neutral, balanced presentation.
- **Product Placement**: `PaymentAppBadges.tsx`, `UPIStandPreview.tsx`, Canvas export (300 DPI), and Print dialog.
- **Licensing Flag**: ⚠️ **Nominative Merchant Display Only**. Permitted under Google Pay India merchant acceptance guidelines. Commercial redistribution or white-label resale is strictly restricted.

---

### 2. PhonePe
- **Brand Owner**: PhonePe Private Limited.
- **Official Published Guidelines**: PhonePe Merchant Acceptance Visual Standards (`https://www.phonepe.com/`).
- **Exact Asset Source**: Verified authentic vector asset (`public/payment-apps/phonepe/phonepe.svg`, sourced via Wikimedia Commons `File:PhonePe_Logo.svg`).
- **Source URL**: `https://upload.wikimedia.org/wikipedia/commons/7/71/PhonePe_Logo.svg`
- **Asset Format**: SVG Vector (viewBox: `0 0 230 69.75`).
- **Date Verified**: 2026-09-25.
- **Published Usage Restrictions**:
  - The signature `#5F259F` brand purple circle with the Hindi 'Pe' glyph and English wordmark must remain unaltered.
  - Do not rotate, skew, add drop shadows, or recolor.
  - Maintain clear protective space around the emblem.
  - Used strictly to indicate PhonePe UPI acceptance on merchant counter stands.
- **Product Placement**: `PaymentAppBadges.tsx`, `UPIStandPreview.tsx`, Canvas export (300 DPI), and Print dialog.
- **Licensing Flag**: ⚠️ **Nominative Merchant Display Only**. Standard Indian retail acceptance usage. No bilateral trademark agreement.

---

### 3. Paytm
- **Brand Owner**: One97 Communications Limited.
- **Official Published Guidelines**: Paytm Merchant Brand Acceptance Guidelines (`https://paytm.com/`).
- **Exact Asset Source**: Verified authentic vector asset (`public/payment-apps/paytm/paytm.svg`, sourced via Wikimedia Commons `File:Paytm_Logo_(standalone).svg`).
- **Source URL**: `https://upload.wikimedia.org/wikipedia/commons/2/24/Paytm_Logo_%28standalone%29.svg`
- **Asset Format**: SVG Vector (viewBox: `0 0 16.84 5.28`).
- **Date Verified**: 2026-09-25.
- **Published Usage Restrictions**:
  - The two-tone blue palette (`#233266` navy for "Pay", `#54C1F0` cyan for "tm") must be preserved exactly.
  - Never separate the wordmark elements or alter character kerning.
  - Maintain clean borders and clear margins.
- **Product Placement**: `PaymentAppBadges.tsx`, `UPIStandPreview.tsx`, Canvas export (300 DPI), and Print dialog.
- **Licensing Flag**: ⚠️ **Nominative Merchant Display Only**. Permitted for factual payment acceptance signage; standalone promotional usage outside acceptance context is prohibited.

---

### 4. BHIM (Bharat Interface for Money)
- **Brand Owner**: National Payments Corporation of India (NPCI).
- **Official Published Guidelines**: NPCI BHIM Brand Guidelines (`https://www.npci.org.in/`).
- **Exact Asset Source**: Verified authentic vector asset (`public/payment-apps/bhim/bhim.svg`, sourced via Wikimedia Commons `File:BHIM_logo.svg`).
- **Source URL**: `https://upload.wikimedia.org/wikipedia/commons/6/65/BHIM_logo.svg`
- **Asset Format**: SVG Vector (viewBox: `0 0 32.17 7.96`).
- **Date Verified**: 2026-09-25.
- **Published Usage Restrictions**:
  - NPCI visual standards mandate preserving the green (`#008C44`) and orange (`#F47920`) angled indicators.
  - Aspect ratio of 4.04:1 must be maintained without vertical compression.
- **Product Placement**: `PaymentAppBadges.tsx`, `UPIStandPreview.tsx`, Canvas export (300 DPI), and Print dialog.
- **Licensing Flag**: ⚠️ **Public Ecosystem Signage**. Public utility brand managed by NPCI for Indian digital payments.

---

### 5. UPI (Unified Payments Interface)
- **Brand Owner**: National Payments Corporation of India (NPCI).
- **Official Published Guidelines**: NPCI Unified Payments Interface Brand Guidelines (`https://www.npci.org.in/what-we-do/upi/product-overview`).
- **Exact Asset Source**: Verified authentic vector asset (`public/payment-apps/upi/upi.svg`, sourced via Wikimedia Commons `File:UPI_logo.svg`).
- **Source URL**: `https://upload.wikimedia.org/wikipedia/commons/6/6f/UPI_logo.svg`
- **Asset Format**: SVG Vector (viewBox: `0 0 99.07 35.01`).
- **Date Verified**: 2026-09-25.
- **Published Usage Restrictions**:
  - The green and orange directional triangles and "UPI" bold wordmark must never be separated or recolored.
  - Must be displayed in conjunction with clear, neutral payment instructions: *"Scan and pay using your preferred UPI app"*.
- **Product Placement**: `PaymentAppBadges.tsx`, `UPIStandPreview.tsx`, Canvas export (300 DPI), and Print dialog.
- **Licensing Flag**: ⚠️ **Public Ecosystem Mark**. Standard retail payment acceptance identification across India.

---

## 2. Technical Safeguards in QuickQR Codebase

1. **Aspect Ratio Enforcement**: Every SVG logo renders using its mathematically defined aspect ratio (`aspectRatio = width / height`), preventing distortion across mobile, desktop, canvas, and print viewports.
2. **Balanced Visual Heights**: Logos share a uniform container height (14px web preview, 14×scale in 1800×2400 canvas, 15px print dialog) to ensure neutral, equal visual weight.
3. **Container Isolation**: Logos are housed within clean white pill containers (`#FFFFFF` with `#E2E8F0` border), preventing background clash and providing clear space.
4. **Defensive Text Fallback**: If an image asset fails to load, `PaymentAppBadges.tsx` gracefully renders the official brand name in plain text.
5. **Neutral Copy**: The platform strictly uses `"Scan and pay using your preferred UPI app"` and disclaims payment processing or transaction settlement guarantees.

---

## 3. Periodic Compliance Review Schedule

- **Frequency**: Every 6 months, or immediately upon notification of brand guideline updates by Google India, PhonePe, Paytm, or NPCI.
- **Takedown / Replacement Protocol**: If any trademark owner requests asset removal, the engineering team can toggle `variant="plain"` or remove the asset in `src/lib/qr/payment-assets.ts` in under 5 minutes without disrupting existing QR codes.
