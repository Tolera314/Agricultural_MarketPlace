'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface RecentOrderItem {
  id: string;
  title: string;
  route: string;
  priceFormatted: string;
  status: string;
  rawStatus?: string;
  date: string;
  image: string;
}

interface RecentOrdersCardProps {
  orders?: RecentOrderItem[];
}

export function RecentOrdersCard({ orders = [] }: RecentOrdersCardProps) {
  const displayOrders =
    orders.length > 0
      ? orders
      : [
          {
            id: 'ord-1',
            title: 'Tomatoes (10 kg)',
            route: 'Addis Ababa -> Sebeta',
            priceFormatted: 'ETB 600',
            status: 'Processing',
            date: 'Oct 10, 2025',
            image: '/images/prod_tomatoes.jpg',
          },
          {
            id: 'ord-2',
            title: 'Potatoes (50 kg)',
            route: 'Bahir Dar -> Addis Ababa',
            priceFormatted: 'ETB 2,800',
            status: 'Approved',
            date: 'Oct 10, 2025',
            image: '/images/prod_potatoes.jpg',
          },
          {
            id: 'ord-3',
            title: 'Coffee (20 kg)',
            route: 'Jimma -> Addis Ababa',
            priceFormatted: 'ETB 4,200',
            status: 'Shipped',
            date: 'Oct 9, 2025',
            image: '/images/prod_coffee.jpg',
          },
          {
            id: 'ord-4',
            title: 'Onions (30 kg)',
            route: 'Adama -> Addis Ababa',
            priceFormatted: 'ETB 1,050',
            status: 'Delivered',
            date: 'Oct 9, 2025',
            image: '/images/prod_tomatoes.jpg',
          },
        ];

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#E8F8F0] text-[#0A7A53] dark:bg-[#0C3322] dark:text-[#34D399] border border-[#BDE7D3] dark:border-[#144730]">
            Delivered
          </span>
        );
      case 'approved':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#ECFDF5] text-[#059669] dark:bg-[#064E3B]/60 dark:text-[#6EE7B7] border border-[#A7F3D0]/60 dark:border-[#065F46]">
            Approved
          </span>
        );
      case 'shipped':
      case 'in_transit':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#EFF6FF] text-[#2563EB] dark:bg-[#1E3A8A]/40 dark:text-[#93C5FD] border border-[#BFDBFE] dark:border-[#1E40AF]">
            Shipped
          </span>
        );
      case 'processing':
      case 'preparing':
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#F0F9FF] text-[#0284C7] dark:bg-[#082F49] dark:text-[#38BDF8] border border-[#BAE6FD] dark:border-[#0369A1]">
            Processing
          </span>
        );
    }
  };

  return (
    <div className="bg-white dark:bg-[#0A2218] border border-[#E3EAE5] dark:border-[#163D2F] rounded-2xl p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-[#142E24] dark:text-[#E6F0EB] font-display">
          Recent Orders
        </h3>
        <Link
          href="/dashboard/admin/orders"
          className="text-xs font-semibold text-[#0B9660] dark:text-[#34D399] hover:underline"
        >
          View All
        </Link>
      </div>

      {/* Orders List */}
      <div className="divide-y divide-gray-100 dark:divide-[#143427]">
        {displayOrders.slice(0, 5).map((order) => (
          <div
            key={order.id}
            className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3 group"
          >
            {/* Left: Thumbnail & Route Details */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl overflow-hidden relative shrink-0 border border-gray-100 dark:border-gray-800 bg-gray-50">
                <Image
                  src={order.image || '/images/prod_tomatoes.jpg'}
                  alt={order.title}
                  fill
                  className="object-cover"
                  sizes="40px"
                />
              </div>

              <div className="min-w-0">
                <div className="text-xs font-bold text-[#1B362C] dark:text-[#E2EAE5] truncate">
                  {order.title}
                </div>
                <div className="text-[11px] font-medium text-gray-400 dark:text-gray-500 truncate">
                  {order.route}
                </div>
              </div>
            </div>

            {/* Right: Price, Status, Date */}
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-xs font-bold text-[#142E24] dark:text-[#E2EAE5]">
                {order.priceFormatted}
              </span>

              {getStatusBadge(order.status)}

              <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500 hidden sm:inline-block w-20 text-right">
                {order.date}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
