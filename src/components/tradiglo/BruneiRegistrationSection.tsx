'use client';

import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';

const WA_ADMIN_BASE = 'https://wa.me/60147792325?text=';

interface FormData {
  name: string;
  whatsapp: string;
  experience: string;
  market: string;
  capital: string;
  agree: boolean;
}

export default function BruneiRegistrationSection() {
  const [form, setForm] = useState<FormData>({
    name: '', whatsapp: '', experience: '', market: '', capital: '', agree: false,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e: Partial<Record<keyof FormData, string>> = {};
    if (!form.name.trim()) e.name = 'Nama penuh diperlukan.';
    if (!form.whatsapp.trim()) e.whatsapp = 'Nombor WhatsApp diperlukan.';
    if (!form.experience) e.experience = 'Sila pilih tahap pengalaman anda.';
    if (!form.market) e.market = 'Sila pilih pasaran.';
    if (!form.agree) e.agree = 'Anda mesti bersetuju sebelum meneruskan.';
    return e;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    if (typeof window !== 'undefined') (window as any).gtag?.('event', 'submit_registration_form_bn');
    const capitalText = form.capital ? `\nModal Anggaran: ${form.capital}` : '';
    const msg = `Hi Tradiglo, saya berminat untuk daftar.\n\nNama: ${form.name}\nNombor WhatsApp: ${form.whatsapp}\nTahap Pengalaman: ${form.experience}\nPasaran Minat: ${form.market}${capitalText}\n\nSaya dari Brunei Darussalam dan ingin bermula dengan Tradiglo.`;
    const url = WA_ADMIN_BASE + encodeURIComponent(msg);
    setTimeout(() => { window.open(url, '_blank'); setLoading(false); }, 800);
  };

  const field = (key: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => { const n = { ...prev }; delete n[key]; return n; });
  };

  const inputClass = (key: keyof FormData) =>
    `w-full px-4 py-3 rounded-xl text-sm text-white placeholder-[#A6A8C3]/40 focus:outline-none focus:ring-1 transition-all ${
      errors[key]
        ? 'border border-red-500/50 focus:ring-red-500/30 bg-red-500/5' :'border border-[rgba(139,92,246,0.2)] focus:border-[rgba(139,92,246,0.5)] focus:ring-[rgba(139,92,246,0.2)] bg-[rgba(139,92,246,0.04)]'
    }`;

  return (
    <section id="register" className="py-20" style={{ background: '#07091F' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left: Info */}
          <div className="space-y-6 lg:sticky lg:top-24">
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full"
              style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)' }}
            >
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#8B5CF6' }}>Pendaftaran</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">
              Daftar melalui{' '}
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: 'linear-gradient(90deg, #A78BFA, #6366F1)' }}
              >
                WhatsApp Admin Brunei Darussalam
              </span>
            </h2>
            <p className="text-[#A6A8C3] leading-relaxed">
              Jika anda memerlukan bimbingan membaca isyarat Crypto, Forex, atau Gold — atau maklumat lanjut tentang Tradiglo, hubungi WhatsApp Admin Brunei Darussalam.
            </p>
            <div
              className="p-5 rounded-2xl space-y-3"
              style={{ background: '#11143A', border: '1px solid rgba(139,92,246,0.2)' }}
            >
              <p className="text-xs font-bold text-white uppercase tracking-wider">Apa yang anda akan terima:</p>
              <ul className="space-y-2">
                {[
                  'Panduan membaca isyarat Crypto, Forex & Gold',
                  'Bimbingan asas perdagangan',
                  'Maklumat lanjut tentang Tradiglo',
                  'Sokongan daripada Admin Brunei Darussalam',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#8B5CF6' }} />
                    <span className="text-xs text-[#A6A8C3]">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right: Form */}
          <div
            className="rounded-2xl p-6 sm:p-8"
            style={{
              background: '#11143A',
              border: '1px solid rgba(139,92,246,0.2)',
              boxShadow: '0 8px 40px rgba(139,92,246,0.1)',
            }}
          >
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-[#A6A8C3] mb-1.5">
                  Nama Penuh <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => field('name', e.target.value)}
                  placeholder="Nama anda"
                  className={inputClass('name')}
                />
                {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
              </div>

              {/* WhatsApp */}
              <div>
                <label className="block text-xs font-semibold text-[#A6A8C3] mb-1.5">
                  Nombor WhatsApp <span className="text-red-400">*</span>
                </label>
                <input
                  type="tel"
                  value={form.whatsapp}
                  onChange={(e) => field('whatsapp', e.target.value)}
                  placeholder="cth. 6738123456"
                  className={inputClass('whatsapp')}
                />
                {errors.whatsapp && <p className="text-xs text-red-400 mt-1">{errors.whatsapp}</p>}
              </div>

              {/* Experience */}
              <div>
                <label className="block text-xs font-semibold text-[#A6A8C3] mb-1.5">
                  Tahap Pengalaman Dagangan <span className="text-red-400">*</span>
                </label>
                <select
                  value={form.experience}
                  onChange={(e) => field('experience', e.target.value)}
                  className={`${inputClass('experience')} appearance-none`}
                  style={{ background: errors.experience ? undefined : '#0B0E2D' }}
                >
                  <option value="" disabled className="text-[#A6A8C3]/40">Pilih tahap pengalaman</option>
                  <option value="Pemula">Pemula</option>
                  <option value="Pertengahan">Pertengahan</option>
                  <option value="Mahir">Mahir</option>
                </select>
                {errors.experience && <p className="text-xs text-red-400 mt-1">{errors.experience}</p>}
              </div>

              {/* Market */}
              <div>
                <label className="block text-xs font-semibold text-[#A6A8C3] mb-1.5">
                  Pasaran Minat <span className="text-red-400">*</span>
                </label>
                <select
                  value={form.market}
                  onChange={(e) => field('market', e.target.value)}
                  className={`${inputClass('market')} appearance-none`}
                  style={{ background: errors.market ? undefined : '#0B0E2D' }}
                >
                  <option value="" disabled className="text-[#A6A8C3]/40">Pilih pasaran</option>
                  <option value="Crypto (BTC, ETH)">Crypto (BTC, ETH)</option>
                  <option value="XAUUSD (Emas)">XAUUSD (Emas)</option>
                  <option value="Forex Major">Forex Major</option>
                  <option value="Semua pasaran">Semua pasaran</option>
                </select>
                {errors.market && <p className="text-xs text-red-400 mt-1">{errors.market}</p>}
              </div>

              {/* Capital (optional) */}
              <div>
                <label className="block text-xs font-semibold text-[#A6A8C3] mb-1.5">
                  Modal Anggaran <span className="text-[#A6A8C3]/50">(Pilihan)</span>
                </label>
                <select
                  value={form.capital}
                  onChange={(e) => field('capital', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm text-white focus:outline-none focus:ring-1 transition-all appearance-none"
                  style={{
                    background: '#0B0E2D',
                    border: '1px solid rgba(139,92,246,0.2)',
                  }}
                >
                  <option value="">Tidak mahu nyatakan</option>
                  <option value="Kurang dari BND 500">Kurang dari BND 500</option>
                  <option value="BND 500 - BND 1,000">BND 500 – BND 1,000</option>
                  <option value="BND 1,000 - BND 5,000">BND 1,000 – BND 5,000</option>
                  <option value="Lebih dari BND 5,000">Lebih dari BND 5,000</option>
                </select>
              </div>

              {/* Checkbox */}
              <div>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.agree}
                    onChange={(e) => {
                      setForm((p) => ({ ...p, agree: e.target.checked }));
                      if (errors.agree) setErrors((p) => { const n = { ...p }; delete n.agree; return n; });
                    }}
                    className="mt-0.5 w-4 h-4 rounded flex-shrink-0"
                    style={{ accentColor: '#8B5CF6' }}
                  />
                  <span className="text-xs text-[#A6A8C3] leading-relaxed">
                    Saya faham bahawa perdagangan melibatkan risiko dan Tradiglo tidak menjamin keuntungan.
                  </span>
                </label>
                {errors.agree && <p className="text-xs text-red-400 mt-1 ml-7">{errors.agree}</p>}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl text-white font-semibold text-sm hover:opacity-90 transition-all disabled:opacity-70 active:scale-[0.98]"
                style={{
                  background: 'linear-gradient(135deg, #25D366, #128C7E)',
                  boxShadow: '0 4px 20px rgba(37,211,102,0.2)',
                }}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Membuka WhatsApp Admin...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    Hantar & Daftar melalui WhatsApp
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
