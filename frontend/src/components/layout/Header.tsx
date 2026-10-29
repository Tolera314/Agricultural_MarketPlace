'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  ArrowRight,
  ChevronRight,
  Menu,
  X,
  LayoutDashboard,
  LogOut,
  User,
  Shield,
  Truck,
  Tractor,
  Sparkles,
} from 'lucide-react';
import { MarketLocation } from '@/types';
import { ThemeToggle } from './ThemeToggle';
import { useAuth } from '@/context/AuthContext';

interface HeaderProps {
  currentLocation: MarketLocation;
  cartCount: number;
  onOpenCart: () => void;
  onScrollTo: (sectionId: string) => void;
}

export type NavItemKey = 'home' | 'categories' | 'products' | 'how-it-works' | 'intercity' | 'about';

function getRoleDashboardUrl(role?: string): string {
  if (role === 'FARMER') return '/dashboard/farmer';
  if (role === 'DELIVERY_WORKER') return '/dashboard/worker';
  if (role === 'ADMIN' || role === 'SUPERADMIN') return '/dashboard/admin';
  return '/dashboard/buyer';
}

function getRoleLabel(role?: string): string {
  if (role === 'FARMER') return 'Farmer Hub';
  if (role === 'DELIVERY_WORKER') return 'Courier Hub';
  if (role === 'SUPERADMIN') return 'SuperAdmin';
  if (role === 'ADMIN') return 'Admin Console';
  return 'My Dashboard';
}

function getRoleIcon(role?: string) {
  if (role === 'FARMER') return <Tractor className="w-3.5 h-3.5" />;
  if (role === 'DELIVERY_WORKER') return <Truck className="w-3.5 h-3.5" />;
  if (role === 'ADMIN' || role === 'SUPERADMIN') return <Shield className="w-3.5 h-3.5" />;
  return <LayoutDashboard className="w-3.5 h-3.5" />;
}

export const Header: React.FC<HeaderProps> = ({
  cartCount,
  onOpenCart,
  onScrollTo,
}) => {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<NavItemKey>('home');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close user dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    if (userDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userDropdownOpen]);

  // Close mobile drawer and dropdown when pressing Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (mobileMenuOpen) setMobileMenuOpen(false);
        if (userDropdownOpen) setUserDropdownOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen, userDropdownOpen]);

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
    { key: 'home', label: 'Home', sectionId: 'hero' },
    { key: 'categories', label: 'Categories', sectionId: 'categories' },
    { key: 'products', label: 'Products', sectionId: 'products' },
    { key: 'how-it-works', label: 'How It Works', sectionId: 'how-it-works' },
    { key: 'intercity', label: 'Intercity Trade', sectionId: 'intercity-trade' },
    { key: 'about', label: 'About', sectionId: 'about' },
  ];

  const handleNavClick = (item: (typeof navItems)[0]) => {
    setActiveTab(item.key);
    onScrollTo(item.sectionId);
    setMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    setUserDropdownOpen(false);
    setMobileMenuOpen(false);
    await logout();
  };

  const userInitials = user?.fullName
    ? user.fullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'U';

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

            {/* Desktop Right Side: Theme Toggle + Cart + Auth-Aware Actions */}
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

              {/* Authentication State Awareness */}
              {isLoading ? (
                // Smooth non-flicker loading placeholder
                <div className="w-28 h-9 rounded-full bg-slate-100 dark:bg-[#18352A] animate-pulse" />
              ) : isAuthenticated && user ? (
                // Authenticated: Dashboard Link + User Dropdown
                <div className="flex items-center gap-2" ref={dropdownRef}>
                  <Link
                    href={getRoleDashboardUrl(user.role)}
                    className="px-4 py-2 rounded-full bg-[#E8F5E9] hover:bg-[#DCEDDF] dark:bg-[#18352A] dark:hover:bg-[#1E4335] text-[#075C3B] dark:text-[#34D399] text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs"
                  >
                    {getRoleIcon(user.role)}
                    <span>{getRoleLabel(user.role)}</span>
                  </Link>

                  {/* User Profile Avatar & Dropdown Trigger */}
                  <div className="relative">
                    <button
                      onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                      className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-600 to-teal-800 text-white font-bold text-xs flex items-center justify-center shadow-xs hover:ring-2 hover:ring-emerald-500/50 transition-all cursor-pointer"
                      aria-label="User account menu"
                    >
                      {userInitials}
                    </button>

                    {/* Dropdown Menu */}
                    {userDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-[#0E1E17] border border-[#DEECE2] dark:border-[#1E3A2F] shadow-xl py-2 z-50 text-left animate-in fade-in zoom-in-95 duration-100">
                        <div className="px-4 py-2 border-b border-[#F0F5F2] dark:border-[#18352A]">
                          <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                            {user.fullName}
                          </p>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                            {user.phone || user.email}
                          </p>
                          <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            {user.role}
                          </span>
                        </div>

                        <div className="py-1">
                          <Link
                            href={getRoleDashboardUrl(user.role)}
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-[#F3F9F5] dark:hover:bg-[#163025] transition-colors"
                          >
                            <LayoutDashboard className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>Dashboard</span>
                          </Link>

                          <Link
                            href="/dashboard/buyer"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-[#F3F9F5] dark:hover:bg-[#163025] transition-colors"
                          >
                            <User className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>My Orders & Profile</span>
                          </Link>
                        </div>

                        <div className="border-t border-[#F0F5F2] dark:border-[#18352A] pt-1">
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-2 px-4 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors text-left cursor-pointer"
                          >
                            <LogOut className="w-3.5 h-3.5" />
                            <span>Sign Out</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                // Unauthenticated: Primary Action: Log In
                <div className="flex items-center gap-2">
                  <Link
                    href="/login"
                    className="px-5 py-2.5 rounded-full bg-[#075C3B] hover:bg-[#05482E] active:bg-[#043B26] dark:bg-[#10B981] dark:hover:bg-[#059669] text-white text-xs sm:text-sm font-semibold shadow-xs hover:shadow-md transition-all flex items-center gap-1.5"
                  >
                    <span>Log In</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              )}
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

      {/* Mobile Drawer */}
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

          {/* Drawer panel */}
          <div className="relative mt-16 sm:mt-20 mx-0 bg-white dark:bg-[#0E1B17] border-t border-[#E5EDE4] dark:border-[#1E3A2F] shadow-2xl overflow-y-auto max-h-[calc(100vh-4rem)] transition-colors">
            <div className="px-4 pt-3 pb-6 space-y-1">
              {/* Authenticated user identity ribbon in mobile drawer */}
              {isAuthenticated && user && (
                <div className="mb-3 p-3 rounded-2xl bg-[#E8F5E9] dark:bg-[#18352A] border border-[#DEECE2] dark:border-[#214738] flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-emerald-700 text-white font-bold text-xs flex items-center justify-center">
                      {userInitials}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900 dark:text-white leading-tight">
                        {user.fullName}
                      </p>
                      <span className="text-[10px] font-extrabold uppercase text-emerald-700 dark:text-emerald-300">
                        {user.role}
                      </span>
                    </div>
                  </div>
                  <Link
                    href={getRoleDashboardUrl(user.role)}
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-xs font-bold text-emerald-700 dark:text-emerald-300 underline"
                  >
                    Dashboard
                  </Link>
                </div>
              )}

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

              <div className="pt-3 border-t border-[#E5EDE4] dark:border-[#1E3A2F] mt-2 space-y-2">
                {isAuthenticated && user ? (
                  <button
                    onClick={handleLogout}
                    className="w-full py-3 text-center text-sm font-bold rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="py-3 text-center text-xs sm:text-sm font-bold rounded-xl bg-[#075C3B] dark:bg-[#10B981] hover:bg-[#05482E] text-white shadow-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <span>Log In</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                    <Link
                      href="/signup"
                      onClick={() => setMobileMenuOpen(false)}
                      className="py-3 text-center text-xs sm:text-sm font-bold rounded-xl border border-[#075C3B] dark:border-[#10B981] text-[#075C3B] dark:text-[#34D399] hover:bg-[#E8F5E9] dark:hover:bg-[#18352A] transition-colors flex items-center justify-center gap-1.5"
                    >
                      <span>Register</span>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
