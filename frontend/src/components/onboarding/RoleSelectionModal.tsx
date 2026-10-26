'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sprout,
  Truck,
  ShoppingBag,
  CheckCircle2,
  ArrowRight,
  AlertCircle,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { onboardingApi } from '@/lib/onboardingApi';

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
  const [selectedRole, setSelectedRole] = useState<'BUYER' | 'FARMER' | 'DELIVERY_WORKER'>('BUYER');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const roles = [
    {
      id: 'FARMER' as const,
      title: 'Farmer',
      badge: 'Producer & Seller',
      description: 'Sell your agricultural products directly to buyers.',
      details: 'Direct market pricing, zero middlemen, bulk orders, and access to nationwide buyers.',
      icon: <Sprout className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />,
      actionLabel: 'Continue as Farmer',
      themeColor: 'emerald',
    },
    {
      id: 'DELIVERY_WORKER' as const,
      title: 'Delivery Worker',
      badge: 'Logistics Fleet',
      description: 'Deliver agricultural orders and earn through delivery work.',
      details: 'Flexible delivery zones, instant order offers, weekly payouts, and transparent routing.',
      icon: <Truck className="w-7 h-7 text-teal-600 dark:text-teal-400" />,
      actionLabel: 'Continue as Delivery Worker',
      themeColor: 'teal',
    },
    {
      id: 'BUYER' as const,
      title: 'Customer / Buyer',
      badge: 'Instant Access',
      description: 'Discover fresh agricultural products and order directly from farmers.',
      details: 'Farm-fresh harvest, competitive market rates, live order tracking, and door-to-door delivery.',
      icon: <ShoppingBag className="w-7 h-7 text-amber-600 dark:text-amber-400" />,
      actionLabel: 'Continue as Buyer',
      themeColor: 'amber',
    },
  ];

  const handleConfirmRole = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const result = await onboardingApi.selectRole(selectedRole);

      if (onSuccess) {
        onSuccess(selectedRole);
      }

      // Route according to server confirmed role:
      if (selectedRole === 'BUYER') {
        router.push('/dashboard/buyer');
      } else if (selectedRole === 'FARMER') {
        router.push('/onboarding/farmer');
      } else if (selectedRole === 'DELIVERY_WORKER') {
        router.push('/onboarding/worker');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to select role. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="role-selection-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-4xl bg-white dark:bg-[#0A1A12] border border-[#E3EAE5] dark:border-[#163D2F] rounded-3xl shadow-2xl p-6 sm:p-8 md:p-10 my-8 transition-all">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Account Onboarding</span>
          </div>

          <h2
            id="role-selection-title"
            className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#11261D] dark:text-[#E8F5EF] tracking-tight font-display"
          >
            Welcome to AgriMarket
          </h2>

          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 font-medium">
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

        {/* Role Cards Grid */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {roles.map((r) => {
            const isSelected = selectedRole === r.id;

            return (
              <div
                key={r.id}
                role="radio"
                aria-checked={isSelected}
                tabIndex={0}
                onClick={() => setSelectedRole(r.id)}
                onKeyDown={(e) => {
                  if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    setSelectedRole(r.id);
                  }
                }}
                className={`relative cursor-pointer rounded-2xl p-5 sm:p-6 border-2 transition-all duration-200 flex flex-col justify-between focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/30 ${
                  isSelected
                    ? 'border-emerald-600 dark:border-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-md ring-1 ring-emerald-500/20'
                    : 'border-gray-200 dark:border-[#163D2F] bg-white dark:bg-[#0B1E15] hover:border-gray-300 dark:hover:border-[#225744]'
                }`}
              >
                {/* Selection Checkmark */}
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-gray-50 dark:bg-[#0E281C] border border-gray-100 dark:border-[#1E4D3B]">
                    {r.icon}
                  </div>

                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-600 text-white'
                        : 'border-gray-300 dark:border-gray-600 bg-transparent'
                    }`}
                  >
                    {isSelected && <CheckCircle2 className="w-4 h-4 fill-white text-emerald-600" />}
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg text-[#11261D] dark:text-[#E8F5EF]">{r.title}</h3>
                  </div>

                  <span className="inline-block text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300">
                    {r.badge}
                  </span>

                  <p className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200 leading-relaxed pt-1">
                    {r.description}
                  </p>

                  <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-normal pt-1">
                    {r.details}
                  </p>
                </div>

                {/* Card Status Indicator */}
                <div className="mt-5 pt-4 border-t border-gray-100 dark:border-white/5 flex items-center justify-between text-xs font-semibold">
                  <span className={isSelected ? 'text-emerald-700 dark:text-emerald-300' : 'text-gray-400'}>
                    {isSelected ? 'Selected' : 'Click to select'}
                  </span>
                  <ArrowRight
                    className={`w-4 h-4 transition-transform ${
                      isSelected ? 'text-emerald-600 translate-x-1' : 'text-gray-300 dark:text-gray-600'
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Button */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-[#E3EAE5] dark:border-[#163D2F]">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center sm:text-left">
            You can verify additional credentials or access other roles through settings with administrative review.
          </p>

          <button
            onClick={handleConfirmRole}
            disabled={isSubmitting}
            className="w-full sm:w-auto min-w-[240px] px-8 py-3.5 rounded-xl font-bold text-sm text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Assigning Account Role...</span>
              </>
            ) : (
              <>
                <span>
                  {roles.find((r) => r.id === selectedRole)?.actionLabel || 'Confirm Selection'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
