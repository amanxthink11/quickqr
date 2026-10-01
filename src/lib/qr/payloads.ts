import {
  UPIPayloadInput,
  WhatsAppPayloadInput,
  URLPayloadInput,
  WiFiPayloadInput,
  VCardPayloadInput,
  PhonePayloadInput,
  EmailPayloadInput,
  TextPayloadInput,
  MapsPayloadInput,
  GoogleReviewPayloadInput,
  PDFPayloadInput,
  MenuPayloadInput,
  QRType,
  QRPayloadInputMap,
} from './types';

/**
 * Escapes special characters for Wi-Fi QR strings (ZXing standard)
 * Special characters \ ; : , " must be escaped, and newlines must be stripped.
 */
function escapeWiFiString(str: string): string {
  if (!str) return '';
  return str
    .replace(/[\r\n]/g, '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/:/g, '\\:')
    .replace(/,/g, '\\,')
    .replace(/"/g, '\\"');
}

/**
 * Sanitizes and formats phone numbers by preserving at most one leading '+'
 * and stripping all non-digit characters.
 */
export function sanitizePhoneNumber(phone: string): string {
  if (!phone) return '';
  const trimmed = phone.trim();
  const hasLeadingPlus = trimmed.startsWith('+');
  const digits = trimmed.replace(/[^\d]/g, '');
  if (!digits) return '';
  return hasLeadingPlus ? `+${digits}` : digits;
}

/**
 * Escapes special characters in vCard 3.0 text values according to RFC 2426 section 2.4.2
 * Backslashes, semicolons, and commas must be escaped with a backslash.
 * Line breaks must be encoded as literal \n.
 */
function escapeVCardValue(str: string): string {
  if (!str) return '';
  return str
    .trim()
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r\n|\r|\n/g, '\\n');
}

/**
 * Generates a standard UPI payment intent URI
 * e.g. upi://pay?pa=merchant@upi&pn=Store%20Name&am=150.00&cu=INR&tn=Order%20101
 * Uses %20 for spaces instead of '+' to ensure maximum compatibility with Indian UPI apps.
 */
export function buildUPIPayload(input: UPIPayloadInput): string {
  const vpa = (input.vpa || '').replace(/[\r\n]/g, '').trim();
  const payeeName = (input.payeeName || '').replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
  const currency = (input.currency || 'INR').replace(/[\r\n]/g, '').trim().toUpperCase();

  const params = new URLSearchParams();
  params.set('pa', vpa);
  params.set('pn', payeeName);
  params.set('cu', currency);

  if (input.amount) {
    const parsedAmount = parseFloat(input.amount);
    if (!isNaN(parsedAmount) && parsedAmount > 0) {
      params.set('am', parsedAmount.toFixed(2));
    }
  }

  if (input.transactionNote && input.transactionNote.trim()) {
    params.set('tn', input.transactionNote.replace(/[\r\n]/g, ' ').trim());
  }

  if (input.transactionRef && input.transactionRef.trim()) {
    params.set('tr', input.transactionRef.replace(/[\r\n]/g, '').trim());
  }

  if (input.merchantCode && input.merchantCode.trim()) {
    params.set('mc', input.merchantCode.replace(/[\r\n]/g, '').trim());
  }

  // UPI applications require RFC 3986 percent encoding (%20) rather than application/x-www-form-urlencoded (+)
  const queryString = params.toString().replace(/\+/g, '%20');
  return `upi://pay?${queryString}`;
}

/**
 * Generates WhatsApp click-to-chat URL
 * e.g. https://wa.me/919876543210?text=Hello%20there
 * Handles numbers that already include the country code to prevent double-prefixing.
 */
export function buildWhatsAppPayload(input: WhatsAppPayloadInput): string {
  const cleanCode = (input.countryCode || '').replace(/[^\d]/g, '');
  const cleanNumber = (input.phoneNumber || '').replace(/[^\d]/g, '');

  let fullPhone = cleanNumber;
  if (cleanCode) {
    if (cleanNumber.startsWith(cleanCode) && cleanNumber.length > cleanCode.length + 6) {
      fullPhone = cleanNumber;
    } else {
      fullPhone = `${cleanCode}${cleanNumber}`;
    }
  }

  let url = `https://wa.me/${fullPhone}`;
  if (input.message && input.message.trim()) {
    url += `?text=${encodeURIComponent(input.message.trim())}`;
  }
  return url;
}

/**
 * Normalizes and formats URL payload. Prepends https:// if protocol is missing.
 */
export function buildURLPayload(input: URLPayloadInput): string {
  let url = (input.url || '').trim();
  if (!url) return '';
  if (!url.match(/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//)) {
    url = `https://${url}`;
  }
  return url;
}

/**
 * Generates standard ZXing Wi-Fi payload
 * e.g. WIFI:S:MyNetwork;T:WPA;P:secret123;H:false;;
 * Omit password field when authType is 'nopass'.
 */
export function buildWiFiPayload(input: WiFiPayloadInput): string {
  const ssid = escapeWiFiString((input.ssid || '').trim());
  const auth = input.authType || 'WPA';
  const hidden = input.hidden ? 'true' : 'false';

  if (auth === 'nopass') {
    return `WIFI:S:${ssid};T:nopass;H:${hidden};;`;
  }

  const password = escapeWiFiString(input.password || '');
  return `WIFI:S:${ssid};T:${auth};P:${password};H:${hidden};;`;
}

/**
 * Generates RFC 2426 / RFC 6350 vCard 3.0 standard payload with escaped special characters
 * and standard CRLF line breaks.
 */
export function buildVCardPayload(input: VCardPayloadInput): string {
  const lines: string[] = ['BEGIN:VCARD', 'VERSION:3.0'];

  const fn = [input.firstName?.trim(), input.lastName?.trim()].filter(Boolean).join(' ');
  const escapedLast = escapeVCardValue(input.lastName || '');
  const escapedFirst = escapeVCardValue(input.firstName || '');
  lines.push(`N:${escapedLast};${escapedFirst};;;`);
  lines.push(`FN:${escapeVCardValue(fn || 'Contact')}`);

  if (input.organization?.trim()) {
    lines.push(`ORG:${escapeVCardValue(input.organization)}`);
  }
  if (input.title?.trim()) {
    lines.push(`TITLE:${escapeVCardValue(input.title)}`);
  }
  if (input.phone?.trim()) {
    lines.push(`TEL;TYPE=WORK,VOICE:${sanitizePhoneNumber(input.phone)}`);
  }
  if (input.mobile?.trim()) {
    lines.push(`TEL;TYPE=CELL,VOICE:${sanitizePhoneNumber(input.mobile)}`);
  }
  if (input.email?.trim()) {
    const cleanEmail = input.email.replace(/[\r\n;]/g, '').trim();
    lines.push(`EMAIL;TYPE=PREF,INTERNET:${cleanEmail}`);
  }
  if (input.website?.trim()) {
    let site = input.website.replace(/[\r\n]/g, '').trim();
    if (!site.match(/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//)) {
      site = `https://${site}`;
    }
    lines.push(`URL:${site}`);
  }

  const street = escapeVCardValue(input.street || '');
  const city = escapeVCardValue(input.city || '');
  const state = escapeVCardValue(input.state || '');
  const zip = escapeVCardValue(input.zipCode || '');
  const country = escapeVCardValue(input.country || '');

  if (street || city || state || zip || country) {
    lines.push(`ADR;TYPE=WORK:;;${street};${city};${state};${zip};${country}`);
  }

  lines.push('END:VCARD');
  // RFC 2426 specifies CRLF line terminators
  return lines.join('\r\n');
}

/**
 * Generates tel: URI with sanitized phone number
 */
export function buildPhonePayload(input: PhonePayloadInput): string {
  const clean = sanitizePhoneNumber(input.phoneNumber || '');
  return `tel:${clean}`;
}

/**
 * Generates mailto: URI with percent-encoded query parameters and sanitized recipient
 */
export function buildEmailPayload(input: EmailPayloadInput): string {
  const email = (input.email || '').replace(/[\r\n]/g, '').trim();
  const params = new URLSearchParams();
  if (input.subject?.trim()) {
    params.set('subject', input.subject.trim());
  }
  if (input.body?.trim()) {
    params.set('body', input.body.trim());
  }
  // Use %20 for spaces instead of + for email client compatibility
  const query = params.toString().replace(/\+/g, '%20');
  return query ? `mailto:${email}?${query}` : `mailto:${email}`;
}

/**
 * Generates simple text payload
 */
export function buildTextPayload(input: TextPayloadInput): string {
  return input.text || '';
}

/**
 * Generates Google Maps search or coordinates link
 */
export function buildMapsPayload(input: MapsPayloadInput): string {
  const query = (input.queryOrUrl || '').replace(/[\r\n]/g, '').trim();
  if (!query) return '';
  if (query.startsWith('http://') || query.startsWith('https://')) {
    return query;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

/**
 * Generates Google Review link
 */
export function buildGoogleReviewPayload(input: GoogleReviewPayloadInput): string {
  return buildURLPayload({ url: input.reviewUrl });
}

/**
 * Generates PDF link payload
 */
export function buildPDFPayload(input: PDFPayloadInput): string {
  return buildURLPayload({ url: input.pdfUrl });
}

/**
 * Generates Digital Menu link payload
 */
export function buildMenuPayload(input: MenuPayloadInput): string {
  return buildURLPayload({ url: input.menuUrl });
}

/**
 * Master dispatcher for building QR payloads
 */
export function buildQRPayload<T extends QRType>(
  type: T,
  input: QRPayloadInputMap[T]
): string {
  switch (type) {
    case 'upi':
      return buildUPIPayload(input as UPIPayloadInput);
    case 'whatsapp':
      return buildWhatsAppPayload(input as WhatsAppPayloadInput);
    case 'url':
      return buildURLPayload(input as URLPayloadInput);
    case 'wifi':
      return buildWiFiPayload(input as WiFiPayloadInput);
    case 'vcard':
      return buildVCardPayload(input as VCardPayloadInput);
    case 'phone':
      return buildPhonePayload(input as PhonePayloadInput);
    case 'email':
      return buildEmailPayload(input as EmailPayloadInput);
    case 'text':
      return buildTextPayload(input as TextPayloadInput);
    case 'maps':
      return buildMapsPayload(input as MapsPayloadInput);
    case 'review':
      return buildGoogleReviewPayload(input as GoogleReviewPayloadInput);
    case 'pdf':
      return buildPDFPayload(input as PDFPayloadInput);
    case 'menu':
      return buildMenuPayload(input as MenuPayloadInput);
    default:
      return '';
  }
}
