'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { CpuChipIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon, ChartBarIcon } from '@heroicons/react/24/outline';

interface AssetSignal {
  symbol: string;
  name: string;
  current_price: number;
  signal: 'BUY' | 'SELL' | 'NEUTRAL';
  confidence: number;
  win_rate: number;
  total_trades: number;
}

export default function AIIntelligencePage() {
  const [signals, setSignals] = useState<AssetSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [overallWinRate, setOverallWinRate] = useState(0);
  const [totalAnalyzed, setTotalAnalyzed] = useState(0);

  const fetchData = useCallback(async () => {
    const supabase = createClient();
    const [{ data: assets }, { data: trades }, { data: prices }] = await Promise.all([
      supabase.from('assets').select('id, symbol, name').eq('is_active', true).limit(20),
      supabase.from('trades').select('asset_id, result, order_type, amount').not('result', 'is', null).limit(1000),
      supabase.from('market_prices').select('asset_id, price').order('updated_at', { ascending: false }),
    ]);

    if (assets && trades) {
      const priceMap = new Map(prices?.map((p) => [p.asset_id, p.price]) || []);
      const tradeMap = new Map<string, { wins: number; losses: number; buys: number; sells: number }>();

      trades.forEach((t) => {
        const existing = tradeMap.get(t.asset_id) || { wins: 0, losses: 0, buys: 0, sells: 0 };
        if (t.result === 'win') existing.wins++;
        else existing.losses++;
        if (t.order_type === 'buy') existing.buys++;
        else existing.sells++;
        tradeMap.set(t.asset_id, existing);
      });

      const signalList: AssetSignal[] = assets.map((a) => {
        const data = tradeMap.get(a.id) || { wins: 0, losses: 0, buys: 0, sells: 0 };
        const total = data.wins + data.losses;
        const winRate = total > 0 ? Math.round((data.wins / total) * 100) : 50;
        const signal: 'BUY' | 'SELL' | 'NEUTRAL' = data.buys > data.sells ? 'BUY' : data.sells > data.buys ? 'SELL' : 'NEUTRAL';
        const confidence = total > 0 ? Math.min(95, 50 + Math.round((Math.abs(data.buys - data.sells) / Math.max(1, total)) * 50)) : 50;

        return {
          symbol: a.symbol,
          name: a.name,
          current_price: Number(priceMap.get(a.id) || 0),
          signal,
          confidence,
          win_rate: winRate,
          total_trades: total,
        };
      });

      setSignals(signalList);
      const totalTrades = trades.length;
      const totalWins = trades.filter((t) => t.result === 'win').length;
      setOverallWinRate(totalTrades > 0 ? Math.round((totalWins / totalTrades) * 100) : 0);
      setTotalAnalyzed(totalTrades);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-white text-xl font-bold">AI Trade Intelligence</h2>
        <p className="text-slate-400 text-sm mt-1">Market analysis and AI trading signals</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#1e293b] rounded-xl p-5 border border-purple-400/20">
          <div className="flex items-center gap-2 mb-2">
            <CpuChipIcon className="w-5 h-5 text-purple-400" />
            <span className="text-slate-400 text-xs">AI Engine Status</span>
          </div>
          <div className="text-green-400 text-lg font-bold">ACTIVE</div>
          <div className="text-slate-500 text-xs mt-1">Real-time analysis running</div>
        </div>
        <div className="bg-[#1e293b] rounded-xl p-5 border border-blue-400/20">
          <div className="flex items-center gap-2 mb-2">
            <ChartBarIcon className="w-5 h-5 text-blue-400" />
            <span className="text-slate-400 text-xs">Overall Win Rate</span>
          </div>
          <div className={`text-2xl font-bold ${overallWinRate >= 50 ? 'text-green-400' : 'text-red-400'}`}>{overallWinRate}%</div>
          <div className="text-slate-500 text-xs mt-1">Based on {totalAnalyzed} trades</div>
        </div>
        <div className="bg-[#1e293b] rounded-xl p-5 border border-yellow-400/20">
          <div className="flex items-center gap-2 mb-2">
            <ArrowTrendingUpIcon className="w-5 h-5 text-yellow-400" />
            <span className="text-slate-400 text-xs">Assets Analyzed</span>
          </div>
          <div className="text-yellow-400 text-2xl font-bold">{signals.length}</div>
          <div className="text-slate-500 text-xs mt-1">Active trading pairs</div>
        </div>
      </div>

      <div className="bg-[#1e293b] rounded-xl border border-slate-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-700">
          <h3 className="text-white font-semibold">AI Trading Signals</h3>
          <p className="text-slate-400 text-xs mt-1">Generated from historical trade patterns</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left text-slate-400 text-xs font-medium px-5 py-3">Asset</th>
                <th className="text-left text-slate-400 text-xs font-medium px-5 py-3">Current Price</th>
                <th className="text-left text-slate-400 text-xs font-medium px-5 py-3">Signal</th>
                <th className="text-left text-slate-400 text-xs font-medium px-5 py-3">Confidence</th>
                <th className="text-left text-slate-400 text-xs font-medium px-5 py-3">Win Rate</th>
                <th className="text-left text-slate-400 text-xs font-medium px-5 py-3">Trades Analyzed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {loading && <tr><td colSpan={6} className="text-center text-slate-500 text-sm py-8">Analyzing market data...</td></tr>}
              {!loading && signals.length === 0 && <tr><td colSpan={6} className="text-center text-slate-500 text-sm py-8">No data available</td></tr>}
              {signals.map((s) => (
                <tr key={s.symbol} className="hover:bg-slate-700/20 transition-colors">
                  <td className="px-5 py-3">
                    <div className="text-white text-sm font-mono font-semibold">{s.symbol}</div>
                    <div className="text-slate-400 text-xs">{s.name}</div>
                  </td>
                  <td className="px-5 py-3 text-slate-300 text-sm font-mono">{s.current_price > 0 ? `$${Number(s.current_price).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}` : '—'}</td>
                  <td className="px-5 py-3">
                    <div className={`flex items-center gap-1.5 text-xs font-bold px-2 py-1 rounded-lg w-fit
                      ${s.signal === 'BUY' ? 'bg-green-500/10 text-green-400' : s.signal === 'SELL' ? 'bg-red-500/10 text-red-400' : 'bg-slate-500/10 text-slate-400'}`}>
                      {s.signal === 'BUY' ? <ArrowTrendingUpIcon className="w-3.5 h-3.5" /> : s.signal === 'SELL' ? <ArrowTrendingDownIcon className="w-3.5 h-3.5" /> : null}
                      {s.signal}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-400 rounded-full" style={{ width: `${s.confidence}%` }} />
                      </div>
                      <span className="text-purple-400 text-xs font-semibold">{s.confidence}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-sm font-semibold ${s.win_rate >= 60 ? 'text-green-400' : s.win_rate >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {s.win_rate}%
                    </span>
                  </td>
                  <td className="px-5 py-3 text-slate-400 text-sm">{s.total_trades}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
