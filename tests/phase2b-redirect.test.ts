import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import {
  resolveDynamicQRCode,
  isValidShortCode,
  resolverCache,
  getQRBaseUrl,
} from '../src/lib/qr/resolver';
import { GET } from '../src/app/q/[shortCode]/route';
import { prisma } from '../src/lib/db/prisma';

// Type representing the lean selected QRCode record in the resolver
interface LeanQRCodeRecord {
  id: string;
  status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED' | 'EXPIRED';
  expiresAt: Date | null;
  deletedAt: Date | null;
  destinations: {
    id: string;
    qrCodeId: string;
    destinationUrl: string;
    isActive: boolean;
  }[];
}

type MockQueryResult = Awaited<ReturnType<typeof prisma.qRCode.findUnique>>;
const asPrismaResult = (record: LeanQRCodeRecord): MockQueryResult =>
  record as unknown as MockQueryResult;

describe('Phase 2B: Dynamic QR Redirect Engine', () => {
  beforeEach(() => {
    resolverCache.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    resolverCache.clear();
    vi.restoreAllMocks();
  });

  // =========================================================================
  // 1. SHORT CODE SYNTACTIC VALIDATION
  // =========================================================================
  describe('Short Code Validation', () => {
    it('accepts valid 7-character Base62 short codes', () => {
      expect(isValidShortCode('abc1234')).toBe(true);
      expect(isValidShortCode('ABCDEFG')).toBe(true);
      expect(isValidShortCode('9876543')).toBe(true);
      expect(isValidShortCode('aB9zX10')).toBe(true);
    });

    it('rejects short codes that are too short, too long, or empty', () => {
      expect(isValidShortCode('')).toBe(false);
      expect(isValidShortCode('abc123')).toBe(false); // 6 chars
      expect(isValidShortCode('abc12345')).toBe(false); // 8 chars
      expect(isValidShortCode('short')).toBe(false);
    });

    it('rejects short codes containing non-Base62 characters', () => {
      expect(isValidShortCode('abc-123')).toBe(false);
      expect(isValidShortCode('abc_123')).toBe(false);
      expect(isValidShortCode('abc 123')).toBe(false);
      expect(isValidShortCode('abc$123')).toBe(false);
      expect(isValidShortCode('abc/123')).toBe(false);
      expect(isValidShortCode('abc.123')).toBe(false);
    });

    it('returns INVALID_CODE without hitting the database for malformed short codes', async () => {
      const dbSpy = vi.spyOn(prisma.qRCode, 'findUnique');

      const res = await resolveDynamicQRCode('bad-code');
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.status).toBe('INVALID_CODE');
      }
      expect(dbSpy).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // 2. SUCCESSFUL RESOLUTION & QUERY PRESERVATION
  // =========================================================================
  describe('Successful Destination Resolution', () => {
    it('resolves active QR code to destination URL', async () => {
      const mockQR: LeanQRCodeRecord = {
        id: 'qr_active_1',
        status: 'ACTIVE',
        expiresAt: null,
        deletedAt: null,
        destinations: [
          {
            id: 'dest_1',
            qrCodeId: 'qr_active_1',
            destinationUrl: 'https://quickqr.in/menu?category=drinks&table=12',
            isActive: true,
          },
        ],
      };

      vi.spyOn(prisma.qRCode, 'findUnique').mockResolvedValue(asPrismaResult(mockQR));

      const res = await resolveDynamicQRCode('abc1234');
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.destinationUrl).toBe('https://quickqr.in/menu?category=drinks&table=12');
        expect(res.shortCode).toBe('abc1234');
      }
    });

    it('preserves complex query parameters and fragments exactly', async () => {
      const destination = 'https://example.com/checkout?ref=qr_stand&utm_source=counter&utm_campaign=diwali#payment';
      const mockQR: LeanQRCodeRecord = {
        id: 'qr_complex_1',
        status: 'ACTIVE',
        expiresAt: null,
        deletedAt: null,
        destinations: [
          {
            id: 'dest_complex',
            qrCodeId: 'qr_complex_1',
            destinationUrl: destination,
            isActive: true,
          },
        ],
      };

      vi.spyOn(prisma.qRCode, 'findUnique').mockResolvedValue(asPrismaResult(mockQR));

      const res = await resolveDynamicQRCode('cmp1234');
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.destinationUrl).toBe(destination);
      }
    });
  });

  // =========================================================================
  // 3. STATUS HANDLING (PAUSED, EXPIRED, ARCHIVED, DELETED)
  // =========================================================================
  describe('QR Status Handling', () => {
    it('returns PAUSED status when QR status is PAUSED', async () => {
      const mockQR: LeanQRCodeRecord = {
        id: 'qr_paused',
        status: 'PAUSED',
        expiresAt: null,
        deletedAt: null,
        destinations: [
          {
            id: 'dest_p',
            qrCodeId: 'qr_paused',
            destinationUrl: 'https://example.com/menu',
            isActive: true,
          },
        ],
      };

      vi.spyOn(prisma.qRCode, 'findUnique').mockResolvedValue(asPrismaResult(mockQR));

      const res = await resolveDynamicQRCode('pau1234');
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.status).toBe('PAUSED');
      }
    });

    it('returns EXPIRED when QR status is EXPIRED', async () => {
      const mockQR: LeanQRCodeRecord = {
        id: 'qr_expired_1',
        status: 'EXPIRED',
        expiresAt: null,
        deletedAt: null,
        destinations: [
          {
            id: 'dest_e',
            qrCodeId: 'qr_expired_1',
            destinationUrl: 'https://example.com/promo',
            isActive: true,
          },
        ],
      };

      vi.spyOn(prisma.qRCode, 'findUnique').mockResolvedValue(asPrismaResult(mockQR));

      const res = await resolveDynamicQRCode('exp1234');
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.status).toBe('EXPIRED');
      }
    });

    it('returns EXPIRED when QR expiresAt timestamp has passed', async () => {
      const pastDate = new Date(Date.now() - 3600 * 1000); // 1 hour ago
      const mockQR: LeanQRCodeRecord = {
        id: 'qr_expired_by_date',
        status: 'ACTIVE',
        expiresAt: pastDate,
        deletedAt: null,
        destinations: [
          {
            id: 'dest_date',
            qrCodeId: 'qr_expired_by_date',
            destinationUrl: 'https://example.com/promo',
            isActive: true,
          },
        ],
      };

      vi.spyOn(prisma.qRCode, 'findUnique').mockResolvedValue(asPrismaResult(mockQR));

      const res = await resolveDynamicQRCode('exp2222');
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.status).toBe('EXPIRED');
      }
    });

    it('returns NOT_FOUND when QR is soft-deleted (deletedAt is set)', async () => {
      const mockQR: LeanQRCodeRecord = {
        id: 'qr_deleted',
        status: 'ACTIVE',
        expiresAt: null,
        deletedAt: new Date(),
        destinations: [
          {
            id: 'dest_d',
            qrCodeId: 'qr_deleted',
            destinationUrl: 'https://example.com/old',
            isActive: true,
          },
        ],
      };

      vi.spyOn(prisma.qRCode, 'findUnique').mockResolvedValue(asPrismaResult(mockQR));

      const res = await resolveDynamicQRCode('del1234');
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.status).toBe('NOT_FOUND');
      }
    });

    it('returns NOT_FOUND when QR record does not exist in database', async () => {
      vi.spyOn(prisma.qRCode, 'findUnique').mockResolvedValue(null);

      const res = await resolveDynamicQRCode('not1234');
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.status).toBe('NOT_FOUND');
      }
    });
  });

  // =========================================================================
  // 4. DESTINATION VALIDATION & SELECTION
  // =========================================================================
  describe('Destination Resolution & Determinism', () => {
    it('returns MISSING_DESTINATION if QR has no active destinations', async () => {
      const mockQR: LeanQRCodeRecord = {
        id: 'qr_no_dest',
        status: 'ACTIVE',
        expiresAt: null,
        deletedAt: null,
        destinations: [],
      };

      vi.spyOn(prisma.qRCode, 'findUnique').mockResolvedValue(asPrismaResult(mockQR));

      const res = await resolveDynamicQRCode('nod1234');
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.status).toBe('MISSING_DESTINATION');
      }
    });

    it('ensures destination belongs strictly to the requested QRCode (tenancy integrity)', async () => {
      const mockQR: LeanQRCodeRecord = {
        id: 'qr_legit_id',
        status: 'ACTIVE',
        expiresAt: null,
        deletedAt: null,
        destinations: [
          {
            id: 'dest_mismatched',
            qrCodeId: 'different_foreign_qr_id', // Malformed ownership
            destinationUrl: 'https://hacker.com',
            isActive: true,
          },
        ],
      };

      vi.spyOn(prisma.qRCode, 'findUnique').mockResolvedValue(asPrismaResult(mockQR));

      const res = await resolveDynamicQRCode('mis1234');
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.status).toBe('MISSING_DESTINATION');
      }
    });
  });

  // =========================================================================
  // 5. URL SAFETY & SSRF DEFENSE AT REDIRECT TIME
  // =========================================================================
  describe('URL Safety & Anti-SSRF Defense', () => {
    const dangerousUrls = [
      'javascript:alert(1)',
      'data:text/html;base64,PHNjcmlwdD4=',
      'file:///etc/passwd',
      'blob:https://example.com/uuid',
      'vbscript:msgbox(1)',
      'http://localhost:3000/admin',
      'http://127.0.0.1:8080',
      'http://[::1]:80',
      'http://0.0.0.0:8000',
      'http://10.0.0.1/internal',
      'http://172.16.0.1/admin',
      'http://192.168.1.1',
      'http://169.254.169.254/latest/meta-data/',
      'http://internal-db.local',
      'http://vault.corp',
    ];

    dangerousUrls.forEach((url) => {
      it(`rejects dangerous destination: ${url}`, async () => {
        const mockQR: LeanQRCodeRecord = {
          id: 'qr_ssrf',
          status: 'ACTIVE',
          expiresAt: null,
          deletedAt: null,
          destinations: [
            {
              id: 'dest_bad',
              qrCodeId: 'qr_ssrf',
              destinationUrl: url,
              isActive: true,
            },
          ],
        };

        vi.spyOn(prisma.qRCode, 'findUnique').mockResolvedValue(asPrismaResult(mockQR));

        const res = await resolveDynamicQRCode('srf1234');
        expect(res.success).toBe(false);
        if (!res.success) {
          expect(res.status).toBe('INVALID_DESTINATION');
        }
      });
    });
  });

  // =========================================================================
  // 6. CACHE-READY DESIGN & BOUNDED IN-MEMORY CACHE
  // =========================================================================
  describe('Bounded In-Memory Cache', () => {
    it('caches successful resolutions and serves cache hits', async () => {
      const mockQR: LeanQRCodeRecord = {
        id: 'qr_cached',
        status: 'ACTIVE',
        expiresAt: null,
        deletedAt: null,
        destinations: [
          {
            id: 'dest_c',
            qrCodeId: 'qr_cached',
            destinationUrl: 'https://cached.quickqr.in/page',
            isActive: true,
          },
        ],
      };

      const dbSpy = vi.spyOn(prisma.qRCode, 'findUnique').mockResolvedValue(asPrismaResult(mockQR));

      // First call: hits DB
      const res1 = await resolveDynamicQRCode('cac1234');
      expect(res1.success).toBe(true);
      expect(dbSpy).toHaveBeenCalledTimes(1);

      // Second call: served from in-memory cache
      const res2 = await resolveDynamicQRCode('cac1234');
      expect(res2.success).toBe(true);
      expect(dbSpy).toHaveBeenCalledTimes(1); // Not called again!
    });

    it('evicts entries when capacity is exceeded (FIFO bounded cache)', () => {
      // Set 1,001 entries into the cache to test bounding
      for (let i = 0; i < 1005; i++) {
        const code = `c${String(i).padStart(6, '0')}`;
        resolverCache.set(code, `https://example.com/${i}`);
      }

      // Max capacity is 1,000
      expect(resolverCache.size()).toBeLessThanOrEqual(1000);
    });
  });

  // =========================================================================
  // 7. ERROR SAFETY (DATABASE FAILURE)
  // =========================================================================
  describe('Error Safety & Information Hiding', () => {
    it('catches database exceptions safely without leaking stack traces', async () => {
      vi.spyOn(prisma.qRCode, 'findUnique').mockRejectedValue(
        new Error('FATAL: Connection refused on port 5432')
      );

      const res = await resolveDynamicQRCode('err1234');
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.status).toBe('ERROR');
        expect(res.error).toBe('An unexpected error occurred while resolving the QR code.');
        expect(res.error).not.toContain('5432');
      }
    });
  });

  // =========================================================================
  // 8. NEXT.JS ROUTE HANDLER (GET /q/{shortCode})
  // =========================================================================
  describe('Next.js Route Handler: GET /q/{shortCode}', () => {
    it('returns HTTP 302 with Location header on successful resolution', async () => {
      const destination = 'https://mycafe.in/today-special';
      const mockQR: LeanQRCodeRecord = {
        id: 'qr_route_ok',
        status: 'ACTIVE',
        expiresAt: null,
        deletedAt: null,
        destinations: [
          {
            id: 'dest_rt',
            qrCodeId: 'qr_route_ok',
            destinationUrl: destination,
            isActive: true,
          },
        ],
      };

      vi.spyOn(prisma.qRCode, 'findUnique').mockResolvedValue(asPrismaResult(mockQR));

      const request = new NextRequest('http://localhost:3000/q/ok12345');
      const response = await GET(request, {
        params: Promise.resolve({ shortCode: 'ok12345' }),
      });

      expect(response.status).toBe(302);
      expect(response.headers.get('location')).toBe(destination);
      expect(response.headers.get('cache-control')).toContain('no-store');
      expect(response.headers.get('x-robots-tag')).toBe('noindex, nofollow');
    });

    it('redirects to /q-status/paused when QR is paused', async () => {
      const mockQR: LeanQRCodeRecord = {
        id: 'qr_route_paused',
        status: 'PAUSED',
        expiresAt: null,
        deletedAt: null,
        destinations: [
          {
            id: 'dest_rt_p',
            qrCodeId: 'qr_route_paused',
            destinationUrl: 'https://example.com',
            isActive: true,
          },
        ],
      };

      vi.spyOn(prisma.qRCode, 'findUnique').mockResolvedValue(asPrismaResult(mockQR));

      const request = new NextRequest('http://localhost:3000/q/pau9999');
      const response = await GET(request, {
        params: Promise.resolve({ shortCode: 'pau9999' }),
      });

      expect(response.status).toBe(302);
      const baseUrl = getQRBaseUrl();
      expect(response.headers.get('location')).toBe(`${baseUrl}/q-status/paused`);
    });

    it('redirects to /q-status/expired when QR is expired', async () => {
      const mockQR: LeanQRCodeRecord = {
        id: 'qr_route_expired',
        status: 'EXPIRED',
        expiresAt: null,
        deletedAt: null,
        destinations: [
          {
            id: 'dest_rt_e',
            qrCodeId: 'qr_route_expired',
            destinationUrl: 'https://example.com',
            isActive: true,
          },
        ],
      };

      vi.spyOn(prisma.qRCode, 'findUnique').mockResolvedValue(asPrismaResult(mockQR));

      const request = new NextRequest('http://localhost:3000/q/exp9999');
      const response = await GET(request, {
        params: Promise.resolve({ shortCode: 'exp9999' }),
      });

      expect(response.status).toBe(302);
      const baseUrl = getQRBaseUrl();
      expect(response.headers.get('location')).toBe(`${baseUrl}/q-status/expired`);
    });

    it('redirects to /q-status/not-found when shortCode is invalid or nonexistent', async () => {
      vi.spyOn(prisma.qRCode, 'findUnique').mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/q/unknown');
      const response = await GET(request, {
        params: Promise.resolve({ shortCode: 'unknown' }),
      });

      expect(response.status).toBe(302);
      const baseUrl = getQRBaseUrl();
      expect(response.headers.get('location')).toBe(`${baseUrl}/q-status/not-found`);
    });

    it('cannot be manipulated via query parameters to override destination', async () => {
      const targetDestination = 'https://legit-merchant.in/pay';
      const mockQR: LeanQRCodeRecord = {
        id: 'qr_attack',
        status: 'ACTIVE',
        expiresAt: null,
        deletedAt: null,
        destinations: [
          {
            id: 'dest_attack',
            qrCodeId: 'qr_attack',
            destinationUrl: targetDestination,
            isActive: true,
          },
        ],
      };

      vi.spyOn(prisma.qRCode, 'findUnique').mockResolvedValue(asPrismaResult(mockQR));

      // Attacker attempts to pass a destination override query parameter
      const request = new NextRequest('http://localhost:3000/q/atk1234?destination=https://malicious.com&redirect=https://evil.com');
      const response = await GET(request, {
        params: Promise.resolve({ shortCode: 'atk1234' }),
      });

      expect(response.status).toBe(302);
      // Destination remains the authentic database destination; query overrides are ignored
      expect(response.headers.get('location')).toBe(targetDestination);
      expect(response.headers.get('location')).not.toContain('malicious.com');
    });
  });
});
