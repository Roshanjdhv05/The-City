'use client';
import * as THREE from 'three';
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { solid, mat } from '@/lib/materials';
import { cityTime, getTimePhase } from '@/lib/time';

// ── Fountain Component: Circular illuminated tiered water fountain ──
export function WaterFountain({ position = [0, 0, 16] }: { position?: [number, number, number] }) {
  const waterRef = useRef<THREE.Mesh>(null);
  const sprayRefs = useRef<THREE.Mesh[]>([]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (waterRef.current) {
      waterRef.current.rotation.z = t * 0.08;
    }
    // animate jet sprays
    sprayRefs.current.forEach((mesh, idx) => {
      if (mesh) {
        const offset = idx * 0.4;
        const wave = Math.sin(t * 4 + offset);
        mesh.scale.set(1 + wave * 0.1, 1 + wave * 0.25, 1 + wave * 0.1);
      }
    });
  });

  const neonCyan = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#38bdf8',
    emissive: '#0284c7',
    emissiveIntensity: 2.2,
    flatShading: true,
  }), []);

  const waterMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#38bdf8',
    emissive: '#0369a1',
    emissiveIntensity: 0.9,
    roughness: 0.15,
    metalness: 0.2,
    transparent: true,
    opacity: 0.88,
  }), []);

  const sprayMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#e0f2fe',
    emissive: '#bae6fd',
    emissiveIntensity: 1.8,
    transparent: true,
    opacity: 0.75,
    flatShading: true,
  }), []);

  const stoneDark = useMemo(() => new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.6, flatShading: true }), []);
  const stoneSilver = useMemo(() => new THREE.MeshStandardMaterial({ color: '#94a3b8', roughness: 0.4, flatShading: true }), []);

  return (
    <group position={position}>
      {/* Outer Basin Base Ring */}
      <mesh position={[0, 0.2, 0]} material={stoneDark} castShadow receiveShadow>
        <cylinderGeometry args={[11.5, 11.8, 0.4, 48]} />
      </mesh>

      {/* Glowing Neon Accent Band */}
      <mesh position={[0, 0.4, 0]} material={neonCyan}>
        <cylinderGeometry args={[11.55, 11.55, 0.1, 48]} />
      </mesh>

      {/* Basin Rim */}
      <mesh position={[0, 0.55, 0]} material={stoneSilver} castShadow receiveShadow>
        <cylinderGeometry args={[11.4, 11.5, 0.25, 48]} />
      </mesh>

      {/* Inner Basin Pool Water */}
      <mesh ref={waterRef} position={[0, 0.58, 0]} rotation={[-Math.PI / 2, 0, 0]} material={waterMat}>
        <circleGeometry args={[10.6, 48]} />
      </mesh>

      {/* Middle Tier Basin Pedestal & Ring */}
      <mesh position={[0, 0.65, 0]} material={stoneDark} castShadow>
        <cylinderGeometry args={[6.2, 6.5, 0.5, 36]} />
      </mesh>
      <mesh position={[0, 0.9, 0]} material={stoneSilver} castShadow>
        <cylinderGeometry args={[6.4, 6.2, 0.25, 36]} />
      </mesh>
      <mesh position={[0, 0.95, 0]} material={neonCyan}>
        <cylinderGeometry args={[6.42, 6.42, 0.08, 36]} />
      </mesh>
      <mesh position={[0, 1.02, 0]} rotation={[-Math.PI / 2, 0, 0]} material={waterMat}>
        <circleGeometry args={[5.8, 36]} />
      </mesh>

      {/* Center Tier Basin */}
      <mesh position={[0, 1.25, 0]} material={stoneDark} castShadow>
        <cylinderGeometry args={[2.4, 2.6, 0.7, 24]} />
      </mesh>
      <mesh position={[0, 1.6, 0]} material={stoneSilver} castShadow>
        <cylinderGeometry args={[2.5, 2.4, 0.25, 24]} />
      </mesh>
      <mesh position={[0, 1.68, 0]} rotation={[-Math.PI / 2, 0, 0]} material={waterMat}>
        <circleGeometry args={[2.2, 24]} />
      </mesh>

      {/* Central Spire Column */}
      <mesh position={[0, 2.1, 0]} material={stoneDark} castShadow>
        <cylinderGeometry args={[0.5, 0.7, 1.2, 16]} />
      </mesh>

      {/* Water Jet Column in Center */}
      <mesh
        ref={el => { if (el) sprayRefs.current[0] = el; }}
        position={[0, 3.8, 0]}
        material={sprayMat}
      >
        <cylinderGeometry args={[0.3, 0.9, 3.2, 16]} />
      </mesh>
      <mesh position={[0, 5.5, 0]} material={sprayMat}>
        <coneGeometry args={[1.2, 1.8, 16]} />
      </mesh>

      {/* Ring of 8 Perimeter Sprays */}
      {Array.from({ length: 8 }).map((_, i) => {
        const ang = (i / 8) * Math.PI * 2;
        const rx = Math.cos(ang) * 7.5;
        const rz = Math.sin(ang) * 7.5;
        return (
          <group key={i} position={[rx, 0.6, rz]}>
            <mesh
              ref={el => { if (el) sprayRefs.current[i + 1] = el; }}
              position={[0, 1.2, 0]}
              material={sprayMat}
            >
              <cylinderGeometry args={[0.08, 0.22, 2.2, 8]} />
            </mesh>
            <mesh position={[0, 2.3, 0]} material={sprayMat}>
              <coneGeometry args={[0.35, 0.7, 8]} />
            </mesh>
          </group>
        );
      })}

      {/* Ring of 6 Inner Sprays */}
      {Array.from({ length: 6 }).map((_, i) => {
        const ang = (i / 6) * Math.PI * 2 + 0.3;
        const rx = Math.cos(ang) * 4.0;
        const rz = Math.sin(ang) * 4.0;
        return (
          <group key={`in-${i}`} position={[rx, 1.0, rz]}>
            <mesh
              ref={el => { if (el) sprayRefs.current[i + 9] = el; }}
              position={[0, 1.0, 0]}
              material={sprayMat}
            >
              <cylinderGeometry args={[0.06, 0.18, 1.8, 8]} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

// ── Plaza Decorative Surrounds: Benches, Lampposts & Flower Bush Planters ──
export function PlazaDecorations() {
  const benchWood = useMemo(() => new THREE.MeshStandardMaterial({ color: '#d97706', roughness: 0.8 }), []);
  const iron = useMemo(() => new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.5 }), []);
  const lampHead = useMemo(() => new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: '#fff7ed', emissiveIntensity: 2.0 }), []);
  const shrubGreen1 = useMemo(() => new THREE.MeshStandardMaterial({ color: '#22c55e', roughness: 0.8, flatShading: true }), []);
  const shrubGreen2 = useMemo(() => new THREE.MeshStandardMaterial({ color: '#16a34a', roughness: 0.8, flatShading: true }), []);
  const flowerPink = useMemo(() => new THREE.MeshStandardMaterial({ color: '#f43f5e', roughness: 0.7, flatShading: true }), []);

  const [poolTex, poolMat] = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 128;
    c.height = 128;
    const g = c.getContext('2d')!;
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, 'rgba(255, 235, 140, 0.75)');
    gr.addColorStop(0.4, 'rgba(255, 205, 80, 0.35)');
    gr.addColorStop(0.8, 'rgba(255, 180, 40, 0.1)');
    gr.addColorStop(1, 'rgba(255, 160, 20, 0)');
    g.fillStyle = gr;
    g.fillRect(0, 0, 128, 128);
    const t = new THREE.CanvasTexture(c);
    const m = new THREE.MeshBasicMaterial({
      map: t,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -3,
    });
    return [t, m];
  }, []);

  useFrame(() => {
    const { darkness } = getTimePhase(cityTime.hour);
    lampHead.emissiveIntensity = 0.3 + darkness * 3.5;
    lampHead.emissive.set(darkness > 0.1 ? '#ffda6e' : '#fff7ed');
    poolMat.opacity = Math.max(0, darkness * 0.75);
    poolMat.visible = darkness > 0.05;
  });

  // 6 Benches facing the central water fountain
  const benchPositions: [number, number, number][] = [
    [-11, 0, 27],
    [0, 0, 29],
    [11, 0, 27],
    [-21, 0, 18],
    [21, 0, 18],
    [-18, 0, 3],
  ];

  return (
    <group>
      {/* Plaza Curved Promenade Benches */}
      {benchPositions.map(([x, y, z], i) => {
        const rotY = Math.atan2(x, z - 16) + Math.PI;
        return (
          <group key={i} position={[x, y, z]} rotation={[0, rotY, 0]}>
            <mesh position={[0, 0.35, 0]} material={benchWood} castShadow>
              <boxGeometry args={[2.2, 0.1, 0.6]} />
            </mesh>
            <mesh position={[0, 0.65, -0.26]} material={benchWood} castShadow>
              <boxGeometry args={[2.2, 0.5, 0.08]} />
            </mesh>
            <mesh position={[-0.9, 0.2, 0]} material={iron}>
              <boxGeometry args={[0.1, 0.4, 0.55]} />
            </mesh>
            <mesh position={[0.9, 0.2, 0]} material={iron}>
              <boxGeometry args={[0.1, 0.4, 0.55]} />
            </mesh>
          </group>
        );
      })}

      {/* Elegant Plaza Lamp Posts */}
      {[
        [-14, 0, 23],
        [-5, 0, 27],
        [5, 0, 27],
        [14, 0, 23],
        [-24, 0, 12],
        [24, 0, 12],
      ].map(([x, y, z], i) => (
        <group key={`lamp-${i}`} position={[x, y, z]}>
          <mesh position={[0, 1.8, 0]} material={iron} castShadow>
            <cylinderGeometry args={[0.08, 0.14, 3.6, 8]} />
          </mesh>
          <mesh position={[0, 3.6, 0]} material={iron}>
            <boxGeometry args={[0.4, 0.1, 0.4]} />
          </mesh>
          <mesh position={[0, 3.85, 0]} material={lampHead}>
            <sphereGeometry args={[0.22, 12, 12]} />
          </mesh>
          {/* Night ground pool */}
          <mesh position={[0, 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]} material={poolMat}>
            <planeGeometry args={[7.5, 7.5]} />
          </mesh>
        </group>
      ))}

      {/* Flower Bed Curbs along the Promenade Ring */}
      {Array.from({ length: 14 }).map((_, i) => {
        const ang = (i / 14) * Math.PI * 0.9 + 0.15;
        const rx = Math.cos(ang) * 26.5;
        const rz = Math.sin(ang) * 26.5 + 4;
        const col = i % 2 === 0 ? shrubGreen1 : shrubGreen2;
        return (
          <group key={`shrub-${i}`} position={[rx, 0, rz]}>
            <mesh position={[0, 0.35, 0]} material={col} castShadow>
              <icosahedronGeometry args={[0.6, 1]} />
            </mesh>
            <mesh position={[0.3, 0.5, 0.1]} material={flowerPink}>
              <sphereGeometry args={[0.16, 8, 8]} />
            </mesh>
            <mesh position={[-0.25, 0.45, -0.15]} material={flowerPink}>
              <sphereGeometry args={[0.14, 8, 8]} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

