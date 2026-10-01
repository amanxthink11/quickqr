import { describe, it, expect, beforeEach } from 'vitest';
import {
  hashPassword,
  verifyPassword,
} from '../src/lib/auth/password';
import {
  generateSessionToken,
  hashSessionToken,
  getSessionCookieOptions,
  SESSION_COOKIE_NAME,
  SESSION_TTL_MS,
} from '../src/lib/auth/session';
import {
  ROLE_HIERARCHY,
  hasRoleAtLeast,
} from '../src/lib/auth/rbac';
import {
  validateDestinationUrl,
} from '../src/lib/validation/url-safety';
import {
  registerSchema,
  loginSchema,
  createOrganizationSchema,
  createQRCodeSchema,
} from '../src/lib/validation/auth-schemas';
import {
  SlidingWindowRateLimiter,
} from '../src/lib/auth/rate-limiter';
import { generateShortCode } from '../src/lib/auth/tenancy';

// =========================================================================
// 1. PASSWORD SECURITY (Argon2id)
// =========================================================================
describe('Phase 2A: Password Security (Argon2id)', () => {
  it('hashes password with Argon2id parameters', async () => {
    const raw = 'StrongP@ssw0rd!123';
    const hash = await hashPassword(raw);

    expect(hash).toBeDefined();
    expect(typeof hash).toBe('string');
    // Argon2id hashes begin with $argon2id$
    expect(hash.startsWith('$argon2id$')).toBe(true);
    // Parameters check: m=65536, t=3, p=1
    expect(hash).toContain('m=65536');
    expect(hash).toContain('t=3');
    expect(hash).toContain('p=1');
  });

  it('successfully verifies a valid password', async () => {
    const raw = 'CorrectHorseBatteryStaple#99';
    const hash = await hashPassword(raw);
    const isValid = await verifyPassword(raw, hash);

    expect(isValid).toBe(true);
  });

  it('rejects an incorrect password', async () => {
    const raw = 'CorrectHorseBatteryStaple#99';
    const hash = await hashPassword(raw);
    const isValid = await verifyPassword('WrongPassword123!', hash);

    expect(isValid).toBe(false);
  });

  it('rejects passwords below 8 characters or above 128 characters', async () => {
    await expect(hashPassword('short1!')).rejects.toThrow(/at least 8 characters/);

    const longPassword = 'A'.repeat(129) + '1!';
    await expect(hashPassword(longPassword)).rejects.toThrow(/not exceed 128 characters/);
  });

  it('rejects passwords containing null bytes to prevent truncation attacks', async () => {
    await expect(hashPassword('validpass\0word123')).rejects.toThrow(/null bytes/);
  });
});

// =========================================================================
// 2. SESSION SYSTEM (CSPRNG & SHA-256 Hashing)
// =========================================================================
describe('Phase 2A: Session Security & Token Hashing', () => {
  it('generates 32-byte (64 hex characters) CSPRNG session tokens', () => {
    const token1 = generateSessionToken();
    const token2 = generateSessionToken();

    expect(token1).toHaveLength(64);
    expect(token2).toHaveLength(64);
    expect(token1).not.toBe(token2);
    // Must be valid hexadecimal
    expect(/^[a-f0-9]{64}$/.test(token1)).toBe(true);
  });

  it('computes deterministic SHA-256 hash of raw tokens', () => {
    const raw = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
    const hash1 = hashSessionToken(raw);
    const hash2 = hashSessionToken(raw);

    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64);
    // Hash must differ from the raw token
    expect(hash1).not.toBe(raw);
  });

  it('verifies session cookie options adhere to security standards', () => {
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
    const options = getSessionCookieOptions(expiresAt);

    expect(options.httpOnly).toBe(true);
    expect(options.sameSite).toBe('lax');
    expect(options.path).toBe('/');
    expect(options.expires).toEqual(expiresAt);
    expect(SESSION_COOKIE_NAME).toBe('quickqr_session');
  });
});

// =========================================================================
// 3. RBAC (Role Hierarchy & Authorization Matrix)
// =========================================================================
describe('Phase 2A: RBAC & Permission Hierarchy', () => {
  it('verifies role hierarchy levels (OWNER > ADMIN > MEMBER > VIEWER)', () => {
    expect(ROLE_HIERARCHY.OWNER).toBeGreaterThan(ROLE_HIERARCHY.ADMIN);
    expect(ROLE_HIERARCHY.ADMIN).toBeGreaterThan(ROLE_HIERARCHY.MEMBER);
    expect(ROLE_HIERARCHY.MEMBER).toBeGreaterThan(ROLE_HIERARCHY.VIEWER);
  });

  it('allows OWNER to perform all lower-tier roles', () => {
    expect(hasRoleAtLeast('OWNER', 'OWNER')).toBe(true);
    expect(hasRoleAtLeast('OWNER', 'ADMIN')).toBe(true);
    expect(hasRoleAtLeast('OWNER', 'MEMBER')).toBe(true);
    expect(hasRoleAtLeast('OWNER', 'VIEWER')).toBe(true);
  });

  it('allows ADMIN for ADMIN, MEMBER, VIEWER, but denies OWNER', () => {
    expect(hasRoleAtLeast('ADMIN', 'OWNER')).toBe(false);
    expect(hasRoleAtLeast('ADMIN', 'ADMIN')).toBe(true);
    expect(hasRoleAtLeast('ADMIN', 'MEMBER')).toBe(true);
    expect(hasRoleAtLeast('ADMIN', 'VIEWER')).toBe(true);
  });

  it('allows MEMBER for MEMBER, VIEWER, but denies ADMIN and OWNER', () => {
    expect(hasRoleAtLeast('MEMBER', 'OWNER')).toBe(false);
    expect(hasRoleAtLeast('MEMBER', 'ADMIN')).toBe(false);
    expect(hasRoleAtLeast('MEMBER', 'MEMBER')).toBe(true);
    expect(hasRoleAtLeast('MEMBER', 'VIEWER')).toBe(true);
  });

  it('VIEWER cannot perform MEMBER, ADMIN, or OWNER actions', () => {
    expect(hasRoleAtLeast('VIEWER', 'OWNER')).toBe(false);
    expect(hasRoleAtLeast('VIEWER', 'ADMIN')).toBe(false);
    expect(hasRoleAtLeast('VIEWER', 'MEMBER')).toBe(false);
    expect(hasRoleAtLeast('VIEWER', 'VIEWER')).toBe(true);
  });
});

// =========================================================================
// 4. URL SAFETY & ANTI-SSRF DEFENSE
// =========================================================================
describe('Phase 2A: URL Safety & Anti-SSRF Defense', () => {
  it('accepts legitimate public HTTP and HTTPS URLs', () => {
    expect(validateDestinationUrl('https://quickqr.in/menu').isValid).toBe(true);
    expect(validateDestinationUrl('https://example.com/checkout?id=99').isValid).toBe(true);
    expect(validateDestinationUrl('http://mybusiness.co.in').isValid).toBe(true);
  });

  it('rejects disallowed protocols (javascript:, file:, data:, blob:)', () => {
    expect(validateDestinationUrl('javascript:alert(1)').isValid).toBe(false);
    expect(validateDestinationUrl('file:///etc/passwd').isValid).toBe(false);
    expect(validateDestinationUrl('data:text/html;base64,PHNjcmlwdD4=').isValid).toBe(false);
    expect(validateDestinationUrl('blob:https://example.com/123').isValid).toBe(false);
  });

  it('blocks loopback and localhost destinations', () => {
    expect(validateDestinationUrl('http://localhost:3000').isValid).toBe(false);
    expect(validateDestinationUrl('http://127.0.0.1:8080/admin').isValid).toBe(false);
    expect(validateDestinationUrl('http://[::1]:80').isValid).toBe(false);
    expect(validateDestinationUrl('http://0.0.0.0:8000').isValid).toBe(false);
  });

  it('blocks private IP addresses (RFC 1918)', () => {
    // 10.0.0.0/8
    expect(validateDestinationUrl('http://10.0.0.1/dashboard').isValid).toBe(false);
    // 192.168.0.0/16
    expect(validateDestinationUrl('http://192.168.1.1').isValid).toBe(false);
    // 172.16.0.0 - 172.31.255.255
    expect(validateDestinationUrl('http://172.16.0.5/api').isValid).toBe(false);
    expect(validateDestinationUrl('http://172.31.255.254').isValid).toBe(false);
  });

  it('blocks AWS/GCP/Azure cloud metadata IP (169.254.169.254)', () => {
    expect(validateDestinationUrl('http://169.254.169.254/latest/meta-data/').isValid).toBe(false);
  });

  it('blocks internal/private TLDs (.local, .internal, .lan, .corp)', () => {
    expect(validateDestinationUrl('http://server.local/api').isValid).toBe(false);
    expect(validateDestinationUrl('http://database.internal:5432').isValid).toBe(false);
    expect(validateDestinationUrl('http://gateway.lan').isValid).toBe(false);
  });
});

// =========================================================================
// 5. INPUT VALIDATION (Zod Schemas)
// =========================================================================
describe('Phase 2A: Zod Validation Schemas', () => {
  it('validates user registration schema', () => {
    const valid = registerSchema.safeParse({
      email: 'Rohan@Company.IN',
      password: 'SecurePassword123!',
      fullName: 'Rohan Sharma',
      organizationName: 'Chai Point',
    });
    expect(valid.success).toBe(true);
    if (valid.success) {
      expect(valid.data.email).toBe('rohan@company.in'); // lowercased & trimmed
    }
  });

  it('rejects registration with invalid email or weak password', () => {
    const invalidEmail = registerSchema.safeParse({
      email: 'not-an-email',
      password: 'SecurePassword123!',
      fullName: 'Rohan',
    });
    expect(invalidEmail.success).toBe(false);

    const weakPassword = registerSchema.safeParse({
      email: 'valid@example.com',
      password: 'onlyletters',
      fullName: 'Rohan',
    });
    expect(weakPassword.success).toBe(false);

    const tooShort = registerSchema.safeParse({
      email: 'valid@example.com',
      password: 'p1!',
      fullName: 'Rohan',
    });
    expect(tooShort.success).toBe(false);
  });

  it('validates login schema', () => {
    const valid = loginSchema.safeParse({
      email: 'user@example.com',
      password: 'MyPassword123!',
    });
    expect(valid.success).toBe(true);

    const invalid = loginSchema.safeParse({
      email: 'invalid',
      password: '',
    });
    expect(invalid.success).toBe(false);
  });

  it('validates organization creation schema', () => {
    const valid = createOrganizationSchema.safeParse({
      name: 'Acme Retail India',
      slug: 'acme-retail',
    });
    expect(valid.success).toBe(true);

    const invalidSlug = createOrganizationSchema.safeParse({
      name: 'Acme Retail',
      slug: 'Invalid Slug With Spaces!',
    });
    expect(invalidSlug.success).toBe(false);
  });

  it('validates QR code creation schema with tenant destination', () => {
    const valid = createQRCodeSchema.safeParse({
      title: 'Counter Payment Stand',
      type: 'DYNAMIC_URL',
      styling: { dotsColor: '#000000' },
      destinationUrl: 'https://example.com/pay',
    });
    expect(valid.success).toBe(true);

    // Rejects SSRF loopback in destination URL
    const invalidSSRF = createQRCodeSchema.safeParse({
      title: 'Attack QR',
      type: 'DYNAMIC_URL',
      styling: {},
      destinationUrl: 'http://127.0.0.1:8000/admin',
    });
    expect(invalidSSRF.success).toBe(false);
  });
});

// =========================================================================
// 6. RATE LIMITING (In-Memory Sliding Window)
// =========================================================================
describe('Phase 2A: Login Rate Limiting & Account Lockout', () => {
  let limiter: SlidingWindowRateLimiter;

  beforeEach(() => {
    limiter = new SlidingWindowRateLimiter();
  });

  it('permits initial attempts below the threshold', () => {
    const key = 'test@example.com:127.0.0.1';
    expect(limiter.check(key, 5).allowed).toBe(true);
    limiter.recordAttempt(key);
    expect(limiter.check(key, 5).allowed).toBe(true);
  });

  it('locks out after 5 consecutive failed attempts', () => {
    const key = 'victim@example.com:192.0.2.1';

    for (let i = 0; i < 5; i++) {
      limiter.recordAttempt(key);
    }

    const blocked = limiter.check(key, 5);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it('clears failed attempts upon successful login', () => {
    const key = 'user@example.com:192.0.2.2';

    // 4 failed attempts
    for (let i = 0; i < 4; i++) {
      limiter.recordAttempt(key);
    }
    expect(limiter.check(key, 5).remaining).toBe(1);

    // Successful login resets tracker
    limiter.reset(key);
    expect(limiter.check(key, 5).remaining).toBe(5);
  });
});

// =========================================================================
// 7. SHORTCODE GENERATION (Base62 & Entropy)
// =========================================================================
describe('Phase 2A: ShortCode Generation', () => {
  it('generates 7-character Base62 codes', () => {
    const code = generateShortCode(7);
    expect(code).toHaveLength(7);
    expect(/^[0-9a-zA-Z]{7}$/.test(code)).toBe(true);
  });

  it('generates high-entropy non-repeating codes', () => {
    const codes = new Set<string>();
    for (let i = 0; i < 100; i++) {
      codes.add(generateShortCode(7));
    }
    expect(codes.size).toBe(100);
  });
});

// =========================================================================
// 8. MULTI-TENANT ISOLATION & IDOR DEFENSE SIMULATION
// =========================================================================
describe('Phase 2A: Tenant Isolation & IDOR Defense Logic', () => {
  interface MockQR {
    id: string;
    organizationId: string;
    title: string;
    shortCode: string;
    deletedAt: Date | null;
  }

  const mockDatabase: MockQR[] = [
    {
      id: 'qr-tenant-1-stand',
      organizationId: 'org-alpha',
      title: 'Alpha Main Counter',
      shortCode: 'abc1234',
      deletedAt: null,
    },
    {
      id: 'qr-tenant-2-stand',
      organizationId: 'org-beta',
      title: 'Beta Secret Stand',
      shortCode: 'xyz9876',
      deletedAt: null,
    },
    {
      id: 'qr-tenant-1-deleted',
      organizationId: 'org-alpha',
      title: 'Alpha Old Stand',
      shortCode: 'del1111',
      deletedAt: new Date(),
    },
  ];

  // Simulates tenant-scoped query pattern: where: { id, organizationId, deletedAt: null }
  function findTenantQRCode(orgId: string, qrId: string): MockQR | null {
    return (
      mockDatabase.find(
        (qr) => qr.id === qrId && qr.organizationId === orgId && qr.deletedAt === null
      ) || null
    );
  }

  it('prevents IDOR: Tenant Alpha cannot read Tenant Beta QR code', () => {
    // Org Alpha querying its own QR succeeds
    const alphaQR = findTenantQRCode('org-alpha', 'qr-tenant-1-stand');
    expect(alphaQR).not.toBeNull();
    expect(alphaQR?.title).toBe('Alpha Main Counter');

    // Org Alpha querying Org Beta QR code by ID returns null (IDOR blocked)
    const hijackedQR = findTenantQRCode('org-alpha', 'qr-tenant-2-stand');
    expect(hijackedQR).toBeNull();
  });

  it('prevents IDOR: Tenant Beta cannot read Tenant Alpha QR code', () => {
    const hijackedQR = findTenantQRCode('org-beta', 'qr-tenant-1-stand');
    expect(hijackedQR).toBeNull();
  });

  it('excludes soft-deleted QR codes from tenant lookups', () => {
    const deletedQR = findTenantQRCode('org-alpha', 'qr-tenant-1-deleted');
    expect(deletedQR).toBeNull();
  });
});
