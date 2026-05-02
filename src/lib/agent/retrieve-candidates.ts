import type { ParsedIntent, MenuItem } from "@/lib/types";

/**
 * Pipeline Step 2 — Retrieve candidate menu items.
 *
 * Queries the database for menu items matching the parsed intent filters
 * (location, meal period, nutritional goals). Returns raw candidates
 * before any safety auditing.
 */
export async function retrieveCandidates(
  intent: ParsedIntent
): Promise<MenuItem[]> {
  // TODO: implement per spec 01
  throw new Error("Not implemented");
}
