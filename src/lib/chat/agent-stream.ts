/**
 * Server-side adapter that drives the agent pipeline (parse → retrieve →
 * audit → rank) and yields one `ReasoningEvent` per step.
 *
 * The pipeline modules at `src/lib/agent/*` are currently scaffolded with
 * `throw new Error("Not implemented")` placeholders (per spec 01). Until
 * they land, the route falls back to the fixture stream — see
 * {@link isAgentPipelineReady} for the activation gate.
 *
 * When the real pipeline is ready, this file is the *only* surface that
 * needs to change — the SSE encoder, the client hook, and the UI consume
 * the same `ReasoningEvent` discriminated union.
 *
 * @see .kiro/specs/01-agent-decision-loop.md
 */
import type { ReasoningEvent, UserProfile } from "@/lib/types";
import { parseQuery } from "@/lib/agent/parse-query";
import { retrieveCandidates } from "@/lib/agent/retrieve-candidates";
import { auditItems } from "@/lib/agent/audit-items";
import { rankAndRecommend } from "@/lib/agent/rank-and-recommend";

export type AgentStreamContext = {
  query: string;
  profile: UserProfile;
};

/**
 * The pipeline is "ready" when every dependency is configured: the OpenAI
 * key for parse/rank, and Supabase for retrieve. Until both are present we
 * stream fixtures instead of partially-broken real output.
 *
 * Note: this only checks for the *presence* of env vars; it does not
 * validate them. A misconfigured key will surface as an `error` event from
 * the pipeline itself.
 */
export function isAgentPipelineReady(): boolean {
  return Boolean(
    process.env.OPENAI_API_KEY &&
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

/**
 * Drive the agent pipeline and yield one `ReasoningEvent` per step.
 *
 * Per-step errors are caught and converted into a single `error` event,
 * after which the generator returns. This keeps the streaming contract
 * consistent — the client always sees a terminal event.
 */
export async function* streamAgentEvents(
  ctx: AgentStreamContext,
  signal?: AbortSignal,
): AsyncGenerator<ReasoningEvent> {
  try {
    // Step 1 — parse
    const intent = await parseQuery(ctx.query);
    if (signal?.aborted) return;
    yield {
      type: "parse",
      message: `Parsed intent: ${intent.query_type}`,
      result: intent,
    };

    // Step 2 — retrieve
    const candidates = await retrieveCandidates(intent);
    if (signal?.aborted) return;
    yield {
      type: "retrieve",
      message: `Found ${candidates.length} candidate item${
        candidates.length === 1 ? "" : "s"
      }.`,
      count: candidates.length,
    };

    // Step 3 — audit
    const audited = auditItems(candidates, ctx.profile);
    if (signal?.aborted) return;
    const flagged = audited
      .filter(
        (a) => a.report.status === "flagged" || a.report.status === "unsafe",
      )
      .slice(0, 3)
      .map((a) => ({
        item_name: a.item.item_name,
        issue: a.report.conflicts[0]?.description ?? "data conflict",
      }));
    yield {
      type: "audit",
      message: `${flagged.length} of ${audited.length} item${
        audited.length === 1 ? "" : "s"
      } flagged for review.`,
      flagged_examples: flagged,
    };

    // Step 4 — rank
    if (signal?.aborted) return;
    yield {
      type: "rank",
      message: "Ranking remaining items by fit and freshness.",
    };
    const response = await rankAndRecommend(audited, ctx.profile, intent);
    if (signal?.aborted) return;

    // Step 5 — complete
    yield {
      type: "complete",
      recommendations: response.recommendations,
      warnings: response.warnings,
      reasoning_summary: response.reasoning_summary,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Pipeline failure";
    yield { type: "error", step: "pipeline", message };
  }
}
