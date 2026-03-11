'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { CubeIcon } from '@heroicons/react/24/outline';

interface AssetPerf {
  asset_id: string;
  total_trades: number;
  won: number;
  lost: number;
  volume: number;
  win_rate: number;
}

export default function AssetPerformancePage() {
  const [assets, setAssets] = useState<AssetPerf[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPerformance = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.from('trades').select('asset_id, status, amount');
    if (data) {
      const map: Record<string, AssetPerf> = {};
      data.forEach((t: any) => {
        if (!map[t.asset_id]) map[t.asset_id] = { asset_id: t.asset_id, total_trades: 0, won: 0, lost: 0, volume: 0, win_rate: 0 };
        map[t.asset_id].total_trades++;
        map[t.asset_id].volume += Number(t.amount);
        if (t.status === 'won') map[t.asset_id].won++;
        if (t.status === 'lost') map[t.asset_id].lost++;
      });
      const arr = Object.values(map).map((a) => ({ ...a, win_rate: a.total_trades > 0 ? (a.won / a.total_trades) * 100 : 0 })).sort((a, b) => b.volume - a.volume);
      setAssets(arr);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchPerformance(); }, [fetchPerformance]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Asset Performance</h1>
        <p className="text-gray-400 text-sm mt-1">Trading performance metrics per asset</p>
      </div>

      <div className="bg-[#0f1629] border border-white/10 rounded-xl p-4">
        <h2 className="text-white font-semibold mb-4 flex items-center gap-2"><CubeIcon className="w-5 h-5 text-blue-400" /> Performance by Asset</h2>
        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading performance data...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-gray-400 text-left">
                  <th className="pb-3 font-medium">Asset</th>
                  <th className="pb-3 font-medium">Total Trades</th>
                  <th className="pb-3 font-medium">Won</th>
                  <th className="pb-3 font-medium">Lost</th>
                  <th className="pb-3 font-medium">Win Rate</th>
                  <th className="pb-3 font-medium">Volume</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {assets.map((a) => (
                  <tr key={a.asset_id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 text-white font-medium">{a.asset_id}</td>
                    <td className="py-3 text-gray-300">{a.total_trades}</td>
                    <td className="py-3 text-green-400">{a.won}</td>
                    <td className="py-3 text-red-400">{a.lost}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 bg-white/10 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${a.win_rate >= 50 ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: `${a.win_rate}%` }} />
                        </div>
                        <span className={a.win_rate >= 50 ? 'text-green-400' : 'text-red-400'}>{a.win_rate.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="py-3 text-yellow-400">${a.volume.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {assets.length === 0 && <div className="text-center py-8 text-gray-500">No performance data available</div>}
          </div>
        )}
      </div>
    </div>
  );
}
