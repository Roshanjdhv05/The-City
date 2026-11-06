import type { Plot, Road, StoreConfig, Place, Store } from './types';
import { generateCity, CITY, PRICE } from './city';

export { PRICE };
export const BLD_W = 10, BLD_D = 8, GH = 4.5, FH = 3.4, LV = 3.4, CELL = 2, GRID = 5;
export const PLAZA = { x: 0, z: 0, r: CITY.plazaR };
/** Circular features new plots/roads must not overlap. */
export const OBSTACLES = [{ id: 'Plaza', name: 'Civic Plaza', cx: 0, cz: 0, r: CITY.plazaR }];

const GEN = generateCity();
export const BASE_PLOTS: Plot[] = GEN.plots;
export const BASE_ROADS: Road[] = GEN.roads;
export const plotById = (id: string) => BASE_PLOTS.find(p => p.id === id);

/** local (lx,lz) in plot space -> world. Local +z faces the street. */
export function toWorld(p: { x: number; z: number; rot: number }, lx: number, lz: number): [number, number] {
  const c = Math.cos(p.rot), s = Math.sin(p.rot);
  return [p.x + lx * c + lz * s, p.z - lx * s + lz * c];
}

// ---------- building footprint / placement ----------
export function footprint(cfg: Pick<StoreConfig, 'template' | 'mode'>) {
  if (cfg.mode === 'modular') return { w: GRID * CELL, d: GRID * CELL, door: (GRID * CELL) / 2 + 0.4 };
  if (cfg.template === 'jenterprise') return { w: 24, d: 15, door: 9.5 };
  if (cfg.template === 'bungalow') return { w: 20, d: 14, door: 9 };
  if (cfg.template === 'central')  return { w: 16, d: 12, door: 9.5 };
  return { w: BLD_W, d: BLD_D, door: BLD_D / 2 + 0.4 };
}
export function defaultPlace(plot: Plot, cfg: Pick<StoreConfig, 'template' | 'mode'>): Place {
  const f = footprint(cfg), lim = Math.max(0, plot.d / 2 - f.d / 2);
  return { ox: 0, oz: Math.max(-lim, Math.min(lim, (plot.d - 12) / 2)), rot: 0 };
}
export const getPlace = (plot: Plot, cfg: StoreConfig): Place => cfg.place || defaultPlace(plot, cfg);

/** Returns an error message if the building would leave its plot, else null. */
export function placementError(plot: Plot, cfg: StoreConfig, place: Place = getPlace(plot, cfg)): string | null {
  const f = footprint(cfg), odd = place.rot % 2 !== 0, hw = (odd ? f.d : f.w) / 2, hd = (odd ? f.w : f.d) / 2;
  if (Math.abs(place.ox) + hw > plot.w / 2 + 1e-6 || Math.abs(place.oz) + hd > plot.d / 2 + 1e-6)
    return `Building (${f.w}×${f.d} m) would extend outside plot ${plot.id} (${plot.w}×${plot.d} m).`;
  return null;
}
/** World-space oriented footprint of a building (plot rotation + building quarter-turns). */
export function buildingOBB(plot: Plot, cfg: StoreConfig) {
  const pl = getPlace(plot, cfg), f = footprint(cfg), odd = pl.rot % 2 !== 0, [cx, cz] = toWorld(plot, pl.ox, pl.oz);
  return { cx, cz, hw: (odd ? f.d : f.w) / 2, hd: (odd ? f.w : f.d) / 2, a: plot.rot + (pl.rot * Math.PI) / 2 };
}
/** World position of the storefront interaction point. */
export function storeDoor(plot: Plot, cfg: StoreConfig): [number, number] {
  const pl = getPlace(plot, cfg), f = footprint(cfg), a = (pl.rot * Math.PI) / 2, c = Math.cos(a), s = Math.sin(a);
  return toWorld(plot, pl.ox + f.door * s, pl.oz + f.door * c);
}
/** Interaction point for an empty plot: just in front of its For Sale board. */
export const plotFront = (p: Plot): [number, number] => toWorld(p, 0, p.d / 2 + 1.6);

/** Solid decorative blocks of the J Enterprise forecourt, in building-local coordinates. */
export const JE_BLOCKS = [
  { k: 'sign1', x: -8.5, z: 11, w: 6.4, d: 0.7, h: 2.3 }, { k: 'sign2', x: 9.8, z: 11, w: 2.6, d: 0.6, h: 5.2 },
  { k: 'bed', x: -8.5, z: 12.9, w: 10, d: 1.6, h: 0.55 }, { k: 'bed', x: 9.8, z: 12.9, w: 9, d: 1.6, h: 0.55 },
];

export type Collider =
  | { t: 'box'; x0: number; x1: number; z0: number; z1: number }
  | { t: 'circle'; x: number; z: number; r: number }
  | { t: 'obb'; cx: number; cz: number; hw: number; hd: number; c: number; s: number };
const obb = (cx: number, cz: number, hw: number, hd: number, a: number): Collider => ({ t: 'obb', cx, cz, hw, hd, c: Math.cos(a), s: Math.sin(a) });

export function buildColliders(plots: Map<string, Plot>, stores: Store[], extra: { x: number; z: number; r: number }[]): Collider[] {
  const out: Collider[] = [];
  for (const s of stores) {
    const p = plots.get(s.plotId); if (!p) continue;
    const b = buildingOBB(p, s.config); out.push(obb(b.cx, b.cz, b.hw, b.hd, b.a));
    if (s.config.template === 'jenterprise' && s.config.mode !== 'modular') {
      const pl = getPlace(p, s.config), ba = (pl.rot * Math.PI) / 2, c = Math.cos(ba), sn = Math.sin(ba);
      for (const k of JE_BLOCKS) { const lx = k.x * c + k.z * sn, lz = -k.x * sn + k.z * c, [wx, wz] = toWorld(p, pl.ox + lx, pl.oz + lz); out.push(obb(wx, wz, k.w / 2, k.d / 2, b.a)); }
    }
  }
  for (const e of extra) out.push({ t: 'circle', ...e });
  return out;
}
