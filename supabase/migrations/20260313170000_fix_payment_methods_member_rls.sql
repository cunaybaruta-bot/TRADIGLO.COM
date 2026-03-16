-- Fix: Members cannot see active payment_methods because the policy
-- "payment_methods_read_active" uses NOT is_admin_user() which can fail
-- for regular users if the function errors or returns NULL.
-- Solution: Drop the combined policy and create two clean separate policies:
--   1. Members: simple is_active = true (no admin check)
--   2. Admins: full access via existing payment_methods_admin_all policy

-- Drop the problematic combined policy
DROP POLICY IF EXISTS "payment_methods_read_active" ON public.payment_methods;

-- New clean policy: any authenticated user can read active payment methods
-- (admin policy already handles admin full access separately)
CREATE POLICY "payment_methods_members_read_active"
ON public.payment_methods
FOR SELECT
TO authenticated
USING (is_active = true);

-- Ensure admin full-access policy still exists (recreate for safety)
DROP POLICY IF EXISTS "payment_methods_admin_all" ON public.payment_methods;
CREATE POLICY "payment_methods_admin_all"
ON public.payment_methods
FOR ALL
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());
