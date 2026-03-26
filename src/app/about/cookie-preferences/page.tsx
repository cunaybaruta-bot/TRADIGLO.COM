'use client';
import Link from 'next/link';
import { useState } from 'react';

export default function CookiePreferencesPage() {
  const [prefs, setPrefs] = useState({ necessary: true, analytics: true, marketing: false, personalization: true });

  const toggle = (key: keyof typeof prefs) => {
    if (key === 'necessary') return;
    setPrefs(p => ({ ...p, [key]: !p[key] }));
  };

  const cookies = [
    { key: 'necessary' as const, title: 'Strictly Necessary', desc: 'These cookies are required for the website to function and cannot be disabled.', required: true },
    { key: 'analytics' as const, title: 'Analytics', desc: 'Help us understand how visitors interact with our website by collecting anonymous data.', required: false },
    { key: 'marketing' as const, title: 'Marketing', desc: 'Used to deliver personalized advertisements based on your browsing behavior.', required: false },
    { key: 'personalization' as const, title: 'Personalization', desc: 'Allow us to remember your preferences and provide a personalized experience.', required: false },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-8">
          <Link href="/" className="text-gray-400 hover:text-white text-sm transition-colors">← Back to Home</Link>
        </div>
        <h1 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-500 to-purple-500">Cookie Preferences</h1>
        <p className="text-gray-400 text-lg mb-8">Manage how Tradiglo uses cookies on your device.</p>
        <div className="space-y-4 mb-8">
          {cookies.map((cookie) => (
            <div key={cookie.key} className="border border-white/10 rounded-xl p-5 flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-white font-semibold text-sm">{cookie.title}</h3>
                  {cookie.required && <span className="text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded">Required</span>}
                </div>
                <p className="text-gray-400 text-xs">{cookie.desc}</p>
              </div>
              <button
                onClick={() => toggle(cookie.key)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full transition-colors ${prefs[cookie.key] ? 'bg-blue-600' : 'bg-gray-700'} ${cookie.required ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform mt-0.5 ${prefs[cookie.key] ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>
          ))}
        </div>
        <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-lg transition-colors text-sm">Save Preferences</button>
      </div>
    </div>
  );
}
