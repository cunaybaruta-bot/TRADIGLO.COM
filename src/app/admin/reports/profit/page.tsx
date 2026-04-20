'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';


export default function PlatformProfitPage() {
  const [stats, setStats] = useState({ totalVolume: 0, totalPayout: 0, profit: 0, winCount: 0, lossCount: 0, totalTrades: 0 });
  const [loading, setLoading] = useState(true);

  const fetchProfit = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.from('trades').select('amount, payout, status').in('status', ['won', 'lost']);
    if (data) {
      let totalVolume = 0, totalPayout = 0, winCount = 0, lossCount = 0;
      data.forEach((t: any) => {
        totalVolume += Number(t.amount);
        if (t.status === 'won') { totalPayout += Number(t.payout || 0); winCount++; }
        if (t.status === 'lost') lossCount++;
      });
      setStats({ totalVolume, totalPayout, profit: totalVolume - totalPayout, winCount, lossCount, totalTrades: data.length });
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchProfit(); }, [fetchProfit]);

  const margin = stats.totalVolume > 0 ? (stats.profit / stats.totalVolume) * 100 : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Platform Profit</h1>
        <p className="text-gray-400 text-sm mt-1">Revenue and profit analysis for the platform</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Calculating profit...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#0f1629] border border-white/10 rounded-xl p-4">
              <div className="text-gray-400 text-sm">Total Volume</div>
              <div className="text-2xl font-bold text-white mt-1">${stats.totalVolume.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
            </div>
            <div className="bg-[#0f1629] border border-white/10 rounded-xl p-4">
              <div className="text-gray-400 text-sm">Total Payout</div>
              <div className="text-2xl font-bold text-red-400 mt-1">${stats.totalPayout.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
            </div>
            <div className="bg-[#0f1629] border border-white/10 rounded-xl p-4">
              <div className="text-gray-400 text-sm">Net Profit</div>
              <div className={`text-2xl font-bold mt-1 ${stats.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                ${stats.profit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div className="bg-[#0f1629] border border-white/10 rounded-xl p-4">
              <div className="text-gray-400 text-sm">Profit Margin</div>
              <div className={`text-2xl font-bold mt-1 ${margin >= 0 ? 'text-green-400' : 'text-red-400'}`}>{margin.toFixed(1)}%</div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-[#0f1629] border border-white/10 rounded-xl p-4">
              <div className="text-gray-400 text-sm">Total Trades</div>
              <div className="text-xl font-bold text-white mt-1">{stats.totalTrades.toLocaleString()}</div>
            </div>
            <div className="bg-[#0f1629] border border-white/10 rounded-xl p-4">
              <div className="text-gray-400 text-sm">User Wins (Platform Loss)</div>
              <div className="text-xl font-bold text-red-400 mt-1">{stats.winCount.toLocaleString()}</div>
            </div>
            <div className="bg-[#0f1629] border border-white/10 rounded-xl p-4">
              <div className="text-gray-400 text-sm">User Losses (Platform Profit)</div>
              <div className="text-xl font-bold text-green-400 mt-1">{stats.lossCount.toLocaleString()}</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
