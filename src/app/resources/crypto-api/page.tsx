import Link from 'next/link';

export default function CryptoAPIPage() {
  const endpoints = [
    { method: 'GET', path: '/api/v1/markets', desc: 'Get all market data' },
    { method: 'GET', path: '/api/v1/markets/:id', desc: 'Get specific asset data' },
    { method: 'GET', path: '/api/v1/prices', desc: 'Get current prices' },
    { method: 'GET', path: '/api/v1/news', desc: 'Get latest crypto news' },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="mb-8">
          <Link href="/" className="text-gray-400 hover:text-white text-sm transition-colors">← Back to Home</Link>
        </div>
        <h1 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-500 to-purple-500">Crypto API</h1>
        <p className="text-gray-400 text-lg mb-8">Access real-time and historical cryptocurrency data through our powerful API.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {['Free Tier', 'Pro', 'Enterprise']?.map((plan, i) => (
            <div key={plan} className={`border rounded-xl p-6 ${i === 1 ? 'border-blue-500/50 bg-blue-900/10' : 'border-white/10'}`}>
              <h3 className="text-white font-bold text-lg mb-2">{plan}</h3>
              <p className="text-gray-400 text-sm mb-4">{i === 0 ? '10,000 calls/month' : i === 1 ? '1M calls/month' : 'Unlimited'}</p>
              <p className="text-2xl font-bold text-white mb-4">{i === 0 ? 'Free' : i === 1 ? '$79/mo' : 'Custom'}</p>
              <button className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${i === 1 ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'border border-white/20 hover:border-white/40 text-gray-300'}`}>
                {i === 2 ? 'Contact Us' : 'Get Started'}
              </button>
            </div>
          ))}
        </div>
        <h2 className="text-xl font-bold mb-4">API Endpoints</h2>
        <div className="border border-white/10 rounded-xl overflow-hidden">
          {endpoints?.map((ep, i) => (
            <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
              <span className="text-xs font-mono font-bold text-green-400 bg-green-900/30 px-2 py-1 rounded">{ep?.method}</span>
              <span className="text-blue-400 font-mono text-sm flex-1">{ep?.path}</span>
              <span className="text-gray-400 text-sm">{ep?.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
