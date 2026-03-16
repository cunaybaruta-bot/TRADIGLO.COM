'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { CheckCircleIcon, XCircleIcon, EyeIcon, GiftIcon } from '@heroicons/react/24/outline';

interface Deposit {
  id: string;
  user_id: string;
  amount: number;
  amount_original: number | null;
  currency_original: string | null;
  amount_usd: number | null;
  payment_method: string | null;
  payment_method_id: string | null;
  payment_reference: string | null;
  proof_image: string | null;
  proof_url: string | null;
  status: string;
  created_at: string;
  bonus_percent?: number | null;
  bonus_amount?: number | null;
  final_amount?: number | null;
  is_first_deposit?: boolean | null;
  users?: { email: string };
}

interface BonusSetting {
  id: string;
  bonus_percent: number;
  is_active: boolean;
  min_deposit: number;
  max_bonus: number;
}

const StatusBadge = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    approved: 'bg-green-500/10 text-green-400 border-green-500/20',
    rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
    completed: 'bg-green-500/10 text-green-400 border-green-500/20',
    failed: 'bg-red-500/10 text-red-400 border-red-500/20',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border capitalize ${colors[status] || 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
      {status}
    </span>
  );
};

function ProofModal({ src, onClose }: { src: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/90" onClick={onClose}>
      <div className="relative max-w-2xl max-h-[90vh] mx-4" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute -top-10 right-0 text-white/60 hover:text-white text-sm">
          ✕ Close
        </button>
        <img src={src} alt="Payment proof" className="max-w-full max-h-[85vh] rounded-xl object-contain" />
      </div>
    </div>
  );
}

function ApproveModal({
  deposit,
  isFirstDeposit,
  bonusSetting,
  onConfirm,
  onClose,
}: {
  deposit: Deposit;
  isFirstDeposit: boolean;
  bonusSetting: BonusSetting | null;
  onConfirm: (adjustedUsd: number, bonusPercent: number, bonusAmount: number, finalAmount: number, isFirst: boolean) => void;
  onClose: () => void;
}) {
  const baseUsd = deposit.amount_usd ?? deposit.amount ?? 0;
  const defaultBonusPct = (isFirstDeposit && bonusSetting?.is_active) ? bonusSetting.bonus_percent : 0;

  const [adjustedUsd, setAdjustedUsd] = useState(String(baseUsd.toFixed(2)));
  const [bonusPct, setBonusPct] = useState(String(defaultBonusPct));
  const [loading, setLoading] = useState(false);

  const amountNum = parseFloat(adjustedUsd) || 0;
  const bonusPctNum = parseFloat(bonusPct) || 0;
  const rawBonus = (amountNum * bonusPctNum) / 100;
  const maxBonus = bonusSetting?.max_bonus ?? 10000;
  const bonusAmt = Math.min(rawBonus, maxBonus);
  const finalAmt = amountNum + bonusAmt;

  const handleConfirm = async () => {
    if (isNaN(amountNum) || amountNum <= 0) return;
    setLoading(true);
    await onConfirm(amountNum, bonusPctNum, bonusAmt, finalAmt, isFirstDeposit && bonusPctNum > 0);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[99998] flex items-center justify-center bg-black/80" onClick={onClose}>
      <div className="bg-[#1e293b] border border-slate-700 rounded-2xl p-6 w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-1">
          <h3 className="text-white font-bold text-lg">Approve Deposit</h3>
          {isFirstDeposit && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-400 border border-yellow-500/25 text-xs font-bold">
              <GiftIcon className="w-3 h-3" /> First Deposit
            </span>
          )}
        </div>
        <p className="text-slate-400 text-sm mb-5">
          {isFirstDeposit && bonusSetting?.is_active
            ? 'Welcome bonus eligible! Adjust bonus % before approving.'
            : 'Adjust the USD amount to credit to user wallet.'}
        </p>

        <div className="bg-slate-800 rounded-xl p-4 mb-5 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-400">User</span>
            <span className="text-white text-xs">{(deposit.users as any)?.email || deposit.user_id.slice(0, 12) + '...'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Original Amount</span>
            <span className="text-white">{deposit.amount_original ?? deposit.amount} {deposit.currency_original || 'USD'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Estimated USD</span>
            <span className="text-emerald-400">${(deposit.amount_usd ?? deposit.amount ?? 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Reference</span>
            <span className="text-slate-300 font-mono text-xs">{deposit.payment_reference || '—'}</span>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">USD Amount to Credit</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
            <input
              type="number"
              value={adjustedUsd}
              onChange={(e) => setAdjustedUsd(e.target.value)}
              className="w-full bg-slate-900 border border-slate-600 rounded-xl pl-7 pr-4 py-3 text-white text-lg font-bold focus:outline-none focus:border-emerald-500/60 transition-colors"
              placeholder="0.00" step="0.01" min="0"
            />
          </div>
        </div>

        {/* Bonus section — always visible for first deposit */}
        {isFirstDeposit && (
          <div className="mb-5">
            <label className="block text-xs font-semibold text-yellow-400 mb-2 uppercase tracking-wider">
              🎁 Welcome Bonus %
            </label>
            <div className="relative">
              <input
                type="number"
                value={bonusPct}
                onChange={(e) => setBonusPct(e.target.value)}
                className="w-full bg-slate-900 border border-yellow-500/40 rounded-xl pl-4 pr-8 py-3 text-yellow-400 text-lg font-bold focus:outline-none focus:border-yellow-500/70 transition-colors"
                placeholder="0" step="1" min="0" max="1000"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
            </div>

            {/* Breakdown */}
            {amountNum > 0 && bonusPctNum > 0 && (
              <div className="mt-3 bg-yellow-500/8 border border-yellow-500/20 rounded-xl p-3 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Deposit Amount</span>
                  <span className="text-white font-semibold">${amountNum.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-yellow-400">Bonus ({bonusPctNum}%)</span>
                  <span className="text-yellow-400 font-semibold">+${bonusAmt.toFixed(2)}</span>
                </div>
                {bonusAmt < rawBonus && (
                  <div className="text-slate-500 text-[10px]">* Capped at max ${maxBonus.toLocaleString()}</div>
                )}
                <div className="border-t border-slate-700 pt-1.5 flex justify-between">
                  <span className="text-slate-300 font-semibold">Total Credited</span>
                  <span className="text-emerald-400 font-bold text-sm">${finalAmt.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-slate-700 text-slate-300 text-sm font-semibold hover:bg-slate-600 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-green-600 hover:bg-green-500 text-white text-sm font-bold transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
            Approve & Credit
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DepositsPage() {
  const searchParams = useSearchParams();
  const urlStatus = searchParams.get('status');

  const getInitialFilter = (): 'all' | 'pending' | 'approved' | 'rejected' => {
    if (urlStatus === 'pending') return 'pending';
    if (urlStatus === 'approved' || urlStatus === 'completed') return 'approved';
    if (urlStatus === 'rejected' || urlStatus === 'failed') return 'rejected';
    return 'all';
  };

  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>(getInitialFilter);
  const [message, setMessage] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);
  const [proofSrc, setProofSrc] = useState<string | null>(null);
  const [approveDeposit, setApproveDeposit] = useState<Deposit | null>(null);
  const [firstDepositMap, setFirstDepositMap] = useState<Record<string, boolean>>({});
  const [bonusSetting, setBonusSetting] = useState<BonusSetting | null>(null);
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null);

  useEffect(() => {
    setFilter(getInitialFilter());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlStatus]);

  // Fetch bonus settings once
  useEffect(() => {
    const fetchBonus = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('bonus_settings')
        .select('*')
        .eq('is_active', true)
        .eq('applies_to', 'first_deposit')
        .maybeSingle();
      if (data) setBonusSetting(data as BonusSetting);
    };
    fetchBonus();
  }, []);

  const fetchDeposits = useCallback(async () => {
    const supabase = createClient();
    let query = supabase
      .from('deposits')
      .select('id, user_id, amount, amount_original, currency_original, amount_usd, payment_method, payment_method_id, payment_reference, proof_image, proof_url, status, created_at, bonus_percent, bonus_amount, final_amount, is_first_deposit, users(email)')
      .order('created_at', { ascending: false });

    if (filter === 'approved') {
      query = query.in('status', ['approved', 'completed']);
    } else if (filter === 'rejected') {
      query = query.in('status', ['rejected', 'failed']);
    } else if (filter !== 'all') {
      query = query.eq('status', filter);
    }

    const { data } = await query;
    const deps = (data as Deposit[]) || [];
    setDeposits(deps);
    setLoading(false);

    // Check first deposit status for pending deposits
    const pendingDeps = deps.filter((d) => d.status === 'pending');
    if (pendingDeps.length > 0) {
      const map: Record<string, boolean> = {};
      await Promise.all(
        pendingDeps.map(async (d) => {
          const { data: isFirst } = await supabase.rpc('is_first_deposit', { p_user_id: d.user_id });
          map[d.id] = !!isFirst;
        })
      );
      setFirstDepositMap(map);
    }
  }, [filter]);

  useEffect(() => {
    fetchDeposits();
  }, [fetchDeposits]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel('admin_deposits_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deposits' }, () => {
        fetchDeposits();
      })
      .subscribe();
    channelRef.current = channel;
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [fetchDeposits]);

  const handleApprove = async (
    deposit: Deposit,
    adjustedUsd: number,
    bonusPercent: number,
    bonusAmount: number,
    finalAmount: number,
    isFirst: boolean
  ) => {
    setProcessing(deposit.id);
    const supabase = createClient();

    const creditAmount = bonusAmount > 0 ? finalAmount : adjustedUsd;

    // Update deposit with bonus info
    await supabase
      .from('deposits')
      .update({
        status: 'approved',
        amount_usd: adjustedUsd,
        bonus_percent: bonusPercent,
        bonus_amount: bonusAmount,
        final_amount: creditAmount,
        is_first_deposit: isFirst,
      })
      .eq('id', deposit.id);

    // Credit real wallet
    const { data: wallet } = await supabase
      .from('wallets')
      .select('id, balance')
      .eq('user_id', deposit.user_id)
      .eq('is_demo', false)
      .single();

    if (wallet) {
      await supabase
        .from('wallets')
        .update({ balance: (Number(wallet.balance) || 0) + creditAmount })
        .eq('id', wallet.id);
    }

    const bonusMsg = bonusAmount > 0 ? ` (includes $${bonusAmount.toFixed(2)} welcome bonus)` : '';
    setMessage(`✅ Deposit approved. $${creditAmount.toFixed(2)} credited to user wallet${bonusMsg}.`);
    setApproveDeposit(null);
    setProcessing(null);
    fetchDeposits();
    setTimeout(() => setMessage(''), 6000);
  };

  const handleReject = async (id: string) => {
    setProcessing(id);
    const supabase = createClient();
    await supabase.from('deposits').update({ status: 'rejected' }).eq('id', id);
    setMessage('❌ Deposit rejected.');
    setProcessing(null);
    fetchDeposits();
    setTimeout(() => setMessage(''), 3000);
  };

  const pendingCount = deposits.filter((d) => d.status === 'pending').length;

  return (
    <>
      {proofSrc && <ProofModal src={proofSrc} onClose={() => setProofSrc(null)} />}
      {approveDeposit && (
        <ApproveModal
          deposit={approveDeposit}
          isFirstDeposit={!!firstDepositMap[approveDeposit.id]}
          bonusSetting={bonusSetting}
          onConfirm={(usd, bp, ba, fa, isFirst) => handleApprove(approveDeposit, usd, bp, ba, fa, isFirst)}
          onClose={() => setApproveDeposit(null)}
        />
      )}

      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-white text-xl font-bold flex items-center gap-3">
              Deposits
              {pendingCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-400 border border-yellow-500/25 text-xs font-bold">
                  {pendingCount} pending
                </span>
              )}
            </h2>
            <p className="text-slate-400 text-sm mt-1">{deposits.length} records</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${filter === f ? 'bg-[#22c55e] text-black' : 'bg-[#1e293b] text-slate-400 border border-slate-700 hover:text-white'}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {message && (
          <div className="bg-slate-800 border border-slate-700 text-slate-200 text-sm px-4 py-3 rounded-xl">
            {message}
          </div>
        )}

        <div className="bg-[#1e293b] rounded-xl border border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left text-slate-400 text-xs font-medium px-4 py-3">Reference</th>
                  <th className="text-left text-slate-400 text-xs font-medium px-4 py-3">User</th>
                  <th className="text-left text-slate-400 text-xs font-medium px-4 py-3">Method</th>
                  <th className="text-left text-slate-400 text-xs font-medium px-4 py-3">Original</th>
                  <th className="text-left text-slate-400 text-xs font-medium px-4 py-3">Est. USD</th>
                  <th className="text-left text-slate-400 text-xs font-medium px-4 py-3">Bonus</th>
                  <th className="text-left text-slate-400 text-xs font-medium px-4 py-3">Proof</th>
                  <th className="text-left text-slate-400 text-xs font-medium px-4 py-3">Status</th>
                  <th className="text-left text-slate-400 text-xs font-medium px-4 py-3">Date</th>
                  <th className="text-left text-slate-400 text-xs font-medium px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {loading && (
                  <tr><td colSpan={10} className="text-center text-slate-500 text-sm py-10">Loading...</td></tr>
                )}
                {!loading && deposits.length === 0 && (
                  <tr><td colSpan={10} className="text-center text-slate-500 text-sm py-10">No deposits found</td></tr>
                )}
                {deposits.map((d) => {
                  const proofSrcVal = d.proof_image || d.proof_url || null;
                  const isFirst = firstDepositMap[d.id];
                  return (
                    <tr key={d.id} className="hover:bg-slate-700/20 transition-colors">
                      <td className="px-4 py-3 text-slate-400 text-xs font-mono">{d.payment_reference || d.id.slice(0, 8) + '...'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-white text-sm">{(d.users as any)?.email || d.user_id.slice(0, 12) + '...'}</span>
                          {(d.is_first_deposit || (d.status === 'pending' && isFirst)) && (
                            <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-yellow-500/15 text-yellow-400 border border-yellow-500/25 text-[10px] font-bold whitespace-nowrap">
                              <GiftIcon className="w-2.5 h-2.5" /> 1st
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-300 text-sm">{d.payment_method || '—'}</td>
                      <td className="px-4 py-3 text-white text-sm font-semibold">
                        {d.amount_original != null
                          ? `${Number(d.amount_original).toLocaleString()} ${d.currency_original || ''}`
                          : `$${Number(d.amount).toFixed(2)}`}
                      </td>
                      <td className="px-4 py-3 text-emerald-400 text-sm font-semibold">
                        ${Number(d.amount_usd ?? d.amount ?? 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        {d.bonus_amount && Number(d.bonus_amount) > 0 ? (
                          <span className="text-yellow-400 text-xs font-semibold">+${Number(d.bonus_amount).toFixed(2)}</span>
                        ) : (
                          <span className="text-slate-600 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {proofSrcVal ? (
                          <button
                            onClick={() => setProofSrc(proofSrcVal)}
                            className="w-10 h-8 rounded-lg overflow-hidden border border-slate-600 hover:border-emerald-500/50 transition-colors flex items-center justify-center bg-slate-800"
                            title="View proof"
                          >
                            {proofSrcVal.startsWith('data:image') || proofSrcVal.match(/\.(jpg|jpeg|png|gif|webp)/i) ? (
                              <img src={proofSrcVal} alt="Proof thumbnail" className="w-full h-full object-cover" />
                            ) : (
                              <EyeIcon className="w-4 h-4 text-slate-400" />
                            )}
                          </button>
                        ) : (
                          <span className="text-slate-600 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={d.status} /></td>
                      <td className="px-4 py-3 text-slate-400 text-xs">{new Date(d.created_at).toLocaleString()}</td>
                      <td className="px-4 py-3">
                        {d.status === 'pending' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => setApproveDeposit(d)}
                              disabled={processing === d.id}
                              className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 transition-colors disabled:opacity-50"
                            >
                              <CheckCircleIcon className="w-3.5 h-3.5" /> Approve
                            </button>
                            <button
                              onClick={() => handleReject(d.id)}
                              disabled={processing === d.id}
                              className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                            >
                              <XCircleIcon className="w-3.5 h-3.5" /> Reject
                            </button>
                          </div>
                        )}
                        {d.status !== 'pending' && <span className="text-slate-600 text-xs">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
