'use client';

import { Target, Shield, BarChart2, BookOpen, RefreshCw, Bitcoin } from 'lucide-react';
import Icon from '@/components/ui/AppIcon';


const features = [
  {
    icon: Bitcoin,
    label: 'Signal XAUUSD, Forex & Crypto',
    desc: 'Signal merangkumi XAUUSD (Gold), pasangan Forex utama, BTC, ETH, dan aset crypto pilihan.',
  },
  {
    icon: Target,
    label: 'Entry, Stop Loss & Take Profit Yang Jelas',
    desc: 'Setiap signal disusun lengkap dengan parameter entry, SL, dan TP yang tersusun.',
  },
  {
    icon: Shield,
    label: 'Nota Risiko Setiap Signal',
    desc: 'Risiko dinyatakan secara eksplisit — penting untuk crypto yang bergerak pantas.',
  },
  {
    icon: BarChart2,
    label: 'Kemas Kini Pasaran Harian',
    desc: 'Pandangan pasaran harian merangkumi crypto, forex, dan gold untuk konteks entry.',
  },
  {
    icon: BookOpen,
    label: 'Panduan Asas Lot & Risiko',
    desc: 'Edukasi ringkas termasuk cara mengurus risiko dalam trading crypto vs forex.',
  },
  {
    icon: RefreshCw,
    label: 'Rekap Mingguan',
    desc: 'Ringkasan signal dan prestasi merangkumi semua market setiap minggu.',
  },
];

export default function SolutionSection() {
  return (
    <section id="signal" className="py-20" style={{ background: '#0B0E2D' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-4">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full"
            style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)' }}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#8B5CF6' }}>Penyelesaian</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">
            Tradiglo Membantu Anda Membaca Signal{' '}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(90deg, #A78BFA, #6366F1)' }}
            >
              Dengan Lebih Tersusun
            </span>
          </h2>
          <p className="text-[#A6A8C3] leading-relaxed">
            Signal Crypto, Forex, dan Gold — lengkap dengan market update, nota risiko, dan panduan asas supaya trader memahami konteks pasaran dan menjaga disiplin risiko.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map(({ icon: Icon, label, desc }) => (
            <div
              key={label}
              className="group p-5 rounded-2xl transition-all duration-300 hover:scale-[1.02]"
              style={{
                background: '#11143A',
                border: '1px solid rgba(139,92,246,0.15)',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.border = '1px solid rgba(139,92,246,0.35)';
                (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 24px rgba(139,92,246,0.1)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.border = '1px solid rgba(139,92,246,0.15)';
                (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
              }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)' }}
              >
                <Icon className="w-5 h-5" style={{ color: '#8B5CF6' }} />
              </div>
              <h3 className="font-bold text-white text-sm mb-2">{label}</h3>
              <p className="text-xs text-[#A6A8C3] leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
