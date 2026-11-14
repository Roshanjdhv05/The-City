'use client';
import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

export interface HumanoidAvatarProps {
  color?: string;        // Primary hoodie / clothing color (default teal #2bb689)
  skinColor?: string;    // Skin complexion (default warm bronze #8e522b)
  hairColor?: string;    // Hair color (default espresso/black #161214)
  pantsColor?: string;   // Shorts / pants color (default dark navy #161c2c)
  shoeColor?: string;    // Sneaker primary color (default matches hoodie or #24a37b)
  isMoving?: boolean | (() => boolean); // Whether currently walking/running
  speed?: number;        // Animation speed multiplier
  showGroundRing?: boolean; // Yellow indicator ring on ground as shown in reference
  ringColor?: string;    // Ground ring color (default #facc15)
}

/**
 * Exact Stylized 3D Humanoid Character Avatar
 * Faithfully recreated to match the user's reference image:
 * - Proper slender humanoid anatomy and proportions
 * - Pointed stylized chin and angular jawline
 * - Pyramidal nose bridge, angled dark eyes, and sharp brows
 * - Sculpted anime-style spiky dark hair with swept-back crests and temple lock
 * - Raised rolled neck cowl / collar ring on hoodie
 * - Slender long-sleeve hoodie with wrist cuffs
 * - Elongated natural humanoid hands with thumb and articulated fingers
 * - Dark navy knee-length shorts with separate leg openings
 * - Contoured bronze calves, ankles, and crisp white socks
 * - Teal athletic sneakers with thick crisp white outsoles
 * - Signature open yellow C-ring ground indicator around the feet
 */
export function HumanoidAvatar({
  color = '#2bb689',
  skinColor = '#8e522b',
  hairColor = '#161214',
  pantsColor = '#161c2c',
  shoeColor,
  isMoving = false,
  speed = 1.0,
  showGroundRing = true,
  ringColor = '#facc15',
}: HumanoidAvatarProps) {
  const bodyGroup = useRef<THREE.Group>(null);
  const headGroup = useRef<THREE.Group>(null);
  const armL = useRef<THREE.Group>(null);
  const armR = useRef<THREE.Group>(null);
  const legL = useRef<THREE.Group>(null);
  const legR = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  const animTime = useRef(0);
  const finalShoeColor = shoeColor || color;

  useFrame((_, dt) => {
    const moving = typeof isMoving === 'function' ? isMoving() : !!isMoving;
    if (moving) {
      animTime.current += dt * 10 * speed;
    } else {
      animTime.current += dt * 2.2;
    }

    const t = animTime.current;

    if (legL.current && legR.current && armL.current && armR.current) {
      if (moving) {
        const swing = Math.sin(t) * 0.72;
        // Legs swing back and forth
        legL.current.rotation.x = swing;
        legR.current.rotation.x = -swing;
        // Arms swing opposite to legs
        armL.current.rotation.x = -swing * 0.75;
        armR.current.rotation.x = swing * 0.75;
        // Subtle natural arm flare
        armL.current.rotation.z = 0.07 + Math.abs(Math.sin(t)) * 0.04;
        armR.current.rotation.z = -0.07 - Math.abs(Math.sin(t)) * 0.04;
      } else {
        // Natural relaxed stance (arms hanging down at sides with slight outward tilt)
        legL.current.rotation.x = THREE.MathUtils.lerp(legL.current.rotation.x, 0, dt * 10);
        legR.current.rotation.x = THREE.MathUtils.lerp(legR.current.rotation.x, 0, dt * 10);
        armL.current.rotation.x = THREE.MathUtils.lerp(armL.current.rotation.x, Math.sin(t) * 0.03, dt * 6);
        armR.current.rotation.x = THREE.MathUtils.lerp(armR.current.rotation.x, -Math.sin(t) * 0.03, dt * 6);
        armL.current.rotation.z = 0.08 + Math.sin(t * 0.8) * 0.015;
        armR.current.rotation.z = -0.08 - Math.sin(t * 0.8) * 0.015;
      }
    }

    if (bodyGroup.current) {
      const bounce = moving ? Math.abs(Math.sin(t)) * 0.05 : Math.sin(t) * 0.01;
      bodyGroup.current.position.y = bounce;
    }

    if (headGroup.current) {
      headGroup.current.rotation.y = moving ? Math.sin(t * 0.5) * 0.03 : Math.sin(t * 0.6) * 0.02;
      headGroup.current.rotation.x = moving ? 0.02 : Math.sin(t * 1.2) * 0.01;
    }

    if (ringRef.current) {
      const pulse = 1.0 + Math.sin(t * 2.2) * 0.02;
      ringRef.current.scale.set(pulse, pulse, 1);
    }
  });

  return (
    <group>
      {/* ── Signature Open Yellow C-Ring Ground Indicator (exact from reference) ── */}
      {showGroundRing && (
        <group position={[0, 0.025, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <mesh ref={ringRef}>
            <ringGeometry args={[0.38, 0.44, 48, 1, 0.35, Math.PI * 1.65]} />
            <meshBasicMaterial
              color={ringColor}
              side={THREE.DoubleSide}
              transparent
              opacity={0.92}
            />
          </mesh>
        </group>
      )}

      {/* ── Main Articulated Humanoid Body ── */}
      <group ref={bodyGroup}>
        {/* ── Pelvis & Dark Navy Shorts Base ── */}
        <group position={[0, 0.86, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.27, 0.14, 0.19]} />
            <meshStandardMaterial color={pantsColor} roughness={0.7} />
          </mesh>
        </group>

        {/* ── Torso (Slender Long-Sleeve Hoodie) ── */}
        <group position={[0, 1.15, 0]}>
          {/* Main Upper Chest (tapered athletic silhouette) */}
          <mesh position={[0, 0.08, 0]} castShadow>
            <cylinderGeometry args={[0.175, 0.145, 0.28, 14]} />
            <meshStandardMaterial color={color} roughness={0.65} />
          </mesh>

          {/* Mid Torso & Waist */}
          <mesh position={[0, -0.10, 0]} castShadow>
            <cylinderGeometry args={[0.145, 0.140, 0.18, 14]} />
            <meshStandardMaterial color={color} roughness={0.65} />
          </mesh>

          {/* Lower Ribbed Waist Hem */}
          <mesh position={[0, -0.19, 0]} castShadow>
            <cylinderGeometry args={[0.140, 0.142, 0.045, 14]} />
            <meshStandardMaterial color={color} roughness={0.75} />
          </mesh>

          {/* Distinct Raised Rolled Neck Collar / Cowl Ring (exact detail from reference!) */}
          <mesh position={[0, 0.24, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <torusGeometry args={[0.076, 0.026, 8, 20]} />
            <meshStandardMaterial color={color} roughness={0.7} />
          </mesh>
        </group>

        {/* ── Slender Neck & Sculpted Head Group ── */}
        <group ref={headGroup} position={[0, 1.44, 0]}>
          {/* Slender Human Neck */}
          <mesh position={[0, 0.035, 0]} castShadow>
            <cylinderGeometry args={[0.048, 0.054, 0.11, 10]} />
            <meshStandardMaterial color={skinColor} roughness={0.82} />
          </mesh>

          {/* Sculpted Head & Face */}
          <group position={[0, 0.17, 0]}>
            {/* Cranium / Upper Head */}
            <mesh position={[0, 0.04, 0]} scale={[0.86, 1.05, 0.92]} castShadow>
              <sphereGeometry args={[0.115, 16, 14]} />
              <meshStandardMaterial color={skinColor} roughness={0.82} />
            </mesh>

            {/* Tapered Cheek & Upper Jaw */}
            <mesh position={[0, -0.025, 0.01]} scale={[0.85, 1, 0.9]} castShadow>
              <cylinderGeometry args={[0.096, 0.068, 0.11, 10]} />
              <meshStandardMaterial color={skinColor} roughness={0.82} />
            </mesh>

            {/* Pointed Stylized Chin (from reference image) */}
            <mesh position={[0, -0.082, 0.022]} scale={[0.9, 0.8, 1]} castShadow>
              <sphereGeometry args={[0.042, 10, 8]} />
              <meshStandardMaterial color={skinColor} roughness={0.82} />
            </mesh>

            {/* Stylized Straight Nose Bridge (visible straight triangular wedge) */}
            <mesh position={[0, -0.015, 0.108]} rotation={[0.48, 0, 0]} castShadow>
              <coneGeometry args={[0.018, 0.058, 4]} />
              <meshStandardMaterial color={skinColor} roughness={0.82} />
            </mesh>

            {/* Stylized Slanted Dark Eyes & Sharp Brow Ridge */}
            {[-0.044, 0.044].map((x) => (
              <group key={x} position={[x, 0.018, 0.096]} rotation={[0, x > 0 ? 0.14 : -0.14, x > 0 ? -0.12 : 0.12]}>
                {/* Dark Eye Slit */}
                <mesh position={[0, 0, 0]}>
                  <boxGeometry args={[0.028, 0.013, 0.01]} />
                  <meshBasicMaterial color="#141113" />
                </mesh>
                {/* Sharp Stylized Eyebrow */}
                <mesh position={[0, 0.020, 0.003]} rotation={[0, 0, x > 0 ? -0.12 : 0.12]}>
                  <boxGeometry args={[0.036, 0.009, 0.012]} />
                  <meshBasicMaterial color="#141113" />
                </mesh>
              </group>
            ))}

            {/* Stylized Mouth Line */}
            <mesh position={[0, -0.058, 0.088]} rotation={[0.08, 0, 0]}>
              <boxGeometry args={[0.026, 0.005, 0.01]} />
              <meshStandardMaterial color="#5e3218" roughness={0.9} />
            </mesh>

            {/* Ears (L & R) */}
            {[-0.102, 0.102].map((x) => (
              <mesh key={x} position={[x, 0.0, -0.01]} rotation={[0, 0, x > 0 ? -0.12 : 0.12]}>
                <boxGeometry args={[0.014, 0.038, 0.024]} />
                <meshStandardMaterial color={skinColor} roughness={0.82} />
              </mesh>
            ))}

            {/* ── Stylized Spiky Hair (Faithful Recreation of Reference) ── */}
            <group position={[0, 0.035, 0]}>
              {/* Crown Base Volume */}
              <mesh position={[0, 0.04, -0.02]} scale={[0.92, 0.9, 1.0]} castShadow>
                <sphereGeometry args={[0.122, 14, 12]} />
                <meshStandardMaterial color={hairColor} roughness={0.92} />
              </mesh>

              {/* Back Hair Nape Cover */}
              <mesh position={[0, -0.02, -0.06]} rotation={[-0.25, 0, 0]} castShadow>
                <boxGeometry args={[0.19, 0.14, 0.09]} />
                <meshStandardMaterial color={hairColor} roughness={0.92} />
              </mesh>

              {/* Distinct Temple Lock (the visible drooping side clump in reference!) */}
              <mesh position={[0.095, -0.02, 0.04]} rotation={[0.3, 0, -0.18]} castShadow>
                <coneGeometry args={[0.032, 0.095, 4]} />
                <meshStandardMaterial color={hairColor} roughness={0.92} />
              </mesh>
              <mesh position={[-0.095, -0.02, 0.04]} rotation={[0.3, 0, 0.18]} castShadow>
                <coneGeometry args={[0.032, 0.095, 4]} />
                <meshStandardMaterial color={hairColor} roughness={0.92} />
              </mesh>

              {/* Front Fringe Tufts */}
              {[-0.05, 0.0, 0.05].map((x, idx) => (
                <mesh
                  key={x}
                  position={[x, 0.085, 0.085]}
                  rotation={[0.55 + idx * 0.05, 0, (x / 0.05) * 0.2]}
                  castShadow
                >
                  <coneGeometry args={[0.032, 0.09, 4]} />
                  <meshStandardMaterial color={hairColor} roughness={0.92} />
                </mesh>
              ))}

              {/* Top Swept-Back Spiky Crest Ridges (front to back) */}
              {[-0.04, 0.0, 0.04].map((x) => (
                <group key={x} position={[x, 0.14, 0]}>
                  <mesh position={[0, 0.02, -0.03]} rotation={[-0.55, 0, (x / 0.04) * 0.12]} castShadow>
                    <coneGeometry args={[0.035, 0.11, 4]} />
                    <meshStandardMaterial color={hairColor} roughness={0.92} />
                  </mesh>
                  <mesh position={[0, 0.03, 0.02]} rotation={[-0.32, 0, (x / 0.04) * 0.15]} castShadow>
                    <coneGeometry args={[0.036, 0.11, 4]} />
                    <meshStandardMaterial color={hairColor} roughness={0.92} />
                  </mesh>
                </group>
              ))}

              {/* Center Crown Peak */}
              <mesh position={[0, 0.17, 0.01]} rotation={[-0.25, 0, 0]} castShadow>
                <coneGeometry args={[0.042, 0.12, 4]} />
                <meshStandardMaterial color={hairColor} roughness={0.92} />
              </mesh>
            </group>
          </group>
        </group>

        {/* ── Left Arm (Long Sleeve Hoodie & Elongated Hand) ── */}
        <group ref={armL} position={[-0.22, 1.35, 0]}>
          {/* Shoulder Cap */}
          <mesh castShadow>
            <sphereGeometry args={[0.058, 8, 8]} />
            <meshStandardMaterial color={color} roughness={0.65} />
          </mesh>

          {/* Upper Arm Sleeve */}
          <mesh position={[-0.015, -0.14, 0]} rotation={[0, 0, 0.07]} castShadow>
            <cylinderGeometry args={[0.052, 0.046, 0.22, 10]} />
            <meshStandardMaterial color={color} roughness={0.65} />
          </mesh>

          {/* Forearm Sleeve */}
          <mesh position={[-0.026, -0.32, 0.01]} rotation={[0, 0, 0.05]} castShadow>
            <cylinderGeometry args={[0.046, 0.042, 0.20, 10]} />
            <meshStandardMaterial color={color} roughness={0.65} />
          </mesh>

          {/* Sleeve Cuff */}
          <mesh position={[-0.032, -0.425, 0.01]} rotation={[0, 0, 0.05]} castShadow>
            <cylinderGeometry args={[0.044, 0.044, 0.035, 10]} />
            <meshStandardMaterial color={color} roughness={0.8} />
          </mesh>

          {/* Elongated Humanoid Left Hand (Prominent In Reference Image!) */}
          <group position={[-0.035, -0.49, 0.01]}>
            {/* Wrist */}
            <mesh position={[0, 0.02, 0]} castShadow>
              <cylinderGeometry args={[0.024, 0.026, 0.035, 8]} />
              <meshStandardMaterial color={skinColor} roughness={0.82} />
            </mesh>

            {/* Elongated Palm */}
            <mesh position={[0, -0.032, 0]} castShadow>
              <boxGeometry args={[0.038, 0.075, 0.022]} />
              <meshStandardMaterial color={skinColor} roughness={0.82} />
            </mesh>

            {/* Distinct Thumb (pointing forward/inward) */}
            <mesh position={[0.016, -0.015, 0.012]} rotation={[-0.32, 0, -0.38]} castShadow>
              <cylinderGeometry args={[0.008, 0.007, 0.042, 6]} />
              <meshStandardMaterial color={skinColor} roughness={0.82} />
            </mesh>

            {/* Four Long Articulated Fingers (Pointing downward in relaxed pose) */}
            {[-0.012, -0.004, 0.004, 0.012].map((fx, fidx) => (
              <mesh
                key={fidx}
                position={[fx, -0.088 - (fidx === 1 || fidx === 2 ? 0.006 : 0), 0]}
                rotation={[0.04, 0, 0]}
                castShadow
              >
                <cylinderGeometry args={[0.0055, 0.0046, 0.050, 5]} />
                <meshStandardMaterial color={skinColor} roughness={0.82} />
              </mesh>
            ))}
          </group>
        </group>

        {/* ── Right Arm (Long Sleeve Hoodie & Elongated Hand) ── */}
        <group ref={armR} position={[0.22, 1.35, 0]}>
          {/* Shoulder Cap */}
          <mesh castShadow>
            <sphereGeometry args={[0.058, 8, 8]} />
            <meshStandardMaterial color={color} roughness={0.65} />
          </mesh>

          {/* Upper Arm Sleeve */}
          <mesh position={[0.015, -0.14, 0]} rotation={[0, 0, -0.07]} castShadow>
            <cylinderGeometry args={[0.052, 0.046, 0.22, 10]} />
            <meshStandardMaterial color={color} roughness={0.65} />
          </mesh>

          {/* Forearm Sleeve */}
          <mesh position={[0.026, -0.32, 0.01]} rotation={[0, 0, -0.05]} castShadow>
            <cylinderGeometry args={[0.046, 0.042, 0.20, 10]} />
            <meshStandardMaterial color={color} roughness={0.65} />
          </mesh>

          {/* Sleeve Cuff */}
          <mesh position={[0.032, -0.425, 0.01]} rotation={[0, 0, -0.05]} castShadow>
            <cylinderGeometry args={[0.044, 0.044, 0.035, 10]} />
            <meshStandardMaterial color={color} roughness={0.8} />
          </mesh>

          {/* Elongated Humanoid Right Hand (Prominent In Reference Image!) */}
          <group position={[0.035, -0.49, 0.01]}>
            {/* Wrist */}
            <mesh position={[0, 0.02, 0]} castShadow>
              <cylinderGeometry args={[0.024, 0.026, 0.035, 8]} />
              <meshStandardMaterial color={skinColor} roughness={0.82} />
            </mesh>

            {/* Elongated Palm */}
            <mesh position={[0, -0.032, 0]} castShadow>
              <boxGeometry args={[0.038, 0.075, 0.022]} />
              <meshStandardMaterial color={skinColor} roughness={0.82} />
            </mesh>

            {/* Distinct Thumb (pointing forward/inward) */}
            <mesh position={[-0.016, -0.015, 0.012]} rotation={[-0.32, 0, 0.38]} castShadow>
              <cylinderGeometry args={[0.008, 0.007, 0.042, 6]} />
              <meshStandardMaterial color={skinColor} roughness={0.82} />
            </mesh>

            {/* Four Long Articulated Fingers (Pointing downward in relaxed pose) */}
            {[-0.012, -0.004, 0.004, 0.012].map((fx, fidx) => (
              <mesh
                key={fidx}
                position={[fx, -0.088 - (fidx === 1 || fidx === 2 ? 0.006 : 0), 0]}
                rotation={[0.04, 0, 0]}
                castShadow
              >
                <cylinderGeometry args={[0.0055, 0.0046, 0.050, 5]} />
                <meshStandardMaterial color={skinColor} roughness={0.82} />
              </mesh>
            ))}
          </group>
        </group>

        {/* ── Left Leg (Navy Shorts, Slender Bronze Leg, White Sock, Teal Sneaker) ── */}
        <group ref={legL} position={[-0.09, 0.78, 0]}>
          {/* Navy Shorts Leg */}
          <mesh position={[0, -0.08, 0]} castShadow>
            <cylinderGeometry args={[0.082, 0.076, 0.20, 12]} />
            <meshStandardMaterial color={pantsColor} roughness={0.7} />
          </mesh>

          {/* Shorts Cuff Above Knee */}
          <mesh position={[0, -0.18, 0]} castShadow>
            <cylinderGeometry args={[0.078, 0.079, 0.03, 12]} />
            <meshStandardMaterial color={pantsColor} roughness={0.85} />
          </mesh>

          {/* Bare Thigh & Knee (from reference) */}
          <mesh position={[0, -0.24, 0]} castShadow>
            <cylinderGeometry args={[0.055, 0.050, 0.11, 10]} />
            <meshStandardMaterial color={skinColor} roughness={0.82} />
          </mesh>
          <mesh position={[0, -0.31, 0.006]} castShadow>
            <sphereGeometry args={[0.046, 8, 8]} />
            <meshStandardMaterial color={skinColor} roughness={0.82} />
          </mesh>

          {/* Slender Calf & Shin */}
          <mesh position={[0, -0.46, -0.004]} castShadow>
            <cylinderGeometry args={[0.046, 0.036, 0.26, 10]} />
            <meshStandardMaterial color={skinColor} roughness={0.82} />
          </mesh>

          {/* Clean White Ankle Sock */}
          <mesh position={[0, -0.60, 0]} castShadow>
            <cylinderGeometry args={[0.038, 0.038, 0.06, 10]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.4} />
          </mesh>

          {/* Stylized Low-Cut Athletic Sneaker */}
          <group position={[0, -0.68, 0.02]} rotation={[0, 0.1, 0]}>
            {/* Sneaker Upper (Teal) */}
            <mesh position={[0, 0.032, 0.02]} castShadow>
              <boxGeometry args={[0.088, 0.058, 0.18]} />
              <meshStandardMaterial color={finalShoeColor} roughness={0.55} />
            </mesh>
            {/* Rounded Front Toe */}
            <mesh position={[0, 0.022, 0.10]} scale={[1, 0.82, 1]} castShadow>
              <cylinderGeometry args={[0.044, 0.044, 0.05, 10]} />
              <meshStandardMaterial color={finalShoeColor} roughness={0.55} />
            </mesh>
            {/* White Ankle Collar Rim */}
            <mesh position={[0, 0.058, -0.025]}>
              <boxGeometry args={[0.078, 0.014, 0.08]} />
              <meshStandardMaterial color="#ffffff" roughness={0.35} />
            </mesh>
            {/* White Laces / Tongue Accent */}
            <mesh position={[0, 0.060, 0.035]}>
              <boxGeometry args={[0.038, 0.008, 0.055]} />
              <meshStandardMaterial color="#ffffff" roughness={0.35} />
            </mesh>
            {/* Crisp Thick White Rubber Cupsole / Foxing */}
            <mesh position={[0, -0.012, 0.02]} castShadow>
              <boxGeometry args={[0.096, 0.028, 0.20]} />
              <meshStandardMaterial color="#ffffff" roughness={0.3} />
            </mesh>
            <mesh position={[0, -0.012, 0.105]} scale={[1, 0.85, 1]} castShadow>
              <cylinderGeometry args={[0.047, 0.047, 0.028, 10]} />
              <meshStandardMaterial color="#ffffff" roughness={0.3} />
            </mesh>
          </group>
        </group>

        {/* ── Right Leg (Navy Shorts, Slender Bronze Leg, White Sock, Teal Sneaker) ── */}
        <group ref={legR} position={[0.09, 0.78, 0]}>
          {/* Navy Shorts Leg */}
          <mesh position={[0, -0.08, 0]} castShadow>
            <cylinderGeometry args={[0.082, 0.076, 0.20, 12]} />
            <meshStandardMaterial color={pantsColor} roughness={0.7} />
          </mesh>

          {/* Shorts Cuff Above Knee */}
          <mesh position={[0, -0.18, 0]} castShadow>
            <cylinderGeometry args={[0.078, 0.079, 0.03, 12]} />
            <meshStandardMaterial color={pantsColor} roughness={0.85} />
          </mesh>

          {/* Bare Thigh & Knee (from reference) */}
          <mesh position={[0, -0.24, 0]} castShadow>
            <cylinderGeometry args={[0.055, 0.050, 0.11, 10]} />
            <meshStandardMaterial color={skinColor} roughness={0.82} />
          </mesh>
          <mesh position={[0, -0.31, 0.006]} castShadow>
            <sphereGeometry args={[0.046, 8, 8]} />
            <meshStandardMaterial color={skinColor} roughness={0.82} />
          </mesh>

          {/* Slender Calf & Shin */}
          <mesh position={[0, -0.46, -0.004]} castShadow>
            <cylinderGeometry args={[0.046, 0.036, 0.26, 10]} />
            <meshStandardMaterial color={skinColor} roughness={0.82} />
          </mesh>

          {/* Clean White Ankle Sock */}
          <mesh position={[0, -0.60, 0]} castShadow>
            <cylinderGeometry args={[0.038, 0.038, 0.06, 10]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.4} />
          </mesh>

          {/* Stylized Low-Cut Athletic Sneaker */}
          <group position={[0, -0.68, 0.02]} rotation={[0, -0.1, 0]}>
            {/* Sneaker Upper (Teal) */}
            <mesh position={[0, 0.032, 0.02]} castShadow>
              <boxGeometry args={[0.088, 0.058, 0.18]} />
              <meshStandardMaterial color={finalShoeColor} roughness={0.55} />
            </mesh>
            {/* Rounded Front Toe */}
            <mesh position={[0, 0.022, 0.10]} scale={[1, 0.82, 1]} castShadow>
              <cylinderGeometry args={[0.044, 0.044, 0.05, 10]} />
              <meshStandardMaterial color={finalShoeColor} roughness={0.55} />
            </mesh>
            {/* White Ankle Collar Rim */}
            <mesh position={[0, 0.058, -0.025]}>
              <boxGeometry args={[0.078, 0.014, 0.08]} />
              <meshStandardMaterial color="#ffffff" roughness={0.35} />
            </mesh>
            {/* White Laces / Tongue Accent */}
            <mesh position={[0, 0.060, 0.035]}>
              <boxGeometry args={[0.038, 0.008, 0.055]} />
              <meshStandardMaterial color="#ffffff" roughness={0.35} />
            </mesh>
            {/* Crisp Thick White Rubber Cupsole / Foxing */}
            <mesh position={[0, -0.012, 0.02]} castShadow>
              <boxGeometry args={[0.096, 0.028, 0.20]} />
              <meshStandardMaterial color="#ffffff" roughness={0.3} />
            </mesh>
            <mesh position={[0, -0.012, 0.105]} scale={[1, 0.85, 1]} castShadow>
              <cylinderGeometry args={[0.047, 0.047, 0.028, 10]} />
              <meshStandardMaterial color="#ffffff" roughness={0.3} />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );
}
