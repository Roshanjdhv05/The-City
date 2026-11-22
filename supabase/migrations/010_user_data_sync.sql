-- THE CITY – Migration 010: Centralized User Data Persistence & Synchronization
-- Moves exploration, inventory, saved plots, and redemptions to Supabase DB.
-- Run in the Supabase SQL Editor. Safe to re-run.

-- ───────────────────────── 1. User Exploration Progress ─────────────────────────
create table if not exists public.user_exploration (
  user_id uuid primary key references auth.users(id) on delete cascade,
  cells text[] not null default '{}',
  areas text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_exploration enable row level security;

drop policy if exists "Users can read own exploration" on public.user_exploration;
create policy "Users can read own exploration"
  on public.user_exploration for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own exploration" on public.user_exploration;
create policy "Users can insert own exploration"
  on public.user_exploration for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own exploration" on public.user_exploration;
create policy "Users can update own exploration"
  on public.user_exploration for update
  to authenticated
  using (auth.uid() = user_id);

-- ───────────────────────── 2. User Resource Inventory ─────────────────────────
create table if not exists public.user_inventory (
  user_id uuid primary key references auth.users(id) on delete cascade,
  wood integer not null default 0 check (wood >= 0),
  stone integer not null default 0 check (stone >= 0),
  crystal integer not null default 0 check (crystal >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_inventory enable row level security;

drop policy if exists "Users can read own inventory" on public.user_inventory;
create policy "Users can read own inventory"
  on public.user_inventory for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own inventory" on public.user_inventory;
create policy "Users can insert own inventory"
  on public.user_inventory for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own inventory" on public.user_inventory;
create policy "Users can update own inventory"
  on public.user_inventory for update
  to authenticated
  using (auth.uid() = user_id);

-- ───────────────────────── 3. User Saved / Bookmarked Plots ─────────────────────────
create table if not exists public.user_saved_plots (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plot_ids text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_saved_plots enable row level security;

drop policy if exists "Users can read own saved plots" on public.user_saved_plots;
create policy "Users can read own saved plots"
  on public.user_saved_plots for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own saved plots" on public.user_saved_plots;
create policy "Users can insert own saved plots"
  on public.user_saved_plots for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own saved plots" on public.user_saved_plots;
create policy "Users can update own saved plots"
  on public.user_saved_plots for update
  to authenticated
  using (auth.uid() = user_id);

-- ───────────────────────── 4. RPC to Additively Merge Exploration ─────────────────────────
-- Guarantees atomic, additive exploration merging on the database side
create or replace function public.sync_user_exploration(
  p_cells text[],
  p_areas text[]
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
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
    -- Additive merge: union existing and newly incoming items without duplicates
    select array_agg(distinct c) into v_merged_cells
    from unnest(v_existing.cells || p_cells) as c;

    select array_agg(distinct a) into v_merged_areas
    from unnest(v_existing.areas || p_areas) as a;

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

grant execute on function public.sync_user_exploration(text[], text[]) to authenticated;
