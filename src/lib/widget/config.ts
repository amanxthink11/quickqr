import { WidgetConfig, WidgetType, WidgetValidationResult } from './types';
import { isValidHexColor } from '../qr/validation';

/**
 * Returns default widget configurations tailored to each purpose.
 */
export function getDefaultWidgetConfig(type: WidgetType): WidgetConfig {
  const normType = type === 'url' ? 'website' : type;

  switch (normType) {
    case 'upi':
      return {
        type: 'upi',
        payload: 'upi://pay?pa=merchant@okhdfcbank&pn=Store%20Checkout&cu=INR',
        buttonLabel: 'Scan to Pay',
        buttonText: 'Scan to Pay',
        buttonIcon: 'upi',
        brandColor: '#16a34a', // Emerald Green
        buttonTextColor: '#FFFFFF',
        position: 'bottom-right',
        size: 'medium',
        borderRadius: 'full',
        shadow: 'medium',
        popupTitle: 'Pay with Any UPI App',
        modalTitle: 'Pay with Any UPI App',
        popupDescription: 'Scan this QR code with Google Pay, PhonePe, Paytm, CRED or BHIM to pay instantly.',
        modalDescription: 'Scan this QR code with Google Pay, PhonePe, Paytm, CRED or BHIM to pay instantly.',
        ctaText: 'Zero Surcharge • Direct Bank Payment',
        helperText: 'Zero Surcharge • Direct Bank Payment',
        mobileBehavior: 'floating',
      };

    case 'whatsapp':
      return {
        type: 'whatsapp',
        payload: 'https://wa.me/919876543210?text=Hello%2C%20I%20have%20an%20inquiry',
        buttonLabel: 'Chat on WhatsApp',
        buttonText: 'Chat on WhatsApp',
        buttonIcon: 'whatsapp',
        brandColor: '#25D366', // WhatsApp Green
        buttonTextColor: '#FFFFFF',
        position: 'bottom-right',
        size: 'medium',
        borderRadius: 'full',
        shadow: 'medium',
        popupTitle: 'Chat on WhatsApp',
        modalTitle: 'Chat on WhatsApp',
        popupDescription: 'Scan with your smartphone camera to connect directly with our support team.',
        modalDescription: 'Scan with your smartphone camera to connect directly with our support team.',
        ctaText: 'Typical reply: within a few minutes',
        helperText: 'Typical reply: within a few minutes',
        mobileBehavior: 'floating',
      };

    case 'review':
      return {
        type: 'review',
        payload: 'https://g.page/r/your-google-place-id/review',
        buttonLabel: 'Review Us on Google',
        buttonText: 'Review Us on Google',
        buttonIcon: 'review',
        brandColor: '#d97706', // Amber / Gold
        buttonTextColor: '#FFFFFF',
        position: 'bottom-right',
        size: 'medium',
        borderRadius: 'full',
        shadow: 'medium',
        popupTitle: 'Leave a Google Review',
        modalTitle: 'Leave a Google Review',
        popupDescription: 'We value your feedback! Point your phone camera to review our business on Google.',
        modalDescription: 'We value your feedback! Point your phone camera to review our business on Google.',
        ctaText: 'Verified Google Business Profile',
        helperText: 'Verified Google Business Profile',
        mobileBehavior: 'floating',
      };

    case 'menu':
      return {
        type: 'menu',
        payload: 'https://quickqr.art/menu',
        buttonLabel: 'View Digital Menu',
        buttonText: 'View Digital Menu',
        buttonIcon: 'menu',
        brandColor: '#ea580c', // Orange
        buttonTextColor: '#FFFFFF',
        position: 'bottom-right',
        size: 'medium',
        borderRadius: 'full',
        shadow: 'medium',
        popupTitle: 'Our Digital Menu',
        modalTitle: 'Our Digital Menu',
        popupDescription: 'Browse our full food, drinks, and specials menu contactless on your mobile device.',
        modalDescription: 'Browse our full food, drinks, and specials menu contactless on your mobile device.',
        ctaText: 'Updated daily • Fresh preparations',
        helperText: 'Updated daily • Fresh preparations',
        mobileBehavior: 'floating',
      };

    case 'website':
      return {
        type: 'website',
        payload: 'https://quickqr.art',
        buttonLabel: 'Open on Mobile',
        buttonText: 'Open on Mobile',
        buttonIcon: 'website',
        brandColor: '#2563eb', // Blue
        buttonTextColor: '#FFFFFF',
        position: 'bottom-right',
        size: 'medium',
        borderRadius: 'full',
        shadow: 'medium',
        popupTitle: 'Open on Your Smartphone',
        modalTitle: 'Open on Your Smartphone',
        popupDescription: 'Scan this QR code to quickly transfer your session or link to your mobile device.',
        modalDescription: 'Scan this QR code to quickly transfer your session or link to your mobile device.',
        ctaText: 'Seamless mobile browsing',
        helperText: 'Seamless mobile browsing',
        mobileBehavior: 'floating',
      };

    case 'custom':
    default:
      return {
        type: 'custom',
        payload: 'https://quickqr.art',
        buttonLabel: 'Scan QR Code',
        buttonText: 'Scan QR Code',
        buttonIcon: 'custom',
        brandColor: '#0f172a', // Slate 900
        buttonTextColor: '#FFFFFF',
        position: 'bottom-right',
        size: 'medium',
        borderRadius: 'full',
        shadow: 'medium',
        popupTitle: 'Scan Business QR Code',
        modalTitle: 'Scan Business QR Code',
        popupDescription: 'Point your camera to scan and launch this business action.',
        modalDescription: 'Point your camera to scan and launch this business action.',
        ctaText: 'Direct instant access',
        helperText: 'Direct instant access',
        mobileBehavior: 'floating',
      };
  }
}

/**
 * Validates widget configuration against malicious inputs, ensuring safe values.
 */
export function validateWidgetConfig(config: Partial<WidgetConfig>): WidgetValidationResult {
  const errors: string[] = [];

  if (!config) {
    return { isValid: false, errors: ['Widget configuration is missing.'] };
  }

  const validTypes = ['upi', 'whatsapp', 'review', 'menu', 'website', 'url', 'custom'];
  if (!config.type || !validTypes.includes(config.type)) {
    errors.push(`Invalid widget type. Must be one of: ${validTypes.join(', ')}.`);
  }

  if (!config.payload || typeof config.payload !== 'string' || !config.payload.trim()) {
    errors.push('Widget destination payload is required.');
  } else {
    const raw = config.payload.trim().toLowerCase();
    if (
      raw.startsWith('javascript:') ||
      raw.startsWith('vbscript:') ||
      raw.startsWith('data:text/html') ||
      raw.includes('<script') ||
      raw.includes('onload=') ||
      raw.includes('onerror=')
    ) {
      errors.push('Destructive script protocols or HTML tags are strictly blocked in payloads.');
    }
  }

  if (config.brandColor && !isValidHexColor(config.brandColor)) {
    errors.push('Brand color must be a valid 6-character hex code (e.g. #2563EB)');
  }

  if (config.buttonTextColor && !isValidHexColor(config.buttonTextColor)) {
    errors.push('Button text color must be a valid hex color code (e.g. #FFFFFF).');
  }

  const validPositions = ['bottom-right', 'bottom-left'];
  if (config.position && !validPositions.includes(config.position)) {
    errors.push(`Invalid widget position: ${config.position}`);
  }

  const validSizes = ['small', 'medium', 'large'];
  if (config.size && !validSizes.includes(config.size)) {
    errors.push(`Invalid widget size: ${config.size}`);
  }

  const validRadii = ['full', 'rounded', 'square'];
  if (config.borderRadius && !validRadii.includes(config.borderRadius)) {
    errors.push(`Invalid border radius: ${config.borderRadius}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Strips HTML tags, script payloads, and control characters from text strings.
 */
function cleanText(text?: string, fallback = ''): string {
  if (!text || typeof text !== 'string') return fallback;
  return (
    text
      .replace(/<[^>]*>?/gm, '')
      .replace(/javascript:/gi, '')
      .replace(/alert\([^)]*\)/gi, '')
      .replace(/[<>]/g, '')
      .replace(/[\x00-\x1F\x7F]/g, '')
      .trim()
      .slice(0, 150) || fallback
  );
}

/**
 * Sanitizes all widget configuration fields for safe DOM rendering and embedding.
 */
export function sanitizeWidgetConfig(config: Partial<WidgetConfig>): WidgetConfig {
  const fallback = getDefaultWidgetConfig(config.type || 'upi');

  const brandColor = isValidHexColor(config.brandColor ?? '') ? config.brandColor! : fallback.brandColor;
  const buttonTextColor = isValidHexColor(config.buttonTextColor ?? '') ? config.buttonTextColor! : fallback.buttonTextColor;

  let rawPayload = (config.payload || fallback.payload).replace(/[\x00-\x1F\x7F]/g, '').trim();
  const lowerPayload = rawPayload.toLowerCase();
  if (
    lowerPayload.startsWith('javascript:') ||
    lowerPayload.startsWith('vbscript:') ||
    lowerPayload.startsWith('data:text/html') ||
    lowerPayload.includes('<script') ||
    lowerPayload.includes('onerror=') ||
    lowerPayload.includes('onload=')
  ) {
    rawPayload = 'https://quickqr.art';
  }

  const buttonLabel = cleanText(config.buttonLabel || config.buttonText, fallback.buttonLabel);
  const popupTitle = cleanText(config.popupTitle || config.modalTitle, fallback.popupTitle);
  const popupDescription = cleanText(config.popupDescription || config.modalDescription, fallback.popupDescription);
  const ctaText = cleanText(config.ctaText || config.helperText, fallback.ctaText);

  const type = (['upi', 'whatsapp', 'review', 'menu', 'website', 'url', 'custom'].includes(config.type as string)
    ? config.type
    : fallback.type) as WidgetType;

  const position = (['bottom-right', 'bottom-left'].includes(config.position as string)
    ? config.position
    : fallback.position) as 'bottom-right' | 'bottom-left';

  const size = (['small', 'medium', 'large'].includes(config.size as string)
    ? config.size
    : fallback.size) as 'small' | 'medium' | 'large';

  const borderRadius = (['full', 'rounded', 'square'].includes(config.borderRadius as string)
    ? config.borderRadius
    : fallback.borderRadius) as 'full' | 'rounded' | 'square';

  const shadow = (['soft', 'medium', 'strong', 'none', 'subtle', 'elevated'].includes(config.shadow as string)
    ? config.shadow
    : fallback.shadow) as WidgetConfig['shadow'];

  return {
    type,
    payload: rawPayload,
    buttonLabel,
    buttonText: buttonLabel,
    buttonIcon: config.buttonIcon || fallback.buttonIcon,
    brandColor,
    buttonTextColor,
    position,
    size,
    borderRadius,
    shadow,
    popupTitle,
    modalTitle: popupTitle,
    popupDescription,
    modalDescription: popupDescription,
    ctaText,
    helperText: ctaText,
    mobileBehavior: config.mobileBehavior || 'floating',
    qrDataUrl: config.qrDataUrl,
  };
}

/**
 * Encodes a widget configuration into a base64 string for URL-safe transport.
 */
export function encodeWidgetConfig(config: WidgetConfig): string {
  const sanitized = sanitizeWidgetConfig(config);
  try {
    const jsonStr = JSON.stringify(sanitized);
    if (typeof window !== 'undefined' && typeof btoa === 'function') {
      return btoa(encodeURIComponent(jsonStr));
    }
    return Buffer.from(encodeURIComponent(jsonStr)).toString('base64');
  } catch {
    return '';
  }
}

/**
 * Decodes a base64 string back into a sanitized WidgetConfig.
 */
export function decodeWidgetConfig(encoded: string): WidgetConfig | null {
  if (!encoded || typeof encoded !== 'string') return null;
  try {
    let jsonStr = '';
    if (typeof window !== 'undefined' && typeof atob === 'function') {
      jsonStr = decodeURIComponent(atob(encoded));
    } else {
      jsonStr = decodeURIComponent(Buffer.from(encoded, 'base64').toString('utf-8'));
    }
    const parsed = JSON.parse(jsonStr);
    return sanitizeWidgetConfig(parsed);
  } catch {
    return null;
  }
}

/**
 * Generates copy-paste embed code snippet.
 */
export function generateEmbedCode(config: WidgetConfig, host = 'https://quickqr.art'): string {
  const encoded = encodeWidgetConfig(config);
  const cleanLabel = (config.buttonLabel || 'Scan QR').replace(/"/g, '&quot;');
  return `<!-- QuickQR Website QR Widget -->
<script
  src="${host}/widget.js"
  data-type="${config.type}"
  data-label="${cleanLabel}"
  data-color="${config.brandColor}"
  data-config="${encoded}"
  async
></script>`;
}

/**
 * Generates stable remote embed code snippet referencing a persistent publicId.
 * Configuration updates in QuickQR dashboard reflect remotely without changing this script tag.
 */
export function generateRemoteEmbedCode(publicId: string, host = 'https://quickqr.art'): string {
  const safeId = publicId.replace(/[^a-zA-Z0-9_-]/g, '');
  return `<!-- QuickQR Website QR Widget (Remote Configured) -->
<script
  src="${host}/widget.js"
  data-widget-id="${safeId}"
  async
></script>`;
}
