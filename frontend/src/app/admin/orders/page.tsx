'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  ClipboardList,
  Search,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Eye,
  MapPin,
  Truck,
  CreditCard,
  X,
} from 'lucide-react';
import { adminApi } from '@/lib/adminApi';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tradeTypeFilter, setTradeTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getOrders({
        search: search || undefined,
        tradeType: tradeTypeFilter !== 'ALL' ? tradeTypeFilter : undefined,
        status: statusFilter || undefined,
      });
      setOrders(res || []);
    } catch (err: any) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoading(false);
    }
  }, [search, tradeTypeFilter, statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleInspect = async (orderId: string) => {
    try {
      const details = await adminApi.getOrderById(orderId);
      setSelectedOrder(details);
    } catch (err: any) {
      alert(err?.message || 'Failed to fetch order details.');
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    const reason = prompt('Please enter administrative cancellation reason:', 'Operational exception / customer request');
    if (!reason) return;

    try {
      await adminApi.updateOrderStatus(orderId, 'CANCELLED', reason);
      setActionMessage('Order marked as CANCELLED with audit record.');
      setTimeout(() => setActionMessage(null), 3000);
      fetchOrders();
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: 'CANCELLED' });
      }
    } catch (err: any) {
      alert(err?.message || 'Failed to cancel order.');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#142E24] dark:text-[#E6F0EB] font-display">
            Orders Lifecycle Management
          </h1>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-0.5">
            Audit purchases, agreed-price snapshots, local vs intercity trade, and fulfillment states.
          </p>
        </div>

        <button
          onClick={fetchOrders}
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
            placeholder="Search by order ID, buyer name, or address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-white dark:bg-[#0A2218] border border-[#E3EAE5] dark:border-[#163D2F] rounded-xl text-[#142E24] dark:text-[#E2EAE5] focus:outline-none focus:border-[#10B981]"
          />
        </div>

        <select
          value={tradeTypeFilter}
          onChange={(e) => setTradeTypeFilter(e.target.value)}
          className="px-3 py-2 text-xs bg-white dark:bg-[#0A2218] border border-[#E3EAE5] dark:border-[#163D2F] rounded-xl text-[#142E24] dark:text-[#E2EAE5] focus:outline-none focus:border-[#10B981]"
        >
          <option value="ALL">All Trade Types</option>
          <option value="LOCAL">Local Orders</option>
          <option value="INTERCITY">Intercity Trade</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-xs bg-white dark:bg-[#0A2218] border border-[#E3EAE5] dark:border-[#163D2F] rounded-xl text-[#142E24] dark:text-[#E2EAE5] focus:outline-none focus:border-[#10B981]"
        >
          <option value="">All Statuses</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="PREPARING">Preparing</option>
          <option value="READY_FOR_PICKUP">Ready For Pickup</option>
          <option value="IN_TRANSIT">In Transit / Shipped</option>
          <option value="DELIVERED">Delivered</option>
          <option value="PENDING_APPROVAL">Pending Approval</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {/* Orders Table */}
      <div className="bg-white dark:bg-[#0A2218] border border-[#E3EAE5] dark:border-[#163D2F] rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/75 dark:bg-[#0C2A1E]/60 text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider border-b border-[#E3EAE5] dark:border-[#163D2F]">
              <tr>
                <th className="px-5 py-3.5">Order ID & Trade</th>
                <th className="px-4 py-3.5">Buyer</th>
                <th className="px-4 py-3.5">Item Summary</th>
                <th className="px-4 py-3.5">Total (ETB)</th>
                <th className="px-4 py-3.5">Payment</th>
                <th className="px-4 py-3.5">Order Status</th>
                <th className="px-4 py-3.5">Assigned Worker</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-[#143427]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-gray-500">
                    Loading marketplace orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-gray-500">
                    No orders found matching the filter criteria.
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.id} className="hover:bg-gray-50/50 dark:hover:bg-[#0E2F22]/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-[#142E24] dark:text-[#E2EAE5] font-mono">
                        #{o.id.slice(0, 8)}
                      </div>
                      <div className="mt-0.5">
                        <span
                          className={`px-2 py-0.2 rounded text-[10px] font-bold ${
                            o.tradeType === 'INTERCITY'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          }`}
                        >
                          {o.tradeType}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-gray-800 dark:text-gray-200">{o.buyerName}</div>
                      <div className="text-[11px] text-gray-400">{o.buyerPhone}</div>
                    </td>

                    <td className="px-4 py-3.5 text-gray-700 dark:text-gray-300 max-w-xs truncate">
                      {o.itemSummary}
                    </td>

                    <td className="px-4 py-3.5 font-bold text-[#0A7A53] dark:text-[#34D399]">
                      ETB {o.totalAmount.toLocaleString()}
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="font-medium text-gray-700 dark:text-gray-300 text-[11px]">
                        {o.paymentMethod.replace('_', ' ')}
                      </div>
                      <div
                        className={`text-[10px] font-bold ${
                          o.paymentStatus === 'COMPLETED'
                            ? 'text-emerald-600'
                            : o.paymentStatus === 'FAILED'
                            ? 'text-red-500'
                            : 'text-amber-500'
                        }`}
                      >
                        {o.paymentStatus}
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                        {o.status}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-gray-600 dark:text-gray-400">
                      {o.assignedWorker || 'Unassigned'}
                    </td>

                    <td className="px-5 py-3.5 text-right space-x-1.5">
                      <button
                        onClick={() => handleInspect(o.id)}
                        className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-[#0E2F22] border border-gray-200 dark:border-[#174A33] text-gray-700 dark:text-gray-200 hover:border-emerald-500 transition-all"
                      >
                        Details
                      </button>
                      {o.status !== 'CANCELLED' && o.status !== 'DELIVERED' && (
                        <button
                          onClick={() => handleCancelOrder(o.id)}
                          className="px-2 py-1.5 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all"
                        >
                          Cancel
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

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#0A2218] border border-[#E3EAE5] dark:border-[#163D2F] rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-[#143427] pb-3">
              <div>
                <h3 className="text-base font-bold text-[#142E24] dark:text-[#E6F0EB]">
                  Order Details #{selectedOrder.id.slice(0, 8)}
                </h3>
                <p className="text-xs text-gray-400">
                  Created {new Date(selectedOrder.createdAt).toLocaleString()} · Trade: {selectedOrder.tradeType}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Buyer & Delivery */}
            <div className="grid grid-cols-2 gap-4 text-xs bg-gray-50/75 dark:bg-[#0C2A1E]/40 p-4 rounded-2xl">
              <div>
                <p className="text-gray-400 font-medium">Buyer Contact</p>
                <p className="font-bold text-gray-800 dark:text-gray-200 mt-0.5">{selectedOrder.buyer.fullName}</p>
                <p className="text-gray-600 dark:text-gray-400">{selectedOrder.buyer.phone}</p>
              </div>
              <div>
                <p className="text-gray-400 font-medium">Delivery Destination</p>
                <p className="font-semibold text-gray-800 dark:text-gray-200 mt-0.5">{selectedOrder.deliveryAddress}</p>
              </div>
            </div>

            {/* Items with Frozen Agreed Unit Price */}
            <div>
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Order Items (Agreed Price Snapshots)
              </h4>
              <div className="divide-y divide-gray-100 dark:divide-[#143427] border border-gray-100 dark:border-[#143427] rounded-xl overflow-hidden">
                {selectedOrder.items.map((item: any) => (
                  <div key={item.id} className="p-3 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-gray-800 dark:text-gray-200">{item.listingSnapshot?.name || 'Produce'}</p>
                      <p className="text-gray-400 text-[11px]">
                        Qty: {Number(item.quantity)} · Frozen Unit Price: ETB {Number(item.agreedUnitPrice).toLocaleString()}
                      </p>
                    </div>
                    <div className="font-bold text-emerald-700 dark:text-emerald-400">
                      ETB {Number(item.subtotal).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Breakdown */}
            <div className="border-t border-gray-100 dark:border-[#143427] pt-3 space-y-1.5 text-xs text-right">
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Product Subtotal:</span>
                <span>ETB {Number(selectedOrder.productSubtotal).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Delivery Logistics Fee:</span>
                <span>ETB {Number(selectedOrder.deliveryFee).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Platform Commission:</span>
                <span>ETB {Number(selectedOrder.platformCommission).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-[#142E24] dark:text-[#E6F0EB] pt-1 border-t border-gray-100 dark:border-[#143427]">
                <span>Total Amount:</span>
                <span className="text-emerald-600 dark:text-emerald-400">ETB {Number(selectedOrder.totalAmount).toLocaleString()}</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold text-xs rounded-xl hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
