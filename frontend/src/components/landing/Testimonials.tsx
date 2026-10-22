'use client';

import React, { useState } from 'react';
import { Star, ChevronLeft, ChevronRight, MessageSquareQuote } from 'lucide-react';
import { TESTIMONIALS_DATA } from '@/data/marketplaceData';

export const Testimonials: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? TESTIMONIALS_DATA.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === TESTIMONIALS_DATA.length - 1 ? 0 : prev + 1));
  };

  return (
    <section id="testimonials" className="py-10 sm:py-14 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#EDF3EF] dark:border-[#1A3329] scroll-mt-20">
      {/* Header */}
      <div className="text-center mb-8 sm:mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8F5E9] dark:bg-[#163327] text-[#2E7D32] dark:text-[#34D399] text-xs font-semibold tracking-wide mb-3 border border-emerald-200/50 dark:border-emerald-800/40">
          <MessageSquareQuote className="w-3.5 h-3.5 text-[#2E7D32] dark:text-[#34D399]" />
          <span>What Our Community Says</span>
        </div>

        <h2 className="text-xl xs:text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#11382B] dark:text-[#E8F7EE] tracking-tight">
          Trusted by Thousands
        </h2>
        <p className="mt-1.5 sm:mt-2 text-xs sm:text-base text-[#4A675B] dark:text-[#88A89A] max-w-2xl mx-auto px-2">
          Real feedback from producers, domestic buyers, and regional logistics couriers across our network.
        </p>
      </div>

      {/* Desktop / Tablet Grid (3 columns on md+) */}
      <div className="hidden md:grid md:grid-cols-3 gap-5">
        {TESTIMONIALS_DATA.map((t) => (
          <div
            key={t.id}
            className="bg-white dark:bg-[#11221C] rounded-2xl p-5 sm:p-6 border border-[#E2EAE5] dark:border-[#1E3A2F] shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
          >
            {/* Quote */}
            <p className="text-xs sm:text-sm text-[#3E5C50] dark:text-[#9FBDB0] leading-relaxed mb-6 italic">
              {t.quote}
            </p>

            {/* Author & Rating */}
            <div className="flex items-center gap-3.5 pt-4 border-t border-[#F0F5F2] dark:border-[#1E3A2F]">
              <img
                src={t.avatar}
                alt={t.name}
                className="w-11 h-11 rounded-full object-cover border-2 border-[#C8E6C9] dark:border-[#224A3B] shrink-0"
                loading="lazy"
              />
              <div className="flex-1 min-w-0">
                <h4 className="text-xs sm:text-sm font-bold text-[#11382B] dark:text-[#EDF7F1] truncate">
                  {t.name}
                </h4>
                <p className="text-[11px] text-[#638275] dark:text-[#7A9C8D] truncate">
                  {t.role}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Mobile Interactive Carousel Card (< 768px) */}
      <div className="md:hidden">
        {(() => {
          const current = TESTIMONIALS_DATA[currentIndex];
          return (
            <div className="bg-white dark:bg-[#11221C] rounded-2xl p-4 xs:p-5 border border-[#E2EAE5] dark:border-[#1E3A2F] shadow-xs flex flex-col justify-between min-h-[200px]">
              {/* Quote */}
              <p className="text-xs sm:text-sm text-[#3E5C50] dark:text-[#9FBDB0] leading-relaxed mb-5 italic">
                "{current.quote}"
              </p>

              {/* Author & Rating */}
              <div className="flex items-center justify-between pt-3.5 border-t border-[#F0F5F2] dark:border-[#1E3A2F]">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={current.avatar}
                    alt={current.name}
                    className="w-10 h-10 rounded-full object-cover border-2 border-[#C8E6C9] dark:border-[#224A3B] shrink-0"
                    loading="lazy"
                  />
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-[#11382B] dark:text-[#EDF7F1] truncate">
                      {current.name}
                    </h4>
                    <p className="text-[10px] text-[#638275] dark:text-[#7A9C8D] truncate">
                      {current.role}
                    </p>
                    <div className="flex items-center gap-0.5 mt-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Mobile Arrows */}
                <div className="flex items-center gap-1.5 shrink-0 pl-2">
                  <button
                    onClick={handlePrev}
                    aria-label="Previous testimonial"
                    className="w-8 h-8 rounded-full bg-[#F0F5F2] dark:bg-[#162D24] text-[#2E7D32] dark:text-[#34D399] flex items-center justify-center hover:bg-[#E8F5E9] cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleNext}
                    aria-label="Next testimonial"
                    className="w-8 h-8 rounded-full bg-[#F0F5F2] dark:bg-[#162D24] text-[#2E7D32] dark:text-[#34D399] flex items-center justify-center hover:bg-[#E8F5E9] cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Carousel Pagination Dots */}
        <div className="flex justify-center items-center gap-2 mt-4">
          {TESTIMONIALS_DATA.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className={`h-2 rounded-full transition-all cursor-pointer ${
                currentIndex === idx
                  ? 'w-6 bg-[#2E7D32] dark:bg-[#34D399]'
                  : 'w-2 bg-[#D5E3DB] dark:bg-[#1E3A2F]'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
