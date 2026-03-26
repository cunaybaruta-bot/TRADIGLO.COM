'use client';
import React, { useState, useEffect, useRef } from 'react';
import Header from '@/components/Header';
import TickerTape from '@/components/TickerTape';
import Link from 'next/link';

// TradingView Advanced Chart Widget (same as member dashboard)
function TradingViewChart({ symbol }: { symbol: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = '';

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      if (typeof (window as any).TradingView === 'undefined') return;
      new (window as any).TradingView.widget({
        container_id: 'tv_chart_markets',
        symbol: symbol,
        interval: '1',
        timezone: 'Etc/UTC',
        theme: 'dark',
        style: '1',
        locale: 'en',
        toolbar_bg: '#0d0d0d',
        enable_publishing: false,
        hide_top_toolbar: false,
        hide_legend: false,
        save_image: false,
        backgroundColor: '#000000',
        gridColor: 'rgba(255,255,255,0.04)',
        width: '100%',
        height: 400,
        allow_symbol_change: false,
        hide_side_toolbar: true,
        withdateranges: false,
        details: false,
        hotlist: false,
        calendar: false,
        studies: [],
      });
    };
    containerRef.current.appendChild(script);

    return () => {
      if (containerRef.current) containerRef.current.innerHTML = '';
    };
  }, [symbol]);

  return (
    <div
      id="tv_chart_markets"
      ref={containerRef}
      style={{ width: '100%', height: 400, background: '#000000' }}
    />
  );
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

const DURATION_STEPS = [5, 10, 15, 20, 30, 45, 60, 120, 300, 600, 900, 1800, 3600, 7200, 14400, 28800, 43200, 86400, 172800, 259200, 432000, 604800, 1209600, 2592000];

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
  if (seconds < 2592000) return `${Math.floor(seconds / 604800)}w`;
  return `${Math.floor(seconds / 2592000)}mo`;
}

const POPULAR_ASSETS = [
  { symbol: 'BTCUSDT', name: 'BITCOIN / TETHERUS', tvSymbol: 'BINANCE:BTCUSDT' },
  { symbol: 'ETHUSDT', name: 'ETHEREUM / TETHERUS', tvSymbol: 'BINANCE:ETHUSDT' },
  { symbol: 'SOLUSDT', name: 'SOL / TETHERUS', tvSymbol: 'BINANCE:SOLUSDT' },
  { symbol: 'BNBUSDT', name: 'BINANCE COIN / TETHERUS', tvSymbol: 'BINANCE:BNBUSDT' },
  { symbol: 'XRPUSDT', name: 'XRP / TETHERUS', tvSymbol: 'BINANCE:XRPUSDT' },
  { symbol: 'ADAUSDT', name: 'CARDANO / TETHERUS', tvSymbol: 'BINANCE:ADAUSDT' },
  { symbol: 'DOGEUSDT', name: 'DOGECOIN / TETHERUS', tvSymbol: 'BINANCE:DOGEUSDT' },
  { symbol: 'AVAXUSDT', name: 'AVAX / TETHERUS', tvSymbol: 'BINANCE:AVAXUSDT' },
  { symbol: 'DOTUSDT', name: 'DOT / TETHERUS', tvSymbol: 'BINANCE:DOTUSDT' },
  { symbol: 'AAPL', name: 'APPLE INC', tvSymbol: 'NASDAQ:AAPL' },
  { symbol: 'MSFT', name: 'MICROSOFT CORP.', tvSymbol: 'NASDAQ:MSFT' },
  { symbol: 'GOOGL', name: 'ALPHABET INC (GOOGLE) CLASS A', tvSymbol: 'NASDAQ:GOOGL' },
  { symbol: 'AMZN', name: 'AMAZON.COM, INC.', tvSymbol: 'NASDAQ:AMZN' },
  { symbol: 'META', name: 'META PLATFORMS, INC.', tvSymbol: 'NASDAQ:META' },
  { symbol: 'AMD', name: 'ADVANCED MICRO DEVICES INC.', tvSymbol: 'NASDAQ:AMD' },
  { symbol: 'NFLX', name: 'NETFLIX, INC.', tvSymbol: 'NASDAQ:NFLX' },
  { symbol: 'COIN', name: 'COINBASE GLOBAL, INC.', tvSymbol: 'NASDAQ:COIN' },
  { symbol: 'EURUSD', name: 'EURO / U.S. DOLLAR', tvSymbol: 'FX:EURUSD' },
];

const DEMO_TRADE_LIMIT = 5;

interface DemoTrade {
  id: string;
  direction: 'UP' | 'DOWN';
  amount: number;
  duration: string;
  durationSeconds: number;
  openedAt: number;
  entryPrice: number | null;
  result?: 'win' | 'loss';
  profit?: number;
  status: 'open' | 'closed';
}

// Signup Prompt Modal
function SignupPromptModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)' }}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-6 relative"
        style={{ background: '#0d0d0d', border: '1px solid rgba(124,58,237,0.4)' }}
      >
        {/* Glow accent */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 rounded-b-full"
          style={{ background: 'linear-gradient(90deg, #7c3aed, #6d28d9)' }}
        />

        {/* Icon */}
        <div className="flex justify-center mb-4 mt-2">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)' }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a10 10 0 1 0 10 10" />
              <path d="M12 8v4l3 3" />
              <path d="M18 2v6h6" />
            </svg>
          </div>
        </div>

        <h2 className="text-white text-xl font-bold text-center mb-2">Demo Limit Reached</h2>
        <p className="text-slate-400 text-sm text-center mb-6 leading-relaxed">
          You&apos;ve used all <span className="text-purple-400 font-semibold">5 free demo trades</span>. Create a free account to continue trading with unlimited demo access and real funds.
        </p>

        {/* Benefits */}
        <div className="space-y-2 mb-6">
          {[
            'Unlimited demo trading',
            'Real account with live markets',
            'Deposit & withdraw anytime',
          ].map((benefit) => (
            <div key={benefit} className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(34,197,94,0.2)' }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <span className="text-slate-300 text-xs">{benefit}</span>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <Link
            href="/register"
            className="block w-full py-3 rounded-xl font-bold text-white text-sm text-center transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}
          >
            Create Free Account
          </Link>
          <Link
            href="/login"
            className="block w-full py-3 rounded-xl font-semibold text-sm text-center transition-all hover:bg-white/10"
            style={{ color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            Sign In to Existing Account
          </Link>
        </div>

        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// Trade Result Toast
function TradeToast({ trade, onDismiss }: { trade: DemoTrade; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  const isWin = trade.result === 'win';
  return (
    <div
      className="fixed bottom-6 right-4 z-40 rounded-xl p-4 shadow-2xl max-w-xs w-full"
      style={{
        background: isWin ? 'rgba(22,163,74,0.95)' : 'rgba(220,38,38,0.95)',
        border: `1px solid ${isWin ? '#16a34a' : '#dc2626'}`,
        backdropFilter: 'blur(8px)',
      }}
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
          {isWin ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          )}
        </div>
        <div>
          <p className="text-white font-bold text-sm">{isWin ? 'Trade Won!' : 'Trade Lost'}</p>
          <p className="text-white/80 text-xs">
            {trade.direction} · ${trade.amount} · {isWin ? `+$${trade.profit?.toFixed(2)}` : `-$${trade.amount}`}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function MarketsPage() {
  const [investmentAmount, setInvestmentAmount] = useState(10);
  const [amountInput, setAmountInput] = useState<string>('10');
  const [durationIndex, setDurationIndex] = useState(6);
  const [activeTab, setActiveTab] = useState<'open' | 'history'>('open');

  // Live price state — fetched from Binance API (same source as TradingView chart)
  const [livePrice, setLivePrice] = useState<number | null>(null);
  const [priceDirection, setPriceDirection] = useState<'up' | 'down' | null>(null);
  const prevPriceRef = useRef<number | null>(null);

  // Demo trading state
  const [demoTradeCount, setDemoTradeCount] = useState(0);
  const [demoLimitLoaded, setDemoLimitLoaded] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [openTrades, setOpenTrades] = useState<DemoTrade[]>([]);
  const [closedTrades, setClosedTrades] = useState<DemoTrade[]>([]);
  const [toastTrade, setToastTrade] = useState<DemoTrade | null>(null);
  const [isPlacing, setIsPlacing] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Real-time BTC price via polling internal API (Twelve Data)
  useEffect(() => {
    let pollTimer: NodeJS.Timeout | null = null;
    let cancelled = false;

    const fetchPrice = () => {
      fetch('/api/markets/btc-price')
        .then((r) => r.json())
        .then((d) => {
          if (cancelled) return;
          const price = parseFloat(d.price);
          if (!isNaN(price) && price > 0) {
            setPriceDirection(
              prevPriceRef.current === null ? null : price >= prevPriceRef.current ? 'up' : 'down'
            );
            prevPriceRef.current = price;
            setLivePrice(price);
          }
        })
        .catch(() => {})
        .finally(() => {
          if (!cancelled) {
            pollTimer = setTimeout(fetchPrice, 1000);
          }
        });
    };

    fetchPrice();

    return () => {
      cancelled = true;
      if (pollTimer) clearTimeout(pollTimer);
    };
  }, []);

  // Load demo count from Supabase by IP
  useEffect(() => {
    const fetchDemoCount = async () => {
      try {
        const res = await fetch('/api/demo-trade-limit');
        if (res.ok) {
          const data = await res.json();
          setDemoTradeCount(data.trade_count ?? 0);
        }
      } catch {
        // silently fail — default to 0
      } finally {
        setDemoLimitLoaded(true);
      }
    };
    fetchDemoCount();
  }, []);

  // Countdown timer for open trades
  useEffect(() => {
    if (openTrades.length === 0) return;

    timerRef.current = setInterval(() => {
      const now = Date.now();
      const stillOpen: DemoTrade[] = [];
      const newlyClosed: DemoTrade[] = [];

      openTrades.forEach((trade) => {
        const elapsed = (now - trade.openedAt) / 1000;
        if (elapsed >= trade.durationSeconds) {
          // Simulate result: 50/50 win/loss
          const isWin = Math.random() > 0.5;
          const profit = isWin ? parseFloat((trade.amount * 0.95).toFixed(2)) : 0;
          newlyClosed.push({ ...trade, status: 'closed', result: isWin ? 'win' : 'loss', profit });
        } else {
          stillOpen.push(trade);
        }
      });

      if (newlyClosed.length > 0) {
        setOpenTrades(stillOpen);
        setClosedTrades((prev) => [...newlyClosed, ...prev]);
        setToastTrade(newlyClosed[0]);
      }
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [openTrades]);

  const currentDurationSeconds = DURATION_STEPS[durationIndex];
  const currentDurationLabel = formatDuration(currentDurationSeconds);

  // Derived stats
  const totalTrades = closedTrades.length;
  const wins = closedTrades.filter((t) => t.result === 'win').length;
  const winRate = totalTrades > 0 ? ((wins / totalTrades) * 100).toFixed(1) : '0.0';
  const totalProfit = closedTrades.reduce((acc, t) => {
    if (t.result === 'win') return acc + (t.profit ?? 0);
    return acc - t.amount;
  }, 0);
  const openPositions = openTrades.length;

  // Amount handlers
  const handleAmountDecrement = () => {
    const newVal = Math.max(1, investmentAmount - 1);
    setInvestmentAmount(newVal);
    setAmountInput(String(newVal));
  };
  const handleAmountIncrement = () => {
    const newVal = Math.min(10000, investmentAmount + 1);
    setInvestmentAmount(newVal);
    setAmountInput(String(newVal));
  };
  const handleAmountInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    setAmountInput(raw);
  };
  const handleAmountInputBlur = () => {
    const parsed = parseInt(amountInput, 10);
    if (isNaN(parsed) || parsed < 1) {
      setInvestmentAmount(1);
      setAmountInput('1');
    } else if (parsed > 10000) {
      setInvestmentAmount(10000);
      setAmountInput('10000');
    } else {
      setInvestmentAmount(parsed);
      setAmountInput(String(parsed));
    }
  };

  // Duration handlers
  const decrementDuration = () => { if (durationIndex > 0) setDurationIndex((i) => i - 1); };
  const incrementDuration = () => { if (durationIndex < DURATION_STEPS.length - 1) setDurationIndex((i) => i + 1); };

  const placeTrade = async (direction: 'UP' | 'DOWN') => {
    if (demoTradeCount >= DEMO_TRADE_LIMIT) {
      setShowSignupModal(true);
      return;
    }

    setIsPlacing(true);

    try {
      // Increment count in Supabase by IP
      const res = await fetch('/api/demo-trade-limit', { method: 'POST' });
      if (!res.ok) {
        setIsPlacing(false);
        return;
      }
      const data = await res.json();
      const newCount = data.trade_count ?? demoTradeCount + 1;
      setDemoTradeCount(newCount);

      const trade: DemoTrade = {
        id: `demo-${Date.now()}`,
        direction,
        amount: investmentAmount,
        duration: currentDurationLabel,
        durationSeconds: currentDurationSeconds,
        openedAt: Date.now(),
        entryPrice: livePrice,
        status: 'open',
      };

      setOpenTrades((prev) => [trade, ...prev]);
      setActiveTab('open');

      // If this was the 5th trade, show modal after a short delay
      if (newCount >= DEMO_TRADE_LIMIT) {
        setTimeout(() => setShowSignupModal(true), 800);
      }
    } catch {
      // silently fail
    } finally {
      setTimeout(() => setIsPlacing(false), 600);
    }
  };

  const potentialProfit = (investmentAmount * 0.95).toFixed(2);
  const tradesRemaining = Math.max(0, DEMO_TRADE_LIMIT - demoTradeCount);

  const displayPrice = livePrice !== null
    ? livePrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : '—';
  const priceColor = priceDirection === 'up' ? '#22c55e' : priceDirection === 'down' ? '#ef4444' : '#94a3b8';
  const priceArrow = priceDirection === 'up' ? '▲' : priceDirection === 'down' ? '▼' : '●';

  return (
    <div className="min-h-screen bg-black text-white">
      {showSignupModal && <SignupPromptModal onClose={() => setShowSignupModal(false)} />}
      {toastTrade && <TradeToast trade={toastTrade} onDismiss={() => setToastTrade(null)} />}

      <Header />
      <TickerTape />

      {/* Page Header */}
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-base sm:text-3xl font-bold text-white">Markets</h1>
            <p className="text-slate-400 mt-0.5 text-xs sm:text-sm">Practice trading with virtual funds</p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
            {/* Demo trades remaining badge */}
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.25)' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span className="text-purple-300 text-xs font-medium">
                {tradesRemaining} demo trade{tradesRemaining !== 1 ? 's' : ''} left
              </span>
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
              <p className="text-white text-lg sm:text-3xl font-bold">$10,000</p>
            </div>
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
                <p className="text-white text-sm sm:text-xl font-bold">{totalTrades}</p>
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
                <p className="text-white text-sm sm:text-xl font-bold">{winRate}%</p>
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
                <p className={`text-sm sm:text-xl font-bold ${totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {totalProfit >= 0 ? '+' : ''}${totalProfit.toFixed(2)}
                </p>
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
                <p className="text-white text-sm sm:text-xl font-bold">{openPositions}</p>
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
              <p className="text-white text-sm sm:text-xl font-bold">Bitcoin</p>
              <p className="text-slate-500 text-xs sm:text-sm">BINANCE:BTCUSDT</p>
            </div>
            <button className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors flex-shrink-0" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </button>
          </div>

          {/* Chart — TradingView widget (BINANCE:BTCUSDT), price fetched separately from Binance API */}
          <div style={{ background: '#000000', height: 400 }}>
            <TradingViewChart symbol="BINANCE:BTCUSDT" />
          </div>

          {/* Chart Footer — Live Market + Real-time Price */}
          <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 inline-block" style={{ boxShadow: '0 0 6px #22c55e' }} />
              <span className="text-green-400 text-xs font-medium">Live Market</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-xs">BTC/USDT</span>
              <span
                className="text-base sm:text-xl font-bold tabular-nums transition-colors"
                style={{ color: priceColor, fontFamily: 'ui-monospace, monospace' }}
              >
                ${displayPrice}
              </span>
              <span className="text-sm font-bold" style={{ color: priceColor }}>{priceArrow}</span>
            </div>
          </div>

          {/* Duration + Amount + BUY/SELL — compact dashboard style */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            {/* Duration + Amount row */}
            <div className="flex items-center gap-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              {/* Duration */}
              <div className="flex-1 flex items-center gap-1.5 px-3 py-2" style={{ borderRight: '1px solid rgba(255,255,255,0.08)' }}>
                <span className="text-[9px] text-slate-500 uppercase tracking-wider flex-shrink-0">Dur</span>
                <button
                  onClick={decrementDuration}
                  disabled={durationIndex <= 0}
                  className="w-6 h-6 rounded flex items-center justify-center text-white font-bold text-sm flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  style={{ background: 'rgba(255,255,255,0.1)' }}
                >−</button>
                <div
                  className="flex-1 text-center rounded py-0.5 text-xs font-semibold text-white min-w-[36px]"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.2)' }}
                >
                  {currentDurationLabel}
                </div>
                <button
                  onClick={incrementDuration}
                  disabled={durationIndex >= DURATION_STEPS.length - 1}
                  className="w-6 h-6 rounded flex items-center justify-center text-white font-bold text-sm flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  style={{ background: 'rgba(255,255,255,0.1)' }}
                >+</button>
              </div>

              {/* Amount */}
              <div className="flex-1 flex items-center gap-1.5 px-3 py-2">
                <span className="text-[9px] text-slate-500 uppercase tracking-wider flex-shrink-0">Amt</span>
                <button
                  onClick={handleAmountDecrement}
                  disabled={investmentAmount <= 1}
                  className="w-6 h-6 rounded flex items-center justify-center text-white font-bold text-sm flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  style={{ background: 'rgba(255,255,255,0.1)' }}
                >−</button>
                <input
                  type="text"
                  inputMode="numeric"
                  value={amountInput}
                  onChange={handleAmountInputChange}
                  onBlur={handleAmountInputBlur}
                  className="flex-1 text-center rounded py-0.5 text-xs font-semibold text-white min-w-[36px] focus:outline-none"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    fontFamily: 'ui-monospace, monospace',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                />
                <button
                  onClick={handleAmountIncrement}
                  disabled={investmentAmount >= 10000}
                  className="w-6 h-6 rounded flex items-center justify-center text-white font-bold text-sm flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  style={{ background: 'rgba(255,255,255,0.1)' }}
                >+</button>
              </div>
            </div>

            {/* Potential profit info */}
            <div className="flex items-center justify-between px-3 py-1.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 text-[10px]">Potential Profit</span>
                  <span className="text-green-400 text-[10px] font-semibold">+${potentialProfit}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 text-[10px]">Payout</span>
                  <span className="text-white text-[10px] font-semibold">95%</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 text-[10px]">Trades Left</span>
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                  style={{
                    background: tradesRemaining > 1 ? 'rgba(124,58,237,0.15)' : 'rgba(220,38,38,0.15)',
                    color: tradesRemaining > 1 ? '#a78bfa' : '#f87171',
                    border: `1px solid ${tradesRemaining > 1 ? 'rgba(124,58,237,0.3)' : 'rgba(220,38,38,0.3)'}`,
                  }}
                >
                  {tradesRemaining}/{DEMO_TRADE_LIMIT}
                </span>
              </div>
            </div>

            {/* SELL / BUY buttons */}
            {demoLimitLoaded && demoTradeCount >= DEMO_TRADE_LIMIT ? (
              <div className="p-3">
                <button
                  onClick={() => setShowSignupModal(true)}
                  className="w-full py-3 rounded-xl font-bold text-white text-sm flex items-center justify-center transition-all hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}
                >
                  Sign Up to Continue
                </button>
              </div>
            ) : (
              <div className="flex gap-0 w-full">
                <button
                  onClick={() => placeTrade('DOWN')}
                  disabled={isPlacing || !demoLimitLoaded}
                  className="flex-1 py-3 disabled:opacity-60 disabled:cursor-not-allowed text-white font-extrabold text-base tracking-widest transition-all flex items-center justify-center gap-2"
                  style={{ background: '#e53935', borderRadius: '0 0 0 12px' }}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /></svg>
                  SELL
                </button>
                <button
                  onClick={() => placeTrade('UP')}
                  disabled={isPlacing || !demoLimitLoaded}
                  className="flex-1 py-3 disabled:opacity-60 disabled:cursor-not-allowed text-white font-extrabold text-base tracking-widest transition-all flex items-center justify-center gap-2"
                  style={{ background: '#2e7d32', borderRadius: '0 0 12px 0' }}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4l8 8h-5v8H9v-8H4z" /></svg>
                  BUY
                </button>
              </div>
            )}
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
              Open Positions ({openTrades.length})
              {activeTab === 'open' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: '#7c3aed' }} />
              )}
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className="px-5 py-4 text-sm font-medium transition-colors relative"
              style={{ color: activeTab === 'history' ? '#fff' : '#94a3b8' }}
            >
              History ({closedTrades.length})
              {activeTab === 'history' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: '#7c3aed' }} />
              )}
            </button>
          </div>

          {/* Open Positions Tab */}
          {activeTab === 'open' && (
            <>
              {openTrades.length === 0 ? (
                <div className="py-16 text-center">
                  <p className="text-slate-500 text-sm">No open positions. Place a trade to get started.</p>
                </div>
              ) : (
                <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                  {openTrades.map((trade) => (
                    <OpenTradeRow key={trade.id} trade={trade} />
                  ))}
                </div>
              )}
            </>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <>
              {closedTrades.length === 0 ? (
                <div className="py-16 text-center">
                  <p className="text-slate-500 text-sm">No trade history yet.</p>
                </div>
              ) : (
                <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                  {closedTrades.map((trade) => (
                    <ClosedTradeRow key={trade.id} trade={trade} />
                  ))}
                </div>
              )}
            </>
          )}
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
                <MiniChart symbol={asset.tvSymbol} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Open Trade Row with countdown
function OpenTradeRow({ trade }: { trade: DemoTrade }) {
  const [timeLeft, setTimeLeft] = useState(() => {
    const elapsed = (Date.now() - trade.openedAt) / 1000;
    return Math.max(0, Math.floor(trade.durationSeconds - elapsed));
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = (Date.now() - trade.openedAt) / 1000;
      setTimeLeft(Math.max(0, Math.floor(trade.durationSeconds - elapsed)));
    }, 1000);
    return () => clearInterval(interval);
  }, [trade.openedAt, trade.durationSeconds]);

  const progress = Math.max(0, Math.min(100, ((trade.durationSeconds - timeLeft) / trade.durationSeconds) * 100));

  const formatTime = (s: number) => {
    if (s <= 0) return '00:00';
    const m = Math.floor(s / 60);
    const sec = s % 60;
    if (s < 60) return `${String(sec).padStart(2, '0')}s`;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  return (
    <div className="px-4 py-3 flex items-center gap-3">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 font-bold text-xs"
        style={{
          background: trade.direction === 'UP' ? 'rgba(22,163,74,0.15)' : 'rgba(220,38,38,0.15)',
          color: trade.direction === 'UP' ? '#22c55e' : '#ef4444',
          border: `1px solid ${trade.direction === 'UP' ? 'rgba(22,163,74,0.3)' : 'rgba(220,38,38,0.3)'}`,
        }}
      >
        {trade.direction === 'UP' ? '▲' : '▼'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-white text-xs font-semibold">BTC/USDT · {trade.direction === 'UP' ? 'BUY' : 'SELL'}</span>
          <span className="text-slate-400 text-xs">${trade.amount}</span>
        </div>
        {trade.entryPrice !== null && (
          <div className="flex items-center gap-1 mb-1">
            <span className="text-slate-500 text-[10px]">Entry:</span>
            <span className="text-slate-300 text-[10px] font-mono font-semibold">
              ${trade.entryPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        )}
        <div className="w-full h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
          <div
            className="h-1 rounded-full transition-all"
            style={{ width: `${progress}%`, background: trade.direction === 'UP' ? '#22c55e' : '#ef4444' }}
          />
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-white text-xs font-mono font-bold">{formatTime(timeLeft)}</p>
        <p className="text-slate-500 text-[10px]">{trade.duration}</p>
      </div>
    </div>
  );
}

// Closed Trade Row
function ClosedTradeRow({ trade }: { trade: DemoTrade }) {
  const isWin = trade.result === 'win';
  return (
    <div className="px-4 py-3 flex items-center gap-3">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{
          background: isWin ? 'rgba(22,163,74,0.15)' : 'rgba(220,38,38,0.15)',
          border: `1px solid ${isWin ? 'rgba(22,163,74,0.3)' : 'rgba(220,38,38,0.3)'}`,
        }}
      >
        {isWin ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white text-xs font-semibold">BTC/USDT · {trade.direction}</p>
        <p className="text-slate-500 text-[10px]">{trade.duration} · ${trade.amount} invested</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className={`text-xs font-bold ${isWin ? 'text-green-400' : 'text-red-400'}`}>
          {isWin ? `+$${trade.profit?.toFixed(2)}` : `-$${trade.amount}`}
        </p>
        <p className="text-slate-500 text-[10px]">{isWin ? 'WIN' : 'LOSS'}</p>
      </div>
    </div>
  );
}
