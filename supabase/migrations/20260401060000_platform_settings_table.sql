-- Create platform_settings table for storing configurable platform settings
CREATE TABLE IF NOT EXISTS public.platform_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Admin can read and write all settings
DROP POLICY IF EXISTS "admin_manage_platform_settings" ON public.platform_settings;
CREATE POLICY "admin_manage_platform_settings"
ON public.platform_settings FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Updated_at trigger
DROP TRIGGER IF EXISTS set_updated_at_platform_settings ON public.platform_settings;
CREATE TRIGGER set_updated_at_platform_settings
  BEFORE UPDATE ON public.platform_settings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Seed default security settings
INSERT INTO public.platform_settings (key, value, category) VALUES
  ('require_2fa', 'false', 'security'),
  ('session_timeout_enabled', 'true', 'security'),
  ('session_timeout_minutes', '30', 'security'),
  ('ip_whitelist_enabled', 'false', 'security'),
  ('login_attempt_limit_enabled', 'true', 'security'),
  ('max_login_attempts', '5', 'security'),
  ('max_daily_withdrawal_usd', '50000', 'security'),
  ('withdrawal_approval_threshold_usd', '1000', 'security'),
  ('max_followers', '100', 'copy_trading'),
  ('min_copy_amount', '10', 'copy_trading'),
  ('max_copy_amount', '10000', 'copy_trading'),
  ('default_profit_share', '20', 'copy_trading'),
  ('max_profit_share', '50', 'copy_trading'),
  ('copy_platform_fee', '5', 'copy_trading')
ON CONFLICT (key) DO NOTHING;
