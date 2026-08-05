/**
 * Rate limit em memória (Edge-safe para middleware).
 * Em múltiplas instâncias, preferir Redis no futuro.
 */
type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export function rateLimit(opts: {
  key: string;
  limit: number;
  windowMs: number;
}): { ok: boolean; remaining: number; retryAfterMs: number } {
  const now = Date.now();
  const cur = buckets.get(opts.key);
  if (!cur || now >= cur.resetAt) {
    buckets.set(opts.key, { count: 1, resetAt: now + opts.windowMs });
    return { ok: true, remaining: opts.limit - 1, retryAfterMs: 0 };
  }
  if (cur.count >= opts.limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfterMs: Math.max(0, cur.resetAt - now),
    };
  }
  cur.count += 1;
  return {
    ok: true,
    remaining: opts.limit - cur.count,
    retryAfterMs: 0,
  };
}

/** Limpeza ocasional para não crescer sem bound */
export function pruneRateLimitBuckets() {
  const now = Date.now();
  for (const [k, v] of buckets) {
    if (now >= v.resetAt) buckets.delete(k);
  }
}
