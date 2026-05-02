# Steering: Safety-First Reasoning

This document governs how Kiro generates code for any agent reasoning, recommendation logic, or response generation in BiteCheck. These rules apply to every LLM call and every code path that produces output the user will see.

## Core principle

BiteCheck operates in a safety-critical context. A student with celiac disease, a Hindu student with religious vegetarian commitments, or a vegan with severe dairy allergies relies on this app's recommendations. **Wrong recommendations cause real harm — physical, religious, or ethical.** Therefore, every reasoning path must err on the side of caution.

## Rules for code generation

### 1. Never hide flagged items
When the discrepancy detector reports a `flagged` or `unsafe` status, the UI must surface it as a warning. Do not write code that filters flagged items out silently. The user must see what was excluded and why.

### 2. Confidence is mandatory
Every recommendation in code must carry a `confidence` field. There is no "default to high" — confidence must be derived from the discrepancy detector's report. Code that produces a recommendation without a confidence value is incorrect.

### 3. Cite source fields, always
Every recommendation must include `source_fields: string[]` — the specific CSV columns that justified the decision (e.g., `["dietary_labels", "ingredients"]`). This proves the agent reasoned over real data and is auditable. Code that produces unsourced recommendations is incorrect.

### 4. Cross-contamination rules vary by severity
- `severity: "medical"` → asterisk-suffixed entries matching user allergens are `unsafe`, never recommended
- `severity: "strict"` → asterisk entries are `flagged` with explanation
- `severity: "preference"` → asterisk entries are noted but not flagged

When generating filtering logic, always check the user's `severity` field. Do not generate code that treats all users identically.

### 5. Missing data is unsafe
If `ingredients` is empty AND `dietary_labels` is empty, the item cannot be evaluated and must not be recommended for any restricted user. Code must handle this case explicitly — never assume safety from absence of data.

### 6. The LLM does not override the deterministic detector
The discrepancy detector (spec 02) runs first and produces a status. The LLM in the ranking step (spec 01, step 4) consumes that status. The LLM may explain it, may rank among `safe` items, but **must never elevate a `flagged` or `unsafe` item to a recommendation**. Generate prompts that make this constraint explicit.

### 7. No medical claims
The agent provides risk-aware guidance, not medical advice. Generate response text that uses phrases like "I'd avoid this," "this looks safe based on the data," "the data is unclear here" — never "this is safe to eat" or "you can definitely have this." Avoid any phrasing that sounds like a clinical recommendation.

### 8. Religious dietary commitments deserve the same rigor as allergies
A Hindu vegetarian, a kosher-observant student, or a Muslim student keeping halal has dietary restrictions that are non-negotiable for reasons beyond preference. Generate code and copy that treats these with the same care as medical allergies. Do not use language that frames religious dietary restrictions as "preferences."

## Rules for prompts the agent sends to the LLM

When constructing prompts for the LLM ranking step:

- Always include the user's full profile, including severity
- Always include the discrepancy report for every candidate item
- Explicitly instruct: "You may not recommend any item with status 'flagged' or 'unsafe'. You may explain why an item was flagged, but it must appear under warnings, not recommendations."
- Always require structured output that includes `source_fields` for each recommendation
- Always instruct the LLM to cite which CSV column justified its reasoning

## Tone for user-facing copy

- Honest about uncertainty — don't fake confidence the data doesn't support
- Specific — "the dietary_labels field marks this vegan, and the ingredients list shows no animal products"
- Calm — the user is hungry and trying to eat safely, not being lectured
- Brief — students will read 2 sentences, not 5

## When data quality is poor

The Cal Poly dataset is messy. Many items lack ingredients or have ambiguous labels. When generating code that handles these cases:

- Surface the data gap to the user — don't paper over it
- Recommend the user check with dining staff for items with missing data on critical fields
- Never fabricate plausible ingredients to fill gaps

## What this document is not

This is not a prompt template. This is a set of generation constraints for Kiro. Every time Kiro writes code that touches recommendations, reasoning, or user-facing output, these rules apply.
