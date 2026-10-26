'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  ShieldAlert,
  FileText,
  MapPin,
  Truck,
  Sprout,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { onboardingApi, OnboardingStatusData } from '@/lib/onboardingApi';

export interface VerificationStatusCardProps {
  initialStatus: OnboardingStatusData;
  roleType: 'FARMER' | 'DELIVERY_WORKER';
}

export const VerificationStatusCard: React.FC<VerificationStatusCardProps> = ({
  initialStatus,
  roleType,
}) => {
  const router = useRouter();
  const [data, setData] = useState<OnboardingStatusData>(initialStatus);
  const [refreshing, setRefreshing] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const isFarmer = roleType === 'FARMER';
  const profile = isFarmer ? data.farmerProfile : data.deliveryProfile;
  const status = profile?.verificationStatus || 'PENDING';
  const note = profile?.verificationNote;
  const docs = profile?.verificationDocuments;

  const handleRefresh = async () => {
    setRefreshing(true);
    setFeedbackMessage(null);
    try {
      const updated = await onboardingApi.getStatus();
      setData(updated);
      setFeedbackMessage('Verification status refreshed.');
      setTimeout(() => setFeedbackMessage(null), 3000);
    } catch (err: any) {
      setFeedbackMessage(err?.message || 'Could not refresh status.');
    } finally {
      setRefreshing(false);
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'VERIFIED':
        return {
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
          title: 'Application Approved',
          description:
            'Your account and verification credentials have been approved by the administration. You now have full operational access.',
          badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700',
        };
      case 'REJECTED':
        return {
          icon: <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />,
          title: 'Action Required / Application Rejected',
          description:
            'Your application requires additional corrections or was rejected. Review the administrator remarks below and resubmit your details.',
          badgeClass: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300 dark:border-rose-700',
        };
      case 'SUSPENDED':
        return {
          icon: <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
          title: 'Account Suspended',
          description:
            'Your operational access is currently suspended. Please contact marketplace support for compliance review.',
          badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-700',
        };
      case 'PENDING':
      default:
        return {
          icon: <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 animate-pulse" />,
          title: 'Pending Administrator Review',
          description:
            'Your application has been submitted and is waiting for administrator review. We will notify you when its status changes.',
          badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-700',
        };
    }
  };

  const statusInfo = getStatusBadge();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-[#0A1A12] border border-[#E3EAE5] dark:border-[#163D2F] rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100 dark:border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 shrink-0">
              {isFarmer ? (
                <Sprout className="w-6 h-6 text-emerald-600" />
              ) : (
                <Truck className="w-6 h-6 text-teal-600" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {isFarmer ? 'Farmer Account' : 'Delivery Worker Account'}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase ${statusInfo.badgeClass}`}
                >
                  {status}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#11261D] dark:text-[#E8F5EF] tracking-tight">
                {statusInfo.title}
              </h1>
            </div>
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 text-[#11261D] dark:text-[#E8F5EF] border border-gray-200 dark:border-white/10 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh Status</span>
          </button>
        </div>

        {feedbackMessage && (
          <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-semibold text-emerald-800 dark:text-emerald-300">
            {feedbackMessage}
          </div>
        )}

        <div className="pt-6 space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
            {statusInfo.description}
          </p>

          {/* Administrator Notes (Rejection / Correction feedback) */}
          {note && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 space-y-1">
              <span className="text-xs font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider">
                Administrator Remarks
              </span>
              <p className="text-xs sm:text-sm font-medium text-amber-800 dark:text-amber-200">{note}</p>
            </div>
          )}

          {/* Action buttons depending on state */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            {status === 'VERIFIED' && (
              <button
                onClick={() => router.push(isFarmer ? '/dashboard/farmer' : '/dashboard/worker')}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-xs sm:text-sm text-white bg-emerald-600 hover:bg-emerald-700 transition-all shadow-md"
              >
                <span>Enter Operational Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {(status === 'REJECTED' || status === 'PENDING') && (
              <button
                onClick={() => router.push(isFarmer ? '/onboarding/farmer' : '/onboarding/worker')}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-[#11261D] dark:text-[#E8F5EF] bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 transition-all"
              >
                <span>{status === 'REJECTED' ? 'Edit & Resubmit Application' : 'Review / Update Application'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={() => router.push(isFarmer ? '/dashboard/farmer' : '/dashboard/worker')}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs text-gray-600 dark:text-gray-400 hover:text-emerald-600 transition-colors"
            >
              <span>View Dashboard (Restricted Mode)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Submitted Details Review Card */}
      <div className="bg-white dark:bg-[#0A1A12] border border-[#E3EAE5] dark:border-[#163D2F] rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
        <h2 className="text-base sm:text-lg font-bold text-[#11261D] dark:text-[#E8F5EF]">
          Submitted Application Summary
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
          <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 space-y-1">
            <span className="text-[11px] font-semibold text-gray-400 uppercase">Applicant Name</span>
            <div className="font-bold text-[#11261D] dark:text-[#E8F5EF]">{data.fullName}</div>
          </div>

          <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 space-y-1">
            <span className="text-[11px] font-semibold text-gray-400 uppercase">Phone Number</span>
            <div className="font-bold text-[#11261D] dark:text-[#E8F5EF]">{data.phone}</div>
          </div>

          {isFarmer && data.farmerProfile && (
            <>
              <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 space-y-1">
                <span className="text-[11px] font-semibold text-gray-400 uppercase">Farm Name</span>
                <div className="font-bold text-[#11261D] dark:text-[#E8F5EF]">
                  {data.farmerProfile.farmName}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 space-y-1">
                <span className="text-[11px] font-semibold text-gray-400 uppercase">Location Hub</span>
                <div className="font-bold text-[#11261D] dark:text-[#E8F5EF] flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  <span>
                    {data.farmerProfile.farmLatitude.toFixed(4)}, {data.farmerProfile.farmLongitude.toFixed(4)}
                  </span>
                </div>
              </div>
            </>
          )}

          {!isFarmer && data.deliveryProfile && (
            <>
              <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 space-y-1">
                <span className="text-[11px] font-semibold text-gray-400 uppercase">Vehicle Type</span>
                <div className="font-bold text-[#11261D] dark:text-[#E8F5EF]">
                  {data.deliveryProfile.vehicleType}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 space-y-1">
                <span className="text-[11px] font-semibold text-gray-400 uppercase">Vehicle Plate</span>
                <div className="font-bold text-[#11261D] dark:text-[#E8F5EF]">
                  {data.deliveryProfile.vehiclePlate || 'Not required (non-motorized)'}
                </div>
              </div>
            </>
          )}

          {docs?.identityType && (
            <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 space-y-1">
              <span className="text-[11px] font-semibold text-gray-400 uppercase">Identity Type</span>
              <div className="font-bold text-[#11261D] dark:text-[#E8F5EF]">
                {docs.identityType} ({docs.identityNumber})
              </div>
            </div>
          )}

          {docs?.submittedAt && (
            <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 space-y-1">
              <span className="text-[11px] font-semibold text-gray-400 uppercase">Submitted On</span>
              <div className="font-bold text-[#11261D] dark:text-[#E8F5EF]">
                {new Date(docs.submittedAt).toLocaleDateString()}
              </div>
            </div>
          )}
        </div>

        {/* Support Help Banner */}
        <div className="mt-6 pt-4 border-t border-gray-100 dark:border-white/5 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-emerald-600" />
            <span>Need assistance with your verification?</span>
          </div>
          <a
            href="mailto:support@agrimarket.et"
            className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
          >
            support@agrimarket.et
          </a>
        </div>
      </div>
    </div>
  );
};
