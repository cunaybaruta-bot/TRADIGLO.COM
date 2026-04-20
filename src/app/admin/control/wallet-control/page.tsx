'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { WalletIcon, PencilSquareIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface WalletEntry {
  id: string;
  user_id: string;
  real_balance: number;
  demo_balance: number;
  currency: string;
  users?: { email: string };
}

export default function WalletControlPage() {
  const [wallets, setWallets] = useState<WalletEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [editWallet, setEditWallet] = useState<{ id: string; field: 'real_balance' | 'demo_balance'; value: string } | null>(null);

  const fetchWallets = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.from('wallets').select('id, user_id, real_balance, demo_balance, currency, users(email)').order('real_balance', { ascending: false });
    setWallets((data as any) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchWallets(); }, [fetchWallets]);

  const handleSave = async () => {
    if (!editWallet) return;
    const supabase = createClient();
    await supabase.from('wallets').update({ [editWallet.field]: parseFloat(editWallet.value) }).eq('id', editWallet.id);
    setMessage('Wallet updated');
    setEditWallet(null);
    fetchWallets();
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Wallet Control</h1>
        <p className="text-gray-400 text-sm mt-1">Direct wallet balance management</p>
      </div>

      {message && <div className="bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-lg text-sm">{message}</div>}

      <div className="bg-[#0f1629] border border-white/10 rounded-xl p-4">
        <h2 className="text-white font-semibold mb-4 flex items-center gap-2"><WalletIcon className="w-5 h-5 text-blue-400" /> All Wallets</h2>
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
                  <th className="pb-3 font-medium">Currency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {wallets.map((w) => (
                  <tr key={w.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 text-white">{(w.users as any)?.email || w.user_id.slice(0, 8)}</td>
                    <td className="py-3">
                      {editWallet?.id === w.id && editWallet.field === 'real_balance' ? (
                        <div className="flex items-center gap-2">
                          <input type="number" value={editWallet.value} onChange={(e) => setEditWallet({ ...editWallet, value: e.target.value })}
                            className="w-28 px-2 py-1 bg-white/10 border border-blue-500 rounded text-white text-sm focus:outline-none" />
                          <button onClick={handleSave} className="text-green-400"><CheckIcon className="w-4 h-4" /></button>
                          <button onClick={() => setEditWallet(null)} className="text-red-400"><XMarkIcon className="w-4 h-4" /></button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-green-400">${Number(w.real_balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
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
                          <button onClick={handleSave} className="text-green-400"><CheckIcon className="w-4 h-4" /></button>
                          <button onClick={() => setEditWallet(null)} className="text-red-400"><XMarkIcon className="w-4 h-4" /></button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-blue-400">${Number(w.demo_balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                          <button onClick={() => setEditWallet({ id: w.id, field: 'demo_balance', value: String(w.demo_balance) })} className="text-gray-500 hover:text-blue-400">
                            <PencilSquareIcon className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="py-3 text-gray-300">{w.currency}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {wallets.length === 0 && <div className="text-center py-8 text-gray-500">No wallets found</div>}
          </div>
        )}
      </div>
    </div>
  );
}
