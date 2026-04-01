'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface WalletPair {
  user_id: string;
  email: string;
  full_name: string | null;
  real_balance: number;
  demo_balance: number;
  currency: string;
  updated_at: string;
}

export default function WalletBalancesPage() {
  const [wallets, setWallets] = useState<WalletPair[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

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
            real_balance: 0,
            demo_balance: 0,
            currency: w.currency || 'USD',
            updated_at: w.updated_at,
          };
        }
        if (w.is_demo) {
          userMap[uid].demo_balance = Number(w.balance);
        } else {
          userMap[uid].real_balance = Number(w.balance);
        }
        if (w.updated_at > userMap[uid].updated_at) {
          userMap[uid].updated_at = w.updated_at;
        }
      });
      setWallets(Object.values(userMap).sort((a, b) => b.real_balance - a.real_balance));
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchWallets(); }, [fetchWallets]);

  const filtered = wallets.filter((w) => w.email.toLowerCase().includes(search.toLowerCase()));

  const totalReal = wallets.reduce((s, w) => s + w.real_balance, 0);
  const totalDemo = wallets.reduce((s, w) => s + w.demo_balance, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Wallet Balances</h1>
        <p className="text-gray-400 text-sm mt-1">Overview of all user wallet balances</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#0f1629] border border-white/10 rounded-xl p-4">
          <div className="text-gray-400 text-sm">Total Users</div>
          <div className="text-2xl font-bold text-white mt-1">{wallets.length}</div>
        </div>
        <div className="bg-[#0f1629] border border-white/10 rounded-xl p-4">
          <div className="text-gray-400 text-sm">Total Real Balance</div>
          <div className="text-2xl font-bold text-green-400 mt-1">${totalReal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
        </div>
        <div className="bg-[#0f1629] border border-white/10 rounded-xl p-4">
          <div className="text-gray-400 text-sm">Total Demo Balance</div>
          <div className="text-2xl font-bold text-blue-400 mt-1">${totalDemo.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
        </div>
      </div>

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
                  <th className="pb-3 font-medium">Currency</th>
                  <th className="pb-3 font-medium">Real Balance</th>
                  <th className="pb-3 font-medium">Demo Balance</th>
                  <th className="pb-3 font-medium">Last Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((w) => (
                  <tr key={w.user_id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3">
                      <div className="text-white">{w.email}</div>
                      <div className="text-gray-500 text-xs">{w.full_name || '—'}</div>
                    </td>
                    <td className="py-3 text-gray-300">{w.currency}</td>
                    <td className="py-3 text-green-400 font-medium">${w.real_balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="py-3 text-blue-400 font-medium">${w.demo_balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="py-3 text-gray-400">{new Date(w.updated_at).toLocaleString()}</td>
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
