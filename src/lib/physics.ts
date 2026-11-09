import type { Collider } from './plots';
import type { Rect } from './layout';
import { WATER_Y } from './terrain';

export interface Body { x: number; y: number; z: number; vx: number; vz: number; vy: number; yaw: number; heading: number; onGround: boolean; inWater: boolean; moving: boolean }
export interface Input { f: number; s: number; run: boolean; jump: boolean; sprint: boolean; speedMult?: number }
export interface Ctx { colliders: Collider[]; height: (x: number, z: number) => number; bounds: Rect }
export const PHYS = { walk: 4.8, run: 9.2, sprint: 18, jumpV: 8.8, gravity: 26, radius: 0.45, maxSlope: 1.3, waterSlow: 0.55, feet: 0.1 };

function collide(b: Body, cols: Collider[]) {
  const R = PHYS.radius;
  for (const c of cols) {
    if (c.t === 'box') {
      const cx = Math.min(c.x1, Math.max(c.x0, b.x)), cz = Math.min(c.z1, Math.max(c.z0, b.z)), dx = b.x - cx, dz = b.z - cz, d2 = dx * dx + dz * dz;
      if (d2 < R * R) {
        if (d2 > 1e-6) { const d = Math.sqrt(d2); b.x = cx + (dx / d) * R; b.z = cz + (dz / d) * R; }
        else { const m = [b.x - c.x0, c.x1 - b.x, b.z - c.z0, c.z1 - b.z], i = m.indexOf(Math.min(...m)); if (i === 0) b.x = c.x0 - R; else if (i === 1) b.x = c.x1 + R; else if (i === 2) b.z = c.z0 - R; else b.z = c.z1 + R; }
      }
    } else if (c.t === 'obb') {
      const dx = b.x - c.cx, dz = b.z - c.cz, lx = dx * c.c - dz * c.s, lz = dx * c.s + dz * c.c, px = Math.min(c.hw, Math.max(-c.hw, lx)), pz = Math.min(c.hd, Math.max(-c.hd, lz));
      let ox = lx - px, oz = lz - pz; const d2 = ox * ox + oz * oz;
      if (d2 < R * R) {
        let nx: number, nz: number;
        if (d2 > 1e-6) { const d = Math.sqrt(d2); nx = px + (ox / d) * R; nz = pz + (oz / d) * R; }
        else { const m = [lx + c.hw, c.hw - lx, lz + c.hd, c.hd - lz], i = m.indexOf(Math.min(...m)); nx = lx; nz = lz; if (i === 0) nx = -c.hw - R; else if (i === 1) nx = c.hw + R; else if (i === 2) nz = -c.hd - R; else nz = c.hd + R; }
        b.x = c.cx + nx * c.c + nz * c.s; b.z = c.cz - nx * c.s + nz * c.c;
      }
    } else {
      const mn = c.r + R;
      const dx = b.x - c.x;
      if (dx > mn || dx < -mn) continue;
      const dz = b.z - c.z;
      if (dz > mn || dz < -mn) continue;
      const d = Math.hypot(dx, dz);
      if (d < mn && d > 1e-6) { b.x = c.x + (dx / d) * mn; b.z = c.z + (dz / d) * mn; }
    }
  }
}

/** One simulation step: smooth acceleration, slope limit, water wading, collisions, jump + gravity. */
export function stepBody(b: Body, i: Input, dtRaw: number, c: Ctx) {
  const dt = Math.min(dtRaw, 0.05), sy = Math.sin(b.yaw), cy = Math.cos(b.yaw);
  let dx = sy * i.f - cy * i.s, dz = cy * i.f + sy * i.s; const len = Math.hypot(dx, dz);
  b.moving = len > 0; if (b.moving) { dx /= len; dz /= len; }
  const sp = (i.sprint ? PHYS.sprint : i.run ? PHYS.run : PHYS.walk) * (b.inWater ? PHYS.waterSlow : 1) * (i.speedMult ?? 1), k = Math.min(1, dt * (b.onGround ? 14 : 3));
  b.vx += (dx * sp - b.vx) * k; b.vz += (dz * sp - b.vz) * k;
  if (b.moving) { let diff = Math.atan2(dx, dz) - b.heading; diff = Math.atan2(Math.sin(diff), Math.cos(diff)); b.heading += diff * Math.min(1, dt * 12); }

  // horizontal move with a slope limit (axes tried separately so the player slides along cliffs)
  const tryMove = (nx: number, nz: number) => {
    const dist = Math.hypot(nx - b.x, nz - b.z); if (dist < 1e-6) return true;
    if (b.onGround && (c.height(nx, nz) - c.height(b.x, b.z)) / dist > PHYS.maxSlope) return false;
    b.x = nx; b.z = nz; return true;
  };
  const nx = b.x + b.vx * dt, nz = b.z + b.vz * dt;
  if (!tryMove(nx, nz)) { if (!tryMove(nx, b.z)) b.vx = 0; if (!tryMove(b.x, nz)) b.vz = 0; }
  collide(b, c.colliders);
  b.x = Math.min(c.bounds.x1, Math.max(c.bounds.x0, b.x)); b.z = Math.min(c.bounds.z1, Math.max(c.bounds.z0, b.z));

  // vertical
  const ground = c.height(b.x, b.z) + PHYS.feet;
  if (i.jump && b.onGround) { b.vy = PHYS.jumpV; b.onGround = false; }
  b.vy -= PHYS.gravity * dt; b.y += b.vy * dt;
  if (b.y <= ground) { b.y = ground; b.vy = 0; b.onGround = true; } else b.onGround = b.y - ground < 0.04 && b.vy <= 0;
  b.inWater = c.height(b.x, b.z) < WATER_Y;
}
