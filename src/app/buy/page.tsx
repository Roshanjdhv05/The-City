'use client';
import { Suspense, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import { useStores } from '@/components/useStores';
import { purchasePlot, useAuth } from '@/lib/data';
import { FACADES, TEMPLATES, THEMES, defaultConfig } from '@/lib/templates';
import { computeStats } from '@/lib/stats';
import type { Plot, StoreConfig } from '@/lib/types';
const AdminMap = dynamic(() => import('@/components/admin/AdminMap'), { ssr: false, loading: () => <div className="loading">Loading map…</div> });
const EditorCanvas = dynamic(() => import('@/components/EditorCanvas'), { ssr: false, loading: () => <div className="loading">Loading preview…</div> });

type Filter = 'all' | 'available' | 'premium' | 'occupied' | 'reserved';
const noop = () => {};
const TOOL = { kind: 'wall', rot: 0 } as const;

function Marketplace() {
  const { stores, layout, reload } = useStores(), { user } = useAuth(), router = useRouter(), params = useSearchParams();
  const S = useMemo(() => computeStats(layout, stores), [layout, stores]);
  const [sel, setSel] = useState<string | null>(params.get('plot')), [q, setQ] = useState(''), [filter, setFilter] = useState<Filter>('all'), [district, setDistrict] = useState(params.get('district') || 'All'), [sort, setSort] = useState('id');
  const [tpl, setTpl] = useState('tech'), [theme, setTheme] = useState(TEMPLATES.tech.patch.theme as string), [facade, setFacade] = useState('concrete'), [name, setName] = useState('');
  const [saved, setSaved] = useState<string[]>([]), [err, setErr] = useState(''), [busy, setBusy] = useState(false);
  useEffect(() => { try { setSaved(JSON.parse(localStorage.getItem('thecity.saved') || '[]')); } catch {} }, []);
  const toggleSave = (id: string) => setSaved(s => { const n = s.includes(id) ? s.filter(x => x !== id) : [...s, id]; try { localStorage.setItem('thecity.saved', JSON.stringify(n)); } catch {} return n; });

  useEffect(() => {
    if (store && !store.ownerId) {
      setTpl(store.config.template);
      setTheme(store.config.theme);
      setFacade(store.config.facade);
      setName(store.config.name);
    }
  }, [sel]); // eslint-disable-line

  const listed = useMemo(() => {
    const t = q.trim().toLowerCase();
    const l = layout.plots.filter(p => {
      const st = S.state(p);
      if (filter === 'available' && st !== 'available') return false; if (filter === 'occupied' && st !== 'occupied') return false; if (filter === 'reserved' && st !== 'reserved') return false;
      if (filter === 'premium' && p.tier === 'free') return false; if (district !== 'All' && p.district !== district) return false;
      return !t || [p.id, p.district, p.category, p.region || '', stores.find(s => s.plotId === p.id)?.config.name || ''].join(' ').toLowerCase().includes(t);
    });
    return l.sort((a, b) => (sort === 'low' ? a.price - b.price : sort === 'high' ? b.price - a.price : a.id.localeCompare(b.id)));
  }, [layout, stores, q, filter, district, sort, S]);
  const matches = useMemo(() => new Set(listed.map(p => p.id)), [listed]);
  const plot = layout.byId.get(sel || '') as Plot | undefined, st = plot ? S.state(plot) : null, store = stores.find(s => s.plotId === sel);
  const previewCfg: StoreConfig = useMemo(() => defaultConfig(tpl, { name: name.trim() || 'Your Store', theme, facade }), [tpl, name, theme, facade]);
  const districts = useMemo(() => ['All', ...Array.from(new Set(layout.plots.map(p => p.district)))], [layout]);

  const claim = async () => {
    if (!plot) return; if (!user) return router.push('/login');
    setBusy(true); setErr('');
    try { await purchasePlot(plot.id, user, tpl, { name: name.trim() || 'Your Store', theme, facade }); reload(); router.push('/editor?plot=' + plot.id); } catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  };
  const FILTERS: [Filter, string][] = [['all', 'All'], ['available', 'Available'], ['premium', 'Premium'], ['occupied', 'Occupied'], ['reserved', 'Reserved']];
  const stBadge = (s: string) => <span className={'badge ' + (s === 'available' ? 'av' : s === 'reserved' ? 'res' : 'occ')}>{s}</span>;

  return (
    <div className="page dark"><Nav />
      <div className="wrap" style={{ maxWidth: 1440 }}>
        <span className="eyebrow">Marketplace</span>
        <h1 style={{ fontSize: 'clamp(2rem,4vw,3.2rem)' }}>Find the right place in the city.</h1>
        <p className="sub">{S.available} of {S.plots} plots available across {S.districts} districts. Pick one on the map or in the list, preview a building, then claim it.</p>
        <div className="market">
          <div>
            <div className="map-card"><AdminMap layout={layout} stores={stores} selected={sel} onSelect={id => setSel(id)} matches={q || filter !== 'all' || district !== 'All' ? matches : null} preview={null} showLabels showBuildings fitKey={0} /></div>
            {plot && st ? (
              <section className="detail" aria-label="Selected plot">
                <div className="info">
                  <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
                    {stBadge(st)}
                    {store && !store.ownerId && <span className="badge" style={{ background: '#22d3ee', color: '#04202b' }}>Unclaimed Building</span>}
                    {plot.tier !== 'free' && <span className="badge gold">{plot.tier}</span>}
                    {plot.landmark && <span className="badge">landmark</span>}
                  </div>
                  <h2>{plot.id} · {plot.district}</h2>
                  <div className="price-big">{plot.price ? `$${plot.price}` : 'Free'}<small>{plot.price ? ' / month' : ''}</small></div>
                  <dl className="kv"><dt>Size</dt><dd>{plot.w} × {plot.d} m</dd><dt>Category</dt><dd>{plot.category}</dd><dt>Location</dt><dd>x {plot.x}, z {plot.z}</dd><dt>Region</dt><dd>{plot.region || 'Original city'}</dd>{store && <><dt>{store.ownerId ? 'Business' : 'Building'}</dt><dd>{store.config.name} ({store.ownerId ? 'Occupied' : 'Unclaimed'})</dd></>}</dl>
                  {store && <div className="actions-row" style={{ marginTop: '.4rem', marginBottom: '.6rem' }}><Link className="btn outline" href={`/city?store=${plot.id}`}>Visit {store.config.name} in 3D</Link></div>}
                  {st === 'available' && <>
                    <div className="field"><span>Building template</span><div className="chips">{Object.entries(TEMPLATES).map(([k, t]) => <button key={k} className={'chip' + (tpl === k ? ' on' : '')} onClick={() => { setTpl(k); setTheme(t.patch.theme as string); setFacade(t.patch.facade as string); }}>{t.label}</button>)}</div></div>
                    <div className="field"><span>Accent colour</span><div className="swatches">{THEMES.map(c => <button key={c} aria-label={c} className={c === theme ? 'on' : ''} style={{ background: c }} onClick={() => setTheme(c)} />)}</div></div>
                    <div className="field"><span>Facade material</span><div className="chips">{FACADES.map(f => <button key={f} className={'chip' + (facade === f ? ' on' : '')} onClick={() => setFacade(f)}>{f}</button>)}</div></div>
                    <label>Store name<input value={name} maxLength={28} placeholder="Your Store" onChange={e => setName(e.target.value)} /></label>
                    {err && <p className="err">{err}</p>}
                    <div className="actions-row">
                      <button className="btn" onClick={claim} disabled={busy}>{!user ? 'Sign in to claim' : busy ? 'Working…' : plot.price ? `Purchase · $${plot.price}/mo` : 'Claim free plot'}</button>
                      <button className="btn outline" onClick={() => toggleSave(plot.id)} aria-pressed={saved.includes(plot.id)}>{saved.includes(plot.id) ? '★ Saved' : '☆ Save plot'}</button>
                    </div>
                    <p className="note">Payments aren’t connected in this build, so claiming is instant. Saved plots are kept in this browser only; a true reservation hold needs a server-side table.</p>
                  </>}
                  {st === 'occupied' && <div className="actions-row"><Link className="btn" href={`/city?store=${plot.id}`}>Visit in 3D</Link></div>}
                  {st === 'reserved' && <p className="note">This plot is reserved by the city and can’t be claimed right now.</p>}
                </div>
                <div className="preview">
                  {st === 'available' ? <div style={{ position: 'absolute', inset: 0 }}><EditorCanvas cfg={previewCfg} setCfg={noop} tool={TOOL as any} showGrid={false} onMsg={noop} /></div>
                    : <div className="loading" style={{ padding: '1.5rem', textAlign: 'center' }}>{st === 'occupied' ? `${store?.config.name} occupies this plot.` : 'Preview is available for open plots.'}</div>}
                  {st === 'available' && <span className="badge glass" style={{ position: 'absolute', left: 12, top: 12 }}>Live 3D preview · drag to orbit</span>}
                </div>
              </section>
            ) : <div className="empty" style={{ marginTop: '1.2rem' }}>Select a plot on the map or from the list to see its details and a 3D building preview.</div>}
          </div>

          <aside className="list-card" aria-label="Plot listings">
            <div className="list-head">
              <input placeholder="Search plot ID, district, category…" value={q} onChange={e => setQ(e.target.value)} aria-label="Search plots" />
              <div className="chips">{FILTERS.map(([k, l]) => <button key={k} className={'chip' + (filter === k ? ' on' : '')} onClick={() => setFilter(k)}>{l}</button>)}</div>
              <div className="row2"><select value={district} onChange={e => setDistrict(e.target.value)} aria-label="District">{districts.map(d => <option key={d}>{d}</option>)}</select>
                <select value={sort} onChange={e => setSort(e.target.value)} aria-label="Sort"><option value="id">Sort: ID</option><option value="low">Price: low to high</option><option value="high">Price: high to low</option></select></div>
              <span className="note">{listed.length} plot{listed.length === 1 ? '' : 's'}{saved.length ? ` · ${saved.length} saved` : ''}</span>
            </div>
            <div className="plots">
              {listed.map(p => { const s = S.state(p); return (
                <button key={p.id} className={'plot' + (sel === p.id ? ' on' : '')} onClick={() => setSel(p.id)}>
                  <b>{saved.includes(p.id) ? '★ ' : ''}{p.id} · {p.district}</b><span className="pr">{p.price ? `$${p.price}` : 'Free'}</span>
                  <span>{p.w}×{p.d} m · {p.category}{p.tier !== 'free' ? ` · ${p.tier}` : ''}</span><span className="st">{stBadge(s)}</span>
                </button>); })}
              {!listed.length && <div className="empty">No plots match these filters.</div>}
            </div>
          </aside>
        </div>
      </div>
      <Footer />
    </div>
  );
}
export default function Buy() { return <Suspense fallback={<div className="loading">Loading marketplace…</div>}><Marketplace /></Suspense>; }
