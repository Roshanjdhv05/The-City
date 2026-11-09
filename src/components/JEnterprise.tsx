'use client';
import * as THREE from 'three';
import { useMemo } from 'react';
import { Detailed } from '@react-three/drei';
import { mat, glassMat, solid, sbox } from '@/lib/materials';
import { JE_BLOCKS } from '@/lib/plots';
import { B } from './Building';

type V3 = [number, number, number];
const UBOX = new THREE.BoxGeometry(1, 1, 1);
const Px = ({ s, p, m, r }: { s: V3; p: V3; m: THREE.Material; r?: V3 }) => <mesh geometry={UBOX} scale={s} position={p} material={m} rotation={r} />;

// ---------------- textures (generated once, cached) ----------------
function drawJ(g: CanvasRenderingContext2D, cx: number, cy: number, s: number) {
  const P = (x: number, y: number) => [cx + (x - 0.5) * s, cy + (y - 0.5) * s] as const;
  const pts = [[0.3, 0.12], [0.9, 0.12], [0.9, 0.62], [0.7, 0.9], [0.3, 0.9], [0.3, 0.66], [0.52, 0.66], [0.6, 0.58], [0.6, 0.3], [0.3, 0.3]];
  g.beginPath(); pts.forEach(([x, y], i) => { const [px, py] = P(x, y); i ? g.lineTo(px, py) : g.moveTo(px, py); }); g.closePath();
  const gr = g.createLinearGradient(cx - s / 2, cy - s / 2, cx + s / 2, cy + s / 2); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.55, '#b9d2ff'); gr.addColorStop(1, '#5b8cff');
  g.shadowColor = '#4f86ff'; g.shadowBlur = s * 0.12; g.fillStyle = gr; g.fill(); g.shadowBlur = 0;
  g.strokeStyle = 'rgba(255,255,255,.65)'; g.lineWidth = s * 0.012; g.stroke();
  g.beginPath(); [[0.3, 0.12], [0.9, 0.12], [0.9, 0.2], [0.3, 0.3]].forEach(([x, y], i) => { const [px, py] = P(x, y); i ? g.lineTo(px, py) : g.moveTo(px, py); }); g.closePath(); g.fillStyle = 'rgba(255,255,255,.55)'; g.fill();
}
const mk = (w: number, h: number, f: (g: CanvasRenderingContext2D) => void) => {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d')!; f(g);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
};
const glowText = (g: CanvasRenderingContext2D, txt: string, x: number, y: number, px: number, color = '#fff', glow = '#3b82f6', align: CanvasTextAlign = 'center', weight = 800) => {
  g.font = `${weight} ${px}px Arial, sans-serif`; g.textAlign = align; g.textBaseline = 'middle'; g.shadowColor = glow; g.shadowBlur = px * 0.35; g.fillStyle = color; g.fillText(txt, x, y); g.shadowBlur = 0;
};
let cache: any = null;
function textures() {
  if (cache) return cache;
  cache = {
    main: mk(1024, 1024, g => { drawJ(g, 512, 380, 520); glowText(g, 'J ENTERPRISE', 512, 800, 118); }),
    mon1: mk(1024, 360, g => { drawJ(g, 130, 150, 190); glowText(g, 'J ENTERPRISE', 560, 130, 112); g.fillStyle = '#9db4d8'; g.font = '600 52px Arial'; g.textAlign = 'center'; g.fillText('Innovate  ·  Build  ·  Grow', 560, 255); }),
    mon2: mk(512, 1024, g => {
      drawJ(g, 256, 190, 250); glowText(g, 'J ENTERPRISE', 256, 400, 62);
      g.fillStyle = '#3b82f6'; g.shadowColor = '#3b82f6'; g.shadowBlur = 14; g.fillRect(70, 450, 372, 6); g.shadowBlur = 0;
      ['Web Solutions', 'App Development', 'Digital Growth', 'Consulting'].forEach((t, i) => { g.fillStyle = '#e8eefc'; g.font = '500 44px Arial'; g.textAlign = 'left'; g.fillText(t, 80, 540 + i * 86); });
    }),
    fascia: mk(1024, 128, g => { glowText(g, 'J ENTERPRISE', 512, 66, 84, '#ffffff', '#4f86ff', 'center', 700); }),
    banner: mk(128, 400, g => { const gr = g.createLinearGradient(0, 0, 0, 400); gr.addColorStop(0, '#223a8f'); gr.addColorStop(1, '#101c4a'); g.fillStyle = gr; g.fillRect(0, 0, 128, 400); drawJ(g, 64, 120, 90); g.strokeStyle = 'rgba(255,255,255,.4)'; g.lineWidth = 4; g.strokeRect(6, 6, 116, 388); }),
    glow: mk(64, 256, g => {
      const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, '#ffd9a0'); gr.addColorStop(1, '#c98a4a'); g.fillStyle = gr; g.fillRect(0, 0, 64, 256);
      g.fillStyle = 'rgba(255,255,255,.55)'; g.fillRect(0, 6, 64, 6); g.fillStyle = 'rgba(60,35,15,.5)'; for (let i = 0; i < 5; i++) g.fillRect(6 + i * 11, 176 + (i % 2) * 8, 6, 44);
    }),
  };
  return cache;
}
const emiss = (tex: THREE.Texture, i = 1.4, transparent = false) => new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: '#ffffff', emissiveIntensity: i, roughness: 0.5, transparent, alphaTest: transparent ? 0.04 : 0 });

/** Glass curtain wall with visible floor plates, warm interior and desks behind it. Local +z faces outward. */
function Curtain({ w, h, levels, cols, pos, ry = 0, glass, tex, seed = 1 }: { w: number; h: number; levels: number; cols: number; pos: V3; ry?: number; glass: THREE.Material; tex: THREE.Texture; seed?: number }) {
  const lh = h / levels, glowM = useMemo(() => new THREE.MeshBasicMaterial({ map: tex, color: '#ffe9cc' }), [tex]);
  const desks = useMemo(() => { let s = seed * 97; const r = () => ((s = (s * 16807) % 2147483647) / 2147483647); const o: { x: number; y: number; z: number; w: number }[] = []; for (let l = 0; l < levels; l++) for (let i = 0; i < Math.round(w / 2.2); i++) o.push({ x: (r() - 0.5) * (w - 1.5), y: l * lh, z: -0.9 - r() * 1.6, w: 0.9 + r() * 0.8 }); return o; }, [w, levels, lh, seed]);
  const dark = solid('dark'), scr = useMemo(() => new THREE.MeshStandardMaterial({ color: '#111', emissive: '#7dd3fc', emissiveIntensity: 1.2 }), []);
  return (
    <group position={pos} rotation={[0, ry, 0]}>
      <mesh position={[0, h / 2, -2.6]} material={glowM}><planeGeometry args={[w, h]} /></mesh>
      <mesh position={[0, h / 2, -0.02]} material={glass}><planeGeometry args={[w, h]} /></mesh>
      {Array.from({ length: levels + 1 }).map((_, i) => <group key={i}><B s={[w, 0.12, 0.14]} p={[0, i * lh, 0.02]} m={dark} cast={false} />{i > 0 && i < levels + 1 && <B s={[w, 0.16, 2.6]} p={[0, i * lh - 0.08, -1.3]} m={solid('steel')} cast={false} recv={false} />}</group>)}
      {Array.from({ length: cols + 1 }).map((_, i) => <B key={i} s={[0.09, h, 0.16]} p={[-w / 2 + (i * w) / cols, h / 2, 0.02]} m={dark} cast={false} />)}
      {desks.map((d, i) => <group key={i}><Px s={[d.w, 0.72, 0.6]} p={[d.x, d.y + 0.45, d.z]} m={dark} /><Px s={[0.5, 0.3, 0.03]} p={[d.x, d.y + 0.95, d.z - 0.1]} m={scr} /></group>)}
    </group>
  );
}

function Palm({ p, h = 4.2 }: { p: V3; h?: number }) {
  return (
    <group position={p}>
      <mesh position={[0, h / 2, 0]} castShadow><cylinderGeometry args={[0.1, 0.18, h, 8]} /><meshStandardMaterial color="#b97b4d" roughness={1} flatShading /></mesh>
      {Array.from({ length: 9 }).map((_, i) => <mesh key={i} position={[Math.cos((i / 9) * 6.283) * 0.9, h + 0.1, Math.sin((i / 9) * 6.283) * 0.9]} rotation={[0, -(i / 9) * 6.283, -0.55]} castShadow><boxGeometry args={[1.9, 0.04, 0.42]} /><meshStandardMaterial color={i % 2 ? '#4f9b40' : '#5fae48'} roughness={0.8} flatShading /></mesh>)}
    </group>
  );
}
function Shrubs({ x, z, w, n, seed }: { x: number; z: number; w: number; n: number; seed: number }) {
  const items = useMemo(() => { let s = seed; const r = () => ((s = (s * 16807) % 2147483647) / 2147483647); const cols = ['#5fae48', '#6bb852', '#4f9b40', '#d9a0b4', '#e6bccb', '#79c05a']; return Array.from({ length: n }, () => ({ x: (r() - 0.5) * (w - 0.8), z: (r() - 0.5) * 1, s: 0.3 + r() * 0.35, c: cols[(r() * cols.length) | 0] })); }, [w, n, seed]);
  return <group position={[x, 0.55, z]}>{items.map((it, i) => <mesh key={i} position={[it.x, it.s * 0.6, it.z]} scale={[1.3, 0.9, 1]} castShadow><icosahedronGeometry args={[it.s, 1]} /><meshStandardMaterial color={it.c} roughness={0.9} flatShading /></mesh>)}</group>;
}

export function JEnterprise() {
  const T = textures(), glass = useMemo(() => { const m = glassMat('blue').clone(); (m as THREE.MeshStandardMaterial).color.set('#80b6de'); (m as THREE.MeshStandardMaterial).opacity = 0.5; return m; }, []);
  const marble = useMemo(() => new THREE.MeshStandardMaterial({ color: '#3d4a8a', flatShading: true, roughness: 0.8 }), []), stoneL = useMemo(() => new THREE.MeshStandardMaterial({ color: '#e6d5ba', flatShading: true, roughness: 0.8 }), []), stoneD = useMemo(() => new THREE.MeshStandardMaterial({ color: '#cf9078', flatShading: true, roughness: 0.8 }), []);
  const metal = useMemo(() => new THREE.MeshStandardMaterial({ color: '#2b3668', flatShading: true, roughness: 0.8 }), []), alu = solid('alu'), led = useMemo(() => new THREE.MeshStandardMaterial({ color: '#fffaf0', emissive: '#fff0c8', emissiveIntensity: 1.6, flatShading: true }), []);
  const mainM = useMemo(() => emiss(T.main, 1.5, true), [T]), mon1M = useMemo(() => emiss(T.mon1, 1.2), [T]), mon2M = useMemo(() => emiss(T.mon2, 1.2), [T]), banM = useMemo(() => emiss(T.banner, 0.5), [T]);
  const paving = useMemo(() => mat('pave', '#e2d6bf', 8, 3, 0.45), []);
  const fasciaM = useMemo(() => emiss(T.fascia, 1.5, true), [T]), uplight = useMemo(() => new THREE.MeshStandardMaterial({ color: '#cfe4ff', emissive: '#ffe9b0', emissiveIntensity: 1.4, flatShading: true }), []), accent = useMemo(() => new THREE.MeshStandardMaterial({ color: '#9fe8ff', emissive: '#4fc3e8', emissiveIntensity: 1.5, flatShading: true }), []);
  const bollards: [number, number][] = [[-5.2, 12], [-5.2, 14.5], [4.4, 12], [4.4, 14.5], [-13.6, 11], [14, 11], [-0.5, 14.8]];
  const fins = [-5.1, -5.7, -6.3, -6.9, -7.5, -8.1];
  return (
    <group>
      {/* plinth + forecourt */}
      <B s={[24.6, 0.7, 15.6]} p={[0, 0.35, 0]} m={stoneD} />
      <mesh geometry={sbox(30, 0.06, 7, 4)} position={[0, 0.07, 11]} material={paving} receiveShadow />
      <Px s={[24.4, 0.05, 0.05]} p={[0, 0.72, 7.84]} m={accent} />
      {[1, 2, 3, 4].map(j => <B key={j} s={[9, 0.175 * j, 0.55]} p={[-0.5, (0.175 * j) / 2, 7.5 + (5 - j) * 0.55 - 0.1]} m={stoneL} />)}
      <group position={[0, 0.7, 0]}>
        {/* core marble tower */}
        <B s={[8, 12.5, 15]} p={[-0.5, 5.2 + 6.25, 0]} m={marble} />
        <mesh position={[-0.5, 11.9, 7.52]} material={mainM}><planeGeometry args={[5.8, 5.8]} /></mesh>
        {[-4.5, 3.5].map(x => <Px key={x} s={[0.12, 12.5, 0.12]} p={[x, 11.45, 7.56]} m={led} />)}
        {fins.map((x, i) => <B key={i} s={[0.3, 12.3, 0.9]} p={[x - 0.5, 6.1, 7.05]} m={metal} />)}
        <B s={[9, 0.5, 15.6]} p={[-0.5, 17.95, 0]} m={metal} /><B s={[6.4, 1.1, 11]} p={[-0.5, 18.75, 0]} m={marble} /><B s={[3.4, 0.9, 6]} p={[-0.5, 19.75, 0]} m={stoneL} />
        <mesh position={[7.7, 19.1, -1]} rotation={[0, Math.PI / 4, 0]} castShadow><coneGeometry args={[3.2, 2.4, 4]} /><meshStandardMaterial color="#80b6de" transparent opacity={0.65} flatShading /></mesh>
        {[[5.4, 3.5], [9.6, 4.8], [9.8, -4.5]].map(([x, z], i) => <mesh key={i} position={[x, 18.45, z]} castShadow><icosahedronGeometry args={[0.7, 1]} /><meshStandardMaterial color="#5fae48" flatShading /></mesh>)}<Px s={[9, 0.06, 0.06]} p={[-0.5, 17.7, 7.7]} m={led} />
        {/* lobby */}
        <B s={[1.1, 5.2, 1.8]} p={[-4.4, 2.6, 6.6]} m={marble} /><B s={[1.1, 5.2, 1.8]} p={[3.4, 2.6, 6.6]} m={marble} />
        <Curtain w={6} h={5.2} levels={1} cols={4} pos={[-0.5, 0, 7.4]} glass={glass} tex={T.glow} seed={9} />
        {[-0.5, 0.5].map(x => <group key={x} position={[x - 0.5, 0, 7.5]}><B s={[0.94, 2.7, 0.06]} p={[0, 1.4, 0]} m={alu} cast={false} /><mesh position={[0, 1.4, 0.03]} material={glass}><planeGeometry args={[0.86, 2.6]} /></mesh><B s={[0.04, 1, 0.08]} p={[x < 0 ? 0.38 : -0.38, 1.2, 0.06]} m={alu} /></group>)}
        <B s={[3.2, 1.05, 0.9]} p={[-1.2, 0.52, 3.2]} m={stoneL} /><mesh position={[-1.2, 1.4, 2.76]}><planeGeometry args={[0.7, 0.7]} /><meshBasicMaterial map={T.main} transparent /></mesh>
        {/* canopy with LED lines */}
        <B s={[9.5, 0.4, 4.6]} p={[-0.5, 5.0, 9.4]} m={metal} /><Px s={[9.5, 0.08, 0.08]} p={[-0.5, 5.0, 11.7]} m={led} />
        {[-3.6, -2.4, -1.2, 0, 1.2, 2.4].map(x => <Px key={x} s={[0.06, 0.05, 3.6]} p={[x - 0.2, 4.78, 9.4]} m={led} />)}
        {/* left glass wing with cantilevered roof and terrace */}
        <Curtain w={7} h={12.6} levels={3} cols={5} pos={[-8.5, 0, 5.6]} glass={glass} tex={T.glow} seed={2} />
        <Curtain w={13} h={12.6} levels={3} cols={8} pos={[-12, 0, 0]} ry={-Math.PI / 2} glass={glass} tex={T.glow} seed={3} />
        <B s={[7.6, 12.6, 0.4]} p={[-8.5, 6.3, -7.3]} m={stoneD} />
        <B s={[8.6, 0.5, 5.2]} p={[-8.2, 13.0, 8.0]} m={metal} /><Px s={[8.6, 0.07, 0.07]} p={[-8.2, 12.72, 10.62]} m={led} />
        <mesh position={[-8.2, 13.0, 10.64]} material={fasciaM}><planeGeometry args={[6.6, 0.42]} /></mesh>
        {[-4.2, -2.4, -0.6, 1.2, 3.0].map(x => <Px key={x} s={[0.5, 0.06, 0.22]} p={[x, 0.03, 7.95]} m={uplight} />)}
        {[-5.2, 4.2].map(x => <Px key={x} s={[0.5, 0.06, 0.22]} p={[x, 0.03, 7.95]} m={uplight} />)}
        <Px s={[8.6, 0.08, 0.08]} p={[7.7, 18.05, 7.85]} m={accent} /><Px s={[0.08, 17.2, 0.08]} p={[3.6, 8.7, 7.82]} m={led} />
        <B s={[7.4, 0.3, 13.2]} p={[-8.5, 12.6, -0.6]} m={metal} />
        {Array.from({ length: 6 }).map((_, i) => <mesh key={i} position={[-11 + i * 1.3, 13.4, 5.2]} castShadow><icosahedronGeometry args={[0.38, 1]} /><meshStandardMaterial color="#5fae48" roughness={0.9} flatShading /></mesh>)}
        <mesh position={[-8.5, 13.4, 5.5]} material={glass}><boxGeometry args={[7.2, 0.9, 0.04]} /></mesh>
        {/* right glass wing with vertical fins */}
        <Curtain w={7.6} h={17.5} levels={4} cols={6} pos={[7.7, 0, 7.2]} glass={glass} tex={T.glow} seed={4} />
        {Array.from({ length: 12 }).map((_, i) => <B key={i} s={[0.1, 17.5, 0.55]} p={[4.2 + i * 0.66, 8.75, 7.7]} m={i % 3 === 0 ? alu : metal} cast={false} />)}
        <B s={[1.2, 17.5, 15]} p={[11.4, 8.75, 0]} m={stoneD} /><B s={[8.6, 0.45, 15.6]} p={[7.7, 17.75, 0]} m={metal} />
        <B s={[8, 17.5, 0.4]} p={[7.7, 8.75, -7.3]} m={stoneD} />
        {Array.from({ length: 10 }).map((_, i) => <B key={i} s={[0.14, 2.4, 0.5]} p={[4.4 + i * 0.7, 19.2, 3 - (i % 2) * 2]} m={metal} />)}
      </group>
      {/* monument signs, planters, landscaping */}
      {JE_BLOCKS.map((b, i) => b.k === 'bed' ? <group key={i}><B s={[b.w, b.h, b.d]} p={[b.x, b.h / 2, b.z]} m={stoneL} /><B s={[b.w - 0.2, 0.06, b.d - 0.2]} p={[b.x, b.h + 0.01, b.z]} m={solid('soil')} cast={false} /></group> :
        <group key={i}><B s={[b.w, b.h, b.d]} p={[b.x, b.h / 2, b.z]} m={marble} />
          <mesh position={[b.x, b.h / 2 + (b.k === 'sign2' ? 0 : 0), b.z + b.d / 2 + 0.01]} material={b.k === 'sign1' ? mon1M : mon2M}><planeGeometry args={[b.w - 0.2, b.h - 0.2]} /></mesh></group>)}
      <Shrubs x={-8.5} z={12.9} w={10} n={14} seed={3} /><Shrubs x={9.8} z={12.9} w={9} n={12} seed={8} />
      <Palm p={[-4.1, 0.55, 12.9]} h={4.6} /><Palm p={[5.7, 0.55, 12.9]} h={3.8} /><Palm p={[-13, 0.1, 9]} h={5.2} /><Palm p={[13.4, 0.1, 9]} h={4.4} />
      {[-12.4, 12.8].map(x => <mesh key={x} position={[x, 2.1, 12.6]} castShadow><coneGeometry args={[0.9, 4.2, 10]} /><meshStandardMaterial color="#3f8f5f" roughness={0.9} flatShading /></mesh>)}
      {bollards.map(([x, z], i) => <group key={i} position={[x, 0, z]}><mesh position={[0, 0.4, 0]} castShadow><cylinderGeometry args={[0.1, 0.1, 0.8, 10]} /><meshStandardMaterial color="#4a5580" roughness={0.7} flatShading /></mesh><mesh position={[0, 0.82, 0]} material={solid('lampHead')}><cylinderGeometry args={[0.1, 0.1, 0.08, 10]} /></mesh></group>)}
      {[[-16, 8], [16, 8]].map(([x, z], i) => <group key={i} position={[x, 0, z]}>
        <mesh position={[0, 3, 0]} castShadow><cylinderGeometry args={[0.08, 0.1, 6, 8]} /><meshStandardMaterial color="#4a5580" roughness={0.7} flatShading /></mesh>
        <mesh position={[x < 0 ? 0.7 : -0.7, 6, 0]} material={solid('lampHead')}><boxGeometry args={[0.8, 0.1, 0.3]} /></mesh>
        <mesh position={[0, 3.6, 0.32]} material={banM}><planeGeometry args={[0.55, 1.7]} /></mesh></group>)}
    </group>
  );
}

/** Medium-distance version (LOD 2): Core tower architecture and signs, without micro shrubs / bollards */
function JEnterpriseMedium() {
  const T = textures(), marble = useMemo(() => new THREE.MeshStandardMaterial({ color: '#3d4a8a', flatShading: true }), []), g = useMemo(() => new THREE.MeshStandardMaterial({ color: '#80b6de', flatShading: true }), []), warm = useMemo(() => new THREE.MeshStandardMaterial({ color: '#ffe0a8', flatShading: true }), []);
  const sign = useMemo(() => new THREE.MeshBasicMaterial({ map: T.main, transparent: true, toneMapped: false }), [T]);
  const dark = solid('dark'), metal = solid('steel');
  return (
    <group>
      <B s={[24.6, 0.7, 15.6]} p={[0, 0.35, 0]} m={dark} />
      <B s={[8, 12.5, 15]} p={[-0.5, 11.95, 0.7]} m={marble} />
      <mesh position={[-0.5, 12.6, 8.25]} material={sign}><planeGeometry args={[5.8, 5.8]} /></mesh>
      <B s={[7, 12.6, 13]} p={[-8.5, 7, -0.6]} m={g} />
      <B s={[7.6, 17.5, 15]} p={[7.7, 9.45, 0]} m={g} />
      <B s={[6, 5.2, 14]} p={[-0.5, 3.3, 0]} m={warm} />
      {/* Upper terrace accent & fin lines */}
      <B s={[7.4, 0.3, 13.2]} p={[-8.5, 12.6, -0.6]} m={metal} />
      <B s={[8.6, 0.45, 15.6]} p={[7.7, 17.75, 0]} m={metal} />
    </group>
  );
}

/** Distant version (LOD 1): massing + sign. */
function JELow() {
  const T = textures(), marble = useMemo(() => new THREE.MeshStandardMaterial({ color: '#3d4a8a', flatShading: true }), []), g = useMemo(() => new THREE.MeshStandardMaterial({ color: '#80b6de', flatShading: true }), []), warm = useMemo(() => new THREE.MeshStandardMaterial({ color: '#ffe0a8', flatShading: true }), []);
  const sign = useMemo(() => new THREE.MeshBasicMaterial({ map: T.main, transparent: true, toneMapped: false }), [T]);
  return (
    <group>
      <B s={[24.6, 0.7, 15.6]} p={[0, 0.35, 0]} m={solid('dark')} />
      <B s={[8, 12.5, 15]} p={[-0.5, 11.95, 0.7]} m={marble} /><mesh position={[-0.5, 12.6, 8.25]} material={sign}><planeGeometry args={[5.8, 5.8]} /></mesh>
      <B s={[7, 12.6, 13]} p={[-8.5, 7, -0.6]} m={g} /><B s={[7.6, 17.5, 15]} p={[7.7, 9.45, 0]} m={g} /><B s={[6, 5.2, 14]} p={[-0.5, 3.3, 0]} m={warm} />
    </group>
  );
}

export function JEnterpriseLOD() {
  return <JEnterprise />;
}
