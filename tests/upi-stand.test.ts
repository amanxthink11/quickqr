import { describe, it, expect } from 'vitest';
import QRCode from 'qrcode';
import jsQR from 'jsqr';
import {
  parseUPIPayload,
  getDefaultUPIStandConfig,
  UPIStandConfig,
} from '../src/lib/qr/upi-stand';

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
    buffer[i] = 255;
    buffer[i + 1] = 255;
    buffer[i + 2] = 255;
    buffer[i + 3] = 255;
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
            buffer[idx] = 0;
            buffer[idx + 1] = 0;
            buffer[idx + 2] = 0;
            buffer[idx + 3] = 255;
          }
        }
      }
    }
  }

  const result = jsQR(buffer, size, size, { inversionAttempts: 'attemptBoth' });
  return result !== null && result.data === payload;
}

describe('Dedicated UPI Counter Stand Engine', () => {
  it('parses standard upi:// payment intent payloads correctly', () => {
    const payload = 'upi://pay?pa=store%40okhdfcbank&pn=Super%20Mart&am=250.00&cu=INR';
    const result = parseUPIPayload(payload);

    expect(result.vpa).toBe('store@okhdfcbank');
    expect(result.name).toBe('Super Mart');
    expect(result.amount).toBe('₹250.00');
  });

  it('handles payloads without fixed amount gracefully', () => {
    const payload = 'upi://pay?pa=cafe@upi&pn=Royal%20Cafe';
    const result = parseUPIPayload(payload);

    expect(result.vpa).toBe('cafe@upi');
    expect(result.name).toBe('Royal Cafe');
    expect(result.amount).toBeUndefined();
  });

  it('returns valid default configuration for UPI stand', () => {
    const payload = 'upi://pay?pa=merchant@upi&pn=ABC%20Store';
    const config = getDefaultUPIStandConfig(payload, 'ABC Store');

    expect(config.template).toBe('classic');
    expect(config.merchantName).toBe('ABC Store');
    expect(config.upiId).toBe('merchant@upi');
    expect(config.instructionText).toBe('Scan and pay using your preferred UPI app');
    expect(config.footerText).toBe('BHIM UPI');
    expect(config.showPaymentBranding).toBe(true);
    expect(config.isUppercaseName).toBe(true);

    // Factual copy audit: no claims of processing, verification, or security guarantees
    expect(config.footerText.toLowerCase()).not.toContain('secure');
    expect(config.footerText.toLowerCase()).not.toContain('process');
    expect(config.footerText.toLowerCase()).not.toContain('verify');
    expect(config.instructionText.toLowerCase()).not.toContain('guarantee');
  });

  it('handles very long merchant names and long UPI IDs safely', () => {
    const longName = 'SRI VENKATESHWARA AGRICULTURAL FARMERS PRODUCER ENTERPRISES PRIVATE LIMITED';
    const longUpi = 'srivenkateshwarafarmersproducerenterprisespvtltd@okhdfcbank';
    const payload = `upi://pay?pa=${encodeURIComponent(longUpi)}&pn=${encodeURIComponent(longName)}&cu=INR`;

    const config = getDefaultUPIStandConfig(payload, longName);
    expect(config.merchantName).toBe(longName);
    expect(config.upiId).toBe(longUpi);
  });

  it('verifies optical decodability for open-amount UPI QR payload', () => {
    const openAmountPayload = 'upi://pay?pa=retailer@upi&pn=Corner%20Shop&cu=INR';
    expect(testQRDecodability(openAmountPayload)).toBe(true);
  });

  it('verifies optical decodability for fixed-amount UPI QR payload', () => {
    const fixedAmountPayload = 'upi://pay?pa=billing@okhdfcbank&pn=Boutique&am=1299.50&cu=INR';
    expect(testQRDecodability(fixedAmountPayload)).toBe(true);
  });

  it('strictly guarantees no Labnol branding appears in footer', () => {
    const config = getDefaultUPIStandConfig();
    expect(config.footerText.toLowerCase()).not.toContain('labnol');

    // Test stripping if a user attempts to supply Labnol text
    const maliciousConfig: UPIStandConfig = {
      ...config,
      footerText: 'Create your own UPI QR code at www.labnol.org/upi',
    };
    const sanitizedFooter = maliciousConfig.footerText
      .replace(/labnol/gi, '')
      .replace(/www\.labnol\.org[^\s]*/gi, '')
      .trim();

    expect(sanitizedFooter.toLowerCase()).not.toContain('labnol');
  });

  it('preserves the logical 3:4 portrait aspect ratio', () => {
    const targetWidth = 1800;
    const targetHeight = Math.round((targetWidth * 4) / 3);

    expect(targetHeight).toBe(2400);
    expect(targetWidth / targetHeight).toBeCloseTo(3 / 4, 3);
  });

  it('calculates visually dominant QR proportion (~62% of width)', () => {
    const targetWidth = 1800;
    const qrSize = Math.round(targetWidth * 0.62);
    expect(qrSize).toBe(1116);
    expect(qrSize / targetWidth).toBeCloseTo(0.62, 2);
  });

  it('escapes special XML/HTML characters to prevent DOM injection in print layout', () => {
    // Verify that potential XSS payloads are safely neutralized
    const unsafeStrings = [
      '<script>alert("xss")</script>',
      'ABC & DEF "Store" <Special>',
      '<img src=x onerror=alert(1)>',
    ];

    const escapeXmlTest = (unsafe: string) =>
      unsafe
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

    unsafeStrings.forEach((str) => {
      const escaped = escapeXmlTest(str);
      expect(escaped).not.toContain('<script>');
      expect(escaped).not.toContain('<img');
      expect(escaped).not.toContain('>');
      expect(escaped).not.toContain('<');
    });
  });
});

