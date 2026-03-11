'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { MagnifyingGlassIcon, PencilSquareIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface WalletEntry {
  id: string;
  user_id: string;
  real_balance: number;
  demo_balance: number;
  currency: string;
  updated_at: string;
  users?: { email: string; full_name: string | null };
}

export default function WalletsPage() {
  const [wallets, setWallets] = useState<WalletEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');
  const [editWallet, setEditWallet] = useState<{ id: string; field: 'real_balance' | 'demo_balance'; value: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchWallets = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('wallets')
      .select('id, user_id, real_balance, demo_balance, currency, updated_at, users(email, full_name)')
      .order('updated_at', { ascending: false });
    setWallets((data as any) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchWallets(); }, [fetchWallets]);

  const handleSave = async () => {
    if (!editWallet) return;
    setSaving(true);
    const supabase = createClient();
    await supabase.from('wallets').update({ [editWallet.field]: parseFloat(editWallet.value) }).eq('id', editWallet.id);
    setMessage('Wallet updated successfully');
    setEditWallet(null);
    fetchWallets();
    setSaving(false);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleResetDemo = async (id: string) => {
    const supabase = createClient();
    await supabase.from('wallets').update({ demo_balance: 10000 }).eq('id', id);
    setMessage('Demo balance reset to $10,000');
    fetchWallets();
    setTimeout(() => setMessage(''), 3000);
  };

  const filtered = wallets.filter((w) => {
    const email = (w.users as any)?.email || '';
    return email.toLowerCase().includes(search.toLowerCase());
  });

  const totalReal = wallets.reduce((s, w) => s + Number(w.real_balance), 0);
  const totalDemo = wallets.reduce((s, w) => s + Number(w.demo_balance), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-white text-xl font-bold">Wallet Management</h2>
          <p className="text-slate-400 text-sm mt-1">{wallets.length} wallets</p>
        </div>
        <div className="relative">
          <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Search by email..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="bg-[#1e293b] border border-slate-700 text-white text-sm rounded-lg pl-9 pr-4 py-2 w-64 focus:outline-none focus:border-[#22c55e] placeholder-slate-500" />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#1e293b] rounded-xl p-5 border border-slate-700">
          <div className="text-slate-400 text-xs mb-1">Total Wallets</div>
          <div className="text-white text-2xl font-bold">{wallets.length}</div>
        </div>
        <div className="bg-[#1e293b] rounded-xl p-5 border border-green-400/20">
          <div className="text-slate-400 text-xs mb-1">Total Real Balance</div>
          <div className="text-green-400 text-2xl font-bold">${totalReal.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>
        <div className="bg-[#1e293b] rounded-xl p-5 border border-blue-400/20">
          <div className="text-slate-400 text-xs mb-1">Total Demo Balance</div>
          <div className="text-blue-400 text-2xl font-bold">${totalDemo.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>
      </div>

      {message && (
        <div className="bg-green-500/10 border border-green-500/20 text-green-400 text-sm px-4 py-2 rounded-lg">{message}</div>
      )}

      {/* Edit Modal */}
      {editWallet && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-[#1e293b] rounded-xl border border-slate-700 p-6 w-full max-w-sm">
            <h3 className="text-white font-semibold mb-4">Edit {editWallet.field === 'real_balance' ? 'Real' : 'Demo'} Balance</h3>
            <input type="number" value={editWallet.value} onChange={(e) => setEditWallet({ ...editWallet, value: e.target.value })}
              className="w-full bg-[#0f172a] border border-slate-600 text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-[#22c55e] mb-4" />
            <div className="flex gap-2">
              <button onClick={handleSave} disabled={saving}
                className="flex-1 bg-[#22c55e] text-black text-sm font-medium py-2 rounded-lg hover:bg-green-400 transition-colors disabled:opacity-50">
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button onClick={() => setEditWallet(null)}
                className="flex-1 bg-slate-700 text-slate-300 text-sm py-2 rounded-lg hover:bg-slate-600 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-[#1e293b] rounded-xl border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left text-slate-400 text-xs font-medium px-5 py-3">User</th>
                <th className="text-left text-slate-400 text-xs font-medium px-5 py-3">Real Balance</th>
                <th className="text-left text-slate-400 text-xs font-medium px-5 py-3">Demo Balance</th>
                <th className="text-left text-slate-400 text-xs font-medium px-5 py-3">Currency</th>
                <th className="text-left text-slate-400 text-xs font-medium px-5 py-3">Last Updated</th>
                <th className="text-left text-slate-400 text-xs font-medium px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {loading && <tr><td colSpan={6} className="text-center text-slate-500 text-sm py-8">Loading...</td></tr>}
              {!loading && filtered.length === 0 && <tr><td colSpan={6} className="text-center text-slate-500 text-sm py-8">No wallets found</td></tr>}
              {filtered.map((w) => (
                <tr key={w.id} className="hover:bg-slate-700/20 transition-colors">
                  <td className="px-5 py-3 text-white text-sm">{(w.users as any)?.email || w.user_id.slice(0, 12) + '...'}</td>
                  <td className="px-5 py-3 text-green-400 text-sm font-semibold">${Number(w.real_balance).toFixed(2)}</td>
                  <td className="px-5 py-3 text-blue-400 text-sm font-semibold">${Number(w.demo_balance).toFixed(2)}</td>
                  <td className="px-5 py-3 text-slate-400 text-sm">{w.currency || 'USD'}</td>
                  <td className="px-5 py-3 text-slate-400 text-sm">{new Date(w.updated_at).toLocaleString()}</td>
                  <td className="px-5 py-3">
                    <div className="flex gap-1.5 flex-wrap">
                      <button onClick={() => setEditWallet({ id: w.id, field: 'real_balance', value: String(w.real_balance) })}
                        className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 transition-colors">
                        <PencilSquareIcon className="w-3 h-3" /> Real
                      </button>
                      <button onClick={() => setEditWallet({ id: w.id, field: 'demo_balance', value: String(w.demo_balance) })}
                        className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-colors">
                        <PencilSquareIcon className="w-3 h-3" /> Demo
                      </button>
                      <button onClick={() => handleResetDemo(w.id)}
                        className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors">
                        <ArrowPathIcon className="w-3 h-3" /> Reset
                      </button>
                    </div>
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
