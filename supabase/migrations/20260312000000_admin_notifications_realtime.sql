-- Enable Realtime for admin_notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_notifications;

-- RLS policy: allow authenticated admins to read all notifications
DROP POLICY IF EXISTS "admin_notifications_select" ON public.admin_notifications;
CREATE POLICY "admin_notifications_select"
  ON public.admin_notifications
  FOR SELECT
  TO authenticated
  USING (true);

-- RLS policy: allow service role / triggers to insert notifications
DROP POLICY IF EXISTS "admin_notifications_insert" ON public.admin_notifications;
CREATE POLICY "admin_notifications_insert"
  ON public.admin_notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS policy: allow authenticated users to update is_read
DROP POLICY IF EXISTS "admin_notifications_update" ON public.admin_notifications;
CREATE POLICY "admin_notifications_update"
  ON public.admin_notifications
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
