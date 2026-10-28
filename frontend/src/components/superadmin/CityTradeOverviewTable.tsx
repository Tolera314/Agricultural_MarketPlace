'use client';

import React from 'react';
import Link from 'next/link';
import { MapPin, ArrowRight } from 'lucide-react';
import { CityTradeItem } from '@/lib/superadminApi';

interface CityTradeOverviewTableProps {
  routes?: CityTradeItem[];
}

export function CityTradeOverviewTable({ routes = [] }: CityTradeOverviewTableProps) {
  const displayRoutes: CityTradeItem[] =
    routes.length > 0
      ? routes
      : [
          {
            id: '1',
            origin: 'Addis Ababa',
            destination: 'Bahir Dar',
            routeLabel: 'Addis Ababa → Bahir Dar',
            ordersCount: 120,
            tradeValue: 184000,
            tradeValueFormatted: 'ETB 184,000',
            status: 'Active',
            rawStatus: 'ACTIVE',
          },
          {
            id: '2',
            origin: 'Dire Dawa',
            destination: 'Addis Ababa',
            routeLabel: 'Dire Dawa → Addis Ababa',
            ordersCount: 85,
            tradeValue: 139500,
            tradeValueFormatted: 'ETB 139,500',
            status: 'Active',
            rawStatus: 'ACTIVE',
          },
          {
            id: '3',
            origin: 'Hawassa',
            destination: 'Addis Ababa',
            routeLabel: 'Hawassa → Addis Ababa',
            ordersCount: 54,
            tradeValue: 96200,
            tradeValueFormatted: 'ETB 96,200',
            status: 'Active',
            rawStatus: 'ACTIVE',
          },
          {
            id: '4',
            origin: 'Mekelle',
            destination: 'Addis Ababa',
            routeLabel: 'Mekelle → Addis Ababa',
            ordersCount: 32,
            tradeValue: 61200,
            tradeValueFormatted: 'ETB 61,200',
            status: 'Pending',
            rawStatus: 'UNDER_REVIEW',
          },
        ];

  return (
    <div className="bg-white dark:bg-[#0A2218] border border-[#E3EAE5] dark:border-[#163D2F] rounded-2xl p-6 shadow-xs flex flex-col justify-between">
      {/* Header with Title and "View All" */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-[#142E24] dark:text-[#E6F0EB] font-display">
          City Trade Overview
        </h3>
        <Link
          href="/dashboard/superadmin/routes"
          className="text-xs font-bold text-[#0A7A53] dark:text-[#34D399] hover:underline flex items-center gap-1"
        >
          <span>View All</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Routes List */}
      <div className="divide-y divide-gray-100 dark:divide-[#163D2F]">
        {displayRoutes.slice(0, 4).map((r) => (
          <div
            key={r.id}
            className="py-3.5 flex items-center justify-between gap-4 first:pt-1 last:pb-1 hover:bg-gray-50/60 dark:hover:bg-[#0E3524]/40 px-2 rounded-xl transition-colors"
          >
            {/* Origin -> Destination with Pin */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-[#0E3524] text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-[#142E24] dark:text-[#E6F0EB] truncate">
                  {r.routeLabel}
                </p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  {r.ordersCount} orders
                </p>
              </div>
            </div>

            {/* Trade Value & Status Badge */}
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-xs font-bold text-[#142E24] dark:text-[#E6F0EB]">
                {r.tradeValueFormatted}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${
                  r.status === 'Active'
                    ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                    : 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
                }`}
              >
                {r.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

