# Third-Party Notices & Trademarks

QuickQR incorporates and interfaces with open-source software libraries and standard business protocols. This document provides attribution and notices for third-party libraries, protocols, and trademarks referenced within this project.

---

## 1. Third-Party Trademarks & Brand Clarifications

All trademarks, service marks, logos, brand names, and company names referenced in this codebase and documentation remain the property of their respective owners. Their inclusion in QuickQR does not imply endorsement, affiliation, sponsorship, or certification.

| Brand / Trademark | Trademark Owner | Usage in QuickQR |
| :--- | :--- | :--- |
| **UPI (Unified Payments Interface)** | National Payments Corporation of India (NPCI) | Standards-compliant payment intent URI generation (`upi://pay`) |
| **BHIM** | National Payments Corporation of India (NPCI) | Intent app reference for UPI payment QR testing |
| **Google Pay, Google Maps, Google Reviews** | Google LLC | Intent URI formatting, deep-linking, review sign generation |
| **PhonePe** | PhonePe Private Limited | Intent app URI formatting and merchant display testing |
| **Paytm** | One97 Communications Limited | Intent app URI formatting and merchant display testing |
| **WhatsApp** | Meta Platforms, Inc. | Click-to-chat URL formatting (`wa.me`) |
| **Wi-Fi Alliance** | Wi-Fi Alliance | Standard Wi-Fi network configuration URI format (`WIFI:S:...`) |

> **Important Clarification:**  
> QuickQR is an independent open-source software project. QuickQR is not affiliated with, sponsored by, or certified by NPCI, Google, PhonePe, Paytm, Meta Platforms, or any payment gateway. QuickQR formats standard URI strings client-side or redirects through dynamic short URLs; it does not process, intermediate, clear, or settle payment transactions.

---

## 2. Open-Source Dependencies

QuickQR is built with the following open-source libraries under permissive licenses:

### Production Dependencies
- **Next.js** — [MIT License](https://github.com/vercel/next.js/blob/canary/license.md) — Copyright (c) Vercel, Inc.
- **React & React DOM** — [MIT License](https://github.com/facebook/react/blob/main/LICENSE) — Copyright (c) Meta Platforms, Inc.
- **Prisma Client** — [Apache-2.0 License](https://github.com/prisma/prisma/blob/main/LICENSE) — Copyright (c) Prisma Data, Inc.
- **@node-rs/argon2** — [MIT License](https://github.com/napi-rs/node-rs/blob/main/packages/argon2/LICENSE) — Copyright (c) LongYinan
- **qrcode** — [MIT License](https://github.com/soldair/node-qrcode/blob/master/LICENSE) — Copyright (c) Ryan Day
- **qr-code-styling** — [MIT License](https://github.com/kozakdenys/qr-code-styling/blob/master/LICENSE) — Copyright (c) Denys Kozak
- **jsQR** — [Apache-2.0 License](https://github.com/cozmo/jsQR/blob/master/LICENSE) — Copyright (c) Cosmo Wolfe
- **Lucide Icons (`lucide-react`)** — [ISC License](https://github.com/lucide-icons/lucide/blob/main/LICENSE) — Copyright (c) Lucide Contributors
- **Zod** — [MIT License](https://github.com/colinhacks/zod/blob/master/LICENSE) — Copyright (c) Colin McDonnell

### Development & Tooling Dependencies
- **Tailwind CSS** — [MIT License](https://github.com/tailwindlabs/tailwindcss/blob/master/LICENSE) — Copyright (c) Tailwind Labs, Inc.
- **TypeScript** — [Apache-2.0 License](https://github.com/microsoft/TypeScript/blob/main/LICENSE.txt) — Copyright (c) Microsoft Corporation
- **Vitest** — [MIT License](https://github.com/vitest-dev/vitest/blob/main/LICENSE) — Copyright (c) Vitest team
- **ESLint** — [MIT License](https://github.com/eslint/eslint/blob/main/LICENSE) — Copyright (c) OpenJS Foundation
