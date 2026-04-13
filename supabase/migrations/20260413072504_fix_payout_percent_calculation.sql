-- ============================================================
-- FIX: settle_trade & open_trade — always use 95 as payout_percent
-- Migration: 20260413072504_fix_payout_percent_calculation.sql
-- ============================================================
-- Root cause: payout_percent stored as 0.95 (decimal) instead of 95 (percent)
-- causing profit = amount * 0.95 / 100 = $0.095 ≈ $0.10 instead of $9.50
-- Fix: hardcode payout_percent = 95 in both open_trade and settle_trade

-- Drop existing overloads
DROP FUNCTION IF EXISTS public.settle_trade(UUID, NUMERIC);
DROP FUNCTION IF EXISTS public.open_trade(UUID, NUMERIC, TEXT, INTEGER, NUMERIC, BOOLEAN);

-- ─── settle_trade (fixed) ─────────────────────────────────────────────────────
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
    v_payout_pct NUMERIC := 95;
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

    -- Calculate payout and profit using fixed 95% payout
    -- WIN:  profit = amount * 95 / 100  (e.g. $10 * 95/100 = $9.50)
    --       payout = amount + profit     (e.g. $10 + $9.50 = $19.50 returned to wallet)
    -- LOSS: profit = -amount             (e.g. -$10)
    --       payout = 0                   (stake already deducted at open)
    IF v_is_win THEN
        v_profit := ROUND(v_trade.amount * v_payout_pct / 100.0, 2);
        v_payout := v_trade.amount + v_profit;
        v_result := 'win';
    ELSE
        v_profit := -v_trade.amount;
        v_payout := 0;
        v_result := 'loss';
    END IF;

    -- Update wallet balance
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
        status         = 'closed',
        exit_price     = p_exit_price,
        profit         = v_profit,
        payout         = v_payout,
        payout_percent = v_payout_pct,
        result         = v_result,
        closed_at      = now()
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

-- ─── open_trade (fixed) ───────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.open_trade(
    p_asset_id         UUID,
    p_amount           NUMERIC,
    p_order_type       TEXT,
    p_duration_seconds INTEGER,
    p_entry_price      NUMERIC,
    p_is_demo          BOOLEAN DEFAULT true
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id    UUID;
    v_wallet_id  UUID;
    v_balance    NUMERIC;
    v_trade_id   UUID;
    v_payout_pct NUMERIC := 95;
BEGIN
    -- Get authenticated user
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
    END IF;

    -- Look up wallet
    SELECT id, balance
    INTO v_wallet_id, v_balance
    FROM public.wallets
    WHERE user_id = v_user_id
      AND is_demo  = p_is_demo
    LIMIT 1;

    IF v_wallet_id IS NULL THEN
        -- Auto-create wallet
        INSERT INTO public.wallets (user_id, balance, is_demo)
        VALUES (
            v_user_id,
            CASE WHEN p_is_demo THEN 10000 ELSE 0 END,
            p_is_demo
        )
        RETURNING id, balance INTO v_wallet_id, v_balance;
    END IF;

    -- Check sufficient balance
    IF v_balance < p_amount THEN
        RETURN jsonb_build_object('success', false, 'error', 'Insufficient balance');
    END IF;

    -- Deduct stake from wallet
    UPDATE public.wallets
    SET balance    = balance - p_amount,
        updated_at = now()
    WHERE id = v_wallet_id;

    -- Insert trade record with fixed payout_percent = 95
    INSERT INTO public.trades (
        user_id,
        asset_id,
        order_type,
        amount,
        duration_seconds,
        entry_price,
        payout_percent,
        status,
        is_demo,
        opened_at
    ) VALUES (
        v_user_id,
        p_asset_id,
        p_order_type,
        p_amount,
        p_duration_seconds,
        p_entry_price,
        v_payout_pct,
        'open',
        p_is_demo,
        now()
    )
    RETURNING id INTO v_trade_id;

    RETURN jsonb_build_object(
        'success',  true,
        'id',       v_trade_id,
        'balance',  v_balance - p_amount
    );

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- ─── settle_expired_trades (updated to use fixed settle_trade) ────────────────
DROP FUNCTION IF EXISTS public.settle_expired_trades();

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

        IF v_exit_price IS NULL THEN
            v_exit_price := 0;
        END IF;

        PERFORM public.settle_trade(v_trade.id, v_exit_price);
        v_count := v_count + 1;
    END LOOP;

    RETURN v_count;
END;
$$;

-- Also fix any existing trades that have wrong payout_percent (0.95 stored as decimal)
-- Update trades where payout_percent < 1 (clearly stored as decimal fraction, not percent)
UPDATE public.trades
SET payout_percent = 95
WHERE payout_percent IS NOT NULL
  AND payout_percent < 1;
