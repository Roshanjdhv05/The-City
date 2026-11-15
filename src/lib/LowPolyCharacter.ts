// @ts-nocheck
export interface CharacterColors {
  skin?: string | number;
  hair?: string | number;
  beard?: string | number;
  eyeWhite?: string | number;
  iris?: string | number;
  pupil?: string | number;
  shirt?: string | number;
  button?: string | number;
  pants?: string | number;
  stitch?: string | number;
  belt?: string | number;
  buckle?: string | number;
  shoe?: string | number;
  sole?: string | number;
  laces?: string | number;
  [key: string]: any;
}

export interface CharacterConfig {
  height?: number;
  hairStyle?: 'short' | 'buzz' | 'long' | 'bun' | 'none' | string;
  facialHair?: 'full' | 'goatee' | 'moustache' | 'none' | string;
  colors?: CharacterColors;
}

/**
 * LowPolyCharacter.js  (v2 - anatomical rebuild)
 * Same public API as v1, so existing preview / player integration keeps working:
 *   new LowPolyCharacter(config, {walkSpeed, runSpeed}); .group; .update(dt,{speed,grounded,turnRate});
 *   .setConfig({...}); .dispose(); randomConfig();
 *
 * What changed: every body part is a loft with non-elliptical cross-sections.
 * Each ring carries m = [front, back, side] bulge factors, which sculpt pecs, shoulder blades, deltoids,
 * biceps/triceps, quads, hamstrings, glutes, calves, kneecaps, brow ridge, jaw, etc.
 * Origin = feet (y=0), faces +Z, character's left = +X. One SkinnedMesh, one material, vertex colours.
 */
import * as THREE from 'three';

const TAU = Math.PI * 2;
const MODEL_HEIGHT = 1.91;
const hash = (a, b) => { const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); };
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const damp = (a, b, k, dt) => lerp(a, b, 1 - Math.exp(-k * dt));

/* ------------------------------------------------------------------ config */
export const DEFAULT_CONFIG = {
  height: 1.8,
  hairStyle: 'short',     // 'short' | 'buzz' | 'long' | 'bun' | 'none'
  facialHair: 'full',     // 'full' | 'goatee' | 'moustache' | 'none'
  colors: {
    skin: 0xd9a577, hair: 0x3a2116, beard: 0x3a2116,
    eyeWhite: 0xf4f4f0, iris: 0x3d9be0, pupil: 0x111111,
    shirt: 0x69cfe3, button: 0xf2f6f8,
    pants: 0x1d4a7a, stitch: 0x8db4da, belt: 0x1c1c1c, buckle: 0xb8b8b8,
    shoe: 0xf1f1ee, sole: 0x2b2b2e, laces: 0xffffff,
  },
};
const SKIN_TONES = [0xf1c9a5, 0xe0ac7e, 0xc68a5b, 0x9b6540, 0x6e4529, 0x4a2f1d];
const HAIR_COLS = [0x16110e, 0x3a2116, 0x6b4426, 0xb08a4a, 0x8a2f1c, 0x9a9a9a];
const SHIRT_COLS = [0x69cfe3, 0xe05a4f, 0x5aa469, 0xf0c04a, 0x8a6bd1, 0xeeeeee, 0x2f3a4a];
const PANT_COLS = [0x1d4a7a, 0x2b2b30, 0x6b5a45, 0x3d5a3a, 0x7a2e3a];
const pick = (a, r) => a[Math.floor(r() * a.length) % a.length];

export function randomConfig(rng = Math.random) {
  const hair = pick(HAIR_COLS, rng);
  return {
    hairStyle: pick(['short', 'short', 'buzz', 'long', 'bun', 'none'], rng),
    facialHair: pick(['full', 'goatee', 'moustache', 'none', 'none'], rng),
    colors: { skin: pick(SKIN_TONES, rng), hair, beard: hair, shirt: pick(SHIRT_COLS, rng), pants: pick(PANT_COLS, rng) },
  };
}
const mergeConfig = (base, patch = {}) => ({ ...base, ...patch, colors: { ...base.colors, ...(patch.colors || {}) } });

/* ---------------------------------------------------------------- skeleton */
const BONES = [
  ['hips', -1, [0, .95, 0]], ['spine', 0, [0, 1.05, 0]], ['chest', 1, [0, 1.25, 0]],
  ['neck', 2, [0, 1.50, 0]], ['head', 3, [0, 1.60, 0]],
  ['upperArmL', 2, [.20, 1.40, 0]], ['foreArmL', 5, [.230, 1.15, 0]], ['handL', 6, [.248, .90, 0]],
  ['upperArmR', 2, [-.20, 1.40, 0]], ['foreArmR', 8, [-.230, 1.15, 0]], ['handR', 9, [-.248, .90, 0]],
  ['upLegL', 0, [.092, .92, 0]], ['lowLegL', 11, [.092, .50, 0]], ['footL', 12, [.092, .07, 0]],
  ['upLegR', 0, [-.092, .92, 0]], ['lowLegR', 14, [-.092, .50, 0]], ['footR', 15, [-.092, .07, 0]],
];
const SIDE = {
  L: { s: 1, arm: [5, 6, 7], leg: [11, 12, 13] },
  R: { s: -1, arm: [8, 9, 10], leg: [14, 15, 16] },
};

/* ----------------------------------------------------------- loft builder */
const R = (c, a, b, w, m) => ({ c, a, b, w, m });
const W = (i) => [[i, 1]];

class Builder {
  constructor() { this.pos = []; this.idx = []; this.si = []; this.sw = []; this.partOf = []; this.n = 0; }
  vert(part, p, w) {
    this.pos.push(p[0], p[1], p[2]);
    const ws = w.slice(0, 4); let tot = 0; ws.forEach((e) => (tot += e[1]));
    for (let i = 0; i < 4; i++) { const e = ws[i]; this.si.push(e ? e[0] : 0); this.sw.push(e ? e[1] / tot : 0); }
    this.partOf.push(part);
    return this.n++;
  }
  /**
   * Loft through rings. axis 'y': a = x-radius, b = z-radius, theta 0 = front(+z).
   * axis 'z': a = x-radius, b = y-radius, theta 0 = top.
   * ring.m = [front, back, side] radial bulge factors (anatomy). arc = open shell [a0,a1].
   */
  tube({ part, rings, axis = 'y', sides = 8, arc = null, caps = [0, 0], jit = 0, seed = 1 }) {
    const open = !!arc, nv = open ? sides + 1 : sides, rows = [];
    rings.forEach((r, i) => {
      const row = [];
      for (let k = 0; k < nv; k++) {
        const th = open ? arc[0] + (arc[1] - arc[0]) * k / sides : (k / sides) * TAU;
        const ct = Math.cos(th), st = Math.sin(th);
        let f = jit ? 1 + (hash(i * 13.7 + seed, k) - .5) * 2 * jit : 1;
        if (r.m) f *= 1 + r.m[0] * Math.max(0, ct) ** 2 + r.m[1] * Math.max(0, -ct) ** 2 + r.m[2] * st * st;
        const x = st * r.a * f, v = ct * r.b * f;
        const p = axis === 'y' ? [r.c[0] + x, r.c[1], r.c[2] + v] : [r.c[0] + x, r.c[1] + v, r.c[2]];
        row.push(this.vert(part, p, r.w));
      }
      rows.push(row);
    });
    const K = open ? nv - 1 : nv;
    for (let i = 0; i < rows.length - 1; i++) {
      for (let k = 0; k < K; k++) {
        const a = rows[i][k], b = rows[i][(k + 1) % nv], c = rows[i + 1][k], d = rows[i + 1][(k + 1) % nv];
        this.idx.push(a, b, c, b, d, c);
      }
    }
    caps.forEach((on, e) => {
      if (!on) return;
      const ri = e ? rows.length - 1 : 0, r = rings[ri], ctr = this.vert(part, r.c, r.w), row = rows[ri];
      for (let k = 0; k < K; k++) this.idx.push(ctr, row[k], row[(k + 1) % nv]);
    });
  }
}

// Row tables are ascending in y: [y, a, b, cz, front, back, side, weights]
function rowAt(t, y) {
  const n = t.length;
  if (y <= t[0][0]) return t[0].slice();
  if (y >= t[n - 1][0]) return t[n - 1].slice();
  let i = 0; while (y > t[i + 1][0]) i++;
  const u = (y - t[i][0]) / (t[i + 1][0] - t[i][0]), A = t[i], B = t[i + 1];
  return A.map((v, k) => (typeof v === 'number' ? lerp(v, B[k], u) : (u < .5 ? v : B[k])));
}
const ringOf = (r, cx = 0, off = 0, dy = 0) => R([cx, r[0] + dy, r[3]], r[1] + off, r[2] + off, r[7], [r[4], r[5], r[6]]);
const frontZ = (r) => r[2] * (1 + r[4]) + r[3];
const tab = (pairs, x) => { // linear lookup in [[x,v],...] ascending
  if (x <= pairs[0][0]) return pairs[0][1];
  for (let i = 0; i < pairs.length - 1; i++) if (x <= pairs[i + 1][0]) return lerp(pairs[i][1], pairs[i + 1][1], (x - pairs[i][0]) / (pairs[i + 1][0] - pairs[i][0]));
  return pairs[pairs.length - 1][1];
};
/** Point on a ring-table surface at angle th (0 = front). */
const surf = (r, cx, th, off = .004) => {
  const ct = Math.cos(th), f = 1 + r[4] * Math.max(0, ct) ** 2 + r[5] * Math.max(0, -ct) ** 2 + r[6] * Math.sin(th) ** 2;
  return [cx + Math.sin(th) * (r[1] * f + off), r[0], r[3] + ct * (r[2] * f + off)];
};
/** Thin stitch / crease line following a 3D polyline. */
function line(b, part, pts, w, r = .0038) {
  b.tube({ part, sides: 3, rings: pts.map((p, i) => R(p, r, r, typeof w === 'function' ? w(i) : w)) });
}

/* ------------------------------------------------------------ data tables */
const TORSO = [
  [.985, .158, .100, 0, 0, 0, 0, [[0, .5], [1, .5]]],
  [1.04, .160, .103, 0, .02, 0, 0, W(1)],
  [1.12, .168, .108, 0, .03, .01, 0, W(1)],
  [1.20, .182, .115, 0, .05, .02, 0, [[1, .5], [2, .5]]],
  [1.28, .195, .122, .002, .07, .03, 0, W(2)],
  [1.34, .200, .122, 0, .06, .06, 0, W(2)],
  [1.385, .200, .112, -.004, .03, .05, 0, W(2)],
  [1.425, .170, .095, -.006, 0, .03, 0, W(2)],
  [1.46, .115, .078, -.004, 0, 0, 0, [[2, .7], [3, .3]]],
  [1.49, .075, .066, 0, 0, 0, 0, [[2, .5], [3, .5]]],
];
const PELVIS = [
  [.79, .150, .104, 0, 0, .04, 0, W(0)],
  [.84, .172, .112, 0, 0, .09, 0, W(0)],
  [.90, .178, .114, 0, 0, .08, 0, W(0)],
  [.945, .166, .106, 0, .02, .04, 0, [[0, .7], [1, .3]]],
  [.985, .158, .100, 0, 0, 0, 0, [[0, .5], [1, .5]]],
];
const armX = (y) => (y >= 1.15 ? lerp(.230, .200, (y - 1.15) / .25) : lerp(.248, .230, (y - .9) / .25));
const armRows = (sd) => {
  const [u, f] = sd.arm;
  return [
    [.915, .043, .044, .004, 0, 0, 0, W(f)], [.955, .041, .042, .004, 0, 0, 0, W(f)],
    [.99, .043, .047, .004, .03, 0, 0, W(f)], [1.05, .048, .052, .004, .06, 0, 0, W(f)],
    [1.105, .048, .052, .004, 0, .02, 0, W(f)], [1.15, .046, .050, .004, -.05, .07, 0, [[u, .5], [f, .5]]],
    [1.185, .047, .050, .004, .02, .04, 0, [[u, .7], [f, .3]]], [1.22, .052, .054, .004, .07, .06, 0, W(u)],
    [1.29, .057, .057, .004, .05, .05, 0, W(u)], [1.355, .062, .060, .004, 0, .03, .05, [[2, .2], [u, .8]]],
    [1.405, .058, .058, .002, 0, 0, .04, [[2, .5], [u, .5]]], [1.445, .035, .035, 0, 0, 0, 0, W(2)],
  ];
};
const legRows = (sd) => {
  const [ul, ll, ft] = sd.leg;
  return [
    [.075, .045, .050, 0, 0, 0, 0, [[ll, .5], [ft, .5]]], [.11, .041, .046, 0, 0, 0, 0, W(ll)],
    [.18, .046, .054, -.002, 0, .03, 0, W(ll)], [.28, .054, .064, -.004, 0, .08, 0, W(ll)],
    [.36, .060, .072, -.006, 0, .14, 0, W(ll)], [.43, .060, .068, -.003, 0, .09, 0, W(ll)],
    [.485, .062, .066, 0, .02, .03, 0, [[ul, .3], [ll, .7]]], [.52, .064, .068, 0, .07, 0, 0, [[ul, .6], [ll, .4]]],
    [.57, .068, .076, 0, .03, .02, 0, [[ul, .85], [ll, .15]]], [.65, .080, .090, 0, .06, .03, 0, W(ul)],
    [.76, .092, .100, 0, .05, .04, 0, W(ul)], [.84, .100, .106, 0, .03, .06, 0, W(ul)],
    [.92, .102, .108, 0, .02, .08, 0, [[0, .3], [ul, .7]]],
  ];
};
const HEAD = [ // y, a, b, cz, front, back, side
  [1.598, .022, .030, .056, 0, 0, 0, [[3, .35], [4, .65]]], [1.612, .050, .052, .046, .05, 0, 0, [[3, .2], [4, .8]]],
  [1.640, .074, .078, .026, .04, .02, .06, W(4)], [1.668, .084, .092, .014, .02, .03, .05, W(4)],
  [1.700, .090, .100, .010, 0, .05, .03, W(4)], [1.735, .092, .104, .008, 0, .06, 0, W(4)],
  [1.775, .088, .104, .005, .03, .06, 0, W(4)], [1.810, .078, .098, .002, 0, .05, 0, W(4)],
  [1.840, .058, .080, -.004, 0, .04, 0, W(4)], [1.862, .034, .056, -.008, 0, .03, 0, W(4)],
  [1.872, .012, .020, -.010, 0, 0, 0, W(4)],
];

/* ----------------------------------------------------------------- torso */
function buildTorso(b) {
  // shirt body (14-sided for rounded but faceted chest/back)
  b.tube({ part: 'shirt', sides: 14, caps: [0, 1], jit: .012, seed: 3, rings: TORSO.map((r) => ringOf(r)) });
  // tucked-waist gather folds + hem stitch
  for (const [y, o] of [[1.003, .004], [1.024, .003]]) {
    const r0 = rowAt(TORSO, y), r1 = rowAt(TORSO, y + .006);
    b.tube({ part: 'seam', sides: 8, arc: [-1.25, 1.25], rings: [ringOf(r0, 0, o), ringOf(r1, 0, o + .001)] });
  }
  // collar stand + two collar leaves
  b.tube({ part: 'shirt', sides: 12, jit: .008, seed: 9, rings: [
    R([0, 1.482, 0], .082, .074, [[2, .5], [3, .5]]), R([0, 1.512, .002], .066, .064, W(3)), R([0, 1.538, .004], .070, .067, W(3)),
  ] });
  for (const arc of [[.12, 1.25], [-1.25, -.12]]) {
    b.tube({ part: 'shirt', sides: 4, arc, rings: [
      R([0, 1.538, .004], .071, .068, W(3)), R([0, 1.505, .004], .090, .082, [[2, .5], [3, .5]]), R([0, 1.466, .002], .122, .088, W(2)),
    ] });
  }
  // button placket + buttons
  const ys = []; for (let y = 1.462; y >= .99; y -= .04) ys.push(y);
  b.tube({ part: 'cuff', sides: 4, rings: ys.slice().reverse().map((y) => { const r = rowAt(TORSO, y); return R([0, y, frontZ(r) + .0015], .012, .0042, r[7]); }) });
  [1.42, 1.34, 1.26, 1.18, 1.10, 1.02].forEach((y) => {
    const r = rowAt(TORSO, y), z = frontZ(r);
    b.tube({ part: 'button', axis: 'z', sides: 6, caps: [1, 1], rings: [R([0, y, z + .002], .0065, .0065, r[7]), R([0, y, z + .0075], .0055, .0055, r[7])] });
  });
  // shoulder seams (both sides) and armhole seams
  for (const s of [1, -1]) {
    const pts = [1.466, 1.447, 1.424, 1.395].map((y) => { const r = rowAt(TORSO, y); return [s * r[1] * .975, y, r[3] - .004]; });
    line(b, 'seam', pts, W(2));
  }
  // neck
  b.tube({ part: 'skin', sides: 10, caps: [0, 1], rings: [
    R([0, 1.44, 0], .078, .074, W(2)), R([0, 1.48, .002], .060, .060, [[2, .5], [3, .5]]),
    R([0, 1.53, .008], .051, .055, W(3)), R([0, 1.58, .014], .049, .056, [[3, .5], [4, .5]]),
    R([0, 1.625, .024], .049, .058, W(4)),
  ] });
}

/* ------------------------------------------------------------------ arms */
function buildArms(b) {
  for (const sd of [SIDE.L, SIDE.R]) {
    const s = sd.s, [u, f, h] = sd.arm, rows = armRows(sd);
    const ring = (r, off = 0, dy = 0) => ringOf(r, s * armX(r[0] + dy), off, dy);
    // sleeve (starts above cuff), with fabric wrinkle jitter
    b.tube({ part: 'shirt', sides: 12, caps: [0, 1], jit: .016, seed: 20 + s, rings: rows.slice(1).map((r) => ring(r)) });
    // cuff band
    b.tube({ part: 'cuff', sides: 12, caps: [0, 0], rings: [ring(rows[0], .004), ring(rows[1], .005)] });
    b.tube({ part: 'seam', sides: 12, rings: [ring(rows[1], .0055, .0), ring(rowAt(rows, .957), .0055)] });
    // inner-elbow creases + armhole seam
    for (const y of [1.17, 1.13]) {
      b.tube({ part: 'seam', sides: 6, arc: [-1.35, 1.35], rings: [ring(rowAt(rows, y), .003), ring(rowAt(rows, y + .005), .0035)] });
    }
    b.tube({ part: 'seam', sides: 12, rings: [ring(rowAt(rows, 1.372), .0035), ring(rowAt(rows, 1.378), .0035)] });
    hand(b, sd);
  }
}

function hand(b, sd) {
  const s = sd.s, [, f, h] = sd.arm, H = W(h), cx = s * .248;
  // palm with wrist, thenar heel and knuckle line. Relaxed pose: palm faces the thigh, thumb forward.
  const palm = [
    [.940, .022, .030, 0, 0, 0, 0, [[f, .5], [h, .5]]], [.905, .022, .036, .004, .10, 0, 0, H],
    [.870, .021, .040, .003, .05, 0, 0, H], [.835, .0185, .042, 0, 0, 0, 0, H], [.808, .0165, .040, 0, 0, 0, 0, H],
  ];
  b.tube({ part: 'skin', sides: 8, caps: [0, 1], rings: palm.map((r) => ringOf(r, cx + s * .002)) });
  // four fingers: three phalanges each, progressive inward curl, wider at the knuckles
  const L = [.076, .084, .078, .062], Z = [.027, .009, -.009, -.026];
  for (let i = 0; i < 4; i++) {
    const curl = 1 + .12 * i, segs = [.46, .30, .24], ang = [.20, .55, .85].map((a) => a * curl), rad = [.0092, .0086, .0078, .0066];
    let x = cx + s * .002, y = .808; const rings = [R([x, y, Z[i]], rad[0], rad[0], H)];
    for (let k = 0; k < 3; k++) {
      const len = L[i] * segs[k]; x -= s * Math.sin(ang[k]) * len; y -= Math.cos(ang[k]) * len;
      rings.push(R([x, y, Z[i]], rad[k + 1], rad[k + 1], H));
    }
    b.tube({ part: 'skin', sides: 6, caps: [0, 1], rings });
  }
  // thumb: metacarpal + 2 phalanges pointing forward and slightly inward
  b.tube({ part: 'skin', sides: 6, caps: [0, 1], rings: [
    R([cx - s * .004, .885, .030], .0125, .0125, H), R([cx - s * .010, .850, .047], .0108, .0108, H),
    R([cx - s * .020, .825, .058], .0098, .0098, H), R([cx - s * .030, .804, .060], .0078, .0078, H),
  ] });
}

/* ------------------------------------------------------------------ legs */
function buildLegs(b) {
  // pelvis with glute volume, waistband, loops, buckle, pockets
  b.tube({ part: 'pants', sides: 14, caps: [1, 1], jit: .008, seed: 5, rings: PELVIS.map((r) => ringOf(r)) });
  b.tube({ part: 'belt', sides: 14, rings: [
    R([0, .943, 0], .171, .110, [[0, .7], [1, .3]], [0, .04, 0]), R([0, .985, 0], .163, .104, [[0, .5], [1, .5]], [0, .02, 0]),
  ] });
  for (const th of [.42, -.42, 1.25, -1.25, 2.55, -2.55, Math.PI]) {
    const a = .168, bb = .108, x = Math.sin(th) * (a + .002), z = Math.cos(th) * (bb + .002) * (th === Math.PI ? 1.0 : 1);
    b.tube({ part: 'belt', sides: 4, rings: [R([x, .941, z], .007, .006, [[0, .7], [1, .3]]), R([x, .991, z], .007, .006, [[0, .5], [1, .5]])] });
  }
  b.tube({ part: 'buckle', axis: 'z', sides: 8, caps: [1, 1], rings: [R([0, .965, .104], .021, .017, W(0)), R([0, .965, .1135], .021, .017, W(0))] });
  b.tube({ part: 'belt', axis: 'z', sides: 6, caps: [1, 1], rings: [R([0, .965, .1125], .012, .009, W(0)), R([0, .965, .1165], .012, .009, W(0))] });
  for (const s of [1, -1]) {
    // front pocket opening + back pocket outline
    line(b, 'stitch', [[.50, .975], [.62, .94], [.78, .905], [1.0, .878]].map(([th, y]) => surf(rowAt(PELVIS, y), 0, s * th, .004)), W(0), .0033);
    const bp = [[2.45, .93], [2.45, .865], [2.95, .865], [2.95, .93]].map(([th, y]) => surf(rowAt(PELVIS, y), 0, s * th, .004));
    line(b, 'stitch', [...bp, bp[0]], W(0), .0032);
  }

  for (const sd of [SIDE.L, SIDE.R]) {
    const s = sd.s, [ul, ll, ft] = sd.leg, x0 = s * .092, rows = legRows(sd);
    b.tube({ part: 'pants', sides: 12, caps: [0, 1], jit: .01, seed: 30 + s, rings: rows.map((r) => ringOf(r, x0)) });
    // outer + inner seams
    for (const side of [1, -1]) {
      const sr = rows.slice(1);
      line(b, 'stitch', sr.map((r) => [x0 + side * r[1] * .968, r[0], r[3]]), (i) => sr[i][7], .0038);
    }
    // knee creases (front arcs), ankle stack (full rings), inseam fold lines
    for (const [y, dy] of [[.56, .004], [.535, .004], [.51, .003]]) {
      b.tube({ part: 'pantsDark', sides: 6, arc: [-1.25, 1.25], rings: [ringOf(rowAt(rows, y), x0, .003), ringOf(rowAt(rows, y + dy), x0, .0035)] });
    }
    for (const y of [.125, .15, .175]) {
      b.tube({ part: 'pantsDark', sides: 12, rings: [ringOf(rowAt(rows, y), x0, .0025), ringOf(rowAt(rows, y + .005), x0, .003)] });
    }
    for (const [t0, t1] of [[.55, .95], [.75, 1.15]]) {
      line(b, 'pantsDark', [.86, .82, .78, .73].map((y, i) => surf(rowAt(rows, y), x0, -s * lerp(t0, t1, i / 3), .003)), W(ul), .0042);
    }

    // sneaker: layered construction
    const F = W(ft), x = x0;
    const SH = [[-.082, .050, .032, .038], [-.065, .056, .038, .046], [-.035, .062, .042, .052], [0, .056, .045, .047], [.04, .050, .048, .040],
      [.08, .043, .050, .034], [.12, .038, .050, .030], [.165, .032, .045, .025], [.205, .028, .035, .019], [.225, .026, .022, .012]];
    b.tube({ part: 'shoe', axis: 'z', sides: 10, caps: [1, 1], jit: .006, seed: 40 + s, rings: SH.map(([z, cy, a, bb]) => R([x, cy, z], a, bb, F)) });
    b.tube({ part: 'sole', axis: 'z', sides: 8, caps: [1, 1], rings: [[-.090, .034], [-.03, .046], [.06, .052], [.15, .047], [.235, .030]].map(([z, a]) => R([x, .008, z], a, .008, F)) });
    b.tube({ part: 'midsole', axis: 'z', sides: 8, caps: [1, 1], rings: [[-.088, .036], [-.03, .048], [.06, .054], [.15, .049], [.232, .032]].map(([z, a]) => R([x, .021, z], a, .0105, F)) });
    // toe cap (rubber) and heel pull tab
    b.tube({ part: 'tongue', axis: 'z', sides: 10, caps: [1, 1], rings: SH.slice(7).map(([z, cy, a, bb]) => R([x, cy, z], a + .0025, bb + .0025, F)) });
    b.tube({ part: 'shoeTrim', sides: 6, caps: [1, 1], rings: [R([x, .092, -.086], .014, .007, F), R([x, .120, -.084], .014, .007, F)] });
    // side stitching lines (outer + inner)
    const stz = [-.07, -.03, .02, .07, .12, .17], sa = SH.map((r) => [r[0], r[2]]), sc = SH.map((r) => [r[0], r[1]]);
    for (const side of [1, -1]) {
      line(b, 'shoeStitch', stz.map((z) => [x + side * tab(sa, z) * .955, tab(sc, z) + .006, z]), F, .0032);
    }
    // tongue, laces and lace bars
    const top = (z) => tab(SH.map((r) => [r[0], r[1] + r[3]]), z);
    b.tube({ part: 'tongue', axis: 'z', sides: 6, caps: [1, 1], rings: [-.035, -.01, .02, .05].map((z, i) => R([x, top(z) + [.016, .013, .009, .004][i], z], .021, .0055, F)) });
    for (const z of [.012, .036, .06, .084, .108]) {
      b.tube({ part: 'laces', axis: 'z', sides: 4, caps: [1, 1], rings: [R([x, top(z) - .0035, z - .004], .024, .0036, F), R([x, top(z) - .0035, z + .004], .024, .0036, F)] });
    }
    b.tube({ part: 'laces', axis: 'z', sides: 4, caps: [1, 1], rings: [.06, .09, .125].map((z) => R([x, top(z) + .0005, z], .009, .0032, F)) });
  }
}

/* ------------------------------------------------------------ head & face */
const headRing = (y, off = 0, cz = 0) => { const r = rowAt(HEAD, y); return R([0, y, r[3] + cz], r[1] + off, r[2] + off, W(4), [r[4], r[5], r[6]]); };

function buildHead(b, cfg) {
  const H = W(4);
  b.tube({ part: 'skin', sides: 14, caps: [1, 1], jit: .004, seed: 2, rings: HEAD.map((r) => ringOf(r)) });
  const beardOn = cfg.facialHair === 'full' || cfg.facialHair === 'goatee';
  for (const s of [1, -1]) {
    // ear: helix rim + lobe
    b.tube({ part: 'skin', axis: 'z', sides: 8, caps: [1, 1], rings: [
      R([s * .093, 1.738, -.016], .006, .020, H), R([s * .100, 1.745, -.002], .0075, .027, H), R([s * .094, 1.738, .014], .005, .019, H),
    ] });
    b.tube({ part: 'skin', sides: 5, caps: [0, 1], rings: [R([s * .094, 1.722, -.002], .005, .008, H), R([s * .093, 1.707, 0], .0045, .006, H)] });
    // eyeball + lids + iris + pupil + brow
    const ex = s * .036;
    b.tube({ part: 'eyeWhite', axis: 'z', sides: 8, caps: [1, 1], rings: [R([ex, 1.745, .090], .0135, .009, H), R([ex, 1.745, .1035], .0135, .009, H)] });
    b.tube({ part: 'iris', axis: 'z', sides: 8, caps: [1, 1], rings: [R([ex, 1.745, .1025], .0082, .0082, H), R([ex, 1.745, .1085], .0082, .0082, H)] });
    b.tube({ part: 'pupil', axis: 'z', sides: 6, caps: [1, 1], rings: [R([ex, 1.745, .1075], .0042, .0042, H), R([ex, 1.745, .1110], .0042, .0042, H)] });
    b.tube({ part: 'skin', axis: 'z', sides: 6, caps: [1, 1], rings: [R([ex, 1.7535, .091], .0155, .0042, H), R([ex, 1.7535, .1060], .0155, .0046, H)] });
    b.tube({ part: 'skin', axis: 'z', sides: 6, caps: [1, 1], rings: [R([ex, 1.7365, .091], .0135, .0032, H), R([ex, 1.7365, .1040], .0135, .0034, H)] });
    b.tube({ part: 'hair', axis: 'z', sides: 4, caps: [1, 1], rings: [R([s * .038, 1.7755, .088], .023, .0048, H), R([s * .036, 1.7775, .1010], .0215, .0048, H)] });
    // nostril wing
    b.tube({ part: 'skin', axis: 'z', sides: 5, caps: [1, 1], rings: [R([s * .013, 1.709, .116], .0065, .0065, H), R([s * .013, 1.709, .126], .0075, .0065, H)] });
  }
  // nose bridge + tip
  b.tube({ part: 'skin', axis: 'z', sides: 4, caps: [0, 1], rings: [
    R([0, 1.752, .098], .006, .010, H), R([0, 1.735, .113], .009, .011, H), R([0, 1.715, .129], .013, .010, H), R([0, 1.705, .134], .0155, .008, H),
  ] });
  // lips: upper + lower
  const fz = frontZ(rowAt(HEAD, 1.665)) + (beardOn ? .011 : 0);
  b.tube({ part: 'lips', axis: 'z', sides: 6, caps: [1, 1], rings: [R([0, 1.6735, fz - .008], .023, .0052, H), R([0, 1.6735, fz + .004], .0215, .0056, H)] });
  b.tube({ part: 'lips', axis: 'z', sides: 6, caps: [1, 1], rings: [R([0, 1.6565, fz - .008], .020, .0058, H), R([0, 1.6565, fz + .005], .0185, .0064, H)] });
  facialHair(b, cfg.facialHair);
  hair(b, cfg.hairStyle);
}

function facialHair(b, style) {
  if (style === 'none') return;
  const H = W(4), full = style === 'full', goatee = style === 'goatee';
  if (full || goatee) {
    const ys = full ? [1.598, 1.625, 1.648, 1.672, 1.70, 1.735] : [1.598, 1.62, 1.642, 1.664];
    const rings = [R([0, 1.572, .064], .034, .045, H)].concat(ys.map((y) => headRing(y, .011)));
    b.tube({ part: 'beard', sides: full ? 14 : 8, arc: full ? [-2.15, 2.15] : [-.8, .8], jit: .012, seed: 4, rings });
  }
  if (full || style === 'moustache') {
    const fz = frontZ(rowAt(HEAD, 1.69)) + (full ? .011 : 0);
    b.tube({ part: 'beard', axis: 'z', sides: 6, caps: [1, 1], rings: [R([0, 1.692, fz - .012], .032, .0075, H), R([0, 1.690, fz + .005], .030, .0085, H)] });
  }
}

function hair(b, style) {
  if (style === 'none') return;
  const H = W(4), buzz = style === 'buzz', o = buzz ? .004 : .012;
  const cap = R([0, 1.886, -.008], .02, .03, H);
  b.tube({ part: 'hair', sides: 12, arc: [.9, TAU - .9], caps: [0, 1], jit: .01, seed: 6, rings: [1.755, 1.79, 1.82, 1.85, 1.872].map((y) => headRing(y, o)).concat(cap) });
  b.tube({ part: 'hair', sides: 6, arc: [-.9, .9], caps: [0, 1], jit: .01, seed: 7, rings: [1.805, 1.835, 1.862].map((y) => headRing(y, o + .002)).concat(R([0, 1.884, 0], .02, .03, H)) });
  b.tube({ part: 'hair', sides: 8, arc: [2.1, TAU - 2.1], rings: [1.69, 1.725, 1.76].map((y) => headRing(y, o + .002)) });
  for (const s of [1, -1]) { // sideburns
    b.tube({ part: 'hair', sides: 5, caps: [0, 1], rings: [R([s * .088, 1.76, .0], .008, .03, H), R([s * .090, 1.725, .0], .008, .026, H), R([s * .088, 1.690, .004], .006, .018, H)] });
  }
  if (buzz) return;
  if (style === 'short' || style === 'bun') { // swept volume built from three layered locks
    [[-.032, .018, 1.883], [0, .024, 1.895], [.032, .018, 1.883]].forEach(([x, a, ytop], i) => {
      b.tube({ part: 'hair', axis: 'z', sides: 8, caps: [1, 1], jit: .02, seed: 8 + i, rings: [
        R([x, 1.872, -.025], a, .018, H), R([x, ytop, .04], a + .004, .024, H), R([x, ytop - .006, .09], a + .002, .021, H), R([x * .8, 1.866, .118], a - .004, .015, H),
      ] });
    });
  }
  if (style === 'bun') {
    b.tube({ part: 'hair', sides: 10, caps: [0, 1], jit: .02, seed: 15, rings: [
      R([0, 1.88, -.045], .014, .014, H), R([0, 1.902, -.045], .036, .034, H), R([0, 1.928, -.045], .045, .042, H), R([0, 1.956, -.045], .040, .038, H), R([0, 1.976, -.045], .022, .020, H),
    ] });
    b.tube({ part: 'belt', sides: 10, rings: [R([0, 1.890, -.045], .0385, .0365, H), R([0, 1.900, -.045], .0385, .0365, H)] });
  }
  if (style === 'long') {
    const N = W(4), M = [[3, .5], [4, .5]];
    b.tube({ part: 'hair', sides: 12, arc: [2.0, TAU - 2.0], jit: .015, seed: 11, rings: [
      R([0, 1.78, -.02], .106, .108, N), R([0, 1.68, -.03], .104, .098, N), R([0, 1.58, -.04], .098, .09, M), R([0, 1.48, -.045], .09, .08, [[2, .4], [3, .6]]),
    ] });
    for (const s of [1, -1]) {
      b.tube({ part: 'hair', sides: 5, caps: [0, 1], rings: [R([s * .092, 1.74, -.01], .012, .034, N), R([s * .096, 1.66, -.02], .012, .03, N), R([s * .09, 1.56, -.03], .010, .026, M)] });
    }
  }
}

function buildGeometry(cfg) {
  const b = new Builder();
  buildTorso(b); buildArms(b); buildLegs(b); buildHead(b, cfg);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(b.pos, 3));
  g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(b.si, 4));
  g.setAttribute('skinWeight', new THREE.Float32BufferAttribute(b.sw, 4));
  g.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(b.n * 3), 3));
  g.setIndex(b.idx);
  g.computeVertexNormals();
  return { geometry: g, partOf: b.partOf };
}

/* -------------------------------------------------------------- character */
const MATERIAL = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: .85, metalness: 0, side: THREE.DoubleSide });

export class LowPolyCharacter {
  constructor(config = {}, motion = {}) {
    this.config = mergeConfig(DEFAULT_CONFIG, config);
    this.motion = { walkSpeed: 1.6, runSpeed: 5, ...motion };
    this.group = new THREE.Group();
    this.group.name = 'LowPolyCharacter';
    this.bones = BONES.map(([name]) => { const bn = new THREE.Bone(); bn.name = name; return bn; });
    BONES.forEach(([, p, w], i) => {
      const pw = p < 0 ? [0, 0, 0] : BONES[p][2];
      this.bones[i].position.set(w[0] - pw[0], w[1] - pw[1], w[2] - pw[2]);
      if (p >= 0) this.bones[p].add(this.bones[i]);
    });
    this.group.add(this.bones[0]);
    this.group.updateMatrixWorld(true);
    this.skeleton = new THREE.Skeleton(this.bones);
    this._hipsY = this.bones[0].position.y;
    this._s = { t: 0, phase: 0, speed: 0, air: 0, lean: 0, land: 0, wasAir: false };
    this.mesh = null;
    this._rebuild();
  }

  setConfig(patch = {}) {
    const styleChanged = (patch.hairStyle && patch.hairStyle !== this.config.hairStyle) ||
      (patch.facialHair && patch.facialHair !== this.config.facialHair);
    this.config = mergeConfig(this.config, patch);
    if (patch.height) this._applyScale();
    if (styleChanged) this._rebuild(); else this._paint();
  }
  _applyScale() { this.group.scale.setScalar(this.config.height / MODEL_HEIGHT); }

  _rebuild() {
    if (this.mesh) { this.group.remove(this.mesh); this.mesh.geometry.dispose(); }
    const { geometry, partOf } = buildGeometry(this.config);
    this._partOf = partOf;
    this.mesh = new THREE.SkinnedMesh(geometry, MATERIAL);
    this.mesh.name = 'LowPolyCharacterMesh';
    this.mesh.frustumCulled = false;
    this.mesh.castShadow = true; this.mesh.receiveShadow = true;
    this.group.add(this.mesh);
    this.mesh.bind(this.skeleton, new THREE.Matrix4());
    this._applyScale();
    this._paint();
  }

  _paint() {
    const c = this.config.colors, C = (k) => new THREE.Color(c[k] ?? 0xff00ff);
    const mul = (k, f) => C(k).multiplyScalar(f);
    const pal = {
      lips: C('skin').lerp(new THREE.Color(0xa3473f), .45),
      seam: mul('shirt', .74), cuff: mul('shirt', .9), pantsDark: mul('pants', .72),
      midsole: mul('shoe', .96), tongue: mul('shoe', .92), shoeTrim: mul('shoe', .68), shoeStitch: mul('shoe', .72),
    };
    const cache = {}, attr = this.mesh.geometry.attributes.color, a = attr.array;
    for (let i = 0; i < this._partOf.length; i++) {
      const p = this._partOf[i], k = (cache[p] ||= pal[p] || C(p));
      a[i * 3] = k.r; a[i * 3 + 1] = k.g; a[i * 3 + 2] = k.b;
    }
    attr.needsUpdate = true;
  }

  /** speed m/s, grounded bool, turnRate rad/s. Landing is detected automatically. */
  update(dt, { speed = 0, grounded = true, turnRate = 0, strideScale = 1 } = {}) {
    const s = this._s, B = this.bones, { walkSpeed, runSpeed } = this.motion;
    s.t += dt;
    s.speed = damp(s.speed, speed, 12, dt);
    s.air = damp(s.air, grounded ? 0 : 1, 14, dt);
    s.lean = damp(s.lean, clamp(turnRate * .04, -.18, .18), 8, dt);
    if (!grounded) s.wasAir = s.air > .3 || s.wasAir; else if (s.wasAir) { s.land = 1; s.wasAir = false; }
    s.land = damp(s.land, 0, 7, dt);

    const m = smooth(.05, .9, s.speed), rb = smooth(walkSpeed * 1.15, runSpeed, s.speed);
    const cycle = lerp(1.45, 3.0, rb) * strideScale;
    s.phase = (s.phase + TAU * s.speed * dt / cycle) % TAU;
    const ph = s.phase, air = s.air, land = s.land;
    const legAmp = lerp(.42, .8, rb), armAmp = lerp(.38, .9, rb), kneeAmp = lerp(.8, 1.25, rb);
    const lean = (.03 + .17 * rb) * m + .12 * land;

    B[0].position.y = this._hipsY - (.014 + .03 * rb) * m * Math.sin(ph) ** 2 - .07 * land;
    B[0].rotation.set(0, -.10 * Math.sin(ph) * m, 0);
    B[1].rotation.set(lean * .5, .06 * Math.sin(ph) * m, 0);
    B[2].rotation.set(lean * .5 + Math.sin(s.t * 1.8) * .012 * (1 - m), .09 * Math.sin(ph) * m, -s.lean);
    B[3].rotation.set(-lean * .3, 0, 0);
    B[4].rotation.set(-lean * .4, Math.sin(s.t * .7) * .03 * (1 - m), 0);

    for (const [sd, off, airHip, airKnee, airArm] of [[SIDE.L, 0, -.8, 1.2, -.9], [SIDE.R, Math.PI, -.25, .6, -.7]]) {
      const p = ph + off, sn = Math.sin(p), cs = Math.cos(p);
      const hip = -legAmp * sn * m - .3 * land, knee = m * (.12 + kneeAmp * Math.max(0, cs)) + .6 * land;
      const hipV = lerp(hip, airHip, air), kneeV = lerp(knee, airKnee, air);
      B[sd.leg[0]].rotation.set(hipV, 0, 0);
      B[sd.leg[1]].rotation.set(kneeV, 0, 0);
      B[sd.leg[2]].rotation.set(-(hipV + kneeV) * .7, 0, 0);
      const swing = armAmp * sn * m;
      const elbow = -(lerp(.12, 1.25, rb) * m + .3 * Math.max(0, -sn) * m + .1 * (1 - m));
      B[sd.arm[0]].rotation.set(lerp(swing, airArm, air), 0, sd.s * lerp(.06, .5, air));
      B[sd.arm[1]].rotation.set(lerp(elbow, -.5, air), 0, 0);
      B[sd.arm[2]].rotation.set(0, 0, 0);
    }
  }

  dispose() {
    if (this.mesh) { this.mesh.geometry.dispose(); this.group.remove(this.mesh); this.mesh = null; }
    this.skeleton.dispose();
    this.group.removeFromParent();
  }
}
