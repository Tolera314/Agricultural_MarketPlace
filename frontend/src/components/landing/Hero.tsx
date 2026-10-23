'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles, TrendingUp, Sprout } from 'lucide-react';
import { MarketLocation } from '@/types';

interface HeroProps {
  currentLocation: MarketLocation;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onSelectSuggestion: (categoryOrTag: string) => void;
  onExploreClick: () => void;
  onStartSellingClick: () => void;
}

export const Hero: React.FC<HeroProps> = ({
  currentLocation,
  onSelectSuggestion,
  onExploreClick,
  onStartSellingClick,
}) => {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleMarketCardClick = () => {
    showToast(`Tomato ETB 18–22/kg · High demand in ${currentLocation.name}`);
    onSelectSuggestion('Tomato');
    onExploreClick();
  };

  return (
    <>
      <style>{`
        /* ── Hero Container ── */
        .agri-hero {
          position: relative;
          width: 100%;
          min-height: 520px;
          overflow: hidden;
        }

        /* ── Desktop & Mobile Photo Backgrounds ── */
        .agri-hero-bg {
          position: absolute;
          inset: 0;
          background-image: url('/images/hero_farm_bg.jpg');
          background-size: cover;
          background-position: right 20% center;
          background-repeat: no-repeat;
          z-index: 0;
        }

        @media (min-width: 1536px) {
          .agri-hero-bg {
            background-position: right center;
          }
        }

        @media (max-width: 768px) {
          .agri-hero {
            min-height: 560px;
          }
          .agri-hero-bg {
            background-image: url('/images/hero_farm_mobile_bg.jpg');
            background-position: center bottom;
            background-size: cover;
          }
        }

        /* ── Light Mode Gradient Overlay ── */
        .agri-hero-overlay {
          position: absolute;
          inset: 0;
          z-index: 1;
          pointer-events: none;
          background: linear-gradient(
            90deg,
            rgba(250, 248, 245, 0.98) 0%,
            rgba(250, 248, 245, 0.94) 35%,
            rgba(250, 248, 245, 0.75) 50%,
            rgba(250, 248, 245, 0.20) 70%,
            rgba(250, 248, 245, 0) 85%
          );
        }

        /* ── Dark Mode Gradient Overlay ── */
        .dark .agri-hero-overlay {
          background: linear-gradient(
            90deg,
            rgba(11, 21, 18, 0.98) 0%,
            rgba(11, 21, 18, 0.94) 38%,
            rgba(11, 21, 18, 0.78) 55%,
            rgba(11, 21, 18, 0.35) 75%,
            rgba(11, 21, 18, 0.15) 100%
          );
        }

        @media (max-width: 1024px) {
          .agri-hero-overlay {
            background: linear-gradient(
              180deg,
              rgba(250, 248, 245, 0.98) 0%,
              rgba(250, 248, 245, 0.95) 45%,
              rgba(250, 248, 245, 0.85) 70%,
              rgba(250, 248, 245, 1) 100%
            );
          }
          .dark .agri-hero-overlay {
            background: linear-gradient(
              180deg,
              rgba(11, 21, 18, 0.98) 0%,
              rgba(11, 21, 18, 0.95) 45%,
              rgba(11, 21, 18, 0.85) 70%,
              rgba(11, 21, 18, 1) 100%
            );
          }
        }

        /* ── Pulse animation for signal bars ── */
        @keyframes pulse-bar {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        .signal-bar {
          display: inline-block;
          width: 3px;
          border-radius: 2px;
          background-color: #10B981;
          animation: pulse-bar 2s ease-in-out infinite;
        }
        .signal-bar:nth-child(2) { animation-delay: 0.2s; }
        .signal-bar:nth-child(3) { animation-delay: 0.4s; }

        /* ── Floating Market Card Styling ── */
        .market-price-card {
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          background: rgba(255, 255, 255, 0.92);
          border: 1px solid rgba(229, 237, 228, 0.9);
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04);
          border-radius: 18px;
          cursor: pointer;
          pointer-events: auto;
          transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
        }
        .dark .market-price-card {
          background: rgba(17, 34, 28, 0.92);
          border: 1px solid rgba(31, 58, 48, 0.9);
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.35);
        }
        .market-price-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 16px 32px -6px rgba(0, 0, 0, 0.12);
        }
      `}</style>

      {/* Floating interactive toast */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-[#075C3B] text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-full shadow-xl flex items-center gap-2 border border-emerald-400/30 transition-all duration-300"
        >
          <Sparkles className="w-4 h-4 text-emerald-300 animate-spin" />
          <span>{toastMessage}</span>
        </div>
      )}

      <section
        id="hero"
        aria-label="AgriMarket Hero Section"
        className="agri-hero flex items-center relative transition-colors"
      >
        {/* Farm Background Photo */}
        <div className="agri-hero-bg" aria-hidden="true" />

        {/* Readability Gradient Overlay */}
        <div className="agri-hero-overlay" aria-hidden="true" />

        {/* Main Content Layout */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14 lg:py-20 flex flex-col lg:flex-row items-center justify-between">
          
          {/* Left Column: Headline, Subtitle, and CTAs */}
          <div className="w-full lg:w-[54%] max-w-2xl text-left">
            {/* Pill Tag */}
            <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 text-[#0F7638] dark:text-[#34D399] text-[11px] sm:text-xs font-bold tracking-wide mb-3 sm:mb-5">
              <Sprout className="w-3.5 h-3.5 text-[#0F7638] dark:text-[#34D399]" />
              <span>Ethiopian Agriculture Marketplace</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-[52px] font-extrabold text-[#111827] dark:text-[#F3FAF6] tracking-tight leading-[1.14] mb-3 sm:mb-4">
              Better Prices.
              <br />
              Stronger Farmers.
              <br />
              <span className="text-[#0F7638] dark:text-[#34D399]">A Healthier Future.</span>
            </h1>

            {/* Subtitle */}
            <p className="text-xs sm:text-base lg:text-lg text-[#374151] dark:text-[#A7BFB2] font-medium leading-relaxed max-w-lg mb-5 sm:mb-8">
              Buy and sell agricultural products, get real-time market prices, receive weather alerts, and access expert tips — all in one trusted platform.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 bg-[#0F7638] hover:bg-[#0B5C2B] dark:bg-[#10B981] dark:hover:bg-[#059669] text-white font-bold text-xs sm:text-base px-6 sm:px-7 py-3 sm:py-3.5 rounded-full shadow-lg shadow-emerald-900/20 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                aria-label="Get started on AgriMarket"
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <button
                type="button"
                onClick={onExploreClick}
                className="inline-flex items-center justify-center border-2 border-[#15803D] dark:border-[#10B981] text-[#15803D] dark:text-[#34D399] hover:bg-emerald-50/80 dark:hover:bg-[#18352A] bg-white/80 dark:bg-[#0E1E19]/80 backdrop-blur-sm font-bold text-xs sm:text-base px-6 sm:px-7 py-3 sm:py-3.5 rounded-full transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                aria-label="Browse fresh agricultural products"
              >
                Explore Marketplace
              </button>
            </div>

            {/* Mobile Floating Market Price Card */}
            <div className="block lg:hidden w-full mt-5 mb-2">
              <div
                className="market-price-card p-4 mx-auto max-w-xs"
                role="button"
                tabIndex={0}
                onClick={handleMarketCardClick}
                onKeyDown={(e) => e.key === 'Enter' && handleMarketCardClick()}
                aria-label="Tomato market price details"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">Market Price (Today)</span>
                  <div className="flex items-end gap-1 h-3.5" aria-hidden="true">
                    <span className="signal-bar h-1.5" />
                    <span className="signal-bar h-2.5" />
                    <span className="signal-bar h-3.5" />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {/* Replaced emoji with clean stylized icon badge */}
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-white shadow-sm flex-shrink-0">
                      <Sprout className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">Tomato</div>
                      <div className="text-sm sm:text-base font-extrabold text-[#111827] dark:text-white whitespace-nowrap">
                        ETB 18 – 22 <span className="text-[11px] font-normal text-gray-500 dark:text-gray-400">/kg</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 text-xs font-bold text-[#16A34A] dark:text-[#34D399] bg-emerald-50 dark:bg-emerald-950/60 px-2 py-1 rounded-md">
                    <TrendingUp className="w-3.5 h-3.5 mr-0.5" />
                    <span>6%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (Desktop): Floating Market Price Card */}
          <div className="hidden lg:flex w-[44%] relative items-center justify-start pointer-events-none pl-4 xl:pl-10">
            <div
              className="market-price-card p-4 sm:p-5 w-72"
              role="button"
              tabIndex={0}
              onClick={handleMarketCardClick}
              onKeyDown={(e) => e.key === 'Enter' && handleMarketCardClick()}
              aria-label="Tomato market price details"
            >
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Market Price (Today)</span>
                <div className="flex items-end gap-1 h-3.5" aria-hidden="true">
                  <span className="signal-bar h-1.5" />
                  <span className="signal-bar h-2.5" />
                  <span className="signal-bar h-3.5" />
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {/* Replaced emoji with clean stylized icon badge */}
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-white shadow-sm flex-shrink-0">
                    <Sprout className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Tomato</div>
                    <div className="text-base font-extrabold text-[#111827] dark:text-white whitespace-nowrap">
                      ETB 18 – 22 <span className="text-xs font-normal text-gray-500 dark:text-gray-400">/kg</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-0.5 text-xs font-bold text-[#16A34A] dark:text-[#34D399] bg-emerald-50 dark:bg-emerald-950/60 px-2 py-1 rounded-md">
                  <TrendingUp className="w-3.5 h-3.5 mr-0.5" />
                  <span>6%</span>
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
                <span>{currentLocation.name}</span>
                <span className="text-[#0F7638] dark:text-[#34D399] font-semibold hover:underline">View Trend →</span>
              </div>
            </div>
          </div>

        </div>
      </section>
    </>
  );
};
