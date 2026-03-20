import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const res = await fetch(
      'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=1&sparkline=false&price_change_percentage=7d',
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0',
        },
        next: { revalidate: 60 },
      }
    );

    if (!res.ok) {
      // Fallback: try CoinCap API
      const fallback = await fetch(
        'https://api.coincap.io/v2/assets?limit=250',
        { next: { revalidate: 60 } }
      );
      if (!fallback.ok) throw new Error('Both APIs failed');
      const fallbackData = await fallback.json();
      // Normalize CoinCap data to match CoinGecko shape
      const normalized = (fallbackData.data || []).map((c: any, i: number) => ({
        id: c.id,
        symbol: c.symbol?.toLowerCase(),
        name: c.name,
        image: `https://assets.coincap.io/assets/icons/${c.symbol?.toLowerCase()}@2x.png`,
        current_price: parseFloat(c.priceUsd) || 0,
        market_cap: parseFloat(c.marketCapUsd) || 0,
        market_cap_rank: i + 1,
        total_volume: parseFloat(c.volumeUsd24Hr) || 0,
        price_change_percentage_24h: parseFloat(c.changePercent24Hr) || 0,
        high_24h: 0,
        low_24h: 0,
        circulating_supply: parseFloat(c.supply) || 0,
      }));
      return NextResponse.json(normalized);
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    // Last resort: try CoinCap
    try {
      const fallback = await fetch('https://api.coincap.io/v2/assets?limit=250');
      const fallbackData = await fallback.json();
      const normalized = (fallbackData.data || []).map((c: any, i: number) => ({
        id: c.id,
        symbol: c.symbol?.toLowerCase(),
        name: c.name,
        image: `https://assets.coincap.io/assets/icons/${c.symbol?.toLowerCase()}@2x.png`,
        current_price: parseFloat(c.priceUsd) || 0,
        market_cap: parseFloat(c.marketCapUsd) || 0,
        market_cap_rank: i + 1,
        total_volume: parseFloat(c.volumeUsd24Hr) || 0,
        price_change_percentage_24h: parseFloat(c.changePercent24Hr) || 0,
        high_24h: 0,
        low_24h: 0,
        circulating_supply: parseFloat(c.supply) || 0,
      }));
      return NextResponse.json(normalized);
    } catch {
      return NextResponse.json({ error: err.message || 'Failed to fetch data' }, { status: 500 });
    }
  }
}
