-- ============================================================
-- Patch 002 — Add presence / shift status columns
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS presence_status TEXT NOT NULL DEFAULT 'offline'
    CHECK (presence_status IN ('online', 'offline', 'busy')),
  ADD COLUMN IF NOT EXISTS shift_status TEXT NOT NULL DEFAULT 'off_shift'
    CHECK (shift_status IN ('off_shift', 'on_shift', 'on_break', 'focus_mode', 'in_meeting')),
  ADD COLUMN IF NOT EXISTS status_updated_at TIMESTAMPTZ;
