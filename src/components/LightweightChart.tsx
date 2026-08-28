'use client';

import React, { useEffect, useRef, useImperativeHandle, forwardRef, useState, useCallback } from 'react';
import {
  createChart,
  CandlestickSeries,
  BarSeries,
  LineSeries,
  AreaSeries,
  BaselineSeries,
  HistogramSeries,
  LineStyle,
  type IChartApi,
  type ISeriesApi,
  type SeriesType,
  type CandlestickData,
  type LineData,
  type IPriceLine,
  type Time,
} from 'lightweight-charts';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LightweightChartHandle {
  getCurrentPrice: () => number | null;
  addEntryLine: (tradeId: string, price: number, orderType: 'buy' | 'sell') => void;
  removeEntryLine: (tradeId: string) => void;
}

interface LightweightChartProps {
  symbol: string;
  category?: string;
  exchange?: string;
  openTrades?: Array<{ id: string; entry_price: number; order_type: 'buy' | 'sell'; status: string }>;
  onChartReady?: () => void;
  onPriceUpdate?: (price: number, change: number, changePct: number) => void;
}

// ─── Indicator types ──────────────────────────────────────────────────────────

type IndicatorKey = 'MA' | 'EMA' | 'BB' | 'RSI' | 'MACD' | 'Stoch' | 'Vol' | 'Ichimoku' | 'SAR' | 'ATR' | 'CCI' | 'VWAP' | 'Pivot';

// Groups the indicator picker into "drawn on the price pane" vs "own
// sub-panel below" instead of one flat grid — matches how the indicators
// actually render, not just an arbitrary list order.
const INDICATOR_GROUPS: { label: string; keys: IndicatorKey[] }[] = [
  { label: 'Overlays', keys: ['MA', 'EMA', 'BB', 'Ichimoku', 'SAR', 'VWAP', 'Pivot', 'Vol'] },
  { label: 'Oscillators', keys: ['RSI', 'MACD', 'Stoch', 'ATR', 'CCI'] },
];

interface LegendItem { label: string; color: string; value: string; }

function fmtLegendVal(v: number): string {
  if (!Number.isFinite(v)) return '—';
  const abs = Math.abs(v);
  return abs >= 1000 ? v.toFixed(0) : abs >= 1 ? v.toFixed(2) : v.toFixed(4);
}

// ─── Drawing types ────────────────────────────────────────────────────────────

type DrawingTool = 'trendline' | 'horizontal' | 'freehand' | 'fibonacci' | 'delete' | null;

// ─── Chart type (visual style of the main series) ────────────────────────────

type ChartType = 'candles' | 'bars' | 'line' | 'area' | 'baseline';

// TradingView's own charting UI font stack — applied only within the chart
// component (toolbar, dropdowns, axis/crosshair labels), not the rest of the
// app, which keeps its own Inter/Geist Mono typography.
const TRADINGVIEW_FONT = '-apple-system, BlinkMacSystemFont, "Trebuchet MS", Roboto, Ubuntu, sans-serif';

const UP_COLOR = '#22c55e';
const DOWN_COLOR = '#ef4444';

/** Creates and returns the main series for the given chart type, styled to
 * match the app's green/red up/down convention. */
function createMainSeriesForType(chart: IChartApi, type: ChartType): ISeriesApi<SeriesType> {
  switch (type) {
    case 'bars':
      return chart.addSeries(BarSeries, {
        upColor: UP_COLOR,
        downColor: DOWN_COLOR,
        thinBars: false,
      });
    case 'line':
      return chart.addSeries(LineSeries, {
        color: UP_COLOR,
        lineWidth: 2,
        priceLineVisible: true,
        lastValueVisible: true,
      });
    case 'area':
      return chart.addSeries(AreaSeries, {
        lineColor: UP_COLOR,
        topColor: 'rgba(34,197,94,0.32)',
        bottomColor: 'rgba(34,197,94,0.02)',
        lineWidth: 2,
        priceLineVisible: true,
        lastValueVisible: true,
      });
    case 'baseline':
      return chart.addSeries(BaselineSeries, {
        topLineColor: UP_COLOR,
        bottomLineColor: DOWN_COLOR,
        topFillColor1: 'rgba(34,197,94,0.28)',
        topFillColor2: 'rgba(34,197,94,0.02)',
        bottomFillColor1: 'rgba(239,68,68,0.02)',
        bottomFillColor2: 'rgba(239,68,68,0.28)',
        lineWidth: 2,
        priceLineVisible: true,
        lastValueVisible: true,
      });
    case 'candles':
    default:
      return chart.addSeries(CandlestickSeries, {
        upColor: UP_COLOR,
        downColor: DOWN_COLOR,
        borderVisible: false,
        wickUpColor: UP_COLOR,
        wickDownColor: DOWN_COLOR,
      });
  }
}

/** Converts OHLC bars to whatever data shape the given chart type's series
 * expects — candles/bars keep full OHLC, everything else collapses to a
 * single value (close) per point. */
function barsToSeriesData(bars: CandlestickData[], type: ChartType): CandlestickData[] | LineData[] {
  if (type === 'candles' || type === 'bars') return bars;
  return bars.map((b) => ({ time: b.time, value: b.close }));
}

/** Converts one live OHLC tick to the point shape the current series expects. */
function barToSeriesPoint(bar: CandlestickData, type: ChartType): CandlestickData | LineData {
  if (type === 'candles' || type === 'bars') return bar;
  return { time: bar.time, value: bar.close };
}

interface Point { x: number; y: number }

interface TrendLineDrawing {
  id: string;
  type: 'trendline';
  p1: Point;
  p2: Point;
  color: string;
}

interface HorizontalDrawing {
  id: string;
  type: 'horizontal';
  y: number;
  color: string;
}

interface FreehandDrawing {
  id: string;
  type: 'freehand';
  points: Point[];
  color: string;
}

interface FibonacciDrawing {
  id: string;
  type: 'fibonacci';
  p1: Point;
  p2: Point;
  color: string;
}

type Drawing = TrendLineDrawing | HorizontalDrawing | FreehandDrawing | FibonacciDrawing;

// Standard retracement ratios, each with its own conventional color so
// levels are distinguishable at a glance (matches common charting tools).
const FIB_LEVELS: { ratio: number; color: string }[] = [
  { ratio: 0,     color: '#94a3b8' },
  { ratio: 0.236, color: '#f59e0b' },
  { ratio: 0.382, color: '#eab308' },
  { ratio: 0.5,   color: '#22c55e' },
  { ratio: 0.618, color: '#38bdf8' },
  { ratio: 0.786, color: '#a78bfa' },
  { ratio: 1,     color: '#94a3b8' },
];

// ─── Timeframe config ─────────────────────────────────────────────────────────

interface TimeframeConfig {
  label: string;
  binanceInterval: string;
  tdInterval: string;
  limit: number;
}

const TIMEFRAMES: TimeframeConfig[] = [
  { label: '1m',  binanceInterval: '1m',  tdInterval: '1min',   limit: 150 },
  { label: '5m',  binanceInterval: '5m',  tdInterval: '5min',   limit: 150 },
  { label: '15m', binanceInterval: '15m', tdInterval: '15min',  limit: 150 },
  { label: '30m', binanceInterval: '30m', tdInterval: '30min',  limit: 150 },
  { label: '1h',  binanceInterval: '1h',  tdInterval: '1h',     limit: 150 },
  { label: '4h',  binanceInterval: '4h',  tdInterval: '4h',     limit: 150 },
  { label: '12h', binanceInterval: '12h', tdInterval: '12h',    limit: 150 },
  { label: '1D',  binanceInterval: '1d',  tdInterval: '1day',   limit: 150 },
  { label: '3D',  binanceInterval: '3d',  tdInterval: '1day',   limit: 150 },
  { label: '1W',  binanceInterval: '1w',  tdInterval: '1week',  limit: 150 },
  { label: '1M',  binanceInterval: '1M',  tdInterval: '1month', limit: 150 },
  { label: '3M',  binanceInterval: '1M',  tdInterval: '1month', limit: 150 },
  { label: '6M',  binanceInterval: '1M',  tdInterval: '1month', limit: 150 },
  { label: '1Y',  binanceInterval: '1d',  tdInterval: '1day',   limit: 365 },
  { label: '5Y',  binanceInterval: '1w',  tdInterval: '1week',  limit: 260 },
  { label: 'ALL', binanceInterval: '1M',  tdInterval: '1month', limit: 150 },
];

const WS_TIMEOUT_MS = 10_000;
const LIVE_EDGE_BUFFER_BARS = 2;
// Chart is the primary content of the trade screen — sized generously per
// breakpoint so it dominates the layout instead of competing for space with
// the Open Trades panel below it (which is capped separately).
const MOBILE_CHART_HEIGHT = 300;
const TABLET_CHART_HEIGHT = 380;
const CHART_HEIGHT = 400;
const INITIAL_HISTORY_LIMIT = 500;
const HISTORY_PAGE_SIZE = 500;
const HISTORY_LOAD_THRESHOLD = 25;

// ─── Fetch timeout helper ─────────────────────────────────────────────────────
function fetchWithTimeout(url: string, timeoutMs = 5000, cacheSeconds = 0): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const cacheOpt: RequestCache = cacheSeconds > 0 ? 'default' : 'no-store';
  return fetch(url, { signal: controller.signal, cache: cacheOpt }).finally(() => clearTimeout(timer));
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isCrypto(category?: string, symbol?: string): boolean {
  if (category === 'crypto') return true;
  if (category && category !== 'crypto') return false;
  const CRYPTO_SYMBOLS = ['BTC','ETH','SOL','BNB','XRP','ADA','DOGE','AVAX','DOT','MATIC'];
  return !!(symbol && CRYPTO_SYMBOLS.includes(symbol.toUpperCase().replace('USDT','').replace('/USDT','')));
}

// ── Free real-time proxy feeds ──────────────────────────────────────────────
// Some non-crypto instruments don't have a free, reliable real-time feed of
// their own (e.g. TwelveData gates commodities behind a paid plan). Where a
// tightly-tracking tokenized asset trades on Binance, use its live ticker as
// a free real-time stand-in instead of falling back to a simulated price.
// XAUUSD -> PAXG (Pax Gold, backed 1:1 by physical gold, tracks spot XAU/USD).
const BINANCE_PROXY_SYMBOLS: Record<string, string> = {
  XAUUSD: 'PAXGUSDT',
};

function usesBinanceProxy(symbol: string): boolean {
  return !!BINANCE_PROXY_SYMBOLS[symbol.toUpperCase()];
}

// lightweight-charts always formats time-axis labels in UTC. Every candle
// timestamp we feed it is shifted by the viewer's own timezone offset so the
// axis reads as their real local wall-clock time instead of UTC — the data
// itself (price, elapsed time between candles) is untouched, only the label
// shown to this viewer is corrected to match their real clock.
function toLocalDisplayTime(unixSeconds: number): Time {
  return (unixSeconds - new Date().getTimezoneOffset() * 60) as Time;
}

function toBinanceSymbol(symbol: string): string {
  const clean = symbol.replace('/', '').toUpperCase();
  if (BINANCE_PROXY_SYMBOLS[clean]) return BINANCE_PROXY_SYMBOLS[clean];
  if (clean.endsWith('USDT')) return clean;
  return clean + 'USDT';
}

function toTwelveDataSymbol(symbol: string, category?: string): string {
  const s = symbol.toUpperCase();
  const normalizedCategory = category?.toLowerCase() ?? '';

  // ── Commodities with a verified Twelve Data mapping ────────────────────────
  // Exchange futures (HG1!, ZC1!, KC1!, etc.) deliberately pass through
  // untouched. They must not be relabelled as a made-up USD pair.
  const COMMODITY_MAP: Record<string, string> = {
    XAUUSD: 'XAU/USD',
    XAGUSD: 'XAG/USD',
  };
  if (COMMODITY_MAP[s]) return COMMODITY_MAP[s];

  // ── Stocks: TwelveData uses plain ticker symbols (e.g. GOOGL, not GOOGL:NASDAQ) ──
  const STOCK_TICKERS = new Set([
    'AAPL','MSFT','GOOGL','GOOG','AMZN','META','TSLA','NVDA','NFLX',
    'INTC','AMD','QCOM','CSCO','ADBE','CRM','PYPL','SHOP','SNAP',
    'UBER','LYFT','ZM','ZOOM','COIN','RBLX','HOOD','PLTR','AFRM',
    'RIVN','LCID','MSTR','AVGO','TXN','MU','LRCX','KLAC','AMAT',
    'MRVL','PANW','CRWD','OKTA','DDOG','SNOW','INTU','ADSK','ANSS',
    'IDXX','ILMN','REGN','BIIB','GILD','AMGN','ISRG','ALGN','DXCM',
    'MRNA','BNTX','SGEN','COST','SBUX','MDLZ','MNST','KHC','WBA',
    'FAST','ODFL','CTAS','PAYX','VRSK','CPRT',
    'JPM','BAC','WFC','C','GS','MS','BLK','AXP','COF','USB','PNC','TFC',
    'JNJ','PFE','MRK','ABT','ABBV','BMY','LLY','UNH','CVS','CI','HUM','MCK',
    'XOM','CVX','COP','SLB','EOG','PXD','OXY','VLO','MPC','PSX','HAL','BKR',
    'BA','LMT','RTX','NOC','GD','LHX','HII',
    'CAT','DE','HON','MMM','GE','EMR','ETN','PH',
    'UPS','FDX','DAL','UAL','AAL','LUV','CCL','RCL',
    'MAR','HLT','H','MGM',
    'WMT','TGT','HD','LOW','NKE','VFC','PVH','RL',
    'KO','PEP','MCD','YUM','DPZ','CMG','DRI','DNUT',
    'T','VZ','TMUS','CMCSA','CHTR','DIS','PARA','WBD','NWSA','FOX','FOXA',
    'NEE','DUK','SO','D','AEP','EXC','SRE','PCG',
    'PG','CL','KMB','CHD','CLX','EL','ULTA','COTY',
    'V','MA','FIS','FISV','SQ','ACIW','WEX','GPN',
    'BABA','NIO','TSM','SONY','TM','HMC','NSANY','SAP','ASML','ARM','SMCI',
    'IBM','HPQ','DELL','ACN','NOW','WDAY','VEEV','HUBS','TWLO','ZS','NET',
    'FSLY','ESTC','MDB','CFLT',
    'SPGI','MCO','ICE','CME','NDAQ','CBOE','MSCI',
    'BRK','BRKB','BRKA',
  ]);
  if (STOCK_TICKERS.has(s)) return s;

  // ── Currencies: convert 6-char XXXYYY → XXX/YYY ──────────────────────────
  if (
    ['forex', 'currency', 'currencies'].includes(normalizedCategory)
    && s.length === 6
    && /^[A-Z]{6}$/.test(s)
  ) return s.slice(0, 3) + '/' + s.slice(3);
  if (s.includes('/')) return s;

  // Fallback: return as-is
  return s;
}

// ─── Binance fetch ────────────────────────────────────────────────────────────

async function fetchBinanceKlines(binanceSymbol: string, interval: string, limit = 150, endTime?: number): Promise<any[]> {
  const endTimeParam = endTime ? `&endTime=${endTime}` : '';
  const urls = [
    `https://api.binance.com/api/v3/klines?symbol=${binanceSymbol}&interval=${interval}&limit=${limit}${endTimeParam}`,
    `https://data-api.binance.vision/api/v3/klines?symbol=${binanceSymbol}&interval=${interval}&limit=${limit}${endTimeParam}`,
  ];
  try {
    const result = await Promise.any(
      urls.map(async (url) => {
        const res = await fetchWithTimeout(url, 5000);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!Array.isArray(data) || data.length === 0) throw new Error('Empty data');
        return data;
      })
    );
    return result;
  } catch {
    return [];
  }
}

// ─── Twelve Data fetch ────────────────────────────────────────────────────────

async function fetchTwelveDataKlines(
  symbol: string,
  interval: string,
  limit = 150,
  endDate?: string,
  exchange?: string,
  category?: string,
): Promise<CandlestickData[]> {
  try {
    const params = new URLSearchParams({ symbol, interval, outputsize: String(limit) });
    if (endDate) params.set('end_date', endDate);
    if (exchange) params.set('exchange', exchange);
    if (category) params.set('category', category);
    const url = `/api/twelvedata/timeseries?${params.toString()}`;
    const res = await fetchWithTimeout(url, 8000, 30);
    if (!res.ok) {
      console.warn('[TwelveData] HTTP error for symbol:', symbol, 'status:', res.status);
      return [];
    }
    const json = await res.json();
    if (!json.values || !Array.isArray(json.values)) {
      console.warn('[TwelveData] No values for symbol:', symbol, json?.message ?? json);
      return [];
    }
    let candles: CandlestickData[] = json.values
      .reverse()
      .map((v: any) => ({
        time: toLocalDisplayTime(Math.floor(new Date(v.datetime).getTime() / 1000)),
        open: parseFloat(v.open),
        high: parseFloat(v.high),
        low: parseFloat(v.low),
        close: parseFloat(v.close),
      }))
      .filter((c: CandlestickData) => !isNaN(c.open) && !isNaN(c.close));
    return candles;
  } catch (err) {
    console.warn('[TwelveData] Fetch error for symbol:', symbol, err);
    return [];
  }
}

// ─── Indicator calculation helpers ───────────────────────────────────────────

function calcSMA(closes: number[], period: number): (number | null)[] {
  const result: (number | null)[] = new Array(closes.length).fill(null);
  for (let i = period - 1; i < closes.length; i++) {
    const sum = closes.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
    result[i] = sum / period;
  }
  return result;
}

function calcEMA(closes: number[], period: number): (number | null)[] {
  const result: (number | null)[] = new Array(closes.length).fill(null);
  const k = 2 / (period + 1);
  let ema: number | null = null;
  for (let i = 0; i < closes.length; i++) {
    if (i < period - 1) continue;
    if (ema === null) {
      ema = closes.slice(0, period).reduce((a, b) => a + b, 0) / period;
    } else {
      ema = closes[i] * k + ema * (1 - k);
    }
    result[i] = ema;
  }
  return result;
}

function calcBB(closes: number[], period = 20, stdDev = 2): { upper: (number | null)[]; middle: (number | null)[]; lower: (number | null)[] } {
  const middle = calcSMA(closes, period);
  const upper: (number | null)[] = new Array(closes.length).fill(null);
  const lower: (number | null)[] = new Array(closes.length).fill(null);
  for (let i = period - 1; i < closes.length; i++) {
    const slice = closes.slice(i - period + 1, i + 1);
    const mean = middle[i] as number;
    const variance = slice.reduce((sum, v) => sum + (v - mean) ** 2, 0) / period;
    const sd = Math.sqrt(variance);
    upper[i] = mean + stdDev * sd;
    lower[i] = mean - stdDev * sd;
  }
  return { upper, middle, lower };
}

function calcRSI(closes: number[], period = 14): (number | null)[] {
  const result: (number | null)[] = new Array(closes.length).fill(null);
  if (closes.length < period + 1) return result;
  let avgGain = 0, avgLoss = 0;
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) avgGain += diff; else avgLoss += Math.abs(diff);
  }
  avgGain /= period; avgLoss /= period;
  result[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? Math.abs(diff) : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    result[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  }
  return result;
}

function calcMACD(closes: number[], fast = 12, slow = 26, signal = 9): { macd: (number | null)[]; signal: (number | null)[]; histogram: (number | null)[] } {
  const fastEMA = calcEMA(closes, fast);
  const slowEMA = calcEMA(closes, slow);
  const macd: (number | null)[] = closes.map((_, i) =>
    fastEMA[i] !== null && slowEMA[i] !== null ? (fastEMA[i] as number) - (slowEMA[i] as number) : null
  );
  const macdValues = macd.map(v => v ?? 0);
  const signalLine = calcEMA(macdValues, signal);
  const histogram: (number | null)[] = macd.map((v, i) =>
    v !== null && signalLine[i] !== null ? v - (signalLine[i] as number) : null
  );
  return { macd, signal: signalLine, histogram };
}

function calcStoch(candles: CandlestickData[], kPeriod = 14, dPeriod = 3, smooth = 3): { k: (number | null)[]; d: (number | null)[] } {
  const n = candles.length;
  const rawK: (number | null)[] = new Array(n).fill(null);
  for (let i = kPeriod - 1; i < n; i++) {
    const slice = candles.slice(i - kPeriod + 1, i + 1);
    const high = Math.max(...slice.map(c => c.high as number));
    const low = Math.min(...slice.map(c => c.low as number));
    const close = candles[i].close as number;
    rawK[i] = high === low ? 0 : ((close - low) / (high - low)) * 100;
  }
  const smoothK = calcSMA(rawK.map(v => v ?? 0), smooth);
  const d = calcSMA(smoothK.map(v => v ?? 0), dPeriod);
  return { k: smoothK, d };
}

function calcIchimoku(candles: CandlestickData[], tenkanPeriod = 9, kijunPeriod = 26, senkouBPeriod = 52): {
  tenkan: (number | null)[];
  kijun: (number | null)[];
  senkouA: (number | null)[];
  senkouB: (number | null)[];
  chikou: (number | null)[];
} {
  const highs = candles.map((c) => c.high as number);
  const lows = candles.map((c) => c.low as number);
  const closes = candles.map((c) => c.close as number);
  const n = candles.length;

  const midpoint = (period: number, i: number): number | null => {
    if (i < period - 1) return null;
    const sliceH = highs.slice(i - period + 1, i + 1);
    const sliceL = lows.slice(i - period + 1, i + 1);
    return (Math.max(...sliceH) + Math.min(...sliceL)) / 2;
  };

  const tenkan: (number | null)[] = candles.map((_, i) => midpoint(tenkanPeriod, i));
  const kijun: (number | null)[] = candles.map((_, i) => midpoint(kijunPeriod, i));

  const senkouA: (number | null)[] = new Array(n).fill(null);
  for (let i = 0; i < n; i++) {
    if (tenkan[i] !== null && kijun[i] !== null) {
      const futureIdx = i + kijunPeriod;
      if (futureIdx < n) {
        senkouA[futureIdx] = ((tenkan[i] as number) + (kijun[i] as number)) / 2;
      }
    }
  }

  const senkouB: (number | null)[] = new Array(n).fill(null);
  for (let i = 0; i < n; i++) {
    const val = midpoint(senkouBPeriod, i);
    if (val !== null) {
      const futureIdx = i + kijunPeriod;
      if (futureIdx < n) {
        senkouB[futureIdx] = val;
      }
    }
  }

  const chikou: (number | null)[] = new Array(n).fill(null);
  for (let i = kijunPeriod; i < n; i++) {
    chikou[i - kijunPeriod] = closes[i];
  }

  return { tenkan, kijun, senkouA, senkouB, chikou };
}

function calcParabolicSAR(candles: CandlestickData[], step = 0.02, maxAF = 0.2): { sar: number[]; trend: boolean[] } {
  const highs = candles.map((c) => c.high as number);
  const lows = candles.map((c) => c.low as number);
  const n = candles.length;
  if (n < 2) return { sar: [], trend: [] };

  const sar: number[] = new Array(n).fill(0);
  const trend: boolean[] = new Array(n).fill(true);
  let af = step;
  let ep = highs[0];
  let isUptrend = true;
  sar[0] = lows[0];

  for (let i = 1; i < n; i++) {
    const prevSar = sar[i - 1];
    let newSar: number;

    if (isUptrend) {
      newSar = prevSar + af * (ep - prevSar);
      newSar = Math.min(newSar, lows[i - 1], i >= 2 ? lows[i - 2] : lows[i - 1]);
      if (lows[i] < newSar) {
        isUptrend = false;
        newSar = ep;
        ep = lows[i];
        af = step;
      } else {
        if (highs[i] > ep) {
          ep = highs[i];
          af = Math.min(af + step, maxAF);
        }
      }
    } else {
      newSar = prevSar + af * (ep - prevSar);
      newSar = Math.max(newSar, highs[i - 1], i >= 2 ? highs[i - 2] : highs[i - 1]);
      if (highs[i] > newSar) {
        isUptrend = true;
        newSar = ep;
        ep = highs[i];
        af = step;
      } else {
        if (lows[i] < ep) {
          ep = lows[i];
          af = Math.min(af + step, maxAF);
        }
      }
    }

    sar[i] = newSar;
    trend[i] = isUptrend;
  }

  return { sar, trend };
}

function calcATR(candles: CandlestickData[], period = 14): (number | null)[] {
  const n = candles.length;
  const result: (number | null)[] = new Array(n).fill(null);
  if (n < 2) return result;

  const trueRanges: number[] = [candles[0].high as number - (candles[0].low as number)];
  for (let i = 1; i < n; i++) {
    const high = candles[i].high as number;
    const low = candles[i].low as number;
    const prevClose = candles[i - 1].close as number;
    trueRanges.push(Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose)));
  }

  if (n >= period) {
    let atr = trueRanges.slice(0, period).reduce((a, b) => a + b, 0) / period;
    result[period - 1] = atr;
    for (let i = period; i < n; i++) {
      atr = (atr * (period - 1) + trueRanges[i]) / period;
      result[i] = atr;
    }
  }
  return result;
}

function calcCCI(candles: CandlestickData[], period = 20): (number | null)[] {
  const n = candles.length;
  const result: (number | null)[] = new Array(n).fill(null);
  const typicalPrices = candles.map((c) => ((c.high as number) + (c.low as number) + (c.close as number)) / 3);

  for (let i = period - 1; i < n; i++) {
    const slice = typicalPrices.slice(i - period + 1, i + 1);
    const mean = slice.reduce((a, b) => a + b, 0) / period;
    const meanDev = slice.reduce((a, b) => a + Math.abs(b - mean), 0) / period;
    result[i] = meanDev === 0 ? 0 : (typicalPrices[i] - mean) / (0.015 * meanDev);
  }
  return result;
}

function calcVWAP(candles: CandlestickData[]): (number | null)[] {
  const result: (number | null)[] = [];
  let cumulativeTPV = 0;
  let cumulativeVol = 0;

  for (const c of candles) {
    const tp = ((c.high as number) + (c.low as number) + (c.close as number)) / 3;
    const vol = (c as any).volume ?? 1;
    cumulativeTPV += tp * vol;
    cumulativeVol += vol;
    result.push(cumulativeVol > 0 ? cumulativeTPV / cumulativeVol : null);
  }
  return result;
}

function calcPivotPoints(candles: CandlestickData[]): { pp: number; r1: number; r2: number; r3: number; s1: number; s2: number; s3: number } | null {
  if (candles.length < 2) return null;
  const prev = candles[candles.length - 2];
  const high = prev.high as number;
  const low = prev.low as number;
  const close = prev.close as number;

  const pp = (high + low + close) / 3;
  const r1 = 2 * pp - low;
  const r2 = pp + (high - low);
  const r3 = high + 2 * (pp - low);
  const s1 = 2 * pp - high;
  const s2 = pp - (high - low);
  const s3 = low - 2 * (high - pp);

  return { pp, r1, r2, r3, s1, s2, s3 };
}

// ─── Drawing canvas helper ────────────────────────────────────────────────────

function drawAllOnCanvas(
  canvas: HTMLCanvasElement,
  drawings: Drawing[],
  pendingTrendP1: Point | null,
  pendingMousePos: Point | null,
  activeTool: DrawingTool,
  drawColor: string,
  getPriceAt?: (y: number) => number | null
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const drawLine = (p1: Point, p2: Point, color: string, dashed = false, extended = false) => {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    if (dashed) ctx.setLineDash([5, 4]);
    else ctx.setLineDash([]);
    ctx.beginPath();
    if (extended && p1.x !== p2.x) {
      const slope = (p2.y - p1.y) / (p2.x - p1.x);
      const yAtLeft = p1.y - slope * p1.x;
      const yAtRight = p1.y + slope * (canvas.width - p1.x);
      ctx.moveTo(0, yAtLeft);
      ctx.lineTo(canvas.width, yAtRight);
    } else {
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
    }
    ctx.stroke();
    ctx.restore();
  };

  const drawFibonacci = (p1: Point, p2: Point, alpha = 1) => {
    ctx.save();
    ctx.globalAlpha = alpha;
    // Swing line between the two anchor points, same convention as trendline.
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();

    const left = Math.min(p1.x, p2.x);
    const right = Math.max(p1.x, p2.x);
    for (const { ratio, color } of FIB_LEVELS) {
      const y = p1.y + (p2.y - p1.y) * ratio;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.2;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(left, y);
      ctx.lineTo(right, y);
      ctx.stroke();

      const price = getPriceAt?.(y);
      const label = price != null ? `${(ratio * 100).toFixed(1)}%  ${fmtLegendVal(price)}` : `${(ratio * 100).toFixed(1)}%`;
      ctx.font = '10px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillStyle = color;
      ctx.textBaseline = 'bottom';
      ctx.fillText(label, left + 4, y - 2);
    }

    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath(); ctx.arc(p1.x, p1.y, 3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(p2.x, p2.y, 3, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  };

  for (const d of drawings) {
    if (d.type === 'trendline') {
      drawLine(d.p1, d.p2, d.color, false, true);
      ctx.save();
      ctx.fillStyle = d.color;
      ctx.beginPath(); ctx.arc(d.p1.x, d.p1.y, 4, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(d.p2.x, d.p2.y, 4, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    } else if (d.type === 'horizontal') {
      ctx.save();
      ctx.strokeStyle = d.color;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(0, d.y);
      ctx.lineTo(canvas.width, d.y);
      ctx.stroke();
      ctx.restore();
    } else if (d.type === 'freehand') {
      if (d.points.length < 2) continue;
      ctx.save();
      ctx.strokeStyle = d.color;
      ctx.lineWidth = 1.5;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(d.points[0].x, d.points[0].y);
      for (let i = 1; i < d.points.length; i++) {
        ctx.lineTo(d.points[i].x, d.points[i].y);
      }
      ctx.stroke();
      ctx.restore();
    } else if (d.type === 'fibonacci') {
      drawFibonacci(d.p1, d.p2);
    }
  }

  if (activeTool === 'trendline' && pendingTrendP1 && pendingMousePos) {
    drawLine(pendingTrendP1, pendingMousePos, drawColor, true, false);
    ctx.save();
    ctx.fillStyle = drawColor;
    ctx.beginPath(); ctx.arc(pendingTrendP1.x, pendingTrendP1.y, 4, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  } else if (activeTool === 'fibonacci' && pendingTrendP1 && pendingMousePos) {
    drawFibonacci(pendingTrendP1, pendingMousePos, 0.6);
  }
}

function pointNearDrawing(pt: Point, drawing: Drawing, threshold = 8): boolean {
  if (drawing.type === 'trendline') {
    return pointNearSegmentExtended(pt, drawing.p1, drawing.p2, threshold);
  } else if (drawing.type === 'horizontal') {
    return Math.abs(pt.y - drawing.y) <= threshold;
  } else if (drawing.type === 'freehand') {
    for (let i = 1; i < drawing.points.length; i++) {
      if (pointNearSegment(pt, drawing.points[i - 1], drawing.points[i], threshold)) return true;
    }
    return false;
  } else if (drawing.type === 'fibonacci') {
    const left = Math.min(drawing.p1.x, drawing.p2.x);
    const right = Math.max(drawing.p1.x, drawing.p2.x);
    if (pt.x < left - threshold || pt.x > right + threshold) return false;
    for (const { ratio } of FIB_LEVELS) {
      const y = drawing.p1.y + (drawing.p2.y - drawing.p1.y) * ratio;
      if (Math.abs(pt.y - y) <= threshold) return true;
    }
    return false;
  }
  return false;
}

function pointNearSegment(pt: Point, a: Point, b: Point, threshold: number): boolean {
  const dx = b.x - a.x, dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(pt.x - a.x, pt.y - a.y) <= threshold;
  let t = ((pt.x - a.x) * dx + (pt.y - a.y) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const nearX = a.x + t * dx, nearY = a.y + t * dy;
  return Math.hypot(pt.x - nearX, pt.y - nearY) <= threshold;
}

function pointNearSegmentExtended(pt: Point, a: Point, b: Point, threshold: number): boolean {
  const dx = b.x - a.x, dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(pt.x - a.x, pt.y - a.y) <= threshold;
  let t = ((pt.x - a.x) * dx + (pt.y - a.y) * dy) / lenSq;
  const nearX = a.x + t * dx, nearY = a.y + t * dy;
  return Math.hypot(pt.x - nearX, pt.y - nearY) <= threshold;
}

// ─── Component ────────────────────────────────────────────────────────────────

const LightweightChart = forwardRef<LightweightChartHandle, LightweightChartProps>(
  ({ symbol, category, exchange, openTrades = [], onChartReady, onPriceUpdate }, ref) => {
    // Keep a stable dependency-array shape during Fast Refresh while still
    // reloading when either the market category or exchange changes.
    const marketDataKey = `${category ?? ''}|${exchange ?? ''}`;
    const containerRef = useRef<HTMLDivElement>(null);
    const rsiContainerRef = useRef<HTMLDivElement>(null);
    const macdContainerRef = useRef<HTMLDivElement>(null);
    const stochContainerRef = useRef<HTMLDivElement>(null);
    const atrContainerRef = useRef<HTMLDivElement>(null);
    const cciContainerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const canvasWrapRef = useRef<HTMLDivElement>(null);

    const chartRef = useRef<IChartApi | null>(null);
    const rsiChartRef = useRef<IChartApi | null>(null);
    const macdChartRef = useRef<IChartApi | null>(null);
    const stochChartRef = useRef<IChartApi | null>(null);

    const seriesRef = useRef<ISeriesApi<SeriesType> | null>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const bookTickerWsRef = useRef<WebSocket | null>(null);
    const lastBarRef = useRef<CandlestickData | null>(null);
    const entryLinesRef = useRef<Map<string, IPriceLine>>(new Map());

    const maSeriesRef = useRef<ISeriesApi<'Line'>[]>([]);
    const emaSeriesRef = useRef<ISeriesApi<'Line'>[]>([]);
    const bbSeriesRef = useRef<ISeriesApi<'Line'>[]>([]);
    const volSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
    const rsiSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
    const rsiOBRef = useRef<IPriceLine | null>(null);
    const rsiOSRef = useRef<IPriceLine | null>(null);
    const macdLineRef = useRef<ISeriesApi<'Line'> | null>(null);
    const macdSignalRef = useRef<ISeriesApi<'Line'> | null>(null);
    const macdHistRef = useRef<ISeriesApi<'Histogram'> | null>(null);
    const stochKRef = useRef<ISeriesApi<'Line'> | null>(null);
    const stochDRef = useRef<ISeriesApi<'Line'> | null>(null);

    const atrChartRef = useRef<IChartApi | null>(null);
    const atrSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
    const cciChartRef = useRef<IChartApi | null>(null);
    const cciSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
    const ichimokuSeriesRef = useRef<ISeriesApi<'Line'>[]>([]);
    const sarSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
    const vwapSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
    const pivotLinesRef = useRef<IPriceLine[]>([]);

    const candleDataRef = useRef<CandlestickData[]>([]);
    const loadingOlderHistoryRef = useRef(false);
    const hasOlderHistoryRef = useRef(true);
    const loadOlderHistoryRef = useRef<() => void>(() => {});

    const fetchAbortRef = useRef<AbortController | null>(null);

    const binancePollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const marketQuotePollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const lastWsMsgTimeRef = useRef<number>(0);

    const firstCloseRef = useRef<number | null>(null);
    const onPriceUpdateRef = useRef<((price: number, change: number, changePct: number) => void) | undefined>(undefined);
    const onChartReadyRef = useRef<(() => void) | undefined>(undefined);

    useEffect(() => { onPriceUpdateRef.current = onPriceUpdate; }, [onPriceUpdate]);
    useEffect(() => { onChartReadyRef.current = onChartReady; }, [onChartReady]);

    const [timeframe, setTimeframe] = useState('1m');
    const [isLoading, setIsLoading] = useState(true);
    const [dataUnavailable, setDataUnavailable] = useState(false);
    const [activeIndicators, setActiveIndicators] = useState<Set<IndicatorKey>>(new Set());
    const [chartHeight, setChartHeight] = useState<number>(CHART_HEIGHT);
    const [chartType, setChartType] = useState<ChartType>('candles');
    const chartTypeRef = useRef<ChartType>('candles');
    useEffect(() => { chartTypeRef.current = chartType; }, [chartType]);

    // ── "Return to live" — shown once the user has scrolled/zoomed away
    // from the right (real-time) edge of the chart. ──────────────────────────
    const [isAwayFromLive, setIsAwayFromLive] = useState(false);

    // ── OHLC legend (hovered bar, or the latest live bar when not hovering) ──
    const [ohlcBar, setOhlcBar] = useState<CandlestickData | null>(null);
    const isHoveringChartRef = useRef(false);
    // Records a new live bar and, unless the user is currently hovering the
    // chart (inspecting a past candle), refreshes the OHLC legend with it.
    const updateLastBar = useCallback((bar: CandlestickData) => {
      updateLastBar(bar);
      if (!isHoveringChartRef.current) setOhlcBar(bar);
    }, []);

    // ── Indicator legends ─────────────────────────────────────────────────
    // Overlay/oscillator values live here (a compact top-left legend per
    // pane) instead of as price-axis labels — with many indicators active
    // at once those labels used to stack on top of each other on the right
    // edge of the chart.
    const [mainLegend, setMainLegend] = useState<LegendItem[]>([]);
    const [rsiLegend, setRsiLegend] = useState<LegendItem[]>([]);
    const [macdLegend, setMacdLegend] = useState<LegendItem[]>([]);
    const [stochLegend, setStochLegend] = useState<LegendItem[]>([]);
    const [atrLegend, setAtrLegend] = useState<LegendItem[]>([]);
    const [cciLegend, setCciLegend] = useState<LegendItem[]>([]);

    const [activeTool, setActiveTool] = useState<DrawingTool>(null);
    const [drawColor, setDrawColor] = useState('#f59e0b');
    const [drawings, setDrawings] = useState<Drawing[]>([]);
    const [pendingTrendP1, setPendingTrendP1] = useState<Point | null>(null);
    const [pendingMousePos, setPendingMousePos] = useState<Point | null>(null);

    const activeToolRef = useRef<DrawingTool>(null);
    const drawColorRef = useRef('#f59e0b');
    const drawingsRef = useRef<Drawing[]>([]);
    const pendingTrendP1Ref = useRef<Point | null>(null);
    const isFreehandDrawingRef = useRef(false);
    const freehandPointsRef = useRef<Point[]>([]);
    const pendingMousePosRef = useRef<Point | null>(null);

    useEffect(() => { activeToolRef.current = activeTool; }, [activeTool]);
    useEffect(() => { drawColorRef.current = drawColor; }, [drawColor]);
    useEffect(() => { drawingsRef.current = drawings; }, [drawings]);
    useEffect(() => { pendingTrendP1Ref.current = pendingTrendP1; }, [pendingTrendP1]);
    useEffect(() => { pendingMousePosRef.current = pendingMousePos; }, [pendingMousePos]);

    const loadOlderHistory = useCallback(async () => {
      if (loadingOlderHistoryRef.current || !hasOlderHistoryRef.current || !seriesRef.current || !chartRef.current) return;

      const current = candleDataRef.current;
      const oldest = current[0];
      if (!oldest) return;

      loadingOlderHistoryRef.current = true;
      try {
        const tfConfig = TIMEFRAMES.find((t) => t.label === timeframe) ?? TIMEFRAMES[0];
        const crypto = isCrypto(category, symbol) || usesBinanceProxy(symbol);
        const sourceTimestamp = Number(oldest.time) + new Date().getTimezoneOffset() * 60;
        let older: CandlestickData[];

        if (crypto) {
          const raw = await fetchBinanceKlines(
            toBinanceSymbol(symbol),
            tfConfig.binanceInterval,
            HISTORY_PAGE_SIZE,
            sourceTimestamp * 1000 - 1,
          );
          older = raw.map((k: any) => ({
            time: toLocalDisplayTime(Math.floor(k[0] / 1000)),
            open: parseFloat(k[1]),
            high: parseFloat(k[2]),
            low: parseFloat(k[3]),
            close: parseFloat(k[4]),
          }));
        } else {
          const endDate = new Date((sourceTimestamp - 1) * 1000).toISOString().slice(0, 19);
          older = await fetchTwelveDataKlines(
            toTwelveDataSymbol(symbol, category),
            tfConfig.tdInterval,
            HISTORY_PAGE_SIZE,
            endDate,
            exchange,
            category,
          );
        }

        const existingTimes = new Set(current.map((c) => Number(c.time)));
        const additions = older.filter((c) => !existingTimes.has(Number(c.time)) && Number(c.time) < Number(oldest.time));
        if (additions.length === 0) {
          hasOlderHistoryRef.current = false;
          return;
        }

        const visibleRange = chartRef.current.timeScale().getVisibleLogicalRange();
        const merged = [...additions, ...current].sort((a, b) => Number(a.time) - Number(b.time));
        seriesRef.current.setData(barsToSeriesData(merged, chartTypeRef.current) as any);
        candleDataRef.current = merged;

        if (visibleRange) {
          chartRef.current.timeScale().setVisibleLogicalRange({
            from: visibleRange.from + additions.length,
            to: visibleRange.to + additions.length,
          });
        }

        if (additions.length < HISTORY_PAGE_SIZE) hasOlderHistoryRef.current = false;
      } catch {
        // Keep the current chart intact. A later left-edge visit can retry the page request.
      } finally {
        loadingOlderHistoryRef.current = false;
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [marketDataKey, symbol, timeframe]);

    useEffect(() => { loadOlderHistoryRef.current = () => { void loadOlderHistory(); }; }, [loadOlderHistory]);

    useEffect(() => {
      const updateHeight = () => {
        if (window.innerWidth < 640) {
          setChartHeight(MOBILE_CHART_HEIGHT);
        } else if (window.innerWidth < 1024) {
          setChartHeight(TABLET_CHART_HEIGHT);
        } else {
          setChartHeight(CHART_HEIGHT);
        }
      };
      updateHeight();
      window.addEventListener('resize', updateHeight);
      return () => window.removeEventListener('resize', updateHeight);
    }, []);

    // ─── Redraw canvas ────────────────────────────────────────────────────────

    const redrawCanvas = useCallback(() => {
      if (!canvasRef.current) return;
      drawAllOnCanvas(
        canvasRef.current,
        drawingsRef.current,
        pendingTrendP1Ref.current,
        pendingMousePosRef.current,
        activeToolRef.current,
        drawColorRef.current,
        (y) => seriesRef.current?.coordinateToPrice(y) ?? null
      );
    }, []);

    useEffect(() => { redrawCanvas(); }, [drawings, pendingTrendP1, pendingMousePos, activeTool, drawColor, redrawCanvas]);

    // ── Expose API ────────────────────────────────────────────────────────────

    useImperativeHandle(ref, () => ({
      getCurrentPrice: () => lastBarRef.current?.close ?? null,
      addEntryLine: (tradeId: string, price: number, orderType: 'buy' | 'sell') => {
        if (!seriesRef.current) return;
        const existing = entryLinesRef.current.get(tradeId);
        if (existing) { try { seriesRef.current.removePriceLine(existing); } catch {} }
        const priceLine = seriesRef.current.createPriceLine({
          price,
          color: orderType === 'buy' ? '#22c55e' : '#ef4444',
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: orderType.toUpperCase(),
        });
        entryLinesRef.current.set(tradeId, priceLine);
      },
      removeEntryLine: (tradeId: string) => {
        if (!seriesRef.current) return;
        const priceLine = entryLinesRef.current.get(tradeId);
        if (priceLine) {
          try { seriesRef.current!.removePriceLine(priceLine); } catch {}
          entryLinesRef.current.delete(tradeId);
        }
      },
    }));

    // ─── Sync entry lines ──────────────────────────────────────────────────────

    const syncEntryLines = useCallback(() => {
      if (!seriesRef.current) return;
      const trackedIds = new Set(entryLinesRef.current.keys());
      const openIds = new Set(openTrades.filter((t) => t.status === 'open').map((t) => t.id));
      trackedIds.forEach((tradeId) => {
        if (!openIds.has(tradeId)) {
          const priceLine = entryLinesRef.current.get(tradeId);
          if (priceLine) { try { seriesRef.current!.removePriceLine(priceLine); } catch {} }
          entryLinesRef.current.delete(tradeId);
        }
      });
      openTrades.forEach((t) => {
        if (t.status === 'open' && !entryLinesRef.current.has(t.id)) {
          try {
            const priceLine = seriesRef.current!.createPriceLine({
              price: t.entry_price,
              color: t.order_type === 'buy' ? '#22c55e' : '#ef4444',
              lineWidth: 1,
              lineStyle: LineStyle.Dashed,
              axisLabelVisible: true,
              title: t.order_type.toUpperCase(),
            });
            entryLinesRef.current.set(t.id, priceLine);
          } catch {}
        }
      });
    }, [openTrades]);

    useEffect(() => { syncEntryLines(); }, [syncEntryLines]);

    // ── Chart type switching (candles / bars / line / area / baseline) ──────────
    // Series type can't be changed in place — the old series is removed and a
    // new one of the requested type is created, re-fed from candleDataRef
    // (converted to whatever shape that type needs). Price lines (trade entry
    // markers) live on the series instance too, so they're lost with it and
    // must be recreated on the new one.
    const handleChartTypeChange = useCallback((newType: ChartType) => {
      if (newType === chartTypeRef.current) return;
      if (!chartRef.current) { setChartType(newType); return; }

      if (seriesRef.current) {
        try { chartRef.current.removeSeries(seriesRef.current); } catch {}
      }

      const newSeries = createMainSeriesForType(chartRef.current, newType);

      // Use the freshest data available: candleDataRef plus the in-progress
      // last bar (which may be more current than the last full history sync).
      let bars = candleDataRef.current;
      const last = lastBarRef.current;
      if (last) {
        if (bars.length > 0 && Number(bars[bars.length - 1].time) === Number(last.time)) {
          bars = [...bars.slice(0, -1), last];
        } else if (bars.length === 0 || Number(last.time) > Number(bars[bars.length - 1].time)) {
          bars = [...bars, last];
        }
      }
      if (bars.length > 0) {
        try { newSeries.setData(barsToSeriesData(bars, newType) as any); } catch {}
      }

      seriesRef.current = newSeries;
      chartTypeRef.current = newType;
      setChartType(newType);

      // Trade entry-price lines belonged to the removed series — recreate
      // them on the new one.
      entryLinesRef.current.clear();
      syncEntryLines();

      requestAnimationFrame(redrawCanvas);
    }, [syncEntryLines, redrawCanvas]);

    // ── Stop WS/poll helpers ──────────────────────────────────────────────────

    const stopRealtimeFeeds = useCallback(() => {
      if (wsRef.current) {
        wsRef.current.onclose = null; wsRef.current.onerror = null; wsRef.current.onmessage = null;
        try { wsRef.current.close(); } catch {}
        wsRef.current = null;
      }
      if (bookTickerWsRef.current) {
        bookTickerWsRef.current.onclose = null; bookTickerWsRef.current.onerror = null; bookTickerWsRef.current.onmessage = null;
        try { bookTickerWsRef.current.close(); } catch {}
        bookTickerWsRef.current = null;
      }
      if (binancePollIntervalRef.current) { clearInterval(binancePollIntervalRef.current); binancePollIntervalRef.current = null; }
      if (marketQuotePollIntervalRef.current) { clearInterval(marketQuotePollIntervalRef.current); marketQuotePollIntervalRef.current = null; }
      lastWsMsgTimeRef.current = 0;
    }, []);

    // ── Sub-panel chart options ───────────────────────────────────────────────

    const subPanelOptions = (height: number) => ({
      width: containerRef.current?.clientWidth || 800,
      height,
      layout: { background: { color: '#000000' }, textColor: '#94a3b8', fontFamily: TRADINGVIEW_FONT },
      grid: { vertLines: { color: 'rgba(255,255,255,0.04)' }, horzLines: { color: 'rgba(255,255,255,0.04)' } },
      crosshair: {
        vertLine: { color: 'rgba(255,255,255,0.2)', labelBackgroundColor: '#1e293b' },
        horzLine: { color: 'rgba(255,255,255,0.2)', labelBackgroundColor: '#1e293b' },
      },
      rightPriceScale: { borderColor: 'rgba(255,255,255,0.1)', textColor: '#94a3b8', scaleMargins: { top: 0.15, bottom: 0.15 } },
      timeScale: { borderColor: 'rgba(255,255,255,0.1)', timeVisible: true, secondsVisible: false, minBarSpacing: 1 },
      handleScroll: true,
      // Same price-axis lock as the main chart — prevents the last-value
      // label from being dragged to the pane edge and clipped there.
      handleScale: { axisPressedMouseMove: { time: true, price: false }, mouseWheel: true, pinch: true },
    });

    // ── Remove indicator series from main chart ───────────────────────────────

    const removeMainIndicators = useCallback(() => {
      if (!chartRef.current) return;
      maSeriesRef.current.forEach(s => { try { chartRef.current!.removeSeries(s); } catch {} });
      maSeriesRef.current = [];
      emaSeriesRef.current.forEach(s => { try { chartRef.current!.removeSeries(s); } catch {} });
      emaSeriesRef.current = [];
      bbSeriesRef.current.forEach(s => { try { chartRef.current!.removeSeries(s); } catch {} });
      bbSeriesRef.current = [];
      if (volSeriesRef.current) { try { chartRef.current!.removeSeries(volSeriesRef.current); } catch {} volSeriesRef.current = null; }
      ichimokuSeriesRef.current.forEach(s => { try { chartRef.current!.removeSeries(s); } catch {} });
      ichimokuSeriesRef.current = [];
      if (sarSeriesRef.current) { try { chartRef.current!.removeSeries(sarSeriesRef.current); } catch {} sarSeriesRef.current = null; }
      if (vwapSeriesRef.current) { try { chartRef.current!.removeSeries(vwapSeriesRef.current); } catch {} vwapSeriesRef.current = null; }
      if (seriesRef.current) {
        pivotLinesRef.current.forEach(pl => { try { seriesRef.current!.removePriceLine(pl); } catch {} });
      }
      pivotLinesRef.current = [];
      setMainLegend([]);
    }, []);

    // ── Remove sub-panel charts ───────────────────────────────────────────────

    const removeSubPanels = useCallback(() => {
      if (rsiChartRef.current) { try { rsiChartRef.current.remove(); } catch {} rsiChartRef.current = null; rsiSeriesRef.current = null; rsiOBRef.current = null; rsiOSRef.current = null; }
      if (macdChartRef.current) { try { macdChartRef.current.remove(); } catch {} macdChartRef.current = null; macdLineRef.current = null; macdSignalRef.current = null; macdHistRef.current = null; }
      if (stochChartRef.current) { try { stochChartRef.current.remove(); } catch {} stochChartRef.current = null; stochKRef.current = null; stochDRef.current = null; }
      if (atrChartRef.current) { try { atrChartRef.current.remove(); } catch {} atrChartRef.current = null; atrSeriesRef.current = null; }
      if (cciChartRef.current) { try { cciChartRef.current.remove(); } catch {} cciChartRef.current = null; cciSeriesRef.current = null; }
      setRsiLegend([]); setMacdLegend([]); setStochLegend([]); setAtrLegend([]); setCciLegend([]);
    }, []);

    // ── Apply indicators to candle data ──────────────────────────────────────

    const applyIndicators = useCallback((candles: CandlestickData[], indicators: Set<IndicatorKey>) => {
      if (!chartRef.current || candles.length === 0) return;
      const closes = candles.map(c => c.close as number);
      const times = candles.map(c => c.time);

      // Collected as each block below runs, then written to state once at
      // the end — this becomes the single source of truth for the top-left
      // legend, so a just-disabled indicator (already absent from
      // `indicators` here) simply never gets pushed instead of needing a
      // separate reset.
      const mainLegendItems: LegendItem[] = [];

      if (indicators.has('MA')) {
        const maPeriods = [14, 25, 50];
        const maColors = ['#f59e0b', '#a78bfa', '#38bdf8'];
        maPeriods.forEach((period, idx) => {
          const values = calcSMA(closes, period);
          const data = values.map((v, i) => v !== null ? { time: times[i], value: v } : null).filter(Boolean) as { time: Time; value: number }[];
          if (data.length === 0) return;
          const s = chartRef.current!.addSeries(LineSeries, {
            color: maColors[idx], lineWidth: 1, priceLineVisible: false, lastValueVisible: false, title: `MA${period}`,
          });
          s.setData(data);
          maSeriesRef.current.push(s);
          mainLegendItems.push({ label: `MA${period}`, color: maColors[idx], value: fmtLegendVal(data[data.length - 1].value) });
        });
      }

      if (indicators.has('EMA')) {
        const emaPeriods = [9, 21];
        const emaColors = ['#fb923c', '#34d399'];
        emaPeriods.forEach((period, idx) => {
          const values = calcEMA(closes, period);
          const data = values.map((v, i) => v !== null ? { time: times[i], value: v } : null).filter(Boolean) as { time: Time; value: number }[];
          if (data.length === 0) return;
          const s = chartRef.current!.addSeries(LineSeries, {
            color: emaColors[idx], lineWidth: 1, priceLineVisible: false, lastValueVisible: false, title: `EMA${period}`,
          });
          s.setData(data);
          emaSeriesRef.current.push(s);
          mainLegendItems.push({ label: `EMA${period}`, color: emaColors[idx], value: fmtLegendVal(data[data.length - 1].value) });
        });
      }

      if (indicators.has('BB')) {
        const { upper, middle, lower } = calcBB(closes, 20);
        const bbDefs = [
          { values: upper, color: 'rgba(99,102,241,0.8)', title: 'BB Upper' },
          { values: middle, color: 'rgba(99,102,241,0.5)', title: 'BB Mid' },
          { values: lower, color: 'rgba(99,102,241,0.8)', title: 'BB Lower' },
        ];
        bbDefs.forEach(({ values, color, title }) => {
          const data = values.map((v, i) => v !== null ? { time: times[i], value: v } : null).filter(Boolean) as { time: Time; value: number }[];
          if (data.length === 0) return;
          const s = chartRef.current!.addSeries(LineSeries, {
            color, lineWidth: 1, lineStyle: LineStyle.Dashed, priceLineVisible: false, lastValueVisible: false, title,
          });
          s.setData(data);
          bbSeriesRef.current.push(s);
          mainLegendItems.push({ label: title, color, value: fmtLegendVal(data[data.length - 1].value) });
        });
      }

      if (indicators.has('Vol')) {
        const volData = candles.map(c => ({
          time: c.time,
          value: (c as any).volume ?? 0,
          color: (c.close as number) >= (c.open as number) ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)',
        }));
        if (volData.some(v => v.value > 0)) {
          const s = chartRef.current!.addSeries(HistogramSeries, {
            priceFormat: { type: 'volume' }, priceScaleId: 'vol',
          });
          chartRef.current!.priceScale('vol').applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });
          s.setData(volData);
          volSeriesRef.current = s;
        }
      }

      if (indicators.has('RSI') && rsiContainerRef.current) {
        if (!rsiChartRef.current) {
          rsiChartRef.current = createChart(rsiContainerRef.current, subPanelOptions(100));
        } else if (rsiSeriesRef.current) {
          // Panel already exists from a previous applyIndicators() call (e.g.
          // toggling a different indicator while RSI stays on) — remove the
          // old line before adding a fresh one so they don't stack.
          try { rsiChartRef.current.removeSeries(rsiSeriesRef.current); } catch {}
          rsiSeriesRef.current = null; rsiOBRef.current = null; rsiOSRef.current = null;
        }
        const rsiValues = calcRSI(closes, 14);
        const rsiData = rsiValues.map((v, i) => v !== null ? { time: times[i], value: v } : null).filter(Boolean) as { time: Time; value: number }[];
        if (rsiData.length > 0) {
          const s = rsiChartRef.current.addSeries(LineSeries, { color: '#c084fc', lineWidth: 1, priceLineVisible: false, lastValueVisible: false, title: 'RSI(14)' });
          s.setData(rsiData);
          rsiSeriesRef.current = s;
          rsiOBRef.current = s.createPriceLine({ price: 70, color: 'rgba(239,68,68,0.6)', lineWidth: 1, lineStyle: LineStyle.Dashed, axisLabelVisible: true, title: 'OB' });
          rsiOSRef.current = s.createPriceLine({ price: 30, color: 'rgba(34,197,94,0.6)', lineWidth: 1, lineStyle: LineStyle.Dashed, axisLabelVisible: true, title: 'OS' });
          rsiChartRef.current.timeScale().fitContent();
          setRsiLegend([{ label: 'RSI(14)', color: '#c084fc', value: fmtLegendVal(rsiData[rsiData.length - 1].value) }]);
        }
      } else {
        setRsiLegend([]);
      }

      if (indicators.has('MACD') && macdContainerRef.current) {
        if (!macdChartRef.current) {
          macdChartRef.current = createChart(macdContainerRef.current, subPanelOptions(100));
        } else {
          // Same re-apply guard as RSI above — clear the previous three
          // series before adding new ones.
          if (macdHistRef.current) { try { macdChartRef.current.removeSeries(macdHistRef.current); } catch {} macdHistRef.current = null; }
          if (macdLineRef.current) { try { macdChartRef.current.removeSeries(macdLineRef.current); } catch {} macdLineRef.current = null; }
          if (macdSignalRef.current) { try { macdChartRef.current.removeSeries(macdSignalRef.current); } catch {} macdSignalRef.current = null; }
        }
        const { macd, signal, histogram } = calcMACD(closes);
        const macdData = macd.map((v, i) => v !== null ? { time: times[i], value: v } : null).filter(Boolean) as { time: Time; value: number }[];
        const signalData = signal.map((v, i) => v !== null ? { time: times[i], value: v } : null).filter(Boolean) as { time: Time; value: number }[];
        const histData = histogram.map((v, i) => v !== null ? { time: times[i], value: v, color: (v as number) >= 0 ? 'rgba(34,197,94,0.6)' : 'rgba(239,68,68,0.6)' } : null).filter(Boolean) as { time: Time; value: number; color: string }[];
        if (macdData.length > 0) {
          const histS = macdChartRef.current.addSeries(HistogramSeries, { priceLineVisible: false, lastValueVisible: false, title: 'MACD Hist' });
          histS.setData(histData);
          macdHistRef.current = histS;
          const macdS = macdChartRef.current.addSeries(LineSeries, { color: '#38bdf8', lineWidth: 1, priceLineVisible: false, lastValueVisible: false, title: 'MACD' });
          macdS.setData(macdData);
          macdLineRef.current = macdS;
          const signalS = macdChartRef.current.addSeries(LineSeries, { color: '#fb923c', lineWidth: 1, priceLineVisible: false, lastValueVisible: false, title: 'Signal' });
          signalS.setData(signalData);
          macdSignalRef.current = signalS;
          macdChartRef.current.timeScale().fitContent();
          setMacdLegend([
            { label: 'MACD', color: '#38bdf8', value: fmtLegendVal(macdData[macdData.length - 1].value) },
            { label: 'Signal', color: '#fb923c', value: fmtLegendVal(signalData[signalData.length - 1]?.value ?? 0) },
          ]);
        }
      } else {
        setMacdLegend([]);
      }

      if (indicators.has('Stoch') && stochContainerRef.current) {
        if (!stochChartRef.current) {
          stochChartRef.current = createChart(stochContainerRef.current, subPanelOptions(100));
        } else {
          if (stochKRef.current) { try { stochChartRef.current.removeSeries(stochKRef.current); } catch {} stochKRef.current = null; }
          if (stochDRef.current) { try { stochChartRef.current.removeSeries(stochDRef.current); } catch {} stochDRef.current = null; }
        }
        const { k, d } = calcStoch(candles, 14, 3, 3);
        const kData = k.map((v, i) => v !== null ? { time: times[i], value: v } : null).filter(Boolean) as { time: Time; value: number }[];
        const dData = d.map((v, i) => v !== null ? { time: times[i], value: v } : null).filter(Boolean) as { time: Time; value: number }[];
        if (kData.length > 0) {
          const kS = stochChartRef.current.addSeries(LineSeries, { color: '#38bdf8', lineWidth: 1, priceLineVisible: false, lastValueVisible: false, title: '%K' });
          kS.setData(kData);
          stochKRef.current = kS;
          const dS = stochChartRef.current.addSeries(LineSeries, { color: '#fb923c', lineWidth: 1, priceLineVisible: false, lastValueVisible: false, title: '%D' });
          dS.setData(dData);
          stochDRef.current = dS;
          stochChartRef.current.timeScale().fitContent();
          setStochLegend([
            { label: '%K', color: '#38bdf8', value: fmtLegendVal(kData[kData.length - 1].value) },
            { label: '%D', color: '#fb923c', value: fmtLegendVal(dData[dData.length - 1]?.value ?? 0) },
          ]);
        }
      } else {
        setStochLegend([]);
      }

      if (indicators.has('Ichimoku') && chartRef.current) {
        const { tenkan, kijun, senkouA, senkouB, chikou } = calcIchimoku(candles);
        const ichimokuDefs = [
          { values: tenkan, color: '#ef4444', title: 'Tenkan' },
          { values: kijun, color: '#3b82f6', title: 'Kijun' },
          { values: senkouA, color: 'rgba(34,197,94,0.7)', title: 'Senkou A' },
          { values: senkouB, color: 'rgba(239,68,68,0.7)', title: 'Senkou B' },
          { values: chikou, color: '#a78bfa', title: 'Chikou' },
        ];
        ichimokuDefs.forEach(({ values, color, title }) => {
          const data = values.map((v, i) => v !== null ? { time: times[i], value: v } : null).filter(Boolean) as { time: Time; value: number }[];
          if (data.length === 0) return;
          const s = chartRef.current!.addSeries(LineSeries, {
            color, lineWidth: 1, priceLineVisible: false, lastValueVisible: false, title,
          });
          s.setData(data);
          ichimokuSeriesRef.current.push(s);
          mainLegendItems.push({ label: title, color, value: fmtLegendVal(data[data.length - 1].value) });
        });
      }

      if (indicators.has('SAR') && chartRef.current) {
        const { sar, trend } = calcParabolicSAR(candles);
        const bullData: { time: Time; value: number }[] = [];
        const bearData: { time: Time; value: number }[] = [];
        sar.forEach((v, i) => {
          if (trend[i]) bullData.push({ time: times[i], value: v });
          else bearData.push({ time: times[i], value: v });
        });
        if (bullData.length > 0) {
          const bullS = chartRef.current.addSeries(LineSeries, {
            color: '#22c55e', lineWidth: 1, lineStyle: LineStyle.Dotted,
            priceLineVisible: false, lastValueVisible: false, title: 'SAR↑',
          });
          bullS.setData(bullData);
          ichimokuSeriesRef.current.push(bullS);
        }
        if (bearData.length > 0) {
          const bearS = chartRef.current.addSeries(LineSeries, {
            color: '#ef4444', lineWidth: 1, lineStyle: LineStyle.Dotted,
            priceLineVisible: false, lastValueVisible: false, title: 'SAR↓',
          });
          bearS.setData(bearData);
          ichimokuSeriesRef.current.push(bearS);
        }
        if (sar.length > 0) {
          const lastIdx = sar.length - 1;
          mainLegendItems.push({
            label: 'SAR',
            color: trend[lastIdx] ? '#22c55e' : '#ef4444',
            value: fmtLegendVal(sar[lastIdx]),
          });
        }
      }

      if (indicators.has('ATR') && atrContainerRef.current) {
        if (!atrChartRef.current) {
          atrChartRef.current = createChart(atrContainerRef.current, subPanelOptions(90));
        } else if (atrSeriesRef.current) {
          try { atrChartRef.current.removeSeries(atrSeriesRef.current); } catch {}
          atrSeriesRef.current = null;
        }
        const atrValues = calcATR(candles, 14);
        const atrData = atrValues.map((v, i) => v !== null ? { time: times[i], value: v } : null).filter(Boolean) as { time: Time; value: number }[];
        if (atrData.length > 0) {
          const s = atrChartRef.current.addSeries(LineSeries, { color: '#f97316', lineWidth: 1, priceLineVisible: false, lastValueVisible: false, title: 'ATR(14)' });
          s.setData(atrData);
          atrSeriesRef.current = s;
          atrChartRef.current.timeScale().fitContent();
          setAtrLegend([{ label: 'ATR(14)', color: '#f97316', value: fmtLegendVal(atrData[atrData.length - 1].value) }]);
        }
      } else {
        setAtrLegend([]);
      }

      if (indicators.has('CCI') && cciContainerRef.current) {
        if (!cciChartRef.current) {
          cciChartRef.current = createChart(cciContainerRef.current, subPanelOptions(90));
        } else if (cciSeriesRef.current) {
          // Removing the series also drops the +100/-100 price lines
          // attached to it, so they get recreated fresh below too.
          try { cciChartRef.current.removeSeries(cciSeriesRef.current); } catch {}
          cciSeriesRef.current = null;
        }
        const cciValues = calcCCI(candles, 20);
        const cciData = cciValues.map((v, i) => v !== null ? { time: times[i], value: v } : null).filter(Boolean) as { time: Time; value: number }[];
        if (cciData.length > 0) {
          const s = cciChartRef.current.addSeries(LineSeries, { color: '#06b6d4', lineWidth: 1, priceLineVisible: false, lastValueVisible: false, title: 'CCI(20)' });
          s.setData(cciData);
          cciSeriesRef.current = s;
          s.createPriceLine({ price: 100, color: 'rgba(239,68,68,0.6)', lineWidth: 1, lineStyle: LineStyle.Dashed, axisLabelVisible: true, title: '+100' });
          s.createPriceLine({ price: -100, color: 'rgba(34,197,94,0.6)', lineWidth: 1, lineStyle: LineStyle.Dashed, axisLabelVisible: true, title: '-100' });
          cciChartRef.current.timeScale().fitContent();
          setCciLegend([{ label: 'CCI(20)', color: '#06b6d4', value: fmtLegendVal(cciData[cciData.length - 1].value) }]);
        }
      } else {
        setCciLegend([]);
      }

      if (indicators.has('VWAP') && chartRef.current) {
        const vwapValues = calcVWAP(candles);
        const vwapData = vwapValues.map((v, i) => v !== null ? { time: times[i], value: v } : null).filter(Boolean) as { time: Time; value: number }[];
        if (vwapData.length > 0) {
          const s = chartRef.current.addSeries(LineSeries, {
            color: '#e879f9', lineWidth: 2, priceLineVisible: false, lastValueVisible: false, title: 'VWAP',
          });
          s.setData(vwapData);
          vwapSeriesRef.current = s;
          mainLegendItems.push({ label: 'VWAP', color: '#e879f9', value: fmtLegendVal(vwapData[vwapData.length - 1].value) });
        }
      }

      if (indicators.has('Pivot') && seriesRef.current) {
        const pivots = calcPivotPoints(candles);
        if (pivots) {
          const pivotDefs = [
            { price: pivots.r3, color: 'rgba(239,68,68,0.9)', title: 'R3' },
            { price: pivots.r2, color: 'rgba(239,68,68,0.7)', title: 'R2' },
            { price: pivots.r1, color: 'rgba(239,68,68,0.5)', title: 'R1' },
            { price: pivots.pp, color: 'rgba(234,179,8,0.9)', title: 'PP' },
            { price: pivots.s1, color: 'rgba(34,197,94,0.5)', title: 'S1' },
            { price: pivots.s2, color: 'rgba(34,197,94,0.7)', title: 'S2' },
            { price: pivots.s3, color: 'rgba(34,197,94,0.9)', title: 'S3' },
          ];
          pivotDefs.forEach(({ price, color, title }) => {
            try {
              const pl = seriesRef.current!.createPriceLine({
                price, color, lineWidth: 1, lineStyle: LineStyle.Dashed, axisLabelVisible: true, title,
              });
              pivotLinesRef.current.push(pl);
            } catch {}
          });
        }
      }

      setMainLegend(mainLegendItems);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ─── Toggle indicator ──────────────────────────────────────────────────────

    const toggleIndicator = useCallback((key: IndicatorKey) => {
      setActiveIndicators(prev => {
        const next = new Set(prev);
        if (next.has(key)) { next.delete(key); } else { next.add(key); }
        return next;
      });
    }, []);

    // ── Re-apply indicators when activeIndicators changes ────────────────────

    useEffect(() => {
      if (candleDataRef.current.length === 0) return;
      removeMainIndicators();
      if (!activeIndicators.has('RSI') && rsiChartRef.current) {
        try { rsiChartRef.current.remove(); } catch {} rsiChartRef.current = null; rsiSeriesRef.current = null;
      }
      if (!activeIndicators.has('MACD') && macdChartRef.current) {
        try { macdChartRef.current.remove(); } catch {} macdChartRef.current = null; macdLineRef.current = null; macdSignalRef.current = null; macdHistRef.current = null;
      }
      if (!activeIndicators.has('Stoch') && stochChartRef.current) {
        try { stochChartRef.current.remove(); } catch {} stochChartRef.current = null; stochKRef.current = null; stochDRef.current = null;
      }
      if (!activeIndicators.has('ATR') && atrChartRef.current) {
        try { atrChartRef.current.remove(); } catch {} atrChartRef.current = null; atrSeriesRef.current = null;
      }
      if (!activeIndicators.has('CCI') && cciChartRef.current) {
        try { cciChartRef.current.remove(); } catch {} cciChartRef.current = null; cciSeriesRef.current = null;
      }
      applyIndicators(candleDataRef.current, activeIndicators);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeIndicators]);

    // ── Chart init — runs ONCE on mount ──────────────────────────────────────

    useEffect(() => {
      if (!containerRef.current) return;

      const initChart = () => {
        if (!containerRef.current) return;
        const w = containerRef.current.clientWidth || 800;
        const isMobile = window.innerWidth < 640;
        const isTablet = window.innerWidth < 1024;
        const chartH = isMobile ? MOBILE_CHART_HEIGHT : isTablet ? TABLET_CHART_HEIGHT : CHART_HEIGHT;

        const chart = createChart(containerRef.current, {
          width: w,
          height: chartH,
          layout: { background: { color: '#000000' }, textColor: '#94a3b8', fontFamily: TRADINGVIEW_FONT },
          grid: { vertLines: { color: 'rgba(255,255,255,0.04)' }, horzLines: { color: 'rgba(255,255,255,0.04)' } },
          crosshair: {
            vertLine: { color: 'rgba(255,255,255,0.2)', labelBackgroundColor: '#1e293b' },
            horzLine: { color: 'rgba(255,255,255,0.2)', labelBackgroundColor: '#1e293b' },
          },
          rightPriceScale: { borderColor: 'rgba(255,255,255,0.1)', textColor: '#94a3b8', scaleMargins: { top: 0.15, bottom: 0.15 } },
          timeScale: { borderColor: 'rgba(255,255,255,0.1)', timeVisible: true, secondsVisible: false, minBarSpacing: 1 },
          handleScroll: true,
          // Price axis stays locked to auto-scale — only the time axis can be
          // manually zoomed/dragged. Manually dragging the price axis used to
          // let the last-price label get pushed to the pane's pixel edge and
          // render clipped there.
          handleScale: { axisPressedMouseMove: { time: true, price: false }, mouseWheel: true, pinch: true },
        });

        chartRef.current = chart;

        const series = createMainSeriesForType(chart, chartTypeRef.current);
        seriesRef.current = series;

        chart.timeScale().subscribeVisibleLogicalRangeChange((range) => {
          requestAnimationFrame(() => {
            drawAllOnCanvas(
              canvasRef.current!,
              drawingsRef.current,
              pendingTrendP1Ref.current,
              pendingMousePosRef.current,
              activeToolRef.current,
              drawColorRef.current,
              (y) => seriesRef.current?.coordinateToPrice(y) ?? null
            );
          });

          if (range && range.from < HISTORY_LOAD_THRESHOLD) {
            loadOlderHistoryRef.current();
          }

          // "Return to live": true once the visible right edge has drifted
          // more than a couple bars away from the latest candle.
          if (range) {
            const totalBars = candleDataRef.current.length;
            setIsAwayFromLive(totalBars > 0 && range.to < totalBars - 1 - LIVE_EDGE_BUFFER_BARS);
          }
        });

        // OHLC legend: show the hovered candle's O/H/L/C while the crosshair
        // is over the chart, and fall back to the latest live candle once
        // the mouse leaves. Looked up from candleDataRef (always full OHLC)
        // rather than the series' own data, so it stays correct in Line/
        // Area/Baseline chart types too, which only carry a close value.
        chart.subscribeCrosshairMove((param) => {
          if (!param.time) {
            isHoveringChartRef.current = false;
            setOhlcBar(lastBarRef.current);
            return;
          }
          isHoveringChartRef.current = true;
          const bar = candleDataRef.current.find((b) => b.time === param.time);
          if (bar) setOhlcBar(bar);
        });

        const resizeObserver = new ResizeObserver((entries) => {
          for (const entry of entries) {
            const cw = entry.contentRect.width;
            if (cw > 0 && chartRef.current) {
              const isMob = window.innerWidth < 640;
              const isTab = window.innerWidth < 1024;
              const newH = isMob ? MOBILE_CHART_HEIGHT : isTab ? TABLET_CHART_HEIGHT : CHART_HEIGHT;
              try { chartRef.current.applyOptions({ width: cw, height: newH }); } catch {}
              [rsiChartRef, macdChartRef, stochChartRef, atrChartRef, cciChartRef].forEach(r => {
                if (r.current) { try { r.current.applyOptions({ width: cw }); } catch {} }
              });
              if (canvasRef.current) {
                canvasRef.current.width = cw;
                canvasRef.current.height = newH;
                requestAnimationFrame(() => {
                  drawAllOnCanvas(
                    canvasRef.current!,
                    drawingsRef.current,
                    pendingTrendP1Ref.current,
                    pendingMousePosRef.current,
                    activeToolRef.current,
                    drawColorRef.current,
                    (y) => seriesRef.current?.coordinateToPrice(y) ?? null
                  );
                });
              }
            }
          }
        });
        resizeObserver.observe(containerRef.current!);
        (containerRef.current as any).__resizeObserver = resizeObserver;
      };

      initChart();

      return () => {
        stopRealtimeFeeds();
        if (fetchAbortRef.current) { fetchAbortRef.current.abort(); }
        if (containerRef.current && (containerRef.current as any).__resizeObserver) {
          (containerRef.current as any).__resizeObserver.disconnect();
        }
        removeSubPanels();
        if (chartRef.current) {
          try { chartRef.current.remove(); } catch {}
          chartRef.current = null;
          seriesRef.current = null;
        }
      };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Canvas size sync with chart container ─────────────────────────────────

    useEffect(() => {
      if (!containerRef.current || !canvasRef.current) return;
      const syncCanvasSize = () => {
        if (!containerRef.current || !canvasRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          canvasRef.current.width = rect.width;
          canvasRef.current.height = rect.height;
          redrawCanvas();
        }
      };
      syncCanvasSize();
      const obs = new ResizeObserver(syncCanvasSize);
      obs.observe(containerRef.current);
      return () => obs.disconnect();
    }, [redrawCanvas]);

    // ── Canvas event handlers ─────────────────────────────────────────────────

    const getCanvasPoint = (e: React.MouseEvent<HTMLCanvasElement>): Point => {
      const rect = canvasRef.current!.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const handleCanvasMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
      const tool = activeToolRef.current;
      if (!tool) return;
      const pt = getCanvasPoint(e);

      if (tool === 'trendline' || tool === 'fibonacci') {
        if (!pendingTrendP1Ref.current) {
          setPendingTrendP1(pt);
        } else {
          const p1 = pendingTrendP1Ref.current;
          const newDrawing: TrendLineDrawing | FibonacciDrawing = tool === 'fibonacci'
            ? { id: `fib-${Date.now()}`, type: 'fibonacci', p1, p2: pt, color: drawColorRef.current }
            : { id: `tl-${Date.now()}`, type: 'trendline', p1, p2: pt, color: drawColorRef.current };
          setDrawings(prev => [...prev, newDrawing]);
          setPendingTrendP1(null);
          setPendingMousePos(null);
        }
      } else if (tool === 'horizontal') {
        const newDrawing: HorizontalDrawing = {
          id: `hl-${Date.now()}`,
          type: 'horizontal',
          y: pt.y,
          color: drawColorRef.current,
        };
        setDrawings(prev => [...prev, newDrawing]);
      } else if (tool === 'freehand') {
        isFreehandDrawingRef.current = true;
        freehandPointsRef.current = [pt];
      } else if (tool === 'delete') {
        const idx = drawingsRef.current.findIndex(d => pointNearDrawing(pt, d));
        if (idx !== -1) {
          setDrawings(prev => prev.filter((_, i) => i !== idx));
        }
      }
    }, []);

    const handleCanvasMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
      const tool = activeToolRef.current;
      if (!tool) return;
      const pt = getCanvasPoint(e);

      if ((tool === 'trendline' || tool === 'fibonacci') && pendingTrendP1Ref.current) {
        setPendingMousePos(pt);
      } else if (tool === 'freehand' && isFreehandDrawingRef.current) {
        freehandPointsRef.current.push(pt);
        if (canvasRef.current) {
          const ctx = canvasRef.current.getContext('2d');
          if (ctx && freehandPointsRef.current.length >= 2) {
            const pts = freehandPointsRef.current;
            ctx.save();
            ctx.strokeStyle = drawColorRef.current;
            ctx.lineWidth = 1.5;
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';
            ctx.setLineDash([]);
            ctx.beginPath();
            ctx.moveTo(pts[pts.length - 2].x, pts[pts.length - 2].y);
            ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
            ctx.stroke();
            ctx.restore();
          }
        }
      }
    }, []);

    const handleCanvasMouseUp = useCallback(() => {
      if (activeToolRef.current === 'freehand' && isFreehandDrawingRef.current) {
        isFreehandDrawingRef.current = false;
        if (freehandPointsRef.current.length > 1) {
          const newDrawing: FreehandDrawing = {
            id: `fh-${Date.now()}`,
            type: 'freehand',
            points: [...freehandPointsRef.current],
            color: drawColorRef.current,
          };
          setDrawings(prev => [...prev, newDrawing]);
        }
        freehandPointsRef.current = [];
      }
    }, []);

    const handleCanvasMouseLeave = useCallback(() => {
      if (activeToolRef.current === 'trendline' || activeToolRef.current === 'fibonacci') {
        setPendingMousePos(null);
      }
      if (activeToolRef.current === 'freehand' && isFreehandDrawingRef.current) {
        handleCanvasMouseUp();
      }
    }, [handleCanvasMouseUp]);

    // ── Toggle drawing tool ───────────────────────────────────────────────────

    const toggleDrawingTool = useCallback((tool: DrawingTool) => {
      setActiveTool(prev => {
        if (prev === tool) {
          setPendingTrendP1(null);
          setPendingMousePos(null);
          return null;
        }
        setPendingTrendP1(null);
        setPendingMousePos(null);
        return tool;
      });
    }, []);

    // ── Load data when symbol OR timeframe changes ────────────────────────────

    useEffect(() => {
      if (fetchAbortRef.current) { fetchAbortRef.current.abort(); }
      const abort = new AbortController();
      fetchAbortRef.current = abort;

      stopRealtimeFeeds();
      entryLinesRef.current.clear();
      lastBarRef.current = null;
      setOhlcBar(null);
      setIsAwayFromLive(false);
      firstCloseRef.current = null;
      candleDataRef.current = [];
      try { seriesRef.current?.setData([]); } catch {}
      hasOlderHistoryRef.current = true;
      loadingOlderHistoryRef.current = false;

      removeMainIndicators();
      removeSubPanels();

      setIsLoading(true);
      setDataUnavailable(false);

      const loadData = async () => {
        if (abort.signal.aborted || !seriesRef.current) return;

        const tfConfig = TIMEFRAMES.find((t) => t.label === timeframe) ?? TIMEFRAMES[0];
        const crypto = isCrypto(category, symbol) || usesBinanceProxy(symbol);

        let candles: CandlestickData[] = [];

        if (crypto) {
          const binanceSym = toBinanceSymbol(symbol);
          const raw = await fetchBinanceKlines(
            binanceSym,
            tfConfig.binanceInterval,
            Math.max(tfConfig.limit, INITIAL_HISTORY_LIMIT),
          );
          if (abort.signal.aborted) return;
          candles = raw.map((k: any) => ({
            time: toLocalDisplayTime(Math.floor(k[0] / 1000)),
            open: parseFloat(k[1]),
            high: parseFloat(k[2]),
            low: parseFloat(k[3]),
            close: parseFloat(k[4]),
          }));

          // Binance is not reachable in every region/network. Use the same
          // server-side TradingView feed as the other markets when its public
          // REST endpoints return no candles.
          if (candles.length === 0) {
            candles = await fetchTwelveDataKlines(
              toTwelveDataSymbol(symbol, category),
              tfConfig.tdInterval,
              Math.max(tfConfig.limit, INITIAL_HISTORY_LIMIT),
              undefined,
              exchange,
              category,
            );
          }

        } else {
          candles = await fetchTwelveDataKlines(
            toTwelveDataSymbol(symbol, category),
            tfConfig.tdInterval,
            Math.max(tfConfig.limit, INITIAL_HISTORY_LIMIT),
            undefined,
            exchange,
            category,
          );
          if (abort.signal.aborted) return;
        }

        if (abort.signal.aborted || !seriesRef.current) return;

        if (candles.length > 0) {
          const seen = new Set<number>();
          const unique = candles.filter((c) => {
            let t = c.time as number;
            if (seen.has(t)) return false;
            seen.add(t);
            return true;
          });

          try {
            seriesRef.current.setData(barsToSeriesData(unique, chartTypeRef.current) as any);
            lastBarRef.current = unique[unique.length - 1];
            setOhlcBar(unique[unique.length - 1] ?? null);
            firstCloseRef.current = unique[0]?.close ?? null;
            chartRef.current?.timeScale().fitContent();
            setIsAwayFromLive(false);

            const last = unique[unique.length - 1];
            const first = unique[0];
            if (last && first) {
              const change = last.close - first.close;
              const changePct = (change / first.close) * 100;
              onPriceUpdateRef.current?.(last.close, change, changePct);
            }

            candleDataRef.current = unique;

            if (activeIndicators.size > 0) {
              applyIndicators(unique, activeIndicators);
            }
          } catch {}

          openTrades.forEach((t) => {
            if (t.status === 'open' && seriesRef.current && !entryLinesRef.current.has(t.id)) {
              try {
                const priceLine = seriesRef.current!.createPriceLine({
                  price: t.entry_price,
                  color: t.order_type === 'buy' ? '#22c55e' : '#ef4444',
                  lineWidth: 1,
                  lineStyle: LineStyle.Dashed,
                  axisLabelVisible: true,
                  title: t.order_type.toUpperCase(),
                });
                entryLinesRef.current.set(t.id, priceLine);
              } catch {}
            }
          });
        } else {
          setDataUnavailable(true);
        }

        setIsLoading(false);
        onChartReadyRef.current?.();

        if (!abort.signal.aborted && candles.length > 0) {
          if (crypto) {
            startBinanceWS(symbol, timeframe, abort);
            if (usesBinanceProxy(symbol)) {
              startBinanceBookTickerWS(symbol, abort);
            }
          } else {
            startMarketQuotePoll(symbol, tfConfig.tdInterval, abort);
          }
        }
      };

      loadData();

      return () => { abort.abort(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [symbol, timeframe, marketDataKey]);

    // ── Binance WebSocket ─────────────────────────────────────────────────────

    const startBinanceWS = (sym: string, tf: string, abort: AbortController) => {
      const tfConfig = TIMEFRAMES.find((t) => t.label === tf) ?? TIMEFRAMES[0];
      const binanceSym = toBinanceSymbol(sym).toLowerCase();
      const wsEndpoints = [
        `wss://stream.binance.com:9443/ws/${binanceSym}@kline_${tfConfig.binanceInterval}`,
        `wss://stream.binance.com:443/ws/${binanceSym}@kline_${tfConfig.binanceInterval}`,
        `wss://data-stream.binance.vision/ws/${binanceSym}@kline_${tfConfig.binanceInterval}`,
      ];
      let wsIdx = 0;

      const connectWS = (url: string) => {
        if (abort.signal.aborted) return;
        try {
          const ws = new WebSocket(url);
          wsRef.current = ws;
          ws.onmessage = (event) => {
            if (abort.signal.aborted) return;
            try {
              const msg = JSON.parse(event.data);
              const k = msg.k;
              if (!k) return;
              lastWsMsgTimeRef.current = Date.now();
              const bar: CandlestickData = {
                time: toLocalDisplayTime(Math.floor(k.t / 1000)),
                open: parseFloat(k.o),
                high: parseFloat(k.h),
                low: parseFloat(k.l),
                close: parseFloat(k.c),
              };
              if (seriesRef.current) {
                try { seriesRef.current.update(barToSeriesPoint(bar, chartTypeRef.current) as any); } catch {}
                updateLastBar(bar);
                if (firstCloseRef.current !== null) {
                  const change = bar.close - firstCloseRef.current;
                  const changePct = (change / firstCloseRef.current) * 100;
                  onPriceUpdateRef.current?.(bar.close, change, changePct);
                }
              }
            } catch {}
          };
          ws.onerror = () => {};
          ws.onclose = () => {
            wsIdx++;
            if (!abort.signal.aborted && wsIdx < wsEndpoints.length) {
              setTimeout(() => { if (!abort.signal.aborted) connectWS(wsEndpoints[wsIdx]); }, 1500);
            }
          };
        } catch {}
      };

      connectWS(wsEndpoints[wsIdx]);

      const pollTick = async () => {
        if (abort.signal.aborted || !seriesRef.current) return;
        const wsIsLive = (Date.now() - lastWsMsgTimeRef.current) < WS_TIMEOUT_MS;
        if (wsIsLive) return;
        try {
          const tfConfig2 = TIMEFRAMES.find((t) => t.label === tf) ?? TIMEFRAMES[0];
          const klines = await fetchBinanceKlines(toBinanceSymbol(sym), tfConfig2.binanceInterval, 2);
          if (klines.length > 0 && seriesRef.current && !abort.signal.aborted) {
            const k = klines[klines.length - 1];
            const bar: CandlestickData = {
              time: toLocalDisplayTime(Math.floor(k[0] / 1000)),
              open: parseFloat(k[1]),
              high: parseFloat(k[2]),
              low: parseFloat(k[3]),
              close: parseFloat(k[4]),
            };
            try { seriesRef.current.update(barToSeriesPoint(bar, chartTypeRef.current) as any); } catch {}
            updateLastBar(bar);
            if (firstCloseRef.current !== null) {
              const change = bar.close - firstCloseRef.current;
              const changePct = (change / firstCloseRef.current) * 100;
              onPriceUpdateRef.current?.(bar.close, change, changePct);
            }
          }
        } catch {}
      };

      if (binancePollIntervalRef.current) {
        clearInterval(binancePollIntervalRef.current);
        binancePollIntervalRef.current = null;
      }
      setTimeout(() => {
        if (!abort.signal.aborted) {
          binancePollIntervalRef.current = setInterval(pollTick, 1000);
        }
      }, 1000);
    };

    // ── Binance book-ticker (continuous real bid/ask) ───────────────────────────
    // Trade-based klines only update when a trade actually happens. Thin
    // markets like PAXG can go whole minutes with zero trades, leaving real
    // gaps in the candle series. The book ticker stream instead pushes every
    // change to the best bid/ask — market makers requote continuously even
    // with no trades — so it ticks in real time with no gaps, and it's still
    // a genuine live market price, never a filled/fabricated value.
    // Used only as a supplementary live-price source (on top of the kline
    // feed above) for proxied instruments such as XAUUSD -> PAXG.
    const startBinanceBookTickerWS = (sym: string, abort: AbortController) => {
      const binanceSym = toBinanceSymbol(sym).toLowerCase();
      const wsEndpoints = [
        `wss://stream.binance.com:9443/ws/${binanceSym}@bookTicker`,
        `wss://stream.binance.com:443/ws/${binanceSym}@bookTicker`,
        `wss://data-stream.binance.vision/ws/${binanceSym}@bookTicker`,
      ];
      let wsIdx = 0;

      const connectWS = (url: string) => {
        if (abort.signal.aborted) return;
        try {
          const ws = new WebSocket(url);
          bookTickerWsRef.current = ws;
          ws.onmessage = (event) => {
            if (abort.signal.aborted || !seriesRef.current || !lastBarRef.current) return;
            try {
              const msg = JSON.parse(event.data);
              const bid = parseFloat(msg.b);
              const ask = parseFloat(msg.a);
              if (!Number.isFinite(bid) || !Number.isFinite(ask)) return;
              const mid = (bid + ask) / 2;

              const bar: CandlestickData = {
                ...lastBarRef.current,
                close: mid,
                high: Math.max(lastBarRef.current.high as number, mid),
                low: Math.min(lastBarRef.current.low as number, mid),
              };
              try { seriesRef.current.update(barToSeriesPoint(bar, chartTypeRef.current) as any); } catch {}
              updateLastBar(bar);
              if (firstCloseRef.current !== null) {
                const change = mid - firstCloseRef.current;
                const changePct = (change / firstCloseRef.current) * 100;
                onPriceUpdateRef.current?.(mid, change, changePct);
              }
            } catch {}
          };
          ws.onerror = () => {};
          ws.onclose = () => {
            wsIdx++;
            if (!abort.signal.aborted && wsIdx < wsEndpoints.length) {
              setTimeout(() => { if (!abort.signal.aborted) connectWS(wsEndpoints[wsIdx]); }, 1500);
            }
          };
        } catch {}
      };

      connectWS(wsEndpoints[wsIdx]);
    };

    // ── Shared live quote polling ─────────────────────────────────────────────

    const startMarketQuotePoll = (sym: string, interval: string, abort: AbortController) => {
      const intervalSeconds: Record<string, number> = {
        '1min': 60,
        '5min': 300,
        '15min': 900,
        '30min': 1800,
        '1h': 3600,
        '4h': 14_400,
        '12h': 43_200,
        '1day': 86_400,
        '1week': 604_800,
        '1month': 2_592_000,
      };

      const pollTick = async () => {
        if (abort.signal.aborted || !seriesRef.current) return;
        const wsIsLive = (Date.now() - lastWsMsgTimeRef.current) < WS_TIMEOUT_MS;
        if (wsIsLive) return;
        try {
          const params = new URLSearchParams({
            symbols: toTwelveDataSymbol(sym, category),
            exchanges: exchange ?? '',
            categories: category ?? '',
          });
          const response = await fetch(`/api/twelvedata/quote?${params.toString()}`, {
            cache: 'no-store',
            signal: abort.signal,
          });
          if (!response.ok || abort.signal.aborted || !seriesRef.current || !lastBarRef.current) return;

          const payload = await response.json();
          const quote = payload.quoteList?.[0];
          const price = Number(quote?.price);
          const change = Number(quote?.change);
          const changePct = Number(quote?.percentChange);
          if (!Number.isFinite(price) || price <= 0) return;

          const sourceTime = Number.isFinite(Number(quote?.timestamp))
            ? Number(quote.timestamp)
            : Math.floor(Date.now() / 1000);
          const bucketSize = intervalSeconds[interval] ?? 60;
          const bucketTime = toLocalDisplayTime(Math.floor(sourceTime / bucketSize) * bucketSize);
          const lastTime = Number(lastBarRef.current.time);
          const previousClose = Number(lastBarRef.current.close);
          const bar: CandlestickData = Number(bucketTime) > lastTime
            ? { time: bucketTime, open: previousClose, high: Math.max(previousClose, price), low: Math.min(previousClose, price), close: price }
            : {
                ...lastBarRef.current,
                high: Math.max(Number(lastBarRef.current.high), price),
                low: Math.min(Number(lastBarRef.current.low), price),
                close: price,
              };

          try { seriesRef.current.update(barToSeriesPoint(bar, chartTypeRef.current) as any); } catch {}
          updateLastBar(bar);
          onPriceUpdateRef.current?.(
            price,
            Number.isFinite(change) ? change : price - previousClose,
            Number.isFinite(changePct) ? changePct : ((price - previousClose) / previousClose) * 100,
          );
        } catch {}
      };

      if (marketQuotePollIntervalRef.current) {
        clearInterval(marketQuotePollIntervalRef.current);
        marketQuotePollIntervalRef.current = null;
      }
      void pollTick();
      setTimeout(() => {
        if (!abort.signal.aborted) {
          marketQuotePollIntervalRef.current = setInterval(pollTick, 5000);
        }
      }, 5000);
    };

    // ── Indicator buttons config ──────────────────────────────────────────────

    const INDICATOR_BUTTONS: { key: IndicatorKey; label: string; color: string }[] = [
      { key: 'MA',       label: 'MA',       color: '#f59e0b' },
      { key: 'EMA',      label: 'EMA',      color: '#34d399' },
      { key: 'BB',       label: 'BB',       color: '#818cf8' },
      { key: 'RSI',      label: 'RSI',      color: '#c084fc' },
      { key: 'MACD',     label: 'MACD',     color: '#38bdf8' },
      { key: 'Stoch',    label: 'Stoch',    color: '#fb923c' },
      { key: 'Vol',      label: 'Vol',      color: '#4ade80' },
      { key: 'Ichimoku', label: 'Ichimoku', color: '#ef4444' },
      { key: 'SAR',      label: 'SAR',      color: '#22c55e' },
      { key: 'ATR',      label: 'ATR',      color: '#f97316' },
      { key: 'CCI',      label: 'CCI',      color: '#06b6d4' },
      { key: 'VWAP',     label: 'VWAP',     color: '#e879f9' },
      { key: 'Pivot',    label: 'Pivot',    color: '#eab308' },
    ];

    // ── Drawing toolbar config ────────────────────────────────────────────────

    const DRAWING_TOOLS: { key: DrawingTool; label: string; icon: string; title: string }[] = [
      { key: 'trendline', label: 'Trend Line', icon: '↗', title: 'Trend Line: click two points' },
      { key: 'horizontal', label: 'H. Level', icon: '—', title: 'Horizontal Level: click to place' },
      { key: 'freehand', label: 'Freehand', icon: '✏', title: 'Freehand: click and drag' },
      { key: 'fibonacci', label: 'Fibonacci', icon: 'φ', title: 'Fibonacci Retracement: click swing low then swing high (or reverse)' },
      { key: 'delete', label: 'Delete', icon: '✕', title: 'Delete: click a drawing to remove it' },
    ];

    const canvasCursor = activeTool === 'delete' ? 'crosshair'
      : activeTool === 'freehand' ? 'crosshair' : activeTool ? 'crosshair' : 'default';

    const canvasPointerEvents = activeTool ? 'auto' : 'none';

    return (
      <div className="w-full relative" style={{ background: '#000', fontFamily: TRADINGVIEW_FONT }}>
        {/* ── Single compact toolbar row ── */}
        <div
          className="flex items-center border-b border-white/10"
          style={{ height: 34, minHeight: 34, background: 'rgba(255,255,255,0.02)', overflow: 'visible', position: 'relative', zIndex: 10 }}
        >
          {/* ── Timeframe dropdown ── */}
          <TimeframeDropdown timeframes={TIMEFRAMES} timeframe={timeframe} onChange={setTimeframe} />

          {/* ── Divider ── */}
          <div className="w-px self-stretch bg-white/10 mx-1 flex-shrink-0" />

          {/* ── Chart type dropdown toggle ── */}
          <ChartTypeDropdown chartType={chartType} onChange={handleChartTypeChange} />

          {/* ── Divider ── */}
          <div className="w-px self-stretch bg-white/10 mx-1 flex-shrink-0" />

          {/* ── Indicators dropdown toggle ── */}
          <IndicatorDropdown
            buttons={INDICATOR_BUTTONS}
            activeIndicators={activeIndicators}
            onToggle={toggleIndicator}
          />

          {/* ── Divider ── */}
          <div className="w-px self-stretch bg-white/10 mx-1 flex-shrink-0" />

          {/* ── Drawing tools dropdown toggle ── */}
          <DrawingDropdown
            tools={DRAWING_TOOLS}
            activeTool={activeTool}
            drawColor={drawColor}
            drawings={drawings}
            pendingTrendP1={pendingTrendP1}
            onToggleTool={toggleDrawingTool}
            onColorChange={setDrawColor}
            onClearAll={() => {
              setDrawings([]);
              setPendingTrendP1(null);
              setPendingMousePos(null);
            }}
          />
        </div>

        {/* Main chart container + canvas overlay */}
        <div ref={canvasWrapRef} className="relative" style={{ width: '100%' }}>
          <div
            ref={containerRef}
            style={{
              width: '100%',
              height: chartHeight,
              display: 'block',
            }}
          />
          {/* Overlay legends — top-left: OHLC bar first, then indicator
              values below it, so nothing stacks as price-axis labels on the
              right edge when many overlays are active at once. */}
          <div
            className="absolute top-1.5 left-1.5 flex flex-col gap-y-0.5 pointer-events-none"
            style={{ maxWidth: 'calc(100% - 12px)', zIndex: 5 }}
          >
            {/* OHLC legend — the hovered candle, or the latest live one when
                not hovering. Read from candleDataRef (always full OHLC) so
                it stays correct even in Line/Area/Baseline chart types. */}
            {ohlcBar && (() => {
              const change = ohlcBar.close - ohlcBar.open;
              const changePct = ohlcBar.open !== 0 ? (change / ohlcBar.open) * 100 : 0;
              const isUp = change >= 0;
              const changeColor = isUp ? UP_COLOR : DOWN_COLOR;
              return (
                <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 text-[10px] font-medium" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.9)' }}>
                  <span className="text-slate-400">O<span className="text-white ml-0.5">{fmtLegendVal(ohlcBar.open)}</span></span>
                  <span className="text-slate-400">H<span style={{ color: UP_COLOR }} className="ml-0.5">{fmtLegendVal(ohlcBar.high)}</span></span>
                  <span className="text-slate-400">L<span style={{ color: DOWN_COLOR }} className="ml-0.5">{fmtLegendVal(ohlcBar.low)}</span></span>
                  <span className="text-slate-400">C<span style={{ color: changeColor }} className="ml-0.5">{fmtLegendVal(ohlcBar.close)}</span></span>
                  <span style={{ color: changeColor }}>
                    {isUp ? '+' : ''}{fmtLegendVal(change)} ({isUp ? '+' : ''}{changePct.toFixed(2)}%)
                  </span>
                </div>
              );
            })()}
            {mainLegend.length > 0 && (
              <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                {mainLegend.map((item, i) => (
                  <span key={`${item.label}-${i}`} className="text-[10px] font-medium whitespace-nowrap" style={{ color: item.color, textShadow: '0 1px 2px rgba(0,0,0,0.9)' }}>
                    {item.label} {item.value}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* "Return to live" — appears once the user has scrolled/zoomed
              away from the real-time edge; jumps back without changing the
              current zoom level. */}
          {isAwayFromLive && (
            <button
              onClick={() => {
                chartRef.current?.timeScale().scrollToRealTime();
                setIsAwayFromLive(false);
              }}
              title="Return to live"
              className="absolute flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold text-white transition-all hover:brightness-110"
              style={{
                bottom: 8,
                right: 84,
                zIndex: 15,
                background: 'rgba(15,17,23,0.9)',
                border: '1px solid rgba(255,255,255,0.15)',
              }}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
              Live
            </button>
          )}

          <canvas
            ref={canvasRef}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              pointerEvents: canvasPointerEvents,
              cursor: canvasCursor,
              zIndex: 10,
            }}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseLeave}
          />
        </div>

        {/* RSI sub-panel */}
        {activeIndicators.has('RSI') && (
          <div className="border-t border-white/10">
            <div className="px-2 py-0.5 flex items-center gap-1">
              <span className="text-[10px] font-medium" style={{ color: '#c084fc' }}>RSI (14)</span>
              {rsiLegend[0] && <span className="text-[10px] font-semibold" style={{ color: '#c084fc' }}>{rsiLegend[0].value}</span>}
              <span className="text-[9px] text-slate-500">· OB: 70 · OS: 30</span>
            </div>
            <div ref={rsiContainerRef} style={{ width: '100%', height: 100 }} />
          </div>
        )}

        {/* MACD sub-panel */}
        {activeIndicators.has('MACD') && (
          <div className="border-t border-white/10">
            <div className="px-2 py-0.5 flex items-center gap-2">
              <span className="text-[10px] font-medium" style={{ color: '#38bdf8' }}>MACD (12,26,9)</span>
              <span className="text-[9px]" style={{ color: '#38bdf8' }}>— MACD {macdLegend.find(l => l.label === 'MACD')?.value ?? ''}</span>
              <span className="text-[9px]" style={{ color: '#fb923c' }}>— Signal {macdLegend.find(l => l.label === 'Signal')?.value ?? ''}</span>
            </div>
            <div ref={macdContainerRef} style={{ width: '100%', height: 100 }} />
          </div>
        )}

        {/* Stoch sub-panel */}
        {activeIndicators.has('Stoch') && (
          <div className="border-t border-white/10">
            <div className="px-2 py-0.5 flex items-center gap-2">
              <span className="text-[10px] font-medium" style={{ color: '#fb923c' }}>Stoch (14,3,3)</span>
              <span className="text-[9px]" style={{ color: '#38bdf8' }}>— %K {stochLegend.find(l => l.label === '%K')?.value ?? ''}</span>
              <span className="text-[9px]" style={{ color: '#fb923c' }}>— %D {stochLegend.find(l => l.label === '%D')?.value ?? ''}</span>
            </div>
            <div ref={stochContainerRef} style={{ width: '100%', height: 100 }} />
          </div>
        )}

        {/* ATR sub-panel */}
        {activeIndicators.has('ATR') && (
          <div className="border-t border-white/10">
            <div className="px-2 py-0.5 flex items-center gap-1">
              <span className="text-[10px] font-medium" style={{ color: '#f97316' }}>ATR (14)</span>
              {atrLegend[0] && <span className="text-[10px] font-semibold" style={{ color: '#f97316' }}>{atrLegend[0].value}</span>}
              <span className="text-[9px] text-slate-500">· Average True Range</span>
            </div>
            <div ref={atrContainerRef} style={{ width: '100%', height: 90 }} />
          </div>
        )}

        {/* CCI sub-panel */}
        {activeIndicators.has('CCI') && (
          <div className="border-t border-white/10">
            <div className="px-2 py-0.5 flex items-center gap-1">
              <span className="text-[10px] font-medium" style={{ color: '#06b6d4' }}>CCI (20)</span>
              {cciLegend[0] && <span className="text-[10px] font-semibold" style={{ color: '#06b6d4' }}>{cciLegend[0].value}</span>}
              <span className="text-[9px] text-slate-500">· +100 / -100</span>
            </div>
            <div ref={cciContainerRef} style={{ width: '100%', height: 90 }} />
          </div>
        )}

        {/* Loading overlay */}
        {isLoading && (
          <div
            className="absolute flex items-center justify-center pointer-events-none"
            style={{ top: 34, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.55)' }}
          >
            <div className="flex flex-col items-center gap-2">
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-slate-400 text-xs font-medium">Loading...</span>
            </div>
          </div>
        )}
        {dataUnavailable && !isLoading && (
          <div
            className="absolute flex items-center justify-center pointer-events-none"
            style={{ top: 34, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.72)' }}
          >
            <div className="text-center px-4">
              <p className="text-slate-200 text-xs font-semibold">Live market data unavailable</p>
              <p className="text-slate-500 text-[10px] mt-1">No substitute price is shown for this instrument.</p>
            </div>
          </div>
        )}
      </div>
    );
  }
);

LightweightChart.displayName = 'LightweightChart';

// ─── TimeframeDropdown sub-component ─────────────────────────────────────────

interface TimeframeDropdownProps {
  timeframes: TimeframeConfig[];
  timeframe: string;
  onChange: (label: string) => void;
}

function TimeframeDropdown({ timeframes, timeframe, onChange }: TimeframeDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [dropPos, setDropPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node) && btnRef.current && !btnRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleOpen = () => {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setDropPos({ top: rect.bottom + 4, left: rect.left });
    }
    setOpen((v) => !v);
  };

  return (
    <div className="relative flex-shrink-0">
      <button
        ref={btnRef}
        onClick={handleOpen}
        title="Timeframe"
        className={`flex items-center gap-1 px-2 h-[34px] text-[11px] font-bold tracking-wide transition-all ${open ? 'text-indigo-400' : 'text-white hover:text-indigo-300'}`}
      >
        {timeframe.toUpperCase()}
        <svg width="8" height="8" viewBox="0 0 8 8" fill="none" className={`transition-transform ${open ? 'rotate-180' : ''}`}>
          <path d="M1 2.5L4 5.5L7 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <div
          ref={ref}
          className="z-[9999] rounded-lg border border-white/10 shadow-2xl p-1.5"
          style={{ position: 'fixed', top: dropPos.top, left: dropPos.left, background: '#0f1117', width: 176 }}
        >
          <div className="text-[9px] text-slate-600 uppercase tracking-widest font-semibold px-1 mb-1">Timeframe</div>
          <div className="grid grid-cols-4 gap-1">
            {timeframes.map((tf) => {
              const isActive = timeframe === tf.label;
              return (
                <button
                  key={tf.label}
                  onClick={() => { onChange(tf.label); setOpen(false); }}
                  className={`px-1.5 py-1.5 rounded text-[10px] font-bold tracking-wide transition-all text-center ${
                    isActive ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {tf.label.toUpperCase()}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ChartTypeDropdown sub-component ─────────────────────────────────────────

const CHART_TYPE_ICONS: Record<ChartType, React.ReactNode> = {
  candles: (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <line x1="3" y1="1" x2="3" y2="4" stroke="currentColor" strokeWidth="1" />
      <rect x="1.5" y="4" width="3" height="5" rx="0.5" fill="currentColor" />
      <line x1="3" y1="9" x2="3" y2="12" stroke="currentColor" strokeWidth="1" />
      <line x1="9.5" y1="2" x2="9.5" y2="5" stroke="currentColor" strokeWidth="1" opacity="0.6" />
      <rect x="8" y="5" width="3" height="4" rx="0.5" fill="currentColor" opacity="0.6" />
      <line x1="9.5" y1="9" x2="9.5" y2="11" stroke="currentColor" strokeWidth="1" opacity="0.6" />
    </svg>
  ),
  bars: (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
      <line x1="3" y1="1" x2="3" y2="12" />
      <line x1="1" y1="4" x2="3" y2="4" />
      <line x1="3" y1="8" x2="5" y2="8" />
      <line x1="9.5" y1="2" x2="9.5" y2="11" opacity="0.6" />
      <line x1="7.5" y1="4.5" x2="9.5" y2="4.5" opacity="0.6" />
      <line x1="9.5" y1="8" x2="11.5" y2="8" opacity="0.6" />
    </svg>
  ),
  line: (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1,10 4,6 6.5,8 9,3 12,5" />
    </svg>
  ),
  area: (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <path d="M1 10L4 6L6.5 8L9 3L12 5V12H1V10Z" fill="currentColor" opacity="0.3" />
      <polyline points="1,10 4,6 6.5,8 9,3 12,5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  baseline: (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <line x1="0" y1="6.5" x2="13" y2="6.5" stroke="currentColor" strokeWidth="1" strokeDasharray="1.5 1.2" opacity="0.5" />
      <path d="M1 4L4 2L6.5 6.5L9 9.5L12 8V6.5H1V4Z" fill="currentColor" opacity="0.25" />
      <polyline points="1,4 4,2 6.5,6.5 9,9.5 12,8" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

const CHART_TYPE_LABELS: Record<ChartType, string> = {
  candles: 'Candles',
  bars: 'Bars',
  line: 'Line',
  area: 'Area',
  baseline: 'Baseline',
};

const CHART_TYPE_ORDER: ChartType[] = ['candles', 'bars', 'line', 'area', 'baseline'];

interface ChartTypeDropdownProps {
  chartType: ChartType;
  onChange: (type: ChartType) => void;
}

function ChartTypeDropdown({ chartType, onChange }: ChartTypeDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [dropPos, setDropPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node) && btnRef.current && !btnRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleOpen = () => {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setDropPos({ top: rect.bottom + 4, left: rect.left });
    }
    setOpen((v) => !v);
  };

  return (
    <div className="relative flex-shrink-0">
      <button
        ref={btnRef}
        onClick={handleOpen}
        title={`Chart type: ${CHART_TYPE_LABELS[chartType]}`}
        className={`flex items-center gap-1 px-2 h-[34px] transition-all ${open ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'}`}
      >
        {CHART_TYPE_ICONS[chartType]}
        <svg width="8" height="8" viewBox="0 0 8 8" fill="none" className={`transition-transform ${open ? 'rotate-180' : ''}`}>
          <path d="M1 2.5L4 5.5L7 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <div
          ref={ref}
          className="z-[9999] rounded-lg border border-white/10 shadow-2xl p-1.5"
          style={{ position: 'fixed', top: dropPos.top, left: dropPos.left, background: '#0f1117', width: 148 }}
        >
          <div className="text-[9px] text-slate-600 uppercase tracking-widest font-semibold px-1 mb-1">Chart Type</div>
          <div className="flex flex-col">
            {CHART_TYPE_ORDER.map((type) => {
              const isActive = chartType === type;
              return (
                <button
                  key={type}
                  onClick={() => { onChange(type); setOpen(false); }}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded text-[11px] font-medium transition-all text-left ${
                    isActive ? 'bg-indigo-500/15 text-indigo-300' : 'text-slate-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span className={isActive ? 'text-indigo-300' : 'text-slate-500'}>{CHART_TYPE_ICONS[type]}</span>
                  {CHART_TYPE_LABELS[type]}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── IndicatorDropdown sub-component ─────────────────────────────────────────

interface IndicatorDropdownProps {
  buttons: { key: IndicatorKey; label: string; color: string }[];
  activeIndicators: Set<IndicatorKey>;
  onToggle: (key: IndicatorKey) => void;
}

function IndicatorDropdown({ buttons, activeIndicators, onToggle }: IndicatorDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [dropPos, setDropPos] = useState<{ top: number; right: number }>({ top: 0, right: 0 });
  const activeCount = buttons.filter(b => activeIndicators.has(b.key)).length;

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node) && btnRef.current && !btnRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleOpen = () => {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      // Anchor to the button's right edge (not left) so the panel opens
      // leftward and never overflows past the viewport's right side —
      // this button sits near the right end of the toolbar.
      setDropPos({ top: rect.bottom + 4, right: Math.max(8, window.innerWidth - rect.right) });
    }
    setOpen(v => !v);
  };

  return (
    <div className="relative flex-shrink-0">
      <button
        ref={btnRef}
        onClick={handleOpen}
        title="Indicators"
        className={`flex items-center gap-1 px-2 h-[34px] text-[11px] font-medium transition-all ${
          open || activeCount > 0 ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-200'
        }`}
      >
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="0" y="7" width="2.5" height="6" rx="0.5" fill="currentColor" opacity="0.7"/>
          <rect x="3.5" y="4" width="2.5" height="9" rx="0.5" fill="currentColor" opacity="0.85"/>
          <rect x="7" y="1" width="2.5" height="12" rx="0.5" fill="currentColor"/>
          <rect x="10.5" y="5" width="2.5" height="8" rx="0.5" fill="currentColor" opacity="0.7"/>
        </svg>
        <span>Indicators</span>
        {activeCount > 0 && (
          <span
            className="text-[9px] font-bold px-1 rounded-full leading-none py-0.5"
            style={{ background: 'rgba(239,68,68,0.25)', color: '#818cf8' }}
          >
            {activeCount}
          </span>
        )}
        <svg width="8" height="8" viewBox="0 0 8 8" fill="none" className={`transition-transform ${open ? 'rotate-180' : ''}`}>
          <path d="M1 2.5L4 5.5L7 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
        </svg>
      </button>

      {open && (
        <div
          ref={ref}
          className="z-[9999] rounded-lg border border-white/10 shadow-2xl p-2"
          style={{ position: 'fixed', top: dropPos.top, right: dropPos.right, background: '#0f1117', width: 192 }}
        >
          {INDICATOR_GROUPS.map((group) => {
            const groupButtons = buttons.filter((b) => group.keys.includes(b.key));
            if (groupButtons.length === 0) return null;
            return (
              <div key={group.label} className="mb-2 last:mb-0">
                <div className="text-[9px] text-slate-600 uppercase tracking-widest font-semibold px-1 mb-1">{group.label}</div>
                <div className="grid grid-cols-3 gap-1">
                  {groupButtons.map(({ key, label, color }) => {
                    const isActive = activeIndicators.has(key);
                    return (
                      <button
                        key={key}
                        onClick={() => onToggle(key)}
                        className={`px-2 py-1 rounded text-[10px] font-semibold transition-all border text-center ${
                          isActive
                            ? 'text-black border-transparent' : 'bg-transparent text-slate-400 border-white/10 hover:border-white/20 hover:text-white'
                        }`}
                        style={isActive ? { backgroundColor: color, borderColor: color } : {}}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── DrawingDropdown sub-component ───────────────────────────────────────────

interface DrawingDropdownProps {
  tools: { key: DrawingTool; label: string; icon: string; title: string }[];
  activeTool: DrawingTool;
  drawColor: string;
  drawings: Drawing[];
  pendingTrendP1: Point | null;
  onToggleTool: (tool: DrawingTool) => void;
  onColorChange: (color: string) => void;
  onClearAll: () => void;
}

function DrawingDropdown({ tools, activeTool, drawColor, drawings, pendingTrendP1, onToggleTool, onColorChange, onClearAll }: DrawingDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [dropPos, setDropPos] = useState<{ top: number; right: number }>({ top: 0, right: 0 });
  const hasActiveTool = activeTool !== null;

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node) && btnRef.current && !btnRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleOpen = () => {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      // Anchor to the button's right edge — Draw is the rightmost toolbar
      // button, so opening from its left edge pushed the panel off-screen.
      setDropPos({ top: rect.bottom + 4, right: Math.max(8, window.innerWidth - rect.right) });
    }
    setOpen(v => !v);
  };

  return (
    <div className="relative flex-shrink-0">
      <button
        ref={btnRef}
        onClick={handleOpen}
        title="Drawing Tools"
        className={`flex items-center gap-1 px-2 h-[34px] text-[11px] font-medium transition-all ${
          open || hasActiveTool ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-200'
        }`}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M8.5 1.5L10.5 3.5L4 10L1.5 10.5L2 8L8.5 1.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span>Draw</span>
        {hasActiveTool && (
          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#6366f1' }} />
        )}
        <svg width="8" height="8" viewBox="0 0 8 8" fill="none" className={`transition-transform ${open ? 'rotate-180' : ''}`}>
          <path d="M1 2.5L4 5.5L7 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
        </svg>
      </button>

      {open && (
        <div
          ref={ref}
          className="z-[9999] rounded-lg border border-white/10 shadow-2xl p-1.5"
          style={{ position: 'fixed', top: dropPos.top, right: dropPos.right, background: '#0f1117', width: 152 }}
        >
          <div className="text-[9px] text-slate-600 uppercase tracking-widest font-semibold px-1 mb-1">Drawing Tools</div>
          <div className="flex flex-col gap-0.5">
            {tools.map(({ key, label, icon, title }) => {
              const isActive = activeTool === key;
              return (
                <button
                  key={key}
                  onClick={() => onToggleTool(key)}
                  title={title}
                  className={`flex items-center gap-1.5 px-1.5 py-1 rounded text-[10px] font-medium transition-all text-left ${
                    isActive
                      ? key === 'delete'
                        ? 'bg-red-600/20 text-red-400 border border-red-600/40' :'bg-indigo-600/20 text-indigo-300 border border-indigo-600/40' :'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <span className={`text-[13px] ${isActive ? 'text-indigo-400' : 'text-slate-500'} w-4 text-center leading-none`}>{icon}</span>
                  <span>{label}</span>
                </button>
              );
            })}
          </div>

          <div className="h-px bg-white/10 my-1.5" />

          <div className="flex items-center justify-between px-1">
            <label className="flex items-center gap-1 cursor-pointer" title="Drawing color">
              <span className="text-[9px] text-slate-500">Color</span>
              <div
                className="w-4 h-4 rounded border border-white/20 overflow-hidden relative"
                style={{ backgroundColor: drawColor }}
              >
                <input
                  type="color"
                  value={drawColor}
                  onChange={e => onColorChange(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  style={{ padding: 0, border: 'none' }}
                />
              </div>
            </label>

            <button
              onClick={onClearAll}
              disabled={drawings.length === 0}
              title="Clear all drawings"
              className={`text-[9px] font-medium px-1.5 py-0.5 rounded transition-all ${
                drawings.length > 0
                  ? 'text-slate-400 hover:text-red-400 hover:bg-red-500/10' :'text-slate-700 cursor-not-allowed'
              }`}
            >
              Clear {drawings.length > 0 && `(${drawings.length})`}
            </button>
          </div>

          {(activeTool === 'trendline' || activeTool === 'fibonacci') && (
            <div className="mt-1.5 px-1">
              <span className={`text-[9px] ${pendingTrendP1 ? 'text-blue-400 animate-pulse' : 'text-slate-500'}`}>
                {pendingTrendP1
                  ? (activeTool === 'fibonacci' ? 'Click the swing high…' : 'Click second point…')
                  : (activeTool === 'fibonacci' ? 'Click the swing low…' : 'Click first point…')}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default LightweightChart;
