'use client';
import React from 'react';

interface CryptoCardProps {
  name: string;
  price: string;
  change: string;
  isPositive: boolean;
}

function CryptoCard({ name, price, change, isPositive }: CryptoCardProps) {
  return (
    <div className="bg-black border border-[#1e2a4a] rounded-2xl p-4 sm:p-5 hover:border-blue-500/60 hover:bg-[#0f0f0f] hover:scale-[1.02] transition-all duration-200 cursor-pointer select-none">
      <div className="flex items-start justify-between mb-3 sm:mb-4">
        <div>
          <div className="text-slate-300 text-sm font-medium mb-1">{name}</div>
        </div>
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[#1a2a4a] flex items-center justify-center flex-shrink-0">
          {isPositive ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-400">
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
              <polyline points="16 7 22 7 22 13"></polyline>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400">
              <polyline points="22 17 13.5 8.5 8.5 13.5 2 7"></polyline>
              <polyline points="16 17 22 17 22 11"></polyline>
            </svg>
          )}
        </div>
      </div>
      <div className="text-white text-xl sm:text-2xl font-bold mb-2 sm:mb-3">{price}</div>
      <div className="flex items-center gap-2">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold ${
          isPositive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
        }`}>
          {change}
        </span>
        <span className="text-slate-500 text-xs font-medium tracking-wider">CRYPTO</span>
      </div>
    </div>
  );
}

export default function CryptoCards() {
  const cards: CryptoCardProps[] = [
    { name: 'Solana', price: '$84.94', change: '+3.42%', isPositive: true },
    { name: 'Ethereum', price: '$1,994.15', change: '+2.44%', isPositive: true },
    { name: 'XRP', price: '$1.36', change: '+1.05%', isPositive: true },
    { name: 'BNB', price: '$635.01', change: '+3.28%', isPositive: true },
  ];

  return (
    <section className="bg-black py-6 sm:py-8 md:py-12 px-4 sm:px-6">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {cards.map((card) => (
            <CryptoCard key={card.name} {...card} />
          ))}
        </div>
      </div>
    </section>
  );
}
