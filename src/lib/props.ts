import type { Layout } from './layout';
import { layoutBounds, plotRect, bandHit, intersections } from './layout';
import { OBSTACLES, PLAZA, toWorld } from './plots';
import { plotPoly, pointInPoly, Rect, Pt } from './geom';
import type { Terrain } from './terrain';
import type { ResNode } from './resources';
import { CITY } from './city';
import type { Plot } from './types';

export interface Lamp { x: number; z: number; dx: number; dz: number }
export interface Tree { x: number; y: number; z: number; k: number; c: string }
export interface Bench { x: number; z: number; rot: number }
export interface Blob { x: number; y: number; z: number; s: number; c: string }
export interface PropQuality { trees: number; forest: number; radius: number }

const GREENS = [
  '#5fae48', '#6bb852', '#4f9b40', '#79c05a',
  '#468f3c', '#86c864', '#7bc950', '#8cd35e',
  '#52a23e', '#61a843', '#72b94f', '#448b37'
];
const PINES = ['#3f8f5f', '#357f52', '#4a9a6b'];
const FLOWERS = ['#ffffff', '#ffd6e7', '#fff0a8', '#e6dcff', '#ffb3a1'];
const rnd = (seed: number) => { let s = seed; return () => ((s = (s * 16807) % 2147483647) / 2147483647); };

/** Street furniture, realistic lush vegetation filling all open green spaces, and wilderness outside the city. */
export function genProps(layout: Layout, q: PropQuality, terrain: Terrain) {
  const lamps: Lamp[] = [];
  const trees: Tree[] = [];
  const benches: Bench[] = [];
  const pines: Tree[] = [];
  const rocks: Blob[] = [];
  const bushes: Blob[] = [];
  const flowers: Blob[] = [];
  const resources: ResNode[] = [];
  const ponds: { x: number; z: number; r: number }[] = [];

  const ty = (x: number, z: number) => terrain.height(x, z);

  // 1. Spatial grid index for plots to perform ultra-fast building, entrance, and outdoor board collision checks
  const cellSize = 22;
  const plotCells = new Map<string, Plot[]>();
  const cellKey = (cx: number, cz: number) => `${cx}|${cz}`;

  for (let i = 0; i < layout.plots.length; i++) {
    const p = layout.plots[i];
    const minX = Math.floor((p.x - p.w) / cellSize), maxX = Math.floor((p.x + p.w) / cellSize);
    const minZ = Math.floor((p.z - p.d) / cellSize), maxZ = Math.floor((p.z + p.d) / cellSize);
    for (let cx = minX; cx <= maxX; cx++) {
      for (let cz = minZ; cz <= maxZ; cz++) {
        const k = cellKey(cx, cz);
        let list = plotCells.get(k);
        if (!list) { list = []; plotCells.set(k, list); }
        list.push(p);
      }
    }
  }

  // Exact obstacle check for buildings and entrance corridors
  const hitBuildingOrEntrance = (wx: number, wz: number, margin = 0.25): boolean => {
    const cx = Math.floor(wx / cellSize), cz = Math.floor(wz / cellSize);
    const nearby = plotCells.get(cellKey(cx, cz));
    if (!nearby) return false;
    for (let i = 0; i < nearby.length; i++) {
      const p = nearby[i];
      const dx = wx - p.x, dz = wz - p.z;
      const c = Math.cos(-p.rot), s = Math.sin(-p.rot);
      const lx = dx * c + dz * s, lz = -dx * s + dz * c;

      if (p.landmark) {
        if (Math.abs(lx) <= 13.5 + margin && Math.abs(lz - 2.5) <= 9.5 + margin) return true;
        continue;
      }

      const bw = 10, bd = 8;
      const lim = Math.max(0, p.d / 2 - bd / 2);
      const oz = Math.max(-lim, Math.min(lim, (p.d - 12) / 2));

      // Building body footprint
      if (Math.abs(lx) <= bw / 2 + margin && Math.abs(lz - oz) <= bd / 2 + margin) return true;

      // Entrance corridor: strictly unobstructed (front entrance door & sidewalk walkway)
      if (Math.abs(lx) <= 2.2 + margin && lz >= oz + bd / 2 - 0.4) return true;

      // Outdoor board monument sign:
      if (lx >= -4.8 - margin && lx <= -1.8 + margin && lz >= oz + bd / 2 - 0.2 && lz <= oz + bd / 2 + 2.2) return true;
    }
    return false;
  };

  // Spatial grids for placed vegetation to maintain natural spacing
  const vegCell = 6;
  const treeCells = new Map<string, Tree[]>();
  const bushCells = new Map<string, Blob[]>();

  const tryAddTree = (wx: number, wz: number, k: number, col?: string): boolean => {
    if (bandHit(layout.roads, wx, wz, 1.25)) return false;
    if (hitBuildingOrEntrance(wx, wz, 0.35)) return false;
    if (Math.hypot(wx, wz) < CITY.plazaR - 3.5) return false;
    if (OBSTACLES.some(o => Math.hypot(wx - o.cx, wz - o.cz) < o.r + 1)) return false;

    const cx = Math.floor(wx / vegCell), cz = Math.floor(wz / vegCell);
    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        const list = treeCells.get(cellKey(cx + dx, cz + dz));
        if (list) {
          for (let i = 0; i < list.length; i++) {
            const t = list[i];
            if (Math.hypot(t.x - wx, t.z - wz) < 2.2) return false;
          }
        }
      }
    }

    const t: Tree = { x: wx, y: ty(wx, wz), z: wz, k, c: col || GREENS[(trees.length * 7) % GREENS.length] };
    trees.push(t);
    const ck = cellKey(cx, cz);
    let list = treeCells.get(ck);
    if (!list) { list = []; treeCells.set(ck, list); }
    list.push(t);
    return true;
  };

  const tryAddBush = (wx: number, wz: number, s: number, col?: string, withFlower = false): boolean => {
    if (bandHit(layout.roads, wx, wz, 0.45)) return false;
    if (hitBuildingOrEntrance(wx, wz, 0.15)) return false;
    if (Math.hypot(wx, wz) < CITY.plazaR - 3.5) return false;
    if (OBSTACLES.some(o => Math.hypot(wx - o.cx, wz - o.cz) < o.r + 1)) return false;

    const cx = Math.floor(wx / vegCell), cz = Math.floor(wz / vegCell);
    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        const list = bushCells.get(cellKey(cx + dx, cz + dz));
        if (list) {
          for (let i = 0; i < list.length; i++) {
            const b = list[i];
            if (Math.hypot(b.x - wx, b.z - wz) < 0.95) return false;
          }
        }
      }
    }

    const y = ty(wx, wz) + 0.08;
    const b: Blob = { x: wx, y, z: wz, s, c: col || GREENS[(bushes.length * 5) % GREENS.length] };
    bushes.push(b);
    const ck = cellKey(cx, cz);
    let list = bushCells.get(ck);
    if (!list) { list = []; bushCells.set(ck, list); }
    list.push(b);

    if (withFlower) {
      flowers.push({ x: wx + 0.15, y: y + s * 0.45, z: wz, s: 0.12, c: FLOWERS[flowers.length % FLOWERS.length] });
    }
    return true;
  };

  // 2. Street Furniture (Lamps & Central Plaza Benches)
  layout.plots.forEach((p, i) => {
    if (p.landmark) return;
    const cent = p.district === 'Central District';
    if (i % 2 === 0) {
      const [x, z] = toWorld(p, p.w / 2 + 1, p.d / 2 + 0.4);
      if (!bandHit(layout.roads, x, z, 0.3) && !hitBuildingOrEntrance(x, z, 0.2)) {
        lamps.push({ x, z, dx: Math.sin(p.rot), dz: Math.cos(p.rot) });
      }
    }
    if (cent) {
      const [bx, bz] = toWorld(p, -p.w / 2 + 2, p.d / 2 + 0.2);
      benches.push({ x: bx, z: bz, rot: p.rot });
    }
  });

  // Junction lamps on major roads
  for (const j of intersections(layout.roads)) {
    if (j.a.w < 12 || j.b.w < 12) continue;
    for (const sa of [-1, 1]) {
      for (const sb of [-1, 1]) {
        const ox = sa * j.ea[0] * (j.b.w / 2 + 0.6) + sb * j.eb[0] * (j.a.w / 2 + 0.6);
        const oz = sa * j.ea[1] * (j.b.w / 2 + 0.6) + sb * j.eb[1] * (j.a.w / 2 + 0.6);
        const x = j.x + ox, z = j.z + oz;
        if (bandHit(layout.roads, x, z, 0.3) || hitBuildingOrEntrance(x, z, 0.3) || lamps.some(l => Math.hypot(l.x - x, l.z - z) < 3)) continue;
        const L = Math.hypot(ox, oz) || 1;
        lamps.push({ x, z, dx: -ox / L, dz: -oz / L });
      }
    }
  }

  // 3. Central Plaza Landscape Rings
  for (let a = 0; a < 16; a++) {
    const ang = (a / 16) * Math.PI * 2;
    const x = Math.cos(ang) * (PLAZA.r - 4), z = Math.sin(ang) * (PLAZA.r - 4);
    tryAddTree(x, z, 1.15, GREENS[a % GREENS.length]);
    const bx = Math.cos(ang + 0.1) * (PLAZA.r - 3.2), bz = Math.sin(ang + 0.1) * (PLAZA.r - 3.2);
    tryAddBush(bx, bz, 0.65, GREENS[(a + 2) % GREENS.length], a % 3 === 0);
  }
  for (let a = 0; a < 8; a++) {
    const ang = ((a + 0.5) / 8) * Math.PI * 2;
    const x = Math.cos(ang) * (PLAZA.r - 9), z = Math.sin(ang) * (PLAZA.r - 9);
    benches.push({ x, z, rot: Math.atan2(x, z) });
  }

  // 4. Detailed Building Perimeters (Rear Gardens, Flanks, Front Corners)
  layout.plots.forEach((p, pIdx) => {
    if (p.landmark) return;
    const bw = 10, bd = 8;
    const lim = Math.max(0, p.d / 2 - bd / 2);
    const oz = Math.max(-lim, Math.min(lim, (p.d - 12) / 2));

    // A. Rear Garden: trees & continuous bushes behind the building
    for (let sx = -p.w * 0.38; sx <= p.w * 0.38; sx += 2.0) {
      const [wx, wz] = toWorld(p, sx, oz - bd / 2 - 1.3);
      tryAddTree(wx, wz, 0.9 + ((pIdx + sx) % 3) * 0.12, GREENS[pIdx % GREENS.length]);
      const [bx, bz] = toWorld(p, sx + 0.6, oz - bd / 2 - 0.7);
      tryAddBush(bx, bz, 0.65, GREENS[(pIdx + 1) % GREENS.length], Math.abs(sx) < 1.0);
    }

    // B. Left & Right Flanks: hedge borders & side trees between adjacent buildings
    for (const side of [-1, 1]) {
      for (let sz = oz - 2.8; sz <= oz + 2.2; sz += 2.0) {
        const [wx, wz] = toWorld(p, side * (bw / 2 + 1.1), sz);
        tryAddTree(wx, wz, 0.82 + (pIdx % 3) * 0.1, GREENS[(pIdx + side + 8) % GREENS.length]);
        const [bx, bz] = toWorld(p, side * (bw / 2 + 0.65), sz);
        tryAddBush(bx, bz, 0.6, GREENS[(pIdx + 2) % GREENS.length], pIdx % 4 === 0);
      }
    }

    // C. Front Corners flanking entrance (ENTRANCE WALKWAY IS STRICTLY 100% CLEAR)
    const [rcx, rcz] = toWorld(p, p.w * 0.36, oz + bd / 2 + 1.0);
    tryAddTree(rcx, rcz, 0.8, GREENS[(pIdx + 3) % GREENS.length]);
    const [rcbx, rcbz] = toWorld(p, p.w * 0.3, oz + bd / 2 + 0.7);
    tryAddBush(rcbx, rcbz, 0.55, GREENS[(pIdx + 4) % GREENS.length], true);

    const [lcx, lcz] = toWorld(p, -p.w * 0.38, oz + bd / 2 + 1.2);
    tryAddTree(lcx, lcz, 0.78, GREENS[(pIdx + 5) % GREENS.length]);
    const [lcbx, lcbz] = toWorld(p, -p.w * 0.36, oz + bd / 2 + 0.7);
    tryAddBush(lcbx, lcbz, 0.55, GREENS[(pIdx + 6) % GREENS.length], false);
  });

  // 5. Open Spaces / Wedges / Parkway Bands (Matching Reference Image)
  // Systematically fill the open green corridors, wedge parks, and radial avenue borders
  for (let r = CITY.R0 + 3.0; r <= CITY.Ro - 2.0; r += 4.5) {
    const circ = 2 * Math.PI * r;
    const count = Math.floor(circ / 4.6);
    for (let i = 0; i < count; i++) {
      // Natural jitter for organic, non-repeating distribution
      const baseAng = (i / count) * 2 * Math.PI;
      const jAng = baseAng + Math.sin(i * 13.7 + r * 7.1) * 0.016;
      const jR = r + Math.cos(i * 9.3 + r * 11.2) * 0.85;
      const wx = jR * Math.sin(jAng);
      const wz = -jR * Math.cos(jAng);

      const k = 0.75 + Math.abs(Math.sin(i * 5.3 + r * 2.1)) * 0.45;
      const col = GREENS[Math.abs(Math.floor(Math.sin(i * 7 + r) * 100)) % GREENS.length];

      if (!tryAddTree(wx, wz, k, col)) {
        // If tree can't fit due to road/building buffer, try placing a low bush
        tryAddBush(wx, wz, 0.5 + Math.abs(Math.sin(i * 3.1)) * 0.25, col, i % 6 === 0);
      } else {
        // If tree is placed, add an accompanying understory bush nearby
        const bAng = jAng + 0.02;
        const bx = (jR + 0.7) * Math.sin(bAng), bz = -(jR + 0.7) * Math.cos(bAng);
        tryAddBush(bx, bz, 0.55, GREENS[(Math.floor(i) + 2) % GREENS.length], i % 5 === 0);
      }
    }
  }

  // 6. Wilderness (Outside the city only): forests, pines, rocks, and gatherable resources
  const cx = (terrain.city.x0 + terrain.city.x1) / 2;
  const cz = (terrain.city.z0 + terrain.city.z1) / 2;
  const half = Math.max(terrain.city.x1 - terrain.city.x0, terrain.city.z1 - terrain.city.z0) / 2;
  const cell = 10, R = half + q.radius * 0.7, r2 = rnd(7);
  let forestCount = 0, rockCount = 0;

  for (let ix = -R / cell; ix <= R / cell && forestCount < q.forest; ix++) {
    for (let iz = -R / cell; iz <= R / cell && forestCount < q.forest; iz++) {
      const x = cx + (ix + r2()) * cell, z = cz + (iz + r2()) * cell;
      if (terrain.outside(x, z) < 26 || terrain.riverDist(x, z) < 13) continue;
      const h = ty(x, z), f = terrain.forest(x, z), roll = r2();
      if (h > 48) {
        if (h < 60 && roll < 0.08) rocks.push({ x, y: h, z, s: 0.8 + r2() * 1.6, c: '#a29cae' });
        continue;
      }
      if (h > 12 && f > 0.42 && roll < 0.85) {
        pines.push({ x, y: h, z, k: 0.9 + r2() * 0.9, c: PINES[(r2() * 3) | 0] });
        forestCount++;
      } else if (f > 0.52 && roll < 0.8) {
        trees.push({ x, y: h, z, k: 0.8 + r2() * 0.9, c: GREENS[(r2() * 6) | 0] });
        forestCount++;
      } else if (f > 0.4 && roll < 0.12) {
        trees.push({ x, y: h, z, k: 0.7 + r2() * 0.6, c: GREENS[(r2() * 6) | 0] });
        forestCount++;
      } else if (roll > 0.965 && rockCount < 140) {
        rocks.push({ x, y: h, z, s: 0.6 + r2() * 1.4, c: ['#a5aebf', '#bcae98', '#9a94a6'][(r2() * 3) | 0] });
        rockCount++;
      }
      const rr = r2();
      if (f > 0.45 && h < 12 && rr < 0.035) resources.push({ id: `wood:${Math.round(x)}:${Math.round(z)}`, type: 'wood', x: x + 1.5, y: h, z });
      else if (h > 5 && h < 40 && rr > 0.975) resources.push({ id: `stone:${Math.round(x)}:${Math.round(z)}`, type: 'stone', x, y: h, z });
      else if (h > 14 && h < 55 && rr > 0.5 && rr < 0.54) resources.push({ id: `crystal:${Math.round(x)}:${Math.round(z)}`, type: 'crystal', x, y: h, z });
    }
  }

  return { lamps, trees, pines, rocks, benches, bushes, flowers, resources, ponds };
}
