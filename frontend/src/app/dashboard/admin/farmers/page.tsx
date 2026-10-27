'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Sprout,
  Search,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  MapPin,
  FileText,
  ExternalLink,
  X,
  ShieldCheck,
  Clock,
  XCircle,
} from 'lucide-react';
import { adminApi } from '@/lib/adminApi';

export default function AdminFarmersPage() {
  const [farmers, setFarmers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Inspection modal state
  const [inspectFarmer, setInspectFarmer] = useState<any | null>(null);
  const [decisionReason, setDecisionReason] = useState('');

  const fetchFarmers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getFarmers({
        search: search || undefined,
        status: statusFilter || undefined,
      });
      setFarmers(res || []);
    } catch (err: any) {
      console.error('Failed to load farmers:', err);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchFarmers();
  }, [fetchFarmers]);

  const handleVerify = async (farmerProfileId: string, status: string, customNote?: string) => {
    const note =
      customNote !== undefined
        ? customNote
        : prompt(
            `Please provide verification notes or justification for setting status to ${status}:`,
            status === 'VERIFIED'
              ? 'Verified agricultural license and national identification.'
              : 'Documents incomplete or invalid.'
          );
    if (note === null) return;

    setUpdatingId(farmerProfileId);
    try {
      await adminApi.verifyFarmer(farmerProfileId, status, note);
      setFarmers((prev) =>
        prev.map((f) =>
          f.id === farmerProfileId
            ? { ...f, verificationStatus: status, verificationNote: note }
            : f
        )
      );
      if (inspectFarmer && inspectFarmer.id === farmerProfileId) {
        setInspectFarmer({ ...inspectFarmer, verificationStatus: status, verificationNote: note });
      }
      setActionMessage(`Farmer verification successfully updated to ${status}.`);
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err: any) {
      alert(err?.message || 'Failed to update farmer verification.');
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
            Farmer Accounts & Identity Verification
          </h1>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-0.5">
            Review onboarding documents, farm locations, and govern seller verification states.
          </p>
        </div>

        <button
          onClick={fetchFarmers}
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

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by farmer name, farm name, or phone..."
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
            <option value="PENDING">Pending Review</option>
            <option value="VERIFIED">Verified</option>
            <option value="REJECTED">Rejected</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>
      </div>

      {/* Farmers Table */}
      <div className="bg-white dark:bg-[#0A2218] border border-[#E3EAE5] dark:border-[#163D2F] rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/75 dark:bg-[#0C2A1E]/60 text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider border-b border-[#E3EAE5] dark:border-[#163D2F]">
              <tr>
                <th className="px-5 py-3.5">Farmer & Farm Name</th>
                <th className="px-4 py-3.5">Contact Details</th>
                <th className="px-4 py-3.5">Location & Market Hub</th>
                <th className="px-4 py-3.5">Listings Count</th>
                <th className="px-4 py-3.5">Verification State</th>
                <th className="px-4 py-3.5">Verification Notes</th>
                <th className="px-5 py-3.5 text-right">Approval Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-[#143427]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-gray-500">
                    Loading farmers directory...
                  </td>
                </tr>
              ) : farmers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-gray-500">
                    No farmer accounts found matching the criteria.
                  </td>
                </tr>
              ) : (
                farmers.map((f) => (
                  <tr key={f.id} className="hover:bg-gray-50/50 dark:hover:bg-[#0E2F22]/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-[#142E24] dark:text-[#E2EAE5]">
                        {f.farmerName}
                      </div>
                      <div className="text-[11px] text-gray-500 dark:text-gray-400">
                        {f.farmName} {f.isOrganic ? '· (Organic Certified)' : ''}
                      </div>
                    </td>

                    <td className="px-4 py-3.5 font-medium text-gray-700 dark:text-gray-300">
                      <div>{f.phone}</div>
                      <div className="text-[11px] text-gray-400">{f.email || 'No email provided'}</div>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5 font-medium text-gray-700 dark:text-gray-300">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{f.marketName}</span>
                      </div>
                      <div className="text-[10px] text-gray-400 mt-0.5">
                        {f.coordinates.latitude.toFixed(4)}, {f.coordinates.longitude.toFixed(4)}
                      </div>
                    </td>

                    <td className="px-4 py-3.5 font-bold text-gray-800 dark:text-gray-200">
                      {f.listingsCount} Listings
                    </td>

                    <td className="px-4 py-3.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          f.verificationStatus === 'VERIFIED'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : f.verificationStatus === 'PENDING'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 animate-pulse'
                            : 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                        }`}
                      >
                        {f.verificationStatus}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-gray-600 dark:text-gray-400 max-w-xs truncate">
                      {f.verificationNote || 'No notes on record'}
                    </td>

                    <td className="px-5 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => {
                          setInspectFarmer(f);
                          setDecisionReason(f.verificationNote || '');
                        }}
                        className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/15 text-[#142E24] dark:text-[#E2EAE5] transition-all"
                      >
                        Inspect
                      </button>

                      {f.verificationStatus !== 'VERIFIED' && (
                        <button
                          disabled={updatingId === f.id}
                          onClick={() => handleVerify(f.id, 'VERIFIED')}
                          className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-all shadow-xs"
                        >
                          Approve
                        </button>
                      )}
                      {f.verificationStatus !== 'REJECTED' && f.verificationStatus !== 'SUSPENDED' && (
                        <button
                          disabled={updatingId === f.id}
                          onClick={() => handleVerify(f.id, 'SUSPENDED')}
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

      {/* Application Inspection Modal */}
      {inspectFarmer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-[#0A1A12] border border-[#E3EAE5] dark:border-[#163D2F] rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/5 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center">
                  <Sprout className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base sm:text-lg text-[#11261D] dark:text-[#E8F5EF]">
                    Farmer Verification Dossier
                  </h3>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {inspectFarmer.farmerName} · {inspectFarmer.farmName}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setInspectFarmer(null)}
                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Dossier Body */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                <span className="text-gray-400 font-semibold uppercase">Phone</span>
                <div className="font-bold text-[#11261D] dark:text-[#E8F5EF]">{inspectFarmer.phone}</div>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                <span className="text-gray-400 font-semibold uppercase">Email</span>
                <div className="font-bold text-[#11261D] dark:text-[#E8F5EF]">{inspectFarmer.email || 'None'}</div>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                <span className="text-gray-400 font-semibold uppercase">Coordinates</span>
                <div className="font-bold text-[#11261D] dark:text-[#E8F5EF]">
                  {inspectFarmer.coordinates.latitude}, {inspectFarmer.coordinates.longitude}
                </div>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                <span className="text-gray-400 font-semibold uppercase">Current State</span>
                <div className="font-bold text-emerald-600">{inspectFarmer.verificationStatus}</div>
              </div>
            </div>

            {/* Documents preview */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Attached Verification Evidence
              </h4>
              {inspectFarmer.verificationDocuments ? (
                <div className="space-y-2">
                  <div className="p-3 rounded-xl border border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-xs text-[#11261D] dark:text-[#E8F5EF]">
                        {inspectFarmer.verificationDocuments.identityType || 'Identity Document'}
                      </div>
                      <div className="text-[11px] text-gray-400">
                        Number: {inspectFarmer.verificationDocuments.identityNumber || 'N/A'}
                      </div>
                    </div>
                    {inspectFarmer.verificationDocuments.identityDocUrl ? (
                      <a
                        href={`${getApiUrl()}${inspectFarmer.verificationDocuments.identityDocUrl}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>View Document</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-[11px] text-gray-400 italic">No document image attached</span>
                    )}
                  </div>

                  {inspectFarmer.verificationDocuments.landCertificateUrl && (
                    <div className="p-3 rounded-xl border border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-xs text-[#11261D] dark:text-[#E8F5EF]">
                          Land Ownership Certificate
                        </div>
                        <div className="text-[11px] text-gray-400">Agricultural land verification evidence</div>
                      </div>
                      <a
                        href={`${getApiUrl()}${inspectFarmer.verificationDocuments.landCertificateUrl}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>View Certificate</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic">No document payload attached on file.</p>
              )}
            </div>

            {/* Decision Note Input */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                Administrative Decision Notes / Rejection Reason
              </label>
              <textarea
                rows={2}
                value={decisionReason}
                onChange={(e) => setDecisionReason(e.target.value)}
                placeholder="Enter notes or explanation..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/5 text-[#11261D] dark:text-[#E8F5EF]"
              />
            </div>

            {/* Modal Actions */}
            <div className="pt-2 flex items-center justify-end gap-2 border-t border-gray-100 dark:border-white/5">
              <button
                disabled={updatingId === inspectFarmer.id}
                onClick={() =>
                  handleVerify(
                    inspectFarmer.id,
                    'REJECTED',
                    decisionReason || 'Identification document or farm credentials need correction.'
                  )
                }
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 hover:bg-rose-100"
              >
                Reject with Reason
              </button>

              <button
                disabled={updatingId === inspectFarmer.id}
                onClick={() =>
                  handleVerify(
                    inspectFarmer.id,
                    'VERIFIED',
                    decisionReason || 'Verified agricultural credentials and national identification.'
                  )
                }
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
              >
                Approve Farmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
