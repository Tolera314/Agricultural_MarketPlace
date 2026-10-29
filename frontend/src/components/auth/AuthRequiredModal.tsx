'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Lock, ArrowRight, UserPlus, X, ShieldCheck } from 'lucide-react';

interface AuthRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  redirectUrl?: string;
  productName?: string;
}

export function AuthRequiredModal({
  isOpen,
  onClose,
  title = 'Sign in to continue',
  message = 'Create an AgriMarket account or sign in to purchase products directly from farmers and manage your orders.',
  redirectUrl = '/dashboard/buyer',
  productName,
}: AuthRequiredModalProps) {
  const router = useRouter();

  // Escape key closes modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Build safe validated redirect paths
  const safeRedirect = redirectUrl.startsWith('/') && !redirectUrl.startsWith('//')
    ? redirectUrl
    : '/dashboard/buyer';

  const loginHref = `/login?redirect=${encodeURIComponent(safeRedirect)}`;
  const signupHref = `/signup?redirect=${encodeURIComponent(safeRedirect)}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      {/* Backdrop click */}
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-md bg-white dark:bg-[#0B1A14] border border-[#DEECE2] dark:border-[#1A382A] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-center z-10 animate-in zoom-in-95 duration-150">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Icon Header */}
        <div className="mx-auto w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
          <ShoppingBag className="w-7 h-7" />
        </div>

        {/* Title & Copy */}
        <div className="space-y-2">
          {productName && (
            <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-100/70 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300">
              Purchasing: {productName}
            </span>
          )}
          <h2
            id="auth-modal-title"
            className="text-xl sm:text-2xl font-black text-[#11261D] dark:text-[#E8F5EF] tracking-tight"
          >
            {title}
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed max-w-sm mx-auto">
            {message}
          </p>
        </div>

        {/* Security / Verification Badge */}
        <div className="p-3 rounded-2xl bg-[#F4F9F6] dark:bg-[#0E241C] border border-[#E1ECE5] dark:border-[#1B3D2E] flex items-center justify-center gap-2 text-[11px] font-semibold text-[#25523D] dark:text-[#88B8A0]">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>Direct escrow payments &amp; verified farm logistics</span>
        </div>

        {/* Primary Action Buttons */}
        <div className="space-y-2.5 pt-1">
          <Link
            href={loginHref}
            className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md shadow-emerald-700/20 transition-all cursor-pointer"
          >
            <span>Sign In</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href={signupHref}
            className="w-full py-3 px-4 rounded-xl border border-emerald-600 dark:border-emerald-500 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Create Account</span>
          </Link>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors cursor-pointer"
          >
            Continue Browsing
          </button>
        </div>
      </div>
    </div>
  );
}

