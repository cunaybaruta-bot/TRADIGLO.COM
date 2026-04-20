'use client';

import { useState } from 'react';

import {
  BellIcon,
  UserPlusIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  ChartBarIcon,
  CheckIcon,
  FunnelIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { useNotifications } from '@/contexts/NotificationContext';
import Icon from '@/components/ui/AppIcon';


// ─── Type config ─────────────────────────────────────────────────────────────
const TYPE_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; border: string; icon: React.ComponentType<{ className?: string }> }
> = {
  new_user:   { label: 'New User',    color: 'text-blue-400',   bg: 'bg-blue-400/10',   border: 'border-blue-400/30',   icon: UserPlusIcon },
  deposit:    { label: 'Deposit',     color: 'text-green-400',  bg: 'bg-green-400/10',  border: 'border-green-400/30',  icon: ArrowDownTrayIcon },
  withdrawal: { label: 'Withdrawal',  color: 'text-orange-400', bg: 'bg-orange-400/10', border: 'border-orange-400/30', icon: ArrowUpTrayIcon },
  trade:      { label: 'Trade',       color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/30', icon: ChartBarIcon },
};

const FILTER_TYPES = ['all', 'new_user', 'deposit', 'withdrawal', 'trade'] as const;
type FilterType = (typeof FILTER_TYPES)[number];

function relativeTime(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ─── Type Badge ───────────────────────────────────────────────────────────────
function TypeBadge({ type }: { type: string }) {
  const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.trade;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function NotificationsPage() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, refetch, loading } = useNotifications();
  const [filter, setFilter] = useState<FilterType>('all');
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleMarkAsRead = async (id: string) => {
    await markAsRead(id);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const filtered = filter === 'all'
    ? notifications
    : notifications.filter((n) => n.type === filter);

  const filterCounts: Record<string, number> = {
    all: notifications.length,
    new_user: notifications.filter((n) => n.type === 'new_user').length,
    deposit: notifications.filter((n) => n.type === 'deposit').length,
    withdrawal: notifications.filter((n) => n.type === 'withdrawal').length,
    trade: notifications.filter((n) => n.type === 'trade').length,
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-white text-xl font-bold flex items-center gap-2">
            <BellIcon className="w-6 h-6 text-[#22c55e]" />
            Notifications
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Real-time activity feed — {unreadCount > 0 ? (
              <span className="text-red-400 font-medium">{unreadCount} unread</span>
            ) : (
              <span className="text-slate-500">all caught up</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-700/50 border border-slate-700 transition-colors"
          >
            <ArrowPathIcon className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-[#22c55e] hover:bg-[#22c55e]/10 border border-[#22c55e]/30 transition-colors font-medium"
            >
              <CheckIcon className="w-4 h-4" />
              Mark all as read
            </button>
          )}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(['new_user', 'deposit', 'withdrawal', 'trade'] as const).map((type) => {
          const cfg = TYPE_CONFIG[type];
          const Icon = cfg.icon;
          const count = filterCounts[type];
          const unread = notifications.filter((n) => n.type === type && !n.is_read).length;
          return (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`p-4 rounded-xl border text-left transition-all ${
                filter === type
                  ? `${cfg.bg} ${cfg.border} ring-1 ring-inset ${cfg.border}`
                  : 'bg-[#1e293b] border-slate-700 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`w-8 h-8 rounded-lg ${cfg.bg} border ${cfg.border} flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 ${cfg.color}`} />
                </div>
                {unread > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[10px] font-bold border border-red-500/30">
                    {unread}
                  </span>
                )}
              </div>
              <div className={`text-xl font-bold ${cfg.color}`}>{count}</div>
              <div className="text-slate-400 text-xs mt-0.5">{cfg.label}</div>
            </button>
          );
        })}
      </div>

      {/* Filter Tabs */}
      <div className="bg-[#1e293b] rounded-xl border border-slate-700 overflow-hidden">
        <div className="flex items-center gap-1 p-2 border-b border-slate-700 overflow-x-auto">
          <FunnelIcon className="w-4 h-4 text-slate-500 flex-shrink-0 ml-1 mr-1" />
          {FILTER_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex-shrink-0 ${
                filter === type
                  ? 'bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              {type === 'all' ? 'All' : TYPE_CONFIG[type].label}
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                filter === type ? 'bg-[#22c55e]/20 text-[#22c55e]' : 'bg-slate-700 text-slate-400'
              }`}>
                {filterCounts[type]}
              </span>
            </button>
          ))}
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex items-center gap-3 text-slate-400">
              <ArrowPathIcon className="w-5 h-5 animate-spin" />
              <span className="text-sm">Loading notifications...</span>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-full bg-slate-700/50 flex items-center justify-center mb-4">
              <BellIcon className="w-7 h-7 text-slate-500" />
            </div>
            <p className="text-slate-300 font-medium">No notifications found</p>
            <p className="text-slate-500 text-sm mt-1">
              {filter === 'all' ? 'Activity will appear here in real-time' : `No ${TYPE_CONFIG[filter]?.label} notifications yet`}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">Type</th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">Title</th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3 hidden md:table-cell">Message</th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3 hidden lg:table-cell">User</th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">Time</th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {filtered.map((n) => {
                  const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.trade;
                  return (
                    <tr
                      key={n.id}
                      className={`transition-colors ${
                        n.is_read
                          ? 'opacity-50 hover:opacity-70' :'hover:bg-slate-700/20'
                      }`}
                    >
                      <td className="px-4 py-3.5">
                        <TypeBadge type={n.type} />
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`text-sm font-medium ${n.is_read ? 'text-slate-400' : 'text-white'}`}>
                          {n.title}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 hidden md:table-cell">
                        <span className="text-sm text-slate-400 line-clamp-2 max-w-xs">{n.message}</span>
                      </td>
                      <td className="px-4 py-3.5 hidden lg:table-cell">
                        <span className="text-xs text-slate-500 font-mono">
                          {(n.users as any)?.email || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div>
                          <div className="text-xs text-slate-400">{relativeTime(n.created_at)}</div>
                          <div className="text-[10px] text-slate-600 mt-0.5">{formatDateTime(n.created_at)}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        {n.is_read ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-700/50 text-slate-500 border border-slate-600/50">
                            Read
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
                            Unread
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        {!n.is_read && (
                          <button
                            onClick={() => handleMarkAsRead(n.id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-[#22c55e] hover:bg-[#22c55e]/10 transition-colors"
                            title="Mark as read"
                          >
                            <CheckIcon className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer count */}
        {filtered.length > 0 && (
          <div className="px-4 py-3 border-t border-slate-700 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Showing {filtered.length} notification{filtered.length !== 1 ? 's' : ''}
              {filter !== 'all' && ` · filtered by ${TYPE_CONFIG[filter]?.label}`}
            </span>
            <span className="text-xs text-slate-600">Auto-updates via Supabase Realtime</span>
          </div>
        )}
      </div>
    </div>
  );
}
