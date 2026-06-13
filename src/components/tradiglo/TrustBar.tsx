'use client';

import { ShieldCheck, TrendingDown, AlertTriangle, UserCheck, Bell } from 'lucide-react';
import Icon from '@/components/ui/AppIcon';


const items = [
  { icon: ShieldCheck, text: 'Tiada Janji Profit' },
  { icon: TrendingDown, text: 'Bukan Skim Cepat Kaya' },
  { icon: AlertTriangle, text: 'Risiko Dinyatakan Jelas' },
  { icon: Bell, text: 'WhatsApp Channel Rasmi' },
  { icon: UserCheck, text: 'Daftar Melalui Admin Malaysia' },
];

export default function TrustBar() {
  return (
    <section
      className="py-10"
      style={{ background: '#0B0E2D', borderTop: '1px solid rgba(139,92,246,0.12)', borderBottom: '1px solid rgba(139,92,246,0.12)' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-[10px] font-bold uppercase tracking-[0.2em] text-[#A6A8C3]/50 mb-6">
          Trading Perlu Struktur, Bukan Janji Manis
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {items?.map(({ icon: Icon, text }) => (
            <div
              key={text}
              className="flex items-center gap-2.5 p-3.5 rounded-xl transition-all hover:scale-[1.02]"
              style={{
                background: '#11143A',
                border: '1px solid rgba(139,92,246,0.18)',
              }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)' }}
              >
                <Icon className="w-3.5 h-3.5" style={{ color: '#8B5CF6' }} />
              </div>
              <span className="text-xs font-medium text-[#A6A8C3] leading-snug">{text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
