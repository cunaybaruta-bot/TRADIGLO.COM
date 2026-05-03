-- Add BHD (Bahraini Dinar) to currency_rates table
INSERT INTO public.currency_rates (id, currency_code, currency_name, rate_to_usd, updated_at)
VALUES (
  gen_random_uuid(),
  'BHD',
  'Bahraini Dinar',
  2.65,
  now()
)
ON CONFLICT (currency_code) DO NOTHING;
