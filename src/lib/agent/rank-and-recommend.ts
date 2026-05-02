import type {
  MenuItem,
  UserProfile,
  DiscrepancyReport,
  ParsedIntent,
  AgentResponse,
} from "@/lib/types";

/**
 * Pipeline Step 4 — Rank audited items and produce recommendations.
 *
 * This is the final pipeline step. It consumes the audited items (with their
 * discrepancy reports), the user profile, and the parsed intent to produce
 * the complete AgentResponse with source-cited recommendations, warnings,
 * and a reasoning summary. The pipeline orchestrator wraps this output as
 * a ReasoningEvent { type: "complete" } for streaming to the UI.
 */
export async function rankAndRecommend(
  auditedItems: Array<{ item: MenuItem; report: DiscrepancyReport }>,
  profile: UserProfile,
  intent: ParsedIntent
): Promise<AgentResponse> {
  // TODO: implement per spec 01
  throw new Error("Not implemented");
}
