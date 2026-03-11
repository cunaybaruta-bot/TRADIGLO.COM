'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { MagnifyingGlassIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

interface User {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  is_verified: boolean;
  created_at: string;
}

export default function AccountStatusPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const [message, setMessage] = useState('');

  const fetchUsers = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('users')
      .select('id, email, full_name, role, is_verified, created_at')
      .order('created_at', { ascending: false });
    setUsers((data as User[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const toggleStatus = async (userId: string, current: boolean) => {
    const supabase = createClient();
    await supabase.from('users').update({ is_verified: !current }).eq('id', userId);
    setMessage(`Account ${!current ? 'activated' : 'suspended'} successfully`);
    fetchUsers();
    setTimeout(() => setMessage(''), 3000);
  };

  const filtered = users.filter((u) => {
    const matchSearch = u.email.toLowerCase().includes(search.toLowerCase()) || (u.full_name || '').toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || (filter === 'active' && u.is_verified) || (filter === 'suspended' && !u.is_verified);
    return matchSearch && matchFilter;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Account Status</h1>
        <p className="text-gray-400 text-sm mt-1">Manage user account activation and suspension</p>
      </div>

      {message && (
        <div className="bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-lg text-sm">{message}</div>
      )}

      <div className="bg-[#0f1629] border border-white/10 rounded-xl p-4">
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="flex gap-2">
            {(['all', 'active', 'suspended'] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${filter === f ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading users...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-gray-400 text-left">
                  <th className="pb-3 font-medium">User</th>
                  <th className="pb-3 font-medium">Role</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Joined</th>
                  <th className="pb-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3">
                      <div className="text-white">{u.email}</div>
                      <div className="text-gray-500 text-xs">{u.full_name || '—'}</div>
                    </td>
                    <td className="py-3 text-gray-300 capitalize">{u.role}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${u.is_verified ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                        {u.is_verified ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="py-3 text-gray-400">{new Date(u.created_at).toLocaleDateString()}</td>
                    <td className="py-3">
                      <button onClick={() => toggleStatus(u.id, u.is_verified)}
                        className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium transition-colors ${u.is_verified ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'}`}>
                        {u.is_verified ? <><XCircleIcon className="w-3 h-3" /> Suspend</> : <><CheckCircleIcon className="w-3 h-3" /> Activate</>}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="text-center py-8 text-gray-500">No users found</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
