/**
 * Fixture event streams for BiteCheck.
 *
 * These power the demo when the real agent pipeline isn't wired up yet. The
 * shape and timing match what the production pipeline will produce, so the UI
 * doesn't need to change when the real backend lands — only the route handler
 * swaps out `streamFixtureEvents` for the live agent.
 *
 * Keep these realistic. Judges in a 30-second screen recording will read the
 * audit conflict, the recommendation reasoning, and the source citations
 * verbatim. Generic placeholders break the demo.
 */
import type { ReasoningEvent, UserProfile } from "@/lib/types";

export type FixtureContext = {
  query: string;
  profile: UserProfile;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Default streaming arc: vegan + tree nut allergy, dinner at 19 Metro.
 *
 * Pacing: 400–800ms between events (per spec 03 — Streaming behavior).
 * The arc is intentionally similar across personas so the *shape* of the
 * reasoning is consistent; only the surface text changes.
 */
export async function* streamFixtureEvents(
  ctx: FixtureContext,
  signal?: AbortSignal,
): AsyncGenerator<ReasoningEvent> {
  const yieldOrAbort = async (
    event: ReasoningEvent,
    delayMs: number,
  ): Promise<ReasoningEvent | null> => {
    await sleep(delayMs);
    if (signal?.aborted) return null;
    return event;
  };

  const profileSummary = describeProfile(ctx.profile);
  const location = inferLocation(ctx.query) ?? "19 Metro Station";
  const meal = inferMeal(ctx.query) ?? "Dinner";

  // Step 1 — parse
  {
    const event = await yieldOrAbort(
      {
        type: "parse",
        message: `Looking for ${meal.toLowerCase()} options at ${location}, filtering for ${profileSummary}.`,
        result: {
          location_filter: location,
          meal_period_filter: meal as "Breakfast" | "Lunch" | "Dinner",
          nutritional_goal: null,
          query_type: "what_can_i_eat",
        },
      },
      450,
    );
    if (!event) return;
    yield event;
  }

  // Step 2 — retrieve
  {
    const event = await yieldOrAbort(
      {
        type: "retrieve",
        message: `Found 23 items on tonight's menu at ${location}.`,
        count: 23,
      },
      650,
    );
    if (!event) return;
    yield event;
  }

  // Step 3 — audit (the magic moment)
  {
    const event = await yieldOrAbort(
      {
        type: "audit",
        message: "8 of 23 items have data quality issues worth flagging.",
        flagged_examples: [
          {
            item_name: "Spiced Tofu Scramble",
            issue:
              "dietary_labels says Vegan but ingredients lists redfish seasoning",
          },
          {
            item_name: "Pad Thai (Chef's Special)",
            issue:
              "dietary_labels marks vegan but description references fish sauce",
          },
          {
            item_name: "Roasted Veg Plate",
            issue: "asterisk in dietary_labels — possible cross-contamination",
          },
        ],
      },
      750,
    );
    if (!event) return;
    yield event;
  }

  // Step 4 — rank
  {
    const event = await yieldOrAbort(
      {
        type: "rank",
        message:
          "15 items pass your profile cleanly. Sorting by protein and freshness.",
      },
      550,
    );
    if (!event) return;
    yield event;
  }

  // Step 5 — complete
  {
    const event = await yieldOrAbort(
      {
        type: "complete",
        recommendations: [
          {
            item_name: "Mediterranean Grain Bowl",
            location: `Vista Grande · ${meal}`,
            confidence: "high",
            reasoning:
              "Labeled Vegan in dietary_labels and the ingredients list contains no animal products or tree-nut derivatives. Prep station is the cold line, so cross-contamination risk is low.",
            nutrition_summary: "~32g protein, 540 cal",
            source_fields: ["dietary_labels", "ingredients", "station"],
          },
          {
            item_name: "Roasted Veg Buddha Plate",
            location: `${location} · ${meal}`,
            confidence: "high",
            reasoning:
              "Vegan-labeled with a clean ingredients list. No tree-nut markers, and the prep station does not handle peanut or tree-nut items tonight.",
            nutrition_summary: "~24g protein, 470 cal",
            source_fields: ["dietary_labels", "ingredients", "station"],
          },
          {
            item_name: "Charred Cauliflower Steak",
            location: `${location} · ${meal}`,
            confidence: "medium",
            reasoning:
              "Labeled vegan, ingredients list is short and clean. One nutrition column is empty so the protein estimate is approximate — flagging as medium until staff confirms the marinade.",
            nutrition_summary: "~12g protein (estimated)",
            source_fields: ["dietary_labels", "ingredients"],
          },
        ],
        warnings: [
          {
            item_name: "Spiced Tofu Scramble",
            issue: "label_conflict",
            severity: "avoid",
            explanation:
              "dietary_labels marks this Vegan, but the ingredients list includes \"redfish seasoning,\" which typically contains dried fish or shellfish derivatives. Until staff confirms the exact blend, we can't verify it's plant-based — and it could trigger your tree-nut allergen list if cross-blended.",
          },
          {
            item_name: "Pad Thai (Chef's Special)",
            issue: "cross_contamination_risk",
            severity: "caution",
            explanation:
              "Asterisk in dietary_labels (Pad Thai*) signals shared prep with the wok station, which handles peanut sauces tonight. Tree-nut cross-contact risk is real here.",
          },
        ],
        reasoning_summary:
          "Three solid options for you tonight. The Mediterranean Grain Bowl is the best fit — high-protein, vegan-confirmed across both label and ingredient fields. Two items are flagged: the Spiced Tofu Scramble has a label/ingredient conflict, and the Pad Thai sits next to the peanut wok. Avoid both until staff confirms.",
      },
      800,
    );
    if (!event) return;
    yield event;
  }
}

function describeProfile(profile: UserProfile): string {
  const parts: string[] = [];
  if (profile.restrictions.length > 0) {
    parts.push(profile.restrictions.join(" + "));
  }
  if (profile.allergens.length > 0) {
    parts.push(`${profile.allergens.join(", ")} allergy`);
  }
  if (parts.length === 0) parts.push("your profile");
  return `your ${parts.join(", ")} (${profile.severity})`;
}

function inferLocation(query: string): string | null {
  const matchers: Array<{ re: RegExp; name: string }> = [
    { re: /19\s*metro/i, name: "19 Metro Station" },
    { re: /1901/i, name: "1901 Marketplace" },
    { re: /vista\s*grande/i, name: "Vista Grande" },
    { re: /the\s*avenue|avenue/i, name: "The Avenue" },
    { re: /myron|mott|red\s*radish/i, name: "Red Radish" },
  ];
  for (const m of matchers) if (m.re.test(query)) return m.name;
  return null;
}

function inferMeal(
  query: string,
): "Breakfast" | "Lunch" | "Dinner" | null {
  if (/breakfast|brunch|morning/i.test(query)) return "Breakfast";
  if (/lunch|noon|midday/i.test(query)) return "Lunch";
  if (/dinner|tonight|evening/i.test(query)) return "Dinner";
  return null;
}
