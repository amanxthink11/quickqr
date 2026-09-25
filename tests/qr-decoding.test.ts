import { describe, it, expect } from 'vitest';
import QRCode from 'qrcode';
import jsQR from 'jsqr';
import {
  buildUPIPayload,
  buildWhatsAppPayload,
  buildURLPayload,
  buildWiFiPayload,
  buildVCardPayload,
  buildPhonePayload,
  buildEmailPayload,
  buildTextPayload,
  buildMapsPayload,
  buildGoogleReviewPayload,
  buildPDFPayload,
  buildMenuPayload,
} from '../src/lib/qr/payloads';

/**
 * Helper to render QRCode.create modules into an RGBA pixel buffer and decode with jsQR
 */
function testQRDecodability(payload: string): boolean {
  const qr = QRCode.create(payload, { errorCorrectionLevel: 'M' });
  const moduleCount = qr.modules.size;
  const margin = 4;
  const scale = 4;
  const size = (moduleCount + margin * 2) * scale;
  const buffer = new Uint8ClampedArray(size * size * 4);

  // Initialize with white background
  for (let i = 0; i < buffer.length; i += 4) {
    buffer[i] = 255;     // R
    buffer[i + 1] = 255; // G
    buffer[i + 2] = 255; // B
    buffer[i + 3] = 255; // A
  }

  // Draw modules
  for (let r = 0; r < moduleCount; r++) {
    for (let c = 0; c < moduleCount; c++) {
      const isDark = qr.modules.get(r, c);
      if (isDark) {
        for (let py = 0; py < scale; py++) {
          for (let px = 0; px < scale; px++) {
            const x = (c + margin) * scale + px;
            const y = (r + margin) * scale + py;
            const idx = (y * size + x) * 4;
            buffer[idx] = 0;     // R
            buffer[idx + 1] = 0; // G
            buffer[idx + 2] = 0; // B
            buffer[idx + 3] = 255; // A
          }
        }
      }
    }
  }

  const result = jsQR(buffer, size, size, { inversionAttempts: 'attemptBoth' });
  return result !== null && result.data === payload;
}

describe('Automated Optical QR Decoding Test', () => {
  it('encodes and optically decodes UPI payment payload', () => {
    const payload = buildUPIPayload({
      vpa: 'sharma.store@okhdfcbank',
      payeeName: 'Sharma General Store',
      amount: '350.00',
      currency: 'INR',
      transactionNote: 'Order #421',
    });
    expect(testQRDecodability(payload)).toBe(true);
  });

  it('encodes and optically decodes WhatsApp click-to-chat payload', () => {
    const payload = buildWhatsAppPayload({
      countryCode: '+91',
      phoneNumber: '9876543210',
      message: 'Hello, need information on pricing.',
    });
    expect(testQRDecodability(payload)).toBe(true);
  });

  it('encodes and optically decodes Website URL payload', () => {
    const payload = buildURLPayload({ url: 'https://quickqr.in' });
    expect(testQRDecodability(payload)).toBe(true);
  });

  it('encodes and optically decodes Wi-Fi network payload', () => {
    const payload = buildWiFiPayload({
      ssid: 'Cafe_HighSpeed_WiFi',
      password: 'CoffeePassword2026',
      authType: 'WPA',
      hidden: false,
    });
    expect(testQRDecodability(payload)).toBe(true);
  });

  it('encodes and optically decodes vCard contact card payload', () => {
    const payload = buildVCardPayload({
      firstName: 'Vikram',
      lastName: 'Mehta',
      organization: 'Mehta Textiles',
      title: 'Proprietor',
      mobile: '+919876543210',
      email: 'vikram@mehtatextiles.in',
    });
    expect(testQRDecodability(payload)).toBe(true);
  });

  it('encodes and optically decodes Phone, Email, Text, Maps, Review, PDF, and Menu payloads', () => {
    const phone = buildPhonePayload({ phoneNumber: '+919876543210' });
    expect(testQRDecodability(phone)).toBe(true);

    const email = buildEmailPayload({ email: 'info@store.in', subject: 'Quote', body: 'Please quote' });
    expect(testQRDecodability(email)).toBe(true);

    const text = buildTextPayload({ text: 'Batch #2026-X99 Warehouse Sector 4' });
    expect(testQRDecodability(text)).toBe(true);

    const maps = buildMapsPayload({ queryOrUrl: 'Connaught Place New Delhi' });
    expect(testQRDecodability(maps)).toBe(true);

    const review = buildGoogleReviewPayload({ reviewUrl: 'https://g.page/r/test-store/review' });
    expect(testQRDecodability(review)).toBe(true);

    const pdf = buildPDFPayload({ pdfUrl: 'https://docs.site.in/catalog.pdf' });
    expect(testQRDecodability(pdf)).toBe(true);

    const menu = buildMenuPayload({ menuUrl: 'https://bistro.in/menu-today' });
    expect(testQRDecodability(menu)).toBe(true);
  });
});
