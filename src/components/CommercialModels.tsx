'use client';
import * as THREE from 'three';
import React, { useMemo } from 'react';
import type { StoreConfig } from '@/lib/types';
import { mat, glassMat, solid, sbox, stripeTex } from '@/lib/materials';
import { useSignTexture } from '@/lib/signage';
import { B, OutdoorBoard, useMats } from './Building';
import { Px, DoubleDoors, V3, emiss } from './CentralBuilding';

const Plane = ({ s, p, m, r }: { s: [number, number]; p: V3; m: THREE.Material; r?: V3 }) => (
  <mesh position={p} rotation={r} material={m}><planeGeometry args={s} /></mesh>
);

// ─────────────────────────────────────────────────────────────────────────────
// 1. CREATIVE STUDIO (comm_creative) - Ref Image 1
// Dark facade, dramatic diagonal wood timber pylon extending past roof, glass showroom
// ─────────────────────────────────────────────────────────────────────────────
export function CreativeStudioModel({ cfg, quality = true }: { cfg: StoreConfig; quality?: boolean }) {
  const mats = useMats(cfg);
  const tex = useSignTexture(cfg.name, cfg.theme, cfg.sign, cfg.logoUrl);
  const face = useMemo(() => new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: '#ffffff', emissiveIntensity: cfg.lights ? 1.5 : 0.2 }), [tex, cfg.lights]);
  const darkWall = useMemo(() => mat('concrete', cfg.tint || '#262930'), [cfg.tint]);
  const woodPylon = useMemo(() => mat('wood', '#d97706'), []);
  const ledAccent = useMemo(() => new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: cfg.theme || '#d97706', emissiveIntensity: 2.0 }), [cfg.theme]);
  const steel = solid('steel');

  const W = 9.6, D = 7.8, H = 7.6;

  return (
    <group>
      {/* Plinth */}
      <B s={[W + 0.6, 0.3, D + 0.6]} p={[0, 0.15, 0]} m={mats.floor} />

      {/* Main Dark Volume */}
      <B s={[W, H, D]} p={[0, H / 2 + 0.15, 0]} m={darkWall} />

      {/* Ground & 1st Floor Glass Showroom Curtain Wall */}
      <group position={[0.6, 0.15, D / 2 + 0.05]}>
        <Plane s={[6.8, 6.2]} p={[0, 3.1, 0.02]} m={cfg.lights ? mats.glow : mats.glass} />
        {/* Horizontal Mullions */}
        {[0.1, 3.0, 6.2].map(y => (
          <B key={y} s={[6.8, 0.1, 0.12]} p={[0, y, 0.05]} m={mats.alu} cast={false} />
        ))}
        {/* Vertical Mullions */}
        {[-3.4, -1.1, 1.1, 3.4].map(x => (
          <B key={x} s={[0.1, 6.2, 0.12]} p={[x, 3.1, 0.05]} m={mats.alu} cast={false} />
        ))}
        <DoubleDoors p={[0, 0, 0]} glass={mats.glass} alu={mats.alu} />
      </group>

      {/* Dramatic Diagonal Wood Pylon (left corner extending above roofline) */}
      <group position={[-W / 2 + 0.5, 0.15, D / 2 + 0.2]}>
        {/* Vertical base section */}
        <B s={[1.2, H + 1.8, 0.5]} p={[0, (H + 1.8) / 2, 0]} m={woodPylon} />
        {/* Angled top prow */}
        <mesh position={[0.2, H + 1.8, 0]} rotation={[0, 0, -0.45]}>
          <boxGeometry args={[1.2, 1.8, 0.5]} />
          <primitive object={woodPylon} attach="material" />
        </mesh>
        {/* Vertical timber slats texture */}
        {[-0.4, -0.15, 0.1, 0.35].map(sx => (
          <B key={sx} s={[0.06, H + 1.6, 0.08]} p={[sx, (H + 1.6) / 2, 0.28]} m={solid('dark')} cast={false} />
        ))}
      </group>

      {/* Entrance Steps & Sidewalk Planters */}
      <B s={[3.2, 0.15, 1.0]} p={[0.6, 0.075, D / 2 + 0.6]} m={mats.floor} />
      <B s={[2.8, 0.15, 0.6]} p={[0.6, 0.15, D / 2 + 0.4]} m={mats.floor} />
      <B s={[1.4, 0.55, 0.8]} p={[-3.2, 0.28, D / 2 + 0.6]} m={mats.trim} />
      <mesh position={[-3.2, 0.7, D / 2 + 0.6]} material={solid('foliage')} castShadow>
        <sphereGeometry args={[0.42, 8, 8]} />
      </mesh>

      {/* Facade Signboard & Studio Logo Medallion */}
      <group position={[1.8, H - 1.2, D / 2 + 0.12]}>
        <Plane s={[4.6, 1.0]} p={[0, 0, 0.02]} m={face} />
        <Px s={[4.6, 0.04, 0.04]} p={[0, 0.52, 0.02]} m={ledAccent} />
        {/* Circular Logo Medallion */}
        <mesh position={[-2.8, 0, 0.06]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.5, 0.5, 0.08, 24]} />
          <primitive object={woodPylon} attach="material" />
        </mesh>
      </group>

      {/* Rooftop Parapet & HVAC */}
      <B s={[W + 0.3, 0.4, D + 0.3]} p={[0, H + 0.35, 0]} m={mats.trim} />
      <B s={[W - 0.2, 0.1, D - 0.2]} p={[0, H + 0.2, 0]} m={mats.roof} />
      <B s={[1.8, 0.9, 1.4]} p={[2.2, H + 0.65, -1.2]} m={steel} />

      {/* Sidewalk Outdoor Board */}
      <OutdoorBoard pos={[-3.6, 0, D / 2 + 1.4]} name={cfg.name} tagline={cfg.tagline} theme={cfg.theme} logoUrl={cfg.logoUrl} baseMat={mats.trim} rot={0.1} />
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. HEALTHPLUS CLINIC (comm_health) - Ref Image 1
// Clean white & medical cyan facade, illuminated medical cross (+), projecting blue portico
// ─────────────────────────────────────────────────────────────────────────────
export function HealthPlusModel({ cfg, quality = true }: { cfg: StoreConfig; quality?: boolean }) {
  const mats = useMats(cfg);
  const tex = useSignTexture(cfg.name, cfg.theme, cfg.sign, cfg.logoUrl);
  const face = useMemo(() => new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: '#ffffff', emissiveIntensity: cfg.lights ? 1.5 : 0.2 }), [tex, cfg.lights]);
  const whiteWall = useMemo(() => mat('concrete', '#ffffff'), []);
  const cyanAccent = useMemo(() => new THREE.MeshStandardMaterial({ color: cfg.theme || '#0284c7', roughness: 0.3 }), [cfg.theme]);
  const crossEmblem = useMemo(() => new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: cfg.theme || '#0284c7', emissiveIntensity: cfg.lights ? 2.5 : 0.5 }), [cfg.theme, cfg.lights]);

  const W = 9.6, D = 7.8, H = 7.8;

  return (
    <group>
      {/* Plinth */}
      <B s={[W + 0.6, 0.3, D + 0.6]} p={[0, 0.15, 0]} m={mats.floor} />

      {/* Main Crisp White Mass */}
      <B s={[W, H, D]} p={[0, H / 2 + 0.15, 0]} m={whiteWall} />

      {/* Cyan Corner Architectural Wrap (Right side) */}
      <B s={[3.6, H, D + 0.05]} p={[W / 2 - 1.8, H / 2 + 0.15, 0]} m={cyanAccent} />

      {/* Distinctive 3D Illuminated Medical Cross (+) on Upper Facade */}
      <group position={[2.6, H - 1.4, D / 2 + 0.12]}>
        <B s={[0.42, 1.4, 0.1]} p={[0, 0, 0]} m={crossEmblem} />
        <B s={[1.4, 0.42, 0.1]} p={[0, 0, 0]} m={crossEmblem} />
      </group>

      {/* Cantilevered Blue Entrance Portico Canopy */}
      <group position={[-1.2, 3.4, D / 2 + 0.5]}>
        <B s={[3.8, 0.22, 1.6]} p={[0, 0, 0]} m={cyanAccent} />
        {/* Support columns */}
        <B s={[0.12, 3.4, 0.12]} p={[-1.7, -1.7, 0.65]} m={cyanAccent} />
        <B s={[0.12, 3.4, 0.12]} p={[1.7, -1.7, 0.65]} m={cyanAccent} />
        {/* Portico ceiling downlight */}
        <mesh position={[0, -0.05, 0.1]} material={mats.glow}>
          <planeGeometry args={[2.8, 0.8]} />
        </mesh>
      </group>

      {/* Ground Floor Glass Entrance */}
      <group position={[-1.2, 0.15, D / 2 + 0.04]}>
        <Plane s={[3.6, 3.1]} p={[0, 1.55, 0]} m={mats.glass} />
        <DoubleDoors p={[0, 0, 0]} glass={mats.glass} alu={mats.alu} />
      </group>

      {/* Upper Floor Ribbon Windows with Vertical Sunshades */}
      <group position={[-1.6, 5.2, D / 2 + 0.04]}>
        <Plane s={[4.8, 1.8]} p={[0, 0, 0]} m={cfg.lights ? mats.glow : mats.glass} />
        {[-2.2, -1.1, 0, 1.1, 2.2].map(x => (
          <B key={x} s={[0.08, 1.9, 0.22]} p={[x, 0, 0.1]} m={cyanAccent} cast={false} />
        ))}
      </group>

      {/* Facade Branding Signboard */}
      <Plane s={[4.6, 1.0]} p={[-1.4, 3.9, D / 2 + 0.14]} m={face} />

      {/* Planters & Entrance Steps */}
      <B s={[4.2, 0.15, 0.8]} p={[-1.2, 0.08, D / 2 + 0.8]} m={mats.floor} />
      <B s={[1.2, 0.5, 0.6]} p={[-3.8, 0.25, D / 2 + 0.5]} m={cyanAccent} />
      <mesh position={[-3.8, 0.6, D / 2 + 0.5]} material={solid('foliage')} castShadow>
        <sphereGeometry args={[0.35, 8, 8]} />
      </mesh>

      {/* Parapet Roof */}
      <B s={[W + 0.3, 0.35, D + 0.3]} p={[0, H + 0.32, 0]} m={mats.trim} />
      <OutdoorBoard pos={[-3.6, 0, D / 2 + 1.4]} name={cfg.name} tagline={cfg.tagline} theme={cfg.theme} logoUrl={cfg.logoUrl} baseMat={mats.trim} rot={0.1} />
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. FASTSHIP LOGISTICS (comm_logistics) - Ref Image 1
// Industrial commercial depot, roll-up shutter garage bay, loading dock ramp, office wing
// ─────────────────────────────────────────────────────────────────────────────
export function FastShipModel({ cfg, quality = true }: { cfg: StoreConfig; quality?: boolean }) {
  const mats = useMats(cfg);
  const tex = useSignTexture(cfg.name, cfg.theme, cfg.sign, cfg.logoUrl);
  const face = useMemo(() => new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: '#ffffff', emissiveIntensity: cfg.lights ? 1.5 : 0.2 }), [tex, cfg.lights]);
  const industrialWall = useMemo(() => mat('metal', '#475569'), []);
  const safetyYellow = useMemo(() => new THREE.MeshStandardMaterial({ color: '#eab308', roughness: 0.4 }), []);
  const darkMetal = solid('dark');

  const W = 9.8, D = 8.0, H = 6.8;

  return (
    <group>
      {/* Plinth */}
      <B s={[W + 0.6, 0.3, D + 0.6]} p={[0, 0.15, 0]} m={mats.floor} />

      {/* Industrial Warehouse Structure */}
      <B s={[W, H, D]} p={[0, H / 2 + 0.15, 0]} m={industrialWall} />

      {/* Large Corrugated Roll-Up Shutter Garage Bay (Center/Left) */}
      <group position={[-1.2, 0.15, D / 2 + 0.05]}>
        {/* Shutter Recess Frame */}
        <B s={[4.2, 4.4, 0.3]} p={[0, 2.2, -0.1]} m={darkMetal} />
        {/* Horizontal Roll-Up Shutter Slats */}
        {Array.from({ length: 14 }).map((_, i) => (
          <B key={i} s={[3.8, 0.24, 0.04]} p={[0, 0.2 + i * 0.28, 0.02]} m={solid('alu')} cast={false} />
        ))}
        {/* Vehicle Loading Ramp */}
        <mesh position={[0, -0.05, 1.2]} rotation={[-0.18, 0, 0]}>
          <boxGeometry args={[3.8, 0.2, 2.2]} />
          <primitive object={mats.floor} attach="material" />
        </mesh>
        {/* Safety Bollards */}
        {[-2.0, 2.0].map(bx => (
          <group key={bx} position={[bx, 0, 1.8]}>
            <mesh position={[0, 0.5, 0]}>
              <cylinderGeometry args={[0.08, 0.08, 1.0, 12]} />
              <primitive object={safetyYellow} attach="material" />
            </mesh>
          </group>
        ))}
      </group>

      {/* Right Office Wing Entrance & Glass Windows */}
      <group position={[3.2, 0.15, D / 2 + 0.04]}>
        <Plane s={[2.2, 3.2]} p={[0, 1.6, 0]} m={cfg.lights ? mats.glow : mats.glass} />
        <DoubleDoors p={[0, 0, 0]} glass={mats.glass} alu={mats.alu} />
        {/* Upper Office Window */}
        <Plane s={[2.2, 1.4]} p={[0, 4.2, 0]} m={cfg.lights ? mats.glow : mats.glass} />
      </group>

      {/* Bold Industrial Signboard */}
      <group position={[-0.8, H - 1.2, D / 2 + 0.12]}>
        <Plane s={[5.8, 1.1]} p={[0, 0, 0.02]} m={face} />
      </group>

      {/* Parapet Roof with Ventilation Cowls */}
      <B s={[W + 0.3, 0.4, D + 0.3]} p={[0, H + 0.35, 0]} m={mats.trim} />
      <mesh position={[-2.4, H + 0.7, -1.5]}>
        <cylinderGeometry args={[0.35, 0.45, 0.6, 12]} />
        <primitive object={solid('steel')} attach="material" />
      </mesh>
      <mesh position={[1.8, H + 0.7, -1.5]}>
        <cylinderGeometry args={[0.35, 0.45, 0.6, 12]} />
        <primitive object={solid('steel')} attach="material" />
      </mesh>

      <OutdoorBoard pos={[-3.8, 0, D / 2 + 1.4]} name={cfg.name} tagline={cfg.tagline} theme={cfg.theme} logoUrl={cfg.logoUrl} baseMat={mats.trim} rot={0.1} />
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. GREENVOLT CLEAN ENERGY (comm_solar) - Ref Image 1
// Eco commercial building, prominent tilted rooftop solar PV arrays, vibrant green canopy
// ─────────────────────────────────────────────────────────────────────────────
export function GreenVoltModel({ cfg, quality = true }: { cfg: StoreConfig; quality?: boolean }) {
  const mats = useMats(cfg);
  const tex = useSignTexture(cfg.name, cfg.theme, cfg.sign, cfg.logoUrl);
  const face = useMemo(() => new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: '#ffffff', emissiveIntensity: cfg.lights ? 1.5 : 0.2 }), [tex, cfg.lights]);
  const ecoWhite = useMemo(() => mat('concrete', '#f8fafc'), []);
  const ecoGreen = useMemo(() => new THREE.MeshStandardMaterial({ color: '#16a34a', roughness: 0.35 }), []);
  const solarPV = useMemo(() => new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.2, metalness: 0.8 }), []);
  const solarFrame = solid('steel');

  const W = 9.6, D = 7.8, H = 7.5;

  return (
    <group>
      {/* Plinth */}
      <B s={[W + 0.6, 0.3, D + 0.6]} p={[0, 0.15, 0]} m={mats.floor} />

      {/* Main Crisp Structure */}
      <B s={[W, H, D]} p={[0, H / 2 + 0.15, 0]} m={ecoWhite} />

      {/* Left Corner Green Accent Canopy Portal */}
      <group position={[-W / 2 + 1.2, 0.15, D / 2 + 0.2]}>
        <B s={[2.2, 3.6, 0.8]} p={[0, 1.8, 0]} m={ecoGreen} />
        {/* Recessed corner door */}
        <DoubleDoors p={[0, 0, 0]} glass={mats.glass} alu={mats.alu} />
      </group>

      {/* Double-Height Glass Curtain Showroom (Right Side) */}
      <group position={[1.4, 0.15, D / 2 + 0.04]}>
        <Plane s={[5.8, 5.8]} p={[0, 2.9, 0]} m={cfg.lights ? mats.glow : mats.glass} />
        {[0, 2.9, 5.8].map(y => (
          <B key={y} s={[5.8, 0.08, 0.1]} p={[0, y, 0.05]} m={mats.alu} cast={false} />
        ))}
        {[-2.9, -0.9, 0.9, 2.9].map(x => (
          <B key={x} s={[0.08, 5.8, 0.1]} p={[x, 2.9, 0.05]} m={mats.alu} cast={false} />
        ))}
      </group>

      {/* Vibrant Green Signboard Panel */}
      <group position={[0.8, H - 1.2, D / 2 + 0.12]}>
        <B s={[6.4, 1.2, 0.15]} p={[0, 0, 0]} m={ecoGreen} />
        <Plane s={[6.0, 1.0]} p={[0, 0, 0.09]} m={face} />
      </group>

      {/* ROOFTOP SOLAR PV ARRAY - 8 Panels tilted at 22° facing south */}
      <group position={[0, H + 0.45, -0.4]} rotation={[0.38, 0, 0]}>
        {[-3.0, -1.0, 1.0, 3.0].map((px, idx) => (
          <group key={idx} position={[px, 0, 0]}>
            {/* Top tier */}
            <B s={[1.7, 0.04, 1.3]} p={[0, 0.02, -0.75]} m={solarPV} />
            <B s={[1.75, 0.06, 0.06]} p={[0, 0.03, -1.4]} m={solarFrame} cast={false} />
            {/* Bottom tier */}
            <B s={[1.7, 0.04, 1.3]} p={[0, 0.02, 0.75]} m={solarPV} />
            <B s={[1.75, 0.06, 0.06]} p={[0, 0.03, 1.4]} m={solarFrame} cast={false} />
          </group>
        ))}
      </group>

      {/* Sidewalk Planters */}
      <B s={[5.8, 0.4, 0.6]} p={[1.4, 0.2, D / 2 + 0.5]} m={ecoGreen} />
      {[-1.0, 1.0, 3.0].map((tx, ti) => (
        <mesh key={ti} position={[tx, 0.55, D / 2 + 0.5]} material={solid('foliage')} castShadow>
          <sphereGeometry args={[0.3, 8, 8]} />
        </mesh>
      ))}

      <OutdoorBoard pos={[-3.6, 0, D / 2 + 1.4]} name={cfg.name} tagline={cfg.tagline} theme={cfg.theme} logoUrl={cfg.logoUrl} baseMat={mats.trim} rot={0.1} />
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. GLOBALMART RETAILER (retail_mart) - Ref Image 1
// 2-storey limestone building, wide retail ground storefront, striped fabric awning, 2nd-floor terrace
// ─────────────────────────────────────────────────────────────────────────────
export function GlobalMartModel({ cfg, quality = true }: { cfg: StoreConfig; quality?: boolean }) {
  const mats = useMats(cfg);
  const tex = useSignTexture(cfg.name, cfg.theme, cfg.sign, cfg.logoUrl);
  const face = useMemo(() => new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: '#ffffff', emissiveIntensity: cfg.lights ? 1.5 : 0.2 }), [tex, cfg.lights]);
  const limestone = useMemo(() => mat('stone', '#e8cba5'), []);
  const stripe = useMemo(() => stripeTex(cfg.theme || '#d97706'), [cfg.theme]);
  const awningMat = useMemo(() => new THREE.MeshStandardMaterial({ map: stripe, roughness: 0.85, side: THREE.DoubleSide }), [stripe]);

  const W = 9.8, D = 8.0, H = 8.2;

  return (
    <group>
      {/* Plinth */}
      <B s={[W + 0.6, 0.3, D + 0.6]} p={[0, 0.15, 0]} m={mats.floor} />

      {/* Main Limestone Mass */}
      <B s={[W, H, D]} p={[0, H / 2 + 0.15, 0]} m={limestone} />

      {/* Ground Floor Wide Retail Glass Storefront */}
      <group position={[0, 0.15, D / 2 + 0.04]}>
        <Plane s={[8.6, 3.4]} p={[0, 1.7, 0]} m={cfg.lights ? mats.glow : mats.glass} />
        <DoubleDoors p={[0, 0, 0]} glass={mats.glass} alu={mats.alu} />
      </group>

      {/* Classic Striped Fabric Awning spanning the storefront */}
      <group position={[0, 3.65, D / 2]} rotation={[0.3, 0, 0]}>
        <mesh position={[0, 0, 0.8]} material={awningMat} castShadow receiveShadow>
          <boxGeometry args={[8.6, 0.05, 1.6]} />
        </mesh>
        <mesh position={[0, -0.14, 1.6]} material={awningMat} castShadow>
          <boxGeometry args={[8.6, 0.28, 0.04]} />
        </mesh>
      </group>

      {/* 2nd-Floor Recessed Balcony / Terrace */}
      <group position={[0, 4.2, D / 2 - 0.4]}>
        {/* Recessed glass wall */}
        <Plane s={[8.2, 3.2]} p={[0, 1.6, 0]} m={cfg.lights ? mats.glow : mats.glass} />
        {/* Balcony slab */}
        <B s={[8.6, 0.2, 1.2]} p={[0, 0.1, 0.6]} m={mats.floor} />
        {/* Tempered glass balustrade */}
        <Plane s={[8.6, 1.0]} p={[0, 0.6, 1.2]} m={mats.glass} />
        <B s={[8.6, 0.06, 0.06]} p={[0, 1.1, 1.2]} m={solid('alu')} cast={false} />
      </group>

      {/* Broad Fascia Signboard with Cart Icon */}
      <group position={[0, H - 0.7, D / 2 + 0.12]}>
        <B s={[8.2, 1.1, 0.18]} p={[0, 0, 0]} m={solid('dark')} />
        <Plane s={[7.8, 0.95]} p={[0, 0, 0.1]} m={face} />
      </group>

      {/* Parapet Roof */}
      <B s={[W + 0.3, 0.35, D + 0.3]} p={[0, H + 0.32, 0]} m={mats.trim} />
      <B s={[1.8, 1.0, 1.4]} p={[-2.4, H + 0.65, -1.2]} m={solid('steel')} />

      <OutdoorBoard pos={[-3.8, 0, D / 2 + 1.4]} name={cfg.name} tagline={cfg.tagline} theme={cfg.theme} logoUrl={cfg.logoUrl} baseMat={mats.trim} rot={0.1} />
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. URBANBITE BISTRO & CAFE (retail_cafe) - Ref Image 1
// Charcoal box with warm vertical timber slat wing, outdoor patio dining with tables & chairs
// ─────────────────────────────────────────────────────────────────────────────
export function UrbanBiteModel({ cfg, quality = true }: { cfg: StoreConfig; quality?: boolean }) {
  const mats = useMats(cfg);
  const tex = useSignTexture(cfg.name, cfg.theme, 'neon', cfg.logoUrl);
  const face = useMemo(() => new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: '#ffffff', emissiveIntensity: cfg.lights ? 1.6 : 0.2 }), [tex, cfg.lights]);
  const charcoal = useMemo(() => mat('concrete', '#262930'), []);
  const timberSlat = useMemo(() => mat('wood', '#ca8a04'), []);
  const stripe = useMemo(() => stripeTex(cfg.theme || '#ca8a04'), [cfg.theme]);
  const awningMat = useMemo(() => new THREE.MeshStandardMaterial({ map: stripe, roughness: 0.85, side: THREE.DoubleSide }), [stripe]);

  const W = 9.6, D = 7.8, H = 7.4;

  return (
    <group>
      {/* Plinth */}
      <B s={[W + 0.6, 0.3, D + 0.6]} p={[0, 0.15, 0]} m={mats.floor} />

      {/* Main Charcoal Block */}
      <B s={[W, H, D]} p={[0, H / 2 + 0.15, 0]} m={charcoal} />

      {/* Vertical Wood Timber Slat Section (Left 1/3) */}
      <group position={[-W / 2 + 1.6, 0.15, D / 2 + 0.15]}>
        <B s={[3.2, H, 0.3]} p={[0, H / 2, 0]} m={timberSlat} />
        {/* Slats */}
        {[-1.2, -0.6, 0, 0.6, 1.2].map(sx => (
          <B key={sx} s={[0.08, H, 0.08]} p={[sx, H / 2, 0.18]} m={solid('dark')} cast={false} />
        ))}
        {/* Circular Neon Logo Medallion (Fork & Knife / Cafe) */}
        <mesh position={[0, H - 2.0, 0.24]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.7, 0.7, 0.08, 24]} />
          <meshStandardMaterial color="#ffffff" emissive={cfg.theme || '#ca8a04'} emissiveIntensity={cfg.lights ? 2.0 : 0.4} />
        </mesh>
      </group>

      {/* Outdoor Patio Dining Area (Right side) */}
      <group position={[1.4, 0.15, D / 2]}>
        {/* Storefront Glass Doors */}
        <Plane s={[5.4, 3.2]} p={[0, 1.6, 0.04]} m={mats.glass} />
        <DoubleDoors p={[0, 0, 0]} glass={mats.glass} alu={mats.alu} />

        {/* Cafe Awning */}
        <group position={[0, 3.5, 0]} rotation={[0.28, 0, 0]}>
          <mesh position={[0, 0, 0.8]} material={awningMat} castShadow>
            <boxGeometry args={[5.8, 0.05, 1.6]} />
          </mesh>
        </group>

        {/* Outdoor Bistro Tables & Wire Chairs */}
        {[-1.4, 1.4].map((tx, ti) => (
          <group key={ti} position={[tx, 0, 1.4]}>
            {/* Table */}
            <mesh position={[0, 0.72, 0]}>
              <cylinderGeometry args={[0.5, 0.5, 0.05, 16]} />
              <primitive object={solid('alu')} attach="material" />
            </mesh>
            <mesh position={[0, 0.36, 0]}>
              <cylinderGeometry args={[0.04, 0.04, 0.72, 8]} />
              <primitive object={solid('alu')} attach="material" />
            </mesh>
            {/* Chairs */}
            {[-0.5, 0.5].map((cx, ci) => (
              <group key={ci} position={[cx, 0, 0]}>
                <B s={[0.35, 0.42, 0.35]} p={[0, 0.21, 0]} m={solid('dark')} />
                <B s={[0.35, 0.4, 0.04]} p={[0, 0.55, cx < 0 ? -0.15 : 0.15]} m={solid('dark')} />
              </group>
            ))}
          </group>
        ))}

        {/* Planter boxes bordering patio */}
        <B s={[5.8, 0.45, 0.35]} p={[0, 0.22, 2.2]} m={charcoal} />
        {[-2.0, 0, 2.0].map((px, pi) => (
          <mesh key={pi} position={[px, 0.55, 2.2]} material={solid('foliage')} castShadow>
            <sphereGeometry args={[0.25, 8, 8]} />
          </mesh>
        ))}
      </group>

      {/* Rooftop Signboard */}
      <group position={[1.4, H - 1.2, D / 2 + 0.12]}>
        <Plane s={[5.4, 1.0]} p={[0, 0, 0.02]} m={face} />
      </group>

      <OutdoorBoard pos={[-3.6, 0, D / 2 + 1.4]} name={cfg.name} tagline={cfg.tagline} theme={cfg.theme} logoUrl={cfg.logoUrl} baseMat={mats.trim} rot={0.1} />
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. PRIMEBANK FINANCIAL (retail_bank) - Ref Image 1
// Neoclassical modern bank with prominent square stone columns, grand recessed glass entrance
// ─────────────────────────────────────────────────────────────────────────────
export function PrimeBankModel({ cfg, quality = true }: { cfg: StoreConfig; quality?: boolean }) {
  const mats = useMats(cfg);
  const tex = useSignTexture(cfg.name, cfg.theme, 'panel', cfg.logoUrl);
  const face = useMemo(() => new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: '#ffffff', emissiveIntensity: cfg.lights ? 1.5 : 0.2 }), [tex, cfg.lights]);
  const bankStone = useMemo(() => mat('stone', '#e2e8f0'), []);
  const bronzeCornice = useMemo(() => mat('metal', '#1e293b'), []);

  const W = 9.8, D = 8.0, H = 8.5;

  return (
    <group>
      {/* Plinth */}
      <B s={[W + 0.6, 0.4, D + 0.6]} p={[0, 0.2, 0]} m={mats.floor} />

      {/* Main Building Mass */}
      <B s={[W, H, D]} p={[0, H / 2 + 0.2, 0]} m={bankStone} />

      {/* 4 Monumental Square Architectural Columns / Pilasters */}
      {[-3.6, -1.2, 1.2, 3.6].map((cx, i) => (
        <group key={i} position={[cx, 0.2, D / 2 + 0.4]}>
          {/* Column Base */}
          <B s={[0.85, 0.4, 0.85]} p={[0, 0.2, 0]} m={bankStone} />
          {/* Column Shaft */}
          <B s={[0.65, 6.2, 0.65]} p={[0, 3.5, 0]} m={bankStone} />
          {/* Column Capital */}
          <B s={[0.85, 0.4, 0.85]} p={[0, 6.8, 0]} m={bankStone} />
        </group>
      ))}

      {/* Monumental Architectural Architrave & Entablature */}
      <B s={[W + 0.4, 0.8, 1.4]} p={[0, 7.4, D / 2 + 0.4]} m={bankStone} />

      {/* Grand Recessed Glass Atrium & Entrance Portal */}
      <group position={[0, 0.2, D / 2]}>
        <Plane s={[6.8, 6.0]} p={[0, 3.0, 0.04]} m={cfg.lights ? mats.glow : mats.glass} />
        <DoubleDoors p={[0, 0, 0]} glass={mats.glass} alu={mats.alu} />
        {/* Granite Entrance Steps */}
        <B s={[4.2, 0.2, 1.2]} p={[0, 0.1, 0.8]} m={mats.floor} />
        <B s={[3.6, 0.2, 0.6]} p={[0, 0.25, 0.6]} m={mats.floor} />
      </group>

      {/* Premium Dark Corporate Signboard Fascia */}
      <group position={[0, H - 0.6, D / 2 + 0.45]}>
        <B s={[7.6, 1.1, 0.2]} p={[0, 0, 0]} m={bronzeCornice} />
        <Plane s={[7.2, 0.95]} p={[0, 0, 0.12]} m={face} />
      </group>

      {/* Parapet Cornice Roof */}
      <B s={[W + 0.6, 0.45, D + 0.6]} p={[0, H + 0.42, 0]} m={bronzeCornice} />
      <OutdoorBoard pos={[-3.8, 0, D / 2 + 1.6]} name={cfg.name} tagline={cfg.tagline} theme={cfg.theme} logoUrl={cfg.logoUrl} baseMat={mats.trim} rot={0.1} />
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. MEGA MALL ROTUNDA (retail_mall) - Ref Image 3
// Cylindrical glass rotunda atrium entrance in center, circular skylight crown, flanking wings
// ─────────────────────────────────────────────────────────────────────────────
export function MegaMallModel({ cfg, quality = true }: { cfg: StoreConfig; quality?: boolean }) {
  const mats = useMats(cfg);
  const tex = useSignTexture(cfg.name, cfg.theme, 'box', cfg.logoUrl);
  const face = useMemo(() => new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: '#ffffff', emissiveIntensity: cfg.lights ? 1.6 : 0.2 }), [tex, cfg.lights]);
  const mallWhite = useMemo(() => mat('concrete', '#f8fafc'), []);
  const ledAccent = useMemo(() => new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: cfg.theme || '#2563eb', emissiveIntensity: 2.2 }), [cfg.theme]);

  const W = 10.4, D = 8.2, H = 10.5;

  return (
    <group>
      {/* Plinth */}
      <B s={[W + 0.8, 0.3, D + 0.8]} p={[0, 0.15, 0]} m={mats.floor} />

      {/* Flanking Left & Right Architectural Wing Towers */}
      <B s={[2.8, H, D]} p={[-3.8, H / 2 + 0.15, 0]} m={mallWhite} />
      <B s={[2.8, H, D]} p={[3.8, H / 2 + 0.15, 0]} m={mallWhite} />

      {/* Flanking Vertical LED Banner Displays */}
      <mesh position={[-3.8, 5.5, D / 2 + 0.05]} material={ledAccent}>
        <planeGeometry args={[1.2, 4.8]} />
      </mesh>
      <mesh position={[3.8, 5.5, D / 2 + 0.05]} material={ledAccent}>
        <planeGeometry args={[1.2, 4.8]} />
      </mesh>

      {/* Central Semi-Cylindrical Curved Glass Rotunda Atrium */}
      <group position={[0, 0.15, 1.2]}>
        {/* Curved Glass Cylinder */}
        <mesh position={[0, 4.8, 0]}>
          <cylinderGeometry args={[3.6, 3.6, 9.6, 32, 1, false, 0, Math.PI]} />
          <primitive object={cfg.lights ? mats.glow : mats.glass} attach="material" />
        </mesh>
        {/* Horizontal Mullion Rings */}
        {[0.1, 3.2, 6.4, 9.6].map(y => (
          <mesh key={y} position={[0, y, 0]}>
            <cylinderGeometry args={[3.65, 3.65, 0.12, 32, 1, false, 0, Math.PI]} />
            <primitive object={mats.alu} attach="material" />
          </mesh>
        ))}
        {/* Entrance Revolving / Double Doors */}
        <DoubleDoors p={[0, 0, 3.6]} glass={mats.glass} alu={mats.alu} />
      </group>

      {/* Circular Skylight Crown Ring Disc */}
      <group position={[0, H + 0.4, 1.2]}>
        <mesh>
          <cylinderGeometry args={[3.9, 3.9, 0.45, 32]} />
          <primitive object={mallWhite} attach="material" />
        </mesh>
        <mesh position={[0, 0.25, 0]}>
          <cylinderGeometry args={[3.7, 3.7, 0.1, 32]} />
          <primitive object={ledAccent} attach="material" />
        </mesh>
      </group>

      {/* Large Illuminated Shopping Bag Signboard */}
      <group position={[0, H - 1.2, D / 2 + 0.8]}>
        <B s={[4.8, 1.4, 0.2]} p={[0, 0, 0]} m={solid('dark')} />
        <Plane s={[4.5, 1.2]} p={[0, 0, 0.12]} m={face} />
      </group>

      <OutdoorBoard pos={[-4.2, 0, D / 2 + 1.8]} name={cfg.name} tagline={cfg.tagline} theme={cfg.theme} logoUrl={cfg.logoUrl} baseMat={mats.trim} rot={0.1} />
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. PIXELFORGE DIGITAL STUDIO (office_agency) - Ref Image 1
// 3-storey dark indigo cubist block, signature glowing purple neon portal frame
// ─────────────────────────────────────────────────────────────────────────────
export function PixelForgeModel({ cfg, quality = true }: { cfg: StoreConfig; quality?: boolean }) {
  const mats = useMats(cfg);
  const tex = useSignTexture(cfg.name, cfg.theme, 'neon', cfg.logoUrl);
  const face = useMemo(() => new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: '#ffffff', emissiveIntensity: cfg.lights ? 1.6 : 0.2 }), [tex, cfg.lights]);
  const darkIndigo = useMemo(() => mat('concrete', '#1e1b4b'), []);
  const neonPurple = useMemo(() => new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: cfg.theme || '#9333ea', emissiveIntensity: 2.5 }), [cfg.theme]);

  const W = 9.6, D = 7.8, H = 10.8;

  return (
    <group>
      {/* Plinth */}
      <B s={[W + 0.6, 0.3, D + 0.6]} p={[0, 0.15, 0]} m={mats.floor} />

      {/* Main Cubic Volume */}
      <B s={[W, H, D]} p={[0, H / 2 + 0.15, 0]} m={darkIndigo} />

      {/* 3 Floors of Stacked Ribbon Glass Curtain Bays */}
      {[0, 1, 2].map(fl => {
        const fy = 1.8 + fl * 3.4;
        return (
          <group key={fl} position={[0, fy, D / 2 + 0.04]}>
            <Plane s={[8.2, 2.2]} p={[0, 0, 0]} m={cfg.lights ? mats.glow : mats.glass} />
            <B s={[8.4, 0.1, 0.12]} p={[0, 1.15, 0.05]} m={mats.alu} cast={false} />
            <B s={[8.4, 0.1, 0.12]} p={[0, -1.15, 0.05]} m={mats.alu} cast={false} />
          </group>
        );
      })}

      {/* Signature Glowing Purple / Magenta Neon Portal Frame */}
      <group position={[-2.4, 0.15, D / 2 + 0.2]}>
        {/* Left vertical light column */}
        <Px s={[0.15, H - 2.0, 0.15]} p={[-1.6, (H - 2.0) / 2, 0]} m={neonPurple} />
        {/* Right vertical light column */}
        <Px s={[0.15, H - 2.0, 0.15]} p={[1.6, (H - 2.0) / 2, 0]} m={neonPurple} />
        {/* Overhead horizontal bar */}
        <Px s={[3.35, 0.15, 0.15]} p={[0, H - 2.0, 0]} m={neonPurple} />
      </group>

      {/* Entrance Double Doors inside Portal */}
      <DoubleDoors p={[-2.4, 0.15, D / 2 + 0.04]} glass={mats.glass} alu={mats.alu} />

      {/* Digital Branding Signboard */}
      <group position={[1.4, H - 1.4, D / 2 + 0.14]}>
        <B s={[5.2, 1.2, 0.2]} p={[0, 0, 0]} m={solid('dark')} />
        <Plane s={[4.8, 1.0]} p={[0, 0, 0.12]} m={face} />
      </group>

      {/* Parapet Roof with HVAC */}
      <B s={[W + 0.3, 0.35, D + 0.3]} p={[0, H + 0.32, 0]} m={mats.trim} />
      <B s={[2.2, 1.2, 1.6]} p={[-2.0, H + 0.75, -1.2]} m={solid('steel')} />

      <OutdoorBoard pos={[-3.6, 0, D / 2 + 1.4]} name={cfg.name} tagline={cfg.tagline} theme={cfg.theme} logoUrl={cfg.logoUrl} baseMat={mats.trim} rot={0.1} />
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 10. LEARNPRO CAMPUS (office_learn) - Ref Image 1
// Modernist white cube, double-height blue glass curtain wall, floating canopy
// ─────────────────────────────────────────────────────────────────────────────
export function LearnProModel({ cfg, quality = true }: { cfg: StoreConfig; quality?: boolean }) {
  const mats = useMats(cfg);
  const tex = useSignTexture(cfg.name, cfg.theme, 'box', cfg.logoUrl);
  const face = useMemo(() => new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: '#ffffff', emissiveIntensity: cfg.lights ? 1.5 : 0.2 }), [tex, cfg.lights]);
  const campusWhite = useMemo(() => mat('concrete', '#ffffff'), []);
  const blueCanopy = useMemo(() => new THREE.MeshStandardMaterial({ color: cfg.theme || '#0284c7', roughness: 0.35 }), [cfg.theme]);

  const W = 9.6, D = 7.8, H = 8.0;

  return (
    <group>
      {/* Plinth */}
      <B s={[W + 0.6, 0.3, D + 0.6]} p={[0, 0.15, 0]} m={mats.floor} />

      {/* Clean White Cubic Mass */}
      <B s={[W, H, D]} p={[0, H / 2 + 0.15, 0]} m={campusWhite} />

      {/* Double-Height Blue Glass Curtain Wall */}
      <group position={[-1.2, 0.15, D / 2 + 0.04]}>
        <Plane s={[6.4, 5.8]} p={[0, 2.9, 0]} m={cfg.lights ? mats.glow : mats.glass} />
        {[0, 2.9, 5.8].map(y => (
          <B key={y} s={[6.4, 0.08, 0.1]} p={[0, y, 0.05]} m={mats.alu} cast={false} />
        ))}
        {[-3.2, -1.1, 1.1, 3.2].map(x => (
          <B key={x} s={[0.08, 5.8, 0.1]} p={[x, 2.9, 0.05]} m={mats.alu} cast={false} />
        ))}
        <DoubleDoors p={[0, 0, 0]} glass={mats.glass} alu={mats.alu} />
      </group>

      {/* Floating Blue Entrance Canopy */}
      <group position={[-1.2, 3.4, D / 2 + 0.6]}>
        <B s={[3.2, 0.16, 1.4]} p={[0, 0, 0]} m={blueCanopy} />
        {/* Steel support cables */}
        <mesh position={[-1.4, 0.8, -0.4]} rotation={[0.5, 0, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 1.8, 8]} />
          <primitive object={solid('steel')} attach="material" />
        </mesh>
        <mesh position={[1.4, 0.8, -0.4]} rotation={[0.5, 0, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 1.8, 8]} />
          <primitive object={solid('steel')} attach="material" />
        </mesh>
      </group>

      {/* Open Book / Education 3D Emblem and Signboard */}
      <group position={[0, H - 1.2, D / 2 + 0.12]}>
        <Plane s={[6.8, 1.1]} p={[0, 0, 0.02]} m={face} />
      </group>

      {/* Parapet Roof */}
      <B s={[W + 0.3, 0.35, D + 0.3]} p={[0, H + 0.32, 0]} m={mats.trim} />
      <OutdoorBoard pos={[-3.8, 0, D / 2 + 1.4]} name={cfg.name} tagline={cfg.tagline} theme={cfg.theme} logoUrl={cfg.logoUrl} baseMat={mats.trim} rot={0.1} />
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 11. GRAND HOTEL & SUITES (office_hotel) - Ref Image 3
// 4-storey boutique hotel, warm vertical timber slat facade, rooftop pergola lounge terrace
// ─────────────────────────────────────────────────────────────────────────────
export function GrandHotelModel({ cfg, quality = true }: { cfg: StoreConfig; quality?: boolean }) {
  const mats = useMats(cfg);
  const tex = useSignTexture(cfg.name, cfg.theme, 'blade', cfg.logoUrl);
  const face = useMemo(() => new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: '#ffffff', emissiveIntensity: cfg.lights ? 1.5 : 0.2 }), [tex, cfg.lights]);
  const hotelStone = useMemo(() => mat('concrete', '#334155'), []);
  const timberSlat = useMemo(() => mat('wood', '#ca8a04'), []);
  const warmGlow = useMemo(() => new THREE.MeshStandardMaterial({ color: '#fef3c7', emissive: '#f59e0b', emissiveIntensity: 1.2 }), []);

  const W = 9.6, D = 7.8, H = 14.2;

  return (
    <group>
      {/* Plinth */}
      <B s={[W + 0.6, 0.3, D + 0.6]} p={[0, 0.15, 0]} m={mats.floor} />

      {/* Main Structural Mass */}
      <B s={[W, H, D]} p={[0, H / 2 + 0.15, 0]} m={hotelStone} />

      {/* Right Half: Vertical Warm Timber Slat Facade */}
      <group position={[2.2, 0.15, D / 2 + 0.12]}>
        <B s={[4.6, H, 0.2]} p={[0, H / 2, 0]} m={timberSlat} />
        {[-1.8, -0.9, 0, 0.9, 1.8].map(x => (
          <B key={x} s={[0.08, H, 0.08]} p={[x, H / 2, 0.12]} m={solid('dark')} cast={false} />
        ))}
      </group>

      {/* Left Half: Windows on Each Floor */}
      {[1, 2, 3].map(fl => {
        const fy = 1.8 + fl * 3.4;
        return (
          <group key={fl} position={[-2.2, fy, D / 2 + 0.04]}>
            <Plane s={[3.8, 1.8]} p={[0, 0, 0]} m={cfg.lights ? mats.glow : mats.glass} />
            <B s={[4.0, 0.08, 0.1]} p={[0, -0.95, 0.05]} m={mats.trim} />
          </group>
        );
      })}

      {/* Warm Golden Illuminated Ground Floor Lobby */}
      <group position={[0, 0.15, D / 2 + 0.06]}>
        <Plane s={[8.6, 3.2]} p={[0, 1.6, 0]} m={warmGlow} />
        <DoubleDoors p={[0, 0, 0]} glass={mats.glass} alu={mats.alu} />
        {/* Projecting Entrance Marquee Canopy */}
        <B s={[4.2, 0.2, 1.8]} p={[0, 3.4, 0.9]} m={solid('dark')} />
      </group>

      {/* Rooftop Pergola Lounge Terrace */}
      <group position={[0, H + 0.15, 0]}>
        {/* Parapet */}
        <B s={[W + 0.3, 0.4, D + 0.3]} p={[0, 0.2, 0]} m={mats.trim} />
        {/* Timber Pergola Beams */}
        {[-3.0, -1.0, 1.0, 3.0].map(px => (
          <B key={px} s={[0.12, 0.16, 5.0]} p={[px, 2.2, 0]} m={timberSlat} />
        ))}
        {[-2.0, 0, 2.0].map(pz => (
          <B key={pz} s={[7.2, 0.16, 0.12]} p={[0, 2.3, pz]} m={timberSlat} />
        ))}
        {/* Pergola Columns */}
        {[[-3.0, -2.0], [-3.0, 2.0], [3.0, -2.0], [3.0, 2.0]].map(([cx, cz], i) => (
          <B key={i} s={[0.16, 2.2, 0.16]} p={[cx, 1.1, cz]} m={timberSlat} />
        ))}
      </group>

      {/* Vertical HOTEL Signboard */}
      <group position={[-3.6, H - 4.5, D / 2 + 0.14]}>
        <Plane s={[1.4, 4.2]} p={[0, 0, 0]} m={face} />
      </group>

      <OutdoorBoard pos={[-3.8, 0, D / 2 + 1.4]} name={cfg.name} tagline={cfg.tagline} theme={cfg.theme} logoUrl={cfg.logoUrl} baseMat={mats.trim} rot={0.1} />
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 12. TERRACED BALCONY COMPLEX (office_terrace) - Ref Image 3
// 5-storey building, staggered cantilevered balconies with glass railings & green shrub planters
// ─────────────────────────────────────────────────────────────────────────────
export function TerracedBalconyModel({ cfg, quality = true }: { cfg: StoreConfig; quality?: boolean }) {
  const mats = useMats(cfg);
  const tex = useSignTexture(cfg.name, cfg.theme, cfg.sign, cfg.logoUrl);
  const face = useMemo(() => new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: '#ffffff', emissiveIntensity: cfg.lights ? 1.5 : 0.2 }), [tex, cfg.lights]);
  const terraceWhite = useMemo(() => mat('concrete', '#f8fafc'), []);

  const W = 9.6, D = 7.8, H = 17.5;

  return (
    <group>
      {/* Plinth */}
      <B s={[W + 0.6, 0.3, D + 0.6]} p={[0, 0.15, 0]} m={mats.floor} />

      {/* Main Structure */}
      <B s={[W, H, D]} p={[0, H / 2 + 0.15, 0]} m={terraceWhite} />

      {/* Ground Floor Commercial Showroom */}
      <group position={[0, 0.15, D / 2 + 0.04]}>
        <Plane s={[8.6, 3.4]} p={[0, 1.7, 0]} m={cfg.lights ? mats.glow : mats.glass} />
        <DoubleDoors p={[0, 0, 0]} glass={mats.glass} alu={mats.alu} />
      </group>

      {/* 4 Upper Floors with Staggered Cantilevered Balconies & Planters */}
      {[1, 2, 3, 4].map(fl => {
        const fy = 1.8 + fl * 3.4;
        const offset = (fl % 2 === 0 ? 1.6 : -1.6);
        return (
          <group key={fl} position={[0, fy, D / 2]}>
            {/* Floor glass facade */}
            <Plane s={[8.6, 2.2]} p={[0, 0, 0.04]} m={cfg.lights ? mats.glow : mats.glass} />

            {/* Cantilevered Balcony Slab */}
            <B s={[4.6, 0.22, 1.4]} p={[offset, -0.9, 0.7]} m={mats.floor} />
            {/* Glass Balustrade */}
            <Plane s={[4.6, 0.85]} p={[offset, -0.4, 1.4]} m={mats.glass} />
            <B s={[4.6, 0.06, 0.06]} p={[offset, 0.02, 1.4]} m={solid('alu')} cast={false} />

            {/* Balcony Green Shrub Planter Box */}
            <B s={[1.2, 0.45, 0.4]} p={[offset + (offset > 0 ? 1.5 : -1.5), -0.6, 1.0]} m={solid('dark')} />
            <mesh position={[offset + (offset > 0 ? 1.5 : -1.5), -0.25, 1.0]} material={solid('foliage')} castShadow>
              <sphereGeometry args={[0.26, 8, 8]} />
            </mesh>
          </group>
        );
      })}

      {/* Facade Branding Panel */}
      <Plane s={[6.4, 1.1]} p={[0, 3.9, D / 2 + 0.12]} m={face} />

      {/* Rooftop Parapet */}
      <B s={[W + 0.3, 0.4, D + 0.3]} p={[0, H + 0.35, 0]} m={mats.trim} />
      <B s={[2.2, 1.2, 1.6]} p={[2.0, H + 0.75, -1.2]} m={solid('steel')} />

      <OutdoorBoard pos={[-3.8, 0, D / 2 + 1.4]} name={cfg.name} tagline={cfg.tagline} theme={cfg.theme} logoUrl={cfg.logoUrl} baseMat={mats.trim} rot={0.1} />
    </group>
  );
}
