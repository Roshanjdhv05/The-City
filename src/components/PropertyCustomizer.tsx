'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import * as THREE from 'three';

interface BuildingStyle {
  id: string;
  name: string;
  theme: string;
  accent: string;
  glass: string;
  icon: string;
}

const STYLES: BuildingStyle[] = [
  { id: 'corporate', name: 'Corporate HQ', theme: '#1e293b', accent: '#2563eb', glass: '#38bdf8', icon: '🏢' },
  { id: 'modern', name: 'Modern Glass', theme: '#0f172a', accent: '#06b6d4', glass: '#67e8f9', icon: '🏙️' },
  { id: 'boutique', name: 'Boutique Store', theme: '#334155', accent: '#f59e0b', glass: '#fde047', icon: '🏪' },
  { id: 'studio', name: 'Cyber Studio', theme: '#18181b', accent: '#8b5cf6', glass: '#c084fc', icon: '🔮' },
  { id: 'minimal', name: 'Eco Pavilion', theme: '#14532d', accent: '#22c55e', glass: '#86efac', icon: '🌿' },
  { id: 'tower', name: 'Sky Highrise', theme: '#1e1b4b', accent: '#ec4899', glass: '#f472b6', icon: '🏛️' },
];

export default function PropertyCustomizer() {
  const [selectedStyle, setSelectedStyle] = useState<BuildingStyle>(STYLES[0]);
  const [businessName, setBusinessName] = useState('J ENTERPRISE');
  const canvasRef = useRef<HTMLDivElement>(null);
  const buildingMeshRef = useRef<THREE.Group | null>(null);
  const signTextTextureRef = useRef<{ updateText: (txt: string, col: string) => void } | null>(null);

  useEffect(() => {
    const container = canvasRef.current;
    if (!container) return;

    const width = container.clientWidth || 520;
    const height = container.clientHeight || 420;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(10, 7.5, 12);
    camera.lookAt(0, 2.2, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const sun = new THREE.DirectionalLight(0xffffff, 2.0);
    sun.position.set(12, 18, 10);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 1024;
    sun.shadow.mapSize.height = 1024;
    scene.add(sun);

    const fill = new THREE.DirectionalLight(0x93c5fd, 0.8);
    fill.position.set(-10, 8, -8);
    scene.add(fill);

    // Pedestal Plaza
    const plazaGeo = new THREE.BoxGeometry(11, 0.5, 9);
    const plazaMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.8 });
    const plaza = new THREE.Mesh(plazaGeo, plazaMat);
    plaza.position.y = -0.25;
    plaza.receiveShadow = true;
    scene.add(plaza);

    // Ground Steps
    const step1 = new THREE.Mesh(new THREE.BoxGeometry(7, 0.2, 2.5), plazaMat);
    step1.position.set(0, 0.1, 3.8);
    step1.receiveShadow = true;
    scene.add(step1);

    // Building Group
    const bGroup = new THREE.Group();
    scene.add(bGroup);
    buildingMeshRef.current = bGroup;

    // Main Structure
    const wallMat = new THREE.MeshStandardMaterial({ color: selectedStyle.theme, roughness: 0.4 });
    const glassMat = new THREE.MeshStandardMaterial({
      color: selectedStyle.glass,
      roughness: 0.1,
      metalness: 0.3,
      transparent: true,
      opacity: 0.82,
    });
    const accentMat = new THREE.MeshStandardMaterial({ color: selectedStyle.accent, roughness: 0.3 });

    // Lower floors
    const b1 = new THREE.Mesh(new THREE.BoxGeometry(6.4, 4.2, 5.2), wallMat);
    b1.position.y = 2.1;
    b1.castShadow = true;
    b1.receiveShadow = true;
    bGroup.add(b1);

    // Large glass curtain windows
    const win1 = new THREE.Mesh(new THREE.BoxGeometry(5.8, 3.6, 0.2), glassMat);
    win1.position.set(0, 2.1, 2.62);
    bGroup.add(win1);

    // Modern frame borders
    const frameTop = new THREE.Mesh(new THREE.BoxGeometry(6.6, 0.3, 5.4), accentMat);
    frameTop.position.y = 4.25;
    frameTop.castShadow = true;
    bGroup.add(frameTop);

    // Entrance canopy
    const canopy = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.18, 1.4), accentMat);
    canopy.position.set(0, 1.6, 3.1);
    canopy.castShadow = true;
    bGroup.add(canopy);

    // Columns
    const colMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5 });
    const colL = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.6), colMat);
    colL.position.set(-1.6, 0.8, 3.6);
    bGroup.add(colL);
    const colR = colL.clone();
    colR.position.x = 1.6;
    bGroup.add(colR);

    // Planters & trees
    const planterGeo = new THREE.CylinderGeometry(0.45, 0.4, 0.5, 16);
    const planterMat = new THREE.MeshStandardMaterial({ color: 0x475569 });
    const pL = new THREE.Mesh(planterGeo, planterMat);
    pL.position.set(-3.2, 0.25, 3.4);
    pL.castShadow = true;
    scene.add(pL);
    const pR = pL.clone();
    pR.position.x = 3.2;
    scene.add(pR);

    // Palm Tree Foliage
    const treeTrunkGeo = new THREE.CylinderGeometry(0.09, 0.12, 1.4);
    const treeTrunkMat = new THREE.MeshStandardMaterial({ color: 0x78350f });
    const treeLeavesGeo = new THREE.SphereGeometry(0.8, 8, 8);
    const treeLeavesMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.9 });

    const trunkL = new THREE.Mesh(treeTrunkGeo, treeTrunkMat);
    trunkL.position.set(-3.2, 1.1, 3.4);
    trunkL.castShadow = true;
    scene.add(trunkL);
    const leavesL = new THREE.Mesh(treeLeavesGeo, treeLeavesMat);
    leavesL.position.set(-3.2, 1.9, 3.4);
    leavesL.castShadow = true;
    scene.add(leavesL);

    const trunkR = trunkL.clone();
    trunkR.position.x = 3.2;
    scene.add(trunkR);
    const leavesR = leavesL.clone();
    leavesR.position.x = 3.2;
    scene.add(leavesR);

    // Signboard canvas texture
    const signCanvas = document.createElement('canvas');
    signCanvas.width = 512;
    signCanvas.height = 128;
    const signCtx = signCanvas.getContext('2d')!;

    const drawSign = (text: string, accentHex: string) => {
      signCtx.fillStyle = '#090d16';
      signCtx.fillRect(0, 0, 512, 128);
      signCtx.strokeStyle = accentHex;
      signCtx.lineWidth = 6;
      signCtx.strokeRect(4, 4, 504, 120);

      signCtx.fillStyle = '#ffffff';
      signCtx.font = 'bold 44px sans-serif';
      signCtx.textAlign = 'center';
      signCtx.textBaseline = 'middle';
      signCtx.fillText(text.toUpperCase() || 'YOUR BUSINESS', 256, 64);
    };

    drawSign(businessName, selectedStyle.accent);
    const signTex = new THREE.CanvasTexture(signCanvas);
    const signMat = new THREE.MeshBasicMaterial({ map: signTex });
    const signMesh = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 0.8), signMat);
    signMesh.position.set(0, 3.4, 2.66);
    bGroup.add(signMesh);

    signTextTextureRef.current = {
      updateText: (txt: string, accentHex: string) => {
        drawSign(txt, accentHex);
        signTex.needsUpdate = true;
        wallMat.color.set(selectedStyle.theme);
        accentMat.color.set(accentHex);
        glassMat.color.set(selectedStyle.glass);
      },
    };

    // Mouse tilt interaction
    let mouseX = 0;
    let mouseY = 0;
    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    };
    container.addEventListener('mousemove', onMouseMove);

    // Render loop
    let raf = 0;
    const render = () => {
      raf = requestAnimationFrame(render);
      // Gentle floating animation
      camera.position.x += (10 + mouseX * 2.5 - camera.position.x) * 0.05;
      camera.position.y += (7.5 + mouseY * 1.5 - camera.position.y) * 0.05;
      camera.lookAt(0, 2.2, 0);

      // Slow idle rotation
      bGroup.rotation.y = Math.sin(Date.now() * 0.0006) * 0.08;

      renderer.render(scene, camera);
    };
    render();

    // Resize
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
      container.removeEventListener('mousemove', onMouseMove);
      ro.disconnect();
      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Update 3D sign & materials when style or name changes
  useEffect(() => {
    if (signTextTextureRef.current) {
      signTextTextureRef.current.updateText(businessName, selectedStyle.accent);
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
              padding: '6px 12px',
              borderRadius: '999px',
              background: 'rgba(239, 246, 255, 0.9)',
              border: '1px solid rgba(37, 99, 235, 0.2)',
              fontSize: '0.8rem',
              fontWeight: 600,
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
            <span>Custom Branding</span>
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
          height: '400px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div ref={canvasRef} style={{ width: '100%', height: '100%', cursor: 'grab' }} />
        <div
          style={{
            position: 'absolute',
            bottom: '12px',
            fontSize: '0.72rem',
            fontWeight: 600,
            color: '#94a3b8',
            background: 'rgba(255, 255, 255, 0.85)',
            padding: '3px 10px',
            borderRadius: '999px',
            pointerEvents: 'none',
          }}
        >
          Hover & move cursor to tilt view
        </div>
      </div>

      {/* ── Right Column: Style Selector & Name Input ── */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
          background: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(14px)',
          border: '1px solid rgba(226, 232, 240, 0.9)',
          borderRadius: '24px',
          padding: '1.5rem',
          boxShadow: '0 8px 24px rgba(15, 23, 42, 0.04)',
        }}
      >
        <div>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', display: 'block', marginBottom: '0.75rem' }}>
            Select Style
          </span>
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
                    gap: '4px',
                    padding: '12px 6px',
                    borderRadius: '16px',
                    border: active ? '2px solid #2563eb' : '1.5px solid rgba(226, 232, 240, 0.9)',
                    background: active ? 'rgba(239, 246, 255, 0.95)' : '#ffffff',
                    boxShadow: active ? '0 0 12px rgba(37, 99, 235, 0.25)' : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.18s ease',
                  }}
                  title={st.name}
                >
                  <span style={{ fontSize: '1.5rem' }}>{st.icon}</span>
                  <span style={{ fontSize: '0.68rem', fontWeight: active ? 700 : 600, color: active ? '#1d4ed8' : '#64748b', textAlign: 'center', lineHeight: 1.1 }}>
                    {st.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', display: 'block', marginBottom: '0.5rem' }}>
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
            background: '#2563eb',
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
          <span>Preview Building</span>
          <span>→</span>
        </Link>
      </div>
    </div>
  );
}

