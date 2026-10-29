'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/lib/auth';
import { Loader2, ShieldAlert, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface RouteGuardProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  allowPendingVerification?: boolean;
}

export function RouteGuard({
  children,
  allowedRoles,
  allowPendingVerification = false,
}: RouteGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [deniedRoleMessage, setDeniedRoleMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isLoading) return;

    // 1. Unauthenticated users cannot access protected routes
    if (!isAuthenticated || !user) {
      const safeRedirect = pathname.startsWith('/') && !pathname.startsWith('//')
        ? pathname
        : '/dashboard';
      router.replace(`/login?redirect=${encodeURIComponent(safeRedirect)}`);
      return;
    }

    // 2. Newly registered users who haven't picked a role must choose one
    if (user.onboardingStatus === 'PENDING_ROLE' && !pathname.startsWith('/onboarding/select-role')) {
      router.replace('/onboarding/select-role');
      return;
    }

    // 3. Role-based Access Control: Enforce allowed roles for this subtree
    if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      setDeniedRoleMessage(
        `This section is restricted to ${allowedRoles.join(' / ')} accounts. You are currently signed in as ${user.role}.`
      );
      // Auto-redirect to their appropriate role dashboard after short delay if not admin
      const timer = setTimeout(() => {
        if (user.role === 'FARMER') router.replace('/dashboard/farmer');
        else if (user.role === 'DELIVERY_WORKER') router.replace('/dashboard/worker');
        else if (user.role === 'ADMIN' || user.role === 'SUPERADMIN') router.replace('/dashboard/admin');
        else router.replace('/dashboard/buyer');
      }, 3500);
      return () => clearTimeout(timer);
    }

    // 4. Onboarding lifecycle check for Farmers & Delivery Workers
    if (user.role === 'FARMER' || user.role === 'DELIVERY_WORKER') {
      const rolePrefix = user.role === 'FARMER' ? 'farmer' : 'worker';

      // Application in-progress -> finish onboarding forms
      if (user.onboardingStatus === 'IN_PROGRESS' && !pathname.startsWith(`/onboarding/${rolePrefix}`)) {
        router.replace(`/onboarding/${rolePrefix}`);
        return;
      }

      // Application pending verification -> restricted operational pages redirect to tracker
      if (user.onboardingStatus === 'PENDING_VERIFICATION') {
        const isStatusPage = pathname.includes('/verification-status');
        if (!allowPendingVerification && !isStatusPage) {
          router.replace(`/dashboard/${rolePrefix}/verification-status`);
          return;
        }
      }
    }
  }, [isLoading, isAuthenticated, user, pathname, allowedRoles, allowPendingVerification, router]);

  // Loading Skeleton Screen (Prevents UI Flicker and Content Flashes)
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#07130D] flex flex-col items-center justify-center p-6 space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center shadow-sm">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="text-center space-y-1">
          <p className="text-sm font-bold text-gray-800 dark:text-gray-200">Verifying security credentials...</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Loading your authenticated dashboard</p>
        </div>
      </div>
    );
  }

  // Fallback while redirecting unauthenticated users
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#07130D] flex flex-col items-center justify-center p-6 space-y-3">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-600 dark:text-emerald-400" />
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">Redirecting to sign in...</p>
      </div>
    );
  }

  // Denied Role Banner (if unauthorized role attempts direct URL access)
  if (deniedRoleMessage) {
    const userRoleLower = user.role.toLowerCase();
    const destinationDashboard =
      user.role === 'ADMIN' || user.role === 'SUPERADMIN' ? '/dashboard/admin' : `/dashboard/${userRoleLower}`;

    return (
      <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#07130D] flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-white dark:bg-[#0E1E17] rounded-3xl p-8 border border-red-200 dark:border-red-900/50 shadow-xl space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 flex items-center justify-center mx-auto text-red-600 dark:text-red-400">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-black text-gray-900 dark:text-white">Access Restricted</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{deniedRoleMessage}</p>
          </div>

          <div className="pt-2">
            <Link
              href={destinationDashboard}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-700/20 transition-all cursor-pointer"
            >
              <span>Return to My Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

