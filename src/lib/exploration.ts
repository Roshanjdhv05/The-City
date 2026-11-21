'use client';
import { create } from 'zustand';
import type { Layout } from './layout';
import type { Terrain } from './terrain';
import { areaAt, Area, NATURE } from './areas';

export const GRID_CELL_SIZE = 24; // 24-meter grid cell resolution
export const EXPLORATION_STORAGE_KEY = 'thecity.exploration.v1';
export const LEGACY_DISCOVERED_KEY = 'thecity.discovered';

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

/** Safely write exploration data to LocalStorage */
export function saveExplorationToStorage(cells: Set<string>, areas: Set<string>): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const payload: ExplorationPayload = {
      v: 1,
      cells: Array.from(cells),
      areas: Array.from(areas),
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

  init: () => void;
  recordPosition: (x: number, z: number, layout?: Layout, terrain?: Terrain) => { newCell: boolean; newArea: string | null };
  isCellExplored: (x: number, z: number) => boolean;
  isAreaExplored: (name: string) => boolean;
  clearToast: () => void;
  flushSave: () => void;
}

// In-memory persistent tracking state
let activeCells = new Set<string>();
let activeAreas = new Set<string>();
let isDirty = false;
let autoSaveInterval: NodeJS.Timeout | null = null;
let lastSamplePosition: { x: number; z: number } | null = null;

export const useExplorationStore = create<ExplorationState>((set, get) => ({
  exploredCells: activeCells,
  exploredAreas: activeAreas,
  exploredCellsCount: 0,
  exploredAreasCount: 0,
  newDiscoveryToast: null,
  initialized: false,

  init: () => {
    if (get().initialized) return;

    const { cells, areas } = loadExplorationFromStorage();
    activeCells = cells;
    activeAreas = areas;
    isDirty = false;

    set({
      exploredCells: activeCells,
      exploredAreas: activeAreas,
      exploredCellsCount: activeCells.size,
      exploredAreasCount: activeAreas.size,
      initialized: true,
    });

    // Auto-save debounced timer: every 3.5 seconds if dirty
    if (typeof window !== 'undefined' && !autoSaveInterval) {
      autoSaveInterval = setInterval(() => {
        if (isDirty) {
          saveExplorationToStorage(activeCells, activeAreas);
          isDirty = false;
        }
      }, 3500);

      const handleExit = () => {
        if (isDirty) {
          saveExplorationToStorage(activeCells, activeAreas);
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
    return activeCells.has(getGridCellKey(x, z));
  },

  isAreaExplored: (name: string) => {
    return activeAreas.has(name);
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
}));
