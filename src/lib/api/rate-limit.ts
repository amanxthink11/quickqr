import { SlidingWindowRateLimiter } from '@/lib/auth/rate-limiter';

export const apiRateLimiter = new SlidingWindowRateLimiter();

export type ApiOperationType = 'read' | 'write' | 'auth';

export interface RateLimitCheckResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

/**
 * Enforces per-key or per-IP sliding-window rate limits for the developer REST API.
 * Automatically records successful attempts against the sliding window.
 *
 * Defaults:
 * - Read requests: 120 requests / 60 seconds
 * - Write requests: 30 requests / 60 seconds
 * - Auth attempts: 10 attempts / 60 seconds (lockout 60s)
 */
export function checkApiRateLimit(
  identifier: string,
  type: ApiOperationType = 'read'
): RateLimitCheckResult {
  const key = `api:${type}:${identifier}`;
  const maxAttempts = type === 'read' ? 120 : type === 'write' ? 30 : 10;
  const windowMs = 60 * 1000;
  const lockoutMs = 60 * 1000;

  const result = apiRateLimiter.check(key, maxAttempts, windowMs, lockoutMs);
  if (result.allowed && type !== 'auth') {
    // Record request timestamp against active quota
    apiRateLimiter.recordAttempt(key);
  }

  return result;
}

export function recordFailedApiAuth(identifier: string): void {
  apiRateLimiter.recordAttempt(`api:auth:${identifier}`);
}
