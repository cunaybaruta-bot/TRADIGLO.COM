-- Fix: Add admin full-access RLS policy for payment_methods table
-- The existing policy only allows reading is_active=true rows for regular users.
-- Admins need to read ALL rows (including inactive) and be able to update them.

-- 1. Admin helper function (checks admin_users table, safe for non-user tables)
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid() LIMIT 1)
  )
$$;

-- 2. Drop existing policy and recreate with proper scope (members only see active)
DROP POLICY IF EXISTS "payment_methods_read_active" ON public.payment_methods;
CREATE POLICY "payment_methods_read_active"
ON public.payment_methods
FOR SELECT
TO authenticated
USING (is_active = true AND NOT public.is_admin_user());

-- 3. Admin full access policy (read ALL rows + update/insert/delete)
DROP POLICY IF EXISTS "payment_methods_admin_all" ON public.payment_methods;
CREATE POLICY "payment_methods_admin_all"
ON public.payment_methods
FOR ALL
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());
