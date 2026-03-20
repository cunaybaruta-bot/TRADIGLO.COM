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

interface Signal {
  asset: string;
  symbol: string;
  action: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  targetPrice: string;
  stopLoss: string;
  currentPrice: string;
  reasoning: string;
}

interface SentimentData {
  overall: 'Bullish' | 'Bearish' | 'Neutral';
  score: number;
  fearGreedIndex: number;
  fearGreedLabel: string;
  summary: string;
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

// ─── Component ────────────────────────────────────────────────────────────────

export default function AITradeIntelligencePage() {
  const { user, loading: authLoading } = useAuth();
  const supabase = createClient();

  const [realBalance, setRealBalance] = useState<number | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [sentimentData, setSentimentData] = useState<SentimentData | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

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
    const prompt = `You are an expert financial analyst AI. Generate a comprehensive market intelligence report for ${now.toUTCString()}.

Return ONLY valid JSON in this exact format (no markdown outside the json block):
\`\`\`json
{
  "overall": "Bullish",
  "score": 72,
  "fearGreedIndex": 68,
  "fearGreedLabel": "Greed",
  "summary": "2-3 sentence market overview",
  "signals": [
    {
      "asset": "Bitcoin",
      "symbol": "BTC/USD",
      "action": "BUY",
      "confidence": 87,
      "targetPrice": "$72,500",
      "stopLoss": "$61,000",
      "currentPrice": "$67,200",
      "reasoning": "Brief 1-sentence reasoning"
    }
  ]
}
\`\`\`

Generate signals for these assets: ${ASSETS.map(a => a.symbol).join(', ')}.
- overall: "Bullish", "Bearish", or "Neutral"
- score: 0-100 sentiment score
- fearGreedIndex: 0-100 (0=extreme fear, 100=extreme greed)
- action: "BUY", "SELL", or "HOLD"
- confidence: 60-95 (integer)
- Use realistic current market prices and targets
- Make the analysis feel real and data-driven`;

    sendMessage([
      { role: 'system', content: 'You are a professional financial market analyst. Always respond with valid JSON only, wrapped in a json code block.' },
      { role: 'user', content: prompt },
    ], { max_completion_tokens: 1500 });
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
        <div className="container mx-auto px-4 md:px-6 py-14 md:py-20 relative">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-semibold mb-6">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
              AI-Powered — Exclusive Premium Feature
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-5 leading-tight">
              AI Trade{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
                Intelligence
              </span>
            </h1>
            <p className="text-slate-400 text-lg md:text-xl mb-6 max-w-2xl mx-auto">
              Real-time market sentiment analysis, Fear &amp; Greed Index, and AI-generated Buy/Sell/Hold signals with target prices — powered by OpenAI GPT.
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
            <div className="mt-10 p-5 rounded-2xl bg-white/5 border border-white/10 text-left opacity-50 pointer-events-none select-none">
              <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">Preview (Locked)</div>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {['Market Sentiment', 'Fear & Greed', 'AI Signals'].map(l => (
                  <div key={l} className="p-3 rounded-xl bg-white/5 border border-white/10 text-center">
                    <div className="w-8 h-3 bg-white/20 rounded mx-auto mb-2" />
                    <div className="text-xs text-slate-500">{l}</div>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-12 bg-white/5 rounded-lg border border-white/10" />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Premium Content */}
        {user && !balanceLoading && meetsRequirement && (
          <div className="space-y-8">
            {/* Header bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-white">Market Intelligence Dashboard</h2>
                {lastUpdated && (
                  <p className="text-slate-500 text-xs mt-0.5">Last updated: {lastUpdated.toLocaleTimeString()}</p>
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
              <div className="text-center py-16">
                <div className="w-12 h-12 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-white font-semibold mb-1">AI is analyzing markets...</p>
                <p className="text-slate-400 text-sm">Processing real-time data with GPT-4o</p>
              </div>
            )}

            {sentimentData && (
              <>
                {/* Sentiment + Fear & Greed */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Overall Sentiment */}
                  <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                    <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">Market Sentiment</div>
                    <div className={`text-3xl font-extrabold mb-1 ${sentimentData.overall === 'Bullish' ? 'text-emerald-400' : sentimentData.overall === 'Bearish' ? 'text-red-400' : 'text-yellow-400'}`}>
                      {sentimentData.overall}
                    </div>
                    <div className="text-slate-400 text-sm">Score: {sentimentData.score}/100</div>
                    <div className="mt-3 h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${sentimentData.overall === 'Bullish' ? 'bg-emerald-500' : sentimentData.overall === 'Bearish' ? 'bg-red-500' : 'bg-yellow-500'}`}
                        style={{ width: `${sentimentData.score}%` }}
                      />
                    </div>
                  </div>

                  {/* Fear & Greed */}
                  <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                    <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">Fear &amp; Greed Index</div>
                    <div className={`text-3xl font-extrabold mb-1 ${getFearGreedColor(sentimentData.fearGreedIndex)}`}>
                      {sentimentData.fearGreedIndex}
                    </div>
                    <div className={`text-sm font-semibold ${getFearGreedColor(sentimentData.fearGreedIndex)}`}>
                      {getFearGreedLabel(sentimentData.fearGreedIndex)}
                    </div>
                    <div className="mt-3 h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all bg-gradient-to-r from-red-500 via-yellow-400 to-emerald-500"
                        style={{ width: `${sentimentData.fearGreedIndex}%` }}
                      />
                    </div>
                  </div>

                  {/* AI Summary */}
                  <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                    <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">AI Market Summary</div>
                    <p className="text-slate-300 text-sm leading-relaxed">{sentimentData.summary}</p>
                  </div>
                </div>

                {/* Trading Signals */}
                <div>
                  <h3 className="text-lg font-bold text-white mb-4">AI Trading Signals</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {sentimentData.signals?.map((signal, i) => (
                      <div key={i} className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/[0.07] transition-all">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <div className="text-white font-bold">{signal.asset}</div>
                            <div className="text-slate-500 text-xs">{signal.symbol}</div>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-extrabold border ${getActionColor(signal.action)}`}>
                            {signal.action}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 mb-3">
                          <div className="text-center p-2 rounded-lg bg-white/5">
                            <div className="text-slate-500 text-[10px] mb-0.5">Current</div>
                            <div className="text-white text-xs font-semibold">{signal.currentPrice}</div>
                          </div>
                          <div className="text-center p-2 rounded-lg bg-emerald-500/10">
                            <div className="text-slate-500 text-[10px] mb-0.5">Target</div>
                            <div className="text-emerald-400 text-xs font-semibold">{signal.targetPrice}</div>
                          </div>
                          <div className="text-center p-2 rounded-lg bg-red-500/10">
                            <div className="text-slate-500 text-[10px] mb-0.5">Stop Loss</div>
                            <div className="text-red-400 text-xs font-semibold">{signal.stopLoss}</div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mb-2">
                          <span className="text-slate-500 text-xs">AI Confidence</span>
                          <span className="text-white text-xs font-bold">{signal.confidence}%</span>
                        </div>
                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mb-3">
                          <div
                            className={`h-full rounded-full ${signal.confidence >= 80 ? 'bg-emerald-500' : signal.confidence >= 65 ? 'bg-blue-500' : 'bg-yellow-500'}`}
                            style={{ width: `${signal.confidence}%` }}
                          />
                        </div>

                        <p className="text-slate-400 text-xs leading-relaxed">{signal.reasoning}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Disclaimer */}
                <div className="p-4 rounded-xl bg-yellow-500/5 border border-yellow-500/20">
                  <p className="text-yellow-400/70 text-xs">
                    <strong className="text-yellow-400">Disclaimer:</strong> AI-generated signals are for informational purposes only and do not constitute financial advice. Past performance does not guarantee future results. Always conduct your own research before making trading decisions.
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
