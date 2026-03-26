import Link from 'next/link';

export default function CryptoNewsPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="mb-8">
          <Link href="/" className="text-gray-400 hover:text-white text-sm transition-colors">← Back to Home</Link>
        </div>
        <h1 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-500 to-purple-500">Crypto News</h1>
        <p className="text-gray-400 text-lg mb-8">Stay up to date with the latest cryptocurrency news, market updates, and blockchain developments.</p>
        <div className="border border-white/10 rounded-xl p-8 text-center">
          <p className="text-gray-500 text-sm">Latest crypto news and updates will appear here. Visit our <Link href="/news" className="text-blue-400 hover:text-blue-300 underline">News page</Link> for the latest stories.</p>
        </div>
      </div>
    </div>
  );
}
