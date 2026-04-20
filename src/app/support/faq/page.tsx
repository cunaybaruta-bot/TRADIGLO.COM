'use client';
import Link from 'next/link';
import { useState } from 'react';

const faqs = [
  { q: 'What is Tradiglo?', a: 'Tradiglo is a comprehensive cryptocurrency market data and trading platform that provides real-time prices, market analysis, and trading tools for crypto enthusiasts and investors.' },
  { q: 'How do I create an account?', a: 'Click the "Sign Up" button on the homepage, fill in your details, verify your email address, and complete the identity verification process to start trading.' },
  { q: 'What cryptocurrencies are supported?', a: 'Tradiglo supports thousands of cryptocurrencies including Bitcoin (BTC), Ethereum (ETH), and many altcoins. Visit our Markets page to see the full list.' },
  { q: 'How do I deposit funds?', a: 'Navigate to your Dashboard, click on "Deposit", select your preferred payment method, and follow the instructions. We support bank transfers, credit cards, and crypto deposits.' },
  { q: 'Is my data secure?', a: 'Yes. We use industry-standard encryption, two-factor authentication, and are SOC 2 Type 2 certified to ensure the highest level of security for your data and funds.' },
  { q: 'What is copy trading?', a: 'Copy trading allows you to automatically replicate the trades of experienced traders. Visit our Copy Trading page to browse top traders and start copying their strategies.' },
  { q: 'How do I withdraw funds?', a: 'Go to your Dashboard, click "Withdraw", enter the amount and destination, and confirm the transaction. Withdrawals are processed within 1-3 business days.' },
  { q: 'Are there trading fees?', a: 'Tradiglo charges competitive trading fees starting from 0.1% per trade. Premium members enjoy reduced fees. Check our pricing page for full details.' },
];

export default function FAQPage() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-8">
          <Link href="/" className="text-gray-400 hover:text-white text-sm transition-colors">← Back to Home</Link>
        </div>
        <h1 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-500 to-purple-500">Frequently Asked Questions</h1>
        <p className="text-gray-400 text-lg mb-8">Find answers to the most common questions about Tradiglo.</p>
        <div className="space-y-3">
          {faqs?.map((faq, i) => (
            <div key={i} className="border border-white/10 rounded-xl overflow-hidden">
              <button onClick={() => setOpen(open === i ? null : i)} className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-white/5 transition-colors">
                <span className="text-white font-medium text-sm">{faq?.q}</span>
                <span className="text-gray-400 text-lg ml-4">{open === i ? '−' : '+'}</span>
              </button>
              {open === i && (
                <div className="px-6 pb-4 border-t border-white/5">
                  <p className="text-gray-400 text-sm pt-3 leading-relaxed">{faq?.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
