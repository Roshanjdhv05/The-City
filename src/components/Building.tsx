'use client';
import * as THREE from 'three';
import { useMemo, useEffect } from 'react';
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
    wall: mat(cfg.facade, cfg.tint), floor: mat('pave', '#dde0ea'), roof: mat('roof'), glass: glassMat(cfg.glass), alu: solid('alu'), dark: solid('dark'),
    steel: solid('steel'), trim: solid('trim'), glow: solid('glow'), wood: mat('wood', '#ffffff'), unit: sbox,
  }), [cfg.facade, cfg.tint, cfg.glass]);
}

// ---------------- Outdoor Monument / Freestanding Sidewalk Board ----------------
const boardCache = new Map<string, { canvas: HTMLCanvasElement; tex: THREE.CanvasTexture }>();

function drawOutdoorBoard(
  c: HTMLCanvasElement,
  o: { name: string; tagline?: string; theme: string; img?: HTMLImageElement | null }
) {
  const g = c.getContext('2d')!, w = c.width, h = c.height;
  g.clearRect(0, 0, w, h);

  // 1. Sleek corporate dark background with radial highlight
  const gr = g.createRadialGradient(w / 2, h / 2, 40, w / 2, h / 2, w * 0.7);
  gr.addColorStop(0, '#101a2e');
  gr.addColorStop(0.5, '#0b1220');
  gr.addColorStop(1, '#050810');
  g.fillStyle = gr;
  g.fillRect(0, 0, w, h);

  // Subtle diagonal brushed-metal scanlines
  for (let i = 0; i < 18; i++) {
    g.strokeStyle = `rgba(255,255,255,${0.012 + (i % 3) * 0.006})`;
    g.lineWidth = 1.5;
    g.beginPath();
    g.moveTo(0, i * 32);
    g.lineTo(w, i * 32 + 90);
    g.stroke();
  }

  // 2. Theme-colored outer glowing frame
  g.strokeStyle = o.theme;
  g.lineWidth = 6;
  g.strokeRect(16, 16, w - 32, h - 32);

  // High-tech corner bracket accents
  const cb = 32;
  g.strokeStyle = '#ffffff';
  g.lineWidth = 3;
  [[16, 16], [w - 16, 16], [16, h - 16], [w - 16, h - 16]].forEach(([cx, cy], i) => {
    g.beginPath();
    g.moveTo(cx + (i % 2 === 0 ? cb : -cb), cy);
    g.lineTo(cx, cy);
    g.lineTo(cx, cy + (i < 2 ? cb : -cb));
    g.stroke();
  });

  // Top header status bar
  g.fillStyle = 'rgba(255,255,255,0.08)';
  g.fillRect(20, 20, w - 40, 48);
  g.fillStyle = o.theme;
  g.font = '800 18px Arial, sans-serif';
  g.textAlign = 'left';
  g.textBaseline = 'middle';
  g.fillText('✦ THE CITY COMMERCIAL NETWORK', 40, 44);

  // Verified Badge (top right)
  g.fillStyle = 'rgba(34, 197, 94, 0.2)';
  g.beginPath();
  if (g.roundRect) g.roundRect(w - 240, 28, 200, 32, 16);
  else g.rect(w - 240, 28, 200, 32);
  g.fill();
  g.strokeStyle = '#22c55e';
  g.lineWidth = 1.5;
  g.stroke();
  g.fillStyle = '#4ade80';
  g.font = '700 15px Arial, sans-serif';
  g.textAlign = 'center';
  g.fillText('● VERIFIED LOCATION', w - 140, 44);

  // 3. Prominent LOGO Section (Left Side)
  const logoBoxX = 56, logoBoxY = 105, logoBoxSize = 230;
  g.fillStyle = 'rgba(15, 23, 42, 0.9)';
  g.beginPath();
  if (g.roundRect) g.roundRect(logoBoxX, logoBoxY, logoBoxSize, logoBoxSize, 28);
  else g.rect(logoBoxX, logoBoxY, logoBoxSize, logoBoxSize);
  g.fill();
  g.strokeStyle = o.theme;
  g.lineWidth = 4;
  g.stroke();

  if (o.img) {
    g.save();
    g.beginPath();
    if (g.roundRect) g.roundRect(logoBoxX + 12, logoBoxY + 12, logoBoxSize - 24, logoBoxSize - 24, 20);
    else g.rect(logoBoxX + 12, logoBoxY + 12, logoBoxSize - 24, logoBoxSize - 24);
    g.clip();
    g.drawImage(o.img, logoBoxX + 12, logoBoxY + 12, logoBoxSize - 24, logoBoxSize - 24);
    g.restore();
  } else {
    // Beautiful branded gradient monogram
    const igr = g.createLinearGradient(logoBoxX, logoBoxY, logoBoxX + logoBoxSize, logoBoxY + logoBoxSize);
    igr.addColorStop(0, o.theme);
    igr.addColorStop(1, '#0f172a');
    g.fillStyle = igr;
    g.beginPath();
    g.arc(logoBoxX + logoBoxSize / 2, logoBoxY + logoBoxSize / 2, logoBoxSize * 0.38, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = '#ffffff';
    g.lineWidth = 3;
    g.stroke();

    const initial = (o.name ? o.name[0] : 'S').toUpperCase();
    g.fillStyle = '#ffffff';
    g.font = `800 ${logoBoxSize * 0.45}px Arial, sans-serif`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.shadowColor = o.theme;
    g.shadowBlur = 20;
    g.fillText(initial, logoBoxX + logoBoxSize / 2, logoBoxY + logoBoxSize / 2 + 4);
    g.shadowBlur = 0;
  }

  // 4. Store NAME & Info Section (Right Side)
  const textLeft = logoBoxX + logoBoxSize + 48;
  const maxTextW = w - textLeft - 50;
  const title = (o.name || 'COMMERCIAL').toUpperCase();

  let fs = 64;
  g.font = `800 ${fs}px Arial, sans-serif`;
  while (g.measureText(title).width > maxTextW && fs > 30) {
    fs -= 3;
    g.font = `800 ${fs}px Arial, sans-serif`;
  }
  g.textAlign = 'left';
  g.textBaseline = 'middle';
  g.shadowColor = o.theme;
  g.shadowBlur = 22;
  g.fillStyle = '#ffffff';
  g.fillText(title, textLeft, 175);
  g.shadowBlur = 0;

  // Thin separator line with theme gradient
  const sgr = g.createLinearGradient(textLeft, 0, textLeft + maxTextW, 0);
  sgr.addColorStop(0, o.theme);
  sgr.addColorStop(0.7, `${o.theme}60`);
  sgr.addColorStop(1, 'transparent');
  g.strokeStyle = sgr;
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(textLeft, 230);
  g.lineTo(textLeft + maxTextW * 0.95, 230);
  g.stroke();

  // Tagline
  const sub = o.tagline || 'PREMIER COMMERCIAL LOCATION';
  let subFs = 26;
  g.font = `600 ${subFs}px Arial, sans-serif`;
  while (g.measureText(sub).width > maxTextW && subFs > 16) {
    subFs -= 2;
    g.font = `600 ${subFs}px Arial, sans-serif`;
  }
  g.fillStyle = '#e2e8f0';
  g.fillText(sub, textLeft, 268);

  // Subtitle / Location badge
  g.font = '500 18px Arial, sans-serif';
  g.fillStyle = '#94a3b8';
  g.fillText('OFFICIAL METROPOLIS PROPERTY  ✦  INSPECTION READY', textLeft, 308);

  // 5. Bottom Interactive Footer Banner
  g.fillStyle = 'rgba(15, 23, 42, 0.9)';
  g.fillRect(20, h - 84, w - 40, 64);
  g.fillStyle = o.theme;
  g.fillRect(20, h - 84, 8, 64);
  g.fillStyle = '#ffffff';
  g.font = '700 20px Arial, sans-serif';
  g.textAlign = 'left';
  g.fillText('▶  ENTER STOREFRONT  ·  CLICK OR WALK THROUGH ENTRANCE TO VISIT', 48, h - 52);
  g.fillStyle = o.theme;
  g.font = '800 18px Arial, sans-serif';
  g.textAlign = 'right';
  g.fillText('OPEN NOW ↗', w - 48, h - 52);
}

export function useOutdoorBoardTexture(name: string, tagline?: string, theme = '#3b82f6', logoUrl?: string) {
  const key = `${name || 'COMMERCIAL'}|${tagline || ''}|${theme}`;
  const entry = useMemo(() => {
    let item = boardCache.get(key);
    if (!item) {
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 512;
      drawOutdoorBoard(canvas, { name, tagline, theme });
      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 8;
      item = { canvas, tex };
      boardCache.set(key, item);
    }
    return item;
  }, [key, name, tagline, theme]);

  useEffect(() => {
    if (!logoUrl) return;
    let dead = false;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (dead) return;
      drawOutdoorBoard(entry.canvas, { name, tagline, theme, img });
      entry.tex.needsUpdate = true;
    };
    img.src = logoUrl;
    return () => { dead = true; };
  }, [name, tagline, theme, logoUrl, entry]);

  return entry.tex;
}

export function OutdoorBoard({
  pos,
  name,
  tagline,
  theme = '#3b82f6',
  logoUrl,
  baseMat,
  rot = 0,
}: {
  pos: V3;
  name: string;
  tagline?: string;
  theme?: string;
  logoUrl?: string;
  baseMat: THREE.Material;
  rot?: number;
}) {
  const tex = useOutdoorBoardTexture(name, tagline, theme, logoUrl);
  const signM = useMemo(() => emiss(tex, 1.4), [tex]);
  const dark = solid('dark');
  const steel = solid('steel');
  const led = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#ffffff',
        emissive: theme,
        emissiveIntensity: 2.2,
      }),
    [theme]
  );

  // Upgraded billboard size: 3.6m wide, 2.2m tall, elevated 0.85m on twin steel columns
  const w = 3.6, h = 2.2, d = 0.26;
  const legH = 0.85;
  const boardCenterY = legH + h / 2;

  return (
    <group position={pos} rotation={[0, rot, 0]}>
      {/* Heavy Granite Plinth Base */}
      <B s={[w + 0.5, 0.16, 0.9]} p={[0, 0.08, 0]} m={baseMat} recv />
      {/* Twin Brushed Steel Support Columns */}
      <B s={[0.16, legH, 0.2]} p={[-w / 2 + 0.45, legH / 2, 0]} m={steel} cast />
      <B s={[0.16, legH, 0.2]} p={[w / 2 - 0.45, legH / 2, 0]} m={steel} cast />
      {/* Glowing theme LED strips on support columns */}
      <Px s={[0.04, legH, 0.22]} p={[-w / 2 + 0.45, legH / 2, 0]} m={led} />
      <Px s={[0.04, legH, 0.22]} p={[w / 2 - 0.45, legH / 2, 0]} m={led} />

      {/* Main Signboard Box Enclosure */}
      <B s={[w, h, d]} p={[0, boardCenterY, 0]} m={dark} cast />
      {/* Brushed Aluminium Frame Trim around border */}
      <B s={[w + 0.08, 0.08, d + 0.04]} p={[0, legH + 0.04, 0]} m={steel} />
      <B s={[w + 0.08, 0.08, d + 0.04]} p={[0, legH + h - 0.04, 0]} m={steel} />
      <B s={[0.08, h, d + 0.04]} p={[-w / 2 - 0.04, boardCenterY, 0]} m={steel} />
      <B s={[0.08, h, d + 0.04]} p={[w / 2 + 0.04, boardCenterY, 0]} m={steel} />

      {/* Glowing Theme LED Top and Bottom Edge Strips */}
      <Px s={[w, 0.05, d + 0.03]} p={[0, legH, 0]} m={led} />
      <Px s={[w, 0.05, d + 0.03]} p={[0, legH + h, 0]} m={led} />

      {/* Overhead Downlight Canopy Hood */}
      <B s={[w + 0.2, 0.1, 0.6]} p={[0, legH + h + 0.08, 0.12]} m={dark} />
      <Px s={[w, 0.04, 0.04]} p={[0, legH + h + 0.05, 0.4]} m={led} />

      {/* Front Display Face (High-Resolution Poster) */}
      <mesh position={[0, boardCenterY, d / 2 + 0.015]} material={signM}>
        <planeGeometry args={[w - 0.16, h - 0.16]} />
      </mesh>
      {/* Rear Display Face (Double-sided for foot traffic) */}
      <mesh position={[0, boardCenterY, -d / 2 - 0.015]} rotation={[0, Math.PI, 0]} material={signM}>
        <planeGeometry args={[w - 0.16, h - 0.16]} />
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
  const board = useMemo(() => new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.6, metalness: 0.3 }), [cfg.theme]);
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
  // Solar panel material — dark PV cells with silver frame
  const solarPV = useMemo(() => new THREE.MeshStandardMaterial({ color: '#1a2540', roughness: 0.3, metalness: 0.55 }), []);
  const solarFrame = useMemo(() => new THREE.MeshStandardMaterial({ color: '#94a3b8', roughness: 0.25, metalness: 0.75 }), []);
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
      {/* Premium graphite flat roof parapet */}
      <B s={[w + 0.3, 0.42, d + 0.3]} p={[0, y + 0.21, 0]} m={mats.roof} />
      {/* Aluminium parapet cap rail */}
      <B s={[w + 0.5, 0.06, 0.08]} p={[0, y + 0.44, d / 2 + 0.1]} m={solid('steel')} cast={false} />
      <B s={[w + 0.5, 0.06, 0.08]} p={[0, y + 0.44, -d / 2 - 0.1]} m={solid('steel')} cast={false} />
      <B s={[0.08, 0.06, d + 0.3]} p={[w / 2 + 0.1, y + 0.44, 0]} m={solid('steel')} cast={false} />
      <B s={[0.08, 0.06, d + 0.3]} p={[-w / 2 - 0.1, y + 0.44, 0]} m={solid('steel')} cast={false} />
      {/* Rooftop solar panel array — angled at 15° facing south */}
      <group position={[-1.5, y + 0.5, -0.5]} rotation={[0.26, 0, 0]}>
        {[0, 1, 2].map(col => (
          <group key={col} position={[col * 2.0 - 1.8, 0, 0]}>
            <B s={[1.75, 0.04, 2.6]} p={[0, 0.02, 0]} m={solarPV} cast={false} />
            <B s={[1.75, 0.03, 0.06]} p={[0, 0.03, -1.3]} m={solarFrame} cast={false} />
            <B s={[1.75, 0.03, 0.06]} p={[0, 0.03, 1.3]} m={solarFrame} cast={false} />
            <B s={[0.06, 0.03, 2.6]} p={[-0.87, 0.03, 0]} m={solarFrame} cast={false} />
            <B s={[0.06, 0.03, 2.6]} p={[0.87, 0.03, 0]} m={solarFrame} cast={false} />
          </group>
        ))}
      </group>
      {/* HVAC unit — brushed steel */}
      <B s={[1.6, 0.9, 1.2]} p={[2.4, y + 0.9, -1.0]} m={solid('steel')} />
      <mesh position={[2.4, y + 1.4, -1.0]} material={solid('dark')}><cylinderGeometry args={[0.38, 0.38, 0.14, 12]} /></mesh>
      {/* Rooftop green accents */}
      {[[-1.0, 1.6], [0.5, 2.1]].map(([x, z], i) => (
        <mesh key={i} position={[x, y + 0.6, z]} castShadow>
          <icosahedronGeometry args={[0.42, 1]} />
          <meshStandardMaterial color="#4f9b40" roughness={0.88} />
        </mesh>
      ))}
    </group>
  );
}

export function BuildingFull({ cfg, plotId, quality = true }: { cfg: StoreConfig; plotId?: string; quality?: boolean }) {
  const mats = useMats(cfg), tex = useSignTexture(cfg.name, cfg.theme, cfg.sign, cfg.logoUrl);
  const floors = Math.max(2, Math.min(5, cfg.floors || 3)), H = GH + (floors - 1) * FH, wall = mats.wall;
  const dark = solid('dark'), alu = solid('alu'), steel = solid('steel');
  const T = getSharedTextures();
  const archetype = getArchetype(plotId, cfg.name);

  const ledTheme = useMemo(() => new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: cfg.theme, emissiveIntensity: 2.2, roughness: 0.9 }), [cfg.theme]);
  const ledWhite = useMemo(() => new THREE.MeshStandardMaterial({ color: '#f8fafc', emissive: '#38bdf8', emissiveIntensity: 1.6, roughness: 0.9 }), []);
  const glowTex = archetype % 2 === 0 ? T.cyanGlow : T.warmGlow;
  const interiorTint = archetype % 2 === 0 ? '#e0f2fe' : '#ffe8c9';
  const pylonTheme = useMemo(() => new THREE.MeshStandardMaterial({ color: cfg.theme || '#b91c1c', roughness: 0.5, metalness: 0.15 }), [cfg.theme]);
  const goldAccent = useMemo(() => new THREE.MeshStandardMaterial({ color: '#f59e0b', roughness: 0.35, metalness: 0.65, emissive: '#d97706', emissiveIntensity: 0.3 }), []);
  const whiteFrame = useMemo(() => new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.4, metalness: 0.1 }), []);
  const cubeLit = useMemo(() => new THREE.MeshStandardMaterial({ color: '#fffdf5', emissive: '#ffe599', emissiveIntensity: 1.2 }), []);
  const face = useMemo(() => new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: '#ffffff', emissiveIntensity: cfg.lights ? 1.6 : 0.2, roughness: 0.4, transparent: true }), [tex, cfg.lights]);


  return (
    <group>
      {/* ── Base Plinth & Paved Entrance Forecourt ── */}
      <mesh geometry={sbox(W + 1.2, 0.08, D + 2.2, 2)} position={[0, 0.04, 0.7]} material={mats.floor} receiveShadow />
      <Px s={[W + 1.2, 0.04, 0.04]} p={[0, 0.08, D / 2 + 1.78]} m={ledTheme} />
      <B s={[W, 0.2, D]} p={[0, 0.1, 0]} m={mats.floor} />
      {/* Premium step-up granite entrance plinth */}
      <B s={[W - 0.6, 0.12, 2.0]} p={[0, 0.16, D / 2 + 0.8]} m={solid('trim')} />

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
      <OutdoorBoard pos={[-3.4, 0, D / 2 + 1.6]} name={cfg.name} tagline={cfg.tagline} theme={cfg.theme} logoUrl={cfg.logoUrl} baseMat={mats.trim} rot={0.12} />

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
        // 5: Modern Commercial Showroom (Bikaner House style architecture)
        <group>
          {/* 1. Left Vertical Pylon in Bold Crimson / Theme Color */}
          <group position={[-(W / 2 - 1.0), 0, 0]}>
            <B s={[2.0, H, D + 0.15]} p={[0, H / 2, 0]} m={pylonTheme} cast />
            {/* 3 Projecting Decorative Geometric Accent Cubes (stacked vertically as in photo) */}
            {[2.4, 4.8, 7.2].map((cubeY, ci) => (
              <group key={ci} position={[0, cubeY, D / 2 + 0.25]}>
                <B s={[0.65, 0.65, 0.4]} p={[0, 0, 0]} m={pylonTheme} />
                <B s={[0.55, 0.55, 0.04]} p={[0, 0, 0.21]} m={mats.alu} />
                <Px s={[0.42, 0.42, 0.02]} p={[0, 0, 0.23]} m={cubeLit} />
              </group>
            ))}
            {/* Vertical glowing accent slit on inner edge */}
            <Px s={[0.05, H - 1.2, 0.05]} p={[0.95, H / 2, D / 2 + 0.08]} m={ledTheme} />
          </group>

          {/* 2. Right Vertical Architectural Tower Column (Dark Graphite / Titanium with horizontal slits) */}
          <group position={[W / 2 - 1.1, 0, 0]}>
            <B s={[2.2, H + 0.8, D + 0.15]} p={[0, (H + 0.8) / 2, 0]} m={dark} cast />
            {/* Horizontal architectural groove reveals */}
            {[2.8, 4.4, 6.0, 7.6, 9.2].map((slitY, si) => (
              <group key={si} position={[0, slitY, D / 2 + 0.08]}>
                <B s={[1.8, 0.08, 0.08]} p={[0, 0, 0]} m={steel} />
                <Px s={[1.8, 0.04, 0.02]} p={[0, 0, 0.04]} m={si % 2 === 0 ? pylonTheme : ledTheme} />
              </group>
            ))}
          </group>

          {/* 3. Center Glazed Facade with Reflective Teal Glass */}
          <group position={[-0.1, 0, 0]}>
            <CurtainWall
              w={5.8}
              h={H - 0.4}
              levels={floors}
              cols={4}
              pos={[0, 0.2, D / 2 - 0.02]}
              glass={mats.glass}
              tex={T.cyanGlow}
              seed={601}
              interiorTint="#dbeafe"
            />
            {/* Horizontal Gold/Amber Accent Panels (running horizontally across the glass floors) */}
            {Array.from({ length: floors - 1 }).map((_, fi) => (
              <group key={fi} position={[0, GH + fi * FH - 0.2, D / 2 + 0.06]}>
                <B s={[5.8, 0.42, 0.18]} p={[0, 0, 0]} m={goldAccent} />
                <Px s={[5.8, 0.04, 0.04]} p={[0, 0.22, 0.08]} m={ledWhite} />
              </group>
            ))}
          </group>

          {/* 4. Upper Floor Cantilevered White Architectural Frame Box (Signature Feature from Image 2!) */}
          <group position={[-0.1, H - 2.8, D / 2 + 0.2]}>
            {/* Cantilevered White Frame Enclosure */}
            <B s={[5.8, 0.35, 0.45]} p={[0, 1.25, 0]} m={whiteFrame} />
            <B s={[5.8, 0.35, 0.45]} p={[0, -1.25, 0]} m={whiteFrame} />
            <B s={[0.35, 2.5, 0.45]} p={[-2.72, 0, 0]} m={whiteFrame} />
            <B s={[0.35, 2.5, 0.45]} p={[2.72, 0, 0]} m={whiteFrame} />
            {/* Recessed panoramic window backing */}
            <Plane s={[5.1, 2.15]} p={[0, 0, 0.02]} m={mats.glass} />
            {/* Geometric square decorative motifs inside the frame (matching Image 2) */}
            {[
              { x: 0.6, y: 0.35, s: 0.52 },
              { x: 1.5, y: 0.35, s: 0.52 },
              { x: 1.05, y: -0.32, s: 0.52 },
              { x: 1.95, y: -0.32, s: 0.52 },
            ].map((sq, sqi) => (
              <group key={sqi} position={[sq.x, sq.y, 0.1]}>
                <B s={[sq.s, 0.06, 0.08]} p={[0, sq.s / 2, 0]} m={dark} />
                <B s={[sq.s, 0.06, 0.08]} p={[0, -sq.s / 2, 0]} m={dark} />
                <B s={[0.06, sq.s, 0.08]} p={[-sq.s / 2, 0, 0]} m={dark} />
                <B s={[0.06, sq.s, 0.08]} p={[sq.s / 2, 0, 0]} m={dark} />
              </group>
            ))}
          </group>

          {/* 5. Top Rooftop Commercial Billboard ("BIKANER HOUSE" style in Image 2) */}
          <group position={[0, H + 0.7, D / 2 + 0.08]}>
            {/* Red / Theme colored fascia backing */}
            <B s={[W + 0.2, 1.4, 0.3]} p={[0, 0, 0]} m={pylonTheme} />
            {/* Bold Channel Letters Signboard Panel */}
            <mesh position={[0, 0, 0.16]} material={face}>
              <planeGeometry args={[W - 1.2, 1.15]} />
            </mesh>
            {/* Projecting White Overhead Canopy with Slats */}
            <B s={[W + 0.6, 0.14, 1.4]} p={[0, 0.75, 0.55]} m={whiteFrame} />
            {[-3.6, -1.8, 0, 1.8, 3.6].map((finX, fi) => (
              <B key={finX} s={[0.08, 0.1, 1.3]} p={[finX, 0.65, 0.55]} m={dark} />
            ))}
            <Px s={[W + 0.6, 0.05, 0.05]} p={[0, 0.75, 1.25]} m={ledTheme} />
          </group>

          {/* Ground Floor Entrance Portal */}
          <B s={[3.2, 0.18, 0.8]} p={[-0.1, 3.4, D / 2 + 0.4]} m={dark} />
          <Px s={[3.2, 0.04, 0.04]} p={[-0.1, 3.4, D / 2 + 0.8]} m={ledTheme} />
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

      {archetype >= 3 && archetype < 5 && (
        <mesh position={[0, H / 2, D / 2 + 0.02]} material={cfg.lights ? mats.glow : mats.glass}>
          <planeGeometry args={[W - 1.2, H - 1.0]} />
        </mesh>
      )}

      {archetype === 5 && (
        <group>
          {/* Left Pylon */}
          <B s={[2.0, H, D + 0.1]} p={[-(W / 2 - 1.0), H / 2, 0]} m={new THREE.MeshStandardMaterial({ color: cfg.theme || '#b91c1c' })} />
          {/* Right Column */}
          <B s={[2.2, H + 0.8, D + 0.1]} p={[W / 2 - 1.1, (H + 0.8) / 2, 0]} m={dark} />
          {/* Center Curtain Wall */}
          <mesh position={[-0.1, H / 2, D / 2 + 0.04]} material={cfg.lights ? mats.glow : mats.glass}>
            <planeGeometry args={[5.8, H - 0.8]} />
          </mesh>
          {/* Upper Cantilever Box */}
          <B s={[5.8, 2.5, 0.4]} p={[-0.1, H - 2.8, D / 2 + 0.2]} m={alu} />
          {/* Top Rooftop Billboard */}
          <B s={[W + 0.2, 1.4, 0.3]} p={[0, H + 0.7, D / 2 + 0.08]} m={new THREE.MeshStandardMaterial({ color: cfg.theme || '#b91c1c' })} />
          <Plane s={[W - 1.2, 1.15]} p={[0, H + 0.7, D / 2 + 0.24]} m={face} />
        </group>
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
      <OutdoorBoard pos={[-3.4, 0, D / 2 + 1.6]} name={cfg.name} tagline={cfg.tagline} theme={cfg.theme} logoUrl={cfg.logoUrl} baseMat={mats.trim} rot={0.12} />
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
      <OutdoorBoard pos={[-3.4, 0, D / 2 + 1.6]} name={cfg.name} tagline={cfg.tagline} theme={cfg.theme} logoUrl={cfg.logoUrl} baseMat={mats.trim} rot={0.12} />
    </group>
  );
}

export function StoreBuilding({ cfg, plotId, lodDistance = 48, interiors = true }: { cfg: StoreConfig; plotId?: string; lodDistance?: number; interiors?: boolean }) {
  if (cfg.mode === 'modular') return <ModularBuilding cfg={cfg} />;
  return <BuildingFull cfg={cfg} plotId={plotId} quality={interiors} />;
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
