-- ============================================================
-- Patch 003 — Fix presence persistence (safe to re-run)
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- 1. Ensure presence columns exist
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS presence_status TEXT NOT NULL DEFAULT 'offline'
    CHECK (presence_status IN ('online', 'offline', 'busy')),
  ADD COLUMN IF NOT EXISTS shift_status TEXT NOT NULL DEFAULT 'off_shift'
    CHECK (shift_status IN ('off_shift', 'on_shift', 'on_break', 'focus_mode', 'in_meeting')),
  ADD COLUMN IF NOT EXISTS status_updated_at TIMESTAMPTZ;

-- 2. Ensure the self-update RLS policy exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename   = 'profiles'
      AND policyname  = 'users_update_own_profile'
  ) THEN
    CREATE POLICY "users_update_own_profile"
      ON public.profiles FOR UPDATE
      TO authenticated
      USING     (id = auth.uid())
      WITH CHECK (id = auth.uid());
  END IF;
END $$;
