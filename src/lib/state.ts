import { create } from 'zustand';

export type Quality = 'low' | 'medium' | 'high';

export interface QualityConfig {
  dpr: [number, number];
  shadow: number;
  post: boolean;
  ssao: boolean;
  trees: number;
  forest: number;
  radius: number;
  seg: number;
  lod: number;
  interiors: boolean;
  label: string;
  fogNear: number;
  fogFar: number;
  renderRadius: number;
}

/** Original uncompromised Desktop Quality profiles - Explored areas remain visible in long distance */
export const DESKTOP_QUALITY: Record<Quality, QualityConfig> = {
  low:    { dpr: [1, 1],   shadow: 0,    post: false, ssao: false, trees: 20,  forest: 120, radius: 220, seg: 90,   lod: 35, interiors: false, label: 'Low',    fogNear: 45, fogFar: 650, renderRadius: 240 },
  medium: { dpr: [1, 1.5], shadow: 2048, post: true,  ssao: false, trees: 50,  forest: 350, radius: 320, seg: 140,  lod: 55, interiors: true,  label: 'Medium', fogNear: 60, fogFar: 850, renderRadius: 340 },
  high:   { dpr: [1, 2],   shadow: 4096, post: true,  ssao: true,  trees: 90, forest: 700, radius: 420, seg: 200,  lod: 85, interiors: true,  label: 'High',   fogNear: 80, fogFar: 1100, renderRadius: 440 },
};

/** Dedicated Mobile Phone Quality profiles: optimized for mobile GPUs and battery efficiency */
export const MOBILE_QUALITY: Record<Quality, QualityConfig> = {
  low:    { dpr: [1, 1],    shadow: 0, post: false, ssao: false, trees: 12, forest: 60,  radius: 160, seg: 60, lod: 22, interiors: false, label: 'Mobile Low',  fogNear: 30, fogFar: 500, renderRadius: 180 },
  medium: { dpr: [1, 1.15], shadow: 0, post: false, ssao: false, trees: 22, forest: 105, radius: 220, seg: 80, lod: 32, interiors: false, label: 'Mobile Med',  fogNear: 40, fogFar: 650, renderRadius: 240 },
  high:   { dpr: [1, 1.25], shadow: 0, post: false, ssao: false, trees: 32, forest: 150, radius: 280, seg: 90, lod: 40, interiors: false, label: 'Mobile High', fogNear: 50, fogFar: 780, renderRadius: 300 },
};

/** Backwards-compatible alias default */
export const QUALITY = DESKTOP_QUALITY;

/** Universal device detection: true if running on a phone or mobile-sized screen */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent || navigator.vendor || (window as any).opera || '';
  const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i.test(ua);
  const isNarrow = window.innerWidth <= 860;
  const hasTouch = ('ontouchstart' in window || navigator.maxTouchPoints > 0) && isNarrow;
  return isMobileUA || hasTouch;
}

/** Select active configuration separating Mobile vs Desktop pipelines */
export function getQualityConfig(quality: Quality, isMobile: boolean): QualityConfig {
  return isMobile ? (MOBILE_QUALITY[quality] || MOBILE_QUALITY.medium) : (DESKTOP_QUALITY[quality] || DESKTOP_QUALITY.medium);
}

interface UI {
  quality: Quality; view: '1p' | '3p' | 'free'; nearPlot: string | null; panelOpen: boolean; teleportMapOpen: boolean; debugMonitorOpen: boolean; nearRes: { id: string; type: string } | null; inv: { wood: number; stone: number; crystal: number }; setNearRes: (r: { id: string; type: string } | null) => void; setInv: (i: { wood: number; stone: number; crystal: number }) => void;
  walkSpeed: number; sensitivity: number; isForcedLandscape: boolean;
  setWalkSpeed: (s: number) => void; setSensitivity: (s: number) => void; setIsForcedLandscape: (b: boolean) => void;
  setQuality: (q: Quality) => void; setView: (v: '1p' | '3p' | 'free') => void; setNear: (p: string | null) => void; setPanel: (b: boolean) => void; setTeleportMapOpen: (b: boolean) => void; toggleDebugMonitor: () => void; init: () => void;
}
export const useUI = create<UI>((set) => ({
  quality: 'low', view: '3p', nearPlot: null, panelOpen: false, teleportMapOpen: false, debugMonitorOpen: false, nearRes: null, inv: { wood: 0, stone: 0, crystal: 0 },
  walkSpeed: 1.0, sensitivity: 1.0, isForcedLandscape: false,
  setIsForcedLandscape: (isForcedLandscape) => set({ isForcedLandscape }),
  toggleDebugMonitor: () => set(state => ({ debugMonitorOpen: !state.debugMonitorOpen })),
  setWalkSpeed: (walkSpeed) => {
    try { localStorage.setItem('thecity.walkSpeed', String(walkSpeed)); } catch {}
    set({ walkSpeed });
  },
  setSensitivity: (sensitivity) => {
    try { localStorage.setItem('thecity.sensitivity', String(sensitivity)); } catch {}
    set({ sensitivity });
  },
  setNearRes: (nearRes) => set({ nearRes }), setInv: (inv) => set({ inv }),
  setQuality: (quality) => { try { localStorage.setItem('thecity.quality', quality); } catch {} set({ quality }); },
  setView: (view) => set({ view }),
  setNear: (nearPlot) => set({ nearPlot }),
  setPanel: (panelOpen) => set({ panelOpen }),
  setTeleportMapOpen: (teleportMapOpen) => set({ teleportMapOpen }),
  init: () => {
    try {
      const saved = localStorage.getItem('thecity.quality') as Quality | null;
      if (saved && DESKTOP_QUALITY[saved]) {
        set({ quality: saved });
      } else {
        const isMob = isMobileDevice();
        set({ quality: isMob ? 'low' : 'medium' });
      }
      const sp = parseFloat(localStorage.getItem('thecity.walkSpeed') || '1.0');
      if (!isNaN(sp) && sp > 0) set({ walkSpeed: sp });
      const sens = parseFloat(localStorage.getItem('thecity.sensitivity') || '1.0');
      if (!isNaN(sens) && sens > 0) set({ sensitivity: sens });
    } catch {
      set({ quality: 'medium' });
    }
  },
}));

/** Mutable per-frame player state (read by HUD minimap without React re-renders). */
export const SPAWN = { x: -4.4, z: 39.5, yaw: Math.PI }; // on the plaza facing J Enterprise, matching landing rig endpoint
export const player = {
  x: SPAWN.x,
  y: 0.1,
  z: SPAWN.z,
  yaw: SPAWN.yaw,
  pitch: 0.22,
  heading: SPAWN.yaw,
  moving: false,
  vx: 0,
  vz: 0,
  vy: 0,
  onGround: true,
  inWater: false,
  camDist: 7.2,
  teleport: null as null | { x: number; z: number; yaw: number },
  moveInput: { f: 0, s: 0, run: false, jump: false, up: false, down: false },
};

export const landing = { p: 0 };
