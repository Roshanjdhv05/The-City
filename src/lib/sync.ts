'use client';
import { supabase } from './supabase';
import { EXPLORATION_STORAGE_KEY, LEGACY_DISCOVERED_KEY } from './exploration';

export const MIGRATION_FLAG_KEY = 'thecity.migration.v1';

// ─────────────────────────────────────────────────────────────────────────────
// Exploration Synchronization
// ─────────────────────────────────────────────────────────────────────────────
export async function syncExplorationToSupabase(
  cells: Set<string>,
  areas: Set<string>,
  userId: string
): Promise<void> {
  if (!supabase || !userId || userId.startsWith('demo-')) return;

  try {
    const cellsArray = Array.from(cells);
    const areasArray = Array.from(areas);

    // Try RPC first for atomic additive merge on the database
    const { error: rpcErr } = await supabase.rpc('sync_user_exploration', {
      p_cells: cellsArray,
      p_areas: areasArray,
    });

    if (rpcErr) {
      // Fallback: direct upsert
      const { data: existing } = await supabase
        .from('user_exploration')
        .select('cells, areas')
        .eq('user_id', userId)
        .maybeSingle();

      const mergedCells = Array.from(new Set([...(existing?.cells || []), ...cellsArray]));
      const mergedAreas = Array.from(new Set([...(existing?.areas || []), ...areasArray]));

      await supabase.from('user_exploration').upsert({
        user_id: userId,
        cells: mergedCells,
        areas: mergedAreas,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
    }
  } catch (err) {
    console.warn('[Sync] Exploration sync to Supabase failed:', err);
  }
}

export async function loadExplorationFromSupabase(
  userId: string
): Promise<{ cells: string[]; areas: string[] } | null> {
  if (!supabase || !userId || userId.startsWith('demo-')) return null;

  try {
    const { data, error } = await supabase
      .from('user_exploration')
      .select('cells, areas')
      .eq('user_id', userId)
      .maybeSingle();

    if (!error && data) {
      return {
        cells: Array.isArray(data.cells) ? data.cells : [],
        areas: Array.isArray(data.areas) ? data.areas : [],
      };
    }
  } catch (err) {
    console.warn('[Sync] Exploration fetch from Supabase failed:', err);
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Inventory Synchronization
// ─────────────────────────────────────────────────────────────────────────────
export async function syncInventoryToSupabase(
  inv: { wood: number; stone: number; crystal: number },
  userId: string
): Promise<void> {
  if (!supabase || !userId || userId.startsWith('demo-')) return;

  try {
    await supabase.from('user_inventory').upsert({
      user_id: userId,
      wood: Math.max(0, inv.wood || 0),
      stone: Math.max(0, inv.stone || 0),
      crystal: Math.max(0, inv.crystal || 0),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });
  } catch (err) {
    console.warn('[Sync] Inventory sync to Supabase failed:', err);
  }
}

export async function loadInventoryFromSupabase(
  userId: string
): Promise<{ wood: number; stone: number; crystal: number } | null> {
  if (!supabase || !userId || userId.startsWith('demo-')) return null;

  try {
    const { data, error } = await supabase
      .from('user_inventory')
      .select('wood, stone, crystal')
      .eq('user_id', userId)
      .maybeSingle();

    if (!error && data) {
      return {
        wood: Number(data.wood) || 0,
        stone: Number(data.stone) || 0,
        crystal: Number(data.crystal) || 0,
      };
    }
  } catch (err) {
    console.warn('[Sync] Inventory fetch from Supabase failed:', err);
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Saved / Bookmarked Plots Synchronization
// ─────────────────────────────────────────────────────────────────────────────
export async function syncSavedPlotsToSupabase(
  plotIds: string[],
  userId: string
): Promise<void> {
  if (!supabase || !userId || userId.startsWith('demo-')) return;

  try {
    await supabase.from('user_saved_plots').upsert({
      user_id: userId,
      plot_ids: plotIds,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });
  } catch (err) {
    console.warn('[Sync] Saved plots sync to Supabase failed:', err);
  }
}

export async function loadSavedPlotsFromSupabase(
  userId: string
): Promise<string[] | null> {
  if (!supabase || !userId || userId.startsWith('demo-')) return null;

  try {
    const { data, error } = await supabase
      .from('user_saved_plots')
      .select('plot_ids')
      .eq('user_id', userId)
      .maybeSingle();

    if (!error && data && Array.isArray(data.plot_ids)) {
      return data.plot_ids;
    }
  } catch (err) {
    console.warn('[Sync] Saved plots fetch from Supabase failed:', err);
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Safe LocalStorage to Supabase Migration
// ─────────────────────────────────────────────────────────────────────────────
export async function runLocalStorageMigration(userId: string): Promise<void> {
  if (!supabase || !userId || userId.startsWith('demo-') || typeof window === 'undefined') {
    return;
  }

  try {
    const alreadyMigrated = localStorage.getItem(MIGRATION_FLAG_KEY);
    if (alreadyMigrated === 'done') {
      return;
    }

    console.log('[Migration] Starting safe LocalStorage to Supabase migration for user:', userId);

    // 1. Migrate Exploration Progress (exploration.v1 + legacy discovered)
    const localCells = new Set<string>();
    const localAreas = new Set<string>();

    const rawExp = localStorage.getItem(EXPLORATION_STORAGE_KEY);
    if (rawExp) {
      try {
        const p = JSON.parse(rawExp);
        if (Array.isArray(p.cells)) p.cells.forEach((c: any) => typeof c === 'string' && localCells.add(c));
        if (Array.isArray(p.areas)) p.areas.forEach((a: any) => typeof a === 'string' && localAreas.add(a));
      } catch {}
    }

    const rawLegacy = localStorage.getItem(LEGACY_DISCOVERED_KEY);
    if (rawLegacy) {
      try {
        const p = JSON.parse(rawLegacy);
        if (Array.isArray(p)) p.forEach((a: any) => typeof a === 'string' && localAreas.add(a));
      } catch {}
    }

    if (localCells.size > 0 || localAreas.size > 0) {
      await syncExplorationToSupabase(localCells, localAreas, userId);
    }

    // 2. Migrate Inventory
    const rawInv = localStorage.getItem('thecity.inv');
    if (rawInv) {
      try {
        const inv = JSON.parse(rawInv);
        if (inv && typeof inv === 'object') {
          await syncInventoryToSupabase({
            wood: Number(inv.wood) || 0,
            stone: Number(inv.stone) || 0,
            crystal: Number(inv.crystal) || 0,
          }, userId);
        }
      } catch {}
    }

    // 3. Migrate Saved / Bookmarked Plots
    const rawSaved = localStorage.getItem('thecity.saved');
    if (rawSaved) {
      try {
        const saved = JSON.parse(rawSaved);
        if (Array.isArray(saved) && saved.length > 0) {
          await syncSavedPlotsToSupabase(saved, userId);
        }
      } catch {}
    }

    // 4. Migrate Promo Redemptions (if any recorded in local demo mode)
    const rawPromo = localStorage.getItem('thecity.promo_redemptions');
    if (rawPromo) {
      try {
        const promos = JSON.parse(rawPromo);
        if (Array.isArray(promos)) {
          for (const item of promos) {
            if (item && item.code && item.plotId) {
              await supabase.from('promo_redemptions').insert({
                promo_code: item.code,
                user_id: userId,
                plot_id: item.plotId,
              }).select();
            }
          }
        }
      } catch {}
    }

    // 5. Mark migration as successfully complete
    // DO NOT delete LocalStorage data immediately; it remains as fallback and cache
    localStorage.setItem(MIGRATION_FLAG_KEY, 'done');
    console.log('[Migration] Migration completed successfully.');
  } catch (err) {
    console.warn('[Migration] Error during LocalStorage migration:', err);
  }
}
