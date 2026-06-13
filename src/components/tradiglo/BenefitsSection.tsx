'use client';

import { AlignLeft, ShieldAlert, MessageCircle, MapPin, GraduationCap, HandshakeIcon, Bitcoin } from 'lucide-react';
import Icon from '@/components/ui/AppIcon';


const benefits = [
  {
    icon: Bitcoin,
    title: 'Merangkumi Crypto, Gold & Forex',
    desc: 'Signal dan market update merangkumi BTC, ETH, XAUUSD, dan pasangan Forex utama — semua dalam satu channel.',
    color: '#818cf8',
    span: 'lg:col-span-2',
  },
  {
    icon: AlignLeft,
    title: 'Signal lebih tersusun',
    desc: 'Format signal dibuat ringkas agar mudah dibaca oleh trader baru dan berpengalaman.',
    color: '#a78bfa',
    span: '',
  },
  {
    icon: ShieldAlert,
    title: 'Fokus kepada risiko',
    desc: 'Setiap signal perlu dibaca bersama Stop Loss, risk note, dan kawalan lot — terutama untuk crypto yang volatile.',
    color: '#818cf8',
    span: '',
  },
  {
    icon: MessageCircle,
    title: 'WhatsApp lebih mudah',
    desc: 'Semua update utama boleh diterima melalui WhatsApp Channel tanpa perlu Telegram.',
    color: '#25D366',
    span: '',
  },
  {
    icon: MapPin,
    title: 'Sesuai untuk trader Malaysia',
    desc: 'Bahasa, alur pendaftaran, dan onboarding disesuaikan untuk pengguna Malaysia.',
    color: '#a78bfa',
    span: '',
  },
  {
    icon: GraduationCap,
    title: 'Edukasi berterusan',
    desc: 'Bukan sekadar signal, tetapi juga panduan memahami entry, risiko, dan asas crypto trading.',
    color: '#818cf8',
    span: 'lg:col-span-2',
  },
  {
    icon: HandshakeIcon,
    title: 'Tidak menjanjikan profit',
    desc: 'Tradiglo menjaga komunikasi yang bertanggungjawab dan tidak menjual mimpi cepat kaya.',
    color: '#a78bfa',
    span: '',
  },
];

export default function BenefitsSection() {
  return (
    <section id="kelebihan" className="py-20 bg-[#0d1030]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-4">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">
            Kelebihan{' '}
            <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">Tradiglo</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {benefits?.map(({ icon: Icon, title, desc, color, span }) => (
            <div
              key={title}
              className={`p-6 rounded-2xl bg-[#080b1a] border border-indigo-500/10 hover:border-indigo-500/20 transition-all group ${span}`}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                style={{ backgroundColor: `${color}12`, border: `1px solid ${color}25` }}
              >
                <Icon className="w-5 h-5" style={{ color }} />
              </div>
              <h3 className="font-bold text-white text-sm mb-2">{title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
