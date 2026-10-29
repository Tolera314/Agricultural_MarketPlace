'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  MapPin,
  Star,
  ShoppingBag,
  Zap,
  ShieldCheck,
  Tractor,
  Truck,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronRight,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Header, Footer } from '@/components/layout';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { AuthRequiredModal } from '@/components/auth/AuthRequiredModal';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { buyerApi } from '@/lib/buyerApi';
import { SUPPORTED_LOCATIONS } from '@/data/marketplaceData';
import { Product } from '@/types';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = (params?.id as string) || '';

  const { user, isAuthenticated } = useAuth();
  const { addToCart, isCartDrawerOpen, setIsCartDrawerOpen, cart, updateQuantity, removeItem, clearCart } = useCart();

  const [currentLocation] = useState(SUPPORTED_LOCATIONS[0]);
  const [productData, setProductData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [addedNotice, setAddedNotice] = useState<string | null>(null);

  // Authentication Required Modal for Guests on Purchase Actions
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authRedirectUrl, setAuthRedirectUrl] = useState<string>(`/products/${productId}`);
  const [roleNotice, setRoleNotice] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchDetails() {
      if (!productId) return;
      setIsLoading(true);
      setError(null);
      try {
        const res = await buyerApi.getProductDetails(productId);
        if (isMounted && res?.data) {
          setProductData(res.data);
        } else {
          throw new Error('Product not found');
        }
      } catch (err: any) {
        console.warn('API fetch failed, falling back to local listing data:', err);
        // Fallback for offline/demo resilience
        const fallback = {
          id: productId,
          name: productId.includes('coffee')
            ? 'Single-Origin Yirgacheffe Washed Coffee'
            : productId.includes('potatoes')
            ? 'Highland Yellow Potatoes'
            : productId.includes('lettuce')
            ? 'Crisp Hydroponic Romaine Lettuce'
            : productId.includes('maize')
            ? 'White Maize Grain'
            : productId.includes('greenbeans')
            ? 'Tender French Green Beans'
            : 'Vine-Ripened Organic Red Tomatoes',
          cropName: 'Tomatoes',
          categoryName: 'Vegetables',
          description:
            'Hand-selected and harvested at peak morning freshness from pesticide-free highland fields. Kept in well-ventilated farm storage for maximum crispness and shelf life.',
          pricePerUnit: 60,
          unit: 'kg',
          stockQuantity: 250,
          minOrderQty: 1,
          qualityGrade: 'A',
          originCity: 'Debre Zeit',
          distanceKm: 1.2,
          distanceDisplay: '1.2 km',
          rating: 4.8,
          reviewsCount: 124,
          imageUrl: productId.includes('coffee')
            ? '/images/prod_coffee.jpg'
            : productId.includes('potatoes')
            ? '/images/prod_potatoes.jpg'
            : productId.includes('lettuce')
            ? '/images/prod_lettuce.jpg'
            : productId.includes('maize')
            ? '/images/prod_maize.jpg'
            : productId.includes('greenbeans')
            ? '/images/prod_green_beans.jpg'
            : '/images/prod_tomatoes.jpg',
          farmer: {
            id: 'farmer-abebe-uuid',
            name: 'Abebe Tadesse',
            farmName: 'Abebe Tadesse Farm',
            locationName: 'Addis Ababa',
            avatarUrl: '/images/avatar_abebe_hd.jpg',
            rating: 4.8,
            reviewsCount: 124,
            distanceKm: 1.2,
          },
          otherProductsFromFarmer: [
            {
              id: 'prod-onions-1',
              name: 'Red Onions',
              pricePerUnit: 75,
              unit: 'kg',
              distanceKm: 1.2,
              imageUrl: '/images/prod_tomatoes.jpg',
            },
            {
              id: 'prod-greenbeans-1',
              name: 'Tender Green Beans',
              pricePerUnit: 80,
              unit: 'kg',
              distanceKm: 1.2,
              imageUrl: '/images/prod_green_beans.jpg',
            },
          ],
        };
        if (isMounted) setProductData(fallback);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchDetails();
    return () => {
      isMounted = false;
    };
  }, [productId]);

  const toProduct = (): Product => {
    if (!productData) {
      return {
        id: productId,
        name: 'Farm Harvest',
        category: 'vegetables',
        farmerId: 'farmer-1',
        farmerName: 'Local Farmer',
        farmName: 'Family Farm',
        farmerLocation: '1.2 km away',
        price: 60,
        unit: 'kg',
        availableQty: 100,
        minimumOrder: 1,
        harvestDate: 'Fresh Today',
        cultivationMethod: 'Certified Organic',
        originCity: 'Addis Ababa',
        isIntercityEligible: true,
        image: '/images/prod_tomatoes.jpg',
        description: '',
        storageNotes: '',
      };
    }

    return {
      id: productData.id,
      name: productData.name || productData.cropName || 'Fresh Harvest',
      category: 'vegetables',
      farmerId: productData.farmer?.id || productData.farmerId || 'farmer-1',
      farmerName: productData.farmer?.name || productData.farmerName || 'Local Farmer',
      farmName: productData.farmer?.farmName || productData.farmName || 'Family Farm',
      farmerLocation: `${productData.distanceDisplay || '2.5 km'} away`,
      price: productData.pricePerUnit || productData.price || 60,
      unit: productData.unit || 'kg',
      availableQty: productData.stockQuantity || 100,
      minimumOrder: productData.minOrderQty || 1,
      harvestDate: 'Fresh Morning Harvest',
      cultivationMethod: 'Certified Organic',
      originCity: productData.originCity || 'Addis Ababa',
      isIntercityEligible: true,
      image:
        productData.imageUrl ||
        (productData.images && productData.images[0]?.url) ||
        '/images/prod_tomatoes.jpg',
      description: productData.description || '',
      storageNotes: 'Keep in cool, ventilated container.',
    };
  };

  const handleAddToCart = () => {
    const prod = toProduct();
    addToCart(prod, quantity);
    setAddedNotice(`${prod.name} (${quantity} ${prod.unit})`);
    setTimeout(() => setAddedNotice(null), 2500);
  };

  const handleBuyNow = () => {
    const prod = toProduct();

    // Guest check: trigger auth flow and preserve target product
    if (!isAuthenticated || !user) {
      setAuthRedirectUrl(`/dashboard/buyer?buyNow=${productId}`);
      setShowAuthModal(true);
      return;
    }

    // Role check: Only buyers can complete purchases
    if (user.role !== 'BUYER' && user.role !== 'ADMIN' && user.role !== 'SUPERADMIN') {
      setRoleNotice(`Direct purchasing is restricted to Customer (Buyer) accounts. You are signed in as ${user.role}.`);
      setTimeout(() => setRoleNotice(null), 4000);
      return;
    }

    // Authenticated buyer: add to cart and launch checkout
    addToCart(prod, quantity);
    setIsCartDrawerOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#0B1512] flex flex-col justify-between">
        <Header currentLocation={currentLocation} />
        <div className="flex-1 flex items-center justify-center py-24">
          <div className="text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#2E7D32] dark:text-[#34D399] mx-auto" />
            <p className="text-xs text-[#638275] dark:text-[#7A9C8D]">Loading fresh harvest details...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!productData) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#0B1512] flex flex-col justify-between">
        <Header currentLocation={currentLocation} />
        <div className="flex-1 max-w-xl mx-auto px-4 py-20 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-[#11382B] dark:text-[#EDF7F1]">Harvest Not Available</h2>
          <p className="text-xs text-[#638275] dark:text-[#7A9C8D]">
            This product listing may have ended or been fully harvested. Return to the direct marketplace catalog to discover other available produce.
          </p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2E7D32] text-white text-xs font-semibold hover:bg-[#1B5E20] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Browse Products</span>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const primaryImage =
    productData.imageUrl ||
    (productData.images && productData.images[0]?.url) ||
    '/images/prod_tomatoes.jpg';

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
          <Link href="/products" className="hover:text-[#11382B] dark:hover:text-[#EDF7F1]">
            Products
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="font-semibold text-[#11382B] dark:text-[#EDF7F1] truncate max-w-xs">
            {productData.name}
          </span>
        </nav>

        {/* Product Detail Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Left Column: Product Photo & Badges */}
          <div className="lg:col-span-6 space-y-4">
            <div className="relative rounded-3xl overflow-hidden bg-slate-100 dark:bg-slate-900 border border-[#E2EAE5] dark:border-[#1E3A2F] shadow-sm aspect-4/3 sm:aspect-16/11">
              <img
                src={primaryImage}
                alt={productData.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 left-4 bg-[#11382B]/85 text-white backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
                {productData.categoryName || 'Agricultural Produce'}
              </div>
              {productData.qualityGrade && (
                <div className="absolute top-4 right-4 bg-amber-500 text-white px-3 py-1 rounded-lg text-xs font-bold shadow-xs">
                  Quality Grade {productData.qualityGrade}
                </div>
              )}
            </div>

            {/* Farm Gate Guarantee Card */}
            <div className="p-4 rounded-2xl bg-[#E8F5E9]/60 dark:bg-[#163327]/60 border border-[#C8E6C9] dark:border-[#1E4D38] flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-[#2E7D32] dark:text-[#34D399] shrink-0" />
              <div className="text-xs">
                <div className="font-bold text-[#11382B] dark:text-[#EDF7F1]">
                  100% Farm-Gate Price Model
                </div>
                <div className="text-[#4A675B] dark:text-[#88A89A]">
                  Directly sourced with zero broker markups. 100% of the produce price goes straight to the farmer.
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Pricing, Farmer Profile & Purchase Actions */}
          <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#11382B] dark:text-[#EDF7F1] tracking-tight">
                  {productData.name}
                </h1>
                <div className="flex items-center gap-3 mt-2 text-xs text-[#638275] dark:text-[#7A9C8D]">
                  <div className="flex items-center gap-1 text-[#2E7D32] dark:text-[#34D399] font-bold">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span>{productData.rating}</span>
                    <span className="text-[#89A398] dark:text-[#5F8372] font-normal">
                      ({productData.reviewsCount} verified reviews)
                    </span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#2E7D32] dark:text-[#34D399]" />
                    <span>{productData.distanceDisplay}</span>
                  </div>
                </div>
              </div>

              {/* Price Banner */}
              <div className="p-4 rounded-2xl bg-white dark:bg-[#11221C] border border-[#E2EAE5] dark:border-[#1E3A2F] flex items-baseline justify-between">
                <div>
                  <span className="text-3xl font-extrabold text-[#11382B] dark:text-[#F3FAF6]">
                    ETB {productData.pricePerUnit}
                  </span>
                  <span className="text-sm text-[#638275] dark:text-[#7A9C8D]"> / {productData.unit}</span>
                </div>
                <div className="text-xs text-right">
                  <div className="text-[#638275] dark:text-[#7A9C8D]">Available in stock:</div>
                  <div className="font-bold text-[#11382B] dark:text-[#EDF7F1]">
                    {productData.stockQuantity} {productData.unit}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#638275] dark:text-[#7A9C8D] mb-1.5">
                  Produce Description
                </h3>
                <p className="text-xs sm:text-sm text-[#4A675B] dark:text-[#88A89A] leading-relaxed">
                  {productData.description}
                </p>
              </div>

              {/* Farmer Summary Card */}
              {productData.farmer && (
                <div className="p-4 rounded-2xl bg-white dark:bg-[#11221C] border border-[#E2EAE5] dark:border-[#1E3A2F] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={productData.farmer.avatarUrl || '/images/avatar_abebe_hd.jpg'}
                      alt={productData.farmer.name}
                      className="w-12 h-12 rounded-full object-cover border border-[#E5EDE4] dark:border-[#1E3A2F]"
                    />
                    <div>
                      <div className="text-xs text-[#638275] dark:text-[#7A9C8D]">Grown By</div>
                      <div className="font-bold text-sm text-[#11382B] dark:text-[#EDF7F1]">
                        {productData.farmer.name}
                      </div>
                      <div className="text-xs text-[#2E7D32] dark:text-[#34D399]">
                        {productData.farmer.farmName} • {productData.farmer.locationName}
                      </div>
                    </div>
                  </div>

                  <Link
                    href={`/farmers/${productData.farmer.id}`}
                    className="px-3.5 py-1.5 rounded-xl border border-[#2E7D32] dark:border-[#34D399] text-[#2E7D32] dark:text-[#34D399] text-xs font-semibold hover:bg-[#E8F5E9] dark:hover:bg-[#163327] transition-colors"
                  >
                    View Farmer
                  </Link>
                </div>
              )}
            </div>

            {/* Quantity Selector & Purchase Actions */}
            <div className="space-y-4 pt-4 border-t border-[#E5EDE4] dark:border-[#1E3A2F]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#11382B] dark:text-[#EDF7F1]">Quantity ({productData.unit})</span>
                <div className="flex items-center border border-[#E5EDE4] dark:border-[#1E3A2F] rounded-xl bg-white dark:bg-[#11221C]">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="px-3 py-1.5 text-sm font-bold text-[#11382B] dark:text-[#EDF7F1] hover:bg-[#FAF8F5] dark:hover:bg-[#162D24] rounded-l-xl cursor-pointer"
                  >
                    -
                  </button>
                  <span className="px-4 py-1.5 text-xs font-bold text-[#11382B] dark:text-[#EDF7F1]">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(productData.stockQuantity || 999, q + 1))}
                    className="px-3 py-1.5 text-sm font-bold text-[#11382B] dark:text-[#EDF7F1] hover:bg-[#FAF8F5] dark:hover:bg-[#162D24] rounded-r-xl cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Purchase Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="py-3 px-4 rounded-xl border border-[#2E7D32] dark:border-[#34D399] text-[#2E7D32] dark:text-[#34D399] hover:bg-[#E8F5E9] dark:hover:bg-[#163327] text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Add to Bag</span>
                </button>

                <button
                  type="button"
                  onClick={handleBuyNow}
                  className="py-3 px-4 rounded-xl bg-[#2E7D32] hover:bg-[#1B5E20] dark:bg-[#10B981] dark:hover:bg-[#059669] text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
                >
                  <Zap className="w-4 h-4 fill-current" />
                  <span>Buy Now</span>
                </button>
              </div>

              {/* Guest Information Note */}
              {!isAuthenticated && (
                <p className="text-[11px] text-center text-[#638275] dark:text-[#7A9C8D]">
                  Unauthenticated visitors can browse freely. You will be prompted to sign in when you complete an order.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Other Harvests from this Farmer */}
        {productData.otherProductsFromFarmer && productData.otherProductsFromFarmer.length > 0 && (
          <div className="mt-16 pt-10 border-t border-[#E5EDE4] dark:border-[#1E3A2F]">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-[#11382B] dark:text-[#EDF7F1]">
                  Other Harvests from this Farmer
                </h2>
                <p className="text-xs text-[#638275] dark:text-[#7A9C8D] mt-0.5">
                  Combine produce from {productData.farmer?.farmName} into one direct local shipment.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {productData.otherProductsFromFarmer.map((item: any) => (
                <div
                  key={item.id}
                  onClick={() => router.push(`/products/${item.id}`)}
                  className="group bg-white dark:bg-[#11221C] rounded-2xl overflow-hidden border border-[#E2EAE5] dark:border-[#1E3A2F] hover:shadow-md transition-all cursor-pointer p-3 flex flex-col justify-between"
                >
                  <div>
                    <div className="w-full h-28 bg-slate-100 dark:bg-slate-900 rounded-xl overflow-hidden mb-2">
                      <img
                        src={item.imageUrl || (item.images && item.images[0]?.url) || '/images/prod_tomatoes.jpg'}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <h4 className="font-bold text-xs text-[#11382B] dark:text-[#EDF7F1] line-clamp-1 group-hover:text-[#2E7D32] dark:group-hover:text-[#34D399]">
                      {item.name}
                    </h4>
                    <div className="text-xs font-extrabold text-[#11382B] dark:text-[#F3FAF6] mt-1">
                      ETB {item.pricePerUnit} <span className="font-normal text-[10px] text-[#638275]">/ {item.unit || 'kg'}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/products/${item.id}`);
                    }}
                    className="mt-3 w-full py-1.5 text-[11px] font-semibold text-[#2E7D32] dark:text-[#34D399] bg-[#E8F5E9] dark:bg-[#163327] rounded-lg hover:bg-[#C8E6C9] transition-colors"
                  >
                    View Harvest
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* 2. Footer */}
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

