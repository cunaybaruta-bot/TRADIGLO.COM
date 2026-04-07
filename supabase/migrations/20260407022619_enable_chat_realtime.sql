-- Enable Supabase Realtime for chat tables
-- Without this, postgres_changes subscriptions silently receive no events.

ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
