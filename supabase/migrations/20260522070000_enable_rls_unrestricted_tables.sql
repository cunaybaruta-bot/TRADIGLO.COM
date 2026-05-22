-- ============================================================
-- Enable RLS on all previously UNRESTRICTED tables
-- Tables: market_prices, copy_strategies, copy_followers,
--         copy_trade_logs, currency_rates
-- ============================================================

-- Helper function: check if current user is admin (via admin_users table)
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

-- ============================================================
-- 1. market_prices
--    Public data: anyone can read prices; only admins/service can write
-- ============================================================
ALTER TABLE public.market_prices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "market_prices_public_read" ON public.market_prices;
CREATE POLICY "market_prices_public_read"
ON public.market_prices
FOR SELECT
TO public
USING (true);

DROP POLICY IF EXISTS "market_prices_admin_write" ON public.market_prices;
CREATE POLICY "market_prices_admin_write"
ON public.market_prices
FOR ALL
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- ============================================================
-- 2. currency_rates
--    Public data: anyone can read rates; only admins can write
-- ============================================================
ALTER TABLE public.currency_rates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "currency_rates_public_read" ON public.currency_rates;
CREATE POLICY "currency_rates_public_read"
ON public.currency_rates
FOR SELECT
TO public
USING (true);

DROP POLICY IF EXISTS "currency_rates_admin_write" ON public.currency_rates;
CREATE POLICY "currency_rates_admin_write"
ON public.currency_rates
FOR ALL
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- ============================================================
-- 3. copy_strategies
--    Public read (strategies are visible to all users);
--    only admins can create/update/delete strategies
-- ============================================================
ALTER TABLE public.copy_strategies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "copy_strategies_public_read" ON public.copy_strategies;
CREATE POLICY "copy_strategies_public_read"
ON public.copy_strategies
FOR SELECT
TO public
USING (true);

DROP POLICY IF EXISTS "copy_strategies_admin_write" ON public.copy_strategies;
CREATE POLICY "copy_strategies_admin_write"
ON public.copy_strategies
FOR ALL
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- ============================================================
-- 4. copy_followers
--    Users can see and manage their own follow records;
--    admins can see all
-- ============================================================
ALTER TABLE public.copy_followers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "copy_followers_user_own" ON public.copy_followers;
CREATE POLICY "copy_followers_user_own"
ON public.copy_followers
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "copy_followers_admin_all" ON public.copy_followers;
CREATE POLICY "copy_followers_admin_all"
ON public.copy_followers
FOR ALL
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- ============================================================
-- 5. copy_trade_logs
--    Authenticated users can read logs (for copy trading display);
--    only admins/service role can insert/update/delete
-- ============================================================
ALTER TABLE public.copy_trade_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "copy_trade_logs_authenticated_read" ON public.copy_trade_logs;
CREATE POLICY "copy_trade_logs_authenticated_read"
ON public.copy_trade_logs
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "copy_trade_logs_admin_write" ON public.copy_trade_logs;
CREATE POLICY "copy_trade_logs_admin_write"
ON public.copy_trade_logs
FOR ALL
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());
