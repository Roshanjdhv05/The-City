'use client';
import * as THREE from 'three';
import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { player, useUI } from '@/lib/state';
import type { Collider } from '@/lib/plots';
import type { Rect } from '@/lib/layout';
import type { Terrain } from '@/lib/terrain';
import { stepBody, PHYS, Body } from '@/lib/physics';
import { ResNode, nearestResource, collect, inventory, RES_LABEL } from '@/lib/resources';
import { useMultiplayer, broadcastPlayerPosition } from '@/lib/multiplayer';
import { HumanoidAvatar } from './HumanoidAvatar';

const F = (c: string) => <meshStandardMaterial color={c} flatShading roughness={0.9} />;

/** Free-fly camera state (velocity only) */
const fly = { vx: 0, vy: 0, vz: 0 };
const FLY_SPEED = 32;   // m/s normal
const FLY_FAST  = 90;   // m/s with Shift
const FLY_ACCEL = 14;   // acceleration
const FLY_DRAG  = 10;   // drag

export function Player({ colliders, doors, bounds, terrain, resources }: { colliders: Collider[]; doors: { id: string; x: number; z: number; r?: number }[]; bounds: Rect; terrain: Terrain; resources: ResNode[] }) {
  const root = useRef<THREE.Group>(null), body = useRef<THREE.Group>(null), legL = useRef<THREE.Group>(null), legR = useRef<THREE.Group>(null), armL = useRef<THREE.Group>(null), armR = useRef<THREE.Group>(null);
  const keys = useRef<Record<string, boolean>>({}), { camera, gl } = useThree(), t = useRef(0), near = useRef<string | null>(null), nearRes = useRef<string | null>(null), tmp = useRef(new THREE.Vector3());
  const live = useRef({ resources, terrain }); live.current = { resources, terrain };
  const { myName, myColor } = useMultiplayer();

  useEffect(() => {
    const el = gl.domElement; let drag = false;
    const lastShift = { t: 0 };
    const kd = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return; keys.current[e.code] = true;
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') { const now = Date.now(); if (now - lastShift.t < 320) keys.current['Sprint'] = true; lastShift.t = now; }
      if (e.code === 'Space') e.preventDefault();
      // Prevent arrow keys from scrolling page (all camera modes use them for look)
      if (e.code.startsWith('Arrow')) e.preventDefault();
      // V cycles 1p → 3p → free → 1p
      if (e.code === 'KeyV') {
        const cur = useUI.getState().view;
        useUI.getState().setView(cur === '1p' ? '3p' : cur === '3p' ? 'free' : '1p');
      }
      if (e.code === 'KeyF') { const n = nearestResource(live.current.resources, player.x, player.z); if (n && collect(n)) { useUI.getState().setInv({ ...inventory }); useUI.getState().setNearRes(null); nearRes.current = null; } }
    };
    const ku = (e: KeyboardEvent) => { keys.current[e.code] = false; if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') keys.current['Sprint'] = false; };
    const md = () => {
      drag = true;
      const v = useUI.getState().view;
      if ((v === '1p' || v === 'free') && !document.pointerLockElement) el.requestPointerLock?.();
    };
    const mu = () => { drag = false; };
    const mm = (e: MouseEvent) => {
      if (!drag && document.pointerLockElement !== el) return;
      const sens = useUI.getState().sensitivity || 1.0;
      player.yaw -= e.movementX * 0.0035 * sens;
      const fp = useUI.getState().view !== '3p';
      player.pitch = THREE.MathUtils.clamp(player.pitch + (fp ? -1 : 1) * e.movementY * 0.003 * sens, fp ? -1.45 : -0.12, fp ? 1.45 : 1.25);
    };
    const wheel = (e: WheelEvent) => { if (useUI.getState().view === '3p') { e.preventDefault(); player.camDist = THREE.MathUtils.clamp(player.camDist + e.deltaY * 0.012, 3.5, 22); } };
    window.addEventListener('keydown', kd); window.addEventListener('keyup', ku); el.addEventListener('mousedown', md); window.addEventListener('mouseup', mu); window.addEventListener('mousemove', mm); el.addEventListener('wheel', wheel, { passive: false });
    
    // Multi-touch Camera Rotation (Touch Drag on Right Side)
    let lookTouchId: number | null = null;
    let lastTouchPos: { x: number; y: number } | null = null;
    const ts = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        if (lookTouchId === null && (t.clientX > window.innerWidth * 0.32 || t.clientY < window.innerHeight - 160)) {
          lookTouchId = t.identifier;
          lastTouchPos = { x: t.clientX, y: t.clientY };
          break;
        }
      }
    };
    const tm = (e: TouchEvent) => {
      if (lookTouchId === null || !lastTouchPos) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        if (t.identifier === lookTouchId) {
          const sens = useUI.getState().sensitivity || 1.0;
          const dx = t.clientX - lastTouchPos.x;
          const dy = t.clientY - lastTouchPos.y;
          player.yaw -= dx * 0.0055 * sens;
          const fp = useUI.getState().view !== '3p';
          player.pitch = THREE.MathUtils.clamp(
            player.pitch + (fp ? -1 : 1) * dy * 0.0045 * sens,
            fp ? -1.45 : -0.12,
            fp ? 1.45 : 1.25
          );
          lastTouchPos = { x: t.clientX, y: t.clientY };
          break;
        }
      }
    };
    const te = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === lookTouchId) {
          lookTouchId = null;
          lastTouchPos = null;
          break;
        }
      }
    };
    el.addEventListener('touchstart', ts, { passive: true });
    el.addEventListener('touchmove', tm, { passive: true });
    el.addEventListener('touchend', te, { passive: true });
    el.addEventListener('touchcancel', te, { passive: true });

    return () => {
      window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku);
      el.removeEventListener('mousedown', md); window.removeEventListener('mouseup', mu);
      window.removeEventListener('mousemove', mm); el.removeEventListener('wheel', wheel);
      el.removeEventListener('touchstart', ts); el.removeEventListener('touchmove', tm);
      el.removeEventListener('touchend', te); el.removeEventListener('touchcancel', te);
      if (document.pointerLockElement === el) document.exitPointerLock();
    };
  }, [gl]);

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05), k = keys.current, ui = useUI.getState(), th = live.current.terrain;
    const isFree = ui.view === 'free';
    const fp = ui.view === '1p';

    if (player.teleport) { Object.assign(player, { x: player.teleport.x, z: player.teleport.z, yaw: player.teleport.yaw, vx: 0, vz: 0, vy: 0, y: th.height(player.teleport.x, player.teleport.z) + PHYS.feet, onGround: true }); player.teleport = null; }

    if (isFree) {
      // ── Free-fly physics ──────────────────────────────────────────
      const mIn = player.moveInput || { f: 0, s: 0, run: false, jump: false, up: false, down: false };
      const fast = !!(k.ShiftLeft || k.ShiftRight || mIn.run);
      const targetSpeed = fast ? FLY_FAST : FLY_SPEED;

      // Arrow keys → look (yaw / pitch) in free-fly mode
      const LOOK_SPEED = 1.6; // rad/s
      if (k.ArrowLeft)  player.yaw   += LOOK_SPEED * dt;
      if (k.ArrowRight) player.yaw   -= LOOK_SPEED * dt;
      if (k.ArrowUp)    player.pitch  = THREE.MathUtils.clamp(player.pitch + LOOK_SPEED * dt, -1.45, 1.45);
      if (k.ArrowDown)  player.pitch  = THREE.MathUtils.clamp(player.pitch - LOOK_SPEED * dt, -1.45, 1.45);

      // WASD / Touch Joystick → movement along the look direction
      const fwd = THREE.MathUtils.clamp((k.KeyW ? 1 : 0) - (k.KeyS ? 1 : 0) + mIn.f, -1, 1);
      const str = THREE.MathUtils.clamp((k.KeyD ? 1 : 0) - (k.KeyA ? 1 : 0) + mIn.s, -1, 1);
      const up  = THREE.MathUtils.clamp((k.Space || k.KeyE ? 1 : 0) - (k.KeyQ || k.ControlLeft ? 1 : 0) + (mIn.up ? 1 : 0) - (mIn.down ? 1 : 0), -1, 1);

      const sy = Math.sin(player.yaw), cy = Math.cos(player.yaw);
      const sp = Math.sin(player.pitch), cp = Math.cos(player.pitch);

      // Desired world-space velocity
      const wx = sy * cp * fwd * targetSpeed - cy * str * targetSpeed;
      const wy = -sp * fwd * targetSpeed + up * targetSpeed;
      const wz = cy * cp * fwd * targetSpeed + sy * str * targetSpeed;

      const acc = FLY_ACCEL * dt;
      const drag = Math.exp(-FLY_DRAG * dt);
      fly.vx = fly.vx * drag + (wx - fly.vx * drag) * Math.min(1, acc / targetSpeed * 6);
      fly.vy = fly.vy * drag + (wy - fly.vy * drag) * Math.min(1, acc / targetSpeed * 6);
      fly.vz = fly.vz * drag + (wz - fly.vz * drag) * Math.min(1, acc / targetSpeed * 6);

      player.x += fly.vx * dt;
      player.y += fly.vy * dt;
      player.z += fly.vz * dt;
      player.y = Math.max(player.y, th.height(player.x, player.z) + 0.4); // don't clip underground

      // Camera follows the free-fly eye exactly (1p view)
      const sdir = Math.sin(player.yaw), cdir = Math.cos(player.yaw);
      camera.position.set(player.x, player.y + 1.6, player.z);
      camera.lookAt(
        player.x + sdir * Math.cos(player.pitch),
        player.y + 1.6 + Math.sin(player.pitch),
        player.z + cdir * Math.cos(player.pitch),
      );
    } else {
      // ── Normal grounded physics (WASD + Joystick support) ───────────
      const mIn = player.moveInput || { f: 0, s: 0, run: false, jump: false, up: false, down: false };
      const fwd = THREE.MathUtils.clamp((k.KeyW ? 1 : 0) - (k.KeyS ? 1 : 0) + mIn.f, -1, 1);
      const str = THREE.MathUtils.clamp((k.KeyD ? 1 : 0) - (k.KeyA ? 1 : 0) + mIn.s, -1, 1);
      const run = !!(k.ShiftLeft || k.ShiftRight || mIn.run);
      const jump = !!(k.Space || mIn.jump);

      const LOOK_SPD = 1.6; // rad/s
      if (!fp) {
        // 3P: arrows rotate camera orbit; WASD/Joystick moves character
        if (k.ArrowLeft)  player.yaw   += LOOK_SPD * dt;
        if (k.ArrowRight) player.yaw   -= LOOK_SPD * dt;
        if (k.ArrowUp)    player.pitch  = THREE.MathUtils.clamp(player.pitch + LOOK_SPD * dt * 0.6, -0.12, 1.25);
        if (k.ArrowDown)  player.pitch  = THREE.MathUtils.clamp(player.pitch - LOOK_SPD * dt * 0.6, -0.12, 1.25);
        stepBody(player as unknown as Body, { f: fwd, s: str, run, sprint: !!k['Sprint'], jump, speedMult: ui.walkSpeed }, dt, { colliders, height: th.height, bounds });
      } else {
        // 1P: arrows look, WASD/Joystick moves
        if (k.ArrowLeft)  player.yaw   += LOOK_SPD * dt;
        if (k.ArrowRight) player.yaw   -= LOOK_SPD * dt;
        if (k.ArrowUp)    player.pitch  = THREE.MathUtils.clamp(player.pitch + LOOK_SPD * dt, -1.3, 1.3);
        if (k.ArrowDown)  player.pitch  = THREE.MathUtils.clamp(player.pitch - LOOK_SPD * dt, -1.3, 1.3);
        stepBody(player as unknown as Body, { f: fwd, s: str, run, sprint: !!k['Sprint'], jump, speedMult: ui.walkSpeed }, dt, { colliders, height: th.height, bounds });
      }
      if (player.moving && player.onGround) t.current += dt * (Math.hypot(player.vx, player.vz) > 6.5 ? 12 : 8);
    }

    // Door & resource proximity (run in both modes)
    let best: string | null = null, bd = 1e9;
    for (const dr of doors) { const d = Math.hypot(player.x - dr.x, player.z - dr.z); if (d < (dr.r ?? 6.5) && d < bd) { bd = d; best = dr.id; } }
    if (best !== near.current) { near.current = best; ui.setNear(best); }
    const rn = nearestResource(live.current.resources, player.x, player.z)?.id ?? null;
    if (rn !== nearRes.current) { nearRes.current = rn; const n = rn ? live.current.resources.find(x => x.id === rn)! : null; ui.setNearRes(n ? { id: n.id, type: RES_LABEL[n.type] } : null); }

    const g = root.current!;
    g.visible = !fp && !isFree;  // hide character in both 1p and free-fly
    g.position.set(player.x, player.y, player.z); g.rotation.y = player.heading;
    const sw = player.moving && player.onGround ? Math.sin(t.current) * 0.75 : 0, air = !player.onGround;
    if (legL.current) { legL.current.rotation.x = air ? 0.5 : sw; legR.current!.rotation.x = air ? -0.4 : -sw; armL.current!.rotation.x = air ? -2.4 : -sw * 0.8; armR.current!.rotation.x = air ? -2.4 : sw * 0.8; }
    if (body.current) body.current.position.y = player.moving && player.onGround ? Math.abs(Math.sin(t.current)) * 0.05 : 0;

    if (!isFree) {
      const sdir = Math.sin(player.yaw), cdir = Math.cos(player.yaw);
      if (fp) {
        camera.position.lerp(tmp.current.set(player.x, player.y + 1.6, player.z), 1 - Math.exp(-30 * dt));
        camera.lookAt(player.x + sdir * Math.cos(player.pitch), player.y + 1.6 + Math.sin(player.pitch), player.z + cdir * Math.cos(player.pitch));
      } else {
        const d = player.camDist, tx = player.x, ty = player.y + 1.45, tz = player.z;
        tmp.current.set(tx - sdir * Math.cos(player.pitch) * d, ty + Math.sin(player.pitch) * d + 0.8, tz - cdir * Math.cos(player.pitch) * d);
        tmp.current.y = Math.max(tmp.current.y, th.height(tmp.current.x, tmp.current.z) + 0.7);
        camera.position.lerp(tmp.current, 1 - Math.exp(-10 * dt)); camera.lookAt(tx, ty + 0.25, tz);
      }
    }

    // Broadcast local player position to other visitors
    broadcastPlayerPosition(player.x, player.y, player.z, player.heading, player.moving, myName, myColor);
  });

  // chunky low-poly character with custom color & nametag
  return (
    <group ref={root}>
      {/* ── 3D Floating Name Tag Above Character in 3P ── */}
      <Html position={[0, 1.95, 0]} center distanceFactor={60} zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '2px',
            background: 'rgba(10, 16, 30, 0.65)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            border: `0.75px solid ${myColor}99`,
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
              backgroundColor: myColor,
              boxShadow: `0 0 3px ${myColor}`,
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
            {myName} (You)
          </span>
        </div>
      </Html>

      {/* ── Humanoid Character Avatar ── */}
      <HumanoidAvatar
        color={myColor || '#2bb689'}
        isMoving={() => player.moving && player.onGround}
        showGroundRing={true}
      />
    </group>
  );
}
