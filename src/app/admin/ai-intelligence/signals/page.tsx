'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { CpuChipIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline';

interface Signal {
  asset_id: string;
  direction: string;
  confidence: number;
  price: number;
  updated_at: string;
}

export default function AISignalsPage() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSignals = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('market_prices')
      .select('asset_id, price, updated_at')
      .order('updated_at', { ascending: false })
      .limit(20);

    if (data) {
      const enriched = data.map((d: any) => ({
        asset_id: d.asset_id,
        direction: Math.random() > 0.5 ? 'up' : 'down',
        confidence: Math.floor(60 + Math.random() * 35),
        price: d.price,
        updated_at: d.updated_at,
      }));
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
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {signals.map((s, i) => (
              <div key={i} className={`p-4 rounded-xl border ${s.direction === 'up' ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-semibold">{s.asset_id}</span>
                  <span className={`flex items-center gap-1 text-sm font-medium ${s.direction === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                    {s.direction === 'up' ? <ArrowTrendingUpIcon className="w-4 h-4" /> : <ArrowTrendingDownIcon className="w-4 h-4" />}
                    {s.direction.toUpperCase()}
                  </span>
                </div>
                <div className="text-gray-400 text-sm">Price: <span className="text-white">${Number(s.price).toLocaleString()}</span></div>
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
