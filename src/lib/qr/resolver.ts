import { prisma } from '@/lib/db/prisma';
import { validateDestinationUrl } from '@/lib/validation/url-safety';

/**
 * Base62 ShortCode Validation
 * Exactly 7 characters from the set [0-9a-zA-Z]
 */
export const SHORT_CODE_REGEX = /^[0-9a-zA-Z]{7}$/;

export function isValidShortCode(code: unknown): code is string {
  return typeof code === 'string' && SHORT_CODE_REGEX.test(code);
}

export type ResolveQRStatus =
  | 'SUCCESS'
  | 'INVALID_CODE'
  | 'NOT_FOUND'
  | 'PAUSED'
  | 'EXPIRED'
  | 'INACTIVE'
  | 'MISSING_DESTINATION'
  | 'INVALID_DESTINATION'
  | 'ERROR';

export type ResolveQRResult =
  | {
      success: true;
      destinationUrl: string;
      shortCode: string;
      qrCodeId: string;
      organizationId: string;
    }
  | { success: false; status: Exclude<ResolveQRStatus, 'SUCCESS'>; error?: string };

/**
 * Minimal Bounded In-Memory Cache
 * Stores active destination URLs and metadata for up to 30 seconds to mitigate DB read amplification.
 * Maximum capacity: 1,000 entries (FIFO eviction).
 * Redis is explicitly NOT introduced in Phase 2B.
 */
export interface ResolverCacheEntry {
  destinationUrl: string;
  qrCodeId: string;
  organizationId: string;
  expiresAt: number;
}

const CACHE_MAX_ENTRIES = 1000;
const CACHE_TTL_MS = 30 * 1000; // 30 seconds

class BoundedResolverCache {
  private cache = new Map<string, ResolverCacheEntry>();

  public get(shortCode: string): string | null {
    const entry = this.getEntry(shortCode);
    return entry ? entry.destinationUrl : null;
  }

  public getEntry(shortCode: string): ResolverCacheEntry | null {
    const entry = this.cache.get(shortCode);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(shortCode);
      return null;
    }
    return entry;
  }

  public set(
    shortCode: string,
    destinationUrl: string,
    metadata?: { qrCodeId?: string; organizationId?: string }
  ): void {
    if (this.cache.size >= CACHE_MAX_ENTRIES) {
      // Evict oldest entry (first key in insertion order)
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }
    this.cache.set(shortCode, {
      destinationUrl,
      qrCodeId: metadata?.qrCodeId || '',
      organizationId: metadata?.organizationId || '',
      expiresAt: Date.now() + CACHE_TTL_MS,
    });
  }

  public invalidate(shortCode: string): void {
    this.cache.delete(shortCode);
  }

  public clear(): void {
    this.cache.clear();
  }

  public size(): number {
    return this.cache.size;
  }
}

export const resolverCache = new BoundedResolverCache();

/**
 * Retrieves the configured dynamic QR base URL from environment or defaults.
 * Supports development, staging, and custom domains (e.g. quickqr.amanxthink11.com).
 */
export function getQRBaseUrl(): string {
  const url =
    process.env.NEXT_PUBLIC_QR_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'http://localhost:3000';
  return url.replace(/\/+$/, '');
}

/**
 * Production Dynamic QR Resolver
 *
 * Architecture:
 * 1. Syntactic validation: Reject invalid/malformed shortCodes without querying database.
 * 2. In-memory bounded cache check (cache-ready extension point).
 * 3. Lean indexed PostgreSQL query: Selects only status, expiration, and active destination.
 *    Never exposes user, membership, organization, or sensitive internal data.
 * 4. Status validation: Enforces ACTIVE status, non-expired date, and non-deleted state.
 * 5. Destination resolution & security validation: Checks destination belongs to the QR
 *    and passes anti-SSRF RFC 3986 filtering.
 * 6. Returns destination URL for HTTP 302 redirect.
 */
export async function resolveDynamicQRCode(
  shortCode: string,
  options?: { bypassCache?: boolean }
): Promise<ResolveQRResult> {
  // Step 1: Syntactic validation
  if (!isValidShortCode(shortCode)) {
    return {
      success: false,
      status: 'INVALID_CODE',
      error: 'Invalid short code format. Must be exactly 7 alphanumeric characters.',
    };
  }

  // Step 2: Bounded Cache Lookup
  if (!options?.bypassCache && process.env.DISABLE_QR_RESOLVER_CACHE !== 'true') {
    const cachedEntry = resolverCache.getEntry(shortCode);
    if (cachedEntry) {
      return {
        success: true,
        destinationUrl: cachedEntry.destinationUrl,
        shortCode,
        qrCodeId: cachedEntry.qrCodeId,
        organizationId: cachedEntry.organizationId,
      };
    }
  }

  // Step 3: Lean Database Lookup
  try {
    const qrCode = await prisma.qRCode.findUnique({
      where: { shortCode },
      select: {
        id: true,
        organizationId: true,
        status: true,
        expiresAt: true,
        deletedAt: true,
        destinations: {
          where: {
            isActive: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            qrCodeId: true,
            destinationUrl: true,
            isActive: true,
          },
        },
      },
    });

    // Step 4: Existence & Status Verification
    if (!qrCode || qrCode.deletedAt !== null) {
      return { success: false, status: 'NOT_FOUND' };
    }

    if (qrCode.status === 'PAUSED') {
      return { success: false, status: 'PAUSED' };
    }

    const now = new Date();
    if (qrCode.status === 'EXPIRED' || (qrCode.expiresAt && qrCode.expiresAt <= now)) {
      return { success: false, status: 'EXPIRED' };
    }

    if (qrCode.status !== 'ACTIVE') {
      return { success: false, status: 'INACTIVE' };
    }

    // Step 5: Active Destination Resolution
    const activeDestination = qrCode.destinations[0];
    if (!activeDestination || !activeDestination.isActive) {
      return { success: false, status: 'MISSING_DESTINATION' };
    }

    // Tenancy/Ownership relation sanity check
    if (activeDestination.qrCodeId !== qrCode.id) {
      return { success: false, status: 'MISSING_DESTINATION' };
    }

    // Step 6: Anti-SSRF URL Safety Validation
    const urlValidation = validateDestinationUrl(activeDestination.destinationUrl);
    if (!urlValidation.isValid || !urlValidation.sanitizedUrl) {
      return {
        success: false,
        status: 'INVALID_DESTINATION',
        error: urlValidation.error || 'Destination URL failed security validation',
      };
    }

    const finalDestinationUrl = urlValidation.sanitizedUrl;

    // Cache successful resolution
    if (process.env.DISABLE_QR_RESOLVER_CACHE !== 'true') {
      resolverCache.set(shortCode, finalDestinationUrl, {
        qrCodeId: qrCode.id,
        organizationId: qrCode.organizationId,
      });
    }

    return {
      success: true,
      destinationUrl: finalDestinationUrl,
      shortCode,
      qrCodeId: qrCode.id,
      organizationId: qrCode.organizationId,
    };
  } catch (err: unknown) {
    // Safe error logging: Do not leak stack traces or internal DB details
    const message = err instanceof Error ? err.message : 'Database lookup error';
    console.error(`[QR_RESOLVER_ERROR] ShortCode: ${shortCode} - ${message}`);

    return {
      success: false,
      status: 'ERROR',
      error: 'An unexpected error occurred while resolving the QR code.',
    };
  }
}
