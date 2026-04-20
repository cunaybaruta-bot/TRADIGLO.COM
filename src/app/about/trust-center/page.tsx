import Link from 'next/link';

export default function TrustCenterPage() {
  const certifications = [
    { name: 'SOC 2 Type 1', status: 'Certified', desc: 'Security, availability, and confidentiality controls verified.' },
    { name: 'SOC 2 Type 2', status: 'Certified', desc: 'Ongoing operational effectiveness of security controls.' },
    { name: 'ISO 27001', status: 'In Progress', desc: 'International standard for information security management.' },
    { name: 'GDPR Compliance', status: 'Compliant', desc: 'Full compliance with EU General Data Protection Regulation.' },
  ];

  const licenseRegions = [
    {
      region: 'Global — Abu Dhabi Global Markets (ADGM)',
      licenses: [
        {
          entity: 'Nest Exchange Limited',
          country: 'Abu Dhabi Global Markets (ADGM)',
          regulator: 'ADGM Financial Services Regulatory Authority (FSRA)',
          licenseNo: '—',
          activities: 'Recognised Investment Exchange (Derivatives); Operating a Multilateral Trading Facility for Virtual Assets and Fiat-Referenced Tokens',
        },
        {
          entity: 'Nest Clearing and Custody Limited',
          country: 'Abu Dhabi Global Markets (ADGM)',
          regulator: 'ADGM Financial Services Regulatory Authority (FSRA)',
          licenseNo: '—',
          activities: 'Recognised Clearing House (Derivatives); Providing Custody; Operating a Central Securities Depository',
        },
        {
          entity: 'Nest Trading Limited',
          country: 'Abu Dhabi Global Markets (ADGM)',
          regulator: 'ADGM Financial Services Regulatory Authority (FSRA)',
          licenseNo: '—',
          activities: 'Dealing in Investments as Principal & Agent; Arranging Deals in Investments; Managing Assets; Providing Money Services; Arranging Custody',
        },
      ],
    },
    {
      region: 'Europe',
      licenses: [
        {
          entity: 'Tradiglo France SAS',
          country: 'France',
          regulator: 'Autorité des Marchés Financiers (AMF)',
          licenseNo: 'E2022-037',
          activities: 'Digital assets custody; purchase/sale of digital assets for legal tender; exchange of digital assets; operation of a trading platform for digital assets',
        },
        {
          entity: 'Tradiglo Italy S.R.L.',
          country: 'Italy',
          regulator: 'Organismo Agenti e Mediatori (OAM)',
          licenseNo: 'PSV5',
          activities: 'Crypto asset exchange and custody services',
        },
        {
          entity: 'Tradiglo Spain, S.L.',
          country: 'Spain',
          regulator: 'Bank of Spain',
          licenseNo: 'D661',
          activities: 'Crypto asset exchange and custody services',
        },
        {
          entity: 'Tradiglo Poland Spółka z Ograniczoną Odpowiedzialnością',
          country: 'Poland',
          regulator: 'Polish Tax Administration Chamber of Poland in Katowice',
          licenseNo: 'RDWW – 465',
          activities: 'Crypto asset exchange and custody services',
        },
        {
          entity: 'Tradiglo Nordics AB',
          country: 'Sweden',
          regulator: 'Swedish Financial Supervisory Authority',
          licenseNo: '66822',
          activities: 'Spot trading, OTC convert, custody, staking, savings, card and pay services',
        },
      ],
    },
    {
      region: 'Commonwealth of Independent States',
      licenses: [
        {
          entity: 'BN KZ Technologies Limited',
          country: 'Kazakhstan (AIFC)',
          regulator: 'Astana Financial Services Authority (AFSA)',
          licenseNo: '—',
          activities: 'Digital Asset Trading Facility Operator; Providing Custody; Dealing in Investments as Principal',
        },
      ],
    },
    {
      region: 'Middle East',
      licenses: [
        {
          entity: 'Tradiglo Bahrain BSC(c)',
          country: 'Bahrain',
          regulator: 'Central Bank of Bahrain',
          licenseNo: 'Category 4 Licence',
          activities: 'Crypto-asset exchange and custody services',
        },
        {
          entity: 'BPay Global BSC(c)',
          country: 'Bahrain',
          regulator: 'Central Bank of Bahrain',
          licenseNo: 'Category 5, Type 7 License',
          activities: 'Payment Service Provider',
        },
        {
          entity: 'Tradiglo FZE',
          country: 'Dubai',
          regulator: 'Dubai Virtual Asset Regulatory Authority (VARA)',
          licenseNo: 'VASP Licence',
          activities: 'Broker-Dealer Services; Exchange Services (including VA Derivatives Trading); Management and Investment Services; Lending and Borrowing Services',
        },
      ],
    },
    {
      region: 'Asia-Pacific',
      licenses: [
        {
          entity: 'InvestbyBit Pty Ltd (trading as "Tradiglo Australia")',
          country: 'Australia',
          regulator: 'Australian Transaction Reports and Analysis Centre (AUSTRAC)',
          licenseNo: '100576141-001 (ABN: 98 621 652 579)',
          activities: 'Digital currency exchange services',
        },
        {
          entity: 'Nest Exchange Limited (formerly Nest Services Limited)',
          country: 'India',
          regulator: 'Financial Intelligence Unit',
          licenseNo: '—',
          activities: 'Registered as offshore reporting entity',
        },
        {
          entity: 'Tradiglo Japan Inc.',
          country: 'Japan',
          regulator: 'Japan Financial Services Agency (JFSA)',
          licenseNo: 'Kanto Local Finance Bureau 00031',
          activities: 'Crypto Asset Exchange Service Provider',
        },
        {
          entity: 'Investbybit Limited (trading as Tradiglo New Zealand)',
          country: 'New Zealand',
          regulator: 'New Zealand Register of Financial Service Providers',
          licenseNo: 'FSP1003864',
          activities: 'Use fiat currency to purchase virtual assets; trade virtual assets; use fiat or virtual currencies to buy or sell NFTs; invest in virtual assets',
        },
        {
          entity: 'Gulf Tradiglo Co., Ltd.',
          country: 'Thailand',
          regulator: 'Thailand Ministry of Finance / Securities and Exchange Commission',
          licenseNo: '—',
          activities: 'Digital asset exchange and digital asset broker',
        },
      ],
    },
    {
      region: 'Americas',
      licenses: [
        {
          entity: 'Bmex Techfin, S. de R.L. de C.V.',
          country: 'Mexico',
          regulator: 'Tax Administration Service (SAT)',
          licenseNo: 'Vulnerable Activity Registration',
          activities: 'Virtual assets services (AML/TF regulation compliance)',
        },
        {
          entity: 'Programas de Relacionamiento Medá S.A.P.I. de C.V.',
          country: 'Mexico',
          regulator: 'Mexican Financial Authorities',
          licenseNo: '—',
          activities: 'Operate electronic payment fund accounts; process deposits, transfers, and withdrawals of Mexican pesos',
        },
        {
          entity: 'Tradiglo Services Latinoamérica S.A. de C.V.',
          country: 'El Salvador',
          regulator: 'Comisión Nacional De Activos Digitales (CNAD) & Banco Central de Reserva (BCR)',
          licenseNo: 'DASP: PSDA/001-2003 | BSP: 648c5c0751164005aa47d43a',
          activities: 'Digital assets custody; purchase/sale of digital assets and derivatives; manage investment products; exchange of digital assets; operate trading platform',
        },
        {
          entity: 'Tradiglo Services Latinoamérica S.A. de C.V.',
          country: 'Argentina',
          regulator: 'National Securities Commission (CNV)',
          licenseNo: '76',
          activities: 'Virtual Asset Service Provider (VASP)',
        },
        {
          entity: 'Simpaul Corretora de Cambio e Valores Mobiliários S.A.',
          country: 'Brazil',
          regulator: 'Brazilian Securities Regulators',
          licenseNo: '—',
          activities: 'Issue electronic money; distribute securities; offer payment solutions and additional services',
        },
      ],
    },
    {
      region: 'Africa',
      licenses: [
        {
          entity: 'Tradiglo RSA',
          country: 'South Africa',
          regulator: 'Financial Services Conduct Authority (FAIS)',
          licenseNo: 'Exemption per Notice 25 of 2023',
          activities: 'Crypto Products and Services (excluding Crypto Futures and Options)',
        },
        {
          entity: 'Tradiglo Bahrain BSC (as Juristic Representative of FiveWest OTC Desk (Pty) Limited)',
          country: 'South Africa',
          regulator: 'Financial Services Conduct Authority',
          licenseNo: 'FSP 51619',
          activities: 'Crypto Futures and Options',
        },
      ],
    },
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

        {/* Licenses & Regulatory Section */}
        <div className="border border-white/10 rounded-xl p-6">
          <h2 className="text-white font-bold text-xl mb-2">Licenses, Registrations &amp; Regulatory Matters</h2>
          <p className="text-gray-400 text-sm mb-6">Tradiglo Group holds licenses and registrations across multiple jurisdictions worldwide. The following table lists our regulatory authorizations by region.</p>
          <div className="space-y-8">
            {licenseRegions?.map((group) => (
              <div key={group?.region}>
                <h3 className="text-blue-400 font-semibold text-sm uppercase tracking-wider mb-3">{group?.region}</h3>
                <div className="space-y-3">
                  {group?.licenses?.map((lic, idx) => (
                    <div key={idx} className="border border-white/5 rounded-lg p-4 bg-white/[0.02]">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 mb-2">
                        <span className="text-white font-medium text-sm">{lic?.entity}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-900/30 text-blue-300 border border-blue-700/20 whitespace-nowrap">{lic?.country}</span>
                      </div>
                      <div className="text-xs text-gray-500 mb-1">
                        <span className="text-gray-400">Regulator:</span> {lic?.regulator}
                      </div>
                      <div className="text-xs text-gray-500 mb-2">
                        <span className="text-gray-400">License / Reg. No.:</span> {lic?.licenseNo}
                      </div>
                      <p className="text-gray-400 text-xs leading-relaxed">{lic?.activities}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
