-- THE CITY – migration 005: Central District corporate buildings + bounds check.
-- Run after 004. Idempotent.
--  • Teaches the server-side bounds check about the 20 x 14 m bungalow footprint.
--  • Converts the nine PLATFORM-OWNED buildings around J Enterprise to distinct corporate designs (user-owned stores are never touched).

create or replace function public.stores_check_bounds() returns trigger language plpgsql as $$
declare pw numeric; pd numeric; tpl text; md text; fw numeric; fd numeric; r int; ox numeric; oz numeric; hw numeric; hd numeric; lim numeric;
begin
  select w, d into pw, pd from public.city_plots where id = new.plot_id;
  if pw is null then raise exception 'Unknown plot %', new.plot_id; end if;
  tpl := coalesce(new.config->>'template', 'tech'); md := coalesce(new.config->>'mode', 'template');
  if md = 'modular' then fw := 10; fd := 10;
  elsif tpl = 'jenterprise' then fw := 24; fd := 15;
  elsif tpl = 'bungalow' then fw := 20; fd := 14;
  elsif tpl = 'central'  then fw := 16; fd := 12;
  else fw := 10; fd := 8; end if;
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

update public.stores set config = '{"name":"Nexus Tower","tagline":"Technology & innovation hub","website":"https://example.com","logoUrl":"","theme":"#4f6fcf","template":"central","mode":"template","facade":"concrete","tint":"#c9d6e4","glass":"clear","windows":"grid","door":"glass","roof":"flat","awning":"none","sign":"panel","lights":true,"floors":3,"balcony":false,"planters":true,"trim":true,"modules":[],"place":{"ox":0,"oz":1.5,"rot":0}}'::jsonb, updated_at = now() where plot_id = 'C01' and owner_id is null;
update public.stores set config = '{"name":"Orion Place","tagline":"Finance & investment centre","website":"https://example.com","logoUrl":"","theme":"#4f6fcf","template":"central","mode":"template","facade":"concrete","tint":"#c9d6e4","glass":"clear","windows":"grid","door":"glass","roof":"flat","awning":"none","sign":"panel","lights":true,"floors":3,"balcony":false,"planters":true,"trim":true,"modules":[],"place":{"ox":0,"oz":1.5,"rot":0}}'::jsonb, updated_at = now() where plot_id = 'C02' and owner_id is null;
update public.stores set config = '{"name":"The Brew House","tagline":"Food, beverage & hospitality","website":"https://example.com","logoUrl":"","theme":"#4f6fcf","template":"central","mode":"template","facade":"concrete","tint":"#c9d6e4","glass":"clear","windows":"grid","door":"glass","roof":"flat","awning":"none","sign":"panel","lights":true,"floors":3,"balcony":false,"planters":true,"trim":true,"modules":[],"place":{"ox":0,"oz":1.5,"rot":0}}'::jsonb, updated_at = now() where plot_id = 'C03' and owner_id is null;
update public.stores set config = '{"name":"Arcade One","tagline":"Gaming & entertainment","website":"https://example.com","logoUrl":"","theme":"#4f6fcf","template":"central","mode":"template","facade":"concrete","tint":"#c9d6e4","glass":"clear","windows":"grid","door":"glass","roof":"flat","awning":"none","sign":"panel","lights":true,"floors":3,"balcony":false,"planters":true,"trim":true,"modules":[],"place":{"ox":0,"oz":1.5,"rot":0}}'::jsonb, updated_at = now() where plot_id = 'C04' and owner_id is null;
update public.stores set config = '{"name":"Lumière","tagline":"Fashion & luxury boutique","website":"https://example.com","logoUrl":"","theme":"#4f6fcf","template":"central","mode":"template","facade":"concrete","tint":"#c9d6e4","glass":"clear","windows":"grid","door":"glass","roof":"flat","awning":"none","sign":"panel","lights":true,"floors":3,"balcony":false,"planters":true,"trim":true,"modules":[],"place":{"ox":0,"oz":1.5,"rot":0}}'::jsonb, updated_at = now() where plot_id = 'C05' and owner_id is null;
update public.stores set config = '{"name":"Meridian Park","tagline":"Corporate offices & co-working","website":"https://example.com","logoUrl":"","theme":"#4f6fcf","template":"central","mode":"template","facade":"concrete","tint":"#c9d6e4","glass":"clear","windows":"grid","door":"glass","roof":"flat","awning":"none","sign":"panel","lights":true,"floors":3,"balcony":false,"planters":true,"trim":true,"modules":[],"place":{"ox":0,"oz":1.5,"rot":0}}'::jsonb, updated_at = now() where plot_id = 'C06' and owner_id is null;
update public.stores set config = '{"name":"Nova Complex","tagline":"Consumer electronics & tech","website":"https://example.com","logoUrl":"","theme":"#4f6fcf","template":"central","mode":"template","facade":"concrete","tint":"#c9d6e4","glass":"clear","windows":"grid","door":"glass","roof":"flat","awning":"none","sign":"panel","lights":true,"floors":3,"balcony":false,"planters":true,"trim":true,"modules":[],"place":{"ox":0,"oz":1.5,"rot":0}}'::jsonb, updated_at = now() where plot_id = 'C07' and owner_id is null;
update public.stores set config = '{"name":"Garden Market","tagline":"Groceries & fresh produce","website":"https://example.com","logoUrl":"","theme":"#4f6fcf","template":"central","mode":"template","facade":"concrete","tint":"#c9d6e4","glass":"clear","windows":"grid","door":"glass","roof":"flat","awning":"none","sign":"panel","lights":true,"floors":3,"balcony":false,"planters":true,"trim":true,"modules":[],"place":{"ox":0,"oz":1.5,"rot":0}}'::jsonb, updated_at = now() where plot_id = 'C08' and owner_id is null;
update public.stores set config = '{"name":"Studio IX","tagline":"Creative design & architecture","website":"https://example.com","logoUrl":"","theme":"#4f6fcf","template":"central","mode":"template","facade":"concrete","tint":"#c9d6e4","glass":"clear","windows":"grid","door":"glass","roof":"flat","awning":"none","sign":"panel","lights":true,"floors":3,"balcony":false,"planters":true,"trim":true,"modules":[],"place":{"ox":0,"oz":1.5,"rot":0}}'::jsonb, updated_at = now() where plot_id = 'C09' and owner_id is null;
