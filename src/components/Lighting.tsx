'use client';
import * as THREE from 'three';
import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, SSAO } from '@react-three/postprocessing';
import { QUALITY, Quality } from '@/lib/state';

/** Soft late-morning sun: high enough for short, gentle shadows. */
export const SUN = new THREE.Vector3(-0.5, 0.78, 0.38).normalize();

export function SceneLighting({ q, span = 85, center = [0, 0] }: { q: Quality; span?: number; center?: [number, number] }) {
  const S = QUALITY[q].shadow, light = useRef<THREE.DirectionalLight>(null);
  const pos = SUN.clone().multiplyScalar(170).add(new THREE.Vector3(center[0], 0, center[1])).toArray() as [number, number, number];
  useLayoutEffect(() => { const l = light.current; if (l) { l.target.position.set(center[0], 0, center[1]); l.target.updateMatrixWorld(); } }, [center[0], center[1]]);
  return (
    <>
      <hemisphereLight args={['#d6e6f3', '#e2d6bf', 0.82]} />
      <directionalLight ref={light} position={pos} intensity={2.25} color="#fff0d2" castShadow={S > 0}
        shadow-mapSize={[S || 512, S || 512]} shadow-camera-left={-span} shadow-camera-right={span} shadow-camera-top={span} shadow-camera-bottom={-span}
        shadow-camera-near={1} shadow-camera-far={520} shadow-bias={-0.0006} shadow-normalBias={0.06} shadow-radius={3} />
      <Environment resolution={128} frames={1}>
        <Lightformer form="rect" intensity={1.4} color="#ffffff" position={[0, 30, 0]} rotation-x={Math.PI / 2} scale={[60, 60, 1]} />
        <Lightformer form="rect" intensity={1.0} color="#ffe9c4" position={[-30, 10, 10]} scale={[40, 20, 1]} />
        <Lightformer form="rect" intensity={0.8} color="#cfe8ff" position={[30, 8, -20]} scale={[40, 16, 1]} />
      </Environment>
    </>
  );
}

function Clouds() {
  const g = useRef<THREE.Group>(null);
  const items = useMemo(() => {
    let s = 11; const r = () => ((s = (s * 16807) % 2147483647) / 2147483647); const o: { p: [number, number, number]; s: number }[] = [];
    for (let i = 0; i < 20; i++) { const a = r() * 6.283, d = 240 + r() * 360, y = 120 + r() * 70, cx = Math.cos(a) * d, cz = Math.sin(a) * d; for (let k = 0; k < 5; k++) o.push({ p: [cx + (k - 2) * 14 + r() * 8, y + (k % 2) * 4 + r() * 3, cz + r() * 12], s: 11 + r() * 9 - Math.abs(k - 2) * 1.6 }); }
    return o;
  }, []);
  useFrame((_, dt) => { if (g.current) g.current.rotation.y += dt * 0.004; });
  return <group ref={g}>{items.map((c, i) => <mesh key={i} position={c.p} scale={[c.s * 1.5, c.s * 0.75, c.s]}><icosahedronGeometry args={[1, 1]} /><meshStandardMaterial color="#ffffff" emissive="#dce9f5" emissiveIntensity={0.42} flatShading fog={false} /></mesh>)}</group>;
}

export function SkyDome() {
  const dome = useRef<THREE.Mesh>(null), { camera } = useThree();
  const geo = useMemo(() => {
    const g = new THREE.SphereGeometry(900, 24, 14), p = g.attributes.position, cols: number[] = [], top = new THREE.Color('#4a94d4'), mid = new THREE.Color('#86bde6'), hor = new THREE.Color('#d3e6f4'), c = new THREE.Color();
    for (let i = 0; i < p.count; i++) { const t = Math.max(0, p.getY(i) / 900); c.copy(hor).lerp(mid, Math.min(1, t * 2.4)).lerp(top, Math.max(0, t * 1.6 - 0.35)); cols.push(c.r, c.g, c.b); }
    g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3)); return g;
  }, []);
  useFrame(() => { dome.current?.position.copy(camera.position); });
  return (
    <>
      <mesh ref={dome} geometry={geo} renderOrder={-10}><meshBasicMaterial vertexColors side={THREE.BackSide} fog={false} depthWrite={false} /></mesh>
      <fog attach="fog" args={['#cde0f0', 200, 1100]} />
      <Clouds />
    </>
  );
}

export function Effects({ q }: { q: Quality }) {
  const Q = QUALITY[q]; if (!Q.post) return null;
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
      <Bloom intensity={0.12} luminanceThreshold={1.0} luminanceSmoothing={0.2} mipmapBlur />
      <Vignette eskil={false} offset={0.3} darkness={0.36} />
    </EffectComposer>
  );
}
