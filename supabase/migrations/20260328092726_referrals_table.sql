-- Migration: Create referrals table
-- Module: Referral system
-- Timestamp: 20260328092726

-- 1. Create referral status enum
DROP TYPE IF EXISTS public.referral_status CASCADE;
CREATE TYPE public.referral_status AS ENUM ('pending', 'completed', 'paid');

-- 2. Create referrals table
CREATE TABLE IF NOT EXISTS public.referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    referred_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    referral_code TEXT NOT NULL,
    deposit_amount NUMERIC(18, 2) DEFAULT 0,
    reward_amount NUMERIC(18, 2) DEFAULT 0,
    status public.referral_status DEFAULT 'pending'::public.referral_status,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT referrals_unique_referred UNIQUE (referred_id)
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON public.referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_id ON public.referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referral_code ON public.referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON public.referrals(status);

-- 4. Function: auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_referrals_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

-- 5. Enable RLS
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies
-- Referrer can view their own referrals
DROP POLICY IF EXISTS "referrer_can_view_own_referrals" ON public.referrals;
CREATE POLICY "referrer_can_view_own_referrals"
ON public.referrals
FOR SELECT
TO authenticated
USING (referrer_id = auth.uid());

-- Referred user can view their own referral record
DROP POLICY IF EXISTS "referred_can_view_own_record" ON public.referrals;
CREATE POLICY "referred_can_view_own_record"
ON public.referrals
FOR SELECT
TO authenticated
USING (referred_id = auth.uid());

-- Authenticated users can insert referral records (when registering with a ref code)
DROP POLICY IF EXISTS "authenticated_can_insert_referrals" ON public.referrals;
CREATE POLICY "authenticated_can_insert_referrals"
ON public.referrals
FOR INSERT
TO authenticated
WITH CHECK (referred_id = auth.uid());

-- Service role can update referral records (for reward processing)
DROP POLICY IF EXISTS "service_can_update_referrals" ON public.referrals;
CREATE POLICY "service_can_update_referrals"
ON public.referrals
FOR UPDATE
TO authenticated
USING (referrer_id = auth.uid())
WITH CHECK (referrer_id = auth.uid());

-- 7. Trigger: update updated_at on row change
DROP TRIGGER IF EXISTS trg_referrals_updated_at ON public.referrals;
CREATE TRIGGER trg_referrals_updated_at
BEFORE UPDATE ON public.referrals
FOR EACH ROW
EXECUTE FUNCTION public.set_referrals_updated_at();
