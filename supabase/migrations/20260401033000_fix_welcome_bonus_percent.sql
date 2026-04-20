-- Fix welcome bonus percent: should be 100% (not 25%)
UPDATE public.bonus_settings
SET bonus_percent = 100,
    updated_at = NOW()
WHERE applies_to = 'first_deposit'
  AND bonus_percent != 100;
