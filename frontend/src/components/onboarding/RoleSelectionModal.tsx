'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  AlertCircle,
  Loader2,
  X,
} from 'lucide-react';
import { onboardingApi } from '@/lib/onboardingApi';
import {
  FarmerIllustration,
  DeliveryWorkerIllustration,
  BuyerIllustration,
  DecorativeBotanicalFoliage,
} from '@/components/onboarding/OnboardingIllustrations';

export interface RoleSelectionModalProps {
  isOpen: boolean;
  onSuccess?: (role: string) => void;
  onClose?: () => void;
}

export const RoleSelectionModal: React.FC<RoleSelectionModalProps> = ({
  isOpen,
  onSuccess,
  onClose,
}) => {
  const router = useRouter();
  const [submittingRole, setSubmittingRole] = useState<'BUYER' | 'FARMER' | 'DELIVERY_WORKER' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectRole = async (role: 'BUYER' | 'FARMER' | 'DELIVERY_WORKER') => {
    setSubmittingRole(role);
    setErrorMessage(null);

    try {
      await onboardingApi.selectRole(role);

      if (onSuccess) {
        onSuccess(role);
      }

      if (role === 'BUYER') {
        router.push('/dashboard/buyer');
      } else if (role === 'FARMER') {
        router.push('/onboarding/farmer');
      } else if (role === 'DELIVERY_WORKER') {
        router.push('/onboarding/worker');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to select role. Please try again.');
      setSubmittingRole(null);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="role-selection-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/65 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-4xl bg-white dark:bg-[#0A1A12] border border-[#DEECE2] dark:border-[#1A3F2E] rounded-3xl shadow-2xl p-6 sm:p-8 md:p-10 my-8 transition-all overflow-hidden">
        
        {/* Close Button if closable */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Header (Exact text from Image 1 #1) */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <h2
            id="role-selection-title"
            className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#0D3823] dark:text-[#EEFAF3] tracking-tight"
          >
            Welcome to AgriMarket
          </h2>

          <p className="text-sm sm:text-base text-[#4C725E] dark:text-[#90B8A3] font-medium leading-relaxed">
            Choose how you want to use AgriMarket. You can buy agricultural products, sell your harvest, or deliver orders to customers.
          </p>
        </div>

        {/* Error notification */}
        {errorMessage && (
          <div className="mt-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs sm:text-sm font-semibold flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400" />
            <span className="flex-1">{errorMessage}</span>
          </div>
        )}

        {/* 3 Role Cards Grid */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Farmer Card */}
          <div className="bg-white dark:bg-[#0B1E15] border border-[#DEECE2] dark:border-[#1E4D3B] rounded-2xl p-6 shadow-sm hover:shadow-lg hover:border-emerald-500 transition-all flex flex-col justify-between text-center group">
            <div className="space-y-4 flex flex-col items-center">
              <div className="p-1 transform group-hover:scale-105 transition-transform">
                <FarmerIllustration size={80} />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-bold text-lg text-[#0D3823] dark:text-[#EEFAF3]">Farmer</h3>
                <p className="text-xs text-[#507662] dark:text-[#97BFA9] leading-relaxed">
                  Sell your agricultural products directly to buyers.
                </p>
              </div>
            </div>

            <div className="pt-6">
              <button
                type="button"
                onClick={() => handleSelectRole('FARMER')}
                disabled={submittingRole !== null}
                className="w-full py-2.5 px-4 rounded-xl bg-[#075C3B] hover:bg-[#05462D] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.99] disabled:opacity-70 transition-all cursor-pointer"
              >
                {submittingRole === 'FARMER' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Continue as Farmer</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Delivery Worker Card */}
          <div className="bg-white dark:bg-[#0B1E15] border border-[#DEECE2] dark:border-[#1E4D3B] rounded-2xl p-6 shadow-sm hover:shadow-lg hover:border-emerald-500 transition-all flex flex-col justify-between text-center group">
            <div className="space-y-4 flex flex-col items-center">
              <div className="p-1 transform group-hover:scale-105 transition-transform">
                <DeliveryWorkerIllustration size={80} />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-bold text-lg text-[#0D3823] dark:text-[#EEFAF3]">Delivery Worker</h3>
                <p className="text-xs text-[#507662] dark:text-[#97BFA9] leading-relaxed">
                  Deliver agricultural orders and earn through delivery work.
                </p>
              </div>
            </div>

            <div className="pt-6">
              <button
                type="button"
                onClick={() => handleSelectRole('DELIVERY_WORKER')}
                disabled={submittingRole !== null}
                className="w-full py-2.5 px-4 rounded-xl bg-[#075C3B] hover:bg-[#05462D] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.99] disabled:opacity-70 transition-all cursor-pointer"
              >
                {submittingRole === 'DELIVERY_WORKER' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Continue as Delivery Worker</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Customer / Buyer Card */}
          <div className="bg-white dark:bg-[#0B1E15] border border-[#DEECE2] dark:border-[#1E4D3B] rounded-2xl p-6 shadow-sm hover:shadow-lg hover:border-emerald-500 transition-all flex flex-col justify-between text-center group">
            <div className="space-y-4 flex flex-col items-center">
              <div className="p-1 transform group-hover:scale-105 transition-transform">
                <BuyerIllustration size={80} />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-bold text-lg text-[#0D3823] dark:text-[#EEFAF3]">Customer / Buyer</h3>
                <p className="text-xs text-[#507662] dark:text-[#97BFA9] leading-relaxed">
                  Discover fresh agricultural products and order directly from farmers.
                </p>
              </div>
            </div>

            <div className="pt-6">
              <button
                type="button"
                onClick={() => handleSelectRole('BUYER')}
                disabled={submittingRole !== null}
                className="w-full py-2.5 px-4 rounded-xl bg-[#075C3B] hover:bg-[#05462D] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.99] disabled:opacity-70 transition-all cursor-pointer"
              >
                {submittingRole === 'BUYER' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Continue as Buyer</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>

        </div>

        {/* Botanical Foliage Border at bottom (Image 1 #1) */}
        <DecorativeBotanicalFoliage className="mt-8 -mx-10 -mb-10" />

      </div>
    </div>
  );
};
