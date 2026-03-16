'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import DashboardTopBar from '@/components/dashboard/DashboardTopBar';

const supabase = createClient();
const HISTORY_PAGE_SIZE = 50;

interface Trade {
  id: string;
  asset_symbol: string;
  order_type: 'buy' | 'sell';
  amount: number;
  entry_price: number;
  exit_price?: number;
  profit_loss?: number;
  result?: 'win' | 'loss' | null;
  status: 'open' | 'closed';
  is_demo: boolean;
  duration_seconds: number;
  opened_at: string;
  closed_at?: string;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export default function HistoryPage() {
  const router = useRouter();

  const [authChecked, setAuthChecked] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const [tradeHistory, setTradeHistory] = useState<Trade[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyPage, setHistoryPage] = useState(0);
  const [historyHasMore, setHistoryHasMore] = useState(true);
  const [historyLoadingMore, setHistoryLoadingMore] = useState(false);

  // Filter & Search state
  const [searchAsset, setSearchAsset] = useState('');
  const [filterResult, setFilterResult] = useState<'all' | 'win' | 'loss'>('all');
  const [filterDirection, setFilterDirection] = useState<'all' | 'buy' | 'sell'>('all');
  const [filterMode, setFilterMode] = useState<'all' | 'demo' | 'real'>('all');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  // Auth check
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/auth');
        return;
      }
      setUserId(user.id);
      setUserEmail(user.email ?? '');
      const { data: profile } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', user.id)
        .single();
      if (profile?.avatar_url) setAvatarUrl(profile.avatar_url);
      setAuthChecked(true);
    };
    checkAuth();
  }, [router]);

  const fetchTradeHistory = useCallback(async () => {
    setHistoryLoading(true);
    setHistoryPage(0);
    setHistoryHasMore(true);
    try {
      const currentUser = (await supabase.auth.getUser()).data.user;
      if (!currentUser) return;
      let data: any[] | null = null;
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_trade_history');
      if (!rpcError && rpcData) {
        data = rpcData;
        setHistoryHasMore(false);
      } else {
        const { data: directData, error: directError } = await supabase
          .from('trades').select('*, assets(symbol)')
          .eq('user_id', currentUser.id).eq('status', 'closed')
          .order('closed_at', { ascending: false }).range(0, HISTORY_PAGE_SIZE - 1);
        if (!directError) {
          data = directData;
          setHistoryHasMore((directData?.length ?? 0) === HISTORY_PAGE_SIZE);
        }
      }
      const mapped = (data ?? []).map((t: any) => ({
        ...t,
        asset_symbol: t.asset_symbol ?? t.assets?.symbol ?? '',
        profit_loss: t.profit ?? t.profit_loss ?? null,
        result: t.result ?? (t.profit != null ? (t.profit >= 0 ? 'win' : 'loss') : null),
      }));
      setTradeHistory(mapped as Trade[]);
    } catch {
      // silent
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const loadMoreTradeHistory = useCallback(async () => {
    setHistoryLoadingMore(true);
    try {
      const currentUser = (await supabase.auth.getUser()).data.user;
      if (!currentUser) return;
      const nextPage = historyPage + 1;
      const from = nextPage * HISTORY_PAGE_SIZE;
      const to = from + HISTORY_PAGE_SIZE - 1;
      const { data: directData, error: directError } = await supabase
        .from('trades').select('*, assets(symbol)')
        .eq('user_id', currentUser.id).eq('status', 'closed')
        .order('closed_at', { ascending: false }).range(from, to);
      if (!directError && directData) {
        const mapped = directData.map((t: any) => ({
          ...t,
          asset_symbol: t.asset_symbol ?? t.assets?.symbol ?? '',
          profit_loss: t.profit ?? t.profit_loss ?? null,
          result: t.result ?? (t.profit != null ? (t.profit >= 0 ? 'win' : 'loss') : null),
        }));
        setTradeHistory((prev) => [...prev, ...(mapped as Trade[])]);
        setHistoryPage(nextPage);
        setHistoryHasMore(directData.length === HISTORY_PAGE_SIZE);
      }
    } catch {
      // silent
    } finally {
      setHistoryLoadingMore(false);
    }
  }, [historyPage]);

  useEffect(() => {
    if (!authChecked) return;
    fetchTradeHistory();
  }, [authChecked, fetchTradeHistory]);

  // Filtered trades
  const filteredTrades = useMemo(() => {
    return tradeHistory.filter((t) => {
      if (searchAsset && !t.asset_symbol.toLowerCase().includes(searchAsset.toLowerCase())) return false;
      if (filterResult !== 'all' && t.result !== filterResult) return false;
      if (filterDirection !== 'all' && t.order_type !== filterDirection) return false;
      if (filterMode === 'demo' && !t.is_demo) return false;
      if (filterMode === 'real' && t.is_demo) return false;
      if (filterDateFrom) {
        const from = new Date(filterDateFrom);
        const tradeDate = t.closed_at ? new Date(t.closed_at) : null;
        if (!tradeDate || tradeDate < from) return false;
      }
      if (filterDateTo) {
        const to = new Date(filterDateTo);
        to.setHours(23, 59, 59, 999);
        const tradeDate = t.closed_at ? new Date(t.closed_at) : null;
        if (!tradeDate || tradeDate > to) return false;
      }
      return true;
    });
  }, [tradeHistory, searchAsset, filterResult, filterDirection, filterMode, filterDateFrom, filterDateTo]);

  const hasActiveFilter = searchAsset || filterResult !== 'all' || filterDirection !== 'all' || filterMode !== 'all' || filterDateFrom || filterDateTo;

  const resetFilters = () => {
    setSearchAsset('');
    setFilterResult('all');
    setFilterDirection('all');
    setFilterMode('all');
    setFilterDateFrom('');
    setFilterDateTo('');
  };

  const exportCSV = () => {
    const headers = ['Asset', 'Direction', 'Amount', 'Entry Price', 'Exit Price', 'P/L', 'Result', 'Mode', 'Date'];
    const rows = filteredTrades.map((t) => [
      t.asset_symbol,
      t.order_type.toUpperCase(),
      t.amount,
      t.entry_price,
      t.exit_price ?? '',
      t.profit_loss ?? '',
      t.result ? t.result.toUpperCase() : '',
      t.is_demo ? 'DEMO' : 'REAL',
      t.closed_at ? new Date(t.closed_at).toISOString() : '',
    ]);
    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trade-history-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <span className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      <DashboardTopBar
        userEmail={userEmail}
        avatarUrl={avatarUrl}
        wallet={null}
        walletLoading={false}
        isDemo={false}
        onToggleDemo={() => {}}
        onDepositClick={() => {}}
      />

      <div className="flex-1 px-3 py-3 max-w-5xl mx-auto w-full">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => router.back()}
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
          >
            <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-sm font-semibold text-white uppercase tracking-wider">Trade History</h1>
          <span className="text-xs text-slate-500 ml-auto">
            {hasActiveFilter ? `${filteredTrades.length} / ${tradeHistory.length}` : `${tradeHistory.length}`} trades
          </span>
          {!historyLoading && filteredTrades.length > 0 && (
            <button
              onClick={exportCSV}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[10px] font-semibold text-slate-300 hover:text-white transition-colors"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
              </svg>
              CSV
            </button>
          )}
        </div>

        {/* Summary Stats */}
        {!historyLoading && tradeHistory.length > 0 && (() => {
          const totalTrades = tradeHistory.length;
          const wins = tradeHistory.filter((t) => t.result === 'win').length;
          const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
          const totalProfit = tradeHistory.reduce((sum, t) => sum + (t.profit_loss != null && t.profit_loss > 0 ? t.profit_loss : 0), 0);
          const totalLoss = tradeHistory.reduce((sum, t) => sum + (t.profit_loss != null && t.profit_loss < 0 ? Math.abs(t.profit_loss) : 0), 0);
          const bestTrade = tradeHistory.reduce((best, t) => (t.profit_loss != null && t.profit_loss > (best ?? -Infinity) ? t.profit_loss : best), null as number | null);

          return (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4">
              <div className="bg-[#0d0d0d] border border-white/10 rounded-xl px-3 py-3">
                <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-1">Total Trades</div>
                <div className="text-base font-bold text-white">{totalTrades}</div>
              </div>
              <div className="bg-[#0d0d0d] border border-white/10 rounded-xl px-3 py-3">
                <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-1">Win Rate</div>
                <div className={`text-base font-bold ${winRate >= 50 ? 'text-emerald-400' : 'text-red-400'}`}>{winRate.toFixed(1)}%</div>
              </div>
              <div className="bg-[#0d0d0d] border border-white/10 rounded-xl px-3 py-3">
                <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-1">Total Profit</div>
                <div className="text-base font-bold text-emerald-400">+${formatCurrency(totalProfit)}</div>
              </div>
              <div className="bg-[#0d0d0d] border border-white/10 rounded-xl px-3 py-3">
                <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-1">Total Loss</div>
                <div className="text-base font-bold text-red-400">-${formatCurrency(totalLoss)}</div>
              </div>
              <div className="col-span-2 sm:col-span-1 bg-[#0d0d0d] border border-white/10 rounded-xl px-3 py-3">
                <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-1">Best Trade</div>
                <div className="text-base font-bold text-emerald-400">
                  {bestTrade != null ? `+$${formatCurrency(bestTrade)}` : '—'}
                </div>
              </div>
            </div>
          );
        })()}

        {/* Filter & Search Bar */}
        {!historyLoading && (
          <div className="bg-[#0d0d0d] border border-white/10 rounded-xl p-3 mb-3 flex flex-col gap-2">
            {/* Search */}
            <div className="relative">
              <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search asset..."
                value={searchAsset}
                onChange={(e) => setSearchAsset(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-white/20"
              />
            </div>

            {/* Filter row */}
            <div className="flex flex-wrap gap-2">
              {/* Result */}
              <div className="flex items-center gap-1">
                {(['all', 'win', 'loss'] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => setFilterResult(v)}
                    className={`px-2 py-1 rounded text-[10px] font-semibold border transition-colors ${
                      filterResult === v
                        ? v === 'win' ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                          : v === 'loss'? 'bg-red-500/20 border-red-500/40 text-red-400' :'bg-white/10 border-white/20 text-white' :'bg-transparent border-white/10 text-slate-500 hover:border-white/20 hover:text-slate-300'
                    }`}
                  >
                    {v === 'all' ? 'All Results' : v.toUpperCase()}
                  </button>
                ))}
              </div>

              {/* Direction */}
              <div className="flex items-center gap-1">
                {(['all', 'buy', 'sell'] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => setFilterDirection(v)}
                    className={`px-2 py-1 rounded text-[10px] font-semibold border transition-colors ${
                      filterDirection === v
                        ? v === 'buy' ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                          : v === 'sell'? 'bg-red-500/20 border-red-500/40 text-red-400' :'bg-white/10 border-white/20 text-white' :'bg-transparent border-white/10 text-slate-500 hover:border-white/20 hover:text-slate-300'
                    }`}
                  >
                    {v === 'all' ? 'All Dir' : v.toUpperCase()}
                  </button>
                ))}
              </div>

              {/* Demo/Real */}
              <div className="flex items-center gap-1">
                {(['all', 'demo', 'real'] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => setFilterMode(v)}
                    className={`px-2 py-1 rounded text-[10px] font-semibold border transition-colors ${
                      filterMode === v
                        ? 'bg-white/10 border-white/20 text-white' :'bg-transparent border-white/10 text-slate-500 hover:border-white/20 hover:text-slate-300'
                    }`}
                  >
                    {v === 'all' ? 'All Mode' : v.charAt(0).toUpperCase() + v.slice(1)}
                  </button>
                ))}
              </div>

              {/* Date range */}
              <div className="flex items-center gap-1 ml-auto">
                <input
                  type="date"
                  value={filterDateFrom}
                  onChange={(e) => setFilterDateFrom(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-[10px] text-slate-300 focus:outline-none focus:border-white/20 [color-scheme:dark]"
                />
                <span className="text-slate-600 text-[10px]">–</span>
                <input
                  type="date"
                  value={filterDateTo}
                  onChange={(e) => setFilterDateTo(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-[10px] text-slate-300 focus:outline-none focus:border-white/20 [color-scheme:dark]"
                />
                {hasActiveFilter && (
                  <button
                    onClick={resetFilters}
                    className="px-2 py-1 rounded text-[10px] font-semibold border border-white/10 text-slate-400 hover:text-white hover:border-white/20 transition-colors"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="bg-[#0d0d0d] border border-white/10 rounded-xl overflow-hidden">
          {historyLoading ? (
            <div className="flex items-center justify-center py-16">
              <span className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredTrades.length === 0 ? (
            <div className="text-center py-16 text-slate-500 text-sm">
              {tradeHistory.length === 0 ? 'No trade history yet' : 'No trades match the current filters'}
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-[#0d0d0d]">
                    <tr className="text-slate-500 border-b border-white/5">
                      {['Asset', 'Dir', 'Amount', 'Entry', 'Exit', 'P/L', 'Result', 'Mode', 'Date'].map((h) => (
                        <th key={h} className="px-3 py-3 text-left font-medium whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTrades.map((trade) => (
                      <tr key={trade.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="px-3 py-2.5 font-medium text-white whitespace-nowrap">{trade.asset_symbol}</td>
                        <td className="px-3 py-2.5">
                          <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${trade.order_type === 'buy' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                            {trade.order_type.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-slate-300">${formatCurrency(trade.amount)}</td>
                        <td className="px-3 py-2.5 text-slate-400">${formatCurrency(trade.entry_price)}</td>
                        <td className="px-3 py-2.5 text-slate-400">{trade.exit_price != null ? `$${formatCurrency(trade.exit_price)}` : '—'}</td>
                        <td className={`px-3 py-2.5 font-semibold ${(trade.profit_loss ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {trade.profit_loss != null ? `${trade.profit_loss >= 0 ? '+' : ''}$${formatCurrency(trade.profit_loss)}` : '—'}
                        </td>
                        <td className="px-3 py-2.5">
                          {trade.result ? (
                            <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${trade.result === 'win' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                              {trade.result.toUpperCase()}
                            </span>
                          ) : <span className="text-slate-600">—</span>}
                        </td>
                        <td className="px-3 py-2.5">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${trade.is_demo ? 'bg-yellow-500/20 text-yellow-400' : 'bg-blue-500/20 text-blue-400'}`}>
                            {trade.is_demo ? 'DEMO' : 'REAL'}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-slate-500 whitespace-nowrap">
                          {trade.closed_at ? new Date(trade.closed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile card list */}
              <div className="sm:hidden flex flex-col divide-y divide-white/5">
                {filteredTrades.map((trade) => (
                  <div key={trade.id} className="px-3 py-3 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{trade.asset_symbol}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${trade.order_type === 'buy' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                          {trade.order_type.toUpperCase()}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${trade.is_demo ? 'bg-yellow-500/20 text-yellow-400' : 'bg-blue-500/20 text-blue-400'}`}>
                          {trade.is_demo ? 'DEMO' : 'REAL'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {trade.result ? (
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${trade.result === 'win' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                            {trade.result.toUpperCase()}
                          </span>
                        ) : null}
                        <span className={`text-sm font-bold ${(trade.profit_loss ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {trade.profit_loss != null ? `${trade.profit_loss >= 0 ? '+' : ''}$${formatCurrency(trade.profit_loss)}` : '—'}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-0.5">Amount</div>
                        <div className="text-slate-300">${formatCurrency(trade.amount)}</div>
                      </div>
                      <div>
                        <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-0.5">Entry</div>
                        <div className="text-slate-400">${formatCurrency(trade.entry_price)}</div>
                      </div>
                      <div>
                        <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-0.5">Exit</div>
                        <div className="text-slate-400">{trade.exit_price != null ? `$${formatCurrency(trade.exit_price)}` : '—'}</div>
                      </div>
                    </div>
                    {trade.closed_at && (
                      <div className="text-[10px] text-slate-600">
                        {new Date(trade.closed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {historyHasMore && !hasActiveFilter && (
                <div className="px-4 py-3 border-t border-white/10 flex justify-center">
                  <button
                    onClick={loadMoreTradeHistory}
                    disabled={historyLoadingMore}
                    className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs text-slate-300 transition-colors disabled:opacity-50"
                  >
                    {historyLoadingMore ? (
                      <>
                        <span className="w-3.5 h-3.5 border border-slate-400 border-t-transparent rounded-full animate-spin" />
                        Loading...
                      </>
                    ) : (
                      'Load More'
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
