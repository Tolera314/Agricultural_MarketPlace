'use client';

import React from 'react';
import { RouteGuard } from '@/components/auth/RouteGuard';

export default function WorkerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RouteGuard allowedRoles={['DELIVERY_WORKER', 'ADMIN', 'SUPERADMIN']}>
      {children}
    </RouteGuard>
  );
}

