'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ShieldExclamationIcon } from '@heroicons/react/24/outline';

interface RiskUser {
  user_id: string;
  email: string;
  tradeCount: number;
  lostCount: number;
  totalVolume: number;
  riskScore: number;
}

export default function AIRiskPredictionPage() {
  const [riskUsers, setRiskUsers] = useState<RiskUser[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRisk = useCallback(async () => {
    const supabase = createClient();
    const { data: trades } = await supabase
      .from('trades')
      .select('user_id, status, amount, users(email)');

    if (trades) {
      const map: Record<string, RiskUser> = {};
      trades.forEach((t: any) => {
        if (!map[t.user_id]) map[t.user_id] = { user_id: t.user_id, email: t.users?.email || t.user_id.slice(0, 8), tradeCount: 0, lostCount: 0, totalVolume: 0, riskScore: 0 };
        map[t.user_id].tradeCount++;
        map[t.user_id].totalVolume += Number(t.amount);
        if (t.status === 'lost') map[t.user_id].lostCount++;
      });
      const arr = Object.values(map).map((u) => ({
        ...u,
        riskScore: u.tradeCount > 0 ? Math.round((u.lostCount / u.tradeCount) * 100) : 0,
      })).sort((a, b) => b.riskScore - a.riskScore).slice(0, 20);
      setRiskUsers(arr);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchRisk(); }, [fetchRisk]);

  const getRiskLevel = (score: number) => {
    if (score >= 70) return { label: 'High', color: 'text-red-400 bg-red-500/10 border-red-500/20' };
    if (score >= 40) return { label: 'Medium', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' };
    return { label: 'Low', color: 'text-green-400 bg-green-500/10 border-green-500/20' };
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Risk Prediction</h1>
        <p className="text-gray-400 text-sm mt-1">AI-powered risk assessment for platform users</p>
      </div>

      <div className="bg-[#0f1629] border border-white/10 rounded-xl p-4">
        <h2 className="text-white font-semibold mb-4 flex items-center gap-2"><ShieldExclamationIcon className="w-5 h-5 text-red-400" /> High-Risk Users</h2>
        {loading ? (
          <div className="text-center py-12 text-gray-400">Analyzing risk...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-gray-400 text-left">
                  <th className="pb-3 font-medium">User</th>
                  <th className="pb-3 font-medium">Total Trades</th>
                  <th className="pb-3 font-medium">Lost</th>
                  <th className="pb-3 font-medium">Volume</th>
                  <th className="pb-3 font-medium">Risk Score</th>
                  <th className="pb-3 font-medium">Level</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {riskUsers.map((u) => {
                  const risk = getRiskLevel(u.riskScore);
                  return (
                    <tr key={u.user_id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 text-white">{u.email}</td>
                      <td className="py-3 text-gray-300">{u.tradeCount}</td>
                      <td className="py-3 text-red-400">{u.lostCount}</td>
                      <td className="py-3 text-yellow-400">${u.totalVolume.toLocaleString()}</td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 bg-white/10 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${u.riskScore >= 70 ? 'bg-red-500' : u.riskScore >= 40 ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${u.riskScore}%` }} />
                          </div>
                          <span className="text-white">{u.riskScore}%</span>
                        </div>
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${risk.color}`}>{risk.label}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {riskUsers.length === 0 && <div className="text-center py-8 text-gray-500">No risk data available</div>}
          </div>
        )}
      </div>
    </div>
  );
}
