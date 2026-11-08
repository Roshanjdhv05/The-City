import { Layout } from './layout';
import { Plot } from './types';
import { CITY, DISTRICTS } from './city';
import { polar, D2R } from './geom';

export interface ChunkInfo {
  id: string;
  name: string;
  cx: number;
  cz: number;
  radius: number;
  isCentral: boolean;
  plotIds: string[];
}

export interface CityChunkMap {
  chunks: ChunkInfo[];
  chunkByDistrict: Map<string, ChunkInfo>;
  chunkByPlotId: Map<string, ChunkInfo>;
}

/** Precomputes spatial chunk metadata for the city */
export function buildCityChunks(layout: Layout): CityChunkMap {
  const chunks: ChunkInfo[] = [];
  const chunkByDistrict = new Map<string, ChunkInfo>();
  const chunkByPlotId = new Map<string, ChunkInfo>();

  // 1. Central Hub Chunk (Civic Plaza + Central District ring)
  const centralPlots = layout.plots.filter(
    p => p.id === 'J01' || p.id.startsWith('C0') || p.district.includes('Civic') || p.district.includes('Central')
  );
  const centralChunk: ChunkInfo = {
    id: 'CENTRAL',
    name: 'Civic Plaza & Central Hub',
    cx: 0,
    cz: 0,
    radius: CITY.R1 + 10, // ~100m radius
    isCentral: true,
    plotIds: centralPlots.map(p => p.id),
  };
  chunks.push(centralChunk);
  chunkByDistrict.set('Civic Plaza', centralChunk);
  chunkByDistrict.set('Central District', centralChunk);
  centralPlots.forEach(p => chunkByPlotId.set(p.id, centralChunk));

  // 2. 9 Sector District Chunks
  DISTRICTS.forEach((d, k) => {
    const angle = 20 + 40 * k;
    const [cx, cz] = polar((CITY.R1 + CITY.Ro) / 2, angle); // center of the district band
    const distPlots = layout.plots.filter(
      p => p.id.startsWith(d.code) || p.district.toLowerCase().includes(d.name.toLowerCase()) || p.district.toLowerCase().includes(d.cat.toLowerCase())
    );

    const chunk: ChunkInfo = {
      id: d.code,
      name: d.name,
      cx,
      cz,
      radius: (CITY.Ro - CITY.R1) / 2 + 35,
      isCentral: false,
      plotIds: distPlots.map(p => p.id),
    };

    chunks.push(chunk);
    chunkByDistrict.set(d.code, chunk);
    chunkByDistrict.set(d.name, chunk);
    chunkByDistrict.set(`${d.name} District`, chunk);
    distPlots.forEach(p => chunkByPlotId.set(p.id, chunk));
  });

  return { chunks, chunkByDistrict, chunkByPlotId };
}

/**
 * Calculates which chunks should be active and at what detail level based on camera/player position.
 * Returns:
 * - activeDistricts: set of district codes that should have full props/installations mounted
 * - chunkLODs: map of chunkId -> detail tier ('full' | 'medium' | 'low')
 */
export function getVisibleChunks(
  chunkMap: CityChunkMap,
  camX: number,
  camZ: number,
  viewDist = 260
): { activeDistricts: Set<string>; chunkLODs: Map<string, 'full' | 'medium' | 'low'>; summary: string } {
  const activeDistricts = new Set<string>();
  const chunkLODs = new Map<string, 'full' | 'medium' | 'low'>();

  // Central chunk is always active at least at medium, full if player is near center (< 130m)
  const distToCenter = Math.hypot(camX, camZ);
  chunkLODs.set('CENTRAL', distToCenter < 120 ? 'full' : 'medium');

  let activeCount = 0;

  for (const chunk of chunkMap.chunks) {
    if (chunk.isCentral) continue;

    const d = Math.hypot(camX - chunk.cx, camZ - chunk.cz);

    // If close to district center or if player is near city center and looking outward
    if (d < 165 || (distToCenter < 95 && d < 220)) {
      activeDistricts.add(chunk.id);
      chunkLODs.set(chunk.id, 'full');
      activeCount++;
    } else if (d < viewDist + 40) {
      activeDistricts.add(chunk.id);
      chunkLODs.set(chunk.id, 'medium');
      activeCount++;
    } else {
      chunkLODs.set(chunk.id, 'low');
    }
  }

  const summary = `Active: ${activeCount}/${chunkMap.chunks.length - 1} districts + Central`;
  return { activeDistricts, chunkLODs, summary };
}

