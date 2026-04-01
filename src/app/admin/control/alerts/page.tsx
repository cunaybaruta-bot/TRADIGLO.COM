'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ExclamationTriangleIcon, CheckCircleIcon, InformationCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface Alert {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export default function SystemAlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from('admin_notifications')
      .select('id, type, title, message, is_read, created_at')
      .order('created_at', { ascending: false })
      .limit(50);
    setAlerts((data as Alert[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  const markAllRead = async () => {
    const supabase = createClient();
    await supabase.from('admin_notifications').update({ is_read: true }).eq('is_read', false);
    fetchAlerts();
  };

  const getIcon = (type: string) => {
    if (type === 'withdrawal') return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-400" />;
    if (type === 'deposit') return <CheckCircleIcon className="w-5 h-5 text-green-400" />;
    return <InformationCircleIcon className="w-5 h-5 text-blue-400" />;
  };

  const getBg = (type: string, isRead: boolean) => {
    const opacity = isRead ? '/5' : '/10';
    if (type === 'withdrawal') return `bg-yellow-500${opacity} border-yellow-500/20`;
    if (type === 'deposit') return `bg-green-500${opacity} border-green-500/20`;
    return `bg-blue-500${opacity} border-blue-500/20`;
  };

  const relativeTime = (dateStr: string) => {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const unreadCount = alerts.filter((a) => !a.is_read).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">System Alerts</h1>
          <p className="text-gray-400 text-sm mt-1">Platform notifications and system alerts</p>
        </div>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="px-3 py-1.5 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 rounded-lg text-xs font-medium transition-colors">
              Mark all read ({unreadCount})
            </button>
          )}
          <button onClick={fetchAlerts} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
            <ArrowPathIcon className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading alerts...</div>
      ) : alerts.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <InformationCircleIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No alerts found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div key={alert.id} className={`flex items-start gap-4 p-4 rounded-xl border ${getBg(alert.type, alert.is_read)}`}>
              <div className="mt-0.5">{getIcon(alert.type)}</div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className={`font-medium ${alert.is_read ? 'text-gray-300' : 'text-white'}`}>{alert.title}</h3>
                  <div className="flex items-center gap-2">
                    {!alert.is_read && <span className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" />}
                    <span className="text-gray-500 text-xs">{relativeTime(alert.created_at)}</span>
                  </div>
                </div>
                <p className="text-gray-400 text-sm mt-1">{alert.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
