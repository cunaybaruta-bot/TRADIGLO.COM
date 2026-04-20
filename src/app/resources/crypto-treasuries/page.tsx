import Link from 'next/link';

export default function CryptoTreasuriesPage() {
  const treasuries = [
    { company: 'MicroStrategy', ticker: 'MSTR', btc: '214,246', value: '$14.2B' },
    { company: 'Tesla', ticker: 'TSLA', btc: '9,720', value: '$645M' },
    { company: 'Marathon Digital', ticker: 'MARA', btc: '15,174', value: '$1.0B' },
    { company: 'Coinbase', ticker: 'COIN', btc: '9,480', value: '$629M' },
    { company: 'Block Inc.', ticker: 'SQ', btc: '8,027', value: '$533M' },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="mb-8">
          <Link href="/" className="text-gray-400 hover:text-white text-sm transition-colors">← Back to Home</Link>
        </div>
        <h1 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-500 to-purple-500">Crypto Treasuries</h1>
        <p className="text-gray-400 text-lg mb-8">Track public companies and institutions holding cryptocurrency in their treasuries.</p>
        <div className="border border-white/10 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="text-left px-6 py-4 text-gray-400 text-sm font-medium">Company</th>
                <th className="text-left px-6 py-4 text-gray-400 text-sm font-medium">Ticker</th>
                <th className="text-right px-6 py-4 text-gray-400 text-sm font-medium">BTC Holdings</th>
                <th className="text-right px-6 py-4 text-gray-400 text-sm font-medium">Est. Value</th>
              </tr>
            </thead>
            <tbody>
              {treasuries?.map((row, i) => (
                <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 text-white text-sm font-medium">{row?.company}</td>
                  <td className="px-6 py-4 text-gray-400 text-sm">{row?.ticker}</td>
                  <td className="px-6 py-4 text-right text-white text-sm">{row?.btc} BTC</td>
                  <td className="px-6 py-4 text-right text-green-400 text-sm">{row?.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-gray-600 text-xs mt-4">* Data shown is for illustrative purposes only.</p>
      </div>
    </div>
  );
}
