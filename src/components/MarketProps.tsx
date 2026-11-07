'use client';
import * as THREE from 'three';
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Layout } from '@/lib/layout';
import { toWorld } from '@/lib/plots';
import { DISTRICTS, CITY } from '@/lib/city';
import { D2R } from '@/lib/geom';

// -------------------------------------------------------------
// Material factory helpers (called inside useMemo, never at module level)
// -------------------------------------------------------------
const mkStd = (params: THREE.MeshStandardMaterialParameters) =>
  new THREE.MeshStandardMaterial({ flatShading: true, ...params });

function useM() {
  return useMemo(() => ({
    chrome:          mkStd({ color: '#f1f5f9', metalness: 0.92, roughness: 0.12 }),
    darkSteel:       mkStd({ color: '#1e293b', metalness: 0.8, roughness: 0.25 }),
    blackMetal:      mkStd({ color: '#090d16', metalness: 0.7, roughness: 0.35 }),
    glassCyan:       mkStd({ color: '#38bdf8', emissive: '#0284c7', emissiveIntensity: 0.5, transparent: true, opacity: 0.65, roughness: 0.1 }),
    glassPurple:     mkStd({ color: '#c084fc', emissive: '#7c3aed', emissiveIntensity: 0.5, transparent: true, opacity: 0.65, roughness: 0.1 }),
    glassGreen:      mkStd({ color: '#4ade80', emissive: '#15803d', emissiveIntensity: 0.4, transparent: true, opacity: 0.65, roughness: 0.1 }),
    acrylicWhite:    mkStd({ color: '#ffffff', roughness: 0.18 }),
    concretePedestal:mkStd({ color: '#cbd5e1', roughness: 0.85 }),
    darkPedestal:    mkStd({ color: '#334155', roughness: 0.75 }),
    // Emissives
    cyanNeon:        mkStd({ color: '#38bdf8', emissive: '#0ea5e9', emissiveIntensity: 2.2 }),
    purpleNeon:      mkStd({ color: '#c084fc', emissive: '#9333ea', emissiveIntensity: 2.2 }),
    greenNeon:       mkStd({ color: '#4ade80', emissive: '#16a34a', emissiveIntensity: 2.0 }),
    blueNeon:        mkStd({ color: '#60a5fa', emissive: '#2563eb', emissiveIntensity: 2.2 }),
    orangeNeon:      mkStd({ color: '#fb923c', emissive: '#ea580c', emissiveIntensity: 2.0 }),
    goldNeon:        mkStd({ color: '#facc15', emissive: '#ca8a04', emissiveIntensity: 1.9 }),
    pinkNeon:        mkStd({ color: '#f472b6', emissive: '#db2777', emissiveIntensity: 2.0 }),
    redNeon:         mkStd({ color: '#f87171', emissive: '#dc2626', emissiveIntensity: 2.0 }),
  }), []);
}

// =============================================================
// MARKET 1: SAAS (Cloud Computing & Business Software)
// =============================================================
export function CloudComputingSculpture() {
  const M = useM();
  const gRef = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (gRef.current) gRef.current.rotation.y = Math.sin(clock.elapsedTime * 0.5) * 0.25;
  });
  return (
    <group>
      <mesh position={[0, 0.45, 0]} material={M.darkPedestal} castShadow receiveShadow>
        <cylinderGeometry args={[2.2, 2.5, 0.9, 8]} />
      </mesh>
      <mesh position={[0, 0.92, 0]} material={M.cyanNeon}>
        <cylinderGeometry args={[2.1, 2.1, 0.05, 8]} />
      </mesh>
      <mesh position={[0, 2.0, 0]} material={M.chrome} castShadow>
        <cylinderGeometry args={[0.25, 0.4, 2.2, 12]} />
      </mesh>
      <group ref={gRef} position={[0, 3.6, 0]}>
        <mesh position={[0, 0, 0]} material={M.acrylicWhite} castShadow>
          <sphereGeometry args={[1.25, 16, 12]} />
        </mesh>
        <mesh position={[-0.9, -0.2, 0.1]} material={M.acrylicWhite} castShadow>
          <sphereGeometry args={[0.95, 14, 10]} />
        </mesh>
        <mesh position={[0.95, -0.25, -0.1]} material={M.acrylicWhite} castShadow>
          <sphereGeometry args={[0.88, 14, 10]} />
        </mesh>
        <mesh position={[0.2, 0.7, -0.1]} material={M.glassCyan}>
          <sphereGeometry args={[0.85, 14, 10]} />
        </mesh>
        <mesh rotation={[Math.PI / 3, 0, 0]} material={M.cyanNeon}>
          <torusGeometry args={[1.9, 0.05, 8, 32]} />
        </mesh>
      </group>
    </group>
  );
}

export function ServerRackInstallation() {
  const M = useM();
  return (
    <group>
      <mesh position={[0, 0.15, 0]} material={M.darkPedestal} castShadow>
        <boxGeometry args={[1.8, 0.3, 1.2]} />
      </mesh>
      <mesh position={[-0.45, 1.5, 0]} material={M.blackMetal} castShadow>
        <boxGeometry args={[0.7, 2.4, 0.9]} />
      </mesh>
      <mesh position={[0.45, 1.5, 0]} material={M.blackMetal} castShadow>
        <boxGeometry args={[0.7, 2.4, 0.9]} />
      </mesh>
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh key={i} position={[-0.45, 0.6 + i * 0.28, 0.46]} material={i % 3 === 0 ? M.greenNeon : M.cyanNeon}>
          <boxGeometry args={[0.55, 0.04, 0.02]} />
        </mesh>
      ))}
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh key={`r2-${i}`} position={[0.45, 0.6 + i * 0.28, 0.46]} material={i % 4 === 0 ? M.blueNeon : M.greenNeon}>
          <boxGeometry args={[0.55, 0.04, 0.02]} />
        </mesh>
      ))}
      <mesh position={[0, 1.5, 0]} material={M.glassCyan}>
        <boxGeometry args={[1.7, 2.45, 0.96]} />
      </mesh>
    </group>
  );
}

export function AnalyticsDashboardDisplay() {
  const M = useM();
  return (
    <group>
      <mesh position={[0, 0.3, 0]} material={M.darkPedestal} castShadow>
        <boxGeometry args={[2.2, 0.6, 1.2]} />
      </mesh>
      <mesh position={[0, 1.6, 0]} material={M.blackMetal} castShadow>
        <boxGeometry args={[1.8, 1.1, 0.1]} />
      </mesh>
      <mesh position={[0, 1.6, 0.06]} material={M.glassCyan}>
        <planeGeometry args={[1.7, 1.0]} />
      </mesh>
      {/* 3D analytics bars */}
      {[-0.6, -0.2, 0.2, 0.6].map((x, i) => (
        <mesh key={i} position={[x, 1.3 + (i + 1) * 0.12, 0.08]} material={i === 3 ? M.greenNeon : M.cyanNeon}>
          <boxGeometry args={[0.18, (i + 1) * 0.25, 0.04]} />
        </mesh>
      ))}
    </group>
  );
}

export function DatabaseCylinderSculpture() {
  const M = useM();
  return (
    <group>
      <mesh position={[0, 0.3, 0]} material={M.darkPedestal} castShadow>
        <cylinderGeometry args={[1.4, 1.6, 0.6, 16]} />
      </mesh>
      {[0, 1, 2].map((i) => (
        <group key={i} position={[0, 0.9 + i * 0.85, 0]}>
          <mesh material={M.chrome} castShadow>
            <cylinderGeometry args={[1.15, 1.15, 0.55, 24]} />
          </mesh>
          <mesh material={M.cyanNeon}>
            <cylinderGeometry args={[1.18, 1.18, 0.06, 24]} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 3.7, 0]} material={M.blueNeon}>
        <octahedronGeometry args={[0.4, 0]} />
      </mesh>
    </group>
  );
}

export function CloudTechMonument() {
  const M = useM();
  return (
    <group>
      <mesh position={[0, 0.4, 0]} material={M.darkSteel} castShadow>
        <cylinderGeometry args={[1.5, 1.8, 0.8, 12]} />
      </mesh>
      {/* Central obelisk */}
      <mesh position={[0, 2.6, 0]} material={M.glassCyan} castShadow>
        <boxGeometry args={[0.8, 3.6, 0.8]} />
      </mesh>
      <mesh position={[0, 4.6, 0]} material={M.cyanNeon}>
        <octahedronGeometry args={[0.6, 0]} />
      </mesh>
    </group>
  );
}

// =============================================================
// MARKET 2: AI (Artificial Intelligence & Robotics)
// =============================================================
export function AIBrainSculpture() {
  const M = useM();
  const coreRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (coreRef.current) {
      coreRef.current.rotation.y = clock.elapsedTime * 0.4;
      coreRef.current.rotation.x = Math.sin(clock.elapsedTime * 0.3) * 0.2;
    }
  });
  return (
    <group>
      <mesh position={[0, 0.5, 0]} material={M.darkSteel} castShadow receiveShadow>
        <cylinderGeometry args={[1.8, 2.2, 1.0, 12]} />
      </mesh>
      <mesh position={[0, 1.02, 0]} material={M.purpleNeon}>
        <cylinderGeometry args={[1.7, 1.7, 0.05, 12]} />
      </mesh>
      <group position={[0, 3.2, 0]}>
        <mesh ref={coreRef} material={M.glassPurple}>
          <icosahedronGeometry args={[1.5, 2]} />
        </mesh>
        <mesh material={M.purpleNeon}>
          <octahedronGeometry args={[0.75, 1]} />
        </mesh>
        <mesh rotation={[0.4, 0.4, 0]} material={M.cyanNeon}>
          <torusGeometry args={[2.0, 0.04, 8, 36]} />
        </mesh>
        <mesh rotation={[-0.6, 0.8, 0.4]} material={M.purpleNeon}>
          <torusGeometry args={[2.2, 0.04, 8, 36]} />
        </mesh>
      </group>
    </group>
  );
}

export function NeuralNetworkGlobe() {
  const M = useM();
  const gRef = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (gRef.current) gRef.current.rotation.y = clock.elapsedTime * 0.3;
  });
  return (
    <group>
      <mesh position={[0, 0.35, 0]} material={M.darkPedestal} castShadow>
        <cylinderGeometry args={[1.2, 1.5, 0.7, 16]} />
      </mesh>
      <group ref={gRef} position={[0, 2.2, 0]}>
        <mesh material={M.cyanNeon}>
          <sphereGeometry args={[1.2, 12, 10]} />
        </mesh>
        <mesh material={M.glassPurple}>
          <icosahedronGeometry args={[1.4, 1]} />
        </mesh>
      </group>
    </group>
  );
}

export function RoboticArmInstallation() {
  const M = useM();
  return (
    <group>
      <mesh position={[0, 0.4, 0]} material={M.blackMetal} castShadow>
        <cylinderGeometry args={[1.1, 1.4, 0.8, 12]} />
      </mesh>
      <mesh position={[0, 0.82, 0]} material={M.cyanNeon}>
        <cylinderGeometry args={[0.95, 0.95, 0.06, 12]} />
      </mesh>
      <group position={[0, 0.85, 0]} rotation={[0.3, 0.5, 0]}>
        <mesh position={[0, 1.0, 0]} material={M.darkSteel} castShadow>
          <boxGeometry args={[0.35, 2.0, 0.35]} />
        </mesh>
        <mesh position={[0, 2.0, 0]} material={M.chrome}>
          <sphereGeometry args={[0.32, 12, 10]} />
        </mesh>
        <group position={[0, 2.0, 0]} rotation={[-0.8, 0, 0]}>
          <mesh position={[0, 0.9, 0]} material={M.darkSteel} castShadow>
            <boxGeometry args={[0.28, 1.8, 0.28]} />
          </mesh>
          <mesh position={[0, 1.8, 0]} material={M.cyanNeon}>
            <coneGeometry args={[0.25, 0.5, 8]} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

export function AIHologramKiosk() {
  const M = useM();
  return (
    <group>
      <mesh position={[0, 0.5, 0]} material={M.blackMetal} castShadow>
        <cylinderGeometry args={[0.9, 1.1, 1.0, 16]} />
      </mesh>
      <mesh position={[0, 1.02, 0]} material={M.cyanNeon}>
        <cylinderGeometry args={[0.85, 0.85, 0.05, 16]} />
      </mesh>
      <mesh position={[0, 2.4, 0]} material={M.glassCyan}>
        <dodecahedronGeometry args={[0.8, 0]} />
      </mesh>
      <mesh position={[0, 2.4, 0]} material={M.purpleNeon}>
        <octahedronGeometry args={[0.45, 0]} />
      </mesh>
    </group>
  );
}

export function SmallRobotSculpture() {
  const M = useM();
  return (
    <group>
      <mesh position={[0, 0.2, 0]} material={M.darkPedestal} castShadow>
        <cylinderGeometry args={[0.8, 1.0, 0.4, 16]} />
      </mesh>
      {/* Robot Torso */}
      <mesh position={[0, 1.0, 0]} material={M.acrylicWhite} castShadow>
        <boxGeometry args={[0.7, 0.8, 0.5]} />
      </mesh>
      {/* Cyan Chest Core */}
      <mesh position={[0, 1.0, 0.26]} material={M.cyanNeon}>
        <boxGeometry args={[0.3, 0.3, 0.04]} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 1.65, 0]} material={M.acrylicWhite} castShadow>
        <boxGeometry args={[0.6, 0.45, 0.45]} />
      </mesh>
      {/* Visor */}
      <mesh position={[0, 1.65, 0.24]} material={M.purpleNeon}>
        <boxGeometry args={[0.5, 0.18, 0.04]} />
      </mesh>
    </group>
  );
}

// =============================================================
// MARKET 3: DEVELOPMENT (Programming & Software Engineering)
// =============================================================
export function CodeBracketsSculpture() {
  const M = useM();
  return (
    <group>
      <mesh position={[0, 0.35, 0]} material={M.darkPedestal} castShadow receiveShadow>
        <boxGeometry args={[3.4, 0.7, 1.4]} />
      </mesh>
      <mesh position={[0, 0.72, 0]} material={M.greenNeon}>
        <boxGeometry args={[3.2, 0.05, 1.2]} />
      </mesh>
      <group position={[-1.1, 2.1, 0]}>
        <mesh position={[0.2, 0.55, 0]} rotation={[0, 0, -Math.PI / 4]} material={M.chrome} castShadow>
          <boxGeometry args={[1.4, 0.24, 0.32]} />
        </mesh>
        <mesh position={[0.2, -0.55, 0]} rotation={[0, 0, Math.PI / 4]} material={M.chrome} castShadow>
          <boxGeometry args={[1.4, 0.24, 0.32]} />
        </mesh>
      </group>
      <mesh position={[0, 2.1, 0]} rotation={[0, 0, Math.PI / 6]} material={M.greenNeon} castShadow>
        <boxGeometry args={[0.24, 2.6, 0.32]} />
      </mesh>
      <group position={[1.1, 2.1, 0]}>
        <mesh position={[-0.2, 0.55, 0]} rotation={[0, 0, Math.PI / 4]} material={M.chrome} castShadow>
          <boxGeometry args={[1.4, 0.24, 0.32]} />
        </mesh>
        <mesh position={[-0.2, -0.55, 0]} rotation={[0, 0, -Math.PI / 4]} material={M.chrome} castShadow>
          <boxGeometry args={[1.4, 0.24, 0.32]} />
        </mesh>
      </group>
    </group>
  );
}

export function DeveloperWorkstationInstallation() {
  const M = useM();
  return (
    <group>
      <mesh position={[0, 0.8, 0]} material={M.darkPedestal} castShadow>
        <boxGeometry args={[2.0, 0.08, 1.0]} />
      </mesh>
      <mesh position={[-0.9, 0.4, 0]} material={M.blackMetal}>
        <boxGeometry args={[0.08, 0.8, 0.9]} />
      </mesh>
      <mesh position={[0.9, 0.4, 0]} material={M.blackMetal}>
        <boxGeometry args={[0.08, 0.8, 0.9]} />
      </mesh>
      <mesh position={[0, 1.45, -0.2]} material={M.blackMetal} castShadow>
        <boxGeometry args={[1.5, 0.7, 0.08]} />
      </mesh>
      <mesh position={[0, 1.45, -0.15]} material={M.greenNeon}>
        <planeGeometry args={[1.42, 0.62]} />
      </mesh>
      <mesh position={[0, 0.86, 0.15]} material={M.blackMetal}>
        <boxGeometry args={[0.8, 0.03, 0.3]} />
      </mesh>
      <mesh position={[0, 0.88, 0.15]} material={M.cyanNeon}>
        <boxGeometry args={[0.6, 0.02, 0.2]} />
      </mesh>
    </group>
  );
}

export function LaptopWorkstationSculpture() {
  const M = useM();
  return (
    <group>
      <mesh position={[0, 0.5, 0]} material={M.concretePedestal} castShadow>
        <boxGeometry args={[1.6, 1.0, 1.0]} />
      </mesh>
      {/* Laptop base */}
      <mesh position={[0, 1.03, 0.1]} material={M.darkSteel} castShadow>
        <boxGeometry args={[1.0, 0.04, 0.7]} />
      </mesh>
      {/* Open Screen */}
      <mesh position={[0, 1.4, -0.2]} rotation={[-0.25, 0, 0]} material={M.greenNeon}>
        <boxGeometry args={[1.0, 0.65, 0.04]} />
      </mesh>
    </group>
  );
}

export function GitBranchInstallation() {
  const M = useM();
  return (
    <group>
      <mesh position={[0, 0.2, 0]} material={M.darkPedestal} castShadow>
        <cylinderGeometry args={[1.2, 1.4, 0.4, 16]} />
      </mesh>
      {/* Main trunk */}
      <mesh position={[-0.4, 1.5, 0]} material={M.darkSteel}>
        <cylinderGeometry args={[0.08, 0.08, 2.4, 12]} />
      </mesh>
      {/* Commit nodes */}
      {[0.7, 1.4, 2.2].map((y, i) => (
        <mesh key={i} position={[-0.4, y, 0]} material={M.greenNeon}>
          <sphereGeometry args={[0.22, 12, 10]} />
        </mesh>
      ))}
      {/* Feature branch line */}
      <mesh position={[0.1, 1.8, 0]} rotation={[0, 0, -0.5]} material={M.darkSteel}>
        <cylinderGeometry args={[0.06, 0.06, 1.4, 12]} />
      </mesh>
      <mesh position={[0.4, 1.8, 0]} material={M.purpleNeon}>
        <sphereGeometry args={[0.22, 12, 10]} />
      </mesh>
    </group>
  );
}

export function SiliconProcessorMonument() {
  const M = useM();
  return (
    <group>
      <mesh position={[0, 0.3, 0]} material={M.darkSteel} castShadow>
        <boxGeometry args={[2.2, 0.6, 2.2]} />
      </mesh>
      <mesh position={[0, 0.62, 0]} material={M.goldNeon}>
        <boxGeometry args={[2.0, 0.05, 2.0]} />
      </mesh>
      <mesh position={[0, 0.95, 0]} material={M.chrome} castShadow>
        <boxGeometry args={[1.4, 0.6, 1.4]} />
      </mesh>
      <mesh position={[0, 1.28, 0]} rotation={[-Math.PI / 2, 0, 0]} material={M.greenNeon}>
        <planeGeometry args={[0.9, 0.9]} />
      </mesh>
    </group>
  );
}

// =============================================================
// MARKET 4: WINDOWS APPS (Windows Desktop Applications)
// =============================================================
export function FourPaneWindowSculpture() {
  const M = useM();
  return (
    <group>
      <mesh position={[0, 0.45, 0]} material={M.concretePedestal} castShadow receiveShadow>
        <boxGeometry args={[3.0, 0.9, 1.1]} />
      </mesh>
      <mesh position={[0, 0.92, 0]} material={M.blueNeon}>
        <boxGeometry args={[2.8, 0.05, 0.95]} />
      </mesh>
      <group position={[0, 2.6, 0]} rotation={[0, 0.15, 0]}>
        <mesh position={[-0.7, 0.7, 0]} material={M.blueNeon} castShadow>
          <boxGeometry args={[1.15, 1.15, 0.12]} />
        </mesh>
        <mesh position={[0.7, 0.7, 0]} material={M.blueNeon} castShadow>
          <boxGeometry args={[1.15, 1.15, 0.12]} />
        </mesh>
        <mesh position={[-0.7, -0.7, 0]} material={M.blueNeon} castShadow>
          <boxGeometry args={[1.15, 1.15, 0.12]} />
        </mesh>
        <mesh position={[0.7, -0.7, 0]} material={M.blueNeon} castShadow>
          <boxGeometry args={[1.15, 1.15, 0.12]} />
        </mesh>
        <mesh material={M.chrome}>
          <boxGeometry args={[2.7, 0.09, 0.18]} />
        </mesh>
        <mesh material={M.chrome}>
          <boxGeometry args={[0.09, 2.7, 0.18]} />
        </mesh>
      </group>
    </group>
  );
}

export function DesktopPCTowerInstallation() {
  const M = useM();
  return (
    <group>
      <mesh position={[0, 0.25, 0]} material={M.darkPedestal} castShadow>
        <boxGeometry args={[1.6, 0.5, 1.6]} />
      </mesh>
      <mesh position={[0, 1.45, 0]} material={M.blackMetal} castShadow>
        <boxGeometry args={[0.8, 1.9, 1.2]} />
      </mesh>
      <mesh position={[0.42, 1.45, 0]} material={M.glassCyan}>
        <boxGeometry args={[0.04, 1.7, 1.0]} />
      </mesh>
      <mesh position={[0, 1.45, 0.62]} material={M.blueNeon}>
        <boxGeometry args={[0.1, 1.6, 0.04]} />
      </mesh>
    </group>
  );
}

export function DesktopMonitorInstallation() {
  const M = useM();
  return (
    <group>
      <mesh position={[0, 0.4, 0]} material={M.darkSteel} castShadow>
        <cylinderGeometry args={[0.6, 0.8, 0.8, 16]} />
      </mesh>
      <mesh position={[0, 1.6, 0]} material={M.blackMetal} castShadow>
        <boxGeometry args={[1.8, 1.1, 0.1]} />
      </mesh>
      <mesh position={[0, 1.6, 0.06]} material={M.blueNeon}>
        <planeGeometry args={[1.7, 1.0]} />
      </mesh>
    </group>
  );
}

export function KeyboardMouseInstallation() {
  const M = useM();
  return (
    <group>
      <mesh position={[0, 0.35, 0]} material={M.concretePedestal} castShadow>
        <boxGeometry args={[2.2, 0.7, 1.2]} />
      </mesh>
      {/* Large sculpted keyboard */}
      <mesh position={[-0.2, 0.74, 0]} material={M.darkSteel}>
        <boxGeometry args={[1.4, 0.06, 0.5]} />
      </mesh>
      {/* Glowing mouse */}
      <mesh position={[0.7, 0.76, 0]} material={M.blueNeon}>
        <boxGeometry args={[0.22, 0.08, 0.35]} />
      </mesh>
    </group>
  );
}

export function ApplicationGridDisplay() {
  const M = useM();
  return (
    <group>
      <mesh position={[0, 0.3, 0]} material={M.darkPedestal} castShadow>
        <boxGeometry args={[2.4, 0.6, 1.0]} />
      </mesh>
      <group position={[0, 1.8, 0]}>
        {[-0.6, 0, 0.6].map((x, xi) =>
          [-0.6, 0, 0.6].map((y, yi) => (
            <mesh key={`${xi}-${yi}`} position={[x, y, 0]} material={(xi + yi) % 2 === 0 ? M.blueNeon : M.chrome}>
              <boxGeometry args={[0.45, 0.45, 0.08]} />
            </mesh>
          ))
        )}
      </group>
    </group>
  );
}

// =============================================================
// MARKET 5: MAC APPS (Minimalist Desktop Apps & Aluminum Computing)
// =============================================================
export function MinimalistSilverLaptopSculpture() {
  const M = useM();
  return (
    <group>
      <mesh position={[0, 0.45, 0]} material={M.concretePedestal} castShadow receiveShadow>
        <cylinderGeometry args={[1.8, 2.0, 0.9, 24]} />
      </mesh>
      <group position={[0, 1.0, 0]}>
        <mesh position={[0, 0.05, 0.2]} material={M.chrome} castShadow>
          <boxGeometry args={[2.0, 0.08, 1.4]} />
        </mesh>
        <mesh position={[0, 0.1, 0.6]} material={M.acrylicWhite}>
          <boxGeometry args={[0.75, 0.02, 0.5]} />
        </mesh>
        <group position={[0, 0.08, -0.5]} rotation={[-0.4, 0, 0]}>
          <mesh position={[0, 0.75, 0]} material={M.chrome} castShadow>
            <boxGeometry args={[2.0, 1.4, 0.06]} />
          </mesh>
          <mesh position={[0, 0.75, 0.04]} material={M.blackMetal}>
            <planeGeometry args={[1.9, 1.3]} />
          </mesh>
          <mesh position={[0, 0.75, 0.05]} material={M.acrylicWhite}>
            <planeGeometry args={[1.8, 1.2]} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

export function DesktopComputerDisplay() {
  const M = useM();
  return (
    <group>
      <mesh position={[0, 0.35, 0]} material={M.concretePedestal} castShadow>
        <boxGeometry args={[1.5, 0.7, 1.0]} />
      </mesh>
      {/* Slim all-in-one stand */}
      <mesh position={[0, 0.9, 0]} material={M.chrome}>
        <boxGeometry args={[0.3, 0.5, 0.2]} />
      </mesh>
      {/* Razor thin display */}
      <mesh position={[0, 1.6, 0]} material={M.chrome} castShadow>
        <boxGeometry args={[1.8, 1.2, 0.05]} />
      </mesh>
      <mesh position={[0, 1.6, 0.03]} material={M.acrylicWhite}>
        <planeGeometry args={[1.72, 1.12]} />
      </mesh>
    </group>
  );
}

export function AbstractMetallicSculpture() {
  const M = useM();
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (meshRef.current) meshRef.current.rotation.y = clock.elapsedTime * 0.25;
  });
  return (
    <group>
      <mesh position={[0, 0.5, 0]} material={M.darkSteel} castShadow>
        <cylinderGeometry args={[1.3, 1.5, 1.0, 16]} />
      </mesh>
      <mesh ref={meshRef} position={[0, 2.6, 0]} material={M.chrome} castShadow>
        <torusKnotGeometry args={[1.1, 0.26, 64, 16]} />
      </mesh>
    </group>
  );
}

export function KeyboardInstallation() {
  const M = useM();
  return (
    <group>
      <mesh position={[0, 0.3, 0]} material={M.concretePedestal} castShadow>
        <boxGeometry args={[1.8, 0.6, 0.9]} />
      </mesh>
      <mesh position={[0, 0.63, 0]} material={M.chrome}>
        <boxGeometry args={[1.5, 0.04, 0.5]} />
      </mesh>
      <mesh position={[0, 0.66, 0]} material={M.acrylicWhite}>
        <boxGeometry args={[1.4, 0.02, 0.44]} />
      </mesh>
    </group>
  );
}

export function PremiumSoftwareShowcase() {
  const M = useM();
  return (
    <group>
      <mesh position={[0, 0.5, 0]} material={M.darkPedestal} castShadow>
        <boxGeometry args={[1.2, 1.0, 1.2]} />
      </mesh>
      {/* Floating glass display cube */}
      <mesh position={[0, 1.6, 0]} material={M.glassCyan}>
        <boxGeometry args={[0.9, 0.9, 0.9]} />
      </mesh>
      <mesh position={[0, 1.6, 0]} material={M.chrome}>
        <octahedronGeometry args={[0.35, 0]} />
      </mesh>
    </group>
  );
}

// =============================================================
// MARKET 6: MOBILE APPS (Smartphones & Mobile Applications)
// =============================================================
export function VerticalSmartphoneSculpture() {
  const M = useM();
  return (
    <group>
      <mesh position={[0, 0.4, 0]} material={M.darkPedestal} castShadow receiveShadow>
        <cylinderGeometry args={[1.8, 2.1, 0.8, 24]} />
      </mesh>
      <mesh position={[0, 0.82, 0]} material={M.orangeNeon}>
        <cylinderGeometry args={[1.7, 1.7, 0.05, 24]} />
      </mesh>
      <group position={[0, 2.9, 0]} rotation={[0, 0.2, 0]}>
        <mesh material={M.blackMetal} castShadow>
          <boxGeometry args={[1.8, 3.6, 0.2]} />
        </mesh>
        <mesh position={[0, 0, 0.11]} material={M.darkSteel}>
          <planeGeometry args={[1.65, 3.4]} />
        </mesh>
        {[-0.5, 0, 0.5].map((x, xi) =>
          [-1.1, -0.4, 0.3, 1.0].map((y, yi) => (
            <mesh key={`${xi}-${yi}`} position={[x, y, 0.12]} material={(xi + yi) % 2 === 0 ? M.orangeNeon : M.cyanNeon}>
              <boxGeometry args={[0.3, 0.3, 0.02]} />
            </mesh>
          ))
        )}
      </group>
    </group>
  );
}

export function FloatingAppIconsInstallation() {
  const M = useM();
  return (
    <group>
      <mesh position={[0, 0.25, 0]} material={M.darkPedestal} castShadow>
        <cylinderGeometry args={[1.3, 1.5, 0.5, 16]} />
      </mesh>
      {[
        { x: -0.5, y: 1.2, z: 0, m: M.orangeNeon },
        { x: 0.5, y: 1.7, z: 0.2, m: M.cyanNeon },
        { x: 0, y: 2.2, z: -0.2, m: M.greenNeon },
      ].map((icon, i) => (
        <group key={i} position={[icon.x, icon.y, icon.z]}>
          <mesh material={icon.m} castShadow>
            <boxGeometry args={[0.5, 0.5, 0.08]} />
          </mesh>
          <mesh position={[0, -icon.y / 2, 0]} material={M.chrome}>
            <cylinderGeometry args={[0.02, 0.02, icon.y, 8]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export function TabletDisplaySculpture() {
  const M = useM();
  return (
    <group>
      <mesh position={[0, 0.45, 0]} material={M.darkSteel} castShadow>
        <cylinderGeometry args={[0.7, 0.9, 0.9, 16]} />
      </mesh>
      <group position={[0, 1.3, 0]} rotation={[-0.45, 0, 0]}>
        <mesh material={M.blackMetal} castShadow>
          <boxGeometry args={[1.4, 1.0, 0.08]} />
        </mesh>
        <mesh position={[0, 0, 0.05]} material={M.orangeNeon}>
          <planeGeometry args={[1.3, 0.9]} />
        </mesh>
      </group>
    </group>
  );
}

export function MobileKioskShowcase() {
  const M = useM();
  return (
    <group>
      <mesh position={[0, 0.6, 0]} material={M.darkSteel} castShadow>
        <cylinderGeometry args={[0.22, 0.32, 1.2, 12]} />
      </mesh>
      <group position={[0, 1.3, 0]} rotation={[-0.5, 0, 0]}>
        <mesh material={M.blackMetal} castShadow>
          <boxGeometry args={[1.2, 0.9, 0.1]} />
        </mesh>
        <mesh position={[0, 0, 0.06]} material={M.orangeNeon}>
          <planeGeometry args={[1.1, 0.8]} />
        </mesh>
      </group>
    </group>
  );
}

export function QRCodeInstallation() {
  const M = useM();
  return (
    <group>
      <mesh position={[0, 0.3, 0]} material={M.darkPedestal} castShadow>
        <boxGeometry args={[1.6, 0.6, 1.6]} />
      </mesh>
      <mesh position={[0, 1.5, 0]} material={M.acrylicWhite} castShadow>
        <boxGeometry args={[1.5, 1.5, 0.1]} />
      </mesh>
      {/* Stylized QR blocks */}
      {[-0.45, 0.45].map((x, xi) =>
        [-0.45, 0.45].map((y, yi) => (
          <mesh key={`${xi}-${yi}`} position={[x, 1.5 + y, 0.06]} material={M.orangeNeon}>
            <boxGeometry args={[0.35, 0.35, 0.04]} />
          </mesh>
        ))
      )}
    </group>
  );
}

// =============================================================
// MARKET 7: GAMING (Gaming & Interactive Entertainment)
// =============================================================
export function GamingControllerSculpture() {
  const M = useM();
  return (
    <group>
      <mesh position={[0, 0.45, 0]} material={M.darkPedestal} castShadow receiveShadow>
        <cylinderGeometry args={[2.0, 2.3, 0.9, 16]} />
      </mesh>
      <mesh position={[0, 0.92, 0]} material={M.purpleNeon}>
        <cylinderGeometry args={[1.9, 1.9, 0.05, 16]} />
      </mesh>
      <group position={[0, 2.5, 0]} rotation={[-0.3, 0, 0]}>
        <mesh material={M.blackMetal} castShadow>
          <boxGeometry args={[2.6, 1.3, 0.55]} />
        </mesh>
        <mesh position={[-1.3, -0.55, 0]} rotation={[0, 0, 0.5]} material={M.blackMetal} castShadow>
          <cylinderGeometry args={[0.32, 0.42, 1.5, 12]} />
        </mesh>
        <mesh position={[1.3, -0.55, 0]} rotation={[0, 0, -0.5]} material={M.blackMetal} castShadow>
          <cylinderGeometry args={[0.32, 0.42, 1.5, 12]} />
        </mesh>
        <mesh position={[-0.7, 0.16, 0.32]} material={M.darkSteel}>
          <cylinderGeometry args={[0.26, 0.26, 0.26, 12]} />
        </mesh>
        <mesh position={[-0.7, 0.3, 0.32]} material={M.cyanNeon}>
          <sphereGeometry args={[0.16, 10, 8]} />
        </mesh>
        <mesh position={[0.7, 0.32, 0.32]} material={M.purpleNeon}>
          <cylinderGeometry args={[0.11, 0.11, 0.11, 8]} />
        </mesh>
        <mesh position={[0.9, 0.16, 0.32]} material={M.cyanNeon}>
          <cylinderGeometry args={[0.11, 0.11, 0.11, 8]} />
        </mesh>
        <mesh position={[0.5, 0.16, 0.32]} material={M.pinkNeon}>
          <cylinderGeometry args={[0.11, 0.11, 0.11, 8]} />
        </mesh>
      </group>
    </group>
  );
}

export function ArcadeMachineInstallation() {
  const M = useM();
  return (
    <group>
      <mesh position={[0, 1.35, 0]} material={M.blackMetal} castShadow>
        <boxGeometry args={[1.0, 2.7, 1.0]} />
      </mesh>
      <mesh position={[0, 2.5, 0.4]} material={M.purpleNeon}>
        <boxGeometry args={[0.9, 0.3, 0.25]} />
      </mesh>
      <mesh position={[0, 1.7, 0.35]} rotation={[-0.3, 0, 0]} material={M.cyanNeon}>
        <boxGeometry args={[0.8, 0.65, 0.1]} />
      </mesh>
      <mesh position={[0, 1.15, 0.5]} rotation={[0.2, 0, 0]} material={M.darkSteel}>
        <boxGeometry args={[0.9, 0.2, 0.45]} />
      </mesh>
      <mesh position={[-0.2, 1.32, 0.5]} material={M.pinkNeon}>
        <sphereGeometry args={[0.07, 8, 8]} />
      </mesh>
      <mesh position={[0.15, 1.25, 0.5]} material={M.cyanNeon}>
        <cylinderGeometry args={[0.05, 0.05, 0.04, 8]} />
      </mesh>
      <mesh position={[0.3, 1.25, 0.5]} material={M.greenNeon}>
        <cylinderGeometry args={[0.05, 0.05, 0.04, 8]} />
      </mesh>
    </group>
  );
}

export function GamingPCTower() {
  const M = useM();
  return (
    <group>
      <mesh position={[0, 0.25, 0]} material={M.darkSteel} castShadow>
        <boxGeometry args={[1.5, 0.5, 1.5]} />
      </mesh>
      <mesh position={[0, 1.4, 0]} material={M.blackMetal} castShadow>
        <boxGeometry args={[0.8, 1.8, 1.3]} />
      </mesh>
      <mesh position={[0.42, 1.4, 0]} material={M.glassPurple}>
        <boxGeometry args={[0.04, 1.6, 1.1]} />
      </mesh>
      <mesh position={[0, 1.4, 0.66]} material={M.purpleNeon}>
        <cylinderGeometry args={[0.25, 0.25, 0.04, 16]} />
      </mesh>
    </group>
  );
}

export function PixelArtSculpture() {
  const M = useM();
  return (
    <group>
      <mesh position={[0, 0.3, 0]} material={M.darkPedestal} castShadow>
        <boxGeometry args={[2.0, 0.6, 1.0]} />
      </mesh>
      {/* Pixelated Heart Sculpture */}
      <group position={[0, 1.6, 0]}>
        {[
          [-0.3, 0.3], [0.3, 0.3],
          [-0.6, 0], [-0.3, 0], [0, 0], [0.3, 0], [0.6, 0],
          [-0.3, -0.3], [0, -0.3], [0.3, -0.3],
          [0, -0.6],
        ].map(([px, py], i) => (
          <mesh key={i} position={[px * 0.7, py * 0.7, 0]} material={M.pinkNeon} castShadow>
            <boxGeometry args={[0.22, 0.22, 0.22]} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

export function GamingTrophyMonument() {
  const M = useM();
  return (
    <group>
      <mesh position={[0, 0.4, 0]} material={M.darkSteel} castShadow>
        <cylinderGeometry args={[1.2, 1.5, 0.8, 12]} />
      </mesh>
      <mesh position={[0, 1.2, 0]} material={M.goldNeon} castShadow>
        <cylinderGeometry args={[0.4, 0.7, 0.8, 12]} />
      </mesh>
      <mesh position={[0, 2.2, 0]} material={M.goldNeon} castShadow>
        <cylinderGeometry args={[1.1, 0.5, 1.2, 16]} />
      </mesh>
      <mesh position={[0, 3.2, 0]} material={M.glassPurple}>
        <octahedronGeometry args={[0.55, 0]} />
      </mesh>
    </group>
  );
}

// =============================================================
// MARKET 8: DESIGN (Graphic Design & Creativity)
// =============================================================
export function ArtistPaletteSculpture() {
  const M = useM();
  const swatches = useMemo(() => [
    { mat: 'pinkNeon', a: 0 },
    { mat: 'orangeNeon', a: 0.9 },
    { mat: 'goldNeon', a: 1.8 },
    { mat: 'greenNeon', a: 2.7 },
    { mat: 'cyanNeon', a: 3.6 },
    { mat: 'purpleNeon', a: 4.5 },
  ] as const, []);

  return (
    <group>
      <mesh position={[0, 0.45, 0]} material={M.concretePedestal} castShadow receiveShadow>
        <cylinderGeometry args={[2.0, 2.3, 0.9, 24]} />
      </mesh>
      <group position={[0, 2.4, 0]} rotation={[0.4, 0.3, 0]}>
        <mesh material={M.acrylicWhite} castShadow>
          <cylinderGeometry args={[1.9, 1.9, 0.16, 24]} />
        </mesh>
        {swatches.map((sw, i) => (
          <mesh key={i} position={[Math.cos(sw.a) * 1.35, 0.12, Math.sin(sw.a) * 1.35]} material={M[sw.mat]}>
            <sphereGeometry args={[0.25, 12, 10]} />
          </mesh>
        ))}
        <mesh position={[0, 0.1, -0.7]} material={M.darkSteel}>
          <cylinderGeometry args={[0.35, 0.35, 0.18, 16]} />
        </mesh>
      </group>
    </group>
  );
}

export function PencilAndPaintbrushSculpture() {
  const M = useM();
  return (
    <group>
      <mesh position={[0, 0.3, 0]} material={M.darkSteel} castShadow>
        <cylinderGeometry args={[1.2, 1.4, 0.6, 16]} />
      </mesh>
      {/* Angled Pencil */}
      <group position={[-0.3, 1.5, 0]} rotation={[0, 0, 0.3]}>
        <mesh material={M.goldNeon} castShadow>
          <cylinderGeometry args={[0.12, 0.12, 2.4, 6]} />
        </mesh>
        <mesh position={[0, 1.3, 0]} material={M.darkSteel}>
          <coneGeometry args={[0.12, 0.4, 6]} />
        </mesh>
      </group>
      {/* Crossed Paintbrush */}
      <group position={[0.3, 1.5, 0]} rotation={[0, 0, -0.3]}>
        <mesh material={M.darkPedestal} castShadow>
          <cylinderGeometry args={[0.08, 0.08, 2.2, 12]} />
        </mesh>
        <mesh position={[0, 1.25, 0]} material={M.cyanNeon}>
          <coneGeometry args={[0.18, 0.5, 12]} />
        </mesh>
      </group>
    </group>
  );
}

export function ColorWheelInstallation() {
  const M = useM();
  const wheelRef = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (wheelRef.current) wheelRef.current.rotation.z = clock.elapsedTime * 0.15;
  });
  return (
    <group>
      <mesh position={[0, 0.6, 0]} material={M.darkSteel} castShadow>
        <boxGeometry args={[0.6, 1.2, 0.6]} />
      </mesh>
      <group ref={wheelRef} position={[0, 2.4, 0]}>
        <mesh material={M.glassCyan}>
          <torusGeometry args={[1.3, 0.22, 16, 32]} />
        </mesh>
        <mesh material={M.pinkNeon} position={[1.3, 0, 0]}>
          <sphereGeometry args={[0.22, 12, 10]} />
        </mesh>
        <mesh material={M.goldNeon} position={[-1.3, 0, 0]}>
          <sphereGeometry args={[0.22, 12, 10]} />
        </mesh>
        <mesh material={M.cyanNeon} position={[0, 1.3, 0]}>
          <sphereGeometry args={[0.22, 12, 10]} />
        </mesh>
      </group>
    </group>
  );
}

export function TypographySculpture() {
  const M = useM();
  return (
    <group>
      <mesh position={[0, 0.3, 0]} material={M.concretePedestal} castShadow>
        <boxGeometry args={[2.0, 0.6, 1.2]} />
      </mesh>
      {/* Letter 'A' */}
      <mesh position={[-0.45, 1.3, 0]} material={M.chrome} castShadow>
        <boxGeometry args={[0.3, 1.6, 0.2]} />
      </mesh>
      {/* Letter '&' */}
      <mesh position={[0.45, 1.3, 0]} material={M.pinkNeon} castShadow>
        <torusGeometry args={[0.5, 0.12, 12, 24]} />
      </mesh>
    </group>
  );
}

export function AbstractGeometricArt() {
  const M = useM();
  return (
    <group>
      <mesh position={[0, 0.4, 0]} material={M.darkPedestal} castShadow>
        <boxGeometry args={[1.8, 0.8, 1.8]} />
      </mesh>
      <mesh position={[0, 1.6, 0]} rotation={[0.5, 0.5, 0]} material={M.cyanNeon} castShadow>
        <boxGeometry args={[1.1, 1.1, 1.1]} />
      </mesh>
      <mesh position={[0, 2.6, 0]} material={M.purpleNeon}>
        <octahedronGeometry args={[0.6, 0]} />
      </mesh>
    </group>
  );
}

// =============================================================
// MARKET 9: DIGITAL MARKETING (Megaphones, Charts & Advertising)
// =============================================================
export function MegaphoneSculpture() {
  const M = useM();
  return (
    <group>
      <mesh position={[0, 0.45, 0]} material={M.darkPedestal} castShadow receiveShadow>
        <cylinderGeometry args={[1.9, 2.2, 0.9, 20]} />
      </mesh>
      <mesh position={[0, 0.92, 0]} material={M.orangeNeon}>
        <cylinderGeometry args={[1.8, 1.8, 0.05, 20]} />
      </mesh>
      <group position={[0, 2.6, 0]} rotation={[0.1, -0.4, -0.3]}>
        <mesh position={[0.7, 0, 0]} rotation={[0, 0, -Math.PI / 2]} material={M.orangeNeon} castShadow>
          <coneGeometry args={[1.3, 2.4, 20, 1, true]} />
        </mesh>
        <mesh position={[-0.45, -0.75, 0]} material={M.blackMetal}>
          <cylinderGeometry args={[0.16, 0.16, 1.1, 10]} />
        </mesh>
        <mesh position={[-0.7, 0, 0]} material={M.chrome} castShadow>
          <sphereGeometry args={[0.6, 16, 12]} />
        </mesh>
      </group>
    </group>
  );
}

export function GrowthChartInstallation() {
  const M = useM();
  return (
    <group>
      <mesh position={[0, 0.25, 0]} material={M.darkPedestal} castShadow>
        <boxGeometry args={[3.0, 0.5, 1.4]} />
      </mesh>
      {[0.8, 1.4, 2.1, 2.9].map((h, i) => (
        <mesh key={i} position={[-1.05 + i * 0.7, 0.5 + h / 2, 0]} material={i === 3 ? M.greenNeon : M.orangeNeon} castShadow>
          <boxGeometry args={[0.5, h, 0.5]} />
        </mesh>
      ))}
      <mesh position={[0, 2.5, 0.32]} rotation={[0, 0, -0.6]} material={M.greenNeon}>
        <boxGeometry args={[2.8, 0.08, 0.08]} />
      </mesh>
    </group>
  );
}

export function SEOSearchSculpture() {
  const M = useM();
  return (
    <group>
      <mesh position={[0, 0.3, 0]} material={M.concretePedestal} castShadow>
        <boxGeometry args={[2.4, 0.6, 1.2]} />
      </mesh>
      {/* 3D Magnifying Glass */}
      <group position={[0, 1.6, 0]} rotation={[0, 0, -0.4]}>
        <mesh material={M.chrome} castShadow>
          <torusGeometry args={[0.8, 0.1, 12, 32]} />
        </mesh>
        <mesh material={M.glassCyan}>
          <cylinderGeometry args={[0.75, 0.75, 0.04, 24]} />
        </mesh>
        <mesh position={[0.7, -0.7, 0]} rotation={[0, 0, -Math.PI / 4]} material={M.blackMetal}>
          <cylinderGeometry args={[0.08, 0.08, 1.0, 10]} />
        </mesh>
      </group>
    </group>
  );
}

export function SocialMediaIconDisplay() {
  const M = useM();
  return (
    <group>
      <mesh position={[0, 0.3, 0]} material={M.darkPedestal} castShadow>
        <boxGeometry args={[2.2, 0.6, 1.0]} />
      </mesh>
      {/* Floating social bubbles */}
      {[
        { x: -0.6, y: 1.3, m: M.cyanNeon },
        { x: 0, y: 1.8, m: M.orangeNeon },
        { x: 0.6, y: 1.3, m: M.pinkNeon },
      ].map((b, i) => (
        <mesh key={i} position={[b.x, b.y, 0]} material={b.m} castShadow>
          <sphereGeometry args={[0.35, 16, 12]} />
        </mesh>
      ))}
    </group>
  );
}

export function AdvertisingBillboardDisplay() {
  const M = useM();
  return (
    <group>
      <mesh position={[0, 0.8, 0]} material={M.darkSteel}>
        <cylinderGeometry args={[0.18, 0.22, 1.6, 12]} />
      </mesh>
      <mesh position={[0, 2.2, 0]} material={M.blackMetal} castShadow>
        <boxGeometry args={[2.4, 1.3, 0.15]} />
      </mesh>
      <mesh position={[0, 2.2, 0.09]} material={M.orangeNeon}>
        <planeGeometry args={[2.28, 1.18]} />
      </mesh>
    </group>
  );
}

// =============================================================
// Market Props Master Distribution Manager
// =============================================================
export function MarketPropsManager({ layout }: { layout: Layout }) {
  // 1. Major Entrance Landmarks (At the entrance to each district from Ring 1)
  // Positioned on the manicured green lawn corner, 12m to the side of the spine road (clear of road & sidewalk)
  const districtEntrances = useMemo(() => {
    return DISTRICTS.map((D, k) => {
      const c = 20 + 40 * k;
      const rad = c * D2R;
      // Unit radial vector
      const ux = Math.sin(rad);
      const uz = -Math.cos(rad);
      // Unit perpendicular vector (to the right of the spine)
      const vx = Math.cos(rad);
      const vz = Math.sin(rad);
      // r = 98 (just past Ring 1 outer edge 96), offset 12.5m sideways onto green lawn
      const r = CITY.R1 + 8;
      const sideOffset = 12.5;
      const x = r * ux + sideOffset * vx;
      const z = r * uz + sideOffset * vz;
      return { code: D.code, name: D.name, x, z, rot: -rad };
    });
  }, []);

  // 2. Mid-district Spine Promenade Landmarks (Around Cross Street 2 at u = 164.6)
  // Positioned on the opposite side of the spine road (-12m sideways) in the green open space
  const midDistrictMonuments = useMemo(() => {
    return DISTRICTS.map((D, k) => {
      const c = 20 + 40 * k;
      const rad = c * D2R;
      const ux = Math.sin(rad);
      const uz = -Math.cos(rad);
      const vx = Math.cos(rad);
      const vz = Math.sin(rad);
      const r = CITY.crossU[1]; // 164.6
      const sideOffset = -12.5;
      const x = r * ux + sideOffset * vx;
      const z = r * uz + sideOffset * vz;
      return { code: D.code, x, z, rot: -rad };
    });
  }, []);

  // 3. Forecourt Installations per District
  // Positioned in the front courtyard of prominent plots (lx = ±3.6, lz = 5.0)
  // Perfectly clear of storefront doors (lx = 0) and sidewalks (lz = 6.8)
  const districtPlacements = useMemo(() => {
    const byDist = new Map<string, Array<{ x: number; z: number; rot: number; plotId: string }>>();
    for (const p of layout.plots) {
      if (p.landmark) continue;
      const code = p.id.split('-')[0];
      if (!byDist.has(code)) byDist.set(code, []);
      // Front forecourt to the left of the store entrance
      const [wx, wz] = toWorld(p, -3.6, 5.0);
      byDist.get(code)!.push({ x: wx, z: wz, rot: p.rot, plotId: p.id });
    }
    return byDist;
  }, [layout]);

  return (
    <group>
      {/* ── A. Grand Market Entrance Landmarks (Visible approaching Ring 1) ── */}
      {districtEntrances.map((ent) => (
        <group key={`ent-${ent.code}`} position={[ent.x, 0, ent.z]} rotation={[0, ent.rot, 0]}>
          {ent.code === 'SAS' && <CloudComputingSculpture />}
          {ent.code === 'AIM' && <AIBrainSculpture />}
          {ent.code === 'DEV' && <CodeBracketsSculpture />}
          {ent.code === 'WIN' && <FourPaneWindowSculpture />}
          {ent.code === 'MAC' && <MinimalistSilverLaptopSculpture />}
          {ent.code === 'MOB' && <VerticalSmartphoneSculpture />}
          {ent.code === 'GAM' && <GamingControllerSculpture />}
          {ent.code === 'DES' && <ArtistPaletteSculpture />}
          {ent.code === 'MKT' && <MegaphoneSculpture />}
        </group>
      ))}

      {/* ── B. Mid-District Spine Promenade Monuments ── */}
      {midDistrictMonuments.map((mon) => (
        <group key={`mid-${mon.code}`} position={[mon.x, 0, mon.z]} rotation={[0, mon.rot, 0]}>
          {mon.code === 'SAS' && <CloudTechMonument />}
          {mon.code === 'AIM' && <NeuralNetworkGlobe />}
          {mon.code === 'DEV' && <SiliconProcessorMonument />}
          {mon.code === 'WIN' && <ApplicationGridDisplay />}
          {mon.code === 'MAC' && <AbstractMetallicSculpture />}
          {mon.code === 'MOB' && <QRCodeInstallation />}
          {mon.code === 'GAM' && <GamingTrophyMonument />}
          {mon.code === 'DES' && <AbstractGeometricArt />}
          {mon.code === 'MKT' && <SEOSearchSculpture />}
        </group>
      ))}

      {/* ── C. Building Forecourt Themed Installations ── */}
      {Array.from(districtPlacements.entries()).map(([code, spots]) => (
        <group key={`dist-props-${code}`}>
          {/* Forecourt Spot 1 */}
          {spots[2] && (
            <group position={[spots[2].x, 0, spots[2].z]} rotation={[0, spots[2].rot, 0]}>
              {code === 'SAS' && <ServerRackInstallation />}
              {code === 'AIM' && <RoboticArmInstallation />}
              {code === 'DEV' && <DeveloperWorkstationInstallation />}
              {code === 'WIN' && <DesktopPCTowerInstallation />}
              {code === 'MAC' && <DesktopComputerDisplay />}
              {code === 'MOB' && <FloatingAppIconsInstallation />}
              {code === 'GAM' && <ArcadeMachineInstallation />}
              {code === 'DES' && <PencilAndPaintbrushSculpture />}
              {code === 'MKT' && <GrowthChartInstallation />}
            </group>
          )}

          {/* Forecourt Spot 2 */}
          {spots[8] && (
            <group position={[spots[8].x, 0, spots[8].z]} rotation={[0, spots[8].rot, 0]}>
              {code === 'SAS' && <AnalyticsDashboardDisplay />}
              {code === 'AIM' && <AIHologramKiosk />}
              {code === 'DEV' && <LaptopWorkstationSculpture />}
              {code === 'WIN' && <DesktopMonitorInstallation />}
              {code === 'MAC' && <KeyboardInstallation />}
              {code === 'MOB' && <TabletDisplaySculpture />}
              {code === 'GAM' && <GamingPCTower />}
              {code === 'DES' && <ColorWheelInstallation />}
              {code === 'MKT' && <SocialMediaIconDisplay />}
            </group>
          )}

          {/* Forecourt Spot 3 */}
          {spots[16] && (
            <group position={[spots[16].x, 0, spots[16].z]} rotation={[0, spots[16].rot, 0]}>
              {code === 'SAS' && <DatabaseCylinderSculpture />}
              {code === 'AIM' && <SmallRobotSculpture />}
              {code === 'DEV' && <GitBranchInstallation />}
              {code === 'WIN' && <KeyboardMouseInstallation />}
              {code === 'MAC' && <PremiumSoftwareShowcase />}
              {code === 'MOB' && <MobileKioskShowcase />}
              {code === 'GAM' && <PixelArtSculpture />}
              {code === 'DES' && <TypographySculpture />}
              {code === 'MKT' && <AdvertisingBillboardDisplay />}
            </group>
          )}
        </group>
      ))}
    </group>
  );
}
