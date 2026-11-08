'use client';
import { useEffect, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { create } from 'zustand';

interface PerfState {
  fps: number;
  drawCalls: number;
  triangles: number;
  lines: number;
  points: number;
  textures: number;
  geometries: number;
  activeChunksCount: number;
  enabled: boolean;
  toggle: () => void;
  update: (data: Partial<PerfState>) => void;
}

export const usePerfStore = create<PerfState>((set) => ({
  fps: 60,
  drawCalls: 0,
  triangles: 0,
  lines: 0,
  points: 0,
  textures: 0,
  geometries: 0,
  activeChunksCount: 0,
  enabled: false,
  toggle: () => set((s) => ({ enabled: !s.enabled })),
  update: (data) => set(data),
}));

/** R3F hook component mounted inside Canvas to sample Three.js render metrics */
export function PerfCollector() {
  const frames = useRef(0);
  const prevTime = useRef(performance.now());
  const update = usePerfStore((s) => s.update);

  useFrame(({ gl }) => {
    frames.current++;
    const now = performance.now();
    if (now >= prevTime.current + 500) {
      const fps = Math.round((frames.current * 1000) / (now - prevTime.current));
      frames.current = 0;
      prevTime.current = now;

      update({
        fps,
        drawCalls: gl.info.render.calls,
        triangles: gl.info.render.triangles,
        lines: gl.info.render.lines,
        points: gl.info.render.points,
        textures: gl.info.memory.textures,
        geometries: gl.info.memory.geometries,
      });
    }
  });

  return null;
}

/** HTML Overlay displayed when enabled (or in dev) */
export function PerfOverlay() {
  const { enabled, toggle, fps, drawCalls, triangles, textures, geometries } = usePerfStore();

  useEffect(() => {
    // Check URL param ?perf=1 or ?debug=1
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('perf') === '1' || params.get('debug') === '1') {
        usePerfStore.setState({ enabled: true });
      }
    }

    const onKey = (e: KeyboardEvent) => {
      // Toggle with F3 or Shift + P
      if (e.code === 'F3' || (e.shiftKey && e.code === 'KeyP')) {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggle]);

  if (!enabled) {
    return (
      <button
        onClick={toggle}
        title="Toggle Performance HUD (F3 or Shift+P)"
        style={{
          position: 'fixed',
          bottom: '12px',
          right: '12px',
          zIndex: 9999,
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          color: '#94a3b8',
          fontSize: '0.7rem',
          padding: '4px 8px',
          borderRadius: '6px',
          cursor: 'pointer',
          fontFamily: 'monospace',
        }}
      >
        📊 Stats (F3)
      </button>
    );
  }

  const fpsColor = fps >= 55 ? '#4ade80' : fps >= 30 ? '#facc15' : '#f87171';

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '12px',
        right: '12px',
        zIndex: 9999,
        background: 'rgba(10, 16, 30, 0.88)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(56, 189, 248, 0.3)',
        borderRadius: '12px',
        padding: '0.75rem 1rem',
        color: '#f8fafc',
        fontFamily: 'monospace',
        fontSize: '0.78rem',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        minWidth: '220px',
        pointerEvents: 'auto',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px' }}>
        <b style={{ color: '#38bdf8' }}>⚡ City 3D Engine</b>
        <button
          onClick={toggle}
          style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.8rem', padding: '0 4px' }}
        >
          ✕
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '3px 12px' }}>
        <span>Framerate:</span>
        <b style={{ color: fpsColor }}>{fps} FPS</b>

        <span>Draw Calls:</span>
        <b style={{ color: drawCalls < 150 ? '#4ade80' : drawCalls < 300 ? '#facc15' : '#f87171' }}>{drawCalls}</b>

        <span>Triangles:</span>
        <b>{triangles.toLocaleString()}</b>

        <span>Geometries:</span>
        <b>{geometries}</b>

        <span>Textures:</span>
        <b>{textures}</b>

        <span>LOD System:</span>
        <span style={{ color: '#38bdf8' }}>3 Levels (Auto)</span>

        <span>Chunk Culling:</span>
        <span style={{ color: '#4ade80' }}>Active (Geographic)</span>
      </div>

      <div style={{ marginTop: '6px', fontSize: '0.66rem', color: '#64748b', textAlign: 'center' }}>
        Press <kbd style={{ background: '#1e293b', padding: '1px 4px', borderRadius: '3px' }}>F3</kbd> to hide
      </div>
    </div>
  );
}

