'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import DashboardTopBar from '@/components/dashboard/DashboardTopBar';
import DepositModal from '@/components/dashboard/DepositModal';
import { useRealtimeDashboard } from '@/lib/hooks/useRealtimeDashboard';

// ─── Types ────────────────────────────────────────────────────────────────────

type Tier = 'basic' | 'silver' | 'gold' | 'diamond';
type Duration = '3h' | '6h' | '12h' | '1d';
type InvestmentStatus = 'active' | 'completed' | 'pending_payout';

interface TierOption {
  id: Tier;
  label: string;
  color: string;
  borderColor: string;
  bgColor: string;
  glowColor: string;
  gradient: string;
  badgeBg: string;
  packages: PackageOption[];
}

interface PackageOption {
  capital: number;
  baseProfit: number;
}

interface DurationOption {
  id: Duration;
  label: string;
  factor: number;
  seconds: number;
}

interface InvestmentPackage {
  id: string;
  tier: Tier;
  capital_usd: number;
  duration: Duration;
  gross_profit_usd: number;
  platform_fee_usd: number;
  net_profit_usd: number;
  status: InvestmentStatus;
  started_at: string;
  expires_at: string;
  completed_at: string | null;
}

interface Wallet {
  demoBalance: number;
  realBalance: number;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const DURATION_OPTIONS: DurationOption[] = [
  { id: '3h',  label: '3 Hours',  factor: 1.0, seconds: 10800  },
  { id: '6h',  label: '6 Hours',  factor: 1.4, seconds: 21600  },
  { id: '12h', label: '12 Hours', factor: 2.0, seconds: 43200  },
  { id: '1d',  label: '1 Day',    factor: 3.2, seconds: 86400  },
];

const TIERS: TierOption[] = [
  {
    id: 'basic',
    label: 'Basic',
    color: '#10b981',
    borderColor: 'rgba(16,185,129,0.4)',
    bgColor: 'rgba(16,185,129,0.07)',
    glowColor: 'rgba(16,185,129,0.3)',
    gradient: 'linear-gradient(135deg, rgba(16,185,129,0.14) 0%, rgba(5,150,105,0.06) 100%)',
    badgeBg: 'rgba(16,185,129,0.18)',
    packages: [
      { capital: 100,   baseProfit: 2500  },
      { capital: 300,   baseProfit: 5000  },
      { capital: 500,   baseProfit: 10000 },
      { capital: 1000,  baseProfit: 25000 },
    ],
  },
  {
    id: 'silver',
    label: 'Silver',
    color: '#cbd5e1',
    borderColor: 'rgba(203,213,225,0.35)',
    bgColor: 'rgba(203,213,225,0.07)',
    glowColor: 'rgba(203,213,225,0.25)',
    gradient: 'linear-gradient(135deg, rgba(203,213,225,0.12) 0%, rgba(148,163,184,0.06) 100%)',
    badgeBg: 'rgba(203,213,225,0.15)',
    packages: [
      { capital: 2000,  baseProfit: 40000  },
      { capital: 3000,  baseProfit: 65000  },
      { capital: 5000,  baseProfit: 100000 },
    ],
  },
  {
    id: 'gold',
    label: 'Gold',
    color: '#f59e0b',
    borderColor: 'rgba(245,158,11,0.4)',
    bgColor: 'rgba(245,158,11,0.07)',
    glowColor: 'rgba(245,158,11,0.3)',
    gradient: 'linear-gradient(135deg, rgba(245,158,11,0.14) 0%, rgba(217,119,6,0.06) 100%)',
    badgeBg: 'rgba(245,158,11,0.18)',
    packages: [
      { capital: 5000,  baseProfit: 85000  },
      { capital: 7000,  baseProfit: 115000 },
      { capital: 10000, baseProfit: 160000 },
      { capital: 15000, baseProfit: 215000 },
    ],
  },
  {
    id: 'diamond',
    label: 'Diamond',
    color: '#38bdf8',
    borderColor: 'rgba(56,189,248,0.4)',
    bgColor: 'rgba(56,189,248,0.07)',
    glowColor: 'rgba(56,189,248,0.3)',
    gradient: 'linear-gradient(135deg, rgba(56,189,248,0.14) 0%, rgba(14,165,233,0.06) 100%)',
    badgeBg: 'rgba(56,189,248,0.18)',
    packages: [
      { capital: 20000, baseProfit: 1000000  },
      { capital: 25000, baseProfit: 1250000  },
      { capital: 30000, baseProfit: 2100000  },
      { capital: 60000, baseProfit: 2450000  },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function fmtFull(n: number): string {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function getProfit(base: number, factor: number): number {
  return Math.round(base * factor);
}

function getTimeRemaining(expiresAt: string): number {
  return Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
}

function formatCountdown(secs: number): string {
  if (secs <= 0) return 'Completed';
  const d = Math.floor(secs / 86400);
  const h = Math.floor((secs % 86400) / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (d > 0) return `${d}d ${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m`;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ─── Followers Simulation ─────────────────────────────────────────────────────

const FOLLOWERS_BASE: Record<Tier, { min: number; max: number }> = {
  basic:   { min: 74381,  max: 118947 },
  silver:  { min: 41273,  max: 79854  },
  gold:    { min: 18629,  max: 47312  },
  diamond: { min: 7841,   max: 23567  },
};

// Stable per-tier seed so the initial value never jumps on re-render
const FOLLOWERS_SEED: Record<Tier, number> = {
  basic:   96714,
  silver:  60537,
  gold:    33148,
  diamond: 15903,
};

function useFollowers(tier: Tier): number {
  const range = FOLLOWERS_BASE[tier];
  // Use a stable seed as initial value — no random on first render (avoids hydration mismatch)
  const [count, setCount] = useState<number>(FOLLOWERS_SEED[tier]);

  useEffect(() => {
    // Small, gradual tick: ±50 to ±150 per update — never a big jump
    const tick = () => {
      setCount(prev => {
        const magnitude = 50 + Math.floor(Math.random() * 101); // 50–150
        const direction = Math.random() < 0.5 ? 1 : -1;
        const delta = magnitude * direction;
        const next = prev + delta;
        // Clamp within range
        return Math.min(Math.max(next, range.min), range.max);
      });
    };

    const timerRef: { current: ReturnType<typeof setTimeout> | null } = { current: null };

    // Slow interval: 5–9 seconds between each small change
    const scheduleNext = () => {
      const delay = 5000 + Math.random() * 4000;
      return setTimeout(() => {
        tick();
        timerRef.current = scheduleNext();
      }, delay);
    };

    timerRef.current = scheduleNext();

    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tier]);

  return count;
}

function fmtFollowers(n: number): string {
  return n.toLocaleString('en-US');
}

// ─── Tier Followers Badge ─────────────────────────────────────────────────────

function TierFollowersBadge({ tier, color }: { tier: Tier; color: string }) {
  const count = useFollowers(tier);
  return (
    <div className="flex items-center gap-1.5">
      <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ color: `${color}99` }}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
      <span className="text-sm font-bold tabular-nums" style={{ color: `${color}cc` }}>
        {fmtFollowers(count)}
      </span>
      <span className="text-xs text-slate-500">followers</span>
    </div>
  );
}

// ─── Tier Icon ────────────────────────────────────────────────────────────────

function TierIcon({ tier }: { tier: Tier }) {
  if (tier === 'diamond') return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6.5 2h11l4.5 6-10 14L1 8z" opacity="0.9"/>
    </svg>
  );
  if (tier === 'gold') return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M2 6l3 7h14l3-7-5 3-5-6-5 6-5-3zm3 9v2h14v-2H5zm2 3v1h10v-1H7z"/>
    </svg>
  );
  if (tier === 'silver') return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
      <path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6z"/>
    </svg>
  );
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
    </svg>
  );
}

// ─── Countdown Cell ───────────────────────────────────────────────────────────

function CountdownCell({ expiresAt, onExpired }: { expiresAt: string; onExpired: () => void }) {
  const [secs, setSecs] = useState(() => getTimeRemaining(expiresAt));

  useEffect(() => {
    if (secs <= 0) { onExpired(); return; }
    const t = setInterval(() => {
      const r = getTimeRemaining(expiresAt);
      setSecs(r);
      if (r <= 0) { clearInterval(t); onExpired(); }
    }, 1000);
    return () => clearInterval(t);
  }, [expiresAt, onExpired]);

  return (
    <span className={`font-mono text-xs font-bold tracking-wider ${secs <= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
      {formatCountdown(secs)}
    </span>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error' | 'info'; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  const colors = { success: '#10b981', error: '#ef4444', info: '#3b82f6' };
  const c = colors[type];
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 16, zIndex: 9999,
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      borderLeft: `3px solid ${c}`,
      border: `1px solid ${c}40`, borderRadius: 10,
      padding: '12px 16px', maxWidth: 320, display: 'flex', alignItems: 'center', gap: 10,
      boxShadow: `0 8px 32px rgba(0,0,0,0.7), 0 0 0 1px ${c}20`,
    }}>
      <span style={{ color: '#e2e8f0', fontSize: 12, fontWeight: 500, flex: 1, lineHeight: 1.5 }}>{message}</span>
      <button onClick={onClose} style={{ color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }}>✕</button>
    </div>
  );
}

// ─── Profit Breakdown ─────────────────────────────────────────────────────────

function ProfitBreakdown({
  selectedCapital,
  currentTier,
  currentDur,
  previewGrossProfit,
  previewFee,
  previewNet,
}: {
  selectedCapital: number;
  currentTier: TierOption;
  currentDur: DurationOption;
  previewGrossProfit: number;
  previewFee: number;
  previewNet: number;
}) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'linear-gradient(160deg, #0a0f1e 0%, #060b18 60%, #080d1a 100%)',
        border: `1px solid ${currentTier.borderColor}`,
        boxShadow: `0 8px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.03), inset 0 1px 0 rgba(255,255,255,0.05)`,
      }}
    >
      {/* Header strip */}
      <div
        className="px-4 py-3 flex items-center justify-between"
        style={{
          background: `linear-gradient(90deg, ${currentTier.color}18 0%, transparent 100%)`,
          borderBottom: `1px solid ${currentTier.color}22`,
        }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-6 h-6 rounded-lg flex items-center justify-center"
            style={{ background: currentTier.badgeBg, border: `1px solid ${currentTier.borderColor}` }}
          >
            <span style={{ color: currentTier.color }}><TierIcon tier={currentTier.id} /></span>
          </div>
          <span
            className="text-[11px] font-bold uppercase tracking-[0.15em]"
            style={{ color: currentTier.color, fontFamily: "'DM Sans', sans-serif", letterSpacing: '0.15em' }}
          >
            Profit Breakdown
          </span>
        </div>
        <span
          className="text-[9px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider"
          style={{ background: `${currentTier.color}18`, color: currentTier.color, border: `1px solid ${currentTier.color}30` }}
        >
          {currentDur.label}
        </span>
      </div>

      {/* Body */}
      <div className="px-4 py-4 flex flex-col gap-0">
        {/* Capital row */}
        <div
          className="flex justify-between items-center py-2.5 px-3 rounded-xl mb-1"
          style={{ background: 'rgba(255,255,255,0.025)' }}
        >
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />
            <span className="text-[11px] text-slate-400" style={{ fontFamily: "'DM Sans', sans-serif" }}>Capital Invested</span>
          </div>
          <span className="text-[12px] font-bold text-slate-200" style={{ fontFamily: "'DM Sans', sans-serif" }}>{fmtFull(selectedCapital)}</span>
        </div>

        {/* Duration row */}
        <div
          className="flex justify-between items-center py-2.5 px-3 rounded-xl mb-2"
          style={{ background: 'rgba(255,255,255,0.025)' }}
        >
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />
            <span className="text-[11px] text-slate-400" style={{ fontFamily: "'DM Sans', sans-serif" }}>Duration</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[12px] font-bold text-slate-200" style={{ fontFamily: "'DM Sans', sans-serif" }}>{currentDur.label}</span>
            <span
              className="text-[9px] px-1.5 py-0.5 rounded-md font-bold"
              style={{ background: `${currentTier.color}18`, color: `${currentTier.color}cc`, fontFamily: "'DM Sans', sans-serif" }}
            >
              x{currentDur.factor}
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className="relative flex items-center mb-2">
          <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, transparent, ${currentTier.color}30, transparent)` }} />
          <span className="mx-2 text-[9px] text-slate-700 uppercase tracking-widest" style={{ fontFamily: "'DM Sans', sans-serif" }}>returns</span>
          <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, transparent, ${currentTier.color}30, transparent)` }} />
        </div>

        {/* Gross Profit */}
        <div
          className="flex justify-between items-center py-2.5 px-3 rounded-xl mb-1"
          style={{ background: `${currentTier.color}0d`, border: `1px solid ${currentTier.color}18` }}
        >
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: currentTier.color }} />
            <span className="text-[11px] text-slate-400" style={{ fontFamily: "'DM Sans', sans-serif" }}>Gross Profit</span>
          </div>
          <span className="text-[13px] font-extrabold" style={{ color: currentTier.color, fontFamily: "'DM Sans', sans-serif" }}>
            +{fmtFull(previewGrossProfit)}
          </span>
        </div>

        {/* Platform Fee */}
        <div
          className="flex justify-between items-center py-2.5 px-3 rounded-xl mb-2"
          style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.12)' }}
        >
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            <span className="text-[11px] text-slate-400" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Platform Fee
              <span className="ml-1.5 text-[9px] text-slate-700 font-normal">(20%)</span>
            </span>
          </div>
          <span className="text-[13px] font-extrabold text-rose-400" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            -{fmtFull(previewFee)}
          </span>
        </div>

        {/* Net Profit highlight */}
        <div
          className="flex justify-between items-center py-3 px-3 rounded-xl mb-3"
          style={{
            background: 'linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(5,150,105,0.06) 100%)',
            border: '1px solid rgba(16,185,129,0.25)',
            boxShadow: '0 0 20px rgba(16,185,129,0.08)',
          }}
        >
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-[12px] font-bold text-white" style={{ fontFamily: "'DM Sans', sans-serif" }}>Net Profit</span>
          </div>
          <span className="text-[18px] font-black text-emerald-400" style={{ fontFamily: "'DM Sans', sans-serif", letterSpacing: '-0.02em' }}>
            {fmtFull(previewNet)}
          </span>
        </div>

        {/* Total Return — premium panel */}
        <div
          className="rounded-xl p-4 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(5,150,105,0.08) 50%, rgba(16,185,129,0.05) 100%)',
            border: '1px solid rgba(16,185,129,0.3)',
            boxShadow: '0 4px 24px rgba(16,185,129,0.12), inset 0 1px 0 rgba(255,255,255,0.06)',
          }}
        >
          {/* Glow orb */}
          <div
            className="absolute -top-6 -right-6 w-24 h-24 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)' }}
          />
          <div className="relative flex justify-between items-center">
            <div>
              <p className="text-[9px] text-emerald-500/70 uppercase tracking-[0.18em] font-semibold mb-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                Total Return
              </p>
              <p className="text-[10px] text-slate-500" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                Capital + Net Profit
              </p>
            </div>
            <div className="text-right">
              <p className="text-[22px] font-black text-emerald-300 leading-none" style={{ fontFamily: "'DM Sans', sans-serif", letterSpacing: '-0.03em' }}>
                {fmtFull(selectedCapital + previewNet)}
              </p>
              <p className="text-[10px] text-emerald-500/60 mt-0.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                +{(((selectedCapital + previewNet) / selectedCapital - 1) * 100).toFixed(0)}% ROI
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Join Button ──────────────────────────────────────────────────────────────

function JoinButton({
  selectedCapital,
  joining,
  currentTier,
  onJoin,
}: {
  selectedCapital: number | null;
  joining: boolean;
  currentTier: TierOption;
  onJoin: () => void;
}) {
  const isReady = selectedCapital !== null && !joining;

  return (
    <button
      onClick={onJoin}
      disabled={selectedCapital === null || joining}
      className="w-full relative overflow-hidden rounded-2xl transition-all duration-300 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed"
      style={isReady ? {
        boxShadow: `0 4px 24px ${currentTier.glowColor}, 0 1px 0 rgba(255,255,255,0.12) inset`,
        background: `linear-gradient(160deg, ${currentTier.color}f0 0%, ${currentTier.color}cc 55%, ${currentTier.color}99 100%)`,
        border: `1px solid ${currentTier.color}80`,
      } : {
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      {/* Subtle top sheen */}
      {isReady && (
        <div
          className="absolute inset-x-0 top-0 h-[1px] pointer-events-none"
          style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.35) 50%, transparent 100%)' }}
        />
      )}

      {/* Shimmer sweep */}
      {isReady && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.09) 50%, transparent 70%)`,
            animation: 'shimmer 2.8s ease-in-out infinite',
          }}
        />
      )}

      <div
        className="relative flex items-center px-5 py-[14px]"
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      >
        {joining ? (
          <div className="flex items-center justify-center w-full gap-3">
            <span
              className="w-[18px] h-[18px] rounded-full border-2 border-t-transparent animate-spin flex-shrink-0"
              style={{ borderColor: 'rgba(0,0,0,0.5)', borderTopColor: 'transparent' }}
            />
            <span className="text-[13px] font-semibold text-black/70 tracking-wide">Processing…</span>
          </div>
        ) : isReady ? (
          <>
            {/* Left: Icon */}
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mr-3.5"
              style={{
                background: 'rgba(0,0,0,0.18)',
                border: '1px solid rgba(0,0,0,0.12)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="rgba(0,0,0,0.75)"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>

            {/* Center: Text */}
            <div className="flex flex-col text-left flex-1 min-w-0">
              <span
                className="text-[14px] font-bold leading-snug tracking-[0.01em]"
                style={{ color: 'rgba(0,0,0,0.85)' }}
              >
                Join {currentTier.label} Package
              </span>
              <span
                className="text-[11px] font-medium leading-snug mt-[1px]"
                style={{ color: 'rgba(0,0,0,0.50)' }}
              >
                {fmtFull(selectedCapital!)} &nbsp;&bull;&nbsp; Activate Now
              </span>
            </div>

            {/* Right: Arrow */}
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ml-3"
              style={{
                background: 'rgba(0,0,0,0.12)',
                border: '1px solid rgba(0,0,0,0.08)',
              }}
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="rgba(0,0,0,0.60)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
            </div>
          </>
        ) : (
          <span className="w-full text-center text-[13px] font-semibold text-slate-500 tracking-wide py-0.5">
            Select a Package to Continue
          </span>
        )}
      </div>
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function InvestmentPackagePage() {
  const router = useRouter();
  const supabase = createClient();

  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [walletLoading, setWalletLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);

  const [activePackages, setActivePackages] = useState<InvestmentPackage[]>([]);
  const [historyPackages, setHistoryPackages] = useState<InvestmentPackage[]>([]);
  const [packagesLoading, setPackagesLoading] = useState(true);

  const [selectedTier, setSelectedTier] = useState<Tier>('basic');
  const [selectedCapital, setSelectedCapital] = useState<number | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<Duration>('3h');
  const [joining, setJoining] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const [tab, setTab] = useState<'packages' | 'active' | 'history'>('packages');

  // ── Auth ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/login'); return; }
      setUserId(user.id);
      setUserEmail(user.email ?? '');
      const { data: profile } = await supabase.from('profiles').select('avatar_url').eq('id', user.id).maybeSingle();
      if (profile?.avatar_url) setAvatarUrl(profile.avatar_url);
      setAuthChecked(true);
    };
    check();
  }, []);

  // ── Wallet ────────────────────────────────────────────────────────────────

  const fetchWallet = useCallback(async () => {
    setWalletLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: wallets } = await supabase.from('wallets').select('*').eq('user_id', user.id);
      if (wallets && wallets.length > 0) {
        const demo = wallets.find((w: any) => w.is_demo === true);
        const real = wallets.find((w: any) => w.is_demo === false);
        setWallet({ demoBalance: demo?.balance ?? 0, realBalance: real?.balance ?? 0 });
      } else {
        setWallet({ demoBalance: 0, realBalance: 0 });
      }
    } finally {
      setWalletLoading(false);
    }
  }, []);

  // ── Packages ──────────────────────────────────────────────────────────────

  const fetchPackages = useCallback(async () => {
    if (!userId) return;
    setPackagesLoading(true);
    try {
      await supabase.rpc('settle_expired_investment_packages');

      const { data } = await supabase
        .from('investment_packages')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      const all = (data ?? []) as InvestmentPackage[];
      setActivePackages(all.filter(p => p.status === 'active'));
      setHistoryPackages(all.filter(p => p.status !== 'active'));
    } finally {
      setPackagesLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (authChecked && userId) {
      fetchWallet();
      fetchPackages();
    }
  }, [authChecked, userId, fetchWallet, fetchPackages]);

  // ── Supabase Realtime: live wallet balance updates ──────────────────────────
  useRealtimeDashboard({
    userId,
    channelPrefix: 'investment-page',
    onWalletUpdate: (w) => {
      setWallet({ demoBalance: w.demoBalance, realBalance: w.realBalance });
      setWalletLoading(false);
    },
  });

  // ── Join Package ──────────────────────────────────────────────────────────

  const handleJoin = async () => {
    if (!userId || selectedCapital === null) return;

    const tier = TIERS.find(t => t.id === selectedTier)!;
    const pkg = tier.packages.find(p => p.capital === selectedCapital)!;
    const dur = DURATION_OPTIONS.find(d => d.id === selectedDuration)!;
    const grossProfit = getProfit(pkg.baseProfit, dur.factor);
    const realBalance = wallet?.realBalance ?? 0;

    if (realBalance < selectedCapital) {
      setToast({ message: `Insufficient balance. You need ${fmtFull(selectedCapital)} in your real wallet.`, type: 'error' });
      return;
    }

    setJoining(true);
    try {
      const expiresAt = new Date(Date.now() + dur.seconds * 1000).toISOString();

      const { error: walletErr } = await supabase
        .from('wallets')
        .update({ balance: realBalance - selectedCapital, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('is_demo', false);

      if (walletErr) throw walletErr;

      const { error: pkgErr } = await supabase.from('investment_packages').insert({
        user_id: userId,
        tier: selectedTier,
        capital_usd: selectedCapital,
        duration: selectedDuration,
        gross_profit_usd: grossProfit,
        expires_at: expiresAt,
      });

      if (pkgErr) throw pkgErr;

      setToast({ message: `Successfully joined ${tier.label} package! Your investment is now active.`, type: 'success' });
      setSelectedCapital(null);
      await fetchWallet();
      await fetchPackages();
      setTab('active');
    } catch (err: any) {
      setToast({ message: err?.message ?? 'Failed to join package. Please try again.', type: 'error' });
    } finally {
      setJoining(false);
    }
  };

  // ── Derived ───────────────────────────────────────────────────────────────

  const currentTier = TIERS.find(t => t.id === selectedTier)!;
  const currentDur = DURATION_OPTIONS.find(d => d.id === selectedDuration)!;
  const selectedPkg = currentTier.packages.find(p => p.capital === selectedCapital);
  const previewGrossProfit = selectedPkg ? getProfit(selectedPkg.baseProfit, currentDur.factor) : null;
  const previewFee = previewGrossProfit ? Math.round(previewGrossProfit * 0.2) : null;
  const previewNet = previewGrossProfit && previewFee ? previewGrossProfit - previewFee : null;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen text-white flex flex-col" style={{ background: 'linear-gradient(160deg, #060810 0%, #080b12 50%, #060810 100%)' }}>
      {/* DM Sans font */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          60%, 100% { transform: translateX(100%); }
        }
      `}</style>

      {authChecked && (
        <DashboardTopBar
          userEmail={userEmail}
          avatarUrl={avatarUrl}
          wallet={wallet}
          walletLoading={walletLoading}
          isDemo={isDemo}
          onToggleDemo={(val: boolean) => setIsDemo(val)}
          onDepositClick={() => setShowDepositModal(true)}
        />
      )}

      {showDepositModal && userId && (
        <DepositModal
          isOpen={showDepositModal}
          onClose={() => setShowDepositModal(false)}
          userId={userId}
          isDemo={isDemo}
        />
      )}

      <div className="flex-1 overflow-y-auto px-3 py-4 max-w-2xl mx-auto w-full pb-8">

        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 text-xs mb-4 transition-colors group"
          >
            <svg className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Trade
          </button>

          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #0f2040 100%)', border: '1px solid rgba(56,189,248,0.2)' }}>
                  <svg className="w-3.5 h-3.5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <h1 className="text-base font-bold text-white tracking-tight">Investment Package</h1>
              </div>
              <p className="text-[11px] text-slate-500 ml-9">Fixed-term investment with guaranteed returns</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] text-slate-600 uppercase tracking-widest mb-0.5">Real Balance</p>
              <p className="text-sm font-bold text-white">{fmtFull(wallet?.realBalance ?? 0)}</p>
              <div className="flex items-center justify-end gap-1 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <p className="text-[9px] text-emerald-500">Live</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 rounded-xl p-1 mb-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          {(['packages', 'active', 'history'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="flex-1 py-2 text-xs font-semibold rounded-lg transition-all capitalize"
              style={tab === t ? {
                background: 'linear-gradient(135deg, rgba(56,189,248,0.15) 0%, rgba(99,102,241,0.1) 100%)',
                color: '#e2e8f0',
                border: '1px solid rgba(56,189,248,0.2)',
                boxShadow: '0 2px 8px rgba(56,189,248,0.1)',
              } : {
                color: '#475569',
                border: '1px solid transparent',
              }}
            >
              {t === 'active' ? `Active${activePackages.length > 0 ? ` (${activePackages.length})` : ''}` : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* ── PACKAGES TAB ── */}
        {tab === 'packages' && (
          <div className="flex flex-col gap-5">

            {/* Tier Selector */}
            <div className="grid grid-cols-4 gap-2">
              {TIERS.map(tier => (
                <button
                  key={tier.id}
                  onClick={() => { setSelectedTier(tier.id); setSelectedCapital(null); }}
                  className="relative py-3 rounded-xl text-xs font-bold transition-all overflow-hidden"
                  style={{
                    border: `1px solid ${selectedTier === tier.id ? tier.color : 'rgba(255,255,255,0.07)'}`,
                    background: selectedTier === tier.id ? tier.gradient : 'rgba(255,255,255,0.03)',
                    color: selectedTier === tier.id ? tier.color : '#475569',
                    boxShadow: selectedTier === tier.id ? `0 0 16px ${tier.glowColor}, inset 0 1px 0 rgba(255,255,255,0.05)` : 'none',
                  }}
                >
                  <div className="flex flex-col items-center gap-1">
                    <span style={{ color: selectedTier === tier.id ? tier.color : '#475569' }}>
                      <TierIcon tier={tier.id} />
                    </span>
                    <span>{tier.label}</span>
                  </div>
                  {selectedTier === tier.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-xl" style={{ background: tier.color, opacity: 0.6 }} />
                  )}
                </button>
              ))}
            </div>

            {/* Tier Info Banner */}
            <div
              className="rounded-xl p-4"
              style={{
                background: currentTier.gradient,
                border: `1px solid ${currentTier.borderColor}`,
                boxShadow: `0 4px 20px ${currentTier.glowColor}`,
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: currentTier.badgeBg, border: `1px solid ${currentTier.borderColor}` }}>
                    <span style={{ color: currentTier.color }}>
                      <TierIcon tier={currentTier.id} />
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest" style={{ color: currentTier.color }}>
                      {currentTier.label} Tier
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      From {fmt(currentTier.packages[0].capital)} &middot; {currentTier.packages.length} options
                    </p>
                    <div className="mt-1.5">
                      <TierFollowersBadge tier={currentTier.id} color={currentTier.color} />
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[9px] text-slate-600 uppercase tracking-wider">Max Profit</p>
                  <p className="text-sm font-extrabold" style={{ color: currentTier.color }}>
                    {fmt(getProfit(currentTier.packages[currentTier.packages.length - 1].baseProfit, 3.2))}
                  </p>
                </div>
              </div>
            </div>

            {/* Capital Selection */}
            <div>
              <p className="text-[10px] text-slate-600 uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
                <span className="w-3 h-px bg-slate-700 inline-block" />
                Select Capital Amount
                <span className="w-3 h-px bg-slate-700 inline-block" />
              </p>
              <div className="grid grid-cols-2 gap-2">
                {currentTier.packages.map(pkg => (
                  <button
                    key={pkg.capital}
                    onClick={() => setSelectedCapital(pkg.capital)}
                    className="rounded-xl p-3.5 text-left transition-all relative overflow-hidden"
                    style={{
                      border: `1px solid ${selectedCapital === pkg.capital ? currentTier.color : 'rgba(255,255,255,0.07)'}`,
                      background: selectedCapital === pkg.capital
                        ? currentTier.gradient
                        : 'rgba(255,255,255,0.03)',
                      boxShadow: selectedCapital === pkg.capital ? `0 0 14px ${currentTier.glowColor}` : 'none',
                    }}
                  >
                    {selectedCapital === pkg.capital && (
                      <div className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: currentTier.color }}>
                        <svg className="w-2.5 h-2.5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                    <p className="text-sm font-extrabold text-white">{fmtFull(pkg.capital)}</p>
                    <p className="text-[10px] mt-1 font-medium" style={{ color: currentTier.color }}>
                      up to {fmt(getProfit(pkg.baseProfit, 3.2))} profit
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Duration Selection */}
            <div>
              <p className="text-[10px] text-slate-600 uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
                <span className="w-3 h-px bg-slate-700 inline-block" />
                Select Duration
                <span className="w-3 h-px bg-slate-700 inline-block" />
              </p>
              <div className="grid grid-cols-4 gap-2">
                {DURATION_OPTIONS.map(dur => (
                  <button
                    key={dur.id}
                    onClick={() => setSelectedDuration(dur.id)}
                    className="rounded-xl py-3 text-center transition-all relative overflow-hidden"
                    style={{
                      border: `1px solid ${selectedDuration === dur.id ? currentTier.color : 'rgba(255,255,255,0.07)'}`,
                      background: selectedDuration === dur.id ? currentTier.gradient : 'rgba(255,255,255,0.03)',
                      boxShadow: selectedDuration === dur.id ? `0 0 12px ${currentTier.glowColor}` : 'none',
                    }}
                  >
                    <p className="text-xs font-bold" style={{ color: selectedDuration === dur.id ? currentTier.color : '#64748b' }}>
                      {dur.label}
                    </p>
                    <p className="text-[9px] mt-0.5 font-semibold" style={{ color: selectedDuration === dur.id ? `${currentTier.color}99` : '#334155' }}>
                      x{dur.factor}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Profit Preview — redesigned */}
            {selectedCapital !== null && previewGrossProfit !== null && previewFee !== null && previewNet !== null && (
              <ProfitBreakdown
                selectedCapital={selectedCapital}
                currentTier={currentTier}
                currentDur={currentDur}
                previewGrossProfit={previewGrossProfit}
                previewFee={previewFee}
                previewNet={previewNet}
              />
            )}

            {/* Warning */}
            <div className="rounded-xl p-3.5" style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.18)' }}>
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: 'rgba(245,158,11,0.15)' }}>
                  <svg className="w-3 h-3 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  </svg>
                </div>
                <p className="text-[10px] text-amber-400/70 leading-relaxed">
                  Investment packages <strong className="text-amber-400">cannot be cancelled</strong> once joined. Capital is locked until the duration expires. A 20% platform fee is deducted from gross profit.
                </p>
              </div>
            </div>

            {/* Join Button — redesigned */}
            <JoinButton
              selectedCapital={selectedCapital}
              joining={joining}
              currentTier={currentTier}
              onJoin={handleJoin}
            />
          </div>
        )}

        {/* ── ACTIVE TAB ── */}
        {tab === 'active' && (
          <div className="flex flex-col gap-3">
            {packagesLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : activePackages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <svg className="w-6 h-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <p className="text-sm text-slate-500 font-medium">No active investments</p>
                <button onClick={() => setTab('packages')} className="text-xs text-sky-400 hover:text-sky-300 transition-colors font-semibold">
                  Browse packages &rarr;
                </button>
              </div>
            ) : (
              activePackages.map(pkg => {
                const tier = TIERS.find(t => t.id === pkg.tier)!;
                return (
                  <div
                    key={pkg.id}
                    className="rounded-xl p-4"
                    style={{
                      background: tier.gradient,
                      border: `1px solid ${tier.borderColor}`,
                      boxShadow: `0 4px 20px ${tier.glowColor}`,
                    }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: tier.badgeBg, border: `1px solid ${tier.borderColor}` }}>
                          <span style={{ color: tier.color }}><TierIcon tier={tier.id} /></span>
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: tier.color }}>
                          {tier.label}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(255,255,255,0.07)', color: '#64748b' }}>
                          {pkg.duration}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)' }}>
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-[10px] text-emerald-400 font-semibold">Active</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="rounded-lg p-2.5" style={{ background: 'rgba(0,0,0,0.2)' }}>
                        <p className="text-[9px] text-slate-600 uppercase tracking-wider mb-1">Capital Locked</p>
                        <p className="text-sm font-extrabold text-white">{fmtFull(pkg.capital_usd)}</p>
                      </div>
                      <div className="rounded-lg p-2.5" style={{ background: 'rgba(0,0,0,0.2)' }}>
                        <p className="text-[9px] text-slate-600 uppercase tracking-wider mb-1">Gross Profit</p>
                        <p className="text-sm font-extrabold" style={{ color: tier.color }}>{fmtFull(pkg.gross_profit_usd)}</p>
                      </div>
                      <div className="rounded-lg p-2.5" style={{ background: 'rgba(0,0,0,0.2)' }}>
                        <p className="text-[9px] text-slate-600 uppercase tracking-wider mb-1">Platform Fee</p>
                        <p className="text-xs font-bold text-rose-400">-{fmtFull(pkg.gross_profit_usd * 0.2)}</p>
                      </div>
                      <div className="rounded-lg p-2.5" style={{ background: 'rgba(0,0,0,0.2)' }}>
                        <p className="text-[9px] text-slate-600 uppercase tracking-wider mb-1">Net Profit</p>
                        <p className="text-xs font-bold text-emerald-400">{fmtFull(pkg.gross_profit_usd * 0.8)}</p>
                      </div>
                    </div>

                    <div className="rounded-lg p-3 flex items-center justify-between" style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div>
                        <p className="text-[9px] text-slate-600 uppercase tracking-wider mb-1">Time Remaining</p>
                        <CountdownCell expiresAt={pkg.expires_at} onExpired={fetchPackages} />
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] text-slate-600 uppercase tracking-wider mb-1">Total Return</p>
                        <p className="text-sm font-extrabold text-emerald-300">{fmtFull(pkg.capital_usd + pkg.gross_profit_usd * 0.8)}</p>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-1.5">
                      <svg className="w-3 h-3 text-amber-500/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <p className="text-[10px] text-amber-500/50">Cannot be cancelled &middot; Auto-completes on expiry</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ── HISTORY TAB ── */}
        {tab === 'history' && (
          <div className="flex flex-col gap-3">
            {packagesLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : historyPackages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <svg className="w-6 h-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <circle cx="12" cy="12" r="9" strokeLinecap="round" strokeLinejoin="round" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3.5 3.5" />
                  </svg>
                </div>
                <p className="text-sm text-slate-500 font-medium">No completed investments yet</p>
              </div>
            ) : (
              historyPackages.map(pkg => {
                const tier = TIERS.find(t => t.id === pkg.tier)!;
                return (
                  <div
                    key={pkg.id}
                    className="rounded-xl p-4"
                    style={{
                      background: 'linear-gradient(135deg, rgba(15,23,42,0.8) 0%, rgba(10,15,30,0.8) 100%)',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: tier.badgeBg }}>
                          <span style={{ color: tier.color }}><TierIcon tier={tier.id} /></span>
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: tier.color }}>
                          {tier.label}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)', color: '#475569' }}>
                          {pkg.duration}
                        </span>
                      </div>
                      <span className="text-[10px] px-2.5 py-1 rounded-full font-semibold" style={{ background: 'rgba(255,255,255,0.06)', color: '#64748b', border: '1px solid rgba(255,255,255,0.08)' }}>
                        Completed
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="rounded-lg p-2.5" style={{ background: 'rgba(255,255,255,0.03)' }}>
                        <p className="text-[9px] text-slate-600 uppercase tracking-wider mb-1">Capital</p>
                        <p className="text-xs font-bold text-slate-300">{fmtFull(pkg.capital_usd)}</p>
                      </div>
                      <div className="rounded-lg p-2.5" style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.1)' }}>
                        <p className="text-[9px] text-slate-600 uppercase tracking-wider mb-1">Net Profit</p>
                        <p className="text-xs font-bold text-emerald-400">{fmtFull(pkg.net_profit_usd)}</p>
                      </div>
                      <div className="rounded-lg p-2.5" style={{ background: 'rgba(16,185,129,0.04)' }}>
                        <p className="text-[9px] text-slate-600 uppercase tracking-wider mb-1">Total Return</p>
                        <p className="text-xs font-bold text-emerald-300">{fmtFull(pkg.capital_usd + pkg.net_profit_usd)}</p>
                      </div>
                    </div>
                    {pkg.completed_at && (
                      <p className="text-[10px] text-slate-700 mt-2.5">
                        Completed {new Date(pkg.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
