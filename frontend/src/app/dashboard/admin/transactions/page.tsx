'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  CreditCard,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  FileText,
  DollarSign,
  ArrowDownLeft,
} from 'lucide-react';
import { adminApi } from '@/lib/adminApi';

export default function AdminTransactionsPage() {
  const [data, setData] = useState<{ transactions: any[]; reconciliations: any[] }>({
    transactions: [],
    reconciliations: [],
  });
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getTransactions();
      setData(res || { transactions: [], reconciliations: [] });
    } catch (err: any) {
      console.error('Failed to load transactions:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#142E24] dark:text-[#E6F0EB] font-display">
            Financial Ledger & Reconciliation
          </h1>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-0.5">
            Audit payments, platform commissions, provider references, and cash-on-delivery settlements.
          </p>
        </div>

        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#0A2218] border border-[#E3EAE5] dark:border-[#163D2F] rounded-xl text-xs font-semibold text-[#142E24] dark:text-[#E2EAE5] hover:border-[#10B981] transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* SECTION 1: Transactions Table */}
      <div className="bg-white dark:bg-[#0A2218] border border-[#E3EAE5] dark:border-[#163D2F] rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-[#142E24] dark:text-[#E6F0EB] font-display flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-emerald-600" />
          <span>Payment Transactions</span>
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/75 dark:bg-[#0C2A1E]/60 text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider border-b border-[#E3EAE5] dark:border-[#163D2F]">
              <tr>
                <th className="px-4 py-3">Transaction Reference</th>
                <th className="px-4 py-3">Buyer Name</th>
                <th className="px-4 py-3">Gross Amount</th>
                <th className="px-4 py-3">Platform Commission</th>
                <th className="px-4 py-3">Delivery Fee</th>
                <th className="px-4 py-3">Payment Method</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Date & Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-[#143427]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    Loading financial ledger...
                  </td>
                </tr>
              ) : data.transactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    No transactions recorded.
                  </td>
                </tr>
              ) : (
                data.transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50/50 dark:hover:bg-[#0E2F22]/30 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-gray-800 dark:text-gray-200">
                      #{tx.id.slice(0, 10)}
                    </td>

                    <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200">
                      {tx.buyerName}
                    </td>

                    <td className="px-4 py-3 font-bold text-[#142E24] dark:text-[#E2EAE5]">
                      {tx.amountFormatted}
                    </td>

                    <td className="px-4 py-3 font-semibold text-emerald-600 dark:text-emerald-400">
                      ETB {tx.commission.toLocaleString()}
                    </td>

                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      ETB {tx.deliveryFee.toLocaleString()}
                    </td>

                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300 font-medium">
                      {tx.paymentMethod.replace('_', ' ')}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          tx.paymentStatus === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : tx.paymentStatus === 'FAILED'
                            ? 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                        }`}
                      >
                        {tx.paymentStatus}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right text-gray-400 text-[11px]">
                      {new Date(tx.date).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 2: Cash Reconciliation */}
      <div className="bg-white dark:bg-[#0A2218] border border-[#E3EAE5] dark:border-[#163D2F] rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-[#142E24] dark:text-[#E6F0EB] font-display flex items-center gap-2">
          <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
          <span>COD Cash-on-Delivery Reconciliations</span>
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/75 dark:bg-[#0C2A1E]/60 text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider border-b border-[#E3EAE5] dark:border-[#163D2F]">
              <tr>
                <th className="px-4 py-3">Worker Name</th>
                <th className="px-4 py-3">Worker Phone</th>
                <th className="px-4 py-3">Collected Cash Amount</th>
                <th className="px-4 py-3">Reconciliation State</th>
                <th className="px-4 py-3 text-right">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-[#143427]">
              {data.reconciliations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    No pending cash reconciliations. All worker balances in good standing.
                  </td>
                </tr>
              ) : (
                data.reconciliations.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50/50 dark:hover:bg-[#0E2F22]/30 transition-colors">
                    <td className="px-4 py-3 font-bold text-gray-800 dark:text-gray-200">
                      {r.workerName}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {r.workerPhone}
                    </td>
                    <td className="px-4 py-3 font-bold text-emerald-600 dark:text-emerald-400">
                      {r.amountFormatted}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-500 text-[11px]">
                      {r.notes || 'Routine settlement'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
