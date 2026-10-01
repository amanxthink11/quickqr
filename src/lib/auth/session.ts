import crypto from 'crypto';
import { prisma } from '@/lib/db/prisma';
import { cookies } from 'next/headers';
import { User, Session, UserRole, Organization } from '@prisma/client';

export const SESSION_COOKIE_NAME = 'quickqr_session';
export const SESSION_TTL_DAYS = 30;
export const SESSION_TTL_MS = SESSION_TTL_DAYS * 24 * 60 * 60 * 1000;

export interface SessionValidationResult {
  session: Session;
  user: Omit<User, 'passwordHash'>;
}

export interface AuthenticatedContext extends SessionValidationResult {
  activeOrganization: Organization | null;
  role: UserRole | null;
  memberships: {
    organizationId: string;
    organizationName: string;
    organizationSlug: string;
    role: UserRole;
  }[];
}

/**
 * Computes deterministic SHA-256 hash of a raw session token.
 * Only the hash is stored in the database.
 */
export function hashSessionToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

/**
 * Generates a 32-byte cryptographically secure random session token.
 */
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Standard secure cookie options conforming to Phase 2A security specification.
 */
export function getSessionCookieOptions(expiresAt: Date) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    expires: expiresAt,
  };
}

/**
 * Creates a database-backed session for a user and returns the raw token to set in the cookie.
 */
export async function createSession(
  userId: string,
  meta?: { ipAddress?: string; userAgent?: string }
): Promise<{ session: Session; rawToken: string }> {
  const rawToken = generateSessionToken();
  const tokenHash = hashSessionToken(rawToken);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  const session = await prisma.session.create({
    data: {
      userId,
      tokenHash,
      ipAddress: meta?.ipAddress || null,
      userAgent: meta?.userAgent || null,
      expiresAt,
    },
  });

  return { session, rawToken };
}

/**
 * Validates a raw session token against the database:
 * 1. Hashes the raw token with SHA-256
 * 2. Checks token exists and is not expired
 * 3. Returns the safe user profile (without passwordHash) and session record
 */
export async function validateSessionToken(
  rawToken: string
): Promise<SessionValidationResult | null> {
  if (!rawToken || typeof rawToken !== 'string') {
    return null;
  }

  const tokenHash = hashSessionToken(rawToken);

  const session = await prisma.session.findUnique({
    where: { tokenHash },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          fullName: true,
          avatarUrl: true,
          emailVerifiedAt: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
          deletedAt: true,
        },
      },
    },
  });

  if (!session) {
    return null;
  }

  // Reject expired sessions or soft-deleted users
  if (session.expiresAt.getTime() < Date.now() || session.user.deletedAt !== null) {
    // Clean up expired session asynchronously
    await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }

  return {
    session,
    user: session.user,
  };
}

/**
 * Destroys a session in the database given its raw token.
 */
export async function destroySession(rawToken: string): Promise<void> {
  if (!rawToken || typeof rawToken !== 'string') return;
  const tokenHash = hashSessionToken(rawToken);
  await prisma.session.deleteMany({
    where: { tokenHash },
  });
}

/**
 * Revokes all active sessions for a user (e.g. upon password reset or security breach).
 */
export async function destroyAllUserSessions(userId: string): Promise<void> {
  if (!userId) return;
  await prisma.session.deleteMany({
    where: { userId },
  });
}

export const ACTIVE_ORG_COOKIE_NAME = 'quickqr_active_org';

/**
 * Reads and sets session cookies via Next.js next/headers.
 */
export async function setSessionTokenCookie(rawToken: string, expiresAt: Date): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, rawToken, getSessionCookieOptions(expiresAt));
}

export async function clearSessionTokenCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  cookieStore.delete(ACTIVE_ORG_COOKIE_NAME);
}

export async function getSessionTokenFromCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE_NAME)?.value || null;
}

export async function getActiveOrgIdFromCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(ACTIVE_ORG_COOKIE_NAME)?.value || null;
}

export async function setActiveOrgIdCookie(organizationId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_ORG_COOKIE_NAME, organizationId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_DAYS * 24 * 60 * 60,
  });
}

export async function clearActiveOrgIdCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ACTIVE_ORG_COOKIE_NAME);
}

/**
 * High-level helper: Retrieves current session and full multi-tenant context from cookies.
 * Resolves active organization using server-validated membership check.
 */
export async function getCurrentSession(): Promise<AuthenticatedContext | null> {
  const rawToken = await getSessionTokenFromCookie();
  if (!rawToken) return null;

  const result = await validateSessionToken(rawToken);
  if (!result) return null;

  // Retrieve user's memberships and organizations
  const memberships = await prisma.membership.findMany({
    where: { userId: result.user.id },
    include: {
      organization: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  const formattedMemberships = memberships
    .filter((m) => m.organization.deletedAt === null)
    .map((m) => ({
      organizationId: m.organizationId,
      organizationName: m.organization.name,
      organizationSlug: m.organization.slug,
      role: m.role,
    }));

  // Resolve active organization using secure server-validated cookie
  const cookieOrgId = await getActiveOrgIdFromCookie();
  let activeMembership = null;

  if (cookieOrgId) {
    // Only permit if authenticated user genuinely belongs to this non-deleted organization
    activeMembership =
      memberships.find(
        (m) => m.organizationId === cookieOrgId && m.organization.deletedAt === null
      ) || null;
  }

  // Fallback to primary valid membership if cookie is absent, tampered, or stale
  if (!activeMembership) {
    activeMembership =
      memberships.find((m) => m.organization.deletedAt === null) || memberships[0] || null;
  }

  const activeOrganization = activeMembership ? activeMembership.organization : null;
  const role = activeMembership ? activeMembership.role : null;

  return {
    ...result,
    activeOrganization,
    role,
    memberships: formattedMemberships,
  };
}

/**
 * Guard: Requires authentication or throws an error.
 */
export async function requireAuth(): Promise<AuthenticatedContext> {
  const ctx = await getCurrentSession();
  if (!ctx) {
    throw new Error('UNAUTHORIZED: Authentication required');
  }
  return ctx;
}
