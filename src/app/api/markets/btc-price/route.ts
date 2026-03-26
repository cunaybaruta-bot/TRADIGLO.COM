import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.TWELVE_DATA_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
  }

  try {
    const url = `https://api.twelvedata.com/price?symbol=BTC/USD&apikey=${apiKey}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
      return NextResponse.json({ error: 'Twelve Data error' }, { status: res.status });
    }
    const data = await res.json();
    const price = parseFloat(data.price);
    if (isNaN(price) || price <= 0) {
      return NextResponse.json({ error: 'Invalid price' }, { status: 502 });
    }
    return NextResponse.json({ price });
  } catch {
    return NextResponse.json({ error: 'Fetch failed' }, { status: 500 });
  }
}
