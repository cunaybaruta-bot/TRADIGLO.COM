'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { UsersIcon, CurrencyDollarIcon, ClockIcon, CheckCircleIcon, MagnifyingGlassIcon, ArrowPathIcon, ArrowDownTrayIcon, ChevronLeftIcon, ChevronRightIcon, XMarkIcon, ExclamationTriangleIcon, ArrowTopRightOnSquareIcon,  } from '@heroicons/react/24/outline';

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

interface ConfirmModal {
  open: boolean;
  ids: string[];
  newStatus: 'pending' | 'completed' | 'paid';
  isBulk: boolean;
}

interface DrillDownReferrer {
  id: string;
  email: string;
  rows: ReferralRow[];
}

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

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

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Date range filter
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<'pending' | 'completed' | 'paid'>('paid');

  // Confirm modal
  const [confirmModal, setConfirmModal] = useState<ConfirmModal>({
    open: false,
    ids: [],
    newStatus: 'paid',
    isBulk: false,
  });

  // Drill-down view
  const [drillDown, setDrillDown] = useState<DrillDownReferrer | null>(null);

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

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
    setSelectedIds(new Set());
  }, [search, statusFilter, dateFrom, dateTo]);

  const applyFilters = (rows: ReferralRow[]) => {
    return rows.filter((r) => {
      const matchSearch =
        !search ||
        r.referrer_email?.toLowerCase().includes(search.toLowerCase()) ||
        r.referred_email?.toLowerCase().includes(search.toLowerCase()) ||
        r.referral_code?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'all' || r.status === statusFilter;
      const rowDate = new Date(r.created_at);
      const matchFrom = !dateFrom || rowDate >= new Date(dateFrom);
      const matchTo = !dateTo || rowDate <= new Date(dateTo + 'T23:59:59');
      return matchSearch && matchStatus && matchFrom && matchTo;
    });
  };

  const filtered = applyFilters(referrals);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Bulk select helpers
  const allPageSelected = paginated.length > 0 && paginated.every((r) => selectedIds.has(r.id));
  const someSelected = selectedIds.size > 0;

  const toggleSelectAll = () => {
    if (allPageSelected) {
      const next = new Set(selectedIds);
      paginated.forEach((r) => next.delete(r.id));
      setSelectedIds(next);
    } else {
      const next = new Set(selectedIds);
      paginated.forEach((r) => next.add(r.id));
      setSelectedIds(next);
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  // Confirm + execute status update
  const requestStatusChange = (ids: string[], newStatus: 'pending' | 'completed' | 'paid', isBulk: boolean) => {
    setConfirmModal({ open: true, ids, newStatus, isBulk });
  };

  const executeStatusChange = async () => {
    const { ids, newStatus } = confirmModal;
    setConfirmModal((m) => ({ ...m, open: false }));
    if (ids.length === 1) setUpdatingId(ids[0]);
    const supabase = createClient();
    for (const id of ids) {
      await supabase.from('referrals').update({ status: newStatus }).eq('id', id);
    }
    setSelectedIds(new Set());
    setUpdatingId(null);
    await fetchReferrals();
    // Refresh drill-down if open
    if (drillDown) {
      setDrillDown((prev) => {
        if (!prev) return null;
        const updatedRows = prev.rows.map((r) =>
          ids.includes(r.id) ? { ...r, status: newStatus } : r
        );
        return { ...prev, rows: updatedRows };
      });
    }
  };

  // Export CSV
  const exportCSV = () => {
    const rows = filtered;
    const headers = ['Referrer Email', 'Referred Email', 'Affiliate Code', 'Deposit Amount', 'Reward Amount', 'Reward Rate (%)', 'Status', 'Date'];
    const csvRows = rows.map((r) => {
      const rate = r.deposit_amount > 0 ? ((r.reward_amount / r.deposit_amount) * 100).toFixed(2) : '0.00';
      return [
        r.referrer_email ?? '',
        r.referred_email ?? '',
        r.referral_code ?? '',
        r.deposit_amount.toFixed(2),
        r.reward_amount.toFixed(2),
        rate,
        r.status,
        new Date(r.created_at).toLocaleDateString('en'),
      ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',');
    });
    const csv = [headers.join(','), ...csvRows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `affiliates_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Drill-down
  const openDrillDown = (referrerId: string, referrerEmail: string) => {
    const rows = referrals.filter((r) => r.referrer_id === referrerId);
    setDrillDown({ id: referrerId, email: referrerEmail, rows });
  };

  const statCards = [
    {
      label: 'Total Affiliates',
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
          <h2 className="text-white text-xl font-bold">Affiliate Management</h2>
          <p className="text-slate-400 text-sm mt-1">View and manage member affiliates, rewards, and payment status</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm transition-colors"
          >
            <ArrowDownTrayIcon className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={fetchReferrals}
            className="flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm transition-colors"
          >
            <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: StatIcon, color, bg, border }) => (
          <div key={label} className={`bg-[#1e293b] rounded-xl p-5 border ${border}`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-slate-400 text-xs">{label}</span>
              <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}>
                <StatIcon className={`w-4 h-4 ${color}`} />
              </div>
            </div>
            <div className={`text-white text-xl font-bold ${color}`}>{value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-[#1e293b] rounded-xl p-4 border border-slate-700">
        <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[180px]">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by email or affiliate code..."
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
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-3 py-2 bg-[#0f172a] border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
            />
            <span className="text-slate-500 text-xs">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-3 py-2 bg-[#0f172a] border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
            />
            {(dateFrom || dateTo) && (
              <button
                onClick={() => { setDateFrom(''); setDateTo(''); }}
                className="p-1.5 text-slate-400 hover:text-white transition-colors"
                title="Clear date filter"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {someSelected && (
        <div className="bg-blue-600/10 border border-blue-500/30 rounded-xl px-4 py-3 flex flex-wrap items-center gap-3">
          <span className="text-blue-400 text-sm font-medium">{selectedIds.size} row(s) selected</span>
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-slate-400 text-xs">Change status to:</span>
            <select
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value as 'pending' | 'completed' | 'paid')}
              className="px-2 py-1 bg-[#0f172a] border border-slate-600 rounded text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="paid">Paid</option>
            </select>
            <button
              onClick={() => requestStatusChange(Array.from(selectedIds), bulkStatus, true)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-medium transition-colors"
            >
              Apply to Selected
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="p-1.5 text-slate-400 hover:text-white transition-colors"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Affiliates Table */}
      <div className="bg-[#1e293b] rounded-xl border border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-slate-700 flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-white font-semibold text-sm">
            Affiliate List{' '}
            <span className="text-slate-400 font-normal">({filtered.length} records)</span>
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-xs">Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
              className="px-2 py-1 bg-[#0f172a] border border-slate-600 rounded text-xs text-white focus:outline-none focus:border-blue-500"
            >
              {PAGE_SIZE_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-slate-400 text-sm">Loading affiliates...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500">
            <UsersIcon className="w-10 h-10 mb-3 opacity-40" />
            <p className="text-sm">No affiliates found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700 text-slate-400 text-xs uppercase tracking-wider">
                  <th className="px-4 py-3 w-8">
                    <input
                      type="checkbox"
                      checked={allPageSelected}
                      onChange={toggleSelectAll}
                      className="rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-0 focus:ring-offset-0"
                    />
                  </th>
                  <th className="text-left px-4 py-3">Referrer</th>
                  <th className="text-left px-4 py-3">Referred Member</th>
                  <th className="text-left px-4 py-3">Affiliate Code</th>
                  <th className="text-right px-4 py-3">Deposit</th>
                  <th className="text-right px-4 py-3">Reward</th>
                  <th className="text-right px-4 py-3">Rate</th>
                  <th className="text-center px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Date</th>
                  <th className="text-center px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {paginated.map((row) => {
                  const rewardRate = row.deposit_amount > 0
                    ? ((row.reward_amount / row.deposit_amount) * 100).toFixed(1)
                    : '—';
                  return (
                    <tr key={row.id} className={`hover:bg-slate-700/20 transition-colors ${selectedIds.has(row.id) ? 'bg-blue-500/5' : ''}`}>
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(row.id)}
                          onChange={() => toggleSelect(row.id)}
                          className="rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-0 focus:ring-offset-0"
                        />
                      </td>
                      <td className="px-4 py-3 text-slate-300 text-xs max-w-[160px] truncate">
                        {row.referrer_email}
                        <a
                          href={`/admin/users?search=${encodeURIComponent(row.referrer_email ?? '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-slate-500 hover:text-slate-300 flex-shrink-0 transition-colors"
                          title="View user detail"
                        >
                          <ArrowTopRightOnSquareIcon className="w-3 h-3" />
                        </a>
                      </td>
                      <td className="px-4 py-3 text-slate-300 text-xs max-w-[160px] truncate">
                        {row.referred_email}
                        <a
                          href={`/admin/users?search=${encodeURIComponent(row.referred_email ?? '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-slate-500 hover:text-slate-300 flex-shrink-0 transition-colors"
                          title="View user detail"
                        >
                          <ArrowTopRightOnSquareIcon className="w-3 h-3" />
                        </a>
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
                      <td className="px-4 py-3 text-right text-xs text-slate-400">
                        {rewardRate !== '—' ? `${rewardRate}%` : '—'}
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
                            requestStatusChange([row.id], e.target.value as 'pending' | 'completed' | 'paid', false)
                          }
                          className="px-2 py-1 bg-[#0f172a] border border-slate-600 rounded text-xs text-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
                        >
                          <option value="pending">Pending</option>
                          <option value="completed">Completed</option>
                          <option value="paid">Paid</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && filtered.length > 0 && (
          <div className="px-4 py-3 border-t border-slate-700 flex flex-wrap items-center justify-between gap-3">
            <span className="text-slate-400 text-xs">
              Showing {Math.min((currentPage - 1) * pageSize + 1, filtered.length)}–{Math.min(currentPage * pageSize, filtered.length)} of {filtered.length}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="px-2 py-1 text-xs text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
              >
                «
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
              >
                <ChevronLeftIcon className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let page: number;
                if (totalPages <= 5) {
                  page = i + 1;
                } else if (currentPage <= 3) {
                  page = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  page = totalPages - 4 + i;
                } else {
                  page = currentPage - 2 + i;
                }
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-2.5 py-1 rounded text-xs transition-colors ${
                      currentPage === page
                        ? 'bg-blue-600 text-white' :'text-slate-400 hover:text-white hover:bg-slate-700'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
              >
                <ChevronRightIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="px-2 py-1 text-xs text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
              >
                »
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Drill-Down Modal */}
      {drillDown && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#1e293b] rounded-2xl border border-slate-700 w-full max-w-3xl max-h-[80vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-slate-700">
              <div>
                <h3 className="text-white font-semibold">Affiliates by {drillDown.email}</h3>
                <p className="text-slate-400 text-xs mt-0.5">{drillDown.rows.length} affiliate(s) total</p>
              </div>
              <button
                onClick={() => setDrillDown(null)}
                className="p-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-700"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-auto flex-1">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-[#1e293b]">
                  <tr className="border-b border-slate-700 text-slate-400 text-xs uppercase tracking-wider">
                    <th className="text-left px-4 py-3">Referred Member</th>
                    <th className="text-left px-4 py-3">Code</th>
                    <th className="text-right px-4 py-3">Deposit</th>
                    <th className="text-right px-4 py-3">Reward</th>
                    <th className="text-right px-4 py-3">Rate</th>
                    <th className="text-center px-4 py-3">Status</th>
                    <th className="text-left px-4 py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {drillDown.rows.map((row) => {
                    const rate = row.deposit_amount > 0
                      ? ((row.reward_amount / row.deposit_amount) * 100).toFixed(1)
                      : '—';
                    return (
                      <tr key={row.id} className="hover:bg-slate-700/20 transition-colors">
                        <td className="px-4 py-3 text-slate-300 text-xs max-w-[160px]">
                          <div className="flex items-center gap-1">
                            <span className="truncate max-w-[120px]">{row.referred_email}</span>
                            <a
                              href={`/admin/users?search=${encodeURIComponent(row.referred_email ?? '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-slate-500 hover:text-slate-300 flex-shrink-0 transition-colors"
                            >
                              <ArrowTopRightOnSquareIcon className="w-3 h-3" />
                            </a>
                          </div>
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
                        <td className="px-4 py-3 text-right text-xs text-slate-400">
                          {rate !== '—' ? `${rate}%` : '—'}
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
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Status Change Modal */}
      {confirmModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#1e293b] rounded-2xl border border-slate-700 w-full max-w-sm shadow-2xl p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center flex-shrink-0">
                <ExclamationTriangleIcon className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Confirm Status Change</h3>
                <p className="text-slate-400 text-sm mt-1">
                  {confirmModal.isBulk
                    ? `Change status of ${confirmModal.ids.length} selected affiliate(s) to `
                    : 'Change status of this affiliate to '}
                  <span className="text-white font-medium uppercase">{confirmModal.newStatus}</span>?
                </p>
                <p className="text-slate-500 text-xs mt-1">This action will be saved immediately to the database.</p>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmModal((m) => ({ ...m, open: false }))}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={executeStatusChange}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
