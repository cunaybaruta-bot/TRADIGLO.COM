'use client';
import React, { useState, useEffect, useRef } from 'react';
import Header from '@/components/Header';
import TickerTape from '@/components/TickerTape';

// TradingView Advanced Chart
function TradingViewChart({ symbol }: { symbol: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = '';

    const widgetConfig = {
      autosize: true,
      symbol,
      interval: '1',
      timezone: 'Etc/UTC',
      theme: 'dark',
      style: '1',
      locale: 'en',
      toolbar_bg: '#000000',
      enable_publishing: false,
      hide_top_toolbar: false,
      hide_legend: false,
      save_image: false,
      backgroundColor: '#000000',
      gridColor: 'rgba(255,255,255,0.05)',
      hide_volume: false,
    };

    const encodedConfig = encodeURIComponent(JSON.stringify(widgetConfig));
    const iframeSrc = `https://www.tradingview-widget.com/embed-widget/advanced-chart/?locale=en#${encodedConfig}`;

    const iframe = document.createElement('iframe');
    iframe.src = iframeSrc;
    iframe.style.width = '100%';
    iframe.style.height = '400px';
    iframe.style.border = 'none';
    iframe.allowFullscreen = true;
    iframe.title = 'TradingView Advanced Chart';
    containerRef.current.appendChild(iframe);
  }, [symbol]);

  return <div ref={containerRef} style={{ width: '100%', height: '400px' }} />;
}

// TradingView Mini Chart
function MiniChart({ symbol }: { symbol: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = '';

    const widgetConfig = {
      symbol,
      width: '100%',
      height: 200,
      locale: 'en',
      dateRange: '12M',
      colorTheme: 'dark',
      isTransparent: false,
      autosize: true,
      largeChartUrl: '',
      noTimeScale: false,
      chartOnly: false,
      hide_volume: true,
    };

    const encodedConfig = encodeURIComponent(JSON.stringify(widgetConfig));
    const iframeSrc = `https://www.tradingview-widget.com/embed-widget/mini-symbol-overview/?locale=en#${encodedConfig}`;

    const iframe = document.createElement('iframe');
    iframe.src = iframeSrc;
    iframe.style.width = '100%';
    iframe.style.height = '200px';
    iframe.style.border = 'none';
    iframe.title = `Mini chart ${symbol}`;
    containerRef.current.appendChild(iframe);
  }, [symbol]);

  return <div ref={containerRef} style={{ width: '100%', height: '200px' }} />;
}

const DURATION_OPTIONS = [
  { label: '5 Sec', value: 5, unit: 'sec' },
  { label: '15 Sec', value: 15, unit: 'sec' },
  { label: '30 Sec', value: 30, unit: 'sec' },
  { label: '1 Min', value: 1, unit: 'min' },
  { label: '5 Min', value: 5, unit: 'min' },
  { label: '15 Min', value: 15, unit: 'min' },
  { label: '30 Min', value: 30, unit: 'min' },
  { label: '1 Hour', value: 1, unit: 'hour' },
  { label: '4 Hour', value: 4, unit: 'hour' },
  { label: '1 Day', value: 1, unit: 'day' },
];

const POPULAR_ASSETS = [
  // Row 1 - Crypto
  { symbol: 'BTCUSDT', name: 'BITCOIN / TETHERUS', tvSymbol: 'BINANCE:BTCUSDT' },
  { symbol: 'ETHUSDT', name: 'ETHEREUM / TETHERUS', tvSymbol: 'BINANCE:ETHUSDT' },
  { symbol: 'SOLUSDT', name: 'SOL / TETHERUS', tvSymbol: 'BINANCE:SOLUSDT' },
  // Row 2 - Crypto
  { symbol: 'BNBUSDT', name: 'BINANCE COIN / TETHERUS', tvSymbol: 'BINANCE:BNBUSDT' },
  { symbol: 'XRPUSDT', name: 'XRP / TETHERUS', tvSymbol: 'BINANCE:XRPUSDT' },
  { symbol: 'ADAUSDT', name: 'CARDANO / TETHERUS', tvSymbol: 'BINANCE:ADAUSDT' },
  // Row 3 - Crypto
  { symbol: 'DOGEUSDT', name: 'DOGECOIN / TETHERUS', tvSymbol: 'BINANCE:DOGEUSDT' },
  { symbol: 'AVAXUSDT', name: 'AVAX / TETHERUS', tvSymbol: 'BINANCE:AVAXUSDT' },
  { symbol: 'DOTUSDT', name: 'DOT / TETHERUS', tvSymbol: 'BINANCE:DOTUSDT' },
  // Row 4 - Stocks
  { symbol: 'AAPL', name: 'APPLE INC', tvSymbol: 'NASDAQ:AAPL' },
  { symbol: 'MSFT', name: 'MICROSOFT CORP.', tvSymbol: 'NASDAQ:MSFT' },
  { symbol: 'GOOGL', name: 'ALPHABET INC (GOOGLE) CLASS A', tvSymbol: 'NASDAQ:GOOGL' },
  // Row 5 - Stocks
  { symbol: 'AMZN', name: 'AMAZON.COM, INC.', tvSymbol: 'NASDAQ:AMZN' },
  { symbol: 'META', name: 'META PLATFORMS, INC.', tvSymbol: 'NASDAQ:META' },
  { symbol: 'AMD', name: 'ADVANCED MICRO DEVICES INC.', tvSymbol: 'NASDAQ:AMD' },
  // Row 6 - Mixed
  { symbol: 'NFLX', name: 'NETFLIX, INC.', tvSymbol: 'NASDAQ:NFLX' },
  { symbol: 'COIN', name: 'COINBASE GLOBAL, INC.', tvSymbol: 'NASDAQ:COIN' },
  { symbol: 'EURUSD', name: 'EURO / U.S. DOLLAR', tvSymbol: 'FX:EURUSD' },
];

export default function MarketsPage() {
  const [investmentAmount, setInvestmentAmount] = useState(10);
  const [investmentSlider, setInvestmentSlider] = useState(10);
  const [selectedDuration, setSelectedDuration] = useState('1 Min');
  const [durationSlider, setDurationSlider] = useState(3); // index in DURATION_OPTIONS
  const [activeTab, setActiveTab] = useState<'open' | 'history'>('open');

  const currentDuration = DURATION_OPTIONS[durationSlider];

  const handleInvestmentMinus = () => {
    setInvestmentAmount((prev) => Math.max(1, prev - 1));
    setInvestmentSlider((prev) => Math.max(1, prev - 1));
  };
  const handleInvestmentPlus = () => {
    setInvestmentAmount((prev) => Math.min(10000, prev + 1));
    setInvestmentSlider((prev) => Math.min(10000, prev + 1));
  };
  const handleInvestmentSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setInvestmentAmount(val);
    setInvestmentSlider(val);
  };

  const handleDurationMinus = () => {
    setDurationSlider((prev) => {
      const next = Math.max(0, prev - 1);
      setSelectedDuration(DURATION_OPTIONS[next].label);
      return next;
    });
  };
  const handleDurationPlus = () => {
    setDurationSlider((prev) => {
      const next = Math.min(DURATION_OPTIONS.length - 1, prev + 1);
      setSelectedDuration(DURATION_OPTIONS[next].label);
      return next;
    });
  };
  const handleDurationSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setDurationSlider(val);
    setSelectedDuration(DURATION_OPTIONS[val].label);
  };
  const handleDurationPreset = (label: string, idx: number) => {
    setSelectedDuration(label);
    setDurationSlider(idx);
  };

  const potentialProfit = (investmentAmount * 0.95).toFixed(2);

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <TickerTape />

      {/* Page Header */}
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-3xl font-bold text-white">Markets</h1>
            <p className="text-slate-400 mt-0.5 text-xs sm:text-sm">Practice trading with virtual funds</p>
          </div>
          <div
            style={{
              background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 50%, #5b21b6 100%)',
              borderRadius: '12px',
              padding: '12px 16px',
              minWidth: '160px',
            }}
            className="text-right w-full sm:w-auto"
          >
            <p className="text-purple-200 text-xs font-medium mb-0.5">Demo Account Balance</p>
            <p className="text-white text-2xl sm:text-3xl font-bold">$10,000</p>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="container mx-auto px-4 sm:px-6 pb-4 sm:pb-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
          {/* Total Trades */}
          <div className="rounded-xl p-3 sm:p-4" style={{ background: '#000000', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(59,130,246,0.15)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              </div>
              <div>
                <p className="text-slate-400 text-[10px] sm:text-xs">Total Trades</p>
                <p className="text-white text-lg sm:text-xl font-bold">0</p>
              </div>
            </div>
          </div>
          {/* Win Rate */}
          <div className="rounded-xl p-3 sm:p-4" style={{ background: '#000000', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(34,197,94,0.15)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a10 10 0 1 0 10 10" />
                  <path d="M12 6v6l4 2" />
                </svg>
              </div>
              <div>
                <p className="text-slate-400 text-[10px] sm:text-xs">Win Rate</p>
                <p className="text-white text-lg sm:text-xl font-bold">0.0%</p>
              </div>
            </div>
          </div>
          {/* Total Profit */}
          <div className="rounded-xl p-3 sm:p-4" style={{ background: '#000000', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(34,197,94,0.15)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="1" x2="12" y2="23" />
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <div>
                <p className="text-slate-400 text-[10px] sm:text-xs">Total Profit</p>
                <p className="text-white text-lg sm:text-xl font-bold">$0.00</p>
              </div>
            </div>
          </div>
          {/* Open Positions */}
          <div className="rounded-xl p-3 sm:p-4" style={{ background: '#000000', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(251,146,60,0.15)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fb923c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div>
                <p className="text-slate-400 text-[10px] sm:text-xs">Open Positions</p>
                <p className="text-white text-lg sm:text-xl font-bold">0</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trading Section */}
      <div className="container mx-auto px-4 sm:px-6 pb-4 sm:pb-6">
        <div className="rounded-xl overflow-hidden" style={{ background: '#000000', border: '1px solid rgba(255,255,255,0.08)' }}>
          {/* Symbol Header */}
          <div className="flex items-start justify-between px-4 pt-4 pb-3">
            <div>
              <p className="text-slate-400 text-xs mb-0.5">Trading Symbol</p>
              <p className="text-white text-lg sm:text-xl font-bold">Bitcoin</p>
              <p className="text-slate-500 text-xs sm:text-sm">BINANCE:BTCUSDT</p>
            </div>
            <button className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors flex-shrink-0" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </button>
          </div>

          {/* Chart */}
          <div style={{ background: '#000000' }}>
            <TradingViewChart symbol="BINANCE:BTCUSDT" />
          </div>

          {/* Chart Footer */}
          <div className="flex items-center justify-between px-4 py-2.5" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 inline-block" style={{ boxShadow: '0 0 6px #22c55e' }} />
              <span className="text-green-400 text-xs font-medium">Live Market</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 text-xs">Price:</span>
              <span className="text-red-400 text-sm sm:text-lg font-bold">$69,302.20</span>
              <span className="text-red-400 text-xs">▼</span>
            </div>
          </div>
        </div>
      </div>

      {/* Trade Controls */}
      <div className="container mx-auto px-4 sm:px-6 pb-4 sm:pb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
          {/* Investment Amount */}
          <div className="rounded-xl p-4" style={{ background: '#000000', border: '1px solid rgba(255,255,255,0.08)' }}>
            <p className="text-white font-semibold text-sm mb-3">Investment Amount</p>
            <div className="flex items-center gap-2 mb-2">
              <button
                onClick={handleInvestmentMinus}
                className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-lg hover:bg-white/10 transition-colors flex-shrink-0"
                style={{ border: '1px solid rgba(255,255,255,0.15)' }}
              >
                −
              </button>
              <div
                className="flex-1 h-10 flex items-center justify-center rounded-lg text-white font-semibold"
                style={{ background: '#111111', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                ${investmentAmount}
              </div>
              <button
                onClick={handleInvestmentPlus}
                className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-lg hover:bg-white/10 transition-colors flex-shrink-0"
                style={{ border: '1px solid rgba(255,255,255,0.15)' }}
              >
                +
              </button>
            </div>
            <p className="text-slate-500 text-xs text-center mb-3">Range: $1 - $10,000</p>
            <input
              type="range"
              min={1}
              max={10000}
              value={investmentSlider}
              onChange={handleInvestmentSlider}
              className="w-full h-2 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #7c3aed ${((investmentSlider - 1) / 9999) * 100}%, #2d2d4e ${((investmentSlider - 1) / 9999) * 100}%)`,
              }}
            />
          </div>

          {/* Trade Duration */}
          <div className="rounded-xl p-4" style={{ background: '#000000', border: '1px solid rgba(255,255,255,0.08)' }}>
            <p className="text-white font-semibold text-sm mb-3">Trade Duration</p>
            <div className="flex items-center gap-2 mb-2">
              <button
                onClick={handleDurationMinus}
                className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-lg hover:bg-white/10 transition-colors flex-shrink-0"
                style={{ border: '1px solid rgba(255,255,255,0.15)' }}
              >
                −
              </button>
              <div
                className="flex-1 h-10 flex items-center justify-center rounded-lg text-white font-semibold"
                style={{ background: '#111111', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                {DURATION_OPTIONS[durationSlider].label}
              </div>
              <button
                onClick={handleDurationPlus}
                className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-lg hover:bg-white/10 transition-colors flex-shrink-0"
                style={{ border: '1px solid rgba(255,255,255,0.15)' }}
              >
                +
              </button>
            </div>
            <p className="text-slate-500 text-xs text-center mb-3">Range: 5 Sec – 1 Day</p>
            <input
              type="range"
              min={0}
              max={DURATION_OPTIONS.length - 1}
              value={durationSlider}
              onChange={handleDurationSlider}
              className="w-full h-2 rounded-full appearance-none cursor-pointer mb-4"
              style={{
                background: `linear-gradient(to right, #7c3aed ${(durationSlider / (DURATION_OPTIONS.length - 1)) * 100}%, #2d2d4e ${(durationSlider / (DURATION_OPTIONS.length - 1)) * 100}%)`,
              }}
            />
            {/* Time Presets */}
            <div className="grid grid-cols-3 gap-1.5">
              {DURATION_OPTIONS.map((opt, idx) => (
                <button
                  key={opt.label}
                  onClick={() => handleDurationPreset(opt.label, idx)}
                  className="py-1.5 rounded-lg text-xs font-medium transition-colors"
                  style={{
                    background: selectedDuration === opt.label ? 'linear-gradient(135deg, #7c3aed, #6d28d9)' : '#111111',
                    color: selectedDuration === opt.label ? '#fff' : '#94a3b8',
                    border: selectedDuration === opt.label ? '1px solid #7c3aed' : '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Execute Trade */}
          <div className="rounded-xl p-4" style={{ background: '#000000', border: '1px solid rgba(255,255,255,0.08)' }}>
            <p className="text-white font-semibold text-sm mb-3">Execute Trade</p>
            <div className="space-y-3 mb-5">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-sm">Market Status</span>
                <span className="px-2 py-0.5 rounded text-xs font-semibold" style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)' }}>Open</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-sm">Potential Profit</span>
                <span className="text-green-400 font-semibold">+${potentialProfit}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-sm">Payout</span>
                <span className="text-white font-semibold">95%</span>
              </div>
            </div>
            <div className="space-y-3">
              <button
                className="w-full py-3 rounded-xl font-bold text-white text-base flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-95"
                style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)' }}
              >
                <span>▲</span> UP
              </button>
              <button
                className="w-full py-3 rounded-xl font-bold text-white text-base flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-95"
                style={{ background: 'linear-gradient(135deg, #dc2626, #b91c1c)' }}
              >
                <span>▼</span> DOWN
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Positions Section */}
      <div className="container mx-auto px-4 sm:px-6 pb-4 sm:pb-6">
        <div className="rounded-xl overflow-hidden" style={{ background: '#000000', border: '1px solid rgba(255,255,255,0.08)' }}>
          {/* Tabs */}
          <div className="flex" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <button
              onClick={() => setActiveTab('open')}
              className="px-5 py-4 text-sm font-medium transition-colors relative"
              style={{ color: activeTab === 'open' ? '#fff' : '#94a3b8' }}
            >
              Open Positions (0)
              {activeTab === 'open' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: '#7c3aed' }} />
              )}
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className="px-5 py-4 text-sm font-medium transition-colors relative"
              style={{ color: activeTab === 'history' ? '#fff' : '#94a3b8' }}
            >
              History (0)
              {activeTab === 'history' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: '#7c3aed' }} />
              )}
            </button>
          </div>
          {/* Empty State */}
          <div className="py-16 text-center">
            <p className="text-slate-500 text-sm">No open positions. Place a trade to get started.</p>
          </div>
        </div>
      </div>

      {/* Popular Assets */}
      <div style={{ background: '#000000' }} className="py-8 sm:py-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-1.5">Popular Assets</h2>
            <p className="text-slate-400 text-xs sm:text-sm">Track and trade the most popular stocks, cryptocurrencies, forex pairs, and commodities</p>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '1px',
              background: '#222222',
              border: '1px solid #222222',
            }}
            className="sm:grid-cols-3"
          >
            {POPULAR_ASSETS.map((asset) => (
              <div
                key={asset.symbol}
                style={{ background: '#111111', overflow: 'hidden' }}
              >
                {/* Card Header */}
                <div className="flex items-center justify-between px-2 sm:px-3 pt-2.5 pb-1">
                  <div className="min-w-0">
                    <p className="text-white text-xs font-bold tracking-wide truncate">{asset.symbol}</p>
                    <p className="truncate" style={{ color: '#888888', fontSize: '9px' }}>{asset.name}</p>
                  </div>
                  <div style={{ opacity: 0.5, flexShrink: 0 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <rect x="2" y="2" width="20" height="20" rx="3" fill="#1a1a2e" />
                      <text x="4" y="17" fontSize="12" fontWeight="bold" fill="#2962ff">TV</text>
                    </svg>
                  </div>
                </div>
                {/* Mini Chart */}
                <MiniChart symbol={asset.tvSymbol} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
