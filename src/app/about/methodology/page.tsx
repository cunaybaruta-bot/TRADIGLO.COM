import Link from 'next/link';

export default function MethodologyPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="mb-8">
          <Link href="/" className="text-gray-400 hover:text-white text-sm transition-colors">← Back to Home</Link>
        </div>
        <h1 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-500 to-purple-500">Methodology</h1>
        <p className="text-gray-400 text-lg mb-10">How Tradiglo calculates and presents cryptocurrency market data.</p>
        <div className="space-y-8">
          {[
            { title: 'Market Capitalization', content: 'Market cap is calculated by multiplying the current price of a cryptocurrency by its circulating supply. We use circulating supply rather than total supply to reflect the actual market value of coins available for trading.' },
            { title: 'Price Data', content: 'Prices are aggregated from multiple reputable exchanges using a volume-weighted average price (VWAP) methodology. This ensures accurate pricing that reflects actual market conditions across all major trading venues.' },
            { title: 'Volume Data', content: 'Trading volume represents the total value of cryptocurrency traded across all tracked exchanges within a 24-hour period. We apply wash trading filters to remove artificial volume and provide accurate data.' },
            { title: 'Rankings', content: 'Cryptocurrencies are ranked primarily by market capitalization. Assets with incomplete or unverifiable data may be excluded from rankings to maintain data integrity.' },
            { title: 'Historical Data', content: 'Historical price and volume data is sourced from exchange APIs and stored in our database. Data is validated and cleaned before being made available through our platform and API.' },
          ]?.map((section) => (
            <div key={section?.title} className="border border-white/10 rounded-xl p-6">
              <h2 className="text-white font-bold text-lg mb-3">{section?.title}</h2>
              <p className="text-gray-400 text-sm leading-relaxed">{section?.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
