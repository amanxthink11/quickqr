import crypto from 'crypto';
import { prisma } from '@/lib/db/prisma';
import { hashPassword, verifyPassword } from './password';
import { createSession, destroySession } from './session';
import { authRateLimiter } from './rate-limiter';
import { registerSchema, loginSchema, RegisterInput, LoginInput } from '@/lib/validation/auth-schemas';
import { User, Organization, Membership, Session } from '@prisma/client';

export function generateOrgSlug(name: string): string {
  const base =
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'business';
  const randomSuffix = crypto.randomBytes(3).toString('hex');
  return `${base.slice(0, 40)}-${randomSuffix}`;
}

export interface RegisterResult {
  user: Omit<User, 'passwordHash'>;
  organization: Organization;
  membership: Membership;
  session: Session;
  rawToken: string;
}

export interface LoginResult {
  user: Omit<User, 'passwordHash'>;
  session: Session;
  rawToken: string;
}

/**
 * Registers a new user account, creates their primary Organization,
 * grants OWNER membership, and establishes their initial session atomically.
 */
export async function registerUser(
  rawInput: RegisterInput,
  meta?: { ipAddress?: string; userAgent?: string }
): Promise<RegisterResult> {
  const validated = registerSchema.parse(rawInput);
  const normalizedEmail = validated.email.trim().toLowerCase();

  // Rate limit registration by IP (max 5 per hour)
  const clientIp = meta?.ipAddress || 'unknown';
  const rateLimitKey = `register:${clientIp}`;
  const rateCheck = authRateLimiter.check(rateLimitKey, 5, 60 * 60 * 1000, 60 * 60 * 1000);
  if (!rateCheck.allowed) {
    throw new Error(`Too many registration attempts. Please retry in ${rateCheck.retryAfterSeconds} seconds.`);
  }

  // Check if active user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, deletedAt: true },
  });

  if (existingUser && existingUser.deletedAt === null) {
    authRateLimiter.recordAttempt(rateLimitKey);
    throw new Error('An account with this email address already exists');
  }

  // Hash password using Argon2id
  const passwordHash = await hashPassword(validated.password);

  const orgName = validated.organizationName?.trim() || `${validated.fullName.trim()}'s Business`;
  const orgSlug = generateOrgSlug(orgName);

  // Execute atomic registration in transaction
  const result = await prisma.$transaction(async (tx) => {
    // 1. Create or reactivate User
    let userRecord: User;
    if (existingUser && existingUser.deletedAt !== null) {
      userRecord = await tx.user.update({
        where: { id: existingUser.id },
        data: {
          fullName: validated.fullName.trim(),
          passwordHash,
          deletedAt: null,
          lastLoginAt: new Date(),
        },
      });
    } else {
      userRecord = await tx.user.create({
        data: {
          email: normalizedEmail,
          fullName: validated.fullName.trim(),
          passwordHash,
          lastLoginAt: new Date(),
        },
      });
    }

    // 2. Create Organization
    const organizationRecord = await tx.organization.create({
      data: {
        name: orgName,
        slug: orgSlug,
      },
    });

    // 3. Create OWNER Membership
    const membershipRecord = await tx.membership.create({
      data: {
        userId: userRecord.id,
        organizationId: organizationRecord.id,
        role: 'OWNER',
      },
    });

    return {
      user: userRecord,
      organization: organizationRecord,
      membership: membershipRecord,
    };
  });

  authRateLimiter.reset(rateLimitKey);

  // 4. Create database-backed Session
  const { session, rawToken } = await createSession(result.user.id, meta);

  // Strip password hash from returned user object
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash: _unused, ...safeUser } = result.user;

  return {
    user: safeUser,
    organization: result.organization,
    membership: result.membership,
    session,
    rawToken,
  };
}

/**
 * Authenticates user credentials with Argon2id and creates a session.
 * Protects against brute-force attacks via sliding-window rate limiting.
 */
export async function loginUser(
  rawInput: LoginInput,
  meta?: { ipAddress?: string; userAgent?: string }
): Promise<LoginResult> {
  const validated = loginSchema.parse(rawInput);
  const normalizedEmail = validated.email.trim().toLowerCase();
  const clientIp = meta?.ipAddress || 'unknown';
  const rateLimitKey = `login:${normalizedEmail}:${clientIp}`;

  // 1. Check Rate Limit (5 attempts / 15 minutes)
  const rateCheck = authRateLimiter.check(rateLimitKey, 5, 15 * 60 * 1000, 15 * 60 * 1000);
  if (!rateCheck.allowed) {
    throw new Error(
      `Account temporarily locked due to multiple failed login attempts. Please retry in ${rateCheck.retryAfterSeconds} seconds.`
    );
  }

  // 2. Find User
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  // Generic credential error to prevent email enumeration
  const invalidCredentialsError = 'Invalid email address or password';

  if (!user || user.deletedAt !== null || !user.passwordHash) {
    authRateLimiter.recordAttempt(rateLimitKey);
    throw new Error(invalidCredentialsError);
  }

  // 3. Verify Password using Argon2id
  const isValidPassword = await verifyPassword(validated.password, user.passwordHash);
  if (!isValidPassword) {
    authRateLimiter.recordAttempt(rateLimitKey);
    throw new Error(invalidCredentialsError);
  }

  // 4. Reset rate limit on success
  authRateLimiter.reset(rateLimitKey);

  // 5. Update lastLoginAt
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  // 6. Create Session
  const { session, rawToken } = await createSession(user.id, meta);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash: _unused, ...safeUser } = user;

  return {
    user: safeUser,
    session,
    rawToken,
  };
}

/**
 * Terminates user session.
 */
export async function logoutUser(rawToken: string): Promise<void> {
  await destroySession(rawToken);
}
