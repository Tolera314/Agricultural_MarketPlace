'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { RoleSelectionModal } from '@/components/onboarding/RoleSelectionModal';
import { onboardingApi } from '@/lib/onboardingApi';
import { Loader2 } from 'lucide-react';

export default function SelectRolePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkUser() {
      try {
        const status = await onboardingApi.getStatus();
        // If user already completed onboarding, route according to role
        if (status.onboardingStatus === 'COMPLETED') {
          if (status.role === 'FARMER') router.push('/dashboard/farmer');
          else if (status.role === 'DELIVERY_WORKER') router.push('/dashboard/worker');
          else if (status.role === 'ADMIN' || status.role === 'SUPERADMIN') router.push('/dashboard/admin');
          else router.push('/dashboard/buyer');
          return;
        }

        if (status.onboardingStatus === 'PENDING_VERIFICATION') {
          if (status.role === 'FARMER') router.push('/dashboard/farmer/verification-status');
          else if (status.role === 'DELIVERY_WORKER') router.push('/dashboard/worker/verification-status');
          return;
        }

        if (status.onboardingStatus === 'IN_PROGRESS') {
          if (status.role === 'FARMER') router.push('/onboarding/farmer');
          else if (status.role === 'DELIVERY_WORKER') router.push('/onboarding/worker');
          return;
        }

        setLoading(false);
      } catch (err) {
        // Not authenticated or error -> keep modal open or login
        setLoading(false);
      }
    }

    checkUser();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#07130D] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#07130D] flex items-center justify-center p-4">
      <RoleSelectionModal isOpen={true} />
    </div>
  );
}
