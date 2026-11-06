const { generateCity, CITY, DISTRICTS } = require('./dist/city.js');
const { bandHit } = require('./dist/layout.js');

const city = generateCity();
const layout = { plots: city.plots, roads: city.roads, byId: new Map(city.plots.map(p => [p.id, p])) };

const toWorld = (p, lx, lz) => {
  const c = Math.cos(p.rot), s = Math.sin(p.rot);
  return [p.x + lx * c + lz * s, p.z - lx * s + lz * c];
};

const toLocal = (p, wx, wz) => {
  const dx = wx - p.x, dz = wz - p.z;
  const c = Math.cos(-p.rot), s = Math.sin(-p.rot);
  return [dx * c + dz * s, -dx * s + dz * c];
};

// Spatial index for plots
const cellSize = 20;
const plotCells = new Map();
const cellKey = (cx, cz) => `${cx}|${cz}`;

layout.plots.forEach((p) => {
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
});

function getNearbyPlots(wx, wz) {
  const cx = Math.floor(wx / cellSize), cz = Math.floor(wz / cellSize);
  const k = cellKey(cx, cz);
  return plotCells.get(k) || [];
}

function hitBuildingOrEntrance(wx, wz, margin = 0.25) {
  const nearby = getNearbyPlots(wx, wz);
  for (const p of nearby) {
    const [lx, lz] = toLocal(p, wx, wz);
    if (p.landmark) {
      if (Math.abs(lx) <= 13.5 + margin && Math.abs(lz - 2.5) <= 9.5 + margin) return true;
      continue;
    }
    const bw = 10, bd = 8;
    const lim = Math.max(0, p.d / 2 - bd / 2);
    const oz = Math.max(-lim, Math.min(lim, (p.d - 12) / 2));

    // Building body
    if (Math.abs(lx) <= bw / 2 + margin && Math.abs(lz - oz) <= bd / 2 + margin) return true;

    // Entrance corridor: strictly unobstructed
    if (Math.abs(lx) <= 2.2 + margin && lz >= oz + bd / 2 - 0.4) return true;

    // Outdoor board monument sign:
    if (lx >= -4.8 - margin && lx <= -1.8 + margin && lz >= oz + bd / 2 - 0.2 && lz <= oz + bd / 2 + 2.2) return true;
  }
  return false;
}

const trees = [];
const bushes = [];

// Spatial hash for placed trees & bushes to avoid excessive clustering
const vegCell = 6;
const treeCells = new Map();
const bushCells = new Map();

function tryAddTree(wx, wz, k, c) {
  if (bandHit(layout.roads, wx, wz, 1.2)) return false;
  if (hitBuildingOrEntrance(wx, wz, 0.35)) return false;
  if (Math.hypot(wx, wz) < CITY.plazaR - 3.5) return false;

  const cx = Math.floor(wx / vegCell), cz = Math.floor(wz / vegCell);
  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      const list = treeCells.get(cellKey(cx + dx, cz + dz));
      if (list) {
        for (const t of list) {
          if (Math.hypot(t.x - wx, t.z - wz) < 2.3) return false;
        }
      }
    }
  }

  const t = { x: wx, z: wz, k, c };
  trees.push(t);
  const ck = cellKey(cx, cz);
  let list = treeCells.get(ck);
  if (!list) { list = []; treeCells.set(ck, list); }
  list.push(t);
  return true;
}

function tryAddBush(wx, wz, s, c) {
  if (bandHit(layout.roads, wx, wz, 0.45)) return false;
  if (hitBuildingOrEntrance(wx, wz, 0.15)) return false;
  if (Math.hypot(wx, wz) < CITY.plazaR - 3.5) return false;

  const cx = Math.floor(wx / vegCell), cz = Math.floor(wz / vegCell);
  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      const list = bushCells.get(cellKey(cx + dx, cz + dz));
      if (list) {
        for (const b of list) {
          if (Math.hypot(b.x - wx, b.z - wz) < 0.95) return false;
        }
      }
    }
  }

  const b = { x: wx, z: wz, s, c };
  bushes.push(b);
  const ck = cellKey(cx, cz);
  let list = bushCells.get(ck);
  if (!list) { list = []; bushCells.set(ck, list); }
  list.push(b);
  return true;
}

const t0 = Date.now();

// 1. Direct Building Perimeters:
const GREENS = ['#5fae48', '#6bb852', '#4f9b40', '#79c05a', '#468f3c', '#86c864', '#7bc950', '#8cd35e'];
let pIdx = 0;
for (const p of layout.plots) {
  pIdx++;
  if (p.landmark) continue;
  const bw = 10, bd = 8;
  const lim = Math.max(0, p.d / 2 - bd / 2);
  const oz = Math.max(-lim, Math.min(lim, (p.d - 12) / 2));

  // Rear garden:
  for (let sx = -p.w * 0.38; sx <= p.w * 0.38; sx += 2.0) {
    const [wx, wz] = toWorld(p, sx, oz - bd / 2 - 1.3);
    tryAddTree(wx, wz, 0.9 + ((pIdx + sx) % 3) * 0.12, GREENS[pIdx % GREENS.length]);
    const [bx, bz] = toWorld(p, sx + 0.6, oz - bd / 2 - 0.7);
    tryAddBush(bx, bz, 0.65, GREENS[(pIdx + 1) % GREENS.length]);
  }

  // Left & right flanks:
  for (const side of [-1, 1]) {
    for (let sz = oz - 2.8; sz <= oz + 2.2; sz += 2.0) {
      const [wx, wz] = toWorld(p, side * (bw / 2 + 1.1), sz);
      tryAddTree(wx, wz, 0.82 + (pIdx % 3) * 0.1, GREENS[(pIdx + side + 8) % GREENS.length]);
      const [bx, bz] = toWorld(p, side * (bw / 2 + 0.65), sz);
      tryAddBush(bx, bz, 0.6, GREENS[(pIdx + 2) % GREENS.length]);
    }
  }

  // Front corners flanking entrance:
  const [rcx, rcz] = toWorld(p, p.w * 0.36, oz + bd / 2 + 1.0);
  tryAddTree(rcx, rcz, 0.8, GREENS[(pIdx + 3) % GREENS.length]);
  const [rcbx, rcbz] = toWorld(p, p.w * 0.3, oz + bd / 2 + 0.7);
  tryAddBush(rcbx, rcbz, 0.55, GREENS[(pIdx + 4) % GREENS.length]);

  const [lcx, lcz] = toWorld(p, -p.w * 0.38, oz + bd / 2 + 1.2);
  tryAddTree(lcx, lcz, 0.78, GREENS[(pIdx + 5) % GREENS.length]);
  const [lcbx, lcbz] = toWorld(p, -p.w * 0.36, oz + bd / 2 + 0.7);
  tryAddBush(lcbx, lcbz, 0.55, GREENS[(pIdx + 6) % GREENS.length]);
}

// 2. Open Spaces / Wedges / Parkway Bands:
// Sample across concentric rings from R0 to Ro
for (let r = CITY.R0 + 3.5; r <= CITY.Ro - 2; r += 5.0) {
  const circ = 2 * Math.PI * r;
  const count = Math.floor(circ / 5.0);
  for (let i = 0; i < count; i++) {
    // Add subtle jitter for organic feel
    const baseAng = (i / count) * 2 * Math.PI;
    const jAng = baseAng + Math.sin(i * 13.7 + r * 7.1) * 0.015;
    const jR = r + Math.cos(i * 9.3 + r * 11.2) * 0.9;
    const wx = jR * Math.sin(jAng);
    const wz = -jR * Math.cos(jAng);

    const k = 0.75 + Math.abs(Math.sin(i * 5.3 + r * 2.1)) * 0.45;
    const col = GREENS[Math.abs(Math.floor(Math.sin(i * 7 + r) * 100)) % GREENS.length];

    if (!tryAddTree(wx, wz, k, col)) {
      // If tree doesn't fit, try small bush
      tryAddBush(wx, wz, 0.5 + Math.abs(Math.sin(i * 3.1)) * 0.25, col);
    } else {
      // If tree was added, try adding an accompanying small bush nearby
      const bAng = jAng + 0.02;
      const bx = (jR + 0.7) * Math.sin(bAng), bz = -(jR + 0.7) * Math.cos(bAng);
      tryAddBush(bx, bz, 0.55, GREENS[(Math.floor(i) + 2) % GREENS.length]);
    }
  }
}

const t1 = Date.now();
console.log(`Placed ${trees.length} trees, ${bushes.length} bushes in ${t1 - t0}ms`);
