'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface TopProductItem {
  id: string;
  name: string;
  soldCount: number;
  image: string;
}

interface TopProductsCardProps {
  products?: TopProductItem[];
}

export function TopProductsCard({ products = [] }: TopProductsCardProps) {
  const displayProducts =
    products.length > 0
      ? products
      : [
          { id: '1', name: 'Tomatoes', soldCount: 420, image: '/images/prod_tomatoes.jpg' },
          { id: '2', name: 'Potatoes', soldCount: 380, image: '/images/prod_potatoes.jpg' },
          { id: '3', name: 'Onions', soldCount: 310, image: '/images/prod_tomatoes.jpg' },
          { id: '4', name: 'Coffee', soldCount: 220, image: '/images/prod_coffee.jpg' },
          { id: '5', name: 'Maize', soldCount: 180, image: '/images/prod_maize.jpg' },
        ];

  return (
    <div className="bg-white dark:bg-[#0A2218] border border-[#E3EAE5] dark:border-[#163D2F] rounded-2xl p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-[#142E24] dark:text-[#E6F0EB] font-display">
          Top Products
        </h3>
        <Link
          href="/admin/products"
          className="text-xs font-semibold text-[#0B9660] dark:text-[#34D399] hover:underline"
        >
          View All
        </Link>
      </div>

      {/* Grid of 5 Products */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
        {displayProducts.slice(0, 5).map((p) => (
          <div
            key={p.id}
            className="group p-2 rounded-xl border border-gray-100 dark:border-[#143427] hover:border-[#10B981]/50 hover:shadow-sm transition-all duration-150 flex flex-col items-center text-center bg-gray-50/50 dark:bg-[#0C2A1E]/40"
          >
            {/* Image Thumbnail */}
            <div className="w-16 h-16 rounded-xl overflow-hidden relative mb-2 shadow-xs bg-gray-100 dark:bg-gray-800">
              <Image
                src={p.image || '/images/prod_tomatoes.jpg'}
                alt={p.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-200"
                sizes="64px"
              />
            </div>

            {/* Product Title */}
            <div className="text-xs font-bold text-[#1A362C] dark:text-[#E2EAE5] truncate w-full">
              {p.name}
            </div>

            {/* Sold Count */}
            <div className="text-[11px] font-medium text-gray-500 dark:text-gray-400 mt-0.5">
              {p.soldCount} sold
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
