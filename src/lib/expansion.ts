import type { Plot, Road, Region, Tier } from './types';
import { Layout, isRing, roadDir, roadLen, bandHit } from './layout';
import { OBSTACLES, PRICE } from './plots';
import { plotHitsRoad, roadPoly } from './city';
import { Rect, Pt, plotPoly, polysOverlap, polyRadialRange, polyRect, rectOverlap } from './geom';

export interface ExpandParams { anchorId?: string; rows: number; cols: number; plotW: number; plotD: number; spacing: number; roadW: number; tier: Tier; district: string; category: string }
export const DEFAULT_PARAMS: ExpandParams = { rows: 2, cols: 4, plotW: 12, plotD: 13.6, spacing: 2, roadW: 12, tier: 'premium', district: 'New District', category: 'Mixed' };
export const LIMITS = { rows: [1, 12], cols: [1, 20], plotW: [12, 40], plotD: [12, 40], spacing: [0, 10], roadW: [6, 16] } as const;

export interface Anchor { id: string; x: number; z: number; w: number; dir: Pt; clear: number; label: string; letter: string }
const OCT = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
const bearingOf = (d: Pt) => (Math.round((Math.atan2(d[0], -d[1]) * 180) / Math.PI) + 360) % 360;
const letterOf = (d: Pt) => OCT[Math.round(bearingOf(d) / 45) % 8];

/** Where a new district can attach: gates on the outermost ring road, plus any open road end (e.g. the stub of an earlier expansion). */
export function anchorsFor(layout: Layout): Anchor[] {
  const out: Anchor[] = [], rings = layout.roads.filter(isRing).sort((a, b) => b.x1 - a.x1), outer = rings[0];
  if (outer) for (const r of layout.roads) {
    if (isRing(r)) continue;
    for (const [px, pz, qx, qz] of [[r.x0, r.z0, r.x1, r.z1], [r.x1, r.z1, r.x0, r.z0]]) {
      const rp = Math.hypot(px - outer.x0, pz - outer.z0), rq = Math.hypot(qx - outer.x0, qz - outer.z0);
      if (Math.abs(rp - outer.x1) < 1 && rq < outer.x1 - 5) { const d: Pt = [(px - outer.x0) / rp, (pz - outer.z0) / rp]; out.push({ id: `${r.id}@${outer.id}`, x: px, z: pz, w: r.w, dir: d, clear: outer.w / 2, label: `Outer ring gate · bearing ${bearingOf(d)}° (${r.id})`, letter: letterOf(d) }); }
    }
  }
  for (const r of layout.roads) {
    if (isRing(r)) continue; const d = roadDir(r);
    for (const [end, sgn] of [[[r.x1, r.z1], 1], [[r.x0, r.z0], -1]] as [Pt, number][]) {
      if (bandHit(layout.roads, end[0], end[1], 0.5, r.id)) continue;
      const dd: Pt = [d[0] * sgn, d[1] * sgn]; out.push({ id: `${r.id}:${sgn > 0 ? 'end' : 'start'}`, x: end[0], z: end[1], w: r.w, dir: dd, clear: r.w / 2, label: `${r.id} open end · bearing ${bearingOf(dd)}°`, letter: letterOf(dd) });
    }
  }
  return out.sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true }));
}

export interface ExpansionPlan { region: Region; plots: Plot[]; roads: Road[]; errors: string[]; bounds: Rect | null }

export function planExpansion(layout: Layout, p: ExpandParams): ExpansionPlan {
  const errors: string[] = [];
  (Object.keys(LIMITS) as (keyof typeof LIMITS)[]).forEach(k => { const v = p[k] as number; if (!Number.isFinite(v) || v < LIMITS[k][0] || v > LIMITS[k][1]) errors.push(`${k} must be between ${LIMITS[k][0]} and ${LIMITS[k][1]}.`); });
  if (!p.district.trim()) errors.push('District name is required.');
  const anchors = anchorsFor(layout), anchor = anchors.find(a => a.id === p.anchorId) || anchors[0];
  if (!anchor) errors.push('No open road end or ring gate is available to attach to.');
  if (errors.length || !anchor) return { region: { id: '', name: p.district, direction: '' }, plots: [], roads: [], errors, bounds: null };

  const U = anchor.dir, V: Pt = [-U[1], U[0]], letter = anchor.letter;
  let seq = 1; while (layout.regions.some(r => r.id === `${letter}${seq}`) || layout.plots.some(q => q.id.startsWith(`${letter}${seq}-`))) seq++;
  const rid = `${letter}${seq}`, at = (u: number, v: number): Pt => [anchor.x + U[0] * u + V[0] * v, anchor.z + U[1] * u + V[1] * v];
  const rw = p.roadW, sw = 3, edge = rw / 2 + sw + 1, pitchV = p.plotW + p.spacing, streets = Math.ceil(p.rows / 2), cl = Math.ceil(p.cols / 2), cr = Math.floor(p.cols / 2);
  const lenL = edge + cl * pitchV - p.spacing + 3, lenR = cr ? edge + cr * pitchV - p.spacing + 3 : rw / 2 + 4;
  const us0 = anchor.clear + sw + 0.5 + p.plotD + rw / 2 + sw, pitchU = 2 * (rw / 2 + sw + p.plotD) + 1;
  const plots: Plot[] = [], roads: Road[] = []; let n = 1, uEnd = 0;
  const mk = (u: number, v: number, rot: number): Plot => { const [x, z] = at(u, v); return { id: `${rid}-${String(n++).padStart(2, '0')}`, district: p.district, category: p.category, tier: p.tier, price: PRICE[p.tier], x: +x.toFixed(2), z: +z.toFixed(2), rot: +rot.toFixed(6), w: p.plotW, d: p.plotD, status: 'available', region: rid }; };
  for (let s = 0; s < streets; s++) {
    const us = us0 + s * pitchU, off = rw / 2 + sw + p.plotD / 2, rotA = Math.atan2(U[0], U[1]), rotB = Math.atan2(-U[0], -U[1]);
    const row = (u: number, rot: number) => { for (let i = 0; i < cl; i++) plots.push(mk(u, -(edge + p.plotW / 2 + i * pitchV), rot)); for (let i = 0; i < cr; i++) plots.push(mk(u, edge + p.plotW / 2 + i * pitchV, rot)); };
    if (2 * s < p.rows) row(us - off, rotA);
    if (2 * s + 1 < p.rows) row(us + off, rotB);
    const a = at(us, -lenL), b = at(us, lenR);
    roads.push({ id: `${rid}-ST${s + 1}`, kind: 'seg', x0: +a[0].toFixed(2), z0: +a[1].toFixed(2), x1: +b[0].toFixed(2), z1: +b[1].toFixed(2), w: rw, region: rid });
    uEnd = us + rw / 2 + sw + p.plotD + 3; // stub runs past the last row so another expansion can chain from here
  }
  const e = at(uEnd, 0);
  roads.unshift({ id: `${rid}-SPINE`, kind: 'seg', x0: +anchor.x.toFixed(2), z0: +anchor.z.toFixed(2), x1: +e[0].toFixed(2), z1: +e[1].toFixed(2), w: rw, region: rid });

  // ---- validation against the real geometry ----
  const seen = new Set(layout.plots.map(q => q.id)), seenR = new Set(layout.roads.map(r => r.id)), rects = layout.plots.map(q => polyRect(plotPoly(q))), polys = layout.plots.map(q => plotPoly(q));
  for (const q of plots) {
    if (seen.has(q.id)) errors.push(`Duplicate plot ID ${q.id}.`); seen.add(q.id);
    const P = plotPoly(q, 0.25), R = polyRect(P);
    for (let i = 0; i < polys.length; i++) if (rectOverlap(R, rects[i]) && polysOverlap(P, polys[i])) { errors.push(`Plot ${q.id} overlaps ${layout.plots[i].id}.`); break; }
    const road = layout.roads.find(rd => plotHitsRoad(q, rd, 0)); if (road) errors.push(`Plot ${q.id} overlaps road ${road.id}.`);
    for (const o of OBSTACLES) if (polyRadialRange(plotPoly(q), o.cx, o.cz)[0] < o.r) errors.push(`Plot ${q.id} overlaps ${o.name}.`);
    for (const rd of roads) if (plotHitsRoad(q, rd, 0)) errors.push(`New road ${rd.id} overlaps new plot ${q.id}.`);
  }
  for (let i = 0; i < plots.length; i++) for (let j = i + 1; j < plots.length; j++) if (polysOverlap(plotPoly(plots[i], 0.25), plotPoly(plots[j]))) errors.push(`New plots ${plots[i].id} and ${plots[j].id} overlap.`);
  for (const rd of roads) {
    if (seenR.has(rd.id)) errors.push(`Duplicate road ID ${rd.id}.`);
    const RP = roadPoly(rd, 0.2), RR = polyRect(RP);
    for (let i = 0; i < polys.length; i++) if (rectOverlap(RR, rects[i]) && polysOverlap(RP, polys[i])) { errors.push(`Road ${rd.id} overlaps plot ${layout.plots[i].id}.`); break; }
    for (const o of OBSTACLES) { const [mn] = polyRadialRange(roadPoly(rd), o.cx, o.cz); if (mn < o.r) errors.push(`Road ${rd.id} overlaps ${o.name}.`); }
  }
  const all = [...plots.map(q => polyRect(plotPoly(q))), ...roads.map(r => polyRect(roadPoly(r)))];
  const bounds = all.length ? { x0: Math.min(...all.map(r => r.x0)), x1: Math.max(...all.map(r => r.x1)), z0: Math.min(...all.map(r => r.z0)), z1: Math.max(...all.map(r => r.z1)) } : null;
  return { region: { id: rid, name: p.district, direction: `${letter} (${bearingOf(U)}°)`, params: p }, plots, roads, errors: Array.from(new Set(errors)).slice(0, 12), bounds };
}
