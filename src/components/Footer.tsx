'use client';
import React, { useState } from 'react';


export default function Footer() {
  const [email, setEmail] = useState('');

  const footerLinks = {
    Resources: ['Crypto News', 'Crypto Treasuries', 'Crypto Heatmap', 'Crypto API'],
    Support: ['Request Form', 'Advertising', 'Candy Rewards Listing', 'Help Center', 'Bug Bounty', 'FAQ'],
    'About Investoft': [
    'About Us',
    'Careers',
    'Branding Guide',
    'Methodology',
    'Disclaimer',
    'Terms of Service',
    'Privacy Policy',
    'Ad Policy',
    'Cookie Preferences',
    'Trust Center'],

    Community: [
    'X/Twitter',
    'Telegram Chat',
    'Telegram News',
    'Instagram',
    'Reddit',
    'Discord',
    'Facebook',
    'Youtube',
    'TikTok']

  };

  return (
    <footer className="bg-black text-gray-400" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-10 pb-0">
        {/* TOP SECTION — responsive columns */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-5 gap-6 sm:gap-8 pb-10 border-b border-white/10">
          {/* Column 1: Brand */}
          <div className="col-span-2 sm:col-span-2 md:col-span-1">
            <div className="flex items-center gap-1.5 mb-3">
              {/* Gradient mask logo matching Header style */}
              <div
                style={{
                  width: 28,
                  height: 28,
                  background: 'linear-gradient(to right, #60a5fa, #6366f1, #a855f7)',
                  WebkitMaskImage: 'url(/assets/images/chart-646_1024-1773102864640.png)',
                  WebkitMaskSize: 'contain',
                  WebkitMaskRepeat: 'no-repeat',
                  WebkitMaskPosition: 'center',
                  maskImage: 'url(/assets/images/chart-646_1024-1773102864640.png)',
                  maskSize: 'contain',
                  maskRepeat: 'no-repeat',
                  maskPosition: 'center',
                  flexShrink: 0
                }} />
              
              <span
                style={{ fontFamily: "'Satoshi', 'Inter', sans-serif", fontWeight: 700, letterSpacing: '0.04em' }}
                className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-500 to-purple-500 text-base tracking-wide select-none">
                INVESTOFT
              </span>
            </div>
            <p className="text-xs sm:text-sm leading-relaxed mb-4">
              Investoft provides a fundamental analysis of the crypto market. In addition to tracking price, volume and market capitalisation, Investoft tracks community growth, open-source code development, major events and on-chain metrics.
            </p>
            {/* Trust Badge */}
            <div className="mt-2 flex flex-row items-center gap-2 flex-wrap">
              <div style={{ width: '110px', height: '52px', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img
                  src="/assets/images/SOC-1773106822143.png"
                  alt="SOC 2 Type 1 Trust Badge"
                  style={{ width: '110px', height: '52px', objectFit: 'fill', display: 'block' }}
                />
              </div>
              <div style={{ width: '110px', height: '52px', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img
                  src="/assets/images/SENSIBA-1773106731051.jpg"
                  alt="Sensiba SOC 2 Type 2 Trust Badge"
                  style={{ width: '110px', height: '52px', objectFit: 'fill', display: 'block' }}
                />
              </div>
            </div>
          </div>

          {/* Link Columns */}
          {Object.entries(footerLinks)?.map(([category, links]) =>
          <div key={category}>
              <h4 className="text-white font-semibold text-xs sm:text-sm mb-3">{category}</h4>
              <ul className="space-y-2">
                {links?.map((link) =>
              <li key={link}>
                    <button className="text-gray-400 hover:text-white text-xs sm:text-sm transition-colors text-left">
                      {link}
                    </button>
                  </li>
              )}
              </ul>
            </div>
          )}
        </div>

        {/* MIDDLE SECTION — Newsletter */}
        <div className="flex flex-col gap-4 py-8 border-b border-white/10">
          <div>
            <p className="text-white font-bold text-sm mb-1">
              Interested to stay up-to-date with cryptocurrencies?
            </p>
            <p className="text-gray-400 text-xs sm:text-sm">
              Get the latest crypto news, updates, and reports by subscribing to our free newsletter.
            </p>
          </div>
          <div className="flex items-center gap-2 w-full">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e?.target?.value)}
              placeholder="Enter your email address"
              className="bg-transparent border border-gray-600 rounded px-3 py-2 text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gray-400 flex-1 min-w-0" />
            
            <button className="bg-green-500 hover:bg-green-400 text-white font-semibold text-xs sm:text-sm px-4 py-2 rounded transition-colors whitespace-nowrap flex-shrink-0">
              Subscribe
            </button>
          </div>
        </div>

        {/* BOTTOM SECTION */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-6">
          <p className="text-gray-400 text-xs">© 2026 Investoft. All Rights Reserved.</p>
          <div className="flex gap-2 flex-wrap">
            {/* Google Play Badge */}
            <a
              href="#"
              className="flex items-center gap-2 bg-black border border-gray-600 rounded-lg px-3 py-1.5 hover:border-gray-400 transition-colors">
              
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-white flex-shrink-0">
                <path d="M3.18 23.76c.3.17.64.24.99.2l12.6-7.27-2.79-2.79-10.8 9.86zM.5 1.4C.19 1.74 0 2.27 0 2.96v18.08c0 .69.19 1.22.5 1.56l.08.08 10.13-10.13v-.24L.58 1.32.5 1.4zM20.37 10.43l-2.88-1.66-3.14 3.14 3.14 3.14 2.9-1.67c.83-.48.83-1.26-.02-1.95zM4.17.24L16.77 7.5l-2.79 2.79L3.18.43C3.48.07 3.87-.1 4.17.24z" />
              </svg>
              <div>
                <div className="text-gray-400 text-[10px] leading-none">Get it on</div>
                <div className="text-white text-xs font-semibold leading-tight">Google Play</div>
              </div>
            </a>
            {/* App Store Badge */}
            <a
              href="#"
              className="flex items-center gap-2 bg-black border border-gray-600 rounded-lg px-3 py-1.5 hover:border-gray-400 transition-colors">
              
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-white flex-shrink-0">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
              </svg>
              <div>
                <div className="text-gray-400 text-[10px] leading-none">Download on the</div>
                <div className="text-white text-xs font-semibold leading-tight">App Store</div>
              </div>
            </a>
          </div>
        </div>

        {/* DISCLAIMER */}
        <div className="border-t border-white/10 py-5">
          <p className="text-gray-500 text-[10px] sm:text-xs leading-relaxed">
            <span className="font-bold underline text-gray-400">IMPORTANT DISCLAIMER:</span> All content provided herein our website, hyperlinked sites, associated applications, forums, blogs, social media accounts and other platforms (&quot;Site&quot;) is for your general information only, procured from third party sources. We make no warranties of any kind in relation to our content, including but not limited to accuracy and updatedness. No part of the content that we provide constitutes financial advice, legal advice or any other form of advice meant for your specific reliance for any purpose. Any use or reliance on our content is solely at your own risk and discretion. You should conduct your own research, review, analyse and verify our content before relying on them. Trading is a highly risky activity that can lead to major losses, please therefore consult your financial advisor before making any decision. No content on our Site is meant to be a solicitation or offer.
          </p>
        </div>
      </div>
    </footer>);

}