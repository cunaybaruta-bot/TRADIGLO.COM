'use client';
import React from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function ReferralPage() {
  const steps = [
    {
      number: '01',
      title: 'Sign Up & Get Your Link',
      description: 'Create your Tradiglo account and receive a unique affiliate link from your dashboard.',
    },
    {
      number: '02',
      title: 'Invite Your Network',
      description: 'Share your affiliate link with friends, family, or your community through any channel.',
    },
    {
      number: '03',
      title: 'They Join & Deposit',
      description: 'When someone registers via your link and makes their first deposit, the affiliate is recorded.',
    },
    {
      number: '04',
      title: 'Earn 25% Reward',
      description: 'You earn 25% of the total initial deposit made by each member you referred.',
    },
  ];

  const faqs = [
    {
      q: 'How much do I earn per affiliate?',
      a: 'You earn 25% of the total initial deposit made by each new member you successfully refer to Tradiglo.',
    },
    {
      q: 'When is the reward paid out?',
      a: 'Rewards are paid out once your accumulated affiliate earnings reach $500. This threshold ensures efficient processing.',
    },
    {
      q: 'How long does the affiliate program last?',
      a: 'Your affiliate rewards are valid for as long as both you and the referred member remain active Tradiglo members — there is no expiry.',
    },
    {
      q: 'Is there a limit to how many people I can refer?',
      a: 'No limit. You can refer as many people as you like and earn 25% from each of their initial deposits.',
    },
    {
      q: 'How do I track my affiliates?',
      a: 'Once you are a member, your dashboard will display your affiliate link, the number of referred members, and your accumulated reward balance.',
    },
    {
      q: 'Does the referred member get any benefit?',
      a: 'Yes — referred members may receive a welcome bonus upon joining. Check the latest promotions on your dashboard for details.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden py-20 md:py-28">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-blue-600/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-[400px] h-[300px] bg-purple-600/10 rounded-full blur-3xl" />
          </div>
          <div className="container mx-auto px-4 sm:px-6 relative z-10 text-center">
            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30 mb-6 tracking-widest uppercase">
              Affiliate Program
            </span>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Earn{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-500">
                25%
              </span>{' '}
              for Every Friend You Invite
            </h1>
            <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
              Invite friends to join Tradiglo and earn 25% of their total initial deposit — forever, with no expiry, as long as you both remain members.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth"
                className="inline-flex items-center justify-center rounded-lg px-8 py-3.5 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-all"
              >
                Join & Start Referring
              </Link>
              <Link
                href="/auth?tab=signin"
                className="inline-flex items-center justify-center rounded-lg px-8 py-3.5 text-sm font-semibold border border-white/20 text-slate-300 hover:bg-white/10 hover:text-white transition-all"
              >
                Sign In to Dashboard
              </Link>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="border-y border-white/10 bg-white/5 py-12">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
              <div>
                <p className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 mb-2">25%</p>
                <p className="text-slate-400 text-sm">Commission on Initial Deposit</p>
              </div>
              <div>
                <p className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 mb-2">$500</p>
                <p className="text-slate-400 text-sm">Minimum Payout Threshold</p>
              </div>
              <div>
                <p className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-2">∞</p>
                <p className="text-slate-400 text-sm">Lifetime Validity</p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20 md:py-24">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
              <p className="text-slate-400 max-w-xl mx-auto">Four simple steps to start earning with the Tradiglo Affiliate Program.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {steps?.map((step) => (
                <div
                  key={step?.number}
                  className="relative rounded-xl border border-white/10 bg-white/5 p-6 hover:border-blue-500/40 hover:bg-white/8 transition-all"
                >
                  <span className="text-5xl font-black text-white/5 absolute top-4 right-5 select-none leading-none">
                    {step?.number}
                  </span>
                  <div className="w-10 h-10 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center mb-4">
                    <span className="text-blue-400 font-bold text-sm">{step?.number}</span>
                  </div>
                  <h3 className="font-semibold text-white mb-2">{step?.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{step?.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Program Details */}
        <section className="py-20 md:py-24 bg-white/3 border-y border-white/10">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-14">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Program Details</h2>
                <p className="text-slate-400 max-w-xl mx-auto">Everything you need to know about the Tradiglo Affiliate Program.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  {
                    icon: (
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ),
                    title: 'Commission Rate',
                    value: '25% of Initial Deposit',
                    desc: 'You receive 25% of the total first deposit made by every member you refer.',
                  },
                  {
                    icon: (
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ),
                    title: 'Payout Threshold',
                    value: '$500 Minimum',
                    desc: 'Rewards are released once your total accumulated affiliate earnings reach $500.',
                  },
                  {
                    icon: (
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ),
                    title: 'Validity',
                    value: 'Lifetime — No Expiry',
                    desc: 'Your affiliate relationship is permanent for as long as both you and the referred member stay active.',
                  },
                  {
                    icon: (
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    ),
                    title: 'Affiliate Limit',
                    value: 'Unlimited Affiliates',
                    desc: 'There is no cap on the number of people you can refer. The more you invite, the more you earn.',
                  },
                ]?.map((item) => (
                  <div key={item?.title} className="flex gap-4 rounded-xl border border-white/10 bg-white/5 p-6">
                    <div className="w-10 h-10 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0 text-blue-400">
                      {item?.icon}
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">{item?.title}</p>
                      <p className="font-semibold text-white mb-1">{item?.value}</p>
                      <p className="text-slate-400 text-sm leading-relaxed">{item?.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-20 md:py-24">
          <div className="container mx-auto px-4 sm:px-6 max-w-3xl">
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
              <p className="text-slate-400">Got questions? We have answers.</p>
            </div>
            <div className="space-y-4">
              {faqs?.map((faq) => (
                <div key={faq?.q} className="rounded-xl border border-white/10 bg-white/5 p-6">
                  <h3 className="font-semibold text-white mb-2">{faq?.q}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{faq?.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 md:py-24 border-t border-white/10">
          <div className="container mx-auto px-4 sm:px-6 text-center">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Start Earning?</h2>
              <p className="text-slate-400 mb-8 leading-relaxed">
                Join Tradiglo today, get your unique affiliate link, and start earning 25% from every member you bring in — for life.
              </p>
              <Link
                href="/auth"
                className="inline-flex items-center justify-center rounded-lg px-10 py-4 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-all"
              >
                Create Your Account
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
