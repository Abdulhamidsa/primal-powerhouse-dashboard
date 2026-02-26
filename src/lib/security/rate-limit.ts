type RateLimitResult = {
  allowed: boolean;
  resetAt: number;
  remaining: number;
};

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || now >= existing.resetAt) {
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { allowed: true, resetAt, remaining: Math.max(0, limit - 1) };
  }

  if (existing.count >= limit) {
    return { allowed: false, resetAt: existing.resetAt, remaining: 0 };
  }

  existing.count += 1;
  buckets.set(key, existing);
  return { allowed: true, resetAt: existing.resetAt, remaining: Math.max(0, limit - existing.count) };
}
