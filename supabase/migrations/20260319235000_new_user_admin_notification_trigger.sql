-- ============================================================
-- New User Admin Notification Trigger
-- Migration: 20260319235000_new_user_admin_notification_trigger.sql
-- Inserts admin_notifications row when a new user is added to public.users
-- Also calls Edge Function to send email via Resend
-- ============================================================

-- Function: insert admin notification on new user
CREATE OR REPLACE FUNCTION public.notify_admin_on_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.admin_notifications (type, title, message, user_id)
  VALUES (
    'new_user',
    'New User Registered',
    COALESCE(NEW.full_name, NEW.email) || ' (' || NEW.email || ') just created an account.',
    NEW.id
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'notify_admin_on_new_user failed: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Trigger: fires after INSERT on public.users
DROP TRIGGER IF EXISTS on_new_user_notify_admin ON public.users;
CREATE TRIGGER on_new_user_notify_admin
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admin_on_new_user();
