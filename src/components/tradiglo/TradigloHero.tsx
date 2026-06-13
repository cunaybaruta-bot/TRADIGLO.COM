'use client';

import { useEffect, useState } from 'react';
import { ShieldCheck, Bell, AlertTriangle, TrendingUp } from 'lucide-react';
import Icon from '@/components/ui/AppIcon';


const WA_CHANNEL = 'https://whatsapp.com/channel/0029VbDNq7VGzzKIpSf7VE1g';
const WA_ADMIN = 'https://wa.me/60147792325?text=Hi%20Tradiglo%2C%20saya%20berminat%20untuk%20daftar.%20Saya%20dari%20Malaysia%20dan%20ingin%20tahu%20cara%20bermula%20dengan%20Tradiglo.';

const WA_SVG = ({ size = 5 }: { size?: number }) => (
  <svg className={`w-${size} h-${size}`} fill="currentColor" viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const tickers = [
  { symbol: 'XAUUSD', label: 'Gold' },
  { symbol: 'BTC', label: 'Bitcoin' },
  { symbol: 'ETH', label: 'Ethereum' },
  { symbol: 'EURUSD', label: 'Euro' },
  { symbol: 'GBPUSD', label: 'Pound' },
];

const trustBadges = [
  { icon: ShieldCheck, text: 'Tiada Janji Profit' },
  { icon: AlertTriangle, text: 'Bukan Skim Cepat Kaya' },
  { icon: ShieldCheck, text: 'Risiko Dinyatakan Jelas' },
  { icon: Bell, text: 'WhatsApp Channel Rasmi' },
  { icon: TrendingUp, text: 'Daftar Melalui Admin Malaysia' },
];

export default function TradigloHero() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const trackChannel = () => {
    if (typeof window !== 'undefined') (window as any).gtag?.('event', 'click_whatsapp_channel', { location: 'hero' });
  };
  const trackAdmin = () => {
    if (typeof window !== 'undefined') (window as any).gtag?.('event', 'click_whatsapp_admin', { location: 'hero' });
  };

  return (
    <section className="relative min-h-screen flex flex-col justify-center pt-20 pb-10 overflow-hidden">
      {/* ── Background layers ── */}
      <div className="absolute inset-0 bg-[#07091F]" />

      {/* Animated glow orbs */}
      <div
        className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 70%)',
          animation: mounted ? 'pulse-glow 6s ease-in-out infinite' : undefined,
        }}
      />
      <div
        className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(99,102,241,0.14) 0%, transparent 70%)',
          animation: mounted ? 'pulse-glow 8s ease-in-out infinite reverse' : undefined,
        }}
      />
      <div
        className="absolute top-[40%] left-[40%] w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)',
          animation: mounted ? 'pulse-glow 10s ease-in-out infinite 2s' : undefined,
        }}
      />

      {/* Financial grid */}
      <div
        className="absolute inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(139,92,246,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.5) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
        }}
      />

      {/* Abstract chart line */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.06]"
        preserveAspectRatio="none"
        viewBox="0 0 1440 800"
        fill="none"
      >
        <polyline
          points="0,600 120,550 240,580 360,480 480,520 600,420 720,460 840,360 960,400 1080,300 1200,340 1320,240 1440,280"
          stroke="url(#chartGrad)"
          strokeWidth="2"
          fill="none"
        />
        <defs>
          <linearGradient id="chartGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#6366F1" />
          </linearGradient>
        </defs>
      </svg>

      <style>{`
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.7; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.08); }
        }
        @keyframes ticker-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes float-card-1 {
          0%, 100% { transform: translateY(0px) rotate(-2deg); }
          50% { transform: translateY(-8px) rotate(-2deg); }
        }
        @keyframes float-card-2 {
          0%, 100% { transform: translateY(0px) rotate(2deg); }
          50% { transform: translateY(-6px) rotate(2deg); }
        }
        @keyframes float-card-3 {
          0%, 100% { transform: translateY(0px) rotate(-1deg); }
          50% { transform: translateY(-10px) rotate(-1deg); }
        }
      `}</style>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">

          {/* ── LEFT: Text ── */}
          <div className="space-y-6 order-1">

            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              {['Forex, Gold & Crypto', 'WhatsApp Channel Malaysia', 'Panduan Risiko', 'Kemas Kini Pasaran Harian'].map((badge) => (
                <span
                  key={badge}
                  className="px-3 py-1 rounded-full text-xs font-semibold"
                  style={{
                    border: '1px solid rgba(139,92,246,0.35)',
                    background: 'rgba(139,92,246,0.08)',
                    color: '#A78BFA',
                  }}
                >
                  {badge}
                </span>
              ))}
            </div>

            {/* Headline */}
            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl lg:text-[2.6rem] font-extrabold leading-tight text-white tracking-tight">
                Signal{' '}
                <span
                  className="bg-clip-text text-transparent"
                  style={{ backgroundImage: 'linear-gradient(90deg, #A78BFA, #8B5CF6, #6366F1)' }}
                >
                  Forex, Gold & Crypto
                </span>
                <br />
                Untuk{' '}
                <span
                  className="bg-clip-text text-transparent"
                  style={{ backgroundImage: 'linear-gradient(90deg, #8B5CF6, #6366F1)' }}
                >
                  Trader Malaysia
                </span>
                <br />
                Yang Mahu{' '}
                <span
                  className="bg-clip-text text-transparent"
                  style={{ backgroundImage: 'linear-gradient(90deg, #A78BFA, #8B5CF6)' }}
                >
                  Entry Lebih Tersusun
                </span>
              </h1>
              <p className="text-base text-[#A6A8C3] leading-relaxed max-w-xl">
                Ikuti kemas kini pasaran, signal XAUUSD, Forex dan Crypto melalui WhatsApp Channel Tradiglo. Untuk pendaftaran dan onboarding, hubungi WhatsApp Admin Malaysia.
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href={WA_CHANNEL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={trackChannel}
                className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-white font-semibold text-sm hover:opacity-90 transition-all active:scale-95"
                style={{
                  background: 'linear-gradient(135deg, #25D366, #128C7E)',
                  boxShadow: '0 4px 24px rgba(37,211,102,0.25)',
                }}
              >
                <WA_SVG size={5} />
                Sertai WhatsApp Channel Percuma
              </a>
              <a
                href={WA_ADMIN}
                target="_blank"
                rel="noopener noreferrer"
                onClick={trackAdmin}
                className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm hover:bg-[rgba(139,92,246,0.12)] transition-all active:scale-95"
                style={{
                  border: '1px solid rgba(139,92,246,0.4)',
                  color: '#A78BFA',
                }}
              >
                <WA_SVG size={4} />
                Daftar Melalui WhatsApp Admin
              </a>
            </div>

            {/* Microcopy */}
            <div className="space-y-1.5">
              <p className="text-xs text-[#A6A8C3]/60 leading-relaxed">
                1 klik sahaja. Tiada Telegram. Update terus melalui WhatsApp.
              </p>
              <p className="text-xs text-[#A6A8C3]/50 leading-relaxed">
                Tiada jaminan keuntungan. Trading melibatkan risiko. Gunakan signal bersama pengurusan risiko yang disiplin.
              </p>
            </div>

            {/* Trust badges — horizontal desktop, 2-col mobile */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 pt-2">
              {trustBadges.map(({ icon: Icon, text }) => (
                <div
                  key={text}
                  className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg"
                  style={{
                    background: '#0B0E2D',
                    border: '1px solid rgba(139,92,246,0.2)',
                  }}
                >
                  <Icon className="w-3 h-3 flex-shrink-0" style={{ color: '#8B5CF6' }} />
                  <span className="text-[10px] text-[#A6A8C3] leading-tight font-medium">{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── RIGHT: Signal Card + Floating Cards ── */}
          <div className="flex justify-center lg:justify-end order-2 relative">
            <div className="relative w-full max-w-[360px]">

              {/* Floating card 1 — top left */}
              <div
                className="absolute -left-8 top-4 z-20 hidden lg:block"
                style={{ animation: 'float-card-1 4s ease-in-out infinite' }}
              >
                <div
                  className="px-3 py-2.5 rounded-xl w-44"
                  style={{
                    background: '#11143A',
                    border: '1px solid rgba(139,92,246,0.3)',
                    boxShadow: '0 4px 20px rgba(139,92,246,0.15)',
                  }}
                >
                  <p className="text-[9px] font-bold uppercase tracking-wider mb-1" style={{ color: '#8B5CF6' }}>Market Bias</p>
                  <p className="text-xs text-white font-semibold">XAUUSD: Watch Buy Zone</p>
                </div>
              </div>

              {/* Floating card 2 — bottom left */}
              <div
                className="absolute -left-6 bottom-16 z-20 hidden lg:block"
                style={{ animation: 'float-card-2 5s ease-in-out infinite 1s' }}
              >
                <div
                  className="px-3 py-2.5 rounded-xl w-44"
                  style={{
                    background: '#11143A',
                    border: '1px solid rgba(139,92,246,0.3)',
                    boxShadow: '0 4px 20px rgba(139,92,246,0.15)',
                  }}
                >
                  <p className="text-[9px] font-bold uppercase tracking-wider mb-1" style={{ color: '#8B5CF6' }}>Risk Note</p>
                  <p className="text-xs text-white font-semibold">Maksimum 1% setiap trade</p>
                </div>
              </div>

              {/* Floating card 3 — top right */}
              <div
                className="absolute -right-6 top-8 z-20 hidden lg:block"
                style={{ animation: 'float-card-3 6s ease-in-out infinite 0.5s' }}
              >
                <div
                  className="px-3 py-2.5 rounded-xl w-44"
                  style={{
                    background: '#11143A',
                    border: '1px solid rgba(139,92,246,0.3)',
                    boxShadow: '0 4px 20px rgba(139,92,246,0.15)',
                  }}
                >
                  <p className="text-[9px] font-bold uppercase tracking-wider mb-1" style={{ color: '#25D366' }}>Channel Update</p>
                  <p className="text-xs text-white font-semibold">WhatsApp alert aktif</p>
                </div>
              </div>

              {/* Glow behind card */}
              <div
                className="absolute -inset-6 rounded-3xl pointer-events-none"
                style={{
                  background: 'radial-gradient(ellipse at center, rgba(139,92,246,0.25) 0%, transparent 70%)',
                  filter: 'blur(20px)',
                }}
              />

              {/* Main Signal Card */}
              <div
                className="relative rounded-2xl overflow-hidden"
                style={{
                  background: 'rgba(17,20,58,0.95)',
                  border: '1px solid rgba(139,92,246,0.3)',
                  boxShadow: '0 8px 48px rgba(139,92,246,0.2), 0 2px 8px rgba(0,0,0,0.5)',
                  backdropFilter: 'blur(20px)',
                }}
              >
                {/* Card Header */}
                <div
                  className="px-5 py-4 flex items-center justify-between"
                  style={{ borderBottom: '1px solid rgba(139,92,246,0.15)' }}
                >
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: '#8B5CF6' }}>Contoh Signal</p>
                    <p className="text-xs text-[#A6A8C3] font-medium">Tradiglo Malaysia</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6] animate-pulse" />
                    <span className="text-[10px] text-[#A6A8C3]">Live Preview</span>
                  </div>
                </div>

                <div className="px-5 py-4 space-y-4">
                  {/* Market + Setup */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-[#A6A8C3] mb-1">Market</p>
                      <p className="text-lg font-bold text-white tracking-wide">XAUUSD</p>
                    </div>
                    <span
                      className="px-3 py-1.5 rounded-lg text-sm font-bold"
                      style={{
                        background: 'rgba(139,92,246,0.15)',
                        border: '1px solid rgba(139,92,246,0.4)',
                        color: '#A78BFA',
                      }}
                    >
                      ▲ BUY
                    </span>
                  </div>

                  {/* Signal rows */}
                  <div className="space-y-2.5">
                    <div
                      className="flex justify-between items-center py-2.5 px-3 rounded-lg"
                      style={{ background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.1)' }}
                    >
                      <span className="text-xs text-[#A6A8C3]">Entry Zone</span>
                      <span className="text-sm font-mono font-bold text-white">2325.00 – 2327.00</span>
                    </div>
                    <div
                      className="flex justify-between items-center py-2.5 px-3 rounded-lg"
                      style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)' }}
                    >
                      <span className="text-xs text-[#A6A8C3]">Stop Loss</span>
                      <span className="text-sm font-mono font-bold text-red-400">2318.00</span>
                    </div>
                    <div
                      className="flex justify-between items-center py-2 px-3 rounded-lg"
                      style={{ background: 'rgba(34,197,94,0.04)', border: '1px solid rgba(34,197,94,0.12)' }}
                    >
                      <span className="text-xs text-[#A6A8C3]">Take Profit 1</span>
                      <span className="text-sm font-mono font-semibold text-green-400">2332.00</span>
                    </div>
                    <div
                      className="flex justify-between items-center py-2 px-3 rounded-lg"
                      style={{ background: 'rgba(34,197,94,0.04)', border: '1px solid rgba(34,197,94,0.12)' }}
                    >
                      <span className="text-xs text-[#A6A8C3]">Take Profit 2</span>
                      <span className="text-sm font-mono font-semibold text-green-400">2338.00</span>
                    </div>
                    <div
                      className="flex justify-between items-center py-2 px-3 rounded-lg"
                      style={{ background: 'rgba(34,197,94,0.04)', border: '1px solid rgba(34,197,94,0.12)' }}
                    >
                      <span className="text-xs text-[#A6A8C3]">Take Profit 3</span>
                      <span className="text-sm font-mono font-semibold text-green-400">2345.00</span>
                    </div>
                    <div
                      className="flex justify-between items-center py-2.5 px-3 rounded-lg"
                      style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)' }}
                    >
                      <span className="text-xs text-[#A6A8C3]">Risk</span>
                      <span className="text-sm font-semibold" style={{ color: '#A78BFA' }}>1% setiap trade</span>
                    </div>
                  </div>

                  {/* Status */}
                  <div
                    className="flex items-center justify-between pt-1 pb-1"
                    style={{ borderTop: '1px solid rgba(139,92,246,0.1)' }}
                  >
                    <span className="text-[10px] text-[#A6A8C3]/60">Status</span>
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                      style={{ background: 'rgba(139,92,246,0.1)', color: '#A78BFA' }}
                    >
                      Contoh paparan
                    </span>
                  </div>
                </div>

                {/* Disclaimer strip */}
                <div
                  className="px-5 py-2.5 text-center"
                  style={{ background: 'rgba(139,92,246,0.06)', borderTop: '1px solid rgba(139,92,246,0.12)' }}
                >
                  <p className="text-[10px] text-[#A6A8C3]/60 italic">
                    Contoh paparan sahaja. Bukan arahan trading sebenar.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Market Ticker ── */}
        <div className="mt-12 overflow-hidden">
          <p className="text-center text-[10px] font-bold uppercase tracking-[0.2em] text-[#A6A8C3]/50 mb-3">
            Market Watchlist
          </p>
          <div className="relative overflow-hidden rounded-xl" style={{ border: '1px solid rgba(139,92,246,0.15)', background: '#0B0E2D' }}>
            <div
              className="flex gap-0"
              style={{ animation: 'ticker-scroll 20s linear infinite', width: 'max-content' }}
            >
              {[...tickers, ...tickers].map((t, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 px-6 py-3"
                  style={{ borderRight: '1px solid rgba(139,92,246,0.1)' }}
                >
                  <span className="text-xs font-bold text-white tracking-wide">{t.symbol}</span>
                  <span className="text-[10px] text-[#A6A8C3]/60">{t.label}</span>
                  <span className="text-[10px] text-[#A6A8C3]/40">· · ·</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
