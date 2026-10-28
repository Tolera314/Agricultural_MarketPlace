'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ShoppingCart,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Truck,
  Eye,
  Menu,
  Check,
  X,
  Phone,
  MapPin,
  RefreshCw,
} from 'lucide-react';

interface FarmerOrder {
  id: string;
  orderNumber: string;
  product: string;
  buyer: string;
  buyerPhone: string;
  deliveryLocation: string;
  quantity: string;
  totalPrice: string;
  status: 'PENDING' | 'PREPARING' | 'READY_FOR_PICKUP' | 'IN_TRANSIT' | 'DELIVERED';
  date: string;
  image: string;
}

const INITIAL_ORDERS: FarmerOrder[] = [
  {
    id: 'ord-101',
    orderNumber: '#AG-8821',
    product: 'Organic Tomatoes',
    buyer: 'Addis Ababa Fresh Market',
    buyerPhone: '+251 911 234 567',
    deliveryLocation: 'Bole, Addis Ababa',
    quantity: '30 kg',
    totalPrice: 'ETB 1,200',
    status: 'PREPARING',
    date: 'Today, 09:30 AM',
    image: '/images/prod_tomatoes.jpg',
  },
  {
    id: 'ord-102',
    orderNumber: '#AG-8819',
    product: 'Red Onions',
    buyer: 'Lideta Food Hub',
    buyerPhone: '+251 922 456 789',
    deliveryLocation: 'Lideta, Addis Ababa',
    quantity: '50 kg',
    totalPrice: 'ETB 1,250',
    status: 'READY_FOR_PICKUP',
    date: 'Today, 08:15 AM',
    image: '/images/cat_vegetables.jpg',
  },
  {
    id: 'ord-103',
    orderNumber: '#AG-8812',
    product: 'Arabica Sidama Coffee',
    buyer: 'Abyssinia Roasters',
    buyerPhone: '+251 933 789 012',
    deliveryLocation: 'Kazanchis, Addis Ababa',
    quantity: '15 kg',
    totalPrice: 'ETB 4,200',
    status: 'IN_TRANSIT',
    date: 'Yesterday',
    image: '/images/prod_coffee.jpg',
  },
  {
    id: 'ord-104',
    orderNumber: '#AG-8805',
    product: 'Navel Sweet Oranges',
    buyer: 'Hawassa Fruit Mart',
    buyerPhone: '+251 944 112 233',
    deliveryLocation: 'Hawassa Central',
    quantity: '60 kg',
    totalPrice: 'ETB 1,320',
    status: 'DELIVERED',
    date: 'Oct 24, 2026',
    image: '/images/prod_orange.jpg',
  },
  {
    id: 'ord-105',
    orderNumber: '#AG-8798',
    product: 'Yellow Maize',
    buyer: 'Sebeta Mills',
    buyerPhone: '+251 915 678 901',
    deliveryLocation: 'Sebeta Industrial',
    quantity: '100 kg',
    totalPrice: 'ETB 1,200',
    status: 'PENDING',
    date: 'Oct 23, 2026',
    image: '/images/prod_maize.jpg',
  },
];

export default function (props: any) {
  const onOpenSidebar = props?.onOpenSidebar;
  const [orders, setOrders] = useState<FarmerOrder[]>(INITIAL_ORDERS);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<FarmerOrder | null>(null);

  const filteredOrders = orders.filter((o) => {
    const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter;
    const matchesSearch =
      o.product.toLowerCase().includes(search.toLowerCase()) ||
      o.buyer.toLowerCase().includes(search.toLowerCase()) ||
      o.orderNumber.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const updateOrderStatus = (id: string, newStatus: FarmerOrder['status']) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: newStatus } : o))
    );
    if (selectedOrder?.id === id) {
      setSelectedOrder((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
  };

  const getStatusBadge = (status: FarmerOrder['status']) => {
    switch (status) {
      case 'PENDING':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">Pending Acceptance</span>;
      case 'PREPARING':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">Harvesting / Packing</span>;
      case 'READY_FOR_PICKUP':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">Ready for Courier</span>;
      case 'IN_TRANSIT':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300">On the Way</span>;
      case 'DELIVERED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">Completed & Paid</span>;
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#F4F6F5] dark:bg-[#0B1512]">
      {/* Header */}
      <header className="shrink-0 bg-white dark:bg-[#0D2118] border-b border-gray-100 dark:border-white/5 px-4 sm:px-6 h-16 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenSidebar}
            className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500 dark:text-gray-400 transition-colors cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-extrabold text-[#173F35] dark:text-white flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              Farmer Orders
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
              Manage incoming produce requests and pack orders for couriers
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/farmer/deliveries"
            className="px-3.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40 text-xs font-bold flex items-center gap-1.5 hover:bg-emerald-100 transition-colors"
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Track Deliveries</span>
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {/* Filter bar */}
        <div className="bg-white dark:bg-[#0D2118] rounded-2xl border border-gray-100 dark:border-white/5 p-4 flex flex-col sm:flex-row gap-3 items-center justify-between shadow-xs">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search product, buyer, order #..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Status Pills */}
          <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
            {['ALL', 'PENDING', 'PREPARING', 'READY_FOR_PICKUP', 'IN_TRANSIT', 'DELIVERED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                  statusFilter === st
                    ? 'bg-[#173F35] text-white shadow-xs'
                    : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10'
                }`}
              >
                {st === 'ALL' ? 'All Orders' : st.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white dark:bg-[#0D2118] rounded-2xl border border-gray-100 dark:border-white/5 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-white/5 uppercase font-bold text-[10px]">
                <tr>
                  <th className="px-5 py-3.5">Order</th>
                  <th className="px-4 py-3.5">Buyer</th>
                  <th className="px-4 py-3.5">Quantity</th>
                  <th className="px-4 py-3.5">Total (ETB)</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5 font-medium">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-400">
                      No orders found matching your filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((ord) => (
                    <tr
                      key={ord.id}
                      className="hover:bg-gray-50/70 dark:hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-100 dark:bg-white/5 relative shrink-0">
                            <Image
                              src={ord.image}
                              alt={ord.product}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div>
                            <div className="font-bold text-gray-800 dark:text-white">
                              {ord.product}
                            </div>
                            <div className="text-[11px] text-gray-400">
                              {ord.orderNumber} · {ord.date}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-gray-800 dark:text-gray-200">
                          {ord.buyer}
                        </div>
                        <div className="text-[11px] text-gray-400 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {ord.deliveryLocation}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-gray-700 dark:text-gray-300 font-bold">
                        {ord.quantity}
                      </td>
                      <td className="px-4 py-3.5 text-emerald-600 dark:text-emerald-400 font-extrabold">
                        {ord.totalPrice}
                      </td>
                      <td className="px-4 py-3.5">
                        {getStatusBadge(ord.status)}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {ord.status === 'PENDING' && (
                            <button
                              onClick={() => updateOrderStatus(ord.id, 'PREPARING')}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-colors"
                            >
                              Accept
                            </button>
                          )}
                          {ord.status === 'PREPARING' && (
                            <button
                              onClick={() => updateOrderStatus(ord.id, 'READY_FOR_PICKUP')}
                              className="px-2.5 py-1 rounded-lg bg-purple-600 text-white font-bold hover:bg-purple-700 transition-colors"
                            >
                              Mark Ready
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedOrder(ord)}
                            className="p-1.5 rounded-lg border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5"
                            title="View details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-white dark:bg-[#0D2118] rounded-3xl p-6 shadow-2xl border border-gray-100 dark:border-white/10 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-white/10">
              <div>
                <h3 className="font-extrabold text-base text-gray-800 dark:text-white">
                  Order Details {selectedOrder.orderNumber}
                </h3>
                <span className="text-xs text-gray-400">{selectedOrder.date}</span>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-2xl">
                <div className="w-12 h-12 rounded-xl overflow-hidden relative shrink-0">
                  <Image src={selectedOrder.image} alt={selectedOrder.product} fill className="object-cover" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-gray-800 dark:text-white">{selectedOrder.product}</h4>
                  <p className="text-gray-500">Qty: {selectedOrder.quantity} · Total: <span className="font-bold text-emerald-600">{selectedOrder.totalPrice}</span></p>
                </div>
              </div>

              <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-2xl space-y-1">
                <div className="font-bold text-gray-700 dark:text-gray-300">Buyer Information</div>
                <div className="text-gray-600 dark:text-gray-400">{selectedOrder.buyer}</div>
                <div className="text-gray-600 dark:text-gray-400 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> {selectedOrder.buyerPhone}</div>
                <div className="text-gray-600 dark:text-gray-400 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {selectedOrder.deliveryLocation}</div>
              </div>

              <div className="flex items-center justify-between p-3 border border-emerald-200 dark:border-emerald-800/40 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20">
                <span className="font-bold text-emerald-800 dark:text-emerald-300">Status</span>
                {getStatusBadge(selectedOrder.status)}
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-white/10 font-bold text-xs"
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
