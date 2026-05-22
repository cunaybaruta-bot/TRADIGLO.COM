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
  ArrowTrendingUpIcon,
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

const STATUS_CONFIG: Record<string, { classes: string; dot: string }> = {
  pending:   { classes: 'bg-amber-500/10 text-amber-400 border-amber-500/25',   dot: 'bg-amber-400' },
  approved:  { classes: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25', dot: 'bg-emerald-400' },
  completed: { classes: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25', dot: 'bg-emerald-400' },
  rejected:  { classes: 'bg-red-500/10 text-red-400 border-red-500/25',         dot: 'bg-red-400' },
  failed:    { classes: 'bg-red-500/10 text-red-400 border-red-500/25',         dot: 'bg-red-400' },
  open:      { classes: 'bg-blue-500/10 text-blue-400 border-blue-500/25',      dot: 'bg-blue-400' },
  win:       { classes: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25', dot: 'bg-emerald-400' },
  loss:      { classes: 'bg-red-500/10 text-red-400 border-red-500/25',         dot: 'bg-red-400' },
};

const StatusBadge = ({ status }: { status: string }) => {
  const cfg = STATUS_CONFIG[status] || { classes: 'bg-slate-500/10 text-slate-400 border-slate-500/25', dot: 'bg-slate-400' };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${cfg.classes}`}>
      <span className={`w-1 h-1 rounded-full ${cfg.dot}`} />
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
      usersResult, activeTraderResult, depositsResult, withdrawalsResult,
      activeTradesResult, profitResult, recentDepResult, recentWithResult, recentTrdResult,
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

    const uniqueTraders = new Set(activeTraderResult.data?.map((t) => t.user_id) || []);
    const totalDep = depositsResult.data?.reduce((s, d) => s + Number(d.amount), 0) || 0;
    const totalWith = withdrawalsResult.data?.reduce((s, w) => s + Number(w.amount), 0) || 0;
    const platformProfit = profitResult.data?.reduce((s, t) => s + Number(t.profit || 0), 0) || 0;

    setStats({
      totalUsers: usersResult.count || 0,
      activeTraders: uniqueTraders.size,
      totalDeposits: totalDep,
      totalWithdrawals: totalWith,
      activeTrades: activeTradesResult.count || 0,
      platformProfit,
    });

    setRecentDeposits((recentDepResult.data as any) || []);
    setRecentWithdrawals((recentWithResult.data as any) || []);
    setRecentTrades((recentTrdResult.data as any) || []);

    const days: ChartPoint[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const start = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString();
      const end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59).toISOString();

      const [depDayResult, withDayResult, tradeDayResult, profitDayResult] = await Promise.all([
        supabase.from('deposits').select('amount').gte('created_at', start).lte('created_at', end),
        supabase.from('withdrawals').select('amount').gte('created_at', start).lte('created_at', end),
        supabase.from('trades').select('amount').gte('opened_at', start).lte('opened_at', end),
        supabase.from('trades').select('profit').eq('result', 'win').gte('opened_at', start).lte('opened_at', end),
      ]);

      days.push({
        label: d.toLocaleDateString('default', { weekday: 'short' }),
        deposits: depDayResult.data?.reduce((s, d) => s + Number(d.amount), 0) || 0,
        withdrawals: withDayResult.data?.reduce((s, w) => s + Number(w.amount), 0) || 0,
        volume: tradeDayResult.data?.reduce((s, t) => s + Number(t.amount), 0) || 0,
        profit: profitDayResult.data?.reduce((s, t) => s + Number(t.profit || 0), 0) || 0,
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
    {
      label: 'Total Users',
      value: stats.totalUsers.toLocaleString(),
      icon: UsersIcon,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
      href: '/admin/users',
    },
    {
      label: 'Active Traders',
      value: stats.activeTraders.toLocaleString(),
      icon: UserCircleIcon,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10',
      border: 'border-cyan-500/20',
      sub: 'Last 7 days',
      href: '/admin/users/activity',
    },
    {
      label: 'Total Deposits',
      value: `$${stats.totalDeposits.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: ArrowDownTrayIcon,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      sub: 'Approved only',
      href: '/admin/deposits',
    },
    {
      label: 'Total Withdrawals',
      value: `$${stats.totalWithdrawals.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: ArrowUpTrayIcon,
      color: 'text-orange-400',
      bg: 'bg-orange-500/10',
      border: 'border-orange-500/20',
      sub: 'Approved only',
      href: '/admin/withdrawals',
    },
    {
      label: 'Active Trades',
      value: stats.activeTrades.toLocaleString(),
      icon: ChartBarIcon,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/20',
      sub: 'Open now',
      href: '/admin/trades',
    },
    {
      label: 'Platform Profit',
      value: `$${stats.platformProfit.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: CurrencyDollarIcon,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      sub: 'From wins',
      href: '/admin/reports/profit',
    },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <div className="text-slate-500 text-sm">Loading dashboard data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white text-lg font-bold">Dashboard Overview</h2>
          <p className="text-slate-500 text-sm mt-0.5">Tradiglo Trading Platform — real-time metrics</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/8 border border-blue-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          <span className="text-blue-400 text-xs font-medium">Live</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {statCards.map(({ label, value, icon: Icon, color, bg, border, sub, href }) => (
          <Link
            key={label}
            href={href}
            className={`bg-[#0a0f1e] rounded-xl p-4 border ${border} hover:border-opacity-60 hover:bg-white/3 transition-all group`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <ArrowTrendingUpIcon className="w-3.5 h-3.5 text-slate-700 group-hover:text-slate-500 transition-colors" />
            </div>
            <div className={`text-xl font-bold ${color} leading-tight`}>{value}</div>
            <div className="text-slate-500 text-[11px] mt-1 font-medium">{label}</div>
            {sub && <div className="text-slate-600 text-[10px] mt-0.5">{sub}</div>}
          </Link>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-[#0a0f1e] rounded-xl p-5 border border-white/8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-white font-semibold text-sm">Trading Volume</h3>
              <p className="text-slate-600 text-[11px] mt-0.5">Last 7 days</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#060a14', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px' }}
                labelStyle={{ color: '#e2e8f0', fontSize: 12 }}
                formatter={(value: number) => [`$${value.toFixed(2)}`, '']}
              />
              <Bar dataKey="volume" name="Volume" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-[#0a0f1e] rounded-xl p-5 border border-white/8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-white font-semibold text-sm">Deposits vs Withdrawals</h3>
              <p className="text-slate-600 text-[11px] mt-0.5">Last 7 days</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#060a14', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px' }}
                labelStyle={{ color: '#e2e8f0', fontSize: 12 }}
                formatter={(value: number) => [`$${value.toFixed(2)}`, '']}
              />
              <Legend wrapperStyle={{ color: '#64748b', fontSize: 11 }} />
              <Bar dataKey="deposits" name="Deposits" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="withdrawals" name="Withdrawals" fill="#f97316" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Profit Trend */}
      <div className="bg-[#0a0f1e] rounded-xl p-5 border border-white/8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-white font-semibold text-sm">Profit Trend</h3>
            <p className="text-slate-600 text-[11px] mt-0.5">Last 7 days</p>
          </div>
          <Link href="/admin/reports/profit" className="text-blue-400 text-xs hover:underline">View report →</Link>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
            <Tooltip
              contentStyle={{ backgroundColor: '#060a14', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px' }}
              labelStyle={{ color: '#e2e8f0', fontSize: 12 }}
              formatter={(value: number) => [`$${value.toFixed(2)}`, 'Profit']}
            />
            <Line type="monotone" dataKey="profit" name="Profit" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1', r: 3 }} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Recent Deposits */}
        <div className="bg-[#0a0f1e] rounded-xl border border-white/8 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/8">
            <div className="flex items-center gap-2">
              <ArrowDownTrayIcon className="w-4 h-4 text-emerald-400" />
              <h3 className="text-white font-semibold text-sm">Recent Deposits</h3>
            </div>
            <Link href="/admin/deposits" className="text-blue-400 text-xs hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-white/5">
            {recentDeposits.length === 0 && (
              <div className="px-5 py-6 text-center text-slate-600 text-sm">No deposits yet</div>
            )}
            {recentDeposits.map((d) => (
              <div key={d.id} className="px-5 py-3 flex items-center justify-between gap-2 hover:bg-white/3 transition-colors">
                <div className="min-w-0 flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-emerald-400 text-[9px] font-bold">
                      {((d.users as any)?.email || 'U').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="text-white text-xs font-medium truncate">{(d.users as any)?.email || d.user_id.slice(0, 8)}</div>
                    <div className="text-slate-600 text-[10px]">{d.payment_method || 'N/A'}</div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-emerald-400 text-xs font-bold">${Number(d.amount).toFixed(2)}</div>
                  <StatusBadge status={d.status} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Withdrawals */}
        <div className="bg-[#0a0f1e] rounded-xl border border-white/8 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/8">
            <div className="flex items-center gap-2">
              <ArrowUpTrayIcon className="w-4 h-4 text-orange-400" />
              <h3 className="text-white font-semibold text-sm">Recent Withdrawals</h3>
            </div>
            <Link href="/admin/withdrawals" className="text-blue-400 text-xs hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-white/5">
            {recentWithdrawals.length === 0 && (
              <div className="px-5 py-6 text-center text-slate-600 text-sm">No withdrawals yet</div>
            )}
            {recentWithdrawals.map((w) => (
              <div key={w.id} className="px-5 py-3 flex items-center justify-between gap-2 hover:bg-white/3 transition-colors">
                <div className="min-w-0 flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-orange-400 text-[9px] font-bold">
                      {((w.users as any)?.email || 'U').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="text-white text-xs font-medium truncate">{(w.users as any)?.email || w.user_id.slice(0, 8)}</div>
                    <div className="text-slate-600 text-[10px]">{new Date(w.created_at).toLocaleDateString()}</div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-orange-400 text-xs font-bold">${Number(w.amount).toFixed(2)}</div>
                  <StatusBadge status={w.status} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Trades */}
        <div className="bg-[#0a0f1e] rounded-xl border border-white/8 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/8">
            <div className="flex items-center gap-2">
              <ChartBarIcon className="w-4 h-4 text-purple-400" />
              <h3 className="text-white font-semibold text-sm">Recent Trades</h3>
            </div>
            <Link href="/admin/trades" className="text-blue-400 text-xs hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-white/5">
            {recentTrades.length === 0 && (
              <div className="px-5 py-6 text-center text-slate-600 text-sm">No trades yet</div>
            )}
            {recentTrades.map((t) => (
              <div key={t.id} className="px-5 py-3 flex items-center justify-between gap-2 hover:bg-white/3 transition-colors">
                <div className="min-w-0 flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-purple-400 text-[9px] font-bold">
                      {((t.users as any)?.email || 'U').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="text-white text-xs font-medium truncate">{(t.users as any)?.email || t.user_id.slice(0, 8)}</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-slate-500 text-[10px] font-mono">{(t.assets as any)?.symbol || '—'}</span>
                      <span className={`text-[10px] font-bold ${t.order_type === 'buy' ? 'text-emerald-400' : 'text-red-400'}`}>
                        {t.order_type?.toUpperCase()}
                      </span>
                    </div>
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
