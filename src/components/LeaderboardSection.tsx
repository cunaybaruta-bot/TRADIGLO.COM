'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

interface LeaderEntry {
  rank: number;
  username: string;
  country: string;
  profit: number;
  withdrawal: number;
  total: number;
  asset: string;
  badge: string;
}

const PRIZES = [20000, 15000, 10000, 8000, 7000, 5000, 3000, 2000, 1500, 1000];

const RANK_STYLES = [
  { bg: 'from-blue-600/20 to-blue-900/10', border: 'border-blue-500/40', badge: '🥇', rankColor: 'text-blue-300' },
  { bg: 'from-purple-600/15 to-purple-900/8', border: 'border-purple-500/35', badge: '🥈', rankColor: 'text-purple-300' },
  { bg: 'from-blue-800/15 to-slate-800/10', border: 'border-blue-700/35', badge: '🥉', rankColor: 'text-blue-400' },
];

const ASSETS = ['BTC/USD', 'ETH/USD', 'XAU/USD', 'EUR/USD', 'NAS100', 'SPX500', 'GBP/USD', 'OIL/USD', 'SOL/USD', 'LTC/USD'];

// Country flag → culturally appropriate name pools
// Each entry: [flag, [firstName1, firstName2, ...], [lastName1, lastName2, ...]]
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
    // Mask last name: show first char + stars
    const lastFirstChar = lastName.charAt(0);
    const stars = Math.floor(rng(3) * 3) + 4; // 4–6 stars
    return `${firstName} ${maskLastWord(lastFirstChar, stars)}`;
  }
  // Fallback for unknown country
  const char = FIRST_CHARS[Math.floor(rng(3) * FIRST_CHARS.length)];
  const stars = Math.floor(rng(4) * 3) + 4;
  return `User ${maskLastWord(char, stars)}`;
}

function generateLeaderboard(): LeaderEntry[] {
  const seed = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  const rng = seededRng(seed);

  // Shuffle countries so each entry gets a unique country slot
  const shuffledCountries = [...COUNTRY_NAMES.map(([flag]) => flag)];
  for (let i = shuffledCountries.length - 1; i > 0; i--) {
    const j = Math.floor(rng(i + 200) * (i + 1));
    [shuffledCountries[i], shuffledCountries[j]] = [shuffledCountries[j], shuffledCountries[i]];
  }

  // Generate 10 entries with unique names
  const usedNames = new Set<string>();
  const entries: LeaderEntry[] = [];

  for (let i = 0; i < 10; i++) {
    const country = shuffledCountries[i % shuffledCountries.length];
    let username = '';
    let attempt = 0;
    // Ensure unique name
    do {
      const entrySeed = seed + i * 31 + attempt * 777 + Math.floor(rng(i + 100 + attempt) * 1000);
      username = getNameForCountry(country, entrySeed);
      attempt++;
    } while (usedNames.has(username) && attempt < 20);
    usedNames.add(username);

    const profit = Math.floor(rng(i * 3) * 180000 + 20000);
    const withdrawal = Math.floor(rng(i * 3 + 1) * 80000 + 5000);
    entries.push({
      rank: i + 1,
      username,
      country,
      profit,
      withdrawal,
      total: profit + withdrawal,
      asset: ASSETS[Math.floor(rng(i * 3 + 0.5) * ASSETS.length)],
      badge: i < 3 ? RANK_STYLES[i].badge : '',
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

export default function LeaderboardSection() {
  const [leaders, setLeaders] = useState<LeaderEntry[]>([]);
  const [countdown, setCountdown] = useState(0);
  const [mounted, setMounted] = useState(false);

  const fetchLeaderboard = useCallback(async () => {
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
        const realEntries: LeaderEntry[] = data.map((row) => ({
          rank: row.rank,
          username: maskDisplayName(row.display_name),
          country: row.country_flag || '🌍',
          profit: Number(row.profit),
          withdrawal: Number(row.withdrawal),
          total: Number(row.total),
          asset: row.asset || 'BTC/USD',
          badge: row.rank <= 3 ? RANK_STYLES[row.rank - 1].badge : '',
        }));
        setLeaders(realEntries);
      } else {
        setLeaders(generateLeaderboard());
      }
    } catch {
      setLeaders(generateLeaderboard());
    }
  }, []);

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

  if (!mounted) return null;

  return (
    <section
      className="py-10 sm:py-16 bg-black relative overflow-hidden"
      style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif" }}
    >
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-blue-900/15 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-[300px] h-[200px] bg-purple-900/15 rounded-full blur-3xl" />
      </div>

      {/* Match MarketsTable container: max-w-7xl, px-2 sm:px-4 */}
      <div className="max-w-7xl mx-auto px-2 sm:px-4 relative z-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-4 sm:mb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] sm:text-xs font-semibold mb-2">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              Daily Leaderboard
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white leading-tight">
              Top 10 Traders
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-500 to-purple-500 text-base sm:text-xl mt-0.5">
                Today&apos;s Champions
              </span>
            </h2>
            <p className="text-slate-400 text-xs mt-1.5">Ranked by combined profit + withdrawal. Resets daily at midnight UTC.</p>
          </div>

          {/* Countdown + Prize Pool */}
          <div className="flex flex-col items-start sm:items-end gap-2">
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-white/5 border border-white/10">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
                <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
              </svg>
              <span className="text-slate-400 text-[10px] sm:text-xs">Resets in</span>
              <span className="text-white font-bold text-xs tabular-nums font-mono">
                {formatCountdown(countdown)}
              </span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <span className="text-blue-400 text-[10px] sm:text-xs font-semibold">Total Prize Pool:</span>
              <span className="text-blue-300 font-bold text-xs sm:text-sm">$72,500</span>
            </div>
          </div>
        </div>

        {/* Leaderboard Table — styled to match MarketsTable */}
        <div className="rounded-xl border border-[#1e2a4a] overflow-hidden bg-black">
          {/* Top 3 podium */}
          <div className="grid grid-cols-3 gap-px bg-[#1e2a4a] border-b border-[#1e2a4a]">
            {leaders.slice(0, 3).map((entry, i) => {
              const style = RANK_STYLES[i];
              return (
                <div
                  key={entry.rank}
                  className={`relative flex flex-col items-center justify-center py-3 px-2 bg-gradient-to-b ${style.bg} border-b-2 ${style.border}`}
                >
                  <div className="text-xl mb-0.5">{style.badge}</div>
                  <div className="text-white font-semibold text-xs sm:text-sm text-center leading-tight">{entry.username}</div>
                  <div className="text-slate-400 text-[10px] sm:text-xs mb-1.5">{entry.country} {entry.asset}</div>
                  <div className={`font-bold text-sm sm:text-base ${style.rankColor} tabular-nums`}>
                    {formatUSD(entry.total)}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">combined</div>
                  <div className="mt-1.5 px-2 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/25 text-blue-400 text-[10px] sm:text-xs font-semibold">
                    Prize: ${PRIZES[i].toLocaleString('en-US')}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Table header — matches MarketsTable thead style */}
          <div className="border-b border-[#1e2a4a]">
            <div className="grid grid-cols-[32px_1fr_auto_auto] sm:grid-cols-[32px_1fr_auto_auto_auto] gap-0">
              <div className="px-2 sm:px-3 py-3 text-slate-500 text-[11px] font-semibold uppercase tracking-wider text-center">#</div>
              <div className="px-2 sm:px-3 py-3 text-slate-500 text-[11px] font-semibold uppercase tracking-wider">Trader</div>
              <div className="px-2 sm:px-3 py-3 text-slate-500 text-[11px] font-semibold uppercase tracking-wider text-right hidden sm:block">Profit</div>
              <div className="px-2 sm:px-3 py-3 text-slate-500 text-[11px] font-semibold uppercase tracking-wider text-right hidden sm:block">Withdrawal</div>
              <div className="px-2 sm:px-3 py-3 text-slate-500 text-[11px] font-semibold uppercase tracking-wider text-right">Total</div>
            </div>
          </div>

          {/* Ranks 4-10 */}
          <div>
            {leaders.slice(3).map((entry) => (
              <div
                key={entry.rank}
                className="grid grid-cols-[32px_1fr_auto_auto] sm:grid-cols-[32px_1fr_auto_auto_auto] gap-0 border-b border-[#1e2a4a] hover:bg-white/[0.03] transition-colors"
                style={{ height: '52px' }}
              >
                {/* Rank */}
                <div className="px-2 sm:px-3 flex items-center justify-center">
                  <span className="text-slate-400 text-[11px] sm:text-sm tabular-nums font-semibold">#{entry.rank}</span>
                </div>

                {/* User info */}
                <div className="px-2 sm:px-3 flex items-center min-w-0">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-white text-xs sm:text-sm font-semibold truncate">{entry.username}</span>
                      <span className="text-sm">{entry.country}</span>
                    </div>
                    <div className="text-slate-500 text-[10px] sm:text-xs">{entry.asset}</div>
                  </div>
                </div>

                {/* Profit */}
                <div className="px-2 sm:px-3 hidden sm:flex items-center justify-end">
                  <div className="text-right">
                    <div className="text-emerald-400 text-xs sm:text-sm font-semibold tabular-nums font-mono">
                      {formatUSD(entry.profit)}
                    </div>
                  </div>
                </div>

                {/* Withdrawal */}
                <div className="px-2 sm:px-3 hidden sm:flex items-center justify-end">
                  <div className="text-right">
                    <div className="text-blue-400 text-xs sm:text-sm font-semibold tabular-nums font-mono">
                      {formatUSD(entry.withdrawal)}
                    </div>
                  </div>
                </div>

                {/* Total + Prize */}
                <div className="px-2 sm:px-3 flex items-center justify-end">
                  <div className="text-right">
                    <div className="text-white font-bold text-xs sm:text-sm tabular-nums font-mono">
                      {formatUSD(entry.total)}
                    </div>
                    <div className="text-blue-400 text-[10px] sm:text-xs font-semibold">
                      ${PRIZES[entry.rank - 1].toLocaleString('en-US')}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-5 text-center">
          <Link
            href="/auth"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-sm transition-all shadow-lg shadow-blue-500/20"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            Join &amp; Compete for Prizes
          </Link>
          <p className="text-slate-500 text-xs mt-2">New leaderboard every day. Top 10 win cash prizes.</p>
        </div>
      </div>
    </section>
  );
}
