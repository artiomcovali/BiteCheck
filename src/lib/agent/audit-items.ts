import { detectDiscrepancies } from "@/lib/discrepancy/detect-discrepancies";
import type { DiscrepancyReport, MenuItem, UserProfile } from "@/lib/types";

/**
 * Pipeline Step 3 — Audit candidate items against the user profile.
 *
 * Runs the deterministic discrepancy detector on each candidate item,
 * producing a safety report per item. Pure and synchronous — no LLM or
 * database calls — so the audit step is reproducible and auditable.
 */
export function auditItems(
  items: MenuItem[],
  profile: UserProfile,
): Array<{ item: MenuItem; report: DiscrepancyReport }> {
  return items.map((item) => ({
    item,
    report: detectDiscrepancies(item, profile),
  }));
}
