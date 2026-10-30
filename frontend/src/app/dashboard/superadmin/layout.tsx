'use client';

import React, { useState } from 'react';
import { SuperadminSidebar } from '@/components/superadmin/SuperadminSidebar';
import { SuperadminHeader } from '@/components/superadmin/SuperadminHeader';
import { RouteGuard } from '@/components/auth/RouteGuard';
import { SuperadminBottomNav } from '@/components/layout/MobileBottomNav';
import { SidebarProvider } from '@/context/SidebarContext';

function SuperadminLayoutInner({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F4F7F5] dark:bg-[#07130D] flex font-sans text-slate-800 dark:text-[#E6F4ED] transition-colors duration-200">
      {/* Sticky, non-scrollable Superadmin Sidebar */}
      <SuperadminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Container with lg:ml-60 for fixed sidebar and bottom padding for mobile tabs */}
      <div className="flex-1 flex flex-col lg:ml-60 min-w-0 pb-20 lg:pb-0">
        <SuperadminHeader onOpenMobileMenu={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Native-style Mobile Bottom Tab Bar */}
      <SuperadminBottomNav onOpenMenu={() => setSidebarOpen(true)} />
    </div>
  );
}

export default function SuperadminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard allowedRoles={['SUPERADMIN']}>
      <SidebarProvider>
        <SuperadminLayoutInner>{children}</SuperadminLayoutInner>
      </SidebarProvider>
    </RouteGuard>
  );
}
