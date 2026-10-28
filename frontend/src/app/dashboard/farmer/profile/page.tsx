'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  User,
  MapPin,
  Award,
  Phone,
  Mail,
  Edit3,
  CheckCircle2,
  Menu,
  Sparkles,
} from 'lucide-react';

export default function (props: any) {
  const onOpenSidebar = props?.onOpenSidebar;
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
              <User className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              Farm Profile & Credentials
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
              Manage public farm details, bio, and organic certifications
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
          {saved ? 'Changes Saved!' : 'Save Profile'}
        </button>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 max-w-4xl">
        {/* Banner Card */}
        <div className="bg-white dark:bg-[#0D2118] rounded-3xl border border-gray-100 dark:border-white/5 shadow-xs overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-emerald-800 to-teal-700 relative">
            <div className="absolute -bottom-10 left-6">
              <div className="w-20 h-20 rounded-2xl border-4 border-white dark:border-[#0D2118] overflow-hidden relative shadow-md bg-emerald-100">
                <Image src="/images/avatar_abebe_hd.jpg" alt="Tesfaye Abebe" fill className="object-cover" />
              </div>
            </div>
          </div>
          <div className="pt-12 p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-xl font-black text-gray-800 dark:text-white flex items-center gap-2">
                  Tesfaye Abebe
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                </h2>
                <p className="text-xs text-gray-500">Green Highland Valley Organic Farm · Certified Producer</p>
              </div>
              <span className="self-start px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                Verified Seller (Tier 1)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-gray-600 dark:text-gray-300 pt-2 border-t border-gray-100 dark:border-white/5">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span>Sebeta, Oromia Special Zone</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-600" />
                <span>+251 911 234 567</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-emerald-600" />
                <span>tesfaye.farm@agrimarket.et</span>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Inputs */}
        <div className="bg-white dark:bg-[#0D2118] rounded-3xl border border-gray-100 dark:border-white/5 shadow-xs p-6 space-y-4 text-xs">
          <h3 className="font-extrabold text-sm text-gray-800 dark:text-white">Farm Details</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-gray-500 mb-1 block">Farm Name</label>
              <input
                type="text"
                defaultValue="Green Highland Valley Farm"
                className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 font-semibold"
              />
            </div>
            <div>
              <label className="font-bold text-gray-500 mb-1 block">Primary Region / Woreda</label>
              <input
                type="text"
                defaultValue="Sebeta Woreda, Oromia"
                className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 font-semibold"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-gray-500 mb-1 block">Farm Bio & Mission</label>
            <textarea
              rows={3}
              defaultValue="Producing export-quality organic tomatoes, onions, sidama coffee, and seasonal pulses using drip irrigation and non-chemical composting since 2018."
              className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 font-medium"
            />
          </div>

          <div className="pt-2">
            <label className="font-bold text-gray-500 mb-2 block">Crops & Specialties</label>
            <div className="flex flex-wrap gap-2">
              {['Tomatoes', 'Red Onions', 'Sidama Arabica Coffee', 'Yellow Maize', 'Navel Oranges', 'Green Beans'].map((c) => (
                <span key={c} className="px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800/40">
                  {c}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
