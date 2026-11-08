'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth, isAdmin } from '@/lib/data';
import { DEMO } from '@/lib/supabase';

const LINKS: [string, string][] = [
  ['/', 'Home'],
  ['/city', 'Explore City'],
  ['/buy', 'Properties'],
  ['/about', 'About'],
  ['/faq', 'FAQ'],
];

export default function Nav({ overlay = false, floating = false }: { overlay?: boolean; floating?: boolean }) {
  const { user, init, signOut } = useAuth(), path = usePathname();
  const [admin, setAdmin] = useState(false), [open, setOpen] = useState(false);
  useEffect(() => { init(); }, [init]);
  useEffect(() => { let on = true; isAdmin(user).then(v => on && setAdmin(v)).catch(() => {}); return () => { on = false; }; }, [user]);
  useEffect(() => { setOpen(false); }, [path]);

  return (
    <div style={{ position: 'fixed', top: '1.2rem', left: '1.2rem', right: '1.2rem', zIndex: 50, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
      <header
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
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M4 20V10L10 6V20M10 20V4L18 8V20M4 20H20" stroke="#1b4d2e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="19" cy="17" r="2.5" fill="#2e7d32" />
            </svg>
          </div>
          <span style={{ font: '700 1.35rem var(--f-display)', color: '#0f2918', letterSpacing: '-0.02em' }}>
            The<span style={{ color: '#2e7d32' }}>City</span>
          </span>
        </Link>

        {/* Center Navigation Links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
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
          {admin && <Link href="/admin" style={{ fontSize: '0.94rem', fontWeight: '500', color: '#4b5563', textDecoration: 'none' }}>Admin</Link>}
        </nav>

        {/* Action Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          {user ? (
            <>
              <Link
                href="/profile"
                style={{
                  color: path === '/profile' ? '#1b4d2e' : '#4b5563',
                  fontSize: '0.88rem',
                  fontWeight: path === '/profile' ? 700 : 500,
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.35rem 0.65rem',
                  borderRadius: '999px',
                  background: path === '/profile' ? '#e8f5e9' : 'transparent',
                }}
              >
                <span>👤</span>
                <span>Profile</span>
              </Link>
              <button
                onClick={signOut}
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
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: '#0d2d1a',
              color: '#ffffff',
              padding: '0.68rem 1.4rem',
              borderRadius: '999px',
              fontSize: '0.92rem',
              fontWeight: 600,
              textDecoration: 'none',
              boxShadow: '0 4px 14px rgba(13, 45, 26, 0.28)',
              transition: 'transform 0.15s ease, background 0.2s',
            }}
          >
            <span>Play Now</span>
            <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>→</span>
          </Link>
        </div>
      </header>
    </div>
  );
}
