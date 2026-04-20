'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { CommandLineIcon, XCircleIcon } from '@heroicons/react/24/outline';

interface OpenTrade {
  id: string;
  user_id: string;
  asset_id: string;
  direction: string;
  amount: number;
  status: string;
  created_at: string;
  expires_at: string | null;
  users?: { email: string };
}

export default function TradeControlPage() {
  const [trades, setTrades] = useState<OpenTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const fetchTrades = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('trades')
      .select('id, user_id, asset_id, direction, amount, status, created_at, expires_at, users(email)')
      .eq('status', 'open')
      .order('created_at', { ascending: false });
    setTrades((data as any) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchTrades(); }, [fetchTrades]);

  const forceClose = async (tradeId: string) => {
    const supabase = createClient();
    await supabase.from('trades').update({ status: 'lost', closed_at: new Date().toISOString() }).eq('id', tradeId);
    setMessage('Trade force-closed successfully');
    fetchTrades();
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Trade Control</h1>
        <p className="text-gray-400 text-sm mt-1">Monitor and force-close open trades</p>
      </div>

      {message && (
        <div className="bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-lg text-sm">{message}</div>
      )}

      <div className="bg-[#0f1629] border border-white/10 rounded-xl p-4">
        <h2 className="text-white font-semibold mb-4 flex items-center gap-2"><CommandLineIcon className="w-5 h-5 text-blue-400" /> Open Trades ({trades.length})</h2>
        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading open trades...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-gray-400 text-left">
                  <th className="pb-3 font-medium">User</th>
                  <th className="pb-3 font-medium">Asset</th>
                  <th className="pb-3 font-medium">Direction</th>
                  <th className="pb-3 font-medium">Amount</th>
                  <th className="pb-3 font-medium">Opened</th>
                  <th className="pb-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {trades.map((t) => (
                  <tr key={t.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 text-white">{(t.users as any)?.email || t.user_id.slice(0, 8)}</td>
                    <td className="py-3 text-gray-300">{t.asset_id}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${t.direction === 'up' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                        {t.direction?.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 text-white">${Number(t.amount).toLocaleString()}</td>
                    <td className="py-3 text-gray-400">{new Date(t.created_at).toLocaleString()}</td>
                    <td className="py-3">
                      <button onClick={() => forceClose(t.id)}
                        className="flex items-center gap-1 px-3 py-1 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg text-xs font-medium transition-colors">
                        <XCircleIcon className="w-3 h-3" /> Force Close
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {trades.length === 0 && <div className="text-center py-8 text-gray-500">No open trades</div>}
          </div>
        )}
      </div>
    </div>
  );
}
