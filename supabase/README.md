# Supabase migrations

Apply the SQL in [migrations/20260502143000_profiles.sql](/Users/artiom/School/BiteCheck/BiteCheck/supabase/migrations/20260502143000_profiles.sql) to the same Supabase project used by `.env.local`.

Use one of these paths:

1. Supabase CLI: run `supabase db push` from the repo root after linking the project.
2. Supabase SQL editor: open the migration file, paste its contents into the SQL editor, and run it.

After the migration is applied, the Step 2 onboarding flow can insert into `public.profiles` and middleware will start enforcing the profile-aware redirects.
