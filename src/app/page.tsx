'use client';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useState, useRef } from 'react';
import Nav from '@/components/Nav';

const TownModelViewer = dynamic(() => import('@/components/TownModelViewer'), { ssr: false });
const PropertyCustomizer = dynamic(() => import('@/components/PropertyCustomizer'), { ssr: false });

// ── Category cards for the "Discover Businesses" carousel ───────────────────
const CATEGORIES = [
  { icon: '💻', label: 'Software & Tech', count: '120+ Stores', color: '#dbeafe' },
  { icon: '🛍️', label: 'E-Commerce & Retail', count: '80+ Stores', color: '#fef3c7' },
  { icon: '🎮', label: 'Gaming & Entertainment', count: '60+ Stores', color: '#ede9fe' },
  { icon: '🤖', label: 'AI & Innovation', count: '70+ Stores', color: '#dcfce7' },
  { icon: '🏢', label: 'Real Estate', count: '50+ Stores', color: '#fce7f3' },
  { icon: '📸', label: 'Creative Studios', count: '40+ Stores', color: '#e0f2fe' },
];

function CategorySlider() {
  const [page, setPage] = useState(0);
  const perPage = 5;
  const pages = Math.ceil(CATEGORIES.length / perPage);
  const start = page * perPage;
  const visible = CATEGORIES.slice(start, start + perPage);

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {/* Previous button */}
      <button
        onClick={() => setPage((p) => Math.max(0, p - 1))}
        disabled={page === 0}
        style={{
          position: 'absolute', left: '-24px', top: '50%', transform: 'translateY(-50%)',
          width: 44, height: 44, borderRadius: '50%',
          background: 'rgba(255,255,255,0.95)', border: '1px solid rgba(203,213,225,0.7)',
          boxShadow: '0 4px 14px rgba(0,0,0,0.08)', cursor: page === 0 ? 'not-allowed' : 'pointer',
          opacity: page === 0 ? 0.4 : 1, fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 2, transition: 'opacity 0.2s',
        }}
        aria-label="Previous"
      >
        ‹
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem' }}>
        {visible.map((cat) => (
          <Link
            key={cat.label}
            href="/city"
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: '0.75rem', padding: '1.5rem 0.75rem',
              background: 'rgba(255,255,255,0.95)', borderRadius: '20px',
              border: '1px solid rgba(226,232,240,0.9)',
              boxShadow: '0 2px 12px rgba(15,23,42,0.05)',
              textDecoration: 'none', transition: 'transform 0.2s, box-shadow 0.2s',
              cursor: 'pointer',
            }}
          >
            <div
              style={{
                width: 72, height: 72, borderRadius: '20px',
                background: cat.color, display: 'flex',
                alignItems: 'center', justifyContent: 'center', fontSize: '2.2rem',
              }}
            >
              {cat.icon}
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>
                {cat.label}
              </div>
              <div
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: '4px', marginTop: '6px',
                  fontSize: '0.78rem', fontWeight: 600, color: '#64748b',
                }}
              >
                {cat.count}
                <span
                  style={{
                    width: 20, height: 20, borderRadius: '50%',
                    background: '#eff6ff', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 11, color: '#2563eb',
                  }}
                >
                  →
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Next button */}
      <button
        onClick={() => setPage((p) => Math.min(pages - 1, p + 1))}
        disabled={page === pages - 1}
        style={{
          position: 'absolute', right: '-24px', top: '50%', transform: 'translateY(-50%)',
          width: 44, height: 44, borderRadius: '50%',
          background: 'rgba(255,255,255,0.95)', border: '1px solid rgba(203,213,225,0.7)',
          boxShadow: '0 4px 14px rgba(0,0,0,0.08)', cursor: page === pages - 1 ? 'not-allowed' : 'pointer',
          opacity: page === pages - 1 ? 0.4 : 1, fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 2, transition: 'opacity 0.2s',
        }}
        aria-label="Next"
      >
        ›
      </button>

      {/* Pagination dots */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '1.5rem' }}>
        {Array.from({ length: pages }, (_, i) => (
          <button
            key={i}
            onClick={() => setPage(i)}
            style={{
              width: i === page ? 24 : 8, height: 8, borderRadius: '999px',
              background: i === page ? '#2563eb' : '#cbd5e1',
              border: 'none', cursor: 'pointer',
              transition: 'all 0.25s ease', padding: 0,
            }}
            aria-label={`Page ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const [activeDistrict, setActiveDistrict] = useState<string | null>(null);

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

              {/* Social proof strip */}
              <div
                style={{
                  display: 'flex', alignItems: 'center', gap: '1rem',
                  padding: '0.85rem 1.3rem',
                  background: 'rgba(255, 255, 255, 0.72)',
                  backdropFilter: 'blur(14px)',
                  border: '1px solid rgba(226, 232, 240, 0.8)',
                  borderRadius: '16px', boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
                  width: 'fit-content',
                }}
              >
                <div style={{ display: 'flex' }}>
                  {['🧑‍💼', '👩‍💻', '👨‍🎨', '🧑‍🚀'].map((e, i) => (
                    <div
                      key={i}
                      style={{
                        width: 32, height: 32, borderRadius: '50%',
                        background: `hsl(${200 + i * 40},70%,65%)`,
                        border: '2px solid #fff', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', fontSize: 14,
                        marginLeft: i > 0 ? -8 : 0,
                      }}
                    >
                      {e}
                    </div>
                  ))}
                </div>
                <div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0f172a' }}>2,400+ Businesses</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>already in the city</div>
                </div>
              </div>
            </div>

            {/* ── RIGHT: Interactive 3D Town Model ── */}
            <div
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: 'clamp(440px, 55vh, 660px)',
              }}
            >
              {/* Soft glow pedestal */}
              <div
                style={{
                  position: 'absolute', bottom: '5%', left: '10%', right: '10%', height: '100px',
                  background: 'radial-gradient(ellipse at center, rgba(99, 148, 255, 0.4) 0%, transparent 70%)',
                  filter: 'blur(28px)', pointerEvents: 'none', zIndex: 0,
                }}
              />

              <div style={{ position: 'relative', width: '100%', height: '100%', zIndex: 1 }}>
                <TownModelViewer onSelectDistrict={setActiveDistrict} />
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════
            SECTION 2 — Discover Businesses
            ════════════════════════════════════════════ */}
        <section
          style={{
            padding: 'clamp(4rem, 7vh, 6rem) clamp(1.5rem, 5vw, 3.5rem)',
            background: '#ffffff',
          }}
        >
          <div style={{ maxWidth: '1340px', margin: '0 auto' }}>
            {/* Section badge & heading */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.2rem', marginBottom: '2.8rem' }}>
              <div
                style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                  color: '#fff', fontSize: '0.9rem', fontWeight: 800,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                2
              </div>
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#64748b', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
                  Discover
                </div>
                <h2
                  style={{
                    margin: 0, fontSize: 'clamp(1.8rem, 3.5vw, 2.9rem)',
                    fontWeight: 800, letterSpacing: '-0.03em', color: '#0f172a', lineHeight: 1.1,
                  }}
                >
                  Discover <span style={{ color: '#2563eb' }}>Businesses</span>
                </h2>
                <p style={{ margin: '0.5rem 0 0', color: '#64748b', fontSize: '1rem', lineHeight: 1.5 }}>
                  From startups to global brands — explore a diverse range of businesses in Nextown's virtual marketplace.
                </p>
              </div>
            </div>

            {/* Category Slider */}
            <div style={{ position: 'relative', padding: '0 1.5rem' }}>
              <CategorySlider />
            </div>
          </div>
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
              {/* Background planes silhouette decoration */}
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
