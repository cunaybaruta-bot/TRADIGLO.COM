'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface AdminNotification {
  id: string;
  type: 'new_user' | 'deposit' | 'withdrawal' | 'trade' | 'copy_trade';
  title: string;
  message: string;
  user_id: string | null;
  is_read: boolean;
  created_at: string;
  users?: { email: string; full_name: string | null } | null;
}

interface NotificationContextValue {
  notifications: AdminNotification[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refetch: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null);

  const fetchNotifications = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('admin_notifications')
      .select('id, type, title, message, user_id, is_read, created_at, users(email, full_name)')
      .order('created_at', { ascending: false })
      .limit(100);

    if (!error && data) {
      setNotifications(data as AdminNotification[]);
    }
    setLoading(false);
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    const supabase = createClient();
    await supabase
      .from('admin_notifications')
      .update({ is_read: true })
      .eq('id', id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(async () => {
    const supabase = createClient();
    await supabase
      .from('admin_notifications')
      .update({ is_read: true })
      .eq('is_read', false);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }, []);

  useEffect(() => {
    fetchNotifications();

    const supabase = createClient();
    const channel = supabase
      .channel('admin_notifications_realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'admin_notifications' },
        async (payload) => {
          // Fetch the full record with user join
          const { data } = await supabase
            .from('admin_notifications')
            .select('id, type, title, message, user_id, is_read, created_at, users(email, full_name)')
            .eq('id', payload.new.id)
            .single();

          if (data) {
            setNotifications((prev) => [data as AdminNotification, ...prev]);
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [fetchNotifications]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, loading, markAsRead, markAllAsRead, refetch: fetchNotifications }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}
