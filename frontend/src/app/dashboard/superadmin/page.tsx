'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  UserCheck,
  ShoppingBag,
  Truck,
  Calendar,
  ChevronDown,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { StatCard } from '@/components/admin/StatCard';
import { PlatformGrowthChart } from '@/components/superadmin/PlatformGrowthChart';
import { CityTradeOverviewTable } from '@/components/superadmin/CityTradeOverviewTable';
import { RecentActivitiesCard } from '@/components/superadmin/RecentActivitiesCard';
import { QuickActionsCard } from '@/components/superadmin/QuickActionsCard';
import { superadminApi, SuperadminDashboardData } from '@/lib/superadminApi';

const PERIOD_OPTIONS = [
  { label: 'Last 7 days', value: '7d' },
  { label: 'Last 30 days', value: '30d' },
  { label: 'Last 90 days', value: '90d' },
  { label: 'All Time', value: 'all' },
];

export default function SuperadminDashboardPage() {
  const [period, setPeriod] = useState<string>('30d');
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);
  const [data, setData] = useState<SuperadminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async (selectedPeriod: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await superadminApi.getDashboard(selectedPeriod);
      setData(res);
    } catch (err: any) {
      console.error('Failed to load superadmin dashboard:', err);
      setError(err?.message || 'Unable to connect to Superadmin service.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard(period);
  }, [period, loadDashboard]);

  const activePeriodLabel =
    PERIOD_OPTIONS.find((p) => p.value === period)?.label || 'Last 30 days';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Page Header & Date Filter Dropdown */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#142E24] dark:text-[#E6F0EB] font-display">
            Superadmin Dashboard
          </h1>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-0.5">
            Full system control and oversight
          </p>
        </div>

        {/* Date Filter Dropdown */}
        <div className="relative shrink-0">
          <button
            onClick={() => setShowPeriodDropdown(!showPeriodDropdown)}
            className="flex items-center gap-2.5 px-4 py-2.5 bg-white dark:bg-[#0A2218] border border-[#E3EAE5] dark:border-[#163D2F] rounded-2xl text-xs font-semibold text-[#142E24] dark:text-[#E2EAE5] shadow-xs hover:border-[#10B981] transition-all cursor-pointer"
          >
            <Calendar className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <span>{activePeriodLabel}</span>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400 transition-transform duration-200" />
          </button>

          {showPeriodDropdown && (
            <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-[#0A2218] border border-[#E3EAE5] dark:border-[#163D2F] rounded-2xl shadow-xl py-1.5 z-30 animate-in fade-in zoom-in-95 duration-150">
              {PERIOD_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setPeriod(opt.value);
                    setShowPeriodDropdown(false);
                  }}
                  className={`w-full text-left px-3.5 py-2 text-xs font-medium transition-colors cursor-pointer ${
                    period === opt.value
                      ? 'bg-[#E8F5EE] text-[#0A7A53] dark:bg-[#0E3524] dark:text-[#34D399] font-bold'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#0C2A1E]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Error Notice with Retry */}
      {error && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-xs font-medium text-amber-800 dark:text-amber-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => loadDashboard(period)}
            className="flex items-center gap-1.5 text-[#0A7A53] font-bold hover:underline cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* 4 Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          label="Total Users"
          value={
            loading
              ? '...'
              : data?.metrics?.totalUsers !== undefined
              ? data.metrics.totalUsers.toLocaleString()
              : '0'
          }
          trend={data?.metrics?.totalUsersTrend}
          icon={Users}
        />
        <StatCard
          label="Total Farmers"
          value={
            loading
              ? '...'
              : data?.metrics?.totalFarmers !== undefined
              ? data.metrics.totalFarmers.toLocaleString()
              : '0'
          }
          trend={data?.metrics?.totalFarmersTrend}
          icon={UserCheck}
        />
        <StatCard
          label="Total Buyers"
          value={
            loading
              ? '...'
              : data?.metrics?.totalBuyers !== undefined
              ? data.metrics.totalBuyers.toLocaleString()
              : '0'
          }
          trend={data?.metrics?.totalBuyersTrend}
          icon={ShoppingBag}
        />
        <StatCard
          label="Total Deliveries"
          value={
            loading
              ? '...'
              : data?.metrics?.totalDeliveries !== undefined
              ? data.metrics.totalDeliveries.toLocaleString()
              : '0'
          }
          trend={data?.metrics?.totalDeliveriesTrend}
          icon={Truck}
        />
      </div>

      {/* Middle Row: Platform Growth Chart & City Trade Overview Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <PlatformGrowthChart data={data?.platformGrowth} />
        <CityTradeOverviewTable routes={data?.cityTradeOverview} />
      </div>

      {/* Bottom Row: Recent Activities & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <RecentActivitiesCard activities={data?.recentActivities} />
        <QuickActionsCard />
      </div>
    </div>
  );
}

