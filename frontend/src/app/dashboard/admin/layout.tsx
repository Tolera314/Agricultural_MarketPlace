'use client';

import React, { useState } from 'react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { RouteGuard } from '@/components/auth/RouteGuard';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <RouteGuard allowedRoles={['ADMIN', 'SUPERADMIN']}>
      <div className="min-h-screen bg-[#F4F7F5] dark:bg-[#07130D] flex font-sans text-slate-800 dark:text-[#E6F4ED] transition-colors duration-200">
        {/* Sticky, non-scrollable Sidebar */}
        <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main Container with lg:ml-60 for fixed sidebar */}
        <div className="flex-1 flex flex-col lg:ml-60 min-w-0">
          <AdminHeader />
          <main className="flex-1 p-5 sm:p-6 lg:p-8 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </RouteGuard>
  );
}
