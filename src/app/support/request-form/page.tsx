'use client';
import Link from 'next/link';
import { useState } from 'react';

export default function RequestFormPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <div className="mb-8">
          <Link href="/" className="text-gray-400 hover:text-white text-sm transition-colors">← Back to Home</Link>
        </div>
        <h1 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-500 to-purple-500">Request Form</h1>
        <p className="text-gray-400 text-lg mb-8">Submit a request and our team will get back to you as soon as possible.</p>
        {submitted ? (
          <div className="border border-green-500/30 bg-green-900/10 rounded-xl p-8 text-center">
            <p className="text-green-400 font-semibold text-lg mb-2">Request Submitted!</p>
            <p className="text-gray-400 text-sm">Thank you for reaching out. We'll respond within 1-2 business days.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-400 text-sm mb-1">Name</label>
              <input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-transparent border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 text-sm" placeholder="Your full name" />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-1">Email</label>
              <input type="email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full bg-transparent border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 text-sm" placeholder="your@email.com" />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-1">Subject</label>
              <input type="text" required value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} className="w-full bg-transparent border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 text-sm" placeholder="Request subject" />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-1">Message</label>
              <textarea required value={form.message} onChange={e => setForm({...form, message: e.target.value})} rows={5} className="w-full bg-transparent border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 text-sm resize-none" placeholder="Describe your request..." />
            </div>
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-lg transition-colors text-sm">Submit Request</button>
          </form>
        )}
      </div>
    </div>
  );
}
