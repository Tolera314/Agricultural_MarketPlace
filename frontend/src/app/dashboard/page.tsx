'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Loader2, Sparkles, UserCheck } from 'lucide-react';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { onboardingApi } from '@/lib/onboardingApi';

export default function PostSignupDashboardPage() {
  const router = useRouter();
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
          else router.replace('/dashboard/buyer');
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
        // Fallback: check localStorage user if network or offline
        try {
          const raw = localStorage.getItem('agrimarket_user');
          if (raw) {
            const u = JSON.parse(raw);
            if (u.fullName) setUserName(u.fullName);
          }
        } catch {
          // ignore
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
      <header className="w-full bg-white/95 dark:bg-[#0A1812]/95 backdrop-blur-md border-b border-[#E8EFEA] dark:border-[#1A3326] px-4 sm:px-6 lg:px-8 py-3.5 sm:py-4 transition-colors">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* System Brand at Top Left Corner */}
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

          {/* Right corner subtle theme control */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>

        </div>
      </header>

      {/* ============================================================== */}
      {/* 2. CENTERED DASHBOARD BODY: Fill Your Profile Button           */}
      {/* ============================================================== */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-lg bg-white dark:bg-[#0A1A12] border border-[#E3EAE5] dark:border-[#163D2F] rounded-3xl p-8 sm:p-12 shadow-xl shadow-emerald-950/5 dark:shadow-black/40 text-center space-y-7 transition-all">
          
          {/* Welcome Badge & Icon */}
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 mx-auto shadow-inner">
            <UserCheck className="w-8 h-8 sm:w-10 sm:h-10" />
          </div>

          {/* Text Content */}
          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Account Created Successfully</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0D3823] dark:text-[#EEFAF3] tracking-tight">
              {userName ? `Welcome, ${userName}!` : 'Welcome to AgriMarket!'}
            </h1>

            <p className="text-sm sm:text-base text-[#527563] dark:text-[#90B8A3] leading-relaxed max-w-md mx-auto font-medium">
              Your account has been registered. Before getting started, please complete your profile setup to unlock features tailored to your needs.
            </p>
          </div>

          {/* Primary Action Button: Fill Your Profile */}
          <div className="pt-2">
            <Link
              href="/onboarding/select-role"
              className="inline-flex items-center justify-center gap-3 w-full py-4 px-8 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-base sm:text-lg shadow-lg shadow-emerald-700/25 hover:shadow-emerald-700/35 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              <span>Fill Your Profile</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

          {/* Subtext info */}
          <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">
            Takes less than 2 minutes · Fast verification · Safe and secure
          </p>

        </div>
      </main>

    </div>
  );
}
