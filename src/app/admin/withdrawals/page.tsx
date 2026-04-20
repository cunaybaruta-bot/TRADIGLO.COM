'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

interface Withdrawal {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  destination_address: string | null;
  payment_method: string | null;
  status: string;
  created_at: string;
  users?: { email: string };
}

const StatusBadge = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    approved: 'bg-green-500/10 text-green-400 border-green-500/20',
    completed: 'bg-green-500/10 text-green-400 border-green-500/20',
    rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${colors[status] || 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
      {status}
    </span>
  );
};

export default function WithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [message, setMessage] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchWithdrawals = useCallback(async () => {
    const supabase = createClient();
    let query = supabase
      .from('withdrawals')
      .select('id, user_id, amount, currency, destination_address, payment_method, status, created_at, users(email)')
      .order('created_at', { ascending: false });
    if (filter !== 'all') query = query.eq('status', filter);
    const { data } = await query;
    setWithdrawals((data as any) || []);
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    fetchWithdrawals();
  }, [fetchWithdrawals]);

  const handleAction = async (id: string, status: 'approved' | 'rejected') => {
    setProcessing(id);
    const supabase = createClient();
    await supabase.from('withdrawals').update({ status }).eq('id', id);
    setMessage(`Withdrawal ${status}`);
    fetchWithdrawals();
    setProcessing(null);
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-white text-xl font-bold">Withdrawals</h2>
          <p className="text-slate-400 text-sm mt-1">{withdrawals.length} records</p>
        </div>
        <div className="flex gap-2">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${filter === f ? 'bg-[#22c55e] text-black' : 'bg-[#1e293b] text-slate-400 border border-slate-700 hover:text-white'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {message && (
        <div className="bg-green-500/10 border border-green-500/20 text-green-400 text-sm px-4 py-2 rounded-lg">
          {message}
        </div>
      )}

      <div className="bg-[#1e293b] rounded-xl border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left text-slate-400 text-xs font-medium px-5 py-3">User</th>
                <th className="text-left text-slate-400 text-xs font-medium px-5 py-3">Amount</th>
                <th className="text-left text-slate-400 text-xs font-medium px-5 py-3">Method</th>
                <th className="text-left text-slate-400 text-xs font-medium px-5 py-3">Wallet Address</th>
                <th className="text-left text-slate-400 text-xs font-medium px-5 py-3">Status</th>
                <th className="text-left text-slate-400 text-xs font-medium px-5 py-3">Date</th>
                <th className="text-left text-slate-400 text-xs font-medium px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {loading && (
                <tr><td colSpan={7} className="text-center text-slate-500 text-sm py-8">Loading...</td></tr>
              )}
              {!loading && withdrawals.length === 0 && (
                <tr><td colSpan={7} className="text-center text-slate-500 text-sm py-8">No withdrawals found</td></tr>
              )}
              {withdrawals.map((w) => (
                <tr key={w.id} className="hover:bg-slate-700/20 transition-colors">
                  <td className="px-5 py-3 text-white text-sm">{(w.users as any)?.email || w.user_id.slice(0, 12) + '...'}</td>
                  <td className="px-5 py-3 text-orange-400 text-sm font-semibold">${Number(w.amount).toFixed(2)}</td>
                  <td className="px-5 py-3 text-slate-300 text-sm">{w.payment_method || '—'}</td>
                  <td className="px-5 py-3 text-slate-400 text-xs font-mono max-w-[140px] truncate">{w.destination_address || '—'}</td>
                  <td className="px-5 py-3"><StatusBadge status={w.status} /></td>
                  <td className="px-5 py-3 text-slate-400 text-sm">{new Date(w.created_at).toLocaleString()}</td>
                  <td className="px-5 py-3">
                    {w.status === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAction(w.id, 'approved')}
                          disabled={processing === w.id}
                          className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 transition-colors disabled:opacity-50"
                        >
                          <CheckCircleIcon className="w-3 h-3" /> Approve
                        </button>
                        <button
                          onClick={() => handleAction(w.id, 'rejected')}
                          disabled={processing === w.id}
                          className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                        >
                          <XCircleIcon className="w-3 h-3" /> Reject
                        </button>
                      </div>
                    )}
                    {w.status !== 'pending' && <span className="text-slate-600 text-xs">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
