'use client';

import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { onboardingApi, OnboardingStatusData } from '@/lib/onboardingApi';
import { VerificationStatusCard } from '@/components/onboarding/VerificationStatusCard';

export default function WorkerVerificationStatusPage() {
  const [data, setData] = useState<OnboardingStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await onboardingApi.getStatus();
        setData(res);
      } catch (err: any) {
        setError(err?.message || 'Failed to retrieve application status.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
        <p className="text-sm font-semibold text-gray-500">Checking verification status...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 rounded-3xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-center space-y-3">
        <p className="text-sm font-bold text-rose-800 dark:text-rose-300">
          {error || 'Could not load application status.'}
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full">
      <VerificationStatusCard initialStatus={data} roleType="DELIVERY_WORKER" />
    </div>
  );
}
