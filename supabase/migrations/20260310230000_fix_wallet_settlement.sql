-- ============================================================
-- FIX: Wallet settlement — return stake + profit on WIN
-- Migration: 20260310230000_fix_wallet_settlement.sql
-- ============================================================

-- Re-create settle_trade with explicit stake-return logic on WIN
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

    IF v_is_win THEN
        -- profit = amount * payout_percent / 100  (e.g. 10 * 95/100 = 9.5)
        v_profit := ROUND(v_trade.amount * v_trade.payout_percent / 100.0, 2);
        -- payout = stake returned + profit  (e.g. 10 + 9.5 = 19.5)
        v_payout := v_trade.amount + v_profit;
        v_result := 'win';
    ELSE
        v_profit := -v_trade.amount;
        v_payout := 0;
        v_result := 'loss';
    END IF;

    -- Update wallet balance
    -- On WIN  → add back stake + profit (payout)
    -- On LOSS → stake was already deducted at trade open; nothing to add
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
