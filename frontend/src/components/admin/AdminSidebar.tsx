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
  Sprout,
  Headphones,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
}

const NAV_ITEMS: NavItem[] = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Product Management', href: '/admin/products', icon: Package },
  { name: 'Farmers', href: '/admin/farmers', icon: Users },
  { name: 'Buyers', href: '/admin/buyers', icon: ShoppingBag },
  { name: 'Delivery Workers', href: '/admin/workers', icon: Truck },
  { name: 'Orders', href: '/admin/orders', icon: ClipboardList },
  { name: 'Intercity Trade', href: '/admin/intercity', icon: ArrowLeftRight },
  { name: 'Markets & Regions', href: '/admin/markets', icon: MapPin },
  { name: 'Transactions', href: '/admin/transactions', icon: CreditCard },
  { name: 'Reports', href: '/admin/reports', icon: FileText },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 min-w-[16rem] bg-[#053F2E] text-white flex flex-col justify-between shrink-0 select-none border-r border-[#0A4D3A] shadow-xl z-20 transition-all duration-300">
      {/* Top Branding */}
      <div>
        <div className="p-6 pb-4">
          <Link href="/admin" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-[#10B981]/20 border border-[#10B981]/30 flex items-center justify-center text-[#34D399] shadow-inner group-hover:scale-105 transition-transform">
              <Sprout className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5 font-display">
                AgriMarket
              </div>
              <div className="text-[11px] font-medium text-[#A7F3D0]/70 tracking-tight leading-none mt-0.5">
                Farmers · Buyers · Better Tomorrow
              </div>
            </div>
          </Link>
        </div>

        {/* Navigation list */}
        <nav className="px-3 py-2 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === '/admin'
                ? pathname === '/admin'
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
                  isActive
                    ? 'bg-[#0E5C45] text-white font-semibold shadow-sm'
                    : 'text-[#9CB6AC] hover:text-white hover:bg-[#094A38]'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? 'text-[#34D399]' : 'text-[#7D9F92] group-hover:text-[#A7F3D0]'
                  }`}
                />
                <span className="truncate">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Assistance & Compliance */}
      <div className="p-4 space-y-3">
        {/* GPS Audit Records Quick Access */}
        <Link
          href="/admin/locations"
          className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors ${
            pathname.startsWith('/admin/locations')
              ? 'bg-[#0E5C45] text-white'
              : 'text-[#9CB6AC] hover:text-white hover:bg-[#094A38]'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-[#34D399]" />
            <span>GPS Privacy Audit</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 opacity-60" />
        </Link>

        {/* Support Box */}
        <div className="bg-[#094A38]/70 border border-[#0F5E48] rounded-2xl p-4 text-xs">
          <p className="font-semibold text-white mb-1">Need Help?</p>
          <div className="flex items-center gap-2 text-[#9CB6AC] hover:text-[#34D399] transition-colors cursor-pointer">
            <Headphones className="w-3.5 h-3.5" />
            <span>Contact Support</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
