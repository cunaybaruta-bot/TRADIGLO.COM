-- ─── Investment Packages ─────────────────────────────────────────────────────
-- Creates investment_packages table for timed investment tiers.
-- Members join a package (Basic/Silver/Gold/Diamond) with a chosen duration.
-- Profit scales with duration. Platform takes 20% fee from gross profit.
-- Packages cannot be cancelled once joined; they auto-complete when duration expires.

-- Step 1: ENUM types
DROP TYPE IF EXISTS public.investment_tier CASCADE;
CREATE TYPE public.investment_tier AS ENUM ('basic', 'silver', 'gold', 'diamond');

DROP TYPE IF EXISTS public.investment_duration CASCADE;
CREATE TYPE public.investment_duration AS ENUM ('3h', '6h', '12h', '1d');

DROP TYPE IF EXISTS public.investment_status CASCADE;
CREATE TYPE public.investment_status AS ENUM ('active', 'completed', 'pending_payout');

-- Step 2: investment_packages table
CREATE TABLE IF NOT EXISTS public.investment_packages (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tier                 public.investment_tier NOT NULL,
  capital_usd          NUMERIC(18, 2) NOT NULL,
  duration             public.investment_duration NOT NULL,
  gross_profit_usd     NUMERIC(18, 2) NOT NULL,
  platform_fee_usd     NUMERIC(18, 2) NOT NULL DEFAULT 0,
  net_profit_usd       NUMERIC(18, 2) NOT NULL DEFAULT 0,
  status               public.investment_status NOT NULL DEFAULT 'active',
  started_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at           TIMESTAMPTZ NOT NULL,
  completed_at         TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Step 3: Indexes
CREATE INDEX IF NOT EXISTS idx_investment_packages_user_id
  ON public.investment_packages(user_id);

CREATE INDEX IF NOT EXISTS idx_investment_packages_status
  ON public.investment_packages(status);

CREATE INDEX IF NOT EXISTS idx_investment_packages_expires_at
  ON public.investment_packages(expires_at);

-- Step 4: Function — auto-complete expired packages and credit net profit to wallet
CREATE OR REPLACE FUNCTION public.settle_expired_investment_packages()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
DECLARE
  v_rec       RECORD;
  v_fee       NUMERIC;
  v_net       NUMERIC;
  v_count     INTEGER := 0;
BEGIN
  FOR v_rec IN
    SELECT *
    FROM public.investment_packages
    WHERE status = 'active'
      AND expires_at <= now()
  LOOP
    v_fee := ROUND(v_rec.gross_profit_usd * 0.20, 2);
    v_net := v_rec.gross_profit_usd - v_fee;

    -- Update package row
    UPDATE public.investment_packages
    SET
      status           = 'completed',
      platform_fee_usd = v_fee,
      net_profit_usd   = v_net,
      completed_at     = now()
    WHERE id = v_rec.id;

    -- Credit capital + net profit back to member's real wallet
    UPDATE public.wallets
    SET
      balance    = balance + v_rec.capital_usd + v_net,
      updated_at = now()
    WHERE user_id = v_rec.user_id
      AND is_demo = false;

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$func$;

-- Step 5: Enable RLS
ALTER TABLE public.investment_packages ENABLE ROW LEVEL SECURITY;

-- Step 6: RLS Policies
DROP POLICY IF EXISTS "users_manage_own_investment_packages" ON public.investment_packages;
CREATE POLICY "users_manage_own_investment_packages"
  ON public.investment_packages
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
