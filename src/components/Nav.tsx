'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth, isAdmin } from '@/lib/data';
import { DEMO } from '@/lib/supabase';

const LINKS: [string, string][] = [['/city', 'Explore'], ['/buy', 'Marketplace'], ['/about', 'About'], ['/faq', 'FAQs']];

export default function Nav({ overlay = false, floating = false }: { overlay?: boolean; floating?: boolean }) {
  const { user, init, signOut } = useAuth(), path = usePathname();
  const [admin, setAdmin] = useState(false), [open, setOpen] = useState(false), [scrolled, setScrolled] = useState(false);
  useEffect(() => { init(); }, [init]);
  useEffect(() => { let on = true; isAdmin(user).then(v => on && setAdmin(v)).catch(() => {}); return () => { on = false; }; }, [user]);
  useEffect(() => { setOpen(false); }, [path]);
  useEffect(() => { if (!overlay) return; const f = () => setScrolled(window.scrollY > window.innerHeight * 1.2); f(); window.addEventListener('scroll', f, { passive: true }); return () => window.removeEventListener('scroll', f); }, [overlay]);
  return (
    <header className={'nav' + (overlay ? ' overlay' : '') + (floating ? ' floating' : '') + (overlay && scrolled ? ' solid' : '')}>
      <Link href="/" className="brand" aria-label="THE CITY home">
        <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden><rect x="2" y="9" width="5" height="15" rx="1.2" fill="#22d3ee" /><rect x="10" y="2" width="6" height="22" rx="1.2" fill="#fff" /><rect x="19" y="12" width="5" height="12" rx="1.2" fill="#22d3ee" /></svg>
        <span>THE <b>CITY</b></span>
      </Link>
      <button className="nav-toggle" aria-label="Menu" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? '✕' : '☰'}</button>
      <nav className={'nav-links' + (open ? ' open' : '')}>
        {LINKS.map(([h, l]) => <Link key={h} href={h} aria-current={path === h ? 'page' : undefined}>{l}</Link>)}
        {admin && <Link href="/admin" aria-current={path === '/admin' ? 'page' : undefined}>Admin</Link>}
        {user ? <><Link href="/dashboard" aria-current={path === '/dashboard' ? 'page' : undefined}>Dashboard</Link><button className="ghost" onClick={signOut}>Sign out</button></> : <Link href="/login">Sign in</Link>}
        <Link href="/buy" className="btn sm">Claim Your Plot</Link>
      </nav>
      {DEMO && <span className="demo" title="Add Supabase keys in .env.local to enable the database">Demo mode</span>}
    </header>
  );
}
