'use client';

import React from 'react';
import { RouteGuard } from '@/components/auth/RouteGuard';

export default function BuyerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RouteGuard allowedRoles={['BUYER', 'ADMIN', 'SUPERADMIN']}>
      {children}
    </RouteGuard>
  );
}

