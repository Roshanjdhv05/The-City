'use client';
import * as THREE from 'three';
import { useMemo } from 'react';
import { Layout, layoutBounds } from '@/lib/layout';
import { genProps } from '@/lib/props';
import { solid, mat } from '@/lib/materials';
import { terrainFor } from '@/lib/terrain';
import type { Store, Plot } from '@/lib/types';
import { JEnterpriseLOD } from './JEnterprise';
import { CentralBuildingLow } from './CentralBuilding';
import { BuildingLow } from './Building';
import { BungalowLow } from './Bungalow';
import { SkyDome } from './Lighting';
import { TerrainMesh, Water, Pines, Rocks, Hedges } from './Scenery';
import { CityRoads, Plaza } from './CityRoads';
import { EmptyPlots } from './EmptyPlots';
import { Inst, Item, UCYL, UBOX } from './Inst';
import { AdvertPlane, BirdFlock } from './CityLife';

function PreviewFoliageGeo() {
  const g = new THREE.IcosahedronGeometry(1, 1);
  return g;
}

function PreviewTrees({ trees }: { trees: Array<{ x: number; y: number; z: number; k: number; c: string }> }) {
  const geo = useMemo(PreviewFoliageGeo, []);
  const trunk = useMemo<Item[]>(
    () => trees.map(t => ({ p: [t.x, t.y + 1.4 * t.k, t.z], s: [0.24 * t.k, 2.8 * t.k, 0.24 * t.k] })),
    [trees]
  );
  const crown = useMemo<Item[]>(
    () => trees.map(t => ({ p: [t.x, t.y + 3.4 * t.k, t.z], s: [2.1 * t.k, 1.9 * t.k, 2.1 * t.k], c: t.c })),
    [trees]
  );

  return (
    <>
      <Inst geo={UCYL} material={solid('trunk')} items={trunk} />
      <Inst geo={geo} material={solid('foliage')} items={crown} />
    </>
  );
}

/** Lightweight preview lighting: no shadow maps or complex post-processing */
function PreviewLighting() {
  return (
    <>
      <ambientLight intensity={0.65} />
      <hemisphereLight args={['#d6e6f3', '#e2d6bf', 0.95]} />
      <directionalLight position={[60, 120, 50]} intensity={1.8} castShadow={false} />
    </>
  );
}

/**
 * Lightweight Homepage Preview World
 * Renders a lightweight, high-FPS representation of the city with reduced polygons,
 * simplified buildings, low-detail vegetation, and baked lighting without real-time shadow maps.
 */
export function PreviewWorld({ stores, layout }: { stores: Store[]; layout: Layout }) {
  const byPlot = useMemo(() => new Map(stores.map(s => [s.plotId, s])), [stores]);
  const b0 = useMemo(() => layoutBounds(layout, 0), [layout]);
  const terrain = useMemo(() => terrainFor(b0), [b0]);

  // Use low-detail prop density for preview
  const props = useMemo(
    () => genProps(layout, { trees: 24, forest: 140, radius: 180 }, terrain),
    [layout, terrain]
  );

  const empty = useMemo(() => layout.plots.filter(p => !byPlot.has(p.id)), [layout, byPlot]);
  const built = useMemo(() => layout.plots.filter(p => byPlot.has(p.id)), [layout, byPlot]);

  return (
    <>
      <SkyDome />
      <PreviewLighting />
      <TerrainMesh terrain={terrain} seg={48} />
      <Water terrain={terrain} />
      <CityRoads layout={layout} />
      <Plaza />
      <PreviewTrees trees={props.trees} />
      <Pines pines={props.pines.slice(0, Math.floor(props.pines.length * 0.4))} />
      <Rocks rocks={props.rocks.slice(0, Math.floor(props.rocks.length * 0.4))} />
      <Hedges bushes={props.bushes.slice(0, Math.floor(props.bushes.length * 0.4))} flowers={[]} />
      <EmptyPlots plots={empty} />

      {/* Sky life */}
      <AdvertPlane />
      <BirdFlock />

      {/* Built buildings: simplified massing and clean low-detail representations */}
      {built.map(p => {
        const s = byPlot.get(p.id)!;
        const je = s.config.template === 'jenterprise' && s.config.mode !== 'modular';
        const isCentral = p.id.startsWith('C0');
        const isBungalow = s.config.template === 'bungalow';

        return (
          <group key={p.id} position={[p.x, 0, p.z]} rotation={[0, p.rot, 0]}>
            {je ? (
              <JEnterpriseLOD />
            ) : isCentral ? (
              <CentralBuildingLow cfg={s.config} plotId={p.id} />
            ) : isBungalow ? (
              <BungalowLow cfg={s.config} />
            ) : (
              <BuildingLow cfg={s.config} plotId={p.id} />
            )}
          </group>
        );
      })}
    </>
  );
}

