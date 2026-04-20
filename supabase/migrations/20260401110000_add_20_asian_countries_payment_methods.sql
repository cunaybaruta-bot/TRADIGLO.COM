-- Migration: Add 20 Asian countries with placeholder payment methods
-- Each country gets one bank transfer and one crypto method as placeholders
-- Admin can activate/configure them via the admin panel

DO $$
BEGIN

  -- ============================================================
  -- CHINA (CNY)
  -- ============================================================
  INSERT INTO public.payment_methods (id, type, country, name, account_number, account_name, network, instructions, min_deposit, max_deposit, is_active)
  VALUES
    (gen_random_uuid(), 'bank',   'China', 'China Bank Transfer (CNY)', NULL, NULL, NULL, 'Transfer in CNY. Contact support for account details.', 100, 1000000, false),
    (gen_random_uuid(), 'crypto', 'China', 'USDT (TRC20) - China',      NULL, NULL, 'TRC20', 'Send USDT via TRC20 network. Contact support for wallet address.', 100, 1000000, false)
  ON CONFLICT DO NOTHING;

  -- ============================================================
  -- JAPAN (JPY)
  -- ============================================================
  INSERT INTO public.payment_methods (id, type, country, name, account_number, account_name, network, instructions, min_deposit, max_deposit, is_active)
  VALUES
    (gen_random_uuid(), 'bank',   'Japan', 'Japan Bank Transfer (JPY)', NULL, NULL, NULL, 'Transfer in JPY. Contact support for account details.', 100, 1000000, false),
    (gen_random_uuid(), 'crypto', 'Japan', 'USDT (TRC20) - Japan',      NULL, NULL, 'TRC20', 'Send USDT via TRC20 network. Contact support for wallet address.', 100, 1000000, false)
  ON CONFLICT DO NOTHING;

  -- ============================================================
  -- INDIA (INR)
  -- ============================================================
  INSERT INTO public.payment_methods (id, type, country, name, account_number, account_name, network, instructions, min_deposit, max_deposit, is_active)
  VALUES
    (gen_random_uuid(), 'bank',   'India', 'India Bank Transfer (INR)', NULL, NULL, NULL, 'Transfer in INR. Contact support for account details.', 100, 1000000, false),
    (gen_random_uuid(), 'ewallet','India', 'UPI / Paytm (INR)',         NULL, NULL, NULL, 'Pay via UPI or Paytm. Contact support for UPI ID.', 100, 1000000, false),
    (gen_random_uuid(), 'crypto', 'India', 'USDT (TRC20) - India',      NULL, NULL, 'TRC20', 'Send USDT via TRC20 network. Contact support for wallet address.', 100, 1000000, false)
  ON CONFLICT DO NOTHING;

  -- ============================================================
  -- HONG KONG (HKD)
  -- ============================================================
  INSERT INTO public.payment_methods (id, type, country, name, account_number, account_name, network, instructions, min_deposit, max_deposit, is_active)
  VALUES
    (gen_random_uuid(), 'bank',   'Hong Kong', 'Hong Kong Bank Transfer (HKD)', NULL, NULL, NULL, 'Transfer in HKD. Contact support for account details.', 100, 1000000, false),
    (gen_random_uuid(), 'crypto', 'Hong Kong', 'USDT (TRC20) - Hong Kong',      NULL, NULL, 'TRC20', 'Send USDT via TRC20 network. Contact support for wallet address.', 100, 1000000, false)
  ON CONFLICT DO NOTHING;

  -- ============================================================
  -- TAIWAN (TWD)
  -- ============================================================
  INSERT INTO public.payment_methods (id, type, country, name, account_number, account_name, network, instructions, min_deposit, max_deposit, is_active)
  VALUES
    (gen_random_uuid(), 'bank',   'Taiwan', 'Taiwan Bank Transfer (TWD)', NULL, NULL, NULL, 'Transfer in TWD. Contact support for account details.', 100, 1000000, false),
    (gen_random_uuid(), 'crypto', 'Taiwan', 'USDT (TRC20) - Taiwan',      NULL, NULL, 'TRC20', 'Send USDT via TRC20 network. Contact support for wallet address.', 100, 1000000, false)
  ON CONFLICT DO NOTHING;

  -- ============================================================
  -- PAKISTAN (PKR)
  -- ============================================================
  INSERT INTO public.payment_methods (id, type, country, name, account_number, account_name, network, instructions, min_deposit, max_deposit, is_active)
  VALUES
    (gen_random_uuid(), 'bank',   'Pakistan', 'Pakistan Bank Transfer (PKR)', NULL, NULL, NULL, 'Transfer in PKR. Contact support for account details.', 100, 1000000, false),
    (gen_random_uuid(), 'ewallet','Pakistan', 'JazzCash / EasyPaisa (PKR)',   NULL, NULL, NULL, 'Pay via JazzCash or EasyPaisa. Contact support for account details.', 100, 1000000, false),
    (gen_random_uuid(), 'crypto', 'Pakistan', 'USDT (TRC20) - Pakistan',      NULL, NULL, 'TRC20', 'Send USDT via TRC20 network. Contact support for wallet address.', 100, 1000000, false)
  ON CONFLICT DO NOTHING;

  -- ============================================================
  -- BANGLADESH (BDT)
  -- ============================================================
  INSERT INTO public.payment_methods (id, type, country, name, account_number, account_name, network, instructions, min_deposit, max_deposit, is_active)
  VALUES
    (gen_random_uuid(), 'bank',   'Bangladesh', 'Bangladesh Bank Transfer (BDT)', NULL, NULL, NULL, 'Transfer in BDT. Contact support for account details.', 100, 1000000, false),
    (gen_random_uuid(), 'ewallet','Bangladesh', 'bKash / Nagad (BDT)',            NULL, NULL, NULL, 'Pay via bKash or Nagad. Contact support for account details.', 100, 1000000, false),
    (gen_random_uuid(), 'crypto', 'Bangladesh', 'USDT (TRC20) - Bangladesh',      NULL, NULL, 'TRC20', 'Send USDT via TRC20 network. Contact support for wallet address.', 100, 1000000, false)
  ON CONFLICT DO NOTHING;

  -- ============================================================
  -- SAUDI ARABIA (SAR)
  -- ============================================================
  INSERT INTO public.payment_methods (id, type, country, name, account_number, account_name, network, instructions, min_deposit, max_deposit, is_active)
  VALUES
    (gen_random_uuid(), 'bank',   'Saudi Arabia', 'Saudi Arabia Bank Transfer (SAR)', NULL, NULL, NULL, 'Transfer in SAR. Contact support for account details.', 100, 1000000, false),
    (gen_random_uuid(), 'ewallet','Saudi Arabia', 'STC Pay (SAR)',                    NULL, NULL, NULL, 'Pay via STC Pay. Contact support for account details.', 100, 1000000, false),
    (gen_random_uuid(), 'crypto', 'Saudi Arabia', 'USDT (TRC20) - Saudi Arabia',      NULL, NULL, 'TRC20', 'Send USDT via TRC20 network. Contact support for wallet address.', 100, 1000000, false)
  ON CONFLICT DO NOTHING;

  -- ============================================================
  -- UAE (AED)
  -- ============================================================
  INSERT INTO public.payment_methods (id, type, country, name, account_number, account_name, network, instructions, min_deposit, max_deposit, is_active)
  VALUES
    (gen_random_uuid(), 'bank',   'UAE', 'UAE Bank Transfer (AED)', NULL, NULL, NULL, 'Transfer in AED. Contact support for account details.', 100, 1000000, false),
    (gen_random_uuid(), 'ewallet','UAE', 'UAE e-Wallet (AED)',      NULL, NULL, NULL, 'Pay via local e-wallet. Contact support for account details.', 100, 1000000, false),
    (gen_random_uuid(), 'crypto', 'UAE', 'USDT (TRC20) - UAE',      NULL, NULL, 'TRC20', 'Send USDT via TRC20 network. Contact support for wallet address.', 100, 1000000, false)
  ON CONFLICT DO NOTHING;

  -- ============================================================
  -- QATAR (QAR)
  -- ============================================================
  INSERT INTO public.payment_methods (id, type, country, name, account_number, account_name, network, instructions, min_deposit, max_deposit, is_active)
  VALUES
    (gen_random_uuid(), 'bank',   'Qatar', 'Qatar Bank Transfer (QAR)', NULL, NULL, NULL, 'Transfer in QAR. Contact support for account details.', 100, 1000000, false),
    (gen_random_uuid(), 'crypto', 'Qatar', 'USDT (TRC20) - Qatar',      NULL, NULL, 'TRC20', 'Send USDT via TRC20 network. Contact support for wallet address.', 100, 1000000, false)
  ON CONFLICT DO NOTHING;

  -- ============================================================
  -- KUWAIT (KWD)
  -- ============================================================
  INSERT INTO public.payment_methods (id, type, country, name, account_number, account_name, network, instructions, min_deposit, max_deposit, is_active)
  VALUES
    (gen_random_uuid(), 'bank',   'Kuwait', 'Kuwait Bank Transfer (KWD)', NULL, NULL, NULL, 'Transfer in KWD. Contact support for account details.', 100, 1000000, false),
    (gen_random_uuid(), 'crypto', 'Kuwait', 'USDT (TRC20) - Kuwait',      NULL, NULL, 'TRC20', 'Send USDT via TRC20 network. Contact support for wallet address.', 100, 1000000, false)
  ON CONFLICT DO NOTHING;

  -- ============================================================
  -- SRI LANKA (LKR)
  -- ============================================================
  INSERT INTO public.payment_methods (id, type, country, name, account_number, account_name, network, instructions, min_deposit, max_deposit, is_active)
  VALUES
    (gen_random_uuid(), 'bank',   'Sri Lanka', 'Sri Lanka Bank Transfer (LKR)', NULL, NULL, NULL, 'Transfer in LKR. Contact support for account details.', 100, 1000000, false),
    (gen_random_uuid(), 'crypto', 'Sri Lanka', 'USDT (TRC20) - Sri Lanka',      NULL, NULL, 'TRC20', 'Send USDT via TRC20 network. Contact support for wallet address.', 100, 1000000, false)
  ON CONFLICT DO NOTHING;

  -- ============================================================
  -- MYANMAR (MMK)
  -- ============================================================
  INSERT INTO public.payment_methods (id, type, country, name, account_number, account_name, network, instructions, min_deposit, max_deposit, is_active)
  VALUES
    (gen_random_uuid(), 'bank',   'Myanmar', 'Myanmar Bank Transfer (MMK)', NULL, NULL, NULL, 'Transfer in MMK. Contact support for account details.', 100, 1000000, false),
    (gen_random_uuid(), 'ewallet','Myanmar', 'Wave Money / KBZPay (MMK)',   NULL, NULL, NULL, 'Pay via Wave Money or KBZPay. Contact support for account details.', 100, 1000000, false),
    (gen_random_uuid(), 'crypto', 'Myanmar', 'USDT (TRC20) - Myanmar',      NULL, NULL, 'TRC20', 'Send USDT via TRC20 network. Contact support for wallet address.', 100, 1000000, false)
  ON CONFLICT DO NOTHING;

END $$;

-- ============================================================
-- Add currency rates for the new countries
-- (placeholder rates — admin should update via currency-rates panel)
-- ============================================================
INSERT INTO public.currency_rates (currency_code, currency_name, rate_to_usd)
VALUES
  ('CNY', 'Chinese Yuan',          0.1380),
  ('JPY', 'Japanese Yen',          0.0067),
  ('INR', 'Indian Rupee',          0.0120),
  ('HKD', 'Hong Kong Dollar',      0.1280),
  ('TWD', 'New Taiwan Dollar',     0.0312),
  ('PKR', 'Pakistani Rupee',       0.0036),
  ('BDT', 'Bangladeshi Taka',      0.0091),
  ('SAR', 'Saudi Riyal',           0.2667),
  ('AED', 'UAE Dirham',            0.2723),
  ('QAR', 'Qatari Riyal',          0.2747),
  ('KWD', 'Kuwaiti Dinar',         3.2500),
  ('LKR', 'Sri Lankan Rupee',      0.0034),
  ('MMK', 'Myanmar Kyat',          0.0005)
ON CONFLICT (currency_code) DO NOTHING;
