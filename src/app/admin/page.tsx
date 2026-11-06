'use client';
import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Nav from '@/components/Nav';
import { useStores } from '@/components/useStores';
import { useAuth, isAdmin, adminExpand, adminUpdatePlot, adminSaveStore, adminDeleteStore, adminMoveStore, adminSaveRoad, adminDeleteRoad, adminSavePlot, adminDeletePlot, findUserId, userEmails, DEMO_ADMIN } from '@/lib/data';
import { DEMO } from '@/lib/supabase';
import { DEFAULT_PARAMS, ExpandParams, LIMITS, anchorsFor, planExpansion } from '@/lib/expansion';
import { TEMPLATES, defaultConfig } from '@/lib/templates';
import { defaultPlace, getPlace, placementError, footprint, PRICE } from '@/lib/plots';
import { Layout, makeLayout, checkPlot, checkRoad, snapPlotToRoad, validateNetwork, isRing, roadLen } from '@/lib/layout';
import type { Plot, Road, StoreConfig, Tier } from '@/lib/types';
const AdminMap = dynamic(() => import('@/components/admin/AdminMap'), { ssr: false, loading: () => <div className="loading">Loading map…</div> });

const TEMPLATE_OPTIONS: Record<string, string> = { ...Object.fromEntries(Object.entries(TEMPLATES).map(([k, t]) => [k, t.label])), jenterprise: 'J Enterprise (landmark HQ)' };
const configFor = (template: string, prev?: StoreConfig): StoreConfig => {
  const base = template === 'jenterprise' ? defaultConfig('tech', { template: 'jenterprise', floors: 4, glass: 'blue' }) : defaultConfig(template);
  return prev ? { ...base, name: prev.name, tagline: prev.tagline, website: prev.website, logoUrl: prev.logoUrl } : base;
};
type BD = { template: string; name: string; tagline: string; website: string; ownerEmail: string; ox: number; oz: number; rot: number };
type PD = { status: string; tier: Tier; price: number; category: string; district: string };
type GD = { x: number; z: number; deg: number; w: number; d: number };
type Modal = null | 'save' | 'remove' | 'move' | 'expand' | 'plot' | 'geom' | 'delplot' | 'addplot' | 'saveroad' | 'delroad';
const deg = (r: number) => Math.round(((r * 180) / Math.PI) * 100) / 100, rad = (d: number) => Math.round(((d * Math.PI) / 180) * 1e6) / 1e6;

function Confirm({ title, children, label, danger, requireText, onOk, onCancel, busy }: { title: string; children: React.ReactNode; label: string; danger?: boolean; requireText?: string; onOk: () => void; onCancel: () => void; busy?: boolean }) {
  const [t, setT] = useState('');
  return (
    <div className="modal-back" role="dialog" aria-modal="true" aria-label={title}>
      <div className="modal"><h2>{title}</h2><div className="modal-body">{children}</div>
        {requireText && <label>Type <b>{requireText}</b> to confirm<input value={t} onChange={e => setT(e.target.value)} autoFocus /></label>}
        <div className="row"><button className="ghost" onClick={onCancel}>Cancel</button><button className={'btn' + (danger ? ' danger' : '')} disabled={busy || (!!requireText && t !== requireText)} onClick={onOk}>{busy ? 'Working…' : label}</button></div>
      </div>
    </div>
  );
}
const Num = ({ label, value, onChange, step = 1 }: { label: string; value: number; onChange: (n: number) => void; step?: number }) =>
  <label>{label}<input type="number" step={step} value={Number.isFinite(value) ? value : ''} onChange={e => onChange(parseFloat(e.target.value))} /></label>;
const Issues = ({ c }: { c: { errors: string[]; warnings: string[] } }) => <>{c.errors.map(e => <p key={e} className="err" style={{ margin: 0 }}>{e}</p>)}{c.warnings.map(e => <p key={e} className="note" style={{ margin: 0, color: '#fcd34d' }}>{e}</p>)}</>;

export default function Admin() {
  const { user, ready, init } = useAuth(), { stores, layout, reload } = useStores();
  const [allowed, setAllowed] = useState<null | boolean>(null);
  const [sel, setSel] = useState<string | null>(null), [tab, setTab] = useState<'plot' | 'roads' | 'expand' | 'owners' | 'network'>('plot'), [q, setQ] = useState(''), [labels, setLabels] = useState(true), [builds, setBuilds] = useState(true), [fitKey, setFitKey] = useState(0);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null), [modal, setModal] = useState<Modal>(null), [busy, setBusy] = useState(false);
  const [emails, setEmails] = useState<Record<string, string>>({});
  const [pd, setPd] = useState<PD | null>(null), [bd, setBd] = useState<BD | null>(null), [gd, setGd] = useState<GD | null>(null), [moveTo, setMoveTo] = useState('');
  const [ep, setEp] = useState<ExpandParams>(DEFAULT_PARAMS);
  const [selRoad, setSelRoad] = useState<string | null>(null), [rd, setRd] = useState<(Road & { isNew?: boolean }) | null>(null), [roadQ, setRoadQ] = useState('');
  const [np, setNp] = useState<GD & { district: string; category: string; tier: Tier; price: number }>({ x: 0, z: 0, deg: 0, w: 12, d: 13.6, district: 'New District', category: 'Mixed', tier: 'premium', price: 299 });
  useEffect(() => { init(); }, [init]);
  useEffect(() => { if (ready) isAdmin(user).then(setAllowed); }, [user, ready]);

  const plot = layout.byId.get(sel || '') as Plot | undefined, store = stores.find(s => s.plotId === sel);
  useEffect(() => { const ids = stores.map(s => s.ownerId).filter((x): x is string => !!x && !x.startsWith('demo-')); if (allowed && ids.length) userEmails(Array.from(new Set(ids))).then(setEmails); }, [stores, allowed]);
  const ownerLabel = (id: string | null) => (id ? emails[id] || (id.startsWith('demo-') ? 'demo user' : id.slice(0, 8) + '…') : '—');

  const resetDraft = () => {
    setMoveTo('');
    if (!plot) { setPd(null); setBd(null); setGd(null); return; }
    setPd({ status: plot.status, tier: plot.tier, price: plot.price, category: plot.category, district: plot.district });
    setGd({ x: plot.x, z: plot.z, deg: deg(plot.rot), w: plot.w, d: plot.d });
    if (store) { const pl = getPlace(plot, store.config); setBd({ template: store.config.template, name: store.config.name, tagline: store.config.tagline, website: store.config.website, ownerEmail: '', ox: pl.ox, oz: pl.oz, rot: pl.rot }); }
    else { const pl = defaultPlace(plot, configFor('tech')); setBd({ template: 'tech', name: 'New Store', tagline: '', website: '', ownerEmail: '', ox: pl.ox, oz: pl.oz, rot: 0 }); }
  };
  useEffect(() => { setMsg(null); resetDraft(); }, [sel]); // eslint-disable-line
  useEffect(() => { resetDraft(); }, [layout.version, stores]); // eslint-disable-line
  useEffect(() => { const r = layout.roads.find(x => x.id === selRoad); setRd(r ? { ...r } : null); }, [selRoad, layout.version]); // eslint-disable-line

  const matches = useMemo(() => {
    const s = q.trim().toLowerCase(); if (!s) return null; const m = new Set<string>();
    for (const p of layout.plots) { const st = stores.find(x => x.plotId === p.id); if ([p.id, p.district, p.category, p.region || '', st?.config.name || '', st ? ownerLabel(st.ownerId) : ''].join(' ').toLowerCase().includes(s)) m.add(p.id); }
    return m;
  }, [q, layout, stores, emails]); // eslint-disable-line

  const draftCfg = (): StoreConfig | null => {
    if (!plot || !bd) return null;
    const prev = store?.config, base = !prev || prev.template !== bd.template ? configFor(bd.template, prev) : { ...prev };
    return { ...base, name: bd.name, tagline: bd.tagline, website: bd.website, place: { ox: bd.ox, oz: bd.oz, rot: bd.rot } };
  };
  const cfg = draftCfg(), pErr = plot && cfg ? ([cfg.place!.ox, cfg.place!.oz].some(n => !Number.isFinite(n)) ? 'Offsets must be numbers.' : placementError(plot, cfg)) : null;
  const dirty = !!(store && bd && cfg && (JSON.stringify(cfg) !== JSON.stringify(store.config) || bd.ownerEmail.trim()));
  const changes = store && cfg && plot ? ((): string[][] => { const o = getPlace(plot, store.config), n = cfg.place!; return [['Template', store.config.template, cfg.template], ['Name', store.config.name, cfg.name], ['Tagline', store.config.tagline, cfg.tagline], ['Website', store.config.website, cfg.website], ['Position', `${o.ox}, ${o.oz}`, `${n.ox}, ${n.oz}`], ['Rotation', `${o.rot * 90}°`, `${n.rot * 90}°`], ['Owner', ownerLabel(store.ownerId), bd?.ownerEmail.trim() || '(unchanged)']].filter(r => r[1] !== r[2]); })() : [];

  // geometry drafts + validation
  const newPlot = plot && gd ? { ...plot, x: gd.x, z: gd.z, rot: rad(gd.deg), w: gd.w, d: gd.d } : null;
  const gCheck = newPlot ? checkPlot(layout, newPlot) : { errors: [], warnings: [] }, gDirty = !!(plot && gd && (gd.x !== plot.x || gd.z !== plot.z || rad(gd.deg) !== plot.rot || gd.w !== plot.w || gd.d !== plot.d));
  const addId = useMemo(() => { let n = 1; while (layout.byId.has(`M-${String(n).padStart(3, '0')}`)) n++; return `M-${String(n).padStart(3, '0')}`; }, [layout]);
  const addPlot: Plot = { id: addId, district: np.district, category: np.category, tier: np.tier, price: np.price, x: np.x, z: np.z, rot: rad(np.deg), w: np.w, d: np.d, status: 'available' };
  const aCheck = checkPlot(layout, addPlot);
  const rCheck = rd ? checkRoad(layout, rd) : { errors: [], warnings: [] };
  const net = useMemo(() => (tab === 'network' || modal === 'delroad' ? validateNetwork(layout) : null), [layout, tab, modal]);
  const roadDelReport = useMemo(() => (modal === 'delroad' && rd ? validateNetwork(makeLayout(layout.plots, layout.roads.filter(r => r.id !== rd.id), layout.regions, layout.source)) : null), [modal, rd, layout]);

  const run = async (fn: () => Promise<void>, ok: string) => {
    setBusy(true); setMsg(null);
    try { await fn(); await reload(); setMsg({ ok: true, text: ok }); } catch (e: any) { setMsg({ ok: false, text: e.message }); } finally { setBusy(false); setModal(null); }
  };
  const resolveOwner = async (): Promise<string | null> => { const e = bd!.ownerEmail.trim(); if (!e) return store?.ownerId ?? null; const id = await findUserId(e); if (!id) throw new Error(`No user found with email ${e}.`); return id; };
  const saveBuilding = () => run(async () => { await adminSaveStore(plot!.id, await resolveOwner(), cfg!); }, store ? 'Building updated.' : 'Building placed.');
  const removeBuilding = () => run(async () => { await adminDeleteStore(plot!.id); }, 'Building removed.');
  const moveBuilding = () => run(async () => { const t = layout.byId.get(moveTo)!; await adminMoveStore(plot!.id, moveTo, { ...store!.config, place: defaultPlace(t, store!.config) }); setSel(moveTo); }, `Building moved to ${moveTo}.`);
  const savePlot = () => run(async () => { await adminUpdatePlot(plot!.id, { status: pd!.status as any, tier: pd!.tier, price: pd!.price, category: pd!.category, district: pd!.district }); }, 'Plot updated.');
  const saveGeom = () => run(async () => { await adminSavePlot(newPlot!, false); }, 'Plot position and entrance saved.');
  const delPlot = () => run(async () => { await adminDeletePlot(plot!.id); setSel(null); }, 'Plot deleted.');
  const createPlot = () => run(async () => { await adminSavePlot(addPlot, true); setSel(addPlot.id); }, `Plot ${addPlot.id} created.`);
  const saveRoad = () => run(async () => { const { isNew, ...r } = rd!; await adminSaveRoad(r, !!isNew); setSelRoad(r.id); }, 'Road saved.');
  const delRoad = () => run(async () => { await adminDeleteRoad(rd!.id); setSelRoad(null); }, 'Road deleted.');

  const anchors = useMemo(() => anchorsFor(layout), [layout]);
  const plan = useMemo(() => (tab === 'expand' ? planExpansion(layout, ep) : null), [layout, ep, tab]);
  const setE = (p: Partial<ExpandParams>) => setEp({ ...ep, ...p });
  const confirmExpand = () => run(async () => { await adminExpand(plan!); setFitKey(k => k + 1); setTab('plot'); }, `Added region ${plan!.region.id}: ${plan!.plots.length} plots and ${plan!.roads.length} roads. The 3D world now includes them.`);
  const newRoad = () => { let n = 1; while (layout.roads.some(r => r.id === `ST-${n}`)) n++; setRd({ id: `ST-${n}`, kind: 'seg', x0: 0, z0: 0, x1: 0, z1: 0, w: 10, isNew: true }); setSelRoad(null); };

  if (!ready || allowed === null) return <div className="page dark"><Nav /><div className="loading">Checking access…</div></div>;
  if (!user || !allowed) return (
    <div className="page dark"><Nav /><div className="panel narrow"><h1>Administrators only</h1>
      <p>{user ? 'Your account is not an administrator.' : 'Sign in with an administrator account to continue.'}</p>
      {!user && <Link className="btn" href="/login">Sign in</Link>}
      {DEMO && <p className="note">Demo mode: the administrator account is <code>{DEMO_ADMIN}</code> (any password). This is a local development shortcut, not security. Real authorization needs Supabase (see README).</p>}</div></div>
  );
  const plotsFree = layout.plots.filter(p => !stores.some(s => s.plotId === p.id) && p.id !== plot?.id), fp = cfg ? footprint(cfg) : null;
  const roadList = layout.roads.filter(r => !roadQ || r.id.toLowerCase().includes(roadQ.toLowerCase()));
  const TABS: [typeof tab, string][] = [['plot', 'Plot'], ['roads', 'Roads'], ['expand', 'Expand'], ['owners', 'Owners'], ['network', 'Network']];

  return (
    <div className="page dark admin"><Nav />
      <div className="admin-grid">
        <section className="admin-main">
          <div className="admin-bar">
            <input placeholder="Search plot ID, store, owner, district…" value={q} onChange={e => setQ(e.target.value)} aria-label="Search map" />
            <label className="check"><input type="checkbox" checked={labels} onChange={e => setLabels(e.target.checked)} />Labels</label>
            <label className="check"><input type="checkbox" checked={builds} onChange={e => setBuilds(e.target.checked)} />Buildings</label>
            <span className="stat">{layout.plots.length} plots · {stores.length} buildings · {layout.roads.length} roads · {layout.regions.length} expansions · source: {layout.source}</span>
          </div>
          <AdminMap layout={layout} stores={stores} selected={sel} onSelect={id => { setSel(id); if (id && tab !== 'plot') setTab('plot'); }} matches={matches} preview={plan} showLabels={labels} showBuildings={builds} fitKey={fitKey}
            selectedRoad={selRoad} onSelectRoad={id => { setSelRoad(id); setTab('roads'); }} highlightRoads={net && !net.connected ? new Set(net.components.slice(1).flat()) : null} />
        </section>
        <aside className="admin-side">
          <div className="seg wide">{TABS.map(([k, l]) => <button key={k} className={tab === k ? 'on' : ''} onClick={() => { setTab(k); if (k === 'expand') setFitKey(x => x + 1); }}>{l}</button>)}</div>
          {msg && <p className={msg.ok ? 'ok-msg' : 'err'} role="status">{msg.text}</p>}

          {tab === 'plot' && !plot && <>
            <p className="note">Click a plot on the map to manage it, or add a new plot below.</p>
            <details><summary>Add a plot</summary>
              <div className="grid2"><Num label="X (m)" step={0.5} value={np.x} onChange={n => setNp({ ...np, x: n })} /><Num label="Z (m)" step={0.5} value={np.z} onChange={n => setNp({ ...np, z: n })} />
                <Num label="Facing (°)" value={np.deg} onChange={n => setNp({ ...np, deg: n })} /><Num label="Width (m)" step={0.5} value={np.w} onChange={n => setNp({ ...np, w: n })} /><Num label="Depth (m)" step={0.5} value={np.d} onChange={n => setNp({ ...np, d: n })} />
                <label>Tier<select value={np.tier} onChange={e => setNp({ ...np, tier: e.target.value as Tier, price: PRICE[e.target.value as Tier] })}>{['free', 'premium', 'featured', 'corner'].map(t => <option key={t}>{t}</option>)}</select></label></div>
              <label>District<input value={np.district} onChange={e => setNp({ ...np, district: e.target.value })} /></label>
              <p className="note">New ID: <b>{addId}</b>. Facing 0° looks south (+Z); 90° looks west.</p>
              <Issues c={aCheck} /><button className="btn sm" disabled={!!aCheck.errors.length} onClick={() => setModal('addplot')}>Create plot…</button></details>
          </>}
          {tab === 'plot' && plot && pd && bd && gd && (<>
            <h2>{plot.id} <small>{plot.landmark ? 'Landmark' : plot.tier}</small></h2>
            <dl className="kv"><dt>District</dt><dd>{plot.district}</dd><dt>Size</dt><dd>{plot.w} × {plot.d} m</dd><dt>Position</dt><dd>x {plot.x}, z {plot.z}, facing {Math.round(((plot.rot * 180) / Math.PI + 360) % 360)}°</dd>
              <dt>Region</dt><dd>{plot.region || 'Original city'}</dd><dt>Status</dt><dd><b className={store ? 'st-occ' : plot.status === 'reserved' ? 'st-res' : 'st-av'}>{store ? 'Occupied' : plot.status}</b></dd>
              <dt>Store</dt><dd>{store?.config.name || '—'}</dd><dt>Owner</dt><dd>{store ? ownerLabel(store.ownerId) : '—'}</dd>{store && <><dt>Visits / clicks</dt><dd>{store.visits} / {store.clicks}</dd></>}</dl>

            <details><summary>Edit plot</summary>
              <label>Status<select value={pd.status} onChange={e => setPd({ ...pd, status: e.target.value })}><option value="available">available</option><option value="reserved">reserved</option></select></label>
              <label>Tier<select value={pd.tier} onChange={e => setPd({ ...pd, tier: e.target.value as Tier })}>{['free', 'premium', 'featured', 'corner'].map(t => <option key={t}>{t}</option>)}</select></label>
              <Num label="Price / month ($)" value={pd.price} onChange={n => setPd({ ...pd, price: n })} />
              <label>Category<input value={pd.category} onChange={e => setPd({ ...pd, category: e.target.value })} /></label>
              <label>District<input value={pd.district} onChange={e => setPd({ ...pd, district: e.target.value })} /></label>
              <button className="btn sm" onClick={() => setModal('plot')} disabled={!Number.isFinite(pd.price) || pd.price < 0}>Save plot…</button>
            </details>
            <details><summary>Position, size &amp; storefront entrance</summary>
              <div className="grid2"><Num label="X (m)" step={0.5} value={gd.x} onChange={n => setGd({ ...gd, x: n })} /><Num label="Z (m)" step={0.5} value={gd.z} onChange={n => setGd({ ...gd, z: n })} />
                <Num label="Facing (°)" value={gd.deg} onChange={n => setGd({ ...gd, deg: n })} /><span /><Num label="Width (m)" step={0.5} value={gd.w} onChange={n => setGd({ ...gd, w: n })} /><Num label="Depth (m)" step={0.5} value={gd.d} onChange={n => setGd({ ...gd, d: n })} /></div>
              <button className="btn outline sm" onClick={() => setGd({ ...gd, deg: deg(snapPlotToRoad(layout, { ...plot, x: gd.x, z: gd.z }).rot) })}>Snap entrance to nearest road</button>
              <Issues c={gCheck} />
              <div className="row"><button className="btn danger sm" disabled={!!store} title={store ? 'Remove the building first' : ''} onClick={() => setModal('delplot')}>Delete plot…</button><button className="btn sm" disabled={!gDirty || !!gCheck.errors.length} onClick={() => setModal('geom')}>Save position…</button></div>
            </details>

            <h3>{store ? 'Building' : 'Place a building'}</h3>
            <label>Template<select value={bd.template} onChange={e => { const t = e.target.value, p = defaultPlace(plot, configFor(t)); setBd({ ...bd, template: t, ox: p.ox, oz: p.oz, rot: 0 }); }}>{Object.entries(TEMPLATE_OPTIONS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
            <label>Store name<input value={bd.name} maxLength={28} onChange={e => setBd({ ...bd, name: e.target.value })} /></label>
            <label>Tagline<input value={bd.tagline} maxLength={60} onChange={e => setBd({ ...bd, tagline: e.target.value })} /></label>
            <label>Website<input value={bd.website} placeholder="https://" onChange={e => setBd({ ...bd, website: e.target.value })} /></label>
            <label>Assign owner (email){store && <small> · currently {ownerLabel(store.ownerId)}</small>}<input type="email" value={bd.ownerEmail} placeholder={store ? 'leave blank to keep owner' : 'optional'} onChange={e => setBd({ ...bd, ownerEmail: e.target.value })} /></label>
            <div className="grid3"><Num label="Offset X (m)" step={0.5} value={bd.ox} onChange={n => setBd({ ...bd, ox: n })} /><Num label="Offset Z (m)" step={0.5} value={bd.oz} onChange={n => setBd({ ...bd, oz: n })} />
              <label>Rotation<select value={bd.rot} onChange={e => setBd({ ...bd, rot: +e.target.value })}>{[0, 1, 2, 3].map(r => <option key={r} value={r}>{r * 90}°</option>)}</select></label></div>
            <p className="note">Footprint {fp?.w}×{fp?.d} m inside a {plot.w}×{plot.d} m plot. Offsets are measured from the plot centre; +Z moves toward the street.</p>
            {pErr && <p className="err">{pErr}</p>}
            <div className="row">
              {store && <button className="ghost" disabled={!dirty} onClick={resetDraft}>Cancel changes</button>}
              <button className="btn" disabled={!!pErr || !bd.name.trim() || (!!store && !dirty)} onClick={() => setModal('save')}>{store ? 'Save changes…' : 'Place building…'}</button>
            </div>
            {store && <details><summary>Relocate or remove</summary>
              <label>Move building to plot<select value={moveTo} onChange={e => setMoveTo(e.target.value)}><option value="">Select an empty plot…</option>{plotsFree.map(p => <option key={p.id} value={p.id}>{p.id} · {p.w}×{p.d} · {p.district}</option>)}</select></label>
              <button className="btn sm" disabled={!moveTo} onClick={() => { const t = layout.byId.get(moveTo)!, e = placementError(t, store.config, defaultPlace(t, store.config)); e ? setMsg({ ok: false, text: e }) : setModal('move'); }}>Move…</button>
              <button className="btn sm danger" onClick={() => setModal('remove')}>Remove building…</button></details>}
          </>)}

          {tab === 'roads' && (<>
            <h2>Roads &amp; entrances</h2>
            <p className="note">Ring roads, radial boundary roads (market entrances), district spines and cross streets. Click a road on the map or pick one below.</p>
            <input placeholder="Filter roads…" value={roadQ} onChange={e => setRoadQ(e.target.value)} aria-label="Filter roads" />
            <ul className="owner-list" style={{ maxHeight: 180, overflow: 'auto' }}>{roadList.map(r => <li key={r.id}><button onClick={() => setSelRoad(r.id)}><b>{r.id}</b><span>{isRing(r) ? `ring · radius ${r.x1} m` : `${Math.round(roadLen(r))} m`} · {r.w} m wide</span><em>{r.id === selRoad ? 'selected' : ''}</em></button></li>)}</ul>
            <button className="btn outline sm" onClick={newRoad}>Add road segment</button>
            {rd && <div className="panel" style={{ margin: 0, padding: '1rem' }}>
              <h3 style={{ margin: 0 }}>{rd.isNew ? 'New road' : rd.id}</h3>
              {rd.isNew && <label>Road ID<input value={rd.id} onChange={e => setRd({ ...rd, id: e.target.value })} /></label>}
              {isRing(rd) ? <div className="grid2"><Num label="Centre X" value={rd.x0} onChange={n => setRd({ ...rd, x0: n })} /><Num label="Centre Z" value={rd.z0} onChange={n => setRd({ ...rd, z0: n })} /><Num label="Radius (m)" value={rd.x1} onChange={n => setRd({ ...rd, x1: n })} /><Num label="Width (m)" value={rd.w} onChange={n => setRd({ ...rd, w: n })} /></div>
                : <div className="grid2"><Num label="Start X" step={0.5} value={rd.x0} onChange={n => setRd({ ...rd, x0: n })} /><Num label="Start Z" step={0.5} value={rd.z0} onChange={n => setRd({ ...rd, z0: n })} /><Num label="End X" step={0.5} value={rd.x1} onChange={n => setRd({ ...rd, x1: n })} /><Num label="End Z" step={0.5} value={rd.z1} onChange={n => setRd({ ...rd, z1: n })} /><Num label="Width (m)" value={rd.w} onChange={n => setRd({ ...rd, w: n })} /></div>}
              <Issues c={rCheck} />
              <div className="row">{!rd.isNew && <button className="btn danger sm" onClick={() => setModal('delroad')}>Delete…</button>}<button className="btn sm" disabled={!!rCheck.errors.length || !rd.id.trim()} onClick={() => setModal('saveroad')}>Save road…</button></div>
            </div>}
          </>)}

          {tab === 'network' && net && (<>
            <h2>Network check</h2>
            <p className="note">Validated from the actual plot and road geometry: road connectivity, every storefront entrance facing a road or sidewalk, and overlaps.</p>
            <dl className="kv"><dt>Roads</dt><dd>{net.roads} · {net.connected ? <b className="st-av">all connected</b> : <b className="err">{net.components.length} disconnected groups</b>}</dd><dt>Plots</dt><dd>{net.plots}</dd>
              <dt>Entrance access</dt><dd>{net.unreachable.length ? <b className="err">{net.unreachable.length} plots without road access</b> : <b className="st-av">every plot reachable</b>}</dd><dt>Overlaps</dt><dd>{net.overlaps.length ? <b className="err">{net.overlaps.length} found</b> : <b className="st-av">none</b>}</dd></dl>
            {!net.connected && <div className="err-box"><b>Disconnected roads (highlighted red on the map):</b><br />{net.components.slice(1).flat().join(', ')}</div>}
            {net.unreachable.length > 0 && <div className="err-box"><b>No road access:</b><br />{net.unreachable.slice(0, 24).map(id => <button key={id} className="chip" onClick={() => { setSel(id); setTab('plot'); }}>{id}</button>)}</div>}
            {net.overlaps.length > 0 && <div className="err-box"><ul>{net.overlaps.slice(0, 10).map(o => <li key={o}>{o}</li>)}</ul></div>}
          </>)}

          {tab === 'owners' && (<>
            <h2>Store ownership</h2>
            <p className="note">{stores.length} buildings. Select one to reassign its owner, edit details, relocate or remove it.</p>
            <ul className="owner-list">{stores.filter(x => !matches || matches.has(x.plotId)).map(x => <li key={x.plotId}><button onClick={() => { setSel(x.plotId); setTab('plot'); }}><b>{x.config.name}</b><span>{x.plotId} · {layout.byId.get(x.plotId)?.district}</span><em>{ownerLabel(x.ownerId)}</em></button></li>)}</ul>
          </>)}

          {tab === 'expand' && (<>
            <h2>Add a market district</h2>
            <p className="note">Attaches a connected block (a new entrance road from a ring gate or open road end, cross streets and rows of plots on both sides) at any bearing. Validated against the real geometry; nothing is saved until you confirm.</p>
            <label>Connect to<select value={ep.anchorId || anchors[0]?.id || ''} onChange={e => setE({ anchorId: e.target.value })}>{anchors.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}</select></label>
            <div className="grid2"><Num label={`Rows (${LIMITS.rows.join('–')})`} value={ep.rows} onChange={n => setE({ rows: n })} /><Num label={`Columns (${LIMITS.cols.join('–')})`} value={ep.cols} onChange={n => setE({ cols: n })} />
              <Num label="Plot width (m)" value={ep.plotW} onChange={n => setE({ plotW: n })} /><Num label="Plot depth (m)" step={0.1} value={ep.plotD} onChange={n => setE({ plotD: n })} />
              <Num label="Spacing (m)" value={ep.spacing} onChange={n => setE({ spacing: n })} /><Num label="Road width (m)" value={ep.roadW} onChange={n => setE({ roadW: n })} /></div>
            <label>Plot tier<select value={ep.tier} onChange={e => setE({ tier: e.target.value as Tier })}>{['free', 'premium', 'featured', 'corner'].map(t => <option key={t}>{t}</option>)}</select></label>
            <label>District name<input value={ep.district} onChange={e => setE({ district: e.target.value })} /></label>
            <label>Category<input value={ep.category} onChange={e => setE({ category: e.target.value })} /></label>
            {plan && (plan.errors.length ? <div className="err-box"><b>Cannot expand:</b><ul>{plan.errors.map(x => <li key={x}>{x}</li>)}</ul></div>
              : <p className="ok-msg">Preview: region <b>{plan.region.id}</b> · {plan.plots.length} plots ({plan.plots[0]?.id} … {plan.plots[plan.plots.length - 1]?.id}) · {plan.roads.length} roads. No overlaps found.</p>)}
            <button className="btn" disabled={!plan || !!plan.errors.length || !plan.plots.length} onClick={() => setModal('expand')}>Confirm expansion…</button>
          </>)}
        </aside>
      </div>

      {modal === 'save' && cfg && plot && <Confirm title={store ? 'Save building changes?' : 'Place this building?'} label={store ? 'Save changes' : 'Place building'} busy={busy} onOk={saveBuilding} onCancel={() => setModal(null)}>
        {store ? (changes.length ? <ul>{changes.map(c => <li key={c[0]}><b>{c[0]}:</b> {c[1] || '—'} → {c[2] || '—'}</li>)}</ul> : <p>No changes.</p>) : <p>Place <b>{cfg.name}</b> ({TEMPLATE_OPTIONS[cfg.template]}) on plot <b>{plot.id}</b>. It appears in the 3D city immediately.</p>}</Confirm>}
      {modal === 'remove' && plot && <Confirm title="Remove building?" danger label="Remove building" requireText={plot.id} busy={busy} onOk={removeBuilding} onCancel={() => setModal(null)}><p>This deletes <b>{store?.config.name}</b> and its saved configuration from plot {plot.id}. The plot becomes empty. This cannot be undone.</p></Confirm>}
      {modal === 'move' && plot && <Confirm title="Relocate building?" label={`Move to ${moveTo}`} busy={busy} onOk={moveBuilding} onCancel={() => setModal(null)}><p>Move <b>{store?.config.name}</b> from {plot.id} to {moveTo}. Ownership and analytics move with it; position resets to the default placement on the new plot.</p></Confirm>}
      {modal === 'plot' && plot && pd && <Confirm title="Save plot changes?" label="Save plot" busy={busy} onOk={savePlot} onCancel={() => setModal(null)}><p>Update {plot.id}: status <b>{pd.status}</b>, tier <b>{pd.tier}</b>, ${pd.price}/month, {pd.category} · {pd.district}.</p></Confirm>}
      {modal === 'geom' && plot && gd && <Confirm title="Move or resize this plot?" label="Save position" busy={busy} onOk={saveGeom} onCancel={() => setModal(null)}><p>{plot.id}: ({plot.x}, {plot.z}) {deg(plot.rot)}° {plot.w}×{plot.d} m → ({gd.x}, {gd.z}) {gd.deg}° {gd.w}×{gd.d} m.{store ? ' Its building moves with it.' : ''} The entrance faces a road and nothing overlaps.</p></Confirm>}
      {modal === 'delplot' && plot && <Confirm title="Delete plot?" danger label="Delete plot" requireText={plot.id} busy={busy} onOk={delPlot} onCancel={() => setModal(null)}><p>Permanently removes empty plot {plot.id} from the city.</p></Confirm>}
      {modal === 'addplot' && <Confirm title="Create plot?" label="Create plot" busy={busy} onOk={createPlot} onCancel={() => setModal(null)}><p>Add plot <b>{addPlot.id}</b> ({np.w}×{np.d} m, {np.tier}) at ({np.x}, {np.z}) facing {np.deg}°. It appears in the 3D world for every visitor.</p></Confirm>}
      {modal === 'saveroad' && rd && <Confirm title={rd.isNew ? 'Add this road?' : 'Save road changes?'} label="Save road" busy={busy} onOk={saveRoad} onCancel={() => setModal(null)}><p><b>{rd.id}</b>: {isRing(rd) ? `ring radius ${rd.x1} m` : `(${rd.x0}, ${rd.z0}) → (${rd.x1}, ${rd.z1})`}, {rd.w} m wide. Roads and sidewalks in the 3D world update from this.</p>{rCheck.warnings.map(w => <p key={w} className="note" style={{ color: '#fcd34d' }}>{w}</p>)}</Confirm>}
      {modal === 'delroad' && rd && roadDelReport && <Confirm title="Delete road?" danger label="Delete road" requireText={rd.id} busy={busy} onOk={delRoad} onCancel={() => setModal(null)}>
        <p>Removes <b>{rd.id}</b> from the city.</p>{!roadDelReport.connected && <p className="err">Warning: this splits the road network into {roadDelReport.components.length} groups.</p>}{roadDelReport.unreachable.length > 0 && <p className="err">Warning: {roadDelReport.unreachable.length} plots lose their road access.</p>}</Confirm>}
      {modal === 'expand' && plan && <Confirm title="Add this district?" label={`Add ${plan.plots.length} plots`} busy={busy} onOk={confirmExpand} onCancel={() => setModal(null)}>
        <p>Add region <b>{plan.region.id}</b> ({plan.region.direction}) with <b>{plan.plots.length}</b> plots of {ep.plotW}×{ep.plotD} m and <b>{plan.roads.length}</b> roads. It is saved to the database and becomes part of the walkable 3D world for every visitor.</p></Confirm>}
    </div>
  );
}
