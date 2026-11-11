'use client';
import * as THREE from 'three';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { cityTime, getTimePhase } from '@/lib/time';
import { getPlace } from '@/lib/plots';
import { Layout, layoutBounds } from '@/lib/layout';
import { genProps } from '@/lib/props';
import { mat, solid } from '@/lib/materials';
import { QUALITY, Quality } from '@/lib/state';
import { terrainFor } from '@/lib/terrain';
import type { Store } from '@/lib/types';
import { buildCityChunks, getVisibleChunks } from '@/lib/chunks';
import { StoreModel } from './StoreModel';
import { BuildingLow } from './Building';
import { JEnterpriseLOD } from './JEnterprise';
import { SceneLighting, SkyDome } from './Lighting';
import { TerrainMesh, Water, Pines, Rocks, Hedges, ResourceMeshes } from './Scenery';
import { CityRoads, Plaza } from './CityRoads';
import { EmptyPlots } from './EmptyPlots';
import { PlazaDecorations } from './PlazaDecor';
import { MarketPropsManager } from './MarketProps';
import { Inst, Item, UBOX, UCYL } from './Inst';
import { AdvertPlane, BirdFlock } from './CityLife';

function foliageGeo() {
  const g = new THREE.IcosahedronGeometry(1, 1), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), n = 1 + (Math.sin(x * 7.1 + y * 3.3) + Math.sin(z * 5.7 + x * 2.9)) * 0.1; p.setXYZ(i, x * n, y * n * 0.95, z * n); }
  g.computeVertexNormals(); return g;
}
type Props = ReturnType<typeof genProps>;

function Trees({ trees }: { trees: Props['trees'] }) {
  const geo = useMemo(foliageGeo, []);
  const trunk = useMemo<Item[]>(() => trees.map(t => ({ p: [t.x, t.y + 1.4 * t.k, t.z], s: [0.24 * t.k, 2.8 * t.k, 0.24 * t.k] })), [trees]);
  const mk = (ox: number, oy: number, oz: number, sc: number): Item[] => trees.map(t => ({ p: [t.x + ox * t.k, t.y + oy * t.k, t.z + oz * t.k], s: [sc * t.k, sc * 0.85 * t.k, sc * t.k], c: t.c, r: t.x }));
  const A = useMemo(() => mk(0, 3.7, 0, 1.9), [trees]), Bb = useMemo(() => mk(0.8, 3.1, 0.4, 1.35), [trees]), C = useMemo(() => mk(-0.6, 4.7, -0.4, 1.3), [trees]); // eslint-disable-line
  return <>
    <Inst geo={UCYL} material={solid('trunk')} items={trunk} cast />
    {[A, Bb, C].map((it, i) => <Inst key={i} geo={geo} material={solid('foliage')} items={it} cast recv />)}
  </>;
}

function Furniture({ props }: { props: Props }) {
  const { lamps, benches } = props;
  const pole = useMemo<Item[]>(() => lamps.map(l => ({ p: [l.x, 3, l.z], s: [0.07, 6, 0.07] })), [lamps]);
  const arm = useMemo<Item[]>(() => lamps.map(l => ({ p: [l.x + l.dx * 0.7, 6, l.z + l.dz * 0.7], r: Math.atan2(-l.dz, l.dx), s: [1.4, 0.07, 0.07] })), [lamps]);
  const head = useMemo<Item[]>(() => lamps.map(l => ({ p: [l.x + l.dx * 1.35, 5.94, l.z + l.dz * 1.35], r: Math.atan2(-l.dz, l.dx), s: [0.6, 0.1, 0.25] })), [lamps]);
  const off = (b: Props['benches'][0], lx: number, lz: number, y: number, s: [number, number, number]): Item => { const c = Math.cos(b.rot), sn = Math.sin(b.rot); return { p: [b.x + lx * c + lz * sn, y, b.z - lx * sn + lz * c], r: b.rot, s }; };
  const seat = useMemo(() => benches.map(b => off(b, 0.9, 0, 0.5, [1.8, 0.07, 0.5])), [benches]);
  const back = useMemo(() => benches.map(b => off(b, 0.9, 0.24, 0.8, [1.8, 0.45, 0.06])), [benches]);
  const legs = useMemo(() => benches.flatMap(b => [off(b, 0.1, 0, 0.25, [0.08, 0.5, 0.45]), off(b, 1.7, 0, 0.25, [0.08, 0.5, 0.45])]), [benches]);

  // Street light ground glow pools for night
  const poolGeo = useMemo(() => {
    const g = new THREE.PlaneGeometry(8, 8);
    g.rotateX(-Math.PI / 2);
    return g;
  }, []);
  const [poolTex, poolMat] = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 128;
    c.height = 128;
    const g = c.getContext('2d')!;
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, 'rgba(255, 235, 140, 0.7)');
    gr.addColorStop(0.35, 'rgba(255, 205, 80, 0.35)');
    gr.addColorStop(0.7, 'rgba(255, 180, 40, 0.1)');
    gr.addColorStop(1, 'rgba(255, 160, 20, 0.0)');
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
    poolMat.opacity = Math.max(0, darkness * 0.75);
    poolMat.visible = darkness > 0.05;
  });

  const pools = useMemo<Item[]>(
    () => lamps.map(l => ({ p: [l.x + l.dx * 1.35, 0.08, l.z + l.dz * 1.35], s: [1, 1, 1] })),
    [lamps]
  );

  return <>
    <Inst geo={UCYL} material={solid('steel')} items={pole} cast /><Inst geo={UBOX} material={solid('steel')} items={arm} /><Inst geo={UBOX} material={solid('lampHead')} items={head} />
    <Inst geo={poolGeo} material={poolMat} items={pools} recv />
    <Inst geo={UBOX} material={mat('wood', '#8b6248')} items={seat} cast recv /><Inst geo={UBOX} material={mat('wood', '#8b6248')} items={back} cast /><Inst geo={UBOX} material={solid('steel')} items={legs} cast />
  </>;
}

function AO({ w, d }: { w: number; d: number }) {
  const t = useMemo(() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d')!; const gr = g.createRadialGradient(64, 64, 20, 64, 64, 64); gr.addColorStop(0, 'rgba(0,0,0,.5)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); }, []);
  return <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.07, 0]}><planeGeometry args={[w, d]} /><meshBasicMaterial map={t} transparent depthWrite={false} polygonOffset polygonOffsetFactor={-2} /></mesh>;
}

export function World({ stores, layout, quality }: { stores: Store[]; layout: Layout; quality: Quality }) {
  const Q = QUALITY[quality], byPlot = useMemo(() => new Map(stores.map(s => [s.plotId, s])), [stores]);
  const b0 = useMemo(() => layoutBounds(layout, 0), [layout]), terrain = useMemo(() => terrainFor(b0), [b0]);
  const props = useMemo(() => genProps(layout, { trees: Q.trees, forest: Q.forest, radius: Q.radius }, terrain), [layout, Q.trees, Q.forest, Q.radius, terrain]);
  const empty = useMemo(() => layout.plots.filter(p => !byPlot.has(p.id)), [layout, byPlot]), built = useMemo(() => layout.plots.filter(p => byPlot.has(p.id)), [layout, byPlot]);
  const span = Math.max(95, Math.max(b0.x1 - b0.x0, b0.z1 - b0.z0) / 2 + 10), cx = (b0.x0 + b0.x1) / 2, cz = (b0.z0 + b0.z1) / 2;

  // ── Geographic Chunk Loading ──
  const chunkMap = useMemo(() => buildCityChunks(layout), [layout]);
  const [activeDistricts, setActiveDistricts] = useState<Set<string>>(
    () => new Set(['SAS', 'AIM', 'DEV', 'WIN', 'MAC', 'MOB', 'GAM', 'DES', 'MKT'])
  );
  const [chunkLODs, setChunkLODs] = useState<Map<string, 'full' | 'medium' | 'low'>>(() => new Map());
  const lastChunkUpdate = useRef(0);

  useFrame(({ camera }) => {
    const now = performance.now();
    if (now - lastChunkUpdate.current > 300) {
      lastChunkUpdate.current = now;
      const { activeDistricts: nextActive, chunkLODs: nextLODs } = getVisibleChunks(
        chunkMap,
        camera.position.x,
        camera.position.z,
        Q.radius
      );

      // Diff check before re-rendering state
      if (nextActive.size !== activeDistricts.size || [...nextActive].some(d => !activeDistricts.has(d))) {
        setActiveDistricts(nextActive);
        setChunkLODs(nextLODs);
      }
    }
  });

  return (
    <>
      <SkyDome />
      <SceneLighting q={quality} span={span} center={[cx, cz]} />
      <TerrainMesh terrain={terrain} seg={Q.seg} /><Water terrain={terrain} />
      <CityRoads layout={layout} /><Plaza />
      <PlazaDecorations />
      <MarketPropsManager layout={layout} activeDistricts={activeDistricts} />
      <Furniture props={props} /><Trees trees={props.trees} /><Pines pines={props.pines} /><Rocks rocks={props.rocks} /><Hedges bushes={props.bushes} flowers={props.flowers} /><ResourceMeshes nodes={props.resources} />
      <EmptyPlots plots={empty} />
      {/* ── Sky: advert plane + bird flock ── */}
      <AdvertPlane />
      <BirdFlock />
      {built.map(p => {
        const s = byPlot.get(p.id)!, pl = getPlace(p, s.config), je = s.config.template === 'jenterprise' && s.config.mode !== 'modular';
        const chunk = chunkMap.chunkByPlotId.get(p.id);
        const lodTier = chunk ? chunkLODs.get(chunk.id) || 'medium' : 'medium';
        const isDistant = lodTier === 'low' && !je && !p.id.startsWith('C0');

        return (
          <group key={p.id} position={[p.x, 0, p.z]} rotation={[0, p.rot, 0]}>
            <group position={[pl.ox, 0, pl.oz]} rotation={[0, (pl.rot * Math.PI) / 2, 0]}>
              {!je && <AO w={p.w + 3} d={p.d + 3} />}
              {je ? (
                <>
                  <JEnterpriseLOD />
                  {p.landmark && (
                    <Html position={[-0.5, 23, 7]} center distanceFactor={34} zIndexRange={[5, 0]} style={{ pointerEvents: 'none' }}>
                      <div className="loc-label">J Enterprise</div>
                    </Html>
                  )}
                </>
              ) : isDistant ? (
                <BuildingLow cfg={s.config} plotId={p.id} />
              ) : (
                <StoreModel cfg={s.config} plotId={p.id} lodDistance={Q.lod} interiors={Q.interiors} />
              )}
            </group>
          </group>
        );
      })}
    </>
  );
}
