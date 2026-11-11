'use client';
import React, { useMemo } from 'react';
import type { StoreConfig } from '@/lib/types';
import { BuildingFull, BuildingMedium, BuildingLow, ModularBuilding } from './Building';
import { Bungalow, BungalowLow } from './Bungalow';
import { CentralBuildingFull, CentralBuildingLow } from './CentralBuilding';
import { JEnterpriseLOD } from './JEnterprise';

interface BuildingLODProps {
  cfg: StoreConfig;
  plotId?: string;
  lodTier: 'full' | 'medium' | 'low';
  interiors?: boolean;
  isNear?: boolean;
}

/**
 * Reversible, zero-overhead Level of Detail building container.
 * Preserves 100% of existing models, textures, signage, and silhouettes.
 * Switches seamlessly based on camera distance without removing any asset.
 */
export function BuildingLOD({
  cfg,
  plotId,
  lodTier,
  interiors = true,
  isNear = false,
}: BuildingLODProps) {
  // Proximity lock: When player approaches or interacts, always render Full LOD
  const activeTier = isNear ? 'full' : lodTier;

  // 1. Modular custom buildings
  if (cfg.mode === 'modular') {
    return <ModularBuilding cfg={cfg} />;
  }

  // 2. Central Civic Plaza J Enterprise Landmark
  if (cfg.template === 'jenterprise') {
    return <JEnterpriseLOD />;
  }

  // 3. Central District high-rise commercial headquarters
  if (cfg.template === 'central') {
    if (activeTier === 'low') {
      return <CentralBuildingLow cfg={cfg} plotId={plotId} />;
    }
    return <CentralBuildingFull cfg={cfg} plotId={plotId} />;
  }

  // 4. Bungalow architecture
  if (cfg.template === 'bungalow') {
    if (activeTier === 'low') {
      return <BungalowLow cfg={cfg} />;
    }
    return <Bungalow cfg={cfg} />;
  }

  // 5. Standard commercial storefront architecture (Archetypes 0-5)
  if (activeTier === 'low') {
    return <BuildingLow cfg={cfg} plotId={plotId} />;
  }
  if (activeTier === 'medium') {
    return <BuildingMedium cfg={cfg} plotId={plotId} />;
  }
  return <BuildingFull cfg={cfg} plotId={plotId} quality={interiors} />;
}

