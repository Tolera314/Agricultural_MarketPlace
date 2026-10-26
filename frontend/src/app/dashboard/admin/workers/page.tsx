'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Truck,
  Search,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ShieldCheck,
  FileText,
  ExternalLink,
  X,
  XCircle,
} from 'lucide-react';
import { adminApi } from '@/lib/adminApi';

export default function AdminWorkersPage() {
  const [workers, setWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Inspection modal
  const [inspectWorker, setInspectWorker] = useState<any | null>(null);
  const [decisionReason, setDecisionReason] = useState('');

  const fetchWorkers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getWorkers({
        search: search || undefined,
        status: statusFilter || undefined,
      });
      setWorkers(res || []);
    } catch (err: any) {
      console.error('Failed to load delivery workers:', err);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchWorkers();
  }, [fetchWorkers]);

  const handleVerify = async (workerProfileId: string, status: string, customReason?: string) => {
    const reason =
      customReason !== undefined
        ? customReason
        : prompt(
            `Please provide an administrative reason to change status to ${status}:`,
            status === 'VERIFIED'
              ? 'Commercial driving license and vehicle registration verified.'
              : 'Safety compliance audit'
          );
    if (!reason) return;

    setUpdatingId(workerProfileId);
    try {
      await adminApi.verifyWorker(workerProfileId, status, reason);
      setWorkers((prev) =>
        prev.map((w) =>
          w.id === workerProfileId
            ? { ...w, verificationStatus: status, verificationNote: reason }
            : w
        )
      );
      if (inspectWorker && inspectWorker.id === workerProfileId) {
        setInspectWorker({ ...inspectWorker, verificationStatus: status, verificationNote: reason });
      }
      setActionMessage(`Worker verification status successfully updated to ${status}.`);
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err: any) {
      alert(err?.message || 'Failed to update worker status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const getApiUrl = () => process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#142E24] dark:text-[#E6F0EB] font-display">
            Delivery Fleet Operations
          </h1>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-0.5">
            Monitor worker availability, vehicle types, capacity, and dispatch compliance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/admin/locations"
            className="flex items-center gap-2 px-3.5 py-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-semibold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 transition-all"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>GPS Privacy Audit</span>
          </Link>

          <button
            onClick={fetchWorkers}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#0A2218] border border-[#E3EAE5] dark:border-[#163D2F] rounded-xl text-xs font-semibold text-[#142E24] dark:text-[#E2EAE5] hover:border-[#10B981] transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-300 rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by worker name, vehicle plate, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-white dark:bg-[#0A2218] border border-[#E3EAE5] dark:border-[#163D2F] rounded-xl text-[#142E24] dark:text-[#E2EAE5] focus:outline-none focus:border-[#10B981]"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-white dark:bg-[#0A2218] border border-[#E3EAE5] dark:border-[#163D2F] rounded-xl text-[#142E24] dark:text-[#E2EAE5] focus:outline-none focus:border-[#10B981]"
          >
            <option value="">All Verification States</option>
            <option value="PENDING">Pending Verification</option>
            <option value="VERIFIED">Verified / Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>
      </div>

      {/* Workers Table */}
      <div className="bg-white dark:bg-[#0A2218] border border-[#E3EAE5] dark:border-[#163D2F] rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/75 dark:bg-[#0C2A1E]/60 text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider border-b border-[#E3EAE5] dark:border-[#163D2F]">
              <tr>
                <th className="px-5 py-3.5">Courier & Contact</th>
                <th className="px-4 py-3.5">Vehicle Method</th>
                <th className="px-4 py-3.5">Plate & Capacity</th>
                <th className="px-4 py-3.5">Duty Status</th>
                <th className="px-4 py-3.5">Active Jobs</th>
                <th className="px-4 py-3.5">Verification</th>
                <th className="px-5 py-3.5 text-right">Approval Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-[#143427]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-gray-500">
                    Loading delivery fleet...
                  </td>
                </tr>
              ) : workers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-gray-500">
                    No delivery workers found matching criteria.
                  </td>
                </tr>
              ) : (
                workers.map((w) => (
                  <tr key={w.id} className="hover:bg-gray-50/50 dark:hover:bg-[#0E2F22]/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-[#142E24] dark:text-[#E2EAE5]">
                        {w.workerName}
                      </div>
                      <div className="text-[11px] text-gray-500 dark:text-gray-400">
                        {w.phone} {w.email ? `· ${w.email}` : ''}
                      </div>
                    </td>

                    <td className="px-4 py-3.5 font-semibold text-gray-800 dark:text-gray-200">
                      {w.vehicleType}
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="font-mono font-bold text-gray-700 dark:text-gray-300">{w.vehiclePlate}</div>
                      <div className="text-[10px] text-gray-400">
                        {w.vehicleCapacityKg ? `${w.vehicleCapacityKg} kg` : 'Standard'}
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          w.availability === 'ONLINE'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : w.availability === 'BUSY'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                            : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {w.availability}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 font-bold text-gray-800 dark:text-gray-200">
                      {w.activeJobCount} active
                    </td>

                    <td className="px-4 py-3.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          w.verificationStatus === 'VERIFIED'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : w.verificationStatus === 'PENDING'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 animate-pulse'
                            : 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                        }`}
                      >
                        {w.verificationStatus}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => {
                          setInspectWorker(w);
                          setDecisionReason(w.verificationNote || '');
                        }}
                        className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/15 text-[#142E24] dark:text-[#E2EAE5] transition-all"
                      >
                        Inspect
                      </button>

                      {w.verificationStatus !== 'VERIFIED' && (
                        <button
                          disabled={updatingId === w.id}
                          onClick={() => handleVerify(w.id, 'VERIFIED')}
                          className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-all shadow-xs"
                        >
                          Approve
                        </button>
                      )}
                      {w.verificationStatus !== 'SUSPENDED' && (
                        <button
                          disabled={updatingId === w.id}
                          onClick={() => handleVerify(w.id, 'SUSPENDED')}
                          className="px-2.5 py-1.5 rounded-xl text-xs font-semibold border border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all"
                        >
                          Suspend
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Courier Inspection Dossier Modal */}
      {inspectWorker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-[#0A1A12] border border-[#E3EAE5] dark:border-[#163D2F] rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/5 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-teal-950/50 flex items-center justify-center">
                  <Truck className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base sm:text-lg text-[#11261D] dark:text-[#E8F5EF]">
                    Courier Fleet Compliance Dossier
                  </h3>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {inspectWorker.workerName} · {inspectWorker.phone}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setInspectWorker(null)}
                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                <span className="text-gray-400 font-semibold uppercase">Vehicle Type</span>
                <div className="font-bold text-[#11261D] dark:text-[#E8F5EF]">{inspectWorker.vehicleType}</div>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                <span className="text-gray-400 font-semibold uppercase">License Plate</span>
                <div className="font-bold font-mono text-[#11261D] dark:text-[#E8F5EF]">{inspectWorker.vehiclePlate}</div>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                <span className="text-gray-400 font-semibold uppercase">Payload Capacity</span>
                <div className="font-bold text-[#11261D] dark:text-[#E8F5EF]">
                  {inspectWorker.vehicleCapacityKg ? `${inspectWorker.vehicleCapacityKg} kg` : 'Standard'}
                </div>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                <span className="text-gray-400 font-semibold uppercase">Verification Status</span>
                <div className="font-bold text-teal-600">{inspectWorker.verificationStatus}</div>
              </div>
            </div>

            {/* Verification Documents */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Fleet & Driver Documents
              </h4>
              {inspectWorker.verificationDocuments ? (
                <div className="space-y-2">
                  <div className="p-3 rounded-xl border border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-xs text-[#11261D] dark:text-[#E8F5EF]">
                        {inspectWorker.verificationDocuments.identityType || 'Identity Document'}
                      </div>
                      <div className="text-[11px] text-gray-400">
                        Number: {inspectWorker.verificationDocuments.identityNumber || 'N/A'}
                      </div>
                    </div>
                    {inspectWorker.verificationDocuments.identityDocUrl ? (
                      <a
                        href={`${getApiUrl()}${inspectWorker.verificationDocuments.identityDocUrl}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 flex items-center gap-1.5"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>View ID Document</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-[11px] text-gray-400 italic">No document attached</span>
                    )}
                  </div>

                  {inspectWorker.verificationDocuments.driverLicenseDocUrl && (
                    <div className="p-3 rounded-xl border border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-xs text-[#11261D] dark:text-[#E8F5EF]">
                          Driver's License Document
                        </div>
                        <div className="text-[11px] text-gray-400">
                          License: {inspectWorker.verificationDocuments.driverLicenseNumber || 'N/A'}
                        </div>
                      </div>
                      <a
                        href={`${getApiUrl()}${inspectWorker.verificationDocuments.driverLicenseDocUrl}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 flex items-center gap-1.5"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>View License</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic">No document payload attached on file.</p>
              )}
            </div>

            {/* Decision Reason */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                Decision Notes / Rejection Reason
              </label>
              <textarea
                rows={2}
                value={decisionReason}
                onChange={(e) => setDecisionReason(e.target.value)}
                placeholder="Enter fleet review notes..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/5 text-[#11261D] dark:text-[#E8F5EF]"
              />
            </div>

            {/* Modal Actions */}
            <div className="pt-2 flex items-center justify-end gap-2 border-t border-gray-100 dark:border-white/5">
              <button
                disabled={updatingId === inspectWorker.id}
                onClick={() =>
                  handleVerify(
                    inspectWorker.id,
                    'REJECTED',
                    decisionReason || 'Vehicle registration or driving license credentials require correction.'
                  )
                }
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 hover:bg-rose-100"
              >
                Reject with Reason
              </button>

              <button
                disabled={updatingId === inspectWorker.id}
                onClick={() =>
                  handleVerify(
                    inspectWorker.id,
                    'VERIFIED',
                    decisionReason || 'Commercial driving license and vehicle registration verified.'
                  )
                }
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
              >
                Approve Delivery Worker
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
