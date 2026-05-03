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
  date: string;
  day_of_week: string;
  item_name: string;
  item_id: string;
  building: string;
  location: string;
  meal_period: string;
  station: string;
  portion: string;
  description: string;
  ingredients: string;
  dietary_labels: string;
  allergens: string;
  calories: number | null;
  calories_from_fat: number | null;
  protein_g: number | null;
  total_fat_g: number | null;
  total_carbs_g: number | null;
  fiber_g: number | null;
  sodium_mg: number | null;
  sugar_g: number | null;
  added_sugar_g: number | null;
  sat_fat_g: number | null;
  trans_fat_g: number | null;
  cholesterol_mg: number | null;
  calcium_mg: number | null;
  iron_mg: number | null;
  potassium_mg: number | null;
  vitamin_c_mg: number | null;
  vitamin_d_mcg: number | null;
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
    /**
     * UI bucket. `avoid` = clearly incompatible with the user's profile
     * (audit status was `unsafe`); `caution` = double-check (audit status
     * was `flagged` or `insufficient_data`). Computed server-side from
     * the deterministic audit; never trust the LLM to label severity.
     */
    severity: "caution" | "avoid";
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
  /**
   * Terminal event for the Q&A path. Emitted when the user is asking a
   * follow-up about a previously-recommended item rather than requesting
   * a new ranking. Carries the LLM's grounded answer plus optional
   * citations to specific items the answer leaned on.
   */
  | {
      type: "qna";
      answer: string;
      cited_item_names: string[];
    }
  | { type: "error"; message: string; step: string };

/**
 * Compact representation of a prior chat turn, sent from the client back
 * to `/api/chat` so the classifier and Q&A LLM have the context the
 * student is referring to. We never echo full menu_items rows in this
 * payload — those get re-fetched server-side from the names listed here.
 */
export type ConversationTurn =
  | {
      mode: "recommendation";
      query: string;
      summary: string;
      recommended_items: Array<{ item_name: string; location: string }>;
      warned_items: Array<{ item_name: string }>;
    }
  | {
      mode: "qna";
      query: string;
      answer: string;
    };
