'use client';
import * as THREE from 'three';
import { useMemo } from 'react';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { Layout, roadPieces, intersections, isRing, roadLen, roadDir, bandHit } from '@/lib/layout';
import { subtractIntervals, lineCircle, lineAnnulus, Pt } from '@/lib/geom';
import { PLAZA } from '@/lib/plots';
import { mat } from '@/lib/materials';
import { Inst, Item, UBOX } from './Inst';

const yaw = (dx: number, dz: number) => Math.atan2(-dz, dx);
const flat = (c: string, roughness = 0.92) => new THREE.MeshStandardMaterial({ color: c, flatShading: true, roughness });

const merge = (g: THREE.BufferGeometry[]) => {
  const n = g.map(x => {
    const y = x.index ? x.toNonIndexed() : x;
    for (const k of Object.keys(y.attributes)) if (!['position', 'normal', 'uv', 'color'].includes(k)) y.deleteAttribute(k);
    return y;
  });
  return n.length ? mergeGeometries(n, false) : null;
};

const strip = (x: number, z: number, len: number, w: number, h: number, rot: number, y0 = 0) => {
  const g = new THREE.BoxGeometry(len, h, w);
  g.rotateY(rot);
  g.translate(x, y0 + h / 2, z);
  return g;
};

function arcGeo(cx: number, cz: number, rIn: number, rOut: number, a0: number, a1: number, h: number, y0 = 0) {
  const s = new THREE.Shape();
  s.absarc(0, 0, rOut, -a1, -a0, false);
  s.lineTo(rIn * Math.cos(-a0), rIn * Math.sin(-a0));
  s.absarc(0, 0, rIn, -a0, -a1, true);
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: h, bevelEnabled: false, curveSegments: Math.max(3, Math.ceil(((a1 - a0) * rOut) / 3)) });
  g.rotateX(-Math.PI / 2);
  g.translate(cx, y0, cz);
  return g;
}

function cylinderGeo(x: number, z: number, r: number, h: number, y0 = 0) {
  const g = new THREE.CylinderGeometry(r, r, h, 20);
  g.translate(x, y0 + h / 2, z);
  return g;
}

// Low-poly Conical Evergreen Tree Geometry with vertex colors
function makeTreeGeo() {
  const trunk = new THREE.CylinderGeometry(0.12, 0.15, 0.55, 6);
  trunk.translate(0, 0.275, 0);
  const brown = new THREE.Color('#5c3a21');
  const count1 = trunk.attributes.position.count;
  const col1 = new Float32Array(count1 * 3);
  for (let i = 0; i < count1; i++) {
    col1[i * 3] = brown.r; col1[i * 3 + 1] = brown.g; col1[i * 3 + 2] = brown.b;
  }
  trunk.setAttribute('color', new THREE.BufferAttribute(col1, 3));

  const darkGreen = new THREE.Color('#245e28');
  const c1 = new THREE.ConeGeometry(0.60, 0.78, 7);
  c1.translate(0, 0.78, 0);
  const c2 = new THREE.ConeGeometry(0.46, 0.72, 7);
  c2.translate(0, 1.28, 0);
  const c3 = new THREE.ConeGeometry(0.30, 0.65, 7);
  c3.translate(0, 1.76, 0);

  [c1, c2, c3].forEach(c => {
    const count = c.attributes.position.count;
    const col = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      col[i * 3] = darkGreen.r; col[i * 3 + 1] = darkGreen.g; col[i * 3 + 2] = darkGreen.b;
    }
    c.setAttribute('color', new THREE.BufferAttribute(col, 3));
  });

  const merged = mergeGeometries([trunk, c1, c2, c3], false);
  return merged;
}

const TREE_GEO = makeTreeGeo();
const BUSH_GEO = new THREE.DodecahedronGeometry(0.55, 1);
const FLOWER_GEO = new THREE.DodecahedronGeometry(0.11, 0);

export function CityRoads({ layout }: { layout: Layout }) {
  const {
    road,
    walk,
    kerbYellow,
    kerbBlack,
    medianBorder,
    medianLawn,
    dash,
    cross,
    bushes,
    flowers,
    trees,
  } = useMemo(() => {
    const rp = roadPieces(layout.roads);
    const rg: THREE.BufferGeometry[] = [];
    const wg: THREE.BufferGeometry[] = [];
    const kyg: THREE.BufferGeometry[] = []; // yellow kerb blocks
    const kbg: THREE.BufferGeometry[] = []; // black kerb blocks
    const mbg: THREE.BufferGeometry[] = []; // median stone border
    const mlg: THREE.BufferGeometry[] = []; // median green lawn

    const dash: Item[] = [];
    const cross: Item[] = [];
    const bushes: Item[] = [];
    const flowers: Item[] = [];
    const trees: Item[] = [];

    // 1. Asphalt Road Carriageway
    // Height: 0.04m (surface at y = 0.04m)
    rp.strips.forEach(s => rg.push(strip(s.x, s.z, s.len, s.w, 0.04, s.rot)));
    rp.rings.forEach(r => {
      const g = new THREE.RingGeometry(r.x1 - r.w / 2, r.x1 + r.w / 2, Math.max(64, Math.ceil(r.x1 / 2)), 1);
      g.rotateX(-Math.PI / 2);
      g.translate(r.x0, 0.041, r.z0);
      rg.push(g);
    });

    const segs = layout.roads.filter(r => !isRing(r));
    const rings = layout.roads.filter(isRing);

    // Track median intervals per road segment so we don't draw center dashes over medians
    const medianIntervalsByRoad = new Map<string, [number, number][]>();

    // 2. Central Landscaped Road Dividers (Medians)
    // Placed on suitable straight roads (w >= 10m, length >= 24m)
    for (const r of segs) {
      if (r.w < 10) continue;
      const L = roadLen(r);
      if (L < 24) continue;
      const d = roadDir(r);
      const cuts: [number, number][] = [[0, 6.5], [L - 6.5, L]];

      // Clear intersections + crosswalks + vehicle turning zones
      for (const q of layout.roads) {
        if (q === r) continue;
        if (isRing(q)) {
          const ivs = lineAnnulus([r.x0, r.z0], d, q.x0, q.z0, q.x1 - q.w / 2 - 5.5, q.x1 + q.w / 2 + 5.5);
          ivs.forEach(iv => cuts.push(iv));
          continue;
        }
        const dq = roadDir(q), cr = d[0] * dq[1] - d[1] * dq[0];
        if (Math.abs(cr) < 1e-6) continue;
        const qx = q.x0 - r.x0, qz = q.z0 - r.z0;
        const t = (qx * dq[1] - qz * dq[0]) / cr;
        const s = (qx * d[1] - qz * d[0]) / cr;
        if (s < -1e-3 || s > roadLen(q) + 1e-3) continue;
        const clearance = (q.w / 2 + 5.0) / Math.abs(cr);
        cuts.push([t - clearance, t + clearance]);
      }

      const medIntervals: [number, number][] = [];
      const mWidth = 1.6;  // Total width of median
      const mHeight = 0.28; // Raised 24cm above asphalt surface (0.04m -> 0.28m)
      const rot = yaw(d[0], d[1]);
      const n: Pt = [-d[1], d[0]];

      for (const [ma, mb] of subtractIntervals(0, L, cuts, 12.0)) {
        const mLen = mb - ma;
        if (mLen < 12.0) continue;
        medIntervals.push([ma, mb]);

        const midT = (ma + mb) / 2;
        const cx = r.x0 + d[0] * midT;
        const cz = r.z0 + d[1] * midT;

        // Concrete retaining border
        mbg.push(strip(cx, cz, mLen, mWidth, mHeight, rot));
        // Rounded end caps facing the crosswalks
        mbg.push(cylinderGeo(r.x0 + d[0] * ma, r.z0 + d[1] * ma, mWidth / 2, mHeight));
        mbg.push(cylinderGeo(r.x0 + d[0] * mb, r.z0 + d[1] * mb, mWidth / 2, mHeight));

        // Raised interior green lawn bed (inset by 0.14m)
        const lawnW = mWidth - 0.28;
        mlg.push(strip(cx, cz, mLen - 0.28, lawnW, mHeight - 0.02, rot));
        mlg.push(cylinderGeo(r.x0 + d[0] * (ma + 0.14), r.z0 + d[1] * (ma + 0.14), lawnW / 2, mHeight - 0.02));
        mlg.push(cylinderGeo(r.x0 + d[0] * (mb - 0.14), r.z0 + d[1] * (mb - 0.14), lawnW / 2, mHeight - 0.02));

        // Yellow-and-black kerb striping along the outer sides of the median
        const segL = 0.55;
        for (const side of [-1, 1]) {
          const off = side * (mWidth / 2);
          for (let t = ma + segL / 2; t < mb; t += segL) {
            const idx = Math.floor((t - ma) / segL);
            const kx = r.x0 + d[0] * t + n[0] * off;
            const kz = r.z0 + d[1] * t + n[1] * off;
            const b = strip(kx, kz, segL * 0.98, 0.16, mHeight + 0.005, rot);
            if (idx % 2 === 0) kyg.push(b);
            else kbg.push(b);
          }
        }

        // Landscaping plants (flowering bushes & conical trees alternating)
        let plantIdx = 0;
        for (let pt = ma + 2.0; pt <= mb - 2.0; pt += 3.2) {
          const px = r.x0 + d[0] * pt;
          const pz = r.z0 + d[1] * pt;

          if (plantIdx % 3 === 2) {
            // Conical evergreen cypress tree
            trees.push({
              p: [px, mHeight - 0.02, pz],
              s: [1.0, 1.0, 1.0],
              r: (plantIdx * 1.9),
            });
          } else {
            // Rounded flowering bush
            bushes.push({
              p: [px, mHeight + 0.35, pz],
              s: [1.0, 0.85, 1.0],
              r: (plantIdx * 1.5),
            });
            // 5 small pink flower petals on bush surface
            for (let f = 0; f < 5; f++) {
              const fa = f * 1.25 + plantIdx;
              const fx = px + Math.cos(fa) * 0.38;
              const fz = pz + Math.sin(fa) * 0.38;
              const fy = mHeight + 0.55 + (f % 2) * 0.12;
              flowers.push({
                p: [fx, fy, fz],
                s: [1, 1, 1],
              });
            }
          }
          plantIdx++;
        }
      }

      if (medIntervals.length > 0) {
        medianIntervalsByRoad.set(r.id, medIntervals);
      }
    }

    // 3. Sidewalks & Yellow-Black Road Edge Kerbs
    // Raised footpaths: height 0.20m (elevation difference 16 cm above 0.04m road asphalt)
    const swWidth = 3.2;
    const swHeight = 0.20;
    const kerbW = 0.26;
    const kerbH = 0.22;

    for (const r of segs) {
      const d = roadDir(r), n: Pt = [-d[1], d[0]], L = roadLen(r);
      const rot = yaw(d[0], d[1]);

      for (const sd of [-1, 1]) {
        const swOff = sd * (r.w / 2 + swWidth / 2);
        const kerbOff = sd * (r.w / 2 + kerbW / 2);
        const p0: Pt = [r.x0 + n[0] * swOff, r.z0 + n[1] * swOff];
        const cuts: [number, number][] = [];

        // Intersections cut sidewalks cleanly
        for (const q of layout.roads) {
          if (q === r) continue;
          if (isRing(q)) {
            lineAnnulus(p0, d, q.x0, q.z0, q.x1 - q.w / 2 - swWidth, q.x1 + q.w / 2 + swWidth).forEach(iv => cuts.push(iv));
            continue;
          }
          const dq = roadDir(q), cr = d[0] * dq[1] - d[1] * dq[0];
          if (Math.abs(cr) < 1e-6) continue;
          const qx = q.x0 - p0[0], qz = q.z0 - p0[1];
          const t = (qx * dq[1] - qz * dq[0]) / cr;
          const s = (qx * d[1] - qz * d[0]) / cr;
          if (s < -1e-3 || s > roadLen(q) + 1e-3) continue;
          const hw = (q.w / 2 + (r.id > q.id ? swWidth : 0)) / Math.abs(cr);
          cuts.push([t - hw, t + hw]);
        }

        for (const [a, b] of subtractIntervals(0, L, cuts)) {
          const sLen = b - a;
          const midT = (a + b) / 2;
          const sx = p0[0] + d[0] * midT;
          const sz = p0[1] + d[1] * midT;

          // Raised sidewalk with clean vertical side faces
          wg.push(strip(sx, sz, sLen, swWidth, swHeight, rot));

          // Yellow-and-black 3D kerb blocks along the road edge of the sidewalk
          // Inner edge touches asphalt at r.w/2, outer edge meets sidewalk. NEVER overlaps asphalt!
          const segL = 0.55;
          for (let t = a + segL / 2; t < b; t += segL) {
            const idx = Math.floor((t - a) / segL);
            const kx = r.x0 + d[0] * t + n[0] * kerbOff;
            const kz = r.z0 + d[1] * t + n[1] * kerbOff;
            const block = strip(kx, kz, segL * 0.98, kerbW, kerbH, rot);
            if (idx % 2 === 0) kyg.push(block);
            else kbg.push(block);
          }
        }
      }
    }

    // Sidewalks & Kerbs for Ring Roads
    for (const rg of rings) {
      const R = rg.x1;
      for (const side of [-1, 1]) {
        const rIn = side < 0 ? R - rg.w / 2 - swWidth : R + rg.w / 2;
        const rOut = side < 0 ? R - rg.w / 2 : R + rg.w / 2 + swWidth;
        const TWO = Math.PI * 2;
        const cuts: [number, number][] = [];

        for (const s of segs) {
          const d = roadDir(s), sLen = roadLen(s);
          for (const t of lineCircle([s.x0, s.z0], d, rg.x0, rg.z0, R)) {
            if (t < -0.6 || t > sLen + 0.6) continue;
            const x = s.x0 + t * d[0], z = s.z0 + t * d[1];
            const phi = (Math.atan2(z - rg.z0, x - rg.x0) + TWO) % TWO;
            const tan: Pt = [-(z - rg.z0) / R, (x - rg.x0) / R];
            const sinA = Math.abs(d[0] * tan[1] - d[1] * tan[0]) || 1e-3;
            const dl = (s.w / 2) / sinA / R;
            let has = false;
            for (const dt of [-2, 2]) {
              const tt = t + dt;
              if (tt < 0 || tt > sLen) continue;
              const rr = Math.hypot(s.x0 + tt * d[0] - rg.x0, s.z0 + tt * d[1] - rg.z0);
              if (side < 0 ? rr < R : rr > R) has = true;
            }
            if (!has) continue;
            cuts.push([phi - dl, phi + dl], [phi - dl + TWO, phi + dl + TWO], [phi - dl - TWO, phi + dl - TWO]);
          }
        }

        for (const [a0, a1] of subtractIntervals(0, TWO, cuts, 0.4 / R)) {
          // Sidewalk arc
          wg.push(arcGeo(rg.x0, rg.z0, rIn, rOut, a0, a1, swHeight));

          // Kerb arc along the road-facing edge
          const kRIn = side < 0 ? R - rg.w / 2 - kerbW : R + rg.w / 2;
          const kROut = side < 0 ? R - rg.w / 2 : R + rg.w / 2 + kerbW;
          const arcLen = (a1 - a0) * R;
          const nSegs = Math.max(1, Math.floor(arcLen / 0.6));
          const dTheta = (a1 - a0) / nSegs;

          for (let i = 0; i < nSegs; i++) {
            const ta0 = a0 + i * dTheta;
            const ta1 = ta0 + dTheta * 0.98;
            const arcB = arcGeo(rg.x0, rg.z0, kRIn, kROut, ta0, ta1, kerbH);
            if (i % 2 === 0) kyg.push(arcB);
            else kbg.push(arcB);
          }
        }
      }
    }

    // 4. White Lane Dashes
    // Only placed on road sections without central medians
    for (const r of layout.roads) {
      if (isRing(r)) {
        const Rr = r.x1;
        const n = Math.floor((2 * Math.PI * Rr) / 5);
        for (let i = 0; i < n; i++) {
          const f = (i / n) * Math.PI * 2;
          const x = r.x0 + Rr * Math.cos(f);
          const z = r.z0 + Rr * Math.sin(f);
          if (!bandHit(layout.roads, x, z, 1.8, r.id)) {
            dash.push({ p: [x, 0.055, z], r: yaw(-Math.sin(f), Math.cos(f)), s: [2.4, 0.02, 0.14] });
          }
        }
      } else {
        const d = roadDir(r);
        const L = roadLen(r);
        const medIvs = medianIntervalsByRoad.get(r.id) || [];

        for (let t = 3; t < L - 3; t += 5) {
          // If within or close to a median interval, omit center dash
          const inMedian = medIvs.some(([ma, mb]) => t >= ma - 1.5 && t <= mb + 1.5);
          if (inMedian) continue;

          const x = r.x0 + d[0] * t;
          const z = r.z0 + d[1] * t;
          if (!bandHit(layout.roads, x, z, 1.8, r.id)) {
            dash.push({ p: [x, 0.055, z], r: yaw(d[0], d[1]), s: [2.4, 0.02, 0.14] });
          }
        }
      }
    }

    // 5. White Zebra Crosswalks at Intersections
    // Connects pedestrian flow across intersections cleanly
    for (const j of intersections(layout.roads)) {
      for (const [road, other, e] of [[j.a, j.b, j.ea], [j.b, j.a, j.eb]] as const) {
        for (const sg of [-1, 1]) {
          const ax = j.x + e[0] * sg * (other.w / 2 + 1.6);
          const az = j.z + e[1] * sg * (other.w / 2 + 1.6);
          if (layout.roads.some(q => q !== j.a && q !== j.b && bandHit([q], ax, az, 0.2))) continue;
          if (!isRing(road)) {
            const t = (ax - road.x0) * e[0] + (az - road.z0) * e[1];
            if (t < 1 || t > roadLen(road) - 1) continue;
          }
          const nBars = Math.floor(road.w / 1.05);
          const nx = -e[1], nz = e[0];
          for (let i = 0; i < nBars; i++) {
            const o = (i - (nBars - 1) / 2) * 1.05;
            cross.push({
              p: [ax + nx * o, 0.055, az + nz * o],
              r: yaw(e[0], e[1]),
              s: [2, 0.02, 0.6],
            });
          }
        }
      }
    }

    return {
      road: merge(rg),
      walk: merge(wg),
      kerbYellow: merge(kyg),
      kerbBlack: merge(kbg),
      medianBorder: merge(mbg),
      medianLawn: merge(mlg),
      dash,
      cross,
      bushes,
      flowers,
      trees,
    };
  }, [layout]);

  // Materials matching reference image
  const asphaltMat = useMemo(() => mat('asphalt'), []);
  const paveMat = useMemo(() => mat('pave', '#ebdccb', 16, 16), []);
  const whiteMat = useMemo(() => flat('#ffffff', 0.8), []);
  const kerbYellowMat = useMemo(() => flat('#f5c518', 0.68), []);
  const kerbBlackMat = useMemo(() => flat('#1c1f24', 0.78), []);
  const medianBorderMat = useMemo(() => flat('#ded6c9', 0.85), []);
  const medianLawnMat = useMemo(() => flat('#5a9624', 0.92), []);
  const bushMat = useMemo(() => flat('#4d8e1f', 0.88), []);
  const flowerMat = useMemo(() => flat('#f472b6', 0.75), []);
  const treeMat = useMemo(() => new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.88 }), []);

  return (
    <>
      {road && <mesh geometry={road} material={asphaltMat} receiveShadow />}
      {walk && <mesh geometry={walk} material={paveMat} receiveShadow castShadow />}
      {kerbYellow && <mesh geometry={kerbYellow} material={kerbYellowMat} receiveShadow castShadow />}
      {kerbBlack && <mesh geometry={kerbBlack} material={kerbBlackMat} receiveShadow castShadow />}
      {medianBorder && <mesh geometry={medianBorder} material={medianBorderMat} receiveShadow castShadow />}
      {medianLawn && <mesh geometry={medianLawn} material={medianLawnMat} receiveShadow />}
      <Inst geo={UBOX} material={whiteMat} items={dash} recv />
      <Inst geo={UBOX} material={whiteMat} items={cross} recv />
      <Inst geo={BUSH_GEO} material={bushMat} items={bushes} cast recv />
      <Inst geo={FLOWER_GEO} material={flowerMat} items={flowers} />
      <Inst geo={TREE_GEO} material={treeMat} items={trees} cast recv />
    </>
  );
}

/** Premium corporate plaza surrounding J Enterprise with curved promenade, raised parterre lawn islands, and stone borders. */
export function Plaza() {
  const paveBase = useMemo(() => mat('pave', '#ebdccb', 24, 24), []);
  const paveAvenue = useMemo(() => mat('pave', '#f3ede2', 12, 12), []);
  const paveRing = useMemo(() => mat('pave', '#ded0be', 16, 16), []);
  const stoneBorder = useMemo(() => flat('#ded6c9', 0.8), []);
  const lawn = useMemo(() => flat('#5a9624', 0.92), []);

  return (
    <group>
      {/* 1. Main Plaza Podium Surface (Radius 40m, warm stone paving) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[PLAZA.x, 0.05, PLAZA.z]} receiveShadow material={paveBase}>
        <circleGeometry args={[PLAZA.r, 72]} />
      </mesh>

      {/* 2. Concentric Promenade Ring (r = 30m to 35.5m) in contrasting warm sandstone */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[PLAZA.x, 0.052, PLAZA.z]} receiveShadow material={paveRing}>
        <ringGeometry args={[30.0, 35.5, 72]} />
      </mesh>

      {/* 3. Outer Retaining Kerb Border Ring at Plaza Perimeter (r = 39.4m to 40.2m) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[PLAZA.x, 0.065, PLAZA.z]} receiveShadow material={stoneBorder}>
        <ringGeometry args={[39.4, 40.2, 72]} />
      </mesh>

      {/* 4. Southern Ceremonial Grand Entrance Walkway (width 7.6m, from z = 16 to z = 40) */}
      <mesh position={[0, 0.054, 28]} receiveShadow material={paveAvenue}>
        <boxGeometry args={[7.6, 0.008, 24]} />
      </mesh>
      {/* Walkway flanking stone trim bands */}
      <mesh position={[-3.85, 0.058, 28]} receiveShadow material={stoneBorder}>
        <boxGeometry args={[0.25, 0.012, 24]} />
      </mesh>
      <mesh position={[3.85, 0.058, 28]} receiveShadow material={stoneBorder}>
        <boxGeometry args={[0.25, 0.012, 24]} />
      </mesh>

      {/* 5. West Parterre Raised Garden Island (x = -13.5, z = 26) */}
      <group position={[-13.5, 0, 26]}>
        <mesh position={[0, 0.11, 0]} receiveShadow castShadow material={stoneBorder}>
          <boxGeometry args={[11.2, 0.22, 13.5]} />
        </mesh>
        <mesh position={[0, 0.225, 0]} receiveShadow material={lawn}>
          <boxGeometry args={[10.6, 0.02, 12.9]} />
        </mesh>
      </group>

      {/* 6. East Parterre Raised Garden Island (x = +13.5, z = 26) */}
      <group position={[13.5, 0, 26]}>
        <mesh position={[0, 0.11, 0]} receiveShadow castShadow material={stoneBorder}>
          <boxGeometry args={[11.2, 0.22, 13.5]} />
        </mesh>
        <mesh position={[0, 0.225, 0]} receiveShadow material={lawn}>
          <boxGeometry args={[10.6, 0.02, 12.9]} />
        </mesh>
      </group>

      {/* 7. Lateral West Landscape Terrace (x = -27.5, z = 0) */}
      <group position={[-27.5, 0, 0]}>
        <mesh position={[0, 0.11, 0]} receiveShadow castShadow material={stoneBorder}>
          <boxGeometry args={[9.5, 0.22, 19.0]} />
        </mesh>
        <mesh position={[0, 0.225, 0]} receiveShadow material={lawn}>
          <boxGeometry args={[8.9, 0.02, 18.4]} />
        </mesh>
      </group>

      {/* 8. Lateral East Landscape Terrace (x = +27.5, z = 0) */}
      <group position={[27.5, 0, 0]}>
        <mesh position={[0, 0.11, 0]} receiveShadow castShadow material={stoneBorder}>
          <boxGeometry args={[9.5, 0.22, 19.0]} />
        </mesh>
        <mesh position={[0, 0.225, 0]} receiveShadow material={lawn}>
          <boxGeometry args={[8.9, 0.02, 18.4]} />
        </mesh>
      </group>

      {/* 9. Rear North Executive Lawn Islands (z = -23.5) */}
      <group position={[-14.0, 0, -23.5]}>
        <mesh position={[0, 0.11, 0]} receiveShadow castShadow material={stoneBorder}>
          <boxGeometry args={[12.0, 0.22, 10.5]} />
        </mesh>
        <mesh position={[0, 0.225, 0]} receiveShadow material={lawn}>
          <boxGeometry args={[11.4, 0.02, 9.9]} />
        </mesh>
      </group>
      <group position={[14.0, 0, -23.5]}>
        <mesh position={[0, 0.11, 0]} receiveShadow castShadow material={stoneBorder}>
          <boxGeometry args={[12.0, 0.22, 10.5]} />
        </mesh>
        <mesh position={[0, 0.225, 0]} receiveShadow material={lawn}>
          <boxGeometry args={[11.4, 0.02, 9.9]} />
        </mesh>
      </group>
    </group>
  );
}
