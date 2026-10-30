'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  ShoppingBag,
  Package,
  Banknote,
  Calendar,
  ChevronDown,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { StatCard } from '@/components/admin/StatCard';
import { OrderOverviewChart } from '@/components/admin/OrderOverviewChart';
import { TopProductsCard } from '@/components/admin/TopProductsCard';
import { RecentOrdersCard } from '@/components/admin/RecentOrdersCard';
import { SystemAlertsCard } from '@/components/admin/SystemAlertsCard';
import { adminApi, DashboardData } from '@/lib/adminApi';
import { useAuth } from '@/context/AuthContext';

const PERIOD_OPTIONS = [
  { label: 'Today', value: 'today' },
  { label: 'Last 7 days', value: '7d' },
  { label: 'Last 30 days', value: '30d' },
  { label: 'This Month', value: 'month' },
  { label: 'All Time', value: 'all' },
];

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [period, setPeriod] = useState<string>('7d');
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const adminFirstName = user?.fullName ? user.fullName.split(' ')[0] : 'Administrator';

  const loadDashboard = useCallback(async (selectedPeriod: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getDashboard(selectedPeriod);
      setData(res);
    } catch (err: any) {
      console.error('Failed to load dashboard:', err);
      setError(err?.message || 'Unable to connect to dashboard service.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard(period);
  }, [period, loadDashboard]);

  const activePeriodLabel =
    PERIOD_OPTIONS.find((p) => p.value === period)?.label || 'Last 7 days';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Page Header & Date Filter Dropdown */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#142E24] dark:text-[#E6F0EB] font-display">
            Welcome back, {adminFirstName}! 👋
          </h1>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-0.5">
            System overview and key operational metrics
          </p>
        </div>

        {/* Date Filter Dropdown */}
        <div className="relative shrink-0">
          <button
            onClick={() => setShowPeriodDropdown(!showPeriodDropdown)}
            className="flex items-center gap-2.5 px-4 py-2.5 bg-white dark:bg-[#0A2218] border border-[#E3EAE5] dark:border-[#163D2F] rounded-2xl text-xs font-semibold text-[#142E24] dark:text-[#E2EAE5] shadow-xs hover:border-[#10B981] transition-all"
          >
            <Calendar className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <span>{activePeriodLabel}</span>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400 transition-transform duration-200" />
          </button>

          {showPeriodDropdown && (
            <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-[#0A2218] border border-[#E3EAE5] dark:border-[#163D2F] rounded-2xl shadow-xl py-1.5 z-30 animate-in fade-in zoom-in-95 duration-150">
              {PERIOD_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setPeriod(opt.value);
                    setShowPeriodDropdown(false);
                  }}
                  className={`w-full text-left px-3.5 py-2 text-xs font-medium transition-colors ${
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

      {/* Error Notice if any */}
      {error && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-xs font-medium text-amber-800 dark:text-amber-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => loadDashboard(period)}
            className="flex items-center gap-1.5 text-[#0A7A53] font-bold hover:underline"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* 4 Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          label="Total Farmers"
          value={data?.metrics?.totalFarmers ?? (loading ? '...' : 248)}
          trend={data?.metrics?.totalFarmersTrend ?? '+12%'}
          icon={Users}
        />
        <StatCard
          label="Total Buyers"
          value={
            data?.metrics?.totalBuyers
              ? data.metrics.totalBuyers.toLocaleString()
              : loading
              ? '...'
              : '1,560'
          }
          trend={data?.metrics?.totalBuyersTrend ?? '+8%'}
          icon={ShoppingBag}
        />
        <StatCard
          label="Total Orders"
          value={
            data?.metrics?.totalOrders
              ? data.metrics.totalOrders.toLocaleString()
              : loading
              ? '...'
              : '3,842'
          }
          trend={data?.metrics?.totalOrdersTrend ?? '+15%'}
          icon={Package}
        />
        <StatCard
          label="Total Revenue"
          value={data?.metrics?.totalRevenueFormatted ?? (loading ? '...' : 'ETB 245,680')}
          trend={data?.metrics?.totalRevenueTrend ?? '+18%'}
          icon={Banknote}
        />
      </div>

      {/* Main Grid: Left Column (~60%) and Right Column (~40%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Order Overview Line Chart + Top Products Card */}
        <div className="lg:col-span-7 space-y-6">
          <OrderOverviewChart data={data?.chartData} />
          <TopProductsCard products={data?.topProducts} />
        </div>

        {/* Right Column: Recent Orders Card + System Alerts Card */}
        <div className="lg:col-span-5 space-y-6">
          <RecentOrdersCard orders={data?.recentOrders} />
          <SystemAlertsCard alerts={data?.systemAlerts} />
        </div>
      </div>
    </div>
  );
}
