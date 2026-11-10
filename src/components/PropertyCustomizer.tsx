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
];

export default function PropertyCustomizer() {
  const [selectedStyle, setSelectedStyle] = useState<BuildingStyle>(STYLES[0]);
  const [businessName, setBusinessName] = useState('J ENTERPRISE');
  const [loadingModel, setLoadingModel] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const buildingGroupRef = useRef<THREE.Group | null>(null);
  const signTextureUpdaterRef = useRef<((txt: string, accentHex: string) => void) | null>(null);

  // Initialize Three.js scene once
  useEffect(() => {
    const container = canvasRef.current;
    if (!container) return;

    const width = container.clientWidth || 540;
    const height = container.clientHeight || 440;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 100);
    camera.position.set(11, 8.5, 13);
    camera.lookAt(0, 2.5, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xcfd8dc, 0.85);
    scene.add(hemiLight);

    const sun = new THREE.DirectionalLight(0xffffff, 2.2);
    sun.position.set(14, 22, 12);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 1024;
    sun.shadow.mapSize.height = 1024;
    sun.shadow.bias = -0.0005;
    scene.add(sun);

    const fill = new THREE.DirectionalLight(0x93c5fd, 0.9);
    fill.position.set(-12, 10, -10);
    scene.add(fill);

    // Pedestal Plaza
    const plazaGeo = new THREE.CylinderGeometry(6.4, 6.7, 0.5, 48);
    const plazaMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.7 });
    const plaza = new THREE.Mesh(plazaGeo, plazaMat);
    plaza.position.y = -0.25;
    plaza.receiveShadow = true;
    scene.add(plaza);

    // Plaza Steps
    const stepGeo = new THREE.BoxGeometry(4.8, 0.18, 1.6);
    const step = new THREE.Mesh(stepGeo, plazaMat);
    step.position.set(0, 0.08, 4.2);
    step.receiveShadow = true;
    scene.add(step);

    // Palm trees on plaza edge
    [[-4.2, 2.4], [4.2, 2.4], [-3.8, -2.8], [3.8, -2.8]].forEach((pos) => {
      const tg = new THREE.Group();
      tg.position.set(pos[0], 0, pos[1]);
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.12, 1.6, 8),
        new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 })
      );
      trunk.position.y = 0.8;
      trunk.castShadow = true;
      tg.add(trunk);

      const leaves = new THREE.Mesh(
        new THREE.SphereGeometry(0.85, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.8 })
      );
      leaves.scale.set(1, 0.7, 1);
      leaves.position.y = 1.7;
      leaves.castShadow = true;
      tg.add(leaves);

      scene.add(tg);
    });

    // Building Container Group (swapped when style changes)
    const buildingGroup = new THREE.Group();
    scene.add(buildingGroup);
    buildingGroupRef.current = buildingGroup;

    // Front Illuminated Signboard with Business Name
    const signCanvas = document.createElement('canvas');
    signCanvas.width = 512;
    signCanvas.height = 128;
    const signCtx = signCanvas.getContext('2d')!;

    const drawSign = (text: string, accentHex: string) => {
      signCtx.fillStyle = '#0a0f1d';
      signCtx.fillRect(0, 0, 512, 128);
      signCtx.strokeStyle = accentHex;
      signCtx.lineWidth = 8;
      signCtx.strokeRect(4, 4, 504, 120);

      // Accent pill dot
      signCtx.fillStyle = accentHex;
      signCtx.beginPath();
      signCtx.arc(36, 64, 10, 0, Math.PI * 2);
      signCtx.fill();

      signCtx.fillStyle = '#ffffff';
      signCtx.font = 'bold 38px sans-serif';
      signCtx.textAlign = 'center';
      signCtx.textBaseline = 'middle';
      signCtx.fillText((text || 'YOUR BUSINESS').toUpperCase(), 270, 64);
    };

    drawSign(businessName, selectedStyle.accent);
    const signTex = new THREE.CanvasTexture(signCanvas);
    const signMat = new THREE.MeshBasicMaterial({ map: signTex });
    const signMesh = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 0.9), signMat);
    signMesh.position.set(0, 0.9, 4.5);
    scene.add(signMesh);

    // Signboard back frame & posts
    const signBack = new THREE.Mesh(
      new THREE.BoxGeometry(3.68, 0.98, 0.08),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 })
    );
    signBack.position.set(0, 0.9, 4.45);
    signBack.castShadow = true;
    scene.add(signBack);

    const postGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.9, 8);
    const postMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5 });
    const postL = new THREE.Mesh(postGeo, postMat);
    postL.position.set(-1.6, 0.45, 4.45);
    scene.add(postL);
    const postR = postL.clone();
    postR.position.x = 1.6;
    scene.add(postR);

    signTextureUpdaterRef.current = (txt: string, accentHex: string) => {
      drawSign(txt, accentHex);
      signTex.needsUpdate = true;
    };

    // Mouse tilt & drag interaction
    let mouseX = 0;
    let mouseY = 0;
    let isDragging = false;
    let previousMouseX = 0;
    let userRotationY = 0;

    const onPointerDown = (e: MouseEvent) => {
      isDragging = true;
      previousMouseX = e.clientX;
    };

    const onPointerMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);

      if (isDragging) {
        const deltaX = e.clientX - previousMouseX;
        userRotationY += deltaX * 0.01;
        previousMouseX = e.clientX;
      }
    };

    const onPointerUp = () => {
      isDragging = false;
    };

    container.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);

    // Render loop
    let raf = 0;
    const render = () => {
      raf = requestAnimationFrame(render);

      // Camera gently tracks cursor tilt
      camera.position.x += (11 + mouseX * 2.2 - camera.position.x) * 0.05;
      camera.position.y += (8.5 + mouseY * 1.4 - camera.position.y) * 0.05;
      camera.lookAt(0, 2.5, 0);

      // Building rotates with user drag + subtle idle breathing
      if (buildingGroup) {
        if (!isDragging) {
          userRotationY += 0.003; // Gentle idle rotation
        }
        buildingGroup.rotation.y = userRotationY;
      }

      renderer.render(scene, camera);
    };
    render();

    // Resize observer
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
      ro.disconnect();
      renderer.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Load the 3D GLB model whenever selectedStyle changes
  useEffect(() => {
    const group = buildingGroupRef.current;
    if (!group) return;

    setLoadingModel(true);

    const loader = new GLTFLoader();
    loader.load(
      selectedStyle.file,
      (gltf) => {
        // Clear previous building meshes
        while (group.children.length > 0) {
          group.remove(group.children[0]);
        }

        const model = gltf.scene;

        // Auto-scale and center nicely on the plaza
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const targetHeight = 5.4;
        const scale = targetHeight / (size.y || maxDim || 1);

        model.scale.setScalar(scale);
        // Center horizontally, place bottom on y=0 (surface of the plaza)
        model.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);

        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
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
        gridTemplateColumns: 'minmax(280px, 1fr) minmax(320px, 1.4fr) minmax(260px, 0.95fr)',
        gap: '2.5rem',
        alignItems: 'center',
        background: 'linear-gradient(135deg, rgba(255,255,255,0.92) 0%, rgba(240,249,255,0.85) 100%)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.9)',
        borderRadius: '32px',
        padding: 'clamp(1.5rem, 3.5vw, 3rem)',
        boxShadow: '0 24px 64px -12px rgba(15, 23, 42, 0.08)',
      }}
    >
      {/* ── Left Column: Copy & Feature Badges ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.4rem' }}>
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
              lineHeight: 1.55,
              margin: 0,
            }}
          >
            Choose from authentic Nextown landmark towers, customize your building and claim your space in the city.
          </p>
        </div>

        {/* 3 Badges */}
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '999px',
              background: 'rgba(239, 246, 255, 0.9)',
              border: '1px solid rgba(37, 99, 235, 0.2)',
              fontSize: '0.8rem',
              fontWeight: 600,
              color: '#1d4ed8',
            }}
          >
            <span>🏢</span>
            <span>5 Official Towers</span>
          </div>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '999px',
              background: 'rgba(239, 246, 255, 0.9)',
              border: '1px solid rgba(37, 99, 235, 0.2)',
              fontSize: '0.8rem',
              fontWeight: 600,
              color: '#1d4ed8',
            }}
          >
            <span>⛶</span>
            <span>Custom Name Sign</span>
          </div>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '999px',
              background: 'rgba(239, 246, 255, 0.9)',
              border: '1px solid rgba(37, 99, 235, 0.2)',
              fontSize: '0.8rem',
              fontWeight: 600,
              color: '#1d4ed8',
            }}
          >
            <span>🔗</span>
            <span>Attach Website</span>
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
              padding: '0.95rem 2rem',
              borderRadius: '999px',
              fontSize: '1rem',
              fontWeight: 700,
              textDecoration: 'none',
              boxShadow: '0 8px 24px rgba(37, 99, 235, 0.35)',
              transition: 'all 0.2s ease',
            }}
          >
            <span>Claim Your Building</span>
            <span style={{ fontSize: '1.15rem' }}>→</span>
          </Link>
        </div>
      </div>

      {/* ── Center Column: Interactive 3D Building Display ── */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '420px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
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
              background: 'rgba(255, 255, 255, 0.7)',
              backdropFilter: 'blur(6px)',
              borderRadius: '24px',
              zIndex: 10,
              gap: '8px',
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                border: '3px solid rgba(37, 99, 235, 0.2)',
                borderTopColor: '#2563eb',
                animation: 'spin 0.8s linear infinite',
              }}
            />
            <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#1e3a8a' }}>
              Loading 3D Model…
            </span>
          </div>
        )}

        <div
          style={{
            position: 'absolute',
            bottom: '12px',
            fontSize: '0.72rem',
            fontWeight: 600,
            color: '#64748b',
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(8px)',
            padding: '4px 12px',
            borderRadius: '999px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            pointerEvents: 'none',
          }}
        >
          ↔ Drag to rotate building · Tilt view
        </div>
      </div>

      {/* ── Right Column: Style Selector & Name Input ── */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(14px)',
          border: '1px solid rgba(226, 232, 240, 0.9)',
          borderRadius: '24px',
          padding: '1.5rem',
          boxShadow: '0 8px 24px rgba(15, 23, 42, 0.04)',
        }}
      >
        <div>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', display: 'block', marginBottom: '0.75rem' }}>
            Select Building Model
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {STYLES.map((st) => {
              const active = selectedStyle.id === st.id;
              return (
                <button
                  key={st.id}
                  onClick={() => setSelectedStyle(st)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 12px',
                    borderRadius: '14px',
                    border: active ? `2px solid ${st.accent}` : '1.5px solid rgba(226, 232, 240, 0.9)',
                    background: active ? `${st.accent}12` : '#ffffff',
                    boxShadow: active ? `0 0 12px ${st.accent}33` : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.18s ease',
                    textAlign: 'left',
                  }}
                  title={st.name}
                >
                  <span
                    style={{
                      fontSize: '1.3rem',
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: `${st.accent}20`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {st.icon}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: active ? 700 : 600, color: active ? st.accent : '#0f172a', lineHeight: 1.2 }}>
                      {st.name}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {st.tag}
                    </div>
                  </div>
                  {active && (
                    <span style={{ color: st.accent, fontWeight: 800, fontSize: '0.85rem' }}>✓</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', display: 'block', marginBottom: '0.5rem' }}>
            Enter Business Name
          </label>
          <input
            type="text"
            value={businessName}
            maxLength={24}
            placeholder="Your Business"
            onChange={(e) => setBusinessName(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              borderRadius: '14px',
              border: '1.5px solid rgba(203, 213, 225, 0.8)',
              background: '#ffffff',
              color: '#0f172a',
              fontSize: '0.92rem',
              fontWeight: 600,
              outline: 'none',
              boxSizing: 'border-box',
              transition: 'border-color 0.2s',
            }}
          />
        </div>

        <Link
          href={`/buy?name=${encodeURIComponent(businessName)}&style=${selectedStyle.id}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
            color: '#ffffff',
            padding: '0.85rem 1.4rem',
            borderRadius: '14px',
            fontSize: '0.92rem',
            fontWeight: 700,
            textDecoration: 'none',
            boxShadow: '0 4px 16px rgba(37, 99, 235, 0.3)',
            transition: 'background 0.2s ease',
          }}
        >
          <span>Claim This Building</span>
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
