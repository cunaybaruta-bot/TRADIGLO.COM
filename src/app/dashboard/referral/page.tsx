'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import DashboardTopBar from '@/components/dashboard/DashboardTopBar';

interface ReferralStats {
  referralCode: string;
  totalReferred: number;
  totalEarned: number;
  pendingReward: number;
  paidReward: number;
}

export default function ReferralDashboardPage() {
  const router = useRouter();
  const supabase = createClient();

  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const [stats, setStats] = useState<ReferralStats>({
    referralCode: '',
    totalReferred: 0,
    totalEarned: 0,
    pendingReward: 0,
    paidReward: 0,
  });

  // Auth check
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/login');
        return;
      }
      setUserId(user.id);
      setUserEmail(user.email ?? '');

      const { data: profile } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', user.id)
        .maybeSingle();
      if (profile?.avatar_url) setAvatarUrl(profile.avatar_url);

      setAuthChecked(true);
    };
    checkAuth();
  }, []);

  const fetchReferralData = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      // Generate referral code from user id (first 8 chars)
      const code = `TRD-${userId.replace(/-/g, '').substring(0, 8).toUpperCase()}`;
      setStats({
        referralCode: code,
        totalReferred: 0,
        totalEarned: 0,
        pendingReward: 0,
        paidReward: 0,
      });
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (authChecked && userId) fetchReferralData();
  }, [authChecked, userId, fetchReferralData]);

  const referralLink = stats.referralCode
    ? `${typeof window !== 'undefined' ? window.location.origin : 'https://tradiglo.com'}/register?ref=${stats.referralCode}`
    : '';

  const handleCopy = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const progressToReward = Math.min((stats.pendingReward / 500) * 100, 100);

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col">
      {authChecked && (
        <DashboardTopBar
          userId={userId ?? ''}
          userEmail={userEmail}
          avatarUrl={avatarUrl}
        />
      )}

      <div className="flex-1 overflow-y-auto px-3 py-4 max-w-2xl mx-auto w-full">
        {/* Header */}
        <div className="mb-5">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-1.5 text-slate-400 hover:text-white text-xs mb-3 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </button>
          <h1 className="text-lg font-bold text-white">Referral Program</h1>
          <p className="text-xs text-slate-400 mt-0.5">Earn 25% of every new member's initial deposit</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Referral Link Card */}
            <div className="bg-[#0d0d0d] border border-white/10 rounded-xl p-4">
              <h2 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">Your Referral Link</h2>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-[#0a0a0a] border border-white/10 rounded-lg px-3 py-2.5 text-xs text-slate-300 truncate font-mono">
                  {referralLink}
                </div>
                <button
                  onClick={handleCopy}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                    copied
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30' :'bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30'
                  }`}
                >
                  {copied ? (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                      Copy
                    </>
                  )}
                </button>
              </div>
              <p className="text-[10px] text-slate-500 mt-2">Share this link with friends to start earning rewards</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#0d0d0d] border border-white/10 rounded-xl p-4">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Total Referred</p>
                <p className="text-2xl font-bold text-white">{stats.totalReferred}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">members joined</p>
              </div>
              <div className="bg-[#0d0d0d] border border-white/10 rounded-xl p-4">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Total Earned</p>
                <p className="text-2xl font-bold text-green-400">${stats.totalEarned.toFixed(2)}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">lifetime rewards</p>
              </div>
            </div>

            {/* Reward Progress */}
            <div className="bg-[#0d0d0d] border border-white/10 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-semibold text-white uppercase tracking-wider">Reward Progress</h2>
                <span className="text-xs text-slate-400">${stats.pendingReward.toFixed(2)} / $500.00</span>
              </div>
              <div className="w-full bg-white/5 rounded-full h-2 mb-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${progressToReward}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-500">
                {stats.pendingReward >= 500
                  ? 'Reward threshold reached! Contact support to claim your reward.'
                  : `$${(500 - stats.pendingReward).toFixed(2)} more needed to reach the $500 payout threshold`}
              </p>
            </div>

            {/* Reward Summary */}
            <div className="bg-[#0d0d0d] border border-white/10 rounded-xl p-4">
              <h2 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">Reward Summary</h2>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between py-2 border-b border-white/5">
                  <span className="text-xs text-slate-400">Pending Reward</span>
                  <span className="text-xs font-medium text-yellow-400">${stats.pendingReward.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-white/5">
                  <span className="text-xs text-slate-400">Paid Reward</span>
                  <span className="text-xs font-medium text-green-400">${stats.paidReward.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-xs text-slate-400">Reward Rate</span>
                  <span className="text-xs font-medium text-blue-400">25% of initial deposit</span>
                </div>
              </div>
            </div>

            {/* How It Works */}
            <div className="bg-[#0d0d0d] border border-white/10 rounded-xl p-4">
              <h2 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">How It Works</h2>
              <div className="flex flex-col gap-3">
                {[
                  { step: '1', title: 'Share Your Link', desc: 'Copy your unique referral link and share it with anyone' },
                  { step: '2', title: 'They Sign Up & Deposit', desc: 'Your referral registers and makes their first deposit' },
                  { step: '3', title: 'Earn 25%', desc: 'You receive 25% of their initial deposit as a reward' },
                  { step: '4', title: 'Get Paid at $500', desc: 'Once your pending reward reaches $500, request a payout' },
                ].map((item) => (
                  <div key={item.step} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-[10px] font-bold text-blue-400">{item.step}</span>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-white">{item.title}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Terms */}
            <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
              <p className="text-[10px] text-slate-400 leading-relaxed">
                <span className="text-blue-400 font-medium">Program Terms: </span>
                Referral rewards are valid for the lifetime of the referred member's account. Rewards are calculated based on the referred member's initial deposit only. Payout is processed once the accumulated reward reaches the $500 threshold. Contact support to initiate a payout.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
