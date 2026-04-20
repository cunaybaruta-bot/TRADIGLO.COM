-- ============================================================
-- FIX: open_trade RPC — use correct wallet schema (balance + is_demo)
-- Also fix duration_seconds constraint to allow all dashboard values
-- Migration: 20260313190000_fix_open_trade_function.sql
-- ============================================================

-- Fix duration_seconds constraint to allow all values used by the dashboard
ALTER TABLE public.trades DROP CONSTRAINT IF EXISTS trades_duration_seconds_check;
ALTER TABLE public.trades ADD CONSTRAINT trades_duration_seconds_check
  CHECK (duration_seconds > 0);

-- ─── open_trade ───────────────────────────────────────────────────────────────
-- Drop existing function first to allow changing return type
DROP FUNCTION IF EXISTS public.open_trade(uuid, numeric, text, integer, numeric, boolean);

-- Opens a new trade: deducts stake from wallet, inserts trade row
-- Wallet schema: balance (numeric) + is_demo (boolean)

CREATE OR REPLACE FUNCTION public.open_trade(
    p_asset_id        UUID,
    p_amount          NUMERIC,
    p_order_type      TEXT,
    p_duration_seconds INTEGER,
    p_entry_price     NUMERIC,
    p_is_demo         BOOLEAN DEFAULT true
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id       UUID;
    v_wallet_id     UUID;
    v_balance       NUMERIC;
    v_payout_pct    NUMERIC;
    v_trade_id      UUID;
BEGIN
    -- Get authenticated user
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
    END IF;

    -- Look up wallet using correct schema: balance + is_demo
    SELECT id, balance
    INTO v_wallet_id, v_balance
    FROM public.wallets
    WHERE user_id = v_user_id
      AND is_demo  = p_is_demo
    LIMIT 1;

    IF v_wallet_id IS NULL THEN
        -- Wallet doesn't exist yet — auto-create it
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

    -- Get payout percent from asset (default 95)
    SELECT COALESCE(payout_percent, 95)
    INTO v_payout_pct
    FROM public.assets
    WHERE id = p_asset_id;

    -- Deduct stake from wallet
    UPDATE public.wallets
    SET balance    = balance - p_amount,
        updated_at = now()
    WHERE id = v_wallet_id;

    -- Insert trade record
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

-- Ensure every existing user has both demo and real wallets
-- (safe to run multiple times — ON CONFLICT DO NOTHING)
INSERT INTO public.wallets (user_id, balance, is_demo)
SELECT u.id, 10000, true
FROM public.users u
WHERE NOT EXISTS (
    SELECT 1 FROM public.wallets w
    WHERE w.user_id = u.id AND w.is_demo = true
);

INSERT INTO public.wallets (user_id, balance, is_demo)
SELECT u.id, 0, false
FROM public.users u
WHERE NOT EXISTS (
    SELECT 1 FROM public.wallets w
    WHERE w.user_id = u.id AND w.is_demo = false
);
