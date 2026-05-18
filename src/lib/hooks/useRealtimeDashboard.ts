'use client';

import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LivePrice {
  assetId: string;
  price: number;
  priceChangePct24h: number;
  high24h: number | null;
  low24h: number | null;
  volume24h: number | null;
  timestamp: string;
}

export interface LiveWallet {
  demoBalance: number;
  realBalance: number;
}

interface UseRealtimeDashboardOptions {
  /** Authenticated user ID — required for wallet subscription */
  userId: string | null;
  /** Called whenever any market_prices row is updated */
  onPriceUpdate?: (price: LivePrice) => void;
  /** Called whenever the user's wallet balance changes */
  onWalletUpdate?: (wallet: LiveWallet) => void;
  /** Channel name prefix — use unique names per page to avoid conflicts */
  channelPrefix?: string;
}

/**
 * useRealtimeDashboard
 *
 * Subscribes to Supabase real-time changes on:
 *   - public.market_prices  → live asset price streaming
 *   - public.wallets        → live portfolio balance updates
 *
 * Usage:
 *   useRealtimeDashboard({
 *     userId,
 *     onPriceUpdate: (p) => setPrices(prev => ({ ...prev, [p.assetId]: p })),
 *     onWalletUpdate: (w) => setWallet(w),
 *   });
 */
export function useRealtimeDashboard({
  userId,
  onPriceUpdate,
  onWalletUpdate,
  channelPrefix = 'rt',
}: UseRealtimeDashboardOptions) {
  const supabase = createClient();

  // Keep stable refs so channel callbacks always call the latest handler
  const onPriceUpdateRef = useRef(onPriceUpdate);
  const onWalletUpdateRef = useRef(onWalletUpdate);

  useEffect(() => { onPriceUpdateRef.current = onPriceUpdate; }, [onPriceUpdate]);
  useEffect(() => { onWalletUpdateRef.current = onWalletUpdate; }, [onWalletUpdate]);

  // ── market_prices subscription ──────────────────────────────────────────────
  useEffect(() => {
    if (!onPriceUpdateRef.current) return;

    const channel = supabase
      .channel(`${channelPrefix}-market-prices`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'market_prices' },
        (payload: any) => {
          const row = payload.new;
          if (!row?.asset_id || row?.price == null) return;
          onPriceUpdateRef.current?.({
            assetId: row.asset_id as string,
            price: Number(row.price),
            priceChangePct24h: Number(row.price_change_pct_24h ?? 0),
            high24h: row.high_24h != null ? Number(row.high_24h) : null,
            low24h: row.low_24h != null ? Number(row.low_24h) : null,
            volume24h: row.volume_24h != null ? Number(row.volume_24h) : null,
            timestamp: row.timestamp ?? new Date().toISOString(),
          });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [channelPrefix]);

  // ── wallets subscription ────────────────────────────────────────────────────
  useEffect(() => {
    if (!userId || !onWalletUpdateRef.current) return;

    const fetchWallet = async () => {
      const { data: wallets } = await supabase
        .from('wallets')
        .select('balance, is_demo')
        .eq('user_id', userId);

      if (wallets && wallets.length > 0) {
        const demoWallet = wallets.find((w: any) => w.is_demo === true);
        const realWallet = wallets.find((w: any) => w.is_demo === false);
        onWalletUpdateRef.current?.({
          demoBalance: Number(demoWallet?.balance ?? 0),
          realBalance: Number(realWallet?.balance ?? 0),
        });
      }
    };

    const channel = supabase
      .channel(`${channelPrefix}-wallets-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wallets',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          // Re-fetch both wallets on any change so we always have both balances
          fetchWallet();
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId, channelPrefix]);
}

// ─── Utility: build a price map keyed by asset_id ────────────────────────────

export type PriceMap = Record<string, LivePrice>;

/**
 * Merge a single LivePrice update into an existing PriceMap.
 * Use this as the updater function in useState:
 *   setPrices(prev => mergePriceUpdate(prev, update))
 */
export function mergePriceUpdate(prev: PriceMap, update: LivePrice): PriceMap {
  return { ...prev, [update.assetId]: update };
}
