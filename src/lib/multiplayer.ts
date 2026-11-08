'use client';
import { useEffect, useState } from 'react';
import { supabase } from './supabase';
import { useAuth } from './data';

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

// Cached local player session
let cachedId = '';
export function getLocalPlayerId(): string {
  if (cachedId) return cachedId;
  if (typeof window !== 'undefined') {
    let id = sessionStorage.getItem('thecity_pid');
    if (!id) {
      id = 'p_' + Math.random().toString(36).slice(2, 8);
      sessionStorage.setItem('thecity_pid', id);
    }
    cachedId = id;
    return id;
  }
  return 'p_' + Math.random().toString(36).slice(2, 8);
}

export function getPlayerColor(id: string): string {
  const idx = hashString(id) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

export function getPlayerDisplayName(email?: string | null, id?: string): string {
  if (email && email.includes('@')) {
    const handle = email.split('@')[0];
    return handle.charAt(0).toUpperCase() + handle.slice(1);
  }
  const suffix = (id || getLocalPlayerId()).slice(-3).toUpperCase();
  return `Visitor ${suffix}`;
}

// Global state of remote players (updated via BroadcastChannel and/or Supabase)
const remotePlayersMap = new Map<string, RemotePlayer>();
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach(fn => fn());
}

let channel: BroadcastChannel | null = null;
let supaChannel: any = null;
let isInitialized = false;

function initChannels() {
  if (isInitialized || typeof window === 'undefined') return;
  isInitialized = true;

  // 1. Browser BroadcastChannel for instant local multi-tab / multi-window sync
  try {
    channel = new BroadcastChannel('thecity_players_v1');
    channel.onmessage = (e) => {
      const data = e.data;
      if (!data || !data.id || data.id === getLocalPlayerId()) return;

      if (data.type === 'leave') {
        remotePlayersMap.delete(data.id);
        notify();
        return;
      }

      if (data.type === 'move') {
        remotePlayersMap.set(data.id, {
          id: data.id,
          name: data.name,
          color: data.color,
          x: data.x,
          y: data.y,
          z: data.z,
          yaw: data.yaw,
          moving: data.moving,
          lastSeen: Date.now(),
        });
        notify();
      }
    };
  } catch (err) {
    console.warn('BroadcastChannel not supported', err);
  }

  // 2. Supabase Realtime broadcast channel when Supabase client is available
  if (supabase) {
    try {
      supaChannel = supabase.channel('thecity_presence_hub', {
        config: { broadcast: { self: false } },
      });

      supaChannel
        .on('broadcast', { event: 'player_move' }, ({ payload }: any) => {
          if (!payload || !payload.id || payload.id === getLocalPlayerId()) return;
          remotePlayersMap.set(payload.id, {
            id: payload.id,
            name: payload.name,
            color: payload.color,
            x: payload.x,
            y: payload.y,
            z: payload.z,
            yaw: payload.yaw,
            moving: payload.moving,
            lastSeen: Date.now(),
          });
          notify();
        })
        .on('broadcast', { event: 'player_leave' }, ({ payload }: any) => {
          if (!payload || !payload.id) return;
          remotePlayersMap.delete(payload.id);
          notify();
        })
        .subscribe();
    } catch (err) {
      console.warn('Supabase realtime failed to subscribe', err);
    }
  }

  // Periodic prune of inactive players (> 4.5 seconds without heartbeat)
  setInterval(() => {
    const now = Date.now();
    let changed = false;
    for (const [id, player] of remotePlayersMap.entries()) {
      if (now - player.lastSeen > 4500) {
        remotePlayersMap.delete(id);
        changed = true;
      }
    }
    if (changed) notify();
  }, 1500);

  // Send leave event on tab close / unload
  window.addEventListener('beforeunload', () => {
    const myId = getLocalPlayerId();
    if (channel) {
      try {
        channel.postMessage({ type: 'leave', id: myId });
      } catch {}
    }
    if (supaChannel) {
      try {
        supaChannel.send({ type: 'broadcast', event: 'player_leave', payload: { id: myId } });
      } catch {}
    }
  });
}

/** Broadcast local player's current position to all other connected tabs / visitors */
let lastBroadcast = 0;
export function broadcastPlayerPosition(
  x: number,
  y: number,
  z: number,
  yaw: number,
  moving: boolean,
  name: string,
  color: string
) {
  const now = performance.now();
  // Throttle broadcasts: 20Hz when moving (every 50ms), 1Hz when stationary (heartbeat)
  const interval = moving ? 48 : 1000;
  if (now - lastBroadcast < interval) return;
  lastBroadcast = now;

  const id = getLocalPlayerId();
  const payload = {
    type: 'move',
    id,
    name,
    color,
    x: Math.round(x * 100) / 100,
    y: Math.round(y * 100) / 100,
    z: Math.round(z * 100) / 100,
    yaw: Math.round(yaw * 1000) / 1000,
    moving,
  };

  if (channel) {
    try {
      channel.postMessage(payload);
    } catch {}
  }
  if (supaChannel) {
    try {
      supaChannel.send({ type: 'broadcast', event: 'player_move', payload });
    } catch {}
  }
}

/** React hook to access remote players list and local player metadata */
export function useMultiplayer() {
  const { user } = useAuth();
  const [remotes, setRemotes] = useState<RemotePlayer[]>([]);

  const myId = getLocalPlayerId();
  const myColor = getPlayerColor(myId);
  const myName = getPlayerDisplayName(user?.email, myId);

  useEffect(() => {
    initChannels();
    const update = () => {
      setRemotes(Array.from(remotePlayersMap.values()));
    };
    listeners.add(update);
    update();
    return () => {
      listeners.delete(update);
    };
  }, []);

  return {
    myId,
    myName,
    myColor,
    remotePlayers: remotes,
  };
}

