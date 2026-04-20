-- Add payment_method_id and proof_url to deposits table
ALTER TABLE public.deposits
  ADD COLUMN IF NOT EXISTS payment_method_id UUID REFERENCES public.payment_methods(id),
  ADD COLUMN IF NOT EXISTS proof_url TEXT;

-- Enable RLS on payment_methods so members can read active ones
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

-- Allow anyone authenticated to read active payment methods
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'payment_methods' AND policyname = 'payment_methods_read_active'
  ) THEN
    CREATE POLICY payment_methods_read_active ON public.payment_methods
      FOR SELECT USING (is_active = true);
  END IF;
END $$;

-- Allow authenticated users to insert deposits
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'deposits' AND policyname = 'deposits_insert_own'
  ) THEN
    CREATE POLICY deposits_insert_own ON public.deposits
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Allow authenticated users to read own deposits
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'deposits' AND policyname = 'deposits_select_own'
  ) THEN
    CREATE POLICY deposits_select_own ON public.deposits
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;
