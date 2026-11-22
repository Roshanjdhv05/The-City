-- THE CITY – Supabase schema. Run in the Supabase SQL editor.
create table if not exists public.stores (
  plot_id     text primary key,
  owner_id    uuid not null references auth.users(id) on delete cascade,
  config      jsonb not null,
  visits      integer not null default 0,
  clicks      integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
-- Enforce 1 building claimed per owner email
create unique index if not exists stores_one_per_owner_idx on public.stores(owner_id);
alter table public.stores enable row level security;

create policy "stores are public to read" on public.stores for select using (true);
create policy "owners insert own store"   on public.stores for insert with check (auth.uid() = owner_id);
create policy "owners update own store"   on public.stores for update using (auth.uid() = owner_id);
create policy "owners delete own store"   on public.stores for delete using (auth.uid() = owner_id);

-- Anyone may bump analytics counters, but only through this function.
create or replace function public.track_store_event(p_plot text, p_kind text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_kind = 'visit' then update public.stores set visits = visits + 1 where plot_id = p_plot;
  elsif p_kind = 'click' then update public.stores set clicks = clicks + 1 where plot_id = p_plot;
  end if;
end $$;
grant execute on function public.track_store_event(text, text) to anon, authenticated;

-- Logo / banner uploads
insert into storage.buckets (id, name, public) values ('logos', 'logos', true) on conflict do nothing;
create policy "logos are public" on storage.objects for select using (bucket_id = 'logos');
create policy "users upload own logos" on storage.objects for insert to authenticated
  with check (bucket_id = 'logos' and (storage.foldername(name))[1] = auth.uid()::text);

-- ─────────────────────────────────────────────────────────────────────────────
-- Billboards System (Migration 009)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.billboards (
  id              text PRIMARY KEY,
  name            text NOT NULL,
  market          text NOT NULL,
  location        text NOT NULL DEFAULT '',
  plot_id         text REFERENCES public.city_plots(id) ON DELETE SET NULL,
  wall_side       text NOT NULL DEFAULT 'back_wall'
                  CHECK (wall_side IN ('back_wall','side_wall_left','side_wall_right','corner','freestanding')),
  format          text NOT NULL DEFAULT 'landscape'
                  CHECK (format IN ('landscape','portrait')),
  size            text NOT NULL DEFAULT 'large'
                  CHECK (size IN ('monument','large','medium','portrait')),
  width           numeric(6,2)  NOT NULL DEFAULT 7.5,
  height          numeric(6,2)  NOT NULL DEFAULT 4.2,
  elevation       numeric(6,2)  NOT NULL DEFAULT 5.5,
  x               numeric(10,4) NOT NULL DEFAULT 0,
  y               numeric(10,4) NOT NULL DEFAULT 5.5,
  z               numeric(10,4) NOT NULL DEFAULT 0,
  rot             numeric(10,6) NOT NULL DEFAULT 0,
  status          text NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active','inactive','empty')),
  ad_title        text NOT NULL DEFAULT '',
  ad_description  text,
  media_type      text NOT NULL DEFAULT 'image'
                  CHECK (media_type IN ('image','video')),
  media_url       text NOT NULL DEFAULT '',
  target_url      text,
  lighting        boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.billboards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "billboards_public_read" ON public.billboards FOR SELECT USING (true);
CREATE POLICY "billboards_admin_insert" ON public.billboards FOR INSERT WITH CHECK (true);
CREATE POLICY "billboards_admin_update" ON public.billboards FOR UPDATE USING (true);
CREATE POLICY "billboards_admin_delete" ON public.billboards FOR DELETE USING (true);

CREATE OR REPLACE FUNCTION public.update_billboard_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS billboards_updated_at ON public.billboards;
CREATE TRIGGER billboards_updated_at
  BEFORE UPDATE ON public.billboards
  FOR EACH ROW EXECUTE FUNCTION public.update_billboard_timestamp();

CREATE INDEX IF NOT EXISTS billboards_market_idx ON public.billboards(market);
CREATE INDEX IF NOT EXISTS billboards_status_idx ON public.billboards(status);

INSERT INTO storage.buckets (id, name, public)
VALUES ('billboard_media', 'billboard_media', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "billboard_media_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'billboard_media');
CREATE POLICY "billboard_media_admin_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'billboard_media');
CREATE POLICY "billboard_media_admin_update" ON storage.objects FOR UPDATE USING (bucket_id = 'billboard_media');
CREATE POLICY "billboard_media_admin_delete" ON storage.objects FOR DELETE USING (bucket_id = 'billboard_media');

-- ─────────────────────────────────────────────────────────────────────────────
-- User Exploration, Inventory, Saved Plots Sync (Migration 010)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_exploration (
  user_id uuid primary key references auth.users(id) on delete cascade,
  cells text[] not null default '{}',
  areas text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

ALTER TABLE public.user_exploration ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own exploration" ON public.user_exploration FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own exploration" ON public.user_exploration FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own exploration" ON public.user_exploration FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.user_inventory (
  user_id uuid primary key references auth.users(id) on delete cascade,
  wood integer not null default 0 check (wood >= 0),
  stone integer not null default 0 check (stone >= 0),
  crystal integer not null default 0 check (crystal >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

ALTER TABLE public.user_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own inventory" ON public.user_inventory FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own inventory" ON public.user_inventory FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own inventory" ON public.user_inventory FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.user_saved_plots (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plot_ids text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

ALTER TABLE public.user_saved_plots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own saved plots" ON public.user_saved_plots FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own saved plots" ON public.user_saved_plots FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own saved plots" ON public.user_saved_plots FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.sync_user_exploration(
  p_cells text[],
  p_areas text[]
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
declare
  v_user_id uuid := auth.uid();
  v_existing record;
  v_merged_cells text[];
  v_merged_areas text[];
begin
  if v_user_id is null then
    raise exception 'Authentication required to sync exploration.';
  end if;

  select * into v_existing from public.user_exploration where user_id = v_user_id;

  if found then
    select array_agg(distinct c) into v_merged_cells from unnest(v_existing.cells || p_cells) as c;
    select array_agg(distinct a) into v_merged_areas from unnest(v_existing.areas || p_areas) as a;

    update public.user_exploration
    set
      cells = coalesce(v_merged_cells, '{}'),
      areas = coalesce(v_merged_areas, '{}'),
      updated_at = now()
    where user_id = v_user_id;
  else
    select array_agg(distinct c) into v_merged_cells from unnest(p_cells) as c;
    select array_agg(distinct a) into v_merged_areas from unnest(p_areas) as a;

    insert into public.user_exploration (user_id, cells, areas, created_at, updated_at)
    values (v_user_id, coalesce(v_merged_cells, '{}'), coalesce(v_merged_areas, '{}'), now(), now());
  end if;

  return jsonb_build_object(
    'ok', true,
    'cells_count', coalesce(array_length(v_merged_cells, 1), 0),
    'areas_count', coalesce(array_length(v_merged_areas, 1), 0)
  );
end;
$$;

GRANT EXECUTE ON FUNCTION public.sync_user_exploration(text[], text[]) TO authenticated;

