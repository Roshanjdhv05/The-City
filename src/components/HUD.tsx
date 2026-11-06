'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { storeDoor, plotFront, OBSTACLES } from '@/lib/plots';
import { Layout, isRing, layoutBounds } from '@/lib/layout';
import { areaAt, NATURE, Area } from '@/lib/areas';
import { terrainFor } from '@/lib/terrain';
import { player, useUI, QUALITY, Quality } from '@/lib/state';
import { trackEvent } from '@/lib/data';
import type { Plot, Store } from '@/lib/types';
const AdminMap = dynamic(() => import('@/components/admin/AdminMap'), { ssr: false });

type Guide = { id: string; name: string; x: number; z: number };
function Minimap({ occupied, layout, guide }: { occupied: Set<string>; layout: Layout; guide: Guide | null }) {
  const ref = useRef<HTMLCanvasElement>(null), g2 = useRef(guide); g2.current = guide;
  useEffect(() => {
    const c = ref.current!, g = c.getContext('2d')!, S = c.width, sc = 0.55; let raf = 0;
    const draw = () => {
      g.clearRect(0, 0, S, S); g.save(); g.beginPath(); g.arc(S / 2, S / 2, S / 2 - 3, 0, Math.PI * 2); g.clip(); g.fillStyle = '#10301f'; g.fillRect(0, 0, S, S);
      g.translate(S / 2, S / 2); g.rotate(player.yaw - Math.PI); g.scale(sc, sc); g.translate(-player.x, -player.z);
      g.strokeStyle = '#2d3650'; for (const r of layout.roads) { g.lineWidth = r.w; g.beginPath(); if (isRing(r)) g.arc(r.x0, r.z0, r.x1, 0, Math.PI * 2); else { g.moveTo(r.x0, r.z0); g.lineTo(r.x1, r.z1); } g.stroke(); }
      for (const o of OBSTACLES) { g.fillStyle = '#d9e8c8'; g.beginPath(); g.arc(o.cx, o.cz, o.r, 0, Math.PI * 2); g.fill(); }
      for (const p of layout.plots) { g.fillStyle = p.landmark ? '#e8eefc' : occupied.has(p.id) ? '#fb923c' : '#22d3ee'; g.globalAlpha = occupied.has(p.id) ? 0.95 : 0.6; g.save(); g.translate(p.x, p.z); g.rotate(-p.rot); g.fillRect(-p.w / 2, -p.d / 2, p.w, p.d); g.restore(); }
      g.globalAlpha = 1; const t = g2.current; if (t) { g.fillStyle = '#ff4d6d'; g.beginPath(); g.arc(t.x, t.z, 9, 0, Math.PI * 2); g.fill(); }
      g.restore();
      g.fillStyle = '#fff'; g.beginPath(); g.moveTo(S / 2, S / 2 - 8); g.lineTo(S / 2 + 6, S / 2 + 7); g.lineTo(S / 2 - 6, S / 2 + 7); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(34,211,238,.9)'; g.lineWidth = 2.5; g.beginPath(); g.arc(S / 2, S / 2, S / 2 - 2, 0, Math.PI * 2); g.stroke();
      g.fillStyle = '#fff'; g.font = '700 11px Arial'; g.textAlign = 'center';
      const na = -player.yaw + Math.PI; g.fillText('N', S / 2 + Math.sin(na) * (S / 2 - 12), S / 2 - Math.cos(na) * (S / 2 - 12) + 4);
      raf = requestAnimationFrame(draw);
    };
    draw(); return () => cancelAnimationFrame(raf);
  }, [occupied, layout]);
  return <canvas ref={ref} width={116} height={116} className="minimap" aria-label="Minimap" />;
}

const KEYS_HINT = 'Space jump · Shift run · double-tap Shift sprint · drag to orbit · scroll to zoom · V camera · E interact · F gather · M map';
export default function HUD({ stores, layout, initialStore }: { stores: Store[]; layout: Layout; initialStore?: string | null }) {
  const { view, setView, nearPlot, quality, setQuality, panelOpen, setPanel, nearRes, inv } = useUI();
  const [q, setQ] = useState(''), [intro, setIntro] = useState(true), [help, setHelp] = useState(false), [map, setMap] = useState(true), [district, setDistrict] = useState(''), distIdx = useRef(0), done = useRef(false);
  const [guide, setGuide] = useState<Guide | null>(null), [gInfo, setGInfo] = useState({ d: 0, a: 0 }), [mapOpen, setMapOpen] = useState(false), [pick, setPick] = useState<string | null>(null);
  const [area, setArea] = useState<Area | null>(null), [found, setFound] = useState<string[]>([]), [toast, setToast] = useState('');
  const occupied = useMemo(() => new Set(stores.map(s => s.plotId)), [stores]), terrain = useMemo(() => terrainFor(layoutBounds(layout, 0)), [layout]);
  const totalAreas = useMemo(() => new Set([...layout.plots.map(p => p.district), 'Civic Plaza', ...NATURE]).size, [layout]);
  useEffect(() => { const t = setTimeout(() => setIntro(false), 7000); return () => clearTimeout(t); }, []);
  useEffect(() => { try { setFound(JSON.parse(localStorage.getItem('thecity.discovered') || '[]')); } catch {} }, []);
  useEffect(() => { const id = setInterval(() => { const a = areaAt(player.x, player.z, layout, terrain); setArea(prev => (prev && prev.name === a.name ? prev : a)); }, 350); return () => clearInterval(id); }, [layout, terrain]);
  useEffect(() => { if (!area) return; setFound(f => { if (f.includes(area.name)) return f; const n = [...f, area.name]; try { localStorage.setItem('thecity.discovered', JSON.stringify(n)); } catch {} setToast(area.name); setTimeout(() => setToast(''), 3200); return n; }); }, [area]);
  useEffect(() => { if (!guide) return; const id = setInterval(() => { const dx = guide.x - player.x, dz = guide.z - player.z, d = Math.hypot(dx, dz); if (d < 6) { setGuide(null); return; } setGInfo({ d, a: Math.atan2(dx * -Math.cos(player.yaw) + dz * Math.sin(player.yaw), dx * Math.sin(player.yaw) + dz * Math.cos(player.yaw)) }); }, 150); return () => clearInterval(id); }, [guide]);

  const near = stores.find(s => s.plotId === nearPlot), nearP = nearPlot ? layout.byId.get(nearPlot) : undefined;
  const results = q ? [...stores.filter(s => (s.config.name + s.config.tagline + (layout.byId.get(s.plotId)?.district || '')).toLowerCase().includes(q.toLowerCase())).map(s => ({ id: s.plotId, name: s.config.name, sub: layout.byId.get(s.plotId)?.district || '' })),
    ...(q.length > 2 ? layout.plots.filter(p => !occupied.has(p.id) && (p.id + ' ' + p.district).toLowerCase().includes(q.toLowerCase())).slice(0, 4).map(p => ({ id: p.id, name: `Plot ${p.id}`, sub: p.district })) : [])].slice(0, 7) : [];
  const frontOf = (p: Plot): [number, number] => { const s = stores.find(x => x.plotId === p.id); return s ? storeDoor(p, s.config) : plotFront(p); };
  const go = (id: string, openPanel = true) => {
    const p = layout.byId.get(id); if (!p) return false; const [x, z] = frontOf(p);
    player.teleport = { x: x + Math.sin(p.rot) * 3, z: z + Math.cos(p.rot) * 3, yaw: p.rot + Math.PI }; setQ(''); setMapOpen(false); if (openPanel) setPanel(true); return true;
  };
  const guideTo = (id: string) => { const p = layout.byId.get(id); if (!p) return; const [x, z] = frontOf(p), s = stores.find(x => x.plotId === id); setGuide({ id, name: s?.config.name || `Plot ${id}`, x, z }); setMapOpen(false); setQ(''); };
  useEffect(() => { if (initialStore && !done.current && go(initialStore, false)) { done.current = true; setIntro(false); } }, [initialStore, stores, layout]); // eslint-disable-line
  // Entering a store is always an explicit click: the website never opens automatically.
  const enter = (s: Store) => { trackEvent(s.plotId, 'click'); if (s.config.website) window.open(s.config.website, '_blank', 'noopener,noreferrer'); };
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if ((e.target as HTMLElement).tagName === 'INPUT') return; if (e.code === 'KeyE' && nearPlot) { setPanel(true); if (stores.some(s => s.plotId === nearPlot)) trackEvent(nearPlot, 'visit'); } if (e.code === 'KeyM') setMapOpen(o => !o); if (e.code === 'Escape') { setPanel(false); setMapOpen(false); } };
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  }, [nearPlot, setPanel, stores]);
  const districts = useMemo(() => Array.from(new Set(layout.plots.map(p => p.district))), [layout]);
  const exploreDistrict = () => { const d = districts[distIdx.current++ % districts.length], first = layout.plots.find(p => p.district === d); setDistrict(d); if (first) go(first.id, false); };
  const pickP = pick ? layout.byId.get(pick) : undefined, pickS = stores.find(s => s.plotId === pick);

  return (
    <div className="hud">
      <div className="hud-tl">
        {map && <Minimap occupied={occupied} layout={layout} guide={guide} />}
        <div style={{ display: 'flex', gap: '.4rem' }}><button className="btn outline sm mini-toggle glass" onClick={() => setMap(!map)} aria-pressed={map}>{map ? 'Hide minimap' : 'Minimap'}</button><button className="btn outline sm mini-toggle glass" onClick={() => setMapOpen(true)}>City map (M)</button></div>
        {area && <div className="area-chip glass" aria-live="polite"><i className={area.kind} /><span><b>{area.name}</b><small>Discovered {Math.min(found.length, totalAreas)} / {totalAreas}</small></span></div>}
      </div>
      <div className="hud-top">
        <div className="search"><input placeholder="Search businesses or plots…" value={q} onChange={e => setQ(e.target.value)} aria-label="Search" />
          {results.length > 0 && <ul className="glass">{results.map(r => <li key={r.id} onClick={() => go(r.id)}><b>{r.name}</b><span>{r.sub}</span></li>)}</ul>}</div>
        <div className="seg" role="group" aria-label="Camera mode"><button className={view === '1p' ? 'on' : ''} onClick={() => setView('1p')} aria-pressed={view === '1p'}>1P</button><button className={view === '3p' ? 'on' : ''} onClick={() => setView('3p')} aria-pressed={view === '3p'}>3P</button></div>
        <select className="qsel" value={quality} onChange={e => setQuality(e.target.value as Quality)} aria-label="Graphics quality">{(Object.keys(QUALITY) as Quality[]).map(k => <option key={k} value={k}>{QUALITY[k].label.split(' ')[0]}</option>)}</select>
      </div>
      {guide && <div className="guide glass"><span className="arrow" style={{ transform: `rotate(${gInfo.a}rad)` }}>▲</span><span><b>{guide.name}</b><small>{Math.round(gInfo.d)} m</small></span><button className="ghost" onClick={() => setGuide(null)} aria-label="Stop guiding">✕</button></div>}
      {toast && <div className="toast glass" role="status"><small>New area discovered</small><b>{toast}</b></div>}
      {intro && !initialStore && <div className="loc-banner glass" onClick={() => go('J01')}><small>You are here</small><b>J Enterprise</b></div>}
      <div className="hud-bl">
        <div className="inv glass" aria-label="Inventory"><span><i className="w" />Wood <b>{inv.wood}</b></span><span><i className="s" />Stone <b>{inv.stone}</b></span><span><i className="c" />Crystal <b>{inv.crystal}</b></span></div>
        {help && <div className="help glass"><div className="keys"><span /><kbd>W</kbd><span /><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd></div><span>{KEYS_HINT}</span></div>}
        <button className="btn outline sm glass" onClick={() => setHelp(!help)} aria-expanded={help}>{help ? 'Hide controls' : 'Controls'}</button>
      </div>
      <div className="hud-br">{district && <span className="dist-label glass">District: {district}</span>}<button className="btn" onClick={exploreDistrict}>Explore District</button></div>
      {nearRes && !nearP && <div className="hint glass">Press <kbd>F</kbd> · Gather {nearRes.type}</div>}
      {nearP && !panelOpen && <div className="hint glass">Press <kbd>E</kbd> to View {near ? `Store · ${near.config.name}` : `Plot ${nearP.id}`}</div>}
      {nearP && panelOpen && near && (
        <aside className="store-panel glass" aria-label="Store information">
          <div className="head">
            <span className="logo-dot" style={{ background: near.config.logoUrl ? `center/cover url(${near.config.logoUrl})` : near.config.theme }}>{near.config.logoUrl ? '' : near.config.name[0]}</span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <h3 style={{ margin: 0 }}>{near.config.name}</h3>
                {!near.ownerId && <span className="badge" style={{ fontSize: '0.68rem', padding: '0.12rem 0.5rem', background: 'rgba(34,211,238,0.18)', color: '#22d3ee', border: '1px solid rgba(34,211,238,0.4)', borderRadius: 99 }}>Unclaimed</span>}
              </div>
              <p>{near.config.tagline || nearP.category}</p>
            </div>
          </div>
          <div className="meta"><div><b>{nearP.district.replace(' District', '')}</b>District</div><div><b>{near.plotId}</b>Plot</div><div><b>{near.visits.toLocaleString()}</b>Visits</div></div>
          <p className="note" style={{ margin: 0 }}>Category: {nearP.category}</p>
          <div className="actions">
            <button className="btn" disabled={!near.config.website} onClick={() => enter(near)}>{near.config.website ? 'Visit Website' : 'No website yet'}</button>
            {!near.ownerId && nearP.status === 'available' && <Link className="btn" href={`/buy?plot=${nearP.id}`}>Claim building</Link>}
            <button className="btn outline" onClick={() => setPanel(false)}>Close</button>
          </div>
        </aside>
      )}
      {nearP && panelOpen && !near && (
        <aside className="store-panel glass" aria-label="Plot information">
          <div className="head"><span className="logo-dot" style={{ background: '#22d3ee', color: '#04202b' }}>{nearP.tier === 'free' ? 'F' : '$'}</span><div><h3>Plot {nearP.id}</h3><p>{nearP.district} · {nearP.status === 'reserved' ? 'Reserved' : 'Available'}</p></div></div>
          <div className="meta"><div><b>{nearP.w}×{nearP.d} m</b>Size</div><div><b>{nearP.price ? `$${nearP.price}` : 'Free'}</b>Price</div><div><b style={{ textTransform: 'capitalize' }}>{nearP.tier}</b>Tier</div></div>
          <div className="actions">{nearP.status === 'available' ? <Link className="btn" href={`/buy?plot=${nearP.id}`}>View in marketplace</Link> : <button className="btn" disabled>Reserved</button>}<button className="btn outline" onClick={() => setPanel(false)}>Close</button></div>
        </aside>
      )}
      {mapOpen && (
        <div className="modal-back" onClick={() => setMapOpen(false)}>
          <div className="map-modal" onClick={e => e.stopPropagation()} role="dialog" aria-label="City map">
            <div className="admin-map-wrap"><AdminMap layout={layout} stores={stores} selected={pick} onSelect={setPick} matches={null} preview={null} showLabels showBuildings fitKey={0} /></div>
            <aside className="map-side">
              <div className="row" style={{ justifyContent: 'space-between' }}><h3 style={{ margin: 0 }}>City map</h3><button className="ghost" onClick={() => setMapOpen(false)} aria-label="Close map">✕</button></div>
              {pickP ? <>
                <h3>{pickS ? pickS.config.name : `Plot ${pickP.id}`}</h3><p className="note">{pickP.district} · {pickP.id} · {pickP.w}×{pickP.d} m{pickS ? '' : pickP.price ? ` · $${pickP.price}/mo` : ' · Free'}</p>
                <div className="actions-row"><button className="btn" onClick={() => guideTo(pickP.id)}>Guide me here</button><button className="btn outline" onClick={() => go(pickP.id)}>Teleport</button></div>
              </> : <p className="note">Click a plot or building to see its details. Press M or Esc to close.</p>}
            </aside>
          </div>
        </div>)}
    </div>
  );
}
