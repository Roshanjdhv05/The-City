'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth, isAdmin } from '@/lib/data';
import { DEMO } from '@/lib/supabase';

const LINKS: [string, string, string][] = [
  ['/', 'Home', '🏠'],
  ['/city', 'Explore', '🏙️'],
  ['/buy', 'Markets', '🏢'],
  ['/about', 'About', 'ℹ️'],
  ['/faq', 'FAQ', '❓'],
];

export default function Nav({ overlay = false, floating = false }: { overlay?: boolean; floating?: boolean }) {
  const { user, init, signOut } = useAuth(), path = usePathname();

  // Do not show on the full-screen 3D city canvas which uses HUD
  if (path === '/city') return null;
  const [admin, setAdmin] = useState(false), [open, setOpen] = useState(false);
  useEffect(() => { init(); }, [init]);
  useEffect(() => { let on = true; isAdmin(user).then(v => on && setAdmin(v)).catch(() => {}); return () => { on = false; }; }, [user]);
  useEffect(() => { setOpen(false); }, [path]);

  return (
    <div
      className="home-nav-container"
      style={{
        position: 'fixed',
        top: '1.2rem',
        left: '1.2rem',
        right: '1.2rem',
        zIndex: 50,
        display: 'flex',
        justifyContent: 'center',
        pointerEvents: 'none',
      }}
    >
      <header
        className="home-nav-header"
        style={{
          width: '100%',
          maxWidth: '1280px',
          height: '68px',
          background: 'rgba(255, 255, 255, 0.88)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderRadius: '999px',
          padding: '0 1.2rem 0 1.6rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 12px 36px -10px rgba(15, 35, 25, 0.12), 0 2px 8px rgba(0,0,0,0.04)',
          border: '1px solid rgba(255, 255, 255, 0.95)',
          pointerEvents: 'auto',
          position: 'relative',
          transition: 'all 0.3s ease',
        }}
      >
        {/* Brand */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', textDecoration: 'none' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: '#e8f5e9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)',
              flexShrink: 0,
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M4 20V10L10 6V20M10 20V4L18 8V20M4 20H20" stroke="#1b4d2e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="19" cy="17" r="2.5" fill="#2e7d32" />
            </svg>
          </div>
          <span style={{ font: '700 1.35rem var(--f-display)', color: '#0f2918', letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>
            The<span style={{ color: '#2e7d32' }}>City</span>
          </span>
        </Link>

        {/* Center Navigation Links (Desktop) */}
        <nav className="nav-desktop-links" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          {LINKS.map(([h, l, icon]) => {
            const active = path === h;
            return (
              <Link
                key={h}
                href={h}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.88rem',
                  fontWeight: active ? '700' : '500',
                  color: active ? '#0f172a' : '#475569',
                  textDecoration: 'none',
                  padding: '0.42rem 0.95rem',
                  borderRadius: '999px',
                  background: active ? '#f1f5f9' : 'transparent',
                  transition: 'all 0.2s ease',
                }}
              >
                {active && <span>{icon}</span>}
                <span>{l}</span>
              </Link>
            );
          })}
          {admin && (
            <Link
              href="/admin"
              style={{
                fontSize: '0.88rem',
                fontWeight: (path as string) === '/admin' ? '700' : '500',
                color: (path as string) === '/admin' ? '#0f172a' : '#475569',
                textDecoration: 'none',
                padding: '0.42rem 0.95rem',
                borderRadius: '999px',
                background: (path as string) === '/admin' ? '#f1f5f9' : 'transparent',
              }}
            >
              Admin
            </Link>
          )}
        </nav>

        {/* Action Button & 3-Line Hamburger for Mobile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div className="nav-desktop-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Link
              href={user ? '/profile' : '/login'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '0.45rem 1.15rem',
                borderRadius: '999px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#0f172a',
                fontSize: '0.86rem',
                fontWeight: 600,
                textDecoration: 'none',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                transition: 'all 0.2s ease',
              }}
            >
              <span style={{ fontSize: '0.9rem' }}>👤</span>
              <span>{user ? (user.email.split('@')[0]) : 'Login'}</span>
            </Link>
          </div>

          {/* 3-Line Hamburger Menu Button for Phone */}
          <button
            type="button"
            className="nav-hamburger-btn"
            onClick={() => setOpen(!open)}
            aria-label={open ? 'Close navigation menu' : 'Open navigation menu with 3 lines'}
            title="Navigation Menu"
          >
            <span className={`nav-bar-line top ${open ? 'active' : ''}`} />
            <span className={`nav-bar-line mid ${open ? 'active' : ''}`} />
            <span className={`nav-bar-line bot ${open ? 'active' : ''}`} />
          </button>
        </div>

        {/* Mobile Dropdown Navigation Menu */}
        {open && (
          <div className="nav-mobile-menu">
            <div style={{ padding: '0 0.4rem 0.4rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(226,232,240,0.8)', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94a3b8' }}>
                Navigation Menu
              </span>
              <span style={{ fontSize: '0.78rem', color: '#16a34a', fontWeight: 700 }}>
                ● Online
              </span>
            </div>

            {LINKS.map(([h, l, icon]) => {
              const active = path === h;
              return (
                <Link
                  key={h}
                  href={h}
                  onClick={() => setOpen(false)}
                  className={`nav-mobile-link ${active ? 'active' : ''}`}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <span style={{ fontSize: '1.1rem' }}>{icon}</span>
                    <span>{l}</span>
                  </span>
                  <span style={{ fontSize: '0.88rem', color: active ? '#166534' : '#94a3b8' }}>→</span>
                </Link>
              );
            })}

            {admin && (
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className="nav-mobile-link"
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <span style={{ fontSize: '1.1rem' }}>⚙️</span>
                  <span>Admin</span>
                </span>
                <span style={{ fontSize: '0.88rem', color: '#94a3b8' }}>→</span>
              </Link>
            )}

            <div style={{ height: '1px', background: 'rgba(226,232,240,0.8)', margin: '0.4rem 0' }} />

            {/* Mobile Auth and Play Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.4rem 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 8px' }}>
                <Link
                  href="/profile"
                  onClick={() => setOpen(false)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    fontSize: '0.92rem',
                    fontWeight: (path as string) === '/profile' ? 700 : 600,
                    color: (path as string) === '/profile' ? '#166534' : '#1e293b',
                    textDecoration: 'none',
                  }}
                >
                  <span>👤</span>
                  <span>My Profile</span>
                </Link>
                {user ? (
                  <button
                    onClick={() => { signOut(); setOpen(false); }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#ef4444',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Sign out
                  </button>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setOpen(false)}
                    style={{
                      fontSize: '0.85rem',
                      color: '#2563eb',
                      fontWeight: 600,
                      textDecoration: 'none',
                    }}
                  >
                    Sign in
                  </Link>
                )}
              </div>

              <Link
                href="/city"
                onClick={() => setOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  background: 'linear-gradient(135deg, #15803d, #0d2d1a)',
                  color: '#ffffff',
                  padding: '12px 18px',
                  borderRadius: '14px',
                  fontSize: '1rem',
                  fontWeight: 700,
                  textDecoration: 'none',
                  boxShadow: '0 6px 18px rgba(21, 128, 61, 0.3)',
                  marginTop: '0.2rem',
                }}
              >
                <span>Play Now</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        )}
      </header>
    </div>
  );
}

