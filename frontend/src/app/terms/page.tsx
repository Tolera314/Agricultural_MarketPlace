'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Scale, CheckCircle2, AlertTriangle, Truck } from 'lucide-react';
import { Header, Footer } from '@/components/layout';

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#0B1512] text-[#252B26] dark:text-[#E8F7EE] flex flex-col font-sans transition-colors">
      <Header />
      <div className="h-16 sm:h-20 shrink-0" aria-hidden="true" />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 flex-1">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#075C3B] dark:text-[#34D399] hover:underline mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to AgriMarket Home</span>
        </Link>

        <div className="bg-white dark:bg-[#11221C] border border-[#DEECE2] dark:border-[#1E3A2F] rounded-3xl p-6 sm:p-10 shadow-sm space-y-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-[#075C3B] dark:text-[#34D399] text-xs font-bold mb-3">
              <Scale className="w-3.5 h-3.5" />
              <span>Platform Agreement &amp; Standards</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#11382B] dark:text-[#EDF7F1]">
              Terms of Service
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-2">
              Effective Date: October 2026 · AgriMarket Agricultural Platform
            </p>
          </div>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-[#11382B] dark:text-[#EDF7F1] flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>1. Agricultural Marketplace Participation</span>
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              AgriMarket facilitates direct connections between verified agricultural producers, commercial buyers, and independent transport couriers across Ethiopia. Users agree to provide truthful harvest details, accurate stock metrics, and transparent pricing.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-[#11382B] dark:text-[#EDF7F1] flex items-center gap-2">
              <Truck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>2. Delivery Fulfillment &amp; Inspection</span>
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              Buyers have the right to inspect perishable agricultural produce upon delivery. Cash-on-delivery and digital escrow settlements require completion of verification before final disbursement to ensure quality compliance.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-[#11382B] dark:text-[#EDF7F1] flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>3. Disciplinary Actions &amp; Zero Tolerance</span>
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              Misrepresentation of agricultural certifications, unfulfilled logistics assignments, or harassment of community members will result in immediate suspension and review by AgriMarket governance administrators.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

