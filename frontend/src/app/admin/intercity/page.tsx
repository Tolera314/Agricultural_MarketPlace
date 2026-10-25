'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeftRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Route,
  ShieldCheck,
  Building2,
  Clock,
} from 'lucide-react';
import { adminApi } from '@/lib/adminApi';

export default function AdminIntercityPage() {
  const [routes, setRoutes] = useState<any[]>([]);
  const [approvals, setApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [decidingId, setDecidingId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [r, a] = await Promise.all([
        adminApi.getIntercityRoutes(),
        adminApi.getIntercityApprovals(),
      ]);
      setRoutes(r || []);
      setApprovals(a || []);
    } catch (err: any) {
      console.error('Failed to load intercity data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDecision = async (approvalId: string, decision: 'APPROVED' | 'REJECTED') => {
    const notes = prompt(
      `Please provide administrative reasoning for ${decision}:`,
      decision === 'APPROVED' ? 'Cross-city logistics threshold verified.' : 'Route constraints / insufficient carrier capacity'
    );
    if (!notes) return;

    setDecidingId(approvalId);
    try {
      await adminApi.decideIntercityApproval(approvalId, decision, notes);
      setApprovals((prev) =>
        prev.map((app) =>
          app.id === approvalId
            ? { ...app, status: decision, decisionNotes: notes, decisionAt: new Date() }
            : app
        )
      );
      setActionMessage(`Intercity trade authorization recorded as ${decision}.`);
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err: any) {
      alert(err?.message || 'Failed to record decision.');
    } finally {
      setDecidingId(null);
    }
  };

  const pendingApprovals = approvals.filter((a) => a.status === 'PENDING');

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#142E24] dark:text-[#E6F0EB] font-display">
            Intercity Trade & Logistics Authorization
          </h1>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-0.5">
            Govern intercity corridors, order load thresholds, and administrative review approvals.
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

      {actionMessage && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-300 rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* SECTION 1: Intercity Authorization Queue */}
      <div className="bg-white dark:bg-[#0A2218] border border-[#E3EAE5] dark:border-[#163D2F] rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#142E24] dark:text-[#E6F0EB] font-display">
                Pending Trade Approvals Queue
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Cross-regional bulk agricultural purchases requiring mandatory admin review.
              </p>
            </div>
          </div>

          <span className="px-3 py-1 bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 rounded-full text-xs font-bold">
            {pendingApprovals.length} Pending Decision
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/75 dark:bg-[#0C2A1E]/60 text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider border-b border-[#E3EAE5] dark:border-[#163D2F]">
              <tr>
                <th className="px-4 py-3">Order ID</th>
                <th className="px-4 py-3">Buyer Name</th>
                <th className="px-4 py-3">Origin Corridor &rarr; Destination</th>
                <th className="px-4 py-3">Produce Load Summary</th>
                <th className="px-4 py-3">Order Amount</th>
                <th className="px-4 py-3">Approval State</th>
                <th className="px-4 py-3 text-right">Decision Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-[#143427]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    Loading authorization queue...
                  </td>
                </tr>
              ) : approvals.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    No intercity approvals currently recorded.
                  </td>
                </tr>
              ) : (
                approvals.map((app) => (
                  <tr key={app.id} className="hover:bg-gray-50/50 dark:hover:bg-[#0E2F22]/30 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-gray-800 dark:text-gray-200">
                      #{app.orderId.slice(0, 8)}
                    </td>

                    <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200">
                      {app.buyerName}
                    </td>

                    <td className="px-4 py-3 font-semibold text-blue-600 dark:text-blue-400">
                      {app.originCity} → {app.destinationCity}
                    </td>

                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                      {app.productSummary}
                    </td>

                    <td className="px-4 py-3 font-bold text-emerald-600 dark:text-emerald-400">
                      {app.totalAmountFormatted}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          app.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : app.status === 'PENDING'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 animate-pulse'
                            : 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                        }`}
                      >
                        {app.status}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right space-x-1.5">
                      {app.status === 'PENDING' ? (
                        <>
                          <button
                            disabled={decidingId === app.id}
                            onClick={() => handleDecision(app.id, 'APPROVED')}
                            className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-all shadow-xs"
                          >
                            Approve
                          </button>
                          <button
                            disabled={decidingId === app.id}
                            onClick={() => handleDecision(app.id, 'REJECTED')}
                            className="px-2.5 py-1.5 rounded-xl text-xs font-semibold border border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all"
                          >
                            Reject
                          </button>
                        </>
                      ) : (
                        <span className="text-[11px] text-gray-400 italic">
                          Decided {app.decisionAt ? new Date(app.decisionAt).toLocaleDateString() : ''}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 2: Configured Trade Corridors */}
      <div className="bg-white dark:bg-[#0A2218] border border-[#E3EAE5] dark:border-[#163D2F] rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Route className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#142E24] dark:text-[#E6F0EB] font-display">
              Enabled Intercity Routes
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Corridors linking major regional agricultural markets across Ethiopia.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {routes.map((r) => (
            <div
              key={r.id}
              className="p-4 rounded-xl border border-gray-100 dark:border-[#163D2F] bg-gray-50/50 dark:bg-[#0E2F22]/30 flex flex-col justify-between space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#142E24] dark:text-[#E6F0EB]">
                  {r.origin} → {r.destination}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                  {r.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-[#173D2F] pt-2">
                <div>
                  <span className="block font-medium">Estimated Transit:</span>
                  <span className="font-bold text-gray-700 dark:text-gray-300">{r.estimatedTransitDays} Days</span>
                </div>
                <div>
                  <span className="block font-medium">Min Order Limit:</span>
                  <span className="font-bold text-gray-700 dark:text-gray-300">ETB {r.minTransactionLimit.toLocaleString()}</span>
                </div>
                <div>
                  <span className="block font-medium">Admin Approval:</span>
                  <span className="font-bold text-gray-700 dark:text-gray-300">
                    {r.requiresApproval ? 'Required' : 'Automatic'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
