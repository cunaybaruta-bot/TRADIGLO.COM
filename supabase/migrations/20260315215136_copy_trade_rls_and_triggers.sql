-- ─── RLS for copy_trade_providers ────────────────────────────────────────────
ALTER TABLE public.copy_trade_providers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "copy_trade_providers_public_read" ON public.copy_trade_providers;
CREATE POLICY "copy_trade_providers_public_read"
ON public.copy_trade_providers
FOR SELECT
TO authenticated
USING (true);

-- ─── RLS for copy_trade_followers ────────────────────────────────────────────
ALTER TABLE public.copy_trade_followers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "copy_trade_followers_user_manage" ON public.copy_trade_followers;
CREATE POLICY "copy_trade_followers_user_manage"
ON public.copy_trade_followers
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "copy_trade_followers_admin_read" ON public.copy_trade_followers;
CREATE POLICY "copy_trade_followers_admin_read"
ON public.copy_trade_followers
FOR SELECT
TO authenticated
USING (true);

-- ─── RLS for copy_trades ──────────────────────────────────────────────────────
ALTER TABLE public.copy_trades ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "copy_trades_authenticated_read" ON public.copy_trades;
CREATE POLICY "copy_trades_authenticated_read"
ON public.copy_trades
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "copy_trades_authenticated_write" ON public.copy_trades;
CREATE POLICY "copy_trades_authenticated_write"
ON public.copy_trades
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- ─── RLS for copy_trade_results ──────────────────────────────────────────────
ALTER TABLE public.copy_trade_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "copy_trade_results_user_read" ON public.copy_trade_results;
CREATE POLICY "copy_trade_results_user_read"
ON public.copy_trade_results
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "copy_trade_results_admin_all" ON public.copy_trade_results;
CREATE POLICY "copy_trade_results_admin_all"
ON public.copy_trade_results
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- ─── Notification trigger for follow/stop follow ──────────────────────────────
CREATE OR REPLACE FUNCTION public.notify_admin_copy_trade()
RETURNS TRIGGER AS $func$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.admin_notifications (type, title, message, user_id, is_read)
    VALUES (
      'copy_trade',
      'New Copy Trade Follower',
      'A user has started following Tradiglo Copy Trade',
      NEW.user_id,
      false
    );
  ELSIF TG_OP = 'UPDATE' AND NEW.is_active = false AND OLD.is_active = true THEN
    INSERT INTO public.admin_notifications (type, title, message, user_id, is_read)
    VALUES (
      'copy_trade',
      'User Stopped Copy Trade',
      'A user has stopped following Tradiglo Copy Trade',
      NEW.user_id,
      false
    );
  END IF;
  RETURN NEW;
END;
$func$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_copy_trade_follow ON public.copy_trade_followers;
CREATE TRIGGER on_copy_trade_follow
  AFTER INSERT OR UPDATE ON public.copy_trade_followers
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admin_copy_trade();

-- ─── Indexes ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_copy_trade_followers_user_id ON public.copy_trade_followers(user_id);
CREATE INDEX IF NOT EXISTS idx_copy_trade_followers_provider_id ON public.copy_trade_followers(provider_id);
CREATE INDEX IF NOT EXISTS idx_copy_trade_followers_is_active ON public.copy_trade_followers(is_active);
CREATE INDEX IF NOT EXISTS idx_copy_trade_results_user_id ON public.copy_trade_results(user_id);
CREATE INDEX IF NOT EXISTS idx_copy_trade_results_copy_trade_id ON public.copy_trade_results(copy_trade_id);
