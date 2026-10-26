'use client';

import React from 'react';
import MyProductsContent from '@/components/farmer/MyProductsContent';

export default function FarmerProductsPage({
  onOpenSidebar,
}: {
  onOpenSidebar?: () => void;
}) {
  return (
    <MyProductsContent
      onOpenSidebar={onOpenSidebar || (() => {})}
    />
  );
}
