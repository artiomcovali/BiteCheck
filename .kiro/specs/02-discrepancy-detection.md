# Spec: Discrepancy Detection

## Purpose

The Cal Poly dining dataset commingles dietary categories, allergens, ingredient flags, and cross-contamination warnings into a single semicolon-delimited `dietary_labels` field, with the dedicated `allergens` column left empty. This spec defines how BiteCheck detects and surfaces label conflicts at query time so the agent can warn students rather than trust unreliable labels.

## Source data realities (from analysis of the campus CSV)

The `dietary_labels` field contains a mix of:
1. **Dietary categories**: `Vegan`, `Vegetarian`, `Avoiding Gluten`
2. **Quality tags**: `Good Source of Protein`, `How Good Friendly`
3. **Allergen presence**: `Milk`, `Egg`, `Soy`, `Wheat`, `Gluten`, `Tree Nuts`, `Peanuts`, `Sesame`, `Fish`, `Shellfish`
4. **Ingredient flags** (likely FODMAP/sensitivity): `Onion`, `Garlic`, `Tomato`, `Mushroom`, `Celery`, `Mustard`
5. **Meat indicators**: `Beef`, `Pork`, `Chicken`, `Turkey`, `Fish`
6. **Asterisk-suffixed entries**: `Beef*`, `Mustard*`, `Celery*`, `Pork*` — likely indicates "may contain" / cross-contamination, not confirmed presence

The `ingredients` field is free-text and may contradict labels.
The `allergens` column is empty across all 3,668 rows in the current dataset.

## Conflict categories the detector must identify

### A. Label-ingredient conflict
Item is labeled `Vegan` or `Vegetarian` but the `ingredients` text or other label tags contain meat, dairy, or animal-derived terms.

Detection:
- If `Vegan` in labels AND any of `[milk, dairy, butter, cream, cheese, egg, honey, gelatin, whey, casein, beef, pork, chicken, fish, anchovy]` in ingredients → conflict
- If `Vegetarian` in labels AND any of `[beef, pork, chicken, turkey, fish, anchovy, gelatin]` in ingredients → conflict

### B. Missing dietary classification
Item's `dietary_labels` contains meat indicators (`Beef`, `Pork`, `Chicken`, etc.) but has no dietary category tag (`Vegan`, `Vegetarian`, neither). For a vegetarian student this is ambiguous — the absence of a "non-vegetarian" tag in this dataset means classification is unreliable.

Detection:
- If labels contain meat tags AND no `Vegetarian` AND no `Vegan` → ambiguous (treat as non-vegetarian for safety)

### C. Cross-contamination flags
Asterisk-suffixed entries (`Beef*`, `Mustard*`) indicate the item may contain or share equipment with that ingredient.

Detection:
- Any token ending in `*` is a cross-contamination warning
- For `severity: "medical"` profiles (severe allergies, celiac), asterisk matches against any user allergen → unsafe
- For `severity: "strict"` profiles (religious, ethical) → flagged with explanation
- For `severity: "preference"` profiles → noted but not flagged

### D. Allergen-in-dietary-field conflict
Items labeled `Vegan` that include allergen tags like `Milk` or `Egg` in the same field.

Detection:
- If `Vegan` AND (`Milk` or `Egg` or `Dairy`) in labels → conflict (Vegan should exclude these by definition)

### E. Missing data
Item has empty `ingredients` and empty `dietary_labels` → cannot be safely recommended for any restriction.

Detection:
- If both fields empty → mark as "insufficient data" — never recommend

## Implementation requirements

The detector is a pure function:

```typescript
function detectDiscrepancies(
  item: MenuItem,
  profile: UserProfile
): DiscrepancyReport
```

It runs deterministically (no LLM call) so results are reproducible. The LLM in Step 4 of the agent loop *consumes* the report and uses it to reason about recommendations — but never overrides a detected conflict.

## Output

```typescript
type DiscrepancyReport = {
  status: "safe" | "flagged" | "unsafe" | "insufficient_data";
  conflicts: Array<{
    type: "label_ingredient" | "missing_classification" | "cross_contamination" | "allergen_in_dietary_field" | "empty_data";
    description: string;  // human-readable, used in UI warnings
    fields_involved: string[];  // which CSV columns triggered this
  }>;
}
```

## Acceptance criteria

- Every menu item gets a deterministic status before the LLM ranks them
- Conflicts include human-readable descriptions ready for UI display
- The detector is unit-testable on fixture rows from the real CSV
- The agent's final response can never recommend an `unsafe` item
- `flagged` items can be mentioned but only as warnings, never as recommendations
