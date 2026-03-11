'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { CommandLineIcon, ShieldCheckIcon, BellAlertIcon, WalletIcon } from '@heroicons/react/24/outline';

interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  amount?: number;
  status: string;
  created_at: string;
  type: 'trade' | 'deposit' | 'withdrawal';
  users?: { email: string };
}

export default function ControlCenterPage() {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingDeposits, setPendingDeposits] = useState(0);
  const [pendingWithdrawals, setPendingWithdrawals] = useState(0);
  const [openTrades, setOpenTrades] = useState(0);

  const fetchData = useCallback(async () => {
    const supabase = createClient();
    const [
      { data: trades },
      { data: deposits },
      { data: withdrawals },
      { count: pendDep },
      { count: pendWith },
      { count: openTrd },
    ] = await Promise.all([
      supabase.from('trades').select('id, user_id, amount, status, opened_at, users(email)').order('opened_at', { ascending: false }).limit(10),
      supabase.from('deposits').select('id, user_id, amount, status, created_at, users(email)').order('created_at', { ascending: false }).limit(10),
      supabase.from('withdrawals').select('id, user_id, amount, status, created_at, users(email)').order('created_at', { ascending: false }).limit(10),
      supabase.from('deposits').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('withdrawals').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('trades').select('*', { count: 'exact', head: true }).eq('status', 'open'),
    ]);

    const combined: ActivityLog[] = [
      ...(trades || []).map((t: any) => ({ ...t, action: `Trade ${t.status}`, type: 'trade' as const, created_at: t.opened_at })),
      ...(deposits || []).map((d: any) => ({ ...d, action: `Deposit ${d.status}`, type: 'deposit' as const })),
      ...(withdrawals || []).map((w: any) => ({ ...w, action: `Withdrawal ${w.status}`, type: 'withdrawal' as const })),
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 20);

    setActivities(combined);
    setPendingDeposits(pendDep || 0);
    setPendingWithdrawals(pendWith || 0);
    setOpenTrades(openTrd || 0);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const typeColors: Record<string, string> = {
    trade: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    deposit: 'bg-green-500/10 text-green-400 border-green-500/20',
    withdrawal: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-white text-xl font-bold">Control Center</h2>
        <p className="text-slate-400 text-sm mt-1">Platform activity monitor and control</p>
      </div>

      {/* Alert Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className={`bg-[#1e293b] rounded-xl p-5 border ${pendingDeposits > 0 ? 'border-yellow-400/30' : 'border-slate-700'}`}>
          <div className="flex items-center gap-2 mb-2">
            <BellAlertIcon className={`w-5 h-5 ${pendingDeposits > 0 ? 'text-yellow-400' : 'text-slate-400'}`} />
            <span className="text-slate-400 text-xs">Pending Deposits</span>
          </div>
          <div className={`text-2xl font-bold ${pendingDeposits > 0 ? 'text-yellow-400' : 'text-white'}`}>{pendingDeposits}</div>
          {pendingDeposits > 0 && <a href="/admin/deposits" className="text-yellow-400 text-xs hover:underline mt-1 block">Review now →</a>}
        </div>
        <div className={`bg-[#1e293b] rounded-xl p-5 border ${pendingWithdrawals > 0 ? 'border-orange-400/30' : 'border-slate-700'}`}>
          <div className="flex items-center gap-2 mb-2">
            <WalletIcon className={`w-5 h-5 ${pendingWithdrawals > 0 ? 'text-orange-400' : 'text-slate-400'}`} />
            <span className="text-slate-400 text-xs">Pending Withdrawals</span>
          </div>
          <div className={`text-2xl font-bold ${pendingWithdrawals > 0 ? 'text-orange-400' : 'text-white'}`}>{pendingWithdrawals}</div>
          {pendingWithdrawals > 0 && <a href="/admin/withdrawals" className="text-orange-400 text-xs hover:underline mt-1 block">Review now →</a>}
        </div>
        <div className="bg-[#1e293b] rounded-xl p-5 border border-slate-700">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheckIcon className="w-5 h-5 text-blue-400" />
            <span className="text-slate-400 text-xs">Open Trades</span>
          </div>
          <div className="text-blue-400 text-2xl font-bold">{openTrades}</div>
          <a href="/admin/trades" className="text-blue-400 text-xs hover:underline mt-1 block">Monitor trades →</a>
        </div>
      </div>

      {/* Activity Feed */}
      <div className="bg-[#1e293b] rounded-xl border border-slate-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-700 flex items-center gap-2">
          <CommandLineIcon className="w-4 h-4 text-[#22c55e]" />
          <h3 className="text-white font-semibold">Live Activity Feed</h3>
        </div>
        <div className="divide-y divide-slate-700/50">
          {loading && <div className="px-5 py-8 text-center text-slate-500 text-sm">Loading activity...</div>}
          {!loading && activities.length === 0 && <div className="px-5 py-8 text-center text-slate-500 text-sm">No activity yet</div>}
          {activities.map((a) => (
            <div key={`${a.type}-${a.id}`} className="px-5 py-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium border flex-shrink-0 ${typeColors[a.type]}`}>
                  {a.type.toUpperCase()}
                </span>
                <div className="min-w-0">
                  <div className="text-white text-xs font-medium truncate">{(a.users as any)?.email || a.user_id.slice(0, 12)}</div>
                  <div className="text-slate-400 text-xs">{a.action}</div>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                {a.amount && <div className="text-white text-xs font-semibold">${Number(a.amount).toFixed(2)}</div>}
                <div className="text-slate-500 text-xs">{new Date(a.created_at).toLocaleString()}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
