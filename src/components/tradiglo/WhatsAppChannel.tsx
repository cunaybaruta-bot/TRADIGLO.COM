'use client';

import { BarChart2, Target, FileText, BookOpen, Bell, Bitcoin } from 'lucide-react';
import Icon from '@/components/ui/AppIcon';


const WA_CHANNEL = 'https://whatsapp.com/channel/0029VbDNq7VGzzKIpSf7VE1g';

const WA_SVG = (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const channelList = [
  { icon: BarChart2, text: 'Market update harian — Crypto, Forex & Gold' },
  { icon: Target, text: 'Signal XAUUSD, BTC, ETH & Forex' },
  { icon: FileText, text: 'Nota risiko setiap signal' },
  { icon: BookOpen, text: 'Edukasi ringkas termasuk asas crypto trading' },
  { icon: Bell, text: 'Rekap mingguan semua market' },
  { icon: Bitcoin, text: 'Pengumuman rasmi Tradiglo' },
];

const mockMessages = [
  { time: '09:14', text: 'XAUUSD Watchlist Hari Ini', sub: 'Pantau zon 2320–2328 untuk peluang BUY' },
  { time: '09:16', text: 'Tunggu confirmation sebelum entry', sub: 'Jangan tergesa-gesa. Biarkan candle tutup dulu.' },
  { time: '09:18', text: 'Risk maksimum 1% setiap trade', sub: 'Jaga lot size. Disiplin lebih penting dari profit.' },
];

export default function WhatsAppChannel() {
  const track = () => {
    if (typeof window !== 'undefined') (window as any).gtag?.('event', 'click_whatsapp_channel', { location: 'channel_section' });
  };

  return (
    <section className="py-20" style={{ background: '#0B0E2D' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left */}
          <div className="space-y-6">
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full"
              style={{ background: 'rgba(37,211,102,0.08)', border: '1px solid rgba(37,211,102,0.2)' }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-[#25D366]" />
              <span className="text-xs font-bold text-[#25D366] uppercase tracking-wider">WhatsApp Channel</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">
              Sertai WhatsApp Channel{' '}
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: 'linear-gradient(90deg, #A78BFA, #6366F1)' }}
              >
                Tradiglo Malaysia
              </span>
            </h2>
            <p className="text-[#A6A8C3] leading-relaxed">
              WhatsApp Channel Tradiglo digunakan untuk berkongsi market update Crypto, Forex, dan Gold — signal, nota trading, dan edukasi ringkas tanpa gangguan group chat yang bising.
            </p>
            <ul className="space-y-3">
              {channelList.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}
                  >
                    <Icon className="w-3.5 h-3.5" style={{ color: '#8B5CF6' }} />
                  </div>
                  <span className="text-sm text-[#A6A8C3]">{text}</span>
                </li>
              ))}
            </ul>
            <a
              href={WA_CHANNEL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={track}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-white font-semibold text-sm hover:opacity-90 transition-all active:scale-95"
              style={{
                background: 'linear-gradient(135deg, #25D366, #128C7E)',
                boxShadow: '0 4px 20px rgba(37,211,102,0.2)',
              }}
            >
              {WA_SVG}
              Sertai WhatsApp Channel Percuma
            </a>
          </div>

          {/* Right: WhatsApp mockup */}
          <div className="flex justify-center">
            <div className="relative w-full max-w-xs">
              <div
                className="absolute -inset-4 rounded-3xl pointer-events-none"
                style={{
                  background: 'radial-gradient(ellipse at center, rgba(139,92,246,0.15) 0%, transparent 70%)',
                  filter: 'blur(16px)',
                }}
              />
              <div
                className="relative rounded-2xl overflow-hidden"
                style={{
                  background: '#11143A',
                  border: '1px solid rgba(139,92,246,0.25)',
                  boxShadow: '0 8px 40px rgba(139,92,246,0.15)',
                }}
              >
                {/* Channel header */}
                <div
                  className="px-4 py-3 flex items-center gap-3"
                  style={{ background: '#15184A', borderBottom: '1px solid rgba(139,92,246,0.15)' }}
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)' }}
                  >
                    {WA_SVG}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Tradiglo Malaysia</p>
                    <p className="text-[10px] text-[#A6A8C3]/60">Channel Rasmi · WhatsApp</p>
                  </div>
                  <div className="ml-auto">
                    <div className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse" />
                  </div>
                </div>

                {/* Messages */}
                <div className="px-4 py-4 space-y-3">
                  {mockMessages.map((msg, i) => (
                    <div key={i} className="flex justify-end">
                      <div
                        className="max-w-[85%] px-3.5 py-2.5 rounded-2xl rounded-tr-sm"
                        style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.2)' }}
                      >
                        <p className="text-xs font-semibold text-white mb-0.5">{msg.text}</p>
                        <p className="text-[10px] text-[#A6A8C3]">{msg.sub}</p>
                        <p className="text-[9px] text-[#A6A8C3]/40 text-right mt-1">{msg.time}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div
                  className="px-4 py-3 text-center"
                  style={{ borderTop: '1px solid rgba(139,92,246,0.1)', background: '#0B0E2D' }}
                >
                  <p className="text-[10px] text-[#A6A8C3]/50">
                    Sesuai untuk trader Malaysia yang mahu update tersusun
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
