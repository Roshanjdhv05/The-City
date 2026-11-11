'use client';
import React, { useState, useEffect } from 'react';

/**
 * Mobile Portrait Rotate Instruction Overlay
 * Detects if a phone is in portrait mode and shows an elegant animated instruction
 * to rotate the device into landscape for the full 3D open-world city experience.
 */
export function MobileRotateInstruction() {
  const [isPortraitMobile, setIsPortraitMobile] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      const isMobileWidth = window.innerWidth <= 920;
      const isPortrait = window.innerHeight > window.innerWidth;
      setIsPortraitMobile(isMobileWidth && isPortrait);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);
    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  if (!isPortraitMobile) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* Blurred J Enterprise City Background */}
      <div
        style={{
          position: 'absolute',
          inset: -20,
          backgroundImage: 'url(/city-loading-bg.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center 40%',
          backgroundRepeat: 'no-repeat',
          filter: 'blur(18px) brightness(0.55) saturate(0.8)',
          transform: 'scale(1.05)',
        }}
      />

      {/* Dark Cinematic Vignette */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(circle at center, rgba(15, 23, 42, 0.6) 0%, rgba(8, 14, 26, 0.88) 100%)',
        }}
      />

      {/* Animated Phone Illustration & Content */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          padding: '24px 28px',
          maxWidth: '340px',
        }}
      >
        {/* Animated Rotating Smartphone SVG */}
        <div
          style={{
            position: 'relative',
            width: 100,
            height: 100,
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div className="rotate-phone-anim">
            <svg
              width="64"
              height="90"
              viewBox="0 0 64 90"
              fill="none"
              style={{
                filter: 'drop-shadow(0 0 16px rgba(163, 230, 53, 0.45))',
              }}
            >
              {/* Phone Body */}
              <rect
                x="2"
                y="2"
                width="60"
                height="86"
                rx="12"
                fill="#0f172a"
                stroke="#a3e635"
                strokeWidth="3"
              />
              {/* Screen Area */}
              <rect
                x="7"
                y="10"
                width="50"
                height="70"
                rx="6"
                fill="rgba(56, 189, 248, 0.15)"
                stroke="rgba(255, 255, 255, 0.2)"
                strokeWidth="1"
              />
              {/* Speaker / Camera Notch */}
              <rect x="24" y="5" width="16" height="2.5" rx="1" fill="#475569" />
              {/* Home Indicator Bar */}
              <rect x="22" y="83" width="20" height="2" rx="1" fill="#a3e635" />

              {/* 3D City Silhouette Mini Graphic Inside Phone */}
              <path
                d="M 12 66 L 22 48 L 32 54 L 42 38 L 52 66 Z"
                fill="rgba(163, 230, 53, 0.35)"
              />
            </svg>
          </div>

          {/* Curved Circular Rotation Arrow */}
          <div className="rotate-arrow-anim">
            <svg
              width="96"
              height="96"
              viewBox="0 0 96 96"
              fill="none"
              style={{ position: 'absolute', top: 2, left: 2 }}
            >
              <path
                d="M 22 28 A 38 38 0 0 1 74 24"
                stroke="#38bdf8"
                strokeWidth="2.5"
                strokeDasharray="4 3"
                strokeLinecap="round"
              />
              <polygon points="78,24 70,18 72,27" fill="#38bdf8" />
            </svg>
          </div>
        </div>

        {/* Heading */}
        <h2
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: '#ffffff',
            margin: '0 0 10px 0',
            letterSpacing: '-0.01em',
            textShadow: '0 2px 10px rgba(0, 0, 0, 0.8)',
          }}
        >
          Please Rotate Your Device
        </h2>

        {/* Description */}
        <p
          style={{
            fontSize: 14,
            fontWeight: 500,
            lineHeight: 1.5,
            color: '#cbd5e1',
            margin: '0 0 16px 0',
            textShadow: '0 1px 4px rgba(0, 0, 0, 0.6)',
          }}
        >
          Rotate to landscape mode for the best immersive 3D virtual market experience.
        </p>

        {/* Lime Accent Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(163, 230, 53, 0.16)',
            border: '1px solid rgba(163, 230, 53, 0.45)',
            borderRadius: 999,
            padding: '6px 14px',
            fontSize: 12,
            fontWeight: 700,
            color: '#a3e635',
            boxShadow: '0 0 12px rgba(163, 230, 53, 0.25)',
          }}
        >
          <span>🔄</span>
          <span>Landscape Required</span>
        </div>
      </div>

      {/* Rotation Keyframe Animations */}
      <style jsx>{`
        @keyframes phoneTurn {
          0%,
          20% {
            transform: rotate(0deg);
          }
          50%,
          75% {
            transform: rotate(-90deg);
          }
          100% {
            transform: rotate(0deg);
          }
        }
        .rotate-phone-anim {
          animation: phoneTurn 3.2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          transform-origin: center center;
        }

        @keyframes pulseArrow {
          0%,
          100% {
            opacity: 0.3;
            transform: scale(0.96);
          }
          50% {
            opacity: 0.95;
            transform: scale(1.04);
          }
        }
        .rotate-arrow-anim {
          animation: pulseArrow 3.2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

