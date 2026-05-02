# Spec: Agent Decision Loop

## Purpose

BiteCheck's core agent takes a natural-language student query (e.g., "what can I eat at 19 Metro tonight?") and produces a structured, source-cited recommendation grounded in the student's dietary profile and the Cal Poly dining dataset.

The agent must reason visibly. Each step of its decision process streams to the UI as a discrete event so the user sees *what* the agent is doing and *why*, not just the final answer.

## Out of scope

- Calorie tracking, history, or daily aggregation
- Dining dollar budgeting
- Free-text menu browsing as a separate feature
- Hiding or filtering items in a non-chat UI
- Multi-turn conversation memory beyond the current session

## Inputs

1. **Student profile** (loaded from Supabase on session start):
   - `restrictions: string[]` — e.g., `["vegan", "gluten-free"]`
   - `religious_dietary: string[]` — e.g., `["hindu-vegetarian", "halal"]`
   - `allergens: string[]` — e.g., `["dairy", "tree nuts"]`
   - `severity: "preference" | "strict" | "medical"` — drives caution level

2. **Query** (natural language string)

3. **Menu data** (queried from Supabase `menu_items` table; one row per item per date per location)

## Decision pipeline

The agent runs a 5-step loop. Each step emits a `ReasoningEvent` to the streaming UI before proceeding to the next.

### Step 1: Parse query intent

Use an LLM call to extract:
- `location_filter: string | null` — dining hall mentioned, if any
- `meal_period_filter: "Breakfast" | "Lunch" | "Dinner" | null`
- `nutritional_goal: { nutrient: string, target: number, op: "min" | "max" } | null`
- `query_type: "what_can_i_eat" | "is_this_safe" | "nutritional_optimization" | "general"`

Emit: `ReasoningEvent { type: "parse", message: "Understanding your question...", result: <parsed> }`

### Step 2: Retrieve candidate items

Query Supabase with filters from Step 1 plus today's date. Limit to 50 candidates max.

Emit: `ReasoningEvent { type: "retrieve", message: "Found N items at <location> for <meal>", count: N }`

### Step 3: Audit each candidate against the profile

For each candidate, run the discrepancy detector (see spec 02). Tag each item:
- `safe` — passes all profile constraints with high confidence
- `flagged` — label conflicts with ingredients OR cross-contamination risk OR ambiguous data
- `unsafe` — clearly violates a profile restriction

Emit ONE event summarizing the audit: `ReasoningEvent { type: "audit", message: "Audited N items: X safe, Y flagged, Z unsafe", flagged_examples: [...] }`

### Step 4: Reason and rank

Apply the steering rules (see steering/safety-first-reasoning.md). Use an LLM call with the candidate set and profile to produce ranked recommendations with confidence scores. The LLM MUST cite the specific data fields that justify each decision (e.g., "labeled vegan, no dairy in ingredients, no asterisk-flagged allergens").

Emit: `ReasoningEvent { type: "rank", message: "Selecting safest options based on your <restriction list>" }`

### Step 5: Generate response

Stream the final structured response:
- 2-3 top recommendations with confidence badges
- Any `flagged` items shown as warnings with explanation of the conflict
- Plain-language reasoning summary
- Source citations to the menu data fields used

Emit: `ReasoningEvent { type: "complete", recommendations: [...], warnings: [...] }`

## Output schema (final response)

```typescript
type AgentResponse = {
  recommendations: Array<{
    item_name: string;
    location: string;
    confidence: "high" | "medium" | "low";
    reasoning: string;
    nutrition_summary?: string;
    source_fields: string[];  // which CSV columns justified the recommendation
  }>;
  warnings: Array<{
    item_name: string;
    issue: "label_conflict" | "ambiguous_data" | "cross_contamination_risk" | "missing_data";
    explanation: string;
  }>;
  reasoning_summary: string;
}
```

## Error and edge-case handling

- Empty candidate set after retrieval: agent must say so explicitly and suggest broader query
- All candidates flagged or unsafe: agent recommends nothing and explains why ("no items at this location currently meet your strict halal requirements with high confidence")
- LLM call failure: fall back to deterministic filter and label result as "low confidence — automated reasoning unavailable"
- Profile not loaded: prompt user to complete profile before answering

## Acceptance criteria

- 5 reasoning events stream visibly to UI for every query
- No recommendation is shown without source field citations
- All `flagged` items appear as visible warnings, never hidden
- Agent never claims certainty about data with internal conflicts
- Response time under 6 seconds end-to-end on a typical query
