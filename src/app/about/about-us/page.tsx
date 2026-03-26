import Link from 'next/link';

export default function AboutUsPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="mb-8">
          <Link href="/" className="text-gray-400 hover:text-white text-sm transition-colors">← Back to Home</Link>
        </div>
        <h1 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-500 to-purple-500">About Tradiglo</h1>
        <p className="text-gray-400 text-lg mb-10 leading-relaxed">Tradiglo is a leading cryptocurrency market data and trading platform, trusted by millions of users worldwide.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[{ label: 'Users Worldwide', value: '5M+' }, { label: 'Cryptocurrencies Tracked', value: '10,000+' }, { label: 'Countries Supported', value: '150+' }]?.map((stat) => (
            <div key={stat?.label} className="border border-white/10 rounded-xl p-6 text-center">
              <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 mb-2">{stat?.value}</p>
              <p className="text-gray-400 text-sm">{stat?.label}</p>
            </div>
          ))}
        </div>
        <div className="space-y-8">
          <div>
            <h2 className="text-white font-bold text-xl mb-3">Our Mission</h2>
            <p className="text-gray-400 leading-relaxed">Our mission is to make cryptocurrency accessible to everyone by providing accurate, real-time market data, powerful trading tools, and educational resources that empower both novice and experienced investors to make informed decisions.</p>
          </div>
          <div>
            <h2 className="text-white font-bold text-xl mb-3">Our Story</h2>
            <p className="text-gray-400 leading-relaxed">Founded in 2020, Tradiglo was born from the belief that everyone deserves access to professional-grade cryptocurrency market data. What started as a simple price tracker has evolved into a comprehensive platform serving millions of users across the globe.</p>
          </div>
          <div>
            <h2 className="text-white font-bold text-xl mb-3">Our Values</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {['Transparency', 'Accuracy', 'Security', 'Innovation']?.map((val) => (
                <div key={val} className="border border-white/10 rounded-lg p-4 flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex-shrink-0"></span>
                  <span className="text-gray-300 text-sm font-medium">{val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
