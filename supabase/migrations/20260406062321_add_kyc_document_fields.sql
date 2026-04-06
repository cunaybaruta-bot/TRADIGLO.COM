-- Add KYC document storage fields to users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS kyc_document_url TEXT,
ADD COLUMN IF NOT EXISTS kyc_document_type TEXT,
ADD COLUMN IF NOT EXISTS kyc_notes TEXT,
ADD COLUMN IF NOT EXISTS kyc_submitted_at TIMESTAMPTZ;
