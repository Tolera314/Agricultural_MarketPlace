'use client';

import React from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Truck,
  DollarSign,
  User,
  Star,
  MessageSquare,
  Settings,
  HelpCircle,
  HeadphonesIcon,
  X,
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { id: 'dashboard',  label: 'Dashboard',    icon: <LayoutDashboard className="w-[18px] h-[18px]" /> },
  { id: 'products',   label: 'My Products',  icon: <Package         className="w-[18px] h-[18px]" /> },
  { id: 'orders',     label: 'Orders',       icon: <ShoppingCart    className="w-[18px] h-[18px]" /> },
  { id: 'deliveries', label: 'Deliveries',   icon: <Truck           className="w-[18px] h-[18px]" /> },
  { id: 'earnings',   label: 'Earnings',     icon: <DollarSign      className="w-[18px] h-[18px]" /> },
  { id: 'profile',    label: 'Farm Profile', icon: <User            className="w-[18px] h-[18px]" /> },
  { id: 'reviews',    label: 'Reviews',      icon: <Star            className="w-[18px] h-[18px]" /> },
  { id: 'messages',   label: 'Messages',     icon: <MessageSquare   className="w-[18px] h-[18px]" /> },
  { id: 'settings',   label: 'Settings',     icon: <Settings        className="w-[18px] h-[18px]" /> },
];

interface FarmerSidebarProps {
  activePage: string;
  onNavigate: (page: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function FarmerSidebar({
  activePage,
  onNavigate,
  isOpen,
  onClose,
}: FarmerSidebarProps) {
  return (
    <aside
      className={`
        fixed lg:static inset-y-0 left-0 z-40
        w-[220px] xl:w-[232px] flex flex-col shrink-0
        bg-[#173F35] dark:bg-[#0E2B20]
        text-white shadow-2xl
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}
    >
      {/* ── Logo ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/10">
        <Link href="/" className="flex items-center gap-2.5 group min-w-0" onClick={onClose}>
          {/* AgriMarket leaf logo SVG */}
          <div className="w-8 h-8 shrink-0 flex items-center justify-center">
            <svg className="w-8 h-8" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M18 4C18 4 23 11 23 18C23 21 21 24 18 25C15 24 13 21 13 18C13 11 18 4 18 4Z" fill="#10B981" />
              <path d="M16 26C16 26 9 24 7 18C5 12 11 9 11 9C11 9 13 16 17 21C17.5 21.6 18 22.2 18 22.2" fill="#059669" />
              <path d="M20 26C20 26 27 24 29 18C31 12 25 9 25 9C25 9 23 16 19 21C18.5 21.6 18 22.2 18 22.2" fill="#34D399" />
              <path d="M18 25V30" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
          <div className="flex flex-col leading-tight min-w-0">
            <span className="font-extrabold text-[15px] text-white tracking-tight truncate">
              AgriMarket
            </span>
            <span className="text-[9px] text-emerald-300/70 font-medium tracking-wider truncate">
              Farmers · Buyers · Better Tomorrow
            </span>
          </div>
        </Link>

        {/* Mobile close */}
        <button
          onClick={onClose}
          className="lg:hidden p-1.5 ml-1 rounded-lg hover:bg-white/10 transition-colors text-white/70 hover:text-white shrink-0"
          aria-label="Close sidebar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* ── Navigation ────────────────────────────────────── */}
      <nav className="flex-1 px-3 py-3.5 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => { onNavigate(item.id); onClose(); }}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium
                transition-all duration-150 cursor-pointer text-left select-none
                ${isActive
                  ? 'bg-white/15 text-white'
                  : 'text-white/60 hover:text-white hover:bg-white/8'
                }
              `}
            >
              <span className={`shrink-0 transition-colors ${isActive ? 'text-emerald-300' : 'text-white/50'}`}>
                {item.icon}
              </span>
              <span className="flex-1 truncate">{item.label}</span>
              {isActive && (
                <span className="w-1.5 h-5 rounded-full bg-emerald-400 shrink-0" />
              )}
            </button>
          );
        })}
      </nav>

      {/* ── Footer Help ───────────────────────────────────── */}
      <div className="px-3 pb-5 space-y-2">
        <div className="rounded-xl bg-white/8 border border-white/10 p-3.5">
          <div className="flex items-center gap-2 mb-2.5">
            <HelpCircle className="w-4 h-4 text-emerald-300 shrink-0" />
            <span className="text-xs font-bold text-white">Need Help?</span>
          </div>
          <button className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 text-xs font-semibold transition-colors cursor-pointer">
            <HeadphonesIcon className="w-3.5 h-3.5" />
            Contact Support
          </button>
        </div>
      </div>
    </aside>
  );
}
