'use client';
import * as THREE from 'three';
import { solid } from '@/lib/materials';

const UB = new THREE.BoxGeometry(1, 1, 1), UC = new THREE.CylinderGeometry(1, 1, 1, 16), US = new THREE.SphereGeometry(1, 14, 10);
const cache: Record<string, THREE.MeshStandardMaterial> = {};
const M = (k: string, c: string, o: any = {}) => (cache[k] ||= new THREE.MeshStandardMaterial({ color: c, roughness: 0.6, ...o }));
type V3 = [number, number, number];
const Bx = ({ s, p, m, r }: { s: V3; p: V3; m: THREE.Material; r?: V3 }) => <mesh geometry={UB} scale={s} position={p} material={m} rotation={r} receiveShadow />;
const Cy = ({ s, p, m }: { s: V3; p: V3; m: THREE.Material }) => <mesh geometry={UC} scale={s} position={p} material={m} />;
const Sp = ({ s, p, m }: { s: V3; p: V3; m: THREE.Material }) => <mesh geometry={US} scale={s} position={p} material={m} />;

const wood = () => M('wood', '#8a5d3a', { roughness: 0.55 });
const lightWood = () => M('lwood', '#c9a67a');
const white = () => M('white', '#eceae4');
const dark = () => M('dark', '#23272d', { metalness: 0.5 });
const screen = (c = '#58a6ff') => M('scr' + c, '#111', { emissive: c, emissiveIntensity: 1.1 });
const accent = (c: string) => M('acc' + c, c, { emissive: c, emissiveIntensity: 2 });
const palette = ['#e4572e', '#2e86ab', '#f2c14e', '#7a9e7e', '#c14d9b', '#f4f1ea', '#222a35'];

const Laptop = ({ p, r = 0 }: { p: V3; r?: number }) => (
  <group position={p} rotation={[0, r, 0]}>
    <Bx s={[0.5, 0.02, 0.35]} p={[0, 0, 0]} m={M('lapb', '#c8ccd2', { metalness: 0.8, roughness: 0.3 })} />
    <Bx s={[0.5, 0.33, 0.015]} p={[0, 0.17, -0.17]} r={[-0.18, 0, 0]} m={screen()} />
  </group>
);
const Table = ({ p, w = 2.2, d = 1 }: { p: V3; w?: number; d?: number }) => (
  <group position={p}><Bx s={[w, 0.06, d]} p={[0, 0.85, 0]} m={lightWood()} />
    {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b], i) => <Bx key={i} s={[0.06, 0.85, 0.06]} p={[a * (w / 2 - 0.1), 0.42, b * (d / 2 - 0.1)]} m={dark()} />)}</group>
);
const Shelf = ({ p, w = 2.4, h = 2.3, rows = 4, items }: { p: V3; w?: number; h?: number; rows?: number; items: 'boxes' | 'screens' | 'games' }) => (
  <group position={p}>
    <Bx s={[w, h, 0.4]} p={[0, h / 2, 0]} m={dark()} />
    {Array.from({ length: rows }).map((_, r) => (
      <group key={r}>
        <Bx s={[w, 0.04, 0.5]} p={[0, 0.3 + r * ((h - 0.4) / rows), 0.05]} m={white()} />
        {Array.from({ length: 5 }).map((_, i) => (
          <Bx key={i} s={items === 'screens' ? [0.3, 0.2, 0.04] : [0.28, 0.3, 0.12]} p={[-w / 2 + 0.3 + i * (w - 0.6) / 4, 0.5 + r * ((h - 0.4) / rows), 0.1]}
            m={items === 'screens' ? screen(i % 2 ? '#58a6ff' : '#7dd3fc') : M('it' + ((r + i) % 7), palette[(r * 2 + i) % 7])} />
        ))}
      </group>
    ))}
  </group>
);
const Counter = ({ p, w = 2.6, c = '#eceae4' }: { p: V3; w?: number; c?: string }) => (
  <group position={p}><Bx s={[w, 1, 0.8]} p={[0, 0.5, 0]} m={M('ctr' + c, c)} /><Bx s={[w + 0.1, 0.05, 0.9]} p={[0, 1.02, 0]} m={wood()} />
    <Bx s={[0.4, 0.3, 0.03]} p={[0.4, 1.2, 0]} m={screen('#7dd3fc')} /></group>
);
const Ceiling = ({ color }: { color: string }) => <>{[-2.4, 0, 2.4].map(x => <Bx key={x} s={[0.25, 0.05, 6]} p={[x, 4.2, 0]} m={accent(color)} />)}</>;
const Rack = ({ p }: { p: V3 }) => (
  <group position={p}><Cy s={[0.025, 0.025, 2]} p={[0, 1.5, 0]} m={solid('alu')} /><mesh geometry={UC} scale={[0.02, 0.02, 1]} rotation={[0, 0, Math.PI / 2]} position={[0, 1.7, 0]} material={solid('alu')} />
    {Array.from({ length: 7 }).map((_, i) => <Bx key={i} s={[0.05, 0.9, 0.5]} p={[-0.9 + i * 0.3, 1.2, 0]} m={M('cl' + (i % 7), palette[i % 7])} />)}
    <Bx s={[2, 0.03, 0.03]} p={[0, 1.7, 0]} m={solid('alu')} /></group>
);
const Mannequin = ({ p, c }: { p: V3; c: string }) => (
  <group position={p}><Cy s={[0.03, 0.03, 1]} p={[0, 0.5, 0]} m={dark()} /><Bx s={[0.4, 0.7, 0.22]} p={[0, 1.2, 0]} m={M('mq' + c, c)} /><Sp s={[0.11, 0.13, 0.11]} p={[0, 1.7, 0]} m={white()} /></group>
);

export function Interior({ type, theme, lights = true }: { type: string; theme: string; lights?: boolean }) {
  const c = lights ? '#ffe2b0' : '#887a68';
  return (
    <group position={[0, 0.2, 0]}>
      <Bx s={[9.2, 0.02, 7]} p={[0, 0.01, 0]} m={M('floor', '#e9c9a0', { roughness: 0.9, emissive: '#b98a4a', emissiveIntensity: lights ? 0.3 : 0.05 })} />
      <Bx s={[9.2, 4.3, 0.05]} p={[0, 2.15, -3.4]} m={M('iwall', '#fdf1de', { emissive: '#e0b070', emissiveIntensity: lights ? 0.5 : 0.05 })} />
      <Ceiling color={c} />
      {type === 'tech' && <>
        <Shelf p={[-3.2, 0, -3.1]} items="screens" /><Shelf p={[0, 0, -3.1]} items="boxes" /><Shelf p={[3.2, 0, -3.1]} items="screens" />
        <Table p={[-2.2, 0, 0]} /><Table p={[2.2, 0, 0]} /><Laptop p={[-2.6, 0.9, 0]} /><Laptop p={[-1.8, 0.9, 0]} /><Laptop p={[1.8, 0.9, 0]} /><Laptop p={[2.6, 0.9, 0]} />
        <Counter p={[3.2, 0, 1.9]} /><Bx s={[3, 1.5, 0.05]} p={[0, 2.8, -3.35]} m={screen(theme)} />
      </>}
      {type === 'fashion' && <>
        <Rack p={[-2.8, 0, -1]} /><Rack p={[0, 0, -2]} /><Rack p={[2.8, 0, -1]} />
        <Shelf p={[-3.2, 0, -3.1]} items="boxes" /><Shelf p={[3.2, 0, -3.1]} items="boxes" />
        <Mannequin p={[-1.2, 0, 2]} c="#c14d9b" /><Mannequin p={[0, 0, 2.3]} c="#222a35" /><Mannequin p={[1.2, 0, 2]} c="#e4c9a0" />
        <Counter p={[0, 0, -3]} c="#222a35" />
      </>}
      {type === 'gaming' && <>
        <Shelf p={[-3.2, 0, -3.1]} items="games" /><Shelf p={[3.2, 0, -3.1]} items="games" /><Bx s={[3.4, 1.8, 0.05]} p={[0, 2.5, -3.35]} m={screen('#a78bfa')} />
        {[-3, -1, 1, 3].map(x => <group key={x}><Table p={[x, 0, 0.6]} w={1.4} d={0.8} /><Bx s={[0.6, 0.35, 0.03]} p={[x, 1.1, 0.4]} m={screen(x % 2 ? '#34d399' : '#a78bfa')} /><Bx s={[0.5, 0.9, 0.5]} p={[x, 0.45, 1.5]} m={dark()} /></group>)}
        <Bx s={[8.6, 0.06, 0.06]} p={[0, 3.7, 3.1]} m={accent('#a78bfa')} /><Bx s={[0.06, 3, 0.06]} p={[-4.4, 1.7, -2]} m={accent('#22d3ee')} /><Bx s={[0.06, 3, 0.06]} p={[4.4, 1.7, -2]} m={accent('#22d3ee')} />
      </>}
      {type === 'cafe' && <>
        <Counter p={[0, 0, -2.6]} w={5} c="#3b3430" /><Bx s={[0.6, 0.45, 0.4]} p={[-1.2, 1.28, -2.6]} m={solid('steel')} />
        <Bx s={[4, 0.9, 0.04]} p={[0, 2.8, -3.3]} m={M('menu', '#1b2a22', { emissive: '#254a37', emissiveIntensity: 0.5 })} />
        {[-3, -1, 1, 3].map((x, i) => <group key={x} position={[x, 0, 1 + (i % 2) * 0.5]}>
          <Cy s={[0.4, 0.04, 0.4]} p={[0, 0.78, 0]} m={wood()} /><Cy s={[0.04, 0.78, 0.04]} p={[0, 0.39, 0]} m={dark()} />
          {[-1, 1].map(s => <Cy key={s} s={[0.18, 0.04, 0.18]} p={[s * 0.6, 0.45, 0]} m={M('stool', '#b5552a')} />)}
          <mesh position={[0, 2.9, 0]} geometry={UC} scale={[0.25, 0.2, 0.25]} material={accent('#ffb866')} /></group>)}
      </>}
      {type === 'office' && <>
        {[-3, 0, 3].map(x => [0.2, 2.2].map(z => <group key={x + '' + z}><Table p={[x, 0, z]} w={2} d={0.9} /><Bx s={[0.6, 0.35, 0.03]} p={[x, 1.1, z - 0.2]} m={screen()} /><Bx s={[0.5, 0.9, 0.5]} p={[x, 0.45, z + 0.8]} m={dark()} /></group>))}
        <Counter p={[-3.4, 0, -2.6]} w={3} /><Bx s={[2.6, 1.2, 0.05]} p={[2.6, 2.4, -3.35]} m={screen(theme)} />
      </>}
      {type === 'grocery' && <>
        <Shelf p={[-3.2, 0, -3.1]} items="boxes" /><Shelf p={[0, 0, -3.1]} items="boxes" /><Shelf p={[3.2, 0, -3.1]} items="boxes" />
        <Shelf p={[-2.2, 0, 0]} w={2.4} h={1.4} rows={2} items="boxes" /><Shelf p={[2.2, 0, 0]} w={2.4} h={1.4} rows={2} items="boxes" /><Counter p={[3.2, 0, 2.2]} />
      </>}
      {type === 'house' && <>
        <Bx s={[2.8, 0.55, 1]} p={[-2, 0.28, 1.6]} m={M('sofa2', theme)} /><Bx s={[2.8, 0.5, 0.2]} p={[-2, 0.7, 2.0]} m={M('sofa2', theme)} />
        <Table p={[2.4, 0, 0.4]} w={1.6} d={1} /><Bx s={[2.6, 1.4, 0.3]} p={[0, 0.7, -3.2]} m={lightWood()} /><Bx s={[1.6, 0.9, 0.04]} p={[0, 1.6, -3.0]} m={screen('#ffd48a')} />
      </>}
      {type === 'boutique' && <>
        {[-3, 0, 3].map((x, i) => <group key={x}><Cy s={[0.55, 0.45, 0.55]} p={[x, 0.22, 0.5]} m={white()} /><Sp s={[0.2, 0.2, 0.2]} p={[x, 0.65, 0.5]} m={M('gem' + i, palette[i], { metalness: 0.7, roughness: 0.2 })} /></group>)}
        <Shelf p={[-2.2, 0, -3.1]} items="boxes" /><Shelf p={[2.2, 0, -3.1]} items="boxes" /><Bx s={[1.4, 2.4, 0.05]} p={[0, 1.4, -3.3]} m={M('mir', '#cfd8dc', { metalness: 1, roughness: 0.05 })} />
        <Bx s={[2.4, 0.5, 0.9]} p={[0, 0.25, 2.2]} m={M('sofa', theme)} />
      </>}
    </group>
  );
}
