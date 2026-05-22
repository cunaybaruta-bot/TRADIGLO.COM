-- ============================================================
-- WITHDRAWAL FULL FLOW MIGRATION
-- Adds: admin_note, processed_at columns to withdrawals
-- Adds: trigger to notify admin on new withdrawal
-- Adds: trigger to deduct balance on approval
-- ============================================================

-- 1. Add missing columns to withdrawals table
ALTER TABLE public.withdrawals
  ADD COLUMN IF NOT EXISTS admin_note TEXT,
  ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ;

-- 2. Function: notify admin when a new withdrawal is submitted
CREATE OR REPLACE FUNCTION public.notify_admin_on_withdrawal()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_email TEXT;
  v_user_name  TEXT;
BEGIN
  -- Get user info
  SELECT email, full_name INTO v_user_email, v_user_name
  FROM public.users
  WHERE id = NEW.user_id;

  -- Insert admin notification
  INSERT INTO public.admin_notifications (type, title, message, user_id, is_read)
  VALUES (
    'withdrawal',
    'New Withdrawal Request',
    'User ' || COALESCE(v_user_email, 'unknown') || ' requested withdrawal of $' || NEW.amount::TEXT || ' via ' || COALESCE(NEW.payment_method, 'unknown method'),
    NEW.user_id,
    false
  );

  RETURN NEW;
END;
$$;

-- 3. Trigger: fire on new withdrawal insert
DROP TRIGGER IF EXISTS on_new_withdrawal_notify_admin ON public.withdrawals;
CREATE TRIGGER on_new_withdrawal_notify_admin
  AFTER INSERT ON public.withdrawals
  FOR EACH ROW
  WHEN (NEW.status = 'pending')
  EXECUTE FUNCTION public.notify_admin_on_withdrawal();

-- 4. Function: deduct wallet balance when withdrawal is approved
CREATE OR REPLACE FUNCTION public.handle_withdrawal_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only act when status changes TO 'approved'
  IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM 'approved') THEN
    -- Set processed_at
    NEW.processed_at := now();

    -- Deduct from real wallet balance
    UPDATE public.wallets
    SET balance = balance - NEW.amount,
        updated_at = now()
    WHERE user_id = NEW.user_id
      AND is_demo = false;
  END IF;

  -- If rejected, set processed_at
  IF NEW.status = 'rejected' AND (OLD.status IS DISTINCT FROM 'rejected') THEN
    NEW.processed_at := now();
  END IF;

  RETURN NEW;
END;
$$;

-- 5. Trigger: fire on withdrawal update
DROP TRIGGER IF EXISTS on_withdrawal_status_change ON public.withdrawals;
CREATE TRIGGER on_withdrawal_status_change
  BEFORE UPDATE ON public.withdrawals
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_withdrawal_approval();

-- 6. Index for faster admin queries
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON public.withdrawals(status);
CREATE INDEX IF NOT EXISTS idx_withdrawals_created_at ON public.withdrawals(created_at DESC);
