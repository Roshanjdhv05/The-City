'use client';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';

/* ─────────────────────────────────────────────
   Procedural low-poly cartoon city — matches
   the reference image: central roundabout with
   J Enterprise tower, colorful districts, trees,
   roads, cars, mountains, sky.
───────────────────────────────────────────── */

// ── Helpers ──────────────────────────────────
function rng(seed: number) {
  let s = seed;
  return () => { s = (s * 16807 + 0) % 2147483647; return (s - 1) / 2147483646; };
}

function mat(color: number, roughness = 0.75, metalness = 0) {
  return new THREE.MeshLambertMaterial({ color });
}

function box(w: number, h: number, d: number, color: number) {
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color));
}

function cylinder(r: number, h: number, color: number, seg = 20) {
  return new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), mat(color));
}

function sphere(r: number, color: number) {
  return new THREE.Mesh(new THREE.SphereGeometry(r, 8, 6), mat(color));
}

// ── Tree ─────────────────────────────────────
function makeTree(scene: THREE.Scene, x: number, z: number, scale = 1) {
  const trunk = box(0.18 * scale, 0.6 * scale, 0.18 * scale, 0x795548);
  trunk.position.set(x, 0.3 * scale, z);
  trunk.castShadow = true;
  scene.add(trunk);

  const leavesColors = [0x2e7d32, 0x388e3c, 0x43a047, 0x1b5e20, 0x33691e];
  const lc = leavesColors[Math.floor(Math.abs(x + z * 7)) % leavesColors.length];
  const leaves = sphere(0.52 * scale, lc);
  leaves.scale.y = 1.1;
  leaves.position.set(x, (0.6 + 0.52 * 0.9) * scale, z);
  leaves.castShadow = true;
  scene.add(leaves);
}

// ── Low-poly Building ─────────────────────────
function makeBuilding(
  scene: THREE.Scene,
  x: number, z: number,
  w: number, h: number, d: number,
  wallColor: number,
  roofColor?: number,
  roofStyle: 'flat' | 'gabled' | 'hip' = 'flat'
) {
  const g = new THREE.Group();

  const wall = box(w, h, d, wallColor);
  wall.position.y = h / 2;
  wall.castShadow = true;
  wall.receiveShadow = true;
  g.add(wall);

  if (roofStyle === 'gabled' && roofColor !== undefined) {
    const roofGeo = new THREE.CylinderGeometry(0, Math.sqrt(w * w + d * d) * 0.52, h * 0.45, 4, 1);
    const roof = new THREE.Mesh(roofGeo, mat(roofColor));
    roof.position.y = h + h * 0.45 * 0.5;
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    g.add(roof);
  } else if (roofStyle === 'hip' && roofColor !== undefined) {
    const roofGeo = new THREE.CylinderGeometry(0.3 * Math.min(w, d), Math.min(w, d) * 0.6, h * 0.4, 4, 1);
    const roof = new THREE.Mesh(roofGeo, mat(roofColor));
    roof.position.y = h + h * 0.2;
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    g.add(roof);
  }

  g.position.set(x, 0, z);
  scene.add(g);
  return g;
}

// ── Road strip ───────────────────────────────
function makeRoad(scene: THREE.Scene, x: number, z: number, w: number, d: number, rot = 0) {
  const road = box(w, 0.04, d, 0x607d8b);
  road.position.set(x, 0.02, z);
  road.rotation.y = rot;
  road.receiveShadow = true;
  scene.add(road);
}

// ── Dashed centre line ────────────────────────
function makeDashLine(scene: THREE.Scene, x0: number, z0: number, x1: number, z1: number) {
  const steps = 12;
  for (let i = 0; i < steps; i++) {
    const t = (i + 0.5) / steps;
    if (i % 2 === 0) {
      const x = x0 + (x1 - x0) * t;
      const z = z0 + (z1 - z0) * t;
      const dash = box(Math.abs(x1 - x0) > Math.abs(z1 - z0) ? (x1 - x0) / steps * 0.6 : 0.12,
        0.06, Math.abs(z1 - z0) > Math.abs(x1 - x0) ? (z1 - z0) / steps * 0.6 : 0.12, 0xffffff);
      dash.position.set(x, 0.03, z);
      scene.add(dash);
    }
  }
}

// ── Car ──────────────────────────────────────
function makeCar(scene: THREE.Scene, x: number, z: number, rot: number, color: number) {
  const g = new THREE.Group();
  const body = box(0.9, 0.35, 0.5, color);
  body.position.y = 0.175;
  body.castShadow = true;
  g.add(body);
  const top = box(0.5, 0.28, 0.46, color);
  top.position.set(-0.05, 0.47, 0);
  g.add(top);

  const wheelC = 0x212121;
  for (const [wx, wz] of [[0.32, 0.26], [0.32, -0.26], [-0.32, 0.26], [-0.32, -0.26]]) {
    const wh = cylinder(0.12, 0.08, wheelC, 10);
    wh.rotation.z = Math.PI / 2;
    wh.position.set(wx, 0.11, wz);
    g.add(wh);
  }

  g.position.set(x, 0, z);
  g.rotation.y = rot;
  scene.add(g);
}

// ── Crosswalk stripes ─────────────────────────
function makeCrosswalk(scene: THREE.Scene, x: number, z: number, horizontal: boolean) {
  for (let i = -2; i <= 2; i++) {
    const stripe = box(horizontal ? 0.22 : 2.6, 0.06, horizontal ? 2.6 : 0.22, 0xeceff1);
    stripe.position.set(x + (horizontal ? i * 0.44 : 0), 0.04, z + (horizontal ? 0 : i * 0.44));
    scene.add(stripe);
  }
}

export default function CityHeroScene() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const W = container.clientWidth || 760;
    const H = container.clientHeight || 560;

    // ── Renderer ───────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);

    // ── Scene ──────────────────────────────────
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb); // sky blue

    // ── Camera (isometric-ish bird's eye) ──────
    const camera = new THREE.PerspectiveCamera(42, W / H, 0.1, 500);
    camera.position.set(0, 36, 50);
    camera.lookAt(0, 0, -6);

    // ── Lights ─────────────────────────────────
    const ambient = new THREE.AmbientLight(0xfff4e0, 1.6);
    scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xfff8dc, 2.6);
    sun.position.set(30, 60, 20);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.bias = -0.0003;
    sun.shadow.camera.near = 10;
    sun.shadow.camera.far = 200;
    const sd = 55;
    sun.shadow.camera.left = -sd;
    sun.shadow.camera.right = sd;
    sun.shadow.camera.top = sd;
    sun.shadow.camera.bottom = -sd;
    scene.add(sun);

    const fill = new THREE.DirectionalLight(0xc8e6ff, 0.9);
    fill.position.set(-30, 20, -20);
    scene.add(fill);

    // ── Sky Gradient — backdrop plane ──────────
    // We use a vertical gradient quad in the background
    const skyGeo = new THREE.PlaneGeometry(400, 160);
    const skyMat = new THREE.MeshBasicMaterial({ color: 0x4fc3f7 });
    const sky = new THREE.Mesh(skyGeo, skyMat);
    sky.position.set(0, 40, -120);
    scene.add(sky);

    // Sky top
    const skyTop = new THREE.Mesh(new THREE.PlaneGeometry(400, 100), new THREE.MeshBasicMaterial({ color: 0x1976d2 }));
    skyTop.position.set(0, 100, -120);
    scene.add(skyTop);

    // ── Clouds ─────────────────────────────────
    const cloudColors = [0xffffff, 0xf0f4f8];
    const cloudPositions = [
      [-35, 32, -80], [10, 30, -90], [42, 34, -75],
      [-15, 36, -95], [25, 28, -85], [-50, 29, -88],
    ];
    for (const [cx, cy, cz] of cloudPositions) {
      const cg = new THREE.Group();
      const c = cloudColors[Math.floor(Math.abs(cx)) % 2];
      for (const [ox, oy, oz, r] of [
        [0, 0, 0, 2.6], [-2.2, -0.5, 0, 1.8], [2.4, -0.4, 0, 2.0],
        [0.5, 1.0, 0, 1.5], [-0.8, 0.8, 0, 1.4],
      ] as [number, number, number, number][]) {
        const c3 = sphere(r, c);
        c3.position.set(ox, oy, oz);
        cg.add(c3);
      }
      cg.position.set(cx, cy, cz);
      scene.add(cg);
    }

    // ── Mountains ──────────────────────────────
    const mtColors = [0x9e9e9e, 0xbdbdbd, 0x78909c, 0x90a4ae, 0xb0bec5];
    const mtDefs = [
      [-60, -80, 20, 32], [-32, -88, 16, 28], [-10, -92, 22, 36],
      [18, -86, 18, 30], [42, -82, 20, 34], [62, -88, 15, 26],
      [-48, -75, 12, 20], [30, -78, 14, 22], [0, -96, 24, 40],
    ];
    mtDefs.forEach(([mx, mz, mr, mh], i) => {
      const geo = new THREE.CylinderGeometry(0, mr, mh, 5, 1);
      const mesh = new THREE.Mesh(geo, mat(mtColors[i % mtColors.length]));
      mesh.position.set(mx, mh / 2 - 2, mz);
      // Snow cap
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0, mr * 0.3, mh * 0.25, 5, 1), mat(0xffffff));
      cap.position.set(mx, mh * 0.95, mz);
      scene.add(mesh);
      scene.add(cap);
    });

    // ── Ground ─────────────────────────────────
    const ground = box(200, 0.2, 200, 0x81c784);
    ground.position.y = -0.1;
    ground.receiveShadow = true;
    scene.add(ground);

    // Sidewalk / plaza colour areas
    const plaza = box(16, 0.22, 16, 0xd2b48c);
    plaza.position.set(0, 0.11, 0);
    plaza.receiveShadow = true;
    scene.add(plaza);

    // ── Road Network ───────────────────────────
    const roadW = 4.2;
    // Main roads: N–S and E–W arteries
    makeRoad(scene, 0, 0, roadW, 120, 0);        // North-South
    makeRoad(scene, 0, 0, 120, roadW, 0);         // East-West
    // Diagonal roads
    for (const angle of [Math.PI / 4, -Math.PI / 4]) {
      const r = box(roadW, 0.04, 100, 0x607d8b);
      r.position.set(0, 0.02, 0);
      r.rotation.y = angle;
      r.receiveShadow = true;
      scene.add(r);
    }

    // Centre-line dashes on main roads
    makeDashLine(scene, 0, -55, 0, 55);
    makeDashLine(scene, -55, 0, 55, 0);

    // Crosswalks at road intersections
    for (const [cx, cz, h] of [
      [0, 7.5, true], [0, -7.5, true],
      [7.5, 0, false], [-7.5, 0, false],
    ] as [number, number, boolean][]) {
      makeCrosswalk(scene, cx, cz, h);
    }

    // Ring road around roundabout
    const ringGeo = new THREE.RingGeometry(7.0, 10.0, 48);
    const ringMat = new THREE.MeshLambertMaterial({ color: 0x546e7a, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.03;
    scene.add(ring);

    // Roundabout green centre
    const rCenter = cylinder(6.8, 0.25, 0x4caf50, 36);
    rCenter.position.y = 0.125;
    scene.add(rCenter);

    // Centre circle path (sandy)
    const rPath = cylinder(5.0, 0.26, 0xdeb887, 36);
    rPath.position.y = 0.13;
    scene.add(rPath);

    // ── J Enterprise Tower ─────────────────────
    const towerG = new THREE.Group();
    // Base podium
    const podium = box(5.5, 0.6, 5.5, 0x37474f);
    podium.position.y = 0.3;
    podium.castShadow = true;
    towerG.add(podium);

    // Main tower block – dark blue-grey glass
    const tower = box(4.4, 11, 4.4, 0x1a237e);
    tower.position.y = 6.1;
    tower.castShadow = true;
    towerG.add(tower);

    // Glass curtain
    const glassGeo = new THREE.BoxGeometry(4.42, 11.02, 0.1);
    const glassMat2 = new THREE.MeshLambertMaterial({ color: 0x4fc3f7, transparent: true, opacity: 0.5 });
    for (const [nx, nz, ry] of [[0, 2.21, 0], [0, -2.21, Math.PI], [2.21, 0, Math.PI / 2], [-2.21, 0, -Math.PI / 2]]) {
      const pane = new THREE.Mesh(glassGeo, glassMat2);
      pane.position.set(nx, 6.1, nz);
      pane.rotation.y = ry;
      towerG.add(pane);
    }

    // Top floors accent
    const topFloor = box(4.6, 1.2, 4.6, 0x0d47a1);
    topFloor.position.y = 12.2;
    topFloor.castShadow = true;
    towerG.add(topFloor);

    // Roof antennas
    const ant = cylinder(0.08, 2.5, 0x90a4ae);
    ant.position.y = 14.1;
    towerG.add(ant);
    const antBall = sphere(0.2, 0xe53935);
    antBall.position.y = 15.4;
    towerG.add(antBall);

    // "J" signage canvas texture on tower face
    const signCanvas = document.createElement('canvas');
    signCanvas.width = 256; signCanvas.height = 256;
    const ctx = signCanvas.getContext('2d')!;
    ctx.fillStyle = '#0d1b4d';
    ctx.fillRect(0, 0, 256, 256);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 100px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('J', 128, 100);
    ctx.font = 'bold 20px Arial';
    ctx.fillText('J ENTERPRISE', 128, 190);
    const signTex = new THREE.CanvasTexture(signCanvas);
    const signPanel = new THREE.Mesh(
      new THREE.PlaneGeometry(3.5, 3.5),
      new THREE.MeshBasicMaterial({ map: signTex })
    );
    signPanel.position.set(0, 7.5, 2.22);
    towerG.add(signPanel);

    // "J" billboard at base
    const billBoard = new THREE.Group();
    const billPole = cylinder(0.1, 1.5, 0x455a64);
    billPole.position.y = 0.75;
    billBoard.add(billPole);
    const billFace = box(1.0, 1.0, 0.1, 0x1565c0);
    billFace.position.y = 1.6;
    billBoard.add(billFace);
    billBoard.position.set(1.5, 0.6, 2.8);
    towerG.add(billBoard);

    towerG.position.set(0, 0, -1.5);
    scene.add(towerG);

    // ── Roundabout trees ───────────────────────
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
      const tr = 5.5;
      makeTree(scene, Math.sin(a) * tr, Math.cos(a) * tr, 0.85);
    }

    // ── Helper to scatter district buildings ───
    const rand = rng(42);
    const buildingDefs: Array<{
      x: number; z: number; w: number; h: number; d: number;
      wall: number; roof?: number; style: 'flat' | 'gabled' | 'hip';
    }> = [];

    // Define districts around the central roundabout
    // North district (behind tower) — corporate blue/grey
    const northBuildings = [
      { x: -8, z: -16, w: 3.5, h: 5, d: 3, wall: 0x546e7a, roof: 0x37474f, style: 'flat' as const },
      { x: -4, z: -20, w: 2.5, h: 7, d: 2.5, wall: 0x455a64, style: 'flat' as const },
      { x: 2, z: -18, w: 3, h: 4.5, d: 2.8, wall: 0x607d8b, roof: 0x455a64, style: 'flat' as const },
      { x: 7, z: -16, w: 2.8, h: 6, d: 2.8, wall: 0x37474f, style: 'flat' as const },
      { x: 11, z: -20, w: 3.5, h: 4, d: 3, wall: 0x546e7a, style: 'flat' as const },
      { x: -11, z: -20, w: 2.5, h: 3.5, d: 2.5, wall: 0x78909c, style: 'flat' as const },
      { x: 4, z: -24, w: 4, h: 3, d: 3.5, wall: 0xbcaaa4, roof: 0x8d6e63, style: 'gabled' as const },
      { x: -6, z: -26, w: 3, h: 4, d: 3, wall: 0xf5f5f5, roof: 0xe57373, style: 'gabled' as const },
      { x: 15, z: -18, w: 3, h: 5, d: 3, wall: 0x0288d1, style: 'flat' as const },
      { x: -15, z: -18, w: 2.5, h: 3.5, d: 2.5, wall: 0xe8eaf6, roof: 0x9fa8da, style: 'hip' as const },
    ];

    // East district — colourful retail
    const eastBuildings = [
      { x: 16, z: -4, w: 3.2, h: 3.5, d: 2.8, wall: 0xef9a9a, roof: 0xe53935, style: 'hip' as const },
      { x: 20, z: -8, w: 2.6, h: 4.5, d: 2.6, wall: 0xfff9c4, roof: 0xf9a825, style: 'gabled' as const },
      { x: 18, z: 2, w: 3.5, h: 3, d: 3, wall: 0xc8e6c9, roof: 0x388e3c, style: 'gabled' as const },
      { x: 23, z: 0, w: 2.8, h: 5.5, d: 2.5, wall: 0xe1f5fe, roof: 0x0288d1, style: 'flat' as const },
      { x: 22, z: -13, w: 3, h: 4, d: 2.8, wall: 0xf3e5f5, roof: 0x8e24aa, style: 'hip' as const },
      { x: 28, z: -6, w: 3.5, h: 3.2, d: 3, wall: 0xfff3e0, roof: 0xf57c00, style: 'gabled' as const },
      { x: 15, z: 6, w: 2.5, h: 2.5, d: 2.5, wall: 0xb3e5fc, roof: 0x039be5, style: 'flat' as const },
      { x: 26, z: 6, w: 3, h: 4, d: 2.8, wall: 0xffccbc, roof: 0xbf360c, style: 'hip' as const },
      { x: 30, z: 0, w: 2.5, h: 6, d: 2.5, wall: 0xe8eaf6, style: 'flat' as const },
    ];

    // West district — mixed / boutique
    const westBuildings = [
      { x: -16, z: -4, w: 3.5, h: 4, d: 3, wall: 0xfff9c4, roof: 0xfdd835, style: 'gabled' as const },
      { x: -21, z: -8, w: 2.8, h: 3, d: 2.8, wall: 0xdce775, roof: 0x9e9d24, style: 'hip' as const },
      { x: -19, z: 1, w: 3, h: 5, d: 2.6, wall: 0x0288d1, style: 'flat' as const },
      { x: -24, z: -1, w: 2.5, h: 3.5, d: 2.5, wall: 0xffcdd2, roof: 0xc62828, style: 'gabled' as const },
      { x: -22, z: -13, w: 3.5, h: 4.5, d: 3, wall: 0xe8f5e9, roof: 0x2e7d32, style: 'hip' as const },
      { x: -28, z: -6, w: 3.2, h: 3, d: 3, wall: 0xfce4ec, roof: 0xc2185b, style: 'gabled' as const },
      { x: -15, z: 5, w: 2.6, h: 3, d: 2.6, wall: 0xe1f5fe, roof: 0x01579b, style: 'flat' as const },
      { x: -26, z: 4, w: 3, h: 4.5, d: 3, wall: 0xfff3e0, roof: 0xe65100, style: 'hip' as const },
      { x: -30, z: 0, w: 2.5, h: 5, d: 2.5, wall: 0x37474f, style: 'flat' as const },
    ];

    // South district — residential with gabled roofs
    const southBuildings = [
      { x: -7, z: 15, w: 3.5, h: 3, d: 3, wall: 0xfff9c4, roof: 0xf9a825, style: 'gabled' as const },
      { x: 0, z: 17, w: 3, h: 2.8, d: 3, wall: 0xffccbc, roof: 0xbf360c, style: 'gabled' as const },
      { x: 7, z: 15, w: 3.5, h: 3.2, d: 3, wall: 0xe8f5e9, roof: 0x2e7d32, style: 'gabled' as const },
      { x: -13, z: 18, w: 3, h: 2.5, d: 2.8, wall: 0xfce4ec, roof: 0xad1457, style: 'hip' as const },
      { x: 13, z: 18, w: 3, h: 3, d: 2.8, wall: 0xe8eaf6, roof: 0x5c6bc0, style: 'gabled' as const },
      { x: -4, z: 22, w: 3, h: 2.6, d: 3, wall: 0xf3e5f5, roof: 0x7b1fa2, style: 'gabled' as const },
      { x: 5, z: 22, w: 3.2, h: 2.4, d: 3, wall: 0xfff3e0, roof: 0xe65100, style: 'gabled' as const },
      { x: -10, z: 24, w: 2.8, h: 2.5, d: 2.8, wall: 0xc8e6c9, roof: 0x1b5e20, style: 'gabled' as const },
      { x: 10, z: 24, w: 3, h: 3, d: 3, wall: 0xdce775, roof: 0x33691e, style: 'hip' as const },
    ];

    // Far background buildings (sparse)
    const bgBuildings = [];
    const bgRng = rng(123);
    for (let i = 0; i < 50; i++) {
      const angle = bgRng() * Math.PI * 2;
      const radius = 30 + bgRng() * 20;
      const bx = Math.sin(angle) * radius;
      const bz = Math.cos(angle) * radius - 15;
      const bh = 1.5 + bgRng() * 4;
      const wallColors2 = [0xeceff1, 0xe8eaf6, 0xe3f2fd, 0xfff8e1, 0xf1f8e9, 0xfce4ec, 0xe0f7fa];
      const roofColors2 = [0xb0bec5, 0x9fa8da, 0x90caf9, 0xffe082, 0xa5d6a7, 0xf48fb1, 0x80deea];
      bgBuildings.push({
        x: bx, z: bz, w: 2 + bgRng() * 1.5, h: bh, d: 2 + bgRng() * 1.5,
        wall: wallColors2[Math.floor(bgRng() * wallColors2.length)],
        roof: roofColors2[Math.floor(bgRng() * roofColors2.length)],
        style: (bgRng() > 0.5 ? 'gabled' : bgRng() > 0.3 ? 'hip' : 'flat') as 'flat' | 'gabled' | 'hip',
      });
    }

    for (const b of [...northBuildings, ...eastBuildings, ...westBuildings, ...southBuildings, ...bgBuildings]) {
      makeBuilding(scene, b.x, b.z, b.w, b.h, b.d, b.wall, (b as any).roof, b.style);
    }

    // ── Special Buildings ──────────────────────
    // Blue glassy small building (left of diagonal road, bottom left)
    const glassSmall = new THREE.Group();
    const gsBase = box(3.5, 2.8, 3.5, 0x0288d1);
    gsBase.position.y = 1.4;
    gsBase.castShadow = true;
    glassSmall.add(gsBase);
    const gsRoof = box(3.7, 0.3, 3.7, 0x01579b);
    gsRoof.position.y = 2.95;
    glassSmall.add(gsRoof);
    // glass panels
    const gpMat = new THREE.MeshLambertMaterial({ color: 0xb3e5fc, transparent: true, opacity: 0.65 });
    for (const [nx, nz] of [[0, 1.78], [0, -1.78], [1.78, 0], [-1.78, 0]]) {
      const gp = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 2.7), gpMat);
      gp.position.set(nx, 1.4, nz);
      gp.rotation.y = nx === 0 ? 0 : Math.PI / 2;
      glassSmall.add(gp);
    }
    glassSmall.position.set(-10, 0, 8);
    scene.add(glassSmall);

    // Purple pyramid building (bottom centre, in front of tower)
    const pyramidG = new THREE.Group();
    const pyrBase = box(3, 1.5, 3, 0x1a237e);
    pyrBase.position.y = 0.75;
    pyrBase.castShadow = true;
    pyramidG.add(pyrBase);
    const pyrTop = new THREE.Mesh(
      new THREE.CylinderGeometry(0, 2.1, 3.0, 4, 1),
      mat(0x7b1fa2)
    );
    pyrTop.position.y = 2.9;
    pyrTop.rotation.y = Math.PI / 4;
    pyrTop.castShadow = true;
    pyramidG.add(pyrTop);
    pyramidG.position.set(0.5, 0, 9);
    scene.add(pyramidG);

    // ── Trees scattered around city ────────────
    const treeRng = rng(77);
    const treeRings = [
      { count: 24, minR: 11, maxR: 14 },
      { count: 32, minR: 16, maxR: 20 },
      { count: 40, minR: 22, maxR: 28 },
      { count: 20, minR: 30, maxR: 36 },
    ];
    for (const { count, minR, maxR } of treeRings) {
      for (let i = 0; i < count; i++) {
        const ang = treeRng() * Math.PI * 2;
        const r = minR + treeRng() * (maxR - minR);
        const tx = Math.sin(ang) * r;
        const tz = Math.cos(ang) * r;
        // avoid road zone
        if (Math.abs(tx) < 2.2 || Math.abs(tz) < 2.2) continue;
        makeTree(scene, tx, tz, 0.65 + treeRng() * 0.6);
      }
    }

    // ── Cars ───────────────────────────────────
    const carColors = [0xe53935, 0xf9a825, 0x1976d2, 0x43a047, 0xffffff, 0x212121, 0xe91e63, 0xff9800];
    const carDefs = [
      { x: 2.0, z: -12, rot: 0, col: carColors[0] },
      { x: -2.0, z: 12, rot: Math.PI, col: carColors[1] },
      { x: 12, z: 2.0, rot: Math.PI / 2, col: carColors[2] },
      { x: -12, z: -2.0, rot: -Math.PI / 2, col: carColors[3] },
      { x: 1.5, z: -22, rot: 0, col: carColors[4] },
      { x: 22, z: 1.5, rot: Math.PI / 2, col: carColors[5] },
      { x: -22, z: -1.5, rot: -Math.PI / 2, col: carColors[6] },
      { x: -1.5, z: 22, rot: Math.PI, col: carColors[7] },
    ];
    for (const c of carDefs) {
      makeCar(scene, c.x, c.z, c.rot, c.col);
    }

    // ── Benches in roundabout ──────────────────
    for (let a = 0; a < Math.PI * 2; a += Math.PI) {
      const bx = Math.sin(a) * 4;
      const bz = Math.cos(a) * 4;
      const bench = box(0.9, 0.2, 0.3, 0x795548);
      bench.position.set(bx, 0.4, bz);
      scene.add(bench);
      const benchBack = box(0.9, 0.3, 0.07, 0x795548);
      benchBack.position.set(bx, 0.65, bz + 0.12);
      scene.add(benchBack);
    }

    // ── Lamp posts ─────────────────────────────
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 2) {
      const lx = Math.sin(a) * 8.5;
      const lz = Math.cos(a) * 8.5;
      const pole = cylinder(0.07, 2.4, 0x455a64);
      pole.position.set(lx, 1.2, lz);
      scene.add(pole);
      const lamp = sphere(0.18, 0xfffde7);
      lamp.position.set(lx + 0.0, 2.5, lz);
      scene.add(lamp);
    }

    // ── Resize observer ────────────────────────
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        const h = entry.contentRect.height;
        if (w > 0 && h > 0) {
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
        }
      }
    });
    ro.observe(container);

    // ── Animate ────────────────────────────────
    let raf = 0;
    const startTime = Date.now();

    // Car animation state
    const carMeshes = scene.children.filter((c): c is THREE.Group =>
      c instanceof THREE.Group && c.children.some(ch => ch instanceof THREE.Mesh && (ch as THREE.Mesh).geometry instanceof THREE.BoxGeometry && (ch as THREE.Mesh).position.y < 0.3)
    );

    // Store car start positions for animation
    const CAR_PATHS = carDefs.map((c) => ({ ...c, prog: Math.random() }));

    const animate = () => {
      raf = requestAnimationFrame(animate);
      const elapsed = (Date.now() - startTime) * 0.001;

      // Slow camera drift — gentle pan + slight bob
      const camX = Math.sin(elapsed * 0.05) * 3.5;
      const camY = 36 + Math.sin(elapsed * 0.07) * 0.8;
      camera.position.x = camX;
      camera.position.y = camY;
      camera.lookAt(camX * 0.1, 0, -6);

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      renderer.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
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
        borderRadius: '28px',
        overflow: 'hidden',
        cursor: 'default',
      }}
    />
  );
}
