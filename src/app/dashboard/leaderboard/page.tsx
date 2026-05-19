'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import DashboardTopBar from '@/components/dashboard/DashboardTopBar';
import DepositModal from '@/components/dashboard/DepositModal';
import { createClient } from '@/lib/supabase/client';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Wallet {
  demoBalance: number;
  realBalance: number;
}

interface LeaderEntry {
  rank: number;
  username: string;
  country: string;
  profit: number;
  withdrawal: number;
  total: number;
  asset: string;
  winRate: number;
  trades: number;
  isReal?: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PRIZES = [20000, 15000, 10000, 8000, 7000, 5000, 3000, 2000, 1500, 1000];

const RANK_STYLES = [
  { bg: 'from-blue-600/20 to-blue-900/10', border: 'border-blue-500/40', badge: '🥇', rankColor: 'text-blue-300', glow: 'shadow-blue-500/20' },
  { bg: 'from-purple-600/15 to-purple-900/8', border: 'border-purple-500/35', badge: '🥈', rankColor: 'text-purple-300', glow: 'shadow-purple-500/10' },
  { bg: 'from-blue-800/15 to-slate-800/10', border: 'border-blue-700/35', badge: '🥉', rankColor: 'text-blue-400', glow: 'shadow-blue-700/10' },
];

const ASSETS = ['BTC/USD', 'ETH/USD', 'XAU/USD', 'EUR/USD', 'NAS100', 'SPX500', 'GBP/USD', 'OIL/USD', 'SOL/USD', 'LTC/USD'];
const COUNTRIES = ['🇺🇸', '🇬🇧', '🇦🇪', '🇸🇬', '🇯🇵', '🇩🇪', '🇫🇷', '🇦🇺', '🇨🇦', '🇧🇷', '🇲🇾', '🇮🇩', '🇹🇭', '🇰🇷', '🇨🇳'];

// ─── Name pools ───────────────────────────────────────────────────────────────
const COUNTRY_NAMES: [string, string[], string[]][] = [
  ['🇺🇸', ['James', 'Michael', 'Robert', 'William', 'David', 'Christopher', 'Matthew', 'Joshua', 'Andrew', 'Daniel'], ['Anderson', 'Thompson', 'Williams', 'Johnson', 'Martinez', 'Davis', 'Wilson', 'Taylor', 'Moore', 'Harris']],
  ['🇬🇧', ['Oliver', 'Harry', 'George', 'Jack', 'Charlie', 'Thomas', 'Oscar', 'William', 'Edward', 'Henry'], ['Smith', 'Jones', 'Williams', 'Brown', 'Taylor', 'Davies', 'Evans', 'Wilson', 'Thomas', 'Roberts']],
  ['🇦🇪', ['Mohammed', 'Ahmed', 'Khalid', 'Abdullah', 'Hamdan', 'Rashid', 'Sultan', 'Saeed', 'Majid', 'Zayed'], ['Al Maktoum', 'Al Nahyan', 'Al Rashidi', 'Al Mansoori', 'Al Mazrouei', 'Al Shamsi', 'Al Kaabi', 'Al Falasi', 'Al Nuaimi', 'Al Suwaidi']],
  ['🇸🇬', ['Wei Ming', 'Jun Hao', 'Kai Xiang', 'Rajan', 'Arjun', 'Farhan', 'Ethan', 'Lucas', 'Darren', 'Marcus'], ['Tan', 'Lim', 'Lee', 'Ng', 'Wong', 'Goh', 'Chua', 'Chan', 'Koh', 'Teo']],
  ['🇯🇵', ['Haruto', 'Yuto', 'Sota', 'Yuki', 'Hayato', 'Kento', 'Ren', 'Takumi', 'Kaito', 'Ryota'], ['Sato', 'Suzuki', 'Takahashi', 'Tanaka', 'Watanabe', 'Ito', 'Yamamoto', 'Nakamura', 'Kobayashi', 'Kato']],
  ['🇩🇪', ['Lukas', 'Felix', 'Jonas', 'Leon', 'Maximilian', 'Paul', 'Elias', 'Noah', 'Finn', 'Ben'], ['Müller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Meyer', 'Wagner', 'Becker', 'Schulz', 'Hoffmann']],
  ['🇫🇷', ['Lucas', 'Hugo', 'Théo', 'Nathan', 'Tom', 'Mathis', 'Alexis', 'Baptiste', 'Clément', 'Raphaël'], ['Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Richard', 'Petit', 'Durand', 'Leroy', 'Moreau']],
  ['🇦🇺', ['Liam', 'Noah', 'Oliver', 'Jack', 'William', 'James', 'Lucas', 'Henry', 'Ethan', 'Mason'], ['Smith', 'Jones', 'Williams', 'Brown', 'Wilson', 'Taylor', 'Johnson', 'White', 'Martin', 'Anderson']],
  ['🇨🇦', ['Liam', 'Noah', 'Ethan', 'Logan', 'Oliver', 'Benjamin', 'Lucas', 'Mason', 'Jacob', 'William'], ['Brown', 'Smith', 'Martin', 'Roy', 'Wilson', 'MacDonald', 'Campbell', 'Anderson', 'Taylor', 'Tremblay']],
  ['🇧🇷', ['Gabriel', 'Lucas', 'Matheus', 'Pedro', 'Guilherme', 'Rafael', 'Felipe', 'João', 'Bruno', 'Thiago'], ['Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira', 'Lima', 'Gomes']],
  ['🇲🇾', ['Ahmad', 'Muhammad', 'Amir', 'Hafiz', 'Farid', 'Razif', 'Azlan', 'Syafiq', 'Haziq', 'Irfan'], ['bin Abdullah', 'bin Ibrahim', 'bin Hassan', 'bin Ismail', 'bin Rahman', 'bin Yusof', 'bin Hamid', 'bin Othman', 'bin Zainudin', 'bin Kamarudin']],
  ['🇮🇩', ['Budi', 'Andi', 'Rizky', 'Dimas', 'Fajar', 'Hendra', 'Agus', 'Wahyu', 'Bagas', 'Reza'], ['Santoso', 'Wijaya', 'Kusuma', 'Pratama', 'Saputra', 'Nugroho', 'Hidayat', 'Setiawan', 'Purnomo', 'Wibowo']],
  ['🇹🇭', ['Somchai', 'Nattapong', 'Kritsada', 'Pongpat', 'Thanakorn', 'Wichai', 'Supachai', 'Chaiwat', 'Krit', 'Nawin'], ['Srisuk', 'Jaidee', 'Thongchai', 'Boonmee', 'Saengthong', 'Phromma', 'Khampha', 'Rattana', 'Somboon', 'Charoenwong']],
  ['🇰🇷', ['Minjun', 'Seojun', 'Dohyun', 'Jiwoo', 'Junho', 'Hyunwoo', 'Taehyun', 'Sungmin', 'Jaehyun', 'Yoonho'], ['Kim', 'Lee', 'Park', 'Choi', 'Jung', 'Kang', 'Cho', 'Yoon', 'Jang', 'Lim']],
  ['🇨🇳', ['Wei', 'Fang', 'Jian', 'Hao', 'Cheng', 'Xiao', 'Zhen', 'Peng', 'Tao', 'Rui'], ['Wang', 'Li', 'Zhang', 'Liu', 'Chen', 'Yang', 'Huang', 'Zhao', 'Wu', 'Zhou']],
];

const FIRST_CHARS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'R', 'S', 'T', 'W', 'Y'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function seededRng(seed: number) {
  return (n: number) => {
    const x = Math.sin(seed + n * 9999) * 10000;
    return x - Math.floor(x);
  };
}

function maskLastWord(firstChar: string, stars: number): string {
  return `${firstChar}${'*'.repeat(stars)}`;
}

function getNameForCountry(country: string, entrySeed: number): string {
  const rng = seededRng(entrySeed);
  const entry = COUNTRY_NAMES.find(([flag]) => flag === country);
  if (entry) {
    const [, firstNames, lastNames] = entry;
    const firstName = firstNames[Math.floor(rng(1) * firstNames.length)];
    const lastName = lastNames[Math.floor(rng(2) * lastNames.length)];
    const lastFirstChar = lastName.charAt(0);
    const stars = Math.floor(rng(3) * 3) + 4;
    return `${firstName} ${maskLastWord(lastFirstChar, stars)}`;
  }
  const char = FIRST_CHARS[Math.floor(rng(3) * FIRST_CHARS.length)];
  const stars = Math.floor(rng(4) * 3) + 4;
  return `User ${maskLastWord(char, stars)}`;
}

function maskDisplayName(name: string): string {
  if (!name || name === 'Trader') return name;
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    const char = parts[0].charAt(0);
    return `${char}${'*'.repeat(5)}`;
  }
  const firstName = parts[0];
  const maskedParts = parts.slice(1).map((p) => {
    const char = p.charAt(0);
    const stars = Math.max(4, p.length - 1);
    return `${char}${'*'.repeat(stars)}`;
  });
  return [firstName, ...maskedParts].join(' ');
}

function generateLeaderboard(): LeaderEntry[] {
  const seed = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  const rng = seededRng(seed);

  const shuffledCountries = [...COUNTRY_NAMES.map(([flag]) => flag)];
  for (let i = shuffledCountries.length - 1; i > 0; i--) {
    const j = Math.floor(rng(i + 200) * (i + 1));
    [shuffledCountries[i], shuffledCountries[j]] = [shuffledCountries[j], shuffledCountries[i]];
  }

  const usedNames = new Set<string>();
  const entries: LeaderEntry[] = [];

  for (let i = 0; i < 10; i++) {
    const country = shuffledCountries[i % shuffledCountries.length];
    let username = '';
    let attempt = 0;
    do {
      const entrySeed = seed + i * 31 + attempt * 777 + Math.floor(rng(i + 100 + attempt) * 1000);
      username = getNameForCountry(country, entrySeed);
      attempt++;
    } while (usedNames.has(username) && attempt < 20);
    usedNames.add(username);

    const profit = Math.floor(rng(i * 3) * 180000 + 20000);
    const withdrawal = Math.floor(rng(i * 3 + 1) * 80000 + 5000);
    const winRate = Math.floor(rng(i * 3 + 2) * 35 + 60);
    const trades = Math.floor(rng(i * 3 + 3) * 80 + 20);
    entries.push({
      rank: i + 1,
      username,
      country,
      profit,
      withdrawal,
      total: profit + withdrawal,
      asset: ASSETS[Math.floor(rng(i * 3 + 0.5) * ASSETS.length)],
      winRate,
      trades,
      isReal: false,
    });
  }

  return entries.sort((a, b) => b.total - a.total).map((e, i) => ({ ...e, rank: i + 1 }));
}

function formatUSD(n: number): string {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(2)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}K`;
  return `$${n.toLocaleString('en-US')}`;
}

function getSecondsUntilMidnightUTC(): number {
  const now = new Date();
  const midnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  return Math.floor((midnight.getTime() - now.getTime()) / 1000);
}

function getTodayUTC(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`;
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function LeaderboardPage() {
  const router = useRouter();
  const [leaders, setLeaders] = useState<LeaderEntry[]>([]);
  const [countdown, setCountdown] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [walletLoading, setWalletLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(true);
  const [userEmail, setUserEmail] = useState<string | undefined>();
  const [userId, setUserId] = useState<string | null>(null);
  const [depositOpen, setDepositOpen] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [isRealData, setIsRealData] = useState(false);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);

  // Auth check
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.replace('/login'); return; }
      setUserId(data.user.id);
      setUserEmail(data.user.email);
      setAuthChecked(true);
    });
  }, [router]);

  // Fetch wallet
  useEffect(() => {
    if (!authChecked || !userId) return;
    const supabase = createClient();
    supabase
      .from('wallets')
      .select('demo_balance, real_balance')
      .eq('user_id', userId)
      .single()
      .then(({ data }) => {
        if (data) setWallet({ demoBalance: data.demo_balance ?? 0, realBalance: data.real_balance ?? 0 });
        setWalletLoading(false);
      });
  }, [authChecked, userId]);

  // Fetch leaderboard from Supabase, fallback to simulation
  const fetchLeaderboard = useCallback(async () => {
    setLeaderboardLoading(true);
    try {
      const supabase = createClient();
      const today = getTodayUTC();
      const { data, error } = await supabase
        .from('leaderboard_rankings')
        .select('rank, display_name, country_flag, profit, withdrawal, total, asset, win_rate, trades')
        .eq('leaderboard_date', today)
        .order('rank', { ascending: true })
        .limit(10);

      if (!error && data && data.length >= 3) {
        // Use real DB data — mask names for privacy
        const realEntries: LeaderEntry[] = data.map((row) => ({
          rank: row.rank,
          username: maskDisplayName(row.display_name),
          country: row.country_flag || COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)],
          profit: Number(row.profit),
          withdrawal: Number(row.withdrawal),
          total: Number(row.total),
          asset: row.asset || 'BTC/USD',
          winRate: row.win_rate ?? 0,
          trades: row.trades ?? 0,
          isReal: true,
        }));
        setLeaders(realEntries);
        setIsRealData(true);
      } else {
        // Fallback: simulated data
        setLeaders(generateLeaderboard());
        setIsRealData(false);
      }
    } catch {
      setLeaders(generateLeaderboard());
      setIsRealData(false);
    } finally {
      setLeaderboardLoading(false);
    }
  }, []);

  // Leaderboard + countdown
  useEffect(() => {
    setMounted(true);
    setCountdown(getSecondsUntilMidnightUTC());
    fetchLeaderboard();

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchLeaderboard();
          return getSecondsUntilMidnightUTC();
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [fetchLeaderboard]);

  const formatCountdown = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  if (!mounted || !authChecked) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col">
      <DashboardTopBar
        wallet={wallet}
        walletLoading={walletLoading}
        isDemo={isDemo}
        onToggleDemo={setIsDemo}
        userEmail={userEmail}
        onDepositClick={() => setDepositOpen(true)}
      />

      <div className="flex-1 overflow-y-auto">
        {/* Hero Banner */}
        <div
          className="relative overflow-hidden px-4 sm:px-6 py-8 sm:py-12"
          style={{
            background: 'linear-gradient(135deg, rgba(37,99,235,0.08) 0%, rgba(0,0,0,0) 50%, rgba(124,58,237,0.06) 100%)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div className="absolute top-0 left-1/4 w-64 h-32 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-48 h-24 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-4">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              Daily Leaderboard — Resets Every Midnight UTC
            </div>
            <h1 className="text-2xl sm:text-4xl font-bold text-white mb-2">
              Top 10 Traders
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-500 to-purple-500">
                Today&apos;s Champions
              </span>
            </h1>
            <p className="text-slate-400 text-sm mb-6">
              Ranked by combined profit + withdrawal. Trade more, earn more, climb higher.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6">
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
                  <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
                </svg>
                <span className="text-slate-400 text-xs">Resets in</span>
                <span className="text-white font-bold text-sm tabular-nums font-mono">
                  {formatCountdown(countdown)}
                </span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <span className="text-blue-400 text-xs font-semibold">Total Prize Pool</span>
                <span className="text-blue-300 font-bold text-sm">$72,500</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10">
                <span className="text-slate-400 text-xs">Top Prize</span>
                <span className="text-emerald-400 font-bold text-sm">$20,000</span>
              </div>
              {isRealData && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-emerald-400 text-xs font-semibold">Live Rankings</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Prize Structure */}
        <div className="px-4 sm:px-6 py-5 border-b border-white/5">
          <div className="max-w-3xl mx-auto">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Prize Structure</h3>
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
              {PRIZES.map((prize, i) => (
                <div
                  key={i}
                  className={`flex flex-col items-center py-2 px-1 rounded-lg border text-center ${
                    i === 0 ? 'bg-blue-600/15 border-blue-500/30' :
                    i === 1 ? 'bg-purple-600/10 border-purple-500/25' :
                    i === 2 ? 'bg-blue-800/10 border-blue-700/25' : 'bg-blue-500/5 border-blue-500/15'
                  }`}
                >
                  <span className="text-[10px] text-slate-500 font-medium">#{i + 1}</span>
                  <span className={`text-xs font-bold mt-0.5 ${i === 0 ? 'text-blue-300' : i === 1 ? 'text-purple-300' : i === 2 ? 'text-blue-400' : 'text-blue-400'}`}>
                    {prize >= 1000 ? `$${prize / 1000}K` : `$${prize}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Loading state */}
        {leaderboardLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
          </div>
        ) : (
          <>
            {/* Top 3 Podium */}
            <div className="px-4 sm:px-6 pt-6 pb-4 max-w-3xl mx-auto w-full">
              <div className="grid grid-cols-3 gap-3">
                {leaders.slice(0, 3).map((entry, i) => {
                  const style = RANK_STYLES[i];
                  return (
                    <div
                      key={entry.rank}
                      className={`relative flex flex-col items-center py-5 px-3 rounded-2xl bg-gradient-to-b ${style.bg} border ${style.border} shadow-lg ${style.glow}`}
                    >
                      <div className="text-3xl mb-2">{style.badge}</div>
                      <div className="text-white font-bold text-sm sm:text-base text-center leading-tight">{entry.username}</div>
                      <div className="text-slate-400 text-xs mt-0.5 mb-3">{entry.country} · {entry.asset}</div>

                      <div className={`text-lg sm:text-xl font-bold ${style.rankColor} tabular-nums font-mono`}>
                        {formatUSD(entry.total)}
                      </div>
                      <div className="text-slate-500 text-[10px] mb-3">combined total</div>

                      <div className="flex gap-2 text-[10px] mb-3">
                        <div className="text-center">
                          <div className="text-emerald-400 font-semibold font-mono">{formatUSD(entry.profit)}</div>
                          <div className="text-slate-600">profit</div>
                        </div>
                        <div className="w-px bg-white/10" />
                        <div className="text-center">
                          <div className="text-blue-400 font-semibold font-mono">{formatUSD(entry.withdrawal)}</div>
                          <div className="text-slate-600">withdraw</div>
                        </div>
                      </div>

                      <div className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg bg-black/30 border border-white/5">
                        <span className="text-slate-500 text-[10px]">Win Rate</span>
                        <span className="text-white text-xs font-bold">{entry.winRate}%</span>
                      </div>

                      <div className="mt-2 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-500/25 text-blue-400 text-xs font-bold">
                        Prize: ${PRIZES[i].toLocaleString('en-US')}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Ranks 4-10 */}
            <div className="px-4 sm:px-6 pb-8 max-w-3xl mx-auto w-full">
              <div className="rounded-2xl border border-white/8 overflow-hidden bg-[#0a0a0a]">
                <div className="px-4 py-2.5 border-b border-white/8 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Ranks 4–10</span>
                  <span className="text-xs text-slate-600">
                    {isRealData ? 'Live data · resets daily' : 'Simulation data · resets daily'}
                  </span>
                </div>

                <div className="divide-y divide-white/5">
                  {leaders.slice(3).map((entry) => (
                    <div
                      key={entry.rank}
                      className="flex items-center gap-3 px-4 py-3.5 hover:bg-white/3 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-slate-400 text-xs font-bold">#{entry.rank}</span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-white text-sm font-semibold">{entry.username}</span>
                          <span className="text-base">{entry.country}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-slate-500 text-xs">{entry.asset}</span>
                          <span className="text-slate-600 text-[10px]">·</span>
                          <span className="text-slate-500 text-[10px]">{entry.trades} trades</span>
                          <span className="text-slate-600 text-[10px]">·</span>
                          <span className="text-emerald-500 text-[10px] font-medium">{entry.winRate}% win</span>
                        </div>
                      </div>

                      <div className="hidden sm:flex items-center gap-4 text-xs">
                        <div className="text-right">
                          <div className="text-slate-500 text-[10px] uppercase tracking-wider">Profit</div>
                          <div className="text-emerald-400 font-semibold tabular-nums font-mono">
                            {formatUSD(entry.profit)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-slate-500 text-[10px] uppercase tracking-wider">Withdrawal</div>
                          <div className="text-blue-400 font-semibold tabular-nums font-mono">
                            {formatUSD(entry.withdrawal)}
                          </div>
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <div className="text-white font-bold text-sm tabular-nums font-mono">
                          {formatUSD(entry.total)}
                        </div>
                        <div className="text-blue-400 text-xs font-semibold">
                          ${PRIZES[entry.rank - 1]?.toLocaleString('en-US')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Info note */}
              <div className="mt-4 flex items-start gap-2 px-3 py-3 rounded-xl bg-blue-500/5 border border-blue-500/15">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400 flex-shrink-0 mt-0.5">
                  <circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" />
                </svg>
                <p className="text-slate-500 text-xs leading-relaxed">
                  {isRealData
                    ? 'Rankings are based on real combined profit and withdrawal amounts from today\'s trading activity. Usernames are masked for privacy. Leaderboard resets daily at midnight UTC.'
                    : 'Leaderboard data is simulated until enough real trading activity is recorded for today. Rankings are based on combined profit and withdrawal amounts. Leaderboard resets daily at midnight UTC.'}
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      {depositOpen && userId && (
        <DepositModal
          userId={userId}
          onClose={() => setDepositOpen(false)}
          onSuccess={() => { setDepositOpen(false); }}
        />
      )}
    </div>
  );
}
