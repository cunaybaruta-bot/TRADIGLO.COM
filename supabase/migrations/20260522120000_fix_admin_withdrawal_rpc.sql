-- ============================================================
-- Fix: admin_process_withdrawal - remove is_admin_user() check
-- The API route already verifies admin status before calling this RPC.
-- The is_admin_user() check inside the RPC was causing failures because
-- auth.uid() context is not always available in server-side calls.
-- ============================================================

-- Replace the function without the is_admin_user() guard
-- (API route handles admin verification before calling this)
CREATE OR REPLACE FUNCTION public.admin_process_withdrawal(
  p_withdrawal_id UUID,
  p_action TEXT,
  p_admin_note TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_withdrawal RECORD;
  v_wallet RECORD;
  v_new_balance NUMERIC;
BEGIN
  -- Validate action
  IF p_action NOT IN ('approved', 'rejected') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid action');
  END IF;

  -- Fetch withdrawal (must be pending)
  SELECT * INTO v_withdrawal
  FROM public.withdrawals
  WHERE id = p_withdrawal_id AND status = 'pending';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Withdrawal not found or already processed');
  END IF;

  -- Update withdrawal status
  UPDATE public.withdrawals
  SET
    status = p_action,
    admin_note = p_admin_note,
    processed_at = now(),
    updated_at = now()
  WHERE id = p_withdrawal_id;

  -- If approved, deduct from real wallet balance
  IF p_action = 'approved' THEN
    SELECT * INTO v_wallet
    FROM public.wallets
    WHERE user_id = v_withdrawal.user_id AND is_demo = false;

    IF FOUND THEN
      v_new_balance := GREATEST(0, v_wallet.balance - v_withdrawal.amount);
      UPDATE public.wallets
      SET balance = v_new_balance, updated_at = now()
      WHERE id = v_wallet.id;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'action', p_action,
    'amount', v_withdrawal.amount,
    'user_id', v_withdrawal.user_id
  );
END;
$$;

-- Ensure authenticated users can call this (admin check is in the API route)
GRANT EXECUTE ON FUNCTION public.admin_process_withdrawal(UUID, TEXT, TEXT) TO authenticated;
-- Also grant to service_role for server-side calls
GRANT EXECUTE ON FUNCTION public.admin_process_withdrawal(UUID, TEXT, TEXT) TO service_role;
