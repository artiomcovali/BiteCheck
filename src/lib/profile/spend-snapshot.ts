/**
 * Real PolyCard spend snapshot. Replaces the previous fixture module.
 *
 * Inputs: the user's current `polycard_balance` and the meal plan they
 * selected during onboarding (or in profile settings). Output: numbers
 * the dashboard renders directly — current balance, total semester
 * budget for their plan, percentage remaining, and a status bucket that
 * drives the progress-bar color.
 *
 * If the user hasn't picked a meal plan or chose "none", we report
 * `hasPlan: false` and the dashboard hides the progress bar (instead of
 * pretending a budget exists).
 */

import { MEAL_PLAN_OPTIONS, MEAL_PLAN_SEMESTER_BUDGET, type MealPlanValue } from './options';

export type SpendStatus = 'healthy' | 'low' | 'depleted' | 'no-plan';

export type SpendSnapshot = {
  balance: number;
  /** 0 when the user has no plan or picked "none". */
  budget: number;
  /** balance / budget * 100, clamped 0–100. 0 when no plan. */
  percentRemaining: number;
  hasPlan: boolean;
  /** Friendly label like "14 Meals / Week" or "No meal plan". */
  planLabel: string;
  status: SpendStatus;
};

const PLAN_LABEL = new Map<string, string>(
  MEAL_PLAN_OPTIONS.map((option) => [option.value, option.label]),
);

export function buildSpendSnapshot(balance: number, mealPlan: string | null): SpendSnapshot {
  const safeBalance = Number.isFinite(balance) && balance > 0 ? balance : 0;

  if (!mealPlan || mealPlan === 'none') {
    return {
      balance: safeBalance,
      budget: 0,
      percentRemaining: 0,
      hasPlan: false,
      planLabel: PLAN_LABEL.get(mealPlan ?? '') ?? 'No meal plan',
      status: 'no-plan',
    };
  }

  const budget = MEAL_PLAN_SEMESTER_BUDGET[mealPlan as MealPlanValue] ?? 0;
  if (budget <= 0) {
    return {
      balance: safeBalance,
      budget: 0,
      percentRemaining: 0,
      hasPlan: false,
      planLabel: PLAN_LABEL.get(mealPlan) ?? 'Meal plan',
      status: 'no-plan',
    };
  }

  const ratio = safeBalance / budget;
  const percent = Math.max(0, Math.min(100, ratio * 100));
  const status: SpendStatus = percent <= 0 ? 'depleted' : percent < 25 ? 'low' : 'healthy';

  return {
    balance: safeBalance,
    budget,
    percentRemaining: percent,
    hasPlan: true,
    planLabel: PLAN_LABEL.get(mealPlan) ?? 'Meal plan',
    status,
  };
}
