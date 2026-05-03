import { cache } from 'react';
import {
  expandUserProfileTokens,
  parseDietaryLabels,
  satisfiesDietaryRequirement,
} from '@/lib/menu/dietary-labels';
import type { MenuItem } from '@/lib/types';

type MenuFilters = {
  excludeAllergens: string[];
  requireDietary?: string[];
  macroLimits?: {
    maxCalories?: number;
    minProtein?: number;
    maxCarbs?: number;
    maxFat?: number;
  };
};

export async function getMenuItemsForToday(date?: string): Promise<MenuItem[]> {
  const client = await getMenuClient();
  const targetDate = date ?? getPacificDateString();
  const { data, error } = await client
    .from('menu_items')
    .select('*')
    .eq('date', targetDate)
    .order('building', { ascending: true })
    .order('location', { ascending: true })
    .order('meal_period', { ascending: true })
    .order('station', { ascending: true })
    .order('item_name', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch menu items: ${error.message}`);
  }

  // If no items for today (e.g. data hasn't been refreshed yet),
  // fall back to the most recent date that has data.
  if ((!data || data.length === 0) && !date) {
    const { data: latestRow, error: latestError } = await client
      .from('menu_items')
      .select('date')
      .order('date', { ascending: false })
      .limit(1)
      .single();

    if (!latestError && latestRow?.date && latestRow.date !== targetDate) {
      return getMenuItemsForToday(latestRow.date);
    }
  }

  return (data ?? []) as MenuItem[];
}

/**
 * Fetch ALL menu items currently stored in Supabase, across every date.
 *
 * Wrapped with React `cache()` so multiple server components in the same
 * request tree share a single fetch. Uses a count query first, then fires
 * all page requests in parallel to minimize total wait time.
 */
export const getAllMenuItems = cache(async (): Promise<MenuItem[]> => {
  const client = await getMenuClient();
  const PAGE_SIZE = 1000;

  // Get total count first (head-only, no data transferred)
  const { count, error: countError } = await client
    .from('menu_items')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    throw new Error(`Failed to count menu items: ${countError.message}`);
  }

  const total = count ?? 0;
  if (total === 0) return [];

  // Fire all page fetches in parallel
  const pageCount = Math.ceil(total / PAGE_SIZE);
  const fetches = Array.from({ length: pageCount }, (_, i) => {
    const offset = i * PAGE_SIZE;
    return client
      .from('menu_items')
      .select('*')
      .order('date', { ascending: true })
      .order('building', { ascending: true })
      .order('location', { ascending: true })
      .order('meal_period', { ascending: true })
      .order('station', { ascending: true })
      .order('item_name', { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);
  });

  const results = await Promise.all(fetches);

  const allItems: MenuItem[] = [];
  for (const { data, error } of results) {
    if (error) {
      throw new Error(`Failed to fetch menu items: ${error.message}`);
    }
    if (data) {
      allItems.push(...(data as MenuItem[]));
    }
  }

  return allItems;
});
export async function getMenuItemsByLocation(location: string, date?: string): Promise<MenuItem[]> {
  const client = await getMenuClient();

  let query = client
    .from('menu_items')
    .select('*')
    .eq('location', location)
    .order('date', { ascending: true })
    .order('meal_period', { ascending: true })
    .order('station', { ascending: true })
    .order('item_name', { ascending: true });

  if (date) {
    query = query.eq('date', date);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch menu items for ${location}: ${error.message}`);
  }

  return (data ?? []) as MenuItem[];
}

export function filterMenuItems(items: MenuItem[], filters: MenuFilters): MenuItem[] {
  const excludedTokens = new Set(expandUserProfileTokens(filters.excludeAllergens));
  const requiredDietary = filters.requireDietary ?? [];
  const { macroLimits } = filters;

  return items.filter((item) => {
    const parsedLabels = parseDietaryLabels(item.dietary_labels);
    const presentTokens = new Set(parsedLabels.allergens.map((entry) => entry.token));

    if ([...excludedTokens].some((token) => presentTokens.has(token))) {
      return false;
    }

    if (
      requiredDietary.some((requirement) => !satisfiesDietaryRequirement(parsedLabels, requirement))
    ) {
      return false;
    }

    if (
      macroLimits?.maxCalories !== undefined &&
      (item.calories === null || item.calories > macroLimits.maxCalories)
    ) {
      return false;
    }

    if (
      macroLimits?.minProtein !== undefined &&
      (item.protein_g === null || item.protein_g < macroLimits.minProtein)
    ) {
      return false;
    }

    if (
      macroLimits?.maxCarbs !== undefined &&
      (item.total_carbs_g === null || item.total_carbs_g > macroLimits.maxCarbs)
    ) {
      return false;
    }

    if (
      macroLimits?.maxFat !== undefined &&
      (item.total_fat_g === null || item.total_fat_g > macroLimits.maxFat)
    ) {
      return false;
    }

    return true;
  });
}

async function getMenuClient() {
  const { supabaseAdmin } = await import('@/lib/db/client');
  return supabaseAdmin;
}

function getPacificDateString() {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(new Date());
  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;

  if (!year || !month || !day) {
    throw new Error('Failed to format Pacific date for menu query');
  }

  return `${year}-${month}-${day}`;
}
