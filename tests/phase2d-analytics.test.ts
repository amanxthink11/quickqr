/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { parseUserAgent } from '../src/lib/analytics/user-agent';
import { sanitizeReferrer } from '../src/lib/analytics/referrer';
import { extractAndSanitizeUtm } from '../src/lib/analytics/utm';
import { resolveCoarseGeo } from '../src/lib/analytics/geoip';
import { captureScanEvent, safeScheduleScan } from '../src/lib/analytics/ingestion';
import {
  getAnalyticsOverview,
  getScanTrend,
  getDimensionBreakdown,
  getGeoBreakdown,
  getUtmBreakdown,
  getTopQRCodes,
  getQRCodeAnalyticsSummary,
} from '../src/lib/analytics/service';
import { GET } from '../src/app/q/[shortCode]/route';
import { prisma } from '../src/lib/db/prisma';
import { resolverCache } from '../src/lib/qr/resolver';
import { DeviceCategory } from '@prisma/client';
import { NextRequest } from 'next/server';

interface MockScanEvent {
  id: string;
  organizationId: string;
  qrCodeId: string;
  scannedAt: Date;
  deviceCategory: DeviceCategory;
  operatingSystem: string | null;
  browser: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  referrer: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmTerm: string | null;
  utmContent: string | null;
}

interface MockQRCode {
  id: string;
  organizationId: string;
  shortCode: string;
  title: string;
  type: string;
  status: string;
  deletedAt: Date | null;
  destinations: { id: string; qrCodeId: string; destinationUrl: string; isActive: boolean }[];
}

describe('Phase 2D: QR Scan Analytics & Tracking Engine', () => {
  let scanStore: MockScanEvent[] = [];
  let qrStore: MockQRCode[] = [];

  const ORG_A = 'org_tenant_alpha';
  const ORG_B = 'org_tenant_beta';
  const QR_1 = 'qr_code_001';
  const QR_2 = 'qr_code_002';
  const QR_B = 'qr_code_beta_001';

  beforeEach(() => {
    scanStore = [];
    qrStore = [
      {
        id: QR_1,
        organizationId: ORG_A,
        shortCode: 'abc1234',
        title: 'Table 1 Stand',
        type: 'DYNAMIC_URL',
        status: 'ACTIVE',
        deletedAt: null,
        destinations: [
          {
            id: 'dest_1',
            qrCodeId: QR_1,
            destinationUrl: 'https://example.com/menu',
            isActive: true,
          },
        ],
      },
      {
        id: QR_2,
        organizationId: ORG_A,
        shortCode: 'def5678',
        title: 'Counter Stand',
        type: 'DYNAMIC_URL',
        status: 'ACTIVE',
        deletedAt: null,
        destinations: [
          {
            id: 'dest_2',
            qrCodeId: QR_2,
            destinationUrl: 'https://example.com/pay',
            isActive: true,
          },
        ],
      },
      {
        id: QR_B,
        organizationId: ORG_B,
        shortCode: 'bet9999',
        title: 'Beta Org Stand',
        type: 'DYNAMIC_URL',
        status: 'ACTIVE',
        deletedAt: null,
        destinations: [
          {
            id: 'dest_b',
            qrCodeId: QR_B,
            destinationUrl: 'https://beta.com/store',
            isActive: true,
          },
        ],
      },
    ];

    resolverCache.clear();

    // Mock prisma.scanEvent.create
    (vi.spyOn(prisma.scanEvent, 'create') as any).mockImplementation(async ({ data }: any) => {
      const newEvent: MockScanEvent = {
        id: `scan_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        organizationId: data.organizationId,
        qrCodeId: data.qrCodeId,
        scannedAt: data.scannedAt || new Date(),
        deviceCategory: data.deviceCategory || DeviceCategory.UNKNOWN,
        operatingSystem: data.operatingSystem || null,
        browser: data.browser || null,
        country: data.country || null,
        region: data.region || null,
        city: data.city || null,
        referrer: data.referrer || null,
        utmSource: data.utmSource || null,
        utmMedium: data.utmMedium || null,
        utmCampaign: data.utmCampaign || null,
        utmTerm: data.utmTerm || null,
        utmContent: data.utmContent || null,
      };
      scanStore.push(newEvent);
      return newEvent;
    });

    // Mock prisma.scanEvent.count
    (vi.spyOn(prisma.scanEvent, 'count') as any).mockImplementation(async ({ where }: any) => {
      let filtered = scanStore.filter((s) => s.organizationId === where.organizationId);
      if (where.qrCodeId) {
        filtered = filtered.filter((s) => s.qrCodeId === where.qrCodeId);
      }
      if (where.scannedAt?.gte) {
        filtered = filtered.filter((s) => s.scannedAt >= where.scannedAt.gte);
      }
      return filtered.length;
    });

    // Mock prisma.scanEvent.findMany
    (vi.spyOn(prisma.scanEvent, 'findMany') as any).mockImplementation(async ({ where, select }: any) => {
      let filtered = scanStore.filter((s) => s.organizationId === where.organizationId);
      if (where.qrCodeId) {
        filtered = filtered.filter((s) => s.qrCodeId === where.qrCodeId);
      }
      if (where.scannedAt?.gte) {
        filtered = filtered.filter((s) => s.scannedAt >= where.scannedAt.gte);
      }
      if (where.scannedAt?.lte) {
        filtered = filtered.filter((s) => s.scannedAt <= where.scannedAt.lte);
      }
      if (where.utmCampaign?.not === null) {
        filtered = filtered.filter((s) => s.utmCampaign !== null);
      }

      if (select) {
        return filtered.map((s) => {
          const res: any = {};
          for (const key of Object.keys(select)) {
            res[key] = (s as any)[key];
          }
          return res;
        });
      }
      return filtered;
    });

    // Mock prisma.scanEvent.groupBy
    (vi.spyOn(prisma.scanEvent, 'groupBy') as any).mockImplementation(async ({ where, take }: any) => {
      let filtered = scanStore.filter((s) => s.organizationId === where.organizationId);
      if (where.scannedAt?.gte) {
        filtered = filtered.filter((s) => s.scannedAt >= where.scannedAt.gte);
      }

      const map = new Map<string, number>();
      for (const item of filtered) {
        map.set(item.qrCodeId, (map.get(item.qrCodeId) || 0) + 1);
      }

      const sorted = Array.from(map.entries())
        .map(([qrCodeId, count]) => ({
          qrCodeId,
          _count: { id: count },
        }))
        .sort((a, b) => b._count.id - a._count.id);

      return take ? sorted.slice(0, take) : sorted;
    });

    // Mock prisma.qRCode.findUnique
    (vi.spyOn(prisma.qRCode, 'findUnique') as any).mockImplementation(async ({ where, select }: any) => {
      const qr = qrStore.find((q) => q.shortCode === where.shortCode || q.id === where.id);
      if (!qr) return null;
      if (select) {
        const res: any = {
          id: qr.id,
          organizationId: qr.organizationId,
          status: qr.status,
          deletedAt: qr.deletedAt,
          expiresAt: null,
          destinations: qr.destinations,
        };
        return res;
      }
      return qr;
    });

    // Mock prisma.qRCode.findMany
    (vi.spyOn(prisma.qRCode, 'findMany') as any).mockImplementation(async ({ where }: any) => {
      return qrStore.filter((q) => {
        if (where.id?.in && !where.id.in.includes(q.id)) return false;
        if (where.organizationId && q.organizationId !== where.organizationId) return false;
        if (where.deletedAt === null && q.deletedAt !== null) return false;
        return true;
      });
    });

    // Mock prisma.qRCode.findFirst
    (vi.spyOn(prisma.qRCode, 'findFirst') as any).mockImplementation(async ({ where }: any) => {
      return (
        qrStore.find((q) => {
          if (where.id && q.id !== where.id) return false;
          if (where.organizationId && q.organizationId !== where.organizationId) return false;
          if (where.deletedAt === null && q.deletedAt !== null) return false;
          return true;
        }) || null
      );
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // =========================================================================
  // A. SCAN CAPTURE
  // =========================================================================
  describe('A. Scan Event Capture', () => {
    it('creates a valid scan event with correct organization, qrCode, and timestamp', async () => {
      const event = await captureScanEvent({
        organizationId: ORG_A,
        qrCodeId: QR_1,
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1',
        rawReferrer: 'https://l.instagram.com/?u=https%3A%2F%2Fexample.com',
        searchParams: new URLSearchParams('utm_source=table_tent&utm_medium=print&utm_campaign=summer_promo'),
      });

      expect(event).not.toBeNull();
      expect(event?.organizationId).toBe(ORG_A);
      expect(event?.qrCodeId).toBe(QR_1);
      expect(event?.deviceCategory).toBe(DeviceCategory.MOBILE);
      expect(event?.operatingSystem).toBe('iOS');
      expect(event?.browser).toBe('Safari');
      expect(event?.referrer).toBe('l.instagram.com');
      expect(event?.utmSource).toBe('table_tent');
      expect(event?.utmMedium).toBe('print');
      expect(event?.utmCampaign).toBe('summer_promo');
      expect(event?.scannedAt).toBeInstanceOf(Date);
    });
  });

  // =========================================================================
  // B. DEVICE DETECTION
  // =========================================================================
  describe('B. Device Category Classification', () => {
    it('classifies mobile devices accurately (iPhone, Android Mobile)', () => {
      const iPhone = parseUserAgent(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1'
      );
      expect(iPhone.deviceCategory).toBe(DeviceCategory.MOBILE);
      expect(iPhone.operatingSystem).toBe('iOS');

      const androidMobile = parseUserAgent(
        'Mozilla/5.0 (Linux; Android 13; SM-S908B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36'
      );
      expect(androidMobile.deviceCategory).toBe(DeviceCategory.MOBILE);
      expect(androidMobile.operatingSystem).toBe('Android');
    });

    it('classifies desktop devices accurately (Windows, macOS, Linux)', () => {
      const windows = parseUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
      );
      expect(windows.deviceCategory).toBe(DeviceCategory.DESKTOP);
      expect(windows.operatingSystem).toBe('Windows');

      const mac = parseUserAgent(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_4) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Safari/605.1.15'
      );
      expect(mac.deviceCategory).toBe(DeviceCategory.DESKTOP);
      expect(mac.operatingSystem).toBe('macOS');

      const linux = parseUserAgent(
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
      );
      expect(linux.deviceCategory).toBe(DeviceCategory.DESKTOP);
      expect(linux.operatingSystem).toBe('Linux');
    });

    it('classifies tablet devices accurately (iPad, Android Tablet)', () => {
      const iPad = parseUserAgent(
        'Mozilla/5.0 (iPad; CPU OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1'
      );
      expect(iPad.deviceCategory).toBe(DeviceCategory.TABLET);
      expect(iPad.operatingSystem).toBe('iOS');

      // Android tablet without 'Mobile' token
      const androidTablet = parseUserAgent(
        'Mozilla/5.0 (Linux; Android 12; SM-X800) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36'
      );
      expect(androidTablet.deviceCategory).toBe(DeviceCategory.TABLET);
      expect(androidTablet.operatingSystem).toBe('Android');
    });

    it('handles unknown or empty user agents gracefully without throwing', () => {
      const empty = parseUserAgent('');
      expect(empty.deviceCategory).toBe(DeviceCategory.UNKNOWN);
      expect(empty.operatingSystem).toBe('Unknown');
      expect(empty.browser).toBe('Unknown');

      const nullUa = parseUserAgent(null);
      expect(nullUa.deviceCategory).toBe(DeviceCategory.UNKNOWN);

      const bot = parseUserAgent('Googlebot/2.1 (+http://www.google.com/bot.html)');
      expect(bot.deviceCategory).toBe(DeviceCategory.UNKNOWN);
    });
  });

  // =========================================================================
  // C. OPERATING SYSTEM
  // =========================================================================
  describe('C. Operating System Classification', () => {
    it('detects Android, iOS, Windows, macOS, Linux', () => {
      expect(parseUserAgent('... Android 14 ...').operatingSystem).toBe('Android');
      expect(parseUserAgent('... iPhone OS 17 ...').operatingSystem).toBe('iOS');
      expect(parseUserAgent('... Windows NT 10.0 ...').operatingSystem).toBe('Windows');
      expect(parseUserAgent('... Macintosh; Intel Mac OS X ...').operatingSystem).toBe('macOS');
      expect(parseUserAgent('... X11; Linux x86_64 ...').operatingSystem).toBe('Linux');
      expect(parseUserAgent('... CrOS x86_64 ...').operatingSystem).toBe('Chrome OS');
    });
  });

  // =========================================================================
  // D. BROWSER CLASSIFICATION
  // =========================================================================
  describe('D. Browser Classification', () => {
    it('detects Chrome, Safari, Firefox, Edge, Samsung Internet', () => {
      // Samsung Internet
      const samsung = parseUserAgent(
        'Mozilla/5.0 (Linux; Android 13; SAMSUNG SM-G998B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/21.0 Chrome/110.0.5481.154 Mobile Safari/537.36'
      );
      expect(samsung.browser).toBe('Samsung Internet');

      // Edge
      const edge = parseUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36 Edg/114.0.1823.58'
      );
      expect(edge.browser).toBe('Edge');

      // Chrome
      const chrome = parseUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
      );
      expect(chrome.browser).toBe('Chrome');

      // Safari (no Chrome token)
      const safari = parseUserAgent(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_4) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Safari/605.1.15'
      );
      expect(safari.browser).toBe('Safari');

      // Firefox
      const firefox = parseUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/114.0'
      );
      expect(firefox.browser).toBe('Firefox');
    });
  });

  // =========================================================================
  // E. REFERRER SANITIZATION
  // =========================================================================
  describe('E. Referrer Sanitization & Privacy', () => {
    it('strips query parameters, search parameters, tokens, and fragments', () => {
      const dirty = 'https://l.instagram.com/direct/inbox?session_token=xyz123&user_id=456#frag';
      const clean = sanitizeReferrer(dirty);
      expect(clean).toBe('l.instagram.com');
      expect(clean).not.toContain('session_token');
      expect(clean).not.toContain('user_id');
      expect(clean).not.toContain('#frag');
    });

    it('returns null for missing, empty, or whitespace referrers', () => {
      expect(sanitizeReferrer(null)).toBeNull();
      expect(sanitizeReferrer(undefined)).toBeNull();
      expect(sanitizeReferrer('')).toBeNull();
      expect(sanitizeReferrer('   ')).toBeNull();
    });

    it('rejects unsafe schemes (javascript:, data:, file:)', () => {
      expect(sanitizeReferrer('javascript:alert(1)')).toBeNull();
      expect(sanitizeReferrer('data:text/html,<script>alert(1)</script>')).toBeNull();
    });

    it('rejects localhost, loopback, and local network referrers', () => {
      expect(sanitizeReferrer('http://localhost:3000/test')).toBeNull();
      expect(sanitizeReferrer('http://127.0.0.1:8080')).toBeNull();
      expect(sanitizeReferrer('http://server.local')).toBeNull();
    });
  });

  // =========================================================================
  // F. UTM ATTRIBUTION
  // =========================================================================
  describe('F. UTM Attribution & Sanitization', () => {
    it('extracts and sanitizes all standard UTM fields', () => {
      const params = new URLSearchParams({
        utm_source: 'counter_stand',
        utm_medium: 'physical_qr',
        utm_campaign: 'diwali_2026',
        utm_term: 'bengaluru_store',
        utm_content: 'v1_tent',
      });

      const utms = extractAndSanitizeUtm(params);
      expect(utms.utmSource).toBe('counter_stand');
      expect(utms.utmMedium).toBe('physical_qr');
      expect(utms.utmCampaign).toBe('diwali_2026');
      expect(utms.utmTerm).toBe('bengaluru_store');
      expect(utms.utmContent).toBe('v1_tent');
    });

    it('truncates oversized UTM values to prevent database bloat', () => {
      const hugeString = 'a'.repeat(500);
      const params = new URLSearchParams({
        utm_campaign: hugeString,
      });

      const utms = extractAndSanitizeUtm(params);
      expect(utms.utmCampaign).toHaveLength(100);
      expect(utms.utmCampaign).toBe('a'.repeat(100));
    });

    it('strips dangerous HTML tags and control characters from UTM fields', () => {
      const malicious = '<script>alert(1)</script>summer\r\nfestival\x00';
      const params = new URLSearchParams({
        utm_campaign: malicious,
      });

      const utms = extractAndSanitizeUtm(params);
      expect(utms.utmCampaign).toBe('alert(1)summerfestival');
      expect(utms.utmCampaign).not.toContain('<script>');
    });
  });

  // =========================================================================
  // G. PRIVACY GUARANTEES
  // =========================================================================
  describe('G. Privacy Model & Zero Raw IP Retention', () => {
    it('resolves coarse location from proxy headers without persisting raw IP', () => {
      const headers = new Headers();
      headers.set('cf-ipcountry', 'IN');
      headers.set('cf-region', 'Karnataka');
      headers.set('cf-ipcity', 'Bengaluru');
      headers.set('x-forwarded-for', '203.0.113.195'); // Client IP header

      const geo = resolveCoarseGeo(headers);
      expect(geo.country).toBe('IN');
      expect(geo.region).toBe('Karnataka');
      expect(geo.city).toBe('Bengaluru');

      // Verify raw IP is never exposed in coarse location
      expect(Object.values(geo)).not.toContain('203.0.113.195');
    });

    it('ensures scan events in database never contain raw IP, GPS, or raw User-Agent', async () => {
      const event = await captureScanEvent({
        organizationId: ORG_A,
        qrCodeId: QR_1,
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
        headers: new Headers({
          'cf-ipcountry': 'IN',
          'x-forwarded-for': '198.51.100.42',
        }),
      });

      expect(event).not.toBeNull();
      // Inspect saved event fields
      const savedKeys = Object.keys(event || {});
      expect(savedKeys).not.toContain('ip');
      expect(savedKeys).not.toContain('rawIp');
      expect(savedKeys).not.toContain('clientIp');
      expect(savedKeys).not.toContain('rawUserAgent');
      expect(savedKeys).not.toContain('gps');
      expect(savedKeys).not.toContain('latitude');
      expect(savedKeys).not.toContain('longitude');

      const allValues = Object.values(event || {}).map(String);
      expect(allValues.some((v) => v.includes('198.51.100.42'))).toBe(false);
    });
  });

  // =========================================================================
  // H. TENANT ISOLATION
  // =========================================================================
  describe('H. Tenant Scoping & Isolation', () => {
    it('prevents Organization A from viewing or querying Organization B analytics', async () => {
      // Seed 3 scans for Org A
      await captureScanEvent({ organizationId: ORG_A, qrCodeId: QR_1 });
      await captureScanEvent({ organizationId: ORG_A, qrCodeId: QR_1 });
      await captureScanEvent({ organizationId: ORG_A, qrCodeId: QR_2 });

      // Seed 2 scans for Org B
      await captureScanEvent({ organizationId: ORG_B, qrCodeId: QR_B });
      await captureScanEvent({ organizationId: ORG_B, qrCodeId: QR_B });

      const overviewA = await getAnalyticsOverview(ORG_A);
      const overviewB = await getAnalyticsOverview(ORG_B);

      expect(overviewA.totalScans).toBe(3);
      expect(overviewB.totalScans).toBe(2);

      // Attempt IDOR: query Org B's QR code using Org A's tenant boundary
      const crossTenantOverview = await getAnalyticsOverview(ORG_A, '7d', QR_B);
      expect(crossTenantOverview.totalScans).toBe(0);
    });
  });

  // =========================================================================
  // I. REDIRECT RESILIENCE (QR REDIRECT > ANALYTICS)
  // =========================================================================
  describe('I. Redirect Resilience (QR REDIRECT > ANALYTICS)', () => {
    it('Condition A: analytics succeeds → QR still returns 302 redirect', async () => {
      const req = new NextRequest('http://localhost:3000/q/abc1234', {
        headers: {
          'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)',
        },
      });

      const res = await GET(req, {
        params: Promise.resolve({ shortCode: 'abc1234' }),
      });

      expect(res.status).toBe(302);
      expect(res.headers.get('Location')).toBe('https://example.com/menu');
    });

    it('Condition B: analytics database operation fails → QR still returns 302 redirect', async () => {
      // Intentionally cause prisma.scanEvent.create to throw database exception
      (prisma.scanEvent.create as any).mockRejectedValueOnce(
        new Error('FATAL: Database connection timeout during scan capture')
      );

      const req = new NextRequest('http://localhost:3000/q/abc1234', {
        headers: {
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        },
      });

      const res = await GET(req, {
        params: Promise.resolve({ shortCode: 'abc1234' }),
      });

      // The redirect MUST still succeed!
      expect(res.status).toBe(302);
      expect(res.headers.get('Location')).toBe('https://example.com/menu');
    });

    it('Condition C: analytics throws unexpectedly → QR still returns 302 redirect', async () => {
      // Mock safeScheduleScan throwing a synchronous error to test outer try/catch
      const req = new NextRequest('http://localhost:3000/q/abc1234', {
        headers: {
          'user-agent': 'Corrupted UA string',
        },
      });

      (prisma.scanEvent.create as any).mockImplementationOnce(() => {
        throw new TypeError('Unexpected runtime exception in ingestion pipeline');
      });

      const res = await GET(req, {
        params: Promise.resolve({ shortCode: 'abc1234' }),
      });

      expect(res.status).toBe(302);
      expect(res.headers.get('Location')).toBe('https://example.com/menu');
    });

    it('Condition D: malformed analytics metadata → QR still returns 302 redirect', async () => {
      // Malformed request with invalid query params, illegal characters, and null headers
      const req = new NextRequest('http://localhost:3000/q/abc1234?utm_source=%E0%A4%A&utm_campaign=<script>hack</script>', {
        headers: {
          'user-agent': 'x'.repeat(2000),
          'referer': 'javascript:alert(1)',
          'cf-ipcountry': 'XX??1123',
        },
      });

      const res = await GET(req, {
        params: Promise.resolve({ shortCode: 'abc1234' }),
      });

      expect(res.status).toBe(302);
      expect(res.headers.get('Location')).toBe('https://example.com/menu');
    });

    it('Condition E: analytics service is completely unavailable → QR still returns 302 redirect', async () => {
      // Simulate database client completely unreachable (null prisma model or ECONNREFUSED)
      (prisma.scanEvent.create as any).mockRejectedValueOnce(
        new Error('ECONNREFUSED: Server disconnected on port 5432')
      );

      const req = new NextRequest('http://localhost:3000/q/abc1234', {
        headers: {
          'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)',
        },
      });

      const res = await GET(req, {
        params: Promise.resolve({ shortCode: 'abc1234' }),
      });

      expect(res.status).toBe(302);
      expect(res.headers.get('Location')).toBe('https://example.com/menu');
    });

    it('safeScheduleScan executes in background without throwing unhandled rejection', () => {
      expect(() => {
        safeScheduleScan({
          organizationId: ORG_A,
          qrCodeId: QR_1,
          userAgent: 'Test UA',
        });
      }).not.toThrow();
    });
  });

  // =========================================================================
  // J. DASHBOARD METRICS & AGGREGATIONS
  // =========================================================================
  describe('J. Dashboard Aggregations & Breakdowns', () => {
    beforeEach(async () => {
      // Populate deterministic events for Org A
      await captureScanEvent({
        organizationId: ORG_A,
        qrCodeId: QR_1,
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Mobile Safari',
        rawReferrer: 'https://instagram.com/explore',
        searchParams: new URLSearchParams('utm_campaign=launch_2026&utm_source=ig'),
        headers: new Headers({ 'cf-ipcountry': 'IN', 'cf-ipcity': 'Mumbai' }),
      });

      await captureScanEvent({
        organizationId: ORG_A,
        qrCodeId: QR_1,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/114.0.0.0',
        rawReferrer: 'https://facebook.com',
        searchParams: new URLSearchParams('utm_campaign=launch_2026&utm_source=fb'),
        headers: new Headers({ 'cf-ipcountry': 'IN', 'cf-ipcity': 'Pune' }),
      });

      await captureScanEvent({
        organizationId: ORG_A,
        qrCodeId: QR_2,
        userAgent: 'Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X) Mobile Safari',
        rawReferrer: 'https://instagram.com/story',
        headers: new Headers({ 'cf-ipcountry': 'US', 'cf-ipcity': 'San Jose' }),
      });
    });

    it('computes accurate totals for Today, 7 Days, and 30 Days', async () => {
      const overview = await getAnalyticsOverview(ORG_A);
      expect(overview.totalScans).toBe(3);
      expect(overview.scansToday).toBe(3);
      expect(overview.scans7d).toBe(3);
      expect(overview.scans30d).toBe(3);
    });

    it('generates continuous scan trend items for chart rendering', async () => {
      const trend7d = await getScanTrend(ORG_A, '7d');
      expect(trend7d).toHaveLength(7);
      const totalCount = trend7d.reduce((sum, item) => sum + item.count, 0);
      expect(totalCount).toBe(3);

      const trendToday = await getScanTrend(ORG_A, 'today');
      expect(trendToday).toHaveLength(24);
    });

    it('aggregates device breakdown with correct percentages', async () => {
      const deviceBreakdown = await getDimensionBreakdown(ORG_A, 'deviceCategory');
      expect(deviceBreakdown.length).toBeGreaterThan(0);

      const mobile = deviceBreakdown.find((d) => d.name === DeviceCategory.MOBILE);
      const desktop = deviceBreakdown.find((d) => d.name === DeviceCategory.DESKTOP);
      const tablet = deviceBreakdown.find((d) => d.name === DeviceCategory.TABLET);

      expect(mobile?.count).toBe(1);
      expect(desktop?.count).toBe(1);
      expect(tablet?.count).toBe(1);
    });

    it('aggregates geographic distribution (top countries and cities)', async () => {
      const geo = await getGeoBreakdown(ORG_A);
      expect(geo.countries.length).toBe(2); // IN and US

      const india = geo.countries.find((c) => c.name === 'IN');
      expect(india?.count).toBe(2);

      expect(geo.cities.length).toBe(3); // Mumbai, Pune, San Jose
    });

    it('aggregates UTM campaigns and attribution correctly', async () => {
      const utms = await getUtmBreakdown(ORG_A);
      expect(utms.length).toBeGreaterThan(0);
      const launch = utms.find((u) => u.campaign === 'launch_2026');
      expect(launch).toBeDefined();
    });

    it('ranks top performing QR codes for the active organization', async () => {
      const topQRs = await getTopQRCodes(ORG_A, '7d', 5);
      expect(topQRs.length).toBe(2);
      expect(topQRs[0].id).toBe(QR_1); // QR 1 has 2 scans
      expect(topQRs[0].periodScans).toBe(2);
      expect(topQRs[1].id).toBe(QR_2); // QR 2 has 1 scan
      expect(topQRs[1].periodScans).toBe(1);
    });

    it('returns QR-specific analytics summary for the QR details page', async () => {
      const summary = await getQRCodeAnalyticsSummary(ORG_A, QR_1);
      expect(summary.overview.totalScans).toBe(2);
      expect(summary.recentTrend).toHaveLength(7);
    });
  });
});
