-- Fix Support System RLS Policies
-- Problem: Admin policies used service_role which only works server-side.
-- Admin users login as authenticated role, so they need authenticated-based policies.
-- Solution: Add is_admin() function + authenticated-based admin policies.

-- =====================
-- ADMIN CHECK FUNCTION
-- =====================
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
SELECT EXISTS (
  SELECT 1 FROM public.admin_users
  WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
)
$$;

-- =====================
-- FIX: support_tickets
-- =====================
DROP POLICY IF EXISTS "admin_full_access_support_tickets" ON public.support_tickets;
CREATE POLICY "admin_full_access_support_tickets"
ON public.support_tickets FOR ALL TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- =====================
-- FIX: ticket_replies
-- =====================
DROP POLICY IF EXISTS "admin_full_access_ticket_replies" ON public.ticket_replies;
CREATE POLICY "admin_full_access_ticket_replies"
ON public.ticket_replies FOR ALL TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- =====================
-- FIX: chat_sessions
-- =====================
DROP POLICY IF EXISTS "admin_full_access_chat_sessions" ON public.chat_sessions;
CREATE POLICY "admin_full_access_chat_sessions"
ON public.chat_sessions FOR ALL TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- =====================
-- FIX: chat_messages
-- =====================
DROP POLICY IF EXISTS "admin_full_access_chat_messages" ON public.chat_messages;
CREATE POLICY "admin_full_access_chat_messages"
ON public.chat_messages FOR ALL TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- =====================
-- FIX: faqs
-- Admin needs to see ALL faqs (active + inactive), not just active ones
-- =====================
DROP POLICY IF EXISTS "admin_full_access_faqs" ON public.faqs;
CREATE POLICY "admin_full_access_faqs"
ON public.faqs FOR ALL TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- Keep public read for active FAQs (for member-facing pages)
DROP POLICY IF EXISTS "public_read_faqs" ON public.faqs;
CREATE POLICY "public_read_faqs"
ON public.faqs FOR SELECT TO public
USING (is_active = true);

-- =====================
-- FIX: chatbot_settings
-- =====================
DROP POLICY IF EXISTS "admin_full_access_chatbot_settings" ON public.chatbot_settings;
CREATE POLICY "admin_full_access_chatbot_settings"
ON public.chatbot_settings FOR ALL TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- Keep public read for chatbot settings (needed by member-facing chatbot widget)
DROP POLICY IF EXISTS "public_read_chatbot_settings" ON public.chatbot_settings;
CREATE POLICY "public_read_chatbot_settings"
ON public.chatbot_settings FOR SELECT TO public
USING (true);
