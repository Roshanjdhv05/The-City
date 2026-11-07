'use client';
import { useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { QUALITY, useUI, landing } from '@/lib/state';
import { buildColliders, storeDoor, plotFront } from '@/lib/plots';
import { Layout, layoutBounds } from '@/lib/layout';
import { genProps } from '@/lib/props';
import { terrainFor } from '@/lib/terrain';
import { loadInventory } from '@/lib/resources';
import type { Store } from '@/lib/types';
import { World } from './World';
import { Player } from './Player';
import { Effects } from './Lighting';

const K = [ // landing fly-through: zoomed circular city (as in hero view) -> plaza level in front of J Enterprise
  { p: [0, 95, 145], l: [0, 8, -5] }, { p: [0, 52, 98], l: [0, 9, 5] }, { p: [0, 24, 68], l: [0, 8, 15] },
  { p: [-2, 10, 50], l: [0, 7, 18] }, { p: [-4.4, 3.4, 39.5], l: [0, 6.5, 0] },
];
const ease = (x: number) => x * x * (3 - 2 * x);
function LandingRig() {
  const v = useMemo(() => ({ p: new THREE.Vector3(), l: new THREE.Vector3(), a: new THREE.Vector3(), b: new THREE.Vector3(), look: new THREE.Vector3() }), []);
  useFrame(({ camera, clock }, dt) => {
    const f = THREE.MathUtils.clamp(landing.p, 0, 1) * (K.length - 1), i = Math.min(K.length - 2, Math.floor(f)), t = ease(f - i);
    v.a.set(...(K[i].p as [number, number, number])); v.b.set(...(K[i + 1].p as [number, number, number])); v.p.lerpVectors(v.a, v.b, t);
    v.a.set(...(K[i].l as [number, number, number])); v.b.set(...(K[i + 1].l as [number, number, number])); v.l.lerpVectors(v.a, v.b, t);
    const drift = Math.sin(clock.elapsedTime * 0.12) * (1 - landing.p) * 6; v.p.x += drift;
    camera.position.lerp(v.p, 1 - Math.exp(-4 * dt)); v.look.lerp(v.l, 1 - Math.exp(-4 * dt)); camera.lookAt(v.look);
  });
  return null;
}

export default function CityCanvas({ stores, layout, mode, paused = false }: { stores: Store[]; layout: Layout; mode: 'city' | 'landing'; paused?: boolean }) {
  const quality = useUI(s => s.quality), Q = QUALITY[quality];
  const terrain = useMemo(() => terrainFor(layoutBounds(layout, 0)), [layout]);
  const props = useMemo(() => genProps(layout, { trees: Q.trees, forest: Q.forest, radius: Q.radius }, terrain), [layout, Q.trees, Q.forest, Q.radius, terrain]);
  const colliders = useMemo(() => buildColliders(layout.byId, stores, [...props.trees.filter(t => t.y > -0.2).map(t => ({ x: t.x, z: t.z, r: 0.45 * t.k })), ...props.pines.map(t => ({ x: t.x, z: t.z, r: 0.4 * t.k })), ...props.rocks.filter(r => r.s > 1).map(r => ({ x: r.x, z: r.z, r: r.s * 0.9 })), ...props.lamps.map(l => ({ x: l.x, z: l.z, r: 0.2 })), ...props.ponds]), [layout, stores, props]);
  const doors = useMemo(() => {
    const have = new Set(stores.map(s => s.plotId)), out: { id: string; x: number; z: number; r: number }[] = [];
    for (const s of stores) { const p = layout.byId.get(s.plotId); if (p) { const [x, z] = storeDoor(p, s.config); out.push({ id: s.plotId, x, z, r: 6.5 }); } }
    for (const p of layout.plots) if (!have.has(p.id)) { const [x, z] = plotFront(p); out.push({ id: p.id, x, z, r: 5 }); }
    return out;
  }, [stores, layout]);
  const half = terrain.size / 2 - 40, cx = (terrain.city.x0 + terrain.city.x1) / 2, cz = (terrain.city.z0 + terrain.city.z1) / 2;
  const bounds = useMemo(() => ({ x0: cx - half, x1: cx + half, z0: cz - half, z1: cz + half }), [cx, cz, half]);
  useEffect(() => { useUI.getState().init(); useUI.getState().setInv(loadInventory()); }, []);
  return (
    <Canvas key={quality} frameloop={paused ? 'never' : 'always'} shadows={Q.shadow > 0} dpr={Q.dpr} camera={{ fov: mode === 'city' ? 58 : 42, near: 0.1, far: 2200, position: mode === 'city' ? [-4.4, 3.4, 39.5] : [0, 95, 145] }}
      gl={{ antialias: !Q.post, powerPreference: 'high-performance' }} onCreated={({ gl }) => { gl.toneMapping = THREE.NoToneMapping; }}>
      <World stores={stores} layout={layout} quality={quality} />
      {mode === 'city' ? <Player colliders={colliders} doors={doors} bounds={bounds} terrain={terrain} resources={props.resources} /> : <LandingRig />}
      <Effects q={quality} />
    </Canvas>
  );
}
