'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Tractor,
  MapPin,
  Star,
  Search,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  ShoppingBag,
  ExternalLink,
} from 'lucide-react';
import { Header, Footer } from '@/components/layout';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { buyerApi } from '@/lib/buyerApi';
import { SUPPORTED_LOCATIONS } from '@/data/marketplaceData';

interface DisplayFarmer {
  id: string;
  name: string;
  farmName: string;
  locationName: string;
  distanceKm: number;
  distanceDisplay: string;
  rating: number;
  reviewsCount: number;
  productsSummary: string;
  priceRangeDisplay: string;
  avatarUrl: string;
}

const FALLBACK_FARMERS: DisplayFarmer[] = [
  {
    id: 'farmer-abebe-uuid',
    name: 'Abebe Tadesse',
    farmName: 'Abebe Tadesse Farm',
    locationName: 'Addis Ababa',
    distanceKm: 1.2,
    distanceDisplay: '1.2 km',
    rating: 4.8,
    reviewsCount: 124,
    productsSummary: 'Organic Tomatoes, Red Onions, French Green Beans',
    priceRangeDisplay: 'ETB 60 - 80 /kg',
    avatarUrl: '/images/avatar_abebe_hd.jpg',
  },
  {
    id: 'farmer-mekannen-uuid',
    name: 'Mekannen Girma',
    farmName: 'Girma Family Farms',
    locationName: 'Addis Ababa',
    distanceKm: 3.4,
    distanceDisplay: '3.4 km',
    rating: 4.6,
    reviewsCount: 98,
    productsSummary: 'Highland Yellow Potatoes, White Maize Grain',
    priceRangeDisplay: 'ETB 38 - 45 /kg',
    avatarUrl: '/images/avatar_mekonnen_hd.jpg',
  },
  {
    id: 'farmer-heran-uuid',
    name: 'Selamawit Bekele',
    farmName: 'Selamawit Bekele Greenhouse',
    locationName: 'Addis Ababa',
    distanceKm: 5.1,
    distanceDisplay: '5.1 km',
    rating: 4.9,
    reviewsCount: 152,
    productsSummary: 'Crisp Hydroponic Romaine Lettuce, Baby Spinach',
    priceRangeDisplay: 'ETB 40 - 55 /head',
    avatarUrl: '/images/avatar_selamawit_hd.jpg',
  },
  {
    id: 'farmer-awash-uuid',
    name: 'Awash Valley Coop',
    farmName: 'Awash Valley Farmers Union',
    locationName: 'Awash / Oromia',
    distanceKm: 14.8,
    distanceDisplay: '14.8 km',
    rating: 5.0,
    reviewsCount: 185,
    productsSummary: 'Single-Origin Yirgacheffe Coffee, Sun-Dried Pulses',
    priceRangeDisplay: 'ETB 110 - 340 /kg',
    avatarUrl: '/images/avatar_abebe_hd.jpg',
  },
];

export default function FarmersDirectoryPage() {
  const router = useRouter();
  const { isCartDrawerOpen, setIsCartDrawerOpen, cart, updateQuantity, removeItem, clearCart } = useCart();

  const [currentLocation] = useState(SUPPORTED_LOCATIONS[0]);
  const [farmers, setFarmers] = useState<DisplayFarmer[]>(FALLBACK_FARMERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadFarmers() {
      setIsLoading(true);
      try {
        const res = await buyerApi.getNearbyFarmers();
        if (isMounted && res?.data && Array.isArray(res.data) && res.data.length > 0) {
          const mapped: DisplayFarmer[] = res.data.map((f: any) => ({
            id: f.id,
            name: f.name || 'Local Farmer',
            farmName: f.farmName || f.name || 'Family Farm',
            locationName: f.locationName || 'Addis Ababa',
            distanceKm: f.distanceKm ?? 2.5,
            distanceDisplay: f.distanceDisplay || `${f.distanceKm ?? 2.5} km`,
            rating: f.rating || 4.8,
            reviewsCount: f.reviewsCount || 50,
            productsSummary: f.productsSummary || (Array.isArray(f.productsList) ? f.productsList.join(', ') : 'Fresh seasonal crops'),
            priceRangeDisplay: f.priceRangeDisplay || 'Farm Gate Pricing',
            avatarUrl: f.avatarUrl || '/images/avatar_abebe_hd.jpg',
          }));
          setFarmers(mapped);
        }
      } catch (err) {
        console.warn('Backend farmers fetch offline, using local data:', err);
        if (isMounted) setFarmers(FALLBACK_FARMERS);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadFarmers();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredFarmers = farmers.filter((f) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      f.name.toLowerCase().includes(q) ||
      f.farmName.toLowerCase().includes(q) ||
      f.locationName.toLowerCase().includes(q) ||
      f.productsSummary.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#0B1512] text-[#252B26] dark:text-[#E8F7EE] flex flex-col font-sans transition-colors duration-200">
      {/* 1. Global Navigation Header */}
      <Header
        currentLocation={currentLocation}
        onOpenCart={() => setIsCartDrawerOpen(true)}
      />

      <div className="h-16 sm:h-20 shrink-0" aria-hidden="true" />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Page Hero Banner */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8F5E9] dark:bg-[#163327] text-[#2E7D32] dark:text-[#34D399] text-xs font-semibold tracking-wide mb-3 border border-emerald-200/50 dark:border-emerald-800/40">
            <Tractor className="w-3.5 h-3.5 text-[#2E7D32] dark:text-[#34D399]" />
            <span>Verified Grower Directory</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-[#11382B] dark:text-[#EDF7F1] tracking-tight">
            Meet Verified Family Farmers
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-[#4A675B] dark:text-[#88A89A] max-w-2xl">
            Explore verified agricultural producers in your region. View farm practices, discover fresh harvests, and purchase direct without middleman markups.
          </p>
        </div>

        {/* Search Bar */}
        <div className="bg-white dark:bg-[#11221C] rounded-2xl border border-[#E2EAE5] dark:border-[#1E3A2F] p-4 sm:p-5 mb-8 shadow-xs flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#638275] dark:text-[#7A9C8D] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search farmers by name, farm name, or produce..."
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border border-[#E5EDE4] dark:border-[#1E3A2F] bg-[#FAF8F5] dark:bg-[#0B1512] text-[#252B26] dark:text-[#F3FAF6] focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
            />
          </div>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="px-3 py-2 text-xs text-[#638275] hover:text-[#11382B] dark:hover:text-white"
            >
              Clear
            </button>
          )}
        </div>

        {/* Nearest-First Ranking Indicator */}
        <div className="flex items-center justify-between text-xs text-[#638275] dark:text-[#7A9C8D] mb-5">
          <span>
            Ranked by <strong className="font-semibold text-[#11382B] dark:text-[#EDF7F1]">Proximity (Nearest First)</strong> from your market zone
          </span>
          <span className="flex items-center gap-1 text-[#2E7D32] dark:text-[#34D399]">
            <ShieldCheck className="w-3.5 h-3.5" />
            Verified Identity &amp; Land Ownership
          </span>
        </div>

        {/* Farmers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredFarmers.map((farmer) => (
            <div
              key={farmer.id}
              onClick={() => router.push(`/farmers/${farmer.id}`)}
              className="group bg-white dark:bg-[#11221C] rounded-2xl border border-[#E2EAE5] dark:border-[#1E3A2F] hover:border-[#2E7D32]/50 dark:hover:border-[#34D399]/50 hover:shadow-lg transition-all p-5 cursor-pointer flex flex-col justify-between"
            >
              <div>
                {/* Farmer Info Header */}
                <div className="flex items-start gap-4">
                  <img
                    src={farmer.avatarUrl}
                    alt={farmer.name}
                    className="w-16 h-16 rounded-2xl object-cover border border-[#E5EDE4] dark:border-[#1E3A2F] shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-bold text-base text-[#11382B] dark:text-[#EDF7F1] group-hover:text-[#2E7D32] dark:group-hover:text-[#34D399] transition-colors truncate">
                        {farmer.farmName}
                      </h3>
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#2E7D32] dark:text-[#34D399] bg-[#E8F5E9] dark:bg-[#163327] px-2 py-0.5 rounded-full shrink-0">
                        <ShieldCheck className="w-3 h-3" />
                        Verified
                      </span>
                    </div>

                    <p className="text-xs text-[#638275] dark:text-[#7A9C8D] font-medium mt-0.5">
                      Operated by {farmer.name}
                    </p>

                    <div className="flex items-center gap-3 text-xs text-[#638275] dark:text-[#7A9C8D] mt-2">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#2E7D32] dark:text-[#34D399]" />
                        <span>{farmer.distanceDisplay}</span>
                        <span>•</span>
                        <span>{farmer.locationName}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[#2E7D32] dark:text-[#34D399] font-bold">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>{farmer.rating}</span>
                        <span className="text-[#89A398] dark:text-[#5F8372] font-normal">
                          ({farmer.reviewsCount})
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Produce Summary */}
                <div className="mt-4 pt-4 border-t border-[#F0F5F2] dark:border-[#1E3A2F] space-y-2">
                  <div className="text-xs">
                    <span className="font-bold text-[#11382B] dark:text-[#EDF7F1]">Active Harvests: </span>
                    <span className="text-[#4A675B] dark:text-[#88A89A]">{farmer.productsSummary}</span>
                  </div>
                  <div className="text-xs">
                    <span className="font-bold text-[#11382B] dark:text-[#EDF7F1]">Price Range: </span>
                    <span className="text-[#2E7D32] dark:text-[#34D399] font-semibold">{farmer.priceRangeDisplay}</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-5 pt-3 border-t border-[#F0F5F2] dark:border-[#1E3A2F] flex items-center justify-between text-xs font-semibold text-[#2E7D32] dark:text-[#34D399]">
                <span>Explore Farm &amp; Harvests</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* 2. Global Footer */}
      <Footer />

      {/* 3. Global Cart Drawer */}
      <CartDrawer
        isOpen={isCartDrawerOpen}
        onClose={() => setIsCartDrawerOpen(false)}
        items={cart}
        currentLocation={currentLocation}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeItem}
        onClearCart={clearCart}
      />
    </div>
  );
}

