'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import {
  UsersIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  ChartBarIcon,
  UserCircleIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import Icon from '@/components/ui/AppIcon';


interface StatsData {
  totalUsers: number;
  activeTraders: number;
  totalDeposits: number;
  totalWithdrawals: number;
  activeTrades: number;
  platformProfit: number;
}

interface RecentDeposit {
  id: string;
  user_id: string;
  amount: number;
  payment_method: string;
  status: string;
  created_at: string;
  users?: { email: string };
}

interface RecentWithdrawal {
  id: string;
  user_id: string;
  amount: number;
  status: string;
  created_at: string;
  users?: { email: string };
}

interface RecentTrade {
  id: string;
  user_id: string;
  order_type: string;
  amount: number;
  result: string | null;
  profit: number | null;
  opened_at: string;
  assets?: { symbol: string };
  users?: { email: string };
}

interface ChartPoint {
  label: string;
  deposits: number;
  withdrawals: number;
  volume: number;
  profit: number;
}

const StatusBadge = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    approved: 'bg-green-500/10 text-green-400 border-green-500/20',
    completed: 'bg-green-500/10 text-green-400 border-green-500/20',
    rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
    failed: 'bg-red-500/10 text-red-400 border-red-500/20',
    open: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    win: 'bg-green-500/10 text-green-400 border-green-500/20',
    loss: 'bg-red-500/10 text-red-400 border-red-500/20',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${colors[status] || 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
      {status?.toUpperCase()}
    </span>
  );
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<StatsData>({ totalUsers: 0, activeTraders: 0, totalDeposits: 0, totalWithdrawals: 0, activeTrades: 0, platformProfit: 0 });
  const [recentDeposits, setRecentDeposits] = useState<RecentDeposit[]>([]);
  const [recentWithdrawals, setRecentWithdrawals] = useState<RecentWithdrawal[]>([]);
  const [recentTrades, setRecentTrades] = useState<RecentTrade[]>([]);
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const supabase = createClient();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [
      { count: usersCount },
      { data: activeTraderData },
      { data: depositsData },
      { data: withdrawalsData },
      { count: activeTradesCount },
      { data: profitData },
      { data: recentDep },
      { data: recentWith },
      { data: recentTrd },
    ] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('trades').select('user_id').gte('opened_at', sevenDaysAgo.toISOString()),
      supabase.from('deposits').select('amount').eq('status', 'completed'),
      supabase.from('withdrawals').select('amount').eq('status', 'approved'),
      supabase.from('trades').select('*', { count: 'exact', head: true }).eq('status', 'open'),
      supabase.from('trades').select('profit').eq('result', 'win'),
      supabase.from('deposits').select('id, user_id, amount, payment_method, status, created_at, users(email)').order('created_at', { ascending: false }).limit(5),
      supabase.from('withdrawals').select('id, user_id, amount, status, created_at, users(email)').order('created_at', { ascending: false }).limit(5),
      supabase.from('trades').select('id, user_id, order_type, amount, result, profit, opened_at, assets(symbol), users(email)').order('opened_at', { ascending: false }).limit(5),
    ]);

    const uniqueTraders = new Set(activeTraderData?.map((t) => t.user_id) || []);
    const totalDep = depositsData?.reduce((s, d) => s + Number(d.amount), 0) || 0;
    const totalWith = withdrawalsData?.reduce((s, w) => s + Number(w.amount), 0) || 0;
    const platformProfit = profitData?.reduce((s, t) => s + Number(t.profit || 0), 0) || 0;

    setStats({
      totalUsers: usersCount || 0,
      activeTraders: uniqueTraders.size,
      totalDeposits: totalDep,
      totalWithdrawals: totalWith,
      activeTrades: activeTradesCount || 0,
      platformProfit,
    });

    setRecentDeposits((recentDep as any) || []);
    setRecentWithdrawals((recentWith as any) || []);
    setRecentTrades((recentTrd as any) || []);

    // Build last 7 days chart data
    const days: ChartPoint[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const label = d.toLocaleDateString('default', { weekday: 'short', month: 'short', day: 'numeric' });
      const start = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString();
      const end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59).toISOString();

      const [{ data: depDay }, { data: withDay }, { data: tradeDay }, { data: profitDay }] = await Promise.all([
        supabase.from('deposits').select('amount').gte('created_at', start).lte('created_at', end),
        supabase.from('withdrawals').select('amount').gte('created_at', start).lte('created_at', end),
        supabase.from('trades').select('amount').gte('opened_at', start).lte('opened_at', end),
        supabase.from('trades').select('profit').eq('result', 'win').gte('opened_at', start).lte('opened_at', end),
      ]);

      days.push({
        label: d.toLocaleDateString('default', { weekday: 'short' }),
        deposits: depDay?.reduce((s, d) => s + Number(d.amount), 0) || 0,
        withdrawals: withDay?.reduce((s, w) => s + Number(w.amount), 0) || 0,
        volume: tradeDay?.reduce((s, t) => s + Number(t.amount), 0) || 0,
        profit: profitDay?.reduce((s, t) => s + Number(t.profit || 0), 0) || 0,
      });
    }
    setChartData(days);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers.toLocaleString(), icon: UsersIcon, color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20' },
    { label: 'Active Traders', value: stats.activeTraders.toLocaleString(), icon: UserCircleIcon, color: 'text-cyan-400', bg: 'bg-cyan-400/10', border: 'border-cyan-400/20', sub: 'Last 7 days' },
    { label: 'Total Deposits', value: `$${stats.totalDeposits.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: ArrowDownTrayIcon, color: 'text-green-400', bg: 'bg-green-400/10', border: 'border-green-400/20', sub: 'Approved' },
    { label: 'Total Withdrawals', value: `$${stats.totalWithdrawals.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: ArrowUpTrayIcon, color: 'text-orange-400', bg: 'bg-orange-400/10', border: 'border-orange-400/20', sub: 'Approved' },
    { label: 'Active Trades', value: stats.activeTrades.toLocaleString(), icon: ChartBarIcon, color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/20', sub: 'Open now' },
    { label: 'Platform Profit', value: `$${stats.platformProfit.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: CurrencyDollarIcon, color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20', sub: 'From wins' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400 text-sm">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-white text-xl font-bold">Dashboard</h2>
        <p className="text-slate-400 text-sm mt-1">Investoft Trading Platform Overview</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 gap-4">
        {statCards.map(({ label, value, icon: Icon, color, bg, border, sub }) => (
          <div key={label} className={`bg-[#1e293b] rounded-xl p-5 border ${border || 'border-slate-700'}`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-slate-400 text-xs">{label}</span>
              <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
            </div>
            <div className={`text-white text-xl font-bold ${color}`}>{value}</div>
            {sub && <div className="text-slate-500 text-xs mt-1">{sub}</div>}
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Trading Volume */}
        <div className="bg-[#1e293b] rounded-xl p-5 border border-slate-700">
          <h3 className="text-white font-semibold mb-4 text-sm">Trading Volume (Last 7 Days)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }} labelStyle={{ color: '#e2e8f0' }} formatter={(value: number) => [`$${value.toFixed(2)}`, '']} />
              <Bar dataKey="volume" name="Volume" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Deposit vs Withdrawal */}
        <div className="bg-[#1e293b] rounded-xl p-5 border border-slate-700">
          <h3 className="text-white font-semibold mb-4 text-sm">Deposit vs Withdrawal (Last 7 Days)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }} labelStyle={{ color: '#e2e8f0' }} formatter={(value: number) => [`$${value.toFixed(2)}`, '']} />
              <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 11 }} />
              <Bar dataKey="deposits" name="Deposits" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="withdrawals" name="Withdrawals" fill="#f97316" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Profit Trend */}
      <div className="bg-[#1e293b] rounded-xl p-5 border border-slate-700">
        <h3 className="text-white font-semibold mb-4 text-sm">Profit Trend (Last 7 Days)</h3>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
            <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }} labelStyle={{ color: '#e2e8f0' }} formatter={(value: number) => [`$${value.toFixed(2)}`, 'Profit']} />
            <Line type="monotone" dataKey="profit" name="Profit" stroke="#22c55e" strokeWidth={2} dot={{ fill: '#22c55e', r: 3 }} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Tables */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Recent Deposits */}
        <div className="bg-[#1e293b] rounded-xl border border-slate-700 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
            <h3 className="text-white font-semibold text-sm">Recent Deposits</h3>
            <Link href="/admin/deposits" className="text-[#22c55e] text-xs hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-slate-700/50">
            {recentDeposits.length === 0 && <div className="px-5 py-4 text-slate-500 text-sm">No deposits yet</div>}
            {recentDeposits.map((d) => (
              <div key={d.id} className="px-5 py-3 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-white text-xs font-medium truncate">{(d.users as any)?.email || d.user_id.slice(0, 8)}</div>
                  <div className="text-slate-400 text-xs">{d.payment_method || 'N/A'}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-green-400 text-xs font-semibold">${Number(d.amount).toFixed(2)}</div>
                  <StatusBadge status={d.status} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Withdrawals */}
        <div className="bg-[#1e293b] rounded-xl border border-slate-700 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
            <h3 className="text-white font-semibold text-sm">Recent Withdrawals</h3>
            <Link href="/admin/withdrawals" className="text-[#22c55e] text-xs hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-slate-700/50">
            {recentWithdrawals.length === 0 && <div className="px-5 py-4 text-slate-500 text-sm">No withdrawals yet</div>}
            {recentWithdrawals.map((w) => (
              <div key={w.id} className="px-5 py-3 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-white text-xs font-medium truncate">{(w.users as any)?.email || w.user_id.slice(0, 8)}</div>
                  <div className="text-slate-400 text-xs">{new Date(w.created_at).toLocaleDateString()}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-orange-400 text-xs font-semibold">${Number(w.amount).toFixed(2)}</div>
                  <StatusBadge status={w.status} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Trades */}
        <div className="bg-[#1e293b] rounded-xl border border-slate-700 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
            <h3 className="text-white font-semibold text-sm">Recent Trades</h3>
            <Link href="/admin/trades" className="text-[#22c55e] text-xs hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-slate-700/50">
            {recentTrades.length === 0 && <div className="px-5 py-4 text-slate-500 text-sm">No trades yet</div>}
            {recentTrades.map((t) => (
              <div key={t.id} className="px-5 py-3 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-white text-xs font-medium truncate">{(t.users as any)?.email || t.user_id.slice(0, 8)}</div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-slate-400 text-xs font-mono">{(t.assets as any)?.symbol || '—'}</span>
                    <span className={`text-xs font-semibold ${t.order_type === 'buy' ? 'text-green-400' : 'text-red-400'}`}>{t.order_type?.toUpperCase()}</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-white text-xs font-semibold">${Number(t.amount).toFixed(2)}</div>
                  {t.result ? <StatusBadge status={t.result} /> : <StatusBadge status="open" />}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
