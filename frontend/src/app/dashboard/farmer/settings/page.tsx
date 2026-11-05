'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Bell,
  Lock,
  Smartphone,
  Menu,
  Loader2,
  Save,
  CheckCircle2,
} from 'lucide-react';
import { farmerApi } from '@/lib/farmerApi';
import { useAuth } from '@/context/AuthContext';

export default function SettingsPage(props: any) {
  const onOpenSidebar = props?.onOpenSidebar;
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [smsOnOrder, setSmsOnOrder] = useState(true);
  const [courierAlerts, setCourierAlerts] = useState(true);
  const [marketAlerts, setMarketAlerts] = useState(true);
  const [payoutMethod, setPayoutMethod] = useState<'TELEBIRR' | 'CBE'>('TELEBIRR');
  const [payoutAccount, setPayoutAccount] = useState('');

  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);
        const res = await farmerApi.getSettings();
        const s = res.settings || res.data;
        if (s) {
          setSmsOnOrder(s.smsOnNewOrder ?? true);
          setCourierAlerts(s.courierArrivalNotice ?? true);
          setMarketAlerts(s.marketIntelligenceUpdates ?? true);
          const payout = s.defaultPayout;
          setPayoutMethod(payout?.method || 'TELEBIRR');
          setPayoutAccount(payout?.account || user?.phone || '');
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, [user]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setSaveError(null);
      setSaveSuccess(false);

      const res = await farmerApi.updateSettings({
        smsOnNewOrder: smsOnOrder,
        courierArrivalNotice: courierAlerts,
        marketIntelligenceUpdates: marketAlerts,
        defaultPayout: {
          method: payoutMethod,
          account: payoutAccount,
        },
      });

      if (res.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 4000);
      } else {
        setSaveError(res.error || 'Failed to save settings');
      }
    } catch (err: any) {
      setSaveError(err.message || 'An error occurred while saving settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#F4F6F5] dark:bg-[#0B1512]">
      {/* Header */}
      <header className="shrink-0 bg-white dark:bg-[#0D2118] border-b border-gray-100 dark:border-white/5 px-4 sm:px-6 h-16 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenSidebar}
            className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500 dark:text-gray-400 transition-colors cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-extrabold text-[#173F35] dark:text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              Farmer Settings & Alerts
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
              Manage SMS notifications, settlement preferences, and account security
            </p>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving || loading}
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-sm flex items-center gap-1.5 disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Save className="w-3.5 h-3.5" />
          )}
          <span>{saveSuccess ? 'Settings Saved!' : saving ? 'Saving...' : 'Save Preferences'}</span>
        </button>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 max-w-4xl text-xs">
        {saveError && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold">
            {saveError}
          </div>
        )}
        {saveSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold">
            Preferences successfully saved and synchronized.
          </div>
        )}

        {/* Notifications */}
        <div className="bg-white dark:bg-[#0D2118] rounded-2xl border border-gray-100 dark:border-white/5 p-6 shadow-xs space-y-4">
          <h2 className="font-extrabold text-sm text-gray-800 dark:text-white flex items-center gap-2">
            <Bell className="w-4 h-4 text-emerald-600" />
            Alerts & Notifications
          </h2>

          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-white/5 cursor-pointer hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
              <div>
                <div className="font-bold text-gray-800 dark:text-white">Instant SMS on New Produce Order</div>
                <div className="text-[11px] text-gray-400">Receive an SMS when a buyer places an order for your crops</div>
              </div>
              <input
                type="checkbox"
                checked={smsOnOrder}
                onChange={(e) => setSmsOnOrder(e.target.checked)}
                className="w-4 h-4 accent-emerald-600"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-white/5 cursor-pointer hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
              <div>
                <div className="font-bold text-gray-800 dark:text-white">Courier Arrival Notice</div>
                <div className="text-[11px] text-gray-400">Get alerted when a delivery worker is nearby for pickup</div>
              </div>
              <input
                type="checkbox"
                checked={courierAlerts}
                onChange={(e) => setCourierAlerts(e.target.checked)}
                className="w-4 h-4 accent-emerald-600"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-white/5 cursor-pointer hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
              <div>
                <div className="font-bold text-gray-800 dark:text-white">Market Price Intelligence Updates</div>
                <div className="text-[11px] text-gray-400">Daily average market prices for produce in regional trade centers</div>
              </div>
              <input
                type="checkbox"
                checked={marketAlerts}
                onChange={(e) => setMarketAlerts(e.target.checked)}
                className="w-4 h-4 accent-emerald-600"
              />
            </label>
          </div>
        </div>

        {/* Payment & Payout */}
        <div className="bg-white dark:bg-[#0D2118] rounded-2xl border border-gray-100 dark:border-white/5 p-6 shadow-xs space-y-4">
          <h2 className="font-extrabold text-sm text-gray-800 dark:text-white flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-emerald-600" />
            Default Payout Destination
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPayoutMethod('TELEBIRR')}
              className={`p-3 rounded-xl text-left border-2 transition-all ${
                payoutMethod === 'TELEBIRR'
                  ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20'
                  : 'border-gray-200 dark:border-white/10 opacity-70'
              }`}
            >
              <span className="font-bold text-emerald-900 dark:text-emerald-200">Telebirr Mobile Money</span>
              <p className="text-[11px] text-gray-500 mt-0.5">Instant mobile payout to your phone number</p>
            </button>

            <button
              type="button"
              onClick={() => setPayoutMethod('CBE')}
              className={`p-3 rounded-xl text-left border-2 transition-all ${
                payoutMethod === 'CBE'
                  ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20'
                  : 'border-gray-200 dark:border-white/10 opacity-70'
              }`}
            >
              <span className="font-bold text-gray-700 dark:text-gray-300">Commercial Bank of Ethiopia (CBE)</span>
              <p className="text-[11px] text-gray-500 mt-0.5">Direct deposit to your 13-digit CBE bank account</p>
            </button>
          </div>

          <div>
            <label className="font-bold text-gray-600 dark:text-gray-300 mb-1 block">
              {payoutMethod === 'TELEBIRR' ? 'Telebirr Phone Number' : 'CBE Account Number'}
            </label>
            <input
              type="text"
              value={payoutAccount}
              onChange={(e) => setPayoutAccount(e.target.value)}
              placeholder={payoutMethod === 'TELEBIRR' ? '+251 9...' : '1000...'}
              className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 font-semibold focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Security */}
        <div className="bg-white dark:bg-[#0D2118] rounded-2xl border border-gray-100 dark:border-white/5 p-6 shadow-xs space-y-4">
          <h2 className="font-extrabold text-sm text-gray-800 dark:text-white flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-600" />
            Account Security
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-gray-500 mb-1 block">Registered Phone</label>
              <input
                type="text"
                disabled
                value={user?.phone || 'Not configured'}
                className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-white/5 font-semibold text-gray-500 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="font-bold text-gray-500 mb-1 block">Account Status</label>
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800/40">
                Active & Verified Producer
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
