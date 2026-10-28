'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { WifiOff, Sprout, RefreshCw, Home, ShieldCheck } from 'lucide-react';

export default function OfflinePage() {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = () => {
    setIsRetrying(true);
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#07130D] text-[#093522] dark:text-[#EEFAF3] flex flex-col justify-between selection:bg-emerald-500/20 selection:text-emerald-800">
      {/* Top Brand Bar */}
      <header className="w-full border-b border-[#E3EDE6] dark:border-[#163828] bg-white/80 dark:bg-[#0B1E15]/80 backdrop-blur-md px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-[#075C3B] dark:bg-[#123826] border border-[#BBD6C5] dark:border-[#224A37] flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
              <Sprout className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-[#075C3B] dark:text-[#34D399]">
                AgriMarket
              </span>
              <span className="block text-[10px] font-bold text-[#5A7C6A] dark:text-[#88B8A0] tracking-wider uppercase">
                Ethiopian Marketplace
              </span>
            </div>
          </Link>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-300 text-xs font-semibold">
            <WifiOff className="w-3.5 h-3.5" />
            <span>Offline Mode</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-xl mx-auto px-4 py-12 text-center space-y-6">
        <div className="relative w-24 h-24 mx-auto rounded-3xl bg-[#E8F5EE] dark:bg-[#122A1E] border border-[#BBD6C5] dark:border-[#1E4533] flex items-center justify-center text-[#075C3B] dark:text-[#34D399] shadow-lg shadow-emerald-950/10 dark:shadow-black/40">
          <WifiOff className="w-12 h-12 stroke-[1.75]" />
          <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-md">
            <Sprout className="w-4 h-4" />
          </div>
        </div>

        <div className="space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E2F2E7] dark:bg-[#153828] text-[#075C3B] dark:text-[#34D399] text-xs font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>PWA Offline Resilience</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-[#043E27] dark:text-[#EEFAF3] tracking-tight">
            You're Currently Offline
          </h1>

          <p className="text-sm sm:text-base text-[#466957] dark:text-[#97C2AC] leading-relaxed max-w-md mx-auto">
            It looks like your cellular or Wi-Fi connection is currently unavailable. Your locally cached pages and saved drafts remain safe.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={handleRetry}
            disabled={isRetrying}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[#075C3B] hover:bg-[#05462D] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-950/20 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
            <span>{isRetrying ? 'Checking Connection...' : 'Check Connection'}</span>
          </button>

          <Link
            href="/"
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white dark:bg-[#12281E] border border-[#CBDCD1] dark:border-[#224A37] text-[#075C3B] dark:text-[#34D399] hover:bg-[#EAF5EE] dark:hover:bg-[#163828] font-bold text-sm flex items-center justify-center gap-2 transition-all"
          >
            <Home className="w-4 h-4" />
            <span>Return to Home</span>
          </Link>
        </div>

        {/* Offline tips */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0E2319] border border-[#D5E5DA] dark:border-[#1E4331] text-left text-xs space-y-2 shadow-xs">
          <p className="font-bold text-[#093522] dark:text-[#EEFAF3]">
            💡 While offline in rural areas:
          </p>
          <ul className="list-disc list-inside space-y-1 text-[#466957] dark:text-[#88B8A0]">
            <li>Any photos compressed on the onboarding page will be preserved.</li>
            <li>Once cellular connection returns, your transactions and verification sync automatically.</li>
            <li>Ethiopian regional markets will refresh with the latest product prices on reconnect.</li>
          </ul>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-6 text-center text-xs text-[#6A8B7B] dark:text-[#6A917F] border-t border-[#E3EDE6] dark:border-[#163828]">
        AgriMarket Ethiopia · Better Farmers · Brighter Future
      </footer>
    </div>
  );
}
