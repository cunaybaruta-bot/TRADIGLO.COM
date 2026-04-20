-- Fix: Update all admin RLS policies to use is_admin_user() instead of is_admin()
-- Root cause: is_admin() checks public.users.role='admin' but admin accounts
-- are stored in admin_users table with role='user' in public.users.
-- is_admin_user() correctly checks the admin_users table.

-- ─── users table ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "admin_manage_all_users" ON public.users;
CREATE POLICY "admin_manage_all_users"
ON public.users
FOR ALL
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- ─── wallets table ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "admin_manage_all_wallets" ON public.wallets;
CREATE POLICY "admin_manage_all_wallets"
ON public.wallets
FOR ALL
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- ─── assets table ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "admin_manage_assets" ON public.assets;
CREATE POLICY "admin_manage_assets"
ON public.assets
FOR ALL
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- ─── asset_categories table ───────────────────────────────────────────────────
DROP POLICY IF EXISTS "admin_manage_asset_categories" ON public.asset_categories;
CREATE POLICY "admin_manage_asset_categories"
ON public.asset_categories
FOR ALL
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- ─── trades table ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "admin_manage_all_trades" ON public.trades;
CREATE POLICY "admin_manage_all_trades"
ON public.trades
FOR ALL
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- ─── transactions table ───────────────────────────────────────────────────────
DROP POLICY IF EXISTS "admin_manage_all_transactions" ON public.transactions;
CREATE POLICY "admin_manage_all_transactions"
ON public.transactions
FOR ALL
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- ─── deposits table ───────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "admin_manage_all_deposits" ON public.deposits;
CREATE POLICY "admin_manage_all_deposits"
ON public.deposits
FOR ALL
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- ─── withdrawals table ────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "admin_manage_all_withdrawals" ON public.withdrawals;
CREATE POLICY "admin_manage_all_withdrawals"
ON public.withdrawals
FOR ALL
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- ─── admin_logs table ─────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "admin_manage_admin_logs" ON public.admin_logs;
CREATE POLICY "admin_manage_admin_logs"
ON public.admin_logs
FOR ALL
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- ─── market_prices table ──────────────────────────────────────────────────────
DROP POLICY IF EXISTS "admin_manage_market_prices" ON public.market_prices;
CREATE POLICY "admin_manage_market_prices"
ON public.market_prices
FOR ALL
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- ─── admin_notifications table ────────────────────────────────────────────────
DROP POLICY IF EXISTS "admin_manage_notifications" ON public.admin_notifications;
CREATE POLICY "admin_manage_notifications"
ON public.admin_notifications
FOR ALL
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- ─── copy_trade_providers table ───────────────────────────────────────────────
-- Add admin write access (previously only had public read)
DROP POLICY IF EXISTS "copy_trade_providers_admin_all" ON public.copy_trade_providers;
CREATE POLICY "copy_trade_providers_admin_all"
ON public.copy_trade_providers
FOR ALL
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- ─── referrals table ──────────────────────────────────────────────────────────
-- Add admin full access policy (previously no admin policy existed)
DROP POLICY IF EXISTS "admin_manage_all_referrals" ON public.referrals;
CREATE POLICY "admin_manage_all_referrals"
ON public.referrals
FOR ALL
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- ─── bonus_settings table ─────────────────────────────────────────────────────
ALTER TABLE public.bonus_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_manage_bonus_settings" ON public.bonus_settings;
CREATE POLICY "admin_manage_bonus_settings"
ON public.bonus_settings
FOR ALL
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- Allow authenticated users to read active bonus settings (for deposit flow)
DROP POLICY IF EXISTS "authenticated_read_active_bonus_settings" ON public.bonus_settings;
CREATE POLICY "authenticated_read_active_bonus_settings"
ON public.bonus_settings
FOR SELECT
TO authenticated
USING (is_active = true AND NOT public.is_admin_user());

-- ─── demo_trade_limits table ──────────────────────────────────────────────────
DROP POLICY IF EXISTS "admin_manage_demo_trade_limits" ON public.demo_trade_limits;
CREATE POLICY "admin_manage_demo_trade_limits"
ON public.demo_trade_limits
FOR ALL
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());
