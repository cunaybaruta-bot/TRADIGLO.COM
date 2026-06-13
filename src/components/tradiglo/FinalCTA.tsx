'use client';

const WA_CHANNEL = 'https://whatsapp.com/channel/0029VbDNq7VGzzKIpSf7VE1g';
const WA_ADMIN = 'https://wa.me/60147792325?text=Hi%20Tradiglo%2C%20saya%20berminat%20untuk%20daftar.%20Saya%20dari%20Malaysia%20dan%20ingin%20tahu%20cara%20bermula%20dengan%20Tradiglo.';

export default function FinalCTA() {
  const trackChannel = () => {
    if (typeof window !== 'undefined') (window as any).gtag?.('event', 'click_final_cta', { type: 'channel' });
  };
  const trackAdmin = () => {
    if (typeof window !== 'undefined') (window as any).gtag?.('event', 'click_final_cta', { type: 'admin' });
  };

  return (
    <section className="py-24 bg-[#080b1a] relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,rgba(99,102,241,0.10),transparent)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_30%_at_20%_80%,rgba(139,92,246,0.07),transparent)]" />
      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
        <div className="space-y-4">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight">
            Mulakan Dengan{' '}
            <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
              Struktur
            </span>
            , Bukan Dengan Emosi
          </h2>
          <p className="text-gray-400 leading-relaxed max-w-xl mx-auto">
            Join WhatsApp Channel Tradiglo Malaysia untuk mengikuti market update dan signal Crypto, Forex, dan Gold. Jika anda mahu daftar dan mendapatkan panduan, hubungi WhatsApp Admin Malaysia.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href={WA_CHANNEL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={trackChannel}
            className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white font-semibold hover:opacity-90 transition-all shadow-xl shadow-[#25D366]/20 active:scale-95"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Join WhatsApp Channel
          </a>
          <a
            href={WA_ADMIN}
            target="_blank"
            rel="noopener noreferrer"
            onClick={trackAdmin}
            className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl border border-indigo-400/40 text-indigo-300 font-semibold hover:bg-indigo-500/10 transition-all active:scale-95"
          >
            Daftar Melalui WhatsApp Admin
          </a>
        </div>
      </div>
    </section>
  );
}
