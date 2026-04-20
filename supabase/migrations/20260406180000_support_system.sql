-- Support System Migration
-- Tables: support_tickets, ticket_replies, chat_sessions, chat_messages, faqs, chatbot_settings

-- =====================
-- ENUMS
-- =====================
DROP TYPE IF EXISTS public.ticket_status CASCADE;
CREATE TYPE public.ticket_status AS ENUM ('open', 'in_progress', 'resolved');

DROP TYPE IF EXISTS public.ticket_category CASCADE;
CREATE TYPE public.ticket_category AS ENUM ('deposit', 'withdrawal', 'trading', 'account', 'technical', 'other');

DROP TYPE IF EXISTS public.chat_session_status CASCADE;
CREATE TYPE public.chat_session_status AS ENUM ('active', 'closed');

-- =====================
-- TABLES
-- =====================

-- Support Tickets
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  category public.ticket_category DEFAULT 'other'::public.ticket_category,
  status public.ticket_status DEFAULT 'open'::public.ticket_status,
  priority TEXT DEFAULT 'normal',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Ticket Replies
CREATE TABLE IF NOT EXISTS public.ticket_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'admin')),
  sender_id UUID,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Chat Sessions
CREATE TABLE IF NOT EXISTS public.chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  status public.chat_session_status DEFAULT 'active'::public.chat_session_status,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Chat Messages
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'admin', 'bot')),
  sender_id UUID,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- FAQs
CREATE TABLE IF NOT EXISTS public.faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL DEFAULT 'General',
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Chatbot Settings
CREATE TABLE IF NOT EXISTS public.chatbot_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- =====================
-- INDEXES
-- =====================
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON public.support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_ticket_replies_ticket_id ON public.ticket_replies(ticket_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON public.chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON public.chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_faqs_category ON public.faqs(category);
CREATE INDEX IF NOT EXISTS idx_faqs_is_active ON public.faqs(is_active);

-- =====================
-- ENABLE RLS
-- =====================
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chatbot_settings ENABLE ROW LEVEL SECURITY;

-- =====================
-- RLS POLICIES
-- =====================

-- support_tickets
DROP POLICY IF EXISTS "users_manage_own_support_tickets" ON public.support_tickets;
CREATE POLICY "users_manage_own_support_tickets"
ON public.support_tickets FOR ALL TO authenticated
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "admin_full_access_support_tickets" ON public.support_tickets;
CREATE POLICY "admin_full_access_support_tickets"
ON public.support_tickets FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- ticket_replies
DROP POLICY IF EXISTS "users_view_own_ticket_replies" ON public.ticket_replies;
CREATE POLICY "users_view_own_ticket_replies"
ON public.ticket_replies FOR SELECT TO authenticated
USING (
  ticket_id IN (SELECT id FROM public.support_tickets WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "users_insert_own_ticket_replies" ON public.ticket_replies;
CREATE POLICY "users_insert_own_ticket_replies"
ON public.ticket_replies FOR INSERT TO authenticated
WITH CHECK (
  sender_type = 'user' AND sender_id = auth.uid() AND
  ticket_id IN (SELECT id FROM public.support_tickets WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "admin_full_access_ticket_replies" ON public.ticket_replies;
CREATE POLICY "admin_full_access_ticket_replies"
ON public.ticket_replies FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- chat_sessions
DROP POLICY IF EXISTS "users_manage_own_chat_sessions" ON public.chat_sessions;
CREATE POLICY "users_manage_own_chat_sessions"
ON public.chat_sessions FOR ALL TO authenticated
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "admin_full_access_chat_sessions" ON public.chat_sessions;
CREATE POLICY "admin_full_access_chat_sessions"
ON public.chat_sessions FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- chat_messages
DROP POLICY IF EXISTS "users_view_own_chat_messages" ON public.chat_messages;
CREATE POLICY "users_view_own_chat_messages"
ON public.chat_messages FOR SELECT TO authenticated
USING (
  session_id IN (SELECT id FROM public.chat_sessions WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "users_insert_own_chat_messages" ON public.chat_messages;
CREATE POLICY "users_insert_own_chat_messages"
ON public.chat_messages FOR INSERT TO authenticated
WITH CHECK (
  sender_type IN ('user', 'bot') AND
  session_id IN (SELECT id FROM public.chat_sessions WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "admin_full_access_chat_messages" ON public.chat_messages;
CREATE POLICY "admin_full_access_chat_messages"
ON public.chat_messages FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- faqs - public read, service_role write
DROP POLICY IF EXISTS "public_read_faqs" ON public.faqs;
CREATE POLICY "public_read_faqs"
ON public.faqs FOR SELECT TO public
USING (is_active = true);

DROP POLICY IF EXISTS "admin_full_access_faqs" ON public.faqs;
CREATE POLICY "admin_full_access_faqs"
ON public.faqs FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- chatbot_settings - service_role only
DROP POLICY IF EXISTS "admin_full_access_chatbot_settings" ON public.chatbot_settings;
CREATE POLICY "admin_full_access_chatbot_settings"
ON public.chatbot_settings FOR ALL TO service_role
USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "public_read_chatbot_settings" ON public.chatbot_settings;
CREATE POLICY "public_read_chatbot_settings"
ON public.chatbot_settings FOR SELECT TO public
USING (true);

-- =====================
-- SEED DATA
-- =====================
DO $$
BEGIN
  -- Default chatbot settings
  INSERT INTO public.chatbot_settings (setting_key, setting_value) VALUES
    ('enabled', 'true'),
    ('model', 'gpt-4o-mini'),
    ('system_prompt', 'You are a helpful support assistant for Tradiglo, a trading platform. Answer questions about deposits, withdrawals, trading, and account management. Be concise and professional. If you cannot answer, suggest the user open a support ticket or start a live chat.'),
    ('max_tokens', '500'),
    ('temperature', '0.7'),
    ('fallback_message', 'I am not sure about that. Please open a support ticket or start a live chat with our team.')
  ON CONFLICT (setting_key) DO NOTHING;

  -- Sample FAQs
  INSERT INTO public.faqs (category, question, answer, sort_order) VALUES
    ('Deposit & Withdrawal', 'How do I make a deposit?', 'Go to your dashboard, click on Deposit, select your preferred payment method, enter the amount, and follow the instructions. Deposits are usually processed within 1-24 hours.', 1),
    ('Deposit & Withdrawal', 'How long does a withdrawal take?', 'Withdrawals are typically processed within 1-3 business days depending on your payment method and country.', 2),
    ('Deposit & Withdrawal', 'What is the minimum deposit amount?', 'The minimum deposit amount varies by payment method. Please check the deposit page for the specific minimum for your chosen method.', 3),
    ('Trading', 'How do I start trading?', 'After depositing funds, go to your dashboard, select an asset, choose your trade direction (Buy/Sell), set the amount and duration, then confirm your trade.', 1),
    ('Trading', 'What assets can I trade?', 'Tradiglo offers trading on Forex, Cryptocurrencies, Stocks, Commodities, and Indices. The full list is available on the Markets page.', 2),
    ('Trading', 'What is Copy Trading?', 'Copy Trading allows you to automatically replicate the trades of experienced traders. Go to the Copy Trading section to browse and follow top traders.', 3),
    ('Account & KYC', 'How do I verify my account?', 'Go to Account Settings and upload the required documents (government ID and proof of address). Verification usually takes 1-2 business days.', 1),
    ('Account & KYC', 'Why is my account restricted?', 'Account restrictions may occur due to incomplete KYC verification, suspicious activity, or policy violations. Contact support for assistance.', 2),
    ('Technical', 'The platform is not loading. What should I do?', 'Try clearing your browser cache, disabling browser extensions, or using a different browser. If the issue persists, contact our support team.', 1),
    ('Technical', 'How do I reset my password?', 'Click on Forgot Password on the login page and enter your email address. You will receive a password reset link within a few minutes.', 2)
  ON CONFLICT (id) DO NOTHING;

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Seed data insertion failed: %', SQLERRM;
END $$;
