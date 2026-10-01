/**
 * URL Security & SSRF Protection
 * Implements strict RFC 3986 validation, protocol whitelisting, and anti-SSRF filtering
 * as specified in PHASE_2A_ARCHITECTURE_REVIEW.md.
 */

// Disallowed private / loopback IP prefixes (RFC 1918 + loopback + link-local)
const PRIVATE_IP_PREFIXES = [
  '127.', // Loopback
  '10.', // Class A private
  '192.168.', // Class C private
  '169.254.', // Link-local / Cloud Metadata (AWS/GCP/Azure: 169.254.169.254)
  '0.', // Current network
];

// RFC 1918 Class B: 172.16.0.0 – 172.31.255.255
function isClassBPrivate(ip: string): boolean {
  if (!ip.startsWith('172.')) return false;
  const parts = ip.split('.');
  if (parts.length < 2) return false;
  const second = parseInt(parts[1], 10);
  return second >= 16 && second <= 31;
}

const DISALLOWED_HOSTNAMES = new Set([
  'localhost',
  '127.0.0.1',
  '[::1]',
  '::1',
  '0.0.0.0',
]);

const DISALLOWED_INTERNAL_TLDS = ['.local', '.internal', '.lan', '.corp', '.home'];

export interface URLValidationResult {
  isValid: boolean;
  sanitizedUrl?: string;
  error?: string;
}

/**
 * Validates and sanitizes a destination URL.
 * Only http: and https: protocols are permitted.
 * Blocks all loopback, private IP subnets, cloud metadata addresses, and internal network domains.
 */
export function validateDestinationUrl(input: string): URLValidationResult {
  if (!input || typeof input !== 'string') {
    return { isValid: false, error: 'Destination URL is required' };
  }

  const trimmed = input.trim();
  if (trimmed.length > 2048) {
    return { isValid: false, error: 'URL exceeds maximum length of 2048 characters' };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { isValid: false, error: 'Malformed URL format' };
  }

  const protocol = parsed.protocol.toLowerCase();
  // 1. Whitelist only http: and https:
  if (protocol !== 'https:' && protocol !== 'http:') {
    return {
      isValid: false,
      error: `Unsupported protocol '${protocol}'. Only HTTP and HTTPS are permitted.`,
    };
  }

  const hostname = parsed.hostname.toLowerCase();

  // 2. Reject exact loopback & localhost hostnames
  if (DISALLOWED_HOSTNAMES.has(hostname)) {
    return { isValid: false, error: 'Localhost and loopback destinations are not allowed' };
  }

  // 3. Reject internal TLDs
  for (const tld of DISALLOWED_INTERNAL_TLDS) {
    if (hostname.endsWith(tld)) {
      return { isValid: false, error: 'Internal domain destinations are not allowed' };
    }
  }

  // 4. Reject private IPv4 subnets and cloud metadata
  for (const prefix of PRIVATE_IP_PREFIXES) {
    if (hostname.startsWith(prefix)) {
      return { isValid: false, error: 'Private IP addresses are not permitted' };
    }
  }

  if (isClassBPrivate(hostname)) {
    return { isValid: false, error: 'Private IP addresses are not permitted' };
  }

  // 5. Ensure hostname contains a dot or valid domain structure (reject single label hostnames like "router")
  if (!hostname.includes('.')) {
    return { isValid: false, error: 'Destination must include a valid public domain' };
  }

  return {
    isValid: true,
    sanitizedUrl: parsed.toString(),
  };
}
