-- ============================================================
-- Patch 005 — Add time-tracking columns to tasks
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS total_seconds    BIGINT       NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS session_started_at TIMESTAMPTZ;
