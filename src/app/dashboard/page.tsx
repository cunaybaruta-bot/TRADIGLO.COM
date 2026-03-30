'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';

import { createClient } from '@/lib/supabase/client';
import LightweightChart, { type LightweightChartHandle } from '@/components/LightweightChart';
import AssetSelectorModal from '@/components/AssetSelectorModal';
import DashboardTopBar from '@/components/dashboard/DashboardTopBar';
import DepositModal from '@/components/dashboard/DepositModal';

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

interface AssetItem {
  id: string;
  symbol: string;
  name: string;
  category: string;
}

interface CopyTradeProvider {
  id: string;
  name: string;
  description: string | null;
  win_rate: number;
  activity_score: number;
  probability_score: number;
  reliability_score: number;
  popularity_score: number;
  experience_score: number;
  min_balance_usd: number;
  is_active: boolean;
}

interface CopyTradeFollower {
  id: string;
  provider_id: string;
  user_id: string;
  followed_at: string;
  stopped_at: string | null;
  is_active: boolean;
  allocated_balance: number;
}

interface CopyTradeResult {
  id: string;
  copy_trade_id: string;
  amount: number;
  profit_loss: number;
  status: 'pending' | 'won' | 'lost' | 'refunded';
  created_at: string;
  copy_trades?: {
    asset_symbol: string;
    direction: string;
    opened_at: string;
    closed_at: string | null;
    status: string;
  };
}

// ─── Duration Steps ───────────────────────────────────────────────────────────

const DURATION_STEPS = [5, 10, 15, 20, 30, 45, 60, 120, 300, 600, 900, 1800, 3600, 7200, 14400, 28800, 43200, 86400, 172800, 259200, 432000, 604800, 1209600, 2592000];

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
  if (seconds < 2592000) return `${Math.floor(seconds / 604800)}w`;
  return `${Math.floor(seconds / 2592000)}mo`;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatPrice(price: number): string {
  if (price >= 1000) return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (price >= 1) return price.toFixed(4);
  return price.toFixed(6);
}

function getTimeRemaining(openedAt: string, durationSeconds: number): number {
  const openedMs = new Date(openedAt).getTime();
  const expiresMs = openedMs + durationSeconds * 1000;
  return Math.max(0, Math.floor((expiresMs - Date.now()) / 1000));
}

function formatTimeRemaining(seconds: number): string {
  if (seconds <= 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (seconds < 60) return `${String(secs).padStart(2, '0')}s`;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// ─── Asset Icon (for button) ──────────────────────────────────────────────────

function AssetButtonIcon({ symbol, category }: { symbol: string; category: string }) {
  const [imgError, setImgError] = useState(false);
  const isCrypto = ['crypto', 'cryptocurrency'].includes(category.toLowerCase());
  const iconSymbol = symbol.replace('USDT', '').replace('/USD', '').toLowerCase();

  if (isCrypto && !imgError) {
    return (
      <img
        src={`https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/32/color/${iconSymbol}.png`}
        alt={symbol}
        width={20}
        height={20}
        style={{ width: 20, height: 20, borderRadius: '50%', objectFit: 'cover' }}
        onError={() => setImgError(true)}
      />
    );
  }

  const colors: Record<string, string> = {
    forex: '#3b82f6', currency: '#3b82f6', currencies: '#3b82f6',
    stock: '#f59e0b', stocks: '#f59e0b', equity: '#f59e0b',
    commodity: '#10b981', commodities: '#10b981',
  };
  const bg = colors[category.toLowerCase()] ?? '#6366f1';
  const initials = symbol.replace('USDT', '').replace('/USD', '').slice(0, 2).toUpperCase();

  return (
    <div style={{
      width: 20, height: 20, borderRadius: '50%', background: bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 7, fontWeight: 700, color: '#fff', flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
  duration?: number;
}

function Toast({ message, type, onClose, duration = 4000 }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onClose, duration);
    return () => clearTimeout(t);
  }, [onClose, duration]);

  const borderColor =
    type === 'success' ? '#00c853' :
    type === 'error' ? '#ff3d57' : '#3b82f6';
  const textColor =
    type === 'success' ? '#00c853' :
    type === 'error' ? '#ff3d57' : '#60a5fa';

  return (
    <div style={{
      position: 'fixed', bottom: 80, right: 12, zIndex: 9998,
      background: '#111111', borderLeft: `3px solid ${borderColor}`,
      borderTop: `1px solid ${borderColor}20`, borderRight: `1px solid ${borderColor}20`, borderBottom: `1px solid ${borderColor}20`,
      borderRadius: 4, padding: '10px 14px', maxWidth: 280,
      display: 'flex', alignItems: 'center', gap: 10,
      boxShadow: '0 4px 24px rgba(0,0,0,0.6)',
    }}>
      {type === 'success' ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={borderColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><polyline points="20 6 9 17 4 12" /></svg>
      ) : type === 'error' ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={borderColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={borderColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
      )}
      <span style={{ color: '#e2e8f0', fontSize: 12, fontWeight: 500, flex: 1, lineHeight: 1.4 }}>{message}</span>
      <button onClick={onClose} style={{ color: '#475569', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 14, lineHeight: 1, flexShrink: 0 }}>✕</button>
    </div>
  );
}

// ─── Trade Open Notification ──────────────────────────────────────────────────

interface TradeOpenNotifProps {
  orderType: 'buy' | 'sell';
  amount: number;
  entryPrice: number;
  durationLabel: string;
  durationSeconds: number;
  openedAt: string;
  onClose: () => void;
}

function TradeOpenNotif({ orderType, amount, entryPrice, durationLabel, durationSeconds, openedAt, onClose }: TradeOpenNotifProps) {
  const [remaining, setRemaining] = useState(() => getTimeRemaining(openedAt, durationSeconds));
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const show = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(show);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const r = getTimeRemaining(openedAt, durationSeconds);
      setRemaining(r);
      if (r <= 0) {
        clearInterval(interval);
        setVisible(false);
        setTimeout(onClose, 300);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [openedAt, durationSeconds, onClose]);

  const isBuy = orderType === 'buy';
  const accentColor = isBuy ? '#00c853' : '#ff3d57';

  return (
    <div style={{
      position: 'fixed', top: 60, right: 12, zIndex: 9999, width: 200,
      background: '#111111', borderLeft: `3px solid ${accentColor}`,
      borderTop: `1px solid ${accentColor}15`, borderRight: `1px solid ${accentColor}15`, borderBottom: `1px solid ${accentColor}15`,
      borderRadius: 4, padding: '9px 11px',
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateX(0)' : 'translateX(110%)',
      transition: 'opacity 250ms ease, transform 280ms cubic-bezier(0.22, 1, 0.36, 1)',
      pointerEvents: 'none',
      boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ color: accentColor, fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          {isBuy ? '▲ BUY' : '▼ SELL'} OPENED
        </span>
        <span style={{
          color: remaining <= 10 ? '#ff3d57' : '#64748b',
          fontSize: 10, fontWeight: 700, fontVariantNumeric: 'tabular-nums',
        }}>
          {formatTimeRemaining(remaining)}
        </span>
      </div>
      <div style={{ color: '#475569', fontSize: 10, display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ color: '#64748b', fontFamily: 'monospace', fontWeight: 600 }}>${entryPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        <span style={{ color: '#334155' }}>·</span>
        <span style={{ color: '#64748b' }}>${amount}</span>
        <span style={{ margin: '0 5px', color: '#334155' }}>·</span>
        <span style={{ color: '#475569' }}>{durationLabel}</span>
      </div>
    </div>
  );
}

// ─── Countdown Cell ───────────────────────────────────────────────────────────

interface CountdownCellProps {
  tradeId: string;
  openedAt: string;
  durationSeconds: number;
  onExpired?: (tradeId: string) => void;
}

function CountdownCell({ tradeId, openedAt, durationSeconds, onExpired }: CountdownCellProps) {
  const [remaining, setRemaining] = useState(() => getTimeRemaining(openedAt, durationSeconds));
  const expiredRef = useRef(false);

  useEffect(() => {
    expiredRef.current = false;
    const interval = setInterval(() => {
      const r = getTimeRemaining(openedAt, durationSeconds);
      setRemaining(r);
      if (r === 0 && !expiredRef.current) {
        expiredRef.current = true;
        onExpired?.(tradeId);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [tradeId, openedAt, durationSeconds, onExpired]);

  const isUrgent = remaining > 0 && remaining <= 10;

  return (
    <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-bold tabular-nums min-w-[56px] ${
      isUrgent ? 'bg-red-500/20 text-red-300' : 'bg-blue-500/20 text-white'
    }`}>
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
  entry_price?: number;
  exit_price?: number;
}

function TradeResultPopup({ trade, onClose }: { trade: TradeResult; onClose: () => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const showTimer = setTimeout(() => setVisible(true), 30);
    const hideTimer = setTimeout(() => { setVisible(false); setTimeout(onClose, 400); }, 4000);
    return () => { clearTimeout(showTimer); clearTimeout(hideTimer); };
  }, [onClose]);

  const isWin = trade.result === 'win';
  const accentColor = isWin ? '#00c853' : '#ff3d57';
  const symbol = trade.asset_symbol.replace('USDT', '').replace('USD', '');
  const directionLabel = trade.order_type === 'buy' ? 'BUY ↑' : 'SELL ↓';
  const profitSign = isWin ? '+' : '-';
  const profitDisplay = `${profitSign}$${Math.abs(trade.profit_loss).toFixed(2)}`;

  return (
    <div style={{
      position: 'fixed', top: 60, right: 12, zIndex: 9999, width: 200,
      background: '#111111',
      borderLeft: `3px solid ${accentColor}`,
      borderTop: `1px solid ${accentColor}15`, borderRight: `1px solid ${accentColor}15`, borderBottom: `1px solid ${accentColor}15`,
      borderRadius: 4, padding: '9px 11px',
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateX(0)' : 'translateX(110%)',
      transition: 'opacity 250ms ease, transform 280ms cubic-bezier(0.22, 1, 0.36, 1)',
      pointerEvents: 'none',
      boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ color: accentColor, fontSize: 9, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          {isWin ? 'WIN' : 'LOSS'}
        </span>
        <span style={{ color: accentColor, fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1 }}>
          {profitDisplay}
        </span>
      </div>
      <div style={{ color: '#475569', fontSize: 10, display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ color: '#64748b', fontWeight: 600 }}>{symbol}</span>
        <span style={{ color: '#334155' }}>·</span>
        <span style={{ color: '#475569' }}>{directionLabel}</span>
      </div>
    </div>
  );
}

// ─── Trade Result Modal ───────────────────────────────────────────────────────

function TradeResultModal({ trade, onClose }: { trade: TradeResult; onClose: () => void }) {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(100);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const showTimer = setTimeout(() => setVisible(true), 30);

    const startTime = Date.now();
    const totalDuration = 5000;

    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / totalDuration) * 100);
      setProgress(remaining);
      if (remaining <= 0) {
        clearInterval(progressInterval);
        setVisible(false);
        setTimeout(() => onCloseRef.current(), 300);
      }
    }, 50);

    return () => { clearTimeout(showTimer); clearInterval(progressInterval); };
  }, []);

  const handleClose = () => { setVisible(false); setTimeout(() => onCloseRef.current(), 300); };
  const isWin = trade.result === 'win';
  const accentColor = isWin ? '#00c853' : '#ff3d57';
  const symbol = trade.asset_symbol.replace('USDT', '').replace('USD', '');
  const profitDisplay = `${isWin ? '+' : '-'}$${Math.abs(trade.profit_loss).toFixed(2)}`;
  const fmtPrice = (p?: number) => p != null ? `$${p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—';

  return (
    <div onClick={handleClose} style={{
      position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: visible ? 'rgba(0,0,0,0.82)' : 'rgba(0,0,0,0)',
      transition: 'background 200ms ease',
      backdropFilter: visible ? 'blur(3px)' : 'blur(0px)',
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: 'radial-gradient(ellipse at 50% 0%, rgba(13,13,13,1) 0%, #0d0d0d 100%)',
        border: `1px solid ${accentColor}30`,
        borderRadius: 12, width: 300, maxWidth: '90vw', textAlign: 'center',
        overflow: 'hidden',
        boxShadow: `0 0 60px ${accentColor}12, 0 24px 80px rgba(0,0,0,0.9)`,
        opacity: visible ? 1 : 0,
        transform: visible ? 'scale(1)' : 'scale(0.85)',
        transition: 'opacity 200ms ease-out, transform 200ms ease-out',
      }}>
        <div style={{ height: 2, background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)` }} />
        <div style={{ padding: '28px 24px 0' }}>
          <div style={{
            width: 60, height: 60, borderRadius: '50%',
            background: `${accentColor}12`,
            border: `1.5px solid ${accentColor}35`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 18px',
          }}>
            {isWin ? (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 0 0-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            ) : (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            )}
          </div>
          <div style={{ color: accentColor, fontSize: 11, fontWeight: 800, letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 6, opacity: 0.9 }}>
            {isWin ? 'WIN' : 'LOSS'}
          </div>
          <div style={{ color: accentColor, fontSize: 48, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1, marginBottom: 22 }}>
            {profitDisplay}
          </div>
          <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${accentColor}20, transparent)`, marginBottom: 16 }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 10, opacity: 0.6 }}>
            <span style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 600 }}>{symbol}</span>
            <span style={{
              color: trade.order_type === 'buy' ? '#00c853' : '#ff3d57',
              fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
              background: trade.order_type === 'buy' ? '#00c85312' : '#ff3d5712',
              padding: '2px 7px', borderRadius: 3,
            }}>
              {trade.order_type === 'buy' ? 'BUY ↑' : 'SELL ↓'}
            </span>
          </div>
          {(trade.entry_price != null || trade.exit_price != null) && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 20, fontFamily: 'monospace', fontSize: 11, color: '#475569' }}>
              <span style={{ color: '#64748b' }}>{fmtPrice(trade.entry_price)}</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 14.01 12 19" /></svg>
              <span style={{ color: '#64748b' }}>{fmtPrice(trade.exit_price)}</span>
            </div>
          )}
          <button onClick={handleClose} style={{
            width: '100%', padding: '13px 0', borderRadius: 8,
            border: 'none', background: accentColor,
            color: '#000000', fontSize: 13, fontWeight: 800,
            letterSpacing: '0.04em', cursor: 'pointer',
            textTransform: 'uppercase',
            marginBottom: 0,
          }}>
            {isWin ? 'Continue Trading' : 'Try Again'}
          </button>
        </div>
        <div style={{ height: 3, background: '#1a1a1a', marginTop: 16, position: 'relative', overflow: 'hidden' }}>
          <div style={{
            position: 'absolute', left: 0, top: 0, height: '100%',
            width: `${progress}%`,
            background: accentColor,
            opacity: 0.6,
            transition: 'width 50ms linear',
          }} />
        </div>
      </div>
    </div>
  );
}

// ─── Bottom Navigation ────────────────────────────────────────────────────────

type NavSection = 'trade' | 'history' | 'copytrade' | 'account' | 'referral';

function BottomNav({ active, onChange }: { active: NavSection; onChange: (s: NavSection) => void }) {
  const router = useRouter();
  const items: { id: NavSection; label: string; icon: React.ReactNode }[] = [
    { id: 'trade', label: 'Trade', icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        {/* Candle 1 - bearish */}
        <line x1="6" y1="3" x2="6" y2="6" />
        <rect x="4.5" y="6" width="3" height="5" rx="0.4" />
        <line x1="6" y1="11" x2="6" y2="14" />
        {/* Candle 2 - bullish */}
        <line x1="12" y1="5" x2="12" y2="8" />
        <rect x="10.5" y="8" width="3" height="7" rx="0.4" />
        <line x1="12" y1="15" x2="12" y2="18" />
        {/* Candle 3 - bearish */}
        <line x1="18" y1="7" x2="18" y2="10" />
        <rect x="16.5" y="10" width="3" height="5" rx="0.4" />
        <line x1="18" y1="15" x2="18" y2="19" />
      </svg>
    ) },
    { id: 'history', label: 'History', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><circle cx="12" cy="12" r="9" strokeLinecap="round" strokeLinejoin="round" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3.5 3.5" /></svg> },
    { id: 'copytrade', label: 'Copy Trade', icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M1.5 4v5h5" />
        <path d="M22.5 20v-5h-5" />
        <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1.5 9" />
        <path d="M3.51 15a9 9 0 0 0 14.85 3.36L22.5 15" />
      </svg>
    ) },
    { id: 'referral', label: 'Affiliate', icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ) },
    { id: 'account', label: 'Account', icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 100 120" stroke="currentColor" strokeWidth={4.5} strokeLinecap="round" strokeLinejoin="round">
        {/* Innermost loop - core of fingerprint */}
        <path d="M44 62 C44 55 56 55 56 62 C56 69 44 69 44 62" />
        {/* Ridge 2 */}
        <path d="M38 65 C37 52 44 44 50 44 C56 44 49 52 49 65 C49 74 41 78 33.5 79 C25 78 18 74 17 64" />
        {/* Ridge 3 */}
        <path d="M31 67 C30 48 38 36 50 36 C62 36 70 48 69 67 C68 80 61 88 50 90 C29 88 18 85 17 64" />
        {/* Ridge 4 */}
        <path d="M24 66 C23 43 34 28 50 28 C66 28 77 43 76 66 C75 83 66 94 50 97 C34 94 25 83 24 66" />
        {/* Ridge 5 */}
        <path d="M17 64 C16 38 30 20 50 20 C70 20 84 38 83 64 C82 85 71 88 50 90 C29 88 18 85 17 64" />
        {/* Ridge 6 - outer */}
        <path d="M10 61 C9 32 26 12 50 12 C74 12 91 32 90 61 C89 86 76 103 50 108" />
        {/* Ridge 7 - outermost top arcs */}
        <path d="M22 28 C28 16 38 9 50 8 C62 9 72 16 78 28" />
        <path d="M30 18 C36 11 43 7 50 6 C57 7 64 11 70 18" />
      </svg>
    ) },
  ];

  const handleClick = (id: NavSection) => {
    if (id === 'account') {
      router.push('/dashboard/account');
    } else if (id === 'history') {
      router.push('/dashboard/history');
    } else if (id === 'copytrade') {
      router.push('/dashboard/copytrade');
    } else if (id === 'referral') {
      router.push('/dashboard/referral');
    } else {
      onChange(id);
    }
  };

  return (
    <nav className="w-full bg-[#0a0a0a] border-t border-white/10 flex items-stretch" style={{ height: 56 }}>
      {items.map((item) => (
        <button key={item.id} onClick={() => handleClick(item.id)} className={`flex-1 flex flex-col items-center justify-center gap-1 transition-colors ${active === item.id ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'}`}>
          {item.icon}
          <span className="text-[10px] font-medium leading-none">{item.label}</span>
        </button>
      ))}
    </nav>
  );
}

// ─── Copy Trade Tab ───────────────────────────────────────────────────────────

function CopyTradeTab({ userId, wallet }: { userId: string; wallet: Wallet | null }) {
  const supabase = createClient();
  const [provider, setProvider] = useState<CopyTradeProvider | null>(null);
  const [follower, setFollower] = useState<CopyTradeFollower | null>(null);
  const [activeFollowersCount, setActiveFollowersCount] = useState(0);
  const [copyResults, setCopyResults] = useState<CopyTradeResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [providerRes, followerRes, followersCountRes, resultsRes] = await Promise.all([
        supabase.from('copy_trade_providers').select('*').eq('is_active', true).limit(1).single(),
        supabase.from('copy_trade_followers').select('*').eq('user_id', userId).order('followed_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('copy_trade_followers').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('copy_trade_results').select('*, copy_trades(asset_symbol, direction, opened_at, closed_at, status)').eq('user_id', userId).order('created_at', { ascending: false }).limit(20),
      ]);
      if (providerRes.data) setProvider(providerRes.data);
      setFollower(followerRes.data ?? null);
      setActiveFollowersCount(followersCountRes.count ?? 0);
      setCopyResults((resultsRes.data as any) ?? []);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleFollow = async () => {
    if (!provider) return;
    const realBalance = wallet?.realBalance ?? 0;
    if (realBalance < provider.min_balance_usd) {
      setToast({ message: `Insufficient balance. Minimum required: $${provider.min_balance_usd.toLocaleString()} USD`, type: 'error' });
      return;
    }
    setActionLoading(true);
    try {
      if (follower) {
        // Re-activate existing record
        const { error } = await supabase
          .from('copy_trade_followers')
          .update({ is_active: true, stopped_at: null, followed_at: new Date().toISOString(), allocated_balance: realBalance })
          .eq('id', follower.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('copy_trade_followers')
          .insert({ provider_id: provider.id, user_id: userId, is_active: true, allocated_balance: realBalance });
        if (error) throw error;
      }
      setToast({ message: 'Successfully following Tradiglo Copy Trade!', type: 'success' });
      await fetchData();
    } catch (err: any) {
      setToast({ message: err?.message ?? 'Failed to follow', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleStopFollow = async () => {
    if (!follower) return;
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('copy_trade_followers')
        .update({ is_active: false, stopped_at: new Date().toISOString() })
        .eq('id', follower.id);
      if (error) throw error;
      setToast({ message: 'Stopped following Copy Trade', type: 'info' });
      await fetchData();
    } catch (err: any) {
      setToast({ message: err?.message ?? 'Failed to stop', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const isFollowing = follower?.is_active === true;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <span className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!provider) {
    return <div className="px-4 py-10 text-center text-slate-500 text-sm">Copy Trade not available</div>;
  }

  const scores = [
    { label: 'Activity', value: provider.activity_score },
    { label: 'Probability', value: provider.probability_score },
    { label: 'Reliability', value: provider.reliability_score },
    { label: 'Popularity', value: provider.popularity_score },
    { label: 'Experience', value: provider.experience_score },
  ];

  return (
    <div className="px-3 py-3 space-y-3">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Provider Card */}
      <div className="bg-[#0d0d0d] border border-white/10 rounded-xl overflow-hidden">
        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b border-white/10">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                <span className="text-white font-black text-sm">IV</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-white font-bold text-sm">{provider.name}</span>
                  {isFollowing && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Following
                    </span>
                  )}
                </div>
                <div className="text-slate-500 text-xs mt-0.5">{provider.description ?? 'Official Tradiglo Copy Trade'}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-emerald-400 font-black text-xl">{provider.win_rate}%</div>
              <div className="text-slate-500 text-[10px]">Win Rate</div>
            </div>
          </div>

          {/* Guarantee Badge */}
          <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
            <svg className="w-4 h-4 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0-1.042-.133-2.052-.382-3.016z" /></svg>
            <span className="text-emerald-400 text-xs font-semibold">100% Balance Guarantee on Loss</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="px-4 py-3 border-b border-white/10">
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="text-center">
              <div className="text-white font-bold text-sm">{activeFollowersCount.toLocaleString()}</div>
              <div className="text-slate-500 text-[10px]">Active Followers</div>
            </div>
            <div className="text-center border-x border-white/10">
              <div className="text-white font-bold text-sm">${provider.min_balance_usd.toLocaleString()}</div>
              <div className="text-slate-500 text-[10px]">Min Balance</div>
            </div>
            <div className="text-center">
              <div className="text-emerald-400 font-bold text-sm">{provider.win_rate}%</div>
              <div className="text-slate-500 text-[10px]">Win Rate</div>
            </div>
          </div>

          {/* Score bars */}
          <div className="space-y-1.5">
            {scores.map((s) => (
              <div key={s.label} className="flex items-center gap-2">
                <span className="text-slate-500 text-[10px] w-16 flex-shrink-0">{s.label}</span>
                <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 rounded-full" style={{ width: `${(s.value / 10) * 100}%` }} />
                </div>
                <span className="text-white text-[10px] font-bold w-8 text-right">{s.value}/10</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-4 py-3">
          {isFollowing ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 px-3 py-2 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <svg className="w-4 h-4 text-blue-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span className="text-blue-400 text-xs">You are currently copying Tradiglo trades</span>
              </div>
              <button
                onClick={handleStopFollow}
                disabled={actionLoading}
                className="w-full py-2.5 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-400 text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? (
                  <span className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin inline-block" />
                ) : 'Stop Follow'}
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2 px-3 py-2 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <svg className="w-4 h-4 text-blue-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span className="text-blue-400 text-xs">Ready to copy Tradiglo trades?</span>
              </div>
              <button
                onClick={handleFollow}
                disabled={actionLoading || (wallet?.realBalance ?? 0) < provider.min_balance_usd}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
                ) : 'Follow Tradiglo'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Copy Trade History */}
      <div className="bg-[#0d0d0d] border border-white/10 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-white/10">
          <h3 className="text-xs font-semibold text-white uppercase tracking-wider">Copy Trade History</h3>
        </div>
        {copyResults.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs">No copy trade history yet</div>
        ) : (
          <div className="divide-y divide-white/5">
            {copyResults.map((r) => (
              <div key={r.id} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-white text-xs font-semibold">{r.copy_trades?.asset_symbol ?? '—'}</span>
                    {r.copy_trades?.direction && (
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${r.copy_trades.direction === 'BUY' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                        {r.copy_trades.direction}
                      </span>
                    )}
                  </div>
                  <div className="text-slate-500 text-[10px] mt-0.5">
                    {r.created_at ? new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-bold ${r.status === 'won' ? 'text-emerald-400' : r.status === 'lost' ? 'text-red-400' : r.status === 'refunded' ? 'text-yellow-400' : 'text-slate-400'}`}>
                    {r.status === 'won' ? `+$${formatCurrency(r.profit_loss)}` : r.status === 'lost' ? `-$${formatCurrency(r.amount)}` : r.status === 'refunded' ? 'Refunded' : 'Pending'}
                  </div>
                  <div className="text-slate-500 text-[10px]">${formatCurrency(r.amount)} invested</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

const supabase = createClient();

export default function DashboardPage() {
  const router = useRouter();

  const [authChecked, setAuthChecked] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [openTrades, setOpenTrades] = useState<Trade[]>([]);
  const [tradeHistory, setTradeHistory] = useState<Trade[]>([]);
  const [totalTradesCount, setTotalTradesCount] = useState(0);
  const [fadingTradeIds, setFadingTradeIds] = useState<Set<string>>(new Set());

  const [walletLoading, setWalletLoading] = useState(true);
  const [tradesLoading, setTradesLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyLoadingMore, setHistoryLoadingMore] = useState(false);
  const [historyPage, setHistoryPage] = useState(0);
  const [historyHasMore, setHistoryHasMore] = useState(true);
  const HISTORY_PAGE_SIZE = 50;

  const [assets, setAssets] = useState<AssetItem[]>([]);
  const [assetsLoading, setAssetsLoading] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState<AssetItem | null>(null);

  const [amount, setAmount] = useState<number>(10);
  const [amountInput, setAmountInput] = useState<string>('10');

  const [durationIndex, setDurationIndex] = useState<number>(6);

  const [livePrice, setLivePrice] = useState<number | null>(null);
  const [priceChange, setPriceChange] = useState<number>(0);
  const [priceChangePct, setPriceChangePct] = useState<number>(0);

  const [isDemo, setIsDemo] = useState(true);
  const [buyLoading, setBuyLoading] = useState(false);
  const [sellLoading, setSellLoading] = useState(false);

  const [activeNav, setActiveNav] = useState<NavSection>('trade');

  // ── Copy Trade state ────────────────────────────────────────────────────────
  const [isFollowingCopyTrade, setIsFollowingCopyTrade] = useState(false);

  // ── Asset Selector Modal state ──────────────────────────────────────────────
  const [assetModalOpen, setAssetModalOpen] = useState(false);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [tradeResultPopup, setTradeResultPopup] = useState<TradeResult | null>(null);
  const lastPopupTradeIdRef = useRef<string | null>(null);

  // ── Close trade state ───────────────────────────────────────────────────────
  const [closingTradeIds, setClosingTradeIds] = useState<Set<string>>(new Set());
  const [closeAllLoading, setCloseAllLoading] = useState(false);
  const [showCloseAllConfirm, setShowCloseAllConfirm] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);

  interface TradeOpenNotifData {
    id: string;
    tradeId?: string;
    orderType: 'buy' | 'sell';
    amount: number;
    entryPrice: number;
    durationLabel: string;
    durationSeconds: number;
    openedAt: string;
  }
  const [tradeOpenNotif, setTradeOpenNotif] = useState<TradeOpenNotifData | null>(null);

  const chartRef = useRef<LightweightChartHandle>(null);
  const [isChartReady, setIsChartReady] = useState(false);

  // ── Auth Check ──────────────────────────────────────────────────────────────

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace('/login');
      } else {
        const uid = data.session.user.id;
        setUserId(uid);
        setUserEmail(data.session.user.email ?? '');
        setAuthChecked(true);
        // Fetch avatar_url from users table
        supabase.from('users').select('avatar_url').eq('id', uid).single().then(({ data: profile }) => {
          if (profile?.avatar_url) setAvatarUrl(profile.avatar_url);
        });
      }
    });
  }, []);

  // ── Check copy trade following status ──────────────────────────────────────
  useEffect(() => {
    if (!userId) return;
    const checkFollowing = async () => {
      const { data } = await supabase
        .from('copy_trade_followers')
        .select('id, is_active')
        .eq('user_id', userId)
        .eq('is_active', true)
        .maybeSingle();
      setIsFollowingCopyTrade(!!data);
    };
    checkFollowing();
    // Subscribe to changes
    const channel = supabase
      .channel('copy-trade-follow-status')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'copy_trade_followers', filter: `user_id=eq.${userId}` }, () => {
        checkFollowing();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  // ── Fetch assets from Supabase ──────────────────────────────────────────────

  useEffect(() => {
    const fetchAssets = async () => {
      setAssetsLoading(true);
      try {
        const { data, error } = await supabase
          .from('assets')
          .select('id, symbol, name, category_id, asset_categories(name)')
          .eq('is_active', true)
          .order('name');

        if (!error && data) {
          const mapped: AssetItem[] = data.map((a: any) => ({
            id: a.id,
            symbol: a.symbol,
            name: a.name,
            category: a.asset_categories?.name ?? 'crypto',
          }));
          setAssets(mapped);
          if (mapped.length > 0 && !selectedAsset) {
            const btc = mapped.find((a) => a.symbol === 'BTC' && a.category === 'crypto');
            const firstCrypto = mapped.find((a) => a.category === 'crypto');
            setSelectedAsset(btc ?? firstCrypto ?? mapped[0]);
          }
        }
      } catch {
        // silent
      } finally {
        setAssetsLoading(false);
      }
    };
    fetchAssets();
  }, []);

  // ── Data Fetchers ───────────────────────────────────────────────────────────

  const fetchWallet = useCallback(async () => {
    setWalletLoading(true);
    try {
      const currentUser = (await supabase.auth.getUser()).data.user;
      if (!currentUser) return;
      const { data: wallets } = await supabase.from('wallets').select('*').eq('user_id', currentUser.id);
      if (wallets && wallets.length > 0) {
        const demoWallet = wallets.find((w: any) => w.is_demo === true);
        const realWallet = wallets.find((w: any) => w.is_demo === false);
        setWallet({ demoBalance: demoWallet?.balance ?? 0, realBalance: realWallet?.balance ?? 0 });
      } else {
        setWallet({ demoBalance: 0, realBalance: 0 });
      }
    } catch {
      setWallet({ demoBalance: 0, realBalance: 0 });
    } finally {
      setWalletLoading(false);
    }
  }, []);

  const fetchOpenTrades = useCallback(async () => {
    setTradesLoading(true);
    try {
      const currentUser = (await supabase.auth.getUser()).data.user;
      if (!currentUser) return;
      let data: any[] | null = null;
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_open_trades');
      if (!rpcError && rpcData) {
        data = rpcData;
      } else {
        const { data: directData, error: directError } = await supabase
          .from('trades').select('*, assets(symbol)')
          .eq('user_id', currentUser.id).eq('status', 'open')
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
    setHistoryPage(0);
    setHistoryHasMore(true);
    try {
      const currentUser = (await supabase.auth.getUser()).data.user;
      if (!currentUser) return;
      let data: any[] | null = null;
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_trade_history');
      if (!rpcError && rpcData) {
        data = rpcData;
        setHistoryHasMore(false);
        setTotalTradesCount(rpcData.length);
      } else {
        // Fetch paginated records
        const { data: directData, error: directError } = await supabase
          .from('trades').select('*, assets(symbol)')
          .eq('user_id', currentUser.id).eq('status', 'closed')
          .order('closed_at', { ascending: false }).range(0, HISTORY_PAGE_SIZE - 1);
        if (!directError) {
          data = directData;
          setHistoryHasMore((directData?.length ?? 0) === HISTORY_PAGE_SIZE);
        }
        // Fetch real total count separately
        const { count } = await supabase
          .from('trades')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', currentUser.id)
          .eq('status', 'closed');
        setTotalTradesCount(count ?? 0);
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

  const loadMoreTradeHistory = useCallback(async () => {
    setHistoryLoadingMore(true);
    try {
      const currentUser = (await supabase.auth.getUser()).data.user;
      if (!currentUser) return;
      const nextPage = historyPage + 1;
      const from = nextPage * HISTORY_PAGE_SIZE;
      const to = from + HISTORY_PAGE_SIZE - 1;
      const { data: directData, error: directError } = await supabase
        .from('trades').select('*, assets(symbol)')
        .eq('user_id', currentUser.id).eq('status', 'closed')
        .order('closed_at', { ascending: false }).range(from, to);
      if (!directError && directData) {
        const mapped = directData.map((t: any) => ({
          ...t,
          asset_symbol: t.asset_symbol ?? t.assets?.symbol ?? '',
          profit_loss: t.profit ?? t.profit_loss ?? null,
          result: t.result ?? (t.profit != null ? (t.profit >= 0 ? 'win' : 'loss') : null),
        }));
        setTradeHistory((prev) => [...prev, ...(mapped as Trade[])]);
        setHistoryPage(nextPage);
        setHistoryHasMore(directData.length === HISTORY_PAGE_SIZE);
      }
    } catch {
      // silent
    } finally {
      setHistoryLoadingMore(false);
    }
  }, [historyPage]);

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

    const walletChannel = supabase.channel('dashboard-wallets')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wallets', filter: `user_id=eq.${userId}` }, () => fetchWallet())
      .subscribe();

    const tradesChannel = supabase.channel('dashboard-trades')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'trades', filter: `user_id=eq.${userId}` }, (payload: any) => {
        const newRow = payload.new;
        if (newRow?.status === 'closed' && (newRow?.result === 'win' || newRow?.result === 'loss')) {
          if (lastPopupTradeIdRef.current !== newRow.id) {
            lastPopupTradeIdRef.current = newRow.id;
            const profitVal = newRow.profit ?? newRow.profit_loss ?? 0;
            const knownTrade = openTrades.find((t) => t.id === newRow.id);
            setTradeResultPopup({
              asset_symbol: knownTrade?.asset_symbol ?? newRow.asset_symbol ?? '',
              order_type: newRow.order_type as 'buy' | 'sell',
              amount: newRow.amount ?? 0,
              result: newRow.result as 'win' | 'loss',
              profit_loss: Math.abs(profitVal),
              entry_price: newRow.entry_price ?? undefined,
              exit_price: newRow.exit_price ?? undefined,
            });
          }
        }
        fetchOpenTrades(); fetchTradeHistory(); fetchWallet();
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'trades', filter: `user_id=eq.${userId}` }, () => {
        fetchOpenTrades(); fetchTradeHistory(); fetchWallet();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(walletChannel);
      supabase.removeChannel(tradesChannel);
    };
  }, [authChecked, userId, fetchWallet, fetchOpenTrades, fetchTradeHistory]);

  useEffect(() => {
    if (activeNav === 'history' && authChecked) fetchTradeHistory();
  }, [activeNav, authChecked, fetchTradeHistory]);

  const handleTradeExpired = useCallback(async () => {
    await supabase.rpc('settle_expired_trades');
    await new Promise((resolve) => setTimeout(resolve, 200));
    try {
      const currentUser = (await supabase.auth.getUser()).data.user;
      if (currentUser) {
        const since = new Date(Date.now() - 15000).toISOString();
        const { data: recentlyClosed } = await supabase
          .from('trades').select('*, assets(symbol)')
          .eq('user_id', currentUser.id).eq('status', 'closed')
          .gte('closed_at', since).order('closed_at', { ascending: false }).limit(5);
        if (recentlyClosed && recentlyClosed.length > 0) {
          const latest = recentlyClosed[0];
          if (lastPopupTradeIdRef.current !== latest.id) {
            lastPopupTradeIdRef.current = latest.id;
            const profitVal = latest.profit ?? latest.profit_loss ?? 0;
            setTradeResultPopup({
              asset_symbol: latest.asset_symbol ?? latest.assets?.symbol ?? '',
              order_type: latest.order_type as 'buy' | 'sell',
              amount: latest.amount ?? 0,
              result: latest.result as 'win' | 'loss',
              profit_loss: Math.abs(profitVal),
              entry_price: latest.entry_price ?? undefined,
              exit_price: latest.exit_price ?? undefined,
            });
          }
        }
      }
    } catch {}
    fetchOpenTrades(); fetchTradeHistory(); fetchWallet();
  }, [fetchOpenTrades, fetchTradeHistory, fetchWallet]);

  useEffect(() => {
    if (!authChecked) return;
    const interval = setInterval(() => fetchOpenTrades(), 2000);
    return () => clearInterval(interval);
  }, [authChecked, fetchOpenTrades]);

  const handleTradeRowExpired = useCallback((tradeId: string) => {
    setFadingTradeIds((prev) => new Set([...prev, tradeId]));
    setTimeout(() => {
      handleTradeExpired();
      setFadingTradeIds((prev) => {
        const next = new Set(prev);
        next.delete(tradeId);
        return next;
      });
    }, 300);
  }, [handleTradeExpired]);

  // ── Amount handlers ─────────────────────────────────────────────────────────

  const handleAmountDecrement = () => {
    const newVal = Math.max(1, amount - 1);
    setAmount(newVal);
    setAmountInput(String(newVal));
  };

  const handleAmountIncrement = () => {
    const newVal = Math.min(10000, amount + 1);
    setAmount(newVal);
    setAmountInput(String(newVal));
  };

  const handleAmountInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    setAmountInput(raw);
  };

  const handleAmountInputBlur = () => {
    const parsed = parseInt(amountInput, 10);
    if (isNaN(parsed) || parsed < 1) {
      setAmount(1);
      setAmountInput('1');
    } else if (parsed > 10000) {
      setAmount(10000);
      setAmountInput('10000');
    } else {
      setAmount(parsed);
      setAmountInput(String(parsed));
    }
  };

  // ── Duration handlers ───────────────────────────────────────────────────────

  const decrementDuration = () => { if (durationIndex > 0) setDurationIndex((i) => i - 1); };
  const incrementDuration = () => { if (durationIndex < DURATION_STEPS.length - 1) setDurationIndex((i) => i + 1); };
  const currentDurationSeconds = DURATION_STEPS[durationIndex];
  const currentDurationLabel = formatDuration(currentDurationSeconds);

  // ── Close single trade ──────────────────────────────────────────────────────

  const handleCloseTrade = useCallback(async (trade: Trade) => {
    if (closingTradeIds.has(trade.id)) return;
    const chartPrice = chartRef.current?.getCurrentPrice() ?? null;
    if (!chartPrice) {
      setToast({ message: 'Chart not ready, please wait', type: 'error' });
      return;
    }
    setClosingTradeIds((prev) => new Set([...prev, trade.id]));
    try {
      const { error } = await supabase.rpc('settle_trade', {
        p_trade_id: trade.id,
        p_exit_price: chartPrice,
      });
      if (error) throw error;

      // Dismiss matching "BUY/SELL OPENED" notification
      setTradeOpenNotif((prev) => {
        if (prev && (prev.id === trade.id || prev.tradeId === trade.id)) return null;
        return prev;
      });

      // Calculate WIN/LOSS and show modal
      if (lastPopupTradeIdRef.current !== trade.id) {
        lastPopupTradeIdRef.current = trade.id;
        const profitVal = trade.profit ?? trade.profit_loss ?? 0;
        const knownTrade = openTrades.find((t) => t.id === trade.id);
        setTradeResultPopup({
          asset_symbol: knownTrade?.asset_symbol ?? trade.asset_symbol ?? '',
          order_type: trade.order_type,
          amount: trade.amount,
          result: trade.result as 'win' | 'loss',
          profit_loss: Math.abs(profitVal),
          entry_price: trade.entry_price ?? undefined,
          exit_price: trade.exit_price ?? undefined,
        });
      }

      fetchOpenTrades();
      fetchWallet();
    } catch (err: any) {
      setToast({ message: err?.message ?? 'Failed to close trade', type: 'error' });
    } finally {
      setClosingTradeIds((prev) => {
        const next = new Set(prev);
        next.delete(trade.id);
        return next;
      });
    }
  }, [closingTradeIds, fetchOpenTrades, fetchWallet]);

  // ── Close all trades ────────────────────────────────────────────────────────

  const handleCloseAll = useCallback(async () => {
    setShowCloseAllConfirm(false);
    const chartPrice = chartRef.current?.getCurrentPrice() ?? null;
    if (!chartPrice) {
      setToast({ message: 'Chart not ready, please wait', type: 'error' });
      return;
    }
    setCloseAllLoading(true);
    try {
      const tradesToClose = [...openTrades];
      for (const trade of tradesToClose) {
        await supabase.rpc('settle_trade', {
          p_trade_id: trade.id,
          p_exit_price: chartPrice,
        });
      }
      // Dismiss notification if it belongs to any of the closed trades
      setTradeOpenNotif((prev) => {
        if (!prev) return null;
        const closedIds = new Set(tradesToClose.map((t) => t.id));
        if (closedIds.has(prev.id) || (prev.tradeId && closedIds.has(prev.tradeId))) return null;
        return prev;
      });

      // Show WIN/LOSS result for the last trade (or aggregate)
      if (tradesToClose.length > 0) {
        const lastTrade = tradesToClose[tradesToClose.length - 1];
        const entryPrice = lastTrade.entry_price;
        const exitPrice = chartPrice;
        let result: 'win' | 'loss';
        if (lastTrade.order_type === 'buy') {
          result = exitPrice > entryPrice ? 'win' : 'loss';
        } else {
          result = exitPrice < entryPrice ? 'win' : 'loss';
        }
        const priceDiff = Math.abs(exitPrice - entryPrice);
        const pctMove = entryPrice > 0 ? priceDiff / entryPrice : 0;
        const profitLoss = result === 'win' ? lastTrade.amount * (1 + pctMove) - lastTrade.amount : lastTrade.amount;
        lastPopupTradeIdRef.current = lastTrade.id;
        setTradeResultPopup({
          asset_symbol: lastTrade.asset_symbol,
          order_type: lastTrade.order_type,
          amount: lastTrade.amount,
          result,
          profit_loss: profitLoss,
          entry_price: entryPrice,
          exit_price: exitPrice,
        });
      }

      fetchOpenTrades();
      fetchWallet();
    } catch (err: any) {
      setToast({ message: err?.message ?? 'Failed to close all trades', type: 'error' });
    } finally {
      setCloseAllLoading(false);
    }
  }, [openTrades, fetchOpenTrades, fetchWallet]);

  // ── Trade Actions ───────────────────────────────────────────────────────────

  const handleTrade = async (orderType: 'buy' | 'sell') => {
    if (isFollowingCopyTrade) {
      setToast({ message: 'You are currently copying Tradiglo trades. Stop following to trade manually.', type: 'info' });
      return;
    }
    if (!selectedAsset) {
      setToast({ message: 'Please select an asset first', type: 'error' });
      return;
    }
    const setLoading = orderType === 'buy' ? setBuyLoading : setSellLoading;
    setLoading(true);

    const chartPrice = chartRef.current?.getCurrentPrice() ?? null;

    try {
      if (chartPrice === null || chartPrice <= 0) {
        setToast({ message: 'Chart not ready, please wait a moment and try again', type: 'error' });
        setLoading(false);
        return;
      }
      const entryPrice = chartPrice;
      const tempId = `pending-${Date.now()}`;
      chartRef.current?.addEntryLine(tempId, entryPrice, orderType);

      const openedAt = new Date().toISOString();
      setTradeOpenNotif({
        id: tempId,
        orderType,
        amount,
        entryPrice,
        durationLabel: currentDurationLabel,
        durationSeconds: currentDurationSeconds,
        openedAt,
      });

      const { data: assetData, error: assetError } = await supabase
        .from('assets').select('id').eq('symbol', selectedAsset.symbol).maybeSingle();

      if (assetError || !assetData) {
        chartRef.current?.removeEntryLine(tempId);
        throw new Error('Asset not found: ' + (assetError?.message ?? 'symbol not in database'));
      }

      const { data: tradeResult, error } = await supabase.rpc('open_trade', {
        p_asset_id: assetData.id,
        p_amount: amount,
        p_order_type: orderType,
        p_duration_seconds: currentDurationSeconds,
        p_entry_price: entryPrice,
        p_is_demo: isDemo,
      });

      if (error) {
        chartRef.current?.removeEntryLine(tempId);
        throw error;
      }

      chartRef.current?.removeEntryLine(tempId);
      if (tradeResult?.id) {
        chartRef.current?.addEntryLine(tradeResult.id, entryPrice, orderType);
        // Update notification with the real trade_id so it can be dismissed on close
        setTradeOpenNotif((prev) => {
          if (prev && prev.id === tempId) return { ...prev, tradeId: tradeResult.id };
          return prev;
        });
      }

      fetchOpenTrades();
      fetchWallet();
    } catch (err: any) {
      setToast({ message: err?.message ?? 'Failed to open trade. Please try again.', type: 'error' });
      setTradeOpenNotif(null);
    } finally {
      setLoading(false);
    }
  };

  // ── Stats ───────────────────────────────────────────────────────────────────

  const totalTrades = totalTradesCount;
  const wins = tradeHistory.filter((t) => t.result === 'win').length;
  const winRate = totalTrades > 0 ? ((wins / totalTrades) * 100).toFixed(1) : '0.0';
  const totalProfit = tradeHistory.reduce((sum, t) => sum + ((t.profit_loss ?? 0) >= 0 ? (t.profit_loss ?? 0) : 0), 0);
  const openPositions = openTrades.length;

  // ── Render Guard ──────────────────────────────────────────────────────────────────

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ── Active asset display ────────────────────────────────────────────────────

  const activeSymbolDisplay = selectedAsset
    ? selectedAsset.symbol.replace('USDT', '').replace('USD', '')
    : 'Select';

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="bg-black text-white flex flex-col" style={{ fontFamily: "'Inter', sans-serif", height: '100dvh' }}>

      {/* ── FIXED TOP BAR ── */}
      <DashboardTopBar
        wallet={wallet}
        walletLoading={walletLoading}
        isDemo={isDemo}
        onToggleDemo={setIsDemo}
        userEmail={userEmail}
        avatarUrl={avatarUrl}
        onDepositClick={() => setShowDepositModal(true)}
      />

      {/* ── MAIN BODY (fills remaining height) ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── FULL WIDTH CONTENT AREA (no sidebar) ── */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">

          {/* STATS BAR */}
          <div className="border-b border-white/10 bg-[#0a0a0a] flex-shrink-0">
            <div className="px-3 py-2">
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Win Rate', value: `${winRate}%` },
                  { label: 'Profit', value: `${totalProfit >= 0 ? '+' : ''}$${formatCurrency(totalProfit)}`, color: totalProfit >= 0 ? 'text-emerald-400' : 'text-red-400' },
                  { label: 'Open', value: openPositions.toString(), color: 'text-blue-400' },
                ].map((stat) => (
                  <div key={stat.label} className="flex flex-col gap-0.5">
                    <span className="text-[9px] text-slate-500 uppercase tracking-wider">{stat.label}</span>
                    <span className={`text-xs font-semibold ${stat.color ?? 'text-white'}`} style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* SCROLLABLE CONTENT */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden" style={{ paddingBottom: 160 }}>

            {/* CHART AREA */}
            <div className="bg-[#0d0d0d] border-b border-white/10">

              {/* ── Chart Top Bar: Asset Selector Button + Price ── */}
              <div className="flex items-center gap-1.5 px-2 sm:px-4 py-2 border-b border-white/10 overflow-hidden">

                {/* ── Asset Selector Button ── */}
                <button
                  onClick={() => setAssetModalOpen(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '5px 8px',
                    background: 'rgba(255,255,255,0.07)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: 8,
                    cursor: 'pointer',
                    transition: 'background 150ms, border-color 150ms',
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.12)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
                  }}
                >
                  {selectedAsset ? (
                    <AssetButtonIcon symbol={selectedAsset.symbol} category={selectedAsset.category} />
                  ) : (
                    <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#334155' }} />
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 1 }}>
                    <span style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: 12, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                      {activeSymbolDisplay}
                    </span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#10b981', letterSpacing: '0.02em', lineHeight: 1 }}>
                      95% <span style={{ fontWeight: 400, color: 'rgba(255,255,255,0.35)', fontSize: 9 }}>payout</span>
                    </span>
                  </div>
                  {/* Thin elegant chevron */}
                  <svg
                    width="12" height="12" viewBox="0 0 24 24" fill="none"
                    stroke="rgba(255,255,255,0.45)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                    style={{ flexShrink: 0 }}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {/* ── Live Price ── */}
                {selectedAsset && (
                  <div style={{ display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
                    <span style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: 13, fontWeight: 700, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1.2, fontVariantNumeric: 'tabular-nums' }}>
                      {livePrice !== null ? formatPrice(livePrice) : '—'}
                    </span>
                    {livePrice !== null && (
                      <span style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: 10, fontWeight: 600, letterSpacing: '-0.01em', lineHeight: 1, fontVariantNumeric: 'tabular-nums', color: priceChange >= 0 ? '#10b981' : '#f87171' }}>
                        {priceChange >= 0 ? '+' : ''}{priceChangePct.toFixed(2)}%
                      </span>
                    )}
                  </div>
                )}

                {/* ── Center: High / Low / Vol — hidden on very small screens ── */}
                {livePrice !== null && (
                  <div className="hidden sm:flex items-center gap-3 flex-1 justify-center px-2">
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                      <span style={{ fontSize: 9, fontWeight: 500, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em', textTransform: 'uppercase', lineHeight: 1 }}>High</span>
                      <span style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: 10, fontWeight: 600, color: '#10b981', letterSpacing: '-0.01em', lineHeight: 1.2, fontVariantNumeric: 'tabular-nums' }}>
                        {formatPrice(livePrice * (1 + Math.abs(priceChangePct) / 100 * 0.6 + 0.0008))}
                      </span>
                    </div>
                    <div style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.08)' }} />
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                      <span style={{ fontSize: 9, fontWeight: 500, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em', textTransform: 'uppercase', lineHeight: 1 }}>Low</span>
                      <span style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: 10, fontWeight: 600, color: '#f87171', letterSpacing: '-0.01em', lineHeight: 1.2, fontVariantNumeric: 'tabular-nums' }}>
                        {formatPrice(livePrice * (1 - Math.abs(priceChangePct) / 100 * 0.6 - 0.0008))}
                      </span>
                    </div>
                    <div style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.08)' }} />
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                      <span style={{ fontSize: 9, fontWeight: 500, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em', textTransform: 'uppercase', lineHeight: 1 }}>Vol</span>
                      <span style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.6)', letterSpacing: '-0.01em', lineHeight: 1.2 }}>
                        {livePrice > 1000 ? `${(livePrice * 0.00024).toFixed(2)}K` : `${(livePrice * 0.12).toFixed(0)}`}
                      </span>
                    </div>
                  </div>
                )}

                {/* ── Change + LIVE ── */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto', flexShrink: 0 }}>
                  {livePrice !== null && (
                    <div className="hidden xs:flex flex-col items-end gap-0.5">
                      <span style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: 10, fontWeight: 600, letterSpacing: '-0.01em', lineHeight: 1.2, fontVariantNumeric: 'tabular-nums', color: priceChange >= 0 ? '#10b981' : '#f87171' }}>
                        {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(priceChange > 100 ? 2 : 4)}
                      </span>
                      <span style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: 9, fontWeight: 500, letterSpacing: '-0.01em', lineHeight: 1, fontVariantNumeric: 'tabular-nums', color: 'rgba(255,255,255,0.3)' }}>
                        24h
                      </span>
                    </div>
                  )}
                  {/* LIVE indicator with pulse */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 6px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 6, flexShrink: 0 }}>
                    <span style={{ position: 'relative', display: 'inline-flex', width: 6, height: 6 }}>
                      <span style={{
                        position: 'absolute', inset: 0, borderRadius: '50%', background: '#10b981',
                        animation: 'ping 1.4s cubic-bezier(0,0,0.2,1) infinite', opacity: 0.6,
                      }} />
                      <span style={{ position: 'relative', width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'block' }} />
                    </span>
                    <span style={{ fontSize: 9, fontWeight: 700, color: '#10b981', letterSpacing: '0.06em' }}>LIVE</span>
                  </div>
                </div>
              </div>

              {/* ── Chart ── */}
              <div className="w-full">
                {selectedAsset ? (
                  <LightweightChart
                    ref={chartRef}
                    symbol={selectedAsset.symbol}
                    category={selectedAsset.category}
                    openTrades={openTrades.map((t) => ({
                      id: t.id,
                      entry_price: t.entry_price,
                      order_type: t.order_type,
                      status: t.status,
                    }))}
                    onChartReady={() => setIsChartReady(true)}
                    onPriceUpdate={(price, change, changePct) => {
                      setLivePrice(price);
                      setPriceChange(change);
                      setPriceChangePct(changePct);
                    }}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center gap-3" style={{ height: 240 }}>
                    <span className="text-slate-500 text-sm">Select an asset to view chart</span>
                    <button
                      onClick={() => setAssetModalOpen(true)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors"
                    >
                      Select Asset
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* OPEN TRADES TABLE */}
            {activeNav === 'trade' && (
              <div className="px-2 sm:px-3 pt-3 pb-2">
                <div className="bg-[#0d0d0d] border border-white/10 rounded-xl overflow-hidden">
                  <div className="px-3 py-2.5 border-b border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                      <h3 className="text-xs font-semibold text-white uppercase tracking-wider">Open Trades</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      {openTrades.length > 0 && (
                        <button
                          onClick={() => setShowCloseAllConfirm(true)}
                          disabled={closeAllLoading || closingTradeIds.size > 0}
                          className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                          {closeAllLoading ? (
                            <span className="w-3 h-3 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7 7 7" /></svg>
                          )}
                          Close All
                        </button>
                      )}
                      <span className="text-xs text-slate-500">{openTrades.length} open</span>
                    </div>
                  </div>
                  {tradesLoading && openTrades.length === 0 ? (
                    <div className="flex items-center justify-center py-6">
                      <span className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : openTrades.length === 0 ? (
                    <div className="text-center py-5 text-slate-500 text-sm">No open trades</div>
                  ) : (
                    <>
                      {/* Desktop table */}
                      <div className="hidden sm:block overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="text-slate-500 border-b border-white/5">
                              <th className="px-3 py-2 text-left font-medium">Asset</th>
                              <th className="px-3 py-2 text-left font-medium">Type</th>
                              <th className="px-3 py-2 text-left font-medium">Amount</th>
                              <th className="px-3 py-2 text-left font-medium">Entry</th>
                              <th className="px-3 py-2 text-left font-medium">Duration</th>
                              <th className="px-3 py-2 text-left font-medium">Remaining</th>
                              <th className="px-3 py-2 text-left font-medium"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {openTrades.map((trade) => (
                              <tr key={trade.id} className={`border-b border-white/5 hover:bg-white/5 transition-all duration-300 ${fadingTradeIds.has(trade.id) ? 'opacity-0' : 'opacity-100'}`}>
                                <td className="px-3 py-2.5 font-semibold text-white whitespace-nowrap">{trade.asset_symbol}</td>
                                <td className="px-3 py-2.5">
                                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${trade.order_type === 'buy' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                    {trade.order_type.toUpperCase()}
                                  </span>
                                </td>
                                <td className="px-3 py-2.5 text-slate-300" style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>${formatCurrency(trade.amount)}</td>
                                <td className="px-3 py-2.5 text-slate-300" style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>${trade.entry_price.toFixed(2)}</td>
                                <td className="px-3 py-2.5 text-slate-400" style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>{formatDuration(trade.duration_seconds)}</td>
                                <td className="px-3 py-2.5">
                                  <CountdownCell tradeId={trade.id} openedAt={trade.opened_at} durationSeconds={trade.duration_seconds} onExpired={handleTradeRowExpired} />
                                </td>
                                <td className="px-3 py-2.5">
                                  <button
                                    onClick={() => handleCloseTrade(trade)}
                                    disabled={closingTradeIds.has(trade.id) || closeAllLoading}
                                    title="Close trade"
                                    className="w-6 h-6 flex items-center justify-center rounded bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                  >
                                    {closingTradeIds.has(trade.id) ? (
                                      <span className="w-3.5 h-3.5 border border-red-400 border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7 7 7" /></svg>
                                    )}
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Mobile cards */}
                      <div className="sm:hidden flex flex-col divide-y divide-white/5">
                        {openTrades.map((trade) => (
                          <div key={trade.id} className={`px-3 py-2.5 flex flex-col gap-1.5 transition-all duration-300 ${fadingTradeIds.has(trade.id) ? 'opacity-0' : 'opacity-100'}`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-white">{trade.asset_symbol}</span>
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${trade.order_type === 'buy' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                  {trade.order_type.toUpperCase()}
                                </span>
                              </div>
                              <button
                                onClick={() => handleCloseTrade(trade)}
                                disabled={closingTradeIds.has(trade.id) || closeAllLoading}
                                title="Close trade"
                                className="w-7 h-7 flex items-center justify-center rounded bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                              >
                                {closingTradeIds.has(trade.id) ? (
                                  <span className="w-3.5 h-3.5 border border-red-400 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7 7 7" /></svg>
                                )}
                              </button>
                            </div>
                            <div className="grid grid-cols-3 gap-1.5 text-xs">
                              <div>
                                <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-0.5">Amount</div>
                                <div className="text-slate-300 font-medium text-[11px]" style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>${formatCurrency(trade.amount)}</div>
                              </div>
                              <div>
                                <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-0.5">Entry</div>
                                <div className="text-slate-300 font-medium text-[11px]" style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>${formatCurrency(trade.entry_price)}</div>
                              </div>
                              <div>
                                <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-0.5">Remaining</div>
                                <CountdownCell tradeId={trade.id} openedAt={trade.opened_at} durationSeconds={trade.duration_seconds} onExpired={handleTradeRowExpired} />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* TRADE HISTORY */}
            {activeNav === 'history' && (
              <div className="px-2 sm:px-3 py-3">
                <div className="bg-[#0d0d0d] border border-white/10 rounded-xl overflow-hidden">
                  <div className="px-3 py-3 border-b border-white/10 flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-white uppercase tracking-wider">Trade History</h3>
                    <span className="text-xs text-slate-500">{tradeHistory.length} trades</span>
                  </div>

                  {historyLoading ? (
                    <div className="flex items-center justify-center py-10">
                      <span className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : tradeHistory.length === 0 ? (
                    <div className="text-center py-10 text-slate-500 text-sm">No trade history yet</div>
                  ) : (
                    <>
                      <div className="hidden sm:block overflow-x-auto overflow-y-auto max-h-[400px]">
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
                                <td className="px-3 py-2.5 text-slate-300" style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>${formatCurrency(trade.amount)}</td>
                                <td className="px-3 py-2.5 text-slate-400" style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>${formatCurrency(trade.entry_price)}</td>
                                <td className="px-3 py-2.5 text-slate-400" style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>{trade.exit_price != null ? `$${formatCurrency(trade.exit_price)}` : '—'}</td>
                                <td className={`px-3 py-2.5 font-semibold ${(trade.profit_loss ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`} style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>
                                  {trade.profit_loss != null ? `${trade.profit_loss >= 0 ? '+' : ''}$${formatCurrency(trade.profit_loss)}` : '—'}
                                </td>
                                <td className="px-3 py-2.5">
                                  {trade.result ? (
                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${trade.result === 'win' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                      {trade.result.toUpperCase()}
                                    </span>
                                  ) : <span className="text-slate-600">—</span>}
                                </td>
                                <td className="px-3 py-2.5 text-slate-500">
                                  {trade.closed_at ? new Date(trade.closed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="sm:hidden flex flex-col divide-y divide-white/5">
                        {tradeHistory.map((trade) => (
                          <div key={trade.id} className="px-3 py-2.5 flex flex-col gap-1.5">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-white">{trade.asset_symbol}</span>
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${trade.order_type === 'buy' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                  {trade.order_type.toUpperCase()}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                {trade.result ? (
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${trade.result === 'win' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                    {trade.result.toUpperCase()}
                                  </span>
                                ) : null}
                                <span className={`text-sm font-bold ${(trade.profit_loss ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`} style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>
                                  {trade.profit_loss != null ? `${trade.profit_loss >= 0 ? '+' : ''}$${formatCurrency(trade.profit_loss)}` : '—'}
                                </span>
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-1.5 text-xs">
                              <div>
                                <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-0.5">Amount</div>
                                <div className="text-slate-300 text-[11px]">${formatCurrency(trade.amount)}</div>
                              </div>
                              <div>
                                <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-0.5">Entry</div>
                                <div className="text-slate-300 text-[11px]">${formatCurrency(trade.entry_price)}</div>
                              </div>
                              <div>
                                <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-0.5">Exit</div>
                                <div className="text-slate-300 text-[11px]">{trade.exit_price != null ? `$${formatCurrency(trade.exit_price)}` : '—'}</div>
                              </div>
                            </div>
                            {trade.closed_at && (
                              <div className="text-[10px] text-slate-600">
                                {new Date(trade.closed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {historyHasMore && (
                        <div className="px-4 py-3 border-t border-white/10 flex justify-center">
                          <button
                            onClick={loadMoreTradeHistory}
                            disabled={historyLoadingMore}
                            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs text-slate-300 transition-colors disabled:opacity-50"
                          >
                            {historyLoadingMore ? (
                              <>
                                <span className="w-3.5 h-3.5 border border-slate-400 border-t-transparent rounded-full animate-spin" />
                                Loading...
                              </>
                            ) : (
                              'Load More'
                            )}
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            {activeNav === 'copytrade' && userId && (
              <CopyTradeTab userId={userId} wallet={wallet} />
            )}

            {activeNav === 'account' && (
              <div className="px-2 sm:px-3 py-3">
                <div className="bg-[#0d0d0d] border border-white/10 rounded-xl p-4">
                  <h3 className="text-xs font-semibold text-white uppercase tracking-wider mb-4">Account</h3>
                  <div className="flex flex-col gap-3">
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-2 h-2 rounded-full bg-blue-400" />
                        <span className="text-xs text-blue-400 font-medium uppercase tracking-wider">Demo Balance</span>
                      </div>
                      <div className="text-2xl font-bold text-white" style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.03em' }}>${formatCurrency(wallet?.demoBalance ?? 0)}</div>
                      <div className="text-xs text-slate-500 mt-0.5">USD</div>
                    </div>
                    <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-2 h-2 rounded-full bg-orange-400" />
                        <span className="text-xs text-orange-400 font-medium uppercase tracking-wider">Real Balance</span>
                      </div>
                      <div className="text-2xl font-bold text-white" style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.03em' }}>${formatCurrency(wallet?.realBalance ?? 0)}</div>
                      <div className="text-xs text-slate-500 mt-0.5">USD</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── FIXED BOTTOM TRADING PANEL ── */}
          <div className="flex-shrink-0 bg-[#0a0a0a] border-t border-white/10">
            {/* Duration + Amount row */}
            <div className="flex items-center gap-0 border-b border-white/10">
              {/* Duration */}
              <div className="flex-1 flex items-center gap-1.5 px-2 py-1.5 border-r border-white/10">
                <span className="text-[9px] text-slate-500 uppercase tracking-wider flex-shrink-0">Dur</span>
                <button
                  onClick={decrementDuration}
                  disabled={durationIndex <= 0 || isFollowingCopyTrade}
                  className="w-6 h-6 rounded bg-white/10 hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm flex items-center justify-center flex-shrink-0"
                >−</button>
                <div className="flex-1 text-center bg-white/5 border border-white/20 rounded py-0.5 text-xs font-semibold text-white min-w-[36px]">
                  {currentDurationLabel}
                </div>
                <button
                  onClick={incrementDuration}
                  disabled={durationIndex >= DURATION_STEPS.length - 1 || isFollowingCopyTrade}
                  className="w-6 h-6 rounded bg-white/10 hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm flex items-center justify-center flex-shrink-0"
                >+</button>
              </div>

              {/* Amount */}
              <div className="flex-1 flex items-center gap-1.5 px-2 py-1.5">
                <span className="text-[9px] text-slate-500 uppercase tracking-wider flex-shrink-0">Amt</span>
                <button
                  onClick={handleAmountDecrement}
                  disabled={amount <= 1 || isFollowingCopyTrade}
                  className="w-6 h-6 rounded bg-white/10 hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm flex items-center justify-center flex-shrink-0"
                >−</button>
                <input
                  type="text"
                  inputMode="numeric"
                  value={amountInput}
                  onChange={handleAmountInputChange}
                  onBlur={handleAmountInputBlur}
                  disabled={isFollowingCopyTrade}
                  className="flex-1 text-center bg-white/5 border border-white/20 rounded py-0.5 text-xs font-semibold text-white min-w-[36px] focus:outline-none focus:border-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}
                />
                <button
                  onClick={handleAmountIncrement}
                  disabled={amount >= 10000 || isFollowingCopyTrade}
                  className="w-6 h-6 rounded bg-white/10 hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm flex items-center justify-center flex-shrink-0"
                >+</button>
              </div>
            </div>

            {/* Copy Trade Active Banner */}
            {isFollowingCopyTrade && (
              <div className="px-3 py-1.5 bg-blue-500/10 border-b border-blue-500/20 flex items-center gap-2">
                <svg className="w-3 h-3 text-blue-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span className="text-blue-400 text-[10px] font-medium">You are currently copying Tradiglo trades</span>
              </div>
            )}

            {/* SELL / BUY buttons */}
            <div className="flex gap-0 w-full">
              <button
                onClick={() => handleTrade('sell')}
                disabled={buyLoading || sellLoading || !selectedAsset || isFollowingCopyTrade}
                title={isFollowingCopyTrade ? 'You are currently copying Tradiglo trades' : undefined}
                style={{
                  background: '#e53935',
                  transition: 'all 0.2s ease',
                  borderRadius: 8,
                }}
                className="flex-1 py-3 disabled:opacity-60 disabled:cursor-not-allowed text-white font-extrabold text-base tracking-widest transition-all flex items-center justify-center gap-2"
              >
                {sellLoading ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
                ) : (
                  <>
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 20l-8-8h5V4h6v8h5z"/></svg>
                    SELL
                  </>
                )}
              </button>
              <button
                onClick={() => handleTrade('buy')}
                disabled={buyLoading || sellLoading || !selectedAsset || isFollowingCopyTrade}
                title={isFollowingCopyTrade ? 'You are currently copying Tradiglo trades' : undefined}
                style={{
                  background: '#2e7d32',
                  transition: 'all 0.2s ease',
                  borderRadius: 8,
                }}
                className="flex-1 py-3 disabled:opacity-60 disabled:cursor-not-allowed text-white font-extrabold text-base tracking-widest transition-all flex items-center justify-center gap-2"
              >
                {buyLoading ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
                ) : (
                  <>
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4l8 8h-5v8H9v-8H4z"/></svg>
                    BUY
                  </>
                )}
              </button>
            </div>

            {/* Bottom Navigation */}
            <BottomNav active={activeNav} onChange={setActiveNav} />
          </div>
        </div>
      </div>

      {/* ── Asset Selector Modal ── */}
      <AssetSelectorModal
        isOpen={assetModalOpen}
        onClose={() => setAssetModalOpen(false)}
        assets={assets}
        selectedAsset={selectedAsset}
        onSelectAsset={(asset) => {
          setSelectedAsset(asset);
          setIsChartReady(false);
          setLivePrice(null);
        }}
      />

      {/* ── Deposit Modal ── */}
      <DepositModal
        isOpen={showDepositModal}
        onClose={() => setShowDepositModal(false)}
        userId={userId ?? ''}
        isDemo={isDemo}
      />

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Trade Open Notification */}
      {tradeOpenNotif && (
        <TradeOpenNotif
          orderType={tradeOpenNotif.orderType}
          amount={tradeOpenNotif.amount}
          entryPrice={tradeOpenNotif.entryPrice}
          durationLabel={tradeOpenNotif.durationLabel}
          durationSeconds={tradeOpenNotif.durationSeconds}
          openedAt={tradeOpenNotif.openedAt}
          onClose={() => setTradeOpenNotif(null)}
        />
      )}

      {/* Trade Result Popup */}
      {tradeResultPopup && <TradeResultPopup trade={tradeResultPopup} onClose={() => setTradeResultPopup(null)} />}

      {/* Trade Result Modal */}
      {tradeResultPopup && <TradeResultModal trade={tradeResultPopup} onClose={() => setTradeResultPopup(null)} />}

      {/* Close All Confirmation Dialog */}
      {showCloseAllConfirm && (
        <div
          onClick={() => setShowCloseAllConfirm(false)}
          className="fixed inset-0 z-[10001] flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(2px)' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#0f0f0f] border border-white/20 rounded-xl p-6 w-72 max-w-[90vw] text-center"
            style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.8)' }}
          >
            <div className="w-12 h-12 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h3 className="text-sm font-bold text-white mb-2">Close all open trades?</h3>
            <p className="text-xs text-slate-400 mb-5">All {openTrades.length} open trade{openTrades.length !== 1 ? 's' : ''} will be closed at the current chart price.</p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowCloseAllConfirm(false)}
                className="flex-1 py-2.5 bg-white/10 border border-white/20 text-slate-300 text-xs font-semibold hover:bg-white/20 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleCloseAll}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all"
              >
                Close All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
