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
  const [visible, setVisible] = useState(true);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => { init(); }, [init]);
  useEffect(() => { let on = true; isAdmin(user).then(v => on && setAdmin(v)).catch(() => {}); return () => { on = false; }; }, [user]);
  useEffect(() => { setOpen(false); }, [path]);

  // Hide on scroll down, show on scroll up
  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrolled(currentScrollY > 20);

      if (currentScrollY <= 25) {
        // At the very top of the page -> always show
        setVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 60) {
        // Scrolling DOWN -> hide navbar
        setVisible(false);
        setOpen(false); // close mobile menu if scrolling down
      } else if (currentScrollY < lastScrollY) {
        // Scrolling UP -> show navbar
        setVisible(true);
      }
      lastScrollY = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div
      className="home-nav-container"
      style={{
        position: 'fixed',
        top: '1.2rem',
        left: '1.2rem',
        right: '1.2rem',
        zIndex: 100,
        display: 'flex',
        justifyContent: 'center',
        pointerEvents: 'none',
        transform: visible ? 'translateY(0)' : 'translateY(-140%)',
        transition: 'transform 0.38s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <header
        className="home-nav-header"
        style={{
          width: '100%',
          maxWidth: '1360px',
          height: '64px',
          background: scrolled ? 'rgba(255, 255, 255, 0.82)' : 'transparent',
          backdropFilter: scrolled ? 'blur(16px)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(16px)' : 'none',
          borderRadius: '999px',
          padding: '0 1.2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: scrolled ? '0 10px 30px rgba(0, 0, 0, 0.08)' : 'none',
          border: scrolled ? '1px solid rgba(255, 255, 255, 0.7)' : 'none',
          pointerEvents: 'auto',
          position: 'relative',
          transition: 'background 0.3s ease, box-shadow 0.3s ease, border 0.3s ease',
        }}
      >
        {/* Brand */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', textDecoration: 'none' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(2, 132, 199, 0.35)',
              flexShrink: 0,
              color: '#ffffff',
              fontWeight: 900,
              fontSize: '1.2rem',
            }}
          >
            C
          </div>
          <span
            style={{
              font: '800 1.35rem var(--f-display)',
              color: '#000000',
              letterSpacing: '-0.02em',
              whiteSpace: 'nowrap',
            }}
          >
            THE CITY
          </span>
        </Link>

        {/* Center Navigation Links (Desktop) - In air with no enclosing box */}
        <nav
          className="nav-desktop-links"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            background: 'transparent',
            border: 'none',
            padding: 0,
          }}
        >
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
                  fontSize: '0.9rem',
                  fontWeight: active ? '700' : '600',
                  color: '#000000',
                  textDecoration: 'none',
                  padding: '0.45rem 1.15rem',
                  borderRadius: '999px',
                  background: active ? '#ffffff' : 'transparent',
                  boxShadow: active ? '0 2px 10px rgba(0, 0, 0, 0.1)' : 'none',
                  transition: 'all 0.2s ease',
                  opacity: active ? 1 : 0.9,
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
                fontSize: '0.9rem',
                fontWeight: (path as string) === '/admin' ? '700' : '600',
                color: '#000000',
                textDecoration: 'none',
                padding: '0.45rem 1.15rem',
                borderRadius: '999px',
                background: (path as string) === '/admin' ? '#ffffff' : 'transparent',
                boxShadow: (path as string) === '/admin' ? '0 2px 10px rgba(0, 0, 0, 0.1)' : 'none',
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
                padding: '0.45rem 1.25rem',
                borderRadius: '999px',
                border: '1px solid rgba(0, 0, 0, 0.08)',
                background: '#ffffff',
                color: '#000000',
                fontSize: '0.86rem',
                fontWeight: 700,
                textDecoration: 'none',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                transition: 'all 0.2s ease',
              }}
            >
              <span style={{ fontSize: '0.9rem' }}>👤</span>
              <span>{user ? (user.email.split('@')[0]) : 'Login'}</span>
              <span style={{ fontSize: '0.85rem' }}>›</span>
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
            <span className={`nav-bar-line top ${open ? 'active' : ''}`} style={{ background: '#000000' }} />
            <span className={`nav-bar-line mid ${open ? 'active' : ''}`} style={{ background: '#000000' }} />
            <span className={`nav-bar-line bot ${open ? 'active' : ''}`} style={{ background: '#000000' }} />
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

