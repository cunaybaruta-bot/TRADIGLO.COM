-- Migration: demo_trade_limits
-- Tracks demo trade usage per IP address to enforce 5-trade limit across browsers/sessions

CREATE TABLE IF NOT EXISTS public.demo_trade_limits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address TEXT NOT NULL UNIQUE,
  trade_count INTEGER DEFAULT 0,
  last_trade_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookup by IP
CREATE INDEX IF NOT EXISTS idx_demo_trade_limits_ip ON public.demo_trade_limits(ip_address);

-- Row Level Security
ALTER TABLE public.demo_trade_limits ENABLE ROW LEVEL SECURITY;

-- Allow all operations (including anonymous) for IP-based tracking
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'demo_trade_limits'
    AND policyname = 'Allow demo trade tracking'
  ) THEN
    CREATE POLICY "Allow demo trade tracking" ON public.demo_trade_limits
      FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
