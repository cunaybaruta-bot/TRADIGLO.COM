import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') || 'cryptocurrency';

  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'NEWS_API_KEY not configured' }, { status: 500 });
  }

  const queryMap: Record<string, string> = {
    crypto: 'cryptocurrency OR crypto market',
    bitcoin: 'bitcoin OR BTC',
    ethereum: 'ethereum OR ETH',
    defi: 'DeFi OR decentralized finance',
  };

  const query = queryMap[q] || q;

  try {
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=en&sortBy=publishedAt&pageSize=30&apiKey=${apiKey}`;
    const res = await fetch(url, { next: { revalidate: 300 } }); // cache 5 min
    if (!res.ok) {
      const err = await res.json();
      return NextResponse.json({ error: err.message || 'NewsAPI error' }, { status: res.status });
    }
    const data = await res.json();
    // Filter out removed articles
    const articles = (data.articles || []).filter(
      (a: any) => a.title !== '[Removed]' && a.url && a.title
    );
    return NextResponse.json({ articles });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to fetch news' }, { status: 500 });
  }
}
