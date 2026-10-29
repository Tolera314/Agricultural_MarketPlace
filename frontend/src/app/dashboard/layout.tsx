'use client';

import React from 'react';
import { RouteGuard } from '@/components/auth/RouteGuard';

export default function RootDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RouteGuard>{children}</RouteGuard>;
}

