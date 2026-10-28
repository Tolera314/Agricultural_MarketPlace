'use client';

import React from 'react';
import Link from 'next/link';
import { Users, Store, Edit3, FileText } from 'lucide-react';

export function QuickActionsCard() {
  const actions = [
    {
      label: 'Manage Users',
      href: '/dashboard/superadmin/users',
      icon: Users,
    },
    {
      label: 'Configure Markets',
      href: '/dashboard/superadmin/markets',
      icon: Store,
    },
    {
      label: 'Update Fees',
      href: '/dashboard/superadmin/commissions',
      icon: Edit3,
    },
    {
      label: 'View Reports',
      href: '/dashboard/superadmin/reports',
      icon: FileText,
    },
  ];

  return (
    <div className="bg-white dark:bg-[#0A2218] border border-[#E3EAE5] dark:border-[#163D2F] rounded-2xl p-6 shadow-xs flex flex-col justify-between">
      {/* Title */}
      <h3 className="text-base font-bold text-[#142E24] dark:text-[#E6F0EB] font-display mb-4">
        Quick Actions
      </h3>

      {/* 2x2 Grid matching screenshot */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <Link
              key={act.label}
              href={act.href}
              className="flex items-center gap-3 p-3.5 rounded-xl border border-[#E3EAE5] dark:border-[#163D2F] bg-[#F9FBFA] dark:bg-[#0E2E20] hover:bg-emerald-50 dark:hover:bg-[#13422E] hover:border-emerald-300 dark:hover:border-emerald-700 transition-all cursor-pointer group shadow-2xs"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-[#164C35] text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-[#142E24] dark:text-[#E6F0EB] group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors">
                {act.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

