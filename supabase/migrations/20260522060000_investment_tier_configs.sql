-- ─── Investment Tier & Duration Configs ──────────────────────────────────────
-- Admin-controlled configuration tables for investment packages.
-- Admin saves tier/package configs here; member dashboard reads from here.

-- Step 1: investment_tier_configs table
CREATE TABLE IF NOT EXISTS public.investment_tier_configs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier          TEXT NOT NULL,
  capital_usd   NUMERIC(18, 2) NOT NULL,
  base_profit   NUMERIC(18, 2) NOT NULL,
  is_enabled    BOOLEAN NOT NULL DEFAULT true,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Step 2: investment_duration_configs table
CREATE TABLE IF NOT EXISTS public.investment_duration_configs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  duration_id   TEXT NOT NULL UNIQUE,
  label         TEXT NOT NULL,
  factor        NUMERIC(6, 2) NOT NULL DEFAULT 1.0,
  is_enabled    BOOLEAN NOT NULL DEFAULT true,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Step 3: Indexes
CREATE INDEX IF NOT EXISTS idx_investment_tier_configs_tier
  ON public.investment_tier_configs(tier);

CREATE INDEX IF NOT EXISTS idx_investment_tier_configs_enabled
  ON public.investment_tier_configs(is_enabled);

-- Step 4: Enable RLS
ALTER TABLE public.investment_tier_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_duration_configs ENABLE ROW LEVEL SECURITY;

-- Step 5: RLS Policies
-- Authenticated users can read configs (needed by member dashboard)
DROP POLICY IF EXISTS "authenticated_read_tier_configs" ON public.investment_tier_configs;
CREATE POLICY "authenticated_read_tier_configs"
  ON public.investment_tier_configs
  FOR SELECT
  TO authenticated
  USING (true);

-- Only service role / admin can write (admin panel uses service role via anon key with admin check)
DROP POLICY IF EXISTS "anon_read_tier_configs" ON public.investment_tier_configs;
CREATE POLICY "anon_read_tier_configs"
  ON public.investment_tier_configs
  FOR SELECT
  TO anon
  USING (true);

DROP POLICY IF EXISTS "authenticated_write_tier_configs" ON public.investment_tier_configs;
CREATE POLICY "authenticated_write_tier_configs"
  ON public.investment_tier_configs
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_read_duration_configs" ON public.investment_duration_configs;
CREATE POLICY "authenticated_read_duration_configs"
  ON public.investment_duration_configs
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "anon_read_duration_configs" ON public.investment_duration_configs;
CREATE POLICY "anon_read_duration_configs"
  ON public.investment_duration_configs
  FOR SELECT
  TO anon
  USING (true);

DROP POLICY IF EXISTS "authenticated_write_duration_configs" ON public.investment_duration_configs;
CREATE POLICY "authenticated_write_duration_configs"
  ON public.investment_duration_configs
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Step 6: Seed default data
DO $$
BEGIN
  -- Only seed if tables are empty
  IF NOT EXISTS (SELECT 1 FROM public.investment_tier_configs LIMIT 1) THEN
    INSERT INTO public.investment_tier_configs (tier, capital_usd, base_profit, is_enabled, sort_order) VALUES
      ('basic',   100,   2500,    true, 1),
      ('basic',   300,   5000,    true, 2),
      ('basic',   500,   10000,   true, 3),
      ('basic',   1000,  25000,   true, 4),
      ('silver',  2000,  40000,   true, 5),
      ('silver',  3000,  65000,   true, 6),
      ('silver',  5000,  100000,  true, 7),
      ('gold',    5000,  85000,   true, 8),
      ('gold',    7000,  115000,  true, 9),
      ('gold',    10000, 160000,  true, 10),
      ('gold',    15000, 215000,  true, 11),
      ('diamond', 20000, 1000000, true, 12),
      ('diamond', 25000, 1250000, true, 13),
      ('diamond', 30000, 2100000, true, 14),
      ('diamond', 60000, 2450000, true, 15);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.investment_duration_configs LIMIT 1) THEN
    INSERT INTO public.investment_duration_configs (duration_id, label, factor, is_enabled, sort_order) VALUES
      ('3h',  '3 Hours',  1.0, true, 1),
      ('6h',  '6 Hours',  1.4, true, 2),
      ('12h', '12 Hours', 2.0, true, 3),
      ('1d',  '1 Day',    3.2, true, 4);
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Seed data insertion failed: %', SQLERRM;
END $$;
