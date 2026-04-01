-- Fix: Add status column to users table for suspension tracking
-- Root cause: users.role has CHECK constraint (role IN ('user','admin'))
-- Setting role='suspended' violates the constraint and silently fails.
-- Solution: Add a separate status column for active/suspended state.

-- Add status column if it doesn't exist
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended'));

-- Backfill: any existing rows get 'active' status (already handled by DEFAULT)
UPDATE public.users SET status = 'active' WHERE status IS NULL;
