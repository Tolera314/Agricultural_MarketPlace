'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, Lock, Eye, MapPin, FileText } from 'lucide-react';
import { Header, Footer } from '@/components/layout';

export default function PrivacyPolicyPage() {
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
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Security &amp; Privacy Safeguards</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#11382B] dark:text-[#EDF7F1]">
              AgriMarket Privacy Policy
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-2">
              Last Updated: October 2026 · Effective across the Federal Democratic Republic of Ethiopia
            </p>
          </div>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-[#11382B] dark:text-[#EDF7F1] flex items-center gap-2">
              <Eye className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>1. Information We Collect</span>
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              AgriMarket collects essential profile information including your full name, phone number, email address, chosen role (Customer, Farmer, or Delivery Courier), and registered regional markets. We collect this information to facilitate transparent, direct farm-to-table transactions and delivery dispatch.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-[#11382B] dark:text-[#EDF7F1] flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>2. Location &amp; GPS Privacy</span>
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              Live location coordinates are captured exclusively with your active browser consent. For delivery couriers, coordinates are used strictly to match nearby farm pickup orders and calculate transit mileage. You maintain the right to revoke location sharing at any time from your device or dashboard profile.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-[#11382B] dark:text-[#EDF7F1] flex items-center gap-2">
              <Lock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>3. Data Protection &amp; Security</span>
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              All network communications are encrypted in transit using industry-standard TLS 1.3 cryptographic protocols. Passwords are hash-salted using Bcrypt before database persistence. Session credentials use secure HTTP-only cookies to eliminate XSS vulnerability vectors.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-[#11382B] dark:text-[#EDF7F1] flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>4. Contact our Data Governance Team</span>
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              If you have inquiries regarding your personal information, request data deletion, or require a copy of your stored records, contact our privacy compliance desk at <a href="mailto:privacy@agrimarket.et" className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline">privacy@agrimarket.et</a>.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

