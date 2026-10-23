'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header, Footer } from '@/components/layout';
import { CartDrawer } from '@/components/cart/CartDrawer';
import {
  Hero,
  ShopByCategory,
  HowItWorks,
  FreshAndSeasonalProducts,
  CommunityImpact,
  ConnectAcrossCities,
  Testimonials,
  CtaBanner,
} from '@/components/landing';

import { CartItem, MarketLocation, Product } from '@/types';
import { SUPPORTED_LOCATIONS } from '@/data/marketplaceData';

export default function Home() {
  const router = useRouter();
  // Active location and filter state
  const [currentLocation] = useState<MarketLocation>(SUPPORTED_LOCATIONS[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('vegetables');
  const [cart, setCart] = useState<CartItem[]>([]);

  // Cart Drawer state
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);

  // Smooth scroll helper
  const handleScrollTo = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Cart actions
  const handleAddToCart = (product: Product, quantity = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
  };

  const handleUpdateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveCartItem(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const handleRemoveCartItem = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#0B1512] text-[#252B26] dark:text-[#E8F7EE] flex flex-col font-sans transition-colors duration-200">
      {/* 1. Header (Navbar + Theme Toggle + Cart Trigger) */}
      <Header
        currentLocation={currentLocation}
        cartCount={totalCartCount}
        onOpenCart={() => setIsCartDrawerOpen(true)}
        onScrollTo={handleScrollTo}
      />

      {/* Spacer to offset fixed navbar height */}
      <div className="h-16 sm:h-20 shrink-0" aria-hidden="true" />

      <main className="flex-1">
        {/* 2. Hero Section */}
        <Hero
          currentLocation={currentLocation}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSelectSuggestion={(sug) => {
            setSearchQuery(sug);
            handleScrollTo('products');
          }}
          onExploreClick={() => handleScrollTo('products')}
          onStartSellingClick={() => handleScrollTo('cta')}
        />

        {/* 3. Shop by Category */}
        <ShopByCategory
          selectedCategory={selectedCategory}
          onSelectCategory={(cat) => {
            setSelectedCategory(cat);
            handleScrollTo('products');
          }}
        />

        {/* 4. How It Works: Simple Steps */}
        <HowItWorks
          onExploreProducts={() => handleScrollTo('products')}
        />

        {/* 5. Fresh & Seasonal Products */}
        <FreshAndSeasonalProducts
          onAddToCart={(prod) => handleAddToCart(prod, 1)}
        />

        {/* 6. Community Impact: Clean background without duplicate/intercepted card */}
        <CommunityImpact
          onLearnMore={() => handleScrollTo('how-it-works')}
        />

        {/* 7. Connect Across Cities (Intercity Trade) */}
        <ConnectAcrossCities
          onLearnMore={() => handleScrollTo('cta')}
        />

        {/* 8. Testimonials (Lucide Star Rating) */}
        <Testimonials />

        {/* 9. Call to Action Banner */}
        <CtaBanner
          onGetStarted={() => router.push('/signup')}
          onLearnMore={() => handleScrollTo('how-it-works')}
        />
      </main>

      {/* 10. Footer (Lucide Contact Icons) */}
      <Footer
        onScrollTo={handleScrollTo}
      />

      {/* 11. Cart Drawer */}
      <CartDrawer
        isOpen={isCartDrawerOpen}
        onClose={() => setIsCartDrawerOpen(false)}
        items={cart}
        currentLocation={currentLocation}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
      />
    </div>
  );
}
