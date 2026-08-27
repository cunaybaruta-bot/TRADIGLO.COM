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

const DEFAULT_CURRENCY_RATES: Omit<CurrencyRate, 'updated_at'>[] = [
  // Europe
  { id: 'rate-eur', currency_code: 'EUR', currency_name: 'Euro', rate_to_usd: 1.08 },
  { id: 'rate-gbp', currency_code: 'GBP', currency_name: 'British Pound', rate_to_usd: 1.27 },
  { id: 'rate-chf', currency_code: 'CHF', currency_name: 'Swiss Franc', rate_to_usd: 1.12 },
  { id: 'rate-sek', currency_code: 'SEK', currency_name: 'Swedish Krona', rate_to_usd: 0.095 },
  { id: 'rate-nok', currency_code: 'NOK', currency_name: 'Norwegian Krone', rate_to_usd: 0.092 },
  { id: 'rate-dkk', currency_code: 'DKK', currency_name: 'Danish Krone', rate_to_usd: 0.145 },
  { id: 'rate-pln', currency_code: 'PLN', currency_name: 'Polish Zloty', rate_to_usd: 0.25 },
  // South America
  { id: 'rate-brl', currency_code: 'BRL', currency_name: 'Brazilian Real', rate_to_usd: 0.18 },
  { id: 'rate-ars', currency_code: 'ARS', currency_name: 'Argentine Peso', rate_to_usd: 0.0011 },
  { id: 'rate-cop', currency_code: 'COP', currency_name: 'Colombian Peso', rate_to_usd: 0.00025 },
  { id: 'rate-clp', currency_code: 'CLP', currency_name: 'Chilean Peso', rate_to_usd: 0.00105 },
  { id: 'rate-pen', currency_code: 'PEN', currency_name: 'Peruvian Sol', rate_to_usd: 0.27 },
  { id: 'rate-uyu', currency_code: 'UYU', currency_name: 'Uruguayan Peso', rate_to_usd: 0.025 },
  { id: 'rate-pyg', currency_code: 'PYG', currency_name: 'Paraguayan Guarani', rate_to_usd: 0.00013 },
  { id: 'rate-bob', currency_code: 'BOB', currency_name: 'Bolivian Boliviano', rate_to_usd: 0.145 },
  { id: 'rate-ves', currency_code: 'VES', currency_name: 'Venezuelan Bolívar', rate_to_usd: 0.027 },
  // Asia & Pacific
  { id: 'rate-myr', currency_code: 'MYR', currency_name: 'Malaysian Ringgit', rate_to_usd: 0.224 },
  { id: 'rate-sgd', currency_code: 'SGD', currency_name: 'Singapore Dollar', rate_to_usd: 0.745 },
  { id: 'rate-idr', currency_code: 'IDR', currency_name: 'Indonesian Rupiah', rate_to_usd: 0.000062 },
  { id: 'rate-thb', currency_code: 'THB', currency_name: 'Thai Baht', rate_to_usd: 0.028 },
  { id: 'rate-vnd', currency_code: 'VND', currency_name: 'Vietnamese Dong', rate_to_usd: 0.000039 },
  { id: 'rate-jpy', currency_code: 'JPY', currency_name: 'Japanese Yen', rate_to_usd: 0.0067 },
  { id: 'rate-krw', currency_code: 'KRW', currency_name: 'South Korean Won', rate_to_usd: 0.00072 },
  { id: 'rate-php', currency_code: 'PHP', currency_name: 'Philippine Peso', rate_to_usd: 0.017 },
  { id: 'rate-cny', currency_code: 'CNY', currency_name: 'Chinese Yuan', rate_to_usd: 0.138 },
  { id: 'rate-inr', currency_code: 'INR', currency_name: 'Indian Rupee', rate_to_usd: 0.012 },
  { id: 'rate-hkd', currency_code: 'HKD', currency_name: 'Hong Kong Dollar', rate_to_usd: 0.128 },
  { id: 'rate-twd', currency_code: 'TWD', currency_name: 'New Taiwan Dollar', rate_to_usd: 0.0312 },
  { id: 'rate-pkr', currency_code: 'PKR', currency_name: 'Pakistani Rupee', rate_to_usd: 0.0036 },
  { id: 'rate-bdt', currency_code: 'BDT', currency_name: 'Bangladeshi Taka', rate_to_usd: 0.0091 },
  { id: 'rate-lkr', currency_code: 'LKR', currency_name: 'Sri Lankan Rupee', rate_to_usd: 0.0034 },
  { id: 'rate-mmk', currency_code: 'MMK', currency_name: 'Myanmar Kyat', rate_to_usd: 0.0005 },
  { id: 'rate-khr', currency_code: 'KHR', currency_name: 'Cambodian Riel', rate_to_usd: 0.00024 },
  { id: 'rate-lak', currency_code: 'LAK', currency_name: 'Lao Kip', rate_to_usd: 0.000046 },
  { id: 'rate-npr', currency_code: 'NPR', currency_name: 'Nepalese Rupee', rate_to_usd: 0.0075 },
  // Middle East
  { id: 'rate-sar', currency_code: 'SAR', currency_name: 'Saudi Riyal', rate_to_usd: 0.2667 },
  { id: 'rate-aed', currency_code: 'AED', currency_name: 'UAE Dirham', rate_to_usd: 0.2723 },
  { id: 'rate-qar', currency_code: 'QAR', currency_name: 'Qatari Riyal', rate_to_usd: 0.2747 },
  { id: 'rate-kwd', currency_code: 'KWD', currency_name: 'Kuwaiti Dinar', rate_to_usd: 3.25 },
  { id: 'rate-bhd', currency_code: 'BHD', currency_name: 'Bahraini Dinar', rate_to_usd: 2.6525 },
  { id: 'rate-omr', currency_code: 'OMR', currency_name: 'Omani Rial', rate_to_usd: 2.5974 },
  { id: 'rate-jod', currency_code: 'JOD', currency_name: 'Jordanian Dinar', rate_to_usd: 1.4104 },
  // North America & Global
  { id: 'rate-usd', currency_code: 'USD', currency_name: 'US Dollar', rate_to_usd: 1.0 },
  { id: 'rate-cad', currency_code: 'CAD', currency_name: 'Canadian Dollar', rate_to_usd: 0.74 },
  { id: 'rate-aud', currency_code: 'AUD', currency_name: 'Australian Dollar', rate_to_usd: 0.65 },
  { id: 'rate-nzd', currency_code: 'NZD', currency_name: 'New Zealand Dollar', rate_to_usd: 0.60 },
  { id: 'rate-mxn', currency_code: 'MXN', currency_name: 'Mexican Peso', rate_to_usd: 0.055 },
];

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
    const remoteRates = (data as CurrencyRate[]) || [];
    const merged = [...remoteRates];
    DEFAULT_CURRENCY_RATES.forEach((dr) => {
      if (!merged.some((r) => r.currency_code === dr.currency_code)) {
        merged.push({
          ...dr,
          updated_at: new Date().toISOString(),
        });
      }
    });
    merged.sort((a, b) => a.currency_code.localeCompare(b.currency_code));
    setRates(merged);
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
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rate.id);
    const query = isUuid
      ? supabase.from('currency_rates').update({ rate_to_usd: newRate, updated_at: new Date().toISOString() }).eq('id', rate.id)
      : supabase.from('currency_rates').upsert({ currency_code: rate.currency_code, currency_name: rate.currency_name, rate_to_usd: newRate, updated_at: new Date().toISOString() }, { onConflict: 'currency_code' });
    const { error } = await query;

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
    // Europe
    EUR: '🇪🇺', GBP: '🇬🇧', CHF: '🇨🇭', SEK: '🇸🇪', NOK: '🇳🇴', DKK: '🇩🇰', PLN: '🇵🇱',
    // South America
    BRL: '🇧🇷', ARS: '🇦🇷', COP: '🇨🇴', CLP: '🇨🇱', PEN: '🇵🇪', UYU: '🇺🇾', PYG: '🇵🇾', BOB: '🇧🇴', VES: '🇻🇪',
    // Asia & Pacific
    MYR: '🇲🇾', SGD: '🇸🇬', THB: '🇹🇭', VND: '🇻🇳', JPY: '🇯🇵', KRW: '🇰🇷', IDR: '🇮🇩', PHP: '🇵🇭',
    CNY: '🇨🇳', INR: '🇮🇳', HKD: '🇭🇰', TWD: '🇹🇼', PKR: '🇵🇰', BDT: '🇧🇩', LKR: '🇱🇰', MMK: '🇲🇲',
    KHR: '🇰🇭', LAK: '🇱🇦', NPR: '🇳🇵', AUD: '🇦🇺', NZD: '🇳🇿',
    // Middle East
    SAR: '🇸🇦', AED: '🇦🇪', QAR: '🇶🇦', KWD: '🇰🇼', BHD: '🇧🇭', OMR: '🇴🇲', JOD: '🇯🇴',
    // North America & Global
    USD: '🇺🇸', CAD: '🇨🇦', MXN: '🇲🇽',
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
