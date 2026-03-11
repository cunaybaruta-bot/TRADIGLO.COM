'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { MagnifyingGlassIcon, PencilSquareIcon, ArrowPathIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface WalletEntry {
  id: string;
  user_id: string;
  real_balance: number;
  demo_balance: number;
  currency: string;
  updated_at: string;
  users?: { email: string; full_name: string | null };
}

export default function EditBalancePage() {
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
    setMessage('Balance updated successfully');
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Edit Balance</h1>
        <p className="text-gray-400 text-sm mt-1">Manually edit real and demo wallet balances</p>
      </div>

      {message && (
        <div className="bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-lg text-sm">{message}</div>
      )}

      <div className="bg-[#0f1629] border border-white/10 rounded-xl p-4">
        <div className="relative mb-4">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading wallets...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-gray-400 text-left">
                  <th className="pb-3 font-medium">User</th>
                  <th className="pb-3 font-medium">Real Balance</th>
                  <th className="pb-3 font-medium">Demo Balance</th>
                  <th className="pb-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((w) => (
                  <tr key={w.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3">
                      <div className="text-white">{(w.users as any)?.email || w.user_id.slice(0, 8)}</div>
                      <div className="text-gray-500 text-xs">{w.currency}</div>
                    </td>
                    <td className="py-3">
                      {editWallet?.id === w.id && editWallet.field === 'real_balance' ? (
                        <div className="flex items-center gap-2">
                          <input type="number" value={editWallet.value} onChange={(e) => setEditWallet({ ...editWallet, value: e.target.value })}
                            className="w-28 px-2 py-1 bg-white/10 border border-blue-500 rounded text-white text-sm focus:outline-none" />
                          <button onClick={handleSave} disabled={saving} className="text-green-400 hover:text-green-300"><CheckIcon className="w-4 h-4" /></button>
                          <button onClick={() => setEditWallet(null)} className="text-red-400 hover:text-red-300"><XMarkIcon className="w-4 h-4" /></button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-green-400 font-medium">${Number(w.real_balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                          <button onClick={() => setEditWallet({ id: w.id, field: 'real_balance', value: String(w.real_balance) })} className="text-gray-500 hover:text-blue-400">
                            <PencilSquareIcon className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="py-3">
                      {editWallet?.id === w.id && editWallet.field === 'demo_balance' ? (
                        <div className="flex items-center gap-2">
                          <input type="number" value={editWallet.value} onChange={(e) => setEditWallet({ ...editWallet, value: e.target.value })}
                            className="w-28 px-2 py-1 bg-white/10 border border-blue-500 rounded text-white text-sm focus:outline-none" />
                          <button onClick={handleSave} disabled={saving} className="text-green-400 hover:text-green-300"><CheckIcon className="w-4 h-4" /></button>
                          <button onClick={() => setEditWallet(null)} className="text-red-400 hover:text-red-300"><XMarkIcon className="w-4 h-4" /></button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-blue-400 font-medium">${Number(w.demo_balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                          <button onClick={() => setEditWallet({ id: w.id, field: 'demo_balance', value: String(w.demo_balance) })} className="text-gray-500 hover:text-blue-400">
                            <PencilSquareIcon className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="py-3">
                      <button onClick={() => handleResetDemo(w.id)}
                        className="flex items-center gap-1 px-3 py-1 bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 rounded-lg text-xs font-medium transition-colors">
                        <ArrowPathIcon className="w-3 h-3" /> Reset Demo
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="text-center py-8 text-gray-500">No wallets found</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
