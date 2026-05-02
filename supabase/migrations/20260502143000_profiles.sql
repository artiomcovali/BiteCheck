create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  name text not null,
  polycard_balance numeric not null default 0,
  calorie_goal int,
  protein_goal int,
  carb_goal int,
  fat_goal int,
  dietary_preferences text[] not null default '{}',
  allergens text[] not null default '{}',
  religious_restrictions text[] not null default '{}',
  severity text not null check (severity in ('medical', 'strict', 'preference')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

drop policy if exists "read own" on public.profiles;
create policy "read own"
on public.profiles
for select
using (auth.uid() = user_id);

drop policy if exists "insert own" on public.profiles;
create policy "insert own"
on public.profiles
for insert
with check (auth.uid() = user_id);

drop policy if exists "update own" on public.profiles;
create policy "update own"
on public.profiles
for update
using (auth.uid() = user_id);

comment on table public.profiles is
  'Explicit onboarding-backed student dietary profiles. We intentionally do not auto-create rows on auth.users signup.';
