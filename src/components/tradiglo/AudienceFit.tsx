'use client';

import { CheckCircle2, XCircle } from 'lucide-react';

const suitable = [
  'Trader Malaysia yang fokus Crypto (BTC, ETH)',
  'Trader Malaysia yang fokus XAUUSD dan Forex',
  'Trader yang mahu market update melalui WhatsApp',
  'Beginner yang mahu belajar membaca signal crypto dan forex',
  'Trader yang mahu lebih disiplin dalam semua market',
  'Trader yang mahu memahami risiko sebelum entry',
];

const notSuitable = [
  'Individu yang mencari profit terjamin dari crypto',
  'Individu yang mahu skim cepat kaya atau pump-and-dump',
  'Individu yang tidak mahu belajar risiko',
  'Individu yang menggunakan duit pinjaman untuk trading',
  'Individu yang mahu entry tanpa Stop Loss',
];

export default function AudienceFit() {
  return (
    <section className="py-20 bg-[#080b1a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-4">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">
            Untuk Siapa Tradiglo{' '}
            <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">Sesuai?</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Suitable */}
          <div className="p-6 rounded-2xl bg-indigo-500/5 border border-indigo-500/15">
            <div className="flex items-center gap-2 mb-5">
              <CheckCircle2 className="w-5 h-5 text-indigo-400" />
              <h3 className="font-bold text-indigo-400 text-sm uppercase tracking-wider">Sesuai Untuk</h3>
            </div>
            <ul className="space-y-3">
              {suitable?.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400/60 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-300 leading-snug">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Not suitable */}
          <div className="p-6 rounded-2xl bg-red-500/5 border border-red-500/15">
            <div className="flex items-center gap-2 mb-5">
              <XCircle className="w-5 h-5 text-red-400" />
              <h3 className="font-bold text-red-400 text-sm uppercase tracking-wider">Tidak Sesuai Untuk</h3>
            </div>
            <ul className="space-y-3">
              {notSuitable?.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <XCircle className="w-4 h-4 text-red-400/60 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-300 leading-snug">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
