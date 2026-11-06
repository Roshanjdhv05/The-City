export type ResType = 'wood' | 'stone' | 'crystal';
export interface ResNode { id: string; type: ResType; x: number; y: number; z: number }
export const RES_LABEL: Record<ResType, string> = { wood: 'Wood', stone: 'Stone', crystal: 'Crystal' };
const GAIN: Record<ResType, number> = { wood: 2, stone: 1, crystal: 1 };
export const RESPAWN_MS = 90_000;
const collectedAt = new Map<string, number>();
let version = 0;
export const inventory: Record<ResType, number> = { wood: 0, stone: 0, crystal: 0 };
export const getVersion = () => version;
export const isCollected = (id: string) => collectedAt.has(id);
export function loadInventory() { try { Object.assign(inventory, JSON.parse(localStorage.getItem('thecity.inv') || '{}')); } catch {} return { ...inventory }; }
const save = () => { try { localStorage.setItem('thecity.inv', JSON.stringify(inventory)); } catch {} };
export function nearestResource(nodes: ResNode[], x: number, z: number, r = 2.8): ResNode | null {
  let best: ResNode | null = null, bd = r;
  for (const n of nodes) { if (collectedAt.has(n.id)) continue; const d = Math.hypot(n.x - x, n.z - z); if (d < bd) { bd = d; best = n; } }
  return best;
}
export function collect(n: ResNode, now = Date.now()): boolean {
  if (collectedAt.has(n.id)) return false; collectedAt.set(n.id, now); inventory[n.type] += GAIN[n.type]; version++; save(); return true;
}
/** Nodes respawn after a while so the wilderness never runs out. Returns true when something respawned. */
export function tickRespawn(now = Date.now()) { let ch = false; collectedAt.forEach((t, id) => { if (now - t > RESPAWN_MS) { collectedAt.delete(id); ch = true; } }); if (ch) version++; return ch; }
export function resetResources() { collectedAt.clear(); version++; }
