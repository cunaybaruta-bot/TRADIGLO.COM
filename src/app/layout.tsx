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
    default: 'TRADIGLO #1 Crypto Trading Platform',
    template: '%s | TRADIGLO',
  },
  description: 'TRADIGLO #1 Crypto Trading Platform — Advanced trading tools, lightning-fast execution, and unmatched security.',
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
    <html lang="en">
      <head>
        <title>TRADIGLO #1 Crypto Trading Platform</title>
        <link rel="icon" type="image/png" href="/assets/images/Logo_Tradiglo-1775738380029.png" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap" />
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
