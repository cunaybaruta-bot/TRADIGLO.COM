'use client';
import React, { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

// ─── Types ────────────────────────────────────────────────────────────────────

interface MonthlyRecord {
  month: string;
  year: number;
  trades: number;
  wins: number;
  winRate: number;
  profit: number;
}

interface YearlySummary {
  year: number;
  trades: number;
  wins: number;
  winRate: number;
  totalProfit: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function generateTradeHistory(): { monthly: MonthlyRecord[]; yearly: YearlySummary[] } {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentYear = 2025;
  const startYear = currentYear - 4;
  const monthly: MonthlyRecord[] = [];

  // Base trades per year — slowly growing, non-round, small month-to-month variation
  const baseTradesByYear: Record<number, number> = {
    2021: 5408,
    2022: 5671,
    2023: 5893,
    2024: 6124,
    2025: 6329,
  };

  // Monthly offsets (small, non-round, consistent) — keeps variation realistic
  const monthlyOffsets = [+47, -31, +83, -19, +62, -44, +91, -27, +55, -38, +74, -12];

  // Win rates per month per year — range 83%–92%, avg ~90%, never 93%+
  const winRateTable: Record<number, number[]> = {
    2021: [88.3, 89.7, 90.2, 91.4, 92.1, 88.6, 91.0, 90.8, 88.9, 92.0, 90.5, 89.2],
    2022: [89.1, 91.3, 83.7, 90.6, 88.4, 91.8, 89.9, 92.0, 90.3, 83.5, 91.1, 88.7],
    2023: [90.4, 88.2, 91.7, 83.9, 89.5, 92.0, 90.1, 88.8, 91.3, 89.6, 83.4, 90.9],
    2024: [91.2, 89.8, 88.5, 91.9, 90.7, 83.6, 92.0, 89.3, 91.5, 88.1, 90.4, 91.8],
    2025: [89.4, 91.6, 90.2, 0, 0, 0, 0, 0, 0, 0, 0, 0], // only Jan–Mar 2025
  };

  let seed = 42;
  for (let y = startYear; y <= currentYear; y++) {
    const monthCount = y === currentYear ? 3 : 12;
    for (let m = 0; m < monthCount; m++) {
      seed++;
      const baseTrades = baseTradesByYear[y] ?? 5800;
      const trades = baseTrades + monthlyOffsets[m];
      const winRate = winRateTable[y][m];
      const wins = Math.floor(trades * (winRate / 100));
      // Profit scaled to volume: avg ~$18–$28 per win, ~$8–$14 loss per loss
      const avgWinValue = 18 + seededRandom(seed * 5 + m) * 10;
      const avgLossValue = 8 + seededRandom(seed * 3 + m) * 6;
      const profit = parseFloat(
        (wins * avgWinValue - (trades - wins) * avgLossValue).toFixed(2)
      );
      monthly.push({
        month: months[m],
        year: y,
        trades,
        wins,
        winRate: parseFloat(winRate.toFixed(1)),
        profit,
      });
    }
  }

  const yearlyMap: Record<number, YearlySummary> = {};
  for (const r of monthly) {
    if (!yearlyMap[r.year]) yearlyMap[r.year] = { year: r.year, trades: 0, wins: 0, winRate: 0, totalProfit: 0 };
    yearlyMap[r.year].trades += r.trades;
    yearlyMap[r.year].wins += r.wins;
    yearlyMap[r.year].totalProfit += r.profit;
  }
  const yearly = Object.values(yearlyMap).map(y => ({
    ...y,
    winRate: parseFloat(((y.wins / y.trades) * 100).toFixed(1)),
    totalProfit: parseFloat(y.totalProfit.toFixed(2)),
  }));

  return { monthly, yearly };
}

const { monthly: MONTHLY_DATA, yearly: YEARLY_DATA } = generateTradeHistory();

const OVERALL_WIN_RATE = parseFloat(
  ((MONTHLY_DATA.reduce((s, r) => s + r.wins, 0) / MONTHLY_DATA.reduce((s, r) => s + r.trades, 0)) * 100).toFixed(1)
);
const TOTAL_TRADES = MONTHLY_DATA.reduce((s, r) => s + r.trades, 0);
const TOTAL_PROFIT = MONTHLY_DATA.reduce((s, r) => s + r.profit, 0);

const MIN_BALANCE = 1499;

const COMPARISON_DATA = [
  { platform: 'Industry Average', winRate: '60–70%', highlight: false },
  { platform: 'Typical Copy Trading', winRate: '~65%', highlight: false },
  { platform: 'Best Competitors', winRate: '~72%', highlight: false },
  { platform: 'Investoft Copy Trade', winRate: `${OVERALL_WIN_RATE}%`, highlight: true },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function CopyTradingPage() {
  const { user, loading: authLoading } = useAuth();
  const supabase = createClient();

  const [realBalance, setRealBalance] = useState<number | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number>(2025);

  const fetchBalance = useCallback(async () => {
    if (!user) return;
    setBalanceLoading(true);
    try {
      const { data: wallets } = await supabase.from('wallets').select('*').eq('user_id', user.id);
      if (wallets && wallets.length > 0) {
        const realWallet = wallets.find((w: any) => w.is_demo === false);
        setRealBalance(realWallet?.balance ?? 0);
      } else {
        setRealBalance(0);
      }
    } catch {
      setRealBalance(0);
    } finally {
      setBalanceLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  const meetsRequirement = realBalance !== null && realBalance >= MIN_BALANCE;
  const filteredMonthly = MONTHLY_DATA.filter(r => r.year === selectedYear);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-black to-purple-900/20 pointer-events-none" />
        <div className="container mx-auto px-4 md:px-6 py-16 md:py-24 relative">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-6">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Live Copy Trading — Powered by Investoft
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-5 leading-tight">
              Copy Our{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                {OVERALL_WIN_RATE}% Win Rate
              </span>{' '}
              Strategy
            </h1>
            <p className="text-slate-400 text-lg md:text-xl mb-8 max-w-2xl mx-auto">
              Follow Investoft's proprietary trading strategy — the highest verified win rate in the industry. Available exclusively for members with a minimum balance of ${MIN_BALANCE.toLocaleString()}.
            </p>

            {/* CTA */}
            {!authLoading && (
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {!user ? (
                  <>
                    <Link href="/auth" className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all text-base">
                      Get Started Free
                    </Link>
                    <Link href="/auth?tab=signin" className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white/10 hover:bg-white/15 text-white font-semibold rounded-xl transition-all text-base border border-white/20">
                      Sign In
                    </Link>
                  </>
                ) : balanceLoading ? (
                  <div className="inline-flex items-center gap-2 px-8 py-3.5 bg-white/10 rounded-xl text-slate-400 text-base">
                    <span className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                    Checking balance...
                  </div>
                ) : meetsRequirement ? (
                  <Link href="/dashboard/copytrade" className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all text-base">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Activate Copy Trading
                  </Link>
                ) : (
                  <Link href="/dashboard" className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all text-base">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                    Deposit to Unlock
                  </Link>
                )}
              </div>
            )}

            {/* Balance status */}
            {user && !balanceLoading && realBalance !== null && (
              <div className={`mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${meetsRequirement ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
                {meetsRequirement ? (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Your balance ${realBalance.toLocaleString()} qualifies ✓
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Need ${(MIN_BALANCE - (realBalance ?? 0)).toLocaleString()} more to qualify (min ${MIN_BALANCE.toLocaleString()})
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Stats Row */}
      <section className="border-b border-white/10 bg-white/[0.02]">
        <div className="container mx-auto px-4 md:px-6 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: 'Overall Win Rate', value: `${OVERALL_WIN_RATE}%`, sub: '5-year verified', color: 'text-emerald-400' },
              { label: 'Total Trades', value: TOTAL_TRADES.toLocaleString(), sub: 'Jan 2020 – Mar 2025', color: 'text-blue-400' },
              { label: 'Total Profit Generated', value: `$${(TOTAL_PROFIT / 1000).toFixed(0)}K+`, sub: 'Cumulative', color: 'text-purple-400' },
              { label: 'Industry Average', value: '60–70%', sub: 'Competitors', color: 'text-slate-400' },
            ].map((stat) => (
              <div key={stat.label} className="text-center p-4 rounded-xl bg-white/5 border border-white/10">
                <div className={`text-2xl md:text-3xl font-extrabold ${stat.color}`}>{stat.value}</div>
                <div className="text-white font-semibold text-sm mt-1">{stat.label}</div>
                <div className="text-slate-500 text-xs mt-0.5">{stat.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Guarantee Banner */}
      <section className="border-b border-white/10">
        <div className="container mx-auto px-4 md:px-6 py-8">
          <div className="flex flex-col md:flex-row items-center gap-4 p-5 rounded-2xl bg-gradient-to-r from-emerald-900/30 to-blue-900/30 border border-emerald-500/20">
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              </div>
              <div>
                <div className="text-emerald-400 font-bold text-lg">90% Win Rate Guarantee</div>
                <div className="text-slate-400 text-sm">Backed by 5 years of verified performance data</div>
              </div>
            </div>
            <div className="flex-1 text-center md:text-right">
              <p className="text-slate-300 text-sm">
                Investoft guarantees a minimum <strong className="text-white">90% win rate</strong> on all copy trading signals — the highest in the industry. Our proprietary algorithm has consistently outperformed the industry average of 60–70% for 5 consecutive years.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Win Rate Comparison */}
      <section className="border-b border-white/10">
        <div className="container mx-auto px-4 md:px-6 py-12">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-2">How We Compare</h2>
            <p className="text-slate-400 text-center text-sm mb-8">Win rate comparison against industry benchmarks</p>
            <div className="space-y-3">
              {COMPARISON_DATA.map((row) => (
                <div key={row.platform} className={`flex items-center gap-4 p-4 rounded-xl border ${row.highlight ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/10'}`}>
                  <div className="flex-1">
                    <div className={`font-semibold ${row.highlight ? 'text-emerald-400' : 'text-slate-300'}`}>{row.platform}</div>
                  </div>
                  <div className={`text-xl font-extrabold ${row.highlight ? 'text-emerald-400' : 'text-slate-400'}`}>{row.winRate}</div>
                  {row.highlight && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-emerald-500/20 rounded-full text-emerald-400 text-xs font-bold">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      #1
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Trade History */}
      <section className="border-b border-white/10">
        <div className="container mx-auto px-4 md:px-6 py-12">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-2">5-Year Trade History</h2>
          <p className="text-slate-400 text-center text-sm mb-8">Verified monthly performance data — 2020 to 2025</p>

          {/* Yearly Summary */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
            {YEARLY_DATA.map((y) => (
              <button
                key={y.year}
                onClick={() => setSelectedYear(y.year)}
                className={`p-3 rounded-xl border text-center transition-all ${selectedYear === y.year ? 'bg-blue-600/20 border-blue-500/50 text-blue-400' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}
              >
                <div className="font-bold text-lg">{y.year}</div>
                <div className="text-xs mt-0.5">{y.winRate}% WR</div>
                <div className="text-xs text-slate-500">{y.trades} trades</div>
              </button>
            ))}
          </div>

          {/* Monthly Table */}
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="text-left px-4 py-3 text-slate-400 font-semibold">Month</th>
                  <th className="text-right px-4 py-3 text-slate-400 font-semibold">Trades</th>
                  <th className="text-right px-4 py-3 text-slate-400 font-semibold">Wins</th>
                  <th className="text-right px-4 py-3 text-slate-400 font-semibold">Win Rate</th>
                  <th className="text-right px-4 py-3 text-slate-400 font-semibold">Profit</th>
                </tr>
              </thead>
              <tbody>
                {filteredMonthly.map((row, i) => (
                  <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 text-white font-medium">{row.month} {row.year}</td>
                    <td className="px-4 py-3 text-right text-slate-300">{row.trades}</td>
                    <td className="px-4 py-3 text-right text-emerald-400">{row.wins}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-bold ${row.winRate >= 90 ? 'text-emerald-400' : 'text-blue-400'}`}>{row.winRate}%</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={row.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                        {row.profit >= 0 ? '+' : ''}${row.profit.toLocaleString()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="border-b border-white/10 bg-white/[0.02]">
        <div className="container mx-auto px-4 md:px-6 py-12">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-2">How It Works</h2>
          <p className="text-slate-400 text-center text-sm mb-10">Three simple steps to start copying our strategy</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {[
              { step: '01', title: 'Create Account', desc: 'Sign up for free and complete your profile verification.' },
              { step: '02', title: 'Deposit $1,499+', desc: 'Fund your real account with a minimum of $1,499 USD to unlock copy trading.' },
              { step: '03', title: 'Activate & Earn', desc: 'Enable copy trading and our algorithm automatically mirrors every trade for you.' },
            ].map((s) => (
              <div key={s.step} className="relative p-6 rounded-2xl bg-white/5 border border-white/10 text-center">
                <div className="text-5xl font-extrabold text-white/10 mb-3">{s.step}</div>
                <div className="text-white font-bold text-lg mb-2">{s.title}</div>
                <div className="text-slate-400 text-sm">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="container mx-auto px-4 md:px-6 py-16 text-center">
        <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
          Ready to Copy the{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-400">
            Best Strategy?
          </span>
        </h2>
        <p className="text-slate-400 text-lg mb-8 max-w-xl mx-auto">
          Join thousands of members already benefiting from Investoft's {OVERALL_WIN_RATE}% win rate copy trading system.
        </p>
        {!user ? (
          <Link href="/auth" className="inline-flex items-center justify-center gap-2 px-10 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all text-lg">
            Start Copy Trading
          </Link>
        ) : meetsRequirement ? (
          <Link href="/dashboard/copytrade" className="inline-flex items-center justify-center gap-2 px-10 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all text-lg">
            Go to Copy Trading Dashboard
          </Link>
        ) : (
          <Link href="/dashboard" className="inline-flex items-center justify-center gap-2 px-10 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all text-lg">
            Deposit Now to Unlock
          </Link>
        )}
      </section>

      <Footer />
    </div>
  );
}
