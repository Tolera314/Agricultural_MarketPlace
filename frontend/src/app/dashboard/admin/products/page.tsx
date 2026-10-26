'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import {
  Package,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  RefreshCw,
  Tag,
  Scale,
} from 'lucide-react';
import { adminApi } from '@/lib/adminApi';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getProducts({
        search: search || undefined,
        status: statusFilter || undefined,
      });
      setProducts(res || []);
    } catch (err: any) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleStatusToggle = async (productId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    const reason = prompt(
      `Please provide an administrative reason to change status to ${nextStatus}:`,
      'Routine administrative moderation'
    );
    if (!reason) return;

    setUpdatingId(productId);
    try {
      await adminApi.updateProductStatus(productId, nextStatus, reason);
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, status: nextStatus } : p))
      );
      setActionMessage(`Product status successfully updated to ${nextStatus}.`);
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err: any) {
      alert(err?.message || 'Failed to update product status.');
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
            Product Management
          </h1>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-0.5">
            Moderate listings, inventory levels, and categories while safeguarding farmer-set prices.
          </p>
        </div>

        <button
          onClick={fetchProducts}
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

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by product name, category, or farmer..."
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
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="PAUSED">Paused</option>
            <option value="OUT_OF_STOCK">Out of Stock</option>
            <option value="REMOVED">Removed</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white dark:bg-[#0A2218] border border-[#E3EAE5] dark:border-[#163D2F] rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/75 dark:bg-[#0C2A1E]/60 text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider border-b border-[#E3EAE5] dark:border-[#163D2F]">
              <tr>
                <th className="px-5 py-3.5">Product & Image</th>
                <th className="px-4 py-3.5">Category</th>
                <th className="px-4 py-3.5">Farmer (Seller)</th>
                <th className="px-4 py-3.5">Farmer Price</th>
                <th className="px-4 py-3.5">Stock Quantity</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Moderation Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-[#143427]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-gray-500">
                    Loading product inventory...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-gray-500">
                    No products found matching the criteria.
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const isLowStock = p.stockQuantity <= 10;
                  return (
                    <tr key={p.id} className="hover:bg-gray-50/50 dark:hover:bg-[#0E2F22]/30 transition-colors">
                      {/* Product Thumbnail & Name */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl overflow-hidden relative shrink-0 border border-gray-100 dark:border-gray-800 bg-gray-50">
                            <Image
                              src={p.images[0] || '/images/prod_tomatoes.jpg'}
                              alt={p.name}
                              fill
                              className="object-cover"
                              sizes="40px"
                            />
                          </div>
                          <div>
                            <div className="font-bold text-[#142E24] dark:text-[#E2EAE5]">
                              {p.name}
                            </div>
                            <div className="text-[11px] text-gray-400">
                              Grade: {p.qualityGrade || 'Ungraded'} · {p.intercityEligible ? 'Intercity Eligible' : 'Local Only'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3.5 text-gray-700 dark:text-gray-300 font-medium">
                        {p.category}
                      </td>

                      {/* Farmer */}
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-gray-800 dark:text-gray-200">{p.farmerName}</div>
                        <div className="text-[11px] text-gray-400">{p.farmerPhone}</div>
                      </td>

                      {/* Farmer Price (Protected) */}
                      <td className="px-4 py-3.5 font-bold text-[#0A7A53] dark:text-[#34D399]">
                        ETB {p.pricePerUnit.toLocaleString()} / {p.unit}
                      </td>

                      {/* Stock Quantity */}
                      <td className="px-4 py-3.5">
                        <span
                          className={`font-semibold ${
                            isLowStock ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {p.stockQuantity} {p.unit}
                        </span>
                        {isLowStock && (
                          <span className="block text-[10px] text-amber-500 font-semibold uppercase tracking-wider">
                            Low Stock Alert
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            p.status === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : p.status === 'PAUSED'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                              : 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right">
                        <button
                          disabled={updatingId === p.id}
                          onClick={() => handleStatusToggle(p.id, p.status)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                            p.status === 'ACTIVE'
                              ? 'border-amber-200 text-amber-700 hover:bg-amber-50 dark:border-amber-900/60 dark:text-amber-300'
                              : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900/60 dark:text-emerald-300'
                          }`}
                        >
                          {p.status === 'ACTIVE' ? 'Pause Listing' : 'Restore Listing'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
