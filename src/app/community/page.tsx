import Link from 'next/link';

export default function CommunityPage() {
  const channels = [
    { name: 'X/Twitter', handle: '@Tradiglo', desc: 'Follow us for real-time market updates and news.', href: 'https://twitter.com/tradiglo', icon: '𝕏', color: 'border-gray-700 hover:border-gray-500' },
    { name: 'Telegram Chat', handle: 't.me/tradiglo', desc: 'Join our community chat for discussions.', href: 'https://t.me/tradiglo', icon: '✈️', color: 'border-blue-700/40 hover:border-blue-500/60' },
    { name: 'Telegram News', handle: 't.me/tradiglo_news', desc: 'Get the latest crypto news directly.', href: 'https://t.me/tradiglo_news', icon: '📢', color: 'border-blue-700/40 hover:border-blue-500/60' },
    { name: 'Instagram', handle: '@tradiglo', desc: 'Visual content and market highlights.', href: 'https://instagram.com/tradiglo', icon: '📸', color: 'border-pink-700/40 hover:border-pink-500/60' },
    { name: 'Reddit', handle: 'r/tradiglo', desc: 'Community discussions and analysis.', href: 'https://reddit.com/r/tradiglo', icon: '🔴', color: 'border-orange-700/40 hover:border-orange-500/60' },
    { name: 'Discord', handle: 'Tradiglo Server', desc: 'Real-time chat with the community.', href: 'https://discord.gg/tradiglo', icon: '💬', color: 'border-indigo-700/40 hover:border-indigo-500/60' },
    { name: 'Facebook', handle: 'Tradiglo', desc: 'News and updates on Facebook.', href: 'https://facebook.com/tradiglo', icon: '👤', color: 'border-blue-700/40 hover:border-blue-500/60' },
    { name: 'YouTube', handle: 'Tradiglo', desc: 'Video tutorials and market analysis.', href: 'https://youtube.com/@tradiglo', icon: '▶️', color: 'border-red-700/40 hover:border-red-500/60' },
    { name: 'TikTok', handle: '@tradiglo', desc: 'Short-form crypto content and tips.', href: 'https://tiktok.com/@tradiglo', icon: '🎵', color: 'border-pink-700/40 hover:border-pink-500/60' },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="mb-8">
          <Link href="/" className="text-gray-400 hover:text-white text-sm transition-colors">← Back to Home</Link>
        </div>
        <h1 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-500 to-purple-500">Community</h1>
        <p className="text-gray-400 text-lg mb-10">Join the Tradiglo community across all platforms.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {channels?.map((ch) => (
            <a key={ch?.name} href={ch?.href} target="_blank" rel="noopener noreferrer" className={`border rounded-xl p-5 transition-colors ${ch?.color}`}>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{ch?.icon}</span>
                <div>
                  <h3 className="text-white font-semibold text-sm">{ch?.name}</h3>
                  <p className="text-gray-500 text-xs">{ch?.handle}</p>
                </div>
              </div>
              <p className="text-gray-400 text-xs">{ch?.desc}</p>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
