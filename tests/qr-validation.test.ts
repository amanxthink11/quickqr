import { describe, it, expect } from 'vitest';
import {
  isSafeURL,
  isValidUPIVpa,
  isValidEmail,
  isValidHexColor,
  sanitizeSvg,
  getContrastRatio,
  assessQRReadability,
  validateQRInput,
} from '../src/lib/qr/validation';
import { DEFAULT_CUSTOMIZATION } from '../src/lib/qr/presets';

describe('QR Validation and Security', () => {
  describe('isSafeURL', () => {
    it('allows valid web URLs', () => {
      expect(isSafeURL('https://mybusiness.in')).toBe(true);
      expect(isSafeURL('http://subdomain.example.com/page?id=42')).toBe(true);
      expect(isSafeURL('example.com/menu')).toBe(true);
    });

    it('blocks malicious javascript: and vbscript: URIs', () => {
      expect(isSafeURL('javascript:alert("hacked")')).toBe(false);
      expect(isSafeURL('JAVASCRIPT:alert(1)')).toBe(false);
      expect(isSafeURL('vbscript:msgbox("test")')).toBe(false);
    });

    it('blocks dangerous protocols such as data:, file:, blob:, about:, and protocol-relative', () => {
      expect(isSafeURL('data:text/html,<script>alert(1)</script>')).toBe(false);
      expect(isSafeURL('file:///etc/passwd')).toBe(false);
      expect(isSafeURL('blob:https://example.com/uuid')).toBe(false);
      expect(isSafeURL('about:blank')).toBe(false);
      expect(isSafeURL('//attacker.com/malicious')).toBe(false);
    });

    it('blocks HTML tags and injection payloads in URLs', () => {
      expect(isSafeURL('https://example.com/<script>alert(1)</script>')).toBe(false);
      expect(isSafeURL('https://example.com/" onload="alert(1)')).toBe(false);
      expect(isSafeURL('https://example.com/\x00evil')).toBe(false);
    });
  });

  describe('isValidHexColor', () => {
    it('validates safe hex colors and transparent keyword', () => {
      expect(isValidHexColor('#fff')).toBe(true);
      expect(isValidHexColor('#121212')).toBe(true);
      expect(isValidHexColor('#12345678')).toBe(true);
      expect(isValidHexColor('transparent')).toBe(true);
    });

    it('rejects CSS injection attempts and malformed colors', () => {
      expect(isValidHexColor('red; background: url(x)')).toBe(false);
      expect(isValidHexColor('#xyz')).toBe(false);
      expect(isValidHexColor('expression(alert(1))')).toBe(false);
      expect(isValidHexColor('')).toBe(false);
    });
  });

  describe('sanitizeSvg', () => {
    it('strips script tags and inline handlers from SVGs', () => {
      const maliciousSvg = `<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"><circle cx="50" cy="50" r="40"/><script>evil()</script></svg>`;
      const cleaned = sanitizeSvg(maliciousSvg);
      expect(cleaned).not.toContain('<script');
      expect(cleaned).not.toContain('onload');
      expect(cleaned).toContain('<circle');
    });

    it('strips foreignObject and iframe elements from SVGs', () => {
      const complexSvg = `<svg xmlns="http://www.w3.org/2000/svg"><foreignObject><iframe src="evil.com"></iframe></foreignObject><rect width="10" height="10"/></svg>`;
      const cleaned = sanitizeSvg(complexSvg);
      expect(cleaned).not.toContain('<foreignObject');
      expect(cleaned).not.toContain('<iframe');
      expect(cleaned).toContain('<rect');
    });
  });

  describe('isValidUPIVpa', () => {
    it('validates standard Indian UPI VPAs', () => {
      expect(isValidUPIVpa('merchant@okhdfcbank')).toBe(true);
      expect(isValidUPIVpa('9876543210@paytm')).toBe(true);
      expect(isValidUPIVpa('apex.store@icici')).toBe(true);
      expect(isValidUPIVpa('user-name_1@ybl')).toBe(true);
      expect(isValidUPIVpa('sharma@axl')).toBe(true);
    });

    it('rejects invalid UPI addresses', () => {
      expect(isValidUPIVpa('')).toBe(false);
      expect(isValidUPIVpa('invalid-vpa-no-at-sign')).toBe(false);
      expect(isValidUPIVpa('user@')).toBe(false);
      expect(isValidUPIVpa('@bank')).toBe(false);
      expect(isValidUPIVpa('user with space@sbi')).toBe(false);
    });
  });

  describe('isValidEmail', () => {
    it('validates proper email formats', () => {
      expect(isValidEmail('support@quickqr.in')).toBe(true);
      expect(isValidEmail('sales.dept@company.co.in')).toBe(true);
    });

    it('rejects invalid emails', () => {
      expect(isValidEmail('')).toBe(false);
      expect(isValidEmail('not-an-email')).toBe(false);
      expect(isValidEmail('missing@domain')).toBe(false);
    });
  });

  describe('Contrast & Readability Scoring', () => {
    it('calculates maximum contrast for black and white', () => {
      const contrast = getContrastRatio('#000000', '#FFFFFF');
      expect(contrast).toBeGreaterThan(20);
    });

    it('calculates very low contrast for identical or similar colors', () => {
      const lowContrast = getContrastRatio('#CCCCCC', '#FFFFFF');
      expect(lowContrast).toBeLessThan(2.0);
    });

    it('flags low contrast as critical issue in assessQRReadability', () => {
      const result = assessQRReadability(
        {
          ...DEFAULT_CUSTOMIZATION,
          fgColor: '#EEEEEE',
          bgColor: '#FFFFFF',
        },
        50
      );
      expect(result.isReadable).toBe(false);
      expect(result.issues.some((i) => i.includes('Contrast ratio is very low'))).toBe(true);
      expect(result.score).toBeLessThan(60);
    });

    it('warns when logo is present with low error correction level', () => {
      const result = assessQRReadability(
        {
          ...DEFAULT_CUSTOMIZATION,
          logoUrl: 'data:image/png;base64,sample',
          errorCorrectionLevel: 'L',
        },
        50
      );
      expect(result.issues.some((i) => i.includes('too low for center logos'))).toBe(true);
      expect(result.suggestions.some((s) => s.includes('Level "H"'))).toBe(true);
    });

    it('flags low eye finder pattern contrast against background', () => {
      const result = assessQRReadability(
        {
          ...DEFAULT_CUSTOMIZATION,
          fgColor: '#000000',
          bgColor: '#FFFFFF',
          eyeColor: '#EEEEEE', // Eye color virtually identical to background
        },
        50
      );
      expect(result.isReadable).toBe(false);
      expect(result.issues.some((i) => i.includes('Corner eye finder pattern contrast'))).toBe(true);
    });

    it('gives high score to high-contrast QR with adequate margin and error correction', () => {
      const result = assessQRReadability(
        {
          ...DEFAULT_CUSTOMIZATION,
          fgColor: '#000000',
          bgColor: '#FFFFFF',
          margin: 4,
          errorCorrectionLevel: 'M',
        },
        80
      );
      expect(result.isReadable).toBe(true);
      expect(result.score).toBe(100);
    });
  });

  describe('validateQRInput', () => {
    it('validates UPI input and flags empty vpa', () => {
      const emptyVpa = validateQRInput('upi', {
        vpa: '',
        payeeName: 'Store',
      });
      expect(emptyVpa.isValid).toBe(false);

      const invalidVpa = validateQRInput('upi', {
        vpa: 'notanupiid',
        payeeName: 'Store',
      });
      expect(invalidVpa.isValid).toBe(false);

      const validUpi = validateQRInput('upi', {
        vpa: 'store@okhdfcbank',
        payeeName: 'Store',
        amount: '250.00',
      });
      expect(validUpi.isValid).toBe(true);
    });

    it('validates WhatsApp phone numbers', () => {
      const invalid = validateQRInput('whatsapp', {
        countryCode: '+91',
        phoneNumber: '123',
      });
      expect(invalid.isValid).toBe(false);

      const valid = validateQRInput('whatsapp', {
        countryCode: '+91',
        phoneNumber: '9876543210',
      });
      expect(valid.isValid).toBe(true);
    });

    it('validates Wi-Fi network inputs', () => {
      const noSsid = validateQRInput('wifi', {
        ssid: '',
        authType: 'WPA',
        password: 'pass',
      });
      expect(noSsid.isValid).toBe(false);

      const shortPassword = validateQRInput('wifi', {
        ssid: 'MyWiFi',
        authType: 'WPA',
        password: '12',
      });
      expect(shortPassword.isValid).toBe(false);

      const openWifi = validateQRInput('wifi', {
        ssid: 'PublicWifi',
        authType: 'nopass',
      });
      expect(openWifi.isValid).toBe(true);
    });

    it('validates vCard minimum requirements', () => {
      const empty = validateQRInput('vcard', {
        firstName: '',
        lastName: '',
      });
      expect(empty.isValid).toBe(false);

      const withCompany = validateQRInput('vcard', {
        firstName: '',
        lastName: '',
        organization: 'Apex Pvt Ltd',
      });
      expect(withCompany.isValid).toBe(true);
    });
  });
});
