import type { MenuItem, UserProfile, DiscrepancyReport } from "@/lib/types";

/**
 * Pipeline Step 3 — Audit candidate items against the user profile.
 *
 * Runs the deterministic discrepancy detector on each candidate item,
 * producing a safety report per item. This is a synchronous, pure function
 * with no LLM or database calls — results are reproducible and auditable.
 */
export function auditItems(
  items: MenuItem[],
  profile: UserProfile
): Array<{ item: MenuItem; report: DiscrepancyReport }> {
  // TODO: implement per spec 01
  throw new Error("Not implemented");
}
