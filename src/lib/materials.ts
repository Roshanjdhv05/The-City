import * as THREE from 'three';

/* ═══════════ Warm Stylized Commercial Architectural Palette ═══════════
   Vibrant, warm, premium 3D commercial city aesthetic matching J Enterprise reference.
   Warm peach, terracotta, sandstone, cream, pastel yellow, muted sky blue, deep charcoal roads. */
export const PALETTE = {
  peach: '#E99B78',
  terracotta: '#BD705A',
  sandstone: '#E8CBA5',
  cream: '#F2E5C9',
  yellow: '#EACB75',
  skyBlue: '#86B4C7',
  coral: '#D58B78',
  sage: '#86A879',
  road: '#22242a',
  pave: '#e5dacb',
  grass: '#65a30d',
  roof: '#26282e',
};

const cv = (w: number, h: number) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const R = (seed: number) => { let s = seed; return () => ((s = (s * 16807) % 2147483647) / 2147483647); };
const S = 256;

function paint(kind: string): HTMLCanvasElement {
  const c = cv(S, S), g = c.getContext('2d')!, r = R(kind.length * 977 + 13);
  const fill = (col: string) => { g.fillStyle = col; g.fillRect(0, 0, S, S); };
  switch (kind) {
    // Matte warm-painted exterior wall with cream architectural trim joints
    case 'concrete': {
      fill('#f5ede4');
      g.fillStyle = 'rgba(242,229,201,0.55)'; g.fillRect(0, 63, S, 2); g.fillRect(0, 127, S, 2); g.fillRect(0, 191, S, 2);
      g.fillStyle = 'rgba(213,180,145,0.25)'; g.fillRect(63, 0, 2, S); g.fillRect(127, 0, 2, S); g.fillRect(191, 0, 2, S);
      break;
    }
    // Warm terracotta and sandstone brick
    case 'brick': {
      fill('#e8cba5');
      const bw = 32, bh = 14;
      for (let y = 0; y < S / bh; y++) for (let x = -1; x < S / bw; x++) {
        // Alternating warm terracotta and sandstone brick tones
        const hue = 16 + r() * 12;
        const sat = 35 + r() * 15;
        const lit = 58 + r() * 16;
        g.fillStyle = `hsl(${hue},${sat}%,${lit}%)`;
        g.fillRect(x * bw + (y % 2) * (bw / 2) + 1, y * bh + 1, bw - 2, bh - 2);
      }
      break;
    }
    // Warm sandstone paneling with cream bevels
    case 'stone': {
      fill('#ebdccb');
      for (let y = 0; y < 4; y++) for (let x = -1; x < 2; x++) {
        g.fillStyle = `hsl(34,${25 + r() * 8}%,${78 + r() * 8}%)`;
        g.fillRect(x * 64 + (y % 2) * 32 + 1.5, y * 64 + 1.5, 61, 61);
        g.fillStyle = 'rgba(242,229,201,0.6)';
        g.fillRect(x * 64 + (y % 2) * 32 + 2, y * 64 + 2, 59, 2);
      }
      break;
    }
    // Rich natural warm teak/oak wood
    case 'wood': {
      fill('#a66838');
      for (let x = 0; x < 4; x++) {
        g.fillStyle = `hsl(28,${48 + r() * 10}%,${42 + r() * 8}%)`;
        g.fillRect(x * 64, 0, 63, S);
        g.fillStyle = 'rgba(90,45,15,.22)'; g.fillRect(x * 64 + 6 + r() * 22, 0, 2, S);
        g.fillStyle = 'rgba(230,165,95,.18)'; g.fillRect(x * 64 + 14 + r() * 18, 0, 1.5, S);
      }
      break;
    }
    // Dark bronze / charcoal architectural metal with subtle warm sheen
    case 'metal': {
      fill('#262930');
      for (let y = 0; y < S; y += 3) {
        g.fillStyle = `rgba(235,210,180,${0.02 + r() * 0.05})`;
        g.fillRect(0, y, S, 1);
      }
      break;
    }
    // Deep charcoal slate roof
    case 'roof': {
      fill('#26282e');
      g.fillStyle = 'rgba(180,160,140,0.06)'; g.fillRect(0, 0, S, S);
      for (let y = 0; y < S; y += 24) {
        g.fillStyle = 'rgba(255,255,255,0.06)'; g.fillRect(0, y, S, 1.5);
      }
      break;
    }
    // Clean deep charcoal grey asphalt
    case 'asphalt': {
      fill('#22242a');
      for (let i = 0; i < 90; i++) {
        g.fillStyle = `rgba(255,255,255,${0.015 + r() * 0.025})`;
        g.fillRect(r() * S, r() * S, 1 + r() * 2, 1);
      }
      break;
    }
    // Warm beige and light sandstone paving with clean grid lines
    case 'pave': {
      fill('#e5dacb');
      for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) {
        g.fillStyle = `hsl(36,${22 + r() * 6}%,${84 + r() * 5}%)`;
        g.fillRect(x * 64 + 2, y * 64 + 2, 60, 60);
      }
      g.fillStyle = 'rgba(185,160,130,0.35)';
      for (let y = 0; y < 4; y++) { g.fillRect(0, y * 64, S, 2); }
      for (let x = 0; x < 4; x++) { g.fillRect(x * 64, 0, 2, S); }
      break;
    }
    // Natural vibrant green grass
    case 'grass': fill('#65a30d'); break;
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
  const roughness = kind === 'asphalt' ? 0.90 : kind === 'metal' ? 0.42 : kind === 'roof' ? 0.78 : 0.74;
  const metalness = kind === 'metal' ? 0.45 : kind === 'asphalt' ? 0.0 : 0.0;
  m = new THREE.MeshStandardMaterial({ map: tex(kind, rx, ry), color, roughness, metalness, envMapIntensity: 0.55 });
  matCache.set(key, m); return m;
}

const glassCache = new Map<string, THREE.MeshStandardMaterial>();
// Blue-grey and sky blue reflective commercial glass palette
const GLASS: Record<string, { color: string; opacity: number; roughness: number; metalness: number }> = {
  clear:   { color: '#a0c4d8', opacity: 0.48, roughness: 0.08, metalness: 0.18 },
  tinted:  { color: '#6ba0b8', opacity: 0.56, roughness: 0.08, metalness: 0.22 },
  blue:    { color: '#86B4C7', opacity: 0.60, roughness: 0.07, metalness: 0.20 }, // Muted sky blue
  frosted: { color: '#d8e8f0', opacity: 0.72, roughness: 0.35, metalness: 0.05 },
};
export function glassMat(style: string) {
  let m = glassCache.get(style); if (m) return m;
  const g = GLASS[style] || GLASS.clear;
  m = new THREE.MeshStandardMaterial({
    color: g.color, transparent: true, opacity: g.opacity,
    roughness: g.roughness, metalness: g.metalness,
    envMapIntensity: 1.35, depthWrite: false, side: THREE.DoubleSide,
  });
  glassCache.set(style, m); return m;
}

const solids = new Map<string, THREE.MeshStandardMaterial>();
export function solid(key: string): THREE.MeshStandardMaterial {
  let m = solids.get(key); if (m) return m;
  const defs: Record<string, any> = {
    // Dark bronze / charcoal architectural frames (for window frames, mullions, and trims)
    alu:   { color: '#262930', roughness: 0.65, metalness: 0.35, envMapIntensity: 0.4 },
    // Deep charcoal structural core
    dark:  { color: '#1c1f24', roughness: 0.72, metalness: 0.22 },
    // Charcoal / gunmetal steel
    steel: { color: '#2d313b', roughness: 0.45, metalness: 0.60, envMapIntensity: 0.6 },
    // Warm LED strip (day: warm ivory, night: warm gold)
    glow:  { color: '#fef7e6', emissive: '#fed7aa', emissiveIntensity: 0.32, roughness: 0.85 },
    // Warm cream architectural borders and trim
    white: { color: '#F2E5C9', roughness: 0.65 },
    trim:  { color: '#F2E5C9', roughness: 0.60, metalness: 0.04 },
    // Animated clear blue water
    water: { color: '#38bdf8', roughness: 0.08, metalness: 0.15, transparent: true, opacity: 0.85, envMapIntensity: 1.25 },
    shrub: { color: '#4d8e1f', roughness: 0.88 },
    soil:  { color: '#483424', roughness: 1 },
    trunk: { color: '#7a5232', roughness: 0.95 },
    // Foliage (white multiplied by per-instance color)
    foliage: { color: '#ffffff', roughness: 0.88 },
    paintWhite: { color: '#ffffff', roughness: 0.65 },
    // Bright warm lamp head
    lampHead: { color: '#fff8e1', emissive: '#ffdf5a', emissiveIntensity: 0.35, roughness: 0.9 },
    gravel: { color: '#e8cba5', roughness: 1 },
    // Reference warm accents
    sandstone: { color: '#E8CBA5', roughness: 0.72 },
    cream:     { color: '#F2E5C9', roughness: 0.65 },
    terracotta:{ color: '#BD705A', roughness: 0.75 },
    curbYellow:{ color: '#f5c518', roughness: 0.75 },
    curbBlack: { color: '#1e2229', roughness: 0.80 },
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
  for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#F2E5C9' : color; g.fillRect(i * 32, 0, 32, 64); }
  t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 1); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; texCache.set(k, t); return t;
}

/** Stylized glass curtain wall facade — blue-grey reflective panes with dark bronze / charcoal mullions. */
export function curtainMat(rx = 1, ry = 1): THREE.MeshStandardMaterial {
  const key = `curtain${rx}${ry}`; let m = matCache.get(key); if (m) return m;
  const r = R(99), c = cv(512, 256), e = cv(512, 256), g = c.getContext('2d')!, ge = e.getContext('2d')!;
  // Dark bronze / charcoal mullion grid background
  g.fillStyle = '#262930'; g.fillRect(0, 0, 512, 256);
  ge.fillStyle = '#000'; ge.fillRect(0, 0, 512, 256);
  const cols = 16, rows = 8, pw = 512 / cols, ph = 256 / rows;
  for (let row = 0; row < rows; row++) for (let col = 0; col < cols; col++) {
    // Blue-grey reflective glass pane matching reference image (#86B4C7 tone)
    const lightness = 62 + r() * 8;
    const saturation = 35 + r() * 12;
    g.fillStyle = `hsl(198,${saturation}%,${lightness}%)`;
    g.fillRect(col * pw + 3, row * ph + 3, pw - 6, ph - 6);
    // Subtle reflective highlight on top-left of each pane
    g.fillStyle = 'rgba(255,255,255,0.40)';
    g.fillRect(col * pw + 4, row * ph + 4, (pw - 8) * 0.45, 4);
    // Warm interior light in ~25% of panes
    if (r() < 0.25) { ge.fillStyle = '#fef08a'; ge.fillRect(col * pw + 4, row * ph + 4, pw - 8, ph - 8); }
  }
  const mk = (cc: HTMLCanvasElement, s: boolean) => { const t = new THREE.CanvasTexture(cc); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.anisotropy = 8; if (s) t.colorSpace = THREE.SRGBColorSpace; return t; };
  m = new THREE.MeshStandardMaterial({ map: mk(c, true), emissiveMap: mk(e, false), emissive: '#fff9db', emissiveIntensity: 0.18, roughness: 0.12, metalness: 0.18, envMapIntensity: 1.15 });
  matCache.set(key, m); return m;
}
