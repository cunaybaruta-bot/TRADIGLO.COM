import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// ─── Types ───────────────────────────────────────────────────────────────────

interface BinanceTicker {
  s: string;  // symbol e.g. BTCUSDT
  c: string;  // last price
  P: string;  // 24h price change percent
  v: string;  // 24h volume (base)
  h: string;  // 24h high
  l: string;  // 24h low
  q: string;  // 24h quote volume
}

interface MarketPriceUpsert {
  asset_id: string;
  price: number;
  price_change_pct_24h: number;
  volume_24h: number;
  high_24h: number;
  low_24h: number;
  timestamp: string;
}

export interface PriceEngineStatus {
  connected: boolean;
  lastUpdate: string | null;
  updatesPerSecond: number;
  assetsTracked: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const BINANCE_WS_URL = 'wss://stream.binance.com:9443/ws/!ticker@arr';
const CACHE_REFRESH_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes
const UPSERT_INTERVAL_MS = 2000;                   // 2 seconds
const RECONNECT_BASE_DELAY_MS = 3000;              // 3 seconds base
const RECONNECT_MAX_DELAY_MS = 30000;              // 30 seconds max
const USDT_SUFFIX = 'USDT';

// ─── Supabase client (service-level, no cookie context needed) ───────────────

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error('[PriceEngine] Missing Supabase URL or key in environment variables');
  }
  return createSupabaseClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// ─── Engine State ─────────────────────────────────────────────────────────────

let ws: WebSocket | null = null;
let isRunning = false;
let isConnected = false;
let reconnectAttempts = 0;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let upsertTimer: ReturnType<typeof setInterval> | null = null;
let cacheRefreshTimer: ReturnType<typeof setInterval> | null = null;

let lastUpdate: string | null = null;
let updateCount = 0;
let updateCountWindow = 0;
let updatesPerSecond = 0;
let upsPerSecTimer: ReturnType<typeof setInterval> | null = null;

// In-memory caches
const assetCache = new Map<string, string>(); // symbol → asset_id
const pendingUpdates = new Map<string, MarketPriceUpsert>(); // asset_id → latest data

// ─── Asset Cache ─────────────────────────────────────────────────────────────

async function refreshAssetCache(): Promise<void> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('assets')
      .select('id, symbol')
      .eq('is_active', true);

    if (error) {
      console.error('[PriceEngine] Failed to refresh asset cache:', error.message);
      return;
    }

    assetCache.clear();
    for (const row of data ?? []) {
      assetCache.set((row.symbol as string).toUpperCase(), row.id as string);
    }
    console.log(`[PriceEngine] Asset cache refreshed — ${assetCache.size} active assets loaded`);
  } catch (err) {
    console.error('[PriceEngine] Asset cache refresh error:', err);
  }
}

// ─── Symbol Normalization ─────────────────────────────────────────────────────

function normalizeSymbol(binanceSymbol: string): string | null {
  if (!binanceSymbol.endsWith(USDT_SUFFIX)) return null;
  return binanceSymbol.slice(0, -USDT_SUFFIX.length); // e.g. BTCUSDT → BTC
}

// ─── Batch Upsert ─────────────────────────────────────────────────────────────

async function flushPendingUpdates(): Promise<void> {
  if (pendingUpdates.size === 0) return;

  const batch = Array.from(pendingUpdates.values());
  pendingUpdates.clear();

  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('market_prices')
      .upsert(batch, { onConflict: 'asset_id' });

    if (error) {
      console.error(`[PriceEngine] Upsert error: ${error.message}`);
    } else {
      lastUpdate = new Date().toISOString();
      console.log(`[PriceEngine] Upserted ${batch.length} market price records`);
    }
  } catch (err) {
    console.error('[PriceEngine] Flush error:', err);
  }
}

// ─── WebSocket Message Handler ────────────────────────────────────────────────

function handleMessage(raw: string): void {
  let tickers: BinanceTicker[];
  try {
    tickers = JSON.parse(raw);
  } catch {
    return; // Ignore malformed JSON
  }

  if (!Array.isArray(tickers)) return;

  const now = new Date().toISOString();
  let matched = 0;

  for (const ticker of tickers) {
    const base = normalizeSymbol(ticker.s);
    if (!base) continue;

    const assetId = assetCache.get(base);
    if (!assetId) continue;

    pendingUpdates.set(assetId, {
      asset_id: assetId,
      price: parseFloat(ticker.c),
      price_change_pct_24h: parseFloat(ticker.P),
      volume_24h: parseFloat(ticker.v),
      high_24h: parseFloat(ticker.h),
      low_24h: parseFloat(ticker.l),
      timestamp: now,
    });
    matched++;
  }

  if (matched > 0) {
    updateCount += matched;
    updateCountWindow += matched;
  }
}

// ─── WebSocket Connection ─────────────────────────────────────────────────────

function connect(): void {
  if (!isRunning) return;

  console.log(`[PriceEngine] Connecting to Binance WebSocket (attempt ${reconnectAttempts + 1})...`);

  try {
    ws = new WebSocket(BINANCE_WS_URL);
  } catch (err) {
    console.error('[PriceEngine] Failed to create WebSocket:', err);
    scheduleReconnect();
    return;
  }

  ws.onopen = () => {
    isConnected = true;
    reconnectAttempts = 0;
    console.log('[PriceEngine] Connected to Binance WebSocket stream');
  };

  ws.onmessage = (event: MessageEvent) => {
    handleMessage(event.data as string);
  };

  ws.onerror = (event: Event) => {
    console.error('[PriceEngine] WebSocket error:', event);
  };

  ws.onclose = (event: CloseEvent) => {
    isConnected = false;
    console.warn(`[PriceEngine] WebSocket closed (code: ${event.code}, reason: ${event.reason || 'none'})`);
    if (isRunning) {
      scheduleReconnect();
    }
  };
}

function scheduleReconnect(): void {
  if (!isRunning) return;
  if (reconnectTimer) return; // already scheduled

  const delay = Math.min(
    RECONNECT_BASE_DELAY_MS * Math.pow(2, reconnectAttempts),
    RECONNECT_MAX_DELAY_MS
  );
  reconnectAttempts++;
  console.log(`[PriceEngine] Reconnecting in ${delay}ms (attempt ${reconnectAttempts})...`);

  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connect();
  }, delay);
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function startPriceEngine(): Promise<void> {
  if (isRunning) {
    console.log('[PriceEngine] Already running');
    return;
  }

  console.log('[PriceEngine] Starting...');
  isRunning = true;
  reconnectAttempts = 0;

  // Load asset cache on startup
  await refreshAssetCache();

  // Refresh cache every 10 minutes
  cacheRefreshTimer = setInterval(refreshAssetCache, CACHE_REFRESH_INTERVAL_MS);

  // Flush pending updates every 2 seconds
  upsertTimer = setInterval(flushPendingUpdates, UPSERT_INTERVAL_MS);

  // Track updates per second
  upsPerSecTimer = setInterval(() => {
    updatesPerSecond = Math.round(updateCountWindow / 5);
    updateCountWindow = 0;
  }, 5000);

  // Connect to Binance
  connect();

  console.log('[PriceEngine] Started successfully');
}

export function stopPriceEngine(): void {
  if (!isRunning) {
    console.log('[PriceEngine] Not running');
    return;
  }

  console.log('[PriceEngine] Stopping...');
  isRunning = false;
  isConnected = false;

  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  if (upsertTimer) {
    clearInterval(upsertTimer);
    upsertTimer = null;
  }
  if (cacheRefreshTimer) {
    clearInterval(cacheRefreshTimer);
    cacheRefreshTimer = null;
  }
  if (upsPerSecTimer) {
    clearInterval(upsPerSecTimer);
    upsPerSecTimer = null;
  }

  if (ws) {
    ws.onclose = null; // prevent reconnect on manual close
    ws.close();
    ws = null;
  }

  pendingUpdates.clear();
  assetCache.clear();
  console.log('[PriceEngine] Stopped');
}

export function getPriceEngineStatus(): PriceEngineStatus {
  return {
    connected: isConnected,
    lastUpdate,
    updatesPerSecond,
    assetsTracked: assetCache.size,
  };
}
