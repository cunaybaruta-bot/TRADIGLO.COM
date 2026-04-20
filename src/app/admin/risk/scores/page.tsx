'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';


interface RiskScore {
  user_id: string;
  email: string;
  tradeCount: number;
  lostCount: number;
  totalVolume: number;
  riskScore: number;
}

export default function TraderRiskScoresPage() {
  const [scores, setScores] = useState<RiskScore[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchScores = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.from('trades').select('user_id, status, amount, users(email)');
    if (data) {
      const map: Record<string, RiskScore> = {};
      data.forEach((t: any) => {
        if (!map[t.user_id]) map[t.user_id] = { user_id: t.user_id, email: t.users?.email || t.user_id.slice(0, 8), tradeCount: 0, lostCount: 0, totalVolume: 0, riskScore: 0 };
        map[t.user_id].tradeCount++;
        map[t.user_id].totalVolume += Number(t.amount);
        if (t.status === 'lost') map[t.user_id].lostCount++;
      });
      const arr = Object.values(map).map((u) => ({ ...u, riskScore: u.tradeCount > 0 ? Math.round((u.lostCount / u.tradeCount) * 100) : 0 })).sort((a, b) => b.riskScore - a.riskScore);
      setScores(arr);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchScores(); }, [fetchScores]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Trader Risk Scores</h1>
        <p className="text-gray-400 text-sm mt-1">Individual risk assessment for all traders</p>
      </div>

      <div className="bg-[#0f1629] border border-white/10 rounded-xl p-4">
        {loading ? (
          <div className="text-center py-12 text-gray-400">Calculating risk scores...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-gray-400 text-left">
                  <th className="pb-3 font-medium">Trader</th>
                  <th className="pb-3 font-medium">Trades</th>
                  <th className="pb-3 font-medium">Losses</th>
                  <th className="pb-3 font-medium">Volume</th>
                  <th className="pb-3 font-medium">Risk Score</th>
                  <th className="pb-3 font-medium">Level</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {scores.map((s) => (
                  <tr key={s.user_id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 text-white">{s.email}</td>
                    <td className="py-3 text-gray-300">{s.tradeCount}</td>
                    <td className="py-3 text-red-400">{s.lostCount}</td>
                    <td className="py-3 text-yellow-400">${s.totalVolume.toLocaleString()}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 bg-white/10 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${s.riskScore >= 70 ? 'bg-red-500' : s.riskScore >= 40 ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${s.riskScore}%` }} />
                        </div>
                        <span className="text-white">{s.riskScore}%</span>
                      </div>
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
                        s.riskScore >= 70 ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                        s.riskScore >= 40 ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20': 'bg-green-500/10 text-green-400 border-green-500/20'
                      }`}>
                        {s.riskScore >= 70 ? 'High' : s.riskScore >= 40 ? 'Medium' : 'Low'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {scores.length === 0 && <div className="text-center py-8 text-gray-500">No risk data available</div>}
          </div>
        )}
      </div>
    </div>
  );
}
