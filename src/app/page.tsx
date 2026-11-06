'use client';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import Nav from '@/components/Nav';
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
        // Short delay so the camera reaches street level first
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

  // Copy visibility: fade out as you scroll down (gone by 60% scroll)
  const copyAlpha = Math.max(0, 1 - scrollP * 2.5);
  // Tag visibility: fade in mid-scroll, fade out at the end
  const tagAlpha  = Math.max(0, Math.min(1, scrollP * 3 - 0.2) * (1 - scrollP * 2));
  // Scroll cue fades quickly
  const cueAlpha  = Math.max(0, 1 - scrollP * 8);

  // Bottom gradient: intensifies as you approach the city
  const shadeBot = Math.round(scrollP * 100);

  return (
    <>
      {/* Nav stays fixed on top; in city mode it goes floating */}
      <Nav overlay />

      {!cityMode ? (
        /* ═══════════════════════════════════════════════════════════════
           SCROLL SECTION — 240 vh so there is plenty of room to scroll
           The 3D canvas is pinned (sticky) at the top.
        ═══════════════════════════════════════════════════════════════ */
        <section
          ref={heroRef}
          style={{ position: 'relative', height: '240vh' }}
        >
          {/* Sticky full-viewport 3D canvas */}
          <div style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'hidden' }}>
            {/* 3D World */}
            <div style={{ position: 'absolute', inset: 0 }}>
              <CityCanvas stores={stores} layout={layout} mode="landing" paused={false} />
            </div>

            {/* Bottom gradient — deepens as city approaches */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                pointerEvents: 'none',
                background: `linear-gradient(
                  90deg,
                  rgba(5,11,26,${0.88 - scrollP * 0.6}) 0%,
                  rgba(5,11,26,${0.4 - scrollP * 0.35}) 42%,
                  rgba(5,11,26,0) 72%
                ),
                linear-gradient(
                  0deg,
                  rgba(8,18,38,1) 0%,
                  rgba(8,18,38,${Math.max(0, 0.25 - scrollP * 0.25)}) ${20 + shadeBot}%
                )`,
              }}
            />

            {/* ── Hero copy — fades out as you scroll ── */}
            <div
              style={{
                position: 'absolute',
                left: 'clamp(1.2rem,6vw,6rem)',
                top: '50%',
                transform: 'translateY(-52%)',
                maxWidth: 600,
                zIndex: 2,
                opacity: copyAlpha,
                transition: 'opacity 0.1s linear',
                pointerEvents: copyAlpha < 0.05 ? 'none' : 'auto',
              }}
            >
              <span className="eyebrow">THE CITY · Virtual business marketplace</span>
              <h1 style={{ fontSize: 'clamp(2.4rem,6vw,4.6rem)', fontWeight: 700, margin: '0 0 1.1rem', lineHeight: 1.06, letterSpacing: '-0.02em' }}>
                Your Business Deserves a <em style={{ fontStyle: 'normal', color: 'var(--cyan)' }}>Place</em> in the City.
              </h1>
              <p style={{ fontSize: 'clamp(1rem,1.5vw,1.18rem)', color: '#c6d3ee', maxWidth: '50ch', margin: '0 0 2rem', lineHeight: 1.55 }}>
                Claim a plot, build a storefront and let visitors walk right up to your door.
                THE CITY turns business discovery into a place you can explore.
              </p>
              <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
                <Link className="btn lg" href="/buy">Claim Your Plot</Link>
                <Link className="btn lg outline" href="/city">Explore the City</Link>
              </div>
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
                background: 'var(--panel)',
                backdropFilter: 'blur(14px)',
                border: '1px solid var(--line)',
                borderRadius: 'var(--r)',
                padding: '0.9rem 1.2rem',
                fontSize: '0.85rem',
                maxWidth: 280,
                textDecoration: 'none',
                color: 'inherit',
              }}
            >
              <span style={{ color: 'var(--muted)', display: 'block' }}>Landmark</span>
              <b style={{ display: 'block', font: '600 1.02rem var(--f-display)' }}>J Enterprise</b>
              <span style={{ color: 'var(--muted)' }}>Flagship headquarters · visit in 3D →</span>
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
                  background: 'rgba(5,11,26,0.78)',
                  backdropFilter: 'blur(14px)',
                  border: '1px solid rgba(34,211,238,0.5)',
                  borderRadius: '999px',
                  padding: '0.6rem 1.6rem',
                  color: '#fff',
                  fontSize: '0.9rem',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  gap: '0.7rem',
                  alignItems: 'center',
                }}
              >
                <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: 'var(--cyan)', animation: 'pulse 1.4s ease-in-out infinite' }} />
                Keep scrolling to enter the city…
              </div>
            )}

            {/* ── Scroll cue (arrow) ── */}
            <div
              className="scroll-cue"
              style={{ opacity: cueAlpha, transition: 'opacity 0.3s' }}
            >
              <span>Scroll</span>
              <i />
            </div>
          </div>
        </section>
      ) : (
        /* ═══════════════════════════════════════════════════════════════
           CITY MODE — full-screen immersive world, no text, no footer
        ═══════════════════════════════════════════════════════════════ */
        <div
          className="fullscreen"
          style={{
            opacity: cityVisible ? 1 : 0,
            transition: 'opacity 0.6s ease',
          }}
        >
          <CityCanvas stores={stores} layout={layout} mode="city" />
        </div>
      )}

      {/* Pulse keyframe injected once */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.4; transform: scale(1.5); }
        }
        /* Hide scrollbar in city mode */
        body.city-mode { overflow: hidden; }
      `}</style>
    </>
  );
}
