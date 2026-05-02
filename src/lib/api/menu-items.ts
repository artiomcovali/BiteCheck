import {
  expandUserProfileTokens,
  parseDietaryLabels,
  satisfiesDietaryRequirement,
} from "@/lib/menu/dietary-labels";
import type { MenuItem } from "@/lib/types";

type MenuFilters = {
  excludeAllergens: string[];
  requireDietary?: string[];
  macroLimits?: {
    maxCalories?: number;
    minProtein?: number;
    maxCarbs?: number;
    maxFat?: number;
  };
};

export async function getMenuItemsForToday(date?: string): Promise<MenuItem[]> {
  const client = await getMenuClient();
  const targetDate = date ?? getPacificDateString();
  const { data, error } = await client
    .from("menu_items")
    .select("*")
    .eq("date", targetDate)
    .order("building", { ascending: true })
    .order("location", { ascending: true })
    .order("meal_period", { ascending: true })
    .order("station", { ascending: true })
    .order("item_name", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch menu items: ${error.message}`);
  }

  return (data ?? []) as MenuItem[];
}

export async function getMenuItemsByLocation(
  location: string,
  date?: string,
): Promise<MenuItem[]> {
  const client = await getMenuClient();
  const targetDate = date ?? getPacificDateString();
  const { data, error } = await client
    .from("menu_items")
    .select("*")
    .eq("date", targetDate)
    .eq("location", location)
    .order("meal_period", { ascending: true })
    .order("station", { ascending: true })
    .order("item_name", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch menu items for ${location}: ${error.message}`);
  }

  return (data ?? []) as MenuItem[];
}

export function filterMenuItems(
  items: MenuItem[],
  filters: MenuFilters,
): MenuItem[] {
  const excludedTokens = new Set(expandUserProfileTokens(filters.excludeAllergens));
  const requiredDietary = filters.requireDietary ?? [];
  const { macroLimits } = filters;

  return items.filter((item) => {
    const parsedLabels = parseDietaryLabels(item.dietary_labels);
    const presentTokens = new Set(
      parsedLabels.allergens.map((entry) => entry.token),
    );

    if (
      [...excludedTokens].some((token) => presentTokens.has(token))
    ) {
      return false;
    }

    if (
      requiredDietary.some(
        (requirement) =>
          !satisfiesDietaryRequirement(parsedLabels, requirement),
      )
    ) {
      return false;
    }

    if (
      macroLimits?.maxCalories !== undefined &&
      (item.calories === null || item.calories > macroLimits.maxCalories)
    ) {
      return false;
    }

    if (
      macroLimits?.minProtein !== undefined &&
      (item.protein_g === null || item.protein_g < macroLimits.minProtein)
    ) {
      return false;
    }

    if (
      macroLimits?.maxCarbs !== undefined &&
      (item.total_carbs_g === null || item.total_carbs_g > macroLimits.maxCarbs)
    ) {
      return false;
    }

    if (
      macroLimits?.maxFat !== undefined &&
      (item.total_fat_g === null || item.total_fat_g > macroLimits.maxFat)
    ) {
      return false;
    }

    return true;
  });
}

async function getMenuClient() {
  const { supabaseAdmin } = await import("@/lib/db/client");
  return supabaseAdmin;
}

function getPacificDateString() {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(new Date());
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    throw new Error("Failed to format Pacific date for menu query");
  }

  return `${year}-${month}-${day}`;
}
