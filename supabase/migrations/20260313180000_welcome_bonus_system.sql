-- Welcome Bonus System Migration

-- 1. Add bonus columns to deposits table
ALTER TABLE public.deposits
ADD COLUMN IF NOT EXISTS bonus_percent NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS bonus_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS final_amount NUMERIC,
ADD COLUMN IF NOT EXISTS is_first_deposit BOOLEAN DEFAULT false;

-- 2. Create bonus_settings table
CREATE TABLE IF NOT EXISTS public.bonus_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  bonus_percent NUMERIC DEFAULT 100,
  is_active BOOLEAN DEFAULT true,
  applies_to TEXT DEFAULT 'first_deposit',
  min_deposit NUMERIC DEFAULT 0,
  max_bonus NUMERIC DEFAULT 10000,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default welcome bonus if not exists
INSERT INTO public.bonus_settings (name, bonus_percent, is_active, applies_to, min_deposit, max_bonus)
SELECT 'Welcome Bonus', 100, true, 'first_deposit', 10, 10000
WHERE NOT EXISTS (SELECT 1 FROM public.bonus_settings WHERE applies_to = 'first_deposit');

-- 3. Function to check if this is user's first deposit
CREATE OR REPLACE FUNCTION public.is_first_deposit(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM public.deposits
    WHERE user_id = p_user_id
    AND status = 'approved'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. RLS for bonus_settings
ALTER TABLE public.bonus_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bonus_settings_admin_all" ON public.bonus_settings;
CREATE POLICY "bonus_settings_admin_all" ON public.bonus_settings
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);
