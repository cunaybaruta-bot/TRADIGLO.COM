-- Migration: Add Complete Payment Methods & Currency Rates for Europe, South America, and remaining Global regions
-- Benchmarked against Malaysia standards: Local banks, official currency codes, and USD conversion rates.

-- ============================================================
-- 1. INSERT / UPDATE CURRENCY RATES (USD CONVERSION)
-- ============================================================
INSERT INTO public.currency_rates (currency_code, currency_name, rate_to_usd)
VALUES
  -- Europe
  ('EUR', 'Euro',                      1.0800),
  ('GBP', 'British Pound',             1.2700),
  ('CHF', 'Swiss Franc',               1.1200),
  ('SEK', 'Swedish Krona',             0.0950),
  ('NOK', 'Norwegian Krone',           0.0920),
  ('DKK', 'Danish Krone',              0.1450),
  ('PLN', 'Polish Zloty',              0.2500),
  
  -- South America
  ('BRL', 'Brazilian Real',            0.1800),
  ('ARS', 'Argentine Peso',            0.0011),
  ('COP', 'Colombian Peso',            0.00025),
  ('CLP', 'Chilean Peso',              0.00105),
  ('PEN', 'Peruvian Sol',              0.2700),
  ('UYU', 'Uruguayan Peso',            0.0250),
  ('PYG', 'Paraguayan Guarani',        0.00013),
  ('BOB', 'Bolivian Boliviano',        0.1450),
  ('VES', 'Venezuelan Bolívar',        0.0270),

  -- Asia & Middle East (Complete coverage)
  ('KRW', 'South Korean Won',          0.00072),
  ('BHD', 'Bahraini Dinar',            2.6525),
  ('JOD', 'Jordanian Dinar',           1.4104),
  ('OMR', 'Omani Rial',                2.5974),
  ('KHR', 'Cambodian Riel',            0.00024),
  ('LAK', 'Lao Kip',                   0.000046),
  ('NPR', 'Nepalese Rupee',            0.0075)
ON CONFLICT (currency_code) DO UPDATE 
SET rate_to_usd = EXCLUDED.rate_to_usd;

-- ============================================================
-- 2. INSERT PAYMENT METHODS FOR GERMANY (JERMAN 🇩🇪)
-- ============================================================
INSERT INTO public.payment_methods (country, type, name, is_active, min_deposit, max_deposit, instructions)
VALUES
  ('Germany', 'bank', 'Deutsche Bank', true, 10, 50000, 'Transfer directly to Deutsche Bank account. Use your deposit reference code.'),
  ('Germany', 'bank', 'Commerzbank', true, 10, 50000, 'Direct bank transfer via Commerzbank online banking.'),
  ('Germany', 'bank', 'N26 Bank', true, 10, 50000, 'Instant SEPA transfer from your N26 app.'),
  ('Germany', 'bank', 'Sparkasse / DekaBank', true, 10, 50000, 'Sparkasse online banking / Girokonto transfer.'),
  ('Germany', 'bank', 'DZ Bank / Volksbanken Raiffeisenbanken', true, 10, 50000, 'Standard VR-Bank transfer with reference code.'),
  ('Germany', 'bank', 'ING-DiBa Germany', true, 10, 50000, 'ING Germany SEPA bank transfer.'),
  ('Germany', 'bank', 'SEPA Instant Transfer (Eurozone)', true, 10, 50000, 'Fast SEPA instant transfer arriving in seconds.')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 3. INSERT PAYMENT METHODS FOR EUROPEAN COUNTRIES
-- ============================================================
-- UNITED KINGDOM 🇬🇧
INSERT INTO public.payment_methods (country, type, name, is_active, min_deposit, max_deposit, instructions)
VALUES
  ('United Kingdom', 'bank', 'Barclays Bank UK', true, 10, 50000, 'UK Faster Payments / BACS bank transfer.'),
  ('United Kingdom', 'bank', 'HSBC UK', true, 10, 50000, 'Online banking transfer via HSBC UK.'),
  ('United Kingdom', 'bank', 'Lloyds Bank', true, 10, 50000, 'Lloyds Bank instant Faster Payment.'),
  ('United Kingdom', 'bank', 'NatWest (National Westminster Bank)', true, 10, 50000, 'NatWest bank transfer with reference code.'),
  ('United Kingdom', 'bank', 'Monzo Bank', true, 10, 50000, 'Instant mobile transfer via Monzo app.'),
  ('United Kingdom', 'bank', 'Revolut UK', true, 10, 50000, 'Revolut to Revolut or UK bank transfer.')
ON CONFLICT DO NOTHING;

-- FRANCE 🇫🇷
INSERT INTO public.payment_methods (country, type, name, is_active, min_deposit, max_deposit, instructions)
VALUES
  ('France', 'bank', 'BNP Paribas', true, 10, 50000, 'Virement bancaire SEPA via BNP Paribas.'),
  ('France', 'bank', 'Crédit Agricole', true, 10, 50000, 'Virement bancaire via Crédit Agricole en ligne.'),
  ('France', 'bank', 'Société Générale', true, 10, 50000, 'Virement SEPA Société Générale.'),
  ('France', 'bank', 'BPCE (Banque Populaire / Caisse d''Epargne)', true, 10, 50000, 'Virement bancaire BPCE.')
ON CONFLICT DO NOTHING;

-- ITALY 🇮🇹
INSERT INTO public.payment_methods (country, type, name, is_active, min_deposit, max_deposit, instructions)
VALUES
  ('Italy', 'bank', 'Intesa Sanpaolo', true, 10, 50000, 'Bonifico bancario tramite Intesa Sanpaolo.'),
  ('Italy', 'bank', 'UniCredit Italia', true, 10, 50000, 'Bonifico bancario online via UniCredit.'),
  ('Italy', 'bank', 'Banco BPM', true, 10, 50000, 'Bonifico SEPA Banco BPM.')
ON CONFLICT DO NOTHING;

-- SPAIN 🇪🇸
INSERT INTO public.payment_methods (country, type, name, is_active, min_deposit, max_deposit, instructions)
VALUES
  ('Spain', 'bank', 'Banco Santander España', true, 10, 50000, 'Transferencia bancaria Banco Santander.'),
  ('Spain', 'bank', 'BBVA España', true, 10, 50000, 'Transferencia online BBVA.'),
  ('Spain', 'bank', 'CaixaBank', true, 10, 50000, 'Transferencia SEPA CaixaBank / Bizum.')
ON CONFLICT DO NOTHING;

-- NETHERLANDS 🇳🇱
INSERT INTO public.payment_methods (country, type, name, is_active, min_deposit, max_deposit, instructions)
VALUES
  ('Netherlands', 'bank', 'ING Bank Netherlands', true, 10, 50000, 'iDEAL / SEPA bankoverschrijving via ING.'),
  ('Netherlands', 'bank', 'Rabobank', true, 10, 50000, 'Bankoverschrijving via Rabobank online.'),
  ('Netherlands', 'bank', 'ABN AMRO', true, 10, 50000, 'Bankoverschrijving via ABN AMRO.')
ON CONFLICT DO NOTHING;

-- SWITZERLAND 🇨🇭
INSERT INTO public.payment_methods (country, type, name, is_active, min_deposit, max_deposit, instructions)
VALUES
  ('Switzerland', 'bank', 'UBS Switzerland', true, 10, 50000, 'Banküberweisung / Virement via UBS.'),
  ('Switzerland', 'bank', 'Credit Suisse', true, 10, 50000, 'Online banking transfer Credit Suisse.'),
  ('Switzerland', 'bank', 'Raiffeisen Switzerland', true, 10, 50000, 'Raiffeisen Schweiz Überweisung.')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 4. INSERT PAYMENT METHODS FOR SOUTH AMERICAN COUNTRIES
-- ============================================================
-- BRAZIL 🇧🇷
INSERT INTO public.payment_methods (country, type, name, is_active, min_deposit, max_deposit, instructions)
VALUES
  ('Brazil', 'bank', 'Banco do Brasil', true, 10, 50000, 'Transferência bancária Banco do Brasil / PIX.'),
  ('Brazil', 'bank', 'Itaú Unibanco', true, 10, 50000, 'Transferência online Itaú / Chave PIX.'),
  ('Brazil', 'bank', 'Banco Bradesco', true, 10, 50000, 'Transferência Bradesco / PIX.'),
  ('Brazil', 'bank', 'Nubank Brasil', true, 10, 50000, 'Transferência instantânea via Nubank / PIX.')
ON CONFLICT DO NOTHING;

-- ARGENTINA 🇦🇷
INSERT INTO public.payment_methods (country, type, name, is_active, min_deposit, max_deposit, instructions)
VALUES
  ('Argentina', 'bank', 'Banco de la Nación Argentina', true, 10, 50000, 'Transferencia bancaria Banco Nación / CBU.'),
  ('Argentina', 'bank', 'Banco Santander Río Argentina', true, 10, 50000, 'Transferencia online Santander Río.'),
  ('Argentina', 'bank', 'Banco Galicia', true, 10, 50000, 'Transferencia Banco Galicia / Alias CBU.')
ON CONFLICT DO NOTHING;

-- COLOMBIA 🇨🇴
INSERT INTO public.payment_methods (country, type, name, is_active, min_deposit, max_deposit, instructions)
VALUES
  ('Colombia', 'bank', 'Bancolombia', true, 10, 50000, 'Transferencia Bancolombia / PSE.'),
  ('Colombia', 'bank', 'Banco de Bogotá', true, 10, 50000, 'Transferencia online Banco de Bogotá.'),
  ('Colombia', 'bank', 'Davivienda / Nequi', true, 10, 50000, 'Transferencia Davivienda / Nequi.')
ON CONFLICT DO NOTHING;

-- CHILE 🇨🇱
INSERT INTO public.payment_methods (country, type, name, is_active, min_deposit, max_deposit, instructions)
VALUES
  ('Chile', 'bank', 'Banco de Chile', true, 10, 50000, 'Transferencia electrónica Banco de Chile.'),
  ('Chile', 'bank', 'Banco Santander-Chile', true, 10, 50000, 'Transferencia online Santander Chile.'),
  ('Chile', 'bank', 'BancoEstado (CuentaRUT)', true, 10, 50000, 'Transferencia BancoEstado / CuentaRUT.')
ON CONFLICT DO NOTHING;

-- PERU 🇵🇪
INSERT INTO public.payment_methods (country, type, name, is_active, min_deposit, max_deposit, instructions)
VALUES
  ('Peru', 'bank', 'BCP (Banco de Crédito del Perú)', true, 10, 50000, 'Transferencia BCP / Yape.'),
  ('Peru', 'bank', 'BBVA Perú', true, 10, 50000, 'Transferencia online BBVA Perú / Plin.'),
  ('Peru', 'bank', 'Interbank Perú', true, 10, 50000, 'Transferencia Interbank.')
ON CONFLICT DO NOTHING;

-- OMAN 🇴🇲
INSERT INTO public.payment_methods (country, type, name, is_active, min_deposit, max_deposit, instructions)
VALUES
  ('Oman', 'bank', 'Bank Muscat', true, 10, 50000, 'Online bank transfer via Bank Muscat.'),
  ('Oman', 'bank', 'National Bank of Oman (NBO)', true, 10, 50000, 'NBO online bank transfer.')
ON CONFLICT DO NOTHING;

-- CAMBODIA 🇰🇭
INSERT INTO public.payment_methods (country, type, name, is_active, min_deposit, max_deposit, instructions)
VALUES
  ('Cambodia', 'bank', 'ABA Bank Cambodia', true, 10, 50000, 'ABA Mobile / KHQR bank transfer.'),
  ('Cambodia', 'bank', 'ACLEDA Bank', true, 10, 50000, 'ACLEDA mobile bank transfer.')
ON CONFLICT DO NOTHING;
