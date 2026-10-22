'use client';

import React from 'react';
import { Users, ShoppingBag, Building2, CheckCircle2, ArrowRight, Sprout } from 'lucide-react';

const statsFarmBg = '/images/stats_farm_bg_clean.jpg';

interface CommunityImpactProps {
  onLearnMore?: () => void;
}

export const CommunityImpact: React.FC<CommunityImpactProps> = ({ onLearnMore }) => {
  return (
    <section id="about" className="py-10 sm:py-14 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-20">
      <div className="rounded-2xl sm:rounded-3xl overflow-hidden border border-[#D5E3DB] dark:border-[#1E3A2F] shadow-sm grid grid-cols-1 lg:grid-cols-12 min-h-[260px] transition-colors">
        {/* Left Side: Farm Field Background with single floating Stats Box */}
        <div
          className="lg:col-span-8 relative flex items-center justify-center p-3 xs:p-4 sm:p-8 lg:p-10 bg-cover bg-center overflow-hidden min-h-[280px] sm:min-h-[300px]"
          style={{ backgroundImage: `url(${statsFarmBg})` }}
        >
          {/* Subtle overlay for contrast in light and dark mode */}
          <div className="absolute inset-0 bg-black/25 dark:bg-black/50 backdrop-blur-[1px]" />

          {/* Clean Floating Card: ONLY card rendered (No overlapping/intercepted div) */}
          <div className="relative z-10 w-full max-w-2xl bg-white/95 dark:bg-[#11221C]/95 backdrop-blur-md rounded-xl sm:rounded-2xl p-4 sm:p-7 shadow-xl border border-white/80 dark:border-[#1E3A2F] transition-colors">
            <h3 className="text-sm xs:text-base sm:text-lg lg:text-xl font-bold text-[#11382B] dark:text-[#EDF7F1]">
              Trusted by Farmers, Buyers &amp; Communities
            </h3>
            <p className="text-[11px] sm:text-sm text-[#4A675B] dark:text-[#88A89A] mt-1 mb-4 sm:mb-6">
              We're building a transparent, resilient agricultural economy across Ethiopia, one transaction at a time.
            </p>

            {/* 4 Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 xs:gap-3 sm:gap-5 pt-3 border-t border-[#EDF3EF] dark:border-[#1E3A2F]">
              {/* Stat 1 */}
              <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-[#E8F5E9] dark:bg-[#18352A] flex items-center justify-center text-[#2E7D32] dark:text-[#34D399] shrink-0">
                  <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs xs:text-sm sm:text-base font-extrabold text-[#11382B] dark:text-[#EDF7F1] leading-none truncate">
                    12,500+
                  </div>
                  <div className="text-[10px] sm:text-[11px] text-[#638275] dark:text-[#7A9C8D] font-medium mt-0.5 sm:mt-1 truncate">
                    Farmers
                  </div>
                </div>
              </div>

              {/* Stat 2 */}
              <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-[#E8F5E9] dark:bg-[#18352A] flex items-center justify-center text-[#2E7D32] dark:text-[#34D399] shrink-0">
                  <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs xs:text-sm sm:text-base font-extrabold text-[#11382B] dark:text-[#EDF7F1] leading-none truncate">
                    5,200+
                  </div>
                  <div className="text-[10px] sm:text-[11px] text-[#638275] dark:text-[#7A9C8D] font-medium mt-0.5 sm:mt-1 truncate">
                    Buyers
                  </div>
                </div>
              </div>

              {/* Stat 3 */}
              <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-[#E8F5E9] dark:bg-[#18352A] flex items-center justify-center text-[#2E7D32] dark:text-[#34D399] shrink-0">
                  <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs xs:text-sm sm:text-base font-extrabold text-[#11382B] dark:text-[#EDF7F1] leading-none truncate">
                    120+
                  </div>
                  <div className="text-[10px] sm:text-[11px] text-[#638275] dark:text-[#7A9C8D] font-medium mt-0.5 sm:mt-1 truncate">
                    Cities &amp; Towns
                  </div>
                </div>
              </div>

              {/* Stat 4 */}
              <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-[#E8F5E9] dark:bg-[#18352A] flex items-center justify-center text-[#2E7D32] dark:text-[#34D399] shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs xs:text-sm sm:text-base font-extrabold text-[#11382B] dark:text-[#EDF7F1] leading-none truncate">
                    98%
                  </div>
                  <div className="text-[10px] sm:text-[11px] text-[#638275] dark:text-[#7A9C8D] font-medium mt-0.5 sm:mt-1 truncate">
                    Delivery Rate
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Deep Forest Green Impact Panel */}
        <div className="lg:col-span-4 bg-[#0A3828] dark:bg-[#081E16] text-white p-5 sm:p-8 lg:p-10 flex flex-col justify-center border-t lg:border-t-0 lg:border-l border-[#144F3A] dark:border-[#1E3A2F]">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/10 flex items-center justify-center mb-3 sm:mb-4 text-[#34D399]">
            <Sprout className="w-5 h-5" />
          </div>

          <h3 className="text-lg sm:text-2xl font-bold tracking-tight text-white">
            More Than a Marketplace
          </h3>
          <p className="mt-2 text-xs sm:text-sm text-[#A5D6A7] dark:text-[#8ECFB0] leading-relaxed">
            We empower local farmers, support rural communities, and bring fresh, healthy food to every household and culinary business.
          </p>

          <div className="mt-5 sm:mt-6">
            <button
              onClick={onLearnMore}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full border border-white/40 hover:border-white text-xs sm:text-sm font-semibold text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <span>Our Impact</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
