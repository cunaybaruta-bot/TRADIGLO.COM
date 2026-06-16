'use client';

import { useEffect, useState } from 'react';

// WhatsApp Channel — placeholder, will be added later
const WA_CHANNEL = 'https://whatsapp.com/channel/0029VbCuSOH9MF97jtucBD1c';
const WA_ADMIN =
  'https://wa.me/60147792325?text=Hi%20Tradiglo%2C%20I%20am%20interested%20to%20register.%20I%20am%20from%20Singapore%20and%20would%20like%20to%20know%20how%20to%20get%20started%20with%20Tradiglo.';

const WA_SVG = ({ size = 5 }: { size?: number }) => (
  <svg className={`w-${size} h-${size}`} fill="currentColor" viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const performanceScores = [
  { label: 'Activity', value: 10, gradient: 'linear-gradient(90deg, #818cf8, #34d399)' },
  { label: 'Probability', value: 10, gradient: 'linear-gradient(90deg, #a78bfa, #38bdf8)' },
  { label: 'Reliability', value: 10, gradient: 'linear-gradient(90deg, #6366f1, #38bdf8)' },
  { label: 'Popularity', value: 10, gradient: 'linear-gradient(90deg, #a78bfa, #f472b6)' },
  { label: 'Experience', value: 10, gradient: 'linear-gradient(90deg, #38bdf8, #a78bfa)' },
];

export default function SingaporeHero() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const trackChannel = () => {
    if (typeof window !== 'undefined') (window as any).gtag?.('event', 'click_whatsapp_channel_sg', { location: 'hero' });
  };
  const trackAdmin = () => {
    if (typeof window !== 'undefined') (window as any).gtag?.('event', 'click_whatsapp_admin_sg', { location: 'hero' });
  };

  return (
    <section className="relative min-h-screen flex flex-col justify-center pt-20 pb-10 overflow-hidden">
      {/* Background layers */}
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

      {/* Financial grid */}
      <div
        className="absolute inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(139,92,246,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.5) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
        }}
      />

      <style>{`
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.7; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.08); }
        }
      `}</style>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">

          {/* LEFT: Text */}
          <div className="space-y-6 order-1">

            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              {['Forex, Gold & Crypto', 'Auto Copy Trade', 'Free Demo Account', '100% Deposit Bonus'].map((badge) => (
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
                Smart Investing,{' '}
                <span
                  className="bg-clip-text text-transparent"
                  style={{ backgroundImage: 'linear-gradient(90deg, #A78BFA, #8B5CF6, #6366F1)' }}
                >
                  Minimum Complexity
                </span>
                <br />
                with{' '}
                <span
                  className="bg-clip-text text-transparent"
                  style={{ backgroundImage: 'linear-gradient(90deg, #8B5CF6, #6366F1)' }}
                >
                  Tradiglo!
                </span>
              </h1>
              <p className="text-base text-[#A6A8C3] leading-relaxed max-w-xl">
                Enjoy ultra-fast trading infrastructure and automatic Copy Trade. No experience needed — follow expert investors instantly.
              </p>
              <div className="flex flex-col gap-1.5">
                <p className="text-sm font-semibold text-[#A78BFA]">✦ Start with a Free Demo Account.</p>
                <p className="text-sm font-semibold" style={{ color: '#34d399' }}>✦ 100% Deposit Bonus waiting for you!</p>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href={WA_CHANNEL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={trackChannel}
                className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm transition-all active:scale-95"
                style={{
                  background: 'rgba(139,92,246,0.1)',
                  border: '1px solid rgba(139,92,246,0.35)',
                  color: '#A78BFA',
                  cursor: 'pointer',
                  opacity: 1,
                }}
              >
                <WA_SVG size={5} />
                WhatsApp Channel Singapore
              </a>
              <a
                href={WA_ADMIN}
                target="_blank"
                rel="noopener noreferrer"
                onClick={trackAdmin}
                className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-white font-semibold text-sm hover:opacity-90 transition-all active:scale-95"
                style={{
                  background: 'linear-gradient(135deg, #25D366, #128C7E)',
                  boxShadow: '0 4px 24px rgba(37,211,102,0.25)',
                }}
              >
                <WA_SVG size={5} />
                Register via WhatsApp Admin
              </a>
            </div>

          </div>

          {/* RIGHT: Copy Trading Tradiglo Official Mockup */}
          <div className="flex justify-center lg:justify-end order-2 relative">
            <div className="relative w-full max-w-[380px]">

              {/* Glow behind card */}
              <div
                className="absolute -inset-6 rounded-3xl pointer-events-none"
                style={{
                  background: 'radial-gradient(ellipse at center, rgba(139,92,246,0.25) 0%, transparent 70%)',
                  filter: 'blur(20px)',
                }}
              />

              {/* Copy Trading Card */}
              <div
                className="relative rounded-2xl overflow-hidden"
                style={{
                  background: 'rgba(13,16,48,0.97)',
                  border: '1px solid rgba(139,92,246,0.3)',
                  boxShadow: '0 8px 48px rgba(139,92,246,0.2), 0 2px 8px rgba(0,0,0,0.5)',
                  backdropFilter: 'blur(20px)',
                }}
              >
                {/* Header: Tradiglo + Win Rate */}
                <div className="px-5 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, #3730a3, #4f46e5)' }}
                    >
                      <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M3 3h18v2H3V3zm0 4h12v2H3V7zm0 4h18v2H3v-2zm0 4h12v2H3v-2zm0 4h18v2H3v-2z" />
                        <path d="M16 8l4 4-4 4V8z" />
                      </svg>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-white">Tradiglo</span>
                        <span
                          className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                          style={{ background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.5)', color: '#A78BFA' }}
                        >
                          OFFICIAL
                        </span>
                      </div>
                      <p className="text-xs text-[#A6A8C3]">Official Tradiglo Copy Trade</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-extrabold" style={{ color: '#34d399' }}>90%</p>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#A6A8C3]">WIN RATE</p>
                  </div>
                </div>

                {/* Balance Guarantee Banner */}
                <div className="mx-4 mb-4">
                  <div
                    className="flex items-center gap-2 px-4 py-3 rounded-xl"
                    style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.25)' }}
                  >
                    <svg className="w-4 h-4 flex-shrink-0" style={{ color: '#34d399' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span className="text-sm font-semibold" style={{ color: '#34d399' }}>100% Balance Guarantee on Loss</span>
                  </div>
                </div>

                {/* Stats */}
                <div
                  className="mx-4 mb-4 grid grid-cols-3 divide-x rounded-xl overflow-hidden"
                  style={{ background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.15)', divideColor: 'rgba(139,92,246,0.15)' }}
                >
                  {[
                    { value: '219,855', label: 'FOLLOWERS', color: 'text-white' },
                    { value: '$1,000', label: 'MIN BALANCE', color: 'text-white' },
                    { value: '90%', label: 'WIN RATE', color: '#34d399' },
                  ].map(({ value, label, color }) => (
                    <div key={label} className="py-3 text-center" style={{ borderRight: '1px solid rgba(139,92,246,0.15)' }}>
                      <p className="text-base font-bold" style={{ color: color === 'text-white' ? '#fff' : color }}>{value}</p>
                      <p className="text-[9px] font-bold uppercase tracking-wider text-[#A6A8C3] mt-0.5">{label}</p>
                    </div>
                  ))}
                </div>

                {/* Performance Scores */}
                <div className="px-5 pb-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#A6A8C3] mb-3">Performance Scores</p>
                  <div className="space-y-2.5">
                    {performanceScores.map(({ label, value, gradient }) => (
                      <div key={label} className="flex items-center gap-3">
                        <span className="text-xs text-white w-20 flex-shrink-0">{label}</span>
                        <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${(value / 10) * 100}%`, background: gradient }}
                          />
                        </div>
                        <span className="text-xs text-white font-semibold w-10 text-right flex-shrink-0">
                          <span className="font-bold">{value}</span>
                          <span className="text-[#A6A8C3]">/10</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Real Balance */}
                <div className="mx-4 mb-3">
                  <div
                    className="flex items-center justify-between px-4 py-3 rounded-xl"
                    style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)' }}
                  >
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-[#A6A8C3]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <rect x="2" y="5" width="20" height="14" rx="2" />
                        <path strokeLinecap="round" d="M2 10h20" />
                      </svg>
                      <span className="text-sm text-[#A6A8C3]">Real Balance</span>
                    </div>
                    <span className="text-base font-bold" style={{ color: '#34d399' }}>$4,209,097.50</span>
                  </div>
                </div>

                {/* Platform Fee Notice */}
                <div className="mx-4 mb-4">
                  <div
                    className="flex items-start gap-3 px-4 py-3 rounded-xl"
                    style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)' }}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: 'rgba(139,92,246,0.2)' }}
                    >
                      <svg className="w-4 h-4" style={{ color: '#A78BFA' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <circle cx="12" cy="12" r="10" />
                        <path strokeLinecap="round" d="M12 8v4m0 4h.01" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">20% Platform Fee on Profit</p>
                      <p className="text-xs text-[#A6A8C3] leading-relaxed mt-0.5">
                        Automatically deducted from profits only. Example: $100 profit → you receive $80.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Follow Button */}
                <div className="px-4 pb-5">
                  <a
                    href={WA_ADMIN}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={trackAdmin}
                    className="flex items-center justify-center gap-2 w-full py-4 rounded-xl text-white font-bold text-base hover:opacity-90 transition-all active:scale-95"
                    style={{
                      background: 'linear-gradient(135deg, #6366f1, #8B5CF6)',
                      boxShadow: '0 4px 24px rgba(99,102,241,0.35)',
                    }}
                  >
                    <span>→</span>
                    Follow Tradiglo
                  </a>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
