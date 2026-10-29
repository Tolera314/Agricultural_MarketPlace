'use client';

import React from 'react';
import Link from 'next/link';
import { Mail, Phone, MapPin, ArrowUpRight } from 'lucide-react';

interface FooterProps {
  onScrollTo?: (sectionId: string) => void;
}

export const Footer: React.FC<FooterProps> = ({
  onScrollTo,
}) => {
  const handleScroll = (sectionId: string) => {
    if (onScrollTo) {
      onScrollTo(sectionId);
    } else if (typeof window !== 'undefined') {
      window.location.href = `/#${sectionId}`;
    }
  };
  return (
    <footer className="bg-white dark:bg-[#070F0C] border-t border-[#E8EFEA] dark:border-[#1E3A2F] pt-14 pb-10 text-[#4A675B] dark:text-[#8CAFA0] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-10 pb-10 border-b border-[#EDF3EF] dark:border-[#1A3329]">
          {/* Col 1: Brand & Subtitle (spans 2 columns on lg) */}
          <div className="lg:col-span-2 space-y-3.5">
            <div className="flex items-center gap-2.5">
              {/* Three Leaf Emblem */}
              <div className="w-8 h-8 rounded-lg bg-[#E8F5E9] dark:bg-[#18352A] flex items-center justify-center text-[#2E7D32] dark:text-[#34D399]">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 0 0 8 20C19 20 22 3 22 3c-1 2-8 2-8 2s-3-2-7 0a6.56 6.56 0 0 0-4 4c5 0 8 3 8 3s-3.5 1-6 2c2 1 4 1 6 0 2-1 4-2 6-6Z" />
                </svg>
              </div>
              <span className="text-xl font-extrabold tracking-tight text-[#11382B] dark:text-[#E6F4ED]">
                AgriMarket
              </span>
            </div>
            <p className="text-xs text-[#2E7D32] dark:text-[#34D399] font-bold tracking-wide uppercase">
              Farmers • Buyers • Better Tomorrow
            </p>
            <p className="text-xs text-[#527063] dark:text-[#88A89A] max-w-sm leading-relaxed pt-1">
              Ethiopia's trusted agricultural marketplace connecting farmers directly with households, retailers, and restaurants with transparent prices and verified logistics.
            </p>
          </div>

          {/* Col 2: Quick Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#11382B] dark:text-[#E6F4ED] mb-4">
              Quick Links
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <button
                  onClick={() => handleScroll('hero')}
                  className="hover:text-[#2E7D32] dark:hover:text-[#34D399] transition-colors cursor-pointer"
                >
                  Home
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleScroll('categories')}
                  className="hover:text-[#2E7D32] dark:hover:text-[#34D399] transition-colors cursor-pointer"
                >
                  Categories
                </button>
              </li>
              <li>
                <Link
                  href="/products"
                  className="hover:text-[#2E7D32] dark:hover:text-[#34D399] transition-colors cursor-pointer"
                >
                  Products
                </Link>
              </li>
              <li>
                <Link
                  href="/farmers"
                  className="hover:text-[#2E7D32] dark:hover:text-[#34D399] transition-colors cursor-pointer"
                >
                  Farmers
                </Link>
              </li>
              <li>
                <button
                  onClick={() => handleScroll('intercity-trade')}
                  className="hover:text-[#2E7D32] dark:hover:text-[#34D399] transition-colors cursor-pointer"
                >
                  Intercity Trade
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleScroll('how-it-works')}
                  className="hover:text-[#2E7D32] dark:hover:text-[#34D399] transition-colors cursor-pointer"
                >
                  How It Works
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: For Users */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#11382B] dark:text-[#E6F4ED] mb-4">
              For Users
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link
                  href="/signup"
                  className="font-semibold text-[#2E7D32] dark:text-[#34D399] hover:underline transition-colors flex items-center gap-1"
                >
                  <span>Create Account</span>
                  <ArrowUpRight className="w-3 h-3" />
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/farmer"
                  className="hover:text-[#2E7D32] dark:hover:text-[#34D399] transition-colors"
                >
                  Farmer Portal
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/worker"
                  className="hover:text-[#2E7D32] dark:hover:text-[#34D399] transition-colors"
                >
                  Delivery Worker
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/buyer"
                  className="hover:text-[#2E7D32] dark:hover:text-[#34D399] transition-colors"
                >
                  Buyer Dashboard
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/admin"
                  className="hover:text-[#2E7D32] dark:hover:text-[#34D399] transition-colors"
                >
                  Admin Portal
                </Link>
              </li>
              <li>
                <button
                  onClick={() => handleScroll('how-it-works')}
                  className="hover:text-[#2E7D32] dark:hover:text-[#34D399] transition-colors cursor-pointer"
                >
                  How It Works
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleScroll('testimonials')}
                  className="hover:text-[#2E7D32] dark:hover:text-[#34D399] transition-colors cursor-pointer"
                >
                  Community Stories
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleScroll('about')}
                  className="hover:text-[#2E7D32] dark:hover:text-[#34D399] transition-colors cursor-pointer"
                >
                  Impact Metrics
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Contact Us & Socials */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#11382B] dark:text-[#E6F4ED] mb-4">
              Contact Us
            </h4>
            <ul className="space-y-3 text-xs text-[#527063] dark:text-[#88A89A]">
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#2E7D32] dark:text-[#34D399] shrink-0" />
                <a href="mailto:support@agrimarket.et" className="hover:text-[#2E7D32] dark:hover:text-[#34D399] transition-colors">
                  support@agrimarket.et
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#2E7D32] dark:text-[#34D399] shrink-0" />
                <a href="tel:+251911234567" className="hover:text-[#2E7D32] dark:hover:text-[#34D399] transition-colors">
                  +251 911 234 567
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-[#2E7D32] dark:text-[#34D399] shrink-0" />
                <span>Addis Ababa, Ethiopia</span>
              </li>
            </ul>

            {/* Social Icons */}
            <div className="flex items-center gap-2.5 mt-5 text-[#3E5C50] dark:text-[#8BB39F]">
              <a
                href="#facebook"
                aria-label="Facebook"
                className="w-8 h-8 rounded-lg bg-[#F0F5F2] dark:bg-[#152B22] hover:bg-[#E8F5E9] dark:hover:bg-[#1E3E31] hover:text-[#2E7D32] dark:hover:text-[#34D399] flex items-center justify-center transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95C18.05 21.45 22 17.19 22 12z" />
                </svg>
              </a>

              <a
                href="#twitter"
                aria-label="X"
                className="w-8 h-8 rounded-lg bg-[#F0F5F2] dark:bg-[#152B22] hover:bg-[#E8F5E9] dark:hover:bg-[#1E3E31] hover:text-[#2E7D32] dark:hover:text-[#34D399] flex items-center justify-center transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>

              <a
                href="#linkedin"
                aria-label="LinkedIn"
                className="w-8 h-8 rounded-lg bg-[#F0F5F2] dark:bg-[#152B22] hover:bg-[#E8F5E9] dark:hover:bg-[#1E3E31] hover:text-[#2E7D32] dark:hover:text-[#34D399] flex items-center justify-center transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.45 1.45 0 0 0 1.45-1.45 1.45 1.45 0 0 0-1.45-1.45 1.45 1.45 0 0 0-1.45 1.45 1.45 1.45 0 0 0 1.45 1.45m1.37 9.74v-8.37H5.09v8.37z" />
                </svg>
              </a>

              <a
                href="#youtube"
                aria-label="YouTube"
                className="w-8 h-8 rounded-lg bg-[#F0F5F2] dark:bg-[#152B22] hover:bg-[#E8F5E9] dark:hover:bg-[#1E3E31] hover:text-[#2E7D32] dark:hover:text-[#34D399] flex items-center justify-center transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M10 15l5.19-3L10 9v6m11.56-7.83c.13.47.22 1.1.28 1.9.07.8.1 1.49.1 2.09L22 12c0 2.19-.16 3.8-.44 4.83-.25.9-.83 1.48-1.73 1.73-.47.13-1.33.22-2.65.28-1.3.07-2.49.1-3.59.1L12 20c-4.19 0-6.8-.16-7.83-.44-.9-.25-1.48-.83-1.73-1.73-.13-.47-.22-1.1-.28-1.9-.07-.8-.1-1.49-.1-2.09L2 12c0-2.19.16-3.8.44-4.83.25-.9.83-1.48 1.73-1.73.47-.13 1.33-.22 2.65-.28 1.3-.07 2.49-.1 3.59-.1L12 4c4.19 0 6.8.16 7.83.44.9.25 1.48.83 1.73 1.73z" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Copyright & Legal Links */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-[#7A988B] dark:text-[#688879] gap-3">
          <p>© 2026 AgriMarket. All rights reserved.</p>
          <div className="flex items-center gap-5">
            <button
              onClick={() => handleScroll('hero')}
              className="hover:text-[#2E7D32] dark:hover:text-[#34D399] transition-colors cursor-pointer"
            >
              Privacy Policy
            </button>
            <button
              onClick={() => handleScroll('hero')}
              className="hover:text-[#2E7D32] dark:hover:text-[#34D399] transition-colors cursor-pointer"
            >
              Terms of Service
            </button>
            <button
              onClick={() => handleScroll('hero')}
              className="hover:text-[#2E7D32] dark:hover:text-[#34D399] transition-colors cursor-pointer"
            >
              Support Center
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
