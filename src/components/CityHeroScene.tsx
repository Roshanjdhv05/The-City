'use client';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export default function CityHeroScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const zoomControlsRef = useRef<{ zoomIn: () => void; zoomOut: () => void; reset: () => void } | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const cv = document.createElement('canvas');
    cv.style.width = '100%';
    cv.style.height = '100%';
    cv.style.display = 'block';
    cv.style.cursor = 'grab';
    cv.style.touchAction = 'none';
    container.appendChild(cv);

    // Renderer with transparent background (no bg color, blends into hero)
    const R = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true });
    R.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    R.shadowMap.enabled = true;
    R.shadowMap.type = THREE.PCFSoftShadowMap;
    R.outputColorSpace = THREE.SRGBColorSpace;

    const S = new THREE.Scene();
    // No background color so it is completely transparent

    // Orthographic camera
    const cam = new THREE.OrthographicCamera(-30, 30, 20, -20, 1, 350);

    // Dynamic Camera Spherical Coordinates for full 3D rotation, pitch (up/down) and zoom
    const R_DIST = 96;
    let yaw = Math.PI / 4; // Horizontal angle (45 deg)
    let pitch = 0.76;      // Vertical angle (elevation ~43 deg)
    let zoom = 1.0;        // Zoom multiplier

    function updateCamera() {
      cam.position.x = R_DIST * Math.cos(pitch) * Math.sin(yaw);
      cam.position.y = R_DIST * Math.sin(pitch);
      cam.position.z = R_DIST * Math.cos(pitch) * Math.cos(yaw);
      cam.lookAt(0, -1, 0);
      cam.zoom = zoom;
      cam.updateProjectionMatrix();
    }
    updateCamera();

    // Lights
    const hemi = new THREE.HemisphereLight(0xffffff, 0x9db7a0, 0.95);
    S.add(hemi);

    const sun = new THREE.DirectionalLight(0xfff3dc, 1.25);
    sun.position.set(28, 45, 18);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.bias = -0.0005;
    Object.assign(sun.shadow.camera, {
      left: -36,
      right: 36,
      top: 36,
      bottom: -36,
      near: 1,
      far: 140,
    });
    S.add(sun);

    const fillLight = new THREE.DirectionalLight(0xbfdbfe, 0.5);
    fillLight.position.set(-30, 25, -20);
    S.add(fillLight);

    const W = new THREE.Group();
    S.add(W);

    const M = (c: number, o?: THREE.MeshLambertMaterialParameters) =>
      new THREE.MeshLambertMaterial(Object.assign({ color: c }, o || {}));

    function rnd(a: number) {
      a = (a * 9301 + 49297) % 233280;
      return a / 233280;
    }

    function box(
      w: number,
      h: number,
      d: number,
      c: number | THREE.Material | THREE.Material[],
      x: number,
      y: number,
      z: number,
      p?: THREE.Group
    ) {
      const mat = Array.isArray(c)
        ? c
        : c instanceof THREE.Material
        ? c
        : M(c);
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      m.position.set(x, y, z);
      m.castShadow = true;
      m.receiveShadow = true;
      (p || W).add(m);
      return m;
    }

    function flat(g: THREE.BufferGeometry, c: number, y: number) {
      const m = new THREE.Mesh(g, M(c));
      m.rotation.x = -Math.PI / 2;
      m.position.y = y;
      m.receiveShadow = true;
      W.add(m);
      return m;
    }

    const TAU = Math.PI * 2;
    const IR = 29.5;

    // ── Floating Island Pedestal ────────────────────────────────
    const isl = new THREE.Mesh(new THREE.CylinderGeometry(IR, IR - 0.6, 0.7, 128), M(0x74c24d));
    isl.position.y = -0.35;
    isl.receiveShadow = true;
    W.add(isl);

    const soil = new THREE.Mesh(new THREE.CylinderGeometry(IR, IR - 5, 3, 128), M(0x6b4a35));
    soil.position.y = -2.2;
    soil.receiveShadow = true;
    W.add(soil);

    const soil2 = new THREE.Mesh(new THREE.CylinderGeometry(IR - 5, IR - 9, 2.4, 128), M(0x5a3d2b));
    soil2.position.y = -4.9;
    soil2.receiveShadow = true;
    W.add(soil2);

    // ── Roads ───────────────────────────────────────────────────
    const asph = 0x3a404c;
    const sw = 0xcdd3da;
    const roads = [7, 14, 21, 28];
    const SEC = 12;

    for (let k = 0; k < SEC; k++) {
      const a = (k / SEC) * Math.PI;
      (
        [
          [1.9, sw, 0.07],
          [1.3, asph, 0.09],
        ] as [number, number, number][]
      ).forEach(([w, c, y]) => {
        const m = box(w, 0.1, 2 * 28 + 1.9, c, 0, y, 0);
        m.rotation.y = a;
        m.castShadow = false;
      });
    }

    roads.forEach((r) => {
      flat(new THREE.RingGeometry(r - 0.95, r + 0.95, 128), sw, 0.11);
      flat(new THREE.RingGeometry(r - 0.65, r + 0.65, 128), asph, 0.13);
    });

    flat(new THREE.CircleGeometry(6.2, 96), 0x74c24d, 0.15);
    flat(new THREE.CircleGeometry(5.4, 96), 0x7fcb52, 0.16);
    flat(new THREE.CircleGeometry(4, 96), 0xe6d4b4, 0.17);

    // ── Dashed Road Markings ─────────────────────────────────────
    const dm = new THREE.Matrix4();
    const qq = new THREE.Quaternion();
    const ee = new THREE.Euler();
    const sc = new THREE.Vector3();
    const ps = new THREE.Vector3();

    function place(
      I: THREE.InstancedMesh,
      i: number,
      x: number,
      y: number,
      z: number,
      sx: number,
      sy: number,
      sz: number,
      ry: number
    ) {
      ee.set(0, ry, 0);
      qq.setFromEuler(ee);
      ps.set(x, y, z);
      sc.set(sx, sy, sz);
      dm.compose(ps, qq, sc);
      I.setMatrixAt(i, dm);
    }

    const dl: [number, number, number, number][] = [];
    roads.forEach((r) => {
      const n = Math.floor((TAU * r) / 1.7);
      for (let i = 0; i < n; i++) {
        const a = (i / n) * TAU;
        dl.push([Math.cos(a) * r, Math.sin(a) * r, 0.55, -(a + Math.PI / 2)]);
      }
    });

    for (let k = 0; k < SEC; k++) {
      const a = (k / SEC) * TAU;
      for (let r = 7.8; r < 27; r += 1.7) {
        if (roads.some((q) => Math.abs(q - r) < 1.3)) continue;
        dl.push([Math.cos(a) * r, Math.sin(a) * r, 0.55, -a]);
      }
    }

    const DI = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 0.02, 0.08), M(0xffffff), dl.length);
    dl.forEach((d, i) => place(DI, i, d[0], 0.15, d[1], d[2], 1, 1, d[3]));
    W.add(DI);

    // ── 7 Detailed Building Types (Instanced) ───────────────────
    const wallC = [0xe2c79a, 0xd9a066, 0xb5523b, 0xcdbba0, 0xa9795c, 0xe8e4da, 0xc9d6e6, 0x9fb3a0];
    const roofC = [0xb8412f, 0xa5392a, 0xc9553a, 0x8f3a2c, 0x4a5668, 0x6b5a4a];
    const GL = 0x7fb8e6;
    const DR = 0x5a3a28;
    const TRM = 0xf2efe8;
    const DK = 0x59606d;
    const GR = 0x8a919c;

    type PartDef = [string, number, number, number, number, number, number, any];
    function wd(L: PartDef[], pts: [number, number][], z: number, w: number, h: number, c?: number) {
      pts.forEach((p) => {
        L.push(['b', w, h, 0.05, p[0], p[1], z, c || GL]);
        L.push(['b', w, h, 0.05, p[0], p[1], -z, c || GL]);
      });
    }

    const TY: PartDef[][] = [];
    const TW = [1.9, 1.9, 2.1, 1.4, 1.9, 2.4, 2.0];

    // Type 0
    let L: PartDef[] = [
      ['b', 1.6, 1.5, 1.3, 0, 0.75, 0, 'W'],
      ['p', 1.9, 0.85, 1.6, 0, 1.92, 0, 'R'],
      ['b', 0.22, 0.6, 0.22, 0.5, 2.2, 0.2, DK],
      ['b', 0.3, 0.55, 0.05, -0.4, 0.28, 0.66, DR],
      ['b', 0.5, 0.08, 0.25, -0.4, 0.62, 0.76, TRM],
    ];
    wd(L, [[-0.45, 1.05], [0.45, 1.05], [0.45, 0.45]], 0.66, 0.3, 0.34);
    TY.push(L);

    // Type 1
    L = [
      ['b', 1.8, 3.4, 1.4, 0, 1.7, 0, 'W'],
      ['b', 1.95, 0.12, 1.55, 0, 3.46, 0, TRM],
      ['b', 0.5, 0.3, 0.5, 0.4, 3.7, 0.2, DK],
      ['c', 0.35, 0.45, 0.35, -0.5, 3.72, -0.3, GR],
      ['b', 0.5, 0.5, 0.05, 0, 0.25, 0.72, DR],
      ['b', 0.8, 0.08, 0.35, 0, 0.62, 0.88, TRM],
      ['b', 1.8, 0.06, 0.25, 0, 1.3, 0.82, TRM],
      ['b', 1.8, 0.06, 0.25, 0, 2.9, 0.82, TRM],
    ];
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 4; j++) {
        wd(L, [[(i - 1) * 0.55, 0.95 + j * 0.78]], 0.71, 0.3, 0.4);
      }
    }
    TY.push(L);

    // Type 2
    L = [
      ['b', 2.1, 1.2, 1.4, 0, 0.6, 0, 'W'],
      ['b', 1.7, 0.55, 0.04, 0, 0.42, 0.71, GL],
      ['b', 1.2, 0.2, 0.06, 0, 1.12, 0.72, 0x2a3170],
      ['b', 2.2, 0.1, 1.5, 0, 1.25, 0, TRM],
      ['b', 0.5, 0.25, 0.4, 0.55, 1.45, -0.2, GR],
      ['b', 0.4, 0.55, 0.05, 0.85, 0.3, 0.72, DR],
    ];
    for (let i = 0; i < 4; i++) {
      L.push(['b', 0.46, 0.08, 0.55, -0.69 + i * 0.46, 0.88, 0.98, i % 2 ? 0xf6f1e6 : 0xd94a3a]);
    }
    wd(L, [[-0.7, 1.0], [0.7, 1.0]], 0.71, 0.3, 0.25);
    TY.push(L);

    // Type 3
    L = [
      ['b', 1.4, 4.2, 1.4, 0, 2.1, 0, 0x3f77a8],
      ['b', 1.0, 0.2, 1, 0, 4.3, 0, DK],
      ['c', 0.07, 1.1, 0.07, 0, 4.95, 0, 0x888888],
      ['b', 0.7, 0.5, 0.06, 0, 0.25, 0.71, 0x2a3170],
    ];
    for (let y = 0.7; y < 4.1; y += 0.7) {
      L.push(['b', 1.46, 0.06, 1.46, 0, y, 0, TRM]);
    }
    for (let x = -0.45; x < 0.5; x += 0.45) {
      L.push(['b', 0.05, 4.1, 1.44, x, 2.1, 0, TRM]);
    }
    TY.push(L);

    // Type 4
    L = [
      ['b', 1.9, 1.3, 0.9, 0, 0.65, -0.35, 'W'],
      ['b', 0.9, 1.3, 0.9, 0.5, 0.65, 0.55, 'W'],
      ['p', 2.1, 0.75, 1.1, 0, 1.68, -0.35, 'R'],
      ['p', 1.1, 0.75, 1.1, 0.5, 1.68, 0.55, 'R'],
      ['b', 0.25, 0.6, 0.25, -0.6, 2.0, -0.5, DK],
      ['b', 0.3, 0.55, 0.05, -0.2, 0.28, 0.12, DR],
      ['b', 0.9, 0.06, 0.5, -0.35, 0.1, 0.3, 0xb9b2a6],
    ];
    wd(L, [[-0.6, 0.85], [0.5, 0.8]], 0.11, 0.3, 0.34);
    L.push(['b', 0.4, 0.4, 0.05, 0.5, 0.7, 1.01, GL]);
    TY.push(L);

    // Type 5
    L = [
      ['b', 2.4, 1.3, 1.5, 0, 0.65, 0, 'W'],
      ['b', 2.5, 0.1, 1.6, 0, 1.33, 0, TRM],
      ['b', 0.5, 0.7, 0.04, 0.75, 0.35, 0.76, 0x9aa3ae],
      ['b', 2.1, 0.28, 0.04, -0.1, 0.9, 0.76, GL],
      ['b', 2.1, 0.28, 0.04, -0.1, 0.9, -0.76, GL],
      ['b', 0.55, 0.3, 0.45, -0.7, 1.55, 0, GR],
      ['c', 0.2, 0.5, 0.2, 0.5, 1.6, 0.3, GR],
    ];
    for (let x = -0.8; x < 1; x += 0.8) {
      L.push(['p', 0.75, 0.35, 1.3, x, 1.55, 0, DK]);
    }
    L.push(['b', 0.5, 0.05, 0.9, 0.75, 0.1, 1.2, 0x4a505c]);
    TY.push(L);

    // Type 6
    L = [
      ['b', 2, 1.2, 1.5, 0, 0.6, 0, 'W'],
      ['b', 2.1, 0.1, 1.6, 0, 1.25, 0, TRM],
      ['b', 1.5, 1.2, 1.1, 0, 1.85, 0, 'W'],
      ['b', 1.6, 0.1, 1.2, 0, 2.5, 0, TRM],
      ['b', 1, 1, 0.7, 0, 3.05, 0, 'W'],
      ['p', 1.1, 0.8, 0.8, 0, 3.95, 0, 'R'],
      ['b', 0.5, 0.5, 0.05, 0, 0.25, 0.76, DR],
    ];
    wd(L, [[-0.6, 0.8], [0.6, 0.8]], 0.76, 0.3, 0.32);
    wd(L, [[-0.4, 1.9], [0.4, 1.9]], 0.56, 0.28, 0.32);
    wd(L, [[0, 3.1]], 0.36, 0.3, 0.4);
    TY.push(L);

    const INS: [number, number, number, number, number, number, number][][] = TY.map(() => []);
    const TR: [number, number, number, number][] = [];

    for (let b = 0; b < 3; b++) {
      const ri = roads[b] + 1.2;
      const ro = roads[b + 1] - 1.2;
      for (let k = 0; k < SEC; k++) {
        const a0 = (k / SEC) * TAU;
        const rows = b === 0 ? [ri + 0.9, ro - 0.9] : [ri + 1.05, ro - 1.05];
        rows.forEach((r, row) => {
          [a0 + 1.5 / r, a0 + TAU / SEC - 1.5 / r].forEach((a, e) =>
            TR.push([Math.cos(a) * r, Math.sin(a) * r, 0.85 + rnd(k * 3 + e + row + b * 9) * 0.35, b * 5 + k + e])
          );
          if (b === 0) return;
          let prev = -1;
          let cur = a0 + 2.1 / r;
          const end = a0 + TAU / SEC - 2.1 / r;
          let id = b * 977 + k * 61 + row * 13;
          while (true) {
            let tp = Math.floor(rnd(id++) * 7);
            if (tp === prev) tp = (tp + 3) % 7;
            const sc2 = 1 + rnd(id + 5) * 0.22;
            const da = (TW[tp] * sc2) / r;
            if (cur + da > end) break;
            const a = cur + da / 2;
            const hv = tp === 1 || tp === 3 ? 0.85 + rnd(id + 9) * 0.6 : 1;
            INS[tp].push([
              Math.cos(a) * r,
              Math.sin(a) * r,
              -(a + Math.PI / 2) + (row ? Math.PI : 0),
              sc2,
              hv,
              wallC[Math.floor(rnd(id + 2) * 8)],
              roofC[Math.floor(rnd(id + 4) * 6)],
            ]);
            prev = tp;
            cur += da + 0.3 / r;
          }
        });
      }
    }

    const gB = new THREE.BoxGeometry(1, 1, 1);
    const gP = new THREE.ConeGeometry(0.7071, 1, 4).rotateY(Math.PI / 4);
    const gC = new THREE.CylinderGeometry(0.5, 0.5, 1, 10);
    const idq = new THREE.Quaternion();

    TY.forEach((parts, tp) => {
      const I = INS[tp];
      if (!I.length) return;
      parts.forEach((pt) => {
        const dyn = typeof pt[7] === 'string';
        const geo = pt[0] === 'b' ? gB : pt[0] === 'p' ? gP : gC;
        const mat = dyn ? M(0xffffff) : M(pt[7]);
        const m = new THREE.InstancedMesh(geo, mat, I.length);
        m.castShadow = pt[1] > 0.45 || pt[2] > 0.45;
        m.receiveShadow = true;
        I.forEach((o, i) => {
          ee.set(0, o[2], 0);
          qq.setFromEuler(ee);
          const bm = new THREE.Matrix4().compose(
            new THREE.Vector3(o[0], 0.1, o[1]),
            qq,
            new THREE.Vector3(o[3], o[3] * o[4], o[3])
          );
          const lm2 = new THREE.Matrix4().compose(
            new THREE.Vector3(pt[4], pt[5], pt[6]),
            idq,
            new THREE.Vector3(pt[1], pt[2], pt[3])
          );
          m.setMatrixAt(i, bm.multiply(lm2));
          if (dyn) {
            m.setColorAt(i, new THREE.Color(pt[7] === 'W' ? o[5] : o[6]));
          }
        });
        W.add(m);
      });
    });

    // ── Trees ───────────────────────────────────────────────────
    const gc = [0x2f9e4a, 0x3fae45, 0x58b843, 0x2c8a47];
    const ti = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.07, 0.1, 0.5, 5), M(0x7a5232), TR.length);
    const li = new THREE.InstancedMesh(
      new THREE.IcosahedronGeometry(0.5, 0),
      new THREE.MeshLambertMaterial({ color: 0xffffff, flatShading: true }),
      TR.length
    );
    li.castShadow = true;
    TR.forEach((t, i) => {
      place(ti, i, t[0], 0.35, t[1], t[2], t[2], t[2], 0);
      place(li, i, t[0], 0.35 + 0.55 * t[2], t[1], t[2], t[2] * 1.1, t[2], t[3]);
      li.setColorAt(i, new THREE.Color(gc[t[3] % 4]));
    });
    W.add(ti, li);

    // ── Landmarks Ring (Band 0) ─────────────────────────────────
    function winTex(wall: string, cols: number, rows: number, seed: number) {
      const c = document.createElement('canvas');
      c.width = 128;
      c.height = 256;
      const x = c.getContext('2d')!;
      x.fillStyle = wall;
      x.fillRect(0, 0, 128, 256);
      const cw = 128 / cols;
      const rh = 256 / rows;
      for (let r = 0; r < rows; r++) {
        for (let k = 0; k < cols; k++) {
          x.fillStyle = rnd(seed + r * 7 + k * 13) > 0.82 ? '#ffe7a0' : '#5f9fd6';
          x.fillRect(k * cw + cw * 0.2, r * rh + rh * 0.22, cw * 0.6, rh * 0.5);
        }
      }
      return new THREE.CanvasTexture(c);
    }

    const lm = ['#8c9db5', '#e2c79a', '#3b4a7a', '#b5a58a', '#7fa6d6', '#d9b66a'];
    function mesh(
      g: THREE.BufferGeometry,
      c: number,
      x: number,
      y: number,
      z: number,
      p: THREE.Group,
      o?: THREE.MeshLambertMaterialParameters
    ) {
      const m = new THREE.Mesh(g, M(c, o));
      m.position.set(x, y, z);
      m.castShadow = true;
      p.add(m);
      return m;
    }

    let pyrMesh: THREE.Mesh | null = null;
    for (let k = 0; k < SEC; k++) {
      const a = ((k + 0.5) / SEC) * TAU;
      const r = 10.5;
      const id = k * 17;
      const g = new THREE.Group();
      g.position.set(Math.cos(a) * r, 0.1, Math.sin(a) * r);
      g.rotation.y = -(a + Math.PI / 2);
      W.add(g);

      if (k === 1) {
        box(3.6, 3.4, 3.6, 0x1d2447, 0, 1.7, 0, g);
        box(3.8, 0.15, 3.8, 0x2a3170, 0, 3.45, 0, g);
        const p = mesh(new THREE.ConeGeometry(2.3, 1.9, 4), 0x8a4dff, 0, 4.4, 0, g, {
          emissive: new THREE.Color(0x4a1fb0),
        });
        p.rotation.y = Math.PI / 4;
        pyrMesh = p;
        continue;
      }

      const h = 3 + rnd(id) * 3.5;
      const w = 2.4 + rnd(id + 1) * 0.9;
      const s = M(0xffffff, { map: winTex(lm[k % 6], 4, Math.round(h * 1.6), id) });
      const t = M(0x59606d);
      box(w, h, w * 0.9, [s, s, t, t, s, s], 0, h / 2, 0, g);
      box(w + 0.3, 0.2, w * 0.9 + 0.3, 0xe9e6df, 0, 0.1, 0, g);
      box(w + 0.2, 0.14, w * 0.9 + 0.2, 0xe9e6df, 0, h + 0.07, 0, g);
      box(w * 0.5, 0.1, 0.6, 0x2a3170, 0, 0.8, w * 0.45 + 0.25, g);
      box(0.08, 0.8, 0.08, 0xe9e6df, -w * 0.2, 0.4, w * 0.45 + 0.5, g);
      box(0.08, 0.8, 0.08, 0xe9e6df, w * 0.2, 0.4, w * 0.45 + 0.5, g);

      const cr = k % 4;
      if (cr === 0) {
        const c = mesh(new THREE.ConeGeometry(w * 0.65, 1.5, 4), 0xd9b66a, 0, h + 0.9, 0, g);
        c.rotation.y = Math.PI / 4;
        box(w * 0.8, 0.3, w * 0.7, 0xc9a45a, 0, h + 0.3, 0, g);
      }
      if (cr === 1) {
        box(w * 0.7, 0.9, w * 0.55, 0x7d8896, 0, h + 0.6, 0, g);
        box(w * 0.4, 0.7, 0.3, 0x9aa3ae, 0, h + 1.4, 0, g);
      }
      if (cr === 2) {
        mesh(new THREE.SphereGeometry(w * 0.4, 18, 10, 0, TAU, 0, Math.PI / 2), 0x7fb8e6, 0, h + 0.14, 0, g);
      }
      if (cr === 3) {
        box(w * 0.4, 0.4, 0.4, 0x7d8896, 0, h + 0.34, 0, g);
        box(0.06, 2, 0.06, 0x888888, 0, h + 1.5, 0, g);
      }
    }

    // ── Central J Enterprise Tower ──────────────────────────────
    function signTex() {
      const c = document.createElement('canvas');
      c.width = 256;
      c.height = 512;
      const x = c.getContext('2d')!;
      x.fillStyle = '#1b2358';
      x.fillRect(0, 0, 256, 512);
      x.fillStyle = '#ffffff';
      x.font = '700 190px Arial, sans-serif';
      x.textAlign = 'center';
      x.fillText('J', 128, 250);
      x.font = '600 34px Arial, sans-serif';
      x.fillText('J ENTERPRISE', 128, 330);
      x.fillStyle = '#12b5e5';
      x.fillRect(70, 352, 116, 5);
      return new THREE.CanvasTexture(c);
    }

    const sg = M(0xffffff, { map: signTex() });
    const gl = M(0xffffff, { map: winTex('#232b5e', 4, 6, 99) });
    const rN = M(0x2a3170);

    box(1.9, 5, 2.2, [sg, sg, rN, rN, sg, sg], -0.15, 2.7, 0);
    box(1.8, 4.2, 2.2, [gl, gl, rN, rN, gl, gl], 1.6, 2.3, 0.1);
    box(1.4, 3.2, 1.8, [gl, gl, rN, rN, gl, gl], -1.7, 1.8, -0.1);
    box(2.4, 0.25, 0.8, 0x2a3170, -0.15, 0.6, 1.5);
    box(0.12, 1, 0.12, 0x888888, -0.15, 5.7, 0);
    const lamp = box(0.2, 0.2, 0.2, 0xff5a5a, -0.15, 6.3, 0);

    // Palm trees near central plaza
    [
      [-2.6, 2.6],
      [2.6, 2.6],
      [-2.8, -2.4],
      [2.8, -2.4],
    ].forEach((p) => {
      const g = new THREE.Group();
      g.position.set(p[0], 0.2, p[1]);
      W.add(g);
      const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, 1.2, 6), M(0x8a6038));
      tr.position.y = 0.6;
      tr.castShadow = true;
      g.add(tr);
      for (let i = 0; i < 5; i++) {
        const lf = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.8, 4), M(0x2f9e4a));
        lf.position.set(Math.cos(i * 1.256) * 0.3, 1.2, Math.sin(i * 1.256) * 0.3);
        lf.rotation.z = Math.cos(i * 1.256) * -1.2;
        lf.rotation.x = Math.sin(i * 1.256) * 1.2;
        g.add(lf);
      }
    });

    // ── Animated Cars ───────────────────────────────────────────
    const cc = [0xe8453c, 0xf2b61c, 0x2f7de1, 0xf4f4f4, 0x3aa86b];
    function car(c: number) {
      const g = new THREE.Group();
      box(0.9, 0.26, 0.45, c, 0, 0.3, 0, g);
      box(0.45, 0.22, 0.4, 0xcfe6f7, -0.05, 0.52, 0, g);
      W.add(g);
      return g;
    }

    interface CarState {
      g: THREE.Group;
      a: number;
      r: number;
      v: number;
    }
    const cars: CarState[] = [];
    roads.forEach((r, j) => {
      const n = 2 + j;
      for (let i = 0; i < n; i++) {
        cars.push({
          g: car(cc[(i + j) % 5]),
          a: (i / n) * TAU + j,
          r: r + (i % 2 ? 0.3 : -0.3),
          v: ((i % 2 ? 1 : -1) * 0.45) / r,
        });
      }
    });

    // ── Mouse & Touch Controls: Spin Left/Right, Tilt Up/Down, Zoom In/Out ──
    let down = false;
    let lx = 0;
    let ly = 0;
    let pinchDist = 0;

    const onPointerDown = (e: PointerEvent) => {
      down = true;
      lx = e.clientX;
      ly = e.clientY;
      try {
        cv.setPointerCapture(e.pointerId);
      } catch {}
    };

    const onPointerMove = (e: PointerEvent) => {
      if (down) {
        const dx = e.clientX - lx;
        const dy = e.clientY - ly;
        lx = e.clientX;
        ly = e.clientY;

        // Horizontal drag: Rotates camera around island (yaw)
        yaw += dx * 0.007;

        // Vertical drag: Tilts camera up and down (pitch elevation)
        pitch = Math.max(0.18, Math.min(1.42, pitch - dy * 0.006));

        updateCamera();
      }
    };

    const onPointerUp = () => {
      down = false;
    };

    cv.addEventListener('pointerdown', onPointerDown);
    cv.addEventListener('pointermove', onPointerMove);
    cv.addEventListener('pointerup', onPointerUp);
    cv.addEventListener('pointercancel', onPointerUp);

    // Mouse wheel zoom
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY * -0.0015;
      zoom = Math.max(0.45, Math.min(2.8, zoom + delta));
      updateCamera();
    };
    cv.addEventListener('wheel', onWheel, { passive: false });

    // Touch pinch to zoom
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const curDist = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
        if (pinchDist > 0) {
          const delta = (curDist - pinchDist) * 0.005;
          zoom = Math.max(0.45, Math.min(2.8, zoom + delta));
          updateCamera();
        }
        pinchDist = curDist;
      }
    };
    const onTouchEnd = () => {
      pinchDist = 0;
    };
    cv.addEventListener('touchmove', onTouchMove, { passive: true });
    cv.addEventListener('touchend', onTouchEnd);

    // Expose Zoom Control Buttons
    zoomControlsRef.current = {
      zoomIn: () => {
        zoom = Math.min(2.8, zoom + 0.2);
        updateCamera();
      },
      zoomOut: () => {
        zoom = Math.max(0.45, zoom - 0.2);
        updateCamera();
      },
      reset: () => {
        zoom = 1.0;
        pitch = 0.76;
        yaw = Math.PI / 4;
        updateCamera();
      },
    };

    // ── Responsive Resize ───────────────────────────────────────
    function resize() {
      if (!container) return;
      const w = container.clientWidth || 700;
      const h = container.clientHeight || 560;
      const a = w / h;
      R.setSize(w, h, false);
      let vh = 44;
      let vw = vh * a;
      if (vw < 60) {
        vw = 60;
        vh = vw / a;
      }
      cam.left = -vw / 2;
      cam.right = vw / 2;
      cam.top = vh / 2;
      cam.bottom = -vh / 2;
      updateCamera();
    }

    const ro = new ResizeObserver(resize);
    ro.observe(container);
    resize();

    // ── Animation Loop ──────────────────────────────────────────
    let raf = 0;
    let last = 0;

    function loop(t: number) {
      t *= 0.001;
      const dt = Math.min(0.05, t - last);
      last = t;

      // Smooth idle rotation when not dragging
      if (!down) {
        yaw += dt * 0.07;
        updateCamera();
      }

      // Drive cars
      cars.forEach((c) => {
        c.a += c.v * dt * 8;
        const a = c.a;
        c.g.position.set(Math.cos(a) * c.r, 0, Math.sin(a) * c.r);
        c.g.rotation.y = -(a + (c.v > 0 ? Math.PI / 2 : -Math.PI / 2));
      });

      // Beacon lamp flashing
      const lampMat = lamp.material as THREE.MeshLambertMaterial;
      if (lampMat) {
        lampMat.color.setHex(Math.sin(t * 3) > 0 ? 0xff5a5a : 0x661f1f);
      }

      // Pyramid pulsing
      if (pyrMesh) {
        const pyrMat = pyrMesh.material as THREE.MeshLambertMaterial;
        if (pyrMat && (pyrMat as any).emissiveIntensity !== undefined) {
          (pyrMat as any).emissiveIntensity = 0.7 + 0.5 * Math.sin(t * 2);
        }
      }

      R.render(S, cam);
      raf = requestAnimationFrame(loop);
    }

    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      cv.removeEventListener('pointerdown', onPointerDown);
      cv.removeEventListener('pointermove', onPointerMove);
      cv.removeEventListener('pointerup', onPointerUp);
      cv.removeEventListener('pointercancel', onPointerUp);
      cv.removeEventListener('wheel', onWheel);
      cv.removeEventListener('touchmove', onTouchMove);
      cv.removeEventListener('touchend', onTouchEnd);
      R.dispose();
      if (cv.parentNode) {
        cv.parentNode.removeChild(cv);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        minHeight: '480px',
        maxHeight: '660px',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'transparent',
        overflow: 'hidden',
      }}
    >
      {/* Floating Controls: Zoom In / Zoom Out / Reset & Hint */}
      <div
        style={{
          position: 'absolute',
          bottom: '16px',
          right: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          zIndex: 10,
        }}
      >
        <button
          onClick={() => zoomControlsRef.current?.zoomIn()}
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.92)',
            border: '1px solid rgba(203, 213, 225, 0.8)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            cursor: 'pointer',
            fontSize: '18px',
            fontWeight: 700,
            color: '#1e293b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.15s, background 0.15s',
          }}
          title="Zoom In"
        >
          +
        </button>
        <button
          onClick={() => zoomControlsRef.current?.zoomOut()}
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.92)',
            border: '1px solid rgba(203, 213, 225, 0.8)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            cursor: 'pointer',
            fontSize: '18px',
            fontWeight: 700,
            color: '#1e293b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.15s, background 0.15s',
          }}
          title="Zoom Out"
        >
          −
        </button>
        <button
          onClick={() => zoomControlsRef.current?.reset()}
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.92)',
            border: '1px solid rgba(203, 213, 225, 0.8)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 700,
            color: '#1e293b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.15s, background 0.15s',
          }}
          title="Reset View"
        >
          ↺
        </button>
      </div>

      {/* Floating Interaction Hint */}
      <div
        style={{
          position: 'absolute',
          bottom: '16px',
          left: '16px',
          padding: '6px 14px',
          borderRadius: '999px',
          background: 'rgba(255, 255, 255, 0.82)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(203, 213, 225, 0.7)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
          fontSize: '0.74rem',
          fontWeight: 600,
          color: '#475569',
          pointerEvents: 'none',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        <span>↔ Drag to spin</span>
        <span>·</span>
        <span>↕ Tilt up/down</span>
        <span>·</span>
        <span>🔍 Scroll to zoom</span>
      </div>
    </div>
  );
}
