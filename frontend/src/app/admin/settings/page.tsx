'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Settings,
  Shield,
  Save,
  CheckCircle2,
  RefreshCw,
  Percent,
  Truck,
  Building,
} from 'lucide-react';
import { adminApi } from '@/lib/adminApi';

export default function AdminSettingsPage() {
  const [data, setData] = useState<{ pricingRules: any[]; platform: any }>({
    pricingRules: [],
    platform: {},
  });
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getSettings();
      setData(res || { pricingRules: [], platform: {} });
    } catch (err: any) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUpdateRule = async (ruleId: string, currentValue: number, isActive: boolean) => {
    const rawVal = prompt('Enter new pricing rule rate / amount:', currentValue.toString());
    if (rawVal === null) return;
    const num = parseFloat(rawVal);
    if (isNaN(num)) {
      alert('Please enter a valid numeric rate.');
      return;
    }

    setUpdatingId(ruleId);
    try {
      await adminApi.updatePricingRule(ruleId, num, isActive);
      setData((prev) => ({
        ...prev,
        pricingRules: prev.pricingRules.map((r) =>
          r.id === ruleId ? { ...r, value: num } : r
        ),
      }));
      setActionMessage('Platform fee pricing policy successfully updated.');
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err: any) {
      alert(err?.message || 'Failed to update rule.');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#142E24] dark:text-[#E6F0EB] font-display">
            Platform Settings & Governance Rules
          </h1>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-0.5">
            Configure authorized commissions, delivery policies, and operational safeguards.
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

      {actionMessage && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-300 rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* SECTION 1: Platform Pricing Rules */}
      <div className="bg-white dark:bg-[#0A2218] border border-[#E3EAE5] dark:border-[#163D2F] rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-[#142E24] dark:text-[#E6F0EB] font-display flex items-center gap-2">
          <Percent className="w-4 h-4 text-emerald-600" />
          <span>Commission & Logistics Fee Rules</span>
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Platform fees are applied strictly at checkout computation. Farmer product prices are never overridden.
        </p>

        <div className="divide-y divide-gray-100 dark:divide-[#143427]">
          {data.pricingRules.map((r) => (
            <div key={r.id} className="py-4 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
              <div>
                <p className="font-bold text-sm text-gray-800 dark:text-gray-200">{r.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{r.description}</p>
                <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                  {r.scope} Scope
                </span>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-base font-bold text-emerald-700 dark:text-emerald-400">
                  {r.type.includes('PERCENTAGE') ? `${r.value}%` : `ETB ${r.value}`}
                </span>

                <button
                  disabled={updatingId === r.id}
                  onClick={() => handleUpdateRule(r.id, r.value, r.isActive)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-gray-200 dark:border-[#163D2F] hover:border-emerald-500 transition-colors"
                >
                  Edit Rate
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 2: Platform Identity Metadata */}
      <div className="bg-white dark:bg-[#0A2218] border border-[#E3EAE5] dark:border-[#163D2F] rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-[#142E24] dark:text-[#E6F0EB] font-display flex items-center gap-2">
          <Building className="w-4 h-4 text-emerald-600" />
          <span>Platform General Information</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-gray-50 dark:bg-[#0C2A1E]/30 rounded-xl border border-gray-100 dark:border-[#143427]">
            <p className="text-gray-400 font-medium">Platform Name</p>
            <p className="font-bold text-gray-800 dark:text-gray-200 text-sm mt-0.5">
              {data.platform?.name || 'AgriMarket Ethiopia'}
            </p>
          </div>

          <div className="p-4 bg-gray-50 dark:bg-[#0C2A1E]/30 rounded-xl border border-gray-100 dark:border-[#143427]">
            <p className="text-gray-400 font-medium">Marketplace Tagline</p>
            <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm mt-0.5">
              {data.platform?.tagline || 'Farmers - Buyers - Better Tomorrow'}
            </p>
          </div>

          <div className="p-4 bg-gray-50 dark:bg-[#0C2A1E]/30 rounded-xl border border-gray-100 dark:border-[#143427]">
            <p className="text-gray-400 font-medium">Supported Languages</p>
            <p className="font-medium text-gray-800 dark:text-gray-200 mt-0.5">
              English, Amharic (አማርኛ), Oromiffa (Afaan Oromoo)
            </p>
          </div>

          <div className="p-4 bg-gray-50 dark:bg-[#0C2A1E]/30 rounded-xl border border-gray-100 dark:border-[#143427]">
            <p className="text-gray-400 font-medium">Operational Support Contact</p>
            <p className="font-medium text-gray-800 dark:text-gray-200 mt-0.5">
              {data.platform?.supportContact || '+251 911 22 33 44'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
