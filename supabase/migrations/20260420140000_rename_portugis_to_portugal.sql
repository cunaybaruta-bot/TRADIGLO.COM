-- Rename 'Portugis' to 'Portugal' in payment_methods table
UPDATE public.payment_methods
SET country = 'Portugal'
WHERE country = 'Portugis';
