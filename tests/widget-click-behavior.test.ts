/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import {
  getWidgetClickBehavior,
  resolveWidgetDestination,
  safeNavigate,
} from '../src/lib/widget/navigation';
import {
  getDefaultWidgetConfig,
  generateEmbedCode,
} from '../src/lib/widget/config';
import { QuickQRWebsiteWidget } from '../src/widget/index';
import { WidgetConfig } from '../src/lib/widget/types';

describe('Widget Click Behavior & Direct Navigation (GitHub Issue #1)', () => {
  describe('getWidgetClickBehavior', () => {
    it('defaults WhatsApp to direct 1-click behavior', () => {
      const config = getDefaultWidgetConfig('whatsapp');
      expect(getWidgetClickBehavior(config)).toBe('direct');
    });

    it('defaults Website Link to direct 1-click behavior', () => {
      const config = getDefaultWidgetConfig('website');
      expect(getWidgetClickBehavior(config)).toBe('direct');
    });

    it('defaults Google Review to direct 1-click behavior', () => {
      const config = getDefaultWidgetConfig('review');
      expect(getWidgetClickBehavior(config)).toBe('direct');
    });

    it('defaults Digital Menu to direct 1-click behavior', () => {
      const config = getDefaultWidgetConfig('menu');
      expect(getWidgetClickBehavior(config)).toBe('direct');
    });

    it('preserves modal behavior for UPI payment QR widgets', () => {
      const config = getDefaultWidgetConfig('upi');
      expect(getWidgetClickBehavior(config)).toBe('modal');
    });

    it('preserves modal behavior for Custom QR widgets', () => {
      const config = getDefaultWidgetConfig('custom');
      expect(getWidgetClickBehavior(config)).toBe('modal');
    });

    it('respects explicit clickBehavior override on Review and Menu', () => {
      const reviewModal = {
        ...getDefaultWidgetConfig('review'),
        clickBehavior: 'modal' as const,
      };
      expect(getWidgetClickBehavior(reviewModal)).toBe('modal');

      const menuModal = {
        ...getDefaultWidgetConfig('menu'),
        showQrModal: true,
      };
      expect(getWidgetClickBehavior(menuModal)).toBe('modal');
    });
  });

  describe('resolveWidgetDestination', () => {
    it('normalizes raw WhatsApp phone numbers to https://wa.me/<digits>', () => {
      const res = resolveWidgetDestination({
        type: 'whatsapp',
        payload: '+91 98765-43210',
      });
      expect(res.isSafe).toBe(true);
      expect(res.url).toBe('https://wa.me/919876543210');
      expect(res.target).toBe('_blank');
    });

    it('preserves pre-filled messages in WhatsApp wa.me URLs', () => {
      const res = resolveWidgetDestination({
        type: 'whatsapp',
        payload: 'https://wa.me/919876543210?text=Hello%20Support',
      });
      expect(res.isSafe).toBe(true);
      expect(res.url).toBe('https://wa.me/919876543210?text=Hello%20Support');
    });

    it('formats phone and pre-filled message correctly', () => {
      const res = resolveWidgetDestination({
        type: 'whatsapp',
        payload: '919876543210',
        message: 'Need help with order #123',
      } as any);
      expect(res.isSafe).toBe(true);
      expect(res.url).toBe('https://wa.me/919876543210?text=Need%20help%20with%20order%20%23123');
    });

    it('resolves website URLs with configured target', () => {
      const newTabRes = resolveWidgetDestination({
        type: 'website',
        payload: 'https://example.com/shop',
        target: '_blank',
      });
      expect(newTabRes.isSafe).toBe(true);
      expect(newTabRes.url).toBe('https://example.com/shop');
      expect(newTabRes.target).toBe('_blank');

      const sameTabRes = resolveWidgetDestination({
        type: 'website',
        payload: 'https://example.com/shop',
        openInNewTab: false,
        target: '_self',
      });
      expect(sameTabRes.isSafe).toBe(true);
      expect(sameTabRes.url).toBe('https://example.com/shop');
      expect(sameTabRes.target).toBe('_self');
    });

    it('rejects dangerous URL schemes: javascript:, data:, file:, vbscript:', () => {
      const dangerousList = [
        'javascript:alert(document.cookie)',
        'data:text/html,<script>alert(1)</script>',
        'file:///etc/passwd',
        'vbscript:MsgBox(1)',
      ];

      for (const payload of dangerousList) {
        const res = resolveWidgetDestination({
          type: 'website',
          payload,
        });
        expect(res.isSafe).toBe(false);
        expect(res.url).toBe('');
      }
    });

    it('handles empty or missing payloads safely', () => {
      const res = resolveWidgetDestination({
        type: 'website',
        payload: '',
      });
      expect(res.isSafe).toBe(false);
      expect(res.url).toBe('');
    });
  });

  describe('safeNavigate', () => {
    let mockWindowOpen: any;

    beforeEach(() => {
      mockWindowOpen = vi.fn();
      vi.stubGlobal('window', {
        open: mockWindowOpen,
        location: { assign: vi.fn(), href: '' },
      });
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('opens _blank URLs safely with noopener,noreferrer', () => {
      const res = safeNavigate('https://wa.me/919876543210', '_blank');
      expect(res).toBe(true);
      expect(mockWindowOpen).toHaveBeenCalledWith(
        'https://wa.me/919876543210',
        '_blank',
        'noopener,noreferrer'
      );
    });

    it('rejects dangerous navigation targets', () => {
      const res = safeNavigate('javascript:alert(1)', '_blank');
      expect(res).toBe(false);
      expect(mockWindowOpen).not.toHaveBeenCalled();
    });
  });

  describe('Embed Code Generation & Attributes', () => {
    it('generates embed code containing data-behavior and data-target', () => {
      const config = getDefaultWidgetConfig('website');
      const embed = generateEmbedCode(config, 'https://quickqr.art');
      expect(embed).toContain('data-behavior="direct"');
      expect(embed).toContain('data-target="_blank"');
    });

    it('generates UPI embed code with modal behavior', () => {
      const config = getDefaultWidgetConfig('upi');
      const embed = generateEmbedCode(config, 'https://quickqr.art');
      expect(embed).toContain('data-behavior="modal"');
    });
  });

  describe('Rendered DOM Widget Interactions (JSDOM)', () => {
    let dom: JSDOM;
    let originalWindow: any;
    let originalDocument: any;

    beforeEach(() => {
      dom = new JSDOM(
        '<!DOCTYPE html><html><body><div id="quickqr-website-widget-host"></div></body></html>',
        { url: 'https://testsite.com' }
      );
      originalWindow = global.window;
      originalDocument = global.document;

      global.window = dom.window as unknown as Window & typeof globalThis;
      global.document = dom.window.document;
      (global as any).HTMLElement = dom.window.HTMLElement;
      (global as any).HTMLAnchorElement = dom.window.HTMLAnchorElement;
      (global as any).HTMLButtonElement = dom.window.HTMLButtonElement;
      (global as any).KeyboardEvent = dom.window.KeyboardEvent;
      (global as any).Event = dom.window.Event;
      (global as any).MouseEvent = dom.window.MouseEvent;
    });

    afterEach(() => {
      global.window = originalWindow;
      global.document = originalDocument;
    });

    it('renders WhatsApp widget as direct anchor link that does not open QR modal', () => {
      const container = dom.window.document.getElementById('quickqr-website-widget-host')!;
      const config: Partial<WidgetConfig> = {
        type: 'whatsapp',
        payload: '919876543210',
        buttonLabel: 'Chat on WhatsApp',
        buttonIcon: 'whatsapp',
      };

      const widget = new QuickQRWebsiteWidget(container, config);
      const shadow = (widget as any).shadow as ShadowRoot;

      const launcher = shadow.querySelector('.widget-launcher');
      expect(launcher).toBeTruthy();
      expect(launcher?.tagName).toBe('A');
      expect((launcher as HTMLAnchorElement).href).toBe('https://wa.me/919876543210');
      expect((launcher as HTMLAnchorElement).target).toBe('_blank');
      expect((launcher as HTMLAnchorElement).rel).toContain('noopener');
      expect((launcher as HTMLAnchorElement).rel).toContain('noreferrer');

      // Verify modal is NOT opened on click
      const backdrop = shadow.querySelector('.widget-backdrop');
      expect(backdrop?.classList.contains('open')).toBe(false);

      // Trigger click event
      const clickEvent = new dom.window.MouseEvent('click', { bubbles: true, cancelable: true });
      launcher?.dispatchEvent(clickEvent);

      // Modal must remain closed
      expect(backdrop?.classList.contains('open')).toBe(false);
    });

    it('renders Website Link widget as direct anchor without QR modal', () => {
      const container = dom.window.document.getElementById('quickqr-website-widget-host')!;
      const config: Partial<WidgetConfig> = {
        type: 'website',
        payload: 'https://myshop.com/catalog',
        buttonLabel: 'Visit Store',
        target: '_blank',
      };

      const widget = new QuickQRWebsiteWidget(container, config);
      const shadow = (widget as any).shadow as ShadowRoot;

      const launcher = shadow.querySelector('.widget-launcher') as HTMLAnchorElement;
      expect(launcher).toBeTruthy();
      expect(launcher.tagName).toBe('A');
      expect(launcher.href).toBe('https://myshop.com/catalog');
      expect(launcher.target).toBe('_blank');
      expect(launcher.rel).toContain('noopener noreferrer');

      const backdrop = shadow.querySelector('.widget-backdrop');
      expect(backdrop?.classList.contains('open')).toBe(false);

      launcher.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true, cancelable: true }));
      expect(backdrop?.classList.contains('open')).toBe(false);
    });

    it('renders Website Link with target=_self when configured for same tab', () => {
      const container = dom.window.document.getElementById('quickqr-website-widget-host')!;
      const config: Partial<WidgetConfig> = {
        type: 'website',
        payload: 'https://myshop.com/page',
        openInNewTab: false,
        target: '_self',
      };

      const widget = new QuickQRWebsiteWidget(container, config);
      const shadow = (widget as any).shadow as ShadowRoot;

      const launcher = shadow.querySelector('.widget-launcher') as HTMLAnchorElement;
      expect(launcher.tagName).toBe('A');
      expect(launcher.target).toBe('_self');
    });

    it('renders UPI widget as interactive button and opens QR modal on click', () => {
      const container = dom.window.document.getElementById('quickqr-website-widget-host')!;
      const config: Partial<WidgetConfig> = {
        type: 'upi',
        payload: 'upi://pay?pa=merchant@okhdfcbank&pn=Merchant',
        buttonLabel: 'Pay with UPI',
      };

      const widget = new QuickQRWebsiteWidget(container, config);
      const shadow = (widget as any).shadow as ShadowRoot;

      const launcher = shadow.querySelector('.widget-launcher') as HTMLButtonElement;
      expect(launcher).toBeTruthy();
      expect(launcher.tagName).toBe('BUTTON');
      expect(launcher.getAttribute('aria-haspopup')).toBe('dialog');
      expect(launcher.getAttribute('aria-expanded')).toBe('false');

      const backdrop = shadow.querySelector('.widget-backdrop');
      expect(backdrop?.classList.contains('open')).toBe(false);

      // Clicking launcher opens modal
      launcher.click();
      expect(backdrop?.classList.contains('open')).toBe(true);
      expect(launcher.getAttribute('aria-expanded')).toBe('true');

      // Modal contains scannable dialog
      const modal = shadow.querySelector('.widget-modal');
      expect(modal).toBeTruthy();
      expect(modal?.getAttribute('role')).toBe('dialog');

      // Closing modal
      const closeBtn = shadow.querySelector('.widget-close-btn') as HTMLButtonElement;
      closeBtn.click();
      expect(backdrop?.classList.contains('open')).toBe(false);
    });

    it('renders Custom QR widget as button and opens scannable modal on click', () => {
      const container = dom.window.document.getElementById('quickqr-website-widget-host')!;
      const config: Partial<WidgetConfig> = {
        type: 'custom',
        payload: 'https://custom-link.org',
        buttonLabel: 'Scan QR Code',
      };

      const widget = new QuickQRWebsiteWidget(container, config);
      const shadow = (widget as any).shadow as ShadowRoot;

      const launcher = shadow.querySelector('.widget-launcher') as HTMLButtonElement;
      expect(launcher.tagName).toBe('BUTTON');

      launcher.click();
      const backdrop = shadow.querySelector('.widget-backdrop');
      expect(backdrop?.classList.contains('open')).toBe(true);
    });

    it('renders Google Review as direct link by default and as modal when explicitly configured', () => {
      const container1 = dom.window.document.createElement('div');
      dom.window.document.body.appendChild(container1);

      // Default review: direct
      const reviewDirect = new QuickQRWebsiteWidget(container1, {
        type: 'review',
        payload: 'https://g.page/r/example/review',
      });
      const shadow1 = (reviewDirect as any).shadow as ShadowRoot;
      expect(shadow1.querySelector('.widget-launcher')?.tagName).toBe('A');

      // Modal review: modal
      const container2 = dom.window.document.createElement('div');
      dom.window.document.body.appendChild(container2);
      const reviewModal = new QuickQRWebsiteWidget(container2, {
        type: 'review',
        payload: 'https://g.page/r/example/review',
        clickBehavior: 'modal',
        showQrModal: true,
      });
      const shadow2 = (reviewModal as any).shadow as ShadowRoot;
      expect(shadow2.querySelector('.widget-launcher')?.tagName).toBe('BUTTON');
    });

    it('renders Digital Menu as direct link by default and as modal when explicitly configured', () => {
      const container1 = dom.window.document.createElement('div');
      dom.window.document.body.appendChild(container1);

      // Default menu: direct
      const menuDirect = new QuickQRWebsiteWidget(container1, {
        type: 'menu',
        payload: 'https://restaurant.com/menu.pdf',
      });
      const shadow1 = (menuDirect as any).shadow as ShadowRoot;
      expect(shadow1.querySelector('.widget-launcher')?.tagName).toBe('A');

      // Modal menu: modal
      const container2 = dom.window.document.createElement('div');
      dom.window.document.body.appendChild(container2);
      const menuModal = new QuickQRWebsiteWidget(container2, {
        type: 'menu',
        payload: 'https://restaurant.com/menu.pdf',
        clickBehavior: 'modal',
      });
      const shadow2 = (menuModal as any).shadow as ShadowRoot;
      expect(shadow2.querySelector('.widget-launcher')?.tagName).toBe('BUTTON');
    });

    it('protects against malicious javascript: in configuration without throwing', () => {
      const container = dom.window.document.getElementById('quickqr-website-widget-host')!;
      const config: Partial<WidgetConfig> = {
        type: 'website',
        payload: 'javascript:alert("hacked")',
        buttonLabel: 'Click Me',
      };

      const widget = new QuickQRWebsiteWidget(container, config);
      const shadow = (widget as any).shadow as ShadowRoot;

      const launcher = shadow.querySelector('.widget-launcher') as HTMLElement;
      expect(launcher).toBeTruthy();
      // Sanitizer neutralizes javascript: to safe default https://quickqr.art
      if (launcher.tagName === 'A') {
        expect((launcher as HTMLAnchorElement).href).not.toContain('javascript:');
      }
    });

    it('handles legacy static config embed without clickBehavior defined', () => {
      const container = dom.window.document.getElementById('quickqr-website-widget-host')!;
      // Legacy config saved before this update does not have clickBehavior or showQrModal
      const legacyConfig: Partial<WidgetConfig> = {
        type: 'whatsapp',
        payload: '919876543210',
        brandColor: '#25D366',
        position: 'bottom-right',
      };

      const widget = new QuickQRWebsiteWidget(container, legacyConfig);
      const shadow = (widget as any).shadow as ShadowRoot;

      const launcher = shadow.querySelector('.widget-launcher') as HTMLAnchorElement;
      // It should automatically use the direct behavior
      expect(launcher.tagName).toBe('A');
      expect(launcher.href).toBe('https://wa.me/919876543210');
    });
  });
});
