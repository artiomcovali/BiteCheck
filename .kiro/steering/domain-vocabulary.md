# Steering: Domain Vocabulary

This document defines the vocabulary BiteCheck uses internally and externally. Consistent terminology matters for clarity in code, prompts, and user-facing copy.

## Restriction taxonomy

Use these exact strings for restriction types in code, schemas, and prompts:

- `vegan` — no animal products including dairy, eggs, honey
- `vegetarian` — no meat or fish; dairy and eggs allowed
- `pescatarian` — no meat; fish and dairy allowed
- `gluten-free` — no wheat, barley, rye, malt, brewer's yeast
- `dairy-free` — no milk, cheese, butter, cream, whey, casein
- `nut-allergy` — no tree nuts or peanuts
- `shellfish-allergy` — no crustaceans or mollusks
- `egg-allergy` — no eggs or egg-derived ingredients
- `soy-allergy` — no soy products
- `sesame-allergy` — no sesame
- `halal` — Islamic dietary law
- `kosher` — Jewish dietary law
- `hindu-vegetarian` — vegetarian per Hindu observance (typically no meat, fish, eggs; dairy allowed)
- `jain-vegetarian` — Jain observance (vegetarian plus no root vegetables)

Code that uses synonyms or variants ("vegan-friendly," "no gluten," "GF") is incorrect — normalize to the canonical strings above.

## Severity taxonomy

- `medical` — strict allergies, celiac disease, conditions where a violation causes physical harm
- `strict` — religious or ethical restrictions where a violation causes serious distress (Hindu vegetarian, vegan for ethical reasons, observant kosher/halal)
- `preference` — lifestyle choices where occasional flexibility is acceptable

These severities drive how the agent treats cross-contamination warnings and ambiguous data. Code must always check severity, never assume it.

## Status taxonomy (discrepancy detector output)

- `safe` — passes all profile constraints; multiple sources agree
- `flagged` — warning present (label conflict, cross-contamination, ambiguous data); shown in UI with explanation
- `unsafe` — clearly violates a profile restriction; never recommended
- `insufficient_data` — both `ingredients` and `dietary_labels` empty; cannot evaluate

## Forbidden phrasings in user-facing copy

These phrases sound authoritative in ways the data doesn't support. Generate alternatives instead.

- ❌ "This is safe to eat" → ✅ "This looks safe based on the available data"
- ❌ "You can definitely have this" → ✅ "Based on the labeled ingredients, this fits your profile"
- ❌ "This is gluten-free" → ✅ "This is labeled gluten-free, and the ingredients list confirms it"
- ❌ "Avoid this — it has gluten" → ✅ "I'd avoid this — the ingredients include wheat flour despite the gluten-free label"
- ❌ "Allergen-free" → ✅ "No allergens flagged in the data"

## Field name conventions

In code, use snake_case matching the CSV columns: `dietary_labels`, `meal_period`, `protein_g`. In user-facing copy, use natural phrasing: "the dietary labels field," "the protein content."

## Project-specific terms

- **BiteCheck** — the product name. Always capitalized, one word.
- **The audit** — refers to the discrepancy detection process
- **Source-cited** — describes recommendations that include `source_fields`
- **Profile** — the user's dietary restrictions, religious dietary, allergens, and severity, stored in Supabase

Generate code and copy that uses these terms consistently.
