-- ============================================================
-- TRADE SETTLEMENT & HISTORY RPC FUNCTIONS
-- Migration: 20260310220000_settle_trades.sql
-- ============================================================

-- Drop existing functions first to allow return type changes
DROP FUNCTION IF EXISTS public.get_open_trades();
DROP FUNCTION IF EXISTS public.get_trade_history();
DROP FUNCTION IF EXISTS public.settle_trade(UUID);
DROP FUNCTION IF EXISTS public.settle_expired_trades();

-- ─── get_open_trades ─────────────────────────────────────────────────────────
-- Returns all open trades for the currently authenticated user

CREATE OR REPLACE FUNCTION public.get_open_trades()
RETURNS TABLE (
    id UUID,
    user_id UUID,
    asset_id UUID,
    asset_symbol TEXT,
    order_type TEXT,
    amount NUMERIC,
    duration_seconds INTEGER,
    entry_price NUMERIC,
    status TEXT,
    is_demo BOOLEAN,
    opened_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        t.id,
        t.user_id,
        t.asset_id,
        a.symbol AS asset_symbol,
        t.order_type,
        t.amount,
        t.duration_seconds,
        t.entry_price,
        t.status,
        t.is_demo,
        t.opened_at,
        t.created_at
    FROM public.trades t
    LEFT JOIN public.assets a ON a.id = t.asset_id
    WHERE t.user_id = auth.uid()
      AND t.status = 'open'
    ORDER BY t.opened_at DESC;
END;
$$;

-- ─── get_trade_history ────────────────────────────────────────────────────────
-- Returns last 100 closed trades for the currently authenticated user

CREATE OR REPLACE FUNCTION public.get_trade_history()
RETURNS TABLE (
    id UUID,
    user_id UUID,
    asset_id UUID,
    asset_symbol TEXT,
    order_type TEXT,
    amount NUMERIC,
    duration_seconds INTEGER,
    entry_price NUMERIC,
    exit_price NUMERIC,
    profit NUMERIC,
    payout NUMERIC,
    result TEXT,
    status TEXT,
    is_demo BOOLEAN,
    opened_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        t.id,
        t.user_id,
        t.asset_id,
        a.symbol AS asset_symbol,
        t.order_type,
        t.amount,
        t.duration_seconds,
        t.entry_price,
        t.exit_price,
        t.profit,
        t.payout,
        t.result,
        t.status,
        t.is_demo,
        t.opened_at,
        t.closed_at,
        t.created_at
    FROM public.trades t
    LEFT JOIN public.assets a ON a.id = t.asset_id
    WHERE t.user_id = auth.uid()
      AND t.status = 'closed'
    ORDER BY t.closed_at DESC NULLS LAST
    LIMIT 100;
END;
$$;

-- ─── settle_trade ─────────────────────────────────────────────────────────────
-- Settles a single trade: determines win/loss, updates wallet, closes trade

CREATE OR REPLACE FUNCTION public.settle_trade(p_trade_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_trade         RECORD;
    v_exit_price    NUMERIC;
    v_is_win        BOOLEAN;
    v_payout        NUMERIC;
    v_profit        NUMERIC;
    v_result        TEXT;
    v_payout_pct    NUMERIC;
BEGIN
    -- Get trade details
    SELECT
        t.id,
        t.user_id,
        t.asset_id,
        t.order_type,
        t.amount,
        t.entry_price,
        t.is_demo,
        COALESCE(t.payout_percent, 95) AS payout_percent,
        t.status
    INTO v_trade
    FROM public.trades t
    WHERE t.id = p_trade_id
    FOR UPDATE;

    -- Guard: only settle open trades
    IF v_trade IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Trade not found');
    END IF;

    IF v_trade.status != 'open' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Trade already settled');
    END IF;

    -- Get latest exit price from market_prices
    SELECT mp.price
    INTO v_exit_price
    FROM public.market_prices mp
    WHERE mp.asset_id = v_trade.asset_id
    ORDER BY mp.timestamp DESC
    LIMIT 1;

    -- If no price found, use entry price (no profit/loss)
    IF v_exit_price IS NULL THEN
        v_exit_price := v_trade.entry_price;
    END IF;

    -- Determine win/loss
    IF v_trade.order_type = 'buy' THEN
        v_is_win := v_exit_price > v_trade.entry_price;
    ELSE
        v_is_win := v_exit_price < v_trade.entry_price;
    END IF;

    -- Calculate payout and profit
    v_payout_pct := v_trade.payout_percent;

    IF v_is_win THEN
        v_payout  := v_trade.amount * 1.95;
        v_profit  := v_payout - v_trade.amount;
        v_result  := 'win';
    ELSE
        v_payout  := 0;
        v_profit  := -v_trade.amount;
        v_result  := 'loss';
    END IF;

    -- Update wallet balance on win
    IF v_is_win THEN
        IF v_trade.is_demo THEN
            UPDATE public.wallets
            SET demo_balance = demo_balance + v_payout,
                updated_at   = now()
            WHERE user_id = v_trade.user_id;
        ELSE
            UPDATE public.wallets
            SET real_balance = real_balance + v_payout,
                updated_at   = now()
            WHERE user_id = v_trade.user_id;
        END IF;
    END IF;

    -- Close the trade
    UPDATE public.trades
    SET
        status     = 'closed',
        exit_price = v_exit_price,
        profit     = v_profit,
        payout     = v_payout,
        result     = v_result,
        closed_at  = now()
    WHERE id = p_trade_id;

    RETURN jsonb_build_object(
        'success',      true,
        'trade_id',     p_trade_id,
        'result',       v_result,
        'exit_price',   v_exit_price,
        'profit',       v_profit,
        'payout',       v_payout
    );

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- ─── settle_expired_trades ────────────────────────────────────────────────────
-- Finds all expired open trades and settles them; returns count settled

CREATE OR REPLACE FUNCTION public.settle_expired_trades()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_trade_id  UUID;
    v_count     INTEGER := 0;
BEGIN
    FOR v_trade_id IN
        SELECT id
        FROM public.trades
        WHERE status = 'open'
          AND (opened_at + (duration_seconds * INTERVAL '1 second')) <= now()
    LOOP
        PERFORM public.settle_trade(v_trade_id);
        v_count := v_count + 1;
    END LOOP;

    RETURN v_count;
END;
$$;

-- ─── Grant execute permissions ────────────────────────────────────────────────
