-- THE CITY – migration 003: Residential Quarter (8 house plots + street). Idempotent; run after 002.
insert into public.city_plots (id, district, category, tier, price, x, z, w, d, rot, status, landmark) values
  ('H01', 'Residential Quarter', 'Residential', 'free',    0,   -72, -12, 12, 12, 0,            'available', false),
  ('H02', 'Residential Quarter', 'Residential', 'premium', 299, -72,  12, 12, 12, 3.1415926536, 'available', false),
  ('H03', 'Residential Quarter', 'Residential', 'premium', 299, -86, -12, 12, 12, 0,            'available', false),
  ('H04', 'Residential Quarter', 'Residential', 'free',    0,   -86,  12, 12, 12, 3.1415926536, 'available', false),
  ('H05', 'Residential Quarter', 'Residential', 'free',    0,  -100, -12, 12, 12, 0,            'available', false),
  ('H06', 'Residential Quarter', 'Residential', 'premium', 299,-100,  12, 12, 12, 3.1415926536, 'available', false),
  ('H07', 'Residential Quarter', 'Residential', 'premium', 299,-114, -12, 12, 12, 0,            'available', false),
  ('H08', 'Residential Quarter', 'Residential', 'free',    0,  -114,  12, 12, 12, 3.1415926536, 'available', false)
on conflict (id) do nothing;
insert into public.city_roads (id, x0, z0, x1, z1, w) values ('R-RES', -64, 0, -128, 0, 10) on conflict (id) do nothing;
