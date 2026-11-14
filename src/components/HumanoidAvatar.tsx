'use client';
import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

export interface HumanoidAvatarProps {
  color?: string;        // Primary hoodie / clothing color (default teal #1eb886)
  skinColor?: string;    // Skin complexion (default warm tan #a86940)
  hairColor?: string;    // Hair color (default espresso #1c1518)
  pantsColor?: string;   // Shorts / pants color (default dark navy #1c243a)
  shoeColor?: string;    // Sneaker primary color (default matches hoodie or #14b8a6)
  isMoving?: boolean | (() => boolean); // Whether currently walking/running
  speed?: number;        // Animation speed multiplier
  showGroundRing?: boolean; // Yellow indicator ring on ground as shown in reference
  ringColor?: string;    // Ground ring color (default #f59e0b)
}

/**
 * Highly polished stylized 3D Humanoid Character Avatar
 * Faithfully recreation of the user reference image:
 * - Proper humanoid anatomy & proportions
 * - Stylized sculpted anime-style spiky hair
 * - Defined facial features (angular nose, stylized expressive eyes & brows)
 * - Athletic hoodie with raised cowl neck ring and sleeve cuffs
 * - Natural hands with thumb and fingers
 * - Dark navy shorts revealing contoured bare legs & knees
 * - Athletic low-cut sneakers with white soles and white sock trim
 * - Iconic glowing yellow ground selection ring
 */
export function HumanoidAvatar({
  color = '#1eb886',
  skinColor = '#a86940',
  hairColor = '#1c1518',
  pantsColor = '#1c243a',
  shoeColor,
  isMoving = false,
  speed = 1.0,
  showGroundRing = true,
  ringColor = '#f59e0b',
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
      // Gentle breathing / idle bobbing
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
        // Slight outward arm flare while walking
        armL.current.rotation.z = 0.08 + Math.abs(Math.sin(t)) * 0.05;
        armR.current.rotation.z = -0.08 - Math.abs(Math.sin(t)) * 0.05;
      } else {
        // Natural relaxed idle pose
        legL.current.rotation.x = THREE.MathUtils.lerp(legL.current.rotation.x, 0, dt * 10);
        legR.current.rotation.x = THREE.MathUtils.lerp(legR.current.rotation.x, 0, dt * 10);
        armL.current.rotation.x = THREE.MathUtils.lerp(armL.current.rotation.x, Math.sin(t) * 0.04, dt * 6);
        armR.current.rotation.x = THREE.MathUtils.lerp(armR.current.rotation.x, -Math.sin(t) * 0.04, dt * 6);
        armL.current.rotation.z = 0.09 + Math.sin(t * 0.8) * 0.02;
        armR.current.rotation.z = -0.09 - Math.sin(t * 0.8) * 0.02;
      }
    }

    if (bodyGroup.current) {
      // Subtle vertical bounce when running / subtle breathing when idle
      const bounce = moving ? Math.abs(Math.sin(t)) * 0.055 : Math.sin(t) * 0.012;
      bodyGroup.current.position.y = bounce;
    }

    if (headGroup.current) {
      // Subtle head stabilization / idle tilt
      headGroup.current.rotation.y = moving ? Math.sin(t * 0.5) * 0.04 : Math.sin(t * 0.6) * 0.03;
      headGroup.current.rotation.x = moving ? 0.03 : Math.sin(t * 1.2) * 0.015;
    }

    // Subtle ground ring pulse
    if (ringRef.current) {
      const pulse = 1.0 + Math.sin(t * 2.5) * 0.03;
      ringRef.current.scale.set(pulse, pulse, 1);
    }
  });

  return (
    <group>
      {/* ── Iconic Yellow Ground Indicator Ring (from reference image) ── */}
      {showGroundRing && (
        <group position={[0, 0.025, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <mesh ref={ringRef}>
            <ringGeometry args={[0.38, 0.44, 48]} />
            <meshBasicMaterial
              color={ringColor}
              side={THREE.DoubleSide}
              transparent
              opacity={0.88}
            />
          </mesh>
          {/* Subtle inner accent ring */}
          <mesh position={[0, 0, 0.001]}>
            <ringGeometry args={[0.34, 0.355, 48]} />
            <meshBasicMaterial
              color={ringColor}
              side={THREE.DoubleSide}
              transparent
              opacity={0.4}
            />
          </mesh>
        </group>
      )}

      {/* ── Main Articulated Humanoid Body ── */}
      <group ref={bodyGroup}>
        {/* ── Pelvis & Shorts Base ── */}
        <group position={[0, 0.86, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.32, 0.18, 0.22]} />
            <meshStandardMaterial color={pantsColor} roughness={0.7} />
          </mesh>
        </group>

        {/* ── Torso / Athletic Long-Sleeve Hoodie ── */}
        <group position={[0, 1.16, 0]}>
          {/* Main Hoodie Chest (tapered athletic silhouette) */}
          <mesh position={[0, 0.04, 0]} castShadow>
            <cylinderGeometry args={[0.22, 0.175, 0.38, 12]} />
            <meshStandardMaterial color={color} roughness={0.65} />
          </mesh>

          {/* Lower Hoodie Hem / Waistband */}
          <mesh position={[0, -0.16, 0]} castShadow>
            <cylinderGeometry args={[0.178, 0.182, 0.07, 12]} />
            <meshStandardMaterial color={color} roughness={0.8} />
          </mesh>

          {/* Shoulder Yoke / Upper Chest Padding */}
          <mesh position={[0, 0.18, 0]} castShadow>
            <boxGeometry args={[0.42, 0.12, 0.24]} />
            <meshStandardMaterial color={color} roughness={0.65} />
          </mesh>

          {/* Raised Cowl Neck / Hoodie Collar Ring (exact detail from reference!) */}
          <mesh position={[0, 0.28, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <torusGeometry args={[0.095, 0.035, 8, 18]} />
            <meshStandardMaterial color={color} roughness={0.7} />
          </mesh>

          {/* Subtle Hoodie Drawstring Accents */}
          {[-0.035, 0.035].map((x) => (
            <mesh key={x} position={[x, 0.16, 0.11]} rotation={[0, 0, x > 0 ? -0.06 : 0.06]}>
              <cylinderGeometry args={[0.005, 0.005, 0.12, 6]} />
              <meshStandardMaterial color="#ffffff" roughness={0.5} />
            </mesh>
          ))}
        </group>

        {/* ── Neck & Head Group ── */}
        <group ref={headGroup} position={[0, 1.48, 0]}>
          {/* Slender Human Neck */}
          <mesh position={[0, 0.04, 0]} castShadow>
            <cylinderGeometry args={[0.062, 0.072, 0.12, 10]} />
            <meshStandardMaterial color={skinColor} roughness={0.8} />
          </mesh>

          {/* Head & Face Position */}
          <group position={[0, 0.18, 0]}>
            {/* Sculpted Jaw & Chin (angular stylized jaw from reference) */}
            <mesh position={[0, -0.04, 0.02]} rotation={[0, Math.PI / 4, 0]} castShadow>
              <cylinderGeometry args={[0.115, 0.055, 0.14, 4]} />
              <meshStandardMaterial color={skinColor} roughness={0.8} />
            </mesh>

            {/* Cranium / Main Head Volume */}
            <mesh position={[0, 0.05, 0]} scale={[0.92, 1.04, 0.96]} castShadow>
              <sphereGeometry args={[0.13, 14, 12]} />
              <meshStandardMaterial color={skinColor} roughness={0.8} />
            </mesh>

            {/* Ears (L & R) */}
            {[-0.135, 0.135].map((x) => (
              <mesh key={x} position={[x, 0.03, -0.01]} rotation={[0, 0, x > 0 ? -0.15 : 0.15]}>
                <boxGeometry args={[0.02, 0.048, 0.032]} />
                <meshStandardMaterial color={skinColor} roughness={0.8} />
              </mesh>
            ))}

            {/* Angular Stylized Nose (prominent in reference image) */}
            <mesh position={[0, 0.015, 0.135]} rotation={[0.42, 0, 0]} castShadow>
              <coneGeometry args={[0.022, 0.065, 4]} />
              <meshStandardMaterial color={skinColor} roughness={0.82} />
            </mesh>

            {/* Stylized Expressive Almond Eyes & Sharp Brows */}
            {[-0.052, 0.052].map((x) => (
              <group key={x} position={[x, 0.045, 0.118]} rotation={[0, x > 0 ? 0.12 : -0.12, x > 0 ? -0.08 : 0.08]}>
                {/* Eye Pupil / Iris */}
                <mesh position={[0, 0, 0]}>
                  <boxGeometry args={[0.032, 0.022, 0.015]} />
                  <meshBasicMaterial color="#111827" />
                </mesh>
                {/* Subtle Eye White Sclera Accent */}
                <mesh position={[x > 0 ? -0.014 : 0.014, 0, -0.002]}>
                  <boxGeometry args={[0.01, 0.018, 0.012]} />
                  <meshBasicMaterial color="#f8fafc" />
                </mesh>
                {/* Sharp Stylized Eyebrow */}
                <mesh position={[0, 0.026, 0.005]} rotation={[0, 0, x > 0 ? -0.14 : 0.14]}>
                  <boxGeometry args={[0.042, 0.012, 0.018]} />
                  <meshBasicMaterial color="#111827" />
                </mesh>
              </group>
            ))}

            {/* Stylized Mouth Line */}
            <mesh position={[0, -0.052, 0.105]} rotation={[0.1, 0, 0]}>
              <boxGeometry args={[0.042, 0.007, 0.015]} />
              <meshStandardMaterial color="#6e3c20" roughness={0.9} />
            </mesh>

            {/* ── Stylized Spiky Hair (Detailed recreation from reference) ── */}
            <group position={[0, 0.04, 0]}>
              {/* Hair Base Crown Cap */}
              <mesh position={[0, 0.06, -0.02]} scale={[1.02, 0.95, 1.08]} castShadow>
                <sphereGeometry args={[0.138, 12, 10]} />
                <meshStandardMaterial color={hairColor} roughness={0.9} />
              </mesh>

              {/* Back & Side Hair Layers */}
              <mesh position={[0, 0.02, -0.07]} rotation={[-0.2, 0, 0]} castShadow>
                <boxGeometry args={[0.24, 0.15, 0.11]} />
                <meshStandardMaterial color={hairColor} roughness={0.9} />
              </mesh>

              {/* Sideburns / Temple Locks */}
              {[-0.125, 0.125].map((x) => (
                <mesh key={x} position={[x, -0.01, 0.04]} rotation={[0.2, 0, x > 0 ? -0.15 : 0.15]} castShadow>
                  <coneGeometry args={[0.035, 0.09, 4]} />
                  <meshStandardMaterial color={hairColor} roughness={0.9} />
                </mesh>
              ))}

              {/* Front Fringe / Bang Tufts */}
              {[-0.06, 0.0, 0.06].map((x, idx) => (
                <mesh
                  key={x}
                  position={[x, 0.11, 0.10]}
                  rotation={[0.55 + idx * 0.08, 0, (x / 0.06) * 0.2]}
                  castShadow
                >
                  <coneGeometry args={[0.038, 0.11, 4]} />
                  <meshStandardMaterial color={hairColor} roughness={0.9} />
                </mesh>
              ))}

              {/* Top Swept-Back Crest Spikes */}
              {[-0.05, 0.0, 0.05].map((x, idx) => (
                <mesh
                  key={x}
                  position={[x, 0.17, -0.02 + idx * 0.02]}
                  rotation={[-0.45, 0, (x / 0.05) * 0.15]}
                  castShadow
                >
                  <coneGeometry args={[0.042, 0.13, 4]} />
                  <meshStandardMaterial color={hairColor} roughness={0.9} />
                </mesh>
              ))}

              {/* Crown Center High Spikes */}
              <mesh position={[0, 0.19, 0.03]} rotation={[-0.2, 0, 0]} castShadow>
                <coneGeometry args={[0.048, 0.14, 4]} />
                <meshStandardMaterial color={hairColor} roughness={0.9} />
              </mesh>
              <mesh position={[-0.04, 0.18, 0.05]} rotation={[-0.15, 0, 0.2]} castShadow>
                <coneGeometry args={[0.038, 0.12, 4]} />
                <meshStandardMaterial color={hairColor} roughness={0.9} />
              </mesh>
              <mesh position={[0.04, 0.18, 0.05]} rotation={[-0.15, 0, -0.2]} castShadow>
                <coneGeometry args={[0.038, 0.12, 4]} />
                <meshStandardMaterial color={hairColor} roughness={0.9} />
              </mesh>
            </group>
          </group>
        </group>

        {/* ── Left Arm (Long Sleeve Hoodie + Hand) ── */}
        <group ref={armL} position={[-0.27, 1.40, 0]}>
          {/* Shoulder Sphere */}
          <mesh castShadow>
            <sphereGeometry args={[0.068, 8, 8]} />
            <meshStandardMaterial color={color} roughness={0.65} />
          </mesh>

          {/* Upper Arm Sleeve */}
          <mesh position={[-0.02, -0.15, 0]} rotation={[0, 0, 0.08]} castShadow>
            <cylinderGeometry args={[0.064, 0.058, 0.22, 10]} />
            <meshStandardMaterial color={color} roughness={0.65} />
          </mesh>

          {/* Forearm Sleeve */}
          <mesh position={[-0.035, -0.34, 0.01]} rotation={[0, 0, 0.06]} castShadow>
            <cylinderGeometry args={[0.058, 0.052, 0.20, 10]} />
            <meshStandardMaterial color={color} roughness={0.65} />
          </mesh>

          {/* Sleeve Ribbed Cuff */}
          <mesh position={[-0.042, -0.445, 0.01]} rotation={[0, 0, 0.06]} castShadow>
            <cylinderGeometry args={[0.054, 0.055, 0.042, 10]} />
            <meshStandardMaterial color={color} roughness={0.8} />
          </mesh>

          {/* Left Hand with Fingers & Thumb (Natural Pose) */}
          <group position={[-0.046, -0.52, 0.01]}>
            {/* Palm */}
            <mesh position={[0, -0.03, 0]} castShadow>
              <boxGeometry args={[0.042, 0.065, 0.024]} />
              <meshStandardMaterial color={skinColor} roughness={0.8} />
            </mesh>
            {/* Thumb */}
            <mesh position={[0.018, -0.015, 0.012]} rotation={[-0.3, 0, -0.4]} castShadow>
              <cylinderGeometry args={[0.009, 0.008, 0.038, 6]} />
              <meshStandardMaterial color={skinColor} roughness={0.8} />
            </mesh>
            {/* Four Stylized Fingers */}
            {[-0.014, -0.005, 0.005, 0.014].map((fx, fidx) => (
              <mesh
                key={fidx}
                position={[fx, -0.072 - (fidx === 1 || fidx === 2 ? 0.005 : 0), 0]}
                rotation={[0.05, 0, 0]}
                castShadow
              >
                <cylinderGeometry args={[0.006, 0.0055, 0.038, 5]} />
                <meshStandardMaterial color={skinColor} roughness={0.8} />
              </mesh>
            ))}
          </group>
        </group>

        {/* ── Right Arm (Long Sleeve Hoodie + Hand) ── */}
        <group ref={armR} position={[0.27, 1.40, 0]}>
          {/* Shoulder Sphere */}
          <mesh castShadow>
            <sphereGeometry args={[0.068, 8, 8]} />
            <meshStandardMaterial color={color} roughness={0.65} />
          </mesh>

          {/* Upper Arm Sleeve */}
          <mesh position={[0.02, -0.15, 0]} rotation={[0, 0, -0.08]} castShadow>
            <cylinderGeometry args={[0.064, 0.058, 0.22, 10]} />
            <meshStandardMaterial color={color} roughness={0.65} />
          </mesh>

          {/* Forearm Sleeve */}
          <mesh position={[0.035, -0.34, 0.01]} rotation={[0, 0, -0.06]} castShadow>
            <cylinderGeometry args={[0.058, 0.052, 0.20, 10]} />
            <meshStandardMaterial color={color} roughness={0.65} />
          </mesh>

          {/* Sleeve Ribbed Cuff */}
          <mesh position={[0.042, -0.445, 0.01]} rotation={[0, 0, -0.06]} castShadow>
            <cylinderGeometry args={[0.054, 0.055, 0.042, 10]} />
            <meshStandardMaterial color={color} roughness={0.8} />
          </mesh>

          {/* Right Hand with Fingers & Thumb (Natural Pose) */}
          <group position={[0.046, -0.52, 0.01]}>
            {/* Palm */}
            <mesh position={[0, -0.03, 0]} castShadow>
              <boxGeometry args={[0.042, 0.065, 0.024]} />
              <meshStandardMaterial color={skinColor} roughness={0.8} />
            </mesh>
            {/* Thumb */}
            <mesh position={[-0.018, -0.015, 0.012]} rotation={[-0.3, 0, 0.4]} castShadow>
              <cylinderGeometry args={[0.009, 0.008, 0.038, 6]} />
              <meshStandardMaterial color={skinColor} roughness={0.8} />
            </mesh>
            {/* Four Stylized Fingers */}
            {[-0.014, -0.005, 0.005, 0.014].map((fx, fidx) => (
              <mesh
                key={fidx}
                position={[fx, -0.072 - (fidx === 1 || fidx === 2 ? 0.005 : 0), 0]}
                rotation={[0.05, 0, 0]}
                castShadow
              >
                <cylinderGeometry args={[0.006, 0.0055, 0.038, 5]} />
                <meshStandardMaterial color={skinColor} roughness={0.8} />
              </mesh>
            ))}
          </group>
        </group>

        {/* ── Left Leg (Navy Shorts, Bare Leg, Ankle Sock, Sneaker) ── */}
        <group ref={legL} position={[-0.12, 0.78, 0]}>
          {/* Navy Shorts Upper Thigh */}
          <mesh position={[0, -0.10, 0]} castShadow>
            <cylinderGeometry args={[0.098, 0.092, 0.22, 12]} />
            <meshStandardMaterial color={pantsColor} roughness={0.7} />
          </mesh>

          {/* Shorts Hem Cuff (above knee) */}
          <mesh position={[0, -0.21, 0]} castShadow>
            <cylinderGeometry args={[0.095, 0.096, 0.04, 12]} />
            <meshStandardMaterial color={pantsColor} roughness={0.85} />
          </mesh>

          {/* Bare Thigh & Knee (exposed skin from reference) */}
          <mesh position={[0, -0.28, 0]} castShadow>
            <cylinderGeometry args={[0.072, 0.064, 0.15, 10]} />
            <meshStandardMaterial color={skinColor} roughness={0.8} />
          </mesh>
          <mesh position={[0, -0.36, 0.008]} castShadow>
            <sphereGeometry args={[0.058, 8, 8]} />
            <meshStandardMaterial color={skinColor} roughness={0.8} />
          </mesh>

          {/* Contoured Calf & Shin */}
          <mesh position={[0, -0.52, -0.005]} castShadow>
            <cylinderGeometry args={[0.058, 0.046, 0.24, 10]} />
            <meshStandardMaterial color={skinColor} roughness={0.8} />
          </mesh>

          {/* White Ankle Sock */}
          <mesh position={[0, -0.66, 0]} castShadow>
            <cylinderGeometry args={[0.048, 0.048, 0.07, 10]} />
            <meshStandardMaterial color="#ffffff" roughness={0.5} />
          </mesh>

          {/* Stylized Low-Cut Athletic Sneaker */}
          <group position={[0, -0.73, 0.03]}>
            {/* Sneaker Upper (Teal / Player Color) */}
            <mesh position={[0, 0.03, 0.02]} castShadow>
              <boxGeometry args={[0.11, 0.065, 0.22]} />
              <meshStandardMaterial color={finalShoeColor} roughness={0.55} />
            </mesh>
            {/* Rounded Toe Cap */}
            <mesh position={[0, 0.02, 0.12]} scale={[1, 0.85, 1]} castShadow>
              <cylinderGeometry args={[0.052, 0.054, 0.06, 10]} />
              <meshStandardMaterial color={finalShoeColor} roughness={0.55} />
            </mesh>
            {/* White Ankle Collar Rim */}
            <mesh position={[0, 0.062, -0.03]}>
              <boxGeometry args={[0.098, 0.015, 0.10]} />
              <meshStandardMaterial color="#ffffff" roughness={0.4} />
            </mesh>
            {/* White Laces Accent */}
            <mesh position={[0, 0.064, 0.04]}>
              <boxGeometry args={[0.045, 0.008, 0.06]} />
              <meshStandardMaterial color="#ffffff" roughness={0.4} />
            </mesh>
            {/* Crisp Thick White Rubber Cupsole (Ground Contact) */}
            <mesh position={[0, -0.016, 0.028]} castShadow>
              <boxGeometry args={[0.118, 0.032, 0.24]} />
              <meshStandardMaterial color="#ffffff" roughness={0.35} />
            </mesh>
          </group>
        </group>

        {/* ── Right Leg (Navy Shorts, Bare Leg, Ankle Sock, Sneaker) ── */}
        <group ref={legR} position={[0.12, 0.78, 0]}>
          {/* Navy Shorts Upper Thigh */}
          <mesh position={[0, -0.10, 0]} castShadow>
            <cylinderGeometry args={[0.098, 0.092, 0.22, 12]} />
            <meshStandardMaterial color={pantsColor} roughness={0.7} />
          </mesh>

          {/* Shorts Hem Cuff (above knee) */}
          <mesh position={[0, -0.21, 0]} castShadow>
            <cylinderGeometry args={[0.095, 0.096, 0.04, 12]} />
            <meshStandardMaterial color={pantsColor} roughness={0.85} />
          </mesh>

          {/* Bare Thigh & Knee (exposed skin from reference) */}
          <mesh position={[0, -0.28, 0]} castShadow>
            <cylinderGeometry args={[0.072, 0.064, 0.15, 10]} />
            <meshStandardMaterial color={skinColor} roughness={0.8} />
          </mesh>
          <mesh position={[0, -0.36, 0.008]} castShadow>
            <sphereGeometry args={[0.058, 8, 8]} />
            <meshStandardMaterial color={skinColor} roughness={0.8} />
          </mesh>

          {/* Contoured Calf & Shin */}
          <mesh position={[0, -0.52, -0.005]} castShadow>
            <cylinderGeometry args={[0.058, 0.046, 0.24, 10]} />
            <meshStandardMaterial color={skinColor} roughness={0.8} />
          </mesh>

          {/* White Ankle Sock */}
          <mesh position={[0, -0.66, 0]} castShadow>
            <cylinderGeometry args={[0.048, 0.048, 0.07, 10]} />
            <meshStandardMaterial color="#ffffff" roughness={0.5} />
          </mesh>

          {/* Stylized Low-Cut Athletic Sneaker */}
          <group position={[0, -0.73, 0.03]}>
            {/* Sneaker Upper (Teal / Player Color) */}
            <mesh position={[0, 0.03, 0.02]} castShadow>
              <boxGeometry args={[0.11, 0.065, 0.22]} />
              <meshStandardMaterial color={finalShoeColor} roughness={0.55} />
            </mesh>
            {/* Rounded Toe Cap */}
            <mesh position={[0, 0.02, 0.12]} scale={[1, 0.85, 1]} castShadow>
              <cylinderGeometry args={[0.052, 0.054, 0.06, 10]} />
              <meshStandardMaterial color={finalShoeColor} roughness={0.55} />
            </mesh>
            {/* White Ankle Collar Rim */}
            <mesh position={[0, 0.062, -0.03]}>
              <boxGeometry args={[0.098, 0.015, 0.10]} />
              <meshStandardMaterial color="#ffffff" roughness={0.4} />
            </mesh>
            {/* White Laces Accent */}
            <mesh position={[0, 0.064, 0.04]}>
              <boxGeometry args={[0.045, 0.008, 0.06]} />
              <meshStandardMaterial color="#ffffff" roughness={0.4} />
            </mesh>
            {/* Crisp Thick White Rubber Cupsole (Ground Contact) */}
            <mesh position={[0, -0.016, 0.028]} castShadow>
              <boxGeometry args={[0.118, 0.032, 0.24]} />
              <meshStandardMaterial color="#ffffff" roughness={0.35} />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );
}
