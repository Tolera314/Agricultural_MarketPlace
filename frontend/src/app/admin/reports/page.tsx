'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Download,
  Calendar,
  RefreshCw,
  TrendingUp,
  CreditCard,
  Truck,
  Users,
} from 'lucide-react';
import { adminApi } from '@/lib/adminApi';

export default function AdminReportsPage() {
  const [report, setReport] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<string>('7d');

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getReports(period as any);
      setReport(res);
    } catch (err: any) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleExportCSV = () => {
    if (!report) return;
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'Metric,Value\n' +
      `Total Orders,${report.summary.totalOrders}\n` +
      `Gross Transaction Volume,${report.summary.grossVolume}\n` +
      `Platform Commission Revenue,${report.summary.platformCommission}\n` +
      `Delivery Logistics Fees,${report.summary.deliveryFees}\n` +
      `Local Orders,${report.summary.localOrders}\n` +
      `Intercity Orders,${report.summary.intercityOrders}\n` +
      `Registered Buyers,${report.summary.registeredBuyers}\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `agrimarket_report_${period}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#142E24] dark:text-[#E6F0EB] font-display">
            Operational & Financial Reports
          </h1>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-0.5">
            Aggregated marketplace metrics, revenue attribution, and CSV data export.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-3.5 py-2 text-xs font-semibold bg-white dark:bg-[#0A2218] border border-[#E3EAE5] dark:border-[#163D2F] rounded-xl text-[#142E24] dark:text-[#E2EAE5] focus:outline-none focus:border-[#10B981]"
          >
            <option value="today">Today</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="all">All Time</option>
          </select>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700 transition-all shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      {report && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 bg-white dark:bg-[#0A2218] border border-[#E3EAE5] dark:border-[#163D2F] rounded-2xl shadow-xs">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1">
              Gross Merchandise Value (GMV)
            </span>
            <div className="text-2xl font-bold text-[#142E24] dark:text-[#E6F0EB]">
              {report.summary.grossVolumeFormatted}
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">Total completed order transactions</p>
          </div>

          <div className="p-5 bg-white dark:bg-[#0A2218] border border-[#E3EAE5] dark:border-[#163D2F] rounded-2xl shadow-xs">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1">
              Platform Commission (Net Revenue)
            </span>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {report.summary.platformCommissionFormatted}
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">Collected marketplace service fee</p>
          </div>

          <div className="p-5 bg-white dark:bg-[#0A2218] border border-[#E3EAE5] dark:border-[#163D2F] rounded-2xl shadow-xs">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1">
              Delivery Logistics Fees
            </span>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              ETB {report.summary.deliveryFees.toLocaleString()}
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">Carrier dispatch fees collected</p>
          </div>

          <div className="p-5 bg-white dark:bg-[#0A2218] border border-[#E3EAE5] dark:border-[#163D2F] rounded-2xl shadow-xs">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1">
              Local vs Intercity Trade
            </span>
            <div className="text-lg font-bold text-gray-800 dark:text-gray-200 mt-1">
              {report.summary.localOrders} Local · {report.summary.intercityOrders} Intercity
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">Across verified municipal corridors</p>
          </div>
        </div>
      )}

      {/* Payment Channels Breakdown */}
      {report && (
        <div className="bg-white dark:bg-[#0A2218] border border-[#E3EAE5] dark:border-[#163D2F] rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-[#142E24] dark:text-[#E6F0EB] font-display flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-emerald-600" />
            <span>Payment Method Distribution</span>
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Object.entries(report.paymentMethodBreakdown || {}).map(([method, count]: [string, any]) => (
              <div
                key={method}
                className="p-4 rounded-xl border border-gray-100 dark:border-[#163D2F] bg-gray-50/50 dark:bg-[#0E2F22]/30 text-center"
              >
                <div className="text-xl font-bold text-emerald-700 dark:text-emerald-300">
                  {count} Orders
                </div>
                <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mt-0.5">
                  {method.replace('_', ' ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
