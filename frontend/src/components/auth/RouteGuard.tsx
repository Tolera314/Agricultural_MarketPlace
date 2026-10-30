'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/lib/auth';
import { ShieldAlert, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { DashboardScreenSkeleton } from '@/components/ui/Skeleton';

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
      const isJustSubmitted = typeof window !== 'undefined' && window.location.search.includes('onboardingSuccess=true');
      if (isJustSubmitted) {
        return;
      }

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
      const isJustSubmitted = typeof window !== 'undefined' && window.location.search.includes('onboardingSuccess=true');
      const isOnRoleDashboard = pathname.startsWith(`/dashboard/${rolePrefix}`);

      // If user has submitted onboarding or is on their intended dashboard with onboardingSuccess flag, allow direct access
      if (isJustSubmitted || isOnRoleDashboard || user.onboardingStatus === 'PENDING_VERIFICATION' || user.onboardingStatus === 'COMPLETED') {
        return;
      }

      // Application genuinely in-progress and user is not on onboarding form -> finish onboarding forms
      if (user.onboardingStatus === 'IN_PROGRESS' && !pathname.startsWith(`/onboarding/${rolePrefix}`)) {
        router.replace(`/onboarding/${rolePrefix}`);
        return;
      }

      // Note: Users with PENDING_VERIFICATION are permitted to view their intended role dashboards
      // Feature gates (product listing for farmers, order acceptance for workers) are enforced contextually.
    }
  }, [isLoading, isAuthenticated, user, pathname, allowedRoles, allowPendingVerification, router]);

  // Loading Skeleton Screen (Prevents UI Flicker and Content Flashes)
  if (isLoading || !isAuthenticated || !user) {
    return <DashboardScreenSkeleton />;
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

