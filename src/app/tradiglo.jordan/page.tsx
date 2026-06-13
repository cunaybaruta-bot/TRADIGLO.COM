'use client';

import { useState, useEffect } from 'react';
import { ShieldCheck, Bell, AlertTriangle, TrendingDown, UserCheck, Menu, X, MapPin,  } from 'lucide-react';
import Icon from '@/components/ui/AppIcon';


// ─── Jordan-specific constants ───────────────────────────────────────────────
const WA_CHANNEL = 'https://whatsapp.com/channel/0029VbCNAlv2UPBGnuEFNt2T';
const WA_ADMIN = 'https://wa.me/601164457282';

const WA_SVG_SM = (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);
const WA_SVG_MD = (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);
const WA_ICON = (
  <svg className="w-3.5 h-3.5 text-[#25D366] flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

// ─── Header ───────────────────────────────────────────────────────────────────
function JordanHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = [
    { label: 'Copy Trading', href: '#copy-trading' },
    { label: 'باقات الاستثمار', href: '#investment-packages' },
  ];

  const handleNav = (href: string) => {
    setMobileOpen(false);
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <header
      dir="rtl"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-[#07091F]/90 backdrop-blur-2xl border-b border-[rgba(139,92,246,0.18)] shadow-2xl shadow-black/50'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          <a href="/tradiglo.jordan" className="flex items-center gap-3 group">
            <div className="relative flex items-center">
              <div
                style={{
                  width: 36, height: 36,
                  background: 'linear-gradient(135deg, #a78bfa, #8B5CF6, #6366F1)',
                  WebkitMaskImage: 'url(/assets/images/chart-646_1024-1773102864640.png)',
                  WebkitMaskSize: 'contain', WebkitMaskRepeat: 'no-repeat', WebkitMaskPosition: 'center',
                  maskImage: 'url(/assets/images/chart-646_1024-1773102864640.png)',
                  maskSize: 'contain', maskRepeat: 'no-repeat', maskPosition: 'center',
                  filter: 'drop-shadow(0 0 10px rgba(139,92,246,0.6))',
                }}
              />
            </div>
            <div className="flex flex-col leading-none">
              <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 800, letterSpacing: '0.08em' }}
                className="text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-purple-300 to-indigo-300 text-base tracking-widest select-none uppercase">
                TRADIGLO
              </span>
              <span className="text-[9px] text-violet-400/60 tracking-[0.25em] uppercase font-semibold">الأردن</span>
            </div>
          </a>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <button key={link.href} onClick={() => handleNav(link.href)}
                className="px-4 py-2 text-sm text-[#A6A8C3] hover:text-white hover:bg-[rgba(139,92,246,0.08)] rounded-lg transition-all duration-200 font-medium">
                {link.label}
              </button>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <a href={WA_ADMIN} target="_blank" rel="noopener noreferrer"
              onClick={() => typeof window !== 'undefined' && (window as any).gtag?.('event', 'click_whatsapp_admin_jordan', { location: 'header' })}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white text-sm font-semibold hover:opacity-90 transition-all shadow-lg shadow-[#25D366]/25 active:scale-95">
              {WA_SVG_SM}
              سجّل عبر واتساب
            </a>
          </div>

          <div className="md:hidden flex items-center gap-2">
            <a href={WA_ADMIN} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white text-xs font-semibold">
              {WA_SVG_SM}
              سجّل
            </a>
            <button className="p-2 text-[#A6A8C3] hover:text-white transition-colors rounded-lg hover:bg-white/5"
              onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-[#07091F]/98 backdrop-blur-2xl border-t border-[rgba(139,92,246,0.15)]">
          <div className="px-4 py-5 space-y-1">
            {navLinks.map((link) => (
              <button key={link.href} onClick={() => handleNav(link.href)}
                className="block w-full text-right text-sm text-[#A6A8C3] hover:text-white hover:bg-[rgba(139,92,246,0.08)] px-4 py-3 rounded-lg font-medium transition-all">
                {link.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function JordanHero() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  return (
    <section dir="rtl" className="relative min-h-[60vh] flex flex-col justify-center pt-24 pb-16 overflow-hidden">
      <div className="absolute inset-0 bg-[#07091F]" />
      <div className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 70%)', animation: mounted ? 'pulse-glow 6s ease-in-out infinite' : undefined }} />
      <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.14) 0%, transparent 70%)', animation: mounted ? 'pulse-glow 8s ease-in-out infinite reverse' : undefined }} />
      <style>{`
        @keyframes pulse-glow { 0%, 100% { opacity: 0.7; transform: scale(1); } 50% { opacity: 1; transform: scale(1.08); } }
      `}</style>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 w-full text-center">
        <div className="space-y-6">
          <div className="flex flex-wrap justify-center gap-2">
            {['استثمار ثابت الأجل', 'عوائد مضمونة', 'تسجيل عبر أدمن الأردن'].map((badge) => (
              <span key={badge} className="px-3 py-1 rounded-full text-xs font-semibold"
                style={{ border: '1px solid rgba(139,92,246,0.35)', background: 'rgba(139,92,246,0.08)', color: '#A78BFA' }}>
                {badge}
              </span>
            ))}
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight text-white tracking-tight">
            باقات الاستثمار{' '}
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(90deg, #A78BFA, #8B5CF6, #6366F1)' }}>
              Tradiglo
            </span>
            <br />
            للتجار{' '}
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(90deg, #8B5CF6, #6366F1)' }}>
              الأردنيين
            </span>
          </h1>

          <p className="text-base text-[#A6A8C3] leading-relaxed max-w-xl mx-auto">
            استثمار ثابت الأجل مع عوائد مضمونة — اختر الباقة المناسبة لك وتواصل مع أدمن الأردن للتسجيل.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href={WA_CHANNEL} target="_blank" rel="noopener noreferrer"
              onClick={() => typeof window !== 'undefined' && (window as any).gtag?.('event', 'click_whatsapp_channel_jordan', { location: 'hero' })}
              className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm hover:opacity-90 transition-all active:scale-95"
              style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.35)', color: '#A78BFA' }}>
              {WA_SVG_MD}
              انضم لقناة واتساب
            </a>
            <a href={WA_ADMIN} target="_blank" rel="noopener noreferrer"
              onClick={() => typeof window !== 'undefined' && (window as any).gtag?.('event', 'click_whatsapp_admin_jordan', { location: 'hero' })}
              className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-white font-semibold text-sm hover:opacity-90 transition-all active:scale-95"
              style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)', boxShadow: '0 4px 24px rgba(37,211,102,0.25)' }}>
              {WA_SVG_MD}
              سجّل عبر أدمن واتساب
            </a>
          </div>

          <p className="text-xs text-[#A6A8C3]/50 leading-relaxed">
            ما في ضمان للأرباح. التداول فيه مخاطر. استخدم رأس المال المناسب لقدرتك المالية.
          </p>
        </div>
      </div>
    </section>
  );
}

// ─── TrustBar ─────────────────────────────────────────────────────────────────
function JordanTrustBar() {
  const items = [
    { icon: ShieldCheck, text: 'لا ضمان للأرباح' },
    { icon: TrendingDown, text: 'ليس مخطط إثراء سريع' },
    { icon: AlertTriangle, text: 'المخاطر موضّحة بوضوح' },
    { icon: Bell, text: 'استثمار ثابت الأجل' },
    { icon: UserCheck, text: 'التسجيل عبر أدمن الأردن' },
  ];
  return (
    <section dir="rtl" className="py-10"
      style={{ background: '#0B0E2D', borderTop: '1px solid rgba(139,92,246,0.12)', borderBottom: '1px solid rgba(139,92,246,0.12)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {items.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-2.5 p-3.5 rounded-xl transition-all hover:scale-[1.02]"
              style={{ background: '#11143A', border: '1px solid rgba(139,92,246,0.18)' }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)' }}>
                <Icon className="w-3.5 h-3.5" style={{ color: '#8B5CF6' }} />
              </div>
              <span className="text-xs font-medium text-[#A6A8C3] leading-snug">{text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Copy Trading Showcase ────────────────────────────────────────────────────
const COPY_PERFORMANCE_SCORES = [
  { label: 'Activity', value: 10, gradient: 'linear-gradient(90deg, #818cf8, #34d399)' },
  { label: 'Probability', value: 10, gradient: 'linear-gradient(90deg, #a78bfa, #38bdf8)' },
  { label: 'Reliability', value: 10, gradient: 'linear-gradient(90deg, #6366f1, #38bdf8)' },
  { label: 'Popularity', value: 10, gradient: 'linear-gradient(90deg, #a78bfa, #f472b6)' },
  { label: 'Experience', value: 10, gradient: 'linear-gradient(90deg, #38bdf8, #a78bfa)' },
];

function JordanCopyTradingShowcase() {
  return (
    <section dir="rtl" id="copy-trading" className="py-20 relative overflow-hidden"
      style={{ background: '#0B0E2D' }}>
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, rgba(99,102,241,0.18) 0%, transparent 70%)' }} />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full"
            style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)' }}>
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#6366F1' }}>Copy Trading</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight">
            تابع{' '}
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(90deg, #A78BFA, #6366F1)' }}>
              Tradiglo الرسمي
            </span>
            {' '}وانسخ صفقاته تلقائياً
          </h2>
          <p className="text-sm text-[#A6A8C3] leading-relaxed">
            نسبة فوز 90% — انضم إلى أكثر من 219,855 متابعاً يستفيدون من Copy Trade الرسمي لـ Tradiglo.
          </p>
        </div>

        {/* Two-column layout: card + stats */}
        <div className="grid lg:grid-cols-2 gap-8 items-start">

          {/* LEFT: Copy Trading Card */}
          <div className="relative">
            {/* Glow behind card */}
            <div className="absolute -inset-4 rounded-3xl pointer-events-none"
              style={{ background: 'radial-gradient(ellipse at center, rgba(139,92,246,0.2) 0%, transparent 70%)', filter: 'blur(20px)' }} />

            <div className="relative rounded-2xl overflow-hidden"
              style={{
                background: 'rgba(13,16,48,0.97)',
                border: '1px solid rgba(139,92,246,0.3)',
                boxShadow: '0 8px 48px rgba(139,92,246,0.2), 0 2px 8px rgba(0,0,0,0.5)',
              }}>
              {/* Header: Tradiglo + Win Rate */}
              <div className="px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #3730a3, #4f46e5)' }}>
                    <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M3 3h18v2H3V3zm0 4h12v2H3V7zm0 4h18v2H3v-2zm0 4h12v2H3v-2zm0 4h18v2H3v-2z" />
                      <path d="M16 8l4 4-4 4V8z" />
                    </svg>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-white">Tradiglo</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                        style={{ background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.5)', color: '#A78BFA' }}>
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
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl"
                  style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.25)' }}>
                  <svg className="w-4 h-4 flex-shrink-0" style={{ color: '#34d399' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span className="text-sm font-semibold" style={{ color: '#34d399' }}>100% Balance Guarantee on Loss</span>
                </div>
              </div>

              {/* Stats: Followers / Min Balance / Win Rate */}
              <div className="mx-4 mb-4 grid grid-cols-3 rounded-xl overflow-hidden"
                style={{ background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.15)' }}>
                {[
                  { value: '219,855', label: 'FOLLOWERS', color: '#fff' },
                  { value: '$1,000', label: 'MIN BALANCE', color: '#fff' },
                  { value: '90%', label: 'WIN RATE', color: '#34d399' },
                ].map(({ value, label, color }, idx) => (
                  <div key={label} className="py-3 text-center"
                    style={{ borderRight: idx < 2 ? '1px solid rgba(139,92,246,0.15)' : 'none' }}>
                    <p className="text-base font-bold" style={{ color }}>{value}</p>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-[#A6A8C3] mt-0.5">{label}</p>
                  </div>
                ))}
              </div>

              {/* Performance Scores */}
              <div className="px-5 pb-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#A6A8C3] mb-3">Performance Scores</p>
                <div className="space-y-2.5">
                  {COPY_PERFORMANCE_SCORES.map(({ label, value, gradient }) => (
                    <div key={label} className="flex items-center gap-3">
                      <span className="text-xs text-white w-20 flex-shrink-0">{label}</span>
                      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                        <div className="h-full rounded-full" style={{ width: `${(value / 10) * 100}%`, background: gradient }} />
                      </div>
                      <span className="text-xs font-semibold w-10 text-right flex-shrink-0">
                        <span className="text-white font-bold">{value}</span>
                        <span className="text-[#A6A8C3]">/10</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Real Balance */}
              <div className="mx-4 mb-3">
                <div className="flex items-center justify-between px-4 py-3 rounded-xl"
                  style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)' }}>
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
                <div className="flex items-start gap-3 px-4 py-3 rounded-xl"
                  style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)' }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: 'rgba(139,92,246,0.2)' }}>
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
                <a href={WA_ADMIN} target="_blank" rel="noopener noreferrer"
                  onClick={() => typeof window !== 'undefined' && (window as any).gtag?.('event', 'click_copy_trade_cta_jordan', { location: 'copy_trading_section' })}
                  className="flex items-center justify-center gap-2 w-full py-4 rounded-xl text-white font-bold text-base hover:opacity-90 transition-all active:scale-95"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8B5CF6)', boxShadow: '0 4px 24px rgba(99,102,241,0.35)' }}>
                  <span>→</span>
                  تابع Tradiglo عبر واتساب
                </a>
              </div>
            </div>
          </div>

          {/* RIGHT: Key highlights */}
          <div className="space-y-5">
            {/* Why Copy Trade */}
            <div className="rounded-2xl p-6 space-y-4"
              style={{ background: '#11143A', border: '1px solid rgba(139,92,246,0.2)' }}>
              <h3 className="text-base font-bold text-white">لماذا Copy Trading مع Tradiglo؟</h3>
              <div className="space-y-3">
                {[
                  { icon: '◉', title: 'نسبة فوز 90%', desc: 'أداء موثّق ومتسق عبر آلاف الصفقات' },
                  { icon: '◉', title: '+219,855 متابع', desc: 'أكبر مجتمع Copy Trade في المنطقة' },
                  { icon: '◉', title: 'رصيد حقيقي $4.2M+', desc: 'شفافية كاملة في الأداء والأرصدة' },
                  { icon: '◉', title: 'تلقائي 100%', desc: 'الصفقات تُنسخ فورياً بدون تدخل يدوي' },
                  { icon: '◉', title: 'ضمان الرصيد 100%', desc: 'رأس مالك محمي عند الخسارة' },
                ].map(({ icon, title, desc }) => (
                  <div key={title} className="flex items-start gap-3">
                    <span className="text-lg flex-shrink-0 mt-0.5">{icon}</span>
                    <div>
                      <p className="text-sm font-semibold text-white">{title}</p>
                      <p className="text-xs text-[#A6A8C3] mt-0.5">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Score Summary */}
            <div className="rounded-2xl p-5"
              style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)' }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[#A6A8C3]">Overall Score</span>
                <span className="text-2xl font-extrabold" style={{ color: '#34d399' }}>10/10</span>
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {COPY_PERFORMANCE_SCORES.map(({ label, gradient }) => (
                  <div key={label} className="flex flex-col items-center gap-1">
                    <div className="w-full h-1.5 rounded-full" style={{ background: gradient }} />
                    <span className="text-[9px] text-[#A6A8C3] text-center leading-tight">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Disclaimer */}
            <div className="rounded-xl p-4 flex items-start gap-3"
              style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.18)' }}>
              <svg className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-xs text-amber-300/80 leading-relaxed">
                Copy Trading <strong className="text-amber-300">لا يضمن الأرباح</strong>. الأداء السابق لا يضمن النتائج المستقبلية. استخدم رأس المال المناسب لقدرتك المالية.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Investment Package Showcase ──────────────────────────────────────────────

type ShowcaseTier = 'basic' | 'silver' | 'gold' | 'diamond';

interface ShowcasePackage {
  capital: number;
  maxProfit: number;
}

interface ShowcaseTierConfig {
  id: ShowcaseTier;
  labelAr: string;
  tierNameAr: string;
  fromAr: string;
  followers: number;
  maxProfit: string;
  color: string;
  borderColor: string;
  bgColor: string;
  glowColor: string;
  badgeBg: string;
  packages: ShowcasePackage[];
}

const SHOWCASE_TIERS: ShowcaseTierConfig[] = [
  {
    id: 'basic',
    labelAr: 'Basic',
    tierNameAr: 'BASIC TIER',
    fromAr: 'From $100 · 4 options',
    followers: 96761,
    maxProfit: '$80K',
    color: '#10b981',
    borderColor: 'rgba(16,185,129,0.4)',
    bgColor: 'rgba(16,185,129,0.07)',
    glowColor: 'rgba(16,185,129,0.25)',
    badgeBg: 'rgba(16,185,129,0.18)',
    packages: [
      { capital: 100, maxProfit: 8000 },
      { capital: 300, maxProfit: 16000 },
      { capital: 500, maxProfit: 32000 },
      { capital: 1000, maxProfit: 80000 },
    ],
  },
  {
    id: 'silver',
    labelAr: 'Silver',
    tierNameAr: 'SILVER TIER',
    fromAr: 'From $2K · 3 options',
    followers: 79854,
    maxProfit: '$320K',
    color: '#cbd5e1',
    borderColor: 'rgba(203,213,225,0.35)',
    bgColor: 'rgba(203,213,225,0.07)',
    glowColor: 'rgba(203,213,225,0.2)',
    badgeBg: 'rgba(203,213,225,0.15)',
    packages: [
      { capital: 2000, maxProfit: 128000 },
      { capital: 3000, maxProfit: 208000 },
      { capital: 5000, maxProfit: 320000 },
    ],
  },
  {
    id: 'gold',
    labelAr: 'Gold',
    tierNameAr: 'GOLD TIER',
    fromAr: 'From $5K · 4 options',
    followers: 47312,
    maxProfit: '$688K',
    color: '#f59e0b',
    borderColor: 'rgba(245,158,11,0.4)',
    bgColor: 'rgba(245,158,11,0.07)',
    glowColor: 'rgba(245,158,11,0.25)',
    badgeBg: 'rgba(245,158,11,0.18)',
    packages: [
      { capital: 5000, maxProfit: 272000 },
      { capital: 7000, maxProfit: 368000 },
      { capital: 10000, maxProfit: 512000 },
      { capital: 15000, maxProfit: 688000 },
    ],
  },
  {
    id: 'diamond',
    labelAr: 'Diamond',
    tierNameAr: 'DIAMOND TIER',
    fromAr: 'From $20K · 4 options',
    followers: 23567,
    maxProfit: '$7.84M',
    color: '#38bdf8',
    borderColor: 'rgba(56,189,248,0.4)',
    bgColor: 'rgba(56,189,248,0.07)',
    glowColor: 'rgba(56,189,248,0.25)',
    badgeBg: 'rgba(56,189,248,0.18)',
    packages: [
      { capital: 20000, maxProfit: 3200000 },
      { capital: 25000, maxProfit: 4000000 },
      { capital: 30000, maxProfit: 6720000 },
      { capital: 60000, maxProfit: 7840000 },
    ],
  },
];

const SHOWCASE_DURATIONS = [
  { id: '3h', label: '3 Hours', factor: 'x1', multiplier: 1 },
  { id: '6h', label: '6 Hours', factor: 'x1.4', multiplier: 1.4 },
  { id: '12h', label: '12 Hours', factor: 'x2', multiplier: 2 },
  { id: '1d', label: '1 Day', factor: 'x3.2', multiplier: 3.2 },
];

function fmtCapital(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)},${String(n % 1000).padStart(3, '0')}.00`;
  return `$${n.toFixed(2)}`;
}

function fmtProfit(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

function TierIcon({ tier, size = 'sm' }: { tier: ShowcaseTier; size?: 'sm' | 'md' }) {
  const cls = size === 'md' ? 'w-5 h-5' : 'w-3.5 h-3.5';
  if (tier === 'diamond') return (
    <svg className={cls} viewBox="0 0 24 24" fill="currentColor">
      <path d="M6.5 2h11l4.5 6-10 14L1 8z" opacity="0.9" />
    </svg>
  );
  if (tier === 'gold') return (
    <svg className={cls} viewBox="0 0 24 24" fill="currentColor">
      <path d="M2 6l3 7h14l3-7-5 3-5-6-5 6-5-3zm3 9v2h14v-2H5zm2 3v1h10v-1H7z" />
    </svg>
  );
  if (tier === 'silver') return (
    <svg className={cls} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
      <path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6z" />
    </svg>
  );
  return (
    <svg className={cls} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
    </svg>
  );
}

function JordanInvestmentPackages() {
  const [activeTier, setActiveTier] = useState<ShowcaseTier>('basic');
  const [activeDuration, setActiveDuration] = useState<string>('3h');
  const tier = SHOWCASE_TIERS.find((t) => t.id === activeTier)!;
  const duration = SHOWCASE_DURATIONS.find((d) => d.id === activeDuration)!;

  const WA_INVEST = 'https://wa.me/601164457282';

  return (
    <section dir="rtl" id="investment-packages" className="py-20 relative overflow-hidden"
      style={{ background: '#07091F' }}>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] pointer-events-none"
        style={{ background: `radial-gradient(ellipse at center, ${tier.glowColor} 0%, transparent 70%)`, transition: 'background 0.5s ease' }} />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full"
            style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)' }}>
            <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#8B5CF6' }}>Investment Package</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight">
            Fixed-term investment with{' '}
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(90deg, #A78BFA, #6366F1)' }}>
              guaranteed returns
            </span>
          </h2>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl mx-auto"
            style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
            <svg className="w-3.5 h-3.5 flex-shrink-0 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span className="text-xs font-medium text-amber-400">عرض للمشاهدة فقط — للتسجيل تواصل مع أدمن واتساب الأردن</span>
          </div>
        </div>

        {/* Tier Selector */}
        <div className="grid grid-cols-4 gap-2 mb-6 p-1 rounded-2xl"
          style={{ background: '#0B0E2D', border: '1px solid rgba(139,92,246,0.15)' }}>
          {SHOWCASE_TIERS.map((t) => {
            const isActive = activeTier === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTier(t.id)}
                className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl transition-all duration-300"
                style={isActive ? {
                  background: t.bgColor,
                  border: `1px solid ${t.borderColor}`,
                  boxShadow: `0 0 20px ${t.glowColor}`,
                } : {
                  background: 'transparent',
                  border: '1px solid transparent',
                }}>
                <span style={{ color: isActive ? t.color : '#64748b' }}>
                  <TierIcon tier={t.id} />
                </span>
                <span className="text-xs font-bold" style={{ color: isActive ? t.color : '#64748b' }}>
                  {t.labelAr}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tier Info Card */}
        <div className="rounded-2xl p-5 mb-6 transition-all duration-500"
          style={{
            background: `linear-gradient(135deg, ${tier.bgColor} 0%, rgba(7,9,31,0.8) 100%)`,
            border: `1px solid ${tier.borderColor}`,
            boxShadow: `0 4px 32px ${tier.glowColor}`,
          }}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: tier.badgeBg, border: `1px solid ${tier.borderColor}` }}>
                <span style={{ color: tier.color }}>
                  <TierIcon tier={tier.id} size="md" />
                </span>
              </div>
              <div>
                <h3 className="text-sm font-extrabold uppercase tracking-widest mb-0.5" style={{ color: tier.color }}>
                  {tier.tierNameAr}
                </h3>
                <p className="text-xs text-slate-400">{tier.fromAr}</p>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ color: `${tier.color}99` }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  <span className="text-sm font-bold tabular-nums" style={{ color: `${tier.color}cc` }}>
                    {tier.followers.toLocaleString('en-US')}
                  </span>
                  <span className="text-xs text-slate-500">followers</span>
                </div>
              </div>
            </div>
            <div className="text-left flex-shrink-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">MAX PROFIT</p>
              <p className="text-2xl font-black" style={{ color: tier.color }}>{tier.maxProfit}</p>
            </div>
          </div>
        </div>

        {/* Capital Options */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px flex-1" style={{ background: `linear-gradient(90deg, transparent, ${tier.color}40)` }} />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">SELECT CAPITAL AMOUNT</span>
            <div className="h-px flex-1" style={{ background: `linear-gradient(90deg, ${tier.color}40, transparent)` }} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {tier.packages.map((pkg) => {
              const adjustedCapital = Math.round(pkg.capital * duration.multiplier);
              const adjustedProfit = Math.round(pkg.maxProfit * duration.multiplier);
              return (
                <div
                  key={pkg.capital}
                  className="p-4 rounded-xl transition-all duration-200"
                  style={{
                    background: '#0B0E2D',
                    border: '1px solid rgba(255,255,255,0.06)',
                    cursor: 'default',
                  }}>
                  <p className="text-lg font-extrabold text-white mb-0.5">
                    {fmtCapital(adjustedCapital)}
                  </p>
                  <p className="text-xs font-medium" style={{ color: tier.color }}>
                    up to {fmtProfit(adjustedProfit)} profit
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Duration Options */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px flex-1" style={{ background: `linear-gradient(90deg, transparent, ${tier.color}40)` }} />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">SELECT DURATION</span>
            <div className="h-px flex-1" style={{ background: `linear-gradient(90deg, ${tier.color}40, transparent)` }} />
          </div>
          <div className="grid grid-cols-4 gap-2">
            {SHOWCASE_DURATIONS.map((dur) => {
              const isActiveDur = activeDuration === dur.id;
              return (
                <button
                  key={dur.id}
                  onClick={() => setActiveDuration(dur.id)}
                  className="flex flex-col items-center py-3 px-2 rounded-xl transition-all duration-200"
                  style={isActiveDur ? {
                    background: tier.bgColor,
                    border: `1px solid ${tier.borderColor}`,
                    boxShadow: `0 0 16px ${tier.glowColor}`,
                    cursor: 'pointer',
                  } : {
                    background: '#0B0E2D',
                    border: '1px solid rgba(255,255,255,0.06)',
                    cursor: 'pointer',
                  }}>
                  <span className="text-sm font-bold mb-0.5" style={{ color: isActiveDur ? tier.color : '#64748b' }}>
                    {dur.label}
                  </span>
                  <span className="text-xs font-medium" style={{ color: isActiveDur ? `${tier.color}99` : '#475569' }}>
                    {dur.factor}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="rounded-xl p-4 mb-6 flex items-start gap-3"
          style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.18)' }}>
          <svg className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-xs text-amber-300/80 leading-relaxed">
            Investment packages <strong className="text-amber-300">cannot be cancelled</strong> once joined. Capital is locked until the duration expires. A 20% platform fee is deducted from gross profit.
          </p>
        </div>

        {/* CTA Button */}
        <a
          href={WA_INVEST}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => typeof window !== 'undefined' && (window as any).gtag?.('event', 'click_investment_cta_jordan', { tier: activeTier })}
          className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl font-bold text-base transition-all duration-300 hover:opacity-90 active:scale-[0.99]"
          style={{
            background: 'linear-gradient(135deg, #25D366, #128C7E)',
            boxShadow: '0 4px 24px rgba(37,211,102,0.3)',
            color: '#fff',
          }}>
          {WA_SVG_MD}
          تواصل مع أدمن الأردن للتسجيل في {tier.tierNameAr}
        </a>

        <p className="text-center text-[11px] text-slate-600 mt-4">
          للمشاهدة فقط — التسجيل والمعاملات تتم عبر أدمن واتساب الأردن
        </p>
      </div>
    </section>
  );
}

// ─── Final CTA ────────────────────────────────────────────────────────────────
function JordanFinalCTA() {
  return (
    <section dir="rtl" className="py-24 bg-[#080b1a] relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,rgba(99,102,241,0.10),transparent)]" />
      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
        <div className="space-y-4">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight">
            ابدأ استثمارك مع{' '}
            <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">Tradiglo</span>
          </h2>
          <p className="text-gray-400 leading-relaxed max-w-xl mx-auto">
            اختر الباقة المناسبة لك وتواصل مع أدمن واتساب الأردن للتسجيل والبدء.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a href={WA_CHANNEL} target="_blank" rel="noopener noreferrer"
            onClick={() => typeof window !== 'undefined' && (window as any).gtag?.('event', 'click_final_cta_channel_jordan')}
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold hover:opacity-90 transition-all active:scale-95"
            style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.35)', color: '#A78BFA' }}>
            {WA_SVG_MD}
            انضم لقناة واتساب
          </a>
          <a href={WA_ADMIN} target="_blank" rel="noopener noreferrer"
            onClick={() => typeof window !== 'undefined' && (window as any).gtag?.('event', 'click_final_cta_admin_jordan')}
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white font-semibold hover:opacity-90 transition-all shadow-xl shadow-[#25D366]/20 active:scale-95">
            {WA_SVG_MD}
            سجّل عبر أدمن واتساب الأردن
          </a>
        </div>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function JordanFooter() {
  const scrollTo = (id: string) => {
    const el = document.querySelector(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };
  return (
    <footer dir="rtl" className="pb-24 md:pb-0" style={{ background: '#040610', borderTop: '1px solid rgba(139,92,246,0.12)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-10">
        <div className="grid md:grid-cols-4 gap-10 mb-12">
          <div className="md:col-span-2 space-y-5">
            <a href="/tradiglo.jordan" className="flex items-center gap-3 group w-fit">
              <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg, #a78bfa, #8B5CF6, #6366F1)', WebkitMaskImage: 'url(/assets/images/chart-646_1024-1773102864640.png)', WebkitMaskSize: 'contain', WebkitMaskRepeat: 'no-repeat', WebkitMaskPosition: 'center', maskImage: 'url(/assets/images/chart-646_1024-1773102864640.png)', maskSize: 'contain', maskRepeat: 'no-repeat', maskPosition: 'center', filter: 'drop-shadow(0 0 8px rgba(139,92,246,0.5))' }} />
              <div className="flex flex-col leading-none">
                <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 800, letterSpacing: '0.08em' }}
                  className="text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-purple-300 to-indigo-300 text-sm tracking-widest uppercase">TRADIGLO</span>
                <span className="text-[9px] tracking-[0.25em] uppercase font-semibold" style={{ color: 'rgba(139,92,246,0.5)' }}>الأردن</span>
              </div>
            </a>
            <p className="text-xs text-[#A6A8C3]/60 leading-relaxed max-w-sm">
              باقات استثمار ثابتة الأجل مع عوائد مضمونة للتجار الأردنيين — تسجيل عبر أدمن واتساب الأردن.
            </p>
            <div className="flex flex-col gap-2.5 pt-1">
              <a href={WA_CHANNEL} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs hover:text-[#A78BFA] transition-colors font-medium"
                style={{ color: '#A78BFA' }}>
                {WA_ICON}<span>قناة واتساب الأردن</span>
              </a>
              <a href={WA_ADMIN} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs text-[#25D366] hover:text-[#4ade80] transition-colors font-medium">
                {WA_ICON}<span>تواصل مع أدمن واتساب الأردن</span>
              </a>
            </div>
          </div>
          <div className="space-y-4">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#A6A8C3]/50">التنقل</h4>
            <ul className="space-y-2.5">
              {[{ label: 'Copy Trading', id: '#copy-trading' }, { label: 'باقات الاستثمار', id: '#investment-packages' }].map((item) => (
                <li key={item.id}>
                  <button onClick={() => scrollTo(item.id)} className="text-xs text-[#A6A8C3]/50 hover:text-[#A6A8C3] transition-colors">{item.label}</button>
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#A6A8C3]/50">المعلومات</h4>
            <ul className="space-y-2.5">
              <li><a href="/community" className="text-xs text-[#A6A8C3]/50 hover:text-[#A6A8C3] transition-colors">المجتمع</a></li>
              <li><a href="/about/privacy-policy" className="text-xs text-[#A6A8C3]/50 hover:text-[#A6A8C3] transition-colors">سياسة الخصوصية</a></li>
              <li><a href="/about/terms-of-service" className="text-xs text-[#A6A8C3]/50 hover:text-[#A6A8C3] transition-colors">الشروط والأحكام</a></li>
              <li><a href="/about/disclaimer" className="text-xs text-[#A6A8C3]/50 hover:text-[#A6A8C3] transition-colors">إخلاء مسؤولية المخاطر</a></li>
            </ul>
          </div>
        </div>
        <div style={{ borderTop: '1px solid rgba(139,92,246,0.1)' }} className="pt-8 space-y-5">
          <div className="p-4 rounded-xl" style={{ background: 'rgba(139,92,246,0.04)', border: '1px solid rgba(139,92,246,0.12)' }}>
            <p className="text-[11px] text-[#A6A8C3]/50 leading-relaxed">
              <span className="font-semibold text-[#A6A8C3]/70">إخلاء مسؤولية المخاطر:</span>{' '}
              الاستثمار ينطوي على مخاطر وقد لا يكون مناسباً لجميع الأفراد. Tradiglo لا يضمن أي أرباح. المستخدمون مسؤولون كلياً عن قرارات استثمارهم.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <p className="text-[11px] text-[#A6A8C3]/40">© 2025 Tradiglo. جميع الحقوق محفوظة.</p>
            <div className="flex items-center gap-2">
              <MapPin className="w-3 h-3 text-[#A6A8C3]/40" />
              <span className="text-[11px] text-[#A6A8C3]/40">الأردن</span>
              <span className="text-[#A6A8C3]/30">·</span>
              <a href="/community" className="text-[11px] text-[#A6A8C3]/40 hover:text-[#A6A8C3] transition-colors">المجتمع العالمي</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── Mobile Sticky Bar ────────────────────────────────────────────────────────
function JordanMobileStickyBar() {
  return (
    <div dir="rtl" className="md:hidden fixed bottom-0 left-0 right-0 z-50 px-4 py-3"
      style={{ background: 'rgba(7,9,31,0.95)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(139,92,246,0.2)' }}>
      <div className="flex gap-3">
        <a href={WA_CHANNEL} target="_blank" rel="noopener noreferrer"
          onClick={() => typeof window !== 'undefined' && (window as any).gtag?.('event', 'click_mobile_sticky_channel_jordan')}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm active:scale-95 transition-all"
          style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.35)', color: '#A78BFA' }}>
          {WA_SVG_SM}
          Channel
        </a>
        <a href={WA_ADMIN} target="_blank" rel="noopener noreferrer"
          onClick={() => typeof window !== 'undefined' && (window as any).gtag?.('event', 'click_mobile_sticky_admin_jordan')}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-white font-semibold text-sm active:scale-95 transition-all"
          style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)', boxShadow: '0 4px 16px rgba(37,211,102,0.25)' }}>
          {WA_SVG_SM}
          سجّل
        </a>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function TradigloJordanLandingPage() {
  return (
    <div className="min-h-screen bg-[#07091F] text-white" style={{ fontFamily: "'Inter', sans-serif" }}>
      <JordanHeader />
      <main>
        <JordanHero />
        <JordanTrustBar />
        <JordanCopyTradingShowcase />
        <JordanInvestmentPackages />
        <JordanFinalCTA />
      </main>
      <JordanFooter />
      <JordanMobileStickyBar />
    </div>
  );
}
