-- THE CITY – Migration 007: Admin Credentials & Master Storage
-- Stores admin account (username: admin / password: adminjdhv114) and management RPCs.
-- Run in the Supabase SQL Editor. Safe to re-run.

create extension if not exists pgcrypto;

-- ───────────────────────── 1. Admin Credentials Table ─────────────────────────
create table if not exists public.admin_credentials (
  username text primary key,
  password_hash text not null,
  email text unique not null,
  role text not null default 'super_admin',
  last_login timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.admin_credentials enable row level security;

-- Seed Master Admin Account: username = admin, password = adminjdhv114
insert into public.admin_credentials (username, password_hash, email, role)
values (
  'admin',
  crypt('adminjdhv114', gen_salt('bf')),
  'admin@thecity.local',
  'super_admin'
)
on conflict (username) do update set
  password_hash = crypt('adminjdhv114', gen_salt('bf')),
  email = 'admin@thecity.local',
  role = 'super_admin',
  updated_at = now();

-- ───────────────────────── 2. Admin Verification RPC ─────────────────────────
create or replace function public.admin_verify_login(
  p_username text,
  p_password text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin record;
begin
  select * into v_admin
  from public.admin_credentials
  where (lower(username) = lower(trim(p_username)) or lower(email) = lower(trim(p_username)))
    and password_hash = crypt(p_password, password_hash);

  if not found then
    return jsonb_build_object(
      'success', false,
      'error', 'Invalid admin username or password.'
    );
  end if;

  update public.admin_credentials
  set last_login = now()
  where username = v_admin.username;

  return jsonb_build_object(
    'success', true,
    'username', v_admin.username,
    'email', v_admin.email,
    'role', v_admin.role,
    'last_login', now()
  );
end;
$$;

grant execute on function public.admin_verify_login(text, text) to anon, authenticated;

-- ───────────────────────── 3. City Executive Dashboard Stats View ─────────────────────────
create or replace function public.get_admin_dashboard_metrics()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total_plots integer;
  v_available_plots integer;
  v_reserved_plots integer;
  v_occupied_stores integer;
  v_total_visits bigint;
  v_total_clicks bigint;
  v_promo_redemptions integer;
begin
  select count(*) into v_total_plots from public.city_plots;
  select count(*) into v_available_plots from public.city_plots where status = 'available';
  select count(*) into v_reserved_plots from public.city_plots where status = 'reserved';
  select count(*) into v_occupied_stores from public.stores where owner_id is not null;
  select coalesce(sum(visits), 0), coalesce(sum(clicks), 0) into v_total_visits, v_total_clicks from public.stores;
  select count(*) into v_promo_redemptions from public.promo_redemptions;

  return jsonb_build_object(
    'total_plots', v_total_plots,
    'available_plots', v_available_plots,
    'reserved_plots', v_reserved_plots,
    'occupied_stores', v_occupied_stores,
    'total_visits', v_total_visits,
    'total_clicks', v_total_clicks,
    'promo_redemptions', v_promo_redemptions
  );
end;
$$;

grant execute on function public.get_admin_dashboard_metrics() to authenticated;

