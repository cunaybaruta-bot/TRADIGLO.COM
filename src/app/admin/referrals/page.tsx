'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  UsersIcon,
  CurrencyDollarIcon,
  ClockIcon,
  CheckCircleIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import Icon from '@/components/ui/AppIcon';


interface ReferralRow {
  id: string;
  referrer_id: string;
  referred_id: string;
  referral_code: string;
  deposit_amount: number;
  reward_amount: number;
  status: 'pending' | 'completed' | 'paid';
  created_at: string;
  referrer_email?: string;
  referred_email?: string;
}

interface ReferralStats {
  totalReferrals: number;
  totalRewardAmount: number;
  pendingRewards: number;
  paidRewards: number;
}

const StatusBadge = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    completed: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    paid: 'bg-green-500/10 text-green-400 border-green-500/20',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${colors[status] || 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
      {status?.toUpperCase()}
    </span>
  );
};

export default function AdminReferralsPage() {
  const [referrals, setReferrals] = useState<ReferralRow[]>([]);
  const [stats, setStats] = useState<ReferralStats>({
    totalReferrals: 0,
    totalRewardAmount: 0,
    pendingRewards: 0,
    paidRewards: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchReferrals = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();

    // Fetch referrals with referrer and referred user emails via join
    const { data: referralData, error } = await supabase
      .from('referrals')
      .select(`
        id,
        referrer_id,
        referred_id,
        referral_code,
        deposit_amount,
        reward_amount,
        status,
        created_at,
        referrer:users!referrals_referrer_id_fkey(email),
        referred:users!referrals_referred_id_fkey(email)
      `)
      .order('created_at', { ascending: false });

    if (!error && referralData) {
      const rows: ReferralRow[] = referralData.map((r: any) => ({
        id: r.id,
        referrer_id: r.referrer_id,
        referred_id: r.referred_id,
        referral_code: r.referral_code,
        deposit_amount: Number(r.deposit_amount ?? 0),
        reward_amount: Number(r.reward_amount ?? 0),
        status: r.status,
        created_at: r.created_at,
        referrer_email: r.referrer?.email ?? r.referrer_id,
        referred_email: r.referred?.email ?? r.referred_id,
      }));

      setReferrals(rows);

      setStats({
        totalReferrals: rows.length,
        totalRewardAmount: rows.reduce((s, r) => s + r.reward_amount, 0),
        pendingRewards: rows
          .filter((r) => r.status === 'pending' || r.status === 'completed')
          .reduce((s, r) => s + r.reward_amount, 0),
        paidRewards: rows
          .filter((r) => r.status === 'paid')
          .reduce((s, r) => s + r.reward_amount, 0),
      });
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchReferrals();
  }, [fetchReferrals]);

  const handleStatusChange = async (id: string, newStatus: 'pending' | 'completed' | 'paid') => {
    setUpdatingId(id);
    const supabase = createClient();
    await supabase.from('referrals').update({ status: newStatus }).eq('id', id);
    await fetchReferrals();
    setUpdatingId(null);
  };

  const filtered = referrals.filter((r) => {
    const matchSearch =
      !search ||
      r.referrer_email?.toLowerCase().includes(search.toLowerCase()) ||
      r.referred_email?.toLowerCase().includes(search.toLowerCase()) ||
      r.referral_code?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const statCards = [
    {
      label: 'Total Referrals',
      value: stats.totalReferrals.toLocaleString(),
      icon: UsersIcon,
      color: 'text-blue-400',
      bg: 'bg-blue-400/10',
      border: 'border-blue-400/20',
    },
    {
      label: 'Total Rewards',
      value: `$${stats.totalRewardAmount.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: CurrencyDollarIcon,
      color: 'text-emerald-400',
      bg: 'bg-emerald-400/10',
      border: 'border-emerald-400/20',
    },
    {
      label: 'Pending Rewards',
      value: `$${stats.pendingRewards.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: ClockIcon,
      color: 'text-yellow-400',
      bg: 'bg-yellow-400/10',
      border: 'border-yellow-400/20',
    },
    {
      label: 'Paid Rewards',
      value: `$${stats.paidRewards.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: CheckCircleIcon,
      color: 'text-green-400',
      bg: 'bg-green-400/10',
      border: 'border-green-400/20',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white text-xl font-bold">Referral Management</h2>
          <p className="text-slate-400 text-sm mt-1">View and manage member referrals, rewards, and payment status</p>
        </div>
        <button
          onClick={fetchReferrals}
          className="flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm transition-colors"
        >
          <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color, bg, border }) => (
          <div key={label} className={`bg-[#1e293b] rounded-xl p-5 border ${border}`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-slate-400 text-xs">{label}</span>
              <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
            </div>
            <div className={`text-white text-xl font-bold ${color}`}>{value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-[#1e293b] rounded-xl p-4 border border-slate-700">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by email or referral code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#0f172a] border border-slate-600 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-[#0f172a] border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="paid">Paid</option>
          </select>
        </div>
      </div>

      {/* Referrals Table */}
      <div className="bg-[#1e293b] rounded-xl border border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-slate-700">
          <h3 className="text-white font-semibold text-sm">
            Referral List{' '}
            <span className="text-slate-400 font-normal">({filtered.length} records)</span>
          </h3>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-slate-400 text-sm">Loading referrals...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500">
            <UsersIcon className="w-10 h-10 mb-3 opacity-40" />
            <p className="text-sm">No referrals found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700 text-slate-400 text-xs uppercase tracking-wider">
                  <th className="text-left px-4 py-3">Referrer</th>
                  <th className="text-left px-4 py-3">Referred Member</th>
                  <th className="text-left px-4 py-3">Referral Code</th>
                  <th className="text-right px-4 py-3">Deposit</th>
                  <th className="text-right px-4 py-3">Reward</th>
                  <th className="text-center px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Date</th>
                  <th className="text-center px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {filtered.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-700/20 transition-colors">
                    <td className="px-4 py-3 text-slate-300 text-xs max-w-[160px] truncate">
                      {row.referrer_email}
                    </td>
                    <td className="px-4 py-3 text-slate-300 text-xs max-w-[160px] truncate">
                      {row.referred_email}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded">
                        {row.referral_code}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-300 text-xs">
                      ${row.deposit_amount.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-right text-emerald-400 text-xs font-medium">
                      ${row.reward_amount.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
                      {new Date(row.created_at).toLocaleDateString('en', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <select
                        value={row.status}
                        disabled={updatingId === row.id}
                        onChange={(e) =>
                          handleStatusChange(row.id, e.target.value as 'pending' | 'completed' | 'paid')
                        }
                        className="px-2 py-1 bg-[#0f172a] border border-slate-600 rounded text-xs text-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
                      >
                        <option value="pending">Pending</option>
                        <option value="completed">Completed</option>
                        <option value="paid">Paid</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
