'use client';
/**
 * CityLife – sky inhabitants.
 *
 * Coordinate convention (local space):
 *   +Z  = forward / nose direction
 *   -Z  = backward / tail / banner
 *   +X  = right wing tip
 *   +Y  = up
 *
 * rotation.y = atan2(-sin(a)*Rx, cos(a)*Rz) makes local +Z
 * track the ellipse tangent → plane/birds face their direction of travel.
 */
import * as THREE from 'three';
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';

// ─── helpers ─────────────────────────────────────────────────────────────────
const flat = (c: string, emissive?: string, ei = 0): THREE.MeshStandardMaterial =>
  new THREE.MeshStandardMaterial({
    color: c, flatShading: true, roughness: 0.78, metalness: 0.06,
    ...(emissive ? { emissive, emissiveIntensity: ei } : {}),
  });

const rndStream = (seed: number) => {
  let s = (seed * 9301 + 49297) % 233280;
  return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
};

// ── orbit heading: makes local +Z point along the ellipse tangent ─────────────
function ellipseHeading(a: number, Rx: number, Rz: number): number {
  // tangent = (-sin(a)*Rx, 0, cos(a)*Rz)
  // rotation.y = atan2(tx, tz) → local +Z = (sin θ, 0, cos θ) = tangent
  return Math.atan2(-Math.sin(a) * Rx, Math.cos(a) * Rz);
}

// ═══════════════════════════════════════════════════════════════════════════════
//  BANNER TEXTURE
// ═══════════════════════════════════════════════════════════════════════════════
let _bannerTex: THREE.CanvasTexture | null = null;
function getBannerTexture(): THREE.CanvasTexture {
  if (_bannerTex) return _bannerTex;
  const W = 1024, H = 256;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const g = cv.getContext('2d')!;

  // Background
  const bg = g.createLinearGradient(0, 0, W, 0);
  bg.addColorStop(0,   '#0c1a4e');
  bg.addColorStop(0.5, '#1e3a8f');
  bg.addColorStop(1,   '#0c1a4e');
  g.fillStyle = bg; g.fillRect(0, 0, W, H);

  // Gold border
  g.strokeStyle = '#f59e0b'; g.lineWidth = 7;
  g.strokeRect(5, 5, W - 10, H - 10);
  g.strokeStyle = 'rgba(251,191,36,0.3)'; g.lineWidth = 2;
  g.strokeRect(14, 14, W - 28, H - 28);

  // Star burst left
  g.fillStyle = '#fde68a';
  const star = (cx: number, cy: number, r: number) => {
    g.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = (i * Math.PI) / 5 - Math.PI / 2;
      const rad = i % 2 === 0 ? r : r * 0.42;
      i === 0 ? g.moveTo(cx + rad * Math.cos(a), cy + rad * Math.sin(a))
              : g.lineTo(cx + rad * Math.cos(a), cy + rad * Math.sin(a));
    }
    g.closePath(); g.fill();
  };
  star(72, 128, 46);

  // House icon
  g.fillStyle = '#60a5fa';
  g.beginPath(); g.moveTo(155, 95); g.lineTo(185, 68); g.lineTo(215, 95); g.closePath(); g.fill();
  g.fillStyle = '#93c5fd'; g.fillRect(162, 95, 46, 56);
  g.fillStyle = '#1e3a8f'; g.fillRect(179, 118, 16, 33);

  // Headline
  g.font = 'bold 76px Arial Black, sans-serif';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.shadowColor = '#fbbf24'; g.shadowBlur = 18;
  g.fillStyle = '#ffffff';
  g.fillText('GET YOUR OWN PROPERTY!', W / 2 + 45, 95);
  g.shadowBlur = 0;

  // Subtext
  g.font = '500 40px Arial, sans-serif';
  g.fillStyle = '#fde68a';
  g.fillText('BUY A PLOT IN THE CITY  ✦  thecity.app', W / 2 + 45, 175);

  _bannerTex = new THREE.CanvasTexture(cv);
  _bannerTex.colorSpace = THREE.SRGBColorSpace;
  _bannerTex.anisotropy = 8;
  return _bannerTex;
}

// ═══════════════════════════════════════════════════════════════════════════════
//  ADVERT PLANE
//  All geometry is built with local +Z = forward (nose), -Z = tail/banner.
//  rotation.y is set each frame to track the ellipse tangent.
// ═══════════════════════════════════════════════════════════════════════════════
export function AdvertPlane() {
  const planeRef  = useRef<THREE.Group>(null);
  const prop1Ref  = useRef<THREE.Group>(null);
  const prop2Ref  = useRef<THREE.Group>(null);
  const bannerRef = useRef<THREE.Group>(null);

  const RX = 165, RZ = 145, ALT = 78, SPEED = 20; // ellipse radii, altitude, m/s
  const aRef = useRef(0.3);                         // start not at angle 0 so visible

  // ── materials ──────────────────────────────────────────────────────────────
  const mFuse    = useMemo(() => flat('#f1f5f9'), []);
  const mWing    = useMemo(() => flat('#dde5f0'), []);
  const mAccent  = useMemo(() => flat('#dc2626'), []);
  const mEngine  = useMemo(() => flat('#94a3b8'), []);
  const mProp    = useMemo(() => flat('#1e293b'), []);
  const mExhaust = useMemo(() => flat('#64748b', '#475569', 0.3), []);
  const mGlass   = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#7dd3fc', transparent: true, opacity: 0.65, roughness: 0.1, flatShading: true,
  }), []);
  const mRope    = useMemo(() => flat('#92400e'), []);
  const mBanner  = useMemo(() => {
    if (typeof document === 'undefined') return flat('#1e3a8f');
    const tex = getBannerTexture();
    return new THREE.MeshStandardMaterial({
      map: tex, emissiveMap: tex, emissive: '#ffffff', emissiveIntensity: 0.5,
      roughness: 0.65, side: THREE.DoubleSide,
    });
  }, []);

  // ── animation ──────────────────────────────────────────────────────────────
  useFrame(({ clock }, dt) => {
    const t  = clock.elapsedTime;
    const a  = aRef.current;
    const x  = Math.cos(a) * RX;
    const z  = Math.sin(a) * RZ;
    const alt = ALT + Math.sin(t * 0.18) * 5;

    // advance angle
    const circum = Math.hypot(Math.sin(a) * RX, Math.cos(a) * RZ); // local radius proxy
    aRef.current += (SPEED / (circum + 0.001)) * dt;

    const heading = ellipseHeading(a, RX, RZ);

    if (planeRef.current) {
      planeRef.current.position.set(x, alt, z);
      planeRef.current.rotation.set(
        Math.sin(t * 0.14) * 0.04,   // nose pitch bob
        heading,
        -0.12 + Math.sin(t * 0.22) * 0.05  // gentle bank into turn
      );
    }

    // propellers spin
    const spinDt = 20 * dt;
    if (prop1Ref.current) prop1Ref.current.rotation.z += spinDt;
    if (prop2Ref.current) prop2Ref.current.rotation.z += spinDt;

    // banner flutter
    if (bannerRef.current) {
      bannerRef.current.rotation.y = Math.sin(t * 1.3) * 0.09;
      bannerRef.current.rotation.x = Math.sin(t * 0.8) * 0.05;
    }
  });

  // ── engine sub-component ──────────────────────────────────────────────────
  const Engine = ({ xPos, propRef }: { xPos: number; propRef: React.RefObject<THREE.Group | null> }) => (
    <group position={[xPos, -0.6, 1.2]}>
      {/* Pod */}
      <mesh material={mEngine} castShadow rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.36, 0.28, 2.4, 10]} />
      </mesh>
      {/* Intake ring (front) */}
      <mesh position={[0, 0, 1.2]} material={mExhaust}>
        <torusGeometry args={[0.36, 0.06, 8, 14]} />
      </mesh>
      {/* Exhaust (back) */}
      <mesh position={[0, 0, -1.2]} rotation={[Math.PI / 2, 0, 0]} material={mExhaust}>
        <cylinderGeometry args={[0.24, 0.18, 0.3, 10]} />
      </mesh>
      {/* Propeller hub + 3 blades */}
      <group ref={propRef} position={[0, 0, 1.35]}>
        <mesh material={mProp} castShadow rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.09, 0.09, 0.2, 8]} />
        </mesh>
        {[0, 120, 240].map(deg => (
          <mesh key={deg} rotation={[0, 0, (deg * Math.PI) / 180]} material={mProp} castShadow>
            <boxGeometry args={[1.9, 0.06, 0.2]} />
          </mesh>
        ))}
      </group>
    </group>
  );

  return (
    <group ref={planeRef}>
      {/* ═══ FUSELAGE – box lying flat along Z ═══ */}
      <mesh material={mFuse} castShadow>
        <boxGeometry args={[1.4, 1.1, 9.6]} />
      </mesh>

      {/* Nose cone – at +Z */}
      <mesh position={[0, 0, 5.4]} rotation={[Math.PI / 2, 0, 0]} material={mFuse} castShadow>
        <coneGeometry args={[0.68, 2.0, 10]} />
      </mesh>

      {/* Tail taper – at -Z */}
      <mesh position={[0, 0, -5.4]} rotation={[-Math.PI / 2, 0, 0]} material={mFuse} castShadow>
        <coneGeometry args={[0.5, 1.8, 10]} />
      </mesh>

      {/* Red belly stripe */}
      <mesh position={[0, -0.56, 0]} material={mAccent} castShadow>
        <boxGeometry args={[0.16, 0.06, 8.8]} />
      </mesh>

      {/* Cockpit bubble */}
      <mesh position={[0, 0.68, 2.5]} material={mGlass} castShadow>
        <sphereGeometry args={[0.52, 10, 7, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
      </mesh>

      {/* Side windows */}
      {[-1.8, -0.6, 0.6, 1.8].map((z, i) => (
        <mesh key={i} position={[0.71, 0.25, z]} rotation={[0, Math.PI / 2, 0]} material={mGlass}>
          <planeGeometry args={[0.55, 0.38]} />
        </mesh>
      ))}

      {/* ═══ MAIN WINGS – at Z≈+1 (balanced over centre of lift) ═══ */}
      {/* Right wing */}
      <mesh position={[4.2, -0.15, 1.0]} rotation={[0, 0, 0.06]} material={mWing} castShadow>
        <boxGeometry args={[7.2, 0.22, 2.6]} />
      </mesh>
      {/* Left wing */}
      <mesh position={[-4.2, -0.15, 1.0]} rotation={[0, 0, -0.06]} material={mWing} castShadow>
        <boxGeometry args={[7.2, 0.22, 2.6]} />
      </mesh>
      {/* Wing leading-edge red stripe R */}
      <mesh position={[4.2, -0.15, 2.32]} rotation={[0, 0, 0.06]} material={mAccent} castShadow>
        <boxGeometry args={[7.0, 0.24, 0.1]} />
      </mesh>
      {/* Wing leading-edge red stripe L */}
      <mesh position={[-4.2, -0.15, 2.32]} rotation={[0, 0, -0.06]} material={mAccent} castShadow>
        <boxGeometry args={[7.0, 0.24, 0.1]} />
      </mesh>
      {/* Winglets R */}
      <mesh position={[7.85, 0.5, 1.0]} rotation={[0, 0, 0.58]} material={mAccent} castShadow>
        <boxGeometry args={[0.15, 1.4, 1.0]} />
      </mesh>
      {/* Winglets L */}
      <mesh position={[-7.85, 0.5, 1.0]} rotation={[0, 0, -0.58]} material={mAccent} castShadow>
        <boxGeometry args={[0.15, 1.4, 1.0]} />
      </mesh>

      {/* ═══ TAIL ASSEMBLY – at Z≈-4 ═══ */}
      {/* Horizontal stabiliser */}
      <mesh position={[0, 0.1, -4.6]} rotation={[0, 0, 0]} material={mWing} castShadow>
        <boxGeometry args={[4.6, 0.18, 1.8]} />
      </mesh>
      {/* Vertical fin */}
      <mesh position={[0, 1.05, -4.2]} rotation={[0.28, 0, 0]} material={mWing} castShadow>
        <boxGeometry args={[0.18, 2.0, 2.0]} />
      </mesh>
      {/* Fin red stripe */}
      <mesh position={[0, 1.05, -3.2]} rotation={[0.28, 0, 0]} material={mAccent} castShadow>
        <boxGeometry args={[0.2, 1.9, 0.12]} />
      </mesh>

      {/* ═══ ENGINES (under wings) ═══ */}
      <Engine xPos={2.8} propRef={prop1Ref} />
      <Engine xPos={-2.8} propRef={prop2Ref} />

      {/* ═══ LIGHTS ═══ */}
      {/* Headlights (front) */}
      {[-0.5, 0.5].map(x => (
        <mesh key={x} position={[x, -0.25, 6.3]} material={flat('#fefce8', '#fef08a', 1.8)}>
          <boxGeometry args={[0.28, 0.16, 0.04]} />
        </mesh>
      ))}
      {/* Tail lights (back) */}
      {[-0.5, 0.5].map(x => (
        <mesh key={x} position={[x, -0.25, -6.2]} material={flat('#fecaca', '#ef4444', 2.2)}>
          <boxGeometry args={[0.28, 0.16, 0.04]} />
        </mesh>
      ))}

      {/* ═══ BANNER – trailing at -Z (behind tail) ═══ */}
      {/* Start from just behind tail */}
      <group position={[0, 0, -7.4]}>
        {/* 3 ropes going further back along -Z */}
        {[-0.7, 0, 0.7].map((x, i) => (
          <mesh key={i} position={[x, 0, -7]} rotation={[Math.PI / 2, 0, 0]} material={mRope} castShadow>
            <cylinderGeometry args={[0.04, 0.04, 14, 5]} />
          </mesh>
        ))}

        {/* Banner cloth at end of ropes */}
        <group ref={bannerRef} position={[0, 0, -15]}>
          {/* Top rod */}
          <mesh position={[0, 2.3, 0]} rotation={[0, 0, Math.PI / 2]} material={flat('#78716c')} castShadow>
            <cylinderGeometry args={[0.07, 0.07, 19, 6]} />
          </mesh>
          {/* Bottom rod */}
          <mesh position={[0, -2.3, 0]} rotation={[0, 0, Math.PI / 2]} material={flat('#78716c')} castShadow>
            <cylinderGeometry args={[0.07, 0.07, 19, 6]} />
          </mesh>
          {/* Cloth face – perpendicular to Z so visible from the side */}
          <mesh material={mBanner} castShadow>
            <planeGeometry args={[18.5, 4.5, 6, 2]} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  BIRD FLOCK – 20 proper 3-D seagulls
//  Local +Z = forward (beak), -Z = tail feathers, ±X = wing tips, +Y = up.
// ═══════════════════════════════════════════════════════════════════════════════
const BIRD_COUNT = 20;

export function BirdFlock() {
  const mBody  = useMemo(() => flat('#f8fafc'), []);
  const mWing  = useMemo(() => flat('#dde5f0'), []);
  const mTail  = useMemo(() => flat('#cbd5e1'), []);
  const mBeak  = useMemo(() => flat('#fbbf24'), []);
  const mEye   = useMemo(() => flat('#0f172a'), []);

  const birds = useMemo(() => {
    const r = rndStream(99);
    return Array.from({ length: BIRD_COUNT }, (_, i) => ({
      angle:    (i / BIRD_COUNT) * Math.PI * 2 + r() * 0.6,
      altBase:  30 + r() * 35,
      R:        50 + r() * 130,
      speed:    7 + r() * 5,
      phase:    r() * Math.PI * 2,
      bankDir:  r() > 0.5 ? 1 : -1,
      flapRate: 2.0 + r() * 1.8,
      pitchAmp: 0.05 + r() * 0.07,
    }));
  }, []);

  // per-bird refs
  const rootRefs  = useRef<(THREE.Group | null)[]>(Array(BIRD_COUNT).fill(null));
  const wLInRef   = useRef<(THREE.Mesh | null)[]>(Array(BIRD_COUNT).fill(null));
  const wRInRef   = useRef<(THREE.Mesh | null)[]>(Array(BIRD_COUNT).fill(null));
  const wLOutRef  = useRef<(THREE.Mesh | null)[]>(Array(BIRD_COUNT).fill(null));
  const wROutRef  = useRef<(THREE.Mesh | null)[]>(Array(BIRD_COUNT).fill(null));

  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime;
    birds.forEach((b, i) => {
      b.angle += (b.speed / b.R) * dt;
      const x   = Math.cos(b.angle) * b.R;
      const z   = Math.sin(b.angle) * b.R;
      const alt = b.altBase + Math.sin(t * 0.3 + b.phase) * 8;
      // heading: local +Z points along tangent (circular orbit, so Rx=Rz=b.R)
      const heading = ellipseHeading(b.angle, b.R, b.R);
      const bank  = b.bankDir * (0.15 + Math.sin(t * 0.5 + b.phase) * 0.06);
      const pitch = Math.sin(t * 0.38 + b.phase) * b.pitchAmp;

      const g = rootRefs.current[i];
      if (g) { g.position.set(x, alt, z); g.rotation.set(pitch, heading, bank); }

      // wing flap: inner panels gentle, outer panels full flap
      const flap = Math.sin(t * b.flapRate + b.phase);
      const fI = flap * 0.22, fO = flap * 0.52;
      const wLI = wLInRef.current[i];  if (wLI) wLI.rotation.z  =  0.08 + fI;
      const wRI = wRInRef.current[i];  if (wRI) wRI.rotation.z  = -0.08 - fI;
      const wLO = wLOutRef.current[i]; if (wLO) wLO.rotation.z  =  0.22 + fO;
      const wRO = wROutRef.current[i]; if (wRO) wRO.rotation.z  = -0.22 - fO;
    });
  });

  return (
    <>
      {birds.map((_, i) => (
        <group key={i} ref={el => { rootRefs.current[i] = el; }}>
          {/* ── Body: box lying along Z (forward) ── */}
          <mesh material={mBody} castShadow>
            <boxGeometry args={[0.18, 0.14, 0.62]} />
          </mesh>
          {/* Breast bulge */}
          <mesh position={[0, 0.06, 0.18]} material={mBody} castShadow>
            <sphereGeometry args={[0.1, 8, 6]} />
          </mesh>

          {/* ── Head: at +Z (front) ── */}
          <mesh position={[0, 0.1, 0.36]} material={mBody} castShadow>
            <sphereGeometry args={[0.09, 8, 6]} />
          </mesh>

          {/* ── Beak: further +Z ── */}
          <mesh position={[0, 0.1, 0.5]} rotation={[-Math.PI / 2, 0, 0]} material={mBeak} castShadow>
            <coneGeometry args={[0.022, 0.12, 5]} />
          </mesh>

          {/* ── Eyes ── */}
          {[-0.055, 0.055].map((x, ei) => (
            <mesh key={ei} position={[x, 0.14, 0.38]} material={mEye}>
              <sphereGeometry args={[0.017, 5, 4]} />
            </mesh>
          ))}

          {/* ── Left wing: inner panel ── */}
          <mesh
            ref={el => { wLInRef.current[i] = el; }}
            position={[-0.22, 0.05, 0.05]}
            rotation={[0.06, 0.1, 0.08]}
            material={mWing}
            castShadow
          >
            <boxGeometry args={[0.4, 0.025, 0.28]} />
          </mesh>
          {/* Left wing: outer panel */}
          <mesh
            ref={el => { wLOutRef.current[i] = el; }}
            position={[-0.54, 0.08, 0.0]}
            rotation={[0.05, 0.18, 0.22]}
            material={mWing}
            castShadow
          >
            <boxGeometry args={[0.44, 0.018, 0.24]} />
          </mesh>

          {/* ── Right wing: inner panel ── */}
          <mesh
            ref={el => { wRInRef.current[i] = el; }}
            position={[0.22, 0.05, 0.05]}
            rotation={[0.06, -0.1, -0.08]}
            material={mWing}
            castShadow
          >
            <boxGeometry args={[0.4, 0.025, 0.28]} />
          </mesh>
          {/* Right wing: outer panel */}
          <mesh
            ref={el => { wROutRef.current[i] = el; }}
            position={[0.54, 0.08, 0.0]}
            rotation={[0.05, -0.18, -0.22]}
            material={mWing}
            castShadow
          >
            <boxGeometry args={[0.44, 0.018, 0.24]} />
          </mesh>

          {/* ── Tail (forked): at -Z ── */}
          {[-0.065, 0.065].map((x, ti) => (
            <mesh
              key={ti}
              position={[x, -0.02, -0.34]}
              rotation={[-0.28, x > 0 ? 0.14 : -0.14, x > 0 ? 0.08 : -0.08]}
              material={mTail}
              castShadow
            >
              <boxGeometry args={[0.065, 0.013, 0.26]} />
            </mesh>
          ))}
        </group>
      ))}
    </>
  );
}
