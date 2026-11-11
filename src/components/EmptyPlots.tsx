'use client';
import * as THREE from 'three';
import { useMemo } from 'react';
import type { Plot } from '@/lib/types';
import { toWorld } from '@/lib/plots';
import { cardTex } from '@/lib/signage';
import { Inst, Item, UBOX } from './Inst';

const PLANE = new THREE.PlaneGeometry(2.6, 1.3);
/** Available / reserved land: one instanced For Sale pad + board + entrance mat per plot (hundreds of plots, a handful of draw calls). */
export function EmptyPlots({ plots }: { plots: Plot[] }) {
  const pad = useMemo(() => new THREE.MeshStandardMaterial({ color: '#d4d8e4', roughness: 0.72 }), []), post = useMemo(() => new THREE.MeshStandardMaterial({ color: '#94a3b8', roughness: 0.28, metalness: 0.72 }), []), mat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#38bdf8', emissive: '#0ea5e9', emissiveIntensity: 0.65, roughness: 0.1, metalness: 0.15 }), []);
  const { pads, posts, mats, boards } = useMemo(() => {
    const pads: Item[] = [], posts: Item[] = [], mats: Item[] = [], boards: Record<string, Item[]> = {};
    for (const p of plots) {
      pads.push({ p: [p.x, 0.04, p.z], r: p.rot, s: [p.w - 0.8, 0.08, p.d - 0.8] });
      for (const sx of [-1, 1]) { const [x, z] = toWorld(p, sx * 1.15, p.d / 2 - 0.9); posts.push({ p: [x, 1.05, z], r: p.rot, s: [0.1, 2.1, 0.1] }); }
      const [mx, mz] = toWorld(p, 0, p.d / 2 + 0.7); mats.push({ p: [mx, 0.16, mz], r: p.rot, s: [2.4, 0.03, 1.0] });
      const [bx, bz] = toWorld(p, 0, p.d / 2 - 0.84), key = p.status === 'reserved' ? 'reserved' : p.tier; (boards[key] ||= []).push({ p: [bx, 1.62, bz], r: p.rot });
    }
    return { pads, posts, mats, boards };
  }, [plots]);
  const bm = useMemo(() => {
    const mk = (l1: string, l2: string, c?: string) => { const t = cardTex(l1, l2, c); return new THREE.MeshStandardMaterial({ map: t, emissiveMap: t, emissive: '#ffffff', emissiveIntensity: 0.45, side: THREE.DoubleSide }); };
    return { free: mk('FOR SALE', 'FREE PLOT'), premium: mk('FOR SALE', '$299/mo'), featured: mk('FOR SALE', '$499/mo'), corner: mk('FOR SALE', '$799/mo'), reserved: mk('RESERVED', 'Not available', '#5a3a06') } as Record<string, THREE.Material>;
  }, []);
  return (
    <>
      <Inst geo={UBOX} material={pad} items={pads} recv /><Inst geo={UBOX} material={post} items={posts} cast /><Inst geo={UBOX} material={mat} items={mats} />
      {Object.entries(boards as Record<string, Item[]>).map(([k, items]) => <Inst key={k} geo={PLANE} material={bm[k]} items={items} />)}
    </>
  );
}
