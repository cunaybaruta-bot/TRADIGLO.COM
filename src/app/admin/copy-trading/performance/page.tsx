'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { UserGroupIcon, ChartBarIcon } from '@heroicons/react/24/outline';

interface StrategyPerf {
  id: string;
  trader_id: string;
  name: string;
  win_rate: number;
  total_trades: number;
  followers_count: number;
  profit_share: number;
  status: string;
  users?: { email: string };
}

export default function CopyTradingPerformancePage() {
  const [strategies, setStrategies] = useState<StrategyPerf[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStrategies = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('copy_trading_strategies')
      .select('id, trader_id, name, win_rate, total_trades, followers_count, profit_share, status, users(email)')
      .order('win_rate', { ascending: false });
    setStrategies((data as any) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchStrategies(); }, [fetchStrategies]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Strategy Performance</h1>
        <p className="text-gray-400 text-sm mt-1">Performance metrics for all copy trading strategies</p>
      </div>

      <div className="bg-[#0f1629] border border-white/10 rounded-xl p-4">
        <h2 className="text-white font-semibold mb-4 flex items-center gap-2"><ChartBarIcon className="w-5 h-5 text-blue-400" /> All Strategies</h2>
        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading strategies...</div>
        ) : strategies.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <UserGroupIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No copy trading strategies found</p>
            <p className="text-xs mt-1">Strategies will appear here once traders create them</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-gray-400 text-left">
                  <th className="pb-3 font-medium">Strategy</th>
                  <th className="pb-3 font-medium">Trader</th>
                  <th className="pb-3 font-medium">Win Rate</th>
                  <th className="pb-3 font-medium">Total Trades</th>
                  <th className="pb-3 font-medium">Followers</th>
                  <th className="pb-3 font-medium">Profit Share</th>
                  <th className="pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {strategies.map((s) => (
                  <tr key={s.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 text-white font-medium">{s.name}</td>
                    <td className="py-3 text-gray-300">{(s.users as any)?.email || s.trader_id?.slice(0, 8)}</td>
                    <td className="py-3 text-green-400">{s.win_rate?.toFixed(1)}%</td>
                    <td className="py-3 text-gray-300">{s.total_trades}</td>
                    <td className="py-3 text-blue-400">{s.followers_count}</td>
                    <td className="py-3 text-yellow-400">{s.profit_share}%</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${s.status === 'active' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}>
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
