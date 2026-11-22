'use client';
import * as THREE from 'three';
import { useRef, useMemo, useEffect, Suspense } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { Billboard as BB } from '@/lib/billboards';
import { player } from '@/lib/state';
import { UCYL, UBOX } from './Inst';

// ─── Placeholder canvas texture for empty / inactive billboards ─────────────
function makePlaceholderTex(label: string, color: string): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 288;
  const g = c.getContext('2d')!;
  g.fillStyle = color;
  g.fillRect(0, 0, 512, 288);
  g.strokeStyle = 'rgba(255,255,255,0.15)';
  g.lineWidth = 4;
  g.strokeRect(6, 6, 500, 276);
  g.fillStyle = 'rgba(255,255,255,0.4)';
  g.font = 'bold 36px Arial';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(label, 256, 144);
  return new THREE.CanvasTexture(c);
}

// ─── Image display panel ────────────────────────────────────────────────────
function ImagePanel({ bb }: { bb: BB }) {
  let tex: THREE.Texture | null = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    tex = useLoader(THREE.TextureLoader, bb.mediaUrl);
  } catch {
    tex = null;
  }
  const placeholder = useMemo(() => makePlaceholderTex('📷 Image', '#1e293b'), []);
  const map = tex || placeholder;

  return (
    <mesh>
      <planeGeometry args={[bb.width, bb.height]} />
      <meshBasicMaterial map={map} toneMapped={false} side={THREE.FrontSide} />
    </mesh>
  );
}

// ─── Video display panel ────────────────────────────────────────────────────
function VideoPanel({ bb }: { bb: BB }) {
  const vidRef = useRef<HTMLVideoElement | null>(null);
  const matRef = useRef<THREE.MeshBasicMaterial>(null!);

  const { vid, tex } = useMemo(() => {
    if (typeof document === 'undefined') return { vid: null, tex: null };
    const v = document.createElement('video');
    v.src = bb.mediaUrl;
    v.crossOrigin = 'anonymous';
    v.loop = true;
    v.muted = true;
    v.playsInline = true;
    v.preload = 'metadata';
    const t = new THREE.VideoTexture(v);
    t.minFilter = THREE.LinearFilter;
    t.magFilter = THREE.LinearFilter;
    return { vid: v, tex: t };
  }, [bb.mediaUrl]);

  useEffect(() => {
    vidRef.current = vid;
    return () => { vid?.pause(); };
  }, [vid]);

  useFrame(() => {
    if (!vid || !player) return;
    const dx = player.x - bb.x, dz = player.z - bb.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < 180 && vid.paused) vid.play().catch(() => {});
    if (dist >= 180 && !vid.paused) vid.pause();
  });

  const placeholder = useMemo(() => makePlaceholderTex('▶ Video', '#0f172a'), []);

  return (
    <mesh>
      <planeGeometry args={[bb.width, bb.height]} />
      <meshBasicMaterial ref={matRef} map={tex || placeholder} toneMapped={false} side={THREE.FrontSide} />
    </mesh>
  );
}

// ─── Inactive/Empty dark screen ─────────────────────────────────────────────
function DarkPanel({ bb, label }: { bb: BB; label: string }) {
  const tex = useMemo(() => makePlaceholderTex(label, '#080f1e'), [label]);
  return (
    <mesh>
      <planeGeometry args={[bb.width, bb.height]} />
      <meshBasicMaterial map={tex} toneMapped={false} />
    </mesh>
  );
}

// ─── Billboard frame + mounting structure ───────────────────────────────────
function Frame({ w, h, elevation, wallSide }: { w: number; h: number; elevation: number; wallSide: string }) {
  const freestanding = wallSide === 'freestanding' || wallSide === 'corner';
  const colH = elevation + h / 2 + 0.4;
  const frameColor = '#1a2340';
  const metalColor = '#4a5568';

  return (
    <>
      {/* Panel frame border */}
      <mesh position={[0, 0, -0.04]}>
        <boxGeometry args={[w + 0.3, h + 0.3, 0.12]} />
        <meshStandardMaterial color={frameColor} metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Back panel */}
      <mesh position={[0, 0, -0.14]}>
        <boxGeometry args={[w + 0.5, h + 0.5, 0.08]} />
        <meshStandardMaterial color="#0d1627" metalness={0.5} roughness={0.5} />
      </mesh>

      {/* Support columns (only for freestanding billboards) */}
      {freestanding && (
        <>
          {/* Left column */}
          <mesh position={[-w * 0.3, -(h / 2 + colH * 0.4), -0.1]}>
            <cylinderGeometry args={[0.09, 0.12, colH, 7]} />
            <meshStandardMaterial color={metalColor} metalness={0.8} roughness={0.2} />
          </mesh>
          {/* Right column */}
          <mesh position={[w * 0.3, -(h / 2 + colH * 0.4), -0.1]}>
            <cylinderGeometry args={[0.09, 0.12, colH, 7]} />
            <meshStandardMaterial color={metalColor} metalness={0.8} roughness={0.2} />
          </mesh>
          {/* Base footings */}
          <mesh position={[-w * 0.3, -(h / 2 + colH * 0.84), -0.1]}>
            <cylinderGeometry args={[0.22, 0.28, 0.35, 8]} />
            <meshStandardMaterial color="#374151" metalness={0.6} roughness={0.4} />
          </mesh>
          <mesh position={[w * 0.3, -(h / 2 + colH * 0.84), -0.1]}>
            <cylinderGeometry args={[0.22, 0.28, 0.35, 8]} />
            <meshStandardMaterial color="#374151" metalness={0.6} roughness={0.4} />
          </mesh>
        </>
      )}

      {/* Wall mount bracket (for wall-mounted billboards) */}
      {!freestanding && (
        <>
          <mesh position={[0, -(h / 2 + 0.25), -0.3]}>
            <boxGeometry args={[w * 0.6, 0.15, 0.5]} />
            <meshStandardMaterial color={metalColor} metalness={0.8} roughness={0.2} />
          </mesh>
        </>
      )}

      {/* Top accent light strip */}
      <mesh position={[0, h / 2 + 0.22, 0.04]}>
        <boxGeometry args={[w * 0.85, 0.08, 0.06]} />
        <meshStandardMaterial color="#60a5fa" emissive="#3b82f6" emissiveIntensity={1.2} />
      </mesh>
    </>
  );
}

// ─── Main Billboard Mesh Export ──────────────────────────────────────────────
export function BillboardMesh({ bb }: { bb: BB }) {
  const groupRef = useRef<THREE.Group>(null);

  // Slight visibility cull for performance: skip render when extremely far away
  useFrame(() => {
    if (!groupRef.current || !player) return;
    const dx = player.x - bb.x, dz = player.z - bb.z;
    const dist2 = dx * dx + dz * dz;
    groupRef.current.visible = dist2 < 450 * 450;
  });

  return (
    <group
      ref={groupRef}
      position={[bb.x, bb.elevation, bb.z]}
      rotation={[0, bb.rot, 0]}
    >
      <Frame w={bb.width} h={bb.height} elevation={bb.elevation} wallSide={bb.wallSide} />

      {/* Display surface — offset slightly in front of frame */}
      <group position={[0, 0, 0.02]}>
        {bb.status === 'inactive' ? (
          <DarkPanel bb={bb} label="⬛ Offline" />
        ) : bb.status === 'empty' || !bb.mediaUrl ? (
          <DarkPanel bb={bb} label="📺 Available" />
        ) : bb.mediaType === 'video' ? (
          <Suspense fallback={<DarkPanel bb={bb} label="▶ Loading…" />}>
            <VideoPanel bb={bb} />
          </Suspense>
        ) : (
          <Suspense fallback={<DarkPanel bb={bb} label="📷 Loading…" />}>
            <ImagePanel bb={bb} />
          </Suspense>
        )}
      </group>

      {/* Soft emissive glow so the board is visible in dim lighting */}
      {bb.lighting && (
        <pointLight
          position={[0, bb.height * 0.3, 1.2]}
          intensity={0.6}
          distance={12}
          color="#c8d8ff"
          decay={2}
        />
      )}
    </group>
  );
}
