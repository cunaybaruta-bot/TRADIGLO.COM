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
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/assets/images/chart-646_1024-removebg-preview-1774500683771.png', type: 'image/png' }
    ],
    shortcut: '/favicon.svg',
    apple: '/assets/images/chart-646_1024-removebg-preview-1774500683771.png',
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
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/png" href="/assets/images/chart-646_1024-removebg-preview-1774500683771.png" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&family=Geist+Mono:wght@300..700&display=swap" />
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
