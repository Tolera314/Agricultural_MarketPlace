'use client';

import React from 'react';
import { LayoutGrid, ArrowRight } from 'lucide-react';
import { POPULAR_CATEGORIES } from '@/data/marketplaceData';

interface ShopByCategoryProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

export const ShopByCategory: React.FC<ShopByCategoryProps> = ({
  selectedCategory,
  onSelectCategory,
}) => {
  return (
    <section id="categories" className="py-10 sm:py-14 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-20">
      {/* Section Header */}
      <div className="text-center mb-8 sm:mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8F5E9] dark:bg-[#163327] text-[#2E7D32] dark:text-[#34D399] text-xs font-semibold tracking-wide mb-3 border border-emerald-200/50 dark:border-emerald-800/40">
          <LayoutGrid className="w-3.5 h-3.5 text-[#2E7D32] dark:text-[#34D399]" />
          <span>Popular Categories</span>
        </div>

        <h2 className="text-xl xs:text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#11382B] dark:text-[#E8F7EE] tracking-tight">
          Shop by Category
        </h2>
        <p className="mt-1.5 sm:mt-2 text-xs sm:text-base text-[#4A675B] dark:text-[#88A89A] max-w-2xl mx-auto px-2">
          Find the freshest harvest and agricultural inputs from verified local farmers, all in one place.
        </p>
      </div>

      {/* 6 Category Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-4 lg:gap-5">
        {POPULAR_CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`group text-left bg-white dark:bg-[#11221C] rounded-xl sm:rounded-2xl overflow-hidden border transition-all duration-200 hover:-translate-y-1 hover:shadow-md cursor-pointer flex flex-col ${
                isSelected
                  ? 'border-[#2E7D32] dark:border-[#34D399] ring-2 ring-[#2E7D32]/20 dark:ring-[#34D399]/20 shadow-sm'
                  : 'border-[#E2EAE5] dark:border-[#1E3A2F] hover:border-[#2E7D32]/50 dark:hover:border-[#34D399]/50'
              }`}
            >
              <div className="w-full h-24 xs:h-28 sm:h-32 overflow-hidden bg-slate-100 dark:bg-slate-900 relative">
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
              </div>
              <div className="p-2.5 sm:p-3.5 flex items-center justify-between flex-1">
                <div className="min-w-0 pr-1">
                  <span className="text-xs sm:text-sm font-bold text-[#18392B] dark:text-[#EDF7F1] group-hover:text-[#2E7D32] dark:group-hover:text-[#34D399] transition-colors block truncate">
                    {cat.name}
                  </span>
                  <span className="text-[10px] sm:text-[11px] text-[#638275] dark:text-[#7A9C8D] font-medium block mt-0.5 truncate">
                    {cat.count}
                  </span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[#39745A] dark:text-[#34D399] group-hover:translate-x-1 transition-transform shrink-0" />
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};
