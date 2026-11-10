-- THE CITY – Migration 006: Admin building unlock & Central District promo code (Jdhvpromo)
-- Run in the Supabase SQL Editor. Safe to re-run.

-- ───────────────────────── 1. Promo Codes Table ─────────────────────────
create table if not exists public.promo_codes (
  code text primary key,
  district text not null default 'Central District',
  max_uses integer default null, -- null = unlimited
  used_count integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Seed VIP Promo Code: Jdhvpromo for Central District
insert into public.promo_codes (code, district, max_uses, active)
values ('Jdhvpromo', 'Central District', null, true)
on conflict (code) do update set
  district = 'Central District',
  active = true;

-- ───────────────────────── 2. Promo Redemptions Table ─────────────────────────
create table if not exists public.promo_redemptions (
  id uuid primary key default gen_random_uuid(),
  promo_code text not null references public.promo_codes(code) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  plot_id text not null,
  redeemed_at timestamptz not null default now(),
  unique (user_id, plot_id)
);

alter table public.promo_codes enable row level security;
alter table public.promo_redemptions enable row level security;

-- Policies for promo codes & redemptions
drop policy if exists "promo_codes are readable by authenticated users" on public.promo_codes;
create policy "promo_codes are readable by authenticated users" on public.promo_codes
  for select to authenticated using (true);

drop policy if exists "users can read own redemptions" on public.promo_redemptions;
create policy "users can read own redemptions" on public.promo_redemptions
  for select to authenticated using (auth.uid() = user_id);

-- ───────────────────────── 3. RPC: Claim with Promo Code ─────────────────────────
-- Unlocks the Central District building and claims it for free for the user.
create or replace function public.claim_with_promo_code(
  p_plot_id text,
  p_code text,
  p_config jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_user_email text;
  v_promo record;
  v_plot record;
  v_existing_store record;
begin
  -- 1. Check user authentication
  if v_user_id is null then
    raise exception 'You must be signed in to claim a building.';
  end if;

  select email into v_user_email from auth.users where id = v_user_id;

  -- 2. Verify Promo Code
  select * into v_promo
  from public.promo_codes
  where lower(code) = lower(trim(p_code)) and active = true;

  if not found then
    raise exception 'Invalid or inactive promo code.';
  end if;

  if v_promo.max_uses is not null and v_promo.used_count >= v_promo.max_uses then
    raise exception 'Promo code usage limit has been reached.';
  end if;

  -- 3. Verify Target Plot in Central District
  select * into v_plot
  from public.city_plots
  where id = p_plot_id;

  if found and not (v_plot.district ilike '%Central%' or p_plot_id like 'C0%') then
    raise exception 'Promo code % is only valid for Central District buildings.', v_promo.code;
  end if;

  if not found and not (p_plot_id like 'C0%') then
    raise exception 'Plot % not found or not in Central District.', p_plot_id;
  end if;

  -- 4. Check if plot is already owned by another user
  select * into v_existing_store
  from public.stores
  where plot_id = p_plot_id and owner_id is not null and owner_id <> v_user_id;

  if found then
    raise exception 'Building % is already owned by another resident.', p_plot_id;
  end if;

  -- 5. Enforce 1 building per email check
  select * into v_existing_store
  from public.stores
  where owner_id = v_user_id and plot_id <> p_plot_id;

  if found then
    raise exception 'You can only claim 1 building per email. You already own building %.', v_existing_store.plot_id;
  end if;

  -- 6. Unlock the plot in city_plots
  update public.city_plots
  set status = 'available'
  where id = p_plot_id;

  -- 7. Upsert store ownership
  insert into public.stores (
    plot_id,
    owner_id,
    config,
    visits,
    clicks,
    created_at,
    updated_at
  )
  values (
    p_plot_id,
    v_user_id,
    p_config,
    0,
    0,
    now(),
    now()
  )
  on conflict (plot_id) do update set
    owner_id = v_user_id,
    config = p_config,
    updated_at = now();

  -- 8. Record redemption and bump counter
  insert into public.promo_redemptions (promo_code, user_id, plot_id)
  values (v_promo.code, v_user_id, p_plot_id)
  on conflict (user_id, plot_id) do nothing;

  update public.promo_codes
  set used_count = used_count + 1
  where code = v_promo.code;

  return jsonb_build_object(
    'ok', true,
    'plot_id', p_plot_id,
    'owner_id', v_user_id,
    'promo_code', v_promo.code,
    'message', 'Building unlocked and claimed successfully!'
  );
end;
$$;

grant execute on function public.claim_with_promo_code(text, text, jsonb) to authenticated;

-- ───────────────────────── 4. RPC: Admin Unlock / Lock Building ─────────────────────────
create or replace function public.admin_set_plot_status(
  p_plot_id text,
  p_status text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Only administrators can unlock or lock city buildings.';
  end if;

  if p_status not in ('available', 'reserved') then
    raise exception 'Invalid status: %. Must be available or reserved.', p_status;
  end if;

  update public.city_plots
  set status = p_status
  where id = p_plot_id;
end;
$$;

grant execute on function public.admin_set_plot_status(text, text) to authenticated;
