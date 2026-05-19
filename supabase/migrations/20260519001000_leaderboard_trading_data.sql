-- ─── Leaderboard Rankings & User Trading Data ────────────────────────────────
-- Persists daily leaderboard rankings and user trading snapshots

-- 1. leaderboard_rankings: stores the top-10 leaderboard for each UTC day
CREATE TABLE IF NOT EXISTS public.leaderboard_rankings (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  leaderboard_date DATE     NOT NULL,
  rank          INTEGER     NOT NULL CHECK (rank BETWEEN 1 AND 10),
  display_name  TEXT        NOT NULL,
  country_flag  TEXT        NOT NULL DEFAULT '',
  profit        NUMERIC(18,2) NOT NULL DEFAULT 0,
  withdrawal    NUMERIC(18,2) NOT NULL DEFAULT 0,
  total         NUMERIC(18,2) NOT NULL DEFAULT 0,
  asset         TEXT        NOT NULL DEFAULT '',
  win_rate      INTEGER     NOT NULL DEFAULT 0,
  trades        INTEGER     NOT NULL DEFAULT 0,
  user_id       UUID        REFERENCES public.users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_leaderboard_date_rank
  ON public.leaderboard_rankings (leaderboard_date, rank);

CREATE INDEX IF NOT EXISTS idx_leaderboard_date
  ON public.leaderboard_rankings (leaderboard_date DESC);

CREATE INDEX IF NOT EXISTS idx_leaderboard_user_id
  ON public.leaderboard_rankings (user_id);

-- 2. user_trading_snapshots: daily snapshot of each user's trading stats
CREATE TABLE IF NOT EXISTS public.user_trading_snapshots (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  snapshot_date   DATE        NOT NULL,
  total_profit    NUMERIC(18,2) NOT NULL DEFAULT 0,
  total_withdrawal NUMERIC(18,2) NOT NULL DEFAULT 0,
  total_trades    INTEGER     NOT NULL DEFAULT 0,
  winning_trades  INTEGER     NOT NULL DEFAULT 0,
  win_rate        NUMERIC(5,2) NOT NULL DEFAULT 0,
  best_asset      TEXT        NOT NULL DEFAULT '',
  real_balance    NUMERIC(18,2) NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_trading_snapshot_user_date
  ON public.user_trading_snapshots (user_id, snapshot_date);

CREATE INDEX IF NOT EXISTS idx_user_trading_snapshot_date
  ON public.user_trading_snapshots (snapshot_date DESC);

-- 3. Function: upsert today's trading snapshot for a user
CREATE OR REPLACE FUNCTION public.upsert_user_trading_snapshot(
  p_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_profit     NUMERIC(18,2) := 0;
  v_total_withdrawal NUMERIC(18,2) := 0;
  v_total_trades     INTEGER := 0;
  v_winning_trades   INTEGER := 0;
  v_win_rate         NUMERIC(5,2) := 0;
  v_best_asset       TEXT := '';
  v_real_balance     NUMERIC(18,2) := 0;
  v_today            DATE := CURRENT_DATE;
BEGIN
  -- Aggregate closed trades for today
  SELECT
    COALESCE(SUM(CASE WHEN pnl > 0 THEN pnl ELSE 0 END), 0),
    COUNT(*),
    COUNT(CASE WHEN pnl > 0 THEN 1 END)
  INTO v_total_profit, v_total_trades, v_winning_trades
  FROM public.trades
  WHERE user_id = p_user_id
    AND status = 'closed'
    AND DATE(closed_at) = v_today;

  -- Win rate
  IF v_total_trades > 0 THEN
    v_win_rate := ROUND((v_winning_trades::NUMERIC / v_total_trades) * 100, 2);
  END IF;

  -- Best asset by profit
  SELECT COALESCE(asset_symbol, '')
  INTO v_best_asset
  FROM public.trades
  WHERE user_id = p_user_id
    AND status = 'closed'
    AND DATE(closed_at) = v_today
    AND pnl > 0
  GROUP BY asset_symbol
  ORDER BY SUM(pnl) DESC
  LIMIT 1;

  -- Total withdrawals approved today
  SELECT COALESCE(SUM(amount), 0)
  INTO v_total_withdrawal
  FROM public.withdrawals
  WHERE user_id = p_user_id
    AND status = 'approved'
    AND DATE(created_at) = v_today;

  -- Real balance
  SELECT COALESCE(real_balance, 0)
  INTO v_real_balance
  FROM public.wallets
  WHERE user_id = p_user_id
  LIMIT 1;

  INSERT INTO public.user_trading_snapshots (
    user_id, snapshot_date, total_profit, total_withdrawal,
    total_trades, winning_trades, win_rate, best_asset, real_balance, updated_at
  ) VALUES (
    p_user_id, v_today, v_total_profit, v_total_withdrawal,
    v_total_trades, v_winning_trades, v_win_rate, v_best_asset, v_real_balance, NOW()
  )
  ON CONFLICT (user_id, snapshot_date)
  DO UPDATE SET
    total_profit     = EXCLUDED.total_profit,
    total_withdrawal = EXCLUDED.total_withdrawal,
    total_trades     = EXCLUDED.total_trades,
    winning_trades   = EXCLUDED.winning_trades,
    win_rate         = EXCLUDED.win_rate,
    best_asset       = EXCLUDED.best_asset,
    real_balance     = EXCLUDED.real_balance,
    updated_at       = NOW();
END;
$$;

-- 4. Function: rebuild today's leaderboard from user_trading_snapshots
CREATE OR REPLACE FUNCTION public.rebuild_daily_leaderboard()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
BEGIN
  -- Remove existing entries for today (full rebuild)
  DELETE FROM public.leaderboard_rankings WHERE leaderboard_date = v_today;

  -- Insert top 10 based on total (profit + withdrawal)
  INSERT INTO public.leaderboard_rankings (
    leaderboard_date, rank, display_name, country_flag,
    profit, withdrawal, total, asset, win_rate, trades, user_id
  )
  SELECT
    v_today,
    ROW_NUMBER() OVER (ORDER BY (s.total_profit + s.total_withdrawal) DESC),
    COALESCE(u.full_name, u.email, 'Trader'),
    '',
    s.total_profit,
    s.total_withdrawal,
    s.total_profit + s.total_withdrawal,
    s.best_asset,
    s.win_rate::INTEGER,
    s.total_trades,
    s.user_id
  FROM public.user_trading_snapshots s
  JOIN public.users u ON u.id = s.user_id
  WHERE s.snapshot_date = v_today
    AND (s.total_profit + s.total_withdrawal) > 0
  ORDER BY (s.total_profit + s.total_withdrawal) DESC
  LIMIT 10;
END;
$$;

-- 5. Enable RLS
ALTER TABLE public.leaderboard_rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_trading_snapshots ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies

-- leaderboard_rankings: public read (everyone can see the leaderboard)
DROP POLICY IF EXISTS "public_read_leaderboard_rankings" ON public.leaderboard_rankings;
CREATE POLICY "public_read_leaderboard_rankings"
  ON public.leaderboard_rankings
  FOR SELECT
  TO public
  USING (true);

-- leaderboard_rankings: only service role / functions can write
DROP POLICY IF EXISTS "service_write_leaderboard_rankings" ON public.leaderboard_rankings;
CREATE POLICY "service_write_leaderboard_rankings"
  ON public.leaderboard_rankings
  FOR ALL
  TO authenticated
  USING (false)
  WITH CHECK (false);

-- user_trading_snapshots: users can read their own
DROP POLICY IF EXISTS "users_read_own_trading_snapshots" ON public.user_trading_snapshots;
CREATE POLICY "users_read_own_trading_snapshots"
  ON public.user_trading_snapshots
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- user_trading_snapshots: only service role / functions can write
DROP POLICY IF EXISTS "service_write_trading_snapshots" ON public.user_trading_snapshots;
CREATE POLICY "service_write_trading_snapshots"
  ON public.user_trading_snapshots
  FOR ALL
  TO authenticated
  USING (false)
  WITH CHECK (false);
