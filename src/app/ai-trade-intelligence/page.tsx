'use client';
import React, { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { useChat } from '@/lib/hooks/useChat';
import toast from 'react-hot-toast';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TechnicalIndicators {
  rsi: number;
  macdSignal: 'Bullish' | 'Bearish' | 'Neutral';
  trend: 'Uptrend' | 'Downtrend' | 'Sideways';
  support: string;
  resistance: string;
  volume: 'High' | 'Average' | 'Low';
}

interface Signal {
  asset: string;
  symbol: string;
  action: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  entryPrice: string;
  targetPrice: string;
  stopLoss: string;
  currentPrice: string;
  changePercent: string;
  timeframe: string;
  riskReward: string;
  reasoning: string;
  sentiment: 'Bullish' | 'Bearish' | 'Neutral';
  sentimentScore: number;
  technicals: TechnicalIndicators;
  keyLevels: string[];
}

interface MarketOverview {
  totalMarketCap: string;
  btcDominance: string;
  activeTraders: string;
  volumeChange: string;
}

interface SentimentData {
  overall: 'Bullish' | 'Bearish' | 'Neutral';
  score: number;
  fearGreedIndex: number;
  fearGreedLabel: string;
  summary: string;
  marketOutlook: string;
  topOpportunity: string;
  topRisk: string;
  marketOverview: MarketOverview;
  signals: Signal[];
}

const MIN_BALANCE = 1499;

const ASSETS = [
  { asset: 'Bitcoin', symbol: 'BTC/USD' },
  { asset: 'Ethereum', symbol: 'ETH/USD' },
  { asset: 'Gold', symbol: 'XAU/USD' },
  { asset: 'S&P 500', symbol: 'SPX' },
  { asset: 'EUR/USD', symbol: 'EUR/USD' },
  { asset: 'Apple', symbol: 'AAPL' },
];

function getFearGreedColor(value: number): string {
  if (value <= 25) return 'text-red-500';
  if (value <= 45) return 'text-orange-400';
  if (value <= 55) return 'text-yellow-400';
  if (value <= 75) return 'text-lime-400';
  return 'text-emerald-400';
}

function getFearGreedBg(value: number): string {
  if (value <= 25) return 'bg-red-500';
  if (value <= 45) return 'bg-orange-400';
  if (value <= 55) return 'bg-yellow-400';
  if (value <= 75) return 'bg-lime-400';
  return 'bg-emerald-400';
}

function getFearGreedLabel(value: number): string {
  if (value <= 25) return 'Extreme Fear';
  if (value <= 45) return 'Fear';
  if (value <= 55) return 'Neutral';
  if (value <= 75) return 'Greed';
  return 'Extreme Greed';
}

function getActionColor(action: string): string {
  if (action === 'BUY') return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
  if (action === 'SELL') return 'text-red-400 bg-red-500/10 border-red-500/30';
  return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
}

function getSentimentColor(sentiment: string): string {
  if (sentiment === 'Bullish') return 'text-emerald-400';
  if (sentiment === 'Bearish') return 'text-red-400';
  return 'text-yellow-400';
}

function getRsiColor(rsi: number): string {
  if (rsi >= 70) return 'text-red-400';
  if (rsi <= 30) return 'text-emerald-400';
  return 'text-blue-400';
}

function getRsiLabel(rsi: number): string {
  if (rsi >= 70) return 'Overbought';
  if (rsi <= 30) return 'Oversold';
  return 'Neutral';
}

function parseSentimentResponse(raw: string): SentimentData | null {
  try {
    const jsonMatch = raw.match(/```json\s*([\s\S]*?)\s*```/) || raw.match(/(\{[\s\S]*\})/);
    if (!jsonMatch) return null;
    const parsed = JSON.parse(jsonMatch[1]);
    return parsed as SentimentData;
  } catch {
    return null;
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FearGreedGauge({ value }: { value: number }) {
  const rotation = -90 + (value / 100) * 180;
  const color = getFearGreedColor(value);
  const label = getFearGreedLabel(value);

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-40 h-20 overflow-hidden">
        {/* Gauge arc background */}
        <svg viewBox="0 0 160 80" className="w-full h-full">
          {/* Background arc */}
          <path d="M 10 80 A 70 70 0 0 1 150 80" fill="none" stroke="#1f2937" strokeWidth="14" strokeLinecap="round" />
          {/* Colored segments */}
          <path d="M 10 80 A 70 70 0 0 1 45 27" fill="none" stroke="#ef4444" strokeWidth="14" strokeLinecap="round" opacity="0.7" />
          <path d="M 45 27 A 70 70 0 0 1 80 10" fill="none" stroke="#f97316" strokeWidth="14" strokeLinecap="round" opacity="0.7" />
          <path d="M 80 10 A 70 70 0 0 1 115 27" fill="none" stroke="#eab308" strokeWidth="14" strokeLinecap="round" opacity="0.7" />
          <path d="M 115 27 A 70 70 0 0 1 150 80" fill="none" stroke="#22c55e" strokeWidth="14" strokeLinecap="round" opacity="0.7" />
          {/* Needle */}
          <g transform={`rotate(${rotation}, 80, 80)`}>
            <line x1="80" y1="80" x2="80" y2="18" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="80" cy="80" r="5" fill="white" />
          </g>
        </svg>
      </div>
      <div className={`text-3xl font-extrabold mt-1 ${color}`}>{value}</div>
      <div className={`text-sm font-semibold ${color}`}>{label}</div>
      <div className="flex justify-between w-full mt-2 text-[10px] text-slate-500 px-1">
        <span>Fear</span>
        <span>Neutral</span>
        <span>Greed</span>
      </div>
    </div>
  );
}

function SentimentBar({ score, sentiment }: { score: number; sentiment: string }) {
  const color = sentiment === 'Bullish' ? 'bg-emerald-500' : sentiment === 'Bearish' ? 'bg-red-500' : 'bg-yellow-500';
  return (
    <div className="mt-2">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-500">Bearish</span>
        <span className="text-slate-500">Bullish</span>
      </div>
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AITradeIntelligencePage() {
  const { user, loading: authLoading } = useAuth();
  const supabase = createClient();

  const [realBalance, setRealBalance] = useState<number | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [sentimentData, setSentimentData] = useState<SentimentData | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [selectedSignal, setSelectedSignal] = useState<Signal | null>(null);
  const [activeTab, setActiveTab] = useState<'signals' | 'technical' | 'sentiment'>('signals');

  const { response, isLoading: aiLoading, error: aiError, sendMessage } = useChat('OPEN_AI', 'gpt-4o', false);

  useEffect(() => {
    if (aiError) toast.error(aiError.message);
  }, [aiError]);

  useEffect(() => {
    if (response && !aiLoading) {
      const parsed = parseSentimentResponse(response);
      if (parsed) {
        setSentimentData(parsed);
        setLastUpdated(new Date());
        setSelectedSignal(parsed.signals?.[0] ?? null);
      }
      setAnalysisLoading(false);
    }
  }, [response, aiLoading]);

  const fetchBalance = useCallback(async () => {
    if (!user) return;
    setBalanceLoading(true);
    try {
      const { data: wallets } = await supabase.from('wallets').select('*').eq('user_id', user.id);
      if (wallets && wallets.length > 0) {
        const realWallet = wallets.find((w: any) => w.is_demo === false);
        setRealBalance(realWallet?.balance ?? 0);
      } else {
        setRealBalance(0);
      }
    } catch {
      setRealBalance(0);
    } finally {
      setBalanceLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  const meetsRequirement = realBalance !== null && realBalance >= MIN_BALANCE;

  const runAnalysis = useCallback(() => {
    if (!meetsRequirement) return;
    setAnalysisLoading(true);
    const now = new Date();
    const prompt = `You are a senior financial analyst and quantitative trader. Generate a comprehensive, data-rich market intelligence report for ${now.toUTCString()}.

Return ONLY valid JSON in this exact format (no markdown outside the json block):
\`\`\`json
{
  "overall": "Bullish",
  "score": 72,
  "fearGreedIndex": 68,
  "fearGreedLabel": "Greed",
  "summary": "3-4 sentence detailed market overview covering macro conditions, key drivers, and near-term outlook",
  "marketOutlook": "1-2 sentence forward-looking statement for the next 24-48 hours",
  "topOpportunity": "Specific asset and setup that represents the best opportunity right now",
  "topRisk": "The biggest risk factor traders should watch in the next 24-48 hours",
  "marketOverview": {
    "totalMarketCap": "$2.41T",
    "btcDominance": "52.3%",
    "activeTraders": "1.2M",
    "volumeChange": "+14.2%"
  },
  "signals": [
    {
      "asset": "Bitcoin",
      "symbol": "BTC/USD",
      "action": "BUY",
      "confidence": 87,
      "entryPrice": "$67,100",
      "targetPrice": "$72,500",
      "stopLoss": "$63,800",
      "currentPrice": "$67,340",
      "changePercent": "+2.3%",
      "timeframe": "24-48h",
      "riskReward": "1:2.4",
      "reasoning": "2-3 sentence detailed reasoning covering technical setup, catalyst, and market context",
      "sentiment": "Bullish",
      "sentimentScore": 78,
      "technicals": {
        "rsi": 58,
        "macdSignal": "Bullish",
        "trend": "Uptrend",
        "support": "$65,200",
        "resistance": "$69,800",
        "volume": "High"
      },
      "keyLevels": ["$65,200 support", "$69,800 resistance", "$72,500 target zone"]
    }
  ]
}
\`\`\`

Generate signals for ALL these assets: ${ASSETS.map(a => a.symbol).join(', ')}.

Rules:
- overall: "Bullish", "Bearish", or "Neutral"
- score: 0-100 sentiment score
- fearGreedIndex: 0-100 (0=extreme fear, 100=extreme greed)
- action: "BUY", "SELL", or "HOLD"
- confidence: 60-95 (integer)
- changePercent: include + or - sign
- riskReward: format "1:X.X" 
- rsi: 20-80 range (realistic)
- macdSignal: "Bullish", "Bearish", or "Neutral" - trend:"Uptrend", "Downtrend", or "Sideways" - volume:"High", "Average", or "Low"
- sentimentScore: 0-100
- keyLevels: array of 3 key price levels with labels
- Use realistic current market prices, targets, and stop losses
- Make the analysis feel professional, data-driven, and actionable
- Vary the signals — not all should be BUY`;

    sendMessage([
      { role: 'system', content: 'You are a professional quantitative financial analyst. Always respond with valid JSON only, wrapped in a json code block. Be specific, data-driven, and realistic.' },
      { role: 'user', content: prompt },
    ], { max_completion_tokens: 3000 });
  }, [meetsRequirement, sendMessage]);

  useEffect(() => {
    if (meetsRequirement && !sentimentData && !analysisLoading) {
      runAnalysis();
    }
  }, [meetsRequirement]);

  const isLoading = analysisLoading || aiLoading;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20 pointer-events-none" />
        <div className="container mx-auto px-4 md:px-6 py-12 md:py-16 relative">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-semibold mb-5">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
              AI-Powered — Exclusive Premium Feature
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-4 leading-tight">
              AI Trade{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
                Intelligence
              </span>
            </h1>
            <p className="text-slate-400 text-lg mb-5 max-w-2xl mx-auto">
              Real-time market sentiment, Fear &amp; Greed Index, technical analysis, and AI-generated trading signals with entry, target &amp; stop loss — powered by GPT-4o.
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-sm font-semibold">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              Premium — Requires $1,499+ Balance
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="flex-1 container mx-auto px-4 md:px-6 py-10">

        {/* Not logged in */}
        {!authLoading && !user && (
          <div className="max-w-lg mx-auto text-center py-16">
            <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-5">
              <svg className="w-8 h-8 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            </div>
            <h2 className="text-2xl font-bold mb-3">Sign In to Access AI Intelligence</h2>
            <p className="text-slate-400 mb-6">This premium feature is available exclusively to Investoft members with a minimum balance of ${MIN_BALANCE.toLocaleString()}.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/auth?tab=signin" className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all">Sign In</Link>
              <Link href="/auth" className="px-6 py-3 bg-white/10 hover:bg-white/15 text-white font-semibold rounded-xl transition-all border border-white/20">Create Account</Link>
            </div>
          </div>
        )}

        {/* Loading balance */}
        {user && balanceLoading && (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-slate-400">Checking your account...</p>
          </div>
        )}

        {/* Insufficient balance */}
        {user && !balanceLoading && realBalance !== null && !meetsRequirement && (
          <div className="max-w-lg mx-auto text-center py-16">
            <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto mb-5">
              <svg className="w-8 h-8 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h2 className="text-2xl font-bold mb-3">Upgrade to Premium</h2>
            <p className="text-slate-400 mb-2">Your current balance: <span className="text-white font-bold">${realBalance.toLocaleString()}</span></p>
            <p className="text-slate-400 mb-6">
              You need <span className="text-yellow-400 font-bold">${(MIN_BALANCE - realBalance).toLocaleString()} more</span> to unlock AI Trade Intelligence.
            </p>
            <Link href="/dashboard" className="inline-flex items-center gap-2 px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              Deposit Now
            </Link>
            {/* Preview teaser */}
            <div className="mt-10 p-5 rounded-2xl bg-white/5 border border-white/10 text-left opacity-40 pointer-events-none select-none">
              <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">Preview (Locked)</div>
              <div className="grid grid-cols-4 gap-3 mb-4">
                {['Market Sentiment', 'Fear & Greed', 'AI Signals', 'Technical Analysis'].map(l => (
                  <div key={l} className="p-3 rounded-xl bg-white/5 border border-white/10 text-center">
                    <div className="w-8 h-3 bg-white/20 rounded mx-auto mb-2" />
                    <div className="text-xs text-slate-500">{l}</div>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-14 bg-white/5 rounded-lg border border-white/10" />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Premium Content */}
        {user && !balanceLoading && meetsRequirement && (
          <div className="space-y-6">

            {/* Header bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-white">Market Intelligence Dashboard</h2>
                {lastUpdated && (
                  <p className="text-slate-500 text-xs mt-0.5">Last updated: {lastUpdated.toLocaleTimeString()} · Powered by GPT-4o</p>
                )}
              </div>
              <button
                onClick={runAnalysis}
                disabled={isLoading}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all text-sm"
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    Refresh Analysis
                  </>
                )}
              </button>
            </div>

            {/* Loading state */}
            {isLoading && !sentimentData && (
              <div className="text-center py-20">
                <div className="w-14 h-14 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-5" />
                <p className="text-white font-semibold text-lg mb-2">AI is analyzing markets...</p>
                <p className="text-slate-400 text-sm">Processing sentiment, technicals, and signals with GPT-4o</p>
                <div className="flex items-center justify-center gap-6 mt-6">
                  {['Market Sentiment', 'Technical Analysis', 'Trading Signals'].map((step, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="w-4 h-4 border border-purple-500/50 border-t-purple-400 rounded-full animate-spin" />
                      {step}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {sentimentData && (
              <>
                {/* ── Row 1: Market Overview Stats ── */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: 'Total Market Cap', value: sentimentData.marketOverview?.totalMarketCap ?? '—', icon: '📊', color: 'text-blue-400' },
                    { label: 'BTC Dominance', value: sentimentData.marketOverview?.btcDominance ?? '—', icon: '₿', color: 'text-orange-400' },
                    { label: 'Active Traders', value: sentimentData.marketOverview?.activeTraders ?? '—', icon: '👥', color: 'text-purple-400' },
                    { label: '24h Volume Δ', value: sentimentData.marketOverview?.volumeChange ?? '—', icon: '📈', color: 'text-emerald-400' },
                  ].map((stat, i) => (
                    <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/10">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">{stat.icon}</span>
                        <span className="text-slate-500 text-xs">{stat.label}</span>
                      </div>
                      <div className={`text-xl font-extrabold ${stat.color}`}>{stat.value}</div>
                    </div>
                  ))}
                </div>

                {/* ── Row 2: Sentiment + Fear & Greed + AI Summary ── */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Overall Sentiment */}
                  <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                    <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">Overall Market Sentiment</div>
                    <div className={`text-3xl font-extrabold mb-1 ${sentimentData.overall === 'Bullish' ? 'text-emerald-400' : sentimentData.overall === 'Bearish' ? 'text-red-400' : 'text-yellow-400'}`}>
                      {sentimentData.overall}
                    </div>
                    <div className="text-slate-400 text-sm mb-3">Sentiment Score: <span className="text-white font-bold">{sentimentData.score}/100</span></div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-4">
                      <div
                        className={`h-full rounded-full transition-all ${sentimentData.overall === 'Bullish' ? 'bg-emerald-500' : sentimentData.overall === 'Bearish' ? 'bg-red-500' : 'bg-yellow-500'}`}
                        style={{ width: `${sentimentData.score}%` }}
                      />
                    </div>
                    {sentimentData.topOpportunity && (
                      <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 mb-2">
                        <div className="text-emerald-400 text-[10px] font-semibold uppercase mb-1">🎯 Top Opportunity</div>
                        <div className="text-slate-300 text-xs">{sentimentData.topOpportunity}</div>
                      </div>
                    )}
                    {sentimentData.topRisk && (
                      <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                        <div className="text-red-400 text-[10px] font-semibold uppercase mb-1">⚠️ Top Risk</div>
                        <div className="text-slate-300 text-xs">{sentimentData.topRisk}</div>
                      </div>
                    )}
                  </div>

                  {/* Fear & Greed Gauge */}
                  <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center justify-center">
                    <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-4 self-start">Fear &amp; Greed Index</div>
                    <FearGreedGauge value={sentimentData.fearGreedIndex} />
                    <div className="mt-4 grid grid-cols-5 gap-1 w-full text-center">
                      {[
                        { label: 'Extreme Fear', range: '0-25', color: 'bg-red-500/20 text-red-400' },
                        { label: 'Fear', range: '26-45', color: 'bg-orange-500/20 text-orange-400' },
                        { label: 'Neutral', range: '46-55', color: 'bg-yellow-500/20 text-yellow-400' },
                        { label: 'Greed', range: '56-75', color: 'bg-lime-500/20 text-lime-400' },
                        { label: 'Ext. Greed', range: '76-100', color: 'bg-emerald-500/20 text-emerald-400' },
                      ].map((zone, i) => (
                        <div key={i} className={`px-1 py-1.5 rounded-lg text-[9px] font-semibold ${zone.color}`}>
                          <div>{zone.label}</div>
                          <div className="opacity-60">{zone.range}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* AI Summary */}
                  <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col">
                    <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">AI Market Analysis</div>
                    <p className="text-slate-300 text-sm leading-relaxed mb-4">{sentimentData.summary}</p>
                    {sentimentData.marketOutlook && (
                      <div className="mt-auto p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
                        <div className="text-purple-400 text-[10px] font-semibold uppercase mb-1">🔮 24-48h Outlook</div>
                        <p className="text-slate-300 text-xs leading-relaxed">{sentimentData.marketOutlook}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Row 3: Asset Sentiment Overview ── */}
                <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                  <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-4">Asset Sentiment Overview</div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    {sentimentData.signals?.map((signal, i) => (
                      <button
                        key={i}
                        onClick={() => { setSelectedSignal(signal); setActiveTab('signals'); }}
                        className={`p-3 rounded-xl border transition-all text-left ${selectedSignal?.symbol === signal.symbol ? 'bg-purple-500/20 border-purple-500/50' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-white text-xs font-bold">{signal.symbol}</span>
                          <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded border ${getActionColor(signal.action)}`}>{signal.action}</span>
                        </div>
                        <div className="text-slate-300 text-sm font-semibold">{signal.currentPrice}</div>
                        <div className={`text-xs font-semibold ${signal.changePercent?.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>
                          {signal.changePercent}
                        </div>
                        <SentimentBar score={signal.sentimentScore} sentiment={signal.sentiment} />
                        <div className={`text-[10px] font-semibold mt-1 ${getSentimentColor(signal.sentiment)}`}>{signal.sentiment}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* ── Row 4: Detail Panel with Tabs ── */}
                {selectedSignal && (
                  <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
                    {/* Signal Header */}
                    <div className="p-5 border-b border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-xl font-extrabold text-white">{selectedSignal.asset}</h3>
                            <span className="text-slate-500 text-sm">{selectedSignal.symbol}</span>
                            <span className={`px-3 py-1 rounded-full text-xs font-extrabold border ${getActionColor(selectedSignal.action)}`}>{selectedSignal.action}</span>
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-white font-bold text-lg">{selectedSignal.currentPrice}</span>
                            <span className={`text-sm font-semibold ${selectedSignal.changePercent?.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>{selectedSignal.changePercent}</span>
                            <span className="text-slate-500 text-xs">Timeframe: <span className="text-slate-300">{selectedSignal.timeframe}</span></span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <div className="text-slate-500 text-xs">AI Confidence</div>
                          <div className="text-white font-extrabold text-xl">{selectedSignal.confidence}%</div>
                        </div>
                        <div className="w-14 h-14 relative">
                          <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                            <circle cx="18" cy="18" r="15.9" fill="none" stroke="#1f2937" strokeWidth="3" />
                            <circle cx="18" cy="18" r="15.9" fill="none"
                              stroke={selectedSignal.confidence >= 80 ? '#10b981' : selectedSignal.confidence >= 65 ? '#3b82f6' : '#eab308'}
                              strokeWidth="3"
                              strokeDasharray={`${selectedSignal.confidence} ${100 - selectedSignal.confidence}`}
                              strokeLinecap="round"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-white/10">
                      {(['signals', 'technical', 'sentiment'] as const).map(tab => (
                        <button
                          key={tab}
                          onClick={() => setActiveTab(tab)}
                          className={`px-5 py-3 text-sm font-semibold capitalize transition-all ${activeTab === tab ? 'text-purple-400 border-b-2 border-purple-400' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                          {tab === 'signals' ? 'Trading Signal' : tab === 'technical' ? 'Technical Analysis' : 'Sentiment'}
                        </button>
                      ))}
                    </div>

                    {/* Tab Content */}
                    <div className="p-5">
                      {/* Trading Signal Tab */}
                      {activeTab === 'signals' && (
                        <div className="space-y-5">
                          {/* Price Levels */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
                              <div className="text-slate-500 text-xs mb-1">Entry Price</div>
                              <div className="text-blue-400 font-extrabold text-lg">{selectedSignal.entryPrice}</div>
                              <div className="text-slate-600 text-[10px] mt-0.5">Recommended entry</div>
                            </div>
                            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                              <div className="text-slate-500 text-xs mb-1">Target Price</div>
                              <div className="text-emerald-400 font-extrabold text-lg">{selectedSignal.targetPrice}</div>
                              <div className="text-slate-600 text-[10px] mt-0.5">Take profit zone</div>
                            </div>
                            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-center">
                              <div className="text-slate-500 text-xs mb-1">Stop Loss</div>
                              <div className="text-red-400 font-extrabold text-lg">{selectedSignal.stopLoss}</div>
                              <div className="text-slate-600 text-[10px] mt-0.5">Max risk level</div>
                            </div>
                            <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 text-center">
                              <div className="text-slate-500 text-xs mb-1">Risk/Reward</div>
                              <div className="text-purple-400 font-extrabold text-lg">{selectedSignal.riskReward}</div>
                              <div className="text-slate-600 text-[10px] mt-0.5">Ratio</div>
                            </div>
                          </div>

                          {/* AI Reasoning */}
                          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                            <div className="flex items-center gap-2 mb-2">
                              <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                              <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">AI Reasoning</span>
                            </div>
                            <p className="text-slate-300 text-sm leading-relaxed">{selectedSignal.reasoning}</p>
                          </div>

                          {/* Key Levels */}
                          {selectedSignal.keyLevels && selectedSignal.keyLevels.length > 0 && (
                            <div>
                              <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">Key Price Levels</div>
                              <div className="flex flex-wrap gap-2">
                                {selectedSignal.keyLevels.map((level, i) => (
                                  <span key={i} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 text-xs font-medium">
                                    📍 {level}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Technical Analysis Tab */}
                      {activeTab === 'technical' && selectedSignal.technicals && (
                        <div className="space-y-5">
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {/* RSI */}
                            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                              <div className="text-slate-500 text-xs mb-2">RSI (14)</div>
                              <div className={`text-2xl font-extrabold ${getRsiColor(selectedSignal.technicals.rsi)}`}>
                                {selectedSignal.technicals.rsi}
                              </div>
                              <div className={`text-xs font-semibold mt-0.5 ${getRsiColor(selectedSignal.technicals.rsi)}`}>
                                {getRsiLabel(selectedSignal.technicals.rsi)}
                              </div>
                              <div className="mt-2 h-2 bg-white/10 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${selectedSignal.technicals.rsi >= 70 ? 'bg-red-500' : selectedSignal.technicals.rsi <= 30 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                                  style={{ width: `${selectedSignal.technicals.rsi}%` }}
                                />
                              </div>
                              <div className="flex justify-between text-[10px] text-slate-600 mt-1">
                                <span>0</span><span>30</span><span>70</span><span>100</span>
                              </div>
                            </div>

                            {/* MACD */}
                            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                              <div className="text-slate-500 text-xs mb-2">MACD Signal</div>
                              <div className={`text-2xl font-extrabold ${selectedSignal.technicals.macdSignal === 'Bullish' ? 'text-emerald-400' : selectedSignal.technicals.macdSignal === 'Bearish' ? 'text-red-400' : 'text-yellow-400'}`}>
                                {selectedSignal.technicals.macdSignal === 'Bullish' ? '↑' : selectedSignal.technicals.macdSignal === 'Bearish' ? '↓' : '→'}
                              </div>
                              <div className={`text-sm font-semibold ${selectedSignal.technicals.macdSignal === 'Bullish' ? 'text-emerald-400' : selectedSignal.technicals.macdSignal === 'Bearish' ? 'text-red-400' : 'text-yellow-400'}`}>
                                {selectedSignal.technicals.macdSignal}
                              </div>
                              <div className="text-slate-600 text-xs mt-1">Moving Avg Convergence</div>
                            </div>

                            {/* Trend */}
                            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                              <div className="text-slate-500 text-xs mb-2">Trend Direction</div>
                              <div className={`text-2xl font-extrabold ${selectedSignal.technicals.trend === 'Uptrend' ? 'text-emerald-400' : selectedSignal.technicals.trend === 'Downtrend' ? 'text-red-400' : 'text-yellow-400'}`}>
                                {selectedSignal.technicals.trend === 'Uptrend' ? '📈' : selectedSignal.technicals.trend === 'Downtrend' ? '📉' : '➡️'}
                              </div>
                              <div className={`text-sm font-semibold ${selectedSignal.technicals.trend === 'Uptrend' ? 'text-emerald-400' : selectedSignal.technicals.trend === 'Downtrend' ? 'text-red-400' : 'text-yellow-400'}`}>
                                {selectedSignal.technicals.trend}
                              </div>
                              <div className="text-slate-600 text-xs mt-1">Current price trend</div>
                            </div>

                            {/* Support */}
                            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                              <div className="text-slate-500 text-xs mb-2">Support Level</div>
                              <div className="text-emerald-400 text-xl font-extrabold">{selectedSignal.technicals.support}</div>
                              <div className="text-slate-500 text-xs mt-1">Key demand zone</div>
                            </div>

                            {/* Resistance */}
                            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                              <div className="text-slate-500 text-xs mb-2">Resistance Level</div>
                              <div className="text-red-400 text-xl font-extrabold">{selectedSignal.technicals.resistance}</div>
                              <div className="text-slate-500 text-xs mt-1">Key supply zone</div>
                            </div>

                            {/* Volume */}
                            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                              <div className="text-slate-500 text-xs mb-2">Volume</div>
                              <div className={`text-xl font-extrabold ${selectedSignal.technicals.volume === 'High' ? 'text-emerald-400' : selectedSignal.technicals.volume === 'Low' ? 'text-red-400' : 'text-yellow-400'}`}>
                                {selectedSignal.technicals.volume}
                              </div>
                              <div className="flex gap-1 mt-2">
                                {['Low', 'Average', 'High'].map((v, i) => (
                                  <div key={i} className={`flex-1 h-2 rounded-full ${selectedSignal.technicals.volume === v ? (v === 'High' ? 'bg-emerald-500' : v === 'Low' ? 'bg-red-500' : 'bg-yellow-500') : 'bg-white/10'}`} />
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Sentiment Tab */}
                      {activeTab === 'sentiment' && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                              <div className="text-slate-500 text-xs mb-3">Asset Sentiment</div>
                              <div className={`text-3xl font-extrabold mb-2 ${getSentimentColor(selectedSignal.sentiment)}`}>
                                {selectedSignal.sentiment}
                              </div>
                              <div className="text-slate-400 text-sm mb-3">Score: <span className="text-white font-bold">{selectedSignal.sentimentScore}/100</span></div>
                              <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${selectedSignal.sentiment === 'Bullish' ? 'bg-emerald-500' : selectedSignal.sentiment === 'Bearish' ? 'bg-red-500' : 'bg-yellow-500'}`}
                                  style={{ width: `${selectedSignal.sentimentScore}%` }}
                                />
                              </div>
                              <div className="flex justify-between text-[10px] text-slate-600 mt-1">
                                <span>Extreme Bearish</span><span>Neutral</span><span>Extreme Bullish</span>
                              </div>
                            </div>
                            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                              <div className="text-slate-500 text-xs mb-3">Signal Summary</div>
                              <div className="space-y-2">
                                {[
                                  { label: 'Action', value: selectedSignal.action, color: getActionColor(selectedSignal.action) },
                                  { label: 'Confidence', value: `${selectedSignal.confidence}%`, color: 'text-white' },
                                  { label: 'Timeframe', value: selectedSignal.timeframe, color: 'text-blue-400' },
                                  { label: 'Risk/Reward', value: selectedSignal.riskReward, color: 'text-purple-400' },
                                ].map((item, i) => (
                                  <div key={i} className="flex justify-between items-center py-1.5 border-b border-white/5">
                                    <span className="text-slate-500 text-xs">{item.label}</span>
                                    <span className={`text-xs font-bold ${item.color.includes('border') ? item.color.split(' ')[0] : item.color}`}>{item.value}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ── Row 5: All Signals Grid ── */}
                <div>
                  <h3 className="text-lg font-bold text-white mb-4">All Trading Signals</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {sentimentData.signals?.map((signal, i) => (
                      <button
                        key={i}
                        onClick={() => { setSelectedSignal(signal); setActiveTab('signals'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                        className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/[0.08] hover:border-purple-500/30 transition-all text-left"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <div className="text-white font-bold">{signal.asset}</div>
                            <div className="text-slate-500 text-xs">{signal.symbol}</div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className={`px-3 py-1 rounded-full text-xs font-extrabold border ${getActionColor(signal.action)}`}>{signal.action}</span>
                            <span className={`text-xs font-semibold ${signal.changePercent?.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>{signal.changePercent}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-4 gap-2 mb-3">
                          <div className="text-center p-2 rounded-lg bg-white/5">
                            <div className="text-slate-500 text-[10px] mb-0.5">Current</div>
                            <div className="text-white text-xs font-semibold">{signal.currentPrice}</div>
                          </div>
                          <div className="text-center p-2 rounded-lg bg-blue-500/10">
                            <div className="text-slate-500 text-[10px] mb-0.5">Entry</div>
                            <div className="text-blue-400 text-xs font-semibold">{signal.entryPrice}</div>
                          </div>
                          <div className="text-center p-2 rounded-lg bg-emerald-500/10">
                            <div className="text-slate-500 text-[10px] mb-0.5">Target</div>
                            <div className="text-emerald-400 text-xs font-semibold">{signal.targetPrice}</div>
                          </div>
                          <div className="text-center p-2 rounded-lg bg-red-500/10">
                            <div className="text-slate-500 text-[10px] mb-0.5">Stop</div>
                            <div className="text-red-400 text-xs font-semibold">{signal.stopLoss}</div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500 text-xs">Confidence</span>
                            <span className="text-white text-xs font-bold">{signal.confidence}%</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500 text-xs">R/R</span>
                            <span className="text-purple-400 text-xs font-bold">{signal.riskReward}</span>
                          </div>
                        </div>
                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mb-3">
                          <div
                            className={`h-full rounded-full ${signal.confidence >= 80 ? 'bg-emerald-500' : signal.confidence >= 65 ? 'bg-blue-500' : 'bg-yellow-500'}`}
                            style={{ width: `${signal.confidence}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[10px] font-semibold ${getSentimentColor(signal.sentiment)}`}>● {signal.sentiment}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-500 text-[10px]">RSI:</span>
                            <span className={`text-[10px] font-bold ${getRsiColor(signal.technicals?.rsi ?? 50)}`}>{signal.technicals?.rsi ?? '—'}</span>
                            <span className="text-slate-500 text-[10px]">·</span>
                            <span className={`text-[10px] font-semibold ${signal.technicals?.macdSignal === 'Bullish' ? 'text-emerald-400' : signal.technicals?.macdSignal === 'Bearish' ? 'text-red-400' : 'text-yellow-400'}`}>
                              MACD {signal.technicals?.macdSignal ?? '—'}
                            </span>
                          </div>
                        </div>

                        <p className="text-slate-400 text-xs leading-relaxed line-clamp-2">{signal.reasoning}</p>

                        <div className="mt-3 flex items-center gap-1 text-purple-400 text-xs font-semibold">
                          <span>View full analysis</span>
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Disclaimer */}
                <div className="p-4 rounded-xl bg-yellow-500/5 border border-yellow-500/20">
                  <p className="text-yellow-400/70 text-xs">
                    <strong className="text-yellow-400">Disclaimer:</strong> AI-generated signals are for informational purposes only and do not constitute financial advice. Past performance does not guarantee future results. Always conduct your own research before making trading decisions. Trading involves significant risk of loss.
                  </p>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
