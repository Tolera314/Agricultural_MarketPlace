'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Truck,
  Search,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  MapPin,
  ShieldCheck,
  Radio,
} from 'lucide-react';
import { adminApi } from '@/lib/adminApi';

export default function AdminWorkersPage() {
  const [workers, setWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

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

  const handleVerify = async (workerProfileId: string, status: string) => {
    const reason = prompt(
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
        prev.map((w) => (w.id === workerProfileId ? { ...w, verificationStatus: status } : w))
      );
      setActionMessage(`Worker verification status successfully updated to ${status}.`);
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err: any) {
      alert(err?.message || 'Failed to update worker status.');
    } finally {
      setUpdatingId(null);
    }
  };

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
            href="/admin/locations"
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
            placeholder="Search by worker name, phone, or license plate..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-white dark:bg-[#0A2218] border border-[#E3EAE5] dark:border-[#163D2F] rounded-xl text-[#142E24] dark:text-[#E2EAE5] focus:outline-none focus:border-[#10B981]"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-xs bg-white dark:bg-[#0A2218] border border-[#E3EAE5] dark:border-[#163D2F] rounded-xl text-[#142E24] dark:text-[#E2EAE5] focus:outline-none focus:border-[#10B981]"
        >
          <option value="">All Verification States</option>
          <option value="PENDING">Pending Review</option>
          <option value="VERIFIED">Verified</option>
          <option value="REJECTED">Rejected</option>
          <option value="SUSPENDED">Suspended</option>
        </select>
      </div>

      {/* Workers Table */}
      <div className="bg-white dark:bg-[#0A2218] border border-[#E3EAE5] dark:border-[#163D2F] rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/75 dark:bg-[#0C2A1E]/60 text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider border-b border-[#E3EAE5] dark:border-[#163D2F]">
              <tr>
                <th className="px-5 py-3.5">Worker Name</th>
                <th className="px-4 py-3.5">Phone & Email</th>
                <th className="px-4 py-3.5">Vehicle Type & Plate</th>
                <th className="px-4 py-3.5">Capacity</th>
                <th className="px-4 py-3.5">Live Availability</th>
                <th className="px-4 py-3.5">Active Jobs</th>
                <th className="px-4 py-3.5">Verification</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-[#143427]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-gray-500">
                    Loading delivery fleet records...
                  </td>
                </tr>
              ) : workers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-gray-500">
                    No delivery workers found matching your query.
                  </td>
                </tr>
              ) : (
                workers.map((w) => (
                  <tr key={w.id} className="hover:bg-gray-50/50 dark:hover:bg-[#0E2F22]/30 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-[#142E24] dark:text-[#E2EAE5]">
                      {w.fullName}
                    </td>

                    <td className="px-4 py-3.5 font-medium text-gray-700 dark:text-gray-300">
                      <div>{w.phone}</div>
                      <div className="text-[11px] text-gray-400">{w.email || '—'}</div>
                    </td>

                    <td className="px-4 py-3.5 font-semibold text-gray-800 dark:text-gray-200">
                      <div className="capitalize">{w.vehicleType.toLowerCase().replace('_', ' ')}</div>
                      <div className="text-[11px] text-gray-400">{w.vehiclePlate}</div>
                    </td>

                    <td className="px-4 py-3.5 text-gray-700 dark:text-gray-300 font-bold">
                      {w.vehicleCapacityKg ? `${w.vehicleCapacityKg} kg` : 'Standard'}
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
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                            : 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                        }`}
                      >
                        {w.verificationStatus}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-right space-x-1.5">
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
    </div>
  );
}
