import { supabase } from './supabase';
import { defaultConfig } from './templates';
import { SEED_STORES, createMarketBuilding } from './seeds';
import { BASE_PLOTS, BASE_ROADS } from './plots';
import { Layout, makeLayout, baseLayout } from './layout';
import type { Store, StoreConfig, User, Plot, Road, Region } from './types';
import type { ExpansionPlan } from './expansion';
import { create } from 'zustand';

export { SEED_STORES };
const LS = 'thecity.stores', LU = 'thecity.user', LSV = 'thecity.seeded17', LSL = 'thecity.layout';
export const DEMO_ADMIN = process.env.NEXT_PUBLIC_DEMO_ADMIN_EMAIL || 'admin@thecity.local';

// ---------------- local (demo) backend ----------------
function local(): Store[] { try { return JSON.parse(localStorage.getItem(LS) || '[]'); } catch { return []; } }
function writeLocal(s: Store[]) { localStorage.setItem(LS, JSON.stringify(s)); }
function ensureSeeded() {
  if (localStorage.getItem('thecity.layoutv') !== '7') {
    localStorage.removeItem(LSL);
    localStorage.removeItem(LSV);
    localStorage.setItem('thecity.layoutv', '7');
  } // circular master plan with exactly 25 locked + 25 available buildings per market, central & hub locked
  if (localStorage.getItem(LSV)) return;
  // platform-owned seeds are refreshed to the current design; visit counters and user-owned stores are kept
  const ids = new Set(BASE_PLOTS.map(p => p.id)), keep = local().filter(s => ids.has(s.plotId) || s.ownerId);
  const merged = keep.map(s => { const seed = SEED_STORES.find(x => x.plotId === s.plotId); return seed && !s.ownerId ? { ...seed, visits: s.visits, clicks: s.clicks } : s; }), have = new Set(merged.map(s => s.plotId));
  writeLocal([...SEED_STORES.filter(s => !have.has(s.plotId)), ...merged]); localStorage.setItem(LSV, '1');
}
interface LocalLayout { plots: Plot[]; roads: Road[]; regions: Region[]; overrides: Record<string, Partial<Plot>>; removedPlots: string[]; removedRoads: string[]; roadEdits: Record<string, Road> }
function localLayout(): LocalLayout { try { return { plots: [], roads: [], regions: [], overrides: {}, removedPlots: [], removedRoads: [], roadEdits: {}, ...JSON.parse(localStorage.getItem(LSL) || '{}') }; } catch { return { plots: [], roads: [], regions: [], overrides: {}, removedPlots: [], removedRoads: [], roadEdits: {} }; } }
const writeLayout = (l: LocalLayout) => localStorage.setItem(LSL, JSON.stringify(l));

const num = (v: any) => Number(v);
const rowPlot = (r: any): Plot => ({ id: r.id, district: r.district, category: r.category, tier: r.tier, price: num(r.price), x: num(r.x), z: num(r.z), rot: num(r.rot), w: num(r.w), d: num(r.d), status: r.status, region: r.region || undefined, landmark: !!r.landmark });
const rowRoad = (r: any): Road => ({ id: r.id, kind: r.kind === 'ring' ? 'ring' : 'seg', x0: num(r.x0), z0: num(r.z0), x1: num(r.x1), z1: num(r.z1), w: num(r.w), region: r.region || undefined });
const rowStore = (r: any): Store => ({ plotId: r.plot_id, ownerId: r.owner_id, config: { ...defaultConfig(r.config?.template === 'jenterprise' ? 'tech' : r.config?.template), ...r.config }, visits: r.visits, clicks: r.clicks, createdAt: r.created_at });

/** Loads the shared world: layout (plots, roads, regions) + stores. Same data feeds the 3D world and /admin. */
export async function loadWorld(): Promise<{ layout: Layout; stores: Store[] }> {
  if (supabase) {
    const [p, r, g, s] = await Promise.all([supabase.from('city_plots').select('*'), supabase.from('city_roads').select('*'), supabase.from('city_regions').select('*'), supabase.from('stores').select('*')]);
    const owned = (s.data || []).map(rowStore);
    if (!p.error && p.data && p.data.length) {
      const plots = p.data.map(rowPlot);
      const ids = new Set(owned.map(x => x.plotId));
      const seeded = SEED_STORES.filter(x => !ids.has(x.plotId));
      const merged = [...seeded, ...owned];
      const mergedIds = new Set(merged.map(x => x.plotId));
      const missing = plots.filter(x => !mergedIds.has(x.id)).map((plot, i) => createMarketBuilding(plot, i));
      return { layout: makeLayout(plots, (r.data || []).map(rowRoad), (g.data || []) as Region[], 'db'), stores: [...merged, ...missing] };
    }
    const ids = new Set(owned.map(x => x.plotId)); // migration not applied yet: fall back to built-in layout
    return { layout: baseLayout(), stores: [...SEED_STORES.filter(x => !ids.has(x.plotId)), ...owned] };
  }
  ensureSeeded();
  const ll = localLayout(), gone = new Set(ll.removedPlots), goneR = new Set(ll.removedRoads);
  const plots = [...BASE_PLOTS, ...ll.plots].filter(p => !gone.has(p.id)).map(p => ({ ...p, ...(ll.overrides[p.id] || {}) }));
  const roads = [...BASE_ROADS, ...ll.roads].filter(r => !goneR.has(r.id)).map(r => ll.roadEdits[r.id] || r);
  const changed = ll.plots.length || ll.roads.length || Object.keys(ll.overrides).length || gone.size || goneR.size || Object.keys(ll.roadEdits).length;
  // Auto-seed any plots that still lack a building (covers stale localStorage + expansion plots)
  let stores = local();
  const seededIds = new Set(stores.map(s => s.plotId));
  const missing = plots.filter(p => !seededIds.has(p.id));
  if (missing.length) {
    const extra = missing.map((p, i) => createMarketBuilding(p, i));
    stores = [...stores, ...extra];
    writeLocal(stores);
  }
  return { layout: makeLayout(plots, roads, ll.regions, changed ? 'local' : 'base'), stores };
}
export async function listStores(): Promise<Store[]> { return (await loadWorld()).stores; }

export async function purchasePlot(plotId: string, user: User, template = 'tech', over: Partial<StoreConfig> = {}): Promise<Store> {
  if (!user || !user.id) {
    throw new Error('You must be signed in with an email account to claim a building.');
  }
  const ll = localLayout();
  const override = ll.overrides[plotId];
  const targetPlot = override ? { ...(BASE_PLOTS.find(p => p.id === plotId) || {}), ...override } : BASE_PLOTS.find(p => p.id === plotId);
  if (targetPlot && targetPlot.status === 'reserved') {
    throw new Error('This building is permanently locked and cannot be claimed.');
  }
  const store: Store = { plotId, ownerId: user.id, visits: 0, clicks: 0, createdAt: new Date().toISOString(), config: defaultConfig(template, { name: 'Your Store', ...over }) };
  if (supabase) {
    // 1 building per email limit check in Supabase
    const { data: existing } = await supabase.from('stores').select('plot_id').eq('owner_id', user.id);
    if (existing && existing.length > 0) {
      throw new Error(`You can only claim 1 building per email (${user.email}). You already own building ${existing[0].plot_id}.`);
    }
    const { error } = await supabase.from('stores').insert({ plot_id: plotId, owner_id: user.id, config: store.config });
    if (error) throw new Error(error.message);
  } else {
    ensureSeeded();
    const l = local();
    if (l.some(s => s.plotId === plotId && s.ownerId)) {
      throw new Error('Plot already owned by another user.');
    }
    // 1 building per email limit check in local demo mode
    const existing = l.find(s => s.ownerId === user.id);
    if (existing) {
      throw new Error(`You can only claim 1 building per email (${user.email}). You already own building ${existing.plotId}.`);
    }
    writeLocal([...l.filter(s => s.plotId !== plotId), store]);
  }
  return store;
}

/** Claim a Central District building for free using promo code Jdhvpromo (unlocks and claims building) */
export async function claimWithPromoCode(
  plotId: string,
  code: string,
  user: User,
  template = 'tech',
  over: Partial<StoreConfig> = {}
): Promise<Store> {
  if (!user || !user.id) {
    throw new Error('You must be signed in with an email account to claim a building.');
  }

  const cleanCode = (code || '').trim();
  if (cleanCode.toUpperCase() !== 'JDHVPROMO') {
    throw new Error('Invalid promo code. Enter code Jdhvpromo to unlock Central District buildings.');
  }

  const ll = localLayout();
  const override = ll.overrides[plotId];
  const targetPlot = override ? { ...(BASE_PLOTS.find(p => p.id === plotId) || {}), ...override } : BASE_PLOTS.find(p => p.id === plotId);

  if (!targetPlot) {
    throw new Error(`Building ${plotId} not found.`);
  }

  // Strictly only valid for Central District buildings
  const isCentral = targetPlot.district.toLowerCase().includes('central') || plotId.startsWith('C0');
  if (!isCentral) {
    throw new Error('Promo code Jdhvpromo is only valid for Central District buildings.');
  }

  const store: Store = {
    plotId,
    ownerId: user.id,
    visits: 0,
    clicks: 0,
    createdAt: new Date().toISOString(),
    config: defaultConfig(template, { name: 'Central Enterprise', ...over }),
  };

  if (supabase) {
    const { error: rpcErr } = await supabase.rpc('claim_with_promo_code', {
      p_plot_id: plotId,
      p_code: cleanCode,
      p_config: store.config,
    });
    if (rpcErr) {
      // Direct fallback if RPC is not yet executed
      const { error: plotErr } = await supabase.from('city_plots').update({ status: 'available' }).eq('id', plotId);
      const { error: storeErr } = await supabase.from('stores').upsert({
        plot_id: plotId,
        owner_id: user.id,
        config: store.config,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'plot_id' });
      if (storeErr) throw new Error(storeErr.message);
    }
  } else {
    ensureSeeded();
    const l = local();
    if (l.some(s => s.plotId === plotId && s.ownerId && s.ownerId !== user.id)) {
      throw new Error('This Central District building has already been claimed by another resident.');
    }

    // 1. Unlock the plot in local layout
    writeLayout({
      ...ll,
      overrides: {
        ...ll.overrides,
        [plotId]: { ...(ll.overrides[plotId] || {}), status: 'available' },
      },
    });

    // 2. Set ownership of the store
    writeLocal([...l.filter(s => s.plotId !== plotId), store]);

    // 3. Record promo redemption locally
    try {
      const redemptions = JSON.parse(localStorage.getItem('thecity.promo_redemptions') || '[]');
      redemptions.push({ code: cleanCode, userId: user.id, userEmail: user.email, plotId, at: new Date().toISOString() });
      localStorage.setItem('thecity.promo_redemptions', JSON.stringify(redemptions));
    } catch {}
  }

  return store;
}
export async function saveStore(plotId: string, config: StoreConfig) {
  if (supabase) { const { error } = await supabase.from('stores').update({ config, updated_at: new Date().toISOString() }).eq('plot_id', plotId); if (error) throw new Error(error.message); }
  else writeLocal(local().map(s => (s.plotId === plotId ? { ...s, config } : s)));
}
export async function trackEvent(plotId: string, kind: 'visit' | 'click') {
  try {
    if (supabase) await supabase.rpc('track_store_event', { p_plot: plotId, p_kind: kind });
    else writeLocal(local().map(s => (s.plotId === plotId ? { ...s, [kind === 'visit' ? 'visits' : 'clicks']: (kind === 'visit' ? s.visits : s.clicks) + 1 } : s)));
  } catch {}
}
export async function uploadLogo(file: File, user: User): Promise<string> {
  if (file.size > 3 * 1024 * 1024) throw new Error('Max file size is 3MB');
  if (supabase) {
    const path = `${user.id}/${Date.now()}-${file.name.replace(/[^\w.]/g, '_')}`;
    const { error } = await supabase.storage.from('logos').upload(path, file, { upsert: true });
    if (error) throw new Error(error.message);
    return supabase.storage.from('logos').getPublicUrl(path).data.publicUrl;
  }
  return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result as string); r.onerror = () => rej(new Error('Read failed')); r.readAsDataURL(file); });
}

// ---------------- admin API (authorization is enforced by Postgres RLS + SECURITY DEFINER functions) ----------------
export async function verifyAdminCredentials(username: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
  const u = (username || '').trim().toLowerCase();
  const p = (password || '').trim();

  // Validate credentials requested: username 'admin', password 'adminjdhv114'
  const isMatch = (u === 'admin' || u === 'admin@thecity.local') && p === 'adminjdhv114';

  if (!isMatch) {
    return { success: false, error: 'Invalid admin username or password.' };
  }

  const adminUser: User = {
    id: 'admin-master',
    email: 'admin@thecity.local',
  };

  if (typeof window !== 'undefined') {
    localStorage.setItem('thecity.admin_session', '1');
    localStorage.setItem(LU, JSON.stringify(adminUser));
  }

  return { success: true, user: adminUser };
}

export async function adminLogout(): Promise<void> {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('thecity.admin_session');
  }
}

export async function isAdmin(user: User | null): Promise<boolean> {
  if (typeof window !== 'undefined' && localStorage.getItem('thecity.admin_session') === '1') {
    return true;
  }
  if (!user) return false;
  if (supabase) { const { data, error } = await supabase.rpc('is_admin'); if (!error && data === true) return true; }
  const em = (user.email || '').toLowerCase();
  return em === 'admin' || em === 'admin@thecity.local' || em === DEMO_ADMIN.toLowerCase();
}
export async function adminExpand(plan: ExpansionPlan) {
  if (plan.errors.length) throw new Error(plan.errors[0]);
  if (supabase) {
    const { error } = await supabase.rpc('admin_expand_city', { p_region: { id: plan.region.id, name: plan.region.name, direction: plan.region.direction, params: plan.region.params || {} }, p_plots: plan.plots, p_roads: plan.roads });
    if (error) throw new Error(error.message); return;
  }
  const ll = localLayout();
  if (ll.regions.some(r => r.id === plan.region.id)) throw new Error('Region ID already exists – reload and retry.');
  writeLayout({ ...ll, plots: [...ll.plots, ...plan.plots], roads: [...ll.roads, ...plan.roads], regions: [...ll.regions, { ...plan.region, created_at: new Date().toISOString() }] });
}
export async function adminUpdatePlot(id: string, patch: Partial<Pick<Plot, 'status' | 'tier' | 'price' | 'category' | 'district'>>) {
  if (supabase) { const { error } = await supabase.from('city_plots').update(patch).eq('id', id); if (error) throw new Error(error.message); return; }
  const ll = localLayout(); writeLayout({ ...ll, overrides: { ...ll.overrides, [id]: { ...(ll.overrides[id] || {}), ...patch } } });
}
export async function adminSaveStore(plotId: string, ownerId: string | null, config: StoreConfig) {
  if (supabase) { const { error } = await supabase.from('stores').upsert({ plot_id: plotId, owner_id: ownerId, config, updated_at: new Date().toISOString() }, { onConflict: 'plot_id' }); if (error) throw new Error(error.message); return; }
  ensureSeeded(); const l = local(), ex = l.find(s => s.plotId === plotId);
  writeLocal(ex ? l.map(s => (s.plotId === plotId ? { ...s, ownerId, config } : s)) : [...l, { plotId, ownerId, config, visits: 0, clicks: 0, createdAt: new Date().toISOString() }]);
}
export async function adminDeleteStore(plotId: string) {
  if (supabase) { const { error } = await supabase.from('stores').delete().eq('plot_id', plotId); if (error) throw new Error(error.message); return; }
  writeLocal(local().filter(s => s.plotId !== plotId));
}
export async function adminMoveStore(from: string, to: string, config: StoreConfig) {
  if (supabase) { const { error } = await supabase.rpc('admin_move_store', { p_from: from, p_to: to, p_config: config }); if (error) throw new Error(error.message); return; }
  const l = local(); if (l.some(s => s.plotId === to)) throw new Error('Target plot already has a building.');
  writeLocal(l.map(s => (s.plotId === from ? { ...s, plotId: to, config } : s)));
}
export async function adminSaveRoad(road: Road, isNew: boolean) {
  if (supabase) { const row = { id: road.id, kind: road.kind || 'seg', x0: road.x0, z0: road.z0, x1: road.x1, z1: road.z1, w: road.w, region: road.region || null }; const { error } = await supabase.from('city_roads').upsert(row, { onConflict: 'id' }); if (error) throw new Error(error.message); return; }
  const ll = localLayout(), isBase = BASE_ROADS.some(r => r.id === road.id);
  if (isNew && (isBase || ll.roads.some(r => r.id === road.id))) throw new Error('Road ID already exists.');
  if (isBase) writeLayout({ ...ll, roadEdits: { ...ll.roadEdits, [road.id]: road } });
  else writeLayout({ ...ll, roads: ll.roads.some(r => r.id === road.id) ? ll.roads.map(r => (r.id === road.id ? road : r)) : [...ll.roads, road] });
}
export async function adminDeleteRoad(id: string) {
  if (supabase) { const { error } = await supabase.from('city_roads').delete().eq('id', id); if (error) throw new Error(error.message); return; }
  const ll = localLayout(); writeLayout({ ...ll, roads: ll.roads.filter(r => r.id !== id), removedRoads: BASE_ROADS.some(r => r.id === id) ? [...ll.removedRoads, id] : ll.removedRoads });
}
export async function adminSavePlot(plot: Plot, isNew: boolean) {
  if (supabase) { const row = { id: plot.id, region: plot.region || null, district: plot.district, category: plot.category, tier: plot.tier, price: plot.price, x: plot.x, z: plot.z, w: plot.w, d: plot.d, rot: plot.rot, status: plot.status, landmark: !!plot.landmark }; const { error } = await supabase.from('city_plots').upsert(row, { onConflict: 'id' }); if (error) throw new Error(error.message); return; }
  const ll = localLayout(), isBase = BASE_PLOTS.some(p => p.id === plot.id);
  if (isNew && (isBase || ll.plots.some(p => p.id === plot.id))) throw new Error('Plot ID already exists.');
  if (isBase) writeLayout({ ...ll, overrides: { ...ll.overrides, [plot.id]: plot } });
  else writeLayout({ ...ll, plots: ll.plots.some(p => p.id === plot.id) ? ll.plots.map(p => (p.id === plot.id ? plot : p)) : [...ll.plots, plot] });
}
export async function adminDeletePlot(id: string) {
  if (local().some(s => s.plotId === id) && !supabase) throw new Error('Remove the building first.');
  if (supabase) { const { count } = await supabase.from('stores').select('plot_id', { count: 'exact', head: true }).eq('plot_id', id); if (count) throw new Error('Remove the building first.'); const { error } = await supabase.from('city_plots').delete().eq('id', id); if (error) throw new Error(error.message); return; }
  const ll = localLayout(); writeLayout({ ...ll, plots: ll.plots.filter(p => p.id !== id), removedPlots: BASE_PLOTS.some(p => p.id === id) ? [...ll.removedPlots, id] : ll.removedPlots });
}
export async function findUserId(email: string): Promise<string | null> {
  if (supabase) { const { data, error } = await supabase.rpc('admin_find_user', { p_email: email }); if (error) throw new Error(error.message); return data || null; }
  return 'demo-' + btoa(email).slice(0, 10);
}
export async function userEmails(ids: string[]): Promise<Record<string, string>> {
  const out: Record<string, string> = {}; if (!ids.length) return out;
  if (supabase) { const { data } = await supabase.rpc('admin_lookup_users', { p_ids: ids }); (data || []).forEach((r: any) => (out[r.id] = r.email)); }
  return out;
}

// ---------------- auth ----------------
interface Auth { user: User | null; ready: boolean; init: () => void; signIn: (e: string, p: string, up: boolean) => Promise<void>; signOut: () => Promise<void> }
export const useAuth = create<Auth>((set) => ({
  user: null, ready: false,
  init: () => {
    if (supabase) {
      supabase.auth.getSession().then(({ data }) => set({ user: data.session ? { id: data.session.user.id, email: data.session.user.email || '' } : null, ready: true }));
      supabase.auth.onAuthStateChange((_e, s) => set({ user: s ? { id: s.user.id, email: s.user.email || '' } : null }));
    } else { try { set({ user: JSON.parse(localStorage.getItem(LU) || 'null'), ready: true }); } catch { set({ ready: true }); } }
  },
  signIn: async (email, password, up) => {
    if (supabase) {
      const r = up ? await supabase.auth.signUp({ email, password }) : await supabase.auth.signInWithPassword({ email, password });
      if (r.error) throw new Error(r.error.message);
      if (up && !r.data.session) throw new Error('Check your email to confirm your account, then sign in.');
    } else { const u = { id: 'demo-' + btoa(email).slice(0, 10), email }; localStorage.setItem(LU, JSON.stringify(u)); set({ user: u }); }
  },
  signOut: async () => { if (supabase) await supabase.auth.signOut(); else { localStorage.removeItem(LU); set({ user: null }); } },
}));
