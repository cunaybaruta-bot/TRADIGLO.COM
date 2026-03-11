'use client';

import React, { useState, Suspense, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

// Currency symbol SVGs as data URIs (forex — no flags)
const makeCurrencySVG = (symbol: string, color: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48">
      <circle cx="24" cy="24" r="22" fill="${color}" opacity="0.9"/>
      <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle"
        font-family="Arial,sans-serif" font-weight="bold" font-size="18" fill="white">${symbol}</text>
    </svg>`
  )}`;

// ── Floating logo assets ────────────────────────────────────────────────────
// Each coin appears exactly once. No fake SVG badges. No IDR/Indonesian currency.
const LOGO_ASSETS = [
  // ── Crypto ──
  { src: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png',                                       label: 'BTC',   size: 38 },
  { src: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',                                    label: 'ETH',   size: 34 },
  { src: 'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png',                                label: 'BNB',   size: 34 },
  { src: 'https://assets.coingecko.com/coins/images/4128/small/solana.png',                                     label: 'SOL',   size: 34 },
  { src: 'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png',                         label: 'XRP',   size: 30 },
  { src: 'https://assets.coingecko.com/coins/images/975/small/cardano.png',                                     label: 'ADA',   size: 30 },
  { src: 'https://assets.coingecko.com/coins/images/5/small/dogecoin.png',                                      label: 'DOGE',  size: 32 },
  { src: 'https://assets.coingecko.com/coins/images/325/small/Tether.png',                                      label: 'USDT',  size: 32 },
  { src: 'https://assets.coingecko.com/coins/images/6319/small/usdc.png',                                       label: 'USDC',  size: 30 },
  { src: 'https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png',           label: 'AVAX',  size: 32 },
  { src: 'https://assets.coingecko.com/coins/images/12171/small/aave-token-round.png',                          label: 'AAVE',  size: 30 },
  { src: 'https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png',                          label: 'LINK',  size: 30 },
  { src: 'https://assets.coingecko.com/coins/images/1481/small/cosmos_hub.png',                                 label: 'ATOM',  size: 30 },
  { src: 'https://assets.coingecko.com/coins/images/10365/small/near.jpg',                                      label: 'NEAR',  size: 30 },
  { src: 'https://assets.coingecko.com/coins/images/7598/small/wrapped_bitcoin_wbtc.png',                       label: 'WBTC',  size: 32 },
  { src: 'https://assets.coingecko.com/coins/images/3408/small/SNX.png',                                        label: 'SNX',   size: 28 },
  { src: 'https://assets.coingecko.com/coins/images/13397/small/Graph_Token.png',                               label: 'GRT',   size: 28 },
  { src: 'https://assets.coingecko.com/coins/images/2/small/litecoin.png',                                      label: 'LTC',   size: 32 },
  { src: 'https://assets.coingecko.com/coins/images/1094/small/tron-logo.png',                                  label: 'TRX',   size: 30 },
  { src: 'https://assets.coingecko.com/coins/images/25244/small/Optimism.png',                                  label: 'OP',    size: 30 },
  { src: 'https://assets.coingecko.com/coins/images/16547/small/photo_2023-03-29_21.47.00.jpeg',                label: 'ARB',   size: 30 },
  { src: 'https://assets.coingecko.com/coins/images/26375/small/sui_asset.jpeg',                                label: 'SUI',   size: 30 },
  { src: 'https://assets.coingecko.com/coins/images/24383/small/aptos_round.png',                               label: 'APT',   size: 30 },
  { src: 'https://assets.coingecko.com/coins/images/16352/small/FjCeTK4b_400x400.jpg',                          label: 'INJ',   size: 28 },
  { src: 'https://assets.coingecko.com/coins/images/18834/small/wld.png',                                       label: 'WLD',   size: 28 },
  { src: 'https://assets.coingecko.com/coins/images/29850/small/pepe-token.jpeg',                               label: 'PEPE',  size: 28 },
  { src: 'https://assets.coingecko.com/coins/images/12504/small/uniswap-uni.png',                               label: 'UNI',   size: 30 },
  { src: 'https://assets.coingecko.com/coins/images/4713/small/matic-token-icon.png',                           label: 'MATIC', size: 30 },
  { src: 'https://assets.coingecko.com/coins/images/11970/small/polkadot.png',                                  label: 'DOT',   size: 30 },
  { src: 'https://assets.coingecko.com/coins/images/2099/small/Filecoin.png',                                   label: 'FIL',   size: 28 },
  // ── Stocks ──
  { src: 'https://logo.clearbit.com/apple.com',       label: 'AAPL',  size: 32 },
  { src: 'https://logo.clearbit.com/tesla.com',       label: 'TSLA',  size: 32 },
  { src: 'https://logo.clearbit.com/amazon.com',      label: 'AMZN',  size: 32 },
  { src: 'https://logo.clearbit.com/google.com',      label: 'GOOGL', size: 32 },
  { src: 'https://logo.clearbit.com/microsoft.com',   label: 'MSFT',  size: 32 },
  { src: 'https://logo.clearbit.com/alibaba.com',     label: 'BABA',  size: 32 },
  { src: 'https://logo.clearbit.com/meta.com',        label: 'META',  size: 30 },
  { src: 'https://logo.clearbit.com/nvidia.com',      label: 'NVDA',  size: 30 },
  { src: 'https://logo.clearbit.com/netflix.com',     label: 'NFLX',  size: 30 },
  { src: 'https://logo.clearbit.com/samsung.com',     label: 'SMSN',  size: 30 },
  { src: 'https://logo.clearbit.com/jpmorgan.com',    label: 'JPM',   size: 28 },
  { src: 'https://logo.clearbit.com/visa.com',        label: 'V',     size: 28 },
  // ── Commodities ──
  { src: 'https://assets.coingecko.com/coins/images/944/small/PAX_Gold.png',                                    label: 'Gold',  size: 30 },
  { src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Oil_drop.svg/240px-Oil_drop.svg.png',       label: 'Oil',   size: 28 },
];

interface Particle {
  id: number;
  src: string;
  label: string;
  size: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  opacity: number;
  fading: 'none' | 'out' | 'in';
  fadeTarget: { x: number; y: number } | null;
}

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

// ── Floating background logos ───────────────────────────────────────────────
function FloatingBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number>(0);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const W = window.innerWidth;
    const H = window.innerHeight;

    particlesRef.current = LOGO_ASSETS.map((asset, i) => ({
      id: i,
      src: asset.src,
      label: asset.label,
      size: asset.size,
      x: randomBetween(20, W - asset.size - 20),
      y: randomBetween(20, H - asset.size - 60),
      vx: (Math.random() < 0.5 ? -1 : 1) * randomBetween(0.015, 0.045),
      vy: (Math.random() < 0.5 ? -1 : 1) * randomBetween(0.015, 0.045),
      opacity: 0.4,
      fading: 'none',
      fadeTarget: null,
    }));

    const FADE_SPEED = 0.003; // opacity change per ms
    const EDGE_MARGIN = 5;

    let lastTime = performance.now();
    const animate = (time: number) => {
      const delta = Math.min(time - lastTime, 50);
      lastTime = time;

      const cW = window.innerWidth;
      const cH = window.innerHeight;

      particlesRef.current = particlesRef.current.map((p) => {
        let { x, y, vx, vy, opacity, fading, fadeTarget } = p;

        if (fading === 'out') {
          // Fade out
          opacity = Math.max(0, opacity - FADE_SPEED * delta);
          if (opacity <= 0) {
            // Teleport to opposite side and start fade in
            if (fadeTarget) {
              x = fadeTarget.x;
              y = fadeTarget.y;
            }
            fading = 'in';
            fadeTarget = null;
          }
          return { ...p, x, y, vx, vy, opacity, fading, fadeTarget };
        }

        if (fading === 'in') {
          // Fade in
          opacity = Math.min(0.4, opacity + FADE_SPEED * delta);
          x += vx * delta;
          y += vy * delta;
          if (opacity >= 0.4) {
            fading = 'none';
          }
          return { ...p, x, y, vx, vy, opacity, fading, fadeTarget };
        }

        // Normal movement
        x += vx * delta;
        y += vy * delta;

        // Check if reaching edge — start fade out and compute opposite entry point
        const hitLeft   = x <= EDGE_MARGIN;
        const hitRight  = x + p.size >= cW - EDGE_MARGIN;
        const hitTop    = y <= EDGE_MARGIN;
        const hitBottom = y + p.size >= cH - 48 - EDGE_MARGIN;

        if (hitLeft || hitRight || hitTop || hitBottom) {
          let tx = x;
          let ty = y;
          if (hitLeft)   tx = cW - p.size - EDGE_MARGIN - 10;
          if (hitRight)  tx = EDGE_MARGIN + 10;
          if (hitTop)    ty = cH - p.size - 48 - EDGE_MARGIN - 10;
          if (hitBottom) ty = EDGE_MARGIN + 10;

          fading = 'out';
          fadeTarget = { x: tx, y: ty };
        }

        return { ...p, x, y, vx, vy, opacity, fading, fadeTarget };
      });

      setTick((n) => n + 1);
      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, []);

  return (
    <div ref={containerRef} className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
      {particlesRef.current.map((p) => (
        <img
          key={p.id}
          src={p.src}
          alt={p.label}
          width={p.size}
          height={p.size}
          className="absolute select-none"
          style={{
            left: p.x,
            top: p.y,
            width: p.size,
            height: p.size,
            objectFit: 'contain',
            opacity: p.opacity,
            filter: 'drop-shadow(0 0 5px rgba(255,255,255,0.12))',
          }}
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
      ))}
    </div>
  );
}

// ── Ticker bar types ────────────────────────────────────────────────────────
interface TickerItem {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change: number;
  image: string;
}

// ── Scrolling ticker bar ────────────────────────────────────────────────────
function TickerBar() {
  const [items, setItems] = useState<TickerItem[]>([]);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const ids = 'bitcoin,ethereum,binancecoin,solana,ripple,cardano,dogecoin,tether';
        const res = await fetch(
          `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&per_page=8&page=1&sparkline=false&price_change_percentage=24h`,
          { next: { revalidate: 60 } }
        );
        if (!res.ok) return;
        const data = await res.json();
        setItems(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          data.map((c: any) => ({
            id: c.id,
            symbol: c.symbol.toUpperCase(),
            name: c.name,
            price: c.current_price,
            change: c.price_change_percentage_24h,
            image: c.image,
          }))
        );
      } catch {
        // silently fail
      }
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 60000);
    return () => clearInterval(interval);
  }, []);

  if (items.length === 0) return null;

  const doubled = [...items, ...items];

  return (
    <div
      className="fixed bottom-0 left-0 right-0 overflow-hidden"
      style={{
        zIndex: 20,
        background: 'rgba(0,0,0,0.95)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        height: 44,
      }}
    >
      <div
        className="flex items-center h-full"
        style={{
          display: 'flex',
          whiteSpace: 'nowrap',
          animation: 'ticker-scroll 40s linear infinite',
          width: 'max-content',
        }}
      >
        {doubled.map((item, idx) => (
          <span
            key={`${item.id}-${idx}`}
            className="inline-flex items-center gap-1.5 px-5"
            style={{ flexShrink: 0 }}
          >
            <img
              src={item.image}
              alt={item.symbol}
              width={18}
              height={18}
              style={{ width: 18, height: 18, objectFit: 'contain', borderRadius: 2 }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <span className="text-white/80 text-xs font-semibold tracking-wide">{item.symbol}</span>
            <span className="text-white/60 text-xs">
              ${item.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span
              className="text-xs font-medium"
              style={{ color: item.change >= 0 ? '#22c55e' : '#ef4444' }}
            >
              {item.change >= 0 ? '+' : ''}{item.change?.toFixed(2)}%
            </span>
            <span className="text-white/20 text-xs ml-2">|</span>
          </span>
        ))}
      </div>

      <style>{`
        @keyframes ticker-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}

// ── Eye icon ────────────────────────────────────────────────────────────────
const EyeIcon = ({ open }: { open: boolean }) =>
  open ? (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  );

// ── Main auth form ──────────────────────────────────────────────────────────
function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get('tab') === 'signin' ? 'signin' : 'signup';

  const [tab, setTab] = useState<'signup' | 'signin'>(defaultTab);

  // Sign In state
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [signInLoading, setSignInLoading] = useState(false);
  const [signInError, setSignInError] = useState<string | null>(null);

  // Sign Up state
  const [fullName, setFullName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [signUpLoading, setSignUpLoading] = useState(false);
  const [signUpError, setSignUpError] = useState<string | null>(null);
  const [signUpSuccess, setSignUpSuccess] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignInError(null);
    setSignInLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: signInEmail, password: signInPassword });
    if (error) {
      setSignInError(error.message);
      setSignInLoading(false);
    } else {
      router.replace('/dashboard');
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignUpError(null);
    if (signUpPassword !== confirmPassword) {
      setSignUpError('Password dan konfirmasi password tidak cocok.');
      return;
    }
    if (signUpPassword.length < 6) {
      setSignUpError('Password minimal 6 karakter.');
      return;
    }
    setSignUpLoading(true);
    const { error } = await supabase.auth.signUp({
      email: signUpEmail,
      password: signUpPassword,
      options: { data: { full_name: fullName } },
    });
    if (error) {
      setSignUpError(error.message);
      setSignUpLoading(false);
    } else {
      setSignUpSuccess(true);
      setSignUpLoading(false);
    }
  };

  return (
    <>
      {/* Full-page pure black background */}
      <div
        className="fixed inset-0"
        style={{ background: '#000000', zIndex: -1 }}
      />

      {/* Floating logos in background */}
      <FloatingBackground />

      {/* Page wrapper */}
      <div className="relative min-h-screen flex flex-col items-center justify-center px-4 pb-12" style={{ zIndex: 10 }}>
        {/* Form card — pure black */}
        <div
          className="w-full max-w-md rounded-2xl px-8 py-8 shadow-2xl"
          style={{
            background: '#0a0a0a',
            border: '1px solid rgba(255,255,255,0.1)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
          }}
        >
          {/* Heading */}
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-6 text-center">
            Welcome to Investoft!
          </h1>

          {/* Tab Toggle */}
          <div className="flex rounded-lg bg-[#111111] border border-white/10 p-1 mb-7">
            <button
              onClick={() => { setTab('signup'); setSignUpError(null); setSignUpSuccess(false); }}
              className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all duration-200 ${
                tab === 'signup' ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow' : 'text-gray-400 hover:text-white bg-transparent'
              }`}
            >
              SIGN UP
            </button>
            <button
              onClick={() => { setTab('signin'); setSignInError(null); }}
              className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all duration-200 ${
                tab === 'signin' ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow' : 'text-gray-400 hover:text-white bg-transparent'
              }`}
            >
              LOG IN
            </button>
          </div>

          {/* Fixed-height form container */}
          <div style={{ minHeight: 340, position: 'relative' }}>

            {/* SIGN UP Form */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                opacity: tab === 'signup' ? 1 : 0,
                visibility: tab === 'signup' ? 'visible' : 'hidden',
                transition: 'opacity 0.2s ease',
                pointerEvents: tab === 'signup' ? 'auto' : 'none',
              }}
            >
              {signUpSuccess ? (
                <div className="text-center py-6">
                  <div className="w-14 h-14 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h2 className="text-white font-semibold text-lg mb-2">Registrasi Berhasil!</h2>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    Akun kamu berhasil dibuat. Silakan cek email untuk verifikasi.
                  </p>
                  <button
                    onClick={() => { setSignUpSuccess(false); setTab('signin'); }}
                    className="inline-block mt-6 px-6 py-2.5 rounded-lg text-sm font-medium text-white transition-all duration-200"
                    style={{ background: 'linear-gradient(to right, #3b82f6, #6366f1)' }}
                  >
                    Lanjut ke Login
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSignUp} className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Full Name</label>
                    <input
                      type="text"
                      autoComplete="name"
                      required={tab === 'signup'}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full bg-[#111111] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Email</label>
                    <input
                      type="email"
                      autoComplete="email"
                      required={tab === 'signup'}
                      value={signUpEmail}
                      onChange={(e) => setSignUpEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full bg-[#111111] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Password</label>
                    <div className="relative">
                      <input
                        type={showSignUpPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        required={tab === 'signup'}
                        value={signUpPassword}
                        onChange={(e) => setSignUpPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-[#111111] border border-white/10 rounded-lg px-4 py-3 pr-11 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                        tabIndex={-1}
                      >
                        <EyeIcon open={showSignUpPassword} />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Confirm Password</label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        required={tab === 'signup'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-[#111111] border border-white/10 rounded-lg px-4 py-3 pr-11 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                        tabIndex={-1}
                      >
                        <EyeIcon open={showConfirmPassword} />
                      </button>
                    </div>
                  </div>

                  {signUpError && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">
                      <p className="text-red-400 text-sm">{signUpError}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={signUpLoading}
                    className="w-full py-3 rounded-lg font-semibold text-sm text-white transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{ background: 'linear-gradient(to right, #22c55e, #16a34a)' }}
                  >
                    {signUpLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Creating account…
                      </span>
                    ) : (
                      'Sign up'
                    )}
                  </button>
                </form>
              )}
            </div>

            {/* SIGN IN Form */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                opacity: tab === 'signin' ? 1 : 0,
                visibility: tab === 'signin' ? 'visible' : 'hidden',
                transition: 'opacity 0.2s ease',
                pointerEvents: tab === 'signin' ? 'auto' : 'none',
              }}
            >
              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Email Address</label>
                  <input
                    type="email"
                    autoComplete="email"
                    required={tab === 'signin'}
                    value={signInEmail}
                    onChange={(e) => setSignInEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-[#111111] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Password</label>
                  <div className="relative">
                    <input
                      type={showSignInPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required={tab === 'signin'}
                      value={signInPassword}
                      onChange={(e) => setSignInPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#111111] border border-white/10 rounded-lg px-4 py-3 pr-11 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignInPassword(!showSignInPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                      tabIndex={-1}
                    >
                      <EyeIcon open={showSignInPassword} />
                    </button>
                  </div>
                </div>

                {signInError && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">
                    <p className="text-red-400 text-sm">{signInError}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={signInLoading}
                  className="w-full py-3 rounded-lg font-semibold text-sm text-white transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ background: 'linear-gradient(to right, #3b82f6, #6366f1)' }}
                >
                  {signInLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Signing in…
                    </span>
                  ) : (
                    'Sign In'
                  )}
                </button>
              </form>
            </div>
          </div>

          <p className="text-center text-gray-600 text-xs mt-8">
            © 2026 INVESTOFT. All rights reserved.
          </p>
        </div>
      </div>

      {/* Ticker bar at bottom */}
      <TickerBar />
    </>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#000000' }}>
        <div className="text-white">Loading...</div>
      </div>
    }>
      <AuthForm />
    </Suspense>
  );
}
