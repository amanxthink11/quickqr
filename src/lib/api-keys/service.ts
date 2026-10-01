import crypto from 'crypto';
import { prisma } from '@/lib/db/prisma';
import { requireOrganizationRole } from '@/lib/auth/rbac';
import { CreateApiKeyInput, CreateApiKeyResult, ApiKeySafe } from './types';
import { ApiKey, Organization } from '@prisma/client';

export const API_KEY_PREFIX = 'qk_live_';
export const API_KEY_REGEX = /^qk_live_[0-9a-fA-F]{64}$/;

/**
 * Computes deterministic SHA-256 hash of raw API key.
 * Only the hash is ever stored in PostgreSQL.
 */
export function hashApiKey(rawKey: string): string {
  return crypto.createHash('sha256').update(rawKey).digest('hex');
}

/**
 * Extracts public prefix (16 characters: 'qk_live_' + 8 hex chars) for fast indexed lookup.
 */
export function extractKeyPrefix(rawKey: string): string {
  return rawKey.slice(0, 16);
}

/**
 * Generates a new cryptographically secure API key.
 * Format: qk_live_<64-hex-chars> (256 bits of CSPRNG entropy).
 *
 * RBAC: Only OWNER or ADMIN may create API keys.
 */
export async function createApiKey(
  userId: string,
  organizationId: string,
  input: CreateApiKeyInput
): Promise<CreateApiKeyResult> {
  // 1. RBAC Guard: ADMIN or OWNER required
  await requireOrganizationRole(userId, organizationId, 'ADMIN');

  const name = input.name?.trim();
  if (!name || name.length === 0) {
    throw new Error('API key name is required');
  }
  if (name.length > 100) {
    throw new Error('API key name cannot exceed 100 characters');
  }

  // 2. Generate CSPRNG 32 bytes (64 hex characters)
  const randomHex = crypto.randomBytes(32).toString('hex');
  const rawKey = `${API_KEY_PREFIX}${randomHex}`;
  const keyPrefix = extractKeyPrefix(rawKey);
  const keyHash = hashApiKey(rawKey);

  const scopes = input.scopes && input.scopes.length > 0 ? input.scopes : ['*'];

  // 3. Persist hash and prefix in DB (RAW KEY IS NEVER SAVED)
  const apiKeyRecord = await prisma.apiKey.create({
    data: {
      organizationId,
      name,
      keyPrefix,
      keyHash,
      scopes,
      expiresAt: input.expiresAt || null,
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { keyHash: _unused, ...safeApiKey } = apiKeyRecord;

  return {
    apiKey: safeApiKey,
    rawKey,
  };
}

/**
 * Lists all API keys for an organization.
 * Key hashes are strictly excluded from the result.
 *
 * RBAC: Only OWNER or ADMIN may view API keys.
 */
export async function listApiKeys(
  userId: string,
  organizationId: string
): Promise<ApiKeySafe[]> {
  await requireOrganizationRole(userId, organizationId, 'ADMIN');

  const keys = await prisma.apiKey.findMany({
    where: { organizationId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      organizationId: true,
      name: true,
      keyPrefix: true,
      scopes: true,
      createdAt: true,
      updatedAt: true,
      lastUsedAt: true,
      expiresAt: true,
      revokedAt: true,
    },
  });

  return keys;
}

/**
 * Revokes an existing API key immediately.
 *
 * RBAC: Only OWNER or ADMIN may revoke API keys.
 */
export async function revokeApiKey(
  userId: string,
  organizationId: string,
  apiKeyId: string
): Promise<ApiKeySafe> {
  await requireOrganizationRole(userId, organizationId, 'ADMIN');

  // Verify ownership within tenant boundary
  const existing = await prisma.apiKey.findFirst({
    where: {
      id: apiKeyId,
      organizationId,
    },
  });

  if (!existing) {
    throw new Error('API key not found in this organization');
  }

  const updated = await prisma.apiKey.update({
    where: { id: apiKeyId },
    data: { revokedAt: new Date() },
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { keyHash: _unused, ...safeApiKey } = updated;
  return safeApiKey;
}

/**
 * Authenticates an incoming API key:
 * 1. Syntax validation (qk_live_<64-hex>)
 * 2. Prefix-indexed candidate lookup (O(1) btree index)
 * 3. Timing-safe cryptographic hash comparison
 * 4. Checks revocation and expiration
 * 5. Checks organization active status
 * 6. Throttled lastUsedAt update (max 1 DB write per minute)
 */
export async function authenticateApiKey(
  rawKey: string
): Promise<{ apiKey: ApiKey; organization: Organization } | null> {
  if (!rawKey || typeof rawKey !== 'string') {
    return null;
  }

  const trimmed = rawKey.trim();
  if (!API_KEY_REGEX.test(trimmed)) {
    return null;
  }

  const prefix = extractKeyPrefix(trimmed);
  const targetHash = hashApiKey(trimmed);

  // Prefix-indexed lookup of active candidate keys
  const candidates = await prisma.apiKey.findMany({
    where: {
      keyPrefix: prefix,
      revokedAt: null,
    },
    include: {
      organization: true,
    },
    take: 5,
  });

  if (candidates.length === 0) {
    return null;
  }

  // Find candidate whose keyHash matches using constant-time comparison
  let matchedKey: (ApiKey & { organization: Organization }) | null = null;
  const targetHashBuf = Buffer.from(targetHash);

  for (const candidate of candidates) {
    const candidateHashBuf = Buffer.from(candidate.keyHash);
    if (
      candidateHashBuf.length === targetHashBuf.length &&
      crypto.timingSafeEqual(candidateHashBuf, targetHashBuf)
    ) {
      matchedKey = candidate;
      break;
    }
  }

  if (!matchedKey) {
    return null;
  }

  // Check expiration
  if (matchedKey.expiresAt && matchedKey.expiresAt <= new Date()) {
    return null;
  }

  // Check active organization tenant status
  if (matchedKey.organization.deletedAt !== null) {
    return null;
  }

  // Throttled lastUsedAt update: execute asynchronously without blocking
  const now = Date.now();
  const shouldUpdateLastUsed =
    !matchedKey.lastUsedAt || now - matchedKey.lastUsedAt.getTime() > 60 * 1000;

  if (shouldUpdateLastUsed) {
    const keyId = matchedKey.id;
    if (typeof setImmediate === 'function') {
      setImmediate(() => {
        prisma.apiKey
          .update({
            where: { id: keyId },
            data: { lastUsedAt: new Date() },
          })
          .catch(() => {});
      });
    } else {
      setTimeout(() => {
        prisma.apiKey
          .update({
            where: { id: keyId },
            data: { lastUsedAt: new Date() },
          })
          .catch(() => {});
      }, 0);
    }
  }

  return {
    apiKey: matchedKey,
    organization: matchedKey.organization,
  };
}
