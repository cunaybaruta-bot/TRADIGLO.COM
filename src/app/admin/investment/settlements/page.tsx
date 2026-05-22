'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ArrowPathIcon, CheckCircleIcon, ClockIcon, BanknotesIcon } from '@heroicons/react/24/outline';

type Tier = 'basic' | 'silver' | 'gold' | 'diamond';

interface SettlementRecord {
  id: string;
  user_id: string;
  tier: Tier;
  capital_usd: number;
  duration: string;
  gross_profit_usd: number;
  platform_fee_usd: number;
  net_profit_usd: number;
  status: string;
  started_at: string;
  expires_at: string;
  completed_at: string | null;
  user_email?: string;
}

const TIER_COLORS: Record<Tier, string> = {
  basic: '#10b981',
  silver: '#cbd5e1',
  gold: '#f59e0b',
  diamond: '#38bdf8',
};

const TIER_LABELS: Record<Tier, string> = {
  basic: 'Basic',
  silver: 'Silver',
  gold: 'Gold',
  diamond: 'Diamond',
};

function fmt(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function AdminInvestmentSettlementsPage() {
  const [records, setRecords] = useState<SettlementRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [settling, setSettling] = useState(false);
  const [settleResult, setSettleResult] = useState<string | null>(null);
  const [tab, setTab] = useState<'pending' | 'completed'>('pending');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadRecords = useCallback(async () => {
    const supabase = createClient();
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('investment_packages')
        .select('*')
        .in('status', ['active', 'completed', 'pending_payout'])
        .order('expires_at', { ascending: true });

      if (error) throw error;
      const rows = data || [];

      const userIds = [...new Set(rows.map(r => r.user_id))];
      let emailMap: Record<string, string> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('users')
          .select('id, email')
          .in('id', userIds);
        (profiles || []).forEach((p: { id: string; email: string }) => {
          emailMap[p.id] = p.email;
        });
      }

      setRecords(rows.map(r => ({ ...r, user_email: emailMap[r.user_id] || r.user_id.slice(0, 8) + '...' })));
    } catch (err) {
      console.error('Failed to load settlement records:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadRecords(); }, [loadRecords]);

  // Run the settle_expired_investment_packages() DB function
  const runBatchSettle = async () => {
    const supabase = createClient();
    setSettling(true);
    setSettleResult(null);
    try {
      const { data, error } = await supabase.rpc('settle_expired_investment_packages');
      if (error) throw error;
      const count = typeof data === 'number' ? data : 0;
      setSettleResult(`✓ Successfully settled ${count} expired package${count !== 1 ? 's' : ''}`);
      await loadRecords();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setSettleResult(`✗ Settlement failed: ${msg}`);
    } finally {
      setSettling(false);
    }
  };

  // Manually settle a single package
  const manualSettle = async (record: SettlementRecord) => {
    const supabase = createClient();
    setProcessingId(record.id);
    try {
      const fee = Math.round(Number(record.gross_profit_usd) * 0.20 * 100) / 100;
      const net = Math.round((Number(record.gross_profit_usd) - fee) * 100) / 100;

      // Update package status
      const { error: pkgError } = await supabase
        .from('investment_packages')
        .update({
          status: 'completed',
          platform_fee_usd: fee,
          net_profit_usd: net,
          completed_at: new Date().toISOString(),
        })
        .eq('id', record.id);

      if (pkgError) throw pkgError;

      // Credit wallet
      const { data: wallet } = await supabase
        .from('wallets')
        .select('id, balance')
        .eq('user_id', record.user_id)
        .eq('is_demo', false)
        .maybeSingle();

      if (wallet) {
        await supabase
          .from('wallets')
          .update({ balance: Number(wallet.balance) + Number(record.capital_usd) + net, updated_at: new Date().toISOString() })
          .eq('id', wallet.id);
      }

      await loadRecords();
    } catch (err) {
      console.error('Manual settle failed:', err);
    } finally {
      setProcessingId(null);
    }
  };

  const now = new Date();
  const pendingSettlement = records.filter(r => r.status === 'active' && new Date(r.expires_at) <= now);
  const activeNotExpired = records.filter(r => r.status === 'active' && new Date(r.expires_at) > now);
  const completed = records.filter(r => r.status === 'completed');

  const displayRecords = tab === 'pending' ? [...pendingSettlement, ...activeNotExpired] : completed;

  const totalPlatformFees = completed.reduce((s, r) => s + Number(r.platform_fee_usd), 0);
  const totalNetPaid = completed.reduce((s, r) => s + Number(r.net_profit_usd), 0);
  const pendingCount = pendingSettlement.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Profit & Settlements</h1>
          <p className="text-slate-400 text-sm mt-1">Manage investment payouts and settlement processing</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={loadRecords}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-slate-300 rounded-lg text-sm hover:bg-slate-600"
          >
            <ArrowPathIcon className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={runBatchSettle}
            disabled={settling}
            className="flex items-center gap-2 px-4 py-2 bg-[#22c55e] text-black font-semibold rounded-lg text-sm hover:bg-[#16a34a] disabled:opacity-60"
          >
            <CheckCircleIcon className="w-4 h-4" />
            {settling ? 'Processing...' : 'Run Batch Settlement'}
          </button>
        </div>
      </div>

      {/* Settlement Result Banner */}
      {settleResult && (
        <div className={`px-4 py-3 rounded-lg text-sm font-medium ${settleResult.startsWith('✓') ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
          {settleResult}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Pending Settlement', value: pendingCount.toString(), icon: ClockIcon, color: '#f59e0b', sub: 'Expired, awaiting payout' },
          { label: 'Active (Running)', value: activeNotExpired.length.toString(), icon: ArrowPathIcon, color: '#38bdf8', sub: 'Not yet expired' },
          { label: 'Total Net Paid', value: fmt(totalNetPaid), icon: BanknotesIcon, color: '#22c55e', sub: 'To members' },
          { label: 'Platform Fees', value: fmt(totalPlatformFees), icon: BanknotesIcon, color: '#a78bfa', sub: '20% of gross profit' },
        ].map(s => (
          <div key={s.label} className="bg-[#1e293b] border border-slate-700 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-xs">{s.label}</span>
              <s.icon className="w-4 h-4" style={{ color: s.color }} />
            </div>
            <div className="text-xl font-bold text-white">{s.value}</div>
            <div className="text-slate-500 text-xs mt-1">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Pending Alert */}
      {pendingCount > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ClockIcon className="w-5 h-5 text-yellow-400 flex-shrink-0" />
            <div>
              <p className="text-yellow-400 font-semibold text-sm">{pendingCount} package{pendingCount !== 1 ? 's' : ''} ready for settlement</p>
              <p className="text-yellow-400/70 text-xs">These packages have expired and are awaiting profit payout to members.</p>
            </div>
          </div>
          <button
            onClick={runBatchSettle}
            disabled={settling}
            className="px-4 py-2 bg-yellow-500 text-black font-semibold rounded-lg text-sm hover:bg-yellow-400 disabled:opacity-60 flex-shrink-0"
          >
            Settle All
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-[#1e293b] border border-slate-700 rounded-xl overflow-hidden">
        <div className="flex border-b border-slate-700">
          {[
            { key: 'pending', label: `Active & Pending (${pendingSettlement.length + activeNotExpired.length})` },
            { key: 'completed', label: `Completed (${completed.length})` },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as 'pending' | 'completed')}
              className={`px-5 py-3 text-sm font-medium transition-colors ${tab === t.key ? 'text-[#22c55e] border-b-2 border-[#22c55e]' : 'text-slate-400 hover:text-white'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Member</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Tier</th>
                <th className="text-right px-4 py-3 text-slate-400 font-medium">Capital</th>
                <th className="text-right px-4 py-3 text-slate-400 font-medium">Gross Profit</th>
                <th className="text-right px-4 py-3 text-slate-400 font-medium">Platform Fee</th>
                <th className="text-right px-4 py-3 text-slate-400 font-medium">Net Profit</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Status</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">{tab === 'pending' ? 'Expires' : 'Completed'}</th>
                {tab === 'pending' && <th className="text-left px-4 py-3 text-slate-400 font-medium">Action</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i} className="border-b border-slate-700/50">
                    {[...Array(tab === 'pending' ? 9 : 8)].map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-slate-700 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : displayRecords.length === 0 ? (
                <tr>
                  <td colSpan={tab === 'pending' ? 9 : 8} className="text-center py-10 text-slate-500">
                    No records found
                  </td>
                </tr>
              ) : (
                displayRecords.map(rec => {
                  const isExpired = rec.status === 'active' && new Date(rec.expires_at) <= now;
                  return (
                    <tr key={rec.id} className={`border-b border-slate-700/50 hover:bg-slate-700/20 ${isExpired ? 'bg-yellow-500/5' : ''}`}>
                      <td className="px-4 py-3">
                        <div className="text-white text-xs font-medium truncate max-w-[150px]">{rec.user_email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold capitalize" style={{ background: `${TIER_COLORS[rec.tier]}20`, color: TIER_COLORS[rec.tier] }}>
                          {TIER_LABELS[rec.tier]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-white">{fmt(rec.capital_usd)}</td>
                      <td className="px-4 py-3 text-right text-slate-300">{fmt(rec.gross_profit_usd)}</td>
                      <td className="px-4 py-3 text-right text-red-400">{fmt(rec.platform_fee_usd)}</td>
                      <td className="px-4 py-3 text-right text-[#22c55e] font-medium">{fmt(rec.net_profit_usd)}</td>
                      <td className="px-4 py-3">
                        {isExpired ? (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                            Expired
                          </span>
                        ) : rec.status === 'completed' ? (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            Completed
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">
                        {tab === 'pending' ? formatDate(rec.expires_at) : (rec.completed_at ? formatDate(rec.completed_at) : '—')}
                      </td>
                      {tab === 'pending' && (
                        <td className="px-4 py-3">
                          {isExpired && (
                            <button
                              onClick={() => manualSettle(rec)}
                              disabled={processingId === rec.id}
                              className="px-3 py-1.5 bg-[#22c55e]/20 text-[#22c55e] border border-[#22c55e]/30 rounded text-xs font-medium hover:bg-[#22c55e]/30 disabled:opacity-50"
                            >
                              {processingId === rec.id ? 'Processing...' : 'Settle'}
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
