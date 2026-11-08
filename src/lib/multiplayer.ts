'use client';
import { useEffect, useState } from 'react';
import { supabase } from './supabase';
import { useAuth } from './data';
import { fetchProfile } from './profile';

export interface RemotePlayer {
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

export const AVATAR_COLORS = [
  '#2563eb', // Royal Blue
  '#16a34a', // Emerald Green
  '#ea580c', // Bright Orange
  '#9333ea', // Cyber Purple
  '#e11d48', // Crimson Rose
  '#0891b2', // Deep Cyan
  '#d97706', // Amber Gold
  '#dc2626', // Scarlet Red
  '#4f46e5', // Indigo
  '#059669', // Teal Green
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

// ─── Local player identity ─────────────────────────────────────────────────
let cachedId = '';
export function getLocalPlayerId(): string {
  if (cachedId) return cachedId;
  if (typeof window !== 'undefined') {
    let id = sessionStorage.getItem('thecity_pid');
    if (!id) {
      id = 'p_' + Math.random().toString(36).slice(2, 10);
      sessionStorage.setItem('thecity_pid', id);
    }
    cachedId = id;
    return id;
  }
  return 'p_' + Math.random().toString(36).slice(2, 10);
}

export function getPlayerColor(id: string): string {
  return AVATAR_COLORS[hashString(id) % AVATAR_COLORS.length];
}

export function getPlayerDisplayName(email?: string | null, id?: string): string {
  if (email && email.includes('@')) {
    const handle = email.split('@')[0];
    return handle.charAt(0).toUpperCase() + handle.slice(1);
  }
  const suffix = (id || getLocalPlayerId()).slice(-4).toUpperCase();
  return `Explorer_${suffix}`;
}

// ─── Shared in-memory state ────────────────────────────────────────────────
const remotePlayersMap = new Map<string, RemotePlayer>();
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach(fn => fn());
}

// ─── Latest local player snapshot (updated every frame by Player.tsx) ──────
const mySnapshot = { x: 0, y: 0, z: 0, yaw: 0, moving: false, name: '', color: '', id: '' };

// ─── Channel references ────────────────────────────────────────────────────
let broadcastCh: BroadcastChannel | null = null;
let supaChannel: any = null;
let httpSyncTimer: ReturnType<typeof setInterval> | null = null;
let httpPollTimer: ReturnType<typeof setInterval> | null = null;
let isInitialized = false;

// ─── HTTP presence helpers ─────────────────────────────────────────────────
async function httpPost(payload: object) {
  try {
    await fetch('/api/presence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch { /* network errors are silent */ }
}

async function httpFetchAll(myId: string) {
  try {
    const res = await fetch('/api/presence', { cache: 'no-store' });
    if (!res.ok) return;
    const players: RemotePlayer[] = await res.json();

    // Build a set of ids returned by the server
    const serverIds = new Set<string>();
    let changed = false;

    for (const p of players) {
      if (p.id === myId) continue; // skip self
      serverIds.add(p.id);
      const existing = remotePlayersMap.get(p.id);
      if (
        !existing ||
        existing.x !== p.x ||
        existing.z !== p.z ||
        existing.yaw !== p.yaw ||
        existing.moving !== p.moving ||
        existing.name !== p.name
      ) {
        remotePlayersMap.set(p.id, { ...p, lastSeen: Date.now() });
        changed = true;
      } else {
        // Keep lastSeen fresh to prevent local pruning
        existing.lastSeen = Date.now();
      }
    }

    // Remove players the server no longer knows about
    for (const id of Array.from(remotePlayersMap.keys())) {
      if (!serverIds.has(id)) {
        remotePlayersMap.delete(id);
        changed = true;
      }
    }

    if (changed) notify();
  } catch { /* ignore */ }
}

// ─── Initialise all channels (runs once per browser session) ──────────────
function initChannels(myId: string) {
  if (isInitialized || typeof window === 'undefined') return;
  isInitialized = true;

  // 1. BroadcastChannel — instant sync between tabs in the SAME browser
  try {
    broadcastCh = new BroadcastChannel('thecity_players_v2');
    broadcastCh.onmessage = (e) => {
      const d = e.data;
      if (!d || !d.id || d.id === myId) return;

      if (d.type === 'leave') {
        remotePlayersMap.delete(d.id);
        notify();
        return;
      }
      if (d.type === 'move') {
        remotePlayersMap.set(d.id, { ...d, lastSeen: Date.now() });
        notify();
      }
    };
  } catch { /* Safari private mode may block this */ }

  // 2. Supabase Realtime — instant sync across browsers (when configured)
  if (supabase) {
    try {
      supaChannel = supabase.channel('thecity_presence_v2', {
        config: { broadcast: { self: false } },
      });
      supaChannel
        .on('broadcast', { event: 'move' }, ({ payload }: any) => {
          if (!payload?.id || payload.id === myId) return;
          remotePlayersMap.set(payload.id, { ...payload, lastSeen: Date.now() });
          notify();
        })
        .on('broadcast', { event: 'leave' }, ({ payload }: any) => {
          if (!payload?.id) return;
          remotePlayersMap.delete(payload.id);
          notify();
        })
        .subscribe();
    } catch { /* ignore */ }
  }

  // 3. HTTP polling — universal fallback that works across ALL browsers & computers
  //    POST own position every 300 ms (200 ms when moving is handled by snapshot)
  httpSyncTimer = setInterval(() => {
    if (!mySnapshot.id) return;
    httpPost({ type: 'move', ...mySnapshot });
  }, 300);

  //    GET all players every 600 ms
  httpPollTimer = setInterval(() => {
    httpFetchAll(myId);
  }, 600);

  // Also fetch immediately on first load
  httpFetchAll(myId);

  // 4. Local prune — safety net for BroadcastChannel/Supabase-only entries
  setInterval(() => {
    const cut = Date.now() - 8000;
    let changed = false;
    for (const [id, p] of remotePlayersMap.entries()) {
      if (p.lastSeen < cut) { remotePlayersMap.delete(id); changed = true; }
    }
    if (changed) notify();
  }, 2000);

  // 5. Leave events on tab close
  window.addEventListener('beforeunload', () => {
    const payload = { type: 'leave', id: myId };
    httpPost(payload); // fire-and-forget via keepalive
    if (broadcastCh) { try { broadcastCh.postMessage(payload); } catch {} }
    if (supaChannel) {
      try { supaChannel.send({ type: 'broadcast', event: 'leave', payload }); } catch {}
    }
  });
}

// ─── Broadcast local player position (called every frame from Player.tsx) ──
let lastBroadcastMs = 0;

export function broadcastPlayerPosition(
  x: number, y: number, z: number,
  yaw: number, moving: boolean,
  name: string, color: string,
) {
  const id = getLocalPlayerId();

  // Always keep the snapshot fresh for the HTTP sync interval
  mySnapshot.id = id;
  mySnapshot.x = Math.round(x * 100) / 100;
  mySnapshot.y = Math.round(y * 100) / 100;
  mySnapshot.z = Math.round(z * 100) / 100;
  mySnapshot.yaw = Math.round(yaw * 1000) / 1000;
  mySnapshot.moving = moving;
  mySnapshot.name = name;
  mySnapshot.color = color;

  // Throttle BroadcastChannel / Supabase messages: 20 Hz when moving, 1 Hz at rest
  const now = performance.now();
  const interval = moving ? 50 : 1000;
  if (now - lastBroadcastMs < interval) return;
  lastBroadcastMs = now;

  const payload = {
    type: 'move', id,
    name, color,
    x: mySnapshot.x, y: mySnapshot.y, z: mySnapshot.z,
    yaw: mySnapshot.yaw, moving,
  };

  if (broadcastCh) { try { broadcastCh.postMessage(payload); } catch {} }
  if (supaChannel) {
    try { supaChannel.send({ type: 'broadcast', event: 'move', payload }); } catch {}
  }
}

// ─── React hook ─────────────────────────────────────────────────────────────
export function useMultiplayer() {
  const { user } = useAuth();
  const [remotes, setRemotes] = useState<RemotePlayer[]>([]);
  const [customProfile, setCustomProfile] = useState<{ username: string | null; color: string | null }>({ username: null, color: null });

  const myId = getLocalPlayerId();
  const baseColor = getPlayerColor(myId);
  const baseName = getPlayerDisplayName(user?.email, myId);

  useEffect(() => {
    if (user?.id) {
      fetchProfile(user.id).then(p => {
        if (p.username || p.avatarColor) {
          setCustomProfile({
            username: p.username ? `@${p.username}` : null,
            color: p.avatarColor || null,
          });
        }
      });
    }
  }, [user?.id]);

  const myName = customProfile.username || baseName;
  const myColor = customProfile.color || baseColor;

  useEffect(() => {
    // Seed snapshot with identity so HTTP sync has a name/color immediately
    mySnapshot.id = myId;
    mySnapshot.color = myColor;
    mySnapshot.name = myName;

    initChannels(myId);

    const update = () => setRemotes(Array.from(remotePlayersMap.values()));
    listeners.add(update);
    update();
    return () => { listeners.delete(update); };
  }, [myId, myColor, myName]);

  return { myId, myName, myColor, remotePlayers: remotes };
}
