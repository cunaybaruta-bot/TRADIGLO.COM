-- Admin RPC function to update wallet balance, bypassing RLS
-- Uses SECURITY DEFINER so it runs with the function owner's privileges

CREATE OR REPLACE FUNCTION public.admin_update_wallet_balance(
  p_wallet_id UUID,
  p_new_balance NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet RECORD;
  v_result JSONB;
BEGIN
  -- Verify wallet exists
  SELECT id, user_id, balance, is_demo
  INTO v_wallet
  FROM public.wallets
  WHERE id = p_wallet_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Wallet not found');
  END IF;

  -- Validate balance
  IF p_new_balance < 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Balance cannot be negative');
  END IF;

  -- Update the wallet balance
  UPDATE public.wallets
  SET balance = p_new_balance,
      updated_at = now()
  WHERE id = p_wallet_id;

  RETURN jsonb_build_object(
    'success', true,
    'wallet_id', p_wallet_id,
    'new_balance', p_new_balance
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Grant execute to authenticated users (admin panel uses authenticated session)
GRANT EXECUTE ON FUNCTION public.admin_update_wallet_balance(UUID, NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_wallet_balance(UUID, NUMERIC) TO anon;

-- Also create a reset demo wallet RPC
CREATE OR REPLACE FUNCTION public.admin_reset_demo_wallet(
  p_wallet_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet RECORD;
BEGIN
  SELECT id, is_demo INTO v_wallet FROM public.wallets WHERE id = p_wallet_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Wallet not found');
  END IF;

  UPDATE public.wallets
  SET balance = 100000,
      updated_at = now()
  WHERE id = p_wallet_id;

  RETURN jsonb_build_object('success', true, 'wallet_id', p_wallet_id, 'new_balance', 100000);

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_reset_demo_wallet(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_reset_demo_wallet(UUID) TO anon;
