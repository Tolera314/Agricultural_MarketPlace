'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  MapPin,
  Star,
  ShieldCheck,
  Tractor,
  ShoppingBag,
  Zap,
  CheckCircle2,
  Calendar,
  Leaf,
  Loader2,
  AlertCircle,
  ChevronRight,
  MessageSquare,
} from 'lucide-react';
import { Header, Footer } from '@/components/layout';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { AuthRequiredModal } from '@/components/auth/AuthRequiredModal';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { buyerApi } from '@/lib/buyerApi';
import { SUPPORTED_LOCATIONS } from '@/data/marketplaceData';
import { Product } from '@/types';
import { FarmerProfileSkeleton } from '@/components/ui/Skeleton';

export default function FarmerProfilePage() {
  const params = useParams();
  const router = useRouter();
  const farmerId = (params?.id as string) || '';

  const { user, isAuthenticated } = useAuth();
  const { addToCart, isCartDrawerOpen, setIsCartDrawerOpen, cart, updateQuantity, removeItem, clearCart } = useCart();

  const [currentLocation] = useState(SUPPORTED_LOCATIONS[0]);
  const [farmerData, setFarmerData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [addedNotice, setAddedNotice] = useState<string | null>(null);

  // Authentication Required Modal for Guests on Purchase & Message Actions
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authRedirectUrl, setAuthRedirectUrl] = useState<string>(`/farmers/${farmerId}`);
  const [roleNotice, setRoleNotice] = useState<string | null>(null);

  const handleTalkWithFarmer = () => {
    if (!isAuthenticated || !user) {
      setAuthRedirectUrl(`/dashboard/buyer?tab=messages&farmerId=${farmerId}`);
      setShowAuthModal(true);
      return;
    }
    router.push(`/dashboard/buyer?tab=messages&farmerId=${farmerId}`);
  };

  useEffect(() => {
    let isMounted = true;
    async function fetchFarmer() {
      if (!farmerId) return;
      setIsLoading(true);
      try {
        const res = await buyerApi.getFarmerProfile(farmerId);
        if (isMounted && res?.data) {
          setFarmerData(res.data);
        } else {
          throw new Error('Farmer not found');
        }
      } catch (err) {
        console.warn('API fetch failed, falling back to local farmer data:', err);
        const fallback = {
          id: farmerId,
          name: farmerId.includes('mekannen')
            ? 'Mekannen Girma'
            : farmerId.includes('heran')
            ? 'Selamawit Bekele'
            : farmerId.includes('awash')
            ? 'Awash Valley Coop'
            : 'Abebe Tadesse',
          farmName: farmerId.includes('mekannen')
            ? 'Girma Family Farms'
            : farmerId.includes('heran')
            ? 'Selamawit Bekele Greenhouse'
            : farmerId.includes('awash')
            ? 'Awash Valley Farmers Union'
            : 'Abebe Tadesse Farm',
          locationName: farmerId.includes('awash') ? 'Awash / Oromia' : 'Addis Ababa',
          distanceKm: 1.2,
          distanceDisplay: '1.2 km',
          rating: 4.8,
          reviewsCount: 124,
          bio: 'Third generation family farm dedicated to sustainable highland vegetables, certified organic compost cultivation, and direct farm fresh deliveries without broker markups.',
          avatarUrl: farmerId.includes('mekannen')
            ? '/images/avatar_mekonnen_hd.jpg'
            : farmerId.includes('heran')
            ? '/images/avatar_selamawit_hd.jpg'
            : '/images/avatar_abebe_hd.jpg',
          products: [
            {
              id: 'prod-tomatoes-1',
              name: 'Vine-Ripened Organic Tomatoes',
              description: 'Fresh highland tomatoes harvested daily, rich in natural flavor.',
              pricePerUnit: 60,
              unit: 'kg',
              stockQuantity: 250,
              distanceKm: 1.2,
              rating: 4.8,
              reviewsCount: 124,
              imageUrl: '/images/prod_tomatoes.jpg',
            },
            {
              id: 'prod-greenbeans-1',
              name: 'Tender French Green Beans',
              description: 'Crisp green beans hand-picked before sunrise.',
              pricePerUnit: 80,
              unit: 'kg',
              stockQuantity: 120,
              distanceKm: 1.2,
              rating: 4.9,
              reviewsCount: 45,
              imageUrl: '/images/prod_green_beans.jpg',
            },
          ],
        };
        if (isMounted) setFarmerData(fallback);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchFarmer();
    return () => {
      isMounted = false;
    };
  }, [farmerId]);

  const toProduct = (item: any): Product => ({
    id: item.id,
    name: item.name || item.cropName,
    category: 'vegetables',
    farmerId: farmerData?.id || farmerId,
    farmerName: farmerData?.name || 'Local Farmer',
    farmName: farmerData?.farmName || 'Family Farm',
    farmerLocation: `${farmerData?.distanceDisplay || '2.5 km'} away`,
    price: item.pricePerUnit || item.price || 60,
    unit: item.unit || 'kg',
    availableQty: item.stockQuantity || 100,
    minimumOrder: 1,
    harvestDate: 'Fresh Morning Harvest',
    cultivationMethod: 'Certified Organic',
    originCity: farmerData?.locationName || 'Addis Ababa',
    isIntercityEligible: true,
    image: item.imageUrl || (item.images && item.images[0]?.url) || '/images/prod_tomatoes.jpg',
    description: item.description || '',
    storageNotes: 'Keep in ventilated produce crate.',
  });

  const handleAddToCart = (item: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const prod = toProduct(item);
    addToCart(prod, 1);
    setAddedNotice(prod.name);
    setTimeout(() => setAddedNotice(null), 2500);
  };

  const handleBuyNow = (item: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const prod = toProduct(item);

    // Guest check
    if (!isAuthenticated || !user) {
      setAuthRedirectUrl(`/dashboard/buyer?buyNow=${item.id}`);
      setShowAuthModal(true);
      return;
    }

    // Role check
    if (user.role !== 'BUYER' && user.role !== 'ADMIN' && user.role !== 'SUPERADMIN') {
      setRoleNotice(`Ordering is restricted to Customer (Buyer) accounts. You are signed in as ${user.role}.`);
      setTimeout(() => setRoleNotice(null), 4000);
      return;
    }

    addToCart(prod, 1);
    setIsCartDrawerOpen(true);
  };

  if (isLoading) {
    return <FarmerProfileSkeleton />;
  }

  if (!farmerData) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#0B1512] flex flex-col justify-between">
        <Header currentLocation={currentLocation} />
        <div className="flex-1 max-w-xl mx-auto px-4 py-20 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-[#11382B] dark:text-[#EDF7F1]">Farmer Not Found</h2>
          <p className="text-xs text-[#638275] dark:text-[#7A9C8D]">
            The requested farmer profile is not currently active in our verified grower registry.
          </p>
          <Link
            href="/farmers"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2E7D32] text-white text-xs font-semibold hover:bg-[#1B5E20] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Browse Farmers</span>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#0B1512] text-[#252B26] dark:text-[#E8F7EE] flex flex-col font-sans transition-colors duration-200">
      {/* 1. Header */}
      <Header
        currentLocation={currentLocation}
        onOpenCart={() => setIsCartDrawerOpen(true)}
      />

      <div className="h-16 sm:h-20 shrink-0" aria-hidden="true" />

      {/* Added Toast */}
      {addedNotice && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#143D2D] dark:bg-[#10B981] text-white px-4 py-3 rounded-2xl shadow-xl text-xs sm:text-sm font-semibold flex items-center gap-2.5 animate-bounce">
          <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5 text-white stroke-[3]" />
          </div>
          <span>Added {addedNotice} to your cart</span>
        </div>
      )}

      {/* Role Notice */}
      {roleNotice && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-amber-600 text-white px-5 py-3 rounded-2xl shadow-xl text-xs sm:text-sm font-semibold flex items-center gap-2">
          <span>{roleNotice}</span>
        </div>
      )}

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs text-[#638275] dark:text-[#7A9C8D] mb-6">
          <Link href="/" className="hover:text-[#11382B] dark:hover:text-[#EDF7F1]">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href="/farmers" className="hover:text-[#11382B] dark:hover:text-[#EDF7F1]">
            Farmers
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="font-semibold text-[#11382B] dark:text-[#EDF7F1]">
            {farmerData.farmName}
          </span>
        </nav>

        {/* Farmer Header Hero Card */}
        <div className="bg-white dark:bg-[#11221C] rounded-3xl border border-[#E2EAE5] dark:border-[#1E3A2F] p-6 sm:p-8 mb-10 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <UserAvatar
              src={farmerData.avatarUrl}
              name={farmerData.name}
              size="xl"
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl shrink-0"
            />
            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-[#11382B] dark:text-[#EDF7F1] tracking-tight">
                    {farmerData.farmName}
                  </h1>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#2E7D32] dark:text-[#34D399] bg-[#E8F5E9] dark:bg-[#163327] px-2.5 py-1 rounded-full border border-emerald-200/50">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Verified Ethiopian Grower
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleTalkWithFarmer}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#059669] hover:bg-[#047857] text-white font-bold text-xs shadow-sm transition-all cursor-pointer shrink-0"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Talk with Farmer</span>
                </button>
              </div>

              <p className="text-xs sm:text-sm text-[#4A675B] dark:text-[#88A89A]">
                Managed by <strong className="text-[#11382B] dark:text-[#EDF7F1]">{farmerData.name}</strong> • Highland Sustainable Agriculture
              </p>

              <div className="flex flex-wrap items-center gap-4 text-xs text-[#638275] dark:text-[#7A9C8D] pt-1">
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-[#2E7D32] dark:text-[#34D399]" />
                  <span>{farmerData.distanceDisplay}</span>
                  <span>•</span>
                  <span>{farmerData.locationName}</span>
                </div>
                <div className="flex items-center gap-1 text-[#2E7D32] dark:text-[#34D399] font-bold">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span>{farmerData.rating}</span>
                  <span className="text-[#89A398] dark:text-[#5F8372] font-normal">
                    ({farmerData.reviewsCount} customer reviews)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bio / Description */}
          {farmerData.bio && (
            <div className="mt-6 pt-6 border-t border-[#F0F5F2] dark:border-[#1E3A2F]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#638275] dark:text-[#7A9C8D] mb-1.5">
                About this Farm
              </h3>
              <p className="text-xs sm:text-sm text-[#4A675B] dark:text-[#88A89A] leading-relaxed max-w-3xl">
                {farmerData.bio}
              </p>
            </div>
          )}
        </div>

        {/* Section: Active Harvests from this Farmer */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#11382B] dark:text-[#EDF7F1]">
              Active Harvests from {farmerData.farmName}
            </h2>
            <p className="text-xs text-[#638275] dark:text-[#7A9C8D] mt-1">
              Fresh produce available for direct order and local cold courier delivery.
            </p>
          </div>
        </div>

        {/* Product Cards Grid */}
        {farmerData.products && farmerData.products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {farmerData.products.map((item: any) => (
              <div
                key={item.id}
                onClick={() => router.push(`/products/${item.id}`)}
                className="group bg-white dark:bg-[#11221C] rounded-2xl overflow-hidden border border-[#E2EAE5] dark:border-[#1E3A2F] hover:border-[#2E7D32]/50 dark:hover:border-[#34D399]/50 hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="relative w-full h-44 bg-slate-100 dark:bg-slate-900 overflow-hidden">
                    <img
                      src={item.imageUrl || (item.images && item.images[0]?.url) || '/images/prod_tomatoes.jpg'}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>

                  <div className="p-4 space-y-2">
                    <h3 className="font-bold text-base text-[#11382B] dark:text-[#EDF7F1] group-hover:text-[#2E7D32] dark:group-hover:text-[#34D399] transition-colors line-clamp-1">
                      {item.name}
                    </h3>
                    <p className="text-xs text-[#638275] dark:text-[#7A9C8D] line-clamp-2">
                      {item.description}
                    </p>

                    <div className="pt-2 border-t border-[#F0F5F2] dark:border-[#1E3A2F] flex items-baseline justify-between">
                      <span className="text-lg font-extrabold text-[#11382B] dark:text-[#F3FAF6]">
                        ETB {item.pricePerUnit} <span className="text-xs font-normal text-[#638275]">/ {item.unit}</span>
                      </span>
                      <span className="text-xs text-[#638275] dark:text-[#7A9C8D]">
                        Stock: {item.stockQuantity} {item.unit}
                      </span>
                    </div>
                  </div>
                </div>

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
        ) : (
          <div className="text-center py-12 bg-white dark:bg-[#11221C] rounded-2xl border border-[#E2EAE5] dark:border-[#1E3A2F] text-xs text-[#638275]">
            No active listings currently available from this farm.
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

