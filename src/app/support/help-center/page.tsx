import Link from 'next/link';

export default function HelpCenterPage() {
  const categories = [
    { icon: '🚀', title: 'Getting Started', articles: ['How to create an account', 'Verifying your identity', 'Making your first deposit', 'Navigating the dashboard'] },
    { icon: '💰', title: 'Trading', articles: ['How to place a trade', 'Understanding leverage', 'Copy trading guide', 'Managing open positions'] },
    { icon: '🔒', title: 'Security', articles: ['Enabling 2FA', 'Securing your account', 'Recognizing phishing attempts', 'Password best practices'] },
    { icon: '💳', title: 'Deposits & Withdrawals', articles: ['Supported payment methods', 'Deposit processing times', 'Withdrawal limits', 'Transaction fees'] },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="mb-8">
          <Link href="/" className="text-gray-400 hover:text-white text-sm transition-colors">← Back to Home</Link>
        </div>
        <h1 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-500 to-purple-500">Help Center</h1>
        <p className="text-gray-400 text-lg mb-8">Find answers to your questions and learn how to get the most out of Tradiglo.</p>
        <div className="relative mb-8">
          <input type="text" placeholder="Search for help..." className="w-full bg-white/5 border border-white/20 rounded-xl px-5 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {categories?.map((cat) => (
            <div key={cat?.title} className="border border-white/10 rounded-xl p-6 hover:border-white/20 transition-colors">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">{cat?.icon}</span>
                <h3 className="text-white font-bold text-lg">{cat?.title}</h3>
              </div>
              <ul className="space-y-2">
                {cat?.articles?.map((article) => (
                  <li key={article}>
                    <span className="text-blue-400 hover:text-blue-300 text-sm cursor-pointer transition-colors">→ {article}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-8 border border-white/10 rounded-xl p-6 text-center">
          <p className="text-gray-400 text-sm mb-3">Can't find what you're looking for?</p>
          <Link href="/support/request-form" className="inline-block bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-2 rounded-lg transition-colors text-sm">Contact Support</Link>
        </div>
      </div>
    </div>
  );
}
