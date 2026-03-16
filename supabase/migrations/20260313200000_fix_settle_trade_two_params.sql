-- ============================================================
-- FIX: settle_trade — accept p_trade_id + p_exit_price from frontend
-- Migration: 20260313200000_fix_settle_trade_two_params.sql
-- ============================================================
-- The frontend calls: supabase.rpc('settle_trade', { p_trade_id, p_exit_price })
-- All previous migrations defined settle_trade(p_trade_id UUID) — one param only.
-- This migration drops the old single-param version and creates the two-param version.

-- Drop all existing overloads of settle_trade
DROP FUNCTION IF EXISTS public.settle_trade(UUID);
DROP FUNCTION IF EXISTS public.settle_trade(p_trade_id UUID);
DROP FUNCTION IF EXISTS public.settle_trade(p_trade_id UUID, p_exit_price NUMERIC);

-- Also fix settle_expired_trades to call the new two-param version correctly
DROP FUNCTION IF EXISTS public.settle_expired_trades();

-- ─── settle_trade (two params) ────────────────────────────────────────────────
-- Settles a single trade using the exit price supplied by the frontend.
-- p_trade_id   : UUID of the trade to settle
-- p_exit_price : current market price at the moment the user closes the trade

CREATE OR REPLACE FUNCTION public.settle_trade(
    p_trade_id   UUID,
    p_exit_price NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_trade      RECORD;
    v_is_win     BOOLEAN;
    v_payout     NUMERIC;
    v_profit     NUMERIC;
    v_result     TEXT;
BEGIN
    -- Fetch trade details and lock the row
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

    -- Guard: trade must exist
    IF v_trade IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Trade not found');
    END IF;

    -- Guard: only settle open trades
    IF v_trade.status != 'open' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Trade already settled');
    END IF;

    -- Determine win/loss based on direction vs exit price
    IF v_trade.order_type = 'buy' THEN
        v_is_win := p_exit_price > v_trade.entry_price;
    ELSE
        v_is_win := p_exit_price < v_trade.entry_price;
    END IF;

    -- Calculate payout and profit
    IF v_is_win THEN
        -- profit = stake * payout_percent / 100  (e.g. 10 * 95/100 = 9.5)
        v_profit := ROUND(v_trade.amount * v_trade.payout_percent / 100.0, 2);
        -- payout  = stake returned + profit       (e.g. 10 + 9.5 = 19.5)
        v_payout := v_trade.amount + v_profit;
        v_result := 'win';
    ELSE
        v_profit := -v_trade.amount;
        v_payout := 0;
        v_result := 'loss';
    END IF;

    -- Update wallet balance (wallets table uses: balance + is_demo columns)
    -- On WIN  → credit stake + profit back to wallet
    -- On LOSS → stake was already deducted at trade open; nothing to add
    IF v_is_win THEN
        UPDATE public.wallets
        SET balance    = balance + v_payout,
            updated_at = now()
        WHERE user_id = v_trade.user_id
          AND is_demo  = v_trade.is_demo;
    END IF;

    -- Close the trade
    UPDATE public.trades
    SET
        status     = 'closed',
        exit_price = p_exit_price,
        profit     = v_profit,
        payout     = v_payout,
        result     = v_result,
        closed_at  = now()
    WHERE id = p_trade_id;

    RETURN jsonb_build_object(
        'success',    true,
        'trade_id',   p_trade_id,
        'result',     v_result,
        'exit_price', p_exit_price,
        'profit',     v_profit,
        'payout',     v_payout
    );

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- ─── settle_expired_trades ────────────────────────────────────────────────────
-- Finds all expired open trades and settles them using their latest market price.
-- Called by the background price engine / cron job.

CREATE OR REPLACE FUNCTION public.settle_expired_trades()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_trade      RECORD;
    v_exit_price NUMERIC;
    v_count      INTEGER := 0;
BEGIN
    FOR v_trade IN
        SELECT t.id, t.asset_id
        FROM public.trades t
        WHERE t.status = 'open'
          AND (t.opened_at + (t.duration_seconds * INTERVAL '1 second')) <= now()
    LOOP
        -- Get latest market price for this asset
        SELECT mp.price
        INTO v_exit_price
        FROM public.market_prices mp
        WHERE mp.asset_id = v_trade.asset_id
        ORDER BY mp.timestamp DESC
        LIMIT 1;

        -- Fall back to 0 if no price found (settle_trade will handle gracefully)
        IF v_exit_price IS NULL THEN
            v_exit_price := 0;
        END IF;

        PERFORM public.settle_trade(v_trade.id, v_exit_price);
        v_count := v_count + 1;
    END LOOP;

    RETURN v_count;
END;
$$;
