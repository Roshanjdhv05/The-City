'use client';

export interface UserProfile {
  username: string | null;
  avatarColor: string | null;
}

/** Fetch a user's profile from the API */
export async function fetchProfile(userId: string): Promise<UserProfile> {
  try {
    const res = await fetch(`/api/profiles?userId=${encodeURIComponent(userId)}`);
    if (!res.ok) return { username: null, avatarColor: null };
    return await res.json();
  } catch {
    return { username: null, avatarColor: null };
  }
}

/** Check if a username is available (returns true = available) */
export async function checkUsernameAvailable(username: string): Promise<{ available: boolean; reason?: string }> {
  try {
    const res = await fetch(`/api/profiles?check=${encodeURIComponent(username)}`);
    if (!res.ok) return { available: false };
    return await res.json();
  } catch {
    return { available: false };
  }
}

/** Save / update a user's username */
export async function saveProfile(userId: string, username: string, avatarColor?: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch('/api/profiles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, username, avatarColor }),
    });
    return await res.json();
  } catch {
    return { ok: false, error: 'Network error' };
  }
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

