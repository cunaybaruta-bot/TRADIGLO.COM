import Link from 'next/link';

interface TradigloCountry {
  name: string;
  flag: string;
  lang: string;
  href: string;
  status: 'active' | 'coming-soon';
  desc: string;
}

const tradigloCountries: TradigloCountry[] = [
  {
    name: 'Tradiglo Malaysia',
    flag: '🇲🇾',
    lang: 'Bahasa Melayu',
    href: '/tradiglo.malaysia',
    status: 'active',
    desc: 'Signal Forex, Gold & Crypto untuk trader Malaysia melalui WhatsApp Channel dan WhatsApp Admin.',
  },
  {
    name: 'Tradiglo Singapore',
    flag: '🇸🇬',
    lang: 'English',
    href: '/tradiglo.singapore',
    status: 'active',
    desc: 'Forex, Gold & Crypto signals for Singapore traders via WhatsApp Channel and WhatsApp Admin.',
  },
  {
    name: 'Tradiglo Bahrain',
    flag: '🇧🇭',
    lang: 'العربية',
    href: '/tradiglo.bahrain',
    status: 'active',
    desc: 'إشارات تداول الفوركس والذهب والعملات المشفرة للمتداولين في البحرين.',
  },
  {
    name: 'Tradiglo Jordania',
    flag: '🇯🇴',
    lang: 'العربية',
    href: '/tradiglo.jordan',
    status: 'active',
    desc: 'إشارات الفوركس والذهب والعملات المشفرة للمتداولين في الأردن عبر قناة واتساب وأدمن واتساب.',
  },
  {
    name: 'Tradiglo Brunei',
    flag: '🇧🇳',
    lang: 'Bahasa Melayu',
    href: '/tradiglo.brunei',
    status: 'active',
    desc: 'Signal Forex, Gold & Crypto untuk trader Brunei Darussalam melalui WhatsApp Channel dan WhatsApp Admin.',
  },
  {
    name: 'Tradiglo Oman',
    flag: '🇴🇲',
    lang: 'العربية',
    href: '/tradiglo.oman',
    status: 'active',
    desc: 'إشارات الفوركس والذهب والعملات المشفرة للمتداولين في عُمان عبر قناة واتساب وأدمن واتساب.',
  },
  {
    name: 'Tradiglo Kuwait',
    flag: '🇰🇼',
    lang: 'العربية',
    href: '/tradiglo.kuwait',
    status: 'active',
    desc: 'إشارات الفوركس والذهب والعملات المشفرة للمتداولين في الكويت عبر قناة واتساب وأدمن واتساب.',
  },
  {
    name: 'Tradiglo Japan',
    flag: '🇯🇵',
    lang: '日本語',
    href: '#',
    status: 'coming-soon',
    desc: 'WhatsAppチャンネルを通じた日本のトレーダー向けFX・ゴールド・暗号資産シグナル。',
  },
  {
    name: 'Tradiglo Korea',
    flag: '🇰🇷',
    lang: '한국어',
    href: '#',
    status: 'coming-soon',
    desc: 'WhatsApp 채널을 통한 한국 트레이더를 위한 외환, 금 및 암호화폐 신호.',
  },
  {
    name: 'Tradiglo Tiongkok',
    flag: '🇨🇳',
    lang: '中文',
    href: '#',
    status: 'coming-soon',
    desc: '通过WhatsApp频道为中国交易者提供外汇、黄金和加密货币信号。',
  },
];

export default function CommunityPage() {
  return (
    <div className="min-h-screen text-white" style={{ background: '#07091F' }}>
      <div className="max-w-5xl mx-auto px-6 py-16">
        <div className="mb-8">
          <Link href="/" className="text-gray-400 hover:text-white text-sm transition-colors">← Back to Home</Link>
        </div>

        <h1 className="text-3xl font-bold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-indigo-400 to-blue-400">Community</h1>
        <p className="text-gray-400 text-lg mb-12">Sertai komuniti Tradiglo di seluruh rantau. Pilih negara anda untuk mula.</p>

        {/* Tradiglo by Country */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-6 rounded-full bg-gradient-to-b from-indigo-400 to-violet-500" />
            <h2 className="text-lg font-semibold text-white">Tradiglo by Country</h2>
            <span className="text-xs text-gray-500 border border-white/10 px-2.5 py-1 rounded-full" style={{ background: 'rgba(255,255,255,0.04)' }}>Regional Communities</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {tradigloCountries.map((country) => (
              <div key={country.name} className="relative group">
                {country.status === 'active' ? (
                  <Link
                    href={country.href}
                    className="flex flex-col gap-3 p-5 rounded-xl transition-all duration-200 block"
                    style={{
                      border: '1px solid rgba(139,92,246,0.35)',
                      background: 'rgba(139,92,246,0.07)',
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{country.flag}</span>
                        <div>
                          <h3 className="text-white font-semibold text-sm">{country.name}</h3>
                          <p className="text-xs" style={{ color: '#A78BFA' }}>{country.lang}</p>
                        </div>
                      </div>
                      <span className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full" style={{ color: '#4ade80', background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)' }}>
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                        Live
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: '#A6A8C3' }}>{country.desc}</p>
                    <span className="text-xs font-medium transition-colors" style={{ color: '#A78BFA' }}>
                      Lawati halaman →
                    </span>
                  </Link>
                ) : (
                  <div
                    className="flex flex-col gap-3 p-5 rounded-xl opacity-55 cursor-not-allowed"
                    style={{
                      border: '1px solid rgba(255,255,255,0.08)',
                      background: 'rgba(255,255,255,0.02)',
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{country.flag}</span>
                        <div>
                          <h3 className="text-gray-300 font-semibold text-sm">{country.name}</h3>
                          <p className="text-gray-600 text-xs">{country.lang}</p>
                        </div>
                      </div>
                      <span className="text-xs text-gray-500 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full font-medium">
                        Coming Soon
                      </span>
                    </div>
                    <p className="text-gray-600 text-xs leading-relaxed">{country.desc}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
