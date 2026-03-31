import Link from 'next/link';

export default function CandyRewardsListingPage() {
  const rewards = [
    { name: 'Daily Login Bonus', points: 10, desc: 'Earn points every day you log in to Tradiglo.' },
    { name: 'Portfolio Tracking', points: 25, desc: 'Add assets to your watchlist and track your portfolio.' },
    { name: 'Newsletter Signup', points: 50, desc: 'Subscribe to our newsletter for the latest crypto updates.' },
    { name: 'Refer a Friend', points: 100, desc: 'Invite friends to join Tradiglo and earn bonus points.' },
    { name: 'Complete Profile', points: 30, desc: 'Fill out your profile information completely.' },
    { name: 'First Trade', points: 200, desc: 'Complete your first trade on the platform.' },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="mb-8">
          <Link href="/" className="text-gray-400 hover:text-white text-sm transition-colors">← Back to Home</Link>
        </div>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">🍬</span>
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-500 to-purple-500">Candy Rewards</h1>
        </div>
        <p className="text-gray-400 text-lg mb-8">Earn Candy points by engaging with Tradiglo and redeem them for exclusive rewards.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rewards?.map((reward) => (
            <div key={reward?.name} className="border border-white/10 rounded-xl p-5 hover:border-white/20 transition-colors flex items-start gap-4">
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg p-2 flex-shrink-0">
                <span className="text-white font-bold text-sm">+{reward?.points}</span>
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm mb-1">{reward?.name}</h3>
                <p className="text-gray-400 text-xs">{reward?.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
