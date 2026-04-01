-- Nuclear fix: drop ALL triggers on deposits table regardless of name
-- Then recreate the correct deposit notification trigger
-- admin_notifications columns: id, type, title, message, user_id, is_read, created_at
-- NO 'data' column exists in admin_notifications

-- Step 1: Drop ALL triggers on public.deposits using dynamic SQL
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT tgname
    FROM pg_trigger
    WHERE tgrelid = 'public.deposits'::regclass
      AND NOT tgisinternal
  LOOP
    EXECUTE 'DROP TRIGGER IF EXISTS ' || quote_ident(r.tgname) || ' ON public.deposits';
    RAISE NOTICE 'Dropped trigger: %', r.tgname;
  END LOOP;
END;
$$;

-- Step 2: Drop ALL known deposit notification functions (CASCADE removes any remaining triggers)
DROP FUNCTION IF EXISTS public.notify_admin_on_deposit() CASCADE;
DROP FUNCTION IF EXISTS public.handle_deposit_notification() CASCADE;
DROP FUNCTION IF EXISTS public.trg_notify_admin_deposit() CASCADE;
DROP FUNCTION IF EXISTS public.deposit_notification() CASCADE;
DROP FUNCTION IF EXISTS public.on_deposit_insert() CASCADE;
DROP FUNCTION IF EXISTS public.after_deposit_insert() CASCADE;
DROP FUNCTION IF EXISTS public.notify_deposit() CASCADE;
DROP FUNCTION IF EXISTS public.deposit_admin_notify() CASCADE;

-- Step 3: Recreate the correct deposit notification function
-- Uses ONLY valid columns: type, title, message, user_id, is_read
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
    'A user submitted a deposit of $' || ROUND(COALESCE(NEW.amount_usd, NEW.amount, 0)::NUMERIC, 2)::TEXT || ' USD (status: ' || COALESCE(NEW.status, 'pending') || ')',
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

-- Step 4: Create the trigger
DROP TRIGGER IF EXISTS notify_admin_on_deposit ON public.deposits;
CREATE TRIGGER notify_admin_on_deposit
  AFTER INSERT ON public.deposits
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admin_on_deposit();
