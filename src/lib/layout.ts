import { create } from 'zustand';
import type { Plot, Road, Region } from './types';
import { BASE_PLOTS, BASE_ROADS, OBSTACLES, toWorld } from './plots';
import { plotHitsRoad, roadPoly } from './city';
import { Rect, Pt, plotPoly, polyRect, polysOverlap, polyRadialRange, distPointSeg, lineAnnulus, lineCircle, subtractIntervals, rectOverlap } from './geom';


export type { Rect };
export interface Layout { plots: Plot[]; roads: Road[]; regions: Region[]; byId: Map<string, Plot>; source: 'db' | 'local' | 'base'; version: number }
let ver = 0;
export function makeLayout(plots: Plot[], roads: Road[], regions: Region[], source: Layout['source']): Layout {
  return { plots, roads, regions, byId: new Map(plots.map(p => [p.id, p])), source, version: ++ver };
}
export const baseLayout = () => makeLayout(BASE_PLOTS, BASE_ROADS, [], 'base');

export const isRing = (r: Road) => r.kind === 'ring';
export const roadLen = (r: Road) => Math.hypot(r.x1 - r.x0, r.z1 - r.z0);
export const roadDir = (r: Road): Pt => { const L = roadLen(r) || 1; return [(r.x1 - r.x0) / L, (r.z1 - r.z0) / L]; };
/** Axis-aligned bounding boxes (broad phase / bounds). */
export const plotRect = (p: Plot): Rect => polyRect(plotPoly(p));
export const roadRect = (r: Road): Rect => isRing(r) ? { x0: r.x0 - r.x1 - r.w / 2, x1: r.x0 + r.x1 + r.w / 2, z0: r.z0 - r.x1 - r.w / 2, z1: r.z0 + r.x1 + r.w / 2 } : polyRect(roadPoly(r));
export const overlap = rectOverlap;
export function layoutBounds(l: Layout, pad = 30): Rect {
  const rs = [...l.plots.map(plotRect), ...l.roads.map(roadRect), ...OBSTACLES.map(o => ({ x0: o.cx - o.r, x1: o.cx + o.r, z0: o.cz - o.r, z1: o.cz + o.r }))];
  return { x0: Math.min(...rs.map(r => r.x0)) - pad, x1: Math.max(...rs.map(r => r.x1)) + pad, z0: Math.min(...rs.map(r => r.z0)) - pad, z1: Math.max(...rs.map(r => r.z1)) + pad };
}
/** Distance from a point to a road's lane edge (<= 0 means inside the carriageway). */
export function roadEdgeDist(r: Road, x: number, z: number): number {
  return isRing(r) ? Math.abs(Math.hypot(x - r.x0, z - r.z0) - r.x1) - r.w / 2 : distPointSeg(x, z, r.x0, r.z0, r.x1, r.z1) - r.w / 2;
}
export function nearestRoad(roads: Road[], x: number, z: number): { road: Road; d: number } | null {
  let best: { road: Road; d: number } | null = null; for (const r of roads) { const d = roadEdgeDist(r, x, z); if (!best || d < best.d) best = { road: r, d }; } return best;
}
export const bandHit = (roads: Road[], x: number, z: number, margin = 0, except = '') => roads.some(r => r.id !== except && roadEdgeDist(r, x, z) < margin);

export interface Junction { x: number; z: number; a: Road; b: Road; ea: Pt; eb: Pt }
/** All crossings / T-junctions between roads (segment x segment and ring x segment). */
export function intersections(roads: Road[]): Junction[] {
  const out: Junction[] = [], segs = roads.filter(r => !isRing(r)), rings = roads.filter(isRing), tol = 0.6;
  for (let i = 0; i < segs.length; i++) for (let j = i + 1; j < segs.length; j++) {
    const a = segs[i], b = segs[j], da = roadDir(a), db = roadDir(b), cr = da[0] * db[1] - da[1] * db[0]; if (Math.abs(cr) < 1e-6) continue;
    const qx = b.x0 - a.x0, qz = b.z0 - a.z0, t = (qx * db[1] - qz * db[0]) / cr, s = (qx * da[1] - qz * da[0]) / cr;
    if (t >= -tol && t <= roadLen(a) + tol && s >= -tol && s <= roadLen(b) + tol) out.push({ x: a.x0 + t * da[0], z: a.z0 + t * da[1], a, b, ea: da, eb: db });
  }
  for (const rg of rings) for (const s of segs) {
    const d = roadDir(s), L = roadLen(s);
    for (const t of lineCircle([s.x0, s.z0], d, rg.x0, rg.z0, rg.x1)) if (t >= -tol && t <= L + tol) {
      const x = s.x0 + t * d[0], z = s.z0 + t * d[1], rx = x - rg.x0, rz = z - rg.z0, R = Math.hypot(rx, rz) || 1;
      out.push({ x, z, a: rg, b: s, ea: [-rz / R, rx / R], eb: d });
    }
  }
  return out;
}

/* ───────── render pieces ───────── */
export interface Strip { x: number; z: number; len: number; w: number; rot: number }
export interface Arc { cx: number; cz: number; rIn: number; rOut: number; a0: number; a1: number }
const yaw = (d: Pt) => Math.atan2(-d[1], d[0]);
export function roadPieces(roads: Road[]) {
  return { strips: roads.filter(r => !isRing(r)).map<Strip>(r => ({ x: (r.x0 + r.x1) / 2, z: (r.z0 + r.z1) / 2, len: roadLen(r), w: r.w, rot: yaw(roadDir(r)) })), rings: roads.filter(isRing) };
}
/** 3 m sidewalks on both sides of every road, trimmed wherever another road crosses. */
export function sidewalkPieces(roads: Road[]): { strips: Strip[]; arcs: Arc[] } {
  const segs = roads.filter(r => !isRing(r)), rings = roads.filter(isRing), strips: Strip[] = [], arcs: Arc[] = [];
  for (const r of segs) {
    const d = roadDir(r), n: Pt = [-d[1], d[0]], L = roadLen(r);
    for (const sd of [-1, 1]) {
      const o = sd * (r.w / 2 + 1.5), p0: Pt = [r.x0 + n[0] * o, r.z0 + n[1] * o], cuts: [number, number][] = [];
      for (const q of roads) {
        if (q === r) continue;
        if (isRing(q)) { lineAnnulus(p0, d, q.x0, q.z0, q.x1 - q.w / 2 - 3, q.x1 + q.w / 2 + 3).forEach(iv => cuts.push(iv)); continue; }
        const dq = roadDir(q), cr = d[0] * dq[1] - d[1] * dq[0]; if (Math.abs(cr) < 1e-6) continue;
        const qx = q.x0 - p0[0], qz = q.z0 - p0[1], t = (qx * dq[1] - qz * dq[0]) / cr, s = (qx * d[1] - qz * d[0]) / cr;
        if (s < -1e-3 || s > roadLen(q) + 1e-3) continue;
        const hw = (q.w / 2 + (r.id > q.id ? 3 : 0)) / Math.abs(cr); cuts.push([t - hw, t + hw]);
      }
      for (const [a, b] of subtractIntervals(0, L, cuts)) strips.push({ x: p0[0] + d[0] * (a + b) / 2, z: p0[1] + d[1] * (a + b) / 2, len: b - a, w: 3, rot: yaw(d) });
    }
  }
  for (const rg of rings) for (const side of [-1, 1]) {
    const R = rg.x1, rIn = side < 0 ? R - rg.w / 2 - 3 : R + rg.w / 2, rOut = side < 0 ? R - rg.w / 2 : R + rg.w / 2 + 3, TWO = Math.PI * 2, cuts: [number, number][] = [];
    for (const s of segs) {
      const d = roadDir(s), L = roadLen(s);
      for (const t of lineCircle([s.x0, s.z0], d, rg.x0, rg.z0, R)) {
        if (t < -0.6 || t > L + 0.6) continue;
        const x = s.x0 + t * d[0], z = s.z0 + t * d[1], phi = (Math.atan2(z - rg.z0, x - rg.x0) + TWO) % TWO, tan: Pt = [-(z - rg.z0) / R, (x - rg.x0) / R], sinA = Math.abs(d[0] * tan[1] - d[1] * tan[0]) || 1e-3, dl = (s.w / 2) / sinA / R;
        let has = false; for (const dt of [-2, 2]) { const tt = t + dt; if (tt < 0 || tt > L) continue; const rr = Math.hypot(s.x0 + tt * d[0] - rg.x0, s.z0 + tt * d[1] - rg.z0); if (side < 0 ? rr < R : rr > R) has = true; }
        if (!has) continue; cuts.push([phi - dl, phi + dl], [phi - dl + TWO, phi + dl + TWO], [phi - dl - TWO, phi + dl - TWO]);
      }
    }
    for (const [a, b] of subtractIntervals(0, TWO, cuts, 0.4 / R)) arcs.push({ cx: rg.x0, cz: rg.z0, rIn, rOut, a0: a, a1: b });
  }
  return { strips, arcs };
}

/* ───────── network validation ───────── */
export interface NetworkReport { connected: boolean; components: string[][]; unreachable: string[]; overlaps: string[]; plots: number; roads: number }
/** Validates the layout from the actual plot and road geometry (connectivity, frontage access, overlaps). */
export function validateNetwork(l: Layout): NetworkReport {
  const par = new Map(l.roads.map(r => [r.id, r.id])), find = (x: string): string => { while (par.get(x) !== x) { par.set(x, par.get(par.get(x)!)!); x = par.get(x)!; } return x; };
  for (const j of intersections(l.roads)) par.set(find(j.a.id), find(j.b.id));
  const groups = new Map<string, string[]>(); l.roads.forEach(r => { const k = find(r.id); groups.set(k, [...(groups.get(k) || []), r.id]); });
  const components = Array.from(groups.values()).sort((a, b) => b.length - a.length);
  const unreachable: string[] = [], overlaps: string[] = [], rects = l.plots.map(plotRect), polys = l.plots.map(p => plotPoly(p));
  l.plots.forEach((p, i) => {
    if (!p.landmark) { const [fx, fz] = toWorld(p, 0, p.d / 2 + 2), nr = nearestRoad(l.roads, fx, fz); if (!nr || nr.d > 3.6) unreachable.push(p.id); }
    for (let j = i + 1; j < l.plots.length; j++) if (rectOverlap(rects[i], rects[j]) && polysOverlap(polys[i], polys[j])) overlaps.push(`${p.id} overlaps ${l.plots[j].id}`);
    for (const r of l.roads) if (rectOverlap(rects[i], roadRect(r)) && plotHitsRoad(p, r, 0)) overlaps.push(`${p.id} overlaps road ${r.id}`);
    for (const o of OBSTACLES) { const [mn] = polyRadialRange(polys[i], o.cx, o.cz); if (mn < o.r && !p.landmark) overlaps.push(`${p.id} overlaps ${o.name}`); }
  });
  return { connected: components.length <= 1, components, unreachable, overlaps, plots: l.plots.length, roads: l.roads.length };
}

export const useLayout = create<{ layout: Layout; loaded: boolean; set: (l: Layout) => void }>((set) => ({ layout: baseLayout(), loaded: false, set: (layout) => set({ layout, loaded: true }) }));

/* ───────── admin editing helpers (pure, also used by tests) ───────── */
export interface Check { errors: string[]; warnings: string[] }
/** Validate adding/moving a plot: size, overlaps (plots, roads, plaza) and whether its entrance faces a road. */
export function checkPlot(l: Layout, p: Plot): Check {
  const errors: string[] = [], warnings: string[] = [];
  if (![p.x, p.z, p.rot, p.w, p.d].every(Number.isFinite)) return { errors: ['All plot values must be numbers.'], warnings };
  if (p.w < 12 || p.w > 60 || p.d < 12 || p.d > 60) errors.push('Plot width and depth must be between 12 and 60 m.');
  const P = plotPoly(p), R = polyRect(P);
  for (const o of l.plots) if (o.id !== p.id && rectOverlap(R, plotRect(o)) && polysOverlap(P, plotPoly(o))) { errors.push(`Overlaps plot ${o.id}.`); break; }
  for (const r of l.roads) if (rectOverlap(R, roadRect(r)) && plotHitsRoad(p, r, 0)) { errors.push(`Overlaps road ${r.id}.`); break; }
  for (const o of OBSTACLES) if (!p.landmark && polyRadialRange(P, o.cx, o.cz)[0] < o.r) errors.push(`Overlaps ${o.name}.`);
  if (!p.landmark) { const [fx, fz] = toWorld(p, 0, p.d / 2 + 2), nr = nearestRoad(l.roads, fx, fz); if (!nr || nr.d > 3.6) errors.push('Entrance does not face a road or sidewalk. Use “Snap entrance to nearest road”.'); }
  return { errors, warnings };
}
/** Validate adding/editing a road: no overlap with plots or the plaza, and it must join the existing network. */
export function checkRoad(l: Layout, r: Road): Check {
  const errors: string[] = [], warnings: string[] = [];
  if (![r.x0, r.z0, r.x1, r.z1, r.w].every(Number.isFinite)) return { errors: ['All road values must be numbers.'], warnings };
  if (r.w < 4 || r.w > 24) errors.push('Road width must be between 4 and 24 m.');
  if (isRing(r)) { if (r.x1 < 20) errors.push('Ring radius must be at least 20 m.'); }
  else if (roadLen(r) < 2) errors.push('Road must be at least 2 m long.');
  if (!errors.length) {
    const RR = roadRect(r);
    for (const p of l.plots) if (rectOverlap(RR, plotRect(p)) && plotHitsRoad(p, r, 0)) { errors.push(`Overlaps plot ${p.id}.`); break; }
    if (!isRing(r)) for (const o of OBSTACLES) if (polyRadialRange(roadPoly(r), o.cx, o.cz)[0] < o.r) errors.push(`Overlaps ${o.name}.`);
    const others = l.roads.filter(q => q.id !== r.id);
    if (!intersections([r, ...others]).some(j => j.a === r || j.b === r)) warnings.push('This road does not touch any other road, so it would be disconnected from the city network.');
  }
  return { errors, warnings };
}
/** Rotate a plot so its entrance (local +z) faces the closest point on the nearest road. */
export function snapPlotToRoad(l: Layout, p: Plot): Plot {
  let best: { x: number; z: number; d: number } | null = null;
  for (const r of l.roads) {
    let qx: number, qz: number;
    if (isRing(r)) { const dx = p.x - r.x0, dz = p.z - r.z0, L = Math.hypot(dx, dz) || 1; qx = r.x0 + (dx / L) * r.x1; qz = r.z0 + (dz / L) * r.x1; }
    else { const d = roadDir(r), t = Math.max(0, Math.min(roadLen(r), (p.x - r.x0) * d[0] + (p.z - r.z0) * d[1])); qx = r.x0 + d[0] * t; qz = r.z0 + d[1] * t; }
    const dist = Math.hypot(qx - p.x, qz - p.z); if (!best || dist < best.d) best = { x: qx, z: qz, d: dist };
  }
  return best ? { ...p, rot: Math.round(Math.atan2(best.x - p.x, best.z - p.z) * 1e6) / 1e6 } : p;
}
