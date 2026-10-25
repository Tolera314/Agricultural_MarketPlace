'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * /dashboard/admin → redirects to /admin (no login required in dev mode).
 * adminApi.ts auto-logs in with admin credentials on first API call.
 */
export default function DashboardAdminRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F9F6] dark:bg-[#071912]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-3 border-[#10B981] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold text-[#064E3B] dark:text-[#34D399]">
          Loading Admin Dashboard...
        </p>
      </div>
    </div>
  );
}
