import Link from 'next/link';

export default function DisclaimerPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-8">
          <Link href="/" className="text-gray-400 hover:text-white text-sm transition-colors">← Back to Home</Link>
        </div>
        <h1 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-500 to-purple-500">Disclaimer</h1>
        <p className="text-gray-500 text-sm mb-8">Last updated: March 26, 2026</p>
        <div className="space-y-6 text-gray-400 text-sm leading-relaxed">
          <p>All content provided on the Tradiglo website, including but not limited to price data, market analysis, news articles, and educational materials, is for informational purposes only and does not constitute financial, investment, legal, or tax advice.</p>
          <p>Cryptocurrency investments are highly volatile and speculative in nature. The value of cryptocurrencies can increase or decrease significantly in a short period of time. Past performance is not indicative of future results.</p>
          <p>Tradiglo does not recommend or endorse any specific cryptocurrency, exchange, wallet, or investment strategy. Any investment decisions you make are solely your responsibility.</p>
          <p>While we strive to provide accurate and up-to-date information, Tradiglo makes no warranties or representations regarding the accuracy, completeness, or timeliness of the data provided on our platform.</p>
          <p>Tradiglo is not responsible for any losses or damages arising from your use of the information provided on our platform. Always conduct your own research and consult with a qualified financial advisor before making any investment decisions.</p>
          <p>The information on this platform may be subject to change without notice. Tradiglo reserves the right to modify, update, or remove any content at any time.</p>
        </div>
      </div>
    </div>
  );
}
