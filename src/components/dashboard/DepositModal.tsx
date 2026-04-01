'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

interface PaymentMethod {
  id: string;
  type: string;
  country: string;
  name: string;
  account_number: string | null;
  account_name: string | null;
  network: string | null;
  instructions: string | null;
  min_deposit: number;
  max_deposit: number;
  is_active: boolean;
}

interface CurrencyRate {
  currency_code: string;
  currency_name: string;
  rate_to_usd: number;
}

interface BonusSetting {
  bonus_percent: number;
  min_deposit: number;
  max_bonus: number;
}

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  isDemo: boolean;
}

type Step = 'country' | 'method' | 'amount' | 'success';

const COUNTRY_CURRENCY: Record<string, string> = {
  Malaysia: 'MYR',
  Singapore: 'SGD',
  Thailand: 'THB',
  Vietnam: 'VND',
  Japan: 'JPY',
  'South Korea': 'KRW',
  Global: 'USD',
  Indonesia: 'IDR',
  Philippines: 'PHP',
  'United States': 'USD',
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  bank: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="22" x2="21" y2="22" /><line x1="6" y1="18" x2="6" y2="11" />
      <line x1="10" y1="18" x2="10" y2="11" /><line x1="14" y1="18" x2="14" y2="11" />
      <line x1="18" y1="18" x2="18" y2="11" /><polygon points="12 2 20 7 4 7" />
    </svg>
  ),
  ewallet: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" />
    </svg>
  ),
  crypto: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><path d="M9.5 9.5c0-1.1.9-2 2-2h1a2 2 0 0 1 0 4h-1a2 2 0 0 1 0 4h1a2 2 0 0 0 2-2M12 7v10" />
    </svg>
  ),
  card: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  ),
};

const TYPE_COLORS: Record<string, string> = {
  bank: '#3b82f6',
  ewallet: '#8b5cf6',
  crypto: '#f59e0b',
  card: '#10b981',
};

const TYPE_LABELS: Record<string, string> = {
  bank: 'Bank Transfer',
  ewallet: 'E-Wallet',
  crypto: 'Cryptocurrency',
  card: 'Credit / Debit Card',
};

const FLAG_EMOJI: Record<string, string> = {
  Malaysia: '🇲🇾',
  Singapore: '🇸🇬',
  Thailand: '🇹🇭',
  Vietnam: '🇻🇳',
  Japan: '🇯🇵',
  'South Korea': '🇰🇷',
  Global: '🌐',
  Indonesia: '🇮🇩',
  Philippines: '🇵🇭',
  'United States': '🇺🇸',
};

export default function DepositModal({ isOpen, onClose, userId, isDemo }: DepositModalProps) {
  const [step, setStep] = useState<Step>('country');
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [currencyRates, setCurrencyRates] = useState<Record<string, CurrencyRate>>({});
  const [loading, setLoading] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [activeType, setActiveType] = useState<string>('bank');
  const [amount, setAmount] = useState('');
  const [amountError, setAmountError] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [proofBase64, setProofBase64] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [isFirstDeposit, setIsFirstDeposit] = useState(false);
  const [bonusSetting, setBonusSetting] = useState<BonusSetting | null>(null);
  const [proofValidating, setProofValidating] = useState(false);
  const [proofValidationError, setProofValidationError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const [methodsRes, ratesRes, bonusRes] = await Promise.all([
      supabase.from('payment_methods').select('*').eq('is_active', true).order('country').order('name'),
      supabase.from('currency_rates').select('*'),
      supabase.from('bonus_settings').select('bonus_percent, min_deposit, max_bonus').eq('is_active', true).eq('applies_to', 'first_deposit').maybeSingle(),
    ]);
    setMethods((methodsRes.data as PaymentMethod[]) || []);
    const ratesMap: Record<string, CurrencyRate> = {};
    ((ratesRes.data as CurrencyRate[]) || []).forEach((r) => {
      ratesMap[r.currency_code] = r;
    });
    setCurrencyRates(ratesMap);
    if (bonusRes.data) setBonusSetting(bonusRes.data as BonusSetting);

    // Check if this is user's first deposit
    if (userId) {
      const { data: isFirst } = await supabase.rpc('is_first_deposit', { p_user_id: userId });
      setIsFirstDeposit(!!isFirst);
    }

    setLoading(false);
  }, [userId]);

  useEffect(() => {
    if (isOpen) {
      fetchData();
      setStep('country');
      setSelectedCountry('');
      setSelectedMethod(null);
      setAmount('');
      setAmountError('');
      setProofFile(null);
      setProofPreview(null);
      setProofBase64(null);
      setProofValidating(false);
      setProofValidationError('');
    }
  }, [isOpen, fetchData]);

  // Derived data
  const countries = Array.from(new Set(methods.map((m) => m.country || 'Global'))).sort((a, b) => {
    // Put Global last
    if (a === 'Global') return 1;
    if (b === 'Global') return -1;
    return a.localeCompare(b);
  });
  const currency = selectedCountry ? (COUNTRY_CURRENCY[selectedCountry] || 'USD') : 'USD';
  const rate = currencyRates[currency];
  const amountNum = parseFloat(amount) || 0;
  const amountUsd = rate ? amountNum * rate.rate_to_usd : amountNum;

  // Bonus calculation
  const bonusPct = bonusSetting?.bonus_percent ?? 0;
  const BONUS_MIN_USD = 100;
  const isBonusEligible = isFirstDeposit && bonusSetting !== null && amountUsd >= BONUS_MIN_USD;
  const rawBonus = isBonusEligible ? (amountUsd * bonusPct) / 100 : 0;
  const bonusAmt = isBonusEligible && bonusSetting ? Math.min(rawBonus, bonusSetting.max_bonus) : 0;
  const totalWithBonus = Math.round((amountUsd + bonusAmt) * 100) / 100;
  const showBonus = isFirstDeposit && bonusSetting && amountUsd > 0;

  const methodsForCountry = methods.filter((m) => (m.country || 'Global') === selectedCountry);
  const types = ['bank', 'ewallet', 'crypto', 'card'];
  const availableTypes = types.filter((t) => methodsForCountry.some((m) => m.type === t));
  const filteredMethods = methodsForCountry.filter((m) => m.type === activeType);

  const handleSelectCountry = (country: string) => {
    setSelectedCountry(country);
    const firstType = types.find((t) => methods.some((m) => (m.country || 'Global') === country && m.type === t));
    setActiveType(firstType || 'bank');
    setStep('method');
  };

  const handleSelectMethod = (method: PaymentMethod) => {
    setSelectedMethod(method);
    setAmount(String(method.min_deposit));
    setAmountError('');
    setStep('amount');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProofFile(file);
    setProofValidationError('');
    setProofValidating(true);

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const result = ev.target?.result as string;
      setProofPreview(result);
      setProofBase64(result);

      // File type validation only — admin will verify manually
      const isImage = file.type.startsWith('image/');
      const isPdf = file.type === 'application/pdf';

      if (!isImage && !isPdf) {
        setProofValidationError('Only image files (PNG, JPG) and PDF are accepted.');
        setProofFile(null);
        setProofPreview(null);
        setProofBase64(null);
      }

      setProofValidating(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!selectedMethod) return;
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) {
      setAmountError('Please enter a valid amount');
      return;
    }
    if (isBelowMinDeposit) {
      setAmountError(`Minimum deposit is $100 USD (≈ ${rate ? Math.ceil(MIN_DEPOSIT_USD / rate.rate_to_usd).toLocaleString() : ''} ${currency})`);
      return;
    }
    setSubmitting(true);
    setSubmitError('');
    try {
      const supabase = createClient();

      // Always get user from auth to ensure valid session
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        setSubmitError('You must be logged in to make a deposit.');
        setSubmitting(false);
        return;
      }

      const ref = `DEP-${Date.now().toString(36).toUpperCase()}`;

      // Debug log
      console.log('Submitting deposit:', {
        user_id: user.id,
        amount: amountUsd,
        amount_original: val,
        currency_original: currency,
        amount_usd: amountUsd,
        payment_method: selectedMethod.name,
        payment_method_id: selectedMethod.id,
        payment_reference: ref,
        status: 'pending',
      });

      const { error } = await supabase.from('deposits').insert({
        user_id: user.id,
        amount: amountUsd,
        amount_original: val,
        currency_original: currency,
        amount_usd: amountUsd,
        payment_method: selectedMethod.name,
        payment_method_id: selectedMethod.id,
        payment_reference: ref,
        proof_url: proofBase64 || null,
        status: 'pending',
      });

      if (error) {
        console.error('DEPOSIT ERROR:', error);
        setSubmitError(error.message || 'Failed to submit deposit. Please try again.');
        setSubmitting(false);
        return;
      }

      setReferenceNumber(ref);
      setStep('success');
    } catch (err: any) {
      console.error('Deposit error:', err);
      setSubmitError(err?.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const stepBack = () => {
    if (step === 'method') setStep('country');
    else if (step === 'amount') setStep('method');
  };

  if (!isOpen) return null;

  const STEPS: Step[] = ['country', 'method', 'amount'];
  const stepIndex = STEPS.indexOf(step);

  const MIN_DEPOSIT_USD = 100;
  const isBelowMinDeposit = amountNum > 0 && rate ? amountUsd < MIN_DEPOSIT_USD : false;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-full max-w-lg mx-4 rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #0d0d0d 0%, #111827 100%)',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 40px 80px rgba(0,0,0,0.9)',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Top accent */}
        <div style={{ height: 2, background: 'linear-gradient(90deg, #10b981, #3b82f6, #8b5cf6)', flexShrink: 0 }} />

        {/* Welcome Bonus Banner — shown on country step if first deposit */}
        {isFirstDeposit && bonusSetting && step !== 'success' && (
          <div className="flex items-center gap-3 px-5 py-3 bg-[#0f1f2e] border-b border-blue-500/20" style={{ flexShrink: 0 }}>
            <div className="w-7 h-7 rounded-lg bg-blue-500/15 border border-blue-500/25 flex items-center justify-center flex-shrink-0">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 12 20 22 4 22" /><rect x="6" y="18" width="20" height="5" /><line x1="10" y1="18" x2="10" y2="22" /><line x1="14" y1="18" x2="14" y2="22" /><line x1="18" y1="18" x2="18" y2="22" /><polygon points="12 2 20 7 4 7" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-blue-300 text-xs font-bold">Welcome Bonus: {bonusSetting.bonus_percent}% on your first deposit</div>
              <div className="text-slate-500 text-[10px] mt-0.5">
                Min deposit ${bonusSetting.min_deposit} · Max bonus ${bonusSetting.max_bonus.toLocaleString()}
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8 flex-shrink-0">
          <div className="flex items-center gap-3">
            {step !== 'country' && step !== 'success' && (
              <button
                onClick={stepBack}
                className="w-7 h-7 rounded-lg bg-white/8 hover:bg-white/15 flex items-center justify-center text-slate-400 hover:text-white transition-all"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
            )}
            <div>
              <h2 className="text-white font-bold text-base">
                {step === 'country' && 'Deposit Funds'}
                {step === 'method' && `${FLAG_EMOJI[selectedCountry] || '🌐'} ${selectedCountry}`}
                {step === 'amount' && selectedMethod?.name}
                {step === 'success' && 'Deposit Submitted'}
              </h2>
              <p className="text-slate-500 text-xs mt-0.5">
                {step === 'country' && 'Select your country'}
                {step === 'method' && 'Choose payment method'}
                {step === 'amount' && `${currency} → USD · ${TYPE_LABELS[selectedMethod?.type || 'bank']}`}
                {step === 'success' && 'Awaiting admin approval'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/8 hover:bg-white/15 flex items-center justify-center text-slate-400 hover:text-white transition-all"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Step indicator */}
        {step !== 'success' && (
          <div className="flex items-center gap-1 px-5 py-2.5 border-b border-white/5 flex-shrink-0">
            {(['country', 'method', 'amount'] as Step[]).map((s, i) => (
              <React.Fragment key={s}>
                <div className={`flex items-center gap-1.5 ${step === s ? 'opacity-100' : i < stepIndex ? 'opacity-60' : 'opacity-30'}`}>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${step === s ? 'bg-emerald-500 text-black' : i < stepIndex ? 'bg-emerald-500/30 text-emerald-400' : 'bg-white/10 text-slate-500'}`}>
                    {i < stepIndex ? '✓' : i + 1}
                  </div>
                  <span className="text-[10px] font-medium text-slate-400 hidden sm:block">
                    {s === 'country' ? 'Country' : s === 'method' ? 'Method' : 'Amount'}
                  </span>
                </div>
                {i < 2 && <div className="flex-1 h-px bg-white/10 mx-1" />}
              </React.Fragment>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>

          {/* STEP 1: Country */}
          {step === 'country' && (
            <div className="p-4">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : countries.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-sm">No active payment methods available</div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {countries.map((country) => {
                    const countryMethods = methods.filter((m) => (m.country || 'Global') === country);
                    const curr = COUNTRY_CURRENCY[country] || 'USD';
                    return (
                      <button
                        key={country}
                        onClick={() => handleSelectCountry(country)}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/4 border border-white/8 hover:bg-white/8 hover:border-emerald-500/30 transition-all text-left group"
                      >
                        <span className="text-2xl flex-shrink-0">{FLAG_EMOJI[country] || '🌐'}</span>
                        <div className="min-w-0">
                          <div className="text-white text-xs font-semibold truncate">{country}</div>
                          <div className="text-slate-500 text-[10px]">{curr} · {countryMethods.length} methods</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Method */}
          {step === 'method' && (
            <div className="p-4">
              {/* Type tabs */}
              <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                {availableTypes.map((t) => (
                  <button
                    key={t}
                    onClick={() => setActiveType(t)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                      activeType === t
                        ? 'text-black' :'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/10'
                    }`}
                    style={activeType === t ? { backgroundColor: TYPE_COLORS[t], border: `1px solid ${TYPE_COLORS[t]}` } : {}}
                  >
                    <span style={{ color: activeType === t ? '#000' : TYPE_COLORS[t] }}>{TYPE_ICONS[t]}</span>
                    {TYPE_LABELS[t]}
                  </button>
                ))}
              </div>

              {filteredMethods.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-sm">No {TYPE_LABELS[activeType]} methods available</div>
              ) : (
                <div className="space-y-2">
                  {filteredMethods.map((method) => (
                    <button
                      key={method.id}
                      onClick={() => handleSelectMethod(method)}
                      className="w-full flex items-center gap-3 px-3 py-3 rounded-xl bg-white/4 border border-white/8 hover:bg-white/8 hover:border-white/15 transition-all text-left group"
                    >
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: `${TYPE_COLORS[method.type] || '#6366f1'}20`, color: TYPE_COLORS[method.type] || '#6366f1' }}
                      >
                        {TYPE_ICONS[method.type] || TYPE_ICONS.bank}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-white text-sm font-semibold truncate">{method.name}</div>
                        <div className="text-slate-500 text-xs">
                          {method.account_number ? `${method.account_number.slice(0, 12)}...` : 'Details available after selection'}
                        </div>
                      </div>
                      <svg className="text-slate-600 group-hover:text-slate-400 transition-colors flex-shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Amount + Proof */}
          {step === 'amount' && selectedMethod && (
            <div className="p-5 space-y-4">
              {/* Account details */}
              <div className="bg-white/4 border border-white/8 rounded-xl p-4 space-y-2.5">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Send Payment To</div>
                {selectedMethod.account_number ? (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 text-xs">Account / Address</span>
                    <div className="flex items-center gap-2">
                      <span className="text-white text-xs font-mono font-semibold">{selectedMethod.account_number}</span>
                      <button
                        onClick={() => navigator.clipboard.writeText(selectedMethod.account_number!)}
                        className="text-slate-500 hover:text-emerald-400 transition-colors"
                        title="Copy"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-slate-500 text-xs italic">Contact support for account details.</div>
                )}
                {selectedMethod.account_name && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 text-xs">Account Name</span>
                    <span className="text-white text-xs font-semibold">{selectedMethod.account_name}</span>
                  </div>
                )}
                {selectedMethod.network && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 text-xs">Network</span>
                    <span className="text-emerald-400 text-xs font-semibold">{selectedMethod.network}</span>
                  </div>
                )}
              </div>

              {/* Instructions */}
              {selectedMethod.instructions && (
                <div className="bg-blue-500/8 border border-blue-500/20 rounded-xl p-3">
                  <div className="flex items-start gap-2">
                    <svg className="text-blue-400 flex-shrink-0 mt-0.5" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <p className="text-blue-300 text-xs leading-relaxed">{selectedMethod.instructions}</p>
                  </div>
                </div>
              )}

              {/* Amount input */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
                  Deposit Amount ({currency})
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">{currency}</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => { setAmount(e.target.value); setAmountError(''); }}
                    min={selectedMethod.min_deposit}
                    max={selectedMethod.max_deposit}
                    className="w-full bg-white/5 border border-white/15 rounded-xl pl-12 pr-4 py-3 text-white text-lg font-bold focus:outline-none focus:border-emerald-500/60 transition-colors"
                    placeholder="0.00"
                  />
                </div>
                {amountError && <p className="text-red-400 text-xs mt-1.5">{amountError}</p>}
                {isBelowMinDeposit && !amountError && (
                  <p className="text-red-400 text-xs mt-1.5">
                    Minimum deposit is $100 USD (≈ {rate ? Math.ceil(MIN_DEPOSIT_USD / rate.rate_to_usd).toLocaleString() : ''} {currency})
                  </p>
                )}
              </div>

              {/* USD Estimation with Bonus */}
              {amountNum > 0 && rate && (
                <div className={`rounded-xl p-3 ${showBonus ? 'bg-yellow-500/8 border border-yellow-500/20' : 'bg-emerald-500/10 border border-emerald-500/20'}`}>
                  {showBonus ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Deposit Amount</span>
                        <span className="text-white font-semibold">≈ ${amountUsd.toFixed(2)}</span>
                      </div>
                      {isBonusEligible ? (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-yellow-400 flex items-center gap-1">Welcome Bonus ({bonusPct}%)</span>
                          <span className="text-yellow-400 font-semibold">+${bonusAmt.toFixed(2)}</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 flex items-center gap-1">Welcome Bonus ({bonusPct}%)</span>
                          <span className="text-slate-500 text-[10px]">Bonus available for deposits ≥ $100</span>
                        </div>
                      )}
                      <div className="border-t border-yellow-500/20 pt-2 flex items-center justify-between">
                        <div>
                          <div className="text-yellow-400 text-xs font-semibold">Total Credited</div>
                          <div className="text-slate-500 text-[10px] mt-0.5">Rate: 1 {currency} = {rate.rate_to_usd} USD</div>
                        </div>
                        <div className="text-right">
                          <div className="text-white text-xl font-bold">≈ ${totalWithBonus.toFixed(2)}</div>
                          <div className="text-slate-500 text-[10px]">USD credited after approval</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-emerald-400 text-xs font-semibold">Estimated Credit</div>
                        <div className="text-slate-500 text-[10px] mt-0.5">Rate: 1 {currency} = {rate.rate_to_usd} USD</div>
                      </div>
                      <div className="text-right">
                        <div className="text-white text-xl font-bold">≈ ${amountUsd.toFixed(2)}</div>
                        <div className="text-slate-500 text-[10px]">USD credited after approval</div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Upload proof */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
                  Upload Payment Proof <span className="text-red-400 normal-case">*</span>
                </label>
                <label className="block cursor-pointer">
                  <input type="file" accept="image/*,.pdf" onChange={handleFileChange} className="hidden" disabled={proofValidating} />
                  {proofPreview ? (
                    <div className="relative rounded-xl overflow-hidden border border-emerald-500/30">
                      <img src={proofPreview} alt="Proof preview" className="w-full max-h-40 object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <span className="text-white text-xs font-semibold">Click to change</span>
                      </div>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-white/15 hover:border-emerald-500/40 rounded-xl p-5 text-center transition-colors">
                      {proofValidating ? (
                        <>
                          <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                          <p className="text-slate-400 text-xs">Validating payment proof...</p>
                        </>
                      ) : (
                        <>
                          <svg className="mx-auto mb-2 text-slate-500" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
                          </svg>
                          <p className="text-slate-500 text-xs">Click to upload screenshot or receipt</p>
                          <p className="text-slate-600 text-[10px] mt-1">PNG, JPG, PDF</p>
                        </>
                      )}
                    </div>
                  )}
                </label>
                {proofValidationError && (
                  <p className="text-red-400 text-xs mt-1.5">{proofValidationError}</p>
                )}
              </div>

              <button
                onClick={handleSubmit}
                disabled={submitting || amountNum <= 0 || !proofFile || isBelowMinDeposit || proofValidating}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-sm transition-all flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : isBonusEligible ? (
                  `Submit Deposit · $${amountUsd.toFixed(2)} + $${bonusAmt.toFixed(2)} bonus = $${totalWithBonus.toFixed(2)}`
                ) : (
                  `Submit Deposit Request${amountNum > 0 && rate ? ` · ${amountNum} ${currency} ≈ $${amountUsd.toFixed(2)}` : ''}`
                )}
              </button>
              {submitError && (
                <div className="mt-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-xs">
                  {submitError}
                </div>
              )}
            </div>
          )}

          {/* STEP 4: Success */}
          {step === 'success' && (
            <div className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-5">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <h3 className="text-white text-xl font-bold mb-2">Request Submitted!</h3>
              <p className="text-slate-400 text-sm mb-1">Your deposit request has been received.</p>
              <p className="text-slate-500 text-xs mb-5">Admin will review and approve your deposit. Your balance will be updated once approved.</p>

              {referenceNumber && (
                <div className="bg-white/4 border border-white/8 rounded-xl px-4 py-2 mb-5 inline-flex items-center gap-2">
                  <span className="text-slate-500 text-xs">Reference:</span>
                  <span className="text-emerald-400 text-xs font-mono font-bold">{referenceNumber}</span>
                </div>
              )}

              <div className="bg-white/4 border border-white/8 rounded-xl p-4 mb-6 text-left space-y-2.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Country</span>
                  <span className="text-white font-semibold">{FLAG_EMOJI[selectedCountry] || ''} {selectedCountry}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Method</span>
                  <span className="text-white font-semibold">{selectedMethod?.name}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Amount</span>
                  <span className="text-white font-semibold">{parseFloat(amount).toLocaleString()} {currency}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Estimated USD</span>
                  <span className="text-emerald-400 font-bold">≈ ${amountUsd.toFixed(2)}</span>
                </div>
                {isFirstDeposit && bonusSetting && bonusAmt > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-yellow-400">Welcome Bonus</span>
                    <span className="text-yellow-400 font-bold">+${bonusAmt.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Status</span>
                  <span className="text-yellow-400 font-semibold">Pending Review</span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-all"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
