import { NextRequest, NextResponse } from 'next/server';

// Force Node.js runtime (not Edge) so global state persists within the same process
export const runtime = 'nodejs';

interface PlayerRecord {
  id: string;
  name: string;
  color: string;
  x: number;
  y: number;
  z: number;
  yaw: number;
  moving: boolean;
  lastSeen: number;
}

// Use Node.js global to survive Next.js hot-module-reloads in dev
declare global {
  // eslint-disable-next-line no-var
  var __presencePlayers: Map<string, PlayerRecord> | undefined;
  // eslint-disable-next-line no-var
  var __presencePruneStarted: boolean | undefined;
}

const store: Map<string, PlayerRecord> = (global.__presencePlayers ??= new Map());

// Prune players who haven't sent a heartbeat in 10 seconds – run once per process
if (!global.__presencePruneStarted) {
  global.__presencePruneStarted = true;
  setInterval(() => {
    const cut = Date.now() - 10_000;
    for (const [id, p] of store.entries()) {
      if (p.lastSeen < cut) store.delete(id);
    }
  }, 2500);
}

/** GET /api/presence — returns all active players */
export async function GET() {
  const players = Array.from(store.values());
  return NextResponse.json(players, {
    headers: {
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

/** POST /api/presence — register/update a player or signal leave */
export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid json' }, { status: 400 });
  }

  if (!body?.id) {
    return NextResponse.json({ ok: false, error: 'missing id' }, { status: 400 });
  }

  if (body.type === 'leave') {
    store.delete(body.id);
  } else {
    // 'move' or any position update
    store.set(body.id, {
      id: String(body.id),
      name: String(body.name ?? 'Explorer'),
      color: String(body.color ?? '#3b82f6'),
      x: Number(body.x) || 0,
      y: Number(body.y) || 0,
      z: Number(body.z) || 0,
      yaw: Number(body.yaw) || 0,
      moving: Boolean(body.moving),
      lastSeen: Date.now(),
    });
  }

  return NextResponse.json({ ok: true });
}

