'use client';
import React, { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import TickerTape from '@/components/TickerTape';
import { useLanguage } from '@/contexts/LanguageContext';

interface CoinData {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  total_volume: number;
  price_change_percentage_24h: number;
  price_change_percentage_7d_in_currency?: number;
  high_24h: number;
  low_24h: number;
  circulating_supply: number;
}

function formatPrice(n: number): string {
  if (!n) return '$0.00';
  if (n >= 1) return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (n >= 0.01) return `$${n.toFixed(4)}`;
  return `$${n.toFixed(8)}`;
}

function formatNumber(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(2)}K`;
  return `$${n?.toFixed(2) ?? '0.00'}`;
}

interface Filters {
  minPrice: string;
  maxPrice: string;
  minVolume: string;
  maxVolume: string;
  minChange24h: string;
  maxChange24h: string;
  minMarketCap: string;
  movement: 'all' | 'gainers' | 'losers';
}

const defaultFilters: Filters = {
  minPrice: '',
  maxPrice: '',
  minVolume: '',
  maxVolume: '',
  minChange24h: '',
  maxChange24h: '',
  minMarketCap: '',
  movement: 'all',
};

export default function ScreenerPage() {
  const [coins, setCoins] = useState<CoinData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [sortBy, setSortBy] = useState<keyof CoinData>('market_cap_rank');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [filtersOpen, setFiltersOpen] = useState(true);
  const { t } = useLanguage();

  const fetchCoins = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/screener');
      if (!res.ok) throw new Error('Failed to fetch data');
      const data: CoinData[] = await res.json();
      if (data && (data as any).error) throw new Error((data as any).error);
      setCoins(data);
    } catch (e: any) {
      setError(e.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCoins();
  }, [fetchCoins]);

  const handleSort = (col: keyof CoinData) => {
    if (sortBy === col) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(col); setSortDir(col === 'market_cap_rank' ? 'asc' : 'desc'); }
  };

  const filtered = coins.filter((c) => {
    const p = c.current_price ?? 0;
    const v = c.total_volume ?? 0;
    const ch = c.price_change_percentage_24h ?? 0;
    const mc = c.market_cap ?? 0;

    if (filters.minPrice && p < parseFloat(filters.minPrice)) return false;
    if (filters.maxPrice && p > parseFloat(filters.maxPrice)) return false;
    if (filters.minVolume && v < parseFloat(filters.minVolume) * 1e6) return false;
    if (filters.maxVolume && v > parseFloat(filters.maxVolume) * 1e6) return false;
    if (filters.minChange24h && ch < parseFloat(filters.minChange24h)) return false;
    if (filters.maxChange24h && ch > parseFloat(filters.maxChange24h)) return false;
    if (filters.minMarketCap && mc < parseFloat(filters.minMarketCap) * 1e6) return false;
    if (filters.movement === 'gainers' && ch <= 0) return false;
    if (filters.movement === 'losers' && ch >= 0) return false;
    return true;
  }).sort((a, b) => {
    const aVal = (a[sortBy] as number) ?? 0;
    const bVal = (b[sortBy] as number) ?? 0;
    return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
  });

  const SortIcon = ({ col }: { col: keyof CoinData }) => (
    <span className="ml-1 inline-flex flex-col leading-none">
      <span className={`text-[8px] ${sortBy === col && sortDir === 'asc' ? 'text-blue-400' : 'text-slate-600'}`}>▲</span>
      <span className={`text-[8px] ${sortBy === col && sortDir === 'desc' ? 'text-blue-400' : 'text-slate-600'}`}>▼</span>
    </span>
  );

  const activeFilterCount = Object.entries(filters).filter(([k, v]) => k !== 'movement' ? v !== '' : v !== 'all').length;

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <TickerTape />

      <div className="container mx-auto px-4 md:px-6 py-8 max-w-7xl">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">{t('sc_title')}</h1>
            <p className="text-slate-400 text-sm">{t('sc_subtitle_prefix')} {coins.length} {t('sc_subtitle_suffix')}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">{filtered.length} {t('sc_results')}</span>
            <button
              onClick={() => setFiltersOpen((o) => !o)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filtersOpen ? 'bg-blue-600 text-white' : 'bg-white/10 text-slate-300 hover:bg-white/20'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
              </svg>
              {t('sc_filters_btn')} {activeFilterCount > 0 && <span className="bg-white/20 rounded-full px-1.5 py-0.5 text-xs">{activeFilterCount}</span>}
            </button>
            <button
              onClick={() => setFilters(defaultFilters)}
              className="px-3 py-2 rounded-lg text-xs text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
            >
              {t('sc_reset_btn')}
            </button>
            <button
              onClick={fetchCoins}
              className="px-3 py-2 rounded-lg text-xs text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
            >
              {t('sc_refresh_btn')}
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        {filtersOpen && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-5 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Movement */}
              <div>
                <label className="block text-xs text-slate-400 mb-2 font-medium">{t('sc_filter_movement')}</label>
                <div className="flex gap-2">
                  {(['all', 'gainers', 'losers'] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setFilters((f) => ({ ...f, movement: m }))}
                      className={`flex-1 py-2 rounded-lg text-xs font-medium capitalize transition-all ${
                        filters.movement === m
                          ? m === 'gainers' ? 'bg-emerald-600 text-white' : m === 'losers' ? 'bg-red-600 text-white' : 'bg-blue-600 text-white' :'bg-white/10 text-slate-300 hover:bg-white/20'
                      }`}
                    >
                      {m === 'all' ? t('sc_movement_all') : m === 'gainers' ? t('sc_movement_gainers') : t('sc_movement_losers')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-xs text-slate-400 mb-2 font-medium">{t('sc_filter_price')}</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.minPrice}
                    onChange={(e) => setFilters((f) => ({ ...f, minPrice: e.target.value }))}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.maxPrice}
                    onChange={(e) => setFilters((f) => ({ ...f, maxPrice: e.target.value }))}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Volume Range */}
              <div>
                <label className="block text-xs text-slate-400 mb-2 font-medium">{t('sc_filter_volume')}</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.minVolume}
                    onChange={(e) => setFilters((f) => ({ ...f, minVolume: e.target.value }))}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.maxVolume}
                    onChange={(e) => setFilters((f) => ({ ...f, maxVolume: e.target.value }))}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* 24h Change */}
              <div>
                <label className="block text-xs text-slate-400 mb-2 font-medium">{t('sc_filter_change')}</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min %"
                    value={filters.minChange24h}
                    onChange={(e) => setFilters((f) => ({ ...f, minChange24h: e.target.value }))}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    placeholder="Max %"
                    value={filters.maxChange24h}
                    onChange={(e) => setFilters((f) => ({ ...f, maxChange24h: e.target.value }))}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Min Market Cap */}
              <div>
                <label className="block text-xs text-slate-400 mb-2 font-medium">{t('sc_filter_marketcap')}</label>
                <input
                  type="number"
                  placeholder="e.g. 100"
                  value={filters.minMarketCap}
                  onChange={(e) => setFilters((f) => ({ ...f, minMarketCap: e.target.value }))}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6 text-red-400 text-sm">
            {error} {t('sc_error_suffix')}
          </div>
        )}

        {/* Results Table */}
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 text-xs">
                  <th className="text-left px-4 py-3 font-medium cursor-pointer hover:text-white" onClick={() => handleSort('market_cap_rank')}>
                    # <SortIcon col="market_cap_rank" />
                  </th>
                  <th className="text-left px-4 py-3 font-medium">{t('sc_col_name')}</th>
                  <th className="text-right px-4 py-3 font-medium cursor-pointer hover:text-white" onClick={() => handleSort('current_price')}>
                    {t('sc_col_price')} <SortIcon col="current_price" />
                  </th>
                  <th className="text-right px-4 py-3 font-medium cursor-pointer hover:text-white" onClick={() => handleSort('price_change_percentage_24h')}>
                    {t('sc_col_24h')} <SortIcon col="price_change_percentage_24h" />
                  </th>
                  <th className="text-right px-4 py-3 font-medium hidden md:table-cell">{t('sc_col_high')}</th>
                  <th className="text-right px-4 py-3 font-medium hidden md:table-cell">{t('sc_col_low')}</th>
                  <th className="text-right px-4 py-3 font-medium cursor-pointer hover:text-white hidden lg:table-cell" onClick={() => handleSort('total_volume')}>
                    {t('sc_col_volume')} <SortIcon col="total_volume" />
                  </th>
                  <th className="text-right px-4 py-3 font-medium cursor-pointer hover:text-white hidden lg:table-cell" onClick={() => handleSort('market_cap')}>
                    {t('sc_col_marketcap')} <SortIcon col="market_cap" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: 15 }).map((_, i) => (
                      <tr key={i} className="border-b border-white/5 animate-pulse">
                        <td className="px-4 py-3"><div className="h-4 w-6 bg-white/10 rounded" /></td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-white/10" />
                            <div className="h-4 w-24 bg-white/10 rounded" />
                          </div>
                        </td>
                        <td className="px-4 py-3"><div className="h-4 w-20 bg-white/10 rounded ml-auto" /></td>
                        <td className="px-4 py-3"><div className="h-4 w-14 bg-white/10 rounded ml-auto" /></td>
                        <td className="px-4 py-3 hidden md:table-cell"><div className="h-4 w-16 bg-white/10 rounded ml-auto" /></td>
                        <td className="px-4 py-3 hidden md:table-cell"><div className="h-4 w-16 bg-white/10 rounded ml-auto" /></td>
                        <td className="px-4 py-3 hidden lg:table-cell"><div className="h-4 w-20 bg-white/10 rounded ml-auto" /></td>
                        <td className="px-4 py-3 hidden lg:table-cell"><div className="h-4 w-20 bg-white/10 rounded ml-auto" /></td>
                      </tr>
                    ))
                  : filtered.length === 0
                  ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-16 text-center text-slate-400 text-sm">
                        {t('sc_no_match')}
                      </td>
                    </tr>
                  )
                  : filtered.map((coin) => {
                      const change24 = coin.price_change_percentage_24h ?? 0;
                      return (
                        <tr key={coin.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="px-4 py-3 text-slate-400 text-xs">{coin.market_cap_rank}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <img src={coin.image} alt={coin.name} className="w-8 h-8 rounded-full" />
                              <div>
                                <div className="font-medium text-white text-sm">{coin.name}</div>
                                <div className="text-xs text-slate-400 uppercase">{coin.symbol}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-white text-sm">{formatPrice(coin.current_price)}</td>
                          <td className={`px-4 py-3 text-right text-sm font-semibold ${change24 >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${change24 >= 0 ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                              {change24 >= 0 ? '▲' : '▼'} {Math.abs(change24).toFixed(2)}%
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-slate-300 text-sm hidden md:table-cell">{formatPrice(coin.high_24h)}</td>
                          <td className="px-4 py-3 text-right text-slate-300 text-sm hidden md:table-cell">{formatPrice(coin.low_24h)}</td>
                          <td className="px-4 py-3 text-right text-slate-300 text-sm hidden lg:table-cell">{formatNumber(coin.total_volume)}</td>
                          <td className="px-4 py-3 text-right text-slate-300 text-sm hidden lg:table-cell">{formatNumber(coin.market_cap)}</td>
                        </tr>
                      );
                    })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
