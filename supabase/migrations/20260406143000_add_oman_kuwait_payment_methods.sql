-- Add Oman banks as payment methods
INSERT INTO public.payment_methods (country, type, name, is_active, min_deposit, max_deposit)
VALUES
  ('Oman', 'bank', 'Bank Muscat', true, 10, 50000),
  ('Oman', 'bank', 'National Bank of Oman', true, 10, 50000),
  ('Oman', 'bank', 'Bank Dhofar', true, 10, 50000),
  ('Oman', 'bank', 'Sohar International', true, 10, 50000),
  ('Oman', 'bank', 'Oman Arab Bank', true, 10, 50000),
  ('Oman', 'bank', 'Ahli Bank', true, 10, 50000),
  ('Oman', 'bank', 'Bank Nizwa', true, 10, 50000),
  ('Oman', 'bank', 'Alizz Islamic Bank', true, 10, 50000)
ON CONFLICT DO NOTHING;

-- Add Kuwait banks as payment methods
INSERT INTO public.payment_methods (country, type, name, is_active, min_deposit, max_deposit)
VALUES
  ('Kuwait', 'bank', 'National Bank of Kuwait', true, 10, 50000),
  ('Kuwait', 'bank', 'Kuwait Finance House', true, 10, 50000),
  ('Kuwait', 'bank', 'Gulf Bank', true, 10, 50000),
  ('Kuwait', 'bank', 'Commercial Bank of Kuwait', true, 10, 50000),
  ('Kuwait', 'bank', 'Al Ahli Bank of Kuwait', true, 10, 50000),
  ('Kuwait', 'bank', 'Burgan Bank', true, 10, 50000),
  ('Kuwait', 'bank', 'Boubyan Bank', true, 10, 50000),
  ('Kuwait', 'bank', 'Warba Bank', true, 10, 50000)
ON CONFLICT DO NOTHING;
