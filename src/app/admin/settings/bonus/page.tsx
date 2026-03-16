'use client';

import { useState, useEffect, useCallback } from 'react';
import { GiftIcon, PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { createClient } from '@/lib/supabase/client';

interface BonusSetting {
  id: string;
  name: string;
  bonus_percent: number;
  is_active: boolean;
  applies_to: string;
  min_deposit: number;
  max_bonus: number;
  created_at: string;
  updated_at: string;
}

interface EditForm {
  name: string;
  bonus_percent: string;
  min_deposit: string;
  max_bonus: string;
  is_active: boolean;
}

function calcExample(bonusPercent: number, minDeposit: number, maxBonus: number) {
  const exampleDeposit = Math.max(minDeposit, 1000);
  const rawBonus = (exampleDeposit * bonusPercent) / 100;
  const bonus = Math.min(rawBonus, maxBonus);
  const total = exampleDeposit + bonus;
  return { exampleDeposit, bonus, total };
}

export default function BonusSettingsPage() {
  const [settings, setSettings] = useState<BonusSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({ name: '', bonus_percent: '', min_deposit: '', max_bonus: '', is_active: true });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const fetchSettings = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.from('bonus_settings').select('*').order('created_at');
    setSettings((data as BonusSetting[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const startEdit = (s: BonusSetting) => {
    setEditingId(s.id);
    setEditForm({
      name: s.name,
      bonus_percent: String(s.bonus_percent),
      min_deposit: String(s.min_deposit),
      max_bonus: String(s.max_bonus),
      is_active: s.is_active,
    });
  };

  const cancelEdit = () => { setEditingId(null); };

  const saveEdit = async (id: string) => {
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from('bonus_settings').update({
      name: editForm.name,
      bonus_percent: parseFloat(editForm.bonus_percent) || 0,
      min_deposit: parseFloat(editForm.min_deposit) || 0,
      max_bonus: parseFloat(editForm.max_bonus) || 0,
      is_active: editForm.is_active,
      updated_at: new Date().toISOString(),
    }).eq('id', id);

    if (!error) {
      setMessage('✅ Bonus settings saved successfully.');
      setEditingId(null);
      fetchSettings();
      setTimeout(() => setMessage(''), 4000);
    } else {
      setMessage('❌ Failed to save. Please try again.');
      setTimeout(() => setMessage(''), 4000);
    }
    setSaving(false);
  };

  const toggleActive = async (s: BonusSetting) => {
    const supabase = createClient();
    await supabase.from('bonus_settings').update({ is_active: !s.is_active, updated_at: new Date().toISOString() }).eq('id', s.id);
    fetchSettings();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <GiftIcon className="w-7 h-7 text-yellow-400" />
          Bonus Settings
        </h1>
        <p className="text-slate-400 text-sm mt-1">Configure welcome bonus for first-time depositors</p>
      </div>

      {message && (
        <div className="bg-slate-800 border border-slate-700 text-slate-200 text-sm px-4 py-3 rounded-xl">
          {message}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : settings.length === 0 ? (
        <div className="bg-[#1e293b] border border-slate-700 rounded-xl p-10 text-center text-slate-500 text-sm">
          No bonus settings found. Run the migration to create the default welcome bonus.
        </div>
      ) : (
        <div className="space-y-4">
          {settings.map((s) => {
            const isEditing = editingId === s.id;
            const bp = isEditing ? (parseFloat(editForm.bonus_percent) || 0) : s.bonus_percent;
            const md = isEditing ? (parseFloat(editForm.min_deposit) || 0) : s.min_deposit;
            const mb = isEditing ? (parseFloat(editForm.max_bonus) || 0) : s.max_bonus;
            const { exampleDeposit, bonus, total } = calcExample(bp, md, mb);

            return (
              <div key={s.id} className="bg-[#1e293b] border border-slate-700 rounded-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-yellow-500/15 flex items-center justify-center">
                      <GiftIcon className="w-5 h-5 text-yellow-400" />
                    </div>
                    {isEditing ? (
                      <input
                        value={editForm.name}
                        onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                        className="bg-slate-900 border border-slate-600 rounded-lg px-3 py-1.5 text-white text-sm font-semibold focus:outline-none focus:border-yellow-500/60 w-48"
                      />
                    ) : (
                      <div>
                        <div className="text-white font-semibold">{s.name}</div>
                        <div className="text-slate-500 text-xs capitalize">{s.applies_to.replace('_', ' ')}</div>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Toggle */}
                    <button
                      onClick={() => isEditing ? setEditForm((f) => ({ ...f, is_active: !f.is_active })) : toggleActive(s)}
                      className={`relative w-11 h-6 rounded-full transition-colors ${(isEditing ? editForm.is_active : s.is_active) ? 'bg-yellow-500' : 'bg-slate-600'}`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${(isEditing ? editForm.is_active : s.is_active) ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                    <span className={`text-xs font-semibold ${(isEditing ? editForm.is_active : s.is_active) ? 'text-yellow-400' : 'text-slate-500'}`}>
                      {(isEditing ? editForm.is_active : s.is_active) ? 'Active' : 'Inactive'}
                    </span>

                    {isEditing ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => saveEdit(s.id)}
                          disabled={saving}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/15 text-green-400 border border-green-500/25 hover:bg-green-500/25 text-xs font-semibold transition-colors disabled:opacity-60"
                        >
                          {saving ? <span className="w-3 h-3 border border-green-400 border-t-transparent rounded-full animate-spin" /> : <CheckIcon className="w-3.5 h-3.5" />}
                          Save
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700 text-slate-300 border border-slate-600 hover:bg-slate-600 text-xs font-semibold transition-colors"
                        >
                          <XMarkIcon className="w-3.5 h-3.5" /> Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => startEdit(s)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700 text-slate-300 border border-slate-600 hover:bg-slate-600 text-xs font-semibold transition-colors"
                      >
                        <PencilIcon className="w-3.5 h-3.5" /> Edit
                      </button>
                    )}
                  </div>
                </div>

                {/* Fields */}
                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Bonus Percent (%)</label>
                    {isEditing ? (
                      <input
                        type="number"
                        value={editForm.bonus_percent}
                        onChange={(e) => setEditForm((f) => ({ ...f, bonus_percent: e.target.value }))}
                        className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-2.5 text-white text-lg font-bold focus:outline-none focus:border-yellow-500/60 transition-colors"
                        min="0" max="1000" step="1"
                      />
                    ) : (
                      <div className="text-3xl font-bold text-yellow-400">{s.bonus_percent}%</div>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Min Deposit (USD)</label>
                    {isEditing ? (
                      <input
                        type="number"
                        value={editForm.min_deposit}
                        onChange={(e) => setEditForm((f) => ({ ...f, min_deposit: e.target.value }))}
                        className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-2.5 text-white text-lg font-bold focus:outline-none focus:border-yellow-500/60 transition-colors"
                        min="0" step="1"
                      />
                    ) : (
                      <div className="text-3xl font-bold text-white">${s.min_deposit.toLocaleString()}</div>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Max Bonus (USD)</label>
                    {isEditing ? (
                      <input
                        type="number"
                        value={editForm.max_bonus}
                        onChange={(e) => setEditForm((f) => ({ ...f, max_bonus: e.target.value }))}
                        className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-2.5 text-white text-lg font-bold focus:outline-none focus:border-yellow-500/60 transition-colors"
                        min="0" step="100"
                      />
                    ) : (
                      <div className="text-3xl font-bold text-white">${s.max_bonus.toLocaleString()}</div>
                    )}
                  </div>
                </div>

                {/* Example Calculation */}
                <div className="mx-6 mb-6 bg-yellow-500/8 border border-yellow-500/20 rounded-xl p-4">
                  <div className="text-xs font-semibold text-yellow-400 uppercase tracking-wider mb-3">📊 Example Calculation</div>
                  <div className="flex items-center gap-2 flex-wrap text-sm">
                    <span className="text-slate-300">User deposits</span>
                    <span className="px-2.5 py-1 bg-slate-800 rounded-lg text-white font-bold">${exampleDeposit.toLocaleString()}</span>
                    <span className="text-slate-500">→ receives</span>
                    <span className="px-2.5 py-1 bg-yellow-500/15 rounded-lg text-yellow-400 font-bold">+${bonus.toLocaleString()} bonus</span>
                    <span className="text-slate-500">→ total credited</span>
                    <span className="px-2.5 py-1 bg-emerald-500/15 rounded-lg text-emerald-400 font-bold">${total.toLocaleString()}</span>
                  </div>
                  {bonus < (exampleDeposit * bp) / 100 && (
                    <p className="text-slate-500 text-xs mt-2">* Bonus capped at max ${mb.toLocaleString()}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
