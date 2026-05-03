'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

interface CurrencyRate {
  id: string;
  currency_code: string;
  currency_name: string;
  rate_to_usd: number;
  updated_at: string;
}

export default function CurrencyRatesPage() {
  const [rates, setRates] = useState<CurrencyRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const fetchRates = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('currency_rates')
      .select('*')
      .order('currency_code');
    setRates((data as CurrencyRate[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  const handleEdit = (id: string, value: string) => {
    setEditValues((prev) => ({ ...prev, [id]: value }));
  };

  const handleSave = async (rate: CurrencyRate) => {
    const newRate = parseFloat(editValues[rate.id] ?? String(rate.rate_to_usd));
    if (isNaN(newRate) || newRate <= 0) return;
    setSaving(rate.id);
    const supabase = createClient();
    const { error } = await supabase
      .from('currency_rates')
      .update({ rate_to_usd: newRate, updated_at: new Date().toISOString() })
      .eq('id', rate.id);

    if (!error) {
      setMessage(`✅ ${rate.currency_code} rate updated to ${newRate}`);
      setEditValues((prev) => {
        const next = { ...prev };
        delete next[rate.id];
        return next;
      });
      fetchRates();
    } else {
      setMessage(`❌ Failed to update ${rate.currency_code}`);
    }
    setSaving(null);
    setTimeout(() => setMessage(''), 4000);
  };

  const CURRENCY_FLAGS: Record<string, string> = {
    // Asia Pacific
    MYR: '🇲🇾', SGD: '🇸🇬', THB: '🇹🇭', VND: '🇻🇳',
    JPY: '🇯🇵', KRW: '🇰🇷', IDR: '🇮🇩', PHP: '🇵🇭',
    CNY: '🇨🇳', HKD: '🇭🇰', TWD: '🇹🇼', MMK: '🇲🇲',
    KHR: '🇰🇭', LAK: '🇱🇦', BND: '🇧🇳', PKR: '🇵🇰',
    BDT: '🇧🇩', LKR: '🇱🇰', NPR: '🇳🇵', INR: '🇮🇳',
    // Middle East
    AED: '🇦🇪', SAR: '🇸🇦', KWD: '🇰🇼', BHD: '🇧🇭',
    OMR: '🇴🇲', QAR: '🇶🇦', JOD: '🇯🇴', IQD: '🇮🇶',
    // Europe
    EUR: '🇪🇺', GBP: '🇬🇧', CHF: '🇨🇭', SEK: '🇸🇪',
    NOK: '🇳🇴', DKK: '🇩🇰', PLN: '🇵🇱', CZK: '🇨🇿',
    HUF: '🇭🇺', RON: '🇷🇴', BGN: '🇧🇬', HRK: '🇭🇷',
    RUB: '🇷🇺', UAH: '🇺🇦', TRY: '🇹🇷',
    // Americas
    USD: '🇺🇸', CAD: '🇨🇦', MXN: '🇲🇽', BRL: '🇧🇷',
    ARS: '🇦🇷', CLP: '🇨🇱', COP: '🇨🇴', PEN: '🇵🇪',
    // Africa
    ZAR: '🇿🇦', NGN: '🇳🇬', KES: '🇰🇪', GHS: '🇬🇭',
    EGP: '🇪🇬', MAD: '🇲🇦', TZS: '🇹🇿', UGX: '🇺🇬',
    // Oceania
    AUD: '🇦🇺', NZD: '🇳🇿',
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-white text-xl font-bold">Currency Rates</h2>
        <p className="text-slate-400 text-sm mt-1">Manage conversion rates to USD for deposit calculations</p>
      </div>

      {message && (
        <div className="bg-slate-800 border border-slate-700 text-slate-200 text-sm px-4 py-3 rounded-xl">
          {message}
        </div>
      )}

      <div className="bg-[#1e293b] rounded-xl border border-slate-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-700 flex items-center justify-between">
          <div className="text-white font-semibold text-sm">Exchange Rates</div>
          <div className="text-slate-500 text-xs">All rates relative to 1 USD</div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-[#22c55e] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left text-slate-400 text-xs font-medium px-5 py-3">Currency</th>
                <th className="text-left text-slate-400 text-xs font-medium px-5 py-3">Name</th>
                <th className="text-left text-slate-400 text-xs font-medium px-5 py-3">Rate to USD</th>
                <th className="text-left text-slate-400 text-xs font-medium px-5 py-3">Example</th>
                <th className="text-left text-slate-400 text-xs font-medium px-5 py-3">Last Updated</th>
                <th className="text-left text-slate-400 text-xs font-medium px-5 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {rates.map((rate) => {
                const currentVal = editValues[rate.id] ?? String(rate.rate_to_usd);
                const isDirty = editValues[rate.id] !== undefined && editValues[rate.id] !== String(rate.rate_to_usd);
                const exampleUsd = (100 * rate.rate_to_usd).toFixed(2);

                return (
                  <tr key={rate.id} className="hover:bg-slate-700/20 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{CURRENCY_FLAGS[rate.currency_code] || '💱'}</span>
                        <span className="text-white font-bold text-sm">{rate.currency_code}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-300 text-sm">{rate.currency_name || '—'}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={currentVal}
                          onChange={(e) => handleEdit(rate.id, e.target.value)}
                          step="0.000001"
                          min="0"
                          className={`w-32 bg-slate-900 border rounded-lg px-3 py-1.5 text-white text-sm font-mono focus:outline-none transition-colors ${
                            isDirty ? 'border-yellow-500/50 focus:border-yellow-400' : 'border-slate-600 focus:border-[#22c55e]/60'
                          }`}
                        />
                        {isDirty && (
                          <span className="text-yellow-400 text-[10px] font-semibold">unsaved</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-400 text-xs">
                      100 {rate.currency_code} = <span className="text-emerald-400 font-semibold">${exampleUsd}</span>
                    </td>
                    <td className="px-5 py-3 text-slate-500 text-xs">
                      {new Date(rate.updated_at).toLocaleString()}
                    </td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => handleSave(rate)}
                        disabled={saving === rate.id || !isDirty}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                          isDirty
                            ? 'bg-[#22c55e] text-black hover:bg-[#16a34a]'
                            : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                        } disabled:opacity-60`}
                      >
                        {saving === rate.id ? (
                          <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : null}
                        Save
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="bg-blue-500/8 border border-blue-500/20 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <svg className="text-blue-400 flex-shrink-0 mt-0.5" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <div>
            <p className="text-blue-300 text-sm font-semibold mb-1">How rates work</p>
            <p className="text-blue-400/70 text-xs leading-relaxed">
              When a user deposits in local currency, the system multiplies the amount by the rate to calculate USD. 
              Example: 500 MYR × 0.21 = $105 USD. Update rates regularly to reflect current exchange rates.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
