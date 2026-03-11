'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  HomeIcon,
  UsersIcon,
  WalletIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  ChartBarIcon,
  UserGroupIcon,
  CpuChipIcon,
  CubeIcon,
  DocumentChartBarIcon,
  ShieldExclamationIcon,
  CommandLineIcon,
  ServerIcon,
  Cog6ToothIcon,
  BellIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

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

const navItems: NavItem[] = [
  { href: '/admin', label: 'Dashboard', icon: HomeIcon },
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
  {
    href: '/admin/deposits',
    label: 'Deposits',
    icon: ArrowDownTrayIcon,
    subItems: [
      { href: '/admin/deposits?status=pending', label: 'Pending' },
      { href: '/admin/deposits?status=completed', label: 'Approved' },
      { href: '/admin/deposits?status=failed', label: 'Rejected' },
      { href: '/admin/deposits', label: 'All History' },
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
    href: '/admin/trades',
    label: 'Trading',
    icon: ChartBarIcon,
    subItems: [
      { href: '/admin/trades', label: 'Open Trades' },
      { href: '/admin/trades/history', label: 'Trade History' },
      { href: '/admin/trades/analytics', label: 'Trade Analytics' },
    ],
  },
  {
    href: '/admin/copy-trading',
    label: 'Copy Trading',
    icon: UserGroupIcon,
    subItems: [
      { href: '/admin/copy-trading', label: 'Trader Management' },
      { href: '/admin/copy-trading/performance', label: 'Strategy Performance' },
      { href: '/admin/copy-trading/followers', label: 'Followers' },
      { href: '/admin/copy-trading/settings', label: 'Settings' },
    ],
  },
  {
    href: '/admin/ai-intelligence',
    label: 'AI Trade Intelligence',
    icon: CpuChipIcon,
    subItems: [
      { href: '/admin/ai-intelligence', label: 'Market Analysis' },
      { href: '/admin/ai-intelligence/signals', label: 'AI Signals' },
      { href: '/admin/ai-intelligence/risk', label: 'Risk Prediction' },
    ],
  },
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
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminEmail, setAdminEmail] = useState('Admin');
  const [checking, setChecking] = useState(true);
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());

  const isLoginPage = pathname === '/admin/login';

  // Auto-expand menu that contains the active route
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
    if (isLoginPage) {
      setChecking(false);
      return;
    }
    const checkAdmin = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.replace('/admin/login');
        return;
      }
      const { data: adminRecord } = await supabase
        .from('admin_users')
        .select('id')
        .eq('email', session.user.email)
        .maybeSingle();
      if (!adminRecord) {
        await supabase.auth.signOut();
        router.replace('/admin/login');
        return;
      }
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
      if (next.has(href)) {
        next.delete(href);
      } else {
        next.add(href);
      }
      return next;
    });
  };

  const isItemActive = (item: NavItem) => {
    if (item.href === '/admin') return pathname === '/admin';
    return pathname === item.href || pathname.startsWith(item.href + '/');
  };

  const isSubItemActive = (sub: SubMenuItem) => {
    const path = sub.href.split('?')[0];
    return pathname === path;
  };

  if (isLoginPage) return <>{children}</>;

  if (checking) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-[#1e293b] z-30 flex flex-col transform transition-transform duration-300
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:z-auto`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-slate-700 flex-shrink-0">
          <div className="w-9 h-9 rounded-lg bg-[#22c55e] flex items-center justify-center flex-shrink-0">
            <span className="text-black font-bold text-sm">I</span>
          </div>
          <div className="min-w-0">
            <div className="text-white font-bold text-base leading-tight">Investoft</div>
            <div className="text-slate-400 text-xs">Admin Panel</div>
          </div>
          <button className="ml-auto lg:hidden text-slate-400 hover:text-white" onClick={() => setSidebarOpen(false)}>
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 overflow-y-auto space-y-0.5">
          {navItems.map((item) => {
            const isActive = isItemActive(item);
            const isExpanded = expandedMenus.has(item.href);
            const hasSubItems = item.subItems && item.subItems.length > 0;

            return (
              <div key={item.href}>
                {hasSubItems ? (
                  <button
                    onClick={() => toggleMenu(item.href)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                      ${isActive
                        ? 'bg-[#22c55e]/10 text-[#22c55e]'
                        : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                      }`}
                  >
                    <item.icon className="w-4 h-4 flex-shrink-0" />
                    <span className="flex-1 text-left truncate">{item.label}</span>
                    {isExpanded
                      ? <ChevronDownIcon className="w-3.5 h-3.5 flex-shrink-0" />
                      : <ChevronRightIcon className="w-3.5 h-3.5 flex-shrink-0" />
                    }
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                      ${isActive
                        ? 'bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20'
                        : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                      }`}
                  >
                    <item.icon className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                )}

                {/* Sub-menu */}
                {hasSubItems && isExpanded && (
                  <div className="ml-4 mt-0.5 space-y-0.5 border-l border-slate-700 pl-3">
                    {item.subItems!.map((sub) => (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center gap-2 px-2 py-2 rounded-lg text-xs font-medium transition-colors
                          ${isSubItemActive(sub)
                            ? 'text-[#22c55e] bg-[#22c55e]/5'
                            : 'text-slate-500 hover:text-slate-300 hover:bg-slate-700/30'
                          }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isSubItemActive(sub) ? 'bg-[#22c55e]' : 'bg-slate-600'}`} />
                        {sub.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-2 py-3 border-t border-slate-700 flex-shrink-0">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-colors w-full"
          >
            <ArrowRightOnRectangleIcon className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-0">
        {/* Top bar */}
        <header className="bg-[#1e293b] border-b border-slate-700 px-4 lg:px-6 py-4 flex items-center gap-4 sticky top-0 z-10">
          <button className="lg:hidden text-slate-400 hover:text-white" onClick={() => setSidebarOpen(true)}>
            <Bars3Icon className="w-6 h-6" />
          </button>
          <div className="flex-1">
            <h1 className="text-white font-semibold text-base">Investoft Admin Panel</h1>
          </div>
          <button className="relative text-slate-400 hover:text-white transition-colors">
            <BellIcon className="w-6 h-6" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#22c55e] rounded-full text-[10px] text-black font-bold flex items-center justify-center">!</span>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#22c55e]/20 border border-[#22c55e]/30 flex items-center justify-center">
              <span className="text-[#22c55e] text-xs font-bold">{adminEmail.charAt(0).toUpperCase()}</span>
            </div>
            <span className="text-slate-300 text-sm hidden sm:block max-w-[150px] truncate">{adminEmail}</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
