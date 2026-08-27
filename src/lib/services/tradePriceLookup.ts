// ─── Trade settlement price lookup ─────────────────────────────────────────
//
// Root-cause fix: closing a trade used to read chartRef.current.getCurrentPrice()
// — whatever instrument the trading chart happened to be displaying at that
// exact moment — and applied it to EVERY trade being closed, regardless of
// that trade's own asset. If the chart was showing a different symbol (or
// "Close All" spanned multiple assets), trades were settled against the
// wrong instrument's price entirely.
//
// getLivePriceForSymbol() resolves the current price for one SPECIFIC asset
// symbol, independent of whatever is on screen, so a trade is always closed
// against its own instrument's price.

const CRYPTO_SYMBOLS = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA', 'DOGE', 'AVAX', 'DOT', 'MATIC'];

// Free real-time proxy feeds — same mapping used by the chart component.
// XAUUSD -> PAXG (Pax Gold, backed 1:1 by physical gold, tracks spot XAU/USD)
// so gold trades settle against a real live tick instead of a simulated price.
const BINANCE_PROXY_SYMBOLS: Record<string, string> = {
  XAUUSD: 'PAXGUSDT',
};

// Only spot metals have a verified Twelve Data adapter in this application.
// Native futures tickers must be resolved by their exchange-aware data source,
// never converted into a fictional USD pair.
const COMMODITY_MAP: Record<string, string> = {
  XAUUSD: 'XAU/USD',
  XAGUSD: 'XAG/USD',
};

// Commodity tickers with a verified TradingView mapping (see
// LEGACY_COMMODITY_MARKET in tradingViewMarket.ts). Several of these are
// exactly 6 letters (NATGAS, COFFEE, COTTON, LUMBER, NICKEL, COPPER) and must
// never be sliced into a fictional 6-char currency pair like "NAT/GAS".
const COMMODITY_SYMBOLS = new Set([
  'ALUMINUM', 'ALUMINIUM', 'COCOA', 'COFFEE', 'COPPER', 'CORN', 'COTTON',
  'LUMBER', 'NATGAS', 'NGAS', 'NICKEL', 'PALLADIUM', 'PLATINUM', 'SOYBEAN',
  'SUGAR', 'WHEAT', 'ZINC',
]);

function isCommoditySymbol(symbol: string): boolean {
  const s = symbol.toUpperCase();
  return !!COMMODITY_MAP[s] || COMMODITY_SYMBOLS.has(s);
}

// Same reference base prices used by the chart's synthetic fallback — kept
// only as a last-resort anchor when no live feed is reachable for this
// symbol, so a trade can still always be closed.
const FOREX_BASE_PRICES: Record<string, number> = {
  'AUD/CAD': 0.8950, 'AUD/CHF': 0.5720, 'AUD/JPY': 98.50, 'AUD/NZD': 1.0820,
  'AUD/USD': 0.6480, 'EUR/AUD': 1.6550, 'EUR/CAD': 1.5620, 'EUR/CHF': 0.9420,
  'EUR/GBP': 0.8560, 'EUR/JPY': 162.40, 'EUR/NZD': 1.7980, 'EUR/USD': 1.0850,
  'GBP/AUD': 1.9340, 'GBP/CAD': 1.8240, 'GBP/CHF': 1.1020, 'GBP/JPY': 189.80,
  'GBP/NZD': 2.1020, 'GBP/USD': 1.2680, 'NZD/CAD': 0.8270, 'NZD/CHF': 0.5280,
  'NZD/JPY': 90.80, 'NZD/USD': 0.5980, 'USD/CAD': 1.3620, 'USD/CHF': 0.8840,
  'USD/JPY': 149.80, 'USD/MXN': 17.20, 'USD/SGD': 1.3420, 'USD/ZAR': 18.60,
  'XAU/USD': 3300.0, 'XAG/USD': 32.50, 'XPT/USD': 980.0, 'XPD/USD': 1050.0,
  'WTI/USD': 78.50, 'BRENT/USD': 82.20, 'NATGAS/USD': 2.85,
  'XCU/USD': 4.50, 'XAL/USD': 2450.0, 'XZN/USD': 2800.0, 'XNI/USD': 16500.0,
  'WHEAT/USD': 540.0, 'CORN/USD': 440.0, 'SOYBEAN/USD': 1180.0,
  'SUGAR/USD': 19.50, 'COFFEE/USD': 185.0, 'COCOA/USD': 8500.0,
  'COTTON/USD': 78.0, 'LUMBER/USD': 520.0,
};

function baseSymbol(symbol: string): string {
  return symbol.toUpperCase().replace('/', '').replace('USDT', '').replace('USD', '');
}

function isCryptoSymbol(symbol: string): boolean {
  return CRYPTO_SYMBOLS.includes(baseSymbol(symbol)) || !!BINANCE_PROXY_SYMBOLS[symbol.toUpperCase()];
}

function toBinanceSymbol(symbol: string): string {
  const clean = symbol.replace('/', '').toUpperCase();
  if (BINANCE_PROXY_SYMBOLS[clean]) return BINANCE_PROXY_SYMBOLS[clean];
  return clean.endsWith('USDT') ? clean : `${clean}USDT`;
}

function toTwelveDataSymbol(symbol: string): string {
  const s = symbol.toUpperCase();
  if (COMMODITY_MAP[s]) return COMMODITY_MAP[s];
  if (COMMODITY_SYMBOLS.has(s)) return s;
  if (s.length === 6 && /^[A-Z]{6}$/.test(s)) return `${s.slice(0, 3)}/${s.slice(3)}`;
  if (s.includes('/')) return s;
  return s;
}

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal, cache: 'no-store' });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Resolves the current price for one specific asset symbol.
 * Returns a verified live price for the requested instrument or throws. A
 * settlement must never silently use a reference/synthetic price.
 */
export async function getLivePriceForSymbol(symbol: string): Promise<number> {
  if (isCryptoSymbol(symbol)) {
    try {
      const binanceSym = toBinanceSymbol(symbol);
      // Same dual-endpoint resilience the chart already relies on for
      // candles: api.binance.com can be geo-blocked/flaky for some
      // networks, so race it against Binance's public data mirror instead
      // of failing straight to the last-resort anchor below.
      const urls = [
        `https://api.binance.com/api/v3/ticker/price?symbol=${binanceSym}`,
        `https://data-api.binance.vision/api/v3/ticker/price?symbol=${binanceSym}`,
      ];
      const price = await Promise.any(
        urls.map(async (url) => {
          const res = await fetchWithTimeout(url, 5000);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = await res.json();
          const p = parseFloat(data.price);
          if (!Number.isFinite(p) || p <= 0) throw new Error('Invalid price');
          return p;
        })
      );
      return price;
    } catch {
      // Fall through to the provider error below.
    }
  } else {
    try {
      const tdSymbol = toTwelveDataSymbol(symbol);
      const params = new URLSearchParams({ symbol: tdSymbol, interval: '1min', outputsize: '1' });
      if (isCommoditySymbol(symbol)) params.set('category', 'commodity');
      const res = await fetchWithTimeout(
        `/api/twelvedata/timeseries?${params.toString()}`,
        8000
      );
      if (res.ok) {
        const json = await res.json();
        const latest = json?.values?.[0];
        const price = latest ? parseFloat(latest.close) : NaN;
        if (Number.isFinite(price) && price > 0) return price;
      }
    } catch {
      // Fall through to the provider error below.
    }
  }

  throw new Error(`Live market data is unavailable for ${symbol}. Trade settlement was not attempted.`);
}
