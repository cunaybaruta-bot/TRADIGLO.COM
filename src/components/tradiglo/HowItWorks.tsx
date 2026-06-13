'use client';

import { Radio, BookOpen, Shield, UserPlus } from 'lucide-react';
import Icon from '@/components/ui/AppIcon';


const steps = [
  {
    icon: Radio,
    step: '01',
    title: 'Join WhatsApp Channel',
    desc: 'Dapatkan market update dan signal Crypto, Forex, dan Gold melalui Channel rasmi Tradiglo Malaysia.',
    color: '#25D366',
  },
  {
    icon: BookOpen,
    step: '02',
    title: 'Baca Signal & Nota Risiko',
    desc: 'Semak entry, Stop Loss, Take Profit, dan risk note sebelum membuat keputusan — terutama untuk crypto yang volatile.',
    color: '#818cf8',
  },
  {
    icon: Shield,
    step: '03',
    title: 'Gunakan Pengurusan Risiko',
    desc: 'Tentukan lot atau saiz posisi, had risiko, dan jangan entry jika setup tidak sesuai dengan pelan anda.',
    color: '#a78bfa',
  },
  {
    icon: UserPlus,
    step: '04',
    title: 'Daftar Melalui Admin',
    desc: 'Hubungi WhatsApp Admin Malaysia untuk onboarding dan panduan lanjut termasuk asas crypto trading.',
    color: '#818cf8',
  },
];

export default function HowItWorks() {
  return (
    <section id="cara-kerja" className="py-20 bg-[#0d1030]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-4">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">
            Cara Bermula Dengan{' '}
            <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">Tradiglo</span>
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {steps?.map(({ icon: Icon, step, title, desc, color }) => (
            <div
              key={step}
              className="relative p-6 rounded-2xl bg-[#080b1a] border border-indigo-500/10 hover:border-indigo-500/20 transition-all group overflow-hidden"
            >
              {/* Step number watermark */}
              <span
                className="absolute top-3 right-4 text-5xl font-black opacity-[0.06] select-none"
                style={{ color }}
              >
                {step}
              </span>
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center mb-5"
                style={{ backgroundColor: `${color}15`, border: `1px solid ${color}25` }}
              >
                <Icon className="w-5 h-5" style={{ color }} />
              </div>
              <h3 className="font-bold text-white text-sm mb-2 leading-snug">{title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
