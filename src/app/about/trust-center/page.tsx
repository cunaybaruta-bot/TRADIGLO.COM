import Link from 'next/link';

export default function TrustCenterPage() {
  const certifications = [
    { name: 'SOC 2 Type 1', status: 'Certified', desc: 'Security, availability, and confidentiality controls verified.' },
    { name: 'SOC 2 Type 2', status: 'Certified', desc: 'Ongoing operational effectiveness of security controls.' },
    { name: 'ISO 27001', status: 'In Progress', desc: 'International standard for information security management.' },
    { name: 'GDPR Compliance', status: 'Compliant', desc: 'Full compliance with EU General Data Protection Regulation.' },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="mb-8">
          <Link href="/" className="text-gray-400 hover:text-white text-sm transition-colors">← Back to Home</Link>
        </div>
        <h1 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-500 to-purple-500">Trust Center</h1>
        <p className="text-gray-400 text-lg mb-10">Our commitment to security, privacy, and compliance.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {certifications?.map((cert) => (
            <div key={cert?.name} className="border border-white/10 rounded-xl p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-bold text-lg">{cert?.name}</h3>
                <span className={`text-xs px-3 py-1 rounded-full font-medium ${cert?.status === 'Certified' || cert?.status === 'Compliant' ? 'bg-green-900/40 text-green-400 border border-green-700/30' : 'bg-yellow-900/40 text-yellow-400 border border-yellow-700/30'}`}>{cert?.status}</span>
              </div>
              <p className="text-gray-400 text-sm">{cert?.desc}</p>
            </div>
          ))}
        </div>
        <div className="border border-white/10 rounded-xl p-6 mb-6">
          <h2 className="text-white font-bold text-xl mb-4">Security Practices</h2>
          <ul className="space-y-3 text-gray-400 text-sm">
            <li className="flex items-start gap-2"><span className="text-green-400 mt-0.5">✓</span> End-to-end encryption for all data in transit and at rest</li>
            <li className="flex items-start gap-2"><span className="text-green-400 mt-0.5">✓</span> Multi-factor authentication (MFA) for all accounts</li>
            <li className="flex items-start gap-2"><span className="text-green-400 mt-0.5">✓</span> Regular third-party security audits and penetration testing</li>
            <li className="flex items-start gap-2"><span className="text-green-400 mt-0.5">✓</span> 24/7 security monitoring and incident response</li>
            <li className="flex items-start gap-2"><span className="text-green-400 mt-0.5">✓</span> Bug bounty program for responsible disclosure</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
