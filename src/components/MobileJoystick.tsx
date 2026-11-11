'use client';
import React, { useRef, useState, useEffect } from 'react';
import { player, useUI } from '@/lib/state';

const JOYSTICK_RADIUS = 48; // Max movement radius of the stick in pixels
const BASE_SIZE = 110;      // Total size of the circular base in pixels
const KNOB_SIZE = 46;       // Size of the draggable thumb knob in pixels

export function MobileJoystick() {
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const [active, setActive] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const touchIdRef = useRef<number | null>(null);
  const baseCenterRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const { view } = useUI();

  // Detect touch device or mobile screen
  useEffect(() => {
    const checkTouch = () => {
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isNarrow = window.innerWidth <= 1024;
      setIsTouchDevice(hasTouch || isNarrow);
    };
    checkTouch();
    window.addEventListener('resize', checkTouch);
    return () => window.removeEventListener('resize', checkTouch);
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (touchIdRef.current !== null) return;

    const touch = e.changedTouches[0];
    touchIdRef.current = touch.identifier;

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      baseCenterRef.current = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
    }

    setActive(true);
    updateKnob(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (touchIdRef.current === null) return;

    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (t.identifier === touchIdRef.current) {
        updateKnob(t.clientX, t.clientY);
        break;
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (touchIdRef.current === null) return;

    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === touchIdRef.current) {
        touchIdRef.current = null;
        setActive(false);
        setKnobPos({ x: 0, y: 0 });

        // Reset player input
        if (player.moveInput) {
          player.moveInput.f = 0;
          player.moveInput.s = 0;
          player.moveInput.run = false;
        }
        break;
      }
    }
  };

  const updateKnob = (clientX: number, clientY: number) => {
    const dx = clientX - baseCenterRef.current.x;
    const dy = clientY - baseCenterRef.current.y;
    const dist = Math.hypot(dx, dy);

    let normX = dx;
    let normY = dy;

    if (dist > JOYSTICK_RADIUS) {
      normX = (dx / dist) * JOYSTICK_RADIUS;
      normY = (dy / dist) * JOYSTICK_RADIUS;
    }

    setKnobPos({ x: normX, y: normY });

    // Normalize input between -1 and 1
    const s = normX / JOYSTICK_RADIUS;
    const f = -normY / JOYSTICK_RADIUS; // -Y is forward (KeyW)

    if (player.moveInput) {
      player.moveInput.f = f;
      player.moveInput.s = s;
      player.moveInput.run = dist / JOYSTICK_RADIUS > 0.75;
    }
  };

  // Jump trigger
  const handleJumpPress = (pressed: boolean) => {
    if (player.moveInput) {
      player.moveInput.jump = pressed;
      player.moveInput.up = pressed;
    }
  };

  const handleDownPress = (pressed: boolean) => {
    if (player.moveInput) {
      player.moveInput.down = pressed;
    }
  };

  if (!isTouchDevice) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 20,
        left: 20,
        zIndex: 80,
        display: 'flex',
        alignItems: 'flex-end',
        gap: 16,
        userSelect: 'none',
        WebkitUserSelect: 'none',
        touchAction: 'none',
      }}
    >
      {/* ── Virtual Joystick Base ── */}
      <div
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        style={{
          position: 'relative',
          width: BASE_SIZE,
          height: BASE_SIZE,
          borderRadius: '50%',
          background: 'rgba(15, 23, 42, 0.45)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: active
            ? '2px solid rgba(163, 230, 53, 0.85)'
            : '2px solid rgba(163, 230, 53, 0.45)',
          boxShadow: active
            ? '0 0 20px rgba(163, 230, 53, 0.35), inset 0 0 14px rgba(0,0,0,0.5)'
            : '0 8px 24px rgba(0, 0, 0, 0.5), inset 0 0 10px rgba(0,0,0,0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'border-color 0.2s ease',
        }}
      >
        {/* Subtle Cardinal Direction Indicators */}
        <span style={{ position: 'absolute', top: 6, fontSize: 10, color: 'rgba(255,255,255,0.4)', pointerEvents: 'none' }}>▲</span>
        <span style={{ position: 'absolute', bottom: 6, fontSize: 10, color: 'rgba(255,255,255,0.4)', pointerEvents: 'none' }}>▼</span>
        <span style={{ position: 'absolute', left: 8, fontSize: 10, color: 'rgba(255,255,255,0.4)', pointerEvents: 'none' }}>◀</span>
        <span style={{ position: 'absolute', right: 8, fontSize: 10, color: 'rgba(255,255,255,0.4)', pointerEvents: 'none' }}>▶</span>

        {/* Center Crosshair Ring */}
        <div
          style={{
            position: 'absolute',
            width: 20,
            height: 20,
            borderRadius: '50%',
            border: '1px dashed rgba(255, 255, 255, 0.25)',
            pointerEvents: 'none',
          }}
        />

        {/* Draggable Stick / Thumb Knob */}
        <div
          style={{
            position: 'absolute',
            width: KNOB_SIZE,
            height: KNOB_SIZE,
            borderRadius: '50%',
            background: active
              ? 'radial-gradient(circle at 35% 35%, #bef264, #a3e635, #65a30d)'
              : 'radial-gradient(circle at 35% 35%, #a3e635, #84cc16, #4d7c0f)',
            border: '2px solid rgba(255, 255, 255, 0.85)',
            boxShadow: active
              ? '0 0 18px rgba(163, 230, 53, 0.8), 0 4px 12px rgba(0, 0, 0, 0.6)'
              : '0 0 12px rgba(163, 230, 53, 0.4), 0 4px 10px rgba(0, 0, 0, 0.5)',
            transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
            transition: active ? 'none' : 'transform 0.18s cubic-bezier(0.2, 0.8, 0.2, 1)',
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* ── Touch Action Buttons (Jump / Ascend & Descend) ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Jump / Up Button */}
        <button
          onTouchStart={e => { e.stopPropagation(); handleJumpPress(true); }}
          onTouchEnd={e => { e.stopPropagation(); handleJumpPress(false); }}
          onTouchCancel={e => { e.stopPropagation(); handleJumpPress(false); }}
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            border: '1.5px solid rgba(56, 189, 248, 0.55)',
            color: '#38bdf8',
            fontSize: 18,
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.4), 0 0 10px rgba(56, 189, 248, 0.25)',
            cursor: 'pointer',
            touchAction: 'none',
          }}
          title={view === 'free' ? 'Fly Up' : 'Jump'}
        >
          {view === 'free' ? '▲' : '🦘'}
        </button>

        {/* Free-Fly Descend Button (only shown in free-fly mode) */}
        {view === 'free' && (
          <button
            onTouchStart={e => { e.stopPropagation(); handleDownPress(true); }}
            onTouchEnd={e => { e.stopPropagation(); handleDownPress(false); }}
            onTouchCancel={e => { e.stopPropagation(); handleDownPress(false); }}
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: 'rgba(15, 23, 42, 0.65)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              border: '1.5px solid rgba(148, 163, 184, 0.55)',
              color: '#cbd5e1',
              fontSize: 16,
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.4)',
              cursor: 'pointer',
              touchAction: 'none',
            }}
            title="Fly Down"
          >
            ▼
          </button>
        )}
      </div>
    </div>
  );
}

