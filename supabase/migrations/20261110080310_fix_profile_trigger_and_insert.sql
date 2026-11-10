/*
# Fix: Profile auto-creation trigger and INSERT policy

## Problem
1. The `on_auth_user_created` trigger on `auth.users` was not created — the trigger function
   `handle_new_user()` exists but is not attached to the table. This means new signups don't
   get a profile row, so the app sees `profile: null` after signup and the user cannot proceed.
2. The `profiles` table has no INSERT policy. Even with the trigger, the SECURITY DEFINER
   function runs as the caller (the new user), so RLS blocks the INSERT without a policy.
   The function is SECURITY DEFINER (runs as the owner), so it actually bypasses RLS — but
   we also need an INSERT policy for the `ensureDemoAccounts` code path and future use.

## Changes
1. Re-create the `on_auth_user_created` trigger on `auth.users`.
2. Add an INSERT policy on `profiles` allowing users to insert their own profile row.
3. Grant INSERT on `profiles` to `authenticated`.
*/

-- Re-create the trigger (drop first for idempotency)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Add INSERT policy on profiles
GRANT INSERT ON profiles TO authenticated;

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile"
  ON profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);
