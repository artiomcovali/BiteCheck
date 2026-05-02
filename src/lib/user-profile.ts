import { z } from "zod";
import { supabaseServer } from "@/lib/supabaseServer";
import type { UserProfile } from "@/lib/types";

export type HydratedUserProfile = {
  name: string;
  initial: string;
  chips: string[];
  polycard_balance: number;
  calorie_goal: number | null;
  protein_goal: number | null;
  carb_goal: number | null;
  fat_goal: number | null;
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
  severity: z.enum(["medical", "strict", "preference"]),
});

export async function loadHydratedProfile(): Promise<HydratedUserProfile | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;

  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select(
      [
        "name",
        "polycard_balance",
        "calorie_goal",
        "protein_goal",
        "carb_goal",
        "fat_goal",
        "dietary_preferences",
        "allergens",
        "religious_restrictions",
        "severity",
      ].join(", "),
    )
    .eq("user_id", user.id)
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
    initial: parsed.data.name.slice(0, 1).toUpperCase() || "?",
    chips: deriveProfileChips(parsed.data),
    polycard_balance: parsed.data.polycard_balance,
    calorie_goal: parsed.data.calorie_goal,
    protein_goal: parsed.data.protein_goal,
    carb_goal: parsed.data.carb_goal,
    fat_goal: parsed.data.fat_goal,
    profile,
  };
}

function deriveProfileChips(
  row: z.infer<typeof profileRowSchema>,
): string[] {
  return [...row.dietary_preferences, ...row.allergens, row.severity]
    .slice(0, 3)
    .map(formatChipLabel);
}

function formatChipLabel(value: string) {
  return value
    .split("-")
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(" ");
}
