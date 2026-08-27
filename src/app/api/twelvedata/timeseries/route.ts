import { NextRequest, NextResponse } from 'next/server';
import { fetchTradingViewCandles } from '@/lib/server/tradingViewMarket';

export const runtime = 'nodejs';

const SUPPORTED_INTERVALS = new Set(['1min', '5min', '15min', '30min', '1h', '4h', '12h', '1day', '1week', '1month']);
const SYMBOL_PATTERN = /^[A-Z0-9!./:-]{1,32}$/;

async function tradingViewFallback(
  symbol: string,
  exchange: string | undefined,
  category: string | undefined,
  interval: string,
  outputsize: number,
  endDate: string | null,
) {
  const parsedEndDate = endDate ? Date.parse(`${endDate.replace(' ', 'T')}Z`) : Number.NaN;
  const candles = await fetchTradingViewCandles(
    { symbol, exchange, category },
    interval,
    outputsize,
    Number.isFinite(parsedEndDate) ? Math.floor(parsedEndDate / 1000) : undefined,
  );

  // Keep the Twelve Data-compatible response contract used by the chart.
  // The chart reverses this newest-first array before rendering.
  const values = candles.slice().reverse().map((candle) => ({
    datetime: new Date(candle.time * 1000).toISOString(),
    open: String(candle.open),
    high: String(candle.high),
    low: String(candle.low),
    close: String(candle.close),
    volume: String(candle.volume),
  }));

  return NextResponse.json(
    { values, source: 'tradingview' },
    { headers: { 'Cache-Control': 'private, max-age=10, stale-while-revalidate=20' } },
  );
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = (searchParams.get('symbol') || '').trim().toUpperCase();
  const requestedInterval = searchParams.get('interval') || '1day';
  const interval = SUPPORTED_INTERVALS.has(requestedInterval) ? requestedInterval : '1day';
  const outputsize = Math.min(Math.max(Number.parseInt(searchParams.get('outputsize') || '500', 10) || 500, 2), 500);
  const endDate = searchParams.get('end_date');
  const exchange = searchParams.get('exchange')?.trim() || undefined;
  const category = searchParams.get('category')?.trim() || undefined;

  if (!SYMBOL_PATTERN.test(symbol)) {
    return NextResponse.json({ error: 'Invalid market symbol.' }, { status: 400 });
  }

  const apiKey = process.env.TWELVE_DATA_API_KEY;
  if (!apiKey) {
    try {
      return await tradingViewFallback(symbol, exchange, category, interval, outputsize, endDate);
    } catch (error) {
      console.error('[market-data/timeseries] TradingView fallback failed', { symbol, exchange, category, error: String(error) });
      return NextResponse.json({ error: 'Live market data is unavailable.' }, { status: 502 });
    }
  }

  try {
    const endDateParam = endDate ? `&end_date=${encodeURIComponent(endDate)}` : '';
    const url = `https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(symbol)}&interval=${interval}&outputsize=${outputsize}${endDateParam}&apikey=${apiKey}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
      console.warn('[market-data/timeseries] Twelve Data failed; using TradingView', { symbol, status: res.status });
      return await tradingViewFallback(symbol, exchange, category, interval, outputsize, endDate);
    }
    const data = await res.json();
    if (!Array.isArray(data?.values) || data.values.length === 0) {
      console.warn('[market-data/timeseries] Twelve Data returned no candles; using TradingView', { symbol });
      return await tradingViewFallback(symbol, exchange, category, interval, outputsize, endDate);
    }
    return NextResponse.json(data);
  } catch (err: any) {
    console.warn('[market-data/timeseries] Primary provider unreachable; using TradingView', { symbol, error: String(err) });
    try {
      return await tradingViewFallback(symbol, exchange, category, interval, outputsize, endDate);
    } catch (fallbackError) {
      console.error('[market-data/timeseries] All live providers failed', { symbol, error: String(fallbackError) });
      return NextResponse.json({ error: 'Live market data is unavailable.' }, { status: 502 });
    }
  }
}
