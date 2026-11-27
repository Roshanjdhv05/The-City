'use client';
import Link from 'next/link';
import Image from 'next/image';
import Nav from '@/components/Nav';
import { useEffect, useRef, useState } from 'react';

export default function Home() {
  // Scroll-scrubbed cloud reveal
  const discoverRef = useRef<HTMLDivElement>(null);
  const [cloudProgress, setCloudProgress] = useState(0); // 0=fully covered, 1=fully revealed
  const [manualScrub, setManualScrub] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const effectiveProgress = manualScrub !== null ? manualScrub : cloudProgress;

  useEffect(() => {
    let animId: number;
    if (isPlaying) {
      let start: number | null = null;
      const duration = 2800;
      const step = (ts: number) => {
        if (!start) start = ts;
        const elapsed = ts - start;
        const p = Math.min(1, elapsed / duration);
        setManualScrub(p);
        if (p < 1) {
          animId = requestAnimationFrame(step);
        } else {
          setIsPlaying(false);
        }
      };
      animId = requestAnimationFrame(step);
    }
    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [isPlaying]);

  useEffect(() => {
    const onScroll = () => {
      const el = discoverRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;

      // Start opening when top of section enters 95% of viewport
      // Complete opening when top of section reaches 25% of viewport
      const triggerStart = vh * 0.95;
      const triggerEnd = vh * 0.25;
      const raw = (triggerStart - rect.top) / (triggerStart - triggerEnd);
      setCloudProgress(Math.min(1, Math.max(0, raw)));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    onScroll(); // run once on mount
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return (
    <div className="new-home-wrap">
      {/* ── Top Navigation (Transparent & Integrated into Hero) ── */}
      <Nav overlay />

      {/* ════════════════════════════════════════════════════════════
          1. HERO SECTION (Immersive 68-75% Viewport Height)
          ════════════════════════════════════════════════════════════ */}
      <section
        className="new-home-hero"
        style={{ backgroundImage: "url('/herosection.png')" }}
      >
        <div className="home-hero-overlay" />

        {/* Hero Left Content */}
        <div className="home-hero-content">
          {/* Badge */}
          <div className="home-pill-badge home-badge-glass anim-text-enter">
            <span className="anim-dot-pulse" style={{ color: '#22c55e', fontSize: '0.9rem' }}>●</span>
            <span>Virtual Business Marketplace</span>
          </div>

          {/* Large Main Heading */}
          <h1
            className="anim-text-enter-d1"
            style={{
              fontSize: 'clamp(2.7rem, 5.2vw, 4.4rem)',
              fontWeight: 800,
              color: '#ffffff',
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              textShadow: '0 4px 24px rgba(0,0,0,0.5)',
              margin: '0 0 18px',
              maxWidth: '780px',
            }}
          >
            Explore. Connect.<br />
            Grow in <span className="anim-gold-text anim-text-glow">THE CITY</span>
          </h1>

          {/* Subtitle with Comfortable Line Spacing */}
          <p
            className="anim-text-enter-d2"
            style={{
              color: 'rgba(255, 255, 255, 0.94)',
              fontSize: 'clamp(1rem, 1.4vw, 1.2rem)',
              lineHeight: 1.6,
              textShadow: '0 2px 10px rgba(0,0,0,0.3)',
              margin: '0 0 32px',
              maxWidth: '560px',
            }}
          >
            Step into a vibrant virtual world where businesses, people and opportunities meet.
          </p>

          {/* Large CTA Buttons */}
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
            <Link href="/city" className="home-hero-btn-primary">
              <span style={{ fontSize: '0.85rem' }}>▶</span>
              <span>Explore the City</span>
              <span className="anim-arrow-slide" style={{ fontSize: '1.1rem', marginLeft: '2px' }}>›</span>
            </Link>
            <Link href="/buy" className="home-hero-btn-secondary">
              <span style={{ fontSize: '1.1rem' }}>📍</span>
              <span>View Map</span>
            </Link>
          </div>
        </div>

        {/* Right Floating Badge attached to City Building */}
        <div className="home-hero-badge-right anim-float-slow">
          <span style={{ fontSize: '1.35rem', marginBottom: '2px' }}>🛍️</span>
          <span>Shop</span>
          <span>Learn</span>
          <span>Network</span>
        </div>

        {/* Bottom Floating Glass Feature Strip */}
        <div className="home-hero-bottom-bar anim-dock-float" style={{ position: 'relative', zIndex: 5 }}>
          <Link href="/buy" className="home-hero-bottom-item">
            <Image
              src="/images/home/pill-store.png"
              alt="Discover Businesses"
              width={34}
              height={34}
              quality={95}
              style={{ objectFit: 'contain' }}
            />
            <span>Discover<br /><strong>Businesses</strong></span>
          </Link>
          <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.25)' }} />
          <Link href="/city" className="home-hero-bottom-item">
            <Image
              src="/images/home/pill-people.png"
              alt="Meet People"
              width={34}
              height={34}
              quality={95}
              style={{ objectFit: 'contain' }}
            />
            <span>Meet<br /><strong>People</strong></span>
          </Link>
          <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.25)' }} />
          <Link href="/buy" className="home-hero-bottom-item">
            <Image
              src="/images/home/pill-rocket.png"
              alt="Explore Opportunities"
              width={34}
              height={34}
              quality={95}
              style={{ objectFit: 'contain' }}
            />
            <span>Explore<br /><strong>New Opportunities</strong></span>
          </Link>
          <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.25)' }} />
          <Link href="/about" className="home-hero-bottom-item">
            <Image
              src="/images/home/pill-globe.png"
              alt="Be Part of Community"
              width={34}
              height={34}
              quality={95}
              style={{ objectFit: 'contain' }}
            />
            <span>Be Part of a<br /><strong>Growing Community</strong></span>
          </Link>
        </div>

        {/* Smooth Curved Wave Shape Divider at the bottom of Hero */}
        <div
          style={{
            position: 'absolute',
            bottom: -1,
            left: 0,
            right: 0,
            height: '68px',
            overflow: 'hidden',
            pointerEvents: 'none',
            zIndex: 4,
          }}
        >
          <svg
            viewBox="0 0 1440 80"
            fill="none"
            preserveAspectRatio="none"
            style={{ width: '100%', height: '100%', display: 'block' }}
          >
            <path
              d="M0,0 C480,80 960,80 1440,0 L1440,80 L0,80 Z"
              fill="#ffffff"
            />
          </svg>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          2. WHY THE CITY SECTION (Spacious Whitespace & 4 Large Cards)
          ════════════════════════════════════════════════════════════ */}
      <section style={{ background: '#ffffff' }}>
        <div className="home-why-section-grid">
          {/* Left Title Column */}
          <div>
            <div className="home-pill-badge home-badge-green">
              WHY THE CITY?
            </div>
            <h2
              className="home-section-heading"
              style={{
                fontSize: 'clamp(2.1rem, 3.2vw, 2.9rem)',
                fontWeight: 800,
                color: '#202720',
                lineHeight: 1.15,
                letterSpacing: '-0.02em',
                margin: '0 0 16px',
              }}
            >
              A Smarter Way to Explore & Grow
            </h2>
            <p
              style={{
                fontSize: '1rem',
                color: '#64748b',
                lineHeight: 1.65,
                margin: '0 0 26px',
              }}
            >
              Discover a world full of possibilities — from businesses and services to events and communities, all in one immersive virtual space.
            </p>
            <Link href="/about" className="home-green-btn">
              <span>Learn More</span>
              <span className="anim-arrow-slide" style={{ fontSize: '1.1rem', marginLeft: '2px' }}>›</span>
            </Link>
          </div>

          {/* Right 4 Large Cards Grid */}
          <div className="home-why-cards-grid">
            {/* Card 1 */}
            <div className="home-why-card">
              <div
                style={{
                  width: '96px',
                  height: '90px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '10px',
                  animation: 'floatBob 4s ease-in-out infinite 0s',
                }}
              >
                <Image
                  src="/images/home/icon-store-3d.png"
                  alt="Discover Businesses"
                  width={140}
                  height={140}
                  quality={95}
                  style={{ width: '92px', height: 'auto', objectFit: 'contain' }}
                />
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#202720', margin: '0 0 6px' }}>
                Discover Businesses
              </h3>
              <p style={{ fontSize: '0.84rem', color: '#64748b', margin: 0, lineHeight: 1.45 }}>
                Explore top stores and services.
              </p>
            </div>

            {/* Card 2 */}
            <div className="home-why-card">
              <div
                style={{
                  width: '96px',
                  height: '90px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '10px',
                  animation: 'floatBob 4s ease-in-out infinite 0.7s',
                }}
              >
                <Image
                  src="/images/home/icon-people-3d.png"
                  alt="Meet People"
                  width={140}
                  height={140}
                  quality={95}
                  style={{ width: '92px', height: 'auto', objectFit: 'contain' }}
                />
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#202720', margin: '0 0 6px' }}>
                Meet People
              </h3>
              <p style={{ fontSize: '0.84rem', color: '#64748b', margin: 0, lineHeight: 1.45 }}>
                Connect with like-minded users.
              </p>
            </div>

            {/* Card 3 */}
            <div className="home-why-card">
              <div
                style={{
                  width: '96px',
                  height: '90px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '10px',
                  animation: 'floatBob 4s ease-in-out infinite 1.4s',
                }}
              >
                <Image
                  src="/images/home/icon-rocket-3d.png"
                  alt="Explore Opportunities"
                  width={140}
                  height={140}
                  quality={95}
                  style={{ width: '92px', height: 'auto', objectFit: 'contain' }}
                />
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#202720', margin: '0 0 6px' }}>
                Explore Opportunities
              </h3>
              <p style={{ fontSize: '0.84rem', color: '#64748b', margin: 0, lineHeight: 1.45 }}>
                Find new ideas and opportunities.
              </p>
            </div>

            {/* Card 4 */}
            <div className="home-why-card">
              <div
                style={{
                  width: '96px',
                  height: '90px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '10px',
                  animation: 'floatBob 4s ease-in-out infinite 2.1s',
                }}
              >
                <Image
                  src="/images/home/icon-handshake-3d.png"
                  alt="Be Part of Community"
                  width={140}
                  height={140}
                  quality={95}
                  style={{ width: '92px', height: 'auto', objectFit: 'contain' }}
                />
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#202720', margin: '0 0 6px' }}>
                Be Part of Community
              </h3>
              <p style={{ fontSize: '0.84rem', color: '#64748b', margin: 0, lineHeight: 1.45 }}>
                Join a growing community.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          3. DISCOVER THE VIBRANT CITY – Circular Cloud Portal on Scroll
          ════════════════════════════════════════════════════════════ */}
      <section className="home-discover-section" ref={discoverRef}>
        <div className="home-discover-grid">
          {/* Left Title Column */}
          <div>
            <div className="home-pill-badge home-badge-green" style={{ marginBottom: '14px' }}>
              Explore
            </div>
            <h2
              className="home-section-heading"
              style={{
                fontSize: 'clamp(2.1rem, 3.2vw, 2.9rem)',
                fontWeight: 800,
                color: '#202720',
                lineHeight: 1.15,
                letterSpacing: '-0.02em',
                margin: '0 0 16px',
              }}
            >
              Discover the Vibrant City
            </h2>
            <p
              style={{
                fontSize: '1rem',
                color: '#64748b',
                lineHeight: 1.65,
                margin: '0 0 26px',
              }}
            >
              Walk, explore and experience a dynamic city filled with shops, offices, restaurants and more.
            </p>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <Link href="/buy" className="home-green-btn">
                <span>Open City Map</span>
                <span className="anim-arrow-slide" style={{ fontSize: '1.1rem', marginLeft: '2px' }}>›</span>
              </Link>
              <button
                type="button"
                onClick={() => {
                  setIsPlaying(true);
                  setManualScrub(0);
                }}
                style={{
                  borderRadius: '999px',
                  padding: '0.65rem 1.25rem',
                  fontSize: '0.86rem',
                  fontWeight: 700,
                  border: '1.5px solid #86efac',
                  color: '#047857',
                  background: 'rgba(236, 253, 245, 0.9)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.15)',
                  transition: 'all 0.2s ease',
                }}
              >
                <span>✨</span>
                <span>{isPlaying ? 'Revealing City...' : 'Play Cloud Animation'}</span>
              </button>
            </div>
            {/* Interactive Cloud Scrub Slider */}
            <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>☁️ Clouds:</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={effectiveProgress}
                onChange={(e) => {
                  setIsPlaying(false);
                  setManualScrub(parseFloat(e.target.value));
                }}
                style={{
                  width: '130px',
                  accentColor: '#059669',
                  cursor: 'pointer',
                }}
                title="Drag to see circular cloud reveal"
              />
              <span style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 700, minWidth: '35px' }}>
                {Math.round(effectiveProgress * 100)}%
              </span>
              {manualScrub !== null && (
                <button
                  type="button"
                  onClick={() => setManualScrub(null)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    fontSize: '0.74rem',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  Auto-scroll
                </button>
              )}
            </div>
          </div>

          {/* Right Wide Prominent City Artwork with Circular Cloud Portal */}
          <div className="home-discover-card">
            {/* 3D City Illustration */}
            <Image
              src="/discover.png"
              alt="Discover the Vibrant City 3D Map"
              width={1672}
              height={941}
              priority
              style={{ width: '100%', height: 'auto', display: 'block' }}
            />

            {/* Pins appearing progressively as the circular cloud opening expands */}
            <Link
              href="/city"
              className="home-map-pin anim-radar"
              style={{
                top: '14%',
                left: '46%',
                color: '#0f766e',
                border: '1.5px solid #99f6e4',
                opacity: effectiveProgress > 0.22 ? 1 : 0,
                transform: effectiveProgress > 0.22 ? 'scale(1)' : 'scale(0.7)',
                pointerEvents: effectiveProgress > 0.22 ? 'auto' : 'none',
              }}
            >
              <span style={{ background: '#0f766e', color: '#fff', borderRadius: '6px', padding: '2px 5px', fontSize: '0.75rem' }}>📍</span>
              <span>Civic Plaza</span>
            </Link>

            <Link
              href="/buy?district=Retail"
              className="home-map-pin anim-radar"
              style={{
                top: '20%',
                left: '12%',
                color: '#7e22ce',
                border: '1.5px solid #d8b4fe',
                opacity: effectiveProgress > 0.42 ? 1 : 0,
                transform: effectiveProgress > 0.42 ? 'scale(1)' : 'scale(0.7)',
                pointerEvents: effectiveProgress > 0.42 ? 'auto' : 'none',
              }}
            >
              <span style={{ background: '#7e22ce', color: '#fff', borderRadius: '6px', padding: '2px 5px', fontSize: '0.75rem' }}>🛍️</span>
              <span>Shopping District</span>
            </Link>

            <Link
              href="/buy?district=Commercial"
              className="home-map-pin anim-radar"
              style={{
                bottom: '22%',
                left: '32%',
                color: '#c2410c',
                border: '1.5px solid #fdba74',
                opacity: effectiveProgress > 0.5 ? 1 : 0,
                transform: effectiveProgress > 0.5 ? 'scale(1)' : 'scale(0.7)',
                pointerEvents: effectiveProgress > 0.5 ? 'auto' : 'none',
              }}
            >
              <span style={{ background: '#ea580c', color: '#fff', borderRadius: '6px', padding: '2px 5px', fontSize: '0.75rem' }}>🍴</span>
              <span>Food Zone</span>
            </Link>

            <Link
              href="/buy?district=Financial"
              className="home-map-pin anim-radar"
              style={{
                top: '18%',
                right: '10%',
                color: '#1d4ed8',
                border: '1.5px solid #bfdbfe',
                opacity: effectiveProgress > 0.62 ? 1 : 0,
                transform: effectiveProgress > 0.62 ? 'scale(1)' : 'scale(0.7)',
                pointerEvents: effectiveProgress > 0.62 ? 'auto' : 'none',
              }}
            >
              <span style={{ background: '#2563eb', color: '#fff', borderRadius: '6px', padding: '2px 5px', fontSize: '0.75rem' }}>🏢</span>
              <span>Business Hub</span>
            </Link>

            <Link
              href="/buy?district=Innovation"
              className="home-map-pin anim-radar"
              style={{
                bottom: '22%',
                right: '14%',
                color: '#4338ca',
                border: '1.5px solid #c7d2fe',
                opacity: effectiveProgress > 0.68 ? 1 : 0,
                transform: effectiveProgress > 0.68 ? 'scale(1)' : 'scale(0.7)',
                pointerEvents: effectiveProgress > 0.68 ? 'auto' : 'none',
              }}
            >
              <span style={{ background: '#4f46e5', color: '#fff', borderRadius: '6px', padding: '2px 5px', fontSize: '0.75rem' }}>🎮</span>
              <span>Entertainment</span>
            </Link>

            {/* ══════════════════════════════════════════════════════════
                CIRCULAR CLOUD REVEAL (Moves outward from center in a circle)
                ══════════════════════════════════════════════════════════ */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                pointerEvents: 'none',
                zIndex: 10,
                overflow: 'hidden',
                opacity: Math.max(0, 1 - (effectiveProgress - 0.78) * 4.5),
                transition: 'opacity 0.2s ease-out',
              }}
            >
              <svg
                viewBox="0 0 1000 600"
                preserveAspectRatio="none"
                style={{ width: '100%', height: '100%', display: 'block' }}
              >
                <defs>
                  {/* Sun Lens Flare Gradient */}
                  <radialGradient id="sunFlare" cx="12%" cy="12%" r="65%">
                    <stop offset="0%" stopColor="#fffbeb" stopOpacity="0.95" />
                    <stop offset="15%" stopColor="#fef08a" stopOpacity="0.75" />
                    <stop offset="40%" stopColor="#93c5fd" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#93c5fd" stopOpacity="0" />
                  </radialGradient>

                  {/* Soft Feather Filter for Circular Mask */}
                  <filter id="maskFeather" x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur stdDeviation="32" />
                  </filter>

                  {/* Soft Gaussian Blur for Cloud Puff Edges */}
                  <filter id="cloudSoft" x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur stdDeviation="16" />
                  </filter>

                  {/* Circular Mask: Expanding circular hole centered at Civic Plaza (510, 325) */}
                  <mask id="cloudCircularHole">
                    <rect width="1000" height="600" fill="#ffffff" />
                    <circle
                      cx="510"
                      cy="325"
                      r={Math.max(0, effectiveProgress * 750)}
                      fill="#000000"
                      filter="url(#maskFeather)"
                    />
                  </mask>
                </defs>

                {/* 1. Main Base Cloud Blanket (clipped by the expanding circular mask) */}
                <g mask="url(#cloudCircularHole)">
                  {/* Sky tone under clouds */}
                  <rect width="1000" height="600" fill="#dbeeff" opacity="0.92" />

                  {/* Thick cumulus cloud field */}
                  <ellipse cx="200" cy="220" rx="320" ry="200" fill="#ffffff" filter="url(#cloudSoft)" />
                  <ellipse cx="200" cy="220" rx="280" ry="170" fill="#f8faff" />
                  <ellipse cx="500" cy="180" rx="360" ry="190" fill="#ffffff" filter="url(#cloudSoft)" />
                  <ellipse cx="500" cy="180" rx="320" ry="160" fill="#f0f6ff" />
                  <ellipse cx="800" cy="230" rx="340" ry="210" fill="#ffffff" filter="url(#cloudSoft)" />
                  <ellipse cx="800" cy="230" rx="300" ry="180" fill="#f8faff" />
                  <ellipse cx="350" cy="420" rx="360" ry="210" fill="#ffffff" filter="url(#cloudSoft)" />
                  <ellipse cx="350" cy="420" rx="320" ry="180" fill="#f0f6ff" />
                  <ellipse cx="720" cy="430" rx="380" ry="220" fill="#ffffff" filter="url(#cloudSoft)" />
                  <ellipse cx="720" cy="430" rx="340" ry="190" fill="#f8faff" />
                  <ellipse cx="510" cy="325" rx="320" ry="190" fill="#ffffff" filter="url(#cloudSoft)" />

                  {/* Bright morning sun flare at top left (matches user's reference image!) */}
                  <rect width="1000" height="600" fill="url(#sunFlare)" />
                  <g className="anim-sun-pulse">
                    <circle cx="120" cy="70" r="60" fill="#ffffff" opacity="0.95" filter="url(#cloudSoft)" />
                    <circle cx="120" cy="70" r="30" fill="#fef9c3" opacity="1" />
                  </g>
                </g>

                {/* 2. Billowing Cloud Puffs Moving Radially Outward in a Circle */}
                {/* 8 cloud clusters pushed outward away from center (510, 325) */}
                {[
                  { deg: 0, rMult: 1.0, rx: 110, ry: 70 },
                  { deg: 45, rMult: 0.95, rx: 125, ry: 80 },
                  { deg: 90, rMult: 0.85, rx: 135, ry: 85 },
                  { deg: 135, rMult: 0.95, rx: 120, ry: 75 },
                  { deg: 180, rMult: 1.0, rx: 110, ry: 70 },
                  { deg: 225, rMult: 0.95, rx: 125, ry: 80 },
                  { deg: 270, rMult: 0.85, rx: 135, ry: 85 },
                  { deg: 315, rMult: 0.95, rx: 120, ry: 75 },
                ].map((puff, idx) => {
                  const rad = (puff.deg * Math.PI) / 180;
                  const currentDist = (effectiveProgress * 620 + 20) * puff.rMult;
                  const cx = 510 + Math.cos(rad) * currentDist;
                  const cy = 325 + Math.sin(rad) * currentDist * 0.72;
                  const scale = 1 + effectiveProgress * 0.35;
                  const puffOpacity = Math.max(0, 0.92 - effectiveProgress * 0.9);

                  return (
                    <g key={idx} opacity={puffOpacity}>
                      <ellipse
                        cx={cx}
                        cy={cy}
                        rx={puff.rx * scale}
                        ry={puff.ry * scale}
                        fill="#ffffff"
                        filter="url(#cloudSoft)"
                      />
                      <ellipse
                        cx={cx}
                        cy={cy}
                        rx={puff.rx * scale * 0.88}
                        ry={puff.ry * scale * 0.88}
                        fill="#f4f9ff"
                      />
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          4. VISIT OUR MARKETPLACES (5 Large Cards in One Row)
          ════════════════════════════════════════════════════════════ */}
      <section style={{ background: '#ffffff' }}>
        <div className="home-section-grid">
          {/* Left Title Column */}
          <div>
            <div className="home-pill-badge home-badge-green">
              Our Marketplaces
            </div>
            <h2
              className="home-section-heading"
              style={{
                fontSize: 'clamp(2.1rem, 3.2vw, 2.9rem)',
                fontWeight: 800,
                color: '#202720',
                lineHeight: 1.15,
                letterSpacing: '-0.02em',
                margin: '0 0 16px',
              }}
            >
              Visit Our Marketplaces
            </h2>
            <p
              style={{
                fontSize: '1rem',
                color: '#64748b',
                lineHeight: 1.65,
                margin: '0 0 26px',
              }}
            >
              Explore and grow with the best markets for modern technology and services.
            </p>
            <Link href="/buy" className="home-green-btn">
              <span>Explore All Markets</span>
              <span className="anim-arrow-slide" style={{ fontSize: '1.1rem', marginLeft: '2px' }}>›</span>
            </Link>
          </div>

          {/* Right 5 Large Marketplace Cards */}
          <div className="home-market-cards-grid">
            {/* Market 1 */}
            <Link href="/buy" className="home-market-card">
              <div className="home-market-illustration-wrap">
                <Image
                  src="/images/home/market-saas.png"
                  alt="SaaS Market"
                  width={140}
                  height={140}
                  quality={95}
                  style={{ width: '92px', height: 'auto', objectFit: 'contain' }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '6px' }}>
                <span style={{ fontSize: '0.94rem', fontWeight: 800, color: '#202720', lineHeight: 1.25 }}>
                  SaaS<br />Market
                </span>
                <span className="home-market-arrow">→</span>
              </div>
            </Link>

            {/* Market 2 */}
            <Link href="/buy" className="home-market-card">
              <div className="home-market-illustration-wrap">
                <Image
                  src="/images/home/market-web.png"
                  alt="Web Development"
                  width={140}
                  height={140}
                  quality={95}
                  style={{ width: '92px', height: 'auto', objectFit: 'contain' }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '6px' }}>
                <span style={{ fontSize: '0.94rem', fontWeight: 800, color: '#202720', lineHeight: 1.25 }}>
                  Web<br />Development
                </span>
                <span className="home-market-arrow">→</span>
              </div>
            </Link>

            {/* Market 3 */}
            <Link href="/buy" className="home-market-card">
              <div className="home-market-illustration-wrap">
                <Image
                  src="/images/home/market-ai.png"
                  alt="AI"
                  width={140}
                  height={140}
                  quality={95}
                  style={{ width: '92px', height: 'auto', objectFit: 'contain' }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '6px' }}>
                <span style={{ fontSize: '0.94rem', fontWeight: 800, color: '#202720', lineHeight: 1.25 }}>
                  AI
                </span>
                <span className="home-market-arrow">→</span>
              </div>
            </Link>

            {/* Market 4 */}
            <Link href="/buy" className="home-market-card">
              <div className="home-market-illustration-wrap">
                <Image
                  src="/images/home/market-mobile.png"
                  alt="Mobile App"
                  width={140}
                  height={140}
                  quality={95}
                  style={{ width: '92px', height: 'auto', objectFit: 'contain' }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '6px' }}>
                <span style={{ fontSize: '0.94rem', fontWeight: 800, color: '#202720', lineHeight: 1.25 }}>
                  Mobile<br />App
                </span>
                <span className="home-market-arrow">→</span>
              </div>
            </Link>

            {/* Market 5 */}
            <Link href="/buy" className="home-market-card">
              <div className="home-market-illustration-wrap">
                <Image
                  src="/images/home/market-windows.png"
                  alt="Windows App"
                  width={140}
                  height={140}
                  quality={95}
                  style={{ width: '92px', height: 'auto', objectFit: 'contain' }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '6px' }}>
                <span style={{ fontSize: '0.94rem', fontWeight: 800, color: '#202720', lineHeight: 1.25 }}>
                  Windows<br />App
                </span>
                <span className="home-market-arrow">→</span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          5. COMMUNITY BANNER & FREE BUILDING PROMOTIONAL CARD
          ════════════════════════════════════════════════════════════ */}
      <section style={{ background: '#F8FAF8' }}>
        <div className="home-community-grid">
          {/* Left Community Banner (Wide & Impactful) */}
          <div className="home-community-banner">
            <div style={{ zIndex: 2, maxWidth: '480px' }}>
              <div className="home-pill-badge home-badge-glass" style={{ marginBottom: '16px' }}>
                Join the Movement
              </div>
              <h2
                style={{
                  fontSize: 'clamp(1.9rem, 2.9vw, 2.5rem)',
                  fontWeight: 800,
                  color: '#ffffff',
                  lineHeight: 1.15,
                  margin: '0 0 14px',
                  letterSpacing: '-0.02em',
                }}
              >
                Be Part of a Growing Community
              </h2>
              <p style={{ fontSize: '1.05rem', color: 'rgba(255, 255, 255, 0.94)', margin: 0, lineHeight: 1.55 }}>
                Connect, collaborate and grow with people across the world.
              </p>
            </div>

            {/* Complete 3D Avatars Artwork */}
            <div
              className="anim-avatars-float"
              style={{
                position: 'relative',
                width: 'clamp(240px, 34vw, 380px)',
                height: '190px',
                flexShrink: 0,
                alignSelf: 'flex-end',
              }}
            >
              <Image
                src="/images/home/community-avatars.png"
                alt="Community Members"
                fill
                style={{ objectFit: 'contain', objectPosition: 'bottom right' }}
              />
            </div>
          </div>

          {/* Right Free Building Promotional Card */}
          <div className="home-gift-card" style={{ position: 'relative', overflow: 'hidden' }}>
            {/* Playful Floating Sparkles */}
            <span className="anim-sparkle" style={{ top: '14px', left: '18px', fontSize: '1.2rem', pointerEvents: 'none' }}>✨</span>
            <span className="anim-sparkle" style={{ top: '20px', right: '22px', fontSize: '0.95rem', animationDelay: '1s', pointerEvents: 'none' }}>⭐</span>
            <span className="anim-sparkle" style={{ bottom: '24px', left: '26px', fontSize: '0.85rem', animationDelay: '1.5s', pointerEvents: 'none' }}>✨</span>

            {/* 3D Gift Box Ribbon */}
            <div className="anim-gift" style={{ position: 'relative', width: '84px', height: '84px', margin: '0 auto 6px' }}>
              <Image
                src="/images/home/gift-icon.png"
                alt="Free Building Gift"
                fill
                quality={95}
                style={{ objectFit: 'contain' }}
              />
            </div>
            <h3 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#202720', margin: '0 0 6px', lineHeight: 1.2 }}>
              Get Free<br />Building Now!
            </h3>
            <p style={{ fontSize: '0.88rem', color: '#64748b', margin: '0 0 18px', lineHeight: 1.5, maxWidth: '240px' }}>
              Claim your own building and start your journey.
            </p>
            <Link href="/buy" className="home-green-btn anim-pulse-glow" style={{ padding: '12px 34px', fontSize: '0.94rem' }}>
              <span>Claim Now</span>
              <span style={{ fontSize: '1.1rem', marginLeft: '4px' }}>›</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          6. PRE-FOOTER READY TO EXPLORE CAPSULE BANNER
          ════════════════════════════════════════════════════════════ */}
      <section style={{ background: '#F8FAF8', padding: '0 clamp(24px, 4vw, 56px) 44px' }}>
        <div className="home-prefooter-capsule">
          {/* Brand Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #07583E 0%, #10b981 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontWeight: 900,
                fontSize: '1.25rem',
                boxShadow: '0 2px 8px rgba(7, 88, 62, 0.25)',
              }}
            >
              C
            </div>
            <span style={{ fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.02em', color: '#202720' }}>
              THE CITY
            </span>
          </div>

          {/* Text Center */}
          <div style={{ textAlign: 'center' }}>
            <h3 className="home-section-heading" style={{ fontSize: '1.2rem', fontWeight: 800, color: '#202720', margin: '0 0 4px' }}>
              Ready to Explore THE CITY?
            </h3>
            <p style={{ fontSize: '0.9rem', color: '#64748b', margin: 0 }}>
              Step in, connect and be part of something bigger.
            </p>
          </div>

          {/* Action Button */}
          <Link href="/city" className="home-green-btn">
            <span>Start Exploring</span>
            <span className="anim-arrow-slide" style={{ fontSize: '1.1rem', marginLeft: '2px' }}>›</span>
          </Link>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          7. FOOTER (Spacious Breathing Room & Visual Continuity)
          ════════════════════════════════════════════════════════════ */}
      <footer
        style={{
          background: 'linear-gradient(180deg, #F8FAF8 0%, #eef7f0 100%)',
          borderTop: '1px solid #e2e8f0',
          padding: '48px clamp(24px, 4vw, 56px) 36px',
        }}
      >
        <div style={{ maxWidth: '1500px', margin: '0 auto' }}>
          {/* Top Row: Links & Social Icons */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '24px',
              paddingBottom: '26px',
              borderBottom: '1px solid rgba(226, 232, 240, 0.9)',
            }}
          >
            {/* Links */}
            <div style={{ display: 'flex', gap: '28px', flexWrap: 'wrap' }}>
              <Link href="/" style={{ fontSize: '0.92rem', fontWeight: 700, color: '#07583E', textDecoration: 'none' }}>
                Home
              </Link>
              <Link href="/city" style={{ fontSize: '0.92rem', fontWeight: 600, color: '#475569', textDecoration: 'none' }}>
                Explore
              </Link>
              <Link href="/buy" style={{ fontSize: '0.92rem', fontWeight: 600, color: '#475569', textDecoration: 'none' }}>
                Markets
              </Link>
              <Link href="/about" style={{ fontSize: '0.92rem', fontWeight: 600, color: '#475569', textDecoration: 'none' }}>
                About
              </Link>
              <Link href="/faq" style={{ fontSize: '0.92rem', fontWeight: 600, color: '#475569', textDecoration: 'none' }}>
                FAQ
              </Link>
            </div>

            {/* Social Icons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '18px', color: '#64748b' }}>
              <a href="https://discord.com" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }} title="Discord">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" /></svg>
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }} title="YouTube">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }} title="X">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }} title="LinkedIn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>
              </a>
              <a href="https://thecity.app" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }} title="Web">
                <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
              </a>
            </div>
          </div>

          {/* Bottom Row */}
          <div
            style={{
              paddingTop: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
              fontSize: '0.85rem',
              color: '#94a3b8',
            }}
          >
            <span>© 2026 THE CITY. All rights reserved.</span>
            <span style={{ fontWeight: 700, color: '#07583E' }}>Explore • Connect • Grow</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
