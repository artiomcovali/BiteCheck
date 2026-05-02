import type { ParsedIntent } from "@/lib/types";

/**
 * Pipeline Step 1 — Parse query intent.
 *
 * Extracts structural intent (location, meal period, query type) from the
 * raw query string using the LLM. The user profile is intentionally excluded
 * to prevent the LLM from filtering at parse time, ensuring all safety logic
 * runs through the deterministic discrepancy detector in step 3.
 */
export async function parseQuery(query: string): Promise<ParsedIntent> {
  // TODO: implement per spec 01
  throw new Error("Not implemented");
}
