'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  XMarkIcon,
  CheckCircleIcon,
  ClockIcon,
  UserCircleIcon,
  LanguageIcon,
} from '@heroicons/react/24/outline';

interface ChatSession {
  id: string;
  user_id: string;
  status: 'active' | 'closed';
  created_at: string;
  updated_at: string;
  users?: { email: string; full_name?: string };
  last_message?: string;
  unread?: number;
}

interface ChatMessage {
  id: string;
  session_id: string;
  sender_type: 'user' | 'admin' | 'bot';
  sender_id: string | null;
  message: string;
  created_at: string;
}

const TRANSLATE_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'id', label: 'Indonesian' },
  { code: 'ms', label: 'Malay' },
  { code: 'ar', label: 'Arabic' },
  { code: 'zh', label: 'Chinese (Simplified)' },
  { code: 'zh-TW', label: 'Chinese (Traditional)' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'hi', label: 'Hindi' },
  { code: 'ja', label: 'Japanese' },
  { code: 'ko', label: 'Korean' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'ru', label: 'Russian' },
  { code: 'tr', label: 'Turkish' },
  { code: 'th', label: 'Thai' },
  { code: 'vi', label: 'Vietnamese' },
  { code: 'it', label: 'Italian' },
  { code: 'nl', label: 'Dutch' },
  { code: 'pl', label: 'Polish' },
  { code: 'sv', label: 'Swedish' },
  { code: 'da', label: 'Danish' },
  { code: 'fi', label: 'Finnish' },
  { code: 'no', label: 'Norwegian' },
  { code: 'cs', label: 'Czech' },
  { code: 'ro', label: 'Romanian' },
  { code: 'hu', label: 'Hungarian' },
  { code: 'uk', label: 'Ukrainian' },
  { code: 'fa', label: 'Persian' },
  { code: 'ur', label: 'Urdu' },
  { code: 'bn', label: 'Bengali' },
  { code: 'ta', label: 'Tamil' },
  { code: 'te', label: 'Telugu' },
  { code: 'sw', label: 'Swahili' },
  { code: 'tl', label: 'Filipino' },
];

export default function AdminLiveChatPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [closingSession, setClosingSession] = useState(false);
  const [translateLang, setTranslateLang] = useState('id');
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [translating, setTranslating] = useState<Record<string, boolean>>({});
  const [adminTranslateLang, setAdminTranslateLang] = useState('ar');
  const [translatingInput, setTranslatingInput] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Stable supabase client reference — never recreated on re-render
  const supabase = useMemo(() => createClient(), []);

  const fetchSessions = useCallback(async () => {
    const { data } = await supabase
      .from('chat_sessions')
      .select('*, users(email, full_name)')
      .order('updated_at', { ascending: false });
    if (data) setSessions(data as any);
    setLoading(false);
  }, [supabase]);

  const fetchMessages = useCallback(async (sessionId: string) => {
    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });
    if (data) setMessages(data);
  }, [supabase]);

  // Sessions realtime subscription
  useEffect(() => {
    fetchSessions();
    const channel = supabase
      .channel('admin_chat_sessions_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_sessions' }, () => {
        fetchSessions();
      })
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          // Retry after short delay
          setTimeout(() => fetchSessions(), 2000);
        }
      });
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchSessions, supabase]);

  // Messages realtime subscription — re-subscribes when selectedSession changes
  useEffect(() => {
    if (!selectedSession) return;
    fetchMessages(selectedSession.id);

    const channelName = `admin_chat_messages_${selectedSession.id}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `session_id=eq.${selectedSession.id}`,
        },
        (payload) => {
          setMessages((prev) => {
            const exists = prev.find((m) => m.id === (payload.new as ChatMessage).id);
            if (exists) return prev;
            return [...prev, payload.new as ChatMessage];
          });
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          setTimeout(() => fetchMessages(selectedSession.id), 2000);
        }
      });

    // Polling fallback — re-fetch every 3s in case realtime event is missed
    const pollInterval = setInterval(() => {
      fetchMessages(selectedSession.id);
    }, 3000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
    };
  }, [selectedSession?.id, supabase, fetchMessages]);

  // Clear translations when switching sessions
  useEffect(() => {
    setTranslations({});
    setTranslating({});
  }, [selectedSession?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleTranslate = useCallback(async (msg: ChatMessage) => {
    const langLabel = TRANSLATE_LANGUAGES.find((l) => l.code === translateLang)?.label || translateLang;
    setTranslating((prev) => ({ ...prev, [msg.id]: true }));
    try {
      const res = await fetch('/api/ai/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You are a professional translator. Translate the user's message to ${langLabel}. Return ONLY the translated text, no explanations.`,
            },
            { role: 'user', content: msg.message },
          ],
          stream: false,
          parameters: { max_completion_tokens: 500, temperature: 1 },
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || `HTTP ${res.status}`);
      const translated = data?.choices?.[0]?.message?.content?.trim() || '';
      if (!translated) throw new Error('Empty translation response');
      setTranslations((prev) => ({ ...prev, [msg.id]: translated }));
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error('Translation error:', errMsg);
      setTranslations((prev) => ({ ...prev, [msg.id]: `⚠️ Translation failed: ${errMsg}` }));
    } finally {
      setTranslating((prev) => ({ ...prev, [msg.id]: false }));
    }
  }, [translateLang]);

  const handleTranslateInput = useCallback(async () => {
    if (!messageText.trim()) return;
    const langLabel = TRANSLATE_LANGUAGES.find((l) => l.code === adminTranslateLang)?.label || adminTranslateLang;
    setTranslatingInput(true);
    try {
      const res = await fetch('/api/ai/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You are a professional translator. Translate the user's message to ${langLabel}. Return ONLY the translated text, no explanations.`,
            },
            { role: 'user', content: messageText.trim() },
          ],
          stream: false,
          parameters: { max_completion_tokens: 500, temperature: 1 },
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || `HTTP ${res.status}`);
      const translated = data?.choices?.[0]?.message?.content?.trim() || '';
      if (!translated) throw new Error('Empty translation response');
      setMessageText(translated);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error('Input translation error:', errMsg);
    } finally {
      setTranslatingInput(false);
    }
  }, [messageText, adminTranslateLang]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedSession) return;
    setSending(true);
    const { data: { session } } = await supabase.auth.getSession();
    await supabase.from('chat_messages').insert({
      session_id: selectedSession.id,
      sender_type: 'admin',
      sender_id: session?.user?.id,
      message: messageText.trim(),
    });
    await supabase.from('chat_sessions').update({ updated_at: new Date().toISOString() }).eq('id', selectedSession.id);
    setMessageText('');
    setSending(false);
  };

  const handleCloseSession = async () => {
    if (!selectedSession) return;
    setClosingSession(true);
    await supabase.from('chat_sessions').update({ status: 'closed', updated_at: new Date().toISOString() }).eq('id', selectedSession.id);
    setSelectedSession({ ...selectedSession, status: 'closed' });
    fetchSessions();
    setClosingSession(false);
  };

  const activeSessions = sessions.filter((s) => s.status === 'active');
  const closedSessions = sessions.filter((s) => s.status === 'closed');

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-white text-xl font-bold">Live Chat</h2>
        <p className="text-slate-400 text-sm mt-1">Realtime chat with members — {activeSessions.length} active session{activeSessions.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="bg-[#1e293b] border border-slate-700 rounded-xl overflow-hidden flex h-[600px]">
        {/* Session List */}
        <div className={`${selectedSession ? 'hidden sm:flex' : 'flex'} flex-col w-full sm:w-72 border-r border-slate-700`}>
          <div className="p-3 border-b border-slate-700">
            <div className="flex gap-2">
              <div className="flex-1 bg-slate-800 rounded-lg px-3 py-1.5 text-xs text-[#22c55e] font-medium flex items-center gap-1.5">
                <ClockIcon className="w-3.5 h-3.5" />
                Active ({activeSessions.length})
              </div>
              <div className="flex-1 bg-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-400 font-medium flex items-center gap-1.5">
                <CheckCircleIcon className="w-3.5 h-3.5" />
                Closed ({closedSessions.length})
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-24 text-slate-400 text-sm">Loading...</div>
            ) : sessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-slate-500 text-sm gap-2">
                <ChatBubbleLeftRightIcon className="w-8 h-8 opacity-30" />
                No chat sessions yet
              </div>
            ) : (
              <>
                {activeSessions.length > 0 && (
                  <div>
                    <div className="px-3 py-2 text-xs text-slate-500 font-medium uppercase tracking-wider">Active</div>
                    {activeSessions.map((session) => (
                      <SessionItem key={session.id} session={session} selected={selectedSession?.id === session.id} onClick={() => setSelectedSession(session)} />
                    ))}
                  </div>
                )}
                {closedSessions.length > 0 && (
                  <div>
                    <div className="px-3 py-2 text-xs text-slate-500 font-medium uppercase tracking-wider">Closed</div>
                    {closedSessions.map((session) => (
                      <SessionItem key={session.id} session={session} selected={selectedSession?.id === session.id} onClick={() => setSelectedSession(session)} />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Chat Area */}
        {selectedSession ? (
          <div className="flex-1 flex flex-col min-w-0">
            {/* Chat Header */}
            <div className="p-4 border-b border-slate-700 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#22c55e]/20 flex items-center justify-center flex-shrink-0">
                <UserCircleIcon className="w-5 h-5 text-[#22c55e]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white text-sm font-medium truncate">{(selectedSession.users as any)?.email || 'Unknown user'}</div>
                <div className="flex items-center gap-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${selectedSession.status === 'active' ? 'bg-green-400' : 'bg-slate-500'}`} />
                  <span className="text-slate-400 text-xs capitalize">{selectedSession.status}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Translate language selector */}
                <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-600 rounded-lg px-2 py-1">
                  <LanguageIcon className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                  <select
                    value={translateLang}
                    onChange={(e) => {
                      setTranslateLang(e.target.value);
                      setTranslations({});
                    }}
                    className="bg-slate-800 text-xs text-slate-200 focus:outline-none cursor-pointer border-none max-w-[120px]"
                  >
                    {TRANSLATE_LANGUAGES.map((l) => (
                      <option key={l.code} value={l.code} className="bg-slate-800 text-slate-200">
                        {l.label}
                      </option>
                    ))}
                  </select>
                </div>
                {selectedSession.status === 'active' && (
                  <button
                    onClick={handleCloseSession}
                    disabled={closingSession}
                    className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {closingSession ? 'Closing...' : 'Close Session'}
                  </button>
                )}
                <button onClick={() => setSelectedSession(null)} className="text-slate-400 hover:text-white sm:hidden">
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <div className="text-slate-500 text-sm text-center py-8">No messages in this session yet.</div>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] rounded-xl px-4 py-2.5 ${
                      msg.sender_type === 'admin' ? 'bg-[#22c55e]/10 border border-[#22c55e]/20'
                        : msg.sender_type === 'bot' ? 'bg-cyan-500/10 border border-cyan-500/20' : 'bg-slate-700/50 border border-slate-600/50'
                    }`}>
                      <div className={`text-xs font-medium mb-1 ${
                        msg.sender_type === 'admin' ? 'text-[#22c55e]' : msg.sender_type === 'bot' ? 'text-cyan-400' : 'text-slate-400'
                      }`}>
                        {msg.sender_type === 'admin' ? 'Admin' : msg.sender_type === 'bot' ? '🤖 AI Bot' : 'User'}
                      </div>
                      <div className="text-white text-sm whitespace-pre-wrap">{msg.message}</div>
                      {/* Translation result */}
                      {translations[msg.id] && (
                        <div className="mt-2 pt-2 border-t border-slate-600/40">
                          <div className="text-xs text-blue-400 font-medium mb-0.5 flex items-center gap-1">
                            <LanguageIcon className="w-3 h-3" />
                            {TRANSLATE_LANGUAGES.find((l) => l.code === translateLang)?.label}
                          </div>
                          <div className="text-slate-300 text-sm whitespace-pre-wrap">{translations[msg.id]}</div>
                        </div>
                      )}
                      <div className="flex items-center justify-between mt-1 gap-2">
                        <div className="text-slate-500 text-xs">{new Date(msg.created_at).toLocaleTimeString()}</div>
                        {/* Translate button — only for user/bot messages */}
                        {msg.sender_type !== 'admin' && (
                          <button
                            onClick={() => handleTranslate(msg)}
                            disabled={translating[msg.id]}
                            className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 disabled:opacity-50 transition-colors"
                            title={`Translate to ${TRANSLATE_LANGUAGES.find((l) => l.code === translateLang)?.label}`}
                          >
                            <LanguageIcon className="w-3 h-3" />
                            {translating[msg.id] ? 'Translating...' : translations[msg.id] ? 'Re-translate' : 'Translate'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            {selectedSession.status === 'active' ? (
              <div className="p-4 border-t border-slate-700">
                <div className="flex gap-2">
                  <textarea
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                    placeholder="Type a message... (Enter to send)"
                    rows={2}
                    className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#22c55e]/50 resize-none"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={sending || !messageText.trim()}
                    className="bg-[#22c55e] hover:bg-[#16a34a] disabled:opacity-50 disabled:cursor-not-allowed text-black font-semibold px-4 rounded-lg transition-colors flex items-center gap-1.5 text-sm"
                  >
                    <PaperAirplaneIcon className="w-4 h-4" />
                    {sending ? '...' : 'Send'}
                  </button>
                </div>
                {/* Admin translate input row */}
                <div className="flex items-center gap-2 mt-2">
                  <LanguageIcon className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                  <span className="text-xs text-slate-400">Translate to:</span>
                  <select
                    value={adminTranslateLang}
                    onChange={(e) => setAdminTranslateLang(e.target.value)}
                    className="bg-slate-800 border border-slate-600 text-xs text-slate-200 rounded-lg px-2 py-1 focus:outline-none cursor-pointer"
                  >
                    {TRANSLATE_LANGUAGES.map((l) => (
                      <option key={l.code} value={l.code} className="bg-slate-800 text-slate-200">
                        {l.label}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleTranslateInput}
                    disabled={translatingInput || !messageText.trim()}
                    className="flex items-center gap-1 text-xs bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 px-3 py-1 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <LanguageIcon className="w-3 h-3" />
                    {translatingInput ? 'Translating...' : 'Translate'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 border-t border-slate-700 text-center text-slate-500 text-sm">
                This session is closed. No new messages can be sent.
              </div>
            )}
          </div>
        ) : (
          <div className="hidden sm:flex flex-1 items-center justify-center flex-col gap-3 text-slate-500">
            <ChatBubbleLeftRightIcon className="w-12 h-12 opacity-20" />
            <span className="text-sm">Select a chat session to view messages</span>
          </div>
        )}
      </div>
    </div>
  );
}

function SessionItem({ session, selected, onClick }: { session: ChatSession; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-3 border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors ${selected ? 'bg-slate-700/50 border-l-2 border-l-[#22c55e]' : ''}`}
    >
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${session.status === 'active' ? 'bg-green-400' : 'bg-slate-500'}`} />
        <span className="text-white text-sm truncate flex-1">{(session.users as any)?.email || 'Unknown'}</span>
      </div>
      <div className="text-slate-500 text-xs mt-0.5 pl-4">{new Date(session.updated_at).toLocaleString()}</div>
    </button>
  );
}
