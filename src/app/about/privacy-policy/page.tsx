import Link from 'next/link';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-8">
          <Link href="/" className="text-gray-400 hover:text-white text-sm transition-colors">← Back to Home</Link>
        </div>
        <h1 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-500 to-purple-500">Privacy Policy</h1>
        <p className="text-gray-500 text-sm mb-8">Last updated: March 26, 2026</p>
        <div className="space-y-8 text-gray-400 text-sm leading-relaxed">
          {[
            { title: '1. Information We Collect', content: 'We collect information you provide directly to us, such as when you create an account, make a transaction, or contact us for support. This includes name, email address, and financial information necessary for trading.' },
            { title: '2. How We Use Your Information', content: 'We use the information we collect to provide, maintain, and improve our services, process transactions, send notifications, and comply with legal obligations.' },
            { title: '3. Information Sharing', content: 'We do not sell, trade, or rent your personal information to third parties. We may share information with service providers who assist in our operations, subject to confidentiality agreements.' },
            { title: '4. Data Security', content: 'We implement industry-standard security measures to protect your personal information, including encryption, secure servers, and regular security audits. We are SOC 2 Type 2 certified.' },
            { title: '5. Cookies', content: 'We use cookies and similar tracking technologies to enhance your experience on our platform. You can control cookie settings through your browser preferences.' },
            { title: '6. Your Rights', content: 'You have the right to access, correct, or delete your personal information. You may also opt out of marketing communications at any time by contacting us or using the unsubscribe link in emails.' },
            { title: '7. Contact Us', content: 'If you have questions about this Privacy Policy, please contact us through our Request Form or at privacy@tradiglo.com.' },
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
