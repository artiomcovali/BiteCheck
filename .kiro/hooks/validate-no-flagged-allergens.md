# Hook: Validate No Flagged Allergens

## Trigger

Runs after any code change to files matching:
- `src/agent/**/*.ts`
- `src/lib/discrepancy/**/*.ts`
- `src/app/api/chat/**/*.ts`

## Purpose

In a safety-critical app, a code change that accidentally elevates a `flagged` or `unsafe` item into a recommendation is a real risk — especially when an LLM is involved in the ranking step. This hook runs an automated check on every relevant change to verify the contract holds.

## What the hook does

1. Loads a fixture set of test menu items including:
   - Items with label-ingredient conflicts (e.g., labeled vegan, contains whey)
   - Items with asterisk cross-contamination flags
   - Items with empty ingredients
   - Clearly safe items
   - Clearly unsafe items for various profiles

2. Runs the full agent pipeline against each fixture with a synthetic strict profile.

3. Asserts:
   - No `flagged` item appears in `recommendations[]`
   - No `unsafe` item appears in `recommendations[]`
   - Every recommendation has `source_fields.length >= 2` (per dual-source-citation steering)
   - Every recommendation has a non-null `confidence` field
   - Items with `insufficient_data` are never recommended

4. If any assertion fails, the hook blocks the commit and reports which fixture failed and why.

## Why this matters for the demo

When judges read the Kiro Powers writeup, "we set up a hook that validates safety constraints on every change to agent code" demonstrates real engineering discipline tied to the project's stated values. It's not a performative hook — it's protecting the product's core promise.

## Implementation note

The hook runs `tsx scripts/validate-recommendations.ts` against `tests/fixtures/menu-items.json`. The fixtures are derived from real rows in the Cal Poly CSV that exhibit each conflict type, so the test surface reflects actual data realities.
