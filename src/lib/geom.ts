/** Pure 2-D geometry (x,z plane) shared by the layout, the generator, validators and physics. No imports. */
export type Pt = [number, number];
export type Rect = { x0: number; x1: number; z0: number; z1: number };
export const D2R = Math.PI / 180;
/** Compass bearing (degrees clockwise from north = -z) -> unit vector. */
export const bearingDir = (b: number): Pt => [Math.sin(b * D2R), -Math.cos(b * D2R)];
export const polar = (r: number, b: number): Pt => [r * Math.sin(b * D2R), -r * Math.cos(b * D2R)];

/** Oriented box: centre c, unit axes e1/e2, half sizes h1/h2 -> 4 corners (counter-clockwise). */
export function box(cx: number, cz: number, e1: Pt, e2: Pt, h1: number, h2: number): Pt[] {
  return [[cx - e1[0] * h1 - e2[0] * h2, cz - e1[1] * h1 - e2[1] * h2], [cx + e1[0] * h1 - e2[0] * h2, cz + e1[1] * h1 - e2[1] * h2], [cx + e1[0] * h1 + e2[0] * h2, cz + e1[1] * h1 + e2[1] * h2], [cx - e1[0] * h1 + e2[0] * h2, cz - e1[1] * h1 + e2[1] * h2]];
}
/** Plot local axes: x -> (cos r, -sin r), z (front) -> (sin r, cos r). Matches toWorld(). */
export const plotAxes = (rot: number): [Pt, Pt] => [[Math.cos(rot), -Math.sin(rot)], [Math.sin(rot), Math.cos(rot)]];
export function plotPoly(p: { x: number; z: number; w: number; d: number; rot: number }, m = 0): Pt[] { const [a, b] = plotAxes(p.rot); return box(p.x, p.z, a, b, p.w / 2 + m, p.d / 2 + m); }
export const polyRect = (P: Pt[]): Rect => ({ x0: Math.min(...P.map(p => p[0])), x1: Math.max(...P.map(p => p[0])), z0: Math.min(...P.map(p => p[1])), z1: Math.max(...P.map(p => p[1])) });

/** Convex polygon overlap (separating axis theorem). Touching counts as not overlapping. */
export function polysOverlap(A: Pt[], B: Pt[], eps = 1e-6): boolean {
  for (const P of [A, B]) for (let i = 0; i < P.length; i++) {
    const a = P[i], b = P[(i + 1) % P.length], nx = -(b[1] - a[1]), nz = b[0] - a[0], len = Math.hypot(nx, nz) || 1;
    let a0 = 1e18, a1 = -1e18, b0 = 1e18, b1 = -1e18;
    for (const q of A) { const t = (q[0] * nx + q[1] * nz) / len; a0 = Math.min(a0, t); a1 = Math.max(a1, t); }
    for (const q of B) { const t = (q[0] * nx + q[1] * nz) / len; b0 = Math.min(b0, t); b1 = Math.max(b1, t); }
    if (a1 <= b0 + eps || b1 <= a0 + eps) return false;
  }
  return true;
}
export function pointInPoly(P: Pt[], x: number, z: number): boolean {
  let s = 0; for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length], c = (b[0] - a[0]) * (z - a[1]) - (b[1] - a[1]) * (x - a[0]); if (c !== 0) { if (s && Math.sign(c) !== s) return false; s = Math.sign(c); } }
  return true;
}
export function distPointSeg(px: number, pz: number, x0: number, z0: number, x1: number, z1: number): number {
  const dx = x1 - x0, dz = z1 - z0, l2 = dx * dx + dz * dz, t = l2 ? Math.max(0, Math.min(1, ((px - x0) * dx + (pz - z0) * dz) / l2)) : 0;
  return Math.hypot(px - (x0 + t * dx), pz - (z0 + t * dz));
}
/** Smallest and largest distance from (cx,cz) to a convex polygon. */
export function polyRadialRange(P: Pt[], cx: number, cz: number): [number, number] {
  let mx = 0, mn = pointInPoly(P, cx, cz) ? 0 : 1e18;
  for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length]; mx = Math.max(mx, Math.hypot(a[0] - cx, a[1] - cz)); if (mn > 0) mn = Math.min(mn, distPointSeg(cx, cz, a[0], a[1], b[0], b[1])); }
  return [mn, mx];
}
/** Parameters t where the line p0 + t*d (|d| = 1) meets the circle of radius r about (cx,cz). */
export function lineCircle(p0: Pt, d: Pt, cx: number, cz: number, r: number): number[] {
  const fx = p0[0] - cx, fz = p0[1] - cz, b = fx * d[0] + fz * d[1], c = fx * fx + fz * fz - r * r, disc = b * b - c;
  if (disc < 0) return []; const s = Math.sqrt(disc); return [-b - s, -b + s];
}
/** Intervals of t where the line lies inside the annulus rIn..rOut. */
export function lineAnnulus(p0: Pt, d: Pt, cx: number, cz: number, rIn: number, rOut: number): [number, number][] {
  const o = lineCircle(p0, d, cx, cz, rOut); if (!o.length) return [];
  const i = rIn > 0 ? lineCircle(p0, d, cx, cz, rIn) : []; return i.length ? [[o[0], i[0]], [i[1], o[1]]] : [[o[0], o[1]]];
}
export function subtractIntervals(a0: number, a1: number, cuts: [number, number][], minLen = 0.6): [number, number][] {
  let segs: [number, number][] = [[a0, a1]];
  for (const [c0, c1] of cuts) segs = segs.flatMap(([s0, s1]) => (c1 <= s0 || c0 >= s1 ? [[s0, s1]] : ([[s0, Math.min(s1, c0)], [Math.max(s0, c1), s1]] as [number, number][]).filter(([p, q]) => q - p > minLen)));
  return segs;
}
export const rectOverlap = (a: Rect, b: Rect, m = 0) => a.x0 < b.x1 + m && a.x1 > b.x0 - m && a.z0 < b.z1 + m && a.z1 > b.z0 - m;
export const wrapPi = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));
