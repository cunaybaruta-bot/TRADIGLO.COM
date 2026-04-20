'use client';
import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface Mover {
  rank: number;
  name: string;
  price: string;
  change: string;
  isPositive: boolean;
}

export default function TopMovers() {
  const { t } = useLanguage();

  const movers: Mover[] = [
    { rank: 1, name: 'Solana', price: '$84.94', change: '+3.42%', isPositive: true },
    { rank: 2, name: 'BNB', price: '$635.01', change: '+3.28%', isPositive: true },
    { rank: 3, name: 'Bitcoin', price: '$68,455.00', change: '+3.23%', isPositive: true },
    { rank: 4, name: 'Ethereum', price: '$1,994.15', change: '+2.44%', isPositive: true },
    { rank: 5, name: 'XRP', price: '$1.36', change: '+1.05%', isPositive: true },
  ];

  return (
    <section className="bg-black py-3 sm:py-4 px-4 sm:px-6">
      <div className="container mx-auto">
        <div className="bg-black border border-[#1e2a4a] rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-[#1e2a4a]">
            <div className="flex items-center gap-2 sm:gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400 sm:w-5 sm:h-5">
                <path d="M3 3v16a2 2 0 0 0 2 2h16"></path>
                <path d="M18 17V9"></path>
                <path d="M13 17V5"></path>
                <path d="M8 17v-3"></path>
              </svg>
              <span className="text-white font-semibold text-sm sm:text-base">{t('top_movers_title')}</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full border border-blue-500/40 bg-transparent">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
              <span className="text-blue-400 text-xs font-medium">{t('top_movers_live')}</span>
            </div>
          </div>

          {/* Movers list */}
          <div className="divide-y divide-[#1e2a4a]">
            {movers.map((mover) => (
              <div
                key={mover.rank}
                className="flex items-center justify-between px-4 sm:px-5 min-h-[44px] hover:bg-white/5 cursor-pointer transition-all duration-300"
              >
                <div className="flex items-center gap-3 sm:gap-4">
                  <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-md bg-orange-500/20 text-orange-400 text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {mover.rank}
                  </span>
                  <div>
                    <div className="text-white text-sm font-semibold">{mover.name}</div>
                    <div className="text-xs font-mono transition-colors duration-300 text-slate-400">{mover.price}</div>
                  </div>
                </div>
                <span
                  className={`inline-flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-md text-xs font-bold transition-all duration-300 ${
                    mover.isPositive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}
                >
                  <span className="inline-block transition-transform duration-300">
                    {mover.isPositive ? '▲' : '▼'}
                  </span>
                  {mover.change}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
