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

interface NewMethodForm {
  country: string;
  type: string;
  name: string;
  account_number: string;
  account_name: string;
  network: string;
  instructions: string;
  min_deposit: number;
  max_deposit: number;
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

const KNOWN_COUNTRIES = [
  'Malaysia', 'Singapore', 'Thailand', 'Vietnam', 'Japan', 'South Korea',
  'Philippines', 'China', 'India', 'Hong Kong', 'Taiwan', 'Pakistan',
  'Bangladesh', 'Saudi Arabia', 'UAE', 'Qatar', 'Kuwait', 'Sri Lanka',
  'Myanmar', 'United States', 'Global',
];

const EMPTY_FORM: NewMethodForm = {
  country: '',
  type: 'bank',
  name: '',
  account_number: '',
  account_name: '',
  network: '',
  instructions: '',
  min_deposit: 10,
  max_deposit: 50000,
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
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState<NewMethodForm>(EMPTY_FORM);
  const [addSaving, setAddSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

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

  const handleDelete = async (method: PaymentMethod) => {
    const supabase = createClient();
    const { error } = await supabase.from('payment_methods').delete().eq('id', method.id);
    if (error) {
      showMessage(`Failed to delete ${method.name}: ${error.message}`, 'error');
    } else {
      setMethods((prev) => prev.filter((m) => m.id !== method.id));
      showMessage(`${method.name} deleted`, 'success');
    }
    setDeleteConfirm(null);
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

  const handleAddMethod = async () => {
    if (!addForm.country || !addForm.name || !addForm.type) {
      showMessage('Country, name, and type are required', 'error');
      return;
    }
    setAddSaving(true);
    const supabase = createClient();
    const { data, error } = await supabase.from('payment_methods').insert({
      country: addForm.country,
      type: addForm.type,
      name: addForm.name,
      account_number: addForm.account_number || null,
      account_name: addForm.account_name || null,
      network: addForm.network || null,
      instructions: addForm.instructions || null,
      min_deposit: addForm.min_deposit,
      max_deposit: addForm.max_deposit,
      is_active: true,
    }).select().single();
    if (error) {
      showMessage(`Failed to add method: ${error.message}`, 'error');
    } else {
      setMethods((prev) => [...prev, data as PaymentMethod].sort((a, b) => a.country.localeCompare(b.country)));
      showMessage(`${addForm.name} added successfully`, 'success');
      setShowAddModal(false);
      setAddForm(EMPTY_FORM);
    }
    setAddSaving(false);
  };

  // Get unique countries and types
  const countries = Array.from(new Set(methods.map((m) => m.country).filter(Boolean))).sort();
  const types = Array.from(new Set(methods.map((m) => m.type).filter(Boolean)));

  // All available countries for the add form (known + any from DB not in list)
  const allCountries = Array.from(new Set([...KNOWN_COUNTRIES, ...countries])).sort();

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
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-400 text-xs">Live DB</span>
          </div>
          <button
            onClick={() => { setAddForm(EMPTY_FORM); setShowAddModal(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-lg text-sm font-semibold hover:bg-emerald-500/25 transition-all"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Method
          </button>
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
                            <th className="text-left text-slate-400 text-xs font-medium px-4 py-2.5 whitespace-nowrap">Del</th>
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
                                <td className="px-4 py-2.5">
                                  {deleteConfirm === method.id ? (
                                    <div className="flex items-center gap-1">
                                      <button
                                        onClick={() => handleDelete(method)}
                                        className="px-2 py-1 rounded text-[10px] font-semibold bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-all"
                                      >
                                        Confirm
                                      </button>
                                      <button
                                        onClick={() => setDeleteConfirm(null)}
                                        className="px-2 py-1 rounded text-[10px] font-semibold bg-slate-700/50 text-slate-400 border border-slate-600 hover:bg-slate-700 transition-all"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => setDeleteConfirm(method.id)}
                                      className="px-2.5 py-1 rounded text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all"
                                    >
                                      Del
                                    </button>
                                  )}
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

      {/* Add Method Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowAddModal(false); }}
        >
          <div className="bg-[#0f172a] border border-slate-700 rounded-2xl w-full max-w-md mx-4 overflow-hidden">
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
              <h3 className="text-white font-bold text-base">Add Payment Method</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-7 h-7 rounded-lg bg-white/8 hover:bg-white/15 flex items-center justify-center text-slate-400 hover:text-white transition-all"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Modal body */}
            <div className="p-5 space-y-3 max-h-[70vh] overflow-y-auto">
              {/* Country */}
              <div>
                <label className="block text-slate-400 text-xs font-medium mb-1">Country <span className="text-red-400">*</span></label>
                <select
                  value={addForm.country}
                  onChange={(e) => setAddForm((f) => ({ ...f, country: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                >
                  <option value="">Select country...</option>
                  {allCountries.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Type */}
              <div>
                <label className="block text-slate-400 text-xs font-medium mb-1">Type <span className="text-red-400">*</span></label>
                <select
                  value={addForm.type}
                  onChange={(e) => setAddForm((f) => ({ ...f, type: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                >
                  <option value="bank">Bank Transfer</option>
                  <option value="ewallet">E-Wallet</option>
                  <option value="crypto">Cryptocurrency</option>
                  <option value="card">Credit / Debit Card</option>
                </select>
              </div>

              {/* Name */}
              <div>
                <label className="block text-slate-400 text-xs font-medium mb-1">Method Name <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  value={addForm.name}
                  onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Maybank, GoPay, USDT TRC20"
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              {/* Account Number */}
              <div>
                <label className="block text-slate-400 text-xs font-medium mb-1">Account Number / Address</label>
                <input
                  type="text"
                  value={addForm.account_number}
                  onChange={(e) => setAddForm((f) => ({ ...f, account_number: e.target.value }))}
                  placeholder="e.g. 1234567890 or wallet address"
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              {/* Account Name */}
              <div>
                <label className="block text-slate-400 text-xs font-medium mb-1">Account Name / Holder</label>
                <input
                  type="text"
                  value={addForm.account_name}
                  onChange={(e) => setAddForm((f) => ({ ...f, account_name: e.target.value }))}
                  placeholder="e.g. PT. Example Company"
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              {/* Network */}
              <div>
                <label className="block text-slate-400 text-xs font-medium mb-1">Network / Chain</label>
                <input
                  type="text"
                  value={addForm.network}
                  onChange={(e) => setAddForm((f) => ({ ...f, network: e.target.value }))}
                  placeholder="e.g. TRC20, ERC20, BEP20"
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              {/* Min / Max */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 text-xs font-medium mb-1">Min Deposit</label>
                  <input
                    type="number"
                    value={addForm.min_deposit}
                    onChange={(e) => setAddForm((f) => ({ ...f, min_deposit: parseFloat(e.target.value) || 0 }))}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-xs font-medium mb-1">Max Deposit</label>
                  <input
                    type="number"
                    value={addForm.max_deposit}
                    onChange={(e) => setAddForm((f) => ({ ...f, max_deposit: parseFloat(e.target.value) || 0 }))}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
              </div>

              {/* Instructions */}
              <div>
                <label className="block text-slate-400 text-xs font-medium mb-1">Instructions</label>
                <textarea
                  value={addForm.instructions}
                  onChange={(e) => setAddForm((f) => ({ ...f, instructions: e.target.value }))}
                  placeholder="Payment instructions for the user..."
                  rows={3}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 resize-none"
                />
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-slate-700">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-slate-700/50 text-slate-300 border border-slate-600 hover:bg-slate-700 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleAddMethod}
                disabled={addSaving}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {addSaving ? (
                  <span className="w-3.5 h-3.5 border border-emerald-400 border-t-transparent rounded-full animate-spin inline-block" />
                ) : (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                )}
                Add Method
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
