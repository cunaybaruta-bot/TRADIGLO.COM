'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  CpuChipIcon,
  CheckIcon,
  InformationCircleIcon,
  BeakerIcon,
  PaperAirplaneIcon,
} from '@heroicons/react/24/outline';

interface ChatbotSetting {
  id: string;
  setting_key: string;
  setting_value: string | null;
  updated_at: string;
}

interface TestMessage {
  role: 'user' | 'assistant';
  content: string;
}

export default function AdminChatbotPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [testMessages, setTestMessages] = useState<TestMessage[]>([]);
  const [testInput, setTestInput] = useState('');
  const [testing, setTesting] = useState(false);

  const supabase = createClient();

  const fetchSettings = useCallback(async () => {
    const { data } = await supabase.from('chatbot_settings').select('*');
    if (data) {
      const map: Record<string, string> = {};
      data.forEach((s: ChatbotSetting) => { map[s.setting_key] = s.setting_value || ''; });
      setSettings(map);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSaved(false);

    const updates = Object.entries(settings).map(([key, value]) =>
      supabase.from('chatbot_settings').upsert({ setting_key: key, setting_value: value, updated_at: new Date().toISOString() }, { onConflict: 'setting_key' })
    );

    const results = await Promise.all(updates);
    const hasError = results.some((r) => r.error);
    if (hasError) {
      setError('Failed to save some settings. Please try again.');
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  };

  const handleTestSend = async () => {
    if (!testInput.trim()) return;
    const userMsg = testInput.trim();
    setTestInput('');
    setTesting(true);
    setTestMessages((prev) => [...prev, { role: 'user', content: userMsg }]);

    try {
      const systemPrompt = settings['system_prompt'] || 'You are a helpful support assistant.';
      const response = await fetch('/api/ai/chat-completion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemPrompt },
            ...testMessages.map((m) => ({ role: m.role, content: m.content })),
            { role: 'user', content: userMsg },
          ],
          max_tokens: parseInt(settings['max_tokens'] || '500'),
          temperature: parseFloat(settings['temperature'] || '0.7'),
        }),
      });
      const data = await response.json();
      const reply = data?.choices?.[0]?.message?.content || data?.content || data?.message || settings['fallback_message'] || 'Sorry, I could not process that.';
      setTestMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch {
      setTestMessages((prev) => [...prev, { role: 'assistant', content: settings['fallback_message'] || 'An error occurred. Please try again.' }]);
    }
    setTesting(false);
  };

  const updateSetting = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return <div className="text-slate-400 text-sm text-center py-8">Loading chatbot settings...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white text-xl font-bold">AI Chatbot Settings</h2>
          <p className="text-slate-400 text-sm mt-1">Configure the AI chatbot that assists members 24/7</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-[#22c55e] hover:bg-[#16a34a] disabled:opacity-50 text-black font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm"
        >
          <CheckIcon className="w-4 h-4" />
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Settings'}
        </button>
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-400 text-sm">{error}</div>}
      {saved && <div className="bg-green-500/10 border border-green-500/20 rounded-lg px-4 py-3 text-green-400 text-sm flex items-center gap-2"><CheckIcon className="w-4 h-4" /> Settings saved successfully.</div>}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Settings Panel */}
        <div className="space-y-4">
          {/* Enable/Disable */}
          <div className="bg-[#1e293b] border border-slate-700 rounded-xl p-5">
            <h3 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
              <CpuChipIcon className="w-4 h-4 text-cyan-400" />
              General Settings
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white text-sm font-medium">Enable AI Chatbot</div>
                  <div className="text-slate-400 text-xs mt-0.5">Show chatbot widget to members</div>
                </div>
                <div
                  onClick={() => updateSetting('enabled', settings['enabled'] === 'true' ? 'false' : 'true')}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${settings['enabled'] === 'true' ? 'bg-[#22c55e]' : 'bg-slate-600'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${settings['enabled'] === 'true' ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </div>
              </div>

              <div>
                <label className="text-slate-400 text-xs mb-1.5 block">AI Model</label>
                <select
                  value={settings['model'] || 'gpt-4o-mini'}
                  onChange={(e) => updateSetting('model', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#22c55e]/50"
                >
                  <option value="gpt-4o-mini">GPT-4o Mini (Fast & Economical)</option>
                  <option value="gpt-4o">GPT-4o (Most Capable)</option>
                  <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Legacy)</option>
                </select>
              </div>
            </div>
          </div>

          {/* System Prompt */}
          <div className="bg-[#1e293b] border border-slate-700 rounded-xl p-5">
            <h3 className="text-white font-semibold text-sm mb-1 flex items-center gap-2">
              System Prompt
              <span className="text-slate-500 text-xs font-normal">(Instructions for the AI)</span>
            </h3>
            <div className="flex items-start gap-2 mb-3 bg-blue-500/5 border border-blue-500/20 rounded-lg px-3 py-2">
              <InformationCircleIcon className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-blue-300 text-xs">This prompt defines the AI's personality, knowledge scope, and behavior. Be specific about what the bot should and should not answer.</p>
            </div>
            <textarea
              value={settings['system_prompt'] || ''}
              onChange={(e) => updateSetting('system_prompt', e.target.value)}
              rows={6}
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#22c55e]/50 resize-none font-mono"
            />
          </div>

          {/* Fallback Message */}
          <div className="bg-[#1e293b] border border-slate-700 rounded-xl p-5">
            <h3 className="text-white font-semibold text-sm mb-3">Fallback Message</h3>
            <p className="text-slate-400 text-xs mb-3">Shown when the AI cannot answer a question</p>
            <textarea
              value={settings['fallback_message'] || ''}
              onChange={(e) => updateSetting('fallback_message', e.target.value)}
              rows={3}
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#22c55e]/50 resize-none"
            />
          </div>

          {/* Advanced Settings */}
          <div className="bg-[#1e293b] border border-slate-700 rounded-xl p-5">
            <h3 className="text-white font-semibold text-sm mb-4">Advanced Parameters</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-slate-400 text-xs mb-1.5 block">Max Tokens</label>
                <input
                  type="number"
                  value={settings['max_tokens'] || '500'}
                  onChange={(e) => updateSetting('max_tokens', e.target.value)}
                  min={100}
                  max={2000}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#22c55e]/50"
                />
                <p className="text-slate-500 text-xs mt-1">Max response length (100–2000)</p>
              </div>
              <div>
                <label className="text-slate-400 text-xs mb-1.5 block">Temperature</label>
                <input
                  type="number"
                  value={settings['temperature'] || '0.7'}
                  onChange={(e) => updateSetting('temperature', e.target.value)}
                  min={0}
                  max={1}
                  step={0.1}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#22c55e]/50"
                />
                <p className="text-slate-500 text-xs mt-1">Creativity: 0 (precise) – 1 (creative)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Test Panel */}
        <div className="bg-[#1e293b] border border-slate-700 rounded-xl overflow-hidden flex flex-col h-[600px]">
          <div className="p-4 border-b border-slate-700 flex items-center gap-2">
            <BeakerIcon className="w-4 h-4 text-cyan-400" />
            <h3 className="text-white font-semibold text-sm">Test Chatbot</h3>
            <span className="text-slate-500 text-xs ml-auto">Uses current settings (save first)</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {testMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-3">
                <CpuChipIcon className="w-10 h-10 opacity-20" />
                <span className="text-sm">Send a test message to preview the chatbot</span>
              </div>
            ) : (
              testMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-xl px-4 py-2.5 ${msg.role === 'user' ? 'bg-[#22c55e]/10 border border-[#22c55e]/20' : 'bg-slate-700/50 border border-slate-600/50'}`}>
                    <div className={`text-xs font-medium mb-1 ${msg.role === 'user' ? 'text-[#22c55e]' : 'text-cyan-400'}`}>
                      {msg.role === 'user' ? 'You (Admin Test)' : '🤖 AI Chatbot'}
                    </div>
                    <div className="text-white text-sm whitespace-pre-wrap">{msg.content}</div>
                  </div>
                </div>
              ))
            )}
            {testing && (
              <div className="flex justify-start">
                <div className="bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-2.5">
                  <div className="text-cyan-400 text-xs font-medium mb-1">🤖 AI Chatbot</div>
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-slate-700">
            <div className="flex gap-2">
              <input
                type="text"
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleTestSend(); }}
                placeholder="Test a question..."
                className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#22c55e]/50"
              />
              <button
                onClick={handleTestSend}
                disabled={testing || !testInput.trim()}
                className="bg-cyan-500/20 hover:bg-cyan-500/30 disabled:opacity-50 text-cyan-400 px-4 rounded-lg transition-colors flex items-center gap-1.5 text-sm border border-cyan-500/30"
              >
                <PaperAirplaneIcon className="w-4 h-4" />
                Test
              </button>
            </div>
            <button
              onClick={() => setTestMessages([])}
              className="text-slate-500 hover:text-slate-300 text-xs mt-2 transition-colors"
            >
              Clear conversation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
