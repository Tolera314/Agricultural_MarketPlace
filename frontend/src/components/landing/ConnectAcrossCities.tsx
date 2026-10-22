'use client';

import React from 'react';
import { Route, Receipt, ShieldCheck, CreditCard, ArrowRight, MapPin } from 'lucide-react';

const intercityRouteMap = '/images/intercity_route_map_hd.png';

interface ConnectAcrossCitiesProps {
  onLearnMore?: () => void;
}

export const ConnectAcrossCities: React.FC<ConnectAcrossCitiesProps> = ({ onLearnMore }) => {
  const features = [
    {
      title: 'Configured City Pairs',
      desc: 'Dedicated cold & dry freight transit corridors',
      icon: Route,
    },
    {
      title: 'Transparent Pricing',
      desc: 'Fair commission & standardized regional freight rates',
      icon: Receipt,
    },
    {
      title: 'Quality Compliance',
      desc: 'Direct harvest inspection & certified origins',
      icon: ShieldCheck,
    },
    {
      title: 'Secure Settlement',
      desc: 'Escrow protection and prompt payouts upon arrival',
      icon: CreditCard,
    },
  ];

  return (
    <section id="intercity-trade" className="py-10 sm:py-14 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#EDF3EF] dark:border-[#1A3329] scroll-mt-20 relative">
      <div id="markets" className="absolute -top-24 left-0 pointer-events-none" />

      {/* Header */}
      <div className="mb-8 sm:mb-10 text-left">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8F5E9] dark:bg-[#163327] text-[#2E7D32] dark:text-[#34D399] text-xs font-semibold tracking-wide mb-3 border border-emerald-200/50 dark:border-emerald-800/40">
          <MapPin className="w-3.5 h-3.5 text-[#2E7D32] dark:text-[#34D399]" />
          <span>Intercity Trade</span>
        </div>

        <h2 className="text-xl xs:text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#11382B] dark:text-[#E8F7EE] tracking-tight">
          Connect Across Cities
        </h2>
        <p className="mt-1.5 sm:mt-2 text-xs sm:text-base text-[#4A675B] dark:text-[#88A89A] max-w-3xl">
          Buy and sell agricultural products across regions with verified transport logistics, cold-chain safety, and escrow protection.
        </p>
      </div>

      {/* Grid: Left 4 Features + Learn More, Right Map Graphic */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-12 items-center">
        {/* Left Column */}
        <div className="lg:col-span-5 space-y-5 sm:space-y-6">
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {features.map((feat, idx) => {
              const IconComp = feat.icon;
              return (
                <div
                  key={idx}
                  className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white dark:bg-[#11221C] border border-[#E2EAE5] dark:border-[#1E3A2F] shadow-2xs hover:border-[#2E7D32]/50 dark:hover:border-[#34D399]/50 transition-colors flex flex-col justify-between"
                >
                  <div>
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-[#E8F5E9] dark:bg-[#18352A] flex items-center justify-center text-[#2E7D32] dark:text-[#34D399] mb-2 sm:mb-3">
                      <IconComp className="w-4 h-4" />
                    </div>
                    <h4 className="text-xs sm:text-sm font-bold text-[#11382B] dark:text-[#EDF7F1] leading-snug">
                      {feat.title}
                    </h4>
                    <p className="text-[10px] sm:text-[11px] text-[#638275] dark:text-[#7A9C8D] leading-snug mt-1">
                      {feat.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-1 sm:pt-2">
            <button
              onClick={onLearnMore}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#143D2D] hover:bg-[#1C523C] dark:bg-[#10B981] dark:hover:bg-[#059669] text-white text-xs sm:text-sm font-semibold transition-all shadow-sm hover:shadow cursor-pointer"
            >
              <span>Explore Trade Routes</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right Column: Intercity Route Graphic */}
        <div className="lg:col-span-7 flex justify-center lg:justify-end mt-2 lg:mt-0">
          <div className="relative w-full max-w-sm sm:max-w-[540px] rounded-2xl sm:rounded-3xl overflow-hidden bg-white/40 dark:bg-emerald-950/20 p-2 border border-[#E2EAE5]/60 dark:border-[#1E3A2F]">
            <img
              src={intercityRouteMap}
              alt="Intercity agricultural route between Addis Ababa and regional hubs"
              className="w-full h-auto object-contain drop-shadow-sm select-none rounded-xl sm:rounded-2xl"
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </section>
  );
};
