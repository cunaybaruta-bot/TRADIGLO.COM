-- Member Chat Notifications Migration
-- Adds member_notifications table for member-side chat notifications
-- Fixes RLS so admin (authenticated) can create/manage chat sessions for any user

-- =====================
-- MEMBER NOTIFICATIONS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS public.member_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'chat' CHECK (type IN ('chat', 'system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  session_id UUID REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_member_notifications_user_id ON public.member_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_member_notifications_is_read ON public.member_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_member_notifications_session_id ON public.member_notifications(session_id);

-- =====================
-- ENABLE RLS
-- =====================
ALTER TABLE public.member_notifications ENABLE ROW LEVEL SECURITY;

-- Members can read/update their own notifications
DROP POLICY IF EXISTS "members_read_own_notifications" ON public.member_notifications;
CREATE POLICY "members_read_own_notifications"
ON public.member_notifications FOR SELECT TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "members_update_own_notifications" ON public.member_notifications;
CREATE POLICY "members_update_own_notifications"
ON public.member_notifications FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Authenticated users (admin) can insert notifications for any user
DROP POLICY IF EXISTS "authenticated_insert_member_notifications" ON public.member_notifications;
CREATE POLICY "authenticated_insert_member_notifications"
ON public.member_notifications FOR INSERT TO authenticated
WITH CHECK (true);

-- =====================
-- FIX CHAT SESSION RLS — allow admin to create sessions for any user
-- =====================
DROP POLICY IF EXISTS "admin_authenticated_full_access_chat_sessions" ON public.chat_sessions;
CREATE POLICY "admin_authenticated_full_access_chat_sessions"
ON public.chat_sessions FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- =====================
-- FIX CHAT MESSAGES RLS — allow admin to insert messages in any session
-- =====================
DROP POLICY IF EXISTS "admin_authenticated_full_access_chat_messages" ON public.chat_messages;
CREATE POLICY "admin_authenticated_full_access_chat_messages"
ON public.chat_messages FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- =====================
-- ENABLE REALTIME
-- =====================
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.member_notifications;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'member_notifications already in publication: %', SQLERRM;
  END;
END $$;
