'use client';
import React from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useLanguage } from '@/contexts/LanguageContext';

export default function ReferralPage() {
  const { t } = useLanguage();

  const steps = [
    {
      number: '01',
      title: t('aff_step1_title'),
      description: t('aff_step1_desc'),
    },
    {
      number: '02',
      title: t('aff_step2_title'),
      description: t('aff_step2_desc'),
    },
    {
      number: '03',
      title: t('aff_step3_title'),
      description: t('aff_step3_desc'),
    },
    {
      number: '04',
      title: t('aff_step4_title'),
      description: t('aff_step4_desc'),
    },
  ];

  const faqs = [
    { q: t('aff_faq1_q'), a: t('aff_faq1_a') },
    { q: t('aff_faq2_q'), a: t('aff_faq2_a') },
    { q: t('aff_faq3_q'), a: t('aff_faq3_a') },
    { q: t('aff_faq4_q'), a: t('aff_faq4_a') },
    { q: t('aff_faq5_q'), a: t('aff_faq5_a') },
    { q: t('aff_faq6_q'), a: t('aff_faq6_a') },
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
              {t('aff_badge')}
            </span>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 leading-tight">
              {t('aff_hero_title_1')}{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-500">
                25%
              </span>{' '}
              {t('aff_hero_title_2')}
            </h1>
            <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
              {t('aff_hero_subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth"
                className="inline-flex items-center justify-center rounded-lg px-8 py-3.5 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-all"
              >
                {t('aff_join_btn')}
              </Link>
              <Link
                href="/auth?tab=signin"
                className="inline-flex items-center justify-center rounded-lg px-8 py-3.5 text-sm font-semibold border border-white/20 text-slate-300 hover:bg-white/10 hover:text-white transition-all"
              >
                {t('aff_signin_btn')}
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
                <p className="text-slate-400 text-sm">{t('aff_stat1_label')}</p>
              </div>
              <div>
                <p className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 mb-2">$500</p>
                <p className="text-slate-400 text-sm">{t('aff_stat2_label')}</p>
              </div>
              <div>
                <p className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-2">∞</p>
                <p className="text-slate-400 text-sm">{t('aff_stat3_label')}</p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20 md:py-24">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('aff_how_title')}</h2>
              <p className="text-slate-400 max-w-xl mx-auto">{t('aff_how_sub')}</p>
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
                <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('aff_details_title')}</h2>
                <p className="text-slate-400 max-w-xl mx-auto">{t('aff_details_sub')}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  {
                    icon: (
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ),
                    title: t('aff_detail1_title'),
                    value: t('aff_detail1_value'),
                    desc: t('aff_detail1_desc'),
                  },
                  {
                    icon: (
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ),
                    title: t('aff_detail2_title'),
                    value: t('aff_detail2_value'),
                    desc: t('aff_detail2_desc'),
                  },
                  {
                    icon: (
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ),
                    title: t('aff_detail3_title'),
                    value: t('aff_detail3_value'),
                    desc: t('aff_detail3_desc'),
                  },
                  {
                    icon: (
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    ),
                    title: t('aff_detail4_title'),
                    value: t('aff_detail4_value'),
                    desc: t('aff_detail4_desc'),
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
              <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('aff_faq_title')}</h2>
              <p className="text-slate-400">{t('aff_faq_sub')}</p>
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
              <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('aff_cta_title')}</h2>
              <p className="text-slate-400 mb-8 leading-relaxed">
                {t('aff_cta_sub')}
              </p>
              <Link
                href="/auth"
                className="inline-flex items-center justify-center rounded-lg px-10 py-4 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-all"
              >
                {t('aff_cta_btn')}
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
