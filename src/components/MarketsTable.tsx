'use client';
import React, { useState, useEffect, useCallback } from 'react';
import AppImage from '@/components/ui/AppImage';

interface SparklineData {
  price: number[];
}

interface CoinMarket {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap_rank: number;
  price_change_percentage_1h_in_currency: number;
  price_change_percentage_24h_in_currency: number;
  price_change_percentage_7d_in_currency: number;
  price_change_percentage_24h: number;
  market_cap: number;
  total_volume: number;
  sparkline_in_7d: SparklineData;
}

const TOTAL_RESULTS = 16845;
const ROWS_OPTIONS = [10, 25, 50, 100];

const BUY_COINS = new Set(['bitcoin', 'ethereum', 'bnb', 'ripple', 'solana', 'tron', 'dogecoin', 'cardano', 'avalanche-2', 'polkadot', 'chainlink', 'litecoin', 'uniswap', 'stellar', 'monero']);

const CATEGORY_TABS = [
  { id: 'all', label: 'All', icon: null, fire: false },
  { id: 'highlights', label: 'Highlights', icon: '≡', fire: false },
  { id: 'categories', label: 'Categories', icon: '⬡', fire: false },
  { id: 'mobile-mining', label: 'Mobile Mining', icon: null, fire: true },
  { id: 'quantum-resistant', label: 'Quantum-Resistant', icon: null, fire: true },
  { id: 'sports', label: 'Sports', icon: null, fire: true },
];

function formatPrice(price: number): string {
  if (price >= 1000) {
    return '$' + price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  } else if (price >= 1) {
    return '$' + price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  } else if (price >= 0.01) {
    return '$' + price.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 6 });
  } else {
    return '$' + price.toLocaleString('en-US', { minimumFractionDigits: 6, maximumFractionDigits: 8 });
  }
}

function formatLargeNumber(num: number): string {
  if (num >= 1_000_000_000) {
    return '$' + (num / 1_000_000_000).toFixed(2) + 'B';
  } else if (num >= 1_000_000) {
    return '$' + (num / 1_000_000).toFixed(2) + 'M';
  } else {
    return '$' + num.toLocaleString('en-US');
  }
}

function formatPercent(val: number | null | undefined): { text: string; positive: boolean } {
  if (val === null || val === undefined || isNaN(val)) {
    return { text: '0.0%', positive: true };
  }
  const positive = val >= 0;
  return { text: Math.abs(val).toFixed(1) + '%', positive };
}

function Sparkline({ data, positive }: { data: number[]; positive: boolean }) {
  if (!data || data.length < 2) {
    return <div className="w-24 h-10" />;
  }

  const width = 96;
  const height = 40;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  const color = positive ? '#22c55e' : '#ef4444';

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

function getPageNumbers(currentPage: number, totalPages: number): (number | '...')[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: (number | '...')[] = [];

  if (currentPage <= 4) {
    pages.push(1, 2, 3, 4, 5, '...', totalPages);
  } else if (currentPage >= totalPages - 3) {
    pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
  } else {
    pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
  }

  return pages;
}

export default function MarketsTable() {
  const [coins, setCoins] = useState<CoinMarket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(100);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState('all');

  // suppress unused warning
  void coins;

  const fetchCoins = useCallback(async (page: number, perPage: number) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/markets?page=${page}&per_page=${perPage}`);
      if (!response.ok) {
        throw new Error('Failed to fetch market data');
      }
      const data: CoinMarket[] = await response.json();
      setCoins(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCoins(currentPage, rowsPerPage);
  }, [fetchCoins, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(TOTAL_RESULTS / rowsPerPage);
  const startResult = (currentPage - 1) * rowsPerPage + 1;
  const endResult = Math.min(currentPage * rowsPerPage, TOTAL_RESULTS);

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRowsChange = (newRows: number) => {
    setRowsPerPage(newRows);
    setCurrentPage(1);
  };

  const toggleFavorite = (id: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const pageNumbers = getPageNumbers(currentPage, totalPages);

  return (
    <section className="bg-black w-full" style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif" }}>
      <div className="max-w-7xl mx-auto px-4">

        {/* Category Tab Bar */}
        <div className="flex items-center justify-between border-b border-[#1e2a4a] overflow-x-auto">
          <div className="flex items-center gap-1 flex-shrink-0">
            {CATEGORY_TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? 'border-green-500 text-green-400 bg-green-500/10' :'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                }`}
              >
                {tab.fire && <span className="text-base leading-none">🔥</span>}
                {tab.icon && !tab.fire && (
                  <span className="text-slate-500 text-sm">{tab.icon}</span>
                )}
                {tab.id === 'all' && activeTab === 'all' && (
                  <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
                )}
                {tab.label}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-1.5 px-4 py-2.5 ml-2 rounded-lg border border-[#2a3a5c] text-slate-400 hover:text-slate-200 hover:border-slate-500 text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0">
            <span className="text-base">✦</span>
            Customize
          </button>
        </div>

        {/* Table Header Bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e2a4a]">
          <div className="flex items-center gap-3">
            <span className="text-white font-semibold text-sm tracking-tight">All Markets</span>
            <span className="px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-400 text-xs font-medium">
              {loading ? '...' : `${TOTAL_RESULTS.toLocaleString()}+ Coins`}
            </span>
          </div>
          <button
            onClick={() => fetchCoins(currentPage, rowsPerPage)}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-xs font-medium transition-colors disabled:opacity-50"
          >
            <svg className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-400 text-sm">Fetching live market data...</p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-red-400 text-sm">{error}</p>
            <button
              onClick={() => fetchCoins(currentPage, rowsPerPage)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Table */}
        {!loading && !error && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full" style={{ minWidth: '900px' }}>
                <thead>
                  <tr className="border-b border-[#1e2a4a]">
                    <th className="w-8 px-3 py-3"></th>
                    <th className="w-10 px-2 py-3 text-left">
                      <span className="flex items-center gap-1 cursor-pointer select-none text-slate-500 text-[11px] font-semibold uppercase tracking-wider">
                        # <span className="text-slate-600 text-[9px]">▲</span>
                      </span>
                    </th>
                    <th className="px-3 py-3 text-left">
                      <span className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider">Coin</span>
                    </th>
                    <th className="w-16 px-2 py-3"></th>
                    <th className="px-3 py-3 text-right">
                      <span className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider">Price</span>
                    </th>
                    <th className="px-3 py-3 text-right">
                      <span className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider">1h</span>
                    </th>
                    <th className="px-3 py-3 text-right">
                      <span className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider">24h</span>
                    </th>
                    <th className="px-3 py-3 text-right">
                      <span className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider">7d</span>
                    </th>
                    <th className="px-3 py-3 text-right hidden lg:table-cell">
                      <span className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider">24h Volume</span>
                    </th>
                    <th className="px-3 py-3 text-right hidden md:table-cell">
                      <span className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider">Market Cap</span>
                    </th>
                    <th className="px-3 py-3 text-right hidden xl:table-cell">
                      <span className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider">Last 7 Days</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {coins.map((coin, index) => {
                    const rank = (currentPage - 1) * rowsPerPage + index + 1;
                    const isFav = favorites.has(coin.id);
                    const hasBuy = BUY_COINS.has(coin.id);

                    const change1h = formatPercent(coin.price_change_percentage_1h_in_currency);
                    const change24h = formatPercent(coin.price_change_percentage_24h_in_currency ?? coin.price_change_percentage_24h);
                    const change7d = formatPercent(coin.price_change_percentage_7d_in_currency);

                    const sparklineData = coin.sparkline_in_7d?.price ?? [];
                    const sampledSparkline = sparklineData.length > 50
                      ? sparklineData.filter((_: number, i: number) => i % Math.floor(sparklineData.length / 50) === 0)
                      : sparklineData;

                    return (
                      <tr
                        key={coin.id}
                        className="border-b border-[#1e2a4a] hover:bg-white/[0.03] transition-colors"
                        style={{ height: '64px' }}
                      >
                        {/* Star */}
                        <td className="px-3 text-center">
                          <button
                            onClick={() => toggleFavorite(coin.id)}
                            className={`text-lg transition-colors ${isFav ? 'text-yellow-400' : 'text-slate-600 hover:text-slate-400'}`}
                            aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
                          >
                            {isFav ? '★' : '☆'}
                          </button>
                        </td>

                        {/* Rank */}
                        <td className="px-2">
                          <span className="text-slate-400 text-sm tabular-nums">{rank}</span>
                        </td>

                        {/* Coin */}
                        <td className="px-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-white/5">
                              <AppImage
                                src={coin.image}
                                alt={`${coin.name} logo`}
                                width={32}
                                height={32}
                                className="w-full h-full object-contain"
                              />
                            </div>
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-white text-sm font-bold tracking-tight">{coin.name}</span>
                              <span className="text-slate-500 text-[11px] font-medium uppercase tracking-wide">{coin.symbol}</span>
                            </div>
                          </div>
                        </td>

                        {/* Buy Button */}
                        <td className="px-2">
                          {hasBuy && (
                            <button className="px-2.5 py-1 rounded border border-green-500 text-green-400 text-xs font-semibold hover:bg-green-500/10 transition-colors whitespace-nowrap tracking-wide">
                              Buy
                            </button>
                          )}
                        </td>

                        {/* Price */}
                        <td className="px-3 text-right">
                          <span className="text-white text-sm font-semibold tabular-nums" style={{ fontVariantNumeric: 'tabular-nums' }}>
                            {formatPrice(coin.current_price)}
                          </span>
                        </td>

                        {/* 1h % */}
                        <td className="px-3 text-right">
                          <span className={`text-sm font-semibold tabular-nums flex items-center justify-end gap-0.5 ${change1h.positive ? 'text-green-400' : 'text-red-400'}`}>
                            <span className="text-[10px]">{change1h.positive ? '▲' : '▼'}</span>
                            {change1h.text}
                          </span>
                        </td>

                        {/* 24h % */}
                        <td className="px-3 text-right">
                          <span className={`text-sm font-semibold tabular-nums flex items-center justify-end gap-0.5 ${change24h.positive ? 'text-green-400' : 'text-red-400'}`}>
                            <span className="text-[10px]">{change24h.positive ? '▲' : '▼'}</span>
                            {change24h.text}
                          </span>
                        </td>

                        {/* 7d % */}
                        <td className="px-3 text-right">
                          <span className={`text-sm font-semibold tabular-nums flex items-center justify-end gap-0.5 ${change7d.positive ? 'text-green-400' : 'text-red-400'}`}>
                            <span className="text-[10px]">{change7d.positive ? '▲' : '▼'}</span>
                            {change7d.text}
                          </span>
                        </td>

                        {/* 24h Volume */}
                        <td className="px-3 text-right hidden lg:table-cell">
                          <span className="text-slate-300 text-sm tabular-nums font-medium">{formatLargeNumber(coin.total_volume)}</span>
                        </td>

                        {/* Market Cap */}
                        <td className="px-3 text-right hidden md:table-cell">
                          <span className="text-slate-300 text-sm tabular-nums font-medium">{formatLargeNumber(coin.market_cap)}</span>
                        </td>

                        {/* Sparkline */}
                        <td className="px-3 text-right hidden xl:table-cell">
                          <div className="flex justify-end">
                            <Sparkline data={sampledSparkline} positive={change7d.positive} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Bar - CoinGecko style */}
            <div className="flex items-center justify-between px-4 py-4 border-t border-[#1e2a4a] flex-wrap gap-3">
              {/* Left: Showing X to Y of Z results */}
              <span className="text-slate-500 text-xs tabular-nums whitespace-nowrap">
                Showing {startResult.toLocaleString()} to {endResult.toLocaleString()} of {TOTAL_RESULTS.toLocaleString()} results
              </span>

              {/* Center: Page navigation */}
              <div className="flex items-center gap-1">
                {/* Previous arrow */}
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="w-8 h-8 flex items-center justify-center rounded text-slate-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-base"
                  aria-label="Previous page"
                >
                  ‹
                </button>

                {/* Page numbers */}
                {pageNumbers.map((page, idx) =>
                  page === '...' ? (
                    <span key={`ellipsis-${idx}`} className="w-8 h-8 flex items-center justify-center text-slate-500 text-sm select-none">
                      ...
                    </span>
                  ) : (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page as number)}
                      className={`w-8 h-8 flex items-center justify-center rounded text-sm font-medium transition-colors ${
                        currentPage === page
                          ? 'bg-white text-black font-bold' :'text-slate-400 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {page}
                    </button>
                  )
                )}

                {/* Next arrow */}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="w-8 h-8 flex items-center justify-center rounded text-slate-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-base"
                  aria-label="Next page"
                >
                  ›
                </button>
              </div>

              {/* Right: Rows dropdown + scroll to top */}
              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-xs font-medium">Rows</span>
                <div className="relative">
                  <select
                    value={rowsPerPage}
                    onChange={(e) => handleRowsChange(Number(e.target.value))}
                    className="appearance-none bg-black border border-[#2a3a5c] text-white text-sm font-semibold pl-3 pr-7 py-1.5 rounded cursor-pointer hover:border-slate-500 transition-colors focus:outline-none focus:border-slate-400 tabular-nums"
                  >
                    {ROWS_OPTIONS.map(opt => (
                      <option key={opt} value={opt} className="bg-[#111]">{opt}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
                    <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7m0 0l-7 7m7-7h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                </div>

                {/* Scroll to top */}
                <button
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="w-8 h-8 flex items-center justify-center rounded border border-[#2a3a5c] text-slate-400 hover:text-white hover:border-slate-500 transition-colors"
                  aria-label="Scroll to top"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
