'use client';

import React from 'react';
import Link from 'next/link';
import { AlertCircle, ChevronRight } from 'lucide-react';

interface SystemAlertItem {
  id: string;
  type?: string;
  message: string;
  time: string;
  link: string;
}

interface SystemAlertsCardProps {
  alerts?: SystemAlertItem[];
}

export function SystemAlertsCard({ alerts = [] }: SystemAlertsCardProps) {
  const displayAlerts =
    alerts.length > 0
      ? alerts
      : [
          {
            id: 'alert-1',
            message: 'New farmer registration pending approval',
            time: '2 hours ago',
            link: '/admin/farmers',
          },
          {
            id: 'alert-2',
            message: 'Intercity trade requires admin approval',
            time: '4 hours ago',
            link: '/admin/intercity',
          },
          {
            id: 'alert-3',
            message: 'Low stock alert: Onions (5 kg remaining)',
            time: '5 hours ago',
            link: '/admin/products?stock=low',
          },
        ];

  return (
    <div className="bg-white dark:bg-[#0A2218] border border-[#E3EAE5] dark:border-[#163D2F] rounded-2xl p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-[#142E24] dark:text-[#E6F0EB] font-display">
          System Alerts
        </h3>
      </div>

      {/* Alert list */}
      <div className="space-y-3">
        {displayAlerts.map((alert) => (
          <Link
            key={alert.id}
            href={alert.link}
            className="flex items-center justify-between p-3 rounded-xl border border-red-100 dark:border-red-950/40 bg-red-50/40 dark:bg-red-950/10 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all duration-150 group"
          >
            <div className="flex items-center gap-3 min-w-0">
              {/* Red Circular Warning Icon Badge */}
              <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/40 text-red-500 dark:text-red-400 flex items-center justify-center shrink-0 border border-red-200/60 dark:border-red-800/40 shadow-xs">
                <AlertCircle className="w-4 h-4" />
              </div>

              <div className="min-w-0">
                <span className="text-xs font-semibold text-[#1C2C24] dark:text-[#E6EBE8] group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors line-clamp-1">
                  {alert.message}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 ml-2">
              <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500 whitespace-nowrap">
                {alert.time}
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-gray-400 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
