'use client';

import { GiftIcon } from '@heroicons/react/24/outline';

export default function BonusSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Bonus Settings</h1>
        <p className="text-gray-400 text-sm mt-1">Configure platform bonus and reward programs</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#0f1629] border border-white/10 rounded-xl p-6">
          <h2 className="text-white font-semibold mb-4 flex items-center gap-2"><GiftIcon className="w-5 h-5 text-yellow-400" /> Welcome Bonus</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-gray-400 text-sm">Enable Welcome Bonus</label>
              <div className="relative">
                <input type="checkbox" defaultChecked className="sr-only peer" id="welcome-bonus" />
                <label htmlFor="welcome-bonus" className="w-10 h-5 bg-white/10 peer-checked:bg-blue-600 rounded-full cursor-pointer block transition-colors" />
              </div>
            </div>
            <div>
              <label className="text-gray-400 text-sm block mb-1">Bonus Amount (USD)</label>
              <input type="number" defaultValue={50} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="text-gray-400 text-sm block mb-1">Min Deposit to Unlock (USD)</label>
              <input type="number" defaultValue={100} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500" />
            </div>
          </div>
        </div>

        <div className="bg-[#0f1629] border border-white/10 rounded-xl p-6">
          <h2 className="text-white font-semibold mb-4 flex items-center gap-2"><GiftIcon className="w-5 h-5 text-purple-400" /> Referral Bonus</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-gray-400 text-sm">Enable Referral Program</label>
              <div className="relative">
                <input type="checkbox" className="sr-only peer" id="referral-bonus" />
                <label htmlFor="referral-bonus" className="w-10 h-5 bg-white/10 peer-checked:bg-blue-600 rounded-full cursor-pointer block transition-colors" />
              </div>
            </div>
            <div>
              <label className="text-gray-400 text-sm block mb-1">Referrer Bonus (USD)</label>
              <input type="number" defaultValue={25} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="text-gray-400 text-sm block mb-1">Referee Bonus (USD)</label>
              <input type="number" defaultValue={10} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500" />
            </div>
          </div>
        </div>

        <div className="bg-[#0f1629] border border-white/10 rounded-xl p-6">
          <h2 className="text-white font-semibold mb-4 flex items-center gap-2"><GiftIcon className="w-5 h-5 text-green-400" /> Deposit Bonus</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-gray-400 text-sm">Enable Deposit Bonus</label>
              <div className="relative">
                <input type="checkbox" defaultChecked className="sr-only peer" id="deposit-bonus" />
                <label htmlFor="deposit-bonus" className="w-10 h-5 bg-white/10 peer-checked:bg-blue-600 rounded-full cursor-pointer block transition-colors" />
              </div>
            </div>
            <div>
              <label className="text-gray-400 text-sm block mb-1">Bonus Percentage (%)</label>
              <input type="number" defaultValue={10} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="text-gray-400 text-sm block mb-1">Max Bonus Cap (USD)</label>
              <input type="number" defaultValue={500} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
          Save Bonus Settings
        </button>
      </div>
    </div>
  );
}
