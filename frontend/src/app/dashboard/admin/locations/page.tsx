'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  MapPin,
  Trash2,
  RefreshCw,
  ArrowLeft,
  Filter,
  CheckCircle2,
  Clock,
  Lock,
  Truck,
  User,
  AlertCircle,
} from 'lucide-react';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { locationApi, AdminLocationRecordItem } from '@/lib/locationApi';

export default function AdminLocationsPage() {
  const [records, setRecords] = useState<AdminLocationRecordItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [purposeFilter, setPurposeFilter] = useState<string>('ALL');
  const [includeRevoked, setIncludeRevoked] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState<boolean>(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Check client role with graceful unauthenticated default for dev / demo navigation
  useEffect(() => {
    try {
      const rawUser = localStorage.getItem('agrimarket_user');
      if (rawUser) {
        const u = JSON.parse(rawUser);
        setUserRole(u.role || 'SUPERADMIN');
        setIsAuthorized(true);
      } else {
        setUserRole('ADMIN (Dev Mode)');
        setIsAuthorized(true);
      }
    } catch {
      setUserRole('ADMIN (Dev Mode)');
      setIsAuthorized(true);
    }
  }, []);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await locationApi.getAdminRecords({
        limit: 100,
        purpose: purposeFilter !== 'ALL' ? purposeFilter : undefined,
        includeRevoked,
      });
      if (res?.data?.records) {
        setRecords(res.data.records);
      } else {
        setRecords([]);
      }
    } catch (err: any) {
      if (err?.message?.includes('AUTH_REQUIRED') || err?.message?.includes('Forbidden')) {
        setIsAuthorized(false);
        setError('Access denied: You do not possess ADMIN or SUPERADMIN privileges required to inspect user GPS audit records.');
      } else {
        setError(err?.message || 'Unable to load location audit records.');
      }
    } finally {
      setLoading(false);
    }
  }, [purposeFilter, includeRevoked]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleDelete = async (id: string) => {
    if (!confirm('Permanent Privacy Deletion: Are you sure you want to permanently purge this location record from the database?')) {
      return;
    }
    setDeletingId(id);
    try {
      await locationApi.deleteAdminRecord(id);
      setRecords(prev => prev.filter(r => r.id !== id));
      setActionMessage('Record permanently purged in accordance with privacy retention policy.');
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err: any) {
      alert(err?.message || 'Failed to delete record.');
    } finally {
      setDeletingId(null);
    }
  };

  const activeCount = records.filter(r => !r.isRevoked).length;
  const revokedCount = records.filter(r => r.isRevoked).length;

  return (
    <div className="min-h-screen bg-[#F4F7F5] dark:bg-[#07130D] text-[#0B3322] dark:text-[#EEFAF3] transition-colors">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-[#0A1812]/95 backdrop-blur-md border-b border-[#E3EDE6] dark:border-[#1A3326] h-16 px-4 sm:px-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/worker"
            className="flex items-center gap-1.5 text-xs font-bold text-[#517663] dark:text-[#88B8A0] hover:text-[#0B3322] dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Worker Dashboard</span>
          </Link>
          <div className="h-5 w-px bg-slate-200 dark:bg-slate-700" />
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h1 className="text-sm sm:text-base font-black">Admin GPS Location Audit Console</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Banner with Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-[#0D2118] p-5 rounded-2xl border border-[#E3EDE6] dark:border-[#1E4130] shadow-xs">
            <p className="text-xs uppercase font-bold text-[#6B8B7B] dark:text-[#88B8A0]">Total Audit Records</p>
            <p className="text-2xl font-black mt-1 text-[#0B3322] dark:text-[#EEFAF3]">{records.length}</p>
          </div>
          <div className="bg-white dark:bg-[#0D2118] p-5 rounded-2xl border border-[#E3EDE6] dark:border-[#1E4130] shadow-xs">
            <p className="text-xs uppercase font-bold text-emerald-600 dark:text-emerald-400">Active Consented Records</p>
            <p className="text-2xl font-black mt-1 text-emerald-700 dark:text-emerald-300">{activeCount}</p>
          </div>
          <div className="bg-white dark:bg-[#0D2118] p-5 rounded-2xl border border-[#E3EDE6] dark:border-[#1E4130] shadow-xs">
            <p className="text-xs uppercase font-bold text-amber-600 dark:text-amber-400">Consent Revoked</p>
            <p className="text-2xl font-black mt-1 text-amber-700 dark:text-amber-300">{revokedCount}</p>
          </div>
        </div>

        {actionMessage && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{actionMessage}</span>
          </div>
        )}

        {/* Access Warning if not admin */}
        {!isAuthorized ? (
          <div className="bg-white dark:bg-[#0D2118] rounded-3xl border border-rose-200 dark:border-rose-900/60 p-8 sm:p-12 text-center max-w-xl mx-auto space-y-4">
            <div className="w-14 h-14 rounded-full bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <Lock className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#0B3322] dark:text-[#EEFAF3]">
                RBAC Access Denied
              </h2>
              <p className="text-xs text-[#6B8B7B] dark:text-[#88B8A0] mt-1.5 leading-relaxed">
                Precise GPS location telemetry is strictly governed under role-based access control.
                Only authenticated administrators (<span className="font-mono font-bold text-rose-600">ADMIN</span> or <span className="font-mono font-bold text-rose-600">SUPERADMIN</span>) may view the location records.
              </p>
              <p className="text-xs text-slate-400 mt-2">
                Your detected role: <span className="font-mono font-bold uppercase">{userRole || 'GUEST / UNKNOWN'}</span>
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/login"
                className="inline-block px-5 py-2.5 rounded-xl bg-[#075C3B] text-white text-xs font-bold hover:bg-[#096e47] transition-colors"
              >
                Log In as Administrator
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-[#0D2118] rounded-3xl border border-[#E3EDE6] dark:border-[#1E4130] shadow-sm overflow-hidden">
            {/* Filter toolbar */}
            <div className="p-4 sm:p-6 border-b border-[#E3EDE6] dark:border-[#1A3326] flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5 text-[#517663] dark:text-[#88B8A0] font-semibold">
                  <Filter className="w-3.5 h-3.5" />
                  <span>Purpose Filter:</span>
                </div>
                <select
                  value={purposeFilter}
                  onChange={e => setPurposeFilter(e.target.value)}
                  className="px-3.5 py-2 rounded-xl bg-[#F0F5F2] dark:bg-[#12281E] border border-[#D5E6DC] dark:border-[#1E4130] text-[#0B3322] dark:text-[#EEFAF3] font-medium focus:outline-none focus:border-[#088647]"
                >
                  <option value="ALL">All Purposes</option>
                  <option value="DELIVERY_DISPATCH">DELIVERY_DISPATCH</option>
                  <option value="LIVE_ORDER_TRACKING">LIVE_ORDER_TRACKING</option>
                  <option value="WORKER_AVAILABILITY">WORKER_AVAILABILITY</option>
                </select>

                <label className="flex items-center gap-2 text-[#517663] dark:text-[#88B8A0] font-semibold cursor-pointer ml-3">
                  <input
                    type="checkbox"
                    checked={includeRevoked}
                    onChange={e => setIncludeRevoked(e.target.checked)}
                    className="accent-[#088647] rounded w-4 h-4"
                  />
                  <span>Show Revoked Records</span>
                </label>
              </div>

              <button
                onClick={() => fetchRecords()}
                disabled={loading}
                className="px-4 py-2 rounded-xl bg-[#F0F5F2] dark:bg-[#12281E] border border-[#D5E6DC] dark:border-[#1E4130] text-[#0B3322] dark:text-[#EEFAF3] hover:bg-[#E3EDE6] dark:hover:bg-[#163828] font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Reload Records</span>
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              {loading && records.length === 0 ? (
                <div className="py-16 text-center text-xs text-[#6B8B7B] dark:text-[#88B8A0] flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-[#088647]" />
                  <span>Loading consented GPS records...</span>
                </div>
              ) : error ? (
                <div className="p-6 text-center text-xs text-rose-600 dark:text-rose-400">
                  {error}
                </div>
              ) : records.length === 0 ? (
                <div className="py-16 text-center text-xs text-[#6B8B7B] dark:text-[#88B8A0]">
                  No location records found. When workers share their GPS with browser consent, records will display here.
                </div>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#F0F5F2] dark:bg-[#12281E] text-[#517663] dark:text-[#88B8A0] uppercase text-[10px] font-bold tracking-wider border-b border-[#E3EDE6] dark:border-[#1E4130]">
                    <tr>
                      <th className="py-3.5 px-6">User / Worker</th>
                      <th className="py-3.5 px-6">Coordinates & Accuracy</th>
                      <th className="py-3.5 px-6">Consent Metadata</th>
                      <th className="py-3.5 px-6">Captured At</th>
                      <th className="py-3.5 px-6">Status</th>
                      <th className="py-3.5 px-6 text-right">Privacy Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E3EDE6] dark:divide-[#1E4130]">
                    {records.map(rec => (
                      <tr key={rec.id} className="hover:bg-[#F9FCFA] dark:hover:bg-[#163828]/40 transition-colors">
                        <td className="py-4 px-6">
                          <div className="font-bold text-[#0B3322] dark:text-[#EEFAF3] text-sm">
                            {rec.user.name}
                          </div>
                          <div className="text-[11px] text-[#6B8B7B] dark:text-[#88B8A0] flex items-center gap-2 mt-0.5">
                            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-bold">
                              {rec.user.role}
                            </span>
                            {rec.user.vehicle && (
                              <span className="flex items-center gap-1">
                                <Truck className="w-3 h-3" />
                                {rec.user.vehicle}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-4 px-6">
                          <div className="font-mono font-bold text-[#0B3322] dark:text-[#EEFAF3] flex items-center gap-1.5">
                            <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span>
                              {rec.coordinates.latitude.toFixed(6)}, {rec.coordinates.longitude.toFixed(6)}
                            </span>
                          </div>
                          <div className="text-[11px] text-[#6B8B7B] dark:text-[#88B8A0] mt-1">
                            Reported Accuracy:{' '}
                            <span className="font-bold text-emerald-700 dark:text-emerald-300">
                              {rec.coordinates.accuracy ? `± ${Math.round(rec.coordinates.accuracy)} meters` : 'Standard'}
                            </span>
                          </div>
                        </td>

                        <td className="py-4 px-6">
                          <div className="font-bold text-[#0B3322] dark:text-[#EEFAF3]">
                            {rec.consent.purpose}
                          </div>
                          <div className="text-[11px] text-[#6B8B7B] dark:text-[#88B8A0] mt-0.5">
                            Consent v{rec.consent.version} • Granted: {rec.consent.granted ? 'Yes' : 'No'}
                          </div>
                        </td>

                        <td className="py-4 px-6 text-[#517663] dark:text-[#88B8A0]">
                          <div className="flex items-center gap-1 font-medium">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{new Date(rec.capturedAt).toLocaleTimeString()}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {new Date(rec.capturedAt).toLocaleDateString()}
                          </div>
                        </td>

                        <td className="py-4 px-6">
                          {rec.isRevoked ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                              Consent Revoked
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Active Consented
                            </span>
                          )}
                        </td>

                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={() => handleDelete(rec.id)}
                            disabled={deletingId === rec.id}
                            title="Permanently purge record"
                            className="p-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer disabled:opacity-50"
                          >
                            {deletingId === rec.id ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="p-4 sm:p-6 bg-[#F8FAF9] dark:bg-[#0A1812] border-t border-[#E3EDE6] dark:border-[#1A3326] flex items-center justify-between text-xs text-[#6B8B7B] dark:text-[#88B8A0]">
              <span>Retention Standard: GDPR & DPPA compliant explicit consent GPS logging.</span>
              <span>Showing {records.length} records</span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
