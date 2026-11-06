'use client';
import * as THREE from 'three';
import { useLayoutEffect, useRef } from 'react';

export type Item = { p: [number, number, number]; r?: number; s?: [number, number, number]; c?: string };
export const UBOX = new THREE.BoxGeometry(1, 1, 1), UCYL = new THREE.CylinderGeometry(1, 1, 1, 8);
export const rnd = (seed: number) => { let s = seed; return () => ((s = (s * 16807) % 2147483647) / 2147483647); };
/** Reusable instanced mesh: one draw call for any number of identical low-poly props. */
export function Inst({ geo, material, items, cast = false, recv = false }: { geo: THREE.BufferGeometry; material: THREE.Material; items: Item[]; cast?: boolean; recv?: boolean }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = ref.current; if (!m) return; const o = new THREE.Object3D(), col = new THREE.Color();
    items.forEach((it, i) => { o.position.set(...it.p); o.rotation.set(0, it.r || 0, 0); o.scale.set(...(it.s || [1, 1, 1])); o.updateMatrix(); m.setMatrixAt(i, o.matrix); if (it.c) { col.set(it.c); m.setColorAt(i, col); } });
    m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [items]);
  if (!items.length) return null;
  return <instancedMesh key={items.length} ref={ref} args={[geo, material, items.length]} castShadow={cast} receiveShadow={recv} frustumCulled={false} />;
}
