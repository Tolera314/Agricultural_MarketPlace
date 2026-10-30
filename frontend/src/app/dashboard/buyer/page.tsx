'use client';

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useParams, usePathname, useSearchParams } from 'next/navigation';
import {
  LayoutDashboard,
  Search,
  Package,
  Store,
  Heart,
  MapPin,
  MessageSquare,
  User,
  Settings,
  HelpCircle,
  Bell,
  ChevronDown,
  ShoppingBag,
  Star,
  Clock,
  Truck,
  CheckCircle2,
  AlertCircle,
  Plus,
  Minus,
  Trash2,
  X,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Send,
  Phone,
  RefreshCw,
  LogOut,
  SlidersHorizontal,
  Compass,
  Check,
  Building,
  ChevronRight,
  Menu,
} from 'lucide-react';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { buyerApi } from '@/lib/buyerApi';
import { getCachedUserProfile, logout } from '@/lib/auth';
import { useAuth } from '@/context/AuthContext';
import { BuyerBottomNav } from '@/components/layout/MobileBottomNav';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { DashboardScreenSkeleton } from '@/components/ui/Skeleton';

const BUYER_NAV_ITEMS = [
  { id: 'dashboard', label: 'Overview', href: '/dashboard/buyer', icon: LayoutDashboard },
  { id: 'products', label: 'Browse Products', href: '/dashboard/buyer/products', icon: Search },
  { id: 'orders', label: 'My Orders', href: '/dashboard/buyer/orders', icon: Package },
  { id: 'farmers', label: 'Saved Farmers', href: '/dashboard/buyer/farmers', icon: Store },
  { id: 'favorites', label: 'Favorites', href: '/dashboard/buyer/favorites', icon: Heart },
  { id: 'addresses', label: 'Delivery Addresses', href: '/dashboard/buyer/addresses', icon: MapPin },
  { id: 'messages', label: 'Messages', href: '/dashboard/buyer/messages', icon: MessageSquare },
  { id: 'profile', label: 'Profile', href: '/dashboard/buyer/profile', icon: User },
  { id: 'settings', label: 'Settings', href: '/dashboard/buyer/settings', icon: Settings },
] as const;

// ─── Interfaces ───────────────────────────────────────────────

interface CartItem {
  listingId: string;
  name: string;
  pricePerUnit: number;
  unit: string;
  quantity: number;
  farmerName: string;
  imageUrl: string;
}

interface Address {
  id: string;
  label: string;
  streetAddress: string;
  city: string;
  subcity?: string;
  latitude: number;
  longitude: number;
  isDefault: boolean;
  deliveryNotes?: string;
}

// ─── Popular Categories Data ──────────────────────────────────
const POPULAR_CATEGORIES = [
  { id: 'vegetables', name: 'Vegetables', image: '/images/cat_vegetables.jpg', count: '240+ Items' },
  { id: 'fruits', name: 'Fruits', image: '/images/cat_fruits.jpg', count: '180+ Items' },
  { id: 'grains-cereals', name: 'Grains & Cereals', image: '/images/cat_grains.jpg', count: '95+ Items' },
  { id: 'coffee-spices', name: 'Coffee & Spices', image: '/images/cat_coffee_spices.jpg', count: '140+ Items' },
  { id: 'livestock', name: 'Livestock', image: '/images/cat_livestock.jpg', count: '60+ Listings' },
  { id: 'seeds-inputs', name: 'Seeds & Inputs', image: '/images/cat_seeds.jpg', count: '85+ Items' },
];

export type BuyerTab =
  | 'dashboard'
  | 'products'
  | 'orders'
  | 'farmers'
  | 'favorites'
  | 'addresses'
  | 'messages'
  | 'profile'
  | 'settings';

function BuyerDashboardContent(props: any) {
  const initialTab = props?.initialTab as BuyerTab | undefined;
  const router = useRouter();
  const searchParams = useSearchParams();
  const buyNowParam = searchParams.get('buyNow');
  const checkoutParam = searchParams.get('checkout');
  const params = useParams();
  const pathname = usePathname();

  const currentTab: BuyerTab = useMemo(() => {
    if (initialTab) return initialTab;
    const urlTab = params?.tab as string;
    const validTabs: BuyerTab[] = [
      'dashboard',
      'products',
      'orders',
      'farmers',
      'favorites',
      'addresses',
      'messages',
      'profile',
      'settings',
    ];
    if (urlTab && validTabs.includes(urlTab as BuyerTab)) {
      return urlTab as BuyerTab;
    }
    const matched = validTabs.find(
      (t) => t !== 'dashboard' && pathname?.includes(`/dashboard/buyer/${t}`)
    );
    if (matched) return matched;
    return 'dashboard';
  }, [initialTab, params, pathname]);

  const [activeTab, setActiveTab] = useState<BuyerTab>(currentTab);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setActiveTab(currentTab);
  }, [currentTab]);

  const navigateToTab = (tab: BuyerTab) => {
    setActiveTab(tab);
    router.push(tab === 'dashboard' ? '/dashboard/buyer' : `/dashboard/buyer/${tab}`);
  };

  // Core Data States
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [nearbyFarmers, setNearbyFarmers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [savedFarmers, setSavedFarmers] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'distance' | 'price_asc' | 'price_desc' | 'rating'>('distance');

  // Cart & Checkout State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'checkout' | 'confirmed'>('cart');
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('TELEBIRR');
  const [checkoutNotes, setCheckoutNotes] = useState<string>('');
  const [confirmedOrderRef, setConfirmedOrderRef] = useState<string>('');
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // Modals & Drawers
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [trackingOrder, setTrackingOrder] = useState<any | null>(null);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [addressForm, setAddressForm] = useState({
    label: 'Home',
    streetAddress: '',
    city: 'Addis Ababa',
    subcity: 'Bole',
    latitude: 9.0125,
    longitude: 38.7636,
    isDefault: false,
    deliveryNotes: '',
  });

  // Support Form State
  const [supportForm, setSupportForm] = useState({
    subject: '',
    category: 'ORDER_ISSUE',
    orderId: '',
    message: '',
  });

  // Loading & Feedback States
  const [isLoading, setIsLoading] = useState(true);
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // User Profile
  const { user } = useAuth();
  const cachedUser = getCachedUserProfile();
  const [userProfile, setUserProfile] = useState<{ fullName: string; phone: string; role: string }>(() => ({
    fullName: user?.fullName || cachedUser?.fullName || 'Customer',
    phone: user?.phone || cachedUser?.phone || '',
    role: 'Buyer',
  }));

  useEffect(() => {
    if (user?.fullName) {
      setUserProfile((prev) => ({
        ...prev,
        fullName: user.fullName,
        phone: user.phone || prev.phone,
      }));
    }
  }, [user]);

  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMessage({ text, type });
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  // ─── Initial Data Loading ───────────────────────────────────
  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. Dashboard Overview
      const dashRes = await buyerApi.getDashboard().catch(() => null);
      if (dashRes?.data) {
        setDashboardData(dashRes.data);
        if (dashRes.data.nearbyFarmers) setNearbyFarmers(dashRes.data.nearbyFarmers);
        if (dashRes.data.recentOrders) setOrders(dashRes.data.recentOrders);
      }

      // 2. Products with nearest-first default
      const prodRes = await buyerApi.searchProducts({ sortBy: 'distance' }).catch(() => null);
      if (prodRes?.data) setProducts(prodRes.data);

      // 3. Addresses
      const addrRes = await buyerApi.getAddresses().catch(() => null);
      if (addrRes?.data) {
        setAddresses(addrRes.data);
        const def = addrRes.data.find((a: Address) => a.isDefault);
        if (def) setSelectedAddressId(def.id);
        else if (addrRes.data.length > 0) setSelectedAddressId(addrRes.data[0].id);
      }

      // 4. Saved Farmers & Favorites
      const savedRes = await buyerApi.getSavedFarmers().catch(() => null);
      if (savedRes?.data) setSavedFarmers(savedRes.data);

      const favRes = await buyerApi.getFavorites().catch(() => null);
      if (favRes?.data) setFavorites(favRes.data);

      // 5. Notifications
      const notifRes = await buyerApi.getNotifications().catch(() => null);
      if (notifRes?.data) setNotifications(notifRes.data);

      // 6. Check Local Storage User
      try {
        const rawUser = JSON.stringify(getCachedUserProfile());
        if (rawUser) {
          const u = JSON.parse(rawUser);
          if (u) {
            setUserProfile((prev) => ({
              ...prev,
              fullName: u?.fullName || prev.fullName,
              phone: u?.phone || prev.phone,
            }));
          }
        }
      } catch {
        // ignore
      }
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Refetch products when category, search, or sortBy change
  useEffect(() => {
    const fetchFiltered = async () => {
      try {
        const res = await buyerApi.searchProducts({
          search: searchQuery,
          category: selectedCategory === 'all' ? undefined : selectedCategory,
          sortBy,
        });
        if (res?.data && res.data.length > 0) {
          setProducts(res.data);
        }
      } catch (err) {
        console.warn('Unable to reach products service:', err);
      }
    };
    fetchFiltered();
  }, [searchQuery, selectedCategory, sortBy]);

  // ─── Cart Management ─────────────────────────────────────────
  const addToCart = (product: any, quantity = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.listingId === product.id);
      if (existing) {
        return prev.map((item) =>
          item.listingId === product.id ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [
        ...prev,
        {
          listingId: product.id,
          name: product.name,
          pricePerUnit: product.pricePerUnit,
          unit: product.unit,
          quantity,
          farmerName: product.farmerName,
          imageUrl: product.images?.[0]?.url || '/images/prod_tomatoes.jpg',
        },
      ];
    });
    showNotification(`Added ${product.name} to cart.`);
  };

  const updateCartQty = (listingId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((item) => item.listingId !== listingId));
    } else {
      setCart((prev) =>
        prev.map((item) => (item.listingId === listingId ? { ...item, quantity } : item))
      );
    }
  };

  const totalCartCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);

  const cartCalculations = useMemo(() => {
    const subtotal = cart.reduce((sum, item) => sum + item.pricePerUnit * item.quantity, 0);
    const deliveryFee = cart.length > 0 ? 50 : 0;
    const platformCommission = Math.round(subtotal * 0.05);
    const total = subtotal + deliveryFee + platformCommission;
    return { subtotal, deliveryFee, platformCommission, total };
  }, [cart]);

  // Handle post-authentication purchase resumption (Buy Now / Checkout)
  useEffect(() => {
    if (buyNowParam) {
      const targetId: string = buyNowParam;
      const resumeBuyNow = async (id: string) => {
        try {
          const res = await buyerApi.getProductDetails(id);
          if (res?.data && res.data.stockQuantity > 0) {
            addToCart(res.data, 1);
            setIsCartOpen(true);
            setCheckoutStep('checkout');
          } else {
            showNotification('The selected harvest is no longer available in stock.', 'error');
          }
        } catch {
          showNotification('Unable to verify the selected product for purchase.', 'error');
        }
      };
      resumeBuyNow(targetId);
    } else if (checkoutParam === 'true') {
      setIsCartOpen(true);
    }
  }, [buyNowParam, checkoutParam]);

  // ─── Checkout Flow ──────────────────────────────────────────
  const handleConfirmOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    const selectedAddr = addresses.find((a) => a.id === selectedAddressId) || addresses[0];
    const deliveryAddressStr = selectedAddr
      ? `${selectedAddr.streetAddress}, ${selectedAddr.city}`
      : 'Bole Subcity, Woreda 03, House 412, Addis Ababa';

    setIsCheckingOut(true);
    try {
      const idempotencyKey = `idemp-${Date.now()}-${Math.random()}`;
      const res = await buyerApi.createOrder({
        items: cart.map((c) => ({ listingId: c.listingId, quantity: c.quantity })),
        deliveryAddress: deliveryAddressStr,
        deliveryLatitude: selectedAddr?.latitude || 9.0125,
        deliveryLongitude: selectedAddr?.longitude || 38.7636,
        paymentMethod,
        idempotencyKey,
        buyerNotes: checkoutNotes,
      });

      if (res?.data) {
        setConfirmedOrderRef(res.data.orderNumber);
        setCheckoutStep('confirmed');
        setCart([]);
        // Refresh dashboard overview & orders
        fetchAllData();
        showNotification('Order confirmed successfully!');
      }
    } catch (err: any) {
      showNotification(err.message || 'Failed to place order.', 'error');
    } finally {
      setIsCheckingOut(false);
    }
  };

  // ─── Order Cancellation ─────────────────────────────────────
  const handleCancelOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    try {
      await buyerApi.cancelOrder(orderId, 'Cancelled from buyer dashboard.');
      showNotification('Order cancelled successfully.');
      fetchAllData();
    } catch (err: any) {
      showNotification(err.message || 'Cannot cancel order.', 'error');
    }
  };

  // ─── Delivery Tracking ──────────────────────────────────────
  const handleTrackOrder = async (orderId: string) => {
    try {
      const res = await buyerApi.getDeliveryTracking(orderId);
      if (res?.data) {
        setTrackingOrder(res.data);
      }
    } catch (err: any) {
      showNotification('Tracking information not yet available.', 'error');
    }
  };

  // ─── Address Management ─────────────────────────────────────
  const handleCreateAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await buyerApi.createAddress(addressForm);
      showNotification('New delivery address saved.');
      setIsAddressModalOpen(false);
      setAddressForm({
        label: 'Home',
        streetAddress: '',
        city: 'Addis Ababa',
        subcity: 'Bole',
        latitude: 9.0125,
        longitude: 38.7636,
        isDefault: false,
        deliveryNotes: '',
      });
      const addrRes = await buyerApi.getAddresses();
      if (addrRes?.data) setAddresses(addrRes.data);
    } catch (err: any) {
      showNotification(err.message || 'Failed to save address.', 'error');
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (!confirm('Delete this delivery address?')) return;
    try {
      await buyerApi.deleteAddress(addressId);
      showNotification('Address removed.');
      const addrRes = await buyerApi.getAddresses();
      if (addrRes?.data) setAddresses(addrRes.data);
    } catch (err: any) {
      showNotification(err.message || 'Cannot delete address.', 'error');
    }
  };

  // ─── Saved Farmers & Favorites Toggles ──────────────────────
  const handleToggleSavedFarmer = async (farmerId: string) => {
    try {
      const res = await buyerApi.toggleSavedFarmer(farmerId);
      showNotification(res.data.isSaved ? 'Farmer saved.' : 'Farmer removed from saved.');
      fetchAllData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleFavorite = async (listingId: string) => {
    try {
      const res = await buyerApi.toggleFavorite(listingId);
      showNotification(res.data.isFavorite ? 'Saved to Favorites.' : 'Removed from Favorites.');
      fetchAllData();
    } catch (err) {
      console.error(err);
    }
  };

  // ─── Support Request ────────────────────────────────────────
  const handleSubmitSupport = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await buyerApi.createSupportTicket(supportForm);
      showNotification('Support inquiry submitted. We will contact you shortly.');
      setIsSupportOpen(false);
      setSupportForm({ subject: '', category: 'ORDER_ISSUE', orderId: '', message: '' });
    } catch (err: any) {
      showNotification(err.message || 'Failed to submit inquiry.', 'error');
    }
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-[#0A3323] text-white">
      {/* Brand Header */}
      <div className="px-5 py-5 border-b border-[#124230] flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#10B981]/20 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" viewBox="0 0 36 36" fill="none">
              <path d="M18 4C18 4 23 11 23 18C23 21 21 24 18 25C15 24 13 21 13 18C13 11 18 4 18 4Z" fill="#10B981" />
              <path d="M16 26C16 26 9 24 7 18C5 12 11 9 11 9C11 9 13 16 17 21C17.5 21.6 18 22.2 18 22.2" fill="#059669" />
              <path d="M20 26C20 26 27 24 29 18C31 12 25 9 25 9C25 9 23 16 19 21C18.5 21.6 18 22.2 18 22.2" fill="#34D399" />
            </svg>
          </div>
          <div>
            <span className="font-black text-white text-base tracking-tight leading-none">AgriMarket</span>
            <p className="text-[9px] text-[#71A88F] font-semibold tracking-wider uppercase mt-0.5">
              Buyer Portal
            </p>
          </div>
        </Link>
        <button
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden text-white/70 hover:text-white cursor-pointer"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {BUYER_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={() => {
                setActiveTab(item.id as BuyerTab);
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${isActive
                ? 'bg-[#134D37] text-white shadow-sm'
                : 'text-[#9BB8AA] hover:bg-[#0E3D2B] hover:text-white'
                }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-300' : 'text-[#8AA899]'}`} />
                <span>{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Need Help Card */}
      <div className="p-3.5 border-t border-[#124230]">
        <div className="bg-[#0E3D2B] rounded-2xl p-3.5 border border-[#164C37]">
          <p className="text-[11px] font-bold text-white mb-2">Buyer Help Desk</p>
          <button
            onClick={() => setIsSupportOpen(true)}
            className="w-full py-2 px-3 rounded-xl bg-[#134D37] hover:bg-[#1A5E44] text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <HelpCircle className="w-3.5 h-3.5 text-emerald-300" />
            <span>Contact Support</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F4F7F5] dark:bg-[#07130D] text-[#1E2923] dark:text-[#E8F7EE] font-sans transition-colors duration-200 flex">
      {/* Toast Feedback */}
      {feedbackMessage && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold animate-in slide-in-from-top-2 duration-200 ${feedbackMessage.type === 'error'
            ? 'bg-red-50 text-red-800 border-red-200 dark:bg-red-950/80 dark:text-red-300 dark:border-red-900'
            : 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-900'
            }`}
        >
          {feedbackMessage.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          )}
          <span>{feedbackMessage.text}</span>
        </div>
      )}

      {/* Desktop Left Sidebar (Fixed and Sticky - does not scroll) */}
      <aside className="hidden lg:flex lg:flex-col lg:fixed lg:left-0 lg:top-0 lg:bottom-0 lg:w-60 lg:z-30 shadow-[4px_0_24px_rgba(0,0,0,0.06)]">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay Drawer */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-64 max-w-full h-full z-10">
            <SidebarContent />
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/90 dark:bg-[#0D2118] text-slate-800 dark:text-white flex items-center justify-center shadow-md cursor-pointer z-20"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Main Content Container with lg:ml-60 and bottom padding for mobile tabs */}
      <div className="flex-1 flex flex-col lg:ml-60 min-w-0 pb-20 lg:pb-0">
        {/* Top Header Navigation Bar */}
        <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#0A1A14]/95 backdrop-blur-md border-b border-[#E5EDE7] dark:border-[#132A20] px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-[#0B3322] dark:text-[#EEFAF3] hover:bg-[#EBF6EE] dark:hover:bg-[#163828] transition-colors cursor-pointer"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Mobile Logo Fallback */}
            <Link href="/" className="lg:hidden flex items-center gap-2">
              <span className="font-bold text-base text-[#075C3B] dark:text-[#34D399]">AgriMarket</span>
            </Link>
          </div>

          {/* Center: Search Bar */}
          <div className="flex-1 max-w-xl mx-2 hidden sm:block">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7A9988] dark:text-[#64947C]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (activeTab === 'dashboard') setActiveTab('products');
                }}
                placeholder="Search products, farmers..."
                className="w-full pl-10 pr-4 py-2 text-xs rounded-full bg-[#EBF2EE] dark:bg-[#11241B] border border-transparent focus:border-[#075C3B] dark:focus:border-[#34D399] focus:bg-white dark:focus:bg-[#07130D] outline-none text-[#1E2923] dark:text-[#E8F7EE] placeholder-[#7A9988] dark:placeholder-[#64947C] transition-all"
              />
            </div>
          </div>

          {/* Right: Actions & User Badge */}
          <div className="flex items-center gap-3">
            <ThemeToggle />

            {/* Cart Trigger */}
            <button
              onClick={() => {
                setCheckoutStep('cart');
                setIsCartOpen(true);
              }}
              className="relative p-2 rounded-xl text-[#517663] dark:text-[#88B8A0] hover:bg-[#EBF2EE] dark:hover:bg-[#11241B] transition-colors cursor-pointer"
              title="Shopping Cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {totalCartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#075C3B] dark:bg-[#10B981] text-white text-[10px] font-bold flex items-center justify-center">
                  {totalCartCount}
                </span>
              )}
            </button>

            {/* Notification Bell */}
            <button
              onClick={() => setIsNotificationsOpen(true)}
              className="relative p-2 rounded-xl text-[#517663] dark:text-[#88B8A0] hover:bg-[#EBF2EE] dark:hover:bg-[#11241B] transition-colors cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {dashboardData?.unreadNotificationsCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              )}
            </button>

            {/* User Profile Pill */}
            <div className="flex items-center gap-2.5 pl-2 border-l border-[#E5EDE7] dark:border-[#132A20]">
              <UserAvatar
                name={userProfile.fullName || user?.fullName}
                src={(user as any)?.avatarUrl}
                size="sm"
              />
              <div className="hidden md:block text-left">
                <div className="text-xs font-bold text-[#1E2923] dark:text-[#EDF7F1] leading-tight">
                  {userProfile.fullName}
                </div>
                <div className="text-[10px] text-[#517663] dark:text-[#88B8A0] font-medium leading-tight">
                  Buyer
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[#7A9988] hidden md:block" />
            </div>
          </div>
        </header>

        {/* Main Dynamic View Content Area */}
        <main className="flex-1 p-5 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl mx-auto space-y-6 w-full">

          {/* TAB 1: OVERVIEW DASHBOARD (Exact Match to Screenshot) */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">

              {/* Top Greeting Banner */}
              <div className="relative rounded-3xl bg-white dark:bg-[#0D221A] border border-[#E5EDE7] dark:border-[#132A20] p-6 lg:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xs overflow-hidden">
                <div className="space-y-2 z-10">
                  <h1 className="text-2xl sm:text-3xl font-display font-bold text-[#075C3B] dark:text-[#34D399] tracking-tight">
                    {(() => {
                      const hour = new Date().getHours();
                      const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
                      const rawName = userProfile.fullName || user?.fullName || cachedUser?.fullName || 'Customer';
                      const firstName = rawName.trim().split(' ')[0] || rawName;
                      return `${greeting}, ${firstName}! 🌱`;
                    })()}
                  </h1>
                  <p className="text-sm text-[#517663] dark:text-[#88B8A0] font-medium">
                    Fresh products. Local farmers. Better food.
                  </p>
                </div>
                {/* Produce Banner Image on Right */}
                <div className="relative w-48 h-32 md:w-64 md:h-36 rounded-2xl overflow-hidden shrink-0 shadow-xs">
                  <Image
                    src="/images/cat_vegetables.jpg"
                    alt="Fresh organic produce basket"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>

              {/* 4 Metric Summary Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">

                {/* Metric 1: Total Orders */}
                <div className="bg-white dark:bg-[#0D221A] p-5 rounded-2xl border border-[#E5EDE7] dark:border-[#132A20] shadow-xs space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#EBF2EE] dark:bg-[#112D22] text-[#075C3B] dark:text-[#34D399] flex items-center justify-center">
                      <Package className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-semibold text-[#517663] dark:text-[#88B8A0]">
                      Total Orders
                    </span>
                  </div>
                  <div>
                    <div className="text-2xl sm:text-3xl font-bold font-display text-[#1E2923] dark:text-white">
                      {dashboardData?.metrics?.totalOrders ?? 5}
                    </div>
                    <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-0.5">
                      <span>{dashboardData?.metrics?.totalOrdersChange ?? '+2 this month'}</span>
                    </div>
                  </div>
                </div>

                {/* Metric 2: Ongoing Deliveries */}
                <div className="bg-white dark:bg-[#0D221A] p-5 rounded-2xl border border-[#E5EDE7] dark:border-[#132A20] shadow-xs space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#EBF2EE] dark:bg-[#112D22] text-[#075C3B] dark:text-[#34D399] flex items-center justify-center">
                      <Truck className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-semibold text-[#517663] dark:text-[#88B8A0]">
                      Ongoing Deliveries
                    </span>
                  </div>
                  <div>
                    <div className="text-2xl sm:text-3xl font-bold font-display text-[#1E2923] dark:text-white">
                      {dashboardData?.metrics?.ongoingDeliveries ?? 2}
                    </div>
                    <div className="text-[11px] font-semibold text-[#7A9988] dark:text-[#64947C] mt-1">
                      {dashboardData?.metrics?.ongoingStatus ?? 'in progress'}
                    </div>
                  </div>
                </div>

                {/* Metric 3: Saved Farmers */}
                <div className="bg-white dark:bg-[#0D221A] p-5 rounded-2xl border border-[#E5EDE7] dark:border-[#132A20] shadow-xs space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#EBF2EE] dark:bg-[#112D22] text-[#075C3B] dark:text-[#34D399] flex items-center justify-center">
                      <Store className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-semibold text-[#517663] dark:text-[#88B8A0]">
                      Saved Farmers
                    </span>
                  </div>
                  <div>
                    <div className="text-2xl sm:text-3xl font-bold font-display text-[#1E2923] dark:text-white">
                      {dashboardData?.metrics?.savedFarmers ?? 12}
                    </div>
                    <div className="text-[11px] font-semibold text-[#7A9988] dark:text-[#64947C] mt-1">
                      {dashboardData?.metrics?.savedFarmersStatus ?? 'near you'}
                    </div>
                  </div>
                </div>

                {/* Metric 4: Total Spent */}
                <div className="bg-white dark:bg-[#0D221A] p-5 rounded-2xl border border-[#E5EDE7] dark:border-[#132A20] shadow-xs space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#EBF2EE] dark:bg-[#112D22] text-[#075C3B] dark:text-[#34D399] flex items-center justify-center">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-semibold text-[#517663] dark:text-[#88B8A0]">
                      Total Spent
                    </span>
                  </div>
                  <div>
                    <div className="text-2xl sm:text-3xl font-bold font-display text-[#1E2923] dark:text-white">
                      {dashboardData?.metrics?.totalSpent ?? 'ETB 8,450'}
                    </div>
                    <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-0.5">
                      <span>{dashboardData?.metrics?.totalSpentChange ?? '+15%'}</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Middle Section: Two Columns (Nearby Farmers & Popular Categories) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Left Column (7 cols): Nearby Farmers (Nearest-First) */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-display font-bold text-[#1E2923] dark:text-white">
                      Nearby Farmers
                    </h2>
                    <button
                      onClick={() => navigateToTab('farmers')}
                      className="text-xs font-bold text-[#075C3B] dark:text-[#34D399] hover:underline cursor-pointer"
                    >
                      View All
                    </button>
                  </div>

                  <div className="space-y-3">
                    {nearbyFarmers.slice(0, 3).map((farmer) => (
                      <div
                        key={farmer.id}
                        className="bg-white dark:bg-[#0D221A] p-4 rounded-2xl border border-[#E5EDE7] dark:border-[#132A20] flex items-center justify-between gap-4 shadow-xs hover:border-[#075C3B]/40 transition-colors"
                      >
                        <div className="flex items-center gap-3.5">
                          <div className="w-12 h-12 rounded-full overflow-hidden border border-[#E5EDE7] dark:border-[#132A20] relative shrink-0">
                            <Image
                              src={farmer.avatarUrl || '/images/avatar_abebe_hd.jpg'}
                              alt={farmer.name}
                              width={48}
                              height={48}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="space-y-1">
                            <div className="font-bold text-xs text-[#1E2923] dark:text-white">
                              {farmer.name}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-[#517663] dark:text-[#88B8A0]">
                              <span>{farmer.locationSubtitle || `${farmer.distanceKm} km • Addis Ababa`}</span>
                              <span>•</span>
                              <div className="flex items-center text-amber-500 font-semibold">
                                <Star className="w-3 h-3 fill-current mr-0.5" />
                                <span>{farmer.rating} ({farmer.reviewsCount})</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {/* Pill Badge */}
                              <span className="px-2 py-0.5 rounded-full bg-[#EBF2EE] dark:bg-[#112D22] text-[#075C3B] dark:text-[#34D399] text-[10px] font-bold">
                                {farmer.distanceDisplay || `${farmer.distanceKm} km`}
                              </span>
                              <span className="text-[11px] text-[#517663] dark:text-[#88B8A0] truncate max-w-[180px]">
                                {farmer.productsSummary || 'Fresh Produce'}
                              </span>
                            </div>
                            <div className="text-[11px] font-bold text-[#075C3B] dark:text-[#34D399]">
                              {farmer.priceRangeDisplay || 'ETB 50 - 80 /kg'}
                            </div>
                          </div>
                        </div>

                        {/* View Action Button */}
                        <button
                          onClick={() => {
                            setSearchQuery(farmer.name);
                            navigateToTab('products');
                          }}
                          className="px-4 py-1.5 rounded-xl bg-[#075C3B] hover:bg-[#05482D] dark:bg-[#10B981] dark:hover:bg-[#059669] text-white text-xs font-bold transition-colors cursor-pointer shrink-0"
                        >
                          View
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right Column (5 cols): Popular Categories + Promo Banner */}
                <div className="lg:col-span-5 space-y-5">

                  {/* Popular Categories Card */}
                  <div className="bg-white dark:bg-[#0D221A] p-5 rounded-2xl border border-[#E5EDE7] dark:border-[#132A20] shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold font-display text-[#1E2923] dark:text-white uppercase tracking-wider">
                        Popular Categories
                      </h3>
                      <button
                        onClick={() => {
                          setSelectedCategory('all');
                          navigateToTab('products');
                        }}
                        className="text-xs font-bold text-[#075C3B] dark:text-[#34D399] hover:underline cursor-pointer"
                      >
                        View All
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-center">
                      {POPULAR_CATEGORIES.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => {
                            setSelectedCategory(cat.id);
                            navigateToTab('products');
                          }}
                          className="group p-2 rounded-xl hover:bg-[#EBF2EE] dark:hover:bg-[#11241B] transition-colors cursor-pointer flex flex-col items-center gap-1.5"
                        >
                          <div className="w-12 h-12 rounded-full overflow-hidden border border-[#E5EDE7] dark:border-[#132A20] relative group-hover:scale-105 transition-transform">
                            <Image
                              src={cat.image}
                              alt={cat.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <span className="text-[11px] font-semibold text-[#1E2923] dark:text-[#EDF7F1] leading-tight">
                            {cat.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Promo Feature Card: Fast & Reliable Delivery */}
                  <div className="relative rounded-2xl overflow-hidden shadow-xs border border-[#E5EDE7] dark:border-[#132A20] h-48 flex flex-col justify-end p-5 text-white">
                    <Image
                      src="/images/worker_banner_van.jpg"
                      alt="Fast & Reliable Delivery Truck"
                      fill
                      className="object-cover"
                    />
                    {/* Dark gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

                    <div className="relative z-10 space-y-2">
                      <h4 className="font-display font-bold text-base leading-tight">
                        Fast & Reliable Delivery
                      </h4>
                      <p className="text-[11px] text-white/90">
                        Fresh from farm to your door
                      </p>
                      <button
                        onClick={() => setActiveTab('orders')}
                        className="px-3.5 py-1.5 bg-[#075C3B] hover:bg-[#05482D] text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors inline-block"
                      >
                        Learn More
                      </button>
                    </div>
                  </div>

                </div>

              </div>

              {/* Bottom Section: Recent Orders */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-display font-bold text-[#1E2923] dark:text-white">
                    Recent Orders
                  </h2>
                  <button
                    onClick={() => navigateToTab('orders')}
                    className="text-xs font-bold text-[#075C3B] dark:text-[#34D399] hover:underline cursor-pointer"
                  >
                    View All
                  </button>
                </div>

                <div className="space-y-3">
                  {orders.slice(0, 2).map((order) => {
                    const firstItem = order.items?.[0];
                    return (
                      <div
                        key={order.id}
                        className="bg-white dark:bg-[#0D221A] p-4 rounded-2xl border border-[#E5EDE7] dark:border-[#132A20] flex items-center justify-between gap-4 shadow-xs"
                      >
                        <div className="flex items-center gap-3.5">
                          <div className="w-12 h-12 rounded-xl overflow-hidden border border-[#E5EDE7] dark:border-[#132A20] relative shrink-0">
                            <Image
                              src={firstItem?.imageUrl || '/images/prod_tomatoes.jpg'}
                              alt={firstItem?.productName || 'Produce'}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-[#1E2923] dark:text-white">
                              {firstItem?.productName || 'Direct Farm Harvest'}
                            </div>
                            <div className="text-[11px] text-[#517663] dark:text-[#88B8A0]">
                              {firstItem?.quantity} {firstItem?.unit || 'kg'} • {order.orderNumber}
                            </div>
                          </div>
                        </div>

                        <div className="text-xs font-bold text-[#1E2923] dark:text-white">
                          ETB {order.totalAmount?.toLocaleString() ?? 600}
                        </div>

                        {/* Status Badge */}
                        <div className="flex items-center gap-3">
                          <span
                            className={`px-3 py-1 rounded-full text-[11px] font-bold ${order.status === 'DELIVERED'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                              : order.status === 'IN_TRANSIT'
                                ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400'
                                : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                              }`}
                          >
                            {order.status === 'DELIVERED'
                              ? 'Delivered'
                              : order.status === 'IN_TRANSIT'
                                ? 'In Transit'
                                : 'Preparing'}
                          </span>

                          <span className="text-xs text-[#7A9988] dark:text-[#64947C] hidden sm:block">
                            {new Date(order.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>

                          <button
                            onClick={() => handleTrackOrder(order.id)}
                            className="text-xs font-bold text-[#075C3B] dark:text-[#34D399] hover:underline cursor-pointer"
                          >
                            Track
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: BROWSE PRODUCTS */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-display font-bold text-[#1E2923] dark:text-white">
                    Direct Farm Produce
                  </h2>
                  <p className="text-xs text-[#517663] dark:text-[#88B8A0]">
                    Prioritizing nearest verified local farmers with farmer-controlled pricing
                  </p>
                </div>

                {/* Sort Controls */}
                <div className="flex items-center gap-2 self-stretch sm:self-auto">
                  <span className="text-xs text-[#517663] dark:text-[#88B8A0] font-medium">Sort by:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="text-xs p-2 rounded-xl bg-white dark:bg-[#0D221A] border border-[#E5EDE7] dark:border-[#132A20] text-[#1E2923] dark:text-white outline-none cursor-pointer"
                  >
                    <option value="distance">Nearest First (Default)</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                    <option value="rating">Top Rated</option>
                  </select>
                </div>
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-colors cursor-pointer ${selectedCategory === 'all'
                    ? 'bg-[#075C3B] text-white'
                    : 'bg-white dark:bg-[#0D221A] text-[#517663] dark:text-[#88B8A0] border border-[#E5EDE7] dark:border-[#132A20]'
                    }`}
                >
                  All Products
                </button>
                {POPULAR_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-colors cursor-pointer ${selectedCategory === cat.id
                      ? 'bg-[#075C3B] text-white'
                      : 'bg-white dark:bg-[#0D221A] text-[#517663] dark:text-[#88B8A0] border border-[#E5EDE7] dark:border-[#132A20]'
                      }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>

              {/* Product Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {products.map((prod) => (
                  <div
                    key={prod.id}
                    className="bg-white dark:bg-[#0D221A] rounded-2xl border border-[#E5EDE7] dark:border-[#132A20] overflow-hidden shadow-xs hover:border-[#075C3B]/40 transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Image Thumbnail with Distance Badge */}
                      <div className="relative h-44 w-full bg-[#EBF2EE] dark:bg-[#11241B]">
                        <Image
                          src={prod.images?.[0]?.url || '/images/prod_tomatoes.jpg'}
                          alt={prod.name}
                          fill
                          className="object-cover"
                        />
                        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white/90 dark:bg-black/80 backdrop-blur-xs text-[10px] font-bold text-[#075C3B] dark:text-[#34D399]">
                          {prod.distanceDisplay || `${prod.distanceKm} km away`}
                        </div>
                        <button
                          onClick={() => handleToggleFavorite(prod.id)}
                          className="absolute top-3 right-3 p-1.5 rounded-full bg-white/90 dark:bg-black/80 backdrop-blur-xs text-[#517663] dark:text-[#88B8A0] hover:text-red-500 cursor-pointer transition-colors"
                          title="Save to Favorites"
                        >
                          <Heart
                            className={`w-4 h-4 ${prod.isFavorite ? 'fill-red-500 text-red-500' : ''
                              }`}
                          />
                        </button>
                      </div>

                      {/* Content */}
                      <div className="p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#075C3B] dark:text-[#34D399]">
                            {prod.categoryName || 'Produce'}
                          </span>
                          <span className="text-[10px] text-[#7A9988] dark:text-[#64947C]">
                            Stock: {prod.stockQuantity} {prod.unit}
                          </span>
                        </div>

                        <h3 className="font-bold text-sm text-[#1E2923] dark:text-white leading-tight">
                          {prod.name}
                        </h3>

                        <div className="text-xs text-[#517663] dark:text-[#88B8A0] flex items-center justify-between">
                          <span>{prod.farmerName}</span>
                          <span className="flex items-center text-amber-500 font-semibold">
                            ★ {prod.rating}
                          </span>
                        </div>

                        <p className="text-[11px] text-[#517663] dark:text-[#88B8A0] line-clamp-2">
                          {prod.description}
                        </p>
                      </div>
                    </div>

                    {/* Footer: Price + Add to Cart */}
                    <div className="p-4 pt-0 border-t border-[#E5EDE7] dark:border-[#132A20] flex items-center justify-between mt-3">
                      <div>
                        <div className="text-sm font-bold text-[#075C3B] dark:text-[#34D399]">
                          ETB {prod.pricePerUnit}{' '}
                          <span className="text-[10px] text-[#7A9988] font-normal">
                            /{prod.unit}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => addToCart(prod, 1)}
                        className="px-3.5 py-1.5 rounded-xl bg-[#075C3B] hover:bg-[#05482D] dark:bg-[#10B981] dark:hover:bg-[#059669] text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: MY ORDERS */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-display font-bold text-[#1E2923] dark:text-white">
                    Order History & Deliveries
                  </h2>
                  <p className="text-xs text-[#517663] dark:text-[#88B8A0]">
                    Real-time status progression, delivery tracking, and immutable order records
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-white dark:bg-[#0D221A] rounded-2xl border border-[#E5EDE7] dark:border-[#132A20] p-5 shadow-xs space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-[#E5EDE7] dark:border-[#132A20]">
                      <div>
                        <div className="font-bold text-sm text-[#1E2923] dark:text-white flex items-center gap-2">
                          <span>Order #{order.orderNumber}</span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${order.status === 'DELIVERED'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                              : order.status === 'IN_TRANSIT'
                                ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400'
                                : order.status === 'CANCELLED'
                                  ? 'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-400'
                                  : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                              }`}
                          >
                            {order.status}
                          </span>
                        </div>
                        <div className="text-xs text-[#7A9988] mt-0.5">
                          Placed on {new Date(order.createdAt).toLocaleString()}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-base font-bold text-[#075C3B] dark:text-[#34D399]">
                          ETB {order.totalAmount?.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-[#7A9988]">
                          Method: {order.paymentMethod} • {order.paymentStatus}
                        </div>
                      </div>
                    </div>

                    {/* Order Line Items */}
                    <div className="space-y-2">
                      {order.items?.map((item: any) => (
                        <div key={item.id} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2.5">
                            <span className="font-semibold text-[#1E2923] dark:text-white">
                              {item.productName}
                            </span>
                            <span className="text-[#7A9988]">
                              x {item.quantity} {item.unit}
                            </span>
                          </div>
                          <div className="font-bold text-[#1E2923] dark:text-white">
                            ETB {item.subtotal?.toLocaleString()} (ETB {item.agreedUnitPrice}/{item.unit})
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Destination & Action Buttons */}
                    <div className="pt-3 border-t border-[#E5EDE7] dark:border-[#132A20] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-1.5 text-[#517663] dark:text-[#88B8A0]">
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate max-w-sm">{order.deliveryAddress}</span>
                      </div>

                      <div className="flex items-center gap-2 self-stretch sm:self-auto">
                        <button
                          onClick={() => handleTrackOrder(order.id)}
                          className="px-3.5 py-1.5 rounded-xl bg-[#EBF2EE] dark:bg-[#11241B] hover:bg-[#075C3B] hover:text-white text-[#075C3B] dark:text-[#34D399] font-bold text-xs transition-colors cursor-pointer"
                        >
                          Track Delivery
                        </button>

                        {/* Order cancellation permitted only in pre-transit status */}
                        {['CONFIRMED', 'PREPARING'].includes(order.status) && (
                          <button
                            onClick={() => handleCancelOrder(order.id)}
                            className="px-3.5 py-1.5 rounded-xl border border-red-300 text-red-600 hover:bg-red-50 text-xs font-semibold transition-colors cursor-pointer"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: SAVED FARMERS */}
          {activeTab === 'farmers' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-display font-bold text-[#1E2923] dark:text-white">
                  Saved Farmers
                </h2>
                <p className="text-xs text-[#517663] dark:text-[#88B8A0]">
                  Direct access to your trusted local producers and their current harvest
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {nearbyFarmers.map((farmer) => (
                  <div
                    key={farmer.id}
                    className="bg-white dark:bg-[#0D221A] rounded-2xl border border-[#E5EDE7] dark:border-[#132A20] p-5 shadow-xs space-y-4"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-14 h-14 rounded-full overflow-hidden border border-[#E5EDE7] relative shrink-0">
                        <Image
                          src={farmer.avatarUrl || '/images/avatar_abebe_hd.jpg'}
                          alt={farmer.name}
                          width={56}
                          height={56}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-[#1E2923] dark:text-white">
                          {farmer.name}
                        </h3>
                        <p className="text-xs text-[#517663] dark:text-[#88B8A0]">
                          {farmer.farmName}
                        </p>
                        <div className="flex items-center text-amber-500 font-semibold text-xs mt-1">
                          <Star className="w-3.5 h-3.5 fill-current mr-1" />
                          <span>{farmer.rating} ({farmer.reviewsCount} reviews)</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-xs space-y-1 text-[#517663] dark:text-[#88B8A0]">
                      <div><strong>Location:</strong> {farmer.locationName} ({farmer.distanceKm} km away)</div>
                      <div><strong>Harvest Range:</strong> {farmer.priceRangeDisplay}</div>
                      <div><strong>Main Crops:</strong> {farmer.productsSummary}</div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-[#E5EDE7] dark:border-[#132A20]">
                      <button
                        onClick={() => {
                          setSearchQuery(farmer.name);
                          setActiveTab('products');
                        }}
                        className="flex-1 py-1.5 rounded-xl bg-[#075C3B] hover:bg-[#05482D] text-white text-xs font-bold transition-colors cursor-pointer text-center"
                      >
                        View Harvest
                      </button>
                      <button
                        onClick={() => handleToggleSavedFarmer(farmer.id)}
                        className="p-2 rounded-xl bg-[#EBF2EE] dark:bg-[#11241B] text-emerald-700 dark:text-emerald-400 hover:text-red-600 transition-colors cursor-pointer"
                        title="Saved"
                      >
                        <Heart className="w-4 h-4 fill-current" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: FAVORITES */}
          {activeTab === 'favorites' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-display font-bold text-[#1E2923] dark:text-white">
                  Favorite Products
                </h2>
                <p className="text-xs text-[#517663] dark:text-[#88B8A0]">
                  Quickly repurchase your preferred seasonal produce
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {products
                  .filter((p) => p.isFavorite)
                  .map((prod) => (
                    <div
                      key={prod.id}
                      className="bg-white dark:bg-[#0D221A] rounded-2xl border border-[#E5EDE7] dark:border-[#132A20] p-4 shadow-xs space-y-3"
                    >
                      <div className="relative h-36 w-full rounded-xl overflow-hidden bg-[#EBF2EE]">
                        <Image
                          src={prod.images?.[0]?.url || '/images/prod_tomatoes.jpg'}
                          alt={prod.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-[#1E2923] dark:text-white">
                          {prod.name}
                        </span>
                        <span className="text-xs font-bold text-[#075C3B] dark:text-[#34D399]">
                          ETB {prod.pricePerUnit} /{prod.unit}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#517663] dark:text-[#88B8A0]">
                        {prod.farmerName} • {prod.distanceDisplay}
                      </p>
                      <button
                        onClick={() => addToCart(prod, 1)}
                        className="w-full py-2 bg-[#075C3B] hover:bg-[#05482D] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                      >
                        Add to Cart
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* TAB 6: DELIVERY ADDRESSES */}
          {activeTab === 'addresses' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-display font-bold text-[#1E2923] dark:text-white">
                    Delivery Addresses
                  </h2>
                  <p className="text-xs text-[#517663] dark:text-[#88B8A0]">
                    Manage destinations for direct farm distribution
                  </p>
                </div>
                <button
                  onClick={() => setIsAddressModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-[#075C3B] hover:bg-[#05482D] text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Address</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className="bg-white dark:bg-[#0D221A] p-5 rounded-2xl border border-[#E5EDE7] dark:border-[#132A20] shadow-xs space-y-3 relative"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#1E2923] dark:text-white">
                          {addr.label}
                        </span>
                        {addr.isDefault && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-bold">
                            Default
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteAddress(addr.id)}
                        className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                        title="Delete Address"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="text-xs text-[#517663] dark:text-[#88B8A0] space-y-1">
                      <div>{addr.streetAddress}</div>
                      <div>{addr.city} {addr.subcity ? `(${addr.subcity})` : ''}</div>
                      {addr.deliveryNotes && (
                        <div className="text-[11px] italic text-[#7A9988]">
                          Note: {addr.deliveryNotes}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 7: MESSAGES */}
          {activeTab === 'messages' && (
            <div className="bg-white dark:bg-[#0D221A] rounded-2xl border border-[#E5EDE7] dark:border-[#132A20] p-8 text-center space-y-3">
              <MessageSquare className="w-12 h-12 text-[#075C3B] mx-auto opacity-40" />
              <h3 className="font-bold text-base text-[#1E2923] dark:text-white">Direct Messages</h3>
              <p className="text-xs text-[#517663] dark:text-[#88B8A0] max-w-md mx-auto">
                Authorized communications with farmers and assigned couriers appear here once an order enters preparation or delivery.
              </p>
            </div>
          )}

          {/* TAB 8: PROFILE */}
          {activeTab === 'profile' && (
            <div className="bg-white dark:bg-[#0D221A] rounded-2xl border border-[#E5EDE7] dark:border-[#132A20] p-6 max-w-xl mx-auto space-y-5">
              <div className="flex items-center gap-4">
                <UserAvatar
                  name={userProfile.fullName || user?.fullName}
                  src={(user as any)?.avatarUrl}
                  size="xl"
                  className="w-16 h-16 text-xl"
                />
                <div>
                  <h3 className="font-bold text-base text-[#1E2923] dark:text-white">
                    {userProfile.fullName}
                  </h3>
                  <p className="text-xs text-[#517663] dark:text-[#88B8A0]">
                    Verified Agricultural Buyer • Addis Ababa
                  </p>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-[#517663] dark:text-[#88B8A0] mb-1">Full Name</label>
                  <input
                    type="text"
                    disabled
                    value={userProfile.fullName}
                    className="w-full p-2.5 rounded-xl bg-[#EBF2EE] dark:bg-[#11241B] border border-transparent text-[#1E2923] dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#517663] dark:text-[#88B8A0] mb-1">Phone Number</label>
                  <input
                    type="text"
                    disabled
                    value={userProfile.phone}
                    className="w-full p-2.5 rounded-xl bg-[#EBF2EE] dark:bg-[#11241B] border border-transparent text-[#1E2923] dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#517663] dark:text-[#88B8A0] mb-1">Default Market City</label>
                  <input
                    type="text"
                    disabled
                    value="Addis Ababa"
                    className="w-full p-2.5 rounded-xl bg-[#EBF2EE] dark:bg-[#11241B] border border-transparent text-[#1E2923] dark:text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 9: SETTINGS */}
          {activeTab === 'settings' && (
            <div className="bg-white dark:bg-[#0D221A] rounded-2xl border border-[#E5EDE7] dark:border-[#132A20] p-6 max-w-xl mx-auto space-y-5">
              <h3 className="font-bold text-base text-[#1E2923] dark:text-white">Account Settings</h3>

              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between pb-3 border-b border-[#E5EDE7] dark:border-[#132A20]">
                  <div>
                    <div className="font-bold text-[#1E2923] dark:text-white">Language</div>
                    <div className="text-[11px] text-[#7A9988]">Select platform language</div>
                  </div>
                  <select className="p-1.5 rounded-lg border border-[#E5EDE7] dark:border-[#132A20] bg-white dark:bg-[#07130D]">
                    <option>English (US)</option>
                    <option>Amharic (አማርኛ)</option>
                    <option>Oromo (Afaan Oromoo)</option>
                  </select>
                </div>

                <div className="flex items-center justify-between pb-3 border-b border-[#E5EDE7] dark:border-[#132A20]">
                  <div>
                    <div className="font-bold text-[#1E2923] dark:text-white">Order SMS Updates</div>
                    <div className="text-[11px] text-[#7A9988]">Receive courier tracking via SMS</div>
                  </div>
                  <input type="checkbox" defaultChecked className="w-4 h-4 accent-[#075C3B]" />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-[#1E2923] dark:text-white">Sign Out</div>
                    <div className="text-[11px] text-[#7A9988]">Sign out of your active session</div>
                  </div>
                  <button
                    onClick={() => {
                      logout();

                      router.push('/login');
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-950 dark:text-red-300 text-xs font-bold cursor-pointer"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ─── MODAL: CART & CHECKOUT ────────────────────────────────── */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-[#0A1A14] h-full shadow-2xl flex flex-col justify-between border-l border-[#E5EDE7] dark:border-[#132A20] animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="p-4 border-b border-[#E5EDE7] dark:border-[#132A20] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-[#075C3B] dark:text-[#34D399]" />
                <h3 className="font-bold text-sm text-[#1E2923] dark:text-white">
                  {checkoutStep === 'cart' && 'Direct Farm Harvest Bag'}
                  {checkoutStep === 'checkout' && 'Checkout & Delivery Info'}
                  {checkoutStep === 'confirmed' && 'Order Confirmed'}
                </h3>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-1 rounded-lg text-[#7A9988] hover:text-[#1E2923] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-5 flex-1 overflow-y-auto">
              {checkoutStep === 'cart' && (
                <>
                  {cart.length === 0 ? (
                    <div className="text-center py-16 space-y-3">
                      <ShoppingBag className="w-12 h-12 text-[#7A9988] mx-auto opacity-40" />
                      <div className="font-bold text-sm text-[#1E2923] dark:text-white">
                        Your bag is empty
                      </div>
                      <p className="text-xs text-[#517663] dark:text-[#88B8A0]">
                        Explore fresh produce from nearby farmers to start an order.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {cart.map((item) => (
                        <div
                          key={item.listingId}
                          className="bg-[#F4F7F5] dark:bg-[#0D221A] p-3 rounded-xl border border-[#E5EDE7] dark:border-[#132A20] flex items-center gap-3"
                        >
                          <div className="w-12 h-12 rounded-lg overflow-hidden relative shrink-0">
                            <Image
                              src={item.imageUrl}
                              alt={item.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-xs text-[#1E2923] dark:text-white truncate">
                              {item.name}
                            </div>
                            <div className="text-[10px] text-[#517663] dark:text-[#88B8A0]">
                              {item.farmerName}
                            </div>
                            <div className="text-xs font-bold text-[#075C3B] dark:text-[#34D399] mt-0.5">
                              ETB {item.pricePerUnit * item.quantity} (ETB {item.pricePerUnit}/{item.unit})
                            </div>
                          </div>

                          {/* Quantity stepper */}
                          <div className="flex items-center gap-1.5 bg-white dark:bg-[#07130D] p-1 rounded-lg border border-[#E5EDE7] dark:border-[#132A20]">
                            <button
                              onClick={() => updateCartQty(item.listingId, item.quantity - 1)}
                              className="p-1 text-[#517663] hover:text-black cursor-pointer"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-xs font-bold px-1.5">{item.quantity}</span>
                            <button
                              onClick={() => updateCartQty(item.listingId, item.quantity + 1)}
                              className="p-1 text-[#517663] hover:text-black cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {checkoutStep === 'checkout' && (
                <form id="checkoutForm" onSubmit={handleConfirmOrder} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-[#1E2923] dark:text-white mb-1">
                      Delivery Destination
                    </label>
                    <select
                      value={selectedAddressId}
                      onChange={(e) => setSelectedAddressId(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-[#E5EDE7] dark:border-[#132A20] bg-white dark:bg-[#0D221A] text-[#1E2923] dark:text-white"
                    >
                      {addresses.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.label}: {a.streetAddress}, {a.city}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-[#1E2923] dark:text-white mb-1">
                      Payment Method
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('TELEBIRR')}
                        className={`p-2.5 rounded-xl border text-center font-bold transition-colors cursor-pointer ${paymentMethod === 'TELEBIRR'
                          ? 'border-[#075C3B] bg-emerald-50 text-[#075C3B] dark:bg-emerald-950/60 dark:text-[#34D399]'
                          : 'border-[#E5EDE7] dark:border-[#132A20]'
                          }`}
                      >
                        Telebirr
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('CBEBIRR')}
                        className={`p-2.5 rounded-xl border text-center font-bold transition-colors cursor-pointer ${paymentMethod === 'CBEBIRR'
                          ? 'border-[#075C3B] bg-emerald-50 text-[#075C3B] dark:bg-emerald-950/60 dark:text-[#34D399]'
                          : 'border-[#E5EDE7] dark:border-[#132A20]'
                          }`}
                      >
                        CBE Birr
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-[#1E2923] dark:text-white mb-1">
                      Special Delivery Notes (Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={checkoutNotes}
                      onChange={(e) => setCheckoutNotes(e.target.value)}
                      placeholder="e.g. Call when outside compound gate"
                      className="w-full p-2.5 rounded-xl border border-[#E5EDE7] dark:border-[#132A20] bg-white dark:bg-[#0D221A]"
                    />
                  </div>
                </form>
              )}

              {checkoutStep === 'confirmed' && (
                <div className="text-center py-12 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="font-bold text-lg text-[#1E2923] dark:text-white">
                    Order Placed Successfully!
                  </h3>
                  <p className="text-xs text-[#517663] dark:text-[#88B8A0]">
                    Order reference: <strong>#{confirmedOrderRef}</strong>. Local farmers have locked your produce and delivery has been assigned.
                  </p>
                  <button
                    onClick={() => {
                      setIsCartOpen(false);
                      setCheckoutStep('cart');
                      setActiveTab('orders');
                    }}
                    className="px-5 py-2 bg-[#075C3B] text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    View My Orders
                  </button>
                </div>
              )}
            </div>

            {/* Bottom Summary Bar */}
            {cart.length > 0 && checkoutStep !== 'confirmed' && (
              <div className="p-4 border-t border-[#E5EDE7] dark:border-[#132A20] space-y-3 bg-[#FAF8F5] dark:bg-[#0D221A]">
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-[#517663] dark:text-[#88B8A0]">
                    <span>Produce Subtotal:</span>
                    <span>ETB {cartCalculations.subtotal}</span>
                  </div>
                  <div className="flex justify-between text-[#517663] dark:text-[#88B8A0]">
                    <span>Local Courier Delivery:</span>
                    <span>ETB {cartCalculations.deliveryFee}</span>
                  </div>
                  <div className="flex justify-between text-[#517663] dark:text-[#88B8A0]">
                    <span>Platform Fee (5%):</span>
                    <span>ETB {cartCalculations.platformCommission}</span>
                  </div>
                  <div className="flex justify-between font-bold text-sm text-[#075C3B] dark:text-[#34D399] pt-1 border-t border-[#E5EDE7] dark:border-[#132A20]">
                    <span>Total Amount:</span>
                    <span>ETB {cartCalculations.total}</span>
                  </div>
                </div>

                {checkoutStep === 'cart' ? (
                  <button
                    onClick={() => setCheckoutStep('checkout')}
                    className="w-full py-2.5 rounded-xl bg-[#075C3B] hover:bg-[#05482D] text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    Proceed to Delivery Info
                  </button>
                ) : (
                  <button
                    form="checkoutForm"
                    type="submit"
                    disabled={isCheckingOut}
                    className="w-full py-2.5 rounded-xl bg-[#075C3B] hover:bg-[#05482D] text-white text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isCheckingOut ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Confirm Order (ETB {cartCalculations.total})</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── MODAL: DELIVERY TRACKING ───────────────────────────────── */}
      {trackingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0D221A] rounded-2xl border border-[#E5EDE7] dark:border-[#132A20] max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5EDE7] dark:border-[#132A20]">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-[#075C3B] dark:text-[#34D399]" />
                <h3 className="font-bold text-sm text-[#1E2923] dark:text-white">
                  Delivery Tracking: #{trackingOrder.orderNumber}
                </h3>
              </div>
              <button onClick={() => setTrackingOrder(null)} className="p-1 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Courier Info */}
            <div className="bg-[#F4F7F5] dark:bg-[#11241B] p-3.5 rounded-xl space-y-1.5 text-xs">
              <div className="font-bold text-[#075C3B] dark:text-[#34D399]">Assigned Courier</div>
              <div className="text-[#1E2923] dark:text-white font-semibold">
                {trackingOrder.courier?.name} ({trackingOrder.courier?.vehicleType})
              </div>
              <div className="text-[#517663] dark:text-[#88B8A0] flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" />
                <span>{trackingOrder.courier?.phone}</span>
              </div>
            </div>

            {/* Timeline */}
            <div className="space-y-3">
              {trackingOrder.timeline?.map((step: any, idx: number) => (
                <div key={idx} className="flex items-start gap-3 text-xs">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0 mt-0.5 ${step.done
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-200 text-gray-500 dark:bg-gray-800'
                      }`}
                  >
                    ✓
                  </div>
                  <div>
                    <div className="font-bold text-[#1E2923] dark:text-white">{step.title}</div>
                    {step.time && (
                      <div className="text-[10px] text-[#7A9988]">
                        {new Date(step.time).toLocaleTimeString()}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setTrackingOrder(null)}
              className="w-full py-2 bg-[#075C3B] text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              Close Tracking
            </button>
          </div>
        </div>
      )}

      {/* ─── MODAL: ADD ADDRESS ────────────────────────────────────── */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0D221A] rounded-2xl border border-[#E5EDE7] dark:border-[#132A20] max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-[#E5EDE7] dark:border-[#132A20]">
              <h3 className="font-bold text-sm text-[#1E2923] dark:text-white">
                Add Delivery Address
              </h3>
              <button onClick={() => setIsAddressModalOpen(false)} className="p-1 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAddress} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#517663] mb-1">Label</label>
                <input
                  type="text"
                  required
                  value={addressForm.label}
                  onChange={(e) => setAddressForm({ ...addressForm, label: e.target.value })}
                  placeholder="e.g. Home, Office, Farm Gate"
                  className="w-full p-2.5 rounded-xl border border-[#E5EDE7] dark:border-[#132A20] bg-white dark:bg-[#07130D]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#517663] mb-1">Street Address</label>
                <input
                  type="text"
                  required
                  value={addressForm.streetAddress}
                  onChange={(e) => setAddressForm({ ...addressForm, streetAddress: e.target.value })}
                  placeholder="e.g. Bole Subcity, Woreda 03, House 412"
                  className="w-full p-2.5 rounded-xl border border-[#E5EDE7] dark:border-[#132A20] bg-white dark:bg-[#07130D]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-[#517663] mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-[#E5EDE7] dark:border-[#132A20] bg-white dark:bg-[#07130D]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#517663] mb-1">Subcity (Optional)</label>
                  <input
                    type="text"
                    value={addressForm.subcity}
                    onChange={(e) => setAddressForm({ ...addressForm, subcity: e.target.value })}
                    placeholder="Bole, Kirkos, Yeka"
                    className="w-full p-2.5 rounded-xl border border-[#E5EDE7] dark:border-[#132A20] bg-white dark:bg-[#07130D]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="defCheck"
                  checked={addressForm.isDefault}
                  onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                  className="w-4 h-4 accent-[#075C3B]"
                />
                <label htmlFor="defCheck" className="text-xs font-semibold cursor-pointer">
                  Set as default delivery address
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddressModalOpen(false)}
                  className="px-4 py-2 border rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#075C3B] hover:bg-[#05482D] text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Save Address
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: SUPPORT & ISSUES ───────────────────────────────── */}
      {isSupportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0D221A] rounded-2xl border border-[#E5EDE7] dark:border-[#132A20] max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-[#E5EDE7] dark:border-[#132A20]">
              <h3 className="font-bold text-sm text-[#1E2923] dark:text-white">
                Contact AgriMarket Support
              </h3>
              <button onClick={() => setIsSupportOpen(false)} className="p-1 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitSupport} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#517663] mb-1">Topic / Subject</label>
                <input
                  type="text"
                  required
                  value={supportForm.subject}
                  onChange={(e) => setSupportForm({ ...supportForm, subject: e.target.value })}
                  placeholder="e.g. Delivery delay inquiry or quality question"
                  className="w-full p-2.5 rounded-xl border border-[#E5EDE7] dark:border-[#132A20] bg-white dark:bg-[#07130D]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#517663] mb-1">Category</label>
                <select
                  value={supportForm.category}
                  onChange={(e) => setSupportForm({ ...supportForm, category: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-[#E5EDE7] dark:border-[#132A20] bg-white dark:bg-[#07130D]"
                >
                  <option value="ORDER_ISSUE">Order / Delivery Issue</option>
                  <option value="PAYMENT_INQUIRY">Payment Verification</option>
                  <option value="PRODUCE_QUALITY">Produce Quality Feedback</option>
                  <option value="GENERAL">General Platform Inquiry</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#517663] mb-1">Message</label>
                <textarea
                  rows={4}
                  required
                  value={supportForm.message}
                  onChange={(e) => setSupportForm({ ...supportForm, message: e.target.value })}
                  placeholder="Describe your request or issue..."
                  className="w-full p-2.5 rounded-xl border border-[#E5EDE7] dark:border-[#132A20] bg-white dark:bg-[#07130D]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSupportOpen(false)}
                  className="px-4 py-2 border rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#075C3B] hover:bg-[#05482D] text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Submit Inquiry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── DRAWER: NOTIFICATIONS ─────────────────────────────────── */}
      {isNotificationsOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white dark:bg-[#0A1A14] h-full shadow-2xl flex flex-col justify-between border-l border-[#E5EDE7] dark:border-[#132A20] animate-in slide-in-from-right duration-200">
            <div className="p-4 border-b border-[#E5EDE7] dark:border-[#132A20] flex items-center justify-between">
              <h3 className="font-bold text-sm text-[#1E2923] dark:text-white">Notifications</h3>
              <button onClick={() => setIsNotificationsOpen(false)} className="p-1 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 flex-1 overflow-y-auto space-y-3">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-3 rounded-xl border text-xs space-y-1 ${notif.readAt
                    ? 'bg-gray-50/50 dark:bg-[#0D221A]/50 border-[#E5EDE7] dark:border-[#132A20]'
                    : 'bg-emerald-50/60 dark:bg-[#112D22] border-emerald-200 dark:border-emerald-800'
                    }`}
                >
                  <div className="font-bold text-[#1E2923] dark:text-white flex items-center justify-between">
                    <span>{notif.title}</span>
                    <span className="text-[10px] text-[#7A9988]">
                      {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#517663] dark:text-[#88B8A0]">{notif.message}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Native-style Mobile Bottom Tab Bar */}
      <BuyerBottomNav
        activeTab={activeTab === 'dashboard' ? 'overview' : activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab === 'overview' ? 'dashboard' : tab);
        }}
        onOpenMenu={() => setSidebarOpen(true)}
        cartCount={totalCartCount}
        activeOrdersCount={orders.filter((o: any) => o.status !== 'DELIVERED' && o.status !== 'CANCELLED').length}
      />
    </div>
  );
}

export default function BuyerDashboardPage(props: any) {
  return (
    <Suspense fallback={<DashboardScreenSkeleton />}>
      <BuyerDashboardContent {...props} />
    </Suspense>
  );
}
