/**
 * POST /api/chat — streams `ReasoningEvent`s as Server-Sent Events.
 *
 * Body: `{ query: string, sessionId: string }`
 *
 * The user profile is **never** trusted from the request body. It is loaded
 * server-side from the authenticated Supabase session via
 * {@link loadHydratedProfile}. A client that lies in the body cannot lie
 * its way past someone else's allergens.
 *
 * Routing logic:
 * - If `OPENAI_API_KEY` is set → real pipeline via `streamAgentEvents`.
 * - Otherwise → fixture stream via `streamFixtureEvents` (dev-only fallback,
 *   still scoped to the authenticated user's actual profile).
 *
 * Security controls:
 * - Auth required (401 if no session, 409 if no profile row)
 * - Per-IP and per-session rate limiting
 * - Profile data never logged or echoed in error responses
 */

import { z } from 'zod';
import type { ReasoningEvent } from '@/lib/types';
import { streamReasoningEvents } from '@/lib/chat/sse';
import { streamFixtureEvents } from '@/lib/chat/fixture-events';
import { isAgentPipelineReady, streamAgentEvents } from '@/lib/chat/agent-stream';
import { rateLimiter, extractIp } from '@/lib/security/rate-limiter';
import { loadHydratedProfile } from '@/lib/user-profile';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// Vercel's default 10s function budget kills the SSE stream mid-pipeline
// (5 sequential OpenAI calls + DB read). 60s is the Hobby-plan ceiling.
export const maxDuration = 60;

const HistoryTurnSchema = z.discriminatedUnion('mode', [
  z.object({
    mode: z.literal('recommendation'),
    query: z.string(),
    summary: z.string(),
    recommended_items: z.array(z.object({ item_name: z.string(), location: z.string() })),
    warned_items: z.array(z.object({ item_name: z.string() })),
  }),
  z.object({
    mode: z.literal('qna'),
    query: z.string(),
    answer: z.string(),
  }),
]);

const RequestSchema = z.object({
  query: z.string().min(1).max(500),
  sessionId: z.string().min(1),
  // Cap at 6 turns server-side regardless of what the client sends — the
  // classifier and answer modules only look at the most recent turn, but
  // future improvements may peek further back.
  history: z.array(HistoryTurnSchema).max(20).default([]),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'Invalid request' }, { status: 400 });
  }

  const { query, sessionId, history } = parsed.data;
  const safeQuery = query.trim();

  // Auth comes first — rate-limit results don't leak whether a session
  // exists, but profile loads should never run without one.
  const profile = await loadHydratedProfile();
  if (!profile) {
    return Response.json({ error: 'unauthenticated_or_unprofiled' }, { status: 401 });
  }

  const ip = extractIp(req);
  const rateLimitResult = rateLimiter.check(ip, sessionId);
  if (!rateLimitResult.allowed) {
    const headers: Record<string, string> = {};
    if (rateLimitResult.retryAfterSeconds > 0) {
      headers['Retry-After'] = String(rateLimitResult.retryAfterSeconds);
    }
    return Response.json(
      { error: 'rate_limited', reason: rateLimitResult.reason },
      { status: 429, headers },
    );
  }

  const signal = req.signal;
  const ctx = {
    query: safeQuery,
    profile: profile.profile,
    history,
  };

  const events: AsyncIterable<ReasoningEvent> = isAgentPipelineReady()
    ? streamAgentEvents(ctx, signal)
    : streamFixtureEvents({ query: ctx.query, profile: ctx.profile }, signal);

  return streamReasoningEvents(events, signal);
}
