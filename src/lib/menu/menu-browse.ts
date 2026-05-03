import { detectDiscrepancies } from "@/lib/discrepancy/detect-discrepancies";
import { parseDietaryLabels } from "@/lib/menu/dietary-labels";
import type { MenuItem, UserProfile } from "@/lib/types";

export type MenuBrowseEntry = {
  item: MenuItem;
  safety: "safe" | "double-check" | "avoid";
  reason: string;
  tags: string[];
  hasAllergens: boolean;
  hasMissingData: boolean;
  isVegan: boolean;
  isVegetarian: boolean;
};

export function buildMenuBrowseEntries(
  items: MenuItem[],
  profile: UserProfile,
): MenuBrowseEntry[] {
  return items.map((item) => {
    const report = detectDiscrepancies(item, profile);
    const parsed = parseDietaryLabels(item.dietary_labels);

    return {
      item,
      safety:
        report.status === "safe"
          ? "safe"
          : report.status === "unsafe"
            ? "avoid"
            : "double-check",
      reason:
        report.conflicts[0]?.description ??
        "No major conflicts found in the dining data for your current profile.",
      tags: parsed.restrictions,
      hasAllergens: parsed.allergens.length > 0,
      hasMissingData: report.status === "insufficient_data",
      isVegan: parsed.restrictions.includes("vegan"),
      isVegetarian:
        parsed.restrictions.includes("vegan") ||
        parsed.restrictions.includes("vegetarian"),
    };
  });
}

