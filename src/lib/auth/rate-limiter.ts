/**
 * In-Memory Sliding-Window Rate Limiter
 * Phase 2A requirement: Protects login and registration against brute-force attacks
 * without introducing a mandatory Redis dependency on Hostinger Cloud.
 *
 * Operational Note on Hostinger PM2 Cluster Mode:
 * In PM2 cluster mode with N worker processes, each worker maintains its local in-memory
 * sliding window. This provides effective brute-force protection while keeping Phase 2A zero-dependency.
 * In Phase 2B/2D, this store can be swapped with a shared Redis adapter if strict cross-worker aggregation is required.
 */

interface RateLimitRecord {
  timestamps: number[];
  lockoutUntil?: number;
}

class SlidingWindowRateLimiter {
  private store: Map<string, RateLimitRecord> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Periodically prune stale entries every 5 minutes to prevent memory leak
    if (typeof setInterval !== 'undefined') {
      this.cleanupInterval = setInterval(() => this.pruneStale(), 5 * 60 * 1000);
      if (this.cleanupInterval.unref) {
        this.cleanupInterval.unref();
      }
    }
  }

  /**
   * Checks if an action key is rate-limited under a sliding window.
   *
   * @param key Unique identifier (e.g. `login:${email}:${ip}`)
   * @param maxAttempts Maximum permitted attempts within windowMs (Default: 5)
   * @param windowMs Time window in milliseconds (Default: 15 minutes = 900,000ms)
   * @param lockoutMs Lockout period if threshold exceeded (Default: 15 minutes)
   */
  public check(
    key: string,
    maxAttempts = 5,
    windowMs = 15 * 60 * 1000,
    lockoutMs = 15 * 60 * 1000
  ): {
    allowed: boolean;
    remaining: number;
    retryAfterSeconds: number;
  } {
    const now = Date.now();
    const windowStart = now - windowMs;

    let record = this.store.get(key);
    if (!record) {
      record = { timestamps: [] };
      this.store.set(key, record);
    }

    // Check if actively locked out
    if (record.lockoutUntil && record.lockoutUntil > now) {
      const retryAfterSeconds = Math.ceil((record.lockoutUntil - now) / 1000);
      return { allowed: false, remaining: 0, retryAfterSeconds };
    }

    // Remove timestamps older than current window
    record.timestamps = record.timestamps.filter((ts) => ts > windowStart);

    if (record.timestamps.length >= maxAttempts) {
      // Trigger lockout
      record.lockoutUntil = now + lockoutMs;
      const retryAfterSeconds = Math.ceil(lockoutMs / 1000);
      return { allowed: false, remaining: 0, retryAfterSeconds };
    }

    const remaining = maxAttempts - record.timestamps.length;
    return { allowed: true, remaining, retryAfterSeconds: 0 };
  }

  /**
   * Records a failed attempt for an action key.
   */
  public recordAttempt(key: string): void {
    const now = Date.now();
    let record = this.store.get(key);
    if (!record) {
      record = { timestamps: [] };
      this.store.set(key, record);
    }
    record.timestamps.push(now);
  }

  /**
   * Resets attempts on successful authentication.
   */
  public reset(key: string): void {
    this.store.delete(key);
  }

  private pruneStale(): void {
    const now = Date.now();
    const staleThreshold = now - 60 * 60 * 1000; // 1 hour ago
    for (const [key, record] of this.store.entries()) {
      if (
        (!record.lockoutUntil || record.lockoutUntil < now) &&
        (record.timestamps.length === 0 || Math.max(...record.timestamps) < staleThreshold)
      ) {
        this.store.delete(key);
      }
    }
  }
}

export { SlidingWindowRateLimiter };
export const authRateLimiter = new SlidingWindowRateLimiter();
