-- ============================================================
-- Patch 001 — Allow users to update their own profile
-- Run this in: Supabase Dashboard → SQL Editor → New Query
--
-- Without this, only admins can update profiles (via the
-- existing "admins_update_profiles" policy), which means
-- regular users' avatar uploads are silently rejected by RLS.
-- ============================================================

CREATE POLICY "users_update_own_profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());
