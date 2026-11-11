'use client';
import * as THREE from 'three';
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Layout } from '@/lib/layout';
import { CityTrafficSystem, VehicleAgent, CarDef } from '@/lib/traffic';

// ── Shared Materials ──────────────────────────────────────────────────────────
const SHARED_TIRE_MAT = new THREE.MeshStandardMaterial({
  color: '#18181b',
  roughness: 0.85,
  metalness: 0.05,
});

const SHARED_RIM_MAT = new THREE.MeshStandardMaterial({
  color: '#334155',
  roughness: 0.35,
  metalness: 0.75,
});

const SHARED_RIM_ACCENT_MAT = new THREE.MeshStandardMaterial({
  color: '#64748b',
  roughness: 0.25,
  metalness: 0.85,
});

const SHARED_WINDOW_MAT = new THREE.MeshStandardMaterial({
  color: '#0b1320',
  roughness: 0.08,
  metalness: 0.9,
  transparent: true,
  opacity: 0.94,
});

const SHARED_HEADLIGHT_MAT = new THREE.MeshStandardMaterial({
  color: '#ffffff',
  emissive: '#ffffff',
  emissiveIntensity: 1.4,
  roughness: 0.1,
});

const SHARED_CHROME_MAT = new THREE.MeshStandardMaterial({
  color: '#f1f5f9',
  roughness: 0.12,
  metalness: 0.96,
});

const SHARED_DARK_TRIM_MAT = new THREE.MeshStandardMaterial({
  color: '#0f172a',
  roughness: 0.65,
  metalness: 0.2,
});

const SHARED_GRILLE_MAT = new THREE.MeshStandardMaterial({
  color: '#050810',
  roughness: 0.9,
  metalness: 0.1,
});

const SHARED_AMBER_MAT = new THREE.MeshStandardMaterial({
  color: '#f59e0b',
  emissive: '#f59e0b',
  emissiveIntensity: 0.8,
  roughness: 0.2,
});

// ── Shared Geometries ─────────────────────────────────────────────────────────
const GEO_BOX = new THREE.BoxGeometry(1, 1, 1);
const GEO_CYL = new THREE.CylinderGeometry(1, 1, 1, 16);

// ── Low-Poly Wheel Component ──────────────────────────────────────────────────
interface WheelProps {
  radius: number;
  width?: number;
  isFront?: boolean;
  steerRef?: React.RefObject<THREE.Group | null>;
  spinRef?: React.RefObject<THREE.Group | null>;
  position: [number, number, number];
  isRightSide?: boolean;
}

function CarWheel({
  radius,
  width = 0.24,
  steerRef,
  spinRef,
  position,
  isRightSide = false,
}: WheelProps) {
  const rimRadius = radius * 0.68;
  const hubRadius = radius * 0.32;

  return (
    <group position={position} ref={steerRef}>
      <group ref={spinRef}>
        {/* Outer Rubber Tyre */}
        <mesh
          geometry={GEO_CYL}
          material={SHARED_TIRE_MAT}
          scale={[radius, width, radius]}
          rotation={[0, 0, Math.PI / 2]}
          castShadow
        />
        {/* Dark Alloy Rim */}
        <mesh
          geometry={GEO_CYL}
          material={SHARED_RIM_MAT}
          scale={[rimRadius, width + 0.015, rimRadius]}
          rotation={[0, 0, Math.PI / 2]}
        />
        {/* Center Hub & Spoke Accents */}
        <mesh
          geometry={GEO_CYL}
          material={SHARED_RIM_ACCENT_MAT}
          scale={[hubRadius, width + 0.03, hubRadius]}
          rotation={[0, 0, Math.PI / 2]}
        />
        {/* Spoke details on outer face */}
        <mesh
          geometry={GEO_BOX}
          material={SHARED_RIM_ACCENT_MAT}
          scale={[rimRadius * 1.6, rimRadius * 0.25, width + 0.02]}
          position={[0, 0, isRightSide ? 0.01 : -0.01]}
          rotation={[Math.PI / 4, 0, 0]}
        />
        <mesh
          geometry={GEO_BOX}
          material={SHARED_RIM_ACCENT_MAT}
          scale={[rimRadius * 1.6, rimRadius * 0.25, width + 0.02]}
          position={[0, 0, isRightSide ? 0.01 : -0.01]}
          rotation={[-Math.PI / 4, 0, 0]}
        />
      </group>
    </group>
  );
}

// ── 1. Red Compact Sedan ──────────────────────────────────────────────────────
function RedSedanBody({
  paintMat,
  brakeMat,
}: {
  paintMat: THREE.Material;
  brakeMat: THREE.Material;
}) {
  return (
    <group>
      {/* Lower Chassis / Rocker skirts */}
      <mesh
        geometry={GEO_BOX}
        material={SHARED_DARK_TRIM_MAT}
        scale={[1.72, 0.16, 4.1]}
        position={[0, 0.3, 0]}
      />

      {/* Main Lower Body: Hood, Cabin Base, Trunk */}
      <mesh
        geometry={GEO_BOX}
        material={paintMat}
        scale={[1.78, 0.44, 4.2]}
        position={[0, 0.54, 0]}
        castShadow
      />

      {/* Hood Slope Accent */}
      <mesh
        geometry={GEO_BOX}
        material={paintMat}
        scale={[1.68, 0.1, 1.4]}
        position={[0, 0.74, 1.25]}
        rotation={[-0.06, 0, 0]}
      />

      {/* Trunk Deck */}
      <mesh
        geometry={GEO_BOX}
        material={paintMat}
        scale={[1.68, 0.12, 1.05]}
        position={[0, 0.72, -1.45]}
      />

      {/* Cabin Greenhouse Pillars & Roof */}
      <mesh
        geometry={GEO_BOX}
        material={paintMat}
        scale={[1.52, 0.55, 1.85]}
        position={[0, 1.05, -0.15]}
        castShadow
      />

      {/* Dark Tinted Glass - Main Block */}
      <mesh
        geometry={GEO_BOX}
        material={SHARED_WINDOW_MAT}
        scale={[1.56, 0.46, 1.76]}
        position={[0, 1.02, -0.15]}
      />

      {/* Slanted Windshield Glass */}
      <mesh
        geometry={GEO_BOX}
        material={SHARED_WINDOW_MAT}
        scale={[1.48, 0.46, 0.7]}
        position={[0, 0.98, 0.82]}
        rotation={[-0.48, 0, 0]}
      />

      {/* Slanted Rear Glass */}
      <mesh
        geometry={GEO_BOX}
        material={SHARED_WINDOW_MAT}
        scale={[1.48, 0.44, 0.65]}
        position={[0, 0.98, -1.1]}
        rotation={[0.45, 0, 0]}
      />

      {/* Front Grille */}
      <mesh
        geometry={GEO_BOX}
        material={SHARED_GRILLE_MAT}
        scale={[1.05, 0.16, 0.08]}
        position={[0, 0.52, 2.12]}
      />

      {/* Headlights (Clean white emissive) */}
      <mesh
        geometry={GEO_BOX}
        material={SHARED_HEADLIGHT_MAT}
        scale={[0.34, 0.12, 0.08]}
        position={[-0.66, 0.57, 2.11]}
      />
      <mesh
        geometry={GEO_BOX}
        material={SHARED_HEADLIGHT_MAT}
        scale={[0.34, 0.12, 0.08]}
        position={[0.66, 0.57, 2.11]}
      />

      {/* Front Lower Bumper Air Intake */}
      <mesh
        geometry={GEO_BOX}
        material={SHARED_GRILLE_MAT}
        scale={[1.3, 0.14, 0.1]}
        position={[0, 0.35, 2.12]}
      />

      {/* Taillights (Red emissive) */}
      <mesh
        geometry={GEO_BOX}
        material={brakeMat}
        scale={[0.38, 0.12, 0.08]}
        position={[-0.65, 0.62, -2.12]}
      />
      <mesh
        geometry={GEO_BOX}
        material={brakeMat}
        scale={[0.38, 0.12, 0.08]}
        position={[0.65, 0.62, -2.12]}
      />

      {/* Side Mirrors */}
      <mesh
        geometry={GEO_BOX}
        material={paintMat}
        scale={[0.16, 0.1, 0.14]}
        position={[-0.92, 0.85, 0.52]}
      />
      <mesh
        geometry={GEO_BOX}
        material={paintMat}
        scale={[0.16, 0.1, 0.14]}
        position={[0.92, 0.85, 0.52]}
      />
    </group>
  );
}

// ── 2. Blue Modern Hatchback ──────────────────────────────────────────────────
function BlueHatchbackBody({
  paintMat,
  brakeMat,
}: {
  paintMat: THREE.Material;
  brakeMat: THREE.Material;
}) {
  return (
    <group>
      {/* Lower chassis */}
      <mesh
        geometry={GEO_BOX}
        material={SHARED_DARK_TRIM_MAT}
        scale={[1.68, 0.16, 3.8]}
        position={[0, 0.3, 0]}
      />

      {/* Main Body */}
      <mesh
        geometry={GEO_BOX}
        material={paintMat}
        scale={[1.74, 0.48, 3.9]}
        position={[0, 0.56, 0]}
        castShadow
      />

      {/* Sloping Front Hood */}
      <mesh
        geometry={GEO_BOX}
        material={paintMat}
        scale={[1.64, 0.22, 1.2]}
        position={[0, 0.72, 1.15]}
        rotation={[-0.14, 0, 0]}
      />

      {/* Rounded Hatch Cabin */}
      <mesh
        geometry={GEO_BOX}
        material={paintMat}
        scale={[1.5, 0.62, 2.1]}
        position={[0, 1.12, -0.22]}
        castShadow
      />

      {/* Tinted Cabin Windows */}
      <mesh
        geometry={GEO_BOX}
        material={SHARED_WINDOW_MAT}
        scale={[1.54, 0.5, 1.95]}
        position={[0, 1.08, -0.22]}
      />

      {/* Raked Windshield */}
      <mesh
        geometry={GEO_BOX}
        material={SHARED_WINDOW_MAT}
        scale={[1.44, 0.52, 0.65]}
        position={[0, 1.02, 0.8]}
        rotation={[-0.52, 0, 0]}
      />

      {/* Sloping Hatchback Rear Window */}
      <mesh
        geometry={GEO_BOX}
        material={SHARED_WINDOW_MAT}
        scale={[1.44, 0.56, 0.7]}
        position={[0, 1.06, -1.2]}
        rotation={[0.55, 0, 0]}
      />

      {/* Oval Headlights */}
      <mesh
        geometry={GEO_BOX}
        material={SHARED_HEADLIGHT_MAT}
        scale={[0.3, 0.18, 0.08]}
        position={[-0.6, 0.62, 1.96]}
        rotation={[-0.1, 0, -0.1]}
      />
      <mesh
        geometry={GEO_BOX}
        material={SHARED_HEADLIGHT_MAT}
        scale={[0.3, 0.18, 0.08]}
        position={[0.6, 0.62, 1.96]}
        rotation={[-0.1, 0, 0.1]}
      />

      {/* Compact Grille */}
      <mesh
        geometry={GEO_BOX}
        material={SHARED_GRILLE_MAT}
        scale={[0.75, 0.14, 0.06]}
        position={[0, 0.52, 1.97]}
      />

      {/* Vertical Rear Taillights on Pillars */}
      <mesh
        geometry={GEO_BOX}
        material={brakeMat}
        scale={[0.12, 0.36, 0.08]}
        position={[-0.72, 0.92, -1.68]}
      />
      <mesh
        geometry={GEO_BOX}
        material={brakeMat}
        scale={[0.12, 0.36, 0.08]}
        position={[0.72, 0.92, -1.68]}
      />

      {/* Side Mirrors */}
      <mesh
        geometry={GEO_BOX}
        material={paintMat}
        scale={[0.15, 0.1, 0.14]}
        position={[-0.88, 0.88, 0.42]}
      />
      <mesh
        geometry={GEO_BOX}
        material={paintMat}
        scale={[0.15, 0.1, 0.14]}
        position={[0.88, 0.88, 0.42]}
      />
    </group>
  );
}

// ── 3. Yellow Sporty Coupe ────────────────────────────────────────────────────
function YellowCoupeBody({
  paintMat,
  brakeMat,
}: {
  paintMat: THREE.Material;
  brakeMat: THREE.Material;
}) {
  return (
    <group>
      {/* Low Ground Aerodynamic Underbody */}
      <mesh
        geometry={GEO_BOX}
        material={SHARED_DARK_TRIM_MAT}
        scale={[1.78, 0.14, 4.3]}
        position={[0, 0.28, 0]}
      />

      {/* Low-slung Main Body */}
      <mesh
        geometry={GEO_BOX}
        material={paintMat}
        scale={[1.84, 0.4, 4.35]}
        position={[0, 0.5, 0]}
        castShadow
      />

      {/* Sculpted Low Aerodynamic Hood */}
      <mesh
        geometry={GEO_BOX}
        material={paintMat}
        scale={[1.74, 0.16, 1.6]}
        position={[0, 0.66, 1.25]}
        rotation={[-0.08, 0, 0]}
      />

      {/* Fastback Cabin */}
      <mesh
        geometry={GEO_BOX}
        material={paintMat}
        scale={[1.48, 0.46, 1.7]}
        position={[0, 0.92, -0.15]}
        castShadow
      />

      {/* Heavily Raked Tinted Windshield */}
      <mesh
        geometry={GEO_BOX}
        material={SHARED_WINDOW_MAT}
        scale={[1.44, 0.44, 0.85]}
        position={[0, 0.86, 0.72]}
        rotation={[-0.58, 0, 0]}
      />

      {/* Side Tinted Windows */}
      <mesh
        geometry={GEO_BOX}
        material={SHARED_WINDOW_MAT}
        scale={[1.52, 0.38, 1.4]}
        position={[0, 0.88, -0.1]}
      />

      {/* Sloping Fastback Rear Glass */}
      <mesh
        geometry={GEO_BOX}
        material={SHARED_WINDOW_MAT}
        scale={[1.42, 0.42, 0.95]}
        position={[0, 0.84, -1.05]}
        rotation={[0.58, 0, 0]}
      />

      {/* Rear Trunk Lip / Integrated Ducktail Spoiler */}
      <mesh
        geometry={GEO_BOX}
        material={paintMat}
        scale={[1.7, 0.1, 0.3]}
        position={[0, 0.7, -2.12]}
      />

      {/* Aggressive Wide Front Grille */}
      <mesh
        geometry={GEO_BOX}
        material={SHARED_GRILLE_MAT}
        scale={[1.25, 0.2, 0.08]}
        position={[0, 0.42, 2.18]}
      />

      {/* Slim Sharp Headlights */}
      <mesh
        geometry={GEO_BOX}
        material={SHARED_HEADLIGHT_MAT}
        scale={[0.36, 0.1, 0.08]}
        position={[-0.7, 0.54, 2.17]}
        rotation={[0, -0.1, -0.05]}
      />
      <mesh
        geometry={GEO_BOX}
        material={SHARED_HEADLIGHT_MAT}
        scale={[0.36, 0.1, 0.08]}
        position={[0.7, 0.54, 2.17]}
        rotation={[0, 0.1, 0.05]}
      />

      {/* Rear Full-width LED Light Bar */}
      <mesh
        geometry={GEO_BOX}
        material={brakeMat}
        scale={[1.55, 0.09, 0.08]}
        position={[0, 0.62, -2.18]}
      />

      {/* Rear Dark Diffuser */}
      <mesh
        geometry={GEO_BOX}
        material={SHARED_DARK_TRIM_MAT}
        scale={[1.35, 0.14, 0.2]}
        position={[0, 0.32, -2.14]}
      />

      {/* Sleek Aerodynamic Side Mirrors */}
      <mesh
        geometry={GEO_BOX}
        material={paintMat}
        scale={[0.18, 0.08, 0.12]}
        position={[-0.94, 0.78, 0.48]}
      />
      <mesh
        geometry={GEO_BOX}
        material={paintMat}
        scale={[0.18, 0.08, 0.12]}
        position={[0.94, 0.78, 0.48]}
      />
    </group>
  );
}

// ── 4. Green Compact SUV ──────────────────────────────────────────────────────
function GreenSUVBody({
  paintMat,
  brakeMat,
}: {
  paintMat: THREE.Material;
  brakeMat: THREE.Material;
}) {
  return (
    <group>
      {/* Heavy Black Wheel Arch Cladding & Lower Rockers */}
      <mesh
        geometry={GEO_BOX}
        material={SHARED_DARK_TRIM_MAT}
        scale={[1.82, 0.26, 4.2]}
        position={[0, 0.38, 0]}
      />

      {/* Front Skid Plate Accent */}
      <mesh
        geometry={GEO_BOX}
        material={SHARED_CHROME_MAT}
        scale={[0.9, 0.14, 0.12]}
        position={[0, 0.34, 2.12]}
      />

      {/* Main Robust SUV Body */}
      <mesh
        geometry={GEO_BOX}
        material={paintMat}
        scale={[1.82, 0.54, 4.15]}
        position={[0, 0.72, 0]}
        castShadow
      />

      {/* Tall Spacious Cabin */}
      <mesh
        geometry={GEO_BOX}
        material={paintMat}
        scale={[1.66, 0.66, 2.3]}
        position={[0, 1.28, -0.2]}
        castShadow
      />

      {/* Tinted Panoramic Side Windows */}
      <mesh
        geometry={GEO_BOX}
        material={SHARED_WINDOW_MAT}
        scale={[1.7, 0.54, 2.15]}
        position={[0, 1.26, -0.2]}
      />

      {/* Upright Front Windshield */}
      <mesh
        geometry={GEO_BOX}
        material={SHARED_WINDOW_MAT}
        scale={[1.58, 0.54, 0.6]}
        position={[0, 1.2, 0.95]}
        rotation={[-0.42, 0, 0]}
      />

      {/* Upright Rear Cargo Window */}
      <mesh
        geometry={GEO_BOX}
        material={SHARED_WINDOW_MAT}
        scale={[1.58, 0.52, 0.5]}
        position={[0, 1.24, -1.36]}
        rotation={[0.25, 0, 0]}
      />

      {/* Roof Rails (Black Bars along roof) */}
      <mesh
        geometry={GEO_BOX}
        material={SHARED_DARK_TRIM_MAT}
        scale={[0.08, 0.08, 2.2]}
        position={[-0.68, 1.66, -0.2]}
      />
      <mesh
        geometry={GEO_BOX}
        material={SHARED_DARK_TRIM_MAT}
        scale={[0.08, 0.08, 2.2]}
        position={[0.68, 1.66, -0.2]}
      />
      {/* Crossbar mounts */}
      <mesh
        geometry={GEO_BOX}
        material={SHARED_DARK_TRIM_MAT}
        scale={[0.1, 0.12, 0.1]}
        position={[-0.68, 1.62, 0.7]}
      />
      <mesh
        geometry={GEO_BOX}
        material={SHARED_DARK_TRIM_MAT}
        scale={[0.1, 0.12, 0.1]}
        position={[-0.68, 1.62, -1.1]}
      />
      <mesh
        geometry={GEO_BOX}
        material={SHARED_DARK_TRIM_MAT}
        scale={[0.1, 0.12, 0.1]}
        position={[0.68, 1.62, 0.7]}
      />
      <mesh
        geometry={GEO_BOX}
        material={SHARED_DARK_TRIM_MAT}
        scale={[0.1, 0.12, 0.1]}
        position={[0.68, 1.62, -1.1]}
      />

      {/* Rugged Front Grille */}
      <mesh
        geometry={GEO_BOX}
        material={SHARED_GRILLE_MAT}
        scale={[1.1, 0.24, 0.08]}
        position={[0, 0.72, 2.09]}
      />

      {/* Square Headlights with Amber Indicator Accents */}
      <mesh
        geometry={GEO_BOX}
        material={SHARED_HEADLIGHT_MAT}
        scale={[0.34, 0.2, 0.08]}
        position={[-0.68, 0.74, 2.08]}
      />
      <mesh
        geometry={GEO_BOX}
        material={SHARED_AMBER_MAT}
        scale={[0.1, 0.2, 0.08]}
        position={[-0.86, 0.74, 2.07]}
      />
      <mesh
        geometry={GEO_BOX}
        material={SHARED_HEADLIGHT_MAT}
        scale={[0.34, 0.2, 0.08]}
        position={[0.68, 0.74, 2.08]}
      />
      <mesh
        geometry={GEO_BOX}
        material={SHARED_AMBER_MAT}
        scale={[0.1, 0.2, 0.08]}
        position={[0.86, 0.74, 2.07]}
      />

      {/* Vertical Robust Taillights */}
      <mesh
        geometry={GEO_BOX}
        material={brakeMat}
        scale={[0.16, 0.42, 0.08]}
        position={[-0.78, 1.05, -2.08]}
      />
      <mesh
        geometry={GEO_BOX}
        material={brakeMat}
        scale={[0.16, 0.42, 0.08]}
        position={[0.78, 1.05, -2.08]}
      />

      {/* Sturdy SUV Mirrors */}
      <mesh
        geometry={GEO_BOX}
        material={paintMat}
        scale={[0.18, 0.14, 0.16]}
        position={[-0.96, 1.05, 0.6]}
      />
      <mesh
        geometry={GEO_BOX}
        material={paintMat}
        scale={[0.18, 0.14, 0.16]}
        position={[0.96, 1.05, 0.6]}
      />
    </group>
  );
}

// ── 5. Orange Retro-Style Compact Car ─────────────────────────────────────────
function OrangeRetroBody({
  paintMat,
  brakeMat,
}: {
  paintMat: THREE.Material;
  brakeMat: THREE.Material;
}) {
  return (
    <group>
      {/* Classic Lower Chassis */}
      <mesh
        geometry={GEO_BOX}
        material={SHARED_DARK_TRIM_MAT}
        scale={[1.62, 0.16, 3.8]}
        position={[0, 0.3, 0]}
      />

      {/* Main Vintage Boxy Body */}
      <mesh
        geometry={GEO_BOX}
        material={paintMat}
        scale={[1.7, 0.46, 3.9]}
        position={[0, 0.56, 0]}
        castShadow
      />

      {/* Classic Stepped Hood */}
      <mesh
        geometry={GEO_BOX}
        material={paintMat}
        scale={[1.58, 0.12, 1.25]}
        position={[0, 0.75, 1.15]}
      />

      {/* Upright Vintage Greenhouse / Cabin */}
      <mesh
        geometry={GEO_BOX}
        material={paintMat}
        scale={[1.48, 0.58, 1.7]}
        position={[0, 1.06, -0.15]}
        castShadow
      />

      {/* Vintage Tinted Windows */}
      <mesh
        geometry={GEO_BOX}
        material={SHARED_WINDOW_MAT}
        scale={[1.52, 0.48, 1.58]}
        position={[0, 1.04, -0.15]}
      />

      {/* Upright Front Glass with Chrome Trim */}
      <mesh
        geometry={GEO_BOX}
        material={SHARED_WINDOW_MAT}
        scale={[1.42, 0.46, 0.5]}
        position={[0, 1.0, 0.72]}
        rotation={[-0.32, 0, 0]}
      />

      {/* Upright Rear Glass */}
      <mesh
        geometry={GEO_BOX}
        material={SHARED_WINDOW_MAT}
        scale={[1.42, 0.46, 0.5]}
        position={[0, 1.0, -1.02]}
        rotation={[0.3, 0, 0]}
      />

      {/* Classic Chrome Bumpers (Front & Rear protruding bars) */}
      <mesh
        geometry={GEO_BOX}
        material={SHARED_CHROME_MAT}
        scale={[1.68, 0.12, 0.12]}
        position={[0, 0.38, 2.02]}
      />
      <mesh
        geometry={GEO_BOX}
        material={SHARED_CHROME_MAT}
        scale={[1.68, 0.12, 0.12]}
        position={[0, 0.38, -2.02]}
      />

      {/* Chrome Bumper Overriders */}
      <mesh
        geometry={GEO_BOX}
        material={SHARED_CHROME_MAT}
        scale={[0.1, 0.22, 0.14]}
        position={[-0.5, 0.42, 2.03]}
      />
      <mesh
        geometry={GEO_BOX}
        material={SHARED_CHROME_MAT}
        scale={[0.1, 0.22, 0.14]}
        position={[0.5, 0.42, 2.03]}
      />

      {/* Prominent Round Vintage Headlights with Chrome Rings */}
      <mesh
        geometry={GEO_CYL}
        material={SHARED_CHROME_MAT}
        scale={[0.2, 0.08, 0.2]}
        position={[-0.6, 0.6, 1.96]}
        rotation={[Math.PI / 2, 0, 0]}
      />
      <mesh
        geometry={GEO_CYL}
        material={SHARED_HEADLIGHT_MAT}
        scale={[0.16, 0.09, 0.16]}
        position={[-0.6, 0.6, 1.97]}
        rotation={[Math.PI / 2, 0, 0]}
      />
      <mesh
        geometry={GEO_CYL}
        material={SHARED_CHROME_MAT}
        scale={[0.2, 0.08, 0.2]}
        position={[0.6, 0.6, 1.96]}
        rotation={[Math.PI / 2, 0, 0]}
      />
      <mesh
        geometry={GEO_CYL}
        material={SHARED_HEADLIGHT_MAT}
        scale={[0.16, 0.09, 0.16]}
        position={[0.6, 0.6, 1.97]}
        rotation={[Math.PI / 2, 0, 0]}
      />

      {/* Horizontal Slatted Vintage Chrome Grille */}
      <mesh
        geometry={GEO_BOX}
        material={SHARED_GRILLE_MAT}
        scale={[0.88, 0.22, 0.06]}
        position={[0, 0.58, 1.96]}
      />
      <mesh
        geometry={GEO_BOX}
        material={SHARED_CHROME_MAT}
        scale={[0.84, 0.03, 0.07]}
        position={[0, 0.62, 1.97]}
      />
      <mesh
        geometry={GEO_BOX}
        material={SHARED_CHROME_MAT}
        scale={[0.84, 0.03, 0.07]}
        position={[0, 0.54, 1.97]}
      />

      {/* Retro Square Taillights */}
      <mesh
        geometry={GEO_BOX}
        material={brakeMat}
        scale={[0.2, 0.2, 0.08]}
        position={[-0.62, 0.64, -1.96]}
      />
      <mesh
        geometry={GEO_BOX}
        material={brakeMat}
        scale={[0.2, 0.2, 0.08]}
        position={[0.62, 0.64, -1.96]}
      />

      {/* Classic Round Chrome Side Mirrors */}
      <mesh
        geometry={GEO_CYL}
        material={SHARED_CHROME_MAT}
        scale={[0.08, 0.04, 0.08]}
        position={[-0.88, 0.88, 0.5]}
        rotation={[0, 0, Math.PI / 2]}
      />
      <mesh
        geometry={GEO_CYL}
        material={SHARED_CHROME_MAT}
        scale={[0.08, 0.04, 0.08]}
        position={[0.88, 0.88, 0.5]}
        rotation={[0, 0, Math.PI / 2]}
      />
    </group>
  );
}

// ── 6. Purple Modern Sports Coupe / Supercar ──────────────────────────────────
function PurpleSupercarBody({
  paintMat,
  brakeMat,
}: {
  paintMat: THREE.Material;
  brakeMat: THREE.Material;
}) {
  return (
    <group>
      {/* Low-profile racing floor & side splitters */}
      <mesh
        geometry={GEO_BOX}
        material={SHARED_DARK_TRIM_MAT}
        scale={[1.88, 0.12, 4.5]}
        position={[0, 0.24, 0]}
      />

      {/* Ultra-low aerodynamic body wedge */}
      <mesh
        geometry={GEO_BOX}
        material={paintMat}
        scale={[1.92, 0.36, 4.55]}
        position={[0, 0.44, 0]}
        castShadow
      />

      {/* Sloping Front Aerodynamic Nose */}
      <mesh
        geometry={GEO_BOX}
        material={paintMat}
        scale={[1.78, 0.2, 1.7]}
        position={[0, 0.54, 1.3]}
        rotation={[-0.12, 0, 0]}
      />

      {/* Front Dual Air Inlets */}
      <mesh
        geometry={GEO_BOX}
        material={SHARED_GRILLE_MAT}
        scale={[0.6, 0.16, 0.1]}
        position={[-0.55, 0.36, 2.26]}
      />
      <mesh
        geometry={GEO_BOX}
        material={SHARED_GRILLE_MAT}
        scale={[0.6, 0.16, 0.1]}
        position={[0.55, 0.36, 2.26]}
      />

      {/* Aggressive Chevron / Arrow Headlights */}
      <mesh
        geometry={GEO_BOX}
        material={SHARED_HEADLIGHT_MAT}
        scale={[0.38, 0.08, 0.14]}
        position={[-0.68, 0.48, 2.18]}
        rotation={[0, -0.22, -0.1]}
      />
      <mesh
        geometry={GEO_BOX}
        material={SHARED_HEADLIGHT_MAT}
        scale={[0.38, 0.08, 0.14]}
        position={[0.68, 0.48, 2.18]}
        rotation={[0, 0.22, 0.1]}
      />

      {/* Low Curved Canopy Cockpit */}
      <mesh
        geometry={GEO_BOX}
        material={paintMat}
        scale={[1.44, 0.42, 1.6]}
        position={[0, 0.8, -0.1]}
        castShadow
      />

      {/* Tinted Panoramic Jet Cockpit Glass */}
      <mesh
        geometry={GEO_BOX}
        material={SHARED_WINDOW_MAT}
        scale={[1.4, 0.4, 1.52]}
        position={[0, 0.8, -0.1]}
      />

      {/* Extreme Raked Front Windshield */}
      <mesh
        geometry={GEO_BOX}
        material={SHARED_WINDOW_MAT}
        scale={[1.36, 0.42, 0.95]}
        position={[0, 0.74, 0.78]}
        rotation={[-0.62, 0, 0]}
      />

      {/* Side Air Scoop Intakes */}
      <mesh
        geometry={GEO_BOX}
        material={SHARED_DARK_TRIM_MAT}
        scale={[0.1, 0.22, 0.6]}
        position={[-0.94, 0.48, -0.4]}
      />
      <mesh
        geometry={GEO_BOX}
        material={SHARED_DARK_TRIM_MAT}
        scale={[0.1, 0.22, 0.6]}
        position={[0.94, 0.48, -0.4]}
      />

      {/* Rear Engine Deck with Vents & Ducktail Spoiler */}
      <mesh
        geometry={GEO_BOX}
        material={paintMat}
        scale={[1.72, 0.28, 1.3]}
        position={[0, 0.52, -1.5]}
      />
      <mesh
        geometry={GEO_BOX}
        material={SHARED_DARK_TRIM_MAT}
        scale={[0.8, 0.04, 0.8]}
        position={[0, 0.67, -1.45]}
      />

      {/* Rear Laser LED Taillights */}
      <mesh
        geometry={GEO_BOX}
        material={brakeMat}
        scale={[0.55, 0.08, 0.08]}
        position={[-0.55, 0.56, -2.28]}
      />
      <mesh
        geometry={GEO_BOX}
        material={brakeMat}
        scale={[0.55, 0.08, 0.08]}
        position={[0.55, 0.56, -2.28]}
      />

      {/* Rear High-Downforce Diffuser */}
      <mesh
        geometry={GEO_BOX}
        material={SHARED_DARK_TRIM_MAT}
        scale={[1.5, 0.18, 0.25]}
        position={[0, 0.28, -2.25]}
      />

      {/* Sleek Aerodynamic Wing Mirrors */}
      <mesh
        geometry={GEO_BOX}
        material={paintMat}
        scale={[0.2, 0.06, 0.1]}
        position={[-0.95, 0.74, 0.5]}
      />
      <mesh
        geometry={GEO_BOX}
        material={paintMat}
        scale={[0.2, 0.06, 0.1]}
        position={[0.95, 0.74, 0.5]}
      />
    </group>
  );
}

// ── 7. White Sporty Hatchback (Dual-Tone with Contrast Roof & Wing) ───────────
function WhiteSportsHatchBody({
  paintMat,
  brakeMat,
}: {
  paintMat: THREE.Material;
  brakeMat: THREE.Material;
}) {
  return (
    <group>
      {/* Lower Dark Aero Splitters & Skirts */}
      <mesh
        geometry={GEO_BOX}
        material={SHARED_DARK_TRIM_MAT}
        scale={[1.74, 0.15, 4.1]}
        position={[0, 0.28, 0]}
      />

      {/* Crisp White Lower Body */}
      <mesh
        geometry={GEO_BOX}
        material={paintMat}
        scale={[1.8, 0.46, 4.15]}
        position={[0, 0.55, 0]}
        castShadow
      />

      {/* Sculpted White Hood */}
      <mesh
        geometry={GEO_BOX}
        material={paintMat}
        scale={[1.7, 0.18, 1.3]}
        position={[0, 0.72, 1.2]}
        rotation={[-0.1, 0, 0]}
      />

      {/* Contrast Gloss Black Cabin & Roof */}
      <mesh
        geometry={GEO_BOX}
        material={SHARED_DARK_TRIM_MAT}
        scale={[1.56, 0.58, 2.05]}
        position={[0, 1.08, -0.2]}
        castShadow
      />

      {/* Tinted Cabin Windows */}
      <mesh
        geometry={GEO_BOX}
        material={SHARED_WINDOW_MAT}
        scale={[1.58, 0.48, 1.95]}
        position={[0, 1.05, -0.2]}
      />

      {/* Raked Windshield */}
      <mesh
        geometry={GEO_BOX}
        material={SHARED_WINDOW_MAT}
        scale={[1.48, 0.48, 0.7]}
        position={[0, 1.0, 0.8]}
        rotation={[-0.5, 0, 0]}
      />

      {/* Sloping Rear Glass */}
      <mesh
        geometry={GEO_BOX}
        material={SHARED_WINDOW_MAT}
        scale={[1.48, 0.5, 0.7]}
        position={[0, 1.02, -1.22]}
        rotation={[0.52, 0, 0]}
      />

      {/* Prominent Aerodynamic Rear Black Roof Spoiler / Wing */}
      <mesh
        geometry={GEO_BOX}
        material={SHARED_DARK_TRIM_MAT}
        scale={[1.44, 0.08, 0.42]}
        position={[0, 1.42, -1.35]}
        rotation={[0.1, 0, 0]}
      />

      {/* Aggressive Honeycomb Black Grille */}
      <mesh
        geometry={GEO_BOX}
        material={SHARED_GRILLE_MAT}
        scale={[1.15, 0.24, 0.08]}
        position={[0, 0.48, 2.08]}
      />

      {/* Modern Slim LED Headlights */}
      <mesh
        geometry={GEO_BOX}
        material={SHARED_HEADLIGHT_MAT}
        scale={[0.34, 0.1, 0.08]}
        position={[-0.66, 0.6, 2.06]}
      />
      <mesh
        geometry={GEO_BOX}
        material={SHARED_HEADLIGHT_MAT}
        scale={[0.34, 0.1, 0.08]}
        position={[0.66, 0.6, 2.06]}
      />

      {/* Bold Red LED Taillights */}
      <mesh
        geometry={GEO_BOX}
        material={brakeMat}
        scale={[0.36, 0.12, 0.08]}
        position={[-0.68, 0.74, -2.06]}
      />
      <mesh
        geometry={GEO_BOX}
        material={brakeMat}
        scale={[0.36, 0.12, 0.08]}
        position={[0.68, 0.74, -2.06]}
      />

      {/* Black Side Mirrors */}
      <mesh
        geometry={GEO_BOX}
        material={SHARED_DARK_TRIM_MAT}
        scale={[0.16, 0.1, 0.14]}
        position={[-0.92, 0.88, 0.48]}
      />
      <mesh
        geometry={GEO_BOX}
        material={SHARED_DARK_TRIM_MAT}
        scale={[0.16, 0.1, 0.14]}
        position={[0.92, 0.88, 0.48]}
      />
    </group>
  );
}

// ── Individual Car Agent Component ───────────────────────────────────────────
interface CarAgentProps {
  agent: VehicleAgent;
}

function CarAgentView({ agent }: CarAgentProps) {
  const groupRef = useRef<THREE.Group>(null);
  const frontLeftSteerRef = useRef<THREE.Group>(null);
  const frontRightSteerRef = useRef<THREE.Group>(null);
  const wheelFLSpinRef = useRef<THREE.Group>(null);
  const wheelFRSpinRef = useRef<THREE.Group>(null);
  const wheelRLSpinRef = useRef<THREE.Group>(null);
  const wheelRRSpinRef = useRef<THREE.Group>(null);

  // Paint material with high gloss clearcoat appearance
  const paintMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: agent.def.color,
      roughness: 0.22,
      metalness: 0.35,
    });
  }, [agent.def.color]);

  // Dynamic brake light material that flares when decelerating/braking
  const brakeLightMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#ef4444',
      emissive: '#dc2626',
      emissiveIntensity: 0.9,
      roughness: 0.15,
    });
  }, []);

  // Half-track and wheelbase dimensions
  const wheelR = agent.def.wheelRadius;
  const halfTrack = agent.def.width * 0.46;
  const wheelBaseF = agent.def.length * 0.29;
  const wheelBaseR = -agent.def.length * 0.29;

  // Render model-specific body
  const bodyComponent = useMemo(() => {
    switch (agent.def.model) {
      case 'sedan':
        return <RedSedanBody paintMat={paintMat} brakeMat={brakeLightMat} />;
      case 'hatchback':
        return <BlueHatchbackBody paintMat={paintMat} brakeMat={brakeLightMat} />;
      case 'coupe':
        return <YellowCoupeBody paintMat={paintMat} brakeMat={brakeLightMat} />;
      case 'suv':
        return <GreenSUVBody paintMat={paintMat} brakeMat={brakeLightMat} />;
      case 'retro':
        return <OrangeRetroBody paintMat={paintMat} brakeMat={brakeLightMat} />;
      case 'supercar':
        return <PurpleSupercarBody paintMat={paintMat} brakeMat={brakeLightMat} />;
      case 'sports_hatch':
        return <WhiteSportsHatchBody paintMat={paintMat} brakeMat={brakeLightMat} />;
      default:
        return <RedSedanBody paintMat={paintMat} brakeMat={brakeLightMat} />;
    }
  }, [agent.def.model, paintMat, brakeLightMat]);

  // Synchronize 3D transforms on frame update
  useFrame(() => {
    if (!groupRef.current) return;

    // Position & Orientation
    groupRef.current.position.set(agent.position[0], agent.position[1], agent.position[2]);
    groupRef.current.rotation.set(agent.rotation[0], agent.rotation[1], agent.rotation[2], 'YXZ');

    // Front wheel steering
    if (frontLeftSteerRef.current) {
      frontLeftSteerRef.current.rotation.y = agent.steerAngle;
    }
    if (frontRightSteerRef.current) {
      frontRightSteerRef.current.rotation.y = agent.steerAngle;
    }

    // Wheel rolling rotation
    if (wheelFLSpinRef.current) wheelFLSpinRef.current.rotation.x = agent.wheelSpin;
    if (wheelFRSpinRef.current) wheelFRSpinRef.current.rotation.x = agent.wheelSpin;
    if (wheelRLSpinRef.current) wheelRLSpinRef.current.rotation.x = agent.wheelSpin;
    if (wheelRRSpinRef.current) wheelRRSpinRef.current.rotation.x = agent.wheelSpin;

    // Brake light flare
    brakeLightMat.emissiveIntensity = agent.isBraking ? 2.8 : 0.85;
  });

  return (
    <group ref={groupRef}>
      {bodyComponent}

      {/* 4 Wheels: Front Left, Front Right, Rear Left, Rear Right */}
      <CarWheel
        radius={wheelR}
        position={[-halfTrack, wheelR, wheelBaseF]}
        steerRef={frontLeftSteerRef}
        spinRef={wheelFLSpinRef}
        isRightSide={false}
      />
      <CarWheel
        radius={wheelR}
        position={[halfTrack, wheelR, wheelBaseF]}
        steerRef={frontRightSteerRef}
        spinRef={wheelFRSpinRef}
        isRightSide={true}
      />
      <CarWheel
        radius={wheelR}
        position={[-halfTrack, wheelR, wheelBaseR]}
        spinRef={wheelRLSpinRef}
        isRightSide={false}
      />
      <CarWheel
        radius={wheelR}
        position={[halfTrack, wheelR, wheelBaseR]}
        spinRef={wheelRRSpinRef}
        isRightSide={true}
      />
    </group>
  );
}

// ── Main CityTraffic Component ────────────────────────────────────────────────
export function CityTraffic({ layout }: { layout: Layout }) {
  // Initialize traffic simulation system once for the current city layout
  const trafficSystem = useMemo(() => new CityTrafficSystem(layout), [layout]);

  // Run simulation loop every animation frame
  useFrame((_, delta) => {
    trafficSystem.update(delta);
  });

  return (
    <group name="city-traffic">
      {trafficSystem.vehicles.map(v => (
        <CarAgentView key={v.def.id} agent={v} />
      ))}
    </group>
  );
}

