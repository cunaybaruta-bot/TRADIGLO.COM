'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface Trade {
  id: string;
  user_id: string;
  asset_id: string;
  order_type: string;
  amount: number;
  profit: number | null;
  result: string | null;
  status: string;
  created_at: string;
  closed_at: string | null;
  users?: { email: string };
}

export default function TradeHistoryPage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchTrades = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('trades')
      .select('id, user_id, asset_id, order_type, amount, profit, result, status, created_at, closed_at, users(email)')
      .eq('status', 'closed')
      .order('closed_at', { ascending: false })
      .limit(200);
    setTrades((data as any) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchTrades(); }, [fetchTrades]);

  const filtered = trades.filter((t) => {
    const email = (t.users as any)?.email || '';
    return email.toLowerCase().includes(search.toLowerCase()) || t.asset_id?.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Trade History</h1>
        <p className="text-gray-400 text-sm mt-1">All closed trades across the platform</p>
      </div>

      <div className="bg-[#0f1629] border border-white/10 rounded-xl p-4">
        <div className="relative mb-4">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search by email or asset..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500" />
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading trade history...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-gray-400 text-left">
                  <th className="pb-3 font-medium">User</th>
                  <th className="pb-3 font-medium">Asset</th>
                  <th className="pb-3 font-medium">Direction</th>
                  <th className="pb-3 font-medium">Amount</th>
                  <th className="pb-3 font-medium">Profit</th>
                  <th className="pb-3 font-medium">Result</th>
                  <th className="pb-3 font-medium">Closed At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 text-white">{(t.users as any)?.email || t.user_id.slice(0, 8)}</td>
                    <td className="py-3 text-gray-300">{t.asset_id}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${t.order_type === 'buy' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                        {t.order_type?.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 text-white">${Number(t.amount).toLocaleString()}</td>
                    <td className="py-3">
                      <span className={t.profit != null && t.profit >= 0 ? 'text-green-400' : 'text-red-400'}>
                        {t.profit != null ? `${t.profit >= 0 ? '+' : ''}$${Number(t.profit).toLocaleString()}` : '—'}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${t.result === 'win' ? 'bg-green-500/10 text-green-400' : t.result === 'loss' ? 'bg-red-500/10 text-red-400' : 'bg-gray-500/10 text-gray-400'}`}>
                        {t.result ? t.result.toUpperCase() : t.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 text-gray-400">{t.closed_at ? new Date(t.closed_at).toLocaleString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && <div className="text-center py-8 text-gray-500">No trade history found</div>}
          </div>
        )}
      </div>
    </div>
  );
}
