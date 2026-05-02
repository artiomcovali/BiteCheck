# Steering: Dual-Source Citation

This document instructs Kiro on how to handle citations and source attribution in BiteCheck.

## Why this matters

The Cal Poly dining dataset has internal data integrity issues — the `dietary_labels` field combines categories, allergens, ingredient flags, and cross-contamination warnings into one ambiguous string. The `allergens` column is empty. The `ingredients` field is free-text and may contradict labels.

Because the data is unreliable in known ways, every claim BiteCheck makes must point back to which fields the claim came from. This makes the agent auditable and trustworthy even when the underlying data isn't.

## Rules for code generation

### 1. Every recommendation cites at least two fields
A recommendation backed by only one field is fragile. Generate code that requires `source_fields` to contain at least two of: `dietary_labels`, `ingredients`, `allergens`, `description`, `item_name`, plus the relevant nutrition columns when nutritional goals are involved.

If only one field is available, downgrade confidence to "low" and note the limitation.

### 2. Conflicts cite both sides
When a discrepancy is detected, the conflict description must name both fields involved (e.g., "dietary_labels says Vegan but ingredients lists 'whey protein'"). Generate code that includes both field names in the `fields_involved` array on every conflict object.

### 3. Asterisk handling is explicit
When an asterisk-suffixed entry triggers a warning (e.g., `Beef*` indicating cross-contamination), the response must explain what the asterisk means. Generate user-facing strings like "the dietary_labels field flags this with `Beef*`, which we interpret as a cross-contamination risk" rather than just "may contain beef."

### 4. The LLM cannot invent fields
When constructing prompts, explicitly instruct the LLM that it may only cite fields that actually exist in the dataset. The valid field list:
- `item_name`, `location`, `meal_period`, `station`, `description`
- `ingredients`, `dietary_labels`, `allergens` (note: usually empty)
- `calories`, `protein_g`, `total_fat_g`, `total_carbs_g`, `fiber_g`, `sodium_mg`, `sugar_g`, `added_sugar_g`, `sat_fat_g`, `trans_fat_g`, `cholesterol_mg`
- micronutrients: `calcium_mg`, `iron_mg`, `potassium_mg`, `vitamin_c_mg`, `vitamin_d_mcg`

Code that allows the LLM to cite arbitrary field names is incorrect.

### 5. UI must render citations as expandable detail
Generate UI components where source citations are visible-on-demand. The user shouldn't have to read field names by default, but they must be able to expand a recommendation card to see exactly what data drove the decision. This is the "show your work" moment.

## Why two sources

Single-source recommendations are how dining apps fail their users today. Cal Poly's app shows a "vegan" tag and trusts it. BiteCheck shows the tag *and* checks the ingredients list against it. When they agree, confidence is high. When they conflict, the user is warned. This dual-source check is the agent's core value — the steering ensures every code path enforces it.
