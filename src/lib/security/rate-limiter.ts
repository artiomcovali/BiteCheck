/**
 * In-memory rate limiter for the SSE chat route.
 *
 * Two windows run in parallel: a per-IP cap to slow brute-force pressure
 * across the network edge, and a per-session cap to stop a single browser
 * tab from chaining stream requests faster than a human can read them.
 *
 * Counters live on `globalThis` so Next.js dev hot-reloads don't reset them
 * mid-conversation. This is a single-process limiter only — for multi-instance
 * deployments swap the maps for Redis (`@upstash/ratelimit` is the usual fit).
 */

type WindowState = { count: number; resetAt: number };

const PER_IP_LIMIT = 30; // requests per minute
const PER_SESSION_LIMIT = 15; // streams per minute per browser tab
const WINDOW_MS = 60_000;

type GlobalShape = typeof globalThis & {
  __bcRateIp?: Map<string, WindowState>;
  __bcRateSession?: Map<string, WindowState>;
};
const g = globalThis as GlobalShape;
const ipMap: Map<string, WindowState> = (g.__bcRateIp ??= new Map());
const sessionMap: Map<string, WindowState> = (g.__bcRateSession ??= new Map());

function tick(
  map: Map<string, WindowState>,
  key: string,
  limit: number,
): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  let state = map.get(key);
  if (!state || state.resetAt <= now) {
    state = { count: 0, resetAt: now + WINDOW_MS };
    map.set(key, state);
  }
  state.count += 1;
  if (state.count > limit) {
    return { allowed: false, retryAfterMs: state.resetAt - now };
  }
  return { allowed: true, retryAfterMs: 0 };
}

function gcExpired(map: Map<string, WindowState>, now: number) {
  for (const [k, v] of map) if (v.resetAt <= now) map.delete(k);
}

export type RateLimitResult = {
  allowed: boolean;
  reason: "ip_limit" | "session_limit" | null;
  retryAfterSeconds: number;
};

export const rateLimiter = {
  check(ip: string, sessionId: string): RateLimitResult {
    // Cheap probabilistic GC so the maps don't grow without bound.
    if (Math.random() < 0.02) {
      const now = Date.now();
      gcExpired(ipMap, now);
      gcExpired(sessionMap, now);
    }
    const ipResult = tick(ipMap, ip, PER_IP_LIMIT);
    if (!ipResult.allowed) {
      return {
        allowed: false,
        reason: "ip_limit",
        retryAfterSeconds: Math.ceil(ipResult.retryAfterMs / 1000),
      };
    }
    const sessionResult = tick(sessionMap, sessionId, PER_SESSION_LIMIT);
    if (!sessionResult.allowed) {
      return {
        allowed: false,
        reason: "session_limit",
        retryAfterSeconds: Math.ceil(sessionResult.retryAfterMs / 1000),
      };
    }
    return { allowed: true, reason: null, retryAfterSeconds: 0 };
  },
};

/**
 * Best-effort client IP extraction. Honors `x-forwarded-for` (left-most entry,
 * which is the original client when behind a single trusted proxy like Vercel
 * or Cloudflare) and falls back to `x-real-ip`. Returns `"unknown"` if neither
 * header is present so the limiter still slots it into a deterministic bucket.
 */
export function extractIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}
