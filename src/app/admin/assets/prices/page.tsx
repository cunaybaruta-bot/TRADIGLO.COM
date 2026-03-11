'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface MarketPrice {
  id: string;
  asset_id: string;
  price: number;
  updated_at: string;
  assets?: { symbol: string; name: string; is_active: boolean };
}

export default function AssetPricesPage() {
  const [prices, setPrices] = useState<MarketPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchPrices = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('market_prices')
      .select('id, asset_id, price, updated_at, assets(symbol, name, is_active)')
      .order('updated_at', { ascending: false });
    setPrices((data as any) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 10000);
    return () => clearInterval(interval);
  }, [fetchPrices]);

  const filtered = prices.filter((p) => {
    const symbol = (p.assets as any)?.symbol || '';
    const name = (p.assets as any)?.name || '';
    return symbol.toLowerCase().includes(search.toLowerCase()) || name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-white text-xl font-bold">Market Prices</h2>
          <p className="text-slate-400 text-sm mt-1">{prices.length} price feeds (auto-refresh 10s)</p>
        </div>
        <div className="relative">
          <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Search asset..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="bg-[#1e293b] border border-slate-700 text-white text-sm rounded-lg pl-9 pr-4 py-2 w-56 focus:outline-none focus:border-[#22c55e] placeholder-slate-500" />
        </div>
      </div>

      <div className="bg-[#1e293b] rounded-xl border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left text-slate-400 text-xs font-medium px-5 py-3">Symbol</th>
                <th className="text-left text-slate-400 text-xs font-medium px-5 py-3">Name</th>
                <th className="text-left text-slate-400 text-xs font-medium px-5 py-3">Current Price</th>
                <th className="text-left text-slate-400 text-xs font-medium px-5 py-3">Status</th>
                <th className="text-left text-slate-400 text-xs font-medium px-5 py-3">Last Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {loading && <tr><td colSpan={5} className="text-center text-slate-500 text-sm py-8">Loading prices...</td></tr>}
              {!loading && filtered.length === 0 && <tr><td colSpan={5} className="text-center text-slate-500 text-sm py-8">No prices found</td></tr>}
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-slate-700/20 transition-colors">
                  <td className="px-5 py-3 text-white text-sm font-mono font-semibold">{(p.assets as any)?.symbol || '—'}</td>
                  <td className="px-5 py-3 text-slate-300 text-sm">{(p.assets as any)?.name || '—'}</td>
                  <td className="px-5 py-3 text-[#22c55e] text-sm font-semibold font-mono">
                    ${Number(p.price).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${(p.assets as any)?.is_active ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                      {(p.assets as any)?.is_active ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-slate-400 text-sm">{new Date(p.updated_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
