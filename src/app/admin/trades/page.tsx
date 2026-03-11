'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ChartBarIcon, XCircleIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface Trade {
  id: string;
  user_id: string;
  asset_id: string;
  order_type: string;
  amount: number;
  duration_seconds: number;
  entry_price: number;
  exit_price: number | null;
  profit: number | null;
  payout_percent: number;
  status: string;
  result: string | null;
  is_demo: boolean;
  opened_at: string;
  closed_at: string | null;
  assets?: { symbol: string; name: string };
  users?: { email: string };
}

const StatusBadge = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    open: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    closed: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    win: 'bg-green-500/10 text-green-400 border-green-500/20',
    loss: 'bg-red-500/10 text-red-400 border-red-500/20',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${colors[status] || 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
      {status?.toUpperCase()}
    </span>
  );
};

export default function TradesPage() {
  const [tab, setTab] = useState<'open' | 'history' | 'analytics'>('open');
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [analytics, setAnalytics] = useState({ total: 0, wins: 0, losses: 0, open: 0, totalVolume: 0, totalProfit: 0 });

  const fetchTrades = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();

    if (tab === 'analytics') {
      const { data } = await supabase.from('trades').select('result, status, amount, profit').limit(5000);
      if (data) {
        const wins = data.filter((t) => t.result === 'win');
        const losses = data.filter((t) => t.result === 'loss');
        const open = data.filter((t) => t.status === 'open');
        setAnalytics({
          total: data.length,
          wins: wins.length,
          losses: losses.length,
          open: open.length,
          totalVolume: data.reduce((s, t) => s + Number(t.amount), 0),
          totalProfit: wins.reduce((s, t) => s + Number(t.profit || 0), 0),
        });
      }
      setLoading(false);
      return;
    }

    let query = supabase
      .from('trades')
      .select('id, user_id, asset_id, order_type, amount, duration_seconds, entry_price, exit_price, profit, payout_percent, status, result, is_demo, opened_at, closed_at, assets(symbol, name), users(email)')
      .order('opened_at', { ascending: false })
      .limit(100);

    if (tab === 'open') query = query.eq('status', 'open');
    else query = query.neq('status', 'open');

    const { data } = await query;
    setTrades((data as any) || []);
    setLoading(false);
  }, [tab]);

  useEffect(() => { fetchTrades(); }, [fetchTrades]);

  const handleForceClose = async (id: string) => {
    setProcessing(id);
    const supabase = createClient();
    await supabase.from('trades').update({ status: 'closed', closed_at: new Date().toISOString() }).eq('id', id);
    setMessage('Trade force closed');
    fetchTrades();
    setProcessing(null);
    setTimeout(() => setMessage(''), 3000);
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    return `${Math.floor(seconds / 3600)}h`;
  };

  const filtered = trades.filter((t) => {
    const email = (t.users as any)?.email || '';
    const symbol = (t.assets as any)?.symbol || '';
    return email.toLowerCase().includes(search.toLowerCase()) || symbol.toLowerCase().includes(search.toLowerCase());
  });

  const winRate = analytics.wins + analytics.losses > 0 ? ((analytics.wins / (analytics.wins + analytics.losses)) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-white text-xl font-bold">Trading</h2>
          <p className="text-slate-400 text-sm mt-1">{tab !== 'analytics' ? `${filtered.length} records` : 'Trade analytics'}</p>
        </div>
        {tab !== 'analytics' && (
          <div className="relative">
            <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Search user or asset..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="bg-[#1e293b] border border-slate-700 text-white text-sm rounded-lg pl-9 pr-4 py-2 w-56 focus:outline-none focus:border-[#22c55e] placeholder-slate-500" />
          </div>
        )}
      </div>

      {message && <div className="bg-green-500/10 border border-green-500/20 text-green-400 text-sm px-4 py-2 rounded-lg">{message}</div>}

      {/* Tabs */}
      <div className="flex gap-1 bg-[#1e293b] rounded-lg p-1 w-fit border border-slate-700">
        {(['open', 'history', 'analytics'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors capitalize ${tab === t ? 'bg-[#22c55e] text-black' : 'text-slate-400 hover:text-white'}`}>
            {t === 'open' ? 'Open Trades' : t === 'history' ? 'Trade History' : 'Analytics'}
          </button>
        ))}
      </div>

      {tab === 'analytics' ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
            {[
              { label: 'Total Trades', value: analytics.total.toLocaleString(), color: 'text-white' },
              { label: 'Win Trades', value: analytics.wins.toLocaleString(), color: 'text-green-400' },
              { label: 'Loss Trades', value: analytics.losses.toLocaleString(), color: 'text-red-400' },
              { label: 'Open Trades', value: analytics.open.toLocaleString(), color: 'text-blue-400' },
              { label: 'Total Volume', value: `$${analytics.totalVolume.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: 'text-purple-400' },
              { label: 'Platform Profit', value: `$${analytics.totalProfit.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: 'text-emerald-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-[#1e293b] rounded-xl p-5 border border-slate-700">
                <div className="text-slate-400 text-xs mb-2">{label}</div>
                <div className={`text-2xl font-bold ${color}`}>{value}</div>
              </div>
            ))}
          </div>
          <div className="bg-[#1e293b] rounded-xl p-5 border border-slate-700">
            <div className="flex items-center gap-2 mb-3">
              <ChartBarIcon className="w-5 h-5 text-[#22c55e]" />
              <h3 className="text-white font-semibold">Win Rate Analysis</h3>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex-1 h-4 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-green-400 rounded-full transition-all" style={{ width: `${winRate}%` }} />
              </div>
              <span className="text-green-400 font-bold text-lg">{winRate}%</span>
            </div>
            <div className="flex gap-4 mt-2 text-xs text-slate-400">
              <span className="text-green-400">{analytics.wins} wins</span>
              <span className="text-red-400">{analytics.losses} losses</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-[#1e293b] rounded-xl border border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left text-slate-400 text-xs font-medium px-5 py-3">User</th>
                  <th className="text-left text-slate-400 text-xs font-medium px-5 py-3">Asset</th>
                  <th className="text-left text-slate-400 text-xs font-medium px-5 py-3">Type</th>
                  <th className="text-left text-slate-400 text-xs font-medium px-5 py-3">Amount</th>
                  <th className="text-left text-slate-400 text-xs font-medium px-5 py-3">Entry</th>
                  {tab === 'history' && <th className="text-left text-slate-400 text-xs font-medium px-5 py-3">Exit</th>}
                  <th className="text-left text-slate-400 text-xs font-medium px-5 py-3">Duration</th>
                  <th className="text-left text-slate-400 text-xs font-medium px-5 py-3">Mode</th>
                  {tab === 'history' && <th className="text-left text-slate-400 text-xs font-medium px-5 py-3">Result</th>}
                  {tab === 'history' && <th className="text-left text-slate-400 text-xs font-medium px-5 py-3">Profit</th>}
                  <th className="text-left text-slate-400 text-xs font-medium px-5 py-3">Opened</th>
                  {tab === 'open' && <th className="text-left text-slate-400 text-xs font-medium px-5 py-3">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {loading && <tr><td colSpan={12} className="text-center text-slate-500 text-sm py-8">Loading...</td></tr>}
                {!loading && filtered.length === 0 && <tr><td colSpan={12} className="text-center text-slate-500 text-sm py-8">No trades found</td></tr>}
                {filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-700/20 transition-colors">
                    <td className="px-5 py-3 text-white text-sm max-w-[140px] truncate">{(t.users as any)?.email || t.user_id.slice(0, 8)}</td>
                    <td className="px-5 py-3 text-slate-300 text-sm font-mono">{(t.assets as any)?.symbol || '—'}</td>
                    <td className="px-5 py-3"><span className={`text-xs font-semibold ${t.order_type === 'buy' ? 'text-green-400' : 'text-red-400'}`}>{t.order_type?.toUpperCase()}</span></td>
                    <td className="px-5 py-3 text-white text-sm">${Number(t.amount).toFixed(2)}</td>
                    <td className="px-5 py-3 text-slate-300 text-sm font-mono">${Number(t.entry_price).toFixed(4)}</td>
                    {tab === 'history' && <td className="px-5 py-3 text-slate-300 text-sm font-mono">{t.exit_price ? `$${Number(t.exit_price).toFixed(4)}` : '—'}</td>}
                    <td className="px-5 py-3 text-slate-400 text-sm">{formatDuration(t.duration_seconds)}</td>
                    <td className="px-5 py-3"><span className={`text-xs px-1.5 py-0.5 rounded ${t.is_demo ? 'bg-slate-700 text-slate-300' : 'bg-blue-500/10 text-blue-400'}`}>{t.is_demo ? 'Demo' : 'Real'}</span></td>
                    {tab === 'history' && <td className="px-5 py-3">{t.result ? <StatusBadge status={t.result} /> : '—'}</td>}
                    {tab === 'history' && (
                      <td className="px-5 py-3">
                        <span className={`text-sm font-semibold ${t.profit && t.profit > 0 ? 'text-green-400' : t.profit && t.profit < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                          {t.profit != null ? `${t.profit > 0 ? '+' : ''}$${Number(t.profit).toFixed(2)}` : '—'}
                        </span>
                      </td>
                    )}
                    <td className="px-5 py-3 text-slate-400 text-sm">{new Date(t.opened_at).toLocaleString()}</td>
                    {tab === 'open' && (
                      <td className="px-5 py-3">
                        <button onClick={() => handleForceClose(t.id)} disabled={processing === t.id}
                          className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors disabled:opacity-50">
                          <XCircleIcon className="w-3 h-3" /> Force Close
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
