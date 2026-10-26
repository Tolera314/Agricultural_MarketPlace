'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import FarmerDashboardContent from '@/components/farmer/FarmerDashboardContent';

export default function FarmerOverviewPage({
  onOpenSidebar,
}: {
  onOpenSidebar?: () => void;
}) {
  const router = useRouter();

  const handleNavigate = (page: string) => {
    if (page === 'dashboard') {
      router.push('/dashboard/farmer');
    } else {
      router.push(`/dashboard/farmer/${page}`);
    }
  };

  return (
    <FarmerDashboardContent
      activePage="dashboard"
      onOpenSidebar={onOpenSidebar || (() => {})}
      onNavigate={handleNavigate}
    />
  );
}
