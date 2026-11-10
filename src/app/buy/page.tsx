'use client';
import { Suspense, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useStores } from '@/components/useStores';
import { purchasePlot, claimWithPromoCode, useAuth } from '@/lib/data';
import { FACADES, TEMPLATES, THEMES, defaultConfig } from '@/lib/templates';
import { computeStats } from '@/lib/stats';
import type { Plot, StoreConfig } from '@/lib/types';

const AdminMap = dynamic(() => import('@/components/admin/AdminMap'), { ssr: false, loading: () => <div className="loading" style={{ padding: '2rem', textAlign: 'center' }}>Loading city map…</div> });
const EditorCanvas = dynamic(() => import('@/components/EditorCanvas'), { ssr: false, loading: () => <div className="loading" style={{ padding: '2rem', textAlign: 'center' }}>Loading 3D preview…</div> });

type Filter = 'all' | 'available' | 'premium' | 'occupied' | 'reserved';
const noop = () => {};
const TOOL = { kind: 'wall', rot: 0 } as const;

const FEATURES = [
  { id: 'tech', label: 'Tech Store' },
  { id: 'research', label: 'Research Hub' },
  { id: 'gaming', label: 'Gaming Zone' },
  { id: 'cafe', label: 'Café' },
  { id: 'office', label: 'Office Spaces' },
  { id: 'video', label: 'Video Studios' },
  { id: 'library', label: 'Library' },
  { id: 'family', label: 'Family Room' },
  { id: 'hangout', label: 'Hangout' },
  { id: 'control', label: 'Control Center' },
];

const ACCESS_COLORS = ['#22d3ee', '#3b82f6', '#ec4899', '#f97316', '#eab308'];
const PLACEMENT_MODES = ['Decorate', 'Basic', 'Store', 'Move', 'Multi'];

function Marketplace() {
  const { stores, layout, reload } = useStores(), { user } = useAuth(), router = useRouter(), params = useSearchParams();
  const S = useMemo(() => computeStats(layout, stores), [layout, stores]);
  const [sel, setSel] = useState<string | null>(params.get('plot'));
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [district, setDistrict] = useState(params.get('district') || 'All');
  const [sort, setSort] = useState('id');

  const [tpl, setTpl] = useState('tech');
  const [theme, setTheme] = useState(TEMPLATES.tech.patch.theme as string);
  const [facade, setFacade] = useState('concrete');
  const [name, setName] = useState('');
  const [feature, setFeature] = useState('gaming');
  const [mode, setMode] = useState('Multi');
  const [copied, setCopied] = useState(false);

  const [saved, setSaved] = useState<string[]>([]);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [promoCode, setPromoCode] = useState(params.get('code') || '');
  const [promoMsg, setPromoMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    try { setSaved(JSON.parse(localStorage.getItem('thecity.saved') || '[]')); } catch {}
  }, []);

  const toggleSave = (id: string) => setSaved(s => {
    const n = s.includes(id) ? s.filter(x => x !== id) : [...s, id];
    try { localStorage.setItem('thecity.saved', JSON.stringify(n)); } catch {}
    return n;
  });

  // Default selection to first available free plot (e.g. AIM-026) or first available
  useEffect(() => {
    if (!sel && layout.plots.length > 0) {
      const firstAvail = layout.plots.find(p => p.id === 'AIM-026' && S.state(p) === 'available')
        || layout.plots.find(p => S.state(p) === 'available')
        || layout.plots[0];
      if (firstAvail) setSel(firstAvail.id);
    }
  }, [layout.plots, sel, S]);

  const plot = layout.byId.get(sel || '') as Plot | undefined;
  const st = plot ? S.state(plot) : null;
  const store = stores.find(s => s.plotId === sel);
  const userOwnedStore = user ? stores.find(s => s.ownerId === user.id) : undefined;

  useEffect(() => {
    if (store && !store.ownerId) {
      setTpl(store.config.template);
      setTheme(store.config.theme);
      setFacade(store.config.facade);
      setName(store.config.name);
    } else if (plot) {
      setName(`${plot.id} ${plot.category}`);
    }
  }, [sel, store, plot]);

  const listed = useMemo(() => {
    const t = q.trim().toLowerCase();
    const l = layout.plots.filter(p => {
      const state = S.state(p);
      if (filter === 'available' && state !== 'available') return false;
      if (filter === 'occupied' && state !== 'occupied') return false;
      if (filter === 'reserved' && state !== 'reserved') return false;
      if (filter === 'premium' && p.tier === 'free') return false;
      if (district !== 'All' && p.district !== district) return false;
      return !t || [p.id, p.district, p.category, p.region || '', stores.find(s => s.plotId === p.id)?.config.name || ''].join(' ').toLowerCase().includes(t);
    });
    return l.sort((a, b) => (sort === 'low' ? a.price - b.price : sort === 'high' ? b.price - a.price : a.id.localeCompare(b.id)));
  }, [layout, stores, q, filter, district, sort, S]);

  const matches = useMemo(() => new Set(listed.map(p => p.id)), [listed]);
  const previewCfg: StoreConfig = useMemo(() => defaultConfig(tpl, { name: name.trim() || 'AIM Intelligent Agents', theme, facade }), [tpl, name, theme, facade]);
  const districts = useMemo(() => ['All', ...Array.from(new Set(layout.plots.map(p => p.district)))], [layout]);

  const claim = async () => {
    if (!plot) return;
    if (!user) return router.push('/login');
    if (st === 'reserved') {
      setErr('This building is permanently locked and cannot be claimed.');
      return;
    }
    if (userOwnedStore) {
      setErr(`You can only claim 1 building per email account (${user.email}). You already own building ${userOwnedStore.plotId}.`);
      return;
    }
    setBusy(true); setErr('');
    try {
      await purchasePlot(plot.id, user, tpl, { name: name.trim() || `${plot.id} Store`, theme, facade });
      reload();
      router.push('/editor?plot=' + plot.id);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  const handlePromoClaim = async () => {
    if (!plot) return;
    if (!user) return router.push('/login');
    if (!promoCode.trim()) {
      setPromoMsg({ ok: false, text: 'Please enter a promo code.' });
      return;
    }
    setBusy(true);
    setPromoMsg(null);
    setErr('');
    try {
      await claimWithPromoCode(plot.id, promoCode.trim(), user, tpl, {
        name: name.trim() || `${plot.id} Enterprise`,
        theme,
        facade,
      });
      setPromoMsg({ ok: true, text: `🎉 Success! Building ${plot.id} unlocked and claimed for free!` });
      await reload();
      setTimeout(() => {
        router.push('/editor?plot=' + plot.id);
      }, 1200);
    } catch (e: any) {
      setPromoMsg({ ok: false, text: e.message });
    } finally {
      setBusy(false);
    }
  };

  const copyShare = () => {
    const url = typeof window !== 'undefined' ? `${window.location.origin}/buy?plot=${plot?.id || ''}` : `https://thecity.app/${plot?.id?.toLowerCase() || ''}`;
    navigator.clipboard?.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const FILTERS: [Filter, string][] = [
    ['all', 'All'],
    ['available', 'Available'],
    ['premium', 'Premium'],
    ['occupied', 'Occupied'],
    ['reserved', 'Reserved'],
  ];

  return (
    <div className="buy-page-wrap">
      {/* ── Top Header matching the design reference ── */}
      <header className="buy-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: '#dcfce7',
              color: '#15803d',
              padding: '4px 12px',
              borderRadius: '999px',
              fontWeight: 700,
              fontSize: '0.84rem',
              border: '1px solid #bbf7d0',
            }}
          >
            <span>🏢</span>
            <span>TheCity</span>
          </div>
          <div style={{ fontSize: '1.4rem', opacity: 0.85 }}>📍</div>
        </div>

        <h1 style={{ margin: '0 0 6px', fontSize: 'clamp(1.8rem, 3.2vw, 2.6rem)', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
          Find the right place in the city.
        </h1>
        <p style={{ margin: 0, color: '#64748b', fontSize: '0.94rem', fontWeight: 500 }}>
          {S.available} of {S.plots} plots available across {S.districts} districts. Pick one on the map or in the list, preview a building, then claim it.
        </p>
      </header>

      {/* ── Main Two-Column Layout ── */}
      <div className="buy-grid">
        {/* Left Side: Map + Selected Plot & 3D Live Preview */}
        <div>
          {/* Card 1: Circular City Map */}
          <div className="buy-map-card">
            <AdminMap
              layout={layout}
              stores={stores}
              selected={sel}
              onSelect={id => setSel(id)}
              matches={q || filter !== 'all' || district !== 'All' ? matches : null}
              preview={null}
              showLabels
              showBuildings
              fitKey={0}
              theme="light"
            />
          </div>

          {/* Cards 2 & 3: Selected Plot Specifications + Live 3D Building Preview */}
          {plot && st ? (
            <div className="buy-detail-grid">
              {/* Left Sub-card: Plot Information & Controls */}
              <div className="buy-detail-card">
                {/* Badges */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {st === 'reserved' ? (
                    <span
                      style={{
                        background: '#475569',
                        color: '#ffffff',
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        padding: '3px 10px',
                        borderRadius: '999px',
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <span>🔒</span> PERMANENTLY LOCKED
                    </span>
                  ) : st === 'occupied' ? (
                    <span
                      style={{
                        background: '#ea580c',
                        color: '#ffffff',
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        padding: '3px 10px',
                        borderRadius: '999px',
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                      }}
                    >
                      OCCUPIED
                    </span>
                  ) : (
                    <>
                      <span
                        style={{
                          background: '#15803d',
                          color: '#ffffff',
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          padding: '3px 10px',
                          borderRadius: '999px',
                          letterSpacing: '0.04em',
                          textTransform: 'uppercase',
                        }}
                      >
                        AVAILABLE
                      </span>
                      <span
                        style={{
                          background: '#dcfce7',
                          color: '#15803d',
                          border: '1px solid #86efac',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          padding: '3px 10px',
                          borderRadius: '999px',
                          letterSpacing: '0.02em',
                        }}
                      >
                        FREE TO CLAIM
                      </span>
                    </>
                  )}
                </div>

                {/* Title & Price */}
                <div>
                  <h2 style={{ margin: '0 0 2px', fontSize: '1.45rem', fontWeight: 800, color: '#0f172a' }}>
                    {plot.id} . {plot.district.replace(' District', '')}
                  </h2>
                  <div style={{ fontSize: '1.7rem', fontWeight: 800, color: '#0f172a' }}>
                    {st === 'reserved' ? (
                      <span style={{ color: '#475569', fontSize: '1.2rem' }}>🔒 Permanently Locked by City</span>
                    ) : st === 'occupied' ? (
                      <span style={{ color: '#ea580c', fontSize: '1.2rem' }}>Occupied by Owner</span>
                    ) : (
                      <span style={{ color: '#15803d' }}>
                        Free <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>(1 per Email)</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Specifications Key-Value */}
                <div style={{ display: 'grid', gap: '7px', fontSize: '0.82rem', color: '#334155', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9', padding: '10px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ width: '90px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span>⛶</span> Size
                    </span>
                    <span style={{ fontWeight: 600 }}>: {plot.w} × {plot.d} m</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ width: '90px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span>🗂</span> Category
                    </span>
                    <span style={{ fontWeight: 600 }}>: {plot.category}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ width: '90px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span>📍</span> Location
                    </span>
                    <span style={{ fontWeight: 600 }}>: {plot.district.replace(' District', '')} – Block {plot.id.slice(0, 1)}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ width: '90px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span>⭐</span> Mission
                    </span>
                    <span style={{ fontWeight: 600 }}>: Research & Innovation</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ width: '90px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span>🏢</span> Building
                    </span>
                    <span style={{ fontWeight: 600 }}>
                      : {store ? store.config.name : `${plot.category} Intelligence Agency`}
                    </span>
                  </div>
                </div>

                {/* View in 3D City link */}
                <Link
                  href={`/city?store=${plot.id}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    color: '#1e293b',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    textDecoration: 'none',
                    transition: 'all 0.2s',
                  }}
                >
                  <span>⬡</span>
                  <span>View in 3D City</span>
                </Link>

                {/* Building Features Chips */}
                <div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Building Features
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {FEATURES.map(f => {
                      const active = feature === f.id;
                      return (
                        <button
                          key={f.id}
                          onClick={() => {
                            setFeature(f.id);
                            if (f.id === 'tech' || f.id === 'gaming') setTpl('tech');
                            else if (f.id === 'cafe') setTpl('cafe');
                            else if (f.id === 'office' || f.id === 'research') setTpl('loft');
                            else setTpl('store');
                          }}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '999px',
                            border: active ? '1px solid #86efac' : '1px solid #e2e8f0',
                            background: active ? '#dcfce7' : '#f8fafc',
                            color: active ? '#15803d' : '#475569',
                            fontSize: '0.74rem',
                            fontWeight: active ? 700 : 500,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                          }}
                        >
                          {f.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Access Colors */}
                <div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Access Colors
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {ACCESS_COLORS.map(c => (
                      <button
                        key={c}
                        onClick={() => setTheme(c)}
                        style={{
                          width: '22px',
                          height: '22px',
                          borderRadius: '50%',
                          background: c,
                          border: theme === c ? '2.5px solid #0f172a' : '2px solid #ffffff',
                          boxShadow: '0 1px 4px rgba(0,0,0,0.18)',
                          cursor: 'pointer',
                          padding: 0,
                        }}
                        aria-label={`Color ${c}`}
                      />
                    ))}
                  </div>
                </div>

                {/* Placement Mode */}
                <div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Placement Mode
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {PLACEMENT_MODES.map(m => {
                      const active = mode === m;
                      return (
                        <button
                          key={m}
                          onClick={() => setMode(m)}
                          style={{
                            padding: '4px 12px',
                            borderRadius: '999px',
                            border: active ? '1px solid #86efac' : '1px solid #e2e8f0',
                            background: active ? '#dcfce7' : '#f8fafc',
                            color: active ? '#15803d' : '#475569',
                            fontSize: '0.74rem',
                            fontWeight: active ? 700 : 500,
                            cursor: 'pointer',
                          }}
                        >
                          {m}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Share Your View */}
                <div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Share Your View
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input
                      readOnly
                      value={typeof window !== 'undefined' ? `${window.location.origin}/buy?plot=${plot.id}` : `https://thecity.app/${plot.id.toLowerCase()}`}
                      style={{
                        flex: 1,
                        padding: '6px 10px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.76rem',
                        color: '#475569',
                        background: '#f8fafc',
                      }}
                    />
                    <button
                      onClick={copyShare}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        border: '1px solid #15803d',
                        background: '#15803d',
                        color: '#ffffff',
                        fontSize: '0.76rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      {copied ? 'Copied!' : 'Copy ❐'}
                    </button>
                  </div>
                </div>

                {/* 1 Building per email ownership alert banner */}
                {user && userOwnedStore && (
                  <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '10px', padding: '8px 12px', fontSize: '0.78rem', color: '#92400e', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>ℹ️</span>
                    <span>
                      Your email account ({user.email}) already owns building <b>{userOwnedStore.plotId}</b>. You can claim only 1 building per email.
                    </span>
                  </div>
                )}

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  <button
                    onClick={claim}
                    disabled={busy || st !== 'available' || !!userOwnedStore}
                    style={{
                      flex: 1,
                      padding: '10px 16px',
                      borderRadius: '10px',
                      background: st === 'reserved' ? '#64748b' : userOwnedStore ? '#94a3b8' : !user ? '#15803d' : '#14532d',
                      color: '#ffffff',
                      border: 'none',
                      fontSize: '0.84rem',
                      fontWeight: 700,
                      cursor: busy || st !== 'available' || !!userOwnedStore ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      boxShadow: '0 2px 8px rgba(20, 83, 45, 0.25)',
                    }}
                  >
                    <span>{st === 'reserved' ? '🔒' : '👑'}</span>
                    <span>
                      {st === 'reserved'
                        ? 'Permanently Locked'
                        : st === 'occupied'
                        ? 'Occupied by Owner'
                        : !user
                        ? 'Sign in with Email to Claim Free'
                        : userOwnedStore
                        ? `Limit Reached (${userOwnedStore.plotId})`
                        : busy
                        ? 'Claiming Free Building…'
                        : 'Claim Free Building'}
                    </span>
                  </button>
                  <button
                    onClick={() => toggleSave(plot.id)}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '10px',
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      color: saved.includes(plot.id) ? '#15803d' : '#475569',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <span>{saved.includes(plot.id) ? '★' : '🔖'}</span>
                    <span>{saved.includes(plot.id) ? 'Saved' : 'Save Plot'}</span>
                  </button>
                </div>

                  {/* Central District VIP Promo Code Unlock & Free Claim Card */}
                {(plot.district.includes('Central') || plot.id.startsWith('C0')) && st === 'reserved' && (
                  <div style={{ background: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)', border: '1px solid #818cf8', borderRadius: '12px', padding: '12px 14px', marginTop: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '1.05rem' }}>🎟️</span>
                      <span style={{ fontWeight: 800, fontSize: '0.84rem', color: '#312e81' }}>Central District VIP Access</span>
                    </div>
                    <p style={{ margin: '0 0 8px', fontSize: '0.76rem', color: '#4338ca', lineHeight: 1.35 }}>
                      Have an exclusive access code? Enter it below to unlock and claim this Central District building for free.
                    </p>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        placeholder="Enter promo code"
                        value={promoCode}
                        onChange={e => setPromoCode(e.target.value)}
                        disabled={busy}
                        style={{ flex: 1, padding: '7px 10px', borderRadius: '8px', border: '1px solid #818cf8', fontSize: '0.82rem', fontWeight: 600, background: '#ffffff', color: '#0f172a' }}
                      />
                      <button
                        onClick={handlePromoClaim}
                        disabled={busy || !promoCode.trim()}
                        style={{ padding: '7px 14px', borderRadius: '8px', border: 'none', background: '#4f46e5', color: '#ffffff', fontSize: '0.8rem', fontWeight: 700, cursor: busy || !promoCode.trim() ? 'not-allowed' : 'pointer', boxShadow: '0 2px 6px rgba(79, 70, 229, 0.3)', whiteSpace: 'nowrap' }}
                      >
                        {busy ? 'Unlocking…' : 'Unlock & Claim Free 🎁'}
                      </button>
                    </div>
                    {promoMsg && (
                      <p style={{ margin: '6px 0 0', fontSize: '0.76rem', color: promoMsg.ok ? '#15803d' : '#dc2626', fontWeight: 600 }}>
                        {promoMsg.text}
                      </p>
                    )}
                  </div>
                )}

                {err && <p style={{ margin: 0, color: '#dc2626', fontSize: '0.78rem' }}>{err}</p>}

                {/* Small disclaimer */}
                <p style={{ margin: 0, fontSize: '0.7rem', color: '#94a3b8', lineHeight: 1.4 }}>
                  ⓘ Exploration isn&apos;t construction in this world, so claiming is instant. Once you claim, you&apos;ll be the owner of this plot.
                </p>
              </div>

              {/* Right Sub-card: Live 3D Building Preview */}
              <div className="buy-preview-card">
                <div
                  style={{
                    position: 'absolute',
                    top: '12px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 10,
                    background: 'rgba(255, 255, 255, 0.92)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid #e2e8f0',
                    color: '#0f172a',
                    padding: '4px 14px',
                    borderRadius: '999px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span>💻</span>
                  <span>Live Preview • Click to explore</span>
                </div>
                <div style={{ position: 'absolute', inset: 0 }}>
                  <EditorCanvas cfg={previewCfg} setCfg={noop} tool={TOOL as any} showGrid={false} onMsg={noop} />
                </div>
              </div>
            </div>
          ) : (
            <div style={{ marginTop: '16px', padding: '24px', background: '#fff', borderRadius: '24px', border: '1px solid #e2e8f0', textAlign: 'center', color: '#64748b' }}>
              Select a plot on the map or in the list to see its details and live 3D preview.
            </div>
          )}
        </div>

        {/* Right Side: Plot Listings Card */}
        <aside className="buy-list-card" aria-label="Plot listings">
          {/* Search Box */}
          <div className="buy-search-wrap">
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '0.9rem' }}>
              🔍
            </span>
            <input
              className="buy-search-input"
              placeholder="Search plot ID, district, category…"
              value={q}
              onChange={e => setQ(e.target.value)}
              aria-label="Search plots"
            />
          </div>

          {/* Filter Tabs */}
          <div className="buy-filter-tabs">
            {FILTERS.map(([k, l]) => (
              <button
                key={k}
                className={`buy-tab-btn ${filter === k ? 'active' : ''}`}
                onClick={() => setFilter(k)}
              >
                {l}
              </button>
            ))}
          </div>

          {/* Dropdown Selectors */}
          <div className="buy-dropdowns-row">
            <select
              className="buy-select"
              value={district}
              onChange={e => setDistrict(e.target.value)}
              aria-label="District"
            >
              {districts.map(d => (
                <option key={d}>{d}</option>
              ))}
            </select>
            <select
              className="buy-select"
              value={sort}
              onChange={e => setSort(e.target.value)}
              aria-label="Sort"
            >
              <option value="id">Sort by: ID</option>
              <option value="low">Price: Low to High</option>
              <option value="high">Price: High to Low</option>
            </select>
          </div>

          {/* Plots Count */}
          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#64748b' }}>
            {listed.length} plots {saved.length ? `• ${saved.length} saved` : ''}
          </div>

          {/* Scrollable Plot Items */}
          <div className="buy-plots-scroll">
            {listed.map(p => {
              const state = S.state(p);
              const isSelected = sel === p.id;
              return (
                <div
                  key={p.id}
                  className={`buy-plot-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSel(p.id)}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.94rem', color: '#0f172a', marginBottom: '2px' }}>
                      {saved.includes(p.id) ? '★ ' : ''}
                      {p.id} . {p.district.replace(' District', '')}
                    </div>
                    <div style={{ fontSize: '0.76rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>⛶ {p.w}×{p.d} m</span>
                      <span>•</span>
                      <span>{p.category}</span>
                      {p.tier !== 'free' && (
                        <>
                          <span>•</span>
                          <span style={{ textTransform: 'lowercase' }}>{p.tier}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3px' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.94rem', color: '#0f172a' }}>
                      {state === 'reserved' ? 'Locked' : state === 'occupied' ? 'Claimed' : 'Free'}
                    </div>
                    <span
                      style={{
                        fontSize: '0.66rem',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '999px',
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                        background: state === 'available' ? '#dcfce7' : state === 'occupied' ? '#ffedd5' : '#f1f5f9',
                        color: state === 'available' ? '#15803d' : state === 'occupied' ? '#c2410c' : '#475569',
                        border: state === 'available' ? '1px solid #86efac' : state === 'occupied' ? '1px solid #fed7aa' : '1px solid #cbd5e1',
                      }}
                    >
                      {state === 'available' ? 'AVAILABLE' : state === 'reserved' ? '🔒 LOCKED' : 'OCCUPIED'}
                    </span>
                  </div>
                </div>
              );
            })}
            {!listed.length && (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.88rem' }}>
                No plots match these filters.
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

export default function Buy() {
  return (
    <Suspense fallback={<div className="loading" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f4f6f8', color: '#0f172a' }}>Loading marketplace…</div>}>
      <Marketplace />
    </Suspense>
  );
}
