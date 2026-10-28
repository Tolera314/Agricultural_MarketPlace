'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  trend?: string;
  icon: LucideIcon;
}

export function StatCard({ label, value, trend, icon: Icon }: StatCardProps) {
  return (
    <div className="bg-white dark:bg-[#0A2218] border border-[#E3EAE5] dark:border-[#163D2F] rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-between">
      <div className="flex items-center gap-4">
        {/* Left Circular Icon Badge */}
        <div className="w-13 h-13 rounded-2xl bg-[#E8F5EE] dark:bg-[#0E3524] text-[#0A7A53] dark:text-[#34D399] flex items-center justify-center shrink-0 border border-[#CEE6D9] dark:border-[#174A33] shadow-inner">
          <Icon className="w-6 h-6" />
        </div>

        {/* Metric Details */}
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 block mb-1">
            {label}
          </span>
          <div className="text-2xl font-bold text-[#142E24] dark:text-[#E6F0EB] tracking-tight font-display">
            {value}
          </div>
          {trend && (
            <div className="text-xs font-semibold text-[#0B9660] dark:text-[#34D399] mt-0.5 flex items-center gap-1">
              <span>{trend}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
