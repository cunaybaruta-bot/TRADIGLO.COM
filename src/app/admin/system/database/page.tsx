'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { CircleStackIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface TableInfo {
  name: string;
  count: number;
  status: 'ok' | 'error';
}

export default function DatabaseStatusPage() {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const checkDatabase = useCallback(async () => {
    const supabase = createClient();
    const tableNames = ['users', 'wallets', 'trades', 'deposits', 'withdrawals', 'assets', 'market_prices'];
    const results = await Promise.all(
      tableNames.map(async (name) => {
        try {
          const { count } = await supabase.from(name).select('*', { count: 'exact', head: true });
          return { name, count: count || 0, status: 'ok' as const };
        } catch {
          return { name, count: 0, status: 'error' as const };
        }
      })
    );
    setTables(results);
    setLoading(false);
  }, []);

  useEffect(() => { checkDatabase(); }, [checkDatabase]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Database Status</h1>
        <p className="text-gray-400 text-sm mt-1">Supabase database health and table statistics</p>
      </div>

      <div className="bg-[#0f1629] border border-white/10 rounded-xl p-4">
        <h2 className="text-white font-semibold mb-4 flex items-center gap-2"><CircleStackIcon className="w-5 h-5 text-blue-400" /> Table Status</h2>
        {loading ? (
          <div className="text-center py-12 text-gray-400">Checking database...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {tables.map((t) => (
              <div key={t.name} className={`p-4 rounded-xl border ${t.status === 'ok' ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-medium capitalize">{t.name}</span>
                  {t.status === 'ok' ? <CheckCircleIcon className="w-4 h-4 text-green-400" /> : <ExclamationTriangleIcon className="w-4 h-4 text-red-400" />}
                </div>
                <div className="text-gray-400 text-sm">{t.count.toLocaleString()} records</div>
                <div className={`text-xs mt-1 ${t.status === 'ok' ? 'text-green-400' : 'text-red-400'}`}>{t.status === 'ok' ? 'Healthy' : 'Error'}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
