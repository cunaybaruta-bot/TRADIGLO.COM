-- Add unique constraint on asset_id in market_prices for upsert support
ALTER TABLE public.market_prices
  DROP CONSTRAINT IF EXISTS market_prices_asset_id_unique;

ALTER TABLE public.market_prices
  ADD CONSTRAINT market_prices_asset_id_unique UNIQUE (asset_id);
