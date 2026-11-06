# THE CITY

Next.js 14 + TypeScript + React Three Fiber virtual commercial district: cinematic scroll landing page, walkable city (1P/3P camera, collisions, store interaction), Buy Store marketplace, live 3D store editor with ready-made and modular building, auth and Supabase persistence.

## Run
```bash
npm install
cp .env.example .env.local   # optional – without keys the app runs in Demo Mode (localStorage)
npm run dev                  # http://localhost:3000
```

## Supabase (optional, required for real admin security)
1. Create a project. In the SQL editor run `supabase/migrations/001_init.sql`, then `supabase/migrations/002_admin_city.sql` (idempotent; extends the existing schema, nothing is dropped).
2. Put the project URL + anon key into `.env.local`.
3. Sign up in the app, then make yourself an administrator (run once in the SQL editor):
   `insert into public.admins (user_id) select id from auth.users where email = 'you@example.com';`
Enables email/password auth, store persistence, logo uploads, analytics counters, the persistent city layout and `/admin`.

## Controls
WASD / arrows move · Shift run · drag mouse to look (click canvas for pointer-lock in 1P) · V toggles camera · E interacts near a door.

## Graphics
No external model files are required: all materials are PBR (procedural albedo + roughness + bump maps generated once on canvas and cached), buildings are layered procedural geometry, lighting is a golden-hour sun with soft shadow maps, environment reflections from baked Lightformers, SSAO + bloom + ACES tone mapping at high quality. Trees, lamps, benches and road markings are instanced; distant buildings swap to a low-detail LOD.
Quality presets (auto-picked, changeable in the city HUD / editor): **Low** (mobile: no real-time shadows/post/interiors), **Medium**, **High**.
To use GLB assets (ambientCG / Poly Haven / etc.), load them with `useGLTF` and swap them into `Building.tsx`/`World.tsx`.

## Layout
`src/lib` data, plots, templates, materials · `src/components` 3D scene, HUD, editor canvas · `src/app` pages.

## Central District bungalows
The nine buildings that ring J Enterprise (`C01–C09`) are now **bungalows** — single-storey detached buildings, each 20 × 14 m, with a pitched roof (gabled / hip / cornice / sloped), veranda with railings, plant boxes under front windows, garden path, hedge row, a named sign board, wooden railing and a side lamp post. Each of the nine has a different facade material (stone / brick / wood), roof style and accent colour so they look distinct from each other and from the standard storefronts. The `src/components/Bungalow.tsx` component draws them; `StoreModel.tsx` dispatches by `cfg.template`.

`src/lib/templates.ts` includes a **Bungalow** template that store owners can also apply to any eligible plot (20 × 14 m minimum). Migration 005 (`supabase/migrations/005_bungalows.sql`) updates the nine platform-owned stores and extends the server-side bounds check.

## Colour palette
The whole world shifted to a natural, slightly darker palette: khaki concrete, terracotta brick (darker), weathered stone, aged wood, slate roads, sand-and-concrete sidewalks, forest greens, a dusk-blue sky, and darker warm lighting. The hue and saturation were reduced across all materials (see `src/lib/materials.ts`) so nothing looks over-saturated or cartoon-bright. J Enterprise, buildings, and the terrain all use the same tonal range.

## Circular master plan (current layout)
The city follows the circular map: **J Enterprise** at the hub inside a paved plaza → inner ring road → **nine buildings** around it → ring road → two market bands → outer ring road. Nine **radial boundary roads** split the city into **nine market districts** (Finance, Retail, Food & Beverage, Creative, Education, Health & Wellness, AI, Real Estate, Technology). Each district has its own **spine road** (entrance on the ring road), **four cross streets** reaching both boundary roads, and **rows of plots on both sides of every street**, each with its entrance facing the street and a 3 m sidewalk. Markets are **empty, available land** (For Sale boards); only J Enterprise and the ring of buildings around it come pre-built. About 400 plots in total.

- **Generated and validated from real geometry:** `src/lib/city.ts` builds the plan, `src/lib/layout.ts` validates it (`validateNetwork`: every road connected, every plot entrance on a road/sidewalk, no overlaps). Ring roads are true circles (`kind: 'ring'`), roads/plots can be at any angle.
- **Same data everywhere:** roads, sidewalks, markings, crosswalks, lamps, plot boards, colliders, minimap, marketplace map and `/admin` all read the same layout. Merged geometry and instancing keep ~400 plots to a handful of draw calls.
- **Walking:** approach any plot or store and a prompt appears (“Press E to View Store / Plot”). Stores show name, category, description and a **Visit Website** button (opens in a new tab only when clicked). Empty plots show price/size and link to the marketplace. The **City map (M)** lets you click any plot or store and either **Guide me here** (distance + arrow) or teleport.
- **Admin (`/admin`):** new **Roads** tab (select on the map, edit/add/delete roads and market entrances), plot **position, size and entrance facing** (with “Snap entrance to nearest road”), add/delete plots, building placement/ownership (unchanged), **Add a market district** from any outer-ring gate or open road end at any bearing, and a **Network** tab that reports disconnected roads, plots without road access and overlaps. All saves are validated client-side and, with Supabase, again by the database.
- **Migration 004** (`supabase/migrations/004_circular_city.sql`, run after 001–003) replaces the old grid layout, adds ring-road support, reseeds the city from the same generator, and adds triggers that reject overlapping plots/roads. Plots with user-owned stores are **not deleted**: they move to a “Legacy yard” south of the city (region `LEGACY`) so you can relocate those buildings with Admin → Plot → Relocate. Migration 003 (Residential Quarter) is superseded by 004. Demo mode migrates automatically (old local layout data is dropped).

## Low-poly open world
The world uses one pastel, flat-shaded style (reference: the pastel low-poly street illustration). `src/lib/materials.ts` is the single style layer: tiny tiling patterns instead of photo textures, flat shading, soft pastel palette (sky blue, mint, beige, terracotta, muted orange). Every building, road, sidewalk, lamp, bench, tree, hedge, plot sign and the J Enterprise landmark draws from it, so the world stays consistent.

- **Terrain** (`src/lib/terrain.ts`, `Scenery.tsx`): faceted heightmap, exactly flat under the city (so plots/roads/buildings keep their coordinates and admin expansions stay valid) with meadows, forests, hills, snow-capped mountains and a wadeable river outside it. It re-fits automatically when the city grows.
- **Districts:** the nine markets, the Central District ring and the Civic Plaza, plus forest/hills/mountains/river areas outside the city. Admin-added districts appear and are discoverable automatically. Resource gathering exists only in the wilderness outside the city; the market streets stay clean and commercial.
- **Movement** (`src/lib/physics.ts`, pure and unit-tested): walk, run (Shift), jump (Space), gravity, terrain following, slope limit, wading slowdown, circle/box collisions. Free third-person orbit (drag), mouse-wheel zoom, V toggles first person.
- **Gameplay extras:** area discovery (toast + counter, saved per browser) and optional resource gathering (press F near wood piles, stone and crystals; inventory saved per browser; nodes respawn after 90 s). Resources are not required for anything in the marketplace.
- **Performance:** instanced trees/pines/rocks/hedges/lamps/benches, merged geometry, one terrain mesh, LOD on buildings, quality presets scale terrain resolution, forest size/radius and shadows. Hidden hero canvas is paused.

## Design system & pages
Navy / white / electric-cyan identity defined as CSS tokens at the top of `src/app/globals.css` (type: Sora for display, Inter for body via `next/font`, which downloads the fonts at build time). Shared pieces: `Nav` (minimal, responsive, sticky), `Footer`, `Reveal` (scroll-in animation, respects reduced motion), `.btn / .chip / .badge / .glass / .panel` primitives.

- `/` cinematic hero (live 3D city, scroll-driven fly-through ending at J Enterprise, paused when off-screen), how it works, then sections driven by `src/lib/stats.ts`: stats, featured businesses (ranked by recorded visits), premium plots, popular districts, recently added businesses. Nothing is hard-coded: figures come from the same layout/stores the 3D world uses. Seeded businesses start with 0 visits.
- `/city` unobtrusive overlay: search, 1P/3P switch, collapsible controls and minimap, store panel, Explore District (cycles districts). Deep links: `/city?store=J01`. A store's website only opens when the visitor clicks **Enter Store**.
- `/buy` marketplace: interactive map (same component as admin), searchable/filterable listings, selected-plot panel with live 3D preview, template/colour/facade/name controls, claim/purchase. "Save plot" is a per-browser shortlist; a true reservation hold would need a server table and was deliberately not added (no new migration).
- `/admin` unchanged in function plus an **Owners** tab. `/terms` (template text, needs legal review) and `/contact` (mailto form; set `NEXT_PUBLIC_CONTACT_EMAIL`).

If you already ran migration 002 from the previous package, the built-in businesses were seeded with placeholder visit counts; reset them with:
`update public.stores set visits = 0, clicks = 0 where owner_id is null;`
Built-in businesses link to `https://example.com`; replace via `/admin`.

## City layout & admin (`/admin`)
The 3D world, the Buy Store map and the admin map all read the same layout (`loadWorld()` in `src/lib/data.ts`): plots (`city_plots`), roads (`city_roads`), expansion regions (`city_regions`) and buildings (`stores`). Roads, sidewalks, lane markings, crosswalks, lamps, trees, benches, colliders, minimap and plot signs are all generated from that layout, so anything added in `/admin` is part of the walkable world on the next load.

- **Admin map:** pan (drag), zoom (wheel / buttons), search (plot ID, store, owner, district), plot selection with a details panel; visual states for available / occupied / reserved and premium / featured / corner tiers.
- **Expand City:** direction + the road end to connect to, rows, columns, plot size, spacing, road width, tier. A live preview is drawn on the map and validated (overlaps with plots, roads, the plaza and HQ tower; duplicate IDs; bounds). Confirm saves region + plots + roads atomically (`admin_expand_city`).
- **Buildings:** place, edit (template, name, tagline, website, owner by email, position offset, rotation), relocate and remove. Saves go through a diff/confirm dialog, Cancel reverts the draft, removal requires typing the plot ID. A building must fit inside its plot (checked in the UI, in `placementError()`, and by a database trigger).
- **Authorization:** enforced in Postgres, not just the UI. Layout tables are public-read / admin-write (RLS); expansion, move and user lookup are `SECURITY DEFINER` functions that check `is_admin()`; owners can only claim existing plots with status `available`.
- **Demo mode** (no Supabase keys): data persists in `localStorage`; the admin account is the email in `NEXT_PUBLIC_DEMO_ADMIN_EMAIL` (default `admin@thecity.local`). This is a development convenience and provides **no** real security.

### J Enterprise
Plot `J01` (36×26 m, north end of the main street behind the fountain plaza) holds the J Enterprise headquarters (`src/components/JEnterprise.tsx`): marble core tower with illuminated J logo and "J ENTERPRISE" sign, glass curtain-wall wings with visible floor plates and warm interiors, LED-edged canopy, entrance stairs, monument signs, planters, palms, bollards and banner poles. Visitors spawn at street level in the plaza facing it (`SPAWN` in `src/lib/state.ts`), with a fading "J Enterprise" location label and a persistent in-world label. The door uses the normal E-to-interact flow. The old tower now stands behind it as skyline.

### Tests
Pure-logic checks (layout, expansion planner, placement bounds, colliders, persistence through reload, permissions in demo mode) were run with Node against the real `src/lib` code. The 3D scene itself has not been rendered in a browser by the author of this package; expect to tune lighting and materials on first run.

## Notes
Payments are not implemented (`purchasePlot()` claims instantly). Seed businesses are merged client-side so the city is never empty.
#   T h e - C i t y  
 