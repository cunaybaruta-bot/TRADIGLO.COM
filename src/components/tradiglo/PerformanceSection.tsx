'use client';

import { BarChart2, Percent, TrendingDown, Calendar, Activity, Bitcoin } from 'lucide-react';
import Icon from '@/components/ui/AppIcon';


const stats = [
  { icon: Bitcoin, label: 'Total Signal Crypto', value: 'Akan Dikemaskini' },
  { icon: Activity, label: 'Total Signal Forex & Gold', value: 'Akan Dikemaskini' },
  { icon: Percent, label: 'Win Rate', value: 'Akan Dikemaskini' },
  { icon: BarChart2, label: 'Average Risk-Reward', value: 'Akan Dikemaskini' },
  { icon: TrendingDown, label: 'Max Drawdown', value: 'Akan Dikemaskini' },
  { icon: Calendar, label: 'Rekap Bulanan', value: 'Akan Dikemaskini' },
];

export default function PerformanceSection() {
  return (
    <section className="py-20" style={{ background: '#07091F' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-4">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full"
            style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)' }}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#8B5CF6' }}>Ketelusan</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">
            Ketelusan Lebih Penting Daripada{' '}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(90deg, #A78BFA, #6366F1)' }}
            >
              Janji Manis
            </span>
          </h2>
          <p className="text-[#A6A8C3] leading-relaxed">
            Tradiglo tidak akan memaparkan angka palsu atau klaim prestasi yang tidak boleh disemak. Data performa hanya akan dipaparkan apabila rekod mencukupi dan disusun secara bertanggungjawab.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {stats?.map(({ icon: Icon, label, value }) => (
            <div
              key={label}
              className="p-5 rounded-2xl text-center space-y-3 transition-all hover:scale-[1.02]"
              style={{
                background: '#11143A',
                border: '1px solid rgba(139,92,246,0.18)',
              }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto"
                style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)' }}
              >
                <Icon className="w-4 h-4" style={{ color: '#8B5CF6' }} />
              </div>
              <div>
                <p className="text-xs text-[#A6A8C3]/60 mb-1">{label}</p>
                <p className="text-sm font-semibold italic" style={{ color: '#A78BFA' }}>{value}</p>
              </div>
            </div>
          ))}
        </div>

        <div
          className="text-center p-5 rounded-2xl max-w-xl mx-auto"
          style={{ background: '#11143A', border: '1px solid rgba(139,92,246,0.2)' }}
        >
          <p className="text-sm font-semibold" style={{ color: '#A78BFA' }}>
            Kami memilih ketelusan berbanding janji keuntungan yang berlebihan.
          </p>
          <p className="text-xs text-[#A6A8C3]/60 mt-1">
            Data akan dikemaskini secara berkala apabila rekod signal mencukupi.
          </p>
        </div>
      </div>
    </section>
  );
}
