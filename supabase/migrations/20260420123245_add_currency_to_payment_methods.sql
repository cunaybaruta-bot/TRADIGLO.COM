-- Add currency column to payment_methods table
ALTER TABLE public.payment_methods
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';
