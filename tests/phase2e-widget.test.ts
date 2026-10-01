/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createWidget,
  getWidget,
  listWidgets,
  updateWidget,
  pauseWidget,
  resumeWidget,
  deleteWidget,
  getPublicWidgetConfig,
  generateWidgetPublicId,
} from '../src/lib/widget/service';
import {
  generateRemoteEmbedCode,
  generateEmbedCode,
  getDefaultWidgetConfig,
  sanitizeWidgetConfig,
} from '../src/lib/widget/config';
import { GET as publicWidgetHandler, OPTIONS as optionsHandler } from '../src/app/api/widget/[publicId]/route';
import { prisma } from '../src/lib/db/prisma';
import { NextRequest } from 'next/server';

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

interface TestMembership {
  id: string;
  userId: string;
  organizationId: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
}

describe('Phase 2E: Remote Website QR Widget Persistence', () => {
  let widgetStore: TestWidget[] = [];
  let membershipStore: TestMembership[] = [];

  const ORG_ALPHA = 'org_tenant_alpha';
  const ORG_BETA = 'org_tenant_beta';

  const USER_OWNER = 'user_owner_alpha';
  const USER_ADMIN = 'user_admin_alpha';
  const USER_MEMBER = 'user_member_alpha';
  const USER_VIEWER = 'user_viewer_alpha';
  const USER_OUTSIDER = 'user_outsider_gamma';

  beforeEach(() => {
    vi.restoreAllMocks();
    widgetStore = [];

    membershipStore = [
      { id: 'm_owner', userId: USER_OWNER, organizationId: ORG_ALPHA, role: 'OWNER' },
      { id: 'm_admin', userId: USER_ADMIN, organizationId: ORG_ALPHA, role: 'ADMIN' },
      { id: 'm_member', userId: USER_MEMBER, organizationId: ORG_ALPHA, role: 'MEMBER' },
      { id: 'm_viewer', userId: USER_VIEWER, organizationId: ORG_ALPHA, role: 'VIEWER' },
      { id: 'm_beta_owner', userId: USER_OWNER, organizationId: ORG_BETA, role: 'OWNER' },
      { id: 'm_beta_member', userId: USER_MEMBER, organizationId: ORG_BETA, role: 'MEMBER' },
    ];

    // Mock Membership lookup
    (vi.spyOn(prisma.membership, 'findUnique') as any).mockImplementation(async (args: any) => {
      const { userId, organizationId } = args.where.userId_organizationId;
      const found = membershipStore.find(
        (m) => m.userId === userId && m.organizationId === organizationId
      );
      return found ? (found as any) : null;
    });

    // Mock Widget findUnique
    (vi.spyOn(prisma.widget, 'findUnique') as any).mockImplementation(async (args: any) => {
      if (args.where.publicId) {
        const found = widgetStore.find((w) => w.publicId === args.where.publicId);
        return found ? (found as any) : null;
      }
      if (args.where.id) {
        const found = widgetStore.find((w) => w.id === args.where.id);
        return found ? (found as any) : null;
      }
      return null;
    });

    // Mock Widget findFirst
    (vi.spyOn(prisma.widget, 'findFirst') as any).mockImplementation(async (args: any) => {
      const where = args.where || {};
      const found = widgetStore.find((w) => {
        if (where.publicId && w.publicId !== where.publicId) return false;
        if (where.id && w.id !== where.id) return false;
        if (where.organizationId && w.organizationId !== where.organizationId) return false;
        if (where.deletedAt === null && w.deletedAt !== null) return false;
        return true;
      });
      return found ? (found as any) : null;
    });

    // Mock Widget create
    (vi.spyOn(prisma.widget, 'create') as any).mockImplementation(async (args: any) => {
      const d = args.data;
      const id = `w_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const now = new Date();
      const record: TestWidget = {
        id,
        organizationId: d.organizationId,
        publicId: d.publicId,
        name: d.name,
        status: d.status || 'ACTIVE',
        configuration: d.configuration,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      };
      widgetStore.push(record);
      return record as any;
    });

    // Mock Widget findMany
    (vi.spyOn(prisma.widget, 'findMany') as any).mockImplementation(async (args: any) => {
      const where = args.where || {};
      const list = widgetStore.filter((w) => {
        if (where.organizationId && w.organizationId !== where.organizationId) return false;
        if (where.deletedAt === null && w.deletedAt !== null) return false;
        if (where.status && w.status !== where.status) return false;
        if (where.name?.contains && !w.name.toLowerCase().includes(where.name.contains.toLowerCase()))
          return false;
        return true;
      });
      return list as any;
    });

    // Mock Widget count
    (vi.spyOn(prisma.widget, 'count') as any).mockImplementation(async (args: any) => {
      const where = args.where || {};
      const list = widgetStore.filter((w) => {
        if (where.organizationId && w.organizationId !== where.organizationId) return false;
        if (where.deletedAt === null && w.deletedAt !== null) return false;
        return true;
      });
      return list.length;
    });

    // Mock Widget update
    (vi.spyOn(prisma.widget, 'update') as any).mockImplementation(async (args: any) => {
      const idx = widgetStore.findIndex((w) => w.id === args.where.id);
      if (idx === -1) throw new Error('Record not found');
      const cur = widgetStore[idx];
      const d = args.data;
      const updated: TestWidget = {
        ...cur,
        name: d.name !== undefined ? d.name : cur.name,
        status: d.status !== undefined ? d.status : cur.status,
        configuration: d.configuration !== undefined ? d.configuration : cur.configuration,
        deletedAt: d.deletedAt !== undefined ? d.deletedAt : cur.deletedAt,
        updatedAt: new Date(),
      };
      widgetStore[idx] = updated;
      return updated as any;
    });
  });

  // ============================================================
  // 1. DATA MODEL & PUBLIC IDENTIFIER
  // ============================================================
  describe('1. Data Model & Public Identifier', () => {
    it('generates a stable CSPRNG public identifier with wgt_ prefix', () => {
      const id1 = generateWidgetPublicId();
      const id2 = generateWidgetPublicId();

      expect(id1).toMatch(/^wgt_[a-zA-Z0-9]{18}$/);
      expect(id2).toMatch(/^wgt_[a-zA-Z0-9]{18}$/);
      expect(id1).not.toBe(id2);
    });

    it('creates a widget with valid configuration, status ACTIVE, and tenant boundary', async () => {
      const config = getDefaultWidgetConfig('upi');
      const widget = await createWidget(USER_MEMBER, ORG_ALPHA, {
        name: 'Storefront UPI Payment Widget',
        config,
      });

      expect(widget).toBeDefined();
      expect(widget.id).toBeTruthy();
      expect(widget.publicId).toMatch(/^wgt_/);
      expect(widget.name).toBe('Storefront UPI Payment Widget');
      expect(widget.status).toBe('ACTIVE');
      expect(widget.organizationId).toBe(ORG_ALPHA);
      expect(widget.deletedAt).toBeNull();

      const savedCfg = widget.configuration as any;
      expect(savedCfg.type).toBe('upi');
      expect(savedCfg.brandColor).toBe('#16a34a');
      expect(savedCfg.buttonLabel).toBe('Scan to Pay');
    });

    it('persists only legitimate configuration options and sanitizes inputs', async () => {
      const widget = await createWidget(USER_MEMBER, ORG_ALPHA, {
        name: 'WhatsApp Support Button',
        config: {
          type: 'whatsapp',
          payload: 'https://wa.me/919876543210?text=Hi',
          buttonLabel: 'Chat with Us',
          brandColor: '#25D366',
          position: 'bottom-left',
          size: 'large',
          borderRadius: 'rounded',
          shadow: 'strong',
          popupTitle: 'Customer Care Support',
          popupDescription: 'We reply within 5 minutes.',
          ctaText: 'Official WhatsApp Business',
        },
      });

      const cfg = widget.configuration as any;
      expect(cfg.type).toBe('whatsapp');
      expect(cfg.position).toBe('bottom-left');
      expect(cfg.size).toBe('large');
      expect(cfg.borderRadius).toBe('rounded');
      expect(cfg.shadow).toBe('strong');
      expect(cfg.popupTitle).toBe('Customer Care Support');
      expect(cfg.ctaText).toBe('Official WhatsApp Business');
    });
  });

  // ============================================================
  // 2. TENANT ISOLATION & IDOR DEFENSE
  // ============================================================
  describe('2. Multi-Tenant Isolation & IDOR Protection', () => {
    it('strictly isolates widgets by organizationId during retrieval', async () => {
      const widgetA = await createWidget(USER_MEMBER, ORG_ALPHA, {
        name: 'Org A Widget',
        config: getDefaultWidgetConfig('upi'),
      });

      // Member of Alpha can read Org A widget
      const foundAlpha = await getWidget(USER_MEMBER, ORG_ALPHA, widgetA.id);
      expect(foundAlpha).not.toBeNull();
      expect(foundAlpha?.id).toBe(widgetA.id);

      // Same user requesting from Org B cannot read Org A widget (returns null)
      const foundBeta = await getWidget(USER_MEMBER, ORG_BETA, widgetA.id);
      expect(foundBeta).toBeNull();
    });

    it('blocks cross-tenant update attempts (IDOR)', async () => {
      const widgetA = await createWidget(USER_MEMBER, ORG_ALPHA, {
        name: 'Org A Original Name',
        config: getDefaultWidgetConfig('upi'),
      });

      // User attempts to modify widgetA using Org B tenant context
      await expect(
        updateWidget(USER_MEMBER, ORG_BETA, widgetA.id, {
          name: 'Hacked Name',
        })
      ).rejects.toThrow(/Widget not found or access denied/);

      // Verify original record is unmodified
      const unmodified = await getWidget(USER_MEMBER, ORG_ALPHA, widgetA.id);
      expect(unmodified?.name).toBe('Org A Original Name');
    });

    it('blocks cross-tenant pause, resume, and delete attempts', async () => {
      const widgetA = await createWidget(USER_MEMBER, ORG_ALPHA, {
        name: 'Org A Widget',
        config: getDefaultWidgetConfig('upi'),
      });

      await expect(pauseWidget(USER_MEMBER, ORG_BETA, widgetA.id)).rejects.toThrow(
        /Widget not found or access denied/
      );
      await expect(resumeWidget(USER_MEMBER, ORG_BETA, widgetA.id)).rejects.toThrow(
        /Widget not found or access denied/
      );
      await expect(deleteWidget(USER_OWNER, ORG_BETA, widgetA.id)).rejects.toThrow(
        /Widget not found or access denied/
      );
    });

    it('denies access entirely to users with no membership', async () => {
      const widgetA = await createWidget(USER_MEMBER, ORG_ALPHA, {
        name: 'Org A Widget',
        config: getDefaultWidgetConfig('upi'),
      });

      await expect(getWidget(USER_OUTSIDER, ORG_ALPHA, widgetA.id)).rejects.toThrow(
        /User is not a member of this organization/
      );
      await expect(
        createWidget(USER_OUTSIDER, ORG_ALPHA, {
          name: 'Outsider Widget',
          config: getDefaultWidgetConfig('upi'),
        })
      ).rejects.toThrow(/User is not a member of this organization/);
    });
  });

  // ============================================================
  // 3. RBAC ENFORCEMENT
  // ============================================================
  describe('3. Role-Based Access Control (RBAC)', () => {
    it('allows OWNER and ADMIN to perform all operations including delete', async () => {
      // Owner create & delete
      const w1 = await createWidget(USER_OWNER, ORG_ALPHA, {
        name: 'Owner Widget',
        config: getDefaultWidgetConfig('upi'),
      });
      const delOwner = await deleteWidget(USER_OWNER, ORG_ALPHA, w1.id);
      expect(delOwner).toBe(true);

      // Admin create & delete
      const w2 = await createWidget(USER_ADMIN, ORG_ALPHA, {
        name: 'Admin Widget',
        config: getDefaultWidgetConfig('upi'),
      });
      const delAdmin = await deleteWidget(USER_ADMIN, ORG_ALPHA, w2.id);
      expect(delAdmin).toBe(true);
    });

    it('allows MEMBER to create, update, pause, resume, but BLOCKS delete', async () => {
      const widget = await createWidget(USER_MEMBER, ORG_ALPHA, {
        name: 'Member Widget',
        config: getDefaultWidgetConfig('upi'),
      });

      const updated = await updateWidget(USER_MEMBER, ORG_ALPHA, widget.id, {
        name: 'Member Updated Widget',
      });
      expect(updated.name).toBe('Member Updated Widget');

      const paused = await pauseWidget(USER_MEMBER, ORG_ALPHA, widget.id);
      expect(paused.status).toBe('PAUSED');

      const resumed = await resumeWidget(USER_MEMBER, ORG_ALPHA, widget.id);
      expect(resumed.status).toBe('ACTIVE');

      // MEMBER attempting delete must be rejected (requires ADMIN+)
      await expect(deleteWidget(USER_MEMBER, ORG_ALPHA, widget.id)).rejects.toThrow(
        /Action requires 'ADMIN' role or higher/
      );
    });

    it('restricts VIEWER to read-only access and blocks all mutations', async () => {
      const widget = await createWidget(USER_MEMBER, ORG_ALPHA, {
        name: 'Protected Widget',
        config: getDefaultWidgetConfig('upi'),
      });

      // Read allowed
      const readResult = await getWidget(USER_VIEWER, ORG_ALPHA, widget.id);
      expect(readResult).not.toBeNull();

      const listResult = await listWidgets(USER_VIEWER, ORG_ALPHA);
      expect(listResult.total).toBe(1);

      // Mutations blocked
      await expect(
        createWidget(USER_VIEWER, ORG_ALPHA, {
          name: 'Viewer Widget',
          config: getDefaultWidgetConfig('upi'),
        })
      ).rejects.toThrow(/Action requires 'MEMBER' role or higher/);

      await expect(
        updateWidget(USER_VIEWER, ORG_ALPHA, widget.id, { name: 'Viewer Edit' })
      ).rejects.toThrow(/Action requires 'MEMBER' role or higher/);

      await expect(pauseWidget(USER_VIEWER, ORG_ALPHA, widget.id)).rejects.toThrow(
        /Action requires 'MEMBER' role or higher/
      );

      await expect(deleteWidget(USER_VIEWER, ORG_ALPHA, widget.id)).rejects.toThrow(
        /Action requires 'ADMIN' role or higher/
      );
    });
  });

  // ============================================================
  // 4. REMOTE CONFIGURATION PERSISTENCE & STABLE EMBED CODE
  // ============================================================
  describe('4. Remote Configuration Persistence & Stable Embed Code', () => {
    it('maintains a strictly unchanged publicId and embed code when configuration updates', async () => {
      // Step 1: Merchant creates widget once
      const initialConfig = getDefaultWidgetConfig('upi');
      const widget = await createWidget(USER_MEMBER, ORG_ALPHA, {
        name: 'Store Checkout Widget',
        config: initialConfig,
      });

      const originalPublicId = widget.publicId;
      const originalEmbedCode = generateRemoteEmbedCode(originalPublicId);

      expect(originalEmbedCode).toContain(`data-widget-id="${originalPublicId}"`);

      // Step 2: Merchant changes colors, destination, and button text in dashboard
      const updatedConfig = {
        payload: 'https://quickqr.art/menu/spring-specials',
        buttonLabel: 'View Spring Menu',
        brandColor: '#ea580c',
        popupTitle: 'Seasonal Specials',
      };

      const updated = await updateWidget(USER_MEMBER, ORG_ALPHA, widget.id, {
        name: 'Renamed Store Widget',
        config: updatedConfig,
      });

      // Step 3: Verify publicId is strictly unchanged
      expect(updated.publicId).toBe(originalPublicId);

      // Step 4: Verify embed code is 100% IDENTICAL
      const newEmbedCode = generateRemoteEmbedCode(updated.publicId);
      expect(newEmbedCode).toBe(originalEmbedCode);

      // Step 5: Verify public delivery endpoint returns the NEW active configuration
      const publicResult = await getPublicWidgetConfig(originalPublicId);
      expect(publicResult).not.toBeNull();
      expect(publicResult?.safeConfig.payload).toBe('https://quickqr.art/menu/spring-specials');
      expect(publicResult?.safeConfig.buttonLabel).toBe('View Spring Menu');
      expect(publicResult?.safeConfig.brandColor).toBe('#ea580c');
      expect(publicResult?.safeConfig.popupTitle).toBe('Seasonal Specials');
    });
  });

  // ============================================================
  // 5. PUBLIC DELIVERY API & CACHING
  // ============================================================
  describe('5. Public Delivery API & Cache Control', () => {
    it('returns sanitized active configuration with CORS and bounded cache headers', async () => {
      const widget = await createWidget(USER_MEMBER, ORG_ALPHA, {
        name: 'Public Delivery Test',
        config: {
          type: 'website',
          payload: 'https://example.com/checkout',
          buttonLabel: 'Pay on Phone',
          brandColor: '#2563eb',
        },
      });

      const req = new NextRequest(`https://quickqr.art/api/widget/${widget.publicId}`);
      const res = await publicWidgetHandler(req, {
        params: Promise.resolve({ publicId: widget.publicId }),
      });

      expect(res.status).toBe(200);

      // CORS verification
      expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');

      // Bounded cache verification (60s with 120s stale-while-revalidate)
      const cacheControl = res.headers.get('Cache-Control');
      expect(cacheControl).toContain('max-age=60');
      expect(cacheControl).toContain('stale-while-revalidate=120');

      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.status).toBe('ACTIVE');
      expect(body.publicId).toBe(widget.publicId);
      expect(body.config.payload).toBe('https://example.com/checkout');

      // ZERO internal tenant leakage
      expect(body.organizationId).toBeUndefined();
      expect(body.id).toBeUndefined();
      expect(body.deletedAt).toBeUndefined();
    });

    it('returns PAUSED status when widget is paused, suppressing active rendering', async () => {
      const widget = await createWidget(USER_MEMBER, ORG_ALPHA, {
        name: 'Pausable Widget',
        config: getDefaultWidgetConfig('upi'),
      });

      await pauseWidget(USER_MEMBER, ORG_ALPHA, widget.id);

      const req = new NextRequest(`https://quickqr.art/api/widget/${widget.publicId}`);
      const res = await publicWidgetHandler(req, {
        params: Promise.resolve({ publicId: widget.publicId }),
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.status).toBe('PAUSED');
      expect(body.message).toContain('paused');
      expect(body.config).toBeUndefined();
    });

    it('returns 404 when widget is soft-deleted / archived', async () => {
      const widget = await createWidget(USER_OWNER, ORG_ALPHA, {
        name: 'Archived Widget',
        config: getDefaultWidgetConfig('upi'),
      });

      await deleteWidget(USER_OWNER, ORG_ALPHA, widget.id);

      const req = new NextRequest(`https://quickqr.art/api/widget/${widget.publicId}`);
      const res = await publicWidgetHandler(req, {
        params: Promise.resolve({ publicId: widget.publicId }),
      });

      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.success).toBe(false);
    });

    it('rejects malformed public identifiers with 400 Bad Request', async () => {
      const badIds = [
        'short',
        'wgt_<script>alert(1)</script>',
        '../../../etc/passwd',
        'wgt_spaces in id',
        'wgt_!@#$%^&*()',
      ];

      for (const badId of badIds) {
        const req = new NextRequest(`https://quickqr.art/api/widget/${badId}`);
        const res = await publicWidgetHandler(req, {
          params: Promise.resolve({ publicId: badId }),
        });
        expect(res.status).toBe(400);
      }
    });

    it('handles CORS OPTIONS preflight correctly', async () => {
      const res = await optionsHandler();
      expect(res.status).toBe(204);
      expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(res.headers.get('Access-Control-Allow-Methods')).toContain('GET');
    });
  });

  // ============================================================
  // 6. SECURITY & ANTI-SSRF PROTECTION
  // ============================================================
  describe('6. Security, Anti-SSRF & Input Sanitization', () => {
    it('blocks dangerous URI protocols (javascript:, data:, vbscript:) in widget payload', async () => {
      const dangerousPayloads = [
        'javascript:alert(document.cookie)',
        'data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==',
        'vbscript:MsgBox(1)',
        'file:///etc/passwd',
        'blob:https://example.com/uuid',
      ];

      for (const payload of dangerousPayloads) {
        await expect(
          createWidget(USER_MEMBER, ORG_ALPHA, {
            name: 'Malicious Widget',
            config: {
              type: 'website',
              payload,
            },
          })
        ).rejects.toThrow();
      }
    });

    it('enforces anti-SSRF protection: rejects loopback, private IPs, and cloud metadata', async () => {
      const ssrfPayloads = [
        'http://localhost:3000/admin',
        'http://127.0.0.1:8080',
        'http://169.254.169.254/latest/meta-data/', // AWS/GCP metadata
        'http://10.0.0.1/internal', // RFC 1918 Class A
        'http://192.168.1.1/router', // RFC 1918 Class C
        'http://172.16.0.1/private', // RFC 1918 Class B
        'http://internal.corp/secret',
      ];

      for (const payload of ssrfPayloads) {
        await expect(
          createWidget(USER_MEMBER, ORG_ALPHA, {
            name: 'SSRF Attack Widget',
            config: {
              type: 'website',
              payload,
            },
          })
        ).rejects.toThrow(/Invalid destination URL|Private IP|Internal domain|Localhost/i);
      }
    });

    it('strips XSS and script tags from text inputs safely', () => {
      const sanitized = sanitizeWidgetConfig({
        type: 'website',
        payload: 'https://example.com',
        buttonLabel: 'Click <script>alert(1)</script> Here',
        popupTitle: '<b>Bold Title</b> with <iframe src="evil.com">',
        popupDescription: 'Description with onerror=alert(1)',
        ctaText: '<span style="color:red">Safe CTA</span>',
      });

      expect(sanitized.buttonLabel).not.toContain('<script>');
      expect(sanitized.popupTitle).not.toContain('<iframe');
      expect(sanitized.ctaText).not.toContain('<span');
    });

    it('rejects oversized widget names (> 100 characters)', async () => {
      const oversizedName = 'A'.repeat(101);
      await expect(
        createWidget(USER_MEMBER, ORG_ALPHA, {
          name: oversizedName,
          config: getDefaultWidgetConfig('upi'),
        })
      ).rejects.toThrow(/cannot exceed 100 characters/);
    });
  });

  // ============================================================
  // 7. BACKWARD COMPATIBILITY & EMBED SCRIPT CONTRACT
  // ============================================================
  describe('7. Backward Compatibility & Embed Contract', () => {
    it('preserves Phase 1 static embed generation without disruption', () => {
      const cfg = getDefaultWidgetConfig('upi');
      const staticEmbed = generateEmbedCode(cfg, 'https://quickqr.art');

      expect(staticEmbed).toContain('src="https://quickqr.art/widget.js"');
      expect(staticEmbed).toContain('data-type="upi"');
      expect(staticEmbed).toContain('data-config="');
    });

    it('generates Phase 2E remote embed referencing stable publicId', () => {
      const publicId = 'wgt_cm123abc456def789xyz';
      const remoteEmbed = generateRemoteEmbedCode(publicId, 'https://quickqr.art');

      expect(remoteEmbed).toContain('src="https://quickqr.art/widget.js"');
      expect(remoteEmbed).toContain(`data-widget-id="${publicId}"`);
      expect(remoteEmbed).not.toContain('data-config="');
    });
  });
});
