'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  BellIcon,
  UserPlusIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  ChartBarIcon,
  CheckIcon,
  XMarkIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { useNotifications, AdminNotification } from '@/contexts/NotificationContext';

const TYPE_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; border: string; dot: string; icon: React.ComponentType<{ className?: string }> }
> = {
  new_user:   { label: 'New User',    color: 'text-blue-400',   bg: 'bg-blue-500/15',   border: 'border-blue-500/25',   dot: 'bg-blue-400',   icon: UserPlusIcon },
  deposit:    { label: 'Deposit',     color: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/25', dot: 'bg-emerald-400', icon: ArrowDownTrayIcon },
  withdrawal: { label: 'Withdrawal',  color: 'text-amber-400',  bg: 'bg-amber-500/15',  border: 'border-amber-500/25',  dot: 'bg-amber-400',  icon: ArrowUpTrayIcon },
  trade:      { label: 'Trade',       color: 'text-violet-400', bg: 'bg-violet-500/15', border: 'border-violet-500/25', dot: 'bg-violet-400', icon: ChartBarIcon },
  copy_trade: { label: 'Copy Trade',  color: 'text-cyan-400',   bg: 'bg-cyan-500/15',   border: 'border-cyan-500/25',   dot: 'bg-cyan-400',   icon: UserGroupIcon },
};

function relativeTime(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function NotificationItem({
  notification,
  onRead,
  onClose,
}: {
  notification: AdminNotification;
  onRead: (id: string) => void;
  onClose: () => void;
}) {
  const router = useRouter();
  const cfg = TYPE_CONFIG[notification.type] || TYPE_CONFIG.trade;
  const IconComp = cfg.icon;
  const isDeposit = notification.type === 'deposit';
  const isWithdrawal = notification.type === 'withdrawal';

  const handleClick = () => {
    if (!notification.is_read) onRead(notification.id);
    onClose();
    if (isWithdrawal) router.push('/admin/withdrawals?status=pending');
    else if (isDeposit) router.push('/admin/deposits?status=pending');
  };

  return (
    <div
      onClick={handleClick}
      className={`relative flex items-start gap-3 px-4 py-3.5 cursor-pointer transition-all duration-150 group
        ${notification.is_read
          ? 'opacity-55 hover:opacity-75 hover:bg-white/[0.02]'
          : 'hover:bg-white/[0.04]'
        }`}
    >
      {/* Unread left accent bar */}
      {!notification.is_read && (
        <div className="absolute left-0 top-3 bottom-3 w-0.5 rounded-r-full bg-gradient-to-b from-transparent via-current to-transparent" style={{ color: cfg.dot.replace('bg-', '') }} />
      )}

      {/* Icon */}
      <div className={`flex-shrink-0 w-9 h-9 rounded-xl ${cfg.bg} border ${cfg.border} flex items-center justify-center mt-0.5`}>
        <IconComp className={`w-4 h-4 ${cfg.color}`} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-0.5">
          <p className={`text-sm font-semibold leading-snug truncate ${notification.is_read ? 'text-slate-400' : 'text-slate-100'}`}>
            {notification.title}
          </p>
          <span className="text-[10px] text-slate-500 flex-shrink-0 mt-px whitespace-nowrap">{relativeTime(notification.created_at)}</span>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{notification.message}</p>
        {notification.users?.email && (
          <p className="text-[10px] text-slate-600 mt-1 truncate">{notification.users.email}</p>
        )}
        {(isDeposit || isWithdrawal) && (
          <span className={`inline-flex items-center gap-1 mt-2 text-[11px] font-semibold ${cfg.color} group-hover:underline`}>
            Review →
          </span>
        )}
      </div>

      {/* Unread dot */}
      {!notification.is_read && (
        <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-1.5 ${cfg.dot}`} />
      )}
    </div>
  );
}

type FilterTab = 'all' | 'new' | 'withdrawals';

export default function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [prevUnread, setPrevUnread] = useState(0);
  const [pulse, setPulse] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const pendingDepositCount = notifications.filter(n => n.type === 'deposit' && !n.is_read).length;
  const pendingWithdrawalCount = notifications.filter(n => n.type === 'withdrawal' && !n.is_read).length;
  const newCount = notifications.filter(n => !n.is_read).length;

  useEffect(() => {
    if (unreadCount > prevUnread && prevUnread !== 0) {
      setPulse(true);
      const t = setTimeout(() => setPulse(false), 2000);
      return () => clearTimeout(t);
    }
    setPrevUnread(unreadCount);
  }, [unreadCount, prevUnread]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const filtered = notifications.slice(0, 15).filter(n => {
    if (activeTab === 'new') return !n.is_read;
    if (activeTab === 'withdrawals') return n.type === 'withdrawal';
    return true;
  });

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setOpen(v => !v)}
        className={`relative p-2 rounded-xl transition-all duration-150 ${
          open
            ? 'bg-slate-700/80 text-white shadow-inner'
            : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
        }`}
        aria-label="Notifications"
      >
        <BellIcon className={`w-5 h-5 ${pulse ? 'animate-bounce' : ''}`} />
        {unreadCount > 0 && (
          <>
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shadow-lg shadow-red-500/30 z-10">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
            {pulse && (
              <span className="absolute -top-1 -right-1 w-[18px] h-[18px] rounded-full bg-red-400/50 animate-ping" />
            )}
          </>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2.5 w-[400px] max-w-[calc(100vw-1.5rem)] bg-[#0a0f1e] border border-white/10 rounded-2xl shadow-2xl shadow-black/60 z-50 overflow-hidden">

          {/* Header */}
          <div className="px-5 pt-4 pb-3 border-b border-white/8">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-bold text-base tracking-tight">Notifications</h3>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all duration-150 font-medium"
                  >
                    <CheckIcon className="w-3.5 h-3.5" />
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/8 transition-all duration-150"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5">
              {([
                { key: 'all', label: 'All', count: notifications.length },
                { key: 'new', label: 'New', count: newCount },
                { key: 'withdrawals', label: 'Withdrawals', count: pendingWithdrawalCount },
              ] as { key: FilterTab; label: string; count: number }[]).map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                    activeTab === tab.key
                      ? 'bg-blue-500/15 text-blue-400 border border-blue-500/25' :'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                  }`}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span className={`min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center ${
                      activeTab === tab.key
                        ? tab.key === 'withdrawals' ? 'bg-amber-500/25 text-amber-300' : 'bg-blue-500/25 text-blue-300' : 'bg-white/8 text-slate-400'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Quick action banners */}
          {activeTab !== 'withdrawals' && pendingWithdrawalCount > 0 && (
            <Link
              href="/admin/withdrawals?status=pending"
              onClick={() => setOpen(false)}
              className="flex items-center justify-between px-5 py-2.5 bg-amber-500/8 border-b border-amber-500/15 hover:bg-amber-500/14 transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                  <ArrowUpTrayIcon className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <span className="text-amber-300 text-xs font-semibold">
                  {pendingWithdrawalCount} withdrawal{pendingWithdrawalCount > 1 ? 's' : ''} awaiting approval
                </span>
              </div>
              <span className="text-amber-400 text-xs font-semibold group-hover:translate-x-0.5 transition-transform">Review →</span>
            </Link>
          )}

          {activeTab !== 'withdrawals' && pendingDepositCount > 0 && (
            <Link
              href="/admin/deposits?status=pending"
              onClick={() => setOpen(false)}
              className="flex items-center justify-between px-5 py-2.5 bg-emerald-500/8 border-b border-emerald-500/15 hover:bg-emerald-500/14 transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                  <ArrowDownTrayIcon className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <span className="text-emerald-300 text-xs font-semibold">
                  {pendingDepositCount} deposit{pendingDepositCount > 1 ? 's' : ''} awaiting approval
                </span>
              </div>
              <span className="text-emerald-400 text-xs font-semibold group-hover:translate-x-0.5 transition-transform">Review →</span>
            </Link>
          )}

          {/* Notification List */}
          <div className="max-h-[360px] overflow-y-auto divide-y divide-white/5 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-700">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 text-center px-6">
                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/8 flex items-center justify-center mb-4">
                  <BellIcon className="w-6 h-6 text-slate-500" />
                </div>
                <p className="text-slate-300 text-sm font-semibold mb-1">
                  {activeTab === 'new' ? 'All caught up!' : activeTab === 'withdrawals' ? 'No withdrawal notifications' : 'No notifications yet'}
                </p>
                <p className="text-slate-600 text-xs leading-relaxed">
                  {activeTab === 'new' ? 'You have no unread notifications.' : 'New activity will appear here.'}
                </p>
              </div>
            ) : (
              filtered.map(n => (
                <NotificationItem key={n.id} notification={n} onRead={markAsRead} onClose={() => setOpen(false)} />
              ))
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-white/8 px-5 py-3 bg-white/3">
            <Link
              href="/admin/notifications"
              onClick={() => setOpen(false)}
              className="flex items-center justify-center w-full py-2 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-white/8 transition-all duration-150 font-medium gap-1.5"
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
