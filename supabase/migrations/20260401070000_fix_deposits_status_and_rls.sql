-- Fix deposits status constraint to include 'approved' and 'rejected'
-- The admin panel uses these statuses but the original constraint only had pending/completed/failed/cancelled

-- Drop existing status constraint
ALTER TABLE public.deposits DROP CONSTRAINT IF EXISTS deposits_status_check;

-- Add new constraint that includes approved and rejected
ALTER TABLE public.deposits
  ADD CONSTRAINT deposits_status_check
  CHECK (status = ANY (ARRAY[
    'pending'::text,
    'approved'::text,
    'rejected'::text,
    'completed'::text,
    'failed'::text,
    'cancelled'::text
  ]));

-- Ensure admin can update deposits (approve/reject)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'deposits' AND policyname = 'deposits_admin_all'
  ) THEN
    CREATE POLICY deposits_admin_all ON public.deposits
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.admin_users WHERE id = auth.uid()
        )
        OR
        EXISTS (
          SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.admin_users WHERE id = auth.uid()
        )
        OR
        EXISTS (
          SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
        )
      );
  END IF;
END $$;

-- Ensure INSERT policy exists for authenticated users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'deposits' AND policyname = 'deposits_insert_own'
  ) THEN
    CREATE POLICY deposits_insert_own ON public.deposits
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Ensure SELECT policy exists for authenticated users (own deposits)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'deposits' AND policyname = 'deposits_select_own'
  ) THEN
    CREATE POLICY deposits_select_own ON public.deposits
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

-- Enable realtime on deposits table
ALTER PUBLICATION supabase_realtime ADD TABLE public.deposits;
