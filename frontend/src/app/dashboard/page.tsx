'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, Loader2, Sparkles, UserCheck } from 'lucide-react';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { onboardingApi } from '@/lib/onboardingApi';
import { getCachedUserProfile } from '@/lib/auth';

export default function PostSignupDashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawRedirect = searchParams.get('redirect');
  const safeRedirect = rawRedirect && rawRedirect.startsWith('/') && !rawRedirect.startsWith('//')
    ? rawRedirect
    : null;

  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string>('');

  useEffect(() => {
    async function checkUserStatus() {
      try {
        const status = await onboardingApi.getStatus();
        if (status.fullName) {
          setUserName(status.fullName);
        }

        // If user has already completed onboarding, route to their role dashboard
        if (status.onboardingStatus === 'COMPLETED') {
          if (status.role === 'FARMER') router.replace('/dashboard/farmer');
          else if (status.role === 'DELIVERY_WORKER') router.replace('/dashboard/worker');
          else if (status.role === 'ADMIN' || status.role === 'SUPERADMIN') router.replace('/dashboard/admin');
          else router.replace(safeRedirect || '/dashboard/buyer');
          return;
        }

        // If pending verification, route to status tracker
        if (status.onboardingStatus === 'PENDING_VERIFICATION') {
          if (status.role === 'FARMER') router.replace('/dashboard/farmer/verification-status');
          else if (status.role === 'DELIVERY_WORKER') router.replace('/dashboard/worker/verification-status');
          return;
        }

        // If in progress with chosen role, direct to their wizard
        if (status.onboardingStatus === 'IN_PROGRESS') {
          if (status.role === 'FARMER') router.replace('/onboarding/farmer');
          else if (status.role === 'DELIVERY_WORKER') router.replace('/onboarding/worker');
          return;
        }

        // User is in PENDING_ROLE (just signed up)
        setLoading(false);
      } catch (err) {
        // Fallback: check cached user profile
        const cached = getCachedUserProfile();
        if (cached?.fullName) {
          setUserName(cached.fullName);
        }
        setLoading(false);
      }
    }

    checkUserStatus();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#07130D] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600 dark:text-emerald-400" />
        <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#07130D] text-[#1D2B22] dark:text-[#E6F4ED] flex flex-col font-sans transition-colors duration-200">
      
      {/* ============================================================== */}
      {/* 1. TOP HEADER: System Brand only at top left corner            */}
      {/* ============================================================== */}
      <header className="w-full border-b border-[#DEECE2] dark:border-[#163828] bg-white/80 dark:bg-[#0B1E15]/80 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-800 flex items-center justify-center shadow-md shadow-emerald-900/20">
            <Sparkles className="w-5 h-5 text-emerald-100" />
          </div>
          <div>
            <span className="text-lg font-black tracking-tight bg-gradient-to-r from-emerald-700 to-teal-800 dark:from-emerald-400 dark:to-teal-300 bg-clip-text text-transparent">
              AgriMarket
            </span>
            <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest block -mt-1">
              Ethiopia
            </span>
          </div>
        </div>

        <ThemeToggle />
      </header>

      {/* ============================================================== */}
      {/* 2. MAIN POST-SIGNUP HERO & ONBOARDING PROMPT                  */}
      {/* ============================================================== */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-12 max-w-3xl mx-auto w-full text-center space-y-8">
        
        {/* Success Icon */}
        <div className="relative">
          <div className="w-20 h-20 rounded-3xl bg-emerald-100 dark:bg-emerald-950/60 border-2 border-emerald-300 dark:border-emerald-700/60 flex items-center justify-center shadow-xl shadow-emerald-600/10 dark:shadow-emerald-900/30">
            <UserCheck className="w-10 h-10 text-emerald-600 dark:text-emerald-400 stroke-[2.2]" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-white dark:border-[#07130D] flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
        </div>

        {/* Heading & Subtitle */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300 text-xs font-bold tracking-wide">
            <span>🎉 Welcome to AgriMarket</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-[#043E27] dark:text-[#EEFAF3] tracking-tight leading-tight">
            Your account has been created successfully!
          </h1>

          <p className="text-base text-[#466957] dark:text-[#90B8A3] max-w-lg mx-auto font-medium leading-relaxed">
            {userName ? `Greetings, ${userName}! ` : 'Greetings! '}
            You are one step away from participating in Ethiopia&apos;s leading direct agricultural marketplace.
          </p>
        </div>

        {/* Call-to-action Card */}
        <div className="w-full bg-white dark:bg-[#0D2118] border border-[#DEECE2] dark:border-[#1E4130] rounded-3xl p-6 sm:p-8 shadow-xl shadow-emerald-950/5 dark:shadow-black/40 space-y-6 text-left">
          
          <div className="space-y-1">
            <h2 className="text-lg font-extrabold text-[#093522] dark:text-[#EEFAF3]">
              Next Step: Choose Your Platform Role
            </h2>
            <p className="text-xs sm:text-sm text-[#466957] dark:text-[#88B8A0] leading-relaxed">
              Tell us how you plan to use AgriMarket. You can buy fresh farm produce, register as a verified farmer seller, or deliver orders across Ethiopia.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="p-3.5 rounded-2xl bg-[#F0F7F2] dark:bg-[#122A1E] border border-[#CDE0D4] dark:border-[#1F4532]">
              <span className="text-xs font-bold text-[#075C3B] dark:text-[#34D399] block mb-1">🛒 Buyer</span>
              <p className="text-[11px] text-[#3D634E] dark:text-[#88B8A0]">Browse verified local crops & place direct orders.</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#F0F7F2] dark:bg-[#122A1E] border border-[#CDE0D4] dark:border-[#1F4532]">
              <span className="text-xs font-bold text-[#075C3B] dark:text-[#34D399] block mb-1">🌾 Farmer</span>
              <p className="text-[11px] text-[#3D634E] dark:text-[#88B8A0]">List harvests, set prices, and sell directly to consumers.</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#F0F7F2] dark:bg-[#122A1E] border border-[#CDE0D4] dark:border-[#1F4532]">
              <span className="text-xs font-bold text-[#075C3B] dark:text-[#34D399] block mb-1">🚚 Delivery Worker</span>
              <p className="text-[11px] text-[#3D634E] dark:text-[#88B8A0]">Accept farm dispatch jobs and deliver with your vehicle.</p>
            </div>
          </div>

          <Link
            href={safeRedirect ? `/onboarding/select-role?redirect=${encodeURIComponent(safeRedirect)}` : '/onboarding/select-role'}
            className="w-full py-4 px-6 rounded-2xl bg-[#075C3B] hover:bg-[#05462D] text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/20 active:scale-[0.99] transition-all cursor-pointer group"
          >
            <span>Proceed to Role Selection</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

      </main>

      {/* Footer */}
      <footer className="w-full py-4 text-center text-xs text-[#6A8B7B] dark:text-[#6A917F] border-t border-[#DEECE2] dark:border-[#163828]">
        AgriMarket Ethiopia · Connecting Farmers, Buyers, and Transporters Directly
      </footer>

    </div>
  );
}
