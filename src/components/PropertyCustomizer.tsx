'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

interface BuildingStyle {
  id: string;
  name: string;
  file: string;
  accent: string;
  icon: string;
  tag: string;
}

const STYLES: BuildingStyle[] = [
  {
    id: 'j_tower',
    name: 'J Enterprise Tower',
    file: '/01_J_Enterprise_Tower.glb',
    accent: '#2563eb',
    icon: '🏢',
    tag: 'Flagship Corporate Tower',
  },
  {
    id: 'pyramid',
    name: 'Pyramid HQ',
    file: '/02_Pyramid_HQ.glb',
    accent: '#8b5cf6',
    icon: '🔮',
    tag: 'Cyber Futuristic Pyramid',
  },
  {
    id: 'crown',
    name: 'Golden Crown Tower',
    file: '/03_Golden_Crown_Tower.glb',
    accent: '#f59e0b',
    icon: '👑',
    tag: 'Luxury Highrise Penthouse',
  },
  {
    id: 'dome',
    name: 'Dome Tower',
    file: '/04_Dome_Tower.glb',
    accent: '#06b6d4',
    icon: '🏛️',
    tag: 'Grand Architectural Rotunda',
  },
  {
    id: 'blue_tower',
    name: 'Blue Glass Tower',
    file: '/05_Blue_Tower.glb',
    accent: '#3b82f6',
    icon: '🏙️',
    tag: 'Modern Sky Spire',
  },
  {
    id: 'skyline_plaza',
    name: 'Skyline HQ Plaza',
    file: '/01_J_Enterprise_Tower.glb',
    accent: '#10b981',
    icon: '🌟',
    tag: 'Eco Corporate Spire',
  },
];

export default function PropertyCustomizer() {
  const [selectedStyle, setSelectedStyle] = useState<BuildingStyle>(STYLES[0]);
  const [businessName, setBusinessName] = useState('J ENTERPRISE');
  const [loadingModel, setLoadingModel] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);

  const canvasRef = useRef<HTMLDivElement>(null);
  const buildingGroupRef = useRef<THREE.Group | null>(null);
  const signTextureUpdaterRef = useRef<((txt: string, accentHex: string) => void) | null>(null);
  const zoomControlsRef = useRef<{ zoomIn: () => void; zoomOut: () => void; reset: () => void } | null>(null);

  // Initialize Three.js scene once
  useEffect(() => {
    const container = canvasRef.current;
    if (!container) return;

    const width = container.clientWidth || 560;
    const height = container.clientHeight || 460;

    const scene = new THREE.Scene();

    // Perspective camera with wide architectural lens
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 120);
    const CAM_R = 17;
    let yaw = 0.58; // Horizontal angle (~33 deg)
    let pitch = 0.44; // Vertical elevation (~25 deg)
    let zoomMultiplier = 1.0;

    function updateCamera() {
      const effR = (CAM_R / zoomMultiplier);
      camera.position.x = effR * Math.cos(pitch) * Math.sin(yaw);
      camera.position.y = effR * Math.sin(pitch) + 1.2;
      camera.position.z = effR * Math.cos(pitch) * Math.cos(yaw);
      camera.lookAt(0, 2.6, 0);
    }
    updateCamera();

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // ── Lighting Setup ──────────────────────────────────────────────
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xcfd8e3, 0.9);
    scene.add(hemiLight);

    // Warm Sun Directional Light
    const sun = new THREE.DirectionalLight(0xfffaed, 2.4);
    sun.position.set(16, 26, 14);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.bias = -0.0004;
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 60;
    sun.shadow.camera.left = -9;
    sun.shadow.camera.right = 9;
    sun.shadow.camera.top = 9;
    sun.shadow.camera.bottom = -9;
    scene.add(sun);

    // Cool Sky Fill Light
    const fillLight = new THREE.DirectionalLight(0xa5c9eb, 1.1);
    fillLight.position.set(-14, 16, -12);
    scene.add(fillLight);

    // Back rim light for architectural edge highlight
    const rimLight = new THREE.DirectionalLight(0xbfdbfe, 0.8);
    rimLight.position.set(0, 20, -18);
    scene.add(rimLight);

    // ── Procedural Granite Pavers Texture for Plaza ───────────────────
    const createPaverTexture = () => {
      const cv = document.createElement('canvas');
      cv.width = 512;
      cv.height = 512;
      const ctx = cv.getContext('2d')!;

      // Light elegant granite stone background
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, 512, 512);

      // Fine paving joints
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 3;
      const step = 64;
      for (let x = 0; x <= 512; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 512);
        ctx.stroke();
      }
      for (let y = 0; y <= 512; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(512, y);
        ctx.stroke();
      }

      // Subtle natural stone stipple noise
      const imgData = ctx.getImageData(0, 0, 512, 512);
      for (let i = 0; i < imgData.data.length; i += 4) {
        const noise = (Math.random() - 0.5) * 6;
        imgData.data[i] = Math.min(255, Math.max(0, imgData.data[i] + noise));
        imgData.data[i + 1] = Math.min(255, Math.max(0, imgData.data[i + 1] + noise));
        imgData.data[i + 2] = Math.min(255, Math.max(0, imgData.data[i + 2] + noise));
      }
      ctx.putImageData(imgData, 0, 0);

      const tex = new THREE.CanvasTexture(cv);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(5, 5);
      return tex;
    };

    const paverTexture = createPaverTexture();

    // ── Detailed Multi-tier Plaza Podium ──────────────────────────────
    const plazaGroup = new THREE.Group();
    scene.add(plazaGroup);

    // Tier 1: Dark Slate Foundation Curb
    const baseCurbGeo = new THREE.CylinderGeometry(7.2, 7.5, 0.45, 64);
    const baseCurbMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8, metalness: 0.2 });
    const baseCurb = new THREE.Mesh(baseCurbGeo, baseCurbMat);
    baseCurb.position.y = -0.45;
    baseCurb.receiveShadow = true;
    plazaGroup.add(baseCurb);

    // Glowing LED Perimeter Ring around base
    const ringGeo = new THREE.TorusGeometry(7.18, 0.04, 12, 64);
    const ringMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 1.5, roughness: 0.2 });
    const ledRing = new THREE.Mesh(ringGeo, ringMat);
    ledRing.rotation.x = Math.PI / 2;
    ledRing.position.y = -0.23;
    plazaGroup.add(ledRing);

    // Tier 2: Main Granite Plaza Surface
    const plazaGeo = new THREE.CylinderGeometry(7.0, 7.2, 0.45, 64);
    const plazaMat = new THREE.MeshStandardMaterial({
      map: paverTexture,
      roughness: 0.55,
      metalness: 0.08,
    });
    const plaza = new THREE.Mesh(plazaGeo, plazaMat);
    plaza.position.y = -0.02;
    plaza.receiveShadow = true;
    plazaGroup.add(plaza);

    // Tier 3: Inner Elevated Building Base Terrace
    const terraceGeo = new THREE.BoxGeometry(7.6, 0.22, 6.8);
    const terraceMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.4, metalness: 0.1 });
    const terrace = new THREE.Mesh(terraceGeo, terraceMat);
    terrace.position.set(0, 0.11, -0.4);
    terrace.receiveShadow = true;
    plazaGroup.add(terrace);

    // Front Grand Entrance Steps (3-tier stepped staircase)
    [
      { w: 5.6, d: 1.4, h: 0.12, y: 0.06, z: 3.3 },
      { w: 5.0, d: 1.1, h: 0.12, y: 0.14, z: 3.1 },
      { w: 4.4, d: 0.8, h: 0.12, y: 0.22, z: 2.8 },
    ].forEach((s) => {
      const stepMesh = new THREE.Mesh(new THREE.BoxGeometry(s.w, s.h, s.d), terraceMat);
      stepMesh.position.set(0, s.y, s.z);
      stepMesh.receiveShadow = true;
      stepMesh.castShadow = true;
      plazaGroup.add(stepMesh);
    });

    // ── Architectural Landscaping: Stylized Palms & Modern Planters ───
    const createPalmTree = (x: number, z: number, scale = 1.0) => {
      const tg = new THREE.Group();
      tg.position.set(x, 0.2, z);
      tg.scale.setScalar(scale);

      // Planter Box (Dark stone cube planter)
      const planter = new THREE.Mesh(
        new THREE.BoxGeometry(1.0, 0.35, 1.0),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.6 })
      );
      planter.position.y = 0.17;
      planter.castShadow = true;
      planter.receiveShadow = true;
      tg.add(planter);

      // Soil inside planter
      const soil = new THREE.Mesh(
        new THREE.BoxGeometry(0.88, 0.05, 0.88),
        new THREE.MeshStandardMaterial({ color: 0x3f2d1d, roughness: 0.95 })
      );
      soil.position.y = 0.35;
      tg.add(soil);

      // Low decorative boxwood hedge ring
      const hedge = new THREE.Mesh(
        new THREE.CylinderGeometry(0.52, 0.54, 0.22, 12),
        new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.85 })
      );
      hedge.position.y = 0.44;
      tg.add(hedge);

      // Curved segmented palm trunk
      const trunkMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.85 });
      for (let i = 0; i < 6; i++) {
        const seg = new THREE.Mesh(new THREE.CylinderGeometry(0.08 - i * 0.007, 0.1 - i * 0.007, 0.38, 8), trunkMat);
        seg.position.set(Math.sin(i * 0.2) * 0.08, 0.5 + i * 0.34, Math.cos(i * 0.2) * 0.04);
        seg.rotation.z = -0.06;
        seg.castShadow = true;
        tg.add(seg);
      }

      // Layered tropical palm fronds
      const leafMat = new THREE.MeshStandardMaterial({
        color: 0x15803d,
        roughness: 0.6,
        side: THREE.DoubleSide,
      });

      for (let i = 0; i < 9; i++) {
        const angle = (i / 9) * Math.PI * 2;
        const frond = new THREE.Mesh(new THREE.ConeGeometry(0.24, 1.45, 4), leafMat);
        frond.position.set(Math.cos(angle) * 0.45, 2.5, Math.sin(angle) * 0.45);
        frond.rotation.z = Math.cos(angle) * -1.25;
        frond.rotation.x = Math.sin(angle) * 1.25;
        frond.rotation.y = angle;
        frond.castShadow = true;
        tg.add(frond);
      }

      plazaGroup.add(tg);
    };

    // Place lush palms symmetrically around the building plaza
    createPalmTree(-4.6, 2.6, 1.05);
    createPalmTree(4.6, 2.6, 1.05);
    createPalmTree(-4.8, -2.8, 0.95);
    createPalmTree(4.8, -2.8, 0.95);

    // ── Modern Plaza Elements: Street Bollards with Glowing Tops ───────
    const bollardMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4, metalness: 0.7 });
    const bollardLightMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 2.0 });

    [
      [-2.8, 4.3],
      [-1.4, 4.3],
      [1.4, 4.3],
      [2.8, 4.3],
    ].forEach(([bx, bz]) => {
      const bPost = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.6, 12), bollardMat);
      bPost.position.set(bx, 0.3, bz);
      bPost.castShadow = true;
      plazaGroup.add(bPost);

      const bHead = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.08, 12), bollardLightMat);
      bHead.position.set(bx, 0.62, bz);
      plazaGroup.add(bHead);
    });

    // ── Architectural Ground Spotlights Illuminating the Tower ─────────
    const spotL = new THREE.SpotLight(0xbfdbfe, 3.5, 14, Math.PI / 5, 0.4, 1);
    spotL.position.set(-3.2, 0.3, 2.5);
    spotL.target.position.set(0, 3.5, 0);
    scene.add(spotL);
    scene.add(spotL.target);

    const spotR = new THREE.SpotLight(0xfff1d6, 3.5, 14, Math.PI / 5, 0.4, 1);
    spotR.position.set(3.2, 0.3, 2.5);
    spotR.target.position.set(0, 3.5, 0);
    scene.add(spotR);
    scene.add(spotR.target);

    // ── Building Container Group (swapped when style changes) ──────────
    const buildingGroup = new THREE.Group();
    scene.add(buildingGroup);
    buildingGroupRef.current = buildingGroup;

    // ── Premium Front Illuminated Signboard with Business Name ─────────
    const signCanvas = document.createElement('canvas');
    signCanvas.width = 512;
    signCanvas.height = 140;
    const signCtx = signCanvas.getContext('2d')!;

    const drawSign = (text: string, accentHex: string) => {
      // Dark slate glass acrylic surface
      signCtx.fillStyle = '#0a0f1d';
      signCtx.fillRect(0, 0, 512, 140);

      // Glowing outer accent border
      signCtx.strokeStyle = accentHex;
      signCtx.lineWidth = 6;
      signCtx.strokeRect(4, 4, 504, 132);

      // Top glowing bar
      signCtx.fillStyle = accentHex;
      signCtx.fillRect(4, 4, 504, 6);

      // Icon badge
      signCtx.beginPath();
      signCtx.arc(42, 70, 14, 0, Math.PI * 2);
      signCtx.fillStyle = accentHex;
      signCtx.fill();

      signCtx.fillStyle = '#ffffff';
      signCtx.font = 'bold 15px sans-serif';
      signCtx.textAlign = 'center';
      signCtx.textBaseline = 'middle';
      signCtx.fillText('★', 42, 70);

      // Main Business Title
      signCtx.fillStyle = '#ffffff';
      signCtx.font = 'bold 36px sans-serif';
      signCtx.textAlign = 'center';
      signCtx.textBaseline = 'middle';
      const cleanName = (text || 'YOUR BUSINESS').toUpperCase();
      signCtx.fillText(cleanName, 276, 58);

      // Subtitle
      signCtx.fillStyle = '#94a3b8';
      signCtx.font = '600 15px sans-serif';
      signCtx.fillText('NEXTOWN FLAGSHIP PROPERTY', 276, 96);
    };

    drawSign(businessName, selectedStyle.accent);
    const signTex = new THREE.CanvasTexture(signCanvas);
    const signMat = new THREE.MeshBasicMaterial({ map: signTex });

    const signMesh = new THREE.Mesh(new THREE.PlaneGeometry(3.8, 1.05), signMat);
    signMesh.position.set(0, 1.0, 4.6);
    scene.add(signMesh);

    // Signboard back casing
    const signBack = new THREE.Mesh(
      new THREE.BoxGeometry(3.88, 1.12, 0.1),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4, metalness: 0.6 })
    );
    signBack.position.set(0, 1.0, 4.54);
    signBack.castShadow = true;
    scene.add(signBack);

    // Aluminum mounting poles
    const postMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.3, metalness: 0.8 });
    const postL = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.0, 12), postMat);
    postL.position.set(-1.75, 0.5, 4.54);
    scene.add(postL);
    const postR = postL.clone();
    postR.position.x = 1.75;
    scene.add(postR);

    signTextureUpdaterRef.current = (txt: string, accentHex: string) => {
      drawSign(txt, accentHex);
      signTex.needsUpdate = true;
    };

    // ── Mouse Drag, Orbit & Tilt Controls ─────────────────────────────
    let down = false;
    let lx = 0;
    let ly = 0;

    const onPointerDown = (e: MouseEvent) => {
      down = true;
      lx = e.clientX;
      ly = e.clientY;
    };

    const onPointerMove = (e: MouseEvent) => {
      if (down) {
        const dx = e.clientX - lx;
        const dy = e.clientY - ly;
        lx = e.clientX;
        ly = e.clientY;

        yaw += dx * 0.007;
        pitch = Math.max(0.12, Math.min(1.2, pitch - dy * 0.006));
        updateCamera();
      }
    };

    const onPointerUp = () => {
      down = false;
    };

    container.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);

    // Wheel zoom
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      zoomMultiplier = Math.max(0.65, Math.min(2.5, zoomMultiplier - e.deltaY * 0.0015));
      updateCamera();
    };
    container.addEventListener('wheel', onWheel, { passive: false });

    // Expose zoom controls
    zoomControlsRef.current = {
      zoomIn: () => {
        zoomMultiplier = Math.min(2.5, zoomMultiplier + 0.25);
        updateCamera();
      },
      zoomOut: () => {
        zoomMultiplier = Math.max(0.65, zoomMultiplier - 0.25);
        updateCamera();
      },
      reset: () => {
        zoomMultiplier = 1.0;
        yaw = 0.58;
        pitch = 0.44;
        updateCamera();
      },
    };

    // ── Render & Animation Loop ───────────────────────────────────────
    let raf = 0;
    let lastTime = 0;

    const render = (time: number) => {
      raf = requestAnimationFrame(render);
      const dt = Math.min(0.05, (time - lastTime) * 0.001);
      lastTime = time;

      // Gentle auto rotation if enabled and not currently dragging
      if (autoRotate && !down) {
        yaw += dt * 0.12;
        updateCamera();
      }

      renderer.render(scene, camera);
    };
    raf = requestAnimationFrame(render);

    // ── Resize Observer ───────────────────────────────────────────────
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

    return () => {
      cancelAnimationFrame(raf);
      container.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('mouseup', onPointerUp);
      container.removeEventListener('wheel', onWheel);
      ro.disconnect();
      renderer.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, [autoRotate]);

  // Load the 3D GLB model whenever selectedStyle changes
  useEffect(() => {
    const group = buildingGroupRef.current;
    if (!group) return;

    setLoadingModel(true);

    const loader = new GLTFLoader();
    loader.load(
      selectedStyle.file,
      (gltf) => {
        // Clear previous meshes
        while (group.children.length > 0) {
          group.remove(group.children[0]);
        }

        const model = gltf.scene;

        // Auto-scale and center nicely on the elevated terrace
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const targetHeight = 5.8;
        const scale = targetHeight / (size.y || maxDim || 1);

        model.scale.setScalar(scale);
        model.position.set(-center.x * scale, -box.min.y * scale + 0.22, -center.z * scale - 0.4);

        // Enhance materials of the loaded building model
        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.castShadow = true;
            mesh.receiveShadow = true;

            const mat = mesh.material as THREE.MeshStandardMaterial;
            if (mat) {
              mat.roughness = Math.min(mat.roughness ?? 0.6, 0.65);
              mat.metalness = Math.max(mat.metalness ?? 0.1, 0.15);

              // Tinted architectural glass enhancement
              const nameLower = (mesh.name || '').toLowerCase();
              if (
                nameLower.includes('glass') ||
                nameLower.includes('window') ||
                nameLower.includes('pane') ||
                mat.transparent
              ) {
                mat.transparent = true;
                mat.opacity = Math.min(mat.opacity, 0.85);
                mat.roughness = 0.1;
                mat.metalness = 0.3;
              }
            }
          }
        });

        group.add(model);
        setLoadingModel(false);
      },
      undefined,
      (err) => {
        console.error('Error loading building GLB:', err);
        setLoadingModel(false);
      }
    );
  }, [selectedStyle]);

  // Update signboard text & accent when name or style changes
  useEffect(() => {
    if (signTextureUpdaterRef.current) {
      signTextureUpdaterRef.current(businessName, selectedStyle.accent);
    }
  }, [businessName, selectedStyle]);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(280px, 1fr) minmax(360px, 1.45fr) minmax(280px, 1fr)',
        gap: '2.5rem',
        alignItems: 'center',
        background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(240,249,255,0.9) 100%)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.95)',
        borderRadius: '32px',
        padding: 'clamp(1.5rem, 3.5vw, 3rem)',
        boxShadow: '0 24px 64px -12px rgba(15, 23, 42, 0.08)',
      }}
    >
      {/* ── Left Column: Copy & Feature Badges ────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div>
          <h3
            style={{
              fontSize: 'clamp(2rem, 3.2vw, 2.8rem)',
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: '-0.03em',
              color: '#0f172a',
              margin: '0 0 0.8rem',
            }}
          >
            Design Your <br />
            <span style={{ color: '#2563eb' }}>Virtual</span> Property
          </h3>
          <p
            style={{
              fontSize: '1rem',
              color: '#475569',
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            Choose a style, customize your building and claim your space in Nextown.
          </p>
        </div>

        {/* 3 Badges */}
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              borderRadius: '999px',
              background: 'rgba(239, 246, 255, 0.9)',
              border: '1px solid rgba(37, 99, 235, 0.2)',
              fontSize: '0.82rem',
              fontWeight: 700,
              color: '#1d4ed8',
            }}
          >
            <span>🎁</span>
            <span>Multiple Styles</span>
          </div>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              borderRadius: '999px',
              background: 'rgba(239, 246, 255, 0.9)',
              border: '1px solid rgba(37, 99, 235, 0.2)',
              fontSize: '0.82rem',
              fontWeight: 700,
              color: '#1d4ed8',
            }}
          >
            <span>⛶</span>
            <span>Custom Branding</span>
          </div>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              borderRadius: '999px',
              background: 'rgba(239, 246, 255, 0.9)',
              border: '1px solid rgba(37, 99, 235, 0.2)',
              fontSize: '0.82rem',
              fontWeight: 700,
              color: '#1d4ed8',
            }}
          >
            <span>🔗</span>
            <span>Attach Your Website</span>
          </div>
        </div>

        {/* Primary Claim CTA */}
        <div>
          <Link
            href={`/buy?name=${encodeURIComponent(businessName)}&style=${selectedStyle.id}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.75rem',
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              color: '#ffffff',
              padding: '1rem 2.2rem',
              borderRadius: '999px',
              fontSize: '1rem',
              fontWeight: 700,
              textDecoration: 'none',
              boxShadow: '0 8px 24px rgba(37, 99, 235, 0.38)',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            }}
          >
            <span>Claim Your Building</span>
            <span style={{ fontSize: '1.15rem' }}>→</span>
          </Link>
        </div>
      </div>

      {/* ── Center Column: Interactive 3D Building Display ────────────── */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '460px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '24px',
          overflow: 'hidden',
          background: 'radial-gradient(ellipse 65% 65% at 50% 50%, rgba(219, 234, 254, 0.45) 0%, transparent 80%)',
        }}
      >
        <div ref={canvasRef} style={{ width: '100%', height: '100%', cursor: 'grab' }} />

        {/* Loading Spinner */}
        {loadingModel && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(255, 255, 255, 0.75)',
              backdropFilter: 'blur(8px)',
              borderRadius: '24px',
              zIndex: 10,
              gap: '10px',
            }}
          >
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: '50%',
                border: '3.5px solid rgba(37, 99, 235, 0.2)',
                borderTopColor: '#2563eb',
                animation: 'spin 0.8s linear infinite',
              }}
            />
            <span style={{ fontSize: '0.86rem', fontWeight: 700, color: '#1e3a8a' }}>
              Rendering 3D Tower…
            </span>
          </div>
        )}

        {/* Top-right View & Zoom Controls */}
        <div
          style={{
            position: 'absolute',
            top: '14px',
            right: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            zIndex: 5,
          }}
        >
          <button
            onClick={() => zoomControlsRef.current?.zoomIn()}
            title="Zoom In"
            style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.92)',
              border: '1px solid rgba(203,213,225,0.8)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              cursor: 'pointer',
              fontSize: '17px',
              fontWeight: 700,
              color: '#1e293b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            +
          </button>
          <button
            onClick={() => zoomControlsRef.current?.zoomOut()}
            title="Zoom Out"
            style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.92)',
              border: '1px solid rgba(203,213,225,0.8)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              cursor: 'pointer',
              fontSize: '17px',
              fontWeight: 700,
              color: '#1e293b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            −
          </button>
          <button
            onClick={() => zoomControlsRef.current?.reset()}
            title="Reset View"
            style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.92)',
              border: '1px solid rgba(203,213,225,0.8)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 700,
              color: '#1e293b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ↺
          </button>
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            title={autoRotate ? 'Pause Rotation' : 'Auto Rotate'}
            style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              background: autoRotate ? '#eff6ff' : 'rgba(255,255,255,0.92)',
              border: autoRotate ? '1.5px solid #2563eb' : '1px solid rgba(203,213,225,0.8)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 700,
              color: autoRotate ? '#2563eb' : '#1e293b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {autoRotate ? '⏸' : '▶'}
          </button>
        </div>

        {/* Bottom Interaction Hint */}
        <div
          style={{
            position: 'absolute',
            bottom: '12px',
            fontSize: '0.72rem',
            fontWeight: 600,
            color: '#475569',
            background: 'rgba(255, 255, 255, 0.92)',
            backdropFilter: 'blur(8px)',
            padding: '5px 14px',
            borderRadius: '999px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span>↔ Drag to orbit</span>
          <span>·</span>
          <span>↕ Tilt</span>
          <span>·</span>
          <span>🔍 Scroll zoom</span>
        </div>
      </div>

      {/* ── Right Column: Style Selector (Grid Layout) & Name Input ───── */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(226, 232, 240, 0.95)',
          borderRadius: '24px',
          padding: '1.5rem',
          boxShadow: '0 8px 24px rgba(15, 23, 42, 0.04)',
        }}
      >
        <div>
          <span
            style={{
              fontSize: '0.88rem',
              fontWeight: 800,
              color: '#0f172a',
              display: 'block',
              marginBottom: '0.75rem',
            }}
          >
            Select Style
          </span>

          {/* 3-column Grid matching reference layout */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {STYLES.map((st) => {
              const active = selectedStyle.id === st.id;
              return (
                <button
                  key={st.id}
                  onClick={() => setSelectedStyle(st)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '10px 6px',
                    borderRadius: '14px',
                    border: active ? `2px solid ${st.accent}` : '1.5px solid rgba(226, 232, 240, 0.9)',
                    background: active ? `${st.accent}14` : '#ffffff',
                    boxShadow: active ? `0 0 14px ${st.accent}33` : '0 2px 4px rgba(0,0,0,0.02)',
                    cursor: 'pointer',
                    transition: 'all 0.18s ease',
                    textAlign: 'center',
                  }}
                  title={st.name}
                >
                  <span
                    style={{
                      fontSize: '1.5rem',
                      width: '38px',
                      height: '38px',
                      borderRadius: '10px',
                      background: `${st.accent}18`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {st.icon}
                  </span>
                  <div
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: active ? 800 : 600,
                      color: active ? st.accent : '#334155',
                      lineHeight: 1.15,
                      maxHeight: '2.4em',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {st.name.replace(' Tower', '').replace(' HQ', '')}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Enter Name */}
        <div>
          <label
            style={{
              fontSize: '0.85rem',
              fontWeight: 800,
              color: '#0f172a',
              display: 'block',
              marginBottom: '0.5rem',
            }}
          >
            Enter Name
          </label>
          <input
            type="text"
            value={businessName}
            maxLength={24}
            placeholder="Your Business"
            onChange={(e) => setBusinessName(e.target.value)}
            style={{
              width: '100%',
              padding: '0.8rem 1rem',
              borderRadius: '14px',
              border: '1.5px solid rgba(203, 213, 225, 0.85)',
              background: '#ffffff',
              color: '#0f172a',
              fontSize: '0.94rem',
              fontWeight: 600,
              outline: 'none',
              boxSizing: 'border-box',
              transition: 'border-color 0.2s',
            }}
          />
        </div>

        {/* Preview Building button (matching reference blue pill) */}
        <Link
          href={`/buy?name=${encodeURIComponent(businessName)}&style=${selectedStyle.id}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
            color: '#ffffff',
            padding: '0.95rem 1.4rem',
            borderRadius: '999px',
            fontSize: '0.95rem',
            fontWeight: 700,
            textDecoration: 'none',
            boxShadow: '0 4px 16px rgba(37, 99, 235, 0.35)',
            transition: 'all 0.2s ease',
          }}
        >
          <span>Preview Building</span>
          <span>→</span>
        </Link>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
