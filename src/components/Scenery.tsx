'use client';
import * as THREE from 'three';
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { Terrain, terrainColor, WATER_Y } from '@/lib/terrain';
import { solid, mat, sbox } from '@/lib/materials';
import { ResNode, getVersion, isCollected, tickRespawn } from '@/lib/resources';
import type { Blob, Tree } from '@/lib/props';
import { Inst, Item, UCYL } from './Inst';

const flat = (c = '#ffffff') => new THREE.MeshStandardMaterial({ color: c, flatShading: true, roughness: 0.95 });
const ICO1 = new THREE.IcosahedronGeometry(1, 1), ICO0 = new THREE.IcosahedronGeometry(1, 0), DODE = new THREE.DodecahedronGeometry(1, 0), OCTA = new THREE.OctahedronGeometry(1, 0), CONE = new THREE.ConeGeometry(1, 1, 6);

/** Faceted low-poly terrain: flat (y = 0) under the city, hills / mountains / river outside it. Each triangle gets its own pastel colour. */
export function TerrainMesh({ terrain, seg }: { terrain: Terrain; seg: number }) {
  const geo = useMemo(() => {
    const size = terrain.size, cx = (terrain.city.x0 + terrain.city.x1) / 2, cz = (terrain.city.z0 + terrain.city.z1) / 2;
    let g: THREE.BufferGeometry = new THREE.PlaneGeometry(size, size, seg, seg); g.rotateX(-Math.PI / 2); g.translate(cx, 0, cz);
    const p = g.attributes.position; for (let i = 0; i < p.count; i++) p.setY(i, terrain.height(p.getX(i), p.getZ(i)));
    g = g.toNonIndexed(); g.deleteAttribute('uv'); const q = g.attributes.position, cols = new Float32Array(q.count * 3), cell = size / seg;
    for (let i = 0; i < q.count; i += 3) {
      const ys = [q.getY(i), q.getY(i + 1), q.getY(i + 2)], h = (ys[0] + ys[1] + ys[2]) / 3, slope = (Math.max(...ys) - Math.min(...ys)) / cell;
      const mx = (q.getX(i) + q.getX(i + 1) + q.getX(i + 2)) / 3, mz = (q.getZ(i) + q.getZ(i + 1) + q.getZ(i + 2)) / 3;
      const c = terrainColor(h, slope, terrain.riverDist(mx, mz)), v = 0.965 + (Math.sin(mx * 12.9898 + mz * 78.233) * 43758.5453 % 1 + 1) % 1 * 0.07;
      for (let k = 0; k < 3; k++) { cols[(i + k) * 3] = Math.min(1, c[0] * v); cols[(i + k) * 3 + 1] = Math.min(1, c[1] * v); cols[(i + k) * 3 + 2] = Math.min(1, c[2] * v); }
    }
    g.setAttribute('color', new THREE.BufferAttribute(cols, 3)); g.computeVertexNormals(); return g;
  }, [terrain.version, seg]); // eslint-disable-line
  return <mesh geometry={geo} receiveShadow><meshStandardMaterial vertexColors flatShading roughness={1} /></mesh>;
}

export function Water({ terrain }: { terrain: Terrain }) {
  const ref = useRef<THREE.Mesh>(null), cx = (terrain.city.x0 + terrain.city.x1) / 2, cz = (terrain.city.z0 + terrain.city.z1) / 2;
  useFrame(({ clock }) => { if (ref.current) ref.current.position.y = WATER_Y + Math.sin(clock.elapsedTime * 1.2) * 0.025; });
  return <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[cx, WATER_Y, cz]} material={solid('water')}><planeGeometry args={[terrain.size, terrain.size]} /></mesh>;
}

export function Pines({ pines }: { pines: Tree[] }) {
  const m = useMemo(() => flat(), []), trunk = useMemo(() => solid('trunk'), []);
  const mk = (oy: number, rs: number, hs: number): Item[] => pines.map(t => ({ p: [t.x, t.y + oy * t.k, t.z], s: [rs * t.k, hs * t.k, rs * t.k], c: t.c, r: t.x }));
  const tr = useMemo<Item[]>(() => pines.map(t => ({ p: [t.x, t.y + 0.9 * t.k, t.z], s: [0.2 * t.k, 1.8 * t.k, 0.2 * t.k] })), [pines]);
  const a = useMemo(() => mk(2.3, 1.7, 2.4), [pines]), b = useMemo(() => mk(3.6, 1.3, 2.1), [pines]), c = useMemo(() => mk(4.8, 0.9, 1.8), [pines]); // eslint-disable-line
  return <><Inst geo={UCYL} material={trunk} items={tr} cast /><Inst geo={CONE} material={m} items={a} cast /><Inst geo={CONE} material={m} items={b} cast /><Inst geo={CONE} material={m} items={c} cast /></>;
}

export function Rocks({ rocks }: { rocks: Blob[] }) {
  const m = useMemo(() => flat(), []);
  const items = useMemo<Item[]>(() => rocks.map(r => ({ p: [r.x, r.y + r.s * 0.3, r.z], s: [r.s * 1.3, r.s * 0.8, r.s], c: r.c, r: r.x * 3 })), [rocks]);
  return <Inst geo={DODE} material={m} items={items} cast recv />;
}

export function Hedges({ bushes, flowers }: { bushes: Blob[]; flowers: Blob[] }) {
  const m = useMemo(() => flat(), []);
  const b = useMemo<Item[]>(() => bushes.map(x => ({ p: [x.x, x.y + x.s * 0.55, x.z], s: [x.s * 1.5, x.s, x.s * 1.2], c: x.c, r: x.x })), [bushes]);
  const f = useMemo<Item[]>(() => flowers.map(x => ({ p: [x.x, x.y, x.z], s: [x.s, x.s, x.s], c: x.c })), [flowers]);
  return <><Inst geo={ICO1} material={m} items={b} cast recv /><Inst geo={ICO0} material={m} items={f} /></>;
}

/** Gatherable nodes (wood / stone / crystal). Collected nodes shrink away and come back after a while. */
export function ResourceMeshes({ nodes }: { nodes: ResNode[] }) {
  const refs = { wood: useRef<THREE.InstancedMesh>(null), stone: useRef<THREE.InstancedMesh>(null), crystal: useRef<THREE.InstancedMesh>(null) };
  const last = useRef(-1), clock = useRef(0);
  const logGeo = useMemo(() => { const l = (x: number, y: number) => { const g = new THREE.CylinderGeometry(0.2, 0.2, 1.3, 6); g.rotateZ(Math.PI / 2); g.translate(0, y, x); return g; }; return mergeGeometries([l(-0.25, 0.2), l(0.25, 0.2), l(0, 0.55)])!; }, []);
  const mats = useMemo(() => ({ wood: flat('#a8723f'), stone: flat('#8d9bb8'), crystal: new THREE.MeshStandardMaterial({ color: '#9ae9ff', emissive: '#5fd0ff', emissiveIntensity: 0.7, flatShading: true }) }), []);
  const by = useMemo(() => ({ wood: nodes.filter(n => n.type === 'wood'), stone: nodes.filter(n => n.type === 'stone'), crystal: nodes.filter(n => n.type === 'crystal') }), [nodes]);
  useFrame((_, dt) => {
    clock.current += dt; if (clock.current > 2) { clock.current = 0; tickRespawn(); }
    const v = getVersion(); if (v === last.current) return; last.current = v;
    const o = new THREE.Object3D();
    (['wood', 'stone', 'crystal'] as const).forEach(t => {
      const m = refs[t].current; if (!m) return;
      by[t].forEach((n, i) => { const k = isCollected(n.id) ? 0.0001 : 1; o.position.set(n.x, n.y + (t === 'stone' ? 0.35 : t === 'crystal' ? 0.7 : 0), n.z); o.rotation.set(0, n.x * 2.3, 0); o.scale.set(t === 'stone' ? 0.8 * k : t === 'crystal' ? 0.45 * k : k, t === 'stone' ? 0.6 * k : t === 'crystal' ? 0.95 * k : k, t === 'stone' ? 0.7 * k : t === 'crystal' ? 0.45 * k : k); o.updateMatrix(); m.setMatrixAt(i, o.matrix); });
      m.instanceMatrix.needsUpdate = true;
    });
  });
  return (
    <>
      {by.wood.length > 0 && <instancedMesh key={'w' + by.wood.length} ref={refs.wood} args={[logGeo, mats.wood, by.wood.length]} castShadow frustumCulled={false} />}
      {by.stone.length > 0 && <instancedMesh key={'s' + by.stone.length} ref={refs.stone} args={[DODE, mats.stone, by.stone.length]} castShadow frustumCulled={false} />}
      {by.crystal.length > 0 && <instancedMesh key={'c' + by.crystal.length} ref={refs.crystal} args={[OCTA, mats.crystal, by.crystal.length]} frustumCulled={false} />}
    </>
  );
}

