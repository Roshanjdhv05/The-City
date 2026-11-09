'use client';

export interface UserProfile {
  username: string | null;
  avatarColor: string | null;
}

const LP_KEY = 'thecity_user_profile';

/** Read profile synchronously from local storage */
export function getLocalProfile(): UserProfile {
  if (typeof window === 'undefined') return { username: null, avatarColor: null };
  try {
    const raw = localStorage.getItem(LP_KEY);
    if (!raw) return { username: null, avatarColor: null };
    return JSON.parse(raw);
  } catch {
    return { username: null, avatarColor: null };
  }
}

/** Store profile locally and notify listeners */
export function setLocalProfile(p: UserProfile) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LP_KEY, JSON.stringify(p));
    window.dispatchEvent(new CustomEvent('thecity_profile_updated', { detail: p }));
  } catch {}
}

/** Fetch a user's profile: reads local cache first, then attempts API */
export async function fetchProfile(userId: string): Promise<UserProfile> {
  const local = getLocalProfile();
  try {
    const res = await fetch(`/api/profiles?userId=${encodeURIComponent(userId)}`);
    if (res.ok) {
      const serverProfile = await res.json();
      if (serverProfile.username || serverProfile.avatarColor) {
        setLocalProfile(serverProfile);
        return serverProfile;
      }
    }
  } catch {}
  return local;
}

/** Check if a username is available (returns true = available) */
export async function checkUsernameAvailable(username: string): Promise<{ available: boolean; reason?: string }> {
  const handle = username.toLowerCase().trim();
  const valid = /^[a-z0-9_]{3,20}$/.test(handle);
  if (!valid) return { available: false, reason: 'invalid' };

  try {
    const res = await fetch(`/api/profiles?check=${encodeURIComponent(handle)}`);
    if (res.ok) return await res.json();
  } catch {}

  // Fallback for static GitHub deployment or offline
  return { available: true };
}

/** Save / update a user's username with instant local + API sync */
export async function saveProfile(userId: string, username: string, avatarColor?: string): Promise<{ ok: boolean; error?: string }> {
  const handle = username.toLowerCase().trim();
  if (!/^[a-z0-9_]{3,20}$/.test(handle)) {
    return { ok: false, error: 'Username must be 3–20 characters: letters, numbers, underscores only.' };
  }

  const prof: UserProfile = { username: handle, avatarColor: avatarColor || '#2563eb' };
  setLocalProfile(prof);

  try {
    const res = await fetch('/api/profiles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, username: handle, avatarColor }),
    });
    if (res.ok) return await res.json();
  } catch {}

  // Always return ok: true when locally saved so users on GitHub Pages can change username
  return { ok: true };
}

/** Avatar color palette — same as multiplayer.ts */
export const AVATAR_COLORS = [
  { hex: '#2563eb', label: 'Blue' },
  { hex: '#16a34a', label: 'Green' },
  { hex: '#ea580c', label: 'Orange' },
  { hex: '#9333ea', label: 'Purple' },
  { hex: '#e11d48', label: 'Red' },
  { hex: '#0891b2', label: 'Cyan' },
  { hex: '#d97706', label: 'Amber' },
  { hex: '#4f46e5', label: 'Indigo' },
  { hex: '#059669', label: 'Teal' },
  { hex: '#db2777', label: 'Pink' },
];
