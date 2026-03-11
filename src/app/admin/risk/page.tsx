'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ShieldExclamationIcon, ExclamationTriangleIcon, FireIcon } from '@heroicons/react/24/outline';
import Icon from '@/components/ui/AppIcon';


interface RiskAccount {
  user_id: string;
  email: string;
  total_trades: number;
  loss_count: number;
  win_count: number;
  total_loss_amount: number;
  risk_score: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export default function RiskManagementPage() {
  const [accounts, setAccounts] = useState<RiskAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ critical: 0, high: 0, medium: 0, low: 0 });

  const fetchData = useCallback(async () => {
    const supabase = createClient();
    const { data: trades } = await supabase
      .from('trades')
      .select('user_id, result, amount, profit')
      .not('result', 'is', null)
      .limit(2000);

    const { data: users } = await supabase.from('users').select('id, email');
    const userMap = new Map(users?.map((u) => [u.id, u.email]) || []);

    if (trades) {
      const traderMap = new Map<string, { wins: number; losses: number; totalLoss: number; totalTrades: number }>();
      trades.forEach((t) => {
        const existing = traderMap.get(t.user_id) || { wins: 0, losses: 0, totalLoss: 0, totalTrades: 0 };
        existing.totalTrades++;
        if (t.result === 'win') existing.wins++;
        else { existing.losses++; existing.totalLoss += Math.abs(Number(t.profit || t.amount || 0)); }
        traderMap.set(t.user_id, existing);
      });

      const riskList: RiskAccount[] = Array.from(traderMap.entries())
        .filter(([, d]) => d.totalTrades >= 3)
        .map(([userId, data]) => {
          const lossRate = data.totalTrades > 0 ? (data.losses / data.totalTrades) * 100 : 0;
          const riskScore = Math.min(100, Math.round(lossRate * 0.7 + (data.totalLoss / 100) * 0.3));
          const risk_level: RiskAccount['risk_level'] = riskScore >= 80 ? 'CRITICAL' : riskScore >= 60 ? 'HIGH' : riskScore >= 40 ? 'MEDIUM' : 'LOW';
          return {
            user_id: userId,
            email: userMap.get(userId) || userId.slice(0, 12) + '...',
            total_trades: data.totalTrades,
            loss_count: data.losses,
            win_count: data.wins,
            total_loss_amount: data.totalLoss,
            risk_score: riskScore,
            risk_level,
          };
        })
        .sort((a, b) => b.risk_score - a.risk_score);

      setAccounts(riskList);
      setStats({
        critical: riskList.filter((r) => r.risk_level === 'CRITICAL').length,
        high: riskList.filter((r) => r.risk_level === 'HIGH').length,
        medium: riskList.filter((r) => r.risk_level === 'MEDIUM').length,
        low: riskList.filter((r) => r.risk_level === 'LOW').length,
      });
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const riskColors: Record<string, string> = {
    CRITICAL: 'bg-red-500/10 text-red-400 border-red-500/20',
    HIGH: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    MEDIUM: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    LOW: 'bg-green-500/10 text-green-400 border-green-500/20',
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-white text-xl font-bold">Risk Management</h2>
        <p className="text-slate-400 text-sm mt-1">Monitor high-risk accounts and trade exposure</p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: 'Critical Risk', value: stats.critical, color: 'text-red-400', bg: 'bg-red-400/10', icon: FireIcon },
          { label: 'High Risk', value: stats.high, color: 'text-orange-400', bg: 'bg-orange-400/10', icon: ExclamationTriangleIcon },
          { label: 'Medium Risk', value: stats.medium, color: 'text-yellow-400', bg: 'bg-yellow-400/10', icon: ShieldExclamationIcon },
          { label: 'Low Risk', value: stats.low, color: 'text-green-400', bg: 'bg-green-400/10', icon: ShieldExclamationIcon },
        ].map(({ label, value, color, bg, icon: Icon }) => (
          <div key={label} className="bg-[#1e293b] rounded-xl p-5 border border-slate-700">
            <div className="flex items-center justify-between mb-3">
              <span className="text-slate-400 text-xs">{label}</span>
              <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
            </div>
            <div className={`text-2xl font-bold ${color}`}>{value}</div>
          </div>
        ))}
      </div>

      <div className="bg-[#1e293b] rounded-xl border border-slate-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-700">
          <h3 className="text-white font-semibold">Trader Risk Scores</h3>
          <p className="text-slate-400 text-xs mt-1">Sorted by risk score (highest first)</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left text-slate-400 text-xs font-medium px-5 py-3">Trader</th>
                <th className="text-left text-slate-400 text-xs font-medium px-5 py-3">Risk Score</th>
                <th className="text-left text-slate-400 text-xs font-medium px-5 py-3">Risk Level</th>
                <th className="text-left text-slate-400 text-xs font-medium px-5 py-3">Total Trades</th>
                <th className="text-left text-slate-400 text-xs font-medium px-5 py-3">Wins / Losses</th>
                <th className="text-left text-slate-400 text-xs font-medium px-5 py-3">Total Loss Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {loading && <tr><td colSpan={6} className="text-center text-slate-500 text-sm py-8">Analyzing risk data...</td></tr>}
              {!loading && accounts.length === 0 && <tr><td colSpan={6} className="text-center text-slate-500 text-sm py-8">No risk data available</td></tr>}
              {accounts.map((a) => (
                <tr key={a.user_id} className="hover:bg-slate-700/20 transition-colors">
                  <td className="px-5 py-3 text-white text-sm">{a.email}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${a.risk_score >= 80 ? 'bg-red-400' : a.risk_score >= 60 ? 'bg-orange-400' : a.risk_score >= 40 ? 'bg-yellow-400' : 'bg-green-400'}`}
                          style={{ width: `${a.risk_score}%` }} />
                      </div>
                      <span className="text-white text-xs font-semibold">{a.risk_score}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${riskColors[a.risk_level]}`}>{a.risk_level}</span>
                  </td>
                  <td className="px-5 py-3 text-slate-300 text-sm">{a.total_trades}</td>
                  <td className="px-5 py-3">
                    <span className="text-green-400 text-sm">{a.win_count}W</span>
                    <span className="text-slate-500 mx-1">/</span>
                    <span className="text-red-400 text-sm">{a.loss_count}L</span>
                  </td>
                  <td className="px-5 py-3 text-red-400 text-sm font-semibold">${a.total_loss_amount.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
