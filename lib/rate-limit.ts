// Tiny in-memory rate limiter for auth-adjacent and public endpoints.
// NOTE: per-instance only; for multi-instance production use Redis/Upstash.
const hits = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(
  key: string,
  limit = 20,
  windowMs = 60_000,
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || entry.resetAt <= now) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }
  if (entry.count >= limit) {
    return { allowed: false, remaining: 0 };
  }
  entry.count += 1;
  return { allowed: true, remaining: limit - entry.count };
}
