import type { Layout } from './layout';
import type { Plot, Store } from './types';
import { SEED_STORES } from './seeds';

const seedIds = new Set(SEED_STORES.map(s => s.plotId));
export interface DistrictStat { name: string; plots: number; occupied: number; available: number; visits: number; firstStore?: string }

/** Every figure is derived from the shared layout + stores; nothing is hard-coded. */
export function computeStats(layout: Layout, stores: Store[]) {
  const occ = new Set(stores.filter(s => layout.byId.has(s.plotId) && s.ownerId).map(s => s.plotId));
  const hasStore = new Set(stores.filter(s => layout.byId.has(s.plotId)).map(s => s.plotId));
  const state = (p: Plot) => (occ.has(p.id) ? 'occupied' : p.status === 'reserved' ? 'reserved' : 'available');
  const available = layout.plots.filter(p => state(p) === 'available'), reserved = layout.plots.filter(p => state(p) === 'reserved');
  const districts = new Map<string, DistrictStat>();
  for (const p of layout.plots) {
    const d = districts.get(p.district) || { name: p.district, plots: 0, occupied: 0, available: 0, visits: 0 };
    d.plots++;
    if (occ.has(p.id)) { d.occupied++; d.firstStore ||= p.id; d.visits += stores.find(s => s.plotId === p.id)?.visits || 0; }
    else if (state(p) === 'available') { d.available++; if (hasStore.has(p.id)) d.firstStore ||= p.id; }
    districts.set(p.district, d);
  }
  const ranked = stores.filter(s => layout.byId.has(s.plotId)).sort((a, b) => b.visits - a.visits);
  const tierRank = { corner: 0, featured: 1, premium: 2, free: 3 } as const;
  const premium = available.filter(p => p.tier !== 'free').sort((a, b) => tierRank[a.tier] - tierRank[b.tier] || b.price - a.price);
  const recent = stores.filter(s => s.createdAt && layout.byId.has(s.plotId) && !(seedIds.has(s.plotId) && !s.ownerId)).sort((a, b) => +new Date(b.createdAt!) - +new Date(a.createdAt!));
  return {
    businesses: hasStore.size, plots: layout.plots.length, available: available.length, reserved: reserved.length, districts: districts.size, regions: layout.regions.length,
    visits: stores.reduce((a, s) => a + s.visits, 0), featured: ranked, premium, recent, popularDistricts: Array.from(districts.values()).sort((a, b) => b.visits - a.visits || b.occupied - a.occupied), state,
  };
}
