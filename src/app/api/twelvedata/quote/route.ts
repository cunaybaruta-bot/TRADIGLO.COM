import { NextRequest, NextResponse } from 'next/server';
import { fetchTradingViewQuotes, type TradingViewInstrument } from '@/lib/server/tradingViewMarket';

export const runtime = 'nodejs';

const MAX_SYMBOLS_PER_REQUEST = 8;
const SYMBOL_PATTERN = /^[A-Z0-9!./:-]{1,32}$/;

type TwelveDataQuote = {
  status?: string;
  close?: string;
  price?: string;
  change?: string;
  percent_change?: string;
};

function parseInstruments(
  rawSymbols: string | null,
  rawExchanges: string | null,
  rawCategories: string | null,
): TradingViewInstrument[] {
  if (!rawSymbols) return [];

  const symbolList = rawSymbols.split(',').map((symbol) => symbol.trim().toUpperCase());
  const exchangeList = rawExchanges?.split(',').map((item) => item.trim()) ?? [];
  const categoryList = rawCategories?.split(',').map((item) => item.trim()) ?? [];

  const seen = new Set<string>();
  const instruments: TradingViewInstrument[] = [];

  for (let i = 0; i < symbolList.length; i++) {
    const symbol = symbolList[i];
    if (!symbol || !SYMBOL_PATTERN.test(symbol)) continue;
    if (seen.has(symbol)) continue;

    seen.add(symbol);
    instruments.push({
      symbol,
      exchange: exchangeList[i] || undefined,
      category: categoryList[i] || undefined,
    });

    if (instruments.length >= MAX_SYMBOLS_PER_REQUEST) {
      break;
    }
  }

  return instruments;
}

async function tradingViewFallback(instruments: TradingViewInstrument[]) {
  const quoteList = await fetchTradingViewQuotes(instruments);
  const quotes: Record<string, { price: number; change: number; percentChange: number }> = {};

  quoteList.forEach((quote, index) => {
    if (!quote) return;
    quotes[instruments[index].symbol] = {
      price: quote.price,
      change: quote.change,
      percentChange: quote.percentChange,
    };
  });

  return NextResponse.json(
    { quotes, quoteList, source: 'tradingview' },
    { headers: { 'Cache-Control': 'private, max-age=10, stale-while-revalidate=10' } },
  );
}

export async function GET(request: NextRequest) {
  const instruments = parseInstruments(
    request.nextUrl.searchParams.get('symbols'),
    request.nextUrl.searchParams.get('exchanges'),
    request.nextUrl.searchParams.get('categories'),
  );

  if (instruments.length === 0) {
    return NextResponse.json({ error: 'At least one valid symbol is required.' }, { status: 400 });
  }

  const symbols = instruments.map((instrument) => instrument.symbol);

  const apiKey = process.env.TWELVE_DATA_API_KEY;
  if (!apiKey) {
    try {
      return await tradingViewFallback(instruments);
    } catch (error) {
      console.error('[market-data/quote] TradingView fallback failed', { symbols, error: String(error) });
      return NextResponse.json({ error: 'Live quotes are unavailable.', code: 'PROVIDER_UNAVAILABLE' }, { status: 502 });
    }
  }

  const upstreamUrl = new URL('https://api.twelvedata.com/quote');
  upstreamUrl.searchParams.set('symbol', symbols.join(','));
  upstreamUrl.searchParams.set('apikey', apiKey);

  try {
    const response = await fetch(upstreamUrl, {
      // Quotes remain fresh while avoiding one paid upstream request per row
      // when several members have the selector open at the same time.
      next: { revalidate: 15 },
    });
    const payload = await response.json();

    if (!response.ok) {
      console.warn('[market-data/quote] Twelve Data failed; using TradingView', { symbols, status: response.status });
      return await tradingViewFallback(instruments);
    }

    const source: Record<string, TwelveDataQuote> = symbols.length === 1
      ? { [symbols[0]]: payload }
      : payload;
    const quotes: Record<string, { price: number; change: number; percentChange: number }> = {};
    const quoteList: Array<{ price: number; change: number; percentChange: number } | null> = [];

    for (const symbol of symbols) {
      const quote = source[symbol];
      if (!quote || quote.status === 'error') {
        quoteList.push(null);
        continue;
      }

      const price = Number.parseFloat(quote.close ?? quote.price ?? '');
      const change = Number.parseFloat(quote.change ?? '');
      const percentChange = Number.parseFloat(quote.percent_change ?? '');
      if (!Number.isFinite(price) || price <= 0 || !Number.isFinite(change) || !Number.isFinite(percentChange)) {
        quoteList.push(null);
        continue;
      }

      quotes[symbol] = { price, change, percentChange };
      quoteList.push({ price, change, percentChange });
    }

    if (quoteList.every((quote) => quote === null)) return await tradingViewFallback(instruments);

    return NextResponse.json(
      { quotes, quoteList, source: 'twelvedata' },
      { headers: { 'Cache-Control': 'private, max-age=15, stale-while-revalidate=15' } }
    );
  } catch (error) {
    console.warn('[market-data/quote] Primary provider unreachable; using TradingView', { symbols, error: String(error) });
    try {
      return await tradingViewFallback(instruments);
    } catch (fallbackError) {
      console.error('[market-data/quote] All live providers failed', { symbols, error: String(fallbackError) });
      return NextResponse.json({ error: 'Live quotes are unavailable.', code: 'PROVIDER_UNAVAILABLE' }, { status: 502 });
    }
  }
}
