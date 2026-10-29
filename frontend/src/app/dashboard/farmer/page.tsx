'use client';

import React, { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import FarmerDashboardContent from '@/components/farmer/FarmerDashboardContent';

export default function FarmerDashboardPage(props: any) {
  const onOpenSidebar = props?.onOpenSidebar;
  const router = useRouter();

  const handleNavigate = (page: string) => {
    if (page === 'dashboard') {
      router.push('/dashboard/farmer');
    } else {
      router.push(`/dashboard/farmer/${page}`);
    }
  };

  return (
    <Suspense fallback={null}>
      <FarmerDashboardContent
        activePage="dashboard"
        onOpenSidebar={onOpenSidebar || (() => {})}
        onNavigate={handleNavigate}
      />
    </Suspense>
  );
}
