-- Fix: Admin cannot see deposits in admin panel
-- Root cause: The is_admin_user() function may not match correctly,
-- and the deposits_admin_all policy uses admin_users.id = auth.uid()
-- which is WRONG (admin_users.id is a random UUID, not the auth UUID).
-- Fix: Drop all conflicting deposit admin policies and recreate with correct logic.
-- Also ensure the users table admin policy is correct for the join.

-- Step 1: Recreate is_admin_user() to be more robust
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users au
    JOIN auth.users authU ON authU.email = au.email
    WHERE authU.id = auth.uid()
  )
$$;

-- Step 2: Drop ALL existing deposit admin policies to avoid conflicts
DROP POLICY IF EXISTS "deposits_admin_all" ON public.deposits;
DROP POLICY IF EXISTS "admin_manage_all_deposits" ON public.deposits;

-- Step 3: Recreate single clean admin policy for deposits
CREATE POLICY "admin_manage_all_deposits"
ON public.deposits
FOR ALL
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- Step 4: Ensure user SELECT policies exist for deposits (non-admin users)
DROP POLICY IF EXISTS "deposits_select_own" ON public.deposits;
CREATE POLICY "deposits_select_own"
ON public.deposits
FOR SELECT
TO authenticated
USING (user_id = auth.uid() AND NOT public.is_admin_user());

DROP POLICY IF EXISTS "deposits_insert_own" ON public.deposits;
CREATE POLICY "deposits_insert_own"
ON public.deposits
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid() AND NOT public.is_admin_user());

-- Step 5: Drop old conflicting user policies
DROP POLICY IF EXISTS "users_manage_own_deposits" ON public.deposits;

-- Step 6: Ensure admin can read all users (for the users(email) join in admin page)
DROP POLICY IF EXISTS "admin_manage_all_users" ON public.users;
CREATE POLICY "admin_manage_all_users"
ON public.users
FOR ALL
TO authenticated
USING (public.is_admin_user() OR id = auth.uid())
WITH CHECK (public.is_admin_user() OR id = auth.uid());
