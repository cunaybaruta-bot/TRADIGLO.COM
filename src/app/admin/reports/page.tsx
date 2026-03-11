'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { CalendarIcon, DocumentChartBarIcon, ArrowDownTrayIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface DepositReportData {
  totalDeposits: number;
  pendingDeposits: number;
  completedDeposits: number;
  failedDeposits: number;
  totalAmount: number;
  pendingAmount: number;
  completedAmount: number;
}

interface WithdrawalReportData {
  totalWithdrawals: number;
  pendingWithdrawals: number;
  approvedWithdrawals: number;
  rejectedWithdrawals: number;
  totalAmount: number;
  pendingAmount: number;
  approvedAmount: number;
}

interface MonthlyData {
  month: string;
  deposits: number;
  withdrawals: number;
  profit: number;
}

export default function ReportsPage() {
  const [depositData, setDepositData] = useState<DepositReportData>({ totalDeposits: 0, pendingDeposits: 0, completedDeposits: 0, failedDeposits: 0, totalAmount: 0, pendingAmount: 0, completedAmount: 0 });
  const [withdrawalData, setWithdrawalData] = useState<WithdrawalReportData>({ totalWithdrawals: 0, pendingWithdrawals: 0, approvedWithdrawals: 0, rejectedWithdrawals: 0, totalAmount: 0, pendingAmount: 0, approvedAmount: 0 });
  const [platformProfit, setPlatformProfit] = useState(0);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [winTrades, setWinTrades] = useState(0);
  const [totalTrades, setTotalTrades] = useState(0);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();

    let depositsQ = supabase.from('deposits').select('amount, status');
    let withdrawalsQ = supabase.from('withdrawals').select('amount, status');
    let tradesQ = supabase.from('trades').select('profit, result, status');

    if (dateFrom) {
      depositsQ = depositsQ.gte('created_at', dateFrom);
      withdrawalsQ = withdrawalsQ.gte('created_at', dateFrom);
      tradesQ = tradesQ.gte('opened_at', dateFrom);
    }
    if (dateTo) {
      const end = new Date(dateTo); end.setHours(23, 59, 59);
      depositsQ = depositsQ.lte('created_at', end.toISOString());
      withdrawalsQ = withdrawalsQ.lte('created_at', end.toISOString());
      tradesQ = tradesQ.lte('opened_at', end.toISOString());
    }

    const [{ data: deps }, { data: withs }, { data: trades }] = await Promise.all([depositsQ, withdrawalsQ, tradesQ]);

    const depCompleted = deps?.filter((d) => d.status === 'completed') || [];
    const depPending = deps?.filter((d) => d.status === 'pending') || [];
    const depFailed = deps?.filter((d) => d.status === 'failed') || [];
    setDepositData({
      totalDeposits: deps?.length || 0,
      pendingDeposits: depPending.length,
      completedDeposits: depCompleted.length,
      failedDeposits: depFailed.length,
      totalAmount: deps?.reduce((s, d) => s + Number(d.amount), 0) || 0,
      pendingAmount: depPending.reduce((s, d) => s + Number(d.amount), 0),
      completedAmount: depCompleted.reduce((s, d) => s + Number(d.amount), 0),
    });

    const withApproved = withs?.filter((w) => w.status === 'approved') || [];
    const withPending = withs?.filter((w) => w.status === 'pending') || [];
    const withRejected = withs?.filter((w) => w.status === 'rejected') || [];
    setWithdrawalData({
      totalWithdrawals: withs?.length || 0,
      pendingWithdrawals: withPending.length,
      approvedWithdrawals: withApproved.length,
      rejectedWithdrawals: withRejected.length,
      totalAmount: withs?.reduce((s, w) => s + Number(w.amount), 0) || 0,
      pendingAmount: withPending.reduce((s, w) => s + Number(w.amount), 0),
      approvedAmount: withApproved.reduce((s, w) => s + Number(w.amount), 0),
    });

    const wins = trades?.filter((t) => t.result === 'win') || [];
    const profit = wins.reduce((s, t) => s + Number(t.profit || 0), 0);
    setPlatformProfit(profit);
    setWinTrades(wins.length);
    setTotalTrades(trades?.length || 0);

    // Monthly data (last 6 months)
    const months: MonthlyData[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const label = d.toLocaleString('default', { month: 'short' });
      const start = new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59).toISOString();
      const [{ data: mDep }, { data: mWith }, { data: mTrades }] = await Promise.all([
        supabase.from('deposits').select('amount').gte('created_at', start).lte('created_at', end),
        supabase.from('withdrawals').select('amount').gte('created_at', start).lte('created_at', end),
        supabase.from('trades').select('profit').eq('result', 'win').gte('opened_at', start).lte('opened_at', end),
      ]);
      months.push({
        month: label,
        deposits: mDep?.reduce((s, d) => s + Number(d.amount), 0) || 0,
        withdrawals: mWith?.reduce((s, w) => s + Number(w.amount), 0) || 0,
        profit: mTrades?.reduce((s, t) => s + Number(t.profit || 0), 0) || 0,
      });
    }
    setMonthlyData(months);
    setLoading(false);
  }, [dateFrom, dateTo]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  const winRate = totalTrades > 0 ? ((winTrades / totalTrades) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-white text-xl font-bold">Reports & Analytics</h2>
        <p className="text-slate-400 text-sm mt-1">Investoft Platform Analytics</p>
      </div>

      {/* Date Filter */}
      <div className="bg-[#1e293b] rounded-xl border border-slate-700 p-5">
        <div className="flex items-center gap-2 mb-3">
          <CalendarIcon className="w-4 h-4 text-slate-400" />
          <span className="text-white text-sm font-medium">Filter by Date Range</span>
        </div>
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="text-slate-400 text-xs mb-1 block">From</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
              className="bg-[#0f172a] border border-slate-600 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-[#22c55e]" />
          </div>
          <div>
            <label className="text-slate-400 text-xs mb-1 block">To</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
              className="bg-[#0f172a] border border-slate-600 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-[#22c55e]" />
          </div>
          <button onClick={() => { setDateFrom(''); setDateTo(''); }}
            className="px-4 py-2 bg-slate-700 text-slate-300 text-sm rounded-lg hover:bg-slate-600 transition-colors">Clear</button>
        </div>
      </div>

      {loading ? (
        <div className="text-slate-400 text-sm">Loading report...</div>
      ) : (
        <>
          {/* Platform Profit */}
          <div className="bg-[#1e293b] rounded-xl p-5 border border-emerald-400/20">
            <div className="flex items-center gap-2 mb-2">
              <DocumentChartBarIcon className="w-5 h-5 text-emerald-400" />
              <span className="text-slate-400 text-sm">Platform Profit (from winning trades)</span>
            </div>
            <div className="text-emerald-400 text-3xl font-bold">${platformProfit.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <div className="text-slate-500 text-xs mt-1">Win Rate: {winRate}% ({winTrades}/{totalTrades} trades)</div>
          </div>

          {/* Deposit & Withdrawal Stats */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="bg-[#1e293b] rounded-xl border border-slate-700 overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-700">
                <ArrowDownTrayIcon className="w-4 h-4 text-green-400" />
                <h3 className="text-white font-semibold text-sm">Deposit Report</h3>
              </div>
              <div className="divide-y divide-slate-700/50">
                {[
                  { label: 'Total Deposits', value: depositData.totalDeposits, color: 'text-white' },
                  { label: 'Completed', value: depositData.completedDeposits, color: 'text-green-400' },
                  { label: 'Pending', value: depositData.pendingDeposits, color: 'text-yellow-400' },
                  { label: 'Failed', value: depositData.failedDeposits, color: 'text-red-400' },
                  { label: 'Total Amount', value: `$${depositData.totalAmount.toFixed(2)}`, color: 'text-white' },
                  { label: 'Completed Amount', value: `$${depositData.completedAmount.toFixed(2)}`, color: 'text-green-400' },
                  { label: 'Pending Amount', value: `$${depositData.pendingAmount.toFixed(2)}`, color: 'text-yellow-400' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex items-center justify-between px-5 py-2.5">
                    <span className="text-slate-400 text-sm">{label}</span>
                    <span className={`text-sm font-semibold ${color}`}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#1e293b] rounded-xl border border-slate-700 overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-700">
                <ArrowUpTrayIcon className="w-4 h-4 text-orange-400" />
                <h3 className="text-white font-semibold text-sm">Withdrawal Report</h3>
              </div>
              <div className="divide-y divide-slate-700/50">
                {[
                  { label: 'Total Withdrawals', value: withdrawalData.totalWithdrawals, color: 'text-white' },
                  { label: 'Approved', value: withdrawalData.approvedWithdrawals, color: 'text-green-400' },
                  { label: 'Pending', value: withdrawalData.pendingWithdrawals, color: 'text-yellow-400' },
                  { label: 'Rejected', value: withdrawalData.rejectedWithdrawals, color: 'text-red-400' },
                  { label: 'Total Amount', value: `$${withdrawalData.totalAmount.toFixed(2)}`, color: 'text-white' },
                  { label: 'Approved Amount', value: `$${withdrawalData.approvedAmount.toFixed(2)}`, color: 'text-green-400' },
                  { label: 'Pending Amount', value: `$${withdrawalData.pendingAmount.toFixed(2)}`, color: 'text-yellow-400' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex items-center justify-between px-5 py-2.5">
                    <span className="text-slate-400 text-sm">{label}</span>
                    <span className={`text-sm font-semibold ${color}`}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Monthly Chart */}
          <div className="bg-[#1e293b] rounded-xl p-5 border border-slate-700">
            <h3 className="text-white font-semibold mb-4 text-sm">Monthly Overview (Last 6 Months)</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={monthlyData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }} labelStyle={{ color: '#e2e8f0' }} formatter={(value: number) => [`$${value.toFixed(2)}`, '']} />
                <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
                <Bar dataKey="deposits" name="Deposits" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="withdrawals" name="Withdrawals" fill="#f97316" radius={[4, 4, 0, 0]} />
                <Bar dataKey="profit" name="Profit" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}
