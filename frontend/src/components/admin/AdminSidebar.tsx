'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingBag,
  Truck,
  ClipboardList,
  ArrowLeftRight,
  MapPin,
  CreditCard,
  FileText,
  Settings,
  ShieldCheck,
  Headphones,
  ChevronRight,
  X,
} from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
}

const NAV_ITEMS: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard/admin', icon: LayoutDashboard },
  { name: 'Product Management', href: '/dashboard/admin/products', icon: Package },
  { name: 'Farmers', href: '/dashboard/admin/farmers', icon: Users },
  { name: 'Buyers', href: '/dashboard/admin/buyers', icon: ShoppingBag },
  { name: 'Delivery Workers', href: '/dashboard/admin/workers', icon: Truck },
  { name: 'Orders', href: '/dashboard/admin/orders', icon: ClipboardList },
  { name: 'Intercity Trade', href: '/dashboard/admin/intercity', icon: ArrowLeftRight },
  { name: 'Markets & Regions', href: '/dashboard/admin/markets', icon: MapPin },
  { name: 'Transactions', href: '/dashboard/admin/transactions', icon: CreditCard },
  { name: 'Reports', href: '/dashboard/admin/reports', icon: FileText },
  { name: 'Settings', href: '/dashboard/admin/settings', icon: Settings },
];

interface AdminSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function AdminSidebar({ isOpen = false, onClose }: AdminSidebarProps) {
  const pathname = usePathname();

  const SidebarBody = () => (
    <div className="flex flex-col h-full bg-[#0A3323] text-white">
      {/* Brand Header */}
      <div className="px-5 py-5 border-b border-[#124230] flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#10B981]/20 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" viewBox="0 0 36 36" fill="none">
              <path d="M18 4C18 4 23 11 23 18C23 21 21 24 18 25C15 24 13 21 13 18C13 11 18 4 18 4Z" fill="#10B981" />
              <path d="M16 26C16 26 9 24 7 18C5 12 11 9 11 9C11 9 13 16 17 21C17.5 21.6 18 22.2 18 22.2" fill="#059669" />
              <path d="M20 26C20 26 27 24 29 18C31 12 25 9 25 9C25 9 23 16 19 21C18.5 21.6 18 22.2 18 22.2" fill="#34D399" />
            </svg>
          </div>
          <div>
            <span className="font-black text-white text-base tracking-tight leading-none">AgriMarket</span>
            <p className="text-[9px] text-[#71A88F] font-semibold tracking-wider uppercase mt-0.5">
              Admin Operations
            </p>
          </div>
        </Link>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden text-white/70 hover:text-white cursor-pointer"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation list */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === '/dashboard/admin'
              ? pathname === '/dashboard/admin'
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => {
                if (onClose) onClose();
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#134D37] text-white shadow-sm'
                  : 'text-[#9BB8AA] hover:bg-[#0E3D2B] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? 'text-emerald-300' : 'text-[#8AA899]'
                  }`}
                />
                <span className="truncate">{item.name}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Assistance & GPS Audit Card */}
      <div className="p-3.5 border-t border-[#124230]">
        <div className="bg-[#0E3D2B] rounded-2xl p-3.5 border border-[#164C37] space-y-2.5">
          <Link
            href="/dashboard/admin/locations"
            onClick={() => {
              if (onClose) onClose();
            }}
            className="w-full flex items-center justify-between text-xs font-semibold text-emerald-300 hover:text-white transition-colors"
          >
            <span className="flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>GPS Privacy Audit</span>
            </span>
            <ChevronRight className="w-3.5 h-3.5 opacity-70" />
          </Link>
          <div className="pt-2 border-t border-[#164C37]">
            <p className="text-[11px] font-bold text-white mb-2">Admin Help Desk</p>
            <button
              onClick={() => alert('Admin Operations Hotline: +251 911 234 567')}
              className="w-full py-2 px-3 rounded-xl bg-[#134D37] hover:bg-[#1A5E44] text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <Headphones className="w-3.5 h-3.5 text-emerald-300" />
              <span>Contact Support</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sticky/Fixed Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:fixed lg:left-0 lg:top-0 lg:bottom-0 lg:w-60 lg:z-30 shadow-[4px_0_24px_rgba(0,0,0,0.06)]">
        <SidebarBody />
      </aside>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <div className="relative w-64 max-w-full h-full z-10">
            <SidebarBody />
          </div>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/90 dark:bg-[#0D2118] text-slate-800 dark:text-white flex items-center justify-center shadow-md cursor-pointer z-20"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}
    </>
  );
}
