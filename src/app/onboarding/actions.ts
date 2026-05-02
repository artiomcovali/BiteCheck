"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabaseServer";

export type OnboardingFormState = { error: string } | null;

const dietaryPreferenceSchema = z.enum([
  "vegan",
  "vegetarian",
  "pescatarian",
  "gluten-free",
  "dairy-free",
]);

const allergenSchema = z.enum([
  "nut-allergy",
  "peanut-allergy",
  "shellfish-allergy",
  "soy-allergy",
  "egg-allergy",
  "sesame-allergy",
]);

const religiousRestrictionSchema = z.enum([
  "halal",
  "kosher",
  "hindu-vegetarian",
  "jain-vegetarian",
]);

const severitySchema = z.enum(["medical", "strict", "preference"]);

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
