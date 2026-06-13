'use client';

import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';

const WA_ADMIN_BASE = 'https://wa.me/60147792325?text=';

interface FormData {
  nama: string;
  whatsapp: string;
  pengalaman: string;
  market: string;
  modal: string;
  setuju: boolean;
}

export default function RegistrationSection() {
  const [form, setForm] = useState<FormData>({
    nama: '', whatsapp: '', pengalaman: '', market: '', modal: '', setuju: false,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e: Partial<Record<keyof FormData, string>> = {};
    if (!form.nama.trim()) e.nama = 'Nama wajib diisi.';
    if (!form.whatsapp.trim()) e.whatsapp = 'Nombor WhatsApp wajib diisi.';
    if (!form.pengalaman) e.pengalaman = 'Sila pilih tahap pengalaman.';
    if (!form.market) e.market = 'Sila pilih market diminati.';
    if (!form.setuju) e.setuju = 'Anda perlu bersetuju sebelum meneruskan.';
    return e;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    if (typeof window !== 'undefined') (window as any).gtag?.('event', 'submit_registration_form');
    const modalText = form.modal ? `\nModal anggaran: ${form.modal}` : '';
    const msg = `Hi Tradiglo, saya berminat untuk daftar.\n\nNama: ${form.nama}\nNombor WhatsApp: ${form.whatsapp}\nTahap pengalaman: ${form.pengalaman}\nMarket diminati: ${form.market}${modalText}\n\nSaya ingin mendapatkan panduan bermula dengan Tradiglo.`;
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
    <section id="daftar" className="py-20" style={{ background: '#07091F' }}>
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
              Daftar Melalui{' '}
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: 'linear-gradient(90deg, #A78BFA, #6366F1)' }}
              >
                WhatsApp Admin Malaysia
              </span>
            </h2>
            <p className="text-[#A6A8C3] leading-relaxed">
              Jika anda mahu onboarding, panduan membaca signal Crypto, Forex, atau Gold — atau maklumat lanjut tentang Tradiglo, hubungi WhatsApp Admin Malaysia.
            </p>
            <div
              className="p-5 rounded-2xl space-y-3"
              style={{ background: '#11143A', border: '1px solid rgba(139,92,246,0.2)' }}
            >
              <p className="text-xs font-bold text-white uppercase tracking-wider">Apa yang anda akan terima:</p>
              <ul className="space-y-2">
                {[
                  'Panduan membaca signal Crypto, Forex & Gold',
                  'Onboarding asas trading',
                  'Maklumat lanjut Tradiglo',
                  'Sokongan dari Admin Malaysia',
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
              {/* Nama */}
              <div>
                <label className="block text-xs font-semibold text-[#A6A8C3] mb-1.5">
                  Nama Penuh <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.nama}
                  onChange={(e) => field('nama', e.target.value)}
                  placeholder="Nama anda"
                  className={inputClass('nama')}
                />
                {errors.nama && <p className="text-xs text-red-400 mt-1">{errors.nama}</p>}
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
                  placeholder="Contoh: 60123456789"
                  className={inputClass('whatsapp')}
                />
                {errors.whatsapp && <p className="text-xs text-red-400 mt-1">{errors.whatsapp}</p>}
              </div>

              {/* Pengalaman */}
              <div>
                <label className="block text-xs font-semibold text-[#A6A8C3] mb-1.5">
                  Tahap Pengalaman Trading <span className="text-red-400">*</span>
                </label>
                <select
                  value={form.pengalaman}
                  onChange={(e) => field('pengalaman', e.target.value)}
                  className={`${inputClass('pengalaman')} appearance-none`}
                  style={{ background: errors.pengalaman ? undefined : '#0B0E2D' }}
                >
                  <option value="" disabled className="text-[#A6A8C3]/40">Pilih tahap pengalaman</option>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
                {errors.pengalaman && <p className="text-xs text-red-400 mt-1">{errors.pengalaman}</p>}
              </div>

              {/* Market */}
              <div>
                <label className="block text-xs font-semibold text-[#A6A8C3] mb-1.5">
                  Market Diminati <span className="text-red-400">*</span>
                </label>
                <select
                  value={form.market}
                  onChange={(e) => field('market', e.target.value)}
                  className={`${inputClass('market')} appearance-none`}
                  style={{ background: errors.market ? undefined : '#0B0E2D' }}
                >
                  <option value="" disabled className="text-[#A6A8C3]/40">Pilih market</option>
                  <option value="Crypto (BTC, ETH)">Crypto (BTC, ETH)</option>
                  <option value="XAUUSD (Gold)">XAUUSD (Gold)</option>
                  <option value="Forex Major">Forex Major</option>
                  <option value="Semua market">Semua market</option>
                </select>
                {errors.market && <p className="text-xs text-red-400 mt-1">{errors.market}</p>}
              </div>

              {/* Modal (optional) */}
              <div>
                <label className="block text-xs font-semibold text-[#A6A8C3] mb-1.5">
                  Modal Anggaran <span className="text-[#A6A8C3]/50">(Pilihan)</span>
                </label>
                <select
                  value={form.modal}
                  onChange={(e) => field('modal', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm text-white focus:outline-none focus:ring-1 transition-all appearance-none"
                  style={{
                    background: '#0B0E2D',
                    border: '1px solid rgba(139,92,246,0.2)',
                  }}
                >
                  <option value="">Tidak mahu nyatakan</option>
                  <option value="Kurang dari RM500">Kurang dari RM500</option>
                  <option value="RM500 - RM1,000">RM500 – RM1,000</option>
                  <option value="RM1,000 - RM5,000">RM1,000 – RM5,000</option>
                  <option value="Lebih dari RM5,000">Lebih dari RM5,000</option>
                </select>
              </div>

              {/* Checkbox */}
              <div>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.setuju}
                    onChange={(e) => {
                      setForm((p) => ({ ...p, setuju: e.target.checked }));
                      if (errors.setuju) setErrors((p) => { const n = { ...p }; delete n.setuju; return n; });
                    }}
                    className="mt-0.5 w-4 h-4 rounded flex-shrink-0"
                    style={{ accentColor: '#8B5CF6' }}
                  />
                  <span className="text-xs text-[#A6A8C3] leading-relaxed">
                    Saya faham bahawa trading melibatkan risiko dan Tradiglo tidak menjamin keuntungan.
                  </span>
                </label>
                {errors.setuju && <p className="text-xs text-red-400 mt-1 ml-7">{errors.setuju}</p>}
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
                    Hantar & Daftar Melalui WhatsApp
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
