-- ============================================================
-- Fix: Admin withdrawal action via security definer function
-- Ensures admin can approve/reject withdrawals and balance
-- is deducted correctly regardless of RLS context
-- ============================================================

-- 1. Create a security definer function for admin withdrawal processing
-- This allows the API route to call it even if RLS blocks direct updates
CREATE OR REPLACE FUNCTION public.admin_process_withdrawal(
  p_withdrawal_id UUID,
  p_action TEXT,
  p_admin_note TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_withdrawal RECORD;
  v_wallet RECORD;
  v_new_balance NUMERIC;
BEGIN
  -- Verify caller is admin
  IF NOT public.is_admin_user() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Access denied');
  END IF;

  -- Validate action
  IF p_action NOT IN ('approved', 'rejected') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid action');
  END IF;

  -- Fetch withdrawal
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

-- Grant execute to authenticated users (RLS inside function handles admin check)
GRANT EXECUTE ON FUNCTION public.admin_process_withdrawal(UUID, TEXT, TEXT) TO authenticated;

-- 2. Ensure withdrawals table has updated_at column
ALTER TABLE public.withdrawals
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 3. Ensure member can read their own withdrawals (for dashboard)
DROP POLICY IF EXISTS "users_manage_own_withdrawals" ON public.withdrawals;
CREATE POLICY "users_manage_own_withdrawals"
ON public.withdrawals
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid() AND status = 'pending');

-- 4. Ensure admin can manage all withdrawals
DROP POLICY IF EXISTS "admin_manage_all_withdrawals" ON public.withdrawals;
CREATE POLICY "admin_manage_all_withdrawals"
ON public.withdrawals
FOR ALL
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());
