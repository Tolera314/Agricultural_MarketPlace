'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  MapPin,
  Building2,
  RefreshCw,
  Compass,
  CheckCircle2,
  Globe2,
} from 'lucide-react';
import { adminApi } from '@/lib/adminApi';

export default function AdminMarketsPage() {
  const [data, setData] = useState<{ cities: any[]; markets: any[] }>({ cities: [], markets: [] });
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getMarketsAndCities();
      setData(res || { cities: [], markets: [] });
    } catch (err: any) {
      console.error('Failed to load markets:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#142E24] dark:text-[#E6F0EB] font-display">
            Markets & Geographic Regions
          </h1>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-0.5">
            Geographic coverage, regional produce hubs, and municipal delivery zones across Ethiopia.
          </p>
        </div>

        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#0A2218] border border-[#E3EAE5] dark:border-[#163D2F] rounded-xl text-xs font-semibold text-[#142E24] dark:text-[#E2EAE5] hover:border-[#10B981] transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Grid of Ethiopian Cities */}
      <div>
        <h2 className="text-base font-bold text-[#142E24] dark:text-[#E6F0EB] mb-3 font-display flex items-center gap-2">
          <Building2 className="w-4 h-4 text-emerald-600" />
          <span>Municipalities & Service Cities</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.cities.map((city) => (
            <div
              key={city.id}
              className="p-5 bg-white dark:bg-[#0A2218] border border-[#E3EAE5] dark:border-[#163D2F] rounded-2xl shadow-xs space-y-2 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-base text-[#142E24] dark:text-[#E6F0EB]">
                  {city.name}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                  {city.regionName}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-gray-400" />
                <span>
                  {city.coordinates.latitude.toFixed(4)}° N, {city.coordinates.longitude.toFixed(4)}° E
                </span>
              </p>
              <div className="text-xs font-medium text-emerald-700 dark:text-emerald-400 pt-2 border-t border-gray-100 dark:border-[#163D2F]">
                {city.marketsCount} Operating Agricultural Markets
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Regional Markets Table */}
      <div className="bg-white dark:bg-[#0A2218] border border-[#E3EAE5] dark:border-[#163D2F] rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-[#142E24] dark:text-[#E6F0EB] font-display flex items-center gap-2">
          <MapPin className="w-4 h-4 text-emerald-600" />
          <span>Local Agricultural Markets & Hubs</span>
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/75 dark:bg-[#0C2A1E]/60 text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider border-b border-[#E3EAE5] dark:border-[#163D2F]">
              <tr>
                <th className="px-4 py-3">Market Center Name</th>
                <th className="px-4 py-3">City / Municipality</th>
                <th className="px-4 py-3">GPS Coordinates</th>
                <th className="px-4 py-3">Delivery Service Radius</th>
                <th className="px-4 py-3 text-right">Operating Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-[#143427]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    Loading regional markets...
                  </td>
                </tr>
              ) : data.markets.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    No markets initialized.
                  </td>
                </tr>
              ) : (
                data.markets.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50/50 dark:hover:bg-[#0E2F22]/30 transition-colors">
                    <td className="px-4 py-3 font-bold text-gray-800 dark:text-gray-200">
                      {m.name}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">
                      {m.cityName}
                    </td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-[11px]">
                      {m.coordinates.latitude.toFixed(4)}, {m.coordinates.longitude.toFixed(4)}
                    </td>
                    <td className="px-4 py-3 font-semibold text-emerald-600 dark:text-emerald-400">
                      {m.serviceRadiusKm} km coverage
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                        Active Hub
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
