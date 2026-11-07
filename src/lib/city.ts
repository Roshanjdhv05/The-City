import type { Plot, Road, Tier } from './types';
import { Pt, bearingDir, polar, plotPoly, polysOverlap, polyRadialRange, box, D2R } from './geom';

/* ═══════════ THE CITY – circular master plan ═══════════
   J Enterprise hub + plaza -> inner ring road -> ring of buildings -> ring road -> two market bands -> outer ring road.
   Nine radial boundary roads split the city into nine market districts; each district has a spine road,
   cross streets and rows of plots on both sides of every street. Generated from actual geometry, then validated. */
/* Radii are derived, not guessed: a band holds two cross streets, each with a row of plots (13.6 m) on both sides.
   A ring's inner edge must clear 1/cos(20°) x the far radius of the last row, because rings curve in at the sides of a sector. */
export const CITY = { plazaR: 40, R0: 52, R1: 90, R2: 208, Ro: 334, ringW: [10, 12, 12, 14], radialW: 12, crossW: 10, sw: 3, crossU: [120.6, 164.6, 238.6, 282.6], rowD: 13.6, innerR: 71 };
export const DISTRICTS = [
  { code: 'SAS', name: 'SAAS', cat: 'SAAS' },
  { code: 'AIM', name: 'AI', cat: 'AI' },
  { code: 'DEV', name: 'DEVELOPMENT', cat: 'DEVELOPMENT' },
  { code: 'WIN', name: 'WINDOWS APPS', cat: 'WINDOWS APPS' },
  { code: 'MAC', name: 'MAC APPS', cat: 'MAC APPS' },
  { code: 'MOB', name: 'MOBILE APPS', cat: 'MOBILE APPS' },
  { code: 'GAM', name: 'GAMING', cat: 'GAMING' },
  { code: 'DES', name: 'DESIGN', cat: 'DESIGN' },
  { code: 'MKT', name: 'MARKETING', cat: 'MARKETING' },
];
export const PRICE: Record<Tier, number> = { free: 0, premium: 0, featured: 0, corner: 0 };
const r2 = (n: number) => Math.round(n * 100) / 100;
const WS = [12, 14, 12, 16, 12, 14];

export const roadPoly = (r: Road, m = 0): Pt[] => { const L = Math.hypot(r.x1 - r.x0, r.z1 - r.z0) || 1, e1: Pt = [(r.x1 - r.x0) / L, (r.z1 - r.z0) / L], e2: Pt = [-e1[1], e1[0]]; return box((r.x0 + r.x1) / 2, (r.z0 + r.z1) / 2, e1, e2, L / 2 + m, r.w / 2 + m); };
/** Does a plot (grown by margin m) touch a road? Rings use an annulus test, segments an oriented-box test. */
export function plotHitsRoad(p: { x: number; z: number; w: number; d: number; rot: number }, r: Road, m = 0): boolean {
  const P = plotPoly(p);
  if (r.kind === 'ring') { const [mn, mx] = polyRadialRange(P, r.x0, r.z0); return mx >= r.x1 - r.w / 2 - m && mn <= r.x1 + r.w / 2 + m; }
  return polysOverlap(P, roadPoly(r, m));
}

export function generateCity(): { plots: Plot[]; roads: Road[] } {
  const roads: Road[] = [], plots: Plot[] = [];
  CITY.ringW.forEach((w, i) => roads.push({ id: `RING-${i}`, kind: 'ring', x0: 0, z0: 0, x1: [CITY.R0, CITY.R1, CITY.R2, CITY.Ro][i], z1: 0, w }));
  const seg = (id: string, a: Pt, b: Pt, w: number) => roads.push({ id, kind: 'seg', x0: r2(a[0]), z0: r2(a[1]), x1: r2(b[0]), z1: r2(b[1]), w });
  const tan20 = Math.tan(20 * D2R);
  DISTRICTS.forEach((D, k) => {
    seg(`RAD-${k}`, polar(CITY.R0, 40 * k), polar(CITY.Ro, 40 * k), CITY.radialW);                       // boundary road (main-road spoke)
    const c = 20 + 40 * k, U = bearingDir(c), V: Pt = [Math.cos(c * D2R), Math.sin(c * D2R)], P = (u: number, v: number): Pt => [u * U[0] + v * V[0], u * U[1] + v * V[1]];
    seg(`SPN-${D.code}`, polar(CITY.R1, c), polar(CITY.Ro, c), CITY.radialW);                          // district spine: entrance on the ring road
    CITY.crossU.forEach((u, j) => seg(`X-${D.code}-${j + 1}`, P(u, -u * tan20), P(u, u * tan20), CITY.crossW)); // cross streets reach both boundary roads
  });
  // hub
  plots.push({ id: 'J01', district: 'Civic Plaza', category: 'Enterprise', tier: 'featured', price: 0, x: 0, z: 0, rot: 0, w: 36, d: 26, status: 'reserved', landmark: true });
  DISTRICTS.forEach((D, k) => { const c = 20 + 40 * k, [x, z] = polar(CITY.innerR, c); plots.push({ id: 'C0' + (k + 1), district: 'Central District', category: 'Central', tier: 'featured', price: PRICE.featured, x: r2(x), z: r2(z), rot: r2(-c * D2R * 1e4) / 1e4, w: 24, d: 18, status: 'reserved' }); });
  const tierOf = (i: number, row: number, ri: number, corner = false): Tier => (corner || (i === 0 && ri === 0) ? 'corner' : (i + row) % 5 === 4 ? 'featured' : (i + row) % 3 === 2 ? 'free' : 'premium');
  const ok = (cand: Plot, m = 1.5) => !roads.some(r => plotHitsRoad(cand, r, m)) && !plots.some(o => polysOverlap(plotPoly(cand, 0.2), plotPoly(o))) && Math.hypot(cand.x, cand.z) > CITY.plazaR + 16;
  DISTRICTS.forEach((D, k) => {
    const c = 20 + 40 * k, U = bearingDir(c), V: Pt = [Math.cos(c * D2R), Math.sin(c * D2R)], d = CITY.rowD; let n = 1;
    CITY.crossU.forEach((u, j) => ([{ side: -1, face: 1 }, { side: 1, face: -1 }]).forEach(({ side, face }, ri) => {
      const uc = u + side * (CITY.crossW / 2 + CITY.sw + d / 2), rot = face > 0 ? Math.PI - c * D2R : -c * D2R;     // inner row faces outward (+U), outer row faces inward
      for (const s of [-1, 1]) {
        let off = CITY.radialW / 2 + CITY.sw + 1, i = 0;
        for (let guard = 0; guard < 20; guard++) {
          // Try preferred width first; fall back to smaller widths to fill corner gaps next to boundary roads
          const prefW = WS[(i + j + ri) % WS.length];
          const widths: number[] = [prefW, 14, 12, 10].filter((w, idx, arr) => arr.indexOf(w) === idx);
          let placed: Plot | null = null;
          for (const w of widths) {
            const v = s * (off + w / 2), cand: Plot = { id: '', district: D.name, category: D.cat, tier: 'premium', price: 0, x: r2(uc * U[0] + v * V[0]), z: r2(uc * U[1] + v * V[1]), rot: Math.round(rot * 1e6) / 1e6, w, d, status: 'available' };
            if (ok(cand)) { placed = cand; break; }
          }
          if (!placed) break;
          const isCorner = placed.w <= 10;
          const plotNum = n++;
          placed.id = `${D.code}-${String(plotNum).padStart(3, '0')}`;
          
          // Exactly 25 buildings in each market permanently locked; all others free to claim
          if (plotNum <= 25) {
            placed.status = 'reserved';
            placed.tier = 'featured';
            placed.price = 0;
          } else {
            placed.status = 'available';
            placed.tier = 'free';
            placed.price = 0;
          }
          plots.push(placed); off += placed.w + 1.5; i++;
        }
      }
    }));
  });
  return { plots, roads };
}
