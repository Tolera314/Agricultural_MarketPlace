'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Shield,
  Bell,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Save,
  RefreshCw,
  Phone,
  Mail,
  Languages,
} from 'lucide-react';
import { superadminApi, SystemSettings } from '@/lib/superadminApi';

export default function SuperadminSettingsPage() {
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
      setError(err?.message || 'Failed to load system settings.');
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
      const updated = await superadminApi.updateSettings(settings, 'Superadmin updated configuration from dashboard');
      setSettings(updated);
      setSuccess('Platform system settings saved successfully.');
    } catch (err: any) {
      setError(err?.message || 'Failed to save system settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return (
      <div className="py-20 text-center text-gray-400 text-sm">
        Loading platform configuration...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#142E24] dark:text-[#E6F0EB] font-display">
            System Settings & Policies
          </h1>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-0.5">
            Configure global marketplace behavior, verification workflows, and operational channels
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#059669] hover:bg-[#047857] text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50 shrink-0"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
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

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Platform Profile */}
        <div className="bg-white dark:bg-[#0A2218] border border-[#E3EAE5] dark:border-[#163D2F] rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-3 border-b border-gray-100 dark:border-[#163D2F] pb-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-[#0E3524] text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#142E24] dark:text-[#E6F0EB]">Platform Information</h3>
              <p className="text-[11px] text-gray-500">Branding, currency, and operational communication</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">Platform Name</label>
              <input
                type="text"
                value={settings.platform.name}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    platform: { ...settings.platform, name: e.target.value },
                  })
                }
                className="w-full px-3 py-2 bg-[#F4F7F5] dark:bg-[#0E261D] rounded-xl border border-transparent focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">Tagline</label>
              <input
                type="text"
                value={settings.platform.tagline}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    platform: { ...settings.platform, tagline: e.target.value },
                  })
                }
                className="w-full px-3 py-2 bg-[#F4F7F5] dark:bg-[#0E261D] rounded-xl border border-transparent focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">Support Hotline Phone</label>
              <input
                type="text"
                value={settings.platform.supportContact}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    platform: { ...settings.platform, supportContact: e.target.value },
                  })
                }
                className="w-full px-3 py-2 bg-[#F4F7F5] dark:bg-[#0E261D] rounded-xl border border-transparent focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">Support Email</label>
              <input
                type="email"
                value={settings.platform.supportEmail}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    platform: { ...settings.platform, supportEmail: e.target.value },
                  })
                }
                className="w-full px-3 py-2 bg-[#F4F7F5] dark:bg-[#0E261D] rounded-xl border border-transparent focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Maintenance Mode Toggle */}
          <div className="pt-2 flex items-center justify-between p-3.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40">
            <div>
              <p className="text-xs font-bold text-amber-900 dark:text-amber-200">Maintenance Mode</p>
              <p className="text-[11px] text-amber-700 dark:text-amber-300">
                When active, buyers and farmers will see a scheduled maintenance notice.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.platform.maintenanceMode}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    platform: { ...settings.platform, maintenanceMode: e.target.checked },
                  })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
          </div>
        </div>

        {/* Section 2: Account Verification Policies */}
        <div className="bg-white dark:bg-[#0A2218] border border-[#E3EAE5] dark:border-[#163D2F] rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-3 border-b border-gray-100 dark:border-[#163D2F] pb-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-[#0E3524] text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#142E24] dark:text-[#E6F0EB]">Account Verification & Compliance</h3>
              <p className="text-[11px] text-gray-500">Enforce agricultural compliance before onboarding completion</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-[#0E2E20]">
              <div>
                <p className="font-bold text-[#142E24] dark:text-[#E6F0EB]">Require Farmer Kebele & Farm Verification</p>
                <p className="text-[11px] text-gray-500">Requires administrator review before listings go live.</p>
              </div>
              <input
                type="checkbox"
                checked={settings.policies.requireFarmerVerification}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    policies: { ...settings.policies, requireFarmerVerification: e.target.checked },
                  })
                }
                className="w-4 h-4 accent-emerald-600 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-[#0E2E20]">
              <div>
                <p className="font-bold text-[#142E24] dark:text-[#E6F0EB]">Require Delivery Worker Vehicle Inspection</p>
                <p className="text-[11px] text-gray-500">Requires vehicle plate and driver license document check.</p>
              </div>
              <input
                type="checkbox"
                checked={settings.policies.requireDriverInspection}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    policies: { ...settings.policies, requireDriverInspection: e.target.checked },
                  })
                }
                className="w-4 h-4 accent-emerald-600 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Notification Channels */}
        <div className="bg-white dark:bg-[#0A2218] border border-[#E3EAE5] dark:border-[#163D2F] rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-3 border-b border-gray-100 dark:border-[#163D2F] pb-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-[#0E3524] text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#142E24] dark:text-[#E6F0EB]">Notification Gateways</h3>
              <p className="text-[11px] text-gray-500">Control active automated communication channels</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs">
            <div className="p-3.5 rounded-xl border border-[#E3EAE5] dark:border-[#163D2F] flex items-center justify-between">
              <div>
                <p className="font-bold text-[#142E24] dark:text-[#E6F0EB]">SMS Gateway</p>
                <p className="text-[10px] text-gray-500">Order & OTP SMS</p>
              </div>
              <input
                type="checkbox"
                checked={settings.notifications.smsEnabled}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    notifications: { ...settings.notifications, smsEnabled: e.target.checked },
                  })
                }
                className="w-4 h-4 accent-emerald-600 cursor-pointer"
              />
            </div>

            <div className="p-3.5 rounded-xl border border-[#E3EAE5] dark:border-[#163D2F] flex items-center justify-between">
              <div>
                <p className="font-bold text-[#142E24] dark:text-[#E6F0EB]">In-App Alerts</p>
                <p className="text-[10px] text-gray-500">Real-time push alerts</p>
              </div>
              <input
                type="checkbox"
                checked={settings.notifications.inAppEnabled}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    notifications: { ...settings.notifications, inAppEnabled: e.target.checked },
                  })
                }
                className="w-4 h-4 accent-emerald-600 cursor-pointer"
              />
            </div>

            <div className="p-3.5 rounded-xl border border-[#E3EAE5] dark:border-[#163D2F] flex items-center justify-between">
              <div>
                <p className="font-bold text-[#142E24] dark:text-[#E6F0EB]">Email Dispatch</p>
                <p className="text-[10px] text-gray-500">Invoices & receipts</p>
              </div>
              <input
                type="checkbox"
                checked={settings.notifications.emailEnabled}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    notifications: { ...settings.notifications, emailEnabled: e.target.checked },
                  })
                }
                className="w-4 h-4 accent-emerald-600 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

