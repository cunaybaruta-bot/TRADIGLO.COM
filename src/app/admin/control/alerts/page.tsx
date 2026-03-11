'use client';

import { ExclamationTriangleIcon, CheckCircleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

interface Alert {
  id: number;
  type: 'warning' | 'success' | 'info';
  title: string;
  message: string;
  time: string;
}

const mockAlerts: Alert[] = [
  { id: 1, type: 'warning', title: 'High Trade Volume', message: 'Unusual trading volume detected in the last hour', time: '2 min ago' },
  { id: 2, type: 'info', title: 'New User Registration', message: '5 new users registered in the last 30 minutes', time: '15 min ago' },
  { id: 3, type: 'success', title: 'Deposit Processed', message: 'Large deposit of $10,000 successfully processed', time: '1 hour ago' },
  { id: 4, type: 'warning', title: 'Pending Withdrawals', message: '3 withdrawal requests pending approval', time: '2 hours ago' },
  { id: 5, type: 'info', title: 'System Update', message: 'Platform maintenance scheduled for tonight', time: '3 hours ago' },
];

export default function SystemAlertsPage() {
  const getIcon = (type: Alert['type']) => {
    if (type === 'warning') return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-400" />;
    if (type === 'success') return <CheckCircleIcon className="w-5 h-5 text-green-400" />;
    return <InformationCircleIcon className="w-5 h-5 text-blue-400" />;
  };

  const getBg = (type: Alert['type']) => {
    if (type === 'warning') return 'bg-yellow-500/5 border-yellow-500/20';
    if (type === 'success') return 'bg-green-500/5 border-green-500/20';
    return 'bg-blue-500/5 border-blue-500/20';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">System Alerts</h1>
        <p className="text-gray-400 text-sm mt-1">Platform notifications and system alerts</p>
      </div>

      <div className="space-y-3">
        {mockAlerts.map((alert) => (
          <div key={alert.id} className={`flex items-start gap-4 p-4 rounded-xl border ${getBg(alert.type)}`}>
            <div className="mt-0.5">{getIcon(alert.type)}</div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-medium">{alert.title}</h3>
                <span className="text-gray-500 text-xs">{alert.time}</span>
              </div>
              <p className="text-gray-400 text-sm mt-1">{alert.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
