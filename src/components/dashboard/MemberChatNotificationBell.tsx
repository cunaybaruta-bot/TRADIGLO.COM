'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { BellIcon, XMarkIcon, PaperAirplaneIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

interface MemberNotification {
  id: string;
  type: 'chat' | 'system';
  title: string;
  message: string;
  session_id: string | null;
  is_read: boolean;
  created_at: string;
}

interface ChatMessage {
  id: string;
  session_id: string;
  sender_type: 'user' | 'admin' | 'bot';
  sender_id: string | null;
  message: string;
  created_at: string;
}

function relativeTime(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function MemberChatNotificationBell({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<MemberNotification[]>([]);
  const [open, setOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [pulse, setPulse] = useState(false);
  const [prevUnread, setPrevUnread] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabaseRef = useRef(createClient());

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const fetchNotifications = useCallback(async () => {
    const { data } = await supabaseRef.current
      .from('member_notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);
    if (data) setNotifications(data as MemberNotification[]);
  }, [userId]);

  const fetchMessages = useCallback(async (sessionId: string) => {
    const { data } = await supabaseRef.current
      .from('chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });
    if (data) setMessages(data as ChatMessage[]);
  }, []);

  // Initial fetch + realtime subscription for member_notifications
  useEffect(() => {
    if (!userId) return;
    fetchNotifications();

    const channel = supabaseRef.current
      .channel(`member_notif_${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'member_notifications', filter: `user_id=eq.${userId}` },
        (payload) => {
          setNotifications((prev) => [payload.new as MemberNotification, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabaseRef.current.removeChannel(channel);
    };
  }, [userId, fetchNotifications]);

  // Pulse animation when new notification arrives
  useEffect(() => {
    if (unreadCount > prevUnread && prevUnread !== 0) {
      setPulse(true);
      const t = setTimeout(() => setPulse(false), 2000);
      return () => clearTimeout(t);
    }
    setPrevUnread(unreadCount);
  }, [unreadCount, prevUnread]);

  // Realtime messages subscription when chat is open
  useEffect(() => {
    if (!activeSessionId) return;
    fetchMessages(activeSessionId);

    const channel = supabaseRef.current
      .channel(`member_chat_${activeSessionId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `session_id=eq.${activeSessionId}` },
        (payload) => {
          setMessages((prev) => {
            const exists = prev.find((m) => m.id === (payload.new as ChatMessage).id);
            if (exists) return prev;
            return [...prev, payload.new as ChatMessage];
          });
        }
      )
      .subscribe();

    const poll = setInterval(() => fetchMessages(activeSessionId), 4000);

    return () => {
      supabaseRef.current.removeChannel(channel);
      clearInterval(poll);
    };
  }, [activeSessionId, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
      if (chatRef.current && !chatRef.current.contains(e.target as Node)) {
        // don't close chat on outside click — user might be typing
      }
    };
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const markAsRead = async (id: string) => {
    await supabaseRef.current
      .from('member_notifications')
      .update({ is_read: true })
      .eq('id', id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  };

  const markAllAsRead = async () => {
    await supabaseRef.current
      .from('member_notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const openChat = async (notif: MemberNotification) => {
    if (!notif.session_id) return;
    if (!notif.is_read) await markAsRead(notif.id);
    setActiveSessionId(notif.session_id);
    setChatOpen(true);
    setOpen(false);
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !activeSessionId) return;
    setSending(true);
    const { data: { session } } = await supabaseRef.current.auth.getSession();
    await supabaseRef.current.from('chat_messages').insert({
      session_id: activeSessionId,
      sender_type: 'user',
      sender_id: session?.user?.id,
      message: replyText.trim(),
    });
    await supabaseRef.current
      .from('chat_sessions')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', activeSessionId);
    setReplyText('');
    setSending(false);
  };

  if (!userId) return null;

  return (
    <>
      {/* Notification Bell */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setOpen((v) => !v)}
          className={`relative p-1.5 rounded-lg transition-all duration-150 ${
            open ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white hover:bg-white/8'
          }`}
          aria-label="Notifications"
        >
          <BellIcon className={`w-5 h-5 ${pulse ? 'animate-bounce' : ''}`} />
          {unreadCount > 0 && (
            <>
              <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-0.5 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center shadow-lg shadow-red-500/30 z-10">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
              {pulse && (
                <span className="absolute -top-1 -right-1 w-[16px] h-[16px] rounded-full bg-red-400/50 animate-ping" />
              )}
            </>
          )}
        </button>

        {/* Dropdown */}
        {open && (
          <div className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-1rem)] bg-[#0a0f1e] border border-white/10 rounded-2xl shadow-2xl shadow-black/60 z-[9999] overflow-hidden">
            {/* Header */}
            <div className="px-4 pt-3.5 pb-2.5 border-b border-white/8 flex items-center justify-between">
              <h3 className="text-white font-bold text-sm">Notifications</h3>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-[10px] text-slate-400 hover:text-emerald-400 px-2 py-1 rounded-lg hover:bg-emerald-500/10 transition-all font-medium"
                  >
                    Mark all read
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="p-1 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/8 transition-all">
                  <XMarkIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Notification List */}
            <div className="max-h-72 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-slate-500 gap-2">
                  <BellIcon className="w-8 h-8 opacity-20" />
                  <span className="text-xs">No notifications yet</span>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => notif.session_id ? openChat(notif) : markAsRead(notif.id)}
                    className={`flex items-start gap-3 px-4 py-3 border-b border-white/5 cursor-pointer transition-all hover:bg-white/5 ${notif.is_read ? 'opacity-60' : ''}`}
                  >
                    <div className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center mt-0.5 ${
                      notif.type === 'chat' ? 'bg-purple-500/15 border border-purple-500/25' : 'bg-blue-500/15 border border-blue-500/25'
                    }`}>
                      <ChatBubbleLeftRightIcon className={`w-4 h-4 ${notif.type === 'chat' ? 'text-purple-400' : 'text-blue-400'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1 mb-0.5">
                        <p className={`text-xs font-semibold leading-snug truncate ${notif.is_read ? 'text-slate-400' : 'text-slate-100'}`}>
                          {notif.title}
                        </p>
                        <span className="text-[9px] text-slate-500 flex-shrink-0 mt-px">{relativeTime(notif.created_at)}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">{notif.message}</p>
                      {notif.session_id && (
                        <span className="text-[10px] text-purple-400 mt-1 inline-block font-medium">Tap to reply →</span>
                      )}
                    </div>
                    {!notif.is_read && (
                      <div className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5" />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Chat Panel */}
      {chatOpen && activeSessionId && (
        <div
          ref={chatRef}
          className="fixed bottom-4 right-4 w-80 max-w-[calc(100vw-2rem)] bg-[#0a0f1e] border border-white/10 rounded-2xl shadow-2xl shadow-black/60 z-[9998] flex flex-col overflow-hidden"
          style={{ height: 420 }}
        >
          {/* Chat Header */}
          <div className="flex items-center gap-2.5 px-4 py-3 border-b border-white/8 bg-[#0d1526]">
            <div className="w-7 h-7 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center flex-shrink-0">
              <ChatBubbleLeftRightIcon className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white text-xs font-semibold">Support Chat</div>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                <span className="text-slate-400 text-[10px]">Admin is online</span>
              </div>
            </div>
            <button
              onClick={() => { setChatOpen(false); setActiveSessionId(null); setMessages([]); }}
              className="p-1 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/8 transition-all"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {messages.length === 0 ? (
              <div className="text-slate-500 text-xs text-center py-6">Start the conversation...</div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-xl px-3 py-2 ${
                    msg.sender_type === 'user' ?'bg-blue-600/20 border border-blue-500/25'
                      : msg.sender_type === 'bot' ?'bg-cyan-500/10 border border-cyan-500/20' :'bg-purple-500/10 border border-purple-500/20'
                  }`}>
                    <div className={`text-[10px] font-semibold mb-0.5 ${
                      msg.sender_type === 'user' ? 'text-blue-400' : msg.sender_type === 'bot' ? 'text-cyan-400' : 'text-purple-400'
                    }`}>
                      {msg.sender_type === 'user' ? 'You' : msg.sender_type === 'bot' ? '🤖 Bot' : 'Admin'}
                    </div>
                    <div className="text-white text-xs whitespace-pre-wrap leading-relaxed">{msg.message}</div>
                    <div className="text-slate-500 text-[9px] mt-1">{new Date(msg.created_at).toLocaleTimeString()}</div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Reply Input */}
          <div className="p-3 border-t border-white/8">
            <div className="flex gap-2">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendReply(); } }}
                placeholder="Type a reply..."
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50"
              />
              <button
                onClick={handleSendReply}
                disabled={sending || !replyText.trim()}
                className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 rounded-lg transition-colors flex items-center"
              >
                <PaperAirplaneIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
