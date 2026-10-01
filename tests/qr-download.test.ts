import { describe, it, expect } from 'vitest';
import { escapeXml, sanitizeFilename, buildFramedQRSVG } from '../src/lib/qr/download';
import { DEFAULT_CUSTOMIZATION } from '../src/lib/qr/presets';

describe('QR Download, Export & SVG Security', () => {
  describe('escapeXml', () => {
    it('escapes XML special characters (&, <, >, ", \')', () => {
      expect(escapeXml('SCAN & PAY <NOW> "SPECIAL" \'OFFER\'')).toBe(
        'SCAN &amp; PAY &lt;NOW&gt; &quot;SPECIAL&quot; &apos;OFFER&apos;'
      );
    });

    it('returns empty string for null or undefined', () => {
      expect(escapeXml('')).toBe('');
      expect(escapeXml(undefined as unknown as string)).toBe('');
    });
  });

  describe('sanitizeFilename', () => {
    it('strips path traversal and dangerous characters', () => {
      expect(sanitizeFilename('../../etc/passwd')).toBe('passwd.png');
      expect(sanitizeFilename('my:bad*file?name<test>|')).toBe('mybadfilenametest.png');
      expect(sanitizeFilename('..\\..\\windows\\system32')).toBe('system32.png');
    });

    it('falls back to default filename when empty or all invalid', () => {
      expect(sanitizeFilename('///')).toBe('quickqr-code.png');
      expect(sanitizeFilename('')).toBe('quickqr-code.png');
    });

    it('preserves valid custom extensions', () => {
      expect(sanitizeFilename('my-qr.svg')).toBe('my-qr.svg');
      expect(sanitizeFilename('my-qr')).toBe('my-qr.png');
    });
  });

  describe('buildFramedQRSVG', () => {
    const sampleInnerSvg = '<svg viewBox="0 0 200 200"><rect width="200" height="200" fill="#000"/></svg>';

    it('embeds inner vector SVG with scaleRatio transform', () => {
      const result = buildFramedQRSVG(sampleInnerSvg, {
        ...DEFAULT_CUSTOMIZATION,
        frameStyle: 'bottom-banner',
        frameText: 'SCAN & PAY',
      });

      expect(result).toContain('<svg');
      expect(result).toContain('SCAN &amp; PAY');
      expect(result).not.toContain('<script');
    });

    it('safely escapes malicious frame text containing HTML or script tags', () => {
      const maliciousFrameText = '<script>alert("xss")</script> & "onclick=alert(1)';
      const result = buildFramedQRSVG(sampleInnerSvg, {
        ...DEFAULT_CUSTOMIZATION,
        frameStyle: 'bottom-banner',
        frameText: maliciousFrameText,
      });

      expect(result).not.toContain('<script>');
      expect(result).toContain('&lt;SCRIPT&gt;ALERT(&quot;XSS&quot;)&lt;/SCRIPT&gt;');
      expect(result).toContain('&amp;');
    });

    it('renders badge frame style correctly', () => {
      const result = buildFramedQRSVG(sampleInnerSvg, {
        ...DEFAULT_CUSTOMIZATION,
        frameStyle: 'badge',
        frameText: 'OFFICIAL QR',
      });

      expect(result).toContain('OFFICIAL QR');
      expect(result).toContain('rx="24"');
    });
  });
});
