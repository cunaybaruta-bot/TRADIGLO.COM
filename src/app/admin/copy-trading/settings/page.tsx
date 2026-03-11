'use client';

import { Cog6ToothIcon } from '@heroicons/react/24/outline';

export default function CopyTradingSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Copy Trading Settings</h1>
        <p className="text-gray-400 text-sm mt-1">Configure copy trading platform parameters</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#0f1629] border border-white/10 rounded-xl p-6">
          <h2 className="text-white font-semibold mb-4 flex items-center gap-2"><Cog6ToothIcon className="w-5 h-5 text-blue-400" /> Follower Limits</h2>
          <div className="space-y-4">
            <div>
              <label className="text-gray-400 text-sm block mb-1">Max Followers per Strategy</label>
              <input type="number" defaultValue={100} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="text-gray-400 text-sm block mb-1">Min Copy Amount (USD)</label>
              <input type="number" defaultValue={10} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="text-gray-400 text-sm block mb-1">Max Copy Amount (USD)</label>
              <input type="number" defaultValue={10000} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500" />
            </div>
          </div>
        </div>

        <div className="bg-[#0f1629] border border-white/10 rounded-xl p-6">
          <h2 className="text-white font-semibold mb-4 flex items-center gap-2"><Cog6ToothIcon className="w-5 h-5 text-purple-400" /> Profit Sharing</h2>
          <div className="space-y-4">
            <div>
              <label className="text-gray-400 text-sm block mb-1">Default Profit Share (%)</label>
              <input type="number" defaultValue={20} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="text-gray-400 text-sm block mb-1">Max Profit Share (%)</label>
              <input type="number" defaultValue={50} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="text-gray-400 text-sm block mb-1">Platform Fee (%)</label>
              <input type="number" defaultValue={5} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
          Save Settings
        </button>
      </div>
    </div>
  );
}
