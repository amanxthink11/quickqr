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
 */
function escapeWiFiString(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/:/g, '\\:')
    .replace(/,/g, '\\,')
    .replace(/"/g, '\\"');
}

/**
 * Sanitizes and formats phone numbers by stripping whitespace, dashes, parens
 */
export function sanitizePhoneNumber(phone: string): string {
  return phone.replace(/[^\d+]/g, '');
}

/**
 * Generates an NPCI-compliant UPI payment intent URI
 * e.g. upi://pay?pa=merchant@upi&pn=Store%20Name&am=150.00&cu=INR&tn=Order%20101
 */
export function buildUPIPayload(input: UPIPayloadInput): string {
  const vpa = (input.vpa || '').trim();
  const payeeName = (input.payeeName || '').trim();
  const currency = (input.currency || 'INR').trim().toUpperCase();

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
    params.set('tn', input.transactionNote.trim());
  }

  if (input.transactionRef && input.transactionRef.trim()) {
    params.set('tr', input.transactionRef.trim());
  }

  if (input.merchantCode && input.merchantCode.trim()) {
    params.set('mc', input.merchantCode.trim());
  }

  return `upi://pay?${params.toString()}`;
}

/**
 * Generates WhatsApp click-to-chat URL
 * e.g. https://wa.me/919876543210?text=Hello%20there
 */
export function buildWhatsAppPayload(input: WhatsAppPayloadInput): string {
  const cleanCode = (input.countryCode || '').replace(/[^\d]/g, '');
  const cleanNumber = (input.phoneNumber || '').replace(/[^\d]/g, '');
  const fullPhone = `${cleanCode}${cleanNumber}`;

  let url = `https://wa.me/${fullPhone}`;
  if (input.message && input.message.trim()) {
    url += `?text=${encodeURIComponent(input.message.trim())}`;
  }
  return url;
}

/**
 * Normalizes and formats URL payload
 */
export function buildURLPayload(input: URLPayloadInput): string {
  let url = (input.url || '').trim();
  if (url && !url.match(/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//)) {
    url = `https://${url}`;
  }
  return url;
}

/**
 * Generates standard ZXing Wi-Fi payload
 * e.g. WIFI:S:MyNetwork;T:WPA;P:secret123;H:false;;
 */
export function buildWiFiPayload(input: WiFiPayloadInput): string {
  const ssid = escapeWiFiString((input.ssid || '').trim());
  const auth = input.authType || 'WPA';
  const password = auth === 'nopass' ? '' : escapeWiFiString(input.password || '');
  const hidden = input.hidden ? 'true' : 'false';

  return `WIFI:S:${ssid};T:${auth};P:${password};H:${hidden};;`;
}

/**
 * Generates RFC 6350 / vCard 3.0 standard payload
 */
export function buildVCardPayload(input: VCardPayloadInput): string {
  const lines: string[] = ['BEGIN:VCARD', 'VERSION:3.0'];

  const fn = [input.firstName?.trim(), input.lastName?.trim()].filter(Boolean).join(' ');
  lines.push(`N:${input.lastName?.trim() || ''};${input.firstName?.trim() || ''};;;`);
  lines.push(`FN:${fn || 'Contact'}`);

  if (input.organization?.trim()) {
    lines.push(`ORG:${input.organization.trim()}`);
  }
  if (input.title?.trim()) {
    lines.push(`TITLE:${input.title.trim()}`);
  }
  if (input.phone?.trim()) {
    lines.push(`TEL;TYPE=WORK,VOICE:${input.phone.trim()}`);
  }
  if (input.mobile?.trim()) {
    lines.push(`TEL;TYPE=CELL,VOICE:${input.mobile.trim()}`);
  }
  if (input.email?.trim()) {
    lines.push(`EMAIL;TYPE=PREF,INTERNET:${input.email.trim()}`);
  }
  if (input.website?.trim()) {
    let site = input.website.trim();
    if (!site.match(/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//)) {
      site = `https://${site}`;
    }
    lines.push(`URL:${site}`);
  }

  const street = input.street?.trim() || '';
  const city = input.city?.trim() || '';
  const state = input.state?.trim() || '';
  const zip = input.zipCode?.trim() || '';
  const country = input.country?.trim() || '';

  if (street || city || state || zip || country) {
    lines.push(`ADR;TYPE=WORK:;;${street};${city};${state};${zip};${country}`);
  }

  lines.push('END:VCARD');
  return lines.join('\n');
}

/**
 * Generates tel: URI
 */
export function buildPhonePayload(input: PhonePayloadInput): string {
  const clean = sanitizePhoneNumber(input.phoneNumber || '');
  return `tel:${clean}`;
}

/**
 * Generates mailto: URI
 */
export function buildEmailPayload(input: EmailPayloadInput): string {
  const email = (input.email || '').trim();
  const params = new URLSearchParams();
  if (input.subject?.trim()) {
    params.set('subject', input.subject.trim());
  }
  if (input.body?.trim()) {
    params.set('body', input.body.trim());
  }
  const query = params.toString();
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
  const query = (input.queryOrUrl || '').trim();
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
