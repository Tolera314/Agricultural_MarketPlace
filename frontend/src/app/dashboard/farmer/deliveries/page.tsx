'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Truck,
  MapPin,
  Clock,
  CheckCircle2,
  Phone,
  ShieldCheck,
  ChevronRight,
  Menu,
  Navigation,
  Loader2,
  PackageX,
} from 'lucide-react';
import { farmerApi } from '@/lib/farmerApi';

interface DeliveryItem {
  id: string;
  orderNumber: string;
  product: string;
  quantity: string;
  courierName: string;
  courierPhone: string;
  vehicle: string;
  origin: string;
  destination: string;
  status: 'ASSIGNED' | 'HEADING_TO_PICKUP' | 'PICKED_UP' | 'EN_ROUTE' | 'DELIVERED';
  eta: string;
}

export default function DeliveriesPage(props: any) {
  const onOpenSidebar = props?.onOpenSidebar;
  const [deliveries, setDeliveries] = useState<DeliveryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDeliveries() {
      try {
        setLoading(true);
        const res = await farmerApi.getDeliveries();
        if (res.success && Array.isArray(res.deliveries)) {
          setDeliveries(res.deliveries);
        }
      } catch (err) {
        console.error('Failed to load deliveries:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDeliveries();
  }, []);

  const activeCount = deliveries.filter((d) =>
    ['ASSIGNED', 'HEADING_TO_PICKUP', 'PICKED_UP', 'EN_ROUTE'].includes(d.status)
  ).length;

  const deliveredCount = deliveries.filter((d) => d.status === 'DELIVERED').length;
  const completionRate = deliveries.length > 0
    ? Math.round((deliveredCount / deliveries.length) * 100)
    : 100;

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
              <Truck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              Farmer Deliveries & Couriers
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
              Track delivery worker pickups and route dispatch from your farm
            </p>
          </div>
        </div>

        <Link
          href="/dashboard/farmer/orders"
          className="px-3.5 py-1.5 rounded-xl bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-200 text-xs font-bold hover:bg-gray-200 transition-colors"
        >
          View Orders
        </Link>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-[#0D2118] p-4 rounded-2xl border border-gray-100 dark:border-white/5 shadow-xs">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Active Couriers En Route</span>
            <div className="text-2xl font-black text-emerald-600 mt-1">{activeCount}</div>
            <p className="text-xs text-gray-400 mt-0.5">Assigned to harvest shipments</p>
          </div>
          <div className="bg-white dark:bg-[#0D2118] p-4 rounded-2xl border border-gray-100 dark:border-white/5 shadow-xs">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Average Pickup Time</span>
            <div className="text-2xl font-black text-[#173F35] dark:text-white mt-1">
              {deliveries.length > 0 ? '18 mins' : '—'}
            </div>
            <p className="text-xs text-gray-400 mt-0.5">From order mark-ready</p>
          </div>
          <div className="bg-white dark:bg-[#0D2118] p-4 rounded-2xl border border-gray-100 dark:border-white/5 shadow-xs">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Successful Hand-offs</span>
            <div className="text-2xl font-black text-purple-600 mt-1">{completionRate}%</div>
            <p className="text-xs text-gray-400 mt-0.5">Verified with digital QR handshake</p>
          </div>
        </div>

        {/* Deliveries List */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-gray-400 gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            <p className="text-xs font-medium">Loading live dispatch records...</p>
          </div>
        ) : deliveries.length === 0 ? (
          <div className="py-16 bg-white dark:bg-[#0D2118] rounded-2xl border border-gray-100 dark:border-white/5 flex flex-col items-center justify-center text-center p-6 space-y-2">
            <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
              <Truck className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-gray-800 dark:text-white">No active couriers or deliveries yet</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md">
              When buyers purchase your harvest and couriers accept dispatch requests, live pickup routes and contact information will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {deliveries.map((del) => (
              <div
                key={del.id}
                className="bg-white dark:bg-[#0D2118] rounded-2xl border border-gray-100 dark:border-white/5 p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-gray-800 dark:text-white">
                      {del.product}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300">
                      {del.orderNumber}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                      del.status === 'DELIVERED'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
                    }`}>
                      {del.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span><strong>Pickup:</strong> {del.origin}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Navigation className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span><strong>Dropoff:</strong> {del.destination}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs pt-1">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">
                      Courier: {del.courierName} ({del.vehicle})
                    </span>
                    {del.courierPhone ? (
                      <a
                        href={`tel:${del.courierPhone}`}
                        className="flex items-center gap-1 text-emerald-600 font-bold hover:underline"
                      >
                        <Phone className="w-3 h-3" />
                        {del.courierPhone}
                      </a>
                    ) : null}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <div className="text-[10px] font-bold text-gray-400 uppercase">Estimated Arrival</div>
                    <div className="text-sm font-black text-emerald-600">{del.eta}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
