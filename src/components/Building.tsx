'use client';
import * as THREE from 'three';
import { useMemo } from 'react';
import { Detailed } from '@react-three/drei';
import type { StoreConfig, Mod } from '@/lib/types';
import { BLD_W as W, BLD_D as D, GH, FH, LV, CELL, GRID } from '@/lib/plots';
import { mat, glassMat, solid, sbox, stripeTex } from '@/lib/materials';
import { useSignTexture, shade } from '@/lib/signage';
import { Interior } from './Interior';
import { CurtainWall, DoubleDoors, getSharedTextures, Px, emiss, V3 } from './CentralBuilding';

export const B = ({ s, p, m, r, cast = true, recv = true }: { s: V3; p: V3; m: THREE.Material; r?: V3; cast?: boolean; recv?: boolean }) => (
  <mesh geometry={sbox(s[0], s[1], s[2])} position={p} material={m} rotation={r} castShadow={cast} receiveShadow={recv} />
);
const Plane = ({ s, p, m, r }: { s: [number, number]; p: V3; m: THREE.Material; r?: V3 }) => (
  <mesh position={p} rotation={r} material={m}><planeGeometry args={s} /></mesh>
);

export function useMats(cfg: StoreConfig) {
  return useMemo(() => ({
    wall: mat(cfg.facade, cfg.tint), floor: mat('pave', '#c9b8a0'), roof: mat('roof'), glass: glassMat(cfg.glass), alu: solid('alu'), dark: solid('dark'),
    steel: solid('steel'), trim: solid('trim'), glow: solid('glow'), wood: mat('wood', '#ffffff'), unit: sbox,
  }), [cfg.facade, cfg.tint, cfg.glass]);
}

// ---------------- Outdoor Monument / Freestanding Sidewalk Board ----------------
const boardCache = new Map<string, THREE.CanvasTexture>();
export function getBoardTexture(name: string, tagline?: string, theme = '#3b82f6') {
  const key = `${name}|${tagline || ''}|${theme}`;
  let tex = boardCache.get(key);
  if (tex) return tex;
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 256;
  const g = c.getContext('2d')!;

  // Dark slate gradient
  const gr = g.createLinearGradient(0, 0, 0, 256);
  gr.addColorStop(0, '#151e33');
  gr.addColorStop(1, '#0a0f1d');
  g.fillStyle = gr;
  g.fillRect(0, 0, 512, 256);

  // Theme colored outer neon border
  g.strokeStyle = theme;
  g.lineWidth = 8;
  g.strokeRect(10, 10, 492, 236);

  // Inner accent line
  g.strokeStyle = 'rgba(255, 255, 255, 0.16)';
  g.lineWidth = 2;
  g.strokeRect(18, 18, 476, 220);

  // Circular brand monogram
  g.fillStyle = theme;
  g.beginPath();
  g.arc(256, 56, 26, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#ffffff';
  g.font = '800 24px Arial, sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  const initial = (name ? name[0] : 'S').toUpperCase();
  g.fillText(initial, 256, 57);

  // Store title in bold glowing typography
  const title = (name || 'COMMERCIAL').toUpperCase();
  let fs = 36;
  g.font = `800 ${fs}px Arial, sans-serif`;
  while (g.measureText(title).width > 440 && fs > 18) {
    fs -= 2;
    g.font = `800 ${fs}px Arial, sans-serif`;
  }
  g.shadowColor = theme;
  g.shadowBlur = 14;
  g.fillStyle = '#ffffff';
  g.fillText(title, 256, 126);
  g.shadowBlur = 0;

  // Tagline or Subtitle
  const sub = tagline || 'PREMIER COMMERCIAL LOCATION';
  let subFs = 18;
  g.font = `600 ${subFs}px Arial, sans-serif`;
  while (g.measureText(sub).width > 450 && subFs > 12) {
    subFs -= 1;
    g.font = `600 ${subFs}px Arial, sans-serif`;
  }
  g.fillStyle = '#94a3b8';
  g.fillText(sub, 256, 180);

  // Bottom verified directory badge
  g.fillStyle = theme;
  g.fillRect(176, 214, 160, 18);
  g.fillStyle = '#ffffff';
  g.font = '700 11px Arial, sans-serif';
  g.fillText('OPEN · DIRECTORY', 256, 223);

  tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  boardCache.set(key, tex);
  return tex;
}

export function OutdoorBoard({
  pos,
  name,
  tagline,
  theme = '#3b82f6',
  baseMat,
  rot = 0,
}: {
  pos: V3;
  name: string;
  tagline?: string;
  theme?: string;
  baseMat: THREE.Material;
  rot?: number;
}) {
  const tex = useMemo(() => getBoardTexture(name, tagline, theme), [name, tagline, theme]);
  const signM = useMemo(() => emiss(tex, 1.3), [tex]);
  const dark = solid('dark');
  const led = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#ffffff',
        emissive: theme,
        emissiveIntensity: 1.8,
        flatShading: true,
      }),
    [theme]
  );

  const w = 2.4, h = 1.6, d = 0.28;
  return (
    <group position={pos} rotation={[0, rot, 0]}>
      {/* Plinth */}
      <B s={[w + 0.3, 0.2, d + 0.35]} p={[0, 0.1, 0]} m={baseMat} />
      {/* Twin support posts */}
      <B s={[0.1, 0.5, 0.16]} p={[-w / 2 + 0.35, 0.42, 0]} m={dark} />
      <B s={[0.1, 0.5, 0.16]} p={[w / 2 - 0.35, 0.42, 0]} m={dark} />
      {/* Sign casing */}
      <B s={[w, h, d]} p={[0, 0.65 + h / 2, 0]} m={dark} />
      {/* Glowing theme LED bottom/top accent strip */}
      <Px s={[w, 0.05, d + 0.02]} p={[0, 0.65, 0]} m={led} />
      <Px s={[w, 0.05, d + 0.02]} p={[0, 0.65 + h, 0]} m={led} />
      {/* Front display face */}
      <mesh position={[0, 0.65 + h / 2, d / 2 + 0.015]} material={signM}>
        <planeGeometry args={[w - 0.12, h - 0.12]} />
      </mesh>
      {/* Rear display face (double-sided) */}
      <mesh position={[0, 0.65 + h / 2, -d / 2 - 0.015]} rotation={[0, Math.PI, 0]} material={signM}>
        <planeGeometry args={[w - 0.12, h - 0.12]} />
      </mesh>
    </group>
  );
}

function getArchetype(plotId?: string, name?: string): number {
  if (plotId) {
    const m = plotId.match(/\d+/);
    if (m) return parseInt(m[0], 10) % 6;
  }
  if (name) {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
    return Math.abs(h) % 6;
  }
  return 0;
}

export function Window({ p, w, h, mats, lights, r = 0 }: { p: V3; w: number; h: number; mats: ReturnType<typeof useMats>; lights: boolean; r?: number }) {
  const t = 0.07;
  return (
    <group position={p} rotation={[0, r, 0]}>
      <Plane s={[w, h]} p={[0, 0, -0.02]} m={lights ? mats.glow : solid('dark')} />
      <Plane s={[w, h]} p={[0, 0, 0.0]} m={mats.glass} />
      <B s={[w + 0.14, t, 0.14]} p={[0, h / 2, 0.04]} m={mats.alu} cast={false} /><B s={[w + 0.14, t, 0.14]} p={[0, -h / 2, 0.04]} m={mats.alu} cast={false} />
      <B s={[t, h, 0.14]} p={[-w / 2, 0, 0.04]} m={mats.alu} cast={false} /><B s={[t, h, 0.14]} p={[w / 2, 0, 0.04]} m={mats.alu} cast={false} />
      <B s={[0.05, h, 0.1]} p={[0, 0, 0.03]} m={mats.alu} cast={false} />
      <B s={[w + 0.3, 0.09, 0.3]} p={[0, -h / 2 - 0.06, 0.1]} m={mats.trim} />
    </group>
  );
}

function WindowRow({ style, y, mats, lights, count, span, z, r }: { style: string; y: number; mats: any; lights: boolean; count: number; span: number; z: number; r: number }) {
  const items: { x: number; w: number; h: number }[] = [];
  if (style === 'ribbon') { const n = Math.max(2, Math.round(count / 2)); for (let i = 0; i < n; i++) items.push({ x: (i - (n - 1) / 2) * (span / n), w: span / n - 0.08, h: 1.3 }); }
  else if (style === 'tall') { const n = count + 1; for (let i = 0; i < n; i++) items.push({ x: (i - (n - 1) / 2) * (span / n), w: 0.95, h: 2.3 }); }
  else for (let i = 0; i < count; i++) items.push({ x: (i - (count - 1) / 2) * (span / count), w: 1.5, h: 1.7 });
  return <group rotation={[0, r, 0]}>{items.map((it, i) => <Window key={i} p={[it.x, y, z]} w={it.w} h={it.h} mats={mats} lights={lights} />)}</group>;
}

function Door({ style, mats }: { style: string; mats: any }) {
  const h = 2.55, y = 0.15 + h / 2;
  return (
    <group position={[0, 0, D / 2 - 0.12]}>
      {[-0.5, 0.5].map(x => (
        <group key={x} position={[x, y, 0]}>
          {style === 'glass' && <><B s={[0.06, h, 0.08]} p={[-0.47, 0, 0]} m={mats.alu} /><B s={[0.06, h, 0.08]} p={[0.47, 0, 0]} m={mats.alu} /><B s={[0.94, 0.08, 0.08]} p={[0, h / 2 - 0.04, 0]} m={mats.alu} /><B s={[0.94, 0.3, 0.08]} p={[0, -h / 2 + 0.15, 0]} m={mats.alu} /><Plane s={[0.9, h - 0.4]} p={[0, 0.1, 0]} m={mats.glass} /></>}
          {style === 'wood' && <><B s={[0.94, h, 0.07]} p={[0, 0, 0]} m={mats.wood} /><B s={[0.6, 0.9, 0.04]} p={[0, 0.5, 0.05]} m={solid('dark')} /><B s={[0.64, 0.9, 0.03]} p={[0, -0.6, 0.05]} m={mats.trim} /></>}
          {style === 'steel' && <><B s={[0.94, h, 0.07]} p={[0, 0, 0]} m={mats.steel} /><B s={[0.5, 1.0, 0.04]} p={[0, 0.5, 0.04]} m={mats.glass} /></>}
          <B s={[0.04, 0.9, 0.06]} p={[x < 0 ? 0.38 : -0.38, -0.1, 0.08]} m={mats.alu} />
        </group>
      ))}
    </group>
  );
}

function Storefront({ cfg, mats }: { cfg: StoreConfig; mats: any }) {
  const z = D / 2 - 0.2, bars = [-4, -2.5, -1, 0, 1, 2.5, 4];
  return (
    <group>
      <B s={[1, GH, 0.4]} p={[-(W / 2 - 0.5), GH / 2, z]} m={mats.wall} /><B s={[1, GH, 0.4]} p={[W / 2 - 0.5, GH / 2, z]} m={mats.wall} />
      <B s={[3, 0.5, 0.4]} p={[-2.5, 0.25, z]} m={solid('dark')} /><B s={[3, 0.5, 0.4]} p={[2.5, 0.25, z]} m={solid('dark')} />
      <B s={[W - 2, GH - 3.2, 0.4]} p={[0, (3.2 + GH) / 2, z]} m={mats.wall} />
      <Plane s={[8, 2.7]} p={[0, 1.85, z + 0.1]} m={mats.glass} />
      {bars.map(x => <B key={x} s={[0.07, 2.75, 0.1]} p={[x, 1.85, z + 0.12]} m={mats.alu} cast={false} />)}
      {[0.5, 2.7, 3.2].map(y => <B key={y} s={[8.1, 0.07, 0.1]} p={[0, y, z + 0.12]} m={mats.alu} cast={false} />)}
      <Door style={cfg.door} mats={mats} />
      <B s={[2.6, 0.12, 0.9]} p={[0, 0.06, D / 2 + 0.25]} m={mats.floor} />
    </group>
  );
}

function Awning({ cfg }: { cfg: StoreConfig }) {
  const w = W - 1.4, stripe = useMemo(() => stripeTex(cfg.theme), [cfg.theme]);
  const canvasM = useMemo(() => new THREE.MeshStandardMaterial({ map: cfg.awning === 'striped' ? stripe : null, color: cfg.awning === 'solid' ? cfg.theme : '#ffffff', roughness: 0.85, side: THREE.DoubleSide }), [cfg.awning, cfg.theme, stripe]);
  if (cfg.awning === 'none') return null;
  return (
    <group position={[0, 3.3, D / 2]} rotation={[0.32, 0, 0]}>
      {cfg.awning !== 'canopy' ? (
        <>
          <mesh position={[0, 0, 0.8]} material={canvasM} castShadow receiveShadow><boxGeometry args={[w, 0.05, 1.6]} /></mesh>
          <mesh position={[0, -0.14, 1.6]} material={canvasM} castShadow><boxGeometry args={[w, 0.28, 0.04]} /></mesh>
        </>
      ) : (
        <>
          <Plane s={[w, 1.6]} p={[0, 0, 0.8]} m={glassMat('tinted')} r={[-Math.PI / 2, 0, 0]} />
          <B s={[w, 0.07, 0.07]} p={[0, 0, 1.6]} m={solid('alu')} /><B s={[0.06, 0.06, 1.6]} p={[-w / 2, 0, 0.8]} m={solid('alu')} /><B s={[0.06, 0.06, 1.6]} p={[w / 2, 0, 0.8]} m={solid('alu')} />
          {[-w / 4, w / 4].map(x => <B key={x} s={[0.04, 0.04, 1.6]} p={[x, 0, 0.8]} m={solid('alu')} />)}
        </>
      )}
    </group>
  );
}

function Sign({ cfg, tex }: { cfg: StoreConfig; tex: THREE.Texture }) {
  const on = cfg.lights, st = cfg.sign;
  const face = useMemo(() => new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: '#ffffff', emissiveIntensity: on ? 1.6 : 0.12, roughness: 0.5, transparent: st === 'neon' || st === 'blade', alphaTest: st === 'neon' || st === 'blade' ? 0.05 : 0 }), [tex, on, st]);
  const board = useMemo(() => new THREE.MeshStandardMaterial({ color: '#2f3b66', roughness: 0.8, flatShading: true }), [cfg.theme]);
  const y = 3.85, z = D / 2;
  return (
    <group>
      {st === 'panel' && <><B s={[6.9, 1.2, 0.18]} p={[0, y, z + 0.09]} m={board} /><Plane s={[6.6, 1.1]} p={[0, y, z + 0.185]} m={face} /></>}
      {st === 'box' && <><B s={[6.8, 1.1, 0.4]} p={[0, y, z + 0.2]} m={solid('dark')} /><Plane s={[6.6, 1.1]} p={[0, y, z + 0.41]} m={face} /></>}
      {st === 'neon' && <><B s={[7.1, 1.25, 0.1]} p={[0, y, z + 0.05]} m={solid('dark')} /><Plane s={[6.9, 1.15]} p={[0, y, z + 0.14]} m={face} /></>}
      {st === 'blade' && <>
        <Plane s={[5.2, 0.87]} p={[0, y, z + 0.06]} m={face} />
        <B s={[0.05, 0.05, 1.5]} p={[-(W / 2 - 0.6), 3.55, z + 0.75]} m={solid('alu')} />
        <group position={[-(W / 2 - 0.6), 3.0, z + 1.1]} rotation={[0, Math.PI / 2, 0]}><B s={[1.2, 0.8, 0.1]} p={[0, 0, 0]} m={board} /><Plane s={[1.15, 0.2 * 1.15 * 5 / 4]} p={[0, 0, 0.056]} m={face} /><Plane s={[1.15, 0.2 * 1.15 * 5 / 4]} p={[0, 0, -0.056]} m={face} r={[0, Math.PI, 0]} /></group>
      </>}
      {on && [-1, 1].map(s => <group key={s} position={[s * (W / 2 - 0.5), 3.0, z + 0.14]}><B s={[0.14, 0.3, 0.14]} p={[0, 0, 0]} m={solid('dark')} /><mesh position={[0, -0.18, 0]} material={solid('lampHead')}><sphereGeometry args={[0.08, 10, 8]} /></mesh></group>)}
    </group>
  );
}

function Roof({ cfg, y, mats }: { cfg: StoreConfig; y: number; mats: any }) {
  const w = W, d = D;
  const prism = useMemo(() => {
    const h = cfg.roof === 'gabled' ? 2.4 : 1.4; const sh = new THREE.Shape();
    if (cfg.roof === 'gabled') { sh.moveTo(-w / 2 - 0.3, 0); sh.lineTo(w / 2 + 0.3, 0); sh.lineTo(0, h); } else { sh.moveTo(-w / 2 - 0.3, 0); sh.lineTo(w / 2 + 0.3, 0); sh.lineTo(w / 2 + 0.3, h * 0.2); sh.lineTo(-w / 2 - 0.3, h); }
    sh.closePath(); const g = new THREE.ExtrudeGeometry(sh, { depth: d + 0.8, bevelEnabled: false }); g.translate(0, 0, -(d + 0.8) / 2); return g;
  }, [cfg.roof, w, d]);
  if (cfg.roof === 'gabled' || cfg.roof === 'sloped')
    return <mesh geometry={prism} position={[0, y, 0]} material={mats.roof} castShadow receiveShadow />;
  if (cfg.roof === 'cornice')
    return <group><B s={[w + 1, 0.35, d + 1]} p={[0, y + 0.18, 0]} m={mats.trim} /><B s={[w - 0.2, 0.35, d - 0.2]} p={[0, y + 0.5, 0]} m={mats.roof} /><B s={[w + 0.6, 0.1, d + 0.6]} p={[0, y - 0.05, 0]} m={mats.wall} /></group>;
  return (
    <group>
      <B s={[w + 0.2, 0.2, d + 0.2]} p={[0, y + 0.1, 0]} m={mats.roof} />
      <B s={[w + 0.2, 0.6, 0.25]} p={[0, y + 0.5, d / 2]} m={mats.wall} /><B s={[w + 0.2, 0.6, 0.25]} p={[0, y + 0.5, -d / 2]} m={mats.wall} />
      <B s={[0.25, 0.6, d]} p={[w / 2, y + 0.5, 0]} m={mats.wall} /><B s={[0.25, 0.6, d]} p={[-w / 2, y + 0.5, 0]} m={mats.wall} />
      <B s={[1.6, 0.8, 1.2]} p={[-2.5, y + 0.6, -1]} m={solid('steel')} />{[[-3.6, 1.8], [3.4, -1.2], [0.4, 2.4]].map(([x, z], i) => <mesh key={i} position={[x, y + 0.75, z]} castShadow><icosahedronGeometry args={[0.55, 1]} /><meshStandardMaterial color="#5fae48" flatShading /></mesh>)}<B s={[1.2, 0.6, 1]} p={[2.2, y + 0.5, 0.5]} m={solid('alu')} /><mesh position={[2.2, y + 0.95, 0.5]} material={solid('dark')}><cylinderGeometry args={[0.35, 0.35, 0.12, 14]} /></mesh>
    </group>
  );
}

export function BuildingFull({ cfg, plotId, quality = true }: { cfg: StoreConfig; plotId?: string; quality?: boolean }) {
  const mats = useMats(cfg), tex = useSignTexture(cfg.name, cfg.theme, cfg.sign, cfg.logoUrl);
  const floors = Math.max(2, Math.min(5, cfg.floors || 3)), H = GH + (floors - 1) * FH, wall = mats.wall;
  const dark = solid('dark'), alu = solid('alu'), steel = solid('steel');
  const T = getSharedTextures();
  const archetype = getArchetype(plotId, cfg.name);

  const ledTheme = useMemo(() => new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: cfg.theme, emissiveIntensity: 1.8, flatShading: true }), [cfg.theme]);
  const ledWhite = useMemo(() => new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: '#e2e8f0', emissiveIntensity: 1.4, flatShading: true }), []);
  const glowTex = archetype % 2 === 0 ? T.cyanGlow : T.warmGlow;
  const interiorTint = archetype % 2 === 0 ? '#e0f2fe' : '#ffe8c9';

  return (
    <group>
      {/* ── Base Plinth & Paved Entrance Forecourt ── */}
      <mesh geometry={sbox(W + 1.2, 0.08, D + 2.2, 2)} position={[0, 0.04, 0.7]} material={mats.floor} receiveShadow />
      <Px s={[W + 1.2, 0.04, 0.04]} p={[0, 0.08, D / 2 + 1.78]} m={ledTheme} />
      <B s={[W, 0.2, D]} p={[0, 0.1, 0]} m={mats.floor} />

      {/* ── Foundation Shrubs Hugging Building Base (Sides & Rear) ── */}
      {[-2.6, 0, 2.6].map((z, idx) => (
        <group key={`l-${idx}`} position={[-(W / 2 + 0.38), 0.2, z]}>
          <mesh castShadow receiveShadow>
            <icosahedronGeometry args={[0.52 + ((idx * 3) % 4) * 0.08, 1]} />
            <meshStandardMaterial color={idx % 2 === 0 ? '#4f9b40' : '#6bb852'} roughness={0.88} flatShading />
          </mesh>
        </group>
      ))}
      {[-2.6, 0, 2.6].map((z, idx) => (
        <group key={`r-${idx}`} position={[W / 2 + 0.38, 0.2, z]}>
          <mesh castShadow receiveShadow>
            <icosahedronGeometry args={[0.52 + ((idx * 5) % 4) * 0.08, 1]} />
            <meshStandardMaterial color={idx % 2 === 0 ? '#5fae48' : '#79c05a'} roughness={0.88} flatShading />
          </mesh>
        </group>
      ))}
      {[-3.6, -1.8, 0, 1.8, 3.6].map((x, idx) => (
        <group key={`b-${idx}`} position={[x, 0.2, -(D / 2 + 0.38)]}>
          <mesh castShadow receiveShadow>
            <icosahedronGeometry args={[0.55 + ((idx * 7) % 3) * 0.07, 1]} />
            <meshStandardMaterial color={idx % 2 === 0 ? '#468f3c' : '#5fae48'} roughness={0.88} flatShading />
          </mesh>
        </group>
      ))}

      {/* ── Freestanding Sidewalk Board Outside ── */}
      <OutdoorBoard pos={[-3.3, 0, D / 2 + 1.1]} name={cfg.name} tagline={cfg.tagline} theme={cfg.theme} baseMat={mats.trim} rot={0.16} />

      {/* ── Back & Side Structural Shell ── */}
      <B s={[W, H, 0.35]} p={[0, H / 2, -D / 2 + 0.175]} m={wall} />
      <B s={[0.35, H, D]} p={[-(W / 2 - 0.175), H / 2, 0]} m={wall} />
      <B s={[0.35, H, D]} p={[W / 2 - 0.175, H / 2, 0]} m={wall} />

      {/* ── Ground Floor Interior (Close-up detail) ── */}
      {quality && <Interior type={cfg.template} theme={cfg.theme} lights={cfg.lights} />}

      {/* ── Main Entrance Double Doors ── */}
      <DoubleDoors p={[0, 0, D / 2 - 0.05]} glass={mats.glass} alu={alu} />

      {/* ── Facade Signboard Above Entrance ── */}
      <Sign cfg={cfg} tex={tex} />
      <Awning cfg={cfg} />

      {/* ── Archetype-Specific Modern Central-City Architecture ── */}
      {archetype === 0 && (
        // 0: Twin-Pylon Curtain Tower
        <group>
          <B s={[1.6, H, D + 0.1]} p={[-(W / 2 - 0.8), H / 2, 0]} m={wall} />
          <B s={[1.6, H, D + 0.1]} p={[W / 2 - 0.8, H / 2, 0]} m={wall} />
          <Px s={[0.06, H - 0.8, 0.06]} p={[-(W / 2 - 1.62), H / 2, D / 2 + 0.06]} m={ledTheme} />
          <Px s={[0.06, H - 0.8, 0.06]} p={[W / 2 - 1.62, H / 2, D / 2 + 0.06]} m={ledTheme} />
          <CurtainWall w={W - 3.2} h={H - 0.6} levels={floors} cols={4} pos={[0, 0.3, D / 2 - 0.02]} glass={mats.glass} tex={glowTex} seed={101} interiorTint={interiorTint} />
          {Array.from({ length: floors }).map((_, i) => (
            <B key={i} s={[W - 3.2, 0.22, 0.25]} p={[0, GH + i * FH, D / 2 + 0.05]} m={alu} />
          ))}
          {/* Floating Entrance Canopy */}
          <B s={[4.6, 0.12, 1.6]} p={[0, 3.4, D / 2 + 0.75]} m={dark} />
          <Px s={[4.6, 0.04, 0.04]} p={[0, 3.4, D / 2 + 1.55]} m={ledTheme} />
        </group>
      )}

      {archetype === 1 && (
        // 1: Stepped Garden Terrace
        <group>
          {/* Ground/First Floor Podium */}
          <CurtainWall w={W - 1.2} h={GH} levels={1} cols={4} pos={[0, 0.2, D / 2 - 0.02]} glass={mats.glass} tex={glowTex} seed={201} interiorTint={interiorTint} />
          {/* Setback Upper Floor with Balcony Terrace */}
          <group position={[0, GH, -0.6]}>
            <CurtainWall w={W - 2.0} h={H - GH} levels={floors - 1} cols={3} pos={[0, 0.1, D / 2 - 0.02]} glass={mats.glass} tex={glowTex} seed={202} interiorTint={interiorTint} />
            {/* Terrace Railing & Planters */}
            <B s={[W - 0.4, 0.12, 0.12]} p={[0, 0.06, D / 2 + 0.55]} m={alu} />
            <Plane s={[W - 0.6, 0.9]} p={[0, 0.55, D / 2 + 0.55]} m={glassMat('clear')} />
            <Px s={[W - 0.6, 0.05, 0.05]} p={[0, 1.0, D / 2 + 0.55]} m={ledWhite} />
            {[-3.2, 3.2].map(x => (
              <group key={x} position={[x, 0.1, D / 2 + 0.25]}>
                <B s={[1.2, 0.45, 0.5]} p={[0, 0.22, 0]} m={dark} />
                <mesh position={[0, 0.6, 0]} material={solid('shrub')} castShadow><icosahedronGeometry args={[0.35, 1]} /></mesh>
              </group>
            ))}
          </group>
        </group>
      )}

      {archetype === 2 && (
        // 2: Floating Cantilever Showroom
        <group>
          {/* Ground Floor Recessed Glass Vitrine */}
          <CurtainWall w={W - 1.4} h={GH - 0.4} levels={1} cols={4} pos={[0, 0.2, D / 2 - 0.3]} glass={mats.glass} tex={T.warmGlow} seed={301} interiorTint="#ffe8c9" />
          {/* Upper Cantilever Box Overhanging 0.6m */}
          <group position={[0, GH - 0.2, 0.4]}>
            <B s={[W + 0.2, H - GH + 0.2, D + 0.8]} p={[0, (H - GH + 0.2) / 2, -0.4]} m={wall} />
            <CurtainWall w={W - 0.6} h={H - GH - 0.4} levels={floors - 1} cols={4} pos={[0, 0.2, D / 2 - 0.02]} glass={mats.glass} tex={glowTex} seed={302} interiorTint={interiorTint} />
            {/* Glowing Underside Accent Strip */}
            <Px s={[W + 0.2, 0.06, 0.06]} p={[0, 0, D / 2]} m={ledTheme} />
            <B s={[W + 0.4, 0.25, D + 0.9]} p={[0, H - GH + 0.2, -0.4]} m={mats.trim} />
          </group>
        </group>
      )}

      {archetype === 3 && (
        // 3: Modernist Vertical Fin Loft
        <group>
          {/* Left Vertical Stair/Lift Core */}
          <B s={[2.8, H, D + 0.1]} p={[-(W / 2 - 1.4), H / 2, 0]} m={wall} />
          <Plane s={[0.7, H - 2]} p={[-(W / 2 - 1.4), H / 2, D / 2 + 0.06]} m={mats.glass} />
          <Px s={[0.05, H - 1.5, 0.05]} p={[-(W / 2 - 2.85), H / 2, D / 2 + 0.06]} m={ledTheme} />
          {/* Right Open Curtain Wall with Sun-Fins */}
          <group position={[1.4, 0, 0]}>
            <CurtainWall w={W - 3.2} h={H - 0.4} levels={floors} cols={3} pos={[0, 0.2, D / 2 - 0.02]} glass={mats.glass} tex={glowTex} seed={401} interiorTint={interiorTint} />
            {[-2.2, -0.7, 0.8, 2.3].map((x, i) => (
              <B key={i} s={[0.08, H - 0.8, 0.45]} p={[x, H / 2, D / 2 + 0.2]} m={alu} cast />
            ))}
          </group>
        </group>
      )}

      {archetype === 4 && (
        // 4: Glazed Commercial Pavilion with Pilasters
        <group>
          <CurtainWall w={W - 0.8} h={H - 0.6} levels={floors} cols={4} pos={[0, 0.3, D / 2 - 0.02]} glass={mats.glass} tex={T.warmGlow} seed={501} interiorTint="#ffe8c9" />
          {/* Fluted Modern Pilasters */}
          {[-4.5, -1.8, 1.8, 4.5].map((x, i) => (
            <group key={i} position={[x, H / 2, D / 2 + 0.08]}>
              <B s={[0.5, H, 0.35]} p={[0, 0, 0]} m={mats.trim} />
              <Px s={[0.08, H - 0.5, 0.06]} p={[0, 0, 0.18]} m={ledTheme} />
            </group>
          ))}
          {/* Projecting Transom Portal */}
          <B s={[4.2, 0.3, 0.9]} p={[0, 3.4, D / 2 + 0.4]} m={dark} />
        </group>
      )}

      {archetype === 5 && (
        // 5: Cyber High-Tech Hub
        <group>
          <B s={[W, H, D]} p={[0, H / 2, 0]} m={dark} />
          <CurtainWall w={W - 1.2} h={H - 0.8} levels={floors} cols={4} pos={[0, 0.4, D / 2 - 0.02]} glass={glassMat('blue')} tex={T.cyanGlow} seed={601} interiorTint="#c7f5ff" />
          {/* Vertical Glowing Cyber Blades */}
          {[-4.6, -2.4, 2.4, 4.6].map((x, i) => (
            <group key={i} position={[x, H / 2, D / 2 + 0.08]}>
              <B s={[0.2, H, 0.3]} p={[0, 0, 0]} m={steel} />
              <Px s={[0.08, H - 0.6, 0.06]} p={[0, 0, 0.16]} m={ledTheme} />
            </group>
          ))}
          <Px s={[W, 0.06, 0.06]} p={[0, 3.4, D / 2 + 0.1]} m={ledTheme} />
        </group>
      )}

      {/* ── Modern Rooftop Architecture ── */}
      <group position={[0, H, 0]}>
        {/* Perimeter Parapet & Roof Slab */}
        <B s={[W + 0.3, 0.35, D + 0.3]} p={[0, 0.18, 0]} m={mats.trim} />
        <B s={[W - 0.2, 0.15, D - 0.2]} p={[0, 0.26, 0]} m={mats.roof} />
        <Px s={[W + 0.3, 0.05, 0.05]} p={[0, 0.36, D / 2 + 0.15]} m={ledTheme} />

        {/* Industrial HVAC Unit */}
        <group position={[-2.4, 0.35, -1.2]}>
          <B s={[1.8, 1.0, 1.4]} p={[0, 0.5, 0]} m={steel} />
          <mesh position={[0, 1.05, 0]} material={dark}><cylinderGeometry args={[0.42, 0.42, 0.12, 16]} /></mesh>
        </group>

        {/* Elevator/Stair Penthouse */}
        <group position={[2.2, 0.35, -1.0]}>
          <B s={[2.2, 1.5, 2.0]} p={[0, 0.75, 0]} m={wall} />
          <B s={[2.4, 0.12, 2.2]} p={[0, 1.56, 0]} m={dark} />
          <mesh position={[0.7, 2.2, 0]} material={alu}><cylinderGeometry args={[0.03, 0.05, 1.4, 8]} /></mesh>
        </group>

        {/* Green Rooftop Garden Accents */}
        {[[-1.2, 1.8], [0.6, 2.0]].map(([x, z], i) => (
          <mesh key={i} position={[x, 0.7, z]} castShadow>
            <icosahedronGeometry args={[0.45, 1]} />
            <meshStandardMaterial color="#5fae48" roughness={0.88} flatShading />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/** Medium-distance version (LOD 2): Preserves archetype shape, window facades, signage and roofline without heavy micro-props */
export function BuildingMedium({ cfg, plotId }: { cfg: StoreConfig; plotId?: string }) {
  const mats = useMats(cfg), tex = useSignTexture(cfg.name, cfg.theme, cfg.sign, cfg.logoUrl);
  const floors = Math.max(2, Math.min(5, cfg.floors || 3)), H = GH + (floors - 1) * FH;
  const face = useMemo(() => new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }), [tex]);
  const ledTheme = useMemo(() => new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: cfg.theme, emissiveIntensity: 1.6, flatShading: true }), [cfg.theme]);
  const dark = solid('dark'), steel = solid('steel'), alu = solid('alu');
  const archetype = getArchetype(plotId, cfg.name);

  return (
    <group>
      {/* Plinth */}
      <B s={[W + 0.6, 0.3, D + 0.6]} p={[0, 0.15, 0]} m={mats.floor} />

      {/* Main Structural Mass */}
      <B s={[W, H, D]} p={[0, H / 2, 0]} m={mats.wall} />

      {/* Archetype-specific architectural facade features */}
      {archetype === 0 && (
        <group>
          <B s={[1.6, H, 0.4]} p={[-(W / 2 - 0.8), H / 2, D / 2 + 0.1]} m={mats.wall} />
          <B s={[1.6, H, 0.4]} p={[W / 2 - 0.8, H / 2, D / 2 + 0.1]} m={mats.wall} />
          <mesh position={[0, H / 2, D / 2 + 0.04]} material={cfg.lights ? mats.glow : mats.glass}>
            <planeGeometry args={[W - 3.2, H - 0.8]} />
          </mesh>
        </group>
      )}

      {archetype === 1 && (
        <group position={[0, GH, -0.4]}>
          <B s={[W - 1.2, H - GH, D - 0.4]} p={[0, (H - GH) / 2, 0]} m={mats.wall} />
          <mesh position={[0, (H - GH) / 2, D / 2 - 0.1]} material={cfg.lights ? mats.glow : mats.glass}>
            <planeGeometry args={[W - 2.0, H - GH - 0.6]} />
          </mesh>
        </group>
      )}

      {archetype === 2 && (
        <group position={[0, GH, 0.3]}>
          <B s={[W + 0.2, H - GH, D + 0.6]} p={[0, (H - GH) / 2, -0.3]} m={mats.wall} />
          <mesh position={[0, (H - GH) / 2, D / 2 + 0.02]} material={cfg.lights ? mats.glow : mats.glass}>
            <planeGeometry args={[W - 1.0, H - GH - 0.6]} />
          </mesh>
        </group>
      )}

      {archetype >= 3 && (
        <mesh position={[0, H / 2, D / 2 + 0.02]} material={cfg.lights ? mats.glow : mats.glass}>
          <planeGeometry args={[W - 1.2, H - 1.0]} />
        </mesh>
      )}

      {/* Floor Dividing Trim Bands */}
      {Array.from({ length: floors }).map((_, i) => (
        <Px key={i} s={[W + 0.1, 0.18, 0.2]} p={[0, GH + i * FH - FH / 2, D / 2 + 0.08]} m={mats.trim} />
      ))}

      {/* Facade Sign */}
      <Plane s={[6.6, 1.1]} p={[0, 3.85, D / 2 + 0.12]} m={face} />

      {/* Roof Parapet & HVAC Block */}
      <B s={[W + 0.4, 0.45, D + 0.4]} p={[0, H + 0.22, 0]} m={mats.roof} />
      <B s={[2.0, 1.1, 1.6]} p={[-2.2, H + 0.75, -1]} m={steel} />
      <Px s={[W, 0.06, 0.06]} p={[0, H + 0.46, D / 2 + 0.2]} m={ledTheme} />

      {/* Outdoor Monument Board */}
      <OutdoorBoard pos={[-3.3, 0, D / 2 + 1.1]} name={cfg.name} tagline={cfg.tagline} theme={cfg.theme} baseMat={mats.trim} rot={0.16} />
    </group>
  );
}

/** Distant version (LOD 1): matching modern silhouette + glowing curtain wall + outside board */
export function BuildingLow({ cfg, plotId }: { cfg: StoreConfig; plotId?: string }) {
  const mats = useMats(cfg), tex = useSignTexture(cfg.name, cfg.theme, cfg.sign, cfg.logoUrl);
  const floors = Math.max(2, Math.min(5, cfg.floors || 3)), H = GH + (floors - 1) * FH;
  const face = useMemo(() => new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }), [tex]);
  const ledTheme = useMemo(() => new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: cfg.theme, emissiveIntensity: 1.6, flatShading: true }), [cfg.theme]);
  const steel = solid('steel');

  return (
    <group>
      {/* Plinth */}
      <B s={[W + 0.6, 0.3, D + 0.6]} p={[0, 0.15, 0]} m={mats.floor} />

      {/* Main Mass */}
      <B s={[W, H, D]} p={[0, H / 2, 0]} m={mats.wall} />

      {/* Glowing Curtain Wall Facade */}
      <mesh position={[0, H / 2, D / 2 + 0.02]} material={cfg.lights ? mats.glow : mats.glass}>
        <planeGeometry args={[W - 1.2, H - 1.0]} />
      </mesh>

      {/* Floor Dividing Bands */}
      {Array.from({ length: floors }).map((_, i) => (
        <Px key={i} s={[W + 0.1, 0.2, D + 0.1]} p={[0, GH + i * FH - FH / 2, 0]} m={mats.trim} />
      ))}

      {/* Facade Sign */}
      <Plane s={[6.6, 1.1]} p={[0, 3.85, D / 2 + 0.06]} m={face} />

      {/* Parapet Roof with HVAC */}
      <B s={[W + 0.4, 0.45, D + 0.4]} p={[0, H + 0.22, 0]} m={mats.roof} />
      <B s={[2.0, 1.1, 1.6]} p={[-2.2, H + 0.75, -1]} m={steel} />
      <Px s={[W, 0.06, 0.06]} p={[0, H + 0.46, D / 2 + 0.2]} m={ledTheme} />

      {/* Outdoor Board */}
      <OutdoorBoard pos={[-3.3, 0, D / 2 + 1.1]} name={cfg.name} tagline={cfg.tagline} theme={cfg.theme} baseMat={mats.trim} rot={0.16} />
    </group>
  );
}

export function StoreBuilding({ cfg, plotId, lodDistance = 48, interiors = true }: { cfg: StoreConfig; plotId?: string; lodDistance?: number; interiors?: boolean }) {
  const dMed = lodDistance;
  const dLow = Math.max(105, lodDistance * 2.3);
  return (
    <Detailed distances={[0, dMed, dLow]}>
      {cfg.mode === 'modular' ? <ModularBuilding cfg={cfg} /> : <BuildingFull cfg={cfg} plotId={plotId} quality={interiors} />}
      {cfg.mode === 'modular' ? <ModularBuilding cfg={cfg} /> : <BuildingMedium cfg={cfg} plotId={plotId} />}
      {cfg.mode === 'modular' ? <ModularBuilding cfg={cfg} /> : <BuildingLow cfg={cfg} plotId={plotId} />}
    </Detailed>
  );
}

// ---------------- modular construction ----------------
export const STRUCTURAL: Mod['kind'][] = ['wall', 'glass', 'window', 'door'];
export const cellPos = (gx: number, gz: number): [number, number] => [(gx - (GRID - 1) / 2) * CELL, (gz - (GRID - 1) / 2) * CELL];

function Bay({ m, cfg, mats, tex }: { m: Mod; cfg: StoreConfig; mats: any; tex: THREE.Texture }) {
  const y0 = m.level * LV, c = CELL, h = LV;
  const faces = [0, 1, 2, 3].map(i => i * Math.PI / 2);
  const faceMat = useMemo(() => new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: '#ffffff', emissiveIntensity: cfg.lights ? 1.4 : 0.1 }), [tex, cfg.lights]);
  if (m.kind === 'wall') return <B s={[c, h, c]} p={[0, y0 + h / 2, 0]} m={mats.wall} />;
  if (m.kind === 'window') return (
    <group position={[0, y0, 0]}><B s={[c, h, c]} p={[0, h / 2, 0]} m={mats.wall} />
      {faces.map(r => <group key={r} rotation={[0, r, 0]}><Window p={[0, h / 2 + 0.1, c / 2 + 0.01]} w={1.1} h={1.5} mats={mats} lights={cfg.lights} /></group>)}</group>
  );
  if (m.kind === 'glass') return (
    <group position={[0, y0, 0]}>
      <B s={[c, 0.15, c]} p={[0, 0.075, 0]} m={mats.floor} /><B s={[c, 0.15, c]} p={[0, h - 0.075, 0]} m={mats.trim} />
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b], i) => <B key={i} s={[0.08, h, 0.08]} p={[a * (c / 2 - 0.04), h / 2, b * (c / 2 - 0.04)]} m={mats.alu} />)}
      <mesh position={[0, h / 2, 0]} material={cfg.lights ? mats.glow : solid('dark')}><boxGeometry args={[c - 0.2, h - 0.3, c - 0.2]} /></mesh>
      {faces.map(r => <group key={r} rotation={[0, r, 0]}><Plane s={[c - 0.1, h - 0.2]} p={[0, h / 2, c / 2 - 0.04]} m={mats.glass} /><B s={[c, 0.06, 0.06]} p={[0, h / 2, c / 2 - 0.04]} m={mats.alu} cast={false} /></group>)}
    </group>
  );
  if (m.kind === 'door') return (
    <group position={[0, y0, 0]}><B s={[c, h, c]} p={[0, h / 2, 0]} m={mats.wall} />
      <group rotation={[0, m.rot * Math.PI / 2, 0]} position={[0, 0, c / 2 - D / 2 + 0.12]}><Door style={cfg.door} mats={mats} /><B s={[1.7, 0.1, 0.5]} p={[0, 0.05, D / 2 + 0.12]} m={mats.floor} />
        <Plane s={[1.8, 0.45]} p={[0, 2.95, D / 2 - 0.01]} m={mats.glass} /></group></group>
  );
  if (m.kind === 'roof') return (
    <group position={[0, y0, 0]}>
      <B s={[c + 0.1, 0.22, c + 0.1]} p={[0, 0.11, 0]} m={mats.roof} />
      {[[0, 1, c + 0.1, 0.12], [0, -1, c + 0.1, 0.12]].map(([_, s, w], i) => <B key={i} s={[w, 0.45, 0.12]} p={[0, 0.4, s * (c / 2)]} m={mats.wall} />)}
      {[-1, 1].map(s => <B key={s} s={[0.12, 0.45, c]} p={[s * (c / 2), 0.4, 0]} m={mats.wall} />)}
    </group>
  );
  if (m.kind === 'sign') return (
    <group position={[0, y0, 0]} rotation={[0, m.rot * Math.PI / 2, 0]}>
      {[-0.8, 0.8].map(x => <B key={x} s={[0.06, 1.2, 0.06]} p={[x, 0.6, 0]} m={solid('dark')} />)}
      <B s={[1.9, 0.55, 0.1]} p={[0, 1.3, 0]} m={solid('dark')} />
      <mesh position={[0, 1.3, 0.056]} material={faceMat}><planeGeometry args={[1.8, 0.3]} /></mesh>
    </group>
  );
  return ( // decor
    <group position={[0, y0, 0]}><B s={[1.5, 0.5, 0.7]} p={[0, 0.25, 0]} m={solid('dark')} />
      <mesh position={[0, 0.85, 0]} material={solid('shrub')} castShadow><icosahedronGeometry args={[0.55, 1]} /></mesh></group>
  );
}

export function ModularBuilding({ cfg, onCell }: { cfg: StoreConfig; onCell?: (kind: 'hover' | 'click', gx: number, gz: number, e: any) => void }) {
  const mats = useMats(cfg), tex = useSignTexture(cfg.name, cfg.theme, cfg.sign === 'blade' ? 'panel' : cfg.sign, cfg.logoUrl);
  return (
    <group>
      {cfg.modules.map(m => {
        const [x, z] = cellPos(m.gx, m.gz);
        return (
          <group key={m.id} position={[x, 0, z]} rotation={m.kind === 'door' || m.kind === 'sign' ? [0, 0, 0] : [0, 0, 0]}
            onPointerMove={onCell ? (e) => { e.stopPropagation(); onCell('hover', m.gx, m.gz, e); } : undefined}
            onClick={onCell ? (e) => { if (e.delta > 4) return; e.stopPropagation(); onCell('click', m.gx, m.gz, e); } : undefined}>
            <Bay m={m} cfg={cfg} mats={mats} tex={tex} />
          </group>
        );
      })}
    </group>
  );
}

/** Placement rules shared by editor: grid snapping keeps every piece inside the plot. */
export function applyPlace(mods: Mod[], kind: Mod['kind'], gx: number, gz: number, rot: number): { mods: Mod[]; error?: string } {
  if (gx < 0 || gz < 0 || gx >= GRID || gz >= GRID) return { mods, error: 'Outside plot boundary' };
  const cell = mods.filter(m => m.gx === gx && m.gz === gz), structural = cell.filter(m => STRUCTURAL.includes(m.kind));
  const top = cell.find(m => !STRUCTURAL.includes(m.kind));
  const id = Math.random().toString(36).slice(2, 9);
  if (STRUCTURAL.includes(kind)) {
    if (top) return { mods, error: 'Remove the roof/sign/decor on top first' };
    if (structural.length >= 3) return { mods, error: 'Maximum height is 3 levels' };
    return { mods: [...mods, { id, kind, gx, gz, level: structural.length, rot }] };
  }
  if (top) return { mods, error: 'This cell already has a top piece' };
  if (kind === 'roof' && structural.length === 0) return { mods, error: 'Roofs need a wall or glass bay below' };
  return { mods: [...mods, { id, kind, gx, gz, level: structural.length, rot }] };
}
export function eraseTop(mods: Mod[], gx: number, gz: number): Mod[] {
  const cell = mods.filter(m => m.gx === gx && m.gz === gz); if (!cell.length) return mods;
  const top = cell.reduce((a, b) => (b.level > a.level || (b.level === a.level && !STRUCTURAL.includes(b.kind)) ? b : a));
  return mods.filter(m => m.id !== top.id);
}
