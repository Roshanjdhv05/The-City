'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Layout, isRing, layoutBounds } from '@/lib/layout';
import { OBSTACLES, buildingOBB } from '@/lib/plots';
import { box, plotPoly, polyRect, Pt } from '@/lib/geom';
import { roadPoly } from '@/lib/city';
import type { ExpansionPlan } from '@/lib/expansion';
import type { Plot, Road, Store } from '@/lib/types';

const TIER_STROKE: Record<string, string> = { free: 'none', premium: '#60a5fa', featured: '#facc15', corner: '#c084fc' };
const DIST_COLOR: [string, string][] = [
  ['SAAS', '#0284c7'],
  ['AI', '#7c3aed'],
  ['DEVELOPMENT', '#059669'],
  ['WINDOWS APPS', '#2563eb'],
  ['MAC APPS', '#475569'],
  ['MOBILE APPS', '#ea580c'],
  ['GAMING', '#dc2626'],
  ['DESIGN', '#db2777'],
  ['MARKETING', '#d97706'],
  ['Central', '#64748b'],
];
const distColor = (n: string) => DIST_COLOR.find(([k]) => n.includes(k))?.[1] || '#475569';
type VB = { x: number; y: number; w: number; h: number };
const pts = (P: Pt[]) => P.map(p => p.join(',')).join(' ');

export default function AdminMap({ layout, stores, selected, onSelect, matches, preview, showLabels, showBuildings, fitKey, selectedRoad, onSelectRoad, highlightRoads, onCoordClick, theme = 'dark' }: {
  layout: Layout; stores: Store[]; selected: string | null; onSelect: (id: string | null) => void; matches: Set<string> | null; preview: ExpansionPlan | null; showLabels: boolean; showBuildings: boolean; fitKey: number;
  selectedRoad?: string | null; onSelectRoad?: (id: string) => void; highlightRoads?: Set<string> | null;
  onCoordClick?: (x: number, z: number) => void;
  theme?: 'dark' | 'light';
}) {
  const svg = useRef<SVGSVGElement>(null), drag = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  const [vb, setVb] = useState<VB>({ x: -360, y: -360, w: 720, h: 720 });
  const [mapFilter, setMapFilter] = useState<'all' | 'available' | 'locked' | 'occupied'>('all');
  const byStore = useMemo(() => new Map(stores.map(s => [s.plotId, s])), [stores]);
  const labels = useMemo(() => { const g = new Map<string, { x: number; z: number; n: number }>(); for (const p of layout.plots) { if (p.landmark) continue; const e = g.get(p.district) || { x: 0, z: 0, n: 0 }; e.x += p.x; e.z += p.z; e.n++; g.set(p.district, e); } return Array.from(g, ([name, e]) => ({ name, x: e.x / e.n, z: e.z / e.n })); }, [layout]);

  const availableCount = useMemo(() => layout.plots.filter(p => p.status === 'available' && !byStore.get(p.id)?.ownerId).length, [layout, byStore]);
  const lockedCount = useMemo(() => layout.plots.filter(p => p.status === 'reserved').length, [layout]);
  const occupiedCount = useMemo(() => layout.plots.filter(p => !!byStore.get(p.id)?.ownerId).length, [layout, byStore]);

  const fit = useCallback((extra?: ExpansionPlan | null) => {
    const el = svg.current; if (!el) return; const r = el.getBoundingClientRect(); if (!r.width) return;
    const b = layoutBounds(layout, 14), pb = extra?.bounds, x0 = Math.min(b.x0, pb?.x0 ?? 1e9), x1 = Math.max(b.x1, pb?.x1 ?? -1e9), z0 = Math.min(b.z0, pb?.z0 ?? 1e9), z1 = Math.max(b.z1, pb?.z1 ?? -1e9);
    let w = x1 - x0, h = z1 - z0; const ar = r.width / r.height; if (w / h < ar) w = h * ar; else h = w / ar;
    setVb({ x: (x0 + x1) / 2 - w / 2, y: (z0 + z1) / 2 - h / 2, w, h });
  }, [layout]);
  useEffect(() => { fit(); }, [fitKey]); // eslint-disable-line
  useEffect(() => { const t = setTimeout(() => fit(), 60); return () => clearTimeout(t); }, [layout.version]); // eslint-disable-line
  useEffect(() => {
    const el = svg.current!;
    const wheel = (e: WheelEvent) => { e.preventDefault(); const r = el.getBoundingClientRect(), k = e.deltaY > 0 ? 1.15 : 1 / 1.15; setVb(v => { const nw = Math.min(4000, Math.max(24, v.w * k)), s = nw / v.w, mx = v.x + ((e.clientX - r.left) / r.width) * v.w, my = v.y + ((e.clientY - r.top) / r.height) * v.h; return { x: mx - (mx - v.x) * s, y: my - (my - v.y) * s, w: nw, h: v.h * s }; }); };
    el.addEventListener('wheel', wheel, { passive: false }); return () => el.removeEventListener('wheel', wheel);
  }, []);
  const down = (e: React.PointerEvent) => { drag.current = { x: e.clientX, y: e.clientY, moved: false }; (e.target as Element).setPointerCapture?.(e.pointerId); };
  const move = (e: React.PointerEvent) => { const d = drag.current; if (!d) return; const r = svg.current!.getBoundingClientRect(), dx = e.clientX - d.x, dy = e.clientY - d.y; if (Math.abs(dx) + Math.abs(dy) > 3) d.moved = true; if (!d.moved) return; d.x = e.clientX; d.y = e.clientY; setVb(v => ({ ...v, x: v.x - (dx / r.width) * v.w, y: v.y - (dy / r.height) * v.h })); };
  const up = () => { setTimeout(() => (drag.current = null), 0); };
  const click = (fn: () => void) => { if (drag.current?.moved) return; fn(); };
  const zoom = (k: number) => setVb(v => ({ x: v.x + (v.w - v.w * k) / 2, y: v.y + (v.h - v.h * k) / 2, w: v.w * k, h: v.h * k }));
  const fs = Math.max(0.9, vb.w / 140), detail = vb.w < 360, far = vb.w > 300;

  const roadEl = (r: Road, key: string, stroke: string, extra: Partial<React.SVGProps<SVGElement>> = {}, onClick?: () => void) => isRing(r)
    ? <circle key={key} cx={r.x0} cy={r.z0} r={r.x1} fill="none" stroke={stroke} strokeWidth={r.w} onClick={onClick} style={{ cursor: onClick ? 'pointer' : undefined }} {...(extra as any)} />
    : <line key={key} x1={r.x0} y1={r.z0} x2={r.x1} y2={r.z1} stroke={stroke} strokeWidth={r.w} onClick={onClick} style={{ cursor: onClick ? 'pointer' : undefined }} {...(extra as any)} />;

  return (
    <div className={`admin-map ${theme === 'light' ? 'light' : ''}`}>
      {/* Top Filter Toolbar */}
      <div className={`map-filter-bar ${theme === 'light' ? 'light' : ''}`}>
        <button
          className={mapFilter === 'all' ? 'active' : ''}
          onClick={() => setMapFilter('all')}
        >
          All ({layout.plots.length})
        </button>
        <button
          className={`btn-avail ${mapFilter === 'available' ? 'active' : ''}`}
          onClick={() => setMapFilter('available')}
        >
          <span className="dot dot-avail" /> Available Free ({availableCount})
        </button>
        <button
          className={`btn-locked ${mapFilter === 'locked' ? 'active' : ''}`}
          onClick={() => setMapFilter('locked')}
        >
          <span className="dot dot-locked" /> 🔒 Locked ({lockedCount})
        </button>
        {occupiedCount > 0 && (
          <button
            className={`btn-occ ${mapFilter === 'occupied' ? 'active' : ''}`}
            onClick={() => setMapFilter('occupied')}
          >
            <span className="dot dot-occ" /> Claimed ({occupiedCount})
          </button>
        )}
      </div>

      <svg
        ref={svg}
        viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerLeave={up}
        onClick={(e) => {
          if (drag.current?.moved) return;
          if (onCoordClick && svg.current) {
            const pt = svg.current.createSVGPoint();
            pt.x = e.clientX;
            pt.y = e.clientY;
            const svgP = pt.matrixTransform(svg.current.getScreenCTM()?.inverse());
            onCoordClick(svgP.x, svgP.y);
          } else {
            click(() => onSelect(null));
          }
        }}
        role="img"
        aria-label="City map"
      >
        <defs>
          <pattern id="locked-hatch" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="4" height="4" fill="#334155" />
            <rect width="1.6" height="4" fill="#475569" />
          </pattern>
          <pattern id="hatch" width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="3" height="3" fill="#334155" />
            <rect width="1.4" height="4" fill="#475569" />
          </pattern>
        </defs>
        <rect x={vb.x - 4000} y={vb.y - 4000} width={vb.w + 8000} height={vb.h + 8000} fill={theme === 'light' ? '#eef5ec' : '#0f2f4a'} />
        <circle cx={0} cy={0} r={layoutBounds(layout, 0).x1 + 4} fill={theme === 'light' ? '#1f6438' : '#17422c'} />
        {layout.roads.map(r => roadEl(r, r.id, theme === 'light' ? '#2d3748' : '#2c3445', {}, onSelectRoad ? () => click(() => onSelectRoad(r.id)) : undefined))}
        {layout.roads.map(r => roadEl(r, 'c' + r.id, theme === 'light' ? '#cbd5e1' : '#8794ad', { strokeWidth: 0.35, strokeDasharray: '2 2', style: { pointerEvents: 'none' } }))}
        {selectedRoad && layout.roads.filter(r => r.id === selectedRoad).map(r => roadEl(r, 's' + r.id, '#22d3ee', { opacity: 0.55, style: { pointerEvents: 'none' } }))}
        {highlightRoads && layout.roads.filter(r => highlightRoads.has(r.id)).map(r => roadEl(r, 'h' + r.id, '#ef4444', { opacity: 0.6, style: { pointerEvents: 'none' } }))}
        {OBSTACLES.map(o => <g key={o.id} style={{ pointerEvents: 'none' }}><circle cx={o.cx} cy={o.cz} r={o.r} fill="#cfe7bd" opacity={0.9} /><circle cx={o.cx} cy={o.cz} r={o.r - 7} fill="none" stroke="#fff3e0" strokeWidth={5} opacity={0.7} /></g>)}
        {layout.plots.map(p => {
          const s = byStore.get(p.id);
          const isOcc = !!s?.ownerId;
          const isLandmark = p.id === 'J01';
          const isLocked = p.status === 'reserved';
          const isAvail = p.status === 'available' && !isOcc;

          let dim = matches ? !matches.has(p.id) : false;
          if (mapFilter === 'available' && !isAvail) dim = true;
          if (mapFilter === 'locked' && !isLocked) dim = true;
          if (mapFilter === 'occupied' && !isOcc) dim = true;

          const sel = selected === p.id;
          const P = plotPoly(p);
          const bb = s && showBuildings ? buildingOBB(p, s.config) : null;

          let plotFill: string;
          let plotStroke: string;
          let buildingFill: string;

          if (isOcc) {
            plotFill = '#f97316';
            plotStroke = sel ? '#ffffff' : '#fb923c';
            buildingFill = '#ea580c';
          } else if (isLandmark) {
            plotFill = '#2563eb';
            plotStroke = sel ? '#ffffff' : '#60a5fa';
            buildingFill = '#1d4ed8';
          } else if (isLocked) {
            plotFill = theme === 'light' ? '#475569' : 'url(#locked-hatch)';
            plotStroke = sel ? '#ffffff' : theme === 'light' ? '#334155' : '#64748b';
            buildingFill = theme === 'light' ? '#334155' : '#1e293b';
          } else {
            plotFill = '#22c55e';
            plotStroke = sel ? '#ffffff' : theme === 'light' ? '#16a34a' : '#86efac';
            buildingFill = '#15803d';
          }

          return (
            <g key={p.id} opacity={dim ? 0.15 : 1} onClick={e => { e.stopPropagation(); click(() => onSelect(p.id)); }} style={{ cursor: 'pointer' }}>
              <polygon
                points={pts(P)}
                fill={plotFill}
                fillOpacity={isLocked ? 0.92 : isAvail ? 0.88 : 0.9}
                stroke={plotStroke}
                strokeWidth={sel ? 2 : 0.6}
              />
              {bb && (
                <polygon
                  points={pts(box(bb.cx, bb.cz, [Math.cos(bb.a), -Math.sin(bb.a)], [Math.sin(bb.a), Math.cos(bb.a)], bb.hw, bb.hd))}
                  fill={buildingFill}
                  stroke={sel ? '#ffffff' : 'rgba(255,255,255,0.45)'}
                  strokeWidth={0.25}
                />
              )}
              {isLocked && detail && !isLandmark && (
                <text x={p.x} y={p.z} fontSize={fs * 0.9} fill="#cbd5e1" textAnchor="middle" dominantBaseline="middle" style={{ pointerEvents: 'none' }}>🔒</text>
              )}
              {isAvail && detail && (
                <text x={p.x} y={p.z} fontSize={fs * 0.72} fill="#ffffff" fontWeight={800} textAnchor="middle" dominantBaseline="middle" style={{ pointerEvents: 'none', paintOrder: 'stroke' }} stroke="#14532d" strokeWidth={fs * 0.12}>FREE</text>
              )}
              {showLabels && detail && !isLocked && !isAvail && (
                <text x={p.x} y={p.z} fontSize={fs * 0.8} fill="#fff" textAnchor="middle" dominantBaseline="middle" style={{ pointerEvents: 'none', paintOrder: 'stroke' }} stroke="#000" strokeWidth={fs * 0.12}>{s ? s.config.name : p.id}</text>
              )}
            </g>
          );
        })}
        {showLabels && far && labels.map(l => <g key={l.name} style={{ pointerEvents: 'none' }}><rect x={l.x - vb.w / 12} y={l.z - vb.w / 60} width={vb.w / 6} height={vb.w / 30} rx={vb.w / 60} fill={distColor(l.name)} opacity={0.92} /><text x={l.x} y={l.z} fontSize={vb.w / 62} fill="#fff" fontWeight={700} textAnchor="middle" dominantBaseline="middle">{l.name.replace(' District', '')}</text></g>)}
        {showLabels && far && <g style={{ pointerEvents: 'none' }}><rect x={-34} y={-7} width={68} height={14} rx={7} fill="#0f172a" /><text x={0} y={0} fontSize={7} fill="#fff" fontWeight={700} textAnchor="middle" dominantBaseline="middle">J Enterprise Tower</text></g>}
        {preview && preview.region.id && <g style={{ pointerEvents: 'none' }}>
          {preview.roads.map(r => <polygon key={r.id} points={pts(roadPoly(r))} fill={preview.errors.length ? '#7f1d1d' : '#1e3a8a'} opacity={0.85} stroke="#93c5fd" strokeWidth={0.3} strokeDasharray="1.5 1" />)}
          {preview.plots.map(p => <g key={p.id}><polygon points={pts(plotPoly(p))} fill={preview.errors.length ? '#ef4444' : '#38bdf8'} opacity={0.55} stroke="#fff" strokeWidth={0.3} strokeDasharray="1.5 1" />{detail && <text x={p.x} y={p.z} fontSize={fs * 0.7} fill="#fff" textAnchor="middle" dominantBaseline="middle">{p.id}</text>}</g>)}
        </g>}
      </svg>
      <div className={`map-ctrl ${theme === 'light' ? 'light' : ''}`}>
        <button onClick={() => zoom(1 / 1.4)} aria-label="Zoom in">+</button>
        <button onClick={() => zoom(1.4)} aria-label="Zoom out">−</button>
        <button onClick={() => fit(preview)} aria-label="Fit map">⛶</button>
      </div>
      {theme === 'light' ? (
        <ul className="legend admin-legend light">
          <li><i style={{ background: '#22c55e' }} />Available · Free to Claim ({availableCount})</li>
          <li><i style={{ background: '#475569' }} />🔒 Locked ({lockedCount})</li>
          <li><i style={{ background: '#2563eb' }} />🏢 J Enterprise Landmark</li>
          {occupiedCount > 0 && <li><i style={{ background: '#f97316' }} />Claimed by Owner ({occupiedCount})</li>}
        </ul>
      ) : (
        <ul className="legend admin-legend">
          <li><i style={{ background: '#22c55e' }} />Available · Free to Claim ({availableCount})</li>
          <li><i style={{ background: '#475569' }} />🔒 Permanently Locked ({lockedCount})</li>
          <li><i style={{ background: '#2563eb' }} />🏢 Landmark · J Enterprise</li>
          {occupiedCount > 0 && <li><i style={{ background: '#f97316' }} />Claimed ({occupiedCount})</li>}
        </ul>
      )}
    </div>
  );
}
