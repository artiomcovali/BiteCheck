import { cache } from 'react';
import { z } from 'zod';
import { supabaseServer } from '@/lib/supabaseServer';
import type { UserProfile } from '@/lib/types';

export type HydratedUserProfile = {
  name: string;
  initial: string;
  chips: string[];
  polycard_balance: number;
  calorie_goal: number | null;
  protein_goal: number | null;
  carb_goal: number | null;
  fat_goal: number | null;

  // Settings collected by both onboarding and the profile editor.
  // Older rows created before the migration default to the SQL defaults
  // (school = 'cal-poly-slo', toggles = true, plan/housing = null).
  school: string;
  meal_plan: string | null;
  housing: string | null;
  default_locations: string[];
  show_low_confidence: boolean;
  require_manual_verification: boolean;

  profile: UserProfile;
};

const profileRowSchema = z.object({
  name: z.string(),
  polycard_balance: z.number(),
  calorie_goal: z.number().nullable(),
  protein_goal: z.number().nullable(),
  carb_goal: z.number().nullable(),
  fat_goal: z.number().nullable(),
  dietary_preferences: z.array(z.string()),
  allergens: z.array(z.string()),
  religious_restrictions: z.array(z.string()),
  severity: z.enum(['medical', 'strict', 'preference']),

  school: z.string().default('cal-poly-slo'),
  meal_plan: z.string().nullable().default(null),
  housing: z.string().nullable().default(null),
  default_locations: z.array(z.string()).default([]),
  show_low_confidence: z.boolean().default(true),
  require_manual_verification: z.boolean().default(true),
});

const PROFILE_COLUMNS = [
  'name',
  'polycard_balance',
  'calorie_goal',
  'protein_goal',
  'carb_goal',
  'fat_goal',
  'dietary_preferences',
  'allergens',
  'religious_restrictions',
  'severity',
  'school',
  'meal_plan',
  'housing',
  'default_locations',
  'show_low_confidence',
  'require_manual_verification',
].join(', ');

export const loadHydratedProfile = cache(async (): Promise<HydratedUserProfile | null> => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;

  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .eq('user_id', user.id)
    .maybeSingle();

  if (error || !data) return null;

  const parsed = profileRowSchema.safeParse(data);
  if (!parsed.success) return null;

  const profile: UserProfile = {
    restrictions: parsed.data.dietary_preferences,
    religious_dietary: parsed.data.religious_restrictions,
    allergens: parsed.data.allergens,
    severity: parsed.data.severity,
  };

  return {
    name: parsed.data.name,
    initial: parsed.data.name.slice(0, 1).toUpperCase() || '?',
    chips: deriveProfileChips(parsed.data),
    polycard_balance: parsed.data.polycard_balance,
    calorie_goal: parsed.data.calorie_goal,
    protein_goal: parsed.data.protein_goal,
    carb_goal: parsed.data.carb_goal,
    fat_goal: parsed.data.fat_goal,

    school: parsed.data.school,
    meal_plan: parsed.data.meal_plan,
    housing: parsed.data.housing,
    default_locations: parsed.data.default_locations,
    show_low_confidence: parsed.data.show_low_confidence,
    require_manual_verification: parsed.data.require_manual_verification,

    profile,
  };
});

function deriveProfileChips(row: z.infer<typeof profileRowSchema>): string[] {
  const chips: string[] = [];

  // Show dietary preferences first (most important identity)
  for (const pref of row.dietary_preferences) {
    chips.push(formatChipLabel(pref));
  }

  // Then religious dietary
  for (const rel of row.religious_restrictions) {
    chips.push(formatChipLabel(rel));
  }

  // Then allergens
  for (const allergen of row.allergens) {
    chips.push(formatChipLabel(allergen));
  }

  // Always show severity last
  chips.push(formatChipLabel(row.severity));

  return chips;
}

function formatChipLabel(value: string) {
  return value
    .split('-')
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(' ');
}
