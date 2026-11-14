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
      {/* ── 3D Floating Name Tag Above Character ── */}
      <Html position={[0, 1.95, 0]} center distanceFactor={60} zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '2px',
            background: 'rgba(10, 16, 30, 0.65)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            border: `0.75px solid ${hoodieColor}99`,
            boxShadow: '0 2px 5px rgba(0, 0, 0, 0.35)',
            borderRadius: '999px',
            padding: '1px 3.5px 1px 2.5px',
            whiteSpace: 'nowrap',
            transform: 'translate3d(0, 0, 0)',
            userSelect: 'none',
          }}
        >
          <span
            style={{
              width: '3px',
              height: '3px',
              borderRadius: '50%',
              backgroundColor: hoodieColor,
              boxShadow: `0 0 3px ${hoodieColor}`,
              display: 'inline-block',
            }}
          />
          <span
            style={{
              color: '#ffffff',
              fontSize: '5.5px',
              fontWeight: 600,
              letterSpacing: '0.01em',
              textShadow: '0 1px 2px rgba(0,0,0,0.9)',
            }}
          >
            {player.name}
          </span>
        </div>
      </Html>

      {/* ── Stylized Humanoid Avatar ── */}
      <HumanoidAvatar
        color={hoodieColor}
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
