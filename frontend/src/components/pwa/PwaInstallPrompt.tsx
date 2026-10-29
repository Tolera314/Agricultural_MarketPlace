'use client';

import React, { useEffect, useState } from 'react';
import { Download, X, WifiOff, CheckCircle2, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [showOnlineToast, setShowOnlineToast] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Detect standalone mode (already installed)
    const isRunningStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');

    setIsStandalone(isRunningStandalone);

    // Check if dismissed previously
    const dismissedAt = localStorage.getItem('agrimarket_pwa_install_dismissed');
    if (dismissedAt) {
      const daysSince = (Date.now() - Number(dismissedAt)) / (1000 * 60 * 60 * 24);
      if (daysSince < 7) {
        setIsDismissed(true);
      }
    }

    // Intercept beforeinstallprompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    // Track online/offline status
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setShowOnlineToast(true);
      setTimeout(() => setShowOnlineToast(false), 4000);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } catch {
      // Ignored
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('agrimarket_pwa_install_dismissed', Date.now().toString());
  };

  return (
    <>
      {/* Offline Status Ribbon */}
      {!isOnline && (
        <div
          role="status"
          className="fixed top-0 inset-x-0 z-[9999] bg-amber-600 text-white px-4 py-2 text-xs font-bold text-center flex items-center justify-center gap-2 shadow-md animate-in slide-in-from-top duration-300"
        >
          <WifiOff className="w-4 h-4 shrink-0" />
          <span>You are currently offline. Locally cached pages and saved drafts remain accessible.</span>
        </div>
      )}

      {/* Back Online Reconnect Toast */}
      {showOnlineToast && (
        <div
          role="status"
          className="fixed top-3 right-3 sm:right-6 z-[9999] bg-[#075C3B] text-white px-4 py-2.5 rounded-2xl text-xs font-bold shadow-xl flex items-center gap-2 border border-emerald-400/40 animate-in slide-in-from-top duration-300"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          <span>Connection restored! Syncing latest marketplace listings...</span>
        </div>
      )}

      {/* PWA Install Promotion Banner */}
      {!isStandalone && !isDismissed && deferredPrompt && (
        <aside
          aria-label="Install AgriMarket Application"
          className="fixed bottom-4 left-4 right-4 sm:left-6 sm:right-auto sm:max-w-md z-50 bg-white/95 dark:bg-[#0D2118]/95 backdrop-blur-md rounded-2xl border border-emerald-600/20 dark:border-emerald-500/30 p-4 shadow-2xl flex items-center justify-between gap-3 animate-in slide-in-from-bottom duration-300"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-[#075C3B] flex items-center justify-center text-white shrink-0 shadow-xs">
              <Smartphone className="w-5 h-5 text-emerald-100" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-emerald-100 truncate">
                Install AgriMarket App
              </h4>
              <p className="text-[11px] text-slate-600 dark:text-emerald-300/80 line-clamp-1">
                Fast native experience, offline resilience & instant dispatches.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleInstallClick}
              className="px-3.5 py-1.5 rounded-xl bg-[#075C3B] hover:bg-[#05462D] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install</span>
            </button>
            <button
              onClick={handleDismiss}
              aria-label="Dismiss installation prompt"
              className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </aside>
      )}
    </>
  );
}
