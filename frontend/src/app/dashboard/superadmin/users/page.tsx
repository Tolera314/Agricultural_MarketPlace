'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Search,
  Filter,
  UserPlus,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  RefreshCw,
  LogOut,
  ChevronLeft,
  ChevronRight,
  X,
  AlertCircle,
  Clock,
  FileText,
  ExternalLink,
  Sprout,
  Truck,
  MapPin,
} from 'lucide-react';
import { superadminApi, AdminUser } from '@/lib/superadminApi';
import { API_BASE_URL } from '@/lib/apiConfig';
import { UserAvatar } from '@/components/ui/UserAvatar';

export default function SuperadminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [verificationFilter, setVerificationFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Verification Dossier Modal
  const [inspectUser, setInspectUser] = useState<AdminUser | null>(null);
  const [decisionNote, setDecisionNote] = useState('');
  const [updatingVerification, setUpdatingVerification] = useState(false);

  const resolveDocUrl = (url?: string | null) => {
    if (!url) return '';
    return url.startsWith('http://') || url.startsWith('https://') ? url : `${API_BASE_URL}${url}`;
  };

  const handleVerify = async (status: 'VERIFIED' | 'REJECTED') => {
    if (!inspectUser) return;
    const isFarmer = inspectUser.role === 'FARMER' || !!inspectUser.farmerProfile;
    const isWorker = inspectUser.role === 'DELIVERY_WORKER' || !!inspectUser.deliveryProfile;
    const profileId = isFarmer
      ? inspectUser.farmerProfile?.id
      : isWorker
      ? inspectUser.deliveryProfile?.id
      : null;

    if (!profileId) {
      alert('Profile record identifier could not be resolved for this account.');
      return;
    }

    setUpdatingVerification(true);
    try {
      if (isFarmer) {
        await superadminApi.verifyFarmer(
          profileId,
          status,
          decisionNote || (status === 'VERIFIED' ? 'Verified by Superadmin' : 'Documents rejected')
        );
      } else {
        await superadminApi.verifyWorker(
          profileId,
          status,
          decisionNote || (status === 'VERIFIED' ? 'Fleet compliance approved' : 'Application rejected')
        );
      }

      setActionMessage({
        type: 'success',
        text: `Account verification status successfully updated to ${status}.`,
      });
      setInspectUser(null);
      setDecisionNote('');
      loadUsers();
    } catch (err: any) {
      alert(err?.message || 'Failed to update verification status.');
    } finally {
      setUpdatingVerification(false);
    }
  };

  // Modals
  const [showProvisionModal, setShowProvisionModal] = useState(false);
  const [provisionForm, setProvisionForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    role: 'ADMIN' as 'ADMIN' | 'SUPERADMIN',
    password: '',
  });
  const [provisionError, setProvisionError] = useState<string | null>(null);
  const [provisionLoading, setProvisionLoading] = useState(false);

  // Status Change Modal
  const [statusModalUser, setStatusModalUser] = useState<AdminUser | null>(null);
  const [statusReason, setStatusReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Role Change Modal
  const [roleModalUser, setRoleModalUser] = useState<AdminUser | null>(null);
  const [targetRole, setTargetRole] = useState<'ADMIN' | 'SUPERADMIN'>('ADMIN');
  const [roleReason, setRoleReason] = useState('');

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await superadminApi.getUsers({
        search: search || undefined,
        role: roleFilter,
        status: statusFilter,
        verificationStatus: verificationFilter !== 'ALL' ? verificationFilter : undefined,
        page,
        limit: 15,
      });
      setUsers(res.users);
      setTotalPages(res.pagination.totalPages);
      setTotalCount(res.pagination.total);
    } catch (err: any) {
      console.error('Failed to load users:', err);
      setError(err?.message || 'Failed to load user accounts.');
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, statusFilter, verificationFilter, page]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleProvisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProvisionLoading(true);
    setProvisionError(null);
    try {
      await superadminApi.provisionAdmin(provisionForm);
      setShowProvisionModal(false);
      setProvisionForm({ fullName: '', phone: '', email: '', role: 'ADMIN', password: '' });
      setActionMessage({ type: 'success', text: 'Administrator provisioned successfully.' });
      loadUsers();
    } catch (err: any) {
      setProvisionError(err?.message || 'Failed to provision user.');
    } finally {
      setProvisionLoading(false);
    }
  };

  const handleStatusToggle = async () => {
    if (!statusModalUser) return;
    setActionLoading(true);
    setActionMessage(null);
    try {
      const newStatus = !statusModalUser.isActive;
      await superadminApi.updateUserStatus(statusModalUser.id, newStatus, statusReason);
      setStatusModalUser(null);
      setStatusReason('');
      setActionMessage({
        type: 'success',
        text: `Account ${newStatus ? 'activated' : 'suspended'} successfully.`,
      });
      loadUsers();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err?.message || 'Failed to update account status.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRoleChange = async () => {
    if (!roleModalUser) return;
    setActionLoading(true);
    setActionMessage(null);
    try {
      await superadminApi.updateUserRole(roleModalUser.id, targetRole, roleReason);
      setRoleModalUser(null);
      setRoleReason('');
      setActionMessage({
        type: 'success',
        text: `Role updated to ${targetRole} successfully.`,
      });
      loadUsers();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err?.message || 'Failed to update user role.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevokeSessions = async (userId: string) => {
    if (!confirm('Are you sure you want to invalidate all active sessions for this user?')) return;
    try {
      await superadminApi.revokeSessions(userId, 'Superadmin initiated session revocation');
      setActionMessage({ type: 'success', text: 'All active sessions have been invalidated.' });
      loadUsers();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err?.message || 'Failed to revoke sessions.' });
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#142E24] dark:text-[#E6F0EB] font-display">
            Users & Roles Governance
          </h1>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-0.5">
            Manage administrative privileges, account lifecycles, and RBAC policies ({totalCount} total)
          </p>
        </div>

        {/* Provision Admin Button */}
        <button
          onClick={() => {
            setProvisionError(null);
            setShowProvisionModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#059669] hover:bg-[#047857] text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Provision Administrator</span>
        </button>
      </div>

      {/* Action Notification Alert */}
      {actionMessage && (
        <div
          className={`p-4 rounded-2xl border text-xs font-medium flex items-center justify-between ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
              : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'
          }`}
        >
          <span>{actionMessage.text}</span>
          <button onClick={() => setActionMessage(null)} className="cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-[#0A2218] border border-[#E3EAE5] dark:border-[#163D2F] rounded-2xl p-4 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="w-full md:w-80 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, phone, or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 text-xs bg-[#F4F7F5] dark:bg-[#0E261D] text-[#1E3028] dark:text-[#E2EBE6] rounded-xl border border-transparent focus:border-[#10B981] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs font-semibold bg-[#F4F7F5] dark:bg-[#0E261D] border border-transparent dark:border-[#163D2F] rounded-xl text-[#142E24] dark:text-[#E2EAE5] focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Roles</option>
            <option value="SUPERADMIN">Superadmin</option>
            <option value="ADMIN">Admin</option>
            <option value="FARMER">Farmer</option>
            <option value="BUYER">Buyer</option>
            <option value="DELIVERY_WORKER">Delivery Worker</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs font-semibold bg-[#F4F7F5] dark:bg-[#0E261D] border border-transparent dark:border-[#163D2F] rounded-xl text-[#142E24] dark:text-[#E2EAE5] focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Suspended</option>
          </select>

          {/* Verification Filter */}
          <select
            value={verificationFilter}
            onChange={(e) => {
              setVerificationFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs font-semibold bg-[#F4F7F5] dark:bg-[#0E261D] border border-transparent dark:border-[#163D2F] rounded-xl text-[#142E24] dark:text-[#E2EAE5] focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Verifications</option>
            <option value="PENDING">Pending Review</option>
            <option value="VERIFIED">Verified</option>
            <option value="REJECTED">Rejected</option>
          </select>

          <button
            onClick={() => loadUsers()}
            title="Refresh Users"
            className="p-2 text-gray-500 hover:text-emerald-600 rounded-xl hover:bg-gray-100 dark:hover:bg-[#0E261D] cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-[#0A2218] border border-[#E3EAE5] dark:border-[#163D2F] rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAF9] dark:bg-[#0D261B] border-b border-[#E3EAE5] dark:border-[#163D2F] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4 sm:px-6">User / Account</th>
                <th className="py-3.5 px-4">Contact</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Verification</th>
                <th className="py-3.5 px-4">Created Date</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-[#163D2F]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    Loading administrative accounts...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    No users found matching current filters.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50/50 dark:hover:bg-[#0E3524]/30 transition-colors">
                    <td className="py-3 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-[#164C35] text-emerald-800 dark:text-emerald-200 font-bold flex items-center justify-center shrink-0">
                          {u.fullName.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-[#142E24] dark:text-[#E6F0EB]">{u.fullName}</p>
                          <p className="text-[10px] text-gray-400">ID: {u.id.slice(0, 8)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-gray-800 dark:text-gray-200">{u.phone}</p>
                      {u.email && <p className="text-[11px] text-gray-400">{u.email}</p>}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          u.role === 'SUPERADMIN'
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300 ring-1 ring-purple-300'
                            : u.role === 'ADMIN'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300'
                            : u.role === 'FARMER'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                            : u.role === 'BUYER'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                            : 'bg-teal-100 text-teal-800 dark:bg-teal-950/40 dark:text-teal-300'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          u.isActive
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                            : 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300'
                        }`}
                      >
                        {u.isActive ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {u.isActive ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {u.role === 'FARMER' ? (
                        <div className="space-y-1">
                          <button
                            type="button"
                            onClick={() => {
                              setInspectUser(u);
                              setDecisionNote(u.farmerProfile?.verificationNote || '');
                            }}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-all ${
                              u.farmerProfile?.verificationStatus === 'VERIFIED'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 hover:bg-emerald-200'
                                : u.farmerProfile?.verificationStatus === 'REJECTED'
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 hover:bg-rose-200'
                                : 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200 ring-1 ring-amber-400 hover:bg-amber-200 animate-pulse'
                            }`}
                          >
                            {u.farmerProfile?.verificationStatus === 'VERIFIED' ? (
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            ) : u.farmerProfile?.verificationStatus === 'REJECTED' ? (
                              <XCircle className="w-3 h-3 text-rose-600" />
                            ) : (
                              <Clock className="w-3 h-3 text-amber-600" />
                            )}
                            <span>
                              {u.farmerProfile?.verificationStatus === 'VERIFIED'
                                ? 'Verified'
                                : u.farmerProfile?.verificationStatus === 'REJECTED'
                                ? 'Rejected'
                                : 'Review & Verify'}
                            </span>
                          </button>
                          {u.farmerProfile?.farmName && (
                            <p className="text-[10px] text-gray-400 truncate max-w-[120px]">
                              {u.farmerProfile.farmName}
                            </p>
                          )}
                        </div>
                      ) : u.role === 'DELIVERY_WORKER' ? (
                        <div className="space-y-1">
                          <button
                            type="button"
                            onClick={() => {
                              setInspectUser(u);
                              setDecisionNote(u.deliveryProfile?.verificationNote || '');
                            }}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-all ${
                              u.deliveryProfile?.verificationStatus === 'VERIFIED'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 hover:bg-emerald-200'
                                : u.deliveryProfile?.verificationStatus === 'REJECTED'
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 hover:bg-rose-200'
                                : 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200 ring-1 ring-amber-400 hover:bg-amber-200 animate-pulse'
                            }`}
                          >
                            {u.deliveryProfile?.verificationStatus === 'VERIFIED' ? (
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            ) : u.deliveryProfile?.verificationStatus === 'REJECTED' ? (
                              <XCircle className="w-3 h-3 text-rose-600" />
                            ) : (
                              <Clock className="w-3 h-3 text-amber-600" />
                            )}
                            <span>
                              {u.deliveryProfile?.verificationStatus === 'VERIFIED'
                                ? 'Verified'
                                : u.deliveryProfile?.verificationStatus === 'REJECTED'
                                ? 'Rejected'
                                : 'Review & Verify'}
                            </span>
                          </button>
                          {u.deliveryProfile?.vehicleType && (
                            <p className="text-[10px] text-gray-400 truncate max-w-[120px]">
                              {u.deliveryProfile.vehicleType}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-[11px] text-gray-400">
                          {u.isVerified ? 'Verified' : 'Standard'}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-gray-500 dark:text-gray-400 text-[11px]">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Edit Role Button */}
                        <button
                          onClick={() => {
                            setRoleModalUser(u);
                            setTargetRole(u.role === 'SUPERADMIN' ? 'ADMIN' : 'SUPERADMIN');
                            setRoleReason('');
                          }}
                          className="px-2.5 py-1 rounded-lg border border-gray-200 dark:border-[#163D2F] text-[11px] font-semibold hover:border-emerald-500 hover:text-emerald-600 cursor-pointer"
                        >
                          Role
                        </button>

                        {/* Status Toggle Button */}
                        <button
                          onClick={() => {
                            setStatusModalUser(u);
                            setStatusReason('');
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer ${
                            u.isActive
                              ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20'
                              : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20'
                          }`}
                        >
                          {u.isActive ? 'Suspend' : 'Activate'}
                        </button>

                        {/* Revoke Sessions */}
                        <button
                          title="Invalidate all active sessions"
                          onClick={() => handleRevokeSessions(u.id)}
                          className="p-1 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100 dark:hover:bg-[#0E261D] cursor-pointer"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="px-6 py-3.5 bg-[#F8FAF9] dark:bg-[#0D261B] border-t border-[#E3EAE5] dark:border-[#163D2F] flex items-center justify-between text-xs">
          <span className="text-gray-500 dark:text-gray-400">
            Page {page} of {totalPages || 1}
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-[#163D2F] disabled:opacity-40 hover:bg-white dark:hover:bg-[#0A2218] cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-[#163D2F] disabled:opacity-40 hover:bg-white dark:hover:bg-[#0A2218] cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ─── Modal 1: Provision Administrator ───────────────────────────────── */}
      {showProvisionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0A2218] border border-[#E3EAE5] dark:border-[#163D2F] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-[#163D2F] pb-3">
              <h3 className="text-base font-bold text-[#142E24] dark:text-[#E6F0EB]">
                Provision Administrator
              </h3>
              <button
                onClick={() => setShowProvisionModal(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {provisionError && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{provisionError}</span>
              </div>
            )}

            <form onSubmit={handleProvisionSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Abebe Bekele"
                  value={provisionForm.fullName}
                  onChange={(e) => setProvisionForm({ ...provisionForm, fullName: e.target.value })}
                  className="w-full px-3 py-2 bg-[#F4F7F5] dark:bg-[#0E261D] rounded-xl border border-transparent focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">
                  Ethiopian Phone Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="0911223344 or +251911..."
                  value={provisionForm.phone}
                  onChange={(e) => setProvisionForm({ ...provisionForm, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-[#F4F7F5] dark:bg-[#0E261D] rounded-xl border border-transparent focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  placeholder="admin@agrimarket.et"
                  value={provisionForm.email}
                  onChange={(e) => setProvisionForm({ ...provisionForm, email: e.target.value })}
                  className="w-full px-3 py-2 bg-[#F4F7F5] dark:bg-[#0E261D] rounded-xl border border-transparent focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">
                  Role Assignment *
                </label>
                <select
                  value={provisionForm.role}
                  onChange={(e) =>
                    setProvisionForm({ ...provisionForm, role: e.target.value as 'ADMIN' | 'SUPERADMIN' })
                  }
                  className="w-full px-3 py-2 bg-[#F4F7F5] dark:bg-[#0E261D] rounded-xl border border-transparent focus:border-emerald-500 focus:outline-none cursor-pointer"
                >
                  <option value="ADMIN">ADMIN (Operations Administrator)</option>
                  <option value="SUPERADMIN">SUPERADMIN (Full Platform Governance)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">
                  Temporary Initial Password
                </label>
                <input
                  type="password"
                  placeholder="Defaults to AdminPassword123!"
                  value={provisionForm.password}
                  onChange={(e) => setProvisionForm({ ...provisionForm, password: e.target.value })}
                  className="w-full px-3 py-2 bg-[#F4F7F5] dark:bg-[#0E261D] rounded-xl border border-transparent focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowProvisionModal(false)}
                  className="px-4 py-2 border border-gray-200 dark:border-[#163D2F] rounded-xl text-gray-600 dark:text-gray-300 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={provisionLoading}
                  className="px-5 py-2 bg-[#059669] hover:bg-[#047857] text-white font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50"
                >
                  {provisionLoading ? 'Provisioning...' : 'Confirm Provision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Modal 2: Account Status Toggle (Activate/Suspend) ───────────────── */}
      {statusModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0A2218] border border-[#E3EAE5] dark:border-[#163D2F] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 text-xs">
            <h3 className="text-base font-bold text-[#142E24] dark:text-[#E6F0EB]">
              {statusModalUser.isActive ? 'Suspend User Account' : 'Activate User Account'}
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Are you sure you want to {statusModalUser.isActive ? 'suspend' : 'activate'} the account for{' '}
              <strong className="text-emerald-700 dark:text-emerald-400">{statusModalUser.fullName}</strong> ({statusModalUser.phone})?
            </p>
            {statusModalUser.role === 'SUPERADMIN' && statusModalUser.isActive && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-xl text-amber-800 dark:text-amber-300">
                ⚠️ Platform Rule: You cannot suspend this account if it is the sole active Superadmin.
              </div>
            )}
            <div>
              <label className="block font-semibold mb-1">Administrative Reason / Justification</label>
              <textarea
                rows={2}
                placeholder="Enter audit explanation..."
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                className="w-full px-3 py-2 bg-[#F4F7F5] dark:bg-[#0E261D] rounded-xl border border-transparent focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setStatusModalUser(null)}
                className="px-4 py-2 border border-gray-200 dark:border-[#163D2F] rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={actionLoading}
                onClick={handleStatusToggle}
                className={`px-5 py-2 font-bold text-white rounded-xl transition-all cursor-pointer ${
                  statusModalUser.isActive ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {actionLoading ? 'Updating...' : statusModalUser.isActive ? 'Confirm Suspension' : 'Confirm Activation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal 3: Change Role ───────────────────────────────────────────── */}
      {roleModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0A2218] border border-[#E3EAE5] dark:border-[#163D2F] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 text-xs">
            <h3 className="text-base font-bold text-[#142E24] dark:text-[#E6F0EB]">
              Change Administrative Role
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Update role for <strong>{roleModalUser.fullName}</strong>. Current role: <span className="font-bold">{roleModalUser.role}</span>.
            </p>
            <div>
              <label className="block font-semibold mb-1">Target Privilege Role</label>
              <select
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value as 'ADMIN' | 'SUPERADMIN')}
                className="w-full px-3 py-2 bg-[#F4F7F5] dark:bg-[#0E261D] rounded-xl border border-transparent focus:border-emerald-500 focus:outline-none cursor-pointer"
              >
                <option value="ADMIN">ADMIN (Operations Administrator)</option>
                <option value="SUPERADMIN">SUPERADMIN (Full Platform Governance)</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1">Reason for role adjustment</label>
              <input
                type="text"
                placeholder="e.g. Promoted to Senior Operations Lead"
                value={roleReason}
                onChange={(e) => setRoleReason(e.target.value)}
                className="w-full px-3 py-2 bg-[#F4F7F5] dark:bg-[#0E261D] rounded-xl border border-transparent focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setRoleModalUser(null)}
                className="px-4 py-2 border border-gray-200 dark:border-[#163D2F] rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={actionLoading}
                onClick={handleRoleChange}
                className="px-5 py-2 font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all cursor-pointer"
              >
                {actionLoading ? 'Updating...' : 'Save Role Change'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal 4: Superadmin Verification Dossier ─────────────────────── */}
      {inspectUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#0A2218] border border-[#E3EAE5] dark:border-[#163D2F] rounded-3xl w-full max-w-2xl p-6 sm:p-7 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-[#163D2F] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold">
                  {inspectUser.role === 'FARMER' ? <Sprout className="w-5 h-5" /> : <Truck className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#142E24] dark:text-[#E6F0EB]">
                    {inspectUser.role === 'FARMER' ? 'Farmer Verification Dossier' : 'Courier Verification Dossier'}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {inspectUser.fullName} • {inspectUser.phone}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setInspectUser(null)}
                className="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Applicant Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-[#F4F7F5] dark:bg-[#0E261D] rounded-xl">
                <div className="text-[10px] text-gray-400 font-bold uppercase">Role</div>
                <div className="font-bold text-emerald-700 dark:text-emerald-400">{inspectUser.role}</div>
              </div>
              <div className="p-3 bg-[#F4F7F5] dark:bg-[#0E261D] rounded-xl">
                <div className="text-[10px] text-gray-400 font-bold uppercase">Phone</div>
                <div className="font-bold text-gray-800 dark:text-gray-200 truncate">{inspectUser.phone}</div>
              </div>
              <div className="p-3 bg-[#F4F7F5] dark:bg-[#0E261D] rounded-xl">
                <div className="text-[10px] text-gray-400 font-bold uppercase">Email</div>
                <div className="font-bold text-gray-800 dark:text-gray-200 truncate">{inspectUser.email || 'None'}</div>
              </div>
              <div className="p-3 bg-[#F4F7F5] dark:bg-[#0E261D] rounded-xl">
                <div className="text-[10px] text-gray-400 font-bold uppercase">State</div>
                <div className="font-bold text-emerald-600">
                  {inspectUser.farmerProfile?.verificationStatus || inspectUser.deliveryProfile?.verificationStatus || 'PENDING'}
                </div>
              </div>
            </div>

            {/* Farmer Specific Credentials */}
            {inspectUser.role === 'FARMER' && inspectUser.farmerProfile && (
              <div className="space-y-3 p-4 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-100 dark:border-emerald-900/40 text-xs">
                <div className="font-bold text-[#142E24] dark:text-[#E6F0EB] flex items-center justify-between">
                  <span>Farm Entity &amp; Produce Specialization</span>
                  {inspectUser.farmerProfile.isOrganic && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-200/80 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-100 font-bold">
                      Organic Certified
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div><strong>Farm Name:</strong> {inspectUser.farmerProfile.farmName}</div>
                  <div>
                    <strong>Coordinates:</strong>{' '}
                    {inspectUser.farmerProfile.farmLatitude}, {inspectUser.farmerProfile.farmLongitude}
                  </div>
                  {inspectUser.farmerProfile.farmDescription && (
                    <div className="sm:col-span-2 text-gray-600 dark:text-gray-300">
                      <strong>Description:</strong> {inspectUser.farmerProfile.farmDescription}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Delivery Courier Specific Credentials */}
            {inspectUser.role === 'DELIVERY_WORKER' && inspectUser.deliveryProfile && (
              <div className="space-y-3 p-4 bg-teal-50/50 dark:bg-teal-950/20 rounded-2xl border border-teal-100 dark:border-teal-900/40 text-xs">
                <div className="font-bold text-[#142E24] dark:text-[#E6F0EB]">
                  Delivery Fleet &amp; Vehicle Compliance
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div><strong>Vehicle Type:</strong> {inspectUser.deliveryProfile.vehicleType}</div>
                  <div><strong>License Plate:</strong> {inspectUser.deliveryProfile.vehiclePlate || 'N/A'}</div>
                  <div><strong>Payload Capacity:</strong> {inspectUser.deliveryProfile.vehicleCapacityKg || 'N/A'} kg</div>
                  <div><strong>Fleet Availability:</strong> {inspectUser.deliveryProfile.availability || 'OFFLINE'}</div>
                </div>
              </div>
            )}

            {/* Attached Identity & Legal Documents */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                Submitted Verification Documents
              </h4>
              {(() => {
                const docs =
                  inspectUser.farmerProfile?.verificationDocuments ||
                  inspectUser.deliveryProfile?.verificationDocuments;

                if (!docs) {
                  return <p className="text-xs text-gray-400 italic">No document payload attached on file.</p>;
                }

                return (
                  <div className="space-y-2">
                    {/* National ID / Kebele card */}
                    <div className="p-3 rounded-xl border border-gray-100 dark:border-white/5 bg-gray-50/60 dark:bg-white/5 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-[#142E24] dark:text-[#E6F0EB]">
                          {docs.identityType || 'National / Kebele ID Document'}
                        </div>
                        <div className="text-[11px] text-gray-400">
                          Doc Number: {docs.identityNumber || 'N/A'}
                        </div>
                      </div>
                      {docs.identityDocUrl ? (
                        <a
                          href={resolveDocUrl(docs.identityDocUrl)}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>View Document</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-[11px] text-gray-400 italic">No file image attached</span>
                      )}
                    </div>

                    {/* Farmer Land Certificate */}
                    {docs.landCertificateUrl && (
                      <div className="p-3 rounded-xl border border-gray-100 dark:border-white/5 bg-gray-50/60 dark:bg-white/5 flex items-center justify-between text-xs">
                        <div>
                          <div className="font-bold text-[#142E24] dark:text-[#E6F0EB]">
                            Land Ownership Certificate
                          </div>
                          <div className="text-[11px] text-gray-400">Certified farm plot evidence</div>
                        </div>
                        <a
                          href={resolveDocUrl(docs.landCertificateUrl)}
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

                    {/* Worker Driver License */}
                    {docs.driverLicenseDocUrl && (
                      <div className="p-3 rounded-xl border border-gray-100 dark:border-white/5 bg-gray-50/60 dark:bg-white/5 flex items-center justify-between text-xs">
                        <div>
                          <div className="font-bold text-[#142E24] dark:text-[#E6F0EB]">
                            Driver License Document
                          </div>
                          <div className="text-[11px] text-gray-400">
                            License No: {docs.driverLicenseNumber || 'N/A'}
                          </div>
                        </div>
                        <a
                          href={resolveDocUrl(docs.driverLicenseDocUrl)}
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
                );
              })()}
            </div>

            {/* Decision Notes */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                Superadmin Decision Notes / Justification
              </label>
              <textarea
                rows={2}
                value={decisionNote}
                onChange={(e) => setDecisionNote(e.target.value)}
                placeholder="Enter regulatory review notes or rejection reason..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-white/10 bg-[#F4F7F5] dark:bg-[#0E261D] text-[#142E24] dark:text-[#E6F0EB] focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Modal Actions */}
            <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-gray-100 dark:border-[#163D2F]">
              <button
                type="button"
                disabled={updatingVerification}
                onClick={() => handleVerify('REJECTED')}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 cursor-pointer transition-colors"
              >
                Reject Application
              </button>

              <button
                type="button"
                disabled={updatingVerification}
                onClick={() => handleVerify('VERIFIED')}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#059669] hover:bg-[#047857] text-white shadow-sm cursor-pointer transition-colors"
              >
                Approve &amp; Verify Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

