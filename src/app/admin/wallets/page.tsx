'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { MagnifyingGlassIcon, PencilSquareIcon, ArrowPathIcon, CheckIcon, XMarkIcon, ClipboardDocumentIcon, PlusIcon, MinusIcon,  } from '@heroicons/react/24/outline';

interface UserWalletRow {
  user_id: string;
  email: string;
  demo_wallet_id: string | null;
  real_wallet_id: string | null;
  demo_balance: number;
  real_balance: number;
  last_updated: string;
}

type EditMode = 'set' | 'add' | 'subtract';

interface EditState {
  userId: string;
  field: 'demo' | 'real';
  value: string;
  mode: EditMode;
  saving: boolean;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <button
      onClick={handleCopy}
      className="relative inline-flex items-center text-slate-500 hover:text-blue-400 transition-colors flex-shrink-0"
      title="Copy to clipboard"
    >
      <ClipboardDocumentIcon className="w-3.5 h-3.5" />
      {copied && (
        <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-blue-400 text-black text-[10px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap z-10">
          Copied!
        </span>
      )}
    </button>
  );
}

export default function WalletsPage() {
  const [rows, setRows] = useState<UserWalletRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [editState, setEditState] = useState<EditState | null>(null);
  const [resettingId, setResettingId] = useState<string | null>(null);

  const fetchWallets = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();

    const { data, error } = await supabase
      .from('wallets')
      .select('id, user_id, balance, is_demo, updated_at, users(email)')
      .order('updated_at', { ascending: false });

    if (error) {
      setMessage({ text: 'Failed to load wallets: ' + error.message, type: 'error' });
      setLoading(false);
      return;
    }

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

  const doSave = async (row: UserWalletRow, field: 'demo' | 'real', value: string, mode: EditMode) => {
    const parsed = parseFloat(value);
    if (isNaN(parsed) || parsed < 0) {
      showMessage('Please enter a valid positive number', 'error');
      return;
    }

    const walletId = field === 'demo' ? row.demo_wallet_id : row.real_wallet_id;
    const currentBalance = field === 'demo' ? row.demo_balance : row.real_balance;

    if (!walletId) {
      showMessage('Wallet not found for this user', 'error');
      return;
    }

    let finalBalance = parsed;
    if (mode === 'add') finalBalance = currentBalance + parsed;
    if (mode === 'subtract') finalBalance = Math.max(0, currentBalance - parsed);

    // Mark as saving
    setEditState((prev) => prev ? { ...prev, saving: true } : prev);

    try {
      const res = await fetch('/api/admin/wallet-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet_id: walletId, new_balance: finalBalance, action: 'update' }),
      });

      const json = await res.json();

      if (!res.ok || json.error) {
        showMessage('Failed to update: ' + (json.error || res.statusText), 'error');
        setEditState((prev) => prev ? { ...prev, saving: false } : prev);
        return;
      }

      const label = field === 'demo' ? 'Demo' : 'Real';
      const modeLabel = mode === 'add' ? 'increased to' : mode === 'subtract' ? 'reduced to' : 'set to';
      showMessage(
        `${label} balance ${modeLabel} $${finalBalance.toLocaleString('en', { minimumFractionDigits: 2 })}`,
        'success'
      );
      setEditState(null);
      fetchWallets();
    } catch (err: any) {
      showMessage('Error: ' + (err.message || 'Unknown error'), 'error');
      setEditState((prev) => prev ? { ...prev, saving: false } : prev);
    }
  };

  const handleResetDemo = async (row: UserWalletRow) => {
    if (!row.demo_wallet_id) {
      showMessage('No demo wallet found for this user', 'error');
      return;
    }
    setResettingId(row.user_id);

    try {
      const res = await fetch('/api/admin/wallet-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet_id: row.demo_wallet_id, action: 'reset_demo' }),
      });

      const json = await res.json();

      if (!res.ok || json.error) {
        showMessage('Reset failed: ' + (json.error || res.statusText), 'error');
      } else {
        showMessage(`Demo balance for ${row.email} reset to $100,000`, 'success');
        fetchWallets();
      }
    } catch (err: any) {
      showMessage('Reset error: ' + (err.message || 'Unknown error'), 'error');
    }

    setResettingId(null);
  };

  const filtered = rows.filter((r) =>
    r.email.toLowerCase().includes(search.toLowerCase())
  );

  const totalReal = rows.reduce((s, r) => s + r.real_balance, 0);
  const totalDemo = rows.reduce((s, r) => s + r.demo_balance, 0);

  const renderEditCell = (row: UserWalletRow, field: 'demo' | 'real') => {
    const isEditing = editState?.userId === row.user_id && editState.field === field;
    const balance = field === 'demo' ? row.demo_balance : row.real_balance;
    const colorClass = field === 'demo' ? 'text-blue-400' : 'text-green-400';
    const borderColor = field === 'demo' ? 'border-blue-500' : 'border-green-500';

    if (isEditing) {
      const mode = editState!.mode;
      const isSaving = editState!.saving;

      return (
        <div className="flex flex-col gap-1.5">
          {/* Mode selector */}
          <div className="flex gap-1">
            {(['set', 'add', 'subtract'] as EditMode[]).map((m) => (
              <button
                key={m}
                type="button"
                disabled={isSaving}
                onClick={() => setEditState((prev) => prev ? { ...prev, mode: m } : prev)}
                className={`text-[10px] px-2 py-0.5 rounded font-medium transition-colors ${
                  mode === m
                    ? 'bg-slate-500 text-white' :'bg-slate-700 text-slate-400 hover:bg-slate-600'
                }`}
              >
                {m === 'set' ? 'Set' : m === 'add' ? '+Add' : '-Sub'}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              value={editState!.value}
              disabled={isSaving}
              onChange={(e) => {
                const val = e.target.value;
                setEditState((prev) => prev ? { ...prev, value: val } : prev);
              }}
              className={`w-32 px-2 py-1 bg-[#0f172a] border ${borderColor} rounded text-white text-sm focus:outline-none disabled:opacity-50`}
              autoFocus
              min="0"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isSaving) {
                  doSave(row, field, editState!.value, editState!.mode);
                } else if (e.key === 'Escape' && !isSaving) {
                  setEditState(null);
                }
              }}
            />
            <button
              type="button"
              disabled={isSaving}
              onClick={() => doSave(row, field, editState!.value, editState!.mode)}
              className="text-green-400 hover:text-green-300 p-1 disabled:opacity-50"
              title="Save"
            >
              {isSaving ? (
                <ArrowPathIcon className="w-4 h-4 animate-spin" />
              ) : (
                <CheckIcon className="w-4 h-4" />
              )}
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={() => setEditState(null)}
              className="text-red-400 hover:text-red-300 p-1 disabled:opacity-50"
              title="Cancel"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
          {mode !== 'set' && (
            <div className="text-[10px] text-slate-500">
              Current: ${balance.toLocaleString('en', { minimumFractionDigits: 2 })}
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2">
        <span className={`${colorClass} font-semibold text-sm`}>
          ${balance.toLocaleString('en', { minimumFractionDigits: 2 })}
        </span>
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => setEditState({ userId: row.user_id, field, value: String(balance), mode: 'set', saving: false })}
            className={`text-slate-500 hover:${colorClass} transition-colors`}
            title={`Edit ${field} balance`}
          >
            <PencilSquareIcon className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setEditState({ userId: row.user_id, field, value: '', mode: 'add', saving: false })}
            className="text-slate-500 hover:text-green-400 transition-colors"
            title={`Add to ${field} balance`}
          >
            <PlusIcon className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setEditState({ userId: row.user_id, field, value: '', mode: 'subtract', saving: false })}
            className="text-slate-500 hover:text-red-400 transition-colors"
            title={`Subtract from ${field} balance`}
          >
            <MinusIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  };

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
              {filtered.map((row) => (
                <tr key={row.user_id} className="hover:bg-slate-700/20 transition-colors">
                  {/* Email */}
                  <td className="px-5 py-3 text-white text-sm">
                    <div className="flex items-center gap-1.5">
                      <span>{row.email}</span>
                      <CopyButton text={row.email} />
                    </div>
                  </td>

                  {/* Demo Balance */}
                  <td className="px-5 py-3">
                    {renderEditCell(row, 'demo')}
                  </td>

                  {/* Real Balance */}
                  <td className="px-5 py-3">
                    {renderEditCell(row, 'real')}
                  </td>

                  {/* Last Updated */}
                  <td className="px-5 py-3 text-slate-400 text-sm">
                    {new Date(row.last_updated).toLocaleString()}
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-3">
                    <button
                      onClick={() => handleResetDemo(row)}
                      disabled={resettingId === row.user_id}
                      className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 hover:bg-yellow-500/20 transition-colors disabled:opacity-50"
                      title="Reset demo balance to $100,000"
                    >
                      <ArrowPathIcon className={`w-3 h-3 ${resettingId === row.user_id ? 'animate-spin' : ''}`} />
                      Reset Demo
                    </button>
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
