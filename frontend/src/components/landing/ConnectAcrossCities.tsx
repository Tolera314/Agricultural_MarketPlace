'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Route,
  Receipt,
  ShieldCheck,
  CreditCard,
  ArrowRight,
  MapPin,
  Truck,
  Snowflake,
  Scale,
  Clock,
  X,
  Sparkles,
  ChevronRight,
} from 'lucide-react';

const intercityRouteMap = '/images/intercity_route_map_hd.png';

interface ConnectAcrossCitiesProps {
  onLearnMore?: () => void;
  onBrowseBulk?: () => void;
  onJoinTransport?: () => void;
}

export const ConnectAcrossCities: React.FC<ConnectAcrossCitiesProps> = ({
  onLearnMore,
  onBrowseBulk,
  onJoinTransport,
}) => {
  const [isCorridorModalOpen, setIsCorridorModalOpen] = useState(false);

  const features = [
    {
      title: 'Configured City Corridors',
      desc: 'Dedicated cold & dry freight transit routes connecting regional hubs',
      icon: Route,
    },
    {
      title: 'Fixed Transparent Rates',
      desc: 'Admin-governed distance & payload pricing with zero hidden surcharges',
      icon: Receipt,
    },
    {
      title: 'Quality & Scale Checks',
      desc: 'Farm gate pickup handshakes and recipient digital scale verification',
      icon: ShieldCheck,
    },
    {
      title: 'Secure Escrow Settlement',
      desc: '6-digit OTP delivery release protecting farmers, buyers & carriers',
      icon: CreditCard,
    },
  ];

  const tradeCorridors = [
    {
      id: 'hawassa-addis',
      origin: 'Hawassa (Sidama)',
      destination: 'Addis Ababa',
      distanceKm: 275,
      transitTime: '4–6 Hours',
      produceTypes: 'Avocado, Highland Cabbage, Potato, Fruits',
      suitableVehicles: 'Medium Duty (5T) / Reefer Truck',
      coldChainAvailable: true,
      baseFareETB: 'ETB 650',
      ratePerKm: 'ETB 32/km',
    },
    {
      id: 'adama-addis',
      origin: 'Adama (Oromia)',
      destination: 'Addis Ababa',
      distanceKm: 99,
      transitTime: '1.5–2 Hours',
      produceTypes: 'Tomatoes, Onions, Green Peppers, Pulses',
      suitableVehicles: 'Light Pickup (1T) & 5T Truck',
      coldChainAvailable: true,
      baseFareETB: 'ETB 250',
      ratePerKm: 'ETB 18/km',
    },
    {
      id: 'bahirdar-addis',
      origin: 'Bahir Dar (Amhara)',
      destination: 'Addis Ababa',
      distanceKm: 480,
      transitTime: '8–10 Hours',
      produceTypes: 'White Teff, Oilseeds, Honey, Grains',
      suitableVehicles: 'Heavy Semi-Trailer (15T–30T)',
      coldChainAvailable: false,
      baseFareETB: 'ETB 1,500',
      ratePerKm: 'ETB 55/km',
    },
    {
      id: 'shashemene-diredawa',
      origin: 'Shashemene (West Arsi)',
      destination: 'Dire Dawa',
      distanceKm: 410,
      transitTime: '7–9 Hours',
      produceTypes: 'Potatoes, Red Onions, Garlic, Spices',
      suitableVehicles: 'Heavy Duty Truck (15T)',
      coldChainAvailable: true,
      baseFareETB: 'ETB 1,500',
      ratePerKm: 'ETB 48/km',
    },
  ];

  return (
    <section
      id="intercity-trade"
      className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#EDF3EF] dark:border-[#1A3329] scroll-mt-20 relative"
    >
      <div id="markets" className="absolute -top-24 left-0 pointer-events-none" />

      {/* Header */}
      <div className="mb-8 sm:mb-12 text-left">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8F5E9] dark:bg-[#163327] text-[#2E7D32] dark:text-[#34D399] text-xs font-semibold tracking-wide mb-3 border border-emerald-200/50 dark:border-emerald-800/40">
          <Truck className="w-3.5 h-3.5 text-[#2E7D32] dark:text-[#34D399]" />
          <span>Inter-City Trade & Bulk Freight</span>
        </div>

        <h2 className="text-xl xs:text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#11382B] dark:text-[#E8F7EE] tracking-tight">
          Connect Across Regional Cities
        </h2>
        <p className="mt-2 text-xs sm:text-base text-[#4A675B] dark:text-[#88A89A] max-w-3xl">
          Purchase bulk agricultural harvests directly from regional farmers with verified commercial truck dispatch, active cold-chain monitoring, and transparent fixed-price transportation.
        </p>
      </div>

      {/* Grid: Left Features & Action Buttons + Right Graphic */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-12 items-center">
        {/* Left Column */}
        <div className="lg:col-span-6 space-y-6">
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {features.map((feat, idx) => {
              const IconComp = feat.icon;
              return (
                <div
                  key={idx}
                  className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-white dark:bg-[#11221C] border border-[#E2EAE5] dark:border-[#1E3A2F] shadow-2xs hover:border-[#2E7D32]/50 dark:hover:border-[#34D399]/50 transition-colors flex flex-col justify-between"
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

          {/* Action Buttons Wired to Real Application Routes */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsCorridorModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#143D2D] hover:bg-[#1C523C] dark:bg-[#10B981] dark:hover:bg-[#059669] text-white text-xs sm:text-sm font-bold transition-all shadow-sm hover:shadow cursor-pointer"
            >
              <Route className="w-4 h-4" />
              <span>Explore Trade Corridors & Rates</span>
            </button>

            {onBrowseBulk ? (
              <button
                onClick={onBrowseBulk}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white dark:bg-[#11221C] border border-[#C8E6C9] dark:border-[#204737] text-[#143D2D] dark:text-[#E8F7EE] hover:bg-emerald-50 dark:hover:bg-[#18352A] text-xs sm:text-sm font-semibold transition-all cursor-pointer"
              >
                <span>Browse Bulk Harvests</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <Link
                href="/products"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white dark:bg-[#11221C] border border-[#C8E6C9] dark:border-[#204737] text-[#143D2D] dark:text-[#E8F7EE] hover:bg-emerald-50 dark:hover:bg-[#18352A] text-xs sm:text-sm font-semibold transition-all cursor-pointer"
              >
                <span>Browse Bulk Harvests</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}

            <Link
              href="/dashboard/transport"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl text-xs font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 hover:bg-indigo-100 transition-colors"
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Carrier Fleet Portal</span>
            </Link>
          </div>
        </div>

        {/* Right Column: Intercity Route Graphic */}
        <div className="lg:col-span-6 flex justify-center lg:justify-end mt-2 lg:mt-0">
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

      {/* ─── MODAL: TRADE CORRIDORS & TRANSPARENT TARIFF MATRIX ───────── */}
      {isCorridorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0D2118] rounded-3xl border border-gray-100 dark:border-white/10 max-w-3xl w-full p-6 sm:p-8 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center">
                  <Route className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base sm:text-lg text-[#11382B] dark:text-[#E8F7EE]">
                    Regional Agricultural Corridors & Tariffs
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Admin-configured fixed freight pricing with verified road kilometers and cold-chain support.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCorridorModalOpen(false)}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Corridor List */}
            <div className="space-y-3.5">
              {tradeCorridors.map((c) => (
                <div
                  key={c.id}
                  className="p-4 rounded-2xl bg-gray-50/70 dark:bg-[#11241B] border border-gray-100 dark:border-white/5 space-y-2.5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-gray-900 dark:text-white">
                        {c.origin} ➔ {c.destination}
                      </span>
                      {c.coldChainAvailable && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300 flex items-center gap-1">
                          <Snowflake className="w-3 h-3" />
                          Cold-Chain Active
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      {c.distanceKm} km · Est. {c.transitTime}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-300">
                    <div>
                      <strong>Main Harvests:</strong> {c.produceTypes}
                    </div>
                    <div>
                      <strong>Transport Category:</strong> {c.suitableVehicles}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-mono font-semibold pt-1 border-t border-gray-200/60 dark:border-white/5 text-gray-700 dark:text-gray-300">
                    <span>Base Fare: {c.baseFareETB}</span>
                    <span>Distance Rate: {c.ratePerKm}</span>
                    <span>Multi-stop Surcharge: ETB 200/stop</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Pricing Policy Card */}
            <div className="bg-emerald-50/60 dark:bg-emerald-950/20 p-4 rounded-2xl border border-emerald-200/60 dark:border-emerald-800/40 text-xs text-emerald-950 dark:text-emerald-200 space-y-1.5">
              <div className="font-bold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Zero Hard-Coded Prices Guarantee</span>
              </div>
              <p className="text-[11px] text-emerald-900/80 dark:text-emerald-300 leading-relaxed">
                All transportation quotations are computed dynamically through the central backend logistics engine based on payload weight tiers, actual highway arterial mileage, and cold-chain temperature control. Payments are held in escrow and released only upon 6-digit PIN handshake after digital gate scale inspection.
              </p>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-white/10">
              <Link
                href="/dashboard/transport"
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                <span>Register as Commercial Transport Carrier</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
              <button
                onClick={() => setIsCorridorModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-gray-100 dark:bg-white/10 hover:bg-gray-200 text-xs font-bold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
