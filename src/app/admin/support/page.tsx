'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  TicketIcon,
  ChatBubbleLeftRightIcon,
  QuestionMarkCircleIcon,
  CpuChipIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PaperAirplaneIcon,
  XMarkIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

interface Ticket {
  id: string;
  subject: string;
  category: string;
  status: 'open' | 'in_progress' | 'resolved';
  priority: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  users?: { email: string; full_name?: string };
}

interface TicketReply {
  id: string;
  ticket_id: string;
  sender_type: 'user' | 'admin';
  sender_id: string;
  message: string;
  created_at: string;
}

const statusConfig = {
  open: { label: 'Open', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', icon: ExclamationCircleIcon },
  in_progress: { label: 'In Progress', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', icon: ClockIcon },
  resolved: { label: 'Resolved', color: 'bg-green-500/10 text-green-400 border-green-500/20', icon: CheckCircleIcon },
};

const categoryColors: Record<string, string> = {
  deposit: 'bg-emerald-500/10 text-emerald-400',
  withdrawal: 'bg-orange-500/10 text-orange-400',
  trading: 'bg-purple-500/10 text-purple-400',
  account: 'bg-blue-500/10 text-blue-400',
  technical: 'bg-red-500/10 text-red-400',
  other: 'bg-slate-500/10 text-slate-400',
};

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [replies, setReplies] = useState<TicketReply[]>([]);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [stats, setStats] = useState({ open: 0, in_progress: 0, resolved: 0, total: 0 });

  const supabase = createClient();

  const fetchTickets = useCallback(async () => {
    const { data } = await supabase
      .from('support_tickets')
      .select('*, users(email, full_name)')
      .order('created_at', { ascending: false });
    if (data) {
      setTickets(data as any);
      setStats({
        open: data.filter((t) => t.status === 'open').length,
        in_progress: data.filter((t) => t.status === 'in_progress').length,
        resolved: data.filter((t) => t.status === 'resolved').length,
        total: data.length,
      });
    }
    setLoading(false);
  }, []);

  const fetchReplies = useCallback(async (ticketId: string) => {
    const { data } = await supabase
      .from('ticket_replies')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });
    if (data) setReplies(data);
  }, []);

  useEffect(() => {
    fetchTickets();
    // Realtime subscription
    const channel = supabase
      .channel('support_tickets_admin')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_tickets' }, fetchTickets)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchTickets]);

  useEffect(() => {
    if (!selectedTicket) return;
    fetchReplies(selectedTicket.id);
    const channel = supabase
      .channel(`ticket_replies_${selectedTicket.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ticket_replies', filter: `ticket_id=eq.${selectedTicket.id}` }, () => fetchReplies(selectedTicket.id))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selectedTicket, fetchReplies]);

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedTicket) return;
    setSendingReply(true);
    const { data: { session } } = await supabase.auth.getSession();
    await supabase.from('ticket_replies').insert({
      ticket_id: selectedTicket.id,
      sender_type: 'admin',
      sender_id: session?.user?.id,
      message: replyText.trim(),
    });
    // Auto update to in_progress if still open
    if (selectedTicket.status === 'open') {
      await supabase.from('support_tickets').update({ status: 'in_progress', updated_at: new Date().toISOString() }).eq('id', selectedTicket.id);
      setSelectedTicket({ ...selectedTicket, status: 'in_progress' });
      fetchTickets();
    }
    setReplyText('');
    setSendingReply(false);
  };

  const handleUpdateStatus = async (status: 'open' | 'in_progress' | 'resolved') => {
    if (!selectedTicket) return;
    setUpdatingStatus(true);
    await supabase.from('support_tickets').update({ status, updated_at: new Date().toISOString() }).eq('id', selectedTicket.id);
    setSelectedTicket({ ...selectedTicket, status });
    fetchTickets();
    setUpdatingStatus(false);
  };

  const filtered = tickets.filter((t) => {
    const matchSearch = search === '' || t.subject.toLowerCase().includes(search.toLowerCase()) || (t.users as any)?.email?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const statCards = [
    { label: 'Total Tickets', value: stats.total, color: 'text-slate-300', bg: 'bg-slate-500/10', border: 'border-slate-500/20' },
    { label: 'Open', value: stats.open, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
    { label: 'In Progress', value: stats.in_progress, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    { label: 'Resolved', value: stats.resolved, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-white text-xl font-bold">Support Center</h2>
        <p className="text-slate-400 text-sm mt-1">Manage tickets, live chat, FAQs, and AI chatbot settings</p>
      </div>

      {/* Quick Nav */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#1e293b] border border-slate-700 rounded-xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-yellow-500/10 flex items-center justify-center flex-shrink-0">
            <TicketIcon className="w-5 h-5 text-yellow-400" />
          </div>
          <div>
            <div className="text-white font-bold text-lg">{stats.open}</div>
            <div className="text-slate-400 text-xs">Open Tickets</div>
          </div>
        </div>
        <Link href="/admin/support/live-chat" className="bg-[#1e293b] border border-slate-700 rounded-xl p-4 flex items-center gap-3 hover:border-[#22c55e]/40 transition-colors">
          <div className="w-9 h-9 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
            <ChatBubbleLeftRightIcon className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <div className="text-white font-semibold text-sm">Live Chat</div>
            <div className="text-slate-400 text-xs">Manage sessions</div>
          </div>
        </Link>
        <Link href="/admin/support/faq" className="bg-[#1e293b] border border-slate-700 rounded-xl p-4 flex items-center gap-3 hover:border-[#22c55e]/40 transition-colors">
          <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
            <QuestionMarkCircleIcon className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <div className="text-white font-semibold text-sm">FAQ Manager</div>
            <div className="text-slate-400 text-xs">Add / Edit / Delete</div>
          </div>
        </Link>
        <Link href="/admin/support/chatbot" className="bg-[#1e293b] border border-slate-700 rounded-xl p-4 flex items-center gap-3 hover:border-[#22c55e]/40 transition-colors">
          <div className="w-9 h-9 rounded-lg bg-cyan-500/10 flex items-center justify-center flex-shrink-0">
            <CpuChipIcon className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <div className="text-white font-semibold text-sm">AI Chatbot</div>
            <div className="text-slate-400 text-xs">Settings & config</div>
          </div>
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {statCards.map((s) => (
          <div key={s.label} className={`bg-[#1e293b] border ${s.border} rounded-xl p-4`}>
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-slate-400 text-xs mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Ticket Management */}
      <div className="bg-[#1e293b] border border-slate-700 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-700 flex flex-col sm:flex-row gap-3">
          <h3 className="text-white font-semibold text-sm flex items-center gap-2">
            <TicketIcon className="w-4 h-4 text-yellow-400" />
            Support Tickets
          </h3>
          <div className="flex gap-2 sm:ml-auto flex-wrap">
            <div className="relative">
              <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search tickets..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-slate-800 border border-slate-600 rounded-lg pl-8 pr-3 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#22c55e]/50 w-48"
              />
            </div>
            <div className="flex items-center gap-1">
              <FunnelIcon className="w-4 h-4 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-800 border border-slate-600 rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:border-[#22c55e]/50"
              >
                <option value="all">All Status</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex h-[500px]">
          {/* Ticket List */}
          <div className={`${selectedTicket ? 'hidden sm:flex' : 'flex'} flex-col w-full sm:w-80 border-r border-slate-700 overflow-y-auto`}>
            {loading ? (
              <div className="flex items-center justify-center h-32 text-slate-400 text-sm">Loading tickets...</div>
            ) : filtered.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-slate-400 text-sm">No tickets found</div>
            ) : (
              filtered.map((ticket) => {
                const cfg = statusConfig[ticket.status];
                return (
                  <button
                    key={ticket.id}
                    onClick={() => setSelectedTicket(ticket)}
                    className={`text-left p-4 border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors ${selectedTicket?.id === ticket.id ? 'bg-slate-700/50 border-l-2 border-l-[#22c55e]' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="text-white text-sm font-medium truncate flex-1">{ticket.subject}</span>
                      <span className={`px-1.5 py-0.5 rounded text-xs border flex-shrink-0 ${cfg.color}`}>{cfg.label}</span>
                    </div>
                    <div className="text-slate-400 text-xs truncate">{(ticket.users as any)?.email || 'Unknown user'}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-1.5 py-0.5 rounded text-xs ${categoryColors[ticket.category] || 'bg-slate-500/10 text-slate-400'}`}>{ticket.category}</span>
                      <span className="text-slate-500 text-xs">{new Date(ticket.created_at).toLocaleDateString()}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Ticket Detail */}
          {selectedTicket ? (
            <div className="flex-1 flex flex-col min-w-0">
              {/* Ticket Header */}
              <div className="p-4 border-b border-slate-700 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-white font-semibold text-sm truncate">{selectedTicket.subject}</h4>
                    <span className={`px-2 py-0.5 rounded-full text-xs border ${statusConfig[selectedTicket.status].color}`}>
                      {statusConfig[selectedTicket.status].label}
                    </span>
                  </div>
                  <div className="text-slate-400 text-xs mt-0.5">{(selectedTicket.users as any)?.email} · {selectedTicket.category} · {new Date(selectedTicket.created_at).toLocaleString()}</div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <select
                    value={selectedTicket.status}
                    onChange={(e) => handleUpdateStatus(e.target.value as any)}
                    disabled={updatingStatus}
                    className="bg-slate-800 border border-slate-600 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-[#22c55e]/50 disabled:opacity-50"
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                  </select>
                  <button onClick={() => setSelectedTicket(null)} className="text-slate-400 hover:text-white sm:hidden">
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {replies.length === 0 ? (
                  <div className="text-slate-500 text-sm text-center py-8">No messages yet. Send the first reply.</div>
                ) : (
                  replies.map((reply) => (
                    <div key={reply.id} className={`flex ${reply.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] rounded-xl px-4 py-2.5 ${reply.sender_type === 'admin' ? 'bg-[#22c55e]/10 border border-[#22c55e]/20' : 'bg-slate-700/50 border border-slate-600/50'}`}>
                        <div className={`text-xs font-medium mb-1 ${reply.sender_type === 'admin' ? 'text-[#22c55e]' : 'text-slate-400'}`}>
                          {reply.sender_type === 'admin' ? 'Admin' : 'User'}
                        </div>
                        <div className="text-white text-sm whitespace-pre-wrap">{reply.message}</div>
                        <div className="text-slate-500 text-xs mt-1">{new Date(reply.created_at).toLocaleTimeString()}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Reply Input */}
              <div className="p-4 border-t border-slate-700">
                <div className="flex gap-2">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendReply(); } }}
                    placeholder="Type your reply... (Enter to send, Shift+Enter for new line)"
                    rows={2}
                    className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#22c55e]/50 resize-none"
                  />
                  <button
                    onClick={handleSendReply}
                    disabled={sendingReply || !replyText.trim()}
                    className="bg-[#22c55e] hover:bg-[#16a34a] disabled:opacity-50 disabled:cursor-not-allowed text-black font-semibold px-4 rounded-lg transition-colors flex items-center gap-1.5 text-sm"
                  >
                    <PaperAirplaneIcon className="w-4 h-4" />
                    {sendingReply ? 'Sending...' : 'Send'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="hidden sm:flex flex-1 items-center justify-center text-slate-500 text-sm">
              Select a ticket to view and reply
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
