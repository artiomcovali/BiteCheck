create table if not exists public.menu_items (
  date date not null,
  day_of_week text not null,
  location text not null,
  building text not null,
  meal_period text not null,
  station text not null,
  item_name text not null,
  item_id text not null,
  portion text not null,
  description text not null,
  added_sugar_g numeric,
  calcium_mg numeric,
  calories numeric,
  calories_from_fat numeric,
  cholesterol_mg numeric,
  fiber_g numeric,
  iron_mg numeric,
  potassium_mg numeric,
  protein_g numeric,
  sat_fat_g numeric,
  sodium_mg numeric,
  sugar_g numeric,
  total_carbs_g numeric,
  total_fat_g numeric,
  trans_fat_g numeric,
  vitamin_c_mg numeric,
  vitamin_d_mcg numeric,
  ingredients text not null default '',
  allergens text not null default '',
  dietary_labels text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint menu_items_date_item_location_meal_station_key unique (
    date,
    item_id,
    location,
    meal_period,
    station
  )
);

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

create index if not exists menu_items_date_location_idx
  on public.menu_items (date, location);

create index if not exists menu_items_date_building_idx
  on public.menu_items (date, building);

create index if not exists menu_items_item_name_idx
  on public.menu_items (item_name);
