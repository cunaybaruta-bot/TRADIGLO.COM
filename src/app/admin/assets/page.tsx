'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { PlusIcon, PencilSquareIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface Asset {
  id: string;
  symbol: string;
  name: string;
  exchange: string | null;
  base_currency: string | null;
  quote_currency: string | null;
  is_active: boolean;
  created_at: string;
}

interface EditState {
  id: string;
  name: string;
}

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [editState, setEditState] = useState<EditState | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newAsset, setNewAsset] = useState({ symbol: '', name: '', exchange: '' });
  const [saving, setSaving] = useState(false);

  const fetchAssets = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('assets')
      .select('id, symbol, name, exchange, base_currency, quote_currency, is_active, created_at')
      .order('symbol');
    setAssets(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const handleToggle = async (id: string, current: boolean) => {
    const supabase = createClient();
    await supabase.from('assets').update({ is_active: !current }).eq('id', id);
    setMessage(`Asset ${!current ? 'enabled' : 'disabled'}`);
    fetchAssets();
    setTimeout(() => setMessage(''), 3000);
  };

  const handleEdit = async () => {
    if (!editState) return;
    setSaving(true);
    const supabase = createClient();
    await supabase.from('assets').update({ name: editState.name }).eq('id', editState.id);
    setMessage('Asset updated');
    setEditState(null);
    fetchAssets();
    setSaving(false);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleAdd = async () => {
    if (!newAsset.symbol || !newAsset.name) return;
    setSaving(true);
    const supabase = createClient();
    await supabase.from('assets').insert({
      symbol: newAsset.symbol.toUpperCase(),
      name: newAsset.name,
      exchange: newAsset.exchange || null,
      is_active: true,
    });
    setMessage('Asset added');
    setShowAdd(false);
    setNewAsset({ symbol: '', name: '', exchange: '' });
    fetchAssets();
    setSaving(false);
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-white text-xl font-bold">Assets</h2>
          <p className="text-slate-400 text-sm mt-1">{assets.length} trading pairs</p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 px-4 py-2 bg-[#22c55e] text-black text-sm font-medium rounded-lg hover:bg-green-400 transition-colors"
        >
          <PlusIcon className="w-4 h-4" />
          Add Asset
        </button>
      </div>

      {message && (
        <div className="bg-green-500/10 border border-green-500/20 text-green-400 text-sm px-4 py-2 rounded-lg">
          {message}
        </div>
      )}

      {showAdd && (
        <div className="bg-[#1e293b] rounded-xl border border-slate-700 p-5">
          <h3 className="text-white font-semibold mb-4">Add New Asset</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-slate-400 text-xs mb-1 block">Symbol *</label>
              <input
                type="text"
                placeholder="e.g. BTC"
                value={newAsset.symbol}
                onChange={(e) => setNewAsset({ ...newAsset, symbol: e.target.value })}
                className="w-full bg-[#0f172a] border border-slate-600 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-[#22c55e]"
              />
            </div>
            <div>
              <label className="text-slate-400 text-xs mb-1 block">Name *</label>
              <input
                type="text"
                placeholder="e.g. Bitcoin"
                value={newAsset.name}
                onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
                className="w-full bg-[#0f172a] border border-slate-600 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-[#22c55e]"
              />
            </div>
            <div>
              <label className="text-slate-400 text-xs mb-1 block">Exchange</label>
              <input
                type="text"
                placeholder="e.g. BINANCE"
                value={newAsset.exchange}
                onChange={(e) => setNewAsset({ ...newAsset, exchange: e.target.value })}
                className="w-full bg-[#0f172a] border border-slate-600 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-[#22c55e]"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleAdd}
              disabled={saving || !newAsset.symbol || !newAsset.name}
              className="px-4 py-2 bg-[#22c55e] text-black text-sm font-medium rounded-lg hover:bg-green-400 transition-colors disabled:opacity-50"
            >
              {saving ? 'Adding...' : 'Add Asset'}
            </button>
            <button
              onClick={() => setShowAdd(false)}
              className="px-4 py-2 bg-slate-700 text-slate-300 text-sm rounded-lg hover:bg-slate-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="bg-[#1e293b] rounded-xl border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left text-slate-400 text-xs font-medium px-5 py-3">Symbol</th>
                <th className="text-left text-slate-400 text-xs font-medium px-5 py-3">Name</th>
                <th className="text-left text-slate-400 text-xs font-medium px-5 py-3">Exchange</th>
                <th className="text-left text-slate-400 text-xs font-medium px-5 py-3">Base / Quote</th>
                <th className="text-left text-slate-400 text-xs font-medium px-5 py-3">Status</th>
                <th className="text-left text-slate-400 text-xs font-medium px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {loading && (
                <tr><td colSpan={6} className="text-center text-slate-500 text-sm py-8">Loading...</td></tr>
              )}
              {!loading && assets.length === 0 && (
                <tr><td colSpan={6} className="text-center text-slate-500 text-sm py-8">No assets found</td></tr>
              )}
              {assets.map((a) => (
                <tr key={a.id} className="hover:bg-slate-700/20 transition-colors">
                  <td className="px-5 py-3 text-white text-sm font-mono font-semibold">{a.symbol}</td>
                  <td className="px-5 py-3">
                    {editState?.id === a.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editState.name}
                          onChange={(e) => setEditState({ ...editState, name: e.target.value })}
                          className="bg-[#0f172a] border border-slate-600 text-white text-sm rounded px-2 py-1 w-40 focus:outline-none focus:border-[#22c55e]"
                        />
                        <button onClick={handleEdit} disabled={saving} className="text-green-400 hover:text-green-300">
                          <CheckIcon className="w-4 h-4" />
                        </button>
                        <button onClick={() => setEditState(null)} className="text-slate-400 hover:text-white">
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-slate-300 text-sm">{a.name}</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-slate-400 text-sm">{a.exchange || '—'}</td>
                  <td className="px-5 py-3 text-slate-400 text-sm">{a.base_currency || '—'} / {a.quote_currency || '—'}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${a.is_active ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                      {a.is_active ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditState({ id: a.id, name: a.name })}
                        className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors"
                      >
                        <PencilSquareIcon className="w-3 h-3" /> Edit
                      </button>
                      <button
                        onClick={() => handleToggle(a.id, a.is_active)}
                        className={`text-xs px-2 py-1 rounded border transition-colors ${a.is_active ? 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20' : 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20'}`}
                      >
                        {a.is_active ? 'Disable' : 'Enable'}
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
