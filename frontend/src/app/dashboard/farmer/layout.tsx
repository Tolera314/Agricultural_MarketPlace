'use client';

import React, { useState } from 'react';
import FarmerSidebar from '@/components/farmer/FarmerSidebar';
import { RouteGuard } from '@/components/auth/RouteGuard';
import { FarmerBottomNav } from '@/components/layout/MobileBottomNav';
import { SidebarProvider } from '@/context/SidebarContext';

function FarmerLayoutInner({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

      {/* Native-style Mobile Bottom Tab Bar */}
      <FarmerBottomNav onOpenMenu={() => setSidebarOpen(true)} />
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
