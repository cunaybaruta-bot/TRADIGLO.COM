'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { User, Shield, Wallet, BarChart2, Trophy, Clock, Settings, Headphones, ChevronRight, ArrowLeft, LogOut, Camera, Edit2, Check, X, Eye, EyeOff, TrendingUp, TrendingDown, Award, Star, Zap, MessageCircle, Send, ChevronDown, Bell, Monitor, Smartphone, AlertCircle, CheckCircle, Info, RotateCcw, CreditCard, DollarSign, Upload, ArrowDownCircle, ArrowUpCircle, List, Copy, Link2, Users, BadgeCheck, Cpu, ShieldCheck, UserCheck, UserX, AlertTriangle, Fingerprint, Activity, Menu } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  phone?: string;
  country?: string;
  timezone?: string;
  username?: string;
  account_status?: string;
  email_verified?: boolean;
  phone_verified?: boolean;
  kyc_status?: string;
  two_factor_enabled?: boolean;
  last_login_at?: string;
  last_login_device?: string;
  last_login_location?: string;
  referral_code?: string;
  referral_count?: number;
  referral_earnings?: number;
  bank_name?: string;
  account_holder?: string;
  account_number?: string;
  preferred_payment_method?: string;
  preferred_currency?: string;
  created_at: string;
}

interface WalletData {
  demoBalance: number;
  realBalance: number;
}

interface TradeStats {
  totalTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  totalProfit: number;
  totalLoss: number;
  bestTrade: number;
  worstTrade: number;
  favoriteAssets: { symbol: string; count: number }[];
  dailyPerformance: { date: string; profit: number }[];
}

interface DepositRecord {
  id: string;
  amount: number;
  currency: string;
  payment_method: string | null;
  payment_reference: string | null;
  status: string;
  created_at: string;
}

interface WithdrawalRecord {
  id: string;
  amount: number;
  currency: string;
  payment_method: string | null;
  destination_address: string | null;
  status: string;
  created_at: string;
}

interface TransactionRecord {
  id: string;
  type: string;
  amount: number;
  description: string | null;
  status: string;
  is_demo: boolean;
  created_at: string;
}

interface ActivityLog {
  id: string;
  type: string;
  description: string;
  amount?: number;
  created_at: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function getTraderLevel(totalTrades: number): { level: string; color: string; next: string; nextAt: number; progress: number } {
  if (totalTrades >= 500) return { level: 'VIP', color: '#a855f7', next: 'Max Level', nextAt: 500, progress: 100 };
  if (totalTrades >= 200) return { level: 'Gold', color: '#f59e0b', next: 'VIP', nextAt: 500, progress: Math.round(((totalTrades - 200) / 300) * 100) };
  if (totalTrades >= 50) return { level: 'Silver', color: '#94a3b8', next: 'Gold', nextAt: 200, progress: Math.round(((totalTrades - 50) / 150) * 100) };
  return { level: 'Bronze', color: '#cd7f32', next: 'Silver', nextAt: 50, progress: Math.round((totalTrades / 50) * 100) };
}

function generateAccountId(userId: string): string {
  const hash = userId.replace(/-/g, '').slice(0, 6).toUpperCase();
  return `TRD-${hash}`;
}

function generateReferralCode(userId: string): string {
  return userId.replace(/-/g, '').slice(0, 8).toUpperCase();
}

// ─── Sidebar Nav Items ────────────────────────────────────────────────────────

type AccountSection = 'profile' | 'security' | 'wallet' | 'stats' | 'level' | 'activity' | 'preferences' | 'support';

const NAV_ITEMS: { id: AccountSection; label: string; icon: React.ReactNode; accent: string }[] = [
  { id: 'profile', label: 'Profile', icon: <User size={16} />, accent: '#3b82f6' },
  { id: 'security', label: 'Security', icon: <Shield size={16} />, accent: '#10b981' },
  { id: 'wallet', label: 'Wallet', icon: <Wallet size = {16} />, accent: '#f59e0b' },
  { id: 'stats', label: 'Stats', icon: <BarChart2 size={16} />, accent: '#6366f1' },
  { id: 'level', label: 'Level & Reward', icon: <Trophy size={16} />, accent: '#a855f7' },
  { id: 'activity', label: 'Activity', icon: <Clock size={16} />, accent: '#06b6d4' },
  { id: 'preferences', label: 'Preferences', icon: <Settings size={16} />, accent: '#64748b' },
  { id: 'support', label: 'Support', icon: <Headphones size={16} />, accent: '#ec4899' },
];

// ─── Toast ────────────────────────────────────────────────────────────────────

interface ToastState { message: string; type: 'success\' | \'error\' | \'info' }

function Toast({ toast, onClose }: { toast: ToastState; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);
  const colors = { success: '#00c853', error: '#ff3d57', info: '#60a5fa' };
  const c = colors[toast.type];
  return (
    <div style={{
      position: 'fixed', bottom: 28, right: 20, zIndex: 9999,
      background: 'rgba(10,10,10,0.95)', backdropFilter: 'blur(20px)',
      borderLeft: `3px solid ${c}`, borderRadius: 10,
      padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10,
      boxShadow: `0 8px 32px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.06)`,
      maxWidth: 320, animation: 'slideInToast 0.3s cubic-bezier(0.34,1.56,0.64,1)'
    }}>
      {toast.type === 'success' ? <CheckCircle size={15} color={c} /> : toast.type === 'error' ? <AlertCircle size={15} color={c} /> : <Info size={15} color={c} />}
      <span style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 500, lineHeight: 1.4 }}>{toast.message}</span>
      <button onClick={onClose} style={{ color: '#475569', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginLeft: 4, flexShrink: 0 }}><X size={13} /></button>
    </div>
  );
}

// ─── Glass Card ───────────────────────────────────────────────────────────────

function GlassCard({ children, className = '', style = {}, onClick }: { children: React.ReactNode; className?: string; style?: React.CSSProperties; onClick?: () => void }) {
  return (
    <div className={`rounded-2xl border border-white/8 ${className}`} style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(12px)', ...style }} onClick={onClick}>
      {children}
    </div>
  );
}

// ─── Section: Profile ─────────────────────────────────────────────────────────

function ProfileSection({ profile, stats, onUpdate, activeCountries }: { profile: UserProfile | null; stats: TradeStats; onUpdate: (data: Partial<UserProfile>) => Promise<void>; activeCountries: string[] }) {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ full_name: '', phone: '', country: '', timezone: '', username: '' });
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm({ full_name: profile.full_name || '', phone: profile.phone || '', country: profile.country || '', timezone: profile.timezone || '', username: profile.username || '' });
      setAvatarUrl(profile.avatar_url || null);
    }
  }, [profile]);

  const validatePhone = (phone: string) => {
    if (!phone) return true;
    return /^\+?[\d\s\-()]{7,20}$/.test(phone);
  };

  const handleSave = async () => {
    if (!validatePhone(form.phone)) { setToast({ message: 'Invalid phone number format', type: 'error' }); return; }
    setSaving(true);
    try {
      await onUpdate(form);
      setEditing(false);
      setToast({ message: 'Profile updated successfully', type: 'success' });
    } catch (e: any) {
      setToast({ message: e.message || 'Failed to save profile', type: 'error' });
    } finally { setSaving(false); }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    if (file.size > 2 * 1024 * 1024) { setToast({ message: 'Maximum file size is 2MB', type: 'error' }); return; }
    setUploadingAvatar(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (ev) => resolve(ev.target?.result as string);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });
      const { error } = await supabase.from('users').update({
        avatar_url: dataUrl,
        updated_at: new Date().toISOString(),
      }).eq('id', profile.id);
      if (error) throw error;
      setAvatarUrl(dataUrl);
      await onUpdate({ avatar_url: dataUrl });
      setToast({ message: 'Profile photo updated successfully', type: 'success' });
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (e: any) {
      setToast({ message: e.message || 'Failed to upload photo', type: 'error' });
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCopyReferral = (text: string) => {
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : profile?.email?.[0]?.toUpperCase() || 'U';

  const accountId = profile?.id ? generateAccountId(profile.id) : '—';
  const referralCode = profile?.referral_code || (profile?.id ? generateReferralCode(profile.id) : '—');
  const referralLink = `https://tradiglo.com/register?ref=${referralCode}`;

  const accountStatusConfig = {
    active: { label: 'Active', color: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.3)', icon: <UserCheck size={12} /> },
    suspended: { label: 'Suspended', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)', icon: <UserX size={12} /> },
    restricted: { label: 'Restricted', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)', icon: <AlertTriangle size={12} /> },
  };
  const statusKey = (profile?.account_status || 'active') as keyof typeof accountStatusConfig;
  const statusCfg = accountStatusConfig[statusKey] || accountStatusConfig.active;

  const kycConfig = {
    unverified: { label: 'Unverified', color: '#64748b', bg: 'rgba(100,116,139,0.1)', border: 'rgba(100,116,139,0.2)' },
    pending: { label: 'Pending Review', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)' },
    verified: { label: 'Verified', color: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.3)' },
  };
  const kycKey = (profile?.kyc_status || 'unverified') as keyof typeof kycConfig;
  const kycCfg = kycConfig[kycKey] || kycConfig.unverified;

  const levelInfo = getTraderLevel(stats.totalTrades);
  const netPnL = stats.totalProfit + stats.totalLoss;

  const TIMEZONES = ['UTC', 'Asia/Jakarta', 'Asia/Singapore', 'Asia/Tokyo', 'Asia/Dubai', 'Europe/London', 'Europe/Paris', 'America/New_York', 'America/Los_Angeles', 'Australia/Sydney', 'Pacific/Auckland'];
  const COUNTRIES = activeCountries.length > 0 ? activeCountries : ['Malaysia', 'Singapore', 'Thailand', 'Philippines', 'Vietnam', 'India', 'China', 'Japan', 'South Korea', 'United States', 'United Kingdom', 'Australia', 'Canada', 'Germany', 'France', 'Netherlands', 'UAE', 'Saudi Arabia', 'Other'];

  const [activeModal, setActiveModal] = useState<'email' | 'phone' | 'kyc' | '2fa' | null>(null);
  const [phoneInput, setPhoneInput] = useState(profile?.phone || '');
  const [kycFile, setKycFile] = useState<File | null>(null);
  const [kycDocType, setKycDocType] = useState('passport');
  const [kycNotes, setKycNotes] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const kycFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setPhoneInput(profile?.phone || ''); }, [profile?.phone]);

  const handleEmailVerifyRequest = async () => {
    if (!profile) return;
    setModalLoading(true);
    try {
      const { error: updateError } = await supabase.from('users').update({ email_verified: false, updated_at: new Date().toISOString() }).eq('id', profile.id);
      if (updateError) throw updateError;
      await supabase.from('admin_notifications').insert({ type: 'email_verification_request', title: 'Email Verification Request', message: `User ${profile.full_name || profile.email} (${profile.email}) has requested email verification.`, user_id: profile.id, is_read: false });
      await onUpdate({ email_verified: false });
      setToast({ message: 'Email verification request sent. Admin will review and verify your email.', type: 'success' });
      setActiveModal(null);
    } catch (e: any) {
      setToast({ message: e.message || 'Failed to send request', type: 'error' });
    } finally { setModalLoading(false); }
  };

  const handlePhoneSubmit = async () => {
    if (!profile) return;
    if (!phoneInput.trim()) { setToast({ message: 'Please enter a phone number', type: 'error' }); return; }
    if (!/^\+?[\d\s\-()]{7,20}$/.test(phoneInput)) { setToast({ message: 'Invalid phone number format', type: 'error' }); return; }
    setModalLoading(true);
    try {
      const { error } = await supabase.from('users').update({ phone: phoneInput.trim(), phone_verified: false, updated_at: new Date().toISOString() }).eq('id', profile.id);
      if (error) throw error;
      await supabase.from('admin_notifications').insert({ type: 'phone_verification_request', title: 'Phone Verification Request', message: `User ${profile.full_name || profile.email} (${profile.email}) submitted phone number: ${phoneInput.trim()} for verification.`, user_id: profile.id, is_read: false });
      await onUpdate({ phone: phoneInput.trim(), phone_verified: false });
      setToast({ message: 'Phone number submitted. Admin will verify your number.', type: 'success' });
      setActiveModal(null);
    } catch (e: any) {
      setToast({ message: e.message || 'Failed to submit phone number', type: 'error' });
    } finally { setModalLoading(false); }
  };

  const handleKycSubmit = async () => {
    if (!profile) return;
    if (!kycFile) { setToast({ message: 'Please upload a document', type: 'error' }); return; }
    setModalLoading(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (ev) => resolve(ev.target?.result as string);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(kycFile);
      });
      const { error } = await supabase.from('users').update({ kyc_status: 'pending', kyc_document_url: dataUrl, kyc_document_type: kycDocType, kyc_notes: kycNotes.trim() || null, kyc_submitted_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', profile.id);
      if (error) throw error;
      await supabase.from('admin_notifications').insert({ type: 'kyc_submission', title: 'KYC Document Submitted', message: `User ${profile.full_name || profile.email} (${profile.email}) submitted KYC documents. Document type: ${kycDocType}. ${kycNotes.trim() ? `Notes: ${kycNotes.trim()}` : ''}`.trim(), user_id: profile.id, is_read: false });
      await onUpdate({ kyc_status: 'pending' });
      setToast({ message: 'KYC documents submitted. Admin will review within 1-3 business days.', type: 'success' });
      setActiveModal(null);
      setKycFile(null);
      setKycNotes('');
    } catch (e: any) {
      setToast({ message: e.message || 'Failed to submit KYC', type: 'error' });
    } finally { setModalLoading(false); }
  };

  const handle2FAToggle = async () => {
    if (!profile) return;
    setModalLoading(true);
    try {
      const newVal = !profile.two_factor_enabled;
      const { error } = await supabase.from('users').update({ two_factor_enabled: newVal, updated_at: new Date().toISOString() }).eq('id', profile.id);
      if (error) throw error;
      await onUpdate({ two_factor_enabled: newVal });
      setToast({ message: `2FA ${newVal ? 'enabled' : 'disabled'} successfully.`, type: 'success' });
      setActiveModal(null);
    } catch (e: any) {
      setToast({ message: e.message || 'Failed to update 2FA', type: 'error' });
    } finally { setModalLoading(false); }
  };

  const ModalOverlay = ({ children, onClose }: { children: React.ReactNode; onClose: () => void }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-md rounded-2xl border border-white/10 p-6 space-y-4" style={{ background: 'rgba(15,23,42,0.98)', boxShadow: '0 24px 64px rgba(0,0,0,0.8)' }}>
        {children}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
      <input ref={kycFileRef} type="file" accept="image/*,.pdf" className="hidden" onChange={e => setKycFile(e.target.files?.[0] || null)} />

      <GlassCard style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(99,102,241,0.05) 50%, rgba(168,85,247,0.08) 100%)', borderColor: 'rgba(59,130,246,0.2)' }}>
        <div className="p-5">
          <div className="flex items-start gap-4">
            <div className="relative flex-shrink-0">
              <div className="w-20 h-20 rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #1e3a5f, #1e1b4b)', border: '2px solid rgba(59,130,246,0.3)', boxShadow: '0 0 20px rgba(59,130,246,0.15)' }}>
                {avatarUrl ? <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-blue-300">{initials}</div>}
                {uploadingAvatar && <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)' }}><span className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" /></div>}
              </div>
              <button onClick={() => fileInputRef.current?.click()} disabled={uploadingAvatar} className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-xl flex items-center justify-center transition-all hover:scale-110 active:scale-95" style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)', boxShadow: '0 4px 12px rgba(59,130,246,0.4)', border: '2px solid rgba(0,0,0,0.5)' }}>
                <Camera size={12} className="text-white" />
              </button>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h3 className="text-lg font-bold text-white truncate">{profile?.full_name || 'Pengguna'}</h3>
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: statusCfg.bg, color: statusCfg.color, border: `1px solid ${statusCfg.border}` }}>{statusCfg.icon} {statusCfg.label}</span>
              </div>
              <div className="text-xs text-slate-400 mb-2 truncate">{profile?.email}</div>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-[10px] font-mono text-slate-500 bg-white/5 px-2 py-0.5 rounded-md border border-white/8">{accountId}</span>
                <span className="text-[10px] text-slate-500">Member since {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—'}</span>
              </div>
            </div>
            <button onClick={() => setEditing(v => !v)} className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all hover:scale-105 active:scale-95" style={{ background: editing ? 'rgba(16,185,129,0.15)' : 'rgba(59,130,246,0.1)', color: editing ? '#10b981' : '#94a3b8', border: `1px solid ${editing ? 'rgba(16,185,129,0.3)' : 'rgba(59,130,246,0.3)'}` }}>
              {editing ? <X size={12} /> : <Edit2 size={12} />} {editing ? 'Cancel' : 'Edit'}
            </button>
          </div>
          {editing && (
            <div className="mt-4 pt-4 border-t border-white/8 space-y-3" style={{ animation: 'expandDown 0.25s cubic-bezier(0.34,1.56,0.64,1)' }}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[{ label: 'Full Name', key: 'full_name', placeholder: 'Your full name' }, { label: 'Phone Number', key: 'phone', placeholder: '+1 xxx xxxx xxxx' }, { label: 'Username', key: 'username', placeholder: 'Your username' }].map(({ label, key, placeholder }) => (
                  <div key={key}>
                    <label className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5 block">{label}</label>
                    <input value={form[key as keyof typeof form]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder={placeholder} className="w-full rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none transition-all" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.3)' }} onFocus={e => { e.target.style.borderColor = 'rgba(59,130,246,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1), inset 0 1px 3px rgba(0,0,0,0.3)'; }} onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }} />
                  </div>
                ))}
                <div>
                  <label className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5 block">Country</label>
                  <select value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} className="w-full rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none transition-all" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <option value="">Select country</option>
                    {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5 block">Timezone</label>
                  <select value={form.timezone} onChange={e => setForm(f => ({ ...f, timezone: e.target.value }))} className="w-full rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none transition-all" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <option value="">Select timezone</option>
                    {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
                  </select>
                </div>
              </div>
              <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100" style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)', boxShadow: '0 4px 16px rgba(59,130,246,0.25)' }}>
                {saving ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Check size={14} />} Save Changes
              </button>
            </div>
          )}
        </div>
      </GlassCard>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Email', value: profile?.email_verified ? 'Verified' : 'Unverified', color: profile?.email_verified ? '#10b981' : '#64748b', icon: <BadgeCheck size={14} />, modal: 'email' as const, actionLabel: profile?.email_verified ? 'Verified ✓' : 'Request Verify', disabled: !!profile?.email_verified },
          { label: 'Phone', value: profile?.phone_verified ? 'Verified' : (profile?.phone ? 'Pending' : 'Unverified'), color: profile?.phone_verified ? '#10b981' : (profile?.phone ? '#f59e0b' : '#64748b'), icon: <Smartphone size={14} />, modal: 'phone' as const, actionLabel: profile?.phone_verified ? 'Verified ✓' : (profile?.phone ? 'Update Number' : 'Add Number'), disabled: false },
          { label: 'KYC', value: kycCfg.label, color: kycCfg.color, icon: <Fingerprint size={14} />, modal: 'kyc' as const, actionLabel: profile?.kyc_status === 'verified' ? 'Verified ✓' : (profile?.kyc_status === 'pending' ? 'Pending Review' : 'Submit KYC'), disabled: profile?.kyc_status === 'verified' || profile?.kyc_status === 'pending' },
          { label: '2FA', value: profile?.two_factor_enabled ? 'Active' : 'Inactive', color: profile?.two_factor_enabled ? '#10b981' : '#64748b', icon: <ShieldCheck size={14} />, modal: '2fa' as const, actionLabel: profile?.two_factor_enabled ? 'Disable 2FA' : 'Enable 2FA', disabled: false },
        ].map(({ label, value, color, icon, modal, actionLabel, disabled }) => (
          <GlassCard key={label} className="p-3 transition-all" style={{ cursor: disabled ? 'default' : 'pointer', border: `1px solid ${disabled ? 'rgba(255,255,255,0.08)' : `${color}33`}` }} onClick={() => { if (!disabled) setActiveModal(modal); }}>
            <div className="flex items-center gap-1.5 mb-2" style={{ color }}>{icon}<span className="text-[10px] font-semibold uppercase tracking-wider">{label}</span></div>
            <div className="text-sm font-bold mb-1.5" style={{ color }}>{value}</div>
            <div className="text-[10px] font-medium rounded-lg px-2 py-1 text-center transition-all" style={{ background: disabled ? 'rgba(255,255,255,0.04)' : `${color}18`, color: disabled ? '#475569' : color, border: `1px solid ${disabled ? 'rgba(255,255,255,0.06)' : `${color}30`}` }}>{actionLabel}</div>
          </GlassCard>
        ))}
      </div>

      {activeModal === 'email' && (
        <ModalOverlay onClose={() => setActiveModal(null)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2"><div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)' }}><BadgeCheck size={16} className="text-blue-400" /></div><div><div className="text-sm font-bold text-white">Email Verification</div><div className="text-[10px] text-slate-500">Request admin to verify your email</div></div></div>
            <button onClick={() => setActiveModal(null)} className="text-slate-500 hover:text-white transition-colors"><X size={16} /></button>
          </div>
          <div className="rounded-xl p-4 space-y-2" style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)' }}><div className="text-xs font-semibold text-blue-300">Your email address</div><div className="text-sm text-white font-mono">{profile?.email}</div></div>
          <p className="text-xs text-slate-400 leading-relaxed">Click the button below to send an email verification request to our admin team. Your email will be verified within 24 hours.</p>
          <div className="flex gap-2 pt-1">
            <button onClick={handleEmailVerifyRequest} disabled={modalLoading} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)', boxShadow: '0 4px 16px rgba(59,130,246,0.3)' }}>
              {modalLoading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <BadgeCheck size={14} />} Send Verification Request
            </button>
            <button onClick={() => setActiveModal(null)} className="px-4 py-2.5 rounded-xl text-sm text-slate-400 hover:text-white transition-all" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>Cancel</button>
          </div>
        </ModalOverlay>
      )}

      {activeModal === 'phone' && (
        <ModalOverlay onClose={() => setActiveModal(null)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2"><div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)' }}><Smartphone size={16} className="text-emerald-400" /></div><div><div className="text-sm font-bold text-white">Phone Verification</div><div className="text-[10px] text-slate-500">Add or update your phone number</div></div></div>
            <button onClick={() => setActiveModal(null)} className="text-slate-500 hover:text-white transition-colors"><X size={16} /></button>
          </div>
          <div><label className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5 block">Phone Number</label><input value={phoneInput} onChange={e => setPhoneInput(e.target.value)} placeholder="+1 xxx xxxx xxxx" className="w-full rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none transition-all" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} onFocus={e => { e.target.style.borderColor = 'rgba(16,185,129,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.1)'; }} onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }} /></div>
          <p className="text-xs text-slate-400 leading-relaxed">Enter your phone number with country code (e.g. +62 for Indonesia). Admin will verify it within 24 hours.</p>
          <div className="flex gap-2 pt-1">
            <button onClick={handlePhoneSubmit} disabled={modalLoading || !phoneInput.trim()} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 4px 16px rgba(16,185,129,0.3)' }}>
              {modalLoading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Smartphone size={14} />} Submit Phone Number
            </button>
            <button onClick={() => setActiveModal(null)} className="px-4 py-2.5 rounded-xl text-sm text-slate-400 hover:text-white transition-all" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>Cancel</button>
          </div>
        </ModalOverlay>
      )}

      {activeModal === 'kyc' && (
        <ModalOverlay onClose={() => setActiveModal(null)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2"><div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)' }}><Fingerprint size={16} className="text-amber-400" /></div><div><div className="text-sm font-bold text-white">KYC Verification</div><div className="text-[10px] text-slate-500">Submit identity documents for review</div></div></div>
            <button onClick={() => setActiveModal(null)} className="text-slate-500 hover:text-white transition-colors"><X size={16} /></button>
          </div>
          <div><label className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5 block">Document Type</label><select value={kycDocType} onChange={e => setKycDocType(e.target.value)} className="w-full rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none transition-all" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}><option value="passport">Passport</option><option value="national_id">National ID Card</option><option value="drivers_license">Driver's License</option></select></div>
          <div><label className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5 block">Upload Document</label><button onClick={() => kycFileRef.current?.click()} className="w-full rounded-xl px-3 py-3 text-sm transition-all hover:border-amber-500/40 flex items-center justify-center gap-2" style={{ background: 'rgba(255,255,255,0.03)', border: `2px dashed ${kycFile ? 'rgba(245,158,11,0.5)' : 'rgba(255,255,255,0.12)'}`, color: kycFile ? '#f59e0b' : '#64748b' }}><Upload size={14} />{kycFile ? kycFile.name : 'Click to upload (JPG, PNG, PDF — max 5MB)'}</button></div>
          <div><label className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5 block">Additional Notes (optional)</label><textarea value={kycNotes} onChange={e => setKycNotes(e.target.value)} placeholder="Any additional information for the admin..." rows={2} className="w-full rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none transition-all resize-none" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} /></div>
          <div className="flex gap-2 pt-1">
            <button onClick={handleKycSubmit} disabled={modalLoading || !kycFile} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', boxShadow: '0 4px 16px rgba(245,158,11,0.3)' }}>
              {modalLoading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Upload size={14} />} Submit KYC Documents
            </button>
            <button onClick={() => setActiveModal(null)} className="px-4 py-2.5 rounded-xl text-sm text-slate-400 hover:text-white transition-all" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>Cancel</button>
          </div>
        </ModalOverlay>
      )}

      {activeModal === '2fa' && (
        <ModalOverlay onClose={() => setActiveModal(null)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2"><div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)' }}><ShieldCheck size={16} className="text-indigo-400" /></div><div><div className="text-sm font-bold text-white">Two-Factor Authentication</div><div className="text-[10px] text-slate-500">Manage your 2FA security setting</div></div></div>
            <button onClick={() => setActiveModal(null)} className="text-slate-500 hover:text-white transition-colors"><X size={16} /></button>
          </div>
          <div className="rounded-xl p-4 space-y-2" style={{ background: profile?.two_factor_enabled ? 'rgba(16,185,129,0.06)' : 'rgba(99,102,241,0.06)', border: `1px solid ${profile?.two_factor_enabled ? 'rgba(16,185,129,0.2)' : 'rgba(99,102,241,0.2)'}` }}>
            <div className="flex items-center gap-2"><span className={`w-2 h-2 rounded-full ${profile?.two_factor_enabled ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} /><span className="text-sm font-semibold" style={{ color: profile?.two_factor_enabled ? '#10b981' : '#94a3b8' }}>2FA is currently {profile?.two_factor_enabled ? 'ENABLED' : 'DISABLED'}</span></div>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">{profile?.two_factor_enabled ? 'Disabling 2FA will reduce the security of your account. Are you sure you want to proceed?' : 'Enabling 2FA adds an extra layer of security to your account. Your request will be processed immediately.'}</p>
          <div className="flex gap-2 pt-1">
            <button onClick={handle2FAToggle} disabled={modalLoading} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-50" style={{ background: profile?.two_factor_enabled ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'linear-gradient(135deg, #6366f1, #4f46e5)', boxShadow: profile?.two_factor_enabled ? '0 4px 16px rgba(239,68,68,0.3)' : '0 4px 16px rgba(99,102,241,0.3)' }}>
              {modalLoading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <ShieldCheck size={14} />} {profile?.two_factor_enabled ? 'Disable 2FA' : 'Enable 2FA'}
            </button>
            <button onClick={() => setActiveModal(null)} className="px-4 py-2.5 rounded-xl text-sm text-slate-400 hover:text-white transition-all" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>Cancel</button>
          </div>
        </ModalOverlay>
      )}

      <GlassCard>
        <div className="px-5 py-3.5 border-b border-white/8 flex items-center gap-2"><Cpu size={13} className="text-indigo-400" /><span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Trading Account</span></div>
        <div className="p-5 grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[{ label: 'Account ID', value: accountId }, { label: 'Account Type', value: 'Standard' }, { label: 'Currency', value: 'USD' }, { label: 'Username', value: profile?.username || '—' }, { label: 'Country', value: profile?.country || '—' }, { label: 'Timezone', value: profile?.timezone || '—' }].map(({ label, value }) => (
            <div key={label}><div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">{label}</div><div className="text-sm font-semibold text-white">{value}</div></div>
          ))}
        </div>
      </GlassCard>

      <GlassCard style={{ borderColor: 'rgba(168,85,247,0.2)', background: 'rgba(168,85,247,0.04)' }}>
        <div className="px-5 py-3.5 border-b border-white/8 flex items-center gap-2"><Users size={13} className="text-purple-400" /><span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Affiliate Program</span></div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {[{ label: 'Referral Code', value: referralCode, mono: true }, { label: 'Total Referral', value: String(profile?.referral_count ?? 0) }, { label: 'Total Earnings', value: `$${formatCurrency(profile?.referral_earnings ?? 0)}` }].map(({ label, value, mono }) => (
              <div key={label} className="text-center p-3 rounded-xl" style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.15)' }}><div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">{label}</div><div className={`text-sm font-bold text-purple-300 ${mono ? 'font-mono' : ''}`}>{value}</div></div>
            ))}
          </div>
          <div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1"><Link2 size={10} /> Referral Link</div>
            <div className="flex items-center gap-2">
              <div className="flex-1 rounded-xl px-3 py-2 text-xs text-slate-400 font-mono truncate" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>{referralLink}</div>
              <button onClick={() => handleCopyReferral(referralLink)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all hover:scale-105 active:scale-95 flex-shrink-0" style={{ background: copied ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.06)', color: copied ? '#10b981' : '#94a3b8', border: `1px solid ${copied ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.1)'}` }}>
                {copied ? <Check size={12} /> : <Copy size={12} />} {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        </div>
      </GlassCard>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Trades', value: stats.totalTrades.toString(), color: '#3b82f6', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.2)' },
          { label: 'Win Rate', value: `${stats.winRate.toFixed(1)}%`, color: stats.winRate >= 50 ? '#10b981' : '#ef4444', bg: stats.winRate >= 50 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', border: stats.winRate >= 50 ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)' },
          { label: 'Total P&L', value: `${netPnL >= 0 ? '+' : ''}$${formatCurrency(netPnL)}`, color: netPnL >= 0 ? '#10b981' : '#ef4444', bg: netPnL >= 0 ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)', border: netPnL >= 0 ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)' },
          { label: 'Level', value: levelInfo.level, color: levelInfo.color, bg: `${levelInfo.color}14`, border: `${levelInfo.color}33` },
        ].map(({ label, value, color, bg, border }) => (
          <div key={label} className="rounded-2xl p-4 text-center transition-all hover:scale-105" style={{ background: bg, border: `1px solid ${border}` }}>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">{label}</div>
            <div className="text-xl font-bold" style={{ color }}>{value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Section: Security ────────────────────────────────────────────────────────

function SecuritySection() {
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwForm, setPwForm] = useState({ old: '', new: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  const handleChangePassword = async () => {
    if (pwForm.new !== pwForm.confirm) { setToast({ message: 'New passwords do not match', type: 'error' }); return; }
    if (pwForm.new.length < 8) { setToast({ message: 'Password must be at least 8 characters', type: 'error' }); return; }
    setSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: pwForm.new });
      if (error) throw error;
      setToast({ message: 'Password changed successfully', type: 'success' });
      setPwForm({ old: '', new: '', confirm: '' });
    } catch (e: any) {
      setToast({ message: e.message || 'Failed to change password', type: 'error' });
    } finally { setSaving(false); }
  };

  const loginHistory = [
    { device: 'Chrome / Windows', ip: '103.xxx.xxx.xxx', time: new Date(Date.now() - 3600000).toISOString(), status: 'current' },
    { device: 'Mobile Safari / iOS', ip: '180.xxx.xxx.xxx', time: new Date(Date.now() - 86400000).toISOString(), status: 'past' },
    { device: 'Firefox / macOS', ip: '36.xxx.xxx.xxx', time: new Date(Date.now() - 172800000).toISOString(), status: 'past' },
  ];

  return (
    <div className="space-y-4">
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}
      <GlassCard style={{ borderColor: 'rgba(16,185,129,0.2)', background: 'rgba(16,185,129,0.03)' }}>
        <div className="px-5 py-3.5 border-b border-white/8 flex items-center gap-2"><Shield size={13} className="text-emerald-400" /><span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Change Password</span></div>
        <div className="p-5 space-y-3">
          {[{ label: 'Current Password', key: 'old', show: showOld, toggle: () => setShowOld(v => !v) }, { label: 'New Password', key: 'new', show: showNew, toggle: () => setShowNew(v => !v) }, { label: 'Confirm New Password', key: 'confirm', show: showConfirm, toggle: () => setShowConfirm(v => !v) }].map(({ label, key, show, toggle }) => (
            <div key={key}>
              <label className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5 block">{label}</label>
              <div className="relative">
                <input type={show ? 'text' : 'password'} value={pwForm[key as keyof typeof pwForm]} onChange={e => setPwForm(f => ({ ...f, [key]: e.target.value }))} placeholder="••••••••" className="w-full rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none transition-all" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.3)' }} onFocus={e => { e.target.style.borderColor = 'rgba(16,185,129,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.1), inset 0 1px 3px rgba(0,0,0,0.3)'; }} onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }} />
                <button onClick={toggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">{show ? <EyeOff size={14} /> : <Eye size={14} />}</button>
              </div>
            </div>
          ))}
          <button onClick={handleChangePassword} disabled={saving || !pwForm.old || !pwForm.new || !pwForm.confirm} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100" style={{ background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 4px 16px rgba(16,185,129,0.25)' }}>
            {saving ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Shield size={14} />} Change Password
          </button>
        </div>
      </GlassCard>
      <GlassCard>
        <div className="px-5 py-3.5 border-b border-white/8 flex items-center gap-2"><Clock size={13} className="text-slate-400" /><span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Login History</span></div>
        <div className="divide-y divide-white/5">
          {loginHistory.map((item, i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-3.5 hover:bg-white/2 transition-colors">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${item.status === 'current' ? 'text-emerald-400' : 'text-slate-500'}`} style={{ background: item.status === 'current' ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.04)', border: `1px solid ${item.status === 'current' ? 'rgba(16,185,129,0.25)' : 'rgba(255,255,255,0.06)'}` }}>
                {item.device.includes('Mobile') ? <Smartphone size={15} /> : <Monitor size={15} />}
              </div>
              <div className="flex-1"><div className="text-sm font-medium text-white">{item.device}</div><div className="text-[10px] text-slate-500">{item.ip} · {formatDate(item.time)}</div></div>
              {item.status === 'current' && <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400 px-2 py-1 rounded-full" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)' }}><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Active</span>}
            </div>
          ))}
        </div>
      </GlassCard>
      <GlassCard style={{ borderColor: 'rgba(239,68,68,0.15)', background: 'rgba(239,68,68,0.03)' }}>
        <div className="px-5 py-3.5 border-b border-white/8 flex items-center justify-between"><div className="flex items-center gap-2"><Zap size={13} className="text-red-400" /><span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Active Session</span></div><button className="text-xs text-red-400 hover:text-red-300 transition-colors font-medium">End All</button></div>
        <div className="p-5"><div className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)' }}><div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /><span className="text-sm text-white font-medium">Current Session</span></div><span className="text-[10px] text-slate-500">Active now</span></div></div>
      </GlassCard>
    </div>
  );
}

// ─── Section: Wallet ──────────────────────────────────────────────────────────

const PAYMENT_METHODS = ['Bank Transfer', 'QRIS', 'OVO', 'GoPay', 'Dana', 'ShopeePay', 'Crypto (USDT)', 'Crypto (BTC)', 'Paypal'];

function depositStatusBadge(status: string) {
  if (status === 'approved') return 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/25';
  if (status === 'rejected') return 'text-red-400 bg-red-500/10 border border-red-500/25';
  return 'text-yellow-400 bg-yellow-500/10 border border-yellow-500/25';
}
function depositStatusLabel(status: string) {
  if (status === 'approved') return 'Approved';
  if (status === 'rejected') return 'Rejected';
  return 'Pending';
}
function withdrawalStatusBadge(status: string) {
  if (status === 'completed') return 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/25';
  if (status === 'rejected') return 'text-red-400 bg-red-500/10 border border-red-500/25';
  if (status === 'processing') return 'text-blue-400 bg-blue-500/10 border border-blue-500/25';
  return 'text-yellow-400 bg-yellow-500/10 border border-yellow-500/25';
}
function withdrawalStatusLabel(status: string) {
  if (status === 'completed') return 'Completed';
  if (status === 'rejected') return 'Rejected';
  if (status === 'processing') return 'Processing';
  return 'Pending';
}

function WalletSection({ userId, wallet, deposits, withdrawals, transactions, profile, onResetDemo, onRefresh, onUpdateProfile }: { userId: string; wallet: WalletData | null; deposits: DepositRecord[]; withdrawals: WithdrawalRecord[]; transactions: TransactionRecord[]; profile: UserProfile | null; onResetDemo: () => Promise<void>; onRefresh: () => Promise<void>; onUpdateProfile: (data: Partial<UserProfile>) => Promise<void> }) {
  const supabase = createClient();
  const [tab, setTab] = useState<'deposit' | 'withdrawal' | 'history'>('deposit');
  const [toast, setToast] = useState<ToastState | null>(null);
  const [resetting, setResetting] = useState(false);
  const [countryPaymentMethods, setCountryPaymentMethods] = useState<string[]>([]);

  useEffect(() => {
    const fetchCountryMethods = async () => {
      const userCountry = profile?.country || '';
      if (!userCountry) { setCountryPaymentMethods(PAYMENT_METHODS); return; }
      const { data } = await supabase.from('payment_methods').select('name').eq('is_active', true).or(`country.eq.${userCountry},country.eq.Global`).order('name');
      if (data && data.length > 0) { setCountryPaymentMethods(data.map((m: { name: string }) => m.name)); }
      else {
        const { data: globalData } = await supabase.from('payment_methods').select('name').eq('is_active', true).eq('country', 'Global').order('name');
        setCountryPaymentMethods(globalData ? globalData.map((m: { name: string }) => m.name) : []);
      }
    };
    fetchCountryMethods();
  }, [profile?.country]);

  const [editingFinancial, setEditingFinancial] = useState(false);
  const [financialForm, setFinancialForm] = useState({ account_holder: profile?.account_holder || '', bank_name: profile?.bank_name || '', account_number: profile?.account_number || '', preferred_payment_method: profile?.preferred_payment_method || '', preferred_currency: profile?.preferred_currency || 'USD' });
  const [savingFinancial, setSavingFinancial] = useState(false);

  useEffect(() => {
    if (profile) setFinancialForm({ account_holder: profile.account_holder || '', bank_name: profile.bank_name || '', account_number: profile.account_number || '', preferred_payment_method: profile.preferred_payment_method || '', preferred_currency: profile.preferred_currency || 'USD' });
  }, [profile]);

  const handleSaveFinancial = async () => {
    setSavingFinancial(true);
    try {
      const { error } = await supabase.from('users').update({ ...financialForm, updated_at: new Date().toISOString() }).eq('id', userId);
      if (error) throw error;
      await onUpdateProfile(financialForm);
      setToast({ message: 'Financial information saved successfully', type: 'success' });
      setEditingFinancial(false);
    } catch (e: any) {
      setToast({ message: e.message || 'Failed to save financial information', type: 'error' });
    } finally { setSavingFinancial(false); }
  };

  const [depositForm, setDepositForm] = useState({ amount: '', payment_method: '', payment_reference: '' });
  const [submittingDeposit, setSubmittingDeposit] = useState(false);

  const handleSubmitDeposit = async () => {
    const amount = parseFloat(depositForm.amount);
    if (!amount || amount <= 0) { setToast({ message: 'Please enter a valid deposit amount', type: 'error' }); return; }
    if (amount < 100) { setToast({ message: 'Minimum deposit amount is $100', type: 'error' }); return; }
    if (!depositForm.payment_method) { setToast({ message: 'Please select a payment method', type: 'error' }); return; }
    setSubmittingDeposit(true);
    try {
      const { error } = await supabase.from('deposits').insert({ user_id: userId, amount, currency: 'USD', payment_method: depositForm.payment_method, payment_reference: depositForm.payment_reference || null, status: 'pending' });
      if (error) throw error;
      setToast({ message: 'Deposit request submitted. Awaiting admin confirmation.', type: 'success' });
      setDepositForm({ amount: '', payment_method: '', payment_reference: '' });
      await onRefresh();
    } catch (e: any) {
      setToast({ message: e.message || 'Failed to submit deposit request', type: 'error' });
    } finally { setSubmittingDeposit(false); }
  };

  const [withdrawalForm, setWithdrawalForm] = useState({ amount: '', payment_method: '', destination_address: '' });
  const [submittingWithdrawal, setSubmittingWithdrawal] = useState(false);

  const handleSubmitWithdrawal = async () => {
    const amount = parseFloat(withdrawalForm.amount);
    if (!amount || amount <= 0) { setToast({ message: 'Please enter a valid withdrawal amount', type: 'error' }); return; }
    if (amount > (wallet?.realBalance ?? 0)) { setToast({ message: 'Insufficient real balance', type: 'error' }); return; }
    if (!withdrawalForm.payment_method) { setToast({ message: 'Please select a withdrawal method', type: 'error' }); return; }
    if (!withdrawalForm.destination_address) { setToast({ message: 'Please enter a destination account', type: 'error' }); return; }
    setSubmittingWithdrawal(true);
    try {
      const { error } = await supabase.from('withdrawals').insert({ user_id: userId, amount, currency: 'USD', payment_method: withdrawalForm.payment_method, destination_address: withdrawalForm.destination_address, status: 'pending' });
      if (error) throw error;
      setToast({ message: 'Withdrawal request submitted successfully.', type: 'success' });
      setWithdrawalForm({ amount: '', payment_method: '', destination_address: '' });
      await onRefresh();
    } catch (e: any) {
      setToast({ message: e.message || 'Failed to submit withdrawal request', type: 'error' });
    } finally { setSubmittingWithdrawal(false); }
  };

  const handleResetDemo = async () => {
    setResetting(true);
    try { await onResetDemo(); setToast({ message: 'Demo balance reset to $100,000', type: 'success' }); }
    catch { setToast({ message: 'Failed to reset demo balance', type: 'error' }); }
    finally { setResetting(false); }
  };

  const inputStyle = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' };

  return (
    <div className="space-y-4">
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <GlassCard className="p-4" style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(99,102,241,0.08))', borderColor: 'rgba(59,130,246,0.25)' }}>
          <div className="flex items-center justify-between mb-3"><span className="text-[10px] font-semibold text-blue-400 uppercase tracking-wider flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" /> Demo Balance</span><button onClick={handleResetDemo} disabled={resetting} className="text-[10px] text-blue-400/60 hover:text-blue-400 transition-colors flex items-center gap-1"><RotateCcw size={10} className={resetting ? 'animate-spin' : ''} /> Reset</button></div>
          <div className="text-2xl font-bold text-white">${formatCurrency(wallet?.demoBalance ?? 0)}</div>
          <div className="text-[10px] text-slate-500 mt-1">Demo Account</div>
        </GlassCard>
        <GlassCard className="p-4" style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(234,88,12,0.08))', borderColor: 'rgba(245,158,11,0.25)' }}>
          <div className="flex items-center gap-1 mb-3"><span className="w-1.5 h-1.5 rounded-full bg-amber-400" /><span className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider">Real Balance</span></div>
          <div className="text-2xl font-bold text-white">${formatCurrency(wallet?.realBalance ?? 0)}</div>
          <div className="text-[10px] text-slate-500 mt-1">Real Account</div>
        </GlassCard>
        <GlassCard className="p-4" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' }}>
          <div className="flex items-center gap-1 mb-3"><DollarSign size={11} className="text-slate-400" /><span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Currency</span></div>
          <div className="text-2xl font-bold text-white">USD</div>
          <div className="text-[10px] text-slate-500 mt-1">US Dollar</div>
        </GlassCard>
      </div>

      <GlassCard style={{ borderColor: 'rgba(245,158,11,0.2)', background: 'rgba(245,158,11,0.03)' }}>
        <div className="px-5 py-3.5 border-b border-white/8 flex items-center justify-between">
          <div className="flex items-center gap-2"><CreditCard size={13} className="text-amber-400" /><span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Financial Information</span></div>
          <button onClick={() => setEditingFinancial(v => !v)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all hover:scale-105 active:scale-95" style={{ background: editingFinancial ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)', color: editingFinancial ? '#ef4444' : '#f59e0b', border: `1px solid ${editingFinancial ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)'}` }}>
            {editingFinancial ? <X size={11} /> : <Edit2 size={11} />} {editingFinancial ? 'Cancel' : 'Edit'}
          </button>
        </div>
        <div className="p-5">
          {editingFinancial ? (
            <div className="space-y-3" style={{ animation: 'expandDown 0.25s cubic-bezier(0.34,1.56,0.64,1)' }}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><label className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5 block">Account Holder Name</label><input value={financialForm.account_holder} onChange={e => setFinancialForm(f => ({ ...f, account_holder: e.target.value }))} placeholder="Name as per bank account" className="w-full rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none transition-all" style={inputStyle} onFocus={e => { e.target.style.borderColor = 'rgba(245,158,11,0.5)'; }} onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; }} /></div>
                <div><label className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5 block">Bank Name</label><input value={financialForm.bank_name} onChange={e => setFinancialForm(f => ({ ...f, bank_name: e.target.value }))} placeholder="e.g. BCA, Mandiri, BRI" className="w-full rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none transition-all" style={inputStyle} onFocus={e => { e.target.style.borderColor = 'rgba(245,158,11,0.5)'; }} onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; }} /></div>
                <div><label className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5 block">Account Number</label><input value={financialForm.account_number} onChange={e => setFinancialForm(f => ({ ...f, account_number: e.target.value }))} placeholder="Bank account number" className="w-full rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none transition-all" style={inputStyle} onFocus={e => { e.target.style.borderColor = 'rgba(245,158,11,0.5)'; }} onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; }} /></div>
                <div><label className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5 block">Payment Method</label><select value={financialForm.preferred_payment_method} onChange={e => setFinancialForm(f => ({ ...f, preferred_payment_method: e.target.value }))} className="w-full rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none transition-all" style={inputStyle}><option value="">Select method</option>{countryPaymentMethods.map(m => <option key={m} value={m}>{m}</option>)}</select></div>
                <div><label className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5 block">Currency</label><select value={financialForm.preferred_currency} onChange={e => setFinancialForm(f => ({ ...f, preferred_currency: e.target.value }))} className="w-full rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none transition-all" style={inputStyle}><option value="USD">USD</option><option value="IDR">IDR</option><option value="SGD">SGD</option><option value="MYR">MYR</option><option value="EUR">EUR</option><option value="GBP">GBP</option></select></div>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button onClick={handleSaveFinancial} disabled={savingFinancial} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', boxShadow: '0 4px 16px rgba(245,158,11,0.25)' }}>
                  {savingFinancial ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Check size={14} />} Save Information
                </button>
                <button onClick={() => setEditingFinancial(false)} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm text-slate-400 hover:text-white transition-all" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}><X size={13} /> Cancel</button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[{ label: 'Account Holder Name', value: profile?.account_holder || '—' }, { label: 'Bank Name', value: profile?.bank_name || '—' }, { label: 'Account Number', value: profile?.account_number || '—' }, { label: 'Payment Method', value: profile?.preferred_payment_method || '—' }, { label: 'Currency', value: profile?.preferred_currency || 'USD' }].map(({ label, value }) => (
                <div key={label}><div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">{label}</div><div className="text-sm font-semibold text-white">{value}</div></div>
              ))}
            </div>
          )}
        </div>
      </GlassCard>

      <GlassCard className="overflow-hidden">
        <div className="flex border-b border-white/8">
          {([{ key: 'deposit', label: 'Deposit', icon: <ArrowDownCircle size={13} />, color: '#10b981' }, { key: 'withdrawal', label: 'Withdrawal', icon: <ArrowUpCircle size={13} />, color: '#ef4444' }, { key: 'history', label: 'History', icon: <List size={13} />, color: '#6366f1' }] as const).map(({ key, label, icon, color }) => (
            <button key={key} onClick={() => setTab(key)} className="flex-1 flex items-center justify-center gap-1.5 py-3.5 text-xs font-semibold transition-all relative" style={{ background: tab === key ? `${color}20` : 'transparent', color: tab === key ? 'white' : '#64748b' }} onMouseEnter={e => { if (tab !== key) { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; (e.currentTarget as HTMLElement).style.color = '#94a3b8'; } }} onMouseLeave={e => { if (tab !== key) { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#64748b'; } }}>
              {icon} {label}
              {tab === key && <span className="absolute bottom-0 w-6 h-0.5 rounded-full" style={{ background: color }} />}
            </button>
          ))}
        </div>
        <div className="p-5">
          {tab === 'deposit' && (
            <div className="space-y-4" style={{ animation: 'fadeSlideIn 0.2s ease-out' }}>
              <div className="space-y-3">
                <div><label className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5 block">Deposit Amount (USD)</label><input type="number" value={depositForm.amount} onChange={e => setDepositForm(f => ({ ...f, amount: e.target.value }))} placeholder="Minimum $100" min="100" className="w-full rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none transition-all" style={inputStyle} onFocus={e => { e.target.style.borderColor = 'rgba(16,185,129,0.5)'; }} onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; }} /></div>
                <div><label className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5 block">Payment Method</label><select value={depositForm.payment_method} onChange={e => setDepositForm(f => ({ ...f, payment_method: e.target.value }))} className="w-full rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none transition-all" style={inputStyle}><option value="">Select method</option>{countryPaymentMethods.map(m => <option key={m} value={m}>{m}</option>)}</select></div>
                <div><label className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5 block">Payment Reference (optional)</label><input value={depositForm.payment_reference} onChange={e => setDepositForm(f => ({ ...f, payment_reference: e.target.value }))} placeholder="Transaction number / payment reference" className="w-full rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none transition-all" style={inputStyle} onFocus={e => { e.target.style.borderColor = 'rgba(16,185,129,0.5)'; }} onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; }} /></div>
                <button onClick={handleSubmitDeposit} disabled={submittingDeposit} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 4px 16px rgba(16,185,129,0.25)' }}>
                  {submittingDeposit ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <ArrowDownCircle size={14} />} Send Deposit Request
                </button>
              </div>
              {deposits.length > 0 && (
                <div><h5 className="text-[10px] text-slate-500 uppercase tracking-wider mb-3">Deposit History</h5>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {deposits.map(d => (
                      <div key={d.id} className="flex items-center justify-between py-2.5 px-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div><div className="text-xs font-semibold text-white">${formatCurrency(d.amount)} {d.currency}</div><div className="text-[10px] text-slate-500">{d.payment_method || '—'} · {formatDate(d.created_at)}</div></div>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${depositStatusBadge(d.status)}`}>{depositStatusLabel(d.status)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          {tab === 'withdrawal' && (
            <div className="space-y-4" style={{ animation: 'fadeSlideIn 0.2s ease-out' }}>
              <div className="p-3 rounded-xl" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}><div className="text-[10px] text-amber-400 font-semibold mb-0.5 uppercase tracking-wider">Real Balance Available</div><div className="text-xl font-bold text-white">${formatCurrency(wallet?.realBalance ?? 0)}</div></div>
              <div className="space-y-3">
                <div><label className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5 block">Withdrawal Amount (USD)</label><input type="number" value={withdrawalForm.amount} onChange={e => setWithdrawalForm(f => ({ ...f, amount: e.target.value }))} placeholder="Minimum $10" min="10" max={wallet?.realBalance ?? 0} className="w-full rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none transition-all" style={inputStyle} onFocus={e => { e.target.style.borderColor = 'rgba(239,68,68,0.5)'; }} onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; }} /></div>
                <div><label className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5 block">Withdrawal Method</label><select value={withdrawalForm.payment_method} onChange={e => setWithdrawalForm(f => ({ ...f, payment_method: e.target.value }))} className="w-full rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none transition-all" style={inputStyle}><option value="">Select method</option>{countryPaymentMethods.map(m => <option key={m} value={m}>{m}</option>)}</select></div>
                <div><label className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5 block">Destination Account</label><input value={withdrawalForm.destination_address} onChange={e => setWithdrawalForm(f => ({ ...f, destination_address: e.target.value }))} placeholder="Account number / wallet address" className="w-full rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none transition-all" style={inputStyle} onFocus={e => { e.target.style.borderColor = 'rgba(239,68,68,0.5)'; }} onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; }} /></div>
                <button onClick={handleSubmitWithdrawal} disabled={submittingWithdrawal} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', boxShadow: '0 4px 16px rgba(239,68,68,0.25)' }}>
                  {submittingWithdrawal ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <ArrowUpCircle size={14} />} Send Withdrawal Request
                </button>
              </div>
              {withdrawals.length > 0 && (
                <div><h5 className="text-[10px] text-slate-500 uppercase tracking-wider mb-3">Withdrawal History</h5>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {withdrawals.map(w => (
                      <div key={w.id} className="flex items-center justify-between py-2.5 px-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div><div className="text-xs font-semibold text-white">${formatCurrency(w.amount)} {w.currency}</div><div className="text-[10px] text-slate-500">{w.payment_method || '—'} · {formatDate(w.created_at)}</div></div>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${withdrawalStatusBadge(w.status)}`}>{withdrawalStatusLabel(w.status)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          {tab === 'history' && (
            <div style={{ animation: 'fadeSlideIn 0.2s ease-out' }}>
              {deposits.length === 0 && withdrawals.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-500"><MessageCircle size={28} className="opacity-30" /><span className="text-xs">No messages yet. Say hello!</span></div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {[...deposits.map(d => ({ id: d.id, type: 'deposit' as const, amount: d.amount, currency: d.currency, method: d.payment_method, status: d.status, created_at: d.created_at })), ...withdrawals.map(w => ({ id: w.id, type: 'withdrawal' as const, amount: w.amount, currency: w.currency, method: w.payment_method, status: w.status, created_at: w.created_at }))].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map(item => (
                    <div key={item.id} className="flex items-center justify-between py-2.5 px-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${item.type === 'deposit' ? 'text-emerald-400' : 'text-red-400'}`} style={{ background: item.type === 'deposit' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', border: `1px solid ${item.type === 'deposit' ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}` }}>
                          {item.type === 'deposit' ? <ArrowDownCircle size={14} /> : <ArrowUpCircle size={14} />}
                        </div>
                        <div><div className="text-xs font-semibold text-white capitalize">{item.type}</div><div className="text-[10px] text-slate-500">{item.method || '—'} · {formatDate(item.created_at)}</div></div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className={`text-xs font-bold ${item.type === 'deposit' ? 'text-emerald-400' : 'text-red-400'}`}>{item.type === 'deposit' ? '+' : '-'}${formatCurrency(item.amount)}</div>
                        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${item.type === 'deposit' ? depositStatusBadge(item.status) : withdrawalStatusBadge(item.status)}`}>{item.type === 'deposit' ? depositStatusLabel(item.status) : withdrawalStatusLabel(item.status)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
}

// ─── Section: Stats ───────────────────────────────────────────────────────────

function StatsSection({ stats }: { stats: TradeStats }) {
  const [chartPeriod, setChartPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const statCards = [
    { label: 'Total Trade', value: stats.totalTrades.toString(), icon: <BarChart2 size={16} />, color: '#3b82f6', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.2)' },
    { label: 'Win Rate', value: `${stats.winRate.toFixed(1)}%`, icon: <TrendingUp size={16} />, color: '#10b981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)' },
    { label: 'Total Profit', value: `+$${formatCurrency(stats.totalProfit)}`, icon: <TrendingUp size={16} />, color: '#10b981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)' },
    { label: 'Total Loss', value: `-$${formatCurrency(Math.abs(stats.totalLoss))}`, icon: <TrendingDown size={16} />, color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)' },
    { label: 'Best Trade', value: `+$${formatCurrency(stats.bestTrade)}`, icon: <Star size={16} />, color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)' },
    { label: 'Worst Trade', value: `-$${formatCurrency(Math.abs(stats.worstTrade))}`, icon: <TrendingDown size={16} />, color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)' },
  ];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {statCards.map(({ label, value, icon, color, bg, border }) => (
          <div key={label} className="rounded-2xl p-4 transition-all hover:scale-105" style={{ background: bg, border: `1px solid ${border}` }}>
            <div className="mb-2" style={{ color }}>{icon}</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">{label}</div>
            <div className="text-lg font-bold" style={{ color }}>{value}</div>
          </div>
        ))}
      </div>
      <GlassCard className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2"><Send size={13} /> Submit Ticket</h4>
          <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
            {(['daily', 'weekly', 'monthly'] as const).map(p => (
              <button key={p} onClick={() => setChartPeriod(p)} className="px-2.5 py-1 text-[10px] font-medium transition-all" style={{ background: chartPeriod === p ? 'rgba(99,102,241,0.3)' : 'transparent', color: chartPeriod === p ? '#a5b4fc' : '#64748b' }}>
                {p === 'daily' ? 'Daily' : p === 'weekly' ? 'Weekly' : 'Monthly'}
              </button>
            ))}
          </div>
        </div>
        {stats.dailyPerformance.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-sm">No performance data yet</div>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={stats.dailyPerformance.slice(-14)}>
              <XAxis dataKey="date" tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 11 }} labelStyle={{ color: '#94a3b8' }} />
              <Bar dataKey="profit" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </GlassCard>
      {stats.favoriteAssets.length > 0 && (
        <GlassCard className="p-5">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Favorite Assets</h4>
          <div className="space-y-3">
            {stats.favoriteAssets.slice(0, 5).map(({ symbol, count }, i) => (
              <div key={symbol} className="flex items-center gap-3">
                <span className="text-xs text-slate-500 w-4 font-mono">{i + 1}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1.5"><span className="text-xs font-semibold text-white">{symbol}</span><span className="text-xs text-slate-400">{count} trades</span></div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}><div className="h-full rounded-full transition-all duration-700" style={{ width: `${(count / stats.favoriteAssets[0].count) * 100}%`, background: 'linear-gradient(90deg, #6366f1, #a855f7)' }} /></div>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
}

// ─── Section: Level ───────────────────────────────────────────────────────────

function LevelSection({ totalTrades }: { totalTrades: number }) {
  const levelInfo = getTraderLevel(totalTrades);
  const badges = [
    { name: 'First Trade', desc: 'First trade', earned: totalTrades >= 1, icon: <Zap size={18} /> },
    { name: 'Active Trader', desc: '10 trades completed', earned: totalTrades >= 10, icon: <TrendingUp size={18} /> },
    { name: 'Bronze Trader', desc: '50 trades completed', earned: totalTrades >= 50, icon: <Award size={18} /> },
    { name: 'Silver Trader', desc: '200 trades completed', earned: totalTrades >= 200, icon: <Star size={18} /> },
    { name: 'Gold Trader', desc: '500 trades completed', earned: totalTrades >= 500, icon: <Trophy size={18} /> },
    { name: 'VIP Member', desc: 'Reach VIP level', earned: totalTrades >= 500, icon: <Award size={18} /> },
  ];
  return (
    <div className="space-y-4">
      <GlassCard className="p-6" style={{ background: `linear-gradient(135deg, ${levelInfo.color}10, ${levelInfo.color}05)`, borderColor: `${levelInfo.color}30` }}>
        <div className="flex items-center gap-4 mb-5">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: `${levelInfo.color}20`, border: `2px solid ${levelInfo.color}40` }}><Trophy size={28} style={{ color: levelInfo.color }} /></div>
          <div><div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Trader Level</div><div className="text-3xl font-bold" style={{ color: levelInfo.color }}>{levelInfo.level}</div><div className="text-xs text-slate-400 mt-1">Total trades: {totalTrades}</div></div>
        </div>
        {levelInfo.level !== 'VIP' && (
          <div>
            <div className="flex items-center justify-between mb-2"><span className="text-xs text-slate-500">Progress to {levelInfo.next}</span><span className="text-xs font-bold" style={{ color: levelInfo.color }}>{levelInfo.progress}%</span></div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}><div className="h-full rounded-full transition-all duration-700" style={{ width: `${levelInfo.progress}%`, background: `linear-gradient(90deg, ${levelInfo.color}, ${levelInfo.color}aa)` }} /></div>
            <div className="text-[10px] text-slate-600 mt-1.5">{levelInfo.nextAt - totalTrades} more trades to reach {levelInfo.next}</div>
          </div>
        )}
      </GlassCard>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[{ level: 'Bronze', color: '#cd7f32', min: 0, max: 49 }, { level: 'Silver', color: '#94a3b8', min: 50, max: 199 }, { level: 'Gold', color: '#f59e0b', min: 200, max: 499 }, { level: 'VIP', color: '#a855f7', min: 500, max: null }].map(({ level, color, min, max }) => (
          <div key={level} className="rounded-2xl p-3 text-center transition-all" style={{ background: levelInfo.level === level ? `${color}12` : 'rgba(255,255,255,0.02)', border: `1px solid ${levelInfo.level === level ? `${color}40` : 'rgba(255,255,255,0.06)'}`, opacity: levelInfo.level === level ? 1 : 0.5 }}>
            <Trophy size={20} style={{ color, margin: '0 auto 6px' }} />
            <div className="text-xs font-bold" style={{ color }}>{level}</div>
            <div className="text-[10px] text-slate-500 mt-1">{min}{max ? `–${max}` : '+'}</div>
          </div>
        ))}
      </div>
      <GlassCard className="p-5">
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Achievement Badges</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {badges.map(({ name, desc, earned, icon }) => (
            <div key={name} className="rounded-2xl p-3 text-center transition-all" style={{ background: earned ? 'rgba(245,158,11,0.08)' : 'rgba(255,255,255,0.02)', border: `1px solid ${earned ? 'rgba(245,158,11,0.25)' : 'rgba(255,255,255,0.06)'}`, opacity: earned ? 1 : 0.4 }}>
              <div className="flex items-center justify-center w-10 h-10 rounded-xl mx-auto mb-2" style={{ background: earned ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.04)', color: earned ? '#f59e0b' : '#475569' }}>{icon}</div>
              <div className="text-xs font-semibold text-white">{name}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">{desc}</div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}

// ─── Section: Activity ────────────────────────────────────────────────────────

function ActivitySection({ activities }: { activities: ActivityLog[] }) {
  const typeIcon = (type: string) => {
    if (type === 'deposit') return <TrendingUp size={14} className="text-emerald-400" />;
    if (type === 'withdrawal') return <TrendingDown size={14} className="text-red-400" />;
    if (type === 'trade') return <BarChart2 size={14} className="text-blue-400" />;
    return <Clock size={14} className="text-slate-400" />;
  };
  const typeBg = (type: string) => {
    if (type === 'deposit') return 'rgba(16,185,129,0.1)';
    if (type === 'withdrawal') return 'rgba(239,68,68,0.1)';
    if (type === 'trade') return 'rgba(59,130,246,0.1)';
    return 'rgba(255,255,255,0.05)';
  };
  return (
    <GlassCard className="overflow-hidden">
      <div className="px-5 py-3.5 border-b border-white/8 flex items-center gap-2"><Clock size={13} className="text-cyan-400" /><span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">All Activity</span></div>
      {activities.length === 0 ? (
        <div className="text-center py-12 text-slate-500 text-sm">No activity yet</div>
      ) : (
        <div className="divide-y divide-white/5 max-h-[500px] overflow-y-auto">
          {activities.map((a) => (
            <div key={a.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-white/2 transition-colors">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: typeBg(a.type) }}>{typeIcon(a.type)}</div>
              <div className="flex-1 min-w-0"><div className="text-xs font-medium text-white truncate">{a.description}</div><div className="text-[10px] text-slate-500">{formatDate(a.created_at)}</div></div>
              {a.amount != null && <div className={`text-xs font-semibold flex-shrink-0 ${a.amount >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{a.amount >= 0 ? '+' : ''}${formatCurrency(Math.abs(a.amount))}</div>}
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
}

// ─── Section: Preferences ─────────────────────────────────────────────────────

function PreferencesSection() {
  const [notifications, setNotifications] = useState({ email: true, push: false, trade: true, deposit: true });
  const [defaultMode, setDefaultMode] = useState<'demo' | 'real'>('demo');
  return (
    <div className="space-y-4">
      <GlassCard className="p-5 space-y-4">
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2"><Bell size={13} /> Notifications</h4>
        {[{ key: 'email', label: 'Email Notifications', desc: 'Receive email notifications' }, { key: 'push', label: 'Push Notifications', desc: 'Browser notifications' }, { key: 'trade', label: 'Trade Alerts', desc: 'Trade result notifications' }, { key: 'deposit', label: 'Deposit & Withdrawal', desc: 'Financial transaction notifications' }].map(({ key, label, desc }) => (
          <div key={key} className="flex items-center justify-between gap-3 py-2.5 border-b border-white/5 last:border-0">
            <div className="min-w-0 flex-1"><div className="text-sm font-medium text-white">{label}</div><div className="text-xs text-slate-500">{desc}</div></div>
            <button onClick={() => setNotifications(n => ({ ...n, [key]: !n[key as keyof typeof n] }))} className="relative flex-shrink-0 w-11 h-6 rounded-full transition-all duration-300 overflow-hidden" style={{ background: notifications[key as keyof typeof notifications] ? 'linear-gradient(135deg, #3b82f6, #6366f1)' : 'rgba(255,255,255,0.1)', boxShadow: notifications[key as keyof typeof notifications] ? '0 0 12px rgba(59,130,246,0.3)' : 'none' }}>
              <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 shadow-md ${notifications[key as keyof typeof notifications] ? 'left-[22px]' : 'left-1'}`} />
            </button>
          </div>
        ))}
      </GlassCard>
      <GlassCard className="p-5 space-y-4">
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2"><Monitor size={13} /> Trading Mode</h4>
        <div>
          <label className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5 block">Default Trading Mode</label>
          <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
            <button onClick={() => setDefaultMode('demo')} className="w-1/2 py-2.5 text-xs font-semibold transition-all" style={{ background: defaultMode === 'demo' ? 'linear-gradient(135deg, #3b82f6, #6366f1)' : 'transparent', color: defaultMode === 'demo' ? 'white' : '#64748b' }}>Demo</button>
            <button onClick={() => setDefaultMode('real')} className="w-1/2 py-2.5 text-xs font-semibold transition-all" style={{ background: defaultMode === 'real' ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'transparent', color: defaultMode === 'real' ? 'white' : '#64748b' }}>Real</button>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}

// ─── Section: Support ─────────────────────────────────────────────────────────

interface SupportFAQ {
  id: string;
  category: string;
  question: string;
  answer: string;
  sort_order: number;
}

interface SupportChatMessage {
  id: string;
  session_id: string;
  sender_type: 'user' | 'admin' | 'bot';
  message: string;
  created_at: string;
}

function SupportSection() {
  const supabase = useMemo(() => createClient(), []);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // ── Ticket state ──
  const [ticketForm, setTicketForm] = useState({ subject: '', message: '', category: 'other' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  // ── FAQ state ──
  const [faqs, setFaqs] = useState<SupportFAQ[]>([]);
  const [faqsLoading, setFaqsLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  // ── Live Chat state ──
  const [chatView, setChatView] = useState(false);
  const [chatSession, setChatSession] = useState<{ id: string; status: string } | null>(null);
  const [chatMessages, setChatMessages] = useState<SupportChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatSending, setChatSending] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);

  // ── Load FAQs from Supabase ──
  useEffect(() => {
    const loadFaqs = async () => {
      const { data } = await supabase.from('faqs').select('id, category, question, answer, sort_order').eq('is_active', true).order('category', { ascending: true }).order('sort_order', { ascending: true });
      setFaqs(data || []);
      setFaqsLoading(false);
    };
    loadFaqs();
  }, []);

  // ── Auto-scroll chat ──
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // ── Open Live Chat ──
  const handleOpenChat = async () => {
    setChatLoading(true);
    setChatView(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setChatLoading(false); return; }
    const { data: existing } = await supabase.from('chat_sessions').select('id, status').eq('user_id', user.id).eq('status', 'active').order('created_at', { ascending: false }).limit(1).maybeSingle();
    let sessionId: string;
    if (existing) {
      sessionId = existing.id;
      setChatSession(existing);
    } else {
      const { data: newSession, error } = await supabase.from('chat_sessions').insert({ user_id: user.id, status: 'active' }).select('id, status').single();
      if (error || !newSession) { setChatLoading(false); return; }
      sessionId = newSession.id;
      setChatSession(newSession);
    }
    const { data: msgs } = await supabase.from('chat_messages').select('id, session_id, sender_type, message, created_at').eq('session_id', sessionId).order('created_at', { ascending: true });
    setChatMessages((msgs as SupportChatMessage[]) || []);
    setChatLoading(false);
  };

  // ── Realtime subscription for chat ──
  useEffect(() => {
    if (!chatSession) return;
    const channelName = `member_chat_${chatSession.id}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `session_id=eq.${chatSession.id}`,
        },
        (payload) => {
          setChatMessages(prev => {
            if (prev.find(m => m.id === (payload.new as SupportChatMessage).id)) return prev;
            return [...prev, payload.new as SupportChatMessage];
          });
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          // Re-fetch messages on channel error as fallback
          supabase
            .from('chat_messages')
            .select('id, session_id, sender_type, message, created_at')
            .eq('session_id', chatSession.id)
            .order('created_at', { ascending: true })
            .then(({ data }) => {
              if (data) setChatMessages(data as SupportChatMessage[]);
            });
        }
      });

    // Polling fallback — re-fetch every 3s in case realtime event is missed
    const pollInterval = setInterval(() => {
      supabase
        .from('chat_messages')
        .select('id, session_id, sender_type, message, created_at')
        .eq('session_id', chatSession.id)
        .order('created_at', { ascending: true })
        .then(({ data }) => {
          if (data) setChatMessages(data as SupportChatMessage[]);
        });
    }, 3000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
    };
  }, [chatSession?.id, supabase]);

  // ── Send chat message ──
  const handleSendChat = async () => {
    if (!chatInput.trim() || !chatSession || chatSession.status === 'closed') return;
    const text = chatInput.trim();
    setChatInput('');
    setChatSending(true);
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('chat_messages').insert({ session_id: chatSession.id, sender_type: 'user', sender_id: user?.id, message: text });
    await supabase.from('chat_sessions').update({ updated_at: new Date().toISOString() }).eq('id', chatSession.id);
    setChatSending(false);
  };

  // ── Submit Ticket ──
  const handleSendTicket = async () => {
    if (!ticketForm.subject || !ticketForm.message) return;
    setSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { data: ticket, error: ticketError } = await supabase.from('support_tickets').insert({ user_id: user.id, subject: ticketForm.subject, category: ticketForm.category as 'deposit' | 'withdrawal' | 'trading' | 'account' | 'technical' | 'other', status: 'open', priority: 'normal' }).select('id').single();
      if (ticketError || !ticket) throw ticketError || new Error('Failed to create ticket');
      await supabase.from('ticket_replies').insert({ ticket_id: ticket.id, sender_type: 'user', sender_id: user.id, message: ticketForm.message });
      setSent(true);
      setTicketForm({ subject: '', message: '', category: 'other' });
      setTimeout(() => setSent(false), 5000);
    } catch {
      // silently fail
    } finally {
      setSending(false);
    }
  };

  // ── Live Chat View ──
  if (chatView) {
    return (
      <div className="space-y-4">
        <button onClick={() => setChatView(false)} className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-xs">
          <ChevronRight size={13} style={{ transform: 'rotate(180deg)' }} /> Back to Support
        </button>
        <GlassCard className="overflow-hidden flex flex-col" style={{ height: 480 }}>
          <div className="px-4 py-3 border-b border-white/8 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.15)' }}><MessageCircle size={16} className="text-blue-400" /></div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-white">Live Chat — Support Team</div>
              <div className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${chatSession?.status === 'active' ? 'bg-green-400' : 'bg-slate-500'}`} />
                <span className="text-xs text-slate-500">{chatSession?.status === 'active' ? 'Active session' : chatSession?.status === 'closed' ? 'Session closed' : 'Connecting...'}</span>
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {chatLoading ? (
              <div className="flex items-center justify-center h-full"><span className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" /></div>
            ) : chatMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-500"><MessageCircle size={28} className="opacity-30" /><span className="text-xs">No messages yet. Say hello!</span></div>
            ) : (
              chatMessages.map(msg => (
                <div key={msg.id} className={`flex ${msg.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[78%] rounded-xl px-3.5 py-2.5 ${msg.sender_type === 'user' ? 'bg-blue-500/15 border border-blue-500/25' : msg.sender_type === 'admin' ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-cyan-500/10 border border-cyan-500/20'}`}>
                    <div className={`text-[10px] font-semibold mb-1 ${msg.sender_type === 'user' ? 'text-blue-400' : msg.sender_type === 'admin' ? 'text-emerald-400' : 'text-cyan-400'}`}>{msg.sender_type === 'user' ? 'You' : msg.sender_type === 'admin' ? 'Support' : '🤖 Bot'}</div>
                    <div className="text-sm text-white whitespace-pre-wrap">{msg.message}</div>
                    <div className="text-[10px] text-slate-500 mt-1">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                </div>
              ))
            )}
            <div ref={chatEndRef} />
          </div>
          {chatSession?.status === 'active' ? (
            <div className="p-3 border-t border-white/8">
              <div className="flex gap-2">
                <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendChat(); } }} placeholder="Type a message..." className="flex-1 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none transition-all" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} onFocus={e => { e.target.style.borderColor = 'rgba(59,130,246,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1), inset 0 1px 3px rgba(0,0,0,0.3)'; }} onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }} />
                <button onClick={handleSendChat} disabled={chatSending || !chatInput.trim()} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed" style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>
                  {chatSending ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send size={13} />}
                </button>
              </div>
            </div>
          ) : chatSession?.status === 'closed' ? (
            <div className="p-3 border-t border-white/8 text-center text-xs text-slate-500">This session has been closed by support.</div>
          ) : null}
        </GlassCard>
      </div>
    );
  }

  // ── Main Support View ──
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button onClick={handleOpenChat} className="flex items-center gap-3 p-4 rounded-2xl hover:scale-105 transition-all group text-left" style={{ background: 'rgba(5,5,5,0.9)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.2)' }}><MessageCircle size={20} /></div>
          <div><div className="text-sm font-semibold text-white">Live Chat</div><div className="text-xs text-slate-500">Chat directly with support</div></div>
          <ChevronRight size={16} className="ml-auto text-slate-600 group-hover:text-slate-400 transition-colors" />
        </button>
        <a href="mailto:support@tradiglo.com" className="flex items-center gap-3 p-4 rounded-2xl hover:scale-105 transition-all group" style={{ background: 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.2)' }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-purple-400 transition-all group-hover:scale-110" style={{ background: 'rgba(168,85,247,0.15)' }}><Headphones size={20} /></div>
          <div><div className="text-sm font-semibold text-white">Email Support</div><div className="text-xs text-slate-500">support@tradiglo.com</div></div>
          <ChevronRight size={16} className="ml-auto text-slate-600 group-hover:text-slate-400 transition-colors" />
        </a>
      </div>

      <GlassCard className="p-5 space-y-4">
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2"><Send size={13} /> Submit Ticket</h4>
        {sent ? (
          <div className="flex items-center gap-2 py-4 text-emerald-400 text-sm"><CheckCircle size={16} /> Ticket submitted successfully! Our team will respond within 24 hours.</div>
        ) : (
          <>
            <div>
              <label className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5 block">Category</label>
              <select value={ticketForm.category} onChange={e => setTicketForm(f => ({ ...f, category: e.target.value }))} className="w-full rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none transition-all" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <option value="deposit">Deposit</option>
                <option value="withdrawal">Withdrawal</option>
                <option value="trading">Trading</option>
                <option value="account">Account</option>
                <option value="technical">Technical</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5 block">Subject</label>
              <input value={ticketForm.subject} onChange={e => setTicketForm(f => ({ ...f, subject: e.target.value }))} placeholder="Enter ticket subject" className="w-full rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none transition-all" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.3)' }} onFocus={e => { e.target.style.borderColor = 'rgba(16,185,129,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.1), inset 0 1px 3px rgba(0,0,0,0.3)'; }} onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }} />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5 block">Message</label>
              <textarea value={ticketForm.message} onChange={e => setTicketForm(f => ({ ...f, message: e.target.value }))} placeholder="Describe your issue..." rows={4} className="w-full rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none transition-all resize-none" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.3)' }} onFocus={e => { e.target.style.borderColor = 'rgba(16,185,129,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.1), inset 0 1px 3px rgba(0,0,0,0.3)'; }} onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'inset 0 1px 3px rgba(0,0,0,0.3)'; }} />
            </div>
            <button onClick={handleSendTicket} disabled={sending || !ticketForm.subject || !ticketForm.message} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100" style={{ background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 4px 16px rgba(16,185,129,0.25)' }}>
              {sending ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send size={13} />} Submit Ticket
            </button>
          </>
        )}
      </GlassCard>

      <GlassCard className="overflow-hidden">
        <div className="px-5 py-3.5 border-b border-white/8 flex items-center gap-2"><Info size={13} className="text-slate-400" /><span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">FAQ</span></div>
        <div className="divide-y divide-white/5">
          {faqsLoading ? (
            <div className="flex items-center justify-center py-8"><span className="w-5 h-5 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : faqs.length === 0 ? (
            <div className="px-5 py-6 text-sm text-slate-500 text-center">No FAQs available yet.</div>
          ) : (
            faqs.map(faq => (
              <div key={faq.id}>
                <button onClick={() => setOpenFaq(openFaq === faq.id ? null : faq.id)} className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/2 transition-colors">
                  <span className="text-sm font-medium text-white pr-4">{faq.question}</span>
                  <span className="transition-transform duration-300 flex-shrink-0" style={{ transform: openFaq === faq.id ? 'rotate(180deg)' : 'rotate(0deg)' }}><ChevronDown size={15} className="text-slate-400" /></span>
                </button>
                {openFaq === faq.id && <div className="px-5 pb-4 text-sm text-slate-400 leading-relaxed" style={{ animation: 'expandDown 0.2s ease-out' }}>{faq.answer}</div>}
              </div>
            ))
          )}
        </div>
      </GlassCard>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AccountPage() {
  const router = useRouter();
  const supabase = createClient();

  const [activeSection, setActiveSection] = useState<AccountSection>('profile');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sectionKey, setSectionKey] = useState(0);

  const [userId, setUserId] = useState<string>('');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [stats, setStats] = useState<TradeStats>({ totalTrades: 0, wins: 0, losses: 0, winRate: 0, totalProfit: 0, totalLoss: 0, bestTrade: 0, worstTrade: 0, favoriteAssets: [], dailyPerformance: [] });
  const [deposits, setDeposits] = useState<DepositRecord[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRecord[]>([]);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [activeCountries, setActiveCountries] = useState<string[]>([]);

  const handleSectionChange = (id: AccountSection) => {
    setActiveSection(id);
    setSectionKey(k => k + 1);
    setMobileSidebarOpen(false);
  };

  const loadWalletData = useCallback(async (uid: string) => {
    const { data: wallets } = await supabase.from('wallets').select('balance, is_demo').eq('user_id', uid);
    if (wallets) {
      const demo = wallets.find(w => w.is_demo === true);
      const real = wallets.find(w => w.is_demo === false);
      setWallet({ demoBalance: Number(demo?.balance ?? 0), realBalance: Number(real?.balance ?? 0) });
    }
    const { data: deps } = await supabase.from('deposits').select('*').eq('user_id', uid).order('created_at', { ascending: false }).limit(50);
    setDeposits(deps || []);
    const { data: withs } = await supabase.from('withdrawals').select('*').eq('user_id', uid).order('created_at', { ascending: false }).limit(50);
    setWithdrawals(withs || []);
    const { data: txs } = await supabase.from('transactions').select('*').eq('user_id', uid).order('created_at', { ascending: false }).limit(100);
    setTransactions(txs || []);
  }, [supabase]);

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace('/login'); return; }
    setUserId(user.id);

    const { data: pmData } = await supabase.from('payment_methods').select('country').eq('is_active', true);
    if (pmData) {
      const uniqueCountries = Array.from(new Set(pmData.map((m: { country: string }) => m.country).filter(Boolean))).sort() as string[];
      setActiveCountries(uniqueCountries);
    }

    const { data: userData } = await supabase.from('users').select('*').eq('id', user.id).single();
    const { data: tradesData } = await supabase.from('trades').select('profit_loss, status, asset_id').eq('user_id', user.id).eq('status', 'closed');

    const trades = tradesData || [];
    const wins = trades.filter(t => (t.profit_loss ?? 0) > 0);
    const losses = trades.filter(t => (t.profit_loss ?? 0) <= 0);
    const totalProfit = wins.reduce((s, t) => s + Number(t.profit_loss ?? 0), 0);
    const totalLoss = losses.reduce((s, t) => s + Number(t.profit_loss ?? 0), 0);
    const profitLosses = trades.map(t => Number(t.profit_loss ?? 0));
    const assetCounts: Record<string, number> = {};
    trades.forEach(t => { if (t.asset_id) assetCounts[t.asset_id] = (assetCounts[t.asset_id] || 0) + 1; });
    const favoriteAssets = Object.entries(assetCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([symbol, count]) => ({ symbol, count }));

    setStats({ totalTrades: trades.length, wins: wins.length, losses: losses.length, winRate: trades.length > 0 ? (wins.length / trades.length) * 100 : 0, totalProfit, totalLoss, bestTrade: profitLosses.length > 0 ? Math.max(...profitLosses) : 0, worstTrade: profitLosses.length > 0 ? Math.min(...profitLosses) : 0, favoriteAssets, dailyPerformance: [] });

    const { data: actData } = await supabase.from('transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(30);
    setActivities((actData || []).map(t => ({ id: t.id, type: t.type, description: t.description || t.type, amount: t.amount, created_at: t.created_at })));

    setProfile({ id: user.id, email: user.email || '', full_name: userData?.full_name || null, avatar_url: userData?.avatar_url || null, phone: userData?.phone || '', country: userData?.country || '', timezone: userData?.timezone || '', username: userData?.username || '', account_status: userData?.account_status || 'active', email_verified: userData?.email_verified ?? false, phone_verified: userData?.phone_verified ?? false, kyc_status: userData?.kyc_status || 'unverified', two_factor_enabled: userData?.two_factor_enabled ?? false, last_login_at: userData?.last_login_at || null, last_login_device: userData?.last_login_device || null, last_login_location: userData?.last_login_location || null, referral_code: userData?.referral_code || null, referral_count: userData?.referral_count ?? 0, referral_earnings: userData?.referral_earnings ?? 0, bank_name: userData?.bank_name || '', account_holder: userData?.account_holder || '', account_number: userData?.account_number || '', preferred_payment_method: userData?.preferred_payment_method || '', preferred_currency: userData?.preferred_currency || 'USD', created_at: userData?.created_at || user.created_at });

    await loadWalletData(user.id);
    setLoading(false);
  }, [supabase, router, loadWalletData]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (!userId) return;
    const walletSub = supabase.channel(`wallet-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wallets', filter: `user_id=eq.${userId}` }, () => { loadWalletData(userId); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deposits', filter: `user_id=eq.${userId}` }, () => { loadWalletData(userId); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'withdrawals', filter: `user_id=eq.${userId}` }, () => { loadWalletData(userId); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions', filter: `user_id=eq.${userId}` }, () => { loadWalletData(userId); })
      .subscribe();
    const profileSub = supabase.channel(`profile-${userId}`).on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'users', filter: `id=eq.${userId}` }, (payload) => {
      const updated = payload.new as Partial<UserProfile>;
      setProfile(prev => prev ? { ...prev, email_verified: updated.email_verified ?? prev.email_verified, phone_verified: updated.phone_verified ?? prev.phone_verified, kyc_status: updated.kyc_status ?? prev.kyc_status, two_factor_enabled: updated.two_factor_enabled ?? prev.two_factor_enabled, account_status: updated.account_status ?? prev.account_status } : prev);
    }).subscribe();
    return () => { supabase.removeChannel(walletSub); supabase.removeChannel(profileSub); };
  }, [userId, supabase, loadWalletData]);

  const handleUpdateProfile = async (data: Partial<UserProfile>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const updatePayload: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (data.full_name !== undefined) updatePayload.full_name = data.full_name;
    if (data.phone !== undefined) updatePayload.phone = data.phone;
    if (data.country !== undefined) updatePayload.country = data.country;
    if (data.timezone !== undefined) updatePayload.timezone = data.timezone;
    if (data.avatar_url !== undefined) updatePayload.avatar_url = data.avatar_url;
    if (data.account_holder !== undefined) updatePayload.account_holder = data.account_holder;
    if (data.bank_name !== undefined) updatePayload.bank_name = data.bank_name;
    if (data.account_number !== undefined) updatePayload.account_number = data.account_number;
    if (data.preferred_payment_method !== undefined) updatePayload.preferred_payment_method = data.preferred_payment_method;
    if (data.preferred_currency !== undefined) updatePayload.preferred_currency = data.preferred_currency;
    await supabase.from('users').update(updatePayload).eq('id', user.id);
    setProfile(prev => prev ? { ...prev, ...data } : prev);
  };

  const handleResetDemo = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('wallets').update({ balance: 100000 }).eq('user_id', user.id).eq('is_demo', true);
    setWallet(prev => prev ? { ...prev, demoBalance: 100000 } : prev);
  };

  const handleRefreshWallet = async () => { if (userId) await loadWalletData(userId); };
  const handleLogout = async () => { await supabase.auth.signOut(); router.replace('/login'); };

  const activeItem = NAV_ITEMS.find(n => n.id === activeSection);

  const renderSection = () => {
    switch (activeSection) {
      case 'profile': return <ProfileSection profile={profile} stats={stats} onUpdate={handleUpdateProfile} activeCountries={activeCountries} />;
      case 'security': return <SecuritySection />;
      case 'wallet': return <WalletSection userId={userId} wallet={wallet} deposits={deposits} withdrawals={withdrawals} transactions={transactions} profile={profile} onResetDemo={handleResetDemo} onRefresh={handleRefreshWallet} onUpdateProfile={handleUpdateProfile} />;
      case 'stats': return <StatsSection stats={stats} />;
      case 'level': return <LevelSection totalTrades={stats.totalTrades} />;
      case 'activity': return <ActivitySection activities={activities} />;
      case 'preferences': return <PreferencesSection />;
      case 'support': return <SupportSection />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#050505' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(99,102,241,0.2))', border: '1px solid rgba(59,130,246,0.3)' }}>
            <span className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          </div>
          <span className="text-xs text-slate-500 font-medium">Loading account...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="text-white flex flex-col" style={{ fontFamily: "'DM Sans', 'Inter', sans-serif", minHeight: '100dvh', background: '#050505' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&display=swap');
        @keyframes slideInToast { from { transform: translateX(100%) scale(0.9); opacity: 0; } to { transform: translateX(0) scale(1); opacity: 1; } }
        @keyframes expandDown { from { opacity: 0; transform: translateY(-8px) scaleY(0.95); } to { opacity: 1; transform: translateY(0) scaleY(1); } }
        @keyframes fadeSlideIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes sectionFade { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideInLeft { from { transform: translateX(-100%); } to { transform: translateX(0); } }
        .section-animate { animation: sectionFade 0.25s cubic-bezier(0.34,1.56,0.64,1); }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
        select option { background: #111; color: white; }
      `}</style>

      <header className="sticky top-0 z-40 flex items-center justify-between px-4 h-14 flex-shrink-0" style={{ background: 'rgba(5,5,5,0.9)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/dashboard')} className="flex items-center gap-1.5 text-slate-500 hover:text-white transition-all hover:scale-105 active:scale-95">
            <ArrowLeft size={17} /><span className="text-xs font-medium hidden sm:block">Dashboard</span>
          </button>
          <div className="w-px h-5" style={{ background: 'rgba(255,255,255,0.08)' }} />
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 800, letterSpacing: '0.06em', fontSize: 14 }} className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 select-none">TRADIGLO</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs text-slate-400 hover:text-white transition-colors" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}><Bell size={15} /></button>
          <div className="w-8 h-8 rounded-xl overflow-hidden flex items-center justify-center text-xs font-bold text-blue-300" style={{ background: 'linear-gradient(135deg, #1e3a5f, #1e1b4b)', border: '1px solid rgba(59,130,246,0.3)' }}>
            {profile?.avatar_url ? <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" /> : (profile?.full_name?.[0] || profile?.email?.[0] || 'U').toUpperCase()}
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="hidden md:flex flex-col w-60 flex-shrink-0 overflow-y-auto" style={{ background: 'rgba(255,255,255,0.015)', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="p-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center text-sm font-bold text-blue-300 flex-shrink-0" style={{ background: 'linear-gradient(135deg, #1e3a5f, #1e1b4b)', border: '1px solid rgba(59,130,246,0.3)' }}>
                {profile?.avatar_url ? <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" /> : (profile?.full_name?.[0] || 'U').toUpperCase()}
              </div>
              <div className="min-w-0"><div className="text-sm font-semibold text-white truncate">{profile?.full_name || 'Pengguna'}</div><div className="text-[10px] text-slate-500 truncate">{profile?.email}</div></div>
            </div>
          </div>
          <div className="p-3 flex-1 space-y-0.5">
            {NAV_ITEMS.map(item => (
              <button key={item.id} onClick={() => handleSectionChange(item.id)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all group relative overflow-hidden" style={{ background: activeSection === item.id ? `${item.accent}15` : 'transparent', border: `1px solid ${activeSection === item.id ? `${item.accent}30` : 'transparent'}`, color: activeSection === item.id ? item.accent : '#64748b' }} onMouseEnter={e => { if (activeSection !== item.id) { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; (e.currentTarget as HTMLElement).style.color = '#94a3b8'; } }} onMouseLeave={e => { if (activeSection !== item.id) { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#64748b'; } }}>
                {activeSection === item.id && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full" style={{ background: item.accent }} />}
                <span>{item.icon}</span>
                <span className="text-xs font-medium flex-1">{item.label}</span>
                {activeSection === item.id && <ChevronRight size={11} />}
              </button>
            ))}
          </div>
          <div className="p-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-500 hover:text-red-400 transition-all text-xs font-medium" style={{ background: 'transparent' }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.06)'; (e.currentTarget as HTMLElement).style.color = '#94a3b8'; }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#64748b'; }}>
              <LogOut size={15} /> Logout
            </button>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto">
          <div className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3" style={{ background: 'rgba(5,5,5,0.9)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-2"><span style={{ color: activeItem?.accent }}>{activeItem?.icon}</span><span className="text-sm font-semibold text-white">{activeItem?.label}</span></div>
            <button onClick={() => setMobileSidebarOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs text-slate-400 hover:text-white transition-colors" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}><Menu size={13} /> Menu</button>
          </div>
          <div className="p-4 sm:p-6 max-w-3xl">
            <div className="hidden md:flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${activeItem?.accent}15`, color: activeItem?.accent, border: `1px solid ${activeItem?.accent}30` }}>{activeItem?.icon}</div>
              <div><h2 className="text-lg font-bold text-white">{activeItem?.label}</h2></div>
            </div>
            <div key={sectionKey} className="section-animate">{renderSection()}</div>
          </div>
        </main>
      </div>

      <nav className="md:hidden flex-shrink-0 flex items-stretch overflow-x-auto" style={{ height: 60, background: 'rgba(5,5,5,0.95)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        {NAV_ITEMS.map(item => (
          <button key={item.id} onClick={() => handleSectionChange(item.id)} className="flex-shrink-0 flex flex-col items-center justify-center gap-1 px-3 transition-all relative" style={{ minWidth: 56, color: activeSection === item.id ? item.accent : '#475569' }}>
            {item.icon}
            <span className="text-[8px] font-semibold leading-none whitespace-nowrap">{item.label.split(' ')[0]}</span>
            {activeSection === item.id && <span className="absolute bottom-0 w-6 h-0.5 rounded-full" style={{ background: item.accent }} />}
          </button>
        ))}
      </nav>

      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden" onClick={() => setMobileSidebarOpen(false)}>
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} />
          <div className="absolute left-0 top-0 bottom-0 w-72 flex flex-col" style={{ background: '#0a0a0a', borderRight: '1px solid rgba(255,255,255,0.08)', animation: 'slideInLeft 0.25s cubic-bezier(0.34,1.56,0.64,1)' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center text-sm font-bold text-blue-300" style={{ background: 'linear-gradient(135deg, #1e3a5f, #1e1b4b)', border: '1px solid rgba(59,130,246,0.3)' }}>
                  {profile?.avatar_url ? <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" /> : (profile?.full_name?.[0] || 'U').toUpperCase()}
                </div>
                <div><div className="text-sm font-semibold text-white">{profile?.full_name || 'Pengguna'}</div><div className="text-xs text-slate-500">{profile?.email}</div></div>
              </div>
              <button onClick={() => setMobileSidebarOpen(false)} className="text-slate-500 hover:text-white transition-colors"><X size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-0.5">
              {NAV_ITEMS.map(item => (
                <button key={item.id} onClick={() => handleSectionChange(item.id)} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all" style={{ background: activeSection === item.id ? `${item.accent}15` : 'transparent', border: `1px solid ${activeSection === item.id ? `${item.accent}30` : 'transparent'}`, color: activeSection === item.id ? item.accent : '#64748b' }}>
                  <span>{item.icon}</span>
                  <span className="text-sm font-medium">{item.label}</span>
                  {activeSection === item.id && <ChevronRight size={13} className="ml-auto" />}
                </button>
              ))}
            </div>
            <div className="p-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 text-sm font-medium transition-all" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
                <LogOut size={16} /> Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}