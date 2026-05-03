"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import {
  ALLERGEN_OPTIONS,
  DIETARY_PREFERENCE_OPTIONS,
  HOUSING_OPTIONS,
  MEAL_PLAN_OPTIONS,
  RELIGIOUS_RESTRICTION_OPTIONS,
  SCHOOL_OPTIONS,
  SEVERITY_OPTIONS,
} from "@/lib/profile/options";
import { supabaseServer } from "@/lib/supabaseServer";

export type OnboardingFormState = { error: string } | null;

const dietaryPreferenceSchema = z.enum(
  DIETARY_PREFERENCE_OPTIONS.map((option) => option.value) as [
    string,
    ...string[],
  ],
);

const allergenSchema = z.enum(
  ALLERGEN_OPTIONS.map((option) => option.value) as [string, ...string[]],
);

const religiousRestrictionSchema = z.enum(
  RELIGIOUS_RESTRICTION_OPTIONS.map((option) => option.value) as [
    string,
    ...string[],
  ],
);

const severitySchema = z.enum(
  SEVERITY_OPTIONS.map((option) => option.value) as [string, ...string[]],
);

const schoolSchema = z.enum(
  SCHOOL_OPTIONS.map((option) => option.value) as [string, ...string[]],
);

const mealPlanSchema = z.enum(
  MEAL_PLAN_OPTIONS.map((option) => option.value) as [string, ...string[]],
);

const housingSchema = z.enum(
  HOUSING_OPTIONS.map((option) => option.value) as [string, ...string[]],
);

const requiredNumber = z.preprocess(
  (value) => {
    if (typeof value !== "string") return value;
    const trimmed = value.trim();
    return trimmed === "" ? Number.NaN : Number(trimmed);
  },
  z.number().min(0, "Must be 0 or greater"),
);

const optionalNumber = z.preprocess(
  (value) => {
    if (typeof value !== "string") return value;
    const trimmed = value.trim();
    return trimmed === "" ? null : Number(trimmed);
  },
  z.number().int("Use a whole number").min(0, "Must be 0 or greater").nullable(),
);

const checkboxBool = z.preprocess(
  (value) => value === "on" || value === "true" || value === true,
  z.boolean(),
);

const optionalEnum = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((value) => {
    if (typeof value !== "string") return value;
    const trimmed = value.trim();
    return trimmed === "" ? null : trimmed;
  }, schema.nullable());

const onboardingSchema = z.object({
  name: z.string().trim().min(1, "Enter your name"),
  polycard_balance: requiredNumber,
  calorie_goal: optionalNumber,
  protein_goal: optionalNumber,
  carb_goal: optionalNumber,
  fat_goal: optionalNumber,
  dietary_preferences: z.array(dietaryPreferenceSchema),
  allergens: z.array(allergenSchema),
  religious_restrictions: z.array(religiousRestrictionSchema),
  severity: severitySchema,

  school: schoolSchema.default("cal-poly-slo"),
  meal_plan: optionalEnum(mealPlanSchema),
  housing: optionalEnum(housingSchema),
  default_locations: z.array(z.string()),
  show_low_confidence: checkboxBool,
  require_manual_verification: checkboxBool,
});

export async function submitOnboardingAction(
  _prev: OnboardingFormState,
  formData: FormData,
): Promise<OnboardingFormState> {
  const parsed = onboardingSchema.safeParse({
    name: formData.get("name"),
    polycard_balance: formData.get("polycard_balance"),
    calorie_goal: formData.get("calorie_goal"),
    protein_goal: formData.get("protein_goal"),
    carb_goal: formData.get("carb_goal"),
    fat_goal: formData.get("fat_goal"),
    dietary_preferences: formData.getAll("dietary_preferences"),
    allergens: formData.getAll("allergens"),
    religious_restrictions: formData.getAll("religious_restrictions"),
    severity: formData.get("severity"),

    school: formData.get("school") ?? "cal-poly-slo",
    meal_plan: formData.get("meal_plan"),
    housing: formData.get("housing"),
    default_locations: formData.getAll("default_locations"),
    show_low_confidence: formData.get("show_low_confidence"),
    require_manual_verification: formData.get("require_manual_verification"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await supabaseServer();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Sign in again to finish onboarding." };
  }

  const { error } = await supabase.from("profiles").insert({
    user_id: user.id,
    ...parsed.data,
  });

  if (error?.code === "23505") {
    redirect("/dashboard");
  }

  if (error) {
    return { error: error.message };
  }

  redirect("/dashboard");
}
