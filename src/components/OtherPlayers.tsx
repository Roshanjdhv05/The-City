'use client';
import * as THREE from 'three';
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { RemotePlayer, useMultiplayer } from '@/lib/multiplayer';
import { HumanoidAvatar } from './HumanoidAvatar';

function RemoteAvatar({ player }: { player: RemotePlayer }) {
  const root = useRef<THREE.Group>(null);
  const currentPos = useRef(new THREE.Vector3(player.x, player.y, player.z));
  const currentYaw = useRef(player.yaw);
  const isMovingRef = useRef(false);

  // Player's distinct custom color
  const hoodieColor = player.color || '#1eb886';

  useFrame((_, dt) => {
    if (!root.current) return;

    // Smoothly interpolate position and orientation
    const targetPos = new THREE.Vector3(player.x, player.y, player.z);
    currentPos.current.lerp(targetPos, 1 - Math.exp(-15 * dt));
    root.current.position.copy(currentPos.current);

    // Shortest angular interpolation for yaw
    let diff = player.yaw - currentYaw.current;
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;
    currentYaw.current += diff * (1 - Math.exp(-18 * dt));
    root.current.rotation.y = currentYaw.current;

    isMovingRef.current = player.moving || currentPos.current.distanceTo(targetPos) > 0.08;
  });

  return (
    <group ref={root} position={[player.x, player.y, player.z]} rotation={[0, player.yaw, 0]}>
      {/* ── Floating Nametag Above Character (Classic Clean Banner Style) ── */}
      <Html position={[0, 2.18, 0]} center distanceFactor={50} zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
        <div
          style={{
            background: 'rgba(0, 0, 0, 0.45)',
            padding: '0.8px 3px',
            borderRadius: '1px',
            whiteSpace: 'nowrap',
            transform: 'translate3d(0, 0, 0)',
            userSelect: 'none',
            display: 'inline-block',
          }}
        >
          <span
            style={{
              color: '#ffffff',
              fontSize: '5.8px',
              fontWeight: 700,
              fontFamily: 'system-ui, -apple-system, sans-serif',
              letterSpacing: '0.02em',
              textShadow: '0.8px 0.8px 0px rgba(0, 0, 0, 0.9)',
              lineHeight: 1.1,
              display: 'block',
            }}
          >
            {player.name}
          </span>
        </div>
      </Html>

      {/* ── Refined Low-Poly Faceted Stylized Humanoid Avatar (Exact Reference Match) ── */}
      <HumanoidAvatar
        name={player.name}
        color={hoodieColor || '#69cfe3'}
        isMoving={() => isMovingRef.current}
        showGroundRing={false}
      />
    </group>
  );
}

/** Renders all other connected visitors/players in the virtual world */
export function OtherPlayers() {
  const { remotePlayers } = useMultiplayer();

  return (
    <group>
      {remotePlayers.map((player) => (
        <RemoteAvatar key={player.id} player={player} />
      ))}
    </group>
  );
}
