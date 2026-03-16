'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

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
    // Time-based seed: bucket into 5-minute windows so refresh gives same starting point
    const seed = Math.floor(Date.now() / (5 * 60 * 1000));
    const pseudoRandom = ((seed * 1664525 + 1013904223) & 0x7fffffff) / 0x7fffffff;
    return Math.floor(pseudoRandom * (max - min + 1)) + min;
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCount((prev) => {
        // Small delta: ±5 to ±20 only
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

// ─── Investoft Brand Logo ─────────────────────────────────────────────────────

function InvestoftLogo() {
  return (
    <div
      style={{
        width: 28, height: 28,
        background: 'linear-gradient(to right, #60a5fa, #6366f1, #a855f7)',
        WebkitMaskImage: 'url(/assets/images/chart-646_1024-1773102864640.png)',
        WebkitMaskSize: 'contain', WebkitMaskRepeat: 'no-repeat', WebkitMaskPosition: 'center',
        maskImage: 'url(/assets/images/chart-646_1024-1773102864640.png)',
        maskSize: 'contain', maskRepeat: 'no-repeat', maskPosition: 'center',
        flexShrink: 0,
      }}
    />
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

  const activeFollowersCount = useRandomFollowers(1221, 12123, 5000);

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
        // Fix #9: read real wallet balance using is_demo = false
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
      setToast({ message: 'Successfully following Investoft Copy Trade!', type: 'success' });
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
    <div className="min-h-screen flex flex-col max-w-md mx-auto" style={{ background: '#060608' }}>
      {/* Top Bar — Fix #6: more premium back button */}
      <div
        className="flex items-center gap-4 px-5 py-4 sticky top-0 z-10"
        style={{
          background: 'rgba(6,6,8,0.95)',
          backdropFilter: 'blur(24px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <button
          onClick={() => router.push('/dashboard')}
          className="w-9 h-9 flex items-center justify-center rounded-xl transition-all active:scale-95"
          style={{
            background: 'linear-gradient(145deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.03) 100%)',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.07)',
          }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="rgba(255,255,255,0.8)" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="font-semibold text-sm tracking-wide" style={{ color: 'rgba(255,255,255,0.95)', letterSpacing: '0.02em' }}>Copy Trade</h1>
          <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>Follow Investoft's trades automatically</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-8">
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <span className="w-5 h-5 border border-white/20 border-t-white/60 rounded-full animate-spin" />
          </div>
        ) : !provider ? (
          <div className="px-6 py-12 text-center text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>Copy Trade not available</div>
        ) : (
          <div className="px-4 py-5 space-y-4">

            {/* Provider Card */}
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                background: 'linear-gradient(145deg, #0e0e12 0%, #0a0a0e 100%)',
                border: '1px solid rgba(255,255,255,0.07)',
                boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
              }}
            >
              {/* Card Header */}
              <div className="px-5 pt-4 pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    {/* Icon-only logo */}
                    <InvestoftLogo />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm" style={{ color: 'rgba(255,255,255,0.92)', letterSpacing: '0.01em' }}>{provider.name}</span>
                        {isFollowing && (
                          <span
                            className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                            style={{
                              background: 'rgba(16,185,129,0.06)',
                              border: '1px solid rgba(16,185,129,0.2)',
                              color: '#34d399',
                              letterSpacing: '0.03em',
                            }}
                          >
                            Following
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.25)' }}>{provider.description ?? 'Official Investoft Copy Trade'}</div>
                    </div>
                  </div>
                  {/* Win Rate */}
                  <div className="text-right">
                    <div
                      className="font-black text-2xl leading-none"
                      style={{
                        background: 'linear-gradient(135deg, #34d399 0%, #10b981 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        filter: 'drop-shadow(0 0 8px rgba(52,211,153,0.4))',
                      }}
                    >
                      {provider.win_rate}%
                    </div>
                    <div className="text-[10px] mt-0.5 uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.25)', letterSpacing: '0.12em' }}>Win Rate</div>
                  </div>
                </div>
              </div>

              {/* Guarantee Badge */}
              <div
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl"
                style={{
                  background: 'rgba(16,185,129,0.06)',
                  border: '1px solid rgba(16,185,129,0.15)',
                }}
              >
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="#34d399" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span className="text-[11px] font-medium" style={{ color: '#34d399', letterSpacing: '0.01em' }}>100% Balance Guarantee on Loss</span>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="px-5 pt-5 pb-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="grid grid-cols-3 gap-0 mb-6">
                <div className="text-center py-1">
                  <div className="font-bold text-base" style={{ color: 'rgba(255,255,255,0.9)', letterSpacing: '-0.01em' }}>{activeFollowersCount.toLocaleString()}</div>
                  <div className="text-[10px] mt-1 uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.25)', letterSpacing: '0.1em' }}>Followers</div>
                </div>
                <div className="text-center py-1" style={{ borderLeft: '1px solid rgba(255,255,255,0.06)', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="font-bold text-base" style={{ color: 'rgba(255,255,255,0.9)', letterSpacing: '-0.01em' }}>${provider.min_balance_usd.toLocaleString()}</div>
                  <div className="text-[10px] mt-1 uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.25)', letterSpacing: '0.1em' }}>Min Balance</div>
                </div>
                <div className="text-center py-1">
                  <div
                    className="font-bold text-base"
                    style={{
                      background: 'linear-gradient(135deg, #34d399, #10b981)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}
                  >
                    {provider.win_rate}%
                  </div>
                  <div className="text-[10px] mt-1 uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.25)', letterSpacing: '0.1em' }}>Win Rate</div>
                </div>
              </div>

              {/* Fix #2 & #8: Thicker score bars (8px) + more breathing room */}
              <div className="space-y-4 pb-5">
                {scores.map((s, i) => (
                  <div key={s.label} className="flex items-center gap-3">
                    <span className="text-[11px] w-[72px] flex-shrink-0" style={{ color: 'rgba(255,255,255,0.4)', letterSpacing: '0.01em' }}>{s.label}</span>
                    <div className="flex-1 rounded-full overflow-hidden" style={{ height: '8px', background: 'rgba(255,255,255,0.06)' }}>
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(s.value / 10) * 100}%`,
                          background: i % 2 === 0
                            ? 'linear-gradient(90deg, #6366f1 0%, #34d399 100%)'
                            : 'linear-gradient(90deg, #8b5cf6 0%, #06b6d4 100%)',
                          boxShadow: i % 2 === 0
                            ? '0 0 8px rgba(99,102,241,0.6), 0 0 16px rgba(52,211,153,0.3)'
                            : '0 0 8px rgba(139,92,246,0.6), 0 0 16px rgba(6,182,212,0.3)',
                        }}
                      />
                    </div>
                    <span className="text-[11px] font-semibold w-8 text-right" style={{ color: 'rgba(255,255,255,0.6)' }}>{s.value}/10</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Area */}
            <div className="px-5 py-5">
              {isFollowing ? (
                <div className="space-y-3">
                  <div
                    className="flex items-center gap-2.5 px-4 py-3 rounded-xl"
                    style={{
                      background: 'rgba(99,102,241,0.07)',
                      border: '1px solid rgba(99,102,241,0.18)',
                    }}
                  >
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="#818cf8" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-[11px]" style={{ color: '#818cf8' }}>You are currently copying Investoft trades</span>
                  </div>
                  <button
                    onClick={handleStopFollow}
                    disabled={actionLoading}
                    className="w-full py-3 text-sm font-semibold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                      background: 'rgba(239,68,68,0.08)',
                      border: '1px solid rgba(239,68,68,0.2)',
                      color: '#f87171',
                      letterSpacing: '0.02em',
                    }}
                  >
                    {actionLoading ? (
                      <span className="w-4 h-4 border border-red-400/40 border-t-red-400 rounded-full animate-spin inline-block" />
                    ) : 'Stop Following'}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Fix #4: Balance row — neutral white color instead of red/orange */}
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.3)', letterSpacing: '0.01em' }}>Your Real Balance</span>
                    <span
                      className="text-[12px] font-semibold"
                      style={{ color: (wallet?.realBalance ?? 0) >= provider.min_balance_usd ? '#34d399' : 'rgba(255,255,255,0.75)' }}
                    >
                      ${formatCurrency(wallet?.realBalance ?? 0)}
                    </span>
                  </div>

                  {/* Fix #3: Insufficient balance — amber/subtle instead of harsh red */}
                  {(wallet?.realBalance ?? 0) < provider.min_balance_usd && (
                    <div
                      className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl"
                      style={{
                        background: 'rgba(245,158,11,0.06)',
                        border: '1px solid rgba(245,158,11,0.18)',
                      }}
                    >
                      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="#fbbf24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                      </svg>
                      <span className="text-[11px]" style={{ color: 'rgba(251,191,36,0.85)' }}>Insufficient balance. Need ${provider.min_balance_usd.toLocaleString()} USD minimum</span>
                    </div>
                  )}

                  {/* Fix #5: Follow button — premium depth + glow */}
                  <button
                    onClick={handleFollow}
                    disabled={actionLoading || (wallet?.realBalance ?? 0) < provider.min_balance_usd}
                    className="w-full py-4 text-sm font-semibold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed relative overflow-hidden"
                    style={{
                      background: 'linear-gradient(135deg, #3730a3 0%, #4f46e5 40%, #6366f1 70%, #7c3aed 100%)',
                      color: 'rgba(255,255,255,0.97)',
                      letterSpacing: '0.04em',
                      boxShadow: (wallet?.realBalance ?? 0) >= provider.min_balance_usd
                        ? '0 0 28px rgba(99,102,241,0.5), 0 4px 20px rgba(99,102,241,0.3), 0 1px 0 rgba(255,255,255,0.15) inset, 0 -1px 0 rgba(0,0,0,0.3) inset'
                        : '0 2px 8px rgba(0,0,0,0.3)',
                      border: '1px solid rgba(255,255,255,0.12)',
                    }}
                  >
                    {/* Top shine */}
                    <div
                      className="absolute inset-0 pointer-events-none rounded-xl"
                      style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.1) 0%, transparent 50%)' }}
                    />
                    {actionLoading ? (
                      <span className="w-4 h-4 border border-white/30 border-t-white rounded-full animate-spin inline-block" />
                    ) : 'Follow Investoft'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
