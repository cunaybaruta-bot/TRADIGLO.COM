import Link from 'next/link';

export default function AdPolicyPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-8">
          <Link href="/" className="text-gray-400 hover:text-white text-sm transition-colors">← Back to Home</Link>
        </div>
        <h1 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-500 to-purple-500">Ad Policy</h1>
        <p className="text-gray-500 text-sm mb-8">Last updated: March 26, 2026</p>
        <div className="space-y-8 text-gray-400 text-sm leading-relaxed">
          {[
            { title: 'Our Advertising Standards', content: 'Tradiglo is committed to maintaining a high-quality advertising environment. All advertisements displayed on our platform must comply with our advertising standards and applicable laws.' },
            { title: 'Prohibited Content', content: 'We do not accept advertisements for illegal products or services, misleading financial promotions, unregistered securities offerings, fraudulent schemes, or content that violates our community standards.' },
            { title: 'Crypto Advertising', content: 'Cryptocurrency-related advertisements must clearly disclose risks associated with crypto investments. Advertisers must be licensed or registered where required by law.' },
            { title: 'Disclosure', content: 'Sponsored content and paid advertisements are clearly labeled as such on our platform. We maintain editorial independence from our advertising relationships.' },
            { title: 'User Data in Advertising', content: 'We may use aggregated, anonymized data to serve relevant advertisements. We do not share personally identifiable information with advertisers without your explicit consent.' },
            { title: 'Reporting Violations', content: 'If you encounter an advertisement that violates our Ad Policy, please report it using the flag icon or contact us through our Request Form.' },
          ]?.map((section) => (
            <div key={section?.title}>
              <h2 className="text-white font-bold text-base mb-2">{section?.title}</h2>
              <p>{section?.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
