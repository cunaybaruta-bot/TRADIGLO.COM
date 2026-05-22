-- ============================================================
-- Fix: Double deduction bug on withdrawal approval
-- Root cause: admin_process_withdrawal RPC was explicitly deducting
-- wallet balance AND the DB trigger handle_withdrawal_approval()
-- was also deducting balance when status changed to 'approved'.
-- Both ran simultaneously → balance deducted twice.
--
-- Fix: Remove explicit balance deduction from the RPC.
-- The DB trigger (on_withdrawal_status_change) already handles
-- balance deduction correctly for ALL users when status → 'approved'.
-- ============================================================

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

  -- Update withdrawal status only.
  -- The DB trigger (on_withdrawal_status_change → handle_withdrawal_approval)
  -- will automatically deduct the wallet balance when status changes to 'approved'.
  -- DO NOT deduct balance here to avoid double deduction.
  UPDATE public.withdrawals
  SET
    status = p_action,
    admin_note = p_admin_note,
    processed_at = now(),
    updated_at = now()
  WHERE id = p_withdrawal_id;

  RETURN jsonb_build_object(
    'success', true,
    'action', p_action,
    'amount', v_withdrawal.amount,
    'user_id', v_withdrawal.user_id
  );
END;
$$;

-- Ensure grants remain in place
GRANT EXECUTE ON FUNCTION public.admin_process_withdrawal(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_process_withdrawal(UUID, TEXT, TEXT) TO service_role;
