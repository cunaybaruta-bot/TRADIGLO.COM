'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    q: 'Adakah Tradiglo menjamin keuntungan?',
    a: 'Tidak. Tradiglo tidak menjamin keuntungan. Trading Forex, Gold, Crypto, CFD, dan instrumen berleveraj mempunyai risiko tinggi. Signal hanyalah rujukan analisis dan pengguna bertanggungjawab sepenuhnya terhadap keputusan trading masing-masing.',
  },
  {
    q: 'Adakah Tradiglo menggunakan Telegram?',
    a: 'Tidak. Untuk Malaysia, Tradiglo menggunakan WhatsApp Channel dan WhatsApp Admin sahaja. Tiada Telegram.',
  },
  {
    q: 'Bagaimana cara daftar?',
    a: 'Klik butang "Daftar Melalui WhatsApp Admin", isi maklumat ringkas, kemudian anda akan diarahkan ke WhatsApp Admin Malaysia untuk proses onboarding.',
  },
  {
    q: 'Adakah signal sesuai untuk beginner?',
    a: 'Ya, tetapi beginner perlu memahami bahawa signal bukan jaminan profit. Anda perlu belajar asas risiko, lot, Stop Loss, Take Profit, dan tidak entry secara membuta tuli — terutama dalam market crypto yang sangat volatile.',
  },
  {
    q: 'Market apa yang difokuskan?',
    a: 'Fokus utama Tradiglo ialah Crypto (BTC, ETH), XAUUSD (Gold), dan pasangan Forex utama seperti EURUSD dan GBPUSD.',
  },
  {
    q: 'Adakah saya boleh guna broker sendiri?',
    a: 'Ya. Pengguna bertanggungjawab memilih broker atau exchange masing-masing. Pastikan anda memahami risiko, kos trading, spread, leverage, dan syarat platform sebelum menggunakan akaun real.',
  },
  {
    q: 'Berapa modal minimum diperlukan?',
    a: 'Tradiglo tidak menetapkan modal wajib. Modal bergantung kepada broker, strategi, toleransi risiko, dan kemampuan kewangan pengguna. Jangan gunakan duit pinjaman atau wang keperluan harian untuk trading.',
  },
  {
    q: 'Adakah Tradiglo mengurus dana pengguna?',
    a: 'Tidak. Tradiglo tidak mengurus dana pengguna. Pengguna membuat keputusan sendiri dan bertanggungjawab terhadap akaun trading masing-masing.',
  },
  {
    q: 'Adakah ini nasihat kewangan peribadi?',
    a: 'Tidak. Semua kandungan Tradiglo adalah untuk tujuan pendidikan, maklumat umum, dan rujukan analisis pasaran sahaja. Ia bukan nasihat kewangan peribadi.',
  },
  {
    q: 'Apa beza WhatsApp Channel dan WhatsApp Admin?',
    a: 'WhatsApp Channel digunakan untuk market update, signal Crypto/Forex/Gold, dan edukasi. WhatsApp Admin digunakan untuk pendaftaran, onboarding, dan pertanyaan pengguna secara peribadi.',
  },
];

export default function FAQSection() {
  const [open, setOpen] = useState<number | null>(null);

  const toggle = (i: number) => {
    setOpen(open === i ? null : i);
    if (typeof window !== 'undefined') (window as any).gtag?.('event', 'click_faq', { question_index: i });
  };

  return (
    <section id="faq" className="py-20" style={{ background: '#0B0E2D' }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14 space-y-4">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full"
            style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)' }}
          >
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#8B5CF6' }}>Soalan Lazim</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">
            Soalan Yang Kerap Ditanya
          </h2>
          <p className="text-[#A6A8C3]">Jawapan kepada soalan yang kerap ditanya tentang Tradiglo Malaysia.</p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="rounded-xl overflow-hidden transition-all duration-200"
              style={{
                background: '#11143A',
                border: open === i ? '1px solid rgba(139,92,246,0.4)' : '1px solid rgba(139,92,246,0.15)',
                boxShadow: open === i ? '0 4px 20px rgba(139,92,246,0.1)' : 'none',
              }}
            >
              <button
                className="w-full flex items-center justify-between px-5 py-4 text-left gap-4"
                onClick={() => toggle(i)}
              >
                <span
                  className="text-sm font-semibold leading-snug transition-colors"
                  style={{ color: open === i ? '#A78BFA' : '#FFFFFF' }}
                >
                  {faq.q}
                </span>
                <ChevronDown
                  className="w-4 h-4 flex-shrink-0 transition-all duration-200"
                  style={{
                    color: open === i ? '#8B5CF6' : '#A6A8C3',
                    transform: open === i ? 'rotate(180deg)' : 'rotate(0deg)',
                  }}
                />
              </button>
              {open === i && (
                <div
                  className="px-5 pb-5"
                  style={{ borderTop: '1px solid rgba(139,92,246,0.1)' }}
                >
                  <p className="text-sm text-[#A6A8C3] leading-relaxed pt-3">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
