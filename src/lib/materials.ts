import * as THREE from 'three';

/* ═══════════ Low-poly pastel style ═══════════
   One shared material layer: flat-shaded, soft pastel colours, tiny tiling patterns (no photo textures).
   Every building, road, sidewalk and prop pulls from here so the whole world matches. */
export const PALETTE = {
  sky: '#8fd0ff', mint: '#a4dc86', beige: '#f6ecdf', terracotta: '#e8957c', orange: '#f4a25d', navy: '#2f3b66', cream: '#fff8ee', lilac: '#e4ddf0', road: '#585d78',
};
const cv = (w: number, h: number) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const R = (seed: number) => { let s = seed; return () => ((s = (s * 16807) % 2147483647) / 2147483647); };
const S = 128;

function paint(kind: string): HTMLCanvasElement {
  const c = cv(S, S), g = c.getContext('2d')!, r = R(kind.length * 977 + 13);
  const fill = (col: string) => { g.fillStyle = col; g.fillRect(0, 0, S, S); };
  switch (kind) {
    case 'concrete': fill('#e3d5bf'); g.fillStyle = '#cdbda3'; g.fillRect(0, 62, S, 3); g.fillRect(62, 0, 3, S); break;
    case 'brick': { fill('#d9b9a6'); const bw = 16, bh = 8; for (let y = 0; y < S / bh; y++) for (let x = -1; x < S / bw; x++) { g.fillStyle = `hsl(${11 + r() * 6},${46 + r() * 8}%,${50 + r() * 6}%)`; g.fillRect(x * bw + (y % 2) * (bw / 2) + 1, y * bh + 1, bw - 2, bh - 2); } break; }
    case 'stone': { fill('#a89678'); for (let y = 0; y < 4; y++) for (let x = -1; x < 2; x++) { g.fillStyle = `hsl(34,${22 + r() * 8}%,${64 + r() * 6}%)`; g.fillRect(x * 64 + (y % 2) * 32 + 1.5, y * 32 + 1.5, 61, 29); } break; }
    case 'wood': for (let x = 0; x < 4; x++) { g.fillStyle = `hsl(28,${38 + r() * 8}%,${44 + r() * 8}%)`; g.fillRect(x * 32, 0, 31, S); g.fillStyle = 'rgba(120,70,30,.12)'; g.fillRect(x * 32 + 8 + r() * 14, 0, 2, S); } break;
    case 'metal': fill('#8597ab'); g.fillStyle = '#6f8196'; g.fillRect(0, 0, S, 3); g.fillRect(0, 62, S, 3); g.fillRect(0, 0, 3, S); g.fillRect(62, 0, 3, S); break;
    case 'roof': { fill('#8f4a38'); for (let y = 0; y < 8; y++) for (let x = -1; x < 4; x++) { g.fillStyle = `hsl(12,${42 + r() * 6}%,${40 + r() * 5}%)`; g.fillRect(x * 32 + (y % 2) * 16 + 1, y * 16 + 1, 30, 14); } break; }
    case 'asphalt': fill('#454a5c'); break;
    case 'pave': fill('#aaa092'); for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) { g.fillStyle = `hsl(32,${10 + r() * 4}%,${72 + r() * 4}%)`; g.fillRect(x * 64 + 2, y * 64 + 2, 60, 60); } break;
    case 'grass': fill('#7fb866'); break;
  }
  return c;
}

const texCache = new Map<string, THREE.CanvasTexture>();
function tex(kind: string, rx: number, ry: number) {
  const k = `${kind}|${rx}|${ry}`; let t = texCache.get(k);
  if (!t) { t = new THREE.CanvasTexture(paint(kind)); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.anisotropy = 4; t.colorSpace = THREE.SRGBColorSpace; texCache.set(k, t); }
  return t;
}
const matCache = new Map<string, THREE.MeshStandardMaterial>();
/** Flat pastel material; `tint` multiplies the base colour (kept soft so every tint stays pastel). */
export function mat(kind: string, tint = '#ffffff', rx = 1, ry = 1, _clearcoat = 0): THREE.MeshStandardMaterial {
  const key = [kind, tint, rx, ry].join('|'); let m = matCache.get(key); if (m) return m;
  const color = new THREE.Color(tint).lerp(new THREE.Color('#ffffff'), 0.4);
  m = new THREE.MeshStandardMaterial({ map: tex(kind, rx, ry), color, roughness: 0.92, metalness: 0, flatShading: true, envMapIntensity: 0.35 });
  matCache.set(key, m); return m;
}

const glassCache = new Map<string, THREE.MeshStandardMaterial>();
const GLASS: Record<string, { color: string; opacity: number }> = { clear: { color: '#a3cfe8', opacity: 0.5 }, tinted: { color: '#64809f', opacity: 0.64 }, blue: { color: '#74add8', opacity: 0.55 }, frosted: { color: '#dce7ef', opacity: 0.78 } };
export function glassMat(style: string) {
  let m = glassCache.get(style); if (m) return m; const g = GLASS[style] || GLASS.clear;
  m = new THREE.MeshStandardMaterial({ color: g.color, transparent: true, opacity: g.opacity, roughness: 0.25, metalness: 0.05, envMapIntensity: 0.9, depthWrite: false, flatShading: true });
  glassCache.set(style, m); return m;
}

const solids = new Map<string, THREE.MeshStandardMaterial>();
export function solid(key: string): THREE.MeshStandardMaterial {
  let m = solids.get(key); if (m) return m;
  const defs: Record<string, any> = {
    alu: { color: '#e6dfd0', roughness: 0.7 }, dark: { color: '#2f3752', roughness: 0.8 }, steel: { color: '#56627c', roughness: 0.7 },
    glow: { color: '#ffe7b5', emissive: '#ffcf7a', emissiveIntensity: 0.65, roughness: 0.9 }, white: { color: '#e9e4da', roughness: 0.85 }, trim: { color: '#efe6d4', roughness: 0.85 },
    water: { color: '#5fb0d8', roughness: 0.3, transparent: true, opacity: 0.88 }, shrub: { color: '#4f9f4a', roughness: 0.95 }, soil: { color: '#6f5238', roughness: 1 },
    trunk: { color: '#8b5a36', roughness: 1 }, foliage: { color: '#ffffff', roughness: 0.95 }, paintWhite: { color: '#f0f0ec', roughness: 0.8 },
    lampHead: { color: '#fff6d8', emissive: '#ffe9a8', emissiveIntensity: 1.4 }, gravel: { color: '#bfb299', roughness: 1 },
  };
  m = new THREE.MeshStandardMaterial({ flatShading: true, ...defs[key] }); solids.set(key, m); return m;
}

/** Box geometry whose UVs are in metres/unit so patterns keep a constant world scale. */
const geoCache = new Map<string, THREE.BoxGeometry>();
export function sbox(w: number, h: number, d: number, unit = 3) {
  const k = [w, h, d, unit].join(','); let g = geoCache.get(k);
  if (!g) {
    g = new THREE.BoxGeometry(w, h, d); const uv = g.attributes.uv as THREE.BufferAttribute;
    const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
    for (let f = 0; f < 6; f++) for (let i = 0; i < 4; i++) { const ix = f * 4 + i; uv.setXY(ix, (uv.getX(ix) * dims[f][0]) / unit, (uv.getY(ix) * dims[f][1]) / unit); }
    geoCache.set(k, g);
  }
  return g;
}

export function stripeTex(color: string) {
  const k = 'stripe' + color; let t = texCache.get(k); if (t) return t;
  const c = cv(256, 64), g = c.getContext('2d')!;
  for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#fffaf2' : color; g.fillRect(i * 32, 0, 32, 64); }
  t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 1); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; texCache.set(k, t); return t;
}

/** Pastel glass-panel facade for towers (white frames, sky-blue panes, a few warm windows). */
export function curtainMat(rx = 1, ry = 1): THREE.MeshStandardMaterial {
  const key = `curtain${rx}${ry}`; let m = matCache.get(key); if (m) return m;
  const r = R(99), c = cv(256, 128), e = cv(256, 128), g = c.getContext('2d')!, ge = e.getContext('2d')!;
  g.fillStyle = '#e8dfcd'; g.fillRect(0, 0, 256, 128); ge.fillStyle = '#000'; ge.fillRect(0, 0, 256, 128);
  for (let y = 0; y < 4; y++) for (let x = 0; x < 8; x++) {
    g.fillStyle = `hsl(205,${44 + r() * 8}%,${56 + r() * 8}%)`; g.fillRect(x * 32 + 3, y * 32 + 3, 26, 26);
    g.fillStyle = 'rgba(255,255,255,.55)'; g.fillRect(x * 32 + 5, y * 32 + 5, 10, 4);
    if (r() < 0.3) { ge.fillStyle = '#ffe9a8'; ge.fillRect(x * 32 + 4, y * 32 + 4, 24, 24); }
  }
  const mk = (cc: HTMLCanvasElement, s: boolean) => { const t = new THREE.CanvasTexture(cc); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.anisotropy = 4; if (s) t.colorSpace = THREE.SRGBColorSpace; return t; };
  m = new THREE.MeshStandardMaterial({ map: mk(c, true), emissiveMap: mk(e, true), emissive: '#ffffff', emissiveIntensity: 0.35, roughness: 0.5, flatShading: true });
  matCache.set(key, m); return m;
}
