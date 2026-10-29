'use client';

import React from 'react';

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

export default function Skeleton({ className = '', style }: SkeletonProps) {
  return (
    <div
      style={style}
      className={`animate-pulse bg-[#E2EAE5] dark:bg-[#152B22] rounded-xl ${className}`}
      aria-hidden="true"
    />
  );
}

// -----------------------------------------------------------------------------
// 1. Landing Page Screen Skeleton
// -----------------------------------------------------------------------------
export function LandingPageSkeleton() {
  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#0B1512] flex flex-col font-sans transition-colors">
      {/* Header Skeleton */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-[#0B1512]/95 backdrop-blur-md border-b border-[#E5EDE4] dark:border-[#1E3A2F] h-16 sm:h-20 px-4 sm:px-8 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <Skeleton className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/70" />
          <div className="space-y-1">
            <Skeleton className="w-24 h-4 rounded-md" />
            <Skeleton className="w-16 h-2.5 rounded-md" />
          </div>
        </div>

        {/* Desktop Nav Items */}
        <div className="hidden lg:flex items-center gap-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="w-18 h-8 rounded-lg" />
          ))}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          <Skeleton className="w-9 h-9 rounded-full" />
          <Skeleton className="w-9 h-9 rounded-xl" />
          <Skeleton className="w-24 h-9 rounded-full bg-emerald-600/30 dark:bg-emerald-500/20" />
        </div>
      </header>

      {/* Spacer */}
      <div className="h-16 sm:h-20 shrink-0" />

      {/* Hero Skeleton */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 sm:py-16 flex flex-col lg:flex-row items-center justify-between gap-8">
        <div className="w-full lg:w-[54%] space-y-4">
          <Skeleton className="w-44 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950/60" />
          <div className="space-y-2">
            <Skeleton className="w-4/5 h-10 sm:h-12 rounded-xl" />
            <Skeleton className="w-3/5 h-10 sm:h-12 rounded-xl" />
            <Skeleton className="w-2/3 h-10 sm:h-12 rounded-xl bg-emerald-600/20 dark:bg-emerald-400/20" />
          </div>
          <Skeleton className="w-full max-w-lg h-5 rounded-md mt-3" />
          <Skeleton className="w-4/5 max-w-md h-5 rounded-md" />
          <div className="flex gap-3 pt-4">
            <Skeleton className="w-36 h-12 rounded-full bg-emerald-600/40 dark:bg-emerald-500/30" />
            <Skeleton className="w-40 h-12 rounded-full" />
          </div>
        </div>

        {/* Right Floating Card Skeleton */}
        <div className="w-full lg:w-[40%] flex justify-center lg:justify-end">
          <div className="w-72 sm:w-80 p-5 rounded-2xl bg-white dark:bg-[#11221C] border border-[#DEECE2] dark:border-[#1E3A2F] shadow-lg space-y-4">
            <div className="flex justify-between items-center">
              <Skeleton className="w-28 h-3.5 rounded-md" />
              <Skeleton className="w-8 h-3 rounded-md" />
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="w-12 h-12 rounded-full" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="w-16 h-3 rounded-md" />
                <Skeleton className="w-28 h-5 rounded-md" />
              </div>
            </div>
            <div className="pt-3 border-t border-[#F0F5F2] dark:border-[#1E3A2F] flex justify-between">
              <Skeleton className="w-20 h-3 rounded-md" />
              <Skeleton className="w-16 h-3 rounded-md" />
            </div>
          </div>
        </div>
      </div>

      {/* Categories Skeleton */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-center space-y-2 mb-8">
          <Skeleton className="w-32 h-6 rounded-full mx-auto" />
          <Skeleton className="w-48 h-8 rounded-xl mx-auto" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rounded-2xl overflow-hidden bg-white dark:bg-[#11221C] border border-[#DEECE2] dark:border-[#1E3A2F] p-2 space-y-2">
              <Skeleton className="w-full h-24 sm:h-28 rounded-xl" />
              <Skeleton className="w-3/4 h-4 rounded-md mx-auto" />
              <Skeleton className="w-1/2 h-3 rounded-md mx-auto" />
            </div>
          ))}
        </div>
      </div>

      {/* Featured Products Skeleton */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex justify-between items-end mb-6">
          <div className="space-y-2">
            <Skeleton className="w-32 h-6 rounded-full" />
            <Skeleton className="w-56 h-8 rounded-xl" />
          </div>
          <Skeleton className="w-28 h-5 rounded-md" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="rounded-2xl overflow-hidden bg-white dark:bg-[#11221C] border border-[#DEECE2] dark:border-[#1E3A2F] p-3 space-y-3">
              <Skeleton className="w-full h-32 sm:h-36 rounded-xl" />
              <Skeleton className="w-4/5 h-4 rounded-md" />
              <Skeleton className="w-1/2 h-4 rounded-md" />
              <div className="flex justify-between pt-2">
                <Skeleton className="w-12 h-3 rounded-md" />
                <Skeleton className="w-12 h-3 rounded-md" />
              </div>
              <div className="grid grid-cols-2 gap-1.5 pt-2">
                <Skeleton className="w-full h-8 rounded-lg" />
                <Skeleton className="w-full h-8 rounded-lg bg-emerald-600/30 dark:bg-emerald-500/20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// 2. Dashboard Screen Skeleton
// -----------------------------------------------------------------------------
export function DashboardScreenSkeleton() {
  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#07130D] text-[#1D2B22] dark:text-[#E6F4ED] flex flex-col font-sans transition-colors">
      {/* Top Navbar Skeleton */}
      <header className="w-full border-b border-[#DEECE2] dark:border-[#163828] bg-white/80 dark:bg-[#0B1E15]/80 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Skeleton className="w-9 h-9 rounded-xl bg-emerald-600/40" />
          <Skeleton className="w-28 h-5 rounded-md" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="w-9 h-9 rounded-full" />
          <Skeleton className="w-9 h-9 rounded-full" />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto w-full px-4 sm:px-6 py-8 space-y-6">
        {/* Welcome Banner Skeleton */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#0D2218] border border-[#DEECE2] dark:border-[#163828] shadow-sm space-y-3">
          <Skeleton className="w-32 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950/70" />
          <Skeleton className="w-3/5 h-8 rounded-xl" />
          <Skeleton className="w-2/3 h-4 rounded-md" />
        </div>

        {/* 4 KPI Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-5 rounded-2xl bg-white dark:bg-[#0D2218] border border-[#DEECE2] dark:border-[#163828] shadow-2xs space-y-3">
              <div className="flex justify-between items-center">
                <Skeleton className="w-16 h-3 rounded-md" />
                <Skeleton className="w-7 h-7 rounded-lg" />
              </div>
              <Skeleton className="w-20 h-7 rounded-lg" />
              <Skeleton className="w-24 h-2.5 rounded-md" />
            </div>
          ))}
        </div>

        {/* Big Card Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-[#0D2218] border border-[#DEECE2] dark:border-[#163828] space-y-4">
            <Skeleton className="w-40 h-6 rounded-md" />
            <Skeleton className="w-full h-48 rounded-2xl" />
            <div className="space-y-2 pt-2">
              <Skeleton className="w-full h-10 rounded-xl" />
              <Skeleton className="w-full h-10 rounded-xl" />
              <Skeleton className="w-full h-10 rounded-xl" />
            </div>
          </div>
          <div className="p-6 rounded-3xl bg-white dark:bg-[#0D2218] border border-[#DEECE2] dark:border-[#163828] space-y-4">
            <Skeleton className="w-32 h-6 rounded-md" />
            <div className="space-y-3">
              {[1, 2, 3, 4].map((j) => (
                <div key={j} className="flex items-center gap-3 p-2">
                  <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="w-3/4 h-3.5 rounded-md" />
                    <Skeleton className="w-1/2 h-2.5 rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// -----------------------------------------------------------------------------
// 3. Product Detail Screen Skeleton
// -----------------------------------------------------------------------------
export function ProductDetailSkeleton() {
  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#0B1512] flex flex-col font-sans transition-colors">
      {/* Header Placeholder */}
      <div className="h-16 sm:h-20 border-b border-[#E5EDE4] dark:border-[#1E3A2F] bg-white dark:bg-[#0B1512] px-6 flex items-center justify-between">
        <Skeleton className="w-28 h-8 rounded-lg" />
        <Skeleton className="w-24 h-8 rounded-full" />
      </div>

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8 flex-1">
        {/* Breadcrumb Skeleton */}
        <div className="flex items-center gap-2">
          <Skeleton className="w-16 h-3 rounded-md" />
          <Skeleton className="w-3 h-3 rounded-full" />
          <Skeleton className="w-20 h-3 rounded-md" />
          <Skeleton className="w-3 h-3 rounded-full" />
          <Skeleton className="w-28 h-3 rounded-md" />
        </div>

        {/* 2-Column Product Detail Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Image Skeleton */}
          <div className="lg:col-span-6 space-y-4">
            <Skeleton className="w-full h-80 sm:h-96 rounded-3xl" />
            <div className="grid grid-cols-4 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="w-full h-20 rounded-xl" />
              ))}
            </div>
          </div>

          {/* Right Column: Information & Actions */}
          <div className="lg:col-span-6 space-y-6">
            <div className="space-y-3">
              <Skeleton className="w-28 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950/70" />
              <Skeleton className="w-4/5 h-8 sm:h-10 rounded-xl" />
              <div className="flex items-center gap-3">
                <Skeleton className="w-24 h-4 rounded-md" />
                <Skeleton className="w-20 h-4 rounded-md" />
              </div>
            </div>

            {/* Price Card Skeleton */}
            <div className="p-5 rounded-2xl bg-white dark:bg-[#11221C] border border-[#DEECE2] dark:border-[#1E3A2F] space-y-3">
              <Skeleton className="w-36 h-8 rounded-lg" />
              <Skeleton className="w-48 h-3 rounded-md" />
            </div>

            {/* Farmer Card Skeleton */}
            <div className="p-4 rounded-2xl bg-white dark:bg-[#11221C] border border-[#DEECE2] dark:border-[#1E3A2F] flex items-center gap-4">
              <Skeleton className="w-14 h-14 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="w-32 h-4 rounded-md" />
                <Skeleton className="w-24 h-3 rounded-md" />
              </div>
            </div>

            {/* Actions Skeleton */}
            <div className="flex gap-4 pt-4">
              <Skeleton className="w-1/2 h-12 rounded-xl" />
              <Skeleton className="w-1/2 h-12 rounded-xl bg-emerald-600/40" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// -----------------------------------------------------------------------------
// 4. Farmer Profile Screen Skeleton
// -----------------------------------------------------------------------------
export function FarmerProfileSkeleton() {
  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#0B1512] flex flex-col font-sans transition-colors">
      <div className="h-16 sm:h-20 border-b border-[#E5EDE4] dark:border-[#1E3A2F] bg-white dark:bg-[#0B1512] px-6 flex items-center justify-between">
        <Skeleton className="w-28 h-8 rounded-lg" />
        <Skeleton className="w-24 h-8 rounded-full" />
      </div>

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8 flex-1">
        {/* Banner + Avatar Card */}
        <div className="relative rounded-3xl overflow-hidden bg-white dark:bg-[#11221C] border border-[#DEECE2] dark:border-[#1E3A2F]">
          <Skeleton className="w-full h-44 sm:h-60" />
          <div className="p-6 pt-0 flex flex-col sm:flex-row items-center sm:items-end gap-5 -mt-14 relative z-10">
            <Skeleton className="w-28 h-28 rounded-full border-4 border-white dark:border-[#11221C] shrink-0" />
            <div className="space-y-2 text-center sm:text-left flex-1">
              <Skeleton className="w-44 h-6 rounded-md mx-auto sm:mx-0" />
              <Skeleton className="w-32 h-4 rounded-md mx-auto sm:mx-0" />
            </div>
            <div className="flex gap-3">
              <Skeleton className="w-28 h-10 rounded-xl" />
            </div>
          </div>
        </div>

        {/* 3 Metric Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 rounded-2xl bg-white dark:bg-[#11221C] border border-[#DEECE2] dark:border-[#1E3A2F] space-y-2">
              <Skeleton className="w-20 h-3 rounded-md" />
              <Skeleton className="w-28 h-6 rounded-md" />
            </div>
          ))}
        </div>

        {/* Harvests Grid Skeleton */}
        <div className="space-y-4">
          <Skeleton className="w-48 h-6 rounded-md" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-3 rounded-2xl bg-white dark:bg-[#11221C] border border-[#DEECE2] dark:border-[#1E3A2F] space-y-3">
                <Skeleton className="w-full h-32 rounded-xl" />
                <Skeleton className="w-3/4 h-4 rounded-md" />
                <Skeleton className="w-1/2 h-3 rounded-md" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

// -----------------------------------------------------------------------------
// 5. Role Selection Screen Skeleton
// -----------------------------------------------------------------------------
export function RoleSelectionSkeleton() {
  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#07130D] flex flex-col justify-between font-sans transition-colors">
      <header className="h-16 border-b border-[#E8EFEA] dark:border-[#1A3326] px-6 flex items-center justify-between">
        <Skeleton className="w-28 h-7 rounded-md" />
        <Skeleton className="w-9 h-9 rounded-full" />
      </header>

      <main className="max-w-4xl mx-auto w-full px-4 py-8 space-y-8 flex-1 flex flex-col justify-center">
        <div className="text-center space-y-3">
          <Skeleton className="w-36 h-6 rounded-full mx-auto bg-emerald-100 dark:bg-emerald-950/70" />
          <Skeleton className="w-3/5 h-8 sm:h-10 rounded-xl mx-auto" />
          <Skeleton className="w-2/3 h-4 rounded-md mx-auto" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-6 rounded-3xl bg-white dark:bg-[#0E1E17] border border-[#DEECE2] dark:border-[#1A3326] space-y-4 shadow-sm">
              <Skeleton className="w-14 h-14 rounded-2xl" />
              <Skeleton className="w-28 h-5 rounded-md" />
              <Skeleton className="w-full h-12 rounded-lg" />
              <div className="space-y-2 pt-2 border-t border-[#F0F5F2] dark:border-[#1A3326]">
                <Skeleton className="w-full h-3 rounded-md" />
                <Skeleton className="w-5/6 h-3 rounded-md" />
                <Skeleton className="w-4/5 h-3 rounded-md" />
              </div>
              <Skeleton className="w-full h-10 rounded-xl pt-2" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export function SectionSkeleton({ minHeight = 'min-h-[400px]', title = true }: { minHeight?: string; title?: boolean }) {
  return (
    <section className={`w-full py-16 flex flex-col items-center justify-center ${minHeight} bg-white dark:bg-[#0B1512]`}>
      <div className="max-w-7xl w-full mx-auto px-6 flex flex-col items-center">
        {title && (
          <>
            <Skeleton className="h-8 w-64 max-w-md mb-4" />
            <Skeleton className="h-4 w-96 max-w-2xl mb-12" />
          </>
        )}
        <div className="w-full grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col gap-3 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
              <Skeleton className="h-44 w-full rounded-2xl" />
              <Skeleton className="h-5 w-2/3 mt-2" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
