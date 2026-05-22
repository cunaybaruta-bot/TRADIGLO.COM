-- Rename 'AmBank' to 'Bank Transfer' in payment_methods table
-- This ensures consistent withdrawal method naming across all member dashboards

UPDATE public.payment_methods
SET name = 'Bank Transfer'
WHERE name = 'AmBank';
