'use client';
import * as THREE from 'three';
import { useMemo } from 'react';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { Layout, roadPieces, sidewalkPieces, intersections, isRing, roadLen, roadDir, bandHit } from '@/lib/layout';
import { PLAZA } from '@/lib/plots';
import { mat } from '@/lib/materials';
import { Inst, Item, UBOX } from './Inst';

const yaw = (dx: number, dz: number) => Math.atan2(-dz, dx);
const flat = (c: string) => new THREE.MeshStandardMaterial({ color: c, flatShading: true, roughness: 0.95 });
const merge = (g: THREE.BufferGeometry[]) => { const n = g.map(x => { const y = x.index ? x.toNonIndexed() : x; for (const k of Object.keys(y.attributes)) if (!['position', 'normal', 'uv'].includes(k)) y.deleteAttribute(k); return y; }); return n.length ? mergeGeometries(n, false) : null; };
const strip = (x: number, z: number, len: number, w: number, h: number, rot: number, y0 = 0) => { const g = new THREE.BoxGeometry(len, h, w); g.rotateY(rot); g.translate(x, y0 + h / 2, z); return g; };
function arcGeo(cx: number, cz: number, rIn: number, rOut: number, a0: number, a1: number, h: number) {
  const s = new THREE.Shape(); s.absarc(0, 0, rOut, -a1, -a0, false); s.lineTo(rIn * Math.cos(-a0), rIn * Math.sin(-a0)); s.absarc(0, 0, rIn, -a0, -a1, true); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: h, bevelEnabled: false, curveSegments: Math.max(2, Math.ceil(((a1 - a0) * rOut) / 4)) }); g.rotateX(-Math.PI / 2); g.translate(cx, 0, cz); return g;
}

/** Ring and radial roads, 3 m sidewalks with trimmed junctions, lane markings and crosswalks, all generated from the shared road graph. */
export function CityRoads({ layout }: { layout: Layout }) {
  const { road, walk, dash, cross } = useMemo(() => {
    const rp = roadPieces(layout.roads), sp = sidewalkPieces(layout.roads), rg: THREE.BufferGeometry[] = [], wg: THREE.BufferGeometry[] = [];
    rp.strips.forEach(s => rg.push(strip(s.x, s.z, s.len, s.w, 0.04, s.rot)));
    rp.rings.forEach(r => { const g = new THREE.RingGeometry(r.x1 - r.w / 2, r.x1 + r.w / 2, Math.max(64, Math.ceil(r.x1 / 2)), 1); g.rotateX(-Math.PI / 2); g.translate(r.x0, 0.042, r.z0); rg.push(g); });
    sp.strips.forEach(s => wg.push(strip(s.x, s.z, s.len, s.w, 0.14, s.rot)));
    sp.arcs.forEach(a => wg.push(arcGeo(a.cx, a.cz, a.rIn, a.rOut, a.a0, a.a1, 0.14)));
    const dash: Item[] = [], cross: Item[] = [];
    for (const r of layout.roads) {
      if (isRing(r)) { const R = r.x1, n = Math.floor((2 * Math.PI * R) / 5); for (let i = 0; i < n; i++) { const f = (i / n) * Math.PI * 2, x = r.x0 + R * Math.cos(f), z = r.z0 + R * Math.sin(f); if (!bandHit(layout.roads, x, z, 1.8, r.id)) dash.push({ p: [x, 0.055, z], r: yaw(-Math.sin(f), Math.cos(f)), s: [2.4, 0.02, 0.14] }); } }
      else { const d = roadDir(r), L = roadLen(r); for (let t = 3; t < L - 3; t += 5) { const x = r.x0 + d[0] * t, z = r.z0 + d[1] * t; if (!bandHit(layout.roads, x, z, 1.8, r.id)) dash.push({ p: [x, 0.055, z], r: yaw(d[0], d[1]), s: [2.4, 0.02, 0.14] }); } }
    }
    for (const j of intersections(layout.roads)) for (const [road, other, e] of [[j.a, j.b, j.ea], [j.b, j.a, j.eb]] as const) for (const sg of [-1, 1]) {
      const ax = j.x + e[0] * sg * (other.w / 2 + 1.6), az = j.z + e[1] * sg * (other.w / 2 + 1.6);
      if (layout.roads.some(q => q !== j.a && q !== j.b && bandHit([q], ax, az, 0.2))) continue;
      if (!isRing(road)) { const t = (ax - road.x0) * e[0] + (az - road.z0) * e[1]; if (t < 1 || t > roadLen(road) - 1) continue; }
      const n = Math.floor(road.w / 1.05), nx = -e[1], nz = e[0];
      for (let i = 0; i < n; i++) { const o = (i - (n - 1) / 2) * 1.05; cross.push({ p: [ax + nx * o, 0.055, az + nz * o], r: yaw(e[0], e[1]), s: [2, 0.02, 0.6] }); }
    }
    return { road: merge(rg), walk: merge(wg), dash, cross };
  }, [layout]);
  const asphalt = useMemo(() => mat('asphalt'), []), pave = useMemo(() => flat('#cbc4b8'), []), white = useMemo(() => flat('#ffffff'), []);
  return (
    <>
      {road && <mesh geometry={road} material={asphalt} receiveShadow />}
      {walk && <mesh geometry={walk} material={pave} receiveShadow castShadow />}
      <Inst geo={UBOX} material={white} items={dash} recv /><Inst geo={UBOX} material={white} items={cross} recv />
    </>
  );
}

/** Paved central plaza around J Enterprise with a lawn ring. */
export function Plaza() {
  const pave = useMemo(() => mat('pave', '#f2e6d0', 14, 14), []), lawn = useMemo(() => flat('#8fc872'), []), walk = useMemo(() => flat('#d9cfbc'), []);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[PLAZA.x, 0.05, PLAZA.z]} receiveShadow material={pave}><circleGeometry args={[PLAZA.r, 72]} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[PLAZA.x, 0.056, PLAZA.z]} receiveShadow material={lawn}><ringGeometry args={[PLAZA.r - 7, PLAZA.r - 1.5, 72]} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[PLAZA.x, 0.06, PLAZA.z]} receiveShadow material={walk}><ringGeometry args={[PLAZA.r - 1.5, PLAZA.r, 72]} /></mesh>
    </group>
  );
}
