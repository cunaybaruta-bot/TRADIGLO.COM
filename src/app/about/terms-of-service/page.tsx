import Link from 'next/link';

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-8">
          <Link href="/" className="text-gray-400 hover:text-white text-sm transition-colors">← Back to Home</Link>
        </div>
        <h1 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-500 to-purple-500">Terms of Service</h1>
        <p className="text-gray-500 text-sm mb-8">Last updated: March 26, 2026</p>
        <div className="space-y-8 text-gray-400 text-sm leading-relaxed">
          {[
            { title: '1. Acceptance of Terms', content: 'By accessing or using Tradiglo\'s services, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.' },
            { title: '2. Use of Services', content: 'You may use our services only for lawful purposes and in accordance with these Terms. You agree not to use our services in any way that violates applicable laws or regulations.' },
            { title: '3. Account Registration', content: 'To access certain features, you must create an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.' },
            { title: '4. Intellectual Property', content: 'All content on Tradiglo, including text, graphics, logos, and software, is the property of Tradiglo and is protected by applicable intellectual property laws.' },
            { title: '5. Limitation of Liability', content: 'Tradiglo shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use our services.' },
            { title: '6. Modifications', content: 'We reserve the right to modify these Terms at any time. We will notify users of significant changes. Your continued use of our services after changes constitutes acceptance of the new Terms.' },
            { title: '7. Governing Law', content: 'These Terms shall be governed by and construed in accordance with applicable laws, without regard to conflict of law provisions.' },
          ]?.map((section) => (
            <div key={section?.title}>
              <h2 className="text-white font-bold text-base mb-2">{section?.title}</h2>
              <p>{section?.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
