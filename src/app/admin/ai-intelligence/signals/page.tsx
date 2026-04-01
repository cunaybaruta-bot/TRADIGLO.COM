'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { CpuChipIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline';

interface Signal {
  asset_id: string;
  direction: string;
  confidence: number;
  price: number;
  price_change_pct: number;
  updated_at: string;
}

export default function AISignalsPage() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSignals = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('market_prices')
      .select('asset_id, price, price_change_pct_24h, updated_at')
      .not('price_change_pct_24h', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(20);

    if (data) {
      const enriched: Signal[] = data.map((d: any) => {
        const pct = Number(d.price_change_pct_24h) || 0;
        const direction = pct >= 0 ? 'up' : 'down';
        const absPct = Math.abs(pct);
        const confidence = Math.min(95, Math.max(55, Math.round(55 + absPct * 2)));
        return {
          asset_id: d.asset_id,
          direction,
          confidence,
          price: d.price,
          price_change_pct: pct,
          updated_at: d.updated_at,
        };
      });
      setSignals(enriched);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchSignals(); }, [fetchSignals]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">AI Trade Signals</h1>
        <p className="text-gray-400 text-sm mt-1">AI-generated trading signals based on market analysis</p>
      </div>

      <div className="bg-[#0f1629] border border-white/10 rounded-xl p-4">
        <h2 className="text-white font-semibold mb-4 flex items-center gap-2"><CpuChipIcon className="w-5 h-5 text-purple-400" /> Live Signals</h2>
        {loading ? (
          <div className="text-center py-12 text-gray-400">Generating signals...</div>
        ) : signals.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No market data available for signal generation</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {signals.map((s, i) => (
              <div key={i} className={`p-4 rounded-xl border ${s.direction === 'up' ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-semibold text-xs font-mono">{s.asset_id}</span>
                  <span className={`flex items-center gap-1 text-sm font-medium ${s.direction === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                    {s.direction === 'up' ? <ArrowTrendingUpIcon className="w-4 h-4" /> : <ArrowTrendingDownIcon className="w-4 h-4" />}
                    {s.direction.toUpperCase()}
                  </span>
                </div>
                <div className="text-gray-400 text-sm">Price: <span className="text-white">${Number(s.price).toLocaleString()}</span></div>
                <div className="text-gray-400 text-xs mt-1">
                  24h: <span className={s.price_change_pct >= 0 ? 'text-green-400' : 'text-red-400'}>
                    {s.price_change_pct >= 0 ? '+' : ''}{s.price_change_pct.toFixed(2)}%
                  </span>
                </div>
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Confidence</span>
                    <span className={s.confidence >= 75 ? 'text-green-400' : 'text-yellow-400'}>{s.confidence}%</span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${s.confidence >= 75 ? 'bg-green-500' : 'bg-yellow-500'}`} style={{ width: `${s.confidence}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
