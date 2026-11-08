import { create } from 'zustand';

interface PreloadState {
  isPreloading: boolean;
  isWorldReady: boolean;
  progress: number;
  startPreload: () => void;
  setReady: (ready: boolean) => void;
}

export const usePreloadStore = create<PreloadState>((set, get) => ({
  isPreloading: false,
  isWorldReady: false,
  progress: 0,
  startPreload: () => {
    if (get().isPreloading || get().isWorldReady) return;
    set({ isPreloading: true, progress: 0.1 });

    // Warm-up initial core structures smoothly in background frames
    let p = 0.1;
    const interval = setInterval(() => {
      p += 0.3;
      if (p >= 1) {
        clearInterval(interval);
        set({ progress: 1, isWorldReady: true, isPreloading: false });
      } else {
        set({ progress: p });
      }
    }, 60);
  },
  setReady: (ready: boolean) => set({ isWorldReady: ready }),
}));

