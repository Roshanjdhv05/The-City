'use client';
import * as THREE from 'three';
import { useMemo } from 'react';
import { Detailed } from '@react-three/drei';
import type { StoreConfig } from '@/lib/types';
import { mat, glassMat, solid, sbox } from '@/lib/materials';
import { useSignTexture } from '@/lib/signage';
import { B } from './Building';

export type V3 = [number, number, number];
export const UBOX = new THREE.BoxGeometry(1, 1, 1);
export const Px = ({ s, p, m, r, cast = false, recv = false }: { s: V3; p: V3; m: THREE.Material; r?: V3; cast?: boolean; recv?: boolean }) => (
  <mesh geometry={UBOX} scale={s} position={p} material={m} rotation={r} castShadow={cast} receiveShadow={recv} />
);

// ---------------- Textures & Caches ----------------
export const mkCanvas = (w: number, h: number, f: (g: CanvasRenderingContext2D) => void) => {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d')!; f(g);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
};

export const glowText = (g: CanvasRenderingContext2D, txt: string, x: number, y: number, px: number, color = '#fff', glow = '#3b82f6', align: CanvasTextAlign = 'center', weight = 800) => {
  g.font = `${weight} ${px}px Arial, sans-serif`; g.textAlign = align; g.textBaseline = 'middle';
  g.shadowColor = glow; g.shadowBlur = px * 0.35; g.fillStyle = color; g.fillText(txt, x, y); g.shadowBlur = 0;
};

let texCache: Record<string, THREE.CanvasTexture> | null = null;
export function getSharedTextures() {
  if (texCache) return texCache;
  texCache = {
    warmGlow: mkCanvas(64, 256, g => {
      const gr = g.createLinearGradient(0, 0, 0, 256);
      gr.addColorStop(0, '#ffe4b5'); gr.addColorStop(1, '#d89c56');
      g.fillStyle = gr; g.fillRect(0, 0, 64, 256);
      g.fillStyle = 'rgba(255,255,255,0.6)'; g.fillRect(0, 6, 64, 6);
      g.fillStyle = 'rgba(50,30,12,0.45)';
      for (let i = 0; i < 5; i++) g.fillRect(6 + i * 11, 170 + (i % 2) * 8, 6, 48);
    }),
    cyanGlow: mkCanvas(64, 256, g => {
      const gr = g.createLinearGradient(0, 0, 0, 256);
      gr.addColorStop(0, '#c7f5ff'); gr.addColorStop(1, '#4ca8cc');
      g.fillStyle = gr; g.fillRect(0, 0, 64, 256);
      g.fillStyle = 'rgba(255,255,255,0.7)'; g.fillRect(0, 6, 64, 6);
      g.fillStyle = 'rgba(10,35,50,0.5)';
      for (let i = 0; i < 5; i++) g.fillRect(6 + i * 11, 160 + (i % 2) * 10, 6, 52);
    }),
    amberGlow: mkCanvas(64, 256, g => {
      const gr = g.createLinearGradient(0, 0, 0, 256);
      gr.addColorStop(0, '#ffdfa0'); gr.addColorStop(1, '#bd6b2e');
      g.fillStyle = gr; g.fillRect(0, 0, 64, 256);
      g.fillStyle = 'rgba(255,255,255,0.6)'; g.fillRect(0, 6, 64, 6);
    }),
    arcadeScreen: mkCanvas(512, 256, g => {
      const gr = g.createLinearGradient(0, 0, 512, 256);
      gr.addColorStop(0, '#100a26'); gr.addColorStop(0.5, '#2b0938'); gr.addColorStop(1, '#091c38');
      g.fillStyle = gr; g.fillRect(0, 0, 512, 256);
      // animated-looking pixel equalizer & graphic elements
      g.fillStyle = '#ec4899';
      for (let x = 20; x < 490; x += 16) {
        const barH = 30 + Math.sin(x * 0.05) * 50 + Math.cos(x * 0.12) * 35;
        g.fillRect(x, 180 - barH, 11, barH);
      }
      g.fillStyle = '#06b6d4';
      for (let x = 26; x < 490; x += 16) {
        const barH = 20 + Math.cos(x * 0.07) * 40;
        g.fillRect(x, 180 - barH, 5, barH);
      }
      glowText(g, 'ARCADE ONE', 256, 75, 46, '#ffffff', '#ec4899', 'center', 900);
      glowText(g, 'NEXT-GEN ESPORTS & VR', 256, 120, 20, '#a5f3fc', '#06b6d4', 'center', 700);
    }),
  };
  return texCache;
}

export const emiss = (tex: THREE.Texture, i = 1.3, transparent = false) =>
  new THREE.MeshStandardMaterial({
    map: tex, emissiveMap: tex, emissive: '#ffffff', emissiveIntensity: i,
    roughness: 0.5, transparent, alphaTest: transparent ? 0.04 : 0
  });

// ---------------- Shared Architectural Components ----------------

/** Modern glass curtain wall with glowing interior depth, mullions, floor plates, and silhouettes */
export function CurtainWall({
  w, h, levels, cols, pos, ry = 0, glass, tex, seed = 1, interiorTint = '#ffe8c9', deskCount
}: {
  w: number; h: number; levels: number; cols: number; pos: V3; ry?: number;
  glass: THREE.Material; tex: THREE.Texture; seed?: number; interiorTint?: string; deskCount?: number;
}) {
  const lh = h / levels;
  const glowM = useMemo(() => new THREE.MeshBasicMaterial({ map: tex, color: interiorTint }), [tex, interiorTint]);
  const desks = useMemo(() => {
    let s = seed * 101; const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    const count = deskCount ?? Math.max(1, Math.round(w / 2.3));
    const items: { x: number; y: number; z: number; w: number }[] = [];
    for (let l = 0; l < levels; l++) {
      for (let i = 0; i < count; i++) {
        items.push({
          x: (r() - 0.5) * (w - 1.2),
          y: l * lh,
          z: -0.7 - r() * 1.5,
          w: 0.8 + r() * 0.6
        });
      }
    }
    return items;
  }, [w, levels, lh, seed, deskCount]);

  const dark = solid('dark');
  const scr = useMemo(() => new THREE.MeshStandardMaterial({ color: '#111', emissive: '#67e8f9', emissiveIntensity: 1.2 }), []);

  return (
    <group position={pos} rotation={[0, ry, 0]}>
      {/* Illuminated interior backplane */}
      <mesh position={[0, h / 2, -2.2]} material={glowM}><planeGeometry args={[w, h]} /></mesh>
      {/* Front glass facade */}
      <mesh position={[0, h / 2, -0.02]} material={glass}><planeGeometry args={[w, h]} /></mesh>
      {/* Horizontal floor plates & mullions */}
      {Array.from({ length: levels + 1 }).map((_, i) => (
        <group key={i}>
          <B s={[w, 0.12, 0.14]} p={[0, i * lh, 0.02]} m={dark} cast={false} />
          {i > 0 && i < levels + 1 && (
            <B s={[w, 0.16, 2.2]} p={[0, i * lh - 0.08, -1.1]} m={solid('steel')} cast={false} recv={false} />
          )}
        </group>
      ))}
      {/* Vertical structural mullions */}
      {Array.from({ length: cols + 1 }).map((_, i) => (
        <B key={i} s={[0.08, h, 0.16]} p={[-w / 2 + (i * w) / cols, h / 2, 0.02]} m={dark} cast={false} />
      ))}
      {/* Desks and glowing computer screens visible through the glass */}
      {desks.map((d, i) => (
        <group key={i}>
          <Px s={[d.w, 0.72, 0.55]} p={[d.x, d.y + 0.36, d.z]} m={dark} />
          <Px s={[0.45, 0.28, 0.03]} p={[d.x, d.y + 0.86, d.z - 0.08]} m={scr} />
        </group>
      ))}
    </group>
  );
}

/** Landscaped organic shrubs / flower cluster */
function ShrubCluster({ x, z, w, n, seed }: { x: number; z: number; w: number; n: number; seed: number }) {
  const items = useMemo(() => {
    let s = seed * 1337; const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    const cols = ['#5fae48', '#6bb852', '#4f9b40', '#9bd368', '#dfa2b2', '#e8cc94'];
    return Array.from({ length: n }, () => ({
      x: (r() - 0.5) * (w - 0.6),
      z: (r() - 0.5) * 1.1,
      s: 0.28 + r() * 0.32,
      c: cols[(r() * cols.length) | 0]
    }));
  }, [w, n, seed]);

  return (
    <group position={[x, 0.55, z]}>
      {items.map((it, i) => (
        <mesh key={i} position={[it.x, it.s * 0.55, it.z]} scale={[1.2, 0.85, 1]} castShadow>
          <icosahedronGeometry args={[it.s, 1]} />
          <meshStandardMaterial color={it.c} roughness={0.88} flatShading />
        </mesh>
      ))}
    </group>
  );
}

/** Modern architectural palm tree */
function PalmTree({ p, h = 4.2 }: { p: V3; h?: number }) {
  return (
    <group position={p}>
      <mesh position={[0, h / 2, 0]} castShadow>
        <cylinderGeometry args={[0.09, 0.16, h, 8]} />
        <meshStandardMaterial color="#af7b4e" roughness={0.95} flatShading />
      </mesh>
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh key={i} position={[Math.cos((i / 8) * Math.PI * 2) * 0.85, h + 0.08, Math.sin((i / 8) * Math.PI * 2) * 0.85]}
              rotation={[0, -(i / 8) * Math.PI * 2, -0.52]} castShadow>
          <boxGeometry args={[1.8, 0.04, 0.38]} />
          <meshStandardMaterial color={i % 2 ? '#4f9b40' : '#5fb04b'} roughness={0.8} flatShading />
        </mesh>
      ))}
    </group>
  );
}

/** Slender modern cypress / evergreen tree */
function CypressTree({ p, h = 4.5, r = 0.7 }: { p: V3; h?: number; r?: number }) {
  return (
    <group position={p}>
      <mesh position={[0, 0.7, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.12, 1.4, 7]} />
        <meshStandardMaterial color="#6f5038" roughness={1} flatShading />
      </mesh>
      <mesh position={[0, h / 2 + 0.6, 0]} castShadow>
        <coneGeometry args={[r, h, 8]} />
        <meshStandardMaterial color="#367044" roughness={0.85} flatShading />
      </mesh>
    </group>
  );
}

/** Corporate forecourt bollard with illuminated ring */
function Bollard({ p, color = '#3d4a70', ledColor = '#ffe9b0' }: { p: [number, number]; color?: string; ledColor?: string }) {
  const m = useMemo(() => new THREE.MeshStandardMaterial({ color, roughness: 0.7, flatShading: true }), [color]);
  const led = useMemo(() => new THREE.MeshStandardMaterial({ color: '#fff', emissive: ledColor, emissiveIntensity: 1.5, flatShading: true }), [ledColor]);
  return (
    <group position={[p[0], 0, p[1]]}>
      <mesh position={[0, 0.35, 0]} material={m} castShadow>
        <cylinderGeometry args={[0.09, 0.09, 0.7, 10]} />
      </mesh>
      <mesh position={[0, 0.74, 0]} material={led}>
        <cylinderGeometry args={[0.09, 0.09, 0.08, 10]} />
      </mesh>
    </group>
  );
}

/** Corporate monument sign at plaza entrance */
export function MonumentSign({
  p, w = 3.6, h = 2.4, d = 0.5, name, subtitle, themeColor = '#3b82f6', baseMat
}: {
  p: V3; w?: number; h?: number; d?: number; name: string; subtitle?: string; themeColor?: string; baseMat: THREE.Material;
}) {
  const tex = useMemo(() => {
    return mkCanvas(512, 256, g => {
      const gr = g.createLinearGradient(0, 0, 0, 256);
      gr.addColorStop(0, '#1a2238'); gr.addColorStop(1, '#0e1424');
      g.fillStyle = gr; g.fillRect(0, 0, 512, 256);
      g.strokeStyle = themeColor; g.lineWidth = 8;
      g.strokeRect(10, 10, 492, 236);
      // Small geometric brand logo icon
      g.fillStyle = themeColor;
      g.beginPath(); g.arc(256, 60, 24, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#ffffff';
      g.beginPath(); g.arc(256, 60, 12, 0, Math.PI * 2); g.fill();
      // Name & tagline
      glowText(g, (name || 'CORPORATE').toUpperCase(), 256, 130, 40, '#ffffff', themeColor, 'center', 800);
      if (subtitle) {
        g.font = '600 20px Arial'; g.fillStyle = '#94a3b8'; g.textAlign = 'center';
        g.fillText(subtitle, 256, 185);
      }
    });
  }, [name, subtitle, themeColor]);

  const signM = useMemo(() => emiss(tex, 1.3), [tex]);

  return (
    <group position={p}>
      <B s={[w, h, d]} p={[0, h / 2, 0]} m={baseMat} />
      <mesh position={[0, h / 2, d / 2 + 0.02]} material={signM}>
        <planeGeometry args={[w - 0.25, h - 0.25]} />
      </mesh>
    </group>
  );
}

/** Modern double glass entrance doors */
export function DoubleDoors({ p, glass, alu }: { p: V3; glass: THREE.Material; alu: THREE.Material }) {
  return (
    <group position={p}>
      {[-0.6, 0.6].map(x => (
        <group key={x} position={[x, 1.4, 0]}>
          <B s={[1.1, 2.7, 0.06]} p={[0, 0, 0]} m={alu} cast={false} />
          <mesh position={[0, 0, 0.02]} material={glass}><planeGeometry args={[1.0, 2.6]} /></mesh>
          <B s={[0.04, 0.9, 0.08]} p={[x < 0 ? 0.45 : -0.45, -0.1, 0.05]} m={alu} />
        </group>
      ))}
    </group>
  );
}

// =========================================================================
// 9 DISTINCT CORPORATE BUILDING ARCHETYPES (C01 - C09)
// =========================================================================

/** 0: NEXUS TOWER (C01) - Cybernetic Twin Towers connected by Skybridge */
function NexusTower({ cfg }: { cfg: StoreConfig }) {
  const T = getSharedTextures();
  const navy = useMemo(() => new THREE.MeshStandardMaterial({ color: '#1e284a', roughness: 0.75, flatShading: true }), []);
  const titanium = useMemo(() => new THREE.MeshStandardMaterial({ color: '#2b3658', roughness: 0.8, flatShading: true }), []);
  const cyanLed = useMemo(() => new THREE.MeshStandardMaterial({ color: '#e0f7ff', emissive: '#00e5ff', emissiveIntensity: 1.8, flatShading: true }), []);
  const blueGlass = useMemo(() => { const m = glassMat('blue').clone() as THREE.MeshStandardMaterial; m.opacity = 0.52; return m; }, []);
  const stoneBase = useMemo(() => new THREE.MeshStandardMaterial({ color: '#cf9078', roughness: 0.85, flatShading: true }), []);
  const pave = useMemo(() => mat('pave', '#e0d8c8', 8, 3), []);
  const alu = solid('alu');

  return (
    <group>
      {/* Plinth & Forecourt */}
      <B s={[24, 0.6, 15]} p={[0, 0.3, -1]} m={stoneBase} />
      <mesh geometry={sbox(26, 0.06, 6, 4)} position={[0, 0.07, 7.5]} material={pave} receiveShadow />
      <Px s={[23.8, 0.06, 0.06]} p={[0, 0.62, 6.45]} m={cyanLed} />
      {[1, 2, 3].map(j => (
        <B key={j} s={[8, 0.16 * j, 0.5]} p={[0, (0.16 * j) / 2, 6.5 + (4 - j) * 0.5]} m={titanium} />
      ))}

      {/* West Tower: 5 stories (h = 18m) */}
      <group position={[-5.2, 0.6, -1]}>
        <B s={[7.6, 18, 9.6]} p={[0, 9, 0]} m={navy} />
        <CurtainWall w={6.8} h={17.4} levels={5} cols={5} pos={[0, 0, 4.85]} glass={blueGlass} tex={T.cyanGlow} seed={101} interiorTint="#cbeeff" />
        <CurtainWall w={8.4} h={17.4} levels={5} cols={6} pos={[-3.85, 0, 0]} ry={-Math.PI / 2} glass={blueGlass} tex={T.cyanGlow} seed={102} interiorTint="#cbeeff" />
        {/* Vertical aerodynamic blade fins */}
        {[-3.2, -2.2, -1.2, 0.2, 1.6, 2.8].map((x, i) => (
          <B key={i} s={[0.18, 18.2, 0.65]} p={[x, 9.1, 5.1]} m={titanium} cast={false} />
        ))}
        {/* Illuminated vertical edge strips */}
        <Px s={[0.08, 18.4, 0.08]} p={[3.8, 9.2, 4.85]} m={cyanLed} />
        <Px s={[0.08, 18.4, 0.08]} p={[-3.8, 9.2, 4.85]} m={cyanLed} />
        {/* West Tower Roof mechanical crown */}
        <B s={[6.8, 1.4, 8.6]} p={[0, 18.7, 0]} m={titanium} />
        <Px s={[6.8, 0.08, 0.08]} p={[0, 19.35, 4.3]} m={cyanLed} />
      </group>

      {/* East Tower: 4 stories (h = 14m) */}
      <group position={[5.2, 0.6, -1]}>
        <B s={[7.2, 14, 9]} p={[0, 7, 0]} m={navy} />
        <CurtainWall w={6.4} h={13.4} levels={4} cols={5} pos={[0, 0, 4.55]} glass={blueGlass} tex={T.cyanGlow} seed={103} interiorTint="#cbeeff" />
        <CurtainWall w={7.8} h={13.4} levels={4} cols={5} pos={[3.65, 0, 0]} ry={Math.PI / 2} glass={blueGlass} tex={T.cyanGlow} seed={104} interiorTint="#cbeeff" />
        {/* Antenna Communications Mast with pulsing beacon */}
        <mesh position={[0, 16.5, 0]} castShadow>
          <cylinderGeometry args={[0.06, 0.16, 5, 8]} />
          <meshStandardMaterial color="#8892b0" roughness={0.6} />
        </mesh>
        <mesh position={[0, 19.1, 0]}>
          <sphereGeometry args={[0.22, 8, 8]} />
          <meshStandardMaterial color="#fff" emissive="#00e5ff" emissiveIntensity={2.5} />
        </mesh>
      </group>

      {/* Glazed Skybridge connecting towers at level 3 */}
      <group position={[0, 8.2, -1]}>
        <B s={[4.2, 0.3, 3.2]} p={[0, -0.15, 0]} m={titanium} />
        <B s={[4.2, 0.3, 3.2]} p={[0, 3.45, 0]} m={titanium} />
        <mesh position={[0, 1.65, 1.62]} material={blueGlass}><planeGeometry args={[4.2, 3.2]} /></mesh>
        <mesh position={[0, 1.65, -1.62]} rotation={[0, Math.PI, 0]} material={blueGlass}><planeGeometry args={[4.2, 3.2]} /></mesh>
        <Px s={[4.2, 0.06, 0.06]} p={[0, 3.55, 1.65]} m={cyanLed} />
        <Px s={[4.2, 0.06, 0.06]} p={[0, -0.25, 1.65]} m={cyanLed} />
      </group>

      {/* Double-Height Glass Entrance Lobby */}
      <group position={[0, 0.6, 2.2]}>
        <B s={[5.8, 5.6, 3.8]} p={[0, 2.8, -1]} m={navy} />
        <CurtainWall w={5.4} h={5.2} levels={1} cols={4} pos={[0, 0, 0.9]} glass={blueGlass} tex={T.cyanGlow} seed={105} interiorTint="#e0f4ff" />
        {/* Cantilevered Angled Canopy */}
        <B s={[7.2, 0.35, 3.2]} p={[0, 4.8, 2.3]} m={titanium} />
        <Px s={[7.2, 0.08, 0.08]} p={[0, 4.8, 3.92]} m={cyanLed} />
        {[-2.2, -0.7, 0.7, 2.2].map(x => (
          <Px key={x} s={[0.06, 0.04, 2.4]} p={[x, 4.6, 2.3]} m={cyanLed} />
        ))}
        <DoubleDoors p={[0, 0, 0.95]} glass={blueGlass} alu={alu} />
      </group>

      {/* Plaza Landscaping & Signage */}
      <MonumentSign p={[-8.5, 0.6, 7.2]} name={cfg.name || 'NEXUS TOWER'} subtitle="TECH & INNOVATION HUB" themeColor="#00e5ff" baseMat={navy} />
      <B s={[5, 0.55, 1.4]} p={[8.2, 0.28, 7.2]} m={stoneBase} />
      <B s={[4.8, 0.06, 1.2]} p={[8.2, 0.56, 7.2]} m={solid('soil')} cast={false} />
      <ShrubCluster x={8.2} z={7.2} w={4.6} n={10} seed={11} />
      <PalmTree p={[-4.5, 0.6, 7.2]} h={4.6} />
      <PalmTree p={[4.5, 0.6, 7.2]} h={4.2} />
      {[-2.8, 2.8].map(x => (
        <Bollard key={x} p={[x, 7.8]} color="#1e284a" ledColor="#00e5ff" />
      ))}
    </group>
  );
}

/** 1: ORION PLACE (C02) - Grand Neoclassical-Modern Stepped Financial Tower */
function OrionPlace({ cfg }: { cfg: StoreConfig }) {
  const T = getSharedTextures();
  const travertine = useMemo(() => new THREE.MeshStandardMaterial({ color: '#f3ede1', roughness: 0.8, flatShading: true }), []);
  const bronzeTrim = useMemo(() => new THREE.MeshStandardMaterial({ color: '#c49a5b', roughness: 0.45, metalness: 0.65, flatShading: true }), []);
  const goldLed = useMemo(() => new THREE.MeshStandardMaterial({ color: '#fff5dc', emissive: '#fcd34d', emissiveIntensity: 1.6, flatShading: true }), []);
  const bronzeGlass = useMemo(() => { const m = glassMat('tinted').clone() as THREE.MeshStandardMaterial; m.color.set('#d8b88d'); m.opacity = 0.58; return m; }, []);
  const pave = useMemo(() => mat('pave', '#eae4d8', 8, 3), []);
  const alu = bronzeTrim;

  return (
    <group>
      {/* Plinth & Grand Forecourt */}
      <B s={[24, 0.7, 15.6]} p={[0, 0.35, -1]} m={travertine} />
      <mesh geometry={sbox(26, 0.06, 6.5, 4)} position={[0, 0.07, 7.6]} material={pave} receiveShadow />
      <Px s={[23.8, 0.06, 0.06]} p={[0, 0.72, 6.75]} m={goldLed} />
      {[1, 2, 3, 4].map(j => (
        <B key={j} s={[11, 0.175 * j, 0.55]} p={[0, (0.175 * j) / 2, 6.8 + (5 - j) * 0.55 - 0.1]} m={travertine} />
      ))}

      {/* Tier 1: Ground & Mezzanine Podium (w: 17, d: 11, h: 7m) */}
      <group position={[0, 0.7, -1]}>
        <B s={[17, 7, 11]} p={[0, 3.5, 0]} m={travertine} />
        <CurtainWall w={5.2} h={6.2} levels={2} cols={3} pos={[-5, 0, 5.52]} glass={bronzeGlass} tex={T.warmGlow} seed={201} />
        <CurtainWall w={5.2} h={6.2} levels={2} cols={3} pos={[5, 0, 5.52]} glass={bronzeGlass} tex={T.warmGlow} seed={202} />
        <B s={[17.4, 0.4, 11.4]} p={[0, 7.2, 0]} m={bronzeTrim} />
        <Px s={[17.4, 0.08, 0.08]} p={[0, 7.3, 5.72]} m={goldLed} />

        {/* Grand 2-story Colonnade at Entrance */}
        {[-2.8, -0.9, 0.9, 2.8].map((x, i) => (
          <B key={i} s={[0.65, 6.8, 0.65]} p={[x, 3.4, 6.2]} m={travertine} />
        ))}
        {/* Recessed Grand Bronze Entrance Portal */}
        <B s={[4.6, 5.2, 1.4]} p={[0, 2.6, 5.4]} m={bronzeTrim} />
        <DoubleDoors p={[0, 0, 6.15]} glass={bronzeGlass} alu={alu} />
        {/* Portico Canopy */}
        <B s={[7.2, 0.45, 2.2]} p={[0, 6.8, 6.8]} m={bronzeTrim} />
        <Px s={[7.2, 0.08, 0.08]} p={[0, 6.8, 7.92]} m={goldLed} />

        {/* Tier 2: Mid-body Tower Setback (w: 12, d: 8.5, h: 6.5m) */}
        <group position={[0, 7.4, 0]}>
          <B s={[12, 6.5, 8.5]} p={[0, 3.25, 0]} m={travertine} />
          <CurtainWall w={9.6} h={5.8} levels={2} cols={5} pos={[0, 0, 4.27]} glass={bronzeGlass} tex={T.warmGlow} seed={203} />
          <B s={[12.4, 0.35, 8.9]} p={[0, 6.65, 0]} m={bronzeTrim} />
          {/* Decorative Corner Quoins / Fluting */}
          {[[-5.8, 4.1], [5.8, 4.1], [-5.8, -4.1], [5.8, -4.1]].map(([x, z], i) => (
            <B key={i} s={[0.5, 6.5, 0.5]} p={[x, 3.25, z]} m={bronzeTrim} />
          ))}

          {/* Tier 3: Crown Penthouse Setback (w: 8, d: 6, h: 3.8m) */}
          <group position={[0, 6.8, 0]}>
            <B s={[8, 3.8, 6]} p={[0, 1.9, 0]} m={travertine} />
            <CurtainWall w={6.2} h={3.2} levels={1} cols={4} pos={[0, 0, 3.02]} glass={bronzeGlass} tex={T.warmGlow} seed={204} />
            <B s={[8.5, 0.4, 6.5]} p={[0, 4.0, 0]} m={bronzeTrim} />
            <Px s={[8.5, 0.08, 0.08]} p={[0, 4.1, 3.27]} m={goldLed} />

            {/* Stepped Art Deco Pyramidal Crown & Beacon */}
            <B s={[6.2, 0.8, 4.6]} p={[0, 4.5, 0]} m={travertine} />
            <B s={[4.4, 0.8, 3.2]} p={[0, 5.3, 0]} m={bronzeTrim} />
            <B s={[2.6, 0.8, 2.0]} p={[0, 6.1, 0]} m={travertine} />
            <mesh position={[0, 7.4, 0]} castShadow>
              <coneGeometry args={[1.1, 2.2, 4]} />
              <meshStandardMaterial color="#c49a5b" metalness={0.8} roughness={0.3} flatShading />
            </mesh>
            <mesh position={[0, 8.6, 0]}>
              <sphereGeometry args={[0.25, 8, 8]} />
              <meshStandardMaterial color="#fff" emissive="#fcd34d" emissiveIntensity={2.5} />
            </mesh>
          </group>
        </group>
      </group>

      {/* Symmetrical Formal Plaza Landscaping */}
      <MonumentSign p={[-8.5, 0.7, 7.2]} name={cfg.name || 'ORION PLACE'} subtitle="FINANCE & INVESTMENT" themeColor="#f59e0b" baseMat={travertine} />
      <B s={[4.6, 0.55, 1.5]} p={[8.4, 0.35, 7.2]} m={travertine} />
      <B s={[4.4, 0.06, 1.3]} p={[8.4, 0.63, 7.2]} m={solid('soil')} cast={false} />
      <ShrubCluster x={8.4} z={7.2} w={4.2} n={8} seed={22} />
      <CypressTree p={[-5.8, 0.7, 7.2]} h={4.8} r={0.6} />
      <CypressTree p={[5.8, 0.7, 7.2]} h={4.8} r={0.6} />
      {[-3.6, 3.6].map(x => (
        <Bollard key={x} p={[x, 7.8]} color="#c49a5b" ledColor="#fcd34d" />
      ))}
    </group>
  );
}

/** 2: THE BREW HOUSE (C03) - Terraced Hospitality & Culinary Atrium */
function BrewHouse({ cfg }: { cfg: StoreConfig }) {
  const T = getSharedTextures();
  const terracotta = useMemo(() => new THREE.MeshStandardMaterial({ color: '#a8513b', roughness: 0.9, flatShading: true }), []);
  const darkSteel = solid('dark');
  const woodMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#8c5836', roughness: 0.85, flatShading: true }), []);
  const amberGlass = useMemo(() => { const m = glassMat('tinted').clone() as THREE.MeshStandardMaterial; m.color.set('#dfa364'); m.opacity = 0.5; return m; }, []);
  const amberLed = useMemo(() => new THREE.MeshStandardMaterial({ color: '#fff3d6', emissive: '#f59e0b', emissiveIntensity: 1.5, flatShading: true }), []);
  const pave = useMemo(() => mat('pave', '#d2c0aa', 8, 3), []);

  return (
    <group>
      {/* Plinth & Outdoor Cafe Forecourt */}
      <B s={[24, 0.6, 15.6]} p={[0, 0.3, -1]} m={terracotta} />
      <mesh geometry={sbox(26, 0.06, 6.5, 4)} position={[0, 0.07, 7.6]} material={pave} receiveShadow />
      {[1, 2, 3].map(j => (
        <B key={j} s={[9, 0.16 * j, 0.5]} p={[0, (0.16 * j) / 2, 6.8 + (4 - j) * 0.5]} m={darkSteel} />
      ))}

      {/* Main Terracotta Wing (Left: 3 stories, h = 11.5m) */}
      <group position={[-3.6, 0.6, -1]}>
        <B s={[9.2, 11.5, 10.6]} p={[0, 5.75, 0]} m={terracotta} />
        <CurtainWall w={8.2} h={10.8} levels={3} cols={4} pos={[0, 0, 5.32]} glass={amberGlass} tex={T.amberGlow} seed={301} interiorTint="#ffe0b2" />
        <B s={[9.6, 0.35, 11.0]} p={[0, 11.6, 0]} m={darkSteel} />
        {/* Warehouse window grid trims */}
        {[-3.8, 3.8].map((x, i) => (
          <B key={i} s={[0.3, 11.5, 0.4]} p={[x, 5.75, 5.4]} m={darkSteel} />
        ))}
        {/* Rooftop Glasshouse Sky-Bar Pavilion */}
        <group position={[0, 11.75, 0]}>
          <B s={[6.8, 3.2, 7.2]} p={[0, 1.6, 0]} m={darkSteel} />
          <mesh position={[0, 1.6, 3.62]} material={amberGlass}><planeGeometry args={[6.6, 3]} /></mesh>
          <mesh position={[0, 1.6, -3.62]} rotation={[0, Math.PI, 0]} material={amberGlass}><planeGeometry args={[6.6, 3]} /></mesh>
          <mesh position={[3.42, 1.6, 0]} rotation={[0, Math.PI / 2, 0]} material={amberGlass}><planeGeometry args={[7, 3]} /></mesh>
          <mesh position={[-3.42, 1.6, 0]} rotation={[0, -Math.PI / 2, 0]} material={amberGlass}><planeGeometry args={[7, 3]} /></mesh>
          <B s={[7.2, 0.25, 7.6]} p={[0, 3.3, 0]} m={woodMat} />
        </group>
      </group>

      {/* Right Hospitality Wing with Stepped Outdoor Dining Terrace (2 stories, h = 7.5m) */}
      <group position={[5.2, 0.6, -1]}>
        <B s={[7.8, 7.5, 9.6]} p={[0, 3.75, 0]} m={darkSteel} />
        <CurtainWall w={7.0} h={6.8} levels={2} cols={3} pos={[0, 0, 4.82]} glass={amberGlass} tex={T.amberGlow} seed={302} interiorTint="#ffe0b2" />
        {/* Open-Air Rooftop Dining Terrace on Level 2 */}
        <group position={[0, 7.6, 0]}>
          <B s={[7.8, 0.25, 9.6]} p={[0, 0.12, 0]} m={woodMat} />
          {/* Frameless Glass Railing */}
          <mesh position={[0, 0.6, 4.75]} material={amberGlass}><boxGeometry args={[7.6, 0.9, 0.05]} /></mesh>
          <mesh position={[3.85, 0.6, 0]} rotation={[0, Math.PI / 2, 0]} material={amberGlass}><boxGeometry args={[9.4, 0.9, 0.05]} /></mesh>
          {/* Timber Pergola Shade Rafters */}
          {Array.from({ length: 6 }).map((_, i) => (
            <B key={i} s={[7.6, 0.18, 0.18]} p={[0, 2.8, -3.5 + i * 1.4]} m={woodMat} cast={false} />
          ))}
          {[-3.6, 3.6].map(x => (
            <B key={x} s={[0.18, 2.8, 0.18]} p={[x, 1.4, 4.4]} m={woodMat} />
          ))}
          {/* Terrace Planter Boxes */}
          {[-2.2, 0, 2.2].map(x => (
            <group key={x} position={[x, 0.35, 4.3]}>
              <B s={[1.6, 0.45, 0.6]} p={[0, 0, 0]} m={woodMat} />
              <ShrubCluster x={0} z={0} w={1.4} n={3} seed={30 + Math.abs(x)} />
            </group>
          ))}
        </group>
      </group>

      {/* Entrance Atrium & Timber-Lined Portico */}
      <group position={[-1.2, 0.6, 3.8]}>
        <B s={[7.6, 0.35, 2.8]} p={[0, 4.2, 0]} m={woodMat} />
        <Px s={[7.6, 0.08, 0.08]} p={[0, 4.2, 1.42]} m={amberLed} />
        {[-3.4, 3.4].map(x => (
          <B key={x} s={[0.22, 4.2, 0.22]} p={[x, 2.1, 1.2]} m={darkSteel} />
        ))}
        <DoubleDoors p={[0, 0, 0.5]} glass={amberGlass} alu={darkSteel} />
      </group>

      {/* Forecourt Plaza Elements */}
      <MonumentSign p={[-8.6, 0.6, 7.2]} name={cfg.name || 'THE BREW HOUSE'} subtitle="HOSPITALITY & LOUNGE" themeColor="#f59e0b" baseMat={terracotta} />
      {/* Outdoor Bistro Tables & Bench Planters */}
      <group position={[8.4, 0.6, 7.2]}>
        <B s={[4.8, 0.55, 1.4]} p={[0, 0.28, 0]} m={woodMat} />
        <ShrubCluster x={0} z={0} w={4.4} n={8} seed={33} />
      </group>
      <PalmTree p={[-4.8, 0.6, 7.2]} h={4.2} />
      <PalmTree p={[4.8, 0.6, 7.2]} h={4.5} />
      {[-2.5, 2.5].map(x => (
        <Bollard key={x} p={[x, 7.8]} color="#2d3748" ledColor="#f59e0b" />
      ))}
    </group>
  );
}

/** 3: ARCADE ONE (C04) - Futuristic Gaming & Esports Monolith */
function ArcadeOne({ cfg }: { cfg: StoreConfig }) {
  const T = getSharedTextures();
  const obsidian = useMemo(() => new THREE.MeshStandardMaterial({ color: '#131622', roughness: 0.7, flatShading: true }), []);
  const neonPink = useMemo(() => new THREE.MeshStandardMaterial({ color: '#ffb3dc', emissive: '#ec4899', emissiveIntensity: 2.2, flatShading: true }), []);
  const neonCyan = useMemo(() => new THREE.MeshStandardMaterial({ color: '#d0f8ff', emissive: '#06b6d4', emissiveIntensity: 2.0, flatShading: true }), []);
  const darkGlass = useMemo(() => { const m = glassMat('tinted').clone() as THREE.MeshStandardMaterial; m.color.set('#24153b'); m.opacity = 0.75; return m; }, []);
  const screenM = useMemo(() => emiss(T.arcadeScreen, 1.8), [T]);
  const pave = useMemo(() => mat('pave', '#2b3044', 8, 3), []);
  const darkSteel = solid('dark');

  return (
    <group>
      {/* Plinth & Cyber Forecourt */}
      <B s={[24, 0.6, 15.6]} p={[0, 0.3, -1]} m={obsidian} />
      <mesh geometry={sbox(26, 0.06, 6.5, 4)} position={[0, 0.07, 7.6]} material={pave} receiveShadow />
      {/* Neon Ground Strips */}
      <Px s={[23.8, 0.06, 0.06]} p={[0, 0.62, 6.75]} m={neonPink} />
      <Px s={[0.06, 0.06, 5.8]} p={[-4.5, 0.62, 3.8]} m={neonCyan} />
      <Px s={[0.06, 0.06, 5.8]} p={[4.5, 0.62, 3.8]} m={neonPink} />

      {/* Main Monolith Body (w: 16, d: 11, h: 14m) */}
      <group position={[0, 0.6, -1]}>
        <B s={[16, 14, 11]} p={[0, 7, 0]} m={obsidian} />
        {/* Giant Curved/Angled Digital Media Billboard Screen */}
        <mesh position={[0, 10.2, 5.54]} material={screenM}>
          <planeGeometry args={[14.6, 5.2]} />
        </mesh>
        <Px s={[15, 0.1, 0.1]} p={[0, 12.85, 5.58]} m={neonCyan} />
        <Px s={[15, 0.1, 0.1]} p={[0, 7.55, 5.58]} m={neonPink} />

        {/* Diagonal Neon Chevron Accents on sides */}
        {[-8.02, 8.02].map((x, i) => (
          <group key={i} position={[x, 7, 0]} rotation={[0, x > 0 ? Math.PI / 2 : -Math.PI / 2, 0]}>
            <Px s={[7, 0.08, 0.08]} p={[0, 4.2, 0]} m={neonPink} />
            <Px s={[7, 0.08, 0.08]} p={[0, 1.4, 0]} m={neonCyan} />
            <Px s={[7, 0.08, 0.08]} p={[0, -1.4, 0]} m={neonPink} />
          </group>
        ))}

        {/* Futuristic Angled Tunnel Entrance Portal */}
        <group position={[0, 0, 5.5]}>
          <B s={[7.2, 5.2, 2.6]} p={[0, 2.6, 1.3]} m={obsidian} />
          {/* Angled glowing neon chevron frames */}
          {[1.2, 2.0, 2.8].map((z, i) => (
            <group key={i}>
              <Px s={[6.4 - i * 0.4, 0.1, 0.1]} p={[0, 4.8 - i * 0.3, z]} m={i % 2 === 0 ? neonPink : neonCyan} />
              <Px s={[0.1, 4.8 - i * 0.3, 0.1]} p={[-(3.2 - i * 0.2), (4.8 - i * 0.3) / 2, z]} m={i % 2 === 0 ? neonPink : neonCyan} />
              <Px s={[0.1, 4.8 - i * 0.3, 0.1]} p={[3.2 - i * 0.2, (4.8 - i * 0.3) / 2, z]} m={i % 2 === 0 ? neonPink : neonCyan} />
            </group>
          ))}
          <DoubleDoors p={[0, 0, 0.2]} glass={darkGlass} alu={darkSteel} />
        </group>

        {/* Faceted Geometric Glass Skylight Crown with Violet Glow */}
        <group position={[0, 14.1, 0]}>
          <mesh position={[0, 2.2, 0]} castShadow>
            <coneGeometry args={[4.5, 3.8, 6]} />
            <meshStandardMaterial color="#9333ea" transparent opacity={0.65} roughness={0.2} flatShading />
          </mesh>
          <mesh position={[0, 4.3, 0]}>
            <sphereGeometry args={[0.3, 8, 8]} />
            <meshStandardMaterial color="#fff" emissive="#ec4899" emissiveIntensity={2.5} />
          </mesh>
        </group>
      </group>

      {/* Cyber Plaza Landscaping & Signage */}
      <MonumentSign p={[-8.6, 0.6, 7.2]} name={cfg.name || 'ARCADE ONE'} subtitle="NEXT-GEN ESPORTS & VR" themeColor="#ec4899" baseMat={obsidian} />
      <B s={[4.8, 0.6, 1.4]} p={[8.4, 0.3, 7.2]} m={obsidian} />
      <Px s={[4.8, 0.06, 0.06]} p={[8.4, 0.62, 7.92]} m={neonCyan} />
      <ShrubCluster x={8.4} z={7.2} w={4.4} n={6} seed={44} />
      {[-5.2, 5.2].map(x => (
        <Bollard key={x} p={[x, 7.8]} color="#131622" ledColor="#ec4899" />
      ))}
      {[-2.6, 2.6].map(x => (
        <Bollard key={x} p={[x, 7.8]} color="#131622" ledColor="#06b6d4" />
      ))}
    </group>
  );
}

/** 4: LUMIÈRE (C05) - Ultra-Luxury Fashion Flagship & Cantilevered Glass Vitrine */
function Lumiere({ cfg }: { cfg: StoreConfig }) {
  const T = getSharedTextures();
  const marble = useMemo(() => new THREE.MeshStandardMaterial({ color: '#fcfbf9', roughness: 0.6, flatShading: true }), []);
  const roseGold = useMemo(() => new THREE.MeshStandardMaterial({ color: '#dfb8aa', metalness: 0.75, roughness: 0.35, flatShading: true }), []);
  const warmLed = useMemo(() => new THREE.MeshStandardMaterial({ color: '#fffbf0', emissive: '#fed7aa', emissiveIntensity: 1.6, flatShading: true }), []);
  const crystalGlass = useMemo(() => { const m = glassMat('clear').clone() as THREE.MeshStandardMaterial; m.opacity = 0.45; return m; }, []);
  const pave = useMemo(() => mat('pave', '#f8f4ee', 8, 3), []);

  return (
    <group>
      {/* Plinth & Minimalist Marble Forecourt */}
      <B s={[24, 0.6, 15.6]} p={[0, 0.3, -1]} m={marble} />
      <mesh geometry={sbox(26, 0.06, 6.5, 4)} position={[0, 0.07, 7.6]} material={pave} receiveShadow />
      <Px s={[23.8, 0.05, 0.05]} p={[0, 0.62, 6.75]} m={warmLed} />
      {[1, 2, 3].map(j => (
        <B key={j} s={[10, 0.16 * j, 0.5]} p={[0, (0.16 * j) / 2, 6.8 + (4 - j) * 0.5]} m={marble} />
      ))}

      {/* Ground Floor Recessed Boutique Arcade */}
      <group position={[0, 0.6, -1]}>
        <B s={[17, 4.6, 10.6]} p={[0, 2.3, 0]} m={marble} />
        {/* Boutique Floor-to-ceiling Glass Display Vitrines */}
        <CurtainWall w={14.8} h={4.2} levels={1} cols={6} pos={[0, 0, 5.32]} glass={crystalGlass} tex={T.warmGlow} seed={501} interiorTint="#fff7ed" />
        <DoubleDoors p={[0, 0, 5.35]} glass={crystalGlass} alu={roseGold} />

        {/* Dramatic Cantilevered 2nd & 3rd-Floor Glass Showcase Cube */}
        <group position={[-2.2, 4.6, 1.8]}>
          <B s={[12.6, 7.8, 9.6]} p={[0, 3.9, 0]} m={marble} />
          {/* Floor-to-ceiling glass wrapping around the cantilever */}
          <CurtainWall w={12.2} h={7.4} levels={2} cols={5} pos={[0, 0, 4.82]} glass={crystalGlass} tex={T.warmGlow} seed={502} interiorTint="#fff7ed" />
          <CurtainWall w={8.8} h={7.4} levels={2} cols={4} pos={[-6.12, 0, 0]} ry={-Math.PI / 2} glass={crystalGlass} tex={T.warmGlow} seed={503} interiorTint="#fff7ed" />
          {/* Rose Gold Framing Trim */}
          <B s={[12.8, 0.35, 9.8]} p={[0, 7.95, 0]} m={roseGold} />
          <B s={[12.8, 0.25, 9.8]} p={[0, -0.12, 0]} m={roseGold} />
          <Px s={[12.8, 0.08, 0.08]} p={[0, -0.12, 4.92]} m={warmLed} />
          <Px s={[12.8, 0.08, 0.08]} p={[0, 8.0, 4.92]} m={warmLed} />
        </group>

        {/* Right Vertical Fluted Marble Blind Wing */}
        <group position={[6.2, 4.6, -0.5]}>
          <B s={[4.6, 11.2, 10]} p={[0, 5.6, 0]} m={marble} />
          {/* Vertical Rose Gold Fluting Strips */}
          {[-1.8, -0.9, 0, 0.9, 1.8].map(x => (
            <B key={x} s={[0.1, 11.2, 0.15]} p={[x, 5.6, 5.05]} m={roseGold} cast={false} />
          ))}
          <B s={[4.8, 0.35, 10.2]} p={[0, 11.35, 0]} m={roseGold} />
        </group>

        {/* Rooftop Runway / Sky-Lounge on Left Cantilever */}
        <group position={[-2.2, 12.75, 1.8]}>
          <B s={[12.4, 0.2, 9.4]} p={[0, 0.1, 0]} m={pave} />
          {/* Frameless Glass Parapet */}
          <mesh position={[0, 0.55, 4.65]} material={crystalGlass}><boxGeometry args={[12.2, 0.9, 0.04]} /></mesh>
          <mesh position={[-6.15, 0.55, 0]} rotation={[0, Math.PI / 2, 0]} material={crystalGlass}><boxGeometry args={[9.2, 0.9, 0.04]} /></mesh>
          {/* Minimalist Topiary Spheres */}
          {[-4.5, -1.8, 1.8, 4.5].map((x, i) => (
            <mesh key={i} position={[x, 0.65, 4.1]} castShadow>
              <sphereGeometry args={[0.38, 10, 8]} />
              <meshStandardMaterial color="#4f9b40" roughness={0.85} flatShading />
            </mesh>
          ))}
        </group>
      </group>

      {/* Forecourt Reflecting Pool & Signage */}
      <MonumentSign p={[-8.6, 0.6, 7.2]} name={cfg.name || 'LUMIÈRE'} subtitle="HAUTE COUTURE & LUXURY" themeColor="#dfb8aa" baseMat={marble} />
      {/* Reflecting Pool Planter Bed */}
      <group position={[8.4, 0.6, 7.2]}>
        <B s={[4.8, 0.5, 1.4]} p={[0, 0.25, 0]} m={marble} />
        <mesh position={[0, 0.48, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[4.4, 1.1]} />
          <meshStandardMaterial color="#60a5fa" roughness={0.1} metalness={0.2} transparent opacity={0.8} />
        </mesh>
        <ShrubCluster x={0} z={0} w={3.8} n={4} seed={55} />
      </group>
      <PalmTree p={[-5.2, 0.6, 7.2]} h={4.6} />
      <PalmTree p={[5.2, 0.6, 7.2]} h={4.2} />
      {[-3.0, 3.0].map(x => (
        <Bollard key={x} p={[x, 7.8]} color="#dfb8aa" ledColor="#fffbf0" />
      ))}
    </group>
  );
}

/** 5: MERIDIAN PARK (C06) - Biophilic Eco-Campus with Cascading Vertical Gardens */
function MeridianPark({ cfg }: { cfg: StoreConfig }) {
  const T = getSharedTextures();
  const concrete = useMemo(() => new THREE.MeshStandardMaterial({ color: '#8c95a0', roughness: 0.9, flatShading: true }), []);
  const timberSlat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#a0714f', roughness: 0.85, flatShading: true }), []);
  const ecoGreenGlass = useMemo(() => { const m = glassMat('blue').clone() as THREE.MeshStandardMaterial; m.color.set('#6ee7b7'); m.opacity = 0.55; return m; }, []);
  const greenLed = useMemo(() => new THREE.MeshStandardMaterial({ color: '#dcfce7', emissive: '#10b981', emissiveIntensity: 1.6, flatShading: true }), []);
  const pave = useMemo(() => mat('pave', '#d9cfbf', 8, 3), []);
  const darkSteel = solid('dark');

  return (
    <group>
      {/* Plinth & Timber Boardwalk Forecourt */}
      <B s={[24, 0.6, 15.6]} p={[0, 0.3, -1]} m={concrete} />
      <mesh geometry={sbox(26, 0.06, 6.5, 4)} position={[0, 0.07, 7.6]} material={pave} receiveShadow />
      <Px s={[23.8, 0.06, 0.06]} p={[0, 0.62, 6.75]} m={greenLed} />
      {[1, 2, 3].map(j => (
        <B key={j} s={[9, 0.16 * j, 0.5]} p={[0, (0.16 * j) / 2, 6.8 + (4 - j) * 0.5]} m={timberSlat} />
      ))}

      {/* Main Stepped Biophilic Body (L-shaped stepped massing) */}
      <group position={[0, 0.6, -1]}>
        {/* Core Office Block: 4 levels (h = 13.5m) */}
        <B s={[15.6, 13.5, 10.6]} p={[0, 6.75, 0]} m={concrete} />
        <CurtainWall w={14.4} h={12.8} levels={4} cols={6} pos={[0, 0, 5.32]} glass={ecoGreenGlass} tex={T.warmGlow} seed={601} interiorTint="#d1fae5" />
        {/* Exterior Timber Sunshade Louvers (Brise-Soleil) */}
        {Array.from({ length: 8 }).map((_, i) => (
          <B key={i} s={[0.15, 12.8, 0.55]} p={[-6.2 + i * 1.76, 6.75, 5.6]} m={timberSlat} cast={false} />
        ))}

        {/* Cascading Green Rooftop Terrace 1 (Left level 2 setback) */}
        <group position={[-5.8, 7.2, 1.2]}>
          <B s={[4.2, 0.3, 8.4]} p={[0, 0.15, 0]} m={timberSlat} />
          <ShrubCluster x={0} z={0} w={3.8} n={12} seed={61} />
          <CypressTree p={[0, 0.3, 1.5]} h={3.6} r={0.5} />
        </group>

        {/* Cascading Green Rooftop Terrace 2 (Right level 3 setback) */}
        <group position={[5.8, 10.5, 1.2]}>
          <B s={[4.2, 0.3, 8.4]} p={[0, 0.15, 0]} m={timberSlat} />
          <ShrubCluster x={0} z={0} w={3.8} n={10} seed={62} />
          <CypressTree p={[0, 0.3, -1.2]} h={3.4} r={0.5} />
        </group>

        {/* Rooftop Solar Timber Pergola Structure */}
        <group position={[0, 13.6, 0]}>
          <B s={[14, 0.25, 9.6]} p={[0, 0.12, 0]} m={timberSlat} />
          {Array.from({ length: 7 }).map((_, i) => (
            <B key={i} s={[13.6, 0.15, 0.15]} p={[0, 2.4, -3.8 + i * 1.25]} m={timberSlat} cast={false} />
          ))}
          {[[-6.4, -4.2], [6.4, -4.2], [-6.4, 4.2], [6.4, 4.2]].map(([x, z], i) => (
            <B key={i} s={[0.2, 2.4, 0.2]} p={[x, 1.2, z]} m={darkSteel} />
          ))}
          {/* Glass Solar Panels on Pergola */}
          <mesh position={[0, 2.5, 0]} material={ecoGreenGlass}>
            <boxGeometry args={[13.2, 0.05, 8.6]} />
          </mesh>
        </group>

        {/* Timber Entrance Canopy */}
        <group position={[0, 0, 5.4]}>
          <B s={[8.4, 0.35, 3.2]} p={[0, 4.2, 1.4]} m={timberSlat} />
          <Px s={[8.4, 0.08, 0.08]} p={[0, 4.2, 3.02]} m={greenLed} />
          {[-3.8, 3.8].map(x => (
            <B key={x} s={[0.2, 4.2, 0.2]} p={[x, 2.1, 2.8]} m={darkSteel} />
          ))}
          <DoubleDoors p={[0, 0, 0]} glass={ecoGreenGlass} alu={darkSteel} />
        </group>
      </group>

      {/* Lush Eco Plaza Landscaping & Signage */}
      <MonumentSign p={[-8.6, 0.6, 7.2]} name={cfg.name || 'MERIDIAN PARK'} subtitle="SUSTAINABLE TECH & CO-WORK" themeColor="#10b981" baseMat={concrete} />
      <B s={[5.2, 0.55, 1.5]} p={[8.4, 0.3, 7.2]} m={timberSlat} />
      <B s={[5.0, 0.06, 1.3]} p={[8.4, 0.6, 7.2]} m={solid('soil')} cast={false} />
      <ShrubCluster x={8.4} z={7.2} w={4.8} n={12} seed={66} />
      <CypressTree p={[-4.8, 0.6, 7.2]} h={4.4} r={0.6} />
      <CypressTree p={[4.8, 0.6, 7.2]} h={4.8} r={0.65} />
      {[-2.8, 2.8].map(x => (
        <Bollard key={x} p={[x, 7.8]} color="#a0714f" ledColor="#10b981" />
      ))}
    </group>
  );
}

/** 6: NOVA COMPLEX (C07) - Aerodynamic Tech Pavilion with Chamfered Corners */
function NovaComplex({ cfg }: { cfg: StoreConfig }) {
  const T = getSharedTextures();
  const silverAlu = useMemo(() => new THREE.MeshStandardMaterial({ color: '#cfd8e3', metalness: 0.5, roughness: 0.45, flatShading: true }), []);
  const cobaltGlass = useMemo(() => { const m = glassMat('blue').clone() as THREE.MeshStandardMaterial; m.color.set('#3b82f6'); m.opacity = 0.58; return m; }, []);
  const whiteLed = useMemo(() => new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: '#e0f2fe', emissiveIntensity: 1.8, flatShading: true }), []);
  const darkCore = useMemo(() => new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.75, flatShading: true }), []);
  const pave = useMemo(() => mat('pave', '#e2e8f0', 8, 3), []);

  return (
    <group>
      {/* Plinth & Aerodynamic Silver Forecourt */}
      <B s={[24, 0.6, 15.6]} p={[0, 0.3, -1]} m={darkCore} />
      <mesh geometry={sbox(26, 0.06, 6.5, 4)} position={[0, 0.07, 7.6]} material={pave} receiveShadow />
      <Px s={[23.8, 0.06, 0.06]} p={[0, 0.62, 6.75]} m={whiteLed} />
      {[1, 2, 3].map(j => (
        <B key={j} s={[10, 0.16 * j, 0.5]} p={[0, (0.16 * j) / 2, 6.8 + (4 - j) * 0.5]} m={silverAlu} />
      ))}

      {/* Main Aerodynamic Tower Body: 4 floors (w: 15.6, d: 10.6, h: 14.5m) */}
      <group position={[0, 0.6, -1]}>
        <B s={[15.6, 14.5, 10.6]} p={[0, 7.25, 0]} m={darkCore} />
        <CurtainWall w={14.8} h={13.8} levels={4} cols={6} pos={[0, 0, 5.32]} glass={cobaltGlass} tex={T.cyanGlow} seed={701} interiorTint="#e0f2fe" />
        {/* Horizontal Metallic Ribbon Bands wrapping each floor */}
        {[0, 3.6, 7.2, 10.8, 14.4].map((y, i) => (
          <group key={i}>
            <B s={[16.2, 0.45, 11.2]} p={[0, y, 0]} m={silverAlu} />
            <Px s={[16.2, 0.06, 0.06]} p={[0, y, 5.62]} m={whiteLed} />
          </group>
        ))}

        {/* Ground Floor Projecting Glass Showroom Cube */}
        <group position={[0, 0, 5.4]}>
          <B s={[8.6, 4.4, 3.2]} p={[0, 2.2, 1.4]} m={silverAlu} />
          <mesh position={[0, 2.2, 3.02]} material={cobaltGlass}><planeGeometry args={[8.2, 4.0]} /></mesh>
          <mesh position={[-4.32, 2.2, 1.4]} rotation={[0, -Math.PI / 2, 0]} material={cobaltGlass}><planeGeometry args={[2.8, 4.0]} /></mesh>
          <mesh position={[4.32, 2.2, 1.4]} rotation={[0, Math.PI / 2, 0]} material={cobaltGlass}><planeGeometry args={[2.8, 4.0]} /></mesh>
          <B s={[8.8, 0.3, 3.4]} p={[0, 4.45, 1.4]} m={silverAlu} />
          <Px s={[8.8, 0.06, 0.06]} p={[0, 4.45, 3.12]} m={whiteLed} />
          {/* Illuminated Product Display Pedestals inside */}
          {[-2.2, 0, 2.2].map(x => (
            <group key={x} position={[x, 0.5, 1.4]}>
              <Px s={[0.7, 1.0, 0.7]} p={[0, 0, 0]} m={silverAlu} />
              <Px s={[0.3, 0.3, 0.3]} p={[0, 0.65, 0]} m={whiteLed} />
            </group>
          ))}
          <DoubleDoors p={[0, 0, 3.05]} glass={cobaltGlass} alu={silverAlu} />
        </group>

        {/* Rooftop Illuminated "Tech Lantern" Cube */}
        <group position={[0, 14.7, 0]}>
          <B s={[6.8, 3.2, 5.4]} p={[0, 1.6, 0]} m={silverAlu} />
          <mesh position={[0, 1.6, 2.72]} material={cobaltGlass}><planeGeometry args={[6.4, 2.8]} /></mesh>
          <mesh position={[0, 1.6, -2.72]} rotation={[0, Math.PI, 0]} material={cobaltGlass}><planeGeometry args={[6.4, 2.8]} /></mesh>
          <B s={[7.2, 0.3, 5.8]} p={[0, 3.3, 0]} m={silverAlu} />
          <Px s={[7.2, 0.08, 0.08]} p={[0, 3.3, 2.92]} m={whiteLed} />
          <mesh position={[0, 3.6, 0]}>
            <sphereGeometry args={[0.3, 8, 8]} />
            <meshStandardMaterial color="#fff" emissive="#38bdf8" emissiveIntensity={2.5} />
          </mesh>
        </group>
      </group>

      {/* High-Tech Plaza Landscaping & Signage */}
      <MonumentSign p={[-8.6, 0.6, 7.2]} name={cfg.name || 'NOVA COMPLEX'} subtitle="INNOVATION & ELECTRONICS" themeColor="#38bdf8" baseMat={silverAlu} />
      <B s={[4.8, 0.55, 1.5]} p={[8.4, 0.3, 7.2]} m={silverAlu} />
      <ShrubCluster x={8.4} z={7.2} w={4.4} n={8} seed={77} />
      <PalmTree p={[-4.8, 0.6, 7.2]} h={4.5} />
      <PalmTree p={[4.8, 0.6, 7.2]} h={4.2} />
      {[-3.0, 3.0].map(x => (
        <Bollard key={x} p={[x, 7.8]} color="#cfd8e3" ledColor="#38bdf8" />
      ))}
    </group>
  );
}

/** 7: GARDEN MARKET (C08) - Contemporary Artisan Glasshouse Marketplace */
function GardenMarket({ cfg }: { cfg: StoreConfig }) {
  const T = getSharedTextures();
  const limestone = useMemo(() => new THREE.MeshStandardMaterial({ color: '#dfd7c5', roughness: 0.9, flatShading: true }), []);
  const ironSteel = solid('dark');
  const marketGlass = useMemo(() => { const m = glassMat('clear').clone() as THREE.MeshStandardMaterial; m.opacity = 0.45; return m; }, []);
  const warmLed = useMemo(() => new THREE.MeshStandardMaterial({ color: '#fff6e5', emissive: '#f59e0b', emissiveIntensity: 1.4, flatShading: true }), []);
  const woodMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#96633b', roughness: 0.9, flatShading: true }), []);
  const pave = useMemo(() => mat('pave', '#e5dccb', 8, 3), []);

  return (
    <group>
      {/* Plinth & Farmers Market Cobblestone Plaza */}
      <B s={[24, 0.6, 15.6]} p={[0, 0.3, -1]} m={limestone} />
      <mesh geometry={sbox(26, 0.06, 6.5, 4)} position={[0, 0.07, 7.6]} material={pave} receiveShadow />
      {[1, 2, 3].map(j => (
        <B key={j} s={[11, 0.16 * j, 0.5]} p={[0, (0.16 * j) / 2, 6.8 + (4 - j) * 0.5]} m={woodMat} />
      ))}

      {/* Dual Pitched Glasshouse Conservatory Structure */}
      <group position={[0, 0.6, -1]}>
        <B s={[16, 1.2, 11]} p={[0, 0.6, 0]} m={limestone} />
        {/* Greenhouse Glass Walls with Industrial Iron Glazing Bars */}
        <CurtainWall w={15.4} h={7.2} levels={2} cols={6} pos={[0, 1.2, 5.52]} glass={marketGlass} tex={T.warmGlow} seed={801} interiorTint="#fef3c7" />
        <CurtainWall w={10.4} h={7.2} levels={2} cols={4} pos={[-7.75, 1.2, 0]} ry={-Math.PI / 2} glass={marketGlass} tex={T.warmGlow} seed={802} interiorTint="#fef3c7" />
        <CurtainWall w={10.4} h={7.2} levels={2} cols={4} pos={[7.75, 1.2, 0]} ry={Math.PI / 2} glass={marketGlass} tex={T.warmGlow} seed={803} interiorTint="#fef3c7" />

        {/* Twin Pitched Sawtooth Greenhouse Glass Roofs */}
        {[-3.8, 3.8].map(x => (
          <group key={x} position={[x, 8.4, 0]}>
            {/* Triangular Gable End Frames */}
            <mesh position={[0, 1.4, 5.52]} material={ironSteel}>
              <coneGeometry args={[3.8, 2.8, 3]} />
            </mesh>
            <mesh position={[0, 1.4, -5.52]} rotation={[0, Math.PI, 0]} material={ironSteel}>
              <coneGeometry args={[3.8, 2.8, 3]} />
            </mesh>
            {/* Sloped Roof Glass Panes */}
            <mesh position={[-1.7, 1.4, 0]} rotation={[0, 0, Math.PI / 5]} material={marketGlass}>
              <boxGeometry args={[4.2, 0.08, 11.2]} />
            </mesh>
            <mesh position={[1.7, 1.4, 0]} rotation={[0, 0, -Math.PI / 5]} material={marketGlass}>
              <boxGeometry args={[4.2, 0.08, 11.2]} />
            </mesh>
            <B s={[0.15, 0.15, 11.4]} p={[0, 2.9, 0]} m={ironSteel} />
          </group>
        ))}

        {/* Front Covered Market Portico Canopy */}
        <group position={[0, 0, 5.6]}>
          <B s={[12, 0.3, 3.4]} p={[0, 4.4, 1.5]} m={woodMat} />
          <Px s={[12, 0.08, 0.08]} p={[0, 4.4, 3.22]} m={warmLed} />
          {/* Rustic Timber Columns */}
          {[-5.4, -1.8, 1.8, 5.4].map(x => (
            <B key={x} s={[0.26, 4.4, 0.26]} p={[x, 2.2, 3.0]} m={woodMat} />
          ))}
          {/* Hanging Flower Baskets */}
          {[-3.6, 0, 3.6].map(x => (
            <group key={x} position={[x, 3.5, 3.0]}>
              <Px s={[0.04, 0.7, 0.04]} p={[0, 0.35, 0]} m={ironSteel} />
              <mesh position={[0, 0, 0]} castShadow>
                <sphereGeometry args={[0.32, 8, 8]} />
                <meshStandardMaterial color="#f43f5e" roughness={0.8} />
              </mesh>
            </group>
          ))}
          <DoubleDoors p={[0, 1.2, 0]} glass={marketGlass} alu={woodMat} />
        </group>
      </group>

      {/* Rustic Farmers Market Plaza Elements */}
      <MonumentSign p={[-8.6, 0.6, 7.2]} name={cfg.name || 'GARDEN MARKET'} subtitle="ARTISAN ORGANIC PRODUCE" themeColor="#16a34a" baseMat={woodMat} />
      {/* Wooden Produce Crates & Flower Boxes */}
      <group position={[8.4, 0.6, 7.2]}>
        <B s={[4.8, 0.55, 1.4]} p={[0, 0.28, 0]} m={woodMat} />
        <ShrubCluster x={0} z={0} w={4.4} n={10} seed={88} />
      </group>
      <CypressTree p={[-5.4, 0.6, 7.2]} h={4.2} r={0.7} />
      <CypressTree p={[5.4, 0.6, 7.2]} h={4.5} r={0.7} />
      {[-3.2, 3.2].map(x => (
        <Bollard key={x} p={[x, 7.8]} color="#573821" ledColor="#f59e0b" />
      ))}
    </group>
  );
}

/** 8: STUDIO IX (C09) - Avant-Garde Deconstructivist Design Atelier */
function StudioIX({ cfg }: { cfg: StoreConfig }) {
  const T = getSharedTextures();
  const rawConcrete = useMemo(() => new THREE.MeshStandardMaterial({ color: '#a39e93', roughness: 0.95, flatShading: true }), []);
  const cortenSteel = useMemo(() => new THREE.MeshStandardMaterial({ color: '#b85d38', roughness: 0.85, metalness: 0.3, flatShading: true }), []);
  const darkGlass = useMemo(() => { const m = glassMat('blue').clone() as THREE.MeshStandardMaterial; m.color.set('#27364b'); m.opacity = 0.6; return m; }, []);
  const orangeLed = useMemo(() => new THREE.MeshStandardMaterial({ color: '#ffe4d6', emissive: '#ea580c', emissiveIntensity: 2.0, flatShading: true }), []);
  const pave = useMemo(() => mat('pave', '#d0c8b8', 8, 3), []);
  const darkSteel = solid('dark');

  return (
    <group>
      {/* Plinth & Avant-Garde Concrete Forecourt */}
      <B s={[24, 0.6, 15.6]} p={[0, 0.3, -1]} m={rawConcrete} />
      <mesh geometry={sbox(26, 0.06, 6.5, 4)} position={[0, 0.07, 7.6]} material={pave} receiveShadow />
      <Px s={[23.8, 0.06, 0.06]} p={[0, 0.62, 6.75]} m={orangeLed} />
      {[1, 2, 3].map(j => (
        <B key={j} s={[9, 0.16 * j, 0.5]} p={[0, (0.16 * j) / 2, 6.8 + (4 - j) * 0.5]} m={cortenSteel} />
      ))}

      {/* Interlocking Deconstructivist Cubes */}
      <group position={[0, 0.6, -1]}>
        {/* Ground Floor Base Studio Box */}
        <B s={[16, 5.2, 10.6]} p={[0, 2.6, 0]} m={rawConcrete} />
        <CurtainWall w={10.4} h={4.6} levels={1} cols={4} pos={[-2.4, 0, 5.32]} glass={darkGlass} tex={T.warmGlow} seed={901} interiorTint="#fed7aa" />
        <DoubleDoors p={[-2.4, 0, 5.35]} glass={darkGlass} alu={darkSteel} />

        {/* Cantilevered Upper Design Gallery Box (Shifted 2.5m out and over the plaza!) */}
        <group position={[2.8, 5.2, 1.8]}>
          <B s={[10.8, 7.8, 9.4]} p={[0, 3.9, 0]} m={cortenSteel} />
          {/* Angled Ribbon Glazing slicing through the Corten Box */}
          <CurtainWall w={10.2} h={6.8} levels={2} cols={4} pos={[0, 0, 4.72]} glass={darkGlass} tex={T.warmGlow} seed={902} interiorTint="#fed7aa" />
          <CurtainWall w={8.4} h={6.8} levels={2} cols={3} pos={[5.42, 0, 0]} ry={Math.PI / 2} glass={darkGlass} tex={T.warmGlow} seed={903} interiorTint="#fed7aa" />
          <Px s={[10.8, 0.08, 0.08]} p={[0, 7.82, 4.72]} m={orangeLed} />
          <Px s={[10.8, 0.08, 0.08]} p={[0, -0.05, 4.72]} m={orangeLed} />
        </group>

        {/* Left Concrete Anchor Tower with Angled Clerestory Roof */}
        <group position={[-5.8, 5.2, -0.8]}>
          <B s={[4.8, 9.8, 8.8]} p={[0, 4.9, 0]} m={rawConcrete} />
          {/* Sawtooth Industrial North-Light Drafting Studio Skylights */}
          {[-2.2, 0.2, 2.6].map(z => (
            <group key={z} position={[0, 9.8, z]}>
              <mesh position={[0, 0.9, 0]} rotation={[Math.PI / 4, 0, 0]} material={darkGlass}>
                <boxGeometry args={[4.4, 0.08, 1.8]} />
              </mesh>
              <B s={[4.4, 1.2, 0.15]} p={[0, 0.6, 0.7]} m={rawConcrete} />
            </group>
          ))}
        </group>

        {/* Rooftop Sculpture & Critique Terrace */}
        <group position={[2.8, 13.0, 1.8]}>
          <B s={[10.4, 0.2, 9.0]} p={[0, 0.1, 0]} m={pave} />
          {/* Minimalist Steel Pergola */}
          {Array.from({ length: 5 }).map((_, i) => (
            <B key={i} s={[10.2, 0.14, 0.14]} p={[0, 2.6, -3.2 + i * 1.6]} m={darkSteel} cast={false} />
          ))}
          {[-4.8, 4.8].map(x => (
            <B key={x} s={[0.16, 2.6, 0.16]} p={[x, 1.3, 4.0]} m={darkSteel} />
          ))}
          {/* Abstract Architectural Sculpture */}
          <mesh position={[0, 1.2, 0]} rotation={[0.4, 0.6, 0.2]} castShadow>
            <torusKnotGeometry args={[0.7, 0.22, 32, 6]} />
            <meshStandardMaterial color="#ea580c" metalness={0.6} roughness={0.3} />
          </mesh>
        </group>
      </group>

      {/* Avant-Garde Forecourt Elements */}
      <MonumentSign p={[-8.6, 0.6, 7.2]} name={cfg.name || 'STUDIO IX'} subtitle="ARCHITECTURE & DESIGN" themeColor="#ea580c" baseMat={cortenSteel} />
      <B s={[4.8, 0.55, 1.5]} p={[8.4, 0.3, 7.2]} m={cortenSteel} />
      <ShrubCluster x={8.4} z={7.2} w={4.4} n={8} seed={99} />
      <PalmTree p={[-4.5, 0.6, 7.2]} h={4.4} />
      <PalmTree p={[4.5, 0.6, 7.2]} h={4.6} />
      {[-2.8, 2.8].map(x => (
        <Bollard key={x} p={[x, 7.8]} color="#b85d38" ledColor="#ea580c" />
      ))}
    </group>
  );
}

// =========================================================================
// HELPER TO MAP PLOT ID & NAME TO DISTINCT INDEX 0..8
// =========================================================================
export function getCentralIndex(plotId?: string, name?: string): number {
  if (plotId) {
    const m = plotId.match(/\d+/);
    if (m) {
      const parsed = parseInt(m[0], 10);
      if (parsed >= 1) return (parsed - 1) % 9;
    }
  }
  if (name) {
    const known = [
      'nexus',
      'orion',
      'brew',
      'arcade',
      'lumi',
      'meridian',
      'nova',
      'garden',
      'studio',
    ];
    const lower = name.toLowerCase();
    const idx = known.findIndex(k => lower.includes(k));
    if (idx !== -1) return idx;
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
    return Math.abs(h) % 9;
  }
  return 0;
}

// =========================================================================
// FULL DETAIL COMPONENT
// =========================================================================
function CentralBuildingFull({ cfg, plotId }: { cfg: StoreConfig; plotId?: string }) {
  const index = getCentralIndex(plotId, cfg.name);
  switch (index) {
    case 0: return <NexusTower cfg={cfg} />;
    case 1: return <OrionPlace cfg={cfg} />;
    case 2: return <BrewHouse cfg={cfg} />;
    case 3: return <ArcadeOne cfg={cfg} />;
    case 4: return <Lumiere cfg={cfg} />;
    case 5: return <MeridianPark cfg={cfg} />;
    case 6: return <NovaComplex cfg={cfg} />;
    case 7: return <GardenMarket cfg={cfg} />;
    case 8: return <StudioIX cfg={cfg} />;
    default: return <NexusTower cfg={cfg} />;
  }
}

// =========================================================================
// DISTANT LOW-LOD COMPONENT
// =========================================================================
function CentralBuildingLow({ cfg, plotId }: { cfg: StoreConfig; plotId?: string }) {
  const index = getCentralIndex(plotId, cfg.name);
  const tex = useSignTexture(cfg.name, '#3b82f6', 'panel', cfg.logoUrl);
  const signM = useMemo(() => emiss(tex, 0.7), [tex]);
  const gBlue = useMemo(() => new THREE.MeshStandardMaterial({ color: '#74add8', flatShading: true }), []);
  const gWarm = useMemo(() => new THREE.MeshStandardMaterial({ color: '#d8b88d', flatShading: true }), []);

  switch (index) {
    case 0: // Nexus: Twin Towers
      return (
        <group>
          <B s={[24, 0.6, 15]} p={[0, 0.3, -1]} m={solid('dark')} />
          <B s={[7.6, 18, 9.6]} p={[-5.2, 9.6, -1]} m={solid('dark')} />
          <B s={[6.8, 17, 1]} p={[-5.2, 9.6, 3.8]} m={gBlue} />
          <B s={[7.2, 14, 9]} p={[5.2, 7.6, -1]} m={solid('dark')} />
          <B s={[6.4, 13, 1]} p={[5.2, 7.6, 3.5]} m={gBlue} />
          <B s={[4.2, 3.4, 3.2]} p={[0, 9.8, -1]} m={gBlue} />
          <mesh position={[0, 4.2, 2.8]} material={signM}><planeGeometry args={[7, 1]} /></mesh>
        </group>
      );
    case 1: // Orion: Stepped Ziggurat
      return (
        <group>
          <B s={[24, 0.7, 15.6]} p={[0, 0.35, -1]} m={solid('white')} />
          <B s={[17, 7, 11]} p={[0, 4.2, -1]} m={solid('white')} />
          <B s={[12, 6.5, 8.5]} p={[0, 10.9, -1]} m={solid('white')} />
          <B s={[8, 3.8, 6]} p={[0, 16.0, -1]} m={solid('white')} />
          <mesh position={[0, 21.0, -1]}><coneGeometry args={[1.1, 2.2, 4]} /><meshStandardMaterial color="#c49a5b" flatShading /></mesh>
          <mesh position={[0, 5.2, 4.8]} material={signM}><planeGeometry args={[8, 1]} /></mesh>
        </group>
      );
    case 2: // Brew House: Terraced Brick
      return (
        <group>
          <B s={[24, 0.6, 15.6]} p={[0, 0.3, -1]} m={solid('dark')} />
          <B s={[9.2, 11.5, 10.6]} p={[-3.6, 6.35, -1]} m={mat('brick', '#a8513b')} />
          <B s={[7.8, 7.5, 9.6]} p={[5.2, 4.35, -1]} m={solid('dark')} />
          <B s={[6.8, 3.2, 7.2]} p={[-3.6, 13.6, -1]} m={gWarm} />
          <mesh position={[-1.2, 4.6, 3.8]} material={signM}><planeGeometry args={[7.6, 1]} /></mesh>
        </group>
      );
    case 3: // Arcade One: Angled Monolith
      return (
        <group>
          <B s={[24, 0.6, 15.6]} p={[0, 0.3, -1]} m={solid('dark')} />
          <B s={[16, 14, 11]} p={[0, 7.6, -1]} m={solid('dark')} />
          <B s={[14.6, 5.2, 0.2]} p={[0, 10.8, 4.6]} m={mat('metal', '#ec4899')} />
          <mesh position={[0, 18.0, -1]}><coneGeometry args={[4.5, 3.8, 6]} /><meshStandardMaterial color="#9333ea" flatShading /></mesh>
          <mesh position={[0, 4.2, 4.8]} material={signM}><planeGeometry args={[7, 1]} /></mesh>
        </group>
      );
    case 4: // Lumiere: Cantilevered Vitrine
      return (
        <group>
          <B s={[24, 0.6, 15.6]} p={[0, 0.3, -1]} m={solid('white')} />
          <B s={[17, 4.6, 10.6]} p={[0, 2.9, -1]} m={solid('white')} />
          <B s={[12.6, 7.8, 9.6]} p={[-2.2, 9.1, 0.8]} m={gBlue} />
          <B s={[4.6, 11.2, 10]} p={[6.2, 10.8, -1.5]} m={solid('white')} />
          <mesh position={[-2.2, 4.8, 5.8]} material={signM}><planeGeometry args={[8, 1]} /></mesh>
        </group>
      );
    case 5: // Meridian: Biophilic Terraced
      return (
        <group>
          <B s={[24, 0.6, 15.6]} p={[0, 0.3, -1]} m={solid('steel')} />
          <B s={[15.6, 13.5, 10.6]} p={[0, 7.35, -1]} m={solid('steel')} />
          <B s={[4.2, 0.4, 8.4]} p={[-5.8, 7.8, 0.2]} m={solid('foliage')} />
          <B s={[4.2, 0.4, 8.4]} p={[5.8, 11.1, 0.2]} m={solid('foliage')} />
          <mesh position={[0, 4.4, 4.8]} material={signM}><planeGeometry args={[8, 1]} /></mesh>
        </group>
      );
    case 6: // Nova: Aerodynamic Tech
      return (
        <group>
          <B s={[24, 0.6, 15.6]} p={[0, 0.3, -1]} m={solid('steel')} />
          <B s={[15.6, 14.5, 10.6]} p={[0, 7.85, -1]} m={solid('alu')} />
          <B s={[8.6, 4.4, 3.2]} p={[0, 2.8, 4.4]} m={gBlue} />
          <B s={[6.8, 3.2, 5.4]} p={[0, 16.3, -1]} m={gBlue} />
          <mesh position={[0, 4.8, 6.0]} material={signM}><planeGeometry args={[8, 1]} /></mesh>
        </group>
      );
    case 7: // Garden Market: Dual Sawtooth Gables
      return (
        <group>
          <B s={[24, 0.6, 15.6]} p={[0, 0.3, -1]} m={solid('white')} />
          <B s={[16, 7.2, 11]} p={[0, 4.2, -1]} m={gWarm} />
          {[-3.8, 3.8].map(x => (
            <mesh key={x} position={[x, 9.4, -1]}>
              <coneGeometry args={[3.8, 2.8, 3]} />
              <meshStandardMaterial color="#556b2f" flatShading />
            </mesh>
          ))}
          <mesh position={[0, 4.6, 4.8]} material={signM}><planeGeometry args={[8, 1]} /></mesh>
        </group>
      );
    case 8: // Studio IX: Deconstructivist Corten
    default:
      return (
        <group>
          <B s={[24, 0.6, 15.6]} p={[0, 0.3, -1]} m={solid('steel')} />
          <B s={[16, 5.2, 10.6]} p={[0, 3.2, -1]} m={solid('steel')} />
          <B s={[10.8, 7.8, 9.4]} p={[2.8, 9.7, 0.8]} m={mat('roof', '#b85d38')} />
          <B s={[4.8, 9.8, 8.8]} p={[-5.8, 10.7, -1.8]} m={solid('steel')} />
          <mesh position={[2.8, 5.4, 5.8]} material={signM}><planeGeometry args={[8, 1]} /></mesh>
        </group>
      );
  }
}

// =========================================================================
// LOD EXPORT
// =========================================================================
export function CentralBuildingLOD({
  cfg, plotId, lodDistance = 65
}: {
  cfg: StoreConfig; plotId?: string; lodDistance?: number
}) {
  return (
    <Detailed distances={[0, lodDistance]}>
      <CentralBuildingFull cfg={cfg} plotId={plotId} />
      <CentralBuildingLow cfg={cfg} plotId={plotId} />
    </Detailed>
  );
}
