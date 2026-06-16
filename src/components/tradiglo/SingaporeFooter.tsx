'use client';

import { MapPin } from 'lucide-react';

// WhatsApp Channel — placeholder, will be added later
const WA_CHANNEL = 'https://whatsapp.com/channel/0029VbCuSOH9MF97jtucBD1c';
const WA_ADMIN = 'https://wa.me/60147792325?text=Hi%20Tradiglo%2C%20I%20am%20interested%20to%20register.%20I%20am%20from%20Singapore%20and%20would%20like%20to%20know%20how%20to%20get%20started%20with%20Tradiglo.';

const WA_ICON = (
  <svg className="w-3.5 h-3.5 text-[#25D366] flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

export default function SingaporeFooter() {
  return (
    <footer
      className="pb-24 md:pb-0"
      style={{ background: '#040610', borderTop: '1px solid rgba(139,92,246,0.12)' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-10">
        <div className="mb-12">
          {/* Brand */}
          <div className="space-y-5 max-w-sm">
            <a href="/tradiglo.singapore" className="flex items-center gap-3 group w-fit">
              <div
                style={{
                  width: 32,
                  height: 32,
                  background: 'linear-gradient(135deg, #a78bfa, #8B5CF6, #6366F1)',
                  WebkitMaskImage: 'url(/assets/images/chart-646_1024-1773102864640.png)',
                  WebkitMaskSize: 'contain',
                  WebkitMaskRepeat: 'no-repeat',
                  WebkitMaskPosition: 'center',
                  maskImage: 'url(/assets/images/chart-646_1024-1773102864640.png)',
                  maskSize: 'contain',
                  maskRepeat: 'no-repeat',
                  maskPosition: 'center',
                  filter: 'drop-shadow(0 0 8px rgba(139,92,246,0.5))',
                }}
              />
              <div className="flex flex-col leading-none">
                <span
                  style={{ fontFamily: "'Inter', sans-serif", fontWeight: 800, letterSpacing: '0.08em' }}
                  className="text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-purple-300 to-indigo-300 text-sm tracking-widest uppercase"
                >
                  TRADIGLO
                </span>
                <span className="text-[9px] tracking-[0.25em] uppercase font-semibold" style={{ color: 'rgba(139,92,246,0.5)' }}>Singapore</span>
              </div>
            </a>
            <div className="flex flex-col gap-2.5 pt-1">
              <a
                href={WA_CHANNEL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs font-medium transition-opacity hover:opacity-80"
                style={{ color: '#25D366' }}
              >
                {WA_ICON}
<span>WhatsApp Channel Singapore</span>
              </a>
              <a
                href={WA_ADMIN}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs text-[#25D366] hover:text-[#4ade80] transition-colors font-medium"
              >
                {WA_ICON}
                <span>Contact WhatsApp Admin Singapore</span>
              </a>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ borderTop: '1px solid rgba(139,92,246,0.1)' }} className="pt-8 space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <p className="text-[11px] text-[#A6A8C3]/40">© 2025 Tradiglo. All rights reserved.</p>
            <div className="flex items-center gap-2">
              <MapPin className="w-3 h-3 text-[#A6A8C3]/40" />
              <span className="text-[11px] text-[#A6A8C3]/40">Singapore</span>
              <span className="text-[#A6A8C3]/30">·</span>
              <a href="/community" className="text-[11px] text-[#A6A8C3]/40 hover:text-[#A6A8C3] transition-colors">Global Community</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
