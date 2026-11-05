'use client';

import React from 'react';
import Link from 'next/link';
import { UserCheck, Sliders, ShieldAlert, ArrowRight, Activity } from 'lucide-react';
import { RecentActivityItem } from '@/lib/superadminApi';

interface RecentActivitiesCardProps {
  activities?: RecentActivityItem[];
}

export function RecentActivitiesCard({ activities = [] }: RecentActivitiesCardProps) {
  const getIcon = (title: string) => {
    const lower = title.toLowerCase();
    if (lower.includes('admin') || lower.includes('user')) {
      return <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
    }
    if (lower.includes('setting') || lower.includes('policy')) {
      return <Sliders className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
    }
    if (lower.includes('suspicious') || lower.includes('report') || lower.includes('security')) {
      return <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
    }
    return <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
  };

  return (
    <div className="bg-white dark:bg-[#0A2218] border border-[#E3EAE5] dark:border-[#163D2F] rounded-2xl p-6 shadow-xs flex flex-col justify-between">
      {/* Title & View All */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-[#142E24] dark:text-[#E6F0EB] font-display">
          Recent Activities
        </h3>
        <Link
          href="/dashboard/superadmin/audit-logs"
          className="text-xs font-bold text-[#0A7A53] dark:text-[#34D399] hover:underline flex items-center gap-1"
        >
          <span>View All</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Activity Items */}
      {activities.length === 0 ? (
        <div className="py-8 text-center text-xs text-gray-400 dark:text-gray-500">
          <p className="font-semibold text-gray-700 dark:text-gray-300">No recent security or audit events</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Platform governance and administrative actions will be logged here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {activities.slice(0, 3).map((act) => (
            <div
              key={act.id}
              className="flex items-start gap-3.5 p-2 rounded-xl hover:bg-gray-50/60 dark:hover:bg-[#0E3524]/40 transition-colors"
            >
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-[#0E3524] flex items-center justify-center shrink-0 mt-0.5">
                {getIcon(act.title)}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-[#142E24] dark:text-[#E6F0EB] leading-tight">
                  {act.title}
                </p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                  {act.formattedDate}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

