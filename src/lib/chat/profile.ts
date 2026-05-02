/**
 * User profile loading.
 *
 * This module is the seam between the chat UI and Supabase. The current repo
 * has Supabase clients wired up but no `profiles` table is provisioned, so we
 * keep a small set of demo personas here and let the UI persona-switch
 * between them. When a real `profiles` table lands, replace
 * {@link loadActiveProfile} with a Supabase query — the chat UI stays
 * unchanged.
 *
 * @see src/lib/db/client.ts
 */
import type { UserProfile } from "@/lib/types";

export type Persona = {
  id: "maya" | "jordan" | "amira";
  name: string;
  initial: string;
  chips: string[];
  profile: UserProfile;
};

export const PERSONAS: Persona[] = [
  {
    id: "maya",
    name: "Maya",
    initial: "M",
    chips: ["Vegan", "Tree Nuts", "Strict"],
    profile: {
      restrictions: ["vegan"],
      religious_dietary: [],
      allergens: ["nut-allergy"],
      severity: "strict",
    },
  },
  {
    id: "jordan",
    name: "Jordan",
    initial: "J",
    chips: ["Gluten-Free", "Celiac", "Medical"],
    profile: {
      restrictions: ["gluten-free"],
      religious_dietary: [],
      allergens: [],
      severity: "medical",
    },
  },
  {
    id: "amira",
    name: "Amira",
    initial: "A",
    chips: ["Halal", "Shellfish", "Strict"],
    profile: {
      restrictions: [],
      religious_dietary: ["halal"],
      allergens: ["shellfish-allergy"],
      severity: "strict",
    },
  },
];

export const DEFAULT_PERSONA = PERSONAS[0];
