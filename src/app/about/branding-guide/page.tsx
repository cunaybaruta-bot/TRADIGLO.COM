import Link from 'next/link';

export default function BrandingGuidePage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="mb-8">
          <Link href="/" className="text-gray-400 hover:text-white text-sm transition-colors">← Back to Home</Link>
        </div>
        <h1 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-500 to-purple-500">Branding Guide</h1>
        <p className="text-gray-400 text-lg mb-10">Official Tradiglo brand assets and usage guidelines.</p>
        <div className="space-y-10">
          <section>
            <h2 className="text-white font-bold text-xl mb-4">Logo</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-white/10 rounded-xl p-8 flex items-center justify-center bg-black">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-500 to-purple-500 font-bold text-2xl tracking-widest">TRADIGLO</span>
              </div>
              <div className="border border-white/10 rounded-xl p-8 flex items-center justify-center bg-white">
                <span className="text-gray-900 font-bold text-2xl tracking-widest">TRADIGLO</span>
              </div>
            </div>
            <p className="text-gray-500 text-xs mt-2">Use the gradient version on dark backgrounds, dark version on light backgrounds.</p>
          </section>
          <section>
            <h2 className="text-white font-bold text-xl mb-4">Colors</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { name: 'Blue 400', hex: '#60a5fa', bg: 'bg-blue-400' },
                { name: 'Indigo 500', hex: '#6366f1', bg: 'bg-indigo-500' },
                { name: 'Purple 500', hex: '#a855f7', bg: 'bg-purple-500' },
                { name: 'Black', hex: '#000000', bg: 'bg-black border border-white/20' },
              ]?.map((color) => (
                <div key={color?.name} className="border border-white/10 rounded-xl overflow-hidden">
                  <div className={`h-16 ${color?.bg}`}></div>
                  <div className="p-3">
                    <p className="text-white text-xs font-medium">{color?.name}</p>
                    <p className="text-gray-500 text-xs font-mono">{color?.hex}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
          <section>
            <h2 className="text-white font-bold text-xl mb-4">Typography</h2>
            <div className="border border-white/10 rounded-xl p-6 space-y-4">
              <div><p className="text-gray-500 text-xs mb-1">Primary Font</p><p className="text-white text-2xl font-bold" style={{fontFamily: 'Satoshi, Inter, sans-serif'}}>Satoshi / Inter</p></div>
              <div><p className="text-gray-500 text-xs mb-1">Heading</p><p className="text-white text-xl font-bold">Bold 700 — Page Titles</p></div>
              <div><p className="text-gray-500 text-xs mb-1">Body</p><p className="text-gray-400 text-sm">Regular 400 — Body text and descriptions</p></div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
