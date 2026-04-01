'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Deposit {
  id: string;
  user_id: string;
  amount: number;
  status: string;
  payment_method: string | null;
  created_at: string;
  users?: { email: string };
}

export default function DepositReportsPage() {
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetchDeposits = useCallback(async () => {
    const supabase = createClient();
    let query = supabase.from('deposits').select('id, user_id, amount, status, payment_method, created_at, users(email)').order('created_at', { ascending: false });
    if (dateFrom) query = query.gte('created_at', dateFrom);
    if (dateTo) query = query.lte('created_at', dateTo + 'T23:59:59');
    const { data } = await query;
    setDeposits((data as any) || []);
    setLoading(false);
  }, [dateFrom, dateTo]);

  useEffect(() => { fetchDeposits(); }, [fetchDeposits]);

  const total = deposits.reduce((s, d) => s + Number(d.amount), 0);
  const approved = deposits.filter((d) => d.status === 'completed');
  const pending = deposits.filter((d) => d.status === 'pending');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Deposit Reports</h1>
        <p className="text-gray-400 text-sm mt-1">Detailed deposit activity and statistics</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#0f1629] border border-white/10 rounded-xl p-4">
          <div className="text-gray-400 text-sm">Total Deposits</div>
          <div className="text-2xl font-bold text-green-400 mt-1">${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
          <div className="text-gray-500 text-xs mt-1">{deposits.length} transactions</div>
        </div>
        <div className="bg-[#0f1629] border border-white/10 rounded-xl p-4">
          <div className="text-gray-400 text-sm">Approved</div>
          <div className="text-2xl font-bold text-blue-400 mt-1">{approved.length}</div>
          <div className="text-gray-500 text-xs mt-1">${approved.reduce((s, d) => s + Number(d.amount), 0).toLocaleString()}</div>
        </div>
        <div className="bg-[#0f1629] border border-white/10 rounded-xl p-4">
          <div className="text-gray-400 text-sm">Pending</div>
          <div className="text-2xl font-bold text-yellow-400 mt-1">{pending.length}</div>
          <div className="text-gray-500 text-xs mt-1">${pending.reduce((s, d) => s + Number(d.amount), 0).toLocaleString()}</div>
        </div>
      </div>

      <div className="bg-[#0f1629] border border-white/10 rounded-xl p-4">
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="flex items-center gap-2">
            <label className="text-gray-400 text-sm">From:</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
              className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-gray-400 text-sm">To:</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
              className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500" />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading deposits...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-gray-400 text-left">
                  <th className="pb-3 font-medium">User</th>
                  <th className="pb-3 font-medium">Amount</th>
                  <th className="pb-3 font-medium">Method</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {deposits.map((d) => (
                  <tr key={d.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 text-white">{(d.users as any)?.email || d.user_id.slice(0, 8)}</td>
                    <td className="py-3 text-green-400 font-medium">${Number(d.amount).toLocaleString()}</td>
                    <td className="py-3 text-gray-300">{d.payment_method || '—'}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
                        d.status === 'completed' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                        d.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
                      }`}>{d.status}</span>
                    </td>
                    <td className="py-3 text-gray-400">{new Date(d.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {deposits.length === 0 && <div className="text-center py-8 text-gray-500">No deposits found</div>}
          </div>
        )}
      </div>
    </div>
  );
}
