'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { CurrencyDollarIcon, ChartBarIcon, BanknotesIcon, ArrowTrendingUpIcon,  } from '@heroicons/react/24/outline';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';

interface InvestmentStats {
  totalActive: number;
  totalCompleted: number;
  totalCapitalActive: number;
  totalCapitalAllTime: number;
  totalProfitPaid: number;
  totalPlatformFees: number;
  activeInvestors: number;
}

interface TierBreakdown {
  tier: string;
  count: number;
  capital: number;
  profit: number;
}

const TIER_COLORS: Record<string, string> = {
  basic: '#10b981',
  silver: '#cbd5e1',
  gold: '#f59e0b',
  diamond: '#38bdf8',
};

const TIER_LABELS: Record<string, string> = {
  basic: 'Basic',
  silver: 'Silver',
  gold: 'Gold',
  diamond: 'Diamond',
};

function fmt(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function AdminInvestmentPage() {
  const [stats, setStats] = useState<InvestmentStats>({
    totalActive: 0,
    totalCompleted: 0,
    totalCapitalActive: 0,
    totalCapitalAllTime: 0,
    totalProfitPaid: 0,
    totalPlatformFees: 0,
    activeInvestors: 0,
  });
  const [tierBreakdown, setTierBreakdown] = useState<TierBreakdown[]>([]);
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(async () => {
    const supabase = createClient();
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('investment_packages')
        .select('tier, capital_usd, net_profit_usd, platform_fee_usd, status, user_id');

      if (error) throw error;

      const rows = data || [];

      const active = rows.filter(r => r.status === 'active');
      const completed = rows.filter(r => r.status === 'completed');

      const uniqueActiveInvestors = new Set(active.map(r => r.user_id)).size;

      const totalCapitalActive = active.reduce((s, r) => s + Number(r.capital_usd), 0);
      const totalCapitalAllTime = rows.reduce((s, r) => s + Number(r.capital_usd), 0);
      const totalProfitPaid = completed.reduce((s, r) => s + Number(r.net_profit_usd), 0);
      const totalPlatformFees = completed.reduce((s, r) => s + Number(r.platform_fee_usd), 0);

      setStats({
        totalActive: active.length,
        totalCompleted: completed.length,
        totalCapitalActive,
        totalCapitalAllTime,
        totalProfitPaid,
        totalPlatformFees,
        activeInvestors: uniqueActiveInvestors,
      });

      // Tier breakdown
      const tierMap: Record<string, TierBreakdown> = {};
      for (const row of rows) {
        if (!tierMap[row.tier]) {
          tierMap[row.tier] = { tier: row.tier, count: 0, capital: 0, profit: 0 };
        }
        tierMap[row.tier].count += 1;
        tierMap[row.tier].capital += Number(row.capital_usd);
        tierMap[row.tier].profit += Number(row.net_profit_usd);
      }
      setTierBreakdown(Object.values(tierMap));
    } catch (err) {
      console.error('Failed to load investment stats:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  const statCards = [
    {
      label: 'Active Investments',
      value: stats.totalActive.toLocaleString(),
      icon: ChartBarIcon,
      color: '#22c55e',
      sub: `${stats.activeInvestors} unique investors`,
    },
    {
      label: 'Capital Under Management',
      value: fmt(stats.totalCapitalActive),
      icon: CurrencyDollarIcon,
      color: '#38bdf8',
      sub: `${fmt(stats.totalCapitalAllTime)} all-time`,
    },
    {
      label: 'Total Profit Paid Out',
      value: fmt(stats.totalProfitPaid),
      icon: ArrowTrendingUpIcon,
      color: '#f59e0b',
      sub: `${stats.totalCompleted} completed packages`,
    },
    {
      label: 'Platform Fees Earned',
      value: fmt(stats.totalPlatformFees),
      icon: BanknotesIcon,
      color: '#a78bfa',
      sub: '20% of gross profit',
    },
  ];

  const quickLinks = [
    { href: '/admin/investment/packages', label: 'Package Management', desc: 'Manage investment tiers & packages', icon: '📦' },
    { href: '/admin/investment/members', label: 'Active Members', desc: 'View all active investor accounts', icon: '👥' },
    { href: '/admin/investment/settlements', label: 'Profit & Settlements', desc: 'Manage payouts and settlements', icon: '💰' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Investment Control</h1>
          <p className="text-slate-400 text-sm mt-1">Overview of all investment activity on the platform</p>
        </div>
        <button
          onClick={loadStats}
          className="px-4 py-2 bg-[#22c55e]/10 border border-[#22c55e]/30 text-[#22c55e] rounded-lg text-sm hover:bg-[#22c55e]/20 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {quickLinks.map(link => (
          <Link
            key={link.href}
            href={link.href}
            className="bg-[#1e293b] border border-slate-700 rounded-xl p-4 hover:border-[#22c55e]/40 hover:bg-[#22c55e]/5 transition-all group"
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">{link.icon}</span>
              <span className="text-white font-semibold group-hover:text-[#22c55e] transition-colors">{link.label}</span>
            </div>
            <p className="text-slate-400 text-sm">{link.desc}</p>
          </Link>
        ))}
      </div>

      {/* Stats Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-[#1e293b] border border-slate-700 rounded-xl p-5 animate-pulse">
              <div className="h-4 bg-slate-700 rounded w-2/3 mb-3" />
              <div className="h-8 bg-slate-700 rounded w-1/2 mb-2" />
              <div className="h-3 bg-slate-700 rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map(card => (
            <div key={card.label} className="bg-[#1e293b] border border-slate-700 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-slate-400 text-sm">{card.label}</span>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${card.color}18` }}>
                  <card.icon className="w-5 h-5" style={{ color: card.color }} />
                </div>
              </div>
              <div className="text-2xl font-bold text-white mb-1">{card.value}</div>
              <div className="text-slate-500 text-xs">{card.sub}</div>
            </div>
          ))}
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tier Capital Bar Chart */}
        <div className="bg-[#1e293b] border border-slate-700 rounded-xl p-5">
          <h2 className="text-white font-semibold mb-4">Capital by Tier</h2>
          {tierBreakdown.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-slate-500 text-sm">No data available</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={tierBreakdown.map(t => ({ name: TIER_LABELS[t.tier] || t.tier, capital: t.capital, profit: t.profit }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={v => `$${(v/1000).toFixed(0)}K`} />
                <Tooltip
                  contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8 }}
                  labelStyle={{ color: '#e2e8f0' }}
                  formatter={(v: number) => [`$${v.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, '']}
                />
                <Bar dataKey="capital" name="Capital" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="profit" name="Profit Paid" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Tier Distribution Pie */}
        <div className="bg-[#1e293b] border border-slate-700 rounded-xl p-5">
          <h2 className="text-white font-semibold mb-4">Investment Distribution by Tier</h2>
          {tierBreakdown.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-slate-500 text-sm">No data available</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={tierBreakdown.map(t => ({ name: TIER_LABELS[t.tier] || t.tier, value: t.count }))}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {tierBreakdown.map((t) => (
                    <Cell key={t.tier} fill={TIER_COLORS[t.tier] || '#64748b'} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8 }}
                  formatter={(v: number) => [v, 'Packages']}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Tier Summary Table */}
      <div className="bg-[#1e293b] border border-slate-700 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-700">
          <h2 className="text-white font-semibold">Tier Summary</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left px-5 py-3 text-slate-400 font-medium">Tier</th>
                <th className="text-right px-5 py-3 text-slate-400 font-medium">Total Packages</th>
                <th className="text-right px-5 py-3 text-slate-400 font-medium">Total Capital</th>
                <th className="text-right px-5 py-3 text-slate-400 font-medium">Profit Paid</th>
              </tr>
            </thead>
            <tbody>
              {tierBreakdown.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-slate-500">No investment data found</td>
                </tr>
              ) : (
                tierBreakdown.map(t => (
                  <tr key={t.tier} className="border-b border-slate-700/50 hover:bg-slate-700/20">
                    <td className="px-5 py-3">
                      <span
                        className="px-2.5 py-1 rounded-full text-xs font-semibold capitalize"
                        style={{ background: `${TIER_COLORS[t.tier]}20`, color: TIER_COLORS[t.tier] }}
                      >
                        {TIER_LABELS[t.tier] || t.tier}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right text-white">{t.count.toLocaleString()}</td>
                    <td className="px-5 py-3 text-right text-white">{fmt(t.capital)}</td>
                    <td className="px-5 py-3 text-right text-[#22c55e]">{fmt(t.profit)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
