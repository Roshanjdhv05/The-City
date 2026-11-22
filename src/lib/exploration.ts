'use client';
import { create } from 'zustand';
import type { Layout } from './layout';
import type { Terrain } from './terrain';
import { areaAt, Area, NATURE } from './areas';
import { syncExplorationToSupabase, loadExplorationFromSupabase } from './sync';

export const GRID_CELL_SIZE = 24; // 24-meter grid cell resolution
export const EXPLORATION_STORAGE_KEY = 'thecity.exploration.v1';
export const LEGACY_DISCOVERED_KEY = 'thecity.discovered';

let explorationUserId: string | null = null;
export function setExplorationUserId(id: string | null) {
  explorationUserId = id;
}

export interface ExplorationPayload {
  v: 1;
  cells: string[];
  areas: string[];
  updatedAt: number;
}

/** Compute deterministic grid cell identifier from world coordinates */
export function getGridCellKey(x: number, z: number): string {
  const gx = Math.floor(x / GRID_CELL_SIZE);
  const gz = Math.floor(z / GRID_CELL_SIZE);
  return `c:${gx}:${gz}`;
}

/** Parse grid cell key back to cell center in world coordinates */
export function getGridCellCenter(key: string): [number, number] {
  const parts = key.replace('c:', '').split(':');
  const gx = parseInt(parts[0], 10) || 0;
  const gz = parseInt(parts[1], 10) || 0;
  return [(gx + 0.5) * GRID_CELL_SIZE, (gz + 0.5) * GRID_CELL_SIZE];
}

/** Safely read and restore exploration data from LocalStorage */
export function loadExplorationFromStorage(): { cells: Set<string>; areas: Set<string> } {
  const cells = new Set<string>();
  const areas = new Set<string>();

  if (typeof window === 'undefined') {
    return { cells, areas };
  }

  try {
    // 1. Primary structured exploration data
    const raw = localStorage.getItem(EXPLORATION_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<ExplorationPayload>;
      if (Array.isArray(parsed.cells)) {
        for (const c of parsed.cells) {
          if (typeof c === 'string' && c.startsWith('c:')) {
            cells.add(c);
          }
        }
      }
      if (Array.isArray(parsed.areas)) {
        for (const a of parsed.areas) {
          if (typeof a === 'string' && a.trim().length > 0) {
            areas.add(a.trim());
          }
        }
      }
    }

    // 2. Backward compatibility with legacy discovered areas list
    const legacyRaw = localStorage.getItem(LEGACY_DISCOVERED_KEY);
    if (legacyRaw) {
      const legacyList = JSON.parse(legacyRaw);
      if (Array.isArray(legacyList)) {
        for (const name of legacyList) {
          if (typeof name === 'string' && name.trim().length > 0) {
            areas.add(name.trim());
          }
        }
      }
    }
  } catch (err) {
    // Safely fallback to empty state without throwing on private browsing / quota errors
    console.warn('[Exploration] Error reading storage, initializing fresh state:', err);
  }

  return { cells, areas };
}

/** Safely write exploration data to LocalStorage (strictly additive - never removes or overwrites prior progress) */
export function saveExplorationToStorage(cells: Set<string>, areas: Set<string>): boolean {
  if (typeof window === 'undefined') return false;

  try {
    // 1. Read existing storage to guarantee strictly additive persistence
    const existing = loadExplorationFromStorage();
    for (const c of cells) existing.cells.add(c);
    for (const a of areas) existing.areas.add(a);

    const payload: ExplorationPayload = {
      v: 1,
      cells: Array.from(existing.cells),
      areas: Array.from(existing.areas),
      updatedAt: Date.now(),
    };

    localStorage.setItem(EXPLORATION_STORAGE_KEY, JSON.stringify(payload));
    // Keep legacy key synchronized so any dependent systems remain 100% intact
    localStorage.setItem(LEGACY_DISCOVERED_KEY, JSON.stringify(payload.areas));
    return true;
  } catch (err) {
    console.warn('[Exploration] Storage write failed (quota exceeded or storage blocked):', err);
    return false;
  }
}

interface ExplorationState {
  exploredCells: Set<string>;
  exploredAreas: Set<string>;
  exploredCellsCount: number;
  exploredAreasCount: number;
  newDiscoveryToast: string | null;
  initialized: boolean;

  init: (userId?: string) => void;
  recordPosition: (x: number, z: number, layout?: Layout, terrain?: Terrain) => { newCell: boolean; newArea: string | null };
  isCellExplored: (x: number, z: number) => boolean;
  isAreaExplored: (name: string) => boolean;
  isPlotExplored: (plot: { x: number; z: number; district?: string }) => boolean;
  isChunkExplored: (chunkCodeOrName: string) => boolean;
  getExplorationProgress: (totalWorldAreas?: number) => { discoveredAreas: number; totalAreas: number; percentage: number; discoveredCells: number };
  clearToast: () => void;
  flushSave: () => void;
  resetExploration: () => void;
}

// In-memory persistent tracking state
let activeCells = new Set<string>();
let activeAreas = new Set<string>();
let isDirty = false;
let autoSaveInterval: NodeJS.Timeout | null = null;
let lastSamplePosition: { x: number; z: number } | null = null;

// Eagerly restore storage if running on client so isAreaOrChunkExplored is immediately available
if (typeof window !== 'undefined') {
  const loaded = loadExplorationFromStorage();
  for (const c of loaded.cells) activeCells.add(c);
  for (const a of loaded.areas) activeAreas.add(a);
}

const DISTRICT_CODE_MAP: Record<string, string> = {
  SAS: 'SAAS',
  AIM: 'AI',
  DEV: 'DEVELOPMENT',
  WIN: 'WINDOWS APPS',
  MAC: 'MAC APPS',
  MOB: 'MOBILE APPS',
  GAM: 'GAMING',
  DES: 'DESIGN',
  MKT: 'MARKETING',
};

// Inverse map: Name -> Code
const DISTRICT_NAME_TO_CODE: Record<string, string> = Object.entries(DISTRICT_CODE_MAP).reduce(
  (acc, [code, name]) => {
    acc[name] = code;
    return acc;
  },
  {} as Record<string, string>
);

/**
 * High-performance synchronous query for Three.js render loops:
 * Returns true if the chunk, district, market, or plot coordinates have been explored.
 * Explored places remain permanently discovered and visible in the long distance.
 */
export function isAreaOrChunkExplored(
  chunkIdOrName: string,
  districtName?: string,
  coords?: { x: number; z: number }
): boolean {
  // 1. Central Plaza and Central Hub are the starting area - always permanently visible
  if (
    chunkIdOrName === 'CENTRAL' ||
    chunkIdOrName.toLowerCase().includes('civic') ||
    chunkIdOrName.toLowerCase().includes('central')
  ) {
    return true;
  }

  // 2. Direct O(1) in-memory checks
  if (activeAreas.has(chunkIdOrName)) return true;
  if (districtName && activeAreas.has(districtName)) return true;

  // 3. Resolve district code <-> name
  const upperTarget = chunkIdOrName.toUpperCase().trim();
  const mappedName = DISTRICT_CODE_MAP[upperTarget];
  if (mappedName && activeAreas.has(mappedName)) return true;

  const mappedCode = DISTRICT_NAME_TO_CODE[upperTarget];
  if (mappedCode && activeAreas.has(mappedCode)) return true;

  if (districtName) {
    const upperDist = districtName.toUpperCase().trim();
    if (activeAreas.has(upperDist)) return true;
    const mappedDistName = DISTRICT_CODE_MAP[upperDist];
    if (mappedDistName && activeAreas.has(mappedDistName)) return true;
  }

  // 4. Robust case-insensitive comparison
  for (const a of activeAreas) {
    const au = a.toUpperCase().trim();
    if (au === upperTarget) return true;
    if (mappedName && au === mappedName.toUpperCase()) return true;
    if (districtName && au === districtName.toUpperCase().trim()) return true;
    if (au.includes(upperTarget) || upperTarget.includes(au)) return true;
  }

  // 5. Spatial grid cell check if coordinates are provided
  if (coords) {
    const cellKey = getGridCellKey(coords.x, coords.z);
    if (activeCells.has(cellKey)) return true;
  }

  return false;
}

export const useExplorationStore = create<ExplorationState>((set, get) => ({
  exploredCells: activeCells,
  exploredAreas: activeAreas,
  exploredCellsCount: 0,
  exploredAreasCount: 0,
  newDiscoveryToast: null,
  initialized: false,

  init: (userId?: string) => {
    if (userId) explorationUserId = userId;
    if (get().initialized) return;

    // Load saved discoveries and merge additively with in-memory state
    const { cells, areas } = loadExplorationFromStorage();
    for (const c of cells) activeCells.add(c);
    for (const a of areas) activeAreas.add(a);
    isDirty = false;

    set({
      exploredCells: activeCells,
      exploredAreas: activeAreas,
      exploredCellsCount: activeCells.size,
      exploredAreasCount: activeAreas.size,
      initialized: true,
    });

    // Asynchronously load and merge exploration progress from Supabase DB if signed in
    const uid = userId || explorationUserId;
    if (uid) {
      loadExplorationFromSupabase(uid).then((remote) => {
        if (remote) {
          let updated = false;
          for (const c of remote.cells) {
            if (!activeCells.has(c)) { activeCells.add(c); updated = true; }
          }
          for (const a of remote.areas) {
            if (!activeAreas.has(a)) { activeAreas.add(a); updated = true; }
          }
          if (updated) {
            saveExplorationToStorage(activeCells, activeAreas);
            set({
              exploredCells: activeCells,
              exploredAreas: activeAreas,
              exploredCellsCount: activeCells.size,
              exploredAreasCount: activeAreas.size,
            });
          }
        }
      }).catch(() => {});
    }

    // Auto-save debounced timer: every 3.5 seconds if dirty
    if (typeof window !== 'undefined' && !autoSaveInterval) {
      autoSaveInterval = setInterval(() => {
        if (isDirty) {
          saveExplorationToStorage(activeCells, activeAreas);
          const currentUid = explorationUserId;
          if (currentUid) {
            syncExplorationToSupabase(activeCells, activeAreas, currentUid);
          }
          isDirty = false;
        }
      }, 3500);

      const handleExit = () => {
        if (isDirty) {
          saveExplorationToStorage(activeCells, activeAreas);
          const currentUid = explorationUserId;
          if (currentUid) {
            syncExplorationToSupabase(activeCells, activeAreas, currentUid);
          }
          isDirty = false;
        }
      };

      window.addEventListener('beforeunload', handleExit);
      window.addEventListener('pagehide', handleExit);
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') handleExit();
      });
    }
  },

  recordPosition: (x: number, z: number, layout?: Layout, terrain?: Terrain) => {
    if (!get().initialized) {
      get().init();
    }

    // Skip if movement since last sample is negligible (< 1.5 meters)
    if (lastSamplePosition) {
      const dx = x - lastSamplePosition.x;
      const dz = z - lastSamplePosition.z;
      if (dx * dx + dz * dz < 2.25) {
        return { newCell: false, newArea: null };
      }
    }
    lastSamplePosition = { x, z };

    let newCellAdded = false;
    let newAreaDiscovered: string | null = null;

    // 1. Check Grid Cell
    const cellKey = getGridCellKey(x, z);
    if (!activeCells.has(cellKey)) {
      activeCells.add(cellKey);
      newCellAdded = true;
      isDirty = true;
    }

    // 2. Check Named District / Landmark / Nature Zone
    if (layout && terrain) {
      const area = areaAt(x, z, layout, terrain);
      if (area && area.name && !activeAreas.has(area.name)) {
        activeAreas.add(area.name);
        newAreaDiscovered = area.name;
        isDirty = true;
      }
    }

    if (newCellAdded || newAreaDiscovered) {
      set({
        exploredCells: activeCells,
        exploredAreas: activeAreas,
        exploredCellsCount: activeCells.size,
        exploredAreasCount: activeAreas.size,
        ...(newAreaDiscovered ? { newDiscoveryToast: newAreaDiscovered } : {}),
      });
    }

    return { newCell: newCellAdded, newArea: newAreaDiscovered };
  },

  isCellExplored: (x: number, z: number) => {
    if (!get().initialized) get().init();
    return activeCells.has(getGridCellKey(x, z));
  },

  isAreaExplored: (name: string) => {
    if (!get().initialized) get().init();
    return activeAreas.has(name);
  },

  isPlotExplored: (plot: { x: number; z: number; district?: string }) => {
    if (!get().initialized) get().init();
    if (plot.district && activeAreas.has(plot.district)) return true;
    return activeCells.has(getGridCellKey(plot.x, plot.z));
  },

  isChunkExplored: (chunkCodeOrName: string) => {
    if (!get().initialized) get().init();
    return activeAreas.has(chunkCodeOrName);
  },

  getExplorationProgress: (totalWorldAreas = 15) => {
    if (!get().initialized) get().init();
    const discovered = activeAreas.size;
    const pct = totalWorldAreas > 0 ? Math.min(100, Math.round((discovered / totalWorldAreas) * 100)) : 0;
    return {
      discoveredAreas: discovered,
      totalAreas: totalWorldAreas,
      percentage: pct,
      discoveredCells: activeCells.size,
    };
  },

  clearToast: () => {
    set({ newDiscoveryToast: null });
  },

  flushSave: () => {
    if (isDirty) {
      saveExplorationToStorage(activeCells, activeAreas);
      isDirty = false;
    }
  },

  resetExploration: () => {
    // Only triggered when user explicitly invokes reset
    activeCells.clear();
    activeAreas.clear();
    lastSamplePosition = null;
    isDirty = false;
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(EXPLORATION_STORAGE_KEY);
        localStorage.removeItem(LEGACY_DISCOVERED_KEY);
      } catch (err) {
        console.warn('[Exploration] Storage reset failed:', err);
      }
    }
    set({
      exploredCells: activeCells,
      exploredAreas: activeAreas,
      exploredCellsCount: 0,
      exploredAreasCount: 0,
    });
  },
}));
