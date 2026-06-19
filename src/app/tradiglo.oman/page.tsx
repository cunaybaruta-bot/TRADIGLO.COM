'use client';

import { useState } from 'react';
import { MapPin } from 'lucide-react';


type Lang = 'ar' | 'en';

const T = {
  ar: {
    navCopyTrading: 'Copy Trading',
    navInvestment: 'باقات الاستثمار',
    headerCTA: 'سجّل عبر واتساب',
    headerCTAShort: 'سجّل',
    subtitle: 'عُمان',
    badge1: 'استثمار ثابت الأجل',
    badge2: 'عوائد مضمونة',
    badge3: 'تسجيل عبر أدمن عُمان',
    heroTitle1: 'باقات الاستثمار',
    heroTitle2: 'للتجار',
    heroTitle3: 'العُمانيين',
    heroDesc: 'استثمار ثابت الأجل مع عوائد مضمونة — اختر الباقة المناسبة لك وتواصل مع أدمن عُمان للتسجيل.',
    heroChannelBtn: 'انضم لقناة واتساب',
    heroAdminBtn: 'سجّل عبر أدمن واتساب',
    heroDisclaimer: 'ما في ضمان للأرباح. التداول فيه مخاطر. استخدم رأس المال المناسب لقدرتك المالية.',
    trust1: 'لا ضمان للأرباح',
    trust2: 'ليس مخطط إثراء سريع',
    trust3: 'المخاطر موضّحة بوضوح',
    trust4: 'استثمار ثابت الأجل',
    trust5: 'التسجيل عبر أدمن عُمان',
    copyBadge: 'Copy Trading',
    copyTitle1: 'تابع',
    copyTitle2: 'Tradiglo الرسمي',
    copyTitle3: 'وانسخ صفقاته تلقائياً',
    copyDesc: 'نسبة فوز 90% — انضم إلى أكثر من 219,855 متابعاً يستفيدون من Copy Trade الرسمي لـ Tradiglo.',
    copyFollowBtn: 'تابع Tradiglo عبر واتساب',
    copyWhyTitle: 'لماذا Copy Trading مع Tradiglo؟',
    copyPoint1Title: 'نسبة فوز 90%',
    copyPoint1Desc: 'أداء موثّق ومتسق عبر آلاف الصفقات',
    copyPoint2Title: '+219,855 متابع',
    copyPoint2Desc: 'أكبر مجتمع Copy Trade في المنطقة',
    copyPoint3Title: 'رصيد حقيقي $4.2M+',
    copyPoint3Desc: 'شفافية كاملة في الأداء والأرصدة',
    copyPoint4Title: 'تلقائي 100%',
    copyPoint4Desc: 'الصفقات تُنسخ فورياً بدون تدخل يدوي',
    copyPoint5Title: 'ضمان الرصيد 100%',
    copyPoint5Desc: 'رأس مالك محمي عند الخسارة',
    copyDisclaimer: 'Copy Trading لا يضمن الأرباح. الأداء السابق لا يضمن النتائج المستقبلية. استخدم رأس المال المناسب لقدرتك المالية.',
    copyPlatformFeeTitle: '20% Platform Fee on Profit',
    copyPlatformFeeDesc: 'Automatically deducted from profits only. Example: $100 profit → you receive $80.',
    investBadge: 'Investment Package',
    investTitle1: 'استثمار ثابت الأجل مع',
    investTitle2: 'عوائد مضمونة',
    investViewOnly: 'عرض للمشاهدة فقط — للتسجيل تواصل مع أدمن واتساب عُمان',
    investSelectCapital: 'SELECT CAPITAL AMOUNT',
    investSelectDuration: 'SELECT DURATION',
    investDisclaimer: 'Investment packages cannot be cancelled once joined. Capital is locked until the duration expires. A 20% platform fee is deducted from gross profit.',
    investCTAPrefix: 'تواصل مع أدمن عُمان للتسجيل في',
    investFootnote: 'للمشاهدة فقط — التسجيل والمعاملات تتم عبر أدمن واتساب عُمان',
    finalTitle1: 'ابدأ استثمارك مع',
    finalDesc: 'اختر الباقة المناسبة لك وتواصل مع أدمن واتساب عُمان للتسجيل والبدء.',
    finalChannelBtn: 'انضم لقناة واتساب',
    finalAdminBtn: 'سجّل عبر أدمن واتساب عُمان',
    footerDesc: 'باقات استثمار ثابتة الأجل مع عوائد مضمونة للتجار العُمانيين — تسجيل عبر أدمن واتساب عُمان.',
    footerChannelLink: 'قناة واتساب عُمان',
    footerAdminLink: 'تواصل مع أدمن واتساب عُمان',
    footerNavTitle: 'التنقل',
    footerInfoTitle: 'المعلومات',
    footerCommunity: 'المجتمع',
    footerPrivacy: 'سياسة الخصوصية',
    footerTerms: 'الشروط والأحكام',
    footerDisclaimer: 'إخلاء مسؤولية المخاطر',
    footerDisclaimerLabel: 'إخلاء مسؤولية المخاطر:',
    footerDisclaimerText: 'الاستثمار ينطوي على مخاطر وقد لا يكون مناسباً لجميع الأفراد. Tradiglo لا يضمن أي أرباح. المستخدمون مسؤولون كلياً عن قرارات استثمارهم.',
    footerCopyright: '© 2025 Tradiglo. جميع الحقوق محفوظة.',
    footerLocation: 'عُمان',
    footerGlobalCommunity: 'المجتمع العالمي',
    stickyChannel: 'Channel',
    stickyRegister: 'سجّل',
    langLabel: 'AR',
    langFlag: '🇴🇲',
  },
  en: {
    navCopyTrading: 'Copy Trading',
    navInvestment: 'Investment Packages',
    headerCTA: 'Register via WhatsApp',
    headerCTAShort: 'Register',
    subtitle: 'Oman',
    badge1: 'Fixed-Term Investment',
    badge2: 'Guaranteed Returns',
    badge3: 'Register via Oman Admin',
    heroTitle1: 'Investment Packages',
    heroTitle2: 'for',
    heroTitle3: 'Omani Traders',
    heroDesc: 'Fixed-term investment with guaranteed returns — choose your package and contact the Oman admin to register.',
    heroChannelBtn: 'Join WhatsApp Channel',
    heroAdminBtn: 'Register via WhatsApp Admin',
    heroDisclaimer: 'No profit guarantee. Trading involves risk. Only invest what you can afford to lose.',
    trust1: 'No Profit Guarantee',
    trust2: 'Not a Get-Rich-Quick Scheme',
    trust3: 'Risks Clearly Disclosed',
    trust4: 'Fixed-Term Investment',
    trust5: 'Register via Oman Admin',
    copyBadge: 'Copy Trading',
    copyTitle1: 'Follow',
    copyTitle2: 'Official Tradiglo',
    copyTitle3: 'and copy trades automatically',
    copyDesc: '90% win rate — join over 219,855 followers benefiting from Tradiglo\'s official Copy Trade.',
    copyFollowBtn: 'Follow Tradiglo via WhatsApp',
    copyWhyTitle: 'Why Copy Trading with Tradiglo?',
    copyPoint1Title: '90% Win Rate',
    copyPoint1Desc: 'Documented and consistent performance across thousands of trades',
    copyPoint2Title: '+219,855 Followers',
    copyPoint2Desc: 'Largest Copy Trade community in the region',
    copyPoint3Title: 'Real Balance $4.2M+',
    copyPoint3Desc: 'Full transparency in performance and balances',
    copyPoint4Title: '100% Automatic',
    copyPoint4Desc: 'Trades are copied instantly without manual intervention',
    copyPoint5Title: '100% Balance Guarantee',
    copyPoint5Desc: 'Your capital is protected in case of loss',
    copyDisclaimer: 'Copy Trading does not guarantee profits. Past performance does not guarantee future results. Only invest what you can afford to lose.',
    copyPlatformFeeTitle: '20% Platform Fee on Profit',
    copyPlatformFeeDesc: 'Automatically deducted from profits only. Example: $100 profit → you receive $80.',
    investBadge: 'Investment Package',
    investTitle1: 'Fixed-term investment with',
    investTitle2: 'guaranteed returns',
    investViewOnly: 'View only — to register, contact the Oman WhatsApp admin',
    investSelectCapital: 'SELECT CAPITAL AMOUNT',
    investSelectDuration: 'SELECT DURATION',
    investDisclaimer: 'Investment packages cannot be cancelled once joined. Capital is locked until the duration expires. A 20% platform fee is deducted from gross profit.',
    investCTAPrefix: 'Contact Oman Admin to Register for',
    investFootnote: 'View only — registration and transactions are done via Oman WhatsApp admin',
    finalTitle1: 'Start Your Investment with',
    finalDesc: 'Choose your package and contact the Oman WhatsApp admin to register and get started.',
    finalChannelBtn: 'Join WhatsApp Channel',
    finalAdminBtn: 'Register via Oman WhatsApp Admin',
    footerDesc: 'Fixed-term investment packages with guaranteed returns for Omani traders — register via Oman WhatsApp admin.',
    footerChannelLink: 'Oman WhatsApp Channel',
    footerAdminLink: 'Contact Oman WhatsApp Admin',
    footerNavTitle: 'Navigation',
    footerInfoTitle: 'Information',
    footerCommunity: 'Community',
    footerPrivacy: 'Privacy Policy',
    footerTerms: 'Terms of Service',
    footerDisclaimer: 'Risk Disclaimer',
    footerDisclaimerLabel: 'Risk Disclaimer:',
    footerDisclaimerText: 'Investing involves risk and may not be suitable for all individuals. Tradiglo does not guarantee any profits. Users are solely responsible for their investment decisions.',
    footerCopyright: '© 2025 Tradiglo. All rights reserved.',
    footerLocation: 'Oman',
    footerGlobalCommunity: 'Global Community',
    stickyChannel: 'Channel',
    stickyRegister: 'Register',
    langLabel: 'EN',
    langFlag: '🇬🇧',
  },
};

const LANGUAGES = [
  { code: 'ar' as Lang, label: 'العربية', flag: '🇴🇲' },
  { code: 'en' as Lang, label: 'English', flag: '🇬🇧' },
];

// Same WA config as Jordan/Bahrain
const WA_CHANNEL = 'https://whatsapp.com/channel/0029VbCNAlv2UPBGnuEFNt2T';
const WA_ADMIN = 'https://wa.me/601111154832';
const TG_GROUP = 'https://t.me/+MN6PoKpD_1djOTg1';

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

const COPY_PERFORMANCE_SCORES = [
  { label: 'Activity', value: 10, gradient: 'linear-gradient(90deg, #818cf8, #34d399)' },
  { label: 'Probability', value: 10, gradient: 'linear-gradient(90deg, #a78bfa, #38bdf8)' },
  { label: 'Reliability', value: 10, gradient: 'linear-gradient(90deg, #6366f1, #38bdf8)' },
  { label: 'Popularity', value: 10, gradient: 'linear-gradient(90deg, #a78bfa, #f472b6)' },
  { label: 'Experience', value: 10, gradient: 'linear-gradient(90deg, #38bdf8, #a78bfa)' },
];

function OmanHeader({ lang, setLang }: { lang: Lang; setLang: (l: Lang) => void }) {
  const t = T[lang];
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  const scrollTo = (id: string) => { const el = document.querySelector(id); if (el) el.scrollIntoView({ behavior: 'smooth' }); };
  return (
    <header dir={dir} className="sticky top-0 z-40 w-full" style={{ background: 'rgba(7,9,31,0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(139,92,246,0.15)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 gap-4">
          <a href="/tradiglo.oman" className="flex items-center gap-2.5 group flex-shrink-0">
            <div style={{ width: 28, height: 28, background: 'linear-gradient(135deg, #a78bfa, #8B5CF6, #6366F1)', WebkitMaskImage: 'url(/assets/images/chart-646_1024-1773102864640.png)', WebkitMaskSize: 'contain', WebkitMaskRepeat: 'no-repeat', WebkitMaskPosition: 'center', maskImage: 'url(/assets/images/chart-646_1024-1773102864640.png)', maskSize: 'contain', maskRepeat: 'no-repeat', maskPosition: 'center', filter: 'drop-shadow(0 0 6px rgba(139,92,246,0.5))' }} />
            <div className="flex flex-col leading-none">
              <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 800, letterSpacing: '0.08em' }} className="text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-purple-300 to-indigo-300 text-xs tracking-widest uppercase">TRADIGLO</span>
              <span className="text-[8px] tracking-[0.2em] uppercase font-semibold" style={{ color: 'rgba(139,92,246,0.5)' }}>{t.subtitle}</span>
            </div>
          </a>
          <nav className="hidden md:flex items-center gap-6">
            {[{ label: t.navCopyTrading, id: '#copy-trading' }, { label: t.navInvestment, id: '#investment-packages' }].map((item) => (
              <button key={item.id} onClick={() => scrollTo(item.id)} className="text-xs font-medium text-[#A6A8C3]/70 hover:text-white transition-colors">{item.label}</button>
            ))}
          </nav>
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="flex items-center gap-1 p-1 rounded-lg" style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)' }}>
              {LANGUAGES.map((l) => (
                <button key={l.code} onClick={() => setLang(l.code)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-bold transition-all" style={lang === l.code ? { background: 'rgba(139,92,246,0.25)', color: '#A78BFA' } : { color: '#64748b' }}>
                  <span>{l.flag}</span><span>{l.label}</span>
                </button>
              ))}
            </div>
            <a href={TG_GROUP} target="_blank" rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white font-semibold text-xs hover:opacity-90 transition-all active:scale-95"
              style={{ background: 'linear-gradient(135deg, #0088cc, #006699)', boxShadow: '0 2px 12px rgba(0,136,204,0.25)' }}>
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.26 13.947l-2.94-.918c-.64-.203-.658-.64.135-.954l11.566-4.461c.537-.194 1.006.131.873.607z"/></svg>
              {lang === 'ar' ? 'تيليغرام' : 'Telegram'}
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}

function OmanHero({ lang }: { lang: Lang }) {
  const t = T[lang];
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  return (
    <section dir={dir} className="relative min-h-[80vh] flex items-center justify-center py-20 overflow-hidden" style={{ background: 'linear-gradient(160deg, #07091F 0%, #0B0E2D 50%, #07091F 100%)' }}>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px]" style={{ background: 'radial-gradient(ellipse at center, rgba(99,102,241,0.15) 0%, transparent 70%)' }} />
      </div>
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
        <div className="flex flex-wrap items-center justify-center gap-2">
          {[t.badge1, t.badge2, t.badge3].map((badge) => (
            <span key={badge} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold" style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)', color: '#A78BFA' }}>{badge}</span>
          ))}
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight">
          {t.heroTitle1}{' '}<span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(90deg, #A78BFA, #6366F1)' }}>{t.heroTitle2}</span>{' '}{t.heroTitle3}
        </h1>
        <p className="text-base sm:text-lg text-[#A6A8C3] leading-relaxed max-w-2xl mx-auto">{t.heroDesc}</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a href={TG_GROUP} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold hover:opacity-90 transition-all active:scale-95"
            style={{ background: 'rgba(0,136,204,0.12)', border: '1px solid rgba(0,136,204,0.35)', color: '#29B6F6' }}
            aria-label="Join Tradiglo Oman Telegram Group">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.26 13.947l-2.94-.918c-.64-.203-.658-.64.135-.954l11.566-4.461c.537-.194 1.006.131.873.607z"/></svg>
            {lang === 'ar' ? 'انضم لمجموعة تيليغرام' : 'Join Telegram Group'}
          </a>
        </div>
        <p className="text-xs text-[#A6A8C3]/50 leading-relaxed max-w-lg mx-auto">{t.heroDisclaimer}</p>
      </div>
    </section>
  );
}

function OmanTrustBar({ lang }: { lang: Lang }) {
  const t = T[lang];
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  const items = [t.trust1, t.trust2, t.trust3, t.trust4, t.trust5];
  return (
    <div dir={dir} className="py-6" style={{ background: '#0B0E2D', borderTop: '1px solid rgba(139,92,246,0.1)', borderBottom: '1px solid rgba(139,92,246,0.1)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8">
          {items.map((item) => (
            <div key={item} className="flex items-center gap-2">
              <span className="text-emerald-400 text-sm">✓</span>
              <span className="text-xs font-medium text-[#A6A8C3]/70">{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function OmanCopyTradingShowcase({ lang }: { lang: Lang }) {
  const t = T[lang];
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  return (
    <section dir={dir} id="copy-trading" className="py-20 relative overflow-hidden" style={{ background: '#0B0E2D' }}>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, rgba(99,102,241,0.18) 0%, transparent 70%)' }} />
      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)' }}>
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#6366F1' }}>{t.copyBadge}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight">
            {t.copyTitle1}{' '}<span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(90deg, #A78BFA, #6366F1)' }}>{t.copyTitle2}</span>{' '}{t.copyTitle3}
          </h2>
          <p className="text-sm text-[#A6A8C3] leading-relaxed">{t.copyDesc}</p>
        </div>
        <div className="grid lg:grid-cols-2 gap-8 items-start">
          <div className="relative">
            <div className="absolute -inset-4 rounded-3xl pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, rgba(139,92,246,0.2) 0%, transparent 70%)', filter: 'blur(20px)' }} />
            <div className="relative rounded-2xl overflow-hidden" style={{ background: 'rgba(13,16,48,0.97)', border: '1px solid rgba(139,92,246,0.3)', boxShadow: '0 8px 48px rgba(139,92,246,0.2), 0 2px 8px rgba(0,0,0,0.5)' }}>
              <div className="px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #3730a3, #4f46e5)' }}>
                    <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M3 3h18v2H3V3zm0 4h12v2H3V7zm0 4h18v2H3v-2zm0 4h12v2H3v-2zm0 4h18v2H3v-2z" /><path d="M16 8l4 4-4 4V8z" /></svg>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-white">Tradiglo</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.5)', color: '#A78BFA' }}>OFFICIAL</span>
                    </div>
                    <p className="text-xs text-[#A6A8C3]">Official Tradiglo Copy Trade</p>
                  </div>
                </div>
                <div className={lang === 'ar' ? 'text-right' : 'text-left'}>
                  <p className="text-3xl font-extrabold" style={{ color: '#34d399' }}>90%</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#A6A8C3]">WIN RATE</p>
                </div>
              </div>
              <div className="mx-4 mb-4">
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl" style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.25)' }}>
                  <svg className="w-4 h-4 flex-shrink-0" style={{ color: '#34d399' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                  <span className="text-sm font-semibold" style={{ color: '#34d399' }}>100% Balance Guarantee on Loss</span>
                </div>
              </div>
              <div className="mx-4 mb-4 grid grid-cols-3 rounded-xl overflow-hidden" style={{ background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.15)' }}>
                {[{ value: '219,855', label: 'FOLLOWERS', color: '#fff' }, { value: '$1,000', label: 'MIN BALANCE', color: '#fff' }, { value: '90%', label: 'WIN RATE', color: '#34d399' }].map(({ value, label, color }, idx) => (
                  <div key={label} className="py-3 text-center" style={{ borderRight: idx < 2 ? '1px solid rgba(139,92,246,0.15)' : 'none' }}>
                    <p className="text-base font-bold" style={{ color }}>{value}</p>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-[#A6A8C3] mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
              <div className="px-5 pb-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#A6A8C3] mb-3">Performance Scores</p>
                <div className="space-y-2.5">
                  {COPY_PERFORMANCE_SCORES.map(({ label, value, gradient }) => (
                    <div key={label} className="flex items-center gap-3">
                      <span className="text-xs text-white w-20 flex-shrink-0">{label}</span>
                      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                        <div className="h-full rounded-full" style={{ width: `${(value / 10) * 100}%`, background: gradient }} />
                      </div>
                      <span className="text-xs font-semibold w-10 text-right flex-shrink-0"><span className="text-white font-bold">{value}</span><span className="text-[#A6A8C3]">/10</span></span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mx-4 mb-3">
                <div className="flex items-center justify-between px-4 py-3 rounded-xl" style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)' }}>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-[#A6A8C3]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="2" y="5" width="20" height="14" rx="2" /><path strokeLinecap="round" d="M2 10h20" /></svg>
                    <span className="text-sm text-[#A6A8C3]">Real Balance</span>
                  </div>
                  <span className="text-base font-bold" style={{ color: '#34d399' }}>$4,209,097.50</span>
                </div>
              </div>
              <div className="mx-4 mb-4">
                <div className="flex items-start gap-3 px-4 py-3 rounded-xl" style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)' }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: 'rgba(139,92,246,0.2)' }}>
                    <svg className="w-4 h-4" style={{ color: '#A78BFA' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><path strokeLinecap="round" d="M12 8v4m0 4h.01" /></svg>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{t.copyPlatformFeeTitle}</p>
                    <p className="text-xs text-[#A6A8C3] leading-relaxed mt-0.5">{t.copyPlatformFeeDesc}</p>
                  </div>
                </div>
              </div>
              <div className="px-4 pb-5">
                <a href={TG_GROUP} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-4 rounded-xl text-white font-bold text-base hover:opacity-90 transition-all active:scale-95"
                  style={{ background: 'linear-gradient(135deg, #0088cc, #006699)', boxShadow: '0 4px 24px rgba(0,136,204,0.35)' }}>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.26 13.947l-2.94-.918c-.64-.203-.658-.64.135-.954l11.566-4.461c.537-.194 1.006.131.873.607z"/></svg>
                  {lang === 'ar' ? 'تابع Tradiglo عبر تيليغرام' : 'Follow Tradiglo via Telegram'}
                </a>
              </div>
            </div>
          </div>
          <div className="space-y-5">
            <div className="rounded-2xl p-6 space-y-4" style={{ background: '#11143A', border: '1px solid rgba(139,92,246,0.2)' }}>
              <h3 className="text-base font-bold text-white">{t.copyWhyTitle}</h3>
              <div className="space-y-3">
                {[
                  { title: t.copyPoint1Title, desc: t.copyPoint1Desc },
                  { title: t.copyPoint2Title, desc: t.copyPoint2Desc },
                  { title: t.copyPoint3Title, desc: t.copyPoint3Desc },
                  { title: t.copyPoint4Title, desc: t.copyPoint4Desc },
                  { title: t.copyPoint5Title, desc: t.copyPoint5Desc },
                ].map(({ title, desc }) => (
                  <div key={title} className="flex items-start gap-3">
                    <span className="text-lg flex-shrink-0 mt-0.5">◉</span>
                    <div><p className="text-sm font-semibold text-white">{title}</p><p className="text-xs text-[#A6A8C3] mt-0.5">{desc}</p></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl p-5" style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)' }}>
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
            <div className="rounded-xl p-4 flex items-start gap-3" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.18)' }}>
              <svg className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              <p className="text-xs text-amber-300/80 leading-relaxed">{t.copyDisclaimer}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

type ShowcaseTier = 'basic' | 'silver' | 'gold' | 'diamond';
interface ShowcasePackage { capital: number; maxProfit: number; }
interface ShowcaseTierConfig { id: ShowcaseTier; labelAr: string; tierNameAr: string; fromAr: string; followers: number; maxProfit: string; color: string; borderColor: string; bgColor: string; glowColor: string; badgeBg: string; packages: ShowcasePackage[]; }

const SHOWCASE_TIERS: ShowcaseTierConfig[] = [
  { id: 'basic', labelAr: 'Basic', tierNameAr: 'BASIC TIER', fromAr: 'From $100 · 4 options', followers: 96761, maxProfit: '$80K', color: '#10b981', borderColor: 'rgba(16,185,129,0.4)', bgColor: 'rgba(16,185,129,0.07)', glowColor: 'rgba(16,185,129,0.25)', badgeBg: 'rgba(16,185,129,0.18)', packages: [{ capital: 100, maxProfit: 8000 }, { capital: 300, maxProfit: 16000 }, { capital: 500, maxProfit: 32000 }, { capital: 1000, maxProfit: 80000 }] },
  { id: 'silver', labelAr: 'Silver', tierNameAr: 'SILVER TIER', fromAr: 'From $2K · 3 options', followers: 79854, maxProfit: '$320K', color: '#cbd5e1', borderColor: 'rgba(203,213,225,0.35)', bgColor: 'rgba(203,213,225,0.07)', glowColor: 'rgba(203,213,225,0.2)', badgeBg: 'rgba(203,213,225,0.15)', packages: [{ capital: 2000, maxProfit: 128000 }, { capital: 3000, maxProfit: 208000 }, { capital: 5000, maxProfit: 320000 }] },
  { id: 'gold', labelAr: 'Gold', tierNameAr: 'GOLD TIER', fromAr: 'From $5K · 4 options', followers: 47312, maxProfit: '$688K', color: '#f59e0b', borderColor: 'rgba(245,158,11,0.4)', bgColor: 'rgba(245,158,11,0.07)', glowColor: 'rgba(245,158,11,0.25)', badgeBg: 'rgba(245,158,11,0.18)', packages: [{ capital: 5000, maxProfit: 272000 }, { capital: 7000, maxProfit: 368000 }, { capital: 10000, maxProfit: 512000 }, { capital: 15000, maxProfit: 688000 }] },
  { id: 'diamond', labelAr: 'Diamond', tierNameAr: 'DIAMOND TIER', fromAr: 'From $20K · 4 options', followers: 23567, maxProfit: '$7.84M', color: '#38bdf8', borderColor: 'rgba(56,189,248,0.4)', bgColor: 'rgba(56,189,248,0.07)', glowColor: 'rgba(56,189,248,0.25)', badgeBg: 'rgba(56,189,248,0.18)', packages: [{ capital: 20000, maxProfit: 3200000 }, { capital: 25000, maxProfit: 4000000 }, { capital: 30000, maxProfit: 6720000 }, { capital: 60000, maxProfit: 7840000 }] },
];
const SHOWCASE_DURATIONS = [
  { id: '3h', label: '3 Hours', factor: 'x1', multiplier: 1 },
  { id: '6h', label: '6 Hours', factor: 'x1.4', multiplier: 1.4 },
  { id: '12h', label: '12 Hours', factor: 'x2', multiplier: 2 },
  { id: '1d', label: '1 Day', factor: 'x3.2', multiplier: 3.2 },
];
function fmtCapital(n: number): string { if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`; if (n >= 1_000) return `$${(n / 1_000).toFixed(0)},${String(n % 1000).padStart(3, '0')}.00`; return `$${n.toFixed(2)}`; }
function fmtProfit(n: number): string { if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`; if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`; return `$${n}`; }
function TierIcon({ tier, size = 'sm' }: { tier: ShowcaseTier; size?: 'sm' | 'md' }) {
  const cls = size === 'md' ? 'w-5 h-5' : 'w-3.5 h-3.5';
  if (tier === 'diamond') return <svg className={cls} viewBox="0 0 24 24" fill="currentColor"><path d="M6.5 2h11l4.5 6-10 14L1 8z" opacity="0.9" /></svg>;
  if (tier === 'gold') return <svg className={cls} viewBox="0 0 24 24" fill="currentColor"><path d="M2 6l3 7h14l3-7-5 3-5-6-5 6-5-3zm3 9v2h14v-2H5zm2 3v1h10v-1H7z" /></svg>;
  if (tier === 'silver') return <svg className={cls} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" /><path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6z" /></svg>;
  return <svg className={cls} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" /></svg>;
}

function OmanInvestmentPackages({ lang }: { lang: Lang }) {
  const [activeTier, setActiveTier] = useState<ShowcaseTier>('basic');
  const [activeDuration, setActiveDuration] = useState<string>('3h');
  const t = T[lang];
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  const tier = SHOWCASE_TIERS.find((t) => t.id === activeTier)!;
  const duration = SHOWCASE_DURATIONS.find((d) => d.id === activeDuration)!;
  return (
    <section dir={dir} id="investment-packages" className="py-20 relative overflow-hidden" style={{ background: '#07091F' }}>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] pointer-events-none" style={{ background: `radial-gradient(ellipse at center, ${tier.glowColor} 0%, transparent 70%)`, transition: 'background 0.5s ease' }} />
      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)' }}>
            <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#8B5CF6' }}>{t.investBadge}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight">
            {t.investTitle1}{' '}<span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(90deg, #A78BFA, #6366F1)' }}>{t.investTitle2}</span>
          </h2>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl mx-auto" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
            <svg className="w-3.5 h-3.5 flex-shrink-0 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
            <span className="text-xs font-medium text-amber-400">{t.investViewOnly}</span>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2 mb-6 p-1 rounded-2xl" style={{ background: '#0B0E2D', border: '1px solid rgba(139,92,246,0.15)' }}>
          {SHOWCASE_TIERS.map((tierItem) => {
            const isActive = activeTier === tierItem.id;
            return (
              <button key={tierItem.id} onClick={() => setActiveTier(tierItem.id)} className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl transition-all duration-300"
                style={isActive ? { background: tierItem.bgColor, border: `1px solid ${tierItem.borderColor}`, boxShadow: `0 0 20px ${tierItem.glowColor}` } : { background: 'transparent', border: '1px solid transparent' }}>
                <span style={{ color: isActive ? tierItem.color : '#64748b' }}><TierIcon tier={tierItem.id} /></span>
                <span className="text-xs font-bold" style={{ color: isActive ? tierItem.color : '#64748b' }}>{tierItem.labelAr}</span>
              </button>
            );
          })}
        </div>
        <div className="rounded-2xl p-5 mb-6 transition-all duration-500" style={{ background: `linear-gradient(135deg, ${tier.bgColor} 0%, rgba(7,9,31,0.8) 100%)`, border: `1px solid ${tier.borderColor}`, boxShadow: `0 4px 32px ${tier.glowColor}` }}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: tier.badgeBg, border: `1px solid ${tier.borderColor}` }}>
                <span style={{ color: tier.color }}><TierIcon tier={tier.id} size="md" /></span>
              </div>
              <div>
                <h3 className="text-sm font-extrabold uppercase tracking-widest mb-0.5" style={{ color: tier.color }}>{tier.tierNameAr}</h3>
                <p className="text-xs text-slate-400">{tier.fromAr}</p>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ color: `${tier.color}99` }}><path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path strokeLinecap="round" strokeLinejoin="round" d="M23 21v-2a4 4 0 0 0-3-3.87" /><path strokeLinecap="round" strokeLinejoin="round" d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                  <span className="text-sm font-bold tabular-nums" style={{ color: `${tier.color}cc` }}>{tier.followers.toLocaleString('en-US')}</span>
                  <span className="text-xs text-slate-500">followers</span>
                </div>
              </div>
            </div>
            <div className={`flex-shrink-0 ${lang === 'ar' ? 'text-left' : 'text-right'}`}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">MAX PROFIT</p>
              <p className="text-2xl font-black" style={{ color: tier.color }}>{tier.maxProfit}</p>
            </div>
          </div>
        </div>
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px flex-1" style={{ background: `linear-gradient(90deg, transparent, ${tier.color}40)` }} />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">{t.investSelectCapital}</span>
            <div className="h-px flex-1" style={{ background: `linear-gradient(90deg, ${tier.color}40, transparent)` }} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {tier.packages.map((pkg) => {
              const adjustedCapital = Math.round(pkg.capital * duration.multiplier);
              const adjustedProfit = Math.round(pkg.maxProfit * duration.multiplier);
              return (
                <div key={pkg.capital} className="p-4 rounded-xl" style={{ background: '#0B0E2D', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <p className="text-lg font-extrabold text-white mb-0.5">{fmtCapital(adjustedCapital)}</p>
                  <p className="text-xs font-medium" style={{ color: tier.color }}>up to {fmtProfit(adjustedProfit)} profit</p>
                </div>
              );
            })}
          </div>
        </div>
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px flex-1" style={{ background: `linear-gradient(90deg, transparent, ${tier.color}40)` }} />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">{t.investSelectDuration}</span>
            <div className="h-px flex-1" style={{ background: `linear-gradient(90deg, ${tier.color}40, transparent)` }} />
          </div>
          <div className="grid grid-cols-4 gap-2">
            {SHOWCASE_DURATIONS.map((dur) => {
              const isActiveDur = activeDuration === dur.id;
              return (
                <button key={dur.id} onClick={() => setActiveDuration(dur.id)} className="flex flex-col items-center py-3 px-2 rounded-xl transition-all duration-200"
                  style={isActiveDur ? { background: tier.bgColor, border: `1px solid ${tier.borderColor}`, boxShadow: `0 0 16px ${tier.glowColor}`, cursor: 'pointer' } : { background: '#0B0E2D', border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer' }}>
                  <span className="text-sm font-bold mb-0.5" style={{ color: isActiveDur ? tier.color : '#64748b' }}>{dur.label}</span>
                  <span className="text-xs font-medium" style={{ color: isActiveDur ? `${tier.color}99` : '#475569' }}>{dur.factor}</span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="rounded-xl p-4 mb-6 flex items-start gap-3" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.18)' }}>
          <svg className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          <p className="text-xs text-amber-300/80 leading-relaxed">{t.investDisclaimer}</p>
        </div>
        <a href={TG_GROUP} target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl font-bold text-base transition-all duration-300 hover:opacity-90 active:scale-[0.99]"
          style={{ background: 'linear-gradient(135deg, #0088cc, #006699)', boxShadow: '0 4px 24px rgba(0,136,204,0.3)', color: '#fff' }}>
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.26 13.947l-2.94-.918c-.64-.203-.658-.64.135-.954l11.566-4.461c.537-.194 1.006.131.873.607z"/></svg>
          {lang === 'ar' ? 'تواصل عبر تيليغرام للتسجيل في' : 'Contact via Telegram to Register for'} {tier.tierNameAr}
        </a>
        <p className="text-center text-[11px] text-slate-600 mt-4">{t.investFootnote}</p>
      </div>
    </section>
  );
}

function OmanFinalCTA({ lang }: { lang: Lang }) {
  const t = T[lang];
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  return (
    <section dir={dir} className="py-24 bg-[#080b1a] relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,rgba(99,102,241,0.10),transparent)]" />
      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
        <div className="space-y-4">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight">
            {t.finalTitle1}{' '}<span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">Tradiglo</span>
          </h2>
          <p className="text-gray-400 leading-relaxed max-w-xl mx-auto">{t.finalDesc}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a href={TG_GROUP} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold hover:opacity-90 transition-all active:scale-95"
            style={{ background: 'rgba(0,136,204,0.12)', border: '1px solid rgba(0,136,204,0.35)', color: '#29B6F6' }}>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.26 13.947l-2.94-.918c-.64-.203-.658-.64.135-.954l11.566-4.461c.537-.194 1.006.131.873.607z"/></svg>
            {lang === 'ar' ? 'انضم لمجموعة تيليغرام' : 'Join Telegram Group'}
          </a>
        </div>
      </div>
    </section>
  );
}

function OmanFooter({ lang }: { lang: Lang }) {
  const t = T[lang];
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  const scrollTo = (id: string) => { const el = document.querySelector(id); if (el) el.scrollIntoView({ behavior: 'smooth' }); };
  return (
    <footer dir={dir} className="pb-24 md:pb-0" style={{ background: '#040610', borderTop: '1px solid rgba(139,92,246,0.12)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-10">
        <div className="grid md:grid-cols-4 gap-10 mb-12">
          <div className="md:col-span-2 space-y-5">
            <a href="/tradiglo.oman" className="flex items-center gap-3 group w-fit">
              <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg, #a78bfa, #8B5CF6, #6366F1)', WebkitMaskImage: 'url(/assets/images/chart-646_1024-1773102864640.png)', WebkitMaskSize: 'contain', WebkitMaskRepeat: 'no-repeat', WebkitMaskPosition: 'center', maskImage: 'url(/assets/images/chart-646_1024-1773102864640.png)', maskSize: 'contain', maskRepeat: 'no-repeat', maskPosition: 'center', filter: 'drop-shadow(0 0 8px rgba(139,92,246,0.5))' }} />
              <div className="flex flex-col leading-none">
                <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 800, letterSpacing: '0.08em' }} className="text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-purple-300 to-indigo-300 text-sm tracking-widest uppercase">TRADIGLO</span>
                <span className="text-[9px] tracking-[0.25em] uppercase font-semibold" style={{ color: 'rgba(139,92,246,0.5)' }}>{t.subtitle}</span>
              </div>
            </a>
            <p className="text-xs text-[#A6A8C3]/60 leading-relaxed max-w-sm">{t.footerDesc}</p>
            <div className="flex flex-col gap-2.5 pt-1">
              <a href={TG_GROUP} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs transition-colors font-medium" style={{ color: '#29B6F6' }}>
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.26 13.947l-2.94-.918c-.64-.203-.658-.64.135-.954l11.566-4.461c.537-.194 1.006.131.873.607z"/></svg>
                <span>{lang === 'ar' ? 'مجموعة تيليغرام عُمان' : 'Oman Telegram Group'}</span>
              </a>
            </div>
          </div>
          <div className="space-y-4">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#A6A8C3]/50">{t.footerNavTitle}</h4>
            <ul className="space-y-2.5">
              {[{ label: t.navCopyTrading, id: '#copy-trading' }, { label: t.navInvestment, id: '#investment-packages' }].map((item) => (
                <li key={item.id}><button onClick={() => scrollTo(item.id)} className="text-xs text-[#A6A8C3]/50 hover:text-[#A6A8C3] transition-colors">{item.label}</button></li>
              ))}
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#A6A8C3]/50">{t.footerInfoTitle}</h4>
            <ul className="space-y-2.5">
              <li><a href="/community" className="text-xs text-[#A6A8C3]/50 hover:text-[#A6A8C3] transition-colors">{t.footerCommunity}</a></li>
              <li><a href="/about/privacy-policy" className="text-xs text-[#A6A8C3]/50 hover:text-[#A6A8C3] transition-colors">{t.footerPrivacy}</a></li>
              <li><a href="/about/terms-of-service" className="text-xs text-[#A6A8C3]/50 hover:text-[#A6A8C3] transition-colors">{t.footerTerms}</a></li>
              <li><a href="/about/disclaimer" className="text-xs text-[#A6A8C3]/50 hover:text-[#A6A8C3] transition-colors">{t.footerDisclaimer}</a></li>
            </ul>
          </div>
        </div>
        <div style={{ borderTop: '1px solid rgba(139,92,246,0.1)' }} className="pt-8 space-y-5">
          <div className="p-4 rounded-xl" style={{ background: 'rgba(139,92,246,0.04)', border: '1px solid rgba(139,92,246,0.12)' }}>
            <p className="text-[11px] text-[#A6A8C3]/50 leading-relaxed">
              <span className="font-semibold text-[#A6A8C3]/70">{t.footerDisclaimerLabel}</span>{' '}{t.footerDisclaimerText}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <p className="text-[11px] text-[#A6A8C3]/40">{t.footerCopyright}</p>
            <div className="flex items-center gap-2">
              <MapPin className="w-3 h-3 text-[#A6A8C3]/40" />
              <span className="text-[11px] text-[#A6A8C3]/40">{t.footerLocation}</span>
              <span className="text-[#A6A8C3]/30">·</span>
              <a href="/community" className="text-[11px] text-[#A6A8C3]/40 hover:text-[#A6A8C3] transition-colors">{t.footerGlobalCommunity}</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

function OmanMobileStickyBar({ lang }: { lang: Lang }) {
  const t = T[lang];
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  return (
    <div dir={dir} className="md:hidden fixed bottom-0 left-0 right-0 z-50 px-4 py-3" style={{ background: 'rgba(7,9,31,0.95)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(139,92,246,0.2)' }}>
      <div className="flex gap-3">
        <a href={TG_GROUP} target="_blank" rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-white font-semibold text-sm active:scale-95 transition-all"
          style={{ background: 'linear-gradient(135deg, #0088cc, #006699)', boxShadow: '0 4px 16px rgba(0,136,204,0.25)' }}>
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.26 13.947l-2.94-.918c-.64-.203-.658-.64.135-.954l11.566-4.461c.537-.194 1.006.131.873.607z"/></svg>
          {lang === 'ar' ? 'انضم لتيليغرام' : 'Join Telegram'}
        </a>
      </div>
    </div>
  );
}

export default function TradigloOmanLandingPage() {
  const [lang, setLang] = useState<Lang>('ar');
  return (
    <div className="min-h-screen bg-[#07091F] text-white" style={{ fontFamily: "'Inter', sans-serif" }}>
      <OmanHeader lang={lang} setLang={setLang} />
      <main>
        <OmanHero lang={lang} />
        <OmanTrustBar lang={lang} />
        <OmanCopyTradingShowcase lang={lang} />
        <OmanInvestmentPackages lang={lang} />
        <OmanFinalCTA lang={lang} />
      </main>
      <OmanFooter lang={lang} />
      <OmanMobileStickyBar lang={lang} />
    </div>
  );
}
