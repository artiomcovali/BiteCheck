export const DIETARY_PREFERENCE_OPTIONS = [
  { value: 'vegan', label: 'Vegan' },
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'pescatarian', label: 'Pescatarian' },
  { value: 'gluten-free', label: 'Gluten-free' },
  { value: 'dairy-free', label: 'Dairy-free' },
] as const;

export const ALLERGEN_OPTIONS = [
  { value: 'nut-allergy', label: 'Nut allergy' },
  { value: 'peanut-allergy', label: 'Peanut allergy' },
  { value: 'shellfish-allergy', label: 'Shellfish allergy' },
  { value: 'soy-allergy', label: 'Soy allergy' },
  { value: 'egg-allergy', label: 'Egg allergy' },
  { value: 'sesame-allergy', label: 'Sesame allergy' },
] as const;

export const RELIGIOUS_RESTRICTION_OPTIONS = [
  { value: 'halal', label: 'Halal' },
  { value: 'kosher', label: 'Kosher' },
  { value: 'hindu-vegetarian', label: 'Hindu vegetarian' },
  { value: 'jain-vegetarian', label: 'Jain vegetarian' },
] as const;

export const SEVERITY_OPTIONS = [
  {
    value: 'medical',
    label: 'Medical',
    description: 'Asterisk-marked cross-contact is treated as unsafe.',
  },
  {
    value: 'strict',
    label: 'Strict',
    description: 'Asterisk-marked cross-contact is flagged for caution.',
  },
  {
    value: 'preference',
    label: 'Preference',
    description: 'Cross-contact notes are shown, but not elevated as warnings.',
  },
] as const;

export type DietaryPreferenceValue = (typeof DIETARY_PREFERENCE_OPTIONS)[number]['value'];
export type AllergenValue = (typeof ALLERGEN_OPTIONS)[number]['value'];
export type ReligiousRestrictionValue = (typeof RELIGIOUS_RESTRICTION_OPTIONS)[number]['value'];
export type SeverityValue = (typeof SEVERITY_OPTIONS)[number]['value'];

export const PROFILE_SECTIONS = {
  campusLabel: 'Cal Poly San Luis Obispo',
  defaultDiningLocations: ['1901 Marketplace', 'Vista Grande', 'Red Radish'],
} as const;

export const MEAL_PLAN_OPTIONS = [
  // First-Year Plans
  { value: 'first-year-max', label: 'First-Year Max — $7,418 Dining Dollars' },
  { value: 'first-year-plus', label: 'First-Year Plus — $6,590 Dining Dollars' },
  { value: 'first-year-limited', label: 'First-Year Limited — $5,816 Dining Dollars' },
  // Community Dining Plans
  { value: 'poly-5500', label: 'Poly 5500 — $6,500 Dining Dollars' },
  { value: 'poly-2350', label: 'Poly 2350 — $2,750 Dining Dollars' },
  { value: 'poly-1600', label: 'Poly 1600 — $1,850 Dining Dollars' },
  { value: 'poly-1100', label: 'Poly 1100 — $1,250 Dining Dollars' },
  { value: 'poly-550', label: 'Poly 550 — $600 Dining Dollars' },
  { value: 'poly-275', label: 'Poly 275 — $300 Dining Dollars' },
  // Faculty / Staff
  { value: 'mustang-gold', label: 'Mustang Gold — $400 Dining Dollars' },
  { value: 'poly-green', label: 'Poly Green — $200 Dining Dollars' },
  // None
  { value: 'none', label: 'No Meal Plan' },
] as const;

export type MealPlanValue = (typeof MEAL_PLAN_OPTIONS)[number]['value'];

/**
 * Per-semester PolyCard / dining-dollar allowance for each plan, in USD.
 * Used by the dashboard to render a "money left" progress bar against
 * `polycard_balance`. First-year plans are doubled (2 semesters).
 * Numbers are aligned with Cal Poly's published meal-plan values.
 */
export const MEAL_PLAN_SEMESTER_BUDGET: Record<MealPlanValue, number> = {
  // First-Year Plans (per semester × 2)
  'first-year-max': 7418,
  'first-year-plus': 6590,
  'first-year-limited': 5816,
  // Community Dining Plans (total dining dollars)
  'poly-5500': 6500,
  'poly-2350': 2750,
  'poly-1600': 1850,
  'poly-1100': 1250,
  'poly-550': 600,
  'poly-275': 300,
  // Faculty / Staff
  'mustang-gold': 400,
  'poly-green': 200,
  // None
  none: 0,
};

export const SCHOOL_OPTIONS = [{ value: 'cal-poly-slo', label: 'Cal Poly SLO' }] as const;

export type SchoolValue = (typeof SCHOOL_OPTIONS)[number]['value'];
export type HousingValue = (typeof HOUSING_OPTIONS)[number]['value'];

export const HOUSING_OPTIONS = [
  { value: 'yakitutyu', label: 'yakʔitʸutʸu' },
  { value: 'cerro-vista', label: 'Cerro Vista' },
  { value: 'poly-canyon-village', label: 'Poly Canyon Village' },
  { value: 'sierra-madre', label: 'Sierra Madre' },
  { value: 'yosemite', label: 'Yosemite' },
  { value: 'santa-lucia', label: 'Santa Lucia' },
  { value: 'muir', label: 'Muir' },
  { value: 'sequoia', label: 'Sequoia' },
  { value: 'fremont', label: 'Fremont' },
  { value: 'tenaya', label: 'Tenaya' },
  { value: 'trinity', label: 'Trinity' },
  { value: 'lassen', label: 'Lassen' },
  { value: 'diablo', label: 'Diablo' },
  { value: 'palomar', label: 'Palomar' },
  { value: 'whitney', label: 'Whitney' },
  { value: 'off-campus', label: 'Off Campus' },
] as const;
