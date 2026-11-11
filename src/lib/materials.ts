import * as THREE from 'three';

/* ═══════════ Premium Futuristic Architectural Palette ═══════════
   PBR materials: glass-and-steel commercial city aesthetic.
   Pearl white, brushed aluminium, graphite, reflective teal glass. */
export const PALETTE = {
  sky: '#8fd0ff', mint: '#a4dc86', beige: '#f8fafc', terracotta: '#e8957c',
  orange: '#f4a25d', navy: '#0f172a', cream: '#f8fafc', lilac: '#e4ddf0', road: '#1e2233',
};

const cv = (w: number, h: number) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const R = (seed: number) => { let s = seed; return () => ((s = (s * 16807) % 2147483647) / 2147483647); };
const S = 256;

function paint(kind: string): HTMLCanvasElement {
  const c = cv(S, S), g = c.getContext('2d')!, r = R(kind.length * 977 + 13);
  const fill = (col: string) => { g.fillStyle = col; g.fillRect(0, 0, S, S); };
  switch (kind) {
    // Pearl-white panel facade with subtle horizontal joints
    case 'concrete': {
      fill('#f1f5f9');
      g.fillStyle = 'rgba(148,163,184,0.18)'; g.fillRect(0, 63, S, 2); g.fillRect(0, 127, S, 2); g.fillRect(0, 191, S, 2);
      g.fillStyle = 'rgba(148,163,184,0.1)'; g.fillRect(63, 0, 2, S); g.fillRect(127, 0, 2, S); g.fillRect(191, 0, 2, S);
      break;
    }
    // Warm ivory brick
    case 'brick': {
      fill('#f1ece4');
      const bw = 32, bh = 14;
      for (let y = 0; y < S / bh; y++) for (let x = -1; x < S / bw; x++) {
        g.fillStyle = `hsl(30,${22 + r() * 8}%,${88 + r() * 4}%)`;
        g.fillRect(x * bw + (y % 2) * (bw / 2) + 1, y * bh + 1, bw - 2, bh - 2);
      }
      break;
    }
    // Silver stone panels
    case 'stone': {
      fill('#e2e8f0');
      for (let y = 0; y < 4; y++) for (let x = -1; x < 2; x++) {
        g.fillStyle = `hsl(210,${14 + r() * 6}%,${84 + r() * 6}%)`;
        g.fillRect(x * 64 + (y % 2) * 32 + 1.5, y * 64 + 1.5, 61, 61);
      }
      break;
    }
    // Premium teak wood
    case 'wood': {
      for (let x = 0; x < 4; x++) {
        g.fillStyle = `hsl(28,${44 + r() * 8}%,${38 + r() * 8}%)`;
        g.fillRect(x * 64, 0, 63, S);
        g.fillStyle = 'rgba(100,60,20,.14)'; g.fillRect(x * 64 + 8 + r() * 20, 0, 2, S);
      }
      break;
    }
    // Brushed aluminium with horizontal brushing lines
    case 'metal': {
      fill('#b8c4d4');
      for (let y = 0; y < S; y += 3) {
        g.fillStyle = `rgba(255,255,255,${0.04 + r() * 0.08})`;
        g.fillRect(0, y, S, 1);
      }
      break;
    }
    // Graphite dark roof
    case 'roof': {
      fill('#1e293b');
      g.fillStyle = 'rgba(100,120,160,0.12)'; g.fillRect(0, 0, S, S);
      for (let y = 0; y < S; y += 24) {
        g.fillStyle = 'rgba(255,255,255,0.05)'; g.fillRect(0, y, S, 1);
      }
      break;
    }
    // Premium dark asphalt with subtle blue-grey cast
    case 'asphalt': {
      fill('#1a1e2e');
      for (let i = 0; i < 90; i++) {
        g.fillStyle = `rgba(255,255,255,${0.01 + r() * 0.02})`;
        g.fillRect(r() * S, r() * S, 1 + r() * 2, 1);
      }
      break;
    }
    // Light granite pavement with grid joints
    case 'pave': {
      fill('#e8ecf4');
      for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) {
        g.fillStyle = `hsl(210,${12 + r() * 6}%,${88 + r() * 4}%)`;
        g.fillRect(x * 64 + 2, y * 64 + 2, 60, 60);
      }
      g.fillStyle = 'rgba(100,120,160,0.2)';
      for (let y = 0; y < 4; y++) { g.fillRect(0, y * 64, S, 2); }
      for (let x = 0; x < 4; x++) { g.fillRect(x * 64, 0, 2, S); }
      break;
    }
    case 'grass': fill('#6aad54'); break;
  }
  return c;
}

const texCache = new Map<string, THREE.CanvasTexture>();
function tex(kind: string, rx: number, ry: number) {
  const k = `${kind}|${rx}|${ry}`; let t = texCache.get(k);
  if (!t) { t = new THREE.CanvasTexture(paint(kind)); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.anisotropy = 8; t.colorSpace = THREE.SRGBColorSpace; texCache.set(k, t); }
  return t;
}

const matCache = new Map<string, THREE.MeshStandardMaterial>();
/** Premium PBR architectural material. */
export function mat(kind: string, tint = '#ffffff', rx = 1, ry = 1, _clearcoat = 0): THREE.MeshStandardMaterial {
  const key = [kind, tint, rx, ry].join('|'); let m = matCache.get(key); if (m) return m;
  const color = new THREE.Color(tint);
  const roughness = kind === 'asphalt' ? 0.88 : kind === 'metal' ? 0.3 : kind === 'roof' ? 0.75 : 0.72;
  const metalness = kind === 'metal' ? 0.55 : kind === 'asphalt' ? 0.0 : 0.0;
  m = new THREE.MeshStandardMaterial({ map: tex(kind, rx, ry), color, roughness, metalness, envMapIntensity: 0.6 });
  matCache.set(key, m); return m;
}

const glassCache = new Map<string, THREE.MeshStandardMaterial>();
// Premium architectural glass palette - reflective teal/cyan commercial glass
const GLASS: Record<string, { color: string; opacity: number; roughness: number; metalness: number }> = {
  clear:   { color: '#a8d8ea', opacity: 0.45, roughness: 0.06, metalness: 0.15 },
  tinted:  { color: '#38bdf8', opacity: 0.55, roughness: 0.08, metalness: 0.22 },
  blue:    { color: '#0ea5e9', opacity: 0.60, roughness: 0.07, metalness: 0.20 },
  frosted: { color: '#e0f2fe', opacity: 0.72, roughness: 0.35, metalness: 0.05 },
};
export function glassMat(style: string) {
  let m = glassCache.get(style); if (m) return m;
  const g = GLASS[style] || GLASS.clear;
  m = new THREE.MeshStandardMaterial({
    color: g.color, transparent: true, opacity: g.opacity,
    roughness: g.roughness, metalness: g.metalness,
    envMapIntensity: 1.4, depthWrite: false, side: THREE.DoubleSide,
  });
  glassCache.set(style, m); return m;
}

const solids = new Map<string, THREE.MeshStandardMaterial>();
export function solid(key: string): THREE.MeshStandardMaterial {
  let m = solids.get(key); if (m) return m;
  const defs: Record<string, any> = {
    // Pearl white facade panels
    alu:   { color: '#f1f5f9', roughness: 0.45, metalness: 0.08, envMapIntensity: 0.5 },
    // Dark graphite structural core
    dark:  { color: '#0f172a', roughness: 0.65, metalness: 0.25 },
    // Brushed silver steel
    steel: { color: '#94a3b8', roughness: 0.28, metalness: 0.72, envMapIntensity: 0.9 },
    // Warm LED strip (day: off-white, night: warm)
    glow:  { color: '#f8fafc', emissive: '#e2e8f0', emissiveIntensity: 0.3, roughness: 0.9 },
    // Warm ivory facade trim
    white: { color: '#f8fafc', roughness: 0.65 },
    trim:  { color: '#e2e8f0', roughness: 0.55, metalness: 0.05 },
    // Animated water
    water: { color: '#38bdf8', roughness: 0.08, metalness: 0.15, transparent: true, opacity: 0.82, envMapIntensity: 1.2 },
    shrub: { color: '#4f9b40', roughness: 0.88 },
    soil:  { color: '#5a4228', roughness: 1 },
    trunk: { color: '#7c5a38', roughness: 0.95 },
    // Bright lush foliage (white multiplied by per-instance color)
    foliage: { color: '#ffffff', roughness: 0.88 },
    paintWhite: { color: '#f8fafc', roughness: 0.65 },
    // Bright warm lamp head
    lampHead: { color: '#fff8e1', emissive: '#ffdf5a', emissiveIntensity: 0.3, roughness: 0.9 },
    gravel: { color: '#c8c0b0', roughness: 1 },
  };
  m = new THREE.MeshStandardMaterial({ ...defs[key] });
  solids.set(key, m); return m;
}

/** Box geometry with scaled UVs for constant world-space texture density. */
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
  for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#f8fafc' : color; g.fillRect(i * 32, 0, 32, 64); }
  t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 1); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; texCache.set(k, t); return t;
}

/** Premium glass curtain wall facade — teal reflective panels with bright brushed-aluminium mullion grid. */
export function curtainMat(rx = 1, ry = 1): THREE.MeshStandardMaterial {
  const key = `curtain${rx}${ry}`; let m = matCache.get(key); if (m) return m;
  const r = R(99), c = cv(512, 256), e = cv(512, 256), g = c.getContext('2d')!, ge = e.getContext('2d')!;
  // Pearl white mullion grid background
  g.fillStyle = '#e8ecf4'; g.fillRect(0, 0, 512, 256);
  ge.fillStyle = '#000'; ge.fillRect(0, 0, 512, 256);
  const cols = 16, rows = 8, pw = 512 / cols, ph = 256 / rows;
  for (let row = 0; row < rows; row++) for (let col = 0; col < cols; col++) {
    // Teal reflective glass pane with subtle gradient
    const lightness = 48 + r() * 10;
    const saturation = 72 + r() * 15;
    g.fillStyle = `hsl(199,${saturation}%,${lightness}%)`;
    g.fillRect(col * pw + 3, row * ph + 3, pw - 6, ph - 6);
    // Reflective highlight on top-left of each pane
    g.fillStyle = 'rgba(255,255,255,0.45)';
    g.fillRect(col * pw + 4, row * ph + 4, (pw - 8) * 0.45, 5);
    // Warm window light (30% of panes)
    if (r() < 0.3) { ge.fillStyle = '#fff3c4'; ge.fillRect(col * pw + 4, row * ph + 4, pw - 8, ph - 8); }
  }
  const mk = (cc: HTMLCanvasElement, s: boolean) => { const t = new THREE.CanvasTexture(cc); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.anisotropy = 8; if (s) t.colorSpace = THREE.SRGBColorSpace; return t; };
  m = new THREE.MeshStandardMaterial({ map: mk(c, true), emissiveMap: mk(e, false), emissive: '#fffde8', emissiveIntensity: 0.18, roughness: 0.12, metalness: 0.18, envMapIntensity: 1.1 });
  matCache.set(key, m); return m;
}
