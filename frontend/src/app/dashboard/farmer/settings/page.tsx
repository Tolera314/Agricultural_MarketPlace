'use client';

import React, { useState } from 'react';
import {
  Settings,
  Bell,
  Lock,
  Smartphone,
  Globe,
  CheckCircle2,
  Menu,
} from 'lucide-react';

export default function FarmerSettingsPage({
  onOpenSidebar,
}: {
  onOpenSidebar?: () => void;
}) {
  const [saved, setSaved] = useState(false);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#F4F6F5] dark:bg-[#0B1512]">
      {/* Header */}
      <header className="shrink-0 bg-white dark:bg-[#0D2118] border-b border-gray-100 dark:border-white/5 px-4 sm:px-6 h-16 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenSidebar}
            className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500 dark:text-gray-400 transition-colors cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-extrabold text-[#173F35] dark:text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              Farmer Settings & Alerts
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
              Manage SMS notifications, settlement preferences, and account security
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
          }}
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-sm"
        >
          {saved ? 'Settings Updated!' : 'Save Preferences'}
        </button>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 max-w-4xl text-xs">
        {/* Notifications */}
        <div className="bg-white dark:bg-[#0D2118] rounded-2xl border border-gray-100 dark:border-white/5 p-6 shadow-xs space-y-4">
          <h2 className="font-extrabold text-sm text-gray-800 dark:text-white flex items-center gap-2">
            <Bell className="w-4 h-4 text-emerald-600" />
            Alerts & Notifications
          </h2>

          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-white/5 cursor-pointer">
              <div>
                <div className="font-bold text-gray-800 dark:text-white">Instant SMS on New Produce Order</div>
                <div className="text-[11px] text-gray-400">Receive an SMS on +251 911 234 567 when a buyer places an order</div>
              </div>
              <input type="checkbox" defaultChecked className="w-4 h-4 accent-emerald-600" />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-white/5 cursor-pointer">
              <div>
                <div className="font-bold text-gray-800 dark:text-white">Courier Arrival Notice</div>
                <div className="text-[11px] text-gray-400">Get alerted when a delivery worker is within 3 km of your farm gate</div>
              </div>
              <input type="checkbox" defaultChecked className="w-4 h-4 accent-emerald-600" />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-white/5 cursor-pointer">
              <div>
                <div className="font-bold text-gray-800 dark:text-white">Market Price Intelligence Updates</div>
                <div className="text-[11px] text-gray-400">Daily average market prices for tomatoes, onions, and grains in Addis Ababa</div>
              </div>
              <input type="checkbox" defaultChecked className="w-4 h-4 accent-emerald-600" />
            </label>
          </div>
        </div>

        {/* Payment & Payout */}
        <div className="bg-white dark:bg-[#0D2118] rounded-2xl border border-gray-100 dark:border-white/5 p-6 shadow-xs space-y-4">
          <h2 className="font-extrabold text-sm text-gray-800 dark:text-white flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-emerald-600" />
            Default Payout Destination
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl border-2 border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20">
              <span className="font-bold text-emerald-900 dark:text-emerald-200">Telebirr Wallet (Active)</span>
              <p className="text-[11px] text-gray-500 mt-0.5">+251 911 234 567 · Verified</p>
            </div>
            <div className="p-3 rounded-xl border border-gray-200 dark:border-white/10 opacity-70">
              <span className="font-bold text-gray-700 dark:text-gray-300">Commercial Bank of Ethiopia</span>
              <p className="text-[11px] text-gray-500 mt-0.5">Account 1000293847291 · Verified</p>
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="bg-white dark:bg-[#0D2118] rounded-2xl border border-gray-100 dark:border-white/5 p-6 shadow-xs space-y-4">
          <h2 className="font-extrabold text-sm text-gray-800 dark:text-white flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-600" />
            Account Security
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-gray-500 mb-1 block">Registered Phone</label>
              <input
                type="text"
                disabled
                defaultValue="+251 911 234 567"
                className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-white/5 font-semibold text-gray-500"
              />
            </div>
            <div>
              <label className="font-bold text-gray-500 mb-1 block">Account Status</label>
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800/40">
                Active & Verified Producer
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
