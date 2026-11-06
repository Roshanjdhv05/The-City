-- THE CITY – migration 002: persistent city layout, admin role, building placement.
-- Extends the existing schema (001_init.sql / schema.sql). Safe to re-run.
-- AFTER running: make yourself an administrator (see bottom of file).

-- ───────────────────────── admins ─────────────────────────
create table if not exists public.admins (user_id uuid primary key references auth.users(id) on delete cascade);
alter table public.admins enable row level security;
drop policy if exists "admins can read themselves" on public.admins;
create policy "admins can read themselves" on public.admins for select using (user_id = auth.uid());

create or replace function public.is_admin() returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid())
$$;
grant execute on function public.is_admin() to anon, authenticated;

-- ───────────────────────── city layout ─────────────────────────
create table if not exists public.city_regions (
  id text primary key, name text not null, direction text not null,
  params jsonb not null default '{}'::jsonb, created_by uuid references auth.users(id), created_at timestamptz not null default now()
);
create table if not exists public.city_plots (
  id text primary key,
  region text references public.city_regions(id) on delete cascade,
  district text not null, category text not null,
  tier text not null check (tier in ('free','premium','featured','corner')),
  price integer not null check (price >= 0),
  x numeric not null, z numeric not null,
  w numeric not null check (w between 12 and 60), d numeric not null check (d between 12 and 60),
  rot numeric not null,
  status text not null default 'available' check (status in ('available','reserved')),
  landmark boolean not null default false,
  created_at timestamptz not null default now()
);
create table if not exists public.city_roads (
  id text primary key,
  region text references public.city_regions(id) on delete cascade,
  x0 numeric not null, z0 numeric not null, x1 numeric not null, z1 numeric not null,
  w numeric not null check (w between 4 and 24),
  check (x0 = x1 or z0 = z1)
);

alter table public.city_regions enable row level security;
alter table public.city_plots   enable row level security;
alter table public.city_roads   enable row level security;
-- Everyone may read the layout (needed to explore the world). Only admins may change it directly.
do $$ declare t text; begin
  foreach t in array array['city_regions','city_plots','city_roads'] loop
    execute format('drop policy if exists "%1$s public read" on public.%1$s', t);
    execute format('create policy "%1$s public read" on public.%1$s for select using (true)', t);
    execute format('drop policy if exists "%1$s admin write" on public.%1$s', t);
    execute format('create policy "%1$s admin write" on public.%1$s for all using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;

-- ───────────────────────── seed: original city + landmark ─────────────────────────
insert into public.city_plots (id,district,category,tier,price,x,z,w,d,rot,status,landmark) values
  ('P01', 'West Market', 'Fashion', 'premium', 299, -40, -12, 12, 12, 0, 'available', false),
  ('P02', 'West Market', 'Gaming', 'premium', 299, -26, -12, 12, 12, 0, 'available', false),
  ('P03', 'West Market', 'Café', 'corner', 799, -12, -12, 12, 12, 0, 'available', false),
  ('P04', 'East Market', 'Office', 'corner', 799, 12, -12, 12, 12, 0, 'available', false),
  ('P05', 'East Market', 'Books', 'featured', 499, 26, -12, 12, 12, 0, 'available', false),
  ('P06', 'East Market', 'Food', 'free', 0, 40, -12, 12, 12, 0, 'available', false),
  ('P07', 'West Market', 'Services', 'premium', 299, -40, 12, 12, 12, 3.1415926536, 'available', false),
  ('P08', 'West Market', 'Technology', 'premium', 299, -26, 12, 12, 12, 3.1415926536, 'available', false),
  ('P09', 'West Market', 'Fashion', 'corner', 799, -12, 12, 12, 12, 3.1415926536, 'available', false),
  ('P10', 'East Market', 'Gaming', 'corner', 799, 12, 12, 12, 12, 3.1415926536, 'available', false),
  ('P11', 'East Market', 'Café', 'premium', 299, 26, 12, 12, 12, 3.1415926536, 'available', false),
  ('P12', 'East Market', 'Office', 'free', 0, 40, 12, 12, 12, 3.1415926536, 'available', false),
  ('P13', 'North Row', 'Books', 'premium', 299, -12, -40, 12, 12, 1.5707963268, 'available', false),
  ('P14', 'North Row', 'Food', 'premium', 299, -12, -26, 12, 12, 1.5707963268, 'available', false),
  ('P15', 'South Row', 'Services', 'featured', 499, -12, 26, 12, 12, 1.5707963268, 'available', false),
  ('P16', 'South Row', 'Technology', 'premium', 299, -12, 40, 12, 12, 1.5707963268, 'available', false),
  ('P17', 'North Row', 'Fashion', 'premium', 299, 12, -40, 12, 12, -1.5707963268, 'available', false),
  ('P18', 'North Row', 'Gaming', 'free', 0, 12, -26, 12, 12, -1.5707963268, 'available', false),
  ('P19', 'South Row', 'Café', 'premium', 299, 12, 26, 12, 12, -1.5707963268, 'available', false),
  ('P20', 'South Row', 'Office', 'featured', 499, 12, 40, 12, 12, -1.5707963268, 'available', false),
  ('J01', 'Civic Plaza', 'Enterprise', 'featured', 0, 0, -106, 36, 26, 0, 'reserved', true)
on conflict (id) do nothing;

insert into public.city_roads (id,x0,z0,x1,z1,w) values
  ('R-MAIN', -64, 0, 64, 0, 10),
  ('R-CROSS', 0, -64, 0, 64, 10)
on conflict (id) do nothing;


-- ───────────────────────── stores: ownership, bounds, policies ─────────────────────────
alter table public.stores alter column owner_id drop not null;   -- platform-owned buildings have no owner
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'stores_plot_fk') then
    alter table public.stores add constraint stores_plot_fk foreign key (plot_id) references public.city_plots(id) on update cascade on delete cascade;
  end if;
end $$;

drop policy if exists "owners insert own store" on public.stores;
drop policy if exists "owners update own store" on public.stores;
drop policy if exists "owners delete own store" on public.stores;
drop policy if exists "stores insert" on public.stores;
drop policy if exists "stores update" on public.stores;
drop policy if exists "stores delete" on public.stores;
-- Owners may only claim plots that exist and are 'available' (not reserved); admins may do anything.
create policy "stores insert" on public.stores for insert with check (
  public.is_admin() or (auth.uid() = owner_id and exists (select 1 from public.city_plots p where p.id = plot_id and p.status = 'available')));
create policy "stores update" on public.stores for update
  using (public.is_admin() or auth.uid() = owner_id) with check (public.is_admin() or auth.uid() = owner_id);
create policy "stores delete" on public.stores for delete using (public.is_admin() or auth.uid() = owner_id);

-- Server-side guarantee: a building can never extend outside its plot (mirrors src/lib/plots.ts).
create or replace function public.stores_check_bounds() returns trigger language plpgsql as $$
declare pw numeric; pd numeric; tpl text; md text; fw numeric; fd numeric; r int; ox numeric; oz numeric; hw numeric; hd numeric; lim numeric;
begin
  select w, d into pw, pd from public.city_plots where id = new.plot_id;
  if pw is null then raise exception 'Unknown plot %', new.plot_id; end if;
  tpl := coalesce(new.config->>'template', 'tech'); md := coalesce(new.config->>'mode', 'template');
  if md = 'modular' then fw := 10; fd := 10; elsif tpl = 'jenterprise' then fw := 24; fd := 15; else fw := 10; fd := 8; end if;
  lim := greatest(0, pd/2 - fd/2);
  r  := coalesce((new.config #>> '{place,rot}')::int, 0);
  ox := coalesce((new.config #>> '{place,ox}')::numeric, 0);
  oz := coalesce((new.config #>> '{place,oz}')::numeric, greatest(-lim, least(lim, (pd - 12) / 2)));
  if r % 2 <> 0 then hw := fd/2; hd := fw/2; else hw := fw/2; hd := fd/2; end if;
  if abs(ox) + hw > pw/2 + 0.000001 or abs(oz) + hd > pd/2 + 0.000001 then
    raise exception 'Building (% x % m) does not fit inside plot % (% x % m)', fw, fd, new.plot_id, pw, pd;
  end if;
  return new;
end $$;
drop trigger if exists stores_bounds on public.stores;
create trigger stores_bounds before insert or update of config, plot_id on public.stores for each row execute function public.stores_check_bounds();

-- Built-in businesses (owner is null = platform-owned; admins can reassign them in /admin)
insert into public.stores (plot_id, owner_id, config, visits, clicks) values
  ('J01', null, '{"name":"J Enterprise","tagline":"Innovate · Build · Grow","website":"https://example.com","logoUrl":"","theme":"#3b82f6","template":"jenterprise","mode":"template","facade":"concrete","tint":"#d7dbe0","glass":"blue","windows":"grid","door":"glass","roof":"flat","awning":"none","sign":"panel","lights":true,"floors":4,"balcony":false,"planters":true,"trim":true,"modules":[],"place":{"ox":0,"oz":2.5,"rot":0}}'::jsonb, 0, 0),
  ('P01', null, '{"name":"Luna Boutique","tagline":"Curated everyday luxuries","website":"https://example.com","logoUrl":"","theme":"#6b8f71","template":"boutique","mode":"template","facade":"wood","tint":"#ffffff","glass":"clear","windows":"grid","door":"wood","roof":"sloped","awning":"solid","sign":"box","lights":true,"floors":2,"balcony":true,"planters":true,"trim":true,"modules":[]}'::jsonb, 0, 0),
  ('P02', null, '{"name":"Pixel Arcade","tagline":"Games, gear and good company","website":"https://example.com","logoUrl":"","theme":"#7c4dff","template":"gaming","mode":"template","facade":"metal","tint":"#4a4f57","glass":"tinted","windows":"ribbon","door":"steel","roof":"flat","awning":"none","sign":"neon","lights":true,"floors":2,"balcony":false,"planters":true,"trim":true,"modules":[]}'::jsonb, 0, 0),
  ('P03', null, '{"name":"Urban Threads","tagline":"Streetwear, tailored","website":"https://example.com","logoUrl":"","theme":"#c14d9b","template":"fashion","mode":"template","facade":"stone","tint":"#e8dcc8","glass":"clear","windows":"tall","door":"wood","roof":"cornice","awning":"solid","sign":"blade","lights":true,"floors":2,"balcony":true,"planters":true,"trim":true,"modules":[]}'::jsonb, 0, 0),
  ('P04', null, '{"name":"Tech Store","tagline":"Technology","website":"https://example.com","logoUrl":"","theme":"#3b82f6","template":"tech","mode":"template","facade":"concrete","tint":"#d7dbe0","glass":"clear","windows":"grid","door":"glass","roof":"flat","awning":"none","sign":"panel","lights":true,"floors":2,"balcony":false,"planters":true,"trim":true,"modules":[]}'::jsonb, 0, 0),
  ('P05', null, '{"name":"Brew & Co Café","tagline":"Slow coffee, fast Wi-Fi","website":"https://example.com","logoUrl":"","theme":"#fb923c","template":"cafe","mode":"template","facade":"brick","tint":"#ffffff","glass":"clear","windows":"grid","door":"wood","roof":"gabled","awning":"striped","sign":"box","lights":true,"floors":1,"balcony":false,"planters":true,"trim":true,"modules":[]}'::jsonb, 0, 0),
  ('P06', null, '{"name":"Meridian Offices","tagline":"Workspace for growing teams","website":"https://example.com","logoUrl":"","theme":"#22d3ee","template":"office","mode":"template","facade":"concrete","tint":"#c9d3dc","glass":"blue","windows":"ribbon","door":"glass","roof":"cornice","awning":"canopy","sign":"panel","lights":true,"floors":3,"balcony":false,"planters":true,"trim":true,"modules":[]}'::jsonb, 0, 0),
  ('P09', null, '{"name":"Corner Bean","tagline":"Roasted in the district","website":"https://example.com","logoUrl":"","theme":"#fb923c","template":"cafe","mode":"template","facade":"brick","tint":"#ffffff","glass":"clear","windows":"grid","door":"wood","roof":"gabled","awning":"striped","sign":"box","lights":true,"floors":1,"balcony":false,"planters":true,"trim":true,"modules":[]}'::jsonb, 0, 0),
  ('P10', null, '{"name":"Nova Electronics","tagline":"Phones, audio, smart home","website":"https://example.com","logoUrl":"","theme":"#3b82f6","template":"tech","mode":"template","facade":"concrete","tint":"#d7dbe0","glass":"clear","windows":"grid","door":"glass","roof":"flat","awning":"none","sign":"panel","lights":true,"floors":2,"balcony":false,"planters":true,"trim":true,"modules":[]}'::jsonb, 0, 0),
  ('P11', null, '{"name":"Studio Nine","tagline":"Design & architecture","website":"https://example.com","logoUrl":"","theme":"#22d3ee","template":"office","mode":"template","facade":"concrete","tint":"#c9d3dc","glass":"blue","windows":"ribbon","door":"glass","roof":"cornice","awning":"canopy","sign":"panel","lights":true,"floors":3,"balcony":false,"planters":true,"trim":true,"modules":[]}'::jsonb, 0, 0)
on conflict (plot_id) do nothing;

-- ───────────────────────── admin functions (SECURITY DEFINER, admin-checked) ─────────────────────────
create or replace function public.plot_hx(w numeric, d numeric, rot numeric) returns numeric language sql immutable as
  $$ select case when abs(sin(rot)) > 0.5 then d / 2 else w / 2 end $$;
create or replace function public.plot_hz(w numeric, d numeric, rot numeric) returns numeric language sql immutable as
  $$ select case when abs(sin(rot)) > 0.5 then w / 2 else d / 2 end $$;

-- Atomically adds a region with its plots and roads. Rejects duplicate IDs and overlapping plots/roads.
create or replace function public.admin_expand_city(p_region jsonb, p_plots jsonb, p_roads jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare p jsonb; rd jsonb; nx numeric; nz numeric; nw numeric; nd numeric; nr numeric; hit text; rx0 numeric; rx1 numeric; rz0 numeric; rz1 numeric;
begin
  if not public.is_admin() then raise exception 'Not authorized' using errcode = '42501'; end if;
  if jsonb_array_length(p_plots) > 500 or jsonb_array_length(p_roads) > 100 then raise exception 'Expansion too large'; end if;
  insert into public.city_regions (id, name, direction, params, created_by)
    values (p_region->>'id', p_region->>'name', p_region->>'direction', coalesce(p_region->'params', '{}'::jsonb), auth.uid());
  for p in select * from jsonb_array_elements(p_plots) loop
    nx := (p->>'x')::numeric; nz := (p->>'z')::numeric; nw := (p->>'w')::numeric; nd := (p->>'d')::numeric; nr := (p->>'rot')::numeric;
    select c.id into hit from public.city_plots c
      where abs(c.x - nx) < public.plot_hx(c.w, c.d, c.rot) + public.plot_hx(nw, nd, nr) + 0.5
        and abs(c.z - nz) < public.plot_hz(c.w, c.d, c.rot) + public.plot_hz(nw, nd, nr) + 0.5 limit 1;
    if hit is not null then raise exception 'Plot % overlaps existing plot %', p->>'id', hit; end if;
    insert into public.city_plots (id, region, district, category, tier, price, x, z, w, d, rot, status)
      values (p->>'id', p_region->>'id', p->>'district', p->>'category', p->>'tier', (p->>'price')::int, nx, nz, nw, nd, nr, 'available');
  end loop;
  for rd in select * from jsonb_array_elements(p_roads) loop
    if (rd->>'x0')::numeric = (rd->>'x1')::numeric then
      rx0 := (rd->>'x0')::numeric - (rd->>'w')::numeric / 2; rx1 := (rd->>'x0')::numeric + (rd->>'w')::numeric / 2;
      rz0 := least((rd->>'z0')::numeric, (rd->>'z1')::numeric); rz1 := greatest((rd->>'z0')::numeric, (rd->>'z1')::numeric);
    else
      rz0 := (rd->>'z0')::numeric - (rd->>'w')::numeric / 2; rz1 := (rd->>'z0')::numeric + (rd->>'w')::numeric / 2;
      rx0 := least((rd->>'x0')::numeric, (rd->>'x1')::numeric); rx1 := greatest((rd->>'x0')::numeric, (rd->>'x1')::numeric);
    end if;
    select c.id into hit from public.city_plots c
      where c.x - public.plot_hx(c.w, c.d, c.rot) < rx1 and c.x + public.plot_hx(c.w, c.d, c.rot) > rx0
        and c.z - public.plot_hz(c.w, c.d, c.rot) < rz1 and c.z + public.plot_hz(c.w, c.d, c.rot) > rz0 limit 1;
    if hit is not null then raise exception 'Road % overlaps plot %', rd->>'id', hit; end if;
    insert into public.city_roads (id, region, x0, z0, x1, z1, w)
      values (rd->>'id', p_region->>'id', (rd->>'x0')::numeric, (rd->>'z0')::numeric, (rd->>'x1')::numeric, (rd->>'z1')::numeric, (rd->>'w')::numeric);
  end loop;
end $$;
revoke all on function public.admin_expand_city(jsonb, jsonb, jsonb) from public;
grant execute on function public.admin_expand_city(jsonb, jsonb, jsonb) to authenticated;

create or replace function public.admin_move_store(p_from text, p_to text, p_config jsonb) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Not authorized' using errcode = '42501'; end if;
  if not exists (select 1 from public.city_plots where id = p_to) then raise exception 'Unknown target plot %', p_to; end if;
  if exists (select 1 from public.stores where plot_id = p_to) then raise exception 'Target plot % already has a building', p_to; end if;
  update public.stores set plot_id = p_to, config = p_config, updated_at = now() where plot_id = p_from;
  if not found then raise exception 'No building on plot %', p_from; end if;
end $$;
revoke all on function public.admin_move_store(text, text, jsonb) from public;
grant execute on function public.admin_move_store(text, text, jsonb) to authenticated;

create or replace function public.admin_find_user(p_email text) returns uuid
language plpgsql security definer set search_path = public as $$
declare uid uuid;
begin
  if not public.is_admin() then raise exception 'Not authorized' using errcode = '42501'; end if;
  select id into uid from auth.users where lower(email) = lower(p_email); return uid;
end $$;
create or replace function public.admin_lookup_users(p_ids uuid[]) returns table (id uuid, email text)
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Not authorized' using errcode = '42501'; end if;
  return query select u.id, u.email::text from auth.users u where u.id = any (p_ids);
end $$;
revoke all on function public.admin_find_user(text) from public;
revoke all on function public.admin_lookup_users(uuid[]) from public;
grant execute on function public.admin_find_user(text) to authenticated;
grant execute on function public.admin_lookup_users(uuid[]) to authenticated;

-- ───────────────────────── FIRST ADMIN ─────────────────────────
-- Sign up in the app first, then run this once in the SQL editor (replace the email):
--   insert into public.admins (user_id) select id from auth.users where email = 'you@example.com';
