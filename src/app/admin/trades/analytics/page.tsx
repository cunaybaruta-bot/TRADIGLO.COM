'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ChartBarIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline';

interface AssetStat {
  asset_id: string;
  total: number;
  won: number;
  lost: number;
  volume: number;
}

export default function TradeAnalyticsPage() {
  const [stats, setStats] = useState<AssetStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalTrades, setTotalTrades] = useState(0);
  const [totalVolume, setTotalVolume] = useState(0);
  const [winRate, setWinRate] = useState(0);

  const fetchAnalytics = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('trades')
      .select('asset_id, status, amount');

    if (data) {
      const map: Record<string, AssetStat> = {};
      let totalWon = 0;
      let vol = 0;
      data.forEach((t: any) => {
        if (!map[t.asset_id]) map[t.asset_id] = { asset_id: t.asset_id, total: 0, won: 0, lost: 0, volume: 0 };
        map[t.asset_id].total++;
        map[t.asset_id].volume += Number(t.amount);
        vol += Number(t.amount);
        if (t.status === 'won') { map[t.asset_id].won++; totalWon++; }
        if (t.status === 'lost') map[t.asset_id].lost++;
      });
      const arr = Object.values(map).sort((a, b) => b.total - a.total);
      setStats(arr);
      setTotalTrades(data.length);
      setTotalVolume(vol);
      setWinRate(data.length > 0 ? (totalWon / data.length) * 100 : 0);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Trade Analytics</h1>
        <p className="text-gray-400 text-sm mt-1">Platform-wide trading performance breakdown</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#0f1629] border border-white/10 rounded-xl p-4">
          <div className="text-gray-400 text-sm">Total Trades</div>
          <div className="text-2xl font-bold text-white mt-1">{totalTrades.toLocaleString()}</div>
        </div>
        <div className="bg-[#0f1629] border border-white/10 rounded-xl p-4">
          <div className="text-gray-400 text-sm">Total Volume</div>
          <div className="text-2xl font-bold text-blue-400 mt-1">${totalVolume.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
        </div>
        <div className="bg-[#0f1629] border border-white/10 rounded-xl p-4">
          <div className="text-gray-400 text-sm">Platform Win Rate</div>
          <div className="text-2xl font-bold text-green-400 mt-1">{winRate.toFixed(1)}%</div>
        </div>
      </div>

      <div className="bg-[#0f1629] border border-white/10 rounded-xl p-4">
        <h2 className="text-white font-semibold mb-4 flex items-center gap-2"><ChartBarIcon className="w-5 h-5 text-blue-400" /> Performance by Asset</h2>
        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading analytics...</div>
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
                {stats.map((s) => (
                  <tr key={s.asset_id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 text-white font-medium">{s.asset_id}</td>
                    <td className="py-3 text-gray-300">{s.total}</td>
                    <td className="py-3 text-green-400 flex items-center gap-1"><ArrowTrendingUpIcon className="w-3 h-3" />{s.won}</td>
                    <td className="py-3 text-red-400">{s.lost}</td>
                    <td className="py-3">
                      <span className={`text-sm font-medium ${s.total > 0 && (s.won / s.total) >= 0.5 ? 'text-green-400' : 'text-red-400'}`}>
                        {s.total > 0 ? ((s.won / s.total) * 100).toFixed(1) : 0}%
                      </span>
                    </td>
                    <td className="py-3 text-yellow-400">${s.volume.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {stats.length === 0 && <div className="text-center py-8 text-gray-500">No analytics data</div>}
          </div>
        )}
      </div>
    </div>
  );
}
