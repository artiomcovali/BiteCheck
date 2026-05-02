PROMPT:

I'm Person A on a 3-person team building BiteCheck for a hackathon. 



Read these files in order and confirm you understand the project before doing anything:

.kiro/specs/01-agent-decision-loop.md

.kiro/specs/02-discrepancy-detection.md

.kiro/specs/03-streaming-ui.md

.kiro/steering/safety-first-reasoning.md

.kiro/steering/dual-source-citation.md

.kiro/steering/domain-vocabulary.md



After reading, summarize back to me in 4 bullets: (a) what BiteCheck does, (b) the agent's 5-step pipeline, (c) the 5 conflict types the discrepancy detector catches, (d) what severity levels mean for cross-contamination handling.



**Don't write any code yet.**


RESPONSE:


Let me read all the files you mentioned.

Got it. Here's my understanding:

**(a) What BiteCheck does.** BiteCheck is a safety-first dining recommendation agent for Cal Poly students. A student tells it their dietary restrictions, allergies, and religious dietary needs, and it answers natural-language questions like "what can I eat at 19 Metro tonight?" by reasoning over the campus dining CSV — cross-checking labels against ingredients rather than blindly trusting either one.

**(b) The agent's 5-step pipeline.**
1. **Parse** — LLM extracts intent from the query (location, meal period, nutritional goal, query type).
2. **Retrieve** — Queries Supabase for up to 50 candidate menu items matching the filters and today's date.
3. **Audit** — Runs the deterministic discrepancy detector against each candidate using the student's profile, tagging every item `safe`, `flagged`, `unsafe`, or `insufficient_data`.
4. **Rank** — An LLM call ranks the `safe` items, assigns confidence scores, and cites the specific CSV fields that justify each pick. It consumes the audit report but can never promote a `flagged` or `unsafe` item to a recommendation.
5. **Respond** — Streams the final structured output: top recommendations with confidence badges, warning cards for flagged items, and a reasoning summary — all source-cited.

**(c) The 5 conflict types the discrepancy detector catches.**
1. **Label-ingredient conflict** — e.g., labeled `Vegan` but ingredients list whey or fish sauce.
2. **Missing dietary classification** — meat tags present (`Beef`, `Pork`) but no `Vegan`/`Vegetarian` category tag, making the item ambiguous (treated as non-vegetarian for safety).
3. **Cross-contamination flags** — asterisk-suffixed entries like `Beef*` or `Mustard*`, interpreted as "may contain" / shared-equipment warnings.
4. **Allergen-in-dietary-field conflict** — e.g., labeled `Vegan` but the same `dietary_labels` field also contains `Milk` or `Egg`.
5. **Missing data** — both `ingredients` and `dietary_labels` are empty, so the item can't be evaluated and is never recommended.

**(d) What severity levels mean for cross-contamination handling.**
- **`medical`** (celiac, severe allergies) — asterisk entries matching any user allergen are `unsafe` and never recommended. Zero tolerance.
- **`strict`** (religious observance, ethical commitments like Hindu vegetarian or halal) — asterisk entries are `flagged` with an explanation so the student can decide. Treated with the same rigor as medical, but the student sees the warning rather than an outright block.
- **`preference`** (lifestyle choices with some flexibility) — asterisk entries are noted in the data but not flagged or blocked.

Ready for whatever you want to build first.
