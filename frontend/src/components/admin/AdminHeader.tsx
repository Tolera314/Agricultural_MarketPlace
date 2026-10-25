'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Search, Bell, LogOut, Shield } from 'lucide-react';
import { ThemeToggle } from '@/components/layout/ThemeToggle';

interface AdminHeaderProps {
  onSearch?: (query: string) => void;
}

export function AdminHeader({ onSearch }: AdminHeaderProps) {
  const router = useRouter();
  const [adminName, setAdminName] = useState('Selamawit Assefa');
  const [adminRole, setAdminRole] = useState('Administrator');
  const [avatarUrl, setAvatarUrl] = useState('/images/avatar_selamawit_hd.jpg');
  const [searchVal, setSearchVal] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    try {
      const rawUser = localStorage.getItem('agrimarket_user');
      if (rawUser) {
        const u = JSON.parse(rawUser);
        if (u.fullName) setAdminName(u.fullName);
        if (u.role === 'SUPERADMIN') setAdminRole('Super Administrator');
        else if (u.role === 'ADMIN') setAdminRole('Administrator');
      }
    } catch {
      // fallback to default
    }
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchVal(e.target.value);
    if (onSearch) onSearch(e.target.value);
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('agrimarket_token');
      localStorage.removeItem('agrimarket_user');
    } catch {
      // ignore
    }
    router.replace('/login');
  };

  return (
    <header className="h-18 px-8 bg-white/80 dark:bg-[#071912]/80 backdrop-blur-md border-b border-[#E5EAE7] dark:border-[#143226] flex items-center justify-between sticky top-0 z-10 transition-colors">
      {/* Search Input */}
      <div className="w-full max-w-md relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
        <input
          type="text"
          placeholder="Search anything..."
          value={searchVal}
          onChange={handleSearchChange}
          className="w-full pl-10 pr-4 py-2 text-sm bg-[#F4F7F5] dark:bg-[#0E261D] text-[#1E3028] dark:text-[#E2EBE6] rounded-xl border border-transparent focus:border-[#10B981] focus:bg-white dark:focus:bg-[#071912] focus:outline-none transition-all placeholder:text-gray-400"
        />
      </div>

      {/* Right Controls: Notification, Theme, Profile */}
      <div className="flex items-center gap-5">
        {/* Notification Icon */}
        <button
          title="System Notifications"
          className="relative p-2 text-gray-500 dark:text-gray-400 hover:text-[#064E3B] dark:hover:text-[#34D399] transition-colors rounded-xl hover:bg-gray-100 dark:hover:bg-[#0E261D]"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-[#071912]" />
        </button>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* User Profile Badge */}
        <div className="relative">
          <div
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-3 cursor-pointer group p-1 rounded-xl hover:bg-gray-50 dark:hover:bg-[#0E261D] transition-colors"
          >
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#10B981]/40 shrink-0 relative shadow-sm">
              <Image
                src={avatarUrl}
                alt={adminName}
                fill
                className="object-cover"
                sizes="40px"
              />
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-sm font-semibold text-[#1B362C] dark:text-[#E2EBE6] leading-tight group-hover:text-[#059669] transition-colors">
                {adminName}
              </div>
              <div className="text-[11px] font-medium text-gray-500 dark:text-gray-400 leading-none mt-0.5">
                {adminRole}
              </div>
            </div>
          </div>

          {/* Profile Dropdown */}
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#0A2218] border border-[#E5EAE7] dark:border-[#173D2F] rounded-2xl shadow-xl py-2 z-30 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-4 py-2 border-b border-gray-100 dark:border-[#173D2F]">
                <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">{adminName}</p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">{adminRole}</p>
              </div>
              <button
                onClick={() => router.push('/admin/settings')}
                className="w-full text-left px-4 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#0E261D] flex items-center gap-2"
              >
                <Shield className="w-3.5 h-3.5 text-emerald-600" />
                Settings & Security
              </button>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 flex items-center gap-2"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
