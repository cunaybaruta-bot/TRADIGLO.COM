import Link from 'next/link';

export default function CryptoHeatmapPage() {
  const coins = [
    { name: 'BTC', change: 2.4, size: 'large' },
    { name: 'ETH', change: -1.2, size: 'large' },
    { name: 'BNB', change: 3.1, size: 'medium' },
    { name: 'SOL', change: 5.6, size: 'medium' },
    { name: 'XRP', change: -0.8, size: 'medium' },
    { name: 'ADA', change: 1.9, size: 'small' },
    { name: 'AVAX', change: -3.2, size: 'small' },
    { name: 'DOGE', change: 7.1, size: 'small' },
    { name: 'DOT', change: -2.1, size: 'small' },
    { name: 'MATIC', change: 4.3, size: 'small' },
    { name: 'LINK', change: 1.5, size: 'small' },
    { name: 'UNI', change: -0.5, size: 'small' },
  ];

  const sizeClass: Record<string, string> = {
    large: 'col-span-2 row-span-2 text-xl',
    medium: 'col-span-1 row-span-1 text-base',
    small: 'col-span-1 row-span-1 text-sm',
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="mb-8">
          <Link href="/" className="text-gray-400 hover:text-white text-sm transition-colors">← Back to Home</Link>
        </div>
        <h1 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-500 to-purple-500">Crypto Heatmap</h1>
        <p className="text-gray-400 text-lg mb-8">Visual overview of cryptocurrency market performance. Green = gaining, Red = losing.</p>
        <div className="grid grid-cols-4 gap-2">
          {coins.map((coin) => (
            <div
              key={coin.name}
              className={`${sizeClass[coin.size]} rounded-lg flex flex-col items-center justify-center p-4 cursor-pointer transition-opacity hover:opacity-80 ${coin.change >= 0 ? 'bg-green-900/60 border border-green-700/40' : 'bg-red-900/60 border border-red-700/40'}`}
            >
              <span className="font-bold">{coin.name}</span>
              <span className={`text-xs mt-1 ${coin.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {coin.change >= 0 ? '+' : ''}{coin.change}%
              </span>
            </div>
          ))}
        </div>
        <p className="text-gray-600 text-xs mt-4">* Data shown is for illustrative purposes only.</p>
      </div>
    </div>
  );
}
