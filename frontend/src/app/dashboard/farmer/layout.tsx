'use client';

import React, { useState } from 'react';
import FarmerSidebar from '@/components/farmer/FarmerSidebar';
import { RouteGuard } from '@/components/auth/RouteGuard';

export default function FarmerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <RouteGuard allowedRoles={['FARMER', 'ADMIN', 'SUPERADMIN']}>
      <div className="min-h-screen bg-[#F4F7F5] dark:bg-[#07130D] flex font-sans text-slate-800 dark:text-[#E6F4ED] transition-colors duration-200">
        {/* Sidebar - fixed and non-scrollable */}
        <FarmerSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Main Content Container with left margin for fixed sidebar */}
        <div className="flex-1 flex flex-col lg:ml-60 min-w-0">
          {React.Children.map(children, (child) => {
            if (React.isValidElement(child)) {
              return React.cloneElement(child as React.ReactElement<any>, {
                onOpenSidebar: () => setSidebarOpen(true),
              });
            }
            return child;
          })}
        </div>
      </div>
    </RouteGuard>
  );
}
