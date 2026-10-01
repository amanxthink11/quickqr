/**
 * Privacy-preserving Referrer Sanitizer
 *
 * Requirements:
 * 1. Discard sensitive query parameters, search queries, session tokens, and fragments.
 * 2. Retain only the hostname/origin (e.g., 'instagram.com', 'l.instagram.com', 'facebook.com').
 * 3. Enforce maximum character length (255 chars) to prevent DB bloat or buffer abuse.
 * 4. Reject non-HTTP/HTTPS schemes (e.g. javascript:, data:, file:).
 * 5. Return null if absent, invalid, or empty.
 */
export function sanitizeReferrer(rawReferrer?: string | null): string | null {
  if (!rawReferrer || typeof rawReferrer !== 'string') {
    return null;
  }

  const trimmed = rawReferrer.trim();
  if (trimmed === '') {
    return null;
  }

  try {
    // If rawReferrer has a scheme (http:// or https://)
    const url = new URL(trimmed.startsWith('http://') || trimmed.startsWith('https://') ? trimmed : `https://${trimmed}`);

    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return null;
    }

    // Extract hostname and lowercase it
    const hostname = url.hostname.toLowerCase();

    // Reject localhost or IP-like local addresses
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '::1' ||
      hostname.endsWith('.local')
    ) {
      return null;
    }

    // Ensure valid domain format (at least one dot or standard hostname)
    if (!hostname || hostname.length > 255) {
      return null;
    }

    return hostname;
  } catch {
    // Failed to parse as URL
    return null;
  }
}
