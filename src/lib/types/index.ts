/**
 * Shared type definitions for BiteCheck.
 *
 * All modules import from this barrel file to ensure consistent
 * data shapes across the agent pipeline, discrepancy detector, and UI.
 */

/**
 * A student's dietary configuration, loaded from Supabase on session start.
 * Drives how the agent treats cross-contamination warnings and ambiguous data.
 * @see requirements.md Requirement 3.1
 * @see spec 01 — Agent Decision Loop (Inputs)
 */
export type UserProfile = {
  restrictions: string[];
  religious_dietary: string[];
  allergens: string[];
  severity: "medical" | "strict" | "preference";
};

/**
 * A single row from the Cal Poly dining dataset.
 * Field names use snake_case matching the CSV columns.
 * @see requirements.md Requirement 3.2
 * @see spec 01 — Agent Decision Loop (Inputs)
 */
export type MenuItem = {
  item_name: string;
  location: string;
  meal_period: string;
  station: string;
  description: string;
  ingredients: string;
  dietary_labels: string;
  allergens: string;
  calories: number;
  protein_g: number;
  total_fat_g: number;
  total_carbs_g: number;
  fiber_g: number;
  sodium_mg: number;
  sugar_g: number;
  added_sugar_g: number;
  sat_fat_g: number;
  trans_fat_g: number;
  cholesterol_mg: number;
  calcium_mg: number;
  iron_mg: number;
  potassium_mg: number;
  vitamin_c_mg: number;
  vitamin_d_mcg: number;
};

/**
 * The five categories of data conflicts the discrepancy detector identifies.
 * @see requirements.md Requirement 3.4
 * @see spec 02 — Discrepancy Detection (Conflict categories)
 */
export type ConflictType =
  | "label_ingredient"
  | "missing_classification"
  | "cross_contamination"
  | "allergen_in_dietary_field"
  | "empty_data";

/**
 * Output of the deterministic discrepancy detector.
 * Every menu item receives a status before the LLM ranks them.
 * @see requirements.md Requirement 3.3
 * @see spec 02 — Discrepancy Detection (Output)
 */
export type DiscrepancyReport = {
  status: "safe" | "flagged" | "unsafe" | "insufficient_data";
  conflicts: Array<{
    type: ConflictType;
    description: string;
    fields_involved: string[];
  }>;
};

/**
 * Structured output from the LLM parse step (pipeline step 1).
 * Extracts intent from the query string only — no user profile.
 * @see requirements.md Requirement 3.7
 * @see spec 01 — Agent Decision Loop (Step 1: Parse query intent)
 */
export type ParsedIntent = {
  location_filter: string | null;
  meal_period_filter: "Breakfast" | "Lunch" | "Dinner" | null;
  nutritional_goal: {
    nutrient: string;
    target: number;
    op: "min" | "max";
  } | null;
  query_type:
    | "what_can_i_eat"
    | "is_this_safe"
    | "nutritional_optimization"
    | "general";
};

/**
 * The final structured output from the rankAndRecommend pipeline step.
 * Contains source-cited recommendations, warnings for flagged items,
 * and a plain-language reasoning summary.
 * @see requirements.md Requirement 3.6
 * @see spec 01 — Agent Decision Loop (Output schema)
 */
export type AgentResponse = {
  recommendations: Array<{
    item_name: string;
    location: string;
    confidence: "high" | "medium" | "low";
    reasoning: string;
    nutrition_summary?: string;
    source_fields: string[];
  }>;
  warnings: Array<{
    item_name: string;
    issue:
      | "label_conflict"
      | "ambiguous_data"
      | "cross_contamination_risk"
      | "missing_data";
    explanation: string;
  }>;
  reasoning_summary: string;
};

/**
 * Discriminated union for streaming pipeline events to the UI.
 * Each step of the agent's decision process emits one event so the
 * user sees what the agent is doing and why.
 * @see requirements.md Requirement 3.5
 * @see spec 01 — Agent Decision Loop (Decision pipeline, Steps 1–5)
 */
export type ReasoningEvent =
  | { type: "parse"; message: string; result: ParsedIntent }
  | { type: "retrieve"; message: string; count: number }
  | {
      type: "audit";
      message: string;
      flagged_examples: Array<{ item_name: string; issue: string }>;
    }
  | { type: "rank"; message: string }
  | {
      type: "complete";
      recommendations: AgentResponse["recommendations"];
      warnings: AgentResponse["warnings"];
      reasoning_summary: string;
    }
  | { type: "error"; message: string; step: string };
