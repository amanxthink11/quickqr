import { describe, it, expect } from 'vitest';
import {
  getDefaultWidgetConfig,
  validateWidgetConfig,
  sanitizeWidgetConfig,
  encodeWidgetConfig,
  decodeWidgetConfig,
  generateEmbedCode,
} from '../src/lib/widget/config';
import { WidgetConfig, WidgetType, WidgetPosition, WidgetSize } from '../src/lib/widget/types';

describe('Website QR Widget Configuration & Security', () => {
  it('returns valid default configuration for each supported widget type', () => {
    const types: WidgetType[] = ['upi', 'whatsapp', 'review', 'menu', 'website', 'custom'];
    types.forEach((type) => {
      const config = getDefaultWidgetConfig(type);
      expect(config.type).toBe(type);
      expect(config.buttonLabel).toBeTruthy();
      expect(config.brandColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(config.position).toBe('bottom-right');
      expect(config.size).toBe('medium');
      expect(config.payload).toBeTruthy();

      const validation = validateWidgetConfig(config);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });
  });

  it('validates position values correctly', () => {
    const base = getDefaultWidgetConfig('upi');

    const validRight = validateWidgetConfig({ ...base, position: 'bottom-right' });
    expect(validRight.isValid).toBe(true);

    const validLeft = validateWidgetConfig({ ...base, position: 'bottom-left' });
    expect(validLeft.isValid).toBe(true);

    const invalidPos = validateWidgetConfig({ ...base, position: 'top-center' as unknown as WidgetPosition });
    expect(invalidPos.isValid).toBe(false);
    expect(invalidPos.errors).toContain('Invalid widget position: top-center');
  });

  it('validates widget size values correctly', () => {
    const base = getDefaultWidgetConfig('upi');

    (['small', 'medium', 'large'] as WidgetSize[]).forEach((size) => {
      const res = validateWidgetConfig({ ...base, size });
      expect(res.isValid).toBe(true);
    });

    const invalidSize = validateWidgetConfig({ ...base, size: 'huge' as unknown as WidgetSize });
    expect(invalidSize.isValid).toBe(false);
    expect(invalidSize.errors).toContain('Invalid widget size: huge');
  });

  it('validates hex color strings strictly', () => {
    const base = getDefaultWidgetConfig('upi');

    const validHex = validateWidgetConfig({ ...base, brandColor: '#2563EB' });
    expect(validHex.isValid).toBe(true);

    const invalidHex = validateWidgetConfig({ ...base, brandColor: 'red; background: blue' });
    expect(invalidHex.isValid).toBe(false);
    expect(invalidHex.errors).toContain('Brand color must be a valid 6-character hex code (e.g. #2563EB)');
  });

  it('prevents XSS payloads and script injection in text fields', () => {
    const maliciousConfig: Partial<WidgetConfig> = {
      buttonLabel: 'Click Me <script>alert("hacked")</script>',
      popupTitle: 'Special Offer <img src=x onerror=alert(1)>',
      popupDescription: 'Test Description <iframe src="evil.com"></iframe>',
      ctaText: 'Open <script>evil()</script>',
    };

    const sanitized = sanitizeWidgetConfig(maliciousConfig);

    expect(sanitized.buttonLabel).not.toContain('<script>');
    expect(sanitized.buttonLabel).not.toContain('alert');
    expect(sanitized.popupTitle).not.toContain('<img');
    expect(sanitized.popupTitle).not.toContain('onerror');
    expect(sanitized.popupDescription).not.toContain('<iframe');
    expect(sanitized.ctaText).not.toContain('<script>');
  });

  it('neutralizes malicious javascript: URLs in payload and defaults safely', () => {
    const maliciousPayloadConfig: Partial<WidgetConfig> = {
      type: 'website',
      payload: 'javascript:alert(document.cookie)',
    };

    const sanitized = sanitizeWidgetConfig(maliciousPayloadConfig);
    expect(sanitized.payload).not.toContain('javascript:');
    expect(sanitized.payload).toBe('https://quickqr.art');
  });

  it('neutralizes data:text/html payloads', () => {
    const dataHtmlConfig: Partial<WidgetConfig> = {
      type: 'custom',
      payload: 'data:text/html,<script>alert(1)</script>',
    };

    const sanitized = sanitizeWidgetConfig(dataHtmlConfig);
    expect(sanitized.payload).not.toContain('data:text/html');
  });

  it('encodes and decodes widget configuration losslessly', () => {
    const original = getDefaultWidgetConfig('whatsapp');
    original.buttonLabel = 'Direct WhatsApp Support';
    original.brandColor = '#128C7E';
    original.position = 'bottom-left';
    original.size = 'large';

    const encoded = encodeWidgetConfig(original);
    expect(typeof encoded).toBe('string');
    expect(encoded.length).toBeGreaterThan(20);

    const decoded = decodeWidgetConfig(encoded);
    expect(decoded).not.toBeNull();
    expect(decoded?.type).toBe('whatsapp');
    expect(decoded?.buttonLabel).toBe('Direct WhatsApp Support');
    expect(decoded?.brandColor).toBe('#128C7E');
    expect(decoded?.position).toBe('bottom-left');
    expect(decoded?.size).toBe('large');
  });

  it('generates valid and copyable embed code with script tags and attributes', () => {
    const config = getDefaultWidgetConfig('upi');
    config.brandColor = '#16a34a';
    config.buttonLabel = 'Pay via UPI';

    const snippet = generateEmbedCode(config, 'https://quickqr.art');

    expect(snippet).toContain('<script');
    expect(snippet).toContain('src="https://quickqr.art/widget.js"');
    expect(snippet).toContain('async');
    expect(snippet).toContain('data-type="upi"');
    expect(snippet).toContain('data-label="Pay via UPI"');
    expect(snippet).toContain('data-color="#16a34a"');
    expect(snippet).toContain('data-config="');
    expect(snippet).toContain('</script>');
  });

  it('gracefully handles malformed base64 strings in decodeWidgetConfig', () => {
    const decoded = decodeWidgetConfig('invalid-non-base64-random-string!!!');
    expect(decoded).toBeNull();
  });
});
