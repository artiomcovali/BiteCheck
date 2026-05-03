/**
 * Deterministic discrepancy detector for BiteCheck.
 *
 * Pure synchronous function. No LLM, no DB. Same input → same output.
 * Implements all five conflict categories from
 * `.kiro/specs/02-discrepancy-detection.md`:
 *
 *   A. label_ingredient        Vegan/Vegetarian label vs. animal-derived
 *                              terms in ingredients
 *   B. missing_classification  Meat tag present but no Vegan/Vegetarian
 *                              label, for users with that restriction
 *   C. cross_contamination     Asterisk-suffixed tokens in dietary_labels
 *                              that match the user's allergens or diet
 *   D. allergen_in_dietary_field
 *                              Vegan label + Milk/Egg/Dairy in the same
 *                              field
 *   E. empty_data              Both `ingredients` and `dietary_labels`
 *                              empty → `insufficient_data`
 *
 * Status precedence (highest wins): unsafe > insufficient_data > flagged
 * > safe.
 *
 * @see spec 02 — Discrepancy Detection
 * @module
 */

import { expandUserProfileTokens, parseDietaryLabels } from '@/lib/menu/dietary-labels';
import type { DiscrepancyReport, MenuItem, UserProfile } from '@/lib/types';

type Conflict = DiscrepancyReport['conflicts'][number];

const VEGAN_VIOLATING_INGREDIENTS = [
  'milk',
  'dairy',
  'butter',
  'cream',
  'cheese',
  'egg',
  'honey',
  'gelatin',
  'whey',
  'casein',
  'beef',
  'pork',
  'chicken',
  'turkey',
  'fish',
  'anchovy',
  'lard',
  'tallow',
];

const VEGETARIAN_VIOLATING_INGREDIENTS = [
  'beef',
  'pork',
  'chicken',
  'turkey',
  'fish',
  'anchovy',
  'gelatin',
  'lard',
  'tallow',
];

const VEGAN_VIOLATING_LABEL_TOKENS = new Set(['Milk', 'Egg']);

const MEAT_TOKENS = new Set(['Beef', 'Pork', 'Poultry', 'Fish', 'Shellfish']);

export function detectDiscrepancies(item: MenuItem, profile: UserProfile): DiscrepancyReport {
  const conflicts: Conflict[] = [];
  let status: DiscrepancyReport['status'] = 'safe';
  const escalate = (next: DiscrepancyReport['status']) => {
    status = highestStatus(status, next);
  };

  // ── E. empty data ────────────────────────────────────────────────
  const ingredients = (item.ingredients ?? '').trim();
  const labels = (item.dietary_labels ?? '').trim();
  if (!ingredients && !labels) {
    return {
      status: 'insufficient_data',
      conflicts: [
        {
          type: 'empty_data',
          description:
            "No ingredient or dietary info available for this item — we can't verify it's safe for you. Check with dining staff.",
          fields_involved: ['ingredients', 'dietary_labels'],
        },
      ],
    };
  }

  const parsed = parseDietaryLabels(labels);
  const labelTokens = new Set(parsed.allergens.map((a) => a.token));
  const ingredientsLower = ingredients.toLowerCase();
  const wantsVegan =
    profile.restrictions.includes('vegan') || profile.religious_dietary.includes('jain-vegetarian');
  const wantsVegetarian =
    wantsVegan ||
    profile.restrictions.includes('vegetarian') ||
    profile.religious_dietary.includes('hindu-vegetarian');

  // ── Direct allergen presence (non-asterisk) ──────────────────────
  // Allergens are non-negotiable. Severity controls cross-contam, not
  // direct presence — a confirmed allergen is always unsafe.
  const userAllergenTokens = new Set(expandUserProfileTokens(profile.allergens));
  const directAllergenHits = parsed.allergens.filter(
    (entry) => !entry.cross_contam && userAllergenTokens.has(entry.token),
  );
  for (const hit of directAllergenHits) {
    conflicts.push({
      type: 'allergen_in_dietary_field',
      description: `Contains ${hit.token.toLowerCase()}, which is one of your allergens.`,
      fields_involved: ['dietary_labels'],
    });
    escalate('unsafe');
  }

  // ── C. cross-contamination (asterisk tokens) ─────────────────────
  const userExpansionForCross = new Set(
    expandUserProfileTokens([
      ...profile.allergens,
      ...profile.restrictions,
      ...profile.religious_dietary,
    ]),
  );
  const crossHits = parsed.allergens.filter(
    (entry) => entry.cross_contam && userExpansionForCross.has(entry.token),
  );
  if (crossHits.length > 0) {
    const readable = crossHits.map((h) => h.token.toLowerCase()).join(', ');
    conflicts.push({
      type: 'cross_contamination',
      description: `Possible cross-contamination with ${readable}. This item may be prepared on shared equipment.`,
      fields_involved: ['dietary_labels'],
    });
    if (profile.severity === 'medical') escalate('unsafe');
    else if (profile.severity === 'strict') escalate('flagged');
    // preference → noted, no escalation
  }

  // ── D. allergen in dietary field, vegan-specific ─────────────────
  if (parsed.restrictions.includes('vegan')) {
    const violatingLabelTokens = [...labelTokens].filter((t) =>
      VEGAN_VIOLATING_LABEL_TOKENS.has(t),
    );
    if (violatingLabelTokens.length > 0) {
      const readable = violatingLabelTokens.map((t) => t.toLowerCase()).join(', ');
      conflicts.push({
        type: 'allergen_in_dietary_field',
        description: `Labeled vegan, but also lists ${readable} — the label may be inaccurate.`,
        fields_involved: ['dietary_labels'],
      });
      escalate('flagged');
    }
  }

  // ── A. label-ingredient conflict ─────────────────────────────────
  if (parsed.restrictions.includes('vegan') && ingredientsLower) {
    const offenders = matchIngredientTerms(ingredientsLower, VEGAN_VIOLATING_INGREDIENTS);
    if (offenders.length > 0) {
      conflicts.push({
        type: 'label_ingredient',
        description: `Labeled vegan, but the ingredients include ${offenders.join(', ')}. Double-check before eating.`,
        fields_involved: ['dietary_labels', 'ingredients'],
      });
      escalate('flagged');
    }
  } else if (
    parsed.restrictions.includes('vegetarian') &&
    !parsed.restrictions.includes('vegan') &&
    ingredientsLower
  ) {
    const offenders = matchIngredientTerms(ingredientsLower, VEGETARIAN_VIOLATING_INGREDIENTS);
    if (offenders.length > 0) {
      conflicts.push({
        type: 'label_ingredient',
        description: `Labeled vegetarian, but the ingredients include ${offenders.join(', ')}. Double-check before eating.`,
        fields_involved: ['dietary_labels', 'ingredients'],
      });
      escalate('flagged');
    }
  }

  // ── B. missing classification (only relevant if user wants veg/vegan) ──
  if (wantsVegetarian) {
    const meatLabelTokens = [...labelTokens].filter((t) => MEAT_TOKENS.has(t));
    const isExplicitlyVeg =
      parsed.restrictions.includes('vegetarian') || parsed.restrictions.includes('vegan');
    if (meatLabelTokens.length > 0 && !isExplicitlyVeg) {
      const readable = meatLabelTokens.map((t) => t.toLowerCase()).join(', ');
      conflicts.push({
        type: 'missing_classification',
        description: `Contains ${readable} — not suitable for your ${wantsVegan ? 'vegan' : 'vegetarian'} diet.`,
        fields_involved: ['dietary_labels'],
      });
      escalate('unsafe');
    } else if (!isExplicitlyVeg) {
      conflicts.push({
        type: 'missing_classification',
        description: `Not labeled vegetarian or vegan — we can't confirm this fits your ${
          wantsVegan ? 'vegan' : 'vegetarian'
        } diet. Check with dining staff.`,
        fields_involved: ['dietary_labels'],
      });
      escalate('flagged');
    }
  }

  // ── Religious hard-violations (halal Pork, kosher Pork/Shellfish) ──
  const religiousViolations = collectReligiousViolations(profile, labelTokens);
  for (const violation of religiousViolations) {
    conflicts.push({
      type: 'allergen_in_dietary_field',
      description: violation.description,
      fields_involved: ['dietary_labels'],
    });
    escalate('unsafe');
  }

  return { status, conflicts };
}

function highestStatus(
  current: DiscrepancyReport['status'],
  next: DiscrepancyReport['status'],
): DiscrepancyReport['status'] {
  const order: Record<DiscrepancyReport['status'], number> = {
    safe: 0,
    flagged: 1,
    insufficient_data: 2,
    unsafe: 3,
  };
  return order[next] > order[current] ? next : current;
}

function matchIngredientTerms(ingredientsLower: string, terms: string[]): string[] {
  const hits = new Set<string>();
  for (const term of terms) {
    // Word-boundary match. Catches "beef stock" but not "beefless" or
    // "honeycomb-free disclaimers". False positives are acceptable
    // (escalate to flagged, user sees it); false negatives are not.
    const re = new RegExp(`\\b${escapeRegex(term)}\\b`, 'i');
    if (re.test(ingredientsLower)) hits.add(term);
  }
  return [...hits];
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function collectReligiousViolations(
  profile: UserProfile,
  labelTokens: Set<string>,
): { description: string }[] {
  const out: { description: string }[] = [];
  if (profile.religious_dietary.includes('halal') && labelTokens.has('Pork')) {
    out.push({
      description: 'Contains pork — not halal.',
    });
  }
  if (profile.religious_dietary.includes('kosher')) {
    if (labelTokens.has('Pork')) {
      out.push({
        description: 'Contains pork — not kosher.',
      });
    }
    if (labelTokens.has('Shellfish')) {
      out.push({
        description: 'Contains shellfish — not kosher.',
      });
    }
  }
  return out;
}
