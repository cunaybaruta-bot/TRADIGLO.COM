-- Replace generic commodity names with canonical market symbols.
--
-- Symbols in this catalogue are either standard spot/CFD symbols shown by
-- TradingView (OANDA/TVC) or the exchange's continuous front-month future
-- (the `1!` suffix).  Do not add plain commodity names such as `COPPER` or
-- `COFFEE` as tradable symbols: those are descriptions, not market tickers.
--
-- Existing asset rows are updated in place so historical trades retain their
-- asset_id.  Duplicate legacy aliases are merely deactivated, never deleted.

DO $$
DECLARE
  commodities_category_id UUID;
BEGIN
  SELECT id
    INTO commodities_category_id
    FROM public.asset_categories
   WHERE lower(name) IN ('commodity', 'commodities')
   LIMIT 1;

  IF commodities_category_id IS NULL THEN
    RAISE NOTICE 'Commodity category not found; canonical commodity catalogue was not applied.';
    RETURN;
  END IF;

  -- Keep one historical row for each old symbol and migrate it to the market
  -- ticker.  These updates deliberately run before the upsert below.
  UPDATE public.assets
     SET symbol = 'XAUUSD', name = 'Gold / US Dollar', exchange = 'OANDA',
         base_currency = 'XAU', quote_currency = 'USD', is_active = true,
         updated_at = now()
   WHERE category_id = commodities_category_id AND symbol = 'XAUUSD';

  UPDATE public.assets
     SET symbol = 'XAGUSD', name = 'Silver / US Dollar', exchange = 'OANDA',
         base_currency = 'XAG', quote_currency = 'USD', is_active = true,
         updated_at = now()
   WHERE category_id = commodities_category_id AND symbol = 'XAGUSD';

  UPDATE public.assets
     SET symbol = 'USOIL', name = 'WTI Crude Oil', exchange = 'TVC',
         base_currency = 'WTI', quote_currency = 'USD', is_active = true,
         updated_at = now()
   WHERE category_id = commodities_category_id AND symbol = 'USOIL';

  UPDATE public.assets
     SET symbol = 'UKOIL', name = 'Brent Crude Oil', exchange = 'TVC',
         base_currency = 'BRENT', quote_currency = 'USD', is_active = true,
         updated_at = now()
   WHERE category_id = commodities_category_id AND symbol = 'UKOIL';

  UPDATE public.assets
     SET symbol = 'NG1!', name = 'Natural Gas Futures (NYMEX)', exchange = 'NYMEX',
         base_currency = 'NG', quote_currency = 'USD', is_active = true,
         updated_at = now()
   WHERE category_id = commodities_category_id AND symbol = 'NATGAS';

  UPDATE public.assets
     SET symbol = 'HG1!', name = 'Copper Futures (COMEX)', exchange = 'COMEX',
         base_currency = 'HG', quote_currency = 'USD', is_active = true,
         updated_at = now()
   WHERE category_id = commodities_category_id AND symbol = 'COPPER';

  UPDATE public.assets
     SET symbol = 'AH1!', name = 'Aluminium High Grade Futures (LME)', exchange = 'LME',
         base_currency = 'AH', quote_currency = 'USD', is_active = true,
         updated_at = now()
   WHERE category_id = commodities_category_id AND symbol = 'ALUMINUM';

  UPDATE public.assets
     SET symbol = 'NI1!', name = 'Nickel Futures (LME)', exchange = 'LME',
         base_currency = 'NI', quote_currency = 'USD', is_active = true,
         updated_at = now()
   WHERE category_id = commodities_category_id AND symbol = 'NICKEL';

  UPDATE public.assets
     SET symbol = 'ZS1!', name = 'Special High Grade Zinc Futures (LME)', exchange = 'LME',
         base_currency = 'ZS', quote_currency = 'USD', is_active = true,
         updated_at = now()
   WHERE category_id = commodities_category_id AND symbol = 'ZINC';

  UPDATE public.assets
     SET symbol = 'PB1!', name = 'Lead Futures (LME)', exchange = 'LME',
         base_currency = 'PB', quote_currency = 'USD', is_active = true,
         updated_at = now()
   WHERE category_id = commodities_category_id AND symbol = 'LEAD';

  UPDATE public.assets
     SET symbol = 'SN1!', name = 'Tin Futures (LME)', exchange = 'LME',
         base_currency = 'SN', quote_currency = 'USD', is_active = true,
         updated_at = now()
   WHERE category_id = commodities_category_id AND symbol = 'TIN';

  UPDATE public.assets
     SET symbol = 'PL1!', name = 'Platinum Futures (NYMEX)', exchange = 'NYMEX',
         base_currency = 'PL', quote_currency = 'USD', is_active = true,
         updated_at = now()
   WHERE category_id = commodities_category_id AND symbol = 'PLATINUM';

  UPDATE public.assets
     SET symbol = 'PA1!', name = 'Palladium Futures (NYMEX)', exchange = 'NYMEX',
         base_currency = 'PA', quote_currency = 'USD', is_active = true,
         updated_at = now()
   WHERE category_id = commodities_category_id AND symbol = 'PALLADIUM';

  UPDATE public.assets
     SET symbol = 'ZW1!', name = 'Wheat Futures (CBOT)', exchange = 'CBOT',
         base_currency = 'ZW', quote_currency = 'USD', is_active = true,
         updated_at = now()
   WHERE category_id = commodities_category_id AND symbol = 'WHEAT';

  UPDATE public.assets
     SET symbol = 'ZC1!', name = 'Corn Futures (CBOT)', exchange = 'CBOT',
         base_currency = 'ZC', quote_currency = 'USD', is_active = true,
         updated_at = now()
   WHERE category_id = commodities_category_id AND symbol = 'CORN';

  UPDATE public.assets
     SET symbol = 'ZS1!', name = 'Soybean Futures (CBOT)', exchange = 'CBOT',
         base_currency = 'ZS', quote_currency = 'USD', is_active = true,
         updated_at = now()
   WHERE category_id = commodities_category_id AND symbol = 'SOYBEAN';

  UPDATE public.assets
     SET symbol = 'ZR1!', name = 'Rough Rice Futures (CBOT)', exchange = 'CBOT',
         base_currency = 'ZR', quote_currency = 'USD', is_active = true,
         updated_at = now()
   WHERE category_id = commodities_category_id AND symbol = 'RICE';

  UPDATE public.assets
     SET symbol = 'KC1!', name = 'Coffee C Futures (ICEUS)', exchange = 'ICEUS',
         base_currency = 'KC', quote_currency = 'USD', is_active = true,
         updated_at = now()
   WHERE category_id = commodities_category_id AND symbol = 'COFFEE';

  UPDATE public.assets
     SET symbol = 'CC1!', name = 'Cocoa Futures (ICEUS)', exchange = 'ICEUS',
         base_currency = 'CC', quote_currency = 'USD', is_active = true,
         updated_at = now()
   WHERE category_id = commodities_category_id AND symbol = 'COCOA';

  UPDATE public.assets
     SET symbol = 'CT1!', name = 'Cotton No. 2 Futures (ICEUS)', exchange = 'ICEUS',
         base_currency = 'CT', quote_currency = 'USD', is_active = true,
         updated_at = now()
   WHERE category_id = commodities_category_id AND symbol = 'COTTON';

  UPDATE public.assets
     SET symbol = 'SB1!', name = 'Sugar No. 11 Futures (ICEUS)', exchange = 'ICEUS',
         base_currency = 'SB', quote_currency = 'USD', is_active = true,
         updated_at = now()
   WHERE category_id = commodities_category_id AND symbol = 'SUGAR';

  UPDATE public.assets
     SET symbol = 'LBR1!', name = 'Lumber Futures (CME)', exchange = 'CME',
         base_currency = 'LBR', quote_currency = 'USD', is_active = true,
         updated_at = now()
   WHERE category_id = commodities_category_id AND symbol = 'LUMBER';

  UPDATE public.assets
     SET symbol = 'OJ1!', name = 'Orange Juice Futures (ICEUS)', exchange = 'ICEUS',
         base_currency = 'OJ', quote_currency = 'USD', is_active = true,
         updated_at = now()
   WHERE category_id = commodities_category_id AND symbol = 'OJ';

  UPDATE public.assets
     SET symbol = 'LE1!', name = 'Live Cattle Futures (CME)', exchange = 'CME',
         base_currency = 'LE', quote_currency = 'USD', is_active = true,
         updated_at = now()
   WHERE category_id = commodities_category_id AND symbol = 'CATTLE';

  UPDATE public.assets
     SET symbol = 'HE1!', name = 'Lean Hogs Futures (CME)', exchange = 'CME',
         base_currency = 'HE', quote_currency = 'USD', is_active = true,
         updated_at = now()
   WHERE category_id = commodities_category_id AND symbol = 'HOGS';

  -- `ALUMINIUM` is a legacy alias of the row above.  It must
  -- not remain selectable, because each would duplicate the real instrument.
  UPDATE public.assets
     SET is_active = false, updated_at = now()
   WHERE category_id = commodities_category_id
     AND symbol IN ('ALUMINIUM', 'NGAS');

  -- Add the canonical catalogue for installations that only had the original
  -- six seed rows.  The exchange is part of the identity by design.
  INSERT INTO public.assets (symbol, name, category_id, exchange, base_currency, quote_currency, is_active)
  VALUES
    ('XAUUSD', 'Gold / US Dollar', commodities_category_id, 'OANDA', 'XAU', 'USD', true),
    ('XAGUSD', 'Silver / US Dollar', commodities_category_id, 'OANDA', 'XAG', 'USD', true),
    ('USOIL', 'WTI Crude Oil', commodities_category_id, 'TVC', 'WTI', 'USD', true),
    ('UKOIL', 'Brent Crude Oil', commodities_category_id, 'TVC', 'BRENT', 'USD', true),
    ('NG1!', 'Natural Gas Futures (NYMEX)', commodities_category_id, 'NYMEX', 'NG', 'USD', true),
    ('HG1!', 'Copper Futures (COMEX)', commodities_category_id, 'COMEX', 'HG', 'USD', true),
    ('AH1!', 'Aluminium High Grade Futures (LME)', commodities_category_id, 'LME', 'AH', 'USD', true),
    ('NI1!', 'Nickel Futures (LME)', commodities_category_id, 'LME', 'NI', 'USD', true),
    ('ZS1!', 'Special High Grade Zinc Futures (LME)', commodities_category_id, 'LME', 'ZS', 'USD', true),
    ('PB1!', 'Lead Futures (LME)', commodities_category_id, 'LME', 'PB', 'USD', true),
    ('SN1!', 'Tin Futures (LME)', commodities_category_id, 'LME', 'SN', 'USD', true),
    ('PL1!', 'Platinum Futures (NYMEX)', commodities_category_id, 'NYMEX', 'PL', 'USD', true),
    ('PA1!', 'Palladium Futures (NYMEX)', commodities_category_id, 'NYMEX', 'PA', 'USD', true),
    ('ZW1!', 'Wheat Futures (CBOT)', commodities_category_id, 'CBOT', 'ZW', 'USD', true),
    ('ZC1!', 'Corn Futures (CBOT)', commodities_category_id, 'CBOT', 'ZC', 'USD', true),
    ('ZS1!', 'Soybean Futures (CBOT)', commodities_category_id, 'CBOT', 'ZS', 'USD', true),
    ('ZR1!', 'Rough Rice Futures (CBOT)', commodities_category_id, 'CBOT', 'ZR', 'USD', true),
    ('KC1!', 'Coffee C Futures (ICEUS)', commodities_category_id, 'ICEUS', 'KC', 'USD', true),
    ('CC1!', 'Cocoa Futures (ICEUS)', commodities_category_id, 'ICEUS', 'CC', 'USD', true),
    ('CT1!', 'Cotton No. 2 Futures (ICEUS)', commodities_category_id, 'ICEUS', 'CT', 'USD', true),
    ('SB1!', 'Sugar No. 11 Futures (ICEUS)', commodities_category_id, 'ICEUS', 'SB', 'USD', true),
    ('LBR1!', 'Lumber Futures (CME)', commodities_category_id, 'CME', 'LBR', 'USD', true),
    ('OJ1!', 'Orange Juice Futures (ICEUS)', commodities_category_id, 'ICEUS', 'OJ', 'USD', true),
    ('LE1!', 'Live Cattle Futures (CME)', commodities_category_id, 'CME', 'LE', 'USD', true),
    ('HE1!', 'Lean Hogs Futures (CME)', commodities_category_id, 'CME', 'HE', 'USD', true)
  ON CONFLICT (symbol, exchange) DO UPDATE
    SET name = EXCLUDED.name,
        category_id = EXCLUDED.category_id,
        base_currency = EXCLUDED.base_currency,
        quote_currency = EXCLUDED.quote_currency,
        is_active = true,
        updated_at = now();

  -- Remove every remaining made-up commodity ticker from the member selector
  -- while retaining the rows for audit/history purposes.
  UPDATE public.assets
     SET is_active = false, updated_at = now()
   WHERE category_id = commodities_category_id
     AND (symbol, exchange) NOT IN (
       ('XAUUSD', 'OANDA'), ('XAGUSD', 'OANDA'),
       ('USOIL', 'TVC'), ('UKOIL', 'TVC'), ('NG1!', 'NYMEX'),
       ('HG1!', 'COMEX'), ('AH1!', 'LME'), ('NI1!', 'LME'), ('ZS1!', 'LME'), ('PB1!', 'LME'), ('SN1!', 'LME'),
       ('PL1!', 'NYMEX'), ('PA1!', 'NYMEX'),
       ('ZW1!', 'CBOT'), ('ZC1!', 'CBOT'), ('ZS1!', 'CBOT'), ('ZR1!', 'CBOT'),
       ('KC1!', 'ICEUS'), ('CC1!', 'ICEUS'), ('CT1!', 'ICEUS'), ('SB1!', 'ICEUS'),
       ('LBR1!', 'CME'), ('OJ1!', 'ICEUS'), ('LE1!', 'CME'), ('HE1!', 'CME')
     );
END $$;
