'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { MagnifyingGlassIcon, PencilSquareIcon, ArrowPathIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface WalletPair {
  user_id: string;
  email: string;
  full_name: string | null;
  real_wallet_id: string | null;
  real_balance: number;
  demo_wallet_id: string | null;
  demo_balance: number;
  currency: string;
}

export default function EditBalancePage() {
  const [wallets, setWallets] = useState<WalletPair[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');
  const [editWallet, setEditWallet] = useState<{ walletId: string; type: 'real' | 'demo'; value: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchWallets = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('wallets')
      .select('id, user_id, balance, is_demo, currency, updated_at, users(email, full_name)')
      .order('updated_at', { ascending: false });

    if (data) {
      const userMap: Record<string, WalletPair> = {};
      data.forEach((w: any) => {
        const uid = w.user_id;
        if (!userMap[uid]) {
          userMap[uid] = {
            user_id: uid,
            email: w.users?.email || uid.slice(0, 8),
            full_name: w.users?.full_name || null,
            real_wallet_id: null,
            real_balance: 0,
            demo_wallet_id: null,
            demo_balance: 0,
            currency: w.currency || 'USD',
          };
        }
        if (w.is_demo) {
          userMap[uid].demo_wallet_id = w.id;
          userMap[uid].demo_balance = Number(w.balance);
        } else {
          userMap[uid].real_wallet_id = w.id;
          userMap[uid].real_balance = Number(w.balance);
        }
      });
      setWallets(Object.values(userMap));
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchWallets(); }, [fetchWallets]);

  const handleSave = async () => {
    if (!editWallet) return;
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from('wallets').update({ balance: parseFloat(editWallet.value) }).eq('id', editWallet.walletId);
    if (error) {
      setMessage('Failed to update balance: ' + error.message);
    } else {
      setMessage('Balance updated successfully');
    }
    setEditWallet(null);
    fetchWallets();
    setSaving(false);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleResetDemo = async (demoWalletId: string | null) => {
    if (!demoWalletId) return;
    const supabase = createClient();
    await supabase.from('wallets').update({ balance: 10000 }).eq('id', demoWalletId);
    setMessage('Demo balance reset to $10,000');
    fetchWallets();
    setTimeout(() => setMessage(''), 3000);
  };

  const filtered = wallets.filter((w) => w.email.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Edit Balance</h1>
        <p className="text-gray-400 text-sm mt-1">Manually edit real and demo wallet balances</p>
      </div>

      {message && (
        <div className={`px-4 py-3 rounded-lg text-sm border ${message.startsWith('Failed') ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-green-500/10 border-green-500/20 text-green-400'}`}>
          {message}
        </div>
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
                  <tr key={w.user_id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3">
                      <div className="text-white">{w.email}</div>
                      <div className="text-gray-500 text-xs">{w.full_name || w.currency}</div>
                    </td>
                    <td className="py-3">
                      {editWallet?.walletId === w.real_wallet_id && editWallet.type === 'real' ? (
                        <div className="flex items-center gap-2">
                          <input type="number" value={editWallet.value} onChange={(e) => setEditWallet({ ...editWallet, value: e.target.value })}
                            className="w-28 px-2 py-1 bg-white/10 border border-blue-500 rounded text-white text-sm focus:outline-none" />
                          <button onClick={handleSave} disabled={saving} className="text-green-400 hover:text-green-300"><CheckIcon className="w-4 h-4" /></button>
                          <button onClick={() => setEditWallet(null)} className="text-red-400 hover:text-red-300"><XMarkIcon className="w-4 h-4" /></button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-green-400 font-medium">${w.real_balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                          {w.real_wallet_id && (
                            <button onClick={() => setEditWallet({ walletId: w.real_wallet_id!, type: 'real', value: String(w.real_balance) })} className="text-gray-500 hover:text-blue-400">
                              <PencilSquareIcon className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="py-3">
                      {editWallet?.walletId === w.demo_wallet_id && editWallet.type === 'demo' ? (
                        <div className="flex items-center gap-2">
                          <input type="number" value={editWallet.value} onChange={(e) => setEditWallet({ ...editWallet, value: e.target.value })}
                            className="w-28 px-2 py-1 bg-white/10 border border-blue-500 rounded text-white text-sm focus:outline-none" />
                          <button onClick={handleSave} disabled={saving} className="text-green-400 hover:text-green-300"><CheckIcon className="w-4 h-4" /></button>
                          <button onClick={() => setEditWallet(null)} className="text-red-400 hover:text-red-300"><XMarkIcon className="w-4 h-4" /></button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-blue-400 font-medium">${w.demo_balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                          {w.demo_wallet_id && (
                            <button onClick={() => setEditWallet({ walletId: w.demo_wallet_id!, type: 'demo', value: String(w.demo_balance) })} className="text-gray-500 hover:text-blue-400">
                              <PencilSquareIcon className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="py-3">
                      <button onClick={() => handleResetDemo(w.demo_wallet_id)}
                        disabled={!w.demo_wallet_id}
                        className="flex items-center gap-1 px-3 py-1 bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 disabled:opacity-40 rounded-lg text-xs font-medium transition-colors">
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
