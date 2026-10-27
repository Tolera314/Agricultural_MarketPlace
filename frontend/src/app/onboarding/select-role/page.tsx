'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Shield,
  Lightbulb,
  Info,
  Check,
  Search,
  Bell,
  User as UserIcon,
  Menu,
  X,
  Loader2,
  AlertCircle,
  FileText,
  CheckCircle2,
  ShieldCheck,
  Store,
  ChevronRight,
} from 'lucide-react';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { onboardingApi } from '@/lib/onboardingApi';
import {
  FarmerIllustration,
  DeliveryWorkerIllustration,
  BuyerIllustration,
  RadiantSuccessBadge,
  BuyerSuccessBasket,
  DecorativeBotanicalFoliage,
} from '@/components/onboarding/OnboardingIllustrations';

export default function SelectRolePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [submittingRole, setSubmittingRole] = useState<'FARMER' | 'DELIVERY_WORKER' | 'BUYER' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showBuyerSuccessModal, setShowBuyerSuccessModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    async function checkStatus() {
      try {
        const status = await onboardingApi.getStatus();

        // If user already finished onboarding
        if (status.onboardingStatus === 'COMPLETED') {
          if (status.role === 'FARMER') router.replace('/dashboard/farmer');
          else if (status.role === 'DELIVERY_WORKER') router.replace('/dashboard/worker');
          else if (status.role === 'ADMIN' || status.role === 'SUPERADMIN') router.replace('/dashboard/admin');
          else router.replace('/dashboard/buyer');
          return;
        }

        // If in verification review
        if (status.onboardingStatus === 'PENDING_VERIFICATION') {
          if (status.role === 'FARMER') router.replace('/dashboard/farmer/verification-status');
          else if (status.role === 'DELIVERY_WORKER') router.replace('/dashboard/worker/verification-status');
          return;
        }

        // If already selected role and filling wizard
        if (status.onboardingStatus === 'IN_PROGRESS') {
          if (status.role === 'FARMER') router.replace('/onboarding/farmer');
          else if (status.role === 'DELIVERY_WORKER') router.replace('/onboarding/worker');
          return;
        }

        setLoading(false);
      } catch (err) {
        // Allow unauthenticated preview / graceful degradation
        setLoading(false);
      }
    }

    checkStatus();
  }, [router]);

  const handleSelectRole = async (role: 'FARMER' | 'DELIVERY_WORKER' | 'BUYER') => {
    setSubmittingRole(role);
    setErrorMessage(null);

    try {
      await onboardingApi.selectRole(role);
    } catch (err: any) {
      console.warn('selectRole warning (continuing with navigation):', err?.message);
    }

    if (role === 'BUYER') {
      // Show Image 1 #4: Buyer Onboarding (Direct Access)
      setShowBuyerSuccessModal(true);
      setSubmittingRole(null);
    } else if (role === 'FARMER') {
      router.push('/onboarding/farmer');
    } else if (role === 'DELIVERY_WORKER') {
      router.push('/onboarding/worker');
    }
  };

  const handleGoToBuyerDashboard = () => {
    router.push('/dashboard/buyer');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#07130D] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600 dark:text-emerald-400" />
        <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Loading your profile setup...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#07130D] text-[#1D2B22] dark:text-[#E6F4ED] flex flex-col font-sans transition-colors duration-200">
      
      {/* ============================================================== */}
      {/* 1. TOP NAVIGATION BAR (As shown in Image 2)                    */}
      {/* ============================================================== */}
      <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-[#0A1812]/95 backdrop-blur-md border-b border-[#E8EFEA] dark:border-[#1A3326] transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          
          {/* Top Left: AgriMarket Brand */}
          <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group">
            <div className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center shrink-0">
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

            <div className="flex flex-col">
              <span className="font-extrabold text-xl sm:text-2xl text-[#075C3B] dark:text-[#34D399] tracking-tight group-hover:text-[#05462D] dark:group-hover:text-[#6EE7B7] transition-colors leading-none">
                AgriMarket
              </span>
              <span className="text-[10px] sm:text-[11px] text-[#476C57] dark:text-[#88B8A0] font-semibold tracking-wide uppercase mt-0.5">
                Farmers · Buyers · Better Tomorrow
              </span>
            </div>
          </Link>

          {/* Desktop Center Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-[#305341] dark:text-[#A7CEBC]">
            <Link href="/" className="hover:text-[#075C3B] dark:hover:text-[#34D399] transition-colors">
              Home
            </Link>
            <Link href="/dashboard/buyer" className="hover:text-[#075C3B] dark:hover:text-[#34D399] transition-colors">
              Products
            </Link>
            <Link href="/farmers" className="hover:text-[#075C3B] dark:hover:text-[#34D399] transition-colors">
              Farmers
            </Link>
            <Link href="/about" className="hover:text-[#075C3B] dark:hover:text-[#34D399] transition-colors">
              About
            </Link>
          </nav>

          {/* Right Action Icons & Theme Toggle */}
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              type="button"
              className="p-2 rounded-xl text-[#305341] dark:text-[#A7CEBC] hover:bg-emerald-50 dark:hover:bg-[#132A20] transition-colors hidden sm:flex items-center justify-center"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>
            <button
              type="button"
              className="p-2 rounded-xl text-[#305341] dark:text-[#A7CEBC] hover:bg-emerald-50 dark:hover:bg-[#132A20] transition-colors hidden sm:flex items-center justify-center relative"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              <span className="w-2 h-2 rounded-full bg-emerald-500 absolute top-2 right-2 ring-2 ring-white dark:ring-[#0A1812]" />
            </button>
            <div className="hidden sm:flex items-center justify-center w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-700 text-[#075C3B] dark:text-[#34D399] font-bold text-sm">
              <UserIcon className="w-4 h-4" />
            </div>

            <ThemeToggle />

            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-[#075C3B] dark:text-[#34D399] hover:bg-emerald-50 dark:hover:bg-[#132A20] transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>

        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[#E8EFEA] dark:border-[#1A3326] bg-white dark:bg-[#0A1812] px-4 py-3 space-y-2">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-[#305341] dark:text-[#A7CEBC] hover:text-[#075C3B]"
            >
              Home
            </Link>
            <Link
              href="/dashboard/buyer"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-[#305341] dark:text-[#A7CEBC] hover:text-[#075C3B]"
            >
              Products
            </Link>
            <Link
              href="/farmers"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-[#305341] dark:text-[#A7CEBC] hover:text-[#075C3B]"
            >
              Farmers
            </Link>
            <Link
              href="/about"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-[#305341] dark:text-[#A7CEBC] hover:text-[#075C3B]"
            >
              About
            </Link>
          </div>
        )}
      </header>

      {/* ============================================================== */}
      {/* 2. MAIN HERO SECTION (Exact layout from Image 2)               */}
      {/* ============================================================== */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10">
        
        {/* Error notification if any */}
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-center gap-3 text-rose-700 dark:text-rose-300 text-sm font-semibold">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* ------------------------------------------------------------ */}
        {/* TOP STATUS HERO: Radiant Check Badge, Heading, Subtitle      */}
        {/* ------------------------------------------------------------ */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          {/* Centered Radiant Success Badge */}
          <div className="flex justify-center">
            <RadiantSuccessBadge size={84} />
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#0D3823] dark:text-[#EEFAF3] tracking-tight">
            Your account has been created successfully!
          </h1>

          <p className="text-sm sm:text-base text-[#4C725E] dark:text-[#90B8A3] leading-relaxed max-w-2xl mx-auto font-medium">
            Welcome to AgriMarket. Before you start, please choose how you want to use the platform. This helps us give you the right experience and access to the features you need.
          </p>
        </div>

        {/* ------------------------------------------------------------ */}
        {/* 3 ROLE CARDS (Exact match from Image 2)                       */}
        {/* ------------------------------------------------------------ */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          
          {/* CARD 1: Farmer */}
          <div className="bg-white dark:bg-[#0A1A12] border border-[#DEECE2] dark:border-[#1A3F2E] rounded-3xl p-6 sm:p-7 shadow-sm hover:shadow-xl hover:border-emerald-400 dark:hover:border-emerald-600 transition-all duration-200 flex flex-col justify-between text-center group">
            <div className="space-y-4 flex flex-col items-center">
              {/* Illustration in circle */}
              <div className="p-1 transform group-hover:scale-105 transition-transform">
                <FarmerIllustration size={80} />
              </div>

              <div className="space-y-1.5">
                <h2 className="text-xl font-bold text-[#0D3823] dark:text-[#EEFAF3]">
                  Farmer
                </h2>
                <p className="text-xs sm:text-sm text-[#507662] dark:text-[#97BFA9] leading-relaxed">
                  Sell your agricultural products directly to buyers.
                </p>
              </div>
            </div>

            <div className="pt-6">
              <button
                type="button"
                onClick={() => handleSelectRole('FARMER')}
                disabled={submittingRole !== null}
                className="w-full py-3 px-5 rounded-xl bg-[#075C3B] hover:bg-[#05462D] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-950/15 active:scale-[0.99] disabled:opacity-70 transition-all cursor-pointer"
              >
                {submittingRole === 'FARMER' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Opening Form...</span>
                  </>
                ) : (
                  <>
                    <span>Continue as Farmer</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* CARD 2: Delivery Worker */}
          <div className="bg-white dark:bg-[#0A1A12] border border-[#DEECE2] dark:border-[#1A3F2E] rounded-3xl p-6 sm:p-7 shadow-sm hover:shadow-xl hover:border-emerald-400 dark:hover:border-emerald-600 transition-all duration-200 flex flex-col justify-between text-center group">
            <div className="space-y-4 flex flex-col items-center">
              {/* Illustration in circle */}
              <div className="p-1 transform group-hover:scale-105 transition-transform">
                <DeliveryWorkerIllustration size={80} />
              </div>

              <div className="space-y-1.5">
                <h2 className="text-xl font-bold text-[#0D3823] dark:text-[#EEFAF3]">
                  Delivery Worker
                </h2>
                <p className="text-xs sm:text-sm text-[#507662] dark:text-[#97BFA9] leading-relaxed">
                  Deliver agricultural orders and earn through delivery work.
                </p>
              </div>
            </div>

            <div className="pt-6">
              <button
                type="button"
                onClick={() => handleSelectRole('DELIVERY_WORKER')}
                disabled={submittingRole !== null}
                className="w-full py-3 px-5 rounded-xl bg-[#075C3B] hover:bg-[#05462D] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-950/15 active:scale-[0.99] disabled:opacity-70 transition-all cursor-pointer"
              >
                {submittingRole === 'DELIVERY_WORKER' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Opening Form...</span>
                  </>
                ) : (
                  <>
                    <span>Continue as Delivery Worker</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* CARD 3: Customer / Buyer */}
          <div className="bg-white dark:bg-[#0A1A12] border border-[#DEECE2] dark:border-[#1A3F2E] rounded-3xl p-6 sm:p-7 shadow-sm hover:shadow-xl hover:border-emerald-400 dark:hover:border-emerald-600 transition-all duration-200 flex flex-col justify-between text-center group">
            <div className="space-y-4 flex flex-col items-center">
              {/* Illustration in circle */}
              <div className="p-1 transform group-hover:scale-105 transition-transform">
                <BuyerIllustration size={80} />
              </div>

              <div className="space-y-1.5">
                <h2 className="text-xl font-bold text-[#0D3823] dark:text-[#EEFAF3]">
                  Customer / Buyer
                </h2>
                <p className="text-xs sm:text-sm text-[#507662] dark:text-[#97BFA9] leading-relaxed">
                  Discover fresh agricultural products and order directly from farmers.
                </p>
              </div>
            </div>

            <div className="pt-6">
              <button
                type="button"
                onClick={() => handleSelectRole('BUYER')}
                disabled={submittingRole !== null}
                className="w-full py-3 px-5 rounded-xl bg-[#075C3B] hover:bg-[#05462D] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-950/15 active:scale-[0.99] disabled:opacity-70 transition-all cursor-pointer"
              >
                {submittingRole === 'BUYER' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Activating Access...</span>
                  </>
                ) : (
                  <>
                    <span>Continue as Buyer</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>

        </div>

        {/* ------------------------------------------------------------ */}
        {/* LOWER SECTION: What Happens Next? & Key Points (Image 2)     */}
        {/* ------------------------------------------------------------ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4">
          
          {/* Left Panel: What Happens Next? (8 cols) */}
          <div className="lg:col-span-7 bg-white dark:bg-[#0A1A12] border border-[#DEECE2] dark:border-[#1A3F2E] rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col justify-between space-y-6">
            <div className="space-y-6">
              {/* Pill Tag */}
              <div className="inline-flex items-center px-3.5 py-1.5 rounded-full bg-[#EAF5EE] dark:bg-[#143325] border border-[#B8D8C5] dark:border-[#204936] text-[#075C3B] dark:text-[#34D399] text-xs font-bold">
                <span>What Happens Next?</span>
              </div>

              {/* 4-Step Sequence */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 sm:gap-2 relative items-start">
                
                {/* Step 1: Account Created */}
                <div className="flex sm:flex-col items-center sm:items-center text-left sm:text-center gap-3 sm:gap-2 group">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-[#075C3B] dark:text-[#34D399] flex items-center justify-center font-bold text-sm shrink-0">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-[#0D3823] dark:text-[#EEFAF3]">
                      Account Created
                    </h3>
                    <p className="text-[11px] sm:text-xs text-[#527563] dark:text-[#90B8A3] leading-snug">
                      You&apos;ve successfully signed up.
                    </p>
                  </div>
                </div>

                {/* Arrow connector 1 (hidden on mobile) */}
                <div className="hidden sm:flex items-center justify-center text-gray-300 dark:text-gray-700 absolute top-5 left-[22%] -translate-x-1/2 pointer-events-none">
                  <ArrowRight className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
                </div>

                {/* Step 2: Choose Your Role */}
                <div className="flex sm:flex-col items-center sm:items-center text-left sm:text-center gap-3 sm:gap-2 group">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-[#075C3B] dark:text-[#34D399] flex items-center justify-center font-bold text-sm shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-[#0D3823] dark:text-[#EEFAF3]">
                      Choose Your Role
                    </h3>
                    <p className="text-[11px] sm:text-xs text-[#527563] dark:text-[#90B8A3] leading-snug">
                      Select how you want to use AgriMarket.
                    </p>
                  </div>
                </div>

                {/* Arrow connector 2 */}
                <div className="hidden sm:flex items-center justify-center text-gray-300 dark:text-gray-700 absolute top-5 left-[48%] -translate-x-1/2 pointer-events-none">
                  <ArrowRight className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
                </div>

                {/* Step 3: Complete Your Profile */}
                <div className="flex sm:flex-col items-center sm:items-center text-left sm:text-center gap-3 sm:gap-2 group">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-[#075C3B] dark:text-[#34D399] flex items-center justify-center font-bold text-sm shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-[#0D3823] dark:text-[#EEFAF3]">
                      Complete Your Profile
                    </h3>
                    <p className="text-[11px] sm:text-xs text-[#527563] dark:text-[#90B8A3] leading-snug">
                      If needed, fill in your details for verification.
                    </p>
                  </div>
                </div>

                {/* Arrow connector 3 */}
                <div className="hidden sm:flex items-center justify-center text-gray-300 dark:text-gray-700 absolute top-5 left-[75%] -translate-x-1/2 pointer-events-none">
                  <ArrowRight className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
                </div>

                {/* Step 4: Access Your Dashboard */}
                <div className="flex sm:flex-col items-center sm:items-center text-left sm:text-center gap-3 sm:gap-2 group">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-[#075C3B] dark:text-[#34D399] flex items-center justify-center font-bold text-sm shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-[#0D3823] dark:text-[#EEFAF3]">
                      Access Your Dashboard
                    </h3>
                    <p className="text-[11px] sm:text-xs text-[#527563] dark:text-[#90B8A3] leading-snug">
                      Start using AgriMarket based on your role.
                    </p>
                  </div>
                </div>

              </div>
            </div>

            {/* Bottom Callout: Why do we ask this? */}
            <div className="p-3.5 rounded-2xl bg-[#F0F7F2] dark:bg-[#122A1E] border border-[#DEECE2] dark:border-[#1E4130] flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-[#075C3B] dark:text-[#34D399] flex items-center justify-center shrink-0 mt-0.5">
                <Info className="w-3.5 h-3.5" />
              </div>
              <div className="space-y-0.5 text-xs text-[#315643] dark:text-[#9EC4AF]">
                <span className="font-bold text-[#0D3823] dark:text-[#EEFAF3] block">
                  Why do we ask this?
                </span>
                <span>
                  This helps us provide a safer marketplace, better service, and the right features for your role.
                </span>
              </div>
            </div>
          </div>

          {/* Right Panel: Key Points & Security (5 cols) */}
          <div className="lg:col-span-5 space-y-4 flex flex-col justify-between">
            
            {/* Top Card: Key Points */}
            <div className="bg-white dark:bg-[#0A1A12] border border-[#DEECE2] dark:border-[#1A3F2E] rounded-3xl p-6 shadow-sm space-y-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#EAF5EE] dark:bg-[#143325] border border-[#B8D8C5] dark:border-[#204936] text-[#075C3B] dark:text-[#34D399] flex items-center justify-center shrink-0">
                  <Lightbulb className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-[#0D3823] dark:text-[#EEFAF3]">
                  Key Points
                </h3>
              </div>

              <ul className="space-y-2.5 text-xs text-[#446A55] dark:text-[#97BFA9]">
                <li className="flex items-start gap-2.5">
                  <div className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-2.5 h-2.5" />
                  </div>
                  <span>You only need to choose one role.</span>
                </li>

                <li className="flex items-start gap-2.5">
                  <div className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-2.5 h-2.5" />
                  </div>
                  <span>Farmers and delivery workers will complete a profile and verification process.</span>
                </li>

                <li className="flex items-start gap-2.5">
                  <div className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-2.5 h-2.5" />
                  </div>
                  <span>Customers / Buyers can go directly to the buyer dashboard.</span>
                </li>

                <li className="flex items-start gap-2.5">
                  <div className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-2.5 h-2.5" />
                  </div>
                  <span>You can change or finish your onboarding later if needed.</span>
                </li>
              </ul>
            </div>

            {/* Bottom Card: Your information is safe */}
            <div className="bg-[#EAF5EE] dark:bg-[#10271C] border border-[#B8D8C5] dark:border-[#1E4B35] rounded-3xl p-5 shadow-xs flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-white dark:bg-[#163828] border border-[#A4CAA7] dark:border-[#275A41] text-[#075C3B] dark:text-[#34D399] flex items-center justify-center shrink-0 shadow-xs">
                <Shield className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <h4 className="font-bold text-xs sm:text-sm text-[#075C3B] dark:text-[#34D399]">
                  Your information is safe
                </h4>
                <p className="text-[11px] sm:text-xs text-[#355845] dark:text-[#90B8A3] leading-relaxed">
                  We follow strict security and privacy standards to protect your data.
                </p>
              </div>
            </div>

          </div>

        </div>

      </main>

      {/* ============================================================== */}
      {/* 4. BUYER ONBOARDING (DIRECT ACCESS) MODAL (Image 1 #4)         */}
      {/* ============================================================== */}
      {showBuyerSuccessModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="relative w-full max-w-md bg-white dark:bg-[#0A1A12] border border-[#E3EAE5] dark:border-[#163D2F] rounded-3xl shadow-2xl p-6 sm:p-8 text-center space-y-6 overflow-hidden transition-all">
            
            {/* Basket Illustration */}
            <div className="flex justify-center pt-2">
              <BuyerSuccessBasket size={120} />
            </div>

            {/* Content */}
            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-black text-[#0D3823] dark:text-[#EEFAF3] tracking-tight">
                You&apos;re all set!
              </h2>
              <p className="text-xs sm:text-sm text-[#507662] dark:text-[#97BFA9] leading-relaxed max-w-xs mx-auto">
                Your buyer account has been created successfully. You can now start shopping on AgriMarket.
              </p>
            </div>

            {/* Primary Action Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleGoToBuyerDashboard}
                className="w-full py-3.5 px-6 rounded-xl bg-[#075C3B] hover:bg-[#05462D] text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/20 active:scale-[0.99] transition-all cursor-pointer"
              >
                <span>Go to Buyer Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Botanical Foliage Border Decoration (Image 1 #4) */}
            <DecorativeBotanicalFoliage className="mt-4 -mx-8 -mb-8" />

          </div>
        </div>
      )}

    </div>
  );
}
