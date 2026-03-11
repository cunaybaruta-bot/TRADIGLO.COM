'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Wallet {
  demoBalance: number;
  realBalance: number;
}

interface Trade {
  id: string;
  asset_symbol: string;
  order_type: 'buy' | 'sell';
  amount: number;
  entry_price: number;
  exit_price?: number;
  profit_loss?: number;
  result?: 'win' | 'loss' | null;
  status: 'open' | 'closed';
  is_demo: boolean;
  duration_seconds: number;
  opened_at: string;
  closed_at?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ASSETS = [
  { symbol: 'BTC/USDT', label: 'BTC/USDT', tv: 'BINANCE:BTCUSDT' },
  { symbol: 'ETH/USDT', label: 'ETH/USDT', tv: 'BINANCE:ETHUSDT' },
  { symbol: 'SOL/USDT', label: 'SOL/USDT', tv: 'BINANCE:SOLUSDT' },
  { symbol: 'BNB/USDT', label: 'BNB/USDT', tv: 'BINANCE:BNBUSDT' },
  { symbol: 'XRP/USDT', label: 'XRP/USDT', tv: 'BINANCE:XRPUSDT' },
];

const DURATIONS = [
  { label: '5s', seconds: 5 },
  { label: '15s', seconds: 15 },
  { label: '30s', seconds: 30 },
  { label: '1Min', seconds: 60 },
  { label: '5Min', seconds: 300 },
  { label: '15Min', seconds: 900 },
  { label: '30Min', seconds: 1800 },
  { label: '1H', seconds: 3600 },
  { label: '4H', seconds: 14400 },
  { label: '1Day', seconds: 86400 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function getTimeRemaining(openedAt: string, durationSeconds: number): number {
  const openedMs = new Date(openedAt).getTime();
  const expiresMs = openedMs + durationSeconds * 1000;
  const remaining = Math.max(0, Math.floor((expiresMs - Date.now()) / 1000));
  return remaining;
}

function formatTimeRemaining(seconds: number): string {
  if (seconds <= 0) return 'Settling…';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (seconds < 60) return `${String(secs).padStart(2, '0')}s`;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// ─── Toast ────────────────────────────────────────────────────────────────────

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-lg shadow-xl text-sm font-medium transition-all ${
        type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
      }`}
    >
      {type === 'success' ? (
        <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      )}
      <span>{message}</span>
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100">✕</button>
    </div>
  );
}

// ─── TradingView Chart ────────────────────────────────────────────────────────

function TradingViewChart({ tvSymbol }: { tvSymbol: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    if (widgetRef.current) {
      containerRef.current.innerHTML = '';
      widgetRef.current = null;
    }

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      if (!(window as any).TradingView || !containerRef.current) return;
      widgetRef.current = new (window as any).TradingView.widget({
        autosize: true,
        symbol: tvSymbol,
        interval: '1',
        timezone: 'Etc/UTC',
        theme: 'dark',
        style: '1',
        locale: 'en',
        toolbar_bg: '#0a0a0a',
        enable_publishing: false,
        hide_top_toolbar: false,
        hide_legend: false,
        save_image: false,
        container_id: 'tv_chart_container',
        backgroundColor: '#000000',
        gridColor: 'rgba(255,255,255,0.04)',
      });
    };

    if ((window as any).TradingView) {
      script.onload?.(new Event('load'));
    } else {
      document.head.appendChild(script);
    }

    return () => {
      if (containerRef.current) containerRef.current.innerHTML = '';
    };
  }, [tvSymbol]);

  return (
    <div
      id="tv_chart_container"
      ref={containerRef}
      className="w-full rounded-lg overflow-hidden"
      style={{ height: 450 }}
    />
  );
}

// ─── Countdown Cell ───────────────────────────────────────────────────────────

interface CountdownCellProps {
  openedAt: string;
  durationSeconds: number;
  onExpired?: () => void;
}

function CountdownCell({ openedAt, durationSeconds, onExpired }: CountdownCellProps) {
  const [remaining, setRemaining] = useState(() => getTimeRemaining(openedAt, durationSeconds));
  const expiredRef = useRef(false);

  useEffect(() => {
    expiredRef.current = false;
    const interval = setInterval(() => {
      const r = getTimeRemaining(openedAt, durationSeconds);
      setRemaining(r);
      if (r === 0 && !expiredRef.current) {
        expiredRef.current = true;
        // Refresh trades after 3 seconds to allow settlement
        setTimeout(() => {
          onExpired?.();
        }, 3000);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [openedAt, durationSeconds, onExpired]);

  const isExpired = remaining <= 0;
  const isUrgent = remaining > 0 && remaining <= 10;

  return (
    <span
      className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-bold tabular-nums min-w-[56px] ${
        isExpired
          ? 'bg-yellow-500/20 text-yellow-300 animate-pulse'
          : isUrgent
          ? 'bg-red-500/20 text-red-300' :'bg-blue-500/20 text-white'
      }`}
    >
      {formatTimeRemaining(remaining)}
    </span>
  );
}

// ─── Trade Result Popup ───────────────────────────────────────────────────────

interface TradeResult {
  asset_symbol: string;
  order_type: 'buy' | 'sell';
  amount: number;
  result: 'win' | 'loss';
  profit_loss: number;
}

function TradeResultPopup({ trade, onClose }: { trade: TradeResult; onClose: () => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger fade-in
    const showTimer = setTimeout(() => setVisible(true), 10);
    // Auto-dismiss after 3s
    const hideTimer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 220);
    }, 3000);
    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [onClose]);

  const isWin = trade.result === 'win';
  const accentColor = isWin ? '#16a34a' : '#dc2626';
  const symbol = trade.asset_symbol.replace('USDT', '').replace('USD', '');
  const orderLabel = trade.order_type.toUpperCase();
  const profitLabel = isWin
    ? `WIN +$${Math.abs(trade.profit_loss).toFixed(2)}`
    : `LOSS -$${Math.abs(trade.profit_loss).toFixed(2)}`;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 80,
        right: 16,
        zIndex: 9999,
        background: '#111827',
        border: `1px solid ${accentColor}`,
        borderRadius: 6,
        boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
        padding: '12px 16px',
        minWidth: 180,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(10px)',
        transition: 'opacity 200ms ease, transform 200ms ease',
        pointerEvents: 'none',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: '#f1f5f9', fontWeight: 700, fontSize: 13, letterSpacing: '0.03em' }}>
            {symbol}
          </span>
          <span style={{ color: '#94a3b8', fontSize: 11, fontWeight: 500 }}>
            {orderLabel} ${trade.amount.toFixed(2)}
          </span>
        </div>
        <div style={{ color: accentColor, fontWeight: 700, fontSize: 14, letterSpacing: '0.02em' }}>
          {profitLabel}
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard Top Bar ────────────────────────────────────────────────────────

interface DashboardTopBarProps {
  wallet: Wallet | null;
  walletLoading: boolean;
  isDemo: boolean;
  userEmail?: string;
}

function DashboardTopBar({ wallet, walletLoading, isDemo, userEmail }: DashboardTopBarProps) {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace('/login');
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0a0a0a] border-b border-white/10 flex items-center justify-between px-4 h-14">
      {/* Left: Logo */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <Image
          src="/assets/images/LOGO_BARU_TANPA_BACKGROUND-1773102064187.png"
          alt="Investoft logo"
          width={110}
          height={32}
          className="object-contain"
          priority
        />
      </div>

      {/* Center: Balance display */}
      <div className="flex items-center gap-2">
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold ${
          isDemo
            ? 'bg-blue-500/10 border-blue-500/30 text-blue-300' :'bg-orange-500/10 border-orange-500/30 text-orange-300'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${isDemo ? 'bg-blue-400' : 'bg-orange-400'}`} />
          <span className="text-[10px] uppercase tracking-wider font-medium opacity-70">
            {isDemo ? 'Demo' : 'Real'}
          </span>
          <span className="text-white font-bold">
            {walletLoading
              ? '…'
              : `$${formatCurrency(isDemo ? (wallet?.demoBalance ?? 0) : (wallet?.realBalance ?? 0))}`}
          </span>
        </div>
      </div>

      {/* Right: User avatar */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold select-none">
          {userEmail ? userEmail[0].toUpperCase() : 'U'}
        </div>
        <button
          onClick={handleLogout}
          className="ml-1 px-3 py-1.5 text-xs font-medium text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-md transition-colors"
        >
          Logout
        </button>
      </div>
    </header>
  );
}

// ─── Bottom Navigation ────────────────────────────────────────────────────────

type NavSection = 'trade' | 'history' | 'copytrade' | 'account';

function BottomNav({ active, onChange }: { active: NavSection; onChange: (s: NavSection) => void }) {
  const items: { id: NavSection; label: string; icon: React.ReactNode }[] = [
    {
      id: 'trade',
      label: 'Trade',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      id: 'history',
      label: 'History',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      id: 'copytrade',
      label: 'Copy Trade',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      id: 'account',
      label: 'Account',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#0a0a0a] border-t border-white/10 flex items-stretch" style={{ height: 64 }}>
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => onChange(item.id)}
          className={`flex-1 flex flex-col items-center justify-center gap-1 transition-colors ${
            active === item.id ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          {item.icon}
          <span className="text-[10px] font-medium leading-none">{item.label}</span>
        </button>
      ))}
    </nav>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

const supabase = createClient();

export default function DashboardPage() {
  const router = useRouter();

  // Auth
  const [authChecked, setAuthChecked] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');

  // Data
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [openTrades, setOpenTrades] = useState<Trade[]>([]);
  const [tradeHistory, setTradeHistory] = useState<Trade[]>([]);

  // Loading states
  const [walletLoading, setWalletLoading] = useState(true);
  const [tradesLoading, setTradesLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);

  // Trade panel
  const [selectedAsset, setSelectedAsset] = useState(ASSETS[0]);
  const [amount, setAmount] = useState<number>(10);
  const [selectedDuration, setSelectedDuration] = useState(DURATIONS[3]);
  const [isDemo, setIsDemo] = useState(true);
  const [buyLoading, setBuyLoading] = useState(false);
  const [sellLoading, setSellLoading] = useState(false);

  // Nav
  const [activeNav, setActiveNav] = useState<NavSection>('trade');

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Trade result popup
  const [tradeResultPopup, setTradeResultPopup] = useState<TradeResult | null>(null);

  // ── Auth Check ──────────────────────────────────────────────────────────────

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace('/login');
      } else {
        setUserId(data.session.user.id);
        setUserEmail(data.session.user.email ?? '');
        setAuthChecked(true);
      }
    });
  }, []);

  // ── Data Fetchers ───────────────────────────────────────────────────────────

  const fetchWallet = useCallback(async () => {
    setWalletLoading(true);
    try {
      const currentUser = (await supabase.auth.getUser()).data.user;
      if (!currentUser) return;

      const { data: wallets } = await supabase.from('wallets').select('*').eq('user_id', currentUser.id);
      const demoWallet = wallets?.find((w: any) => w.is_demo === true);
      const realWallet = wallets?.find((w: any) => w.is_demo === false);

      setWallet({ demoBalance: demoWallet?.balance ?? 0, realBalance: realWallet?.balance ?? 0 });
    } catch {
      // silent
    } finally {
      setWalletLoading(false);
    }
  }, []);

  const fetchOpenTrades = useCallback(async () => {
    setTradesLoading(true);
    try {
      const currentUser = (await supabase.auth.getUser()).data.user;
      if (!currentUser) return;

      // Try RPC first, fallback to direct query
      let data: any[] | null = null;
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_open_trades');

      if (!rpcError && rpcData) {
        data = rpcData;
      } else {
        const { data: directData, error: directError } = await supabase
          .from('trades')
          .select('*, assets(symbol)')
          .eq('user_id', currentUser.id)
          .eq('status', 'open')
          .order('opened_at', { ascending: false });
        if (!directError) data = directData;
      }

      const mapped = (data ?? []).map((t: any) => ({
        ...t,
        asset_symbol: t.asset_symbol ?? t.assets?.symbol ?? '',
        profit_loss: t.profit ?? t.profit_loss ?? null,
      }));
      setOpenTrades(mapped as Trade[]);
    } catch {
      // silent
    } finally {
      setTradesLoading(false);
    }
  }, []);

  const fetchTradeHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const currentUser = (await supabase.auth.getUser()).data.user;
      if (!currentUser) return;

      // Try RPC first, fallback to direct query
      let data: any[] | null = null;
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_trade_history');

      if (!rpcError && rpcData) {
        data = rpcData;
      } else {
        const { data: directData, error: directError } = await supabase
          .from('trades')
          .select('*, assets(symbol)')
          .eq('user_id', currentUser.id)
          .eq('status', 'closed')
          .order('closed_at', { ascending: false })
          .limit(100);
        if (!directError) data = directData;
      }

      const mapped = (data ?? []).map((t: any) => ({
        ...t,
        asset_symbol: t.asset_symbol ?? t.assets?.symbol ?? '',
        profit_loss: t.profit ?? t.profit_loss ?? null,
        result: t.result ?? (t.profit != null ? (t.profit >= 0 ? 'win' : 'loss') : null),
      }));
      setTradeHistory(mapped as Trade[]);
    } catch {
      // silent
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  // ── Initial Load ────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!authChecked) return;
    fetchWallet();
    fetchOpenTrades();
    fetchTradeHistory();
  }, [authChecked, fetchWallet, fetchOpenTrades, fetchTradeHistory]);

  // ── Realtime Subscriptions ──────────────────────────────────────────────────

  useEffect(() => {
    if (!authChecked || !userId) return;

    const walletChannel = supabase
      .channel('dashboard-wallets')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'wallets', filter: `user_id=eq.${userId}` },
        () => fetchWallet()
      )
      .subscribe();

    const tradesChannel = supabase
      .channel('dashboard-trades')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'trades', filter: `user_id=eq.${userId}` },
        (payload: any) => {
          const newRow = payload.new;
          if (newRow?.status === 'closed' && (newRow?.result === 'win' || newRow?.result === 'loss')) {
            const profitVal = newRow.profit_loss ?? newRow.profit ?? 0;
            setTradeResultPopup({
              asset_symbol: newRow.asset_symbol ?? '',
              order_type: newRow.order_type as 'buy' | 'sell',
              amount: newRow.amount ?? 0,
              result: newRow.result as 'win' | 'loss',
              profit_loss: Math.abs(profitVal),
            });
          }
          fetchOpenTrades();
          fetchTradeHistory();
          fetchWallet();
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'trades', filter: `user_id=eq.${userId}` },
        () => {
          fetchOpenTrades();
          fetchTradeHistory();
          fetchWallet();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(walletChannel);
      supabase.removeChannel(tradesChannel);
    };
  }, [authChecked, userId, fetchWallet, fetchOpenTrades, fetchTradeHistory]);

  // ── Fetch history when History tab is opened ────────────────────────────────

  useEffect(() => {
    if (activeNav === 'history' && authChecked) {
      fetchTradeHistory();
    }
  }, [activeNav, authChecked, fetchTradeHistory]);

  // ── Countdown expiry handler ────────────────────────────────────────────────

  const handleTradeExpired = useCallback(() => {
    fetchOpenTrades();
    fetchTradeHistory();
    fetchWallet();
  }, [fetchOpenTrades, fetchTradeHistory, fetchWallet]);

  // ── Auto-refresh open trades every 2 seconds ────────────────────────────────

  useEffect(() => {
    if (!authChecked) return;
    const interval = setInterval(() => {
      fetchOpenTrades();
    }, 2000);
    return () => clearInterval(interval);
  }, [authChecked, fetchOpenTrades]);

  // ── Trade Actions ───────────────────────────────────────────────────────────

  const handleTrade = async (orderType: 'buy' | 'sell') => {
    const setLoading = orderType === 'buy' ? setBuyLoading : setSellLoading;
    setLoading(true);
    try {
      // 1. Fetch asset_id (uuid) from assets table
      const { data: assetData, error: assetError } = await supabase
        .from('assets')
        .select('id')
        .eq('symbol', selectedAsset.symbol)
        .maybeSingle();
      if (assetError || !assetData) throw new Error('Asset not found: ' + (assetError?.message ?? 'symbol not in database'));
      const assetId = assetData.id;

      // 2. Fetch latest entry_price from market_prices
      const { data: priceData, error: priceError } = await supabase
        .from('market_prices')
        .select('price')
        .eq('asset_id', assetId)
        .order('timestamp', { ascending: false })
        .limit(1)
        .single();
      if (priceError || !priceData) throw new Error('Price not found: ' + (priceError?.message ?? ''));
      const entryPrice = priceData.price;

      // 3. Call open_trade RPC — p_user_id not needed, DB reads from auth.uid()
      const { error } = await supabase.rpc('open_trade', {
        p_asset_id: assetId,
        p_amount: amount,
        p_order_type: orderType,
        p_duration_seconds: selectedDuration.seconds,
        p_entry_price: entryPrice,
        p_is_demo: isDemo,
      });
      if (error) throw error;
      setToast({ message: `${orderType.toUpperCase()} trade opened successfully!`, type: 'success' });
      fetchOpenTrades();
      fetchWallet();
    } catch (err: any) {
      setToast({ message: err?.message ?? 'Failed to open trade. Please try again.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // ── Stats ───────────────────────────────────────────────────────────────────

  const totalTrades = tradeHistory.length;
  const wins = tradeHistory.filter((t) => t.result === 'win').length;
  const winRate = totalTrades > 0 ? ((wins / totalTrades) * 100).toFixed(1) : '0.0';
  const totalProfit = tradeHistory.reduce((sum, t) => sum + (t.profit_loss ?? 0), 0);
  const openPositions = openTrades.length;

  // Duration index helpers
  const durationIndex = DURATIONS.findIndex((d) => d.seconds === selectedDuration.seconds);
  const decrementDuration = () => {
    if (durationIndex > 0) setSelectedDuration(DURATIONS[durationIndex - 1]);
  };
  const incrementDuration = () => {
    if (durationIndex < DURATIONS.length - 1) setSelectedDuration(DURATIONS[durationIndex + 1]);
  };

  // ── Render Guard ────────────────────────────────────────────────────────────

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-black text-white pb-16" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* 1. DASHBOARD TOP BAR — logo, balance, avatar only */}
      <DashboardTopBar
        wallet={wallet}
        walletLoading={walletLoading}
        isDemo={isDemo}
        userEmail={userEmail}
      />

      {/* 2. STATS BAR — wallet display, demo/real switch, deposit button */}
      <div className="border-b border-white/10 bg-[#0a0a0a]">
        <div className="px-4 py-3">
          {/* Wallet balances row */}
          <div className="flex items-center gap-3 mb-3 overflow-x-auto">
            <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-2 min-w-fit">
              <span className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" />
              <div>
                <div className="text-[10px] text-blue-400 font-medium uppercase tracking-wider leading-none mb-0.5">Demo</div>
                <div className="text-sm font-bold text-white leading-none">
                  {walletLoading ? '…' : `$${formatCurrency(wallet?.demoBalance ?? 0)}`}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-lg px-3 py-2 min-w-fit">
              <span className="w-2 h-2 rounded-full bg-orange-400 flex-shrink-0" />
              <div>
                <div className="text-[10px] text-orange-400 font-medium uppercase tracking-wider leading-none mb-0.5">Real</div>
                <div className="text-sm font-bold text-white leading-none">
                  {walletLoading ? '…' : `$${formatCurrency(wallet?.realBalance ?? 0)}`}
                </div>
              </div>
            </div>
            {/* Demo/Real toggle */}
            <div className="flex rounded-md overflow-hidden border border-white/20 ml-auto flex-shrink-0">
              <button
                onClick={() => setIsDemo(true)}
                className={`px-3 py-1.5 text-xs font-medium transition-all ${
                  isDemo ? 'bg-blue-600 text-white' : 'bg-transparent text-slate-400 hover:text-white hover:bg-white/10'
                }`}
              >
                Demo
              </button>
              <button
                onClick={() => setIsDemo(false)}
                className={`px-3 py-1.5 text-xs font-medium transition-all ${
                  !isDemo ? 'bg-orange-600 text-white' : 'bg-transparent text-slate-400 hover:text-white hover:bg-white/10'
                }`}
              >
                Real
              </button>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'Trades', value: totalTrades.toString() },
              { label: 'Win Rate', value: `${winRate}%` },
              {
                label: 'Profit',
                value: `${totalProfit >= 0 ? '+' : ''}$${formatCurrency(totalProfit)}`,
                color: totalProfit >= 0 ? 'text-emerald-400' : 'text-red-400',
              },
              { label: 'Open', value: openPositions.toString(), color: 'text-blue-400' },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col gap-0.5">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider">{stat.label}</span>
                <span className={`text-sm font-semibold ${stat.color ?? 'text-white'}`}>{stat.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. CHART AREA — asset selector above, full-width chart */}
      <div className="bg-[#0d0d0d] border-b border-white/10">
        {/* Asset Selector */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 overflow-x-auto">
          {ASSETS.map((asset) => (
            <button
              key={asset.symbol}
              onClick={() => setSelectedAsset(asset)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                selectedAsset.symbol === asset.symbol
                  ? 'bg-blue-600 text-white' :'text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {asset.label}
            </button>
          ))}
        </div>
        {/* TradingView Chart — full width */}
        <div className="w-full">
          <TradingViewChart tvSymbol={selectedAsset.tv} />
        </div>
      </div>

      {/* 4. TRADING CONTROL BAR — duration (left) + amount (right) */}
      <div className="bg-[#111111] border-b border-white/10 px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* LEFT: Duration selector */}
          <div className="flex-1 flex flex-col gap-1">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">Duration</span>
            <div className="flex items-center gap-2">
              <button
                onClick={decrementDuration}
                disabled={durationIndex <= 0}
                className="w-9 h-9 rounded-md bg-white/10 hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-lg flex items-center justify-center transition-all"
              >
                −
              </button>
              <div className="flex-1 text-center bg-white/5 border border-white/20 rounded-md py-2 px-3 text-sm font-semibold text-white min-w-[60px]">
                {selectedDuration.label}
              </div>
              <button
                onClick={incrementDuration}
                disabled={durationIndex >= DURATIONS.length - 1}
                className="w-9 h-9 rounded-md bg-white/10 hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-lg flex items-center justify-center transition-all"
              >
                +
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="w-px h-12 bg-white/10 flex-shrink-0" />

          {/* RIGHT: Investment amount selector */}
          <div className="flex-1 flex flex-col gap-1">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">Amount</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAmount((v) => Math.max(1, v - 10))}
                className="w-9 h-9 rounded-md bg-white/10 hover:bg-white/20 text-white font-bold text-lg flex items-center justify-center transition-all"
              >
                −
              </button>
              <div className="flex-1 text-center bg-white/5 border border-white/20 rounded-md py-2 px-3 text-sm font-semibold text-white min-w-[60px]">
                ${amount}
              </div>
              <button
                onClick={() => setAmount((v) => Math.min(10000, v + 10))}
                className="w-9 h-9 rounded-md bg-white/10 hover:bg-white/20 text-white font-bold text-lg flex items-center justify-center transition-all"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 5. SELL / BUY BUTTONS */}
      <div className="flex gap-0 w-full">
        <button
          onClick={() => handleTrade('sell')}
          disabled={buyLoading || sellLoading}
          className="flex-1 py-6 bg-red-600 hover:bg-red-500 active:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-extrabold text-2xl tracking-widest transition-all flex items-center justify-center gap-3"
        >
          {sellLoading ? (
            <span className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
              SELL
            </>
          )}
        </button>
        <button
          onClick={() => handleTrade('buy')}
          disabled={buyLoading || sellLoading}
          className="flex-1 py-6 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-extrabold text-2xl tracking-widest transition-all flex items-center justify-center gap-3"
        >
          {buyLoading ? (
            <span className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
              </svg>
              BUY
            </>
          )}
        </button>
      </div>

      {/* OPEN TRADES PANEL — shown on Trade tab, below BUY/SELL buttons */}
      {activeNav === 'trade' && (
        <div className="px-4 pt-4 pb-2">
          <div className="bg-[#0d0d0d] border border-white/10 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Open Trades</h3>
              </div>
              <span className="text-xs text-slate-500">{openTrades.length} open</span>
            </div>
            {tradesLoading && openTrades.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <span className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : openTrades.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">No open trades</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-slate-500 border-b border-white/5">
                      <th className="px-4 py-2.5 text-left font-medium">Asset</th>
                      <th className="px-4 py-2.5 text-left font-medium">Type</th>
                      <th className="px-4 py-2.5 text-left font-medium">Amount</th>
                      <th className="px-4 py-2.5 text-left font-medium">Entry</th>
                      <th className="px-4 py-2.5 text-left font-medium">Opened</th>
                      <th className="px-4 py-2.5 text-left font-medium">Duration</th>
                      <th className="px-4 py-2.5 text-left font-medium">Remaining</th>
                    </tr>
                  </thead>
                  <tbody>
                    {openTrades.map((trade) => (
                      <tr key={trade.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3 font-semibold text-white whitespace-nowrap">
                          {trade.asset_symbol}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                            trade.order_type === 'buy' ?'bg-emerald-500/20 text-emerald-400' :'bg-red-500/20 text-red-400'
                          }`}>
                            {trade.order_type.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-300">${formatCurrency(trade.amount)}</td>
                        <td className="px-4 py-3 text-slate-300">${trade.entry_price.toFixed(2)}</td>
                        <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                          {new Date(trade.opened_at).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </td>
                        <td className="px-4 py-3 text-slate-400">
                          {DURATIONS.find((d) => d.seconds === trade.duration_seconds)?.label ??
                            (trade.duration_seconds < 60
                              ? `${trade.duration_seconds}s`
                              : trade.duration_seconds < 3600
                              ? `${Math.floor(trade.duration_seconds / 60)}m`
                              : `${Math.floor(trade.duration_seconds / 3600)}h`)}
                        </td>
                        <td className="px-4 py-3 text-slate-500 italic text-xs">
                          <CountdownCell
                            openedAt={trade.opened_at}
                            durationSeconds={trade.duration_seconds}
                            onExpired={handleTradeExpired}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECONDARY CONTENT — shown based on active nav tab */}

      {/* ACTIVE TRADES — shown on Trade tab */}
      {activeNav === 'trade' && (
        <div className="px-4 py-4">
          <div className="bg-[#0d0d0d] border border-white/10 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Active Trades</h3>
              <span className="text-xs text-slate-500">{openTrades.length} active</span>
            </div>
            <div className="overflow-x-auto">
              {tradesLoading ? (
                <div className="flex items-center justify-center py-10">
                  <span className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : openTrades.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-sm">No active trades</div>
              ) : (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-slate-500 border-b border-white/5">
                      {['Asset', 'Direction', 'Amount', 'Entry Price', 'Duration', 'Time Left', 'Type'].map((h) => (
                        <th key={h} className="px-4 py-2.5 text-left font-medium whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {openTrades.map((trade) => (
                      <tr key={trade.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3 font-medium text-white">{trade.asset_symbol}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${trade.order_type === 'buy' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                            {trade.order_type.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-300">${formatCurrency(trade.amount)}</td>
                        <td className="px-4 py-3 text-slate-300">${formatCurrency(trade.entry_price)}</td>
                        <td className="px-4 py-3 text-slate-400">
                          {DURATIONS.find((d) => d.seconds === trade.duration_seconds)?.label ?? `${trade.duration_seconds}s`}
                        </td>
                        <td className="px-4 py-3">
                          <CountdownCell
                            openedAt={trade.opened_at}
                            durationSeconds={trade.duration_seconds}
                            onExpired={handleTradeExpired}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs ${trade.is_demo ? 'text-blue-400' : 'text-orange-400'}`}>
                            {trade.is_demo ? 'Demo' : 'Real'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TRADE HISTORY — shown on History tab */}
      {activeNav === 'history' && (
        <div className="px-4 py-4">
          <div className="bg-[#0d0d0d] border border-white/10 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Trade History</h3>
              <span className="text-xs text-slate-500">{tradeHistory.length} trades</span>
            </div>
            <div className="overflow-x-auto overflow-y-auto max-h-[400px]">
              {historyLoading ? (
                <div className="flex items-center justify-center py-10">
                  <span className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : tradeHistory.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-sm">No trade history yet</div>
              ) : (
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-[#0d0d0d]">
                    <tr className="text-slate-500 border-b border-white/5">
                      {['Asset', 'Dir', 'Amount', 'Entry', 'Exit', 'P/L', 'Result', 'Date'].map((h) => (
                        <th key={h} className="px-3 py-3 text-left font-medium whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tradeHistory.map((trade) => (
                      <tr key={trade.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="px-3 py-2.5 font-medium text-white whitespace-nowrap">{trade.asset_symbol}</td>
                        <td className="px-3 py-2.5">
                          <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${trade.order_type === 'buy' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                            {trade.order_type.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-slate-300">${formatCurrency(trade.amount)}</td>
                        <td className="px-3 py-2.5 text-slate-400">${formatCurrency(trade.entry_price)}</td>
                        <td className="px-3 py-2.5 text-slate-400">
                          {trade.exit_price != null ? `$${formatCurrency(trade.exit_price)}` : '—'}
                        </td>
                        <td className={`px-3 py-2.5 font-semibold ${(trade.profit_loss ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {trade.profit_loss != null
                            ? `${trade.profit_loss >= 0 ? '+' : ''}$${formatCurrency(trade.profit_loss)}`
                            : '—'}
                        </td>
                        <td className="px-3 py-2.5">
                          {trade.result ? (
                            <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${trade.result === 'win' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                              {trade.result.toUpperCase()}
                            </span>
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-slate-500 whitespace-nowrap">
                          {trade.closed_at
                            ? new Date(trade.closed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                            : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {activeNav === 'copytrade' && (
        <div className="px-4 py-10 text-center text-slate-500 text-sm">
          Copy Trade feature coming soon.
        </div>
      )}

      {activeNav === 'account' && (
        <div className="px-4 py-4">
          <div className="bg-[#0d0d0d] border border-white/10 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Account</h3>
            <div className="flex flex-col gap-3">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-blue-400" />
                  <span className="text-xs text-blue-400 font-medium uppercase tracking-wider">Demo Balance</span>
                </div>
                <div className="text-2xl font-bold text-white">${formatCurrency(wallet?.demoBalance ?? 0)}</div>
                <div className="text-xs text-slate-500 mt-0.5">USD</div>
              </div>
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-orange-400" />
                  <span className="text-xs text-orange-400 font-medium uppercase tracking-wider">Real Balance</span>
                </div>
                <div className="text-2xl font-bold text-white">${formatCurrency(wallet?.realBalance ?? 0)}</div>
                <div className="text-xs text-slate-500 mt-0.5">USD</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. FIXED BOTTOM NAVIGATION */}
      <BottomNav active={activeNav} onChange={setActiveNav} />

      {/* Toast */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      {/* Trade Result Popup */}
      {tradeResultPopup && (
        <TradeResultPopup
          trade={tradeResultPopup}
          onClose={() => setTradeResultPopup(null)}
        />
      )}
    </div>
  );
}
