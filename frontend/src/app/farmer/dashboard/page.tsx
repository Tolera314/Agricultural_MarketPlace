'use client';

import React, { useState } from 'react';
import FarmerSidebar from '@/components/farmer/FarmerSidebar';
import FarmerDashboardContent from '@/components/farmer/FarmerDashboardContent';
import MyProductsContent from '@/components/farmer/MyProductsContent';

export default function FarmerDashboardPage() {
  const [activePage, setActivePage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderContent = () => {
    switch (activePage) {
      case 'products':
        return (
          <MyProductsContent
            onOpenSidebar={() => setSidebarOpen(true)}
          />
        );
      default:
        return (
          <FarmerDashboardContent
            activePage={activePage}
            onOpenSidebar={() => setSidebarOpen(true)}
            onNavigate={setActivePage}
          />
        );
    }
  };

  return (
    <div className="flex h-screen bg-[#F4F6F5] dark:bg-[#0B1512] overflow-hidden font-sans">
      {/* Sidebar */}
      <FarmerSidebar
        activePage={activePage}
        onNavigate={setActivePage}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {renderContent()}
      </div>
    </div>
  );
}
