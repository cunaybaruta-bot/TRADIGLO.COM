-- Fix deposit notification trigger
-- The existing trigger on deposits table tries to insert a 'data' column
-- into admin_notifications which does not exist.
-- admin_notifications columns: id, type, title, message, user_id, is_read, created_at

-- Drop any existing deposit notification trigger and function
DROP TRIGGER IF EXISTS notify_admin_on_deposit ON public.deposits;
DROP TRIGGER IF EXISTS on_deposit_insert ON public.deposits;
DROP TRIGGER IF EXISTS deposit_admin_notification ON public.deposits;
DROP TRIGGER IF EXISTS after_deposit_insert ON public.deposits;
DROP TRIGGER IF EXISTS trg_notify_admin_deposit ON public.deposits;

DROP FUNCTION IF EXISTS public.notify_admin_on_deposit() CASCADE;
DROP FUNCTION IF EXISTS public.handle_deposit_notification() CASCADE;
DROP FUNCTION IF EXISTS public.trg_notify_admin_deposit() CASCADE;

-- Create correct deposit notification function (no 'data' column)
CREATE OR REPLACE FUNCTION public.notify_admin_on_deposit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
BEGIN
  INSERT INTO public.admin_notifications (type, title, message, user_id, is_read)
  VALUES (
    'deposit',
    'New Deposit Submitted',
    'A user submitted a deposit of $' || ROUND(COALESCE(NEW.amount_usd, NEW.amount, 0)::NUMERIC, 2)::TEXT || ' USD (status: ' || NEW.status || ')',
    NEW.user_id,
    false
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'notify_admin_on_deposit failed: %', SQLERRM;
    RETURN NEW;
END;
$func$;

-- Create the trigger
DROP TRIGGER IF EXISTS notify_admin_on_deposit ON public.deposits;
CREATE TRIGGER notify_admin_on_deposit
  AFTER INSERT ON public.deposits
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admin_on_deposit();
