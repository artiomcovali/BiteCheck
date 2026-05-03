/**
 * Derive a results-first UI model from a streaming ChatTurn.
 *
 * The chat pipeline streams `ReasoningEvent`s; this module collapses them
 * into a single `UIResult` for the new product-grade UI:
 *
 *   safe    — high/medium-confidence recommendations
 *   caution — low-confidence recommendations + warnings with severity=caution
 *   avoid   — warnings with severity=avoid (deterministic-detector unsafe)
 *
 * The raw event log stays attached so the optional "View details" panel
 * can render the original step-by-step reasoning trail without re-fetching.
 *
 * This is the seam between SSE and presentation — keep it pure so
 * extending the agent contract later is a one-file change.
 */

import type {
  AgentResponse,
  ParsedIntent,
  ReasoningEvent,
} from "@/lib/types";
import type { ChatTurn } from "@/lib/chat/use-chat-stream";

export type UIBucket = "safe" | "caution" | "avoid";

export type UIItem = {
  bucket: UIBucket;
  item_name: string;
  location: string | null;
  short_explanation: string;
  /** Confidence is set for items derived from `recommendations`. */
  confidence?: AgentResponse["recommendations"][number]["confidence"];
  /** Issue is set for items derived from `warnings`. */
  issue?: AgentResponse["warnings"][number]["issue"];
  /** Source CSV columns; recommendations only. */
  source_fields?: string[];
  /** Compact macro snippet from the recommender. */
  nutrition_summary?: string;
};

export type UIStreamingPhase =
  | "idle"
  | "starting"
  | "understanding"
  | "fetching"
  | "auditing"
  | "ranking"
  | "finalizing";

export type UIMode = "recommendation" | "qna";

export type UIQnA = {
  answer: string;
  cited_item_names: string[];
};

export type UIResult = {
  /** Which UI lane to render — recommendation grid or single answer card. */
  mode: UIMode;

  query: string;
  /** From `parse.result.location_filter`, used in the page header. */
  location_label: string | null;
  /** Plain-language summary line under the header. Empty until complete. */
  summary: string;

  // Recommendation-mode buckets (empty in qna mode):
  safe: UIItem[];
  caution: UIItem[];
  avoid: UIItem[];

  // Q&A-mode payload (null in recommendation mode):
  qna: UIQnA | null;

  /** Status of this turn — drives loading vs results-rendered. */
  status: ChatTurn["status"];
  error?: string;
  phase: UIStreamingPhase;
  phaseMessage: string;

  /** Raw events for the optional "View details" panel. */
  events: ReasoningEvent[];

  /** True when a terminal event has arrived. */
  hasResults: boolean;
  /** Empty in every bucket — used to show the "nothing matched" empty state. */
  isEmpty: boolean;
};

const PHASE_BY_LAST_EVENT: Record<ReasoningEvent["type"], UIStreamingPhase> = {
  parse: "fetching",
  retrieve: "auditing",
  audit: "ranking",
  rank: "finalizing",
  complete: "finalizing",
  qna: "finalizing",
  error: "idle",
};

const PHASE_MESSAGES: Record<UIStreamingPhase, string> = {
  idle: "",
  starting: "Working on it…",
  understanding: "Understanding your question…",
  fetching: "Pulling today's menu…",
  auditing: "Cross-checking against your profile…",
  ranking: "Picking the safest options…",
  finalizing: "Putting it together…",
};

export function deriveUIResult(turn: ChatTurn): UIResult {
  const events = turn.events;
  const parseEvent = events.find(
    (e): e is Extract<ReasoningEvent, { type: "parse" }> => e.type === "parse",
  );
  const completeEvent = events.find(
    (e): e is Extract<ReasoningEvent, { type: "complete" }> =>
      e.type === "complete",
  );
  const qnaEvent = events.find(
    (e): e is Extract<ReasoningEvent, { type: "qna" }> => e.type === "qna",
  );

  const phase = derivePhase(turn.status, events);
  const phaseMessage = PHASE_MESSAGES[phase];

  // Q&A path takes precedence — if the agent decided this was a follow-up,
  // we render the answer card and ignore any recommendation noise.
  if (qnaEvent) {
    return {
      mode: "qna",
      query: turn.query,
      location_label: parseEvent?.result.location_filter ?? null,
      summary: "",
      safe: [],
      caution: [],
      avoid: [],
      qna: {
        answer: qnaEvent.answer,
        cited_item_names: qnaEvent.cited_item_names,
      },
      status: turn.status,
      error: turn.error,
      phase,
      phaseMessage,
      events,
      hasResults: true,
      isEmpty: false,
    };
  }

  const safe: UIItem[] = [];
  const caution: UIItem[] = [];
  const avoid: UIItem[] = [];

  if (completeEvent) {
    for (const rec of completeEvent.recommendations) {
      const item: UIItem = {
        bucket: rec.confidence === "low" ? "caution" : "safe",
        item_name: rec.item_name,
        location: rec.location ?? null,
        short_explanation: rec.reasoning,
        confidence: rec.confidence,
        source_fields: rec.source_fields,
        nutrition_summary: rec.nutrition_summary,
      };
      (item.bucket === "safe" ? safe : caution).push(item);
    }
    for (const warning of completeEvent.warnings) {
      const item: UIItem = {
        bucket: warning.severity === "avoid" ? "avoid" : "caution",
        item_name: warning.item_name,
        location: null,
        short_explanation: warning.explanation,
        issue: warning.issue,
      };
      (item.bucket === "avoid" ? avoid : caution).push(item);
    }
  }

  return {
    mode: "recommendation",
    query: turn.query,
    location_label: parseEvent?.result.location_filter ?? null,
    summary: completeEvent?.reasoning_summary ?? "",
    safe,
    caution,
    avoid,
    qna: null,
    status: turn.status,
    error: turn.error,
    phase,
    phaseMessage,
    events,
    hasResults: Boolean(completeEvent),
    isEmpty:
      Boolean(completeEvent) &&
      safe.length === 0 &&
      caution.length === 0 &&
      avoid.length === 0,
  };
}

function derivePhase(
  status: ChatTurn["status"],
  events: ReasoningEvent[],
): UIStreamingPhase {
  if (status === "complete" || status === "error") return "idle";
  if (events.length === 0) return "starting";
  const last = events[events.length - 1]!;
  return PHASE_BY_LAST_EVENT[last.type];
}

/** Friendly human label for a parsed intent's location filter. */
export function locationHeader(intent: ParsedIntent | null): string {
  if (!intent?.location_filter) return "Cal Poly dining today";
  return `${intent.location_filter} today`;
}
