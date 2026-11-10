'use client';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Nav from '@/components/Nav';

const CityHeroScene = dynamic(() => import('@/components/CityHeroScene'), { ssr: false });
const PropertyCustomizer = dynamic(() => import('@/components/PropertyCustomizer'), { ssr: false });

// ── Professional SVG icons for each category ─────────────────────────────────
const CATEGORIES = [
  {
    label: 'Software & Tech',
    count: '120+ Stores',
    gradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    bg: '#eff6ff',
    text: '#1d4ed8',
    svg: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
        <line x1="14" y1="4" x2="10" y2="20" />
      </svg>
    ),
  },
  {
    label: 'E-Commerce & Retail',
    count: '80+ Stores',
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    bg: '#fffbeb',
    text: '#d97706',
    svg: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 01-8 0" />
      </svg>
    ),
  },
  {
    label: 'Gaming & Entertainment',
    count: '60+ Stores',
    gradient: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
    bg: '#f5f3ff',
    text: '#6d28d9',
    svg: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="6" width="20" height="12" rx="4" />
        <line x1="6" y1="12" x2="10" y2="12" /><line x1="8" y1="10" x2="8" y2="14" />
        <circle cx="15" cy="10" r="1" fill="currentColor" /><circle cx="17" cy="13" r="1" fill="currentColor" />
      </svg>
    ),
  },
  {
    label: 'AI & Innovation',
    count: '70+ Stores',
    gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    bg: '#ecfdf5',
    text: '#059669',
    svg: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7h1a1 1 0 110 2h-1v1a2 2 0 01-2 2H5a2 2 0 01-2-2v-1H2a1 1 0 110-2h1a7 7 0 017-7h1V5.73A2 2 0 0110 4a2 2 0 012-2z" />
        <circle cx="8.5" cy="13.5" r="1.5" fill="currentColor" /><circle cx="15.5" cy="13.5" r="1.5" fill="currentColor" />
        <path d="M9 17c.83 1 5.17 1 6 0" />
      </svg>
    ),
  },
  {
    label: 'Real Estate',
    count: '50+ Stores',
    gradient: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
    bg: '#fdf2f8',
    text: '#be185d',
    svg: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    label: 'Creative Studios',
    count: '40+ Stores',
    gradient: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
    bg: '#ecfeff',
    text: '#0891b2',
    svg: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M8.56 2.75c4.37 6.03 6.02 9.42 8.03 17.72m2.54-15.38c-3.72 4.35-8.94 5.66-16.88 5.85m19.5 1.9c-3.5-.93-6.63-.82-8.94 0-2.58.92-5.01 2.86-7.44 6.32" />
      </svg>
    ),
  },
  {
    label: 'Finance & Banking',
    count: '35+ Stores',
    gradient: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
    bg: '#f0f9ff',
    text: '#0284c7',
    svg: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
      </svg>
    ),
  },
  {
    label: 'Health & Wellness',
    count: '45+ Stores',
    gradient: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
    bg: '#fff7ed',
    text: '#ea580c',
    svg: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
      </svg>
    ),
  },
  {
    label: 'Education & Learning',
    count: '55+ Stores',
    gradient: 'linear-gradient(135deg, #84cc16 0%, #65a30d 100%)',
    bg: '#f7fee7',
    text: '#65a30d',
    svg: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
        <path d="M6 12v5c3 3 9 3 12 0v-5" />
      </svg>
    ),
  },
  {
    label: 'Food & Dining',
    count: '90+ Stores',
    gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    bg: '#fef2f2',
    text: '#dc2626',
    svg: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8h1a4 4 0 010 8h-1" /><path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z" />
        <line x1="6" y1="1" x2="6" y2="4" /><line x1="10" y1="1" x2="10" y2="4" /><line x1="14" y1="1" x2="14" y2="4" />
      </svg>
    ),
  },
];

// ── Infinite auto-scroll marquee track ───────────────────────────────────────
function DiscoverMarquee() {
  // Duplicate for seamless loop
  const all = [...CATEGORIES, ...CATEGORIES];

  return (
    <div
      style={{
        overflow: 'hidden',
        width: '100%',
        position: 'relative',
        // fade edges
      }}
    >
      {/* Left & right fade masks */}
      <div
        style={{
          position: 'absolute', top: 0, left: 0, bottom: 0, width: '80px', zIndex: 2,
          background: 'linear-gradient(to right, #ffffff 0%, transparent 100%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute', top: 0, right: 0, bottom: 0, width: '80px', zIndex: 2,
          background: 'linear-gradient(to left, #ffffff 0%, transparent 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* Scrolling track */}
      <div
        className="marquee-track"
        style={{
          display: 'flex',
          gap: '1.25rem',
          width: 'max-content',
        }}
      >
        {all.map((cat, i) => (
          <Link
            key={i}
            href="/city"
            className="marquee-card"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.9rem',
              padding: '1.6rem 1.4rem',
              background: '#ffffff',
              borderRadius: '24px',
              border: '1px solid rgba(226,232,240,0.9)',
              boxShadow: '0 4px 20px rgba(15,23,42,0.06)',
              textDecoration: 'none',
              minWidth: '170px',
              flexShrink: 0,
              transition: 'transform 0.25s ease, box-shadow 0.25s ease',
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Icon circle */}
            <div
              style={{
                width: 68, height: 68, borderRadius: '20px',
                background: cat.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: cat.text,
                position: 'relative',
                flexShrink: 0,
              }}
            >
              {/* Gradient glow behind icon */}
              <div
                style={{
                  position: 'absolute', inset: 0, borderRadius: '20px',
                  background: cat.gradient, opacity: 0.12,
                }}
              />
              {cat.svg}
            </div>

            {/* Label */}
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontSize: '0.86rem', fontWeight: 700, color: '#0f172a',
                  lineHeight: 1.25, marginBottom: '5px',
                }}
              >
                {cat.label}
              </div>
              <div
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                  background: cat.bg, color: cat.text,
                  padding: '3px 10px', borderRadius: '999px',
                  fontSize: '0.72rem', fontWeight: 700,
                }}
              >
                {cat.count}
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </div>
            </div>

            {/* Bottom gradient accent bar */}
            <div
              style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                height: '3px', background: cat.gradient, opacity: 0.7,
              }}
            />
          </Link>
        ))}
      </div>

      <style>{`
        .marquee-track {
          animation: marqueeScroll 38s linear infinite;
        }
        .marquee-track:hover {
          animation-play-state: paused;
        }
        @keyframes marqueeScroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .marquee-card:hover {
          transform: translateY(-6px) scale(1.03);
          box-shadow: 0 16px 40px rgba(15,23,42,0.13) !important;
          border-color: rgba(37,99,235,0.3) !important;
        }
      `}</style>
    </div>
  );
}

export default function Home() {
  return (
    <>
      {/* ── Navbar ── */}
      <Nav overlay />

      {/* ── Page Wrapper ── */}
      <div style={{ background: '#f0f7ff', minHeight: '100vh', overflowX: 'hidden' }}>

        {/* ════════════════════════════════════════════
            HERO SECTION — Left copy + Right 3D Model
            ════════════════════════════════════════════ */}
        <section
          style={{
            position: 'relative',
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            overflow: 'hidden',
            background: 'linear-gradient(135deg, #e8f4ff 0%, #f0f7ff 40%, #dbeafe 100%)',
          }}
        >
          {/* Background soft radial glows */}
          <div
            style={{
              position: 'absolute', inset: 0, pointerEvents: 'none',
              background: 'radial-gradient(ellipse 60% 55% at 70% 50%, rgba(99, 180, 255, 0.22) 0%, transparent 70%), radial-gradient(ellipse 40% 40% at 15% 30%, rgba(190, 227, 255, 0.35) 0%, transparent 70%)',
            }}
          />

          <div
            style={{
              maxWidth: '1340px', margin: '0 auto', padding: 'clamp(6rem, 10vh, 9rem) clamp(1.5rem, 5vw, 3.5rem) clamp(3rem, 6vh, 5rem)',
              display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.3fr)',
              gap: 'clamp(2rem, 5vw, 5rem)', alignItems: 'center', width: '100%',
            }}
          >
            {/* ── LEFT: Text & CTAs ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.6rem' }}>
              {/* Tagline pill */}
              <div
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  padding: '8px 18px', borderRadius: '999px',
                  background: 'rgba(37, 99, 235, 0.1)', border: '1px solid rgba(37, 99, 235, 0.25)',
                  fontSize: '0.88rem', fontWeight: 700, color: '#1d4ed8',
                  width: 'fit-content',
                }}
              >
                <span
                  style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: '#2563eb', boxShadow: '0 0 8px rgba(37, 99, 235, 0.6)',
                    display: 'inline-block',
                  }}
                />
                Virtual Business City
              </div>

              {/* Headline */}
              <h1
                style={{
                  margin: 0,
                  fontSize: 'clamp(2.8rem, 5.5vw, 4.8rem)',
                  fontWeight: 900,
                  lineHeight: 1.0,
                  letterSpacing: '-0.03em',
                  color: '#0f172a',
                }}
              >
                A New Place<br />
                for Businesses<br />
                to <span style={{ color: '#2563eb' }}>Exist.</span>
              </h1>

              {/* Sub */}
              <p
                style={{
                  margin: 0,
                  fontSize: 'clamp(1rem, 1.3vw, 1.15rem)',
                  color: '#475569',
                  lineHeight: 1.65,
                  maxWidth: '42ch',
                }}
              >
                Explore a vibrant virtual city, discover businesses and claim your own building.
              </p>

              {/* CTAs */}
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <Link
                  href="/city"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.6rem',
                    background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                    color: '#ffffff', padding: '0.95rem 2rem',
                    borderRadius: '999px', fontSize: '1rem', fontWeight: 700,
                    textDecoration: 'none',
                    boxShadow: '0 8px 28px rgba(37, 99, 235, 0.4), 0 2px 6px rgba(37, 99, 235, 0.3)',
                    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                  }}
                >
                  Explore City
                  <span style={{ fontSize: '1.1rem' }}>→</span>
                </Link>

                <Link
                  href="/city"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                    background: 'rgba(255, 255, 255, 0.85)',
                    backdropFilter: 'blur(12px)',
                    color: '#0f172a', padding: '0.95rem 1.6rem',
                    borderRadius: '999px', fontSize: '1rem', fontWeight: 600,
                    textDecoration: 'none',
                    border: '1px solid rgba(203, 213, 225, 0.8)',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                    transition: 'transform 0.15s ease',
                  }}
                >
                  <span style={{ fontSize: '1rem' }}>▶</span>
                  Watch Demo
                </Link>
              </div>
            </div>

            {/* ── RIGHT: Procedural 3D City Scene ── */}
            <div
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: 'clamp(460px, 60vh, 680px)',
              }}
            >
              <div style={{ position: 'relative', width: '100%', height: '100%', zIndex: 1 }}>
                <CityHeroScene />
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════
            SECTION 2 — Discover Businesses (Auto-Scroll Marquee)
            ════════════════════════════════════════════ */}
        <section
          style={{
            padding: 'clamp(4rem, 7vh, 6rem) 0',
            background: '#ffffff',
            overflow: 'hidden',
          }}
        >
          {/* Section heading (padded) */}
          <div style={{ maxWidth: '1340px', margin: '0 auto', padding: '0 clamp(1.5rem, 5vw, 3.5rem)', marginBottom: '3rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
              <div>
                {/* Step badge */}
                <div
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                    background: 'linear-gradient(135deg, rgba(37,99,235,0.08), rgba(99,102,241,0.08))',
                    border: '1px solid rgba(37,99,235,0.18)',
                    padding: '5px 14px', borderRadius: '999px',
                    fontSize: '0.76rem', fontWeight: 800, color: '#2563eb',
                    letterSpacing: '0.08em', textTransform: 'uppercase',
                    marginBottom: '0.75rem',
                  }}
                >
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2563eb', display: 'inline-block' }} />
                  Step 2 · Discover
                </div>

                <h2
                  style={{
                    margin: 0,
                    fontSize: 'clamp(1.8rem, 3.5vw, 2.9rem)',
                    fontWeight: 800, letterSpacing: '-0.03em', color: '#0f172a', lineHeight: 1.1,
                  }}
                >
                  Discover{' '}
                  <span
                    style={{
                      background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}
                  >
                    Businesses
                  </span>
                </h2>
                <p style={{ margin: '0.6rem 0 0', color: '#64748b', fontSize: '1rem', lineHeight: 1.55, maxWidth: '52ch' }}>
                  From startups to global brands — explore a diverse range of businesses across Nextown&apos;s virtual marketplace.
                </p>
              </div>

              {/* CTA link */}
              <Link
                href="/city"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  padding: '0.75rem 1.5rem',
                  background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                  color: '#ffffff', borderRadius: '999px',
                  fontSize: '0.88rem', fontWeight: 700,
                  textDecoration: 'none',
                  boxShadow: '0 4px 16px rgba(37,99,235,0.3)',
                  flexShrink: 0,
                  whiteSpace: 'nowrap',
                }}
              >
                Browse All
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            {/* Stats row */}
            <div style={{ display: 'flex', gap: '2rem', marginTop: '1.6rem', flexWrap: 'wrap' }}>
              {[
                { n: '10', label: 'Categories', icon: '⬡' },
                { n: '460+', label: 'Plots Available', icon: '📍' },
                { n: '9', label: 'Districts', icon: '🏙️' },
              ].map((s) => (
                <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div
                    style={{
                      width: 36, height: 36, borderRadius: '10px',
                      background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1rem',
                    }}
                  >
                    {s.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{s.n}</div>
                    <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 600 }}>{s.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Auto-scrolling marquee */}
          <DiscoverMarquee />
        </section>

        {/* ════════════════════════════════════════════
            SECTION 3 — Design Your Virtual Property
            ════════════════════════════════════════════ */}
        <section
          style={{
            padding: 'clamp(4rem, 7vh, 6.5rem) clamp(1.5rem, 5vw, 3.5rem)',
            background: 'linear-gradient(180deg, #f8faff 0%, #eef4ff 100%)',
          }}
        >
          <div style={{ maxWidth: '1340px', margin: '0 auto' }}>
            {/* Section header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', marginBottom: '2.8rem' }}>
              <div
                style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                  color: '#fff', fontSize: '0.9rem', fontWeight: 800,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}
              >
                3
              </div>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#64748b', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Claim
              </div>
            </div>

            <PropertyCustomizer />
          </div>
        </section>

        {/* ════════════════════════════════════════════
            CTA BANNER — Step into Nextown today
            ════════════════════════════════════════════ */}
        <section style={{ padding: 'clamp(1.5rem, 3vw, 2rem) clamp(1.5rem, 5vw, 3.5rem)' }}>
          <div style={{ maxWidth: '1340px', margin: '0 auto' }}>
            <div
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                flexWrap: 'wrap', gap: '1.5rem',
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #0d2a5e 100%)',
                borderRadius: '28px', padding: 'clamp(1.8rem, 3vw, 2.5rem) clamp(2rem, 4vw, 3.5rem)',
                boxShadow: '0 20px 60px rgba(15, 23, 42, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.07)',
                position: 'relative', overflow: 'hidden',
              }}
            >
              {/* Background decoration */}
              <div
                style={{
                  position: 'absolute', right: '15%', top: '50%', transform: 'translateY(-55%)',
                  fontSize: '8rem', opacity: 0.07, lineHeight: 1, pointerEvents: 'none',
                  userSelect: 'none', filter: 'blur(2px)',
                }}
              >
                ✈️
              </div>

              <div>
                <h3 style={{ margin: '0 0 0.3rem', fontSize: 'clamp(1.4rem, 2.5vw, 2rem)', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
                  Step into Nextown today!
                </h3>
                <p style={{ margin: 0, color: 'rgba(203, 213, 225, 0.85)', fontSize: '0.95rem', fontWeight: 500 }}>
                  Explore. Discover. Grow.
                </p>
              </div>

              <Link
                href="/city"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.65rem',
                  background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                  color: '#ffffff', padding: '1rem 2.2rem',
                  borderRadius: '999px', fontSize: '1rem', fontWeight: 700,
                  textDecoration: 'none',
                  boxShadow: '0 8px 24px rgba(37, 99, 235, 0.45)',
                  transition: 'transform 0.15s ease',
                  whiteSpace: 'nowrap',
                }}
              >
                Enter the City
                <span style={{ fontSize: '1.1rem' }}>→</span>
              </Link>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════
            FOOTER
            ════════════════════════════════════════════ */}
        <footer
          style={{
            background: '#ffffff',
            borderTop: '1px solid rgba(226, 232, 240, 0.8)',
            padding: 'clamp(2rem, 4vh, 3rem) clamp(1.5rem, 5vw, 3.5rem)',
          }}
        >
          <div
            style={{
              maxWidth: '1340px', margin: '0 auto',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              flexWrap: 'wrap', gap: '1.5rem',
            }}
          >
            {/* Brand */}
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none' }}>
              <div style={{ width: 32, height: 32, borderRadius: '9px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M4 20V10L10 6V20M10 20V4L18 8V20M4 20H20" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <span style={{ font: '700 1.15rem var(--f-display)', color: '#0f172a' }}>NEXTOWN</span>
            </Link>

            {/* Footer links */}
            <nav style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
              {[['Explore City', '/city'], ['Properties', '/buy'], ['FAQ', '/faq'], ['About', '/about'], ['Contact', '/contact']].map(([label, href]) => (
                <Link key={href} href={href} style={{ fontSize: '0.88rem', fontWeight: 500, color: '#64748b', textDecoration: 'none' }}>
                  {label}
                </Link>
              ))}
            </nav>

            {/* Social icons */}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {[
                { icon: '💬', label: 'Discord' },
                { icon: '▶', label: 'YouTube' },
                { icon: '✕', label: 'Twitter/X' },
                { icon: '🌐', label: 'Web' },
              ].map(({ icon, label }) => (
                <div
                  key={label}
                  style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: 'rgba(241, 245, 249, 0.9)',
                    border: '1px solid rgba(226, 232, 240, 0.8)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 15, cursor: 'pointer', transition: 'background 0.2s',
                    color: '#475569',
                  }}
                  title={label}
                >
                  {icon}
                </div>
              ))}
            </div>
          </div>

          {/* Copyright */}
          <div
            style={{
              maxWidth: '1340px', margin: '1.5rem auto 0',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              borderTop: '1px solid rgba(226, 232, 240, 0.6)',
              paddingTop: '1rem', flexWrap: 'wrap', gap: '0.5rem',
            }}
          >
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              © 2025 Nextown. All rights reserved.
            </span>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic' }}>
              Build. Explore. Live Your City.
            </span>
          </div>
        </footer>
      </div>
    </>
  );
}
