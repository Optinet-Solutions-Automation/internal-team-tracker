-- ============================================================
-- Patch 007 — Migrate shift_status values to new labels
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Step 1: Drop the old check constraint
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_shift_status_check;

-- Step 2: Migrate existing values
UPDATE public.profiles
SET shift_status = CASE
  WHEN shift_status = 'on_shift'   THEN 'available'
  WHEN shift_status = 'on_break'   THEN 'be_right_back'
  WHEN shift_status = 'focus_mode' THEN 'do_not_disturb'
  WHEN shift_status = 'in_meeting' THEN 'busy'
  ELSE shift_status  -- 'off_shift' stays as-is
END
WHERE shift_status IN ('on_shift', 'on_break', 'focus_mode', 'in_meeting');

-- Step 3: Recreate the constraint with new allowed values
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_shift_status_check
  CHECK (shift_status IN ('off_shift', 'available', 'busy', 'do_not_disturb', 'be_right_back', 'appear_away'));
