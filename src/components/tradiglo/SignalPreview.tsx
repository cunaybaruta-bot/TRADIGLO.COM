'use client';

import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';

const signals = [
  {
    market: 'BTCUSDT',
    setup: 'BUY',
    entry: '67,200 – 67,500',
    sl: '66,400',
    tp1: '68,200',
    tp2: '69,000',
    tp3: '70,500',
    risk: 'Maksimum 1% setiap trade',
    nota: 'Tunggu confirmation di support. Jangan entry jika harga sudah terlalu jauh dari zone.',
    color: '#818cf8',
    label: 'Crypto',
  },
  {
    market: 'XAUUSD',
    setup: 'BUY',
    entry: '2325.00 – 2327.00',
    sl: '2318.00',
    tp1: '2332.00',
    tp2: '2338.00',
    tp3: '2345.00',
    risk: 'Maksimum 1% setiap trade',
    nota: 'Tunggu confirmation. Jangan entry jika harga sudah terlalu jauh dari zone.',
    color: '#D4AF37',
    label: 'Gold',
  },
];

export default function SignalPreview() {
  const [active, setActive] = useState(0);
  const sig = signals?.[active];

  return (
    <section className="py-20 bg-[#080b1a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-4">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">
            Contoh Format Signal{' '}
            <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">Tradiglo</span>
          </h2>
          <p className="text-gray-400">
            Setiap signal disusun agar mudah dibaca, tetapi pengguna tetap perlu menilai risiko masing-masing sebelum entry.
          </p>
          {/* Market Tabs */}
          <div className="flex justify-center gap-2 pt-2">
            {signals?.map((s, i) => (
              <button
                key={s?.market}
                onClick={() => setActive(i)}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  active === i
                    ? 'text-white border' :'bg-white/5 text-gray-400 border border-white/5 hover:border-white/15'
                }`}
                style={active === i ? { backgroundColor: `${s?.color}20`, borderColor: `${s?.color}50`, color: s?.color } : {}}
              >
                {s?.label} — {s?.market}
              </button>
            ))}
          </div>
        </div>

        <div className="max-w-lg mx-auto">
          {/* Signal Card */}
          <div className="relative">
            <div
              className="absolute -inset-3 rounded-3xl blur-xl transition-all duration-500"
              style={{ background: `radial-gradient(ellipse, ${sig?.color}20, transparent)` }}
            />
            <div className="relative bg-[#0d1030] border border-white/10 rounded-2xl overflow-hidden shadow-2xl" style={{ borderColor: `${sig?.color}25` }}>
              {/* Card top bar */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/5" style={{ backgroundColor: `${sig?.color}08` }}>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: sig?.color }} />
                  <span className="text-sm font-bold tracking-wide" style={{ color: sig?.color }}>{sig?.market}</span>
                </div>
                <span className="px-3 py-1 rounded-lg font-bold text-xs text-emerald-400 bg-emerald-500/15 border border-emerald-500/30">
                  ▲ {sig?.setup}
                </span>
              </div>

              {/* Signal rows */}
              <div className="px-6 py-5 space-y-0">
                {[
                  { label: 'Entry Zone', value: sig?.entry, color: 'text-white' },
                  { label: 'Stop Loss', value: sig?.sl, color: 'text-red-400' },
                  { label: 'TP1', value: sig?.tp1, color: 'text-emerald-400' },
                  { label: 'TP2', value: sig?.tp2, color: 'text-emerald-400' },
                  { label: 'TP3', value: sig?.tp3, color: 'text-emerald-400' },
                  { label: 'Risk', value: sig?.risk, color: 'text-violet-400' },
                ]?.map(({ label, value, color }) => (
                  <div key={label} className="flex justify-between items-center py-3 border-b border-white/[0.04] last:border-0">
                    <span className="text-xs text-gray-500 font-medium">{label}</span>
                    <span className={`text-sm font-mono font-semibold ${color}`}>{value}</span>
                  </div>
                ))}
              </div>

              {/* Nota */}
              <div className="px-6 pb-5">
                <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/15">
                  <p className="text-xs text-amber-400/80 leading-relaxed">
                    <span className="font-semibold">Nota:</span> {sig?.nota}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="mt-5 p-4 rounded-xl bg-white/[0.02] border border-white/5 text-center space-y-2">
            <p className="text-xs font-semibold text-gray-400 flex items-center justify-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
              Contoh paparan sahaja. Bukan arahan trading sebenar.
            </p>
            <p className="text-xs text-gray-600 leading-relaxed">
              Signal bukan jaminan profit. Signal hanyalah rujukan analisis. Pengguna wajib mengurus risiko sendiri.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
