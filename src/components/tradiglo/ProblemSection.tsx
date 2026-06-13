'use client';

import { XCircle } from 'lucide-react';

const problems = [
  { title: 'Entry Tanpa Pelan', desc: 'Masuk market tanpa analisis atau struktur yang jelas.' },
  { title: 'Lot Terlalu Besar', desc: 'Saiz posisi melebihi toleransi risiko yang sepatutnya.' },
  { title: 'Tiada Stop Loss', desc: 'Trading tanpa had kerugian — terutama berbahaya dalam crypto.' },
  { title: 'Overtrade Selepas Rugi', desc: 'Cuba balas kerugian dengan membuka terlalu banyak trade.' },
  { title: 'Tidak Faham Risk-Reward', desc: 'Tidak mengira nisbah risiko berbanding potensi keuntungan.' },
  { title: 'Emosi Menguasai Keputusan', desc: 'Keputusan trading dipengaruhi ketakutan atau tamak.' },
];

export default function ProblemSection() {
  return (
    <section className="py-20" style={{ background: '#07091F' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-4">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
            <span className="text-xs font-bold text-red-400 uppercase tracking-wider">Masalah Sebenar</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight">
            Ramai Trader Gagal Bukan Kerana Tiada Signal,{' '}
            <span className="text-red-400">Tetapi Kerana Tiada Struktur</span>
          </h2>
          <p className="text-[#A6A8C3] leading-relaxed">
            Sama ada trading Crypto, Forex, atau Gold — masalah utama bukan kekurangan signal, tetapi kekurangan disiplin dan struktur dalam pengurusan risiko.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {problems.map(({ title, desc }) => (
            <div
              key={title}
              className="group p-5 rounded-2xl transition-all duration-300 hover:scale-[1.02]"
              style={{
                background: '#11143A',
                border: '1px solid rgba(239,68,68,0.12)',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.border = '1px solid rgba(239,68,68,0.28)';
                (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 24px rgba(239,68,68,0.08)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.border = '1px solid rgba(239,68,68,0.12)';
                (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
              }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center mb-4"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
              >
                <XCircle className="w-4 h-4 text-red-400" />
              </div>
              <h3 className="font-bold text-white text-sm mb-2">{title}</h3>
              <p className="text-xs text-[#A6A8C3] leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
