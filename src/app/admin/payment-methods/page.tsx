'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

interface PaymentMethod {
  id: string;
  type: string;
  country: string;
  name: string;
  account_number: string | null;
  account_name: string | null;
  network: string | null;
  instructions: string | null;
  min_deposit: number;
  max_deposit: number;
  is_active: boolean;
}

const TYPE_COLORS: Record<string, string> = {
  bank: '#3b82f6',
  ewallet: '#8b5cf6',
  crypto: '#f59e0b',
  card: '#10b981',
};

const TYPE_LABELS: Record<string, string> = {
  bank: 'Bank',
  ewallet: 'E-Wallet',
  crypto: 'Crypto',
  card: 'Card',
};

export default function AdminPaymentMethodsPage() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCountry, setFilterCountry] = useState<string>('all');
  const [filterActive, setFilterActive] = useState<string>('all');
  const [editData, setEditData] = useState<Record<string, Partial<PaymentMethod>>>({});

  const fetchMethods = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from('payment_methods')
      .select('*')
      .order('country')
      .order('type')
      .order('name');
    setMethods((data as PaymentMethod[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMethods();
  }, [fetchMethods]);

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleToggleActive = async (method: PaymentMethod) => {
    const supabase = createClient();
    const newVal = !method.is_active;
    const { error } = await supabase
      .from('payment_methods')
      .update({ is_active: newVal })
      .eq('id', method.id);
    if (error) {
      showMessage('Failed to update status', 'error');
    } else {
      setMethods((prev) => prev.map((m) => m.id === method.id ? { ...m, is_active: newVal } : m));
      showMessage(`${method.name} ${newVal ? 'activated' : 'deactivated'}`, 'success');
    }
  };

  const handleFieldChange = (id: string, field: keyof PaymentMethod, value: string | number) => {
    setEditData((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
  };

  const handleSave = async (method: PaymentMethod) => {
    const changes = editData[method.id];
    // Always save — use tracked changes or fall back to current method values
    const payload = changes && Object.keys(changes).length > 0 ? changes : {
      account_number: method.account_number,
      account_name: method.account_name,
      network: method.network,
      instructions: method.instructions,
      min_deposit: method.min_deposit,
      max_deposit: method.max_deposit,
    };
    setSaving(method.id);
    const supabase = createClient();
    const { error } = await supabase
      .from('payment_methods')
      .update(payload)
      .eq('id', method.id);
    if (error) {
      showMessage(`Failed to save ${method.name}: ${error.message}`, 'error');
    } else {
      setMethods((prev) => prev.map((m) => m.id === method.id ? { ...m, ...payload } : m));
      setEditData((prev) => { const next = { ...prev }; delete next[method.id]; return next; });
      showMessage(`${method.name} saved successfully`, 'success');
    }
    setSaving(null);
  };

  // Get unique countries and types
  const countries = Array.from(new Set(methods.map((m) => m.country).filter(Boolean))).sort();
  const types = Array.from(new Set(methods.map((m) => m.type).filter(Boolean)));

  // Filter
  const filtered = methods.filter((m) => {
    const matchSearch = !searchQuery || m.name.toLowerCase().includes(searchQuery.toLowerCase()) || m.country?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchType = filterType === 'all' || m.type === filterType;
    const matchCountry = filterCountry === 'all' || m.country === filterCountry;
    const matchActive = filterActive === 'all' || (filterActive === 'active' ? m.is_active : !m.is_active);
    return matchSearch && matchType && matchCountry && matchActive;
  });

  // Group by country + type
  const grouped: Record<string, Record<string, PaymentMethod[]>> = {};
  filtered.forEach((m) => {
    const country = m.country || 'Global';
    const type = m.type || 'other';
    if (!grouped[country]) grouped[country] = {};
    if (!grouped[country][type]) grouped[country][type] = [];
    grouped[country][type].push(m);
  });

  const getValue = (method: PaymentMethod, field: keyof PaymentMethod): string => {
    const edited = editData[method.id]?.[field];
    if (edited !== undefined) return String(edited);
    return String(method[field] ?? '');
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-white text-xl font-bold">Payment Methods</h2>
          <p className="text-slate-400 text-sm mt-1">{methods.length} methods · {methods.filter((m) => m.is_active).length} active</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-400 text-xs">Live DB</span>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`px-4 py-2.5 rounded-lg text-sm font-medium border ${
          message.type === 'success' ?'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :'bg-red-500/10 border-red-500/20 text-red-400'
        }`}>
          {message.text}
        </div>
      )}

      {/* Filters */}
      <div className="bg-[#1e293b] rounded-xl border border-slate-700 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              placeholder="Search methods..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 rounded-lg pl-8 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          {/* Type filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50"
          >
            <option value="all">All Types</option>
            {types.map((t) => <option key={t} value={t}>{TYPE_LABELS[t] || t}</option>)}
          </select>

          {/* Country filter */}
          <select
            value={filterCountry}
            onChange={(e) => setFilterCountry(e.target.value)}
            className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50"
          >
            <option value="all">All Countries</option>
            {countries.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>

          {/* Active filter */}
          <select
            value={filterActive}
            onChange={(e) => setFilterActive(e.target.value)}
            className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
        <div className="mt-2 text-xs text-slate-500">{filtered.length} results</div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([country, typeGroups]) => (
            <div key={country}>
              <div className="flex items-center gap-3 mb-3">
                <h3 className="text-white font-semibold text-sm">{country}</h3>
                <div className="flex-1 h-px bg-slate-700" />
                <span className="text-slate-500 text-xs">{Object.values(typeGroups).flat().length} methods</span>
              </div>

              {Object.entries(typeGroups).map(([type, typeMethods]) => (
                <div key={type} className="mb-4">
                  <div className="flex items-center gap-2 mb-2 ml-1">
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                      style={{ color: TYPE_COLORS[type] || '#94a3b8', background: `${TYPE_COLORS[type] || '#94a3b8'}15` }}
                    >
                      {TYPE_LABELS[type] || type}
                    </span>
                  </div>

                  <div className="bg-[#1e293b] rounded-xl border border-slate-700 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-slate-700">
                            <th className="text-left text-slate-400 text-xs font-medium px-4 py-2.5 whitespace-nowrap">Name</th>
                            <th className="text-left text-slate-400 text-xs font-medium px-4 py-2.5 whitespace-nowrap">Account Number</th>
                            <th className="text-left text-slate-400 text-xs font-medium px-4 py-2.5 whitespace-nowrap">Account Name</th>
                            <th className="text-left text-slate-400 text-xs font-medium px-4 py-2.5 whitespace-nowrap">Network</th>
                            <th className="text-left text-slate-400 text-xs font-medium px-4 py-2.5 whitespace-nowrap">Min</th>
                            <th className="text-left text-slate-400 text-xs font-medium px-4 py-2.5 whitespace-nowrap">Max</th>
                            <th className="text-left text-slate-400 text-xs font-medium px-4 py-2.5 whitespace-nowrap">Instructions</th>
                            <th className="text-left text-slate-400 text-xs font-medium px-4 py-2.5 whitespace-nowrap">Status</th>
                            <th className="text-left text-slate-400 text-xs font-medium px-4 py-2.5 whitespace-nowrap">Save</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                          {typeMethods.map((method) => {
                            const hasChanges = editData[method.id] && Object.keys(editData[method.id]).length > 0;
                            return (
                              <tr key={method.id} className={`hover:bg-slate-700/20 transition-colors ${!method.is_active ? 'opacity-50' : ''}`}>
                                <td className="px-4 py-2.5">
                                  <span className="text-white text-xs font-medium whitespace-nowrap">{method.name}</span>
                                </td>
                                <td className="px-4 py-2.5">
                                  <input
                                    type="text"
                                    value={getValue(method, 'account_number')}
                                    onChange={(e) => handleFieldChange(method.id, 'account_number', e.target.value)}
                                    placeholder="e.g. 1234567890"
                                    className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-xs text-white w-32 focus:outline-none focus:border-emerald-500/50"
                                  />
                                </td>
                                <td className="px-4 py-2.5">
                                  <input
                                    type="text"
                                    value={getValue(method, 'account_name')}
                                    onChange={(e) => handleFieldChange(method.id, 'account_name', e.target.value)}
                                    placeholder="Account holder"
                                    className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-xs text-white w-28 focus:outline-none focus:border-emerald-500/50"
                                  />
                                </td>
                                <td className="px-4 py-2.5">
                                  <input
                                    type="text"
                                    value={getValue(method, 'network')}
                                    onChange={(e) => handleFieldChange(method.id, 'network', e.target.value)}
                                    placeholder="e.g. TRC20"
                                    className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-xs text-white w-20 focus:outline-none focus:border-emerald-500/50"
                                  />
                                </td>
                                <td className="px-4 py-2.5">
                                  <input
                                    type="number"
                                    value={getValue(method, 'min_deposit')}
                                    onChange={(e) => handleFieldChange(method.id, 'min_deposit', parseFloat(e.target.value))}
                                    className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-xs text-white w-16 focus:outline-none focus:border-emerald-500/50"
                                  />
                                </td>
                                <td className="px-4 py-2.5">
                                  <input
                                    type="number"
                                    value={getValue(method, 'max_deposit')}
                                    onChange={(e) => handleFieldChange(method.id, 'max_deposit', parseFloat(e.target.value))}
                                    className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-xs text-white w-20 focus:outline-none focus:border-emerald-500/50"
                                  />
                                </td>
                                <td className="px-4 py-2.5">
                                  <input
                                    type="text"
                                    value={getValue(method, 'instructions')}
                                    onChange={(e) => handleFieldChange(method.id, 'instructions', e.target.value)}
                                    placeholder="Payment instructions..."
                                    className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-xs text-white w-40 focus:outline-none focus:border-emerald-500/50"
                                  />
                                </td>
                                <td className="px-4 py-2.5">
                                  <button
                                    onClick={() => handleToggleActive(method)}
                                    title={method.is_active ? 'Click to deactivate' : 'Click to activate'}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-200 focus:outline-none ${
                                      method.is_active
                                        ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]'
                                        : 'bg-slate-600'
                                    }`}
                                  >
                                    <span
                                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-200 ${
                                        method.is_active ? 'translate-x-6' : 'translate-x-1'
                                      }`}
                                    />
                                  </button>
                                </td>
                                <td className="px-4 py-2.5">
                                  <button
                                    onClick={() => handleSave(method)}
                                    disabled={saving === method.id}
                                    className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                                      hasChanges
                                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30' :'bg-slate-700/50 text-slate-400 border border-slate-600 hover:bg-slate-700 hover:text-white'
                                    } ${saving === method.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                  >
                                    {saving === method.id ? (
                                      <span className="w-3 h-3 border border-emerald-400 border-t-transparent rounded-full animate-spin inline-block" />
                                    ) : 'Save'}
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
              ))}
            </div>
          ))}

          {Object.keys(grouped).length === 0 && (
            <div className="text-center py-16 text-slate-500">No payment methods match your filters</div>
          )}
        </div>
      )}
    </div>
  );
}
