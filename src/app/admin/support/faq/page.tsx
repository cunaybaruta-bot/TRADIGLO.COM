'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  QuestionMarkCircleIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

interface FAQ {
  id: string;
  category: string;
  question: string;
  answer: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface FAQForm {
  category: string;
  question: string;
  answer: string;
  sort_order: number;
  is_active: boolean;
}

const DEFAULT_CATEGORIES = ['Deposit & Withdrawal', 'Trading', 'Account & KYC', 'Technical', 'General'];

const emptyForm: FAQForm = { category: 'General', question: '', answer: '', sort_order: 0, is_active: true };

export default function AdminFAQPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FAQForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(DEFAULT_CATEGORIES));
  const [customCategory, setCustomCategory] = useState('');
  const [error, setError] = useState('');

  const supabase = createClient();

  const fetchFAQs = useCallback(async () => {
    const { data } = await supabase
      .from('faqs')
      .select('*')
      .order('category', { ascending: true })
      .order('sort_order', { ascending: true });
    if (data) setFaqs(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchFAQs(); }, [fetchFAQs]);

  const categories = Array.from(new Set([...DEFAULT_CATEGORIES, ...faqs.map((f) => f.category)]));
  const faqsByCategory = categories.reduce<Record<string, FAQ[]>>((acc, cat) => {
    acc[cat] = faqs.filter((f) => f.category === cat);
    return acc;
  }, {});

  const handleOpenAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setCustomCategory('');
    setError('');
    setShowForm(true);
  };

  const handleOpenEdit = (faq: FAQ) => {
    setEditingId(faq.id);
    setForm({ category: faq.category, question: faq.question, answer: faq.answer, sort_order: faq.sort_order, is_active: faq.is_active });
    setCustomCategory(DEFAULT_CATEGORIES.includes(faq.category) ? '' : faq.category);
    setError('');
    setShowForm(true);
  };

  const handleSave = async () => {
    const finalCategory = customCategory.trim() || form.category;
    if (!finalCategory || !form.question.trim() || !form.answer.trim()) {
      setError('Category, question, and answer are required.');
      return;
    }
    setSaving(true);
    setError('');
    const payload = { ...form, category: finalCategory, updated_at: new Date().toISOString() };

    if (editingId) {
      const { error: err } = await supabase.from('faqs').update(payload).eq('id', editingId);
      if (err) setError(err.message);
    } else {
      const { error: err } = await supabase.from('faqs').insert({ ...payload });
      if (err) setError(err.message);
    }
    setSaving(false);
    if (!error) {
      setShowForm(false);
      fetchFAQs();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this FAQ? This cannot be undone.')) return;
    setDeletingId(id);
    await supabase.from('faqs').delete().eq('id', id);
    setDeletingId(null);
    fetchFAQs();
  };

  const handleToggleActive = async (faq: FAQ) => {
    await supabase.from('faqs').update({ is_active: !faq.is_active, updated_at: new Date().toISOString() }).eq('id', faq.id);
    fetchFAQs();
  };

  const toggleCategory = (cat: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white text-xl font-bold">FAQ Manager</h2>
          <p className="text-slate-400 text-sm mt-1">{faqs.length} FAQs across {categories.filter((c) => faqsByCategory[c]?.length > 0).length} categories</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="bg-[#22c55e] hover:bg-[#16a34a] text-black font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm"
        >
          <PlusIcon className="w-4 h-4" />
          Add FAQ
        </button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-[#1e293b] border border-[#22c55e]/30 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-semibold text-sm">{editingId ? 'Edit FAQ' : 'Add New FAQ'}</h3>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white">
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {error && <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 text-red-400 text-sm">{error}</div>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-slate-400 text-xs mb-1.5 block">Category</label>
              <select
                value={customCategory ? '__custom__' : form.category}
                onChange={(e) => {
                  if (e.target.value === '__custom__') {
                    setCustomCategory('');
                  } else {
                    setForm({ ...form, category: e.target.value });
                    setCustomCategory('');
                  }
                }}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#22c55e]/50"
              >
                {DEFAULT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                <option value="__custom__">+ Custom category</option>
              </select>
              {(customCategory !== '' || (form.category === '__custom__')) && (
                <input
                  type="text"
                  placeholder="Enter custom category name"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="w-full mt-2 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#22c55e]/50"
                />
              )}
            </div>
            <div>
              <label className="text-slate-400 text-xs mb-1.5 block">Sort Order</label>
              <input
                type="number"
                value={form.sort_order}
                onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#22c55e]/50"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-400 text-xs mb-1.5 block">Question</label>
            <input
              type="text"
              value={form.question}
              onChange={(e) => setForm({ ...form, question: e.target.value })}
              placeholder="Enter the question..."
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#22c55e]/50"
            />
          </div>

          <div>
            <label className="text-slate-400 text-xs mb-1.5 block">Answer</label>
            <textarea
              value={form.answer}
              onChange={(e) => setForm({ ...form, answer: e.target.value })}
              placeholder="Enter the answer..."
              rows={4}
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#22c55e]/50 resize-none"
            />
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <div
                onClick={() => setForm({ ...form, is_active: !form.is_active })}
                className={`w-10 h-5 rounded-full transition-colors relative ${form.is_active ? 'bg-[#22c55e]' : 'bg-slate-600'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform ${form.is_active ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </div>
              <span className="text-slate-300 text-sm">Active (visible to users)</span>
            </label>
          </div>

          <div className="flex gap-3 justify-end">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors">Cancel</button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-[#22c55e] hover:bg-[#16a34a] disabled:opacity-50 text-black font-semibold px-5 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm"
            >
              <CheckIcon className="w-4 h-4" />
              {saving ? 'Saving...' : editingId ? 'Update FAQ' : 'Add FAQ'}
            </button>
          </div>
        </div>
      )}

      {/* FAQ List by Category */}
      {loading ? (
        <div className="text-slate-400 text-sm text-center py-8">Loading FAQs...</div>
      ) : (
        <div className="space-y-3">
          {categories.map((cat) => {
            const catFaqs = faqsByCategory[cat] || [];
            if (catFaqs.length === 0) return null;
            const isExpanded = expandedCategories.has(cat);
            return (
              <div key={cat} className="bg-[#1e293b] border border-slate-700 rounded-xl overflow-hidden">
                <button
                  onClick={() => toggleCategory(cat)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-700/30 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <QuestionMarkCircleIcon className="w-4 h-4 text-purple-400" />
                    <span className="text-white font-medium text-sm">{cat}</span>
                    <span className="bg-slate-700 text-slate-300 text-xs px-2 py-0.5 rounded-full">{catFaqs.length}</span>
                  </div>
                  {isExpanded ? <ChevronDownIcon className="w-4 h-4 text-slate-400" /> : <ChevronRightIcon className="w-4 h-4 text-slate-400" />}
                </button>

                {isExpanded && (
                  <div className="border-t border-slate-700 divide-y divide-slate-700/50">
                    {catFaqs.map((faq) => (
                      <div key={faq.id} className="px-4 py-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-white text-sm font-medium">{faq.question}</span>
                              {!faq.is_active && (
                                <span className="bg-slate-600/50 text-slate-400 text-xs px-1.5 py-0.5 rounded">Hidden</span>
                              )}
                            </div>
                            <p className="text-slate-400 text-sm leading-relaxed">{faq.answer}</p>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <button
                              onClick={() => handleToggleActive(faq)}
                              title={faq.is_active ? 'Hide FAQ' : 'Show FAQ'}
                              className={`p-1.5 rounded-lg transition-colors ${faq.is_active ? 'text-green-400 hover:bg-green-500/10' : 'text-slate-500 hover:bg-slate-700'}`}
                            >
                              <CheckIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleOpenEdit(faq)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(faq.id)}
                              disabled={deletingId === faq.id}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
