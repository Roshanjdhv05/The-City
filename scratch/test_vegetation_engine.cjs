const fs = require('fs');
const { generateCity, CITY, DISTRICTS, plotHitsRoad } = require('./dist/city.js');
const { layoutBounds, bandHit } = require('./dist/layout.js');
const { Pt, bearingDir, polar, plotPoly, pointInPoly, polyRect, polysOverlap, D2R } = require('./dist/geom.js');

const city = generateCity();
const layout = { plots: city.plots, roads: city.roads, byId: new Map(city.plots.map(p => [p.id, p])) };

console.log('City generated with plots:', layout.plots.length, 'roads:', layout.roads.length);

// Let's implement the obstacle/collision test
const toWorld = (p, lx, lz) => {
  const c = Math.cos(p.rot), s = Math.sin(p.rot);
  return [p.x + lx * c + lz * s, p.z - lx * s + lz * c];
};

const toLocal = (p, wx, wz) => {
  const dx = wx - p.x, dz = wz - p.z;
  const c = Math.cos(-p.rot), s = Math.sin(-p.rot);
  return [dx * c + dz * s, -dx * s + dz * c];
};

// Spatial index for plots:
const plotCells = new Map();
const cellSize = 25;
const cellKey = (cx, cz) => `${cx}|${cz}`;

layout.plots.forEach((p, idx) => {
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

// Precise building + entrance obstacle check:
function hitBuildingOrEntrance(wx, wz, margin = 0.2) {
  const nearby = getNearbyPlots(wx, wz);
  for (const p of nearby) {
    const [lx, lz] = toLocal(p, wx, wz);
    if (p.landmark) {
      if (Math.abs(lx) <= 13 + margin && Math.abs(lz - 2.5) <= 9 + margin) return true;
      continue;
    }
    const bw = 10, bd = 8;
    const lim = Math.max(0, p.d / 2 - bd / 2);
    const oz = Math.max(-lim, Math.min(lim, (p.d - 12) / 2));

    // Inside building footprint:
    if (Math.abs(lx) <= bw / 2 + margin && Math.abs(lz - oz) <= bd / 2 + margin) return true;

    // Inside entrance corridor:
    if (Math.abs(lx) <= 2.2 + margin && lz >= oz + bd / 2 - 0.2) return true;

    // Inside outdoor board zone:
    if (lx >= -4.6 - margin && lx <= -2.0 + margin && lz >= oz + bd / 2 && lz <= oz + bd / 2 + 2.0) return true;
  }
  return false;
}

// Test road obstacle check:
function hitRoad(wx, wz, margin = 1.0) {
  return bandHit(layout.roads, wx, wz, margin);
}

// Let's test placing vegetation across the city!
const trees = [];
const bushes = [];

function tryAddTree(wx, wz, k, c) {
  if (hitRoad(wx, wz, 1.2)) return false;
  if (hitBuildingOrEntrance(wx, wz, 0.3)) return false;
  if (Math.hypot(wx, wz) < CITY.plazaR - 3) return false;
  // Spacing check:
  for (let i = trees.length - 1; i >= 0 && i >= trees.length - 40; i--) {
    const t = trees[i];
    if (Math.hypot(t.x - wx, t.z - wz) < 2.0) return false;
  }
  trees.push({ x: wx, z: wz, k, c });
  return true;
}

function tryAddBush(wx, wz, s, c) {
  if (hitRoad(wx, wz, 0.45)) return false;
  if (hitBuildingOrEntrance(wx, wz, 0.1)) return false;
  if (Math.hypot(wx, wz) < CITY.plazaR - 3) return false;
  // Spacing check:
  for (let i = bushes.length - 1; i >= 0 && i >= bushes.length - 40; i--) {
    const b = bushes[i];
    if (Math.hypot(b.x - wx, b.z - wz) < 0.8) return false;
  }
  bushes.push({ x: wx, z: wz, s, c });
  return true;
}

console.log('Testing placement algorithms...');
// 1. Plot perimeters:
for (const p of layout.plots) {
  if (p.landmark) continue;
  const bw = 10, bd = 8;
  const lim = Math.max(0, p.d / 2 - bd / 2);
  const oz = Math.max(-lim, Math.min(lim, (p.d - 12) / 2));

  // Rear
  for (let x = -p.w * 0.4; x <= p.w * 0.4; x += 1.8) {
    const [wx, wz] = toWorld(p, x, oz - bd / 2 - 1.2);
    tryAddTree(wx, wz, 0.9, '#5fae48');
    const [bx, bz] = toWorld(p, x + 0.5, oz - bd / 2 - 0.7);
    tryAddBush(bx, bz, 0.65, '#4f9b40');
  }

  // Left flank
  for (let z = oz - 2.8; z <= oz + 2.2; z += 1.8) {
    const [wx, wz] = toWorld(p, -bw / 2 - 1.0, z);
    tryAddTree(wx, wz, 0.85, '#6bb852');
    const [bx, bz] = toWorld(p, -bw / 2 - 0.6, z);
    tryAddBush(bx, bz, 0.6, '#5fae48');
  }

  // Right flank
  for (let z = oz - 2.8; z <= oz + 2.2; z += 1.8) {
    const [wx, wz] = toWorld(p, bw / 2 + 1.0, z);
    tryAddTree(wx, wz, 0.85, '#6bb852');
    const [bx, bz] = toWorld(p, bw / 2 + 0.6, z);
    tryAddBush(bx, bz, 0.6, '#5fae48');
  }

  // Front corners
  const [rcx, rcz] = toWorld(p, p.w * 0.36, oz + bd / 2 + 0.9);
  tryAddTree(rcx, rcz, 0.8, '#79c05a');
  const [rcbx, rcbz] = toWorld(p, p.w * 0.32, oz + bd / 2 + 0.6);
  tryAddBush(rcbx, rcbz, 0.55, '#468f3c');

  const [lcbx, lcbz] = toWorld(p, -p.w * 0.4, oz + bd / 2 + 0.7);
  tryAddBush(lcbx, lcbz, 0.6, '#468f3c');
}

console.log('Building perimeter placed trees:', trees.length, 'bushes:', bushes.length);

// 2. Open green spaces scatter:
let scatterTrees = 0;
let scatterBushes = 0;
for (let r = CITY.R0 + 4; r < CITY.Ro - 2; r += 4.5) {
  const circ = 2 * Math.PI * r;
  const step = 4.5;
  const n = Math.floor(circ / step);
  for (let i = 0; i < n; i++) {
    const ang = (i / n) * 2 * Math.PI + (r * 0.13);
    const wx = r * Math.sin(ang);
    const wz = -r * Math.cos(ang);
    if (tryAddTree(wx, wz, 0.75 + ((i % 5) * 0.12), '#5fae48')) scatterTrees++;
    else if (tryAddBush(wx, wz, 0.5 + ((i % 4) * 0.1), '#6bb852')) scatterBushes++;
  }
}

console.log('Open spaces scatter placed trees:', scatterTrees, 'bushes:', scatterBushes);
console.log('Total trees:', trees.length, 'Total bushes:', bushes.length);

