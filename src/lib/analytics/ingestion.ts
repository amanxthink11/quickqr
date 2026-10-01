import { prisma } from '@/lib/db/prisma';
import { parseUserAgent } from './user-agent';
import { sanitizeReferrer } from './referrer';
import { extractAndSanitizeUtm, UtmParameters } from './utm';
import { resolveCoarseGeo, CoarseLocation } from './geoip';
import { ScanEvent } from '@prisma/client';
import { after } from 'next/server';

export interface ScanCapturePayload {
  organizationId: string;
  qrCodeId: string;
  userAgent?: string | null;
  rawReferrer?: string | null;
  searchParams?: URLSearchParams | Record<string, string | string[] | undefined> | string | null;
  destinationUrl?: string | null;
  headers?: Headers;
  scannedAt?: Date;
}

/**
 * Persists a single ScanEvent in a privacy-minimizing manner.
 *
 * Privacy Guarantees:
 * - NO raw IP address is stored or logged.
 * - NO raw User-Agent is stored.
 * - NO customer PII or GPS coordinates.
 * - Referrer query parameters and session tokens are stripped.
 * - UTM values are sanitized and length-capped.
 *
 * Resilience:
 * - Handled gracefully with try/catch.
 * - Does NOT throw unhandled exceptions to callers.
 */
export async function captureScanEvent(payload: ScanCapturePayload): Promise<ScanEvent | null> {
  try {
    const {
      organizationId,
      qrCodeId,
      userAgent,
      rawReferrer,
      searchParams,
      destinationUrl,
      headers,
      scannedAt = new Date(),
    } = payload;

    // 1. Client Environment Parsing (Coarse)
    const clientEnv = parseUserAgent(userAgent);

    // 2. Referrer Sanitization (Hostname/Origin only)
    const referrer = sanitizeReferrer(rawReferrer);

    // 3. UTM Attribution Extraction
    // First extract from incoming scan query, fallback to destination URL presets if missing
    const scanUtms = extractAndSanitizeUtm(searchParams);
    const destUtms: UtmParameters = destinationUrl ? extractAndSanitizeUtm(destinationUrl) : {};

    const utmSource = scanUtms.utmSource || destUtms.utmSource || null;
    const utmMedium = scanUtms.utmMedium || destUtms.utmMedium || null;
    const utmCampaign = scanUtms.utmCampaign || destUtms.utmCampaign || null;
    const utmTerm = scanUtms.utmTerm || destUtms.utmTerm || null;
    const utmContent = scanUtms.utmContent || destUtms.utmContent || null;

    // 4. Coarse Geolocation Resolution (Headers only, IP discarded)
    const geo: CoarseLocation = headers ? resolveCoarseGeo(headers) : { country: null, region: null, city: null };

    // 5. Database Write
    const event = await prisma.scanEvent.create({
      data: {
        organizationId,
        qrCodeId,
        scannedAt,
        deviceCategory: clientEnv.deviceCategory,
        operatingSystem: clientEnv.operatingSystem,
        browser: clientEnv.browser,
        country: geo.country,
        region: geo.region,
        city: geo.city,
        referrer,
        utmSource,
        utmMedium,
        utmCampaign,
        utmTerm,
        utmContent,
      },
    });

    return event;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown scan capture error';
    console.error(`[SCAN_ANALYTICS_ERROR] QR: ${payload.qrCodeId} - ${message}`);
    return null;
  }
}

/**
 * Asynchronously schedules scan event capture without blocking HTTP 302 redirect.
 *
 * CRITICAL RULE: QR REDIRECT > ANALYTICS
 * Redirect must succeed even if analytics capture fails or is delayed.
 *
 * Uses Next.js `after()` when available, falling back safely to unawaited background execution.
 */
export function safeScheduleScan(payload: ScanCapturePayload): void {
  const runCapture = async () => {
    try {
      await captureScanEvent(payload);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Background analytics failure';
      console.error(`[SCAN_ANALYTICS_SCHEDULE_ERROR] ${message}`);
    }
  };

  try {
    // Attempt Next.js after() hook (Next.js 15+)
    if (typeof after === 'function') {
      after(runCapture);
      return;
    }
  } catch {
    // Context may not support after() (e.g. running in unit tests)
  }

  // Safe fallback to asynchronous unawaited execution
  if (typeof setImmediate === 'function') {
    setImmediate(() => {
      runCapture().catch(() => {});
    });
  } else {
    setTimeout(() => {
      runCapture().catch(() => {});
    }, 0);
  }
}
