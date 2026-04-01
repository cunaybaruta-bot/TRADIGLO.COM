'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { UserGroupIcon, ChartBarIcon } from '@heroicons/react/24/outline';

interface ProviderPerf {
  id: string;
  name: string;
  win_rate: number;
  total_followers: number;
  active_followers: number;
  total_trades: number;
  won_trades: number;
  total_profit: number;
  is_active: boolean;
}

export default function CopyTradingPerformancePage() {
  const [providers, setProviders] = useState<ProviderPerf[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPerformance = useCallback(async () => {
    const supabase = createClient();

    const [providersRes, followersRes, tradesRes, resultsRes] = await Promise.all([
      supabase.from('copy_trade_providers').select('id, name, win_rate, is_active'),
      supabase.from('copy_trade_followers').select('provider_id, is_active'),
      supabase.from('copy_trades').select('id, status'),
      supabase.from('copy_trade_results').select('profit_loss, status'),
    ]);

    const providerList = providersRes.data || [];
    const followerList = followersRes.data || [];
    const tradeList = tradesRes.data || [];
    const resultList = resultsRes.data || [];

    const totalTrades = tradeList.length;
    const wonTrades = tradeList.filter((t: any) => t.status === 'won').length;
    const totalProfit = resultList.filter((r: any) => r.status === 'won').reduce((s: number, r: any) => s + Number(r.profit_loss), 0);

    const enriched: ProviderPerf[] = providerList.map((p: any) => {
      const pFollowers = followerList.filter((f: any) => f.provider_id === p.id);
      return {
        id: p.id,
        name: p.name,
        win_rate: Number(p.win_rate) || 0,
        total_followers: pFollowers.length,
        active_followers: pFollowers.filter((f: any) => f.is_active).length,
        total_trades: totalTrades,
        won_trades: wonTrades,
        total_profit: totalProfit,
        is_active: p.is_active,
      };
    });

    setProviders(enriched);
    setLoading(false);
  }, []);

  useEffect(() => { fetchPerformance(); }, [fetchPerformance]);

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
        ) : providers.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <UserGroupIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No copy trading strategies found</p>
            <p className="text-xs mt-1">Strategies will appear here once providers are configured</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-gray-400 text-left">
                  <th className="pb-3 font-medium">Strategy</th>
                  <th className="pb-3 font-medium">Win Rate</th>
                  <th className="pb-3 font-medium">Total Trades</th>
                  <th className="pb-3 font-medium">Won</th>
                  <th className="pb-3 font-medium">Total Followers</th>
                  <th className="pb-3 font-medium">Active Followers</th>
                  <th className="pb-3 font-medium">Total Profit</th>
                  <th className="pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {providers.map((p) => (
                  <tr key={p.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 text-white font-medium">{p.name}</td>
                    <td className="py-3 text-green-400">{p.win_rate.toFixed(1)}%</td>
                    <td className="py-3 text-gray-300">{p.total_trades}</td>
                    <td className="py-3 text-green-400">{p.won_trades}</td>
                    <td className="py-3 text-blue-400">{p.total_followers}</td>
                    <td className="py-3 text-blue-300">{p.active_followers}</td>
                    <td className="py-3 text-yellow-400">${p.total_profit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${p.is_active ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}>
                        {p.is_active ? 'Active' : 'Inactive'}
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
