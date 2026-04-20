'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ChartBarIcon } from '@heroicons/react/24/outline';

interface ExposureItem {
  asset_id: string;
  open_trades: number;
  total_exposure: number;
  up_count: number;
  down_count: number;
}

export default function TradeExposurePage() {
  const [exposure, setExposure] = useState<ExposureItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalExposure, setTotalExposure] = useState(0);

  const fetchExposure = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.from('trades').select('asset_id, direction, amount').eq('status', 'open');
    if (data) {
      const map: Record<string, ExposureItem> = {};
      let total = 0;
      data.forEach((t: any) => {
        if (!map[t.asset_id]) map[t.asset_id] = { asset_id: t.asset_id, open_trades: 0, total_exposure: 0, up_count: 0, down_count: 0 };
        map[t.asset_id].open_trades++;
        map[t.asset_id].total_exposure += Number(t.amount);
        total += Number(t.amount);
        if (t.direction === 'up') map[t.asset_id].up_count++;
        else map[t.asset_id].down_count++;
      });
      setExposure(Object.values(map).sort((a, b) => b.total_exposure - a.total_exposure));
      setTotalExposure(total);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchExposure(); }, [fetchExposure]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Trade Exposure</h1>
        <p className="text-gray-400 text-sm mt-1">Current open trade exposure across all assets</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-[#0f1629] border border-white/10 rounded-xl p-4">
          <div className="text-gray-400 text-sm">Total Open Exposure</div>
          <div className="text-2xl font-bold text-yellow-400 mt-1">${totalExposure.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
        </div>
        <div className="bg-[#0f1629] border border-white/10 rounded-xl p-4">
          <div className="text-gray-400 text-sm">Assets with Open Trades</div>
          <div className="text-2xl font-bold text-white mt-1">{exposure.length}</div>
        </div>
      </div>

      <div className="bg-[#0f1629] border border-white/10 rounded-xl p-4">
        <h2 className="text-white font-semibold mb-4 flex items-center gap-2"><ChartBarIcon className="w-5 h-5 text-yellow-400" /> Exposure by Asset</h2>
        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading exposure data...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-gray-400 text-left">
                  <th className="pb-3 font-medium">Asset</th>
                  <th className="pb-3 font-medium">Open Trades</th>
                  <th className="pb-3 font-medium">UP</th>
                  <th className="pb-3 font-medium">DOWN</th>
                  <th className="pb-3 font-medium">Total Exposure</th>
                  <th className="pb-3 font-medium">% of Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {exposure.map((e) => (
                  <tr key={e.asset_id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 text-white font-medium">{e.asset_id}</td>
                    <td className="py-3 text-gray-300">{e.open_trades}</td>
                    <td className="py-3 text-green-400">{e.up_count}</td>
                    <td className="py-3 text-red-400">{e.down_count}</td>
                    <td className="py-3 text-yellow-400 font-medium">${e.total_exposure.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="py-3 text-gray-300">{totalExposure > 0 ? ((e.total_exposure / totalExposure) * 100).toFixed(1) : 0}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {exposure.length === 0 && <div className="text-center py-8 text-gray-500">No open trades</div>}
          </div>
        )}
      </div>
    </div>
  );
}
