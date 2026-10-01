import {
  QRType,
  QRPayloadInputMap,
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
  QRValidationResult,
  QRCustomization,
  QRReadabilityResult,
} from './types';

/**
 * Validates that a hex color string is safe and valid (#RGB, #RRGGBB, #RRGGBBAA, or 'transparent')
 * Prevents CSS / SVG attribute injection attacks.
 */
export function isValidHexColor(color: string): boolean {
  if (!color || typeof color !== 'string') return false;
  const trimmed = color.trim().toLowerCase();
  if (trimmed === 'transparent') return true;
  return /^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/.test(trimmed);
}

/**
 * Validates that a URL uses safe protocols (http, https) and prevents XSS,
 * dangerous URI schemes (javascript:, data:, vbscript:, file:, blob:),
 * protocol-relative URLs (//), and script/event-handler injection.
 */
export function isSafeURL(url: string): boolean {
  if (!url || typeof url !== 'string') return false;

  // Block control characters, null bytes, and non-printable characters
  if (/[\x00-\x1F\x7F]/.test(url)) {
    return false;
  }

  const trimmed = url.trim();

  // Strip control characters, spaces, and tabs for protocol inspection
  const sanitizedProtocolCheck = trimmed.replace(/[\x00-\x1F\x7F\s]/g, '').toLowerCase();

  // Block dangerous URI schemes
  if (
    sanitizedProtocolCheck.startsWith('javascript:') ||
    sanitizedProtocolCheck.startsWith('vbscript:') ||
    sanitizedProtocolCheck.startsWith('data:') ||
    sanitizedProtocolCheck.startsWith('file:') ||
    sanitizedProtocolCheck.startsWith('blob:') ||
    sanitizedProtocolCheck.startsWith('about:')
  ) {
    return false;
  }

  // Block protocol-relative URLs (e.g. //attacker.com/malicious)
  if (trimmed.startsWith('//')) {
    return false;
  }

  // Block embedded HTML tags or event handler injection
  const lowerTrimmed = trimmed.toLowerCase();
  if (
    lowerTrimmed.includes('<') ||
    lowerTrimmed.includes('>') ||
    lowerTrimmed.includes('javascript:') ||
    lowerTrimmed.includes('vbscript:') ||
    lowerTrimmed.includes('onload=') ||
    lowerTrimmed.includes('onerror=') ||
    lowerTrimmed.includes('onclick=') ||
    lowerTrimmed.includes('onmouseover=') ||
    lowerTrimmed.includes('onfocus=') ||
    lowerTrimmed.includes('eval(')
  ) {
    return false;
  }

  // Validate standard web URL structure
  try {
    const parsed = new URL(trimmed.match(/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//) ? trimmed : `https://${trimmed}`);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }
    // Hostname must be present and not contain suspicious characters
    if (!parsed.hostname || parsed.hostname.includes(' ')) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates a UPI ID / VPA (Virtual Payment Address)
 * Must follow username@psp format, e.g. merchant@icici, mobile@okhdfcbank
 */
export function isValidUPIVpa(vpa: string): boolean {
  if (!vpa) return false;
  const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
  return upiRegex.test(vpa.trim());
}

/**
 * Validates an email address format
 */
export function isValidEmail(email: string): boolean {
  if (!email) return false;
  const emailRegex = /^[^\s@\r\n]+@[^\s@\r\n]+\.[^\s@\r\n]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Calculates relative luminance for WCAG contrast calculation
 */
function getRelativeLuminance(hex: string): number {
  if (hex === 'transparent') return 1.0;
  let clean = hex.replace('#', '');
  if (clean.length === 3 || clean.length === 4) {
    clean = clean
      .substring(0, 3)
      .split('')
      .map((c) => c + c)
      .join('');
  }
  if (clean.length < 6) return 0.5;

  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;

  const sRGB = [r, g, b].map((val) => {
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
}

/**
 * Computes contrast ratio between two hex colors (e.g. 21:1 for black and white)
 */
export function getContrastRatio(hex1: string, hex2: string): number {
  const lum1 = getRelativeLuminance(hex1);
  const lum2 = getRelativeLuminance(hex2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * Evaluates the visual scan readability and safety of QR customization settings
 * Rigorously checks foreground, background, eye finder contrast, logo dimensions,
 * error correction levels, and data density.
 */
export function assessQRReadability(
  customization: QRCustomization,
  payloadLength: number
): QRReadabilityResult {
  const issues: string[] = [];
  const suggestions: string[] = [];
  let score = 100;

  // 1. Contrast Check: Pattern vs Background
  const contrast = getContrastRatio(customization.fgColor, customization.bgColor);
  const lumFg = getRelativeLuminance(customization.fgColor);
  const lumBg = getRelativeLuminance(customization.bgColor);

  if (contrast < 3.0) {
    score -= 50;
    issues.push(`Critical: Contrast ratio is very low (${contrast.toFixed(1)}:1). Smartphone cameras will fail to resolve the code.`);
    suggestions.push('Choose a much darker foreground color and a light background color.');
  } else if (contrast < 4.5) {
    score -= 20;
    issues.push(`Warning: Moderate contrast ratio (${contrast.toFixed(1)}:1). Scanning in dim or outdoor lighting may fail.`);
    suggestions.push('Increase the color contrast to at least 4.5:1 for reliable scanning.');
  }

  // 2. Eye Finder Pattern Contrast Check
  const effectiveEyeColor = customization.eyeColor || customization.fgColor;
  const eyeContrast = getContrastRatio(effectiveEyeColor, customization.bgColor);

  if (eyeContrast < 3.0) {
    score -= 60;
    issues.push(`Critical: Corner eye finder pattern contrast is very low (${eyeContrast.toFixed(1)}:1). Scanners require high-contrast finder patterns to locate the code.`);
    suggestions.push('Ensure the eye finder color has high contrast with the background.');
  } else if (eyeContrast < 4.5) {
    score -= 15;
    issues.push(`Warning: Corner eye finder contrast is moderate (${eyeContrast.toFixed(1)}:1).`);
    suggestions.push('Increase finder eye contrast against the background.');
  }

  // 3. Inverted Colors Check (Light on Dark)
  if (lumFg > lumBg) {
    score -= 25;
    issues.push('Warning: Inverted colors (light QR pattern on dark background). Default camera apps on many smartphones will struggle or fail to scan inverted codes.');
    suggestions.push('For reliable physical printing, keep the foreground pattern darker than the background.');
  }

  // 4. Logo & Error Correction Level
  if (customization.logoUrl) {
    if (customization.errorCorrectionLevel === 'L') {
      score -= 45;
      issues.push('Critical: Error correction level "L" (7% recovery) is too low for center logos.');
      suggestions.push('Switch to Error Correction Level "H" (30%) or "Q" (25%) so the QR remains readable with a logo.');
    } else if (customization.errorCorrectionLevel === 'M') {
      score -= 15;
      issues.push('Error correction level "M" (15% recovery) might be fragile with larger logos.');
      suggestions.push('Recommend using Level "H" for maximum recovery capacity.');
    }

    if (customization.logoSize > 0.3) {
      score -= 25;
      issues.push(`Logo size is large (${Math.round(customization.logoSize * 100)}%). This covers critical data cells.`);
      suggestions.push('Reduce logo size to 25% or below to preserve scan safety.');
    } else if (customization.logoSize > 0.25 && customization.errorCorrectionLevel !== 'H') {
      score -= 15;
      issues.push('Logos larger than 25% require Error Correction Level "H".');
      suggestions.push('Switch Error Correction Level to "H".');
    }
  }

  // 5. Quiet Zone / Margin
  if (customization.margin < 2) {
    score -= 15;
    issues.push('Quiet zone (margin) is less than 2 modules. Scanners need clear space around the QR code.');
    suggestions.push('Set margin to at least 2 or 4 modules, especially when printing on patterned or colored surfaces.');
  }

  // 6. Payload Density
  if (payloadLength > 800) {
    score -= 25;
    issues.push(`Very high data density (${payloadLength} characters). Generates a dense grid that budget camera sensors cannot resolve.`);
    suggestions.push('Shorten the text or URL, or use a larger print size (minimum 6x6 cm).');
  } else if (payloadLength > 450) {
    score -= 10;
    issues.push(`High data density (${payloadLength} characters). Results in a very fine, dense grid.`);
    suggestions.push('Ensure a larger print size (minimum 4x4 cm) so budget smartphone cameras can resolve individual dots.');
  }

  const finalScore = Math.max(0, Math.min(100, score));

  // The QR is deemed readable ONLY if:
  // - final score >= 60
  // - pattern contrast >= 3.0
  // - eye pattern contrast >= 3.0
  // - if logo is present, error correction must NOT be 'L'
  const isReadable =
    finalScore >= 60 &&
    contrast >= 3.0 &&
    eyeContrast >= 3.0 &&
    (!customization.logoUrl || customization.errorCorrectionLevel !== 'L');

  return {
    isReadable,
    score: finalScore,
    issues,
    suggestions,
  };
}

/**
 * Validates input for specific QR types
 */
export function validateQRInput<T extends QRType>(
  type: T,
  input: QRPayloadInputMap[T]
): QRValidationResult {
  const warnings: string[] = [];

  switch (type) {
    case 'upi': {
      const val = input as UPIPayloadInput;
      if (!val.vpa || !val.vpa.trim()) {
        return { isValid: false, error: 'UPI ID (VPA) is required.', warnings };
      }
      if (!isValidUPIVpa(val.vpa)) {
        return {
          isValid: false,
          error: 'Please enter a valid UPI ID (e.g. merchant@okhdfcbank or 9876543210@paytm).',
          warnings,
        };
      }
      if (!val.payeeName || !val.payeeName.trim()) {
        return { isValid: false, error: 'Payee / Merchant name is required.', warnings };
      }
      if (val.amount) {
        const amt = parseFloat(val.amount);
        if (isNaN(amt) || amt < 0) {
          return { isValid: false, error: 'Amount must be a valid positive number.', warnings };
        }
        if (amt === 0) {
          warnings.push('Amount is set to 0. Leave amount empty for an open-amount QR where customers enter their own total.');
        }
      }
      return { isValid: true, warnings };
    }

    case 'whatsapp': {
      const val = input as WhatsAppPayloadInput;
      const cleanPhone = (val.phoneNumber || '').replace(/[^\d]/g, '');
      if (!cleanPhone) {
        return { isValid: false, error: 'WhatsApp phone number is required.', warnings };
      }
      if (cleanPhone.length < 8 || cleanPhone.length > 15) {
        return {
          isValid: false,
          error: 'Please enter a valid phone number (between 8 and 15 digits).',
          warnings,
        };
      }
      return { isValid: true, warnings };
    }

    case 'url': {
      const val = input as URLPayloadInput;
      if (!val.url || !val.url.trim()) {
        return { isValid: false, error: 'Website URL is required.', warnings };
      }
      if (!isSafeURL(val.url)) {
        return { isValid: false, error: 'Invalid or unsafe URL format provided. Only http:// and https:// links are supported.', warnings };
      }
      return { isValid: true, warnings };
    }

    case 'wifi': {
      const val = input as WiFiPayloadInput;
      if (!val.ssid || !val.ssid.trim()) {
        return { isValid: false, error: 'Wi-Fi Network Name (SSID) is required.', warnings };
      }
      if (val.authType !== 'nopass' && (!val.password || val.password.length < 4)) {
        return {
          isValid: false,
          error: 'Password is required and should be at least 4 characters for protected networks.',
          warnings,
        };
      }
      return { isValid: true, warnings };
    }

    case 'vcard': {
      const val = input as VCardPayloadInput;
      const hasName = (val.firstName && val.firstName.trim()) || (val.lastName && val.lastName.trim());
      const hasOrg = val.organization && val.organization.trim();
      if (!hasName && !hasOrg) {
        return {
          isValid: false,
          error: 'Please provide at least a First Name, Last Name, or Company Name.',
          warnings,
        };
      }
      if (val.email && !isValidEmail(val.email)) {
        warnings.push('Email address format seems irregular. Please verify.');
      }
      if (val.website && val.website.trim() && !isSafeURL(val.website)) {
        return { isValid: false, error: 'Unsafe website URL in vCard.', warnings };
      }
      return { isValid: true, warnings };
    }

    case 'phone': {
      const val = input as PhonePayloadInput;
      const clean = (val.phoneNumber || '').replace(/[^\d+]/g, '');
      const digitsOnly = clean.replace(/[^\d]/g, '');
      if (!digitsOnly || digitsOnly.length < 3 || digitsOnly.length > 16) {
        return { isValid: false, error: 'Please enter a valid phone number (between 3 and 16 digits).', warnings };
      }
      return { isValid: true, warnings };
    }

    case 'email': {
      const val = input as EmailPayloadInput;
      if (!val.email || !val.email.trim()) {
        return { isValid: false, error: 'Recipient email address is required.', warnings };
      }
      if (!isValidEmail(val.email)) {
        return { isValid: false, error: 'Please enter a valid email address.', warnings };
      }
      return { isValid: true, warnings };
    }

    case 'text': {
      const val = input as TextPayloadInput;
      if (!val.text || !val.text.trim()) {
        return { isValid: false, error: 'Please enter some text for the QR code.', warnings };
      }
      if (val.text.length > 500) {
        warnings.push(`Text is long (${val.text.length} chars). Consider keeping it concise so the QR remains easy to scan.`);
      }
      return { isValid: true, warnings };
    }

    case 'maps': {
      const val = input as MapsPayloadInput;
      if (!val.queryOrUrl || !val.queryOrUrl.trim()) {
        return { isValid: false, error: 'Please enter a Google Maps link or location address.', warnings };
      }
      const trimmed = val.queryOrUrl.trim();
      if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        if (!isSafeURL(trimmed)) {
          return { isValid: false, error: 'Unsafe URL format provided.', warnings };
        }
      } else {
        // Address text query: ensure no script injection
        if (trimmed.includes('<') || trimmed.includes('>') || trimmed.toLowerCase().includes('javascript:')) {
          return { isValid: false, error: 'Unsafe characters in address query.', warnings };
        }
      }
      return { isValid: true, warnings };
    }

    case 'review': {
      const val = input as GoogleReviewPayloadInput;
      if (!val.reviewUrl || !val.reviewUrl.trim()) {
        return { isValid: false, error: 'Google Review link is required.', warnings };
      }
      if (!isSafeURL(val.reviewUrl)) {
        return { isValid: false, error: 'Unsafe or invalid review link.', warnings };
      }
      return { isValid: true, warnings };
    }

    case 'pdf': {
      const val = input as PDFPayloadInput;
      if (!val.pdfUrl || !val.pdfUrl.trim()) {
        return { isValid: false, error: 'Public PDF document URL is required.', warnings };
      }
      if (!isSafeURL(val.pdfUrl)) {
        return { isValid: false, error: 'Unsafe or invalid document URL.', warnings };
      }
      return { isValid: true, warnings };
    }

    case 'menu': {
      const val = input as MenuPayloadInput;
      if (!val.menuUrl || !val.menuUrl.trim()) {
        return { isValid: false, error: 'Digital menu website or link is required.', warnings };
      }
      if (!isSafeURL(val.menuUrl)) {
        return { isValid: false, error: 'Unsafe or invalid menu URL.', warnings };
      }
      return { isValid: true, warnings };
    }

    default:
      return { isValid: true, warnings };
  }
}

/**
 * Sanitizes an SVG string by stripping script tags, foreignObject, event handlers, and dangerous attributes.
 */
export function sanitizeSvg(svgContent: string): string {
  if (!svgContent || typeof svgContent !== 'string') return '';

  const clean = svgContent
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<foreignObject\b[^<]*(?:(?!<\/foreignObject>)<[^<]*)*<\/foreignObject>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    .replace(/\son[a-z]+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, '')
    .replace(/(?:href|xlink:href)\s*=\s*(?:'javascript:[^']*'|"javascript:[^"]*"|javascript:[^\s>]+)/gi, '');

  if (typeof window !== 'undefined' && typeof DOMParser !== 'undefined') {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(clean, 'image/svg+xml');
      const parserError = doc.querySelector('parsererror');
      if (parserError) {
        return '';
      }

      const dangerousTags = ['script', 'foreignobject', 'iframe', 'object', 'embed', 'link'];
      dangerousTags.forEach((tag) => {
        const els = doc.getElementsByTagName(tag);
        while (els.length > 0) {
          els[0].parentNode?.removeChild(els[0]);
        }
      });

      const allElements = doc.getElementsByTagName('*');
      for (let i = 0; i < allElements.length; i++) {
        const el = allElements[i];
        const attrs = Array.from(el.attributes);
        for (const attr of attrs) {
          if (attr.name.toLowerCase().startsWith('on') || attr.value.toLowerCase().includes('javascript:')) {
            el.removeAttribute(attr.name);
          }
        }
      }

      const serializer = new XMLSerializer();
      return serializer.serializeToString(doc.documentElement);
    } catch {
      return clean;
    }
  }

  return clean;
}
