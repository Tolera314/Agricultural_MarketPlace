'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Truck,
  DollarSign,
  Menu,
  Users,
  ClipboardList,
  ShieldCheck,
  Compass,
  Clock,
  ShoppingBag,
  MessageSquare,
  type LucideIcon,
} from 'lucide-react';

export interface BottomNavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  href?: string;
  badge?: number | string;
  action?: () => void;
}

interface MobileBottomNavProps {
  items: BottomNavItem[];
  activeId?: string;
  onOpenMenu?: () => void;
  className?: string;
}

/**
 * MobileBottomNav: Native app-style sticky bottom tab navigation bar for smartphones & small screens.
 * Features safe area insets (iOS home bar / Android gestures), active state indicators,
 * micro-animations, and a dedicated "More / Menu" drawer trigger.
 */
export function MobileBottomNav({
  items,
  activeId,
  onOpenMenu,
  className = '',
}: MobileBottomNavProps) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className={`lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#071912]/95 backdrop-blur-xl border-t border-gray-200/90 dark:border-[#143B2B] shadow-[0_-4px_24px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.4)] transition-colors duration-200 ${className}`}
      style={{
        paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 8px)',
      }}
    >
      <div className="flex items-center justify-around px-1 pt-1.5 pb-1 max-w-lg mx-auto">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive =
            activeId === item.id ||
            (item.href &&
              (pathname === item.href ||
                (item.href !== '/dashboard/farmer' &&
                  item.href !== '/dashboard/admin' &&
                  item.href !== '/dashboard/superadmin' &&
                  pathname?.startsWith(item.href))));

          const content = (
            <div className="flex flex-col items-center justify-center relative w-full py-1">
              {/* Active pill background highlight */}
              <div
                className={`relative px-3 py-1 rounded-2xl transition-all duration-200 ${
                  isActive
                    ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 scale-105'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                <Icon
                  className={`w-5 h-5 transition-transform duration-150 ${
                    isActive ? 'stroke-[2.4]' : 'stroke-[1.8]'
                  }`}
                />

                {/* Badge indicator */}
                {Boolean(item.badge) && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-emerald-600 text-white text-[9px] font-black flex items-center justify-center shadow-xs">
                    {item.badge}
                  </span>
                )}
              </div>

              {/* Label */}
              <span
                className={`text-[10px] mt-0.5 tracking-tight transition-colors duration-150 ${
                  isActive
                    ? 'font-black text-emerald-900 dark:text-emerald-200'
                    : 'font-semibold text-gray-500 dark:text-gray-400'
                }`}
              >
                {item.label}
              </span>

              {/* Active Dot Indicator */}
              {isActive && (
                <span className="w-1 h-1 rounded-full bg-emerald-600 dark:bg-emerald-400 mt-0.5 animate-in fade-in zoom-in duration-150" />
              )}
            </div>
          );

          if (item.href) {
            return (
              <Link
                key={item.id}
                href={item.href}
                className="flex-1 flex flex-col items-center justify-center select-none active:scale-95 transition-transform duration-100 cursor-pointer min-w-0"
              >
                {content}
              </Link>
            );
          }

          return (
            <button
              key={item.id}
              type="button"
              onClick={item.action}
              className="flex-1 flex flex-col items-center justify-center select-none active:scale-95 transition-transform duration-100 cursor-pointer min-w-0"
            >
              {content}
            </button>
          );
        })}

        {/* Dedicated 5th Menu Tab if onOpenMenu is supplied and not already in items */}
        {onOpenMenu && !items.some((i) => i.id === 'menu') && (
          <button
            type="button"
            onClick={onOpenMenu}
            className="flex-1 flex flex-col items-center justify-center select-none active:scale-95 transition-transform duration-100 cursor-pointer min-w-0"
            aria-label="Open full navigation menu"
          >
            <div className="flex flex-col items-center justify-center relative w-full py-1">
              <div className="px-3 py-1 rounded-2xl text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors">
                <Menu className="w-5 h-5 stroke-[1.8]" />
              </div>
              <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 mt-0.5 tracking-tight">
                Menu
              </span>
            </div>
          </button>
        )}
      </div>
    </nav>
  );
}

// =========================================================================
// Specialized Pre-Configured Tab Bars for each Dashboard Role
// =========================================================================

/**
 * Farmer Mobile Bottom Navigation:
 * Overview -> Products -> Orders -> Earnings -> Menu
 */
export function FarmerBottomNav({
  onOpenMenu,
  pendingOrdersCount,
}: {
  onOpenMenu: () => void;
  pendingOrdersCount?: number;
}) {
  const items: BottomNavItem[] = [
    { id: 'dashboard', label: 'Overview', href: '/dashboard/farmer', icon: LayoutDashboard },
    { id: 'products', label: 'Products', href: '/dashboard/farmer/products', icon: Package },
    {
      id: 'orders',
      label: 'Orders',
      href: '/dashboard/farmer/orders',
      icon: ShoppingCart,
      badge: pendingOrdersCount && pendingOrdersCount > 0 ? pendingOrdersCount : undefined,
    },
    { id: 'earnings', label: 'Earnings', href: '/dashboard/farmer/earnings', icon: DollarSign },
    { id: 'menu', label: 'Menu', icon: Menu, action: onOpenMenu },
  ];

  return <MobileBottomNav items={items} onOpenMenu={onOpenMenu} />;
}

/**
 * Delivery Worker Mobile Bottom Navigation:
 * Radar -> Active -> Earnings -> History -> Menu
 */
export function WorkerBottomNav({
  activeSection,
  onSelectSection,
  onOpenMenu,
  activeJobsCount,
  availableOrdersCount,
}: {
  activeSection: string;
  onSelectSection: (section: any) => void;
  onOpenMenu: () => void;
  activeJobsCount?: number;
  availableOrdersCount?: number;
}) {
  const items: BottomNavItem[] = [
    {
      id: 'radar',
      label: 'Radar',
      icon: Compass,
      badge: availableOrdersCount && availableOrdersCount > 0 ? availableOrdersCount : undefined,
      action: () => onSelectSection('radar'),
    },
    {
      id: 'active',
      label: 'Active',
      icon: Truck,
      badge: activeJobsCount && activeJobsCount > 0 ? activeJobsCount : undefined,
      action: () => onSelectSection('active'),
    },
    { id: 'earnings', label: 'Earnings', icon: DollarSign, action: () => onSelectSection('earnings') },
    { id: 'history', label: 'History', icon: Clock, action: () => onSelectSection('history') },
    { id: 'menu', label: 'Menu', icon: Menu, action: onOpenMenu },
  ];

  return <MobileBottomNav items={items} activeId={activeSection} onOpenMenu={onOpenMenu} />;
}

/**
 * Buyer Mobile Bottom Navigation:
 * Market -> Orders -> Cart -> Messages -> Menu
 */
export function BuyerBottomNav({
  activeTab,
  onSelectTab,
  onOpenMenu,
  cartCount,
  activeOrdersCount,
}: {
  activeTab: string;
  onSelectTab: (tab: any) => void;
  onOpenMenu: () => void;
  cartCount?: number;
  activeOrdersCount?: number;
}) {
  const items: BottomNavItem[] = [
    { id: 'overview', label: 'Market', icon: ShoppingBag, action: () => onSelectTab('overview') },
    {
      id: 'orders',
      label: 'Orders',
      icon: Package,
      badge: activeOrdersCount && activeOrdersCount > 0 ? activeOrdersCount : undefined,
      action: () => onSelectTab('orders'),
    },
    { id: 'cart', label: 'Cart', icon: ShoppingCart, badge: cartCount && cartCount > 0 ? cartCount : undefined, action: () => onSelectTab('cart') },
    { id: 'messages', label: 'Messages', icon: MessageSquare, action: () => onSelectTab('messages') },
    { id: 'menu', label: 'Menu', icon: Menu, action: onOpenMenu },
  ];

  return <MobileBottomNav items={items} activeId={activeTab} onOpenMenu={onOpenMenu} />;
}

/**
 * Admin Mobile Bottom Navigation:
 * Dashboard -> Products -> Farmers -> Orders -> Menu
 */
export function AdminBottomNav({ onOpenMenu }: { onOpenMenu: () => void }) {
  const items: BottomNavItem[] = [
    { id: 'dashboard', label: 'Dashboard', href: '/dashboard/admin', icon: LayoutDashboard },
    { id: 'products', label: 'Products', href: '/dashboard/admin/products', icon: Package },
    { id: 'farmers', label: 'Farmers', href: '/dashboard/admin/farmers', icon: Users },
    { id: 'orders', label: 'Orders', href: '/dashboard/admin/orders', icon: ClipboardList },
    { id: 'menu', label: 'Menu', icon: Menu, action: onOpenMenu },
  ];

  return <MobileBottomNav items={items} onOpenMenu={onOpenMenu} />;
}

/**
 * Superadmin Mobile Bottom Navigation:
 * Overview -> Users -> Commissions -> Audit -> Menu
 */
export function SuperadminBottomNav({ onOpenMenu }: { onOpenMenu: () => void }) {
  const items: BottomNavItem[] = [
    { id: 'dashboard', label: 'Overview', href: '/dashboard/superadmin', icon: LayoutDashboard },
    { id: 'users', label: 'Users', href: '/dashboard/superadmin/users', icon: Users },
    { id: 'commissions', label: 'Commissions', href: '/dashboard/superadmin/commissions', icon: DollarSign },
    { id: 'audit-logs', label: 'Audit', href: '/dashboard/superadmin/audit-logs', icon: ShieldCheck },
    { id: 'menu', label: 'Menu', icon: Menu, action: onOpenMenu },
  ];

  return <MobileBottomNav items={items} onOpenMenu={onOpenMenu} />;
}

