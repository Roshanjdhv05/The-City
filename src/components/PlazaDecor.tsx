'use client';
import * as THREE from 'three';
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { solid, mat } from '@/lib/materials';
import { cityTime, getTimePhase } from '@/lib/time';

// ── Shared Colors and Helpers ──
const UCYL = new THREE.CylinderGeometry(1, 1, 1, 16);
const DODECA = new THREE.DodecahedronGeometry(1, 1);
const SPHERE = new THREE.SphereGeometry(1, 12, 10);

// ─────────────────────────────────────────────────────────────────────────────
// 2. High-Quality Low-Poly Palm Tree
// ─────────────────────────────────────────────────────────────────────────────
export function PalmTree({ position, scale = 1, rotation = 0 }: { position: [number, number, number]; scale?: number; rotation?: number }) {
  const trunkMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#8c5a32', roughness: 0.95, flatShading: true }), []);
  const frondMat1 = useMemo(() => new THREE.MeshStandardMaterial({ color: '#4fa738', roughness: 0.8, flatShading: true, side: THREE.DoubleSide }), []);
  const frondMat2 = useMemo(() => new THREE.MeshStandardMaterial({ color: '#3d8e28', roughness: 0.82, flatShading: true, side: THREE.DoubleSide }), []);
  const grateMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#262930', roughness: 0.6, metalness: 0.4 }), []);

  const height = 5.8 * scale;

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Architectural Tree Grate Ring */}
      <mesh position={[0, 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]} material={grateMat} receiveShadow>
        <ringGeometry args={[0.4, 1.1, 16]} />
      </mesh>

      {/* Segmented Tapered Trunk */}
      <mesh position={[0, height / 2, 0]} material={trunkMat} castShadow>
        <cylinderGeometry args={[0.18 * scale, 0.28 * scale, height, 8]} />
      </mesh>

      {/* 12 Gracefully Arching Palm Fronds */}
      {Array.from({ length: 12 }).map((_, i) => {
        const ang = (i / 12) * Math.PI * 2;
        const droop = 0.55 + (i % 2) * 0.12;
        const frondLen = (2.4 + (i % 3) * 0.3) * scale;
        const frondW = 0.55 * scale;
        const col = i % 2 === 0 ? frondMat1 : frondMat2;

        return (
          <group key={i} position={[0, height, 0]} rotation={[0, ang, 0]}>
            <mesh position={[frondLen * 0.45, -0.2, 0]} rotation={[0, 0, -droop]} material={col} castShadow>
              <boxGeometry args={[frondLen, 0.03, frondW]} />
            </mesh>
            {/* Outer tip droop */}
            <mesh position={[frondLen * 0.85, -0.65, 0]} rotation={[0, 0, -droop - 0.35]} material={col} castShadow>
              <boxGeometry args={[frondLen * 0.45, 0.02, frondW * 0.7]} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Flowering Ornamental Tree (Cherry / Magnolia Blossom)
// ─────────────────────────────────────────────────────────────────────────────
export function FloweringTree({ position, scale = 1, rotation = 0, variant = 'pink' }: { position: [number, number, number]; scale?: number; rotation?: number; variant?: 'pink' | 'white' }) {
  const trunkMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#5a4638', roughness: 0.95, flatShading: true }), []);
  const blossomColor = variant === 'pink' ? '#f472b6' : '#fef3c7';
  const blossomEmiss = variant === 'pink' ? '#db2777' : '#fde68a';
  const blossomMat1 = useMemo(() => new THREE.MeshStandardMaterial({ color: blossomColor, emissive: blossomEmiss, emissiveIntensity: 0.15, roughness: 0.82, flatShading: true }), [blossomColor, blossomEmiss]);
  const blossomMat2 = useMemo(() => new THREE.MeshStandardMaterial({ color: variant === 'pink' ? '#fb7185' : '#fdf2f8', roughness: 0.88, flatShading: true }), [variant]);

  const h = 3.8 * scale;

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Trunk and Boughs */}
      <mesh position={[0, h * 0.4, 0]} material={trunkMat} castShadow>
        <cylinderGeometry args={[0.14 * scale, 0.22 * scale, h * 0.8, 7]} />
      </mesh>
      {/* 3 angled boughs */}
      {Array.from({ length: 3 }).map((_, i) => {
        const bAng = (i / 3) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(bAng) * 0.35 * scale, h * 0.72, Math.sin(bAng) * 0.35 * scale]} rotation={[0.4 * Math.sin(bAng), bAng, 0.4 * Math.cos(bAng)]} material={trunkMat} castShadow>
            <cylinderGeometry args={[0.08 * scale, 0.12 * scale, 1.2 * scale, 6]} />
          </mesh>
        );
      })}

      {/* Cloud-like Blossoming Canopy Clusters */}
      <mesh position={[0, h + 0.3 * scale, 0]} scale={[1.4 * scale, 1.1 * scale, 1.4 * scale]} material={blossomMat1} castShadow>
        <dodecahedronGeometry args={[1.1 * scale, 1]} />
      </mesh>
      <mesh position={[0.7 * scale, h * 0.9, 0.4 * scale]} scale={[1.1 * scale, 0.9 * scale, 1.1 * scale]} material={blossomMat2} castShadow>
        <dodecahedronGeometry args={[0.85 * scale, 1]} />
      </mesh>
      <mesh position={[-0.6 * scale, h * 0.85, -0.5 * scale]} scale={[1.0 * scale, 0.85 * scale, 1.0 * scale]} material={blossomMat2} castShadow>
        <dodecahedronGeometry args={[0.8 * scale, 1]} />
      </mesh>
      <mesh position={[0, h * 1.25, 0]} scale={[0.9 * scale, 0.8 * scale, 0.9 * scale]} material={blossomMat1} castShadow>
        <dodecahedronGeometry args={[0.75 * scale, 1]} />
      </mesh>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Modern Architectural Teak & Steel Bench
// ─────────────────────────────────────────────────────────────────────────────
function BenchItem({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  const woodMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#b46a3a', roughness: 0.65, flatShading: true }), []);
  const metalMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#1f242d', roughness: 0.35, metalness: 0.75 }), []);

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* 4 Teak Wood Seat Slats */}
      {[-0.20, -0.07, 0.06, 0.19].map((z, idx) => (
        <mesh key={'seat-' + idx} position={[0, 0.42, z]} material={woodMat} castShadow receiveShadow>
          <boxGeometry args={[2.2, 0.05, 0.11]} />
        </mesh>
      ))}
      {/* 2 Ergonomic Backrest Slats */}
      {[0.62, 0.78].map((y, idx) => (
        <mesh key={'back-' + idx} position={[0, y, -0.28]} rotation={[-0.14, 0, 0]} material={woodMat} castShadow>
          <boxGeometry args={[2.2, 0.12, 0.05]} />
        </mesh>
      ))}
      {/* Minimalist Dark Steel Stanchions */}
      {[-0.85, 0.85].map((x, idx) => (
        <group key={'leg-' + idx} position={[x, 0, 0]}>
          <mesh position={[0, 0.22, 0]} material={metalMat} castShadow>
            <boxGeometry args={[0.08, 0.44, 0.52]} />
          </mesh>
          <mesh position={[0, 0.58, -0.26]} rotation={[-0.14, 0, 0]} material={metalMat}>
            <boxGeometry args={[0.08, 0.42, 0.06]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Modern Cylindrical Dual Waste/Recycle Receptacle
// ─────────────────────────────────────────────────────────────────────────────
function WasteBinItem({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  const steelMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#262930', roughness: 0.35, metalness: 0.75 }), []);
  const woodMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#a66838', roughness: 0.75 }), []);

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Base & Cylinder Body */}
      <mesh position={[0, 0.42, 0]} material={steelMat} castShadow>
        <cylinderGeometry args={[0.24, 0.24, 0.84, 16]} />
      </mesh>
      {/* Teak Wood Wrap Slats */}
      <mesh position={[0, 0.42, 0]} material={woodMat}>
        <cylinderGeometry args={[0.246, 0.246, 0.55, 16, 1, true]} />
      </mesh>
      {/* Top Lid with Drop Hole */}
      <mesh position={[0, 0.85, 0]} material={steelMat}>
        <cylinderGeometry args={[0.25, 0.25, 0.05, 16]} />
      </mesh>
      <mesh position={[0, 0.88, 0]} material={steelMat}>
        <cylinderGeometry args={[0.12, 0.12, 0.03, 12]} />
      </mesh>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. Modern Architectural Lighting Mast (Day/Night Responsive)
// ─────────────────────────────────────────────────────────────────────────────
function ModernLightingMast({ position, rotation = 0, poolMat, lampHeadMat }: { position: [number, number, number]; rotation?: number; poolMat: THREE.Material; lampHeadMat: THREE.MeshStandardMaterial }) {
  const iron = useMemo(() => new THREE.MeshStandardMaterial({ color: '#1c1f24', roughness: 0.3, metalness: 0.8 }), []);

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Tapered Mast */}
      <mesh position={[0, 2.2, 0]} material={iron} castShadow>
        <cylinderGeometry args={[0.07, 0.13, 4.4, 8]} />
      </mesh>
      {/* Cantilevered Arm */}
      <mesh position={[0.45, 4.35, 0]} rotation={[0, 0, -0.1]} material={iron}>
        <boxGeometry args={[1.1, 0.08, 0.12]} />
      </mesh>
      {/* Sleek Flat LED Luminaire Head */}
      <mesh position={[0.92, 4.28, 0]} material={iron}>
        <boxGeometry args={[0.55, 0.06, 0.28]} />
      </mesh>
      <mesh position={[0.92, 4.24, 0]} material={lampHeadMat}>
        <boxGeometry args={[0.48, 0.02, 0.22]} />
      </mesh>
      {/* Night Ambient Ground Pool */}
      <mesh position={[0.92, 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]} material={poolMat}>
        <planeGeometry args={[8.5, 8.5]} />
      </mesh>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. Modern Illuminated Pathway Bollard
// ─────────────────────────────────────────────────────────────────────────────
function BollardItem({ position, glowMat }: { position: [number, number, number]; glowMat: THREE.Material }) {
  const bodyMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#262930', roughness: 0.4, metalness: 0.7 }), []);

  return (
    <group position={position}>
      {/* Post */}
      <mesh position={[0, 0.42, 0]} material={bodyMat} castShadow>
        <cylinderGeometry args={[0.09, 0.11, 0.84, 12]} />
      </mesh>
      {/* Illuminated Inset Ring */}
      <mesh position={[0, 0.74, 0]} material={glowMat}>
        <cylinderGeometry args={[0.092, 0.092, 0.08, 12]} />
      </mesh>
      {/* Top Cap */}
      <mesh position={[0, 0.86, 0]} material={bodyMat}>
        <cylinderGeometry args={[0.095, 0.095, 0.05, 12]} />
      </mesh>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. Corporate Wayfinding Signboard Totem
// ─────────────────────────────────────────────────────────────────────────────
function WayfindingTotem({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  const totemBaseMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#1c1f24', roughness: 0.4, metalness: 0.6 }), []);
  const totemGlassMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#0f172a',
    roughness: 0.15,
    metalness: 0.3,
  }), []);
  const accentBlue = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#38bdf8',
    emissive: '#0284c7',
    emissiveIntensity: 1.5,
  }), []);
  const textWhite = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#ffffff',
    emissive: '#e0f2fe',
    emissiveIntensity: 0.9,
  }), []);

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Base Plinth */}
      <mesh position={[0, 0.1, 0]} material={totemBaseMat} castShadow receiveShadow>
        <boxGeometry args={[1.1, 0.2, 0.35]} />
      </mesh>
      {/* Monolith Body */}
      <mesh position={[0, 1.25, 0]} material={totemGlassMat} castShadow>
        <boxGeometry args={[0.9, 2.1, 0.14]} />
      </mesh>
      {/* Glowing Brand Accent Strip */}
      <mesh position={[0, 2.18, 0.075]} material={accentBlue}>
        <boxGeometry args={[0.82, 0.06, 0.02]} />
      </mesh>
      {/* J Logo Symbol */}
      <mesh position={[0, 1.95, 0.075]} material={accentBlue}>
        <boxGeometry args={[0.22, 0.22, 0.02]} />
      </mesh>
      {/* Header Bar */}
      <mesh position={[0, 1.68, 0.075]} material={textWhite}>
        <boxGeometry args={[0.7, 0.08, 0.02]} />
      </mesh>
      {/* Directional Lines */}
      {[-0.15, -0.32, -0.49].map((dy, i) => (
        <mesh key={i} position={[0, 1.45 + dy, 0.075]} material={textWhite}>
          <boxGeometry args={[0.62, 0.035, 0.02]} />
        </mesh>
      ))}
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. Modern Rectangular Fluted Architectural Planter
// ─────────────────────────────────────────────────────────────────────────────
function ArchitecturalPlanter({ position, size = [2.6, 0.65, 0.9], rotation = 0 }: { position: [number, number, number]; size?: [number, number, number]; rotation?: number }) {
  const stoneMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#ebdccb', roughness: 0.55, flatShading: true }), []);
  const soilMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#3d2817', roughness: 0.98 }), []);
  const shrubGreen = useMemo(() => new THREE.MeshStandardMaterial({ color: '#3a7a14', roughness: 0.85, flatShading: true }), []);
  const flowerGold = useMemo(() => new THREE.MeshStandardMaterial({ color: '#f59e0b', roughness: 0.75, flatShading: true }), []);

  const [w, h, d] = size;

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Stone Container */}
      <mesh position={[0, h / 2, 0]} material={stoneMat} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
      </mesh>
      {/* Top Soil Bed */}
      <mesh position={[0, h, 0]} material={soilMat}>
        <boxGeometry args={[w - 0.2, 0.04, d - 0.2]} />
      </mesh>
      {/* Tiered Shrubs */}
      {[-w * 0.3, 0, w * 0.3].map((x, i) => (
        <group key={i} position={[x, h + 0.35, 0]}>
          <mesh material={shrubGreen} castShadow>
            <dodecahedronGeometry args={[0.42, 1]} />
          </mesh>
          <mesh position={[0.15, 0.35, 0.1]} material={flowerGold}>
            <sphereGeometry args={[0.12, 8, 8]} />
          </mesh>
          <mesh position={[-0.15, 0.32, -0.1]} material={flowerGold}>
            <sphereGeometry args={[0.11, 8, 8]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 10. Main Plaza Decorations Component
// ─────────────────────────────────────────────────────────────────────────────
export function PlazaDecorations() {
  const lampHead = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#fff8e1',
    emissive: '#ffe566',
    emissiveIntensity: 0.4,
    roughness: 0.3,
  }), []);

  const bollardGlow = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#e0f2fe',
    emissive: '#38bdf8',
    emissiveIntensity: 1.6,
  }), []);

  const [poolTex, poolMat] = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 128;
    c.height = 128;
    const g = c.getContext('2d')!;
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, 'rgba(255, 235, 140, 0.85)');
    gr.addColorStop(0.35, 'rgba(255, 205, 80, 0.45)');
    gr.addColorStop(0.75, 'rgba(255, 180, 40, 0.12)');
    gr.addColorStop(1, 'rgba(255, 160, 20, 0)');
    g.fillStyle = gr;
    g.fillRect(0, 0, 128, 128);
    const t = new THREE.CanvasTexture(c);
    const m = new THREE.MeshBasicMaterial({
      map: t,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -3,
    });
    return [t, m];
  }, []);

  useFrame(() => {
    const { darkness } = getTimePhase(cityTime.hour);
    lampHead.emissiveIntensity = 0.4 + darkness * 3.8;
    lampHead.emissive.set(darkness > 0.1 ? '#ffda6e' : '#fff7ed');
    poolMat.opacity = Math.max(0, darkness * 0.85);
    poolMat.visible = darkness > 0.05;
  });

  // ── Placements around J Enterprise Plaza (PLAZA.r = 40m) ──

  // Benches along promenade & garden overlooks
  const benches: { p: [number, number, number]; r: number }[] = [
    // Flanking the open grand approach avenue
    { p: [-6.8, 0.05, 23.5], r: -1.57 },
    { p: [6.8, 0.05, 23.5], r: 1.57 },
    { p: [-6.8, 0.05, 29.5], r: -1.57 },
    { p: [6.8, 0.05, 29.5], r: 1.57 },
    // East Garden Terrace
    { p: [23.5, 0.05, 14.0], r: -1.2 },
    { p: [26.0, 0.05, 0.0], r: -1.57 },
    { p: [23.5, 0.05, -14.0], r: -2.0 },
    // West Garden Terrace
    { p: [-23.5, 0.05, 14.0], r: 1.2 },
    { p: [-26.0, 0.05, 0.0], r: 1.57 },
    { p: [-23.5, 0.05, -14.0], r: 2.0 },
    // North Executive Courtyard (rear)
    { p: [-10.5, 0.05, -23.0], r: 3.14 },
    { p: [10.5, 0.05, -23.0], r: 3.14 },
  ];

  // Discreet Waste Bins paired near seating
  const wasteBins: { p: [number, number, number]; r: number }[] = [
    { p: [-6.8, 0.05, 21.6], r: -1.57 },
    { p: [6.8, 0.05, 21.6], r: 1.57 },
    { p: [25.0, 0.05, 12.5], r: -1.2 },
    { p: [-25.0, 0.05, 12.5], r: 1.2 },
    { p: [12.2, 0.05, -23.0], r: 3.14 },
    { p: [-12.2, 0.05, -23.0], r: 3.14 },
  ];

  // Modern Lighting Masts along the main promenade
  const lamps: { p: [number, number, number]; r: number }[] = [
    // Entrance boulevard illumination
    { p: [-5.2, 0.05, 33.0], r: 0.2 },
    { p: [5.2, 0.05, 33.0], r: -0.2 },
    { p: [-13.5, 0.05, 24.0], r: 0.6 },
    { p: [13.5, 0.05, 24.0], r: -0.6 },
    // Lateral promenade
    { p: [26.5, 0.05, 7.5], r: -1.57 },
    { p: [26.5, 0.05, -7.5], r: -1.57 },
    { p: [-26.5, 0.05, 7.5], r: 1.57 },
    { p: [-26.5, 0.05, -7.5], r: 1.57 },
    // North executive court
    { p: [-14.0, 0.05, -20.0], r: 3.14 },
    { p: [14.0, 0.05, -20.0], r: 3.14 },
  ];

  // Low Illuminated Pathway Bollards guiding pedestrian routes
  const bollards: [number, number, number][] = [
    // Southern entrance boulevard avenue lines (continuous open avenue)
    [-3.8, 0.05, 18.0],
    [-3.8, 0.05, 22.5],
    [-3.8, 0.05, 27.0],
    [-3.8, 0.05, 31.5],
    [-3.8, 0.05, 36.0],
    [3.8, 0.05, 18.0],
    [3.8, 0.05, 22.5],
    [3.8, 0.05, 27.0],
    [3.8, 0.05, 31.5],
    [3.8, 0.05, 36.0],
    // Forecourt arrival line
    [-13.5, 0.05, 12.0],
    [-10.5, 0.05, 12.0],
    [10.5, 0.05, 12.0],
    [13.5, 0.05, 12.0],
  ];

  // Palm trees along boulevard & garden terraces
  const palms: { p: [number, number, number]; s: number; r: number }[] = [
    // Flanking the main grand approach
    { p: [-16.5, 0.05, 31.0], s: 1.1, r: 0.4 },
    { p: [16.5, 0.05, 31.0], s: 1.1, r: -0.4 },
    { p: [-19.5, 0.05, 21.0], s: 1.05, r: 0.9 },
    { p: [19.5, 0.05, 21.0], s: 1.05, r: -0.9 },
    // East garden oasis
    { p: [29.5, 0.05, 16.5], s: 1.15, r: 1.5 },
    { p: [31.0, 0.05, 0.0], s: 1.2, r: 2.2 },
    { p: [29.5, 0.05, -16.5], s: 1.1, r: 0.7 },
    // West garden oasis
    { p: [-29.5, 0.05, 16.5], s: 1.15, r: -1.5 },
    { p: [-31.0, 0.05, 0.0], s: 1.2, r: -2.2 },
    { p: [-29.5, 0.05, -16.5], s: 1.1, r: -0.7 },
  ];

  // Flowering ornamental blossom trees (pink & white)
  const floweringTrees: { p: [number, number, number]; s: number; r: number; v: 'pink' | 'white' }[] = [
    // Front Parterre gardens
    { p: [-12.5, 0.05, 27.5], s: 1.0, r: 0.5, v: 'pink' },
    { p: [12.5, 0.05, 27.5], s: 1.0, r: -0.5, v: 'pink' },
    { p: [-15.5, 0.05, 16.0], s: 0.92, r: 1.2, v: 'white' },
    { p: [15.5, 0.05, 16.0], s: 0.92, r: -1.2, v: 'white' },
    // North executive court
    { p: [-19.0, 0.05, -25.0], s: 1.1, r: 2.1, v: 'pink' },
    { p: [19.0, 0.05, -25.0], s: 1.1, r: -2.1, v: 'white' },
    { p: [0.0, 0.05, -27.0], s: 1.05, r: 0.0, v: 'pink' },
  ];

  // Architectural entrance & plaza planters
  const planters: { p: [number, number, number]; size: [number, number, number]; r: number }[] = [
    // Flanking J Enterprise main glass entrance
    { p: [-6.8, 0.05, 14.5], size: [2.8, 0.65, 0.9], r: 0 },
    { p: [6.8, 0.05, 14.5], size: [2.8, 0.65, 0.9], r: 0 },
    // Central approach gateway
    { p: [-4.8, 0.05, 25.5], size: [2.4, 0.6, 0.8], r: 1.57 },
    { p: [4.8, 0.05, 25.5], size: [2.4, 0.6, 0.8], r: 1.57 },
    // Lateral terrace arrival points
    { p: [21.0, 0.05, 7.5], size: [2.8, 0.65, 0.9], r: 0 },
    { p: [-21.0, 0.05, 7.5], size: [2.8, 0.65, 0.9], r: 0 },
  ];

  // ── Parterre Flowerbed Shrub Clusters ──
  const shrubColors = ['#4d8e1f', '#3a7a14', '#5ba324', '#2d6a12'];
  const flowerColors = ['#f43f5e', '#a855f7', '#f59e0b', '#38bdf8', '#ffffff'];

  const flowerBeds = useMemo(() => {
    const list: { p: [number, number, number]; s: number; sc: string; fc: string }[] = [];
    // West Parterre Garden Grid
    for (let gx = -17; gx <= -9; gx += 2.4) {
      for (let gz = 20; gz <= 32; gz += 2.5) {
        if (Math.hypot(gx - (-12.5), gz - 27.5) < 2.0) continue;
        const s = 0.45 + ((Math.abs(gx * gz) % 7) / 25);
        const sc = shrubColors[(Math.abs(gx * 3 + gz) | 0) % shrubColors.length];
        const fc = flowerColors[(Math.abs(gx * 7 + gz * 2) | 0) % flowerColors.length];
        list.push({ p: [gx, 0.05, gz], s, sc, fc });
      }
    }
    // East Parterre Garden Grid
    for (let gx = 9; gx <= 17; gx += 2.4) {
      for (let gz = 20; gz <= 32; gz += 2.5) {
        if (Math.hypot(gx - 12.5, gz - 27.5) < 2.0) continue;
        const s = 0.45 + ((Math.abs(gx * gz) % 7) / 25);
        const sc = shrubColors[(Math.abs(gx * 3 + gz) | 0) % shrubColors.length];
        const fc = flowerColors[(Math.abs(gx * 7 + gz * 2) | 0) % flowerColors.length];
        list.push({ p: [gx, 0.05, gz], s, sc, fc });
      }
    }
    // Rear North Garden Clusters
    for (let i = 0; i < 18; i++) {
      const ang = (i / 18) * Math.PI * 0.9 + Math.PI * 1.05;
      const rx = Math.cos(ang) * 25.0;
      const rz = Math.sin(ang) * 22.0 - 5;
      const s = 0.5 + (i % 3) * 0.1;
      const sc = shrubColors[i % shrubColors.length];
      const fc = flowerColors[i % flowerColors.length];
      list.push({ p: [rx, 0.05, rz], s, sc, fc });
    }
    return list;
  }, []);

  return (
    <group>
      {/* 1. Wayfinding Totems at Entrance Arrival */}
      <WayfindingTotem position={[-8.5, 0.05, 36.5]} rotation={0.15} />
      <WayfindingTotem position={[8.5, 0.05, 36.5]} rotation={-0.15} />

      {/* 3. Luxury Teak & Steel Benches */}
      {benches.map((b, i) => (
        <BenchItem key={'bench-' + i} position={b.p} rotation={b.r} />
      ))}

      {/* 4. Discreet Cylindrical Waste Receptacles */}
      {wasteBins.map((bin, i) => (
        <WasteBinItem key={'bin-' + i} position={bin.p} rotation={bin.r} />
      ))}

      {/* 5. Modern Architectural Lighting Masts */}
      {lamps.map((lamp, i) => (
        <ModernLightingMast
          key={'lamp-' + i}
          position={lamp.p}
          rotation={lamp.r}
          poolMat={poolMat}
          lampHeadMat={lampHead}
        />
      ))}

      {/* 6. Illuminated Pathway Bollards */}
      {bollards.map((pos, i) => (
        <BollardItem key={'bollard-' + i} position={pos} glowMat={bollardGlow} />
      ))}

      {/* 7. Tall Tropical Date Palm Trees */}
      {palms.map((palm, i) => (
        <PalmTree
          key={'palm-' + i}
          position={palm.p}
          scale={palm.s}
          rotation={palm.r}
        />
      ))}

      {/* 8. Flowering Magnolia & Cherry Blossom Trees */}
      {floweringTrees.map((tree, i) => (
        <FloweringTree
          key={'flowering-' + i}
          position={tree.p}
          scale={tree.s}
          rotation={tree.r}
          variant={tree.v}
        />
      ))}

      {/* 9. Fluted Architectural Planters */}
      {planters.map((pl, i) => (
        <ArchitecturalPlanter
          key={'planter-' + i}
          position={pl.p}
          size={pl.size}
          rotation={pl.r}
        />
      ))}

      {/* 10. Colorful Parterre Garden Flower & Shrub Beds */}
      {flowerBeds.map((fb, i) => (
        <group key={'fb-' + i} position={fb.p}>
          {/* Main Shrub Sphere */}
          <mesh position={[0, fb.s * 0.75, 0]} castShadow>
            <dodecahedronGeometry args={[fb.s, 1]} />
            <meshStandardMaterial color={fb.sc} roughness={0.88} flatShading />
          </mesh>
          {/* Flower Dots */}
          <mesh position={[fb.s * 0.45, fb.s * 1.1, fb.s * 0.2]}>
            <sphereGeometry args={[fb.s * 0.28, 8, 8]} />
            <meshStandardMaterial color={fb.fc} roughness={0.7} flatShading />
          </mesh>
          <mesh position={[-fb.s * 0.4, fb.s * 1.05, -fb.s * 0.25]}>
            <sphereGeometry args={[fb.s * 0.24, 8, 8]} />
            <meshStandardMaterial color={fb.fc} roughness={0.7} flatShading />
          </mesh>
        </group>
      ))}
    </group>
  );
}
