alter table public.menu_items
  add column if not exists date date,
  add column if not exists day_of_week text,
  add column if not exists location text,
  add column if not exists building text,
  add column if not exists meal_period text,
  add column if not exists station text,
  add column if not exists item_name text,
  add column if not exists item_id text,
  add column if not exists portion text,
  add column if not exists description text default '',
  add column if not exists added_sugar_g numeric,
  add column if not exists calcium_mg numeric,
  add column if not exists calories numeric,
  add column if not exists calories_from_fat numeric,
  add column if not exists cholesterol_mg numeric,
  add column if not exists fiber_g numeric,
  add column if not exists iron_mg numeric,
  add column if not exists potassium_mg numeric,
  add column if not exists protein_g numeric,
  add column if not exists sat_fat_g numeric,
  add column if not exists sodium_mg numeric,
  add column if not exists sugar_g numeric,
  add column if not exists total_carbs_g numeric,
  add column if not exists total_fat_g numeric,
  add column if not exists trans_fat_g numeric,
  add column if not exists vitamin_c_mg numeric,
  add column if not exists vitamin_d_mcg numeric,
  add column if not exists ingredients text default '',
  add column if not exists allergens text default '',
  add column if not exists dietary_labels text default '',
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

update public.menu_items
set
  description = coalesce(description, ''),
  ingredients = coalesce(ingredients, ''),
  allergens = coalesce(allergens, ''),
  dietary_labels = coalesce(dietary_labels, ''),
  portion = coalesce(portion, '—');

alter table public.menu_items
  alter column description set default '',
  alter column ingredients set default '',
  alter column allergens set default '',
  alter column dietary_labels set default '',
  alter column portion set default '—',
  alter column created_at set default now(),
  alter column updated_at set default now();

alter table public.menu_items enable row level security;

drop trigger if exists menu_items_set_updated_at on public.menu_items;
create trigger menu_items_set_updated_at
before update on public.menu_items
for each row
execute function public.set_updated_at();

drop policy if exists "menu_items public read" on public.menu_items;
create policy "menu_items public read"
on public.menu_items
for select
using (true);

create unique index if not exists menu_items_date_item_location_meal_station_idx
  on public.menu_items (date, item_id, location, meal_period, station);

create index if not exists menu_items_date_location_idx
  on public.menu_items (date, location);

create index if not exists menu_items_date_building_idx
  on public.menu_items (date, building);

create index if not exists menu_items_item_name_idx
  on public.menu_items (item_name);
