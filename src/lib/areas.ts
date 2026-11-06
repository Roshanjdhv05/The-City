import { Layout, plotRect, nearestRoad } from './layout';
import { OBSTACLES } from './plots';
import { plotPoly, polyRadialRange } from './geom';
import type { Terrain } from './terrain';

export interface Area { name: string; kind: 'district' | 'landmark' | 'nature' }
export const NATURE = ['Meadow', 'Forest', 'Hills', 'Mountains', 'River'];

/** Which named area is the player in? Districts come from the shared layout (so admin-added districts are discovered automatically). */
export function areaAt(x: number, z: number, layout: Layout, t: Terrain): Area {
  for (const o of OBSTACLES) if (Math.hypot(x - o.cx, z - o.cz) < o.r) return { name: o.name, kind: 'landmark' };
  let best: { d: number; name: string } | null = null;
  for (const p of layout.plots) { const r = plotRect(p); if (x < r.x0 - 16 || x > r.x1 + 16 || z < r.z0 - 16 || z > r.z1 + 16) continue; const [mn] = polyRadialRange(plotPoly(p), x, z); if (mn < 14 && (!best || mn < best.d)) best = { d: mn, name: p.district }; }
  if (!best) { const nr = nearestRoad(layout.roads, x, z); if (nr && nr.d < 8) { let nd = 1e9; for (const p of layout.plots) { const d = Math.hypot(p.x - x, p.z - z); if (d < nd && d < 60) { nd = d; best = { d, name: p.district }; } } } }
  if (best) return { name: best.name, kind: 'district' };
  const h = t.height(x, z);
  if (t.riverDist(x, z) < 12 && h < 0.6) return { name: 'River', kind: 'nature' };
  if (h > 38) return { name: 'Mountains', kind: 'nature' };
  if (h > 9) return { name: 'Hills', kind: 'nature' };
  if (t.forest(x, z) > 0.55 && t.outside(x, z) > 30) return { name: 'Forest', kind: 'nature' };
  return { name: 'Meadow', kind: 'nature' };
}
