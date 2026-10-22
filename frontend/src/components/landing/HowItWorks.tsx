'use client';

import React from 'react';
import { Search, ShoppingBag, Truck, CheckCircle2, ArrowRight, HelpCircle } from 'lucide-react';

const howItWorksIllustration = '/images/how_it_works_illustration_hd.png';

interface HowItWorksProps {
  onExploreProducts: () => void;
}

export const HowItWorks: React.FC<HowItWorksProps> = ({ onExploreProducts }) => {
  const steps = [
    {
      number: '1',
      title: 'Find Products',
      desc: 'Browse and discover seasonal fresh produce directly from nearby farmers.',
      icon: Search,
    },
    {
      number: '2',
      title: 'Place Order',
      desc: 'Select preferred harvest, set custom quantity, and checkout securely.',
      icon: ShoppingBag,
    },
    {
      number: '3',
      title: 'Track Delivery',
      desc: 'Follow cold-chain logistics in real-time until it arrives at your doorstep.',
      icon: Truck,
    },
    {
      number: '4',
      title: 'Enjoy Freshness',
      desc: 'Receive farm-fresh harvests and support local farming families directly.',
      icon: CheckCircle2,
    },
  ];

  return (
    <section id="how-it-works" className="py-10 sm:py-14 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#EDF3EF] dark:border-[#1A3329] scroll-mt-20">
      {/* Section Header */}
      <div className="mb-8 sm:mb-10 text-left">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8F5E9] dark:bg-[#163327] text-[#2E7D32] dark:text-[#34D399] text-xs font-semibold tracking-wide mb-3 border border-emerald-200/50 dark:border-emerald-800/40">
          <HelpCircle className="w-3.5 h-3.5 text-[#2E7D32] dark:text-[#34D399]" />
          <span>How It Works</span>
        </div>

        <h2 className="text-xl xs:text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#11382B] dark:text-[#E8F7EE] tracking-tight">
          Simple Steps to Get Fresh Products
        </h2>
        <p className="mt-1.5 sm:mt-2 text-xs sm:text-base text-[#4A675B] dark:text-[#88A89A]">
          From verified local farms to your home or shop — easy, transparent, and dependable.
        </p>
      </div>

      {/* Content Layout: Left steps, Right illustration */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-12 items-center">
        {/* Left: 4 steps */}
        <div className="lg:col-span-6 space-y-5 sm:space-y-6">
          <div className="grid grid-cols-2 gap-3 sm:gap-5">
            {steps.map((step) => {
              const IconComponent = step.icon;
              return (
                <div
                  key={step.number}
                  className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-white dark:bg-[#11221C] border border-[#E2EAE5] dark:border-[#1E3A2F] shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2.5 mb-2">
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-[#E8F5E9] dark:bg-[#18352A] border border-[#C8E6C9] dark:border-[#224A3B] flex items-center justify-center text-[#2E7D32] dark:text-[#34D399] font-bold text-xs shrink-0">
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] sm:text-xs font-bold text-[#2E7D32] dark:text-[#34D399] uppercase tracking-wider">
                        Step 0{step.number}
                      </span>
                    </div>
                    <h3 className="text-xs sm:text-base font-bold text-[#143D2D] dark:text-[#EDF7F1]">
                      {step.title}
                    </h3>
                    <p className="mt-1 text-[11px] sm:text-xs text-[#527063] dark:text-[#88A89A] leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-1 sm:pt-2">
            <button
              onClick={onExploreProducts}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#143D2D] hover:bg-[#1C523C] dark:bg-[#10B981] dark:hover:bg-[#059669] text-white text-xs sm:text-sm font-semibold transition-all shadow-sm hover:shadow cursor-pointer"
            >
              <span>Explore All Products</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right: Phone & Delivery truck landscape graphic */}
        <div className="lg:col-span-6 flex justify-center lg:justify-end mt-2 lg:mt-0">
          <div className="relative w-full max-w-sm sm:max-w-[480px] rounded-2xl sm:rounded-3xl overflow-hidden bg-white/40 dark:bg-emerald-950/20 p-2 border border-[#E2EAE5]/60 dark:border-[#1E3A2F]">
            <img
              src={howItWorksIllustration}
              alt="How AgriMarket Works - Order farm fresh produce delivered to your doorstep"
              className="w-full h-auto object-contain drop-shadow-sm select-none rounded-xl sm:rounded-2xl"
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </section>
  );
};
