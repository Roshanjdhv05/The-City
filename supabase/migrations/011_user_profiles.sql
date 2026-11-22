-- THE CITY – Migration 011: User Profiles Table
-- Stores user handles, avatar color choices, and handles unique username resolution.
-- Run in the Supabase SQL Editor. Safe to re-run.

CREATE TABLE IF NOT EXISTS public.user_profiles (
  user_id text PRIMARY KEY,
  username text UNIQUE NOT NULL,
  avatar_color text DEFAULT '#2563eb',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Case-insensitive uniqueness index for usernames
CREATE UNIQUE INDEX IF NOT EXISTS user_profiles_username_lower_idx
  ON public.user_profiles (lower(username));

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 1. Profiles are publicly readable so other players can see usernames and avatar colors in multiplayer and HUD
DROP POLICY IF EXISTS "user_profiles are public to read" ON public.user_profiles;
CREATE POLICY "user_profiles are public to read"
  ON public.user_profiles FOR SELECT
  USING (true);

-- 2. Allow insert
DROP POLICY IF EXISTS "allow insert user_profiles" ON public.user_profiles;
CREATE POLICY "allow insert user_profiles"
  ON public.user_profiles FOR INSERT
  WITH CHECK (true);

-- 3. Allow update
DROP POLICY IF EXISTS "allow update user_profiles" ON public.user_profiles;
CREATE POLICY "allow update user_profiles"
  ON public.user_profiles FOR UPDATE
  USING (true);
