'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  MapPin,
  Trash2,
  RefreshCw,
  X,
  ExternalLink,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Lock,
  User,
  Truck,
} from 'lucide-react';
import { locationApi, AdminLocationRecordItem } from '@/lib/locationApi';

interface AdminLocationViewModalProps {
  open: boolean;
  onClose: () => void;
}

export function AdminLocationViewModal({ open, onClose }: AdminLocationViewModalProps) {
  const [records, setRecords] = useState<AdminLocationRecordItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [purposeFilter, setPurposeFilter] = useState<string>('ALL');
  const [includeRevoked, setIncludeRevoked] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState<boolean>(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Check client role
  useEffect(() => {
    try {
      const rawUser = localStorage.getItem('agrimarket_user');
      if (rawUser) {
        const u = JSON.parse(rawUser);
        setUserRole(u.role || 'GUEST');
        const allowed = u.role === 'ADMIN' || u.role === 'SUPERADMIN';
        setIsAuthorized(allowed);
      } else {
        setIsAuthorized(false);
      }
    } catch {
      setIsAuthorized(false);
    }
  }, [open]);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await locationApi.getAdminRecords({
        limit: 50,
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
    if (open) {
      fetchRecords();
    }
  }, [open, fetchRecords]);

  const handleDelete = async (id: string) => {
    if (!confirm('Permanent Privacy Deletion: Are you sure you want to permanently purge this location audit record from the database?')) {
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

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-white dark:bg-[#0D2118] rounded-3xl border border-[#D5E6DC] dark:border-[#1E4130] shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[#E3EDE6] dark:border-[#1A3326] flex items-center justify-between bg-[#F8FAF9] dark:bg-[#0A1812]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#E5F7ED] dark:bg-[#133A27] text-[#088647] dark:text-[#34D399] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-[#0B3322] dark:text-[#EEFAF3]">
                  GPS Location Consent & Audit Log
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  RBAC Restricted
                </span>
              </div>
              <p className="text-xs text-[#517663] dark:text-[#88B8A0] mt-0.5">
                Role-based audit trail showing worker locations shared with verified consent.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white dark:bg-[#12281E] border border-[#DEEBE1] dark:border-[#1E4130] text-[#517663] dark:text-[#88B8A0] hover:text-[#0B3322] dark:hover:text-white flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action toast */}
        {actionMessage && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{actionMessage}</span>
          </div>
        )}

        {/* Access Denied Warning */}
        {!isAuthorized ? (
          <div className="p-8 text-center flex flex-col items-center justify-center space-y-4 my-auto">
            <div className="w-14 h-14 rounded-full bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <Lock className="w-7 h-7" />
            </div>
            <div>
              <h4 className="text-base font-bold text-[#0B3322] dark:text-[#EEFAF3]">
                Administrative Access Required
              </h4>
              <p className="text-xs text-[#6B8B7B] dark:text-[#88B8A0] mt-1 max-w-md mx-auto">
                Only users with an <span className="font-semibold text-rose-600 dark:text-rose-400">ADMIN</span> or{' '}
                <span className="font-semibold text-rose-600 dark:text-rose-400">SUPERADMIN</span> role can inspect precise coordinate logs. Current role: <span className="font-mono font-bold uppercase">{userRole || 'GUEST'}</span>.
              </p>
            </div>
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-[#075C3B] text-white text-xs font-bold hover:bg-[#096e47] transition-colors"
            >
              Close Window
            </button>
          </div>
        ) : (
          <>
            {/* Filter toolbar */}
            <div className="p-4 sm:px-6 bg-[#F8FAF9]/50 dark:bg-[#0A1812]/50 border-b border-[#E3EDE6] dark:border-[#1A3326] flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5 text-[#517663] dark:text-[#88B8A0] font-semibold">
                  <Filter className="w-3.5 h-3.5" />
                  <span>Purpose:</span>
                </div>
                <select
                  value={purposeFilter}
                  onChange={e => setPurposeFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#12281E] border border-[#D5E6DC] dark:border-[#1E4130] text-[#0B3322] dark:text-[#EEFAF3] font-medium focus:outline-none focus:border-[#088647]"
                >
                  <option value="ALL">All Purposes</option>
                  <option value="DELIVERY_DISPATCH">DELIVERY_DISPATCH</option>
                  <option value="LIVE_ORDER_TRACKING">LIVE_ORDER_TRACKING</option>
                  <option value="WORKER_AVAILABILITY">WORKER_AVAILABILITY</option>
                </select>

                <label className="flex items-center gap-2 text-[#517663] dark:text-[#88B8A0] font-medium cursor-pointer ml-2">
                  <input
                    type="checkbox"
                    checked={includeRevoked}
                    onChange={e => setIncludeRevoked(e.target.checked)}
                    className="accent-[#088647] rounded"
                  />
                  <span>Include Revoked Records</span>
                </label>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => fetchRecords()}
                  disabled={loading}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#12281E] border border-[#D5E6DC] dark:border-[#1E4130] text-[#0B3322] dark:text-[#EEFAF3] hover:bg-[#F0F5F2] dark:hover:bg-[#163828] font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            {/* Privacy Compliance Banner */}
            <div className="mx-4 sm:mx-6 mt-4 p-3 rounded-2xl bg-emerald-50/70 dark:bg-[#12281E] border border-emerald-200 dark:border-[#1E4130] flex items-start gap-2.5 text-xs text-[#0B3322] dark:text-[#EEFAF3]">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
              <div className="text-[11px] leading-relaxed">
                <span className="font-bold">Privacy & Compliance Safeguards:</span> Coordinates shown were collected exclusively after native browser consent. Delivery workers retain full rights to revoke location sharing at any time. Unrevoked records are subject to automated retention policies.
              </div>
            </div>

            {/* Records Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
              {loading && records.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#6B8B7B] dark:text-[#88B8A0] flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-[#088647]" />
                  <span>Loading consented GPS records...</span>
                </div>
              ) : error ? (
                <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs">
                  {error}
                </div>
              ) : records.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#6B8B7B] dark:text-[#88B8A0]">
                  No consented location records found matching the current filter.
                </div>
              ) : (
                <div className="border border-[#E3EDE6] dark:border-[#1E4130] rounded-2xl overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-[#F0F5F2] dark:bg-[#12281E] text-[#517663] dark:text-[#88B8A0] uppercase text-[10px] font-bold tracking-wider border-b border-[#E3EDE6] dark:border-[#1E4130]">
                        <tr>
                          <th className="py-3 px-4">Worker / User</th>
                          <th className="py-3 px-4">Coordinates & Accuracy</th>
                          <th className="py-3 px-4">Purpose & Consent</th>
                          <th className="py-3 px-4">Timestamp</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4 text-right">Privacy Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E3EDE6] dark:divide-[#1E4130]">
                        {records.map(rec => (
                          <tr key={rec.id} className="hover:bg-[#F9FCFA] dark:hover:bg-[#163828]/40 transition-colors">
                            <td className="py-3 px-4">
                              <div className="font-bold text-[#0B3322] dark:text-[#EEFAF3]">
                                {rec.user.name}
                              </div>
                              <div className="text-[11px] text-[#6B8B7B] dark:text-[#88B8A0] flex items-center gap-1.5 mt-0.5">
                                <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold">
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

                            <td className="py-3 px-4">
                              <div className="font-mono font-bold text-[#0B3322] dark:text-[#EEFAF3] flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                <span>
                                  {rec.coordinates.latitude.toFixed(5)}, {rec.coordinates.longitude.toFixed(5)}
                                </span>
                              </div>
                              <div className="text-[11px] text-[#6B8B7B] dark:text-[#88B8A0] mt-0.5">
                                Accuracy:{' '}
                                <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                                  {rec.coordinates.accuracy ? `± ${Math.round(rec.coordinates.accuracy)}m` : 'Reported'}
                                </span>
                              </div>
                            </td>

                            <td className="py-3 px-4">
                              <div className="font-semibold text-[#0B3322] dark:text-[#EEFAF3]">
                                {rec.consent.purpose}
                              </div>
                              <div className="text-[10px] text-[#6B8B7B] dark:text-[#88B8A0]">
                                Version {rec.consent.version} (Explicit Consent)
                              </div>
                            </td>

                            <td className="py-3 px-4 text-[#517663] dark:text-[#88B8A0]">
                              <div className="flex items-center gap-1 text-[11px]">
                                <Clock className="w-3 h-3" />
                                <span>{new Date(rec.capturedAt).toLocaleTimeString()}</span>
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {new Date(rec.capturedAt).toLocaleDateString()}
                              </div>
                            </td>

                            <td className="py-3 px-4">
                              {rec.isRevoked ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                  Revoked
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Active
                                </span>
                              )}
                            </td>

                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => handleDelete(rec.id)}
                                disabled={deletingId === rec.id}
                                title="Permanently delete from audit log"
                                className="p-1.5 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer disabled:opacity-50"
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
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 sm:px-6 bg-[#F8FAF9] dark:bg-[#0A1812] border-t border-[#E3EDE6] dark:border-[#1A3326] flex items-center justify-between text-xs text-[#6B8B7B] dark:text-[#88B8A0]">
              <span>Showing {records.length} consented records</span>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-white dark:bg-[#12281E] border border-[#D5E6DC] dark:border-[#1E4130] text-[#0B3322] dark:text-[#EEFAF3] font-bold hover:bg-[#F0F5F2] dark:hover:bg-[#163828] transition-colors cursor-pointer"
              >
                Close Audit View
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
