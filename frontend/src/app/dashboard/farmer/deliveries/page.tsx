'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';

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

const SAMPLE_DELIVERIES: DeliveryItem[] = [
  {
    id: 'del-1',
    orderNumber: '#AG-8819',
    product: 'Red Onions (50 kg)',
    quantity: '50 kg',
    courierName: 'Abebe Mekonnen',
    courierPhone: '+251 911 234 567',
    vehicle: 'Isuzu NPR Truck (1,500 kg)',
    origin: 'Abebe Farm, Sebeta',
    destination: 'Lideta Food Hub, Addis Ababa',
    status: 'HEADING_TO_PICKUP',
    eta: '25 mins',
  },
  {
    id: 'del-2',
    orderNumber: '#AG-8812',
    product: 'Arabica Sidama Coffee (15 kg)',
    quantity: '15 kg',
    courierName: 'Dawit Tadesse',
    courierPhone: '+251 922 889 001',
    vehicle: 'Motorcycle Express Box (50 kg)',
    origin: 'Sidama Collection Point',
    destination: 'Kazanchis Roasters, Addis Ababa',
    status: 'EN_ROUTE',
    eta: '10 mins',
  },
  {
    id: 'del-3',
    orderNumber: '#AG-8805',
    product: 'Navel Sweet Oranges (60 kg)',
    quantity: '60 kg',
    courierName: 'Kenenisa Bekele',
    courierPhone: '+251 933 123 456',
    vehicle: 'Toyota HiAce Van (800 kg)',
    origin: 'Arba Minch Orchards',
    destination: 'Hawassa Central Mart',
    status: 'DELIVERED',
    eta: 'Completed',
  },
];

export default function (props: any) {
  const onOpenSidebar = props?.onOpenSidebar;
  const [deliveries] = useState<DeliveryItem[]>(SAMPLE_DELIVERIES);

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
            <div className="text-2xl font-black text-emerald-600 mt-1">2</div>
            <p className="text-xs text-gray-400 mt-0.5">Assigned to harvest shipments</p>
          </div>
          <div className="bg-white dark:bg-[#0D2118] p-4 rounded-2xl border border-gray-100 dark:border-white/5 shadow-xs">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Average Pickup Time</span>
            <div className="text-2xl font-black text-[#173F35] dark:text-white mt-1">18 mins</div>
            <p className="text-xs text-gray-400 mt-0.5">From order mark-ready</p>
          </div>
          <div className="bg-white dark:bg-[#0D2118] p-4 rounded-2xl border border-gray-100 dark:border-white/5 shadow-xs">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Successful Hand-offs</span>
            <div className="text-2xl font-black text-purple-600 mt-1">99.4%</div>
            <p className="text-xs text-gray-400 mt-0.5">Verified with digital QR handshake</p>
          </div>
        </div>

        {/* Deliveries List */}
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
                  <span className="flex items-center gap-1 text-emerald-600 font-bold">
                    <Phone className="w-3 h-3" />
                    {del.courierPhone}
                  </span>
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
      </div>
    </div>
  );
}
