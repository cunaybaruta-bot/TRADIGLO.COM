import Link from 'next/link';

export default function CareersPage() {
  const openings = [
    { title: 'Senior Frontend Engineer', dept: 'Engineering', location: 'Remote', type: 'Full-time' },
    { title: 'Blockchain Data Analyst', dept: 'Data', location: 'Remote', type: 'Full-time' },
    { title: 'Product Designer', dept: 'Design', location: 'Remote', type: 'Full-time' },
    { title: 'Crypto Market Researcher', dept: 'Research', location: 'Remote', type: 'Full-time' },
    { title: 'Customer Support Specialist', dept: 'Support', location: 'Remote', type: 'Full-time' },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="mb-8">
          <Link href="/" className="text-gray-400 hover:text-white text-sm transition-colors">← Back to Home</Link>
        </div>
        <h1 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-500 to-purple-500">Careers at Tradiglo</h1>
        <p className="text-gray-400 text-lg mb-10">Join our team and help shape the future of cryptocurrency data and trading.</p>
        <div className="border border-blue-500/30 bg-blue-900/10 rounded-xl p-6 mb-10">
          <h2 className="text-white font-bold text-lg mb-2">Why Tradiglo?</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            {['Remote-first', 'Competitive pay', 'Crypto benefits', 'Learning budget']?.map((perk) => (
              <div key={perk} className="text-center">
                <p className="text-gray-300 text-sm">{perk}</p>
              </div>
            ))}
          </div>
        </div>
        <h2 className="text-white font-bold text-xl mb-4">Open Positions</h2>
        <div className="space-y-3">
          {openings?.map((job) => (
            <div key={job?.title} className="border border-white/10 rounded-xl p-5 hover:border-white/20 transition-colors flex items-center justify-between">
              <div>
                <h3 className="text-white font-semibold text-sm mb-1">{job?.title}</h3>
                <p className="text-gray-400 text-xs">{job?.dept} · {job?.location} · {job?.type}</p>
              </div>
              <Link href="/support/request-form" className="text-blue-400 hover:text-blue-300 text-sm transition-colors">Apply →</Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
