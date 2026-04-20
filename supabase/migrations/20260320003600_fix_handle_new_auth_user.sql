-- ============================================================
-- Fix: handle_new_auth_user - handle email conflict on re-registration
-- When a user is deleted from auth.users but public.users row remains,
-- re-registration with the same email causes a unique constraint violation.
-- This fix handles both id and email conflicts gracefully.
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- First, clean up any orphaned public.users row with the same email but different id
  DELETE FROM public.users
  WHERE email = NEW.email AND id != NEW.id;

  -- Now insert or update the user row
  INSERT INTO public.users (id, email, full_name, avatar_url, role, is_verified)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
    COALESCE((NEW.email_confirmed_at IS NOT NULL), false)
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.users.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.users.avatar_url),
    updated_at = now();

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'handle_new_auth_user failed: %', SQLERRM;
    RETURN NEW;
END;
$$;
