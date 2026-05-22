'use client';

import { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { createClient } from '@/lib/supabase/client';
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ArrowUpTrayIcon,
  FunnelIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';

interface Withdrawal {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  destination_address: string | null;
  payment_method: string | null;
  status: string;
  admin_note: string | null;
  processed_at: string | null;
  created_at: string;
  updated_at: string;
  users?: { email: string; full_name: string | null };
}

const STATUS_CONFIG: Record<string, { label: string; classes: string; dot: string }> = {
  pending:   { label: 'Pending',   classes: 'bg-amber-500/10 text-amber-400 border-amber-500/25',   dot: 'bg-amber-400' },
  approved:  { label: 'Approved',  classes: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25', dot: 'bg-emerald-400' },
  completed: { label: 'Completed', classes: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25', dot: 'bg-emerald-400' },
  rejected:  { label: 'Rejected',  classes: 'bg-red-500/10 text-red-400 border-red-500/25',   dot: 'bg-red-400' },
};

const StatusBadge = ({ status }: { status: string }) => {
  const cfg = STATUS_CONFIG[status] || { label: status, classes: 'bg-slate-500/10 text-slate-400 border-slate-500/25', dot: 'bg-slate-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${cfg.classes}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
};

interface DetailModalProps {
  withdrawal: Withdrawal;
  onClose: () => void;
  onAction: (w: Withdrawal, action: 'approved' | 'rejected') => void;
}

function DetailModal({ withdrawal, onClose, onAction }: DetailModalProps) {
  const userEmail = (withdrawal.users as any)?.email || withdrawal.user_id.slice(0, 16) + '...';
  const userName = (withdrawal.users as any)?.full_name;
  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <div
        className="bg-[#0a0f1e] border border-white/10 rounded-2xl p-6 w-full max-w-lg shadow-2xl shadow-black/60"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/15 border border-orange-500/25 flex items-center justify-center">
              <ArrowUpTrayIcon className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h3 className="text-white font-bold text-base">Withdrawal Details</h3>
              <p className="text-slate-500 text-xs mt-0.5">ID: {withdrawal.id.slice(0, 16)}...</p>
            </div>
          </div>
          <StatusBadge status={withdrawal.status} />
        </div>

        <div className="space-y-3 mb-5">
          <div className="bg-white/5 rounded-xl border border-white/8 p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-slate-500 text-[11px] uppercase tracking-wider mb-1">Member</p>
                <p className="text-white text-sm font-medium truncate">{userName || userEmail}</p>
                {userName && <p className="text-slate-500 text-xs truncate">{userEmail}</p>}
              </div>
              <div>
                <p className="text-slate-500 text-[11px] uppercase tracking-wider mb-1">Amount</p>
                <p className="text-orange-400 text-xl font-bold">${Number(withdrawal.amount).toFixed(2)}</p>
                <p className="text-slate-500 text-xs">{withdrawal.currency}</p>
              </div>
              <div>
                <p className="text-slate-500 text-[11px] uppercase tracking-wider mb-1">Method</p>
                <p className="text-slate-300 text-sm">{withdrawal.payment_method || '—'}</p>
              </div>
              <div>
                <p className="text-slate-500 text-[11px] uppercase tracking-wider mb-1">Requested</p>
                <p className="text-slate-300 text-sm">{new Date(withdrawal.created_at).toLocaleDateString()}</p>
                <p className="text-slate-500 text-xs">{new Date(withdrawal.created_at).toLocaleTimeString()}</p>
              </div>
            </div>
            {withdrawal.destination_address && (
              <div className="mt-3 pt-3 border-t border-white/8">
                <p className="text-slate-500 text-[11px] uppercase tracking-wider mb-1">Destination Address</p>
                <p className="text-slate-300 text-xs font-mono bg-black/30 px-2 py-1.5 rounded-lg break-all">{withdrawal.destination_address}</p>
              </div>
            )}
            {withdrawal.admin_note && (
              <div className="mt-3 pt-3 border-t border-white/8">
                <p className="text-slate-500 text-[11px] uppercase tracking-wider mb-1">Admin Note</p>
                <p className="text-slate-300 text-sm">{withdrawal.admin_note}</p>
              </div>
            )}
            {withdrawal.processed_at && (
              <div className="mt-3 pt-3 border-t border-white/8">
                <p className="text-slate-500 text-[11px] uppercase tracking-wider mb-1">Processed At</p>
                <p className="text-slate-300 text-sm">{new Date(withdrawal.processed_at).toLocaleString()}</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-400 bg-white/5 border border-white/8 hover:text-white hover:bg-white/10 transition-all"
          >
            Close
          </button>
          {withdrawal.status === 'pending' && (
            <>
              <button
                onClick={() => { onClose(); onAction(withdrawal, 'approved'); }}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-all flex items-center justify-center gap-2"
              >
                <CheckCircleIcon className="w-4 h-4" /> Approve
              </button>
              <button
                onClick={() => { onClose(); onAction(withdrawal, 'rejected'); }}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-500 transition-all flex items-center justify-center gap-2"
              >
                <XCircleIcon className="w-4 h-4" /> Reject
              </button>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

interface ActionModalProps {
  withdrawal: Withdrawal;
  action: 'approved' | 'rejected';
  onConfirm: (id: string, action: 'approved' | 'rejected', note: string) => Promise<void>;
  onClose: () => void;
  processing: boolean;
}

function ActionModal({ withdrawal, action, onConfirm, onClose, processing }: ActionModalProps) {
  const [note, setNote] = useState('');
  const isApprove = action === 'approved';
  const userEmail = (withdrawal.users as any)?.email || withdrawal.user_id.slice(0, 16) + '...';

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="bg-[#0d1117] border border-white/10 rounded-xl w-full max-w-md shadow-2xl shadow-black/70 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 pt-4 pb-3 flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
            isApprove
              ? 'bg-blue-500/15 border border-blue-500/30' :'bg-red-500/15 border border-red-500/30'
          }`}>
            {isApprove
              ? <ArrowUpTrayIcon className="w-4 h-4 text-blue-400" />
              : <XCircleIcon className="w-4 h-4 text-red-400" />
            }
          </div>
          <div>
            <h3 className="text-white font-bold text-sm leading-tight">
              {isApprove ? 'Approve Withdrawal' : 'Reject Withdrawal'}
            </h3>
            <p className="text-slate-500 text-xs mt-0.5">{userEmail}</p>
          </div>
        </div>

        <div className="px-4 pb-4 space-y-2">
          {/* Amount + Method + Destination Card */}
          <div className="bg-white/[0.04] border border-white/10 rounded-lg overflow-hidden">
            <div className="flex items-start justify-between px-3 pt-2.5 pb-2">
              <div>
                <p className="text-slate-500 text-[10px] uppercase tracking-widest font-semibold mb-0.5">Amount</p>
                <p className="text-orange-400 text-xl font-extrabold leading-none">
                  ${Number(withdrawal.amount).toFixed(2)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-slate-500 text-[10px] uppercase tracking-widest font-semibold mb-0.5">Method</p>
                <p className="text-white text-sm font-semibold">{withdrawal.payment_method || '—'}</p>
              </div>
            </div>
            {withdrawal.destination_address && (
              <div className="border-t border-white/8 px-3 py-2">
                <p className="text-slate-500 text-[10px] uppercase tracking-widest font-semibold mb-1">Destination</p>
                <div className="bg-black/30 border border-white/8 rounded-md px-2.5 py-1.5">
                  <p className="text-slate-300 text-xs font-mono break-all leading-relaxed">
                    {withdrawal.destination_address}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Warning box for approve */}
          {isApprove && (
            <div className="flex items-start gap-2 bg-amber-500/8 border border-amber-500/25 rounded-lg px-3 py-2">
              <ExclamationTriangleIcon className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-amber-300 text-xs leading-relaxed">
                Approving will automatically deduct{' '}
                <strong className="text-amber-200 font-bold">${Number(withdrawal.amount).toFixed(2)}</strong>{' '}
                from the member&apos;s real balance.
              </p>
            </div>
          )}

          {/* Admin Note */}
          <div>
            <label className="flex items-center gap-2 text-[10px] text-slate-400 uppercase tracking-widest font-semibold mb-1">
              Admin Note
              {!isApprove
                ? <span className="text-red-400 normal-case tracking-normal text-xs font-normal">* required</span>
                : <span className="text-slate-600 normal-case tracking-normal text-xs font-normal">— optional</span>
              }
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={isApprove ? 'Add a note for the member (optional)...' : 'Reason for rejection (required)...'}
              rows={2}
              className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 resize-none transition-all"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-0.5">
            <button
              onClick={onClose}
              disabled={processing}
              className="flex-1 py-2 rounded-lg text-sm font-semibold text-slate-400 bg-white/[0.04] border border-white/10 hover:text-white hover:bg-white/10 transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={() => onConfirm(withdrawal.id, action, note)}
              disabled={processing || (!isApprove && !note.trim())}
              className={`flex-1 py-2 rounded-lg text-sm font-bold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg ${
                isApprove
                  ? 'bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 shadow-blue-500/20'
                  : 'bg-red-600 hover:bg-red-500 shadow-red-500/25'
              }`}
            >
              {processing ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : isApprove ? (
                'Approve & Deduct Balance'
              ) : (
                'Reject Withdrawal'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function WithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [allWithdrawals, setAllWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [processing, setProcessing] = useState(false);
  const [modalState, setModalState] = useState<{ withdrawal: Withdrawal; action: 'approved' | 'rejected' } | null>(null);
  const [detailModal, setDetailModal] = useState<Withdrawal | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchWithdrawals = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const supabase = createClient();

      // Verify admin session
      const { data: { user }, error: authErr } = await supabase.auth.getUser();
      if (authErr || !user) {
        setFetchError('Not authenticated. Please log in as admin.');
        setLoading(false);
        return;
      }

      // Fetch all withdrawals with user info
      const { data, error } = await supabase
        .from('withdrawals')
        .select('id, user_id, amount, currency, destination_address, payment_method, status, admin_note, processed_at, created_at, updated_at, users!withdrawals_user_id_fkey(email, full_name)')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[withdrawals] fetch error:', error);
        setFetchError(`Failed to load withdrawals: ${error.message}`);
        setLoading(false);
        return;
      }

      const rows = (data as Withdrawal[]) || [];
      setAllWithdrawals(rows);
    } catch (err: any) {
      console.error('[withdrawals] unexpected error:', err);
      setFetchError(err.message || 'Unexpected error loading withdrawals');
    } finally {
      setLoading(false);
    }
  }, []);

  // Apply filter + search client-side
  useEffect(() => {
    let filtered = allWithdrawals;
    if (filter !== 'all') {
      filtered = filtered.filter((w) => w.status === filter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter((w) =>
        (w.users as any)?.email?.toLowerCase().includes(q) ||
        (w.users as any)?.full_name?.toLowerCase().includes(q) ||
        w.payment_method?.toLowerCase().includes(q) ||
        w.destination_address?.toLowerCase().includes(q) ||
        w.id.toLowerCase().includes(q)
      );
    }
    setWithdrawals(filtered);
  }, [allWithdrawals, filter, search]);

  useEffect(() => {
    fetchWithdrawals();
  }, [fetchWithdrawals]);

  // Real-time subscription
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel('admin-withdrawals-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'withdrawals' }, () => {
        fetchWithdrawals();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchWithdrawals]);

  // Summary counts from ALL withdrawals (not filtered)
  const totalCount = allWithdrawals.length;
  const pendingCount = allWithdrawals.filter((w) => w.status === 'pending').length;
  const approvedCount = allWithdrawals.filter((w) => w.status === 'approved' || w.status === 'completed').length;
  const rejectedCount = allWithdrawals.filter((w) => w.status === 'rejected').length;
  const totalPendingAmount = allWithdrawals.filter((w) => w.status === 'pending').reduce((s, w) => s + Number(w.amount), 0);

  const handleAction = async (id: string, action: 'approved' | 'rejected', note: string) => {
    setProcessing(true);
    try {
      const res = await fetch('/api/admin/withdrawal-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action, admin_note: note }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Action failed');
      setMessage({
        text: `Withdrawal ${action === 'approved' ? 'approved' : 'rejected'} successfully. Member notified via email.`,
        type: 'success',
      });
      setModalState(null);
      fetchWithdrawals();
    } catch (err: any) {
      setMessage({ text: err.message || 'Action failed', type: 'error' });
    } finally {
      setProcessing(false);
      setTimeout(() => setMessage(null), 6000);
    }
  };

  const filterTabs: { key: 'all' | 'pending' | 'approved' | 'rejected'; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: totalCount },
    { key: 'pending', label: 'Pending', count: pendingCount },
    { key: 'approved', label: 'Approved', count: approvedCount },
    { key: 'rejected', label: 'Rejected', count: rejectedCount },
  ];

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-lg bg-orange-500/15 border border-orange-500/25 flex items-center justify-center">
              <ArrowUpTrayIcon className="w-4 h-4 text-orange-400" />
            </div>
            <h2 className="text-white text-lg font-bold">Withdrawals</h2>
            {pendingCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 text-[11px] font-bold border border-amber-500/25 animate-pulse">
                {pendingCount} pending
              </span>
            )}
          </div>
          <p className="text-slate-500 text-sm ml-10.5">Manage and process member withdrawal requests</p>
        </div>
        <button
          onClick={() => fetchWithdrawals()}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-400 bg-slate-800/60 border border-slate-700/60 hover:text-white hover:bg-slate-700/60 transition-all"
        >
          <ArrowPathIcon className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-[#0a0f1e] border border-white/8 rounded-xl p-4">
          <div className="text-slate-500 text-[11px] uppercase tracking-wider mb-1.5">Total Records</div>
          <div className="text-white text-xl font-bold">{totalCount}</div>
        </div>
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
          <div className="text-amber-500/70 text-[11px] uppercase tracking-wider mb-1.5">Pending</div>
          <div className="text-amber-400 text-xl font-bold">{pendingCount}</div>
          {totalPendingAmount > 0 && (
            <div className="text-amber-500/60 text-[10px] mt-0.5">${totalPendingAmount.toFixed(2)} total</div>
          )}
        </div>
        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
          <div className="text-emerald-500/70 text-[11px] uppercase tracking-wider mb-1.5">Approved</div>
          <div className="text-emerald-400 text-xl font-bold">{approvedCount}</div>
        </div>
        <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
          <div className="text-red-500/70 text-[11px] uppercase tracking-wider mb-1.5">Rejected</div>
          <div className="text-red-400 text-xl font-bold">{rejectedCount}</div>
        </div>
      </div>

      {/* Alert message */}
      {message && (
        <div className={`flex items-center gap-3 border text-sm px-4 py-3 rounded-xl ${message.type === 'success' ? 'bg-emerald-500/8 border-emerald-500/20 text-emerald-400' : 'bg-red-500/8 border-red-500/20 text-red-400'}`}>
          {message.type === 'success'
            ? <CheckCircleIcon className="w-4 h-4 flex-shrink-0" />
            : <XCircleIcon className="w-4 h-4 flex-shrink-0" />
          }
          {message.text}
        </div>
      )}

      {/* Fetch error */}
      {fetchError && (
        <div className="flex items-start gap-3 bg-red-500/8 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl">
          <ExclamationTriangleIcon className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Failed to load withdrawals</p>
            <p className="text-red-500/80 text-xs mt-0.5">{fetchError}</p>
          </div>
        </div>
      )}

      {/* Table Card */}
      <div className="bg-[#0a0f1e] rounded-xl border border-white/8 overflow-hidden">
        {/* Filter Tabs + Search */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 px-4 py-3 border-b border-white/8">
          <div className="flex items-center gap-1">
            <FunnelIcon className="w-3.5 h-3.5 text-slate-600 mr-1" />
            {filterTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                  filter === tab.key
                    ? 'bg-blue-500/15 text-blue-400 border border-blue-500/25' :'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    filter === tab.key ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-700 text-slate-400'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="relative ml-auto">
            <MagnifyingGlassIcon className="w-3.5 h-3.5 text-slate-600 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by email, method..."
              className="bg-white/5 border border-white/8 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-blue-500/50 w-52 transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/8">
                <th className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">User</th>
                <th className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Amount</th>
                <th className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Method</th>
                <th className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Destination</th>
                <th className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Status</th>
                <th className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Admin Note</th>
                <th className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Date</th>
                <th className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading && (
                <tr>
                  <td colSpan={8} className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-slate-500 text-sm">Loading withdrawals...</span>
                    </div>
                  </td>
                </tr>
              )}
              {!loading && !fetchError && withdrawals.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-slate-800/60 flex items-center justify-center">
                        <ArrowUpTrayIcon className="w-5 h-5 text-slate-600" />
                      </div>
                      <div>
                        <p className="text-slate-400 text-sm font-medium">No withdrawals found</p>
                        <p className="text-slate-600 text-xs mt-0.5">
                          {filter !== 'all' || search ?'Try changing the filter or search term' :'Withdrawal requests from members will appear here'}
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
              {!loading && withdrawals.map((w) => {
                const userEmail = (w.users as any)?.email || w.user_id.slice(0, 12) + '...';
                const userName = (w.users as any)?.full_name;
                const initials = (userName || userEmail).charAt(0).toUpperCase();
                return (
                  <tr
                    key={w.id}
                    className={`group hover:bg-slate-800/30 transition-colors ${w.status === 'pending' ? 'bg-amber-500/3' : ''}`}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-slate-700/60 flex items-center justify-center flex-shrink-0">
                          <span className="text-slate-300 text-[10px] font-bold">{initials}</span>
                        </div>
                        <div className="min-w-0">
                          {userName && <div className="text-white text-xs font-medium truncate max-w-[140px]">{userName}</div>}
                          <div className="text-slate-400 text-xs truncate max-w-[160px]">{userEmail}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-orange-400 text-sm font-bold">${Number(w.amount).toFixed(2)}</span>
                      <div className="text-slate-600 text-[10px]">{w.currency}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-slate-300 text-sm">{w.payment_method || <span className="text-slate-600">—</span>}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-slate-500 text-xs font-mono max-w-[130px] truncate block" title={w.destination_address || ''}>
                        {w.destination_address || <span className="text-slate-600">—</span>}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        {w.status === 'pending' && <ClockIcon className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />}
                        <StatusBadge status={w.status} />
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      {w.admin_note ? (
                        <span className="text-slate-400 text-xs truncate block max-w-[150px]" title={w.admin_note}>{w.admin_note}</span>
                      ) : (
                        <span className="text-slate-700 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="text-slate-400 text-xs">{new Date(w.created_at).toLocaleDateString()}</div>
                      {w.processed_at && (
                        <div className="text-slate-600 text-[10px] mt-0.5">
                          Processed {new Date(w.processed_at).toLocaleDateString()}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setDetailModal(w)}
                          className="flex items-center gap-1 text-xs px-2 py-1.5 rounded-lg bg-slate-700/40 text-slate-400 border border-slate-700/40 hover:bg-slate-700/60 hover:text-white transition-all"
                          title="View details"
                        >
                          <EyeIcon className="w-3.5 h-3.5" />
                        </button>
                        {w.status === 'pending' && (
                          <>
                            <button
                              onClick={() => setModalState({ withdrawal: w, action: 'approved' })}
                              className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 hover:border-emerald-500/40 transition-all font-medium"
                            >
                              <CheckCircleIcon className="w-3.5 h-3.5" /> Approve
                            </button>
                            <button
                              onClick={() => setModalState({ withdrawal: w, action: 'rejected' })}
                              className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/40 transition-all font-medium"
                            >
                              <XCircleIcon className="w-3.5 h-3.5" /> Reject
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer count */}
        {!loading && withdrawals.length > 0 && (
          <div className="px-5 py-3 border-t border-white/8 flex items-center justify-between">
            <span className="text-slate-600 text-xs">
              Showing {withdrawals.length} of {totalCount} withdrawal{totalCount !== 1 ? 's' : ''}
              {filter !== 'all' && ` (filtered: ${filter})`}
              {search && ` matching "${search}"`}
            </span>
            {pendingCount > 0 && (
              <span className="text-amber-400 text-xs font-medium">
                {pendingCount} request{pendingCount !== 1 ? 's' : ''} awaiting review
              </span>
            )}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {detailModal && (
        <DetailModal
          withdrawal={detailModal}
          onClose={() => setDetailModal(null)}
          onAction={(w, action) => setModalState({ withdrawal: w, action })}
        />
      )}

      {/* Action Modal */}
      {modalState && (
        <ActionModal
          withdrawal={modalState.withdrawal}
          action={modalState.action}
          onConfirm={handleAction}
          onClose={() => setModalState(null)}
          processing={processing}
        />
      )}
    </div>
  );
}
