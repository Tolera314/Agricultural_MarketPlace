'use client';

import React from 'react';
import MyProductsContent from '@/components/farmer/MyProductsContent';

export default function (props: any) {
  const onOpenSidebar = props?.onOpenSidebar;
  return (
    <MyProductsContent
      onOpenSidebar={onOpenSidebar || (() => {})}
    />
  );
}
