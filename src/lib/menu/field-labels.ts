/**
 * Plain-English labels for the CSV columns the agent cites in
 * `source_fields`, plus for the warning `issue` enum.
 *
 * The user never sees raw column names like `dietary_labels` — those leak
 * the schema and read as jargon. The results UI uses these mappings to
 * render a "what we checked" panel in human terms (e.g. "Dietary labels",
 * "Ingredient list", "Cross-contact check").
 */

import type { AgentResponse } from "@/lib/types";

const FIELD_LABEL: Record<string, string> = {
  // Identity
  item_name: "Item name",
  location: "Dining location",
  meal_period: "Meal period",
  station: "Prep station",
  description: "Item description",

  // Dietary surface
  ingredients: "Ingredient list",
  dietary_labels: "Dietary labels",
  allergens: "Allergen list",

  // Macros
  calories: "Calories",
  calories_from_fat: "Calories from fat",
  protein_g: "Protein",
  total_fat_g: "Total fat",
  total_carbs_g: "Carbohydrates",
  fiber_g: "Fiber",
  sodium_mg: "Sodium",
  sugar_g: "Sugar",
  added_sugar_g: "Added sugar",
  sat_fat_g: "Saturated fat",
  trans_fat_g: "Trans fat",
  cholesterol_mg: "Cholesterol",

  // Micros
  calcium_mg: "Calcium",
  iron_mg: "Iron",
  potassium_mg: "Potassium",
  vitamin_c_mg: "Vitamin C",
  vitamin_d_mcg: "Vitamin D",
};

/**
 * Translate a CSV column name into the human label the UI shows. Returns
 * the original snake_case if we don't know the field — better than dropping
 * it silently when the agent cites something we haven't mapped yet.
 */
export function fieldLabel(field: string): string {
  return FIELD_LABEL[field] ?? prettifySnakeCase(field);
}

/**
 * Plain-English heading for each warning issue category.
 */
export const ISSUE_LABEL: Record<
  AgentResponse["warnings"][number]["issue"],
  string
> = {
  label_conflict: "Dietary label vs ingredients",
  cross_contamination_risk: "Cross-contact risk",
  ambiguous_data: "Dietary classification",
  missing_data: "Available data",
};

function prettifySnakeCase(s: string): string {
  return s
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
