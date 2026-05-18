'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useRealtimeDashboard } from '@/lib/hooks/useRealtimeDashboard';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Wallet {
  realBalance: number;
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
  platform_fee_percent?: number;
  platform_fee_amount?: number;
  net_profit_loss?: number;
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error' | 'info'; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  const colors = {
    success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
    error: 'bg-red-500/10 border-red-500/30 text-red-300',
    info: 'bg-blue-500/10 border-blue-500/30 text-blue-300',
  };

  return (
    <div className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl border text-xs font-medium shadow-2xl max-w-xs w-full text-center backdrop-blur-md ${colors[type]}`}>
      {message}
    </div>
  );
}

// ─── Random Followers Hook ────────────────────────────────────────────────────

function useRandomFollowers(min: number, max: number, intervalMs: number) {
  const [count, setCount] = useState(() => {
    const seed = Math.floor(Date.now() / (5 * 60 * 1000));
    const pseudoRandom = ((seed * 1664525 + 1013904223) & 0x7fffffff) / 0x7fffffff;
    return Math.floor(pseudoRandom * (max - min + 1)) + min;
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCount((prev) => {
        const delta = Math.floor(Math.random() * 16) + 5;
        const direction = Math.random() < 0.5 ? 1 : -1;
        const next = prev + direction * delta;
        return Math.max(min, Math.min(max, next));
      });
    }, intervalMs);
    return () => clearInterval(timer);
  }, [min, max, intervalMs]);

  return count;
}

// ─── Tradiglo Brand Logo ─────────────────────────────────────────────────────

function TradigloLogo({ size = 36 }: { size?: number }) {
  return (
    <div
      style={{
        width: size, height: size,
        background: 'linear-gradient(135deg, #60a5fa 0%, #818cf8 50%, #a78bfa 100%)',
        WebkitMaskImage: 'url(/assets/images/chart-646_1024-1773102864640.png)',
        WebkitMaskSize: 'contain', WebkitMaskRepeat: 'no-repeat', WebkitMaskPosition: 'center',
        maskImage: 'url(/assets/images/chart-646_1024-1773102864640.png)',
        maskSize: 'contain', maskRepeat: 'no-repeat', maskPosition: 'center',
        flexShrink: 0,
        filter: 'drop-shadow(0 0 6px rgba(129,140,248,0.5))',
      }}
    />
  );
}

// ─── Score Bar ────────────────────────────────────────────────────────────────

function ScoreBar({ label, value, index }: { label: string; value: number; index: number }) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 100 + index * 80);
    return () => clearTimeout(t);
  }, [index]);

  const gradients = [
    'linear-gradient(90deg, #6366f1 0%, #818cf8 50%, #34d399 100%)',
    'linear-gradient(90deg, #8b5cf6 0%, #a78bfa 50%, #06b6d4 100%)',
    'linear-gradient(90deg, #3b82f6 0%, #60a5fa 50%, #818cf8 100%)',
    'linear-gradient(90deg, #6366f1 0%, #c084fc 50%, #f472b6 100%)',
    'linear-gradient(90deg, #0ea5e9 0%, #6366f1 50%, #8b5cf6 100%)',
  ];
  const glows = [
    '0 0 10px rgba(99,102,241,0.5), 0 0 20px rgba(52,211,153,0.2)',
    '0 0 10px rgba(139,92,246,0.5), 0 0 20px rgba(6,182,212,0.2)',
    '0 0 10px rgba(59,130,246,0.5), 0 0 20px rgba(129,140,248,0.2)',
    '0 0 10px rgba(99,102,241,0.5), 0 0 20px rgba(244,114,182,0.2)',
    '0 0 10px rgba(14,165,233,0.5), 0 0 20px rgba(139,92,246,0.2)',
  ];

  return (
    <div className="flex items-center gap-3">
      <span className="text-[11px] w-[76px] flex-shrink-0 font-medium" style={{ color: 'rgba(255,255,255,0.45)', letterSpacing: '0.01em' }}>{label}</span>
      <div className="flex-1 rounded-full overflow-hidden relative" style={{ height: '7px', background: 'rgba(255,255,255,0.05)' }}>
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: animated ? `${(value / 10) * 100}%` : '0%',
            background: gradients[index % gradients.length],
            boxShadow: glows[index % glows.length],
          }}
        />
      </div>
      <span className="text-[11px] font-bold w-8 text-right tabular-nums" style={{ color: 'rgba(255,255,255,0.7)' }}>{value}<span style={{ color: 'rgba(255,255,255,0.25)', fontWeight: 400 }}>/10</span></span>
    </div>
  );
}

// ─── Copy Trade Page ──────────────────────────────────────────────────────────

export default function CopyTradePage() {
  const router = useRouter();
  const supabase = createClient();

  const [userId, setUserId] = useState<string | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [provider, setProvider] = useState<CopyTradeProvider | null>(null);
  const [follower, setFollower] = useState<CopyTradeFollower | null>(null);
  const [copyResults, setCopyResults] = useState<CopyTradeResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const activeFollowersCount = useRandomFollowers(113847, 238519, 5000);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.replace('/login');
        return;
      }
      setUserId(data.user.id);
    });
  }, []);

  const fetchData = useCallback(async (uid: string) => {
    setLoading(true);
    try {
      const [providerRes, followerRes, walletRes, resultsRes] = await Promise.all([
        supabase.from('copy_trade_providers').select('*').eq('is_active', true).limit(1).single(),
        supabase.from('copy_trade_followers').select('*').eq('user_id', uid).order('followed_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('wallets').select('balance').eq('user_id', uid).eq('is_demo', false).maybeSingle(),
        supabase.from('copy_trade_results').select('*, copy_trades(asset_symbol, direction, opened_at, closed_at, status)').eq('user_id', uid).order('created_at', { ascending: false }).limit(20),
      ]);
      if (providerRes.data) setProvider(providerRes.data);
      setFollower(followerRes.data ?? null);
      if (walletRes.data) {
        setWallet({ realBalance: walletRes.data.balance ?? 0 });
      } else {
        setWallet({ realBalance: 0 });
      }
      setCopyResults((resultsRes.data as any) ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (userId) fetchData(userId);
  }, [userId, fetchData]);

  // ── Supabase Realtime: live wallet balance updates ──────────────────────────
  useRealtimeDashboard({
    userId,
    channelPrefix: 'copytrade-page',
    onWalletUpdate: (w) => {
      setWallet({ realBalance: w.realBalance });
    },
  });

  const handleFollow = async () => {
    if (!provider || !userId) return;
    const realBalance = wallet?.realBalance ?? 0;
    if (realBalance < provider.min_balance_usd) {
      setToast({ message: `Insufficient balance. Minimum required: $${provider.min_balance_usd.toLocaleString()} USD`, type: 'error' });
      return;
    }
    setActionLoading(true);
    try {
      if (follower) {
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
      await fetchData(userId);
    } catch (err: any) {
      setToast({ message: err?.message ?? 'Failed to follow', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleStopFollow = async () => {
    if (!follower || !userId) return;
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('copy_trade_followers')
        .update({ is_active: false, stopped_at: new Date().toISOString() })
        .eq('id', follower.id);
      if (error) throw error;
      setToast({ message: 'Stopped following Copy Trade', type: 'info' });
      await fetchData(userId);
    } catch (err: any) {
      setToast({ message: err?.message ?? 'Failed to stop', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const isFollowing = follower?.is_active === true;

  const scores = provider ? [
    { label: 'Activity', value: provider.activity_score },
    { label: 'Probability', value: provider.probability_score },
    { label: 'Reliability', value: provider.reliability_score },
    { label: 'Popularity', value: provider.popularity_score },
    { label: 'Experience', value: provider.experience_score },
  ] : [];

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto" style={{ background: '#05050a' }}>

      {/* ── Top Bar ── */}
      <div
        className="flex items-center gap-3 px-4 py-3.5 sticky top-0 z-20"
        style={{
          background: 'rgba(5,5,10,0.92)',
          backdropFilter: 'blur(28px)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 text-xs transition-colors group"
        >
          <svg className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Trade
        </button>
        <div className="flex-1">
          <h1 className="text-sm font-semibold tracking-wide" style={{ color: 'rgba(255,255,255,0.93)', fontFamily: 'DM Sans, sans-serif' }}>Copy Trade</h1>
          <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.28)', fontFamily: 'DM Sans, sans-serif' }}>Mirror expert trades automatically</p>
        </div>
        {isFollowing && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-semibold" style={{ color: '#34d399', fontFamily: 'DM Sans, sans-serif' }}>LIVE</span>
          </div>
        )}
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto pb-10">
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="relative w-10 h-10">
              <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20 border-t-indigo-400 animate-spin" />
              <div className="absolute inset-2 rounded-full border border-violet-500/20 border-t-violet-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }} />
            </div>
            <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'DM Sans, sans-serif' }}>Loading copy trade data…</span>
          </div>
        ) : !provider ? (
          <div className="px-6 py-16 text-center">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="rgba(255,255,255,0.2)" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'DM Sans, sans-serif' }}>Copy Trade not available</p>
          </div>
        ) : (
          <div className="space-y-3 px-4 pt-4 pb-4">

            {/* ── Hero Provider Card ── */}
            <div
              className="rounded-2xl overflow-hidden relative"
              style={{
                background: 'linear-gradient(145deg, #0c0c14 0%, #0a0a10 100%)',
                border: '1px solid rgba(99,102,241,0.15)',
                boxShadow: '0 0 0 1px rgba(255,255,255,0.03), 0 20px 60px rgba(0,0,0,0.7), 0 0 40px rgba(99,102,241,0.06)',
              }}
            >
              {/* Ambient glow top-right */}
              <div
                className="absolute top-0 right-0 w-40 h-40 pointer-events-none"
                style={{
                  background: 'radial-gradient(circle at 80% 20%, rgba(99,102,241,0.12) 0%, transparent 70%)',
                }}
              />
              {/* Ambient glow bottom-left */}
              <div
                className="absolute bottom-0 left-0 w-32 h-32 pointer-events-none"
                style={{
                  background: 'radial-gradient(circle at 20% 80%, rgba(52,211,153,0.07) 0%, transparent 70%)',
                }}
              />

              {/* Card Header */}
              <div className="relative px-5 pt-5 pb-4">
                <div className="flex items-start justify-between">
                  {/* Left: Logo + Name */}
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                      style={{
                        background: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(139,92,246,0.1) 100%)',
                        border: '1px solid rgba(99,102,241,0.25)',
                        boxShadow: '0 0 16px rgba(99,102,241,0.15)',
                      }}
                    >
                      <TradigloLogo size={28} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[15px] font-bold" style={{ color: 'rgba(255,255,255,0.95)', fontFamily: 'DM Sans, sans-serif', letterSpacing: '-0.01em' }}>{provider.name}</span>
                        <span
                          className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider"
                          style={{
                            background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.15))',
                            border: '1px solid rgba(99,102,241,0.3)',
                            color: '#a5b4fc',
                            letterSpacing: '0.08em',
                          }}
                        >
                          Official
                        </span>
                      </div>
                      <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'DM Sans, sans-serif' }}>{provider.description ?? 'Official Tradiglo Copy Trade'}</p>
                    </div>
                  </div>

                  {/* Right: Win Rate */}
                  <div className="text-right flex-shrink-0 ml-2">
                    <div
                      className="text-3xl font-black leading-none tabular-nums"
                      style={{
                        background: 'linear-gradient(135deg, #6ee7b7 0%, #34d399 50%, #10b981 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        filter: 'drop-shadow(0 0 12px rgba(52,211,153,0.5))',
                        fontFamily: 'DM Sans, sans-serif',
                      }}
                    >
                      {provider.win_rate}%
                    </div>
                    <div className="text-[9px] mt-1 font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.2)', letterSpacing: '0.14em', fontFamily: 'DM Sans, sans-serif' }}>Win Rate</div>
                  </div>
                </div>

                {/* Guarantee Badge */}
                <div
                  className="flex items-center gap-2 mt-4 px-3.5 py-2.5 rounded-xl"
                  style={{
                    background: 'linear-gradient(135deg, rgba(16,185,129,0.07) 0%, rgba(52,211,153,0.04) 100%)',
                    border: '1px solid rgba(52,211,153,0.18)',
                  }}
                >
                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="#34d399" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span className="text-[11px] font-medium" style={{ color: '#6ee7b7', fontFamily: 'DM Sans, sans-serif' }}>100% Balance Guarantee on Loss</span>
                </div>
              </div>

              {/* Divider */}
              <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent 0%, rgba(99,102,241,0.15) 30%, rgba(139,92,246,0.15) 70%, transparent 100%)' }} />

              {/* Stats Row */}
              <div className="relative grid grid-cols-3 px-5 py-4">
                {[
                  { label: 'Followers', value: activeFollowersCount.toLocaleString(), accent: false },
                  { label: 'Min Balance', value: `$${provider.min_balance_usd.toLocaleString()}`, accent: false },
                  { label: 'Win Rate', value: `${provider.win_rate}%`, accent: true },
                ].map((stat, i) => (
                  <div key={stat.label} className="text-center relative">
                    {i > 0 && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
                    )}
                    <div
                      className="text-[15px] font-bold tabular-nums leading-none"
                      style={stat.accent ? {
                        background: 'linear-gradient(135deg, #34d399, #10b981)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        fontFamily: 'DM Sans, sans-serif',
                      } : {
                        color: 'rgba(255,255,255,0.88)',
                        fontFamily: 'DM Sans, sans-serif',
                      }}
                    >
                      {stat.value}
                    </div>
                    <div className="text-[9px] mt-1.5 font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.22)', letterSpacing: '0.12em', fontFamily: 'DM Sans, sans-serif' }}>{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Divider */}
              <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent 0%, rgba(99,102,241,0.12) 30%, rgba(139,92,246,0.12) 70%, transparent 100%)' }} />

              {/* Score Bars */}
              <div className="relative px-5 py-5 space-y-3.5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.2)', letterSpacing: '0.12em', fontFamily: 'DM Sans, sans-serif' }}>Performance Scores</span>
                </div>
                {scores.map((s, i) => (
                  <ScoreBar key={s.label} label={s.label} value={s.value} index={i} />
                ))}
              </div>
            </div>

            {/* ── Action Card ── */}
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                background: 'linear-gradient(145deg, #0c0c14 0%, #0a0a10 100%)',
                border: '1px solid rgba(255,255,255,0.06)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              }}
            >
              <div className="px-5 py-5">
                {isFollowing ? (
                  <div className="space-y-3">
                    {/* Active status banner */}
                    <div
                      className="flex items-center gap-3 px-4 py-3.5 rounded-xl"
                      style={{
                        background: 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(139,92,246,0.05) 100%)',
                        border: '1px solid rgba(99,102,241,0.2)',
                      }}
                    >
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)' }}>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="#818cf8" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-[12px] font-semibold" style={{ color: '#a5b4fc', fontFamily: 'DM Sans, sans-serif' }}>Actively Copying Trades</p>
                        <p className="text-[10px] mt-0.5" style={{ color: 'rgba(165,180,252,0.55)', fontFamily: 'DM Sans, sans-serif' }}>Your account mirrors Tradiglo positions in real-time</p>
                      </div>
                    </div>

                    <button
                      onClick={handleStopFollow}
                      disabled={actionLoading}
                      className="w-full py-3.5 text-[13px] font-semibold rounded-xl transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{
                        background: 'rgba(239,68,68,0.07)',
                        border: '1px solid rgba(239,68,68,0.18)',
                        color: '#fca5a5',
                        letterSpacing: '0.02em',
                        fontFamily: 'DM Sans, sans-serif',
                      }}
                    >
                      {actionLoading ? (
                        <span className="w-4 h-4 border border-red-400/30 border-t-red-400 rounded-full animate-spin inline-block" />
                      ) : 'Stop Following'}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Balance row */}
                    <div
                      className="flex items-center justify-between px-4 py-3 rounded-xl"
                      style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.06)',
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="rgba(255,255,255,0.3)" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                        <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'DM Sans, sans-serif' }}>Real Balance</span>
                      </div>
                      <span
                        className="text-[13px] font-bold tabular-nums"
                        style={{
                          color: (wallet?.realBalance ?? 0) >= provider.min_balance_usd ? '#34d399' : 'rgba(255,255,255,0.7)',
                          fontFamily: 'DM Sans, sans-serif',
                        }}
                      >
                        ${formatCurrency(wallet?.realBalance ?? 0)}
                      </span>
                    </div>

                    {/* Insufficient balance warning */}
                    {(wallet?.realBalance ?? 0) < provider.min_balance_usd && (
                      <div
                        className="flex items-start gap-2.5 px-4 py-3 rounded-xl"
                        style={{
                          background: 'rgba(245,158,11,0.05)',
                          border: '1px solid rgba(245,158,11,0.15)',
                        }}
                      >
                        <svg className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="#fbbf24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                        </svg>
                        <span className="text-[11px]" style={{ color: 'rgba(251,191,36,0.8)', fontFamily: 'DM Sans, sans-serif' }}>
                          Minimum ${provider.min_balance_usd.toLocaleString()} USD required to start
                        </span>
                      </div>
                    )}

                    {/* 20% Fee notice */}
                    <div
                      className="flex items-start gap-3 px-4 py-3.5 rounded-xl"
                      style={{
                        background: 'linear-gradient(135deg, rgba(99,102,241,0.06) 0%, rgba(139,92,246,0.04) 100%)',
                        border: '1px solid rgba(99,102,241,0.15)',
                      }}
                    >
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)' }}>
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="#818cf8" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold" style={{ color: '#a5b4fc', fontFamily: 'DM Sans, sans-serif' }}>20% Platform Fee on Profit</p>
                        <p className="text-[10px] mt-0.5 leading-relaxed" style={{ color: 'rgba(165,180,252,0.55)', fontFamily: 'DM Sans, sans-serif' }}>
                          Automatically deducted from profits only. Example: $100 profit → you receive $80.
                        </p>
                      </div>
                    </div>

                    {/* Follow Button */}
                    <button
                      onClick={handleFollow}
                      disabled={actionLoading || (wallet?.realBalance ?? 0) < provider.min_balance_usd}
                      className="w-full relative overflow-hidden rounded-xl transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{
                        padding: '0',
                        background: 'transparent',
                        border: 'none',
                      }}
                    >
                      <div
                        className="relative w-full py-4 rounded-xl overflow-hidden"
                        style={{
                          background: 'linear-gradient(135deg, #312e81 0%, #4338ca 30%, #4f46e5 60%, #6d28d9 100%)',
                          boxShadow: (wallet?.realBalance ?? 0) >= provider.min_balance_usd
                            ? '0 0 0 1px rgba(99,102,241,0.4), 0 4px 24px rgba(99,102,241,0.4), 0 8px 40px rgba(99,102,241,0.2)'
                            : '0 2px 8px rgba(0,0,0,0.3)',
                        }}
                      >
                        {/* Top sheen */}
                        <div className="absolute inset-x-0 top-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)' }} />
                        {/* Inner highlight */}
                        <div className="absolute inset-x-0 top-0 h-1/2 rounded-t-xl" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, transparent 100%)' }} />
                        {/* Shimmer sweep */}
                        <div
                          className="absolute inset-0 pointer-events-none"
                          style={{
                            background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.06) 50%, transparent 70%)',
                            animation: 'shimmer 3s infinite',
                          }}
                        />

                        {actionLoading ? (
                          <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin inline-block" />
                        ) : (
                          <div className="flex items-center justify-center gap-2.5">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="rgba(255,255,255,0.9)" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                            <span className="text-[14px] font-bold tracking-wide" style={{ color: 'rgba(255,255,255,0.97)', fontFamily: 'DM Sans, sans-serif', letterSpacing: '0.03em' }}>
                              Follow Tradiglo
                            </span>
                          </div>
                        )}
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* ── Profit History ── */}
            {copyResults.length > 0 && (
              <div
                className="rounded-2xl overflow-hidden"
                style={{
                  background: 'linear-gradient(145deg, #0c0c14 0%, #0a0a10 100%)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                }}
              >
                {/* Section Header */}
                <div
                  className="flex items-center justify-between px-5 py-4"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-1 h-4 rounded-full" style={{ background: 'linear-gradient(180deg, #6366f1, #8b5cf6)' }} />
                    <span className="text-[12px] font-semibold" style={{ color: 'rgba(255,255,255,0.75)', fontFamily: 'DM Sans, sans-serif', letterSpacing: '0.01em' }}>Trade History</span>
                  </div>
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{
                      background: 'rgba(99,102,241,0.1)',
                      border: '1px solid rgba(99,102,241,0.2)',
                      color: '#a5b4fc',
                      fontFamily: 'DM Sans, sans-serif',
                    }}
                  >
                    {copyResults.length} trades
                  </span>
                </div>

                {/* Trade Rows */}
                <div className="px-4 py-3 space-y-2">
                  {copyResults.map((r) => {
                    const isWon = r.status === 'won';
                    const isLost = r.status === 'lost';
                    const grossProfit = r.profit_loss ?? 0;
                    const feeAmount = r.platform_fee_amount ?? (isWon && grossProfit > 0 ? grossProfit * 0.2 : 0);
                    const netProfit = r.net_profit_loss ?? (isWon && grossProfit > 0 ? grossProfit - feeAmount : grossProfit);
                    const symbol = r.copy_trades?.asset_symbol ?? '—';
                    const direction = r.copy_trades?.direction ?? '';
                    const dateStr = new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

                    return (
                      <div
                        key={r.id}
                        className="rounded-xl px-4 py-3.5 relative overflow-hidden"
                        style={{
                          background: isWon
                            ? 'linear-gradient(135deg, rgba(52,211,153,0.04) 0%, rgba(16,185,129,0.02) 100%)'
                            : isLost
                            ? 'linear-gradient(135deg, rgba(239,68,68,0.04) 0%, rgba(220,38,38,0.02) 100%)'
                            : 'rgba(255,255,255,0.02)',
                          border: isWon
                            ? '1px solid rgba(52,211,153,0.12)'
                            : isLost
                            ? '1px solid rgba(239,68,68,0.12)'
                            : '1px solid rgba(255,255,255,0.05)',
                        }}
                      >
                        {/* Left accent line */}
                        <div
                          className="absolute left-0 top-3 bottom-3 w-0.5 rounded-full"
                          style={{
                            background: isWon ? '#34d399' : isLost ? '#f87171' : 'rgba(255,255,255,0.1)',
                          }}
                        />

                        {/* Row 1: Asset + Status + Date */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[12px] font-bold" style={{ color: 'rgba(255,255,255,0.85)', fontFamily: 'DM Sans, sans-serif' }}>{symbol}</span>
                            {direction && (
                              <span
                                className="px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider"
                                style={{
                                  background: direction === 'BUY' ? 'rgba(52,211,153,0.1)' : 'rgba(239,68,68,0.1)',
                                  color: direction === 'BUY' ? '#34d399' : '#f87171',
                                  border: `1px solid ${direction === 'BUY' ? 'rgba(52,211,153,0.2)' : 'rgba(239,68,68,0.2)'}`,
                                  fontFamily: 'DM Sans, sans-serif',
                                }}
                              >
                                {direction}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider"
                              style={{
                                background: isWon ? 'rgba(52,211,153,0.1)' : isLost ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.05)',
                                color: isWon ? '#34d399' : isLost ? '#f87171' : 'rgba(255,255,255,0.35)',
                                border: `1px solid ${isWon ? 'rgba(52,211,153,0.2)' : isLost ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.08)'}`,
                                fontFamily: 'DM Sans, sans-serif',
                                letterSpacing: '0.06em',
                              }}
                            >
                              {r.status}
                            </span>
                            <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'DM Sans, sans-serif' }}>{dateStr}</span>
                          </div>
                        </div>

                        {/* Row 2: Profit breakdown */}
                        {isWon && grossProfit > 0 ? (
                          <div className="space-y-1.5 mt-2 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                            <div className="flex items-center justify-between">
                              <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'DM Sans, sans-serif' }}>Gross Profit</span>
                              <span className="text-[10px] font-medium tabular-nums" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'DM Sans, sans-serif' }}>+${formatCurrency(grossProfit)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-[10px]" style={{ color: 'rgba(248,113,113,0.6)', fontFamily: 'DM Sans, sans-serif' }}>Platform Fee (20%)</span>
                              <span className="text-[10px] font-medium tabular-nums" style={{ color: 'rgba(248,113,113,0.6)', fontFamily: 'DM Sans, sans-serif' }}>−${formatCurrency(feeAmount)}</span>
                            </div>
                            <div className="flex items-center justify-between pt-1.5" style={{ borderTop: '1px solid rgba(52,211,153,0.1)' }}>
                              <span className="text-[10px] font-semibold" style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'DM Sans, sans-serif' }}>You Received</span>
                              <span className="text-[12px] font-bold tabular-nums" style={{ color: '#34d399', fontFamily: 'DM Sans, sans-serif' }}>+${formatCurrency(netProfit)}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between mt-2 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                            <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'DM Sans, sans-serif' }}>Amount</span>
                            <span
                              className="text-[12px] font-bold tabular-nums"
                              style={{ color: isLost ? '#f87171' : 'rgba(255,255,255,0.5)', fontFamily: 'DM Sans, sans-serif' }}
                            >
                              {isLost ? `−$${formatCurrency(Math.abs(grossProfit))}` : `$${formatCurrency(r.amount)}`}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
}
