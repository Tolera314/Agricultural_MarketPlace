'use client';

import React, { useState } from 'react';
import { Sparkles, MapPin, Star, Heart, Check, ArrowRight } from 'lucide-react';
import { EXACT_FEATURED_PRODUCTS, FeaturedProductItem } from '@/data/marketplaceData';
import { Product } from '@/types';

interface FreshAndSeasonalProductsProps {
  onAddToCart: (product: Product) => void;
}

export const FreshAndSeasonalProducts: React.FC<FreshAndSeasonalProductsProps> = ({
  onAddToCart,
}) => {
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const [addedNotice, setAddedNotice] = useState<string | null>(null);

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAdd = (item: FeaturedProductItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const product: Product = {
      id: item.id,
      name: item.name,
      category: item.name === 'Orange' ? 'fruits' : item.name === 'Maize' ? 'grains' : item.name === 'Coffee Beans' ? 'specialty' : 'vegetables',
      farmerId: 'farmer-1',
      farmerName: item.farmerName,
      farmName: item.farmerName,
      farmerLocation: `${item.distanceKm} km away`,
      price: item.pricePerKg,
      unit: 'kg',
      availableQty: 250,
      minimumOrder: 1,
      harvestDate: 'Today, 6:00 AM',
      cultivationMethod: 'Certified Organic',
      originCity: 'Debre Zeit',
      isIntercityEligible: true,
      image: item.image,
      description: item.description,
      storageNotes: 'Keep in ventilated produce crate or refrigeration.',
    };
    onAddToCart(product);
    setAddedNotice(item.name);
    setTimeout(() => setAddedNotice(null), 2500);
  };

  const handleCardClick = (item: FeaturedProductItem) => {
    const product: Product = {
      id: item.id,
      name: item.name,
      category: item.name === 'Orange' ? 'fruits' : item.name === 'Maize' ? 'grains' : item.name === 'Coffee Beans' ? 'specialty' : 'vegetables',
      farmerId: 'farmer-1',
      farmerName: item.farmerName,
      farmName: item.farmerName,
      farmerLocation: `${item.distanceKm} km away`,
      price: item.pricePerKg,
      unit: 'kg',
      availableQty: 250,
      minimumOrder: 1,
      harvestDate: 'Today, 6:00 AM',
      cultivationMethod: 'Certified Organic',
      originCity: 'Debre Zeit',
      isIntercityEligible: true,
      image: item.image,
      description: item.description,
      storageNotes: 'Keep in ventilated produce crate or refrigeration.',
    };
    onAddToCart(product);
    setAddedNotice(item.name);
    setTimeout(() => setAddedNotice(null), 2500);
  };

  return (
    <section id="products" className="py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#EDF3EF] dark:border-[#1A3329] scroll-mt-20 relative">
      <div id="farmers" className="absolute -top-24 left-0 pointer-events-none" />

      {/* Toast Notification with Check icon */}
      {addedNotice && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#143D2D] dark:bg-[#10B981] text-white px-4 py-3 rounded-2xl shadow-xl text-xs sm:text-sm font-semibold flex items-center gap-2.5 animate-bounce">
          <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
          </div>
          <span>Added {addedNotice} to your cart</span>
        </div>
      )}

      {/* Header with View All Products Link */}
      <div className="flex flex-row items-end justify-between mb-6 sm:mb-8 gap-2">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8F5E9] dark:bg-[#163327] text-[#2E7D32] dark:text-[#34D399] text-xs font-semibold tracking-wide mb-2 sm:mb-3 border border-emerald-200/50 dark:border-emerald-800/40">
            <Sparkles className="w-3.5 h-3.5 text-[#2E7D32] dark:text-[#34D399]" />
            <span>Featured Products</span>
          </div>

          <h2 className="text-xl xs:text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#11382B] dark:text-[#E8F7EE] tracking-tight">
            Fresh &amp; Seasonal Products
          </h2>
          <p className="mt-1 sm:mt-2 text-xs sm:text-base text-[#4A675B] dark:text-[#88A89A] line-clamp-1 sm:line-clamp-none">
            Directly from verified local family farmers, harvested at peak ripeness.
          </p>
        </div>

        <button
          onClick={() => {
            const el = document.getElementById('products');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
          className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-[#2E7D32] dark:text-[#34D399] hover:text-[#1B5E20] dark:hover:text-[#6EE7B7] transition-colors shrink-0 mb-1 cursor-pointer"
        >
          <span className="hidden xs:inline">View All Products</span>
          <span className="xs:hidden">View All</span>
          <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
      </div>

      {/* 5 Product Cards Grid (5th card spans 2 columns on mobile for a balanced 2-column layout) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-4 lg:gap-5">
        {EXACT_FEATURED_PRODUCTS.map((prod, idx) => {
          const isFav = !!favorites[prod.id];
          const isLastSingleOnMobile = idx === 4;

          return (
            <div
              key={prod.id}
              onClick={() => handleCardClick(prod)}
              className={`group bg-white dark:bg-[#11221C] rounded-xl sm:rounded-2xl overflow-hidden border border-[#E2EAE5] dark:border-[#1E3A2F] hover:border-[#2E7D32]/50 dark:hover:border-[#34D399]/50 hover:shadow-md transition-all duration-200 cursor-pointer ${
                isLastSingleOnMobile
                  ? 'col-span-2 sm:col-span-1 flex flex-row sm:flex-col'
                  : 'flex flex-col'
              }`}
            >
              {/* Product Image & Favorite Button */}
              <div
                className={`relative overflow-hidden bg-slate-100 dark:bg-slate-900 shrink-0 ${
                  isLastSingleOnMobile
                    ? 'w-28 xs:w-36 sm:w-full h-auto sm:h-40 min-h-[120px]'
                    : 'w-full h-28 xs:h-32 sm:h-40'
                }`}
              >
                <img
                  src={prod.image}
                  alt={prod.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
                <button
                  type="button"
                  onClick={(e) => toggleFavorite(prod.id, e)}
                  aria-label={`Favorite ${prod.name}`}
                  className="absolute top-2 right-2 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md flex items-center justify-center transition-colors text-white cursor-pointer"
                >
                  <Heart
                    className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-colors ${
                      isFav ? 'fill-red-500 text-red-500' : 'text-white'
                    }`}
                  />
                </button>
              </div>

              {/* Product Info */}
              <div className="p-2.5 sm:p-4 flex flex-col flex-1 justify-between min-w-0">
                <div>
                  <h3 className="font-bold text-xs sm:text-base text-[#11382B] dark:text-[#EDF7F1] group-hover:text-[#2E7D32] dark:group-hover:text-[#34D399] transition-colors truncate">
                    {prod.name}
                  </h3>
                  <p className="text-[10px] sm:text-[11px] text-[#638275] dark:text-[#7A9C8D] font-medium mt-0.5 truncate">
                    {prod.categoryTag}
                  </p>

                  {/* Price */}
                  <div className="mt-1.5 sm:mt-2.5 flex items-baseline gap-1">
                    <span className="text-xs sm:text-base font-extrabold text-[#11382B] dark:text-[#F3FAF6]">
                      ETB {prod.pricePerKg}
                    </span>
                    <span className="text-[10px] sm:text-[11px] text-[#638275] dark:text-[#7A9C8D]">/ kg</span>
                  </div>

                  {/* Distance & Rating */}
                  <div className="mt-1.5 sm:mt-2.5 flex items-center justify-between text-[10px] sm:text-[11px] text-[#638275] dark:text-[#7A9C8D] pt-1.5 sm:pt-2 border-t border-[#F0F5F2] dark:border-[#1E3A2F]">
                    <div className="flex items-center gap-1 truncate pr-1">
                      <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#2E7D32] dark:text-[#34D399] shrink-0" />
                      <span className="truncate">{prod.distanceKm} km</span>
                    </div>
                    <div className="flex items-center gap-1 text-[#2E7D32] dark:text-[#34D399] font-semibold shrink-0">
                      <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-amber-400 text-amber-400" />
                      <span>{prod.rating}</span>
                      <span className="text-[#89A398] dark:text-[#5F8372] font-normal">({prod.reviewsCount})</span>
                    </div>
                  </div>
                </div>

                {/* Add to Cart Button */}
                <button
                  type="button"
                  onClick={(e) => handleAdd(prod, e)}
                  className="mt-2.5 sm:mt-4 w-full py-2 sm:py-2.5 px-2.5 rounded-lg sm:rounded-xl bg-[#2E7D32] hover:bg-[#1B5E20] dark:bg-[#10B981] dark:hover:bg-[#059669] text-white text-[11px] sm:text-xs font-semibold tracking-wide transition-all flex items-center justify-center gap-1 shadow-xs hover:shadow cursor-pointer"
                >
                  <span>Add to Cart</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
