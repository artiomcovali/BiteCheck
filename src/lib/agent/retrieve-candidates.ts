/**
 * Pipeline Step 2 — Retrieve candidate menu items.
 *
 * Pulls today's menu from Supabase via `getMenuItemsForToday` and narrows
 * by the parsed intent (location, meal period, nutritional goal). Capped
 * at 50 candidates per spec 01 so the LLM context stays bounded.
 *
 * Selection strategy:
 *   - Location named: take the first 50 of the filtered set (respecting
 *     DB sort).
 *   - Nutritional goal set: sort by that nutrient in the helpful direction
 *     (descending for `min`, ascending for `max`) so the top 50 the LLM
 *     sees are the most relevant matches.
 *   - Neither: round-robin across locations so the candidate set covers
 *     the whole day's menu instead of saturating in one alphabetically-
 *     first venue.
 *
 * Location filter is fuzzy: the user says "1901 marketplace" but the row
 * has `building = "1901 Marketplace"` and `location = "Red Radish"`. We
 * substring-match in both directions across both fields.
 */

import { getMenuItemsForToday } from '@/lib/api/menu-items';
import type { MenuItem, ParsedIntent } from '@/lib/types';

const MAX_CANDIDATES = 50;

export async function retrieveCandidates(intent: ParsedIntent): Promise<MenuItem[]> {
  const items = await getMenuItemsForToday();
  const filtered = filterByIntent(items, intent);
  return selectCandidates(filtered, intent);
}

function filterByIntent(items: MenuItem[], intent: ParsedIntent): MenuItem[] {
  const locationNeedle = intent.location_filter?.trim().toLowerCase() ?? null;
  const mealNeedle = intent.meal_period_filter;

  const matchesLocation = (item: MenuItem) => {
    if (!locationNeedle) return true;
    const haystacks = [item.location, item.building].map((value) => value.toLowerCase());
    return haystacks.some((h) => h.includes(locationNeedle) || locationNeedle.includes(h));
  };
  const matchesMeal = (item: MenuItem) => {
    if (!mealNeedle) return true;
    if (item.meal_period === mealNeedle) return true;
    // "Every Day" rows aren't tied to a meal period — they belong in
    // every period (drinks, snacks). Defensive on the unnormalized variant.
    return item.meal_period === 'Every Day' || item.meal_period === 'Everyday';
  };
  const matchesGoal = (item: MenuItem) => {
    const goal = intent.nutritional_goal;
    if (!goal) return true;
    const value = readNutrient(item, goal.nutrient);
    if (value === null) return false;
    return goal.op === 'min' ? value >= goal.target : value <= goal.target;
  };

  return items.filter((item) => matchesLocation(item) && matchesMeal(item) && matchesGoal(item));
}

function selectCandidates(items: MenuItem[], intent: ParsedIntent): MenuItem[] {
  if (items.length <= MAX_CANDIDATES) return items;

  if (intent.nutritional_goal) {
    const goal = intent.nutritional_goal;
    const sorted = [...items].sort((a, b) => {
      const av = readNutrient(a, goal.nutrient);
      const bv = readNutrient(b, goal.nutrient);
      if (av === null && bv === null) return 0;
      if (av === null) return 1;
      if (bv === null) return -1;
      return goal.op === 'min' ? bv - av : av - bv;
    });

    // If a specific location was requested, just take the top N sorted.
    // Otherwise, round-robin across locations so the results aren't all
    // from one dining hall — but within each location bucket, items are
    // still sorted by the nutrient so the best ones surface first.
    if (intent.location_filter) {
      return sorted.slice(0, MAX_CANDIDATES);
    }
    return roundRobinByLocation(sorted, MAX_CANDIDATES);
  }

  if (intent.location_filter) {
    return items.slice(0, MAX_CANDIDATES);
  }

  return roundRobinByLocation(items, MAX_CANDIDATES);
}

function roundRobinByLocation(items: MenuItem[], cap: number): MenuItem[] {
  const groups = new Map<string, MenuItem[]>();
  for (const item of items) {
    const key = `${item.building}::${item.location}`;
    let bucket = groups.get(key);
    if (!bucket) {
      bucket = [];
      groups.set(key, bucket);
    }
    bucket.push(item);
  }

  const buckets = [...groups.values()];
  const result: MenuItem[] = [];
  let cursor = 0;
  while (result.length < cap) {
    let advanced = false;
    for (const bucket of buckets) {
      if (cursor < bucket.length) {
        result.push(bucket[cursor]!);
        advanced = true;
        if (result.length >= cap) break;
      }
    }
    if (!advanced) break;
    cursor += 1;
  }
  return result;
}

function readNutrient(item: MenuItem, nutrient: string): number | null {
  const key = nutrient as keyof MenuItem;
  const value = item[key];
  return typeof value === 'number' ? value : null;
}
