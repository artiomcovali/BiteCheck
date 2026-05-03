import { detectDiscrepancies } from "@/lib/discrepancy/detect-discrepancies";
import type { HydratedUserProfile } from "@/lib/user-profile";
import type { MenuItem } from "@/lib/types";

type LocationSummary = {
  name: string;
  safeCount: number;
  flaggedCount: number;
  avoidCount: number;
};

export type DashboardOverview = {
  safeItems: number;
  flaggedItems: number;
  avoidItems: number;
  bestMatch: string;
  locations: LocationSummary[];
  alerts: string[];
};

export function buildDashboardOverview(
  items: MenuItem[],
  profile: HydratedUserProfile["profile"],
): DashboardOverview {
  let safeItems = 0;
  let flaggedItems = 0;
  let avoidItems = 0;
  let missingDataItems = 0;
  let crossContactItems = 0;

  const byLocation = new Map<string, LocationSummary>();

  for (const item of items) {
    const report = detectDiscrepancies(item, profile);
    const locationKey = item.location || item.building || "Unknown";
    const location = byLocation.get(locationKey) ?? {
      name: locationKey,
      safeCount: 0,
      flaggedCount: 0,
      avoidCount: 0,
    };

    if (report.status === "safe") {
      safeItems += 1;
      location.safeCount += 1;
    } else if (report.status === "flagged" || report.status === "insufficient_data") {
      flaggedItems += 1;
      location.flaggedCount += 1;
    } else {
      avoidItems += 1;
      location.avoidCount += 1;
    }

    if (report.status === "insufficient_data") {
      missingDataItems += 1;
    }

    if (report.conflicts.some((conflict) => conflict.type === "cross_contamination")) {
      crossContactItems += 1;
    }

    byLocation.set(locationKey, location);
  }

  const locations = [...byLocation.values()].sort((a, b) => {
    if (b.safeCount !== a.safeCount) return b.safeCount - a.safeCount;
    if (a.avoidCount !== b.avoidCount) return a.avoidCount - b.avoidCount;
    return a.name.localeCompare(b.name);
  });

  const alerts = [
    crossContactItems > 0
      ? `${crossContactItems} item${crossContactItems === 1 ? "" : "s"} carry cross-contact notes that need extra caution.`
      : null,
    missingDataItems > 0
      ? `${missingDataItems} item${missingDataItems === 1 ? "" : "s"} are missing enough ingredient data that BiteCheck won't treat them as reliable.`
      : null,
    locations.some((location) => location.safeCount === 0)
      ? `${locations.filter((location) => location.safeCount === 0).length} dining area${locations.filter((location) => location.safeCount === 0).length === 1 ? "" : "s"} currently have no clearly safe matches for your profile.`
      : null,
  ].filter((value): value is string => Boolean(value));

  return {
    safeItems,
    flaggedItems,
    avoidItems,
    bestMatch: locations[0]?.name ?? "No dining match yet",
    locations: locations.slice(0, 3),
    alerts,
  };
}

