/**
 * POST /api/chat — streams `ReasoningEvent`s as Server-Sent Events.
 *
 * Body: `{ query: string, profile: UserProfile }`
 *
 * Routing logic:
 * - If the agent pipeline is configured (OpenAI key + Supabase env), drive
 *   the real pipeline via {@link streamAgentEvents}.
 * - Otherwise, stream realistic fixtures from {@link streamFixtureEvents}
 *   so the demo runs end-to-end without backend wiring.
 *
 * The wire format is the same in both modes — swapping mock for real is a
 * one-line change here, with zero UI churn.
 */
import { z } from "zod";
import type { ReasoningEvent } from "@/lib/types";
import { streamReasoningEvents } from "@/lib/chat/sse";
import { streamFixtureEvents } from "@/lib/chat/fixture-events";
import {
  isAgentPipelineReady,
  streamAgentEvents,
} from "@/lib/chat/agent-stream";

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
      { error: "Invalid request", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { query, profile } = parsed.data;
  const signal = req.signal;

  const events: AsyncIterable<ReasoningEvent> = isAgentPipelineReady()
    ? streamAgentEvents({ query, profile }, signal)
    : streamFixtureEvents({ query, profile }, signal);

  return streamReasoningEvents(events, signal);
}
