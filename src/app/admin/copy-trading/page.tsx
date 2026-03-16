'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { UsersIcon, ChartBarIcon, PlayIcon, ClipboardDocumentListIcon, Cog6ToothIcon, CheckCircleIcon, ArrowPathIcon,  } from '@heroicons/react/24/outline';
import Icon from '@/components/ui/AppIcon';


// ─── Types ────────────────────────────────────────────────────────────────────

interface Provider {
  id: string;
  name: string;
  description: string | null;
  win_rate: number;
  activity_score: number;
  probability_score: number;
  reliability_score: number;
  popularity_score: number;
  experience_score: number;
  min_balance_usd: number;
  is_active: boolean;
}

interface Follower {
  id: string;
  user_id: string;
  provider_id: string;
  followed_at: string;
  stopped_at: string | null;
  is_active: boolean;
  allocated_balance: number;
  users?: { email: string; full_name: string | null };
}

interface CopyTrade {
  id: string;
  provider_id: string;
  asset_symbol: string;
  direction: 'BUY' | 'SELL';
  amount_per_follower: number;
  entry_price: number | null;
  exit_price: number | null;
  duration_seconds: number | null;
  status: 'open' | 'won' | 'lost' | 'refunded';
  opened_at: string;
  closed_at: string | null;
  payout_percent: number;
}

interface CopyTradeResult {
  id: string;
  copy_trade_id: string;
  user_id: string;
  amount: number;
  profit_loss: number;
  status: 'pending' | 'won' | 'lost' | 'refunded';
  refunded_by: string | null;
  refunded_at: string | null;
  created_at: string;
  users?: { email: string; full_name: string | null };
  copy_trades?: { asset_symbol: string; direction: string; status: string };
}

type AdminTab = 'overview' | 'followers' | 'execute' | 'results' | 'settings';

// ─── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewTab() {
  const supabase = createClient();
  const [stats, setStats] = useState({ activeFollowers: 0, totalTrades: 0, openTrades: 0, wonTrades: 0, lostTrades: 0, totalProfit: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const [followersRes, tradesRes, resultsRes] = await Promise.all([
        supabase.from('copy_trade_followers').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('copy_trades').select('id, status'),
        supabase.from('copy_trade_results').select('profit_loss, status'),
      ]);
      const trades = tradesRes.data ?? [];
      const results = resultsRes.data ?? [];
      setStats({
        activeFollowers: followersRes.count ?? 0,
        totalTrades: trades.length,
        openTrades: trades.filter((t) => t.status === 'open').length,
        wonTrades: trades.filter((t) => t.status === 'won').length,
        lostTrades: trades.filter((t) => t.status === 'lost').length,
        totalProfit: results.filter((r) => r.status === 'won').reduce((s, r) => s + Number(r.profit_loss), 0),
      });
      setLoading(false);
    };
    fetch();
  }, []);

  const cards = [
    { label: 'Active Followers', value: stats.activeFollowers.toLocaleString(), color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20' },
    { label: 'Total Trades', value: stats.totalTrades.toLocaleString(), color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/20' },
    { label: 'Open Trades', value: stats.openTrades.toLocaleString(), color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/20' },
    { label: 'Won Trades', value: stats.wonTrades.toLocaleString(), color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20' },
    { label: 'Lost Trades', value: stats.lostTrades.toLocaleString(), color: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/20' },
    { label: 'Total Profit Distributed', value: `$${stats.totalProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20' },
  ];

  return (
    <div className="space-y-4">
      {loading ? (
        <div className="flex items-center justify-center py-12"><span className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
          {cards.map((c) => (
            <div key={c.label} className={`bg-[#1e293b] rounded-xl p-5 border ${c.border}`}>
              <div className="text-slate-400 text-xs mb-2">{c.label}</div>
              <div className={`text-2xl font-bold ${c.color}`}>{c.value}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Followers Tab ────────────────────────────────────────────────────────────

function FollowersTab() {
  const supabase = createClient();
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'stopped'>('all');

  const fetchFollowers = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('copy_trade_followers')
      .select('*, users(email, full_name)')
      .order('followed_at', { ascending: false });
    const { data } = await query;
    setFollowers((data as any) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchFollowers(); }, [fetchFollowers]);

  const filtered = followers.filter((f) => {
    if (filter === 'active') return f.is_active;
    if (filter === 'stopped') return !f.is_active;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {(['all', 'active', 'stopped'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${filter === f ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400 hover:text-white'}`}
          >
            {f}
          </button>
        ))}
        <span className="text-slate-500 text-xs ml-auto">{filtered.length} followers</span>
      </div>

      <div className="bg-[#1e293b] rounded-xl border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-slate-400 text-xs">
                <th className="px-5 py-3 text-left font-medium">User</th>
                <th className="px-5 py-3 text-left font-medium">Joined</th>
                <th className="px-5 py-3 text-left font-medium">Allocated Balance</th>
                <th className="px-5 py-3 text-left font-medium">Status</th>
                <th className="px-5 py-3 text-left font-medium">Stopped At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {loading && <tr><td colSpan={5} className="text-center text-slate-500 text-sm py-8">Loading...</td></tr>}
              {!loading && filtered.length === 0 && <tr><td colSpan={5} className="text-center text-slate-500 text-sm py-8">No followers found</td></tr>}
              {filtered.map((f) => (
                <tr key={f.id} className="hover:bg-slate-700/20 transition-colors">
                  <td className="px-5 py-3">
                    <div className="text-white text-sm font-medium">{(f.users as any)?.full_name || '—'}</div>
                    <div className="text-slate-400 text-xs">{(f.users as any)?.email || f.user_id.slice(0, 12)}</div>
                  </td>
                  <td className="px-5 py-3 text-slate-300 text-xs">{new Date(f.followed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                  <td className="px-5 py-3 text-emerald-400 text-sm font-semibold">${Number(f.allocated_balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${f.is_active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
                      {f.is_active ? 'Active' : 'Stopped'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-slate-400 text-xs">{f.stopped_at ? new Date(f.stopped_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Execute Trade Tab ────────────────────────────────────────────────────────

function ExecuteTradeTab({ providerId }: { providerId: string }) {
  const supabase = createClient();
  const [form, setForm] = useState({
    asset_symbol: 'BTC',
    direction: 'BUY\' as \'BUY\' | \'SELL',
    amount_per_follower: '',
    entry_price: '',
    duration_seconds: '3600',
  });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const handleExecute = async () => {
    if (!form.asset_symbol || !form.amount_per_follower || !form.entry_price) {
      setToast({ message: 'Please fill all required fields', type: 'error' });
      return;
    }
    setLoading(true);
    try {
      // 1. Insert copy_trade
      const { data: tradeData, error: tradeError } = await supabase
        .from('copy_trades')
        .insert({
          provider_id: providerId,
          asset_symbol: form.asset_symbol.toUpperCase(),
          direction: form.direction,
          amount_per_follower: Number(form.amount_per_follower),
          entry_price: Number(form.entry_price),
          duration_seconds: Number(form.duration_seconds),
          status: 'open',
          payout_percent: 95,
        })
        .select()
        .single();

      if (tradeError) throw tradeError;

      // 2. Get all active followers
      const { data: followers, error: followersError } = await supabase
        .from('copy_trade_followers')
        .select('user_id')
        .eq('is_active', true);

      if (followersError) throw followersError;

      if (!followers || followers.length === 0) {
        setToast({ message: 'Trade created but no active followers found', type: 'error' });
        setLoading(false);
        return;
      }

      // 3. Insert copy_trade_results for each follower + deduct wallet
      const amount = Number(form.amount_per_follower);
      const results = followers.map((f) => ({
        copy_trade_id: tradeData.id,
        user_id: f.user_id,
        amount,
        profit_loss: 0,
        status: 'pending',
      }));

      const { error: resultsError } = await supabase.from('copy_trade_results').insert(results);
      if (resultsError) throw resultsError;

      // 4. Deduct balance from each follower's real wallet
      for (const f of followers) {
        const { data: walletData } = await supabase
          .from('wallets')
          .select('id, balance')
          .eq('user_id', f.user_id)
          .eq('is_demo', false)
          .maybeSingle();
        if (walletData) {
          await supabase
            .from('wallets')
            .update({ balance: Math.max(0, Number(walletData.balance) - amount) })
            .eq('id', walletData.id);
        }
      }

      setToast({ message: `Trade executed for ${followers.length} followers!`, type: 'success' });
      setForm({ asset_symbol: 'BTC', direction: 'BUY', amount_per_follower: '', entry_price: '', duration_seconds: '3600' });
    } catch (err: any) {
      setToast({ message: err?.message ?? 'Failed to execute trade', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 max-w-lg">
      {toast && (
        <div className={`px-4 py-3 rounded-lg border text-sm ${toast.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
          {toast.message}
        </div>
      )}

      <div className="bg-[#1e293b] rounded-xl border border-slate-700 p-6 space-y-4">
        <h3 className="text-white font-semibold">Execute Copy Trade</h3>
        <p className="text-slate-400 text-xs">This will create a trade and deduct balance from all active followers.</p>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-slate-400 text-xs block mb-1.5">Asset Symbol *</label>
            <input
              type="text"
              value={form.asset_symbol}
              onChange={(e) => setForm((p) => ({ ...p, asset_symbol: e.target.value.toUpperCase() }))}
              placeholder="e.g. BTC, ETH, EUR/USD"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="text-slate-400 text-xs block mb-1.5">Direction *</label>
            <select
              value={form.direction}
              onChange={(e) => setForm((p) => ({ ...p, direction: e.target.value as 'BUY' | 'SELL' }))}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="BUY">BUY</option>
              <option value="SELL">SELL</option>
            </select>
          </div>
          <div>
            <label className="text-slate-400 text-xs block mb-1.5">Amount per Follower (USD) *</label>
            <input
              type="number"
              value={form.amount_per_follower}
              onChange={(e) => setForm((p) => ({ ...p, amount_per_follower: e.target.value }))}
              placeholder="e.g. 100"
              min="1"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="text-slate-400 text-xs block mb-1.5">Entry Price *</label>
            <input
              type="number"
              value={form.entry_price}
              onChange={(e) => setForm((p) => ({ ...p, entry_price: e.target.value }))}
              placeholder="e.g. 65000"
              min="0"
              step="any"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="col-span-2">
            <label className="text-slate-400 text-xs block mb-1.5">Duration (seconds)</label>
            <select
              value={form.duration_seconds}
              onChange={(e) => setForm((p) => ({ ...p, duration_seconds: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="300">5 minutes</option>
              <option value="900">15 minutes</option>
              <option value="1800">30 minutes</option>
              <option value="3600">1 hour</option>
              <option value="7200">2 hours</option>
              <option value="14400">4 hours</option>
              <option value="28800">8 hours</option>
              <option value="86400">1 day</option>
              <option value="604800">1 week</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleExecute}
          disabled={loading}
          className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Executing...</>
          ) : (
            <><PlayIcon className="w-4 h-4" /> Execute Trade for All Followers</>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Trade Results Tab ────────────────────────────────────────────────────────

function TradeResultsTab() {
  const supabase = createClient();
  const [trades, setTrades] = useState<CopyTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [closingId, setClosingId] = useState<string | null>(null);
  const [refundingId, setRefundingId] = useState<string | null>(null);
  const [closeModal, setCloseModal] = useState<{ trade: CopyTrade } | null>(null);
  const [exitPrice, setExitPrice] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchTrades = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('copy_trades').select('*').order('opened_at', { ascending: false });
    setTrades((data as any) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchTrades(); }, [fetchTrades]);

  const handleCloseTrade = async () => {
    if (!closeModal || !exitPrice) return;
    const trade = closeModal.trade;
    const exit = Number(exitPrice);
    setClosingId(trade.id);
    setCloseModal(null);
    try {
      // Determine WIN/LOSS
      const entry = Number(trade.entry_price ?? 0);
      let result: 'won' | 'lost';
      if (trade.direction === 'BUY') {
        result = exit > entry ? 'won' : 'lost';
      } else {
        result = exit < entry ? 'won' : 'lost';
      }

      // Update copy_trade status
      await supabase.from('copy_trades').update({ status: result, exit_price: exit, closed_at: new Date().toISOString() }).eq('id', trade.id);

      // Get all results for this trade
      const { data: results } = await supabase.from('copy_trade_results').select('*').eq('copy_trade_id', trade.id);

      if (results) {
        for (const r of results) {
          const amount = Number(r.amount);
          const payout = result === 'won' ? amount * (Number(trade.payout_percent) / 100) : 0;
          const profitLoss = result === 'won' ? payout : -amount;

          // Update result
          await supabase.from('copy_trade_results').update({ status: result, profit_loss: profitLoss }).eq('id', r.id);

          // Credit wallet if won
          if (result === 'won') {
            const { data: walletData } = await supabase.from('wallets').select('id, balance').eq('user_id', r.user_id).eq('is_demo', false).maybeSingle();
            if (walletData) {
              await supabase.from('wallets').update({ balance: Number(walletData.balance) + amount + payout }).eq('id', walletData.id);
            }
          }
        }
      }

      setToast({ message: `Trade closed as ${result.toUpperCase()}`, type: 'success' });
      fetchTrades();
    } catch (err: any) {
      setToast({ message: err?.message ?? 'Failed to close trade', type: 'error' });
    } finally {
      setClosingId(null);
    }
  };

  const handleRefund = async (trade: CopyTrade) => {
    setRefundingId(trade.id);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const adminId = user?.id;

      // Get all lost results for this trade
      const { data: results } = await supabase.from('copy_trade_results').select('*').eq('copy_trade_id', trade.id).eq('status', 'lost');

      if (results) {
        for (const r of results) {
          const amount = Number(r.amount);
          // Refund wallet
          const { data: walletData } = await supabase.from('wallets').select('id, balance').eq('user_id', r.user_id).eq('is_demo', false).maybeSingle();
          if (walletData) {
            await supabase.from('wallets').update({ balance: Number(walletData.balance) + amount }).eq('id', walletData.id);
          }
          // Update result to refunded
          await supabase.from('copy_trade_results').update({ status: 'refunded', refunded_by: adminId, refunded_at: new Date().toISOString() }).eq('id', r.id);
        }
      }

      // Update trade status
      await supabase.from('copy_trades').update({ status: 'refunded' }).eq('id', trade.id);
      setToast({ message: 'Trade refunded successfully', type: 'success' });
      fetchTrades();
    } catch (err: any) {
      setToast({ message: err?.message ?? 'Failed to refund', type: 'error' });
    } finally {
      setRefundingId(null);
    }
  };

  const statusColor = (s: string) => {
    if (s === 'won') return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    if (s === 'lost') return 'bg-red-500/10 text-red-400 border-red-500/20';
    if (s === 'refunded') return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
    return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
  };

  return (
    <div className="space-y-4">
      {toast && (
        <div className={`px-4 py-3 rounded-lg border text-sm ${toast.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
          {toast.message}
        </div>
      )}

      <div className="bg-[#1e293b] rounded-xl border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-slate-400 text-xs">
                <th className="px-4 py-3 text-left font-medium">Asset</th>
                <th className="px-4 py-3 text-left font-medium">Direction</th>
                <th className="px-4 py-3 text-left font-medium">Amount/Follower</th>
                <th className="px-4 py-3 text-left font-medium">Entry</th>
                <th className="px-4 py-3 text-left font-medium">Exit</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Opened</th>
                <th className="px-4 py-3 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {loading && <tr><td colSpan={8} className="text-center text-slate-500 text-sm py-8">Loading...</td></tr>}
              {!loading && trades.length === 0 && <tr><td colSpan={8} className="text-center text-slate-500 text-sm py-8">No trades found</td></tr>}
              {trades.map((t) => (
                <tr key={t.id} className="hover:bg-slate-700/20 transition-colors">
                  <td className="px-4 py-3 text-white font-semibold">{t.asset_symbol}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${t.direction === 'BUY' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                      {t.direction}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-300">${Number(t.amount_per_follower).toLocaleString()}</td>
                  <td className="px-4 py-3 text-slate-300">{t.entry_price ? `$${Number(t.entry_price).toLocaleString()}` : '—'}</td>
                  <td className="px-4 py-3 text-slate-300">{t.exit_price ? `$${Number(t.exit_price).toLocaleString()}` : '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${statusColor(t.status)}`}>{t.status}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">{new Date(t.opened_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {t.status === 'open' && (
                        <button
                          onClick={() => { setCloseModal({ trade: t }); setExitPrice(''); }}
                          disabled={closingId === t.id}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/30 text-blue-400 text-xs font-medium transition-colors disabled:opacity-50"
                        >
                          <CheckCircleIcon className="w-3.5 h-3.5" />
                          Close
                        </button>
                      )}
                      {t.status === 'lost' && (
                        <button
                          onClick={() => handleRefund(t)}
                          disabled={refundingId === t.id}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-yellow-600/20 hover:bg-yellow-600/40 border border-yellow-500/30 text-yellow-400 text-xs font-medium transition-colors disabled:opacity-50"
                        >
                          {refundingId === t.id ? <span className="w-3 h-3 border border-yellow-400 border-t-transparent rounded-full animate-spin" /> : <ArrowPathIcon className="w-3.5 h-3.5" />}
                          Refund
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Close Trade Modal */}
      {closeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-[#1e293b] border border-slate-700 rounded-xl p-6 w-80 max-w-[90vw]">
            <h3 className="text-white font-semibold mb-1">Close Trade</h3>
            <p className="text-slate-400 text-xs mb-4">
              {closeModal.trade.asset_symbol} {closeModal.trade.direction} — Entry: ${Number(closeModal.trade.entry_price).toLocaleString()}
            </p>
            <label className="text-slate-400 text-xs block mb-1.5">Exit Price *</label>
            <input
              type="number"
              value={exitPrice}
              onChange={(e) => setExitPrice(e.target.value)}
              placeholder="Enter exit price"
              step="any"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 mb-4"
            />
            <div className="flex gap-2">
              <button onClick={() => setCloseModal(null)} className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm rounded-lg transition-colors">Cancel</button>
              <button
                onClick={handleCloseTrade}
                disabled={!exitPrice}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                Close Trade
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Settings Tab ─────────────────────────────────────────────────────────────

function SettingsTab({ provider, onSaved }: { provider: Provider | null; onSaved: () => void }) {
  const supabase = createClient();
  const [form, setForm] = useState({
    name: provider?.name ?? 'Investoft',
    description: provider?.description ?? '',
    win_rate: String(provider?.win_rate ?? 90),
    activity_score: String(provider?.activity_score ?? 10),
    probability_score: String(provider?.probability_score ?? 10),
    reliability_score: String(provider?.reliability_score ?? 10),
    popularity_score: String(provider?.popularity_score ?? 10),
    experience_score: String(provider?.experience_score ?? 10),
    min_balance_usd: String(provider?.min_balance_usd ?? 1500),
  });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (provider) {
      setForm({
        name: provider.name,
        description: provider.description ?? '',
        win_rate: String(provider.win_rate),
        activity_score: String(provider.activity_score),
        probability_score: String(provider.probability_score),
        reliability_score: String(provider.reliability_score),
        popularity_score: String(provider.popularity_score),
        experience_score: String(provider.experience_score),
        min_balance_usd: String(provider.min_balance_usd),
      });
    }
  }, [provider]);

  const handleSave = async () => {
    if (!provider) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('copy_trade_providers').update({
        name: form.name,
        description: form.description,
        win_rate: Number(form.win_rate),
        activity_score: Number(form.activity_score),
        probability_score: Number(form.probability_score),
        reliability_score: Number(form.reliability_score),
        popularity_score: Number(form.popularity_score),
        experience_score: Number(form.experience_score),
        min_balance_usd: Number(form.min_balance_usd),
      }).eq('id', provider.id);
      if (error) throw error;
      setToast({ message: 'Settings saved successfully', type: 'success' });
      onSaved();
    } catch (err: any) {
      setToast({ message: err?.message ?? 'Failed to save', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const fields = [
    { key: 'win_rate', label: 'Win Rate (%)', max: 100 },
    { key: 'activity_score', label: 'Activity Score (0-10)', max: 10 },
    { key: 'probability_score', label: 'Probability Score (0-10)', max: 10 },
    { key: 'reliability_score', label: 'Reliability Score (0-10)', max: 10 },
    { key: 'popularity_score', label: 'Popularity Score (0-10)', max: 10 },
    { key: 'experience_score', label: 'Experience Score (0-10)', max: 10 },
  ] as const;

  return (
    <div className="space-y-4 max-w-lg">
      {toast && (
        <div className={`px-4 py-3 rounded-lg border text-sm ${toast.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
          {toast.message}
        </div>
      )}

      <div className="bg-[#1e293b] rounded-xl border border-slate-700 p-6 space-y-4">
        <h3 className="text-white font-semibold">Provider Settings</h3>

        <div>
          <label className="text-slate-400 text-xs block mb-1.5">Provider Name</label>
          <input type="text" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500" />
        </div>

        <div>
          <label className="text-slate-400 text-xs block mb-1.5">Description</label>
          <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={2}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 resize-none" />
        </div>

        <div>
          <label className="text-slate-400 text-xs block mb-1.5">Minimum Balance (USD)</label>
          <input type="number" value={form.min_balance_usd} onChange={(e) => setForm((p) => ({ ...p, min_balance_usd: e.target.value }))} min="0"
            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {fields.map((f) => (
            <div key={f.key}>
              <label className="text-slate-400 text-xs block mb-1.5">{f.label}</label>
              <input
                type="number"
                value={form[f.key]}
                onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                min="0"
                max={f.max}
                step="0.1"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          ))}
        </div>

        <button
          onClick={handleSave}
          disabled={saving || !provider}
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</> : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminCopyTradingPage() {
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [provider, setProvider] = useState<Provider | null>(null);
  const [providerLoading, setProviderLoading] = useState(true);

  const fetchProvider = useCallback(async () => {
    const { data } = await supabase.from('copy_trade_providers').select('*').eq('is_active', true).limit(1).maybeSingle();
    setProvider(data ?? null);
    setProviderLoading(false);
  }, []);

  useEffect(() => { fetchProvider(); }, [fetchProvider]);

  const tabs: { id: AdminTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'overview', label: 'Overview', icon: ChartBarIcon },
    { id: 'followers', label: 'Followers', icon: UsersIcon },
    { id: 'execute', label: 'Execute Trade', icon: PlayIcon },
    { id: 'results', label: 'Trade Results', icon: ClipboardDocumentListIcon },
    { id: 'settings', label: 'Settings', icon: Cog6ToothIcon },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-white text-xl font-bold">Copy Trade</h2>
        <p className="text-slate-400 text-sm mt-1">Manage Investoft copy trading system</p>
      </div>

      {/* Provider Info Banner */}
      {!providerLoading && provider && (
        <div className="bg-[#1e293b] border border-slate-700 rounded-xl px-5 py-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-black text-sm">IV</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white font-semibold">{provider.name}</div>
            <div className="text-slate-400 text-xs">{provider.description ?? 'Official Investoft Copy Trade'}</div>
          </div>
          <div className="flex items-center gap-4 flex-shrink-0">
            <div className="text-center">
              <div className="text-emerald-400 font-bold">{provider.win_rate}%</div>
              <div className="text-slate-500 text-[10px]">Win Rate</div>
            </div>
            <div className="text-center">
              <div className="text-white font-bold">${Number(provider.min_balance_usd).toLocaleString()}</div>
              <div className="text-slate-500 text-[10px]">Min Balance</div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-700 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-400' :'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && <OverviewTab />}
      {activeTab === 'followers' && <FollowersTab />}
      {activeTab === 'execute' && <ExecuteTradeTab providerId={provider?.id ?? ''} />}
      {activeTab === 'results' && <TradeResultsTab />}
      {activeTab === 'settings' && <SettingsTab provider={provider} onSaved={fetchProvider} />}
    </div>
  );
}
