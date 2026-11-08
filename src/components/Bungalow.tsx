'use client';
import * as THREE from 'three';
import { useMemo } from 'react';
import { Detailed } from '@react-three/drei';
import type { StoreConfig } from '@/lib/types';
import { mat, solid } from '@/lib/materials';
import { useSignTexture } from '@/lib/signage';
import { B, Window, useMats } from './Building';

/** Roof prism / hip: base (±A, ±B), ridge half-length R (R = A gives a gable). */
function roofGeo(A: number, Bz: number, h: number, R: number) {
  const p0 = [-A, 0, -Bz], p1 = [A, 0, -Bz], p2 = [A, 0, Bz], p3 = [-A, 0, Bz], r0 = [-R, h, 0], r1 = [R, h, 0];
  const tris = [p3, p2, r1, p3, r1, r0, p1, p0, r0, p1, r0, r1, p2, p1, r1, p0, p3, r0].flat();
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(tris, 3)); g.computeVertexNormals(); return g;
}
const flat = (c: string) => new THREE.MeshStandardMaterial({ color: c, flatShading: true, roughness: 0.9 });
const ROOF: Record<string, string> = { brick: '#6f3a30', wood: '#54402f', stone: '#474c5c', concrete: '#54463d', metal: '#3f4856' };

/** Detached single-storey bungalow with veranda, shutters, chimney and a garden path. Local origin = footprint centre, front faces +z. 20 × 14 m. */
export function Bungalow({ cfg }: { cfg: StoreConfig }) {
  const W = 20, D = 14, WH = 3.6, mats = useMats(cfg), tex = useSignTexture(cfg.name, cfg.theme, 'box', cfg.logoUrl), on = cfg.lights;
  const hip = cfg.roof === 'cornice' || cfg.roof === 'sloped', rh = cfg.roof === 'sloped' ? 2.6 : 3.2;
  const roof = useMemo(() => roofGeo(W / 2 + 1, D / 2 + 1, rh, hip ? Math.max(2, W / 2 + 1 - (D / 2 + 1)) : W / 2 + 1), [hip, rh]);
  const roofM = useMemo(() => flat(ROOF[cfg.facade] || ROOF.stone), [cfg.facade]), accent = useMemo(() => flat(cfg.theme), [cfg.theme]), wood = useMemo(() => mat('wood', '#c9b08a'), []);
  const stone = useMemo(() => mat('stone', '#d8cbb4'), []), shrub = useMemo(() => flat('#4f9f4a'), []), bloom = useMemo(() => flat('#d98a9c'), []);
  const sign = useMemo(() => new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: '#ffffff', emissiveIntensity: on ? 1.1 : 0.12, roughness: 0.8 }), [tex, on]);
  const y0 = 0.5, zF = D / 2, trim = solid('trim');
  const windows: [number, number][] = [[-7.4, 0], [-4.4, 0], [4.4, 0], [7.4, 0]];
  return (
    <group>
      <B s={[W + 0.5, 0.5, D + 0.5]} p={[0, 0.25, 0]} m={stone} />
      <B s={[W, WH, D]} p={[0, y0 + WH / 2, 0]} m={mats.wall} />
      {cfg.trim && [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b], i) => <B key={i} s={[0.32, WH, 0.32]} p={[a * (W / 2), y0 + WH / 2, b * (D / 2)]} m={trim} />)}
      <B s={[W + 0.1, 0.5, D + 0.1]} p={[0, y0 + 0.25, 0]} m={stone} />
      <mesh geometry={roof} position={[0, y0 + WH, 0]} material={roofM} castShadow receiveShadow />
      <B s={[W + 2.2, 0.22, D + 2.2]} p={[0, y0 + WH - 0.02, 0]} m={wood} cast={false} />
      {/* chimney */}
      <B s={[1.3, 3.6, 1.3]} p={[5.8, y0 + WH + 2.6, -2.6]} m={stone} /><B s={[1.7, 0.22, 1.7]} p={[5.8, y0 + WH + 4.5, -2.6]} m={solid('dark')} />
      {/* front windows with shutters and flower boxes */}
      {windows.map(([x], i) => (
        <group key={i}>
          <Window p={[x, y0 + 1.9, zF + 0.02]} w={1.7} h={1.7} mats={mats} lights={on} />
          {[-1, 1].map(s => <B key={s} s={[0.55, 1.8, 0.1]} p={[x + s * 1.25, y0 + 1.9, zF + 0.08]} m={accent} cast={false} />)}
          {cfg.planters && <><B s={[1.7, 0.32, 0.4]} p={[x, y0 + 0.82, zF + 0.28]} m={wood} /><mesh position={[x, y0 + 1.15, zF + 0.3]} material={i % 2 ? bloom : shrub} scale={[1.5, 0.7, 0.8]}><icosahedronGeometry args={[0.4, 1]} /></mesh></>}
        </group>))}
      {[-1, 1].map(s => <group key={s} rotation={[0, s * Math.PI / 2, 0]}>{[-3.2, 3.2].map(z => <group key={z}><Window p={[z, y0 + 1.9, W / 2 + 0.02]} w={1.5} h={1.6} mats={mats} lights={on} />{[-1, 1].map(k => <B key={k} s={[0.5, 1.7, 0.1]} p={[z + k * 1.1, y0 + 1.9, W / 2 + 0.08]} m={accent} cast={false} />)}</group>)}</group>)}
      {[-6, 0, 6].map(x => <Window key={x} p={[x, y0 + 1.9, -D / 2 - 0.02]} w={1.6} h={1.6} mats={mats} lights={on} r={Math.PI} />)}
      {/* entrance: door, sidelights, lantern */}
      <B s={[1.5, 2.6, 0.14]} p={[0, y0 + 1.3, zF + 0.04]} m={accent} /><B s={[1.8, 0.14, 0.2]} p={[0, y0 + 2.65, zF + 0.06]} m={trim} />
      {[-1, 1].map(s => <Window key={s} p={[s * 1.45, y0 + 1.45, zF + 0.02]} w={0.55} h={2.2} mats={mats} lights={on} />)}
      {on && [-1, 1].map(s => <mesh key={s} position={[s * 2.3, y0 + 2.4, zF + 0.3]} material={solid('lampHead')}><sphereGeometry args={[0.13, 8, 6]} /></mesh>)}
      {/* veranda */}
      <B s={[13, 0.3, 3.2]} p={[0, 0.65, zF + 1.6]} m={wood} />
      {[-6, -2.3, 2.3, 6].map(x => <B key={x} s={[0.3, WH - 0.2, 0.3]} p={[x, y0 + 0.3 + (WH - 0.2) / 2, zF + 2.9]} m={trim} />)}
      <B s={[13.2, 0.3, 0.34]} p={[0, y0 + WH - 0.05, zF + 2.9]} m={wood} />
      <group position={[0, y0 + WH, zF + 1.6]} rotation={[0.16, 0, 0]}><B s={[13.8, 0.18, 3.8]} p={[0, 0.2, 0.2]} m={roofM} /></group>
      <mesh position={[0, y0 + WH - 0.62, zF + 2.93]} material={sign}><planeGeometry args={[5.6, 0.93]} /></mesh>
      {[-1, 1].map(s => <group key={s}><B s={[3.6, 0.08, 0.08]} p={[s * 3.9, 1.7, zF + 2.9]} m={wood} />{[0, 1, 2, 3, 4, 5].map(k => <B key={k} s={[0.07, 0.85, 0.07]} p={[s * (2.2 + k * 0.7), 1.25, zF + 2.9]} m={wood} cast={false} />)}</group>)}
      {[0, 1].map(k => <B key={k} s={[3.2 - k * 0.5, 0.2, 0.9]} p={[0, 0.1 + k * 0.2 + 0.2, zF + 3.5 + (1 - k) * 0.4]} m={stone} />)}
      {/* garden path, hedges, lamp */}
      <B s={[2.4, 0.06, 3.4]} p={[0, 0.03, zF + 5.4]} m={mat('pave', '#e6dcc8')} recv />
      {[-1, 1].flatMap(s => [2.6, 4.4, 6.4, 8.4].map((x, i) => <mesh key={s + '' + i} position={[s * x, 0.45, zF + 3.9]} material={shrub} scale={[1.3, 0.8, 0.9]} castShadow><icosahedronGeometry args={[0.55, 1]} /></mesh>))}
      <mesh position={[3.2, 1.6, zF + 5.6]} material={solid('steel')}><cylinderGeometry args={[0.06, 0.08, 3.2, 6]} /></mesh><mesh position={[3.2, 3.3, zF + 5.6]} material={solid('lampHead')}><boxGeometry args={[0.35, 0.3, 0.35]} /></mesh>
    </group>
  );
}

function BungalowMedium({ cfg }: { cfg: StoreConfig }) {
  const mats = useMats(cfg), roofM = useMemo(() => flat(ROOF[cfg.facade] || ROOF.stone), [cfg.facade]), roof = useMemo(() => roofGeo(11, 8, 3, 11), []);
  const tex = useSignTexture(cfg.name, cfg.theme, 'box', cfg.logoUrl);
  const sign = useMemo(() => new THREE.MeshBasicMaterial({ map: tex }), [tex]);
  return (
    <group>
      <B s={[20, 3.6, 14]} p={[0, 2.3, 0]} m={mats.wall} />
      <mesh geometry={roof} position={[0, 4.1, 0]} material={roofM} castShadow />
      <B s={[13, 0.3, 3.2]} p={[0, 0.65, 8.6]} m={mats.wall} />
      <mesh position={[0, 3.5, 9.9]} material={sign}><planeGeometry args={[5.2, 0.9]} /></mesh>
    </group>
  );
}

export function BungalowLow({ cfg }: { cfg: StoreConfig }) {
  const mats = useMats(cfg), roofM = useMemo(() => flat(ROOF[cfg.facade] || ROOF.stone), [cfg.facade]), roof = useMemo(() => roofGeo(11, 8, 3, 11), []);
  return <group><B s={[20, 3.6, 14]} p={[0, 2.3, 0]} m={mats.wall} /><mesh geometry={roof} position={[0, 4.1, 0]} material={roofM} /></group>;
}
export function BungalowLOD({ cfg, lodDistance = 45 }: { cfg: StoreConfig; lodDistance?: number }) {
  const dMed = lodDistance;
  const dLow = Math.max(95, lodDistance * 2.2);
  return (
    <Detailed distances={[0, dMed, dLow]}>
      <Bungalow cfg={cfg} />
      <BungalowMedium cfg={cfg} />
      <BungalowLow cfg={cfg} />
    </Detailed>
  );
}
