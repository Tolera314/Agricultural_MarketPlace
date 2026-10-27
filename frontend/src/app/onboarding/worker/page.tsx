'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { WorkerOnboardingForm } from '@/components/onboarding/WorkerOnboardingForm';

export default function WorkerOnboardingPage() {
  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#07130D] text-[#1D2B22] dark:text-[#E6F4ED] flex flex-col font-sans transition-colors duration-200">
      {/* Top Header */}
      <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-[#0A1812]/95 backdrop-blur-md border-b border-[#E8EFEA] dark:border-[#1A3326]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 -ml-2 rounded-lg text-[#075C3B] dark:text-[#34D399] hover:bg-[#EAF5EE] dark:hover:bg-[#132A20] transition-colors"
              aria-label="Back to home"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex flex-col">
              <span className="font-extrabold text-lg text-[#075C3B] dark:text-[#34D399] tracking-tight leading-none">
                AgriMarket
              </span>
              <span className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider mt-0.5">
                Delivery Worker Registration & Verification
              </span>
            </div>
          </div>

          <ThemeToggle />
        </div>
      </header>

      {/* Main Wizard */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <WorkerOnboardingForm />
      </main>
    </div>
  );
}
