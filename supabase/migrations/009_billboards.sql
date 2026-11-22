-- Migration 009: Billboard Advertising System
-- Run this in your Supabase SQL Editor

-- 1. Create billboards table
CREATE TABLE IF NOT EXISTS public.billboards (
  id              text PRIMARY KEY,
  name            text NOT NULL,
  market          text NOT NULL,
  location        text NOT NULL DEFAULT '',
  plot_id         text REFERENCES public.city_plots(id) ON DELETE SET NULL,
  wall_side       text NOT NULL DEFAULT 'back_wall'
                  CHECK (wall_side IN ('back_wall','side_wall_left','side_wall_right','corner','freestanding')),
  format          text NOT NULL DEFAULT 'landscape'
                  CHECK (format IN ('landscape','portrait')),
  size            text NOT NULL DEFAULT 'large'
                  CHECK (size IN ('monument','large','medium','portrait')),
  width           numeric(6,2)  NOT NULL DEFAULT 7.5,
  height          numeric(6,2)  NOT NULL DEFAULT 4.2,
  elevation       numeric(6,2)  NOT NULL DEFAULT 5.5,
  x               numeric(10,4) NOT NULL DEFAULT 0,
  y               numeric(10,4) NOT NULL DEFAULT 5.5,
  z               numeric(10,4) NOT NULL DEFAULT 0,
  rot             numeric(10,6) NOT NULL DEFAULT 0,
  status          text NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active','inactive','empty')),
  ad_title        text NOT NULL DEFAULT '',
  ad_description  text,
  media_type      text NOT NULL DEFAULT 'image'
                  CHECK (media_type IN ('image','video')),
  media_url       text NOT NULL DEFAULT '',
  target_url      text,
  lighting        boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.billboards ENABLE ROW LEVEL SECURITY;

-- 2. RLS Policies: public read, admin write
CREATE POLICY "billboards_public_read"
  ON public.billboards FOR SELECT USING (true);

CREATE POLICY "billboards_admin_insert"
  ON public.billboards FOR INSERT
  WITH CHECK (true);

CREATE POLICY "billboards_admin_update"
  ON public.billboards FOR UPDATE
  USING (true);

CREATE POLICY "billboards_admin_delete"
  ON public.billboards FOR DELETE
  USING (true);

-- 3. Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION public.update_billboard_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS billboards_updated_at ON public.billboards;
CREATE TRIGGER billboards_updated_at
  BEFORE UPDATE ON public.billboards
  FOR EACH ROW EXECUTE FUNCTION public.update_billboard_timestamp();

-- 4. Performance indexes
CREATE INDEX IF NOT EXISTS billboards_market_idx ON public.billboards(market);
CREATE INDEX IF NOT EXISTS billboards_status_idx ON public.billboards(status);

-- 5. Create billboard_media storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('billboard_media', 'billboard_media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage bucket policies
CREATE POLICY "billboard_media_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'billboard_media');

CREATE POLICY "billboard_media_admin_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'billboard_media');

CREATE POLICY "billboard_media_admin_update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'billboard_media');

CREATE POLICY "billboard_media_admin_delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'billboard_media');
