import { hash, verify } from '@node-rs/argon2';

/**
 * Argon2id configuration documented in PHASE_2A_ARCHITECTURE_REVIEW.md:
 * - memory: 64 MB (65536 KB)
 * - iterations: 3
 * - parallelism: 1
 */
const ARGON2_OPTIONS = {
  memoryCost: 65536,
  timeCost: 3,
  parallelism: 1,
};

/**
 * Hashes a plaintext password using Argon2id.
 * Plaintext passwords and hashes are NEVER logged.
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password || typeof password !== 'string') {
    throw new Error('Password must be a non-empty string');
  }
  if (password.includes('\0')) {
    throw new Error('Password must not contain null bytes');
  }
  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters long');
  }
  if (password.length > 128) {
    throw new Error('Password must not exceed 128 characters');
  }

  return hash(password, ARGON2_OPTIONS);
}

/**
 * Verifies a plaintext password against an Argon2id hash.
 * Returns false safely if hash or password is invalid or malformed.
 */
export async function verifyPassword(password: string, hashString: string): Promise<boolean> {
  if (!password || !hashString || typeof password !== 'string' || typeof hashString !== 'string') {
    return false;
  }

  try {
    return await verify(hashString, password);
  } catch {
    // Malformed hash or internal error returns false without leaking errors
    return false;
  }
}
