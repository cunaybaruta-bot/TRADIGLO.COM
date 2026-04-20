-- ============================================================
-- Fix: Allow server-side price engine (anon key) to upsert market_prices
-- The price engine runs on the server using NEXT_PUBLIC_SUPABASE_ANON_KEY
-- and needs INSERT + UPDATE access to market_prices.
-- market_prices is public market data (not user-owned), so this is safe.
-- ============================================================

-- Allow anon role to insert new market price records
DROP POLICY IF EXISTS "anon_insert_market_prices" ON public.market_prices;
CREATE POLICY "anon_insert_market_prices"
ON public.market_prices
FOR INSERT
TO anon
WITH CHECK (true);

-- Allow anon role to update existing market price records
DROP POLICY IF EXISTS "anon_update_market_prices" ON public.market_prices;
CREATE POLICY "anon_update_market_prices"
ON public.market_prices
FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);
