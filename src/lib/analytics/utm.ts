export interface UtmParameters {
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmTerm?: string | null;
  utmContent?: string | null;
}

const MAX_UTM_LENGTH = 100;

/**
 * Sanitizes a single UTM parameter value:
 * - Truncates to MAX_UTM_LENGTH characters.
 * - Removes control characters, newlines, and potential HTML tags.
 * - Trims whitespace.
 * - Returns null if empty.
 */
export function sanitizeUtmValue(value?: string | null): string | null {
  if (!value || typeof value !== 'string') {
    return null;
  }

  // Remove HTML tags, control characters, and newlines
  const cleaned = value
    .replace(/<[^>]*>/g, '')
    .replace(/[\r\n\t\x00-\x1F\x7F]/g, '')
    .trim();

  if (cleaned === '') {
    return null;
  }

  return cleaned.slice(0, MAX_UTM_LENGTH);
}

/**
 * Extracts and sanitizes UTM parameters from search params or URL string.
 */
export function extractAndSanitizeUtm(
  source: URLSearchParams | Record<string, string | string[] | undefined> | string | null | undefined
): UtmParameters {
  if (!source) {
    return {
      utmSource: null,
      utmMedium: null,
      utmCampaign: null,
      utmTerm: null,
      utmContent: null,
    };
  }

  let params: URLSearchParams;

  if (typeof source === 'string') {
    try {
      const parsed = new URL(source.startsWith('http') ? source : `https://example.com${source.startsWith('/') ? '' : '/'}${source}`);
      params = parsed.searchParams;
    } catch {
      params = new URLSearchParams(source.includes('?') ? source.split('?')[1] : source);
    }
  } else if (source instanceof URLSearchParams) {
    params = source;
  } else {
    params = new URLSearchParams();
    for (const [key, val] of Object.entries(source)) {
      if (typeof val === 'string') {
        params.set(key, val);
      } else if (Array.isArray(val) && val[0]) {
        params.set(key, val[0]);
      }
    }
  }

  return {
    utmSource: sanitizeUtmValue(params.get('utm_source')),
    utmMedium: sanitizeUtmValue(params.get('utm_medium')),
    utmCampaign: sanitizeUtmValue(params.get('utm_campaign')),
    utmTerm: sanitizeUtmValue(params.get('utm_term')),
    utmContent: sanitizeUtmValue(params.get('utm_content')),
  };
}
