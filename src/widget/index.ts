import QRCode from 'qrcode';
import { WidgetConfig, WidgetType, WidgetPosition, WidgetSize, WidgetBorderRadius, WidgetShadow } from '../lib/widget/types';
import {
  getDefaultWidgetConfig,
  sanitizeWidgetConfig,
  decodeWidgetConfig,
} from '../lib/widget/config';

// Icons as clean, safe inline SVGs (no external network requests or font dependencies)
const ICONS: Record<string, string> = {
  upi: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
  whatsapp: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>`,
  review: `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
  menu: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>`,
  website: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
  custom: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="8" height="8" x="3" y="3" rx="1"/><rect width="8" height="8" x="13" y="3" rx="1"/><rect width="8" height="8" x="3" y="13" rx="1"/><path d="M14 14h2v2h-2zM18 14h3v3h-3zM14 18h3v3h-3zM18 18h3v3h-3z"/></svg>`,
};

interface WidgetInstance {
  open: () => void;
  close: () => void;
  destroy: () => void;
  updateConfig: (newConfig: Partial<WidgetConfig>) => void;
}

export class QuickQRWebsiteWidget implements WidgetInstance {
  private config: WidgetConfig;
  private container: HTMLElement;
  private shadow: ShadowRoot;
  private isOpen = false;
  private previouslyFocusedElement: HTMLElement | null = null;
  private keydownListener: ((e: KeyboardEvent) => void) | null = null;

  constructor(targetContainer?: HTMLElement, customConfig?: Partial<WidgetConfig>) {
    const initialConfig = customConfig
      ? { ...getDefaultWidgetConfig('upi'), ...customConfig }
      : this.extractConfigFromDOM();

    this.config = sanitizeWidgetConfig(initialConfig);

    // Host element setup
    if (targetContainer) {
      this.container = targetContainer;
    } else {
      const existing = document.getElementById('quickqr-website-widget-host');
      if (existing) {
        existing.remove();
      }
      this.container = document.createElement('div');
      this.container.id = 'quickqr-website-widget-host';
      document.body.appendChild(this.container);
    }

    // Attach isolated Shadow DOM
    this.shadow = this.container.attachShadow({ mode: 'open' });
    this.render();
  }

  private extractConfigFromDOM(): WidgetConfig {
    const currentScript =
      (document.currentScript as HTMLScriptElement | null) ||
      document.querySelector('script[src*="widget.js"]');

    if (!currentScript) {
      return getDefaultWidgetConfig('upi');
    }

    // Check data-config attribute (base64 string)
    const encoded = currentScript.getAttribute('data-config');
    if (encoded) {
      const decoded = decodeWidgetConfig(encoded);
      if (decoded) return decoded;
    }

    // Or check individual data attributes
    const type = (currentScript.getAttribute('data-type') || 'upi') as WidgetType;
    const defaults = getDefaultWidgetConfig(type);

    return {
      type,
      payload: currentScript.getAttribute('data-payload') || defaults.payload,
      buttonLabel: currentScript.getAttribute('data-label') || defaults.buttonLabel,
      buttonIcon: (currentScript.getAttribute('data-icon') as WidgetConfig['buttonIcon']) || defaults.buttonIcon,
      brandColor: currentScript.getAttribute('data-color') || defaults.brandColor,
      buttonTextColor: currentScript.getAttribute('data-text-color') || defaults.buttonTextColor,
      position: (currentScript.getAttribute('data-position') as WidgetPosition) || defaults.position,
      size: (currentScript.getAttribute('data-size') as WidgetSize) || defaults.size,
      borderRadius: (currentScript.getAttribute('data-radius') as WidgetBorderRadius) || defaults.borderRadius,
      shadow: (currentScript.getAttribute('data-shadow') as WidgetShadow) || defaults.shadow,
      popupTitle: currentScript.getAttribute('data-title') || defaults.popupTitle,
      popupDescription: currentScript.getAttribute('data-desc') || defaults.popupDescription,
      ctaText: currentScript.getAttribute('data-cta') || defaults.ctaText,
      mobileBehavior: (currentScript.getAttribute('data-mobile') as WidgetConfig['mobileBehavior']) || defaults.mobileBehavior,
    };
  }

  private getShadowStyles(): string {
    const { position, brandColor, buttonTextColor, borderRadius, shadow, size } = this.config;

    const posCss =
      position === 'bottom-left'
        ? 'left: 20px; right: auto;'
        : 'right: 20px; left: auto;';

    let padding = '12px 20px';
    let fontSize = '15px';
    let iconSize = '20px';
    if (size === 'small') {
      padding = '9px 14px';
      fontSize = '13px';
      iconSize = '16px';
    } else if (size === 'large') {
      padding = '14px 26px';
      fontSize = '16px';
      iconSize = '22px';
    }

    let radiusCss = '9999px';
    if (borderRadius === 'rounded') radiusCss = '12px';
    if (borderRadius === 'square') radiusCss = '6px';

    let shadowCss = '0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)';
    if (shadow === 'soft') shadowCss = '0 4px 12px rgba(0, 0, 0, 0.08)';
    if (shadow === 'strong') shadowCss = '0 20px 35px -5px rgba(0, 0, 0, 0.35)';
    if (shadow === 'none') shadowCss = 'none';

    return `
      :host {
        all: initial;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        font-size: 14px;
        line-height: 1.5;
        color: #1e293b;
        box-sizing: border-box;
      }
      *, *::before, *::after {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }

      .widget-launcher {
        position: fixed;
        bottom: 20px;
        ${posCss}
        z-index: 2147483640;
        display: inline-flex;
        align-items: center;
        gap: 10px;
        background-color: ${brandColor};
        color: ${buttonTextColor};
        padding: ${padding};
        font-size: ${fontSize};
        font-weight: 600;
        border-radius: ${radiusCss};
        box-shadow: ${shadowCss};
        cursor: pointer;
        border: none;
        outline: none;
        transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease, opacity 0.2s ease;
        user-select: none;
        -webkit-tap-highlight-color: transparent;
      }
      .widget-launcher:hover {
        transform: translateY(-2px) scale(1.02);
        box-shadow: 0 14px 28px -4px rgba(0, 0, 0, 0.25);
      }
      .widget-launcher:focus-visible {
        outline: 3px solid rgba(59, 130, 246, 0.6);
        outline-offset: 3px;
      }
      .widget-launcher:active {
        transform: translateY(0) scale(0.98);
      }
      .widget-launcher-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: ${iconSize};
        height: ${iconSize};
        flex-shrink: 0;
      }

      /* Modal Backdrop & Popup */
      .widget-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(15, 23, 42, 0.6);
        backdrop-filter: blur(4px);
        -webkit-backdrop-filter: blur(4px);
        z-index: 2147483645;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
        opacity: 0;
        visibility: hidden;
        pointer-events: none;
        transition: opacity 0.25s ease, visibility 0.25s ease;
      }
      .widget-backdrop.open {
        opacity: 1;
        visibility: visible;
        pointer-events: auto;
      }

      .widget-modal {
        background: #ffffff;
        border-radius: 20px;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.35);
        width: 100%;
        max-width: 360px;
        padding: 24px;
        position: relative;
        text-align: center;
        transform: scale(0.92) translateY(12px);
        opacity: 0;
        transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease;
        border: 1px solid rgba(226, 232, 240, 0.8);
      }
      .widget-backdrop.open .widget-modal {
        transform: scale(1) translateY(0);
        opacity: 1;
      }

      .widget-close-btn {
        position: absolute;
        top: 14px;
        right: 14px;
        background: #f1f5f9;
        border: none;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        color: #64748b;
        font-size: 18px;
        font-weight: 500;
        transition: background 0.15s ease, color 0.15s ease;
      }
      .widget-close-btn:hover {
        background: #e2e8f0;
        color: #0f172a;
      }
      .widget-close-btn:focus-visible {
        outline: 2px solid ${brandColor};
        outline-offset: 2px;
      }

      .widget-badge {
        display: inline-block;
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: ${brandColor};
        background: rgba(37, 99, 235, 0.08);
        padding: 4px 10px;
        border-radius: 9999px;
        margin-bottom: 8px;
      }

      .widget-title {
        font-size: 18px;
        font-weight: 700;
        color: #0f172a;
        margin-bottom: 6px;
        line-height: 1.3;
      }

      .widget-description {
        font-size: 13px;
        color: #64748b;
        margin-bottom: 18px;
        line-height: 1.4;
      }

      .widget-qr-box {
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 14px;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 16px;
        margin-bottom: 18px;
      }

      .widget-qr-canvas {
        display: block;
        max-width: 100%;
        height: auto;
        border-radius: 8px;
      }

      .widget-cta-button {
        display: block;
        width: 100%;
        padding: 12px;
        background: ${brandColor};
        color: ${buttonTextColor};
        border: none;
        border-radius: 10px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        text-decoration: none;
        transition: opacity 0.15s ease, transform 0.1s ease;
      }
      .widget-cta-button:hover {
        opacity: 0.92;
        transform: translateY(-1px);
      }
      .widget-cta-button:active {
        transform: translateY(0);
      }
      .widget-cta-button:focus-visible {
        outline: 2px solid ${brandColor};
        outline-offset: 2px;
      }

      .widget-footer {
        margin-top: 14px;
        font-size: 11px;
        color: #94a3b8;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 4px;
      }

      @media (max-width: 640px) {
        .widget-launcher {
          bottom: 14px;
          ${position === 'bottom-left' ? 'left: 14px;' : 'right: 14px;'}
        }
        .widget-modal {
          max-width: 320px;
          padding: 20px;
        }
      }
    `;
  }

  private render(): void {
    // Clean shadow root
    this.shadow.replaceChildren();

    // Inject styles
    const styleEl = document.createElement('style');
    styleEl.textContent = this.getShadowStyles();
    this.shadow.appendChild(styleEl);

    // Launcher button
    const launcher = document.createElement('button');
    launcher.type = 'button';
    launcher.className = 'widget-launcher';
    launcher.setAttribute('aria-haspopup', 'dialog');
    launcher.setAttribute('aria-expanded', 'false');
    launcher.setAttribute('aria-label', this.config.buttonLabel);

    const iconSpan = document.createElement('span');
    iconSpan.className = 'widget-launcher-icon';
    iconSpan.innerHTML = ICONS[this.config.buttonIcon] || ICONS.custom;
    launcher.appendChild(iconSpan);

    const textSpan = document.createElement('span');
    textSpan.textContent = this.config.buttonLabel;
    launcher.appendChild(textSpan);

    launcher.addEventListener('click', () => this.open());
    this.shadow.appendChild(launcher);

    // Backdrop
    const backdrop = document.createElement('div');
    backdrop.className = 'widget-backdrop';
    backdrop.setAttribute('aria-hidden', 'true');

    // Modal
    const modal = document.createElement('div');
    modal.className = 'widget-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'quickqr-widget-title');
    modal.setAttribute('aria-describedby', 'quickqr-widget-desc');

    // Close Button
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'widget-close-btn';
    closeBtn.setAttribute('aria-label', 'Close dialog');
    closeBtn.textContent = '×';
    closeBtn.addEventListener('click', () => this.close());
    modal.appendChild(closeBtn);

    // Badge
    const badge = document.createElement('div');
    badge.className = 'widget-badge';
    badge.textContent = this.config.type.toUpperCase();
    modal.appendChild(badge);

    // Title
    const title = document.createElement('h2');
    title.id = 'quickqr-widget-title';
    title.className = 'widget-title';
    title.textContent = this.config.popupTitle;
    modal.appendChild(title);

    // Description
    const desc = document.createElement('p');
    desc.id = 'quickqr-widget-desc';
    desc.className = 'widget-description';
    desc.textContent = this.config.popupDescription;
    modal.appendChild(desc);

    // QR Box & Canvas
    const qrBox = document.createElement('div');
    qrBox.className = 'widget-qr-box';

    const canvas = document.createElement('canvas');
    canvas.className = 'widget-qr-canvas';
    canvas.width = 200;
    canvas.height = 200;
    qrBox.appendChild(canvas);
    modal.appendChild(qrBox);

    // Render QR onto canvas safely
    try {
      const payload = this.config.payload.trim() || 'https://quickqr.art';
      QRCode.toCanvas(canvas, payload, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
        errorCorrectionLevel: 'M',
      }).catch((err) => {
        console.warn('[QuickQR Widget] QR render error:', err);
      });
    } catch (e) {
      console.warn('[QuickQR Widget] Canvas error:', e);
    }

    // Direct Action CTA (e.g., Mobile UPI or WhatsApp or URL click, or Close)
    const isSafeUrl =
      this.config.payload.startsWith('https://') ||
      this.config.payload.startsWith('http://') ||
      this.config.payload.startsWith('upi://') ||
      this.config.payload.startsWith('https://wa.me/') ||
      this.config.payload.startsWith('tel:');

    if (isSafeUrl) {
      const ctaLink = document.createElement('a');
      ctaLink.className = 'widget-cta-button';
      ctaLink.href = this.config.payload;
      ctaLink.target = '_blank';
      ctaLink.rel = 'noopener noreferrer';
      ctaLink.textContent = this.config.ctaText || 'Open directly';
      modal.appendChild(ctaLink);
    } else {
      const ctaBtn = document.createElement('button');
      ctaBtn.type = 'button';
      ctaBtn.className = 'widget-cta-button';
      ctaBtn.textContent = this.config.ctaText || 'Done';
      ctaBtn.addEventListener('click', () => this.close());
      modal.appendChild(ctaBtn);
    }

    // Footer
    const footer = document.createElement('div');
    footer.className = 'widget-footer';
    footer.innerHTML = `<span>Verified QR Code</span> &bull; <span>QuickQR</span>`;
    modal.appendChild(footer);

    backdrop.appendChild(modal);

    // Click outside modal closes
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        this.close();
      }
    });

    this.shadow.appendChild(backdrop);
  }

  public open(): void {
    if (this.isOpen) return;
    this.isOpen = true;
    this.previouslyFocusedElement = document.activeElement as HTMLElement | null;

    const launcher = this.shadow.querySelector('.widget-launcher') as HTMLElement | null;
    if (launcher) launcher.setAttribute('aria-expanded', 'true');

    const backdrop = this.shadow.querySelector('.widget-backdrop') as HTMLElement | null;
    if (backdrop) {
      backdrop.classList.add('open');
      backdrop.setAttribute('aria-hidden', 'false');
    }

    const closeBtn = this.shadow.querySelector('.widget-close-btn') as HTMLElement | null;
    if (closeBtn) closeBtn.focus();

    // Escape listener
    this.keydownListener = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        this.close();
      }
    };
    window.addEventListener('keydown', this.keydownListener);
  }

  public close(): void {
    if (!this.isOpen) return;
    this.isOpen = false;

    const launcher = this.shadow.querySelector('.widget-launcher') as HTMLElement | null;
    if (launcher) launcher.setAttribute('aria-expanded', 'false');

    const backdrop = this.shadow.querySelector('.widget-backdrop') as HTMLElement | null;
    if (backdrop) {
      backdrop.classList.remove('open');
      backdrop.setAttribute('aria-hidden', 'true');
    }

    if (this.keydownListener) {
      window.removeEventListener('keydown', this.keydownListener);
      this.keydownListener = null;
    }

    if (this.previouslyFocusedElement) {
      this.previouslyFocusedElement.focus();
    }
  }

  public destroy(): void {
    this.close();
    this.container.remove();
  }

  public updateConfig(newConfig: Partial<WidgetConfig>): void {
    const updated = { ...this.config, ...newConfig };
    this.config = sanitizeWidgetConfig(updated);
    this.render();
  }
}

// Global API
declare global {
  interface Window {
    QuickQRWidget?: {
      instance?: QuickQRWebsiteWidget;
      init: (targetContainer?: HTMLElement, customConfig?: Partial<WidgetConfig>) => QuickQRWebsiteWidget;
      loadRemote?: (publicId: string, host?: string, targetContainer?: HTMLElement) => Promise<QuickQRWebsiteWidget | null>;
    };
  }
}

window.QuickQRWidget = {
  init: (targetContainer?: HTMLElement, customConfig?: Partial<WidgetConfig>) => {
    const instance = new QuickQRWebsiteWidget(targetContainer, customConfig);
    window.QuickQRWidget!.instance = instance;
    return instance;
  },
  loadRemote: async (publicId: string, host = '', targetContainer?: HTMLElement) => {
    try {
      const endpoint = `${host}/api/widget/${encodeURIComponent(publicId.trim())}`;
      const res = await fetch(endpoint, { headers: { Accept: 'application/json' } });
      if (!res.ok) return null;
      const data = await res.json();
      if (data && data.success && data.status === 'ACTIVE' && data.config) {
        return window.QuickQRWidget!.init(targetContainer, data.config);
      }
      return null;
    } catch {
      return null;
    }
  },
};

/**
 * Auto-initialization function for standard script tags.
 * Inspects the current script for data-widget-id (Phase 2E remote persistence).
 * If present, fetches the active configuration from the remote server.
 * Otherwise falls back to Phase 1 inline data-config / data attributes.
 */
async function autoInit(): Promise<void> {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  // Only auto-init if not already initialized
  if (window.QuickQRWidget?.instance || document.getElementById('quickqr-website-widget-host')) {
    return;
  }

  const currentScript =
    (document.currentScript as HTMLScriptElement | null) ||
    document.querySelector('script[data-widget-id]') ||
    document.querySelector('script[data-widget]') ||
    document.querySelector('script[src*="widget.js"]');

  if (!currentScript) {
    window.QuickQRWidget?.init();
    return;
  }

  const widgetId =
    currentScript.getAttribute('data-widget-id') ||
    currentScript.getAttribute('data-widget');

  if (widgetId) {
    // Phase 2E: Remote persistent widget
    try {
      let host = '';
      if (currentScript.src) {
        try {
          const parsed = new URL(currentScript.src, window.location.href);
          host = parsed.origin;
        } catch {
          host = '';
        }
      }
      await window.QuickQRWidget?.loadRemote?.(widgetId, host);
    } catch {
      // Degrade silently without disrupting the host website
    }
  } else {
    // Phase 1: Static embed compatibility
    window.QuickQRWidget?.init();
  }
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      void autoInit();
    });
  } else {
    void autoInit();
  }
}
