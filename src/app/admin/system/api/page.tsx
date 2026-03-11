'use client';

import { useState, useEffect } from 'react';
import { BoltIcon, ClockIcon } from '@heroicons/react/24/outline';

interface ApiEndpoint {
  name: string;
  path: string;
  status: 'ok' | 'slow' | 'error';
  latency: number;
  uptime: number;
}

export default function ApiPerformancePage() {
  const [endpoints, setEndpoints] = useState<ApiEndpoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const mockEndpoints: ApiEndpoint[] = [
      { name: 'Markets API', path: '/api/markets', status: 'ok', latency: 45, uptime: 99.9 },
      { name: 'Price Engine', path: '/api/admin/price-engine', status: 'ok', latency: 120, uptime: 99.5 },
      { name: 'Asset Sync', path: '/api/admin/sync-assets', status: 'ok', latency: 230, uptime: 98.8 },
      { name: 'Supabase Auth', path: 'supabase/auth', status: 'ok', latency: 35, uptime: 99.99 },
      { name: 'Supabase DB', path: 'supabase/db', status: 'ok', latency: 28, uptime: 99.99 },
    ];
    setEndpoints(mockEndpoints);
    setLoading(false);
  }, []);

  const getStatusColor = (status: ApiEndpoint['status']) => {
    if (status === 'ok') return 'text-green-400 bg-green-500/10 border-green-500/20';
    if (status === 'slow') return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
    return 'text-red-400 bg-red-500/10 border-red-500/20';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">API Performance</h1>
        <p className="text-gray-400 text-sm mt-1">Monitor API endpoint health and response times</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#0f1629] border border-white/10 rounded-xl p-4">
          <div className="text-gray-400 text-sm">Total Endpoints</div>
          <div className="text-2xl font-bold text-white mt-1">{endpoints.length}</div>
        </div>
        <div className="bg-[#0f1629] border border-white/10 rounded-xl p-4">
          <div className="text-gray-400 text-sm">Healthy</div>
          <div className="text-2xl font-bold text-green-400 mt-1">{endpoints.filter((e) => e.status === 'ok').length}</div>
        </div>
        <div className="bg-[#0f1629] border border-white/10 rounded-xl p-4">
          <div className="text-gray-400 text-sm">Avg Latency</div>
          <div className="text-2xl font-bold text-blue-400 mt-1">
            {endpoints.length > 0 ? Math.round(endpoints.reduce((s, e) => s + e.latency, 0) / endpoints.length) : 0}ms
          </div>
        </div>
      </div>

      <div className="bg-[#0f1629] border border-white/10 rounded-xl p-4">
        <h2 className="text-white font-semibold mb-4 flex items-center gap-2"><BoltIcon className="w-5 h-5 text-yellow-400" /> Endpoint Status</h2>
        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading API status...</div>
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
                    <div className="text-gray-500 text-xs">{e.uptime}% uptime</div>
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
