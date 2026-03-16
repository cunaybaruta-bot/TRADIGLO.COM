'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  MagnifyingGlassIcon,
  PencilSquareIcon,
  ArrowPathIcon,
  CheckIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

interface UserWalletRow {
  user_id: string;
  email: string;
  demo_wallet_id: string | null;
  real_wallet_id: string | null;
  demo_balance: number;
  real_balance: number;
  last_updated: string;
}

interface ConfirmState {
  walletId: string;
  field: 'demo' | 'real';
  newValue: number;
  email: string;
}

export default function WalletsPage() {
  const [rows, setRows] = useState<UserWalletRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [saving, setSaving] = useState(false);

  // Inline edit state: { userId, field, value }
  const [editState, setEditState] = useState<{ userId: string; field: 'demo' | 'real'; value: string } | null>(null);

  // Confirmation modal state
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);

  const fetchWallets = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();

    // Fetch all wallets with user email
    const { data, error } = await supabase
      .from('wallets')
      .select('id, user_id, balance, is_demo, updated_at, users(email)')
      .order('updated_at', { ascending: false });

    if (error) {
      setMessage({ text: 'Failed to load wallets: ' + error.message, type: 'error' });
      setLoading(false);
      return;
    }

    // Group by user_id — one row per user with demo + real wallet
    const userMap = new Map<string, UserWalletRow>();

    for (const w of (data || []) as any[]) {
      const uid = w.user_id;
      const email = w.users?.email || uid?.slice(0, 12) + '...';

      if (!userMap.has(uid)) {
        userMap.set(uid, {
          user_id: uid,
          email,
          demo_wallet_id: null,
          real_wallet_id: null,
          demo_balance: 0,
          real_balance: 0,
          last_updated: w.updated_at,
        });
      }

      const entry = userMap.get(uid)!;
      if (w.is_demo) {
        entry.demo_wallet_id = w.id;
        entry.demo_balance = Number(w.balance);
      } else {
        entry.real_wallet_id = w.id;
        entry.real_balance = Number(w.balance);
      }
      // Keep the most recent updated_at
      if (new Date(w.updated_at) > new Date(entry.last_updated)) {
        entry.last_updated = w.updated_at;
      }
    }

    setRows(Array.from(userMap.values()));
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchWallets();
  }, [fetchWallets]);

  const showMessage = (text: string, type: 'success' | 'error' = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  // Called when user clicks Save in the inline edit — opens confirmation modal
  const requestSave = (row: UserWalletRow, field: 'demo' | 'real', value: string) => {
    const parsed = parseFloat(value);
    if (isNaN(parsed) || parsed < 0) {
      showMessage('Please enter a valid positive number', 'error');
      return;
    }
    const walletId = field === 'demo' ? row.demo_wallet_id : row.real_wallet_id;
    if (!walletId) {
      showMessage('Wallet not found for this user', 'error');
      return;
    }
    setConfirm({ walletId, field, newValue: parsed, email: row.email });
  };

  // Confirmed save
  const handleConfirmedSave = async () => {
    if (!confirm) return;
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from('wallets')
      .update({ balance: confirm.newValue, updated_at: new Date().toISOString() })
      .eq('id', confirm.walletId);

    if (error) {
      showMessage('Failed to update: ' + error.message, 'error');
    } else {
      showMessage(`${confirm.field === 'demo' ? 'Demo' : 'Real'} balance updated to $${confirm.newValue.toLocaleString('en', { minimumFractionDigits: 2 })}`, 'success');
      setEditState(null);
      fetchWallets();
    }
    setConfirm(null);
    setSaving(false);
  };

  // Reset demo balance to $100,000
  const handleResetDemo = async (row: UserWalletRow) => {
    if (!row.demo_wallet_id) {
      showMessage('No demo wallet found for this user', 'error');
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from('wallets')
      .update({ balance: 100000, updated_at: new Date().toISOString() })
      .eq('id', row.demo_wallet_id);

    if (error) {
      showMessage('Reset failed: ' + error.message, 'error');
    } else {
      showMessage(`Demo balance for ${row.email} reset to $100,000`, 'success');
      fetchWallets();
    }
    setSaving(false);
  };

  const filtered = rows.filter((r) =>
    r.email.toLowerCase().includes(search.toLowerCase())
  );

  const totalReal = rows.reduce((s, r) => s + r.real_balance, 0);
  const totalDemo = rows.reduce((s, r) => s + r.demo_balance, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-white text-xl font-bold">Wallet Management</h2>
          <p className="text-slate-400 text-sm mt-1">{rows.length} users</p>
        </div>
        <div className="relative">
          <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-[#1e293b] border border-slate-700 text-white text-sm rounded-lg pl-9 pr-4 py-2 w-64 focus:outline-none focus:border-[#22c55e] placeholder-slate-500"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#1e293b] rounded-xl p-5 border border-slate-700">
          <div className="text-slate-400 text-xs mb-1">Total Users</div>
          <div className="text-white text-2xl font-bold">{rows.length}</div>
        </div>
        <div className="bg-[#1e293b] rounded-xl p-5 border border-green-400/20">
          <div className="text-slate-400 text-xs mb-1">Total Real Balance</div>
          <div className="text-green-400 text-2xl font-bold">
            ${totalReal.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
        <div className="bg-[#1e293b] rounded-xl p-5 border border-blue-400/20">
          <div className="text-slate-400 text-xs mb-1">Total Demo Balance</div>
          <div className="text-blue-400 text-2xl font-bold">
            ${totalDemo.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`text-sm px-4 py-2 rounded-lg border ${
            message.type === 'success' ?'bg-green-500/10 border-green-500/20 text-green-400' :'bg-red-500/10 border-red-500/20 text-red-400'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Confirmation Modal */}
      {confirm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-[#1e293b] rounded-xl border border-slate-700 p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center flex-shrink-0">
                <ExclamationTriangleIcon className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm">Confirm Balance Update</h3>
                <p className="text-slate-400 text-xs mt-0.5">{confirm.email}</p>
              </div>
            </div>
            <p className="text-slate-300 text-sm mb-5">
              Set{' '}
              <span className={confirm.field === 'demo' ? 'text-blue-400 font-semibold' : 'text-green-400 font-semibold'}>
                {confirm.field === 'demo' ? 'Demo' : 'Real'}
              </span>{' '}
              balance to{' '}
              <span className="text-white font-bold">
                ${confirm.newValue.toLocaleString('en', { minimumFractionDigits: 2 })}
              </span>
              ?
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleConfirmedSave}
                disabled={saving}
                className="flex-1 bg-[#22c55e] text-black text-sm font-semibold py-2 rounded-lg hover:bg-green-400 transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Confirm'}
              </button>
              <button
                onClick={() => setConfirm(null)}
                disabled={saving}
                className="flex-1 bg-slate-700 text-slate-300 text-sm py-2 rounded-lg hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-[#1e293b] rounded-xl border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left text-slate-400 text-xs font-medium px-5 py-3">Email User</th>
                <th className="text-left text-slate-400 text-xs font-medium px-5 py-3">Demo Balance</th>
                <th className="text-left text-slate-400 text-xs font-medium px-5 py-3">Real Balance</th>
                <th className="text-left text-slate-400 text-xs font-medium px-5 py-3">Last Updated</th>
                <th className="text-left text-slate-400 text-xs font-medium px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {loading && (
                <tr>
                  <td colSpan={5} className="text-center text-slate-500 text-sm py-10">
                    Loading wallets...
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center text-slate-500 text-sm py-10">
                    No wallets found
                  </td>
                </tr>
              )}
              {filtered.map((row) => {
                const isEditingDemo = editState?.userId === row.user_id && editState.field === 'demo';
                const isEditingReal = editState?.userId === row.user_id && editState.field === 'real';

                return (
                  <tr key={row.user_id} className="hover:bg-slate-700/20 transition-colors">
                    {/* Email */}
                    <td className="px-5 py-3 text-white text-sm">{row.email}</td>

                    {/* Demo Balance */}
                    <td className="px-5 py-3">
                      {isEditingDemo ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            value={editState.value}
                            onChange={(e) => setEditState({ ...editState, value: e.target.value })}
                            className="w-32 px-2 py-1 bg-[#0f172a] border border-blue-500 rounded text-white text-sm focus:outline-none"
                            autoFocus
                          />
                          <button
                            onClick={() => requestSave(row, 'demo', editState.value)}
                            className="text-green-400 hover:text-green-300 p-1"
                            title="Save"
                          >
                            <CheckIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditState(null)}
                            className="text-red-400 hover:text-red-300 p-1"
                            title="Cancel"
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-blue-400 font-semibold text-sm">
                            ${row.demo_balance.toLocaleString('en', { minimumFractionDigits: 2 })}
                          </span>
                          <button
                            onClick={() =>
                              setEditState({ userId: row.user_id, field: 'demo', value: String(row.demo_balance) })
                            }
                            className="text-slate-500 hover:text-blue-400 transition-colors"
                            title="Edit demo balance"
                          >
                            <PencilSquareIcon className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>

                    {/* Real Balance */}
                    <td className="px-5 py-3">
                      {isEditingReal ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            value={editState.value}
                            onChange={(e) => setEditState({ ...editState, value: e.target.value })}
                            className="w-32 px-2 py-1 bg-[#0f172a] border border-green-500 rounded text-white text-sm focus:outline-none"
                            autoFocus
                          />
                          <button
                            onClick={() => requestSave(row, 'real', editState.value)}
                            className="text-green-400 hover:text-green-300 p-1"
                            title="Save"
                          >
                            <CheckIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditState(null)}
                            className="text-red-400 hover:text-red-300 p-1"
                            title="Cancel"
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-green-400 font-semibold text-sm">
                            ${row.real_balance.toLocaleString('en', { minimumFractionDigits: 2 })}
                          </span>
                          <button
                            onClick={() =>
                              setEditState({ userId: row.user_id, field: 'real', value: String(row.real_balance) })
                            }
                            className="text-slate-500 hover:text-green-400 transition-colors"
                            title="Edit real balance"
                          >
                            <PencilSquareIcon className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>

                    {/* Last Updated */}
                    <td className="px-5 py-3 text-slate-400 text-sm">
                      {new Date(row.last_updated).toLocaleString()}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3">
                      <button
                        onClick={() => handleResetDemo(row)}
                        disabled={saving}
                        className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 hover:bg-yellow-500/20 transition-colors disabled:opacity-50"
                        title="Reset demo balance to $100,000"
                      >
                        <ArrowPathIcon className="w-3 h-3" />
                        Reset Demo
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
