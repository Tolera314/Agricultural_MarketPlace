'use client';

import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';

const ctaFarmerWoman = '/images/cta_farmer_woman_hd.png';

interface CtaBannerProps {
  onGetStarted: () => void;
  onLearnMore?: () => void;
}

export const CtaBanner: React.FC<CtaBannerProps> = ({ onGetStarted, onLearnMore }) => {
  return (
    <section id="cta" className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-20">
      <div className="relative rounded-3xl overflow-hidden bg-[#0A3828] dark:bg-[#062217] text-white border border-[#144F3A] dark:border-[#1E3A2F] shadow-lg transition-colors">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-center">
          {/* Left Content */}
          <div className="lg:col-span-7 p-6 sm:p-10 lg:p-12 z-10">
            {/* Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 dark:bg-white/5 text-white text-xs font-semibold tracking-wide mb-4 border border-white/15">
              <Sparkles className="w-3.5 h-3.5 text-[#81C784] dark:text-[#34D399]" />
              <span>Join AgriMarket Today</span>
            </div>

            {/* Heading */}
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Be Part of a Healthier
              <br />
              Food Future
            </h2>

            {/* Subtitle */}
            <p className="mt-3 text-xs sm:text-sm text-[#A8D3C0] dark:text-[#97CAB3] max-w-xl leading-relaxed">
              Whether you're a farmer, buyer, food cooperative, or delivery partner — AgriMarket is your trusted partner in agricultural trade.
            </p>

            {/* Action Buttons */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                onClick={onGetStarted}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#16A34A] hover:bg-[#15803D] dark:bg-[#10B981] dark:hover:bg-[#059669] text-white text-xs sm:text-sm font-bold transition-all shadow-sm hover:shadow cursor-pointer"
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={onLearnMore}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-white/30 hover:border-white text-white text-xs sm:text-sm font-semibold hover:bg-white/10 transition-colors cursor-pointer"
              >
                <span>Learn More</span>
              </button>
            </div>
          </div>

          {/* Right Image: Smiling Woman Farmer with harvest basket */}
          <div className="lg:col-span-5 relative h-64 sm:h-72 lg:h-full min-h-[260px] overflow-hidden flex items-end justify-center lg:justify-end">
            <img
              src={ctaFarmerWoman}
              alt="Farmer partner harvesting organic produce"
              className="w-full h-full object-cover object-center lg:object-right"
              loading="lazy"
            />
            {/* Subtle left gradient overlay on desktop to blend smoothly */}
            <div className="hidden lg:block absolute inset-y-0 left-0 w-28 bg-gradient-to-r from-[#0A3828] dark:from-[#062217] to-transparent pointer-events-none" />
          </div>
        </div>
      </div>
    </section>
  );
};
