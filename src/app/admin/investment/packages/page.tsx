'use client';

import { useState, useEffect, useCallback } from 'react';
import { PlusIcon, PencilIcon, CheckIcon, XMarkIcon, CubeIcon, ClockIcon } from '@heroicons/react/24/outline';
import { createClient } from '@/lib/supabase/client';

// ─── Types ────────────────────────────────────────────────────────────────────

type Tier = 'basic' | 'silver' | 'gold' | 'diamond';
type Duration = '3h' | '6h' | '12h' | '1d';

interface PackageConfig {
  id: string;
  tier: Tier;
  capital: number;
  baseProfit: number;
  enabled: boolean;
  sortOrder: number;
}

interface DurationConfig {
  id: string;
  durationId: Duration;
  label: string;
  factor: number;
  enabled: boolean;
  sortOrder: number;
}

// ─── Static Config ────────────────────────────────────────────────────────────

const TIER_COLORS: Record<Tier, { text: string; bg: string; border: string; dot: string }> = {
  basic:   { text: '#10b981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.25)', dot: '#10b981' },
  silver:  { text: '#94a3b8', bg: 'rgba(148,163,184,0.12)', border: 'rgba(148,163,184,0.25)', dot: '#94a3b8' },
  gold:    { text: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)', dot: '#f59e0b' },
  diamond: { text: '#38bdf8', bg: 'rgba(56,189,248,0.12)', border: 'rgba(56,189,248,0.25)', dot: '#38bdf8' },
};

const TIER_LABELS: Record<Tier, string> = {
  basic: 'Basic',
  silver: 'Silver',
  gold: 'Gold',
  diamond: 'Diamond',
};

const TIER_ICONS: Record<Tier, string> = {
  basic: '⚡',
  silver: '🥈',
  gold: '🥇',
  diamond: '💎',
};

function fmt(n: number): string {
  return `$${n.toLocaleString('en-US')}`;
}

// ─── Toggle Switch ─────────────────────────────────────────────────────────────

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${enabled ? 'bg-emerald-500' : 'bg-slate-600'}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-200 ${enabled ? 'translate-x-6' : 'translate-x-1'}`}
      />
    </button>
  );
}

// ─── Edit Row ─────────────────────────────────────────────────────────────────

interface EditRowProps {
  pkg: PackageConfig;
  onSave: (updated: PackageConfig) => void;
  onCancel: () => void;
}

function EditRow({ pkg, onSave, onCancel }: EditRowProps) {
  const [capital, setCapital] = useState(String(pkg.capital));
  const [baseProfit, setBaseProfit] = useState(String(pkg.baseProfit));
  const c = TIER_COLORS[pkg.tier];

  const handleSave = () => {
    const cv = parseFloat(capital);
    const pv = parseFloat(baseProfit);
    if (isNaN(cv) || isNaN(pv) || cv <= 0 || pv <= 0) return;
    onSave({ ...pkg, capital: cv, baseProfit: pv });
  };

  return (
    <tr style={{ background: `${c.bg}` }} className="border-b border-slate-700/60">
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <span className="text-base">{TIER_ICONS[pkg.tier]}</span>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold" style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>
            {TIER_LABELS[pkg.tier]}
          </span>
        </div>
      </td>
      <td className="px-5 py-3.5">
        <input
          type="number"
          value={capital}
          onChange={e => setCapital(e.target.value)}
          className="w-32 bg-slate-800 border border-slate-600 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30"
        />
      </td>
      <td className="px-5 py-3.5">
        <input
          type="number"
          value={baseProfit}
          onChange={e => setBaseProfit(e.target.value)}
          className="w-40 bg-slate-800 border border-slate-600 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30"
        />
      </td>
      <td className="px-5 py-3.5 text-slate-500 text-sm">—</td>
      <td className="px-5 py-3.5">
        <div className="flex gap-2">
          <button onClick={handleSave} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg text-xs font-medium hover:bg-emerald-500/30 transition-colors border border-emerald-500/20">
            <CheckIcon className="w-3.5 h-3.5" /> Save
          </button>
          <button onClick={onCancel} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 text-slate-400 rounded-lg text-xs font-medium hover:bg-slate-600 transition-colors">
            <XMarkIcon className="w-3.5 h-3.5" /> Cancel
          </button>
        </div>
      </td>
    </tr>
  );
}

// ─── Add Package Modal ────────────────────────────────────────────────────────

interface AddModalProps {
  onAdd: (pkg: Omit<PackageConfig, 'id' | 'sortOrder'>) => void;
  onClose: () => void;
}

function AddPackageModal({ onAdd, onClose }: AddModalProps) {
  const [tier, setTier] = useState<Tier>('basic');
  const [capital, setCapital] = useState('');
  const [baseProfit, setBaseProfit] = useState('');
  const [error, setError] = useState('');

  const handleAdd = () => {
    const c = parseFloat(capital);
    const p = parseFloat(baseProfit);
    if (isNaN(c) || c <= 0) { setError('Enter a valid capital amount'); return; }
    if (isNaN(p) || p <= 0) { setError('Enter a valid base profit'); return; }
    onAdd({ tier, capital: c, baseProfit: p, enabled: true });
  };

  const selectedColor = TIER_COLORS[tier];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0f172a] border border-slate-700/80 rounded-2xl w-full max-w-md shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-700/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
              <CubeIcon className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-base">Add New Package</h3>
              <p className="text-slate-500 text-xs mt-0.5">Configure a new investment tier package</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Tier selector */}
          <div>
            <label className="text-slate-400 text-xs font-medium uppercase tracking-wider block mb-2">Tier</label>
            <div className="grid grid-cols-4 gap-2">
              {(['basic', 'silver', 'gold', 'diamond'] as Tier[]).map(t => {
                const tc = TIER_COLORS[t];
                const isSelected = tier === t;
                return (
                  <button
                    key={t}
                    onClick={() => setTier(t)}
                    className="flex flex-col items-center gap-1.5 py-2.5 px-2 rounded-xl border transition-all text-xs font-medium"
                    style={{
                      background: isSelected ? tc.bg : 'rgba(30,41,59,0.5)',
                      borderColor: isSelected ? tc.border : 'rgba(71,85,105,0.4)',
                      color: isSelected ? tc.text : '#94a3b8',
                    }}
                  >
                    <span className="text-lg">{TIER_ICONS[t]}</span>
                    {TIER_LABELS[t]}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-slate-400 text-xs font-medium uppercase tracking-wider block mb-2">Capital (USD)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-medium">$</span>
              <input
                type="number"
                value={capital}
                onChange={e => setCapital(e.target.value)}
                placeholder="e.g. 500"
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-7 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 placeholder-slate-600"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-400 text-xs font-medium uppercase tracking-wider block mb-2">Base Profit (USD · 3h factor)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-medium">$</span>
              <input
                type="number"
                value={baseProfit}
                onChange={e => setBaseProfit(e.target.value)}
                placeholder="e.g. 10000"
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-7 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 placeholder-slate-600"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 px-3 py-2.5 bg-red-500/10 border border-red-500/20 rounded-lg">
              <XMarkIcon className="w-4 h-4 text-red-400 flex-shrink-0" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
        </div>

        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 bg-slate-800 text-slate-300 rounded-xl text-sm font-medium hover:bg-slate-700 transition-colors border border-slate-700">
            Cancel
          </button>
          <button
            onClick={handleAdd}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
            style={{ background: selectedColor.text, color: '#0f172a' }}
          >
            Add Package
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminInvestmentPackagesPage() {
  const supabase = createClient();
  const [packages, setPackages] = useState<PackageConfig[]>([]);
  const [durations, setDurations] = useState<DurationConfig[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterTier, setFilterTier] = useState<Tier | 'all'>('all');

  // ── Load from Supabase ──────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [pkgRes, durRes] = await Promise.all([
        supabase
          .from('investment_tier_configs')
          .select('*')
          .order('sort_order', { ascending: true }),
        supabase
          .from('investment_duration_configs')
          .select('*')
          .order('sort_order', { ascending: true }),
      ]);

      if (pkgRes.error) throw pkgRes.error;
      if (durRes.error) throw durRes.error;

      setPackages(
        (pkgRes.data || []).map(r => ({
          id: r.id,
          tier: r.tier as Tier,
          capital: Number(r.capital_usd),
          baseProfit: Number(r.base_profit),
          enabled: r.is_enabled,
          sortOrder: r.sort_order,
        }))
      );

      setDurations(
        (durRes.data || []).map(r => ({
          id: r.id,
          durationId: r.duration_id as Duration,
          label: r.label,
          factor: Number(r.factor),
          enabled: r.is_enabled,
          sortOrder: r.sort_order,
        }))
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Save all to Supabase ────────────────────────────────────────────────────
  const saveAll = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      // Upsert packages
      const pkgUpserts = packages.map(p => ({
        id: p.id,
        tier: p.tier,
        capital_usd: p.capital,
        base_profit: p.baseProfit,
        is_enabled: p.enabled,
        sort_order: p.sortOrder,
        updated_at: new Date().toISOString(),
      }));

      const { error: pkgErr } = await supabase
        .from('investment_tier_configs')
        .upsert(pkgUpserts, { onConflict: 'id' });
      if (pkgErr) throw pkgErr;

      // Upsert durations
      const durUpserts = durations.map(d => ({
        id: d.id,
        duration_id: d.durationId,
        label: d.label,
        factor: d.factor,
        is_enabled: d.enabled,
        sort_order: d.sortOrder,
        updated_at: new Date().toISOString(),
      }));

      const { error: durErr } = await supabase
        .from('investment_duration_configs')
        .upsert(durUpserts, { onConflict: 'id' });
      if (durErr) throw durErr;

      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }, [packages, durations, supabase]);

  const togglePackage = (id: string) => {
    setPackages(prev => prev.map(p => p.id === id ? { ...p, enabled: !p.enabled } : p));
  };

  const updatePackage = (updated: PackageConfig) => {
    setPackages(prev => prev.map(p => p.id === updated.id ? updated : p));
    setEditingId(null);
  };

  const addPackage = async (pkg: Omit<PackageConfig, 'id' | 'sortOrder'>) => {
    setError(null);
    try {
      const maxOrder = packages.length > 0 ? Math.max(...packages.map(p => p.sortOrder)) : 0;
      const { data, error: insertErr } = await supabase
        .from('investment_tier_configs')
        .insert({
          tier: pkg.tier,
          capital_usd: pkg.capital,
          base_profit: pkg.baseProfit,
          is_enabled: pkg.enabled,
          sort_order: maxOrder + 1,
        })
        .select()
        .single();

      if (insertErr) throw insertErr;

      setPackages(prev => [...prev, {
        id: data.id,
        tier: data.tier as Tier,
        capital: Number(data.capital_usd),
        baseProfit: Number(data.base_profit),
        enabled: data.is_enabled,
        sortOrder: data.sort_order,
      }]);
      setShowAddModal(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to add package');
    }
  };

  const toggleDuration = (id: string) => {
    setDurations(prev => prev.map(d => d.id === id ? { ...d, enabled: !d.enabled } : d));
  };

  const updateDurationFactor = (id: string, factor: number) => {
    setDurations(prev => prev.map(d => d.id === id ? { ...d, factor } : d));
  };

  const filtered = filterTier === 'all' ? packages : packages.filter(p => p.tier === filterTier);
  const tiers: Tier[] = ['basic', 'silver', 'gold', 'diamond'];

  const tierCounts = tiers.reduce((acc, t) => {
    acc[t] = packages.filter(p => p.tier === t).length;
    return acc;
  }, {} as Record<Tier, number>);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Loading package configurations…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
              <CubeIcon className="w-5 h-5 text-emerald-400" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Package Management</h1>
          </div>
          <p className="text-slate-400 text-sm ml-12">Configure investment tiers, capital amounts, and profit settings</p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 text-slate-900 font-semibold rounded-xl text-sm hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20"
          >
            <PlusIcon className="w-4 h-4" />
            Add Package
          </button>
          <button
            onClick={saveAll}
            disabled={saving}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
              saved
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' :'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700 hover:border-slate-600'
            } disabled:opacity-50`}
          >
            {saving ? (
              <><span className="w-3.5 h-3.5 border border-slate-400 border-t-transparent rounded-full animate-spin" /> Saving…</>
            ) : saved ? (
              <><CheckIcon className="w-4 h-4" /> Saved!</>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div className="flex items-center gap-3 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl">
          <XMarkIcon className="w-4 h-4 text-red-400 flex-shrink-0" />
          <p className="text-red-400 text-sm">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto text-red-400/60 hover:text-red-400">
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Tier Summary Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {tiers.map(t => {
          const c = TIER_COLORS[t];
          const count = tierCounts[t];
          const activeCount = packages.filter(p => p.tier === t && p.enabled).length;
          return (
            <div
              key={t}
              className="rounded-xl p-4 border cursor-pointer transition-all hover:scale-[1.02]"
              style={{ background: c.bg, borderColor: c.border }}
              onClick={() => setFilterTier(filterTier === t ? 'all' : t)}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xl">{TIER_ICONS[t]}</span>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: 'rgba(0,0,0,0.25)', color: c.text }}>
                  {activeCount}/{count} active
                </span>
              </div>
              <p className="text-white font-semibold text-sm">{TIER_LABELS[t]}</p>
              <p className="text-xs mt-0.5" style={{ color: c.text }}>
                {count} package{count !== 1 ? 's' : ''}
              </p>
            </div>
          );
        })}
      </div>

      {/* ── Duration Settings ── */}
      <div className="bg-[#0f172a] border border-slate-700/60 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-700/60 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center">
            <ClockIcon className="w-4 h-4 text-slate-400" />
          </div>
          <div>
            <h2 className="text-white font-semibold text-sm">Duration Settings</h2>
            <p className="text-slate-500 text-xs">Profit multipliers per investment duration</p>
          </div>
        </div>
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {durations.map(dur => (
            <div
              key={dur.id}
              className={`rounded-xl border p-4 transition-all ${
                dur.enabled
                  ? 'bg-slate-800/60 border-slate-600/60' :'bg-slate-800/20 border-slate-700/40 opacity-50'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-white font-semibold text-sm">{dur.label}</p>
                  <p className="text-slate-500 text-xs mt-0.5">×{dur.factor} base profit</p>
                </div>
                <Toggle enabled={dur.enabled} onChange={() => toggleDuration(dur.id)} />
              </div>
              <div>
                <label className="text-slate-500 text-xs font-medium uppercase tracking-wider block mb-1.5">Profit Factor</label>
                <input
                  type="number"
                  step="0.1"
                  value={dur.factor}
                  onChange={e => updateDurationFactor(dur.id, parseFloat(e.target.value) || dur.factor)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
                />
              </div>
              {dur.enabled && (
                <div className="mt-3 pt-3 border-t border-slate-700/50">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 text-xs">Multiplier</span>
                    <span className="text-emerald-400 text-xs font-semibold">×{dur.factor}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Package Table ── */}
      <div className="bg-[#0f172a] border border-slate-700/60 rounded-2xl overflow-hidden">
        {/* Table Header */}
        <div className="px-6 py-4 border-b border-slate-700/60 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-white font-semibold text-sm">Investment Packages</h2>
            <p className="text-slate-500 text-xs mt-0.5">
              {filtered.length} package{filtered.length !== 1 ? 's' : ''} {filterTier !== 'all' ? `· ${TIER_LABELS[filterTier]} tier` : '· all tiers'}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setFilterTier('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filterTier === 'all' ?'bg-emerald-500 text-slate-900 shadow-md shadow-emerald-500/20' :'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-300 border border-slate-700'
              }`}
            >
              All Tiers
            </button>
            {tiers.map(t => {
              const c = TIER_COLORS[t];
              const isActive = filterTier === t;
              return (
                <button
                  key={t}
                  onClick={() => setFilterTier(t)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all border"
                  style={{
                    background: isActive ? c.bg : 'rgba(30,41,59,0.5)',
                    color: isActive ? c.text : '#94a3b8',
                    borderColor: isActive ? c.border : 'rgba(71,85,105,0.4)',
                  }}
                >
                  {TIER_ICONS[t]} {TIER_LABELS[t]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/60">
                <th className="text-left px-5 py-3.5 text-slate-500 font-medium text-xs uppercase tracking-wider">Tier</th>
                <th className="text-left px-5 py-3.5 text-slate-500 font-medium text-xs uppercase tracking-wider">Capital (USD)</th>
                <th className="text-left px-5 py-3.5 text-slate-500 font-medium text-xs uppercase tracking-wider">Base Profit (3h)</th>
                <th className="text-left px-5 py-3.5 text-slate-500 font-medium text-xs uppercase tracking-wider">Status</th>
                <th className="text-left px-5 py-3.5 text-slate-500 font-medium text-xs uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/40">
              {filtered.map(pkg =>
                editingId === pkg.id ? (
                  <EditRow key={pkg.id} pkg={pkg} onSave={updatePackage} onCancel={() => setEditingId(null)} />
                ) : (
                  <tr
                    key={pkg.id}
                    className={`group hover:bg-slate-800/40 transition-colors ${!pkg.enabled ? 'opacity-40' : ''}`}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <span className="text-base">{TIER_ICONS[pkg.tier]}</span>
                        <span
                          className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                          style={{
                            background: TIER_COLORS[pkg.tier].bg,
                            color: TIER_COLORS[pkg.tier].text,
                            border: `1px solid ${TIER_COLORS[pkg.tier].border}`,
                          }}
                        >
                          {TIER_LABELS[pkg.tier]}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-white font-semibold">{fmt(pkg.capital)}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-emerald-400 font-semibold">{fmt(pkg.baseProfit)}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => togglePackage(pkg.id)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors border ${
                          pkg.enabled
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20' :'bg-slate-700/50 text-slate-500 border-slate-600/50 hover:bg-slate-700'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${pkg.enabled ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                        {pkg.enabled ? 'Active' : 'Disabled'}
                      </button>
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => setEditingId(pkg.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 text-slate-400 rounded-lg text-xs font-medium hover:bg-slate-700 hover:text-white transition-colors border border-slate-700 group-hover:border-slate-600 opacity-0 group-hover:opacity-100"
                      >
                        <PencilIcon className="w-3.5 h-3.5" />
                        Edit
                      </button>
                    </td>
                  </tr>
                )
              )}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2">
                      <CubeIcon className="w-8 h-8 text-slate-700" />
                      <p className="text-slate-500 text-sm">No packages found</p>
                      <p className="text-slate-600 text-xs">Try selecting a different tier filter</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && <AddPackageModal onAdd={addPackage} onClose={() => setShowAddModal(false)} />}
    </div>
  );
}
