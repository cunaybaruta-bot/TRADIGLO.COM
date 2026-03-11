'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { UserGroupIcon } from '@heroicons/react/24/outline';

interface Follower {
  id: string;
  follower_id: string;
  strategy_id: string;
  copy_amount: number;
  status: string;
  created_at: string;
  users?: { email: string };
}

export default function CopyTradingFollowersPage() {
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFollowers = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('copy_trading_followers')
      .select('id, follower_id, strategy_id, copy_amount, status, created_at, users(email)')
      .order('created_at', { ascending: false });
    setFollowers((data as any) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchFollowers(); }, [fetchFollowers]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Followers</h1>
        <p className="text-gray-400 text-sm mt-1">Users following copy trading strategies</p>
      </div>

      <div className="bg-[#0f1629] border border-white/10 rounded-xl p-4">
        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading followers...</div>
        ) : followers.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <UserGroupIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No followers found</p>
            <p className="text-xs mt-1">Followers will appear here once users subscribe to strategies</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-gray-400 text-left">
                  <th className="pb-3 font-medium">Follower</th>
                  <th className="pb-3 font-medium">Strategy ID</th>
                  <th className="pb-3 font-medium">Copy Amount</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {followers.map((f) => (
                  <tr key={f.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 text-white">{(f.users as any)?.email || f.follower_id?.slice(0, 8)}</td>
                    <td className="py-3 text-gray-400 font-mono text-xs">{f.strategy_id?.slice(0, 12)}...</td>
                    <td className="py-3 text-green-400">${Number(f.copy_amount).toLocaleString()}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${f.status === 'active' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}>
                        {f.status}
                      </span>
                    </td>
                    <td className="py-3 text-gray-400">{new Date(f.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
