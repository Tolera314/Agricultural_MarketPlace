'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  Filter,
  MapPin,
  Star,
  ShoppingBag,
  Zap,
  ArrowUpDown,
  Check,
  Tractor,
  SlidersHorizontal,
  RefreshCw,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { Header, Footer } from '@/components/layout';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { AuthRequiredModal } from '@/components/auth/AuthRequiredModal';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { buyerApi } from '@/lib/buyerApi';
import { SUPPORTED_LOCATIONS, POPULAR_CATEGORIES } from '@/data/marketplaceData';
import { Product } from '@/types';

interface DisplayListing {
  id: string;
  name: string;
  farmerId: string;
  farmerName: string;
  farmName: string;
  categoryId: string;
  categoryName: string;
  description: string;
  pricePerUnit: number;
  unit: string;
  stockQuantity: number;
  qualityGrade?: string;
  distanceKm: number;
  distanceDisplay: string;
  rating: number;
  reviewsCount: number;
  imageUrl: string;
  intercityEligible?: boolean;
}

const FALLBACK_LISTINGS: DisplayListing[] = [
  {
    id: 'prod-tomatoes-1',
    name: 'Vine-Ripened Organic Tomatoes',
    farmerId: 'farmer-abebe-uuid',
    farmerName: 'Abebe Tadesse',
    farmName: 'Abebe Tadesse Farm',
    categoryId: 'vegetables',
    categoryName: 'Vegetables',
    description: 'Fresh highland tomatoes harvested at dawn, rich in flavor and pesticide-free.',
    pricePerUnit: 60,
    unit: 'kg',
    stockQuantity: 250,
    qualityGrade: 'A',
    distanceKm: 1.2,
    distanceDisplay: '1.2 km',
    rating: 4.8,
    reviewsCount: 124,
    imageUrl: '/images/prod_tomatoes.jpg',
    intercityEligible: true,
  },
  {
    id: 'prod-potatoes-2',
    name: 'Highland Yellow Potatoes',
    farmerId: 'farmer-mekannen-uuid',
    farmerName: 'Mekannen Girma',
    farmName: 'Girma Family Farms',
    categoryId: 'vegetables',
    categoryName: 'Vegetables',
    description: 'Cultivated in volcanic red soils, perfect for stewing and home cooking.',
    pricePerUnit: 45,
    unit: 'kg',
    stockQuantity: 500,
    qualityGrade: 'A',
    distanceKm: 3.4,
    distanceDisplay: '3.4 km',
    rating: 4.6,
    reviewsCount: 98,
    imageUrl: '/images/prod_potatoes.jpg',
    intercityEligible: true,
  },
  {
    id: 'prod-lettuce-3',
    name: 'Crisp Hydroponic Romaine Lettuce',
    farmerId: 'farmer-heran-uuid',
    farmerName: 'Selamawit Bekele',
    farmName: 'Selamawit Bekele Greenhouse',
    categoryId: 'vegetables',
    categoryName: 'Vegetables',
    description: 'Fresh crisp romaine lettuce heads grown cleanly in hydroponic greenhouses.',
    pricePerUnit: 40,
    unit: 'head',
    stockQuantity: 180,
    qualityGrade: 'A',
    distanceKm: 5.1,
    distanceDisplay: '5.1 km',
    rating: 4.9,
    reviewsCount: 152,
    imageUrl: '/images/prod_lettuce.jpg',
    intercityEligible: false,
  },
  {
    id: 'prod-coffee-5',
    name: 'Single-Origin Yirgacheffe Washed Coffee',
    farmerId: 'farmer-awash-uuid',
    farmerName: 'Awash Valley Coop',
    farmName: 'Awash Valley Farmers Union',
    categoryId: 'coffee-spices',
    categoryName: 'Coffee & Spices',
    description: 'Grade 1 specialty floral arabica green beans directly from cooperative farmers.',
    pricePerUnit: 340,
    unit: 'kg',
    stockQuantity: 200,
    qualityGrade: 'A',
    distanceKm: 14.8,
    distanceDisplay: '14.8 km',
    rating: 5.0,
    reviewsCount: 185,
    imageUrl: '/images/prod_coffee.jpg',
    intercityEligible: true,
  },
  {
    id: 'prod-maize-6',
    name: 'White Maize Grain',
    farmerId: 'farmer-mekannen-uuid',
    farmerName: 'Mekannen Girma',
    farmName: 'Girma Family Farms',
    categoryId: 'grains-cereals',
    categoryName: 'Grains & Cereals',
    description: 'Dry sorted white maize grain for milling and household preparation.',
    pricePerUnit: 38,
    unit: 'kg',
    stockQuantity: 1200,
    qualityGrade: 'B',
    distanceKm: 3.4,
    distanceDisplay: '3.4 km',
    rating: 4.5,
    reviewsCount: 64,
    imageUrl: '/images/prod_maize.jpg',
    intercityEligible: true,
  },
  {
    id: 'prod-greenbeans-1',
    name: 'Tender French Green Beans',
    farmerId: 'farmer-abebe-uuid',
    farmerName: 'Abebe Tadesse',
    farmName: 'Abebe Tadesse Farm',
    categoryId: 'vegetables',
    categoryName: 'Vegetables',
    description: 'Tender, pesticide-free French green beans hand-picked before sunrise.',
    pricePerUnit: 80,
    unit: 'kg',
    stockQuantity: 120,
    qualityGrade: 'A',
    distanceKm: 1.2,
    distanceDisplay: '1.2 km',
    rating: 4.9,
    reviewsCount: 45,
    imageUrl: '/images/prod_green_beans.jpg',
    intercityEligible: false,
  },
];

export default function ProductsCatalogPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { addToCart, isCartDrawerOpen, setIsCartDrawerOpen, cart, updateQuantity, removeItem, clearCart } = useCart();

  const [currentLocation] = useState(SUPPORTED_LOCATIONS[0]);
  const [products, setProducts] = useState<DisplayListing[]>(FALLBACK_LISTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'distance' | 'price_asc' | 'price_desc' | 'rating'>('distance');
  const [addedNotice, setAddedNotice] = useState<string | null>(null);

  // Authentication Required Modal for Guest Purchases
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authRedirectUrl, setAuthRedirectUrl] = useState<string>('/products');
  const [roleNotice, setRoleNotice] = useState<string | null>(null);

  // Fetch products from backend with fallback
  useEffect(() => {
    let isMounted = true;
    async function loadProducts() {
      setIsLoading(true);
      try {
        const res = await buyerApi.searchProducts({
          search: searchQuery || undefined,
          category: selectedCategory !== 'all' ? selectedCategory : undefined,
          sortBy,
        });

        if (isMounted && res?.data && Array.isArray(res.data)) {
          const mapped: DisplayListing[] = res.data.map((item: any) => ({
            id: item.id,
            name: item.name || item.cropName || 'Farm Harvest',
            farmerId: item.farmerId,
            farmerName: item.farmerName || 'Local Farmer',
            farmName: item.farmName || item.farmerName || 'Family Farm',
            categoryId: item.categoryId || 'vegetables',
            categoryName: item.categoryName || 'Vegetables',
            description: item.description || '',
            pricePerUnit: item.pricePerUnit || item.price || 50,
            unit: item.unit || 'kg',
            stockQuantity: item.stockQuantity || 100,
            qualityGrade: item.qualityGrade || 'A',
            distanceKm: item.distanceKm ?? 2.5,
            distanceDisplay: item.distanceDisplay || `${item.distanceKm ?? 2.5} km`,
            rating: item.rating || 4.8,
            reviewsCount: item.reviewsCount || 40,
            imageUrl:
              item.imageUrl ||
              (item.images && item.images[0]?.url) ||
              '/images/prod_tomatoes.jpg',
            intercityEligible: !!item.intercityEligible,
          }));
          setProducts(mapped);
        }
      } catch (err) {
        console.warn('Backend product search offline, using local marketplace data:', err);
        // Local client-side filter of fallback data
        let filtered = [...FALLBACK_LISTINGS];
        if (selectedCategory !== 'all') {
          filtered = filtered.filter((p) => p.categoryId === selectedCategory);
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          filtered = filtered.filter(
            (p) =>
              p.name.toLowerCase().includes(q) ||
              p.farmerName.toLowerCase().includes(q) ||
              p.description.toLowerCase().includes(q)
          );
        }
        if (sortBy === 'distance') filtered.sort((a, b) => a.distanceKm - b.distanceKm);
        else if (sortBy === 'price_asc') filtered.sort((a, b) => a.pricePerUnit - b.pricePerUnit);
        else if (sortBy === 'price_desc') filtered.sort((a, b) => b.pricePerUnit - a.pricePerUnit);
        else if (sortBy === 'rating') filtered.sort((a, b) => b.rating - a.rating);

        if (isMounted) {
          setProducts(filtered);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadProducts();
    return () => {
      isMounted = false;
    };
  }, [searchQuery, selectedCategory, sortBy]);

  // Convert DisplayListing to Product type for Cart
  const toProduct = (item: DisplayListing): Product => ({
    id: item.id,
    name: item.name,
    category: (item.categoryId === 'fruits'
      ? 'fruits'
      : item.categoryId === 'grains-cereals'
      ? 'grains'
      : item.categoryId === 'coffee-spices'
      ? 'specialty'
      : 'vegetables') as any,
    farmerId: item.farmerId,
    farmerName: item.farmerName,
    farmName: item.farmName,
    farmerLocation: `${item.distanceDisplay} away`,
    price: item.pricePerUnit,
    unit: item.unit,
    availableQty: item.stockQuantity,
    minimumOrder: 1,
    harvestDate: 'Fresh Today',
    cultivationMethod: 'Certified Organic',
    originCity: currentLocation.name,
    isIntercityEligible: !!item.intercityEligible,
    image: item.imageUrl,
    description: item.description,
    storageNotes: 'Keep in ventilated produce crate.',
  });

  // Action: Add to Cart (Allows guests to prepare their cart)
  const handleAddToCart = (item: DisplayListing, e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(toProduct(item), 1);
    setAddedNotice(item.name);
    setTimeout(() => setAddedNotice(null), 2500);
  };

  // Action: Buy Now (Requires authentication before proceeding to order)
  const handleBuyNow = (item: DisplayListing, e: React.MouseEvent) => {
    e.stopPropagation();
    const prod = toProduct(item);

    // If guest: trigger authentication modal preserving the product purchase intent
    if (!isAuthenticated || !user) {
      setAuthRedirectUrl(`/dashboard/buyer?buyNow=${item.id}`);
      setShowAuthModal(true);
      return;
    }

    // Role check: Only buyers (or admins) can place orders
    if (user.role !== 'BUYER' && user.role !== 'ADMIN' && user.role !== 'SUPERADMIN') {
      setRoleNotice(`Ordering is restricted to Customer (Buyer) accounts. You are signed in as ${user.role}.`);
      setTimeout(() => setRoleNotice(null), 4000);
      return;
    }

    // Add product to cart and open checkout drawer immediately
    addToCart(prod, 1);
    setIsCartDrawerOpen(true);
  };

  const categories = useMemo(
    () => [
      { id: 'all', name: 'All Harvests' },
      { id: 'vegetables', name: 'Vegetables' },
      { id: 'fruits', name: 'Fruits' },
      { id: 'grains-cereals', name: 'Grains & Cereals' },
      { id: 'coffee-spices', name: 'Coffee & Spices' },
      { id: 'seeds-inputs', name: 'Seeds & Inputs' },
    ],
    []
  );

  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#0B1512] text-[#252B26] dark:text-[#E8F7EE] flex flex-col font-sans transition-colors duration-200">
      {/* 1. Global Navigation Header */}
      <Header
        currentLocation={currentLocation}
        onOpenCart={() => setIsCartDrawerOpen(true)}
      />

      {/* Spacer for fixed header */}
      <div className="h-16 sm:h-20 shrink-0" aria-hidden="true" />

      {/* Toast Notification */}
      {addedNotice && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#143D2D] dark:bg-[#10B981] text-white px-4 py-3 rounded-2xl shadow-xl text-xs sm:text-sm font-semibold flex items-center gap-2.5 animate-bounce">
          <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
          </div>
          <span>Added {addedNotice} to your cart</span>
        </div>
      )}

      {/* Role Notice Alert */}
      {roleNotice && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-amber-600 text-white px-5 py-3 rounded-2xl shadow-xl text-xs sm:text-sm font-semibold flex items-center gap-2">
          <span>{roleNotice}</span>
        </div>
      )}

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Page Hero Banner */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8F5E9] dark:bg-[#163327] text-[#2E7D32] dark:text-[#34D399] text-xs font-semibold tracking-wide mb-3 border border-emerald-200/50 dark:border-emerald-800/40">
            <Sparkles className="w-3.5 h-3.5 text-[#2E7D32] dark:text-[#34D399]" />
            <span>Direct Farm Catalog</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-[#11382B] dark:text-[#E8F7EE] tracking-tight">
            Fresh &amp; Direct Harvests
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-[#4A675B] dark:text-[#88A89A] max-w-2xl">
            Browse active harvests directly from verified Ethiopian family farmers. Unauthenticated visitors can freely explore produce, compare farm prices, and review seller profiles.
          </p>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white dark:bg-[#11221C] rounded-2xl border border-[#E2EAE5] dark:border-[#1E3A2F] p-4 sm:p-5 mb-8 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#638275] dark:text-[#7A9C8D] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products by crop, farmer name, or description..."
                className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border border-[#E5EDE4] dark:border-[#1E3A2F] bg-[#FAF8F5] dark:bg-[#0B1512] text-[#252B26] dark:text-[#F3FAF6] focus:outline-none focus:ring-2 focus:ring-[#2E7D32] transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#638275] hover:text-[#11382B] dark:hover:text-[#F3FAF6]"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 shrink-0">
              <ArrowUpDown className="w-4 h-4 text-[#638275] dark:text-[#7A9C8D]" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                aria-label="Sort harvests by"
                className="py-2.5 px-3 text-xs sm:text-sm rounded-xl border border-[#E5EDE4] dark:border-[#1E3A2F] bg-[#FAF8F5] dark:bg-[#0B1512] text-[#252B26] dark:text-[#F3FAF6] focus:outline-none focus:ring-2 focus:ring-[#2E7D32] cursor-pointer"
              >
                <option value="distance">Nearest First</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => {
              const active = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    active
                      ? 'bg-[#2E7D32] text-white shadow-xs'
                      : 'bg-[#FAF8F5] dark:bg-[#0B1512] text-[#4A675B] dark:text-[#88A89A] hover:bg-[#EAE6DF] dark:hover:bg-[#1A3329] border border-[#E5EDE4] dark:border-[#1E3A2F]'
                  }`}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Results Counter */}
        <div className="flex items-center justify-between text-xs text-[#638275] dark:text-[#7A9C8D] mb-4">
          <span>
            Showing <strong className="font-semibold text-[#11382B] dark:text-[#EDF7F1]">{products.length}</strong> available farm harvests
          </span>
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#2E7D32] dark:text-[#34D399]" />
            Direct from Ethiopian farmers
          </span>
        </div>

        {/* Products Grid */}
        {products.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-[#11221C] rounded-2xl border border-[#E2EAE5] dark:border-[#1E3A2F] space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#E8F5E9] dark:bg-[#163327] text-[#2E7D32] dark:text-[#34D399] flex items-center justify-center mx-auto">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-[#11382B] dark:text-[#EDF7F1] text-base">
              No matching produce found
            </h3>
            <p className="text-xs text-[#638275] dark:text-[#7A9C8D] max-w-sm mx-auto">
              We couldn&apos;t find any active listings matching your filters. Try clearing your search or selecting a different category.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setSortBy('distance');
              }}
              className="mt-2 px-4 py-2 bg-[#2E7D32] text-white text-xs font-semibold rounded-xl hover:bg-[#1B5E20] transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {products.map((item) => (
              <div
                key={item.id}
                onClick={() => router.push(`/products/${item.id}`)}
                className="group bg-white dark:bg-[#11221C] rounded-2xl overflow-hidden border border-[#E2EAE5] dark:border-[#1E3A2F] hover:border-[#2E7D32]/50 dark:hover:border-[#34D399]/50 hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col justify-between"
              >
                <div>
                  {/* Image Container */}
                  <div className="relative w-full h-48 bg-slate-100 dark:bg-slate-900 overflow-hidden">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    <div className="absolute top-3 left-3 bg-[#11382B]/85 text-white backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider">
                      {item.categoryName}
                    </div>
                    {item.qualityGrade && (
                      <div className="absolute top-3 right-3 bg-amber-500 text-white px-2 py-0.5 rounded-md text-[10px] font-bold">
                        Grade {item.qualityGrade}
                      </div>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="p-4 space-y-2">
                    <h3 className="font-bold text-base text-[#11382B] dark:text-[#EDF7F1] group-hover:text-[#2E7D32] dark:group-hover:text-[#34D399] transition-colors line-clamp-1">
                      {item.name}
                    </h3>

                    {/* Farmer link */}
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/farmers/${item.farmerId}`);
                      }}
                      className="flex items-center gap-1.5 text-xs text-[#2E7D32] dark:text-[#34D399] hover:underline cursor-pointer"
                    >
                      <Tractor className="w-3.5 h-3.5 shrink-0" />
                      <span className="font-medium truncate">{item.farmName}</span>
                    </div>

                    <p className="text-xs text-[#638275] dark:text-[#7A9C8D] line-clamp-2">
                      {item.description}
                    </p>

                    {/* Price & Stock */}
                    <div className="pt-2 border-t border-[#F0F5F2] dark:border-[#1E3A2F] flex items-baseline justify-between">
                      <div>
                        <span className="text-lg font-extrabold text-[#11382B] dark:text-[#F3FAF6]">
                          ETB {item.pricePerUnit}
                        </span>
                        <span className="text-xs text-[#638275] dark:text-[#7A9C8D]"> / {item.unit}</span>
                      </div>
                      <div className="text-[11px] text-[#638275] dark:text-[#7A9C8D]">
                        Stock: <span className="font-semibold text-[#11382B] dark:text-[#EDF7F1]">{item.stockQuantity} {item.unit}</span>
                      </div>
                    </div>

                    {/* Distance & Rating */}
                    <div className="flex items-center justify-between text-xs text-[#638275] dark:text-[#7A9C8D] pt-1">
                      <div className="flex items-center gap-1 truncate">
                        <MapPin className="w-3.5 h-3.5 text-[#2E7D32] dark:text-[#34D399] shrink-0" />
                        <span>{item.distanceDisplay}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[#2E7D32] dark:text-[#34D399] font-semibold">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>{item.rating}</span>
                        <span className="text-[#89A398] dark:text-[#5F8372] font-normal">({item.reviewsCount})</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Purchase Action Buttons */}
                <div className="p-4 pt-0 grid grid-cols-2 gap-2 mt-2">
                  <button
                    type="button"
                    onClick={(e) => handleAddToCart(item, e)}
                    className="w-full py-2 px-3 rounded-xl border border-[#2E7D32] dark:border-[#34D399] text-[#2E7D32] dark:text-[#34D399] hover:bg-[#E8F5E9] dark:hover:bg-[#163327] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Add to Cart</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => handleBuyNow(item, e)}
                    className="w-full py-2 px-3 rounded-xl bg-[#2E7D32] hover:bg-[#1B5E20] dark:bg-[#10B981] dark:hover:bg-[#059669] text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5 fill-current" />
                    <span>Buy Now</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
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

      {/* 4. Auth Required Modal for Guests on Purchase Actions */}
      <AuthRequiredModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        redirectUrl={authRedirectUrl}
      />
    </div>
  );
}

