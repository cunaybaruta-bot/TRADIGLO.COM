import { NextRequest, NextResponse } from 'next/server';

const RELEVANT_KEYWORDS = [
  'crypto', 'cryptocurrency', 'bitcoin', 'ethereum', 'blockchain', 'defi',
  'altcoin', 'token', 'nft', 'web3', 'binance', 'coinbase', 'solana',
  'ripple', 'xrp', 'litecoin', 'cardano', 'polkadot', 'avalanche',
  'trading', 'trader', 'trade', 'forex', 'stock market', 'stock exchange',
  'financial market', 'market cap', 'bull market', 'bear market',
  'investment', 'investor', 'portfolio', 'hedge fund', 'asset',
  'inflation', 'interest rate', 'federal reserve', 'fed', 'monetary policy',
  'gdp', 'recession', 'economic', 'economy', 'finance', 'financial',
  'nasdaq', 'dow jones', 's&p', 'wall street', 'etf', 'futures',
  'options', 'derivatives', 'liquidity', 'volatility', 'yield',
  'stablecoin', 'usdt', 'usdc', 'exchange', 'wallet', 'mining',
];

function isRelevant(article: any): boolean {
  const text = `${article.title || ''} ${article.description || ''}`.toLowerCase();
  return RELEVANT_KEYWORDS.some((kw) => text.includes(kw));
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') || 'cryptocurrency';

  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'NEWS_API_KEY not configured' }, { status: 500 });
  }

  const queryMap: Record<string, string> = {
    crypto: 'cryptocurrency OR crypto market OR bitcoin OR ethereum',
    bitcoin: 'bitcoin OR BTC',
    ethereum: 'ethereum OR ETH',
    defi: 'DeFi OR decentralized finance',
  };

  const query = queryMap[q] || q;

  try {
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=en&sortBy=publishedAt&pageSize=50&apiKey=${apiKey}`;
    const res = await fetch(url, { next: { revalidate: 300 } }); // cache 5 min
    if (!res.ok) {
      const err = await res.json();
      return NextResponse.json({ error: err.message || 'NewsAPI error' }, { status: res.status });
    }
    const data = await res.json();

    const articles = (data.articles || [])
      // Remove deleted/removed articles
      .filter((a: any) => a.title !== '[Removed]' && a.url && a.title)
      // Only articles with a valid image
      .filter((a: any) => a.urlToImage && a.urlToImage.startsWith('http'))
      // Only articles relevant to crypto/trading/financial markets
      .filter((a: any) => isRelevant(a))
      // Limit to 30 after filtering
      .slice(0, 30);

    return NextResponse.json({ articles });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to fetch news' }, { status: 500 });
  }
}
