'use client';
import { useEffect, useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { QUALITY, useUI } from '@/lib/state';
import { mat, sbox, solid } from '@/lib/materials';
import { CELL, GRID } from '@/lib/plots';
import type { StoreConfig, Mod } from '@/lib/types';
import { BuildingFull, ModularBuilding, cellPos, applyPlace, eraseTop, B } from './Building';
import { SceneLighting, SkyDome, Effects } from './Lighting';
import { JEnterprise } from './JEnterprise';
import { Bungalow } from './Bungalow';
import { CentralBuildingLOD } from './CentralBuilding';

export type Tool = { kind: Mod['kind'] | 'erase' | 'rotate'; rot: number };

function Ground() {
  const asphalt = useMemo(() => mat('asphalt', '#fff', 5, 2.5, 0.25), []), pave = useMemo(() => mat('pave'), []), grass = useMemo(() => mat('grass', '#fff', 60, 60), []);
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow material={grass}><circleGeometry args={[300, 48]} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 14]} receiveShadow material={asphalt}><planeGeometry args={[40, 10]} /></mesh>
      <mesh geometry={sbox(40, 0.14, 3)} position={[0, 0.07, 7.5]} material={pave} receiveShadow />
      <mesh geometry={sbox(12, 0.06, 6)} position={[0, 0.03, -3]} material={solid('gravel')} receiveShadow />
      {[-12, 12].map(x => <mesh key={x} geometry={sbox(12, 0.1, 12)} position={[x, 0.05, 0]} material={pave} receiveShadow />)}
    </>
  );
}

function Grid({ cfg, tool, setCfg, onMsg }: { cfg: StoreConfig; tool: Tool; setCfg: (c: StoreConfig) => void; onMsg: (m: string) => void }) {
  const [hover, setHover] = useState<[number, number] | null>(null);
  const act = (gx: number, gz: number) => {
    if (tool.kind === 'erase') return setCfg({ ...cfg, modules: eraseTop(cfg.modules, gx, gz) });
    if (tool.kind === 'rotate') return setCfg({ ...cfg, modules: cfg.modules.map(m => { const top = cfg.modules.filter(q => q.gx === gx && q.gz === gz).pop(); return top && m.id === top.id ? { ...m, rot: (m.rot + 1) % 4 } : m; }) });
    const r = applyPlace(cfg.modules, tool.kind, gx, gz, tool.rot); if (r.error) onMsg(r.error); else { onMsg(''); setCfg({ ...cfg, modules: r.mods }); }
  };
  const cells = [];
  for (let gx = 0; gx < GRID; gx++) for (let gz = 0; gz < GRID; gz++) {
    const [x, z] = cellPos(gx, gz), on = hover && hover[0] === gx && hover[1] === gz;
    cells.push(
      <mesh key={gx + '-' + gz} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.05, z]}
        onPointerMove={e => { e.stopPropagation(); setHover([gx, gz]); }} onPointerOut={() => setHover(null)} onClick={e => { if (e.delta > 4) return; e.stopPropagation(); act(gx, gz); }}>
        <planeGeometry args={[CELL - 0.06, CELL - 0.06]} /><meshBasicMaterial color={on ? '#22d3ee' : '#4aa3ff'} transparent opacity={on ? 0.55 : 0.14} depthWrite={false} />
      </mesh>
    );
  }
  return <group>{cells}</group>;
}

export default function EditorCanvas({ cfg, setCfg, tool, showGrid, onMsg }: { cfg: StoreConfig; setCfg: (c: StoreConfig) => void; tool: Tool; showGrid: boolean; onMsg: (m: string) => void }) {
  const quality = useUI(s => s.quality), Q = QUALITY[quality];
  useEffect(() => { useUI.getState().init(); }, []);
  const modular = cfg.mode === 'modular';
  const hover = (kind: 'hover' | 'click', gx: number, gz: number) => {
    if (kind !== 'click') return;
    if (tool.kind === 'erase') setCfg({ ...cfg, modules: eraseTop(cfg.modules, gx, gz) });
    else if (tool.kind === 'rotate') { const top = cfg.modules.filter(m => m.gx === gx && m.gz === gz).pop(); if (top) setCfg({ ...cfg, modules: cfg.modules.map(m => (m.id === top.id ? { ...m, rot: (m.rot + 1) % 4 } : m)) }); }
    else { const r = applyPlace(cfg.modules, tool.kind, gx, gz, tool.rot); if (r.error) onMsg(r.error); else { onMsg(''); setCfg({ ...cfg, modules: r.mods }); } }
  };
  return (
    <Canvas key={quality} shadows={Q.shadow > 0} dpr={Q.dpr} camera={{ fov: 38, position: [17, 11, 20], near: 0.1, far: 1400 }} gl={{ antialias: !Q.post }}
      onCreated={({ gl }) => { gl.toneMapping = THREE.NoToneMapping; }}>
      <SkyDome /><SceneLighting q={quality} span={26} />
      <Ground />
      <group position={[0, 0, 0]}>
        {modular ? <ModularBuilding cfg={cfg} onCell={hover} /> : cfg.template === 'jenterprise' ? <group position={[0, 0, -4]}><JEnterprise /></group> : cfg.template === 'bungalow' ? <Bungalow cfg={cfg} /> : cfg.template === 'central' ? <CentralBuildingLOD cfg={cfg} /> : <BuildingFull cfg={cfg} quality={Q.interiors} />}
        {modular && showGrid && <Grid cfg={cfg} tool={tool} setCfg={setCfg} onMsg={onMsg} />}
      </group>
      <OrbitControls target={[0, 3, 0]} maxPolarAngle={Math.PI / 2 - 0.04} minDistance={8} maxDistance={45} enablePan={false} />
      <Effects q={quality} />
    </Canvas>
  );
}
