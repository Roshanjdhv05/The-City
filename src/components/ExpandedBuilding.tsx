'use client';
import * as THREE from 'three';
import React, { useMemo } from 'react';
import type { StoreConfig } from '@/lib/types';
import { mat, glassMat, solid, sbox } from '@/lib/materials';
import { useSignTexture } from '@/lib/signage';
import { B, OutdoorBoard, useMats } from './Building';
import { Px, DoubleDoors } from './CentralBuilding';
import {
  CreativeStudioModel,
  HealthPlusModel,
  FastShipModel,
  GreenVoltModel,
  GlobalMartModel,
  UrbanBiteModel,
  PrimeBankModel,
  MegaMallModel,
  PixelForgeModel,
  LearnProModel,
  GrandHotelModel,
  TerracedBalconyModel,
} from './CommercialModels';
import {
  SkyCoreTowerModel,
  PrimeHubTowerModel,
  FusionTechTowerModel,
  GlobalMonolithModel,
  MetroCorpTowerModel,
  InnoParkCubesModel,
  NovaVistaArcModel,
  VertexApexModel,
  GlobalTechSlantedModel,
  ZenithCrownModel,
  TechNovaWrapModel,
  MediaHubCyberModel,
} from './TowerModels';

/**
 * Full Detail 3D Architecture Renderer for all 24 new building structures
 */
export function ExpandedBuildingFull({
  cfg,
  plotId,
  quality = true,
}: {
  cfg: StoreConfig;
  plotId?: string;
  quality?: boolean;
}) {
  switch (cfg.template) {
    // ── Commercial Buildings (Ref Image 1) ───────────────────────────────────
    case 'comm_creative':
      return <CreativeStudioModel cfg={cfg} quality={quality} />;
    case 'comm_health':
      return <HealthPlusModel cfg={cfg} quality={quality} />;
    case 'comm_logistics':
      return <FastShipModel cfg={cfg} quality={quality} />;
    case 'comm_solar':
      return <GreenVoltModel cfg={cfg} quality={quality} />;

    // ── Retail Buildings (Ref Image 1 & 3) ───────────────────────────────────
    case 'retail_mart':
      return <GlobalMartModel cfg={cfg} quality={quality} />;
    case 'retail_cafe':
      return <UrbanBiteModel cfg={cfg} quality={quality} />;
    case 'retail_bank':
      return <PrimeBankModel cfg={cfg} quality={quality} />;
    case 'retail_mall':
      return <MegaMallModel cfg={cfg} quality={quality} />;

    // ── Office Buildings (Ref Image 1 & 3) ───────────────────────────────────
    case 'office_agency':
      return <PixelForgeModel cfg={cfg} quality={quality} />;
    case 'office_learn':
      return <LearnProModel cfg={cfg} quality={quality} />;
    case 'office_hotel':
      return <GrandHotelModel cfg={cfg} quality={quality} />;
    case 'office_terrace':
      return <TerracedBalconyModel cfg={cfg} quality={quality} />;

    // ── Corporate Towers (Ref Image 2 & 3) ───────────────────────────────────
    case 'corp_skycore':
      return <SkyCoreTowerModel cfg={cfg} quality={quality} />;
    case 'corp_prime':
      return <PrimeHubTowerModel cfg={cfg} quality={quality} />;
    case 'corp_portal':
      return <FusionTechTowerModel cfg={cfg} quality={quality} />;
    case 'corp_monolith':
      return <GlobalMonolithModel cfg={cfg} quality={quality} />;

    // ── Landmark Towers (Ref Image 2) ────────────────────────────────────────
    case 'land_stepped':
      return <MetroCorpTowerModel cfg={cfg} quality={quality} />;
    case 'land_cubes':
      return <InnoParkCubesModel cfg={cfg} quality={quality} />;
    case 'land_arc':
      return <NovaVistaArcModel cfg={cfg} quality={quality} />;
    case 'land_apex':
      return <VertexApexModel cfg={cfg} quality={quality} />;

    // ── Modern Glass Towers (Ref Image 2 & 3) ────────────────────────────────
    case 'glass_slanted':
      return <GlobalTechSlantedModel cfg={cfg} quality={quality} />;
    case 'glass_zenith':
      return <ZenithCrownModel cfg={cfg} quality={quality} />;
    case 'glass_wrap':
      return <TechNovaWrapModel cfg={cfg} quality={quality} />;
    case 'glass_neon':
      return <MediaHubCyberModel cfg={cfg} quality={quality} />;

    default:
      return <CreativeStudioModel cfg={cfg} quality={quality} />;
  }
}

/**
 * Lightweight Low-LOD Renderer:
 * Preserves the exact 3D silhouette, structural proportions, materials, and signage
 * with minimal draw calls and optimized geometry.
 */
export function ExpandedBuildingLow({
  cfg,
  plotId,
}: {
  cfg: StoreConfig;
  plotId?: string;
}) {
  const mats = useMats(cfg);
  const tex = useSignTexture(cfg.name, cfg.theme, cfg.sign, cfg.logoUrl);
  const face = useMemo(
    () => new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }),
    [tex]
  );
  const ledTheme = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#ffffff',
        emissive: cfg.theme,
        emissiveIntensity: 1.6,
        flatShading: true,
      }),
    [cfg.theme]
  );
  const whiteMat = useMemo(() => mat('concrete', '#ffffff'), []);
  const dark = solid('dark');

  // Determine structural height based on template
  const isTower =
    cfg.template.startsWith('corp_') ||
    cfg.template.startsWith('land_') ||
    cfg.template.startsWith('glass_');
  const H = isTower ? 23.0 : cfg.template === 'office_hotel' ? 14.0 : cfg.template === 'office_terrace' ? 17.0 : 8.0;
  const W = 9.6, D = 7.8;

  // Rotunda Towers (Cylindrical silhouette)
  if (cfg.template === 'corp_skycore') {
    return (
      <group>
        <mesh position={[0, 0.15, 0]}>
          <cylinderGeometry args={[4.4, 4.4, 0.3, 16]} />
          <primitive object={mats.floor} attach="material" />
        </mesh>
        <mesh position={[0, H / 2 + 0.15, 0]}>
          <cylinderGeometry args={[3.8, 3.8, H, 16]} />
          <primitive object={cfg.lights ? mats.glow : mats.glass} attach="material" />
        </mesh>
        <mesh position={[0, H + 2.5, 0]}>
          <cylinderGeometry args={[0.08, 0.15, 4.5, 8]} />
          <primitive object={solid('steel')} attach="material" />
        </mesh>
        <mesh position={[0, H - 3.0, 3.9]}>
          <planeGeometry args={[4.2, 1.2]} />
          <primitive object={face} attach="material" />
        </mesh>
      </group>
    );
  }

  // Stepped Ziggurat Silhouette
  if (cfg.template === 'land_stepped') {
    return (
      <group>
        <B s={[10.2, 0.3, 8.4]} p={[0, 0.15, 0]} m={mats.floor} />
        <B s={[9.6, 7.5, 7.8]} p={[0, 3.9, 0]} m={whiteMat} />
        <B s={[7.8, 6.5, 6.4]} p={[0, 10.9, 0]} m={whiteMat} />
        <B s={[5.8, 6.0, 5.0]} p={[0, 17.2, 0]} m={whiteMat} />
        <B s={[3.8, 4.5, 3.6]} p={[0, 22.4, 0]} m={whiteMat} />
        <mesh position={[0, 17.2, 2.55]}>
          <planeGeometry args={[3.8, 1.2]} />
          <primitive object={face} attach="material" />
        </mesh>
      </group>
    );
  }

  // Slanted Tower Silhouette
  if (cfg.template === 'glass_slanted') {
    return (
      <group>
        <B s={[W + 0.6, 0.3, D + 0.6]} p={[0, 0.15, 0]} m={mats.floor} />
        <B s={[W, H, D]} p={[0, H / 2 + 0.15, 0]} m={whiteMat} />
        <mesh position={[0, H / 2, D / 2 + 0.04]}>
          <planeGeometry args={[W - 2.0, H - 2.0]} />
          <primitive object={cfg.lights ? mats.glow : mats.glass} attach="material" />
        </mesh>
        <mesh position={[0, H + 4.0, D / 2 + 0.06]} rotation={[0, 0, 0.65]}>
          <boxGeometry args={[12.2, 0.3, 0.3]} />
          <primitive object={whiteMat} attach="material" />
        </mesh>
        <mesh position={[0, H - 2.8, D / 2 + 0.12]}>
          <planeGeometry args={[5.6, 1.3]} />
          <primitive object={face} attach="material" />
        </mesh>
      </group>
    );
  }

  // Standard Box & Glass Tower / Commercial Silhouette
  return (
    <group>
      <B s={[W + 0.6, 0.3, D + 0.6]} p={[0, 0.15, 0]} m={mats.floor} />
      <B s={[W, H, D]} p={[0, H / 2 + 0.15, 0]} m={mats.wall} />
      <mesh position={[0, H / 2 + 0.15, D / 2 + 0.04]}>
        <planeGeometry args={[W - 2.0, H - 1.2]} />
        <primitive object={cfg.lights ? mats.glow : mats.glass} attach="material" />
      </mesh>
      <B s={[W + 0.3, 0.4, D + 0.3]} p={[0, H + 0.35, 0]} m={mats.trim} />
      <mesh position={[0, Math.min(H - 1.2, 3.85), D / 2 + 0.12]}>
        <planeGeometry args={[5.6, 1.1]} />
        <primitive object={face} attach="material" />
      </mesh>
      <OutdoorBoard
        pos={[-3.6, 0, D / 2 + 1.4]}
        name={cfg.name}
        tagline={cfg.tagline}
        theme={cfg.theme}
        logoUrl={cfg.logoUrl}
        baseMat={mats.trim}
        rot={0.1}
      />
    </group>
  );
}

/**
 * Level of Detail Container for Expanded Buildings
 */
export function ExpandedBuildingLOD({
  cfg,
  plotId,
  lodTier = 'full',
  interiors = true,
}: {
  cfg: StoreConfig;
  plotId?: string;
  lodTier?: 'full' | 'medium' | 'low';
  interiors?: boolean;
}) {
  if (lodTier === 'low') {
    return <ExpandedBuildingLow cfg={cfg} plotId={plotId} />;
  }
  return <ExpandedBuildingFull cfg={cfg} plotId={plotId} quality={interiors} />;
}
