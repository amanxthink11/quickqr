/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createApiKey,
  listApiKeys,
  revokeApiKey,
  authenticateApiKey,
  hashApiKey,
  extractKeyPrefix,
  API_KEY_PREFIX,
} from '../src/lib/api-keys/service';
import { authenticateApiRequest } from '../src/lib/api/auth';
import { checkApiRateLimit } from '../src/lib/api/rate-limit';
import { GET as listQRsHandler, POST as createQRHandler } from '../src/app/api/v1/qr-codes/route';
import {
  GET as getQRHandler,
  PATCH as patchQRHandler,
  DELETE as deleteQRHandler,
} from '../src/app/api/v1/qr-codes/[id]/route';
import { POST as pauseQRHandler } from '../src/app/api/v1/qr-codes/[id]/pause/route';
import { POST as resumeQRHandler } from '../src/app/api/v1/qr-codes/[id]/resume/route';
import { GET as qrAnalyticsHandler } from '../src/app/api/v1/qr-codes/[id]/analytics/route';
import { GET as orgAnalyticsHandler } from '../src/app/api/v1/analytics/route';
import { GET as listWidgetsHandler, POST as createWidgetHandler } from '../src/app/api/v1/widgets/route';
import {
  GET as getWidgetHandler,
  PATCH as patchWidgetHandler,
  DELETE as deleteWidgetHandler,
} from '../src/app/api/v1/widgets/[id]/route';
import { POST as pauseWidgetHandler } from '../src/app/api/v1/widgets/[id]/pause/route';
import { POST as resumeWidgetHandler } from '../src/app/api/v1/widgets/[id]/resume/route';
import { prisma } from '../src/lib/db/prisma';
import { NextRequest } from 'next/server';

interface TestApiKey {
  id: string;
  organizationId: string;
  name: string;
  keyPrefix: string;
  keyHash: string;
  scopes: string[];
  createdAt: Date;
  updatedAt: Date;
  lastUsedAt: Date | null;
  expiresAt: Date | null;
  revokedAt: Date | null;
}

interface TestOrganization {
  id: string;
  name: string;
  slug: string;
  deletedAt: Date | null;
}

interface TestMembership {
  id: string;
  userId: string;
  organizationId: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
}

interface TestQRCode {
  id: string;
  organizationId: string;
  shortCode: string;
  title: string;
  type: string;
  status: string;
  styling: any;
  expiresAt: Date | null;
  scanLimit: number | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  destinations?: any[];
}

interface TestWidget {
  id: string;
  organizationId: string;
  publicId: string;
  name: string;
  status: 'ACTIVE' | 'PAUSED';
  configuration: any;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

describe('Phase 2F: Developer REST API & API Key Infrastructure', () => {
  let apiKeyStore: TestApiKey[] = [];
  let orgStore: TestOrganization[] = [];
  let membershipStore: TestMembership[] = [];
  let qrStore: TestQRCode[] = [];
  let widgetStore: TestWidget[] = [];

  const ORG_ALPHA = 'org_tenant_alpha';
  const ORG_BETA = 'org_tenant_beta';

  const USER_OWNER = 'user_owner';
  const USER_ADMIN = 'user_admin';
  const USER_MEMBER = 'user_member';
  const USER_VIEWER = 'user_viewer';

  beforeEach(() => {
    vi.restoreAllMocks();

    apiKeyStore = [];
    orgStore = [
      { id: ORG_ALPHA, name: 'Acme Retail', slug: 'acme-retail', deletedAt: null },
      { id: ORG_BETA, name: 'Beta Corp', slug: 'beta-corp', deletedAt: null },
    ];

    membershipStore = [
      { id: 'm_owner', userId: USER_OWNER, organizationId: ORG_ALPHA, role: 'OWNER' },
      { id: 'm_admin', userId: USER_ADMIN, organizationId: ORG_ALPHA, role: 'ADMIN' },
      { id: 'm_member', userId: USER_MEMBER, organizationId: ORG_ALPHA, role: 'MEMBER' },
      { id: 'm_viewer', userId: USER_VIEWER, organizationId: ORG_ALPHA, role: 'VIEWER' },
    ];

    qrStore = [
      {
        id: 'qr_alpha_1',
        organizationId: ORG_ALPHA,
        shortCode: 'abc1234',
        title: 'Alpha Menu',
        type: 'DYNAMIC_URL',
        status: 'ACTIVE',
        styling: {},
        expiresAt: null,
        scanLimit: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        destinations: [
          { id: 'dest_1', qrCodeId: 'qr_alpha_1', destinationUrl: 'https://acme.com/menu', isActive: true, createdAt: new Date() },
        ],
      },
      {
        id: 'qr_beta_1',
        organizationId: ORG_BETA,
        shortCode: 'xyz9876',
        title: 'Beta Catalog',
        type: 'DYNAMIC_URL',
        status: 'ACTIVE',
        styling: {},
        expiresAt: null,
        scanLimit: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        destinations: [
          { id: 'dest_2', qrCodeId: 'qr_beta_1', destinationUrl: 'https://beta.com/cat', isActive: true, createdAt: new Date() },
        ],
      },
    ];

    widgetStore = [
      {
        id: 'wgt_alpha_1',
        organizationId: ORG_ALPHA,
        publicId: 'wgt_pub_alpha',
        name: 'Alpha Widget',
        status: 'ACTIVE',
        configuration: { type: 'upi', title: 'Pay Alpha' },
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      },
      {
        id: 'wgt_beta_1',
        organizationId: ORG_BETA,
        publicId: 'wgt_pub_beta',
        name: 'Beta Widget',
        status: 'ACTIVE',
        configuration: { type: 'upi', title: 'Pay Beta' },
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      },
    ];

    // Mock Membership queries
    (vi.spyOn(prisma.membership, 'findUnique') as any).mockImplementation(async (args: any) => {
      const { userId, organizationId } = args.where.userId_organizationId;
      return membershipStore.find((m) => m.userId === userId && m.organizationId === organizationId) || null;
    });

    // Mock ApiKey queries
    (vi.spyOn(prisma.apiKey, 'create') as any).mockImplementation(async (args: any) => {
      const created: TestApiKey = {
        id: `key_${Date.now()}_${Math.random()}`,
        organizationId: args.data.organizationId,
        name: args.data.name,
        keyPrefix: args.data.keyPrefix,
        keyHash: args.data.keyHash,
        scopes: args.data.scopes || ['*'],
        createdAt: new Date(Date.now() + apiKeyStore.length * 1000),
        updatedAt: new Date(),
        lastUsedAt: null,
        expiresAt: args.data.expiresAt || null,
        revokedAt: null,
      };
      apiKeyStore.push(created);
      return created;
    });

    (vi.spyOn(prisma.apiKey, 'findMany') as any).mockImplementation(async (args: any) => {
      let filtered = [...apiKeyStore];
      if (args?.where?.organizationId) {
        filtered = filtered.filter((k) => k.organizationId === args.where.organizationId);
      }
      if (args?.where?.keyPrefix) {
        filtered = filtered.filter((k) => k.keyPrefix === args.where.keyPrefix);
      }
      if (args?.where?.revokedAt === null) {
        filtered = filtered.filter((k) => k.revokedAt === null);
      }
      filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      if (args?.select) {
        return filtered.map((k) => {
          const selected: any = {};
          for (const key of Object.keys(args.select)) {
            if (args.select[key]) {
              selected[key] = (k as any)[key];
            }
          }
          return selected;
        });
      }
      if (args?.include?.organization) {
        return filtered.map((k) => ({
          ...k,
          organization: orgStore.find((o) => o.id === k.organizationId),
        }));
      }
      return filtered;
    });

    (vi.spyOn(prisma.apiKey, 'findFirst') as any).mockImplementation(async (args: any) => {
      let filtered = [...apiKeyStore];
      if (args?.where?.id) {
        filtered = filtered.filter((k) => k.id === args.where.id);
      }
      if (args?.where?.organizationId) {
        filtered = filtered.filter((k) => k.organizationId === args.where.organizationId);
      }
      return filtered[0] || null;
    });

    (vi.spyOn(prisma.apiKey, 'update') as any).mockImplementation(async (args: any) => {
      const idx = apiKeyStore.findIndex((k) => k.id === args.where.id);
      if (idx === -1) throw new Error('ApiKey not found');
      apiKeyStore[idx] = { ...apiKeyStore[idx], ...args.data };
      return apiKeyStore[idx];
    });

    // Mock QRCode queries
    (vi.spyOn(prisma.qRCode, 'findUnique') as any).mockImplementation(async (args: any) => {
      if (args?.where?.shortCode) {
        return qrStore.find((q) => q.shortCode === args.where.shortCode && q.deletedAt === null) || null;
      }
      if (args?.where?.id) {
        return qrStore.find((q) => q.id === args.where.id && q.deletedAt === null) || null;
      }
      return null;
    });

    (vi.spyOn(prisma.qRCode, 'findFirst') as any).mockImplementation(async (args: any) => {
      return (
        qrStore.find(
          (q) =>
            q.id === args.where.id &&
            q.organizationId === args.where.organizationId &&
            q.deletedAt === null
        ) || null
      );
    });

    (vi.spyOn(prisma.qRCode, 'findMany') as any).mockImplementation(async (args: any) => {
      return qrStore.filter(
        (q) => q.organizationId === args.where.organizationId && q.deletedAt === null
      );
    });

    (vi.spyOn(prisma.qRCode, 'count') as any).mockImplementation(async (args: any) => {
      return qrStore.filter(
        (q) => q.organizationId === args.where.organizationId && q.deletedAt === null
      ).length;
    });

    (vi.spyOn(prisma.qRCode, 'create') as any).mockImplementation(async (args: any) => {
      const created: TestQRCode = {
        id: `qr_${Date.now()}`,
        organizationId: args.data.organizationId,
        shortCode: args.data.shortCode,
        title: args.data.title,
        type: args.data.type || 'DYNAMIC_URL',
        status: 'ACTIVE',
        styling: args.data.styling || {},
        expiresAt: args.data.expiresAt || null,
        scanLimit: args.data.scanLimit || null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        destinations: args.data.destinations?.create
          ? [
              {
                id: `dest_${Date.now()}`,
                destinationUrl: args.data.destinations.create.destinationUrl,
                isActive: true,
                createdAt: new Date(),
              },
            ]
          : [],
      };
      qrStore.push(created);
      return created;
    });

    (vi.spyOn(prisma.qRCode, 'update') as any).mockImplementation(async (args: any) => {
      const idx = qrStore.findIndex((q) => q.id === args.where.id);
      if (idx === -1) throw new Error('QRCode not found');
      qrStore[idx] = { ...qrStore[idx], ...args.data, updatedAt: new Date() };
      return qrStore[idx];
    });

    (vi.spyOn(prisma, '$transaction') as any).mockImplementation(async (cb: any) => {
      const txMock = {
        qRCodeDestination: {
          updateMany: vi.fn(),
          create: vi.fn().mockImplementation(async (d: any) => {
            const qr = qrStore.find((q) => q.id === d.data.qrCodeId);
            if (qr) {
              qr.destinations = [{ id: 'dest_new', destinationUrl: d.data.destinationUrl, isActive: true, createdAt: new Date() }];
            }
          }),
        },
        qRCode: {
          update: vi.fn().mockImplementation(async (args: any) => {
            const idx = qrStore.findIndex((q) => q.id === args.where.id);
            if (idx !== -1) {
              qrStore[idx] = { ...qrStore[idx], ...args.data, updatedAt: new Date() };
              return qrStore[idx];
            }
          }),
        },
      };
      return cb(txMock);
    });

    // Mock Widget queries
    (vi.spyOn(prisma.widget, 'findUnique') as any).mockImplementation(async (args: any) => {
      if (args?.where?.publicId) {
        return widgetStore.find((w) => w.publicId === args.where.publicId && w.deletedAt === null) || null;
      }
      if (args?.where?.id) {
        return widgetStore.find((w) => w.id === args.where.id && w.deletedAt === null) || null;
      }
      return null;
    });

    (vi.spyOn(prisma.widget, 'findFirst') as any).mockImplementation(async (args: any) => {
      return (
        widgetStore.find(
          (w) =>
            w.id === args.where.id &&
            w.organizationId === args.where.organizationId &&
            w.deletedAt === null
        ) || null
      );
    });

    (vi.spyOn(prisma.widget, 'findMany') as any).mockImplementation(async (args: any) => {
      return widgetStore.filter(
        (w) => w.organizationId === args.where.organizationId && w.deletedAt === null
      );
    });

    (vi.spyOn(prisma.widget, 'count') as any).mockImplementation(async (args: any) => {
      return widgetStore.filter(
        (w) => w.organizationId === args.where.organizationId && w.deletedAt === null
      ).length;
    });

    (vi.spyOn(prisma.widget, 'create') as any).mockImplementation(async (args: any) => {
      const created: TestWidget = {
        id: `wgt_${Date.now()}`,
        organizationId: args.data.organizationId,
        publicId: args.data.publicId,
        name: args.data.name,
        status: 'ACTIVE',
        configuration: args.data.configuration,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };
      widgetStore.push(created);
      return created;
    });

    (vi.spyOn(prisma.widget, 'update') as any).mockImplementation(async (args: any) => {
      const idx = widgetStore.findIndex((w) => w.id === args.where.id);
      if (idx === -1) throw new Error('Widget not found');
      widgetStore[idx] = { ...widgetStore[idx], ...args.data, updatedAt: new Date() };
      return widgetStore[idx];
    });

    // Mock ScanEvent queries
    (vi.spyOn(prisma.scanEvent, 'count') as any).mockResolvedValue(15);
    (vi.spyOn(prisma.scanEvent, 'findMany') as any).mockResolvedValue([]);
    (vi.spyOn(prisma.scanEvent, 'groupBy') as any).mockResolvedValue([]);
  });

  // =========================================================================
  // 1. API KEY INFRASTRUCTURE TESTS
  // =========================================================================
  describe('1. API Key Generation & Cryptographic Storage', () => {
    it('generates an API key with qk_live_ prefix and 256 bits entropy', async () => {
      const result = await createApiKey(USER_OWNER, ORG_ALPHA, { name: 'Zapier Key' });

      expect(result.rawKey).toMatch(/^qk_live_[0-9a-fA-F]{64}$/);
      expect(result.apiKey.name).toBe('Zapier Key');
      expect(result.apiKey.keyPrefix).toBe(extractKeyPrefix(result.rawKey));
      expect(result.apiKey.keyPrefix.length).toBe(16);
      expect((result.apiKey as any).keyHash).toBeUndefined(); // Raw hash never leaked in safe object
    });

    it('stores strictly the SHA-256 hash in the database, never the raw key', async () => {
      const result = await createApiKey(USER_ADMIN, ORG_ALPHA, { name: 'Backend Key' });
      const stored = apiKeyStore.find((k) => k.id === result.apiKey.id);

      expect(stored).toBeDefined();
      expect(stored!.keyHash).toBe(hashApiKey(result.rawKey));
      expect(stored!.keyHash).not.toBe(result.rawKey);
      expect(result.rawKey.includes(stored!.keyHash)).toBe(false);
    });

    it('enforces RBAC on key creation: OWNER and ADMIN allowed, MEMBER and VIEWER denied', async () => {
      await expect(createApiKey(USER_OWNER, ORG_ALPHA, { name: 'Owner Key' })).resolves.toBeDefined();
      await expect(createApiKey(USER_ADMIN, ORG_ALPHA, { name: 'Admin Key' })).resolves.toBeDefined();

      await expect(createApiKey(USER_MEMBER, ORG_ALPHA, { name: 'Member Key' })).rejects.toThrow(/FORBIDDEN/i);
      await expect(createApiKey(USER_VIEWER, ORG_ALPHA, { name: 'Viewer Key' })).rejects.toThrow(/FORBIDDEN/i);
    });

    it('lists API keys for organization excluding raw hashes', async () => {
      await createApiKey(USER_ADMIN, ORG_ALPHA, { name: 'Key 1' });
      await createApiKey(USER_ADMIN, ORG_ALPHA, { name: 'Key 2' });

      const keys = await listApiKeys(USER_ADMIN, ORG_ALPHA);
      expect(keys.length).toBe(2);
      expect(keys[0].name).toBe('Key 2');
      expect((keys[0] as any).keyHash).toBeUndefined();
    });

    it('revokes an API key immediately and prevents subsequent authentication', async () => {
      const { apiKey, rawKey } = await createApiKey(USER_ADMIN, ORG_ALPHA, { name: 'Expiring Key' });

      // Authenticate successfully before revocation
      const authBefore = await authenticateApiKey(rawKey);
      expect(authBefore).not.toBeNull();

      // Revoke
      await revokeApiKey(USER_ADMIN, ORG_ALPHA, apiKey.id);

      // Authenticate fails after revocation
      const authAfter = await authenticateApiKey(rawKey);
      expect(authAfter).toBeNull();
    });

    it('fails authentication if the key is expired', async () => {
      const pastDate = new Date(Date.now() - 1000 * 60 * 60);
      const { rawKey } = await createApiKey(USER_ADMIN, ORG_ALPHA, {
        name: 'Expired Key',
        expiresAt: pastDate,
      });

      const auth = await authenticateApiKey(rawKey);
      expect(auth).toBeNull();
    });

    it('fails authentication if the organization has been soft-deleted', async () => {
      const { rawKey } = await createApiKey(USER_ADMIN, ORG_ALPHA, { name: 'Active Key' });

      // Soft delete organization
      const org = orgStore.find((o) => o.id === ORG_ALPHA);
      org!.deletedAt = new Date();

      const auth = await authenticateApiKey(rawKey);
      expect(auth).toBeNull();
    });
  });

  // =========================================================================
  // 2. HTTP AUTHENTICATION & HEADER TESTS
  // =========================================================================
  describe('2. HTTP Authorization Header Handling', () => {
    it('returns 401 when Authorization header is missing', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/qr-codes');
      const auth = await authenticateApiRequest(req);

      expect(auth.success).toBe(false);
      if (!auth.success) {
        expect(auth.response.status).toBe(401);
        const json = await auth.response.json();
        expect(json.error.code).toBe('UNAUTHORIZED');
      }
    });

    it('returns 401 when Authorization format is not Bearer', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/qr-codes', {
        headers: { Authorization: 'Basic dXNlcjpwYXNz' },
      });
      const auth = await authenticateApiRequest(req);

      expect(auth.success).toBe(false);
      if (!auth.success) {
        expect(auth.response.status).toBe(401);
        const json = await auth.response.json();
        expect(json.error.message).toMatch(/Expected Bearer/i);
      }
    });

    it('returns 401 with generic error for invalid or fabricated keys', async () => {
      const fakeKey = `${API_KEY_PREFIX}${'a'.repeat(64)}`;
      const req = new NextRequest('http://localhost:3000/api/v1/qr-codes', {
        headers: { Authorization: `Bearer ${fakeKey}` },
      });
      const auth = await authenticateApiRequest(req);

      expect(auth.success).toBe(false);
      if (!auth.success) {
        expect(auth.response.status).toBe(401);
        const json = await auth.response.json();
        expect(json.error.code).toBe('UNAUTHORIZED');
        expect(json.error.message).toMatch(/Invalid, expired, or revoked API key/i);
      }
    });

    it('successfully authenticates with valid Bearer key and returns tenant context', async () => {
      const { rawKey } = await createApiKey(USER_ADMIN, ORG_ALPHA, { name: 'Valid Key' });
      const req = new NextRequest('http://localhost:3000/api/v1/qr-codes', {
        headers: { Authorization: `Bearer ${rawKey}` },
      });

      const auth = await authenticateApiRequest(req);
      expect(auth.success).toBe(true);
      if (auth.success) {
        expect(auth.context.organization.id).toBe(ORG_ALPHA);
        expect(auth.context.apiKey.name).toBe('Valid Key');
      }
    });

    it('blocks request with 403 when API key lacks required scope', async () => {
      const { rawKey } = await createApiKey(USER_ADMIN, ORG_ALPHA, {
        name: 'Scoped Key',
        scopes: ['qr:read'],
      });

      const req = new NextRequest('http://localhost:3000/api/v1/qr-codes', {
        headers: { Authorization: `Bearer ${rawKey}` },
      });

      const auth = await authenticateApiRequest(req, { requiredScope: 'qr:write' });
      expect(auth.success).toBe(false);
      if (!auth.success) {
        expect(auth.response.status).toBe(403);
        const json = await auth.response.json();
        expect(json.error.code).toBe('FORBIDDEN');
      }
    });
  });

  // =========================================================================
  // 3. TENANT ISOLATION TESTS
  // =========================================================================
  describe('3. Multi-Tenant Boundary Enforcement', () => {
    it('Organization A key cannot view Organization B QR code (returns 404)', async () => {
      const { rawKey } = await createApiKey(USER_ADMIN, ORG_ALPHA, { name: 'Alpha Key' });

      // Request Organization B's QR code (qr_beta_1)
      const req = new NextRequest('http://localhost:3000/api/v1/qr-codes/qr_beta_1', {
        headers: { Authorization: `Bearer ${rawKey}` },
      });

      const res = await getQRHandler(req, { params: Promise.resolve({ id: 'qr_beta_1' }) });
      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.error.code).toBe('NOT_FOUND');
    });

    it('Organization A key cannot update Organization B QR code', async () => {
      const { rawKey } = await createApiKey(USER_ADMIN, ORG_ALPHA, { name: 'Alpha Key' });

      const req = new NextRequest('http://localhost:3000/api/v1/qr-codes/qr_beta_1', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${rawKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ destinationUrl: 'https://hacked.com' }),
      });

      const res = await patchQRHandler(req, { params: Promise.resolve({ id: 'qr_beta_1' }) });
      expect(res.status).toBe(404);
    });

    it('Organization A key cannot delete Organization B QR code', async () => {
      const { rawKey } = await createApiKey(USER_ADMIN, ORG_ALPHA, { name: 'Alpha Key' });

      const req = new NextRequest('http://localhost:3000/api/v1/qr-codes/qr_beta_1', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${rawKey}` },
      });

      const res = await deleteQRHandler(req, { params: Promise.resolve({ id: 'qr_beta_1' }) });
      expect(res.status).toBe(404);
    });

    it('Organization A key cannot view Organization B widget', async () => {
      const { rawKey } = await createApiKey(USER_ADMIN, ORG_ALPHA, { name: 'Alpha Key' });

      const req = new NextRequest('http://localhost:3000/api/v1/widgets/wgt_beta_1', {
        headers: { Authorization: `Bearer ${rawKey}` },
      });

      const res = await getWidgetHandler(req, { params: Promise.resolve({ id: 'wgt_beta_1' }) });
      expect(res.status).toBe(404);
    });
  });

  // =========================================================================
  // 4. QR CODES API CRUD & LIFECYCLE
  // =========================================================================
  describe('4. Dynamic QR Codes REST API', () => {
    it('GET /api/v1/qr-codes returns paginated list of tenant QR codes', async () => {
      const { rawKey } = await createApiKey(USER_ADMIN, ORG_ALPHA, { name: 'Alpha Key' });

      const req = new NextRequest('http://localhost:3000/api/v1/qr-codes?page=1&limit=10', {
        headers: { Authorization: `Bearer ${rawKey}` },
      });

      const res = await listQRsHandler(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.data).toBeDefined();
      expect(Array.isArray(json.data)).toBe(true);
      expect(json.data.length).toBe(1);
      expect(json.data[0].id).toBe('qr_alpha_1');
      expect(json.pagination.total).toBe(1);
    });

    it('POST /api/v1/qr-codes creates a new dynamic QR code with validated destination', async () => {
      const { rawKey } = await createApiKey(USER_ADMIN, ORG_ALPHA, { name: 'Alpha Key' });

      const req = new NextRequest('http://localhost:3000/api/v1/qr-codes', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${rawKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Store Standee',
          destinationUrl: 'https://store.in/offers',
        }),
      });

      const res = await createQRHandler(req);
      expect(res.status).toBe(201);

      const json = await res.json();
      expect(json.data.title).toBe('Store Standee');
      expect(json.data.destinationUrl).toBe('https://store.in/offers');
      expect(json.data.shortCode).toBeDefined();
    });

    it('POST /api/v1/qr-codes rejects dangerous SSRF destination URLs with 422', async () => {
      const { rawKey } = await createApiKey(USER_ADMIN, ORG_ALPHA, { name: 'Alpha Key' });

      const req = new NextRequest('http://localhost:3000/api/v1/qr-codes', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${rawKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Dangerous QR',
          destinationUrl: 'http://169.254.169.254/latest/meta-data/',
        }),
      });

      const res = await createQRHandler(req);
      expect(res.status).toBe(422);

      const json = await res.json();
      expect(json.error.code).toBe('VALIDATION_ERROR');
    });

    it('POST /api/v1/qr-codes rejects malformed JSON with 400', async () => {
      const { rawKey } = await createApiKey(USER_ADMIN, ORG_ALPHA, { name: 'Alpha Key' });

      const req = new NextRequest('http://localhost:3000/api/v1/qr-codes', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${rawKey}`,
          'Content-Type': 'application/json',
        },
        body: '{ malformed json',
      });

      const res = await createQRHandler(req);
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.error.code).toBe('INVALID_REQUEST');
    });

    it('PATCH /api/v1/qr-codes/:id updates destination URL', async () => {
      const { rawKey } = await createApiKey(USER_ADMIN, ORG_ALPHA, { name: 'Alpha Key' });

      const req = new NextRequest('http://localhost:3000/api/v1/qr-codes/qr_alpha_1', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${rawKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ destinationUrl: 'https://acme.com/new-menu' }),
      });

      const res = await patchQRHandler(req, { params: Promise.resolve({ id: 'qr_alpha_1' }) });
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.data.id).toBe('qr_alpha_1');
    });

    it('POST /api/v1/qr-codes/:id/pause pauses QR code', async () => {
      const { rawKey } = await createApiKey(USER_ADMIN, ORG_ALPHA, { name: 'Alpha Key' });

      const req = new NextRequest('http://localhost:3000/api/v1/qr-codes/qr_alpha_1/pause', {
        method: 'POST',
        headers: { Authorization: `Bearer ${rawKey}` },
      });

      const res = await pauseQRHandler(req, { params: Promise.resolve({ id: 'qr_alpha_1' }) });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.status).toBe('PAUSED');
    });

    it('POST /api/v1/qr-codes/:id/resume resumes QR code', async () => {
      const { rawKey } = await createApiKey(USER_ADMIN, ORG_ALPHA, { name: 'Alpha Key' });

      const req = new NextRequest('http://localhost:3000/api/v1/qr-codes/qr_alpha_1/resume', {
        method: 'POST',
        headers: { Authorization: `Bearer ${rawKey}` },
      });

      const res = await resumeQRHandler(req, { params: Promise.resolve({ id: 'qr_alpha_1' }) });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.status).toBe('ACTIVE');
    });

    it('DELETE /api/v1/qr-codes/:id soft-deletes QR code', async () => {
      const { rawKey } = await createApiKey(USER_ADMIN, ORG_ALPHA, { name: 'Alpha Key' });

      const req = new NextRequest('http://localhost:3000/api/v1/qr-codes/qr_alpha_1', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${rawKey}` },
      });

      const res = await deleteQRHandler(req, { params: Promise.resolve({ id: 'qr_alpha_1' }) });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.deleted).toBe(true);
    });
  });

  // =========================================================================
  // 5. ANALYTICS API
  // =========================================================================
  describe('5. Analytics REST API', () => {
    it('GET /api/v1/qr-codes/:id/analytics returns scan metrics for a specific QR', async () => {
      const { rawKey } = await createApiKey(USER_ADMIN, ORG_ALPHA, { name: 'Alpha Key' });

      const req = new NextRequest('http://localhost:3000/api/v1/qr-codes/qr_alpha_1/analytics?range=7d', {
        headers: { Authorization: `Bearer ${rawKey}` },
      });

      const res = await qrAnalyticsHandler(req, { params: Promise.resolve({ id: 'qr_alpha_1' }) });
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.data.qrCodeId).toBe('qr_alpha_1');
      expect(json.data.range).toBe('7d');
      expect(json.data.overview).toBeDefined();
    });

    it('GET /api/v1/analytics returns organization-wide analytics report', async () => {
      const { rawKey } = await createApiKey(USER_ADMIN, ORG_ALPHA, { name: 'Alpha Key' });

      const req = new NextRequest('http://localhost:3000/api/v1/analytics?range=30d', {
        headers: { Authorization: `Bearer ${rawKey}` },
      });

      const res = await orgAnalyticsHandler(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.data.organizationId).toBe(ORG_ALPHA);
      expect(json.data.range).toBe('30d');
      expect(json.data.overview).toBeDefined();
    });
  });

  // =========================================================================
  // 6. WIDGET REST API
  // =========================================================================
  describe('6. Website Widgets REST API', () => {
    it('GET /api/v1/widgets returns list of widgets', async () => {
      const { rawKey } = await createApiKey(USER_ADMIN, ORG_ALPHA, { name: 'Alpha Key' });

      const req = new NextRequest('http://localhost:3000/api/v1/widgets', {
        headers: { Authorization: `Bearer ${rawKey}` },
      });

      const res = await listWidgetsHandler(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.data.length).toBe(1);
      expect(json.data[0].id).toBe('wgt_alpha_1');
    });

    it('POST /api/v1/widgets creates a new widget with sanitized configuration', async () => {
      const { rawKey } = await createApiKey(USER_ADMIN, ORG_ALPHA, { name: 'Alpha Key' });

      const req = new NextRequest('http://localhost:3000/api/v1/widgets', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${rawKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'New Checkout Widget',
          config: { type: 'upi', title: 'Pay with UPI', upiId: 'merchant@okaxis', payeeName: 'Acme Store' },
        }),
      });

      const res = await createWidgetHandler(req);
      expect(res.status).toBe(201);

      const json = await res.json();
      expect(json.data.name).toBe('New Checkout Widget');
      expect(json.data.publicId).toBeDefined();
    });

    it('GET /api/v1/widgets/:id retrieves a single widget', async () => {
      const { rawKey } = await createApiKey(USER_ADMIN, ORG_ALPHA, { name: 'Alpha Key' });

      const req = new NextRequest('http://localhost:3000/api/v1/widgets/wgt_alpha_1', {
        headers: { Authorization: `Bearer ${rawKey}` },
      });

      const res = await getWidgetHandler(req, { params: Promise.resolve({ id: 'wgt_alpha_1' }) });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.id).toBe('wgt_alpha_1');
    });

    it('PATCH /api/v1/widgets/:id updates widget configuration', async () => {
      const { rawKey } = await createApiKey(USER_ADMIN, ORG_ALPHA, { name: 'Alpha Key' });

      const req = new NextRequest('http://localhost:3000/api/v1/widgets/wgt_alpha_1', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${rawKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: 'Updated Widget Title' }),
      });

      const res = await patchWidgetHandler(req, { params: Promise.resolve({ id: 'wgt_alpha_1' }) });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.name).toBe('Updated Widget Title');
    });

    it('POST /api/v1/widgets/:id/pause and /resume modifies widget state', async () => {
      const { rawKey } = await createApiKey(USER_ADMIN, ORG_ALPHA, { name: 'Alpha Key' });

      const pauseReq = new NextRequest('http://localhost:3000/api/v1/widgets/wgt_alpha_1/pause', {
        method: 'POST',
        headers: { Authorization: `Bearer ${rawKey}` },
      });
      const pauseRes = await pauseWidgetHandler(pauseReq, { params: Promise.resolve({ id: 'wgt_alpha_1' }) });
      expect(pauseRes.status).toBe(200);
      const pauseJson = await pauseRes.json();
      expect(pauseJson.data.status).toBe('PAUSED');

      const resumeReq = new NextRequest('http://localhost:3000/api/v1/widgets/wgt_alpha_1/resume', {
        method: 'POST',
        headers: { Authorization: `Bearer ${rawKey}` },
      });
      const resumeRes = await resumeWidgetHandler(resumeReq, { params: Promise.resolve({ id: 'wgt_alpha_1' }) });
      expect(resumeRes.status).toBe(200);
      const resumeJson = await resumeRes.json();
      expect(resumeJson.data.status).toBe('ACTIVE');
    });

    it('DELETE /api/v1/widgets/:id soft deletes widget', async () => {
      const { rawKey } = await createApiKey(USER_ADMIN, ORG_ALPHA, { name: 'Alpha Key' });

      const req = new NextRequest('http://localhost:3000/api/v1/widgets/wgt_alpha_1', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${rawKey}` },
      });

      const res = await deleteWidgetHandler(req, { params: Promise.resolve({ id: 'wgt_alpha_1' }) });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.deleted).toBe(true);
    });
  });

  // =========================================================================
  // 7. RATE LIMITING TESTS
  // =========================================================================
  describe('7. API Rate Limiting Thresholds', () => {
    it('enforces read rate limits after 120 attempts', () => {
      const testId = `rl_read_test_${Date.now()}`;
      for (let i = 0; i < 120; i++) {
        expect(checkApiRateLimit(testId, 'read').allowed).toBe(true);
      }
      const limitReached = checkApiRateLimit(testId, 'read');
      expect(limitReached.allowed).toBe(false);
      expect(limitReached.retryAfterSeconds).toBeGreaterThan(0);
    });

    it('enforces write rate limits after 30 attempts', () => {
      const testId = `rl_write_test_${Date.now()}`;
      for (let i = 0; i < 30; i++) {
        expect(checkApiRateLimit(testId, 'write').allowed).toBe(true);
      }
      const limitReached = checkApiRateLimit(testId, 'write');
      expect(limitReached.allowed).toBe(false);
      expect(limitReached.retryAfterSeconds).toBeGreaterThan(0);
    });
  });
});
