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
import Icon from '@/components/ui/AppIcon';


const TYPE_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; border: string; icon: React.ComponentType<{ className?: string }> }
> = {
  new_user:   { label: 'New User',    color: 'text-blue-400',   bg: 'bg-blue-400/10',   border: 'border-blue-400/30',   icon: UserPlusIcon },
  deposit:    { label: 'Deposit',     color: 'text-green-400',  bg: 'bg-green-400/10',  border: 'border-green-400/30',  icon: ArrowDownTrayIcon },
  withdrawal: { label: 'Withdrawal',  color: 'text-orange-400', bg: 'bg-orange-400/10', border: 'border-orange-400/30', icon: ArrowUpTrayIcon },
  trade:      { label: 'Trade',       color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/30', icon: ChartBarIcon },
  copy_trade: { label: 'Copy Trade',  color: 'text-cyan-400',   bg: 'bg-cyan-400/10',   border: 'border-cyan-400/30',   icon: UserGroupIcon },
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
  const Icon = cfg.icon;
  const isDeposit = notification.type === 'deposit';

  const handleView = () => {
    if (!notification.is_read) onRead(notification.id);
    onClose();
    router.push('/admin/deposits?status=pending');
  };

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 transition-colors group ${
        notification.is_read ? 'opacity-50 hover:opacity-70' : 'hover:bg-slate-700/40'
      }`}
      onClick={() => !notification.is_read && onRead(notification.id)}
    >
      <div className={`flex-shrink-0 w-8 h-8 rounded-lg ${cfg.bg} border ${cfg.border} flex items-center justify-center mt-0.5`}>
        <Icon className={`w-4 h-4 ${cfg.color}`} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm font-medium leading-tight ${notification.is_read ? 'text-slate-400' : 'text-white'}`}>
            {notification.title}
          </p>
          <span className="text-[10px] text-slate-500 flex-shrink-0 mt-0.5">{relativeTime(notification.created_at)}</span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed line-clamp-2">{notification.message}</p>
        {notification.users?.email && (
          <p className="text-[10px] text-slate-600 mt-1 truncate">{notification.users.email}</p>
        )}
        {isDeposit && (
          <button
            onClick={(e) => { e.stopPropagation(); handleView(); }}
            className="mt-1.5 text-[10px] text-emerald-400 hover:text-emerald-300 font-semibold transition-colors"
          >
            View →
          </button>
        )}
      </div>

      {!notification.is_read && (
        <div className="flex-shrink-0 w-2 h-2 rounded-full bg-[#22c55e] mt-2" />
      )}
    </div>
  );
}

export default function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const [prevUnread, setPrevUnread] = useState(0);
  const [pulse, setPulse] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Count pending deposits from notifications
  const pendingDepositCount = notifications.filter(
    (n) => n.type === 'deposit' && !n.is_read
  ).length;

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

  const recent = notifications.slice(0, 10);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={`relative p-2 rounded-lg transition-colors ${open ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'}`}
        aria-label="Notifications"
      >
        <BellIcon className={`w-5 h-5 ${pulse ? 'animate-bounce' : ''}`} />

        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}

        {pulse && (
          <span className="absolute -top-0.5 -right-0.5 w-[18px] h-[18px] rounded-full bg-red-500/40 animate-ping" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-[380px] max-w-[calc(100vw-2rem)] bg-[#1e293b] border border-slate-700 rounded-xl shadow-2xl shadow-black/50 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
            <div className="flex items-center gap-2">
              <h3 className="text-white font-semibold text-sm">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[10px] font-bold border border-red-500/30">
                  {unreadCount} new
                </span>
              )}
              {pendingDepositCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-yellow-500/15 text-yellow-400 text-[10px] font-bold border border-yellow-500/25">
                  {pendingDepositCount} deposits
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-slate-400 hover:text-[#22c55e] hover:bg-[#22c55e]/10 transition-colors"
                >
                  <CheckIcon className="w-3.5 h-3.5" />
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded-lg text-slate-500 hover:text-white hover:bg-slate-700/50 transition-colors"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Pending deposits quick link */}
          {pendingDepositCount > 0 && (
            <Link
              href="/admin/deposits?status=pending"
              onClick={() => setOpen(false)}
              className="flex items-center justify-between px-4 py-2.5 bg-yellow-500/8 border-b border-yellow-500/15 hover:bg-yellow-500/12 transition-colors"
            >
              <div className="flex items-center gap-2">
                <ArrowDownTrayIcon className="w-4 h-4 text-yellow-400" />
                <span className="text-yellow-300 text-xs font-semibold">{pendingDepositCount} deposit{pendingDepositCount > 1 ? 's' : ''} awaiting approval</span>
              </div>
              <span className="text-yellow-400 text-xs">Review →</span>
            </Link>
          )}

          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-700/50">
            {recent.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-12 h-12 rounded-full bg-slate-700/50 flex items-center justify-center mb-3">
                  <BellIcon className="w-6 h-6 text-slate-500" />
                </div>
                <p className="text-slate-400 text-sm font-medium">No notifications yet</p>
                <p className="text-slate-600 text-xs mt-1">New activity will appear here</p>
              </div>
            ) : (
              recent.map((n) => (
                <NotificationItem key={n.id} notification={n} onRead={markAsRead} onClose={() => setOpen(false)} />
              ))
            )}
          </div>

          <div className="border-t border-slate-700 px-4 py-3">
            <Link
              href="/admin/notifications"
              onClick={() => setOpen(false)}
              className="flex items-center justify-center w-full py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors font-medium"
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
