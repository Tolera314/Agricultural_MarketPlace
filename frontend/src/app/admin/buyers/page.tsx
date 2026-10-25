'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  ShoppingBag,
  Search,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  UserCheck,
  UserX,
} from 'lucide-react';
import { adminApi } from '@/lib/adminApi';

export default function AdminBuyersPage() {
  const [buyers, setBuyers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchBuyers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getBuyers({ search: search || undefined });
      setBuyers(res || []);
    } catch (err: any) {
      console.error('Failed to load buyers:', err);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchBuyers();
  }, [fetchBuyers]);

  const handleStatusToggle = async (userId: string, currentActive: boolean) => {
    const nextActive = !currentActive;
    const reason = prompt(
      `Reason for ${nextActive ? 'reactivating' : 'restricting'} this buyer account:`,
      'Account compliance review'
    );
    if (!reason) return;

    setUpdatingId(userId);
    try {
      await adminApi.updateBuyerStatus(userId, nextActive, reason);
      setBuyers((prev) =>
        prev.map((b) => (b.id === userId ? { ...b, isActive: nextActive } : b))
      );
      setActionMessage(`Buyer account successfully ${nextActive ? 'reactivated' : 'restricted'}.`);
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err: any) {
      alert(err?.message || 'Failed to update buyer status.');
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
            Buyer Accounts
          </h1>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-0.5">
            Oversee consumer profiles, lifetime order history, and account restrictions.
          </p>
        </div>

        <button
          onClick={fetchBuyers}
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

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search by buyer name, phone, or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 text-xs bg-white dark:bg-[#0A2218] border border-[#E3EAE5] dark:border-[#163D2F] rounded-xl text-[#142E24] dark:text-[#E2EAE5] focus:outline-none focus:border-[#10B981]"
        />
      </div>

      {/* Buyers Table */}
      <div className="bg-white dark:bg-[#0A2218] border border-[#E3EAE5] dark:border-[#163D2F] rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/75 dark:bg-[#0C2A1E]/60 text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider border-b border-[#E3EAE5] dark:border-[#163D2F]">
              <tr>
                <th className="px-5 py-3.5">Buyer Name</th>
                <th className="px-4 py-3.5">Phone Number</th>
                <th className="px-4 py-3.5">Email Address</th>
                <th className="px-4 py-3.5">Preferred Delivery Address</th>
                <th className="px-4 py-3.5">Total Orders</th>
                <th className="px-4 py-3.5">Total Spend</th>
                <th className="px-4 py-3.5">Account State</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-[#143427]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-gray-500">
                    Loading buyer accounts...
                  </td>
                </tr>
              ) : buyers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-gray-500">
                    No buyers found matching your search.
                  </td>
                </tr>
              ) : (
                buyers.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50/50 dark:hover:bg-[#0E2F22]/30 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-[#142E24] dark:text-[#E2EAE5]">
                      {b.fullName}
                    </td>

                    <td className="px-4 py-3.5 font-medium text-gray-700 dark:text-gray-300">
                      {b.phone}
                    </td>

                    <td className="px-4 py-3.5 text-gray-500 dark:text-gray-400">
                      {b.email || '—'}
                    </td>

                    <td className="px-4 py-3.5 text-gray-600 dark:text-gray-400 max-w-xs truncate">
                      {b.address}
                    </td>

                    <td className="px-4 py-3.5 font-bold text-gray-800 dark:text-gray-200">
                      {b.orderCount} Orders
                    </td>

                    <td className="px-4 py-3.5 font-bold text-[#0A7A53] dark:text-[#34D399]">
                      {b.totalSpendFormatted}
                    </td>

                    <td className="px-4 py-3.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          b.isActive
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                        }`}
                      >
                        {b.isActive ? 'Active' : 'Restricted'}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <button
                        disabled={updatingId === b.id}
                        onClick={() => handleStatusToggle(b.id, b.isActive)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                          b.isActive
                            ? 'border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/60 dark:text-red-300'
                            : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-900/60 dark:text-emerald-300'
                        }`}
                      >
                        {b.isActive ? 'Restrict Account' : 'Restore Access'}
                      </button>
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
