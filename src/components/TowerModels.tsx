'use client';
import * as THREE from 'three';
import React, { useMemo } from 'react';
import type { StoreConfig } from '@/lib/types';
import { mat, glassMat, solid, sbox } from '@/lib/materials';
import { useSignTexture } from '@/lib/signage';
import { B, OutdoorBoard, useMats } from './Building';
import { Px, DoubleDoors, V3, emiss } from './CentralBuilding';

const Plane = ({ s, p, m, r }: { s: [number, number]; p: V3; m: THREE.Material; r?: V3 }) => (
  <mesh position={p} rotation={r} material={m}><planeGeometry args={s} /></mesh>
);

// ─────────────────────────────────────────────────────────────────────────────
// 1. SKYCORE CYLINDRICAL TOWER (corp_skycore) - Ref Images 2 & 3
// Cylindrical curved glass skyscraper, stacked white horizontal circular ring balconies, spire
// ─────────────────────────────────────────────────────────────────────────────
export function SkyCoreTowerModel({ cfg, quality = true }: { cfg: StoreConfig; quality?: boolean }) {
  const mats = useMats(cfg);
  const tex = useSignTexture(cfg.name, cfg.theme, 'panel', cfg.logoUrl);
  const face = useMemo(() => new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: '#ffffff', emissiveIntensity: cfg.lights ? 1.6 : 0.2 }), [tex, cfg.lights]);
  const whiteFrame = useMemo(() => mat('concrete', '#ffffff'), []);
  const ledAccent = useMemo(() => new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: cfg.theme || '#0284c7', emissiveIntensity: 2.2 }), [cfg.theme]);

  const R = 3.8, H = 23.0;

  return (
    <group>
      {/* Plinth */}
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[R + 1.2, R + 1.2, 0.3, 32]} />
        <primitive object={mats.floor} attach="material" />
      </mesh>

      {/* Main Cylindrical Glass Curtain Wall Tower */}
      <mesh position={[0, H / 2 + 0.15, 0]}>
        <cylinderGeometry args={[R, R, H, 32]} />
        <primitive object={cfg.lights ? mats.glow : mats.glass} attach="material" />
      </mesh>

      {/* Stacked White Horizontal Circular Ring Balconies / Louvers at each floor */}
      {[0.2, 4.0, 7.8, 11.6, 15.4, 19.2, 23.0].map((y, idx) => (
        <group key={idx} position={[0, y + 0.15, 0]}>
          <mesh>
            <cylinderGeometry args={[R + 0.35, R + 0.35, 0.22, 32]} />
            <primitive object={whiteFrame} attach="material" />
          </mesh>
          <mesh position={[0, 0.12, 0]}>
            <cylinderGeometry args={[R + 0.36, R + 0.36, 0.04, 32]} />
            <primitive object={ledAccent} attach="material" />
          </mesh>
        </group>
      ))}

      {/* Ground Floor Entrance Pavilion with Revolving / Double Doors */}
      <group position={[0, 0.15, R - 0.2]}>
        <DoubleDoors p={[0, 0, 0.4]} glass={mats.glass} alu={mats.alu} />
      </group>

      {/* High Corporate Billboard Panel on Front Curve */}
      <group position={[0, H - 3.2, R + 0.12]}>
        <B s={[4.6, 1.3, 0.2]} p={[0, 0, 0]} m={solid('dark')} />
        <Plane s={[4.3, 1.15]} p={[0, 0, 0.12]} m={face} />
      </group>

      {/* Circular Penthouse Disc & Needle Spire */}
      <group position={[0, H + 0.25, 0]}>
        <mesh position={[0, 0.4, 0]}>
          <cylinderGeometry args={[R * 0.75, R * 0.85, 0.8, 24]} />
          <primitive object={whiteFrame} attach="material" />
        </mesh>
        {/* Communications Needle Spire */}
        <mesh position={[0, 3.2, 0]}>
          <cylinderGeometry args={[0.04, 0.12, 5.2, 12]} />
          <primitive object={solid('steel')} attach="material" />
        </mesh>
        <mesh position={[0, 5.8, 0]}>
          <sphereGeometry args={[0.1, 12, 8]} />
          <primitive object={ledAccent} attach="material" />
        </mesh>
      </group>

      <OutdoorBoard pos={[-3.8, 0, 4.8]} name={cfg.name} tagline={cfg.tagline} theme={cfg.theme} logoUrl={cfg.logoUrl} baseMat={mats.trim} rot={0.1} />
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. PRIMEHUB CORPORATE HQ (corp_prime) - Ref Image 2
// Tall asymmetrical skyscraper, massive vertical white shear pylons, central blue curtain wall
// ─────────────────────────────────────────────────────────────────────────────
export function PrimeHubTowerModel({ cfg, quality = true }: { cfg: StoreConfig; quality?: boolean }) {
  const mats = useMats(cfg);
  const tex = useSignTexture(cfg.name, cfg.theme, 'panel', cfg.logoUrl);
  const face = useMemo(() => new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: '#ffffff', emissiveIntensity: cfg.lights ? 1.6 : 0.2 }), [tex, cfg.lights]);
  const whitePylon = useMemo(() => mat('concrete', '#ffffff'), []);
  const ledAccent = useMemo(() => new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: cfg.theme || '#6366f1', emissiveIntensity: 2.2 }), [cfg.theme]);

  const W = 9.6, D = 7.8, H = 25.0;

  return (
    <group>
      {/* Plinth */}
      <B s={[W + 0.6, 0.3, D + 0.6]} p={[0, 0.15, 0]} m={mats.floor} />

      {/* Central Blue Curtain Wall Core */}
      <B s={[5.8, H - 1.0, D - 0.4]} p={[0, (H - 1.0) / 2 + 0.15, 0]} m={cfg.lights ? mats.glow : mats.glass} />

      {/* Left Massive Vertical White Shear Pylon */}
      <B s={[2.2, H, D + 0.2]} p={[-W / 2 + 1.1, H / 2 + 0.15, 0]} m={whitePylon} />

      {/* Right Stepped Vertical White Shear Pylon */}
      <B s={[2.2, H - 2.8, D + 0.2]} p={[W / 2 - 1.1, (H - 2.8) / 2 + 0.15, 0]} m={whitePylon} />

      {/* Floor Plate Divider Bands */}
      {[4, 8, 12, 16, 20].map(y => (
        <B key={y} s={[6.0, 0.18, 0.15]} p={[0, y, D / 2 - 0.1]} m={whitePylon} />
      ))}

      {/* Projecting Ground Lobby Cube */}
      <group position={[0, 0.15, D / 2 + 0.2]}>
        <B s={[4.8, 3.6, 1.2]} p={[0, 1.8, 0]} m={whitePylon} />
        <Plane s={[4.2, 3.0]} p={[0, 1.8, 0.62]} m={mats.glass} />
        <DoubleDoors p={[0, 0, 0.6]} glass={mats.glass} alu={mats.alu} />
      </group>

      {/* High Corporate Billboard Signboard */}
      <group position={[0, H - 4.2, D / 2 + 0.05]}>
        <B s={[5.4, 1.5, 0.2]} p={[0, 0, 0]} m={solid('dark')} />
        <Plane s={[5.0, 1.3]} p={[0, 0, 0.12]} m={face} />
      </group>

      {/* Rooftop Mechanical Penthouse & Spire */}
      <group position={[0, H - 0.8, 0]}>
        <B s={[3.8, 2.2, 4.2]} p={[-0.4, 1.1, 0]} m={solid('steel')} />
        <mesh position={[-0.4, 4.2, 0]}>
          <cylinderGeometry args={[0.04, 0.12, 4.5, 8]} />
          <primitive object={solid('steel')} attach="material" />
        </mesh>
        <mesh position={[-0.4, 6.5, 0]}>
          <sphereGeometry args={[0.08, 8, 8]} />
          <primitive object={ledAccent} attach="material" />
        </mesh>
      </group>

      <OutdoorBoard pos={[-3.8, 0, D / 2 + 1.4]} name={cfg.name} tagline={cfg.tagline} theme={cfg.theme} logoUrl={cfg.logoUrl} baseMat={mats.trim} rot={0.1} />
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. FUSIONTECH PORTAL TOWER (corp_portal) - Ref Image 2
// Monumental white square arch portal frame enclosing high-rise curtain tower
// ─────────────────────────────────────────────────────────────────────────────
export function FusionTechTowerModel({ cfg, quality = true }: { cfg: StoreConfig; quality?: boolean }) {
  const mats = useMats(cfg);
  const tex = useSignTexture(cfg.name, cfg.theme, 'box', cfg.logoUrl);
  const face = useMemo(() => new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: '#ffffff', emissiveIntensity: cfg.lights ? 1.6 : 0.2 }), [tex, cfg.lights]);
  const portalWhite = useMemo(() => mat('concrete', '#ffffff'), []);
  const ledAccent = useMemo(() => new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: cfg.theme || '#0d9488', emissiveIntensity: 2.2 }), [cfg.theme]);

  const W = 9.6, D = 7.8, H = 24.0;

  return (
    <group>
      {/* Plinth */}
      <B s={[W + 0.6, 0.3, D + 0.6]} p={[0, 0.15, 0]} m={mats.floor} />

      {/* Inner Recessed Curtain Wall Skyscraper */}
      <B s={[W - 2.8, H - 2.0, D - 1.2]} p={[0, (H - 2.0) / 2 + 0.15, 0]} m={cfg.lights ? mats.glow : mats.glass} />

      {/* MONUMENTAL PORTAL ARCH FRAME (Surrounding the Tower) */}
      <group position={[0, 0.15, 0]}>
        {/* Left Portal Column */}
        <B s={[1.6, H, D + 0.4]} p={[-W / 2 + 0.8, H / 2, 0]} m={portalWhite} />
        {/* Right Portal Column */}
        <B s={[1.6, H, D + 0.4]} p={[W / 2 - 0.8, H / 2, 0]} m={portalWhite} />
        {/* Top Bridging Portal Beam */}
        <B s={[W, 2.0, D + 0.4]} p={[0, H - 1.0, 0]} m={portalWhite} />
        {/* Glowing LED Trim along inner portal edge */}
        <Px s={[W - 1.6, 0.08, 0.08]} p={[0, H - 2.0, D / 2 + 0.2]} m={ledAccent} />
      </group>

      {/* High Cantilevered Corporate Billboard Box suspended near top */}
      <group position={[0, H - 4.8, D / 2 + 0.4]}>
        <B s={[6.2, 1.6, 0.4]} p={[0, 0, 0]} m={solid('dark')} />
        <Plane s={[5.8, 1.4]} p={[0, 0, 0.22]} m={face} />
      </group>

      {/* Ground Floor Glass Entrance Lobby */}
      <group position={[0, 0.15, D / 2 - 0.4]}>
        <Plane s={[5.2, 3.4]} p={[0, 1.7, 0.02]} m={mats.glass} />
        <DoubleDoors p={[0, 0, 0]} glass={mats.glass} alu={mats.alu} />
      </group>

      <OutdoorBoard pos={[-3.8, 0, D / 2 + 1.4]} name={cfg.name} tagline={cfg.tagline} theme={cfg.theme} logoUrl={cfg.logoUrl} baseMat={mats.trim} rot={0.1} />
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. GLOBAL BANK MONOLITH (corp_monolith) - Ref Image 3
// Massive solid stone side towers framing monolithic blue glass curtain, top colonnade terrace
// ─────────────────────────────────────────────────────────────────────────────
export function GlobalMonolithModel({ cfg, quality = true }: { cfg: StoreConfig; quality?: boolean }) {
  const mats = useMats(cfg);
  const tex = useSignTexture(cfg.name, cfg.theme, 'box', cfg.logoUrl);
  const face = useMemo(() => new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: '#ffffff', emissiveIntensity: cfg.lights ? 1.6 : 0.2 }), [tex, cfg.lights]);
  const stoneWall = useMemo(() => mat('stone', '#f1f5f9'), []);

  const W = 9.8, D = 8.0, H = 25.0;

  return (
    <group>
      {/* Plinth */}
      <B s={[W + 0.6, 0.4, D + 0.6]} p={[0, 0.2, 0]} m={mats.floor} />

      {/* Left Massive Stone Shear Tower */}
      <group position={[-W / 2 + 1.2, 0.2, 0]}>
        <B s={[2.4, H, D]} p={[0, H / 2, 0]} m={stoneWall} />
        {/* Vertical ribbon slit windows */}
        {[6, 11, 16, 21].map(y => (
          <B key={y} s={[0.6, 2.2, 0.1]} p={[0, y, D / 2 + 0.02]} m={mats.glass} />
        ))}
      </group>

      {/* Right Massive Stone Shear Tower */}
      <group position={[W / 2 - 1.2, 0.2, 0]}>
        <B s={[2.4, H, D]} p={[0, H / 2, 0]} m={stoneWall} />
        {[6, 11, 16, 21].map(y => (
          <B key={y} s={[0.6, 2.2, 0.1]} p={[0, y, D / 2 + 0.02]} m={mats.glass} />
        ))}
      </group>

      {/* Central Monolithic Blue Glass Curtain Core */}
      <group position={[0, 0.2, 0]}>
        <B s={[5.0, H - 3.8, D - 0.4]} p={[0, (H - 3.8) / 2, 0]} m={cfg.lights ? mats.glow : mats.glass} />
      </group>

      {/* Top Executive Colonnade Terrace (Level H-3.8 to H) */}
      <group position={[0, H - 3.6, 0]}>
        {/* Colonnade Columns */}
        {[-1.6, -0.5, 0.5, 1.6].map(cx => (
          <B key={cx} s={[0.3, 3.2, 0.3]} p={[cx, 1.6, D / 2 - 0.4]} m={stoneWall} />
        ))}
        {/* Recessed glass executive suite */}
        <Plane s={[4.8, 3.0]} p={[0, 1.6, D / 2 - 1.2]} m={cfg.lights ? mats.glow : mats.glass} />
        {/* Massive cantilevered cornice roof slab */}
        <B s={[W + 0.4, 0.8, D + 0.4]} p={[0, 3.6, 0]} m={stoneWall} />
      </group>

      {/* High Bank Emblem Crest & Signboard */}
      <group position={[0, H - 6.2, D / 2 + 0.12]}>
        <B s={[4.6, 1.4, 0.2]} p={[0, 0, 0]} m={solid('dark')} />
        <Plane s={[4.2, 1.2]} p={[0, 0, 0.12]} m={face} />
      </group>

      {/* Ground Floor Entrance */}
      <DoubleDoors p={[0, 0.2, D / 2 - 0.1]} glass={mats.glass} alu={mats.alu} />

      <OutdoorBoard pos={[-3.8, 0, D / 2 + 1.4]} name={cfg.name} tagline={cfg.tagline} theme={cfg.theme} logoUrl={cfg.logoUrl} baseMat={mats.trim} rot={0.1} />
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. METROCORP STEPPED SKYSCRAPER (land_stepped) - Ref Image 2
// Art-deco inspired stepped ziggurat skyscraper with 4 tiered setbacks, pinnacle spire
// ─────────────────────────────────────────────────────────────────────────────
export function MetroCorpTowerModel({ cfg, quality = true }: { cfg: StoreConfig; quality?: boolean }) {
  const mats = useMats(cfg);
  const tex = useSignTexture(cfg.name, cfg.theme, 'panel', cfg.logoUrl);
  const face = useMemo(() => new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: '#ffffff', emissiveIntensity: cfg.lights ? 1.6 : 0.2 }), [tex, cfg.lights]);
  const whiteDeco = useMemo(() => mat('concrete', '#ffffff'), []);
  const ledAccent = useMemo(() => new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: cfg.theme || '#0284c7', emissiveIntensity: 2.2 }), [cfg.theme]);

  return (
    <group>
      {/* Plinth */}
      <B s={[10.4, 0.4, 8.6]} p={[0, 0.2, 0]} m={mats.floor} />

      {/* Tier 1 (Base): w: 9.6, h: 7.5, d: 7.8 */}
      <B s={[9.6, 7.5, 7.8]} p={[0, 3.95, 0]} m={whiteDeco} />
      <Plane s={[7.6, 5.8]} p={[0, 4.0, 3.92]} m={cfg.lights ? mats.glow : mats.glass} />
      <DoubleDoors p={[0, 0.2, 3.92]} glass={mats.glass} alu={mats.alu} />

      {/* Tier 2 (Setback 1): w: 7.8, h: 6.5, d: 6.4 */}
      <B s={[7.8, 6.5, 6.4]} p={[0, 10.95, 0]} m={whiteDeco} />
      <Plane s={[6.2, 5.2]} p={[0, 11.0, 3.22]} m={cfg.lights ? mats.glow : mats.glass} />

      {/* Tier 3 (Setback 2): w: 5.8, h: 6.0, d: 5.0 */}
      <B s={[5.8, 6.0, 5.0]} p={[0, 17.2, 0]} m={whiteDeco} />
      <Plane s={[4.6, 4.8]} p={[0, 17.2, 2.52]} m={cfg.lights ? mats.glow : mats.glass} />
      {/* Prominent corporate shield billboard on Tier 3 */}
      <group position={[0, 17.2, 2.65]}>
        <B s={[4.2, 1.4, 0.2]} p={[0, 0, 0]} m={solid('dark')} />
        <Plane s={[3.9, 1.2]} p={[0, 0, 0.12]} m={face} />
      </group>

      {/* Tier 4 (Pinnacle Setback): w: 3.8, h: 4.5, d: 3.6 */}
      <B s={[3.8, 4.5, 3.6]} p={[0, 22.45, 0]} m={whiteDeco} />

      {/* Pyramidal Finial Crown & Tower Spire */}
      <group position={[0, 24.7, 0]}>
        <mesh position={[0, 1.2, 0]}>
          <coneGeometry args={[1.6, 2.4, 4]} />
          <primitive object={whiteDeco} attach="material" />
        </mesh>
        {/* Needle Spire */}
        <mesh position={[0, 4.2, 0]}>
          <cylinderGeometry args={[0.04, 0.1, 4.2, 8]} />
          <primitive object={solid('steel')} attach="material" />
        </mesh>
        <mesh position={[0, 6.4, 0]}>
          <sphereGeometry args={[0.1, 8, 8]} />
          <primitive object={ledAccent} attach="material" />
        </mesh>
      </group>

      <OutdoorBoard pos={[-3.8, 0, 4.8]} name={cfg.name} tagline={cfg.tagline} theme={cfg.theme} logoUrl={cfg.logoUrl} baseMat={mats.trim} rot={0.1} />
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. INNOPARK CANTILEVERED CUBES (land_cubes) - Ref Image 2
// Modular high-tech stacked cantilevered white boxes extending outwards at alternating levels
// ─────────────────────────────────────────────────────────────────────────────
export function InnoParkCubesModel({ cfg, quality = true }: { cfg: StoreConfig; quality?: boolean }) {
  const mats = useMats(cfg);
  const tex = useSignTexture(cfg.name, cfg.theme, 'box', cfg.logoUrl);
  const face = useMemo(() => new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: '#ffffff', emissiveIntensity: cfg.lights ? 1.6 : 0.2 }), [tex, cfg.lights]);
  const whiteCube = useMemo(() => mat('concrete', '#ffffff'), []);
  const yellowAccent = useMemo(() => new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: cfg.theme || '#eab308', emissiveIntensity: 2.2 }), [cfg.theme]);

  const H = 24.0;

  return (
    <group>
      {/* Plinth */}
      <B s={[10.2, 0.4, 8.4]} p={[0, 0.2, 0]} m={mats.floor} />

      {/* Central Core */}
      <B s={[6.4, H, 6.0]} p={[0, H / 2 + 0.2, 0]} m={cfg.lights ? mats.glow : mats.glass} />

      {/* Ground Lobby */}
      <group position={[0, 0.2, 0]}>
        <B s={[7.8, 3.8, 7.2]} p={[0, 1.9, 0]} m={whiteCube} />
        <Plane s={[5.8, 3.2]} p={[0, 1.9, 3.62]} m={mats.glass} />
        <DoubleDoors p={[0, 0, 3.62]} glass={mats.glass} alu={mats.alu} />
      </group>

      {/* Cantilever Box 1 (Level 2 - Projects Left by 1.6m) */}
      <group position={[-1.4, 5.8, 0]}>
        <B s={[6.8, 4.0, 7.2]} p={[0, 0, 0]} m={whiteCube} />
        <Plane s={[5.6, 3.2]} p={[0, 0, 3.62]} m={cfg.lights ? mats.glow : mats.glass} />
      </group>

      {/* Cantilever Box 2 (Level 4 - Projects Right by 1.6m) */}
      <group position={[1.4, 13.8, 0]}>
        <B s={[6.8, 4.0, 7.2]} p={[0, 0, 0]} m={whiteCube} />
        <Plane s={[5.6, 3.2]} p={[0, 0, 3.62]} m={cfg.lights ? mats.glow : mats.glass} />
        {/* Integrated Branding Signboard */}
        <Plane s={[4.2, 1.2]} p={[-0.4, 0, 3.65]} m={face} />
      </group>

      {/* Cantilever Box 3 (Level 6 - Projects Forward) */}
      <group position={[0, 21.0, 0.8]}>
        <B s={[7.2, 3.6, 6.4]} p={[0, 0, 0]} m={whiteCube} />
        <Plane s={[6.0, 2.8]} p={[0, 0, 3.22]} m={cfg.lights ? mats.glow : mats.glass} />
      </group>

      {/* Rooftop Garden Terrace */}
      <group position={[0, H + 0.2, 0]}>
        <B s={[7.4, 0.3, 6.6]} p={[0, 0.15, 0.8]} m={mats.trim} />
        <mesh position={[1.8, 0.6, 1.8]} material={solid('foliage')} castShadow>
          <sphereGeometry args={[0.45, 8, 8]} />
        </mesh>
      </group>

      <OutdoorBoard pos={[-3.8, 0, 4.6]} name={cfg.name} tagline={cfg.tagline} theme={cfg.theme} logoUrl={cfg.logoUrl} baseMat={mats.trim} rot={0.1} />
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. NOVAVISTA SAIL ARC TOWER (land_arc) - Ref Image 2
// Sweeping curved aerodynamic white arch silhouette sloping down one side, curved blue glass
// ─────────────────────────────────────────────────────────────────────────────
export function NovaVistaArcModel({ cfg, quality = true }: { cfg: StoreConfig; quality?: boolean }) {
  const mats = useMats(cfg);
  const tex = useSignTexture(cfg.name, cfg.theme, 'panel', cfg.logoUrl);
  const face = useMemo(() => new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: '#ffffff', emissiveIntensity: cfg.lights ? 1.6 : 0.2 }), [tex, cfg.lights]);
  const arcWhite = useMemo(() => mat('concrete', '#ffffff'), []);
  const ledAccent = useMemo(() => new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: cfg.theme || '#06b6d4', emissiveIntensity: 2.2 }), [cfg.theme]);

  const W = 9.6, D = 7.8, H = 24.0;

  // Sweeping Arch Shape
  const arcGeo = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-W / 2, 0);
    s.lineTo(-W / 2, H);
    // Smooth bezier curve sloping down to the right
    s.bezierCurveTo(-W / 2 + 1.5, H + 0.8, W / 2 - 1.0, H * 0.85, W / 2, H * 0.45);
    s.lineTo(W / 2, 0);
    s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: D, bevelEnabled: false });
    g.translate(0, 0, -D / 2);
    return g;
  }, [W, D, H]);

  return (
    <group>
      {/* Plinth */}
      <B s={[W + 0.6, 0.3, D + 0.6]} p={[0, 0.15, 0]} m={mats.floor} />

      {/* Sweeping Architectural Sail Arch Body */}
      <mesh geometry={arcGeo} position={[0, 0.15, 0]}>
        <primitive object={arcWhite} attach="material" />
      </mesh>

      {/* Front Curved Glass Curtain Wall Overlay */}
      <mesh position={[-0.3, 0.15, D / 2 + 0.05]}>
        <planeGeometry args={[W - 2.0, H * 0.75]} />
        <primitive object={cfg.lights ? mats.glow : mats.glass} attach="material" />
      </mesh>

      {/* Ground Lobby */}
      <group position={[-1.2, 0.15, D / 2 + 0.1]}>
        <DoubleDoors p={[0, 0, 0]} glass={mats.glass} alu={mats.alu} />
      </group>

      {/* Large Curved Corporate Logo & Signboard */}
      <group position={[1.2, H * 0.45, D / 2 + 0.12]}>
        <B s={[4.6, 1.4, 0.2]} p={[0, 0, 0]} m={solid('dark')} />
        <Plane s={[4.2, 1.2]} p={[0, 0, 0.12]} m={face} />
      </group>

      {/* Rooftop Apex Communications Needle */}
      <mesh position={[-W / 2 + 0.8, H + 2.5, 0]}>
        <cylinderGeometry args={[0.04, 0.1, 4.5, 8]} />
        <primitive object={solid('steel')} attach="material" />
      </mesh>
      <mesh position={[-W / 2 + 0.8, H + 4.8, 0]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <primitive object={ledAccent} attach="material" />
      </mesh>

      <OutdoorBoard pos={[-3.8, 0, D / 2 + 1.4]} name={cfg.name} tagline={cfg.tagline} theme={cfg.theme} logoUrl={cfg.logoUrl} baseMat={mats.trim} rot={0.1} />
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. VERTEX PYRAMID TOWER (land_apex) - Ref Image 2
// Slender vertical skyscraper topped with blue pyramid hip roof & communications spire
// ─────────────────────────────────────────────────────────────────────────────
export function VertexApexModel({ cfg, quality = true }: { cfg: StoreConfig; quality?: boolean }) {
  const mats = useMats(cfg);
  const tex = useSignTexture(cfg.name, cfg.theme, 'box', cfg.logoUrl);
  const face = useMemo(() => new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: '#ffffff', emissiveIntensity: cfg.lights ? 1.6 : 0.2 }), [tex, cfg.lights]);
  const whiteShaft = useMemo(() => mat('concrete', '#f8fafc'), []);
  const pyramidBlue = useMemo(() => new THREE.MeshStandardMaterial({ color: cfg.theme || '#2563eb', roughness: 0.3 }), [cfg.theme]);

  const W = 9.6, D = 7.8, H = 22.0;

  return (
    <group>
      {/* Plinth */}
      <B s={[W + 0.6, 0.3, D + 0.6]} p={[0, 0.15, 0]} m={mats.floor} />

      {/* Main Slender Vertical Shaft with Strong Corner Columns */}
      <B s={[W, H, D]} p={[0, H / 2 + 0.15, 0]} m={whiteShaft} />

      {/* Recessed Central Blue Glass Curtain Wall */}
      <group position={[0, 0.15, D / 2 + 0.04]}>
        <Plane s={[5.8, H - 3.0]} p={[0, (H - 3.0) / 2, 0]} m={cfg.lights ? mats.glow : mats.glass} />
        {/* Floor divides */}
        {[4, 8, 12, 16].map(y => (
          <B key={y} s={[6.0, 0.18, 0.1]} p={[0, y, 0.05]} m={mats.trim} />
        ))}
      </group>

      {/* Striking Blue Pyramidal Hip Roof Crown */}
      <group position={[0, H + 0.15, 0]}>
        {/* Cornice plinth */}
        <B s={[W + 0.4, 0.6, D + 0.4]} p={[0, 0.3, 0]} m={whiteShaft} />
        {/* 4-sided Pyramid */}
        <mesh position={[0, 2.8, 0]}>
          <coneGeometry args={[5.2, 4.4, 4]} />
          <primitive object={pyramidBlue} attach="material" />
        </mesh>
        {/* Communications Spire */}
        <mesh position={[0, 6.4, 0]}>
          <cylinderGeometry args={[0.04, 0.12, 4.2, 8]} />
          <primitive object={solid('steel')} attach="material" />
        </mesh>
      </group>

      {/* High-Mount Corporate Signboard */}
      <group position={[0, H - 2.8, D / 2 + 0.14]}>
        <B s={[5.4, 1.4, 0.2]} p={[0, 0, 0]} m={solid('dark')} />
        <Plane s={[5.0, 1.2]} p={[0, 0, 0.12]} m={face} />
      </group>

      {/* Ground Floor Arched Entrance */}
      <DoubleDoors p={[0, 0.15, D / 2 + 0.04]} glass={mats.glass} alu={mats.alu} />

      <OutdoorBoard pos={[-3.8, 0, D / 2 + 1.4]} name={cfg.name} tagline={cfg.tagline} theme={cfg.theme} logoUrl={cfg.logoUrl} baseMat={mats.trim} rot={0.1} />
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. GLOBALTECH SLANTED TOWER (glass_slanted) - Ref Images 2 & 3
// Sharp angular 45° slanted glass roofline with triangular peak frame
// ─────────────────────────────────────────────────────────────────────────────
export function GlobalTechSlantedModel({ cfg, quality = true }: { cfg: StoreConfig; quality?: boolean }) {
  const mats = useMats(cfg);
  const tex = useSignTexture(cfg.name, cfg.theme, 'panel', cfg.logoUrl);
  const face = useMemo(() => new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: '#ffffff', emissiveIntensity: cfg.lights ? 1.6 : 0.2 }), [tex, cfg.lights]);
  const whitePylon = useMemo(() => mat('concrete', '#ffffff'), []);
  const ledAccent = useMemo(() => new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: cfg.theme || '#0284c7', emissiveIntensity: 2.2 }), [cfg.theme]);

  const W = 9.6, D = 7.8, H = 22.0;

  // Slanted Prism Top Geometry
  const slantGeo = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-W / 2, 0);
    s.lineTo(-W / 2, 0.5);
    s.lineTo(W / 2, 7.5);
    s.lineTo(W / 2, 0);
    s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: D, bevelEnabled: false });
    g.translate(0, 0, -D / 2);
    return g;
  }, [W, D]);

  return (
    <group>
      {/* Plinth */}
      <B s={[W + 0.6, 0.3, D + 0.6]} p={[0, 0.15, 0]} m={mats.floor} />

      {/* Main Structural Mass */}
      <B s={[W, H, D]} p={[0, H / 2 + 0.15, 0]} m={whitePylon} />

      {/* Central Blue Glass Curtain Wall */}
      <mesh position={[0, (H - 2.0) / 2 + 0.15, D / 2 + 0.04]}>
        <planeGeometry args={[W - 2.4, H - 2.0]} />
        <primitive object={cfg.lights ? mats.glow : mats.glass} attach="material" />
      </mesh>

      {/* DRAMATIC SHARP 45° SLANTED ROOF (Sloping to Acute Right Peak) */}
      <mesh geometry={slantGeo} position={[0, H + 0.15, 0]}>
        <primitive object={cfg.lights ? mats.glow : mats.glass} attach="material" />
      </mesh>
      {/* White Triangular Truss Edge Frame */}
      <mesh position={[0, H + 4.0, D / 2 + 0.06]} rotation={[0, 0, 0.65]}>
        <boxGeometry args={[12.2, 0.25, 0.3]} />
        <primitive object={whitePylon} attach="material" />
      </mesh>

      {/* High-Impact Corporate Billboard Signboard */}
      <group position={[0, H - 2.8, D / 2 + 0.12]}>
        <B s={[6.4, 1.6, 0.2]} p={[0, 0, 0]} m={solid('dark')} />
        <Plane s={[6.0, 1.4]} p={[0, 0, 0.12]} m={face} />
      </group>

      {/* Ground Lobby */}
      <DoubleDoors p={[0, 0.15, D / 2 + 0.04]} glass={mats.glass} alu={mats.alu} />

      <OutdoorBoard pos={[-3.8, 0, D / 2 + 1.4]} name={cfg.name} tagline={cfg.tagline} theme={cfg.theme} logoUrl={cfg.logoUrl} baseMat={mats.trim} rot={0.1} />
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 10. ZENITH GEOMETRIC CROWN (glass_zenith) - Ref Image 2
// Open geometric triangular apex frame, stepped upper executive terrace
// ─────────────────────────────────────────────────────────────────────────────
export function ZenithCrownModel({ cfg, quality = true }: { cfg: StoreConfig; quality?: boolean }) {
  const mats = useMats(cfg);
  const tex = useSignTexture(cfg.name, cfg.theme, 'box', cfg.logoUrl);
  const face = useMemo(() => new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: '#ffffff', emissiveIntensity: cfg.lights ? 1.6 : 0.2 }), [tex, cfg.lights]);
  const whiteTruss = useMemo(() => mat('concrete', '#ffffff'), []);
  const ledAccent = useMemo(() => new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: cfg.theme || '#0f766e', emissiveIntensity: 2.2 }), [cfg.theme]);

  const W = 9.6, D = 7.8, H = 21.0;

  return (
    <group>
      {/* Plinth */}
      <B s={[W + 0.6, 0.3, D + 0.6]} p={[0, 0.15, 0]} m={mats.floor} />

      {/* Tower Body */}
      <B s={[W, H, D]} p={[0, H / 2 + 0.15, 0]} m={whiteTruss} />
      <Plane s={[W - 2.4, H - 2.0]} p={[0, (H - 2.0) / 2 + 0.15, D / 2 + 0.04]} m={cfg.lights ? mats.glow : mats.glass} />

      {/* Stepped Upper Executive Terrace */}
      <group position={[0, H - 3.2, D / 2 - 0.8]}>
        <B s={[W - 2.8, 0.2, 1.6]} p={[0, 0, 0.8]} m={mats.floor} />
        <Plane s={[W - 2.8, 0.9]} p={[0, 0.5, 1.6]} m={mats.glass} />
      </group>

      {/* OPEN GEOMETRIC TRIANGULAR APEX CROWN */}
      <group position={[0, H + 0.15, 0]}>
        {/* Left sloping strut */}
        <mesh position={[-2.4, 3.2, 0]} rotation={[0, 0, -0.65]}>
          <boxGeometry args={[0.35, 7.8, 0.4]} />
          <primitive object={whiteTruss} attach="material" />
        </mesh>
        {/* Right sloping strut */}
        <mesh position={[2.4, 3.2, 0]} rotation={[0, 0, 0.65]}>
          <boxGeometry args={[0.35, 7.8, 0.4]} />
          <primitive object={whiteTruss} attach="material" />
        </mesh>
        {/* Top Apex Node */}
        <mesh position={[0, 6.2, 0]}>
          <sphereGeometry args={[0.3, 12, 8]} />
          <primitive object={ledAccent} attach="material" />
        </mesh>
      </group>

      {/* Corporate Signboard */}
      <group position={[0, H - 5.4, D / 2 + 0.12]}>
        <B s={[5.4, 1.4, 0.2]} p={[0, 0, 0]} m={solid('dark')} />
        <Plane s={[5.0, 1.2]} p={[0, 0, 0.12]} m={face} />
      </group>

      <DoubleDoors p={[0, 0.15, D / 2 + 0.04]} glass={mats.glass} alu={mats.alu} />
      <OutdoorBoard pos={[-3.8, 0, D / 2 + 1.4]} name={cfg.name} tagline={cfg.tagline} theme={cfg.theme} logoUrl={cfg.logoUrl} baseMat={mats.trim} rot={0.1} />
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 11. TECHNOVA WRAP-FRAME (glass_wrap) - Ref Images 2 & 3
// White structural frame with bold L-shaped wrap-around horizontal balcony bands
// ─────────────────────────────────────────────────────────────────────────────
export function TechNovaWrapModel({ cfg, quality = true }: { cfg: StoreConfig; quality?: boolean }) {
  const mats = useMats(cfg);
  const tex = useSignTexture(cfg.name, cfg.theme, 'panel', cfg.logoUrl);
  const face = useMemo(() => new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: '#ffffff', emissiveIntensity: cfg.lights ? 1.6 : 0.2 }), [tex, cfg.lights]);
  const whiteWrap = useMemo(() => mat('concrete', '#ffffff'), []);
  const ledAccent = useMemo(() => new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: cfg.theme || '#0284c7', emissiveIntensity: 2.2 }), [cfg.theme]);

  const W = 9.6, D = 7.8, H = 24.0;

  return (
    <group>
      {/* Plinth */}
      <B s={[W + 0.6, 0.3, D + 0.6]} p={[0, 0.15, 0]} m={mats.floor} />

      {/* Core Blue Glass Curtain Skyscraper */}
      <B s={[W - 0.8, H, D - 0.8]} p={[0, H / 2 + 0.15, 0]} m={cfg.lights ? mats.glow : mats.glass} />

      {/* BOLD L-SHAPED WRAP-AROUND HORIZONTAL CANTILEVER BANDS */}
      {/* Band 1 at Floor 2 */}
      <group position={[-1.2, 7.5, 0]}>
        <B s={[W, 1.2, D + 0.3]} p={[0, 0, 0]} m={whiteWrap} />
        <Px s={[W, 0.08, 0.08]} p={[0, 0.62, (D + 0.3) / 2]} m={ledAccent} />
      </group>

      {/* Band 2 at Floor 4 */}
      <group position={[1.2, 15.5, 0]}>
        <B s={[W, 1.2, D + 0.3]} p={[0, 0, 0]} m={whiteWrap} />
        <Px s={[W, 0.08, 0.08]} p={[0, 0.62, (D + 0.3) / 2]} m={ledAccent} />
      </group>

      {/* Projecting Ground Lobby with Glass Canopy */}
      <group position={[0, 0.15, D / 2 + 0.2]}>
        <B s={[5.8, 3.8, 1.4]} p={[0, 1.9, 0]} m={whiteWrap} />
        <DoubleDoors p={[0, 0, 0.7]} glass={mats.glass} alu={mats.alu} />
      </group>

      {/* High Corporate Billboard Panel */}
      <group position={[0, H - 3.2, D / 2 + 0.12]}>
        <B s={[6.4, 1.6, 0.2]} p={[0, 0, 0]} m={solid('dark')} />
        <Plane s={[6.0, 1.4]} p={[0, 0, 0.12]} m={face} />
      </group>

      {/* Rooftop Penthouse & Communications Spire */}
      <group position={[0, H + 0.15, 0]}>
        <B s={[4.6, 1.6, 4.2]} p={[0, 0.8, 0]} m={whiteWrap} />
        <mesh position={[0, 3.8, 0]}>
          <cylinderGeometry args={[0.04, 0.12, 4.2, 8]} />
          <primitive object={solid('steel')} attach="material" />
        </mesh>
        <mesh position={[0, 6.0, 0]}>
          <sphereGeometry args={[0.08, 8, 8]} />
          <primitive object={ledAccent} attach="material" />
        </mesh>
      </group>

      <OutdoorBoard pos={[-3.8, 0, D / 2 + 1.4]} name={cfg.name} tagline={cfg.tagline} theme={cfg.theme} logoUrl={cfg.logoUrl} baseMat={mats.trim} rot={0.1} />
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 12. MEDIAHUB CYBER TOWER (glass_neon) - Ref Image 3
// Sleek obsidian tower with illuminated neon L-light pipes running vertically up the corner
// ─────────────────────────────────────────────────────────────────────────────
export function MediaHubCyberModel({ cfg, quality = true }: { cfg: StoreConfig; quality?: boolean }) {
  const mats = useMats(cfg);
  const tex = useSignTexture(cfg.name, cfg.theme, 'neon', cfg.logoUrl);
  const face = useMemo(() => new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: '#ffffff', emissiveIntensity: cfg.lights ? 1.8 : 0.2 }), [tex, cfg.lights]);
  const obsidianWall = useMemo(() => mat('concrete', '#1e293b'), []);
  const cyberNeon = useMemo(() => new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: cfg.theme || '#a855f7', emissiveIntensity: 2.8 }), [cfg.theme]);

  const W = 9.6, D = 7.8, H = 25.0;

  return (
    <group>
      {/* Plinth */}
      <B s={[W + 0.6, 0.3, D + 0.6]} p={[0, 0.15, 0]} m={mats.floor} />

      {/* Obsidian Structural Monolith */}
      <B s={[W, H, D]} p={[0, H / 2 + 0.15, 0]} m={obsidianWall} />

      {/* Central Dark Tinted Ribbon Glass Windows */}
      <Plane s={[W - 2.8, H - 2.0]} p={[0, (H - 2.0) / 2 + 0.15, D / 2 + 0.04]} m={cfg.lights ? mats.glow : mats.glass} />

      {/* CYBERNETIC NEON L-LIGHT PIPES RUNNING UP CORNER FACADE */}
      <group position={[-W / 2 + 0.3, 0.15, D / 2 + 0.08]}>
        {/* Vertical strip 1 */}
        <Px s={[0.12, H * 0.75, 0.12]} p={[0, (H * 0.75) / 2, 0]} m={cyberNeon} />
        {/* Horizontal connector strip */}
        <Px s={[3.2, 0.12, 0.12]} p={[1.6, H * 0.75, 0]} m={cyberNeon} />
      </group>

      {/* Large Digital Media Billboard Display with Glowing Accent */}
      <group position={[0, H - 5.0, D / 2 + 0.14]}>
        <B s={[6.2, 2.0, 0.2]} p={[0, 0, 0]} m={solid('dark')} />
        <Plane s={[5.8, 1.8]} p={[0, 0, 0.12]} m={face} />
        <Px s={[6.2, 0.06, 0.06]} p={[0, 1.03, 0.1]} m={cyberNeon} />
        <Px s={[6.2, 0.06, 0.06]} p={[0, -1.03, 0.1]} m={cyberNeon} />
      </group>

      {/* Ground Cyber Entrance */}
      <DoubleDoors p={[0, 0.15, D / 2 + 0.04]} glass={mats.glass} alu={mats.alu} />

      {/* Broadcasting Mast on Roof */}
      <group position={[0, H + 0.15, 0]}>
        <mesh position={[0, 3.5, 0]}>
          <cylinderGeometry args={[0.06, 0.18, 7.0, 8]} />
          <primitive object={solid('steel')} attach="material" />
        </mesh>
        {/* Pulsing Aviation Beacon */}
        <mesh position={[0, 7.1, 0]}>
          <sphereGeometry args={[0.14, 12, 8]} />
          <meshBasicMaterial color="#ef4444" />
        </mesh>
      </group>

      <OutdoorBoard pos={[-3.8, 0, D / 2 + 1.4]} name={cfg.name} tagline={cfg.tagline} theme={cfg.theme} logoUrl={cfg.logoUrl} baseMat={mats.trim} rot={0.1} />
    </group>
  );
}
