'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

interface Wallet {
  demoBalance: number;
  realBalance: number;
}

interface DashboardTopBarProps {
  wallet: Wallet | null;
  walletLoading: boolean;
  isDemo: boolean;
  onToggleDemo: (val: boolean) => void;
  userEmail?: string;
  avatarUrl?: string | null;
  onDepositClick: () => void;
}

export default function DashboardTopBar({
  wallet,
  walletLoading,
  isDemo,
  onToggleDemo,
  userEmail,
  avatarUrl,
  onDepositClick,
}: DashboardTopBarProps) {
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace('/login');
  };

  function formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }

  const activeBalance = isDemo ? (wallet?.demoBalance ?? 0) : (wallet?.realBalance ?? 0);

  return (
    <header className="sticky top-0 z-40 bg-[#0a0a0a] border-b border-white/10 flex items-center justify-between px-2 sm:px-4 h-12 sm:h-14 gap-1.5">
      {/* Logo */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <div
          style={{
            width: 24, height: 24,
            background: 'linear-gradient(to right, #60a5fa, #6366f1, #a855f7)',
            WebkitMaskImage: 'url(/assets/images/chart-646_1024-1773102864640.png)',
            WebkitMaskSize: 'contain', WebkitMaskRepeat: 'no-repeat', WebkitMaskPosition: 'center',
            maskImage: 'url(/assets/images/chart-646_1024-1773102864640.png)',
            maskSize: 'contain', maskRepeat: 'no-repeat', maskPosition: 'center',
            animation: 'logoPulseGlow 3s ease-in-out infinite',
          }}
          className="flex-shrink-0"
        />
        <span
          style={{
            fontFamily: "'Satoshi', 'Inter', sans-serif",
            fontWeight: 700,
            letterSpacing: '0.04em',
            animation: 'logoTextGlow 3s ease-in-out infinite',
          }}
          className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-500 to-purple-500 text-sm tracking-wide select-none hidden xs:block"
        >
          TRADIGLO
        </span>
      </div>

      {/* Center: Single balance toggle */}
      <div className="flex items-center gap-1 flex-1 justify-center min-w-0">
        {/* Demo/Real Segmented Control */}
        <div className="relative flex items-center bg-white/5 border border-white/10 rounded-full p-0.5 flex-shrink-0" style={{ minWidth: 96 }}>
          {/* Sliding background pill */}
          <span
            className={`absolute top-0.5 bottom-0.5 rounded-full transition-all duration-300 ease-in-out ${isDemo ? 'bg-blue-600 left-0.5 right-[calc(50%+1px)]' : 'bg-emerald-600 left-[calc(50%+1px)] right-0.5'}`}
            aria-hidden="true"
          />
          <button
            onClick={() => onToggleDemo(true)}
            className={`relative z-10 flex-1 px-2.5 py-0.5 text-[10px] font-bold tracking-wide rounded-full transition-colors duration-200 ${isDemo ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
          >
            DEMO
          </button>
          <button
            onClick={() => onToggleDemo(false)}
            className={`relative z-10 flex-1 px-2.5 py-0.5 text-[10px] font-bold tracking-wide rounded-full transition-colors duration-200 ${!isDemo ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
          >
            REAL
          </button>
        </div>
        {/* Active balance display */}
        <div className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-xs font-semibold min-w-0 ${
          isDemo ? 'bg-blue-500/10 border-blue-500/30 text-blue-300' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isDemo ? 'bg-blue-400' : 'bg-emerald-400'}`} />
          <span className="text-white font-bold tabular-nums truncate" style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em', fontSize: 11 }}>
            {walletLoading ? '…' : `$${formatCurrency(activeBalance)}`}
          </span>
        </div>
      </div>

      {/* Right: Deposit button + Avatar dropdown */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {/* Deposit button */}
        <button
          onClick={onDepositClick}
          className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all"
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="5" width="20" height="14" rx="2" />
            <path d="M16 12h2" />
            <path d="M2 10h20" />
          </svg>
          <span className="hidden sm:inline">Deposit</span>
        </button>

        {/* Avatar + dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((v) => !v)}
            className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold select-none hover:ring-2 hover:ring-blue-400/50 transition-all overflow-hidden"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              userEmail ? userEmail[0].toUpperCase() : 'U'
            )}
          </button>

          {dropdownOpen && (
            <div
              className="absolute right-0 top-9 w-44 rounded-xl border border-white/10 bg-[#111] shadow-2xl overflow-hidden z-50"
              style={{ backdropFilter: 'blur(12px)' }}
            >
              <div className="px-3 py-2.5 border-b border-white/10">
                <div className="text-[10px] text-slate-500 truncate">{userEmail}</div>
              </div>
              <div className="py-1">
                <Link
                  href="/dashboard/account"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-white/8 transition-colors"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                  </svg>
                  Profile
                </Link>
                <Link
                  href="/dashboard/account"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-white/8 transition-colors"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14" />
                  </svg>
                  Account
                </Link>
                <div className="h-px bg-white/10 my-1" />
                <button
                  onClick={() => { setDropdownOpen(false); handleLogout(); }}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors w-full text-left"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
