'use client';
import { Suspense, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Nav from '@/components/Nav';
import { useStores } from '@/components/useStores';
import { saveStore, uploadLogo, useAuth } from '@/lib/data';
import { AWNINGS, DOORS, FACADES, GLASS, ROOFS, SIGNS, TEMPLATES, THEMES, TINTS, WINDOWS, defaultConfig } from '@/lib/templates';
import { useUI, QUALITY, Quality } from '@/lib/state';
import { GRID } from '@/lib/plots';
import type { StoreConfig } from '@/lib/types';
import type { Tool } from '@/components/EditorCanvas';
const EditorCanvas = dynamic(() => import('@/components/EditorCanvas'), { ssr: false, loading: () => <div className="loading">Loading preview…</div> });

const PIECES: [string, string][] = [['wall', 'Walls'], ['glass', 'Glass Panels'], ['window', 'Windows'], ['door', 'Doors'], ['roof', 'Roofs'], ['sign', 'Signs'], ['decor', 'Decorations']];

function Choice({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return <div className="field"><span>{label}</span><div className="chips">{options.map(o => <button key={o} className={'chip' + (o === value ? ' on' : '')} onClick={() => onChange(o)}>{o}</button>)}</div></div>;
}
function Swatches({ value, colors, onChange }: { value: string; colors: string[]; onChange: (v: string) => void }) {
  return <div className="swatches">{colors.map(c => <button key={c} aria-label={c} className={c === value ? 'on' : ''} style={{ background: c }} onClick={() => onChange(c)} />)}</div>;
}

function Editor() {
  const q = useSearchParams(), { user, ready } = useAuth(), { stores, reload } = useStores();
  const router = useRouter();
  const quality = useUI(s => s.quality), setQuality = useUI(s => s.setQuality);
  const mine = stores.filter(s => s.ownerId === user?.id), plotId = q.get('plot') || mine[0]?.plotId || '';
  const store = mine.find(s => s.plotId === plotId);
  const [cfg, setCfg] = useState<StoreConfig | null>(null), [tool, setTool] = useState<Tool>({ kind: 'wall', rot: 0 }), [grid, setGrid] = useState(true), [msg, setMsg] = useState(''), [status, setStatus] = useState('');
  useEffect(() => { if (store && !cfg) setCfg(store.config); }, [store, cfg]);
  if (!ready) return <div className="loading">Loading…</div>;
  if (!user) return <div className="panel narrow"><h1>Sign in to customize your store</h1><Link className="btn" href="/login">Sign in</Link></div>;
  if (!store || !cfg) return <div className="panel narrow"><h1>No store to edit</h1><p>You don&apos;t own a plot yet.</p><Link className="btn" href="/buy">Buy a plot</Link></div>;
  const set = (p: Partial<StoreConfig>) => setCfg({ ...cfg, ...p });
  const applyTemplate = (t: string) => setCfg({ ...defaultConfig(t), name: cfg.name, tagline: cfg.tagline, website: cfg.website, logoUrl: cfg.logoUrl, modules: cfg.modules, mode: cfg.mode, template: t });
  const save = async () => {
    setStatus('Saving…');
    try {
      await saveStore(store.plotId, cfg);
      reload();
      setStatus('✅ Saved! Taking you to your building in the city…');
      // Redirect to /city with the user's plot selected after a short delay
      setTimeout(() => {
        router.push('/city?store=' + store.plotId);
      }, 900);
    } catch (e: any) {
      setStatus('Error: ' + e.message);
    }
  };
  const upload = async (f?: File) => { if (!f) return; try { set({ logoUrl: await uploadLogo(f, user) }); } catch (e: any) { setStatus(e.message); } };
  const modular = cfg.mode === 'modular';
  return (
    <div className="editor">
      <aside className="side">
        <div className="seg wide"><button className={!modular ? 'on' : ''} onClick={() => set({ mode: 'template' })}>Ready-made</button><button className={modular ? 'on' : ''} onClick={() => set({ mode: 'modular' })}>Modular</button></div>
        <details open><summary>Logo &amp; details</summary>
          <label className="drop">Upload Logo / Banner<small>PNG, JPG (max 3MB)</small><input type="file" accept="image/png,image/jpeg,image/webp" onChange={e => upload(e.target.files?.[0])} /></label>
          <label>Store name<input value={cfg.name} maxLength={28} onChange={e => set({ name: e.target.value })} /></label>
          <label>Tagline<input value={cfg.tagline} maxLength={60} onChange={e => set({ tagline: e.target.value })} placeholder="Enter tagline..." /></label>
          <label>Website link<input value={cfg.website} onChange={e => set({ website: e.target.value })} placeholder="https://" /></label>
          <div className="field"><span>Color theme</span><Swatches value={cfg.theme} colors={THEMES} onChange={v => set({ theme: v })} /></div>
        </details>
        {!modular && <details><summary>Building template</summary><div className="chips">{Object.entries(TEMPLATES).map(([k, t]) => <button key={k} className={'chip' + (cfg.template === k ? ' on' : '')} onClick={() => applyTemplate(k)}>{t.label}</button>)}</div></details>}
        <details><summary>Facade materials</summary><Choice label="Material" value={cfg.facade} options={FACADES} onChange={v => set({ facade: v })} /><div className="field"><span>Tint</span><Swatches value={cfg.tint} colors={TINTS} onChange={v => set({ tint: v })} /></div></details>
        <details><summary>Windows &amp; doors</summary><Choice label="Glass" value={cfg.glass} options={GLASS} onChange={v => set({ glass: v })} />
          {!modular && <Choice label="Windows" value={cfg.windows} options={WINDOWS} onChange={v => set({ windows: v })} />}<Choice label="Door" value={cfg.door} options={DOORS} onChange={v => set({ door: v })} /></details>
        <details><summary>Roof &amp; awning</summary><Choice label="Roof" value={cfg.roof} options={ROOFS} onChange={v => set({ roof: v })} />{!modular && <Choice label="Awning" value={cfg.awning} options={AWNINGS} onChange={v => set({ awning: v })} />}</details>
        <details><summary>Signage &amp; lighting</summary>{!modular && <Choice label="Sign style" value={cfg.sign} options={SIGNS} onChange={v => set({ sign: v })} />}
          <label className="check"><input type="checkbox" checked={cfg.lights} onChange={e => set({ lights: e.target.checked })} />Illuminated sign, windows &amp; wall lights</label></details>
        {!modular && <details><summary>Architectural details</summary>
          <label>Floors: {cfg.floors}<input type="range" min={1} max={4} value={cfg.floors} onChange={e => set({ floors: +e.target.value })} /></label>
          {(['balcony', 'planters', 'trim'] as const).map(k => <label key={k} className="check"><input type="checkbox" checked={cfg[k]} onChange={e => set({ [k]: e.target.checked } as any)} />{k[0].toUpperCase() + k.slice(1)}</label>)}</details>}
        <details><summary>Graphics quality</summary><select value={quality} onChange={e => setQuality(e.target.value as Quality)}>{(Object.keys(QUALITY) as Quality[]).map(k => <option key={k} value={k}>{QUALITY[k].label}</option>)}</select></details>
        <button className="btn wide" onClick={save}>Save &amp; Go to My Building 🏙️</button>
        <p className="status" role="status">{status}</p>
      </aside>
      <section className="stage">
        <EditorCanvas cfg={cfg} setCfg={setCfg} tool={tool} showGrid={grid} onMsg={setMsg} />
        {modular && (
          <div className="palette">
            <div className="tools">
              {PIECES.map(([k, l]) => <button key={k} className={tool.kind === k ? 'on' : ''} onClick={() => setTool({ ...tool, kind: k as any })}>{l}</button>)}
              <button className={tool.kind === 'rotate' ? 'on' : ''} onClick={() => setTool({ ...tool, kind: 'rotate' })}>Rotate piece</button>
              <button className={tool.kind === 'erase' ? 'on' : ''} onClick={() => setTool({ ...tool, kind: 'erase' })}>Erase</button>
              <button onClick={() => setTool({ ...tool, rot: (tool.rot + 1) % 4 })}>Facing {tool.rot * 90}°</button>
              <button className={grid ? 'on' : ''} onClick={() => setGrid(!grid)}>Grid</button>
              <button onClick={() => set({ modules: [] })}>Clear</button>
            </div>
            <p>{msg || `Click a ${GRID}×${GRID} grid cell to place. Stack up to 3 levels, finish with a roof. Pieces snap to the grid and stay inside your plot.`}</p>
          </div>)}
      </section>
    </div>
  );
}
export default function EditorPage() { return <div className="page dark"><Nav /><Suspense fallback={<div className="loading">Loading…</div>}><Editor /></Suspense></div>; }
