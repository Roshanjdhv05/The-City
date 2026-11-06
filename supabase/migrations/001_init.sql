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
