-- ============================================================
-- Patch 008 — Daily logs table
-- Records what each user is working on per PHT calendar day.
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

CREATE TABLE IF NOT EXISTS public.daily_logs (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  task_id     UUID        REFERENCES public.tasks(id) ON DELETE SET NULL,
  description TEXT        NOT NULL,
  department  TEXT        NOT NULL CHECK (department IN ('automation', 'webdev')),
  log_date    DATE        NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now(),

  -- One entry per user per task per day; safe to upsert
  UNIQUE (user_id, task_id, log_date)
);

ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;

-- Admins can read all logs
CREATE POLICY "admins_read_daily_logs"
  ON public.daily_logs FOR SELECT
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- Users can insert their own log entries (via setCurrentTask server action)
CREATE POLICY "users_insert_own_daily_logs"
  ON public.daily_logs FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can upsert (update) their own log entries
CREATE POLICY "users_update_own_daily_logs"
  ON public.daily_logs FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());
