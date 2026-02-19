import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Converts milliseconds to the string format @upstash/ratelimit expects,
 * e.g. 900_000 → "15 m", 3_600_000 → "1 h"
 */
function msToWindow(ms: number): `${number} ${"ms" | "s" | "m" | "h" | "d"}` {
  const seconds = ms / 1000;
  if (seconds % 3600 === 0) return `${seconds / 3600} h`;
  if (seconds % 60 === 0) return `${seconds / 60} m`;
  return `${seconds} s`;
}

// ---------------------------------------------------------------------------
// Upstash Redis client (lazy, only initialised when env vars are present)
// ---------------------------------------------------------------------------
let _upstashRedis: Redis | null = null;

function getUpstashRedis(): Redis | null {
  if (
    !process.env.UPSTASH_REDIS_REST_URL ||
    !process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    return null;
  }
  if (!_upstashRedis) {
    _upstashRedis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  return _upstashRedis;
}

// ---------------------------------------------------------------------------
// In-memory fallback (development / single-process deployments)
// ---------------------------------------------------------------------------
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key);
  }
}, 5 * 60 * 1000).unref();

function inMemoryRateLimit(
  key: string,
  maxAttempts: number,
  windowMs: number
): { success: boolean; remaining: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: maxAttempts - 1 };
  }

  entry.count++;
  if (entry.count > maxAttempts) {
    return { success: false, remaining: 0 };
  }
  return { success: true, remaining: maxAttempts - entry.count };
}

// ---------------------------------------------------------------------------
// Public API — async, works across multiple instances when Upstash is set
// ---------------------------------------------------------------------------
export async function rateLimit(
  key: string,
  { maxAttempts, windowMs }: { maxAttempts: number; windowMs: number }
): Promise<{ success: boolean; remaining: number }> {
  const redis = getUpstashRedis();

  if (redis) {
    const ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(maxAttempts, msToWindow(windowMs)),
      prefix: "proptech:rl",
    });
    const { success, remaining } = await ratelimit.limit(key);
    return { success, remaining: remaining ?? 0 };
  }

  // Fallback: in-memory (not suitable for multi-instance production)
  return inMemoryRateLimit(key, maxAttempts, windowMs);
}
