'use client';

import { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Bell, AlertTriangle, TrendingDown, UserCheck, Menu, X, MapPin } from 'lucide-react';


// ─── Translations ─────────────────────────────────────────────────────────────
type Lang = 'es' | 'en' | 'pt';

const es = {
  // Header
  navCopyTrading: 'Copy Trading',
  navInvestment: 'Paquetes de inversión',
  subtitle: 'Ecuador',
  selectLanguage: 'Seleccionar idioma',
  joinWhatsApp: 'Únete por WhatsApp',
  joinTelegram: 'Únete a Telegram',
  shortWhatsApp: 'WhatsApp',
  shortTelegram: 'Telegram',

  // Hero
  badge1: 'Inversión a plazo fijo',
  badge2: 'Retornos garantizados',
  badge3: 'Registro vía admin de Ecuador',
  heroTitle1: 'Paquetes de inversión',
  heroTitle2: 'para',
  heroTitle3: 'traders ecuatorianos',
  heroDesc: 'Inversión a plazo fijo con retornos garantizados: elige tu paquete y contacta al admin de Ecuador para registrarte.',
  heroDisclaimer: 'Sin garantía de ganancias. Operar implica riesgos. Invierte solo lo que puedas permitirte perder.',

  // TrustBar
  trust1: 'Sin garantía de ganancias',
  trust2: 'No es un esquema para hacerse rico rápido',
  trust3: 'Riesgos informados con claridad',
  trust4: 'Inversión a plazo fijo',
  trust5: 'Registro vía admin de Ecuador',

  // Copy Trading
  copyBadge: 'Copy Trading',
  copyTitle1: 'Sigue a',
  copyTitle2: 'Tradiglo oficial',
  copyTitle3: 'y copia sus operaciones automáticamente',
  copyDesc: 'Tasa de acierto del 90%: únete a más de 219,855 seguidores que se benefician del Copy Trade oficial de Tradiglo.',
  copyFollowWhatsApp: 'Sigue a Tradiglo por WhatsApp',
  copyFollowTelegram: 'Sigue a Tradiglo por Telegram',
  copyWhyTitle: '¿Por qué hacer Copy Trading con Tradiglo?',
  copyPoint1Title: '90% de tasa de acierto',
  copyPoint1Desc: 'Rendimiento documentado y consistente en miles de operaciones',
  copyPoint2Title: '+219,855 seguidores',
  copyPoint2Desc: 'La mayor comunidad de Copy Trade de la región',
  copyPoint3Title: 'Saldo real de $4.2M+',
  copyPoint3Desc: 'Total transparencia en rendimiento y saldos',
  copyPoint4Title: '100% automático',
  copyPoint4Desc: 'Las operaciones se copian al instante sin intervención manual',
  copyPoint5Title: 'Garantía de saldo del 100%',
  copyPoint5Desc: 'Tu capital está protegido en caso de pérdida',
  copyDisclaimer: 'El Copy Trading no garantiza ganancias. El rendimiento pasado no garantiza resultados futuros. Invierte solo lo que puedas permitirte perder.',
  copyPlatformFeeTitle: '20% de comisión de plataforma sobre la ganancia',
  copyPlatformFeeDesc: 'Se descuenta automáticamente solo de las ganancias. Ejemplo: $100 de ganancia → recibes $80.',
  official: 'OFICIAL',
  officialCopyTrade: 'Copy Trade oficial de Tradiglo',
  winRate: 'TASA DE ACIERTO',
  balanceGuaranteeLoss: 'Garantía de saldo del 100% en caso de pérdida',
  followersUpper: 'SEGUIDORES',
  minBalance: 'SALDO MÍN.',
  perfScores: 'Puntuaciones de rendimiento',
  realBalance: 'Saldo real',
  overallScore: 'Puntuación general',
  perf: {
    activity: 'Actividad',
    probability: 'Probabilidad',
    reliability: 'Fiabilidad',
    popularity: 'Popularidad',
    experience: 'Experiencia',
  },

  // Investment
  investBadge: 'Paquete de inversión',
  investTitle1: 'Inversión a plazo fijo con',
  investTitle2: 'retornos garantizados',
  investViewOnly: 'Solo vista: para registrarte, contacta al admin de Ecuador por WhatsApp o Telegram',
  investSelectCapital: 'SELECCIONA EL MONTO DE CAPITAL',
  investSelectDuration: 'SELECCIONA LA DURACIÓN',
  investDisclaimer: 'Los paquetes de inversión no se pueden cancelar una vez contratados. El capital queda bloqueado hasta que termine la duración. Se descuenta una comisión de plataforma del 20% de la ganancia bruta.',
  investContactWhatsApp: 'Contacta por WhatsApp para registrarte en',
  investContactTelegram: 'Contacta por Telegram para registrarte en',
  investFootnote: 'Solo vista: el registro y las transacciones se realizan con el admin de Ecuador por WhatsApp o Telegram',
  tierTitle: (n: string) => `NIVEL ${n}`,
  fromOptions: (from: string, n: number) => `Desde ${from} · ${n} opciones`,
  followersLower: 'seguidores',
  maxProfit: 'GANANCIA MÁX.',
  upTo: (n: string) => `hasta ${n} de ganancia`,
  durations: { '3h': '3 horas', '6h': '6 horas', '12h': '12 horas', '1d': '1 día' } as Record<string, string>,

  // Final CTA
  finalTitle1: 'Comienza tu inversión con',
  finalDesc: 'Elige el paquete que más te convenga y contacta al admin de Ecuador para registrarte y comenzar.',

  // Footer
  footerDesc: 'Paquetes de inversión a plazo fijo con retornos garantizados para traders ecuatorianos: registro vía admin de Ecuador.',
  footerWhatsApp: 'WhatsApp de Ecuador',
  footerTelegram: 'Telegram de Ecuador',
  footerNavTitle: 'Navegación',
  footerInfoTitle: 'Información',
  footerCommunity: 'Comunidad',
  footerPrivacy: 'Política de privacidad',
  footerTerms: 'Términos del servicio',
  footerDisclaimer: 'Aviso de riesgo',
  footerDisclaimerLabel: 'Aviso de riesgo:',
  footerDisclaimerText: 'Invertir implica riesgos y puede no ser adecuado para todas las personas. Tradiglo no garantiza ninguna ganancia. Los usuarios son los únicos responsables de sus decisiones de inversión.',
  footerCopyright: '© 2025 Tradiglo. Todos los derechos reservados.',
  footerLocation: 'Ecuador',
  footerGlobalCommunity: 'Comunidad global',
};

type Dict = typeof es;

const en: Dict = {
  // Header
  navCopyTrading: 'Copy Trading',
  navInvestment: 'Investment Packages',
  subtitle: 'Ecuador',
  selectLanguage: 'Select language',
  joinWhatsApp: 'Join on WhatsApp',
  joinTelegram: 'Join Telegram',
  shortWhatsApp: 'WhatsApp',
  shortTelegram: 'Telegram',

  // Hero
  badge1: 'Fixed-Term Investment',
  badge2: 'Guaranteed Returns',
  badge3: 'Register via Ecuador Admin',
  heroTitle1: 'Investment Packages',
  heroTitle2: 'for',
  heroTitle3: 'Ecuadorian Traders',
  heroDesc: 'Fixed-term investment with guaranteed returns — choose your package and contact the Ecuador admin to register.',
  heroDisclaimer: 'No profit guarantee. Trading involves risk. Only invest what you can afford to lose.',

  // TrustBar
  trust1: 'No Profit Guarantee',
  trust2: 'Not a Get-Rich-Quick Scheme',
  trust3: 'Risks Clearly Disclosed',
  trust4: 'Fixed-Term Investment',
  trust5: 'Register via Ecuador Admin',

  // Copy Trading
  copyBadge: 'Copy Trading',
  copyTitle1: 'Follow',
  copyTitle2: 'Official Tradiglo',
  copyTitle3: 'and copy trades automatically',
  copyDesc: '90% win rate — join over 219,855 followers benefiting from Tradiglo\'s official Copy Trade.',
  copyFollowWhatsApp: 'Follow Tradiglo via WhatsApp',
  copyFollowTelegram: 'Follow Tradiglo via Telegram',
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
  official: 'OFFICIAL',
  officialCopyTrade: 'Official Tradiglo Copy Trade',
  winRate: 'WIN RATE',
  balanceGuaranteeLoss: '100% Balance Guarantee on Loss',
  followersUpper: 'FOLLOWERS',
  minBalance: 'MIN BALANCE',
  perfScores: 'Performance Scores',
  realBalance: 'Real Balance',
  overallScore: 'Overall Score',
  perf: {
    activity: 'Activity',
    probability: 'Probability',
    reliability: 'Reliability',
    popularity: 'Popularity',
    experience: 'Experience',
  },

  // Investment
  investBadge: 'Investment Package',
  investTitle1: 'Fixed-term investment with',
  investTitle2: 'guaranteed returns',
  investViewOnly: 'View only — to register, contact the Ecuador admin on WhatsApp or Telegram',
  investSelectCapital: 'SELECT CAPITAL AMOUNT',
  investSelectDuration: 'SELECT DURATION',
  investDisclaimer: 'Investment packages cannot be cancelled once joined. Capital is locked until the duration expires. A 20% platform fee is deducted from gross profit.',
  investContactWhatsApp: 'Contact via WhatsApp to Register for',
  investContactTelegram: 'Contact via Telegram to Register for',
  investFootnote: 'View only — registration and transactions are done with the Ecuador admin on WhatsApp or Telegram',
  tierTitle: (n: string) => `${n} TIER`,
  fromOptions: (from: string, n: number) => `From ${from} · ${n} options`,
  followersLower: 'followers',
  maxProfit: 'MAX PROFIT',
  upTo: (n: string) => `up to ${n} profit`,
  durations: { '3h': '3 Hours', '6h': '6 Hours', '12h': '12 Hours', '1d': '1 Day' } as Record<string, string>,

  // Final CTA
  finalTitle1: 'Start Your Investment with',
  finalDesc: 'Choose your package and contact the Ecuador admin to register and get started.',

  // Footer
  footerDesc: 'Fixed-term investment packages with guaranteed returns for Ecuadorian traders — register via the Ecuador admin.',
  footerWhatsApp: 'Ecuador WhatsApp',
  footerTelegram: 'Ecuador Telegram',
  footerNavTitle: 'Navigation',
  footerInfoTitle: 'Information',
  footerCommunity: 'Community',
  footerPrivacy: 'Privacy Policy',
  footerTerms: 'Terms of Service',
  footerDisclaimer: 'Risk Disclaimer',
  footerDisclaimerLabel: 'Risk Disclaimer:',
  footerDisclaimerText: 'Investing involves risk and may not be suitable for all individuals. Tradiglo does not guarantee any profits. Users are solely responsible for their investment decisions.',
  footerCopyright: '© 2025 Tradiglo. All rights reserved.',
  footerLocation: 'Ecuador',
  footerGlobalCommunity: 'Global Community',
};

const pt: Dict = {
  // Header
  navCopyTrading: 'Copy Trading',
  navInvestment: 'Pacotes de investimento',
  subtitle: 'Ecuador',
  selectLanguage: 'Selecionar idioma',
  joinWhatsApp: 'Entre pelo WhatsApp',
  joinTelegram: 'Entre no Telegram',
  shortWhatsApp: 'WhatsApp',
  shortTelegram: 'Telegram',

  // Hero
  badge1: 'Investimento a prazo fixo',
  badge2: 'Retornos garantidos',
  badge3: 'Cadastro via admin do Ecuador',
  heroTitle1: 'Pacotes de investimento',
  heroTitle2: 'para',
  heroTitle3: 'traders equatorianos',
  heroDesc: 'Investimento a prazo fixo com retornos garantidos: escolha seu pacote e fale com o admin do Ecuador para se cadastrar.',
  heroDisclaimer: 'Sem garantia de lucros. Operar envolve riscos. Invista apenas o que você pode se dar ao luxo de perder.',

  // TrustBar
  trust1: 'Sem garantia de lucros',
  trust2: 'Não é um esquema de enriquecimento rápido',
  trust3: 'Riscos informados com clareza',
  trust4: 'Investimento a prazo fixo',
  trust5: 'Cadastro via admin do Ecuador',

  // Copy Trading
  copyBadge: 'Copy Trading',
  copyTitle1: 'Siga o',
  copyTitle2: 'Tradiglo oficial',
  copyTitle3: 'e copie as operações automaticamente',
  copyDesc: 'Taxa de acerto de 90%: junte-se a mais de 219,855 seguidores que se beneficiam do Copy Trade oficial da Tradiglo.',
  copyFollowWhatsApp: 'Siga a Tradiglo pelo WhatsApp',
  copyFollowTelegram: 'Siga a Tradiglo pelo Telegram',
  copyWhyTitle: 'Por que fazer Copy Trading com a Tradiglo?',
  copyPoint1Title: '90% de taxa de acerto',
  copyPoint1Desc: 'Desempenho documentado e consistente em milhares de operações',
  copyPoint2Title: '+219,855 seguidores',
  copyPoint2Desc: 'A maior comunidade de Copy Trade da região',
  copyPoint3Title: 'Saldo real de $4.2M+',
  copyPoint3Desc: 'Total transparência em desempenho e saldos',
  copyPoint4Title: '100% automático',
  copyPoint4Desc: 'As operações são copiadas instantaneamente, sem intervenção manual',
  copyPoint5Title: 'Garantia de saldo de 100%',
  copyPoint5Desc: 'Seu capital está protegido em caso de perda',
  copyDisclaimer: 'O Copy Trading não garante lucros. Desempenho passado não garante resultados futuros. Invista apenas o que você pode se dar ao luxo de perder.',
  copyPlatformFeeTitle: '20% de taxa da plataforma sobre o lucro',
  copyPlatformFeeDesc: 'Descontada automaticamente apenas dos lucros. Exemplo: $100 de lucro → você recebe $80.',
  official: 'OFICIAL',
  officialCopyTrade: 'Copy Trade oficial da Tradiglo',
  winRate: 'TAXA DE ACERTO',
  balanceGuaranteeLoss: 'Garantia de saldo de 100% em caso de perda',
  followersUpper: 'SEGUIDORES',
  minBalance: 'SALDO MÍN.',
  perfScores: 'Pontuações de desempenho',
  realBalance: 'Saldo real',
  overallScore: 'Pontuação geral',
  perf: {
    activity: 'Atividade',
    probability: 'Probabilidade',
    reliability: 'Confiabilidade',
    popularity: 'Popularidade',
    experience: 'Experiência',
  },

  // Investment
  investBadge: 'Pacote de investimento',
  investTitle1: 'Investimento a prazo fixo com',
  investTitle2: 'retornos garantidos',
  investViewOnly: 'Somente visualização: para se cadastrar, fale com o admin do Ecuador pelo WhatsApp ou Telegram',
  investSelectCapital: 'SELECIONE O VALOR DO CAPITAL',
  investSelectDuration: 'SELECIONE A DURAÇÃO',
  investDisclaimer: 'Os pacotes de investimento não podem ser cancelados após a adesão. O capital fica bloqueado até o fim da duração. Uma taxa da plataforma de 20% é descontada do lucro bruto.',
  investContactWhatsApp: 'Fale pelo WhatsApp para se cadastrar no',
  investContactTelegram: 'Fale pelo Telegram para se cadastrar no',
  investFootnote: 'Somente visualização: cadastro e transações são feitos com o admin do Ecuador pelo WhatsApp ou Telegram',
  tierTitle: (n: string) => `NÍVEL ${n}`,
  fromOptions: (from: string, n: number) => `A partir de ${from} · ${n} opções`,
  followersLower: 'seguidores',
  maxProfit: 'LUCRO MÁX.',
  upTo: (n: string) => `até ${n} de lucro`,
  durations: { '3h': '3 horas', '6h': '6 horas', '12h': '12 horas', '1d': '1 dia' } as Record<string, string>,

  // Final CTA
  finalTitle1: 'Comece seu investimento com a',
  finalDesc: 'Escolha o pacote ideal para você e fale com o admin do Ecuador para se cadastrar e começar.',

  // Footer
  footerDesc: 'Pacotes de investimento a prazo fixo com retornos garantidos para traders equatorianos: cadastro via admin do Ecuador.',
  footerWhatsApp: 'WhatsApp do Ecuador',
  footerTelegram: 'Telegram do Ecuador',
  footerNavTitle: 'Navegação',
  footerInfoTitle: 'Informações',
  footerCommunity: 'Comunidade',
  footerPrivacy: 'Política de privacidade',
  footerTerms: 'Termos de serviço',
  footerDisclaimer: 'Aviso de risco',
  footerDisclaimerLabel: 'Aviso de risco:',
  footerDisclaimerText: 'Investir envolve riscos e pode não ser adequado para todas as pessoas. A Tradiglo não garante nenhum lucro. Os usuários são os únicos responsáveis por suas decisões de investimento.',
  footerCopyright: '© 2025 Tradiglo. Todos os direitos reservados.',
  footerLocation: 'Ecuador',
  footerGlobalCommunity: 'Comunidade global',
};

const T: Record<Lang, Dict> = { es, en, pt };

const LANGUAGES = [
  { code: 'es' as Lang, label: 'Español', flag: '🇪🇨' },
  { code: 'en' as Lang, label: 'English', flag: '🇬🇧' },
  { code: 'pt' as Lang, label: 'Português', flag: '🇧🇷' },
];

// ─── Ecuador-specific constants ─────────────────────────────────────────────────
const WA_LINK = 'https://whatsapp.com/channel/0029VbDqdZf23n3jAdblNF0n';
const TG_LINK = 'https://t.me/tradigloecuador';

const WA_PATH = 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z';
const TG_PATH = 'M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.26 13.947l-2.94-.918c-.64-.203-.658-.64.135-.954l11.566-4.461c.537-.194 1.006.131.873.607z';

function WaIcon({ className }: { className: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d={WA_PATH} />
    </svg>
  );
}

function TgIcon({ className }: { className: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d={TG_PATH} />
    </svg>
  );
}

const WA_GRADIENT = 'linear-gradient(135deg, #25D366, #128C7E)';
const TG_GRADIENT = 'linear-gradient(135deg, #0088cc, #006699)';

// ─── Language Dropdown ────────────────────────────────────────────────────────
function LanguageDropdown({ lang, setLang }: { lang: Lang; setLang: (l: Lang) => void }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const current = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0];

  if (!mounted) {
    return (
      <div className="inline-flex items-center gap-1 rounded-md border border-white/20 bg-white/10 text-slate-300 min-h-[32px] px-2 text-[11px]">
        <span>{LANGUAGES[0].flag}</span>
        <span className="font-medium uppercase">{LANGUAGES[0].code}</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
      </div>
    );
  }

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex items-center gap-1 rounded-md border border-white/20 bg-white/10 hover:bg-white/15 text-slate-300 hover:text-white transition-all min-h-[32px] px-2 text-[11px]"
        aria-label={T[lang].selectLanguage}
        aria-expanded={open}
      >
        <span>{current.flag}</span>
        <span className="font-medium uppercase">{current.code}</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${open ? 'rotate-180' : ''}`}>
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-36 rounded-md border border-white/20 bg-black/95 shadow-xl py-1" style={{ zIndex: 10000 }}>
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => { setLang(l.code); setOpen(false); }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-white/10 transition-colors text-left ${current.code === l.code ? 'text-white bg-white/10' : 'text-slate-300'}`}
            >
              <span>{l.flag}</span>
              <span>{l.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────
function EcuadorHeader({ lang, setLang }: { lang: Lang; setLang: (l: Lang) => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const t = T[lang];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = [
    { label: t.navCopyTrading, href: '#copy-trading' },
    { label: t.navInvestment, href: '#investment-packages' },
  ];

  const handleNav = (href: string) => {
    setMobileOpen(false);
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-[#07091F]/90 backdrop-blur-2xl border-b border-[rgba(139,92,246,0.18)] shadow-2xl shadow-black/50'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          <a href="/" className="flex items-center gap-3 group">
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
              <span className="text-[9px] text-violet-400/60 tracking-[0.25em] uppercase font-semibold">{t.subtitle}</span>
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
            <LanguageDropdown lang={lang} setLang={setLang} />
            <a href={WA_LINK} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-all shadow-lg active:scale-95"
              style={{ background: WA_GRADIENT, boxShadow: '0 2px 12px rgba(37,211,102,0.25)' }}>
              <WaIcon className="w-4 h-4" />
              {t.shortWhatsApp}
            </a>
            <a href={TG_LINK} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-all shadow-lg active:scale-95"
              style={{ background: TG_GRADIENT, boxShadow: '0 2px 12px rgba(0,136,204,0.25)' }}>
              <TgIcon className="w-4 h-4" />
              {t.shortTelegram}
            </a>
          </div>

          <div className="md:hidden flex items-center gap-2">
            <LanguageDropdown lang={lang} setLang={setLang} />
            <a href={WA_LINK} target="_blank" rel="noopener noreferrer" aria-label={t.shortWhatsApp}
              className="flex items-center justify-center w-9 h-9 rounded-lg text-white"
              style={{ background: WA_GRADIENT }}>
              <WaIcon className="w-4 h-4" />
            </a>
            <a href={TG_LINK} target="_blank" rel="noopener noreferrer" aria-label={t.shortTelegram}
              className="flex items-center justify-center w-9 h-9 rounded-lg text-white"
              style={{ background: TG_GRADIENT }}>
              <TgIcon className="w-4 h-4" />
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
                className="block w-full text-sm text-[#A6A8C3] hover:text-white hover:bg-[rgba(139,92,246,0.08)] px-4 py-3 rounded-lg font-medium transition-all text-left">
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
function EcuadorHero({ lang }: { lang: Lang }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const t = T[lang];

  return (
    <section className="relative min-h-[60vh] flex flex-col justify-center pt-24 pb-16 overflow-hidden">
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
            {[t.badge1, t.badge2, t.badge3].map((badge) => (
              <span key={badge} className="px-3 py-1 rounded-full text-xs font-semibold"
                style={{ border: '1px solid rgba(139,92,246,0.35)', background: 'rgba(139,92,246,0.08)', color: '#A78BFA' }}>
                {badge}
              </span>
            ))}
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight text-white tracking-tight">
            {t.heroTitle1}{' '}
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(90deg, #A78BFA, #8B5CF6, #6366F1)' }}>
              Tradiglo
            </span>
            <br />
            {t.heroTitle2}{' '}
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(90deg, #8B5CF6, #6366F1)' }}>
              {t.heroTitle3}
            </span>
          </h1>

          <p className="text-base text-[#A6A8C3] leading-relaxed max-w-xl mx-auto">
            {t.heroDesc}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href={WA_LINK} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm hover:opacity-90 transition-all active:scale-95"
              style={{ background: 'rgba(37,211,102,0.12)', border: '1px solid rgba(37,211,102,0.35)', color: '#25D366' }}>
              <WaIcon className="w-5 h-5" />
              {t.joinWhatsApp}
            </a>
            <a href={TG_LINK} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm hover:opacity-90 transition-all active:scale-95"
              style={{ background: 'rgba(0,136,204,0.12)', border: '1px solid rgba(0,136,204,0.35)', color: '#29B6F6' }}>
              <TgIcon className="w-5 h-5" />
              {t.joinTelegram}
            </a>
          </div>

          <p className="text-xs text-[#A6A8C3]/50 leading-relaxed">
            {t.heroDisclaimer}
          </p>
        </div>
      </div>
    </section>
  );
}

// ─── TrustBar ─────────────────────────────────────────────────────────────────
function EcuadorTrustBar({ lang }: { lang: Lang }) {
  const t = T[lang];
  const items = [
    { icon: ShieldCheck, text: t.trust1 },
    { icon: TrendingDown, text: t.trust2 },
    { icon: AlertTriangle, text: t.trust3 },
    { icon: Bell, text: t.trust4 },
    { icon: UserCheck, text: t.trust5 },
  ];
  return (
    <section className="py-10"
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
const COPY_PERFORMANCE_SCORES: { id: keyof Dict['perf']; value: number; gradient: string }[] = [
  { id: 'activity', value: 10, gradient: 'linear-gradient(90deg, #818cf8, #34d399)' },
  { id: 'probability', value: 10, gradient: 'linear-gradient(90deg, #a78bfa, #38bdf8)' },
  { id: 'reliability', value: 10, gradient: 'linear-gradient(90deg, #6366f1, #38bdf8)' },
  { id: 'popularity', value: 10, gradient: 'linear-gradient(90deg, #a78bfa, #f472b6)' },
  { id: 'experience', value: 10, gradient: 'linear-gradient(90deg, #38bdf8, #a78bfa)' },
];

function EcuadorCopyTradingShowcase({ lang }: { lang: Lang }) {
  const t = T[lang];

  return (
    <section id="copy-trading" className="py-20 relative overflow-hidden"
      style={{ background: '#0B0E2D' }}>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, rgba(99,102,241,0.18) 0%, transparent 70%)' }} />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full"
            style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)' }}>
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#6366F1' }}>{t.copyBadge}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight">
            {t.copyTitle1}{' '}
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(90deg, #A78BFA, #6366F1)' }}>
              {t.copyTitle2}
            </span>
            {' '}{t.copyTitle3}
          </h2>
          <p className="text-sm text-[#A6A8C3] leading-relaxed">
            {t.copyDesc}
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          <div className="relative">
            <div className="absolute -inset-4 rounded-3xl pointer-events-none"
              style={{ background: 'radial-gradient(ellipse at center, rgba(139,92,246,0.2) 0%, transparent 70%)', filter: 'blur(20px)' }} />

            <div className="relative rounded-2xl overflow-hidden"
              style={{
                background: 'rgba(13,16,48,0.97)',
                border: '1px solid rgba(139,92,246,0.3)',
                boxShadow: '0 8px 48px rgba(139,92,246,0.2), 0 2px 8px rgba(0,0,0,0.5)',
              }}>
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
                        {t.official}
                      </span>
                    </div>
                    <p className="text-xs text-[#A6A8C3]">{t.officialCopyTrade}</p>
                  </div>
                </div>
                <div className={'text-left'}>
                  <p className="text-3xl font-extrabold" style={{ color: '#34d399' }}>90%</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#A6A8C3]">{t.winRate}</p>
                </div>
              </div>

              <div className="mx-4 mb-4">
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl"
                  style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.25)' }}>
                  <svg className="w-4 h-4 flex-shrink-0" style={{ color: '#34d399' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span className="text-sm font-semibold" style={{ color: '#34d399' }}>{t.balanceGuaranteeLoss}</span>
                </div>
              </div>

              <div className="mx-4 mb-4 grid grid-cols-3 rounded-xl overflow-hidden"
                style={{ background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.15)' }}>
                {[
                  { value: '219,855', label: t.followersUpper, color: '#fff' },
                  { value: '$1,000', label: t.minBalance, color: '#fff' },
                  { value: '90%', label: t.winRate, color: '#34d399' },
                ].map(({ value, label, color }, idx) => (
                  <div key={label} className="py-3 text-center"
                    style={{ borderRight: idx < 2 ? '1px solid rgba(139,92,246,0.15)' : 'none' }}>
                    <p className="text-base font-bold" style={{ color }}>{value}</p>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-[#A6A8C3] mt-0.5">{label}</p>
                  </div>
                ))}
              </div>

              <div className="px-5 pb-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#A6A8C3] mb-3">{t.perfScores}</p>
                <div className="space-y-2.5">
                  {COPY_PERFORMANCE_SCORES.map(({ id, value, gradient }) => (
                    <div key={id} className="flex items-center gap-3">
                      <span className="text-xs text-white w-20 flex-shrink-0">{t.perf[id]}</span>
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

              <div className="mx-4 mb-3">
                <div className="flex items-center justify-between px-4 py-3 rounded-xl"
                  style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)' }}>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-[#A6A8C3]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <rect x="2" y="5" width="20" height="14" rx="2" />
                      <path strokeLinecap="round" d="M2 10h20" />
                    </svg>
                    <span className="text-sm text-[#A6A8C3]">{t.realBalance}</span>
                  </div>
                  <span className="text-base font-bold" style={{ color: '#34d399' }}>$4,209,097.50</span>
                </div>
              </div>

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
                    <p className="text-sm font-bold text-white">{t.copyPlatformFeeTitle}</p>
                    <p className="text-xs text-[#A6A8C3] leading-relaxed mt-0.5">{t.copyPlatformFeeDesc}</p>
                  </div>
                </div>
              </div>

              <div className="px-4 pb-5 space-y-3">
                <a href={WA_LINK} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-4 rounded-xl text-white font-bold text-base hover:opacity-90 transition-all active:scale-95"
                  style={{ background: WA_GRADIENT, boxShadow: '0 4px 24px rgba(37,211,102,0.3)' }}>
                  <WaIcon className="w-5 h-5" />
                  {t.copyFollowWhatsApp}
                </a>
                <a href={TG_LINK} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-4 rounded-xl text-white font-bold text-base hover:opacity-90 transition-all active:scale-95"
                  style={{ background: TG_GRADIENT, boxShadow: '0 4px 24px rgba(0,136,204,0.35)' }}>
                  <TgIcon className="w-5 h-5" />
                  {t.copyFollowTelegram}
                </a>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-2xl p-6 space-y-4"
              style={{ background: '#11143A', border: '1px solid rgba(139,92,246,0.2)' }}>
              <h3 className="text-base font-bold text-white">{t.copyWhyTitle}</h3>
              <div className="space-y-3">
                {[
                  { icon: '◉', title: t.copyPoint1Title, desc: t.copyPoint1Desc },
                  { icon: '◉', title: t.copyPoint2Title, desc: t.copyPoint2Desc },
                  { icon: '◉', title: t.copyPoint3Title, desc: t.copyPoint3Desc },
                  { icon: '◉', title: t.copyPoint4Title, desc: t.copyPoint4Desc },
                  { icon: '◉', title: t.copyPoint5Title, desc: t.copyPoint5Desc },
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

            <div className="rounded-2xl p-5"
              style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)' }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[#A6A8C3]">{t.overallScore}</span>
                <span className="text-2xl font-extrabold" style={{ color: '#34d399' }}>10/10</span>
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {COPY_PERFORMANCE_SCORES.map(({ id, gradient }) => (
                  <div key={id} className="flex flex-col items-center gap-1">
                    <div className="w-full h-1.5 rounded-full" style={{ background: gradient }} />
                    <span className="text-[9px] text-[#A6A8C3] text-center leading-tight">{t.perf[id]}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl p-4 flex items-start gap-3"
              style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.18)' }}>
              <svg className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-xs text-amber-300/80 leading-relaxed">
                {t.copyDisclaimer}
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
  label: string;
  from: string;
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
    label: 'Basic',
    from: '$100',
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
    label: 'Silver',
    from: '$2K',
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
    label: 'Gold',
    from: '$5K',
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
    label: 'Diamond',
    from: '$20K',
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
  { id: '3h', factor: 'x1', multiplier: 1 },
  { id: '6h', factor: 'x1.4', multiplier: 1.4 },
  { id: '12h', factor: 'x2', multiplier: 2 },
  { id: '1d', factor: 'x3.2', multiplier: 3.2 },
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

function EcuadorInvestmentPackages({ lang }: { lang: Lang }) {
  const [activeTier, setActiveTier] = useState<ShowcaseTier>('basic');
  const [activeDuration, setActiveDuration] = useState<string>('3h');
  const t = T[lang];
  const tier = SHOWCASE_TIERS.find((t) => t.id === activeTier)!;
  const duration = SHOWCASE_DURATIONS.find((d) => d.id === activeDuration)!;

  return (
    <section id="investment-packages" className="py-20 relative overflow-hidden"
      style={{ background: '#07091F' }}>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] pointer-events-none"
        style={{ background: `radial-gradient(ellipse at center, ${tier.glowColor} 0%, transparent 70%)`, transition: 'background 0.5s ease' }} />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full"
            style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)' }}>
            <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#8B5CF6' }}>{t.investBadge}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight">
            {t.investTitle1}{' '}
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(90deg, #A78BFA, #6366F1)' }}>
              {t.investTitle2}
            </span>
          </h2>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl mx-auto"
            style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
            <svg className="w-3.5 h-3.5 flex-shrink-0 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span className="text-xs font-medium text-amber-400">{t.investViewOnly}</span>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 mb-6 p-1 rounded-2xl"
          style={{ background: '#0B0E2D', border: '1px solid rgba(139,92,246,0.15)' }}>
          {SHOWCASE_TIERS.map((tierItem) => {
            const isActive = activeTier === tierItem.id;
            return (
              <button
                key={tierItem.id}
                onClick={() => setActiveTier(tierItem.id)}
                className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl transition-all duration-300"
                style={isActive ? {
                  background: tierItem.bgColor,
                  border: `1px solid ${tierItem.borderColor}`,
                  boxShadow: `0 0 20px ${tierItem.glowColor}`,
                } : {
                  background: 'transparent',
                  border: '1px solid transparent',
                }}>
                <span style={{ color: isActive ? tierItem.color : '#64748b' }}>
                  <TierIcon tier={tierItem.id} />
                </span>
                <span className="text-xs font-bold" style={{ color: isActive ? tierItem.color : '#64748b' }}>
                  {tierItem.label}
                </span>
              </button>
            );
          })}
        </div>

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
                  {t.tierTitle(tier.label.toUpperCase())}
                </h3>
                <p className="text-xs text-slate-400">{t.fromOptions(tier.from, tier.packages.length)}</p>
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
                  <span className="text-xs text-slate-500">{t.followersLower}</span>
                </div>
              </div>
            </div>
            <div className="flex-shrink-0 text-right">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">{t.maxProfit}</p>
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
                    {t.upTo(fmtProfit(adjustedProfit))}
                  </p>
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
                    {t.durations[dur.id]}
                  </span>
                  <span className="text-xs font-medium" style={{ color: isActiveDur ? `${tier.color}99` : '#475569' }}>
                    {dur.factor}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl p-4 mb-6 flex items-start gap-3"
          style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.18)' }}>
          <svg className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-xs text-amber-300/80 leading-relaxed">
            {t.investDisclaimer}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <a
            href={WA_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 w-full py-4 px-4 rounded-2xl font-bold text-sm text-center transition-all duration-300 hover:opacity-90 active:scale-[0.99]"
            style={{ background: WA_GRADIENT, boxShadow: '0 4px 24px rgba(37,211,102,0.3)', color: '#fff' }}>
            <WaIcon className="w-5 h-5 flex-shrink-0" />
            <span>{t.investContactWhatsApp} {t.tierTitle(tier.label.toUpperCase())}</span>
          </a>
          <a
            href={TG_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 w-full py-4 px-4 rounded-2xl font-bold text-sm text-center transition-all duration-300 hover:opacity-90 active:scale-[0.99]"
            style={{ background: TG_GRADIENT, boxShadow: '0 4px 24px rgba(0,136,204,0.3)', color: '#fff' }}>
            <TgIcon className="w-5 h-5 flex-shrink-0" />
            <span>{t.investContactTelegram} {t.tierTitle(tier.label.toUpperCase())}</span>
          </a>
        </div>

        <p className="text-center text-[11px] text-slate-600 mt-4">
          {t.investFootnote}
        </p>
      </div>
    </section>
  );
}

// ─── Final CTA ────────────────────────────────────────────────────────────────
function EcuadorFinalCTA({ lang }: { lang: Lang }) {
  const t = T[lang];
  return (
    <section className="py-24 bg-[#080b1a] relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,rgba(99,102,241,0.10),transparent)]" />
      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
        <div className="space-y-4">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight">
            {t.finalTitle1}{' '}
            <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">Tradiglo</span>
          </h2>
          <p className="text-gray-400 leading-relaxed max-w-xl mx-auto">
            {t.finalDesc}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a href={WA_LINK} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold hover:opacity-90 transition-all active:scale-95"
            style={{ background: 'rgba(37,211,102,0.12)', border: '1px solid rgba(37,211,102,0.35)', color: '#25D366' }}>
            <WaIcon className="w-5 h-5" />
            {t.joinWhatsApp}
          </a>
          <a href={TG_LINK} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold hover:opacity-90 transition-all active:scale-95"
            style={{ background: 'rgba(0,136,204,0.12)', border: '1px solid rgba(0,136,204,0.35)', color: '#29B6F6' }}>
            <TgIcon className="w-5 h-5" />
            {t.joinTelegram}
          </a>
        </div>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function EcuadorFooter({ lang }: { lang: Lang }) {
  const t = T[lang];
  const scrollTo = (id: string) => {
    const el = document.querySelector(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };
  return (
    <footer className="pb-24 md:pb-0" style={{ background: '#040610', borderTop: '1px solid rgba(139,92,246,0.12)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-10">
        <div className="grid md:grid-cols-4 gap-10 mb-12">
          <div className="md:col-span-2 space-y-5">
            <a href="/" className="flex items-center gap-3 group w-fit">
              <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg, #a78bfa, #8B5CF6, #6366F1)', WebkitMaskImage: 'url(/assets/images/chart-646_1024-1773102864640.png)', WebkitMaskSize: 'contain', WebkitMaskRepeat: 'no-repeat', WebkitMaskPosition: 'center', maskImage: 'url(/assets/images/chart-646_1024-1773102864640.png)', maskSize: 'contain', maskRepeat: 'no-repeat', maskPosition: 'center', filter: 'drop-shadow(0 0 8px rgba(139,92,246,0.5))' }} />
              <div className="flex flex-col leading-none">
                <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 800, letterSpacing: '0.08em' }}
                  className="text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-purple-300 to-indigo-300 text-sm tracking-widest uppercase">TRADIGLO</span>
                <span className="text-[9px] tracking-[0.25em] uppercase font-semibold" style={{ color: 'rgba(139,92,246,0.5)' }}>{t.subtitle}</span>
              </div>
            </a>
            <p className="text-xs text-[#A6A8C3]/60 leading-relaxed max-w-sm">
              {t.footerDesc}
            </p>
            <div className="flex flex-col gap-2.5 pt-1">
              <a href={WA_LINK} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs transition-colors font-medium"
                style={{ color: '#25D366' }}>
                <WaIcon className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{t.footerWhatsApp}</span>
              </a>
              <a href={TG_LINK} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs transition-colors font-medium"
                style={{ color: '#29B6F6' }}>
                <TgIcon className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{t.footerTelegram}</span>
              </a>
            </div>
          </div>
          <div className="space-y-4">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#A6A8C3]/50">{t.footerNavTitle}</h4>
            <ul className="space-y-2.5">
              {[{ label: t.navCopyTrading, id: '#copy-trading' }, { label: t.navInvestment, id: '#investment-packages' }].map((item) => (
                <li key={item.id}>
                  <button onClick={() => scrollTo(item.id)} className="text-xs text-[#A6A8C3]/50 hover:text-[#A6A8C3] transition-colors">{item.label}</button>
                </li>
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
              <span className="font-semibold text-[#A6A8C3]/70">{t.footerDisclaimerLabel}</span>{' '}
              {t.footerDisclaimerText}
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

// ─── Mobile Sticky Bar ────────────────────────────────────────────────────────
function EcuadorMobileStickyBar({ lang }: { lang: Lang }) {
  const t = T[lang];
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 px-4 py-3"
      style={{ background: 'rgba(7,9,31,0.95)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(139,92,246,0.2)' }}>
      <div className="flex gap-3">
        <a href={WA_LINK} target="_blank" rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-white font-semibold text-sm active:scale-95 transition-all"
          style={{ background: WA_GRADIENT, boxShadow: '0 4px 16px rgba(37,211,102,0.25)' }}>
          <WaIcon className="w-4 h-4" />
          {t.shortWhatsApp}
        </a>
        <a href={TG_LINK} target="_blank" rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-white font-semibold text-sm active:scale-95 transition-all"
          style={{ background: TG_GRADIENT, boxShadow: '0 4px 16px rgba(0,136,204,0.25)' }}>
          <TgIcon className="w-4 h-4" />
          {t.shortTelegram}
        </a>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function TradigloEcuadorLandingPage() {
  const [lang, setLang] = useState<Lang>('es');

  return (
    <div className="min-h-screen bg-[#07091F] text-white" style={{ fontFamily: "'Inter', sans-serif" }}>
      <EcuadorHeader lang={lang} setLang={setLang} />
      <main>
        <EcuadorHero lang={lang} />
        <EcuadorTrustBar lang={lang} />
        <EcuadorCopyTradingShowcase lang={lang} />
        <EcuadorInvestmentPackages lang={lang} />
        <EcuadorFinalCTA lang={lang} />
      </main>
      <EcuadorFooter lang={lang} />
      <EcuadorMobileStickyBar lang={lang} />
    </div>
  );
}
