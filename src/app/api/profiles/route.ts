/**
 * /api/profiles — username registry
 *
 * Works in both Supabase mode (persists to `user_profiles` table) and
 * local/demo mode (Node.js global Map — survives hot-reloads in dev).
 *
 * Endpoints:
 *   GET  /api/profiles?userId=xxx        → { username, avatarColor }
 *   GET  /api/profiles?check=handle      → { available: boolean }
 *   POST /api/profiles  { userId, username } → { ok, error? }
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

// ─── Local (demo) store ────────────────────────────────────────────────────
declare global {
  var __profilesByUser: Map<string, { username: string; avatarColor: string; updatedAt: string }> | undefined;
  var __profilesByName: Map<string, string> | undefined; // username.lower → userId
}

const byUser = (global.__profilesByUser ??= new Map());
const byName = (global.__profilesByName ??= new Map());

// ─── Supabase client (optional) ───────────────────────────────────────────
const supaUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supaKey  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supaService = process.env.SUPABASE_SERVICE_ROLE_KEY; // only available server-side
const supa = supaUrl && (supaService || supaKey)
  ? createClient(supaUrl, supaService || supaKey!)
  : null;

function normalize(s: string) { return s.toLowerCase().trim(); }

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const userId = searchParams.get('userId');
  const check  = searchParams.get('check');

  // ── username availability check ──────────────────────────────────────────
  if (check !== null) {
    const handle = normalize(check);
    if (!isValidUsername(handle)) {
      return NextResponse.json({ available: false, reason: 'invalid' });
    }
    if (supa) {
      const { data } = await supa.from('user_profiles').select('user_id').eq('username', handle).maybeSingle();
      return NextResponse.json({ available: !data });
    }
    return NextResponse.json({ available: !byName.has(handle) });
  }

  // ── fetch profile by userId ───────────────────────────────────────────────
  if (userId) {
    if (supa) {
      const { data } = await supa.from('user_profiles').select('username, avatar_color').eq('user_id', userId).maybeSingle();
      if (data) return NextResponse.json({ username: data.username, avatarColor: data.avatar_color });
      return NextResponse.json({ username: null, avatarColor: null });
    }
    const p = byUser.get(userId);
    return NextResponse.json(p ?? { username: null, avatarColor: null });
  }

  return NextResponse.json({ error: 'Missing query param' }, { status: 400 });
}

export async function POST(req: NextRequest) {
  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 }); }

  const { userId, username, avatarColor } = body ?? {};
  if (!userId || !username) return NextResponse.json({ ok: false, error: 'Missing userId or username' }, { status: 400 });

  const handle = normalize(username);
  if (!isValidUsername(handle)) {
    return NextResponse.json({ ok: false, error: 'Username must be 3–20 characters: letters, numbers, underscores only.' });
  }

  if (supa) {
    // Check uniqueness — exclude current user's own username
    const { data: taken } = await supa.from('user_profiles').select('user_id').eq('username', handle).maybeSingle();
    if (taken && taken.user_id !== userId) {
      return NextResponse.json({ ok: false, error: 'That username is already taken.' });
    }
    const { error } = await supa.from('user_profiles').upsert(
      { user_id: userId, username: handle, avatar_color: avatarColor ?? null, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' },
    );
    if (error) return NextResponse.json({ ok: false, error: error.message });
    return NextResponse.json({ ok: true });
  }

  // Local demo mode
  const existing = byUser.get(userId);
  const takenBy = byName.get(handle);
  if (takenBy && takenBy !== userId) {
    return NextResponse.json({ ok: false, error: 'That username is already taken.' });
  }
  // Remove old username mapping
  if (existing?.username) byName.delete(normalize(existing.username));
  const rec = { username: handle, avatarColor: avatarColor ?? '#3b82f6', updatedAt: new Date().toISOString() };
  byUser.set(userId, rec);
  byName.set(handle, userId);
  return NextResponse.json({ ok: true });
}

function isValidUsername(s: string): boolean {
  return /^[a-z0-9_]{3,20}$/.test(s);
}

