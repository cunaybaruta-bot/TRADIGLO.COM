import TradingView from '@mathieuc/tradingview';

const REQUEST_TIMEOUT_MS = 12_000;

const COMMODITY_EXCHANGE: Record<string, string> = {
  XAUUSD: 'OANDA',
  XAGUSD: 'OANDA',
  USOIL: 'TVC',
  UKOIL: 'TVC',
  'NG1!': 'NYMEX',
  'HG1!': 'COMEX',
  'AH1!': 'LME',
  'NI1!': 'LME',
  'ZS1!': 'CBOT',
  'PB1!': 'LME',
  'SN1!': 'LME',
  'PL1!': 'NYMEX',
  'PA1!': 'NYMEX',
  'ZW1!': 'CBOT',
  'ZC1!': 'CBOT',
  'ZR1!': 'CBOT',
  'KC1!': 'ICEUS',
  'CC1!': 'ICEUS',
  'CT1!': 'ICEUS',
  'SB1!': 'ICEUS',
  'LBR1!': 'CME',
  'OJ1!': 'ICEUS',
  'LE1!': 'CME',
  'HE1!': 'CME',
};

// Compatibility for installations whose commodity normalization migration has
// not been deployed yet. Values are canonical TradingView market identifiers.
const LEGACY_COMMODITY_MARKET: Record<string, string> = {
  ALUMINUM: 'LME:AH1!',
  ALUMINIUM: 'LME:AH1!',
  COCOA: 'ICEUS:CC1!',
  COFFEE: 'ICEUS:KC1!',
  COPPER: 'COMEX:HG1!',
  CORN: 'CBOT:ZC1!',
  COTTON: 'ICEUS:CT1!',
  LUMBER: 'CME:LBR1!',
  NATGAS: 'NYMEX:NG1!',
  NGAS: 'NYMEX:NG1!',
  NICKEL: 'LME:NI1!',
  PALLADIUM: 'NYMEX:PA1!',
  PLATINUM: 'NYMEX:PL1!',
  SOYBEAN: 'CBOT:ZS1!',
  SUGAR: 'ICEUS:SB1!',
  WHEAT: 'CBOT:ZW1!',
  ZINC: 'LME:ZS1!',
};

const TWELVE_TO_TRADINGVIEW_INTERVAL: Record<string, string> = {
  '1min': '1',
  '5min': '5',
  '15min': '15',
  '30min': '30',
  '1h': '60',
  '4h': '240',
  '12h': '720',
  '1day': 'D',
  '1week': 'W',
  '1month': 'M',
};

export interface TradingViewInstrument {
  symbol: string;
  exchange?: string;
  category?: string;
}

export interface TradingViewQuote {
  price: number;
  change: number;
  percentChange: number;
  timestamp: number | null;
}

export interface TradingViewCandle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

function cleanSymbol(symbol: string): string {
  return symbol.trim().toUpperCase().replaceAll('/', '');
}

export function toTradingViewMarket({ symbol, exchange, category }: TradingViewInstrument): string {
  const clean = cleanSymbol(symbol);
  const normalizedExchange = exchange?.trim().toUpperCase();
  const normalizedCategory = category?.trim().toLowerCase() ?? '';

  if (['commodity', 'commodities'].includes(normalizedCategory)) {
    if (LEGACY_COMMODITY_MARKET[clean]) return LEGACY_COMMODITY_MARKET[clean];
    if (clean === 'XAUUSD') return 'OANDA:XAUUSD';
    if (clean === 'XAGUSD') return 'OANDA:XAGUSD';
    if (clean === 'USOIL') return 'TVC:USOIL';
    if (clean === 'UKOIL') return 'TVC:UKOIL';
  }

  if (['crypto', 'cryptocurrency'].includes(normalizedCategory)) {
    const pair = clean.endsWith('USDT') ? clean : clean.endsWith('USD') ? `${clean}T` : `${clean}USDT`;
    return `BINANCE:${pair}`;
  }

  if (
    normalizedCategory !== 'commodity' &&
    normalizedCategory !== 'commodities' &&
    (['forex', 'currency', 'currencies'].includes(normalizedCategory) || /^[A-Z]{6}$/.test(clean))
  ) {
    return `FX_IDC:${clean}`;
  }

  const marketExchange = normalizedExchange && normalizedExchange !== 'FX'
    ? normalizedExchange
    : COMMODITY_EXCHANGE[clean];

  return marketExchange ? `${marketExchange}:${clean}` : clean;
}

const globalChartClient = globalThis as typeof globalThis & {
  __tradigloTradingViewChartClient?: any;
};

function getChartClient(): any {
  if (globalChartClient.__tradigloTradingViewChartClient) {
    return globalChartClient.__tradigloTradingViewChartClient;
  }

  const client = new TradingView.Client();
  client.onError((err: any) => {
    console.warn('[tradingview/client] Shared candle client error:', err);
  });
  client.onDisconnected(() => {
    if (globalChartClient.__tradigloTradingViewChartClient === client) {
      globalChartClient.__tradigloTradingViewChartClient = undefined;
    }
  });

  globalChartClient.__tradigloTradingViewChartClient = client;
  return client;
}

export async function fetchTradingViewCandles(
  instrument: TradingViewInstrument,
  interval: string,
  limit: number,
  endTimestamp?: number,
): Promise<TradingViewCandle[]> {
  const market = toTradingViewMarket(instrument);
  const timeframe = TWELVE_TO_TRADINGVIEW_INTERVAL[interval] ?? '1';

  return new Promise((resolve, reject) => {
    const client = getChartClient();
    const chart = new client.Session.Chart();
    let settled = false;
    let debounce: ReturnType<typeof setTimeout> | null = null;

    const finish = (error?: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      if (debounce) clearTimeout(debounce);

      const candles: TradingViewCandle[] = (chart.periods ?? [])
        .map((period: any) => ({
          time: Number(period.time),
          open: Number(period.open),
          high: Number(period.max),
          low: Number(period.min),
          close: Number(period.close),
          volume: Number(period.volume ?? 0),
        }))
        .filter((candle: TradingViewCandle) => (
          Number.isFinite(candle.time)
          && Number.isFinite(candle.open)
          && Number.isFinite(candle.high)
          && Number.isFinite(candle.low)
          && Number.isFinite(candle.close)
        ))
        .sort((a: TradingViewCandle, b: TradingViewCandle) => a.time - b.time);

      try { chart.delete(); } catch {}

      if (error && candles.length === 0) reject(error);
      else resolve(candles);
    };

    const targetCount = Math.min(Math.max(limit, 2), 500);

    const timeout = setTimeout(() => finish(new Error(`TradingView candle request timed out for ${market}`)), REQUEST_TIMEOUT_MS);

    chart.onError((...messages: unknown[]) => {
      finish(new Error(messages.map(String).join(' ')));
    });

    const onClientDisconnect = () => {
      finish(new Error(`TradingView WebSocket disconnected while fetching ${market}`));
    };
    const onClientError = (err: any) => {
      finish(new Error(`TradingView WebSocket transport error while fetching ${market}: ${String(err)}`));
    };

    client.onDisconnected(onClientDisconnect);
    client.onError(onClientError);

    chart.onUpdate(() => {
      const currentCount = chart.periods?.length ?? 0;
      if (currentCount === 0) return;

      if (currentCount >= targetCount) {
        finish();
        return;
      }

      if (debounce) clearTimeout(debounce);
      debounce = setTimeout(() => finish(), 250);
    });

    chart.setMarket(market, {
      timeframe,
      range: targetCount,
      ...(endTimestamp ? { to: endTimestamp } : {}),
    });
  });
}

export async function fetchTradingViewQuotes(
  instruments: TradingViewInstrument[],
): Promise<Array<TradingViewQuote | null>> {
  if (instruments.length === 0) return [];

  return Promise.all(instruments.map((instrument) => getTradingViewQuote(instrument)));
}

interface QuoteSubscription {
  market: any;
  quote: TradingViewQuote | null;
  receivedAt: number;
  lastUsedAt: number;
  waiters: Set<(quote: TradingViewQuote | null) => void>;
}

interface QuoteFeedState {
  client: any;
  session: any;
  subscriptions: Map<string, QuoteSubscription>;
}

const MAX_QUOTE_SUBSCRIPTIONS = 40;
const QUOTE_SUBSCRIPTION_IDLE_TTL_MS = 60_000;

const globalQuoteFeed = globalThis as typeof globalThis & {
  __tradigloTradingViewQuoteFeed?: QuoteFeedState;
};

function evictIdleSubscriptions(feed: QuoteFeedState) {
  const now = Date.now();
  for (const [marketName, sub] of feed.subscriptions.entries()) {
    if (sub.waiters.size === 0 && now - sub.lastUsedAt > QUOTE_SUBSCRIPTION_IDLE_TTL_MS) {
      try {
        sub.market.close();
      } catch {}
      feed.subscriptions.delete(marketName);
    }
  }

  if (feed.subscriptions.size > MAX_QUOTE_SUBSCRIPTIONS) {
    const sorted = [...feed.subscriptions.entries()]
      .filter(([, sub]) => sub.waiters.size === 0)
      .sort((a, b) => a[1].lastUsedAt - b[1].lastUsedAt);

    const toRemoveCount = feed.subscriptions.size - MAX_QUOTE_SUBSCRIPTIONS;
    for (let i = 0; i < Math.min(toRemoveCount, sorted.length); i++) {
      const [marketName, sub] = sorted[i];
      try {
        sub.market.close();
      } catch {}
      feed.subscriptions.delete(marketName);
    }
  }
}

function getQuoteFeed(): QuoteFeedState {
  if (globalQuoteFeed.__tradigloTradingViewQuoteFeed) {
    return globalQuoteFeed.__tradigloTradingViewQuoteFeed;
  }

  const client = new TradingView.Client();
  const session = new client.Session.Quote({
    customFields: ['lp', 'ch', 'chp', 'lp_time'],
  });
  const feed: QuoteFeedState = { client, session, subscriptions: new Map<string, QuoteSubscription>() };

  client.onError((err: any) => {
    console.warn('[tradingview/quote] Quote client transport error:', err);
  });

  client.onDisconnected(() => {
    if (globalQuoteFeed.__tradigloTradingViewQuoteFeed === feed) {
      globalQuoteFeed.__tradigloTradingViewQuoteFeed = undefined;
    }
    for (const sub of feed.subscriptions.values()) {
      sub.waiters.forEach((resolve) => resolve(sub.quote ?? null));
      sub.waiters.clear();
    }
  });

  globalQuoteFeed.__tradigloTradingViewQuoteFeed = feed;
  return feed;
}

function getTradingViewQuote(instrument: TradingViewInstrument): Promise<TradingViewQuote | null> {
  const marketName = toTradingViewMarket(instrument);
  const feed = getQuoteFeed();
  evictIdleSubscriptions(feed);

  let subscription = feed.subscriptions.get(marketName);
  const now = Date.now();

  if (!subscription) {
    const market = new feed.session.Market(marketName);
    subscription = {
      market,
      quote: null,
      receivedAt: 0,
      lastUsedAt: now,
      waiters: new Set(),
    };
    feed.subscriptions.set(marketName, subscription);

    market.onData((data: any) => {
      const price = Number(data.lp);
      const change = Number(data.ch);
      const percentChange = Number(data.chp);
      if (!Number.isFinite(price) || price <= 0 || !Number.isFinite(change) || !Number.isFinite(percentChange)) return;

      const nextQuote: TradingViewQuote = {
        price,
        change,
        percentChange,
        timestamp: Number.isFinite(Number(data.lp_time)) ? Number(data.lp_time) : null,
      };
      const current = feed.subscriptions.get(marketName);
      if (!current) return;
      current.quote = nextQuote;
      current.receivedAt = Date.now();
      current.waiters.forEach((resolve) => resolve(nextQuote));
      current.waiters.clear();
    });

    market.onError(() => {
      const current = feed.subscriptions.get(marketName);
      if (!current) return;
      current.waiters.forEach((resolve) => resolve(null));
      current.waiters.clear();
    });
  } else {
    subscription.lastUsedAt = now;
  }

  if (subscription.quote && Date.now() - subscription.receivedAt < 15_000) {
    return Promise.resolve(subscription.quote);
  }

  return new Promise((resolve) => {
    const done = (quote: TradingViewQuote | null) => {
      clearTimeout(timeout);
      resolve(quote);
    };
    const timeout = setTimeout(() => {
      subscription?.waiters.delete(done);
      resolve(subscription?.quote ?? null);
    }, 6_000);
    subscription?.waiters.add(done);
  });
}
