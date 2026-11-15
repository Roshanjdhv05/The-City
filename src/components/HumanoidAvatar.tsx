'use client';
import React, { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { LowPolyCharacter, CharacterConfig } from '@/lib/LowPolyCharacter';

export interface HumanoidAvatarProps {
  color?: string;        // Shirt color (defaults to reference sky blue #69cfe3 or player color)
  skinColor?: string;    // Skin tone (defaults to warm peach #d9a577)
  hairColor?: string;    // Hair and beard color (defaults to dark chocolate #3a2116)
  pantsColor?: string;   // Jeans color (defaults to dark indigo #1d4a7a)
  shoeColor?: string;    // Shoe color (defaults to white #f1f1ee)
  hairStyle?: 'short' | 'buzz' | 'long' | 'bun' | 'none' | string;
  facialHair?: 'full' | 'goatee' | 'moustache' | 'none' | string;
  height?: number;
  isMoving?: boolean | (() => boolean);
  grounded?: boolean | (() => boolean);
  speed?: number;
  showGroundRing?: boolean;
  ringColor?: string;
  name?: string;
}

/**
 * Exact Low-Poly Faceted Stylized Humanoid Avatar
 * Powered by LowPolyCharacter:
 * - 17-bone skinned humanoid skeleton with loft-built buffer geometry
 * - Single SkinnedMesh, single shared material, vertex colors (1 draw call per character)
 * - Faceted planar geometry with flatShading: true
 * - Detailed head, swept-back quiff hair, full beard & mustache, eyes, pupils, brows, nose, lips
 * - Light sky-blue button-down shirt with pointed collar, placket, and white buttons
 * - Dark leather belt with silver rectangular buckle
 * - Fitted dark indigo denim jeans with side stitching
 * - White casual sneakers with dark contrast soles and laces
 * - Speed-synchronized walking/running gait without foot sliding, arm counter-swing, and idle breathing
 */
export function HumanoidAvatar({
  color,
  skinColor = '#d9a577',
  hairColor = '#3a2116',
  pantsColor = '#1d4a7a',
  shoeColor = '#f1f1ee',
  hairStyle = 'short',
  facialHair = 'full',
  height = 1.8,
  isMoving = false,
  grounded = true,
  speed = 1.0,
  showGroundRing = false,
  ringColor = '#facc15',
  name = 'Player',
}: HumanoidAvatarProps) {
  const rootGroup = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  const shirtColor = color || '#69cfe3';

  // Instantiate the LowPolyCharacter
  const character = useMemo(() => {
    return new (LowPolyCharacter as any)(
      {
        height,
        hairStyle,
        facialHair,
        colors: {
          skin: skinColor,
          hair: hairColor,
          beard: hairColor,
          shirt: shirtColor,
          pants: pantsColor,
          shoe: shoeColor,
        },
      },
      { walkSpeed: 1.6, runSpeed: 5.0 }
    );
  }, []);

  // Update appearance dynamically on prop changes
  useEffect(() => {
    if (character && typeof character.setConfig === 'function') {
      character.setConfig({
        height,
        hairStyle,
        facialHair,
        colors: {
          skin: skinColor,
          hair: hairColor,
          beard: hairColor,
          shirt: shirtColor,
          pants: pantsColor,
          shoe: shoeColor,
        },
      });
    }
  }, [character, height, hairStyle, facialHair, skinColor, hairColor, shirtColor, pantsColor, shoeColor]);

  // Clean up GPU resources on unmount
  useEffect(() => {
    return () => {
      if (character && typeof character.dispose === 'function') {
        character.dispose();
      }
    };
  }, [character]);

  // Frame animation loop
  useFrame((_, dt) => {
    const moving = typeof isMoving === 'function' ? isMoving() : !!isMoving;
    const isGrounded = typeof grounded === 'function' ? grounded() : !!grounded;
    const currentSpeed = moving ? 1.6 * speed : 0;

    if (character && typeof character.update === 'function') {
      character.update(dt, {
        speed: currentSpeed,
        grounded: isGrounded,
      });
    }

    if (ringRef.current) {
      const pulse = 1.0 + Math.sin(Date.now() * 0.003) * 0.02;
      ringRef.current.scale.set(pulse, pulse, 1);
    }
  });

  return (
    <group ref={rootGroup}>
      {/* ── Ground Selection Ring (if enabled) ── */}
      {showGroundRing && (
        <group position={[0, 0.025, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <mesh ref={ringRef}>
            <ringGeometry args={[0.36, 0.42, 32, 1, 0.35, Math.PI * 1.65]} />
            <meshBasicMaterial color={ringColor} side={THREE.DoubleSide} transparent opacity={0.85} />
          </mesh>
        </group>
      )}

      {/* ── Procedural Skinned Low-Poly Humanoid Character ── */}
      {character?.group && <primitive object={character.group} />}
    </group>
  );
}
