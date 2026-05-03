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
import type {
  ConversationTurn,
  ParsedIntent,
  ReasoningEvent,
  UserProfile,
} from "@/lib/types";
import { parseQuery } from "@/lib/agent/parse-query";
import { retrieveCandidates } from "@/lib/agent/retrieve-candidates";
import { auditItems } from "@/lib/agent/audit-items";
import { rankAndRecommend } from "@/lib/agent/rank-and-recommend";
import { classifyQuery } from "@/lib/agent/classify-query";
import { answerQuestion } from "@/lib/agent/answer-question";

export type AgentStreamContext = {
  query: string;
  profile: UserProfile;
  history: ConversationTurn[];
};

/**
 * The pipeline is "ready" when OpenAI is configured. Supabase is mandatory
 * for auth and is checked at the route layer (the user can't reach this
 * adapter without an authenticated session), so the only remaining
 * dev-mode fallback condition is the LLM key.
 *
 * Note: this only checks for the *presence* of OPENAI_API_KEY. A
 * misconfigured key surfaces as an `error` ReasoningEvent from the
 * pipeline itself.
 */
export function isAgentPipelineReady(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
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
    // Step 0 — classify. Cheap structured-output call. If the user is
    // asking a follow-up about a prior turn, branch into the Q&A path
    // and skip the recommendation pipeline entirely.
    const mode = await classifyQuery(ctx.query, ctx.history);
    if (signal?.aborted) return;

    if (mode === "qna") {
      const result = await answerQuestion(ctx.query, ctx.profile, ctx.history);
      if (signal?.aborted) return;
      yield {
        type: "qna",
        answer: result.answer,
        cited_item_names: result.cited_item_names,
      };
      return;
    }

    // Step 1 — parse
    const intent = await parseQuery(ctx.query);
    if (signal?.aborted) return;
    yield {
      type: "parse",
      message: parseMessage(ctx.profile, intent),
      result: intent,
    };

    // Step 2 — retrieve
    const candidates = await retrieveCandidates(intent);
    if (signal?.aborted) return;
    yield {
      type: "retrieve",
      message: retrieveMessage(intent, candidates.length),
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

function parseMessage(profile: UserProfile, intent: ParsedIntent): string {
  const where = intent.location_filter ?? "Cal Poly dining";
  const mealPart = intent.meal_period_filter
    ? `${intent.meal_period_filter.toLowerCase()} options`
    : "options";
  return `Looking for ${mealPart} at ${where} — filtering through your profile (${profile.severity}).`;
}

function retrieveMessage(intent: ParsedIntent, count: number): string {
  const where = intent.location_filter ?? "Cal Poly dining";
  const mealPart = intent.meal_period_filter
    ? `${intent.meal_period_filter.toLowerCase()}'s menu`
    : "today's menu";
  return `Found ${count} item${count === 1 ? "" : "s"} on ${mealPart} at ${where}.`;
}
