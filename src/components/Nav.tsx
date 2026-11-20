'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth, isAdmin } from '@/lib/data';
import { DEMO } from '@/lib/supabase';

const LINKS: [string, string, string][] = [
  ['/', 'Home', '🏠'],
  ['/city', 'Explore City', '🏙️'],
  ['/buy', 'Properties', '🏢'],
  ['/about', 'About', 'ℹ️'],
  ['/faq', 'FAQ', '❓'],
];

export default function Nav({ overlay = false, floating = false }: { overlay?: boolean; floating?: boolean }) {
  const { user, init, signOut } = useAuth(), path = usePathname();

  // Only show on the home page
  if (path !== '/') return null;
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
        <nav className="nav-desktop-links">
          {LINKS.map(([h, l]) => {
            const active = path === h;
            return (
              <Link
                key={h}
                href={h}
                style={{
                  position: 'relative',
                  fontSize: '0.94rem',
                  fontWeight: active ? '700' : '500',
                  color: active ? '#1b4d2e' : '#4b5563',
                  textDecoration: 'none',
                  padding: '0.4rem 0.2rem',
                  transition: 'color 0.2s ease',
                }}
              >
                {l}
                {active && (
                  <span
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: '10%',
                      right: '10%',
                      height: '2px',
                      background: '#1b4d2e',
                      borderRadius: '2px',
                    }}
                  />
                )}
              </Link>
            );
          })}
          {admin && (
            <Link href="/admin" style={{ fontSize: '0.94rem', fontWeight: '500', color: '#4b5563', textDecoration: 'none' }}>
              Admin
            </Link>
          )}
        </nav>

        {/* Action Button & 3-Line Hamburger for Mobile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div className="nav-desktop-actions">
            {user ? (
              <>
                <Link
                  href="/profile"
                  className="nav-signin-link"
                  style={{
                    color: (path as string) === '/profile' ? '#1b4d2e' : '#4b5563',
                    fontSize: '0.88rem',
                    fontWeight: (path as string) === '/profile' ? 700 : 500,
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.35rem 0.65rem',
                    borderRadius: '999px',
                    background: (path as string) === '/profile' ? '#e8f5e9' : 'transparent',
                  }}
                >
                  <span>👤</span>
                  <span>Profile</span>
                </Link>
                <button
                  onClick={signOut}
                  className="nav-signin-link"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    fontSize: '0.84rem',
                    cursor: 'pointer',
                    fontWeight: 500,
                  }}
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="nav-signin-link"
                style={{
                  color: '#4b5563',
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  textDecoration: 'none',
                  padding: '0.4rem 0.8rem',
                }}
              >
                Sign in
              </Link>
            )}

            <Link
              href="/city"
              className="nav-play-btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                background: '#0d2d1a',
                color: '#ffffff',
                padding: '0.68rem 1.4rem',
                borderRadius: '999px',
                fontSize: '0.92rem',
                fontWeight: 600,
                textDecoration: 'none',
                boxShadow: '0 4px 14px rgba(13, 45, 26, 0.28)',
                transition: 'transform 0.15s ease, background 0.2s',
                whiteSpace: 'nowrap',
              }}
            >
              <span>Play Now</span>
              <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>→</span>
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
              {user ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 8px' }}>
                  <Link
                    href="/profile"
                    onClick={() => setOpen(false)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      fontSize: '0.92rem',
                      fontWeight: 600,
                      color: '#1e293b',
                      textDecoration: 'none',
                    }}
                  >
                    <span>👤</span>
                    <span>My Profile</span>
                  </Link>
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
                </div>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    padding: '10px 16px',
                    borderRadius: '12px',
                    background: '#f1f5f9',
                    color: '#1e293b',
                    fontSize: '0.92rem',
                    fontWeight: 600,
                    textDecoration: 'none',
                  }}
                >
                  Sign in
                </Link>
              )}

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

