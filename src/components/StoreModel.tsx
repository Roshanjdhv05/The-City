'use client';
import type { StoreConfig } from '@/lib/types';
import { StoreBuilding } from './Building';
import { BungalowLOD } from './Bungalow';
import { JEnterpriseLOD } from './JEnterprise';
import { CentralBuildingLOD } from './CentralBuilding';
import { isExpandedTemplate } from '@/lib/templates';
import { ExpandedBuildingLOD } from './ExpandedBuilding';

/** Picks the right 3D model for a store: landmark tower, bungalow, central district corporate buildings, expanded structures, or standard storefront / modular building. */
export function StoreModel({ cfg, plotId, lodDistance, interiors }: { cfg: StoreConfig; plotId?: string; lodDistance: number; interiors: boolean }) {
  if (cfg.mode !== 'modular' && cfg.template === 'jenterprise') return <JEnterpriseLOD />;
  if (cfg.mode !== 'modular' && cfg.template === 'bungalow') return <BungalowLOD cfg={cfg} lodDistance={lodDistance} />;
  if (cfg.mode !== 'modular' && cfg.template === 'central') return <CentralBuildingLOD cfg={cfg} plotId={plotId} lodDistance={lodDistance} />;
  if (cfg.mode !== 'modular' && isExpandedTemplate(cfg.template)) {
    return <ExpandedBuildingLOD cfg={cfg} plotId={plotId} lodTier="full" interiors={interiors} />;
  }
  return <StoreBuilding cfg={cfg} plotId={plotId} lodDistance={lodDistance} interiors={interiors} />;
}

