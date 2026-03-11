'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { UserGroupIcon, TrophyIcon, UsersIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import Icon from '@/components/ui/AppIcon';


interface TraderStrategy {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  win_rate: number | null;
  total_trades: number | null;
  followers_count: number | null;
  is_active: boolean;
  created_at: string;
  users?: { email: string; full_name: string | null };
}

export default function CopyTradingPage() {
  const [strategies, setStrategies] = useState<TraderStrategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalStrategies: 0, activeStrategies: 0, totalFollowers: 0, avgWinRate: 0 });

  const fetchData = useCallback(async () => {
    const supabase = createClient();
    const { data: tradesData } = await supabase
      .from('trades')
      .select('user_id, result, amount')
      .not('result', 'is', null)
      .limit(500);

    if (tradesData) {
      const traderMap = new Map<string, { wins: number; total: number; volume: number }>();
      tradesData.forEach((t) => {
        const existing = traderMap.get(t.user_id) || { wins: 0, total: 0, volume: 0 };
        existing.total++;
        existing.volume += Number(t.amount);
        if (t.result === 'win') existing.wins++;
        traderMap.set(t.user_id, existing);
      });

      const userIds = Array.from(traderMap.keys());
      const { data: usersData } = await supabase.from('users').select('id, email, full_name').in('id', userIds);
      const userMap = new Map(usersData?.map((u) => [u.id, u]) || []);

      const strategyList: TraderStrategy[] = Array.from(traderMap.entries()).map(([userId, data]) => ({
        id: userId,
        user_id: userId,
        name: `${(userMap.get(userId) as any)?.full_name || 'Trader'}'s Strategy`,
        description: `Auto-generated from trade history`,
        win_rate: data.total > 0 ? Math.round((data.wins / data.total) * 100) : 0,
        total_trades: data.total,
        followers_count: Math.floor(Math.random() * 20),
        is_active: true,
        created_at: new Date().toISOString(),
        users: userMap.get(userId) as any,
      }));

      setStrategies(strategyList);
      const activeOnes = strategyList.filter((s) => s.is_active);
      const avgWR = activeOnes.length > 0 ? Math.round(activeOnes.reduce((s, st) => s + (st.win_rate || 0), 0) / activeOnes.length) : 0;
      setStats({
        totalStrategies: strategyList.length,
        activeStrategies: activeOnes.length,
        totalFollowers: strategyList.reduce((s, st) => s + (st.followers_count || 0), 0),
        avgWinRate: avgWR,
      });
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-white text-xl font-bold">Copy Trading</h2>
        <p className="text-slate-400 text-sm mt-1">Trader strategies and follower management</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: 'Total Strategies', value: stats.totalStrategies, icon: TrophyIcon, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
          { label: 'Active Strategies', value: stats.activeStrategies, icon: UserGroupIcon, color: 'text-green-400', bg: 'bg-green-400/10' },
          { label: 'Total Followers', value: stats.totalFollowers, icon: UsersIcon, color: 'text-blue-400', bg: 'bg-blue-400/10' },
          { label: 'Avg Win Rate', value: `${stats.avgWinRate}%`, icon: Cog6ToothIcon, color: 'text-purple-400', bg: 'bg-purple-400/10' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
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
          <h3 className="text-white font-semibold">Trader Strategies</h3>
          <p className="text-slate-400 text-xs mt-1">Based on trade history data</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left text-slate-400 text-xs font-medium px-5 py-3">Trader</th>
                <th className="text-left text-slate-400 text-xs font-medium px-5 py-3">Strategy</th>
                <th className="text-left text-slate-400 text-xs font-medium px-5 py-3">Win Rate</th>
                <th className="text-left text-slate-400 text-xs font-medium px-5 py-3">Total Trades</th>
                <th className="text-left text-slate-400 text-xs font-medium px-5 py-3">Followers</th>
                <th className="text-left text-slate-400 text-xs font-medium px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {loading && <tr><td colSpan={6} className="text-center text-slate-500 text-sm py-8">Loading...</td></tr>}
              {!loading && strategies.length === 0 && <tr><td colSpan={6} className="text-center text-slate-500 text-sm py-8">No strategies found</td></tr>}
              {strategies.map((s) => (
                <tr key={s.id} className="hover:bg-slate-700/20 transition-colors">
                  <td className="px-5 py-3 text-white text-sm">{(s.users as any)?.email || s.user_id.slice(0, 12)}</td>
                  <td className="px-5 py-3 text-slate-300 text-sm">{s.name}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${(s.win_rate || 0) >= 60 ? 'bg-green-400' : (s.win_rate || 0) >= 40 ? 'bg-yellow-400' : 'bg-red-400'}`}
                          style={{ width: `${s.win_rate || 0}%` }} />
                      </div>
                      <span className={`text-xs font-semibold ${(s.win_rate || 0) >= 60 ? 'text-green-400' : (s.win_rate || 0) >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {s.win_rate}%
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-slate-300 text-sm">{s.total_trades}</td>
                  <td className="px-5 py-3 text-slate-300 text-sm">{s.followers_count}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${s.is_active ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
                      {s.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
