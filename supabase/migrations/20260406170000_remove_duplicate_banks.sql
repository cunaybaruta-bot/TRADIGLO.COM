-- Migration: Remove duplicate bank entries
-- Earlier migration (20260406143000) added banks with short names for Kuwait & Oman.
-- Later migration (20260406162000) added the same banks with full official names.
-- This migration removes the shorter/duplicate versions, keeping only the full-name entries.

-- ============================================================
-- KUWAIT - remove short-name duplicates
-- ============================================================
DELETE FROM public.payment_methods
WHERE country = 'Kuwait'
  AND type = 'bank'
  AND name IN (
    'National Bank of Kuwait',
    'Kuwait Finance House',
    'Gulf Bank',
    'Commercial Bank of Kuwait',
    'Al Ahli Bank of Kuwait',
    'Burgan Bank',
    'Boubyan Bank',
    'Warba Bank'
  );

-- ============================================================
-- OMAN - remove short-name duplicates
-- ============================================================
DELETE FROM public.payment_methods
WHERE country = 'Oman'
  AND type = 'bank'
  AND name IN (
    'Bank Muscat',
    'National Bank of Oman',
    'Bank Dhofar',
    'Sohar International',
    'Oman Arab Bank',
    'Ahli Bank',
    'Bank Nizwa',
    'Alizz Islamic Bank'
  );
