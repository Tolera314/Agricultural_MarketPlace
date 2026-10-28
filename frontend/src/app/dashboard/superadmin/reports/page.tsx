'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Calendar,
  Download,
  TrendingUp,
  DollarSign,
  Package,
  Users,
  FileSpreadsheet,
  RefreshCw,
} from 'lucide-react';
import { superadminApi } from '@/lib/superadminApi';

export default function SuperadminReportsPage() {
  const [period, setPeriod] = useState<string>('30d');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const loadReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await superadminApi.getReports(period);
      setData(res);
    } catch (err: any) {
      setError(err?.message || 'Failed to load platform analytics report.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [period]);

  const handleExportCSV = () => {
    if (!data) return;
    const rows = [
      ['Metric', 'Value (ETB / Count)'],
      ['Gross Merchandise Value (GMV)', data.financials.grossVolume],
      ['Platform Net Commission Revenue', data.financials.platformCommission],
      ['Delivery Logistics Fees', data.financials.deliveryFees],
      ['Farmer Payout Amount', data.financials.farmerPayouts],
      ['Total Completed Orders', data.ordersBreakdown.totalCompleted],
      ['Local Market Orders', data.ordersBreakdown.localOrders],
      ['Intercity Corridors Orders', data.ordersBreakdown.intercityOrders],
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `agrimarket_report_${period}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setExportNotice('Platform report CSV exported successfully.');
    setTimeout(() => setExportNotice(null), 4000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#142E24] dark:text-[#E6F0EB] font-display">
            Reports & Analytics
          </h1>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-0.5">
            Platform-wide reconciled financial summaries, trade volumes, and demographic indicators
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Period Filter */}
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-3.5 py-2.5 bg-white dark:bg-[#0A2218] border border-[#E3EAE5] dark:border-[#163D2F] rounded-xl text-xs font-semibold text-[#142E24] dark:text-[#E2EAE5] focus:outline-none cursor-pointer shadow-2xs"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="all">All Time</option>
          </select>

          {/* Export Button */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#059669] hover:bg-[#047857] text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {exportNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200">
          {exportNotice}
        </div>
      )}

      {loading || !data ? (
        <div className="py-20 text-center text-gray-400 text-sm">
          Aggregating financial and trade datasets...
        </div>
      ) : (
        <>
          {/* 4 Financial Highlight Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white dark:bg-[#0A2218] border border-[#E3EAE5] dark:border-[#163D2F] rounded-2xl p-5 shadow-xs">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                Gross Marketplace Value (GMV)
              </span>
              <div className="text-2xl font-black text-[#142E24] dark:text-[#E6F0EB]">
                {data.financials.grossVolumeFormatted}
              </div>
              <p className="text-[10px] text-gray-500 mt-1">Total completed transaction volume</p>
            </div>

            <div className="bg-white dark:bg-[#0A2218] border border-[#E3EAE5] dark:border-[#163D2F] rounded-2xl p-5 shadow-xs">
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block mb-1">
                Platform Commission Revenue
              </span>
              <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400">
                {data.financials.platformCommissionFormatted}
              </div>
              <p className="text-[10px] text-gray-500 mt-1">Net platform fee earnings</p>
            </div>

            <div className="bg-white dark:bg-[#0A2218] border border-[#E3EAE5] dark:border-[#163D2F] rounded-2xl p-5 shadow-xs">
              <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block mb-1">
                Carrier Delivery Fees
              </span>
              <div className="text-2xl font-black text-blue-700 dark:text-blue-400">
                {data.financials.deliveryFeesFormatted}
              </div>
              <p className="text-[10px] text-gray-500 mt-1">Dispatched logistics revenue</p>
            </div>

            <div className="bg-white dark:bg-[#0A2218] border border-[#E3EAE5] dark:border-[#163D2F] rounded-2xl p-5 shadow-xs">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                Farmer Payout Net
              </span>
              <div className="text-2xl font-black text-gray-800 dark:text-gray-100">
                {data.financials.farmerPayoutsFormatted}
              </div>
              <p className="text-[10px] text-gray-500 mt-1">Product revenue attributed to farmers</p>
            </div>
          </div>

          {/* Trade Volumes Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-[#0A2218] border border-[#E3EAE5] dark:border-[#163D2F] rounded-2xl p-6 shadow-xs space-y-4">
              <h3 className="font-bold text-sm text-[#142E24] dark:text-[#E6F0EB] border-b border-gray-100 dark:border-[#163D2F] pb-3">
                Order Channel Distribution
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="font-semibold text-gray-600 dark:text-gray-300">Local Market Deliveries</span>
                    <span className="font-bold text-[#142E24] dark:text-[#E6F0EB]">
                      {data.ordersBreakdown.localOrders} orders
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-gray-100 dark:bg-[#0E2E20] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{
                        width: `${
                          data.ordersBreakdown.totalCompleted > 0
                            ? (data.ordersBreakdown.localOrders / data.ordersBreakdown.totalCompleted) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="font-semibold text-gray-600 dark:text-gray-300">Intercity Cargo Shipments</span>
                    <span className="font-bold text-[#142E24] dark:text-[#E6F0EB]">
                      {data.ordersBreakdown.intercityOrders} orders
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-gray-100 dark:bg-[#0E2E20] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-sky-500 rounded-full"
                      style={{
                        width: `${
                          data.ordersBreakdown.totalCompleted > 0
                            ? (data.ordersBreakdown.intercityOrders / data.ordersBreakdown.totalCompleted) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* User Demographics Breakdown */}
            <div className="bg-white dark:bg-[#0A2218] border border-[#E3EAE5] dark:border-[#163D2F] rounded-2xl p-6 shadow-xs space-y-4">
              <h3 className="font-bold text-sm text-[#142E24] dark:text-[#E6F0EB] border-b border-gray-100 dark:border-[#163D2F] pb-3">
                Platform Account Demographics
              </h3>

              <div className="grid grid-cols-2 gap-3 text-xs">
                {data.userDistribution.map((item: any) => (
                  <div key={item.role} className="p-3 rounded-xl bg-gray-50 dark:bg-[#0E2E20]">
                    <span className="text-[10px] font-bold uppercase text-gray-500">{item.role}</span>
                    <p className="text-lg font-black text-[#142E24] dark:text-[#E6F0EB] mt-0.5">
                      {item.count.toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

