-- ============================================================
-- GLOBAL MULTI-ASSET TRADING PLATFORM - CORE DATABASE SCHEMA
-- Migration: 20260310024225_trading_platform_schema.sql
-- ============================================================

-- ============================================================
-- 1. CORE TABLES (no foreign key dependencies)
-- ============================================================

-- Users table (mirrors auth.users for public schema compatibility)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Asset categories table
CREATE TABLE IF NOT EXISTS public.asset_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL CHECK (name IN ('crypto', 'forex', 'stocks', 'commodities')),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 2. DEPENDENT TABLES (require parent tables above)
-- ============================================================

-- Wallets table
CREATE TABLE IF NOT EXISTS public.wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    real_balance NUMERIC(20,8) DEFAULT 0,
    demo_balance NUMERIC(20,8) DEFAULT 10000,
    currency TEXT DEFAULT 'USD',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Assets table
CREATE TABLE IF NOT EXISTS public.assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol TEXT NOT NULL,
    name TEXT NOT NULL,
    category_id UUID REFERENCES public.asset_categories(id),
    coingecko_id TEXT,
    exchange TEXT,
    base_currency TEXT,
    quote_currency TEXT DEFAULT 'USD',
    is_active BOOLEAN DEFAULT true,
    logo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(symbol, exchange)
);

-- Market prices table
CREATE TABLE IF NOT EXISTS public.market_prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID REFERENCES public.assets(id) ON DELETE CASCADE,
    price NUMERIC(30,10) NOT NULL,
    price_change_24h NUMERIC(20,10),
    price_change_pct_24h NUMERIC(10,4),
    volume_24h NUMERIC(30,2),
    market_cap NUMERIC(30,2),
    high_24h NUMERIC(30,10),
    low_24h NUMERIC(30,10),
    timestamp TIMESTAMPTZ DEFAULT now()
);

-- Trades table
CREATE TABLE IF NOT EXISTS public.trades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    asset_id UUID REFERENCES public.assets(id),
    order_type TEXT NOT NULL CHECK (order_type IN ('buy', 'sell')),
    amount NUMERIC(20,2) NOT NULL CHECK (amount >= 1 AND amount <= 10000),
    duration_seconds INTEGER NOT NULL CHECK (duration_seconds IN (5, 10, 15, 20, 30, 45, 60, 120, 300, 600, 1800, 3600, 7200, 14400, 86400, 172800)),
    entry_price NUMERIC(30,10) NOT NULL,
    exit_price NUMERIC(30,10),
    profit NUMERIC(20,2),
    payout_percent NUMERIC(5,2) DEFAULT 95,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed', 'cancelled')),
    is_demo BOOLEAN DEFAULT true,
    opened_at TIMESTAMPTZ DEFAULT now(),
    closed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'trade_open', 'trade_close', 'bonus')),
    amount NUMERIC(20,2) NOT NULL,
    balance_before NUMERIC(20,2),
    balance_after NUMERIC(20,2),
    reference_id UUID,
    description TEXT,
    status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
    is_demo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Deposits table
CREATE TABLE IF NOT EXISTS public.deposits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    amount NUMERIC(20,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    payment_method TEXT,
    payment_reference TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Withdrawals table
CREATE TABLE IF NOT EXISTS public.withdrawals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    amount NUMERIC(20,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    destination_address TEXT,
    payment_method TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
    processed_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Admin logs table
CREATE TABLE IF NOT EXISTS public.admin_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES public.users(id),
    action TEXT NOT NULL,
    target_table TEXT,
    target_id UUID,
    old_value JSONB,
    new_value JSONB,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 3. INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON public.wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_assets_category_id ON public.assets(category_id);
CREATE INDEX IF NOT EXISTS idx_assets_symbol ON public.assets(symbol);
CREATE INDEX IF NOT EXISTS idx_assets_coingecko_id ON public.assets(coingecko_id);
CREATE INDEX IF NOT EXISTS idx_market_prices_asset_id ON public.market_prices(asset_id);
CREATE INDEX IF NOT EXISTS idx_market_prices_timestamp ON public.market_prices(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_trades_user_id ON public.trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_asset_id ON public.trades(asset_id);
CREATE INDEX IF NOT EXISTS idx_trades_status ON public.trades(status);
CREATE INDEX IF NOT EXISTS idx_trades_opened_at ON public.trades(opened_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_deposits_user_id ON public.deposits(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON public.withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_id ON public.admin_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON public.admin_logs(created_at DESC);

-- ============================================================
-- 4. FUNCTIONS
-- ============================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Trigger function to auto-create wallet when user is created
CREATE OR REPLACE FUNCTION public.handle_new_user_wallet()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.wallets (user_id, real_balance, demo_balance, currency)
    VALUES (NEW.id, 0, 10000, 'USD')
    ON CONFLICT DO NOTHING;
    RETURN NEW;
END;
$$;

-- Sync auth.users to public.users on signup
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name, avatar_url, role, is_verified)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
        COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
        COALESCE((NEW.email_confirmed_at IS NOT NULL), false)
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

-- Admin role check function (uses auth metadata to avoid recursion)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND role = 'admin'
    );
$$;

-- ============================================================
-- 5. ENABLE ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 6. RLS POLICIES
-- ============================================================

-- users policies
DROP POLICY IF EXISTS "users_manage_own" ON public.users;
CREATE POLICY "users_manage_own"
ON public.users FOR ALL TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "admin_manage_all_users" ON public.users;
CREATE POLICY "admin_manage_all_users"
ON public.users FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- wallets policies
DROP POLICY IF EXISTS "users_manage_own_wallets" ON public.wallets;
CREATE POLICY "users_manage_own_wallets"
ON public.wallets FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "admin_manage_all_wallets" ON public.wallets;
CREATE POLICY "admin_manage_all_wallets"
ON public.wallets FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- asset_categories policies (public read)
DROP POLICY IF EXISTS "public_read_asset_categories" ON public.asset_categories;
CREATE POLICY "public_read_asset_categories"
ON public.asset_categories FOR SELECT TO public
USING (true);

DROP POLICY IF EXISTS "admin_manage_asset_categories" ON public.asset_categories;
CREATE POLICY "admin_manage_asset_categories"
ON public.asset_categories FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- assets policies (public read)
DROP POLICY IF EXISTS "public_read_assets" ON public.assets;
CREATE POLICY "public_read_assets"
ON public.assets FOR SELECT TO public
USING (true);

DROP POLICY IF EXISTS "admin_manage_assets" ON public.assets;
CREATE POLICY "admin_manage_assets"
ON public.assets FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- market_prices policies (public read)
DROP POLICY IF EXISTS "public_read_market_prices" ON public.market_prices;
CREATE POLICY "public_read_market_prices"
ON public.market_prices FOR SELECT TO public
USING (true);

DROP POLICY IF EXISTS "admin_manage_market_prices" ON public.market_prices;
CREATE POLICY "admin_manage_market_prices"
ON public.market_prices FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- trades policies
DROP POLICY IF EXISTS "users_manage_own_trades" ON public.trades;
CREATE POLICY "users_manage_own_trades"
ON public.trades FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "admin_manage_all_trades" ON public.trades;
CREATE POLICY "admin_manage_all_trades"
ON public.trades FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- transactions policies
DROP POLICY IF EXISTS "users_view_own_transactions" ON public.transactions;
CREATE POLICY "users_view_own_transactions"
ON public.transactions FOR SELECT TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "system_insert_transactions" ON public.transactions;
CREATE POLICY "system_insert_transactions"
ON public.transactions FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "admin_manage_all_transactions" ON public.transactions;
CREATE POLICY "admin_manage_all_transactions"
ON public.transactions FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- deposits policies
DROP POLICY IF EXISTS "users_manage_own_deposits" ON public.deposits;
CREATE POLICY "users_manage_own_deposits"
ON public.deposits FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "admin_manage_all_deposits" ON public.deposits;
CREATE POLICY "admin_manage_all_deposits"
ON public.deposits FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- withdrawals policies
DROP POLICY IF EXISTS "users_manage_own_withdrawals" ON public.withdrawals;
CREATE POLICY "users_manage_own_withdrawals"
ON public.withdrawals FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "admin_manage_all_withdrawals" ON public.withdrawals;
CREATE POLICY "admin_manage_all_withdrawals"
ON public.withdrawals FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- admin_logs policies
DROP POLICY IF EXISTS "admin_manage_admin_logs" ON public.admin_logs;
CREATE POLICY "admin_manage_admin_logs"
ON public.admin_logs FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ============================================================
-- 7. TRIGGERS
-- ============================================================

-- updated_at triggers
DROP TRIGGER IF EXISTS set_updated_at_users ON public.users;
CREATE TRIGGER set_updated_at_users
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_wallets ON public.wallets;
CREATE TRIGGER set_updated_at_wallets
    BEFORE UPDATE ON public.wallets
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_assets ON public.assets;
CREATE TRIGGER set_updated_at_assets
    BEFORE UPDATE ON public.assets
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_deposits ON public.deposits;
CREATE TRIGGER set_updated_at_deposits
    BEFORE UPDATE ON public.deposits
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_withdrawals ON public.withdrawals;
CREATE TRIGGER set_updated_at_withdrawals
    BEFORE UPDATE ON public.withdrawals
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Auto-create wallet when new user is inserted into public.users
DROP TRIGGER IF EXISTS on_new_user_create_wallet ON public.users;
CREATE TRIGGER on_new_user_create_wallet
    AFTER INSERT ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_wallet();

-- Sync auth.users to public.users on auth signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- ============================================================
-- 8. SEED DATA - asset_categories
-- ============================================================

DO $$
BEGIN
    INSERT INTO public.asset_categories (id, name, description)
    VALUES
        (gen_random_uuid(), 'crypto', 'Cryptocurrencies and digital assets including Bitcoin, Ethereum, and thousands of altcoins synchronized from CoinGecko'),
        (gen_random_uuid(), 'forex', 'Foreign exchange currency pairs including major, minor, and exotic pairs from global forex markets'),
        (gen_random_uuid(), 'stocks', 'Equity shares of publicly traded companies from major stock exchanges worldwide including NYSE, NASDAQ, and more'),
        (gen_random_uuid(), 'commodities', 'Physical goods and raw materials including precious metals, energy, and agricultural products')
    ON CONFLICT (name) DO NOTHING;
END $$;

-- ============================================================
-- 9. SEED DATA - Sample assets per category
-- ============================================================

DO $$
DECLARE
    crypto_cat_id UUID;
    forex_cat_id UUID;
    stocks_cat_id UUID;
    commodities_cat_id UUID;
BEGIN
    SELECT id INTO crypto_cat_id FROM public.asset_categories WHERE name = 'crypto' LIMIT 1;
    SELECT id INTO forex_cat_id FROM public.asset_categories WHERE name = 'forex' LIMIT 1;
    SELECT id INTO stocks_cat_id FROM public.asset_categories WHERE name = 'stocks' LIMIT 1;
    SELECT id INTO commodities_cat_id FROM public.asset_categories WHERE name = 'commodities' LIMIT 1;

    -- Crypto assets
    IF crypto_cat_id IS NOT NULL THEN
        INSERT INTO public.assets (symbol, name, category_id, coingecko_id, exchange, base_currency, quote_currency, is_active)
        VALUES
            ('BTC', 'Bitcoin', crypto_cat_id, 'bitcoin', 'BINANCE', 'BTC', 'USD', true),
            ('ETH', 'Ethereum', crypto_cat_id, 'ethereum', 'BINANCE', 'ETH', 'USD', true),
            ('BNB', 'BNB', crypto_cat_id, 'binancecoin', 'BINANCE', 'BNB', 'USD', true),
            ('SOL', 'Solana', crypto_cat_id, 'solana', 'BINANCE', 'SOL', 'USD', true),
            ('XRP', 'XRP', crypto_cat_id, 'ripple', 'BINANCE', 'XRP', 'USD', true),
            ('ADA', 'Cardano', crypto_cat_id, 'cardano', 'BINANCE', 'ADA', 'USD', true),
            ('DOGE', 'Dogecoin', crypto_cat_id, 'dogecoin', 'BINANCE', 'DOGE', 'USD', true),
            ('AVAX', 'Avalanche', crypto_cat_id, 'avalanche-2', 'BINANCE', 'AVAX', 'USD', true),
            ('DOT', 'Polkadot', crypto_cat_id, 'polkadot', 'BINANCE', 'DOT', 'USD', true),
            ('MATIC', 'Polygon', crypto_cat_id, 'matic-network', 'BINANCE', 'MATIC', 'USD', true)
        ON CONFLICT (symbol, exchange) DO NOTHING;
    END IF;

    -- Forex assets
    IF forex_cat_id IS NOT NULL THEN
        INSERT INTO public.assets (symbol, name, category_id, exchange, base_currency, quote_currency, is_active)
        VALUES
            ('EURUSD', 'Euro / US Dollar', forex_cat_id, 'FX', 'EUR', 'USD', true),
            ('GBPUSD', 'British Pound / US Dollar', forex_cat_id, 'FX', 'GBP', 'USD', true),
            ('USDJPY', 'US Dollar / Japanese Yen', forex_cat_id, 'FX', 'USD', 'JPY', true),
            ('AUDUSD', 'Australian Dollar / US Dollar', forex_cat_id, 'FX', 'AUD', 'USD', true),
            ('USDCAD', 'US Dollar / Canadian Dollar', forex_cat_id, 'FX', 'USD', 'CAD', true),
            ('USDCHF', 'US Dollar / Swiss Franc', forex_cat_id, 'FX', 'USD', 'CHF', true),
            ('NZDUSD', 'New Zealand Dollar / US Dollar', forex_cat_id, 'FX', 'NZD', 'USD', true),
            ('EURGBP', 'Euro / British Pound', forex_cat_id, 'FX', 'EUR', 'GBP', true)
        ON CONFLICT (symbol, exchange) DO NOTHING;
    END IF;

    -- Stocks assets
    IF stocks_cat_id IS NOT NULL THEN
        INSERT INTO public.assets (symbol, name, category_id, exchange, base_currency, quote_currency, is_active)
        VALUES
            ('AAPL', 'Apple Inc.', stocks_cat_id, 'NASDAQ', 'USD', 'USD', true),
            ('MSFT', 'Microsoft Corporation', stocks_cat_id, 'NASDAQ', 'USD', 'USD', true),
            ('GOOGL', 'Alphabet Inc.', stocks_cat_id, 'NASDAQ', 'USD', 'USD', true),
            ('AMZN', 'Amazon.com Inc.', stocks_cat_id, 'NASDAQ', 'USD', 'USD', true),
            ('TSLA', 'Tesla Inc.', stocks_cat_id, 'NASDAQ', 'USD', 'USD', true),
            ('META', 'Meta Platforms Inc.', stocks_cat_id, 'NASDAQ', 'USD', 'USD', true),
            ('NVDA', 'NVIDIA Corporation', stocks_cat_id, 'NASDAQ', 'USD', 'USD', true),
            ('JPM', 'JPMorgan Chase & Co.', stocks_cat_id, 'NYSE', 'USD', 'USD', true)
        ON CONFLICT (symbol, exchange) DO NOTHING;
    END IF;

    -- Commodities assets
    IF commodities_cat_id IS NOT NULL THEN
        INSERT INTO public.assets (symbol, name, category_id, exchange, base_currency, quote_currency, is_active)
        VALUES
            ('XAUUSD', 'Gold / US Dollar', commodities_cat_id, 'COMEX', 'XAU', 'USD', true),
            ('XAGUSD', 'Silver / US Dollar', commodities_cat_id, 'COMEX', 'XAG', 'USD', true),
            ('USOIL', 'Crude Oil (WTI)', commodities_cat_id, 'NYMEX', 'USD', 'USD', true),
            ('UKOIL', 'Crude Oil (Brent)', commodities_cat_id, 'ICE', 'USD', 'USD', true),
            ('NATGAS', 'Natural Gas', commodities_cat_id, 'NYMEX', 'USD', 'USD', true),
            ('COPPER', 'Copper', commodities_cat_id, 'COMEX', 'USD', 'USD', true)
        ON CONFLICT (symbol, exchange) DO NOTHING;
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Seed data insertion failed: %', SQLERRM;
END $$;
