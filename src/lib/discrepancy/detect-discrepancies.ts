/**
 * Deterministic discrepancy detector for BiteCheck.
 *
 * Evaluates a single menu item against a user's dietary profile and
 * returns a {@link DiscrepancyReport} indicating whether the item is
 * safe, flagged, unsafe, or has insufficient data.
 *
 * This is a **pure, synchronous function** — no LLM call, no database
 * access. Results are reproducible for the same inputs. The
 * {@link auditItems} pipeline step calls this function for each
 * candidate menu item.
 *
 * @see spec 02 — Discrepancy Detection
 * @module
 */

import type { MenuItem, UserProfile, DiscrepancyReport } from "@/lib/types";

/**
 * Detect data discrepancies and dietary conflicts for a menu item
 * against the given user profile.
 *
 * @param item - A single row from the Cal Poly dining dataset.
 * @param profile - The student's dietary configuration.
 * @returns A report with a safety status and any detected conflicts.
 */
export function detectDiscrepancies(
  item: MenuItem,
  profile: UserProfile
): DiscrepancyReport {
  // TODO: implement per spec 02
  throw new Error("Not implemented");
}
