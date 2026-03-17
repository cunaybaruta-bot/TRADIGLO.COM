'use client';
import React from 'react';

export default function TickerTape() {
  const symbols = [
    { proName: 'BITSTAMP:BTCUSD', title: 'Bitcoin' },
    { proName: 'BITSTAMP:ETHUSD', title: 'Ethereum' },
    { proName: 'BINANCE:SOLUSDT', title: 'Solana' },
    { proName: 'BINANCE:BNBUSDT', title: 'BNB' },
    { proName: 'BITSTAMP:XRPUSD', title: 'XRP' },
    { proName: 'BINANCE:DOGEUSDT', title: 'Dogecoin' },
    { proName: 'BINANCE:ADAUSDT', title: 'Cardano' },
    { proName: 'BINANCE:AVAXUSDT', title: 'Avalanche' },
    { proName: 'BINANCE:DOTUSDT', title: 'Polkadot' },
    { proName: 'BINANCE:LINKUSDT', title: 'Chainlink' },
    { proName: 'BINANCE:UNIUSDT', title: 'Uniswap' },
    { proName: 'BINANCE:ATOMUSDT', title: 'Cosmos' },
    { proName: 'BINANCE:NEARUSDT', title: 'NEAR' },
    { proName: 'BINANCE:APTUSDT', title: 'Aptos' },
    { proName: 'BINANCE:ARBUSDT', title: 'Arbitrum' },
    { proName: 'BINANCE:SUIUSDT', title: 'Sui' },
    { proName: 'BINANCE:INJUSDT', title: 'Injective' },
    { proName: 'BINANCE:TONUSDT', title: 'Toncoin' },
    { proName: 'BINANCE:LTCUSDT', title: 'Litecoin' },
    { proName: 'BINANCE:TRXUSDT', title: 'TRON' },
    { proName: 'FOREXCOM:SPXUSD', title: 'S&P 500' },
    { proName: 'FOREXCOM:NSXUSD', title: 'Nasdaq 100' },
    { proName: 'DJ:DJI', title: 'Dow Jones' },
    { proName: 'TVC:NI225', title: 'Nikkei 225' },
    { proName: 'XETR:DAX', title: 'DAX 40' },
    { proName: 'SPREADEX:FTSE', title: 'FTSE 100' },
    { proName: 'FX_IDC:EURUSD', title: 'EUR/USD' },
    { proName: 'FX_IDC:GBPUSD', title: 'GBP/USD' },
    { proName: 'FX_IDC:USDJPY', title: 'USD/JPY' },
    { proName: 'FX_IDC:AUDUSD', title: 'AUD/USD' },
    { proName: 'FX_IDC:USDCAD', title: 'USD/CAD' },
    { proName: 'FX_IDC:USDCHF', title: 'USD/CHF' },
    { proName: 'FX_IDC:NZDUSD', title: 'NZD/USD' },
    { proName: 'FX_IDC:EURJPY', title: 'EUR/JPY' },
    { proName: 'FX_IDC:GBPJPY', title: 'GBP/JPY' },
    { proName: 'OANDA:XAUUSD', title: 'Gold' },
    { proName: 'OANDA:XAGUSD', title: 'Silver' },
    { proName: 'TVC:USOIL', title: 'Crude Oil WTI' },
    { proName: 'TVC:UKOIL', title: 'Brent Crude' },
    { proName: 'TVC:NATGAS', title: 'Natural Gas' },
    { proName: 'NASDAQ:AAPL', title: 'Apple' },
    { proName: 'NASDAQ:NVDA', title: 'NVIDIA' },
    { proName: 'NASDAQ:TSLA', title: 'Tesla' },
    { proName: 'NASDAQ:MSFT', title: 'Microsoft' },
    { proName: 'NASDAQ:GOOGL', title: 'Alphabet' },
    { proName: 'NASDAQ:AMZN', title: 'Amazon' },
    { proName: 'NASDAQ:META', title: 'Meta' },
    { proName: 'NYSE:JPM', title: 'JPMorgan' },
    { proName: 'NYSE:V', title: 'Visa' },
    { proName: 'NYSE:XOM', title: 'ExxonMobil' },
    { proName: 'NYSE:BAC', title: 'Bank of America' },
    { proName: 'NASDAQ:AMD', title: 'AMD' },
    { proName: 'NASDAQ:NFLX', title: 'Netflix' },
    { proName: 'NYSE:DIS', title: 'Disney' },
    { proName: 'NYSE:NKE', title: 'Nike' },
  ];

  const widgetConfig = {
    symbols,
    showSymbolLogo: true,
    isTransparent: true,
    displayMode: 'adaptive',
    colorTheme: 'dark',
    width: '100%',
    height: 46,
    utm_source: 'canonsite-ap6zk07.public.builtwithrocket.new',
    utm_medium: 'widget',
    utm_campaign: 'ticker-tape',
    'page-uri': 'canonsite-ap6zk07.public.builtwithrocket.new/',
  };

  const encodedConfig = encodeURIComponent(JSON.stringify(widgetConfig));
  const iframeSrc = `https://www.tradingview-widget.com/embed-widget/ticker-tape/?locale=en#${encodedConfig}`;

  return (
    <div
      style={{
        width: '100%',
        background: '#000000',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        overflow: 'hidden',
        height: '46px',
        minHeight: '46px',
        maxHeight: '46px',
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
      }}
    >
      {/* Clip the right edge to hide TradingView branding badge */}
      <div
        style={{
          width: 'calc(100% + 60px)',
          height: '46px',
          overflow: 'hidden',
          position: 'relative',
          flexShrink: 0,
        }}
      >
        <iframe
          scrolling="no"
          allowtransparency="true"
          frameBorder={0}
          src={iframeSrc}
          title="ticker tape TradingView widget"
          lang="en"
          style={{
            userSelect: 'none',
            boxSizing: 'border-box',
            display: 'block',
            height: '46px',
            width: '100%',
            border: 'none',
          }}
        />
      </div>
      {/* Overlay to cover the TradingView badge on the right */}
      <div
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          width: '60px',
          height: '100%',
          background: '#000000',
          zIndex: 10,
        }}
      />
    </div>
  );
}
