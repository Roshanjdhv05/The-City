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
import AdminMap from '@/components/admin/AdminMap';
import { useTimeStore, formatClock, getTimePhase, TIME_PRESETS } from '@/lib/time';
import { useMultiplayer } from '@/lib/multiplayer';

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

const KEYS_HINT = 'Space/E up · Q down · Shift fast · drag look · scroll zoom · V camera · T time · F gather · M map';

function TimeWidget() {
  const { hour, isPlaying, isLiveDevice, speed, setHour, togglePlay, setLiveDevice, setSpeed } = useTimeStore();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const info = getTimePhase(hour);

  if (!mounted) {
    return (
      <div
        className="time-widget glass"
        style={{
          position: 'absolute',
          top: 'calc(var(--nav-h) + 12px)',
          right: '16px',
          zIndex: 60,
          opacity: 0,
          pointerEvents: 'none',
        }}
      />
    );
  }

  return (
    <div
      className="time-widget glass"
      style={{
        position: 'absolute',
        top: 'calc(var(--nav-h) + 12px)',
        right: '16px',
        zIndex: 60,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.45rem',
        borderRadius: open ? '18px' : '999px',
        padding: open ? '0.55rem 0.85rem' : '0.35rem 0.7rem',
        background: 'rgba(10, 16, 30, 0.55)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.14)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.45)',
        color: '#ffffff',
        fontSize: '0.82rem',
        transition: 'all 0.25s ease',
      }}
    >
      {/* Top Header Row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <button
          onClick={() => setOpen(!open)}
          style={{
            background: 'none',
            border: 'none',
            color: '#ffffff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.2rem 0.4rem',
            borderRadius: '999px',
            fontWeight: 600,
          }}
          title="Click to toggle time controls"
        >
          <span style={{ fontSize: '1.1rem' }} suppressHydrationWarning>{info.icon}</span>
          <span style={{ letterSpacing: '-0.01em', fontWeight: 700 }} suppressHydrationWarning>{formatClock(hour)}</span>
          <span style={{ color: 'rgba(255, 255, 255, 0.65)', fontWeight: 500, fontSize: '0.74rem' }}>
            · {info.label}
          </span>
          {isLiveDevice && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                fontSize: '0.65rem',
                padding: '0.12rem 0.45rem',
                borderRadius: '999px',
                background: 'rgba(34, 197, 94, 0.2)',
                border: '1px solid rgba(34, 197, 94, 0.5)',
                color: '#4ade80',
                fontWeight: 700,
                letterSpacing: '0.04em',
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 6px #4ade80' }} />
              LIVE
            </span>
          )}
          <span style={{ fontSize: '0.65rem', color: 'rgba(255, 255, 255, 0.5)', marginLeft: '0.2rem' }}>
            {open ? '▲' : '▼'}
          </span>
        </button>

        {/* Play/Pause Cycle */}
        <button
          onClick={togglePlay}
          style={{
            background: isPlaying ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255, 255, 255, 0.08)',
            border: '1px solid ' + (isPlaying ? 'rgba(56, 189, 248, 0.6)' : 'rgba(255, 255, 255, 0.16)'),
            color: isPlaying ? '#38bdf8' : '#ffffff',
            borderRadius: '999px',
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: '0.75rem',
            transition: 'all 0.2s',
          }}
          title={isPlaying ? 'Pause day/night cycle' : 'Auto-cycle day & night'}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>
      </div>

      {/* Expandable Controls Dropdown */}
      {open && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.65rem',
            paddingTop: '0.55rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.12)',
            animation: 'rise 0.2s ease',
          }}
        >
          {/* Live Device Sync Toggle */}
          <button
            onClick={() => setLiveDevice(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '0.4rem 0.8rem',
              borderRadius: '8px',
              border: isLiveDevice ? '1px solid rgba(34, 197, 94, 0.7)' : '1px solid rgba(255, 255, 255, 0.14)',
              background: isLiveDevice ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255, 255, 255, 0.06)',
              color: isLiveDevice ? '#4ade80' : '#e2e8f0',
              cursor: 'pointer',
              fontSize: '0.76rem',
              fontWeight: 600,
              transition: 'all 0.2s',
            }}
          >
            <span style={{ fontSize: '0.9rem' }}>🕒</span>
            <span>{isLiveDevice ? '✓ Synced with Device Clock' : 'Sync to Device Clock'}</span>
          </button>

          {/* Quick Presets */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.3rem' }}>
            {[
              { id: 'sunrise', label: 'Sunrise', hour: 6.2, icon: '🌅' },
              { id: 'day', label: 'Noon', hour: 12.0, icon: '☀️' },
              { id: 'sunset', label: 'Sunset', hour: 18.2, icon: '🌇' },
              { id: 'night', label: 'Night', hour: 22.0, icon: '🌙' },
            ].map((p) => {
              const active = !isLiveDevice && Math.abs(hour - p.hour) < 1.5;
              return (
                <button
                  key={p.id}
                  onClick={() => setHour(p.hour)}
                  style={{
                    background: active ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255, 255, 255, 0.06)',
                    border: active ? '1px solid rgba(56, 189, 248, 0.65)' : '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#ffffff',
                    borderRadius: '8px',
                    padding: '0.35rem 0.2rem',
                    cursor: 'pointer',
                    fontSize: '0.72rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.15rem',
                    transition: 'all 0.2s',
                  }}
                  title={`Set to ${p.label}`}
                >
                  <span style={{ fontSize: '0.95rem' }}>{p.icon}</span>
                  <span>{p.label}</span>
                </button>
              );
            })}
          </div>

          {/* Time Scrubber */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span style={{ fontSize: '0.7rem', color: '#94a3b8', width: '30px' }}>Hour</span>
            <input
              type="range"
              min={0}
              max={24}
              step={0.1}
              value={hour}
              onChange={(e) => setHour(parseFloat(e.target.value))}
              style={{ flex: 1, accentColor: '#38bdf8', cursor: 'ew-resize' }}
            />
          </div>

          {/* Speed Selector */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: '#94a3b8' }}>
            <span>Speed:</span>
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              {[0.5, 1.0, 2.0, 5.0].map((s) => (
                <button
                  key={s}
                  onClick={() => setSpeed(s)}
                  style={{
                    background: speed === s ? 'rgba(56, 189, 248, 0.35)' : 'rgba(255, 255, 255, 0.08)',
                    border: speed === s ? '1px solid rgba(56, 189, 248, 0.65)' : '1px solid rgba(255, 255, 255, 0.1)',
                    color: speed === s ? '#38bdf8' : '#ffffff',
                    borderRadius: '4px',
                    padding: '0.15rem 0.45rem',
                    cursor: 'pointer',
                    fontSize: '0.68rem',
                    fontWeight: speed === s ? 700 : 400,
                  }}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
// ─── Online Players Panel ───────────────────────────────────────────────────
import type { RemotePlayer } from '@/lib/multiplayer';

function OnlinePlayersPanel({ myName, myColor, remotePlayers }: { myName: string; myColor: string; remotePlayers: RemotePlayer[] }) {
  const [open, setOpen] = useState(false);
  const total = remotePlayers.length + 1;

  return (
    <div style={{ position: 'relative' }}>
      {/* Pill button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="glass"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '7px',
          padding: '0.35rem 0.85rem',
          borderRadius: '999px',
          fontSize: '0.78rem',
          fontWeight: 600,
          color: '#e2e8f0',
          border: '1px solid rgba(255,255,255,0.18)',
          background: 'rgba(10,16,30,0.6)',
          cursor: 'pointer',
          userSelect: 'none',
          transition: 'border-color 0.2s',
        }}
        title="Click to see who is online"
      >
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 8px #4ade80', flexShrink: 0 }} />
        <span>👥 {total} Online</span>
        <span style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.45)', marginLeft: 2 }}>{open ? '▲' : '▼'}</span>
      </button>

      {/* Dropdown list */}
      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            minWidth: '180px',
            background: 'rgba(10,16,30,0.88)',
            backdropFilter: 'blur(18px)',
            WebkitBackdropFilter: 'blur(18px)',
            border: '1px solid rgba(255,255,255,0.14)',
            borderRadius: '14px',
            padding: '0.55rem 0.65rem',
            zIndex: 200,
            boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
            animation: 'rise 0.18s ease',
          }}
        >
          <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#64748b', fontWeight: 700, padding: '0 0.3rem 0.4rem', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: '0.4rem' }}>
            Live Explorers
          </div>
          {/* You */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.3rem 0.3rem' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: myColor, boxShadow: `0 0 8px ${myColor}`, flexShrink: 0 }} />
            <span style={{ color: '#ffffff', fontSize: '0.8rem', fontWeight: 600, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {myName}
            </span>
            <span style={{ fontSize: '0.62rem', color: '#4ade80', fontWeight: 700, background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.3)', borderRadius: '999px', padding: '0.08rem 0.4rem' }}>You</span>
          </div>
          {/* Others */}
          {remotePlayers.length === 0 ? (
            <div style={{ color: '#475569', fontSize: '0.74rem', padding: '0.3rem 0.3rem', fontStyle: 'italic' }}>No other visitors yet</div>
          ) : remotePlayers.map(p => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.3rem 0.3rem' }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: p.color, boxShadow: `0 0 7px ${p.color}`, flexShrink: 0 }} />
              <span style={{ color: '#e2e8f0', fontSize: '0.8rem', fontWeight: 500, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {p.name}
              </span>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: p.moving ? '#4ade80' : '#64748b', flexShrink: 0 }} title={p.moving ? 'Moving' : 'Idle'} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function HUD({ stores, layout, initialStore }: { stores: Store[]; layout: Layout; initialStore?: string | null }) {
  const { view, setView, nearPlot, quality, setQuality, panelOpen, setPanel, nearRes, inv } = useUI();
  const { myName, myColor, remotePlayers } = useMultiplayer();
  const [q, setQ] = useState(''), [intro, setIntro] = useState(true), [help, setHelp] = useState(false), [map, setMap] = useState(true), [district, setDistrict] = useState(''), distIdx = useRef(0), done = useRef(false);
  const [guide, setGuide] = useState<Guide | null>(null), [gInfo, setGInfo] = useState({ d: 0, a: 0 }), [mapOpen, setMapOpen] = useState(false), [pick, setPick] = useState<string | null>(null);
  const [area, setArea] = useState<Area | null>(null), [found, setFound] = useState<string[]>([]), [toast, setToast] = useState('');
  const [dismissedPlot, setDismissedPlot] = useState<string | null>(null);
  const lastTrackedPlot = useRef<string | null>(null);
  const occupied = useMemo(() => new Set(stores.map(s => s.plotId)), [stores]), terrain = useMemo(() => terrainFor(layoutBounds(layout, 0)), [layout]);
  const totalAreas = useMemo(() => new Set([...layout.plots.map(p => p.district), 'Civic Plaza', ...NATURE]).size, [layout]);
  useEffect(() => { const t = setTimeout(() => setIntro(false), 7000); return () => clearTimeout(t); }, []);
  useEffect(() => { try { setFound(JSON.parse(localStorage.getItem('thecity.discovered') || '[]')); } catch {} }, []);
  useEffect(() => { const id = setInterval(() => { const a = areaAt(player.x, player.z, layout, terrain); setArea(prev => (prev && prev.name === a.name ? prev : a)); }, 350); return () => clearInterval(id); }, [layout, terrain]);
  const [marketBanner, setMarketBanner] = useState<string | null>(null);
  const lastMarket = useRef<string | null>(null);

  useEffect(() => {
    if (!nearPlot) {
      setDismissedPlot(null);
      return;
    }
    // Track visit once automatically when walking near the store
    if (nearPlot !== lastTrackedPlot.current) {
      lastTrackedPlot.current = nearPlot;
      if (stores.some(s => s.plotId === nearPlot)) {
        trackEvent(nearPlot, 'visit');
      }
    }
  }, [nearPlot, stores]);

  useEffect(() => {
    if (!area) return;
    if (area.name !== lastMarket.current) {
      lastMarket.current = area.name;
      setMarketBanner(area.name);
      const t = setTimeout(() => setMarketBanner(null), 3600);
      return () => clearTimeout(t);
    }
  }, [area]);
  useEffect(() => { if (!guide) return; const id = setInterval(() => { const dx = guide.x - player.x, dz = guide.z - player.z, d = Math.hypot(dx, dz); if (d < 6) { setGuide(null); return; } setGInfo({ d, a: Math.atan2(dx * -Math.cos(player.yaw) + dz * Math.sin(player.yaw), dx * Math.sin(player.yaw) + dz * Math.cos(player.yaw)) }); }, 150); return () => clearInterval(id); }, [guide]);

  const near = stores.find(s => s.plotId === nearPlot), nearP = nearPlot ? layout.byId.get(nearPlot) : undefined;
  const showBuildingDetails = !!nearP && dismissedPlot !== nearPlot;
  const results = q ? [...stores.filter(s => (s.config.name + s.config.tagline + (layout.byId.get(s.plotId)?.district || '')).toLowerCase().includes(q.toLowerCase())).map(s => ({ id: s.plotId, name: s.config.name, sub: layout.byId.get(s.plotId)?.district || '' })),
    ...(q.length > 2 ? layout.plots.filter(p => !occupied.has(p.id) && (p.id + ' ' + p.district).toLowerCase().includes(q.toLowerCase())).slice(0, 4).map(p => ({ id: p.id, name: `Plot ${p.id}`, sub: p.district })) : [])].slice(0, 7) : [];
  const frontOf = (p: Plot): [number, number] => { const s = stores.find(x => x.plotId === p.id); return s ? storeDoor(p, s.config) : plotFront(p); };
  const go = (id: string, openPanel = true) => {
    const p = layout.byId.get(id); if (!p) return false; const [x, z] = frontOf(p);
    player.teleport = { x: x + Math.sin(p.rot) * 3, z: z + Math.cos(p.rot) * 3, yaw: p.rot + Math.PI }; setQ(''); setMapOpen(false); if (openPanel) setPanel(true); return true;
  };
  const teleportToCoord = (wx: number, wz: number) => {
    player.teleport = { x: wx, z: wz, yaw: player.yaw };
    setMapOpen(false);
  };
  const guideTo = (id: string) => { const p = layout.byId.get(id); if (!p) return; const [x, z] = frontOf(p), s = stores.find(x => x.plotId === id); setGuide({ id, name: s?.config.name || `Plot ${id}`, x, z }); setMapOpen(false); setQ(''); };
  useEffect(() => { if (initialStore && !done.current && go(initialStore, false)) { done.current = true; setIntro(false); } }, [initialStore, stores, layout]); // eslint-disable-line
  // Entering a store is always an explicit click: the website never opens automatically.
  const enter = (s: Store) => { trackEvent(s.plotId, 'click'); if (s.config.website) window.open(s.config.website, '_blank', 'noopener,noreferrer'); };
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') return;
      if (e.code === 'KeyM') setMapOpen(o => !o);
      if (e.code === 'KeyT') {
        const presets = [6.0, 11.5, 14.5, 18.2, 20.0, 22.5, 0.5];
        const cur = useTimeStore.getState().hour;
        const next = presets.find(p => p > cur + 0.5) ?? presets[0];
        useTimeStore.getState().setHour(next);
      }
      if (e.code === 'Escape') {
        if (nearPlot) setDismissedPlot(nearPlot);
        setPanel(false);
        setMapOpen(false);
      }
    };
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  }, [nearPlot, setPanel]);
  const districts = useMemo(() => Array.from(new Set(layout.plots.map(p => p.district))), [layout]);
  const exploreDistrict = () => { const d = districts[distIdx.current++ % districts.length], first = layout.plots.find(p => p.district === d); setDistrict(d); if (first) go(first.id, false); };
  const pickP = pick ? layout.byId.get(pick) : undefined, pickS = stores.find(s => s.plotId === pick);

  return (
    <div className="hud">
      <TimeWidget />
      <div className="hud-tl">
        {map && (
          <div
            onClick={() => setMapOpen(true)}
            title="Click to open City Map (M)"
            style={{
              position: 'relative',
              cursor: 'pointer',
              borderRadius: '50%',
              padding: '2px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1.5px solid rgba(34, 211, 238, 0.45)',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.45), 0 0 16px rgba(34, 211, 238, 0.2)',
              transition: 'transform 0.2s ease, border-color 0.2s ease',
            }}
          >
            <Minimap occupied={occupied} layout={layout} guide={guide} />
            <div
              style={{
                position: 'absolute',
                bottom: 4,
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(10, 16, 30, 0.85)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                color: '#22d3ee',
                fontSize: '0.62rem',
                fontWeight: 700,
                padding: '0.12rem 0.55rem',
                borderRadius: '999px',
                border: '1px solid rgba(34, 211, 238, 0.4)',
                whiteSpace: 'nowrap',
                pointerEvents: 'none',
              }}
            >
              Open Map ↗
            </div>
          </div>
        )}
        <div style={{ display: 'flex', gap: '.4rem' }}>
          <button className="btn outline sm mini-toggle glass" onClick={() => setMap(!map)} aria-pressed={map}>
            {map ? 'Hide minimap' : 'Minimap'}
          </button>
          <button className="btn outline sm mini-toggle glass" onClick={() => setMapOpen(true)}>
            City map (M)
          </button>
        </div>
        {area && (
          <div className="area-chip glass" aria-live="polite">
            <i className={area.kind} />
            <span>
              <b>{area.name}</b>
              <small>Discovered {Math.min(found.length, totalAreas)} / {totalAreas}</small>
            </span>
          </div>
        )}
      </div>
      <div className="hud-top">
        <div className="search"><input placeholder="Search businesses or plots…" value={q} onChange={e => setQ(e.target.value)} aria-label="Search" />
          {results.length > 0 && <ul className="glass">{results.map(r => <li key={r.id} onClick={() => go(r.id)}><b>{r.name}</b><span>{r.sub}</span></li>)}</ul>}</div>
        <div className="seg" role="group" aria-label="Camera mode">
          <button className={view === '1p' ? 'on' : ''} onClick={() => setView('1p')} aria-pressed={view === '1p'}>1P</button>
          <button className={view === '3p' ? 'on' : ''} onClick={() => setView('3p')} aria-pressed={view === '3p'}>3P</button>
          <button
            className={view === 'free' ? 'on' : ''}
            onClick={() => setView(view === 'free' ? '3p' : 'free')}
            aria-pressed={view === 'free'}
            title="Free fly — WASD move · Space/E up · Q down · Shift fast"
            style={view === 'free' ? { background: 'rgba(250,204,21,0.25)', color: '#fde047', borderColor: 'rgba(250,204,21,0.6)' } : {}}
          >
            🪂 Free
          </button>
        </div>
        <select className="qsel" value={quality} onChange={e => setQuality(e.target.value as Quality)} aria-label="Graphics quality">{(Object.keys(QUALITY) as Quality[]).map(k => <option key={k} value={k}>{QUALITY[k].label.split(' ')[0]}</option>)}</select>

        {/* Live Online Explorers Panel */}
        <OnlinePlayersPanel myName={myName} myColor={myColor} remotePlayers={remotePlayers} />
      </div>
      {marketBanner && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(var(--nav-h) + 72px)',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 90,
            background: 'none',
            border: 'none',
            boxShadow: 'none',
            padding: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: '4px',
            animation: 'rise 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)',
            pointerEvents: 'none',
            userSelect: 'none',
          }}
          role="status"
        >
          <div
            style={{
              fontSize: '0.68rem',
              textTransform: 'uppercase',
              letterSpacing: '0.28em',
              color: '#38bdf8',
              fontWeight: 700,
              textShadow: '0 2px 10px rgba(0, 0, 0, 0.95), 0 0 16px rgba(56, 189, 248, 0.7)',
            }}
          >
            Entering Market
          </div>
          <div
            style={{
              fontSize: '2.1rem',
              fontWeight: 900,
              color: '#ffffff',
              letterSpacing: '-0.02em',
              textShadow: '0 4px 20px rgba(0, 0, 0, 0.95), 0 0 35px rgba(0, 0, 0, 0.85)',
            }}
          >
            {marketBanner}
          </div>
        </div>
      )}
      {guide && <div className="guide glass"><span className="arrow" style={{ transform: `rotate(${gInfo.a}rad)` }}>▲</span><span><b>{guide.name}</b><small>{Math.round(gInfo.d)} m</small></span><button className="ghost" onClick={() => setGuide(null)} aria-label="Stop guiding">✕</button></div>}
      {toast && <div className="toast glass" role="status"><small>New area discovered</small><b>{toast}</b></div>}
      {intro && !initialStore && <div className="loc-banner glass" onClick={() => go('J01')}><small>You are here</small><b>J Enterprise</b></div>}

      {/* ── Free-fly mode active badge ── */}
      {view === 'free' && (
        <div
          style={{
            position: 'absolute',
            bottom: '5.5rem',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 80,
            background: 'rgba(10, 16, 30, 0.72)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1.5px solid rgba(250, 204, 21, 0.55)',
            boxShadow: '0 8px 28px rgba(0,0,0,0.5), 0 0 20px rgba(250,204,21,0.15)',
            borderRadius: '999px',
            padding: '0.5rem 1.5rem',
            color: '#fde047',
            display: 'flex',
            alignItems: 'center',
            gap: '0.9rem',
            fontSize: '0.8rem',
            fontWeight: 600,
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
          }}
          role="status"
        >
          <span style={{ fontSize: '1.1rem' }}>🪂</span>
          <span style={{ color: '#fde047', fontWeight: 800, letterSpacing: '0.08em', fontSize: '0.72rem', textTransform: 'uppercase' }}>Free Fly</span>
          <span style={{ width: '1px', height: '14px', background: 'rgba(253,224,71,0.3)' }} />
          <span style={{ color: '#e2e8f0', fontSize: '0.76rem', fontWeight: 500 }}>WASD move</span>
          <span style={{ color: 'rgba(253,224,71,0.5)' }}>·</span>
          <span style={{ color: '#e2e8f0', fontSize: '0.76rem', fontWeight: 500 }}>Space / E  up</span>
          <span style={{ color: 'rgba(253,224,71,0.5)' }}>·</span>
          <span style={{ color: '#e2e8f0', fontSize: '0.76rem', fontWeight: 500 }}>Q  down</span>
          <span style={{ color: 'rgba(253,224,71,0.5)' }}>·</span>
          <span style={{ color: '#e2e8f0', fontSize: '0.76rem', fontWeight: 500 }}>Shift  fast</span>
          <span style={{ color: 'rgba(253,224,71,0.5)' }}>·</span>
          <span style={{ color: '#94a3b8', fontSize: '0.76rem' }}>drag to look</span>
        </div>
      )}
      <div className="hud-bl">
        <div className="inv glass" aria-label="Inventory"><span><i className="w" />Wood <b>{inv.wood}</b></span><span><i className="s" />Stone <b>{inv.stone}</b></span><span><i className="c" />Crystal <b>{inv.crystal}</b></span></div>
        {help && <div className="help glass"><div className="keys"><span /><kbd>W</kbd><span /><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd></div><span>{KEYS_HINT}</span></div>}
        <button className="btn outline sm glass" onClick={() => setHelp(!help)} aria-expanded={help}>{help ? 'Hide controls' : 'Controls'}</button>
      </div>
      <div className="hud-br">
        {district && <span className="dist-label glass">District: {district}</span>}
        <button
          className="btn glass"
          style={{
            background: 'rgba(10, 16, 30, 0.55)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(34, 211, 238, 0.45)',
            color: '#ffffff',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
          }}
          onClick={exploreDistrict}
        >
          Explore District ↗
        </button>
      </div>
      {nearRes && !nearP && <div className="hint glass">Press <kbd>F</kbd> · Gather {nearRes.type}</div>}
      {showBuildingDetails && near && (
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
            <button className="btn outline" onClick={() => { setDismissedPlot(nearPlot); setPanel(false); }}>Close</button>
          </div>
        </aside>
      )}
      {showBuildingDetails && !near && (
        <aside className="store-panel glass" aria-label="Plot information">
          <div className="head"><span className="logo-dot" style={{ background: nearP.status === 'available' ? '#22c55e' : '#64748b', color: '#fff' }}>{nearP.status === 'available' ? 'F' : '🔒'}</span><div><h3>Plot {nearP.id}</h3><p>{nearP.district} · {nearP.status === 'reserved' ? 'Permanently Locked' : 'Free to Claim'}</p></div></div>
          <div className="meta"><div><b>{nearP.w}×{nearP.d} m</b>Size</div><div><b>{nearP.status === 'reserved' ? 'Locked' : 'Free'}</b>Price</div><div><b>{nearP.status === 'reserved' ? 'Locked' : 'Free (1/email)'}</b>Tier</div></div>
          <div className="actions">{nearP.status === 'available' ? <Link className="btn" href={`/buy?plot=${nearP.id}`}>Claim Free Building</Link> : <button className="btn" disabled>🔒 Permanently Locked</button>}<button className="btn outline" onClick={() => { setDismissedPlot(nearPlot); setPanel(false); }}>Close</button></div>
        </aside>
      )}
      {mapOpen && (
        <div className="modal-back" onClick={() => setMapOpen(false)}>
          <div className="map-modal" onClick={e => e.stopPropagation()} role="dialog" aria-label="City map">
            <div className="admin-map-wrap" style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', top: 12, left: 16, zIndex: 10, background: 'rgba(10, 18, 34, 0.85)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(34, 211, 238, 0.5)', color: '#22d3ee', padding: '0.45rem 1.15rem', borderRadius: 999, fontSize: '0.84rem', fontWeight: 600, boxShadow: '0 8px 24px rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span>⚡ Click anywhere on the map or any building to teleport!</span>
              </div>
              <AdminMap
                layout={layout}
                stores={stores}
                selected={pick}
                onSelect={(id) => {
                  if (id) {
                    go(id, false);
                  }
                }}
                onCoordClick={(wx, wz) => {
                  teleportToCoord(wx, wz);
                }}
                matches={null}
                preview={null}
                showLabels
                showBuildings
                fitKey={0}
              />
            </div>
            <aside className="map-side">
              <div className="row" style={{ justifyContent: 'space-between' }}><h3 style={{ margin: 0 }}>City map</h3><button className="ghost" onClick={() => setMapOpen(false)} aria-label="Close map">✕</button></div>
              {pickP ? <>
                <h3>{pickS ? pickS.config.name : `Plot ${pickP.id}`}</h3><p className="note">{pickP.district} · {pickP.id} · {pickP.w}×{pickP.d} m{pickS ? '' : pickP.price ? ` · $${pickP.price}/mo` : ' · Free'}</p>
                <div className="actions-row"><button className="btn" onClick={() => guideTo(pickP.id)}>Guide me here</button><button className="btn outline" onClick={() => go(pickP.id)}>Teleport</button></div>
              </> : <p className="note">Click any building, road or area on the map to instantly teleport there! Press M or Esc to close.</p>}
            </aside>
          </div>
        </div>)}
    </div>
  );
}
