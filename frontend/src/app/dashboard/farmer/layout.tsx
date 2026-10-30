'use client';

import React, { useState, useEffect } from 'react';
import FarmerSidebar from '@/components/farmer/FarmerSidebar';
import { RouteGuard } from '@/components/auth/RouteGuard';
import { FarmerBottomNav } from '@/components/layout/MobileBottomNav';
import { SidebarProvider } from '@/context/SidebarContext';
import { farmerApi } from '@/lib/farmerApi';

function FarmerLayoutInner({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingOrdersCount, setPendingOrdersCount] = useState<number>(0);

  useEffect(() => {
    let isMounted = true;
    async function fetchFarmerMetrics() {
      try {
        const res = await farmerApi.getDashboard();
        if (isMounted && res?.data?.metrics?.pendingOrders !== undefined) {
          setPendingOrdersCount(res.data.metrics.pendingOrders);
        }
      } catch {
        // Handled silently
      }
    }

    fetchFarmerMetrics();
    const interval = setInterval(fetchFarmerMetrics, 20000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#F4F7F5] dark:bg-[#07130D] flex font-sans text-slate-800 dark:text-[#E6F4ED] transition-colors duration-200">
      {/* Sidebar - fixed on desktop, mobile slide-in drawer */}
      <FarmerSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content Container with left margin for fixed desktop sidebar and bottom padding for mobile tab bar */}
      <div className="flex-1 flex flex-col lg:ml-60 min-w-0 pb-20 lg:pb-0">
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child as React.ReactElement<any>, {
              onOpenSidebar: () => setSidebarOpen(true),
            });
          }
          return child;
        })}
      </div>

      {/* Native-style Mobile Bottom Tab Bar with Live Unfulfilled Orders Badge */}
      <FarmerBottomNav
        onOpenMenu={() => setSidebarOpen(true)}
        pendingOrdersCount={pendingOrdersCount}
      />
    </div>
  );
}

export default function FarmerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RouteGuard allowedRoles={['FARMER', 'ADMIN', 'SUPERADMIN']}>
      <SidebarProvider>
        <FarmerLayoutInner>{children}</FarmerLayoutInner>
      </SidebarProvider>
    </RouteGuard>
  );
}
