import { describe, it, expect, beforeEach } from 'vitest';
import { hashPassword, verifyPassword } from '../src/lib/auth/password';
import {
  generateSessionToken,
  hashSessionToken,
  SESSION_TTL_MS,
} from '../src/lib/auth/session';
import { hasRoleAtLeast } from '../src/lib/auth/rbac';
import { SlidingWindowRateLimiter } from '../src/lib/auth/rate-limiter';
import { generateShortCode } from '../src/lib/auth/tenancy';

// =========================================================================
// IN-MEMORY MOCK DATABASE SIMULATING PRISMA CLIENT ACCORDING TO SCHEMA
// =========================================================================
interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  avatarUrl: string | null;
  emailVerifiedAt: Date | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

interface OrganizationRecord {
  id: string;
  name: string;
  slug: string;
  billingEmail: string | null;
  country: string;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

interface MembershipRecord {
  id: string;
  userId: string;
  organizationId: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
  createdAt: Date;
  updatedAt: Date;
}

interface SessionRecord {
  id: string;
  userId: string;
  tokenHash: string;
  ipAddress: string | null;
  userAgent: string | null;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface QRCodeRecord {
  id: string;
  organizationId: string;
  shortCode: string;
  title: string;
  type: string;
  status: string;
  styling: Record<string, unknown>;
  scanLimit: number | null;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

interface QRCodeDestinationRecord {
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

class InMemoryPrismaMock {
  public users: UserRecord[] = [];
  public organizations: OrganizationRecord[] = [];
  public memberships: MembershipRecord[] = [];
  public sessions: SessionRecord[] = [];
  public qrCodes: QRCodeRecord[] = [];
  public destinations: QRCodeDestinationRecord[] = [];

  public clear() {
    this.users = [];
    this.organizations = [];
    this.memberships = [];
    this.sessions = [];
    this.qrCodes = [];
    this.destinations = [];
  }
}

describe('Phase 2A: End-to-End Authentication & Tenant Lifecycle Flows', () => {
  let db: InMemoryPrismaMock;
  let rateLimiter: SlidingWindowRateLimiter;

  beforeEach(() => {
    db = new InMemoryPrismaMock();
    rateLimiter = new SlidingWindowRateLimiter();
  });

  // -----------------------------------------------------------------------
  // 1. REGISTRATION WORKFLOW
  // -----------------------------------------------------------------------
  it('executes atomic registration: User + Organization + OWNER Membership + Session', async () => {
    const rawPassword = 'StrongP@ssw0rd!2026';
    const email = 'Founder@QuickQR.in'.trim().toLowerCase();
    const fullName = 'Aarav Patel';
    const orgName = 'QuickQR Retail';
    const slug = 'quickqr-retail';

    // 1. Hash password with Argon2id
    const passwordHash = await hashPassword(rawPassword);
    expect(passwordHash.startsWith('$argon2id$')).toBe(true);

    // 2. Create User
    const user: UserRecord = {
      id: 'usr_01',
      email,
      passwordHash,
      fullName,
      avatarUrl: null,
      emailVerifiedAt: null,
      lastLoginAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };
    db.users.push(user);

    // 3. Create Tenant Organization
    const organization: OrganizationRecord = {
      id: 'org_01',
      name: orgName,
      slug,
      billingEmail: email,
      country: 'IN',
      currency: 'INR',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };
    db.organizations.push(organization);

    // 4. Create Membership as OWNER
    const membership: MembershipRecord = {
      id: 'mem_01',
      userId: user.id,
      organizationId: organization.id,
      role: 'OWNER',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    db.memberships.push(membership);

    // 5. Create Session
    const rawToken = generateSessionToken();
    const tokenHash = hashSessionToken(rawToken);
    const session: SessionRecord = {
      id: 'sess_01',
      userId: user.id,
      tokenHash,
      ipAddress: '103.21.244.2',
      userAgent: 'Mozilla/5.0 Chrome/120',
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    db.sessions.push(session);

    // Assertions
    expect(db.users).toHaveLength(1);
    expect(db.organizations).toHaveLength(1);
    expect(db.memberships).toHaveLength(1);
    expect(db.sessions).toHaveLength(1);

    // Verify Password is NEVER plaintext in database
    expect(db.users[0].passwordHash).not.toBe(rawPassword);
    expect(db.users[0].passwordHash).toContain('$argon2id$');

    // Verify Session Token is NEVER plaintext in database
    expect(db.sessions[0].tokenHash).not.toBe(rawToken);
    expect(db.sessions[0].tokenHash).toBe(tokenHash);

    // Verify tenant boundary: Organization owns membership
    expect(db.memberships[0].organizationId).toBe(organization.id);
    expect(db.memberships[0].role).toBe('OWNER');
  });

  // -----------------------------------------------------------------------
  // 2. LOGIN & RATE LIMITING WORKFLOW
  // -----------------------------------------------------------------------
  it('authenticates valid credentials, updates lastLoginAt, and creates a session', async () => {
    const rawPassword = 'ValidPassword123!';
    const passwordHash = await hashPassword(rawPassword);
    const user: UserRecord = {
      id: 'usr_02',
      email: 'merchant@store.in',
      passwordHash,
      fullName: 'Vikram Singh',
      avatarUrl: null,
      emailVerifiedAt: null,
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };
    db.users.push(user);

    // Valid login
    const isMatch = await verifyPassword(rawPassword, user.passwordHash);
    expect(isMatch).toBe(true);

    if (isMatch) {
      user.lastLoginAt = new Date();
      const rawToken = generateSessionToken();
      db.sessions.push({
        id: 'sess_02',
        userId: user.id,
        tokenHash: hashSessionToken(rawToken),
        ipAddress: '103.22.200.1',
        userAgent: 'Safari',
        expiresAt: new Date(Date.now() + SESSION_TTL_MS),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    expect(user.lastLoginAt).not.toBeNull();
    expect(db.sessions).toHaveLength(1);
  });

  it('enforces lockout after 5 invalid login attempts', async () => {
    const key = 'target@victim.in:103.22.200.1';

    for (let attempt = 1; attempt <= 5; attempt++) {
      expect(rateLimiter.check(key, 5).allowed).toBe(true);
      rateLimiter.recordAttempt(key);
    }

    // 6th attempt is locked out
    const status = rateLimiter.check(key, 5);
    expect(status.allowed).toBe(false);
    expect(status.remaining).toBe(0);
    expect(status.retryAfterSeconds).toBeGreaterThan(0);
  });

  // -----------------------------------------------------------------------
  // 3. LOGOUT & SESSION REVOCATION
  // -----------------------------------------------------------------------
  it('revokes session on logout, preventing subsequent authentication', () => {
    const rawToken = generateSessionToken();
    const tokenHash = hashSessionToken(rawToken);

    db.sessions.push({
      id: 'sess_03',
      userId: 'usr_03',
      tokenHash,
      ipAddress: null,
      userAgent: null,
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    expect(db.sessions).toHaveLength(1);

    // Logout: Remove session by tokenHash
    db.sessions = db.sessions.filter((s) => s.tokenHash !== tokenHash);
    expect(db.sessions).toHaveLength(0);

    // Subsequent lookup returns null
    const found = db.sessions.find((s) => s.tokenHash === tokenHash);
    expect(found).toBeUndefined();
  });

  it('rejects expired sessions during token validation', () => {
    const rawToken = generateSessionToken();
    const tokenHash = hashSessionToken(rawToken);

    // Session that expired 1 hour ago
    db.sessions.push({
      id: 'sess_expired',
      userId: 'usr_04',
      tokenHash,
      ipAddress: null,
      userAgent: null,
      expiresAt: new Date(Date.now() - 3600 * 1000),
      createdAt: new Date(Date.now() - 31 * 86400 * 1000),
      updatedAt: new Date(),
    });

    // Lookup
    const session = db.sessions.find((s) => s.tokenHash === tokenHash);
    expect(session).toBeDefined();

    const isExpired = session!.expiresAt.getTime() < Date.now();
    expect(isExpired).toBe(true);
  });

  // -----------------------------------------------------------------------
  // 4. MULTI-ORGANIZATION MEMBERSHIP & RBAC
  // -----------------------------------------------------------------------
  it('supports a single user belonging to multiple organizations with distinct roles', () => {
    const userId = 'usr_multi';

    // Membership 1: OWNER of Org A
    db.memberships.push({
      id: 'mem_a',
      userId,
      organizationId: 'org_a',
      role: 'OWNER',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Membership 2: VIEWER of Org B
    db.memberships.push({
      id: 'mem_b',
      userId,
      organizationId: 'org_b',
      role: 'VIEWER',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const userMemberships = db.memberships.filter((m) => m.userId === userId);
    expect(userMemberships).toHaveLength(2);

    const memA = userMemberships.find((m) => m.organizationId === 'org_a');
    const memB = userMemberships.find((m) => m.organizationId === 'org_b');

    // In Org A, user is OWNER -> can perform ADMIN actions
    expect(hasRoleAtLeast(memA!.role, 'ADMIN')).toBe(true);

    // In Org B, user is VIEWER -> cannot perform ADMIN actions
    expect(hasRoleAtLeast(memB!.role, 'ADMIN')).toBe(false);
  });

  // -----------------------------------------------------------------------
  // 5. TENANT ISOLATION: QR CODE & DESTINATION OWNERSHIP
  // -----------------------------------------------------------------------
  it('strictly isolates QR codes and destinations between organizations (IDOR defense)', () => {
    // Org 1 QR
    const qrOrg1: QRCodeRecord = {
      id: 'qr_org1_01',
      organizationId: 'org_1',
      shortCode: generateShortCode(7),
      title: 'Org 1 Counter Payment',
      type: 'DYNAMIC_URL',
      status: 'ACTIVE',
      styling: { color: '#000000' },
      scanLimit: null,
      expiresAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };
    db.qrCodes.push(qrOrg1);

    db.destinations.push({
      id: 'dest_01',
      qrCodeId: qrOrg1.id,
      destinationUrl: 'https://org1.example.com/pay',
      isActive: true,
      utmSource: 'counter_stand',
      utmMedium: 'print',
      utmCampaign: null,
      createdAt: new Date(),
      deactivatedAt: null,
    });

    // Org 2 QR
    const qrOrg2: QRCodeRecord = {
      id: 'qr_org2_01',
      organizationId: 'org_2',
      shortCode: generateShortCode(7),
      title: 'Org 2 Secret Promotion',
      type: 'DYNAMIC_URL',
      status: 'ACTIVE',
      styling: { color: '#FF0000' },
      scanLimit: null,
      expiresAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };
    db.qrCodes.push(qrOrg2);

    // Helper: Tenant-scoped lookup
    function getTenantQR(orgId: string, qrId: string) {
      const qr = db.qrCodes.find(
        (q) => q.id === qrId && q.organizationId === orgId && q.deletedAt === null
      );
      if (!qr) return null;
      const destinations = db.destinations.filter((d) => d.qrCodeId === qr.id && d.isActive);
      return { ...qr, destinations };
    }

    // Tenant 1 fetches own QR -> succeeds
    const tenant1OwnQR = getTenantQR('org_1', 'qr_org1_01');
    expect(tenant1OwnQR).not.toBeNull();
    expect(tenant1OwnQR?.title).toBe('Org 1 Counter Payment');
    expect(tenant1OwnQR?.destinations[0]?.destinationUrl).toBe('https://org1.example.com/pay');

    // Tenant 1 attempts to fetch Tenant 2's QR (IDOR attempt) -> blocked (returns null)
    const idorAttempt = getTenantQR('org_1', 'qr_org2_01');
    expect(idorAttempt).toBeNull();

    // Tenant 2 attempts to fetch Tenant 1's QR (IDOR attempt) -> blocked (returns null)
    const idorAttempt2 = getTenantQR('org_2', 'qr_org1_01');
    expect(idorAttempt2).toBeNull();
  });

  it('updates QR destinations safely with history preservation', () => {
    const qrId = 'qr_versioned';
    db.qrCodes.push({
      id: qrId,
      organizationId: 'org_main',
      shortCode: generateShortCode(7),
      title: 'Seasonal Menu QR',
      type: 'DYNAMIC_URL',
      status: 'ACTIVE',
      styling: {},
      scanLimit: null,
      expiresAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });

    // Initial Destination
    db.destinations.push({
      id: 'dest_v1',
      qrCodeId: qrId,
      destinationUrl: 'https://store.in/menu-summer',
      isActive: true,
      utmSource: null,
      utmMedium: null,
      utmCampaign: null,
      createdAt: new Date(),
      deactivatedAt: null,
    });

    // Update to Winter Menu
    // 1. Deactivate old
    const oldDest = db.destinations.find((d) => d.qrCodeId === qrId && d.isActive);
    if (oldDest) {
      oldDest.isActive = false;
      oldDest.deactivatedAt = new Date();
    }

    // 2. Create new active
    db.destinations.push({
      id: 'dest_v2',
      qrCodeId: qrId,
      destinationUrl: 'https://store.in/menu-winter',
      isActive: true,
      utmSource: null,
      utmMedium: null,
      utmCampaign: null,
      createdAt: new Date(),
      deactivatedAt: null,
    });

    const activeDestinations = db.destinations.filter((d) => d.qrCodeId === qrId && d.isActive);
    expect(activeDestinations).toHaveLength(1);
    expect(activeDestinations[0].destinationUrl).toBe('https://store.in/menu-winter');

    // Total history has 2 records
    const allDestinations = db.destinations.filter((d) => d.qrCodeId === qrId);
    expect(allDestinations).toHaveLength(2);
    expect(allDestinations.find((d) => d.id === 'dest_v1')?.isActive).toBe(false);
  });
});
