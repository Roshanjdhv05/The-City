'use client';
import React, { useState, useEffect, useRef } from 'react';

const LOADING_TIPS = [
  'Explore the city and discover new places.',
  'Discover buildings and claim your own space.',
  'Explore different districts across the metropolis.',
  'Meet businesses and innovators in the market.',
  'Find hidden discoveries and collect resources.',
  'Visit the central district to explore the iconic J Enterprise tower.',
];

const STAGE_MESSAGES = [
  { at: 0, text: 'Preparing your world...' },
  { at: 20, text: 'Loading environment...' },
  { at: 42, text: 'Rendering buildings...' },
  { at: 65, text: 'Preparing roads and surroundings...' },
  { at: 80, text: 'Loading textures and materials...' },
  { at: 92, text: 'Initializing world interactions...' },
  { at: 99, text: 'Finalizing city...' },
];

interface WorldLoadingScreenProps {
  isReady?: boolean;
  onFinish?: () => void;
}

export function WorldLoadingScreen({ isReady = false, onFinish }: WorldLoadingScreenProps) {
  const [progress, setProgress] = useState(12);
  const [tipIndex, setTipIndex] = useState(0);
  const [tipFade, setTipFade] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [hidden, setHidden] = useState(false);

  // 1. Tip rotation every 5.5 seconds with smooth fade transition
  useEffect(() => {
    const interval = setInterval(() => {
      setTipFade(false);
      setTimeout(() => {
        setTipIndex(i => (i + 1) % LOADING_TIPS.length);
        setTipFade(true);
      }, 400);
    }, 5500);
    return () => clearInterval(interval);
  }, []);

  // 2. Realistic loading progress tracking
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    if (isReady) {
      const elapsed = Date.now() - startTimeRef.current;
      const minDisplay = 1400; // Ensure at least 1.4s so user gets smooth cinematic loading
      const delay = Math.max(0, minDisplay - elapsed);

      const readyTimer = setTimeout(() => {
        setProgress(100);
        const timer = setTimeout(() => {
          setFadeOut(true);
          setTimeout(() => {
            setHidden(true);
            onFinish?.();
          }, 650);
        }, 400);
      }, delay);

      return () => clearTimeout(readyTimer);
    }

    // Natural progressive advance while world initializes
    const stepInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 94) return prev; // Hold at 94% until building assets and 3D frames are rendered
        // Slower as it nears completion
        const inc = prev < 50 ? Math.random() * 9 + 4 : Math.random() * 4 + 1.5;
        return Math.min(94, Math.round(prev + inc));
      });
    }, 280);

    return () => clearInterval(stepInterval);
  }, [isReady, onFinish]);

  if (hidden) return null;

  // Determine stage message
  let activeMessage = STAGE_MESSAGES[0].text;
  for (let i = STAGE_MESSAGES.length - 1; i >= 0; i--) {
    if (progress >= STAGE_MESSAGES[i].at) {
      activeMessage = STAGE_MESSAGES[i].text;
      break;
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        opacity: fadeOut ? 0 : 1,
        transition: 'opacity 0.65s cubic-bezier(0.4, 0, 0.2, 1)',
        pointerEvents: fadeOut ? 'none' : 'auto',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* ── Background: Blurred J Enterprise City Screenshot ── */}
      <div
        style={{
          position: 'absolute',
          inset: -30, // Negative inset prevents blur edge vignette
          backgroundImage: 'url(/city-loading-bg.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center 45%',
          backgroundRepeat: 'no-repeat',
          filter: 'blur(16px) brightness(0.62) saturate(0.85)',
          transform: 'scale(1.05)',
        }}
      />

      {/* ── Dark Cinematic Atmosphere Overlay ── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(circle at center 45%, rgba(15, 23, 42, 0.45) 0%, rgba(10, 15, 30, 0.78) 100%)',
        }}
      />

      {/* ── Main Loading Card / Central Content ── */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          maxWidth: '90vw',
          transform: 'translateY(-24px)',
        }}
      >
        {/* ── Centered Rotating Globe Animation ── */}
        <div
          style={{
            position: 'relative',
            width: 130,
            height: 130,
            marginBottom: 16,
            filter: 'drop-shadow(0 0 16px rgba(255, 255, 255, 0.45))',
          }}
        >
          <svg
            viewBox="0 0 160 160"
            width="130"
            height="130"
            style={{ overflow: 'visible' }}
          >
            <defs>
              <clipPath id="globe-mask">
                <circle cx="80" cy="80" r="42" />
              </clipPath>
              {/* Radial gradient on globe sphere */}
              <radialGradient id="globe-glow" cx="40%" cy="35%" r="65%">
                <stop offset="0%" stopColor="rgba(255, 255, 255, 0.18)" />
                <stop offset="60%" stopColor="rgba(15, 23, 42, 0.75)" />
                <stop offset="100%" stopColor="rgba(8, 14, 26, 0.95)" />
              </radialGradient>
            </defs>

            {/* Back half of orbital ring (passing behind the globe) */}
            <path
              d="M 16 68 A 76 22 -18 0 1 144 92"
              fill="none"
              stroke="rgba(255, 255, 255, 0.65)"
              strokeWidth="2.4"
              strokeDasharray="4 0"
            />

            {/* Globe Sphere Background */}
            <circle cx="80" cy="80" r="42" fill="url(#globe-glow)" />

            {/* Rotating Continents Silhouette Group */}
            <g clipPath="url(#globe-mask)">
              <g className="loading-globe-continents">
                {/* 1st copy of Earth continents */}
                <path
                  d="
                    M 52 56 Q 60 52 68 56 Q 74 62 70 70 Q 64 74 58 72 Z
                    M 56 74 Q 66 76 64 88 Q 60 98 54 100 Q 50 92 52 82 Z
                    M 74 50 Q 82 46 88 52 Q 86 58 80 60 Z
                    M 82 62 Q 92 60 98 68 Q 96 82 86 86 Q 78 80 80 68 Z
                    M 96 52 Q 108 48 116 56 Q 112 70 102 72 Q 94 64 96 52 Z
                    M 108 82 Q 118 80 120 88 Q 114 94 106 90 Z
                  "
                  fill="#ffffff"
                  fillOpacity="0.95"
                />
                {/* 2nd duplicated copy for seamless infinite horizontal scroll loop */}
                <path
                  d="
                    M 132 56 Q 140 52 148 56 Q 154 62 150 70 Q 144 74 138 72 Z
                    M 136 74 Q 146 76 144 88 Q 140 98 134 100 Q 130 92 132 82 Z
                    M 154 50 Q 162 46 168 52 Q 166 58 160 60 Z
                    M 162 62 Q 172 60 178 68 Q 176 82 166 86 Q 158 80 160 68 Z
                    M 176 52 Q 188 48 196 56 Q 192 70 182 72 Q 174 64 176 52 Z
                    M 188 82 Q 198 80 200 88 Q 194 94 186 90 Z
                  "
                  fill="#ffffff"
                  fillOpacity="0.95"
                />
                {/* 3rd copy for left wrap */}
                <path
                  d="
                    M -28 56 Q -20 52 -12 56 Q -6 62 -10 70 Q -16 74 -22 72 Z
                    M -24 74 Q -14 76 -16 88 Q -20 98 -26 100 Q -30 92 -28 82 Z
                    M -6 50 Q 2 46 8 52 Q 6 58 0 60 Z
                    M 2 62 Q 12 60 18 68 Q 16 82 6 86 Q -2 80 0 68 Z
                    M 16 52 Q 28 48 36 56 Q 32 70 22 72 Q 14 64 16 52 Z
                    M 28 82 Q 38 80 40 88 Q 34 94 26 90 Z
                  "
                  fill="#ffffff"
                  fillOpacity="0.95"
                />
              </g>
            </g>

            {/* Globe Outer White Circle Rim */}
            <circle
              cx="80"
              cy="80"
              r="42"
              fill="none"
              stroke="#ffffff"
              strokeWidth="2.6"
            />

            {/* Front half of orbital ring (passing in front of the globe) */}
            <path
              d="M 144 92 A 76 22 -18 0 1 16 68"
              fill="none"
              stroke="#ffffff"
              strokeWidth="2.6"
            />
          </svg>
        </div>

        {/* ── Loading Title: World Loading... ── */}
        <h1
          style={{
            fontSize: 27,
            fontWeight: 700,
            color: '#ffffff',
            margin: '0 0 20px 0',
            letterSpacing: '-0.015em',
            textShadow: '0 2px 12px rgba(0, 0, 0, 0.75)',
          }}
        >
          World Loading...
        </h1>

        {/* ── Wide Horizontal Progress Bar ── */}
        <div
          style={{
            width: 360,
            maxWidth: '82vw',
            height: 12,
            background: 'rgba(255, 255, 255, 0.16)',
            border: '1px solid rgba(255, 255, 255, 0.22)',
            borderRadius: 9999,
            overflow: 'hidden',
            padding: 1.5,
            boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.5), 0 4px 14px rgba(0, 0, 0, 0.3)',
            marginBottom: 14,
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${progress}%`,
              background: '#A6F542',
              borderRadius: 9999,
              boxShadow: '0 0 14px rgba(166, 245, 66, 0.65)',
              transition: 'width 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          />
        </div>

        {/* ── Large Percentage ── */}
        <div
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: '#ffffff',
            letterSpacing: '0.02em',
            textShadow: '0 2px 8px rgba(0, 0, 0, 0.6)',
            marginBottom: 14,
          }}
        >
          {progress}%
        </div>

        {/* ── Loading Spinner & Activity Stage Message ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 9,
          }}
        >
          {/* Circular Loading Spinner with White Dots */}
          <svg
            className="loading-dot-spinner"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle cx="12" cy="3" r="1.8" fill="#ffffff" fillOpacity="1.0" />
            <circle cx="18.3" cy="5.6" r="1.8" fill="#ffffff" fillOpacity="0.88" />
            <circle cx="21" cy="12" r="1.8" fill="#ffffff" fillOpacity="0.75" />
            <circle cx="18.3" cy="18.4" r="1.8" fill="#ffffff" fillOpacity="0.62" />
            <circle cx="12" cy="21" r="1.8" fill="#ffffff" fillOpacity="0.5" />
            <circle cx="5.6" cy="18.4" r="1.8" fill="#ffffff" fillOpacity="0.38" />
            <circle cx="3" cy="12" r="1.8" fill="#ffffff" fillOpacity="0.25" />
            <circle cx="5.6" cy="5.6" r="1.8" fill="#ffffff" fillOpacity="0.15" />
          </svg>

          <span
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: '#e2e8f0',
              textShadow: '0 1px 4px rgba(0, 0, 0, 0.6)',
            }}
          >
            {activeMessage}
          </span>
        </div>
      </div>

      {/* ── Bottom Information and Tips ── */}
      <div
        style={{
          position: 'absolute',
          bottom: 36,
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          padding: '0 20px',
          maxWidth: '92vw',
          opacity: tipFade ? 1 : 0,
          transition: 'opacity 0.4s ease',
        }}
      >
        {/* Left divider line */}
        <div
          style={{
            width: 100,
            maxWidth: '18vw',
            height: 1,
            background: 'linear-gradient(to left, rgba(255, 255, 255, 0.4), transparent)',
          }}
        />

        {/* Lightbulb Icon & Tip Text */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            color: 'rgba(255, 255, 255, 0.92)',
            fontSize: 13,
            fontWeight: 500,
            textShadow: '0 1px 6px rgba(0, 0, 0, 0.7)',
            whiteSpace: 'nowrap',
          }}
        >
          <span style={{ fontSize: 16 }}>💡</span>
          <span>{LOADING_TIPS[tipIndex]}</span>
        </div>

        {/* Right divider line */}
        <div
          style={{
            width: 100,
            maxWidth: '18vw',
            height: 1,
            background: 'linear-gradient(to right, rgba(255, 255, 255, 0.4), transparent)',
          }}
        />
      </div>

      {/* ── Animation Styles for Globe Rotation and Spinner ── */}
      <style jsx>{`
        @keyframes rotateGlobe {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-80px);
          }
        }
        .loading-globe-continents {
          animation: rotateGlobe 9s linear infinite;
        }

        @keyframes spinDots {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
        .loading-dot-spinner {
          animation: spinDots 0.9s steps(8, end) infinite;
        }
      `}</style>
    </div>
  );
}

