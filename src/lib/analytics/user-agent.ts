import { DeviceCategory } from '@prisma/client';

export interface ParsedUserAgent {
  deviceCategory: DeviceCategory;
  operatingSystem: string;
  browser: string;
}

/**
 * Lightweight, zero-dependency User-Agent parser.
 * Classifies client environment into coarse, privacy-minimizing categories:
 * - Device: MOBILE | TABLET | DESKTOP | UNKNOWN
 * - OS: Android | iOS | Windows | macOS | Linux | Chrome OS | Unknown
 * - Browser: Chrome | Safari | Firefox | Edge | Samsung Internet | Opera | Other | Unknown
 *
 * Designed for extreme speed (<0.01ms) and deterministic categorization.
 * Raw User-Agent strings are never stored.
 */
export function parseUserAgent(ua?: string | null): ParsedUserAgent {
  if (!ua || typeof ua !== 'string' || ua.trim() === '') {
    return {
      deviceCategory: DeviceCategory.UNKNOWN,
      operatingSystem: 'Unknown',
      browser: 'Unknown',
    };
  }

  const normalized = ua.trim();

  // 1. Detect Operating System
  let operatingSystem = 'Unknown';
  if (/Android/i.test(normalized)) {
    operatingSystem = 'Android';
  } else if (/iPhone|iPad|iPod/i.test(normalized)) {
    operatingSystem = 'iOS';
  } else if (/Windows NT/i.test(normalized)) {
    operatingSystem = 'Windows';
  } else if (/Macintosh|Mac OS X/i.test(normalized)) {
    operatingSystem = 'macOS';
  } else if (/CrOS/i.test(normalized)) {
    operatingSystem = 'Chrome OS';
  } else if (/Linux/i.test(normalized)) {
    operatingSystem = 'Linux';
  }

  // 2. Detect Device Category
  let deviceCategory: DeviceCategory = DeviceCategory.UNKNOWN;
  if (/iPad|Tablet|Silk|Kindle|PlayBook/i.test(normalized)) {
    deviceCategory = DeviceCategory.TABLET;
  } else if (/Android/i.test(normalized) && !/Mobile/i.test(normalized)) {
    // Android without Mobile token indicates an Android tablet
    deviceCategory = DeviceCategory.TABLET;
  } else if (/iPhone|iPod|Mobile|Opera Mini|IEMobile|BlackBerry|webOS/i.test(normalized)) {
    deviceCategory = DeviceCategory.MOBILE;
  } else if (/Windows NT|Macintosh|X11|Linux/i.test(normalized)) {
    deviceCategory = DeviceCategory.DESKTOP;
  }

  // 3. Detect Browser
  let browser = 'Unknown';
  if (/SamsungBrowser/i.test(normalized)) {
    browser = 'Samsung Internet';
  } else if (/Edg\/|Edge\//i.test(normalized)) {
    browser = 'Edge';
  } else if (/OPR\/|Opera/i.test(normalized)) {
    browser = 'Opera';
  } else if (/Firefox\/|FxiOS/i.test(normalized)) {
    browser = 'Firefox';
  } else if (/Chrome\/|CriOS/i.test(normalized)) {
    browser = 'Chrome';
  } else if (/Safari/i.test(normalized) && !/Chrome\/|CriOS/i.test(normalized)) {
    browser = 'Safari';
  } else if (normalized.length > 0) {
    browser = 'Other';
  }

  return {
    deviceCategory,
    operatingSystem,
    browser,
  };
}
