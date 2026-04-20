'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { BoltIcon, ClockIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface ApiEndpoint {
  name: string;
  path: string;
  status: 'ok' | 'slow' | 'error';
  latency: number;
  lastChecked: string;
}

async function measureLatency(fn: () => Promise<unknown>): Promise<{ latency: number; ok: boolean }> {
  const start = performance.now();
  try {
    await fn();
    const latency = Math.round(performance.now() - start);
    return { latency, ok: true };
  } catch {
    const latency = Math.round(performance.now() - start);
    return { latency, ok: false };
  }
}

export default function ApiPerformancePage() {
  const [endpoints, setEndpoints] = useState<ApiEndpoint[]>([]);
  const [loading, setLoading] = useState(true);

  const checkEndpoints = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const now = new Date().toLocaleTimeString();

    const [authResult, dbResult, assetsResult, tradesResult, depositsResult] = await Promise.all([
      measureLatency(() => supabase.auth.getSession()),
      measureLatency(() => supabase.from('users').select('id', { count: 'exact', head: true })),
      measureLatency(() => supabase.from('assets').select('id', { count: 'exact', head: true })),
      measureLatency(() => supabase.from('trades').select('id', { count: 'exact', head: true })),
      measureLatency(() => supabase.from('deposits').select('id', { count: 'exact', head: true })),
    ]);

    const getStatus = (latency: number, ok: boolean): 'ok' | 'slow' | 'error' => {
      if (!ok) return 'error';
      if (latency > 1000) return 'slow';
      return 'ok';
    };

    setEndpoints([
      { name: 'Supabase Auth', path: 'supabase/auth', status: getStatus(authResult.latency, authResult.ok), latency: authResult.latency, lastChecked: now },
      { name: 'Users Table', path: 'supabase/users', status: getStatus(dbResult.latency, dbResult.ok), latency: dbResult.latency, lastChecked: now },
      { name: 'Assets Table', path: 'supabase/assets', status: getStatus(assetsResult.latency, assetsResult.ok), latency: assetsResult.latency, lastChecked: now },
      { name: 'Trades Table', path: 'supabase/trades', status: getStatus(tradesResult.latency, tradesResult.ok), latency: tradesResult.latency, lastChecked: now },
      { name: 'Deposits Table', path: 'supabase/deposits', status: getStatus(depositsResult.latency, depositsResult.ok), latency: depositsResult.latency, lastChecked: now },
    ]);
    setLoading(false);
  }, []);

  useEffect(() => { checkEndpoints(); }, [checkEndpoints]);

  const getStatusColor = (status: ApiEndpoint['status']) => {
    if (status === 'ok') return 'text-green-400 bg-green-500/10 border-green-500/20';
    if (status === 'slow') return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
    return 'text-red-400 bg-red-500/10 border-red-500/20';
  };

  const avgLatency = endpoints.length > 0 ? Math.round(endpoints.reduce((s, e) => s + e.latency, 0) / endpoints.length) : 0;
  const healthyCount = endpoints.filter((e) => e.status === 'ok').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">API Performance</h1>
          <p className="text-gray-400 text-sm mt-1">Monitor API endpoint health and response times</p>
        </div>
        <button onClick={checkEndpoints} disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg text-sm transition-colors disabled:opacity-50">
          <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#0f1629] border border-white/10 rounded-xl p-4">
          <div className="text-gray-400 text-sm">Total Endpoints</div>
          <div className="text-2xl font-bold text-white mt-1">{endpoints.length}</div>
        </div>
        <div className="bg-[#0f1629] border border-white/10 rounded-xl p-4">
          <div className="text-gray-400 text-sm">Healthy</div>
          <div className="text-2xl font-bold text-green-400 mt-1">{healthyCount}</div>
        </div>
        <div className="bg-[#0f1629] border border-white/10 rounded-xl p-4">
          <div className="text-gray-400 text-sm">Avg Latency</div>
          <div className="text-2xl font-bold text-blue-400 mt-1">{avgLatency}ms</div>
        </div>
      </div>

      <div className="bg-[#0f1629] border border-white/10 rounded-xl p-4">
        <h2 className="text-white font-semibold mb-4 flex items-center gap-2"><BoltIcon className="w-5 h-5 text-yellow-400" /> Endpoint Status</h2>
        {loading ? (
          <div className="text-center py-12 text-gray-400">Measuring latency...</div>
        ) : (
          <div className="space-y-3">
            {endpoints.map((e) => (
              <div key={e.path} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div>
                  <div className="text-white font-medium">{e.name}</div>
                  <div className="text-gray-500 text-xs font-mono">{e.path}</div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-gray-300 text-sm"><ClockIcon className="w-3 h-3" />{e.latency}ms</div>
                    <div className="text-gray-500 text-xs">checked {e.lastChecked}</div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(e.status)}`}>{e.status.toUpperCase()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
