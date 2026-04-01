'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ShieldCheckIcon, KeyIcon, LockClosedIcon } from '@heroicons/react/24/outline';

interface SecuritySettings {
  require_2fa: boolean;
  session_timeout_enabled: boolean;
  session_timeout_minutes: number;
  ip_whitelist_enabled: boolean;
  login_attempt_limit_enabled: boolean;
  max_login_attempts: number;
  max_daily_withdrawal_usd: number;
  withdrawal_approval_threshold_usd: number;
}

const DEFAULT_SETTINGS: SecuritySettings = {
  require_2fa: false,
  session_timeout_enabled: true,
  session_timeout_minutes: 30,
  ip_whitelist_enabled: false,
  login_attempt_limit_enabled: true,
  max_login_attempts: 5,
  max_daily_withdrawal_usd: 50000,
  withdrawal_approval_threshold_usd: 1000,
};

export default function SecuritySettingsPage() {
  const [settings, setSettings] = useState<SecuritySettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const fetchSettings = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('platform_settings')
      .select('key, value')
      .in('key', Object.keys(DEFAULT_SETTINGS));

    if (data && data.length > 0) {
      const parsed: Partial<SecuritySettings> = {};
      data.forEach((row: { key: string; value: string }) => {
        const k = row.key as keyof SecuritySettings;
        const raw = row.value;
        if (typeof DEFAULT_SETTINGS[k] === 'boolean') {
          (parsed as any)[k] = raw === 'true';
        } else if (typeof DEFAULT_SETTINGS[k] === 'number') {
          (parsed as any)[k] = Number(raw);
        }
      });
      setSettings((prev) => ({ ...prev, ...parsed }));
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const handleSave = async () => {
    setSaving(true);
    const supabase = createClient();
    const rows = Object.entries(settings).map(([key, value]) => ({
      key,
      value: String(value),
      category: 'security',
    }));
    const { error } = await supabase.from('platform_settings').upsert(rows, { onConflict: 'key' });
    if (error) {
      setMessage('Failed to save settings: ' + error.message);
    } else {
      setMessage('Security settings saved successfully');
    }
    setSaving(false);
    setTimeout(() => setMessage(''), 3000);
  };

  const set = (key: keyof SecuritySettings, value: boolean | number) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-400">Loading security settings...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Security Settings</h1>
        <p className="text-gray-400 text-sm mt-1">Platform security configuration and access control</p>
      </div>

      {message && (
        <div className={`px-4 py-3 rounded-lg text-sm border ${message.startsWith('Failed') ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-green-500/10 border-green-500/20 text-green-400'}`}>
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#0f1629] border border-white/10 rounded-xl p-6">
          <h2 className="text-white font-semibold mb-4 flex items-center gap-2"><ShieldCheckIcon className="w-5 h-5 text-blue-400" /> Authentication</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-white text-sm">Two-Factor Authentication</div>
                <div className="text-gray-500 text-xs">Require 2FA for admin accounts</div>
              </div>
              <div className="relative">
                <input type="checkbox" className="sr-only peer" id="2fa" checked={settings.require_2fa} onChange={(e) => set('require_2fa', e.target.checked)} />
                <label htmlFor="2fa" className="w-10 h-5 bg-white/10 peer-checked:bg-blue-600 rounded-full cursor-pointer block transition-colors" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-white text-sm">Session Timeout</div>
                <div className="text-gray-500 text-xs">Auto-logout after inactivity</div>
              </div>
              <div className="relative">
                <input type="checkbox" className="sr-only peer" id="session-timeout" checked={settings.session_timeout_enabled} onChange={(e) => set('session_timeout_enabled', e.target.checked)} />
                <label htmlFor="session-timeout" className="w-10 h-5 bg-white/10 peer-checked:bg-blue-600 rounded-full cursor-pointer block transition-colors" />
              </div>
            </div>
            <div>
              <label className="text-gray-400 text-sm block mb-1">Session Timeout (minutes)</label>
              <input type="number" value={settings.session_timeout_minutes} onChange={(e) => set('session_timeout_minutes', Number(e.target.value))}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500" />
            </div>
          </div>
        </div>

        <div className="bg-[#0f1629] border border-white/10 rounded-xl p-6">
          <h2 className="text-white font-semibold mb-4 flex items-center gap-2"><LockClosedIcon className="w-5 h-5 text-red-400" /> Access Control</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-white text-sm">IP Whitelist</div>
                <div className="text-gray-500 text-xs">Restrict admin access by IP</div>
              </div>
              <div className="relative">
                <input type="checkbox" className="sr-only peer" id="ip-whitelist" checked={settings.ip_whitelist_enabled} onChange={(e) => set('ip_whitelist_enabled', e.target.checked)} />
                <label htmlFor="ip-whitelist" className="w-10 h-5 bg-white/10 peer-checked:bg-blue-600 rounded-full cursor-pointer block transition-colors" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-white text-sm">Login Attempt Limit</div>
                <div className="text-gray-500 text-xs">Lock account after failed attempts</div>
              </div>
              <div className="relative">
                <input type="checkbox" className="sr-only peer" id="login-limit" checked={settings.login_attempt_limit_enabled} onChange={(e) => set('login_attempt_limit_enabled', e.target.checked)} />
                <label htmlFor="login-limit" className="w-10 h-5 bg-white/10 peer-checked:bg-blue-600 rounded-full cursor-pointer block transition-colors" />
              </div>
            </div>
            <div>
              <label className="text-gray-400 text-sm block mb-1">Max Login Attempts</label>
              <input type="number" value={settings.max_login_attempts} onChange={(e) => set('max_login_attempts', Number(e.target.value))}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500" />
            </div>
          </div>
        </div>

        <div className="bg-[#0f1629] border border-white/10 rounded-xl p-6 md:col-span-2">
          <h2 className="text-white font-semibold mb-4 flex items-center gap-2"><KeyIcon className="w-5 h-5 text-yellow-400" /> Withdrawal Security</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-gray-400 text-sm block mb-1">Max Daily Withdrawal (USD)</label>
              <input type="number" value={settings.max_daily_withdrawal_usd} onChange={(e) => set('max_daily_withdrawal_usd', Number(e.target.value))}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="text-gray-400 text-sm block mb-1">Withdrawal Approval Threshold (USD)</label>
              <input type="number" value={settings.withdrawal_approval_threshold_usd} onChange={(e) => set('withdrawal_approval_threshold_usd', Number(e.target.value))}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={handleSave} disabled={saving}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors">
          {saving ? 'Saving...' : 'Save Security Settings'}
        </button>
      </div>
    </div>
  );
}
