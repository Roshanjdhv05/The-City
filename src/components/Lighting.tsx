'use client';
import * as THREE from 'three';
import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { EffectComposer, Bloom, Vignette, SSAO } from '@react-three/postprocessing';
import { QUALITY, Quality } from '@/lib/state';
import { cityTime, getTimePhase, useTimeStore, getDeviceHour } from '@/lib/time';
import { solid } from '@/lib/materials';

// -------------------------------------------------------------
// Dynamic Sky Gradients Palette for 24-Hour Cycle
// -------------------------------------------------------------
interface SkyColorStop {
  top: THREE.Color;
  mid: THREE.Color;
  hor: THREE.Color;
  sunCol: THREE.Color;
  sunInt: number;
  hemiSky: THREE.Color;
  hemiGnd: THREE.Color;
  hemiInt: number;
  fogCol: THREE.Color;
}

const SKY_PALETTE = {
  dawn: {
    top: new THREE.Color('#1e3a8a'),
    mid: new THREE.Color('#9d174d'),
    hor: new THREE.Color('#f59e0b'),
    sunCol: new THREE.Color('#ffaa40'),
    sunInt: 1.5,
    hemiSky: new THREE.Color('#7c3aed'),
    hemiGnd: new THREE.Color('#451a03'),
    hemiInt: 0.55,
    fogCol: new THREE.Color('#d97706'),
  },
  sunrise: {
    top: new THREE.Color('#3b82f6'),
    mid: new THREE.Color('#f472b6'),
    hor: new THREE.Color('#fef08a'),
    sunCol: new THREE.Color('#ffc168'),
    sunInt: 2.1,
    hemiSky: new THREE.Color('#bae6fd'),
    hemiGnd: new THREE.Color('#d97706'),
    hemiInt: 0.75,
    fogCol: new THREE.Color('#fed7aa'),
  },
  day: {
    top: new THREE.Color('#2563eb'),
    mid: new THREE.Color('#60a5fa'),
    hor: new THREE.Color('#dbeafe'),
    sunCol: new THREE.Color('#fffbf0'),
    sunInt: 2.4,
    hemiSky: new THREE.Color('#d6e6f3'),
    hemiGnd: new THREE.Color('#e2d6bf'),
    hemiInt: 0.85,
    fogCol: new THREE.Color('#cde0f0'),
  },
  noon: {
    top: new THREE.Color('#1d4ed8'),
    mid: new THREE.Color('#38bdf8'),
    hor: new THREE.Color('#eff6ff'),
    sunCol: new THREE.Color('#ffffff'),
    sunInt: 2.5,
    hemiSky: new THREE.Color('#e0f2fe'),
    hemiGnd: new THREE.Color('#fef3c7'),
    hemiInt: 0.9,
    fogCol: new THREE.Color('#dbeafe'),
  },
  sunset: {
    top: new THREE.Color('#1e1b4b'),
    mid: new THREE.Color('#831843'),
    hor: new THREE.Color('#ea580c'),
    sunCol: new THREE.Color('#ff6200'),
    sunInt: 1.9,
    hemiSky: new THREE.Color('#fb923c'),
    hemiGnd: new THREE.Color('#431407'),
    hemiInt: 0.65,
    fogCol: new THREE.Color('#c2410c'),
  },
  dusk: {
    top: new THREE.Color('#0a0e1c'),
    mid: new THREE.Color('#141c2e'),
    hor: new THREE.Color('#221d2e'),
    sunCol: new THREE.Color('#cbd5e1'),
    sunInt: 0.6,
    hemiSky: new THREE.Color('#101827'),
    hemiGnd: new THREE.Color('#080d1a'),
    hemiInt: 0.32,
    fogCol: new THREE.Color('#141b2b'),
  },
  night: {
    top: new THREE.Color('#02040a'),
    mid: new THREE.Color('#060a16'),
    hor: new THREE.Color('#090f1f'),
    sunCol: new THREE.Color('#cbd5e1'),
    sunInt: 0.48,
    hemiSky: new THREE.Color('#080d1a'),
    hemiGnd: new THREE.Color('#020408'),
    hemiInt: 0.20,
    fogCol: new THREE.Color('#060b17'),
  },
  midnight: {
    top: new THREE.Color('#010206'),
    mid: new THREE.Color('#030610'),
    hor: new THREE.Color('#060914'),
    sunCol: new THREE.Color('#cbd5e1'),
    sunInt: 0.40,
    hemiSky: new THREE.Color('#050812'),
    hemiGnd: new THREE.Color('#010205'),
    hemiInt: 0.16,
    fogCol: new THREE.Color('#040710'),
  },
};

function sampleSky(h: number): SkyColorStop {
  const normH = ((h % 24) + 24) % 24;
  // Blend smoothly between key frames
  if (normH >= 4.5 && normH < 6.0) {
    const t = (normH - 4.5) / 1.5;
    return lerpSky(SKY_PALETTE.dawn, SKY_PALETTE.sunrise, t);
  }
  if (normH >= 6.0 && normH < 9.0) {
    const t = (normH - 6.0) / 3.0;
    return lerpSky(SKY_PALETTE.sunrise, SKY_PALETTE.day, t);
  }
  if (normH >= 9.0 && normH < 14.5) {
    const t = (normH - 9.0) / 5.5;
    return lerpSky(SKY_PALETTE.day, SKY_PALETTE.noon, t);
  }
  if (normH >= 14.5 && normH < 17.5) {
    const t = (normH - 14.5) / 3.0;
    return lerpSky(SKY_PALETTE.noon, SKY_PALETTE.sunset, t);
  }
  if (normH >= 17.5 && normH < 19.5) {
    const t = (normH - 17.5) / 2.0;
    return lerpSky(SKY_PALETTE.sunset, SKY_PALETTE.dusk, t);
  }
  if (normH >= 19.5 && normH < 22.0) {
    const t = (normH - 19.5) / 2.5;
    return lerpSky(SKY_PALETTE.dusk, SKY_PALETTE.night, t);
  }
  if (normH >= 22.0 || normH < 2.0) {
    const t = normH >= 22.0 ? (normH - 22.0) / 4.0 : (normH + 2.0) / 4.0;
    return lerpSky(SKY_PALETTE.night, SKY_PALETTE.midnight, t);
  }
  // 2.0 to 4.5
  const t = (normH - 2.0) / 2.5;
  return lerpSky(SKY_PALETTE.midnight, SKY_PALETTE.dawn, t);
}

function lerpSky(a: SkyColorStop, b: SkyColorStop, t: number): SkyColorStop {
  return {
    top: a.top.clone().lerp(b.top, t),
    mid: a.mid.clone().lerp(b.mid, t),
    hor: a.hor.clone().lerp(b.hor, t),
    sunCol: a.sunCol.clone().lerp(b.sunCol, t),
    sunInt: THREE.MathUtils.lerp(a.sunInt, b.sunInt, t),
    hemiSky: a.hemiSky.clone().lerp(b.hemiSky, t),
    hemiGnd: a.hemiGnd.clone().lerp(b.hemiGnd, t),
    hemiInt: THREE.MathUtils.lerp(a.hemiInt, b.hemiInt, t),
    fogCol: a.fogCol.clone().lerp(b.fogCol, t),
  };
}

// -------------------------------------------------------------
// Master Dynamic Scene Lighting (Sun & Moon with Building Shadows)
// -------------------------------------------------------------
export function SceneLighting({ q, span = 340, center = [0, 0] }: { q: Quality; span?: number; center?: [number, number] }) {
  const S = QUALITY[q].shadow;
  const dirLightRef = useRef<THREE.DirectionalLight>(null);
  const hemiLightRef = useRef<THREE.HemisphereLight>(null);
  const lastSyncTime = useRef(0);

  useEffect(() => {
    const l = dirLightRef.current;
    if (l) {
      l.target.position.set(center[0], 0, center[1]);
      l.target.updateMatrixWorld();
    }
  }, [center]);

  useFrame((_, dt) => {
    // 1. Advance simulation clock if playing, or sync with local device clock if isLiveDevice
    if (cityTime.isLiveDevice) {
      cityTime.hour = getDeviceHour();
    } else if (cityTime.isPlaying) {
      cityTime.hour = (cityTime.hour + (dt / cityTime.cycleDurationSec) * 24 * cityTime.speed) % 24;
    }

    // 2. Throttle sync to React HUD state (every 120ms)
    const now = performance.now();
    if (now - lastSyncTime.current > 120) {
      lastSyncTime.current = now;
      useTimeStore.getState().syncFromSimulation(cityTime.hour);
    }

    const hour = cityTime.hour;
    const sky = sampleSky(hour);
    const { darkness, isNight } = getTimePhase(hour);

    // 3. Compute Sun & Moon coordinates in world space
    // 6h = Sunrise (East = +X), 12h = Noon (Zenith = +Y), 18h = Sunset (West = -X), 24h = Midnight (-Y)
    const solarAngle = ((hour - 6) / 24) * Math.PI * 2;
    const cosA = Math.cos(solarAngle);
    const sinA = Math.sin(solarAngle);
    const celestialRadius = 360;

    // Sun position
    const sunX = center[0] + cosA * celestialRadius;
    const sunY = sinA * celestialRadius;
    const sunZ = center[1] + sinA * 70; // slight orbital tilt

    // Moon position (opposite the Sun)
    const moonAngle = solarAngle + Math.PI;
    const moonCos = Math.cos(moonAngle);
    const moonSin = Math.sin(moonAngle);
    const moonX = center[0] + moonCos * celestialRadius;
    const moonY = moonSin * celestialRadius;
    const moonZ = center[1] + moonSin * 70;

    // 4. Directional Light: Sun during Day, Moon during Night
    const l = dirLightRef.current;
    if (l) {
      if (sunY > -10) {
        // Sun is primary light source casting daytime / sunset shadows
        const clampedY = Math.max(16, sunY); // ensure low-angle sunrise/sunset still casts long horizontal shadows
        l.position.set(sunX, clampedY, sunZ);
        l.color.copy(sky.sunCol);
        l.intensity = sky.sunInt;
      } else {
        // Moon is primary light source casting nighttime moonlight shadows
        const clampedY = Math.max(24, moonY);
        l.position.set(moonX, clampedY, moonZ);
        l.color.copy(sky.sunCol);
        l.intensity = sky.sunInt;
      }
      l.target.position.set(center[0], 0, center[1]);
      l.target.updateMatrixWorld();
    }

    // 5. Hemisphere Ambient Light smoothly changes
    const h = hemiLightRef.current;
    if (h) {
      h.color.copy(sky.hemiSky);
      h.groundColor.copy(sky.hemiGnd);
      h.intensity = sky.hemiInt;
    }

    // 6. Dynamic Building Lights & Street Lamp Emissives
    // When darkness > 0.15, lamp posts and building windows turn on
    const lampMat = solid('lampHead');
    const glowMat = solid('glow');
    if (lampMat) {
      if (darkness > 0.1) {
        lampMat.emissiveIntensity = 1.0 + darkness * 2.8;
        lampMat.emissive.set('#ffcf56');
        lampMat.color.set('#ffea88');
      } else {
        lampMat.emissiveIntensity = 0.2;
        lampMat.emissive.set('#94a3b8');
        lampMat.color.set('#cbd5e1');
      }
    }
    if (glowMat) {
      if (darkness > 0.1) {
        glowMat.emissiveIntensity = 0.6 + darkness * 2.2;
        glowMat.emissive.set('#f59e0b');
        glowMat.color.set('#fde68a');
      } else {
        glowMat.emissiveIntensity = 0.35;
        glowMat.emissive.set('#e2e8f0');
        glowMat.color.set('#f8fafc');
      }
    }
  });

  return (
    <>
      <hemisphereLight ref={hemiLightRef} args={['#d6e6f3', '#e2d6bf', 0.85]} />
      <directionalLight
        ref={dirLightRef}
        position={[250, 180, 50]}
        intensity={2.3}
        color="#fffbf0"
        castShadow={S > 0}
        shadow-mapSize={[S || 2048, S || 2048]}
        shadow-camera-left={-span}
        shadow-camera-right={span}
        shadow-camera-top={span}
        shadow-camera-bottom={-span}
        shadow-camera-near={5}
        shadow-camera-far={950}
        shadow-bias={-0.0004}
        shadow-normalBias={0.05}
        shadow-radius={2.5}
      />
    </>
  );
}

// -------------------------------------------------------------
// Fluffy Animated Clouds that catch sunlight and sunset glow
// -------------------------------------------------------------
function Clouds() {
  const g = useRef<THREE.Group>(null);
  const cloudMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#ffffff',
    emissive: '#f1f5f9',
    emissiveIntensity: 0.35,
    flatShading: true,
    fog: false,
  }), []);

  const items = useMemo(() => {
    let s = 11;
    const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    const o: { p: [number, number, number]; s: number }[] = [];
    for (let i = 0; i < 22; i++) {
      const a = r() * 6.283;
      const d = 260 + r() * 380;
      const y = 140 + r() * 70;
      const cx = Math.cos(a) * d;
      const cz = Math.sin(a) * d;
      for (let k = 0; k < 5; k++) {
        o.push({
          p: [cx + (k - 2) * 16 + r() * 8, y + (k % 2) * 4 + r() * 3, cz + r() * 12],
          s: 12 + r() * 10 - Math.abs(k - 2) * 1.8,
        });
      }
    }
    return o;
  }, []);

  useFrame((_, dt) => {
    if (g.current) g.current.rotation.y += dt * 0.003;
    if (cloudMat) {
      const sky = sampleSky(cityTime.hour);
      const { darkness } = getTimePhase(cityTime.hour);
      if (darkness > 0.35) {
        // Subtle deep night clouds
        cloudMat.color.set('#0b101c');
        cloudMat.emissive.set('#04070e');
        cloudMat.emissiveIntensity = 0.02;
      } else {
        cloudMat.color.copy(sky.hor).lerp(sky.top, 0.4);
        cloudMat.emissive.copy(sky.sunCol);
        cloudMat.emissiveIntensity = Math.max(0.04, 0.45 * (1 - darkness * 0.9));
      }
    }
  });

  return (
    <group ref={g}>
      {items.map((c, i) => (
        <mesh key={i} position={c.p} scale={[c.s * 1.6, c.s * 0.75, c.s]} material={cloudMat}>
          <icosahedronGeometry args={[1, 1]} />
        </mesh>
      ))}
    </group>
  );
}

// -------------------------------------------------------------
// Celestial Sun & Moon 3D Bodies in Sky
// -------------------------------------------------------------
function CelestialBodies() {
  const sunMesh = useRef<THREE.Mesh>(null);
  const moonMesh = useRef<THREE.Mesh>(null);
  const starsRef = useRef<THREE.Points>(null);

  // 800 twinkling stars in the celestial dome
  const [starGeo, starMat] = useMemo(() => {
    const count = 900;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 840;
      // Only in upper hemisphere
      const y = Math.abs(r * Math.cos(phi)) + 60;
      const x = r * Math.sin(phi) * Math.cos(theta);
      const z = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const m = new THREE.PointsMaterial({
      color: '#ffffff',
      size: 2.8,
      transparent: true,
      opacity: 0.0,
      fog: false,
      depthWrite: false,
    });
    return [g, m];
  }, []);

  useFrame(() => {
    const hour = cityTime.hour;
    const solarAngle = ((hour - 6) / 24) * Math.PI * 2;
    const r = 680;

    // Sun position
    const sx = Math.cos(solarAngle) * r;
    const sy = Math.sin(solarAngle) * r;
    const sz = Math.sin(solarAngle) * 120;
    if (sunMesh.current) {
      sunMesh.current.position.set(sx, sy, sz);
      sunMesh.current.visible = sy > -50;
    }

    // Moon position
    const moonAngle = solarAngle + Math.PI;
    const mx = Math.cos(moonAngle) * r;
    const my = Math.sin(moonAngle) * r;
    const mz = Math.sin(moonAngle) * 120;
    if (moonMesh.current) {
      moonMesh.current.position.set(mx, my, mz);
      moonMesh.current.visible = my > -50;
    }

    // Stars visibility fades in during dusk and night
    const { darkness } = getTimePhase(hour);
    starMat.opacity = Math.max(0, (darkness - 0.25) * 1.33);
  });

  return (
    <>
      {/* 3D Sun */}
      <mesh ref={sunMesh} renderOrder={-5}>
        <sphereGeometry args={[24, 20, 20]} />
        <meshBasicMaterial color="#fff3cc" fog={false} depthWrite={false} />
      </mesh>

      {/* 3D Moon with soft lunar halo */}
      <mesh ref={moonMesh} renderOrder={-5}>
        <sphereGeometry args={[18, 20, 20]} />
        <meshBasicMaterial color="#e2e8f0" fog={false} depthWrite={false} />
      </mesh>

      {/* Starfield */}
      <points ref={starsRef} geometry={starGeo} material={starMat} renderOrder={-6} />
    </>
  );
}

// -------------------------------------------------------------
// Dynamic Sky Dome & Fog
// -------------------------------------------------------------
export function SkyDome() {
  const dome = useRef<THREE.Mesh>(null);
  const fogRef = useRef<THREE.Fog>(null);
  const { camera, scene } = useThree();

  const [geo, colorAttr] = useMemo(() => {
    const g = new THREE.SphereGeometry(880, 28, 18);
    const p = g.attributes.position;
    const cols = new Float32Array(p.count * 3);
    g.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    return [g, g.attributes.color as THREE.BufferAttribute];
  }, []);

  useFrame(() => {
    if (dome.current) dome.current.position.copy(camera.position);

    const sky = sampleSky(cityTime.hour);
    const p = geo.attributes.position;
    const cols = colorAttr.array as Float32Array;
    const c = new THREE.Color();

    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i);
      const t = Math.max(0, Math.min(1, y / 880));
      // Gradient: Horizon -> Mid -> Top
      if (t < 0.45) {
        c.copy(sky.hor).lerp(sky.mid, t / 0.45);
      } else {
        c.copy(sky.mid).lerp(sky.top, (t - 0.45) / 0.55);
      }
      cols[i * 3] = c.r;
      cols[i * 3 + 1] = c.g;
      cols[i * 3 + 2] = c.b;
    }
    colorAttr.needsUpdate = true;

    // Atmospheric Fog matches horizon color
    if (scene.fog) {
      scene.fog.color.copy(sky.fogCol);
    }
  });

  return (
    <>
      <mesh ref={dome} geometry={geo} renderOrder={-10}>
        <meshBasicMaterial vertexColors side={THREE.BackSide} fog={false} depthWrite={false} />
      </mesh>
      <fog ref={fogRef} attach="fog" args={['#cde0f0', 200, 1150]} />
      <CelestialBodies />
      <Clouds />
    </>
  );
}

// -------------------------------------------------------------
// Post-Processing Camera Effects (Bloom, SSAO, Vignette)
// -------------------------------------------------------------
export function Effects({ q }: { q: Quality }) {
  const Q = QUALITY[q];
  if (!Q.post) return null;
  return (
    <EffectComposer multisampling={q === 'high' ? 4 : 0} enableNormalPass={Q.ssao}>
      {Q.ssao ? (
        <SSAO
          samples={14}
          radius={0.07}
          intensity={12}
          luminanceInfluence={0.7}
          bias={0.03}
          worldDistanceThreshold={0.1}
          worldDistanceFalloff={0.0}
          worldProximityThreshold={0.1}
          worldProximityFalloff={0.0}
        />
      ) : <></>}
      <Bloom intensity={0.25} luminanceThreshold={0.88} luminanceSmoothing={0.25} mipmapBlur />
      <Vignette eskil={false} offset={0.3} darkness={0.38} />
    </EffectComposer>
  );
}
