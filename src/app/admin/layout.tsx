'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  HomeIcon, UsersIcon, WalletIcon, ArrowDownTrayIcon, ArrowUpTrayIcon,
  ChartBarIcon, UserGroupIcon, CpuChipIcon, CubeIcon, DocumentChartBarIcon,
  ShieldExclamationIcon, CommandLineIcon, ServerIcon, Cog6ToothIcon, BellIcon,
  ArrowRightOnRectangleIcon, Bars3Icon, XMarkIcon, ChevronDownIcon,
  GiftIcon, LifebuoyIcon, BanknotesIcon, ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { NotificationProvider } from '@/contexts/NotificationContext';
import NotificationBell from '@/components/admin/NotificationBell';

interface SubMenuItem {
  href: string;
  label: string;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  subItems?: SubMenuItem[];
}

// Grouped navigation for better UX
const navGroups: { label: string; items: NavItem[] }[] = [
  {
    label: 'Overview',
    items: [
      { href: '/admin', label: 'Dashboard', icon: HomeIcon },
    ],
  },
  {
    label: 'Members',
    items: [
      {
        href: '/admin/users',
        label: 'User Management',
        icon: UsersIcon,
        subItems: [
          { href: '/admin/users', label: 'All Users' },
          { href: '/admin/users/activity', label: 'User Activity' },
          { href: '/admin/users/status', label: 'Account Status' },
        ],
      },
      {
        href: '/admin/wallets',
        label: 'Wallet Management',
        icon: WalletIcon,
        subItems: [
          { href: '/admin/wallets', label: 'Wallet Overview' },
          { href: '/admin/wallets/balances', label: 'Wallet Balances' },
          { href: '/admin/wallets/edit', label: 'Edit Balance' },
        ],
      },
      { href: '/admin/referrals', label: 'Affiliates', icon: GiftIcon },
    ],
  },
  {
    label: 'Finance',
    items: [
      {
        href: '/admin/deposits',
        label: 'Deposits',
        icon: ArrowDownTrayIcon,
        subItems: [
          { href: '/admin/deposits?status=pending', label: 'Pending' },
          { href: '/admin/deposits?status=approved', label: 'Approved' },
          { href: '/admin/deposits?status=rejected', label: 'Rejected' },
          { href: '/admin/deposits', label: 'All History' },
          { href: '/admin/payment-methods', label: 'Payment Methods' },
          { href: '/admin/countries', label: 'Countries & Methods' },
          { href: '/admin/currency-rates', label: 'Currency Rates' },
          { href: '/admin/settings/bonus', label: 'Bonus Settings' },
        ],
      },
      {
        href: '/admin/withdrawals',
        label: 'Withdrawals',
        icon: ArrowUpTrayIcon,
        subItems: [
          { href: '/admin/withdrawals?status=pending', label: 'Pending' },
          { href: '/admin/withdrawals?status=approved', label: 'Approved' },
          { href: '/admin/withdrawals?status=rejected', label: 'Rejected' },
          { href: '/admin/withdrawals', label: 'All History' },
        ],
      },
      {
        href: '/admin/investment',
        label: 'Investment Control',
        icon: BanknotesIcon,
        subItems: [
          { href: '/admin/investment', label: 'Overview & Stats' },
          { href: '/admin/investment/packages', label: 'Package Management' },
          { href: '/admin/investment/members', label: 'Member Investments' },
          { href: '/admin/investment/settlements', label: 'Profit & Settlements' },
        ],
      },
    ],
  },
  {
    label: 'Trading',
    items: [
      {
        href: '/admin/trades',
        label: 'Trading',
        icon: ChartBarIcon,
        subItems: [
          { href: '/admin/trades', label: 'Open Trades' },
          { href: '/admin/trades/history', label: 'Trade History' },
          { href: '/admin/trades/analytics', label: 'Trade Analytics' },
        ],
      },
      { href: '/admin/copy-trading', label: 'Copy Trading', icon: UserGroupIcon },
      {
        href: '/admin/assets',
        label: 'Assets & Markets',
        icon: CubeIcon,
        subItems: [
          { href: '/admin/assets', label: 'Asset List' },
          { href: '/admin/assets/prices', label: 'Market Prices' },
          { href: '/admin/assets/performance', label: 'Asset Performance' },
        ],
      },
    ],
  },
  {
    label: 'Analytics',
    items: [
      {
        href: '/admin/reports',
        label: 'Reports & Analytics',
        icon: DocumentChartBarIcon,
        subItems: [
          { href: '/admin/reports', label: 'Trading Reports' },
          { href: '/admin/reports/deposits', label: 'Deposit Reports' },
          { href: '/admin/reports/profit', label: 'Platform Profit' },
        ],
      },
      {
        href: '/admin/ai-intelligence',
        label: 'AI Intelligence',
        icon: CpuChipIcon,
        subItems: [
          { href: '/admin/ai-intelligence', label: 'Market Analysis' },
          { href: '/admin/ai-intelligence/signals', label: 'AI Signals' },
          { href: '/admin/ai-intelligence/risk', label: 'Risk Prediction' },
        ],
      },
    ],
  },
  {
    label: 'Operations',
    items: [
      {
        href: '/admin/support',
        label: 'Support Center',
        icon: LifebuoyIcon,
        subItems: [
          { href: '/admin/support', label: 'Tickets' },
          { href: '/admin/support/live-chat', label: 'Live Chat' },
          { href: '/admin/support/faq', label: 'FAQ Manager' },
          { href: '/admin/support/chatbot', label: 'AI Chatbot' },
        ],
      },
      {
        href: '/admin/risk',
        label: 'Risk Management',
        icon: ShieldExclamationIcon,
        subItems: [
          { href: '/admin/risk', label: 'Risk Monitor' },
          { href: '/admin/risk/scores', label: 'Trader Risk Scores' },
          { href: '/admin/risk/exposure', label: 'Trade Exposure' },
        ],
      },
      {
        href: '/admin/control',
        label: 'Control Center',
        icon: CommandLineIcon,
        subItems: [
          { href: '/admin/control', label: 'User Activity' },
          { href: '/admin/control/trade-control', label: 'Trade Control' },
          { href: '/admin/control/wallet-control', label: 'Wallet Control' },
          { href: '/admin/control/alerts', label: 'System Alerts' },
        ],
      },
    ],
  },
  {
    label: 'System',
    items: [
      { href: '/admin/notifications', label: 'Notifications', icon: BellIcon },
      {
        href: '/admin/system',
        label: 'System Monitoring',
        icon: ServerIcon,
        subItems: [
          { href: '/admin/system', label: 'Server Status' },
          { href: '/admin/system/database', label: 'Database Status' },
          { href: '/admin/system/api', label: 'API Performance' },
        ],
      },
      {
        href: '/admin/settings',
        label: 'Platform Settings',
        icon: Cog6ToothIcon,
        subItems: [
          { href: '/admin/settings', label: 'Trading Settings' },
          { href: '/admin/settings/bonus', label: 'Bonus Settings' },
          { href: '/admin/settings/security', label: 'Security Settings' },
        ],
      },
    ],
  },
];

// Flat list for active-state detection
const navItems: NavItem[] = navGroups.flatMap((g) => g.items);

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminEmail, setAdminEmail] = useState('Admin');
  const [checking, setChecking] = useState(true);
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());

  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    const active = new Set<string>();
    navItems.forEach((item) => {
      if (item.subItems) {
        const isChildActive = item.subItems.some((sub) => pathname === sub.href || pathname.startsWith(sub.href.split('?')[0]));
        const isParentActive = pathname === item.href || pathname.startsWith(item.href + '/');
        if (isChildActive || isParentActive) {
          active.add(item.href);
        }
      }
    });
    setExpandedMenus(active);
  }, [pathname]);

  useEffect(() => {
    if (isLoginPage) { setChecking(false); return; }
    const checkAdmin = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { router.replace('/admin/login'); return; }
      const { data: adminRecord } = await supabase.from('admin_users').select('id').eq('email', session.user.email).maybeSingle();
      if (!adminRecord) { await supabase.auth.signOut(); router.replace('/admin/login'); return; }
      setAdminEmail(session.user.email || 'Admin');
      setChecking(false);
    };
    checkAdmin();
  }, [router, isLoginPage]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace('/admin/login');
  };

  const toggleMenu = (href: string) => {
    setExpandedMenus((prev) => {
      const next = new Set(prev);
      if (next.has(href)) { next.delete(href); } else { next.add(href); }
      return next;
    });
  };

  const isItemActive = (item: NavItem) => {
    if (item.href === '/admin') return pathname === '/admin';
    return pathname === item.href || pathname.startsWith(item.href + '/');
  };

  const isSubItemActive = (sub: SubMenuItem) => {
    const subPath = sub.href.split('?')[0];
    const subQuery = sub.href.includes('?') ? sub.href.split('?')[1] : null;
    if (subQuery) {
      const currentSearch = typeof window !== 'undefined' ? window.location.search.replace('?', '') : '';
      return pathname === subPath && currentSearch === subQuery;
    }
    if (pathname === subPath) {
      if (typeof window !== 'undefined' && window.location.search) return false;
      return true;
    }
    if (subPath !== '/admin/deposits' && subPath !== '/admin/withdrawals') {
      return pathname === subPath || pathname.startsWith(subPath + '/');
    }
    return false;
  };

  // Get current page label for header breadcrumb
  const getCurrentPageLabel = () => {
    for (const item of navItems) {
      if (item.subItems) {
        for (const sub of item.subItems) {
          if (isSubItemActive(sub)) return { parent: item.label, child: sub.label };
        }
        if (isItemActive(item)) return { parent: item.label, child: null };
      } else {
        if (isItemActive(item)) return { parent: item.label, child: null };
      }
    }
    return { parent: 'Admin Panel', child: null };
  };

  const pageLabel = getCurrentPageLabel();

  if (isLoginPage) return <>{children}</>;

  if (checking) {
    return (
      <div className="min-h-screen bg-[#060a14] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <div className="text-slate-400 text-sm">Loading admin panel...</div>
        </div>
      </div>
    );
  }

  return (
    <NotificationProvider>
      <div className="min-h-screen bg-[#060a14] flex">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-20 lg:hidden transition-opacity duration-300"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`fixed top-0 left-0 h-full w-60 bg-[#0a0f1e] border-r border-white/8 z-30 flex flex-col transform transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
            ${sidebarOpen ? 'translate-x-0 shadow-2xl shadow-black/50' : '-translate-x-full'} lg:translate-x-0 lg:static lg:z-auto`}
        >
          {/* Logo */}
          <div className="flex items-center gap-3 px-4 py-4 border-b border-white/8 flex-shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/25 transition-transform duration-200 hover:scale-105">
              <span className="text-white font-black text-xs">TG</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-white font-bold text-sm leading-tight">Tradiglo</div>
              <div className="text-blue-400 text-[10px] font-medium tracking-wide uppercase">Admin Panel</div>
            </div>
            <button className="lg:hidden text-slate-500 hover:text-white transition-colors duration-150" onClick={() => setSidebarOpen(false)}>
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-2 py-3 overflow-y-auto">
            {navGroups.map((group) => (
              <div key={group.label} className="mb-4">
                <div className="px-3 mb-1.5">
                  <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest">{group.label}</span>
                </div>
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const isActive = isItemActive(item);
                    const isExpanded = expandedMenus.has(item.href);
                    const hasSubItems = item.subItems && item.subItems.length > 0;

                    return (
                      <div key={item.href}>
                        {hasSubItems ? (
                          <button
                            onClick={() => toggleMenu(item.href)}
                            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ease-out
                              ${isActive
                                ? 'bg-blue-500/15 text-blue-400 shadow-sm shadow-blue-500/10'
                                : 'text-slate-400 hover:text-white hover:bg-white/5 hover:translate-x-0.5'
                              }`}
                          >
                            <item.icon className={`w-4 h-4 flex-shrink-0 transition-colors duration-200 ${isActive ? 'text-blue-400' : ''}`} />
                            <span className="flex-1 text-left truncate">{item.label}</span>
                            <ChevronDownIcon className={`w-3 h-3 flex-shrink-0 transition-transform duration-250 ease-[cubic-bezier(0.16,1,0.3,1)] ${isExpanded ? 'rotate-0' : '-rotate-90'}`} />
                          </button>
                        ) : (
                          <Link
                            href={item.href}
                            onClick={() => setSidebarOpen(false)}
                            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ease-out
                              ${isActive
                                ? 'bg-blue-500/15 text-blue-400 shadow-sm shadow-blue-500/10'
                                : 'text-slate-400 hover:text-white hover:bg-white/5 hover:translate-x-0.5'
                              }`}
                          >
                            <item.icon className={`w-4 h-4 flex-shrink-0 transition-colors duration-200 ${isActive ? 'text-blue-400' : ''}`} />
                            <span className="truncate">{item.label}</span>
                          </Link>
                        )}

                        {/* Sub-menu */}
                        {hasSubItems && (
                          <div
                            className={`ml-3 border-l-2 border-white/8 pl-3 overflow-hidden transition-all duration-250 ease-[cubic-bezier(0.16,1,0.3,1)]
                              ${isExpanded ? 'max-h-[500px] opacity-100 mt-0.5 mb-1' : 'max-h-0 opacity-0'}`}
                          >
                            <div className="space-y-0.5 py-0.5">
                              {item.subItems!.map((sub) => {
                                const subActive = isSubItemActive(sub);
                                return (
                                  <Link
                                    key={sub.href}
                                    href={sub.href}
                                    onClick={() => setSidebarOpen(false)}
                                    className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-[11px] font-medium transition-all duration-200 ease-out
                                      ${subActive
                                        ? 'text-blue-400 bg-blue-500/10' :'text-slate-500 hover:text-slate-300 hover:bg-white/5 hover:translate-x-0.5'
                                      }`}
                                  >
                                    <span className={`w-1 h-1 rounded-full flex-shrink-0 transition-all duration-200 ${subActive ? 'bg-blue-400 scale-125' : 'bg-slate-700'}`} />
                                    {sub.label}
                                  </Link>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* User + Logout */}
          <div className="px-3 py-3 border-t border-white/8 flex-shrink-0 space-y-1">
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-white/5 transition-colors duration-200">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500/30 to-purple-600/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
                <span className="text-blue-400 text-[10px] font-bold">{adminEmail.charAt(0).toUpperCase()}</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-white text-[11px] font-medium truncate">{adminEmail}</div>
                <div className="text-slate-500 text-[10px]">Administrator</div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-500 hover:text-red-400 hover:bg-red-400/8 transition-all duration-200 ease-out w-full group"
            >
              <ArrowRightOnRectangleIcon className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              Sign Out
            </button>
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1 flex flex-col min-w-0 lg:ml-0">
          {/* Top bar */}
          <header className="bg-[#0a0f1e]/95 border-b border-white/8 px-4 lg:px-6 py-3.5 flex items-center gap-4 sticky top-0 z-10 backdrop-blur-md transition-all duration-200">
            <button className="lg:hidden text-slate-400 hover:text-white transition-colors duration-150" onClick={() => setSidebarOpen(true)}>
              <Bars3Icon className="w-5 h-5" />
            </button>

            {/* Breadcrumb */}
            <div className="flex-1 flex items-center gap-2 min-w-0">
              <span className="text-slate-500 text-sm hidden sm:block">Admin</span>
              {pageLabel.parent && (
                <>
                  <ChevronRightIcon className="w-3.5 h-3.5 text-slate-700 hidden sm:block flex-shrink-0" />
                  <span className={`text-sm font-medium truncate transition-colors duration-200 ${pageLabel.child ? 'text-slate-400' : 'text-white'}`}>
                    {pageLabel.parent}
                  </span>
                </>
              )}
              {pageLabel.child && (
                <>
                  <ChevronRightIcon className="w-3.5 h-3.5 text-slate-700 flex-shrink-0" />
                  <span className="text-white text-sm font-semibold truncate">{pageLabel.child}</span>
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              <NotificationBell />
              <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-white/8">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500/30 to-purple-600/20 border border-blue-500/30 flex items-center justify-center transition-transform duration-200 hover:scale-105">
                  <span className="text-blue-400 text-[10px] font-bold">{adminEmail.charAt(0).toUpperCase()}</span>
                </div>
                <span className="text-slate-300 text-xs max-w-[120px] truncate">{adminEmail}</span>
              </div>
            </div>
          </header>

          {/* Page content */}
          <main key={pathname} className="flex-1 p-4 lg:p-6 overflow-auto admin-page-enter">
            {children}
          </main>
        </div>
      </div>
    </NotificationProvider>
  );
}
