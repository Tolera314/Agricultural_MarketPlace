'use client';

import React, { useState, useEffect } from 'react';
import {
  SlidersHorizontal,
  ShieldCheck,
  Save,
  CheckCircle2,
  AlertCircle,
  DollarSign,
  AlertTriangle,
} from 'lucide-react';
import { superadminApi, SystemSettings } from '@/lib/superadminApi';

export default function SuperadminTransactionLimitsPage() {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await superadminApi.getSettings();
      setSettings(res);
    } catch (err: any) {
      setError(err?.message || 'Failed to load transaction limits.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const updated = await superadminApi.updateSettings(settings, 'Superadmin updated financial transaction limits');
      setSettings(updated);
      setSuccess('Transaction and financial risk limits saved successfully.');
    } catch (err: any) {
      setError(err?.message || 'Failed to update transaction limits.');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return (
      <div className="py-20 text-center text-gray-400 text-sm">
        Loading platform risk limits...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#142E24] dark:text-[#E6F0EB] font-display">
            Transaction & Financial Limits
          </h1>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-0.5">
            Configure financial risk thresholds, COD cash-handling limits, and mandatory approval triggers
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#059669] hover:bg-[#047857] text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50 shrink-0"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Apply Limits'}</span>
        </button>
      </div>

      {/* Notifications */}
      {success && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-xs font-semibold text-red-800 dark:text-red-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Policy Notice */}
      <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 text-xs text-blue-900 dark:text-blue-200 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold">Automated Risk Safeguard</p>
          <p className="text-[11px] text-blue-800 dark:text-blue-300 mt-0.5">
            Limits are enforced server-side. Orders exceeding the High-Value Threshold automatically pause and queue
            for Superadmin/Admin authorization before any carrier offers are broadcast.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* Card 1: Order Value Limits */}
        <div className="bg-white dark:bg-[#0A2218] border border-[#E3EAE5] dark:border-[#163D2F] rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-[#142E24] dark:text-[#E6F0EB] border-b border-gray-100 dark:border-[#163D2F] pb-3">
            Marketplace Purchase Thresholds
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
            <div>
              <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">
                Max Local Order Value (ETB)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="100"
                  required
                  value={settings.limits.localMaxOrderValue}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      limits: { ...settings.limits, localMaxOrderValue: parseFloat(e.target.value) || 0 },
                    })
                  }
                  className="w-full px-3 py-2 bg-[#F4F7F5] dark:bg-[#0E261D] rounded-xl border border-transparent focus:border-emerald-500 focus:outline-none font-bold"
                />
              </div>
              <p className="text-[10px] text-gray-500 mt-1">Single-market local purchase limit per transaction</p>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">
                Max Intercity Order Value (ETB)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="500"
                  required
                  value={settings.limits.intercityMaxOrderValue}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      limits: { ...settings.limits, intercityMaxOrderValue: parseFloat(e.target.value) || 0 },
                    })
                  }
                  className="w-full px-3 py-2 bg-[#F4F7F5] dark:bg-[#0E261D] rounded-xl border border-transparent focus:border-emerald-500 focus:outline-none font-bold"
                />
              </div>
              <p className="text-[10px] text-gray-500 mt-1">Maximum bulk cargo trade across Ethiopian regions</p>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">
                High-Value Approval Threshold (ETB)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1000"
                  required
                  value={settings.limits.adminApprovalThreshold}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      limits: { ...settings.limits, adminApprovalThreshold: parseFloat(e.target.value) || 0 },
                    })
                  }
                  className="w-full px-3 py-2 bg-[#F4F7F5] dark:bg-[#0E261D] rounded-xl border border-transparent focus:border-emerald-500 focus:outline-none font-bold text-amber-700 dark:text-amber-400"
                />
              </div>
              <p className="text-[10px] text-gray-500 mt-1">
                Any order at or above this amount requires Superadmin/Admin verification
              </p>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">
                Daily COD Cash Limit per Driver (ETB)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1000"
                  required
                  value={settings.limits.dailyCodLimitPerWorker}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      limits: { ...settings.limits, dailyCodLimitPerWorker: parseFloat(e.target.value) || 0 },
                    })
                  }
                  className="w-full px-3 py-2 bg-[#F4F7F5] dark:bg-[#0E261D] rounded-xl border border-transparent focus:border-emerald-500 focus:outline-none font-bold"
                />
              </div>
              <p className="text-[10px] text-gray-500 mt-1">
                Maximum unreconciled cash on delivery held by a worker before deposit
              </p>
            </div>
          </div>
        </div>

        {/* Card 2: Farmer Listing Quotas */}
        <div className="bg-white dark:bg-[#0A2218] border border-[#E3EAE5] dark:border-[#163D2F] rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-[#142E24] dark:text-[#E6F0EB] border-b border-gray-100 dark:border-[#163D2F] pb-3">
            Farmer Listing Governance
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
            <div>
              <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">
                Max Listings for Unverified Farmers
              </label>
              <input
                type="number"
                min="1"
                max="50"
                required
                value={settings.limits.maxListingsPerUnverifiedFarmer}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    limits: { ...settings.limits, maxListingsPerUnverifiedFarmer: parseInt(e.target.value) || 0 },
                  })
                }
                className="w-full px-3 py-2 bg-[#F4F7F5] dark:bg-[#0E261D] rounded-xl border border-transparent focus:border-emerald-500 focus:outline-none font-bold"
              />
              <p className="text-[10px] text-gray-500 mt-1">Prevents bulk catalog spam prior to Kebele verification</p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

