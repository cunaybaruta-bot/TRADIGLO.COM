-- Fix market_prices upsert: asset_id must be NOT NULL for ON CONFLICT to work
-- The unique constraint exists but PostgreSQL ignores nullable columns in ON CONFLICT

-- Step 1: Remove any rows with NULL asset_id (safety cleanup)
DELETE FROM public.market_prices WHERE asset_id IS NULL;

-- Step 2: Alter asset_id to NOT NULL
ALTER TABLE public.market_prices
  ALTER COLUMN asset_id SET NOT NULL;

-- Step 3: Ensure the unique constraint exists (idempotent)
ALTER TABLE public.market_prices
  DROP CONSTRAINT IF EXISTS market_prices_asset_id_unique;

ALTER TABLE public.market_prices
  ADD CONSTRAINT market_prices_asset_id_unique UNIQUE (asset_id);
