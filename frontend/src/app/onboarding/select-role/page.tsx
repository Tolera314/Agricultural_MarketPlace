'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Shield,
  Check,
  Loader2,
  AlertCircle,
  ShieldCheck,
  Sprout,
  Truck,
  ShoppingBag,
  CheckCircle2,
} from 'lucide-react';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { onboardingApi } from '@/lib/onboardingApi';

export default function SelectRolePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [submittingRole, setSubmittingRole] = useState<'FARMER' | 'DELIVERY_WORKER' | 'BUYER' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showBuyerSuccessModal, setShowBuyerSuccessModal] = useState(false);

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
      <div className="h-screen bg-[#FAF8F5] dark:bg-[#07130D] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600 dark:text-emerald-400" />
        <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Loading role selection...</p>
      </div>
    );
  }

  return (
    <div className="h-screen max-h-screen overflow-hidden bg-[#FAF8F5] dark:bg-[#07130D] text-[#1D2B22] dark:text-[#E6F4ED] flex flex-col justify-between font-sans transition-colors duration-200">
      
      {/* ============================================================== */}
      {/* 1. TOP NAVBAR: Only brand name at left & theme toggle at right */}
      {/* ============================================================== */}
      <header className="shrink-0 w-full bg-white/95 dark:bg-[#0A1812]/95 backdrop-blur-md border-b border-[#E8EFEA] dark:border-[#1A3326]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between">
          
          {/* Top Left: AgriMarket Brand */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center shrink-0">
              <svg
                className="w-7 h-7 sm:w-8 sm:h-8"
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
              <span className="font-extrabold text-lg sm:text-xl text-[#075C3B] dark:text-[#34D399] tracking-tight group-hover:text-[#05462D] dark:group-hover:text-[#6EE7B7] transition-colors leading-none">
                AgriMarket
              </span>
              <span className="text-[9px] sm:text-[10px] text-[#476C57] dark:text-[#88B8A0] font-semibold tracking-wide uppercase mt-0.5">
                Farmers · Buyers · Better Tomorrow
              </span>
            </div>
          </Link>

          {/* Top Right: Theme Toggle ONLY */}
          <div className="flex items-center">
            <ThemeToggle />
          </div>

        </div>
      </header>

      {/* ============================================================== */}
      {/* 2. ONBOARDING MAIN CONTENT (Compact, Non-Scrollable Layout)     */}
      {/* ============================================================== */}
      <main className="flex-1 flex flex-col justify-center max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-4">
        
        {/* Error notification if any */}
        {errorMessage && (
          <div className="mb-3 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-center gap-2.5 text-rose-700 dark:text-rose-300 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* ------------------------------------------------------------ */}
        {/* ONBOARDING HEADER (Clear purpose without duplicate signup greeting) */}
        {/* ------------------------------------------------------------ */}
        <div className="text-center space-y-1.5 sm:space-y-2 mb-4 sm:mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Onboarding & Profile Setup</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0D3823] dark:text-[#EEFAF3] tracking-tight leading-tight">
            Choose Your Marketplace Role
          </h1>

          <p className="text-xs sm:text-sm text-[#4C725E] dark:text-[#90B8A3] leading-relaxed max-w-xl mx-auto font-medium">
            Select how you would like to participate in AgriMarket. Each account type is customized with specific tools and workflows for your activities.
          </p>
        </div>

        {/* ------------------------------------------------------------ */}
        {/* 3 ROLE CARDS (Clean Vector Icons, No Images, Fits Viewport)   */}
        {/* ------------------------------------------------------------ */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          
          {/* CARD 1: Farmer */}
          <div className="bg-white dark:bg-[#0A1A12] border border-[#DEECE2] dark:border-[#1A3F2E] rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-sm hover:shadow-xl hover:border-emerald-400 dark:hover:border-emerald-600 transition-all duration-200 flex flex-col justify-between text-center group">
            <div className="space-y-3 flex flex-col items-center">
              {/* Clean Icon Badge */}
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-[#075C3B] dark:text-[#34D399] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                <Sprout className="w-7 h-7 sm:w-8 sm:h-8" />
              </div>

              <div className="space-y-1">
                <h2 className="text-lg sm:text-xl font-bold text-[#0D3823] dark:text-[#EEFAF3]">
                  Farmer
                </h2>
                <p className="text-xs text-[#507662] dark:text-[#97BFA9] leading-relaxed">
                  List harvest produce, set direct farm prices, and connect with local buyers.
                </p>
              </div>
            </div>

            <div className="pt-4 sm:pt-5">
              <button
                type="button"
                onClick={() => handleSelectRole('FARMER')}
                disabled={submittingRole !== null}
                className="w-full py-2.5 sm:py-3 px-4 rounded-xl bg-[#075C3B] hover:bg-[#05462D] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-950/15 active:scale-[0.99] disabled:opacity-70 transition-all cursor-pointer"
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
          <div className="bg-white dark:bg-[#0A1A12] border border-[#DEECE2] dark:border-[#1A3F2E] rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-sm hover:shadow-xl hover:border-emerald-400 dark:hover:border-emerald-600 transition-all duration-200 flex flex-col justify-between text-center group">
            <div className="space-y-3 flex flex-col items-center">
              {/* Clean Icon Badge */}
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-[#075C3B] dark:text-[#34D399] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                <Truck className="w-7 h-7 sm:w-8 sm:h-8" />
              </div>

              <div className="space-y-1">
                <h2 className="text-lg sm:text-xl font-bold text-[#0D3823] dark:text-[#EEFAF3]">
                  Delivery Worker
                </h2>
                <p className="text-xs text-[#507662] dark:text-[#97BFA9] leading-relaxed">
                  Accept farm dispatch jobs, earn per trip, and track live delivery routes.
                </p>
              </div>
            </div>

            <div className="pt-4 sm:pt-5">
              <button
                type="button"
                onClick={() => handleSelectRole('DELIVERY_WORKER')}
                disabled={submittingRole !== null}
                className="w-full py-2.5 sm:py-3 px-4 rounded-xl bg-[#075C3B] hover:bg-[#05462D] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-950/15 active:scale-[0.99] disabled:opacity-70 transition-all cursor-pointer"
              >
                {submittingRole === 'DELIVERY_WORKER' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Opening Form...</span>
                  </>
                ) : (
                  <>
                    <span>Continue as Courier</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* CARD 3: Customer / Buyer */}
          <div className="bg-white dark:bg-[#0A1A12] border border-[#DEECE2] dark:border-[#1A3F2E] rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-sm hover:shadow-xl hover:border-emerald-400 dark:hover:border-emerald-600 transition-all duration-200 flex flex-col justify-between text-center group">
            <div className="space-y-3 flex flex-col items-center">
              {/* Clean Icon Badge */}
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-[#075C3B] dark:text-[#34D399] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                <ShoppingBag className="w-7 h-7 sm:w-8 sm:h-8" />
              </div>

              <div className="space-y-1">
                <h2 className="text-lg sm:text-xl font-bold text-[#0D3823] dark:text-[#EEFAF3]">
                  Customer / Buyer
                </h2>
                <p className="text-xs text-[#507662] dark:text-[#97BFA9] leading-relaxed">
                  Discover fresh farm products, buy direct from farmers, and enjoy doorstep delivery.
                </p>
              </div>
            </div>

            <div className="pt-4 sm:pt-5">
              <button
                type="button"
                onClick={() => handleSelectRole('BUYER')}
                disabled={submittingRole !== null}
                className="w-full py-2.5 sm:py-3 px-4 rounded-xl bg-[#075C3B] hover:bg-[#05462D] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-950/15 active:scale-[0.99] disabled:opacity-70 transition-all cursor-pointer"
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

      </main>

      {/* ============================================================== */}
      {/* 3. SUBTLE FOOTER STRIP: Compact Key Points (Fits on Screen)    */}
      {/* ============================================================== */}
      <footer className="shrink-0 w-full border-t border-[#E8EFEA] dark:border-[#1A3326] bg-white/70 dark:bg-[#0A1812]/70 py-2.5 px-4">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-[11px] sm:text-xs text-[#527563] dark:text-[#8BB39D]">
          <span className="flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Select one primary role</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Farmers & couriers undergo quick document verification</span>
          </span>
          <span className="flex items-center gap-1.5">
            <ShoppingBag className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Buyers access marketplace instantly</span>
          </span>
        </div>
      </footer>

      {/* ============================================================== */}
      {/* 4. BUYER ONBOARDING (DIRECT ACCESS) MODAL                      */}
      {/* ============================================================== */}
      {showBuyerSuccessModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
        >
          <div className="relative w-full max-w-sm bg-white dark:bg-[#0A1A12] border border-[#E3EAE5] dark:border-[#163D2F] rounded-3xl shadow-2xl p-6 text-center space-y-4 overflow-hidden transition-all">
            
            {/* Clean Icon Badge */}
            <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-[#075C3B] dark:text-[#34D399] flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            {/* Content */}
            <div className="space-y-1.5">
              <h2 className="text-xl sm:text-2xl font-black text-[#0D3823] dark:text-[#EEFAF3] tracking-tight">
                You&apos;re All Set!
              </h2>
              <p className="text-xs sm:text-sm text-[#507662] dark:text-[#97BFA9] leading-relaxed">
                Your buyer account is ready. You can now start browsing fresh agricultural produce directly from verified farmers.
              </p>
            </div>

            {/* Action Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleGoToBuyerDashboard}
                className="w-full py-3 px-5 rounded-xl bg-[#075C3B] hover:bg-[#05462D] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-950/20 active:scale-[0.99] transition-all cursor-pointer"
              >
                <span>Go to Buyer Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
