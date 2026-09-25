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
 * Validates that a URL uses safe protocols (http, https) and prevents XSS / javascript:
 */
export function isSafeURL(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim().toLowerCase();
  if (
    trimmed.startsWith('javascript:') ||
    trimmed.startsWith('vbscript:') ||
    trimmed.startsWith('data:text/html') ||
    trimmed.startsWith('data:application') ||
    trimmed.includes('<script') ||
    trimmed.includes('onload=') ||
    trimmed.includes('onerror=')
  ) {
    return false;
  }
  return true;
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
 * Validates an email address
 */
export function isValidEmail(email: string): boolean {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Calculates relative luminance for WCAG contrast calculation
 */
function getRelativeLuminance(hex: string): number {
  let clean = hex.replace('#', '');
  if (clean.length === 3) {
    clean = clean
      .split('')
      .map((c) => c + c)
      .join('');
  }
  if (clean.length !== 6) return 0.5;

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
 */
export function assessQRReadability(
  customization: QRCustomization,
  payloadLength: number
): QRReadabilityResult {
  const issues: string[] = [];
  const suggestions: string[] = [];
  let score = 100;

  // 1. Contrast Check
  const contrast = getContrastRatio(customization.fgColor, customization.bgColor);
  const lumFg = getRelativeLuminance(customization.fgColor);
  const lumBg = getRelativeLuminance(customization.bgColor);

  if (contrast < 3.0) {
    score -= 50;
    issues.push(`Critical: Contrast ratio is very low (${contrast.toFixed(1)}:1). Scanners will fail to recognize the code.`);
    suggestions.push('Choose a much darker foreground color and a light background color.');
  } else if (contrast < 4.5) {
    score -= 25;
    issues.push(`Warning: Moderate contrast ratio (${contrast.toFixed(1)}:1). Scanning in dim lighting might be difficult.`);
    suggestions.push('Increase the color contrast to at least 4.5:1 for reliable scanning.');
  }

  // 2. Inverted Colors Check (Light on Dark)
  if (lumFg > lumBg) {
    score -= 15;
    issues.push('Note: Inverted colors (light QR pattern on dark background). Some basic camera apps struggle with inverted QR codes.');
    suggestions.push('For maximum compatibility on printed materials, keep the foreground darker than the background.');
  }

  // 3. Logo & Error Correction Level
  if (customization.logoUrl) {
    if (customization.errorCorrectionLevel === 'L') {
      score -= 30;
      issues.push('Error correction level "L" (7%) is too low for center logos.');
      suggestions.push('Switch to Error Correction Level "H" (30%) or "Q" (25%) so the QR remains readable with a logo.');
    } else if (customization.errorCorrectionLevel === 'M') {
      score -= 15;
      issues.push('Error correction level "M" (15%) might be fragile with larger logos.');
      suggestions.push('Recommend using Level "H" for maximum recovery capacity.');
    }

    if (customization.logoSize > 0.3) {
      score -= 20;
      issues.push(`Logo size is large (${Math.round(customization.logoSize * 100)}%). This covers critical data cells.`);
      suggestions.push('Reduce logo size to 25% or below to preserve scan safety.');
    }
  }

  // 4. Quiet Zone / Margin
  if (customization.margin < 2) {
    score -= 15;
    issues.push('Quiet zone (margin) is less than 2 modules. Scanners need clear space around the QR code.');
    suggestions.push('Set margin to at least 2 or 4 modules, especially when printing on patterned or colored surfaces.');
  }

  // 5. Payload Density
  if (payloadLength > 500) {
    score -= 10;
    issues.push(`High data density (${payloadLength} characters). Results in a very fine, dense grid.`);
    suggestions.push('Ensure a larger print size (minimum 4x4 cm) so budget smartphone cameras can resolve individual dots.');
  }

  const finalScore = Math.max(0, Math.min(100, score));
  const isReadable = finalScore >= 60 && contrast >= 3.0;

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
        return { isValid: false, error: 'Invalid or unsafe URL format provided.', warnings };
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
      return { isValid: true, warnings };
    }

    case 'phone': {
      const val = input as PhonePayloadInput;
      const clean = (val.phoneNumber || '').replace(/[^\d+]/g, '');
      if (!clean || clean.length < 3) {
        return { isValid: false, error: 'Please enter a valid phone number.', warnings };
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
      if (!isSafeURL(val.queryOrUrl)) {
        return { isValid: false, error: 'Unsafe URL format provided.', warnings };
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
