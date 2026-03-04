-- ============================================================
-- Internal Team Tracker — Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- 1. Create profiles table
CREATE TABLE public.profiles (
  id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT        NOT NULL,
  full_name   TEXT,
  avatar_url  TEXT,
  role        TEXT        NOT NULL DEFAULT 'employee' CHECK (role IN ('admin', 'employee')),
  status      TEXT        NOT NULL DEFAULT 'pending'  CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by UUID        REFERENCES public.profiles(id),
  approved_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
-- All signed-in users can read all profiles (internal tool)
CREATE POLICY "authenticated_read_profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- Users can insert their own profile (fallback if trigger misses)
CREATE POLICY "users_insert_own_profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- Only approved admins can update profiles
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

-- 4. Trigger function — auto-create profile on new signup
--    First user ever becomes admin + approved automatically
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

-- 5. Attach trigger to auth.users
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- IMPORTANT: You already signed in before this schema existed.
-- Run the block below to create your profile retroactively.
-- Your account will be set as admin + approved.
-- ============================================================

INSERT INTO public.profiles (id, email, full_name, avatar_url, role, status)
SELECT
  id,
  COALESCE(email, ''),
  raw_user_meta_data->>'full_name',
  raw_user_meta_data->>'avatar_url',
  'admin',
  'approved'
FROM auth.users
ON CONFLICT (id) DO NOTHING;
