import * as THREE from 'three';
import type { Layout } from './layout';
import type { Store, Plot } from './types';
import { CITY, DISTRICTS } from './city';
import { polar } from './geom';
import { isAreaOrChunkExplored } from './exploration';

// ─── Spatial Chunk Definition ────────────────────────────────────────────────
export interface CityRenderChunk {
  id: string;
  name: string;
  cx: number;
  cz: number;
  radius: number;
  sphere: THREE.Sphere;
  isCentral: boolean;
  plots: Plot[];
  stores: Store[];
  visible: boolean;
  lodTier: 'full' | 'medium' | 'low';
  lastSeenTime: number;
}

// ─── Immutable Asset Inventory Registry ──────────────────────────────────────
export interface AssetInventory {
  totalAssets: number;
  buildings: number;
  emptyPlots: number;
  roadsAndPaths: number;
  treesAndForest: number;
  pines: number;
  hedgesAndFlora: number;
  rocks: number;
  streetFurniture: number;
  districtMonuments: number;
  forecourtSculptures: number;
  vehicles: number;
  skyLife: number;
  preservedRatio: number; // 1.0 = 100%
}

// ─── Live Performance Metrics ────────────────────────────────────────────────
export interface PerformanceMetrics {
  fps: number;
  frameTimeMs: number;
  drawCalls: number;
  triangles: number;
  geometries: number;
  textures: number;
  activeChunks: number;
  cachedChunks: number;
  visibleAssets: number;
  totalRegisteredAssets: number;
  camX: number;
  camY: number;
  camZ: number;
  camYawDeg: number;
  activeVehicles: number;
  lodCounts: { full: number; medium: number; low: number; culled: number };
}

export const liveMetrics: PerformanceMetrics = {
  fps: 60,
  frameTimeMs: 16.6,
  drawCalls: 0,
  triangles: 0,
  geometries: 0,
  textures: 0,
  activeChunks: 10,
  cachedChunks: 10,
  visibleAssets: 0,
  totalRegisteredAssets: 0,
  camX: 0,
  camY: 1.8,
  camZ: 0,
  camYawDeg: 0,
  activeVehicles: 12,
  lodCounts: { full: 0, medium: 0, low: 0, culled: 0 },
};

// ─── Build Complete World Asset Inventory ────────────────────────────────────
export function computeAssetInventory(
  layout: Layout,
  stores: Store[],
  propsCount?: { trees: number; pines: number; bushes: number; rocks: number; lamps: number; benches: number }
): AssetInventory {
  const builtCount = stores.length;
  const emptyCount = layout.plots.length - builtCount;
  const roadsCount = layout.roads.length;
  const treesCount = propsCount?.trees || 180;
  const pinesCount = propsCount?.pines || 120;
  const hedgesFloraCount = (propsCount?.bushes || 240) + 120; // shrubs + flowers
  const rocksCount = propsCount?.rocks || 90;
  const furnitureCount = (propsCount?.lamps || 140) + (propsCount?.benches || 80);
  const monumentsCount = 10; // Civic Plaza + 9 District Monuments
  const forecourtCount = 27; // 3 forecourt installations per district * 9
  const vehiclesCount = 12; // Autonomous Traffic Fleet
  const skyLifeCount = 15; // 1 Advert plane + 14 bird flock

  const total =
    builtCount +
    emptyCount +
    roadsCount +
    treesCount +
    pinesCount +
    hedgesFloraCount +
    rocksCount +
    furnitureCount +
    monumentsCount +
    forecourtCount +
    vehiclesCount +
    skyLifeCount;

  return {
    totalAssets: total,
    buildings: builtCount,
    emptyPlots: emptyCount,
    roadsAndPaths: roadsCount,
    treesAndForest: treesCount,
    pines: pinesCount,
    hedgesAndFlora: hedgesFloraCount,
    rocks: rocksCount,
    streetFurniture: furnitureCount,
    districtMonuments: monumentsCount,
    forecourtSculptures: forecourtCount,
    vehicles: vehiclesCount,
    skyLife: skyLifeCount,
    preservedRatio: 1.0,
  };
}

// ─── Spatial Chunk Partitioner ────────────────────────────────────────────────
export class CitySpatialSystem {
  chunks: CityRenderChunk[];
  chunkById: Map<string, CityRenderChunk>;
  chunkByPlotId: Map<string, CityRenderChunk>;
  cachedChunks: Set<string>;
  totalRegisteredAssets: number;

  private _frustum: THREE.Frustum;
  private _projScreenMatrix: THREE.Matrix4;
  private _sphereTarget: THREE.Sphere;

  constructor(layout: Layout, stores: Store[]) {
    this.chunks = [];
    this.chunkById = new Map();
    this.chunkByPlotId = new Map();
    this.cachedChunks = new Set();
    this._frustum = new THREE.Frustum();
    this._projScreenMatrix = new THREE.Matrix4();
    this._sphereTarget = new THREE.Sphere();

    const byPlot = new Map(stores.map(s => [s.plotId, s]));

    // 1. Central Hub Chunk
    const centralPlots = layout.plots.filter(
      p => p.id === 'J01' || p.id.startsWith('C0') || p.district.includes('Civic') || p.district.includes('Central')
    );
    const centralStores = centralPlots.map(p => byPlot.get(p.id)).filter(Boolean) as Store[];
    const centralRadius = CITY.R1 + 25; // ~115m radius
    const centralChunk: CityRenderChunk = {
      id: 'CENTRAL',
      name: 'Civic Plaza & Central Hub',
      cx: 0,
      cz: 0,
      radius: centralRadius,
      sphere: new THREE.Sphere(new THREE.Vector3(0, 8, 0), centralRadius),
      isCentral: true,
      plots: centralPlots,
      stores: centralStores,
      visible: true,
      lodTier: 'full',
      lastSeenTime: performance.now(),
    };
    this.chunks.push(centralChunk);
    this.chunkById.set(centralChunk.id, centralChunk);
    this.cachedChunks.add(centralChunk.id);
    centralPlots.forEach(p => this.chunkByPlotId.set(p.id, centralChunk));

    // 2. 9 Sector District Chunks
    DISTRICTS.forEach((d, k) => {
      const angle = 20 + 40 * k;
      const [cx, cz] = polar((CITY.R1 + CITY.Ro) / 2, angle);
      const distPlots = layout.plots.filter(
        p =>
          p.id.startsWith(d.code) ||
          p.district.toLowerCase().includes(d.name.toLowerCase()) ||
          p.district.toLowerCase().includes(d.cat.toLowerCase())
      );
      const distStores = distPlots.map(p => byPlot.get(p.id)).filter(Boolean) as Store[];
      const distRadius = (CITY.Ro - CITY.R1) / 2 + 45;

      const chunk: CityRenderChunk = {
        id: d.code,
        name: d.name,
        cx,
        cz,
        radius: distRadius,
        sphere: new THREE.Sphere(new THREE.Vector3(cx, 12, cz), distRadius),
        isCentral: false,
        plots: distPlots,
        stores: distStores,
        visible: true,
        lodTier: 'medium',
        lastSeenTime: performance.now(),
      };

      this.chunks.push(chunk);
      this.chunkById.set(chunk.id, chunk);
      this.cachedChunks.add(chunk.id);
      distPlots.forEach(p => this.chunkByPlotId.set(p.id, chunk));
    });

    const inventory = computeAssetInventory(layout, stores);
    this.totalRegisteredAssets = inventory.totalAssets;
    liveMetrics.totalRegisteredAssets = this.totalRegisteredAssets;
  }

  /**
   * Updates chunk visibility using PLAYER XZ position (not camera) for true circular world rendering.
   * The render circle is always centered on the player's feet, regardless of camera angle.
   * Frustum culling is then applied as a secondary optimization on top of the circular filter.
   */
  updateVisibility(
    camera: THREE.Camera,
    nearPlotId: string | null = null,
    viewDistance = 170,
    playerX?: number,
    playerZ?: number
  ): { activeCount: number; visibleAssets: number } {
    this._projScreenMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    this._frustum.setFromProjectionMatrix(this._projScreenMatrix);

    // Use player XZ for circular distance — falls back to camera XZ if not provided
    const pX = playerX ?? camera.position.x;
    const pZ = playerZ ?? camera.position.z;
    const now = performance.now();
    let activeCount = 0;
    let visibleAssets = 0;

    // Render radius matches fog far distance — chunks beyond this are hidden
    const renderRadius = viewDistance;

    const lodCounts = { full: 0, medium: 0, low: 0, culled: 0 };

    for (const chunk of this.chunks) {
      // ── Distance from PLAYER position (XZ plane only) ──────────────────────
      const distToPlayer = Math.hypot(pX - chunk.cx, pZ - chunk.cz);

      // Central chunk: always visible if player is anywhere near the city
      if (chunk.isCentral) {
        chunk.visible = distToPlayer < renderRadius + chunk.radius;
        chunk.lodTier = distToPlayer < 80 ? 'full' : distToPlayer < 160 ? 'medium' : 'low';
        chunk.lastSeenTime = now;
        if (chunk.visible) {
          activeCount++;
          visibleAssets += chunk.plots.length;
          if (chunk.lodTier === 'full') lodCounts.full += chunk.plots.length;
          else lodCounts.medium += chunk.plots.length;
        }
        continue;
      }

      // Proximity override: player physically inside or touching this chunk
      const isPlayerInside = distToPlayer < chunk.radius + 30;
      const isNearActivePlot = chunk.plots.some(p => p.id === nearPlotId);

      // Check if this chunk or market has already been explored
      const isExplored = chunk.isCentral || isAreaOrChunkExplored(chunk.id, chunk.name);

      // ── Circular render distance filter (primary filter for undiscovered areas) ───────────────────
      // A chunk is included if any part of it overlaps the player's circle
      const chunkEdgeDist = distToPlayer - chunk.radius;
      const withinCircle = chunkEdgeDist < renderRadius;

      // ── Camera frustum culling (secondary optimization) ────────────────────
      this._sphereTarget.center.set(chunk.cx, 10, chunk.cz);
      this._sphereTarget.radius = chunk.radius + 24;
      const inFrustum = this._frustum.intersectsSphere(this._sphereTarget);

      // EXPLORED PLACES NEVER VANISH:
      // Once a market/district is explored, it remains permanently visible across long distances!
      // Undiscovered areas only load when the player approaches within circular render radius.
      if (isExplored || (withinCircle && inFrustum) || isPlayerInside || isNearActivePlot) {
        chunk.visible = true;
        chunk.lastSeenTime = now;
        this.cachedChunks.add(chunk.id);
        activeCount++;
        visibleAssets += chunk.plots.length;

        // LOD tiers based on player distance:
        // Explored chunks in the far distance use lightweight low-poly silhouette LOD
        if (distToPlayer < 85 || isPlayerInside || isNearActivePlot) {
          chunk.lodTier = 'full';
          lodCounts.full += chunk.plots.length;
        } else if (distToPlayer < 175) {
          chunk.lodTier = 'medium';
          lodCounts.medium += chunk.plots.length;
        } else {
          chunk.lodTier = 'low';
          lodCounts.low += chunk.plots.length;
        }
      } else {
        chunk.visible = false;
        lodCounts.culled += chunk.plots.length;
      }
    }

    liveMetrics.activeChunks = activeCount;
    liveMetrics.cachedChunks = this.cachedChunks.size;
    liveMetrics.visibleAssets = visibleAssets;
    liveMetrics.lodCounts = lodCounts;

    return { activeCount, visibleAssets };
  }
}

