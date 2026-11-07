import { create } from 'zustand';

export interface TimePhaseInfo {
  label: string;
  icon: string;
  phase: 'dawn' | 'sunrise' | 'morning' | 'noon' | 'afternoon' | 'sunset' | 'dusk' | 'moonrise' | 'night' | 'midnight';
  darkness: number;    // 0 = bright day, 1 = deep dark night
  sunElevation: number;// -1 (nadir) to +1 (zenith)
  isNight: boolean;
}

export const TIME_PRESETS = [
  { id: 'sunrise',   label: 'Sunrise',    hour: 6.2,  icon: '🌅' },
  { id: 'day',       label: 'Day',        hour: 11.5, icon: '☀️' },
  { id: 'afternoon', label: 'Afternoon',  hour: 14.5, icon: '🌤️' },
  { id: 'sunset',    label: 'Sunset',     hour: 18.2, icon: '🌇' },
  { id: 'moonrise',  label: 'Moonrise',   hour: 20.0, icon: '🌔' },
  { id: 'night',     label: 'Night',      hour: 22.0, icon: '🌙' },
  { id: 'midnight',  label: 'Dark Night', hour: 0.5,  icon: '🌌' },
] as const;

export function getDeviceHour(): number {
  if (typeof window === 'undefined') return 12.0;
  const now = new Date();
  return now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;
}

/** Mutable per-frame simulation state read by R3F useFrame loops without re-rendering React. */
export const cityTime = {
  hour: getDeviceHour(),
  speed: 1.0,
  isPlaying: false,       // Default: live device time mode
  isLiveDevice: true,     // Device time is active by default
  cycleDurationSec: 180, // 3 minutes per cycle when auto-playing
};

/** Formats decimal hour (0..24) to a human-readable 12-hour clock string (e.g. "06:30 AM"). */
export function formatClock(hour: number): string {
  const norm = ((hour % 24) + 24) % 24;
  const h = Math.floor(norm);
  const m = Math.floor((norm - h) * 60);
  const period = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 === 0 ? 12 : h % 12;
  const mm = m.toString().padStart(2, '0');
  return `${displayH}:${mm} ${period}`;
}

/** Computes smooth phase transitions, darkness level, and sun angle. */
export function getTimePhase(hour: number): TimePhaseInfo {
  const h = ((hour % 24) + 24) % 24;
  // Angle: 6h -> 0 (East/Horizon), 12h -> pi/2 (Zenith), 18h -> pi (West/Horizon), 24h -> 3pi/2 (Nadir)
  const solarAngle = ((h - 6) / 24) * Math.PI * 2;
  const sunElevation = Math.sin(solarAngle);

  let label = 'Day';
  let icon = '☀️';
  let phase: TimePhaseInfo['phase'] = 'morning';
  let darkness = 0.0;
  let isNight = false;

  if (h >= 4.8 && h < 6.0) {
    phase = 'dawn';
    label = 'Dawn';
    icon = '✨';
    darkness = THREE_smoothstep(h, 4.8, 6.0, 0.9, 0.45);
    isNight = true;
  } else if (h >= 6.0 && h < 7.6) {
    phase = 'sunrise';
    label = 'Sunrise';
    icon = '🌅';
    darkness = THREE_smoothstep(h, 6.0, 7.6, 0.45, 0.0);
    isNight = false;
  } else if (h >= 7.6 && h < 11.5) {
    phase = 'morning';
    label = 'Morning';
    icon = '🌤️';
    darkness = 0.0;
    isNight = false;
  } else if (h >= 11.5 && h < 14.5) {
    phase = 'noon';
    label = 'Noon';
    icon = '☀️';
    darkness = 0.0;
    isNight = false;
  } else if (h >= 14.5 && h < 17.5) {
    phase = 'afternoon';
    label = 'Afternoon';
    icon = '🌤️';
    darkness = 0.0;
    isNight = false;
  } else if (h >= 17.5 && h < 19.4) {
    phase = 'sunset';
    label = 'Sunset';
    icon = '🌇';
    darkness = THREE_smoothstep(h, 17.5, 19.4, 0.0, 0.6);
    isNight = false;
  } else if (h >= 19.4 && h < 21.0) {
    phase = 'dusk';
    label = 'Dusk / Moonrise';
    icon = '🌔';
    darkness = THREE_smoothstep(h, 19.4, 21.0, 0.6, 0.95);
    isNight = true;
  } else if (h >= 21.0 && h < 23.8) {
    phase = 'night';
    label = 'Night';
    icon = '🌙';
    darkness = 1.0;
    isNight = true;
  } else {
    // 23.8 - 4.8
    phase = 'midnight';
    label = 'Dark Night';
    icon = '🌌';
    darkness = 1.0;
    isNight = true;
  }

  return { label, icon, phase, darkness, sunElevation, isNight };
}

function THREE_smoothstep(x: number, min: number, max: number, outMin: number, outMax: number): number {
  if (x <= min) return outMin;
  if (x >= max) return outMax;
  const t = (x - min) / (max - min);
  const s = t * t * (3 - 2 * t);
  return outMin + s * (outMax - outMin);
}

// ── Zustand store for React HUD & user controls ──
interface TimeStore {
  hour: number;
  isPlaying: boolean;
  isLiveDevice: boolean;
  speed: number;
  setHour: (h: number) => void;
  togglePlay: () => void;
  setLiveDevice: (live: boolean) => void;
  setSpeed: (s: number) => void;
  syncFromSimulation: (h: number) => void;
}

export const useTimeStore = create<TimeStore>((set) => ({
  hour: cityTime.hour,
  isPlaying: cityTime.isPlaying,
  isLiveDevice: cityTime.isLiveDevice,
  speed: cityTime.speed,
  setHour: (hour) => {
    cityTime.hour = hour;
    cityTime.isLiveDevice = false;
    set({ hour, isLiveDevice: false });
  },
  togglePlay: () => {
    cityTime.isPlaying = !cityTime.isPlaying;
    cityTime.isLiveDevice = false;
    set({ isPlaying: cityTime.isPlaying, isLiveDevice: false });
  },
  setLiveDevice: (live: boolean) => {
    cityTime.isLiveDevice = live;
    if (live) {
      cityTime.isPlaying = false;
      cityTime.hour = getDeviceHour();
      set({ isLiveDevice: true, isPlaying: false, hour: cityTime.hour });
    } else {
      set({ isLiveDevice: false });
    }
  },
  setSpeed: (speed) => {
    cityTime.speed = speed;
    set({ speed });
  },
  syncFromSimulation: (hour) => set({ hour }),
}));
