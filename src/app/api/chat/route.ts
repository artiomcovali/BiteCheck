/**
 * POST /api/chat — streams `ReasoningEvent`s as Server-Sent Events.
 *
 * Body: `{ query: string, profile: UserProfile, sessionId: string }`
 *
 * Routing logic:
 * - If the agent pipeline is configured (OpenAI key + Supabase env), drive
 *   the real pipeline via streamAgentEvents.
 * - Otherwise, stream realistic fixtures from streamFixtureEvents
 *   so the demo runs end-to-end without backend wiring.
 *
 * Security controls:
 * - Rate limiting per IP and session
 * - Profile data never logged or echoed in error responses
 */

import { z } from "zod";
import type { ReasoningEvent } from "@/lib/types";
import { streamReasoningEvents } from "@/lib/chat/sse";
import { streamFixtureEvents } from "@/lib/chat/fixture-events";
import {
  isAgentPipelineReady,
  streamAgentEvents,
} from "@/lib/chat/agent-stream";
import { rateLimiter, extractIp } from "@/lib/security/rate-limiter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ProfileSchema = z.object({
  restrictions: z.array(z.string()),
  religious_dietary: z.array(z.string()),
  allergens: z.array(z.string()),
  severity: z.enum(["medical", "strict", "preference"]),
});

const RequestSchema = z.object({
  query: z.string().min(1).max(500),
  profile: ProfileSchema,
  sessionId: z.string().min(1),
});

export async function POST(req: Request) {
  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid request" },
      { status: 400 },
    );
  }

  const { query, profile, sessionId } = parsed.data;

  const ip = extractIp(req);
  const rateLimitResult = rateLimiter.check(ip, sessionId);

  if (!rateLimitResult.allowed) {
    const headers: Record<string, string> = {};
    if (rateLimitResult.retryAfterSeconds > 0) {
      headers["Retry-After"] = String(rateLimitResult.retryAfterSeconds);
    }

    return Response.json(
      { error: "rate_limited", reason: rateLimitResult.reason },
      { status: 429, headers },
    );
  }

  const signal = req.signal;

  const events: AsyncIterable<ReasoningEvent> = isAgentPipelineReady()
    ? streamAgentEvents({ query, profile }, signal)
    : streamFixtureEvents({ query, profile }, signal);

  return streamReasoningEvents(events, signal);
}