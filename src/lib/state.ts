import { create } from 'zustand';

export type Quality = 'low' | 'medium' | 'high';
export const QUALITY: Record<Quality, { dpr: [number, number]; shadow: number; post: boolean; ssao: boolean; trees: number; forest: number; radius: number; seg: number; lod: number; interiors: boolean; label: string }> = {
  low:    { dpr: [1, 1],   shadow: 0,    post: false, ssao: false, trees: 20,  forest: 150, radius: 180, seg: 100,  lod: 38, interiors: false, label: 'Low (mobile / weak GPU)' },
  medium: { dpr: [1, 1.5], shadow: 2048, post: true,  ssao: false, trees: 50,  forest: 450, radius: 300, seg: 160, lod: 60, interiors: true,  label: 'Medium' },
  high:   { dpr: [1, 2],   shadow: 4096, post: true,  ssao: true,  trees: 90, forest: 900, radius: 420, seg: 220, lod: 90, interiors: true,  label: 'High (desktop)' },
};

interface UI {
  quality: Quality; view: '1p' | '3p' | 'free'; nearPlot: string | null; panelOpen: boolean; teleportMapOpen: boolean; debugMonitorOpen: boolean; nearRes: { id: string; type: string } | null; inv: { wood: number; stone: number; crystal: number }; setNearRes: (r: { id: string; type: string } | null) => void; setInv: (i: { wood: number; stone: number; crystal: number }) => void;
  walkSpeed: number; sensitivity: number;
  setWalkSpeed: (s: number) => void; setSensitivity: (s: number) => void;
  setQuality: (q: Quality) => void; setView: (v: '1p' | '3p' | 'free') => void; setNear: (p: string | null) => void; setPanel: (b: boolean) => void; setTeleportMapOpen: (b: boolean) => void; toggleDebugMonitor: () => void; init: () => void;
}
export const useUI = create<UI>((set) => ({
  quality: 'low', view: '3p', nearPlot: null, panelOpen: false, teleportMapOpen: false, debugMonitorOpen: false, nearRes: null, inv: { wood: 0, stone: 0, crystal: 0 },
  walkSpeed: 1.0, sensitivity: 1.0,
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
      if (saved && QUALITY[saved]) {
        set({ quality: saved });
      } else {
        set({ quality: 'low' });
      }
      const sp = parseFloat(localStorage.getItem('thecity.walkSpeed') || '1.0');
      if (!isNaN(sp) && sp > 0) set({ walkSpeed: sp });
      const sens = parseFloat(localStorage.getItem('thecity.sensitivity') || '1.0');
      if (!isNaN(sens) && sens > 0) set({ sensitivity: sens });
    } catch {
      set({ quality: 'low' });
    }
  },
}));

/** Mutable per-frame player state (read by HUD minimap without React re-renders). */
export const SPAWN = { x: -4.4, z: 39.5, yaw: Math.PI }; // on the plaza facing J Enterprise, matching landing rig endpoint
export const player = { x: SPAWN.x, y: 0.1, z: SPAWN.z, yaw: SPAWN.yaw, pitch: 0.22, heading: SPAWN.yaw, moving: false, vx: 0, vz: 0, vy: 0, onGround: true, inWater: false, camDist: 11.5, teleport: null as null | { x: number; z: number; yaw: number } };

export const landing = { p: 0 };
