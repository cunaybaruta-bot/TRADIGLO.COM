'use client';
import React, { useState, useEffect } from 'react';

interface TickerItem {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change: number;
  image: string;
}

export default function TickerTape() {
  const [items, setItems] = useState<TickerItem[]>([]);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const ids = 'bitcoin,ethereum,binancecoin,solana,ripple,cardano,dogecoin,tether,avalanche-2,chainlink,uniswap,cosmos,near,aptos,arbitrum';
        const res = await fetch(
          `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&per_page=15&page=1&sparkline=false&price_change_percentage=24h`
        );
        if (!res.ok) return;
        const data = await res.json();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setItems(data.map((c: any) => ({
          id: c.id,
          symbol: c.symbol.toUpperCase(),
          name: c.name,
          price: c.current_price,
          change: c.price_change_percentage_24h,
          image: c.image,
        })));
      } catch {
        // silently fail
      }
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 60000);
    return () => clearInterval(interval);
  }, []);

  if (items.length === 0) return null;

  const doubled = [...items, ...items];

  return (
    <div
      style={{
        width: '100%',
        background: 'rgba(0,0,0,0.95)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        overflow: 'hidden',
        height: '44px',
        minHeight: '44px',
        maxHeight: '44px',
        position: 'relative',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          height: '100%',
          whiteSpace: 'nowrap',
          animation: 'ticker-scroll 50s linear infinite',
          width: 'max-content',
        }}
      >
        {doubled.map((item, idx) => (
          <span
            key={`${item.id}-${idx}`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '0 20px', flexShrink: 0 }}
          >
            <img
              src={item.image}
              alt={item.symbol}
              width={18}
              height={18}
              style={{ width: 18, height: 18, objectFit: 'contain', borderRadius: 2 }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px', fontWeight: 600, letterSpacing: '0.05em' }}>{item.symbol}</span>
            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>
              ${item.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span
              style={{ fontSize: '12px', fontWeight: 500, color: item.change >= 0 ? '#22c55e' : '#ef4444' }}
            >
              {item.change >= 0 ? '+' : ''}{item.change?.toFixed(2)}%
            </span>
            <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '12px', marginLeft: '8px' }}>|</span>
          </span>
        ))}
      </div>

      <style>{`
        @keyframes ticker-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
