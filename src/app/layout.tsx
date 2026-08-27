import React from 'react';
import type { Metadata, Viewport } from 'next';
import '../styles/index.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { LanguageProvider } from '@/contexts/LanguageContext';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: 'Trade Crypto like a pro!',
    template: '%s | Tradiglo',
  },
  description: 'Join WhatsApp Channel Tradiglo Malaysia untuk signal Forex dan Gold, market update, serta panduan risiko. Daftar melalui WhatsApp Admin Malaysia. Trading melibatkan risiko.',
  keywords: 'Tradiglo Malaysia, signal forex Malaysia, signal gold Malaysia, signal XAUUSD Malaysia, WhatsApp trading signal Malaysia, signal trading Malaysia, forex education Malaysia, gold trading Malaysia',
  openGraph: {
    title: 'Trade Crypto like a pro!',
    description: 'Market update, signal XAUUSD dan Forex, serta panduan risiko untuk trader Malaysia melalui WhatsApp Channel dan WhatsApp Admin.',
    type: 'website',
    locale: 'ms_MY',
    siteName: 'Tradiglo',
  },
  icons: {
    icon: [
      { url: '/assets/images/Logo_Tradiglo-1775738380029.png', type: 'image/png' },
    ],
    shortcut: '/assets/images/Logo_Tradiglo-1775738380029.png',
    apple: '/assets/images/Logo_Tradiglo-1775738380029.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ms">
      <head>
        <title>Trade Crypto like a pro!</title>
        {/* Google tag (gtag.js) - Google Ads AW-17361830719 */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=AW-17361830719" />
        <script dangerouslySetInnerHTML={{ __html: `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'AW-17361830719');
        ` }} />
        {/* Google tag (gtag.js) - Google Analytics G-2LTST7HYM8 */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-2LTST7HYM8" />
        <script dangerouslySetInnerHTML={{ __html: `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-2LTST7HYM8');
        ` }} />
        {/* Google tag (gtag.js) - Google Analytics G-WDCXSB08YM */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-WDCXSB08YM" />
        <script dangerouslySetInnerHTML={{ __html: `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-WDCXSB08YM');
        ` }} />
        {/* Google Tag Manager placeholder */}
        {/* GTM: Replace GTM-XXXXXXX with your GTM container ID */}
        {/* Meta Pixel placeholder */}
        {/* META_PIXEL_ID: Replace with your Meta Pixel ID */}
        {/* TikTok Pixel placeholder */}
        {/* TIKTOK_PIXEL_ID: Replace with your TikTok Pixel ID */}
        <link rel="icon" type="image/png" href="/assets/images/Logo_Tradiglo-1775738380029.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Inter:wght@100..900&display=swap" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&family=Geist+Mono:wght@300..700&display=swap" />
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            var _origError = window.onerror;
            window.onerror = function(msg, src, line, col, err) {
              if (err && err.name === 'ChunkLoadError') {
                var reloadKey = 'chunk_reload_' + (err.request || '');
                if (!sessionStorage.getItem(reloadKey)) {
                  sessionStorage.setItem(reloadKey, '1');
                  window.location.reload();
                  return true;
                }
              }
              if (_origError) return _origError(msg, src, line, col, err);
            };
            window.addEventListener('unhandledrejection', function(e) {
              var err = e && e.reason;
              if (err && err.name === 'ChunkLoadError') {
                var reloadKey = 'chunk_reload_' + (err.request || '');
                if (!sessionStorage.getItem(reloadKey)) {
                  sessionStorage.setItem(reloadKey, '1');
                  window.location.reload();
                }
              }
            });
          })();
        ` }} />
</head>
      <body style={{ fontFamily: "'Inter', sans-serif" }}>
        <AuthProvider>
          <LanguageProvider>
            {children}
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
