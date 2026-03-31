import Link from 'next/link';

export default function AdvertisingPage() {
  const options = [
    { name: 'Banner Ads', desc: 'High-visibility banner placements across our platform reaching millions of crypto enthusiasts.', price: 'From $500/week' },
    { name: 'Sponsored Content', desc: 'Native content integration that resonates with our engaged crypto community.', price: 'From $1,000/post' },
    { name: 'Newsletter Sponsorship', desc: 'Reach our subscribers directly in their inbox with your brand message.', price: 'From $750/issue' },
    { name: 'Custom Campaigns', desc: 'Tailored advertising solutions designed to meet your specific marketing goals.', price: 'Custom pricing' },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="mb-8">
          <Link href="/" className="text-gray-400 hover:text-white text-sm transition-colors">← Back to Home</Link>
        </div>
        <h1 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-500 to-purple-500">Advertising</h1>
        <p className="text-gray-400 text-lg mb-8">Reach millions of crypto enthusiasts and investors through Tradiglo's advertising platform.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {options?.map((opt) => (
            <div key={opt?.name} className="border border-white/10 rounded-xl p-6 hover:border-white/20 transition-colors">
              <h3 className="text-white font-bold text-lg mb-2">{opt?.name}</h3>
              <p className="text-gray-400 text-sm mb-4">{opt?.desc}</p>
              <p className="text-blue-400 font-semibold text-sm">{opt?.price}</p>
            </div>
          ))}
        </div>
        <div className="border border-blue-500/30 bg-blue-900/10 rounded-xl p-8 text-center">
          <h2 className="text-white font-bold text-xl mb-2">Ready to advertise?</h2>
          <p className="text-gray-400 text-sm mb-4">Contact our advertising team to discuss your campaign needs.</p>
          <Link href="/support/request-form" className="inline-block bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3 rounded-lg transition-colors text-sm">Get in Touch</Link>
        </div>
      </div>
    </div>
  );
}
