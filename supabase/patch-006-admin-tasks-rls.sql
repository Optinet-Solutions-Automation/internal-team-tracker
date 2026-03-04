-- ============================================================
-- Patch 006 — Admin RLS policies for tasks table
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Allow admins to read ALL tasks (not just their own)
CREATE POLICY "admins_can_read_all_tasks"
  ON public.tasks FOR SELECT
  USING (
    auth.uid() = user_id
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- Allow admins to update ANY task (for time editing)
CREATE POLICY "admins_can_update_all_tasks"
  ON public.tasks FOR UPDATE
  USING (
    auth.uid() = user_id
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- NOTE: If you already have policies named "users can read own tasks" etc.,
-- you may need to DROP those first and recreate them with the above, or
-- check in Supabase Dashboard → Authentication → Policies → tasks table.
