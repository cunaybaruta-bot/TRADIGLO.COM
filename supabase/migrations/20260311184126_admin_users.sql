-- Admin Users Table
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_users_select" ON public.admin_users;
CREATE POLICY "admin_users_select"
  ON public.admin_users
  FOR SELECT
  TO authenticated
  USING (true);

-- Insert the two admin accounts into auth.users and admin_users
DO $$
DECLARE
  support_uuid UUID := gen_random_uuid();
  admin_uuid   UUID := gen_random_uuid();
BEGIN
  -- support@tradiglo.com
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    created_at, updated_at, raw_user_meta_data, raw_app_meta_data,
    is_sso_user, is_anonymous, confirmation_token, confirmation_sent_at,
    recovery_token, recovery_sent_at, email_change_token_new, email_change,
    email_change_sent_at, email_change_token_current, email_change_confirm_status,
    reauthentication_token, reauthentication_sent_at, phone, phone_change,
    phone_change_token, phone_change_sent_at
  ) VALUES (
    support_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'support@tradiglo.com', crypt('Admintest99!', gen_salt('bf', 10)), now(), now(), now(),
    jsonb_build_object('full_name', 'Support Admin'),
    jsonb_build_object('provider', 'email', 'providers', ARRAY['email']::TEXT[]),
    false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null
  ) ON CONFLICT (email) DO NOTHING;

  -- admin@tradiglo.com
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    created_at, updated_at, raw_user_meta_data, raw_app_meta_data,
    is_sso_user, is_anonymous, confirmation_token, confirmation_sent_at,
    recovery_token, recovery_sent_at, email_change_token_new, email_change,
    email_change_sent_at, email_change_token_current, email_change_confirm_status,
    reauthentication_token, reauthentication_sent_at, phone, phone_change,
    phone_change_token, phone_change_sent_at
  ) VALUES (
    admin_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'admin@tradiglo.com', crypt('Admintest99!', gen_salt('bf', 10)), now(), now(), now(),
    jsonb_build_object('full_name', 'Tradiglo Admin'),
    jsonb_build_object('provider', 'email', 'providers', ARRAY['email']::TEXT[]),
    false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null
  ) ON CONFLICT (email) DO NOTHING;

  -- Register both emails in admin_users table
  INSERT INTO public.admin_users (email)
  VALUES ('support@tradiglo.com')
  ON CONFLICT (email) DO NOTHING;

  INSERT INTO public.admin_users (email)
  VALUES ('admin@tradiglo.com')
  ON CONFLICT (email) DO NOTHING;

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Admin user setup error: %', SQLERRM;
END $$;
