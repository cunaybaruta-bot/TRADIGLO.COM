'use client';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage, LangCode } from '../contexts/LanguageContext';

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦' },
  { code: 'zh', label: '中文', flag: '🇨🇳' },
  { code: 'ms', label: 'Melayu', flag: '🇲🇾' },
  { code: 'th', label: 'ภาษาไทย', flag: '🇹🇭' },
  { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
];

function LanguageDropdown({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const [dropdownMounted, setDropdownMounted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { lang, setLang } = useLanguage();

  useEffect(() => {
    setDropdownMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const current = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0];

  const handleSelect = (code: string) => {
    setLang(code as LangCode);
    setOpen(false);
  };

  if (!dropdownMounted) {
    return (
      <div className={`inline-flex items-center gap-1 rounded-md border border-white/20 bg-white/10 text-slate-300 ${compact ? 'min-h-[32px] px-2 text-[11px]' : 'min-h-[44px] px-3 text-xs lg:text-sm'}`}>
        <span>🇬🇧</span>
        <span className="font-medium uppercase">en</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
      </div>
    );
  }

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className={`inline-flex items-center gap-1 rounded-md border border-white/20 bg-white/10 hover:bg-white/15 text-slate-300 hover:text-white transition-all ${
          compact ? 'min-h-[32px] px-2 text-[11px]' : 'min-h-[44px] px-3 text-xs lg:text-sm'
        }`}
        aria-label="Select language"
        aria-expanded={open}
      >
        <span>{current.flag}</span>
        <span className="font-medium uppercase">{current.code}</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${open ? 'rotate-180' : ''}`}>
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-40 rounded-md border border-white/20 bg-black/95 shadow-xl z-50 py-1">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleSelect(lang.code)}
              className={`w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-white/10 transition-colors text-left ${
                current.code === lang.code ? 'text-white bg-white/10' : 'text-slate-300'
              }`}
            >
              <span>{lang.flag}</span>
              <span>{lang.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut, loading } = useAuth();
  const { t } = useLanguage();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      router?.push('/');
    } catch (e) {
      // ignore
    }
  };

  const navItems = [
    { labelKey: 'nav_markets', href: '/markets' },
    { labelKey: 'nav_copy_trading', href: '/copy-trading' },
    { labelKey: 'nav_screener', href: '/screener' },
    { labelKey: 'nav_news', href: '/news' },
    { labelKey: 'nav_affiliate', href: '/referral' },
  ];

  return (
    <header className="border-b border-white/10 bg-black/95 sticky top-0 z-50 backdrop-blur-md">
      <div className="container mx-auto px-3 sm:px-4 md:px-6 flex items-center gap-2 sm:gap-4 xl:gap-6 min-h-[56px]">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-1 cursor-pointer flex-shrink-0 min-h-[44px] py-1">
          <div
            style={{
              width: 28,
              height: 28,
              background: 'linear-gradient(to right, #60a5fa, #6366f1, #a855f7)',
              WebkitMaskImage: 'url(/assets/images/chart-646_1024-1773102864640.png)',
              WebkitMaskSize: 'contain',
              WebkitMaskRepeat: 'no-repeat',
              WebkitMaskPosition: 'center',
              maskImage: 'url(/assets/images/chart-646_1024-1773102864640.png)',
              maskSize: 'contain',
              maskRepeat: 'no-repeat',
              maskPosition: 'center',
            }}
            className="h-7 w-7 flex-shrink-0"
          />
          <span
            style={{ fontFamily: "'Satoshi', 'Inter', sans-serif", fontWeight: 700, letterSpacing: '0.04em' }}
            className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-500 to-purple-500 text-base tracking-wide select-none"
          >
            TRADIGLO
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-1.5 text-sm font-medium text-slate-300 flex-shrink-0">
          {navItems?.map((item) => (
            <Link
              key={item?.labelKey}
              href={item?.href}
              className={`px-3 xl:px-4 min-h-[44px] rounded-md hover:text-white hover:bg-white/10 transition-colors whitespace-nowrap text-xs xl:text-sm inline-flex items-center ${
                mounted && pathname === item?.href ? 'text-white bg-white/10' : ''
              }`}
            >
              {t(item.labelKey)}
            </Link>
          ))}
          {/* Dashboard — only visible to logged-in members */}
          {mounted && !loading && user && (
            <Link
              href="/dashboard"
              className={`px-3 xl:px-4 min-h-[44px] rounded-md hover:text-white hover:bg-white/10 transition-colors whitespace-nowrap text-xs xl:text-sm inline-flex items-center ${
                pathname === '/dashboard' ? 'text-white bg-white/10' : ''
              }`}
            >
              {t('nav_dashboard')}
            </Link>
          )}
        </nav>

        {/* Search */}
        <div className="hidden md:flex items-center flex-1 min-w-0 max-w-[200px] lg:max-w-xs xl:max-w-sm relative">
          <form className="w-full relative">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.3-4.3"></path>
            </svg>
            <input
              className="w-full rounded-md border border-white/20 px-3 py-2.5 text-xs sm:text-sm pl-8 bg-white/10 text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:bg-white/15 transition-colors outline-none min-h-[44px]"
              placeholder="Search stocks, forex, crypto..."
              autoComplete="off"
            />
          </form>
        </div>

        {/* Desktop Auth Buttons */}
        <div className="hidden lg:flex items-center gap-2 lg:gap-2.5 flex-shrink-0 ml-auto">
          {/* Language Dropdown — desktop */}
          <LanguageDropdown />
          {mounted && !loading && user ? (
            <button
              onClick={handleSignOut}
              className="inline-flex items-center justify-center rounded-md text-xs lg:text-sm font-medium min-h-[44px] px-4 lg:px-5 text-slate-300 hover:bg-white/10 hover:text-white transition-all whitespace-nowrap"
            >
              {t('nav_sign_out')}
            </button>
          ) : (
            <>
              <Link
                href="/auth?tab=signin"
                className="inline-flex items-center justify-center rounded-md text-xs lg:text-sm font-medium min-h-[44px] px-4 lg:px-5 text-slate-300 hover:bg-white/10 hover:text-white transition-all whitespace-nowrap"
              >
                {t('nav_sign_in')}
              </Link>
              <Link
                href="/auth"
                className="inline-flex items-center justify-center rounded-md text-xs lg:text-sm font-medium min-h-[44px] px-4 lg:px-5 bg-blue-600 text-white hover:bg-blue-700 transition-all whitespace-nowrap"
              >
                {t('nav_get_started')}
              </Link>
            </>
          )}
        </div>

        {/* Mobile Auth Buttons */}
        <div className="lg:hidden flex items-center gap-2 ml-auto flex-shrink-0">
          {mounted && !loading && user ? (
            <button
              onClick={handleSignOut}
              className="inline-flex items-center justify-center rounded-md text-[11px] font-medium min-h-[32px] px-2.5 bg-slate-700 text-white hover:bg-slate-600 transition-all whitespace-nowrap"
            >
              {t('nav_sign_out')}
            </button>
          ) : (
            <Link
              href="/auth?tab=signin"
              className="inline-flex items-center justify-center rounded-md text-xs font-medium min-h-[44px] px-3 bg-blue-600 text-white hover:bg-blue-700 transition-all whitespace-nowrap"
            >
              {t('nav_sign_in')}
            </Link>
          )}
          {/* Language Dropdown — mobile (before hamburger) */}
          <LanguageDropdown compact />
          <button
            className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] rounded-md text-white hover:bg-white/10 transition-all flex-shrink-0"
            aria-label="Toggle menu"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" x2="20" y1="12" y2="12"></line>
              <line x1="4" x2="20" y1="6" y2="6"></line>
              <line x1="4" x2="20" y1="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>
      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed top-[56px] left-0 right-0 z-40 border-t border-white/10 bg-black px-4 py-3 shadow-lg">
          <nav className="flex flex-col gap-1">
            {[...navItems, ...(mounted && !loading && user ? [{ labelKey: 'nav_dashboard', href: '/dashboard' }] : [])]?.map((item) => (
              <Link
                key={item?.labelKey}
                href={item?.href}
                className="text-left px-3 py-2.5 rounded-md text-sm transition-colors text-slate-300 hover:text-white hover:bg-white/10"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t(item.labelKey)}
              </Link>
            ))}
          </nav>
          <div className="mt-3 pt-3 border-t border-white/10">
            <input
              className="w-full rounded-md border border-white/20 px-3 py-2.5 text-sm pl-8 bg-white/10 text-white placeholder-slate-400 outline-none"
              placeholder="Search stocks, forex, crypto..."
            />
          </div>
        </div>
      )}
    </header>
  );
}
