'use client';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

interface DistrictBadge {
  id: string;
  name: string;
  sub: string;
  icon: string;
  color: string;
  pos: { top?: string; bottom?: string; left?: string; right?: string };
  targetAngle: number;
}

const DISTRICTS: DistrictBadge[] = [
  {
    id: 'tech',
    name: 'Tech District',
    sub: '50+ Businesses',
    icon: '🔷',
    color: '#3b82f6',
    pos: { top: '10%', left: '4%' },
    targetAngle: 0.8,
  },
  {
    id: 'business',
    name: 'Business Hub',
    sub: 'Grow Together',
    icon: '🤝',
    color: '#f59e0b',
    pos: { top: '8%', right: '6%' },
    targetAngle: 2.4,
  },
  {
    id: 'creative',
    name: 'Creative Zone',
    sub: 'Innovate & Inspire',
    icon: '🎨',
    color: '#a855f7',
    pos: { bottom: '16%', right: '4%' },
    targetAngle: 4.2,
  },
];

export default function TownModelViewer({
  onSelectDistrict,
}: {
  onSelectDistrict?: (id: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [activeDistrict, setActiveDistrict] = useState<string | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const isInteracting = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 560;

    // Scene
    const scene = new THREE.Scene();

    // Camera (Isometric angle)
    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 100);
    camera.position.set(22, 18, 24);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.75;
    controls.maxPolarAngle = Math.PI / 2.15; // don't go below island base
    controls.minPolarAngle = Math.PI / 6;
    controls.minDistance = 14;
    controls.maxDistance = 46;
    controls.target.set(0, 0.5, 0);
    controlsRef.current = controls;

    controls.addEventListener('start', () => { isInteracting.current = true; });
    controls.addEventListener('end', () => { isInteracting.current = false; });

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xdbeafe, 1.3);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x93c5fd, 0.85);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 2.2);
    sunLight.position.set(20, 32, 18);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.bias = -0.0005;
    sunLight.shadow.camera.near = 5;
    sunLight.shadow.camera.far = 70;
    const d = 16;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    scene.add(sunLight);

    const fillLight = new THREE.DirectionalLight(0x60a5fa, 0.8);
    fillLight.position.set(-18, 14, -18);
    scene.add(fillLight);

    // Fluffy cloud disk beneath the island for floating effect
    const cloudGeo = new THREE.CylinderGeometry(13.5, 15.5, 1.2, 36);
    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.9,
      metalness: 0.05,
      transparent: true,
      opacity: 0.45,
    });
    const cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
    cloudMesh.position.y = -1.8;
    cloudMesh.receiveShadow = true;
    scene.add(cloudMesh);

    // Load Model
    let townGroup: THREE.Group | null = null;
    const loader = new GLTFLoader();
    loader.load(
      '/models/nextown_full_town.glb',
      (gltf) => {
        const root = gltf.scene;

        // Auto-fit & center
        const box = new THREE.Box3().setFromObject(root);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const targetScale = 19 / (maxDim || 1);

        root.scale.setScalar(targetScale);
        root.position.set(
          -center.x * targetScale,
          -center.y * targetScale + 0.6,
          -center.z * targetScale
        );

        root.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.castShadow = true;
            mesh.receiveShadow = true;

            const mat = mesh.material as THREE.MeshStandardMaterial;
            if (mat) {
              if (mat.name && mat.name.toLowerCase().includes('glass')) {
                mat.transparent = true;
                mat.opacity = 0.78;
                mat.roughness = 0.1;
                mat.metalness = 0.2;
              } else {
                mat.roughness = Math.max(0.35, mat.roughness ?? 0.5);
              }
            }
          }
        });

        scene.add(root);
        townGroup = root;
        setLoading(false);
      },
      undefined,
      (err) => {
        console.error('Error loading town GLB:', err);
        setLoading(false);
      }
    );

    // Responsive Resize Observer
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

    // Animation Loop
    let raf = 0;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      controls.update();

      // Subtle cloud breathing float
      cloudMesh.position.y = -1.8 + Math.sin(Date.now() * 0.0012) * 0.15;

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      controls.dispose();
      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, []);

  const handleDistrictClick = (d: DistrictBadge) => {
    setActiveDistrict(d.id);
    if (onSelectDistrict) onSelectDistrict(d.id);
    if (controlsRef.current) {
      const radius = 32;
      const height = 18;
      const x = Math.sin(d.targetAngle) * radius;
      const z = Math.cos(d.targetAngle) * radius;
      // Gentle camera tween
      const camera = controlsRef.current.object;
      const startX = camera.position.x;
      const startZ = camera.position.z;
      const startTime = performance.now();
      const duration = 650;

      const step = (now: number) => {
        const p = Math.min(1, (now - startTime) / duration);
        const ease = 0.5 - Math.cos(p * Math.PI) / 2;
        camera.position.x = startX + (x - startX) * ease;
        camera.position.z = startZ + (z - startZ) * ease;
        camera.position.y = height;
        controlsRef.current?.update();
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: '480px',
        maxHeight: '660px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* 3D Canvas Mounting Point */}
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
          cursor: 'grab',
          position: 'relative',
          zIndex: 1,
        }}
      />

      {/* Loading Placeholder */}
      {loading && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'radial-gradient(circle, rgba(239, 246, 255, 0.8) 0%, rgba(219, 234, 254, 0.4) 100%)',
            backdropFilter: 'blur(10px)',
            zIndex: 2,
            borderRadius: '24px',
            color: '#1e3a8a',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: '50%',
              border: '3.5px solid rgba(59, 130, 246, 0.2)',
              borderTopColor: '#2563eb',
              animation: 'spin 0.9s linear infinite',
            }}
          />
          <span style={{ fontSize: '0.92rem', fontWeight: 600, letterSpacing: '-0.01em' }}>
            Preparing 3D City View…
          </span>
        </div>
      )}

      {/* Stylized Floating Cloud Accents around base */}
      <div
        style={{
          position: 'absolute',
          bottom: '2%',
          left: '10%',
          right: '10%',
          height: '90px',
          background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.7) 45%, rgba(255,255,255,0) 80%)',
          filter: 'blur(22px)',
          pointerEvents: 'none',
          zIndex: 3,
        }}
      />

      {/* District Badges Overlaid directly on the 3D model */}
      {!loading &&
        DISTRICTS.map((d) => {
          const isActive = activeDistrict === d.id;
          return (
            <button
              key={d.id}
              onClick={() => handleDistrictClick(d)}
              style={{
                position: 'absolute',
                ...d.pos,
                zIndex: 10,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '9px',
                padding: '8px 16px',
                borderRadius: '999px',
                background: isActive
                  ? 'rgba(15, 23, 42, 0.92)'
                  : 'rgba(15, 23, 42, 0.82)',
                backdropFilter: 'blur(14px)',
                WebkitBackdropFilter: 'blur(14px)',
                border: isActive
                  ? `2px solid ${d.color}`
                  : '1.5px solid rgba(255, 255, 255, 0.22)',
                boxShadow: isActive
                  ? `0 12px 30px rgba(0,0,0,0.35), 0 0 18px ${d.color}66`
                  : '0 8px 24px rgba(0, 0, 0, 0.22)',
                color: '#ffffff',
                cursor: 'pointer',
                transition: 'all 0.22s cubic-bezier(0.2, 0.8, 0.2, 1)',
                transform: isActive ? 'scale(1.05)' : 'scale(1)',
                animation: 'floatBadge 4s ease-in-out infinite',
              }}
              title={`View ${d.name}`}
            >
              <span
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: `${d.color}25`,
                  border: `1.5px solid ${d.color}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                }}
              >
                {d.icon}
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', lineHeight: 1.15 }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.01em' }}>
                  {d.name}
                </span>
                <span style={{ fontSize: '0.68rem', fontWeight: 500, color: '#94a3b8' }}>
                  {d.sub}
                </span>
              </div>
            </button>
          );
        })}

      {/* Floating badge animation */}
      <style>{`
        @keyframes floatBadge {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

