-- ============================================================
-- Internal Team Tracker — Production Schema Export
-- Generated: 2026-03-24
--
-- This is a clean, consolidated schema (all patches merged).
-- NO DATA is included — schema only.
--
-- Run this in:
--   Supabase Dashboard → SQL Editor → New Query
-- ============================================================


-- ============================================================
-- SECTION 1: PROFILES TABLE
-- ============================================================

CREATE TABLE public.profiles (
  id                UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email             TEXT        NOT NULL,
  full_name         TEXT,
  avatar_url        TEXT,
  role              TEXT        NOT NULL DEFAULT 'employee'
                                CHECK (role IN ('admin', 'employee')),
  status            TEXT        NOT NULL DEFAULT 'pending'
                                CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by       UUID        REFERENCES public.profiles(id),
  approved_at       TIMESTAMPTZ,
  presence_status   TEXT        NOT NULL DEFAULT 'offline'
                                CHECK (presence_status IN ('online', 'offline', 'busy')),
  shift_status      TEXT        NOT NULL DEFAULT 'off_shift'
                                CONSTRAINT profiles_shift_status_check
                                CHECK (shift_status IN (
                                  'off_shift', 'available', 'busy',
                                  'do_not_disturb', 'be_right_back', 'appear_away'
                                )),
  status_updated_at TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- All signed-in users can read all profiles
CREATE POLICY "authenticated_read_profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- Users can insert their own profile (fallback if trigger misses)
CREATE POLICY "users_insert_own_profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- Users can update their own profile (avatar, display name, etc.)
CREATE POLICY "users_update_own_profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING     (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Approved admins can update any profile (approve/reject/role changes)
CREATE POLICY "admins_update_profiles"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'admin'
        AND p.status = 'approved'
    )
  );


-- ============================================================
-- SECTION 2: TRIGGER — Auto-create profile on signup
--   First user ever becomes admin + approved automatically.
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO existing_count FROM public.profiles;

  INSERT INTO public.profiles (id, email, full_name, avatar_url, role, status)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    CASE WHEN existing_count = 0 THEN 'admin'    ELSE 'employee' END,
    CASE WHEN existing_count = 0 THEN 'approved' ELSE 'pending'  END
  );

  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();


-- ============================================================
-- SECTION 3: TASKS TABLE
-- ============================================================

CREATE TABLE public.tasks (
  id                  UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id             UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  description         TEXT        NOT NULL,
  department          TEXT        NOT NULL CHECK (department IN ('automation', 'webdev')),
  is_current          BOOLEAN     NOT NULL DEFAULT false,
  completed_at        TIMESTAMPTZ,
  total_seconds       BIGINT      NOT NULL DEFAULT 0,
  session_started_at  TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- All authenticated users can see all tasks (team visibility)
CREATE POLICY "tasks_select_all"
  ON public.tasks FOR SELECT
  TO authenticated
  USING (true);

-- Users can only create tasks for themselves
CREATE POLICY "tasks_insert_own"
  ON public.tasks FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can update their own tasks
CREATE POLICY "tasks_update_own"
  ON public.tasks FOR UPDATE
  TO authenticated
  USING     (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own tasks
CREATE POLICY "tasks_delete_own"
  ON public.tasks FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Admins can read ALL tasks
CREATE POLICY "admins_can_read_all_tasks"
  ON public.tasks FOR SELECT
  USING (
    auth.uid() = user_id
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- Admins can update ANY task (for time editing)
CREATE POLICY "admins_can_update_all_tasks"
  ON public.tasks FOR UPDATE
  USING (
    auth.uid() = user_id
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );


-- ============================================================
-- SECTION 4: STORAGE — Avatars bucket
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Users can upload into their own folder
CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can overwrite/update their own avatar
CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Anyone can read avatars (shown to teammates)
CREATE POLICY "Public can read avatars"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'avatars');
