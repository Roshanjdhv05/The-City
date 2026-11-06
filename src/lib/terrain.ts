import type { Rect } from './layout';

/** Deterministic value noise (no dependencies). */
const hash = (x: number, z: number) => { let h = Math.imul(x | 0, 374761393) + Math.imul(z | 0, 668265263); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967295; };
function vnoise(x: number, z: number) {
  const xi = Math.floor(x), zi = Math.floor(z), xf = x - xi, zf = z - zi, u = xf * xf * (3 - 2 * xf), v = zf * zf * (3 - 2 * zf);
  const a = hash(xi, zi), b = hash(xi + 1, zi), c = hash(xi, zi + 1), d = hash(xi + 1, zi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
export const fbm = (x: number, z: number, o = 3) => { let s = 0, a = 0.5, f = 1, n = 0; for (let i = 0; i < o; i++) { s += a * vnoise(x * f, z * f); n += a; f *= 2; a *= 0.5; } return s / n; };
const smooth = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
export const WATER_Y = -0.28;

export interface Terrain {
  city: Rect; size: number; version: number;
  height(x: number, z: number): number;
  riverX(z: number): number; riverDist(x: number, z: number): number;
  forest(x: number, z: number): number; outside(x: number, z: number): number;
}
let tid = 0;
/** Terrain is dead flat (y = 0) under the city so every building, road and plot keeps its coordinates; hills, mountains and a river grow outside it. */
export function makeTerrain(city: Rect): Terrain {
  const outside = (x: number, z: number) => Math.hypot(Math.max(city.x0 - x, 0, x - city.x1), Math.max(city.z0 - z, 0, z - city.z1));
  const riverX = (z: number) => city.x1 + 100 + 22 * Math.sin(z * 0.018) + 9 * Math.sin(z * 0.05 + 1);
  const riverDist = (x: number, z: number) => Math.abs(x - riverX(z));
  const height = (x: number, z: number) => {
    const d = outside(x, z); if (d <= 0) return 0;
    const t = smooth(42, 170, d), m = smooth(190, 340, d);
    const ridge = 1 - Math.abs(2 * fbm(x * 0.006 + 9, z * 0.006 + 4, 3) - 1);
    let h = t * (1.5 + 15 * fbm(x * 0.011 + 3, z * 0.011 - 5, 3)) + m * (24 + 90 * Math.pow(ridge, 1.4));
    const c = 1 - smooth(8, 20, riverDist(x, z)); if (c > 0) h = h * (1 - c) + -0.95 * c;
    return h;
  };
  const forest = (x: number, z: number) => fbm(x * 0.018 + 50, z * 0.018 + 50, 3);
  const size = Math.max(1150, Math.max(city.x1 - city.x0, city.z1 - city.z0) + 1100);
  return { city, size, version: ++tid, height, riverX, riverDist, forest, outside };
}
let cache: { key: string; t: Terrain } | null = null;
export function terrainFor(city: Rect): Terrain { const key = [city.x0, city.x1, city.z0, city.z1].join(','); if (!cache || cache.key !== key) cache = { key, t: makeTerrain(city) }; return cache.t; }

/** Pastel vertex colour for the low-poly terrain. */
export function terrainColor(h: number, slope: number, rd: number): [number, number, number] {
  const hex = (s: string) => [parseInt(s.slice(1, 3), 16) / 255, parseInt(s.slice(3, 5), 16) / 255, parseInt(s.slice(5, 7), 16) / 255] as [number, number, number];
  const mix = (a: [number, number, number], b: [number, number, number], t: number): [number, number, number] => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  let c = hex('#7fb866');
  if (h > 6) c = mix(c, hex('#66a455'), smooth(6, 20, h));
  if (h > 30) c = mix(c, hex('#9f98a8'), smooth(30, 48, h));
  if (h > 62) c = mix(c, hex('#e6edf3'), smooth(62, 76, h));
  if (slope > 0.9 && h > 12) c = mix(c, hex('#948d9e'), Math.min(1, (slope - 0.9) * 1.5));
  if (h < 0.35 && rd < 26) c = mix(c, hex('#d6c08e'), Math.min(1, 1 - smooth(-0.9, 0.35, h) * 0.2));
  return c;
}
