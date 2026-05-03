-- Add the settings the profile editor / onboarding now collect.
-- All columns are nullable or default-valued so existing rows don't break.

alter table public.profiles
  add column if not exists school text not null default 'cal-poly-slo',
  add column if not exists meal_plan text,
  add column if not exists housing text,
  add column if not exists default_locations text[] not null default '{}',
  add column if not exists show_low_confidence boolean not null default true,
  add column if not exists require_manual_verification boolean not null default true;

-- meal_plan / housing values are validated in the application layer (Zod
-- against the OPTION constants in src/lib/profile/options.ts). We don't
-- pin them with a check constraint so adding new options later doesn't
-- require a schema change.
