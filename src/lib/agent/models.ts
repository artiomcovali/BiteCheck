/**
 * Centralized LLM model registry.
 *
 * All LLM-calling code imports model strings from this file.
 * Changing the model for the entire project requires editing only this object.
 */
export const MODELS = {
  /** Primary model for agent reasoning (parse-query, rank-and-recommend). */
  AGENT_REASONING: "gpt-4o",
  /** Lighter model for cost-sensitive paths when explicitly requested. */
  COST_SENSITIVE: "gpt-4o-mini",
} as const;
