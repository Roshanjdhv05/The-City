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
      // Player Arrow
      g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(S / 2, S / 2 - 8); g.lineTo(S / 2 + 6, S / 2 + 7); g.lineTo(S / 2 - 6, S / 2 + 7); g.closePath(); g.fill();
      // Lime Accent Ring
      g.strokeStyle = 'rgba(163, 230, 53, 0.9)'; g.lineWidth = 2.5; g.beginPath(); g.arc(S / 2, S / 2, S / 2 - 2, 0, Math.PI * 2); g.stroke();
      raf = requestAnimationFrame(draw);
    };
    draw(); return () => cancelAnimationFrame(raf);
  }, [occupied, layout]);
  return <canvas ref={ref} width={120} height={120} className="minimap" aria-label="Minimap" />;
}

const KEYS_HINT = 'Space/E up · Q down · Shift fast · drag look · scroll zoom · V camera · T time · F gather · M map';

import type { RemotePlayer } from '@/lib/multiplayer';

// ─── Day / Night Quick Toggle ───────────────────────────────────────────────
function DayNightToggle() {
  const { hour, setHour } = useTimeStore();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;
  const isDay = hour >= 6.0 && hour < 18.5;

  return (
    <div className="world-pill" style={{ padding: 4, gap: 4 }}>
      <button
        className={isDay ? 'world-active-lime' : ''}
        onClick={() => setHour(12.0)}
        style={{
          background: 'none',
          border: 'none',
          color: isDay ? '#0f172a' : '#cbd5e1',
          padding: '6px 14px',
          borderRadius: 9999,
          fontSize: 12,
          fontWeight: isDay ? 700 : 600,
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          transition: 'all 0.2s',
        }}
        title="Set to Daytime (Noon)"
      >
        <span>☀️</span>
        <span>Noon</span>
      </button>
      <button
        className={!isDay ? 'world-active-lime' : ''}
        onClick={() => setHour(22.0)}
        style={{
          background: 'none',
          border: 'none',
          color: !isDay ? '#0f172a' : '#cbd5e1',
          padding: '6px 14px',
          borderRadius: 9999,
          fontSize: 12,
          fontWeight: !isDay ? 700 : 600,
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          transition: 'all 0.2s',
        }}
        title="Set to Nighttime"
      >
        <span>🌙</span>
        <span>Night</span>
      </button>
    </div>
  );
}

// ─── Time & Online Status Pill ──────────────────────────────────────────────
function TimeOnlinePill({
  onlineCount,
  onToggle,
  open,
}: {
  onlineCount: number;
  onToggle: () => void;
  open: boolean;
}) {
  const { hour } = useTimeStore();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;
  const info = getTimePhase(hour);

  return (
    <button
      className="world-pill"
      onClick={onToggle}
      style={{
        padding: '6px 16px',
        gap: 10,
        fontSize: 13,
        fontWeight: 600,
        cursor: 'pointer',
        border: '1.5px solid rgba(163, 230, 53, 0.55)',
        boxShadow: '0 0 16px rgba(163, 230, 53, 0.25), 0 8px 24px rgba(0,0,0,0.45)',
        color: '#ffffff',
        flexShrink: 0,
      }}
      title="Click to view online explorers & world time"
    >
      <span style={{ fontSize: 14 }}>{info.icon}</span>
      <span style={{ fontWeight: 700, letterSpacing: '-0.01em' }}>{formatClock(hour)}</span>
      <span style={{ color: 'rgba(255,255,255,0.25)' }}>|</span>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 8px #4ade80' }} />
      <span style={{ color: '#e2e8f0', fontWeight: 600 }}>Online</span>
      <span
        style={{
          background: '#4ade80',
          color: '#0f172a',
          padding: '2px 7px',
          borderRadius: 999,
          fontSize: 11,
          fontWeight: 800,
          lineHeight: 1.2,
        }}
      >
        {onlineCount}
      </span>
      <span style={{ fontSize: 10, color: '#94a3b8', marginLeft: 2 }}>{open ? '▲' : '▾'}</span>
    </button>
  );
}

// ─── Segmented Quality Switcher ─────────────────────────────────────────────
function SegmentedQuality() {
  const { quality, setQuality } = useUI();

  return (
    <div className="world-pill" style={{ padding: 4, gap: 4 }}>
      <span style={{ padding: '0 4px 0 8px', color: '#a3e635', fontSize: 13 }}>📶</span>
      {(['high', 'medium', 'low'] as Quality[]).map((q, idx) => {
        const active = quality === q;
        const label = q === 'high' ? 'H' : q === 'medium' ? 'M' : 'L';
        return (
          <span key={q} style={{ display: 'inline-flex', alignItems: 'center' }}>
            {idx > 0 && <span style={{ color: 'rgba(255,255,255,0.15)', margin: '0 2px' }}>|</span>}
            <button
              onClick={() => setQuality(q)}
              style={{
                background: active ? 'rgba(163, 230, 53, 0.25)' : 'none',
                border: 'none',
                color: active ? '#a3e635' : '#94a3b8',
                fontWeight: active ? 800 : 600,
                fontSize: 12,
                padding: '5px 10px',
                borderRadius: 9999,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              title={`${q.toUpperCase()} Quality`}
            >
              {label}
            </button>
          </span>
        );
      })}
    </div>
  );
}

// ─── Quality Selector Dropdown ──────────────────────────────────────────────
function QualitySelector() {
  const { quality, setQuality } = useUI();
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: 'relative' }}>
      <button
        className="world-pill"
        onClick={() => setOpen(o => !o)}
        style={{
          padding: '8px 16px',
          gap: 8,
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
        }}
        title="Graphics Quality"
      >
        <span style={{ color: quality === 'high' ? '#a3e635' : quality === 'medium' ? '#38bdf8' : '#94a3b8', fontSize: 14 }}>
          📶
        </span>
        <span style={{ textTransform: 'capitalize', color: '#ffffff', fontWeight: 600 }}>{quality}</span>
        <span style={{ fontSize: 10, color: '#94a3b8' }}>▾</span>
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            zIndex: 200,
            minWidth: 180,
            background: 'rgba(18, 25, 42, 0.94)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.16)',
            borderRadius: 16,
            padding: '6px',
            boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
            animation: 'rise 0.18s ease',
          }}
        >
          {(['high', 'medium', 'low'] as Quality[]).map(q => (
            <button
              key={q}
              onClick={() => { setQuality(q); setOpen(false); }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '9px 12px',
                borderRadius: 10,
                background: quality === q ? 'rgba(163, 230, 53, 0.15)' : 'transparent',
                border: quality === q ? '1px solid rgba(163, 230, 53, 0.4)' : '1px solid transparent',
                color: quality === q ? '#a3e635' : '#e2e8f0',
                fontSize: 12,
                fontWeight: quality === q ? 700 : 500,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s',
              }}
            >
              <span>{q === 'high' ? 'High (desktop)' : q === 'medium' ? 'Medium' : 'Low (fast)'}</span>
              {quality === q && <span>✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Settings Panel ─────────────────────────────────────────────────────────
function SettingsPanel() {
  const { quality, setQuality, walkSpeed, sensitivity, setWalkSpeed, setSensitivity } = useUI();
  const { hour, setHour, isLiveDevice, setLiveDevice } = useTimeStore();
  const [open, setOpen] = useState(false);

  const activeTimeMode = isLiveDevice
    ? 'live'
    : hour >= 6.0 && hour < 16.5
    ? 'day'
    : hour >= 16.5 && hour < 20.5
    ? 'evening'
    : 'night';

  const panel: React.CSSProperties = {
    position: 'absolute', top: 'calc(100% + 10px)', right: 0, zIndex: 200,
    minWidth: 280, padding: '16px 18px 14px',
    background: 'rgba(18, 25, 42, 0.94)', backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    border: '1px solid rgba(255,255,255,0.16)', borderRadius: 18,
    boxShadow: '0 12px 40px rgba(0,0,0,0.6), 0 0 20px rgba(0,0,0,0.4)', color: '#e2e8f0',
    animation: 'rise 0.2s ease',
  };

  const row: React.CSSProperties = {
    display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14,
  };

  const label: React.CSSProperties = {
    display: 'flex', justifyContent: 'space-between', fontSize: 12,
    color: '#94a3b8', fontWeight: 600, letterSpacing: '0.03em',
  };

  const slider: React.CSSProperties = {
    width: '100%', accentColor: '#a3e635', cursor: 'pointer',
  };

  const resetBtn: React.CSSProperties = {
    width: '100%', padding: '7px 0', marginTop: 4,
    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 10, color: '#94a3b8', fontSize: 12, cursor: 'pointer',
    transition: 'all 0.15s',
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        className="world-circle-btn"
        onClick={() => setOpen(o => !o)}
        title="Game Settings"
        style={{
          border: '2px solid #a3e635',
          boxShadow: '0 0 14px rgba(163, 230, 53, 0.45)',
        }}
      >
        ⚙️
      </button>
      {open && (
        <div style={panel}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, color: '#f1f5f9', letterSpacing: '0.02em', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>⚙️ Game Settings</span>
            <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 14 }}>✕</button>
          </div>

          {/* Graphics Quality */}
          <div style={row}>
            <div style={label}>
              <span>Graphics Quality</span>
              <span style={{ color: '#a3e635', fontWeight: 700, textTransform: 'capitalize' }}>{quality}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginTop: 4 }}>
              {(['low', 'medium', 'high'] as Quality[]).map((q) => {
                const active = quality === q;
                return (
                  <button
                    key={q}
                    onClick={() => setQuality(q)}
                    style={{
                      padding: '7px 0',
                      borderRadius: 10,
                      fontSize: 12,
                      fontWeight: active ? 800 : 600,
                      cursor: 'pointer',
                      border: active ? '1.5px solid #a3e635' : '1px solid rgba(255, 255, 255, 0.12)',
                      background: active ? 'rgba(163, 230, 53, 0.22)' : 'rgba(255, 255, 255, 0.04)',
                      color: active ? '#a3e635' : '#94a3b8',
                      boxShadow: active ? '0 0 10px rgba(163, 230, 53, 0.3)' : 'none',
                      transition: 'all 0.18s ease',
                      textTransform: 'capitalize',
                    }}
                  >
                    {q}
                  </button>
                );
              })}
            </div>
            <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>
              {quality === 'low' && 'Low: Smooth performance & high FPS (Default)'}
              {quality === 'medium' && 'Medium: Balanced shadows & scenery'}
              {quality === 'high' && 'High: Ultra detail, full shadows & SSAO'}
            </div>
          </div>

          {/* Time of Day: Day, Evening, Night, Live */}
          <div style={row}>
            <div style={label}>
              <span>Time of Day</span>
              <span style={{ color: '#38bdf8', fontWeight: 700 }}>
                {isLiveDevice ? `⏱️ Live (${formatClock(hour)})` : `${formatClock(hour)}`}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginTop: 4 }}>
              {[
                { id: 'day', label: 'Day', icon: '☀️', h: 12.0 },
                { id: 'evening', label: 'Evening', icon: '🌇', h: 18.2 },
                { id: 'night', label: 'Night', icon: '🌙', h: 22.0 },
                { id: 'live', label: 'Live', icon: '⏱️', h: null },
              ].map((opt) => {
                const active = opt.id === 'live' ? isLiveDevice : !isLiveDevice && activeTimeMode === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => {
                      if (opt.id === 'live') {
                        setLiveDevice(true);
                      } else {
                        setLiveDevice(false);
                        setHour(opt.h!);
                      }
                    }}
                    style={{
                      padding: '8px 0',
                      borderRadius: 10,
                      fontSize: 11,
                      fontWeight: active ? 800 : 600,
                      cursor: 'pointer',
                      border: active ? '1.5px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.12)',
                      background: active ? 'rgba(56, 189, 248, 0.22)' : 'rgba(255, 255, 255, 0.04)',
                      color: active ? '#38bdf8' : '#94a3b8',
                      boxShadow: active ? '0 0 10px rgba(56, 189, 248, 0.3)' : 'none',
                      transition: 'all 0.18s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 2,
                    }}
                    title={opt.id === 'live' ? 'Sync with your real-world clock' : `Set time to ${opt.label}`}
                  >
                    <span style={{ fontSize: 14 }}>{opt.icon}</span>
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
            <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>
              {isLiveDevice
                ? '⏱️ Live mode: Synchronized with your device clock.'
                : activeTimeMode === 'day'
                ? '☀️ Day: Bright daylight, sharp shadows & vibrant city foliage.'
                : activeTimeMode === 'evening'
                ? '🌇 Evening: Warm golden hour sunset & soft amber sky.'
                : '🌙 Night: Dark starry sky, lit street lamps & glowing facades.'}
            </div>
          </div>

          {/* Walk Speed */}
          <div style={row}>
            <div style={label}>
              <span>Walk Speed</span>
              <span style={{ color: '#a3e635', fontWeight: 700 }}>{walkSpeed.toFixed(2)}×</span>
            </div>
            <input
              type="range" min={0.5} max={2.0} step={0.05}
              value={walkSpeed} style={slider}
              onChange={e => setWalkSpeed(parseFloat(e.target.value))}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#64748b' }}>
              <span>0.5× slow</span><span>2.0× fast</span>
            </div>
          </div>

          {/* Look Sensitivity */}
          <div style={row}>
            <div style={label}>
              <span>Look Sensitivity</span>
              <span style={{ color: '#a3e635', fontWeight: 700 }}>{sensitivity.toFixed(2)}×</span>
            </div>
            <input
              type="range" min={0.3} max={3.0} step={0.05}
              value={sensitivity} style={slider}
              onChange={e => setSensitivity(parseFloat(e.target.value))}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#64748b' }}>
              <span>0.3× slow</span><span>3.0× fast</span>
            </div>
          </div>

          <button
            style={resetBtn}
            onClick={() => {
              setWalkSpeed(1.0);
              setSensitivity(1.0);
              setQuality('low');
              setLiveDevice(true);
            }}
          >
            ↺ Reset to defaults
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Online Players Dropdown Panel ──────────────────────────────────────────
function OnlinePlayersPanel({
  myName,
  myColor,
  remotePlayers,
  open,
  setOpen,
}: {
  myName: string;
  myColor: string;
  remotePlayers: RemotePlayer[];
  open: boolean;
  setOpen: (b: boolean | ((p: boolean) => boolean)) => void;
}) {
  const total = remotePlayers.length + 1;

  if (!open) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: 'calc(100% + 10px)',
        right: 0,
        minWidth: '220px',
        background: 'rgba(18, 25, 42, 0.94)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.16)',
        borderRadius: '16px',
        padding: '0.75rem 0.85rem',
        zIndex: 200,
        boxShadow: '0 16px 48px rgba(0,0,0,0.65)',
        animation: 'rise 0.18s ease',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', paddingBottom: '0.4rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#4ade80', fontWeight: 800 }}>
          Live Explorers ({total})
        </span>
        <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 13 }}>✕</button>
      </div>

      {/* You */}
      <Link
        href="/profile"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '9px',
          padding: '0.4rem 0.5rem',
          borderRadius: '10px',
          textDecoration: 'none',
          background: 'rgba(255,255,255,0.06)',
          transition: 'background 0.15s',
          marginBottom: '0.35rem',
        }}
        title="Click to view & edit your profile"
      >
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: myColor, boxShadow: `0 0 8px ${myColor}`, flexShrink: 0 }} />
        <span style={{ color: '#ffffff', fontSize: '0.82rem', fontWeight: 600, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {myName}
        </span>
        <span style={{ fontSize: '0.65rem', color: '#4ade80', fontWeight: 700, background: 'rgba(74,222,128,0.15)', border: '1px solid rgba(74,222,128,0.35)', borderRadius: '999px', padding: '0.1rem 0.45rem' }}>You ✏️</span>
      </Link>

      {/* Others */}
      {remotePlayers.length === 0 ? (
        <div style={{ color: '#64748b', fontSize: '0.76rem', padding: '0.4rem 0.5rem', fontStyle: 'italic' }}>
          No other visitors in the city right now
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', maxHeight: '180px', overflowY: 'auto' }}>
          {remotePlayers.map(p => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '0.35rem 0.5rem', borderRadius: '8px' }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: p.color, boxShadow: `0 0 8px ${p.color}`, flexShrink: 0 }} />
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
  const prevDistrict = () => { distIdx.current = (distIdx.current - 2 + districts.length) % districts.length; exploreDistrict(); };
  const pickP = pick ? layout.byId.get(pick) : undefined, pickS = stores.find(s => s.plotId === pick);
  const [onlinePanelOpen, setOnlinePanelOpen] = useState(false);

  return (
    <div className="hud">
      {/* ── Top-Left Column: Minimap + District + Discoveries + Arrows ── */}
      <div
        className="hud-tl"
        style={{
          position: 'absolute',
          top: 'calc(var(--nav-h) + 12px)',
          left: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          zIndex: 60,
          alignItems: 'flex-start',
        }}
      >
        {map && (
          <div
            onClick={() => setMapOpen(true)}
            title="Click to open City Map (M)"
            style={{
              position: 'relative',
              cursor: 'pointer',
              borderRadius: '50%',
              padding: '3px',
              background: 'rgba(15, 23, 42, 0.82)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '3.5px solid #a3e635',
              boxShadow: '0 0 24px rgba(163, 230, 53, 0.4), 0 10px 32px rgba(0, 0, 0, 0.55)',
              transition: 'transform 0.2s ease, border-color 0.2s ease',
            }}
          >
            <Minimap occupied={occupied} layout={layout} guide={guide} />

            {/* North Badge 'N' at top */}
            <div
              style={{
                position: 'absolute',
                top: -8,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 20,
                height: 20,
                borderRadius: '50%',
                background: '#0f172a',
                border: '1.5px solid #a3e635',
                color: '#ffffff',
                fontSize: '10px',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
                pointerEvents: 'none',
              }}
            >
              N
            </div>

            {/* Compass navigation arrow at bottom-right */}
            <div
              style={{
                position: 'absolute',
                bottom: 2,
                right: 2,
                width: 26,
                height: 26,
                borderRadius: '50%',
                background: 'rgba(15, 23, 42, 0.92)',
                border: '1.5px solid rgba(255, 255, 255, 0.25)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                pointerEvents: 'none',
              }}
            >
              ➤
            </div>
          </div>
        )}

        {/* District Pill */}
        <button
          className="world-pill"
          onClick={exploreDistrict}
          style={{
            padding: '7px 16px',
            gap: 8,
            fontSize: 13,
            fontWeight: 700,
            color: '#ffffff',
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
          }}
          title="Current District — click to explore"
        >
          <span style={{ color: '#38bdf8', fontSize: 14 }}>📍</span>
          <span>{area?.name || district || 'Central District'}</span>
        </button>

        {/* Discoveries Pill */}
        <div
          className="world-pill"
          style={{
            padding: '7px 16px',
            gap: 8,
            fontSize: 13,
            fontWeight: 700,
            color: '#ffffff',
            boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
          }}
        >
          <span style={{ color: '#facc15', fontSize: 14 }}>🏛️</span>
          <span>{Math.min(found.length, totalAreas)} Discoveries</span>
        </div>

        {/* Prev / Next Circular Arrows with Lime Glow Borders */}
        <div style={{ display: 'flex', gap: 10, marginTop: 2 }}>
          <button
            className="world-circle-btn"
            onClick={prevDistrict}
            style={{
              width: 38,
              height: 38,
              fontSize: 18,
              border: '2px solid #a3e635',
              boxShadow: '0 0 12px rgba(163, 230, 53, 0.45)',
              color: '#ffffff',
            }}
            title="Previous District"
          >
            ‹
          </button>
          <button
            className="world-circle-btn"
            onClick={exploreDistrict}
            style={{
              width: 38,
              height: 38,
              fontSize: 18,
              border: '2px solid #a3e635',
              boxShadow: '0 0 12px rgba(163, 230, 53, 0.45)',
              color: '#ffffff',
            }}
            title="Next District"
          >
            ›
          </button>
        </div>
      </div>

      {/* ── Top Bar: Camera Segment, Search Input, Respawn 🔄, Time/Online Status ── */}
      <div
        style={{
          position: 'absolute',
          top: 'calc(var(--nav-h) + 12px)',
          left: '172px',
          right: '76px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          zIndex: 50,
          pointerEvents: 'auto',
          flexWrap: 'wrap',
        }}
      >
        {/* Camera Mode Segment */}
        <div className="world-pill" role="group" aria-label="Camera mode" style={{ padding: 4, gap: 4, flexShrink: 0 }}>
          <button
            className={view === '1p' ? 'world-active-lime' : ''}
            onClick={() => setView('1p')}
            style={{
              background: 'none',
              border: 'none',
              color: view === '1p' ? '#0f172a' : '#cbd5e1',
              padding: '7px 15px',
              borderRadius: 9999,
              fontSize: 13,
              fontWeight: view === '1p' ? 700 : 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.2s',
            }}
          >
            <span>🖥️</span>
            <span>1P</span>
          </button>
          <button
            className={view === '3p' ? 'world-active-lime' : ''}
            onClick={() => setView('3p')}
            style={{
              background: 'none',
              border: 'none',
              color: view === '3p' ? '#0f172a' : '#cbd5e1',
              padding: '7px 15px',
              borderRadius: 9999,
              fontSize: 13,
              fontWeight: view === '3p' ? 700 : 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.2s',
            }}
          >
            <span>👥</span>
            <span>3P</span>
          </button>
          <button
            className={view === 'free' ? 'world-active-lime' : ''}
            onClick={() => setView(view === 'free' ? '3p' : 'free')}
            title="Free fly — WASD move · Space/E up · Q down · Shift fast"
            style={{
              background: 'none',
              border: 'none',
              color: view === 'free' ? '#0f172a' : '#cbd5e1',
              padding: '7px 15px',
              borderRadius: 9999,
              fontSize: 13,
              fontWeight: view === 'free' ? 700 : 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.2s',
            }}
          >
            <span>🎁</span>
            <span>Free</span>
          </button>
        </div>

        {/* Search Input Pill */}
        <div className="search" style={{ position: 'relative', flex: '1 1 200px', maxWidth: '360px' }}>
          <div
            className="world-pill"
            style={{
              width: '100%',
              padding: '7px 16px',
              gap: 10,
              boxSizing: 'border-box',
            }}
          >
            <span style={{ color: '#94a3b8', fontSize: 14 }}>🔍</span>
            <input
              placeholder="Search city..."
              value={q}
              onChange={e => setQ(e.target.value)}
              aria-label="Search city"
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#ffffff',
                fontSize: 13,
                fontWeight: 500,
                width: '100%',
              }}
            />
          </div>
          {results.length > 0 && (
            <ul className="glass" style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, background: 'rgba(18, 25, 42, 0.96)', borderRadius: 16, zIndex: 100 }}>
              {results.map(r => (
                <li key={r.id} onClick={() => go(r.id)}>
                  <b>{r.name}</b>
                  <span>{r.sub}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Respawn / Reset Position Circle Button 🔄 */}
        <button
          className="world-circle-btn"
          onClick={() => {
            player.teleport = { x: -4.4, z: 39.5, yaw: Math.PI };
            setToast('Respawned at Civic Plaza');
            setTimeout(() => setToast(''), 2000);
          }}
          style={{
            width: 42,
            height: 42,
            fontSize: 16,
            flexShrink: 0,
            border: '1px solid rgba(255,255,255,0.18)',
          }}
          title="Respawn at Civic Plaza"
        >
          🔄
        </button>

        {/* Time & Online Status Capsule [ ☀️ 12:28 PM | 🟢 Online 12 ▾ ] */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <TimeOnlinePill
            onlineCount={remotePlayers.length + 1}
            onToggle={() => setOnlinePanelOpen(o => !o)}
            open={onlinePanelOpen}
          />

          {/* Online Players Dropdown anchored right below */}
          <OnlinePlayersPanel
            myName={myName}
            myColor={myColor}
            remotePlayers={remotePlayers}
            open={onlinePanelOpen}
            setOpen={setOnlinePanelOpen}
          />
        </div>
      </div>

      {/* ── Top-Right Column: Stacked Profile & Settings ── */}
      <div
        style={{
          position: 'absolute',
          top: 'calc(var(--nav-h) + 12px)',
          right: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          alignItems: 'center',
          zIndex: 60,
          pointerEvents: 'auto',
        }}
      >
        {/* Profile Circle Button */}
        <Link
          href="/profile"
          className="world-circle-btn"
          title="My Profile & Properties"
          style={{
            textDecoration: 'none',
            border: '2px solid rgba(163, 230, 53, 0.4)',
            boxShadow: '0 0 12px rgba(163, 230, 53, 0.25)',
          }}
        >
          <span style={{ fontSize: 18 }}>👤</span>
          <span
            style={{
              position: 'absolute',
              bottom: 3,
              right: 3,
              width: 9,
              height: 9,
              borderRadius: '50%',
              background: '#4ade80',
              border: '2px solid #0f172a',
              boxShadow: '0 0 8px #4ade80',
            }}
          />
        </Link>

        {/* Settings Circle Button with Lime Glow */}
        <SettingsPanel />
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

      {nearRes && !nearP && <div className="hint glass">Press <kbd>F</kbd> · Gather {nearRes.type}</div>}
      {showBuildingDetails && near && (
        <aside className="store-panel glass" aria-label="Store information">
          <div className="head">
            <span className="logo-dot" style={{ background: near.config.logoUrl ? `center/cover url(${near.config.logoUrl})` : near.config.theme }}>{near.config.logoUrl ? '' : near.config.name[0]}</span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <h3 style={{ margin: 0 }}>{near.config.name}</h3>
                {near.plotId === 'J01' ? (
                  <span className="badge" style={{ fontSize: '0.68rem', padding: '0.12rem 0.5rem', background: 'rgba(59,130,246,0.2)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.4)', borderRadius: 99 }}>🏢 Landmark · J Enterprise</span>
                ) : nearP.status === 'reserved' ? (
                  <span className="badge" style={{ fontSize: '0.68rem', padding: '0.12rem 0.5rem', background: 'rgba(239,68,68,0.18)', color: '#f87171', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 99 }}>🔒 Permanently Locked</span>
                ) : !near.ownerId ? (
                  <span className="badge" style={{ fontSize: '0.68rem', padding: '0.12rem 0.5rem', background: 'rgba(34,197,94,0.18)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.4)', borderRadius: 99 }}>Available · Free to Claim</span>
                ) : (
                  <span className="badge" style={{ fontSize: '0.68rem', padding: '0.12rem 0.5rem', background: 'rgba(234,88,12,0.18)', color: '#fb923c', border: '1px solid rgba(234,88,12,0.4)', borderRadius: 99 }}>Claimed</span>
                )}
              </div>
              <p>{near.config.tagline || nearP.category}</p>
            </div>
          </div>
          <div className="meta"><div><b>{nearP.district.replace(' District', '')}</b>District</div><div><b>{near.plotId}</b>Plot</div><div><b>{near.visits.toLocaleString()}</b>Visits</div></div>
          <p className="note" style={{ margin: 0 }}>Category: {nearP.category}</p>
          <div className="actions">
            <button className="btn" disabled={!near.config.website} onClick={() => enter(near)}>{near.config.website ? 'Visit Website' : 'No website yet'}</button>
            {!near.ownerId && nearP.status === 'available' && <Link className="btn" href={`/buy?plot=${nearP.id}`}>Claim building</Link>}
            {nearP.status === 'reserved' && (nearP.district.includes('Central') || nearP.id.startsWith('C0')) && !near.ownerId && (
              <Link className="btn" href={`/buy?plot=${nearP.id}&code=Jdhvpromo`} style={{ background: '#4f46e5', color: '#fff' }}>
                🎟️ Unlock with Promo
              </Link>
            )}
            {nearP.status === 'reserved' && (!nearP.district.includes('Central') && !nearP.id.startsWith('C0')) && (
              <button className="btn" disabled style={{ opacity: 0.65, cursor: 'not-allowed' }}>🔒 Permanently Locked</button>
            )}
            <button className="btn outline" onClick={() => { setDismissedPlot(nearPlot); setPanel(false); }}>Close</button>
          </div>
        </aside>
      )}
      {showBuildingDetails && !near && (
        <aside className="store-panel glass" aria-label="Plot information">
          <div className="head"><span className="logo-dot" style={{ background: nearP.status === 'available' ? '#22c55e' : '#64748b', color: '#fff' }}>{nearP.status === 'available' ? 'F' : '🔒'}</span><div><h3>Plot {nearP.id}</h3><p>{nearP.district} · {nearP.status === 'reserved' ? 'Permanently Locked' : 'Free to Claim'}</p></div></div>
          <div className="meta"><div><b>{nearP.w}×{nearP.d} m</b>Size</div><div><b>{nearP.status === 'reserved' ? 'Locked' : 'Free'}</b>Price</div><div><b>{nearP.status === 'reserved' ? 'Locked' : 'Free (1/email)'}</b>Tier</div></div>
          <div className="actions">
            {nearP.status === 'available' ? (
              <Link className="btn" href={`/buy?plot=${nearP.id}`}>Claim Free Building</Link>
            ) : (nearP.district.includes('Central') || nearP.id.startsWith('C0')) ? (
              <Link className="btn" href={`/buy?plot=${nearP.id}&code=Jdhvpromo`} style={{ background: '#4f46e5', color: '#fff' }}>🎟️ Unlock with Promo</Link>
            ) : (
              <button className="btn" disabled>🔒 Permanently Locked</button>
            )}
            <button className="btn outline" onClick={() => { setDismissedPlot(nearPlot); setPanel(false); }}>Close</button>
          </div>
        </aside>
      )}
      {mapOpen && (
        <div className="modal-back" onClick={() => setMapOpen(false)}>
          <div className="map-modal" onClick={e => e.stopPropagation()} role="dialog" aria-label="City map">
            <div className="admin-map-wrap" style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)', zIndex: 10, background: 'rgba(10, 18, 34, 0.88)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(34, 211, 238, 0.5)', color: '#22d3ee', padding: '0.4rem 1.1rem', borderRadius: 999, fontSize: '0.8rem', fontWeight: 600, boxShadow: '0 8px 24px rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', gap: '0.4rem', pointerEvents: 'none', whiteSpace: 'nowrap' }}>
                <span>⚡ Click anywhere on map to teleport</span>
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
              {pickP ? (
                <>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '4px' }}>
                      <h3 style={{ margin: 0 }}>{pickS ? pickS.config.name : `Plot ${pickP.id}`}</h3>
                      {pickP.id === 'J01' ? (
                        <span className="badge" style={{ fontSize: '0.68rem', padding: '0.12rem 0.5rem', background: 'rgba(59,130,246,0.2)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.4)', borderRadius: 99 }}>🏢 Landmark</span>
                      ) : pickP.status === 'reserved' ? (
                        <span className="badge" style={{ fontSize: '0.68rem', padding: '0.12rem 0.5rem', background: 'rgba(239,68,68,0.2)', color: '#f87171', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 99 }}>🔒 Permanently Locked</span>
                      ) : !pickS?.ownerId ? (
                        <span className="badge" style={{ fontSize: '0.68rem', padding: '0.12rem 0.5rem', background: 'rgba(34,197,94,0.2)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.4)', borderRadius: 99 }}>🟢 Available · Free</span>
                      ) : (
                        <span className="badge" style={{ fontSize: '0.68rem', padding: '0.12rem 0.5rem', background: 'rgba(234,88,12,0.2)', color: '#fb923c', border: '1px solid rgba(234,88,12,0.4)', borderRadius: 99 }}>🟠 Claimed</span>
                      )}
                    </div>
                    <p className="note" style={{ margin: 0 }}>
                      {pickP.district} · {pickP.id} · {pickP.w}×{pickP.d} m
                    </p>
                    <p style={{ fontSize: '0.78rem', color: pickP.status === 'reserved' ? '#94a3b8' : '#22c55e', margin: '4px 0 0', fontWeight: 600 }}>
                      {pickP.id === 'J01' ? 'Official City Landmark' : pickP.status === 'reserved' ? 'Permanently locked by city' : !pickS?.ownerId ? 'Available & free to claim (1 per email)' : 'Claimed by resident'}
                    </p>
                  </div>
                  <div className="actions-row" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button className="btn outline" style={{ flex: 1 }} onClick={() => guideTo(pickP.id)}>Guide me here</button>
                      <button className="btn outline" style={{ flex: 1 }} onClick={() => go(pickP.id)}>Teleport</button>
                    </div>
                    {pickP.status === 'available' && !pickS?.ownerId && (
                      <Link className="btn" href={`/buy?plot=${pickP.id}`} style={{ background: '#22c55e', color: '#fff', textDecoration: 'none', textAlign: 'center', fontWeight: 700 }}>
                        Claim Free Building
                      </Link>
                    )}
                    {pickP.status === 'reserved' && (pickP.district.includes('Central') || pickP.id.startsWith('C0')) && !pickS?.ownerId && (
                      <Link className="btn" href={`/buy?plot=${pickP.id}&code=Jdhvpromo`} style={{ background: '#4f46e5', color: '#fff', textDecoration: 'none', textAlign: 'center', fontWeight: 700 }}>
                        🎟️ Unlock with Promo (Jdhvpromo)
                      </Link>
                    )}
                  </div>
                </>
              ) : (
                <p className="note">Click any building, road or area on the map to inspect or instantly teleport there! Press M or Esc to close.</p>
              )}
            </aside>
          </div>
        </div>)}
    </div>
  );
}
