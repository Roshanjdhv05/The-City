'use client';
import * as THREE from 'three';
import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import type { Layout } from '@/lib/layout';
import type { Store, Plot } from '@/lib/types';
import { getPlace } from '@/lib/plots';
import { CitySpatialSystem, CityRenderChunk, liveMetrics } from '@/lib/spatial';
import { BuildingLOD } from './BuildingLOD';
import { JEnterpriseLOD } from './JEnterprise';
import { useUI } from '@/lib/state';

// ── Ambient Occlusion Ground Contact Shadow ───────────────────────────────────
function ChunkBuildingAO({ w, d }: { w: number; d: number }) {
  const t = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 128;
    c.height = 128;
    const g = c.getContext('2d')!;
    const gr = g.createRadialGradient(64, 64, 20, 64, 64, 64);
    gr.addColorStop(0, 'rgba(0,0,0,0.5)');
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr;
    g.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  }, []);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.07, 0]}>
      <planeGeometry args={[w, d]} />
      <meshBasicMaterial
        map={t}
        transparent
        depthWrite={false}
        polygonOffset
        polygonOffsetFactor={-2}
      />
    </mesh>
  );
}

// ── Individual Chunk View Component ───────────────────────────────────────────
interface ChunkGroupViewProps {
  chunk: CityRenderChunk;
  byPlot: Map<string, Store>;
  interiors: boolean;
  nearPlot: string | null;
  lodTier: 'full' | 'medium' | 'low';
}

function ChunkGroupView({
  chunk,
  byPlot,
  interiors,
  nearPlot,
  lodTier,
}: ChunkGroupViewProps) {
  const groupRef = useRef<THREE.Group>(null);

  // Sync group visibility directly in Three.js without React re-render
  useFrame(() => {
    if (groupRef.current) {
      if (groupRef.current.visible !== chunk.visible) {
        groupRef.current.visible = chunk.visible;
      }
    }
  });

  return (
    <group ref={groupRef} name={`chunk-${chunk.id}`}>
      {chunk.plots.map(p => {
        const s = byPlot.get(p.id);
        if (!s) return null; // Empty plots handled by instanced EmptyPlots component

        const pl = getPlace(p, s.config);
        const je = s.config.template === 'jenterprise' && s.config.mode !== 'modular';
        const isNear = nearPlot === p.id;

        return (
          <group key={p.id} position={[p.x, 0, p.z]} rotation={[0, p.rot, 0]}>
            <group position={[pl.ox, 0, pl.oz]} rotation={[0, (pl.rot * Math.PI) / 2, 0]}>
              {!je && <ChunkBuildingAO w={p.w + 3} d={p.d + 3} />}
              {je ? (
                <>
                  <JEnterpriseLOD />
                  {p.landmark && (
                    <Html
                      position={[-0.5, 23, 7]}
                      center
                      distanceFactor={34}
                      zIndexRange={[5, 0]}
                      style={{ pointerEvents: 'none' }}
                    >
                      <div className="loc-label">J Enterprise</div>
                    </Html>
                  )}
                </>
              ) : (
                <BuildingLOD
                  cfg={s.config}
                  plotId={p.id}
                  lodTier={lodTier}
                  interiors={interiors}
                  isNear={isNear}
                />
              )}
            </group>
          </group>
        );
      })}
    </group>
  );
}

// ── Main Spatial City Chunk Renderer ──────────────────────────────────────────
export function CityChunkRenderer({
  layout,
  stores,
  interiors = true,
  viewDistance = 320,
}: {
  layout: Layout;
  stores: Store[];
  interiors?: boolean;
  viewDistance?: number;
}) {
  const { nearPlot } = useUI();
  const byPlot = useMemo(() => new Map(stores.map(s => [s.plotId, s])), [stores]);

  // Spatial partitioning system (instantiated once, cached)
  const spatialSystem = useMemo(
    () => new CitySpatialSystem(layout, stores),
    [layout, stores]
  );

  // Chunk LOD tier states (updated progressively)
  const [chunkLODs, setChunkLODs] = useState<Map<string, 'full' | 'medium' | 'low'>>(() => {
    const map = new Map<string, 'full' | 'medium' | 'low'>();
    spatialSystem.chunks.forEach(c => map.set(c.id, c.isCentral ? 'full' : 'medium'));
    return map;
  });

  const lastUpdateRef = useRef(0);
  const frameCountRef = useRef(0);
  const lastFpsTimeRef = useRef(performance.now());
  const framesSinceFpsRef = useRef(0);

  // Intelligent Visibility & Frustum Culling Loop
  useFrame(({ camera, gl }) => {
    const now = performance.now();
    frameCountRef.current++;
    framesSinceFpsRef.current++;

    // 1. Calculate live FPS & Frame Time every 500ms
    const fpsDelta = now - lastFpsTimeRef.current;
    if (fpsDelta >= 500) {
      liveMetrics.fps = Math.round((framesSinceFpsRef.current * 1000) / fpsDelta);
      liveMetrics.frameTimeMs = parseFloat((fpsDelta / framesSinceFpsRef.current).toFixed(1));
      lastFpsTimeRef.current = now;
      framesSinceFpsRef.current = 0;

      // Update WebGL render diagnostics
      liveMetrics.drawCalls = gl.info.render.calls;
      liveMetrics.triangles = gl.info.render.triangles;
      liveMetrics.geometries = gl.info.memory.geometries;
      liveMetrics.textures = gl.info.memory.textures;

      // Update camera metrics
      liveMetrics.camX = parseFloat(camera.position.x.toFixed(1));
      liveMetrics.camY = parseFloat(camera.position.y.toFixed(1));
      liveMetrics.camZ = parseFloat(camera.position.z.toFixed(1));
      const euler = new THREE.Euler().setFromQuaternion(camera.quaternion, 'YXZ');
      liveMetrics.camYawDeg = Math.round((euler.y * 180) / Math.PI + 360) % 360;
    }

    // 2. Throttled Frustum Culling & Visibility Calculation (runs every 60ms)
    if (now - lastUpdateRef.current > 60) {
      lastUpdateRef.current = now;
      spatialSystem.updateVisibility(camera, nearPlot, viewDistance);

      // Diff check for LOD tier state to minimize React state updates
      let lodChanged = false;
      for (const chunk of spatialSystem.chunks) {
        if (chunkLODs.get(chunk.id) !== chunk.lodTier) {
          lodChanged = true;
          break;
        }
      }

      if (lodChanged) {
        const nextMap = new Map<string, 'full' | 'medium' | 'low'>();
        spatialSystem.chunks.forEach(c => nextMap.set(c.id, c.lodTier));
        setChunkLODs(nextMap);
      }
    }
  });

  return (
    <group name="city-spatial-chunks">
      {spatialSystem.chunks.map(chunk => (
        <ChunkGroupView
          key={chunk.id}
          chunk={chunk}
          byPlot={byPlot}
          interiors={interiors}
          nearPlot={nearPlot}
          lodTier={chunkLODs.get(chunk.id) || 'medium'}
        />
      ))}
    </group>
  );
}

