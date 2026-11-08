'use client';
import * as THREE from 'three';
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { RemotePlayer, useMultiplayer } from '@/lib/multiplayer';

const F = (c: string) => <meshStandardMaterial color={c} flatShading roughness={0.9} />;

function RemoteAvatar({ player }: { player: RemotePlayer }) {
  const root = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const legL = useRef<THREE.Group>(null);
  const legR = useRef<THREE.Group>(null);
  const armL = useRef<THREE.Group>(null);
  const armR = useRef<THREE.Group>(null);

  const currentPos = useRef(new THREE.Vector3(player.x, player.y, player.z));
  const currentYaw = useRef(player.yaw);
  const animTime = useRef(0);

  // Player's distinct custom color
  const hoodieColor = player.color || '#3b82f6';

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

    // Walking animation if moving
    const isMoving = player.moving || currentPos.current.distanceTo(targetPos) > 0.08;
    if (isMoving) {
      animTime.current += dt * 10;
    }

    const sw = isMoving ? Math.sin(animTime.current) * 0.7 : 0;
    if (legL.current && legR.current && armL.current && armR.current) {
      legL.current.rotation.x = sw;
      legR.current.rotation.x = -sw;
      armL.current.rotation.x = -sw * 0.8;
      armR.current.rotation.x = sw * 0.8;
    }
    if (body.current) {
      body.current.position.y = isMoving ? Math.abs(Math.sin(animTime.current)) * 0.05 : 0;
    }
  });

  return (
    <group ref={root} position={[player.x, player.y, player.z]} rotation={[0, player.yaw, 0]}>
      {/* ── 3D Floating Name Tag Above Character ── */}
      <Html position={[0, 2.05, 0]} center distanceFactor={42} zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '3px',
            background: 'rgba(10, 16, 30, 0.65)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            border: `0.75px solid ${hoodieColor}99`,
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.35)',
            borderRadius: '999px',
            padding: '1px 5px 1px 3.5px',
            whiteSpace: 'nowrap',
            transform: 'translate3d(0, 0, 0)',
            userSelect: 'none',
          }}
        >
          <span
            style={{
              width: '4px',
              height: '4px',
              borderRadius: '50%',
              backgroundColor: hoodieColor,
              boxShadow: `0 0 4px ${hoodieColor}`,
              display: 'inline-block',
            }}
          />
          <span
            style={{
              color: '#ffffff',
              fontSize: '7.5px',
              fontWeight: 600,
              letterSpacing: '0.01em',
              textShadow: '0 1px 2px rgba(0,0,0,0.9)',
            }}
          >
            {player.name}
          </span>
        </div>
      </Html>

      {/* ── 3D Character Avatar Body ── */}
      <group ref={body}>
        {/* Legs & Shoes */}
        <group ref={legL} position={[-0.13, 0.82, 0]}>
          <mesh position={[0, -0.36, 0]} castShadow><boxGeometry args={[0.2, 0.72, 0.22]} />{F('#2b2f45')}</mesh>
          <mesh position={[0, -0.74, 0.05]} castShadow><boxGeometry args={[0.23, 0.14, 0.34]} />{F('#ffffff')}</mesh>
        </group>
        <group ref={legR} position={[0.13, 0.82, 0]}>
          <mesh position={[0, -0.36, 0]} castShadow><boxGeometry args={[0.2, 0.72, 0.22]} />{F('#2b2f45')}</mesh>
          <mesh position={[0, -0.74, 0.05]} castShadow><boxGeometry args={[0.23, 0.14, 0.34]} />{F('#ffffff')}</mesh>
        </group>

        {/* Torso Hoodie & Backpack */}
        <mesh position={[0, 1.18, 0]} castShadow><boxGeometry args={[0.52, 0.62, 0.32]} />{F(hoodieColor)}</mesh>
        <mesh position={[0, 1.14, -0.25]} castShadow><boxGeometry args={[0.4, 0.5, 0.2]} />{F('#262c46')}</mesh>

        {/* Arms with Hoodie Sleeves */}
        <group ref={armL} position={[-0.34, 1.42, 0]}>
          <mesh position={[0, -0.26, 0]} castShadow><boxGeometry args={[0.15, 0.56, 0.17]} />{F(hoodieColor)}</mesh>
          <mesh position={[0, -0.56, 0]}><boxGeometry args={[0.13, 0.12, 0.13]} />{F('#f6cba6')}</mesh>
        </group>
        <group ref={armR} position={[0.34, 1.42, 0]}>
          <mesh position={[0, -0.26, 0]} castShadow><boxGeometry args={[0.15, 0.56, 0.17]} />{F(hoodieColor)}</mesh>
          <mesh position={[0, -0.56, 0]}><boxGeometry args={[0.13, 0.12, 0.13]} />{F('#f6cba6')}</mesh>
        </group>

        {/* Head, Hair & Eyes */}
        <mesh position={[0, 1.72, 0]} scale={[1, 1.05, 1]} castShadow><icosahedronGeometry args={[0.27, 1]} />{F('#f6cba6')}</mesh>
        <mesh position={[0, 1.83, -0.04]} scale={[1.05, 0.8, 1.05]} castShadow><icosahedronGeometry args={[0.29, 1]} />{F('#3a2a24')}</mesh>
        {[-0.1, 0.1].map(x => (
          <mesh key={x} position={[x, 1.72, 0.25]}><boxGeometry args={[0.05, 0.07, 0.03]} />{F('#2a2230')}</mesh>
        ))}
      </group>
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
