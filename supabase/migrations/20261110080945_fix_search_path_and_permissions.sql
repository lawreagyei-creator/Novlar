/*
# Fix: SECURITY DEFINER function search_path and permissions

## Problem
The `handle_new_user()` trigger function is SECURITY DEFINER but has no explicit
`search_path`. Newer Supabase versions reject functions with mutable search paths,
and the trigger failure rolls back the entire auth signup transaction — producing
the "Database error saving new user" message.

## Changes
1. Recreate `handle_new_user()` with an explicit `search_path = public`.
2. Recreate `update_updated_at()` with an explicit `search_path = public`.
3. Revoke EXECUTE on `handle_new_user()` from PUBLIC, anon, and authenticated
   (it should only be called by the trigger, not via the REST API).
*/

-- Fix handle_new_user with explicit search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id, full_name, phone, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    NEW.raw_user_meta_data->>'phone',
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer')
  );
  RETURN NEW;
END;
$$;

-- Revoke execute from anon and authenticated (trigger runs internally)
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- Fix update_updated_at with explicit search_path
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.update_updated_at() FROM PUBLIC, anon, authenticated;

-- Re-attach triggers (drop and recreate to pick up the new function definitions)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS trigger_collection_requests_updated_at ON collection_requests;
CREATE TRIGGER trigger_collection_requests_updated_at
  BEFORE UPDATE ON collection_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
