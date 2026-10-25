'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardIndexPage() {
  const router = useRouter();

  useEffect(() => {
    try {
      const rawUser = localStorage.getItem('agrimarket_user');
      if (rawUser) {
        const u = JSON.parse(rawUser);
        if (u.role === 'ADMIN' || u.role === 'SUPERADMIN') {
          router.replace('/admin/locations');
          return;
        }
        if (u.role === 'DELIVERY_WORKER') {
          router.replace('/dashboard/worker');
          return;
        }
      }
    } catch {
      // fallback
    }
    router.replace('/dashboard/buyer');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F7F5] dark:bg-[#07130D]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-3 border-[#075C3B] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold text-[#517663] dark:text-[#88B8A0]">
          Loading dashboard...
        </p>
      </div>
    </div>
  );
}
