'use client';
import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Nav from '@/components/Nav';
import { useStores } from '@/components/useStores';
import {
  useAuth,
  isAdmin,
  verifyAdminCredentials,
  adminLogout,
  adminExpand,
  adminUpdatePlot,
  adminSaveStore,
  adminDeleteStore,
  adminMoveStore,
  adminSaveRoad,
  adminDeleteRoad,
  adminSavePlot,
  adminDeletePlot,
  findUserId,
  userEmails,
  DEMO_ADMIN,
} from '@/lib/data';
import { DEMO } from '@/lib/supabase';
import { DEFAULT_PARAMS, ExpandParams, LIMITS, anchorsFor, planExpansion } from '@/lib/expansion';
import { TEMPLATES, defaultConfig } from '@/lib/templates';
import { defaultPlace, getPlace, placementError, footprint, PRICE } from '@/lib/plots';
import { DISTRICTS } from '@/lib/city';
import { computeStats } from '@/lib/stats';
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
  const [sel, setSel] = useState<string | null>(null);
  const [tab, setTab] = useState<'overview' | 'plot' | 'promo' | 'owners' | 'roads' | 'expand' | 'network'>('overview');
  const [q, setQ] = useState(''), [labels, setLabels] = useState(true), [builds, setBuilds] = useState(true), [fitKey, setFitKey] = useState(0);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null), [modal, setModal] = useState<Modal>(null), [busy, setBusy] = useState(false);
  const [emails, setEmails] = useState<Record<string, string>>({});
  const [pd, setPd] = useState<PD | null>(null), [bd, setBd] = useState<BD | null>(null), [gd, setGd] = useState<GD | null>(null), [moveTo, setMoveTo] = useState('');
  const [ep, setEp] = useState<ExpandParams>(DEFAULT_PARAMS);
  const [selRoad, setSelRoad] = useState<string | null>(null), [rd, setRd] = useState<(Road & { isNew?: boolean }) | null>(null), [roadQ, setRoadQ] = useState('');
  const [np, setNp] = useState<GD & { district: string; category: string; tier: Tier; price: number }>({ x: 0, z: 0, deg: 0, w: 12, d: 13.6, district: 'New District', category: 'Mixed', tier: 'premium', price: 299 });

  // Admin Login Form State
  const [loginUser, setLoginUser] = useState('admin');
  const [loginPass, setLoginPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loginErr, setLoginErr] = useState('');
  const [loginBusy, setLoginBusy] = useState(false);

  // Redemptions list
  const [redemptions, setRedemptions] = useState<any[]>([]);

  useEffect(() => { init(); }, [init]);
  useEffect(() => {
    if (ready) {
      isAdmin(user).then(setAllowed);
    }
  }, [user, ready]);

  useEffect(() => {
    try {
      const r = JSON.parse(localStorage.getItem('thecity.promo_redemptions') || '[]');
      setRedemptions(r);
    } catch {}
  }, [tab, layout.version]);

  const stats = useMemo(() => computeStats(layout, stores), [layout, stores]);

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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginBusy(true);
    setLoginErr('');
    try {
      const res = await verifyAdminCredentials(loginUser, loginPass);
      if (!res.success) {
        setLoginErr(res.error || 'Invalid credentials.');
      } else {
        setAllowed(true);
        await reload();
      }
    } catch (err: any) {
      setLoginErr(err.message || 'Login failed.');
    } finally {
      setLoginBusy(false);
    }
  };

  const handleLogout = async () => {
    await adminLogout();
    setAllowed(false);
  };

  // ── Admin Login Screen when unauthenticated ──
  if (!ready || allowed === null) {
    return (
      <div className="page dark">
        <Nav />
        <div className="loading" style={{ padding: '6rem 2rem', textAlign: 'center' }}>
          Checking administrator authorization…
        </div>
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="page dark" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Nav />
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem 1rem',
            background: 'radial-gradient(circle at 50% 30%, rgba(34, 211, 238, 0.08) 0%, rgba(10, 18, 34, 0.98) 70%)',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '440px',
              background: 'rgba(15, 23, 42, 0.92)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(34, 211, 238, 0.35)',
              borderRadius: '20px',
              padding: '2.4rem',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(34, 211, 238, 0.15)',
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: '1.8rem' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '56px',
                  height: '56px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, rgba(34, 211, 238, 0.2), rgba(59, 130, 246, 0.2))',
                  border: '1px solid rgba(34, 211, 238, 0.5)',
                  fontSize: '1.8rem',
                  marginBottom: '0.8rem',
                }}
              >
                🔐
              </div>
              <h1 style={{ margin: '0 0 6px', fontSize: '1.6rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em' }}>
                Admin Portal Login
              </h1>
              <p style={{ margin: 0, fontSize: '0.86rem', color: '#94a3b8' }}>
                Sign in to manage building unlocks, promo codes &amp; city operations.
              </p>
            </div>

            <form onSubmit={handleLogin} style={{ display: 'grid', gap: '1.1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                  Admin Username
                </label>
                <input
                  type="text"
                  value={loginUser}
                  onChange={e => setLoginUser(e.target.value)}
                  placeholder="admin"
                  required
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    background: 'rgba(30, 41, 59, 0.8)',
                    border: '1px solid #334155',
                    color: '#f8fafc',
                    fontSize: '0.92rem',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={loginPass}
                    onChange={e => setLoginPass(e.target.value)}
                    placeholder="Enter admin password"
                    required
                    style={{
                      width: '100%',
                      padding: '10px 42px 10px 14px',
                      borderRadius: '10px',
                      background: 'rgba(30, 41, 59, 0.8)',
                      border: '1px solid #334155',
                      color: '#f8fafc',
                      fontSize: '0.92rem',
                      outline: 'none',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'transparent',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                    }}
                  >
                    {showPass ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              {loginErr && (
                <div
                  style={{
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    color: '#f87171',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                  }}
                >
                  {loginErr}
                </div>
              )}

              <button
                type="submit"
                disabled={loginBusy}
                className="btn"
                style={{
                  width: '100%',
                  padding: '11px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #0284c7, #2563eb)',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.92rem',
                  border: 'none',
                  cursor: loginBusy ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  marginTop: '0.4rem',
                }}
              >
                <span>{loginBusy ? 'Verifying…' : 'Sign In as Administrator →'}</span>
              </button>
            </form>

            <div style={{ marginTop: '1.6rem', paddingTop: '1.2rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)', fontSize: '0.76rem', color: '#64748b', textAlign: 'center' }}>
              Authorized personnel only. Contact city administration for access.
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Authenticated Admin Portal ──
  const plotsFree = layout.plots.filter(p => !stores.some(s => s.plotId === p.id) && p.id !== plot?.id), fp = cfg ? footprint(cfg) : null;
  const roadList = layout.roads.filter(r => !roadQ || r.id.toLowerCase().includes(roadQ.toLowerCase()));
  const TABS: [typeof tab, string][] = [
    ['overview', '📊 Dashboard'],
    ['plot', '🗺️ Map & Plots'],
    ['promo', '🎟️ Promo Codes'],
    ['owners', '🏪 Stores & Owners'],
    ['roads', '🛣️ Roads'],
    ['expand', '🏗️ Expand'],
    ['network', '🌐 Network'],
  ];

  return (
    <div className="page dark admin"><Nav />
      {/* ── Executive Admin Top Banner ── */}
      <div
        style={{
          background: 'linear-gradient(90deg, #0f172a 0%, #1e293b 100%)',
          borderBottom: '1px solid rgba(34, 211, 238, 0.25)',
          padding: '10px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.25rem' }}>🏢</span>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 800, color: '#f8fafc', fontSize: '0.98rem' }}>The City Master Admin Console</span>
              <span style={{ background: 'rgba(34, 211, 238, 0.15)', color: '#22d3ee', border: '1px solid rgba(34, 211, 238, 0.4)', borderRadius: '999px', padding: '2px 8px', fontSize: '0.72rem', fontWeight: 700 }}>
                👑 Super Admin: admin
              </span>
            </div>
            <div style={{ fontSize: '0.76rem', color: '#94a3b8' }}>
              Connected to Master World State &middot; Full Urban &amp; Building Authority
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '6px', fontSize: '0.76rem', fontWeight: 700 }}>
            <span style={{ background: '#1e293b', border: '1px solid #334155', color: '#f8fafc', padding: '3px 8px', borderRadius: '6px' }}>
              Plots: {layout.plots.length}
            </span>
            <span style={{ background: 'rgba(34, 197, 94, 0.15)', border: '1px solid rgba(34, 197, 94, 0.4)', color: '#4ade80', padding: '3px 8px', borderRadius: '6px' }}>
              🟢 Available: {stats.available}
            </span>
            <span style={{ background: 'rgba(100, 116, 139, 0.2)', border: '1px solid #475569', color: '#cbd5e1', padding: '3px 8px', borderRadius: '6px' }}>
              🔒 Locked: {stats.reserved}
            </span>
            <span style={{ background: 'rgba(249, 115, 22, 0.15)', border: '1px solid rgba(249, 115, 22, 0.4)', color: '#fb923c', padding: '3px 8px', borderRadius: '6px' }}>
              🟠 Claimed: {stores.filter(s => s.ownerId).length}
            </span>
          </div>
          <Link href="/city" className="btn sm outline" style={{ fontSize: '0.78rem' }}>
            Enter 3D City 🌐
          </Link>
          <button onClick={handleLogout} className="btn sm danger" style={{ fontSize: '0.78rem' }}>
            Admin Logout 🚪
          </button>
        </div>
      </div>

      <div className="admin-grid">
        <section className="admin-main">
          <div className="admin-bar">
            <input placeholder="Search plot ID, store, owner, district…" value={q} onChange={e => setQ(e.target.value)} aria-label="Search map" />
            <label className="check"><input type="checkbox" checked={labels} onChange={e => setLabels(e.target.checked)} />Labels</label>
            <label className="check"><input type="checkbox" checked={builds} onChange={e => setBuilds(e.target.checked)} />Buildings</label>
            <span className="stat">{layout.plots.length} plots · {stores.length} buildings · {layout.roads.length} roads · {layout.regions.length} expansions</span>
          </div>
          <AdminMap layout={layout} stores={stores} selected={sel} onSelect={id => { setSel(id); if (id && tab !== 'plot') setTab('plot'); }} matches={matches} preview={plan} showLabels={labels} showBuildings={builds} fitKey={fitKey}
            selectedRoad={selRoad} onSelectRoad={id => { setSelRoad(id); setTab('roads'); }} highlightRoads={net && !net.connected ? new Set(net.components.slice(1).flat()) : null} />
        </section>
        <aside className="admin-side">
          <div className="seg wide">{TABS.map(([k, l]) => <button key={k} className={tab === k ? 'on' : ''} onClick={() => { setTab(k); if (k === 'expand') setFitKey(x => x + 1); }}>{l}</button>)}</div>
          {msg && <p className={msg.ok ? 'ok-msg' : 'err'} role="status">{msg.text}</p>}

          {/* ── 1. Overview Dashboard Tab ── */}
          {tab === 'overview' && (
            <div style={{ display: 'grid', gap: '14px' }}>
              <div>
                <h2 style={{ margin: '0 0 4px', fontSize: '1.25rem' }}>Executive City Overview</h2>
                <p className="note" style={{ margin: 0 }}>Comprehensive metrics across all 11 city districts &amp; infrastructure.</p>
              </div>

              {/* Metric Cards Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '10px 12px' }}>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Total City Plots</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc', marginTop: '2px' }}>{layout.plots.length}</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Master circular layout</div>
                </div>
                <div style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)', borderRadius: '10px', padding: '10px 12px' }}>
                  <div style={{ fontSize: '0.72rem', color: '#86efac', textTransform: 'uppercase', fontWeight: 700 }}>Available Free</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#4ade80', marginTop: '2px' }}>{stats.available}</div>
                  <div style={{ fontSize: '0.72rem', color: '#86efac' }}>25 in each market</div>
                </div>
                <div style={{ background: 'rgba(71, 85, 105, 0.25)', border: '1px solid #475569', borderRadius: '10px', padding: '10px 12px' }}>
                  <div style={{ fontSize: '0.72rem', color: '#cbd5e1', textTransform: 'uppercase', fontWeight: 700 }}>Permanently Locked</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#94a3b8', marginTop: '2px' }}>{stats.reserved}</div>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>25/market + Central + Hub</div>
                </div>
                <div style={{ background: 'rgba(249, 115, 22, 0.1)', border: '1px solid rgba(249, 115, 22, 0.3)', borderRadius: '10px', padding: '10px 12px' }}>
                  <div style={{ fontSize: '0.72rem', color: '#fdba74', textTransform: 'uppercase', fontWeight: 700 }}>Claimed by Residents</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fb923c', marginTop: '2px' }}>{stores.filter(s => s.ownerId).length}</div>
                  <div style={{ fontSize: '0.72rem', color: '#fdba74' }}>Active citizen stores</div>
                </div>
              </div>

              {/* Promo Highlight Banner */}
              <div style={{ background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.2), rgba(99, 102, 241, 0.1))', border: '1px solid rgba(99, 102, 241, 0.4)', borderRadius: '12px', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>🎟️</span>
                    <span style={{ fontWeight: 800, fontSize: '0.84rem', color: '#a5b4fc' }}>Active Promo Code: Jdhvpromo</span>
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#c7d2fe', marginTop: '2px' }}>
                    Central District VIP unlock &middot; {redemptions.length} redeemed
                  </div>
                </div>
                <button className="btn sm" onClick={() => setTab('promo')} style={{ background: '#4f46e5', color: '#fff', fontSize: '0.74rem' }}>
                  Manage Promo &rarr;
                </button>
              </div>

              {/* District Breakdown Table */}
              <div>
                <h3 style={{ margin: '8px 0 6px', fontSize: '0.92rem' }}>District Allocation</h3>
                <div style={{ maxHeight: '220px', overflowY: 'auto', border: '1px solid #334155', borderRadius: '8px' }}>
                  <table style={{ width: '100%', fontSize: '0.74rem', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: '#1e293b', borderBottom: '1px solid #334155', color: '#94a3b8' }}>
                        <th style={{ padding: '6px 8px' }}>District</th>
                        <th style={{ padding: '6px 8px' }}>Total</th>
                        <th style={{ padding: '6px 8px' }}>Locked</th>
                        <th style={{ padding: '6px 8px' }}>Free</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid #1e293b' }}>
                        <td style={{ padding: '5px 8px', fontWeight: 600 }}>Civic Plaza (J01)</td>
                        <td style={{ padding: '5px 8px' }}>1</td>
                        <td style={{ padding: '5px 8px', color: '#94a3b8' }}>1 (🔒)</td>
                        <td style={{ padding: '5px 8px', color: '#64748b' }}>0</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #1e293b' }}>
                        <td style={{ padding: '5px 8px', fontWeight: 600 }}>Central District (C01-C09)</td>
                        <td style={{ padding: '5px 8px' }}>9</td>
                        <td style={{ padding: '5px 8px', color: '#94a3b8' }}>9 (🔒)</td>
                        <td style={{ padding: '5px 8px', color: '#a5b4fc' }}>Promo Jdhvpromo</td>
                      </tr>
                      {DISTRICTS.map(d => (
                        <tr key={d.code} style={{ borderBottom: '1px solid #1e293b' }}>
                          <td style={{ padding: '5px 8px', fontWeight: 600 }}>{d.name}</td>
                          <td style={{ padding: '5px 8px' }}>50</td>
                          <td style={{ padding: '5px 8px', color: '#94a3b8' }}>25</td>
                          <td style={{ padding: '5px 8px', color: '#4ade80' }}>25</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── 2. Plots & Buildings Management Tab ── */}
          {tab === 'plot' && !plot && <>
            <p className="note">Click any building on the map to inspect, unlock/lock, or reassign ownership.</p>
            <details><summary>Add a new plot</summary>
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

            {/* Quick Admin Building Access Controls */}
            <div style={{ display: 'flex', gap: '8px', margin: '10px 0 14px' }}>
              {plot.status === 'reserved' ? (
                <button
                  className="btn sm"
                  style={{ background: '#22c55e', color: '#fff', border: 'none', fontWeight: 700, flex: 1, padding: '7px 12px' }}
                  onClick={() => run(async () => {
                    await adminUpdatePlot(plot.id, { status: 'available' });
                  }, `Building ${plot.id} unlocked! Status is now available to claim.`)}
                >
                  🔓 Unlock Building (Make Available)
                </button>
              ) : (
                <button
                  className="btn sm outline danger"
                  style={{ fontWeight: 700, flex: 1, padding: '7px 12px' }}
                  onClick={() => run(async () => {
                    await adminUpdatePlot(plot.id, { status: 'reserved' });
                  }, `Building ${plot.id} locked! Marked as reserved.`)}
                >
                  🔒 Lock Building (Mark Reserved)
                </button>
              )}
            </div>

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

          {/* ── 3. Promo Codes Management Tab ── */}
          {tab === 'promo' && (
            <div style={{ display: 'grid', gap: '14px' }}>
              <div>
                <h2 style={{ margin: '0 0 4px', fontSize: '1.25rem' }}>Promo Code Manager</h2>
                <p className="note" style={{ margin: 0 }}>Special access promo codes for unlocking exclusive city sectors.</p>
              </div>

              {/* Promo Code Card */}
              <div style={{ background: '#1e293b', border: '1px solid #4338ca', borderRadius: '12px', padding: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '1.2rem' }}>🎟️</span>
                    <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#f8fafc' }}>Jdhvpromo</span>
                  </div>
                  <span style={{ background: '#dcfce7', color: '#15803d', fontSize: '0.72rem', fontWeight: 800, padding: '2px 8px', borderRadius: '999px' }}>
                    ACTIVE &middot; UNLIMITED
                  </span>
                </div>

                <div style={{ display: 'grid', gap: '6px', fontSize: '0.78rem', color: '#cbd5e1', borderTop: '1px solid #334155', paddingTop: '8px' }}>
                  <div><b>Target District:</b> Central District (C01 &ndash; C09)</div>
                  <div><b>Benefit:</b> Instant unlock &amp; 100% Free building claim</div>
                  <div><b>Total Redemptions:</b> {redemptions.length} user claims</div>
                </div>
              </div>

              {/* Redemptions Log */}
              <div>
                <h3 style={{ margin: '8px 0 6px', fontSize: '0.92rem' }}>Recent Redemptions Log</h3>
                {redemptions.length === 0 ? (
                  <p className="note">No Central District promo redemptions logged yet. Users can enter code <b>Jdhvpromo</b> on the Buy page.</p>
                ) : (
                  <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #334155', borderRadius: '8px' }}>
                    <table style={{ width: '100%', fontSize: '0.74rem', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ background: '#1e293b', borderBottom: '1px solid #334155', color: '#94a3b8' }}>
                          <th style={{ padding: '6px 8px' }}>Plot</th>
                          <th style={{ padding: '6px 8px' }}>Resident</th>
                          <th style={{ padding: '6px 8px' }}>Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {redemptions.map((r, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid #1e293b' }}>
                            <td style={{ padding: '5px 8px', fontWeight: 700, color: '#22d3ee' }}>{r.plotId}</td>
                            <td style={{ padding: '5px 8px' }}>{r.userEmail || r.userId}</td>
                            <td style={{ padding: '5px 8px', color: '#64748b' }}>{new Date(r.at).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── 4. Roads Tab ── */}
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

          {/* ── 5. Network Tab ── */}
          {tab === 'network' && net && (<>
            <h2>Network check</h2>
            <p className="note">Validated from the actual plot and road geometry: road connectivity, every storefront entrance facing a road or sidewalk, and overlaps.</p>
            <dl className="kv"><dt>Roads</dt><dd>{net.roads} · {net.connected ? <b className="st-av">all connected</b> : <b className="err">{net.components.length} disconnected groups</b>}</dd><dt>Plots</dt><dd>{net.plots}</dd>
              <dt>Entrance access</dt><dd>{net.unreachable.length ? <b className="err">{net.unreachable.length} plots without road access</b> : <b className="st-av">every plot reachable</b>}</dd><dt>Overlaps</dt><dd>{net.overlaps.length ? <b className="err">{net.overlaps.length} found</b> : <b className="st-av">none</b>}</dd></dl>
            {!net.connected && <div className="err-box"><b>Disconnected roads (highlighted red on the map):</b><br />{net.components.slice(1).flat().join(', ')}</div>}
            {net.unreachable.length > 0 && <div className="err-box"><b>No road access:</b><br />{net.unreachable.slice(0, 24).map(id => <button key={id} className="chip" onClick={() => { setSel(id); setTab('plot'); }}>{id}</button>)}</div>}
            {net.overlaps.length > 0 && <div className="err-box"><ul>{net.overlaps.slice(0, 10).map(o => <li key={o}>{o}</li>)}</ul></div>}
          </>)}

          {/* ── 6. Owners Tab ── */}
          {tab === 'owners' && (<>
            <h2>Store ownership</h2>
            <p className="note">{stores.length} buildings. Select one to reassign its owner, edit details, relocate or remove it.</p>
            <ul className="owner-list">{stores.filter(x => !matches || matches.has(x.plotId)).map(x => <li key={x.plotId}><button onClick={() => { setSel(x.plotId); setTab('plot'); }}><b>{x.config.name}</b><span>{x.plotId} · {layout.byId.get(x.plotId)?.district}</span><em>{ownerLabel(x.ownerId)}</em></button></li>)}</ul>
          </>)}

          {/* ── 7. Expand Tab ── */}
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
        <p>Delete road <b>{rd.id}</b>?</p>
        {!roadDelReport.connected && <p className="err">Deleting this road disconnects parts of the city road network.</p>}
        {roadDelReport.unreachable.length > 0 && <p className="err">{roadDelReport.unreachable.length} plots would lose road access.</p>}
      </Confirm>}
    </div>
  );
}