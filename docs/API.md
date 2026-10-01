# QuickQR Developer REST API Documentation (v1)

Welcome to the QuickQR Developer REST API. The API enables businesses, POS systems, marketing automation platforms, and third-party developers to programmatically generate dynamic QR codes, update redirection destinations in real time, inspect privacy-friendly scan analytics, and control remote website widgets.

---

## 1. Overview & Base URL

- **Production Base URL:** `https://quickqr.in/api/v1` (or your Hostinger Cloud domain)
- **Staging / Local Base URL:** `http://localhost:3000/api/v1`
- **Protocol:** HTTPS strictly required in production
- **Format:** `application/json; charset=utf-8`

---

## 2. Authentication

All requests to the QuickQR Developer REST API must authenticate using an API key passed in the standard HTTP `Authorization` header:

```http
Authorization: Bearer qk_live_REDACTED_SECRET_KEY
```

### API Key Format
QuickQR API keys use the following format:
```
qk_live_[64 hexadecimal characters]
```
Example:
```
qk_live_7f8a9b2c3d4e5f60718293a4b5c6d7e8f90112233445566778899aabbccddeef
```

### Security & Storage Invariant
- **Displayed Once:** When an API key is created in the merchant dashboard (`/dashboard/api-keys`), the complete raw secret is returned **exactly once**.
- **Cryptographic Hash-at-Rest:** QuickQR persists only a 16-character public prefix (`qk_live_7f8a9b2c`) for index lookup and a SHA-256 cryptographic hash of the raw key.
- **Zero Raw Secret Recovery:** The database contains no plaintext or decryptable credentials. If a key is lost, revoke it and generate a new key.
- **Header Only:** API keys are rejected if passed in query parameters, request bodies, or cookies.

---

## 3. Standard Response Format

All responses return standard HTTP status codes and JSON payloads with predictable top-level envelopes.

### Success Response Envelope
```json
{
  "data": { ... }
}
```

### Paginated Success Response Envelope
```json
{
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 25,
    "total": 42,
    "totalPages": 2
  }
}
```

### Error Response Envelope
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Destination URL failed security validation"
  }
}
```

---

## 4. Error Codes & HTTP Status

| HTTP Status | Error Code | Description |
| :--- | :--- | :--- |
| `400` | `INVALID_REQUEST` | Malformed JSON or unparseable request body. |
| `401` | `UNAUTHORIZED` | Missing, malformed, invalid, expired, or revoked API key. |
| `403` | `FORBIDDEN` | API key lacks required scope or operation permissions. |
| `404` | `NOT_FOUND` | Resource not found or not owned by your organization (IDOR defense). |
| `409` | `CONFLICT` | Resource conflict (e.g. unique constraint violation). |
| `422` | `VALIDATION_ERROR` | Schema validation failure (e.g. invalid URL, missing required field). |
| `429` | `RATE_LIMITED` | Rate limit threshold exceeded. Check `Retry-After` header. |
| `500` | `INTERNAL_ERROR` | Server-side execution exception. Stack traces are never exposed. |

---

## 5. Rate Limiting

Rate limits are enforced per API key ID via a sliding-window algorithm:

| Operation Type | HTTP Methods | Limit | Lockout / Window |
| :--- | :--- | :--- | :--- |
| **Read Operations** | `GET` | **120 requests** / minute | 60 seconds |
| **Write Operations** | `POST`, `PATCH`, `DELETE` | **30 requests** / minute | 60 seconds |
| **Failed Authentication** | Any with bad key | **10 attempts** / minute | 60 seconds (IP-level) |

When rate-limited, the API responds with `HTTP 429` and includes the `Retry-After` header indicating the number of seconds until requests are accepted again.

---

## 6. Endpoints: Dynamic QR Codes

### 6.1 List QR Codes
```http
GET /api/v1/qr-codes?page=1&limit=25&status=ACTIVE&search=menu
```

**Query Parameters:**
- `page` (optional integer, default `1`)
- `limit` (optional integer, default `25`, max `100`)
- `status` (optional: `ACTIVE`, `PAUSED`, `ARCHIVED`, `EXPIRED`)
- `type` (optional: `DYNAMIC_URL`, `STATIC_URL`)
- `search` (optional string: filters by title or shortCode)

**Example Response (`200 OK`):**
```json
{
  "data": [
    {
      "id": "cm1abcdef000001",
      "shortCode": "k9xL2pQ",
      "title": "Main Restaurant Menu",
      "type": "DYNAMIC_URL",
      "status": "ACTIVE",
      "destinationUrl": "https://restaurant.com/menu.pdf",
      "styling": {
        "fgColor": "#000000",
        "bgColor": "#ffffff",
        "logoUrl": null
      },
      "expiresAt": null,
      "scanLimit": null,
      "createdAt": "2026-09-25T14:00:00.000Z",
      "updatedAt": "2026-09-25T14:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 25,
    "total": 1,
    "totalPages": 1
  }
}
```

---

### 6.2 Create Dynamic QR Code
```http
POST /api/v1/qr-codes
```

**Request Body:**
```json
{
  "title": "Summer Promotion Standee",
  "destinationUrl": "https://brand.in/summer-sale",
  "type": "DYNAMIC_URL",
  "styling": {
    "fgColor": "#1e3a8a",
    "bgColor": "#ffffff"
  },
  "scanLimit": 10000,
  "expiresAt": "2026-12-31T23:59:59.000Z"
}
```

**Example Response (`201 Created`):**
```json
{
  "data": {
    "id": "cm1xyz789000001",
    "shortCode": "m4vR7wX",
    "title": "Summer Promotion Standee",
    "type": "DYNAMIC_URL",
    "status": "ACTIVE",
    "destinationUrl": "https://brand.in/summer-sale",
    "styling": {
      "fgColor": "#1e3a8a",
      "bgColor": "#ffffff"
    },
    "expiresAt": "2026-12-31T23:59:59.000Z",
    "scanLimit": 10000,
    "createdAt": "2026-09-25T15:00:00.000Z",
    "updatedAt": "2026-09-25T15:00:00.000Z"
  }
}
```

---

### 6.3 Get Single QR Code
```http
GET /api/v1/qr-codes/{id}
```

**Example Response (`200 OK`):**
```json
{
  "data": {
    "id": "cm1xyz789000001",
    "shortCode": "m4vR7wX",
    "title": "Summer Promotion Standee",
    "type": "DYNAMIC_URL",
    "status": "ACTIVE",
    "destinationUrl": "https://brand.in/summer-sale",
    "styling": { "fgColor": "#1e3a8a", "bgColor": "#ffffff" },
    "expiresAt": "2026-12-31T23:59:59.000Z",
    "scanLimit": 10000,
    "createdAt": "2026-09-25T15:00:00.000Z",
    "updatedAt": "2026-09-25T15:00:00.000Z"
  }
}
```

---

### 6.4 Update QR Code / Destination
```http
PATCH /api/v1/qr-codes/{id}
```

> **Instant Redirection Guarantee:** Updating `destinationUrl` updates the physical QR redirect immediately while keeping the shortCode and printed QR image completely identical.

**Request Body:**
```json
{
  "title": "Winter Clearance Standee",
  "destinationUrl": "https://brand.in/winter-deals"
}
```

**Example Response (`200 OK`):**
```json
{
  "data": {
    "id": "cm1xyz789000001",
    "shortCode": "m4vR7wX",
    "title": "Winter Clearance Standee",
    "type": "DYNAMIC_URL",
    "status": "ACTIVE",
    "destinationUrl": "https://brand.in/winter-deals",
    "styling": { "fgColor": "#1e3a8a", "bgColor": "#ffffff" },
    "expiresAt": "2026-12-31T23:59:59.000Z",
    "scanLimit": 10000,
    "createdAt": "2026-09-25T15:00:00.000Z",
    "updatedAt": "2026-09-25T15:15:00.000Z"
  }
}
```

---

### 6.5 Pause QR Code
```http
POST /api/v1/qr-codes/{id}/pause
```
Scans to `/q/{shortCode}` will immediately route to the branded `/q-status/paused` page.

**Example Response (`200 OK`):**
```json
{
  "data": {
    "id": "cm1xyz789000001",
    "status": "PAUSED",
    "updatedAt": "2026-09-25T15:20:00.000Z"
  }
}
```

---

### 6.6 Resume QR Code
```http
POST /api/v1/qr-codes/{id}/resume
```
Restores normal redirection to the active destination URL.

**Example Response (`200 OK`):**
```json
{
  "data": {
    "id": "cm1xyz789000001",
    "status": "ACTIVE",
    "updatedAt": "2026-09-25T15:25:00.000Z"
  }
}
```

---

### 6.7 Delete / Archive QR Code
```http
DELETE /api/v1/qr-codes/{id}
```
Executes a soft-delete within the organization boundary. Subsequent scans will return `/q-status/not-found`.

**Example Response (`200 OK`):**
```json
{
  "data": {
    "deleted": true
  }
}
```

---

## 7. Endpoints: Scan Analytics

### 7.1 Single QR Analytics
```http
GET /api/v1/qr-codes/{id}/analytics?range=7d
```

**Query Parameters:**
- `range` (optional: `today`, `7d`, `30d`; default `7d`)

**Example Response (`200 OK`):**
```json
{
  "data": {
    "qrCodeId": "cm1xyz789000001",
    "shortCode": "m4vR7wX",
    "title": "Winter Clearance Standee",
    "range": "7d",
    "overview": {
      "totalScans": 1420,
      "scansToday": 112,
      "scans7d": 845,
      "scans30d": 1420,
      "periodScans": 845
    },
    "trend": [
      { "date": "2026-09-19", "label": "Sep 19", "count": 120 },
      { "date": "2026-09-20", "label": "Sep 20", "count": 135 }
    ],
    "deviceBreakdown": [
      { "name": "MOBILE", "count": 780, "percentage": 92 },
      { "name": "DESKTOP", "count": 65, "percentage": 8 }
    ],
    "osBreakdown": [
      { "name": "Android", "count": 520, "percentage": 62 },
      { "name": "iOS", "count": 260, "percentage": 31 }
    ],
    "geoBreakdown": {
      "countries": [{ "name": "IN", "count": 840, "percentage": 99 }],
      "cities": [{ "city": "Bengaluru", "country": "IN", "count": 520 }]
    },
    "referrerBreakdown": [
      { "name": "instagram.com", "count": 410, "percentage": 49 },
      { "name": "Direct / Camera", "count": 320, "percentage": 38 }
    ],
    "utmBreakdown": []
  }
}
```

---

### 7.2 Organization-Wide Analytics
```http
GET /api/v1/analytics?range=30d
```

Returns total aggregated scan statistics, top-performing QR codes, and categorical breakdowns across all QR codes belonging to the authenticated organization.

---

## 8. Endpoints: Remote Website Widgets

### 8.1 List Widgets
```http
GET /api/v1/widgets?page=1&limit=25
```

### 8.2 Create Widget
```http
POST /api/v1/widgets
```
**Request Body:**
```json
{
  "name": "E-Commerce Floating UPI QR",
  "config": {
    "type": "upi",
    "title": "Pay Instantly via UPI",
    "themeColor": "#4f46e5",
    "position": "bottom-right",
    "upiId": "merchant@okhdfcbank",
    "payeeName": "QuickStore India"
  }
}
```

**Example Response (`201 Created`):**
```json
{
  "data": {
    "id": "cm1wgt000001",
    "publicId": "wgt_8f7b2c9d1a3e5f70",
    "name": "E-Commerce Floating UPI QR",
    "status": "ACTIVE",
    "configuration": { ... },
    "createdAt": "2026-09-25T16:00:00.000Z",
    "updatedAt": "2026-09-25T16:00:00.000Z"
  }
}
```

---

### 8.3 Pause / Resume / Delete Widget
- `POST /api/v1/widgets/{id}/pause`
- `POST /api/v1/widgets/{id}/resume`
- `DELETE /api/v1/widgets/{id}`

---

## 9. cURL Integration Examples

### Create a Dynamic QR Code
```bash
curl -X POST https://quickqr.in/api/v1/qr-codes \
  -H "Authorization: Bearer qk_live_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Storefront Billing Counter",
    "destinationUrl": "https://quickstore.in/pay/bill?id=1049"
  }'
```

### Update Destination URL
```bash
curl -X PATCH https://quickqr.in/api/v1/qr-codes/cm1xyz789000001 \
  -H "Authorization: Bearer qk_live_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "destinationUrl": "https://quickstore.in/pay/bill?id=1050"
  }'
```

### Fetch 7-Day Analytics
```bash
curl -X GET "https://quickqr.in/api/v1/qr-codes/cm1xyz789000001/analytics?range=7d" \
  -H "Authorization: Bearer qk_live_YOUR_API_KEY"
```
