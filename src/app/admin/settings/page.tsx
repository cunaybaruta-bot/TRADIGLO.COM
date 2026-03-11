'use client';

import { Cog6ToothIcon, ClockIcon, CurrencyDollarIcon, ShieldCheckIcon, GiftIcon } from '@heroicons/react/24/outline';

const TRADE_DURATIONS = [
  { seconds: 5, label: '5 seconds' }, { seconds: 10, label: '10 seconds' },
  { seconds: 15, label: '15 seconds' }, { seconds: 20, label: '20 seconds' },
  { seconds: 30, label: '30 seconds' }, { seconds: 45, label: '45 seconds' },
  { seconds: 60, label: '1 minute' }, { seconds: 120, label: '2 minutes' },
  { seconds: 300, label: '5 minutes' }, { seconds: 600, label: '10 minutes' },
  { seconds: 1800, label: '30 minutes' }, { seconds: 3600, label: '1 hour' },
  { seconds: 7200, label: '2 hours' }, { seconds: 14400, label: '4 hours' },
  { seconds: 86400, label: '1 day' }, { seconds: 172800, label: '2 days' },
];

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-white text-xl font-bold">Platform Settings</h2>
        <p className="text-slate-400 text-sm mt-1">Investoft Platform Configuration</p>
      </div>
      {/* Payout Configuration */}
      <div className="bg-[#1e293b] rounded-xl border border-slate-700 p-5">
        <div className="flex items-center gap-2 mb-4">
          <CurrencyDollarIcon className="w-5 h-5 text-[#22c55e]" />
          <h3 className="text-white font-semibold">Trading Settings</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: 'Default Payout Percentage', value: '95%', sub: 'Win payout on successful trades' },
            { label: 'Platform Fee', value: '5%', sub: 'Retained on winning trades' },
            { label: 'Minimum Trade Amount', value: '$1.00', sub: 'Per trade minimum' },
            { label: 'Maximum Trade Amount', value: '$10,000.00', sub: 'Per trade maximum' },
          ]?.map(({ label, value, sub }) => (
            <div key={label} className="bg-[#0f172a] rounded-lg p-4 border border-slate-700">
              <div className="text-slate-400 text-xs mb-1">{label}</div>
              <div className="text-white text-2xl font-bold">{value}</div>
              <div className="text-slate-500 text-xs mt-1">{sub}</div>
            </div>
          ))}
        </div>
        <div className="mt-3 p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-lg">
          <p className="text-yellow-400 text-xs">⚠️ To change payout settings, update the database schema directly in Supabase. These values are enforced at the database level.</p>
        </div>
      </div>
      {/* Trade Durations */}
      <div className="bg-[#1e293b] rounded-xl border border-slate-700 p-5">
        <div className="flex items-center gap-2 mb-4">
          <ClockIcon className="w-5 h-5 text-[#22c55e]" />
          <h3 className="text-white font-semibold">Available Trade Durations</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {TRADE_DURATIONS?.map(({ seconds, label }) => (
            <div key={seconds} className="bg-[#0f172a] rounded-lg px-3 py-2 border border-slate-700 flex items-center justify-between">
              <span className="text-slate-300 text-sm">{label}</span>
              <span className="w-2 h-2 rounded-full bg-[#22c55e] flex-shrink-0" />
            </div>
          ))}
        </div>
        <div className="mt-3 p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg">
          <p className="text-blue-400 text-xs">ℹ️ Trade durations are enforced at the database level via CHECK constraint.</p>
        </div>
      </div>
      {/* Bonus Settings */}
      <div className="bg-[#1e293b] rounded-xl border border-slate-700 p-5">
        <div className="flex items-center gap-2 mb-4">
          <GiftIcon className="w-5 h-5 text-[#22c55e]" />
          <h3 className="text-white font-semibold">Bonus Settings</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: 'Welcome Bonus', value: 'Disabled', sub: 'New user registration bonus' },
            { label: 'Deposit Bonus', value: 'Disabled', sub: 'Bonus on first deposit' },
            { label: 'Referral Bonus', value: 'Disabled', sub: 'Bonus for referring users' },
            { label: 'Demo Balance', value: '$10,000', sub: 'Default demo account balance' },
          ]?.map(({ label, value, sub }) => (
            <div key={label} className="bg-[#0f172a] rounded-lg p-4 border border-slate-700">
              <div className="text-slate-400 text-xs mb-1">{label}</div>
              <div className="text-white text-lg font-bold">{value}</div>
              <div className="text-slate-500 text-xs mt-1">{sub}</div>
            </div>
          ))}
        </div>
        <div className="mt-3 p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg">
          <p className="text-blue-400 text-xs">ℹ️ Bonus features can be configured in the database. Contact your developer to enable specific bonuses.</p>
        </div>
      </div>
      {/* Security Settings */}
      <div className="bg-[#1e293b] rounded-xl border border-slate-700 p-5">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheckIcon className="w-5 h-5 text-[#22c55e]" />
          <h3 className="text-white font-semibold">Security Settings</h3>
        </div>
        <div className="space-y-3">
          {[
            { label: 'Row Level Security (RLS)', detail: 'All tables protected with RLS policies', status: 'Enabled' },
            { label: 'Admin Role Check', detail: 'is_admin() function enforced on all admin operations', status: 'Active' },
            { label: 'Supabase Auth', detail: 'Email/password authentication with session management', status: 'Active' },
            { label: 'HTTPS Encryption', detail: 'All data transmitted over secure HTTPS', status: 'Active' },
            { label: 'Session Management', detail: 'Auto-logout on inactivity', status: 'Active' },
          ]?.map(({ label, detail, status }) => (
            <div key={label} className="flex items-center justify-between p-3 bg-[#0f172a] rounded-lg border border-slate-700">
              <div>
                <div className="text-white text-sm font-medium">{label}</div>
                <div className="text-slate-500 text-xs">{detail}</div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">{status}</span>
            </div>
          ))}
        </div>
      </div>
      {/* Platform Info */}
      <div className="bg-[#1e293b] rounded-xl border border-slate-700 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Cog6ToothIcon className="w-5 h-5 text-[#22c55e]" />
          <h3 className="text-white font-semibold">Platform Information</h3>
        </div>
        <div className="space-y-2">
          {[
            { label: 'Platform Name', value: 'Investoft Trading Platform' },
            { label: 'Admin Panel Version', value: '2.0.0' },
            { label: 'Database', value: 'Supabase PostgreSQL' },
            { label: 'Framework', value: 'Next.js 15' },
            { label: 'Supported Assets', value: 'Crypto, Forex, Stocks, Commodities' },
          ]?.map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between py-2 border-b border-slate-700/50 last:border-0">
              <span className="text-slate-400 text-sm">{label}</span>
              <span className="text-white text-sm">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
