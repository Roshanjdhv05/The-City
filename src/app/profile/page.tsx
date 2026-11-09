'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import { useAuth } from '@/lib/data';
import { useStores } from '@/components/useStores';
import { fetchProfile, saveProfile, checkUsernameAvailable, AVATAR_COLORS } from '@/lib/profile';
import { getLocalPlayerId, getPlayerColor } from '@/lib/multiplayer';

// ─── Mini avatar preview ──────────────────────────────────────────────────
function AvatarPreview({ color }: { color: string }) {
  return (
    <div
      style={{
        width: 80,
        height: 100,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 0,
      }}
    >
      {/* Head */}
      <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#f6cba6', border: '2px solid rgba(0,0,0,0.08)', position: 'relative' }}>
        {/* Eyes */}
        <div style={{ position: 'absolute', top: 10, left: 5, width: 5, height: 6, borderRadius: 2, background: '#2a2230' }} />
        <div style={{ position: 'absolute', top: 10, right: 5, width: 5, height: 6, borderRadius: 2, background: '#2a2230' }} />
      </div>
      {/* Body */}
      <div style={{ width: 36, height: 32, background: color, borderRadius: '6px 6px 4px 4px', marginTop: 2, boxShadow: `0 4px 12px ${color}55` }} />
      {/* Arms */}
      <div style={{ position: 'absolute', top: 32, left: 8, width: 10, height: 28, background: color, borderRadius: 4, transform: 'rotate(-8deg)' }} />
      <div style={{ position: 'absolute', top: 32, right: 8, width: 10, height: 28, background: color, borderRadius: 4, transform: 'rotate(8deg)' }} />
      {/* Legs */}
      <div style={{ display: 'flex', gap: 4, marginTop: 2 }}>
        <div style={{ width: 14, height: 28, background: '#2b2f45', borderRadius: '4px 4px 6px 6px' }} />
        <div style={{ width: 14, height: 28, background: '#2b2f45', borderRadius: '4px 4px 6px 6px' }} />
      </div>
    </div>
  );
}

// ─── Username input with live validation ─────────────────────────────────
type CheckState = 'idle' | 'checking' | 'available' | 'taken' | 'invalid';

function UsernameInput({
  value, onChange, checkState,
}: { value: string; onChange: (v: string) => void; checkState: CheckState }) {
  const color: Record<CheckState, string> = {
    idle: '#94a3b8',
    checking: '#f59e0b',
    available: '#22c55e',
    taken: '#ef4444',
    invalid: '#ef4444',
  };
  const icon: Record<CheckState, string> = {
    idle: '', checking: '…', available: '✓', taken: '✕', invalid: '✕',
  };
  const msg: Record<CheckState, string> = {
    idle: '3–20 chars, letters / numbers / underscores',
    checking: 'Checking availability…',
    available: 'Username is available!',
    taken: 'Username is already taken',
    invalid: 'Only letters, numbers and underscores (3–20 chars)',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
      <div style={{ position: 'relative' }}>
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="your_username"
          maxLength={20}
          style={{
            width: '100%',
            padding: '0.75rem 2.5rem 0.75rem 0.9rem',
            fontSize: '1rem',
            fontWeight: 500,
            border: `1.5px solid ${checkState === 'idle' ? '#e2e8f0' : color[checkState]}`,
            borderRadius: '10px',
            outline: 'none',
            background: '#f8fafc',
            color: '#0f172a',
            transition: 'border-color 0.2s',
            fontFamily: 'monospace',
            boxSizing: 'border-box',
          }}
        />
        {icon[checkState] && (
          <span
            style={{
              position: 'absolute',
              right: '0.75rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: color[checkState],
              fontWeight: 700,
              fontSize: '1rem',
            }}
          >
            {icon[checkState]}
          </span>
        )}
      </div>
      <p style={{ margin: 0, fontSize: '0.78rem', color: color[checkState] }}>{msg[checkState]}</p>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const { user, ready, signOut } = useAuth();
  const { stores } = useStores();

  // Profile state
  const [savedUsername, setSavedUsername] = useState<string | null>(null);
  const [avatarColor, setAvatarColor] = useState('#2563eb');
  const [loading, setLoading] = useState(true);

  // Edit state
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [draftColor, setDraftColor] = useState('#2563eb');
  const [checkState, setCheckState] = useState<CheckState>('idle');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const checkTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load profile on mount
  useEffect(() => {
    if (!ready) return;
    const effectiveId = user?.id || getLocalPlayerId();
    fetchProfile(effectiveId).then(p => {
      if (p.username) setSavedUsername(p.username);
      if (p.avatarColor) setAvatarColor(p.avatarColor);
      else setAvatarColor(getPlayerColor(effectiveId));
      setLoading(false);
    });
  }, [ready, user]);

  // Live username check with debounce
  useEffect(() => {
    if (!editing) return;
    if (checkTimer.current) clearTimeout(checkTimer.current);
    if (!draft) { setCheckState('idle'); return; }

    const invalid = !/^[a-z0-9_]{3,20}$/.test(draft.toLowerCase());
    if (invalid) { setCheckState('invalid'); return; }

    // Skip check if unchanged from saved
    if (draft.toLowerCase() === savedUsername?.toLowerCase()) { setCheckState('available'); return; }

    setCheckState('checking');
    checkTimer.current = setTimeout(async () => {
      const { available } = await checkUsernameAvailable(draft);
      setCheckState(available ? 'available' : 'taken');
    }, 500);
  }, [draft, editing, savedUsername]);

  function startEdit() {
    setDraft(savedUsername ?? '');
    setDraftColor(avatarColor);
    setCheckState(savedUsername ? 'available' : 'idle');
    setSaveMsg('');
    setEditing(true);
  }

  async function handleSave() {
    const effectiveId = user?.id || getLocalPlayerId();
    if (checkState !== 'available') return;
    setSaving(true);
    setSaveMsg('');
    const result = await saveProfile(effectiveId, draft, draftColor);
    setSaving(false);
    if (result.ok) {
      setSavedUsername(draft.toLowerCase());
      setAvatarColor(draftColor);
      setSaveMsg('✓ Profile saved!');
      setEditing(false);
    } else {
      setSaveMsg(result.error ?? 'Failed to save.');
      setCheckState('taken');
    }
  }

  // ── Render guards ──────────────────────────────────────────────────────────
  if (!ready || loading) {
    return (
      <div className="page light">
        <Nav />
        <div className="wrap" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: '#64748b' }}>Loading…</p>
        </div>
        <Footer />
      </div>
    );
  }

  const effectiveId = user?.id || getLocalPlayerId();
  const mine = stores.filter(s => s.ownerId === effectiveId || (user && s.ownerId === user.id));
  const displayName = savedUsername ? `@${savedUsername}` : user ? user.email.split('@')[0] : 'Guest Explorer';
  const emailOrGuest = user ? user.email : 'Guest Session (local)';

  return (
    <div className="page light">
      <Nav />

      <div className="wrap" style={{ paddingTop: '7rem', paddingBottom: '5rem', maxWidth: 760 }}>

        {/* Guest Banner if not signed in */}
        {!user && (
          <div
            style={{
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '16px',
              padding: '1rem 1.4rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.75rem',
            }}
          >
            <div>
              <p style={{ margin: '0 0 0.2rem', fontWeight: 700, color: '#166534', fontSize: '0.92rem' }}>
                🌟 You are browsing as a Guest Explorer
              </p>
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#15803d' }}>
                You can customize your unique username and avatar color right here. Sign in with email to claim permanent buildings and sync across devices.
              </p>
            </div>
            <Link
              href="/login"
              style={{
                background: '#166534',
                color: '#fff',
                padding: '0.5rem 1.1rem',
                borderRadius: '999px',
                fontSize: '0.84rem',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              Sign In with Email
            </Link>
          </div>
        )}

        {/* ── Hero header ─────────────────────────────────────────────── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '2rem',
            background: 'linear-gradient(135deg, #0f2918 0%, #1b4d2e 100%)',
            borderRadius: '24px',
            padding: '2.5rem 2.5rem',
            marginBottom: '2rem',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Background decorative circles */}
          <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
          <div style={{ position: 'absolute', bottom: -30, right: 60, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }} />

          {/* Avatar */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <AvatarPreview color={avatarColor} />
            <div
              style={{
                position: 'absolute',
                top: -4,
                right: -4,
                width: 20,
                height: 20,
                borderRadius: '50%',
                background: '#4ade80',
                border: '3px solid #0f2918',
                boxShadow: '0 0 10px #4ade80',
              }}
            />
          </div>

          {/* Identity */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: '0 0 0.3rem', fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              Your Profile
            </p>
            <h1 style={{ margin: '0 0 0.3rem', fontSize: '2rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              {displayName}
            </h1>
            <p style={{ margin: 0, fontSize: '0.88rem', color: 'rgba(255,255,255,0.55)' }}>{emailOrGuest}</p>
            <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', background: 'rgba(255,255,255,0.1)', borderRadius: 999, padding: '0.25rem 0.75rem', border: '1px solid rgba(255,255,255,0.15)' }}>
                🏢 {mine.length} {mine.length === 1 ? 'Property' : 'Properties'}
              </span>
              <span
                style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.1)', borderRadius: 999, padding: '0.25rem 0.75rem', border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer', color: 'rgba(255,255,255,0.7)' }}
                onClick={startEdit}
              >
                ✏️ Edit Profile
              </span>
            </div>
          </div>
        </div>

        {/* ── Edit Panel ──────────────────────────────────────────────── */}
        {editing && (
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '20px',
              padding: '2rem',
              marginBottom: '2rem',
              boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
            }}
          >
            <h2 style={{ margin: '0 0 1.5rem', fontSize: '1.2rem', fontWeight: 700, color: '#0f172a' }}>Edit Profile</h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              {/* Left — Username */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#374151', marginBottom: '0.4rem' }}>
                    Username
                  </label>
                  <UsernameInput
                    value={draft}
                    onChange={v => setDraft(v.replace(/[^a-z0-9_]/gi, '').toLowerCase())}
                    checkState={checkState}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#374151', marginBottom: '0.6rem' }}>
                    Avatar Color
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem' }}>
                    {AVATAR_COLORS.map(c => (
                      <button
                        key={c.hex}
                        onClick={() => setDraftColor(c.hex)}
                        title={c.label}
                        style={{
                          width: '100%',
                          aspectRatio: '1',
                          borderRadius: '10px',
                          background: c.hex,
                          border: draftColor === c.hex ? '3px solid #0f172a' : '3px solid transparent',
                          cursor: 'pointer',
                          boxShadow: draftColor === c.hex ? `0 0 0 2px white, 0 0 0 4px ${c.hex}` : 'none',
                          transition: 'all 0.15s',
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Right — Preview */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', borderRadius: '14px', padding: '1.5rem', gap: '0.75rem' }}>
                <p style={{ margin: 0, fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Preview</p>
                <AvatarPreview color={draftColor} />
                <p style={{ margin: 0, fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' }}>
                  @{draft || 'username'}
                </p>
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: draftColor,
                    boxShadow: `0 0 12px ${draftColor}`,
                  }}
                />
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', alignItems: 'center' }}>
              <button
                onClick={handleSave}
                disabled={saving || checkState !== 'available'}
                style={{
                  padding: '0.7rem 1.8rem',
                  borderRadius: '999px',
                  background: checkState === 'available' ? '#0f2918' : '#e2e8f0',
                  color: checkState === 'available' ? '#fff' : '#94a3b8',
                  border: 'none',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: checkState === 'available' ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s',
                }}
              >
                {saving ? 'Saving…' : 'Save Profile'}
              </button>
              <button
                onClick={() => setEditing(false)}
                style={{ padding: '0.7rem 1.4rem', borderRadius: '999px', background: 'none', border: '1.5px solid #e2e8f0', color: '#64748b', fontWeight: 500, fontSize: '0.9rem', cursor: 'pointer' }}
              >
                Cancel
              </button>
              {saveMsg && (
                <span style={{ fontSize: '0.84rem', color: saveMsg.startsWith('✓') ? '#16a34a' : '#ef4444', fontWeight: 600 }}>
                  {saveMsg}
                </span>
              )}
            </div>
          </div>
        )}

        {/* ── My Properties ───────────────────────────────────────────── */}
        <section style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>🏢 My Properties</h2>
            <Link
              href="/buy"
              style={{ fontSize: '0.84rem', color: '#1b4d2e', fontWeight: 600, textDecoration: 'none', background: '#e8f5e9', padding: '0.3rem 0.9rem', borderRadius: 999 }}
            >
              + Claim Building
            </Link>
          </div>

          {mine.length === 0 ? (
            <div
              style={{
                background: '#f8fafc',
                border: '2px dashed #e2e8f0',
                borderRadius: '16px',
                padding: '2.5rem',
                textAlign: 'center',
                color: '#94a3b8',
              }}
            >
              <p style={{ fontSize: '2rem', margin: '0 0 0.5rem' }}>🏗️</p>
              <p style={{ margin: '0 0 1rem', fontWeight: 600 }}>You don't own any buildings yet</p>
              <Link href="/buy" className="btn" style={{ display: 'inline-block', textDecoration: 'none' }}>
                Claim your free building
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {mine.map(s => (
                <div
                  key={s.plotId}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '14px',
                    padding: '1.25rem 1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  }}
                >
                  {/* Color dot / logo */}
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: '12px',
                      background: s.config.logoUrl
                        ? `center/cover url(${s.config.logoUrl})`
                        : s.config.theme ?? '#1b4d2e',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontWeight: 800,
                      fontSize: '1.1rem',
                      flexShrink: 0,
                    }}
                  >
                    {s.config.logoUrl ? '' : (s.config.name?.[0] ?? '?')}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: '0 0 0.1rem', fontWeight: 700, color: '#0f172a', fontSize: '1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.config.name}
                    </p>
                    <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b' }}>
                      Plot {s.plotId} · {s.visits.toLocaleString()} visits · {s.clicks.toLocaleString()} clicks
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                    <Link
                      href={`/editor?plot=${s.plotId}`}
                      style={{ fontSize: '0.8rem', fontWeight: 600, color: '#1b4d2e', background: '#e8f5e9', border: 'none', borderRadius: 999, padding: '0.35rem 0.9rem', textDecoration: 'none', cursor: 'pointer' }}
                    >
                      Edit Store
                    </Link>
                    <Link
                      href={`/city`}
                      style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', background: '#f1f5f9', border: 'none', borderRadius: 999, padding: '0.35rem 0.9rem', textDecoration: 'none', cursor: 'pointer' }}
                    >
                      View in City
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Account section ─────────────────────────────────────────── */}
        <section>
          <h2 style={{ margin: '0 0 1rem', fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>⚙️ Account</h2>
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ margin: '0 0 0.1rem', fontWeight: 600, fontSize: '0.9rem', color: '#0f172a' }}>
                  {user ? 'Email' : 'Session Status'}
                </p>
                <p style={{ margin: 0, fontSize: '0.84rem', color: '#64748b' }}>
                  {user ? user.email : 'Guest Session (saved in this browser)'}
                </p>
              </div>
              {user ? (
                <span style={{ fontSize: '0.72rem', background: '#dcfce7', color: '#16a34a', padding: '0.2rem 0.6rem', borderRadius: 999, fontWeight: 700 }}>
                  Verified
                </span>
              ) : (
                <Link
                  href="/login"
                  style={{ fontSize: '0.78rem', background: '#e0f2fe', color: '#0284c7', padding: '0.25rem 0.75rem', borderRadius: 999, fontWeight: 700, textDecoration: 'none' }}
                >
                  Sign in with email →
                </Link>
              )}
            </div>
            <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ margin: '0 0 0.1rem', fontWeight: 600, fontSize: '0.9rem', color: '#0f172a' }}>Username</p>
                <p style={{ margin: 0, fontSize: '0.84rem', color: '#64748b' }}>
                  {savedUsername ? `@${savedUsername}` : 'Not set — set one to personalise your avatar'}
                </p>
              </div>
              <button
                onClick={startEdit}
                style={{ fontSize: '0.8rem', fontWeight: 600, color: '#1b4d2e', background: '#e8f5e9', border: 'none', borderRadius: 999, padding: '0.35rem 0.9rem', cursor: 'pointer' }}
              >
                {savedUsername ? 'Change' : 'Set username'}
              </button>
            </div>
            {user && (
              <div style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ margin: '0 0 0.1rem', fontWeight: 600, fontSize: '0.9rem', color: '#0f172a' }}>Sign out</p>
                  <p style={{ margin: 0, fontSize: '0.84rem', color: '#64748b' }}>Sign out from all devices</p>
                </div>
                <button
                  onClick={signOut}
                  style={{ fontSize: '0.8rem', fontWeight: 600, color: '#ef4444', background: '#fef2f2', border: 'none', borderRadius: 999, padding: '0.35rem 0.9rem', cursor: 'pointer' }}
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </section>

      </div>
      <Footer />
    </div>
  );
}

