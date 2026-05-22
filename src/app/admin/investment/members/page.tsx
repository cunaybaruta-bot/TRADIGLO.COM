'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { MagnifyingGlassIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

type Tier = 'basic' | 'silver' | 'gold' | 'diamond';
type InvestmentStatus = 'active' | 'completed' | 'pending_payout';

interface MemberInvestment {
  id: string;
  user_id: string;
  tier: Tier;
  capital_usd: number;
  duration: string;
  gross_profit_usd: number;
  platform_fee_usd: number;
  net_profit_usd: number;
  status: InvestmentStatus;
  started_at: string;
  expires_at: string;
  completed_at: string | null;
  user_email?: string;
}

const TIER_COLORS: Record<Tier, string> = {
  basic: '#10b981',
  silver: '#cbd5e1',
  gold: '#f59e0b',
  diamond: '#38bdf8',
};

const TIER_LABELS: Record<Tier, string> = {
  basic: 'Basic',
  silver: 'Silver',
  gold: 'Gold',
  diamond: 'Diamond',
};

const STATUS_STYLES: Record<InvestmentStatus, string> = {
  active: 'bg-green-500/10 text-green-400 border border-green-500/20',
  completed: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  pending_payout: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
};

function fmt(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function getTimeRemaining(expiresAt: string): string {
  const secs = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
  if (secs <= 0) return 'Expired';
  const d = Math.floor(secs / 86400);
  const h = Math.floor((secs % 86400) / 3600);
  const m = Math.floor((secs % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`;
}

export default function AdminInvestmentMembersPage() {
  const [investments, setInvestments] = useState<MemberInvestment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<InvestmentStatus | 'all'>('all');
  const [tierFilter, setTierFilter] = useState<Tier | 'all'>('all');
  const [page, setPage] = useState(1);
  const [tick, setTick] = useState(0);
  const PAGE_SIZE = 20;

  const loadInvestments = useCallback(async () => {
    const supabase = createClient();
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('investment_packages')
        .select('*')
        .order('started_at', { ascending: false });

      if (error) throw error;

      const rows = data || [];

      // Fetch user emails
      const userIds = [...new Set(rows.map(r => r.user_id))];
      let emailMap: Record<string, string> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('users')
          .select('id, email')
          .in('id', userIds);
        (profiles || []).forEach((p: { id: string; email: string }) => {
          emailMap[p.id] = p.email;
        });
      }

      setInvestments(rows.map(r => ({ ...r, user_email: emailMap[r.user_id] || r.user_id.slice(0, 8) + '...' })));
    } catch (err) {
      console.error('Failed to load investments:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadInvestments(); }, [loadInvestments]);

  // Countdown tick
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const filtered = investments.filter(inv => {
    const matchSearch = !search || inv.user_email?.toLowerCase().includes(search.toLowerCase()) || inv.user_id.includes(search);
    const matchStatus = statusFilter === 'all' || inv.status === statusFilter;
    const matchTier = tierFilter === 'all' || inv.tier === tierFilter;
    return matchSearch && matchStatus && matchTier;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const summaryActive = investments.filter(i => i.status === 'active');
  const totalCapital = summaryActive.reduce((s, i) => s + Number(i.capital_usd), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Member Investments</h1>
          <p className="text-slate-400 text-sm mt-1">All investment packages across all members</p>
        </div>
        <button
          onClick={loadInvestments}
          className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-slate-300 rounded-lg text-sm hover:bg-slate-600"
        >
          <ArrowPathIcon className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Active Packages', value: summaryActive.length.toLocaleString(), color: '#22c55e' },
          { label: 'Active Capital', value: fmt(totalCapital), color: '#38bdf8' },
          { label: 'Completed', value: investments.filter(i => i.status === 'completed').length.toLocaleString(), color: '#a78bfa' },
          { label: 'Total Packages', value: investments.length.toLocaleString(), color: '#f59e0b' },
        ].map(s => (
          <div key={s.label} className="bg-[#1e293b] border border-slate-700 rounded-xl p-4">
            <div className="text-slate-400 text-xs mb-1">{s.label}</div>
            <div className="text-xl font-bold" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-[#1e293b] border border-slate-700 rounded-xl p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by email or user ID..."
            className="w-full bg-slate-800 border border-slate-600 rounded-lg pl-9 pr-3 py-2 text-white text-sm focus:outline-none focus:border-[#22c55e]"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value as InvestmentStatus | 'all'); setPage(1); }}
          className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#22c55e]"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="pending_payout">Pending Payout</option>
        </select>
        <select
          value={tierFilter}
          onChange={e => { setTierFilter(e.target.value as Tier | 'all'); setPage(1); }}
          className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#22c55e]"
        >
          <option value="all">All Tiers</option>
          <option value="basic">Basic</option>
          <option value="silver">Silver</option>
          <option value="gold">Gold</option>
          <option value="diamond">Diamond</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-[#1e293b] border border-slate-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Member</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Tier</th>
                <th className="text-right px-4 py-3 text-slate-400 font-medium">Capital</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Duration</th>
                <th className="text-right px-4 py-3 text-slate-400 font-medium">Gross Profit</th>
                <th className="text-right px-4 py-3 text-slate-400 font-medium">Net Profit</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Status</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Time Left</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Started</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i} className="border-b border-slate-700/50">
                    {[...Array(9)].map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-slate-700 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-slate-500">No investments found</td>
                </tr>
              ) : (
                paginated.map(inv => (
                  <tr key={inv.id} className="border-b border-slate-700/50 hover:bg-slate-700/20">
                    <td className="px-4 py-3">
                      <div className="text-white text-xs font-medium truncate max-w-[160px]">{inv.user_email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold capitalize" style={{ background: `${TIER_COLORS[inv.tier]}20`, color: TIER_COLORS[inv.tier] }}>
                        {TIER_LABELS[inv.tier]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-white font-medium">{fmt(inv.capital_usd)}</td>
                    <td className="px-4 py-3 text-slate-300 uppercase text-xs">{inv.duration}</td>
                    <td className="px-4 py-3 text-right text-slate-300">{fmt(inv.gross_profit_usd)}</td>
                    <td className="px-4 py-3 text-right text-[#22c55e] font-medium">{fmt(inv.net_profit_usd)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[inv.status]}`}>
                        {inv.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs tabular-nums">
                      {inv.status === 'active' ? getTimeRemaining(inv.expires_at) : '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{formatDate(inv.started_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-4 border-t border-slate-700 flex items-center justify-between">
            <span className="text-slate-400 text-sm">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 bg-slate-700 text-slate-300 rounded text-sm disabled:opacity-40 hover:bg-slate-600"
              >
                Prev
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 bg-slate-700 text-slate-300 rounded text-sm disabled:opacity-40 hover:bg-slate-600"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
