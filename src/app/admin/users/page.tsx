'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { MagnifyingGlassIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

interface User {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  status: string;
  is_verified: boolean;
  created_at: string;
  email_verified?: boolean;
  phone_verified?: boolean;
  kyc_status?: string;
  two_factor_enabled?: boolean;
  username?: string;
  country?: string;
}

interface Wallet {
  real_balance: number;
  demo_balance: number;
}

interface UserWithWallet extends User {
  wallet?: Wallet;
  tradeCount?: number;
}

const StatusBadge = ({ active }: { active: boolean }) => (
  <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${active ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
    {active ? 'Active' : 'Suspended'}
  </span>
);

const VerifyBadge = ({ verified, label }: { verified: boolean; label: string }) => (
  <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${verified ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
    {verified ? `✓ ${label}` : `✗ ${label}`}
  </span>
);

const KycBadge = ({ status }: { status: string }) => {
  const cfg = status === 'verified'
    ? { cls: 'bg-green-500/10 text-green-400 border-green-500/20', label: 'KYC Verified' }
    : status === 'pending'
    ? { cls: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', label: 'KYC Pending' }
    : { cls: 'bg-slate-500/10 text-slate-400 border-slate-500/20', label: 'KYC Unverified' };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.cls}`}>{cfg.label}</span>;
};

export default function UsersPage() {
  const [users, setUsers] = useState<UserWithWallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [tab, setTab] = useState<'all' | 'active' | 'suspended'>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('users')
      .select('id, email, full_name, role, status, is_verified, created_at, email_verified, phone_verified, kyc_status, two_factor_enabled, username, country')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Error fetching users:', error);
    }
    setUsers((data as UserWithWallet[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const fetchUserDetails = async (userId: string) => {
    const supabase = createClient();
    const [{ data: wallet }, { count: tradeCount }] = await Promise.all([
      supabase.from('wallets').select('real_balance, demo_balance').eq('user_id', userId).single(),
      supabase.from('trades').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    ]);
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, wallet: wallet || undefined, tradeCount: tradeCount || 0 } : u));
  };

  const toggleExpand = (userId: string) => {
    if (expandedUser === userId) { setExpandedUser(null); return; }
    setExpandedUser(userId);
    fetchUserDetails(userId);
  };

  const showMessage = (msg: string, type: 'success' | 'error' = 'success') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleSuspend = async (userId: string) => {
    setActionLoading(userId);
    const supabase = createClient();
    const { error } = await supabase
      .from('users')
      .update({ status: 'suspended' })
      .eq('id', userId);
    if (error) {
      showMessage(`Failed to suspend user: ${error.message}`, 'error');
    } else {
      showMessage('User suspended successfully');
      await fetchUsers();
    }
    setActionLoading(null);
  };

  const handleActivate = async (userId: string) => {
    setActionLoading(userId);
    const supabase = createClient();
    const { error } = await supabase
      .from('users')
      .update({ status: 'active' })
      .eq('id', userId);
    if (error) {
      showMessage(`Failed to activate user: ${error.message}`, 'error');
    } else {
      showMessage('User activated successfully');
      await fetchUsers();
    }
    setActionLoading(null);
  };

  const handleDelete = async (userId: string, userEmail: string) => {
    if (!confirm(`Are you sure you want to delete user "${userEmail}"? This action cannot be undone.`)) return;
    setActionLoading(userId);
    const supabase = createClient();
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);
    if (error) {
      showMessage(`Failed to delete user: ${error.message}`, 'error');
    } else {
      showMessage('User deleted successfully');
      await fetchUsers();
    }
    setActionLoading(null);
  };

  const handleVerifyEmail = async (userId: string, verified: boolean) => {
    setActionLoading(`email-${userId}`);
    const supabase = createClient();
    const { error } = await supabase.from('users').update({ email_verified: verified }).eq('id', userId);
    if (error) { showMessage(`Failed: ${error.message}`, 'error'); }
    else { showMessage(`Email ${verified ? 'verified' : 'unverified'} successfully`); await fetchUsers(); }
    setActionLoading(null);
  };

  const handleVerifyPhone = async (userId: string, verified: boolean) => {
    setActionLoading(`phone-${userId}`);
    const supabase = createClient();
    const { error } = await supabase.from('users').update({ phone_verified: verified }).eq('id', userId);
    if (error) { showMessage(`Failed: ${error.message}`, 'error'); }
    else { showMessage(`Phone ${verified ? 'verified' : 'unverified'} successfully`); await fetchUsers(); }
    setActionLoading(null);
  };

  const handleKycApprove = async (userId: string, status: string) => {
    setActionLoading(`kyc-${userId}`);
    const supabase = createClient();
    const { error } = await supabase.from('users').update({ kyc_status: status }).eq('id', userId);
    if (error) { showMessage(`Failed: ${error.message}`, 'error'); }
    else { showMessage(`KYC status set to "${status}" successfully`); await fetchUsers(); }
    setActionLoading(null);
  };

  const handleToggle2FA = async (userId: string, enabled: boolean) => {
    setActionLoading(`2fa-${userId}`);
    const supabase = createClient();
    const { error } = await supabase.from('users').update({ two_factor_enabled: enabled }).eq('id', userId);
    if (error) { showMessage(`Failed: ${error.message}`, 'error'); }
    else { showMessage(`2FA ${enabled ? 'enabled' : 'disabled'} successfully`); await fetchUsers(); }
    setActionLoading(null);
  };

  const isUserSuspended = (user: UserWithWallet) => user.status === 'suspended';

  const filtered = users.filter((u) => {
    const matchSearch = u.email.toLowerCase().includes(search.toLowerCase()) || (u.full_name || '').toLowerCase().includes(search.toLowerCase());
    const matchTab = tab === 'all' || (tab === 'active' && !isUserSuspended(u)) || (tab === 'suspended' && isUserSuspended(u));
    return matchSearch && matchTab;
  });

  const activeCount = users.filter((u) => !isUserSuspended(u)).length;
  const suspendedCount = users.filter((u) => isUserSuspended(u)).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-white text-xl font-bold">User Management</h2>
          <p className="text-slate-400 text-sm mt-1">{users.length} total users</p>
        </div>
        <div className="relative">
          <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Search by email or name..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="bg-[#1e293b] border border-slate-700 text-white text-sm rounded-lg pl-9 pr-4 py-2 w-64 focus:outline-none focus:border-[#22c55e] placeholder-slate-500" />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#1e293b] rounded-xl p-4 border border-slate-700 text-center">
          <div className="text-white text-2xl font-bold">{users.length}</div>
          <div className="text-slate-400 text-xs mt-1">Total Users</div>
        </div>
        <div className="bg-[#1e293b] rounded-xl p-4 border border-green-400/20 text-center">
          <div className="text-green-400 text-2xl font-bold">{activeCount}</div>
          <div className="text-slate-400 text-xs mt-1">Active</div>
        </div>
        <div className="bg-[#1e293b] rounded-xl p-4 border border-red-400/20 text-center">
          <div className="text-red-400 text-2xl font-bold">{suspendedCount}</div>
          <div className="text-slate-400 text-xs mt-1">Suspended</div>
        </div>
      </div>

      {message && (
        <div className={`border text-sm px-4 py-2 rounded-lg ${messageType === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-green-500/10 border-green-500/20 text-green-400'}`}>
          {message}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-[#1e293b] rounded-lg p-1 w-fit border border-slate-700">
        {(['all', 'active', 'suspended'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors capitalize ${tab === t ? 'bg-[#22c55e] text-black' : 'text-slate-400 hover:text-white'}`}>
            {t}
          </button>
        ))}
      </div>

      <div className="bg-[#1e293b] rounded-xl border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left text-slate-400 text-xs font-medium px-5 py-3">Email</th>
                <th className="text-left text-slate-400 text-xs font-medium px-5 py-3">Name</th>
                <th className="text-left text-slate-400 text-xs font-medium px-5 py-3">Status</th>
                <th className="text-left text-slate-400 text-xs font-medium px-5 py-3">Verified</th>
                <th className="text-left text-slate-400 text-xs font-medium px-5 py-3">Joined</th>
                <th className="text-left text-slate-400 text-xs font-medium px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {loading && <tr><td colSpan={6} className="text-center text-slate-500 text-sm py-8">Loading...</td></tr>}
              {!loading && filtered.length === 0 && <tr><td colSpan={6} className="text-center text-slate-500 text-sm py-8">No users found</td></tr>}
              {filtered.map((user) => (
                <>
                  <tr key={user.id} className="hover:bg-slate-700/20 transition-colors">
                    <td className="px-5 py-3 text-white text-sm">{user.email}</td>
                    <td className="px-5 py-3 text-slate-300 text-sm">{user.full_name || '—'}</td>
                    <td className="px-5 py-3"><StatusBadge active={!isUserSuspended(user)} /></td>
                    <td className="px-5 py-3">
                      {user.is_verified ? <CheckCircleIcon className="w-4 h-4 text-green-400" /> : <XCircleIcon className="w-4 h-4 text-slate-500" />}
                    </td>
                    <td className="px-5 py-3 text-slate-400 text-sm">{new Date(user.created_at).toLocaleDateString()}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => toggleExpand(user.id)}
                          className="text-xs px-2 py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-colors">
                          {expandedUser === user.id ? 'Hide' : 'Details'}
                        </button>
                        {!isUserSuspended(user) ? (
                          <button
                            onClick={() => handleSuspend(user.id)}
                            disabled={actionLoading === user.id}
                            className="text-xs px-2 py-1 rounded bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                            {actionLoading === user.id ? '...' : 'Suspend'}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleActivate(user.id)}
                            disabled={actionLoading === user.id}
                            className="text-xs px-2 py-1 rounded bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                            {actionLoading === user.id ? '...' : 'Activate'}
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(user.id, user.email)}
                          disabled={actionLoading === user.id}
                          className="text-xs px-2 py-1 rounded bg-slate-500/10 text-slate-400 border border-slate-500/20 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedUser === user.id && (
                    <tr key={`${user.id}-exp`} className="bg-slate-800/30">
                      <td colSpan={6} className="px-5 py-4">
                        <div className="space-y-4">
                          {/* Balances & Trade Count */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="bg-[#0f172a] rounded-lg p-3 border border-slate-700">
                              <div className="text-slate-400 text-xs mb-1">Real Balance</div>
                              <div className="text-green-400 font-semibold">{user.wallet ? `$${Number(user.wallet.real_balance).toFixed(2)}` : 'Loading...'}</div>
                            </div>
                            <div className="bg-[#0f172a] rounded-lg p-3 border border-slate-700">
                              <div className="text-slate-400 text-xs mb-1">Demo Balance</div>
                              <div className="text-blue-400 font-semibold">{user.wallet ? `$${Number(user.wallet.demo_balance).toFixed(2)}` : 'Loading...'}</div>
                            </div>
                            <div className="bg-[#0f172a] rounded-lg p-3 border border-slate-700">
                              <div className="text-slate-400 text-xs mb-1">Total Trades</div>
                              <div className="text-white font-semibold">{user.tradeCount ?? 'Loading...'}</div>
                            </div>
                          </div>

                          {/* Profile Info */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div className="bg-[#0f172a] rounded-lg p-3 border border-slate-700">
                              <div className="text-slate-400 text-xs mb-1">Username</div>
                              <div className="text-white text-sm font-medium">{user.username || '—'}</div>
                            </div>
                            <div className="bg-[#0f172a] rounded-lg p-3 border border-slate-700">
                              <div className="text-slate-400 text-xs mb-1">Country</div>
                              <div className="text-white text-sm font-medium">{user.country || '—'}</div>
                            </div>
                            <div className="bg-[#0f172a] rounded-lg p-3 border border-slate-700">
                              <div className="text-slate-400 text-xs mb-1">KYC Status</div>
                              <KycBadge status={user.kyc_status || 'unverified'} />
                            </div>
                            <div className="bg-[#0f172a] rounded-lg p-3 border border-slate-700">
                              <div className="text-slate-400 text-xs mb-1">2FA</div>
                              <VerifyBadge verified={!!user.two_factor_enabled} label="2FA" />
                            </div>
                          </div>

                          {/* Verification Controls */}
                          <div className="bg-[#0f172a] rounded-lg p-4 border border-slate-700">
                            <div className="text-slate-300 text-xs font-semibold uppercase tracking-wider mb-3">Verification Controls</div>
                            <div className="flex flex-wrap gap-2">
                              {/* Email Verification */}
                              {!user.email_verified ? (
                                <button
                                  onClick={() => handleVerifyEmail(user.id, true)}
                                  disabled={actionLoading === `email-${user.id}`}
                                  className="text-xs px-3 py-1.5 rounded bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 transition-colors disabled:opacity-50">
                                  {actionLoading === `email-${user.id}` ? '...' : '✓ Verify Email'}
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleVerifyEmail(user.id, false)}
                                  disabled={actionLoading === `email-${user.id}`}
                                  className="text-xs px-3 py-1.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors disabled:opacity-50">
                                  {actionLoading === `email-${user.id}` ? '...' : '✗ Unverify Email'}
                                </button>
                              )}

                              {/* Phone Verification */}
                              {!user.phone_verified ? (
                                <button
                                  onClick={() => handleVerifyPhone(user.id, true)}
                                  disabled={actionLoading === `phone-${user.id}`}
                                  className="text-xs px-3 py-1.5 rounded bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 transition-colors disabled:opacity-50">
                                  {actionLoading === `phone-${user.id}` ? '...' : '✓ Verify Phone'}
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleVerifyPhone(user.id, false)}
                                  disabled={actionLoading === `phone-${user.id}`}
                                  className="text-xs px-3 py-1.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors disabled:opacity-50">
                                  {actionLoading === `phone-${user.id}` ? '...' : '✗ Unverify Phone'}
                                </button>
                              )}

                              {/* KYC Controls */}
                              {user.kyc_status !== 'verified' && (
                                <button
                                  onClick={() => handleKycApprove(user.id, 'verified')}
                                  disabled={actionLoading === `kyc-${user.id}`}
                                  className="text-xs px-3 py-1.5 rounded bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 transition-colors disabled:opacity-50">
                                  {actionLoading === `kyc-${user.id}` ? '...' : '✓ Approve KYC'}
                                </button>
                              )}
                              {user.kyc_status === 'verified' && (
                                <button
                                  onClick={() => handleKycApprove(user.id, 'unverified')}
                                  disabled={actionLoading === `kyc-${user.id}`}
                                  className="text-xs px-3 py-1.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors disabled:opacity-50">
                                  {actionLoading === `kyc-${user.id}` ? '...' : '✗ Revoke KYC'}
                                </button>
                              )}
                              {user.kyc_status === 'unverified' && (
                                <button
                                  onClick={() => handleKycApprove(user.id, 'pending')}
                                  disabled={actionLoading === `kyc-${user.id}`}
                                  className="text-xs px-3 py-1.5 rounded bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 hover:bg-yellow-500/20 transition-colors disabled:opacity-50">
                                  {actionLoading === `kyc-${user.id}` ? '...' : '⏳ Set KYC Pending'}
                                </button>
                              )}

                              {/* 2FA Toggle */}
                              {!user.two_factor_enabled ? (
                                <button
                                  onClick={() => handleToggle2FA(user.id, true)}
                                  disabled={actionLoading === `2fa-${user.id}`}
                                  className="text-xs px-3 py-1.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-colors disabled:opacity-50">
                                  {actionLoading === `2fa-${user.id}` ? '...' : '✓ Enable 2FA'}
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleToggle2FA(user.id, false)}
                                  disabled={actionLoading === `2fa-${user.id}`}
                                  className="text-xs px-3 py-1.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors disabled:opacity-50">
                                  {actionLoading === `2fa-${user.id}` ? '...' : '✗ Disable 2FA'}
                                </button>
                              )}
                            </div>

                            {/* Current verification status summary */}
                            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-700">
                              <VerifyBadge verified={!!user.email_verified} label="Email" />
                              <VerifyBadge verified={!!user.phone_verified} label="Phone" />
                              <KycBadge status={user.kyc_status || 'unverified'} />
                              <VerifyBadge verified={!!user.two_factor_enabled} label="2FA" />
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
