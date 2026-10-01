/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  createQRCode,
  getQRCode,
  listQRCodes,
  updateQRCode,
  updateQRCodeDestination,
  pauseQRCode,
  resumeQRCode,
  deleteQRCode,
  getDashboardStats,
} from '../src/lib/qr/service';
import { resolveDynamicQRCode, resolverCache } from '../src/lib/qr/resolver';
import { prisma } from '../src/lib/db/prisma';

// In-memory test store simulating PostgreSQL for Phase 2C service operations
interface TestQRCode {
  id: string;
  organizationId: string;
  shortCode: string;
  title: string;
  type: 'DYNAMIC_URL' | 'STATIC_URL';
  status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED' | 'EXPIRED';
  styling: any;
  expiresAt: Date | null;
  scanLimit: number | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  destinations: TestDestination[];
}

interface TestDestination {
  id: string;
  qrCodeId: string;
  destinationUrl: string;
  isActive: boolean;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  createdAt: Date;
  deactivatedAt: Date | null;
}

interface TestMembership {
  id: string;
  userId: string;
  organizationId: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
}

describe('Phase 2C: Merchant Dashboard & Dynamic QR Management', () => {
  let qrStore: TestQRCode[] = [];
  let destinationStore: TestDestination[] = [];
  let membershipStore: TestMembership[] = [];

  const ORG_A = 'org_tenant_alpha';
  const ORG_B = 'org_tenant_beta';

  const USER_OWNER = 'user_owner_1';
  const USER_ADMIN = 'user_admin_2';
  const USER_MEMBER = 'user_member_3';
  const USER_VIEWER = 'user_viewer_4';
  const USER_OUTSIDER = 'user_outsider_99';

  beforeEach(() => {
    resolverCache.clear();
    vi.restoreAllMocks();

    qrStore = [];
    destinationStore = [];
    membershipStore = [
      // Org A memberships
      { id: 'm1', userId: USER_OWNER, organizationId: ORG_A, role: 'OWNER' },
      { id: 'm2', userId: USER_ADMIN, organizationId: ORG_A, role: 'ADMIN' },
      { id: 'm3', userId: USER_MEMBER, organizationId: ORG_A, role: 'MEMBER' },
      { id: 'm4', userId: USER_VIEWER, organizationId: ORG_A, role: 'VIEWER' },
      // Org B memberships
      { id: 'm5', userId: USER_OWNER, organizationId: ORG_B, role: 'OWNER' },
      { id: 'm6', userId: USER_MEMBER, organizationId: ORG_B, role: 'MEMBER' },
    ];

    // Mock Membership queries
    (vi.spyOn(prisma.membership, 'findUnique') as any).mockImplementation(async (args: any) => {
      const { userId, organizationId } = args.where.userId_organizationId;
      const found = membershipStore.find(
        (m) => m.userId === userId && m.organizationId === organizationId
      );
      return found ? (found as any) : null;
    });

    // Mock QRCode create
    (vi.spyOn(prisma.qRCode, 'create') as any).mockImplementation(async (args: any) => {
      const data = args.data;
      const qrId = `qr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const now = new Date();

      const newDestinations: TestDestination[] = [];
      if (data.destinations?.create) {
        const dest = {
          id: `dest_${Date.now()}`,
          qrCodeId: qrId,
          destinationUrl: data.destinations.create.destinationUrl,
          isActive: true,
          utmSource: null,
          utmMedium: null,
          utmCampaign: null,
          createdAt: now,
          deactivatedAt: null,
        };
        destinationStore.push(dest);
        newDestinations.push(dest);
      }

      const newQR: TestQRCode = {
        id: qrId,
        organizationId: data.organizationId,
        shortCode: data.shortCode,
        title: data.title,
        type: data.type || 'DYNAMIC_URL',
        status: data.status || 'ACTIVE',
        styling: data.styling,
        expiresAt: data.expiresAt || null,
        scanLimit: data.scanLimit || null,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
        destinations: newDestinations,
      };

      qrStore.push(newQR);
      return { ...newQR, destinations: newDestinations } as any;
    });

    // Mock QRCode findUnique (for shortCode collisions and resolver)
    (vi.spyOn(prisma.qRCode, 'findUnique') as any).mockImplementation(async (args: any) => {
      if (args.where.shortCode) {
        const found = qrStore.find(
          (q) => q.shortCode === args.where.shortCode && q.deletedAt === null
        );
        if (!found) return null;
        const dests = destinationStore.filter(
          (d) => d.qrCodeId === found.id && d.isActive
        );
        return { ...found, destinations: dests } as any;
      }
      if (args.where.id) {
        const found = qrStore.find((q) => q.id === args.where.id);
        if (!found) return null;
        const dests = destinationStore.filter((d) => d.qrCodeId === found.id);
        return { ...found, destinations: dests } as any;
      }
      return null;
    });

    // Mock QRCode findFirst (for tenant-scoped lookup)
    (vi.spyOn(prisma.qRCode, 'findFirst') as any).mockImplementation(async (args: any) => {
      const { id, organizationId, deletedAt } = args.where;
      const found = qrStore.find(
        (q) =>
          q.id === id &&
          q.organizationId === organizationId &&
          (deletedAt === null ? q.deletedAt === null : true)
      );
      if (!found) return null;
      const dests = destinationStore.filter((d) => d.qrCodeId === found.id);
      return { ...found, destinations: dests } as any;
    });

    // Mock QRCode findMany
    (vi.spyOn(prisma.qRCode, 'findMany') as any).mockImplementation(async (args: any) => {
      const where = args.where;
      let matched = qrStore.filter((q) => {
        if (q.organizationId !== where.organizationId) return false;
        if (where.deletedAt === null && q.deletedAt !== null) return false;
        if (where.status && q.status !== where.status) return false;
        if (where.type && q.type !== where.type) return false;
        if (where.OR) {
          const search = where.OR[0]?.title?.contains;
          if (search) {
            const matchTitle = q.title.toLowerCase().includes(search.toLowerCase());
            const matchCode = q.shortCode.toLowerCase().includes(search.toLowerCase());
            if (!matchTitle && !matchCode) return false;
          }
        }
        return true;
      });

      const skip = args.skip || 0;
      const take = args.take || matched.length;
      matched = matched.slice(skip, skip + take);

      return matched.map((q) => {
        const dests = destinationStore.filter((d) => d.qrCodeId === q.id && d.isActive);
        return { ...q, destinations: dests };
      }) as any;
    });

    // Mock QRCode count
    (vi.spyOn(prisma.qRCode, 'count') as any).mockImplementation(async (args: any) => {
      const where = args?.where || {};
      const count = qrStore.filter((q) => {
        if (where.organizationId && q.organizationId !== where.organizationId) return false;
        if (where.deletedAt === null && q.deletedAt !== null) return false;
        if (where.status && q.status !== where.status) return false;
        if (where.OR) {
          const search = where.OR[0]?.title?.contains;
          if (search) {
            const matchTitle = q.title.toLowerCase().includes(search.toLowerCase());
            const matchCode = q.shortCode.toLowerCase().includes(search.toLowerCase());
            if (!matchTitle && !matchCode) return false;
          }
        }
        return true;
      }).length;
      return count;
    });

    // Mock QRCode update
    (vi.spyOn(prisma.qRCode, 'update') as any).mockImplementation(async (args: any) => {
      const { id } = args.where;
      const data = args.data;
      const index = qrStore.findIndex((q) => q.id === id);
      if (index === -1) throw new Error('Record not found');

      qrStore[index] = {
        ...qrStore[index],
        ...data,
        updatedAt: new Date(),
      };

      const dests = destinationStore.filter((d) => d.qrCodeId === id && d.isActive);
      return { ...qrStore[index], destinations: dests } as any;
    });

    // Mock Destination updateMany
    (vi.spyOn(prisma.qRCodeDestination, 'updateMany') as any).mockImplementation(async (args: any) => {
      const { qrCodeId, isActive } = args.where;
      let count = 0;
      destinationStore.forEach((d) => {
        if (d.qrCodeId === qrCodeId && d.isActive === isActive) {
          d.isActive = args.data.isActive;
          d.deactivatedAt = args.data.deactivatedAt;
          count++;
        }
      });
      return { count };
    });

    // Mock Destination create
    (vi.spyOn(prisma.qRCodeDestination, 'create') as any).mockImplementation(async (args: any) => {
      const dest: TestDestination = {
        id: `dest_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        qrCodeId: args.data.qrCodeId,
        destinationUrl: args.data.destinationUrl,
        isActive: args.data.isActive ?? true,
        utmSource: args.data.utmSource || null,
        utmMedium: args.data.utmMedium || null,
        utmCampaign: args.data.utmCampaign || null,
        createdAt: new Date(),
        deactivatedAt: null,
      };
      destinationStore.push(dest);
      return dest as any;
    });

    // Mock transaction
    (vi.spyOn(prisma, '$transaction') as any).mockImplementation(async (fn: any) => {
      return fn(prisma);
    });
  });

  afterEach(() => {
    resolverCache.clear();
    vi.restoreAllMocks();
  });

  // =========================================================================
  // 1. QR CODE CREATION
  // =========================================================================
  describe('Dynamic QR Code Creation', () => {
    it('creates a dynamic QR code with Base62 shortCode and initial destination', async () => {
      const qr = await createQRCode(USER_MEMBER, ORG_A, {
        title: 'Main Entrance Standee',
        destinationUrl: 'https://example.com/menu',
      });

      expect(qr).toBeDefined();
      expect(qr.id).toBeDefined();
      expect(qr.organizationId).toBe(ORG_A);
      expect(qr.title).toBe('Main Entrance Standee');
      expect(qr.type).toBe('DYNAMIC_URL');
      expect(qr.status).toBe('ACTIVE');
      expect(qr.shortCode).toMatch(/^[0-9a-zA-Z]{7}$/);
      expect(qr.destinations).toHaveLength(1);
      expect(qr.destinations[0].destinationUrl).toBe('https://example.com/menu');
      expect(qr.destinations[0].isActive).toBe(true);
    });

    it('rejects empty title or title exceeding 120 characters', async () => {
      await expect(
        createQRCode(USER_MEMBER, ORG_A, {
          title: '   ',
          destinationUrl: 'https://example.com/menu',
        })
      ).rejects.toThrow('QR code title is required');

      await expect(
        createQRCode(USER_MEMBER, ORG_A, {
          title: 'a'.repeat(121),
          destinationUrl: 'https://example.com/menu',
        })
      ).rejects.toThrow('Title cannot exceed 120 characters');
    });

    it('rejects dangerous SSRF destinations (loopback, private subnet, metadata)', async () => {
      const dangerousUrls = [
        'http://localhost:3000/admin',
        'http://127.0.0.1/status',
        'http://169.254.169.254/latest/meta-data',
        'http://192.168.1.1/router',
        'javascript:alert(1)',
        'data:text/html,<h1>hack</h1>',
      ];

      for (const badUrl of dangerousUrls) {
        await expect(
          createQRCode(USER_MEMBER, ORG_A, {
            title: 'Malicious QR',
            destinationUrl: badUrl,
          })
        ).rejects.toThrow();
      }
    });

    it('enforces RBAC on creation: MEMBER, ADMIN, OWNER allowed; VIEWER and outsider rejected', async () => {
      // Owner can create
      const qrOwner = await createQRCode(USER_OWNER, ORG_A, {
        title: 'Owner QR',
        destinationUrl: 'https://example.com/owner',
      });
      expect(qrOwner).toBeDefined();

      // Admin can create
      const qrAdmin = await createQRCode(USER_ADMIN, ORG_A, {
        title: 'Admin QR',
        destinationUrl: 'https://example.com/admin',
      });
      expect(qrAdmin).toBeDefined();

      // Viewer is forbidden
      await expect(
        createQRCode(USER_VIEWER, ORG_A, {
          title: 'Viewer QR',
          destinationUrl: 'https://example.com/viewer',
        })
      ).rejects.toThrow(/FORBIDDEN: Action requires 'MEMBER' role or higher/);

      // Outsider is forbidden
      await expect(
        createQRCode(USER_OUTSIDER, ORG_A, {
          title: 'Outsider QR',
          destinationUrl: 'https://example.com/outsider',
        })
      ).rejects.toThrow(/FORBIDDEN: User is not a member of this organization/);
    });
  });

  // =========================================================================
  // 2. TENANT ISOLATION & IDOR DEFENSE
  // =========================================================================
  describe('Tenant Isolation & IDOR Protection', () => {
    it('prevents cross-tenant retrieval of QR codes', async () => {
      // Create QR in Org B
      const qrOrgB = await createQRCode(USER_OWNER, ORG_B, {
        title: 'Org B Secret QR',
        destinationUrl: 'https://org-b.example.com',
      });

      // Member of Org A attempts to view Org B's QR using Org A context
      const retrieved = await getQRCode(USER_MEMBER, ORG_A, qrOrgB.id);
      expect(retrieved).toBeNull(); // IDOR defense: returns null, does not leak Org B QR
    });

    it('prevents cross-tenant mutation of QR destination', async () => {
      const qrOrgB = await createQRCode(USER_OWNER, ORG_B, {
        title: 'Org B Campaign',
        destinationUrl: 'https://org-b.example.com',
      });

      // Member of Org A attempts to update Org B's QR
      await expect(
        updateQRCodeDestination(
          USER_MEMBER,
          ORG_A,
          qrOrgB.id,
          'https://attacker.example.com'
        )
      ).rejects.toThrow('QR Code not found in this organization');
    });

    it('prevents cross-tenant deletion of QR codes', async () => {
      const qrOrgB = await createQRCode(USER_OWNER, ORG_B, {
        title: 'Org B Code',
        destinationUrl: 'https://org-b.example.com',
      });

      // Admin of Org A tries to delete Org B's QR code
      await expect(
        deleteQRCode(USER_ADMIN, ORG_A, qrOrgB.id)
      ).rejects.toThrow('QR Code not found in this organization');
    });
  });

  // =========================================================================
  // 3. EDIT DESTINATION & DYNAMIC RESOLVER INTEGRATION
  // =========================================================================
  describe('Dynamic Destination Update & Resolver Integration', () => {
    it('updates destination, deactivates old target, and preserves physical shortCode', async () => {
      const qr = await createQRCode(USER_MEMBER, ORG_A, {
        title: 'Cafe Menu Standee',
        destinationUrl: 'https://example.com/breakfast-menu',
      });

      const initialShortCode = qr.shortCode;

      // Update destination for dinner
      const updated = await updateQRCodeDestination(
        USER_MEMBER,
        ORG_A,
        qr.id,
        'https://example.com/dinner-menu'
      );

      // Verify physical shortCode is unchanged
      expect(updated.shortCode).toBe(initialShortCode);

      // Verify active destination updated
      const activeDest = destinationStore.find(
        (d) => d.qrCodeId === qr.id && d.isActive
      );
      expect(activeDest?.destinationUrl).toBe('https://example.com/dinner-menu');

      // Verify previous destination was deactivated
      const oldDest = destinationStore.find(
        (d) => d.destinationUrl === 'https://example.com/breakfast-menu'
      );
      expect(oldDest?.isActive).toBe(false);
      expect(oldDest?.deactivatedAt).toBeDefined();
    });

    it('resolver immediately directs to new destination after update', async () => {
      const qr = await createQRCode(USER_MEMBER, ORG_A, {
        title: 'Flash Sale QR',
        destinationUrl: 'https://example.com/sale-day-1',
      });

      // First scan resolves to Day 1
      const res1 = await resolveDynamicQRCode(qr.shortCode);
      expect(res1.success).toBe(true);
      if (res1.success) {
        expect(res1.destinationUrl).toBe('https://example.com/sale-day-1');
      }

      // Merchant changes destination to Day 2
      await updateQRCodeDestination(
        USER_MEMBER,
        ORG_A,
        qr.id,
        'https://example.com/sale-day-2'
      );

      // Next scan immediately resolves to Day 2 (cache invalidation verified)
      const res2 = await resolveDynamicQRCode(qr.shortCode);
      expect(res2.success).toBe(true);
      if (res2.success) {
        expect(res2.destinationUrl).toBe('https://example.com/sale-day-2');
      }
    });

    it('invalidates local resolver cache on destination change', async () => {
      const qr = await createQRCode(USER_MEMBER, ORG_A, {
        title: 'Cached Target',
        destinationUrl: 'https://example.com/initial-url',
      });

      // Populate cache via resolver
      await resolveDynamicQRCode(qr.shortCode);
      expect(resolverCache.get(qr.shortCode)).toBe('https://example.com/initial-url');

      // Update destination
      await updateQRCodeDestination(
        USER_MEMBER,
        ORG_A,
        qr.id,
        'https://example.com/updated-url'
      );

      // Cache for shortCode was purged by service method
      expect(resolverCache.get(qr.shortCode)).toBeNull();
    });
  });

  // =========================================================================
  // 4. PAUSE & RESUME
  // =========================================================================
  describe('Pause and Resume Controls', () => {
    it('pauses QR code, invalidates cache, and resolver returns PAUSED status', async () => {
      const qr = await createQRCode(USER_MEMBER, ORG_A, {
        title: 'Lunch Buffet Stand',
        destinationUrl: 'https://example.com/buffet',
      });

      // Pre-populate cache
      await resolveDynamicQRCode(qr.shortCode);
      expect(resolverCache.get(qr.shortCode)).toBe('https://example.com/buffet');

      // Pause QR code
      const paused = await pauseQRCode(USER_MEMBER, ORG_A, qr.id);
      expect(paused.status).toBe('PAUSED');
      expect(resolverCache.get(qr.shortCode)).toBeNull();

      // Resolver reflects paused status
      const res = await resolveDynamicQRCode(qr.shortCode);
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.status).toBe('PAUSED');
      }
    });

    it('resumes a paused QR code, restoring active redirection', async () => {
      const qr = await createQRCode(USER_MEMBER, ORG_A, {
        title: 'Temporary Offer',
        destinationUrl: 'https://example.com/offer',
      });

      await pauseQRCode(USER_MEMBER, ORG_A, qr.id);

      // Resume QR code
      const resumed = await resumeQRCode(USER_MEMBER, ORG_A, qr.id);
      expect(resumed.status).toBe('ACTIVE');

      // Resolver reflects resumed status
      const res = await resolveDynamicQRCode(qr.shortCode);
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.destinationUrl).toBe('https://example.com/offer');
      }
    });
  });

  // =========================================================================
  // 5. SOFT DELETE & SCOPE EXCLUSION
  // =========================================================================
  describe('Soft Delete & Deletion Guards', () => {
    it('soft deletes QR code: sets deletedAt, status ARCHIVED, halts redirection', async () => {
      const qr = await createQRCode(USER_ADMIN, ORG_A, {
        title: 'Old Standee',
        destinationUrl: 'https://example.com/old',
      });

      const deleted = await deleteQRCode(USER_ADMIN, ORG_A, qr.id);
      expect(deleted).toBe(true);

      // Resolver stops redirecting and returns NOT_FOUND
      const res = await resolveDynamicQRCode(qr.shortCode);
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.status).toBe('NOT_FOUND');
      }

      // Excluded from standard get
      const retrieved = await getQRCode(USER_ADMIN, ORG_A, qr.id);
      expect(retrieved).toBeNull();

      // Excluded from standard list
      const list = await listQRCodes(USER_ADMIN, ORG_A);
      expect(list.qrCodes.find((q) => q.id === qr.id)).toBeUndefined();
    });

    it('requires ADMIN or OWNER for deletion; rejects MEMBER and VIEWER', async () => {
      const qr = await createQRCode(USER_OWNER, ORG_A, {
        title: 'Protected QR',
        destinationUrl: 'https://example.com/protected',
      });

      // Member cannot delete (destructive operation)
      await expect(
        deleteQRCode(USER_MEMBER, ORG_A, qr.id)
      ).rejects.toThrow(/FORBIDDEN: Action requires 'ADMIN' role or higher/);

      // Viewer cannot delete
      await expect(
        deleteQRCode(USER_VIEWER, ORG_A, qr.id)
      ).rejects.toThrow(/FORBIDDEN: Action requires 'ADMIN' role or higher/);

      // Owner can delete
      const deleted = await deleteQRCode(USER_OWNER, ORG_A, qr.id);
      expect(deleted).toBe(true);
    });
  });

  // =========================================================================
  // 6. QR LISTING, SEARCH & STATS
  // =========================================================================
  describe('Listing, Search & Dashboard Stats', () => {
    beforeEach(async () => {
      // Seed 3 QRs in Org A
      await createQRCode(USER_OWNER, ORG_A, {
        title: 'Breakfast Table 1',
        destinationUrl: 'https://example.com/t1',
      });
      await createQRCode(USER_OWNER, ORG_A, {
        title: 'Breakfast Table 2',
        destinationUrl: 'https://example.com/t2',
      });
      const q3 = await createQRCode(USER_OWNER, ORG_A, {
        title: 'Counter Payment Display',
        destinationUrl: 'https://example.com/counter',
      });

      await pauseQRCode(USER_OWNER, ORG_A, q3.id);
    });

    it('lists QR codes with pagination and status filtering', async () => {
      const all = await listQRCodes(USER_VIEWER, ORG_A);
      expect(all.total).toBe(3);
      expect(all.qrCodes).toHaveLength(3);

      const activeOnly = await listQRCodes(USER_VIEWER, ORG_A, { status: 'ACTIVE' });
      expect(activeOnly.total).toBe(2);

      const pausedOnly = await listQRCodes(USER_VIEWER, ORG_A, { status: 'PAUSED' });
      expect(pausedOnly.total).toBe(1);
    });

    it('searches QR codes by title keyword', async () => {
      const searchRes = await listQRCodes(USER_VIEWER, ORG_A, { search: 'counter' });
      expect(searchRes.total).toBe(1);
      expect(searchRes.qrCodes[0].title).toBe('Counter Payment Display');
    });

    it('computes accurate high-level dashboard metrics without scan counters', async () => {
      const stats = await getDashboardStats(USER_VIEWER, ORG_A);
      expect(stats.totalQRs).toBe(3);
      expect(stats.activeQRs).toBe(2);
      expect(stats.pausedQRs).toBe(1);
      expect(stats.recentQRs).toHaveLength(3);
      // Scan counters and scan events are strictly omitted (Phase 2D scope)
      expect((stats as any).totalScans).toBeUndefined();
    });
  });

  // =========================================================================
  // 7. QR TITLE AND METADATA UPDATE
  // =========================================================================
  describe('QR Metadata Updating', () => {
    it('updates QR code title while retaining all other fields', async () => {
      const qr = await createQRCode(USER_MEMBER, ORG_A, {
        title: 'Initial Title',
        destinationUrl: 'https://example.com/initial',
      });

      const updated = await updateQRCode(USER_MEMBER, ORG_A, qr.id, {
        title: 'Renamed Promotional Banner',
      });

      expect(updated.title).toBe('Renamed Promotional Banner');
      expect(updated.shortCode).toBe(qr.shortCode);
      expect(updated.destinations[0].destinationUrl).toBe('https://example.com/initial');
    });
  });

  // =========================================================================
  // 8. ORGANIZATION CONTEXT & SWITCHING SECURITY
  // =========================================================================
  describe('Organization Context & Switcher Security', () => {
    it('allows verified members to access organization context', async () => {
      const { requireOrganizationMember } = await import('../src/lib/auth/rbac');

      // User Owner belongs to Org A
      const membershipA = await requireOrganizationMember(USER_OWNER, ORG_A);
      expect(membershipA).toBeDefined();
      expect(membershipA.role).toBe('OWNER');

      // User Owner also belongs to Org B
      const membershipB = await requireOrganizationMember(USER_OWNER, ORG_B);
      expect(membershipB).toBeDefined();
      expect(membershipB.role).toBe('OWNER');
    });

    it('rejects switching to an organization where user has no membership', async () => {
      const { requireOrganizationMember } = await import('../src/lib/auth/rbac');

      // User Member only belongs to Org A, not Org B (m6 belongs to another member or not USER_ADMIN)
      await expect(
        requireOrganizationMember(USER_ADMIN, ORG_B)
      ).rejects.toThrow(/FORBIDDEN: User is not a member of this organization/);

      // Outsider belongs to neither
      await expect(
        requireOrganizationMember(USER_OUTSIDER, ORG_A)
      ).rejects.toThrow(/FORBIDDEN: User is not a member of this organization/);
    });

    it('never trusts client-supplied organizationId without server validation', async () => {
      // Attacker tries to query Org A with non-existent membership
      await expect(
        listQRCodes(USER_OUTSIDER, ORG_A)
      ).rejects.toThrow(/FORBIDDEN/);

      // Attacker tries to create QR in Org B without membership
      await expect(
        createQRCode(USER_ADMIN, ORG_B, {
          title: 'Tampered Org QR',
          destinationUrl: 'https://example.com/tamper',
        })
      ).rejects.toThrow(/FORBIDDEN/);
    });
  });
});
