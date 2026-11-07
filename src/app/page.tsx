'use client';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import Nav from '@/components/Nav';
import HUD from '@/components/HUD';
import { useStores } from '@/components/useStores';
import { landing } from '@/lib/state';

const CityCanvas = dynamic(() => import('@/components/CityCanvas'), { ssr: false });

export default function Home() {
  const { stores, layout } = useStores();

  // How far the user has scrolled through the hero (0 → 1)
  const [scrollP, setScrollP] = useState(0);
  // Once scrollP hits 1, we lock into full city mode
  const [cityMode, setCityMode] = useState(false);
  // Fade-in the city canvas after switching
  const [cityVisible, setCityVisible] = useState(false);

  const heroRef = useRef<HTMLElement>(null);
  const entered  = useRef(false);

  useEffect(() => {
    const onScroll = () => {
      const el = heroRef.current;
      if (!el || cityMode) return;
      const r = el.getBoundingClientRect();
      const h = r.height - window.innerHeight;
      const p = h > 0 ? Math.min(1, Math.max(0, -r.top / h)) : 0;
      landing.p = p;
      setScrollP(p);

      // When completely scrolled — enter city
      if (p >= 0.995 && !entered.current) {
        entered.current = true;
        setTimeout(() => {
          setCityMode(true);
          requestAnimationFrame(() => setCityVisible(true));
        }, 220);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [cityMode]);

  const copyAlpha = Math.max(0, 1 - scrollP * 2.8);
  const tagAlpha  = Math.max(0, Math.min(1, scrollP * 3 - 0.2) * (1 - scrollP * 2));
  const cueAlpha  = Math.max(0, 1 - scrollP * 6);

  return (
    <>
      {!cityMode && <Nav overlay />}

      {/* Persistent Single 3D City Canvas Instance */}
      <div
        className={cityMode ? 'fullscreen' : ''}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: cityMode ? 50 : 0,
          opacity: !cityMode || cityVisible ? 1 : 0,
          transition: 'opacity 0.6s ease',
          pointerEvents: 'auto',
        }}
      >
        <CityCanvas stores={stores} layout={layout} mode={cityMode ? 'city' : 'landing'} paused={false} />
        {cityMode && <HUD stores={stores} layout={layout} />}
      </div>

      {!cityMode && (
        <section
          ref={heroRef}
          style={{ position: 'relative', height: '240vh', pointerEvents: 'none', zIndex: 10 }}
        >
          {/* Sticky full-viewport landing copy & fog */}
          <div style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'hidden' }}>
            {/* Subtle soft white & green atmosphere fog gradient */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                pointerEvents: 'none',
                background: `linear-gradient(
                  100deg,
                  rgba(240, 248, 242, ${0.92 - scrollP * 0.7}) 0%,
                  rgba(240, 248, 242, ${0.55 - scrollP * 0.5}) 36%,
                  rgba(240, 248, 242, 0) 65%
                ),
                linear-gradient(
                  0deg,
                  rgba(235, 246, 238, ${Math.max(0, 0.85 - scrollP * 0.85)}) 0%,
                  rgba(235, 246, 238, 0) 28%
                )`,
              }}
            />

            {/* ── Left Hero copy exactly styled like the reference ── */}
            <div
              style={{
                position: 'absolute',
                left: 'clamp(1.5rem, 6vw, 6.5rem)',
                top: '46%',
                transform: 'translateY(-50%)',
                maxWidth: 620,
                zIndex: 2,
                opacity: copyAlpha,
                transition: 'opacity 0.1s linear',
                pointerEvents: copyAlpha < 0.05 ? 'none' : 'auto',
              }}
            >
              {/* Green Pill Badge */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: 'rgba(232, 245, 233, 0.92)',
                  border: '1px solid rgba(46, 125, 50, 0.25)',
                  padding: '0.45rem 1.1rem',
                  borderRadius: '999px',
                  marginBottom: '1.4rem',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                }}
              >
                <span style={{ fontSize: '1rem' }}>🍃</span>
                <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#1b4d2e' }}>
                  Open World City Experience
                </span>
              </div>

              {/* Bold Headline with Green Accent Word */}
              <h1
                style={{
                  fontSize: 'clamp(2.8rem, 5.8vw, 4.8rem)',
                  fontWeight: 800,
                  margin: '0 0 1.2rem',
                  lineHeight: 1.05,
                  letterSpacing: '-0.03em',
                  color: '#0d1f14',
                }}
              >
                Build. Explore.<br />
                <span style={{ color: '#2e7d32' }}>Live</span> Your City.
              </h1>

              {/* Subtitle / Lead Paragraph */}
              <p
                style={{
                  fontSize: 'clamp(1.05rem, 1.4vw, 1.22rem)',
                  color: '#3d5245',
                  maxWidth: '48ch',
                  margin: '0 0 2.2rem',
                  lineHeight: 1.6,
                  fontWeight: 450,
                }}
              >
                Create your dream city, explore every street, and experience a living, breathing world.
              </p>

              {/* CTA Button */}
              <Link
                href="/city"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  background: '#0d2d1a',
                  color: '#ffffff',
                  padding: '0.95rem 2rem',
                  borderRadius: '999px',
                  fontSize: '1.02rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                  boxShadow: '0 6px 20px rgba(13, 45, 26, 0.3)',
                  transition: 'transform 0.15s ease',
                }}
              >
                <span>Start Playing</span>
                <span style={{ fontSize: '1.15rem' }}>→</span>
              </Link>
            </div>

            {/* ── Scroll cue on bottom-left ── */}
            <div
              style={{
                position: 'absolute',
                left: 'clamp(1.5rem, 6vw, 6.5rem)',
                bottom: '2.8rem',
                zIndex: 3,
                opacity: cueAlpha,
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                color: '#2d4734',
                fontSize: '0.85rem',
                fontWeight: 600,
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  border: '1px solid rgba(45, 71, 52, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.9rem',
                }}
              >
                ↓
              </div>
              <span>Scroll to explore</span>
            </div>

            {/* ── Mid-scroll landmark pill ── */}
            <Link
              href="/city?store=J01"
              style={{
                position: 'absolute',
                right: 'clamp(1rem,4vw,3rem)',
                bottom: 'clamp(5rem,12vh,8rem)',
                zIndex: 2,
                opacity: tagAlpha,
                transition: 'opacity 0.15s linear',
                pointerEvents: tagAlpha < 0.05 ? 'none' : 'auto',
                background: 'rgba(255, 255, 255, 0.92)',
                backdropFilter: 'blur(14px)',
                border: '1px solid rgba(46, 125, 50, 0.25)',
                borderRadius: '16px',
                padding: '0.9rem 1.3rem',
                fontSize: '0.85rem',
                maxWidth: 280,
                textDecoration: 'none',
                color: '#0d2d1a',
                boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
              }}
            >
              <span style={{ color: '#2e7d32', display: 'block', fontWeight: 600 }}>Landmark</span>
              <b style={{ display: 'block', font: '700 1.05rem var(--f-display)', margin: '0.1rem 0' }}>J Enterprise</b>
              <span style={{ color: '#4b5563', fontSize: '0.8rem' }}>Flagship headquarters · visit in 3D →</span>
            </Link>

            {/* ── Entering city prompt — appears near the end of scroll ── */}
            {scrollP > 0.7 && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '2.5rem',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  zIndex: 5,
                  opacity: Math.min(1, (scrollP - 0.7) * 4),
                  transition: 'opacity 0.2s',
                  background: 'rgba(13, 45, 26, 0.92)',
                  backdropFilter: 'blur(14px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '999px',
                  padding: '0.7rem 1.8rem',
                  color: '#fff',
                  fontSize: '0.92rem',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  gap: '0.7rem',
                  alignItems: 'center',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
                }}
              >
                <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#4ade80', animation: 'pulse 1.4s ease-in-out infinite' }} />
                Keep scrolling to enter the city…
              </div>
            )}
          </div>
        </section>
      )}

      {/* Pulse keyframe */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.4; transform: scale(1.5); }
        }
        body.city-mode { overflow: hidden; }
      `}</style>
    </>
  );
}
