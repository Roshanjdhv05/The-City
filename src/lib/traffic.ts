import * as THREE from 'three';
import type { Road } from './types';
import type { Layout } from './layout';
import { isRing, roadLen, roadDir, intersections, Junction } from './layout';

export interface CarDef {
  id: number;
  model: 'sedan' | 'hatchback' | 'coupe' | 'suv' | 'retro' | 'supercar' | 'sports_hatch';
  name: string;
  color: string;
  accentColor?: string;
  cruiseSpeed: number; // m/s
  accel: number;
  decel: number;
  length: number;
  width: number;
  height: number;
  wheelRadius: number;
}

export const CAR_CATALOG: CarDef[] = [
  {
    id: 0,
    model: 'sedan',
    name: 'Red Compact Sedan',
    color: '#ef4444',
    cruiseSpeed: 12.5,
    accel: 5.5,
    decel: 7.5,
    length: 4.4,
    width: 1.95,
    height: 1.45,
    wheelRadius: 0.35,
  },
  {
    id: 1,
    model: 'hatchback',
    name: 'Blue Modern Hatchback',
    color: '#3b82f6',
    cruiseSpeed: 11.0,
    accel: 5.0,
    decel: 7.0,
    length: 4.1,
    width: 1.9,
    height: 1.5,
    wheelRadius: 0.34,
  },
  {
    id: 2,
    model: 'coupe',
    name: 'Yellow Sporty Coupe',
    color: '#eab308',
    cruiseSpeed: 15.0,
    accel: 6.5,
    decel: 8.5,
    length: 4.5,
    width: 2.0,
    height: 1.32,
    wheelRadius: 0.36,
  },
  {
    id: 3,
    model: 'suv',
    name: 'Green Compact SUV',
    color: '#65a30d',
    cruiseSpeed: 11.5,
    accel: 4.8,
    decel: 7.0,
    length: 4.35,
    width: 2.0,
    height: 1.62,
    wheelRadius: 0.38,
  },
  {
    id: 4,
    model: 'retro',
    name: 'Orange Retro Compact',
    color: '#ea580c',
    cruiseSpeed: 9.8,
    accel: 4.2,
    decel: 6.5,
    length: 4.1,
    width: 1.85,
    height: 1.48,
    wheelRadius: 0.34,
  },
  {
    id: 5,
    model: 'supercar',
    name: 'Purple Modern Sports Coupe',
    color: '#8b5cf6',
    cruiseSpeed: 15.5,
    accel: 7.0,
    decel: 9.0,
    length: 4.6,
    width: 2.05,
    height: 1.25,
    wheelRadius: 0.35,
  },
  {
    id: 6,
    model: 'sports_hatch',
    name: 'White Sporty Hatchback',
    color: '#f8fafc',
    accentColor: '#090d16',
    cruiseSpeed: 13.0,
    accel: 6.0,
    decel: 8.0,
    length: 4.25,
    width: 1.95,
    height: 1.42,
    wheelRadius: 0.35,
  },
];

// Generate 12 distinct vehicles distributed across the 7 models
export const TRAFFIC_FLEET: CarDef[] = [
  { ...CAR_CATALOG[0], id: 0 },
  { ...CAR_CATALOG[1], id: 1 },
  { ...CAR_CATALOG[2], id: 2 },
  { ...CAR_CATALOG[3], id: 3 },
  { ...CAR_CATALOG[4], id: 4 },
  { ...CAR_CATALOG[5], id: 5 },
  { ...CAR_CATALOG[6], id: 6 },
  { ...CAR_CATALOG[1], id: 7, color: '#2563eb' },
  { ...CAR_CATALOG[2], id: 8, color: '#f59e0b' },
  { ...CAR_CATALOG[3], id: 9, color: '#4d7c0f' },
  { ...CAR_CATALOG[0], id: 10, color: '#dc2626' },
  { ...CAR_CATALOG[5], id: 11, color: '#7c3aed' },
];

export interface RoadJunctionRef {
  x: number;
  z: number;
  roadA: string;
  roadB: string;
  tOnRoad: number; // distance along straight road, or angle in radians along ring
}

export interface TurnManeuver {
  p0: [number, number];
  p1: [number, number];
  p2: [number, number];
  progress: number;
  length: number;
  nextRoadId: string;
  nextDirection: 1 | -1;
  nextDist: number;
}

export interface VehicleAgent {
  def: CarDef;
  position: [number, number, number];
  rotation: [number, number, number]; // [pitch, yaw, roll]
  speed: number;
  targetSpeed: number;
  steerAngle: number;
  wheelSpin: number;
  isBraking: boolean;

  // Road Navigation State
  currentRoadId: string;
  isRing: boolean;
  direction: 1 | -1; // +1 forward / CCW, -1 backward / CW
  currentDist: number; // distance along segment in meters, or angle in radians for ring
  laneOffset: number; // meters from centerline (positive is right-hand side of driving direction)

  // Turn Maneuver State (when crossing an intersection into another road)
  isTurning: boolean;
  turn?: TurnManeuver;

  // Cooldown to prevent immediately turning back onto the same road
  lastTurnedJunctionId?: string;
  cooldownTimer: number;
}

export class CityTrafficSystem {
  roads: Map<string, Road>;
  junctions: Junction[];
  junctionsByRoad: Map<string, RoadJunctionRef[]>;
  vehicles: VehicleAgent[];

  constructor(layout: Layout) {
    this.roads = new Map(layout.roads.map(r => [r.id, r]));
    this.junctions = intersections(layout.roads);
    this.junctionsByRoad = new Map();

    // Index all intersections for quick lookup along each road
    for (const j of this.junctions) {
      // For road a
      const a = j.a;
      let tA = 0;
      if (isRing(a)) {
        tA = (Math.atan2(j.z - a.z0, j.x - a.x0) + Math.PI * 2) % (Math.PI * 2);
      } else {
        const da = roadDir(a);
        tA = (j.x - a.x0) * da[0] + (j.z - a.z0) * da[1];
      }
      const refA: RoadJunctionRef = { x: j.x, z: j.z, roadA: a.id, roadB: j.b.id, tOnRoad: tA };
      if (!this.junctionsByRoad.has(a.id)) this.junctionsByRoad.set(a.id, []);
      this.junctionsByRoad.get(a.id)!.push(refA);

      // For road b
      const b = j.b;
      let tB = 0;
      if (isRing(b)) {
        tB = (Math.atan2(j.z - b.z0, j.x - b.x0) + Math.PI * 2) % (Math.PI * 2);
      } else {
        const db = roadDir(b);
        tB = (j.x - b.x0) * db[0] + (j.z - b.z0) * db[1];
      }
      const refB: RoadJunctionRef = { x: j.x, z: j.z, roadA: b.id, roadB: j.a.id, tOnRoad: tB };
      if (!this.junctionsByRoad.has(b.id)) this.junctionsByRoad.set(b.id, []);
      this.junctionsByRoad.get(b.id)!.push(refB);
    }

    // Sort junctions along each road
    for (const [_, jList] of this.junctionsByRoad.entries()) {
      jList.sort((p, q) => p.tOnRoad - q.tOnRoad);
    }

    // Initialize the fleet across diverse roads
    this.vehicles = this.initVehicles(TRAFFIC_FLEET);
  }

  initVehicles(fleet: CarDef[]): VehicleAgent[] {
    const agents: VehicleAgent[] = [];
    const validRoads = Array.from(this.roads.values());
    if (validRoads.length === 0) return [];

    // Distribute across Ring 0, Ring 1, Ring 2, Radials, Spines, and Cross streets
    const seedSpawns: Array<{ roadId: string; dir: 1 | -1; progressRatio: number }> = [
      { roadId: 'RING-1', dir: 1, progressRatio: 0.1 },
      { roadId: 'RING-1', dir: -1, progressRatio: 0.6 },
      { roadId: 'RING-2', dir: 1, progressRatio: 0.3 },
      { roadId: 'RING-2', dir: -1, progressRatio: 0.8 },
      { roadId: 'RING-0', dir: 1, progressRatio: 0.4 },
      { roadId: 'RAD-0', dir: 1, progressRatio: 0.35 },
      { roadId: 'RAD-2', dir: -1, progressRatio: 0.65 },
      { roadId: 'RAD-4', dir: 1, progressRatio: 0.5 },
      { roadId: 'RAD-6', dir: -1, progressRatio: 0.4 },
      { roadId: 'SPN-SAS', dir: 1, progressRatio: 0.45 },
      { roadId: 'SPN-AIM', dir: -1, progressRatio: 0.55 },
      { roadId: 'SPN-DEV', dir: 1, progressRatio: 0.25 },
    ];

    for (let i = 0; i < fleet.length; i++) {
      const def = fleet[i];
      const spawn = seedSpawns[i % seedSpawns.length];
      const r = this.roads.get(spawn.roadId) || validRoads[i % validRoads.length];
      const ring = isRing(r);
      const laneOffset = 2.1; // 2.1m offset to right of centerline

      let startDist = 0;
      if (ring) {
        startDist = spawn.progressRatio * Math.PI * 2;
      } else {
        const len = roadLen(r);
        startDist = Math.max(12, Math.min(len - 12, spawn.progressRatio * len));
      }

      const agent: VehicleAgent = {
        def,
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        speed: def.cruiseSpeed * 0.8,
        targetSpeed: def.cruiseSpeed,
        steerAngle: 0,
        wheelSpin: 0,
        isBraking: false,
        currentRoadId: r.id,
        isRing: ring,
        direction: spawn.dir,
        currentDist: startDist,
        laneOffset,
        isTurning: false,
        cooldownTimer: 0,
      };

      // Set initial position
      const pose = this.calcPose(agent);
      agent.position = [pose.x, 0.08, pose.z];
      agent.rotation = [0, pose.yaw, 0];
      agents.push(agent);
    }

    return agents;
  }

  /**
   * Computes position and yaw heading for a vehicle on its current road and lane.
   */
  calcPose(v: VehicleAgent): { x: number; z: number; yaw: number } {
    const r = this.roads.get(v.currentRoadId);
    if (!r) return { x: v.position[0], z: v.position[2], yaw: v.rotation[1] };

    if (v.isRing) {
      const R = r.x1;
      const phi = v.currentDist;
      // For CCW (direction +1): tangent = (-sin phi, cos phi). Right-hand normal is outward (+R).
      // For CW (direction -1): tangent = (sin phi, -cos phi). Right-hand normal is inward (-R).
      const rLane = v.direction > 0 ? R + v.laneOffset : R - v.laneOffset;
      const x = r.x0 + rLane * Math.cos(phi);
      const z = r.z0 + rLane * Math.sin(phi);

      // Facing tangent
      const tx = v.direction > 0 ? -Math.sin(phi) : Math.sin(phi);
      const tz = v.direction > 0 ? Math.cos(phi) : -Math.cos(phi);
      const yaw = Math.atan2(tx, tz);
      return { x, z, yaw };
    } else {
      const d = roadDir(r);
      const n: [number, number] = [-d[1], d[0]]; // right normal to forward direction d

      // Forward travel (+1): position = p0 + d*dist + n*laneOffset. Yaw = atan2(d[0], d[1]).
      // Backward travel (-1): position = p0 + d*dist - n*laneOffset. Yaw = atan2(-d[0], -d[1]).
      const actualOffset = v.direction > 0 ? v.laneOffset : -v.laneOffset;
      const x = r.x0 + d[0] * v.currentDist + n[0] * actualOffset;
      const z = r.z0 + d[1] * v.currentDist + n[1] * actualOffset;

      const fwdX = v.direction > 0 ? d[0] : -d[0];
      const fwdZ = v.direction > 0 ? d[1] : -d[1];
      const yaw = Math.atan2(fwdX, fwdZ);
      return { x, z, yaw };
    }
  }

  /**
   * Evaluates quadratic bezier curve at parameter t in [0, 1].
   */
  bezierPoint(p0: [number, number], p1: [number, number], p2: [number, number], t: number): [number, number] {
    const it = 1 - t;
    const x = it * it * p0[0] + 2 * it * t * p1[0] + t * t * p2[0];
    const z = it * it * p0[1] + 2 * it * t * p1[1] + t * t * p2[1];
    return [x, z];
  }

  bezierTangent(p0: [number, number], p1: [number, number], p2: [number, number], t: number): [number, number] {
    const it = 1 - t;
    const dx = 2 * it * (p1[0] - p0[0]) + 2 * t * (p2[0] - p1[0]);
    const dz = 2 * it * (p1[1] - p0[1]) + 2 * t * (p2[1] - p1[1]);
    return [dx, dz];
  }

  /**
   * Main simulation frame update.
   */
  update(dt: number) {
    // Clamp delta time to avoid large jumps
    const safeDt = Math.min(dt, 0.08);

    for (let i = 0; i < this.vehicles.length; i++) {
      const v = this.vehicles[i];
      if (v.cooldownTimer > 0) v.cooldownTimer -= safeDt;

      // 1. Collision avoidance with other cars
      let distanceToAhead = 999;
      for (let j = 0; j < this.vehicles.length; j++) {
        if (i === j) continue;
        const other = this.vehicles[j];
        const dx = other.position[0] - v.position[0];
        const dz = other.position[2] - v.position[2];
        const dist = Math.hypot(dx, dz);

        // Check if other car is in front (dot product with heading)
        const headingX = Math.sin(v.rotation[1]);
        const headingZ = Math.cos(v.rotation[1]);
        const dot = (dx * headingX + dz * headingZ) / (dist || 1);

        if (dot > 0.65 && dist < 18) {
          if (dist < distanceToAhead) distanceToAhead = dist;
        }
      }

      // Desired speed calculation based on traffic ahead
      if (distanceToAhead < 5.0) {
        v.targetSpeed = 0;
        v.isBraking = true;
      } else if (distanceToAhead < 10.0) {
        v.targetSpeed = v.def.cruiseSpeed * 0.35;
        v.isBraking = true;
      } else if (distanceToAhead < 16.0) {
        v.targetSpeed = v.def.cruiseSpeed * 0.7;
        v.isBraking = false;
      } else if (v.isTurning) {
        // Slow down smoothly when turning through an intersection
        v.targetSpeed = Math.min(v.def.cruiseSpeed * 0.5, 6.5);
        v.isBraking = v.speed > v.targetSpeed + 1;
      } else {
        v.targetSpeed = v.def.cruiseSpeed;
        v.isBraking = false;
      }

      // Smooth acceleration / deceleration
      if (v.speed < v.targetSpeed) {
        v.speed = Math.min(v.targetSpeed, v.speed + v.def.accel * safeDt);
      } else if (v.speed > v.targetSpeed) {
        v.speed = Math.max(v.targetSpeed, v.speed - v.def.decel * safeDt);
      }

      const moveDist = v.speed * safeDt;

      // 2. Movement handling: Turning vs Driving on straight/ring road
      if (v.isTurning && v.turn) {
        const t = v.turn;
        t.progress += moveDist / (t.length || 1);

        if (t.progress >= 1.0) {
          // Completed turn! Transition cleanly onto next road
          v.isTurning = false;
          v.currentRoadId = t.nextRoadId;
          const nextRoad = this.roads.get(t.nextRoadId);
          v.isRing = nextRoad ? isRing(nextRoad) : false;
          v.direction = t.nextDirection;
          v.currentDist = t.nextDist;
          v.turn = undefined;
          v.steerAngle = 0;

          // Recalculate pose on new road
          const p = this.calcPose(v);
          v.position[0] = p.x;
          v.position[2] = p.z;
          v.rotation[1] = p.yaw;
        } else {
          // Advance along bezier curve
          const [px, pz] = this.bezierPoint(t.p0, t.p1, t.p2, t.progress);
          const [tx, tz] = this.bezierTangent(t.p0, t.p1, t.p2, t.progress);
          const targetYaw = Math.atan2(tx, tz);

          // Smooth steer angle for front wheels
          const yawDiff = THREE.MathUtils.euclideanModulo(targetYaw - v.rotation[1] + Math.PI, Math.PI * 2) - Math.PI;
          v.steerAngle = THREE.MathUtils.clamp(yawDiff * 2.5, -0.42, 0.42);

          v.position[0] = px;
          v.position[2] = pz;
          v.rotation[1] = targetYaw;
        }
      } else {
        // Normal driving along road
        const road = this.roads.get(v.currentRoadId);
        if (!road) continue;

        if (v.isRing) {
          const R = road.x1;
          const deltaAngle = (moveDist / R) * v.direction;
          v.currentDist = (v.currentDist + deltaAngle + Math.PI * 2) % (Math.PI * 2);

          // Check if approaching a junction along the ring road
          if (v.cooldownTimer <= 0) {
            const jList = this.junctionsByRoad.get(v.currentRoadId) || [];
            for (const j of jList) {
              const angleDiff = THREE.MathUtils.euclideanModulo(j.tOnRoad - v.currentDist + Math.PI, Math.PI * 2) - Math.PI;
              const arcDist = angleDiff * R * v.direction;

              // If junction is 3.5m ahead, randomly decide whether to turn (50% chance)
              if (arcDist > 0 && arcDist < 4.2) {
                if (Math.random() < 0.45) {
                  this.startTurn(v, j);
                  break;
                }
              }
            }
          }

          const p = this.calcPose(v);
          v.position[0] = p.x;
          v.position[2] = p.z;
          v.rotation[1] = p.yaw;
          v.steerAngle = 0;
        } else {
          // Straight road segment
          const len = roadLen(road);
          const nextDist = v.currentDist + moveDist * v.direction;

          // Check for junction intersections ahead
          if (v.cooldownTimer <= 0) {
            const jList = this.junctionsByRoad.get(v.currentRoadId) || [];
            for (const j of jList) {
              const distToJ = (j.tOnRoad - v.currentDist) * v.direction;
              if (distToJ > 0 && distToJ < 4.5) {
                // 50% chance to turn at intersection
                if (Math.random() < 0.5) {
                  this.startTurn(v, j);
                  break;
                }
              }
            }
          }

          // If still driving on this road
          if (!v.isTurning) {
            // Check if road ends (near start or end of segment)
            const margin = 5.0;
            if (v.direction > 0 && nextDist >= len - margin) {
              // Reached end of straight road: MUST turn onto intersecting road or reverse
              const endJunctions = (this.junctionsByRoad.get(v.currentRoadId) || []).filter(j => Math.abs(j.tOnRoad - len) < 8.0);
              if (endJunctions.length > 0) {
                this.startTurn(v, endJunctions[0]);
              } else {
                // Reverse direction safely on road
                v.direction = -1;
                v.currentDist = len - margin;
              }
            } else if (v.direction < 0 && nextDist <= margin) {
              // Reached start of straight road
              const startJunctions = (this.junctionsByRoad.get(v.currentRoadId) || []).filter(j => Math.abs(j.tOnRoad) < 8.0);
              if (startJunctions.length > 0) {
                this.startTurn(v, startJunctions[0]);
              } else {
                v.direction = 1;
                v.currentDist = margin;
              }
            } else {
              v.currentDist = nextDist;
            }

            const p = this.calcPose(v);
            v.position[0] = p.x;
            v.position[2] = p.z;
            v.rotation[1] = p.yaw;
            v.steerAngle = 0;
          }
        }
      }

      // 3. Wheel rotation and suspension dynamics
      v.wheelSpin += (v.speed / (v.def.wheelRadius || 0.35)) * safeDt;

      // Slight pitch bob when braking or accelerating
      const targetPitch = v.isBraking ? 0.025 : (v.targetSpeed > v.speed ? -0.012 : 0);
      v.rotation[0] = THREE.MathUtils.lerp(v.rotation[0], targetPitch, 8 * safeDt);

      // Slight body roll during turns
      const targetRoll = -v.steerAngle * 0.12;
      v.rotation[2] = THREE.MathUtils.lerp(v.rotation[2], targetRoll, 8 * safeDt);
    }
  }

  /**
   * Initiates a smooth Bezier turn maneuver from current road into target road at a junction.
   */
  startTurn(v: VehicleAgent, j: RoadJunctionRef) {
    const nextRoad = this.roads.get(j.roadB);
    if (!nextRoad) return;

    // Determine current position as p0
    const p0: [number, number] = [v.position[0], v.position[2]];
    // Center of intersection as p1
    const p1: [number, number] = [j.x, j.z];

    // Pick a direction for next road
    let nextDirection: 1 | -1 = Math.random() < 0.5 ? 1 : -1;
    let nextDist = 0;

    if (isRing(nextRoad)) {
      const R = nextRoad.x1;
      const phiJ = (Math.atan2(j.z - nextRoad.z0, j.x - nextRoad.x0) + Math.PI * 2) % (Math.PI * 2);
      // Lead out 4m along the ring lane
      const arcLead = (4.0 / R) * nextDirection;
      nextDist = (phiJ + arcLead + Math.PI * 2) % (Math.PI * 2);
    } else {
      const L = roadLen(nextRoad);
      const dj = roadDir(nextRoad);
      const tj = (j.x - nextRoad.x0) * dj[0] + (j.z - nextRoad.z0) * dj[1];

      // If near end of road, pick direction away from dead end
      if (tj > L - 8) nextDirection = -1;
      else if (tj < 8) nextDirection = 1;

      nextDist = Math.max(3, Math.min(L - 3, tj + nextDirection * 4.5));
    }

    // Temporary dummy agent to compute p2 (exit lane position on target road)
    const exitDummy: VehicleAgent = {
      ...v,
      currentRoadId: nextRoad.id,
      isRing: isRing(nextRoad),
      direction: nextDirection,
      currentDist: nextDist,
    };
    const exitPose = this.calcPose(exitDummy);
    const p2: [number, number] = [exitPose.x, exitPose.z];

    const turnLen = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) + Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);

    v.isTurning = true;
    v.turn = {
      p0,
      p1,
      p2,
      progress: 0,
      length: Math.max(4.0, turnLen),
      nextRoadId: nextRoad.id,
      nextDirection,
      nextDist,
    };
    v.cooldownTimer = 2.5; // Avoid turning immediately again for 2.5 seconds
  }
}

