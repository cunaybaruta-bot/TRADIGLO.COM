-- ─── Copy Trade 20% Platform Fee ─────────────────────────────────────────────
-- Adds platform_fee_percent and net_profit_loss columns to copy_trade_results.
-- A trigger automatically deducts 20% from the gross profit when status = 'won',
-- credits only 80% (net profit) to the member's real wallet, and records the fee.

-- Step 1: Add fee columns to copy_trade_results
ALTER TABLE public.copy_trade_results
  ADD COLUMN IF NOT EXISTS platform_fee_percent NUMERIC DEFAULT 20,
  ADD COLUMN IF NOT EXISTS platform_fee_amount  NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS net_profit_loss      NUMERIC DEFAULT 0;

-- Step 2: Trigger function — fires AFTER INSERT OR UPDATE on copy_trade_results
-- When a result transitions to 'won', it:
--   1. Calculates 20% fee on gross profit_loss
--   2. Stores fee amount and net profit in the result row
--   3. Credits only the net profit (80%) to the member's real wallet
CREATE OR REPLACE FUNCTION public.apply_copy_trade_platform_fee()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
DECLARE
  v_fee_pct      NUMERIC := 20;
  v_fee_amount   NUMERIC;
  v_net_profit   NUMERIC;
BEGIN
  -- Only process when status becomes 'won' and profit_loss > 0
  IF NEW.status = 'won' AND NEW.profit_loss > 0 THEN
    -- Avoid double-processing: skip if fee already applied
    IF OLD IS NOT NULL AND OLD.status = 'won' THEN
      RETURN NEW;
    END IF;

    v_fee_amount := ROUND(NEW.profit_loss * v_fee_pct / 100, 8);
    v_net_profit := NEW.profit_loss - v_fee_amount;

    -- Update the result row with fee details
    NEW.platform_fee_percent := v_fee_pct;
    NEW.platform_fee_amount  := v_fee_amount;
    NEW.net_profit_loss      := v_net_profit;

    -- Credit net profit to member's real wallet (is_demo = false)
    UPDATE public.wallets
    SET
      balance    = balance + v_net_profit,
      updated_at = now()
    WHERE user_id = NEW.user_id
      AND is_demo = false;

  ELSIF NEW.status = 'lost' THEN
    -- On loss: net_profit_loss mirrors profit_loss (negative), no fee
    NEW.platform_fee_percent := v_fee_pct;
    NEW.platform_fee_amount  := 0;
    NEW.net_profit_loss      := NEW.profit_loss;

  ELSIF NEW.status = 'refunded' THEN
    -- On refund: no fee, net = 0
    NEW.platform_fee_percent := v_fee_pct;
    NEW.platform_fee_amount  := 0;
    NEW.net_profit_loss      := 0;
  END IF;

  RETURN NEW;
END;
$func$;

-- Step 3: Attach trigger (BEFORE so NEW can be modified in-place)
DROP TRIGGER IF EXISTS trg_copy_trade_platform_fee ON public.copy_trade_results;
CREATE TRIGGER trg_copy_trade_platform_fee
  BEFORE INSERT OR UPDATE OF status
  ON public.copy_trade_results
  FOR EACH ROW
  EXECUTE FUNCTION public.apply_copy_trade_platform_fee();

-- Step 4: Index for quick lookup
CREATE INDEX IF NOT EXISTS idx_copy_trade_results_status
  ON public.copy_trade_results(status);
