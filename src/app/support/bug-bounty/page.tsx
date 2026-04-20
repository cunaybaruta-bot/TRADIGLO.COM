import Link from 'next/link';

export default function BugBountyPage() {
  const rewards = [
    { severity: 'Critical', range: '$5,000 – $20,000', color: 'text-red-400', bg: 'bg-red-900/20 border-red-700/30' },
    { severity: 'High', range: '$1,000 – $5,000', color: 'text-orange-400', bg: 'bg-orange-900/20 border-orange-700/30' },
    { severity: 'Medium', range: '$250 – $1,000', color: 'text-yellow-400', bg: 'bg-yellow-900/20 border-yellow-700/30' },
    { severity: 'Low', range: '$50 – $250', color: 'text-green-400', bg: 'bg-green-900/20 border-green-700/30' },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="mb-8">
          <Link href="/" className="text-gray-400 hover:text-white text-sm transition-colors">← Back to Home</Link>
        </div>
        <h1 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-500 to-purple-500">Bug Bounty Program</h1>
        <p className="text-gray-400 text-lg mb-8">Help us keep Tradiglo secure. Report vulnerabilities and earn rewards.</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {rewards?.map((r) => (
            <div key={r?.severity} className={`border rounded-xl p-5 text-center ${r?.bg}`}>
              <p className={`font-bold text-lg mb-1 ${r?.color}`}>{r?.severity}</p>
              <p className="text-gray-300 text-xs">{r?.range}</p>
            </div>
          ))}
        </div>
        <div className="border border-white/10 rounded-xl p-6 mb-6">
          <h2 className="text-white font-bold text-xl mb-4">Scope</h2>
          <ul className="space-y-2 text-gray-400 text-sm">
            <li>✅ Authentication and authorization vulnerabilities</li>
            <li>✅ SQL injection and data exposure</li>
            <li>✅ Cross-site scripting (XSS)</li>
            <li>✅ API security issues</li>
            <li>❌ Social engineering attacks</li>
            <li>❌ Denial of service (DoS)</li>
          </ul>
        </div>
        <div className="text-center">
          <Link href="/support/request-form" className="inline-block bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-3 rounded-lg transition-colors text-sm">Report a Vulnerability</Link>
        </div>
      </div>
    </div>
  );
}
