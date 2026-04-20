'use client';
import React, { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import TickerTape from '@/components/TickerTape';

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
  circulating_supply: number;
  ath: number;
  ath_change_percentage: number;
}

function formatNumber(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(2)}K`;
  return `$${n?.toFixed(2) ?? '0.00'}`;
}

function formatPrice(n: number): string {
  if (!n) return '$0.00';
  if (n >= 1) return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (n >= 0.01) return `$${n.toFixed(4)}`;
  return `$${n.toFixed(8)}`;
}

export default function CryptocurrencyPage() {
  const [coins, setCoins] = useState<CoinData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'market_cap_rank' | 'price_change_percentage_24h' | 'total_volume'>('market_cap_rank');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const fetchCoins = useCallback(async (pg: number) => {
    setLoading(true);
    setError(null);
    try {
      const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=${pg}&sparkline=false&price_change_percentage=7d`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch from CoinGecko');
      const data: CoinData[] = await res.json();
      setCoins(data);
    } catch (e: any) {
      setError(e.message || 'Failed to load cryptocurrency data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCoins(page);
  }, [page, fetchCoins]);

  const handleSort = (col: typeof sortBy) => {
    if (sortBy === col) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(col);
      setSortDir(col === 'market_cap_rank' ? 'asc' : 'desc');
    }
  };

  const filtered = coins
    .filter(
      (c) =>
        !search ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.symbol.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const aVal = a[sortBy] ?? 0;
      const bVal = b[sortBy] ?? 0;
      return sortDir === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });

  const SortIcon = ({ col }: { col: typeof sortBy }) => (
    <span className="ml-1 inline-flex flex-col leading-none">
      <span className={`text-[8px] ${sortBy === col && sortDir === 'asc' ? 'text-blue-400' : 'text-slate-600'}`}>▲</span>
      <span className={`text-[8px] ${sortBy === col && sortDir === 'desc' ? 'text-blue-400' : 'text-slate-600'}`}>▼</span>
    </span>
  );

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <TickerTape />

      <div className="container mx-auto px-4 md:px-6 py-8 max-w-7xl">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">Cryptocurrency</h1>
            <p className="text-slate-400 text-sm">Live prices for top {coins.length} cryptocurrencies by market cap</p>
          </div>
          {/* Search */}
          <div className="relative w-full md:w-72">
            <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <circle cx="11" cy="11" r="8" strokeWidth={2} />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search coin..."
              className="w-full bg-white/10 border border-white/20 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6 text-red-400 text-sm">
            {error} — CoinGecko free API may have rate limits. Please try again in a moment.
          </div>
        )}

        {/* Table */}
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 text-xs">
                  <th className="text-left px-4 py-3 font-medium cursor-pointer hover:text-white" onClick={() => handleSort('market_cap_rank')}>
                    # <SortIcon col="market_cap_rank" />
                  </th>
                  <th className="text-left px-4 py-3 font-medium">Name</th>
                  <th className="text-right px-4 py-3 font-medium">Price</th>
                  <th className="text-right px-4 py-3 font-medium cursor-pointer hover:text-white" onClick={() => handleSort('price_change_percentage_24h')}>
                    24h % <SortIcon col="price_change_percentage_24h" />
                  </th>
                  <th className="text-right px-4 py-3 font-medium hidden md:table-cell">7d %</th>
                  <th className="text-right px-4 py-3 font-medium cursor-pointer hover:text-white hidden lg:table-cell" onClick={() => handleSort('total_volume')}>
                    Volume (24h) <SortIcon col="total_volume" />
                  </th>
                  <th className="text-right px-4 py-3 font-medium hidden lg:table-cell">Market Cap</th>
                  <th className="text-right px-4 py-3 font-medium hidden xl:table-cell">ATH</th>
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: 20 }).map((_, i) => (
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
                        <td className="px-4 py-3 hidden md:table-cell"><div className="h-4 w-14 bg-white/10 rounded ml-auto" /></td>
                        <td className="px-4 py-3 hidden lg:table-cell"><div className="h-4 w-20 bg-white/10 rounded ml-auto" /></td>
                        <td className="px-4 py-3 hidden lg:table-cell"><div className="h-4 w-20 bg-white/10 rounded ml-auto" /></td>
                        <td className="px-4 py-3 hidden xl:table-cell"><div className="h-4 w-20 bg-white/10 rounded ml-auto" /></td>
                      </tr>
                    ))
                  : filtered.map((coin) => {
                      const change24 = coin.price_change_percentage_24h ?? 0;
                      const change7d = coin.price_change_percentage_7d_in_currency ?? 0;
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
                          <td className={`px-4 py-3 text-right text-sm font-medium ${change24 >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {change24 >= 0 ? '+' : ''}{change24.toFixed(2)}%
                          </td>
                          <td className={`px-4 py-3 text-right text-sm font-medium hidden md:table-cell ${change7d >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {change7d >= 0 ? '+' : ''}{change7d.toFixed(2)}%
                          </td>
                          <td className="px-4 py-3 text-right text-slate-300 text-sm hidden lg:table-cell">{formatNumber(coin.total_volume)}</td>
                          <td className="px-4 py-3 text-right text-slate-300 text-sm hidden lg:table-cell">{formatNumber(coin.market_cap)}</td>
                          <td className="px-4 py-3 text-right hidden xl:table-cell">
                            <div className="text-slate-300 text-sm">{formatPrice(coin.ath)}</div>
                            <div className={`text-xs ${coin.ath_change_percentage >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {coin.ath_change_percentage?.toFixed(1)}%
                            </div>
                          </td>
                        </tr>
                      );
                    })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && !error && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-white/10">
              <span className="text-xs text-slate-400">
                Page {page} · Showing {filtered.length} coins
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 text-xs rounded-md bg-white/10 text-slate-300 hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1.5 text-xs rounded-md bg-white/10 text-slate-300 hover:bg-white/20 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
