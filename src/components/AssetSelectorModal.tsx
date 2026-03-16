'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AssetItem {
  id: string;
  symbol: string;
  name: string;
  category: string;
}

interface AssetWithPrice extends AssetItem {
  price: number | null;
  change24h: number | null;
  changePct24h: number | null;
}

interface AssetSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  assets: AssetItem[];
  selectedAsset: AssetItem | null;
  onSelectAsset: (asset: AssetItem) => void;
}

// ─── Category Tabs ────────────────────────────────────────────────────────────

const MODAL_CATEGORIES = ['Currencies', 'Crypto', 'Commodities', 'Stocks'] as const;
type ModalCategory = typeof MODAL_CATEGORIES[number];

const CATEGORY_MAP: Record<ModalCategory, string[]> = {
  Currencies: ['forex', 'currency', 'currencies'],
  Crypto: ['crypto', 'cryptocurrency'],
  Commodities: ['commodity', 'commodities'],
  Stocks: ['stock', 'stocks', 'equity'],
};

// ─── Crypto symbol map for Binance ───────────────────────────────────────────

function getCryptoIconSymbol(symbol: string): string {
  return symbol
    .replace('USDT', '')
    .replace('USD', '')
    .replace('/USD', '')
    .toLowerCase();
}

function getBinanceSymbol(symbol: string): string {
  const s = symbol.replace('/', '').toUpperCase();
  if (s.endsWith('USDT') || s.endsWith('USD')) return s.endsWith('USDT') ? s : s.replace('USD', 'USDT');
  return s + 'USDT';
}

function isCrypto(category: string): boolean {
  return CATEGORY_MAP.Crypto.includes(category.toLowerCase());
}

// ─── Asset Icon ───────────────────────────────────────────────────────────────

function AssetIcon({ symbol, category, size = 28 }: { symbol: string; category: string; size?: number }) {
  const [imgError, setImgError] = useState(false);
  const iconSymbol = getCryptoIconSymbol(symbol);

  if (isCrypto(category) && !imgError) {
    return (
      <img
        src={`https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/32/color/${iconSymbol}.png`}
        alt={symbol}
        width={size}
        height={size}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover' }}
        onError={() => setImgError(true)}
      />
    );
  }

  // Fallback: colored circle with initials
  const colors: Record<string, string> = {
    forex: '#3b82f6',
    currency: '#3b82f6',
    currencies: '#3b82f6',
    stock: '#f59e0b',
    stocks: '#f59e0b',
    equity: '#f59e0b',
    commodity: '#10b981',
    commodities: '#10b981',
  };
  const bg = colors[category.toLowerCase()] ?? '#6366f1';
  const initials = symbol.replace('USDT', '').replace('/USD', '').slice(0, 2).toUpperCase();

  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.35, fontWeight: 700, color: '#fff', flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

export default function AssetSelectorModal({
  isOpen,
  onClose,
  assets,
  selectedAsset,
  onSelectAsset,
}: AssetSelectorModalProps) {
  const [activeTab, setActiveTab] = useState<ModalCategory>('Currencies');
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('asset_favorites');
        return stored ? new Set(JSON.parse(stored)) : new Set();
      } catch { return new Set(); }
    }
    return new Set();
  });
  const [assetPrices, setAssetPrices] = useState<Map<string, { price: number | null; change24h: number | null; changePct24h: number | null }>>(new Map());
  const [visible, setVisible] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // ── Animation ──────────────────────────────────────────────────────────────

  useEffect(() => {
    if (isOpen) {
      setVisible(false);
      const t = setTimeout(() => {
        setVisible(true);
        setTimeout(() => searchInputRef.current?.focus(), 100);
      }, 10);
      return () => clearTimeout(t);
    } else {
      setVisible(false);
    }
  }, [isOpen]);

  // ── Filtered assets ────────────────────────────────────────────────────────

  const filteredAssets = assets.filter((a) => {
    const catMatch = CATEGORY_MAP[activeTab]?.includes(a.category.toLowerCase()) ?? false;
    const q = searchQuery.toLowerCase();
    const searchMatch = !q || a.symbol.toLowerCase().includes(q) || a.name.toLowerCase().includes(q);
    return catMatch && searchMatch;
  });

  // ── Binance WebSocket for crypto ───────────────────────────────────────────

  const startBinanceWS = useCallback((cryptoAssets: AssetItem[]) => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (cryptoAssets.length === 0) return;

    const streams = cryptoAssets.map((a) => `${getBinanceSymbol(a.symbol).toLowerCase()}@ticker`).join('/');
    const url = `wss://stream.binance.com:9443/stream?streams=${streams}`;

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          const data = msg.data ?? msg;
          if (!data?.s) return;

          const binanceSymbol = data.s.toUpperCase();
          const asset = cryptoAssets.find((a) => getBinanceSymbol(a.symbol).toUpperCase() === binanceSymbol);
          if (!asset) return;

          const price = parseFloat(data.c);
          const changePct = parseFloat(data.P);
          const priceChange = parseFloat(data.p);

          setAssetPrices((prev) => {
            const next = new Map(prev);
            next.set(asset.symbol, { price, change24h: priceChange, changePct24h: changePct });
            return next;
          });
        } catch {}
      };

      ws.onerror = () => {};
      ws.onclose = () => {};
    } catch {}
  }, []);

  // ── Twelve Data polling for non-crypto ────────────────────────────────────

  const startTwelveDataPolling = useCallback((nonCryptoAssets: AssetItem[]) => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    if (nonCryptoAssets.length === 0) return;

    const apiKey = process.env.NEXT_PUBLIC_TWELVE_DATA_API_KEY;
    if (!apiKey) return;

    const fetchPrices = async () => {
      // Batch up to 8 symbols per request
      const batches: AssetItem[][] = [];
      for (let i = 0; i < nonCryptoAssets.length; i += 8) {
        batches.push(nonCryptoAssets.slice(i, i + 8));
      }

      for (const batch of batches) {
        const symbols = batch.map((a) => a.symbol).join(',');
        try {
          const res = await fetch(
            `https://api.twelvedata.com/quote?symbol=${encodeURIComponent(symbols)}&apikey=${apiKey}`
          );
          if (!res.ok) continue;
          const json = await res.json();

          // Handle single vs multiple response
          const entries = batch.length === 1
            ? [{ symbol: batch[0].symbol, data: json }]
            : batch.map((a) => ({ symbol: a.symbol, data: json[a.symbol] }));

          for (const { symbol, data } of entries) {
            if (!data || data.status === 'error') continue;
            const price = parseFloat(data.close ?? data.price ?? '0');
            const change = parseFloat(data.change ?? '0');
            const changePct = parseFloat(data.percent_change ?? '0');
            if (!isNaN(price) && price > 0) {
              setAssetPrices((prev) => {
                const next = new Map(prev);
                next.set(symbol, { price, change24h: change, changePct24h: changePct });
                return next;
              });
            }
          }
        } catch {}
      }
    };

    fetchPrices();
    pollingRef.current = setInterval(fetchPrices, 5000);
  }, []);

  // ── Start/stop price feeds when modal opens ────────────────────────────────

  useEffect(() => {
    if (!isOpen) {
      wsRef.current?.close();
      wsRef.current = null;
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      return;
    }

    const cryptoAssets = assets.filter((a) => isCrypto(a.category));
    const nonCryptoAssets = assets.filter((a) => !isCrypto(a.category));

    startBinanceWS(cryptoAssets);
    startTwelveDataPolling(nonCryptoAssets);

    return () => {
      wsRef.current?.close();
      wsRef.current = null;
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [isOpen, assets, startBinanceWS, startTwelveDataPolling]);

  // ── Favorites ──────────────────────────────────────────────────────────────

  const toggleFavorite = (e: React.MouseEvent, symbol: string) => {
    e.stopPropagation();
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(symbol)) next.delete(symbol);
      else next.add(symbol);
      try { localStorage.setItem('asset_favorites', JSON.stringify([...next])); } catch {}
      return next;
    });
  };

  // ── Handle select ──────────────────────────────────────────────────────────

  const handleSelect = (asset: AssetItem) => {
    onSelectAsset(asset);
    onClose();
  };

  // ── Handle close ──────────────────────────────────────────────────────────

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 200);
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={handleClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: visible ? 'rgba(0,0,0,0.75)' : 'rgba(0,0,0,0)',
        backdropFilter: visible ? 'blur(4px)' : 'blur(0px)',
        transition: 'background 200ms ease, backdrop-filter 200ms ease',
        padding: '0',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#141414',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 12,
          width: '100%',
          maxWidth: 580,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 24px 80px rgba(0,0,0,0.9)',
          opacity: visible ? 1 : 0,
          transform: visible ? 'scale(1) translateY(0)' : 'scale(0.94) translateY(16px)',
          transition: 'opacity 200ms ease-out, transform 200ms cubic-bezier(0.22,1,0.36,1)',
          margin: '0 12px',
        }}
      >
        {/* ── Header ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px 14px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          flexShrink: 0,
        }}>
          <span style={{ color: '#fff', fontSize: 16, fontWeight: 700 }}>Select trade pair</span>
          <button
            onClick={handleClose}
            style={{
              width: 28, height: 28, borderRadius: 6,
              background: 'rgba(255,255,255,0.08)',
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#94a3b8', transition: 'background 150ms',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* ── Category Tabs ── */}
        <div style={{
          display: 'flex', gap: 4, padding: '12px 20px 0',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          flexShrink: 0, overflowX: 'auto',
        }}>
          {MODAL_CATEGORIES.map((tab) => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setSearchQuery(''); }}
              style={{
                padding: '7px 14px',
                borderRadius: '6px 6px 0 0',
                border: 'none',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600,
                whiteSpace: 'nowrap',
                transition: 'all 150ms',
                background: activeTab === tab ? '#2563eb' : 'transparent',
                color: activeTab === tab ? '#fff' : '#64748b',
                marginBottom: -1,
                borderBottom: activeTab === tab ? '2px solid #2563eb' : '2px solid transparent',
              }}
              onMouseEnter={(e) => {
                if (activeTab !== tab) e.currentTarget.style.color = '#cbd5e1';
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab) e.currentTarget.style.color = '#64748b';
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* ── Search Row ── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '12px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          flexShrink: 0,
        }}>
          {/* Favorites count badge */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '6px 10px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8,
            flexShrink: 0,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" strokeWidth="1.5">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            <span style={{ color: '#94a3b8', fontSize: 12, fontWeight: 600 }}>{favorites.size}</span>
          </div>

          {/* Search input */}
          <div style={{ flex: 1, position: 'relative' }}>
            <svg
              style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }}
              width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
                padding: '8px 10px 8px 32px',
                color: '#fff',
                fontSize: 13,
                outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(59,130,246,0.5)')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
            />
          </div>
        </div>

        {/* ── Column Headers ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '32px 1fr 100px 80px',
          gap: 0,
          padding: '8px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          flexShrink: 0,
        }}>
          <div />
          <span style={{ color: '#475569', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Name</span>
          <span style={{ color: '#475569', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'right' }}>24h Change</span>
          <span style={{ color: '#475569', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'right' }}>Payout</span>
        </div>

        {/* ── Asset List ── */}
        <div style={{ flex: 1, overflowY: 'auto', overscrollBehavior: 'contain' }}>
          {filteredAssets.length === 0 ? (
            <div style={{ padding: '32px 20px', textAlign: 'center', color: '#475569', fontSize: 13 }}>
              No assets found
            </div>
          ) : (
            filteredAssets.map((asset) => {
              const priceData = assetPrices.get(asset.symbol);
              const isActive = selectedAsset?.id === asset.id;
              const isFav = favorites.has(asset.symbol);
              const changePct = priceData?.changePct24h ?? null;
              const isPositive = changePct !== null && changePct >= 0;

              return (
                <div
                  key={asset.id}
                  onClick={() => handleSelect(asset)}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '32px 1fr 100px 80px',
                    alignItems: 'center',
                    padding: '10px 20px',
                    cursor: 'pointer',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    background: isActive ? 'rgba(37,99,235,0.12)' : 'transparent',
                    transition: 'background 120ms',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  {/* Favorite star */}
                  <button
                    onClick={(e) => toggleFavorite(e, asset.symbol)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: isFav ? '#f59e0b' : '#334155',
                      transition: 'color 150ms',
                    }}
                    onMouseEnter={(e) => { if (!isFav) e.currentTarget.style.color = '#64748b'; }}
                    onMouseLeave={(e) => { if (!isFav) e.currentTarget.style.color = '#334155'; }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill={isFav ? '#f59e0b' : 'none'} stroke="currentColor" strokeWidth="1.8">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  </button>

                  {/* Asset name + icon */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <AssetIcon symbol={asset.symbol} category={asset.category} size={28} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ color: '#fff', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>
                          {asset.symbol.replace('USDT', '').replace('/USD', '')}
                        </span>
                        {isActive && (
                          <span style={{
                            fontSize: 9, fontWeight: 700, letterSpacing: '0.06em',
                            color: '#2563eb', background: 'rgba(37,99,235,0.2)',
                            border: '1px solid rgba(37,99,235,0.4)',
                            padding: '1px 5px', borderRadius: 3,
                          }}>
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <span style={{ color: '#475569', fontSize: 11, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block', maxWidth: 140 }}>
                        {asset.name}
                      </span>
                    </div>
                  </div>

                  {/* 24h Change */}
                  <div style={{ textAlign: 'right' }}>
                    {changePct !== null ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 3 }}>
                        {isPositive ? (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="18 15 12 9 6 15" />
                          </svg>
                        ) : (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        )}
                        <span style={{
                          fontSize: 12, fontWeight: 600,
                          color: isPositive ? '#10b981' : '#ef4444',
                        }}>
                          {isPositive ? '+' : ''}{changePct.toFixed(2)}%
                        </span>
                      </div>
                    ) : (
                      <span style={{ color: '#334155', fontSize: 12 }}>—</span>
                    )}
                  </div>

                  {/* Payout */}
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ color: '#f59e0b', fontSize: 13, fontWeight: 700 }}>95%</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .asset-modal-container {
            margin: 0 !important;
            max-width: 100vw !important;
            height: 100dvh !important;
            max-height: 100dvh !important;
            border-radius: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
