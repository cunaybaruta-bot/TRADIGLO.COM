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
  'Bangladesh', 'Saudi Arabia', 'UAE', 'Qatar', 'Kuwait', 'Oman', 'Sri Lanka',
  'Myanmar', 'Indonesia', 'Cambodia', 'Laos', 'Nepal', 'United States', 'Global',
];

const EMPTY_METHOD_FORM: NewMethodForm = {
  type: 'bank',
  name: '',
  account_number: '',
  account_name: '',
  network: '',
  instructions: '',
  min_deposit: 10,
  max_deposit: 50000,
};

export default function AdminCountriesPage() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [editData, setEditData] = useState<Record<string, Partial<PaymentMethod>>>({});
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Selected country state
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  // Add country modal
  const [showAddCountry, setShowAddCountry] = useState(false);
  const [newCountryName, setNewCountryName] = useState('');
  const [newCountryCustom, setNewCountryCustom] = useState('');
  const [addingCountry, setAddingCountry] = useState(false);

  // Delete country confirm
  const [deleteCountryConfirm, setDeleteCountryConfirm] = useState<string | null>(null);

  // Add method modal
  const [showAddMethod, setShowAddMethod] = useState(false);
  const [methodForm, setMethodForm] = useState<NewMethodForm>(EMPTY_METHOD_FORM);
  const [addingMethod, setAddingMethod] = useState(false);

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

  const showMsg = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3500);
  };

  // Derive unique countries from DB + known list
  const dbCountries = Array.from(new Set(methods.map((m) => m.country).filter(Boolean))).sort();
  const allKnownCountries = Array.from(new Set([...KNOWN_COUNTRIES, ...dbCountries])).sort();

  // Methods for selected country
  const countryMethods = selectedCountry
    ? methods.filter((m) => m.country === selectedCountry)
    : [];

  // Group by type for selected country
  const grouped: Record<string, PaymentMethod[]> = {};
  countryMethods.forEach((m) => {
    const type = m.type || 'other';
    if (!grouped[type]) grouped[type] = [];
    grouped[type].push(m);
  });

  // Add new country (creates a placeholder method to establish the country, or just selects it)
  const handleAddCountry = async () => {
    const name = newCountryName === '__custom__' ? newCountryCustom.trim() : newCountryName;
    if (!name) {
      showMsg('Please enter a country name', 'error');
      return;
    }
    if (dbCountries.includes(name)) {
      setSelectedCountry(name);
      setShowAddCountry(false);
      setNewCountryName('');
      setNewCountryCustom('');
      showMsg(`${name} already exists — selected it for you`, 'success');
      return;
    }
    setAddingCountry(true);
    // Create a placeholder payment method to establish the country in DB
    const supabase = createClient();
    const { data, error } = await supabase.from('payment_methods').insert({
      country: name,
      type: 'bank',
      name: 'New Method',
      is_active: false,
      min_deposit: 10,
      max_deposit: 50000,
    }).select().single();
    if (error) {
      showMsg(`Failed to add country: ${error.message}`, 'error');
    } else {
      setMethods((prev) => [...prev, data as PaymentMethod]);
      setSelectedCountry(name);
      setShowAddCountry(false);
      setNewCountryName('');
      setNewCountryCustom('');
      showMsg(`${name} added — a placeholder method was created. Edit or delete it as needed.`, 'success');
    }
    setAddingCountry(false);
  };

  // Delete entire country (delete all its methods)
  const handleDeleteCountry = async (country: string) => {
    const supabase = createClient();
    const { error } = await supabase.from('payment_methods').delete().eq('country', country);
    if (error) {
      showMsg(`Failed to delete ${country}: ${error.message}`, 'error');
    } else {
      setMethods((prev) => prev.filter((m) => m.country !== country));
      if (selectedCountry === country) setSelectedCountry(null);
      showMsg(`${country} and all its payment methods deleted`, 'success');
    }
    setDeleteCountryConfirm(null);
  };

  // Add method to selected country
  const handleAddMethod = async () => {
    if (!selectedCountry || !methodForm.name || !methodForm.type) {
      showMsg('Name and type are required', 'error');
      return;
    }
    setAddingMethod(true);
    const supabase = createClient();
    const { data, error } = await supabase.from('payment_methods').insert({
      country: selectedCountry,
      type: methodForm.type,
      name: methodForm.name,
      account_number: methodForm.account_number || null,
      account_name: methodForm.account_name || null,
      network: methodForm.network || null,
      instructions: methodForm.instructions || null,
      min_deposit: methodForm.min_deposit,
      max_deposit: methodForm.max_deposit,
      is_active: true,
    }).select().single();
    if (error) {
      showMsg(`Failed to add method: ${error.message}`, 'error');
    } else {
      setMethods((prev) => [...prev, data as PaymentMethod]);
      setShowAddMethod(false);
      setMethodForm(EMPTY_METHOD_FORM);
      showMsg(`${methodForm.name} added to ${selectedCountry}`, 'success');
    }
    setAddingMethod(false);
  };

  const handleToggleActive = async (method: PaymentMethod) => {
    const supabase = createClient();
    const newVal = !method.is_active;
    const { error } = await supabase.from('payment_methods').update({ is_active: newVal }).eq('id', method.id);
    if (error) {
      showMsg('Failed to update status', 'error');
    } else {
      setMethods((prev) => prev.map((m) => m.id === method.id ? { ...m, is_active: newVal } : m));
    }
  };

  const handleFieldChange = (id: string, field: keyof PaymentMethod, value: string | number) => {
    setEditData((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  };

  const getValue = (method: PaymentMethod, field: keyof PaymentMethod): string => {
    const edited = editData[method.id]?.[field];
    if (edited !== undefined) return String(edited);
    return String(method[field] ?? '');
  };

  const handleSave = async (method: PaymentMethod) => {
    const changes = editData[method.id];
    const payload = changes && Object.keys(changes).length > 0 ? changes : {
      name: method.name,
      account_number: method.account_number,
      account_name: method.account_name,
      network: method.network,
      instructions: method.instructions,
      min_deposit: method.min_deposit,
      max_deposit: method.max_deposit,
    };
    setSaving(method.id);
    const supabase = createClient();
    const { error } = await supabase.from('payment_methods').update(payload).eq('id', method.id);
    if (error) {
      showMsg(`Failed to save: ${error.message}`, 'error');
    } else {
      setMethods((prev) => prev.map((m) => m.id === method.id ? { ...m, ...payload } : m));
      setEditData((prev) => { const next = { ...prev }; delete next[method.id]; return next; });
      showMsg(`${method.name} saved`, 'success');
    }
    setSaving(null);
  };

  const handleDeleteMethod = async (method: PaymentMethod) => {
    const supabase = createClient();
    const { error } = await supabase.from('payment_methods').delete().eq('id', method.id);
    if (error) {
      showMsg(`Failed to delete: ${error.message}`, 'error');
    } else {
      setMethods((prev) => prev.filter((m) => m.id !== method.id));
      showMsg(`${method.name} deleted`, 'success');
    }
    setDeleteConfirm(null);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-white text-xl font-bold">Countries & Payment Methods</h2>
          <p className="text-slate-400 text-sm mt-1">
            {dbCountries.length} countries · {methods.length} payment methods
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-400 text-xs">Live DB</span>
          </div>
          <button
            onClick={() => { setNewCountryName(''); setNewCountryCustom(''); setShowAddCountry(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-lg text-sm font-semibold hover:bg-emerald-500/25 transition-all"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Country
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

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left: Country List */}
          <div className="lg:col-span-1">
            <div className="bg-[#1e293b] rounded-xl border border-slate-700 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between">
                <span className="text-white text-sm font-semibold">Countries</span>
                <span className="text-slate-500 text-xs">{dbCountries.length} total</span>
              </div>
              <div className="divide-y divide-slate-700/50 max-h-[600px] overflow-y-auto">
                {dbCountries.length === 0 && (
                  <div className="px-4 py-8 text-center text-slate-500 text-sm">
                    No countries yet. Add one to get started.
                  </div>
                )}
                {dbCountries.map((country) => {
                  const count = methods.filter((m) => m.country === country).length;
                  const activeCount = methods.filter((m) => m.country === country && m.is_active).length;
                  const isSelected = selectedCountry === country;
                  return (
                    <div
                      key={country}
                      onClick={() => setSelectedCountry(isSelected ? null : country)}
                      className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-colors group ${
                        isSelected
                          ? 'bg-emerald-500/10 border-l-2 border-emerald-500' :'hover:bg-slate-700/30 border-l-2 border-transparent'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className={`text-sm font-medium truncate ${isSelected ? 'text-emerald-400' : 'text-white'}`}>
                          {country}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {count} method{count !== 1 ? 's' : ''} · {activeCount} active
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                        {deleteCountryConfirm === country ? (
                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => handleDeleteCountry(country)}
                              className="px-2 py-0.5 rounded text-[10px] font-semibold bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-all"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setDeleteCountryConfirm(null)}
                              className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-700/50 text-slate-400 border border-slate-600 hover:bg-slate-700 transition-all"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => { e.stopPropagation(); setDeleteCountryConfirm(country); }}
                            className="opacity-0 group-hover:opacity-100 p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-all"
                            title={`Delete ${country}`}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
                            </svg>
                          </button>
                        )}
                        <svg
                          className={`w-3.5 h-3.5 transition-colors ${isSelected ? 'text-emerald-400' : 'text-slate-600'}`}
                          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                        >
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right: Payment Methods for selected country */}
          <div className="lg:col-span-2">
            {!selectedCountry ? (
              <div className="bg-[#1e293b] rounded-xl border border-slate-700 flex items-center justify-center py-24">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-slate-700/50 flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" />
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                    </svg>
                  </div>
                  <p className="text-slate-400 text-sm font-medium">Select a country</p>
                  <p className="text-slate-600 text-xs mt-1">to manage its payment methods</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Country header */}
                <div className="bg-[#1e293b] rounded-xl border border-slate-700 px-5 py-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-bold text-base">{selectedCountry}</h3>
                    <p className="text-slate-400 text-xs mt-0.5">
                      {countryMethods.length} method{countryMethods.length !== 1 ? 's' : ''} · {countryMethods.filter((m) => m.is_active).length} active
                    </p>
                  </div>
                  <button
                    onClick={() => { setMethodForm(EMPTY_METHOD_FORM); setShowAddMethod(true); }}
                    className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-lg text-xs font-semibold hover:bg-emerald-500/25 transition-all"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Add Method
                  </button>
                </div>

                {/* Methods grouped by type */}
                {countryMethods.length === 0 ? (
                  <div className="bg-[#1e293b] rounded-xl border border-slate-700 py-12 text-center">
                    <p className="text-slate-500 text-sm">No payment methods for {selectedCountry}</p>
                    <button
                      onClick={() => { setMethodForm(EMPTY_METHOD_FORM); setShowAddMethod(true); }}
                      className="mt-3 text-emerald-400 text-xs hover:underline"
                    >
                      Add the first method →
                    </button>
                  </div>
                ) : (
                  Object.entries(grouped).map(([type, typeMethods]) => (
                    <div key={type} className="bg-[#1e293b] rounded-xl border border-slate-700 overflow-hidden">
                      <div className="px-4 py-2.5 border-b border-slate-700 flex items-center gap-2">
                        <span
                          className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                          style={{ color: TYPE_COLORS[type] || '#94a3b8', background: `${TYPE_COLORS[type] || '#94a3b8'}15` }}
                        >
                          {TYPE_LABELS[type] || type}
                        </span>
                        <span className="text-slate-500 text-xs">{typeMethods.length} method{typeMethods.length !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-slate-700/50">
                              <th className="text-left text-slate-400 text-xs font-medium px-4 py-2.5 whitespace-nowrap">Name</th>
                              <th className="text-left text-slate-400 text-xs font-medium px-4 py-2.5 whitespace-nowrap">Account No.</th>
                              <th className="text-left text-slate-400 text-xs font-medium px-4 py-2.5 whitespace-nowrap">Account Name</th>
                              <th className="text-left text-slate-400 text-xs font-medium px-4 py-2.5 whitespace-nowrap">Network</th>
                              <th className="text-left text-slate-400 text-xs font-medium px-4 py-2.5 whitespace-nowrap">Min</th>
                              <th className="text-left text-slate-400 text-xs font-medium px-4 py-2.5 whitespace-nowrap">Max</th>
                              <th className="text-left text-slate-400 text-xs font-medium px-4 py-2.5 whitespace-nowrap">Instructions</th>
                              <th className="text-left text-slate-400 text-xs font-medium px-4 py-2.5 whitespace-nowrap">Active</th>
                              <th className="text-left text-slate-400 text-xs font-medium px-4 py-2.5 whitespace-nowrap">Save</th>
                              <th className="text-left text-slate-400 text-xs font-medium px-4 py-2.5 whitespace-nowrap">Del</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-700/30">
                            {typeMethods.map((method) => {
                              const hasChanges = editData[method.id] && Object.keys(editData[method.id]).length > 0;
                              return (
                                <tr key={method.id} className={`hover:bg-slate-700/20 transition-colors ${!method.is_active ? 'opacity-50' : ''}`}>
                                  <td className="px-4 py-2.5">
                                    <input
                                      type="text"
                                      value={getValue(method, 'name')}
                                      onChange={(e) => handleFieldChange(method.id, 'name', e.target.value)}
                                      className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-xs text-white w-28 focus:outline-none focus:border-emerald-500/50"
                                    />
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
                                      placeholder="Instructions..."
                                      className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-xs text-white w-36 focus:outline-none focus:border-emerald-500/50"
                                    />
                                  </td>
                                  <td className="px-4 py-2.5">
                                    <button
                                      onClick={() => handleToggleActive(method)}
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
                                          onClick={() => handleDeleteMethod(method)}
                                          className="px-2 py-1 rounded text-[10px] font-semibold bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-all"
                                        >
                                          Yes
                                        </button>
                                        <button
                                          onClick={() => setDeleteConfirm(null)}
                                          className="px-2 py-1 rounded text-[10px] font-semibold bg-slate-700/50 text-slate-400 border border-slate-600 hover:bg-slate-700 transition-all"
                                        >
                                          No
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
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Country Modal */}
      {showAddCountry && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowAddCountry(false); }}
        >
          <div className="bg-[#0f172a] border border-slate-700 rounded-2xl w-full max-w-sm mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
              <h3 className="text-white font-bold text-base">Add Country</h3>
              <button
                onClick={() => setShowAddCountry(false)}
                className="w-7 h-7 rounded-lg bg-white/8 hover:bg-white/15 flex items-center justify-center text-slate-400 hover:text-white transition-all"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-slate-400 text-xs font-medium mb-1">Select Country</label>
                <select
                  value={newCountryName}
                  onChange={(e) => setNewCountryName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                >
                  <option value="">Choose from list...</option>
                  {allKnownCountries.map((c) => <option key={c} value={c}>{c}</option>)}
                  <option value="__custom__">+ Enter custom name</option>
                </select>
              </div>
              {newCountryName === '__custom__' && (
                <div>
                  <label className="block text-slate-400 text-xs font-medium mb-1">Custom Country Name</label>
                  <input
                    type="text"
                    value={newCountryCustom}
                    onChange={(e) => setNewCountryCustom(e.target.value)}
                    placeholder="e.g. Nigeria, Brazil..."
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
                    autoFocus
                  />
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-slate-700">
              <button
                onClick={() => setShowAddCountry(false)}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-slate-700/50 text-slate-300 border border-slate-600 hover:bg-slate-700 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCountry}
                disabled={addingCountry}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {addingCountry ? (
                  <span className="w-3.5 h-3.5 border border-emerald-400 border-t-transparent rounded-full animate-spin inline-block" />
                ) : (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                )}
                Add Country
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Method Modal */}
      {showAddMethod && selectedCountry && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowAddMethod(false); }}
        >
          <div className="bg-[#0f172a] border border-slate-700 rounded-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
              <div>
                <h3 className="text-white font-bold text-base">Add Payment Method</h3>
                <p className="text-slate-400 text-xs mt-0.5">for {selectedCountry}</p>
              </div>
              <button
                onClick={() => setShowAddMethod(false)}
                className="w-7 h-7 rounded-lg bg-white/8 hover:bg-white/15 flex items-center justify-center text-slate-400 hover:text-white transition-all"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="p-5 space-y-3 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-slate-400 text-xs font-medium mb-1">Type <span className="text-red-400">*</span></label>
                <select
                  value={methodForm.type}
                  onChange={(e) => setMethodForm((f) => ({ ...f, type: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                >
                  <option value="bank">Bank Transfer</option>
                  <option value="ewallet">E-Wallet</option>
                  <option value="crypto">Cryptocurrency</option>
                  <option value="card">Credit / Debit Card</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-400 text-xs font-medium mb-1">Method Name <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  value={methodForm.name}
                  onChange={(e) => setMethodForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Maybank, GoPay, USDT TRC20"
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-xs font-medium mb-1">Account Number / Address</label>
                <input
                  type="text"
                  value={methodForm.account_number}
                  onChange={(e) => setMethodForm((f) => ({ ...f, account_number: e.target.value }))}
                  placeholder="e.g. 1234567890 or wallet address"
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-xs font-medium mb-1">Account Name / Holder</label>
                <input
                  type="text"
                  value={methodForm.account_name}
                  onChange={(e) => setMethodForm((f) => ({ ...f, account_name: e.target.value }))}
                  placeholder="e.g. PT. Example Company"
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-xs font-medium mb-1">Network / Chain</label>
                <input
                  type="text"
                  value={methodForm.network}
                  onChange={(e) => setMethodForm((f) => ({ ...f, network: e.target.value }))}
                  placeholder="e.g. TRC20, ERC20, BEP20"
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 text-xs font-medium mb-1">Min Deposit</label>
                  <input
                    type="number"
                    value={methodForm.min_deposit}
                    onChange={(e) => setMethodForm((f) => ({ ...f, min_deposit: parseFloat(e.target.value) || 0 }))}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-xs font-medium mb-1">Max Deposit</label>
                  <input
                    type="number"
                    value={methodForm.max_deposit}
                    onChange={(e) => setMethodForm((f) => ({ ...f, max_deposit: parseFloat(e.target.value) || 0 }))}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-400 text-xs font-medium mb-1">Instructions</label>
                <textarea
                  value={methodForm.instructions}
                  onChange={(e) => setMethodForm((f) => ({ ...f, instructions: e.target.value }))}
                  placeholder="Payment instructions for the user..."
                  rows={3}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 resize-none"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-slate-700">
              <button
                onClick={() => setShowAddMethod(false)}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-slate-700/50 text-slate-300 border border-slate-600 hover:bg-slate-700 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleAddMethod}
                disabled={addingMethod}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {addingMethod ? (
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
