'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Cog6ToothIcon } from '@heroicons/react/24/outline';

interface CopyTradingSettings {
  max_followers: number;
  min_copy_amount: number;
  max_copy_amount: number;
  default_profit_share: number;
  max_profit_share: number;
  platform_fee: number;
}

const DEFAULT: CopyTradingSettings = {
  max_followers: 100,
  min_copy_amount: 10,
  max_copy_amount: 10000,
  default_profit_share: 20,
  max_profit_share: 50,
  platform_fee: 5,
};

export default function CopyTradingSettingsPage() {
  const [settings, setSettings] = useState<CopyTradingSettings>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const fetchSettings = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('copy_trade_providers')
      .select('min_balance_usd')
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();

    const { data: rows } = await supabase
      .from('platform_settings')
      .select('key, value')
      .in('key', ['max_followers', 'min_copy_amount', 'max_copy_amount', 'default_profit_share', 'max_profit_share', 'copy_platform_fee']);

    if (rows && rows.length > 0) {
      const parsed: Partial<CopyTradingSettings> = {};
      rows.forEach((row: { key: string; value: string }) => {
        if (row.key === 'max_followers') parsed.max_followers = Number(row.value);
        if (row.key === 'min_copy_amount') parsed.min_copy_amount = Number(row.value);
        if (row.key === 'max_copy_amount') parsed.max_copy_amount = Number(row.value);
        if (row.key === 'default_profit_share') parsed.default_profit_share = Number(row.value);
        if (row.key === 'max_profit_share') parsed.max_profit_share = Number(row.value);
        if (row.key === 'copy_platform_fee') parsed.platform_fee = Number(row.value);
      });
      setSettings((prev) => ({ ...prev, ...parsed }));
    }

    if (data?.min_balance_usd !== undefined) {
      setSettings((prev) => ({ ...prev, min_copy_amount: Number(data.min_balance_usd) }));
    }

    setLoading(false);
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const handleSave = async () => {
    setSaving(true);
    const supabase = createClient();
    const rows = [
      { key: 'max_followers', value: String(settings.max_followers), category: 'copy_trading' },
      { key: 'min_copy_amount', value: String(settings.min_copy_amount), category: 'copy_trading' },
      { key: 'max_copy_amount', value: String(settings.max_copy_amount), category: 'copy_trading' },
      { key: 'default_profit_share', value: String(settings.default_profit_share), category: 'copy_trading' },
      { key: 'max_profit_share', value: String(settings.max_profit_share), category: 'copy_trading' },
      { key: 'copy_platform_fee', value: String(settings.platform_fee), category: 'copy_trading' },
    ];
    const { error } = await supabase.from('platform_settings').upsert(rows, { onConflict: 'key' });

    await supabase
      .from('copy_trade_providers')
      .update({ min_balance_usd: settings.min_copy_amount })
      .eq('is_active', true);

    if (error) {
      setMessage('Failed to save: ' + error.message);
    } else {
      setMessage('Copy trading settings saved successfully');
    }
    setSaving(false);
    setTimeout(() => setMessage(''), 3000);
  };

  const set = (key: keyof CopyTradingSettings, value: number) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-400">Loading settings...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Copy Trading Settings</h1>
        <p className="text-gray-400 text-sm mt-1">Configure copy trading platform parameters</p>
      </div>

      {message && (
        <div className={`px-4 py-3 rounded-lg text-sm border ${message.startsWith('Failed') ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-green-500/10 border-green-500/20 text-green-400'}`}>
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#0f1629] border border-white/10 rounded-xl p-6">
          <h2 className="text-white font-semibold mb-4 flex items-center gap-2"><Cog6ToothIcon className="w-5 h-5 text-blue-400" /> Follower Limits</h2>
          <div className="space-y-4">
            <div>
              <label className="text-gray-400 text-sm block mb-1">Max Followers per Strategy</label>
              <input type="number" value={settings.max_followers} onChange={(e) => set('max_followers', Number(e.target.value))}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="text-gray-400 text-sm block mb-1">Min Copy Amount (USD)</label>
              <input type="number" value={settings.min_copy_amount} onChange={(e) => set('min_copy_amount', Number(e.target.value))}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="text-gray-400 text-sm block mb-1">Max Copy Amount (USD)</label>
              <input type="number" value={settings.max_copy_amount} onChange={(e) => set('max_copy_amount', Number(e.target.value))}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500" />
            </div>
          </div>
        </div>

        <div className="bg-[#0f1629] border border-white/10 rounded-xl p-6">
          <h2 className="text-white font-semibold mb-4 flex items-center gap-2"><Cog6ToothIcon className="w-5 h-5 text-purple-400" /> Profit Sharing</h2>
          <div className="space-y-4">
            <div>
              <label className="text-gray-400 text-sm block mb-1">Default Profit Share (%)</label>
              <input type="number" value={settings.default_profit_share} onChange={(e) => set('default_profit_share', Number(e.target.value))}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="text-gray-400 text-sm block mb-1">Max Profit Share (%)</label>
              <input type="number" value={settings.max_profit_share} onChange={(e) => set('max_profit_share', Number(e.target.value))}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="text-gray-400 text-sm block mb-1">Platform Fee (%)</label>
              <input type="number" value={settings.platform_fee} onChange={(e) => set('platform_fee', Number(e.target.value))}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={handleSave} disabled={saving}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors">
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
