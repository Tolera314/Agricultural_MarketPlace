'use client';

import React, { useState, useEffect } from 'react';
import { ShoppingBag, ArrowRight, ChevronRight, Menu, X, Sprout } from 'lucide-react';
import { MarketLocation } from '@/types';
import { ThemeToggle } from './ThemeToggle';

interface HeaderProps {
  currentLocation: MarketLocation;
  cartCount: number;
  onOpenCart: () => void;
  onScrollTo: (sectionId: string) => void;
}

export type NavItemKey = 'home' | 'categories' | 'products' | 'how-it-works' | 'intercity' | 'about';

export const Header: React.FC<HeaderProps> = ({
  cartCount,
  onOpenCart,
  onScrollTo,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<NavItemKey>('home');

  // Close mobile drawer when pressing Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  // Prevent background scroll when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const navItems: {
    key: NavItemKey;
    label: string;
    sectionId: string;
  }[] = [
    {
      key: 'home',
      label: 'Home',
      sectionId: 'hero',
    },
    {
      key: 'categories',
      label: 'Categories',
      sectionId: 'categories',
    },
    {
      key: 'products',
      label: 'Products',
      sectionId: 'products',
    },
    {
      key: 'how-it-works',
      label: 'How It Works',
      sectionId: 'how-it-works',
    },
    {
      key: 'intercity',
      label: 'Intercity Trade',
      sectionId: 'intercity-trade',
    },
    {
      key: 'about',
      label: 'About',
      sectionId: 'about',
    },
  ];

  const handleNavClick = (item: (typeof navItems)[0]) => {
    setActiveTab(item.key);
    onScrollTo(item.sectionId);
    setMobileMenuOpen(false);
  };

  return (
    <>
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-[#0B1512]/95 backdrop-blur-md border-b border-[#E5EDE4] dark:border-[#1E3A2F] transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo on the left */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              onClick={() => {
                setActiveTab('home');
                onScrollTo('hero');
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-2 sm:gap-2.5 text-left group focus-visible:outline-none rounded-lg p-1 cursor-pointer"
              aria-label="AgriMarket Home"
            >
              {/* AgriMarket 3-Leaf Seedling Logo SVG */}
              <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center shrink-0">
                <svg
                  className="w-8 h-8 sm:w-9 sm:h-9"
                  viewBox="0 0 36 36"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M18 4C18 4 23 11 23 18C23 21 21 24 18 25C15 24 13 21 13 18C13 11 18 4 18 4Z"
                    fill="#10B981"
                  />
                  <path
                    d="M16 26C16 26 9 24 7 18C5 12 11 9 11 9C11 9 13 16 17 21C17.5 21.6 18 22.2 18 22.2"
                    fill="#059669"
                  />
                  <path
                    d="M20 26C20 26 27 24 29 18C31 12 25 9 25 9C25 9 23 16 19 21C18.5 21.6 18 22.2 18 22.2"
                    fill="#34D399"
                  />
                  <path
                    d="M18 25V30"
                    stroke="#059669"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              {/* Text logo */}
              <div className="flex flex-col">
                <span className="font-extrabold text-lg sm:text-xl text-[#075C3B] dark:text-[#34D399] tracking-tight group-hover:text-[#05482E] dark:group-hover:text-[#6EE7B7] transition-colors leading-none">
                  AgriMarket
                </span>
                <span className="text-[9px] sm:text-[10px] text-[#4B6B58] dark:text-[#8BB39F] font-medium tracking-wider uppercase mt-0.5 sm:mt-1">
                  Fresh Farm Network
                </span>
              </div>
            </button>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            {navItems.map((item) => {
              const isActive = activeTab === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => handleNavClick(item)}
                  className={`px-3 py-2 text-sm font-semibold rounded-lg transition-colors cursor-pointer ${
                    isActive
                      ? 'text-[#075C3B] dark:text-[#34D399] bg-[#E8F5E9] dark:bg-[#18352A]'
                      : 'text-[#4B5563] dark:text-[#A7BFB2] hover:text-[#075C3B] dark:hover:text-[#34D399] hover:bg-slate-50 dark:hover:bg-[#13271F]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Desktop Right Side: Theme Toggle + Cart + Primary CTA (Browse Produce removed) */}
          <div className="hidden lg:flex items-center gap-3 shrink-0">
            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Cart Button */}
            <button
              onClick={onOpenCart}
              className="relative p-2.5 text-[#374151] dark:text-[#C5DED2] hover:text-[#075C3B] dark:hover:text-[#34D399] transition-colors cursor-pointer rounded-xl hover:bg-[#E8F5E9] dark:hover:bg-[#18352A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#075C3B]"
              aria-label={`Shopping cart with ${cartCount} items`}
            >
              <ShoppingBag className="w-5 h-5 stroke-[2]" />
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#075C3B] dark:bg-[#10B981] text-white text-[10px] font-bold flex items-center justify-center animate-scale">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Primary Action: Start Selling */}
            <button
              onClick={() => onScrollTo('cta')}
              className="px-5 py-2.5 rounded-full bg-[#075C3B] hover:bg-[#05482E] active:bg-[#043B26] dark:bg-[#10B981] dark:hover:bg-[#059669] text-white text-xs sm:text-sm font-semibold shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>Start Selling</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile Right Side: Theme Toggle + Cart Button + Mobile Menu Trigger */}
          <div className="lg:hidden flex items-center gap-1.5 sm:gap-2">
            <ThemeToggle />

            <button
              onClick={onOpenCart}
              className="relative w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-[#075C3B] dark:text-[#34D399] hover:bg-[#E8F5E9] dark:hover:bg-[#18352A] rounded-xl cursor-pointer transition-all"
              aria-label={`Open Cart (${cartCount} items)`}
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#075C3B] dark:bg-[#10B981] text-white text-[10px] font-bold flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>

            <button
              type="button"
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl text-[#075C3B] dark:text-[#34D399] hover:bg-[#E8F5E9] dark:hover:bg-[#18352A] transition-all cursor-pointer"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 stroke-[2.2]" />
              ) : (
                <Menu className="w-6 h-6 stroke-[2.2]" />
              )}
            </button>
          </div>

        </div>
      </div>
    </header>

    {/* Mobile Drawer — fixed overlay, outside <header> so it never shifts page content */}
    {mobileMenuOpen && (
      <div
        className="lg:hidden fixed inset-0 z-40 flex flex-col"
        aria-modal="true"
        role="dialog"
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/30 backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />

        {/* Drawer panel — slides down from below the fixed header */}
        <div className="relative mt-16 sm:mt-20 mx-0 bg-white dark:bg-[#0E1B17] border-t border-[#E5EDE4] dark:border-[#1E3A2F] shadow-2xl overflow-y-auto max-h-[calc(100vh-4rem)] transition-colors">
          <div className="px-4 pt-3 pb-6 space-y-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => handleNavClick(item)}
                  className={`w-full flex items-center justify-between py-3 px-3.5 rounded-xl text-left transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[#E8F5E9] dark:bg-[#1A382C] text-[#075C3B] dark:text-[#34D399] font-bold'
                      : 'text-[#11382B] dark:text-[#D5E8DC] hover:bg-[#F3F9F5] dark:hover:bg-[#142A22] font-semibold'
                  }`}
                >
                  <span className="text-sm">{item.label}</span>
                  <ChevronRight className="w-4 h-4 text-[#9CA3AF] dark:text-[#5F8372]" />
                </button>
              );
            })}

            <div className="pt-3 border-t border-[#E5EDE4] dark:border-[#1E3A2F] mt-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onScrollTo('cta');
                }}
                className="w-full py-3 text-center text-sm font-bold rounded-xl bg-[#075C3B] dark:bg-[#10B981] hover:bg-[#05482E] text-white shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Start Selling as a Farmer</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
};
