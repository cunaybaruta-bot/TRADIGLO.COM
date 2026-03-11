'use client';

import { ShieldCheckIcon, KeyIcon, LockClosedIcon } from '@heroicons/react/24/outline';

export default function SecuritySettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Security Settings</h1>
        <p className="text-gray-400 text-sm mt-1">Platform security configuration and access control</p>
      </div>

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
                <input type="checkbox" className="sr-only peer" id="2fa" />
                <label htmlFor="2fa" className="w-10 h-5 bg-white/10 peer-checked:bg-blue-600 rounded-full cursor-pointer block transition-colors" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-white text-sm">Session Timeout</div>
                <div className="text-gray-500 text-xs">Auto-logout after inactivity</div>
              </div>
              <div className="relative">
                <input type="checkbox" defaultChecked className="sr-only peer" id="session-timeout" />
                <label htmlFor="session-timeout" className="w-10 h-5 bg-white/10 peer-checked:bg-blue-600 rounded-full cursor-pointer block transition-colors" />
              </div>
            </div>
            <div>
              <label className="text-gray-400 text-sm block mb-1">Session Timeout (minutes)</label>
              <input type="number" defaultValue={30} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500" />
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
                <input type="checkbox" className="sr-only peer" id="ip-whitelist" />
                <label htmlFor="ip-whitelist" className="w-10 h-5 bg-white/10 peer-checked:bg-blue-600 rounded-full cursor-pointer block transition-colors" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-white text-sm">Login Attempt Limit</div>
                <div className="text-gray-500 text-xs">Lock account after failed attempts</div>
              </div>
              <div className="relative">
                <input type="checkbox" defaultChecked className="sr-only peer" id="login-limit" />
                <label htmlFor="login-limit" className="w-10 h-5 bg-white/10 peer-checked:bg-blue-600 rounded-full cursor-pointer block transition-colors" />
              </div>
            </div>
            <div>
              <label className="text-gray-400 text-sm block mb-1">Max Login Attempts</label>
              <input type="number" defaultValue={5} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500" />
            </div>
          </div>
        </div>

        <div className="bg-[#0f1629] border border-white/10 rounded-xl p-6 md:col-span-2">
          <h2 className="text-white font-semibold mb-4 flex items-center gap-2"><KeyIcon className="w-5 h-5 text-yellow-400" /> Withdrawal Security</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-gray-400 text-sm block mb-1">Max Daily Withdrawal (USD)</label>
              <input type="number" defaultValue={50000} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="text-gray-400 text-sm block mb-1">Withdrawal Approval Threshold (USD)</label>
              <input type="number" defaultValue={1000} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
          Save Security Settings
        </button>
      </div>
    </div>
  );
}
