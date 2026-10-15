import { WidgetConfig, WidgetType, WidgetOpenTarget } from './types';
import { validateDestinationUrl } from '../validation/url-safety';

export type ResolvedClickBehavior = 'direct' | 'modal';

/**
 * Determines whether a widget click should trigger direct navigation or open a QR modal.
 *
 * Rules:
 * 1. If clickBehavior is explicitly configured ('direct', 'modal', 'qr') or showQrModal is set,
 *    honor that explicit preference.
 * 2. Otherwise apply standard defaults:
 *    - 'whatsapp', 'website', 'review', 'menu' -> 'direct' (1-click direct action)
 *    - 'upi', 'custom' -> 'modal' (scannable QR modal)
 */
export function getWidgetClickBehavior(config: Partial<WidgetConfig>): ResolvedClickBehavior {
  const normType = (config.type === 'url' ? 'website' : config.type || 'upi') as WidgetType;

  // 1. Explicit configuration takes highest precedence
  if (config.clickBehavior === 'modal' || config.clickBehavior === 'qr' || config.showQrModal === true) {
    return 'modal';
  }
  if (config.clickBehavior === 'direct' || (config.showQrModal === false && normType !== 'upi' && normType !== 'custom')) {
    return 'direct';
  }

  // 2. Default behavior per widget type
  switch (normType) {
    case 'whatsapp':
    case 'website':
    case 'review':
    case 'menu':
      return 'direct';

    case 'upi':
    case 'custom':
    default:
      return 'modal';
  }
}

export interface ResolvedDestination {
  url: string;
  target: WidgetOpenTarget;
  isSafe: boolean;
  scheme: string;
}

const DANGEROUS_SCHEMES = [
  'javascript:',
  'data:',
  'vbscript:',
  'file:',
  'blob:',
  'about:',
];

/**
 * Resolves, normalizes, and validates the destination URL and navigation target for a widget.
 * Strictly prevents XSS, dangerous protocols, and open redirects to script protocols.
 */
export function resolveWidgetDestination(config: Partial<WidgetConfig>): ResolvedDestination {
  const normType = (config.type === 'url' ? 'website' : config.type || 'upi') as WidgetType;
  const rawPayload = (config.payload || '').trim();

  const target: WidgetOpenTarget =
    config.target === '_self' || config.openInNewTab === false ? '_self' : '_blank';

  if (!rawPayload) {
    return { url: '', target, isSafe: false, scheme: '' };
  }

  // Strip control characters, non-printable characters, and check dangerous schemes
  const cleanPayload = rawPayload.replace(/[\x00-\x1F\x7F]/g, '').trim();
  const lower = cleanPayload.toLowerCase();

  for (const scheme of DANGEROUS_SCHEMES) {
    if (lower.startsWith(scheme)) {
      return { url: '', target, isSafe: false, scheme: scheme.replace(':', '') };
    }
  }

  if (
    lower.startsWith('//') ||
    lower.includes('<script') ||
    lower.includes('onload=') ||
    lower.includes('onerror=') ||
    lower.includes('<') ||
    lower.includes('>')
  ) {
    return { url: '', target, isSafe: false, scheme: '' };
  }

  // WhatsApp Chat Resolution
  if (normType === 'whatsapp') {
    // If already a valid WhatsApp web or universal URL
    if (
      lower.startsWith('https://wa.me/') ||
      lower.startsWith('http://wa.me/') ||
      lower.startsWith('https://api.whatsapp.com/') ||
      lower.startsWith('https://web.whatsapp.com/')
    ) {
      return { url: cleanPayload, target, isSafe: true, scheme: 'https' };
    }

    // Supported WhatsApp deep link
    if (lower.startsWith('whatsapp://')) {
      return { url: cleanPayload, target, isSafe: true, scheme: 'whatsapp' };
    }

    // If it's a generic http/https URL pointing to a WhatsApp domain
    if (lower.startsWith('https://') || lower.startsWith('http://')) {
      return { url: cleanPayload, target, isSafe: true, scheme: 'https' };
    }

    // If it's a phone number (e.g. 919876543210 or +91 98765 43210), normalize to https://wa.me/<digits>
    const digitsOnly = cleanPayload.replace(/\D/g, '');
    if (digitsOnly.length >= 7) {
      const explicitMessage = typeof (config as Record<string, unknown>).message === 'string'
        ? ((config as Record<string, unknown>).message as string).trim()
        : '';
      const textQuery = explicitMessage ? `?text=${encodeURIComponent(explicitMessage)}` : '';
      return { url: `https://wa.me/${digitsOnly}${textQuery}`, target, isSafe: true, scheme: 'https' };
    }

    return { url: cleanPayload, target, isSafe: false, scheme: '' };
  }

  // Website Link / Google Review / Digital Menu Resolution
  if (normType === 'website' || normType === 'review' || normType === 'menu') {
    let finalUrl = cleanPayload;
    if (!finalUrl.match(/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//)) {
      finalUrl = `https://${finalUrl}`;
    }

    const finalLower = finalUrl.toLowerCase();
    if (finalLower.startsWith('http://') || finalLower.startsWith('https://')) {
      const check = validateDestinationUrl(finalUrl);
      if (check.isValid && check.sanitizedUrl) {
        return {
          url: check.sanitizedUrl,
          target,
          isSafe: true,
          scheme: finalLower.split(':')[0],
        };
      }
      return {
        url: finalUrl,
        target,
        isSafe: false,
        scheme: finalLower.split(':')[0],
      };
    }

    return { url: finalUrl, target, isSafe: false, scheme: '' };
  }

  // UPI Payment resolution
  if (normType === 'upi') {
    if (lower.startsWith('upi://')) {
      return { url: cleanPayload, target, isSafe: true, scheme: 'upi' };
    }
    return { url: cleanPayload, target, isSafe: false, scheme: 'upi' };
  }

  // Custom QR / Generic
  const finalUrl = cleanPayload;
  if (lower.startsWith('http://') || lower.startsWith('https://')) {
    const check = validateDestinationUrl(finalUrl);
    return {
      url: check.isValid && check.sanitizedUrl ? check.sanitizedUrl : finalUrl,
      target,
      isSafe: check.isValid,
      scheme: lower.split(':')[0],
    };
  }

  if (
    lower.startsWith('tel:') ||
    lower.startsWith('mailto:') ||
    lower.startsWith('upi://') ||
    lower.startsWith('whatsapp://')
  ) {
    return { url: cleanPayload, target, isSafe: true, scheme: lower.split(':')[0] };
  }

  return { url: finalUrl, target, isSafe: false, scheme: '' };
}

/**
 * Safely navigates the current browsing context or opens a new tab.
 * Ensures:
 * 1. Safe target handling (rel="noopener noreferrer" for new tabs).
 * 2. Strict rejection of dangerous schemes (javascript:, data:, vbscript:, etc.).
 * 3. Graceful fallback on failures without throwing unhandled exceptions.
 */
export function safeNavigate(url: string, target: WidgetOpenTarget = '_blank'): boolean {
  if (typeof window === 'undefined') return false;

  const trimmed = (url || '').trim();
  if (!trimmed) return false;

  const lower = trimmed.replace(/[\x00-\x1F\x7F\s]/g, '').toLowerCase();

  for (const scheme of DANGEROUS_SCHEMES) {
    if (lower.startsWith(scheme)) {
      console.warn('[QuickQR Widget] Blocked unsafe navigation to dangerous scheme:', scheme);
      return false;
    }
  }

  if (
    lower.startsWith('//') ||
    lower.includes('<') ||
    lower.includes('>') ||
    lower.includes('onload=') ||
    lower.includes('onerror=')
  ) {
    console.warn('[QuickQR Widget] Blocked potentially malicious navigation:', trimmed);
    return false;
  }

  const isAllowedScheme =
    lower.startsWith('https://') ||
    lower.startsWith('http://') ||
    lower.startsWith('whatsapp://') ||
    lower.startsWith('upi://') ||
    lower.startsWith('tel:') ||
    lower.startsWith('mailto:');

  if (!isAllowedScheme) {
    console.warn('[QuickQR Widget] Blocked navigation with unsupported scheme:', trimmed);
    return false;
  }

  try {
    if (target === '_self') {
      window.location.assign(trimmed);
      return true;
    }

    // For new tab (_blank), use a clean invisible anchor element with noopener and noreferrer
    // This provides the safest behavior across desktop and mobile and prevents tabnabbing
    if (typeof document !== 'undefined') {
      const link = document.createElement('a');
      link.href = trimmed;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        link.remove();
      }, 150);
      return true;
    }

    window.open(trimmed, '_blank', 'noopener,noreferrer');
    return true;
  } catch (err) {
    console.warn('[QuickQR Widget] Safe navigation failed:', err);
    return false;
  }
}
